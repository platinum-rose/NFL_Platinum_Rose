import { describe, expect, it } from 'vitest';
import {
  extractResumePrompt,
  isSourceTeamAligned,
  mergeSnapshotSources,
  splitInputPaths,
  validateLocalSnapshotRows,
  snapshotIdentity,
} from '../../agents/lib/portfolio-local-inputs.js';
import { canonicalExactMatchup, isTeamEligibleForFuturesMarket } from '../../src/lib/futuresMarketIdentity.js';
import { isBetterFuturesOffer } from '../../src/lib/futuresQuoteSelection.js';

describe('portfolio local inputs', () => {
  it('adds local snapshots while deduplicating identical database rows', () => {
    const historical = {
      season: 2026,
      market_type: 'superbowl',
      team: 'Buffalo Bills',
      selection: 'Buffalo Bills',
      book: 'betus',
      snapshot_time: '2026-07-21T00:00:00Z',
      price: 900,
    };
    const current = { ...historical, snapshot_time: '2026-08-10T00:00:00Z', price: 1000 };

    const correctedCurrent = { ...current, price: 1050 };
    expect(mergeSnapshotSources([historical, current], [correctedCurrent])).toEqual([historical, correctedCurrent]);
  });

  it('canonicalizes exact-matchup order for grouping and deduplication', () => {
    const forward = canonicalExactMatchup('Green Bay Packers vs Buffalo Bills');
    const reverse = canonicalExactMatchup('Buffalo Bills vs Green Bay Packers');
    expect(forward).toEqual(reverse);
    expect(forward).toMatchObject({ key: 'bills|packers', label: 'Buffalo Bills vs Green Bay Packers' });

    const base = { market_type: 'superbowl_matchup', book: 'betus', snapshot_time: '2026-09-08T00:00:00Z' };
    expect(snapshotIdentity({ ...base, team: 'Green Bay Packers vs Buffalo Bills' }))
      .toBe(snapshotIdentity({ ...base, team: 'Buffalo Bills vs Green Bay Packers' }));
  });

  it('quarantines teams assigned to the wrong division or conference market', () => {
    expect(isTeamEligibleForFuturesMarket('New Orleans Saints', 'division_nfc_west')).toBe(false);
    expect(isTeamEligibleForFuturesMarket('New Orleans Saints', 'division_nfc_south')).toBe(true);
    expect(isTeamEligibleForFuturesMarket('Buffalo Bills', 'conference_nfc')).toBe(false);
    expect(isTeamEligibleForFuturesMarket('Buffalo Bills', 'conference_afc')).toBe(true);
    expect(isTeamEligibleForFuturesMarket('Buffalo Bills', 'superbowl')).toBe(true);
  });

  it('shops the best price inside the current window but never promotes stale over current', () => {
    const currentNewer = { availability_status: 'current', quote_age_hours: 12 };
    const currentOlder = { availability_status: 'current', quote_age_hours: 36 };
    const stale = { availability_status: 'stale', quote_age_hours: 96 };
    expect(isBetterFuturesOffer(8300, currentOlder, 7000, currentNewer)).toBe(true);
    expect(isBetterFuturesOffer(10000, stale, 7000, currentNewer)).toBe(false);
    expect(isBetterFuturesOffer(7000, currentOlder, 7000, currentNewer)).toBe(false);
  });

  it('rejects malformed rows and filters other seasons', () => {
    expect(() => validateLocalSnapshotRows([{ season: 2026, team: 'Bills' }], { season: 2026 }))
      .toThrow(/missing market_type/);
    expect(validateLocalSnapshotRows([
      { season: 2025, market_type: 'superbowl', team: 'Bills', book: 'betus' },
      { season: 2026, market_type: 'superbowl', team: 'Bills', book: 'betus' },
    ], { season: 2026 })).toHaveLength(1);
  });

  it('resolves comma-delimited paths relative to the repository root', () => {
    expect(splitInputPaths('data/a.json, data/b.json', 'C:/repo')).toEqual([
      expect.stringMatching(/[\\/]repo[\\/]data[\\/]a\.json$/i),
      expect.stringMatching(/[\\/]repo[\\/]data[\\/]b\.json$/i),
    ]);
  });

  it('filters team-beat rows whose source prefix belongs to another team', () => {
    expect(isSourceTeamAligned('BUF', 'BUF Beat - Bills Wire')).toBe(true);
    expect(isSourceTeamAligned('BUF', 'GB Beat - Packers Wire')).toBe(false);
    expect(isSourceTeamAligned('BUF', 'ESPN injury report')).toBe(true);
  });

  it('extracts only the fenced handoff resume prompt', () => {
    const handoff = '# Handoff\n\n## Resume Prompt\n\n```text\nUse the approved local lanes.\n```\n';
    expect(extractResumePrompt(handoff)).toBe('Use the approved local lanes.');
  });
});
