// tests/unit/gatherExpertPicks.test.js
// Round 9 v8 step 5 / Phase 3c site 4 (Codex-approved at v5, 2026-09-11):
// wiring tests for the expert-pick lane, migrated off a raw, unpaginated,
// unordered user_picks read onto fetchAllRows(). fetchAllRows() is mocked
// and the real, exported buildExpertPicksRequest()/gatherExpertPicks()/
// gatherExpertPicksSafe() from signal-normalize.js are called directly --
// same wiring-test pattern as tests/unit/pickSignalFloor.test.js for
// Phase 3b and tests/unit/portfolioDossierPhase3c.test.js for sites 1-3.
//
// signal-normalize.js's env validation, model-key loading, and Supabase
// client creation are all lazy (ensureEnv(), only called from main()), and
// gatherItems()'s article/podcast lanes are never reached by anything this
// file imports or calls -- gatherExpertPicks()/gatherExpertPicksSafe() are
// standalone, so this suite runs (and is required to run) with zero
// Supabase/OpenAI/Anthropic credentials and makes zero live network calls.
// Verified operationally as part of Phase 3c's verification pass:
//   SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= OPENAI_API_KEY= ANTHROPIC_API_KEY= \
//     npx vitest run tests/unit/gatherExpertPicks.test.js

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../agents/lib/supabase-pagination.js', () => ({
  fetchAllRows: vi.fn(),
}));

describe('buildExpertPicksRequest() (request-shape unit test)', () => {
  it('targets user_picks, source=EXPERT, with created_at selected', async () => {
    const { buildExpertPicksRequest } = await import('../../agents/signal-normalize.js');
    const request = buildExpertPicksRequest();
    expect(request.table).toBe('user_picks');
    expect(request.select).toBe('id, pick_type, selection, home, visitor, rationale, expert, created_at');
    expect(request.filters).toEqual([{ column: 'source', op: 'eq', value: 'EXPERT' }]);
  });
});

describe('gatherExpertPicks() wiring (real function, mocked fetchAllRows)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchAllRows() with the exhaustive request shape', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([]);
    const { gatherExpertPicks, buildExpertPicksRequest } = await import('../../agents/signal-normalize.js');

    await gatherExpertPicks();

    expect(fetchAllRows).toHaveBeenCalledWith('gatherExpertPicks', buildExpertPicksRequest());
  });

  it('sorts by created_at descending (most-recent-first)', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { id: 'a', pick_type: 'spread', selection: 'Chiefs -3', expert: 'Analyst A', created_at: '2026-08-01T00:00:00Z' },
      { id: 'b', pick_type: 'spread', selection: 'Bills -3', expert: 'Analyst B', created_at: '2026-09-01T00:00:00Z' },
    ]);
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    const items = await gatherExpertPicks();

    expect(items.map((it) => it.source_ref)).toEqual(['pick:b', 'pick:a']);
  });

  it('breaks a created_at tie using text id descending', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { id: 'pick-100', pick_type: 'total', selection: 'Over 47.5', expert: 'Analyst A', created_at: '2026-09-01T00:00:00Z' },
      { id: 'pick-2', pick_type: 'total', selection: 'Under 47.5', expert: 'Analyst B', created_at: '2026-09-01T00:00:00Z' },
    ]);
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    const items = await gatherExpertPicks();

    // 'pick-100' vs 'pick-2': lexicographic (localeCompare) descending, not numeric --
    // proves the tiebreak treats user_picks.id as text, matching migration
    // 004_user_data.sql's client-generated text primary key, not a number.
    expect(items.map((it) => it.source_ref)).toEqual(['pick:pick-2', 'pick:pick-100']);
  });

  it('sorts invalid/missing created_at values last, both against each other and against valid dates', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { id: 'valid', pick_type: 'spread', selection: 'Chiefs -3', expert: 'Analyst A', created_at: '2026-08-01T00:00:00Z' },
      { id: 'missing', pick_type: 'spread', selection: 'Bills -3', expert: 'Analyst B', created_at: null },
      { id: 'garbage', pick_type: 'spread', selection: 'Jets -3', expert: 'Analyst C', created_at: 'not-a-date' },
    ]);
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    const items = await gatherExpertPicks();

    expect(items[0].source_ref).toBe('pick:valid');
    expect(items.slice(1).map((it) => it.source_ref).sort()).toEqual(['pick:garbage', 'pick:missing']);
  });

  it('preserves the "[expert name] " prefix behavior in the raw_text shape and item fields', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      {
        id: 'p1', pick_type: 'spread', selection: 'Chiefs -3', home: 'Chiefs', visitor: 'Raiders',
        rationale: 'Chiefs offense clicking', expert: 'Analyst A', created_at: '2026-09-01T00:00:00Z',
      },
    ]);
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    const [item] = await gatherExpertPicks();

    expect(item).toEqual({
      source_type: 'expert_pick',
      source_ref: 'pick:p1',
      raw_text: '[Analyst A] spread | Chiefs -3 | Raiders @ Chiefs | Chiefs offense clicking',
      author: 'Analyst A',
    });
  });

  it('falls back to the "expert" label when a row has no expert name', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { id: 'p2', pick_type: 'total', selection: 'Over 44', expert: null, created_at: '2026-09-01T00:00:00Z' },
    ]);
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    const [item] = await gatherExpertPicks();

    expect(item.raw_text.startsWith('[expert] ')).toBe(true);
    expect(item.author).toBe('expert');
  });

  it('propagates a fetchAllRows() failure (throws) -- gatherExpertPicksSafe() is what degrades, not this function', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockRejectedValueOnce(new Error('relation "user_picks" does not exist'));
    const { gatherExpertPicks } = await import('../../agents/signal-normalize.js');

    await expect(gatherExpertPicks()).rejects.toThrow(/user_picks/);
  });
});

describe('gatherExpertPicksSafe() (catch-and-degrade wrapper)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the real items when the underlying fetch succeeds', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockResolvedValueOnce([
      { id: 'p1', pick_type: 'spread', selection: 'Chiefs -3', expert: 'Analyst A', created_at: '2026-09-01T00:00:00Z' },
    ]);
    const { gatherExpertPicksSafe } = await import('../../agents/signal-normalize.js');

    const items = await gatherExpertPicksSafe();

    expect(items).toHaveLength(1);
  });

  it('catches a query failure, warns, and returns [] instead of throwing -- so it never aborts the article/podcast lanes in gatherItems()', async () => {
    const { fetchAllRows } = await import('../../agents/lib/supabase-pagination.js');
    fetchAllRows.mockRejectedValueOnce(new Error('connection reset'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { gatherExpertPicksSafe } = await import('../../agents/signal-normalize.js');

    const items = await gatherExpertPicksSafe();

    expect(items).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('expert-pick lane skipped'));
    warnSpy.mockRestore();
  });
});
