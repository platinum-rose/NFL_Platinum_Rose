// tests/unit/pickem.test.js — scripts/lib/pickem.mjs (pick'em / confidence pools)
import { describe, it, expect } from 'vitest';
import { buildGames, planPool, gradePool, normTeam, assignSlots, expectedPoints } from '../../scripts/lib/pickem.mjs';

const T0 = '2026-09-24T13:00:00Z';
const ml = (game_id, home, away, commence_time, hp, ap, captured_at = T0, book = 'draftkings') =>
  ({ game_id, home_team: home, away_team: away, commence_time, book, market: 'moneyline', home_price: hp, away_price: ap, captured_at });

// 6-game slate: two heavy favorites, one mid, three near coin flips
const rows = [
  ml('g_GB_ATL', 'GB', 'ATL', '2026-09-25T00:15:00Z', -245, 200),
  ml('g_KC_MIA', 'MIA', 'KC', '2026-09-27T17:00:00Z', 470, -650),
  ml('g_CIN', 'PIT', 'CIN', '2026-09-27T17:00:00Z', 154, -185),
  ml('g_NYG', 'NYG', 'TEN', '2026-09-27T17:00:00Z', -142, 120),
  ml('g_IND', 'IND', 'HOU', '2026-09-27T17:00:00Z', 114, -135),
  ml('g_TB', 'TB', 'MIN', '2026-09-27T20:05:00Z', 102, -122),
];
const leans = [
  { team: 'ATL', tier: '2', why: 'x' }, { team: 'TEN', tier: '1+2', why: 'x' },
  { team: 'IND', tier: '2', why: 'x' }, { team: 'TB', tier: '2', why: 'x' },
];
const conf = (id, strategy, extra = {}) => ({ id, format: 'confidence', strategy, ...extra });

describe('buildGames', () => {
  it('de-vigs and averages books; picks the favorite', () => {
    const g = buildGames([...rows, ml('g_GB_ATL', 'GB', 'ATL', '2026-09-25T00:15:00Z', -250, 205, T0, 'fanduel')]).find(x => x.game_id === 'g_GB_ATL');
    expect(g.books).toBe(2);
    expect(g.fav).toBe('GB');
    expect(g.p_fav).toBeGreaterThan(0.67);
    expect(g.p_fav).toBeLessThan(0.69);
  });
  it('uses the latest snapshot at or before kickoff (closing line), ignoring in-game rows', () => {
    const r = [
      ml('g1', 'GB', 'ATL', '2026-09-25T00:15:00Z', -300, 250, '2026-09-24T13:00:00Z'),
      ml('g1', 'GB', 'ATL', '2026-09-25T00:15:00Z', -200, 170, '2026-09-24T23:00:00Z'),
      ml('g1', 'GB', 'ATL', '2026-09-25T00:15:00Z', 500, -800, '2026-09-25T03:00:00Z'),
    ];
    const g = buildGames(r)[0];
    expect(g.odds_captured_at).toBe('2026-09-24T23:00:00Z');
    expect(g.fav).toBe('GB');
    expect(g.p_fav).toBeLessThan(0.66);
  });
  it('normalizes WAS/LA/full names', () => {
    expect(normTeam('WAS')).toBe('WSH');
    expect(normTeam('LA')).toBe('LAR');
    expect(normTeam('Green Bay Packers')).toBe('GB');
  });
});

describe('assignSlots / expectedPoints', () => {
  it('keeps fixed slots and fills the rest ascending by probability', () => {
    const p = assignSlots([
      { game_id: 'a', p: 0.9, confidence: null }, { game_id: 'b', p: 0.3, confidence: 3 }, { game_id: 'c', p: 0.6, confidence: null },
    ], 3);
    expect(p.map(x => x.confidence)).toEqual([2, 3, 1]);
    expect(expectedPoints(p)).toBeCloseTo(0.9 * 2 + 0.3 * 3 + 0.6, 5);
  });
});

