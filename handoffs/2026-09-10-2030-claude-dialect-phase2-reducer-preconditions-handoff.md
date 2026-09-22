# Handoff: Round 9 v8 Implementation -- Phase 2 (reducer preconditions)

**Date:** 2026-09-10 ~2030 UTC
**Author:** Claude
**Status:** Built and self-verified. NOT yet Codex-reviewed. Do not proceed
to Phase 3 (call-site migration to the dialect primitives) until Codex
signs off on this phase, per Andy's "incrementally, Codex-reviewed per
phase" instruction.

## Scope

v7/v8 identified several existing reducers as "hard preconditions" that
must be fixed *before* any read call site is migrated to `fetchAllRows()`
/ `fetchTopRows()` (approved in Phase 1), because those reducers currently
depend on row *delivery order* -- an assumption the new primitives'
PK-ascending pagination does not preserve. This phase fixes those
preconditions only. It does NOT migrate any call site to the new
primitives, does NOT touch `nfl_trench_ratings`, and does NOT touch paid
synthesis.

## What changed

### 1. New module: `agents/lib/row-reduction.js`

Extracted the finalized v7/v8 "best row per key" rule into its own module
so it's directly unit-testable (`agents/portfolio-dossier.js` is a
top-level script with no exports -- this mirrors the existing pattern of
`scripts/lib/dossier-freshness-gate.js`).

Rule (`isBetterRow(candidate, incumbent, { tsField, idField, direction })`):
1. Parse both timestamps (`Date.parse`).
2. If exactly one side is null/invalid, the valid side wins.
3. If both valid and unequal, the numerically better one wins (`direction:
   'latest'` prefers the larger value; `'earliest'` prefers the smaller).
4. If both valid-and-equal, OR both null/invalid, fall through to the
   secondary key (`idField`) -- descending for `'latest'`, ascending for
   `'earliest'`.
5. If the secondary key is itself unusable on either side (missing), the
   incumbent is kept rather than guessing.

`latestByTeam(rows, mapRow, normalizeTeamFn, { tsField, idField })` reduces
`rows` to one best row per team nickname using the rule above (default
`tsField: 'snapshot_at'`, `idField: 'id'`), then maps each survivor.

Tests: `tests/unit/rowReduction.test.js`, 15 new tests covering all four
rule branches, the no-usable-tiebreaker fallback, team-normalization
skipping, tie-breaking by id (not row order), and the empty-input case.

### 2. `agents/portfolio-dossier.js` -- six reducer sites converted

- `fetchInjuryContext()`: `select()` now includes `id`. The per-player
  dedup loop (previously first-seen-wins based on page order, tiebroken
  only by `espn_player_id` -- which is identical for every row of a given
  player and so broke nothing among same-timestamp rows for that player)
  now uses `isBetterRow()` with `tsField: 'captured_at'`, `idField: 'id'`,
  `direction: 'latest'`.
- `latestByTeam()` (local wrapper) now delegates to
  `row-reduction.js`'s `latestByTeam()`, passing `normalizeTeam`,
  `tsField: 'snapshot_at'`, `idField: 'id'`. Used unchanged by
  `fetchAdvancedAnalytics()`, `fetchDvoaSnapshots()`, `fetchCoachingProfiles()`.
- `fetchAdvancedAnalytics()`, `fetchDvoaSnapshots()`, `fetchCoachingProfiles()`:
  each `.select()` now includes `id` explicitly (previously absent --
  `snapshot_at` alone is not the table's unique key and duplicate/tied
  timestamps existed). Local-fallback-file rows (from
  `loadGeneratedProfileRows()`) do not carry an `id` -- `isBetterRow()`'s
  rule 5 (keep incumbent when the secondary key is unusable on both sides)
  makes this a safe, silent degrade for that path rather than a crash.
- `fetchGameOddsOpen()`: `select()` now includes `id`. The per-game dedup
  (previously "first row seen wins", relying on the query's
  `captured_at asc, game_id asc` global order across pages) now uses
  `isBetterRow()` with `direction: 'earliest'` -- this is the one
  earliest-row reducer per v7/v8. Note: `game_id` remains in the query's
  `.order()` purely as the pagination-determinism tiebreaker (needed for
  `.range()` across pages to be stable); it is unrelated to the per-game
  reduction's own tie rule, which now uses `id`.
