// tests/unit/rowReduction.test.js
// Round 9 v8 Phase 2 -- coverage for agents/lib/row-reduction.js, the
// explicit comparison-based "best row per key" rule extracted out of
// portfolio-dossier.js's six reducer call sites (fetchInjuryContext,
// fetchAdvancedAnalytics, fetchDvoaSnapshots, fetchCoachingProfiles,
// fetchGameOddsOpen, fetchGameSplitsLatest) so it is directly testable.
//
// Rule under test (isBetterRow):
//   1. parse both timestamps
//   2. exactly one side null/invalid -> the valid side wins
//   3. both valid and unequal -> the numerically better one wins
//   4. both valid-and-equal OR both null/invalid -> fall through to the
//      secondary key ("id" -- desc for "latest" direction, asc for "earliest")
//   5. secondary key itself unusable on either side -> keep incumbent

import { describe, expect, it } from 'vitest';
import { isBetterRow, latestByTeam } from '../../agents/lib/row-reduction.js';

const OPTS_LATEST = { tsField: 'ts', idField: 'id', direction: 'latest' };
const OPTS_EARLIEST = { tsField: 'ts', idField: 'id', direction: 'earliest' };

describe('isBetterRow', () => {
  it('always accepts the candidate when there is no incumbent yet', () => {
    expect(isBetterRow({ ts: null, id: 1 }, undefined, OPTS_LATEST)).toBe(true);
    expect(isBetterRow({ ts: null, id: 1 }, null, OPTS_LATEST)).toBe(true);
  });

  it('rule 2: a valid timestamp beats a null timestamp regardless of direction', () => {
    const valid = { ts: '2026-09-01T00:00:00Z', id: 1 };
    const invalid = { ts: null, id: 2 };
    expect(isBetterRow(valid, invalid, OPTS_LATEST)).toBe(true);
    expect(isBetterRow(invalid, valid, OPTS_LATEST)).toBe(false);
    expect(isBetterRow(valid, invalid, OPTS_EARLIEST)).toBe(true);
    expect(isBetterRow(invalid, valid, OPTS_EARLIEST)).toBe(false);
  });

  it('rule 2: a valid timestamp beats an unparseable ("invalid") timestamp', () => {
    const valid = { ts: '2026-09-01T00:00:00Z', id: 1 };
    const garbage = { ts: 'not-a-date', id: 2 };
    expect(isBetterRow(valid, garbage, OPTS_LATEST)).toBe(true);
    expect(isBetterRow(garbage, valid, OPTS_LATEST)).toBe(false);
  });

  it('rule 3: when both valid and unequal, "latest" direction prefers the later timestamp', () => {
    const older = { ts: '2026-09-01T00:00:00Z', id: 5 };
    const newer = { ts: '2026-09-02T00:00:00Z', id: 1 }; // lower id on purpose -- ts must win, not id
    expect(isBetterRow(newer, older, OPTS_LATEST)).toBe(true);
    expect(isBetterRow(older, newer, OPTS_LATEST)).toBe(false);
  });

  it('rule 3: when both valid and unequal, "earliest" direction prefers the earlier timestamp', () => {
    const older = { ts: '2026-09-01T00:00:00Z', id: 1 };
    const newer = { ts: '2026-09-02T00:00:00Z', id: 5 }; // higher id on purpose -- ts must win, not id
    expect(isBetterRow(older, newer, OPTS_EARLIEST)).toBe(true);
    expect(isBetterRow(newer, older, OPTS_EARLIEST)).toBe(false);
  });

  it('rule 4: equal valid timestamps fall through to id, descending for "latest"', () => {
    const lowId = { ts: '2026-09-01T00:00:00Z', id: 10 };
    const highId = { ts: '2026-09-01T00:00:00Z', id: 20 };
    expect(isBetterRow(highId, lowId, OPTS_LATEST)).toBe(true);
    expect(isBetterRow(lowId, highId, OPTS_LATEST)).toBe(false);
  });

  it('rule 4: equal valid timestamps fall through to id, ascending for "earliest"', () => {
    const lowId = { ts: '2026-09-01T00:00:00Z', id: 10 };
    const highId = { ts: '2026-09-01T00:00:00Z', id: 20 };
    expect(isBetterRow(lowId, highId, OPTS_EARLIEST)).toBe(true);
    expect(isBetterRow(highId, lowId, OPTS_EARLIEST)).toBe(false);
  });

  it('rule 4: both null/invalid timestamps fall through to id (desc for "latest")', () => {
    const lowId = { ts: null, id: 3 };
    const highId = { ts: 'garbage', id: 7 };
    expect(isBetterRow(highId, lowId, OPTS_LATEST)).toBe(true);
    expect(isBetterRow(lowId, highId, OPTS_LATEST)).toBe(false);
  });

  it('rule 5: fails loud by default when the secondary key is unusable on either side (tie, no id)', () => {
    const a = { ts: '2026-09-01T00:00:00Z', id: null };
    const b = { ts: '2026-09-01T00:00:00Z', id: null };
    expect(() => isBetterRow(a, b, OPTS_LATEST)).toThrow(/secondary key "id" is missing/);
    expect(() => isBetterRow(b, a, OPTS_LATEST)).toThrow(/secondary key "id" is missing/);
  });

  it('rule 5: fails loud by default when both timestamps are invalid and ids are missing', () => {
    const a = { ts: null, id: undefined };
    const b = { ts: null, id: undefined };
    expect(() => isBetterRow(a, b, OPTS_LATEST)).toThrow(/secondary key "id" is missing/);
  });

  it('rule 5: allowMissingSecondaryKey opts out of the throw and keeps the incumbent instead', () => {
    const a = { ts: '2026-09-01T00:00:00Z', id: null };
    const b = { ts: '2026-09-01T00:00:00Z', id: null };
    expect(isBetterRow(a, b, { ...OPTS_LATEST, allowMissingSecondaryKey: true })).toBe(false);
    expect(isBetterRow(b, a, { ...OPTS_LATEST, allowMissingSecondaryKey: true })).toBe(false);
  });

  it('rule 5: only throws when the key is ACTUALLY needed -- a decisive timestamp never touches id', () => {
    const decisive = { ts: '2026-09-02T00:00:00Z', id: undefined };
    const other = { ts: '2026-09-01T00:00:00Z', id: undefined };
    expect(() => isBetterRow(decisive, other, OPTS_LATEST)).not.toThrow();
    expect(isBetterRow(decisive, other, OPTS_LATEST)).toBe(true);
  });
});

