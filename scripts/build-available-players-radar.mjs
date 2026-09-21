/**
 * build-available-players-radar.mjs
 *
 * Dynamic, schedule-aware "who's available" radar across every roster
 * position each league actually uses -- offense (QB/RB/WR/TE), team defense
 * (DEF), and individual defensive players (LB/DB/DL/DE/DT/CB/S) -- not just
 * kickers (kickers already have their own dedicated radar in
 * sync-yahoo-fantasy.mjs and are intentionally left out of this one).
 *
 * Nothing about "which positions to check" is hardcoded: for each league this
 * reads that league's own roster settings from Yahoo (league/{key}/settings ->
 * roster_positions) and only queries the positions that league's format
 * actually rosters. A league with a generic IDP/"D" flex slot gets the full
 * individual-defense position set queried automatically; a league with no
 * defense slot at all won't waste calls on it. If settings can't be read for
 * some reason, it falls back to checking every supported position rather than
 * silently skipping the league.
 *
 * Week detection and schedule enrichment (opponent, game, kickoff window,
 * venue) reuse the exact same helpers sync-yahoo-fantasy.mjs uses, imported
 * from that file, so the two scripts can never drift out of sync on "what
 * week is it" or "who's playing when."
 *
 * Unlike the kicker radar, a player whose team already played this week is
 * NOT excluded here -- a good waiver add is about ongoing roster value, not
 * just this week's single kickoff, so byes/concluded games are labeled, not
 * dropped.
 *
 * Chained automatically at the end of sync-yahoo-fantasy.mjs's nightly run --
 * no separate Task Scheduler entry needed. Also runnable standalone.
 *
 * Usage:
 *   node scripts/build-available-players-radar.mjs
 *   node scripts/build-available-players-radar.mjs --week 4
 *   node scripts/build-available-players-radar.mjs --max-per-position 20 --pages 2
 *
 * Emits:
 *   data/fantasy/available-players-radar.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { yget, findAll, deepCollect, collectionItems } from '../agents/lib/yahoo.js';
import {
  normalizeTeamAbbr,
  TEAM_VENUES,
  WINDOW_LABELS,
  fetchUserTeams,
  resolveCurrentWeek,
  buildTeamGameMap
} from './sync-yahoo-fantasy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ROSTERS_PATH = path.join(ROOT, 'data', 'fantasy', 'yahoo-live-rosters.json');
const OUT_DIR = path.join(ROOT, 'data', 'fantasy');
const OUT_PATH = path.join(OUT_DIR, 'available-players-radar.json');

// Single, literal Yahoo position codes that are valid `position=` free-agent
// search filters. Kickers (K) are intentionally excluded -- they already have
// a dedicated, always-on radar in sync-yahoo-fantasy.mjs.
export const QUERYABLE_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'DEF', 'LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S'];
const IDP_POSITIONS = ['LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    week: get('--week', undefined),
    maxPerPosition: Number(get('--max-per-position', '15')),
    pages: Number(get('--pages', '1')), // 1 page = up to 25 fetched/position/league before slicing to maxPerPosition
  };
}

// Prefer the league list already captured by the nightly sync (fast, no extra
// API calls); fall back to a live team lookup if that file isn't there yet
// (e.g. running this script standalone before sync-yahoo-fantasy.mjs ever ran).
async function loadLeagues() {
  try {
    const raw = await readFile(ROSTERS_PATH, 'utf8');
    const data = JSON.parse(raw);
    const seen = new Map();
    for (const lg of data.leagues || []) {
      if (!seen.has(lg.leagueKey)) seen.set(lg.leagueKey, { leagueKey: lg.leagueKey, leagueName: lg.leagueName });
    }
    if (seen.size > 0) return [...seen.values()];
  } catch (err) {
    console.warn('⚠️ Could not read yahoo-live-rosters.json, falling back to a live team lookup:', err.message);
  }
  const userTeams = await fetchUserTeams();
  const seen = new Map();
  for (const ut of userTeams) {
    if (!seen.has(ut.leagueKey)) seen.set(ut.leagueKey, { leagueKey: ut.leagueKey, leagueName: ut.leagueKey });
  }
  return [...seen.values()];
}

// Pull a league's actual roster slot configuration from Yahoo -- the real
// source of truth for "does this league use IDP / team defense at all,"
// rather than guessing from one team's currently-rostered players.
async function fetchLeagueRosterPositions(leagueKey) {
  const sj = await yget(`league/${leagueKey}/settings`);
  const settings = findAll(sj?.fantasy_content ?? sj, 'settings')[0] || {};
  const rosterColl = findAll(settings, 'roster_positions')[0];
  const items = collectionItems(rosterColl).map(x => x.roster_position ?? x);
  return items.map(rp => deepCollect(rp)); // -> [{ position, position_type, count, ... }, ...]
}

// Turn a league's raw roster slots into the list of single-position codes
// worth querying: any slot that's already a literal queryable position, plus
// -- if the league has a generic IDP/defense flex slot -- the full individual
// defensive position set (a flex slot like "D" isn't itself queryable; the
// real positions that can fill it are).
function derivePositionsForLeague(rosterPositions) {
  const found = new Set();
  let hasIdpFlex = false;
  for (const rp of rosterPositions) {
    const pos = String(rp.position || '').toUpperCase();
    if (QUERYABLE_POSITIONS.includes(pos)) found.add(pos);
    if (pos === 'D' || pos === 'IDP' || pos === 'DP') hasIdpFlex = true;
  }
  if (hasIdpFlex) {
    for (const p of IDP_POSITIONS) found.add(p);
  }
  return [...found];
}

async function fetchAvailablePool(leagueKey, position, pages) {
  const all = [];
  for (let page = 0; page < pages; page++) {
    const start = page * 25;
    const resp = await yget(`league/${leagueKey}/players;position=${position};status=A;sort=OR;start=${start};count=25`);
    const nodes = findAll(resp?.fantasy_content ?? resp, 'player');
    const players = nodes.map(node => {
      const flat = deepCollect(node);
      return {
        playerKey: flat.player_key || null,
        name: flat.name || flat.full || null,
        position: flat.display_position || flat.primary_position || position,
        nflTeam: normalizeTeamAbbr(flat.editorial_team_abbr),
        injuryStatus: flat.status || null, // Yahoo's own Q/O/IR/etc, distinct from our schedule note below
        ownershipType: flat.ownership_type || null
      };
    }).filter(p => p.playerKey && p.name);
    if (players.length === 0) break;
    all.push(...players);
    if (players.length < 25) break;
  }
  return all;
}

function enrichWithSchedule(player, teamGameMap) {
  const gameInfo = teamGameMap[player.nflTeam];
  if (!gameInfo) {
    return {
      ...player,
      opponent: null,
      game: 'BYE',
      window: 'bye',
      time: null,
      venue: null,
      scheduleNote: 'Bye week (or team not found in this week\'s schedule)'
    };
  }
  return {
    ...player,
    opponent: gameInfo.opponent,
    game: gameInfo.matchup,
    window: gameInfo.window,
    time: gameInfo.time,
    venue: TEAM_VENUES[gameInfo.home] || `${gameInfo.home} Stadium`,
    scheduleNote: `${gameInfo.isHome ? 'Home' : 'Away'} vs ${gameInfo.opponent} \u2022 ${WINDOW_LABELS[gameInfo.window] || gameInfo.window}`
  };
}

export async function buildAvailablePlayersRadar({ week: weekArg, teamGameMap: teamGameMapArg, maxPerPosition = 15, pages = 1 } = {}) {
  console.log('\n📡 Building dynamic Available Players Radar (all positions)...');

  let week = weekArg;
  let teamGameMap = teamGameMapArg;
  if (!teamGameMap) {
    const userTeams = await fetchUserTeams();
    week = await resolveCurrentWeek(userTeams, week);
    teamGameMap = await buildTeamGameMap(week);
  }

  const leagues = await loadLeagues();
  console.log(`   ${leagues.length} league(s) to scan for week ${week}.`);

  const results = [];
  for (const league of leagues) {
    console.log(`\n──── ${league.leagueName} ────`);
    let positions;
    try {
      const rosterPositions = await fetchLeagueRosterPositions(league.leagueKey);
      positions = derivePositionsForLeague(rosterPositions);
      if (positions.length === 0) throw new Error('no recognizable positions in roster settings');
      console.log(`   Roster format detected: ${positions.join(', ')}`);
    } catch (err) {
      positions = [...QUERYABLE_POSITIONS];
      console.warn(`   ⚠️ Could not read roster settings (${err.message}) -- falling back to checking every supported position: ${positions.join(', ')}`);
    }

    const leagueResult = {
      leagueKey: league.leagueKey,
      leagueName: league.leagueName,
      positionsDetected: positions,
      players: {}
    };

    for (const pos of positions) {
      try {
        const raw = await fetchAvailablePool(league.leagueKey, pos, pages);
        const enriched = raw.slice(0, maxPerPosition).map(p => enrichWithSchedule(p, teamGameMap));
        leagueResult.players[pos] = enriched;
        console.log(`   ${pos}: ${enriched.length} available (of ${raw.length} fetched)`);
      } catch (err) {
        console.warn(`   ⚠️ ${pos}: ${err.message}`);
        leagueResult.players[pos] = [];
      }
      await sleep(200); // be a polite API citizen
    }

    results.push(leagueResult);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    week,
    maxPerPosition,
    leagues: results
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n💾 Saved available players radar -> ${OUT_PATH}`);

  return payload;
}

if (process.argv[1] && process.argv[1].endsWith('build-available-players-radar.mjs')) {
  const { week, maxPerPosition, pages } = parseArgs();
  buildAvailablePlayersRadar({
    week: week ? Number(week) : undefined,
    maxPerPosition,
    pages
  }).catch(err => {
    console.error('❌ Available players radar failed:', err);
    process.exitCode = 1;
  });
}
