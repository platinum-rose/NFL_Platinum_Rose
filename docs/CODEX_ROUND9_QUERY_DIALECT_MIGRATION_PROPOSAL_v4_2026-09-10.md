# Query Dialect Migration Proposal v4 — Response to Codex's v3 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v3_2026-09-10.md` (v3), which Codex reviewed and returned "changes requested" on 4 findings (2 P1, 2 P2). This document responds to each, verified against the actual code this round. Still a proposal only — no pipeline code changed.

## Verdict on the review

Both P1s are real, and finding 1 in particular exposes something worse than a design gap: `check()` records a thrown error as `ERROR`, but `safe_to_run_paid_synthesis` only checks `blocks.length === 0` — it ignores `ERROR` entirely. That means `fetchByUniqueValues()` throwing (which it's designed to do, deliberately, when its cap is exceeded) would not stop paid synthesis from running. That's a real, currently-live bug in the gate's aggregation logic, independent of this migration, but the migration's own design (routing `podcast_episodes` through a throwing helper) would have been the first thing to actually trigger it in practice.

## Finding-by-finding response

### Finding 1 (P1) — `fetchByUniqueValues()` is the wrong shape for a growing corpus, and thrown errors don't gate synthesis

Verified both halves directly.

**Wrong shape:** `podcast_episodes` grows with every new episode ingested — it's not a fixed, small, application-bounded set like `vault_notes`' six reference documents. `fetchByUniqueValues()`'s whole safety property depends on the caller's value set staying small and known in advance; using it here just moves the truncation risk from "silent" (today's unbounded `.in()` read) to "loud" (a thrown error once the corpus crosses 999) without actually fixing the underlying need, which is to see every matching episode regardless of how many there are.

**Resolution:** migrate `agents/portfolio-preflight.js:906` to `fetchAllRows()` instead, using the declarative filter spec's `in` operator (`{ column: 'id', op: 'in', value: transcriptIds }`) rather than `fetchByUniqueValues()`. `fetchAllRows()`'s keyset pagination composes correctly with an `.in()` filter — PostgREST applies filters and pagination together, so this paginates through every matching episode no matter how large `transcriptIds` grows, with no fixed cap at all. `fetchByUniqueValues()`'s use is now stated explicitly as scoped to genuinely fixed, small, non-growing sets only (the `vault_notes` reference-doc case it was modeled on) — not a general-purpose "look up by ID list" tool.

**Verified gate bug:** `agents/portfolio-preflight.js:71-73`'s `check()` wraps every check in a `try/catch` and reports a thrown error as `ERROR`, and `agents/portfolio-preflight.js:1440`'s JSON output computes `safe_to_run_paid_synthesis: blocks.length === 0` — `errs` is computed (line 1430) but never consulted. This is a real, currently-exploitable gap independent of this migration (any existing check that throws today already has this problem), but it's flagged here because migrating `podcast_episodes` was about to give it a live, natural trigger path. **Fixed this round, separately from this proposal's approval** (Andy authorized it directly when this gap was surfaced): `isSafeToRunPaidSynthesis(blockCount, errorCount)` extracted as its own exported function in `agents/portfolio-preflight.js`, returning `blockCount === 0 && errorCount === 0`, called from the JSON-output path in place of the old `blocks.length === 0`. 4 new tests added (`tests/unit/portfolioPreflightScanner.test.js`, 53 → 57, all passing) -- including the exact case that was previously wrong: zero BLOCKs, one ERROR, now correctly reports unsafe. `node --check`, `eslint`, and `git diff --check` all clean; live preflight re-run at current HEAD unchanged (`0 errors` today, so no behavior change yet, but the gap is closed going forward). See `handoffs/2026-09-10-0700-claude-gate-error-aggregation-fix-handoff.md` for the full writeup. This fix is independent of the query-dialect migration and already shipped in the worktree (uncommitted, same as everything else this session) -- it does not need to wait on v4's approval.

### Finding 2 (P1) — migrating "newest 300" call sites to exhaustive scans changes product behavior

Correct, and this would have been a real, silent regression. Verified both call sites: `agents/portfolio-dossier.js:367-369` (`fetchPodcastIntel`) and `agents/signal-normalize.js:326-328` both deliberately request the 300 most-recently-processed rows via `.order(...).limit(300)` — that's an intentional recency-bounded sample feeding the synthesis prompt, not an incomplete attempt at reading the whole table. Silently replacing either with `fetchAllRows()` would change which evidence reaches the model and how much of it, with no product decision behind that change and no test catching it.

**Resolution — a new, sixth shape: `fetchTopRows()`.** An audited, terminal helper for exactly this pattern: "give me the top N by some order, not everything."

```js
// agents/lib/supabase-pagination.js (v4 addition)

// Bounded "top N" read -- distinct from fetchAllRows() (exhaustive) and
// fetchByUniqueValues() (small fixed set). This shape makes NO claim of
// completeness -- it exists for call sites that deliberately want only the
// most-recent/most-relevant N rows, not the whole table. The limit is
// caller-supplied but hard-capped at POSTGREST_MAX_ROWS for the same reason
// pageSize/hardCap were removed elsewhere (v2 review, Finding 2): a request
// for more than the server will ever return can't be told apart from a
// genuine small result, so this refuses that ambiguity outright.
export async function fetchTopRows(label, { sb, table, select, filters, orderBy, limit }) {
  if (!Number.isInteger(limit) || limit <= 0 || limit > POSTGREST_MAX_ROWS) {
    throw new Error(`fetchTopRows(${label}): limit must be a positive integer <= ${POSTGREST_MAX_ROWS}`);
  }
  if (!orderBy?.column) throw new Error(`fetchTopRows(${label}): orderBy.column is required`);
  let query = sb.from(table).select(select);
  query = applyDeclarativeFilters(query, filters);
  query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false }).limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data || [];
}
```

`agents/portfolio-dossier.js:369` and `agents/signal-normalize.js:327` (both `podcast_transcripts`, `.limit(300)`) move to `fetchTopRows()`, not `fetchAllRows()` — corrected from v1/v2/v3, which had both lumped in with the general `.limit(n)` reclassification without checking whether "top N" was the actual intent. Any other currently-unproven `.limit(n)` site (the three `.limit(2000)` analytics reads, `.limit(1000)` on `research_pick_signals`/`user_picks`) still needs the same intent check before assuming `fetchAllRows()` is right for it — this document does not re-verify every remaining site's intent here, but flags that the migration step itself must ask "is this actually a top-N read?" per site rather than mechanically converting every `.limit()` to an exhaustive scan.

### Finding 3 (P2) — short-page termination still depends on the project's configured max-rows

Correct in principle, and Codex's own live test (`futures_odds_snapshots`, requested 2000, received 1000 against 27,082 real rows) confirms `POSTGREST_MAX_ROWS = 1000` is accurate *today* — but "today" is doing real work in that sentence. **Resolution:** `fetchAllRows()`'s termination no longer compares the response length to `POSTGREST_MAX_ROWS` at all — it terminates only on a genuinely empty page, so it's correct regardless of what the server's actual configured cap is on any given day (one possible extra round-trip per scan, which is a cheap and worthwhile trade for a helper gating paid decisions). Added alongside it: a non-advancing-cursor assertion — if a page comes back non-empty but its last row's cursor value doesn't exceed the previous cursor, the helper throws rather than looping forever, closing the failure mode where a bug elsewhere silently produces a stuck scan instead of a visible error.

```js
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
  if (cursor !== null && nextCursor <= cursor) throw new Error(`${label}: cursor failed to advance (stuck at ${String(cursor)}) -- aborting instead of looping forever`);
  cursor = nextCursor;
  rows.push(...(needsCursorInjection ? data.map(({ [cursorColumn]: _drop, ...rest }) => rest) : data));
}
```

On `fetchByUniqueValues()`: verified this is already closed by construction, not in need of new machinery. Since the unique column can match at most one row per requested value, the maximum possible response size is `values.length`, which `UNIQUE_VALUES_HARD_CAP` (999) already keeps below `POSTGREST_MAX_ROWS` (1000) — so as long as that relationship holds (verified once, operationally, against the real project config — which Codex's own test in this round satisfies), the response can never be silently capped. No response-shape heuristic can detect truncation after the fact (a full response of exactly `values.length` rows is indistinguishable from "found a match for every value" vs. "got truncated at exactly that count by coincidence"), so the fix is keeping the cap-below-server-limit invariant true, not adding a runtime check that can't actually tell the difference.

### Finding 4 (P2) — the filter vocabulary can't express an existing production query

Verified: `agents/portfolio-synthesize.js:1353` combines `.like('path', 'NFL/Teams/%')` with `.not('path', 'like', 'NFL/Teams/%-%')` — a genuine "matches X but not Y" exclusion (filtering out `ABBR-Suffix.md` stat-import variant notes). v3's filter spec (`{ column, op, value }`, `op` from a fixed allowlist) has no way to express a negated predicate.

**Resolution:** add an optional `negate` flag to the filter tuple, applying Supabase's own generic `.not(column, operator, value)` wrapper around any allowed operator rather than inventing separate negated op names:

```js
function applyDeclarativeFilters(query, filters) {
  for (const { column, op, value, negate } of filters || []) {
    if (!ALLOWED_FILTER_OPS.has(op)) throw new Error(`applyDeclarativeFilters: unsupported op "${op}"`);
    query = negate ? query.not(column, op, value) : query[op](column, value);
  }
  return query;
}
```

Still pure data — `{ column: 'path', op: 'like', value: 'NFL/Teams/%-%', negate: true }` — so the "no arbitrary code in filters" property from the v2 review (Finding 2) is unaffected; this is one more allowed data shape, not a reopened code path.

### Finding 5 (P2) — the `portfolio-preflight.js` exemption must be structural, not line-number-based

Correct — a line-number exemption breaks the moment the file is edited, and says nothing about *why* a given call is exempt to anyone reading the rule later. **Resolution:** the exemption requires two conditions to hold together, not one:

1. **Structural:** the `.from()` call's argument is a bare `Identifier` (a variable), not a string literal, not a computed non-identifier expression — i.e., it already fails every other shape's literal-table-name requirement (R2) on its own structural merits.
2. **Explicit and adjacent:** the call is immediately preceded by a `// dialect-exempt: <reason>` comment, checked via `sourceCode.getCommentsBefore(node)` — not a file-level or function-level suppression, a comment on the specific call.

Both conditions are required together: a dynamic-table call without the comment is still rejected (so nobody can quietly reuse the exemption by copying the shape), and a literal-table call WITH the comment is still rejected (so the annotation can't be used to bypass the dialect on an otherwise-ordinary business-logic read — it only ever suppresses the specific, narrow "dynamic table name" rejection, nothing else). `RuleTester` coverage required before this ships: the two real `agents/portfolio-preflight.js:79,90` sites pass; an invented new dynamic `.from(tableVar)` call elsewhere WITHOUT the comment is rejected; an invented call WITH the comment but a literal table argument is still rejected (proving the annotation doesn't grant a blanket pass).

## Design decisions (Codex-confirmed, incorporated)

- `nfl_trench_ratings`: surrogate key is additive — a new `bigserial`/`identity` column with `NOT NULL UNIQUE`, alongside the existing composite primary key, not replacing it. `TABLE_UNIQUE_KEYS['nfl_trench_ratings']` gets set to that new column's name once the migration is authorized and applied; until then this table stays on its current tracked-but-non-blocking unpaginated read.
- The dialect is not "fully enforced" (i.e., the ESLint rule isn't turned on repo-wide) until: the `nfl_trench_ratings` migration is applied and verified live, and that table's read is itself migrated. Phased enforcement, not all-or-nothing.
- 24 reads + 3 writes inventory confirmed correct as of v3 — unchanged this round, except `podcast_episodes` (`portfolio-preflight.js:906`) is retargeted from `fetchByUniqueValues()` to `fetchAllRows()` (Finding 1) and the two `podcast_transcripts` `.limit(300)` sites are retargeted from `fetchAllRows()` to `fetchTopRows()` (Finding 2) — the total site count is unchanged, only the assigned shape for 3 of the 24 reads.
- Concurrency statement confirmed accurate as written in v3 — no change.

## Revised shape count: six

1. Single-row lookup — `.single()`/`.maybeSingle()`, terminal.
2. Count-only — `.select(cols, { count: 'exact', head: true })`, terminal.
3. Bounded-by-fixed-small-set read — `fetchByUniqueValues()`, scoped explicitly to genuinely small, non-growing sets (the `vault_notes` reference-doc case) — **not** a general ID-list lookup.
4. Exhaustive keyset scan — `fetchAllRows()`, empty-page-terminated, cursor-advance-asserted, filters support `negate`.
5. **New:** bounded top-N read — `fetchTopRows()`, for deliberate "most recent/most relevant N" reads, hard-capped at `POSTGREST_MAX_ROWS`.
6. Bounded write — `.upsert()`/`.insert()`, terminal.

## Revised migration sequencing

1. Verify `POSTGREST_MAX_ROWS = 1000` against the live project (Codex's own test this round already did this — carrying it forward as confirmed, not still-open).
2. Land `fetchAllRows()` (empty-page termination, cursor-advance assertion, `negate`-capable filters), `fetchByUniqueValues()` (scope-restricted to fixed small sets), and the new `fetchTopRows()` in `agents/lib/supabase-pagination.js`, plus the verified `TABLE_UNIQUE_KEYS` map.
3. Decide and, if authorized, separately land the one-line `safe_to_run_paid_synthesis` fix (Finding 1's gate bug) — tracked independently of this migration's approval.
4. Separately propose and get authorization for the `nfl_trench_ratings` surrogate-key migration.
5. Migrate the 24 pipeline + preflight read call sites to their now-corrected target shapes (23 to `fetchAllRows()` minus the 2 retargeted this round, so 21 to `fetchAllRows()`, 2 to `fetchTopRows()`, 1 to `fetchByUniqueValues()` — plus `nfl_trench_ratings` blocked on step 4), verifying per-site intent (exhaustive vs. top-N vs. fixed-set) before assuming a shape, per Finding 2's lesson.
6. Build the real ESLint rule with full `RuleTester` coverage including the structural+annotation exemption tests (Finding 5).
7. Enable the rule only after step 4's migration lands and is verified live (per the phased-enforcement design decision above).
8. Run the new rule alongside the existing scanner for at least one full round before retiring the scanner's pattern-matching logic.

Nothing in this sequence has been started. Still a proposal for Codex to confirm or redirect.

## Standing constraints (unchanged)

No commits, cleanup, reset, stash, broad staging, or push without Andy's explicit approval; no Supabase writes or schema migrations without per-change authorization; no paid committee synthesis without explicit authorization; no betting picks/official-pick promotions/portfolio mutations without explicit authorization; no Yahoo Fantasy work. This document itself proposes no pipeline code changes. The one exception is the `safe_to_run_paid_synthesis` gate-aggregation fix (Finding 1), which Andy explicitly authorized as a standalone fix this round -- see `handoffs/2026-09-10-0700-claude-gate-error-aggregation-fix-handoff.md`.
