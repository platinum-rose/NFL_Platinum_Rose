// agents/fantasypros-rankings-ingest.js
// F-26c part 2 — FantasyPros weekly/draft rankings → fantasy_rankings table (migration 046).
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §2
// "The literal original F-26 ask" per TASK_BOARD — start/sit, weekly rankings.
//
// Source: GET /nfl/{season}/consensus-rankings — requires ONE position per call
// (`position=ALL` is rejected live, confirmed 2026-08-09), so this loops QB/RB/WR/TE
// sequentially with a short delay between calls to respect the plan's 1 request/second
// limit (confirmed on the FantasyPros API key dashboard: 1 req/sec, 500 req/day).
//
// This is Expert Consensus Rank (opinion), NOT the same signal as fantasy_adp (034,
// real market ADP) — don't conflate rank_ecr from this table with adp from that one.
//
// Pure mapping logic lives in agents/lib/fantasypros-rankings.js (unit-tested, no I/O).
//
// Usage:
//   node agents/fantasypros-rankings-ingest.js --type draft [--season 2026]
//     [--scoring ppr|standard|half] [--positions QB,RB,WR,TE] [--as-of 2026-08-09]
//     [--dry-run] [--no-resolve]
//   node agents/fantasypros-rankings-ingest.js --type weekly --week 1 [...same flags]
// Env: FANTASYPROS_API_KEY (required); SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   (unless --dry-run)
// Output: upserts fantasy_rankings rows with source='fantasypros'; writes a run receipt
//   to .nfl/receipts/, same convention as agents/schedule-ingest.js and
//   agents/fantasypros-adp-ingest.js.
// Note: live external fetches from the Cowork sandbox are blocked (F-31 on TASK_BOARD)
//   — needs a native run (Andy's own machine), same as every other live-network ingest
//   script here.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { fantasyProsGet } from './lib/fantasypros-client.js';
import {
  RANKING_POSITIONS,
  RANKING_TYPE_DRAFT,
  RANKING_TYPE_WEEKLY,
  scoringParam,
  mapConsensusRankings,
  dedupeRankings,
} from './lib/fantasypros-rankings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

// Same name-key convention as agents/fantasypros-adp-ingest.js, scripts/parse-adp.js,
// and agents/fantasy-value-report.js — each file keeps its own copy deliberately (see
// fantasypros-adp-ingest.js's comment for why).
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

const TYPE_ARG = (getArg('--type', 'draft') || 'draft').toLowerCase(); // draft | weekly
const SEASON = parseInt(getArg('--season', '2026'), 10);
const WEEK = getArg('--week', null) !== null ? parseInt(getArg('--week', null), 10) : null;
const SCORING = (getArg('--scoring', 'ppr') || 'ppr').toLowerCase(); // ppr | standard | half
const POSITIONS = (getArg('--positions', RANKING_POSITIONS.join(',')) || '').split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
const AS_OF = getArg('--as-of', new Date().toISOString().slice(0, 10));
const DRY = has('--dry-run');
const RESOLVE = !has('--no-resolve');