describe('latestByTeam', () => {
  const normalizeTeamFn = (t) => (t ? t.toUpperCase() : null);

  it('reduces multiple rows per team to the single best (latest) row, then maps it', () => {
    const rows = [
      { team: 'kc', ts: '2026-09-01T00:00:00Z', id: 1, val: 'old' },
      { team: 'kc', ts: '2026-09-05T00:00:00Z', id: 2, val: 'new' },
      { team: 'sf', ts: '2026-09-03T00:00:00Z', id: 3, val: 'sf-only' },
    ];
    const out = latestByTeam(rows, (r) => ({ val: r.val }), normalizeTeamFn, { tsField: 'ts', idField: 'id' });
    expect(out).toEqual({ KC: { val: 'new' }, SF: { val: 'sf-only' } });
  });

  it('skips rows whose team does not normalize to a canonical nickname', () => {
    const rows = [
      { team: null, ts: '2026-09-01T00:00:00Z', id: 1 },
      { team: 'kc', ts: '2026-09-01T00:00:00Z', id: 2, val: 'kept' },
    ];
    const out = latestByTeam(rows, (r) => r.val, normalizeTeamFn, { tsField: 'ts', idField: 'id' });
    expect(out).toEqual({ KC: 'kept' });
  });

  it('breaks a same-timestamp tie for the same team by the higher id, not row order', () => {
    const rows = [
      { team: 'kc', ts: '2026-09-01T00:00:00Z', id: 20, val: 'seen-first-but-higher-id' },
      { team: 'kc', ts: '2026-09-01T00:00:00Z', id: 10, val: 'seen-second-but-lower-id' },
    ];
    const out = latestByTeam(rows, (r) => r.val, normalizeTeamFn, { tsField: 'ts', idField: 'id' });
    expect(out).toEqual({ KC: 'seen-first-but-higher-id' });
  });

  it('defaults tsField/idField to snapshot_at/id when not provided', () => {
    const rows = [
      { team: 'kc', snapshot_at: '2026-09-01T00:00:00Z', id: 1, val: 'old' },
      { team: 'kc', snapshot_at: '2026-09-05T00:00:00Z', id: 2, val: 'new' },
    ];
    const out = latestByTeam(rows, (r) => r.val, normalizeTeamFn);
    expect(out).toEqual({ KC: 'new' });
  });

  it('returns an empty object for no rows', () => {
    expect(latestByTeam([], (r) => r, normalizeTeamFn)).toEqual({});
    expect(latestByTeam(null, (r) => r, normalizeTeamFn)).toEqual({});
  });

  it('throws on a same-timestamp tie with no id by default (matches portfolio.js Supabase-sourced rows)', () => {
    const rows = [
      { team: 'kc', ts: '2026-09-01T00:00:00Z', val: 'a' },
      { team: 'kc', ts: '2026-09-01T00:00:00Z', val: 'b' },
    ];
    expect(() => latestByTeam(rows, (r) => r.val, normalizeTeamFn, { tsField: 'ts', idField: 'id' })).toThrow(/secondary key "id" is missing/);
  });

  it('allowMissingSecondaryKey lets a known-PK-less source (e.g. local fallback files) degrade instead of throwing', () => {
    const rows = [
      { team: 'kc', ts: '2026-09-01T00:00:00Z', val: 'seen-first' },
      { team: 'kc', ts: '2026-09-01T00:00:00Z', val: 'seen-second' },
    ];
    const out = latestByTeam(rows, (r) => r.val, normalizeTeamFn, { tsField: 'ts', idField: 'id', allowMissingSecondaryKey: true });
    expect(out).toEqual({ KC: 'seen-first' });
  });
});
