# Checkpoint 1 — Implementation Summary

_2026-08-21, ATLAS S335 (Cowork). Implemented from
`UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md`'s Checkpoint 1 only, per the plan's own
stop condition. No commits, no pushes, no git add. Stopping here for Codex
review before Checkpoint 2, per the plan's protocol._

## Baseline before work

- `HEAD` at session start: `7840966ff2aed16097282e92ca6fff79a4457174` (branch
  `main`, tracking `origin/main`). Unchanged by this session (no commits).
- Worktree was already dirty from prior concurrent sessions (~60 modified/
  untracked paths — data ingestion output, fantasy-league work-in-progress,
  and **partial, uncommitted edits already sitting in `src/App.jsx` and
  `src/lib/predictionMarketStore.js`**, described below). Preserved as
  instructed; nothing reverted.
- `node -v` v22.23.2, `npm -v` 10.9.8. No `VITE_BYPASS_AUTH` in `.env`.
- Confirmed baseline defects live before touching anything: `BetEntryModal.jsx`
  read `game.away_team`/`game.home_team` (schedule.json actually uses
  `visitor`/`home`, `visitorName`/`homeName`); `VALID_TABS` in `App.jsx`
  accepted 11 ids with no render case; `getContractForGame` in
  `predictionMarketStore.js` used naive substring matching.
- **Environment note:** this session's device-bridge VM cannot delete files
  on the mounted drive (documented constraint) and briefly left a stale
  `.git/index.lock` after an interrupted `git status` — neutralized by
  moving it out of `.git/` (see Cleanup below). Not caused by any of the
  code changes below.

## Important finding before implementing: the badge fix was NOT actually done

`src/App.jsx` and `src/lib/predictionMarketStore.js` already had uncommitted
edits from an earlier concurrent session that looked like a badge fix
(removed the old "fall back to any team contract" behavior). **Verified
against the real production data
(`data/prediction-markets/latest.json`, 1993 contracts, and all 321 games in
`public/schedule.json`) that this partial fix still misattributed a badge to
179/321 games (56%)** — the remaining `text.includes(teamCode)` substring
check still matched things like "CARSON" containing "CAR", "ONE" containing
"NE", and "FOOTBALL" containing "TB". Item 4 below replaces that logic
entirely rather than leaving the partial fix in place.

## Files changed (all uncommitted)

