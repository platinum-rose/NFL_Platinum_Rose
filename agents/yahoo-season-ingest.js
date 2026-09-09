// agents/yahoo-season-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// Yahoo Fantasy in-season pull: my roster, league matchups, and league standings,
// across all NFL leagues on the authenticated account → yahoo_rosters /
// yahoo_matchups / yahoo_standings (migration 054).
//
// Rosters are ingested for MY team only (one team_key per league, discovered via
// users;use_login=1/games;game_keys=nfl/teams). Matchups and standings cover every
// team in each league (needed to know who I'm playing and league context), with
// is_my_team flagging my own rows.
//
// Usage:
//   node agents/yahoo-season-ingest.js [--week current] [--dry-run]
// Env: YAHOO_* (see agents/lib/yahoo.js) + SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (unless --dry-run)
// ═══════════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { yget, deepCollect, collectionItems, findAll } from './lib/yahoo.js';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const WEEK_ARG = getArg('--week', 'current');
const DRY = has('--dry-run');
const JSON_DIR = 'data/fantasy';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)'); process.exit(1); }
const sb = (!DRY && SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

async function upsert(table, records, onConflict) {
  if (!records.length) return;
  if (DRY) { console.log(`   DRY RUN — would upsert ${records.length} rows into ${table}`); return; }
  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    const { error } = await sb.from(table).upsert(slice, { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  console.log(`   ✅ upserted ${records.length} rows → ${table}`);
}

(async () => {
  console.log(`📊 Yahoo season ingest${DRY ? ' (DRY RUN)' : ''} · week=${WEEK_ARG}`);

  // 1) My team in every NFL league on this account.
  const tj = await yget('users;use_login=1/games;game_keys=nfl/teams');
  const myTeamNodes = findAll(tj?.fantasy_content ?? tj, 'team');
  const myTeams = new Map(); // league_key -> { team_key, team_name }
  for (const node of myTeamNodes) {
    const flat = deepCollect(node);
    if (!flat.team_key) continue;
    const league_key = flat.team_key.split('.t.')[0];
    if (!myTeams.has(league_key)) myTeams.set(league_key, { team_key: flat.team_key, team_name: flat.name });
  }
  if (!myTeams.size) { console.error('✖ No teams found for this account.'); process.exit(2); }
  console.log(`   found my team in ${myTeams.size} league(s)`);

  await mkdir(JSON_DIR, { recursive: true });

  const rosterRows = [];
  const matchupRows = [];
  const standingRows = [];
  const asOfDate = new Date().toISOString().slice(0, 10);

  for (const [league_key, myTeam] of myTeams) {
    // League meta + current week, via scoreboard (no week param = current week).
    const sj = await yget(`league/${league_key}/scoreboard`);
    const leagueMeta = deepCollect((sj?.fantasy_content?.league ?? [])[0] ?? {});
    const league_name = leagueMeta.name || league_key;
    const season = leagueMeta.season ? Number(leagueMeta.season) : new Date().getFullYear();
    const week = WEEK_ARG === 'current' ? Number(leagueMeta.current_week || 1) : Number(WEEK_ARG);

    // 2) Matchups for this week (re-fetch by explicit week so --week works for any value).
    const scoreboardJson = WEEK_ARG === 'current' ? sj : await yget(`league/${league_key}/scoreboard;week=${week}`);
    const matchupNodes = findAll(scoreboardJson?.fantasy_content ?? scoreboardJson, 'matchup');
    for (const mNode of matchupNodes) {
      const mMeta = deepCollect(mNode); // week/status/is_playoffs/is_consolation (team fields also merge in but unused below)
      const teamNodes = findAll(mNode, 'team');
      const teams = teamNodes.map((t) => deepCollect(t));
      if (teams.length !== 2) continue;
      for (let i = 0; i < 2; i++) {
        const me = teams[i], opp = teams[1 - i];
        matchupRows.push({
          league_key, league_name, season, week,
          team_key: me.team_key, team_name: me.name,
          opponent_team_key: opp.team_key, opponent_name: opp.name,
          points: me.total != null ? Number(me.total) : null,
          opponent_points: opp.total != null ? Number(opp.total) : null,
          win_probability: me.win_probability != null ? Number(me.win_probability) : null,
          status: mMeta.status || null,
          is_playoffs: mMeta.is_playoffs === '1' || mMeta.is_playoffs === 1,
          is_consolation: mMeta.is_consolation === '1' || mMeta.is_consolation === 1,
          is_my_team: me.team_key === myTeam.team_key,
        });
      }
    }

    // 3) Standings — every team in the league.
    const standingsJson = await yget(`league/${league_key}/standings`);
    const standingTeamNodes = findAll(standingsJson?.fantasy_content ?? standingsJson, 'team');
    for (const node of standingTeamNodes) {
      const t = deepCollect(node);
      if (!t.team_key) continue;
      standingRows.push({
        league_key, league_name, season,
        team_key: t.team_key, team_name: t.name,
        wins: t.wins != null ? Number(t.wins) : null,
        losses: t.losses != null ? Number(t.losses) : null,
        ties: t.ties != null ? Number(t.ties) : null,
        points_for: t.points_for != null && t.points_for !== '' ? Number(t.points_for) : null,
        points_against: t.points_against != null && t.points_against !== '' ? Number(t.points_against) : null,
        rank: t.rank != null && t.rank !== '' ? Number(t.rank) : null,
        is_my_team: t.team_key === myTeam.team_key,
        as_of_date: asOfDate,
      });
    }

    // 4) My roster only.
    const rosterJson = await yget(`team/${myTeam.team_key}/roster`);
    const playerNodes = findAll(rosterJson?.fantasy_content ?? rosterJson, 'player');
    for (const node of playerNodes) {
      const p = deepCollect(node);
      if (!p.player_key) continue;
      rosterRows.push({
        league_key, league_name,
        team_key: myTeam.team_key, team_name: myTeam.team_name,
        player_key: p.player_key, player: p.full || p.name,
        position: p.primary_position || p.display_position || null,
        editorial_team: p.editorial_team_abbr || null,
        bye_week: p.bye_weeks?.week ? Number(p.bye_weeks.week) : (typeof p.week === 'string' && /^\d+$/.test(p.week) ? Number(p.week) : null),
        week, season,
        is_my_team: true,
      });
    }

    const myStanding = standingRows.find((r) => r.team_key === myTeam.team_key);
    const myMatchup = matchupRows.find((r) => r.team_key === myTeam.team_key && r.week === week);
    console.log(`   ✅ ${league_name}: wk${week} ${myMatchup ? `${myTeam.team_name} ${myMatchup.points ?? '-'} vs ${myMatchup.opponent_name} ${myMatchup.opponent_points ?? '-'} (${myMatchup.status})` : 'no matchup found'}${myStanding ? ` · record ${myStanding.wins}-${myStanding.losses}-${myStanding.ties} (rank ${myStanding.rank})` : ''}`);
  }

  const snapshot = { pulled_at: new Date().toISOString(), rosters: rosterRows, matchups: matchupRows, standings: standingRows };
  const snapFile = path.join(JSON_DIR, `yahoo-season-wk-snapshot-${asOfDate}.json`);
  await writeFile(snapFile, JSON.stringify(snapshot, null, 2));
  console.log(`   wrote snapshot ${snapFile}`);

  await upsert('yahoo_rosters', rosterRows, 'team_key,player_key,week');
  await upsert('yahoo_matchups', matchupRows, 'league_key,week,team_key');
  await upsert('yahoo_standings', standingRows, 'league_key,team_key,as_of_date');

  if (DRY) console.log('   DRY RUN — nothing written to Supabase.');
  else console.log('✅ Yahoo season ingest complete.');
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
