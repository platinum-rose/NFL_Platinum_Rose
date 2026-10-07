# Query Dialect Migration Proposal v5 — Response to Codex's v4 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v4_2026-09-10.md` (v4), which Codex reviewed and returned "changes requested" on 6 findings (2 P1, 4 P2) plus a lower-priority note. This document responds to each, verified against the actual code and the installed Supabase client source this round. Still a proposal only for the migration itself -- no pipeline read call sites have been rewritten yet -- but Finding 1's gate-report bug is fixed and shipped this round (see below), the same way the v3->v4 round's Finding 1 was.

## Verdict on the review

Both P1s are real. Finding 1 was a genuine gap in last round's own fix -- I extracted `isSafeToRunPaidSynthesis()` and wired it into the JSON output, but left the human-readable text report and the exit-code decision each computing their own copy of the same condition straight off `blocks.length`, so a hypothetical run with zero BLOCKs and one or more ERRORs would have printed "SAFE TO RUN PAID SYNTHESIS" to a human even though the JSON field for that same run correctly said `false`. Finding 2 is the more consequential one: it's a real, previously-unidentified gap in the *migration design itself*, not just in a specific call site -- several exhaustive-read consumers depend on **row delivery order**, not just row completeness, and `fetchAllRows()`'s keyset pagination (primary-key ascending) does not preserve the business ordering (`snapshot_at desc`, `captured_at desc/asc`, `week desc`) those consumers currently rely on via first-seen/last-seen-wins deduplication. Migrating them naively would silently return the wrong row per key.

## Finding-by-finding response

### Finding 1 (P1) -- the gate-report fix was incomplete: human report + exit code still used the un-fixed condition

Verified directly: `agents/portfolio-preflight.js`'s `main()` (formerly lines ~1476-1485) printed `SAFE TO RUN PAID SYNTHESIS` based on `if (blocks.length) {...} else {...}` alone, and `if (!WARN_ONLY && blocks.length > 0) process.exit(1);` gated the exit code the same way -- both ignoring `errs`. The JSON field, already fixed last round, was the only one of the three surfaces actually using `isSafeToRunPaidSynthesis()`.

**Fixed this round** (Andy authorized this directly, same low-risk pattern as the prior fix): extracted a second function, `buildDisposition(blocks, errs)`, that computes the verdict once and returns both the boolean and the exact headline text (`'SAFE TO RUN PAID SYNTHESIS -- ...'` or `'DO NOT RUN PAID SYNTHESIS.'`). `main()` now calls it once and uses the same `{ safe, headline }` for the JSON field, the printed headline, and the exit-code condition (`if (!WARN_ONLY && !safe) process.exit(1);`) -- one source of truth instead of three independent copies. The human report's error branch also now explicitly lists any `ERROR`-status checks alongside `BLOCK`s (previously errors were invisible in the text report entirely, only present in the raw per-lane detail lines above the summary), so a human reading the CLI output can see *why* a run with zero BLOCKs is still unsafe.

Per the review's specific ask -- the 4 existing tests exercised only the pure boolean and wouldn't have caught the CLI/JSON contradiction -- 4 new tests were added against `buildDisposition()` directly, asserting on the actual returned headline text (not just the boolean), including the exact scenario the review caught (0 blocks, 1+ errors -> `'DO NOT RUN PAID SYNTHESIS.'`, not the SAFE headline). Combined with a live end-to-end run (below), this verifies all three surfaces agree without needing to fabricate a real thrown check.

Verified: `node --check` clean, `eslint` clean, `git diff --check` clean, scoped suite 61/61 (was 57/57 -- 4 new tests). Live run at current HEAD: `node agents/portfolio-preflight.js --json` reports `{block:6, warn:5, error:0, pass:23}` / `safe_to_run_paid_synthesis: false`; `node agents/portfolio-preflight.js` (human mode) prints the matching `DO NOT RUN PAID SYNTHESIS.` headline and the 6 blocking issues; and the process's actual exit code (captured directly, not through a pipe that would swallow it) is `1` -- confirming the JSON field, the text headline, and the exit code are now driven by the identical computed value.

### Finding 2 (P1) -- `fetchAllRows()` does not preserve result-order semantics

Confirmed, and broader than the four call sites the review named. `fetchAllRows()`'s only completeness guarantee is "every row will be visited" via primary-key-ascending keyset pagination -- it makes **no claim about delivery order** relative to any other column. Several current call sites' correctness depends on delivery order because they reduce rows with a "first/last one wins" pattern over pre-sorted input, not an explicit comparison:

| Site | Current order | Reduction | Breaks under PK-ascending pagination because |
|---|---|---|---|
| `fetchAdvancedAnalytics()`, `fetchDvoaSnapshots()`, `fetchCoachingProfiles()` (`portfolio-dossier.js`, `team_analytic_snapshots`/`team_dvoa_snapshots`/`team_coaching_tendency_snapshots`) | `.order('snapshot_at', desc)` | `latestByTeam()` (line 424) keeps the **first-seen** row per team | first-seen in PK order is an arbitrary snapshot per team, not the newest one |
| `fetchInjuryContext()` (`player_injuries`) | `.order('captured_at', desc).order('espn_player_id', desc)` | keeps **first-seen** row per player | same -- first-seen in PK order is an arbitrary report, not the latest |
| `fetchGameOddsOpen()` (`game_odds_snapshots`) | `.order('captured_at', asc).order('game_id', asc)` | keeps **first-seen** row per game (`if (!(key in earliest))`) | first-seen in PK order is arbitrary, not the earliest spread |
| `fetchGameSplitsLatest()` (`game_splits_history`) | `.order('captured_at', asc)`, **not currently paginated at all** | keeps **last-seen** row per game (`latest[key] = r` overwrites every iteration) | last-seen in PK order is arbitrary, not the latest split -- and separately, this site has its own pre-existing bug: it has no `.range()`/`.limit()` loop today, so it is already silently subject to the project's row cap on `game_splits_history` regardless of this migration |
| roster week discovery (`portfolio-preflight.js:831`, `nfl_rosters`) | `.order('week', desc).limit(1000)` | assumes the returned rows already represent distinct weeks in order | already a documented live bug (a single week is ~3,575 rows) -- the fix isn't just swapping in `fetchAllRows()`, the consumer must independently collect the **set of distinct `week` values** across all fetched rows rather than relying on order or a `.limit()` cutoff |

**Resolution:** any consumer that currently relies on first/last-wins-over-sorted-input must switch to an **explicit comparison-based reduction** keyed by the real ordering field, which makes it correct regardless of delivery order -- closing this class of bug for good rather than just for `fetchAllRows()`'s specific pagination order. Concretely:

```js
// Before (order-dependent -- silently wrong if rows don't arrive pre-sorted
// by snapshot_at desc, which fetchAllRows()'s PK-ascending pagination will
// not provide):
function latestByTeam(rows, mapRow) {
  const out = {};
  for (const r of rows || []) {
    const nick = normalizeTeam(r.team);
    if (!nick || out[nick]) continue;
    out[nick] = mapRow(r);
  }
  return out;
}

// After (order-independent -- correct no matter what order `rows` arrives
// in, because it compares the actual ordering field instead of trusting
// input order):
function latestByTeam(rows, mapRow, tsField = 'snapshot_at') {
  const out = {};
  const bestTs = {};
  for (const r of rows || []) {
    const nick = normalizeTeam(r.team);
    if (!nick) continue;
    const ts = r[tsField];
    if (out[nick] && !(ts > bestTs[nick])) continue; // keep existing unless this row is strictly newer
    out[nick] = mapRow(r);
    bestTs[nick] = ts;
  }
  return out;
}
```

The same pattern applies to `fetchInjuryContext()` (compare `captured_at`, tiebreak `espn_player_id`, keep the max instead of first-seen), `fetchGameOddsOpen()` (compare `captured_at`, keep the min instead of first-seen), and `fetchGameSplitsLatest()` (compare `captured_at`, keep the max instead of last-seen) -- each gets the same three-line change: track the best-seen value per key alongside the row, and only overwrite when the new row is strictly better by that field, rather than trusting that the read already arrives in the right order. `fetchGameSplitsLatest()` additionally needs to move from its current unpaginated single `.select()` to real pagination (`fetchAllRows()`) as part of this same change, closing its own pre-existing, independent truncation risk on a 100k+-row table.

**Newly identified while auditing this (not previously flagged):** `portfolio-dossier.js:278-286`'s `fetchPickSignals()`/`fetchUserPicks()` (`research_pick_signals`/`user_picks`, `.order(..., desc).limit(1000)`) are the same "most recent N" pattern Finding 2 of the v3->v4 round already found for `podcast_transcripts` -- deliberate recency-bounded reads, not incomplete attempts at exhaustive ones. These retarget to `fetchTopRows()`, not `fetchAllRows()`, same as the two `podcast_transcripts` sites. Separately, `signal-normalize.js:345-346`'s `user_picks` read (`.select(...).eq('source','EXPERT').limit(1000)`) has **no `.order()` at all** before its `.limit()` -- this is not a top-N read with a missing tiebreaker, it's an arbitrary, nondeterministic slice of whichever 1000 EXPERT-sourced rows PostgREST happens to return, feeding expert-pick signal extraction. This is a live, independent bug in the same family as the `nfl_rosters` week-discovery bug and `fetchGameSplitsLatest()`'s missing pagination -- flagged here rather than fixed now, since it's out of this proposal's scope, but it should route to `fetchAllRows()` (exhaustive, no top-N intent signal exists for it) when the migration reaches it.

