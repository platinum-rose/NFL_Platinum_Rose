// agents/fantasypros-projections-ingest.js
// F-26c §3 — FantasyPros consensus projections → fantasy_projections table (migration 047).
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §3
//
// Independent path to the same "value board" output as Phase A's history
// regression (agents/fantasy-value-report.js's buildBoard) — the market's
// *expert* median rather than the *betting* median. Does NOT replace Phase A
// by default; see that script's new --source fantasypros flag.
//
// Source: GET /nfl/{season}/projections — same one-position-per-call,
// rate-limit-respecting loop as agents/fantasypros-rankings-ingest.js (the
// plan's confirmed 1 request/second limit).
//
// Pure mapping logic lives in agents/lib/fantasypros-projections.js (unit-tested, no I/O).
//
// Usage:
//   node agents/fantasypros-projections-ingest.js [--season 2026] [--week 0]
//     [--ros] [--positions QB,RB,WR,TE] [--as-of 2026-08-09] [--dry-run] [--no-resolve]
// Env: FANTASYPROS_API_KEY (required); SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   (unless --dry-run)
// Output: upserts fantasy_projections rows with source='fantasypros'; writes a
//   run receipt to .nfl/receipts/, same convention as the other three
//   FantasyPros ingest scripts.
// Note: live external fetches from the Cowork sandbox are blocked (F-31 on
//   TASK_BOARD, re-confirmed live this session) — needs a native run (Andy's
//   own machine).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { fantasyProsGet } from './lib/fantasypros-client.js';
import {
  PROJECTION_POSITIONS,
  mapProjections,
  dedupeProjections,
} from './lib/fantasypros-projections.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

// Same name-key convention as the other three fantasypros-*-ingest.js scripts —
// each file keeps its own copy deliberately (see fantasypros-adp-ingest.js's comment).
function nameKey(s) {
  return (s || '').toLowerCase()
    .replace(/[.'`]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

const SEASON = parseInt(getArg('--season', '2026'), 10);
const WEEK = parseInt(getArg('--week', '0'), 10); // 0 = preseason/season-long, see migration 047
const ROS = has('--ros');
const POSITIONS = (getArg('--positions', PROJECTION_POSITIONS.join(',')) || '').split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
const AS_OF = getArg('--as-of', new Date().toISOString().slice(0, 10));
const DRY = has('--dry-run');
const RESOLVE = !has('--no-resolve');

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)');
  process.exit(1);
}
const sb = (!DRY && SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

async function fetchPosition(position) {
  const params = { position };
  if (WEEK > 0) params.week = WEEK;
  if (ROS) params.ros = true;
  const data = await fantasyProsGet(`/nfl/${SEASON}/projections`, { params });
  if (data?.message) throw new Error(`FantasyPros projections (${position}) error: ${data.message}`);
  return data;
}

async function resolveIds(records) {
  if (!sb) return records;
  const byName = {};
  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await sb.from('player_stats').select('player_id, player_name').range(from, from + PAGE - 1);
    if (error) { console.warn(`   ⚠ id-resolve read: ${error.message}`); break; }
    for (const r of data || []) {
      const k = nameKey(r.player_name);
      if (k && !byName[k]) byName[k] = r.player_id;
    }
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  let hit = 0;
  for (const rec of records) {
    const id = byName[nameKey(rec.player)];
    if (id) { rec.player_id = id; hit++; }
  }
  console.log(`   resolved player_id for ${hit}/${records.length} via player_stats`);
  return records;
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `fantasypros-projections-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return filePath;
}

async function run() {
  console.log(`📥 FantasyPros projections ingest${DRY ? ' (DRY RUN)' : ''} · season=${SEASON} week=${WEEK}${ROS ? ' (ROS)' : ''} as_of=${AS_OF}`);
  const startedAt = new Date().toISOString();

  const allRecords = [];
  const perPosition = {};
  for (let i = 0; i < POSITIONS.length; i++) {
    const position = POSITIONS[i];
    const data = await fetchPosition(position);
    const records = mapProjections(data, { season: SEASON, week: WEEK, ros: ROS, position })
      .map((r) => ({ ...r, as_of_date: AS_OF }));
    allRecords.push(...records);
    perPosition[position] = { fetched: data?.players?.length ?? 0, mapped: records.length };
    console.log(`   ${position}: ${records.length} rows`);
    if (i < POSITIONS.length - 1) await sleep(1100); // respect 1 req/sec plan limit
  }

  console.log(`   ${allRecords.length} rows fetched across ${POSITIONS.length} position(s)`);
  if (!allRecords.length) {
    console.error('✖ no valid rows parsed — check FANTASYPROS_API_KEY plan/tier access');
    process.exitCode = 1;
    return;
  }

  // Same defensive dedupe as §2's rankings ingest — see
  // agents/lib/fantasypros-projections.js's dedupeProjections() for why.
  let dupeCount = 0;
  const deduped = dedupeProjections(allRecords, {
    onDuplicate: (key, [a, _b]) => {
      dupeCount += 1;
      console.warn(`   ⚠ duplicate key collapsed: ${a.player} (${a.position})`);
    },
  });
  if (dupeCount > 0) {
    console.log(`   deduped ${allRecords.length} → ${deduped.length} rows (${dupeCount} collision(s) — see warnings above)`);
  }
  const records = deduped;

  for (const s of records.slice(0, 3)) {
    console.log(`   e.g. ${s.player} ${s.position} proj_ppr ${s.proj_ppr ?? '—'} proj_std ${s.proj_std ?? '—'}`);
  }

  if (RESOLVE) await resolveIds(records);

  if (DRY) {
    console.log('   [dry-run] not writing to Supabase');
    const receiptPath = await writeReceipt({
      agent: 'fantasypros-projections-ingest',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      dry_run: true,
      season: SEASON,
      week: WEEK,
      ros: ROS,
      as_of_date: AS_OF,
      positions: POSITIONS,
      per_position: perPosition,
      rows_fetched: allRecords.length,
      duplicate_count: dupeCount,
      rows_written: records.length,
      supabase_upsert: false,
    });
    console.log(`🧾 Run receipt: ${receiptPath}`);
    return;
  }

  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    const { error } = await sb.from('fantasy_projections').upsert(slice, { onConflict: 'player,position,season,week,ros,source,as_of_date' });
    if (error) throw new Error(`fantasy_projections upsert: ${error.message}`);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
  console.log(`✅ loaded ${records.length} projection rows → fantasy_projections (source=fantasypros, week=${WEEK}, ${AS_OF})`);

  const receiptPath = await writeReceipt({
    agent: 'fantasypros-projections-ingest',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    dry_run: false,
    season: SEASON,
    week: WEEK,
    ros: ROS,
    as_of_date: AS_OF,
    positions: POSITIONS,
    per_position: perPosition,
    rows_fetched: allRecords.length,
    duplicate_count: dupeCount,
    rows_written: records.length,
    supabase_upsert: true,
  });
  console.log(`🧾 Run receipt: ${receiptPath}`);
}

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((err) => {
    console.error('FantasyProsProjectionsIngest error:', err.message);
    process.exitCode = 1;
  });
}
