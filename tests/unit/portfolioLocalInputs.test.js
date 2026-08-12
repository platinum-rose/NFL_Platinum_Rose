import { describe, expect, it } from 'vitest';
import {
  extractResumePrompt,
  isSourceTeamAligned,
  mergeSnapshotSources,
  splitInputPaths,
  validateLocalSnapshotRows,
} from '../../agents/lib/portfolio-local-inputs.js';

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
