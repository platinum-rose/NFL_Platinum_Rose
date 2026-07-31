#!/usr/bin/env node
// Expansion B (Lev 5, FREE-NEW) — projection / power-rating ensemble.
// Fills the dead schema field `power_rating.model_rank`: the schema already has
// `power_rating.{market_implied_rank, model_rank, delta}` but NO source feeds a
// model rank, so the market-vs-model `delta` — the purest "where is the market
// wrong" signal — is currently un-computable.
//
// This v1 builds a market-INDEPENDENT model rating from nflverse games.csv: a
// median-style z-score ensemble of three standard, data-derived power metrics
// (no LLM, no training memory) —
//   1. SRS  — schedule-adjusted point margin (iterated MOV + strength-of-schedule)
//   2. net points per game — raw scoring margin
//   3. Pythagorean win% (exp 2.37) — luck-dampened points-based win rate
// A composite z (mean of the three component z-scores) yields `model_rank` 1..32.
//
// The market side (`market_implied_rank`, `delta`) is attached from Expansion F's
// prediction-market win-total medians ONLY for teams whose win-total ladder is
// coherent (monotonic) — corrupt/sparse ladders are left null with attribution.
// A full market feed (agents/win-totals-ingest.js -> data/win-totals/<season>.json)
// and scraped forward projections (FPI / nfelo / DVOA) remain the intended
// upgrades; this builder is the plumbing that makes `delta` computable at all.
import path from 'node:path';
import {
  ROOT,
  canonicalTeam,
  fileStamp,
  num,
  parseArgs,
  round,
  readCsv,
  readJson,
  teamAbbr,
  writeJsonArtifact,
} from './lib/profile-snapshot-utils.js';

const args = parseArgs();
const GAMES = path.join(ROOT, 'data', 'vault-seed', 'nflverse', 'games.csv');
const COHERENCE = path.join(ROOT, 'data', 'prediction-markets', 'cross-market-coherence-latest.json');

// Pro-Football-Reference NFL Pythagorean exponent (mirrors build-regression-signals.js).
const PYTHAG_EXPONENT = 2.37;
// Cap single-game margin to blunt garbage-time blowout distortion in SRS.
const MARGIN_CAP = 24;
const SRS_ITERATIONS = 100;
const SRS_TOLERANCE = 1e-5;

function blankAgg(team) {
  return { team, games_played: 0, points_for: 0, points_against: 0, wins: 0, losses: 0, ties: 0 };
}

function accumulate(agg, pf, pa) {
  agg.games_played += 1;
  agg.points_for += pf;
  agg.points_against += pa;
  if (pf > pa) agg.wins += 1;
  else if (pf < pa) agg.losses += 1;
  else agg.ties += 1;
}

function pythagWinPct(pf, pa) {
  if (pf <= 0 && pa <= 0) return null;
  const num1 = pf ** PYTHAG_EXPONENT;
  const den = num1 + pa ** PYTHAG_EXPONENT;
  return den > 0 ? num1 / den : null;
}

/**
 * Simple Rating System: iterated (mean-of-margin + strength-of-schedule),
 * recentred to mean 0 each pass. Returns a { canonicalTeam: srsPoints } map.
 */
