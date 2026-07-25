#!/usr/bin/env node
import path from 'node:path';
import {
  ROOT,
  addTo,
  canonicalTeam,
  fileStamp,
  latestSeason,
  maxWeek,
  parseArgs,
  rankRows,
  ratio,
  readCsv,
  round,
  teamAbbr,
  uniqCount,
  writeJsonArtifact,
} from './lib/profile-snapshot-utils.js';

const args = parseArgs();
const TEAM_STATS = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'team_stats.csv');

function blankAgg(team) {
  return {
    team,
    game_ids: [],
    games_played: 0,
    attempts: 0,
    sacks_suffered: 0,
    carries: 0,
    passing_epa: 0,
    rushing_epa: 0,
    passing_cpoe_weighted: 0,
    passing_cpoe_attempts: 0,
    def_attempts: 0,
    def_sacks_generated: 0,
    def_carries: 0,
    def_passing_epa_allowed: 0,
    def_rushing_epa_allowed: 0,
  };
}

function accumulateOffense(agg, row) {
  agg.game_ids.push(row.game_id);
  addTo(agg, 'attempts', row.attempts);
  addTo(agg, 'sacks_suffered', row.sacks_suffered);
  addTo(agg, 'carries', row.carries);
  addTo(agg, 'passing_epa', row.passing_epa);
  addTo(agg, 'rushing_epa', row.rushing_epa);
  const cpoe = Number(row.passing_cpoe);
  const attempts = Number(row.attempts);
  if (Number.isFinite(cpoe) && Number.isFinite(attempts) && attempts > 0) {
    agg.passing_cpoe_weighted += cpoe * attempts;
    agg.passing_cpoe_attempts += attempts;
  }
}

function accumulateDefense(agg, row) {
  addTo(agg, 'def_attempts', row.attempts);
  addTo(agg, 'def_sacks_generated', row.sacks_suffered);
  addTo(agg, 'def_carries', row.carries);
  addTo(agg, 'def_passing_epa_allowed', row.passing_epa);
  addTo(agg, 'def_rushing_epa_allowed', row.rushing_epa);
}

function toSnapshot(agg, meta) {
  const dropbacks = agg.attempts + agg.sacks_suffered;
  const plays = dropbacks + agg.carries;
  const defDropbacks = agg.def_attempts + agg.def_sacks_generated;
  const defPlays = defDropbacks + agg.def_carries;
  return {
    season: meta.season,
    week: meta.week,
    team: agg.team,
    source_key: 'nflverse_team_stats',
    source_name: 'nflverse team_stats.csv',
    source_url: 'https://github.com/nflverse/nflverse-data',
    snapshot_at: meta.generated_at,
    games_played: uniqCount(agg.game_ids),
    off_epa_per_play: ratio(agg.passing_epa + agg.rushing_epa, plays),
    def_epa_per_play: ratio(agg.def_passing_epa_allowed + agg.def_rushing_epa_allowed, defPlays),
    off_epa_rank: null,
    def_epa_rank: null,
    epa_per_dropback: ratio(agg.passing_epa, dropbacks),
    qb_epa_per_dropback: ratio(agg.passing_epa, dropbacks),
    dropback_success_rate: null,
    success_rate: null,
    cpoe: ratio(agg.passing_cpoe_weighted, agg.passing_cpoe_attempts),
    explosive_play_rate: null,
    explosive_pass_rate: null,
    explosive_run_rate: null,
    pressure_rate_allowed: null,
    pressure_rate_generated: null,
    sack_rate_allowed: ratio(agg.sacks_suffered, dropbacks),
    sack_rate_generated: ratio(agg.def_sacks_generated, defDropbacks),
    neutral_pass_rate: ratio(dropbacks, plays),
    early_down_pass_rate: null,
    shotgun_rate: null,
    no_huddle_rate: null,
    play_action_rate: null,
    motion_rate: null,
    attribution_note: 'Derived locally from nflverse weekly team_stats aggregates. Success, explosive, pressure, early-down, shotgun, no-huddle, play-action, and motion fields require play-level or charting data and are intentionally left null in this v1 builder.',
    raw: {
      source_file: path.relative(ROOT, TEAM_STATS).replace(/\\/g, '/'),
      source_file_mtime: meta.source_file_mtime,
      team_abbr: teamAbbr(agg.team),
      offensive_dropbacks: round(dropbacks, 0),
      offensive_plays: round(plays, 0),
      defensive_dropbacks: round(defDropbacks, 0),
      defensive_plays: round(defPlays, 0),
    },
  };
}

async function main() {
  const rows = await readCsv(TEAM_STATS);
  const season = Number(args.season || latestSeason(rows));
  const week = Number(args.week || maxWeek(rows, season));
  const generated_at = args['snapshot-at'] || new Date().toISOString();
  const meta = {
    generated_at,
    season,
    week,
    source_file_mtime: await fileStamp(TEAM_STATS),
  };
  const eligible = rows.filter((r) =>
    Number(r.season) === season
    && String(r.season_type || '').toUpperCase() === 'REG'
    && Number(r.week) <= week
  );

  const byTeam = new Map();
  for (const row of eligible) {
    const team = canonicalTeam(row.team);
    const opp = canonicalTeam(row.opponent_team);
    if (!team) continue;
    if (!byTeam.has(team)) byTeam.set(team, blankAgg(team));
    accumulateOffense(byTeam.get(team), row);
    if (opp) {
      if (!byTeam.has(opp)) byTeam.set(opp, blankAgg(opp));
      accumulateDefense(byTeam.get(opp), row);
    }
  }

  const snapshots = [...byTeam.values()]
    .map((agg) => toSnapshot(agg, meta))
    .filter((row) => row.games_played > 0)
    .sort((a, b) => a.team.localeCompare(b.team));
  rankRows(snapshots, 'off_epa_per_play', 'off_epa_rank', 'desc');
  rankRows(snapshots, 'def_epa_per_play', 'def_epa_rank', 'asc');

  const payload = {
    meta: {
      ...meta,
      row_count: snapshots.length,
      source: path.relative(ROOT, TEAM_STATS).replace(/\\/g, '/'),
      target_table: 'team_analytic_snapshots',
      write_mode: 'local_json_only',
    },
    rows: snapshots,
  };
  const out = await writeJsonArtifact(`team-analytic-snapshots-${season}-w${week}.json`, payload, args.out);
  console.log(`wrote ${out}`);
  console.log(`analytics snapshots: ${snapshots.length} teams, season ${season} through week ${week}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
