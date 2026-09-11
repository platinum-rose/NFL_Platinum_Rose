// agents/lib/supabase-pagination.js
// Shared keyset/cursor pagination helper for Supabase reads on a table that
// has grown (or could grow) past PostgREST's silent 1000-row unpaginated cap.
//
// 2026-09-09 (Codex review, P2 -- "the scanner recognizes keyset syntax
// without proving pagination"): agents/portfolio-preflight.js's rowcap
// scanner previously judged a call site "safely keyset-paginated" purely by
// structural pattern-matching -- `.order(col)` + `.gt(col, ...)` +
// `.limit(...)` all present in one statement -- which a one-shot query with
// those three calls but NO loop and NO advancing cursor would also match,
// making that pattern fail-open. The durable fix Codex recommended: a
// shared helper the scanner recognizes EXPLICITLY BY NAME, the same way it
// already trusts `fetchAllPaged` (portfolio-dossier.js) for offset
// pagination -- calling this function is what actually proves iteration,
// not a structural guess about the query shape.
//
// 2026-09-09 revision (Codex round-2 review, same P2 finding, flagged
// again): the original version accepted an unconstrained `buildQuery`
// callback that built the ENTIRE query, ordering/cursor-filter/limit
// included. Codex found two real problems with that:
//   (1) the scanner's "is this .from() call wrapped in fetchAllKeyset"
//       check was pure text proximity (does the string "fetchAllKeyset"
//       appear somewhere in the preceding N characters) -- spoofable by a
//       stray comment, or by an unrelated already-closed fetchAllKeyset()
//       call earlier in the file.
//   (2) even a GENUINE wrapper call could still get pagination wrong --
//       ignore the cursor, omit `.order()`, or filter on a non-unique
//       column -- since fetchAllKeyset() itself never validated any of
//       that; it just awaited whatever buildQuery() handed back.
// Fixed both by taking ownership of the actual pagination clauses here
// instead of delegating them to the caller: this helper now builds
// `.order(cursorColumn, {ascending: true}).gt(cursorColumn, cursor ?? '')
// .limit(pageSize)` itself, every call, unconditionally. The caller
// supplies only `table`, `select`, and an optional `applyFilters(query)`
// for base WHERE-clause-style filters (`.like()`, `.not()`, `.eq()`, etc)
// -- it has no way to touch ordering, the cursor filter, or the limit, so
// there is no "genuine wrapper that gets it wrong" case left to worry
// about. This also makes the scanner-side detection strictly easier and
// more honest (see portfolio-preflight.js's isLexicallyInsideCall()): a
// caller's own source no longer contains `.order()/.gt()/.limit()` calls
// at all, because this file's `sb.from(table)` uses a variable table name,
// which the scanner's literal-string `.from('...')` matcher does not even
// register as a call site to classify.
export async function fetchAllKeyset(label, { sb, table, select, cursorColumn, pageSize, applyFilters }) {
  if (!pageSize || pageSize <= 0) throw new Error(`fetchAllKeyset(${label}): pageSize must be a positive number`);
  if (!table || !select || !cursorColumn || !sb) {
    throw new Error(`fetchAllKeyset(${label}): sb, table, select, and cursorColumn are all required`);
  }
  const rows = [];
  let cursor = null;
  for (;;) {
    let query = sb.from(table).select(select);
    if (applyFilters) query = applyFilters(query);
    // Ownership of ordering, the cursor filter, and the limit lives here,
    // not in the caller -- see the 2026-09-09 revision note above.
    query = query
      .order(cursorColumn, { ascending: true })
      .gt(cursorColumn, cursor ?? '') // '' sorts before every real (non-empty) key, so the first page (cursor still null) matches everything, identical to no filter at all
      .limit(pageSize);
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    const last = data[data.length - 1];
    const nextCursor = last?.[cursorColumn];
    if (nextCursor == null) {
      // A page came back full (== pageSize) but its last row has no value
      // for the cursor column -- advancing would either loop forever on
      // the same page or silently drop rows. Fail loud rather than either.
      throw new Error(`${label}: keyset cursor column "${cursorColumn}" is null/missing on the last row of a full page -- cannot safely advance`);
    }
    cursor = nextCursor;
  }
  return rows;
}

