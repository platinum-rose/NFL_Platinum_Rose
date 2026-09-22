#!/usr/bin/env node
// scripts/weekly-synthesis-preflight.mjs
// Compact freshness report for the weekly card + futures synthesis session
// (agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md). Reads LOCAL files only -- safe in
// the no-network device VM. Prints ~30 lines so a session can check every input without
// opening large JSON files.
//
// Usage: node scripts/weekly-synthesis-preflight.mjs [--week N] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argVal = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const now = new Date();

// Same Tuesday-00:00-ET anchor as scripts/scan-unprocessed-tweet-threads.mjs
function currentWeek(d = now) {
  const ny = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const diff = Math.floor((new Date(`${ny}T00:00:00Z`) - new Date('2026-09-08T00:00:00Z')) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}
const WEEK = Number(argVal('--week')) || currentWeek();
// Week window: Tuesday 00:00 ET -> next Tuesday 00:00 ET (EDT, UTC-4, all regular season until Nov 1)
const WEEK_START = new Date(Date.parse('2026-09-08T04:00:00Z') + (WEEK - 1) * 7 * 86400000);
const WEEK_END = new Date(+WEEK_START + 7 * 86400000);

const rel = (p) => path.join(ROOT, p);
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(rel(p), 'utf8')); } catch { return null; } };
const mtime = (p) => { try { return fs.statSync(rel(p)).mtime; } catch { return null; } };
const newest = (dir, re) => {
  try {
    return fs.readdirSync(rel(dir)).filter((f) => re.test(f)).sort().pop() || null;
  } catch { return null; }
};
function stamp(p, j) {
  const cands = [j?.generated_at, j?.meta?.generated_at, j?.captured_at, j?.updated_at, j?.as_of];
  const s = cands.find(Boolean);
  const t = s ? new Date(s) : null;
  return t && !Number.isNaN(+t) ? t : mtime(p);
}
const ageH = (t) => (t ? (now - t) / 3600000 : Infinity);

// [label, path | () => path, maxAgeHours, extra(json) -> {note, fail}]
const SOURCES = [
  ['Player availability', 'data/player-availability/latest.json', 24, (j) => ({ note: `${j?.meta?.event_count ?? '?'} events` })],
  ['Projected starters', () => `data/projected-starters/2026/${newest('data/projected-starters/2026', /^projected-starters-.*\.json$/)}`, 36],
  ['Roster map', 'data/nfl-rosters/roster-map-latest.json', 72, (j) => ({ note: `${j?.player_count ?? '?'} players` })],
  ['Secondary matchups', 'data/secondary-matchups/latest.json', 96, (j) => ({ note: `week ${j?.meta?.week}`, fail: j?.meta?.week !== WEEK })],
  ['Usage trends (season)', 'data/generated/player-usage-trends-2026.json', 72, (j) => ({ note: `through wk ${j?.last_updated_week}`, fail: j?.last_updated_week !== WEEK - 1 })],
  ['ESPN box scores', null, null, () => {
    let n = 0; try { n = fs.readdirSync(rel('data/fantasy/boxscores')).length; } catch {}
    return { note: `${n} files (expect ~${16 * (WEEK - 1)})`, fail: n < 14 * (WEEK - 1) };
  }],
  ['Prediction markets', 'data/prediction-markets/latest.json', 48, (j) => ({ note: `${j?.meta?.contract_count ?? '?'} contracts` })],
  ['Cross-market coherence', 'data/prediction-markets/cross-market-coherence-latest.json', 48],
  ['SuperContest live mkt', 'data/supercontest/live-market-comparison.json', 48],
  ['BKR current lines', () => `data/odds/${newest('data/odds', /^BKR_current_lines/)}`, 36],
  ['Alpha packet', 'data/alpha/alpha-packet-2026.json', 48],
  ['Expert dossiers', () => `data/expert-dossiers/${newest('data/expert-dossiers', /\.json$/)}`, 168],
  ['Host citations', 'data/generated/host-citations-latest.json', 168],
  ['Player-props intel', 'docs/player-props-intel/player-props-intel-latest.md', 168],
  ['Podcast recs (legacy file)', 'data/podcasts/actionable_betting_recommendations_2026.json', 168],
  ['Team DVOA / power', 'data/generated/team-profiles/team-power-ratings-2026.json', 240],
  [`Prop boards Week${WEEK}`, null, null, () => {
    let n = 0; try { n = fs.readdirSync(rel(`docs/Player_Prop_Odds_Weekly/Week${WEEK}`)).length; } catch {}
    return { note: `${n} board file(s)`, fail: n === 0 };
  }],
  ['Futures ledger', 'data/futures-imports/andy-portfolio-ledger-2026.json', 168],
  ['BEO futures board (import)', () => `data/futures-imports/${newest('data/futures-imports', /^betonline-2026-\d\d-\d\d\.json$/)}`, 168],
  ['BKR futures board (import)', () => `data/futures-imports/${newest('data/futures-imports', /^bookmaker-2026-\d\d-\d\d\.json$/)}`, 168],
  ['Promotions', 'data/sportsbooks/promotions-2026.json', 168],
];

const rows = [];
for (const [label, p0, maxH, extra] of SOURCES) {
  const p = typeof p0 === 'function' ? p0() : p0;
  const j = p ? readJson(p) : null;
  const t = p ? stamp(p, j) : null;
  const ex = extra ? extra(j) : {};
  const age = p ? ageH(t) : null;
  const stale = (p && (age === Infinity || age > maxH)) || ex.fail;
  rows.push({ label, path: p, age_h: age === null ? null : Math.round(age), max_h: maxH, status: stale ? 'STALE' : 'ok', note: ex.note || '' });
}

if (argv.includes('--json')) {
  console.log(JSON.stringify({ week: WEEK, week_start_utc: WEEK_START.toISOString(), week_end_utc: WEEK_END.toISOString(), generated_at: now.toISOString(), rows }, null, 1));
} else {
  console.log(`Weekly synthesis preflight — 2026 Week ${WEEK} — ${now.toISOString()}`);
  console.log(`WEEK_START=${WEEK_START.toISOString()}  WEEK_END=${WEEK_END.toISOString()}  (use in SQL kickoff/captured filters)`);
  for (const r of rows) {
    const age = r.age_h === null ? '' : r.age_h === Infinity ? 'missing' : `${r.age_h}h`;
    console.log(`${r.status === 'ok' ? ' ok  ' : 'STALE'} ${r.label.padEnd(28)} ${age.padStart(7)}  ${r.note}${r.path ? `  [${r.path}]` : ''}`);
  }
  console.log(`\n${rows.filter((r) => r.status === 'STALE').length} stale of ${rows.length}. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.`);
}
