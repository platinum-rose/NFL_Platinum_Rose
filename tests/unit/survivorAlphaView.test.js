import { beforeEach, describe, expect, it, vi } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _store: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import {
  loadSurvivorPicks,
  saveSurvivorPicks,
  loadSurvivorContestState,
  saveSurvivorContestState,
  calculateFieldExposure,
  autoGradeOpponents,
  isTeamAvailable,
  getBurnedTeams,
  simulateSurvivalPath,
  build18WeekGrid,
  solveOptimalPaths,
  SURVIVOR_CONTESTS,
} from '../../src/lib/survivorAlpha.js';

describe('survivorAlphaView & Profile Isolation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('maintains strict profile isolation between different Alpha testers', () => {
    const testerA = 'amanda_rose';
    const testerB = 'patrick_fagan';
    const season = 2026;

    // Tester A saves picks
    const picksA = { 1: 'KC', 2: 'SF', 3: 'BAL' };
    saveSurvivorPicks(testerA, picksA, season);

    // Tester B saves different picks
    const picksB = { 1: 'DET', 2: 'BUF', 3: 'PHI' };
    saveSurvivorPicks(testerB, picksB, season);

    // Verify Tester A's picks load correctly without contamination
    const loadedA = loadSurvivorPicks(testerA, season);
    expect(loadedA).toEqual(picksA);

    // Verify Tester B's picks load correctly without contamination
    const loadedB = loadSurvivorPicks(testerB, season);
    expect(loadedB).toEqual(picksB);

    // Verify no cross-talk
    expect(loadedA).not.toEqual(loadedB);
  });

  it('maintains strict contest isolation between Ken\'s Survival League and LMS 2022', () => {
    const tester = 'amanda_rose';
    const season = 2026;

    const stateKens = {
      picks: { 1: 'KC', 2: 'BAL' },
      opponents: [
        { id: 'opp_1', name: 'Ken', status: 'alive', picks: { 1: 'KC', 2: 'CIN' } },
        { id: 'opp_2', name: 'Bob', status: 'alive', picks: { 1: 'SF', 2: 'DET' } },
      ],
    };

    const stateLms = {
      picks: { 1: 'DET', 2: 'PHI' },
      opponents: [
        { id: 'opp_3', name: 'Dave', status: 'alive', picks: { 1: 'BAL', 2: 'KC' } },
      ],
    };

    saveSurvivorContestState(tester, 'kens_survival_league', stateKens, season);
    saveSurvivorContestState(tester, 'lms_2022', stateLms, season);

    const loadedKens = loadSurvivorContestState(tester, 'kens_survival_league', season);
    const loadedLms = loadSurvivorContestState(tester, 'lms_2022', season);

    expect(loadedKens.picks).toEqual(stateKens.picks);
    expect(loadedKens.opponents).toHaveLength(2);
    expect(loadedLms.picks).toEqual(stateLms.picks);
    expect(loadedLms.opponents).toHaveLength(1);
    expect(loadedKens.picks).not.toEqual(loadedLms.picks);
  });

  it('calculates field exposure, consensus picks, and team availability accurately', () => {
    const fullSchedule = require('../../data/alpha/alpha-packet-2026.json').schedule;
    const grid = build18WeekGrid(fullSchedule);

    const opponents = [
      { id: 'o1', name: 'Ken', status: 'alive', picks: { 1: 'KC', 2: 'BAL' } },
      { id: 'o2', name: 'Bob', status: 'alive', picks: { 1: 'KC', 2: 'CIN' } },
      { id: 'o3', name: 'Sarah', status: 'alive', picks: { 1: 'DET', 2: 'SF' } },
      { id: 'o4', name: 'Dave', status: 'eliminated', eliminatedWeek: 1, picks: { 1: 'LV' } },
    ];

    const myPicks = { 1: 'CIN', 2: 'PHI' };
    const analytics = calculateFieldExposure(opponents, 1, grid, myPicks);

    expect(analytics.totalCount).toBe(4);
    expect(analytics.aliveCount).toBe(3);
    expect(analytics.eliminatedCount).toBe(1);
    expect(analytics.survivalRate).toBe(75);

    // Week 1 chalk check (KC picked by 2 alive players = 66.7%)
    const kcDist = analytics.weekDistribution.find((d) => d.team === 'KC');
    expect(kcDist).toBeDefined();
    expect(kcDist.count).toBe(2);

    // Team availability: KC has been burned by 2/3 alive opponents
    expect(analytics.teamAvailability['KC'].burnedCount).toBe(2);
    expect(analytics.teamAvailability['KC'].userAvailable).toBe(true);
  });

  it('enforces No Team Reuse across weeks in profile pick state', () => {
    const picks = { 1: 'KC', 2: 'SF' };
    expect(isTeamAvailable('KC', picks, 3)).toBe(false);
    expect(isTeamAvailable('SF', picks, 3)).toBe(false);
    expect(isTeamAvailable('DET', picks, 3)).toBe(true);

    const burned = getBurnedTeams(picks);
    expect(burned).toContain('KC');
    expect(burned).toContain('SF');
    expect(burned).not.toContain('DET');
  });

  it('runs complete 18-week simulation for optimal routes', () => {
    const fullSchedule = require('../../data/alpha/alpha-packet-2026.json').schedule;
    const grid = build18WeekGrid(fullSchedule);
    const paths = solveOptimalPaths(grid);

    expect(paths.length).toBe(3);
    const [maxEv, contrarian, conservative] = paths;

    expect(maxEv.simulation.isValid).toBe(true);
    expect(contrarian.simulation.isValid).toBe(true);
    expect(conservative.simulation.isValid).toBe(true);

    // Check that contrarian path picks are populated
    const earlyContrarianPicks = [
      contrarian.picks[1],
      contrarian.picks[2],
      contrarian.picks[3],
      contrarian.picks[4],
      contrarian.picks[5],
      contrarian.picks[6],
    ];

    expect(earlyContrarianPicks.length).toBe(6);
  });
});