describe('planPool', () => {
  const games = buildGames(rows);

  it('market: all favorites ranked by win probability; locked slot respected', () => {
    const plan = planPool(conf('ssw', 'market'), games, leans, { GB: { confidence: 4, status: 'submitted' } });
    expect(plan.flips).toEqual([]);
    const gb = plan.picks.find(p => p.team === 'GB');
    expect(gb.confidence).toBe(4);
    expect(plan.picks.find(p => p.team === 'KC').confidence).toBe(6);
    expect(new Set(plan.picks.map(p => p.confidence)).size).toBe(6);
  });

  it('weekly_leverage: locked heavy fade counts against the budget; coin flips go to the bottom slots', () => {
    const pool = conf('yahoo', 'weekly_leverage', { leverage: { max_heavy_fades: 1, heavy_fade_slot: 3, max_coinflip_flips: 2, coinflip_max_prob: 0.57, max_tier: 2, max_ev_cost: 5 } });
    const plan = planPool(pool, games, leans, { ATL: { confidence: 3, status: 'proposed' } });
    const by = Object.fromEntries(plan.picks.map(p => [p.team, p]));
    expect(by.ATL.confidence).toBe(3);
    expect(by.TB.confidence).toBe(2);   // MIN 53% is the closest coin flip -> cheapest flip
    expect(by.IND.confidence).toBe(1);
    expect(by.NYG).toBeDefined();       // TEN (57.2%) not flipped: only 2 coin-flip flips allowed
    expect(plan.ev_cost).toBeGreaterThan(0);
  });

  it('weekly_leverage: picks a heavy fade itself when none is locked', () => {
    const pool = conf('yahoo', 'weekly_leverage', { leverage: { max_heavy_fades: 1, heavy_fade_slot: 2, max_coinflip_flips: 0, max_ev_cost: 5 } });
    const plan = planPool(pool, games, leans, {});
    const atl = plan.picks.find(p => p.team === 'ATL');
    expect(atl.source).toBe('heavy_fade');
    expect(atl.confidence).toBe(2);
  });

  it('weekly_leverage: drops flips to stay inside the expected-points budget', () => {
    const pool = conf('yahoo', 'weekly_leverage', { leverage: { max_heavy_fades: 1, heavy_fade_slot: 3, max_coinflip_flips: 2, max_ev_cost: 0.1 } });
    const plan = planPool(pool, games, leans, {});
    expect(plan.ev_cost).toBeLessThanOrEqual(0.1);
  });

  it('su_flips: flips only near coin flips backed by leans', () => {
    const plan = planPool({ id: 'cbs', format: 'straight_up', strategy: 'su_flips', flips: { max: 2, coinflip_max_prob: 0.57 } }, games, leans, { GB: { status: 'submitted' } });
    expect(plan.flips.map(f => f.team).sort()).toEqual(['IND', 'TB']);
    expect(plan.picks.find(p => p.game_id === 'g_GB_ATL').team).toBe('GB');
    expect(plan.picks.every(p => p.confidence == null)).toBe(true);
  });
});

describe('gradePool', () => {
  const results = [
    { home_team: 'Green Bay Packers', away_team: 'Atlanta Falcons', home_score: 20, away_score: 24, status: 'final' },
    { home_team: 'Miami Dolphins', away_team: 'Kansas City Chiefs', home_score: 10, away_score: 31, status: 'final' },
    { home_team: 'Tampa Bay Buccaneers', away_team: 'Minnesota Vikings', home_score: 17, away_score: 17, status: 'final' },
  ];
  it('confidence: sums slots of correct picks; ties score 0; unplayed = pending', () => {
    const g = gradePool([{ team: 'ATL', confidence: 3 }, { team: 'KC', confidence: 16 }, { team: 'TB', confidence: 2 }, { team: 'IND', confidence: 1 }], results, 'confidence');
    expect(g.points).toBe(19);
    expect(g.correct).toBe(2);
    expect(g.graded).toBe(3);
    expect(g.detail.find(d => d.team === 'TB').result).toBe('tie');
    expect(g.detail.find(d => d.team === 'IND').result).toBe('pending');
  });
  it('straight-up: one point per win', () => {
    expect(gradePool([{ team: 'GB' }, { team: 'KC' }], results, 'straight_up').points).toBe(1);
  });
});
