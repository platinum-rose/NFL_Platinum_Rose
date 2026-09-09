#!/usr/bin/env node
// Reconcile every dated manual futures import with Supabase. The operation is
// idempotent, preserves each historical snapshot, and writes an audit manifest.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];
const DIR = 'data/futures-imports';
const MANIFEST_PATH = path.join(DIR, 'import-manifest-2026.json');
const FILE_RE = /^(betonline|betus|bookmaker)-\d{4}-\d{2}-\d{2}\.json$/;
const DRY_RUN = process.argv.includes('--dry-run');
const WRITE_MANIFEST = !process.argv.includes('--no-manifest');

function loadEnv(p = '.env') {
  const env = { ...process.env };
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key] ??= rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normDivision(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, '_');
}

function normConference(value) {
  return String(value).trim().toLowerCase();
}

function normalizeRow(source, file) {
  let marketType = source.market_type;
  let team = source.team;
  let odds = source.odds;
  if (marketType === 'conference' && source.conference) marketType = `conference_${normConference(source.conference)}`;
  else if (marketType === 'division' && source.division) marketType = `division_${normDivision(source.division)}`;
  if (marketType === 'playoffs' && odds == null && source.yes_price != null) odds = source.yes_price;
  if (marketType === 'wins' && odds == null && source.over_price != null) odds = source.over_price;
  if (team == null && source.selection != null) team = source.selection;

  if (!marketType) return { anomaly: `${file}: row has no market_type` };
  if (!team) return { anomaly: `${file}: ${marketType} row has no team/selection` };
  if (odds == null) return { anomaly: `${file}: ${marketType}/${team} row has no usable odds` };

  const row = Object.fromEntries(KEYS.map((key) => [key, source[key] ?? null]));
  row.market_type = marketType;
  row.team = team;
  row.odds = odds;
  row.price = source.price ?? odds;
  return { row };
}

function loadFile(file) {
  const absolute = path.join(DIR, file);
  const rawText = fs.readFileSync(absolute, 'utf8');
  const payload = JSON.parse(rawText);
  const records = Array.isArray(payload) ? payload : (payload.records || []);
  const rows = [];
  const anomalies = [];
  for (const source of records) {
    const result = normalizeRow(source, file);
    if (result.row) rows.push(result.row);
    if (result.anomaly) anomalies.push(result.anomaly);
  }
  const books = [...new Set(rows.map((row) => row.book))];
  const snapshots = [...new Set(rows.map((row) => row.snapshot_time))];
  const seasons = [...new Set(rows.map((row) => row.season))];
  if (books.length !== 1 || snapshots.length !== 1 || seasons.length !== 1) {
    anomalies.push(`${file}: expected one book/snapshot_time/season, got ${books.length}/${snapshots.length}/${seasons.length}`);
  }
  const markets = {};
  for (const row of rows) markets[row.market_type] = (markets[row.market_type] || 0) + 1;
  const semanticRows = rows.map(({ snapshot_time: _snapshot, captured_at: _captured, ...row }) => stable(row));
  semanticRows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {
    file,
    rows,
    anomalies,
    book: books[0] || null,
    snapshot_time: snapshots[0] || null,
    season: seasons[0] || null,
    row_count: rows.length,
    markets,
    sha256: sha256(rawText),
    semantic_sha256: sha256(JSON.stringify(semanticRows)),
  };
}

function restHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function databaseCount(env, entry) {
  const params = new URLSearchParams({
    select: 'market_type',
    season: `eq.${entry.season}`,
    book: `eq.${entry.book}`,
    snapshot_time: `eq.${entry.snapshot_time}`,
  });
  const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/futures_odds_snapshots?${params}`;
  const response = await fetch(url, {
    headers: restHeaders(env, { Prefer: 'count=exact', Range: '0-0' }),
  });
  if (!response.ok) throw new Error(`count failed for ${entry.file}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  const range = response.headers.get('content-range') || '';
  const match = range.match(/\/(\d+)$/);
  if (!match) throw new Error(`count failed for ${entry.file}: missing content-range (${range})`);
  return Number(match[1]);
}

