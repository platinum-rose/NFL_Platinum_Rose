import { describe, expect, it } from 'vitest';
import { fetchAllKeyset } from '../../agents/lib/supabase-pagination.js';

// 2026-09-09 (Codex round-2 review, P2): Codex's finding had two parts.
// Part 1 (scanner detection) is covered in tests/unit/portfolioPreflightScanner.test.js.
// Part 2, covered here: "fetchAllKeyset() delegates ordering and cursor
// filtering entirely to buildQuery(). A genuine wrapper call that ignores
// the cursor or uses a non-unique cursor column is still trusted
// automatically." The fix moved ownership of `.order()`, the cursor
// `.gt()` filter, and `.limit()` INTO fetchAllKeyset() itself -- a caller
// now supplies only `table`, `select`, and an optional `applyFilters` for
// base (non-pagination) filters, with no way to touch pagination at all.
// These tests prove that ownership actually holds, using a small mock
// query builder that records every method call made on it.

function makeMockSupabase(pages) {
  // `pages` is an array of row-arrays to return, one per call to the
  // terminal (awaited) query. Each mock query records the chain of calls
  // made on it before resolving.
  let callIndex = 0;
  const calls = [];
  function makeQuery() {
    const record = { table: null, select: null, filters: [], order: null, gt: null, limit: null };
    calls.push(record);
    const query = {
      select(s) { record.select = s; return query; },
      like(...args) { record.filters.push(['like', ...args]); return query; },
      not(...args) { record.filters.push(['not', ...args]); return query; },
      eq(...args) { record.filters.push(['eq', ...args]); return query; },
      order(col, opts) { record.order = { col, opts }; return query; },
      gt(col, val) { record.gt = { col, val }; return query; },
      limit(n) { record.limit = n; return query; },
      then(resolve, reject) {
        const idx = callIndex++;
        const data = pages[idx] || [];
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      },
    };
    return query;
  }
  const sb = {
    from: (table) => {
      const q = makeQuery();
      calls[calls.length - 1].table = table;
      return q;
    },
  };
  return { sb, calls };
}

describe('fetchAllKeyset() -- pagination ownership (round 10, Codex P2 part 2)', () => {
  it('always applies order/gt/limit itself, even when applyFilters does not touch them', async () => {
    const { sb, calls } = makeMockSupabase([[{ path: 'a' }, { path: 'b' }]]);
    const rows = await fetchAllKeyset('test', {
      sb,
      table: 'vault_notes',
      select: 'path, content',
      cursorColumn: 'path',
      pageSize: 10,
      applyFilters: (q) => q.like('path', 'NFL/Teams/%'), // never touches order/gt/limit
    });
    expect(rows).toEqual([{ path: 'a' }, { path: 'b' }]);
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('vault_notes');
    expect(calls[0].select).toBe('path, content');
    expect(calls[0].filters).toEqual([['like', 'path', 'NFL/Teams/%']]);
    expect(calls[0].order).toEqual({ col: 'path', opts: { ascending: true } });
    expect(calls[0].gt).toEqual({ col: 'path', val: '' }); // first page: cursor null -> ''
    expect(calls[0].limit).toBe(10);
  });

  it('applyFilters cannot override or remove the pagination clauses -- order/gt/limit are applied by fetchAllKeyset AFTER applyFilters returns, unconditionally', async () => {
    const { sb, calls } = makeMockSupabase([[]]);
    await fetchAllKeyset('test', {
      sb,
      table: 'vault_notes',
      select: 'path',
      cursorColumn: 'path',
      pageSize: 5,
      // a hypothetical "genuine but wrong" wrapper that tries to sort by a
      // different (non-unique) column -- fetchAllKeyset must win anyway,
      // since it applies .order()/.gt()/.limit() on cursorColumn itself
      // after applyFilters runs, not before.
      applyFilters: (q) => q.order('updated_at', { ascending: false }),
    });
    expect(calls[0].order).toEqual({ col: 'path', opts: { ascending: true } });
  });

  it('advances the cursor correctly across multiple full pages and stops on a short page', async () => {
    const { sb, calls } = makeMockSupabase([
      [{ path: 'a' }, { path: 'b' }],
      [{ path: 'c' }, { path: 'd' }],
      [{ path: 'e' }], // short page -- stop here
    ]);
    const rows = await fetchAllKeyset('test', { sb, table: 't', select: 'path', cursorColumn: 'path', pageSize: 2 });
    expect(rows.map((r) => r.path)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(calls).toHaveLength(3);
    expect(calls[0].gt).toEqual({ col: 'path', val: '' });
    expect(calls[1].gt).toEqual({ col: 'path', val: 'b' });
    expect(calls[2].gt).toEqual({ col: 'path', val: 'd' });
  });

  it('stops immediately on an empty first page', async () => {
    const { sb } = makeMockSupabase([[]]);
    const rows = await fetchAllKeyset('test', { sb, table: 't', select: 'path', cursorColumn: 'path', pageSize: 10 });
    expect(rows).toEqual([]);
  });

  it('throws rather than silently looping or dropping rows when a full page\'s last row has no cursor value', async () => {
    const { sb } = makeMockSupabase([[{ path: 'a' }, { other: 'b' }]]); // full page (2), last row missing 'path'
    await expect(fetchAllKeyset('test label', { sb, table: 't', select: 'path', cursorColumn: 'path', pageSize: 2 }))
      .rejects.toThrow(/test label.*cursor column "path"/);
  });

  it('throws when required params are missing, rather than silently misbehaving', async () => {
    const { sb } = makeMockSupabase([[]]);
    await expect(fetchAllKeyset('test', { sb, table: 't', select: 'path' /* missing cursorColumn, pageSize */ }))
      .rejects.toThrow();
    await expect(fetchAllKeyset('test', { table: 't', select: 'path', cursorColumn: 'path', pageSize: 10 } /* missing sb */))
      .rejects.toThrow();
  });

  it('propagates a query error as a thrown Error rather than swallowing it', async () => {
    const sb = { from: () => ({ select: () => ({ order: () => ({ gt: () => ({ limit: () => Promise.resolve({ data: null, error: { message: 'boom' } }) }) }) }) }) };
    await expect(fetchAllKeyset('err label', { sb, table: 't', select: 'path', cursorColumn: 'path', pageSize: 10 }))
      .rejects.toThrow(/err label: boom/);
  });
});
