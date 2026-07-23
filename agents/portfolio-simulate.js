#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NFL_TEAMS, normalizeTeam } from '../src/lib/teams.js';
import { probAtLeast } from './lib/win-dist.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.nfl', 'portfolio');
const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const DOSSIER = getArg('--dossier', path.join(OUT_DIR, `dossier-${new Date().toISOString().slice(0, 10)}.json`));
const SIMS = Number(getArg('--sims', '20000'));
const SEED = Number(getArg('--seed', '274'));
const SIGMA_R = Number(getArg('--sigma-r', '0.15'));
const OUT = getArg('--out', null);
const PATCH_DOSSIER = !argv.includes('--no-patch-dossier');

const TEAMS = Object.keys(NFL_TEAMS);
const DIVISION = Object.fromEntries(TEAMS.map((t) => [t, NFL_TEAMS[t].division]));
const CONFERENCE = Object.fromEntries(TEAMS.map((t) => [t, NFL_TEAMS[t].conference]));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rand) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}

function gameProb(home, away, ratings, hfa = 0.28, scale = 1) {
  return logistic(((ratings[home] || 0) - (ratings[away] || 0) + hfa) / scale);
}

function expectedWins(schedule, ratings, hfa = 0.28, scale = 1) {
  const wins = Object.fromEntries(TEAMS.map((t) => [t, 0]));
  for (const g of schedule) {
    const pHome = gameProb(g.home, g.away, ratings, hfa, scale);
    wins[g.home] += pHome;
    wins[g.away] += 1 - pHome;
  }
  return wins;
}

function solveRatings(schedule, mus, opts = {}) {
  const hfa = opts.hfa ?? 0.28;
  const scale = opts.scale ?? 1;
  const ratings = Object.fromEntries(TEAMS.map((t) => [t, 0]));
  for (let iter = 0; iter < 800; iter++) {
    const exp = expectedWins(schedule, ratings, hfa, scale);
    for (const t of TEAMS) ratings[t] += 0.05 * scale * ((mus[t] ?? exp[t]) - exp[t]);
    const mean = TEAMS.reduce((s, t) => s + ratings[t], 0) / TEAMS.length;
    for (const t of TEAMS) ratings[t] -= mean;
  }
  const exp = expectedWins(schedule, ratings, hfa, scale);
  const mae = TEAMS.reduce((s, t) => s + Math.abs((mus[t] ?? exp[t]) - exp[t]), 0) / TEAMS.length;
  return { ratings, hfa, scale, mae: round(mae, 4) };
}

function regularSeasonGames(dossier) {
  return (dossier.schedule || [])
    .filter((g) => g.home && g.away && (g.season_type == null || Number(g.season_type) === 2) && Number(g.week || 0) <= 18)
    .map((g) => ({ ...g, home: normalizeTeam(g.home), away: normalizeTeam(g.away) }))
    .filter((g) => g.home && g.away);
}

function winDistMeans(dossier) {
  const out = {};
  for (const row of dossier.synthesis_input?.wins || []) {
    const t = row.team_nick || normalizeTeam(row.team);
    if (t && row.win_dist?.mu != null) out[t] = row.win_dist.mu;
  }
  return out;
}

function compareTeams(a, b, state, rand) {
  const wa = state.wins[a], wb = state.wins[b];
  if (wa !== wb) return wb - wa;
  const h2h = (state.h2h[a]?.[b] || 0) - (state.h2h[b]?.[a] || 0);
  if (h2h !== 0) return -h2h;
  const da = state.divWins[a], db = state.divWins[b];
  if (DIVISION[a] === DIVISION[b] && da !== db) return db - da;
  const ca = state.confWins[a], cb = state.confWins[b];
  if (CONFERENCE[a] === CONFERENCE[b] && ca !== cb) return cb - ca;
  return rand() < 0.5 ? -1 : 1;
}

function seedConference(confTeams, state, rand) {
  const divisions = [...new Set(confTeams.map((t) => DIVISION[t]))];
  const divWinners = divisions.map((d) => confTeams.filter((t) => DIVISION[t] === d).sort((a, b) => compareTeams(a, b, state, rand))[0]);
  divWinners.sort((a, b) => compareTeams(a, b, state, rand));
  const wildcards = confTeams.filter((t) => !divWinners.includes(t)).sort((a, b) => compareTeams(a, b, state, rand)).slice(0, 3);
  return [...divWinners, ...wildcards];
}

function playGame(home, away, ratings, rand, hfa) {
  return rand() < gameProb(home, away, ratings, hfa) ? home : away;
}

function simulatePlayoffs(seeds, ratings, rand, hfa) {
  const wc = [
    playGame(seeds[1], seeds[6], ratings, rand, hfa),
    playGame(seeds[2], seeds[5], ratings, rand, hfa),
    playGame(seeds[3], seeds[4], ratings, rand, hfa),
  ];
  const remaining = [seeds[0], ...wc].sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));
  const div1 = playGame(remaining[0], remaining[3], ratings, rand, hfa);
  const div2 = playGame(remaining[1], remaining[2], ratings, rand, hfa);
  return playGame(div1, div2, ratings, rand, hfa);
}

