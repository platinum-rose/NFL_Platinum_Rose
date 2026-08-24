# Codex Review - Checkpoint 2

Date: 2026-08-21 PT / 2026-08-22 UTC
Reviewer: Codex
Scope: Independent review of Claude Checkpoint 2, `UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md` items 5-8 only.

## Verdict

Approved to proceed to Checkpoint 3.

I found no blocker in the Checkpoint 2 implementation. The current-slate default, live-odds warning collapse, splits 404 severity downgrade, and weather fetch gating/caching are supported by source inspection, focused tests, production build verification to an ignored output directory, and browser checks against a local bypass-auth dev server.

## Reviewed Files

- `src/components/dashboard/Dashboard.jsx`
- `src/lib/currentSlate.js`
- `tests/unit/currentSlate.test.js`
- `src/hooks/useSchedule.js`
- `src/components/dashboard/MatchupCard.jsx`

## Source Review

### 5. Current-Slate Default

Status: Pass.

Evidence:
- `Dashboard.jsx` now imports `getCurrentSlate(...)` and defaults `showAllGames` to `false`.
- `getCurrentSlate(...)` groups games by `(season_type, week)` and selects the earliest slate with at least one unplayed game.
- The current dashboard base set is restricted to `slateInfo.ids` unless the user clicks `All Games (321)`.
- The `pm_market` filter now passes `commence_time` into `getContractForGame(...)`, preserving the Checkpoint 1 date-matching fix.
- `currentSlate.test.js` covers empty schedules, the real 2026-08-21 preseason week 3 boundary, mixed final/unplayed slates, all-final fallback, and label generation.

### 6. Live-Odds Warning Collapse

Status: Pass.

Evidence:
- Startup live odds remain intentionally disabled with `Promise.resolve([])`.
- When `liveOddsData.length === 0`, the merge now counts fallback rows and emits one summary log instead of one warning per game.
- Per-game warning behavior remains for the unexpected case where live odds exist but a specific schedule game does not match.

### 7. Splits 404 Severity

Status: Pass, with a nonblocking caution.

Evidence:
- A `404` response from `GITHUB_RAW.SPLITS_URL` now returns `{}` and logs at info/log level.
- Non-404 failed responses and thrown fetch errors still warn.

Caution:
- The same section now unconditionally merges fetched splits with localStorage splits and calls `setSplits(mergedSplits)`. Local values win, and the live 404 path observed in browser yields an empty merge, so this did not break the current checkpoint. It is slightly broader than "warning severity" and should be kept visible in commit notes because this repo has an explicit boot-clobber anti-pattern around splits.

### 8. Weather Fetch Gating

Status: Pass, with known residual.

Evidence:
- `MatchupCard.jsx` now has a module-level `weatherCache` keyed by stadium coordinates plus today's date.
- `WeatherDisplay` uses `IntersectionObserver` with a 200px root margin and falls back to immediate fetch only if observer support or the DOM node is unavailable.
- Dome/retractable-roof venues resolve without calling weather fetch.

Known residual:
- The pre-existing stadium lookup still matches schedule abbreviations against full-name keys using substring logic. As Claude noted, abbreviations such as `LAC` can miss the SoFi/dome mapping and show `Open Field`. This predates the gating/cache change and remains a follow-up, not a Checkpoint 2 blocker.

## Verification

Passed:
- `npx.cmd vitest run tests/unit/currentSlate.test.js`
  - 1 file passed.
  - 7 tests passed.
- `npx.cmd vitest run tests/unit/predictionMarketStore.test.js tests/unit/preseasonBankrollTest.test.js tests/unit/secondaryMatchupVulnerability.test.js`
  - 3 files passed.
  - 24 tests passed.
- `npx.cmd eslint src/components/dashboard/Dashboard.jsx src/hooks/useSchedule.js src/components/dashboard/MatchupCard.jsx src/lib/currentSlate.js tests/unit/currentSlate.test.js`
  - 0 errors.
  - 0 warnings.
- `npx.cmd vite build --outDir dist-verify-codex-checkpoint2 --emptyOutDir`
  - Build succeeded.
  - Existing bundle-size and dynamic-import warnings only.

Build note:
- A first clean-output build attempt to `.nfl/verification/codex-checkpoint2-build` transformed all 2,762 modules, then failed on a filesystem `EPERM` while creating the output directory. Retried with the repo's ignored `dist-verify-*` pattern and the build completed.

Data shape check:
- `public/schedule.json` currently has 321 games.
- Preseason week 1-2 are final/post: 17 games.
- Preseason week 3 is the first unplayed slate: 16 games.

Browser checks:
- Test URL: `http://127.0.0.1:5175/platinum-rose-app/`
- Mode: local dev server with `VITE_BYPASS_AUTH=true`.
- Initial dashboard showed `Preseason Week 3`, `All Games (321)`, and `16 / 321 games`.
- Clicking `All Games (321)` rendered 304 matchup-card action sets, matching 321 total minus 17 completed games.
- Clicking back to `Preseason Week 3` restored `16 / 321 games`.
- Console warning/error check after dashboard load and interaction returned no warnings/errors.
- Browser console showed the intended info/log lines for splits 404 and live-odds disabled startup. In dev StrictMode they appeared twice, but the old per-game live-odds warning flood was absent.
- Visible weather/dome text resolved on current-slate cards without page errors.

Browser measurement limitation:
- The in-app browser surface did not allow direct fetch instrumentation for counting exact `open-meteo` calls. Weather request count is therefore source-verified and browser-visible-verified, but not independently network-counted in this Codex pass.

## Nonblocking Follow-Ups

- Consider changing the `All Games (321)` label or adding a visible count when completed games are hidden by the default filter. The current behavior renders 304 unplayed cards, while the button label references the full 321-game schedule.
- Fix the `MatchupCard.jsx` stadium lookup by using a canonical team-abbreviation map instead of substring matching full stadium keys.
- Decide whether the splits merge behavior should remain, be separately tested, or be reverted to the earlier "only initialize from remote when local storage is empty" pattern.

## Recommendation

Checkpoint 2 is approved. Checkpoint 3 may begin, preserving the dirty-worktree guardrails and the nonblocking follow-ups above.