function computeSRS(games) {
  const teams = [...new Set(games.flatMap((g) => [g.home, g.away]))];
  const gp = new Map();
  const movSum = new Map();
  const opps = new Map();
  for (const t of teams) {
    gp.set(t, 0);
    movSum.set(t, 0);
    opps.set(t, []);
  }
  for (const g of games) {
    const capped = Math.max(-MARGIN_CAP, Math.min(MARGIN_CAP, g.homeScore - g.awayScore));
    gp.set(g.home, gp.get(g.home) + 1);
    gp.set(g.away, gp.get(g.away) + 1);
    movSum.set(g.home, movSum.get(g.home) + capped);
    movSum.set(g.away, movSum.get(g.away) - capped);
    opps.get(g.home).push(g.away);
    opps.get(g.away).push(g.home);
  }
  const mov = new Map(teams.map((t) => [t, movSum.get(t) / gp.get(t)]));
  let rating = new Map(teams.map((t) => [t, mov.get(t)]));
  for (let it = 0; it < SRS_ITERATIONS; it += 1) {
    const next = new Map();
    let maxDelta = 0;
    for (const t of teams) {
      const oppList = opps.get(t);
      const sos = oppList.reduce((s, o) => s + rating.get(o), 0) / oppList.length;
      const value = mov.get(t) + sos;
      next.set(t, value);
      maxDelta = Math.max(maxDelta, Math.abs(value - rating.get(t)));
    }
    const mean = teams.reduce((s, t) => s + next.get(t), 0) / teams.length;
    for (const t of teams) next.set(t, next.get(t) - mean);
    rating = next;
    if (maxDelta < SRS_TOLERANCE) break;
  }
  const out = {};
  for (const t of teams) out[t] = round(rating.get(t), 3);
  return out;
}

/** Population z-scores over a { key: value } map, skipping null values. */
function zScores(map) {
  const vals = Object.values(map).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return {};
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const sd = Math.sqrt(variance) || 1;
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = Number.isFinite(v) ? (v - mean) / sd : null;
  return out;
}

function completedRegRows(rows) {
  return rows.filter((r) =>
    String(r.game_type || '').toUpperCase() === 'REG'
    && num(r.home_score) !== null
    && num(r.away_score) !== null);
}

function latestPlayedSeason(regRows) {
  return Math.max(...regRows.map((r) => Number(r.season)).filter(Number.isFinite));
}