function runSimulation(dossier, opts = {}) {
  const schedule = regularSeasonGames(dossier);
  const mus = winDistMeans(dossier);
  const teamsWithMu = Object.keys(mus).length;
  if (teamsWithMu < 28) throw new Error(`Need win_dist on at least 28 teams; found ${teamsWithMu}. Re-run portfolio-dossier first.`);
  if (schedule.length < 250) throw new Error(`Need regular-season schedule in dossier; found ${schedule.length} games.`);
  const solved = solveRatings(schedule, mus, opts);
  const rand = rng(opts.seed ?? SEED);
  const n = opts.sims ?? SIMS;
  const counts = Object.fromEntries(TEAMS.map((t) => [t, {
    wins: 0, playoffs: 0, division: 0, seed1: 0, conference: 0, superbowl: 0, most_wins: 0, least_wins: 0,
    hist: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i, 0])),
  }]));
  const matchup = {};

  for (let sim = 0; sim < n; sim++) {
    const ratings = Object.fromEntries(TEAMS.map((t) => [t, solved.ratings[t] + randn(rand) * (opts.sigmaR ?? SIGMA_R)]));
    const state = {
      wins: Object.fromEntries(TEAMS.map((t) => [t, 0])),
      divWins: Object.fromEntries(TEAMS.map((t) => [t, 0])),
      confWins: Object.fromEntries(TEAMS.map((t) => [t, 0])),
      h2h: Object.fromEntries(TEAMS.map((t) => [t, {}])),
    };
    for (const g of schedule) {
      const winner = playGame(g.home, g.away, ratings, rand, solved.hfa);
      const loser = winner === g.home ? g.away : g.home;
      state.wins[winner]++;
      state.h2h[winner][loser] = (state.h2h[winner][loser] || 0) + 1;
      if (DIVISION[g.home] === DIVISION[g.away]) state.divWins[winner]++;
      if (CONFERENCE[g.home] === CONFERENCE[g.away]) state.confWins[winner]++;
    }
    for (const t of TEAMS) {
      counts[t].wins += state.wins[t];
      counts[t].hist[state.wins[t]]++;
    }
    const maxWins = Math.max(...TEAMS.map((t) => state.wins[t]));
    const minWins = Math.min(...TEAMS.map((t) => state.wins[t]));
    for (const t of TEAMS) {
      if (state.wins[t] === maxWins) counts[t].most_wins += 1 / TEAMS.filter((x) => state.wins[x] === maxWins).length;
      if (state.wins[t] === minWins) counts[t].least_wins += 1 / TEAMS.filter((x) => state.wins[x] === minWins).length;
    }
    const afcSeeds = seedConference(TEAMS.filter((t) => CONFERENCE[t] === 'AFC'), state, rand);
    const nfcSeeds = seedConference(TEAMS.filter((t) => CONFERENCE[t] === 'NFC'), state, rand);
    for (const seeds of [afcSeeds, nfcSeeds]) {
      counts[seeds[0]].seed1++;
      for (const t of seeds) counts[t].playoffs++;
      for (const t of seeds.slice(0, 4)) counts[t].division++;
    }
    const afcChamp = simulatePlayoffs(afcSeeds, ratings, rand, solved.hfa);
    const nfcChamp = simulatePlayoffs(nfcSeeds, ratings, rand, solved.hfa);
    counts[afcChamp].conference++;
    counts[nfcChamp].conference++;
    const sbWinner = playGame(afcChamp, nfcChamp, ratings, rand, 0);
    counts[sbWinner].superbowl++;
    const key = [afcChamp, nfcChamp].sort().join('|');
    matchup[key] = (matchup[key] || 0) + 1;
  }

  const teams = {};
  for (const t of TEAMS) {
    teams[t] = {
      mean_wins: round(counts[t].wins / n, 4),
      playoffs: round(counts[t].playoffs / n, 4),
      division: round(counts[t].division / n, 4),
      seed1: round(counts[t].seed1 / n, 4),
      conference: round(counts[t].conference / n, 4),
      superbowl: round(counts[t].superbowl / n, 4),
      most_wins: round(counts[t].most_wins / n, 4),
      least_wins: round(counts[t].least_wins / n, 4),
      win_hist: Object.fromEntries(Object.entries(counts[t].hist).map(([k, v]) => [k, round(v / n, 4)])),
      input_mu: mus[t] ?? null,
    };
  }
  const matchupProb = Object.fromEntries(Object.entries(matchup).map(([k, v]) => [k, round(v / n, 6)]));
  return {
    meta: { sim_version: 'coherence-v1', sims: n, seed: opts.seed ?? SEED, sigma_r: opts.sigmaR ?? SIGMA_R, schedule_games: schedule.length, ratings_mae: solved.mae },
    teams,
    matchup: matchupProb,
    conservation: conservation(teams, matchupProb),
  };
}