// =============================================================================
// Query dialect primitives (Codex Round 9, approved for implementation at v8,
// 2026-09-10). A small, fixed set of provably-safe query shapes intended to
// replace ad-hoc Supabase reads across the pipeline, eventually enforced by a
// dedicated ESLint rule (not yet built). See
// docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md for the
// full design history (v1-v8) and every finding that shaped this code -- each
// comment below points at the specific finding it closes.
//
// Phase 1 of an incremental, Codex-reviewed rollout (Andy authorized this
// phasing, 2026-09-10): this lands ONLY the generic dialect primitives below.
// No pipeline call site has been migrated to use them yet -- fetchAllKeyset()
// above remains the live helper for its two existing callers
// (portfolio-synthesize.js) until its callers are migrated in a later,
// separately-reviewed phase. `signalFloorForSeason()`/
// `TRAINING_CAMP_START_BY_SEASON` (v8, Finding 3 response) are deliberately
// NOT included here -- that's a product-specific configuration value for one
// call site (`fetchPickSignals()`), not a generic dialect primitive, so it
// belongs with that call site's own migration in a later phase, not in this
// generic, table-agnostic helper file.
// =============================================================================

// PostgREST's actual configured max-rows-per-request cap for this project.
// Verified live twice (Codex, v3 and v4 review rounds): a request for 2000
// rows against a 27,082-row table (futures_odds_snapshots) returned exactly
// 1000. Deliberately NOT a caller-overridable parameter -- v2's review found
// that a caller-supplied pageSize/hardCap could reproduce silent truncation
// if set above the server's real cap. If this value ever drifts from the
// server's real cap, fetchAllRows()'s empty-page termination (below) stays
// correct regardless of what the real cap is; fetchTopRows()'s cap-drift
// check is what catches drift for the one shape that DOES depend on an
// assumed value matching the real one.
export const POSTGREST_MAX_ROWS = 1000;

// fetchByUniqueValues()'s value-count ceiling. Kept strictly below
// POSTGREST_MAX_ROWS so that a response of exactly N rows (N = values.length)
// can never be a truncated response masquerading as a genuine
// one-match-per-value result -- see fetchByUniqueValues()'s own comment for
// why no after-the-fact response-shape check can tell those two cases apart.
export const UNIQUE_VALUES_HARD_CAP = 999;

// Each table's real single-column unique/primary key, verified directly
// against its migration file (not assumed) -- see the v3 proposal doc for
// the per-table verification trail. Used by fetchAllRows() (cursor column)
// and fetchTopRows() (deterministic secondary sort, v7 Finding). A table
// with no single-column unique key is deliberately absent from this map:
// nfl_trench_ratings has only a 5-column composite primary key (verified
// against supabase/migrations/053_bettorday_intel.sql) and cannot be used
// with fetchAllRows()/fetchTopRows() until a separately authorized,
// additive surrogate-key migration lands.
export const TABLE_UNIQUE_KEYS = {
  futures_odds_snapshots: 'id',
  player_injuries: 'id',
  game_odds_snapshots: 'id',
  nfl_rosters: 'id',
  podcast_host_summaries: 'id',
  research_pick_signals: 'id',
  research_intel_notes: 'id',
  podcast_transcripts: 'id',
  podcast_episodes: 'id',
  nfl_team_season_stats: 'id',
  game_splits_history: 'id',
  referee_tendencies: 'id',
  team_analytic_snapshots: 'id',
  team_dvoa_snapshots: 'id',
  team_coaching_tendency_snapshots: 'id',
  user_picks: 'id',
  games: 'game_id',
  vault_notes: 'path',
};

