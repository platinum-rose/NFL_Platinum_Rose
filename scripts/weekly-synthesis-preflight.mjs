#!/usr/bin/env node
// scripts/weekly-synthesis-preflight.mjs
// Compact freshness report for the weekly card + futures synthesis session
// (agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md). Reads local files, except the 2026 ESPN roster refresh. Prints ~30 lines so a session can check every input without
// opening large JSON files.
//
// Usage: node scripts/weekly-synthesis-preflight.mjs [--week N] [--date YYYY-MM-DD] [--json] [--no-fetch]
// The ESPN roster refresh is the one network call (free public API); --no-fetch skips it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
// Python for the roster gate. Agent sandboxes on Windows often have no working `python3` alias (Codex, 2026-09-27),
// so try $PYTHON, then the usual launchers, then the known install paths on Andy's machine.
function findPython() {
  const la = process.env.LOCALAPPDATA || '';
  const cands = [
    process.env.PYTHON && [process.env.PYTHON],
    ['python3'], ['python'], ['py', '-3'],
    la && [path.join(la, 'Python', 'pythoncore-3.14-64', 'python.exe')],
    la && [path.join(la, 'Python', 'bin', 'python.exe')],
    ['C:\\Users\\andre\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe'],
    ['C:\\Users\\andre\\anaconda3\\python.exe'],
  ].filter(Boolean);
  for (const [cmd, ...pre] of cands) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', timeout: 20000 });
    if (r.status === 0 && String(r.stdout).trim() === '3') return [cmd, ...pre];
  }
  return null;
}
const PY = findPython();
const py = (args, opts) => (PY ? spawnSync(PY[0], [...PY.slice(1), ...args], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, ...opts })
  : { status: 1, stdout: '', stderr: 'NO PYTHON FOUND: set PYTHON=<path to python.exe> (e.g. C:\\Users\\andre\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe)' });
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
  // 2026-09-27 ROSTER GATE: the full 2026 ESPN rosters (incl. IR / practice squad) are the only accepted source for
  // "which team is this player on". Refreshed here automatically when >24h old; the vet below must PASS before any card work.
  ['ESPN rosters 2026 (full)', () => {
    const p = 'data/nfl-rosters/espn-full-rosters-latest.json';
    const j = readJson(p);
    const age = j?.generated_at ? (now - new Date(j.generated_at)) / 3600000 : Infinity;
    if (age > 24 && !argv.includes('--no-fetch')) py([rel('scripts/nfl-rosters/fetch_espn_rosters.py')], { cwd: ROOT, timeout: 120000 });
    return p;
  }, 24, (j) => ({ note: `${j?.player_count ?? '?'} players, ${j?.team_count ?? '?'} teams`, fail: (j?.team_count ?? 0) !== 32 })],
  ['ROSTER VET (gate)', null, null, () => {
    const d = new Date(now); const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d);
    const r = py([rel('scripts/nfl-rosters/roster_vet.py'), '--week', String(WEEK), '--date', argVal('--date') || date, '--quiet'], { cwd: ROOT, timeout: 170000 });
    const line = (r.stdout || r.stderr || 'did not run').trim().split('\n').pop();
    return { note: `${line}  [python: ${PY ? PY.join(' ') : 'NOT FOUND'}]  -> details: data/generated/master-intel/w${String(WEEK).padStart(2, '0')}-roster-vet.json`, fail: !/ROSTER VET: PASS/.test(line) };
  }],
  ['Secondary matchups', 'data/secondary-matchups/latest.json', 96, (j) => ({ note: `week ${j?.meta?.week}`, fail: j?.meta?.week !== WEEK })],
  ['Usage trends (season)', 'data/generated/player-usage-trends-2026.json', 72, (j) => ({ note: `through wk ${j?.last_updated_week}`, fail: j?.last_updated_week !== WEEK - 1 })],
  ['ESPN box scores', null, null, () => {
    let n = 0; try { n = fs.readdirSync(rel('data/fantasy/boxscores')).length; } catch {}
    return { note: `${n} files (expect ~${16 * (WEEK - 1)})`, fail: n < 14 * (WEEK - 1) };
  }],
  ['Prediction markets', 'data/prediction-markets/latest.json', 48, (j) => ({ note: `${j?.meta?.contract_count ?? '?'} contracts` })],
  ['Cross-market coherence', 'data/prediction-markets/cross-market-coherence-latest.json', 48],
  ['SuperContest live mkt', 'data/supercontest/live-market-comparison.json', 48],
  // 2026-09-26: BKR game lines are also captured as a rendered snapshot next to
  // the week's prop boards (docs/Player_Prop_Odds_Weekly/Week<N>/BKR_Week<N>_current_game_lines.md);
  // take whichever of the two locations is newer instead of false-flagging STALE.
  ['BKR current lines', () => {
    const cands = [
      newest('data/odds', /^BKR_current_lines/) && `data/odds/${newest('data/odds', /^BKR_current_lines/)}`,
      newest(`docs/Player_Prop_Odds_Weekly/Week${WEEK}`, /^BKR_Week\d+_current_game_lines/) && `docs/Player_Prop_Odds_Weekly/Week${WEEK}/${newest(`docs/Player_Prop_Odds_Weekly/Week${WEEK}`, /^BKR_Week\d+_current_game_lines/)}`,
    ].filter(Boolean);
    const mtime = (f) => { try { return fs.statSync(rel(f)).mtimeMs; } catch { return 0; } };
    return cands.sort((x, y) => mtime(y) - mtime(x))[0] || 'data/odds/BKR_current_lines_missing';
  }, 36],
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
  ['BEO futures board (import)', () => `data/futures-imports/${newest('data/futures-imports', /^betonline-2026-\d\d-\d\d(-.*)?\.json$/)}`, 168],
  ['BKR futures board (import)', () => `data/futures-imports/${newest('data/futures-imports', /^bookmaker-2026-\d\d-\d\d(-.*)?\.json$/)}`, 168],
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
