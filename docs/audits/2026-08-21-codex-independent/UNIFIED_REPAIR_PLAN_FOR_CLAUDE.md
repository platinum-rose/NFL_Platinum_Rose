# NFL_Dashboard Unified Repair Plan for Claude

Date: 2026-08-21
Prepared by: Codex
Purpose: unified Claude + Codex consensus plan after independent audit, Claude audit, Codex comparison, and Claude verification.

## Ground Rules

- Preserve the dirty worktree. Do not revert unrelated files.
- Do not commit, push, stage broad changes, delete build/doc artifacts, or run cleanup unless Andy explicitly approves that checkpoint.
- No Supabase writes, official pick promotion, bankroll persistence, portfolio mutation, betting execution, or paid model/API calls unless Andy explicitly authorizes them.
- Prefer focused tests and browser checks over broad risky workflow changes.
- After each checkpoint, stop and hand off to Codex for review before continuing.

## Baseline Before Work

Claude should first capture:

- `git status --short --branch`
- Current `HEAD`
- Any files Claude intends to touch
- Whether the local app is being tested authenticated or with `VITE_BYPASS_AUTH=true`

Expected known baseline:

- Bankroll popup is broken from game cards.
- Picks & Inbox can stay stuck on checking state.
- Accepted stale tab ids can render blank content.
- Prediction-market badges can attach unrelated futures/award/division markets to matchup cards.
- Startup live odds are intentionally disabled; the issue is warning spam, not 0 live-odds rows.
- `npm.cmd run build` passed during audit with chunk warnings.
- `npm.cmd run lint` failed during audit with 7 errors / 20 warnings.

## Checkpoint 1 - Critical Main-Flow Correctness

Goal: fix the highest-risk user-facing defects before performance or cleanup.

### 1. Bankroll / Bet Management Popup

Files likely involved:

- `src/components/modals/BetEntryModal.jsx`
- focused test file if present/appropriate

Required behavior:

- Opening Bankroll from any matchup card shows the selected matchup correctly.
- Game options use schedule-shaped fields: `visitor`, `home`, `visitorName`, `homeName`.
- Preserve fallback compatibility with old fields such as `away_team` / `home_team`.
- Team select shows two real options.
- Kelly/bet amount display must not show `$NaN`.
- Do not persist test bets into real Supabase data.

Verification:

- Focused test for schedule-shaped selected game.
- Browser check from at least one real dashboard card.
- Confirm no `undefined @ undefined`, no blank team options, no `$NaN`.

### 2. Picks & Inbox Offline Resolution

Files likely involved:

- `src/components/official-picks/OfficialPicksTab.jsx`
- README or local setup doc only if the server dependency is not already clear

Required behavior:

- If `127.0.0.1:8787` is not running, the UI must leave `checking` and show a useful offline state.
- Existing 3-second fetch abort is not enough by itself; browser behavior stayed stuck after 13+ seconds.
- Add a UI-level failsafe timer if needed.
- Document `npm.cmd run official:picks:serve` where a local user would actually see it.

Verification:

- Browser check with no inbox server running.
- Wait longer than the timeout and confirm offline state is visible.
- Optional: run the inbox server and confirm online state if safe.

### 3. Stale Tab Id Repair

Files likely involved:

- `src/App.jsx`
- `src/components/layout/Header.jsx`

Stale ids to handle:

- `bankroll`
- `odds`
- `analytics`
- `mycard`
- `standings`
- `devlab`
- `picks`
- `props`
- `dfs`
- `podcasts`
- `training-camp`

Required behavior:

- Every accepted `?tab=` id renders meaningful content or redirects/falls back to dashboard.
- Every visible navigation button targets a renderable tab.
- Mobile footer must not send users to blank content.

Verification:

- Enumerate every accepted tab id in a route smoke check.
- Confirm no accepted tab has empty main content.

### 4. Prediction-Market Badge Filtering

Files likely involved:

- `src/lib/predictionMarketStore.js`
- `src/components/dashboard/MatchupCard.jsx`

Required behavior:

- Matchup cards only show prediction-market badges for explicit game/matchup contracts.
- Award, division, season win-total, and futures contracts must not appear as per-game matchup badges.
- Non-game contracts should remain available in futures/team contexts.

Verification:

- Unit test for at least one false-positive futures/award/division contract.
- Browser check that mismatched badges no longer appear on game cards.

### Checkpoint 1 Stop Condition

Stop and hand off to Codex after:

- Patch summary.
- Files changed.
- Focused tests run and results.
- Browser checks run and results.
- Any known residual issues.

Do not proceed to Checkpoint 2 until Codex reviews.

## Checkpoint 2 - Dashboard Scale and Runtime Noise

Goal: make the main dashboard smaller, quieter, and easier to scan.

### 5. Current-Slate Default

Files likely involved:

- `src/components/dashboard/Dashboard.jsx`
- possible schedule helper/test files

Required behavior:

- Dashboard should default to current/next unplayed slate, not all 321 games.
- User can still explicitly choose all games.
- Week/season filters should be clear and stable.

Verification:

- Browser first render is a scan-sized slate.
- Existing filters still work.
- "All games" still reaches the full schedule.

### 6. Live-Odds Warning Collapse

Files likely involved:

- `src/hooks/useSchedule.js`

Required behavior:

- Keep startup live odds disabled unless product direction changes.
- Replace per-game fallback warnings with one summary log when odds are intentionally empty.
- Only warn per game when live odds were expected and matching failed unexpectedly.

