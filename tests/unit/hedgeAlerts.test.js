import { describe, expect, it } from 'vitest';
import {
  amToDec,
  alertMessage,
  buildHedgeAlerts,
  decToAm,
  hedgeDirectionsConflict,
  hedgeOutcome,
  legOutcome,
  scenarioGrid,
} from '../../scripts/lib/hedge-alerts.mjs';

const EVENT = '401873022';
const event = { id: EVENT, home: 'SEA', away: 'KC', state: 'pre', label: 'KC @ SEA' };
const odds = {
  provider: 'DraftKings', home: 'SEA', away: 'KC', spreadHome: -3,
  spreadOddsHome: -108, spreadOddsAway: -112, homeML: -162, awayML: 136,
  ou: 43.5, overOdds: -105, underOdds: -115,
};
const maps = () => [new Map([[EVENT, event]]), new Map([[EVENT, odds]])];
const sideLeg = (team = 'KC', line = 3.5, selection = 'KC +3.5') => ({
  kind: 'side', team, line, eventId: EVENT, selection,
});

describe('hedge-alerts pure functions', () => {
  it('converts American and decimal odds, rejecting invalid values', () => {
    expect(amToDec(150)).toBe(2.5);
    expect(amToDec(-110)).toBeCloseTo(1.90909, 5);
    expect(amToDec(0)).toBeNull();
    expect(amToDec(Infinity)).toBeNull();
    expect(decToAm(2.5)).toBe('+150');
    expect(decToAm(1.90909)).toBe('-110');
    expect(decToAm(1)).toBeNull();
  });

  it('normalizes a scenario grid to unit probability with legal score parity', () => {
    const grid = scenarioGrid(odds);
    expect(grid.length).toBeGreaterThan(100);
    expect(grid.reduce((sum, [, , probability]) => sum + probability, 0)).toBeCloseTo(1, 10);
    expect(grid.every(([margin, total]) => Math.abs(margin) <= total && (total - Math.abs(margin)) % 2 === 0)).toBe(true);
    expect(grid.some(([margin]) => margin === 0)).toBe(false);
  });

  it('treats a leg push as alive and a straight hedge push as a refund', () => {
    const pushedSide = { kind: 'side', team: 'SEA', line: -3, selection: 'SEA -3' };
    expect(legOutcome(pushedSide, odds, 3, 23)).toBe(true);
    expect(hedgeOutcome(pushedSide, odds, 3, 23)).toBeNull();
    const pushedTotal = { kind: 'total', dir: 'under', line: 23 };
    expect(legOutcome(pushedTotal, odds, 3, 23)).toBe(true);
    expect(hedgeOutcome(pushedTotal, odds, 3, 23)).toBeNull();
  });

  it('computes equalizing and half hedge sizes from the full return', () => {
    const [events, oddsById] = maps();
    const ticket = { id: 'large', book: 'BKR', title: 'large payout', stake: 15, pay: 368.39, open: [sideLeg()] };
    const alert = buildHedgeAlerts([ticket], events, oddsById).find((a) => a.type === 'last_game');
    expect(alert).toBeDefined();
    expect(alert.hedge.full.stake).toBeCloseTo(368.39 / (1 + 100 / 108), 2);
    expect(alert.hedge.half.stake).toBeCloseTo(alert.hedge.full.stake / 2, 2);
    expect(alert.hedge.full.ifTicket + alert.hedge.full.stake).toBeCloseTo(368.39, 2);
  });

  it('counts live round-robin combo returns and banked combo returns, excluding dead combos', () => {
    const [events, oddsById] = maps();
    const ticket = {
      id: 'rr', book: 'BKR', title: 'RR', stake: 20, pay: 100,
      open: [sideLeg()],
      rr: { banked: 155, combos: [
        { ret: 100, openLegs: [sideLeg()] },
        { ret: 800, dead: true, openLegs: [sideLeg()] },
      ] },
    };
    const alert = buildHedgeAlerts([ticket], events, oddsById).find((a) => a.type === 'last_game');
    expect(alert.pay).toBe(255);
    expect(alert.hedge.full.stake).toBeCloseTo(255 / amToDec(alert.hedge.price), 2);
  });

  it('detects opposing side hedges but ignores totals and same-side hedges', () => {
    expect(hedgeDirectionsConflict('KC ML', 'SEA -3')).toBe(true);
    expect(hedgeDirectionsConflict('SEA -3', 'SEA ML')).toBe(false);
    expect(hedgeDirectionsConflict('Under 43.5', 'SEA -3')).toBe(false);
    expect(hedgeDirectionsConflict(undefined, 'SEA -3')).toBe(false);
  });

  it('keeps the W7 SNF replay alert recommendations stable', () => {
    const [events, oddsById] = maps();
    const ticket = { id: '740512242', book: 'BKR', title: 'BKR 6-team flex', stake: 15, pay: 368.39, open: [sideLeg()] };
    const alerts = buildHedgeAlerts([ticket], events, oddsById);
    const flex = alerts.find((a) => a.type === 'last_game');
    const gap = alerts.find((a) => a.type === 'game_gap');
    expect(flex.hedge.market).toBe('SEA -3');
    expect(gap.table.some((cell) => cell.dead && cell.margin === 'SEA by 8+' && cell.total.startsWith('Under'))).toBe(true);
    expect(hedgeOutcome({ kind: 'side', team: 'SEA', line: -3 }, odds, 17, 23)).toBe(true);
    expect(alertMessage(flex)).toContain('Hedge SEA -3');
  });
});
