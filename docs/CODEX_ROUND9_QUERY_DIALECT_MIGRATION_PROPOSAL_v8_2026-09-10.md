# Query Dialect Migration Proposal v8 — Response to Codex's v7 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v7_2026-09-10.md` (v7), which Codex reviewed and returned **changes requested** (1 P2): the `signalFloorForSeason()` fix resolved the untracked-literal problem, but the proposal's own test plan omitted `vi.useFakeTimers()` coverage that `RULES.md:84` requires for hardcoded date thresholds, and didn't include a query-wiring assertion proving `fetchPickSignals()` actually passes the resolved value to `.gte()`. Codex was explicit that it would not infer approval of the underlying Aug 10 product boundary as approval to override the separate testing rule — correctly; that's not mine to infer either. Still a proposal only — no pipeline read call sites have been rewritten yet.

## Verdict on the review

Correct, and correctly scoped: this was a real gap between what the proposal's code sample does (a fail-loud, season-keyed accessor) and what its test plan promised (plain unit tests only), against a written project rule that, as literally worded, doesn't distinguish "wall-clock comparison" from "static per-season configuration." My v7 reasoning for skipping `vi.useFakeTimers()` was substantively right but procedurally wrong to apply unilaterally — amending a house rule is Andy's call, not something a proposal document gets to assume on its own author's judgment. Raised directly; Andy chose to amend the rule rather than add timer coverage to code that doesn't read the wall clock.

## Finding response

### Finding (P2) — date-threshold rule doesn't distinguish wall-clock logic from static config, and the wiring path isn't tested

**Resolution, part 1 — rule amendment (Andy authorized, 2026-09-10):** `RULES.md:84` now carries an explicit exception: the `vi.useFakeTimers()` requirement applies to *wall-clock expiry logic* (behavior that compares against the current date at run time — "is this stale," "has this window closed" — where a fake timer is how a test controls what "today" means). It does not apply to a static per-season configuration value that never reads the current date, such as `TRAINING_CAMP_START_BY_SEASON[season]`. The amendment keeps the substantive protections intact: the value still can't be a bare inline literal at its use site, still must be named and keyed by the season variable already governing the surrounding reads, and still must fail loudly on a missing entry rather than silently reusing a stale one. Full text in `RULES.md`, Code Quality section, appended directly under the original rule (not replacing it) so the override and its rationale/date are visible next to the rule it modifies.

**Resolution, part 2 — the wiring-test gap, which the rule amendment doesn't excuse.** Codex's second point stands regardless of the rule question: nothing in v7 proved `fetchPickSignals()` actually passes `signalFloorForSeason(SEASON)`'s return value into `.gte('captured_at', ...)` rather than, say, a typo'd column name or a forgotten call entirely. Test plan, to be implemented alongside the actual `fetchPickSignals()` migration (Finding 3's shape target: `research_pick_signals`, exhaustive via `fetchAllRows()`, this floor as a filter):

1. `signalFloorForSeason(2026)` returns `'2026-08-10'` — plain unit test, unchanged from v7.
2. `signalFloorForSeason(2027)` (or any season with no entry) throws — plain unit test, unchanged from v7.
3. **New:** a wiring test against `fetchPickSignals()` itself, asserting the declarative filter it builds for `fetchAllRows()` includes `{ column: 'captured_at', op: 'gte', value: signalFloorForSeason(SEASON) }` — not by re-implementing the query and comparing, but by capturing the actual `filters` argument `fetchPickSignals()` passes into `fetchAllRows()` (the dialect's own declarative-filter design already makes this straightforward: filters are plain data, so the test asserts on the literal object/array `fetchPickSignals()` constructs, no live Supabase call or mock chain needed). This is the same style of test already used for `applyDeclarativeFilters()` elsewhere in the proposal — asserting on data shape, not on a mocked builder chain.

This closes the gap Codex named specifically: proving the resolved floor value actually reaches the query, not just that the accessor itself returns the right string in isolation.

## Confirmed resolutions from v7 (unchanged this round)

- Finding 1 (v7) — explicit `id` in all six affected `.select()` strings, plus the general migration-checklist rule (any site needing its table's unique key in the reducer output must request it explicitly, never rely on `fetchAllRows()`'s internal cursor injection/stripping) — approved, no new issues.
- Finding 2 (v7) — corrected null/null and invalid/invalid tie handling, folded into the same secondary-key fallthrough as an exact-valid tie, no separate "keep first-seen" branch — approved, no new issues.
- Gate-report fix (`buildDisposition()`) and the ordering/reducer audit from v5–v6 — approved in prior rounds, unaffected by this round's finding.

## Revised shape count: unchanged at six

No shape changes this round — the finding was about test governance and query-wiring verification for an already-approved shape assignment (`research_pick_signals` → `fetchAllRows()` with the Aug 10 floor as a filter), not about the shapes themselves.

## Revised migration sequencing

Unchanged from v7's sequencing; step 7 gets a concrete addition:

7. Migrate the read call sites to their corrected target shapes: `research_pick_signals` (exhaustive, `.gte('captured_at', signalFloorForSeason(SEASON))` via the season-keyed constant, **with the wiring test above landing in the same change** — not a follow-up) and `user_picks` (exhaustive, no floor); the two `podcast_transcripts` sites stay `fetchTopRows()`; flag (not yet fix) the independent `signal-normalize.js:345-346` unordered `user_picks` read.

All other steps (1–6, 8–9) unchanged from v7.