function tableUniqueKey(label, table) {
  const col = TABLE_UNIQUE_KEYS[table];
  if (!col) {
    throw new Error(`${label}: no TABLE_UNIQUE_KEYS entry for "${table}" -- add one (verified against its migration file) before using this table with the query dialect`);
  }
  return col;
}

// Splits a Supabase `select()` string into its top-level column names, only
// splitting on commas at paren-depth 0 -- so a nested foreign-table select
// like `'intel, picks, podcast_episodes ( title, pub_date )'` correctly
// yields ['intel', 'picks', 'podcast_episodes'], not a spurious 4th entry
// from the comma inside the parens. Used to detect whether a caller's own
// select already requests a given column (e.g. the cursor column), so
// fetchAllRows() only injects/strips it when the caller didn't ask for it.
function topLevelSelectColumnNames(select) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of select) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim().split(/\s+/)[0].split('(')[0].trim()).filter(Boolean);
}

// Declarative filter dialect: filters are plain data ({ column, op, value }),
// never callback functions -- the v2 review closed the "genuine wrapper,
// wrong arguments" class of bug by removing caller-supplied filter code
// entirely, and this keeps that property. `op` must be one of
// ALLOWED_FILTER_OPS. There is no generic negation flag: v5's review found
// that a generic `negate` applying `.not(column, op, value)` for any op is
// unsafe for ops like `in`, because the installed client's `.in()`/`.notIn()`
// do work (dedup, PostgREST-reserved-character quoting, `in.(...)` framing)
// that a raw `.not()` call does not replicate -- verified directly against
// node_modules/@supabase/postgrest-js's source. `notLike` is the one
// narrowly-scoped negated operator, matching the one real production usage
// (`.not('path', 'like', ...)`) safely, since `like` patterns are plain
// strings with no array-quoting or dedup concerns.
export const ALLOWED_FILTER_OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'notLike', 'in']);

export function applyDeclarativeFilters(query, filters) {
  for (const f of filters || []) {
    if (!f || typeof f.column !== 'string' || !ALLOWED_FILTER_OPS.has(f.op)) {
      throw new Error(`applyDeclarativeFilters: unsupported filter ${JSON.stringify(f)}`);
    }
    query = f.op === 'notLike' ? query.not(f.column, 'like', f.value) : query[f.op](f.column, f.value);
  }
  return query;
}

// Shape 4: exhaustive keyset scan. Guarantees every row matching `filters`
// is visited exactly once via primary-key-ascending pagination -- makes NO
// claim about delivery order relative to any other column (v5 Finding 2:
// several existing reducers depend on delivery order and must be converted
// to explicit comparison-based reductions before their reads are migrated
// to this helper; that conversion is a separate, later phase, not part of
// landing this primitive).
//
// Termination is empty-page-only (v4 fix), not a response-length
// comparison against POSTGREST_MAX_ROWS -- correct regardless of what the
// server's actual configured cap is on any given day. The cursor-advance
// check uses exact-value equality (v5 fix, not `<=`), which is
// collation-agnostic and correct for text, numeric, or uuid cursor columns
// alike, since empty-page termination already handles "no more rows" and
// this check only needs to catch a cursor that is genuinely stuck.
//
// If the caller's own `select` doesn't request the cursor column, it is
// injected into the query and stripped back out of the returned rows (v3
// fix) -- invisible to the caller either way. A caller whose reducer needs
// the unique-key value in its own output (e.g. as a tiebreaker) must
// request that column explicitly in its own `select` (v7 Finding 1) --
// this helper's injection/stripping is designed to be invisible and will
// strip an unrequested column right back out.
export async function fetchAllRows(label, { sb, table, select, filters }) {
  if (!sb || !table || !select) throw new Error(`fetchAllRows(${label}): sb, table, and select are all required`);
  const cursorColumn = tableUniqueKey(label, table);
  const requestedCols = topLevelSelectColumnNames(select);
  // 2026-09-10 fix (Codex Phase 1 review, Finding 2, P2): a caller who
  // requested a top-level `*` already gets every column back from
  // PostgREST, cursor column included -- treating `*` as "missing" the
  // cursor column (the naive check below would, since the literal string
  // "*" doesn't equal "id"/"game_id"/"path") made this helper append
  // `*, id` to the select and then strip `id` back out of every returned
  // row, silently deleting a column the caller's own `*` had already asked
  // for and would otherwise have received.
  const needsCursorInjection = !requestedCols.includes('*') && !requestedCols.includes(cursorColumn);
  const effectiveSelect = needsCursorInjection ? `${select}, ${cursorColumn}` : select;

  const rows = [];
  let cursor = null;
  for (;;) {
    let query = sb.from(table).select(effectiveSelect);
    query = applyDeclarativeFilters(query, filters);
    query = query.order(cursorColumn, { ascending: true });
    if (cursor !== null) query = query.gt(cursorColumn, cursor);
    query = query.limit(POSTGREST_MAX_ROWS); // the requested page size, NOT the termination signal
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break; // the ONLY termination signal -- independent of the server's actual cap
    const nextCursor = data[data.length - 1][cursorColumn];
    if (nextCursor == null) throw new Error(`${label}: cursor column "${cursorColumn}" is null/missing on the last row of a page`);
    if (cursor !== null && nextCursor === cursor) throw new Error(`${label}: cursor failed to advance (stuck at ${String(cursor)}) -- aborting instead of looping forever`);
    cursor = nextCursor;
    rows.push(...(needsCursorInjection ? data.map(({ [cursorColumn]: _drop, ...rest }) => rest) : data));
  }
  return rows;
}

