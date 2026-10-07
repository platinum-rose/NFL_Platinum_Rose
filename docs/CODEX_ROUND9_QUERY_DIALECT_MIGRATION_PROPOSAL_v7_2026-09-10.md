# Query Dialect Migration Proposal v7 — Response to Codex's v6 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v6_2026-09-10.md` (v6), which Codex reviewed and returned **changes requested** (2 P1, 1 P2). This document responds to each, verified directly against the live call sites and the project's own written rules. Still a proposal only — no pipeline read call sites have been rewritten yet.

## Verdict on the review

All three findings are real, and two of them are self-contradictions inside v6's own text rather than new discoveries about the code — v6 specified a reducer rule (secondary sort on `id`) without checking that the rule was actually implementable against the current `.select()` projections, and specified a null-handling branch that quietly reintroduces the exact "trust arrival order" failure mode the whole migration exists to eliminate. Both are fixed below by making the spec consistent with itself, not by inventing new mechanism. The third finding is a real house-rule violation (`RULES.md`'s ban on hardcoded date thresholds) that v6 missed entirely.

## Finding-by-finding response

### Finding 1 (P1) — the required `id` tiebreakers don't exist in the current projections, and `fetchAllRows()`'s own contract would strip them anyway

Confirmed directly against live code. None of the six `.select()` strings this round's reducers depend on include `id`:

- `fetchInjuryContext()` (`portfolio-dossier.js:312`) — `player_injuries`
- `fetchAdvancedAnalytics()` (`:862`) — `team_analytic_snapshots`
- `fetchDvoaSnapshots()` (`:928`) — `team_dvoa_snapshots`
- `fetchCoachingProfiles()` (`:969`) — `team_coaching_tendency_snapshots`
- `fetchGameOddsOpen()` (`:1073`) — `game_odds_snapshots`
- `fetchGameSplitsLatest()` (`:1091`) — `game_splits_history`

v6's Finding 2 said "use `id` descending/ascending as the secondary key" for exactly these six sites without touching their `select` lists — so as written, the comparison function would read `row.id`, get `undefined` on every row, and the tiebreaker would silently do nothing.

Separately, and correctly caught: this isn't just a missing-column oversight that migration can paper over automatically. `fetchAllRows()`'s own contract (established in v3, Finding 4) is that it injects a table's declared unique-key column into the request *only if the caller didn't already ask for it*, and **strips that column back out of the returned rows in exactly that case** — the injection is invisible to the caller specifically so callers never have to think about the cursor column. That means a caller that wants `id` in its own output for a reducer must ask for it explicitly in its own `select` string; relying on `fetchAllRows()`'s internal cursor handling would get it silently stripped, reproducing this exact bug one layer down inside the "fixed" version.

**Resolution:** two things, not one.

1. Add `id` explicitly to all six `.select()` strings above, as a normal requested column like any other — this is the only change needed; because the caller now requests `id` itself, `fetchAllRows()`'s `needsCursorInjection` check (`!requestedCols.includes(cursorColumn)`) evaluates false for all six, so no injection happens and nothing gets stripped. The existing v3 helper contract already supports this correctly — v6 just never applied it.
2. Add the general rule to the migration checklist: **any site that needs its table's unique key in the reducer's output must list that column in its own `select`, explicitly, at migration time** — not rely on `fetchAllRows()`'s internal cursor-column handling, which is designed to be invisible and will strip an unrequested column. This is now a required item in the per-site migration checklist, not just called out for these six.

Per the review's ask, equal-timestamp test cases are added to the implementation plan (Finding 2 below covers the exact comparison logic being tested) — asserting the specific row selected when two candidates share an identical `captured_at`/`snapshot_at` and differ only by `id`.

### Finding 2 (P1) — the null/null rule contradicts the declared secondary key and picks the wrong row

Confirmed, and it's a direct self-contradiction in v6's own Finding 2 text. Point 2 said: two invalid/null timestamps keep whichever row was seen first. Point 3 said: exact ties use `id`, generally descending for latest-row consumers (`latestByTeam()`, `fetchInjuryContext()`, `fetchGameSplitsLatest()`) and ascending for the one earliest-row consumer (`fetchGameOddsOpen()`). "Seen first" under `fetchAllRows()`'s PK-ascending keyset pagination means **lowest `id`** — which is the *opposite* of what the declared secondary key says a latest-row reducer should keep. A null/null tie between an old, low-`id` row and a genuinely more recent, high-`id` row (both missing a timestamp) would keep the old one for `latestByTeam()`, `fetchInjuryContext()`, and `fetchGameSplitsLatest()` — silently wrong, and specifically the class of bug this whole migration exists to close.

**Resolution:** null/null and invalid/invalid are not a special case — they're an exact tie with no timestamp information, which is precisely what the secondary key exists to resolve. Restating the full rule with the contradiction removed:

1. Parse both timestamps (Finding 2, point 1 from v6, unchanged).
2. If exactly one side is null/invalid, the valid side always wins (v6, point 2, unchanged — this half was correct).
3. If both sides are valid and unequal, the numerically better one wins (unchanged).
4. **If both sides are valid-and-equal, OR both sides are null/invalid, apply the table's declared secondary key** (`id` descending for latest-row reducers, `id` ascending for the earliest-row reducer) — the same comparison in both cases, because from the reducer's perspective "tied" and "no timestamp on either side" are the same situation: no timestamp signal to decide by, fall through to the next key. There is no separate "keep first-seen" branch anywhere in the rule.

This removes the contradiction by deleting the special case rather than adding a new one. Test matrix for implementation: valid/null, null/valid, null/null, invalid/invalid, and exact-valid-tie — each asserting the specific row `fetchAllRows()`'s PK-ascending order would *not* have picked by accident, so the test actually exercises the tiebreaker rather than passing by coincidence.

