import { describe, expect, it } from 'vitest';
import { runSimulation } from '../../agents/portfolio-simulate.js';

function syntheticDossier() {
  const teams = [
    'Bills', 'Dolphins', 'Patriots', 'Jets',
    'Chiefs', 'Chargers', 'Raiders', 'Broncos',
    'Ravens', 'Bengals', 'Browns', 'Steelers',
    'Texans', 'Colts', 'Jaguars', 'Titans',
    'Eagles', 'Cowboys', 'Giants', 'Commanders',
    'Packers', 'Lions', 'Bears', 'Vikings',
    'Falcons', 'Saints', 'Panthers', 'Buccaneers',
    'Rams', '49ers', 'Seahawks', 'Cardinals',
  ];
  const schedule = [];
  for (let week = 1; week <= 17; week++) {
    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[(i + week - 1) % teams.length];
      const b = teams[(i + week) % teams.length];
      schedule.push({ week, season_type: 2, home: week % 2 ? a : b, away: week % 2 ? b : a });
    }
  }
  return {
    meta: { season: 2026 },
    schedule,
    synthesis_input: {
      wins: teams.map((team) => ({ team, team_nick: team, win_dist: { mu: 8.5, sigma: 2.7 } })),
    },
  };
}

describe('portfolio-simulate', () => {
  it('conserves playoff and Super Bowl probabilities', () => {
    const sim = runSimulation(syntheticDossier(), { sims: 300, seed: 1, sigmaR: 0 });
    expect(sim.conservation.playoffs_sum).toBeCloseTo(14, 1);
    expect(sim.conservation.superbowl_sum).toBeCloseTo(1, 3);
    expect(sim.conservation.matchup_sum).toBeCloseTo(1, 3);
    for (const sum of Object.values(sim.conservation.division_sums)) expect(sum).toBeCloseTo(1, 2);
  });
});
