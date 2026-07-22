/**
 * scripts/grade-futures-recommendation.js
 *
 * Manual grading for agents/portfolio-synthesize.js's `futures_recommendations`
 * log (migration 042). This is the MANUAL half of backtesting — there's no
 * automated end-of-season resolution feed in this repo yet (who actually won
 * each division/conference/award/win-total isn't a queryable table anywhere),
 * so results get recorded by hand as markets actually resolve. Once enough
 * rows are graded, docs/analysis on calibration (confidence bucket vs. hit
 * rate, edge_type vs. hit rate, which sources actually helped) becomes possible
 * — see the "Still needed" note in docs/FUTURES_AGENT_DATA_INVENTORY doc.
 *
 * Usage:
 *   node scripts/grade-futures-recommendation.js --list [--status pending] [--run-date 2026-07-22]
 *   node scripts/grade-futures-recommendation.js --run-date 2026-07-22 --key "division_afc_west|chiefs" --result won [--note "..."]
 *
 * --result one of: won | lost | push | void | superseded
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LIST = argv.includes('--list');
const RUN_DATE = getArg('--run-date', null);
const KEY = getArg('--key', null);
const RESULT = getArg('--result', null);
const NOTE = getArg('--note', null);
const STATUS_FILTER = getArg('--status', null);

const VALID_RESULTS = new Set(['won', 'lost', 'push', 'void', 'superseded']);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

async function list() {
  let q = sb.from('futures_recommendations')
    .select('run_date, key, market, selection, price, book, confidence, edge_type, stake_tier, status, bet_threshold')
    .order('run_date', { ascending: false }).order('market');
  if (RUN_DATE) q = q.eq('run_date', RUN_DATE);
  if (STATUS_FILTER) q = q.eq('status', STATUS_FILTER);
  const { data, error } = await q;
  if (error) { console.error('✖', error.message); process.exitCode = 1; return; }
  if (!data?.length) { console.log('(no rows match)'); return; }
  for (const r of data) {
    console.log(`${r.run_date}  [${r.status.toUpperCase().padEnd(10)}] ${r.market} — ${r.selection}  ${r.price}@${r.book}  conf ${r.confidence}  (${r.edge_type}/${r.stake_tier})  key="${r.key}"`);
  }
  console.log(`\n${data.length} row(s)`);
}

async function grade() {
  if (!RUN_DATE || !KEY || !RESULT) {
    console.error('✖ Grading requires --run-date, --key, and --result. Use --list to find the exact run_date/key first.');
    process.exitCode = 1; return;
  }
  if (!VALID_RESULTS.has(RESULT)) {
    console.error(`✖ --result must be one of: ${[...VALID_RESULTS].join(', ')}`);
    process.exitCode = 1; return;
  }
  const { data, error } = await sb.from('futures_recommendations')
    .update({ status: RESULT, resolved_at: new Date().toISOString(), result_note: NOTE || null })
    .eq('run_date', RUN_DATE).eq('key', KEY)
    .select('run_date, key, market, selection, status');
  if (error) { console.error('✖', error.message); process.exitCode = 1; return; }
  if (!data?.length) { console.error(`✖ No row matched run_date=${RUN_DATE} key="${KEY}" — check --list first.`); process.exitCode = 1; return; }
  for (const r of data) console.log(`✅ ${r.run_date} ${r.market} — ${r.selection} → ${r.status}`);
}

(async () => {
  if (LIST) await list();
  else await grade();
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