async function upsertRows(env, rows) {
  const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time`;
  const chunkSize = 500;
  let written = 0;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const response = await fetch(url, {
      method: 'POST',
      headers: restHeaders(env, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(chunk),
    });
    if (!response.ok) throw new Error(`upsert failed at ${index}: HTTP ${response.status} ${(await response.text()).slice(0, 600)}`);
    written += chunk.length;
    console.log(`  upserted ${written}/${rows.length}`);
  }
}

function markDuplicates(entries) {
  const firstBySemanticIdentity = new Map();
  for (const entry of entries) {
    const key = `${entry.book}|${entry.semantic_sha256}`;
    const first = firstBySemanticIdentity.get(key);
    if (first) entry.duplicate_of = first.file;
    else firstBySemanticIdentity.set(key, entry);
  }
}

function statusFor(entry) {
  if (entry.duplicate_of) return 'invalid_duplicate';
  if (entry.database_row_count === entry.row_count) return 'persisted';
  if (entry.database_row_count > 0) return 'partial';
  return 'missing';
}

function writeManifest(entries, mode) {
  const totals = {
    files: entries.length,
    valid_files: entries.filter((entry) => !entry.duplicate_of).length,
    invalid_duplicate_files: entries.filter((entry) => entry.duplicate_of).length,
    valid_rows: entries.filter((entry) => !entry.duplicate_of).reduce((sum, entry) => sum + entry.row_count, 0),
    persisted_valid_files: entries.filter((entry) => !entry.duplicate_of && entry.status === 'persisted').length,
  };
  const manifest = {
    generated_at: new Date().toISOString(),
    season: 2026,
    mode,
    source_directory: DIR,
    identity_key: ['market_type', 'team', 'book', 'snapshot_time'],
    duplicate_policy: 'Same book plus identical normalized content after removing capture timestamps: retain earliest file; mark later file invalid_duplicate and do not persist it.',
    totals,
    files: entries.map(({ rows: _rows, anomalies, ...entry }) => ({ ...entry, anomalies })),
  };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

async function main() {
  const env = loadEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const files = fs.readdirSync(DIR).filter((file) => FILE_RE.test(file)).sort();
  const entries = files.map(loadFile);
  markDuplicates(entries);

  const anomalies = entries.flatMap((entry) => entry.anomalies);
  if (anomalies.length) throw new Error(`Import anomalies:\n${anomalies.map((item) => `  ${item}`).join('\n')}`);

  for (const entry of entries) {
    entry.database_row_count = await databaseCount(env, entry);
    entry.status = statusFor(entry);
    const duplicate = entry.duplicate_of ? ` INVALID duplicate of ${entry.duplicate_of}` : '';
    console.log(`${entry.file}: local=${entry.row_count} db=${entry.database_row_count} ${entry.status}${duplicate}`);
  }

  if (!DRY_RUN) {
    const validRows = entries.filter((entry) => !entry.duplicate_of).flatMap((entry) => entry.rows);
    console.log(`Upserting ${validRows.length} valid historical rows (idempotent)...`);
    await upsertRows(env, validRows);
    for (const entry of entries) {
      entry.database_row_count = await databaseCount(env, entry);
      entry.status = statusFor(entry);
    }
  } else {
    console.log('[dry-run] no database write performed.');
  }

  if (WRITE_MANIFEST) writeManifest(entries, DRY_RUN ? 'dry-run' : 'applied');
  const incomplete = entries.filter((entry) => !entry.duplicate_of && entry.status !== 'persisted');
  if (incomplete.length) {
    console.error(`Reconciliation incomplete: ${incomplete.map((entry) => `${entry.file}=${entry.status}`).join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Reconciliation complete: ${entries.length - 1}/${entries.length} valid files persisted; 1 invalid duplicate excluded.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
