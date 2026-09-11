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

// =============================================================================
// Query dialect primitives (Codex Round 9, approved for implementation at v8,
// 2026-09-10) -- Phase 1: the generic primitives only, no pipeline call sites
// migrated yet. Uses a richer mock query builder supporting the additional
// chain methods (.gte, .neq, .lt, .lte, .in, .not, count/head select options)
// these shapes need, beyond what the fetchAllKeyset() mock above covers.
// =============================================================================

import {
  fetchAllRows,
  fetchByUniqueValues,
  fetchTopRows,
  applyDeclarativeFilters,
  TABLE_UNIQUE_KEYS,
  POSTGREST_MAX_ROWS,
  UNIQUE_VALUES_HARD_CAP,
} from '../../agents/lib/supabase-pagination.js';

// Builds a mock `sb` where each `.from(table)` call gets a fresh query whose
// chain calls are recorded, and whose terminal resolution is driven by a
// per-table (or default) responder function so a single mock can serve both
// the main paginated/limited query and fetchTopRows()'s follow-up count
// query in the same test.
function makeDialectMock(responder) {
  const calls = [];
  function makeQuery(table) {
    const record = { table, select: null, selectOpts: null, filters: [], order: [], gt: null, limit: null };
    calls.push(record);
    const query = {
      select(s, opts) { record.select = s; record.selectOpts = opts || null; return query; },
      eq(...a) { record.filters.push(['eq', ...a]); return query; },
      neq(...a) { record.filters.push(['neq', ...a]); return query; },
      gt(...a) { record.filters.push(['gt', ...a]); record.gt = { col: a[0], val: a[1] }; return query; },
      gte(...a) { record.filters.push(['gte', ...a]); return query; },
      lt(...a) { record.filters.push(['lt', ...a]); return query; },
      lte(...a) { record.filters.push(['lte', ...a]); return query; },
      like(...a) { record.filters.push(['like', ...a]); return query; },
      not(...a) { record.filters.push(['not', ...a]); return query; },
      in(...a) { record.filters.push(['in', ...a]); return query; },
      order(col, opts) { record.order.push({ col, opts }); return query; },
      limit(n) { record.limit = n; return query; },
      then(resolve, reject) {
        return Promise.resolve(responder(record)).then(resolve, reject);
      },
    };
    return query;
  }
  const sb = { from: (table) => makeQuery(table) };
  return { sb, calls };
}

describe('applyDeclarativeFilters() -- plain-data filters, no callback code (v2/v5)', () => {
  it('applies eq/gte/like in order', () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [], error: null }));
    applyDeclarativeFilters(sb.from('t').select('x'), [
      { column: 'season', op: 'eq', value: 2026 },
      { column: 'captured_at', op: 'gte', value: '2026-08-10' },
      { column: 'path', op: 'like', value: 'NFL/Teams/%' },
    ]);
    expect(calls[0].filters).toEqual([
      ['eq', 'season', 2026],
      ['gte', 'captured_at', '2026-08-10'],
      ['like', 'path', 'NFL/Teams/%'],
    ]);
  });

  it('notLike calls .not(column, "like", value), not a generic negated op (v5 Finding 5)', () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [], error: null }));
    applyDeclarativeFilters(sb.from('t').select('x'), [{ column: 'path', op: 'notLike', value: 'NFL/Teams/%-%' }]);
    expect(calls[0].filters).toEqual([['not', 'path', 'like', 'NFL/Teams/%-%']]);
  });

  it('rejects an op outside the allowlist rather than silently passing it through', () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    expect(() => applyDeclarativeFilters(sb.from('t').select('x'), [{ column: 'x', op: 'ilike', value: 'y' }])).toThrow(/unsupported filter/);
  });

  it('rejects a malformed filter (missing column) rather than throwing an unrelated TypeError', () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    expect(() => applyDeclarativeFilters(sb.from('t').select('x'), [{ op: 'eq', value: 1 }])).toThrow(/unsupported filter/);
  });

  it('is a no-op on empty/undefined filters', () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [], error: null }));
    applyDeclarativeFilters(sb.from('t').select('x'), undefined);
    expect(calls[0].filters).toEqual([]);
  });
});

