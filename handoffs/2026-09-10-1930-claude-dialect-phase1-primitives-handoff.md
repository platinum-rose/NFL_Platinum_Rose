# Query Dialect Implementation — Phase 1: Generic Primitives

**Date:** 2026-09-10
**Status:** Implemented, not yet reviewed by Codex. Not committed/staged/pushed.

## What this is

Codex approved the query-dialect migration design at v8 ("Approved for
implementation"), with three explicit scope limits: it approves the design
only (no code existed yet), it does not authorize the `nfl_trench_ratings`
schema migration, and it does not authorize paid synthesis. Andy chose to
implement incrementally, with Codex reviewing each phase before the next
begins (rather than one big-bang implementation + single review at the
end).

This is Phase 1: the five generic, table-agnostic dialect primitives from
`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md`'s
step 2, landed in `agents/lib/supabase-pagination.js` alongside the
existing `fetchAllKeyset()` helper (unchanged, still live for its two
current callers in `portfolio-synthesize.js`).

**No pipeline call site has been migrated to use these yet.** That's
Phase 3+ in v8's sequencing (reducer conversions first, then call-site
migrations). Live preflight output is unchanged: `{block:6, warn:6,
error:0, pass:22}`, `safe_to_run_paid_synthesis: false`.

## What was added to `agents/lib/supabase-pagination.js`

- `POSTGREST_MAX_ROWS = 1000` — verified live twice by Codex (v3, v4 rounds).
- `UNIQUE_VALUES_HARD_CAP = 999` — kept strictly below the row cap by construction (asserted in a test).
- `TABLE_UNIQUE_KEYS` — the verified per-table unique-key map from the proposal docs (v3's per-table schema verification). `nfl_trench_ratings` deliberately absent (composite PK, no surrogate yet).
- `applyDeclarativeFilters(query, filters)` — plain-data filters only (`{column, op, value}`), allowlist `eq, neq, gt, gte, lt, lte, like, notLike, in`. `notLike` calls `.not(column, 'like', value)` directly — no generic negation of arbitrary ops (v5 Finding 5: verified against the installed `@supabase/postgrest-js` source that `.not()` doesn't replicate `.in()`'s dedup/quoting, so a generic negated `in` would be unsafe).
- `fetchAllRows(label, {sb, table, select, filters})` — Shape 4, exhaustive keyset scan. Empty-page termination (v4 fix, not a length comparison), exact-value cursor-stuck detection (v5 fix, not `<=`), cursor-column auto-inject/strip when the caller's select omits it (v3 fix), using a proper paren-aware top-level column parser so a nested foreign-table join's inner comma doesn't get miscounted (needed for sites like the `podcast_episodes` join).
- `fetchByUniqueValues(label, {sb, table, select, column, values})` — Shape 3, bounded fixed-small-set read, throws above `UNIQUE_VALUES_HARD_CAP` rather than truncating.
- `fetchTopRows(label, {sb, table, select, filters, orderBy, limit})` — Shape 5, bounded top-N read. Always appends the table's declared unique key as a secondary sort (v7 Finding 3 — `podcast_transcripts.processed_at` isn't unique). Cap-drift detection: on a short page, runs a `{count:'exact', head:true}` follow-up query and throws if the true count exceeds what came back (v7 Finding 3's exact formula: `data.length === min(total, limit)`).

**Deliberately NOT included in this phase:** `TRAINING_CAMP_START_BY_SEASON`/`signalFloorForSeason()` (v8's date-threshold fix). That's specific to one call site (`fetchPickSignals()`), not a generic pagination primitive — it belongs with that site's own migration in a later phase, not in this generic, table-agnostic helper file. Flagging this explicitly so it isn't read as an oversight.

## Tests

`tests/unit/supabasePagination.test.js` grew from 8 tests (the existing `fetchAllKeyset()` suite, unchanged) to 35, adding a richer mock query builder (`makeDialectMock`) supporting `.gte/.neq/.lt/.lte/.in/.not` and count/head select options. New coverage: declarative filter allowlist/rejection/`notLike` translation, `fetchAllRows()`'s TABLE_UNIQUE_KEYS-missing-table failure, cursor inject/strip in both directions, the nested-join comma-parsing edge case, empty-page termination, exact-value stuck-cursor detection, `fetchByUniqueValues()`'s dedup/empty-input/hard-cap behavior, and `fetchTopRows()`'s secondary sort, limit validation, and both cap-drift branches (confirms vs. contradicts the short page).

Verified: `node --check` clean, `eslint` clean (0 errors, 0 warnings), `git diff --check` clean, `tests/unit/supabasePagination.test.js` + `tests/unit/portfolioPreflightScanner.test.js` together 96/96 passing, live preflight unchanged.

## Next phase

Per v8's sequencing: convert the order-dependent reducer sites
(`latestByTeam()` and the inline dedup loops in `fetchInjuryContext()`,
`fetchGameOddsOpen()`, `fetchGameSplitsLatest()`) to explicit
comparison-based reductions with the corrected null/tie rule, plus fix
`signal-normalize.js`'s `gatherItems()` and the `nfl_rosters` week-discovery
site — all hard preconditions before any read call site is migrated to the
new primitives. Awaiting Codex's review of this phase first.

## Addendum (2026-09-10, same day) — Codex Phase 1 review, changes requested and fixed

Codex reviewed the Phase 1 diff and returned "Changes requested" with 3 findings, all confirmed real:

1. **P1 — `fetchByUniqueValues()` didn't enforce that its lookup column is unique.** It accepted an arbitrary caller-supplied `column` and passed it straight to `.in()`, which breaks Shape 3's core proof — even one requested value could match more than 1,000 rows on a non-unique column and be silently truncated. Fixed: `column` is no longer a parameter at all; it's always `tableUniqueKey(label, table)`, exactly like `fetchAllRows()`'s cursor column and `fetchTopRows()`'s secondary sort. A table with no `TABLE_UNIQUE_KEYS` entry now fails the same way for all three shapes — there's no way to bypass the uniqueness proof by naming an arbitrary column.

2. **P2 — `fetchAllRows(select: '*')` silently dropped the cursor column from its result.** The column parser treated `*` as not containing the unique key, so the helper appended `*, id` and then stripped `id` back out of every row — even though `*` already included it. Fixed: a top-level `*` is now recognized as already including every column, so no injection/stripping happens for a wildcard select.

3. **P2 — a missing count made the cap-drift check fail open.** On a short page, `count: null` (no error, but no usable count) bypassed the check entirely, since only a numeric count *greater than* the returned length threw. Fixed: on a short page, the count must be a valid integer *exactly equal* to the row count returned — anything else (null, non-integer, or a mismatched number) now throws, distinguishing "can't confirm this is genuine exhaustion" (invalid count) from "confirmed configuration drift" (a valid but contradicting count).

All three fixes are in `agents/lib/supabase-pagination.js`. Test count grew from 35 to 39 (2 tests updated for the signature change, 4 new regression tests added: the missing-`TABLE_UNIQUE_KEYS`-entry case for `fetchByUniqueValues()`, the wildcard-select case, and both new count-check failure modes).

Verified: `node --check` clean, `eslint` clean (0 errors, 0 warnings), `git diff --check` clean, `tests/unit/supabasePagination.test.js` + `tests/unit/portfolioPreflightScanner.test.js` together 100/100 passing, live preflight unchanged (`{block:6, warn:6, error:0, pass:22}`, `safe_to_run_paid_synthesis: false`).
