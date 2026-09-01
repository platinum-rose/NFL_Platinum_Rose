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
// 2026-09-01: FTN charting fills team_analytic_snapshots.{motion_rate,
// play_action_rate,no_huddle_rate} -- present in the schema since migration
// 044 but null in every row until now (see toSnapshot()'s prior comment,
// removed below). FTN charts plays with no team column (by design, see
// fetch_nflverse_data.py's _fetch_ftn_charting), so PBP_JOIN supplies the
// game_id+play_id -> posteam/defteam lookup fetch_pbp_team_join added
// specifically for this.
const FTN_CHARTING = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'ftn_charting.csv');
const PBP_JOIN = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'pbp_team_join.csv');

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

// ── FTN charting join (motion/play-action/no-huddle + extras) ──────────────────

function bool01(value) {
  if (value === 'True' || value === 'TRUE' || value === true) return 1;
  if (value === 'False' || value === 'FALSE' || value === false) return 0;
  return null;
}

function joinKey(gameId, playId) {
  const p = Number(playId);
  if (!gameId || !Number.isFinite(p)) return null;
  return `${gameId}|${p}`;
}

function blankFtnAgg(team) {
  return {
    team,
    off_plays: 0, off_motion: 0, off_play_action: 0, off_no_huddle: 0,
    off_screen: 0, off_rpo: 0, off_trick: 0, off_qb_out_of_pocket: 0,
    off_int_worthy: 0, off_throw_away: 0,
    off_catchable: 0, off_drop: 0, off_contested: 0, off_created_reception: 0,
    off_blitzed_plays: 0,
    def_plays: 0, def_blitz_plays: 0, def_pass_rushers_sum: 0, def_pass_rushers_n: 0,
    def_box_sum: 0, def_box_n: 0,
  };
}

async function loadPbpJoinMap() {
  const rows = await readCsv(PBP_JOIN);
  const map = new Map();
  for (const row of rows) {
    const key = joinKey(row.game_id, row.play_id);
    if (!key) continue;
    map.set(key, { posteam: canonicalTeam(row.posteam), defteam: canonicalTeam(row.defteam) });
  }
  return map;
}

async function loadFtnByTeam(season, week) {
  let ftnRows;
  let joinMap;
  try {
    [ftnRows, joinMap] = await Promise.all([readCsv(FTN_CHARTING), loadPbpJoinMap()]);
  } catch (e) {
    console.warn(`  [warn] FTN charting join unavailable, motion/play-action/no-huddle stay null: ${e.message}`);
    return { byTeam: new Map(), available: false };
  }

  const eligible = ftnRows.filter((r) => Number(r.season) === season && Number(r.week) <= week);
  const byTeam = new Map();
  let matched = 0;
  for (const row of eligible) {
    const key = joinKey(row.nflverse_game_id, row.nflverse_play_id);
    const teams = key ? joinMap.get(key) : null;
    if (!teams) continue; // unmatched plays (e.g. spikes/kneels PBP drops) -- excluded, not counted as 0
    matched += 1;

    if (teams.posteam) {
      if (!byTeam.has(teams.posteam)) byTeam.set(teams.posteam, blankFtnAgg(teams.posteam));
      const o = byTeam.get(teams.posteam);
      o.off_plays += 1;
      o.off_motion += bool01(row.is_motion) || 0;
      o.off_play_action += bool01(row.is_play_action) || 0;
      o.off_no_huddle += bool01(row.is_no_huddle) || 0;
      o.off_screen += bool01(row.is_screen_pass) || 0;
      o.off_rpo += bool01(row.is_rpo) || 0;
      o.off_trick += bool01(row.is_trick_play) || 0;
      o.off_qb_out_of_pocket += bool01(row.is_qb_out_of_pocket) || 0;
      o.off_int_worthy += bool01(row.is_interception_worthy) || 0;
      o.off_throw_away += bool01(row.is_throw_away) || 0;
      if (bool01(row.is_catchable_ball) === 1) {
        o.off_catchable += 1;
        o.off_drop += bool01(row.is_drop) || 0;
        o.off_contested += bool01(row.is_contested_ball) || 0;
        o.off_created_reception += bool01(row.is_created_reception) || 0;
      }
      if (Number(row.n_blitzers) > 0) o.off_blitzed_plays += 1;
    }
    if (teams.defteam) {
      if (!byTeam.has(teams.defteam)) byTeam.set(teams.defteam, blankFtnAgg(teams.defteam));
      const d = byTeam.get(teams.defteam);
      d.def_plays += 1;
      if (Number(row.n_blitzers) > 0) d.def_blitz_plays += 1;
      const rushers = Number(row.n_pass_rushers);
      if (Number.isFinite(rushers)) { d.def_pass_rushers_sum += rushers; d.def_pass_rushers_n += 1; }
      const box = Number(row.n_defense_box);
      if (Number.isFinite(box)) { d.def_box_sum += box; d.def_box_n += 1; }
    }
  }
  console.log(`  [ftn] ${eligible.length} charted plays through week ${week}, ${matched} matched to a team via pbp_team_join.csv`);
  return { byTeam, available: true };
}