describe('fetchAllRows() -- exhaustive keyset scan (Shape 4)', () => {
  it('throws for a table with no TABLE_UNIQUE_KEYS entry (nfl_trench_ratings -- composite PK, no surrogate)', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    expect(TABLE_UNIQUE_KEYS.nfl_trench_ratings).toBeUndefined();
    await expect(fetchAllRows('trench', { sb, table: 'nfl_trench_ratings', select: 'team' }))
      .rejects.toThrow(/no TABLE_UNIQUE_KEYS entry for "nfl_trench_ratings"/);
  });

  it('injects the cursor column when the caller\'s select omits it, and strips it back out of returned rows (v3 fix)', async () => {
    let page = 0;
    const { sb } = makeDialectMock((record) => {
      page += 1;
      expect(record.select).toBe('injury_status, team_abbr, id'); // injected -- caller's select didn't include id
      if (page === 1) return { data: [{ injury_status: 'Out', team_abbr: 'SEA', id: 7 }], error: null };
      return { data: [], error: null };
    });
    const rows = await fetchAllRows('inj', { sb, table: 'player_injuries', select: 'injury_status, team_abbr' });
    // caller only asked for injury_status/team_abbr -- the injected id must
    // be stripped back out of what fetchAllRows() returns.
    expect(rows).toEqual([{ injury_status: 'Out', team_abbr: 'SEA' }]);
    expect(Object.keys(rows[0]).sort()).toEqual(['injury_status', 'team_abbr']);
  });

  it('does NOT inject or strip when the caller already requests the cursor column explicitly (v7 Finding 1)', async () => {
    const { sb, calls } = makeDialectMock((record) => {
      expect(record.select).toBe('id, injury_status'); // unchanged -- caller already asked for id
      return { data: [], error: null };
    });
    await fetchAllRows('inj', { sb, table: 'player_injuries', select: 'id, injury_status' });
    expect(calls[0].select).toBe('id, injury_status');
  });

  it('correctly parses top-level select columns around a nested foreign-table join (does not miscount a comma inside parens)', async () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [], error: null }));
    await fetchAllRows('pe', {
      sb,
      table: 'podcast_episodes',
      select: 'intel, picks, id, podcast_episodes ( title, pub_date )',
    });
    // "id" already present at top level -- no injection despite the nested
    // comma inside the parens, which a naive comma-split would miscount.
    expect(calls[0].select).toBe('intel, picks, id, podcast_episodes ( title, pub_date )');
  });

  it('does NOT strip the cursor column when the caller requests a top-level wildcard (Codex Phase 1 review, Finding 2) -- "*" already includes it', async () => {
    let page = 0;
    const { sb, calls } = makeDialectMock(() => {
      page += 1;
      if (page === 1) return { data: [{ id: 1, injury_status: 'Out', team_abbr: 'SEA' }], error: null };
      return { data: [], error: null }; // empty page -- stop
    });
    const rows = await fetchAllRows('inj', { sb, table: 'player_injuries', select: '*' });
    // select is untouched -- "*" was never treated as missing the cursor column
    expect(calls[0].select).toBe('*');
    // and the id that "*" already returned is NOT stripped back out
    expect(rows).toEqual([{ id: 1, injury_status: 'Out', team_abbr: 'SEA' }]);
  });

  it('paginates across full pages and stops on the first empty page, not a length comparison (v4 fix)', async () => {
    const pages = [
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
      [], // empty page -- the only termination signal
    ];
    let call = 0;
    const { sb, calls } = makeDialectMock(() => ({ data: pages[call++], error: null }));
    const rows = await fetchAllRows('t', { sb, table: 'user_picks', select: 'id' });
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4]);
    expect(calls).toHaveLength(3);
    expect(calls[0].gt).toBeNull();
    expect(calls[1].gt).toEqual({ col: 'id', val: 2 });
    expect(calls[2].gt).toEqual({ col: 'id', val: 4 });
  });

  it('throws on a stuck cursor via exact-value equality, not an ordering comparison (v5 fix)', async () => {
    // Same cursor value forever -- would loop forever without this check.
    const { sb } = makeDialectMock(() => ({ data: [{ path: 'p', content: 'x' }], error: null }));
    await expect(fetchAllRows('t', { sb, table: 'vault_notes', select: 'path, content' }))
      .rejects.toThrow(/cursor failed to advance/);
  });

  it('throws when the last row of a page is missing the cursor column entirely', async () => {
    const { sb } = makeDialectMock(() => ({ data: [{ other: 'x' }], error: null }));
    await expect(fetchAllRows('t', { sb, table: 'user_picks', select: 'other, id' }))
      .rejects.toThrow(/cursor column "id" is null\/missing/);
  });

  it('propagates a query error as a thrown Error', async () => {
    const { sb } = makeDialectMock(() => ({ data: null, error: { message: 'boom' } }));
    await expect(fetchAllRows('t', { sb, table: 'user_picks', select: 'id' })).rejects.toThrow(/t: boom/);
  });

  it('applies declarative filters before pagination clauses', async () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [], error: null }));
    await fetchAllRows('rps', {
      sb,
      table: 'research_pick_signals',
      select: 'id, lean',
      filters: [{ column: 'captured_at', op: 'gte', value: '2026-08-10' }],
    });
    expect(calls[0].filters).toEqual(expect.arrayContaining([['gte', 'captured_at', '2026-08-10']]));
  });
});

