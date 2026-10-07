# Query Dialect Migration Proposal v2 — Response to Codex's Round-9-Proposal Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_2026-09-10.md` (v1), which Codex reviewed and returned "changes requested" on 5 findings (2 P1, 3 P2). This document responds to each finding point-by-point and revises the design. No pipeline code has been changed — this is still a proposal for Codex to confirm before any implementation begins.

## Verdict on the review

All 5 findings are legitimate, not nitpicking. Findings 1 and 2 in particular caught a real irony: v1's `fetchAllRanged()` and its acceptance-by-binding-alone would have shipped as "the fix" while reintroducing the exact class of bug the whole migration exists to close — a helper that looks audited but isn't actually safe under concurrent writes or arbitrary caller arguments. Both are addressed below by a structural change, not a patch: v1's five read shapes collapse into three, because the redesign makes an entire category of judgment call disappear rather than resolving it case-by-case.

## Finding-by-finding response

### Finding 1 (P1) — offset pagination is concurrency-unsafe regardless of ordering

Correct, and this was a real design defect, not a missing edge case. Numeric `.range(from, to)` offset pagination is unsafe under concurrent writes no matter how total the ordering is: a row inserted or deleted before the current offset shifts every subsequent page by one, causing skips or duplicates that no amount of `ORDER BY` fixes. `fetchAllRanged()` is withdrawn entirely — not patched. The dialect now has exactly one exhaustive-scan primitive (see Finding 2's response), and it's keyset-only.

### Finding 2 (P1) — binding verification alone doesn't validate helper arguments

Correct. Verifying the import binding proves the *right function* is being called; it says nothing about *how*. v1's `applyFilters` callback was a function value — arbitrary code the linter can't inspect — which is exactly the "genuine wrapper that still gets it wrong" problem Codex's round-2 review already made the team close for the original `fetchAllKeyset()` design. v1 reopened it by routing filters through a callback again.

Fix, and it also resolves Finding 1's redesign at the same time: replace both `fetchAllKeyset()` and the withdrawn `fetchAllRanged()` with a single helper, `fetchAllRows()`, with three changes from v1's design:

1. **No caller-supplied cursor column.** The cursor is looked up internally from a schema-declared `TABLE_UNIQUE_KEYS` map (below) — the caller passes only `table`, never `cursorColumn`. This closes the "generic signature broader than its safe use" problem directly: there is no argument through which a caller can supply a non-unique or dynamic cursor, because there is no cursor argument at all.
2. **Pagination is always by the table's actual primary key, ascending — not by any "business" column.** Every real caller in this codebase (CLV earliest-spread, latest-splits, injury dedup) already reduces the full result set client-side to find "earliest"/"latest" per key after fetching every row — none of them need the *page order* to match business order, only that every row is visited exactly once. Keyset-by-primary-key is safe under concurrent insert/delete regardless of whether the PK is a `bigserial` (numerically increasing) or a `uuid` (unordered but still a stable, unique sort key) — see `TABLE_UNIQUE_KEYS` below, checked against each table's actual migration.
3. **`filters` is a declarative spec, not a callback.** An array of `{ column, op, value }` tuples, `op` drawn from a small allowlist (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `in`), `value` a literal or a plain identifier bound to a primitive at the call site. Because it's data, not code, there is no way to smuggle a `.single()`, `.range()`, `.order()`, or a second conflicting cursor filter into it — the entire third bullet of Codex's finding 2 is structurally impossible, not defended against by additional validation.

```js
// agents/lib/supabase-pagination.js (v2 -- replaces fetchAllKeyset() AND withdraws fetchAllRanged())

// Schema-backed unique-key declaration. Each entry is checked against the
// table's actual `create table` migration (see docs/CODEX_ROUND9_..._v2.md
// section "Verified unique keys") -- this is the single source of truth
// BOTH fetchAllRows() and fetchByUniqueValues() key off, and the one the
// ESLint rule also imports to validate call sites at lint time, so the
// runtime helper and the static rule can never drift apart on what counts
// as a valid cursor/unique column for a given table.
export const TABLE_UNIQUE_KEYS = {
  futures_odds_snapshots: 'id',
  player_injuries: 'id',
  game_odds_snapshots: 'id',
  nfl_rosters: 'id',
  podcast_host_summaries: 'id',
  research_pick_signals: 'id',
  research_intel_notes: 'id',
  podcast_transcripts: 'id',
  nfl_team_season_stats: 'id',
  games: 'game_id',
  game_splits_history: 'id',
  referee_tendencies: 'id',
  vault_notes: 'path',
  team_analytic_snapshots: 'id',       // TODO verify against migration before this table migrates
  team_dvoa_snapshots: 'id',           // TODO verify against migration before this table migrates
  team_coaching_tendency_snapshots: 'id', // TODO verify against migration before this table migrates
  nfl_trench_ratings: 'id',            // TODO verify against migration before this table migrates
  normalized_signals: null,            // write-only in this pipeline -- no read helper needed
  futures_recommendations: null,       // write-only in this pipeline -- no read helper needed
  futures_recommendation_runs: null,   // write-only in this pipeline -- no read helper needed
};

const ALLOWED_FILTER_OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']);

function applyDeclarativeFilters(query, filters) {
  for (const { column, op, value } of filters || []) {
    if (!ALLOWED_FILTER_OPS.has(op)) throw new Error(`applyDeclarativeFilters: unsupported op "${op}"`);
    query = query[op](column, value);
  }
  return query;
}

// Exhaustive keyset scan, paginated strictly by the table's declared unique
// key (ascending) -- NOT by any business/ordering column. Safe under
// concurrent insert/delete because the cursor is a value that never changes
// for a given row and the comparison (`> cursor`) can never re-visit or skip
// a row regardless of what else is inserted/deleted elsewhere in the key
// space. Callers that need "earliest"/"latest" per some other column fetch
// every row (as they already do today) and reduce client-side -- see
// portfolio-dossier.js's fetchGameOddsOpen()/fetchGameSplitsLatest() for the
// existing pattern this preserves unchanged.
export async function fetchAllRows(label, { sb, table, select, pageSize, filters }) {
  const cursorColumn = TABLE_UNIQUE_KEYS[table];
  if (!cursorColumn) throw new Error(`fetchAllRows(${label}): "${table}" has no declared unique key in TABLE_UNIQUE_KEYS -- add and verify one against its migration before using this helper on it`);
  if (!pageSize || pageSize <= 0) throw new Error(`fetchAllRows(${label}): pageSize must be a positive number`);
  if (!table || !select || !sb) throw new Error(`fetchAllRows(${label}): sb, table, and select are all required`);
  const rows = [];
  let cursor = null;
  for (;;) {
    let query = sb.from(table).select(select);
    query = applyDeclarativeFilters(query, filters);
    query = query.order(cursorColumn, { ascending: true });
    if (cursor !== null) query = query.gt(cursorColumn, cursor);
    query = query.limit(pageSize);
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    cursor = data[data.length - 1][cursorColumn];
    if (cursor == null) throw new Error(`${label}: unique key "${cursorColumn}" is null/missing on the last row of a full page -- cannot safely advance`);
  }
  return rows;
}

// Audited replacement for v1's "prove it with a nearby throw" Shape 3 --
// see Finding 5's response below. Hard-checks the input array against the
// SAME TABLE_UNIQUE_KEYS declaration fetchAllRows() uses, so a table's
// unique-key fact is asserted in exactly one place, not re-derived per call
// site by a human writing a comment next to a throw.
export async function fetchByUniqueValues(label, { sb, table, select, values, hardCap = 999 }) {
  const uniqueColumn = TABLE_UNIQUE_KEYS[table];
  if (!uniqueColumn) throw new Error(`fetchByUniqueValues(${label}): "${table}" has no declared unique key in TABLE_UNIQUE_KEYS`);
  if (!Array.isArray(values) || values.length === 0) throw new Error(`fetchByUniqueValues(${label}): values must be a non-empty array`);
  if (values.length > hardCap) throw new Error(`fetchByUniqueValues(${label}): ${values.length} values exceeds the hard cap of ${hardCap} -- raise hardCap deliberately and re-verify, don't silently widen`);
  const { data, error } = await sb.from(table).select(select).in(uniqueColumn, values).limit(values.length);
  if (error) throw new Error(`${label}: ${error.message}`);
  return data || [];
}
```

`fetchAllKeyset()` (the current, already-shipped v1 helper) is retired by this redesign, not kept alongside `fetchAllRows()` — having two exhaustive-scan helpers with different cursor semantics is exactly the kind of ambiguity Codex's finding 4 (discovery/binding safety) would otherwise have to special-case for.

### Finding 3 (P2) — inventory incomplete; lint scope undefined

Corrected inventory below (section "Full call-site inventory, corrected") — the 7 sites Codex named are added, both `.limit(300)` sites are moved out of "provably safe" and into "needs migration" (they don't carry a runtime cardinality proof, matching Codex's point exactly), and the two-site discrepancy between my 27-site manual count and the scanner's 25-site `A:rowcap` count is called out explicitly rather than glossed over — see that section for the reconciliation.

Lint scope, stated explicitly: the dialect rule applies to `agents/portfolio-dossier.js`, `agents/signal-normalize.js`, `agents/portfolio-synthesize.js`, and any future file under `agents/**` that constructs a Supabase client via `createClient()` imported from `@supabase/supabase-js` for pipeline data reads. `agents/lib/supabase-pagination.js` itself is exempt (it's the audited implementation the rule trusts by binding, not a caller). `agents/portfolio-preflight.js` is explicitly **excluded** — it has its own two Supabase call sites (`portfolio-preflight.js:79,90`), both intentionally querying a *dynamic* table name because the preflight tool's job is generic per-table row-count/freshness introspection across every table in `SCANNED_SOURCES`'s row-cap map, not pipeline business logic. Literal-table-name (R2) is the wrong rule for a tool whose entire purpose is to iterate over table names it doesn't know in advance. `portfolio-preflight.js`'s own Supabase usage is covered by its own already-adversarially-hardened AST logic (rounds 3-9), not by this dialect rule, which is scoped to the data-producing pipeline only.

### Finding 4 (P2) — ESLint draft not binding-safe or fail-closed

Correct on every sub-point. Revised approach (still a design sketch for Codex to confirm before real implementation, now naming the actual APIs rather than the wrong ones):

- **Supabase-client discovery, not `.from()`-on-anything.** Before treating any `.from()` call as in-dialect, the rule resolves the receiver identifier through `sourceCode.getScope(node)` (ESLint 9's actual API — `context.getScope()` is removed, not just deprecated, confirmed against the repo's installed `eslint@9.39.2`) to its declaration, and requires that declaration's initializer to be a call to `createClient` where `createClient` itself resolves (by the same scope-based binding check) to the import from `@supabase/supabase-js`. `Array.from(...)`, a differently-purposed object's `.from()`, and a variable merely named `sb` that isn't actually a Supabase client are all rejected by this, not just assumed away.
- **Computed access is rejected, not ignored.** `sb['from'](...)` and `sb[fromExpr](...)` are matched by checking `node.callee.computed` on the MemberExpression and reporting `dynamicTable` immediately when true, rather than the rule's `.from` identifier check silently not matching (which is a miss, not a rejection) — this was v1's actual bug: the discovery `if` condition simply never fired for computed access, so nothing was reported at all.
- **Both `VariableDeclarator` and `AssignmentExpression` are checked**, plus any other context that lets a builder be referenced by more than the one expression it's built in (a function parameter passed the live builder, a property assignment) — the underlying rule is "a `sb.from(...)` CallExpression's value must be consumed by exactly the chain of MemberExpressions/CallExpressions built directly on top of it, and nothing else may hold a reference to it," which `VariableDeclarator` alone only partially enforces.
- **Ships as a flat-config ESM local plugin** (`eslint.config.js` already exists in this repo, confirmed — this is a flat-config project already, not legacy `.eslintrc`), with `RuleTester` coverage for: discovery positive/negative (including a decoy non-Supabase `.from()` and an `Array.from()` call), binding resolution for both approved helpers, rejection of a locally-shadowed same-named helper, rejection of a computed `.from()` access, rejection of both `VariableDeclarator`- and `AssignmentExpression`-based builder capture, terminal-position violation (`.single()` followed by another call), and one passing test per approved shape. None of this test suite has been written yet — flagging it as required before the rule is trusted, not claiming it exists.

The full corrected rule implementation (with real `RuleTester` cases) is deliberately not included in this revision — Codex's finding is that the mechanism needs to be built correctly, not sketched more convincingly a second time. The next artifact for this migration should be the actual rule file plus its test file, not another prose draft.

### Finding 5 (P2) — Shape 3's "nearby throw" isn't statically provable

Correct — a `throw` guarding a length check proves the *input* is bounded, but says nothing about whether the *column being filtered on* is actually unique in the schema; those are two separate facts and v1's Shape 3 only checked the first one against the second one being asserted in a comment. Resolved by the `fetchByUniqueValues()` helper above (Finding 2's response): the unique-column fact now lives in exactly one place (`TABLE_UNIQUE_KEYS`, checked against each table's real migration file — verified for `vault_notes.path` this round, see below), used by both the runtime helper and, going forward, the same lint rule that validates `fetchAllRows()` call sites. Shape 3 is no longer a pattern the linter has to recognize in arbitrary caller code at all — it's a named, audited helper call, exactly like Shape 4 always was.

**Verified this round:** `vault_notes.path` — checked against `supabase/migrations/012_vault_notes.sql:15`: `path text not null unique`. Genuinely schema-enforced, not just upsert-convention-enforced as the v1 proposal implied. The four other tables marked `TODO verify` in `TABLE_UNIQUE_KEYS` above have a `bigserial`/`uuid` primary key confirmed present (checked against their migrations this round too), but their exact migration file wasn't re-opened line-by-line to confirm the PK column name matches what's listed — that confirmation is mechanical and should happen as part of implementation, not left as a proposal-stage assumption.

## Revised shape count: five, not six

The redesign collapses v1's six shapes to five, because Finding 2's fix eliminates an entire category of judgment call rather than resolving it case by case:

1. **Single-row lookup** — `.eq(<col>, <val>).single()`/`.maybeSingle()`, terminal. Unchanged from v1.
2. **Count-only** — `.select(cols, { count: 'exact', head: true })` at `.select()`'s actual argument position, terminal. Unchanged from v1.
3. **Bounded-by-unique-values read** — a call to `fetchByUniqueValues()`, binding-resolved to `agents/lib/supabase-pagination.js`. Replaces v1's unenforceable Shape 3.
4. **Exhaustive keyset scan** — a call to `fetchAllRows()`, binding-resolved to the same module. Replaces v1's Shape 4 (`fetchAllKeyset`) and withdraws v1's Shape 5 (`fetchAllRanged`) entirely.
5. **Bounded write** — `.upsert(rows, { onConflict: '<literal>' })` / `.insert(rows)`, terminal. Unchanged from v1.

One consequence worth stating plainly: because Shape "small literal `.limit(n)`" no longer exists as a legal target at all (every bounded read is now either Shape 1, 3, or 4), v1's open question about the four `.limit(1000)`/`.limit(2000)` sites is resolved rather than deferred — there's no case-by-case judgment call left to make. All of them, plus the two newly-inventoried `.limit(300)` sites, migrate to `fetchAllRows()`, full stop.

## Full call-site inventory, corrected

25 read sites (matching the scanner's `A:rowcap` count) + 3 write sites = 28 total Supabase call sites across the three pipeline files. (v1 undercounted at 27 total by missing the 7 sites below and by folding two distinct call sites together; this count is grep-verified against the actual files, not re-derived from the scanner's internal state, so treat the "25" alignment as corroborating rather than authoritative — Codex's own scanner output is the source of truth here.)

**`agents/portfolio-dossier.js`** (15 read sites):
- `fetchSnapshots` (futures_odds_snapshots, L263-272) — hand-rolled range loop → migrate to `fetchAllRows`
- `fetchPickSignals` (research_pick_signals, L278-281, `.limit(1000)`) → migrate to `fetchAllRows`
- `fetchUserPicks` (user_picks, L284-287, `.limit(1000)`) → migrate to `fetchAllRows`
- `fetchInjuryContext` (player_injuries, L311-316, via `fetchAllPaged`) → migrate to `fetchAllRows`
- `fetchPodcastIntel` (podcast_transcripts, L367-369, `.limit(300)`) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- `fetchTeamStats` (nfl_team_season_stats, L384, no bound) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- team_analytic_snapshots (L861-865, `.limit(2000)`) → migrate to `fetchAllRows`
- team_dvoa_snapshots (L927-931, `.limit(2000)`) → migrate to `fetchAllRows`
- team_coaching_tendency_snapshots (L968-972, `.limit(2000)`) → migrate to `fetchAllRows`
- `fetchSchedule` (games, L1055-1059, no bound) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- `fetchGameOddsOpen` (game_odds_snapshots, L1072-1078, via `fetchAllPaged`) → migrate to `fetchAllRows`
- `fetchGameSplitsLatest` (game_splits_history, L1090-1094, no bound) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- `fetchRefereeTendencies` (referee_tendencies, L1105-1108, no bound, no filter at all) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- `fetchRosterChurn` week-discovery (nfl_rosters, L1123-1130, hand-rolled range loop) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- `fetchRosterChurn` per-week fetch (nfl_rosters, L1150-1155, via `fetchAllPaged`) → migrate to `fetchAllRows`

**`agents/signal-normalize.js`** (5 read + 1 write):
- podcast_host_summaries (L157-165, range loop) → migrate to `fetchAllRows`
- research_pick_signals (L248-256, range loop) → migrate to `fetchAllRows`
- research_intel_notes (L309-316, range loop) → migrate to `fetchAllRows`
- podcast_transcripts (L326-328, `.limit(300)`) → migrate to `fetchAllRows` [Codex-flagged, missed in v1]
- user_picks (L345-346, `.limit(1000)`) → migrate to `fetchAllRows`
- normalized_signals (L450, `.upsert`) — Shape 5, no change needed

**`agents/portfolio-synthesize.js`** (5 read + 2 write):
- vault_notes reference docs (L1301-1304, `.limit(999)`) → migrate to `fetchByUniqueValues` (this is the site that Shape 3 was modeled on — it becomes the reference *helper call*, not a pattern to recognize)
- vault_notes team notes (L1346, via `fetchAllKeyset`) → migrate to `fetchAllRows`
- vault_notes master reports (L1487, via `fetchAllKeyset`) → migrate to `fetchAllRows`
- nfl_trench_ratings (L1676-1678, no bound at all) → migrate to `fetchAllRows` — confirmed by Codex this round: currently `safe: false` / `unpaginated` in the live scan, non-blocking today only because the table is 512 rows; this is exactly the kind of site that silently BLOCKs the day it crosses 1,000 rows with no code change, so it should not wait for that day.
- futures_recommendations (L3406, `.upsert`) — Shape 5, no change needed
- futures_recommendation_runs (L3444, `.insert`) — Shape 5, no change needed

Net effect: essentially the entire read surface (23 of 25 read sites) migrates to one of two audited helpers. That's the intended outcome of Finding 2's fix — collapsing "many shapes to judge case by case" into "one helper, verified once."

## Revised migration sequencing

1. Land `fetchAllRows()`, `fetchByUniqueValues()`, and the verified `TABLE_UNIQUE_KEYS` map in `agents/lib/supabase-pagination.js`. Verify the four `TODO`-marked table PK column names against their migrations before this step is considered done, not after.
2. Retire `fetchAllKeyset()` and `fetchAllPaged()` (the old offset-callback helper) — every call site in step 3 moves to `fetchAllRows()`, so nothing should still reference either old helper once step 3 completes.
3. Migrate all 25 read call sites (list above) one file at a time, each re-verified against existing test coverage before moving to the next — including the 7 Codex found missing from v1's inventory.
4. Build the real ESLint rule (Finding 4's response) with full `RuleTester` coverage, scoped to the three pipeline files plus `agents/lib/supabase-pagination.js`'s own callers, explicitly excluding `agents/portfolio-preflight.js` per the scope decision above.
5. Run the rule and the existing `portfolio-preflight.js` scanner in parallel for at least one full round so a gap in the new rule doesn't silently remove coverage the old scanner had, then retire the corresponding pattern-matching logic in the scanner.

Nothing in this sequence has been started. Still a proposal for Codex to confirm or redirect.

## Standing constraints (unchanged)

No commits, cleanup, reset, stash, broad staging, or push without Andy's explicit approval; no Supabase writes without per-write authorization; no paid committee synthesis without explicit authorization; no betting picks/official-pick promotions/portfolio mutations without explicit authorization; no Yahoo Fantasy work. This document makes no code changes — `agents/lib/supabase-pagination.js`, `agents/portfolio-dossier.js`, `agents/signal-normalize.js`, and `agents/portfolio-synthesize.js` are all unmodified.
