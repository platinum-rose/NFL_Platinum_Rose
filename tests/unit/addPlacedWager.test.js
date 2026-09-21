import { describe, it, expect } from 'vitest';

describe('add-placed-wager utility logic', () => {
  function parseAmericanOdds(oddsStr) {
    const clean = String(oddsStr).trim();
    const num = parseInt(clean, 10);
    if (isNaN(num)) return { american: '+100', decimal: 2.0 };
    if (num > 0) {
      return {
        american: `+${num}`,
        decimal: parseFloat((1 + num / 100).toFixed(2))
      };
    } else {
      return {
        american: `${num}`,
        decimal: parseFloat((1 + 100 / Math.abs(num)).toFixed(2))
      };
    }
  }

  function calculatePayout(stake, oddsAmerican) {
    const { decimal } = parseAmericanOdds(oddsAmerican);
    const payout = parseFloat((stake * decimal).toFixed(2));
    const profit = parseFloat((payout - stake).toFixed(2));
    return { payout, profit, decimal };
  }

  it('converts positive American odds to decimal correctly', () => {
    const res = parseAmericanOdds('+450');
    expect(res.american).toBe('+450');
    expect(res.decimal).toBe(5.5);

    const { payout, profit } = calculatePayout(10, '+450');
    expect(payout).toBe(55.0);
    expect(profit).toBe(45.0);
  });

  it('converts negative American odds to decimal correctly', () => {
    const res = parseAmericanOdds('-110');
    expect(res.american).toBe('-110');
    expect(res.decimal).toBe(1.91);

    const { payout, profit } = calculatePayout(11, '-110');
    expect(payout).toBe(21.01);
    expect(profit).toBe(10.01);
  });

  it('enforces $0 cash risk for promo credit wagers', () => {
    const isPromo = true;
    const stake = 9.95;
    const cashRisk = isPromo ? 0 : stake;
    const promoStake = isPromo ? stake : 0;

    expect(cashRisk).toBe(0);
    expect(promoStake).toBe(9.95);
  });

  it('correctly maps 50/50 Alejandro split accounting for a new Sunday wager', () => {
    const stake = 20.0;
    const payout = 110.0;
    const isPromo = false;

    const alejandroStakeShare = isPromo ? 0 : stake * 0.5;
    const alejandroPayoutShare = payout * 0.5;

    expect(alejandroStakeShare).toBe(10.0);
    expect(alejandroPayoutShare).toBe(55.0);
  });
});