describe('fetchByUniqueValues() -- bounded fixed-small-set read (Shape 3)', () => {
  it('dedupes values and queries with .in() on the table\'s TABLE_UNIQUE_KEYS column -- no caller-supplied column (Codex Phase 1 review, Finding 1)', async () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [{ path: 'a' }], error: null }));
    const rows = await fetchByUniqueValues('vn', { sb, table: 'vault_notes', select: 'path, content', values: ['a', 'a', 'b'] });
    expect(rows).toEqual([{ path: 'a' }]);
    expect(calls[0].filters).toEqual([['in', 'path', ['a', 'b']]]);
  });

  it('throws for a table with no TABLE_UNIQUE_KEYS entry, same as fetchAllRows()/fetchTopRows() -- there is no way to bypass the uniqueness proof by naming an arbitrary column', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    await expect(fetchByUniqueValues('trench', { sb, table: 'nfl_trench_ratings', select: 'team', values: ['SEA'] }))
      .rejects.toThrow(/no TABLE_UNIQUE_KEYS entry for "nfl_trench_ratings"/);
  });

  it('returns [] without querying when values is empty', async () => {
    const { sb, calls } = makeDialectMock(() => ({ data: [{ path: 'a' }], error: null }));
    const rows = await fetchByUniqueValues('vn', { sb, table: 'vault_notes', select: 'path', values: [] });
    expect(rows).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('throws rather than truncating when values.length exceeds UNIQUE_VALUES_HARD_CAP', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    const tooMany = Array.from({ length: UNIQUE_VALUES_HARD_CAP + 1 }, (_, i) => `v${i}`);
    await expect(fetchByUniqueValues('big', { sb, table: 'vault_notes', select: 'path', values: tooMany }))
      .rejects.toThrow(new RegExp(`exceeds the hard cap of ${UNIQUE_VALUES_HARD_CAP}`));
  });

  it('stays strictly below POSTGREST_MAX_ROWS by construction', () => {
    expect(UNIQUE_VALUES_HARD_CAP).toBeLessThan(POSTGREST_MAX_ROWS);
  });

  it('propagates a query error', async () => {
    const { sb } = makeDialectMock(() => ({ data: null, error: { message: 'boom' } }));
    await expect(fetchByUniqueValues('vn', { sb, table: 'vault_notes', select: 'path', values: ['a'] }))
      .rejects.toThrow(/vn: boom/);
  });
});

