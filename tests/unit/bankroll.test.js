import { describe, expect, it } from 'vitest';
import { andyShare, bankrollEntry, isBankrollExempt, summarizeBankroll } from '../../scripts/lib/bankroll.mjs';

const t = (o) => ({ id: 'x', week: 10, status: 'SETTLED', book: 'BetOnline', funding_type: 'cash', profit_usd: -10, ...o });

describe('official bankroll rule (Andy 2026-11-17)', () => {
  it('exempts every DKP, Pick6 and FDP ticket, solo or split, any funding', () => {
    for (const book of ['DraftKings Predictions', 'DraftKings Pick6', 'FanDuel Predicts']) {
      expect(isBankrollExempt(t({ book }))).toBe(true);
      expect(isBankrollExempt(t({ book, is_split: true, funding_type: 'promo_credit' }))).toBe(true);
      expect(isBankrollExempt(t({ book, bankroll_exempt: false, exclude_from_andy_bankroll: false }))).toBe(true);
    }
  });
  it('keeps hand-flagged exemptions at other books', () => {
    expect(isBankrollExempt(t({ book: 'Bookmaker', bankroll_exempt: true }))).toBe(true);
    expect(isBankrollExempt(t({ exclude_from_bankroll: true }))).toBe(true);
    expect(isBankrollExempt(t({}))).toBe(false);
  });
  it('uses ownership_shares, then participants, then split_count', () => {
    expect(andyShare(t({ ownership_shares: { Andy: 0.5, Alejandro: 0.5 } }))).toBe(0.5);
    expect(andyShare(t({ ownership_shares: { Andy: 0, Amanda: 1 } }))).toBe(0);
    expect(andyShare(t({ is_split: true, split_participants: [{ name: 'Andy', share_numerator: 1, share_denominator: 3 }] }))).toBeCloseTo(1 / 3);
    expect(andyShare(t({ is_split: true }))).toBe(0.5);
    expect(andyShare(t({ is_split: true, split_count: 3 }))).toBeCloseTo(1 / 3);
    expect(andyShare(t({ bankroll_owner: 'Amanda' }))).toBe(0);
    expect(andyShare(t({}))).toBe(1);
  });
  it('counts profit x share and reports exempt separately', () => {
    const s = summarizeBankroll([
      t({ id: 'a', profit_usd: -10, is_split: true, ownership_shares: { Andy: 0.5, Alejandro: 0.5 } }),
      t({ id: 'b', profit_usd: 40 }),
      t({ id: 'c', book: 'DraftKings Predictions', profit_usd: 100 }),
      t({ id: 'd', week: 11, status: 'PENDING' }),
    ]);
    expect(s.season.bankroll).toBe(35);
    expect(s.season.exempt_andy).toBe(100);
    expect(s.open_tickets).toEqual(['d']);
  });
  it('estimates missing profit from payout minus cash stake and warns', () => {
    const e = bankrollEntry(t({ profit_usd: undefined, settled_payout_usd: 25, cash_risk_usd: 10 }));
    expect(e.bankroll_profit).toBe(15);
    expect(e.profit_estimated).toBe(true);
  });
});
