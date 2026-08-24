# NFL_Dashboard Audit Comparison and Recommended Fix Plan

Date: 2026-08-21
Prepared by: Codex

Inputs:

- Codex independent audit: `docs/audits/2026-08-21-codex-independent/AUDIT_REPORT.md`
- Codex independent backlog: `docs/audits/2026-08-21-codex-independent/AUDIT_BACKLOG.md`
- Claude audit: `docs/audits/2026-08-21-claude-atlas/AUDIT_REPORT.md`
- Claude backlog: `docs/audits/2026-08-21-claude-atlas/AUDIT_BACKLOG.md`

## Summary

The audits agree on the most important point: the Bankroll/Bet Management popup is broken and should be fixed before cleanup work. They also agree on initial-bundle/modal bloat, the 321-game live-odds warning flood, stale build artifacts, misplaced ebook files, and the need to sort `docs`.

Codex added four high-value UI/runtime findings not present in Claude's report:

- The dashboard renders the full 321-game schedule by default.
- Mobile/deep-link tab ids can render blank main content.
- Prediction-market badges attach non-game futures/award/division contracts to game cards.
- Per-card weather fetching can scale with all rendered cards.

Claude added four findings Codex did not independently include in the first report:

- Picks & Inbox can remain stuck on the local-server checking state.
- TheOddsAPI returned 0 games locally, then Claude's verification confirmed Codex's source read: this is intentional startup behavior, not a live-odds bug.
- Splits empty-state handling is good, but its console warning level is misleading.
- Futures AI returned empty YouTube futures intel responses and needs data/tool-path triage.

Claude's verification also widened one Codex finding: stale accepted tab ids are not limited to `bankroll`, `odds`, `analytics`, and `mycard`; `standings`, `devlab`, `picks`, `props`, `dfs`, `podcasts`, and `training-camp` are also accepted without render targets.

## Finding Comparison

| Area | Claude | Codex | Recommendation |
|---|---:|---:|---|
| Bankroll popup broken | Yes | Yes | Fix first. Shared P0. |
| Bankroll Kelly `$NaN` | Yes | Partially | Verify while fixing field normalization. |
| Picks & Inbox spinner | Yes | Reproduced after comparison | Treat as P0/P1 until timeout/offline state works in browser. |
| Live odds 0 games | Yes | Saw disabled/empty local odds path | Close as by design: startup live odds are intentionally disabled. Keep warning-collapse work. |
| Per-game fallback warnings | Yes | Yes | Collapse to one summary log. |
| Eager modal loading | Yes | Yes | Code-split modal/tool surfaces. |
| Persistent agent/sidebar bundle weight | No | Yes | Include with bundle work. |
| Full 321-game dashboard render | No | Yes | Add current-slate default before deeper perf tuning. |
| Mobile/deep-link blank tabs | No | Yes | Fix immediately after Bankroll/Picks, widened to all stale accepted ids. |
| Prediction-market badge mismatch | No | Yes | Move into first pass; this is main-card betting-context correctness, not polish. |
| Weather fetch scaling | No | Yes | Cache/gate after current-slate work. |
| Splits warning severity | Yes | Related | Downgrade warning/noise. |
| Futures YouTube intel empty | Yes | Not live-tested | Add targeted data/tool check. |
| Lint failing | No | Yes | Restore as quality gate. |
| Stale build folders | Yes | Yes | Delete after approval. |
| Ebook files in docs | Yes | Yes | Remove/move after approval. |
| Docs/archive policy | Yes | Yes | Do a confirmed classification pass. |
| TASK_BOARD note bloat | Yes | Not first-pass | Include in docs cleanup. |
| Yahoo secret rotation | Not central | Yes | Keep carried-forward blocker as unconfirmed. |

## Reconciled Fix Plan

### Phase 1 - User-facing broken flows

1. Fix Bankroll popup field normalization.
   - Files: `src/components/modals/BetEntryModal.jsx`, likely focused test files.
   - Include schedule-shaped `visitor` / `home` support and old-field fallback.
   - Verify game label, team options, bet amount/Kelly display, and no bad persistence in a dry/local-safe test.