### Finding 3 (P2) -- `fetchTopRows()`'s ordering isn't deterministic and can't detect cap drift

Both verified. `podcast_transcripts.processed_at` (migration `003_podcast.sql:96`) carries no unique or even indexed-alone constraint -- only a plain `processed_at desc` index for lookup performance, not uniqueness -- so two transcripts processed in the same instant would make the exact top-300 set nondeterministic across repeated runs.

**Resolution:**
1. `fetchTopRows()` now always appends the table's `TABLE_UNIQUE_KEYS[table]` column as a secondary ascending sort key after the caller's primary `orderBy`, rather than accepting a caller-supplied tiebreaker -- sourced from the same verified map `fetchAllRows()`/`fetchByUniqueValues()` already use, so there's one place a table's unique column is declared, not three.
2. Cap-drift detection: after the primary fetch, if `data.length < limit`, run one `{ count: 'exact', head: true }` query with the same filters (no order/limit) to get `totalMatchingRows`. If `totalMatchingRows > data.length`, the server silently returned fewer rows than the true matching count despite the caller asking for more -- that's configuration drift in the project's row cap, not "there just wasn't enough data" -- and the helper throws rather than silently under-delivering. This costs one extra request, but only in the (currently two, expandable) `fetchTopRows()` call sites, and only when a short page is actually returned.

### Finding 4 (P2) -- the podcast-episode lookup's unbounded `.in()` list is an unbounded-request problem, not a bounded-response one

Confirmed against the real client's `.in()` implementation -- it deduplicates, quotes PostgREST reserved characters, and formats the whole set into the URL's query string, so a `transcriptIds` array that grows with the podcast corpus makes the *request* unbounded even though the *response* was already the thing v3->v4 fixed.

**Resolution:** taking the simpler of Codex's two suggested options rather than building new chunking machinery. `agents/portfolio-preflight.js:941`'s `podcast_episodes` lookup (fetching titles for a diagnostic transcript-fidelity ratio) drops the `.in('id', transcriptIds)` filter entirely and instead calls `fetchAllRows()` on `podcast_episodes` with no filter -- exhaustively reading the whole table, which is already what happens on every other exhaustive-read site -- then filters locally with a `Set` built from `transcriptIds`. This avoids the unbounded-IN problem completely rather than bounding it, and needs no new dialect machinery: it's an ordinary, already-designed `fetchAllRows()` call with a JS-side filter afterward.

### Finding 5 (P2) -- the generic `negate` flag is broader than what `.not()` actually implements safely

Confirmed by reading the installed client source directly (`node_modules/@supabase/postgrest-js/src/PostgrestFilterBuilder.ts`). `.not(column, operator, value)` is documented in its own source comment as taking `operator` and `value` "as-is" per raw PostgREST syntax that "you also need to make sure they are properly sanitized" -- and, concretely, `.in()`/`.notIn()` do work `.not()` does not: deduplicating the value array, quoting PostgREST-reserved characters per value, and wrapping the whole set in `in.(...)` syntax. A generic `query.not(column, op, value)` for `op = 'in'` would instead stringify the raw array (`String(array)` -- comma-joined with no quoting or parens) and silently produce a malformed or wrong filter, not an error. `negate` was designed against exactly one real production usage (`.not('path', 'like', 'NFL/Teams/%-%')`) but exposed as if it generalized safely to every allowed op -- it doesn't.

**Resolution:** drop the generic `negate` flag entirely. Add one dedicated, narrowly-scoped operator instead -- `notLike` -- implemented as its own function calling `.not(column, 'like', value)` directly (the one case that genuinely is safe to pass through raw, since `like` patterns are plain strings with no array-quoting or dedup concerns). The declarative filter allowlist becomes `eq, neq, gt, gte, lt, lte, like, notLike, in` -- no generic negation of arbitrary operators, closing the class of bug Finding 5 identified rather than special-casing around it.

### Finding 6 (P2) -- the structural-plus-annotation exemption is still broader than "exactly two sites"