### Finding 3 (P2) — the `research_pick_signals` cutoff is a hardcoded production date threshold, which the project's own rules forbid

Confirmed against `RULES.md:84`: *"NEVER add hardcoded date thresholds to production logic without a corresponding `vi.useFakeTimers()` pattern in the test file."* v6's `.gte('captured_at', '2026-08-10')` is exactly that — a bare literal that will keep meaning "August 10, 2026" forever, silently becoming the wrong boundary the moment `SEASON` advances past 2026, with nothing forcing anyone to notice or update it.

**Resolution:** move the cutoff out of the query call site and into a small, explicit, per-season table that fails loudly rather than silently reusing a stale value:

```js
// agents/lib/supabase-pagination.js (or portfolio-dossier.js, alongside SEASON)
// Training-camp start date per season -- a real creator decision, not something
// derivable from SEASON by formula (camp start dates shift year to year). Must
// be updated every season; there is no fallback default on purpose, so a
// missing entry fails the run instead of silently reusing last year's date.
const TRAINING_CAMP_START_BY_SEASON = {
  2026: '2026-08-10',
};
function signalFloorForSeason(season) {
  const d = TRAINING_CAMP_START_BY_SEASON[season];
  if (!d) throw new Error(`No TRAINING_CAMP_START_BY_SEASON entry for season ${season} -- add one before running research_pick_signals ingestion for this season.`);
  return d;
}
```

`fetchPickSignals()` then calls `.gte('captured_at', signalFloorForSeason(SEASON))` instead of the bare literal. This satisfies the "no silent hardcoded threshold" rule two ways: the boundary is now explicitly keyed to `SEASON`, the same variable that already governs every other season-scoped read in this file, and a missing/forgotten entry throws immediately at run time (loud, at the start of a run, not silently wrong months later) rather than quietly reusing 2026's date forever. Test plan: `signalFloorForSeason(2026)` returns `'2026-08-10'`; `signalFloorForSeason(2027)` (or any season with no entry) throws — both plain unit tests against the pure function, no `vi.useFakeTimers()` needed since this isn't a comparison against the current wall-clock date, it's a static per-season configuration value the code is now forced to have an explicit answer for.

This is a code-structure fix, not a re-litigation of the underlying product decision — Andy's choice of Aug 10 as the 2026 boundary (and the reasoning: it's where the live off-season non-NFL noise ends) is unchanged; only how it's expressed in code changes, from an untracked literal to a named, season-keyed, fail-loud constant. Sport-relevance filtering at read time remains a separately tracked, not-yet-scoped gap, as v6 already noted.

## Confirmed resolutions from v6 (unchanged this round)

- Finding 1 (v6) — the "ordered-list consumption" audit category and `signal-normalize.js`'s `gatherItems()` explicit-sort fix — approved, no new findings against it this round.
- Finding 2, points 1, 3, 4 (v6) — parsed-epoch comparison, real-PK secondary keys per table, explicit `week DESC` after the roster-week-set fix — approved; only point 2 (the null/null branch, Finding 2 above) needed correcting.
- Finding 3 (v6) — the live investigation and Andy's product decision (`research_pick_signals` exhaustive + Aug 10 floor, `user_picks` exhaustive no floor) — approved as a product decision; only the *implementation* of the floor needed fixing (Finding 3 above), not the decision itself.
- Finding 4 (v6) — `game_splits_history`/`game_odds_snapshots` row-count correction — approved, unchanged.
- Gate-report fix (`buildDisposition()`) — approved in the prior round, unaffected by this round's findings.

## Revised shape count: unchanged at six

No shape changes this round — all three findings are corrections to how the exhaustive-keyset shape (`fetchAllRows()`) is applied at specific call sites (explicit `id` in `select`, corrected null-tie handling, a season-keyed filter constant instead of a literal), not changes to the shape inventory itself.

## Revised migration sequencing

Unchanged from v6's sequencing in structure; two steps get concrete corrections:

1. Gate-report fix — done, shipped.
2. Land `fetchAllRows()`, `fetchByUniqueValues()`, `fetchTopRows()` plus `TABLE_UNIQUE_KEYS` in `agents/lib/supabase-pagination.js`.
3. Convert the order-dependent sites to explicit, tie/null-specified comparison-based reductions — **now including, for each site whose reducer needs `id`: adding `id` to that site's `select` list as part of the same change** (Finding 1), and using the corrected null-tie rule that always falls through to the secondary key rather than "first-seen" (Finding 2) — `latestByTeam()`, `fetchInjuryContext()` (secondary key `id` desc), `fetchGameOddsOpen()` (secondary key `id` asc), `fetchGameSplitsLatest()` (secondary key `id` desc). Hard precondition, not a rewrite detail.
4. Convert the one ordered-list site from v6 Finding 1 (`signal-normalize.js`'s `gatherItems()` article lane) to explicit post-fetch sorting — hard precondition.
5. Fix the `nfl_rosters` week-discovery site to collect the distinct `week` set and explicitly sort it descending — hard precondition.
6. Separately propose and get authorization for the `nfl_trench_ratings` surrogate-key migration.
7. Migrate the read call sites to their corrected target shapes: `research_pick_signals` (exhaustive, `.gte('captured_at', signalFloorForSeason(SEASON))` via the new season-keyed constant — Finding 3, not the bare `'2026-08-10'` literal) and `user_picks` (exhaustive, no floor); the two `podcast_transcripts` sites stay `fetchTopRows()`; flag (not yet fix) the independent `signal-normalize.js:345-346` unordered `user_picks` read.
8. Build the real ESLint rule with full `RuleTester` coverage.
9. Enable the rule only after steps 3–5's precondition fixes are merged and verified live, and step 7's call-site migration lands.