2. Fix Picks & Inbox checking/offline state.
   - Files: `src/components/official-picks/OfficialPicksTab.jsx`.
   - The code has a 3-second abort timeout, but the browser still stayed in `checking` after 13+ seconds.
   - Add a hard UI failsafe timer if needed, make the offline state visible, and document `npm.cmd run official:picks:serve`.

3. Fix blank tab ids.
   - Files: `src/App.jsx`, `src/components/layout/Header.jsx`.
   - Every accepted tab id and visible nav button must render meaningful content or redirect to dashboard.
   - Include `bankroll`, `odds`, `analytics`, `mycard`, `standings`, `devlab`, `picks`, `props`, `dfs`, `podcasts`, and `training-camp`.

4. Restrict game-card prediction-market badges.
   - Files: `src/lib/predictionMarketStore.js`, `src/components/dashboard/MatchupCard.jsx`.
   - Require explicit game/matchup metadata before attaching to a matchup card.
   - Keep futures/awards/division/win-total contracts in futures/team surfaces.

### Phase 2 - Betting-context correctness

5. Close TheOddsAPI 0-game local finding as intentional startup behavior.
   - Code intentionally uses `Promise.resolve([])` to avoid startup API requests.
   - No production cross-check is needed for this specific finding unless the desired product behavior changes.

6. Triage Futures AI YouTube intel.
   - Verify the agent tool can read `public/youtube-futures-agent-intel-summary.json`.
   - Compare agent query filters against the available item/team/market schema.
   - Regenerate only if the source asset is actually stale or thin.

### Phase 3 - Performance and noise

7. Add current-slate dashboard default.
   - Render current/next unplayed week by default and make "All games" explicit.
   - This should reduce first-render card count, warning count, weather work, and scan load.

8. Collapse expected odds/splits console noise.
   - Replace 321 per-game odds warnings with one summary.
   - Downgrade "Splits not found" to info/debug when the UI empty state is correct.

9. Code-split heavy UI surfaces.
   - Lazy-load modals/tools from `App.jsx`.
   - Lazy-load agent mode bodies from `PersistentAgentSidebar.jsx`.
   - Add a before/after build-size note.

10. Cache/gate weather fetching.
    - Fetch by visible current slate and cache by stadium/date.

### Phase 4 - Quality gates

11. Restore lint.
    - Fix the 7 current lint errors.
    - Decide whether warnings are accepted or should become errors later.

12. Add focused audit smoke coverage.
    - Cover Bankroll, Picks offline, all accepted tabs, prediction-market badge filtering, and dashboard current-slate default.

13. Add bundle budget tracking.
    - Keep future initial-load regressions visible.

### Phase 5 - Cleanup and external blockers

14. Cleanup generated/stale artifacts after approval.
    - Delete old `dist.old-*` and `dist-verify-*` folders after reference check.
    - Remove/move the ebook and `.acsm`.
    - Sort dated docs, large generated outputs, `_LATEST` files, and `TASK_BOARD.md` notes.

15. Keep Yahoo Fantasy work paused until rotation is confirmed.
    - Local `.env` and `.nfl/yahoo/tokens.json` timestamps predate the 2026-08-18 rotation warning.
    - Treat rotation as unconfirmed until the external Yahoo dashboard is updated, local tokens are refreshed, and dry-read checks are rerun.

## Recommended Immediate Next Session

Start with Phase 1 in one narrow implementation pass:

1. Patch `BetEntryModal.jsx` normalization.
2. Add a focused modal test.
3. Patch `OfficialPicksTab.jsx` so offline state always resolves visibly.
4. Patch tab ids in `App.jsx` / `Header.jsx`.
5. Patch prediction-market game-card badge filtering.
6. Run `npm.cmd run build`, `npm.cmd run lint`, and focused UI/browser checks.

This addresses the two audit-confirmed broken flows plus the main-card correctness bugs before touching cleanup or broader performance work.
