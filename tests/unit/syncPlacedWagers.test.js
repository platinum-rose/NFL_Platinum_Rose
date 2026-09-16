import { describe, it, expect } from 'vitest';
import { normalizeWagerForBankroll } from '../../scripts/sync-placed-wagers-to-bankroll.mjs';

describe('sync-placed-wagers-to-bankroll normalization engine', () => {
  it('correctly maps standard cash SGP with loss to -cashRisk', () => {
    const rawWager = {
      id: 'bet_cash_sgp_lost',
      placed_at: '2026-09-10T15:10:00-07:00',
      stake_usd: 10,
      odds_american: '+775',
      ticket_type: 'Same Game Parlay (4 Legs)',
      status: 'SETTLED',
      result: 'loss',
      legs: [
        { player: 'Player A', selection: 'Over 3.5', status: 'LOST' },
        { player: 'Player B', selection: '1+ TD', status: 'WON' }
      ]
    };

    const normalized = normalizeWagerForBankroll(rawWager);
    expect(normalized.id).toBe('bet_cash_sgp_lost');
    expect(normalized.amount).toBe(10);
    expect(normalized.profit).toBe(-10);
    expect(normalized.status).toBe('lost');
    expect(normalized.is_parlay).toBe(true);
    expect(normalized.odds).toBe(775);
    expect(normalized.graded).toBe(true);
  });

  it('strictly enforces $0 cash risk and $0 profit loss on promo credit wagers', () => {
    const rawPromo = {
      id: 'bet_promo_lost',
      is_promo_credit: true,
      funding_type: 'promo_credit',
      promo_credit_stake_usd: 9.95,
      stake_usd: 9.95,
      cash_risk_usd: 0,
      odds_american: '+426',
      potential_profit_usd: 39.05,
      potential_payout_usd: 49.00,
      status: 'SETTLED',
      result: 'loss',
      legs: [
        { player: 'DeZhaun Stribling', selection: 'Anytime TD', status: 'LOST' }
      ]
    };

    const normalized = normalizeWagerForBankroll(rawPromo);
    expect(normalized.amount).toBe(0); // $0 cash risk
    expect(normalized.profit).toBe(-0); // No cash deduction
    expect(normalized.status).toBe('lost');
    expect(normalized.is_promo).toBe(true);
    expect(normalized.promo_stake).toBe(9.95);
  });

  it('correctly calculates profit on promo credit winning wager', () => {
    const rawPromoWin = {
      id: 'bet_promo_won',
      is_promo_credit: true,
      funding_type: 'promo_credit',
      promo_credit_stake_usd: 9.95,
      stake_usd: 9.95,
      cash_risk_usd: 0,
      odds_american: '+426',
      potential_profit_usd: 39.05,
      potential_payout_usd: 49.00,
      status: 'SETTLED',
      result: 'win',
      legs: [
        { player: 'DeZhaun Stribling', selection: 'Anytime TD', status: 'WON' }
      ]
    };

    const normalized = normalizeWagerForBankroll(rawPromoWin);
    expect(normalized.amount).toBe(0); // $0 cash risk
    expect(normalized.profit).toBe(39.05); // Full profit awarded
    expect(normalized.status).toBe('won');
  });

  it('correctly flags open parlay and open slot counts', () => {
    const rawOpenParlay = {
      id: 'bet_bm_open_parlay_7t',
      ticket_number: '738490212',
      stake_usd: 15.69,
      odds_american: '+2640',
      ticket_type: 'Open Parlay (7 Teams, 1 Open)',
      status: 'PENDING',
      result: null,
      legs: [
        { game: 'SF @ LAR', selection: 'SF +4', status: 'WON' },
        { game: 'NO @ DET', selection: 'Lions ML', status: 'PENDING' },
        { game: 'TBD', selection: '1 OPEN SPOT', market: 'open_slot', status: 'OPEN' }
      ]
    };

    const normalized = normalizeWagerForBankroll(rawOpenParlay);
    expect(normalized.is_parlay).toBe(true);
    expect(normalized.status).toBe('pending');
    expect(normalized.open_slots).toBe(1);
    expect(normalized.amount).toBe(15.69);
    expect(normalized.profit).toBe(null);
    expect(normalized.ticket_number).toBe('738490212');
  });
});
