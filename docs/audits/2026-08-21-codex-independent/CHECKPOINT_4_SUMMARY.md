# Checkpoint 4 — Implementation Summary

Scope: `UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md` items 12-13 ("Quality Gates and
Regression Coverage") only. Checkpoints 1-3 (items 1-11) are already
Codex-approved — see `CODEX_CHECKPOINT_1_FIX_PASS_2_REVIEW.md`,
`CODEX_CHECKPOINT_2_REVIEW.md`, `CODEX_CHECKPOINT_3_REVIEW.md`.

## Baseline before work

- `git status --short --branch`: same dirty worktree left by Checkpoints
  1-3 (uncommitted, untouched by this pass) plus the files below.
- HEAD at start: `7840966`, unchanged — no commits/pushes made.
- **Sandbox note**: this session ran through the Windows device bridge
  (Claude/Cowork's `device_bash`), not Andy's native terminal. Direct
  `npx eslint`, `npm.cmd run lint`, and `npx vitest` invocations hang or
  time out unpredictably on this bridge — a known, previously-documented
  limitation (see HANDOFF.md's 2026-08-09/10 session notes: "`vitest run`
  and `npx eslint` both hang indefinitely in this bash sandbox"). Worked
  around by invoking the CLI entry scripts directly with `node`
  (`node node_modules/eslint/bin/eslint.js ...`,
  `node node_modules/vitest/dist/cli.js run ...`), scoped to
  `eslint.config.js`'s own file globs one directory at a time (each call
  capped at ~42s, retried once on a cold-cache timeout — retries
  consistently succeeded). All lint/test results below were captured this
  way, not via `npm.cmd run lint` / `npm.cmd run test` directly. Andy
  re-running those exact commands natively should reproduce the same
  0 errors / 14 warnings and 48/48 passing focused tests below; flagging
  this so a native re-check isn't treated as redundant.

## 12. Restore Lint

Baseline found (matches the audit's "7 errors" exactly): 6 errors in
`agents/**`, 1 in `scripts/**`, all `no-unused-vars`:

- `agents/betting-splits-ingest.js:160` — unused `bookId` in a destructured
  `Object.entries()` loop
- `agents/betting-splits-ingest.js:330` — unused caught `e`
- `agents/gmail-intake-agent.js:16` — unused `readFile`, `readdir` imports
- `agents/screenshot-watcher.js:16` — unused `stat` import
- `agents/twitter-bookmarks-agent.js:242` — unused caught `err`
- `scripts/official-pick-inbox-server.js:272` — unused caught `err`

All 6 fixed minimally: unused destructured/caught vars renamed to a
`_`-prefixed name (matches this repo's own `caughtErrorsIgnorePattern` /
`varsIgnorePattern` in `eslint.config.js`), genuinely-unused imports
dropped. No behavior change — verified via `grep` that none of the
removed names were referenced elsewhere in their file before removing
anything.

Re-lint of `agents/` + `scripts/` after the fix: **0 errors, 0 warnings**.

### Warnings — triaged, not fixed (per the plan: "no scope creep")

Current warning count across the full `eslint.config.js` scope (`src` +
`agents` + `scripts` + `tests` + `*.config.js`): **14**. (The original
audit baseline said 20; not reconciled against that number — some were
likely fixed incidentally by Checkpoints 1-3's own edits to `App.jsx` /
`PersistentAgentSidebar.jsx`. The plan only asks for a current triage, not
a diff against the old count, so this is noted as an observation rather
than chased down.)

| Count | File(s) | Pattern | Triage |
|---|---|---|---|
| 6 | `OutcomesDashboard.jsx`, `ExpertLeaderboard.jsx`, `FuturesPortfolio.jsx`, `Header.jsx` (×3), `AgentStatusModal.jsx` | `Icon` / `IconComp` destructured from a prop/map and never rendered on some branch | Cosmetic; looks like a leftover from an icon-mapping refactor. Touches 5 separate component files — worth a dedicated small pass, not bundled into this lint-error fix. |
| 3 | `FantasyRosterManager.jsx` | `useEffect`, `loadFromStorage`, `saveToStorage` imported, unused | This file is untracked/WIP (`git status` shows it as `??`, outside every checkpoint's scope so far) — reads as an in-progress feature, not a regression. Leave to whoever owns that feature. |
| 2 | `App.jsx` | `picksRefreshKey` (from `useModals()`), `autoGraded` (from `useAutoGrade()`) — assigned but never read directly; only their setters / sibling values are used | Could be intentional (state that exists to be *set* as a re-render trigger, even if never read here) or could be dead. Needs the author's/Andy's call on intent — a blind lint-driven removal risks silently breaking a re-render trigger something else expects. Deferred. |
| 1 | `src/lib/keeperEvaluator.js:205` | `leagueSize` parameter unused | Small, isolated, likely safe to prefix `_leagueSize` if a follow-up pass tackles this list — lowest-risk item here, still deferred per "no scope creep." |
| 1 | `tests/unit/keeperEvaluator.test.js:3` | `generateDraftStrategyInsights` imported, unused | Dead import in a test file; trivially safe but out of this checkpoint's scope. |

None of these 14 are new — all pre-date this checkpoint.

### Verification

```
node node_modules/eslint/bin/eslint.js src agents scripts tests *.config.js
```
(run per-directory in this sandbox; see Baseline note above)

Result: **0 errors, 14 warnings** total. `npm.cmd run lint` (`eslint .`,
no `--max-warnings` flag) exits 0 — warnings alone don't fail the script.

## 13. Focused Audit Smoke Tests

Required coverage per the plan, and what covers each:

1. **Bankroll popup from schedule-shaped game** — NEW test
   `tests/unit/betEntryGameOptions.test.js` (5 tests). `BetEntryModal.jsx`'s
   inline `getGameOptions()` — the exact function the Checkpoint 1 fix
   touched — was extracted verbatim into `src/lib/betEntryGameOptions.js`
   so it's directly unit-testable (this repo has no
   jsdom/`@testing-library/react`, so component-rendering tests aren't
   available yet). Covers: schedule-shaped fields resolve two real teams;
   legacy `away_team`/`home_team` fallback still works; a fully malformed
   game degrades to `"TBD @ TBD"` instead of `"undefined @ undefined"`;
   empty/missing schedule returns `[]` instead of throwing; id derivation
   when the game has no `id` field.
2. **Picks & Inbox offline state** — NEW test
   `tests/unit/officialPicksFetchTimeout.test.js` (4 tests).
   `OfficialPicksTab.jsx`'s `fetchJson()` + timeout constants were
   extracted verbatim into `src/lib/officialPicksApi.js` (this also
   sidesteps a `react-refresh/only-export-components` lint error that
   appeared when they were first exported directly from the component
   file — Fast Refresh requires a component file to export only
   components). Covers: `PROBE_TIMEOUT_MS < FAILSAFE_TIMEOUT_MS` invariant;
   successful JSON resolution; server-error rejection; abort-and-reject
   once `PROBE_TIMEOUT_MS` elapses against a hung fetch (fake timers),
   reproducing "inbox server not running." **Known gap, flagged rather
   than silently assumed covered**: this does NOT reproduce the deeper
   React-StrictMode `mountedRef` double-effect bug the Checkpoint 1 /
   Codex-review fix actually addressed (see the long comment above
   `probe()` in `OfficialPicksTab.jsx`) — that class of bug is only
   reachable via a real component render under `<StrictMode>`, which needs
   jsdom + `@testing-library/react`. Adding that dependency is a
   reasonable follow-up but wasn't done here without Andy's sign-off on a
   new devDependency.
3. **Every accepted tab id** — NEW test `tests/unit/appTabRouting.test.js`
   (20 tests). A source-level structural check rather than a render test:
   reads the real `src/App.jsx` at test time, extracts `VALID_TABS` and
   every `activeTab === '<id>' &&` render branch via regex, and asserts a
   1:1 mapping both directions (every accepted id has a branch; every
   branch corresponds to an accepted id; no duplicate ids). Directly
   guards the Checkpoint 1 stale-tab-id bug class.
4. **Prediction-market badge false positives** — already covered by the
   existing `tests/unit/predictionMarketStore.test.js` (12 tests, written
   during Checkpoint 1 / its Codex fix-pass-2). No new test needed;
   re-verified passing.
5. **Current-slate dashboard default** — already covered by the existing
   `tests/unit/currentSlate.test.js` (7 tests, written during Checkpoint
   2). No new test needed; re-verified passing.

### Command

```
npx vitest run tests/unit/betEntryGameOptions.test.js tests/unit/officialPicksFetchTimeout.test.js tests/unit/appTabRouting.test.js tests/unit/predictionMarketStore.test.js tests/unit/currentSlate.test.js
```

(Sandbox note above applies — this session ran the equivalent via
`node node_modules/vitest/dist/cli.js run ...`.)

### Result

```
✓ tests/unit/predictionMarketStore.test.js (12 tests)
✓ tests/unit/officialPicksFetchTimeout.test.js (4 tests)
✓ tests/unit/appTabRouting.test.js (20 tests)
✓ tests/unit/currentSlate.test.js (7 tests)
✓ tests/unit/betEntryGameOptions.test.js (5 tests)

Test Files  5 passed (5)
     Tests  48 passed (48)
```

No Supabase writes, no betting/pick-action/portfolio mutation, no paid
model/API calls, no Yahoo work — every change this checkpoint is either a
new pure-logic test/lib file or a mechanical, behavior-preserving
extraction (see Files Changed below).

## Files changed (all uncommitted)

- `agents/betting-splits-ingest.js` — 2 lint-error fixes (unused var /
  caught-error rename)
- `agents/gmail-intake-agent.js` — 1 lint-error fix (drop unused imports)
- `agents/screenshot-watcher.js` — 1 lint-error fix (drop unused import)
- `agents/twitter-bookmarks-agent.js` — 1 lint-error fix (unused
  caught-error rename)
- `scripts/official-pick-inbox-server.js` — 1 lint-error fix (unused
  caught-error rename)
- `src/lib/betEntryGameOptions.js` — **NEW**: `getGameOptions()` extracted
  verbatim from `BetEntryModal.jsx`
- `src/components/modals/BetEntryModal.jsx` — imports `getGameOptions`
  from the new lib file instead of defining it inline; both call sites
  updated to pass `schedule` explicitly. No behavior change.
- `src/lib/officialPicksApi.js` — **NEW**: `PROBE_TIMEOUT_MS`,
  `FAILSAFE_TIMEOUT_MS`, `fetchJson()` extracted verbatim from
  `OfficialPicksTab.jsx`
- `src/components/official-picks/OfficialPicksTab.jsx` — imports those
  from the new lib file instead of defining them inline. No behavior
  change.
- `tests/unit/betEntryGameOptions.test.js` — **NEW** (5 tests)
- `tests/unit/officialPicksFetchTimeout.test.js` — **NEW** (4 tests)
- `tests/unit/appTabRouting.test.js` — **NEW** (20 tests)

## Residual / follow-up items (not blockers)

- 14 lint warnings triaged above, none fixed (by design — "no scope
  creep").
- `OfficialPicksTab`'s StrictMode-double-effect regression class has no
  automated coverage yet; needs jsdom + `@testing-library/react` (a new
  devDependency) for real component-render test coverage, or continued
  reliance on manual browser checks in the meantime.
- The current warning count (14) doesn't match the original audit's 20 —
  observed but not investigated further, since reconciling it wasn't part
  of this checkpoint's scope.
- Entry chunk bundle size (residual from Checkpoint 3, 1,292.8 kB) is
  unrelated to this checkpoint and still outstanding.