// Shape 3: bounded-by-fixed-small-set read. Scoped explicitly to genuinely
// small, non-growing sets -- vault_notes' 6 reference documents is the case
// this was modeled on -- NOT a general "look up by ID list" tool. A caller
// whose value set can grow over time (e.g. podcast episode IDs) must use
// fetchAllRows() with an `in` filter instead (v4 Finding 1 corrected exactly
// this misuse for podcast_episodes). Since the lookup column is unique, the
// maximum possible response size is `values.length`, which
// UNIQUE_VALUES_HARD_CAP keeps strictly below POSTGREST_MAX_ROWS -- so as
// long as that invariant holds, the response can never be silently
// truncated by the server's row cap.
//
// 2026-09-10 fix (Codex Phase 1 review, Finding 1, P1): this used to accept
// an arbitrary caller-supplied `column` and pass it straight to `.in()` --
// which breaks Shape 3's whole proof. The approved design's uniqueness
// guarantee comes from TABLE_UNIQUE_KEYS, the single verified source of
// truth for "this column is actually unique on this table" -- a caller
// could ask to look up by any non-unique column (or a typo'd one) and get
// more than one row per value, silently truncated past
// UNIQUE_VALUES_HARD_CAP the same way an unbounded read would be. The
// lookup column is no longer a parameter at all; it is always
// `tableUniqueKey(label, table)`, exactly like fetchAllRows()'s cursor
// column and fetchTopRows()'s secondary sort.
export async function fetchByUniqueValues(label, { sb, table, select, values }) {
  if (!sb || !table || !select) {
    throw new Error(`fetchByUniqueValues(${label}): sb, table, and select are all required`);
  }
  const column = tableUniqueKey(label, table);
  const unique = Array.from(new Set(values || []));
  if (unique.length === 0) return [];
  if (unique.length > UNIQUE_VALUES_HARD_CAP) {
    throw new Error(`fetchByUniqueValues(${label}): ${unique.length} values exceeds the hard cap of ${UNIQUE_VALUES_HARD_CAP} -- this shape is for genuinely fixed, small, non-growing sets only; use fetchAllRows() with an 'in' filter for a growing set instead`);
  }
  const { data, error } = await sb.from(table).select(select).in(column, unique);
  if (error) throw new Error(`${label}: ${error.message}`);
  return data || [];
}