if (TYPE_ARG !== 'draft' && TYPE_ARG !== 'weekly') {
  console.error('✖ --type must be "draft" or "weekly"');
  process.exit(1);
}
if (TYPE_ARG === 'weekly' && (WEEK === null || Number.isNaN(WEEK))) {
  console.error('✖ --type weekly requires --week <N>');
  process.exit(1);
}
const API_TYPE = TYPE_ARG === 'weekly' ? RANKING_TYPE_WEEKLY : RANKING_TYPE_DRAFT;
const TABLE_WEEK = TYPE_ARG === 'weekly' ? WEEK : 0; // 0 = season-long/draft, see migration 046's note on NULL-uniqueness

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)');
  process.exit(1);
}
const sb = (!DRY && SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

async function fetchPosition(position) {
  const params = { position, type: API_TYPE, scoring: scoringParam(SCORING) };
  if (TYPE_ARG === 'weekly') params.week = WEEK;
  const data = await fantasyProsGet(`/nfl/${SEASON}/consensus-rankings`, { params });
  if (data?.message) throw new Error(`FantasyPros consensus-rankings (${position}) error: ${data.message}`);
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
  const filePath = path.join(RECEIPTS_DIR, `fantasypros-rankings-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return filePath;
}

async function run() {
  console.log(`📥 FantasyPros rankings ingest${DRY ? ' (DRY RUN)' : ''} · type=${TYPE_ARG}${TYPE_ARG === 'weekly' ? ` week=${WEEK}` : ''} scoring=${SCORING} season=${SEASON} as_of=${AS_OF}`);
  const startedAt = new Date().toISOString();

  const allRecords = [];
  const perPosition = {};
  for (let i = 0; i < POSITIONS.length; i++) {
    const position = POSITIONS[i];
    const data = await fetchPosition(position);
    const records = mapConsensusRankings(data, { season: SEASON, week: TABLE_WEEK, scoring: SCORING })
      .map((r) => ({ ...r, as_of_date: AS_OF }));
    allRecords.push(...records);
    perPosition[position] = { fetched: data?.players?.length ?? 0, mapped: records.length, total_experts: data?.total_experts ?? null };
    console.log(`   ${position}: ${records.length} rows (total_experts=${data?.total_experts ?? '?'})`);
    if (i < POSITIONS.length - 1) await sleep(1100); // respect 1 req/sec plan limit
  }

  console.log(`   ${allRecords.length} rows fetched across ${POSITIONS.length} position(s)`);
  if (!allRecords.length) {
    console.error('✖ no valid rows parsed — check FANTASYPROS_API_KEY plan/tier access');
    process.exitCode = 1;
    return;
  }

  // FantasyPros' response can contain 2 entries for the same player within one position
  // call — found live 2026-08-09 as an "ON CONFLICT DO UPDATE command cannot affect row
  // a second time" Postgres error. Dedupe before writing, on every run (not just when it
  // happens to matter this time) — see agents/lib/fantasypros-rankings.js for detail.
  let dupeCount = 0;
  const deduped = dedupeRankings(allRecords, {
    onDuplicate: (key, [a, b]) => {
      dupeCount += 1;
      console.warn(`   ⚠ duplicate key collapsed: ${a.player} (${a.position}) — kept rank_ecr ${Math.min(a.rank_ecr, b.rank_ecr)}, dropped ${Math.max(a.rank_ecr, b.rank_ecr)}`);
    },
  });
  if (dupeCount > 0) {
    console.log(`   deduped ${allRecords.length} → ${deduped.length} rows (${dupeCount} collision(s) — see warnings above)`);
  }
  const records = deduped;

  for (const s of records.slice(0, 3)) {
    console.log(`   e.g. ${s.player} ${s.position}${s.pos_rank ? ` (${s.pos_rank})` : ''} ecr ${s.rank_ecr} tier ${s.tier ?? '—'}`);
  }

  if (RESOLVE) await resolveIds(records);

  if (DRY) {
    console.log('   [dry-run] not writing to Supabase');
    const receiptPath = await writeReceipt({
      agent: 'fantasypros-rankings-ingest',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      dry_run: true,
      type: TYPE_ARG,
      week: TABLE_WEEK,
      scoring: SCORING,
      season: SEASON,
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
    const { error } = await sb.from('fantasy_rankings').upsert(slice, { onConflict: 'player,position,season,week,scoring,source,as_of_date' });
    if (error) throw new Error(`fantasy_rankings upsert: ${error.message}`);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
  console.log(`✅ loaded ${records.length} ranking rows → fantasy_rankings (source=fantasypros, type=${TYPE_ARG}, ${AS_OF})`);

  const receiptPath = await writeReceipt({
    agent: 'fantasypros-rankings-ingest',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    dry_run: false,
    type: TYPE_ARG,
    week: TABLE_WEEK,
    scoring: SCORING,
    season: SEASON,
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
    console.error('FantasyProsRankingsIngest error:', err.message);
    process.exitCode = 1;
  });
}
