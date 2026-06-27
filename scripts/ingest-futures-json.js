#!/usr/bin/env node
// Ingest normalized futures snapshot JSON into Supabase futures_odds_snapshots.

import fs from 'node:fs';

const KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function loadEnv(path = '.env') {
  const env = { ...process.env };
  if (!fs.existsSync(path)) return env;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...rest] = trimmed.split('=');
    env[k] ??= rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function summarize(rows, file) {
  const markets = new Map();
  const books = new Set();
  const dates = new Set();
  for (const r of rows) {
    markets.set(r.market_type, (markets.get(r.market_type) || 0) + 1);
    books.add(r.book);
    dates.add(String(r.snapshot_time).slice(0, 10));
  }
  console.log(`${file}: ${rows.length} rows | books=${[...books].sort().join(',')} | dates=${[...dates].sort().join(',')}`);
  for (const [market, count] of [...markets.entries()].sort()) console.log(`  ${market}: ${count}`);
}

const file = arg('--file') || process.argv.find((a, i) => i > 1 && !a.startsWith('--'));
const dryRun = hasFlag('--dry-run');
if (!file) {
  console.error('usage: node scripts/ingest-futures-json.js --file <snapshot.json> [--dry-run]');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = raw.map((r) => Object.fromEntries(KEYS.map((k) => [k, r[k] ?? null])));
summarize(rows, file);

if (dryRun) {
  console.log('[dry-run] no DB write');
  process.exit(0);
}

const env = loadEnv();
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const url = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 600)}`);
  process.exit(1);
}
console.log(`OK ${res.status} - upserted ${rows.length} rows`);