- `fetchGameSplitsLatest()`: `select()` now includes `id`. The per-game
  reduce (previously an unconditional overwrite relying on `captured_at
  asc` order) now uses `isBetterRow()` with `direction: 'latest'`.

### 3. `agents/portfolio-preflight.js` -- `nfl_rosters` week-discovery diagnostic

The `A:database` / `nfl_rosters` check (~line 865) read one
`.limit(1000)` page ordered by `week desc` and computed distinct weeks
from just that page. At ~3,575 rows/week this season, a single page can
span less than one full week, undercounting real distinct weeks -- the
same failure class `fetchRosterChurn()` in `portfolio-dossier.js` was
already fixed for (2026-09-04, per the comment already in this file).
This is a diagnostic WARN only (not itself a data-consuming reducer), but
was explicitly flagged as a remaining v8 step-3 precondition. Now pages
via `.range()` until exhausted (bounded at a 20-page / 20,000-row sanity
cap) before computing the distinct-week set.

### 4. `agents/signal-normalize.js` -- `gatherItems()` `expert` lane

The `user_picks` query (`source = 'EXPERT'`, `.limit(1000)`) had **no
`.order()` clause at all** -- PostgREST returns unordered rows in this
case, so which 1000 rows survived the cap was non-deterministic run to
run once the table exceeds 1000 EXPERT rows. Added an explicit
deterministic sort by `id` (this table's real PK, per
`TABLE_UNIQUE_KEYS`) applied post-fetch to the same page.

## Verification performed

- `node --check` clean on all four touched files.
- `npx eslint agents/portfolio-dossier.js agents/portfolio-preflight.js agents/signal-normalize.js agents/lib/row-reduction.js` -- 0 errors, 0 warnings.
- `git diff --check` clean, scoped to the touched files (repo-wide has
  pre-existing, unrelated CRLF/whitespace warnings on files this phase did
  not touch).
- `npx vitest run tests/unit/rowReduction.test.js tests/unit/portfolioPreflightScanner.test.js tests/unit/supabasePagination.test.js tests/unit/dossierFreshnessGate.test.js` -- 131/131 passing (15 new).
- Live `node agents/portfolio-preflight.js --json` run: `{block:6, warn:6, error:0, pass:22}`, `safe_to_run_paid_synthesis: false` -- byte-for-byte the same summary counts as the pre-Phase-2 baseline (no regression). `A:rowcap` / `call-site scan` still PASS (25 sites, same shape). The `nfl_rosters` WARN detail is unchanged in substance (still only 1 distinct week this preseason -- expected, not a code risk) but is now computed from an exhaustive scan rather than one capped page.
- Could not run the full 95-file/1,4xx-test suite from this device-bridge shell (per-command execution cap); ran the four directly-relevant suites above. Recommend Codex's own full-suite run for complete confirmation, as with prior phases.

## What Phase 2 deliberately does NOT do

- Does not migrate `fetchInjuryContext()`, `fetchGameOddsOpen()`,
  `fetchGameSplitsLatest()`, or the three snapshot-table fetchers to
  `fetchAllRows()` / `fetchTopRows()` -- they still use their existing
  `fetchAllPaged()` / direct-query patterns. That migration is v8 step 5,
  gated on this phase's approval.
- Does not touch `nfl_trench_ratings` (still no surrogate key, still
  excluded from `TABLE_UNIQUE_KEYS`, still requires separate migration
  authorization).
- Does not implement the ESLint rule (v8 step 6).
- No Supabase writes, no paid synthesis, nothing committed/staged/pushed.

---

## Addendum: Codex Phase 2 review fixes (2026-09-10, same day)

Codex reviewed the above and returned "Changes requested" with 2 P1 + 2 P2
findings. All four verified directly against the code before fixing (no
false positives this round either):

**P1 — article-lane precondition was actually missing, not implemented.**
The `gatherItems()` `article` lane relied entirely on the live query's
`.order('captured_at', desc).order('id', desc)` for ordering, and didn't
even select `captured_at`. The v7/v8 step requires an *explicit,
post-fetch* JS sort as the actual precondition -- the live-query guarantee
disappears once this call site is migrated to `fetchAllRows()`
(PK-ascending pagination only). Fixed: added `captured_at` to the select,
and added an explicit JS sort (parsed `captured_at` desc, `id` desc,
`-Infinity` for unparseable) on the assembled array before it's consumed.

