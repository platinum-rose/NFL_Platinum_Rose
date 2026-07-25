#!/usr/bin/env node
import path from 'node:path';
import {
  ROOT,
  addTo,
  canonicalTeam,
  fileStamp,
  latestSeason,
  maxWeek,
  num,
  parseArgs,
  ratio,
  readCsv,
  round,
  writeJsonArtifact,
} from './lib/profile-snapshot-utils.js';

const args = parseArgs();
const GAMES = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'games.csv');
const TEAM_STATS = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'team_stats.csv');

function blankRecord() {
  return { wins: 0, losses: 0, pushes: 0 };
}

function addAts(record, result) {
  if (result > 0) record.wins += 1;
  else if (result < 0) record.losses += 1;
  else record.pushes += 1;
}

function blankTeam(team) {
  return {
    team,
    games: [],
    head_coach: null,
    latest_game_id: '',
    sample_start: null,
    sample_end: null,
    ats: {
      overall: blankRecord(),
      home: blankRecord(),
      away: blankRecord(),
      favorite: blankRecord(),
      underdog: blankRecord(),
      division: blankRecord(),
    },
    attempts: 0,
    sacks_suffered: 0,
    carries: 0,
  };
}

function updateDateRange(team, gameday) {
  if (!gameday) return;
  if (!team.sample_start || gameday < team.sample_start) team.sample_start = gameday;
  if (!team.sample_end || gameday > team.sample_end) team.sample_end = gameday;
}

function coverResult(game, side) {
  const spread = num(game.spread_line);
  const homeScore = num(game.home_score);
  const awayScore = num(game.away_score);
  if (spread === null || homeScore === null || awayScore === null) return null;
  const homeAtsMargin = (homeScore - awayScore) - spread;
  return side === 'home' ? homeAtsMargin : -homeAtsMargin;
}

function isFavorite(game, side) {
  const spread = num(game.spread_line);
  if (spread === null || spread === 0) return null;
  if (side === 'home') return spread < 0;
  return spread > 0;
}

function ingestGame(team, game, side) {
  const coach = side === 'home' ? game.home_coach : game.away_coach;
  const gid = game.game_id || '';
  team.games.push(gid);
  updateDateRange(team, game.gameday);
  if (coach && gid >= team.latest_game_id) {
    team.head_coach = coach;
    team.latest_game_id = gid;
  }
  const ats = coverResult(game, side);
  if (ats !== null) {
    addAts(team.ats.overall, ats);
    addAts(team.ats[side], ats);
    if (String(game.div_game) === '1' || String(game.div_game).toLowerCase() === 'true') addAts(team.ats.division, ats);
    const fav = isFavorite(game, side);
    if (fav === true) addAts(team.ats.favorite, ats);
    else if (fav === false) addAts(team.ats.underdog, ats);
  }
}

function ingestTeamStats(team, row) {
  addTo(team, 'attempts', row.attempts);
  addTo(team, 'sacks_suffered', row.sacks_suffered);
  addTo(team, 'carries', row.carries);
}

function rateTier(rate, low, high) {
  if (rate === null) return null;
  if (rate >= high) return 'high';
  if (rate <= low) return 'low';
  return 'middle';
}

function toSnapshot(team, meta) {
  const dropbacks = team.attempts + team.sacks_suffered;
  const plays = dropbacks + team.carries;
  const passRate = ratio(dropbacks, plays);
  const passTier = rateTier(passRate, 0.52, 0.6);
  const trend = [
    passTier ? `All-situation pass tendency is ${passTier} (${passRate}).` : 'Pass tendency unavailable from local team_stats sample.',
    'Fourth-down aggression, motion, play-action, RPO, pace, red-zone, and two-minute fields require play-level/charting enrichment and are intentionally null in this v1 local snapshot.',
  ].join(' ');

  return {
    season: meta.season,
    week: meta.week,
    team: team.team,
    head_coach: team.head_coach,
    offensive_coordinator: null,
    defensive_coordinator: null,
    source_key: 'nflverse_games_team_stats',
    source_name: 'nflverse games.csv + team_stats.csv',
    source_url: 'https://github.com/nflverse/nflverse-data',
    snapshot_at: meta.generated_at,
    sample_start: team.sample_start,
    sample_end: team.sample_end,
    games_sample: new Set(team.games).size,
    coordinator_continuity: null,
    fourth_down_aggression_rate: null,
    fourth_down_aggression_tier: null,
    neutral_pass_rate: passRate,
    early_down_pass_rate: null,
    shotgun_rate: null,
    no_huddle_rate: null,
    play_action_rate: null,
    motion_rate: null,
    rpo_rate: null,
    pace_seconds_per_play: null,
    red_zone_pass_rate: null,
    two_minute_aggression_tier: null,
    ats_by_role: team.ats,
    trend_notes: trend,
    stale_after: meta.stale_after,
    raw: {
      source_files: [
        path.relative(ROOT, GAMES).replace(/\\/g, '/'),
        path.relative(ROOT, TEAM_STATS).replace(/\\/g, '/'),
      ],
      source_file_mtimes: meta.source_file_mtimes,
      offensive_dropbacks: round(dropbacks, 0),
      offensive_plays: round(plays, 0),
    },
  };
}

async function main() {
  const [games, teamStats] = await Promise.all([readCsv(GAMES), readCsv(TEAM_STATS)]);
  const season = Number(args.season || latestSeason(games));
  const week = Number(args.week || maxWeek(games, season));
  const generated_at = args['snapshot-at'] || new Date().toISOString();
  const staleDays = Number(args['stale-days'] || 14);
  const stale_after = new Date(new Date(generated_at).getTime() + staleDays * 86400000).toISOString();
  const meta = {
    generated_at,
    season,
    week,
    stale_after,
    source_file_mtimes: {
      games: await fileStamp(GAMES),
      team_stats: await fileStamp(TEAM_STATS),
    },
  };

  const byTeam = new Map();
  const ensure = (team) => {
    if (!byTeam.has(team)) byTeam.set(team, blankTeam(team));
    return byTeam.get(team);
  };

  for (const game of games) {
    if (Number(game.season) !== season || String(game.game_type || '').toUpperCase() !== 'REG' || Number(game.week) > week) continue;
    const home = canonicalTeam(game.home_team);
    const away = canonicalTeam(game.away_team);
    if (home) ingestGame(ensure(home), game, 'home');
    if (away) ingestGame(ensure(away), game, 'away');
  }

  for (const row of teamStats) {
    if (Number(row.season) !== season || String(row.season_type || '').toUpperCase() !== 'REG' || Number(row.week) > week) continue;
    const team = canonicalTeam(row.team);
    if (team) ingestTeamStats(ensure(team), row);
  }

  const snapshots = [...byTeam.values()]
    .map((team) => toSnapshot(team, meta))
    .filter((row) => row.games_sample > 0)
    .sort((a, b) => a.team.localeCompare(b.team));
  const payload = {
    meta: {
      ...meta,
      row_count: snapshots.length,
      target_table: 'team_coaching_tendency_snapshots',
      write_mode: 'local_json_only',
    },
    rows: snapshots,
  };
  const out = await writeJsonArtifact(`team-coaching-tendency-snapshots-${season}-w${week}.json`, payload, args.out);
  console.log(`wrote ${out}`);
  console.log(`coaching snapshots: ${snapshots.length} teams, season ${season} through week ${week}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