1. **`src/components/modals/BetEntryModal.jsx`** — Bankroll/Bet Management popup
2. **`src/components/official-picks/OfficialPicksTab.jsx`** — Picks & Inbox offline state
3. **`src/App.jsx`** — stale tab-id repair (on top of the prior session's already-dirty edits)
4. **`src/lib/predictionMarketStore.js`** — prediction-market badge matching (replaces the prior session's partial fix)
5. **`tests/unit/predictionMarketStore.test.js`** — new, 6 tests

`src/components/dashboard/MatchupCard.jsx` was intentionally **not** touched — its call site (`getContractForGame(game.visitor, game.home)`, no fallback) was already correct from the prior session's edit; only the store function it calls needed fixing.

## 1. Bankroll / Bet Management popup

Root causes (confirmed by reading `public/schedule.json` and `src/lib/bankroll.js` directly, not just the symptom):

- `getGameOptions()` built labels/team options from `game.away_team`/`game.home_team`, which don't exist on schedule objects (`visitor`/`home` + `visitorName`/`homeName` do) → "undefined @ undefined", empty team dropdown. Same wrong fields in the pre-populate effect and the post-submit form reset. Fixed all three, with fallback compatibility for `away_team`/`home_team` preserved per the plan.
- `$NaN` root cause: `getBankrollData()` returns `{ settings, bets, weeklyStats }` — there is no top-level `bankrollData.unitSize` or `bankrollData.currentBankroll` (they're `bankrollData.settings.unitSize` / computed via `calculateAnalytics().currentBankroll`, exactly as `BankrollDashboard.jsx` already does it). The modal was reading the wrong shape, independent of the team-name bug. Fixed the bet-amount calc/display to read `bankrollData.settings.unitSize`, and added a `currentBankroll` state populated via `calculateAnalytics('all')` for the Kelly-sizing effect.
- Incidental cleanup: removed a `kellyUnit` variable that became dead code once the bankroll-argument bug was fixed (was already being passed to a function that doesn't use that argument — flagged as unused by lint, removed rather than left in place).

## 2. Picks & Inbox offline resolution

The existing 3-second `AbortController` timeout was already correct in principle, but Codex's live browser test found the UI still stuck on "checking" past 13+ seconds. Added a UI-level failsafe `setTimeout` (6s) that force-resolves to the offline state if the primary probe hasn't settled by then, independent of why the abort didn't flip the UI state in time. The `npm run official:picks:serve` documentation the plan asked for was **already present** in the offline-state UI (no change needed there).

## 3. Stale tab-id repair (all 11, not just Codex's original 4)

`VALID_TABS` already listed all 11 stale ids; the gap was no render case. Rather than removing the unreachable ones, checked what each id's intended destination was and found **every one of the 11 already had a fully-built component sitting unused in the codebase** — most already reachable as a sub-tab elsewhere (`bankroll` inside `FuturesHub`, `podcasts`/`training-camp` inside `UnifiedIntelHub`, `props`/`dfs` inside `FantasyHub`) but with no top-level route. This matters because real production deeplinks in `agents/nfl-daily-brief.js` (the daily email brief) already send users to `?tab=odds`, `?tab=picks`, and `?tab=podcasts` directly — those were landing on blank content before this fix, not just a hypothetical. Wired all 11:

| tab id | now renders |
|---|---|
| `bankroll` | `BankrollDashboard` |
| `odds` | `OddsCenter` |
| `analytics` | `AnalyticsDashboard` |
| `mycard` | `MyCardModal` (a plain embeddable view despite the name — was imported but never rendered anywhere at all before this fix, so its cart badge on mobile nav pointed nowhere) |
| `devlab` | `DevLab` |
| `picks` | `PicksTracker` |
| `standings` | `ExpertLeaderboard` (a working, unused-elsewhere component computing live standings — the older `Standings.jsx` needs a hand-built `record`/`lastWeek` shape nothing in the app produces, so left it orphaned rather than wiring a component that would render broken) |
| `podcasts` | `PodcastDigestTab` |
| `training-camp` | `TrainingCampIntel` |
| `props` | `PropsAgentChat` |
| `dfs` | `DFSOptimizer` |

**Caught one crash risk introduced by this wiring**, not present before because `MyCardModal` had never been reachable: it calls `onCreateParlay(...)` unguarded on the parlay/teaser/round-robin buttons, and no `onCreateParlay` implementation exists anywhere in the codebase (`useBettingCard.js` has no parlay logic). Passed a safe `alert()` fallback rather than fabricating parlay-settlement logic that doesn't exist elsewhere — flagging this as a real, separate feature gap for a future session rather than building it into this checkpoint.

Header.jsx needed no changes — its 6 desktop nav buttons and mobile-footer buttons (dashboard/mycard/bankroll/odds/analytics) all now point at ids that render.

## 4. Prediction-market badge filtering

Replaced the substring-matching `getContractForGame()` with whole-token matching via `normalizeTeam()` (`src/lib/teams.js` — the app's existing, already-tested single source of truth for team-name resolution, with built-in word-boundary guards). A contract now only matches a game if **both** teams are found among the whole tokens of its title+ticker+team field — not as raw substrings. Deliberately did **not** filter by `market_type` (e.g. excluding `division`/`conference`): the real data mistags some genuine two-team matchup contracts that way (e.g. "NFL Saturday: Giants vs. Eagles" is tagged `division`), so a market_type allowlist would have dropped real matches. Memoized the per-contract token extraction so repeated calls (one per rendered matchup card, 300+ per dashboard render) don't re-tokenize ~2k contracts every time.

Verified against the full real dataset: matches dropped from 179/321 games (the prior session's still-broken partial fix) to 70/321, and every one of those 70 is now a genuine two-team contract for the correct opponent (spot-checked all 5 false positives found during the audit — all now correctly return no match).

## Verification performed

- **`npx vite build`** (built to a scratch `--outDir` to work around this session's device-bridge being unable to empty the real `dist/` — a pre-existing environment constraint, not a code issue): ✓ built cleanly, 2761 modules, all new lazy chunks (BankrollDashboard, OddsCenter, AnalyticsDashboard, DevLab, PicksTracker, ExpertLeaderboard, PodcastDigestTab, TrainingCampIntel, PropsAgentChat, DFSOptimizer, OfficialPicksTab) split out correctly. Same chunk-size warnings as the audit baseline (Checkpoint 3's concern, unchanged here).
- **`npx eslint`** on all 4 touched files: 0 errors. 2 pre-existing warnings in `App.jsx` (unused `picksRefreshKey`/`autoGraded`, present at `HEAD` before any session touched the file) and none introduced by this checkpoint's changes. Full-project `npm run lint` exceeds this session's 45-second command budget to run to completion (large repo — hundreds of files under `agents/`/`scripts/` beyond `src/`); restoring it project-wide is Checkpoint 4's explicit scope, not re-verified here.
- **`npx vitest run`**: new `tests/unit/predictionMarketStore.test.js` (6 tests, all passing) locks in the badge fix against the real false-positive patterns found in the audit. Existing `tests/unit/bankroll.test.js` (19 tests) and `tests/unit/teamIdentity.test.js` (7 tests, covers `normalizeTeam` which the badge fix now depends on) still pass unchanged.
- **Browser check: not performed.** This session's device-bridge VM kills backgrounded processes at the end of every tool call, so a `vite`/`npm run dev` server cannot stay alive across the separate tool calls a Claude-in-Chrome click-through would need — confirmed this directly (dev server booted and served 200s within a single call, then died the moment that call ended). Confirmed instead, within single calls: the dev server itself boots without error under these changes, and serves 200 for both `/` and `/?tab=podcasts`. **This is a real gap against the plan's own verification checklist** ("Browser check from at least one real dashboard card", "Browser check with no inbox server running", etc.) — recommend Andy or Codex do a quick live click-through (Bankroll popup from a real card, each of the 11 tabs, Picks & Inbox with the server off) before/as part of the Checkpoint 1 review, since it's the one verification method this environment genuinely couldn't perform this session.

## Cleanup needed (left for Andy — this session's tools cannot delete files)

A `_to_delete/` folder now exists at `NFL_Dashboard/_to_delete/` containing scratch analysis scripts used to validate the badge fix against real data, plus a stale `.git/index.lock` this session found and moved out of `.git/` (neutralized — `git status`/`git diff` etc. all work fine with it sitting there, it's just clutter). Safe to delete the whole folder.

## Known residual issues (not fixed here — out of this checkpoint's scope)

- `MatchupCard.jsx` still imports `getContractsForTeam` unused (lint warning) — leftover from the prior session's partial badge-fix edit that removed its only call site. Harmless, flagged for whoever finishes cleaning up that file.
- The `agent` tab id used by `agents/nfl-daily-brief.js`'s deeplinks (`dashLink('agent', ...)`) isn't in `VALID_TABS` at all — a real deeplink gap, but distinct from the 11-id list this checkpoint covers, and not flagged by either audit. Worth a follow-up.
- `MyCardModal`'s parlay/teaser/round-robin creation has no backend (see above) — was unreachable before this checkpoint, now reachable and safely no-ops with an explanatory alert instead of crashing.