Verification:

- Browser console is not flooded on normal dashboard load.
- Schedule still renders with ESPN/static fallback data.

### 7. Splits Warning Severity

Files likely involved:

- splits loader/modal path, likely `src/components/modals/SplitsModal.jsx` or related data loader

Required behavior:

- If splits data is absent but the UI empty state is correct, log at info/debug, not warning.

Verification:

- Splits modal still shows the clean empty state.
- Console no longer presents expected absence as an alarming warning.

### 8. Weather Fetch Gating

Files likely involved:

- `src/components/dashboard/MatchupCard.jsx`

Required behavior:

- Weather fetches should be cached by stadium/date.
- Fetch only for visible/current-slate cards, not hundreds of offscreen/all-season cards.

Verification:

- Browser/network check shows no large weather request burst on first load.

### Checkpoint 2 Stop Condition

Stop and hand off to Codex with before/after browser metrics:

- Approximate rendered game/card count.
- Button count or DOM-size proxy if measured.
- Console warning count.
- Any network/weather observations.

## Checkpoint 3 - Bundle and Load Performance

Goal: reduce initial JavaScript cost without changing product scope.

### 9. Lazy-Load Modal and Tool Surfaces

Files likely involved:

- `src/App.jsx`
- modal imports/components

Required behavior:

- Closed modals/tools should not load into the initial dashboard chunk.
- Preserve modal behavior and suspense/loading states.

Verification:

- Production build before/after chunk comparison.
- Open representative modals in browser.

### 10. Lazy-Load Agent Mode Bodies

Files likely involved:

- `src/components/agent/PersistentAgentSidebar.jsx`

Required behavior:

- Sidebar shell can remain persistent.
- Heavy mode bodies load only when opened/selected.
- Agent modes still function as before.

Verification:

- Production build chunk comparison.
- Browser check each agent mode opens.

### 11. Bundle Budget Tracking

Files likely involved:

- package/build tooling, only if low-risk

Required behavior:

- Add lightweight visibility into bundle size regressions.
- Avoid brittle tooling if it creates churn.

Verification:

- Build still passes.
- Bundle output is easy to compare in future handoffs.

### Checkpoint 3 Stop Condition

Stop and hand off to Codex with:

- Build result.
- Before/after major chunk sizes.
- Browser smoke results for lazy-loaded surfaces.

## Checkpoint 4 - Quality Gates and Regression Coverage

Goal: make future fixes safer.

### 12. Restore Lint

Known audit baseline:

- 7 lint errors and 20 warnings.

Required behavior:

- Fix the 7 errors first.
- Triage warnings separately; do not expand scope into unrelated refactors.

Verification:

- `npm.cmd run lint` exits 0, or any remaining warnings/errors are explicitly justified.

### 13. Focused Audit Smoke Tests

Required coverage:

- Bankroll popup from schedule-shaped game.
- Picks & Inbox offline state.
- Every accepted tab id.
- Prediction-market badge false positives.
- Current-slate dashboard default.

Verification:

- One documented command for the focused smoke suite.
- Tests do not require Supabase writes.

### Checkpoint 4 Stop Condition

Stop and hand off to Codex with:

- Exact test/lint commands.
- Results.
- Any accepted residual risk.

## Checkpoint 5 - Cleanup and External Blockers

Goal: remove clutter only after approval and keep external secrets safe.

### 14. Repo Artifact Cleanup

Requires explicit Andy approval before deleting/moving.

Candidates:

- `dist.old-*`
- `dist-verify-2026-08-13*`
- `docs/The Genius of Desperation.epub`
- `.acsm` file
- dated docs/archive candidates
- large generated data dumps under `docs`
- oversized `TASK_BOARD.md` note cells

Verification:

- Reference check before deletion/move.
- Cleanup plan names exact files/folders.
- No source files or live `dist` removed accidentally.

### 15. Yahoo Fantasy Secret Rotation

Status:

- Treat as unconfirmed.
- Do not continue Yahoo API work until external rotation is confirmed.

Required sequence after Andy confirms external rotation:

1. Update local `.env`.
2. Refresh Yahoo tokens from repo root.
3. Run dry-read league/settings checks only.
4. Record exact timestamp and result in handoff.
5. Ask for explicit approval before any fantasy/Supabase writes.

### Checkpoint 5 Stop Condition

Stop and hand off to Codex with:

- Approval evidence.
- Exact moved/deleted files if cleanup happened.
- Yahoo dry-read status if rotation happened.

## Codex Review Protocol After Each Checkpoint

Claude should provide:

- Checkpoint number and scope.
- Files changed.
- Summary of behavior changed.
- Commands run and results.
- Browser/manual checks and results.
- Any files intentionally left dirty.
- Any blocked items or deviations from this plan.

Codex review will then:

- Inspect diffs for the checkpoint only.
- Preserve unrelated dirty work.
- Run or request focused verification as needed.
- Approve continuation, request fixes, or narrow the next checkpoint.

## First Work Packet for Claude

Begin with Checkpoint 1 only:

1. Fix `BetEntryModal.jsx` game normalization and `$NaN` behavior.
2. Fix `OfficialPicksTab.jsx` checking/offline resolution.
3. Fix all stale accepted tab ids.
4. Restrict game-card prediction-market badges to explicit matchup contracts.
5. Run focused tests and browser checks.
6. Stop for Codex review.
