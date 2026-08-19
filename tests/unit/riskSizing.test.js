import { describe, expect, it } from 'vitest';

import {
  americanOddsToNetOdds,
  calculateRiskSizing,
  expectedValuePerDollar,
  impliedProbability,
  kellyFraction,
  logGrowth,
  normalizeProbability,
  returnVolatility,
  riskOfRuinEvenMoney,
} from '../../src/lib/riskSizing.js';

describe('riskSizing', () => {
  it('normalizes percent and decimal probability inputs', () => {
    expect(normalizeProbability(55)).toBeCloseTo(0.55, 8);
    expect(normalizeProbability(0.55)).toBeCloseTo(0.55, 8);
  });

  it('converts American odds to net odds', () => {
    expect(americanOddsToNetOdds(250)).toBeCloseTo(2.5, 8);
    expect(americanOddsToNetOdds(-150)).toBeCloseTo(2 / 3, 8);
    expect(impliedProbability(250)).toBeCloseTo(1 / 3.5, 8);
  });

  it('reproduces the article even-money coin example', () => {
    expect(expectedValuePerDollar(0.55, 100)).toBeCloseTo(0.10, 8);
    expect(returnVolatility(0.55, 100)).toBeCloseTo(0.9949874, 6);
    expect(kellyFraction(0.55, 100)).toBeCloseTo(0.10, 8);
    expect(riskOfRuinEvenMoney(0.55, 4)).toBeCloseTo(0.448125, 6);
    expect(riskOfRuinEvenMoney(0.55, 20)).toBeCloseTo(0.0180716, 6);
  });

  it('matches the article log-growth curve', () => {
    expect(logGrowth(0.55, 100, 0.05)).toBeCloseTo(0.0037526, 6);
    expect(logGrowth(0.55, 100, 0.10)).toBeCloseTo(0.0050084, 6);
    expect(logGrowth(0.55, 100, 0.20)).toBeCloseTo(-0.0001377, 6);
    expect(logGrowth(0.55, 100, 0.35)).toBeCloseTo(-0.0287948, 6);
    expect(logGrowth(0.55, 100, 0.50)).toBeCloseTo(-0.0889104, 6);
  });

  it('builds a fractional-Kelly stake report for a plus-money edge', () => {
    const result = calculateRiskSizing({
      model_probability: 0.35,
      odds: 250,
      bankroll: 1000,
      unit_size: 25,
      fractional_kelly: 0.25,
      max_stake_fraction: 0.05,
    });

    expect(result.status).toBe('sizable_edge');
    expect(result.expected_value_per_dollar).toBeCloseTo(0.225, 8);
    expect(result.full_kelly_fraction).toBeCloseTo(0.09, 8);
    expect(result.recommended_stake_fraction).toBeCloseTo(0.0225, 8);
    expect(result.recommended_stake).toBeCloseTo(22.5, 8);
    expect(result.recommended_units).toBeCloseTo(0.9, 8);
    expect(result.geometric_growth_at_recommended).toBeGreaterThan(0);
  });

  it('returns pass for negative-EV inputs', () => {
    const result = calculateRiskSizing({
      model_probability: 0.40,
      odds: -110,
      bankroll: 1000,
    });

    expect(result.status).toBe('pass');
    expect(result.recommended_stake).toBe(0);
    expect(result.flags).toContain('no_positive_ev');
    expect(result.flags).toContain('no_kelly_stake');
  });
});