function conservation(teams, matchup) {
  const divSums = {};
  for (const [team, row] of Object.entries(teams)) divSums[DIVISION[team]] = (divSums[DIVISION[team]] || 0) + row.division;
  return {
    division_sums: Object.fromEntries(Object.entries(divSums).map(([k, v]) => [k, round(v, 4)])),
    playoffs_sum: round(Object.values(teams).reduce((s, t) => s + t.playoffs, 0), 4),
    superbowl_sum: round(Object.values(teams).reduce((s, t) => s + t.superbowl, 0), 4),
    matchup_sum: round(Object.values(matchup).reduce((s, v) => s + v, 0), 4),
  };
}

function simProbForMarket(market, team, sim) {
  const row = sim.teams[team];
  if (!row) return null;
  if (market === 'playoffs') return row.playoffs;
  if (market?.startsWith('division_')) return row.division;
  if (market === 'conference_afc' || market === 'conference_nfc') return row.conference;
  if (market === 'superbowl') return row.superbowl;
  if (market === 'most_wins') return row.most_wins;
  if (market === 'least_wins') return row.least_wins;
  return null;
}

function ci90(p, n) {
  if (p == null || !n) return null;
  const m = 1.645 * Math.sqrt((p * (1 - p)) / n);
  return { lower: round(Math.max(0, p - m), 4), upper: round(Math.min(1, p + m), 4) };
}

function probOverFromHist(hist, line) {
  if (!hist || line == null) return null;
  return round(Object.entries(hist).reduce((sum, [wins, p]) => (
    Number(wins) > Number(line) ? sum + Number(p || 0) : sum
  ), 0), 4);
}

function edgePctFromFair(p, american) {
  if (p == null || american == null) return null;
  const dec = american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
  return round((p * dec - 1) * 100, 2);
}

function patchDossier(dossier, sim) {
  for (const [market, rows] of Object.entries(dossier.synthesis_input || {})) {
    for (const row of rows || []) {
      const team = row.team_nick || normalizeTeam(row.team);
      let p = simProbForMarket(market, team, sim);
      if (market === 'wins' && row.win_dist?.mu != null) {
        const t = sim.teams[team];
        const overProb = probOverFromHist(t?.win_hist, row.consensus_line);
        const underProb = overProb == null ? null : round(1 - overProb, 4);
        row.sim_win_total = {
          line: row.consensus_line,
          over_prob: overProb,
          under_prob: underProb,
          over_ci90: ci90(overProb, sim.meta.sims),
          under_ci90: ci90(underProb, sim.meta.sims),
          over_edge_pct: edgePctFromFair(overProb, row.best_over),
          under_edge_pct: edgePctFromFair(underProb, row.best_under),
          over_edge_lower_pct: edgePctFromFair(ci90(overProb, sim.meta.sims)?.lower, row.best_over),
          under_edge_lower_pct: edgePctFromFair(ci90(underProb, sim.meta.sims)?.lower, row.best_under),
          source: sim.meta.sim_version,
        };
        p = null;
      }
      if (market === 'superbowl_matchup') {
        const a = row.team_a, b = row.team_b;
        p = sim.matchup[[a, b].sort().join('|')] ?? (CONFERENCE[a] === CONFERENCE[b] ? 0 : null);
      }
      if (p == null) continue;
      const bestProb = row.best_prob ?? null;
      const probCi = ci90(p, sim.meta.sims);
      row.sim = {
        prob: p,
        prob_ci90: probCi,
        gap: bestProb == null ? null : round(p - bestProb, 4),
        gap_ci90: bestProb == null || !probCi ? null : { lower: round(probCi.lower - bestProb, 4), upper: round(probCi.upper - bestProb, 4) },
        n_eff_books: row.n_books ?? null,
        source: sim.meta.sim_version,
      };
      if ((row.n_books ?? 0) < 3 || market === 'superbowl_matchup' || market === 'most_wins' || market === 'least_wins') row.value_gap = null;
    }
  }
  dossier.meta.sim_version = sim.meta.sim_version;
  dossier.meta.sim_sims = sim.meta.sims;
  dossier.meta.sim_seed = sim.meta.seed;
  return dossier;
}

function round(x, n = 4) {
  return x == null ? null : Math.round(x * 10 ** n) / 10 ** n;
}

export { conservation, expectedWins, patchDossier, runSimulation, solveRatings };

async function main() {
  const dossier = JSON.parse(await readFile(DOSSIER, 'utf8'));
  const sim = runSimulation(dossier, { sims: SIMS, seed: SEED, sigmaR: SIGMA_R });
  const date = dossier.meta?.generated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const outPath = OUT ? path.resolve(ROOT, OUT) : path.join(OUT_DIR, `sim-${date}.json`);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(sim, null, 2));
  if (PATCH_DOSSIER) await writeFile(DOSSIER, JSON.stringify(patchDossier(dossier, sim), null, 2));
  console.log(`sim: ${sim.meta.sims} seasons, schedule ${sim.meta.schedule_games}, ratings MAE ${sim.meta.ratings_mae}`);
  console.log(`conservation: playoffs ${sim.conservation.playoffs_sum}, SB ${sim.conservation.superbowl_sum}, matchup ${sim.conservation.matchup_sum}`);
  console.log(`wrote ${outPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
}
