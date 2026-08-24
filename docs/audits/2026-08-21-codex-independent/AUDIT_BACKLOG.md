# NFL_Dashboard Audit Backlog - Codex Independent

Date: 2026-08-21
Source: Independent Codex audit before Claude comparison

## Priority Plan

### P0

1. **AUDIT-CX-001 - Fix Bankroll popup game normalization**
   - Owner area: `src/components/modals/BetEntryModal.jsx`
   - Fix `visitor` / `home` schedule-shaped games as first-class inputs.
   - Preserve compatibility with any older `away_team` / `home_team` callers.
   - Add a focused modal test for label and team options.
   - Acceptance: opening Bankroll from any dashboard card shows the correct matchup and both teams.

### P1

2. **AUDIT-CX-002 - Add current-slate dashboard default**
   - Owner area: `src/components/dashboard/Dashboard.jsx`
   - Default to current/next unplayed week instead of all 321 games.
   - Add explicit "All games" and week selectors.
   - Acceptance: first dashboard render is a scan-sized slate, not the full season.

3. **AUDIT-CX-003 - Repair mobile/deep-link tab model**
   - Owner area: `src/App.jsx`, `src/components/layout/Header.jsx`
   - Remove or render `mycard`, `bankroll`, `odds`, and `analytics`.
   - Also audit accepted-but-unrendered ids: `standings`, `devlab`, `picks`, `props`, `dfs`, `podcasts`, and `training-camp`.
   - Update mobile footer to valid/current app surfaces.
   - Add per-tab smoke coverage.
   - Acceptance: every visible mobile nav button and accepted `?tab=` value renders meaningful content.

4. **AUDIT-CX-004 - Lazy-load heavy sidebar agent modes**
   - Owner area: `src/components/agent/PersistentAgentSidebar.jsx`
   - Keep the shell light; lazy-load `AgentChat`, `FuturesAgentChat`, and `PropsAgentChat`.
   - Acceptance: main chunk size drops and agent modes still open cleanly.

5. **AUDIT-CX-005 - Lazy-load heavy modals/tools from App**
   - Owner area: `src/App.jsx`
   - Convert rarely used modal/tool imports to `React.lazy` or route-level chunks.
   - Acceptance: dashboard boot no longer pays for closed modal surfaces.

6. **AUDIT-CX-006 - Restrict game-card prediction markets to game contracts**
   - Owner area: `src/lib/predictionMarketStore.js`, `src/components/dashboard/MatchupCard.jsx`
   - Require normalized game/matchup contract metadata before showing a card badge.
   - Route futures/award/division/win-total markets to futures/team views.
   - Acceptance: no award, division, season win-total, or futures contract appears as a matchup badge.
   - Sequencing note: move this into the first fix pass with Bankroll/Picks/tab repair because it affects main-card betting-context correctness.

7. **AUDIT-CX-007 - Replace per-game live-odds fallback warnings**
   - Owner area: `src/hooks/useSchedule.js`
   - Emit one summary log when live odds are intentionally disabled or empty.
   - Keep per-game warnings only for unexpected mismatches after a successful live fetch.
   - Acceptance: console is quiet on normal offline/local dashboard load.

8. **AUDIT-CX-008 - Weather fetch caching and visibility gating**
   - Owner area: `src/components/dashboard/MatchupCard.jsx`
   - Cache by stadium/date and only fetch for visible/current slate.
   - Acceptance: first load does not fire one weather request per open-stadium game.

### P2

9. **AUDIT-CX-009 - Restore lint as a clean quality gate**
   - Owner area: agents/scripts listed in lint output.
   - Fix 7 lint errors first, then triage 20 warnings.
   - Acceptance: `npm.cmd run lint` exits 0.

10. **AUDIT-CX-010 - Add a focused audit smoke test suite**
    - Owner area: tests or Playwright smoke harness.
    - Cover dashboard load, all accepted tabs, Bankroll popup, line history popup, matchup analysis popup, and prediction-market badge behavior.
    - Acceptance: one command verifies the high-risk UI flows without requiring Supabase writes.

11. **AUDIT-CX-011 - Classify and remove old build folders after approval**
    - Owner area: repo root.
    - Candidate folders: `dist-verify-2026-08-13*`, `dist.old-*`.
    - Acceptance: approved cleanup removes about 33 MB of stale build output without touching live `dist`.

12. **AUDIT-CX-012 - Move non-project personal files out of docs after approval**
    - Owner area: `docs`.
    - Candidate files: `The Genius of Desperation.epub`, `.acsm` file.
    - Acceptance: docs contains project artifacts only.

13. **AUDIT-CX-013 - Define generated-artifact retention policy**
    - Owner area: docs/data organization.
    - Decide which generated reports belong in `docs`, `data`, archive folders, or ignored output paths.
    - Acceptance: new reports have a durable/source-of-truth location and stale snapshots have an archive/delete rule.

14. **AUDIT-CX-014 - Confirm Yahoo secret rotation before any Yahoo work**
    - Owner area: Yahoo external dashboard plus local `.env` and `.nfl/yahoo`.
    - Rotate externally, update local env, refresh tokens, run dry-read checks only.
    - Acceptance: handoff records exact rotation/check timestamp and Yahoo dry-run status.

15. **AUDIT-CX-015 - Add bundle budget tracking**
    - Owner area: Vite/build tooling.
    - Add lightweight bundle analysis or budget checks for main route and major lazy chunks.
    - Acceptance: future PRs can see when dashboard boot cost regresses.

## Recommended Fix Order

1. AUDIT-CX-001, because it fixes the broken user-facing bankroll flow.
2. AUDIT-CX-003, because it prevents blank screens from visible navigation and stale deep links.
3. AUDIT-CX-006, because misleading market placement is high-risk in a betting context and sits on the main matchup cards.
4. AUDIT-CX-002 and AUDIT-CX-007 together, because dashboard scale and console noise are coupled.
5. AUDIT-CX-004, AUDIT-CX-005, and AUDIT-CX-015, because they make the app lighter and keep it that way.
6. AUDIT-CX-009 and AUDIT-CX-010, because clean checks make future fixes safer.
7. AUDIT-CX-011 through AUDIT-CX-014, because cleanup and Yahoo rotation need explicit approval or external confirmation.

## Claude Audit Comparison

Pending. This backlog was intentionally written before opening Claude's audit.
