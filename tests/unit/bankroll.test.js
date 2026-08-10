/**
 * Unit tests for src/lib/bankroll.js
 *
 * Run: npx vitest run
 * Coverage: npx vitest run --coverage
 */
import { describe, it, expect, vi } from 'vitest';

// Mock storage and supabase to avoid localStorage/network in Node.
vi.mock('../../src/lib/storage.js', () => ({
  loadFromStorage: vi.fn(() => null),
  saveToStorage: vi.fn(),
  PR_STORAGE_KEYS: {
    BANKROLL: { key: 'nfl_bankroll_v1' },
  },
}));

vi.mock('../../src/lib/supabase.js', () => ({
  syncBet: vi.fn(async () => null),
  supabase: null,
}));

import {
  BET_STATUS,
  BET_TYPES,
  calculateKellyUnit,
  getRecommendedUnit,
  importBankrollData,
} from '../../src/lib/bankroll.js';

describe('bankroll', () => {
  describe('BET_STATUS', () => {
    it('exports all five status values', () => {
      expect(BET_STATUS.PENDING).toBeDefined();
      expect(BET_STATUS.WON).toBeDefined();
      expect(BET_STATUS.LOST).toBeDefined();
      expect(BET_STATUS.PUSHED).toBeDefined();
      expect(BET_STATUS.VOID).toBeDefined();
    });

    it('PENDING is a non-empty string', () => {
      expect(typeof BET_STATUS.PENDING).toBe('string');
      expect(BET_STATUS.PENDING.length).toBeGreaterThan(0);
    });

    it('all status values are distinct', () => {
      const values = Object.values(BET_STATUS);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe('BET_TYPES', () => {
    it('exports all seven bet types', () => {
      expect(BET_TYPES.SPREAD).toBeDefined();
      expect(BET_TYPES.MONEYLINE).toBeDefined();
      expect(BET_TYPES.TOTAL).toBeDefined();
      expect(BET_TYPES.PROP).toBeDefined();
      expect(BET_TYPES.TEASER).toBeDefined();
      expect(BET_TYPES.PARLAY).toBeDefined();
      expect(BET_TYPES.FUTURES).toBeDefined();
    });

    it('all type values are distinct strings', () => {
      const values = Object.values(BET_TYPES);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe('calculateKellyUnit', () => {
    it('returns positive amount for a clearly +EV bet', () => {
      // 60% win at +200: b=2, p=0.6, q=0.4 → f=(2×0.6-0.4)/2=0.4 → cap 25% → 250
      const unit = calculateKellyUnit(60, 200, 1000);
      expect(unit).toBeCloseTo(250, 0);
    });

    it('returns 0 for a negative Kelly fraction (-EV bet)', () => {
      // 40% win at -110 → Kelly is negative → floored to 0
      const unit = calculateKellyUnit(40, -110, 1000);
      expect(unit).toBe(0);
    });

    it('never exceeds 25% of bankroll (safety cap)', () => {
      // Even extreme win probability / large +odds should cap at 25%
      const unit = calculateKellyUnit(90, 500, 1000);
      expect(unit).toBeLessThanOrEqual(250);
    });

    it('scales proportionally with bankroll size', () => {
      const half  = calculateKellyUnit(60, 200, 500);
      const full  = calculateKellyUnit(60, 200, 1000);
      expect(full).toBeCloseTo(half * 2, 1);
    });

    it('returns 0 for 0% win probability', () => {
      expect(calculateKellyUnit(0, 200, 1000)).toBe(0);
    });
  });

  describe('getRecommendedUnit', () => {
    it('returns amount, percentage, and units fields', () => {
      const result = getRecommendedUnit(75, 1000, 'moderate');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('percentage');
      expect(result).toHaveProperty('units');
    });

    it('higher confidence yields higher percentage', () => {
      const low  = getRecommendedUnit(20, 1000, 'moderate');
      const high = getRecommendedUnit(90, 1000, 'moderate');
      expect(high.percentage).toBeGreaterThan(low.percentage);
    });

    it('aggressive profile has higher maxUnitPercentage than conservative', () => {
      const cons = getRecommendedUnit(90, 1000, 'conservative');
      const agg  = getRecommendedUnit(90, 1000, 'aggressive');
      expect(agg.percentage).toBeGreaterThan(cons.percentage);
    });

    it('amount equals bankroll * percentage / 100', () => {
      const result = getRecommendedUnit(75, 1000, 'moderate');
      expect(result.amount).toBeCloseTo(1000 * result.percentage / 100, 2);
    });

    it('defaults to moderate when no riskProfile provided', () => {
      const r1 = getRecommendedUnit(75, 1000);
      const r2 = getRecommendedUnit(75, 1000, 'moderate');
      expect(r1.percentage).toBeCloseTo(r2.percentage, 5);
    });
  });

  describe('importBankrollData / exportBankrollData round-trip', () => {
    it('importBankrollData returns false for invalid JSON', () => {
      expect(importBankrollData('not-json')).toBe(false);
    });

    it('importBankrollData returns false when bets field is missing', () => {
      expect(importBankrollData(JSON.stringify({ settings: {} }))).toBe(false);
    });

    it('importBankrollData returns false when settings field is missing', () => {
      expect(importBankrollData(JSON.stringify({ bets: [] }))).toBe(false);
    });

    it('importBankrollData returns true for valid structure', () => {
      const valid = JSON.stringify({ bets: [], settings: { totalBankroll: 1000 } });
      expect(importBankrollData(valid)).toBe(true);
    });
  });
});

