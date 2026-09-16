/**
 * sync-yahoo-fantasy.mjs
 *
 * Pulls live rosters, starters, bench assignments, and matchups for all
 * fantasy teams on the authenticated Yahoo account.
 *
 * Enriches each player with Week 1 NFL schedule kickoff windows:
 *   - 'early': Sunday 1:00 PM ET (Morning Games) -> Primary drop evaluation window
 *   - 'afternoon': Sunday 4:05 / 4:25 PM ET -> Secondary drop evaluation window
 *   - 'snf': Sunday 8:20 PM ET (DAL @ NYG) -> Kicker pickup window 1
 *   - 'mnf': Monday 8:15 PM ET (DEN @ KC) -> Kicker pickup window 2
 *   - 'concluded': Thursday / Wednesday kickoff -> Already played
 *
 * Emits:
 *   data/fantasy/yahoo-live-rosters.json
 *
 * Usage:
 *   node scripts/sync-yahoo-fantasy.mjs
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

function normalizeTeamAbbr(abbr) {
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

function classifyWindow(timeStr, gameStatus) {
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

export async function syncYahooFantasy({ week = 1 } = {}) {
  console.log('🏈 Syncing Yahoo Fantasy Rosters & Bench Drop Matrix...');

  // 1. Load NFL Schedule
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

  // 2. Fetch User Teams from Yahoo
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

  // 3. Build Unified Bench Drop Candidates Matrix
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

  // 4. Target Kickers Radar (SNF & MNF Available Targets with live league availability)
  const targetKickersDefs = [
    {
      playerKey: '470.p.40819',
      name: 'Brandon Aubrey',
      nflTeam: 'DAL',
      opponent: 'NYG',
      game: 'DAL @ NYG',
      window: 'snf',
      time: 'Sun 8:20 PM ET',
      venue: 'MetLife Stadium (East Rutherford, NJ)',
      status: 'Elite Range & Accuracy'
    },
    {
      playerKey: '470.p.30426',
      name: 'Younghoe Koo',
      nflTeam: 'NYG',
      opponent: 'DAL',
      game: 'DAL @ NYG',
      window: 'snf',
      time: 'Sun 8:20 PM ET',
      venue: 'MetLife Stadium (East Rutherford, NJ)',
      status: 'Starting NYG Kicker'
    },
    {
      playerKey: '470.p.30346',
      name: 'Harrison Butker',
      nflTeam: 'KC',
      opponent: 'DEN',
      game: 'DEN @ KC',
      window: 'mnf',
      time: 'Mon 8:15 PM ET',
      venue: 'GEHA Field at Arrowhead Stadium (Kansas City, MO)',
      status: 'Top-Tier High-Powered Offense'
    },
    {
      playerKey: '470.p.29754',
      name: 'Wil Lutz',
      nflTeam: 'DEN',
      opponent: 'KC',
      game: 'DEN @ KC',
      window: 'mnf',
      time: 'Mon 8:15 PM ET',
      venue: 'GEHA Field at Arrowhead Stadium (Kansas City, MO)',
      status: 'Reliable Payton Weapon'
    }
  ];

  const targetKeysStr = targetKickersDefs.map(k => k.playerKey).join(',');
  const targetKickers = targetKickersDefs.map(k => ({ ...k, leagues: [] }));

  console.log(`\n🔍 Checking target kicker availability across ${leaguesOutput.length} user leagues...`);
  for (const l of leaguesOutput) {
    const leagueId = l.leagueKey.split('.l.')[1];
    try {
      const resp = await yget(`league/${l.leagueKey}/players;player_keys=${targetKeysStr}/ownership`);
      const pNodes = findAll(resp?.fantasy_content ?? resp, 'player');
      for (const node of pNodes) {
        const flat = deepCollect(node);
        const pKey = flat.player_key;
        const matched = targetKickers.find(k => k.playerKey === pKey);
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
      for (const k of targetKickers) {
        k.leagues.push({
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

  // Re-compile Sunday live tracker HTML
  try {
    const { generateLiveTracker } = await import('./generate-live-tracker.mjs');
    await generateLiveTracker({ week });
  } catch (e) {
    console.warn('⚠️ Could not recompile live tracker automatically:', e.message);
  }

  return payload;
}

if (process.argv[1] && process.argv[1].endsWith('sync-yahoo-fantasy.mjs')) {
  syncYahooFantasy().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
}
