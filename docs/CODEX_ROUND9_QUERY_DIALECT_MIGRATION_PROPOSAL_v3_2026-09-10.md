# Query Dialect Migration Proposal v3 — Response to Codex's v2 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v2_2026-09-10.md` (v2), which Codex reviewed and returned "changes requested" on 5 findings (3 P1, 2 P2). This document responds to each finding, verified against the actual schema and code this round, not asserted. Still a proposal only — no pipeline code changed.

## Verdict on the review

All 5 findings are legitimate and three are P1 for good reason. Finding 1 in particular would have been caught the moment implementation started (the table literally doesn't have the column the design assumed), but finding that at proposal stage instead of mid-migration is exactly what this review process is for. Finding 3 is the most consequential: v2's blanket exclusion of `agents/portfolio-preflight.js` contradicted the migration's own stated goal — a "fail-closed dialect" that doesn't audit the safety gate's own unbounded reads isn't fail-closed, it's fail-closed-except-for-the-thing-checking-for-failure.

## Finding-by-finding response

### Finding 1 (P1) — `nfl_trench_ratings` has no `id`, disproving the TODO tables' assumed shape

Verified directly against `supabase/migrations/053_bettorday_intel.sql:35-49`:

```sql
create table if not exists public.nfl_trench_ratings (
  team text not null, season integer not null, week integer not null,
  metric_type text not null, ... as_of_date date not null, source text ...,
  primary key (team, season, week, metric_type, as_of_date)
);
```

No `id` column exists; the primary key is a 5-column composite. `TABLE_UNIQUE_KEYS.nfl_trench_ratings = 'id'` would fail at runtime with PostgreSQL error `42703`, exactly as Codex reports. The other three `TODO`-marked tables were re-verified this round too — `team_analytic_snapshots`, `team_dvoa_snapshots`, and `team_coaching_tendency_snapshots` all genuinely have `id bigserial primary key` (checked against their migrations directly), so the assumption held for those three; `nfl_trench_ratings` is the one real exception, not a sign the whole map is unverified.

**Resolution — recommend the schema migration, don't build compound-cursor support to avoid it.** A generic composite-tuple keyset cursor is achievable in principle (an OR-of-ANDs filter expression comparing each tuple component in turn), but for a 5-column key it means hand-building and correctly escaping a 5-clause boolean filter string per page — exactly the kind of bespoke, easy-to-get-subtly-wrong logic this migration exists to get away from, for the sake of one small table. Recommending instead: add a surrogate `id bigserial primary key` (or `bigserial` unique column alongside the existing composite PK, whichever Codex prefers) to `nfl_trench_ratings` via a new, separately-reviewed migration. This is an additive, non-breaking schema change — it doesn't touch the existing composite PK or any existing query — but it's still DDL against production and gets its own authorization step, not bundled into this proposal's approval. Until that migration lands and is authorized, `nfl_trench_ratings` stays on its current unpaginated read, explicitly tracked as a known gap (as it already is — Codex confirmed last round it's `safe: false`/`unpaginated` in the live scan, non-blocking today only because the table is 512 rows). **This document does not propose generic composite-cursor support in `fetchAllRows()`** — if a future table genuinely needs it, that's worth its own design discussion rather than inheriting complexity for a one-table edge case now.

### Finding 2 (P1) — caller-controlled `pageSize`/`hardCap` reintroduce silent truncation

Correct, and a real hole: `pageSize: 2000` would make `data.length < pageSize` (`1000 < 2000`) true on PostgREST's very first capped response, so the loop would exit after one page believing it had reached the end. Same issue for `hardCap` in `fetchByUniqueValues()`. Fix: neither is a caller-facing parameter anymore.

```js
// agents/lib/supabase-pagination.js (v3 -- pageSize/hardCap removed from public signatures)

// Verified against this Supabase project's actual PostgREST configuration
// (not assumed) before this constant ships -- see "Required verification"
// below. Every comment elsewhere in this codebase asserts 1000; this is the
// one place that number should be a real constant instead of restated prose.
const POSTGREST_MAX_ROWS = 1000;
const UNIQUE_VALUES_HARD_CAP = 999; // one below POSTGREST_MAX_ROWS, matching vault_notes' existing proven pattern

export async function fetchAllRows(label, { sb, table, select, filters }) {
  // no pageSize parameter -- always requests POSTGREST_MAX_ROWS internally
  ...
}

export async function fetchByUniqueValues(label, { sb, table, select, values }) {
  // no hardCap parameter -- always checks against UNIQUE_VALUES_HARD_CAP
  if (values.length > UNIQUE_VALUES_HARD_CAP) throw new Error(`fetchByUniqueValues(${label}): ${values.length} values exceeds the fixed cap of ${UNIQUE_VALUES_HARD_CAP} -- this shape is for a small known set; use fetchAllRows() with an 'in' filter instead if the set can genuinely grow past that`);
  ...
}
```

The ESLint rule (Finding 4 of the v1 review, unchanged this round) is updated to reject any call to either helper whose options object contains a `pageSize` or `hardCap` property at all — not just "these are ignored," but a hard lint error, so a caller trying to override them is caught at write-time, matching Codex's "reject any unsupported pagination-control property" instruction directly.

**Required verification before this ships:** `POSTGREST_MAX_ROWS = 1000` is asserted everywhere in this codebase's comments but should be confirmed against the actual project's PostgREST `max-rows` config (it's configurable per-project and 1000 is the *default*, not a hard universal ceiling) before it's hardcoded as a silent assumption in code that other code now trusts completely. Flagging this rather than asserting it, since verifying it requires either the Supabase dashboard or `pg_settings`, not something checkable from a source-code read.

### Finding 3 (P1) — excluding all of `portfolio-preflight.js` hides its own unaudited reads

Verified directly — the file has 9 real Supabase call sites, not 2:

- `agents/portfolio-preflight.js:79` — `sb.from(table)` (dynamic, generic row-count check)
- `agents/portfolio-preflight.js:90` — `sb.from(table)` (dynamic, generic latest-row check)
- `:814` — `games`, `.limit(1000)` (season-scoped, functionally bounded — season has ~272 games — but not provably so under the dialect)
- `:831` — `nfl_rosters`, `.limit(1000)` week-discovery — **this is a live, real bug**, confirmed: a single roster week is ~3,575 rows (per this file's own comment at line ~822 referencing the same fact), and this query orders by `week` descending and caps at 1000, so once the current season's newest week alone exceeds 1000 rows, this check can structurally never see a second, older week — it would report "only 1 distinct week" even after week 2's data has landed, silently. The current WARN message's own comment layer treats "1 week" as an expected preseason state, which is masking that the query has never actually been capable of correctly counting weeks once real per-week volume exists.
- `:856` — `player_injuries`, correctly paginated via a hand-rolled `.range()` loop already (not a bug, just inconsistent with the new dialect's helpers)
- `:902` — `podcast_transcripts`, no bound at all
- `:906` — `podcast_episodes`, filtered via `.in('id', transcriptIds)` with no explicit limit — bounded by the filter today, but if `transcriptIds` ever exceeds 999 distinct episodes, PostgREST's row cap still applies to the *response*, so this can silently return fewer matches than requested with no error, same risk class `fetchByUniqueValues()` exists to close
- `:920` — `podcast_host_summaries`, no bound at all
- `:1126` — `games`, `.limit(1)` with full ordering — functionally a single-row lookup, just not written as `.single()`

**Resolution:** the dialect applies to `agents/portfolio-preflight.js` too, with the exemption narrowed to exactly the two dynamic-table sites (`:79`, `:90`) — both structurally require a variable table name because their entire job is generic introspection across every table `SCANNED_SOURCES`'s row-cap map names, which is a fundamentally different operation from a literal business-logic read. The other 7 literal-table sites migrate like any pipeline call site: `:902`, `:920`, and `:814` to `fetchAllRows()`; `:906` to `fetchByUniqueValues()` (a second real use case for it beyond `vault_notes`, and it closes the >999-episode risk as a side effect); `:831` to `fetchAllRows()` as the actual fix for the live week-discovery bug (fetching every roster row for the season via proper pagination, rather than trusting a single capped page, is what actually fixes it — a bigger `.limit()` would not); `:856` and `:1126` are lower-priority consistency migrations (already safe today) rather than active gaps, included in the plan for completeness but not urgent.

### Finding 4 (P2) — migrated projections often omit their own cursor column

Verified directly — none of the 5 example call sites Codex named actually select `id` today (checked `futures_odds_snapshots`, `player_injuries`, `game_odds_snapshots`, both `nfl_rosters` reads, and the three `.limit(2000)` analytics reads' `select()` strings against the live file). Every one of them would paginate correctly on a short first page and then silently stop advancing once a page reaches full size — exactly Codex's failure mode, and exactly the kind of caller-discipline requirement ("remember to add the cursor column to your own select list") this migration is trying to eliminate elsewhere.

**Resolution — the helper owns this, not the caller or the linter.** `fetchAllRows()` appends its internally-resolved `cursorColumn` to the `select` string itself if not already present, reads it off each returned row to advance, and strips it back out of the rows it returns — so a caller's existing `select` list and result shape are completely unaffected; they never have to know or remember the cursor column exists.

```js
export async function fetchAllRows(label, { sb, table, select, filters }) {
  const cursorColumn = TABLE_UNIQUE_KEYS[table];
  if (!cursorColumn) throw new Error(`fetchAllRows(${label}): "${table}" has no declared unique key`);
  const requestedCols = select.split(',').map((s) => s.trim());
  const needsCursorInjection = !requestedCols.includes(cursorColumn);
  const effectiveSelect = needsCursorInjection ? `${select}, ${cursorColumn}` : select;
  const rows = [];
  let cursor = null;
  for (;;) {
    let query = sb.from(table).select(effectiveSelect);
    query = applyDeclarativeFilters(query, filters);
    query = query.order(cursorColumn, { ascending: true });
    if (cursor !== null) query = query.gt(cursorColumn, cursor);
    query = query.limit(POSTGREST_MAX_ROWS);
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break;
    cursor = data[data.length - 1][cursorColumn];
    if (cursor == null) throw new Error(`${label}: cursor column "${cursorColumn}" is null/missing on the last row of a full page -- cannot safely advance`);
    rows.push(...(needsCursorInjection ? data.map(({ [cursorColumn]: _drop, ...rest }) => rest) : data));
    if (data.length < POSTGREST_MAX_ROWS) break;
  }
  return rows;
}
```

This also means the ESLint rule doesn't need a special case to enforce "the cursor column must be in `select`" as Codex's alternative suggested — there's nothing left for a caller to get wrong, so nothing for the linter to check on this specific point.

### Finding 5 (P2) — inventory totals still wrong; scanner-vs-manual-count reconciled

Confirmed and reconciled. Corrected math:

- **`portfolio-dossier.js`**: 15 read sites (unchanged from v2, verified again this round).
- **`agents/signal-normalize.js`**: 5 read sites + 1 write = 6 (v2's heading already said 5 correctly; the earlier "6 total" framing conflated read+write count, not the read count itself).
- **`agents/portfolio-synthesize.js`**: **4** read sites (vault_notes reference docs, vault_notes team notes via `fetchAllKeyset`, vault_notes master reports via `fetchAllKeyset`, `nfl_trench_ratings`) + 2 writes = 6. v2's heading said "five reads" while listing four — the heading was wrong, the list was right. Corrected to 4.

**Total: 15 + 5 + 4 = 24 reads, + 1 + 2 = 3 writes = 27 operations.**

Reconciled against the scanner's own "25 sites": the scanner counts a literal `.from()` CallExpression appearing inside one of the three `SCANNED_SOURCES` files. 22 of the 24 reads have their `.from()` written directly in a scanned file; the other 2 (both `fetchAllKeyset()` calls) have their actual `.from()` inside `agents/lib/supabase-pagination.js`, which isn't itself in `SCANNED_SOURCES` — so the scanner's AST walk over the three caller files never sees those two `.from()` nodes at all. 22 directly-visible reads + 3 writes = 25, matching the scanner's count exactly. Migration disposition, corrected: **24 of 24 reads migrate — 23 to `fetchAllRows()`, 1 (`vault_notes` reference docs) to `fetchByUniqueValues()`.** (`nfl_trench_ratings` is included in the "24" as a read site that needs migrating, but per Finding 1's response, it's blocked on the surrogate-key migration rather than being one of the 23 going to `fetchAllRows()` immediately.)

## Concurrency semantics, stated precisely (per Codex's "Required v3 adjustments")

Keyset pagination on an immutable unique key protects against the specific failure offset pagination has: a row's page position never shifts because of activity elsewhere in the table, so no row is skipped or repeated due to insertions/deletions before the current cursor. It does **not** provide a transactionally consistent snapshot of the table as of scan-start — a row inserted *after* the cursor's current position, whenever the scan happens to reach that position, is picked up (or not, if inserted behind an already-passed cursor value) depending on timing relative to the scan, not relative to when the scan began. For a `bigserial` cursor this means a late-arriving row usually appears (new IDs sort after the cursor), while for a `uuid` cursor a new row's ID is unordered with respect to the cursor and may or may not appear in the current run, unpredictably. This is a materially weaker guarantee than "a consistent point-in-time read," and every caller of `fetchAllRows()` should be understood to get "every row that existed and hasn't moved, plus possibly-some-possibly-none of what changed during the scan" — not "exactly what existed at time T." None of this pipeline's current use cases (dedup-to-latest, CLV comparison, injury status aggregation) require snapshot consistency, so it's not a blocking concern for this migration, but it should be stated as a property of the helper, not left implicit.

## Revised shape count: unchanged at five

Finding 1-5's fixes are internal to the two helpers and the inventory bookkeeping; the five-shape dialect from v2 (single-row lookup, count-only, `fetchByUniqueValues`, `fetchAllRows`, bounded write) is unchanged in shape, only in the helpers' internal safety.

## Revised migration sequencing

1. Verify `POSTGREST_MAX_ROWS` against this Supabase project's actual configured `max-rows` (Finding 2) — a real check, not an assumption, before it's hardcoded.
2. Land `fetchAllRows()` (with internal cursor injection/stripping and fixed `POSTGREST_MAX_ROWS`) and `fetchByUniqueValues()` (with fixed `UNIQUE_VALUES_HARD_CAP`) plus the verified `TABLE_UNIQUE_KEYS` map (18 of 19 tables confirmed this round; `nfl_trench_ratings` excluded pending its own migration) in `agents/lib/supabase-pagination.js`.
3. Separately propose and get authorization for the `nfl_trench_ratings` surrogate-key migration (Finding 1) — its own review, not bundled into this approval.
4. Migrate all 24 pipeline read call sites (23 to `fetchAllRows()`, 1 to `fetchByUniqueValues()`) across the three pipeline files, one file at a time, each re-verified against existing test coverage.
5. Migrate `agents/portfolio-preflight.js`'s 7 literal-table sites (Finding 3) the same way, fixing the live `nfl_rosters` week-discovery bug (`:831`) as part of this step rather than deferring it — it's a real correctness gap in the safety gate itself, not cosmetic.
6. Build the real ESLint rule with full `RuleTester` coverage, scoped to the three pipeline files + `agents/portfolio-preflight.js`'s 7 literal-table sites, explicitly exempting only `agents/portfolio-preflight.js:79,90`'s two dynamic-table introspection calls, and rejecting any `pageSize`/`hardCap` property on a helper call.
7. Run the new rule alongside the existing scanner for at least one full round before retiring the scanner's pattern-matching logic.

Nothing in this sequence has been started. Still a proposal for Codex to confirm or redirect.

## Standing constraints (unchanged)

No commits, cleanup, reset, stash, broad staging, or push without Andy's explicit approval; no Supabase writes or schema migrations without per-change authorization (the `nfl_trench_ratings` surrogate-key migration explicitly requires its own separate approval, not blanket coverage under this proposal); no paid committee synthesis without explicit authorization; no betting picks/official-pick promotions/portfolio mutations without explicit authorization; no Yahoo Fantasy work. This document makes no code changes.
