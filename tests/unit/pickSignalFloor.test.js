// tests/unit/pickSignalFloor.test.js
// Round 9 v8 Finding 3 response / RULES.md date-threshold exception
// (Andy-authorized 2026-09-10): TRAINING_CAMP_START_BY_SEASON is a static
// per-season configuration value, not wall-clock expiry logic, so it does
// NOT need vi.useFakeTimers(). What it does need: a plain unit test on the
// accessor (signalFloorForSeason) and a REAL call-site wiring test proving
// the resolved value actually reaches fetchAllRows() -- per
// docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md:16,
// this means capturing the actual `filters` argument fetchPickSignals()
// itself passes into fetchAllRows(), not just unit-testing a helper in
// isolation (Codex's Phase 3b re-review, P2 finding: an earlier version of
// this file only did the latter). fetchAllRows() is mocked and the real,
// exported fetchPickSignals()/fetchUserPicks() from portfolio-dossier.js
// are called directly -- portfolio-dossier.js now guards its main() build
// behind an import.meta.url check (Codex's Phase 3b re-review, P2 fix) so
// importing it here does not trigger a live dossier build.

import { describe, expect, it, vi } from 'vitest';
import { TRAINING_CAMP_START_BY_SEASON, signalFloorForSeason, buildPickSignalFilters } from '../../agents/lib/pick-signal-floor.js';

describe('signalFloorForSeason (plain unit test on the accessor)', () => {
  it('returns the configured floor date for a known season', () => {
    expect(signalFloorForSeason(2026)).toBe('2026-08-10');
  });

  it('matches TRAINING_CAMP_START_BY_SEASON directly, not a hardcoded duplicate', () => {
    expect(signalFloorForSeason(2026)).toBe(TRAINING_CAMP_START_BY_SEASON[2026]);
  });

  it('fails loud for a season with no configured entry', () => {
    expect(() => signalFloorForSeason(2027)).toThrow(/no TRAINING_CAMP_START_BY_SEASON entry for season 2027/);
  });

  it('fails loud for a nullish/invalid season rather than silently returning undefined', () => {
    expect(() => signalFloorForSeason(undefined)).toThrow(/no TRAINING_CAMP_START_BY_SEASON entry/);
    expect(() => signalFloorForSeason(null)).toThrow(/no TRAINING_CAMP_START_BY_SEASON entry/);
  });
});

describe('buildPickSignalFilters (unit test on the filter-building helper)', () => {
  it('builds a single gte filter on captured_at using the resolved season floor', () => {
    const filters = buildPickSignalFilters(2026);
    expect(filters).toEqual([{ column: 'captured_at', op: 'gte', value: '2026-08-10' }]);
  });

  it('propagates signalFloorForSeason()\'s fail-loud behavior for an unconfigured season', () => {
    expect(() => buildPickSignalFilters(2027)).toThrow(/no TRAINING_CAMP_START_BY_SEASON entry for season 2027/);
  });
});

// ── Real call-site wiring test (Codex Phase 3b re-review, P2) ──────────────
vi.mock('../../agents/lib/supabase-pagination.js', () => ({
  fetchAllRows: vi.fn(async () => []),
}));

describe('fetchPickSignals() / fetchUserPicks() call-site wiring (real functions, mocked fetchAllRows)', () => {
  it('fetchPickSignals() calls fetchAllRows() with the exhaustive shape and the resolved season-floor filter', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    const { fetchPickSignals } = await import('../../agents/portfolio-dossier.js');
    await fetchPickSignals();
    expect(fetchAllRows).toHaveBeenCalledWith(
      'fetchPickSignals',
      expect.objectContaining({
        table: 'research_pick_signals',
        filters: [{ column: 'captured_at', op: 'gte', value: signalFloorForSeason(2026) }],
      }),
    );
  });

  it('fetchUserPicks() calls fetchAllRows() with the exhaustive shape', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    const { fetchUserPicks } = await import('../../agents/portfolio-dossier.js');
    await fetchUserPicks();
    expect(fetchAllRows).toHaveBeenCalledWith(
      'fetchUserPicks',
      expect.objectContaining({ table: 'user_picks' }),
    );
  });

  it('a missing season-floor config throws BEFORE fetchAllRows() is ever called, rather than being swallowed into a silent degrade', async () => {
    vi.resetModules();
    vi.doMock('../../agents/lib/pick-signal-floor.js', () => ({
      buildPickSignalFilters: () => {
        throw new Error('no TRAINING_CAMP_START_BY_SEASON entry for season TEST');
      },
    }));
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockClear();
    const { fetchPickSignals } = await import('../../agents/portfolio-dossier.js');
    await expect(fetchPickSignals()).rejects.toThrow(/no TRAINING_CAMP_START_BY_SEASON entry for season TEST/);
    expect(fetchAllRows).not.toHaveBeenCalled();
    vi.doUnmock('../../agents/lib/pick-signal-floor.js');
  });
});
