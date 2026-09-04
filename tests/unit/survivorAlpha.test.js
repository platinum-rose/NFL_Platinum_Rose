import { describe, expect, it } from 'vitest';
import {
  spreadToWinProbability,
  moneylineToWinProbability,
  getFavoriteTier,
  build18WeekGrid,
  calculateTeamFutureValue,
  computeAllTeamsFutureValues,
  isTeamAvailable,
  getBurnedTeams,
  simulateSurvivalPath,
  solveOptimalPaths,
  gradeSurvivorPick,
  detectTrapPicks,
} from '../../src/lib/survivorAlpha.js';

// Sample 2-game schedule fixture
const sampleSchedule = [
  {
    id: 'g1',
    week: 1,
    home: 'KC',
    visitor: 'LV',
    spread: -7.5,
    kickoff_utc: '2026-09-13T17:00:00.000Z',
  },
  {
    id: 'g2',
    week: 1,
    home: 'SF',
    visitor: 'ARI',
    spread: -10.0,
    kickoff_utc: '2026-09-13T20:25:00.000Z',
  },
  {
    id: 'g3',
    week: 2,
    home: 'BAL',
    visitor: 'KC',
    spread: -3.0,
    kickoff_utc: '2026-09-20T17:00:00.000Z',
  },
  {
    id: 'g4',
    week: 2,
    home: 'ARI',
    visitor: 'SF',
    spread: 7.0, // SF is visitor favorite -7.0
    kickoff_utc: '2026-09-20T20:05:00.000Z',
  },
];

