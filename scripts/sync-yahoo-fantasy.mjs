/**
 * sync-yahoo-fantasy.mjs
 *
 * Pulls live rosters, starters, bench assignments, and matchups for all
 * fantasy teams on the authenticated Yahoo account.
 *
 * Auto-detects the current NFL week from Yahoo's own league scoreboard
 * metadata on every run (no hardcoded week number), and threads that week
 * through the schedule lookup, matchup fetch, and player-stats fetch below --
 * so this keeps working correctly all season without manual edits. Pass
 * --week N to override (useful for backfills or testing a specific week).
 *
 * Enriches each player with that week's NFL schedule kickoff windows:
 *   - 'early': Sunday 1:00 PM ET (Morning Games) -> Primary drop evaluation window
 *   - 'afternoon': Sunday 4:05 / 4:25 PM ET -> Secondary drop evaluation window
 *   - 'snf': Sunday 8:20 PM ET -> Kicker pickup window 1
 *   - 'mnf': Monday night -> Kicker pickup window 2
 *   - 'concluded': Thursday / Wednesday kickoff -> Already played
 *
 * Emits:
 *   data/fantasy/yahoo-live-rosters.json
 *
 * Usage:
 *   node scripts/sync-yahoo-fantasy.mjs
 *   node scripts/sync-yahoo-fantasy.mjs --week 4   # manual override
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { yget, findAll, deepCollect } from '../agents/lib/yahoo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const OUT_PATH = path.join(ROOT, 'data', 'fantasy', 'yahoo-live-rosters.json');
const SCHEDULE_PATH = path.join(ROOT, 'public', 'schedule.json');

export function normalizeTeamAbbr(abbr) {
  if (!abbr) return '';
  const map = {
    'chi': 'CHI', 'car': 'CAR', 'buf': 'BUF', 'hou': 'HOU',
    'tb': 'TB', 'cin': 'CIN', 'bal': 'BAL', 'ind': 'IND',
    'nyj': 'NYJ', 'ten': 'TEN', 'was': 'WAS', 'phi': 'PHI',
    'cle': 'CLE', 'jax': 'JAX', 'no': 'NO', 'det': 'DET',
    'ari': 'ARI', 'lac': 'LAC', 'mia': 'MIA', 'lv': 'LV',
    'gb': 'GB', 'min': 'MIN', 'atl': 'ATL', 'pit': 'PIT',
    'dal': 'DAL', 'nyg': 'NYG', 'den': 'DEN', 'kc': 'KC',
    'ne': 'NE', 'sea': 'SEA', 'lar': 'LAR', 'sf': 'SF'
  };
  return map[abbr.toLowerCase()] || abbr.toUpperCase();
}

export function classifyWindow(timeStr, gameStatus) {
  const t = (timeStr || '').toLowerCase();
  if (t.includes('thu') || t.includes('wed') || gameStatus === 'post' || gameStatus === 'final') {
    return 'concluded';
  }
  if (t.includes('mon')) return 'mnf';
  if (t.includes('sun 8:') || t.includes('sun 8.2') || t.includes('8:20')) return 'snf';
  if (t.includes('sun 4:') || t.includes('4:05') || t.includes('4:25')) return 'afternoon';
  if (t.includes('sun 1') || t.includes('1:00') || t.includes('1 pm')) return 'early';
  return 'early';
}

export const TEAM_VENUES = {
  ARI: 'State Farm Stadium (Glendale, AZ)',
  ATL: 'Mercedes-Benz Stadium (Atlanta, GA)',
  BAL: 'M&T Bank Stadium (Baltimore, MD)',
  BUF: 'Highmark Stadium (Orchard Park, NY)',
  CAR: 'Bank of America Stadium (Charlotte, NC)',
  CHI: 'Soldier Field (Chicago, IL)',
  CIN: 'Paycor Stadium (Cincinnati, OH)',
  CLE: 'Huntington Bank Field (Cleveland, OH)',
  DAL: 'AT&T Stadium (Arlington, TX)',
  DEN: 'Empower Field at Mile High (Denver, CO)',
  DET: 'Ford Field (Detroit, MI)',
  GB: 'Lambeau Field (Green Bay, WI)',
  HOU: 'NRG Stadium (Houston, TX)',
  IND: 'Lucas Oil Stadium (Indianapolis, IN)',
  JAX: 'EverBank Stadium (Jacksonville, FL)',
  KC: 'GEHA Field at Arrowhead Stadium (Kansas City, MO)',
  LAC: 'SoFi Stadium (Inglewood, CA)',
  LAR: 'SoFi Stadium (Inglewood, CA)',
  LV: 'Allegiant Stadium (Las Vegas, NV)',
  MIA: 'Hard Rock Stadium (Miami Gardens, FL)',
  MIN: 'U.S. Bank Stadium (Minneapolis, MN)',
  NE: 'Gillette Stadium (Foxborough, MA)',
  NO: 'Caesars Superdome (New Orleans, LA)',
  NYG: 'MetLife Stadium (East Rutherford, NJ)',
  NYJ: 'MetLife Stadium (East Rutherford, NJ)',
  PHI: 'Lincoln Financial Field (Philadelphia, PA)',
  PIT: 'Acrisure Stadium (Pittsburgh, PA)',
  SEA: 'Lumen Field (Seattle, WA)',
  SF: "Levi's Stadium (Santa Clara, CA)",
  TB: 'Raymond James Stadium (Tampa, FL)',
  TEN: 'Nissan Stadium (Nashville, TN)',
  WAS: 'Northwest Stadium (Landover, MD)'
};

export const WINDOW_LABELS = {
  early: 'Sunday Early Window',
  afternoon: 'Sunday Afternoon Window',
  snf: 'Sunday Night Football',
  mnf: 'Monday Night Football'
};

// Fetch every fantasy team the authenticated Yahoo account plays on. Shared
// by syncYahooFantasy() and any script (e.g. build-available-players-radar.mjs)
// that needs the league list without re-deriving it.
export async function fetchUserTeams() {
  const tj = await yget('users;use_login=1/games;game_keys=nfl/teams');
  const myTeamNodes = findAll(tj?.fantasy_content ?? tj, 'team');
  const userTeams = [];

  for (const node of myTeamNodes) {
    const flat = deepCollect(node);
    if (flat.team_key) {
      userTeams.push({
        teamKey: flat.team_key,
        teamName: flat.name || 'Fat Lazy Americans',
        leagueKey: flat.team_key.split('.t.')[0],
        teamId: flat.team_id || flat.team_key.split('.t.')[1]
      });
    }
  }

  console.log(`   Found ${userTeams.length} fantasy teams on authenticated account.`);
  return userTeams;
}

// Resolve the current NFL week automatically. Yahoo tracks this per league in
// scoreboard metadata (current_week) -- ask for it without a ;week= qualifier
// to get whatever Yahoo considers "now", rather than ever hardcoding a number
// that goes stale the moment the season moves on. An explicit override always
// wins; auto-detect failure falls back to week 1 with a loud warning instead
// of failing silently. Shared by every script that needs "what week is it."
export async function resolveCurrentWeek(userTeams, weekOverride, meta = {}) {
  // Probe EVERY league, not just the first. A single flaky request used to drop
  // us to the week-1 fallback even with four other leagues able to answer, and
  // that wrong week then got passed straight into the live tracker rebuild.
  let week = weekOverride;
  meta.autoDetected = Boolean(weekOverride);
  if (!week) {
    for (const ut of userTeams) {
      try {
        const probeJson = await yget(`league/${ut.leagueKey}/scoreboard`);
        const probeMeta = deepCollect((probeJson?.fantasy_content?.league ?? [])[0] ?? {});
        const w = Number(probeMeta.current_week);
        if (w) { week = w; meta.autoDetected = true; break; }
      } catch (err) {
        console.warn(`⚠️ Week probe failed on ${ut.leagueKey}: ${err.message}`);
      }
    }
  }
  if (!week) {
    week = 1;
    meta.autoDetected = false;
    console.warn('⚠️ Falling back to week 1 -- no league could report the current week.');
  }
  console.log(`   Using NFL week ${week}${weekOverride ? ' (manual override)' : (meta.autoDetected ? ' (auto-detected)' : ' (GUESSED)')}.`);
  return week;
}

// Build the team -> this-week's-game lookup from public/schedule.json. Shared
// by every script that enriches a player with "who do they play, and when."
export async function buildTeamGameMap(week) {
  let scheduleGames = [];
  try {
    const rawSched = await readFile(SCHEDULE_PATH, 'utf8');
    scheduleGames = JSON.parse(rawSched).filter(g => g.week === week);
  } catch (err) {
    console.warn('⚠️ Could not load public/schedule.json:', err.message);
  }

  const teamGameMap = {};
  for (const g of scheduleGames) {
    const vis = normalizeTeamAbbr(g.visitor);
    const hm = normalizeTeamAbbr(g.home);
    const window = classifyWindow(g.time, g.status);
    const gameObj = {
      gameId: g.id || g.game_id,
      visitor: vis,
      home: hm,
      matchup: `${vis} @ ${hm}`,
      time: g.time,
      kickoffUtc: g.kickoff_utc,
      status: g.status,
      window
    };
    teamGameMap[vis] = { ...gameObj, isHome: false, opponent: hm };
    teamGameMap[hm] = { ...gameObj, isHome: true, opponent: vis };
  }
  return teamGameMap;
}

export async function syncYahooFantasy({ week: weekOverride } = {}) {
  console.log('🏈 Syncing Yahoo Fantasy Rosters & Bench Drop Matrix...');

  // 1. Fetch User Teams from Yahoo
  const userTeams = await fetchUserTeams();

  // 2. Resolve the current NFL week automatically (see resolveCurrentWeek above).
  const weekMeta = {};
  let week = await resolveCurrentWeek(userTeams, weekOverride, weekMeta);

  // 3. Load NFL Schedule for that week
  const teamGameMap = await buildTeamGameMap(week);

  const leaguesOutput = [];
  const allBenchPlayers = [];

  for (const ut of userTeams) {
    // A. League scoreboard & matchup
    const sj = await yget(`league/${ut.leagueKey}/scoreboard;week=${week}`);
    const leagueMeta = deepCollect((sj?.fantasy_content?.league ?? [])[0] ?? {});
    const leagueName = leagueMeta.name || ut.leagueKey;
    const currentWeek = Number(leagueMeta.current_week || week);

    const matchupNodes = findAll(sj?.fantasy_content ?? sj, 'matchup');
    let matchupInfo = {
      opponentName: 'TBD',
      opponentKey: null,
      myScore: 0,
      opponentScore: 0,
      status: 'pre',
      myWinProb: null
    };

    for (const mNode of matchupNodes) {
      const teamNodes = findAll(mNode, 'team');
      const teams = teamNodes.map(t => deepCollect(t));
      const myIndex = teams.findIndex(t => t.team_key === ut.teamKey);
      if (myIndex !== -1 && teams.length === 2) {
        const me = teams[myIndex];
        const opp = teams[1 - myIndex];
        const mMeta = deepCollect(mNode);
        matchupInfo = {
          opponentName: opp.name || 'Opponent',
          opponentKey: opp.team_key,
          myScore: Number(me.total || 0),
          opponentScore: Number(opp.total || 0),
          status: mMeta.status || 'pre',
          myWinProb: me.win_probability ? Number(me.win_probability) : null
        };
        break;
      }
    }

    // B. Team Roster
    const rosterRes = await yget(`team/${ut.teamKey}/roster`);
    const playerNodes = findAll(rosterRes.fantasy_content, 'player');

    const pKeys = playerNodes.map(p => (deepCollect(p[0] || p)).player_key).filter(Boolean);
    const playerPointsMap = {};
    if (pKeys.length > 0) {
      try {
        const statsRes = await yget(`league/${ut.leagueKey}/players;player_keys=${pKeys.join(',')}/stats;type=week;week=${week}`);
        const statPlayers = findAll(statsRes.fantasy_content, 'player');
        for (const sp of statPlayers) {
          const flatSp = deepCollect(sp);
          if (flatSp.player_key && flatSp.total != null) {
            playerPointsMap[flatSp.player_key] = Number(flatSp.total);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch player points for ${leagueName}:`, err.message);
      }
    }

    const starters = [];
    const bench = [];
    let hasStartingKicker = false;
    let startingKickerName = null;

    for (const p of playerNodes) {
      const info = deepCollect(p[0] || p);
      if (!info.player_key) continue;

      let selectedPos = 'BN';
      for (const item of (Array.isArray(p) ? p : [p])) {
        if (item && item.selected_position) {
          const spFlat = deepCollect(item.selected_position);
          if (spFlat.position) selectedPos = spFlat.position;
        }
      }

      const teamAbbr = normalizeTeamAbbr(info.editorial_team_abbr);
      const gameInfo = teamGameMap[teamAbbr] || {
        gameId: null,
        matchup: `${teamAbbr} Game`,
        time: 'TBD',
        status: 'pre',
        window: 'early',
        opponent: 'TBD',
        isHome: false
      };

      const fantasyPoints = playerPointsMap[info.player_key] != null ? playerPointsMap[info.player_key] : null;

      const pObj = {
        playerKey: info.player_key,
        playerId: info.player_id,
        name: info.name || info.full,
        displayPosition: info.display_position || info.primary_position,
        selectedPosition: selectedPos,
        nflTeam: teamAbbr,
        nflTeamFull: info.editorial_team_full_name || '',
        uniformNumber: info.uniform_number || '',
        headshotUrl: info.headshot?.url || info.image_url || '',
        isUndroppable: info.is_undroppable === '1' || info.is_undroppable === 1,
        byeWeek: info.bye_weeks?.week ? Number(info.bye_weeks.week) : null,
        status: info.status || '', // e.g. Q, IR, O, or blank
        game: gameInfo,
        fantasyPoints,
        leagueKey: ut.leagueKey,
        leagueName,
        teamKey: ut.teamKey,
        teamName: ut.teamName
      };

      const isDefensive = ['DEF', 'D', 'LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S'].includes(String(pObj.displayPosition || pObj.selectedPosition || '').toUpperCase());
      if (selectedPos === 'BN' || selectedPos === 'IR') {
        if (!isDefensive) {
          bench.push(pObj);
          allBenchPlayers.push(pObj);
        }
      } else {
        starters.push(pObj);
        if (selectedPos === 'K') {
          hasStartingKicker = true;
          startingKickerName = pObj.name;
        }
      }
    }

    leaguesOutput.push({
      leagueKey: ut.leagueKey,
      leagueName,
      teamKey: ut.teamKey,
      teamName: ut.teamName,
      week: currentWeek,
      matchup: matchupInfo,
      hasStartingKicker,
      startingKickerName,
      needsKickerDrop: !hasStartingKicker,
      startersCount: starters.length,
      benchCount: bench.length,
      starters,
      bench
    });

    console.log(`   ✅ ${leagueName}: ${ut.teamName} [${hasStartingKicker ? `K: ${startingKickerName}` : '⚠️ NO KICKER'}] (Starters: ${starters.length}, Bench: ${bench.length})`);
  }

  // 4. Build Unified Bench Drop Candidates Matrix
  // Group duplicate rostered bench players across multiple leagues
  const benchMap = new Map();
  for (const bp of allBenchPlayers) {
    const key = bp.name.toLowerCase().trim();
    if (!benchMap.has(key)) {
      benchMap.set(key, {
        name: bp.name,
        displayPosition: bp.displayPosition,
        nflTeam: bp.nflTeam,
        uniformNumber: bp.uniformNumber,
        headshotUrl: bp.headshotUrl,
        status: bp.status,
        game: bp.game,
        window: bp.game.window,
        isUndroppable: bp.isUndroppable,
        rosteredIn: []
      });
    }
    benchMap.get(key).rosteredIn.push({
      leagueKey: bp.leagueKey,
      leagueName: bp.leagueName,
      teamKey: bp.teamKey,
      selectedPosition: bp.selectedPosition,
      needsKickerDrop: leaguesOutput.find(l => l.leagueKey === bp.leagueKey)?.needsKickerDrop || false
    });
  }

  const unifiedBenchList = Array.from(benchMap.values()).sort((a, b) => {
    // Sort order: early morning first, then afternoon, then snf, then mnf, then concluded
    const order = { 'early': 1, 'afternoon': 2, 'snf': 3, 'mnf': 4, 'concluded': 5 };
    const diff = (order[a.window] || 99) - (order[b.window] || 99);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  // 5. Target Kickers Radar -- built fresh every run from this week's real
  // NFL schedule + Yahoo's live kicker pool. Nothing here is a hardcoded
  // player name or matchup: it re-derives "who's playing when" and "who's
  // actually available" every single time, so it never goes stale as the
  // season moves on and never misses a window (early Sunday, Sunday
  // afternoon, SNF, MNF) the way the old fixed 4-player list did.
  //
  // Venue names are the one static lookup table here (TEAM_VENUES below) --
  // stadiums don't change week to week the way rosters and schedules do, so
  // that's a legitimate constant rather than something that needs refetching.
  console.log(`\n🔍 Building dynamic kicker radar for week ${week}...`);

  async function fetchKickerUniverse(leagueKey) {
    const all = [];
    for (let page = 0; page < 2; page++) { // 2 * 25 = 50, comfortably covers all ~32 NFL kickers
      const start = page * 25;
      const resp = await yget(`league/${leagueKey}/players;position=K;sort=OR;start=${start};count=25`);
      const nodes = findAll(resp?.fantasy_content ?? resp, 'player');
      const players = nodes.map(node => {
        const flat = deepCollect(node);
        return {
          playerKey: flat.player_key || null,
          name: flat.name || flat.full || null,
          nflTeam: normalizeTeamAbbr(flat.editorial_team_abbr)
        };
      }).filter(p => p.playerKey && p.name);
      if (players.length === 0) break;
      all.push(...players);
      if (players.length < 25) break;
    }
    return all;
  }

  let targetKickers = [];
  try {
    // Kicker pool is the same NFL-wide universe regardless of which league we
    // ask through -- only per-league ownership differs, checked separately below.
    const kickerUniverse = await fetchKickerUniverse(userTeams[0].leagueKey);

    // One kicker per NFL team. Yahoo's sort=OR (overall rank) means the first
    // entry we see for a given team is effectively that team's starter --
    // backup kickers barely register in fantasy rankings.
    const seenTeams = new Set();
    const candidates = [];
    for (const k of kickerUniverse) {
      if (!k.nflTeam || seenTeams.has(k.nflTeam)) continue;
      const gameInfo = teamGameMap[k.nflTeam];
      if (!gameInfo || gameInfo.window === 'concluded') continue; // already played this week
      seenTeams.add(k.nflTeam);
      candidates.push({
        playerKey: k.playerKey,
        name: k.name,
        nflTeam: k.nflTeam,
        opponent: gameInfo.opponent,
        game: gameInfo.matchup,
        window: gameInfo.window,
        time: gameInfo.time,
        venue: TEAM_VENUES[gameInfo.home] || `${gameInfo.home} Stadium`,
        status: `${gameInfo.isHome ? 'Home' : 'Away'} vs ${gameInfo.opponent} • ${WINDOW_LABELS[gameInfo.window] || gameInfo.window}`,
        leagues: []
      });
    }

    if (candidates.length > 0) {
      const candidateKeysStr = candidates.map(c => c.playerKey).join(',');
      console.log(`   Checking availability of ${candidates.length} candidate kicker(s) across ${leaguesOutput.length} user leagues...`);
      for (const l of leaguesOutput) {
        const leagueId = l.leagueKey.split('.l.')[1];
        try {
          const resp = await yget(`league/${l.leagueKey}/players;player_keys=${candidateKeysStr}/ownership`);
          const pNodes = findAll(resp?.fantasy_content ?? resp, 'player');
          for (const node of pNodes) {
            const flat = deepCollect(node);
            const matched = candidates.find(c => c.playerKey === flat.player_key);
            if (matched) {
              const isAvailable = flat.ownership_type === 'freeagents' || flat.ownership_type === 'waivers';
              matched.leagues.push({
                leagueKey: l.leagueKey,
                leagueId,
                leagueName: l.leagueName,
                status: isAvailable ? 'available' : 'taken',
                owner: flat.owner_team_name || null,
                ownershipType: flat.ownership_type
              });
            }
          }
        } catch (err) {
          console.warn(`   ⚠️ Could not fetch kicker ownership for ${l.leagueName}:`, err.message);
          for (const c of candidates) {
            c.leagues.push({
              leagueKey: l.leagueKey,
              leagueId,
              leagueName: l.leagueName,
              status: 'available',
              owner: null,
              ownershipType: 'unknown'
            });
          }
        }
      }
    }

    // Only surface kickers actually gettable somewhere -- one rostered
    // everywhere isn't a "target," it's just this week's starting kickers list.
    targetKickers = candidates
      .filter(c => c.leagues.some(l => l.status === 'available'))
      .sort((a, b) => {
        const order = { early: 1, afternoon: 2, snf: 3, mnf: 4 };
        const diff = (order[a.window] || 99) - (order[b.window] || 99);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      });

    console.log(`   Found ${targetKickers.length} streamable kicker(s) available in at least one league.`);
  } catch (err) {
    console.warn('⚠️ Could not build dynamic kicker radar:', err.message);
  }

  // The per-league current_week values are authoritative -- they come back with
  // the roster data itself. If they disagree with the week we resolved up front
  // (a guess, or a stale probe), take theirs. Previously the payload could say
  // week 1 while every league in it said week 2.
  const leagueWeeks = leaguesOutput.map(l => Number(l.week)).filter(Boolean);
  let consensusWeek = null;
  if (leagueWeeks.length) {
    const tally = new Map();
    for (const w of leagueWeeks) tally.set(w, (tally.get(w) || 0) + 1);
    consensusWeek = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  if (consensusWeek && consensusWeek !== week && !weekOverride) {
    console.warn(`⚠️ Week mismatch: resolved ${week}, but ${leagueWeeks.filter(w => w === consensusWeek).length}/${leagueWeeks.length} leagues report ${consensusWeek}. Using ${consensusWeek}.`);
    week = consensusWeek;
    weekMeta.autoDetected = true;
  }

  const payload = {
    syncedAt: new Date().toISOString(),
    week,
    leaguesCount: leaguesOutput.length,
    totalBenchPlayers: allBenchPlayers.length,
    uniqueBenchPlayers: unifiedBenchList.length,
    leaguesNeedingKicker: leaguesOutput.filter(l => l.needsKickerDrop).length,
    targetKickers,
    leagues: leaguesOutput,
    unifiedBench: unifiedBenchList
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n💾 Saved live fantasy payload -> ${OUT_PATH}`);
  console.log(`   Total Leagues: ${leaguesOutput.length} | Bench Players: ${unifiedBenchList.length} unique (${allBenchPlayers.length} total across leagues)`);
  console.log(`   Leagues Needing Kicker: ${payload.leaguesNeedingKicker} of ${leaguesOutput.length}`);

  // Also copy to public/ for client-side live fetch/hydration
  const PUBLIC_OUT = path.join(ROOT, 'public', 'yahoo-live-rosters.json');
  try {
    await writeFile(PUBLIC_OUT, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {}

  // Re-compile Sunday live tracker HTML. Skipped when the week is a guess: a
  // stale tracker is recoverable, a tracker rebuilt for the wrong week wipes the
  // live board and every card on it.
  if (!weekMeta.autoDetected && !weekOverride) {
    console.warn('⚠️ Skipping live tracker rebuild -- week could not be confirmed, ' +
                 'and rebuilding at a guessed week would overwrite the current board. ' +
                 'Run: node scripts/generate-live-tracker.mjs --week <N>');
  } else {
    try {
      const { generateLiveTracker } = await import('./generate-live-tracker.mjs');
      await generateLiveTracker({ week });
    } catch (e) {
      console.warn('⚠️ Could not recompile live tracker automatically:', e.message);
    }
  }

  // Refresh the all-positions Available Players Radar (offense, DEF, IDP).
  // Chained here -- not a separate Task Scheduler entry -- so this runs
  // automatically every night alongside the roster sync, reusing the week
  // and schedule data already computed above instead of re-fetching it.
  try {
    const { buildAvailablePlayersRadar } = await import('./build-available-players-radar.mjs');
    await buildAvailablePlayersRadar({ week, teamGameMap });
  } catch (e) {
    console.warn('⚠️ Could not build available players radar automatically:', e.message);
  }

  return payload;
}

if (process.argv[1] && process.argv[1].endsWith('sync-yahoo-fantasy.mjs')) {
  const cliArgs = process.argv.slice(2);
  const weekArgIdx = cliArgs.indexOf('--week');
  const weekOverride = weekArgIdx >= 0 && cliArgs[weekArgIdx + 1] ? Number(cliArgs[weekArgIdx + 1]) : undefined;
  syncYahooFantasy({ week: weekOverride }).catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
}
