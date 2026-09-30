import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'reports/analysis/w1-3-deep/codex/alternative_baskets.json');

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pickDistinctGames(rows, size, random) {
  const pool = [...rows];
  const picked = [];
  while (pool.length && picked.length < size) {
    const index = Math.floor(random() * pool.length);
    const [candidate] = pool.splice(index, 1);
    if (!picked.some((row) => row.game === candidate.game)) picked.push(candidate);
  }
  return picked.length === size ? picked : null;
}

function uniquePositions(rows) {
  const positions = new Map();
  for (const row of rows) {
    const key = [row.game, row.player || '', row.market, row.direction, row.line ?? ''].join('|');
    if (!positions.has(key)) positions.set(key, row);
  }
  return [...positions.values()];
}

export function simulate(rows, { trials = 10000, seed = 20260929 } = {}) {
  const resolvedLegs = rows.filter((row) => ['WON', 'LOST'].includes(row.result));
  const usable = uniquePositions(resolvedLegs);
  const random = seeded(seed);
  const scenarios = [
    ['single', 1], ['two_leg_parlay', 2], ['three_leg_parlay', 3], ['four_leg_parlay', 4], ['five_leg_parlay', 5],
  ].map(([name, legs]) => {
    let hits = 0;
    let completed = 0;
    for (let trial = 0; trial < trials; trial += 1) {
      const basket = pickDistinctGames(usable, legs, random);
      if (!basket) continue;
      completed += 1;
      if (basket.every((row) => row.result === 'WON')) hits += 1;
    }
    return { scenario: name, legs, trials: completed, all_legs_won_rate: completed ? hits / completed : null };
  });
  let rrWinningCombos = 0;
  let rrTrials = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    const basket = pickDistinctGames(usable, 3, random);
    if (!basket) continue;
    rrTrials += 1;
    const wins = basket.filter((row) => row.result === 'WON').length;
    rrWinningCombos += wins * (wins - 1) / 2;
  }
  scenarios.push({ scenario: 'two_team_round_robin_from_three', legs: 3, trials: rrTrials, mean_winning_combos_of_three: rrTrials ? rrWinningCombos / rrTrials : null });
  return { seed, trials_requested: trials, resolved_legs: resolvedLegs.length, unique_positions_sampled: usable.length, scenarios };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/analysis/w1-3-deep/codex/regrade_legs.json')));
  const output = {
    generated_at: new Date().toISOString(),
    method: 'Deterministic bootstrap of individually graded W1-W3 NFL legs, de-duplicated to distinct positions; each basket uses distinct game labels as an independence proxy.',
    limitations: [
      'This is a retrospective hit-rate exercise, not an estimate of future edge or a recommendation.',
      'It does not calculate ROI because prices and settlement rules are incomplete or heterogeneous in the source ledger.',
      'Three weeks is too small to infer stable probabilities; same-game correlation is excluded rather than modeled.',
    ],
    all_supported_markets: simulate(rows),
    player_props_only: simulate(rows.filter((row) => !['moneyline', 'spread', 'total', 'alternate_total_points', 'team_total'].includes(row.market)), { seed: 20260930 }),
  };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
}
