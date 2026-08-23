#!/usr/bin/env node
// scripts/backfill-futures-imports.js
//
// One-time (repeatable/idempotent) backfill: loads every manually-gathered
// futures-odds batch file in data/futures-imports/{betonline,betus,bookmaker}-*.json
// into public.futures_odds_snapshots. These files were built by
// scripts/build-betonline-*-import.js (and hand-equivalents for BKR/BTU) but
// were NEVER actually loaded into Supabase — the only rows in
// futures_odds_snapshots before this backfill are an automated superbowl-only
// daily feed (agents/futures-odds-ingest.js) across betmgm/betonline/
// draftkings/fanduel. bookmaker and betus have zero rows, and no market_type
// other than 'superbowl' has ever been written, for any book.
//
// Two format variants exist in data/futures-imports/:
//   - flat array of row objects (18 of 19 files) — used as-is.
//   - wrapped { snapshot_time, captured_at, season, book, records: [...] }
//     (currently only betonline-2026-08-22.json) — records[] extracted.
//
// One file (betonline-2026-08-22.json) also uses market_type names that
// don't match what agents/futures-intel-report-v2.js's CATEGORIES array
// expects. That file's rows carry an extra field the 18 conforming files
// don't need:
//   market_type 'conference' + row.conference ('AFC'|'NFC')
//     -> market_type 'conference_afc' | 'conference_nfc'
//   market_type 'division' + row.division ('AFC East', ...)
//     -> market_type 'division_afc_east' | ... (lowercased, spaces -> _)
//   market_type 'playoffs' rows in this file use yes_price/no_price instead
//     of odds/price (every other file's playoffs rows use odds/price
//     directly, matching the futures_odds_snapshots schema) -> odds = yes_price
//     (no_price is not stored anywhere in the schema in ANY file — the
//     report computes an estimated "No" column itself from implied
//     probability, it never reads a stored no-side price)
//   market_type 'exacta' rows use `selection` instead of `team` (there's no
//     `team` column value for a two-team exacta pick) -> team = selection.
//     NOT one of the 8 categories agents/futures-intel-report-v2.js renders
//     today (a "seeding exacta" market — 1st/2nd seed in a conference — is
//     a different bet type than Super Bowl Exact Matchup). Loaded as-is
//     under market_type 'exacta' so the real data isn't lost; it will just
//     sit inert until/unless a category is added for it. Same treatment for
//     bookmaker-2026-08-10.json's 'conference_no_1_seed' rows — also not a
//     currently-modeled category, loaded as-is.
//
// Files that are NOT futures-odds snapshots (present in the same directory
// but a different shape entirely) are excluded by filename pattern:
// andy-portfolio-ledger-2026.json, futures-watchlist-2026.json,
// odds-execution-validation-*.json, open-parlays-2026.json,
// platinum-rose-ai-official-2026.json.
//
// Idempotent: POSTs with Prefer: resolution=merge-duplicates against
// on_conflict=market_type,team,book,snapshot_time — the same upsert key
// scripts/ingest-futures-json.js already uses. Safe to re-run.
//
// Usage:
//   node scripts/backfill-futures-imports.js --dry-run
//   node scripts/backfill-futures-imports.js            (real write)

import fs from 'node:fs';
import path from 'node:path';

const KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];

function loadEnv(p = '.env') {
  const env = { ...process.env };
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...rest] = trimmed.split('=');
    env[k] ??= rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const DIR = 'data/futures-imports';
const FILE_RE = /^(betonline|betus|bookmaker)-\d{4}-\d{2}-\d{2}\.json$/;
const DRY_RUN = process.argv.includes('--dry-run');

function normDivision(div) {
  // "AFC East" -> "afc_east"
  return String(div).trim().toLowerCase().replace(/\s+/g, '_');
}
function normConference(conf) {
  return String(conf).trim().toLowerCase(); // "AFC" -> "afc", "NFC" -> "nfc"
}