function ftnMetrics(ftnAgg) {
  if (!ftnAgg) {
    return {
      no_huddle_rate: null, play_action_rate: null, motion_rate: null,
      raw: {},
    };
  }
  return {
    no_huddle_rate: ratio(ftnAgg.off_no_huddle, ftnAgg.off_plays),
    play_action_rate: ratio(ftnAgg.off_play_action, ftnAgg.off_plays),
    motion_rate: ratio(ftnAgg.off_motion, ftnAgg.off_plays),
    raw: {
      ftn_charted_plays_offense: ftnAgg.off_plays,
      ftn_charted_plays_defense: ftnAgg.def_plays,
      screen_rate: ratio(ftnAgg.off_screen, ftnAgg.off_plays),
      rpo_rate: ratio(ftnAgg.off_rpo, ftnAgg.off_plays),
      trick_play_rate: ratio(ftnAgg.off_trick, ftnAgg.off_plays),
      qb_out_of_pocket_rate: ratio(ftnAgg.off_qb_out_of_pocket, ftnAgg.off_plays),
      interception_worthy_rate: ratio(ftnAgg.off_int_worthy, ftnAgg.off_plays),
      throw_away_rate: ratio(ftnAgg.off_throw_away, ftnAgg.off_plays),
      drop_rate_of_catchable_targets: ratio(ftnAgg.off_drop, ftnAgg.off_catchable),
      contested_catch_rate_of_catchable_targets: ratio(ftnAgg.off_contested, ftnAgg.off_catchable),
      created_reception_rate_of_catchable_targets: ratio(ftnAgg.off_created_reception, ftnAgg.off_catchable),
      blitz_rate_faced: ratio(ftnAgg.off_blitzed_plays, ftnAgg.off_plays),
      blitz_rate_generated: ratio(ftnAgg.def_blitz_plays, ftnAgg.def_plays),
      avg_pass_rushers_generated: ratio(ftnAgg.def_pass_rushers_sum, ftnAgg.def_pass_rushers_n),
      avg_defenders_in_box_faced: ratio(ftnAgg.def_box_sum, ftnAgg.def_box_n),
    },
  };
}

function toSnapshot(agg, meta, ftnAgg) {
  const ftn = ftnMetrics(ftnAgg);
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
    no_huddle_rate: ftn.no_huddle_rate,
    play_action_rate: ftn.play_action_rate,
    motion_rate: ftn.motion_rate,
    attribution_note: ftnAgg
      ? 'Derived locally from nflverse weekly team_stats aggregates, blended with FTN charting (nfl_data_py import_ftn_data, joined to a team via pbp_team_join.csv) for motion/play-action/no-huddle. Success, explosive, pressure, early-down, and shotgun fields still require data this builder does not have (FTN charting has no explicit pressure flag; pressure_rate_* stay null rather than approximated) and are intentionally left null.'
      : 'Derived locally from nflverse weekly team_stats aggregates. FTN charting join unavailable this run -- motion/play-action/no-huddle fell back to null along with the other charting-dependent fields.',
    raw: {
      source_file: path.relative(ROOT, TEAM_STATS).replace(/\\/g, '/'),
      source_file_mtime: meta.source_file_mtime,
      team_abbr: teamAbbr(agg.team),
      offensive_dropbacks: round(dropbacks, 0),
      offensive_plays: round(plays, 0),
      defensive_dropbacks: round(defDropbacks, 0),
      defensive_plays: round(defPlays, 0),
      ftn_charting: ftn.raw,
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

  const { byTeam: ftnByTeam } = await loadFtnByTeam(season, week);

  const snapshots = [...byTeam.values()]
    .map((agg) => toSnapshot(agg, meta, ftnByTeam.get(agg.team)))
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
