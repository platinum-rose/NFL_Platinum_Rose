# Handoff: Round 9 v8 Implementation -- Phase 3b (pick signals / user picks migration + season-floor accessor)

**Date:** 2026-09-10 ~2215 UTC
**Author:** Claude
**Status:** Built and self-verified, including a live end-to-end dossier run
against real Supabase data. NOT yet Codex-reviewed.

## Scope

Continuing the betting-pipeline-only Phase 3 scope (Andy's decision after
Phase 3a). This sub-phase migrates `fetchPickSignals()` and
`fetchUserPicks()` (both in `agents/portfolio-dossier.js`) and lands the
long-flagged `TRAINING_CAMP_START_BY_SEASON`/`signalFloorForSeason()`
accessor from v7/v8 Finding 3 / the RULES.md date-threshold exception.

## What changed

### New module: `agents/lib/pick-signal-floor.js`

- `TRAINING_CAMP_START_BY_SEASON` -- static per-season config (`{2026:
  '2026-08-10'}`), per the RULES.md exception: a static config value, not
  wall-clock expiry logic, so no `vi.useFakeTimers()` needed.
- `signalFloorForSeason(season)` -- fail-loud accessor; throws for any
  season without a configured entry (including `null`/`undefined`).
- `buildPickSignalFilters(season)` -- returns the exact `filters` array
  `fetchPickSignals()` hands to `fetchTopRows()`. Exists specifically so a
  test can assert on it directly, satisfying the RULES.md exception's
  "wiring test... proving the resolved value actually reaches the query"
  requirement without needing to execute `portfolio-dossier.js`'s
  top-level script body (it has no `import.meta.url` guard, so importing
  it for a unit test would trigger the whole dossier build as a side
  effect -- extracting the wiring logic avoids that).

Tests: `tests/unit/pickSignalFloor.test.js`, 6 tests -- the accessor's
known-season/matches-the-map/fail-loud-for-unconfigured/fail-loud-for-
nullish behavior, plus the wiring assertion on `buildPickSignalFilters()`.

### `agents/portfolio-dossier.js`

- `fetchPickSignals()`: was a raw `.order('captured_at', desc).limit(1000)`
  with `error` never even checked (silently returned `[]` on a real query
  error, a latent bug). Migrated to `fetchTopRows()` (Phase 1, approved),
  which adds a deterministic secondary sort key (`id`) and the cap-drift
  check, and applies `buildPickSignalFilters(SEASON)` as a floor filter
  (`captured_at >= '2026-08-10'`) so the query is bounded by relevance to
  this season, not just by row count.
- `fetchUserPicks()`: same `fetchTopRows()` migration, no floor filter
  (no product requirement to bound this table by date).
- **Both wrapped in try/catch, explicitly preserving graceful degradation.**
  `fetchTopRows()` throws on a query error, unlike the original code. Both
  functions sit inside a large `Promise.all()` with ~17 other fetches in
  `main()` -- an uncaught throw here would fail the *entire* dossier build
  over one table's transient error, a worse failure mode than the
  original silent-`[]`-on-error behavior. Caught explicitly instead, with
  a `console.warn` (the original had no warning at all on this path).

## Verification performed

- `node --check` clean on all 3 touched/added files.
- `eslint` clean (0 errors, 0 warnings).
- `git diff --check` clean, scoped.
- `npx vitest run tests/unit/pickSignalFloor.test.js tests/unit/rowReduction.test.js tests/unit/portfolioPreflightScanner.test.js tests/unit/supabasePagination.test.js tests/unit/dossierFreshnessGate.test.js` -- 141/141 passing (6 new).
- Directly verified `fetchTopRows()` + `buildPickSignalFilters(2026)` against live Supabase: 800 pick signals returned (well under the 1000 cap, real data with real `captured_at` timestamps in September), 38 user picks returned.
- Live `node agents/portfolio-preflight.js --json`: `{block:6, warn:6, error:0, pass:22}` -- unchanged. `A:rowcap` still PASS, site count now 19 (down from 21 after Phase 3a, expected: these two calls also now live inside the already-approved `supabase-pagination.js`).
- **Live end-to-end run of `node agents/portfolio-dossier.js`**: completed successfully, `800 article signals · 38 expert picks` in the summary line -- matches the isolated verification exactly. One run hit a transient `TypeError: fetch failed` across every Supabase call in the script (a real network blip, not caused by this change) -- useful confirmation that the new try/catch degrades exactly as designed (`⚠ research_pick_signals: fetchPickSignals: TypeError: fetch failed — pick signals disabled`, dossier build continued rather than crashing). A retry completed cleanly.

## What's still not migrated within the approved scope

`fetchInjuryContext()`/`fetchGameOddsOpen()` (already on the
recognized-safe `fetchAllPaged()` pattern), preflight single-row/
count-only sites (likely already-safe shapes, need confirmation not
code change), `gatherPickSignalRows()`/`gatherHostSummaryRows()` in
`signal-normalize.js` (already fully paginated, likely no change
needed), and the bounded-write sites in `signal-normalize.js` /
`portfolio-synthesize.js` (likely no change needed -- upsert/insert is
already the approved shape). `nfl_trench_ratings` migration, the real
ESLint rule, and paid synthesis remain separately gated, unauthorized.

## Addendum: fix round for Codex's "Changes requested" verdict (2 P1 + 1 P2)

