#!/usr/bin/env node
// Expansion A (Lev 5, FREE-PLUMB) — regression / luck signals.
// Derives the score-based mean-reversion core (Pythagorean wins, one-score record)
// from nflverse games.csv. The pbp-dependent luck signals (turnover margin,
// red-zone TD%, third-down over-expected) are intentionally left null in this v1
// builder — they require the play-by-play layer CI skips (`--no-pbp`) and is not
// present in data/vault-seed/nflverse. Feeds dossier field analytics.regression.*
// and gives thesis.regression_direction a quantitative basis.
import path from 'node:path';
import {
  ROOT,
  canonicalTeam,
  fileStamp,
  num,
  parseArgs,
  rankRows,
  round,
  readCsv,
  teamAbbr,
  writeJsonArtifact,
} from './lib/profile-snapshot-utils.js';

const args = parseArgs();
const GAMES = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'games.csv');

// Pro-Football-Reference / Football Outsiders NFL Pythagorean exponent.
const PYTHAG_EXPONENT = 2.37;
// A one-score game is decided by 8 points or fewer.
const ONE_SCORE_MARGIN = 8;

function blankAgg(team) {
  return {
    team,
    games_played: 0,
    points_for: 0,
    points_against: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    one_score_wins: 0,
    one_score_losses: 0,
    one_score_ties: 0,
  };
}

function accumulate(agg, pf, pa, margin) {
  agg.games_played += 1;
  agg.points_for += pf;
  agg.points_against += pa;
  const oneScore = Math.abs(margin) <= ONE_SCORE_MARGIN;
  if (margin > 0) {
    agg.wins += 1;
    if (oneScore) agg.one_score_wins += 1;
  } else if (margin < 0) {
    agg.losses += 1;
    if (oneScore) agg.one_score_losses += 1;
  } else {
    agg.ties += 1;
    if (oneScore) agg.one_score_ties += 1;
  }
}

function pythagWinPct(pf, pa) {
  if (pf <= 0 && pa <= 0) return null;
  const pfExp = pf ** PYTHAG_EXPONENT;
  const paExp = pa ** PYTHAG_EXPONENT;
  const denom = pfExp + paExp;
  if (denom === 0) return null;
  return pfExp / denom;
}

function toSnapshot(agg, meta) {
  const actualWins = agg.wins + agg.ties * 0.5;
  const winPct = pythagWinPct(agg.points_for, agg.points_against);
  const pythagWins = winPct === null ? null : round(winPct * agg.games_played, 2);
  const pythagWinDelta = pythagWins === null ? null : round(actualWins - pythagWins, 2);
  const oneScoreGames = agg.one_score_wins + agg.one_score_losses + agg.one_score_ties;
  return {
    season: meta.season,
    week: meta.week,
    team: agg.team,
    source_key: 'nflverse_games',
    source_name: 'nflverse games.csv',
    source_url: 'https://github.com/nflverse/nflverse-data',
    snapshot_at: meta.generated_at,
    games_played: agg.games_played,
    record: `${agg.wins}-${agg.losses}${agg.ties ? `-${agg.ties}` : ''}`,
    actual_wins: round(actualWins, 1),
    points_for: agg.points_for,
    points_against: agg.points_against,
    point_differential: agg.points_for - agg.points_against,
    // Score-based regression core (populated).
    pythag_win_pct: winPct === null ? null : round(winPct, 4),
    pythag_wins: pythagWins,
    // Positive delta = won more than points support -> regression candidate (fade).
    pythag_win_delta: pythagWinDelta,
    pythag_win_delta_rank: null,
    one_score_record: {
      wins: agg.one_score_wins,
      losses: agg.one_score_losses,
      ties: agg.one_score_ties,
      games: oneScoreGames,
      win_pct: oneScoreGames > 0
        ? round((agg.one_score_wins + agg.one_score_ties * 0.5) / oneScoreGames, 4)
        : null,
    },
    // pbp-dependent luck signals — require the play-by-play layer not present locally.
    fumble_recovery_pct: null,
    takeaway_margin: null,
    rz_td_pct_off: null,
    rz_td_pct_def: null,
    third_down_over_expected: null,
    attribution_note: 'Pythagorean (exp 2.37) and one-score record derived from nflverse games.csv final scores. Turnover, red-zone, and third-down-over-expected signals require the play-by-play layer (CI runs seed with --no-pbp) and are intentionally left null in this v1 builder.',
    raw: {
      source_file: path.relative(ROOT, GAMES).replace(/\\/g, '/'),
      source_file_mtime: meta.source_file_mtime,
      team_abbr: teamAbbr(agg.team),
      pythag_exponent: PYTHAG_EXPONENT,
      one_score_margin: ONE_SCORE_MARGIN,
    },
  };
}

function completedRegRows(rows) {
  return rows.filter((r) =>
    String(r.game_type || '').toUpperCase() === 'REG'
    && num(r.home_score) !== null
    && num(r.away_score) !== null
  );
}

function latestPlayedSeason(regRows) {
  return Math.max(...regRows.map((r) => Number(r.season)).filter(Number.isFinite));
}

function maxPlayedWeek(regRows, season) {
  return Math.max(...regRows
    .filter((r) => Number(r.season) === Number(season))
    .map((r) => Number(r.week))
    .filter(Number.isFinite));
}

async function main() {
  const rows = await readCsv(GAMES);
  const reg = completedRegRows(rows);
  if (reg.length === 0) {
    console.error('No completed REG games found in games.csv');
    process.exitCode = 1;
    return;
  }
  const season = Number(args.season || latestPlayedSeason(reg));
  const week = Number(args.week || maxPlayedWeek(reg, season));
  const generated_at = args['snapshot-at'] || new Date().toISOString();
  const meta = {
    generated_at,
    season,
    week,
    source_file_mtime: await fileStamp(GAMES),
  };

  const eligible = reg.filter((r) =>
    Number(r.season) === season && Number(r.week) <= week
  );

  const byTeam = new Map();
  for (const row of eligible) {
    const home = canonicalTeam(row.home_team);
    const away = canonicalTeam(row.away_team);
    const homeScore = num(row.home_score);
    const awayScore = num(row.away_score);
    if (!home || !away || homeScore === null || awayScore === null) continue;
    const margin = homeScore - awayScore;
    if (!byTeam.has(home)) byTeam.set(home, blankAgg(home));
    if (!byTeam.has(away)) byTeam.set(away, blankAgg(away));
    accumulate(byTeam.get(home), homeScore, awayScore, margin);
    accumulate(byTeam.get(away), awayScore, homeScore, -margin);
  }

  const snapshots = [...byTeam.values()]
    .map((agg) => toSnapshot(agg, meta))
    .filter((row) => row.games_played > 0)
    .sort((a, b) => a.team.localeCompare(b.team));
  // Rank by lucky-first: largest positive delta (overperformed points) = rank 1.
  rankRows(snapshots, 'pythag_win_delta', 'pythag_win_delta_rank', 'desc');

  const payload = {
    meta: {
      ...meta,
      row_count: snapshots.length,
      source: path.relative(ROOT, GAMES).replace(/\\/g, '/'),
      target_table: 'team_regression_snapshots',
      write_mode: 'local_json_only',
    },
    rows: snapshots,
  };
  const out = await writeJsonArtifact(`team-regression-snapshots-${season}-w${week}.json`, payload, args.out);
  console.log(`wrote ${out}`);
  console.log(`regression snapshots: ${snapshots.length} teams, season ${season} through week ${week}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
