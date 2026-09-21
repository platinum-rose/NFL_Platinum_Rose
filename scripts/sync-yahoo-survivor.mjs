#!/usr/bin/env node

/**
 * sync-yahoo-survivor.mjs
 *
 * Dedicated sync and tracking pipeline for Yahoo Survival Football leagues.
 * Ingests live league standings, all competitor picks upon lock, entrant metadata
 * (including permanent manager GUIDs for cross-season tracking), and calculates
 * field pick distributions to inform game-theory survivor optimization.
 *
 * Usage:
 *   node scripts/sync-yahoo-survivor.mjs
 *   node scripts/sync-yahoo-survivor.mjs --force
 *   node scripts/sync-yahoo-survivor.mjs --week 1
 *   node scripts/sync-yahoo-survivor.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { yget, collectionItems } from '../agents/lib/yahoo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT, 'data', 'survivor');
const HISTORY_DIR = path.join(DATA_DIR, 'history');
const MASTER_REGISTRY_FILE = path.join(DATA_DIR, 'yahoo-survivor-entrants-2026.json');
const COMPETITOR_PROFILES_FILE = path.join(DATA_DIR, 'yahoo-competitor-profiles.json');

// Canonical Yahoo NFL team ID mapping
export const YAHOO_NFL_TEAMS = {
  '1': { abbr: 'BAL', name: 'Baltimore Ravens' },
  '2': { abbr: 'CIN', name: 'Cincinnati Bengals' },
  '3': { abbr: 'CLE', name: 'Cleveland Browns' },
  '4': { abbr: 'PIT', name: 'Pittsburgh Steelers' },
  '5': { abbr: 'BUF', name: 'Buffalo Bills' },
  '6': { abbr: 'MIA', name: 'Miami Dolphins' },
  '7': { abbr: 'NE',  name: 'New England Patriots' },
  '8': { abbr: 'NYJ', name: 'New York Jets' },
  '9': { abbr: 'HOU', name: 'Houston Texans' },
  '10': { abbr: 'JAX', name: 'Jacksonville Jaguars' },
  '11': { abbr: 'TEN', name: 'Tennessee Titans' },
  '12': { abbr: 'IND', name: 'Indianapolis Colts' },
  '13': { abbr: 'DEN', name: 'Denver Broncos' },
  '14': { abbr: 'KC',  name: 'Kansas City Chiefs' },
  '15': { abbr: 'LV',  name: 'Las Vegas Raiders' },
  '16': { abbr: 'LAC', name: 'Los Angeles Chargers' },
  '17': { abbr: 'DET', name: 'Detroit Lions' },
  '18': { abbr: 'MIN', name: 'Minnesota Vikings' },
  '19': { abbr: 'GB',  name: 'Green Bay Packers' },
  '20': { abbr: 'CHI', name: 'Chicago Bears' },
  '21': { abbr: 'DAL', name: 'Dallas Cowboys' },
  '22': { abbr: 'NYG', name: 'New York Giants' },
  '23': { abbr: 'PHI', name: 'Philadelphia Eagles' },
  '24': { abbr: 'WAS', name: 'Washington Commanders' },
  '25': { abbr: 'ATL', name: 'Atlanta Falcons' },
  '26': { abbr: 'CAR', name: 'Carolina Panthers' },
  '27': { abbr: 'NO',  name: 'New Orleans Saints' },
  '28': { abbr: 'TB',  name: 'Tampa Bay Buccaneers' },
  '29': { abbr: 'ARI', name: 'Arizona Cardinals' },
  '30': { abbr: 'LAR', name: 'Los Angeles Rams' },
  '31': { abbr: 'SF',  name: 'San Francisco 49ers' },
  '32': { abbr: 'SEA', name: 'Seattle Seahawks' }
};

export function resolveTeamPick(raw) {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();
  const m = str.match(/nfl\.t\.(\d+)/);
  if (m && YAHOO_NFL_TEAMS[m[1]]) {
    return YAHOO_NFL_TEAMS[m[1]].abbr;
  }
  const codeMap = {
    bal: 'BAL', cin: 'CIN', cle: 'CLE', pit: 'PIT',
    buf: 'BUF', mia: 'MIA', ne: 'NE', nwe: 'NE', nyj: 'NYJ',
    hou: 'HOU', jax: 'JAX', ten: 'TEN', ind: 'IND',
    den: 'DEN', kc: 'KC', kan: 'KC', lv: 'LV', lvr: 'LV', lac: 'LAC', sd: 'LAC',
    det: 'DET', min: 'MIN', gb: 'GB', gnb: 'GB', chi: 'CHI',
    dal: 'DAL', nyg: 'NYG', phi: 'PHI', was: 'WAS',
    atl: 'ATL', car: 'CAR', no: 'NO', nor: 'NO', tb: 'TB', tam: 'TB',
    ari: 'ARI', la: 'LAR', lar: 'LAR', ram: 'LAR', sf: 'SF', sfo: 'SF', sea: 'SEA'
  };
  return codeMap[str] || str.toUpperCase();
}

async function syncSurvivor() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const weekArgIdx = args.indexOf('--week');
  const targetWeekOverride = weekArgIdx !== -1 ? Number.parseInt(args[weekArgIdx + 1], 10) : null;

  console.log('\n🏈 Yahoo Survival Football — Weekly Sync & Entrant Tracker');
  console.log('═'.repeat(70));

  const groupsRes = await yget('users;use_login=1/games;game_keys=476/groups');
  const userObj = groupsRes.fantasy_content?.users?.['0']?.user;
  const games = userObj ? userObj.find(x => x.games)?.games : null;
  const groupCollection = games?.['0']?.game?.groups;
  
  const rawGroups = groupCollection ? collectionItems(groupCollection).map(g => g.group) : [];
  if (rawGroups.length === 0) {
    console.error('✖ No active Survival Football groups found for season 2026 (Game 476).');
    process.exit(1);
  }

  console.log(`Found ${rawGroups.length} active Survival Football league(s).\n`);

  if (!dryRun) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }

  let competitorProfiles = {};
  if (fs.existsSync(COMPETITOR_PROFILES_FILE)) {
    try {
      competitorProfiles = JSON.parse(fs.readFileSync(COMPETITOR_PROFILES_FILE, 'utf8'));
    } catch {
      competitorProfiles = {};
    }
  }

  const leagueReports = [];
  const allEntrantsPayload = [];

  for (const g of rawGroups) {
    console.log(`┌─ Ingesting League: ${g.name} (Key: ${g.group_key}, ID: ${g.group_id})`);
    console.log(`│  Commissioner: ${g.commissioner_nickname} | Entrants: ${g.num_teams}`);

    const [teamsRes, standingsRes] = await Promise.all([
      yget(`group/${g.group_key}/teams`),
      yget(`group/${g.group_key}/standings`)
    ]);

    const grpTeams = teamsRes.fantasy_content?.group;
    const grpStandings = standingsRes.fantasy_content?.group;

    const currentWeek = targetWeekOverride || grpStandings?.current_week || 1;
    const lockTs = (grpStandings?.current_week_lock_time || 0) * 1000;
    const lockDate = new Date(lockTs);
    const isLocked = Date.now() >= lockTs;

    console.log(`│  Week ${currentWeek} Lock Deadline: ${lockDate.toISOString()} (${isLocked ? 'LOCKED ✅' : 'PRE-LOCK ⏳'})`);

    const teamsMap = grpTeams?.teams ? collectionItems(grpTeams.teams).map(t => t.team) : [];
    const standingsList = grpStandings?.standings ? collectionItems(grpStandings.standings).map(s => s.team) : [];

    const entrants = teamsMap.map(t => {
      const s = standingsList.find(x => x.team_key === t.team_key) || {};
      const rawPick = s.current_pick || t.current_pick || null;
      const cleanPick = resolveTeamPick(rawPick);

      const entrantObj = {
        team_key: t.team_key,
        team_id: t.team_id,
        team_name: t.name,
        is_user_team: Boolean(t.is_owned_by_current_login),
        status: t.status || (s.eliminated ? 'eliminated' : 'alive'),
        total_strikes: Number(t.total_strikes ?? s.total_strikes ?? 0),
        eliminated: Boolean(s.eliminated),
        elimination_week: s.elimination_week || null,
        elimination_pick: resolveTeamPick(s.elimination_pick) || null,
        current_pick: cleanPick,
        manager: {
          manager_id: t.manager?.manager_id,
          nickname: t.manager?.nickname,
          guid: t.manager?.guid,
          profile_url: t.manager?.fantasy_profile_url,
          is_commissioner: Boolean(t.manager?.is_commissioner)
        }
      };

      if (t.manager?.guid) {
        const guid = t.manager.guid;
        if (!competitorProfiles[guid]) {
          competitorProfiles[guid] = {
            guid,
            nickname: t.manager.nickname,
            leagues: {},
            history_by_season: {}
          };
        }
        competitorProfiles[guid].leagues[g.group_key] = {
          team_name: t.name,
          team_id: t.team_id,
          league_name: g.name
        };

        if (!competitorProfiles[guid].history_by_season['2026']) {
          competitorProfiles[guid].history_by_season['2026'] = { leagues: {} };
        }

        const leagueSeasonRec = competitorProfiles[guid].history_by_season['2026'].leagues[g.group_key] || {
          picks_by_week: {},
          strikes: 0,
          eliminated: false,
          elimination_week: null
        };

        leagueSeasonRec.strikes = entrantObj.total_strikes;
        leagueSeasonRec.eliminated = entrantObj.eliminated;
        leagueSeasonRec.elimination_week = entrantObj.elimination_week;
        if (cleanPick) {
          leagueSeasonRec.picks_by_week[currentWeek] = cleanPick;
        }

        competitorProfiles[guid].history_by_season['2026'].leagues[g.group_key] = leagueSeasonRec;
      }

      return entrantObj;
    });

    const aliveEntrants = entrants.filter(e => !e.eliminated);
    const pickCounts = {};
    let unpickedCount = 0;

    aliveEntrants.forEach(e => {
      if (e.current_pick) {
        pickCounts[e.current_pick] = (pickCounts[e.current_pick] || 0) + 1;
      } else {
        unpickedCount++;
      }
    });

    const distribution = Object.entries(pickCounts)
      .map(([team, count]) => ({
        team,
        count,
        percentage: Number(((count / (aliveEntrants.length || 1)) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);

    const userEntry = entrants.find(e => e.is_user_team);

    leagueReports.push({
      group_key: g.group_key,
      group_id: g.group_id,
      name: g.name,
      week: currentWeek,
      is_locked: isLocked,
      lock_time_iso: lockDate.toISOString(),
      total_entrants: entrants.length,
      alive_count: aliveEntrants.length,
      eliminated_count: entrants.length - aliveEntrants.length,
      user_pick: userEntry?.current_pick || 'UNSELECTED',
      distribution,
      unpicked_count: unpickedCount,
      entrants
    });

    allEntrantsPayload.push({
      group_key: g.group_key,
      group_id: g.group_id,
      name: g.name,
      num_teams: entrants.length,
      current_week: currentWeek,
      lock_time_iso: lockDate.toISOString(),
      entrants
    });

    console.log(`│  Alive: ${aliveEntrants.length} | Eliminated: ${entrants.length - aliveEntrants.length}`);
    console.log(`│  Your Team (${userEntry?.team_name}): Pick = ${userEntry?.current_pick || 'Pending'}`);
    if (distribution.length > 0) {
      console.log('│  Top Pick Distribution:');
      distribution.slice(0, 5).forEach(d => {
        console.log(`│    • ${d.team}: ${d.count} picks (${d.percentage}%)`);
      });
      if (unpickedCount > 0) {
        console.log(`│    • Pending / Masked: ${unpickedCount} (${Number((unpickedCount/aliveEntrants.length*100).toFixed(1))}%)`);
      }
    } else {
      console.log('│  Pick Distribution: [Picks masked by Yahoo until Sunday 1:00 PM ET lock]');
    }
    console.log('└' + '─'.repeat(50) + '\n');
  }

  if (!dryRun) {
    const masterPayload = {
      schema: 'yahoo_survivor_entrants_v1',
      last_synced_at: new Date().toISOString(),
      season: 2026,
      total_entrants: allEntrantsPayload.reduce((a, b) => a + b.num_teams, 0),
      groups: allEntrantsPayload
    };
    fs.writeFileSync(MASTER_REGISTRY_FILE, JSON.stringify(masterPayload, null, 2), 'utf8');
    console.log(`💾 Master entrant registry updated: ${MASTER_REGISTRY_FILE}`);

    fs.writeFileSync(COMPETITOR_PROFILES_FILE, JSON.stringify(competitorProfiles, null, 2), 'utf8');
    console.log(`💾 Competitor permanent profiles updated: ${COMPETITOR_PROFILES_FILE} (${Object.keys(competitorProfiles).length} GUIDs tracked)`);

    const activeWeek = targetWeekOverride || leagueReports[0]?.week || 1;
    const weeklySnapshotFile = path.join(HISTORY_DIR, `week-${activeWeek}-picks.json`);
    const weeklyPayload = {
      schema: 'yahoo_survivor_week_snapshot_v1',
      generated_at: new Date().toISOString(),
      season: 2026,
      week: activeWeek,
      leagues: leagueReports
    };
    fs.writeFileSync(weeklySnapshotFile, JSON.stringify(weeklyPayload, null, 2), 'utf8');
    console.log(`💾 Week ${activeWeek} snapshot saved: ${weeklySnapshotFile}`);

    const mdReportFile = path.join(DATA_DIR, `YAHOO_SURVIVOR_WEEK_${activeWeek}_REPORT.md`);
    let md = `# Yahoo Survival Football — Week ${activeWeek} Intelligence Report\n\n`;
    md += `**Generated:** ${weeklyPayload.generated_at} | **Season:** 2026 | **Week:** ${activeWeek}\n\n`;
    md += '---\n\n';

    leagueReports.forEach(lr => {
      md += `## ${lr.name} (${lr.total_entrants} Total Entrants)\n\n`;
      md += `- **Lock Status:** ${lr.is_locked ? '🔒 Locked' : '⏳ Pre-Lock (Locking at `' + lr.lock_time_iso + '`)'}\n`;
      md += `- **Field Status:** ${lr.alive_count} Alive | ${lr.eliminated_count} Eliminated\n`;
      const teamDesc = lr.user_pick === 'LAR' ? 'Los Angeles Rams' : lr.user_pick === 'PHI' ? 'Philadelphia Eagles' : lr.user_pick;
      md += `- **Your Selection:** **\`${lr.user_pick}\`** (${teamDesc})\n\n`;

      md += '### Field Pick Distribution\n\n';
      if (lr.distribution.length > 0) {
        md += '| Team | Entrant Count | Field Share % |\n';
        md += '| :--- | :---: | :---: |\n';
        lr.distribution.forEach(d => {
          md += `| **${d.team}** | ${d.count} | ${d.percentage}% |\n`;
        });
        if (lr.unpicked_count > 0) {
          const unpickedPct = Number((lr.unpicked_count/lr.alive_count*100).toFixed(1));
          md += `| *Pending / Unpicked* | ${lr.unpicked_count} | ${unpickedPct}% |\n`;
        }
      } else {
        md += `*Picks are masked by Yahoo until the kickoff of Week ${activeWeek} games (Sunday 1:00 PM ET).*\n`;
      }
      md += '\n---\n\n';
    });

    fs.writeFileSync(mdReportFile, md, 'utf8');
    console.log(`📄 Markdown summary report generated: ${mdReportFile}\n`);
  }

  console.log('✅ Yahoo Survivor Sync Completed Successfully.\n');
}

syncSurvivor().catch(err => {
  console.error('\n✖ Sync failed:', err);
  process.exit(1);
});
