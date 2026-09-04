// agents/fantasypros-adp-ingest.js
// F-26c part 1 — FantasyPros ADP → fantasy_adp table (migration 034).
// Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §1
//
// Source: GET /nfl/players (`rank_adp` / `rank_adp_ppr`) — NOT /consensus-rankings,
// which only carries `rank_ecr` (expert opinion, not real draft-market ADP; see the
// scope doc for why these two have to stay distinct). One call returns the full
// player universe (~8,660 rows, all positions incl. team DST, no server-side
// position filter param) — filtered client-side to QB/RB/WR/TE in
// agents/lib/fantasypros-adp.js, same scoping player_season_stats already applies.
//
// Pure mapping/ranking logic lives in agents/lib/fantasypros-adp.js (unit-tested,
// no I/O). This file is the thin CLI/fetch/Supabase wrapper, same shape as
// agents/schedule-ingest.js.
//
// Usage:
//   node agents/fantasypros-adp-ingest.js [--scoring ppr|standard] [--teams 12]
//     [--as-of 2026-08-09] [--dry-run] [--no-resolve]
// Env: FANTASYPROS_API_KEY (required); SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   (unless --dry-run)
// Output: upserts fantasy_adp rows with source='fantasypros'; writes a run receipt
//   to .nfl/receipts/, same convention as agents/schedule-ingest.js.
// Note (2026-08-09): live external fetches from the Cowork sandbox are blocked
// (same restriction documented against agents/futures-odds-ingest.js, F-31 on
// TASK_BOARD) — this script needs a native run (Andy's own machine) to actually
// hit the FantasyPros API, same as every other live-network ingest script here.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { fantasyProsGet } from './lib/fantasypros-client.js';
import { mapFantasyProsPlayers } from './lib/fantasypros-adp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

// Same name-key convention as agents/fantasy-value-report.js and scripts/parse-adp.js
// (deliberately re-declared here rather than imported — those files each keep their
// own copy too, since fantasy-value-report.js has its own top-level argv parsing +
// Supabase client construction as import-time side effects).
function nameKey(s) {
  return (s || '').toLowerCase()
    .replace(/[.'`]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const SCORING = (getArg('--scoring', 'ppr') || 'ppr').toLowerCase(); // ppr | standard
const TEAMS = parseInt(getArg('--teams', '12'), 10);
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

async function fetchFantasyProsPlayers() {
  // /nfl/players silently defaults to a 10-row page with NO error/warning if `limit`
  // is omitted (confirmed live 2026-08-09 — undocumented on the API's own docs page;
  // not a plan-tier restriction, the premium key already returns full data on other
  // endpoints without it). 2000 comfortably exceeds the real total (~501 across all
  // positions incl. DST as of 2026-08-09) with headroom for roster growth.
  const data = await fantasyProsGet('/nfl/players', { params: { ecr: 'included', limit: 2000 } });
  if (data?.message) throw new Error(`FantasyPros /nfl/players error: ${data.message}`);
  const players = Array.isArray(data.players) ? data.players : [];
  if (Number.isFinite(Number(data.count)) && players.length < Number(data.count)) {
    console.warn(`   ⚠ API reports count=${data.count} but returned ${players.length} — pagination limit may need raising`);
  }
  return players;
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
  const filePath = path.join(RECEIPTS_DIR, `fantasypros-adp-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return filePath;
}

async function run() {
  console.log(`📥 FantasyPros ADP ingest${DRY ? ' (DRY RUN)' : ''} · scoring=${SCORING} as_of=${AS_OF}`);
  const startedAt = new Date().toISOString();

  const players = await fetchFantasyProsPlayers();
  console.log(`   fetched ${players.length} total players from /nfl/players`);

  let records = mapFantasyProsPlayers(players, { scoring: SCORING, asOf: AS_OF, teams: TEAMS });
  console.log(`   filtered to ${records.length} QB/RB/WR/TE rows with a valid ADP`);
  if (!records.length) {
    console.error('✖ no valid rows parsed — check FANTASYPROS_API_KEY plan/tier access');
    process.exitCode = 1;
    return;
  }

  // Deduplicate before writing to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
  const seenKey = new Set();
  records = records.filter((r) => {
    const k = `${(r.player || '').toLowerCase()}|${r.source}|${r.scoring}|${r.as_of_date}`;
    if (seenKey.has(k)) return false;
    seenKey.add(k);
    return true;
  });

  for (const s of records.slice(0, 3)) {
    console.log(`   e.g. ${s.player} ${s.position}${s.adp_pos_rank ?? ''} adp ${s.adp} (rd ${s.adp_round})`);
  }

  if (RESOLVE) await resolveIds(records);

  if (DRY) {
    console.log('   [dry-run] not writing to Supabase');
    const receiptPath = await writeReceipt({
      agent: 'fantasypros-adp-ingest',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      dry_run: true,
      scoring: SCORING,
      as_of_date: AS_OF,
      teams: TEAMS,
      players_fetched: players.length,
      rows_written: records.length,
      supabase_upsert: false,
    });
    console.log(`🧾 Run receipt: ${receiptPath}`);
    return;
  }

  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    const { error } = await sb.from('fantasy_adp').upsert(slice, { onConflict: 'player,source,scoring,as_of_date' });
    if (error) throw new Error(`fantasy_adp upsert: ${error.message}`);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
  console.log(`✅ loaded ${records.length} ADP rows → fantasy_adp (source=fantasypros, ${AS_OF})`);
  console.log(`   next: node agents/fantasy-value-report.js --scoring ${SCORING}`);

  const receiptPath = await writeReceipt({
    agent: 'fantasypros-adp-ingest',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    dry_run: false,
    scoring: SCORING,
    as_of_date: AS_OF,
    teams: TEAMS,
    players_fetched: players.length,
    rows_written: records.length,
    supabase_upsert: true,
  });
  console.log(`🧾 Run receipt: ${receiptPath}`);
}

run().catch((err) => {
  console.error('FantasyProsAdpIngest error:', err.message);
  process.exitCode = 1;
});