Codex reviewed the version above and returned **Changes requested** with
three findings, all independently verified against the actual v8 proposal
doc and current code before being accepted:

1. **P1 -- wrong pagination shape for `research_pick_signals`.** The v8
   proposal doc (`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md:16`)
   specifies this table's Finding-3 shape target as exhaustive via
   `fetchAllRows()`, not bounded top-N via `fetchTopRows()`. The
   pre-addendum version above used `fetchTopRows()`. Confirmed as a genuine
   spec violation (not a stylistic choice -- `fetchAllRows()` and
   `fetchTopRows()` are documented as non-interchangeable even when current
   row counts sit well under any cap). **Fixed**: `fetchPickSignals()` now
   calls `fetchAllRows()`.
2. **P1 -- `user_picks` must also be exhaustive.** Same finding, same fix,
   applied to `fetchUserPicks()`.
3. **P1 -- missing season configuration is swallowed.** The try/catch
   around each fetch previously wrapped the call to
   `buildPickSignalFilters(SEASON)` (which calls the fail-loud
   `signalFloorForSeason()`) alongside the actual network call, so an
   unconfigured season would be caught by the same `console.warn`-and-
   degrade handler as a transient network error, rather than crashing the
   build the way a config bug should. Verified directly against the
   pre-addendum code's try/catch scoping. **Fixed**: extracted exported
   `buildPickSignalRequest()` / `buildUserPicksRequest()` helpers; the call
   to `buildPickSignalRequest()` (and therefore to
   `signalFloorForSeason()`) now happens *outside* the try block, so a
   missing season entry throws uncaught and fails the build loudly, while
   only the actual `fetchAllRows()` call is caught for graceful network-
   error degradation.
4. **P2 -- the wiring test wasn't the required wiring test.** The v8
   proposal doc requires capturing the actual `filters` argument the real
   call site passes into the primitive, not re-testing an extracted helper
   in isolation. **Fixed**: added an `import.meta.url` guard around
   `portfolio-dossier.js`'s `main()` (mirroring the existing pattern in
   `portfolio-preflight.js`) so the file is safely importable by tests
   without triggering a live dossier build as a side effect; exported
   `fetchPickSignals()` / `fetchUserPicks()`; added a `vi.mock()` on
   `supabase-pagination.js`'s `fetchAllRows` in
   `tests/unit/pickSignalFloor.test.js` and three new tests that import the
   real, exported functions and assert on the mocked primitive's actual
   call arguments -- including one that mocks `pick-signal-floor.js` itself
   to throw (via `vi.doMock` + `vi.resetModules`) and asserts
   `fetchPickSignals()` rejects *before* `fetchAllRows()` is ever called,
   directly proving finding 3's fix rather than re-asserting the helper's
   own unit test.

### Verification performed on the fix round

- `node --check` clean on `agents/lib/pick-signal-floor.js`,
  `tests/unit/pickSignalFloor.test.js`, `agents/portfolio-dossier.js`.
- `eslint` clean (0 errors, 0 warnings) on the same three files.
- `git diff --check` clean, scoped to the same three files.
- `npx vitest run tests/unit/pickSignalFloor.test.js` -- 9/9 passing
  (up from 6; the 3 new call-site wiring tests all pass, including the
  mocked-throw-before-fetchAllRows test).
- `npx vitest run` across the five directly related suites
  (`dossierFreshnessGate`, `pickSignalFloor`, `portfolioPreflightScanner`,
  `rowReduction`, `supabasePagination`) -- **144/144 passing**, 0 failures.
- Full-repo `npx vitest run` (all ~97 files) was attempted but could not
  complete in this environment: the device-bridge shell used for this
  session enforces a hard per-call timeout well under the suite's real
  runtime, and a background (`nohup ... &`) attempt did not survive across
  calls (the process was gone on the next poll, log file empty) -- this
  looks like a property of the sandboxed VM this bridge runs commands in,
  not a code issue. The 144-test focused run covers every file this fix
  round touched or could plausibly affect.
- **Live Supabase / live dossier build verification could NOT be performed
  this round.** `node agents/portfolio-preflight.js --json` returned
  `TypeError: fetch failed` on every Supabase call, and a direct `curl` to
  both `api.supabase.com` and `www.google.com` from this device-bridge
  shell returned `403 blocked-by-allowlist` from the shell's own egress
  proxy -- i.e. this VM's outbound network is currently blocked at the
  proxy level, for any host, not a Supabase-specific or code-caused
  failure. (For contrast: the pre-addendum version of this handoff, above,
  *did* get a live confirmation earlier the same day -- 800 pick signals,
  38 user picks, and a full end-to-end dossier build with the expected
  summary line -- so this is a new, session-specific network restriction,
  not evidence the underlying fetch logic is broken.) **This still needs
  to be done** before Phase 3b can be considered fully closed out: rerun
  `node agents/portfolio-preflight.js --json` (expect `{block:6, warn:6,
  error:0, pass:22}`, `A:rowcap` PASS) and `node
  agents/portfolio-dossier.js` (expect the same `800 article signals · 38
  expert picks` summary line as before, now via `fetchAllRows()` instead
  of `fetchTopRows()`) once network access to Supabase is available again
  from wherever this is run.

### Status

Fix round complete and self-verified except for the live-network step
above, which is blocked by the current environment rather than by
anything in the code. Ready for Codex re-review; the live check will be
run and appended here as soon as network access allows, either later
this session or by Andy running it directly.