Confirmed as a real gap: requiring a bare-identifier `.from()` argument plus an adjacent `// dialect-exempt: <reason>` comment stops accidental reuse, but nothing stops the comment from being copied onto a *new* dynamic-table call written inside a different function entirely -- the rule as scoped in v4 would accept it.

**Resolution:** the exemption's structural check is tightened to also require the **enclosing function's name to resolve, via scope analysis, specifically to `rowCount` or `newestTs`** (the two helper functions that actually contain the only two dynamic `.from()` sites, `agents/portfolio-preflight.js:79` and `:90`) -- not "any function with the right comment and shape." `RuleTester` coverage for this round adds a required negative case: an annotated dynamic `.from(tableVar)` call written inside a newly-invented third function must still be rejected, proving the annotation alone (even with the correct structural shape) can't grant a pass outside those two named, audited helpers.

### Lower-priority -- `nextCursor <= cursor` compares with JS ordering, not PostgreSQL collation

Confirmed as a real, if narrow, correctness gap: `vault_notes.path` is a `text` cursor, and JavaScript's `<=` on strings compares UTF-16 code units, which is not guaranteed to agree with PostgreSQL's collation-based text ordering -- a cursor pair could look "stuck or reversed" by one ordering and "fine" by the other. **Resolution:** since empty-page termination (the v3->v4 fix) already handles "no more rows," the stuck-cursor check no longer needs to reproduce database ordering at all -- it only needs to detect that the cursor genuinely failed to advance. Replaced `nextCursor <= cursor` with `nextCursor === cursor`: exact-value repetition is collation-agnostic and unambiguous for any column type (numeric, uuid, or text), and is exactly the failure mode the check exists to catch (a bug producing the identical cursor value forever), without asserting anything about ordering direction.

## Confirmed resolutions from v4 (unchanged this round)

- `nfl_trench_ratings` additive-surrogate-key approach, confirmed correct.
- 24-read/3-write inventory, confirmed reconciled.
- Narrowed preflight exemption direction, confirmed correct (only its enforcement needed tightening -- done in Finding 6 above).
- `vault_notes.path` schema-enforced uniqueness and the trench schema, confirmed matching the proposal.

## Revised shape count: still six, one operator narrowed

1. Single-row lookup -- `.single()`/`.maybeSingle()`, terminal.
2. Count-only -- `.select(cols, { count: 'exact', head: true })`, terminal.
3. Bounded-by-fixed-small-set read -- `fetchByUniqueValues()`, scoped to genuinely small, non-growing sets (`vault_notes`).
4. Exhaustive keyset scan -- `fetchAllRows()`, empty-page-terminated, cursor-advance-asserted via exact-value repetition (not ordering comparison), filters support `notLike` (not a generic `negate`).
5. Bounded top-N read -- `fetchTopRows()`, hard-capped at `POSTGREST_MAX_ROWS`, secondary sort always the table's declared unique key, cap-drift detected via a count query on short pages.
6. Bounded write -- `.upsert()`/`.insert()`, terminal.

## Revised migration sequencing

1. Gate-report fix (this round's Finding 1) -- done, shipped, independent of the migration's own approval.
2. Land `fetchAllRows()`, `fetchByUniqueValues()`, `fetchTopRows()` (all with this round's corrections) plus `TABLE_UNIQUE_KEYS` in `agents/lib/supabase-pagination.js`.
3. Convert the order-dependent reduction functions identified in Finding 2 (`latestByTeam()` and the three inline dedup loops in `fetchInjuryContext()`/`fetchGameOddsOpen()`/`fetchGameSplitsLatest()`) to explicit comparison-based reductions **before** their read call sites are migrated -- this is now a hard precondition per site, not a detail to handle during the rewrite.
4. Separately propose and get authorization for the `nfl_trench_ratings` surrogate-key migration.
5. Migrate the read call sites to their corrected target shapes, including the two newly-identified `fetchTopRows()` candidates (`research_pick_signals`, `user_picks` in `portfolio-dossier.js`) and flagging (not yet fixing) the independent `signal-normalize.js:345-346` unordered-limit bug for a later, separately-scoped fix.
6. Build the real ESLint rule with full `RuleTester` coverage, including Finding 6's negative case (annotated dynamic call outside the two named helpers is still rejected).
7. Enable the rule only after step 4's migration lands and is verified live, and after step 3's reduction-function conversions are merged and tested (an exhaustive-but-wrong-order read passing the dialect check would otherwise look identical to a correct one from the rule's perspective).
