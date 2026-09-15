// scripts/build-week-usage-locks.js
// ═══════════════════════════════════════════════════════════════════════════════
// Derives "obvious lock" starters (no depth-chart controversy, so they never
// trigger the injury-report/competition-language heuristic in
// build-projected-starters.js) from real weekly usage stats, and writes them
// as a manual-override row set that build-projected-starters.js picks up.
//
// Background: build-projected-starters.js only catches players mentioned in
// injury-report/competition language ("competing for", "starter", "behind").
// A true workhorse (e.g. a bell-cow RB or entrenched QB1) generates none of
// that chatter and silently never appears in the snapshot. This script closes
// that gap using actual usage from data/vault-seed/nflverse/player_stats_weekly.csv
// (refreshed by fetch_nflverse_data.py --datasets player_stats_weekly).
//
// For each team + position, the usage leader is flagged a "lock" when their
// usage clearly dominates the next player at that spot (>= DOMINANCE_RATIO,
// above a position-specific volume floor). QBs get high confidence
// (needs_human_review: false) since QB1 status rarely changes outside injury.
// RB/WR/TE are single-week samples and flagged needs_human_review: true,
// since committees/roles can shift week to week -- this file is fully
// regenerated (overwritten) each run, so it always reflects only the latest
// completed week, never stale entries from prior weeks.
//
// This file is separate from skill-position-locks.json (a hand-curated,
// never-auto-touched override list) -- that one is for permanent manual
// corrections; this one is the auto-refreshed weekly pass.
//
// Two additional outputs for trend analysis (week-to-week usage changes):
//   - data/generated/player-usage-history/<season>/week-NN.json -- immutable
//     per-week archive of EVERY player's usage (not just locks), one file per
//     week, never overwritten.
//   - data/generated/player-usage-trends-<season>.json -- consolidated
//     per-player time series across all weeks seen so far, merged (not
//     overwritten) each run -- the file to check for "is this player's usage
//     trending up or down."

//
// Usage:
//   node scripts/build-week-usage-locks.js [--season 2026] [--week N]
//     [--weekly <path>] [--dry-run]
// ═══════════════════════════════════════════════════════════════════════════════

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTeamAbbreviation } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NFLVERSE = path.join(ROOT, 'data', 'vault-seed', 'nflverse');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const DRY = has('--dry-run');

function defaultSeason() {
  const now = new Date();
  const y = now.getUTCFullYear();
  return now.getUTCMonth() + 1 >= 3 ? y : y - 1; // NFL seasons named for kickoff year (Sept-Feb)
}

const SEASON = Number(getArg('--season', String(defaultSeason())));
const WEEKLY_PATH = getArg('--weekly', path.join(NFLVERSE, 'player_stats_weekly.csv'));
const OUT_DIR = path.join(ROOT, 'data', 'projected-starters', String(SEASON), 'manual');
const OUT_PATH = path.join(OUT_DIR, 'week-usage-locks.json');
const PROJECTED_STARTERS_PATH = path.join(ROOT, 'data', 'projected-starters', String(SEASON), 'latest.json');
const RECEIVER_ROLES_PATH = path.join(ROOT, 'data', 'secondary-matchups', 'manual', 'receiver-roles-2026.json');
const HISTORY_DIR = path.join(ROOT, 'data', 'generated', 'player-usage-history', String(SEASON));
const TRENDS_PATH = path.join(ROOT, 'data', 'generated', `player-usage-trends-${SEASON}.json`);

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