// Shape 5: bounded top-N read -- distinct from fetchAllRows() (exhaustive,
// no completeness bound) and fetchByUniqueValues() (small fixed set). This
// shape makes NO claim of completeness; it exists for call sites that
// deliberately want only the most-recent/most-relevant N rows (e.g. "the
// newest 300 podcast transcripts"), not the whole table. `limit` is
// caller-supplied but hard-capped at POSTGREST_MAX_ROWS, for the same
// reason pageSize/hardCap were removed as caller-facing parameters
// elsewhere (v2 review, Finding 2): a request for more rows than the server
// will ever return can't be told apart from a genuine short result, so this
// refuses that ambiguity outright rather than accepting it.
//
// The table's declared unique key is always appended as a secondary
// ascending sort after the caller's primary `orderBy` (v7 Finding 3): the
// caller's primary order column is not always itself unique (e.g.
// podcast_transcripts.processed_at has no unique or even standalone index,
// only a plain performance index -- confirmed against
// supabase/migrations/003_podcast.sql), so without a secondary key the
// exact top-N set would be nondeterministic across repeated runs at ties.
//
// Cap-drift detection (v7 Finding 3): if a short page comes back (fewer
// rows than `limit`), that should mean "there just wasn't enough matching
// data" -- verified against an actual count query rather than assumed, so
// a future lowering of the project's real row cap below the requested
// `limit` is caught loudly (thrown) instead of silently under-delivering.
// This costs one extra request, but only when a short page is actually
// returned.
export async function fetchTopRows(label, { sb, table, select, filters, orderBy, limit }) {
  if (!sb || !table || !select) throw new Error(`fetchTopRows(${label}): sb, table, and select are all required`);
  if (!Number.isInteger(limit) || limit <= 0 || limit > POSTGREST_MAX_ROWS) {
    throw new Error(`fetchTopRows(${label}): limit must be a positive integer <= ${POSTGREST_MAX_ROWS}`);
  }
  if (!orderBy?.column) throw new Error(`fetchTopRows(${label}): orderBy.column is required`);
  const secondaryColumn = tableUniqueKey(label, table);

  let query = sb.from(table).select(select);
  query = applyDeclarativeFilters(query, filters);
  query = query
    .order(orderBy.column, { ascending: orderBy.ascending ?? false })
    .order(secondaryColumn, { ascending: true })
    .limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  const rows = data || [];

  if (rows.length < limit) {
    let countQuery = sb.from(table).select('*', { count: 'exact', head: true });
    countQuery = applyDeclarativeFilters(countQuery, filters);
    const { count, error: countError } = await countQuery;
    if (countError) throw new Error(`${label}: cap-drift count check failed: ${countError.message}`);
    // 2026-09-10 fix (Codex Phase 1 review, Finding 3, P2): the original
    // check only threw when `count` was a number GREATER than rows.length,
    // which meant a missing/null count (no error reported, but no usable
    // count either) silently passed -- exactly the case where this helper
    // has the least ability to tell "genuinely exhausted" apart from
    // "row-cap drift truncated the response," since it has no count to
    // compare against at all. On a short page, a valid, verifying count is
    // required, not merely absent-of-contradiction: it must be an integer
    // exactly equal to what came back (Codex's own formula:
    // data.length === min(total, limit) -- on this branch limit has
    // already been ruled out by `rows.length < limit`, so total must equal
    // rows.length exactly). Anything else -- null, non-integer, or a
    // mismatched number -- fails loud.
    if (!Number.isInteger(count)) {
      throw new Error(`${label}: requested ${limit} rows and got ${rows.length}, but the verifying count query returned ${JSON.stringify(count)} (not a usable integer) -- cannot confirm this is genuine exhaustion rather than row-cap drift, failing loud instead of silently under-delivering`);
    }
    if (count !== rows.length) {
      throw new Error(`${label}: requested ${limit} rows and got ${rows.length}, but the verifying count query says ${count} row(s) actually match the filters (expected exactly ${rows.length}) -- the project's row cap appears to have dropped below the requested limit (configuration drift), not a genuine shortage of data`);
    }
  }
  return rows;
}
