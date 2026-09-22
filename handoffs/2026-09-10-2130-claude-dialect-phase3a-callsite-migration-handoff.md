# Handoff: Round 9 v8 Implementation -- Phase 3a (first call-site migrations)

**Date:** 2026-09-10 ~2130 UTC
**Author:** Claude
**Status:** Built and self-verified, including a live end-to-end dossier run.
NOT yet Codex-reviewed.

## Scope decision

Phase 2 (reducer preconditions) is approved. v8 step 5 is "migrate the ~24
pipeline + 7 preflight read call sites to the approved dialect shapes" --
a large surface. Before starting, Andy was asked how to scope it: a full
repo scan showed `sb.from()` call sites well beyond the betting pipeline,
including fantasy/Yahoo ingest scripts (`fantasy-honey-badgers-build.js`,
`yahoo-adp-ingest.js`, `yahoo-season-ingest.js`, etc.) -- a separate system
explicitly off-limits per the standing "no Yahoo Fantasy work" rule.
**Andy chose: betting pipeline only** (`portfolio-dossier.js`,
`portfolio-preflight.js`, `signal-normalize.js`, `portfolio-synthesize.js`).
Every fantasy/Yahoo file is untouched by this work.

Within that scope, this round (Phase 3a) migrates only the four call
sites that were the most direct, highest-value, lowest-risk targets --
the ones Phase 2's reducer work already made safe to migrate, since they
no longer depend on query delivery order. The rest of the ~24+7 sites
(single-row lookups, count-only checks, small fixed-set reads, and sites
still using the already-recognized-safe `fetchAllPaged()` pattern) are
deliberately left for a later sub-phase.

## What changed

`agents/portfolio-dossier.js` -- four reducer-adjacent read sites migrated
from an unpaginated capped/uncapped query to `fetchAllRows()` (Phase 1,
approved):

- `fetchAdvancedAnalytics()` (`team_analytic_snapshots`) -- was
  `.limit(2000)`, which would silently truncate once this table's rows
  for a season exceed 2000.
- `fetchDvoaSnapshots()` (`team_dvoa_snapshots`) -- same `.limit(2000)` risk.
- `fetchCoachingProfiles()` (`team_coaching_tendency_snapshots`) -- same.
- `fetchGameSplitsLatest()` (`game_splits_history`) -- had **no `.limit()`
  at all**, meaning PostgREST's own silent 1000-row default was the only
  cap in effect.

All four now call `fetchAllRows(label, { sb, table, select, filters })`
with an `{ column: 'season', op: 'eq', value: SEASON }` filter, matching
each site's original `.eq('season', SEASON)`. The old `.order('snapshot_at'
| 'captured_at', ...)` clauses were removed -- they existed only to feed
the pre-Phase-2 delivery-order-dependent reduce logic, which Phase 2
already replaced with explicit comparison-based reduction
(`isBetterRow()` / `latestByTeam()`). `fetchAllRows()`'s own
PK-ascending pagination order is irrelevant to correctness now.

Each site's error/fallback handling is preserved exactly: `fetchAllRows()`
is wrapped in try/catch so a thrown error still reaches the existing
`if (error) { ...local fallback... }` branch unchanged.

## Verification performed

- `node --check` and `eslint` clean on `agents/portfolio-dossier.js`.
- `git diff --check` clean, scoped.
- `npx vitest run tests/unit/rowReduction.test.js tests/unit/portfolioPreflightScanner.test.js tests/unit/supabasePagination.test.js tests/unit/dossierFreshnessGate.test.js` -- 135/135 passing (unchanged from Phase 2 -- this migration didn't require new tests since it reuses Phase 1's already-tested `fetchAllRows()`).
- Live `node agents/portfolio-preflight.js --json`: `{block:6, warn:6, error:0, pass:22}` -- unchanged from baseline. `A:rowcap` / `call-site scan` went from "25 sites across 3 agents" to "21 sites" -- **expected, not a coverage loss**: the four migrated calls now live inside `agents/lib/supabase-pagination.js` (already Codex-reviewed and approved in Phase 1), which the scanner's 3-agent-file scope doesn't re-scan. The safety guarantee for these four sites is now `fetchAllRows()`'s own tested pagination correctness, not the scanner's structural pattern match.
- **Live end-to-end run of `node agents/portfolio-dossier.js`** (full dossier build, not just preflight): completed successfully, wrote both output files. Confirmed 32/32 team coverage for EPA analytics, DVOA, and coaching profiles (`fetchAdvancedAnalytics()` and `fetchCoachingProfiles()` actually exercised their local-fallback path this run too, since Supabase currently has zero season-2026 rows for those two tables -- confirmed both the Supabase-empty and Supabase-success paths work).
- Directly verified `fetchAllRows()` against live Supabase for `game_splits_history` (48 real season-2026 rows) -- returns all 48 correctly with `id` intact.

### Note: `game_splits_history` join produces zero matches -- pre-existing data issue, not a Phase 3 regression

The dossier's `clv_signal.n_with_splits` is 0 for every team after this
migration. Investigated directly: the 48 real rows in `game_splits_history`
for season 2026 (e.g. `game_id: "2026_01_HOU_LV"`, home `HOU` vs away `LV`)
**do not match the real 2026 schedule** in the `games` table (week 1's
actual HOU game is `HOU` (home) vs `BUF`, not `LV`; `LAC` hosts `ARI`, not
`SF`). This looks like placeholder/seed data in `game_splits_history` that
predates the finalized schedule. The join key construction
(`${season}-${week}-${normalizeTeam(home)}-${normalizeTeam(away)}`) is
identical to what it was before this migration -- `fetchAllRows()` returns
the exact same 48 rows the old unbounded query would have. **This is a
pre-existing data-quality gap, not something Phase 3 introduced or should
fix** -- flagging it here for visibility, not proposing a fix in this phase.

## What's still not migrated (deliberately deferred)

Within the approved betting-pipeline scope, still on ad-hoc/pre-dialect
patterns: `fetchInjuryContext()` and `fetchGameOddsOpen()` (both already
use the recognized-safe `fetchAllPaged()` pattern -- lower priority to
touch), the `nfl_rosters` roster-churn paginated read, the various
single-row-lookup and count-only sites in `portfolio-preflight.js`
(already-safe shapes per v8, likely need no code change at all -- just
confirmation), `research_pick_signals`/`user_picks` fetches in
`portfolio-dossier.js` and `signal-normalize.js` (the
`fetchByUniqueValues()` / `TRAINING_CAMP_START_BY_SEASON` /
`signalFloorForSeason()` targets), and the writes in
`portfolio-synthesize.js` / `signal-normalize.js` (already a "bounded
write" shape per v8, likely no change needed). These remain for a later
sub-phase.
