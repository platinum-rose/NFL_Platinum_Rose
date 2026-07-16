// agents/player-stats-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// Player-stats ingest — seeds player_stats (weekly) + player_season_stats (seasonal)
// from the nflverse CSVs, mapping nflverse column names → PROP market keys so
// props-auto-grade.js can grade with zero translation. (Migration 032 first.)
//
// Usage:
//   node agents/player-stats-ingest.js [--season 2025] [--weekly-only|--seasonal-only]
//     [--weekly <path>] [--seasonal <path>] [--dry-run]
// Defaults read data/vault-seed/nflverse/player_stats_{weekly,seasonal}.csv
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NFLVERSE = path.join(ROOT, 'data', 'vault-seed', 'nflverse');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const SEASON = getArg('--season', null);           // optional filter
const DRY = has('--dry-run');
const WEEKLY_PATH = getArg('--weekly', path.join(NFLVERSE, 'player_stats_weekly.csv'));
const SEASONAL_PATH = getArg('--seasonal', path.join(NFLVERSE, 'player_stats_seasonal.csv'));
const DO_WEEKLY = !has('--seasonal-only');
const DO_SEASONAL = !has('--weekly-only');

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or pass --dry-run)'); process.exit(1); }
const sb = (!DRY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

// ── RFC4180-ish CSV parser (handles quoted fields w/ commas, "" escapes) ──────
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const num = (v) => { if (v === '' || v == null || v === 'NA') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const sum = (...xs) => { const vals = xs.map(num).filter((x) => x != null); return vals.length ? vals.reduce((a, b) => a + b, 0) : null; };

async function loadTable(p) {
  const raw = await readFile(p, 'utf8');
  const rows = parseCSV(raw).filter((r) => r.length > 1);
  const header = rows.shift();
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  return { rows, idx, get: (r, name) => (idx[name] != null ? r[idx[name]] : undefined) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_RETRIES = 4;

// One chunk, with retry+backoff on transient failures (network 'fetch failed',
// timeouts, 5xx). Upserts are idempotent, so a retried chunk is safe.
async function upsertChunk(table, slice, conflict, chunkNo) {
  for (let attempt = 1; ; attempt++) {
    try {
      const { error } = await sb.from(table).upsert(slice, { onConflict: conflict });
      if (error) throw new Error(error.message);
      return;
    } catch (e) {
      if (attempt >= MAX_RETRIES) throw new Error(`${table} chunk ${chunkNo}: ${e.message} (after ${MAX_RETRIES} attempts)`);
      const wait = attempt * 2000;
      console.warn(`   ⚠ ${table} chunk ${chunkNo} attempt ${attempt} failed (${e.message}) — retrying in ${wait}ms`);
      await sleep(wait);
    }
  }
}

async function upsert(table, records, conflict) {
  if (DRY) { console.log(`   [dry-run] would upsert ${records.length} → ${table}`); return; }
  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    await upsertChunk(table, slice, conflict, i / CHUNK + 1);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length} → ${table}`);
  }
}

async function ingestWeekly() {
  const { rows, get } = await loadTable(WEEKLY_PATH);
  const recs = [];
  for (const r of rows) {
    const season = num(get(r, 'season'));
    if (SEASON && String(season) !== String(SEASON)) continue;
    const pid = get(r, 'player_id'); if (!pid) continue;
    recs.push({
      player_id: pid,
      player_name: get(r, 'player_display_name') || get(r, 'player_name'),
      position: get(r, 'position'),
      team: get(r, 'team'),
      opponent: get(r, 'opponent_team'),
      season, week: num(get(r, 'week')),
      season_type: get(r, 'season_type') || 'REG',
      // nflverse → market-key columns (the grader's contract)
      player_pass_yds: num(get(r, 'passing_yards')),
      player_pass_tds: num(get(r, 'passing_tds')),
      player_pass_attempts: num(get(r, 'attempts')),
      player_pass_completions: num(get(r, 'completions')),
      player_pass_interceptions: num(get(r, 'passing_interceptions')),
      player_rush_yds: num(get(r, 'rushing_yards')),
      player_rush_attempts: num(get(r, 'carries')),
      player_rush_tds: num(get(r, 'rushing_tds')),
      player_reception_yds: num(get(r, 'receiving_yards')),
      player_receptions: num(get(r, 'receptions')),
      player_anytime_td: sum(get(r, 'rushing_tds'), get(r, 'receiving_tds'), get(r, 'special_teams_tds')),
      targets: num(get(r, 'targets')),
      target_share: num(get(r, 'target_share')),
      fantasy_points: num(get(r, 'fantasy_points')),
      fantasy_points_ppr: num(get(r, 'fantasy_points_ppr')),
      source: 'nflverse',
    });
  }
  console.log(`📈 weekly: ${recs.length} rows${SEASON ? ` (season ${SEASON})` : ''}`);
  await upsert('player_stats', recs, 'player_id,season,week,season_type');
}

async function ingestSeasonal() {
  const { rows, get } = await loadTable(SEASONAL_PATH);
  const recs = [];
  for (const r of rows) {
    const season = num(get(r, 'season'));
    if (SEASON && String(season) !== String(SEASON)) continue;
    const pid = get(r, 'player_id'); if (!pid) continue;
    recs.push({
      player_id: pid,
      player_name: get(r, 'player_display_name') || get(r, 'player_name'),
      position: get(r, 'position'),
      team: get(r, 'recent_team'),
      season,
      season_type: get(r, 'season_type') || 'REG',
      games: num(get(r, 'games')),
      passing_yards: num(get(r, 'passing_yards')),
      passing_tds: num(get(r, 'passing_tds')),
      rushing_yards: num(get(r, 'rushing_yards')),
      rushing_tds: num(get(r, 'rushing_tds')),
      carries: num(get(r, 'carries')),
      receptions: num(get(r, 'receptions')),
      receiving_yards: num(get(r, 'receiving_yards')),
      receiving_tds: num(get(r, 'receiving_tds')),
      targets: num(get(r, 'targets')),
      target_share: num(get(r, 'target_share')),
      fantasy_points: num(get(r, 'fantasy_points')),
      fantasy_points_ppr: num(get(r, 'fantasy_points_ppr')),
      source: 'nflverse',
    });
  }
  console.log(`📊 seasonal: ${recs.length} rows${SEASON ? ` (season ${SEASON})` : ''}`);
  await upsert('player_season_stats', recs, 'player_id,season,season_type');
}

(async () => {
  console.log(`🏈 player-stats ingest${DRY ? ' (DRY RUN)' : ''}`);
  if (DO_WEEKLY) await ingestWeekly();
  if (DO_SEASONAL) await ingestSeasonal();
  console.log('✅ done');
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