describe('survivorAlpha', () => {
  describe('spreadToWinProbability', () => {
    it('accurately converts pick\'em (spread 0.0) to 50% win probability', () => {
      expect(spreadToWinProbability(0)).toBe(0.5);
    });

    it('converts standard key number spreads to expected straight-up win probabilities', () => {
      // 3-point favorite: ~58.8%
      const p3 = spreadToWinProbability(-3.0);
      expect(p3).toBeGreaterThan(0.57);
      expect(p3).toBeLessThan(0.61);

      // 7-point favorite: ~69.9%
      const p7 = spreadToWinProbability(-7.0);
      expect(p7).toBeGreaterThan(0.68);
      expect(p7).toBeLessThan(0.72);

      // 10-point favorite: ~77.1%
      const p10 = spreadToWinProbability(-10.0);
      expect(p10).toBeGreaterThan(0.75);
      expect(p10).toBeLessThan(0.80);

      // 14-point heavy favorite: ~85.1%
      const p14 = spreadToWinProbability(-14.0);
      expect(p14).toBeGreaterThan(0.83);
      expect(p14).toBeLessThan(0.88);

      // 7-point underdog: ~30.1%
      const dog7 = spreadToWinProbability(7.0);
      expect(dog7).toBeGreaterThan(0.28);
      expect(dog7).toBeLessThan(0.32);
      expect(Math.round((p7 + dog7) * 100) / 100).toBe(1.0);
    });
  });

  describe('moneylineToWinProbability', () => {
    it('converts favorite and underdog moneylines to win probabilities', () => {
      expect(moneylineToWinProbability(-300)).toBeCloseTo(0.75, 2);
      expect(moneylineToWinProbability(+200)).toBeCloseTo(0.3333, 2);
    });
  });

  describe('getFavoriteTier', () => {
    it('categorizes tiers correctly', () => {
      expect(getFavoriteTier(0.80, -8.0).tier).toBe('heavy_favorite');
      expect(getFavoriteTier(0.65, -4.5).tier).toBe('moderate_favorite');
      expect(getFavoriteTier(0.52, -1.0).tier).toBe('slight_favorite');
      expect(getFavoriteTier(0.45, +2.5).tier).toBe('slight_underdog');
      expect(getFavoriteTier(0.25, +9.0).tier).toBe('heavy_underdog');
    });
  });

  describe('build18WeekGrid', () => {
    it('creates full 32-team by 18-week grid structure with proper win probabilities and bye markers', () => {
      const grid = build18WeekGrid(sampleSchedule);
      expect(Object.keys(grid.teams)).toHaveLength(32);
      expect(grid.teams.KC).toBeDefined();
      expect(grid.teams.KC.weeks[1].opponent).toBe('LV');
      expect(grid.teams.KC.weeks[1].isHome).toBe(true);
      expect(grid.teams.KC.weeks[1].spread).toBe(-7.5);
      expect(grid.teams.KC.weeks[1].winProb).toBeGreaterThan(0.70);
      expect(grid.teams.KC.weeks[1].isBye).toBe(false);

      // Week 3 for KC is bye in sampleSchedule
      expect(grid.teams.KC.weeks[3].isBye).toBe(true);
      expect(grid.teams.KC.weeks[3].opponent).toBeNull();
    });

    it('applies auto-grading when game results are provided', () => {
      const results = {
        g1: { homeScore: 28, visitorScore: 14 }, // KC beat LV
      };
      const grid = build18WeekGrid(sampleSchedule, results);
      expect(grid.teams.KC.weeks[1].result).toBe('WIN');
      expect(grid.teams.LV.weeks[1].result).toBe('LOSS');
    });
  });

  describe('calculateTeamFutureValue & computeAllTeamsFutureValues', () => {
    it('computes future value score for teams with upcoming high win probabilities', () => {
      const grid = build18WeekGrid(sampleSchedule);
      const sfFv = calculateTeamFutureValue('SF', 1, grid);
      expect(sfFv.fvScore).toBeGreaterThan(0);
      expect(sfFv.topFutureWeeks).toBeDefined();

      const allFvs = computeAllTeamsFutureValues(1, grid);
      expect(Object.keys(allFvs)).toHaveLength(32);
    });
  });

  describe('isTeamAvailable & getBurnedTeams', () => {
    it('rejects reusing a team picked in another week', () => {
      const picks = { 1: 'KC', 2: 'SF' };
      // In week 3, KC and SF are not available
      expect(isTeamAvailable('KC', picks, 3)).toBe(false);
      expect(isTeamAvailable('SF', picks, 3)).toBe(false);
      expect(isTeamAvailable('BAL', picks, 3)).toBe(true);

      // In week 1, KC IS available because week 1 is currently assigned to KC
      expect(isTeamAvailable('KC', picks, 1)).toBe(true);
    });

    it('returns list of burned teams', () => {
      const picks = { 1: 'KC', 2: 'SF', 3: 'BAL' };
      expect(getBurnedTeams(picks)).toEqual(['KC', 'SF', 'BAL']);
      expect(getBurnedTeams(picks, 2)).toEqual(['KC', 'BAL']);
    });
  });

  describe('simulateSurvivalPath', () => {
    it('accurately compounds survival probabilities and identifies bottleneck week', () => {
      const grid = build18WeekGrid(sampleSchedule);
      const picks = { 1: 'KC', 2: 'SF' };
      const sim = simulateSurvivalPath(picks, grid);

      expect(sim.weeksCovered).toBe(2);
      expect(sim.isValid).toBe(true);
      expect(sim.survivalProb).toBeGreaterThan(0.45);
      expect(sim.steps[0].team).toBe('KC');
      expect(sim.steps[1].team).toBe('SF');
    });

    it('flags invalid paths with team reuse or bye weeks', () => {
      const grid = build18WeekGrid(sampleSchedule);
      const picks = { 1: 'KC', 2: 'KC' }; // Reused KC
      const sim = simulateSurvivalPath(picks, grid);
      expect(sim.isValid).toBe(false);
      expect(sim.violations.length).toBeGreaterThan(0);
    });
  });

  describe('solveOptimalPaths', () => {
    it('generates 3 distinct valid path strategies with zero duplicate team assignments', () => {
      // Test with real full schedule from data/alpha
      const fullSchedule = require('../../data/alpha/alpha-packet-2026.json').schedule;
      const grid = build18WeekGrid(fullSchedule);
      const paths = solveOptimalPaths(grid);

      expect(paths).toHaveLength(3);
      expect(paths[0].id).toBe('max_ev_survival_path');
      expect(paths[1].id).toBe('contrarian_game_theory_path');
      expect(paths[2].id).toBe('conservative_high_floor_path');

      for (const route of paths) {
        expect(route.simulation.isValid).toBe(true);
        expect(route.simulation.isComplete).toBe(true);
        expect(route.simulation.weeksCovered).toBe(18);

        // Verify strictly 18 unique teams used
        const pickedTeams = Object.values(route.picks);
        expect(new Set(pickedTeams).size).toBe(18);
      }
    });
  });

  describe('detectTrapPicks', () => {
    it('flags picked teams with win probability < 60% or spread > -3.5 as trap games', () => {
      const grid = build18WeekGrid(sampleSchedule);
      // In sampleSchedule week 1: LV is a +7.5 dog (win prob ~28%)
      const picks = { 1: 'LV' };
      const traps = detectTrapPicks(picks, grid);

      expect(traps).toHaveLength(1);
      expect(traps[0].week).toBe(1);
      expect(traps[0].team).toBe('LV');
      expect(traps[0].severity).toBe('CRITICAL');
      expect(traps[0].alternativePivots.length).toBeGreaterThan(0);
      const altTeams = traps[0].alternativePivots.map((p) => p.team);
      expect(altTeams).toContain('SF');
      expect(altTeams).toContain('KC');
    });

    it('does not flag heavy favorites as traps', () => {
      const grid = build18WeekGrid(sampleSchedule);
      // KC is a -7.5 favorite (win prob ~71%)
      const picks = { 1: 'KC' };
      const traps = detectTrapPicks(picks, grid);
      expect(traps).toHaveLength(0);
    });
  });

  describe('gradeSurvivorPick', () => {
    it('grades straight-up winner regardless of spread', () => {
      // Home team wins
      expect(gradeSurvivorPick({ isHomeTeam: true }, 24, 21)).toBe('WIN');
      // Home team loses
      expect(gradeSurvivorPick({ isHomeTeam: true }, 20, 24)).toBe('LOSS');
      // Away team wins
      expect(gradeSurvivorPick({ isHomeTeam: false }, 17, 20)).toBe('WIN');
      // Tie
      expect(gradeSurvivorPick({ isHomeTeam: true }, 20, 20)).toBe('PUSH');
    });
  });
});