// Returns { row, anomaly } — anomaly is a short string if the row had to be
// dropped (missing team/market_type after normalization), else null.
function normalizeRow(r, file) {
  let mt = r.market_type;
  let team = r.team;
  let odds = r.odds;

  if (mt === 'conference' && r.conference) {
    mt = 'conference_' + normConference(r.conference);
  } else if (mt === 'division' && r.division) {
    mt = 'division_' + normDivision(r.division);
  }
  if (mt === 'playoffs' && odds == null && r.yes_price != null) {
    odds = r.yes_price;
  }
  // futures_odds_snapshots.odds is NOT NULL. Every conforming file's 'wins'
  // rows carry odds mirroring over_price (see e.g. bookmaker-2026-08-10.json:
  // odds=-154, over_price=-154). betonline-2026-08-22.json's 'wins' rows
  // omit odds/price entirely (only line/over_price/under_price) — this hit
  // a live NOT NULL violation on the real write (chunk 500-1000, "New
  // England Patriots" wins row) before this fallback existed. Backfill from
  // over_price, matching the convention every other file already uses.
  if (mt === 'wins' && odds == null && r.over_price != null) {
    odds = r.over_price;
  }
  if (team == null && r.selection != null) team = r.selection;

  if (!mt) return { row: null, anomaly: `${file}: dropped row with no market_type (${JSON.stringify(r).slice(0, 120)})` };
  if (!team) return { row: null, anomaly: `${file}: dropped row with no team/selection (market_type=${mt}, ${JSON.stringify(r).slice(0, 120)})` };
  // odds is NOT NULL in futures_odds_snapshots — better to skip a row (and
  // report it) than let one bad row 400 an entire chunk on the real write.
  if (odds == null) return { row: null, anomaly: `${file}: dropped row with no odds/price/yes_price/over_price fallback available (market_type=${mt}, team=${team}, ${JSON.stringify(r).slice(0, 120)})` };

  const out = {};
  for (const k of KEYS) out[k] = r[k] ?? null;
  out.market_type = mt;
  out.team = team;
  out.odds = odds ?? r.odds ?? null;
  out.price = r.price ?? out.odds;
  return { row: out, anomaly: null };
}

function loadFile(file) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const records = Array.isArray(raw) ? raw : (raw.records || []);
  const rows = [];
  const anomalies = [];
  for (const r of records) {
    const { row, anomaly } = normalizeRow(r, file);
    if (row) rows.push(row);
    if (anomaly) anomalies.push(anomaly);
  }
  return { rows, anomalies };
}

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => FILE_RE.test(f)).sort();
  let allRows = [];
  let allAnomalies = [];
  const perFile = [];

  for (const f of files) {
    const { rows, anomalies } = loadFile(f);
    const byMkt = {};
    for (const r of rows) byMkt[r.market_type] = (byMkt[r.market_type] || 0) + 1;
    perFile.push({ file: f, count: rows.length, markets: byMkt });
    allRows = allRows.concat(rows);
    allAnomalies = allAnomalies.concat(anomalies);
  }

  console.log(`Files scanned: ${files.length}`);
  for (const pf of perFile) {
    console.log(`  ${pf.file}: ${pf.count} rows -> ${Object.entries(pf.markets).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }
  console.log(`TOTAL ROWS TO UPSERT: ${allRows.length}`);
  if (allAnomalies.length) {
    console.log(`ANOMALIES (${allAnomalies.length}) — rows dropped, not written:`);
    for (const a of allAnomalies) console.log(`  ! ${a}`);
  } else {
    console.log('No anomalies — every row in every file normalized cleanly.');
  }

  const byBookMkt = {};
  for (const r of allRows) {
    const k = `${r.book}|${r.market_type}`;
    byBookMkt[k] = (byBookMkt[k] || 0) + 1;
  }
  console.log('\nRows by book|market_type (post-normalization):');
  for (const [k, v] of Object.entries(byBookMkt).sort()) console.log(`  ${k}: ${v}`);

  if (DRY_RUN) {
    console.log('\n[dry-run] no DB write performed.');
    return;
  }

  const env = loadEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time`;

  // Chunk to stay well under PostgREST payload limits.
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} on chunk ${i}-${i + chunk.length}: ${(await res.text()).slice(0, 600)}`);
      process.exit(1);
    }
    written += chunk.length;
    console.log(`  upserted ${written}/${allRows.length}`);
  }
  console.log(`OK — upserted ${written} rows total.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
