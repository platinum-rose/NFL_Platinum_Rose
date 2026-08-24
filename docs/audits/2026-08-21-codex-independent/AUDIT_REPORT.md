# NFL_Dashboard Independent Audit Report - Codex

Date: 2026-08-21
Auditor: Codex
Repo: `E:\dev\projects\NFL_Dashboard`
Baseline observed: `main` at `7840966` tracking `origin/main`

## Scope

This audit was run independently before reading the Claude audit. It covered:

- Project handoff and local rules review.
- Git status/log/branch reconciliation.
- Static review of the dashboard, app routing, bankroll modal, prediction-market mapping, schedule loading, and persistent sidebar.
- Local production build and lint check.
- In-app browser testing of the authenticated app shell and an offline/auth-bypassed dashboard server.
- Repo bloat classification from local filesystem evidence.
- Yahoo Fantasy rotation status from local docs/config only.

Guardrails followed: no Supabase writes, no betting mutations, no official pick promotion, no portfolio persistence, no paid model/API calls, no commits, and no cleanup actions.

## Environment Notes

- Authenticated app at `http://127.0.0.1:5173/platinum-rose-app/` displayed the sign-in wall. Chrome was not available to reuse a logged-in session.
- Offline audit server used `VITE_BYPASS_AUTH=true` and empty Supabase URL/key at `http://127.0.0.1:5174/platinum-rose-app/`.
- This means local schedule/UI behavior was testable, but authenticated Supabase-backed flows were not live-verified.
- `npm.cmd run build` passed.
- `npm.cmd run lint` failed with 7 errors and 20 warnings.

## Executive Summary

I found one P0 user-facing break, four P1 issues, and several P2 cleanup items. The most urgent bug is the Bankroll/Bet Management popup: every game preselects by id, but the modal renders labels and team options from obsolete `away_team` / `home_team` fields while the current schedule model uses `visitor` / `home`. In the browser this produced `undefined @ undefined` and blank team choices.

The second theme is scale: the dashboard renders the full 321-game local schedule on first load, creating nearly 98k visible text characters and 3,574 buttons in the browser. That magnifies every modal, warning, weather fetch, and sidebar import cost.

The third theme is stale surfaces: mobile/deep-link tabs still accept `bankroll`, `odds`, `analytics`, and `mycard`, but the app no longer renders content for those ids. Prediction-market badges also appear on game cards for non-game futures/award contracts because matching is based on team-token text alone.

## Findings

### P0 - Bankroll / Bet Management popup is broken for game-card entry

Evidence:

- Browser: clicking a dashboard card's Bankroll control opened the modal with `undefined @ undefined`.
- Browser: game select value was the selected game id, but selected label was `undefined @ undefined`.
- Browser: team select options were blank.
- Code: `src/components/modals/BetEntryModal.jsx:149-151` builds labels and teams from `game.away_team` and `game.home_team`.
- Code: current schedule objects use `visitor` and `home`, as seen in `public/schedule.json`.

Impact:

The primary bankroll capture flow is not usable from the game dashboard. Users can open the modal, but they cannot see the selected matchup or choose a valid team side.

Recommended fix:

Normalize game objects at the modal boundary. Use a helper that accepts both old and current field names:

- visitor/away abbreviation: `visitor || away_team || away`
- home abbreviation: `home || home_team`
- display names where available: `visitorName`, `homeName`

Then add a focused test that opens `BetEntryModal` with a schedule-shaped game and asserts the game label and team options.

### P1 - Dashboard renders the full 321-game schedule on first load

Evidence:

- `public/schedule.json` contains 321 games: 49 preseason and 272 regular season.
- Browser dashboard route rendered `bodyLen=97760`, `mainLen=96966`, and `buttonCount=3574`.
- Code: `src/components/dashboard/Dashboard.jsx:259` maps every sorted game to a `MatchupCard`.
- Code: no default week/window limit is applied in `Dashboard.jsx` before rendering.

Impact:

First load is heavy, noisy, and hard to scan. It also triggers per-card work and can hide real failures under volume.

Recommended fix:

Introduce a current-slate default:

- Default to the next unplayed week or selected week.
- Keep "All games" as an explicit filter.
- Render by week sections or paginate/virtualize long lists.
- Keep finished games behind a visible completed/live filter.

### P1 - Mobile/deep-link nav can produce a blank main panel

Evidence:

- Browser route checks showed `?tab=bankroll`, `?tab=odds`, `?tab=analytics`, and `?tab=mycard` render shell/sidebar only with `mainLen=0`.
- Code: `src/App.jsx:66-77` still accepts old tab ids.
- Code: `src/App.jsx:216-221` only renders `dashboard`, `official-picks`, `intel`, `fantasy`, `injuries`, and `futures`.
- Code: `src/components/layout/Header.jsx:109-112` mobile nav still sets `mycard`, `bankroll`, `odds`, and `analytics`.

Impact:

Mobile users can tap visible footer buttons and lose the main content. Shared URLs to those old tabs also open blank.

Recommended fix:

Make the tab model single-source:

- Remove invalid tab ids from `VALID_TABS`, or add real render targets.
- Update mobile buttons to current tabs.
- Add a fallback for any unknown tab to dashboard.
- Add a small route/state test for every allowed tab id.

### P1 - Main bundle is too large because heavy tools load up front

Evidence:

- Production build passed but emitted chunk warnings.
- Main entry chunk: `index-Cuj_Kr9f.js` at 2,459.92 kB minified / 432.72 kB gzip.
- `FuturesPortfolio` chunk: 836.88 kB minified.
- Code: `src/components/agent/PersistentAgentSidebar.jsx:10-12` statically imports all agent chat modes.
- Code: `src/components/layout/DashboardLayout.jsx:21-24` mounts the persistent sidebar on every route.
- Code: `src/App.jsx` statically imports many modal/tool surfaces that are only conditionally used.

Impact:

The app ships expensive code to users before they ask for it, making first load and browser responsiveness worse.

Recommended fix:

Lazy-load heavy agent modes, futures portfolio, and modal/tool surfaces. Keep the sidebar shell light, then import mode content only when opened/selected.

### P1 - Prediction-market badges are attached to unrelated game cards

Evidence:

- Browser: game cards showed futures/award/division contracts such as a Madden cover market, a Minnesota win-total market, and an NFC North most-wins market.
- Code: `src/lib/predictionMarketStore.js:95-104` matches contracts when title/ticker text contains both team abbreviations or a loose matchup string.
- Code: `src/components/dashboard/MatchupCard.jsx:468-488` displays the returned contract as a per-game badge.

Impact:

Users may read a futures or award contract as if it belongs to a specific matchup. In a betting dashboard, that is materially misleading.

Recommended fix:

Only show game-card badges for contracts explicitly normalized as game/matchup contracts. Futures/awards/division/win-total contracts should appear in team or futures context, not on an individual game card.

### P2 - Per-game warning noise masks real runtime issues

Evidence:

- Code: `src/hooks/useSchedule.js:46` sets live odds to `Promise.resolve([])`.
- Code: `src/hooks/useSchedule.js:101` logs a warning for every schedule game without live odds.
- With 321 schedule rows, browser console output is dominated by expected fallback warnings.

Impact:

Expected fallback behavior looks like a runtime incident. Real warnings become harder to spot during testing.

Recommended fix:

When live odds are intentionally disabled, emit one summary-level log. Only warn per game when live odds were actually fetched and a specific matching failure is unexpected.

### P2 - Weather fetches can scale with rendered cards

Evidence:

- Code: `src/components/dashboard/MatchupCard.jsx:95-108` defines `WeatherDisplay` inside every matchup card and fetches Open-Meteo on mount for open-stadium games without existing weather.
- Since the dashboard currently mounts hundreds of cards, this can become many external requests at boot.

Impact:

Unneeded network work can slow the dashboard and create third-party dependency noise.

Recommended fix:

Cache weather by stadium/game day and fetch only for visible/current-slate cards.

### P2 - Lint currently fails

Evidence:

- `npm.cmd run lint` failed with 7 errors and 20 warnings.
- Errors are unused variables/caught errors in:
  - `agents/betting-splits-ingest.js`
  - `agents/gmail-intake-agent.js`
  - `agents/screenshot-watcher.js`
  - `agents/twitter-bookmarks-agent.js`
  - `scripts/official-pick-inbox-server.js`

Impact:

Lint is no longer a clean regression gate, even though the production build passes.

Recommended fix:

Clean the 7 errors first, then decide whether the 20 warnings should be fixed or codified as allowed.

### P2 - Repo contains removable generated and misplaced artifacts

Evidence:

- Old build folders beside live `dist`: about 33.16 MB combined.
- `docs` contains 465 files totaling about 27.33 MB.
- Misplaced personal ebook artifacts in `docs` include `The Genius of Desperation.epub` and an `.acsm` file.
- Large generated documentation areas include podcast transcript deep dives, futures odds exports, article intel review, and player availability.

Impact:

Repo navigation and handoffs are noisy. Generated outputs are mixed with durable docs, making it harder to identify source of truth.

Recommended fix:

Create an explicit artifact policy:

- Keep canonical source docs and current reports.
- Move generated snapshots to a dated archive or data/artifacts area.
- Delete ignored build backups after approval.
- Remove misplaced personal/non-project files after approval.

### P2 - Yahoo client-secret rotation remains unconfirmed

Evidence:

- Local handoffs still state that Yahoo Fantasy API is paused and the exposed client secret must be rotated before continuing.
- `.env` contains Yahoo client id/secret keys, but its timestamp predates the 2026-08-18 rotation warning.
- `.nfl/yahoo/tokens.json` timestamp also predates that warning.
- I did not access Yahoo's external developer dashboard.

Impact:

Any Yahoo work should remain paused until the secret is confirmed rotated externally, tokens refreshed, and dry-run checks rerun.

Recommended fix:

Treat rotation as not confirmed. After the user rotates it in Yahoo, update `.env`, refresh tokens, run only dry-read checks, and document the exact timestamp/result.

## Verification Performed

- `git status --short --branch`
- `git log -n 8 --oneline --decorate`
- `git branch -vv`
- Read local project instructions and rolling handoffs.
- `npm.cmd run build` - passed with chunk-size warnings.
- `npm.cmd run lint` - failed with 7 errors / 20 warnings.
- Browser auth wall check at port 5173.
- Browser offline UI route sweep at port 5174.
- Browser Bankroll modal interaction from a real dashboard card.
- Local filesystem bloat classification.
- Local Yahoo docs/config status check without printing secret values.

## Claude Audit Comparison

Pending. This report was intentionally written before opening Claude's audit.
