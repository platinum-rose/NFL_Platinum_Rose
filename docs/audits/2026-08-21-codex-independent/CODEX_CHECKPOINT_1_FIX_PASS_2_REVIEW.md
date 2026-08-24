# Codex Re-Review - Checkpoint 1 Fix Pass 2

Date: 2026-08-21
Reviewer: Codex
Scope: Re-review Claude S336 fixes for the three P1 blockers from Codex's Checkpoint 1 review.

## Verdict

Approved to proceed to Checkpoint 2.

I found no remaining P1 blockers in the Checkpoint 1 fix pass. The three previously blocking items now have source-level, test-level, data-level, and browser-level evidence sufficient for the next checkpoint gate.

## Reviewed Fixes

### P1 #1 - Prediction-market date/rematch matching

Status: Pass.

Evidence:
- `src/components/dashboard/Dashboard.jsx` normalizes schedule `kickoff_utc` into `commence_time` before calling `getContractForGame(...)`.
- `src/components/dashboard/MatchupCard.jsx` passes `game.commence_time` into `getContractForGame(...)`.
- `src/lib/predictionMarketStore.js` now requires both teams, head-to-head wording, and date agreement when a scheduled kickoff is supplied.
- Real snapshot reproduction over `data/prediction-markets/latest.json` and `public/schedule.json` found:
  - 1993 contracts inspected.
  - 321 scheduled games inspected.
  - 54 scheduled games matched to a prediction-market badge.
  - 0 matched games with a date conflict.
  - Known prior bad examples now return no badge for the wrong game:
    - `DEN@KC` on `2026-09-15T17:00:00.000Z`
    - `KC@SEA` on `2026-10-26T00:20:00.000Z`
    - `HOU@LAC` on `2026-11-08T18:00:00.000Z`
    - `SF@LAR` on `2026-09-11T00:35:00.000Z`

Nonblocking note:
- The connector regex documents `@` support, but `/\b@\b/` does not match bare-at titles. The current real snapshot has 0 `@` titles and 62 `vs` titles, so this is not blocking Checkpoint 2. It should be tightened opportunistically if the feed starts using `Team @ Team` titles.

### P1 #2 - Picks & Inbox StrictMode mountedRef bug

Status: Pass.

Evidence:
- `src/components/official-picks/OfficialPicksTab.jsx` now sets `mountedRef.current = true` inside the mount effect before returning the cleanup.
- Live browser route check at `?tab=official-picks`, with the local inbox server unavailable, no longer stayed on "Checking local inbox server...".
- After the offline wait, the page showed the intended "Local inbox server isn't running" state with no error-boundary text.

### P1 #3 - Analytics TDZ crash

Status: Pass.

Evidence:
- `src/components/analytics/AnalyticsDashboard.jsx` now declares `loadAnalytics` before the effect that calls it.
- Live browser route check at `?tab=analytics` rendered the analytics dashboard.
- No `loadAnalytics`, `ReferenceError`, or error-boundary console signal appeared during the route check.

## Bankroll Popup Regression Check

Status: Pass.

Evidence:
- Live browser dashboard loaded with real schedule data.
- Clicked a visible game-card `Bankroll` button.
- The `Bet Management` modal opened.
- Game dropdown had 322 options and preserved the clicked game selection: `Las Vegas Raiders @ Houston Texans`.
- No `undefined` text and no `NaN` text appeared in the modal/page state.

## Verification Commands

Passed:
- `npx.cmd vitest run tests/unit/predictionMarketStore.test.js tests/unit/bankroll.test.js tests/unit/teamIdentity.test.js`
  - 3 test files passed.
  - 38 tests passed.
- `npx.cmd eslint src/components/modals/BetEntryModal.jsx src/components/official-picks/OfficialPicksTab.jsx src/App.jsx src/lib/predictionMarketStore.js src/components/dashboard/MatchupCard.jsx src/components/dashboard/Dashboard.jsx src/components/analytics/AnalyticsDashboard.jsx tests/unit/predictionMarketStore.test.js`
  - 0 errors.
  - 2 existing warnings in `src/App.jsx`.
- `npm.cmd run build`
  - Build succeeded.
  - Existing bundle-size / dynamic-import warnings only.

Browser checks:
- In-app browser:
  - Dashboard rendered.
  - Bankroll card click opened the modal with selected game and no `undefined` / `NaN`.
  - `?tab=official-picks` rendered offline state instead of hanging on checking.
  - `?tab=analytics` rendered without the prior TDZ crash.
- Headless browser route sweep:
  - All 17 `VALID_TABS` routes were checked.
  - No route reported an error boundary or page error.
  - Dashboard was rechecked with a longer data-gate wait and rendered full content.

## Remaining Items

Not blockers for Checkpoint 2:
- BankrollDashboard top-level action buttons still have missing handlers, carried forward from the unified plan.
- `?tab=agent` daily-brief deeplink remains outside `VALID_TABS`, carried forward from the unified plan.
- `_to_delete/` remains present and was not cleaned up during this review.
- Yahoo client-secret rotation status remains unconfirmed and was not touched.

## Recommendation

Checkpoint 1 is approved. Claude may begin Checkpoint 2 under the unified repair plan.