**P1 — the `expert` lane "fix" didn't fix anything.** Sorting the page
*after* `.limit(1000)` only orders whatever arbitrary subset PostgREST
already chose; it does not make *which* 1000 rows survive deterministic.
Codex also noted v7 had already flagged this as a known gap explicitly
deferred, not something to patch here. Reverted the change entirely,
left a comment documenting why a real fix needs either an `.order()`
before `.limit()` (a product decision about which rows survive, out of
scope for this phase) or the full dialect migration (v8 step 5).

**P2 — `isBetterRow()`'s tie/both-invalid fallback silently kept the
incumbent when the secondary key (`id`) was missing, re-creating a
first-seen dependency the finalized rule doesn't have.** Fixed: missing
`id` on either side at a tie now throws by default (all six DB call
sites already select `id`, so this is a genuine contract violation if it
ever happens there). Added an explicit `allowMissingSecondaryKey: true`
opt-out for the one legitimate exception -- rows from
`loadGeneratedProfileRows()` (local fallback JSON artifacts), which have
no primary key by design. `agents/portfolio-dossier.js`'s `latestByTeam()`
wrapper now takes a `{ fromLocalFallback }` flag; all 6 local-fallback
call sites pass `true`, all Supabase-sourced calls keep the strict
default. 4 new/changed tests in `rowReduction.test.js` cover the throw,
the opt-out, and that a decisive (non-tied) comparison never touches
`id` at all (so it never throws unnecessarily).

**P2 — `nfl_rosters` week-discovery pagination had a silent cap** (would
stop at 20,000 rows without any indication more data might exist) **and
didn't explicitly sort the distinct weeks.** Fixed: raised the sanity cap
to 200 pages (200,000 rows) and made hitting it while the last page was
still full a thrown error (surfaces as an `A:database` ERROR via the
existing `check()` wrapper, which is fail-loud by design and correctly
feeds `safe_to_run_paid_synthesis`) instead of silently breaking. The
distinct weeks are now explicitly sorted descending rather than relying
on `Set` insertion order.

### Re-verification after fixes

- `node --check` clean on all 5 touched/added files.
- `eslint` clean (0 errors, 0 warnings) on the same 5 files.
- `git diff --check` clean, scoped to the touched files.
- `npx vitest run tests/unit/rowReduction.test.js tests/unit/portfolioPreflightScanner.test.js tests/unit/supabasePagination.test.js tests/unit/dossierFreshnessGate.test.js` -- 135/135 passing (rowReduction grew from 15 to 19 tests).
- Live `node agents/portfolio-preflight.js --json`: `{block:6, warn:6, error:0, pass:22}`, `safe_to_run_paid_synthesis: false`, `A:rowcap` still PASS at 25 sites -- byte-for-byte the same shape as the pre-fix baseline; the new fail-loud `nfl_rosters` path did not trip (real data has far fewer than 200,000 rows this preseason).
- HEAD unchanged; nothing staged or committed.

---

## Addendum: Codex Phase 2 re-review verdict (2026-09-10)

**Phase 2 approved.** Verdict verbatim: *"No blocking findings. All four prior
issues are resolved. The `allowMissingSecondaryKey` escape hatch is
acceptable because it is explicit, defaults to strict failure, and is wired
only to known local fallback rows without database primary keys. ...
Phase 2 approved. The next separately reviewed phase may begin within the
v8 sequence. This does not authorize the `nfl_trench_ratings` migration,
paid synthesis, commits, pushes, or unrelated cleanup."*

Codex's own independent run: full suite 1,468/1,468 passing across 96
files; live preflight `{block:6, warn:6, error:0, pass:22}`,
`safe_to_run_paid_synthesis: false`; HEAD unchanged at `103d3ef`, nothing
staged.

Both hard preconditions (reducer sites, gatherItems ordering, roster
week-discovery) are now landed and approved. **Next phase (v8 step 5):
migrate the ~24 pipeline + 7 preflight read call sites to the approved
`fetchAllRows()` / `fetchByUniqueValues()` / `fetchTopRows()` shapes** —
this is the first phase that actually swaps live query code over to the
new dialect, so needs careful scoping (likely its own sub-phases) before
building. `nfl_trench_ratings` migration and the ESLint rule remain
separately gated as before.