async function loadMarketWinTotals() {
  // Prediction-market win-total medians from Expansion F, keyed by team abbr —
  // used only where the win-total ladder is coherent (monotonic).
  try {
    const doc = await readJson(COHERENCE);
    const map = {};
    let cleanCount = 0;
    for (const row of doc.teams || []) {
      const key = teamAbbr(canonicalTeam(row.team) || row.team);
      const ladder = row.win_total_ladder || {};
      const wins = ladder.monotonic ? num(ladder.implied_median_wins) : null;
      map[key] = wins;
      if (wins !== null) cleanCount += 1;
    }
    return { map, cleanCount, source: path.relative(ROOT, COHERENCE).replace(/\\/g, '/'), sourceAt: doc.meta?.generated_at || null };
  } catch (err) {
    if (err.code === 'ENOENT') return { map: {}, cleanCount: 0, source: null, sourceAt: null };
    throw err;
  }
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
  const generatedAt = args['snapshot-at'] || new Date().toISOString();

  const eligible = reg.filter((r) => Number(r.season) === season);
  const games = [];
  const byTeam = new Map();
  for (const row of eligible) {
    const home = canonicalTeam(row.home_team);
    const away = canonicalTeam(row.away_team);
    const homeScore = num(row.home_score);
    const awayScore = num(row.away_score);
    if (!home || !away || homeScore === null || awayScore === null) continue;
    games.push({ home, away, homeScore, awayScore });
    if (!byTeam.has(home)) byTeam.set(home, blankAgg(home));
    if (!byTeam.has(away)) byTeam.set(away, blankAgg(away));
    accumulate(byTeam.get(home), homeScore, awayScore);
    accumulate(byTeam.get(away), awayScore, homeScore);
  }

  const srs = computeSRS(games);
  const netPpg = {};
  const pythag = {};
  for (const [team, agg] of byTeam) {
    netPpg[team] = round((agg.points_for - agg.points_against) / agg.games_played, 3);
    pythag[team] = round(pythagWinPct(agg.points_for, agg.points_against), 4);
  }

  const zSrs = zScores(srs);
  const zNet = zScores(netPpg);
  const zPythag = zScores(pythag);
  const composite = {};
  for (const team of byTeam.keys()) {
    const parts = [zSrs[team], zNet[team], zPythag[team]].filter((v) => Number.isFinite(v));
    composite[team] = parts.length ? round(parts.reduce((a, b) => a + b, 0) / parts.length, 4) : null;
  }

  const market = await loadMarketWinTotals();
  const marketWinTotals = {};
  for (const team of byTeam.keys()) {
    marketWinTotals[team] = market.map[teamAbbr(team)] ?? null;
  }
  const zMarket = zScores(marketWinTotals);
  // Standardize the model composite over the SAME coherent-market subset so the
  // market-vs-model delta compares two z-scores drawn from one matched population.
  const modelOverMarketUniverse = {};
  for (const team of byTeam.keys()) {
    modelOverMarketUniverse[team] = Number.isFinite(marketWinTotals[team]) ? composite[team] : null;
  }
  const zModelMarket = zScores(modelOverMarketUniverse);

  const teamRows = [];
  for (const [team, agg] of byTeam) {
    const marketWins = marketWinTotals[team];
    const deltaZ = Number.isFinite(zMarket[team]) && Number.isFinite(zModelMarket[team])
      ? round(zMarket[team] - zModelMarket[team], 4)
      : null;
    teamRows.push({
      season,
      team,
      team_abbr: teamAbbr(team),
      games_played: agg.games_played,
      record: `${agg.wins}-${agg.losses}${agg.ties ? `-${agg.ties}` : ''}`,
      power_rating: {
        srs: srs[team],
        net_points_per_game: netPpg[team],
        pythag_win_pct: pythag[team],
        model_composite_z: composite[team],
        model_rank: null, // assigned after ranking
        srs_rank: null,
        net_ppg_rank: null,
        pythag_rank: null,
        market_implied_win_total: marketWins,
        market_implied_rank: null, // assigned after ranking (coherent subset only)
        delta: deltaZ, // market_z - model_z; positive = market rates team above model
        delta_basis: deltaZ === null ? null : 'z_score_market_minus_model',
      },
      attribution_note: 'model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending.',
    });
  }

  // Global ranks (all 32) for the model + components; higher rating = rank 1.
  const attach = (valueKey, rankKey) => {
    const ranked = [...teamRows]
      .filter((r) => Number.isFinite(r.power_rating[valueKey]))
      .sort((a, b) => b.power_rating[valueKey] - a.power_rating[valueKey]);
    ranked.forEach((r, idx) => { r.power_rating[rankKey] = idx + 1; });
  };
  attach('model_composite_z', 'model_rank');
  attach('srs', 'srs_rank');
  attach('net_points_per_game', 'net_ppg_rank');
  attach('pythag_win_pct', 'pythag_rank');

  // Market rank: dense rank over the coherent-market subset only.
  const marketRanked = [...teamRows]
    .filter((r) => Number.isFinite(r.power_rating.market_implied_win_total))
    .sort((a, b) => b.power_rating.market_implied_win_total - a.power_rating.market_implied_win_total);
  marketRanked.forEach((r, idx) => { r.power_rating.market_implied_rank = idx + 1; });

  teamRows.sort((a, b) => (a.power_rating.model_rank || 99) - (b.power_rating.model_rank || 99));

  const payload = {
    meta: {
      generated_at: generatedAt,
      season,
      row_count: teamRows.length,
      source: path.relative(ROOT, GAMES).replace(/\\/g, '/'),
      source_file_mtime: await fileStamp(GAMES),
      market_source: market.source,
      market_source_generated_at: market.sourceAt,
      market_coherent_team_count: marketRanked.length,
      pythag_exponent: PYTHAG_EXPONENT,
      margin_cap: MARGIN_CAP,
      ensemble_components: ['srs', 'net_points_per_game', 'pythag_win_pct'],
      target_table: 'team_power_ratings',
      target_field: 'power_rating.{model_rank,market_implied_rank,delta}',
      write_mode: 'local_json_only',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    rows: teamRows,
  };
  const out = await writeJsonArtifact(`team-power-ratings-${season}.json`, payload, args.out);
  console.log(`wrote ${out}`);
  console.log(`power ratings: ${teamRows.length} teams (season ${season}); ` +
    `market delta populated for ${marketRanked.length} coherent-market teams.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
