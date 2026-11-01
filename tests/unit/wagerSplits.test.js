import { describe, expect, it } from 'vitest';
import { wagerSplit } from '../../scripts/lib/wager-splits.mjs';

describe('tracker ownership', () => {
  it('keeps individual tickets out of the shared ledger', () => {
    expect(wagerSplit({ is_split: false, stake_usd: 20, potential_payout_usd: 371.25 }).enabled).toBe(false);
  });

  it('preserves the usual half share without rounding the stake early', () => {
    const split = wagerSplit({ is_split: true, stake_usd: 9.99, potential_payout_usd: 729.40 });
    expect(split).toMatchObject({ enabled: true, count: 2, fraction: 0.5, contribution: 4.995, label: '50/50 SPLIT' });
  });

  it('uses the three contributions and thirds without charging the spare two cents to the ticket', () => {
    const ticket = {
      is_split: true, stake_usd: 14.98, potential_payout_usd: 609,
      split_count: 3, split_designation: 'A-A-A',
      split_participants: ['Andy', 'Amanda', 'Alejandro'].map((name) => ({ name, contribution_usd: 5, share_numerator: 1, share_denominator: 3 })),
      split_details: { unspent_contributions_usd: 0.02 },
    };
    const split = wagerSplit(ticket);
    expect(split).toMatchObject({ count: 3, contribution: 5, label: '3-WAY A-A-A' });
    expect(609 * split.fraction).toBe(203);
    expect(split.note).toContain('$203.00 each');
    expect(split.note).toContain('$0.02 unspent');
    expect(ticket.stake_usd).toBe(14.98);
  });

  it('preserves the odd payout cent rather than rounding both two-way shares up', () => {
    const split = wagerSplit({ is_split: true, stake_usd: 9.96, potential_payout_usd: 232.01 });
    expect(split.contribution).toBe(4.98);
    expect(split.payoutRemainderUsd).toBe(0.01);
    expect(split.note).toContain('$116.00 each');
    expect(split.note).toContain('$0.01 payout remainder to allocate');
  });
});