describe('fetchTopRows() -- bounded top-N read (Shape 5)', () => {
  it('orders by the caller\'s primary column then the table\'s unique key as a deterministic secondary sort (v7 Finding 3)', async () => {
    let call = 0;
    const { sb, calls } = makeDialectMock(() => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }], error: null }; // short page (1 < limit 300) -- triggers a count check
      return { count: 1, error: null }; // confirms genuine exhaustion, not drift -- irrelevant to this test's ordering assertion
    });
    await fetchTopRows('pt', {
      sb,
      table: 'podcast_transcripts',
      select: 'id, processed_at',
      orderBy: { column: 'processed_at', ascending: false },
      limit: 300,
    });
    expect(calls[0].order).toEqual([
      { col: 'processed_at', opts: { ascending: false } },
      { col: 'id', opts: { ascending: true } },
    ]);
    expect(calls[0].limit).toBe(300);
  });

  it('rejects a limit above POSTGREST_MAX_ROWS rather than silently capping it', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: POSTGREST_MAX_ROWS + 1 }))
      .rejects.toThrow(/limit must be a positive integer/);
  });

  it('rejects a non-positive or non-integer limit', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 0 })).rejects.toThrow();
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 1.5 })).rejects.toThrow();
  });

  it('requires orderBy.column', async () => {
    const { sb } = makeDialectMock(() => ({ data: [], error: null }));
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', limit: 10 })).rejects.toThrow(/orderBy.column is required/);
  });

  it('does NOT run a count check when the full limit came back', async () => {
    const { sb, calls } = makeDialectMock(() => ({ data: Array.from({ length: 300 }, (_, i) => ({ id: i })), error: null }));
    const rows = await fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 300 });
    expect(rows).toHaveLength(300);
    expect(calls).toHaveLength(1); // only the primary query -- no count follow-up
  });

  it('runs a count check on a short page and passes when the count confirms there genuinely was not enough data', async () => {
    let call = 0;
    const { sb, calls } = makeDialectMock((record) => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }, { id: 2 }], error: null }; // short page: 2 < limit(300)
      expect(record.selectOpts).toEqual({ count: 'exact', head: true });
      return { count: 2, error: null }; // confirms genuinely only 2 rows match
    });
    const rows = await fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 300 });
    expect(rows).toHaveLength(2);
    expect(calls).toHaveLength(2);
  });

  it('throws when a short page contradicts the count -- configuration drift, the v7 Finding 3 catch (Codex\'s formula: data.length === min(total, limit))', async () => {
    let call = 0;
    const { sb } = makeDialectMock(() => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }, { id: 2 }], error: null }; // short page: 2 < limit(300)
      return { count: 500, error: null }; // but 500 rows actually match -- drift
    });
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 300 }))
      .rejects.toThrow(/configuration drift/);
  });

  it('throws rather than passing when the count check comes back null on a short page (Codex Phase 1 review, Finding 3) -- a missing count must not fail open', async () => {
    let call = 0;
    const { sb } = makeDialectMock(() => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }, { id: 2 }], error: null }; // short page: 2 < limit(300)
      return { count: null, error: null }; // no error reported, but no usable count either
    });
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 300 }))
      .rejects.toThrow(/cannot confirm this is genuine exhaustion/);
  });

  it('throws when the count is a number but does not exactly equal the returned row count on a short page', async () => {
    let call = 0;
    const { sb } = makeDialectMock(() => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }, { id: 2 }], error: null }; // short page: 2 < limit(300)
      return { count: 1, error: null }; // contradicts rows.length (2) even though it's "less" data, not more
    });
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 300 }))
      .rejects.toThrow(/configuration drift/);
  });

  it('propagates a primary-query error', async () => {
    const { sb } = makeDialectMock(() => ({ data: null, error: { message: 'boom' } }));
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 10 }))
      .rejects.toThrow(/pt: boom/);
  });

  it('propagates a count-query error', async () => {
    let call = 0;
    const { sb } = makeDialectMock(() => {
      call += 1;
      if (call === 1) return { data: [{ id: 1 }], error: null };
      return { count: null, error: { message: 'count boom' } };
    });
    await expect(fetchTopRows('pt', { sb, table: 'podcast_transcripts', select: 'id', orderBy: { column: 'processed_at' }, limit: 10 }))
      .rejects.toThrow(/cap-drift count check failed: count boom/);
  });
});
