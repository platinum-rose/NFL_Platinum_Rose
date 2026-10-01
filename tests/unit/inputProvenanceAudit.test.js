import { describe, expect, it } from 'vitest';
import { auditInputs, canonicalGameKey, validMarket } from '../../scripts/analysis/season-post-mortem/audit-input-provenance.mjs';

describe('C1 input provenance audit', () => {
  it('normalizes game order and rejects incomplete market records', () => {
    expect(canonicalGameKey('DET @ BUF')).toBe('BUF:DET');
    expect(canonicalGameKey('Wisconsin @ Notre Dame (CFB)')).toBeNull();
    expect(validMarket({ spread: 0, total: 0 })).toBe(false);
    expect(validMarket({ spread: -3, total: 44.5 })).toBe(true);
  });

  it('requires an exact same-week game or unique player match', () => {
    const audit = auditInputs({
      schedule: [{ week: 1, spread: -3, total: 44.5 }, { week: 2, spread: 0, total: 0 }],
      boxes: [{ week: 1, game_key: 'BUF:DET', players: new Set(['josh allen']), has_pickcenter_market: true }],
      legs: [
        { week: '1', game: 'DET @ BUF', player: 'Josh Allen', result: 'WON', evidence: 'local_espn_boxscore' },
        { week: '2', game: 'DET @ BUF', player: 'Josh Allen', result: 'WON', evidence: 'local_espn_boxscore' },
      ],
    });
    expect(audit.schedule.usable_market.total).toBe(1);
    expect(audit.c1.supported.total).toBe(1);
    expect(audit.c1.unsupported.total).toBe(1);
  });
});
