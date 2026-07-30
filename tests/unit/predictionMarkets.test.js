import { describe, expect, it } from 'vitest';
import {
  americanToDecimal,
  americanToProbability,
  calculateKalshiFee,
  calculateNetOdds,
  calculatePolymarketFee,
  compareMarketOdds,
  evaluateOrderBook,
  probabilityToAmerican,
} from '../../src/lib/predictionMarkets.js';

describe('probabilityToAmerican & americanToProbability', () => {
  it('converts 50% probability to +100', () => {
    expect(probabilityToAmerican(0.5)).toBe(100);
    expect(americanToProbability(100)).toBe(0.5);
    expect(americanToProbability(-100)).toBe(0.5);
  });

  it('converts 60% probability to -150', () => {
    expect(probabilityToAmerican(0.6)).toBe(-150);
    expect(Number(americanToProbability(-150).toFixed(4))).toBe(0.6);
  });

  it('converts 35% probability to +186', () => {
    expect(probabilityToAmerican(0.35)).toBe(186);
    expect(Number(americanToProbability(186).toFixed(4))).toBe(0.3497);
  });

  it('converts 20% probability to +400', () => {
    expect(probabilityToAmerican(0.2)).toBe(400);
    expect(americanToProbability(400)).toBe(0.2);
  });
});

describe('americanToDecimal', () => {
  it('converts positive and negative American odds to Decimal odds', () => {
    expect(americanToDecimal(100)).toBe(2.0);
    expect(americanToDecimal(200)).toBe(3.0);
    expect(americanToDecimal(-150)).toBe(1.6667);
    expect(americanToDecimal(-110)).toBe(1.9091);
  });
});

describe('Fee models', () => {
  it('calculates Kalshi fee based on contract price', () => {
    // At 50c: 0.07 * 0.5 * 0.5 = 0.0175 (1.75c)
    expect(calculateKalshiFee(50)).toBe(0.0175);
    // At 20c: 0.07 * 0.2 * 0.8 = 0.0112 (1.12c)
    expect(calculateKalshiFee(20)).toBe(0.0112);
  });

  it('calculates Polymarket fee based on custom fee percentage', () => {
    expect(calculatePolymarketFee(50, 1.5)).toBe(0.015);
    expect(calculatePolymarketFee(50, 2.0)).toBe(0.02);
  });
});

describe('calculateNetOdds', () => {
  it('calculates gross and net fee-adjusted American odds for a 35c contract', () => {
    const res = calculateNetOdds({ priceCents: 35, exchange: 'kalshi', applyFee: true });
    expect(res.priceCents).toBe(35);
    expect(res.grossProb).toBe(0.35);
    expect(res.grossAmericanOdds).toBe(186);
    // Net outlay = 0.35 + 0.0159 = 0.3659 -> Net odds ~ +173
    expect(res.netAmericanOdds).toBeLessThan(186);
    expect(res.netAmericanOdds).toBeGreaterThan(160);
  });

  it('handles zero fee mode when applyFee is false', () => {
    const res = calculateNetOdds({ priceCents: 60, applyFee: false });
    expect(res.grossAmericanOdds).toBe(-150);
    expect(res.netAmericanOdds).toBe(-150);
    expect(res.feeFraction).toBe(0);
  });
});

describe('evaluateOrderBook', () => {
  it('evaluates order book bid/ask and fair midpoint odds', () => {
    const book = evaluateOrderBook({ yesBid: 58, yesAsk: 60, exchange: 'kalshi' });
    expect(book.yesBid).toBe(58);
    expect(book.yesAsk).toBe(60);
    expect(book.spreadCents).toBe(2);
    expect(book.midpointCents).toBe(59);
    expect(book.midpointProb).toBe(0.59);
    expect(book.fairMidAmericanOdds).toBe(-144);
    expect(book.buyYes.priceCents).toBe(60);
    expect(book.buyNo.priceCents).toBe(42); // 100 - 58
  });
});

describe('compareMarketOdds', () => {
  it('identifies price shopping edge when prediction market offers better odds', () => {
    // Kalshi net +186 vs DraftKings +160
    const comp = compareMarketOdds(186, 160);
    expect(comp.betterMarket).toBe('prediction_market');
    expect(comp.americanDelta).toBe(26);
    expect(comp.valueEdgePct).toBeGreaterThan(3.0);
    expect(comp.isSignificantEdge).toBe(true);
  });

  it('identifies sportsbook advantage when sportsbook offers better odds', () => {
    // Kalshi net -150 vs FanDuel -130
    const comp = compareMarketOdds(-150, -130);
    expect(comp.betterMarket).toBe('sportsbook');
    expect(comp.valueEdgePct).toBeLessThan(0);
  });
});