async function loadTable(p) {
  const raw = await readFile(p, 'utf8');
  const rows = parseCSV(raw);
  const header = rows[0];
  return rows.slice(1).filter((r) => r.length === header.length).map((r) => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
}

async function readJsonSafe(p, fallback) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

// Position-specific: [usage function, min volume floor]
const POSITION_RULES = {
  QB: { usage: (r) => num(r.attempts) || 0, floor: 20 },
  RB: { usage: (r) => (num(r.carries) || 0) + (num(r.targets) || 0) * 0.5, floor: 12 },
  WR: { usage: (r) => num(r.targets) || 0, floor: 6 },
  TE: { usage: (r) => num(r.targets) || 0, floor: 4 },
};
const DOMINANCE_RATIO = 1.8;

const CONFIDENCE = {
  QB: { starter_confidence: 0.95, roster_confidence: 0.95, needs_human_review: false, impact_bucket: 'qb_major' },
  RB: { starter_confidence: 0.80, roster_confidence: 0.85, needs_human_review: true, impact_bucket: 'rb_major' },
  WR: { starter_confidence: 0.65, roster_confidence: 0.75, needs_human_review: true, impact_bucket: 'wr_uncertain' },
  TE: { starter_confidence: 0.70, roster_confidence: 0.80, needs_human_review: true, impact_bucket: 'te_uncertain' },
};

async function run() {
  console.log(`\n[${new Date().toISOString()}] WeekUsageLocksAgent start (season=${SEASON})`);

  let rows;
  try {
    rows = await loadTable(WEEKLY_PATH);
  } catch (err) {
    console.warn(`  Could not read ${WEEKLY_PATH}: ${err.message} -- skipping (no player_stats_weekly.csv yet?)`);
    return;
  }

  const seasonRows = rows.filter((r) => Number(r.season) === SEASON && r.season_type === 'REG');
  if (!seasonRows.length) {
    console.warn(`  No REG-season rows found for season ${SEASON} in ${WEEKLY_PATH} -- skipping.`);
    return;
  }

  const requestedWeek = getArg('--week', null);
  const latestWeek = requestedWeek ? Number(requestedWeek) : Math.max(...seasonRows.map((r) => Number(r.week) || 0));
  const weekRows = seasonRows.filter((r) => Number(r.week) === latestWeek);
  console.log(`  Using week ${latestWeek} (${weekRows.length} player rows).`);

  // Players already covered by the existing projected-starters snapshot + receiver-roles
  const covered = new Set();
  const ps = await readJsonSafe(PROJECTED_STARTERS_PATH, { players: [] });
  for (const p of ps.players || []) covered.add(`${p.team}|${String(p.player_name).toLowerCase()}`);
  const rr = await readJsonSafe(RECEIVER_ROLES_PATH, []);
  for (const p of rr) covered.add(`${p.team}|${String(p.player_name).toLowerCase()}`);

  // Bucket usage by team+position
  const usage = new Map(); // key: `${team}|${pos}` -> Map(name -> usage)
  for (const r of weekRows) {
    const pos = r.position;
    const rule = POSITION_RULES[pos];
    if (!rule) continue;
    const team = getTeamAbbreviation(r.team) || r.team;
    const name = r.player_display_name || r.player_name;
    if (!team || !name) continue;
    const key = `${team}|${pos}`;
    if (!usage.has(key)) usage.set(key, new Map());
    const m = usage.get(key);
    m.set(name, (m.get(name) || 0) + rule.usage(r));
  }

  // Full usage table for this week (every player considered, not just the winner) --
  // this is what feeds the trend history/archive below, independent of the lock decision.
  const weekUsageTable = [];
  for (const [key, m] of usage.entries()) {
    const [team, pos] = key.split('|');
    for (const [name, val] of m.entries()) {
      weekUsageTable.push({ team, position: pos, player_name: name, usage: Number(val.toFixed(2)) });
    }
  }
  weekUsageTable.sort((a, b) => (a.team < b.team ? -1 : a.team > b.team ? 1 : b.usage - a.usage));

  const players = [];
  for (const [key, m] of usage.entries()) {
    const [team, pos] = key.split('|');
    const ranked = [...m.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) continue;
    const [topName, topVal] = ranked[0];
    const secondVal = ranked[1]?.[1] || 0;
    const rule = POSITION_RULES[pos];
    if (topVal < rule.floor) continue;
    const dominant = secondVal === 0 || topVal >= secondVal * DOMINANCE_RATIO;
    if (!dominant) continue;
    if (covered.has(`${team}|${topName.toLowerCase()}`)) continue;

    const conf = CONFIDENCE[pos];
    players.push({
      player_name: topName,
      team,
      position: pos,
      role: 'starter',
      starter_confidence: conf.starter_confidence,
      roster_confidence: conf.roster_confidence,
      confidence_basis: 'manual_depth_chart',
      impact_bucket: conf.impact_bucket,
      needs_human_review: conf.needs_human_review,
      evidence_tags: ['locked_starter', 'weekly_usage_dominant'],
      evidence: (
        `Week ${latestWeek} ${SEASON} usage leader at ${pos} for ${team} ` +
        `(usage score ${topVal.toFixed(1)} vs runner-up ${secondVal.toFixed(1)}) -- ` +
        `single-game sample, re-verify weekly for RB/WR/TE committee shifts.`
      ),
    });
  }

  players.sort((a, b) => (a.team < b.team ? -1 : a.team > b.team ? 1 : a.position.localeCompare(b.position)));

  const out = {
    meta: {
      description: (
        'Auto-refreshed weekly pass seeding obvious starters missed by the ' +
        'injury-report heuristic in build-projected-starters.js. Derived from ' +
        `real Week ${latestWeek} ${SEASON} usage stats (player_stats_weekly.csv) -- ` +
        'top usage player at each team/position where usage clearly dominates the ' +
        `next player at that position (>= ${DOMINANCE_RATIO}x, above a position-specific ` +
        'volume floor). QBs are high-confidence; RB/WR/TE are single-game samples ' +
        'and flagged needs_human_review. This file is fully overwritten each run -- ' +
        'it never accumulates stale entries from prior weeks.'
      ),
      derived_from: `data/vault-seed/nflverse/player_stats_weekly.csv (season ${SEASON}, week ${latestWeek})`,
      generated_by: 'scripts/build-week-usage-locks.js (Tuesday cadence)',
      season: SEASON,
      week: latestWeek,
      generated_at: new Date().toISOString(),
    },
    players,
  };

  console.log(`  ${players.length} lock candidate(s) found (not already covered elsewhere).`);

  if (DRY) {
    console.log('  Dry run -- not writing file.');
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`  Wrote ${OUT_PATH}`);

  // ── Archive: immutable per-week snapshot of the FULL usage table (every player
  // considered, not just locks) -- never overwritten, one file per week, so raw
  // week-by-week numbers stay available even if the dominance thresholds above change.
  await mkdir(HISTORY_DIR, { recursive: true });
  const weekPad = String(latestWeek).padStart(2, '0');
  const historyPath = path.join(HISTORY_DIR, `week-${weekPad}.json`);
  await writeFile(historyPath, `${JSON.stringify({
    season: SEASON,
    week: latestWeek,
    generated_at: new Date().toISOString(),
    players: weekUsageTable,
  }, null, 2)}\n`);
  console.log(`  Archived ${weekUsageTable.length} player usage row(s) -> ${historyPath}`);

  // ── Trends: consolidated per-player time series across all weeks seen so far.
  // Merged into the existing file (never wholesale-overwritten) so prior weeks'
  // numbers are preserved -- this is what answers "is this player's usage trending
  // up or down week to week."
  const trends = await readJsonSafe(TRENDS_PATH, { season: SEASON, players: {} });
  for (const row of weekUsageTable) {
    const key = `${row.team}|${row.position}|${row.player_name}`;
    if (!trends.players[key]) {
      trends.players[key] = {
        team: row.team,
        position: row.position,
        player_name: row.player_name,
        weekly: {},
      };
    }
    trends.players[key].weekly[String(latestWeek)] = row.usage;
  }
  trends.last_updated_week = latestWeek;
  trends.generated_at = new Date().toISOString();
  await mkdir(path.dirname(TRENDS_PATH), { recursive: true });
  await writeFile(TRENDS_PATH, `${JSON.stringify(trends, null, 2)}\n`);
  console.log(`  Updated trend history (${Object.keys(trends.players).length} player(s) tracked) -> ${TRENDS_PATH}`);
}

run().catch((err) => {
  console.error('WeekUsageLocksAgent error:', err.message);
  process.exit(1);
});
