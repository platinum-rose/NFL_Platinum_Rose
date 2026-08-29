import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Mock in-memory localStorage for Node testing environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

vi.mock('../../src/lib/supabase.js', () => ({
  syncBet: vi.fn(async () => null),
  supabase: null,
}));

import {
  getBankrollData,
  saveBankrollData,
  addBet,
  updateBetResult,
  calculateAnalytics,
  getRecommendedUnit,
  BET_STATUS,
  BET_TYPES,
} from '../../src/lib/bankroll.js';

import {
  calculateRiskSizing,
} from '../../src/lib/riskSizing.js';

describe('Preseason Games & Bankroll Management Live Test', () => {
  const schedulePath = path.resolve(__dirname, '../../public/schedule.json');
  const preseasonSchedulePath = path.resolve(__dirname, '../fixtures/preseason-schedule-2026.json');
  let scheduleData = [];
  let preseasonScheduleData = [];

  beforeAll(() => {
    if (fs.existsSync(schedulePath)) {
      scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    }
    if (fs.existsSync(preseasonSchedulePath)) {
      preseasonScheduleData = JSON.parse(fs.readFileSync(preseasonSchedulePath, 'utf8'));
    }
  });

  beforeEach(() => {
    globalThis.localStorage.clear();

    // Reset bankroll storage to clean state before each test
    const cleanBankroll = {
      settings: {
        totalBankroll: 1000,
        unitSize: 50,
        unitPercentage: 5,
        currency: 'USD',
        riskTolerance: 'moderate',
      },
      bets: [],
      weeklyStats: {},
      lastUpdated: new Date().toISOString(),
    };
    saveBankrollData(cleanBankroll);
  });

  describe('1. Preseason Schedule Ingestion & Data Verification', () => {
    it('should confirm the archived Preseason schedule fixture contains ingested Preseason games', () => {
      expect(preseasonScheduleData.length).toBeGreaterThan(0);
      const preseasonGames = preseasonScheduleData.filter((g) => g.season_type === 1);
      expect(preseasonGames.length).toBe(49);
    });

    it('should verify completed Preseason games have valid live/final scores and status', () => {
      const completedPreseason = preseasonScheduleData.filter(
        (g) => g.season_type === 1 && g.status === 'post'
      );
      expect(completedPreseason.length).toBeGreaterThan(0);

      const sampleCompleted = completedPreseason[0];
      expect(sampleCompleted.homeScore).toBeTypeOf('number');
      expect(sampleCompleted.visitorScore).toBeTypeOf('number');
      expect(sampleCompleted.game_id).toMatch(/^nfl_2026_1_w\d\d_/);
    });

    it('should verify upcoming Preseason games carry betting lines and totals', () => {
      const upcomingPreseason = preseasonScheduleData.filter(
        (g) => g.season_type === 1 && g.status === 'pre'
      );
      expect(upcomingPreseason.length).toBeGreaterThan(0);

      const sampleUpcoming = upcomingPreseason[0];
      expect(sampleUpcoming.spread).toBeDefined();
      expect(sampleUpcoming.total).toBeDefined();
    });
  });

  describe('2. Risk Sizing & Expected Value on Preseason Lines', () => {
    it('should compute correct EV and Kelly sizing for a Preseason spread bet', () => {
      // Raiders -1.5 vs Texans in Preseason Week 3 (-110 odds, 55% model probability)
      const americanOdds = -110;
      const modelProb = 0.55;
      const bankroll = 1000;

      const sizing = calculateRiskSizing({
        model_probability: modelProb,
        american_odds: americanOdds,
        bankroll,
        unit_size: 50,
      });

      expect(sizing.status).toBe('sizable_edge');
      expect(sizing.expected_value_per_dollar).toBeGreaterThan(0);
      expect(sizing.recommended_stake).toBeGreaterThan(0);
      expect(sizing.recommended_stake).toBeLessThanOrEqual(50); // capped at max 5%
    });

    it('should identify negative EV Preseason bets and flag pass', () => {
      // 45% model probability on -110 odds (negative EV)
      const sizing = calculateRiskSizing({
        model_probability: 0.45,
        american_odds: -110,
        bankroll: 1000,
      });

      expect(sizing.status).toBe('pass');
      expect(sizing.flags).toContain('no_positive_ev');
      expect(sizing.recommended_stake).toBe(0);
    });

    it('should calculate risk-profile recommended unit sizes correctly', () => {
      const bankroll = 1000;
      const confidence = 80;

      const conservative = getRecommendedUnit(confidence, bankroll, 'conservative');
      const moderate = getRecommendedUnit(confidence, bankroll, 'moderate');
      const aggressive = getRecommendedUnit(confidence, bankroll, 'aggressive');

      expect(conservative.amount).toBeLessThan(moderate.amount);
      expect(moderate.amount).toBeLessThan(aggressive.amount);
      expect(conservative.percentage).toBeLessThanOrEqual(3);
      expect(moderate.percentage).toBeLessThanOrEqual(5);
      expect(aggressive.percentage).toBeLessThanOrEqual(10);
    });
  });

  describe('3. Wager Tracking & Settlement on Preseason Games', () => {
    it('should log Preseason wagers into bankroll tracking', () => {
      const preseasonGame = scheduleData.find((g) => g.season_type === 1 && g.status === 'post') || {
        game_id: 'nfl_2026_1_w01_CAR_at_ARI',
        visitor: 'CAR',
        home: 'ARI',
      };

      const bet = addBet({
        gameId: preseasonGame.game_id,
        type: BET_TYPES.SPREAD,
        side: 'visitor',
        team: preseasonGame.visitor,
        line: 2.5,
        odds: -110,
        amount: 50,
        description: `Preseason W1: ${preseasonGame.visitor} +2.5 vs ${preseasonGame.home}`,
      });

      expect(bet.id).toBeDefined();
      expect(bet.status).toBe(BET_STATUS.PENDING);
      expect(bet.amount).toBe(50);

      const bankroll = getBankrollData();
      expect(bankroll.bets.length).toBe(1);
    });

    it('should settle Preseason bets and update P&L correctly', () => {
      // Panthers vs Cardinals: CAR 33, ARI 30. CAR +2.5 wins!
      const bet = addBet({
        gameId: 'nfl_2026_1_w01_CAR_at_ARI',
        type: BET_TYPES.SPREAD,
        side: 'visitor',
        team: 'CAR',
        line: 2.5,
        odds: -110,
        amount: 55,
      });

      const settled = updateBetResult(bet.id, BET_STATUS.WON);
      expect(settled).toBe(true);

      const bankroll = getBankrollData();
      const updatedBet = bankroll.bets.find((b) => b.id === bet.id);
      expect(updatedBet.status).toBe(BET_STATUS.WON);
      expect(updatedBet.profit).toBeCloseTo(50, 1); // $55 at -110 wins $50
    });
  });

  describe('4. Bankroll Analytics End-to-End Verification', () => {
    it('should calculate complete analytics over a sample set of Preseason bets', () => {
      // Bet 1: Win ($55 bet at -110 -> +$50 profit)
      const b1 = addBet({
        gameId: 'nfl_2026_1_w01_CAR_at_ARI',
        type: BET_TYPES.SPREAD,
        side: 'visitor',
        team: 'CAR',
        line: 2.5,
        odds: -110,
        amount: 55,
      });
      updateBetResult(b1.id, BET_STATUS.WON);

      // Bet 2: Loss ($50 bet at +120 -> -$50 profit)
      const b2 = addBet({
        gameId: 'nfl_2026_1_w02_DET_at_CIN',
        type: BET_TYPES.MONEYLINE,
        side: 'visitor',
        team: 'DET',
        odds: 120,
        amount: 50,
      });
      updateBetResult(b2.id, BET_STATUS.LOST);

      // Bet 3: Win ($50 bet at +150 -> +$75 profit)
      const b3 = addBet({
        gameId: 'nfl_2026_1_w03_LV_at_HOU',
        type: BET_TYPES.MONEYLINE,
        side: 'visitor',
        team: 'LV',
        odds: 150,
        amount: 50,
      });
      updateBetResult(b3.id, BET_STATUS.WON);

      // Bet 4: Pending bet ($50)
      addBet({
        gameId: 'nfl_2026_1_w04_GB_at_KC',
        type: BET_TYPES.TOTAL,
        side: 'over',
        line: 38.5,
        odds: -110,
        amount: 50,
      });

      const analytics = calculateAnalytics('all');

      expect(analytics.totalBets).toBe(4);
      expect(analytics.pendingBets).toBe(1);
      expect(analytics.settledBets).toBe(3);
      expect(analytics.wins).toBe(2);
      expect(analytics.losses).toBe(1);
      expect(analytics.totalWagered).toBe(155);
      expect(analytics.totalProfit).toBe(75); // +50 -50 +75 = +75
      expect(analytics.currentBankroll).toBe(1075); // 1000 + 75
      expect(analytics.winRate).toBeCloseTo(66.67, 1); // 2 wins out of 3 settled
      expect(analytics.roi).toBeCloseTo((75 / 155) * 100, 1);
      expect(analytics.unitsWon).toBe(1.5); // $75 profit / $50 unit size = 1.5 units
    });
  });
});
