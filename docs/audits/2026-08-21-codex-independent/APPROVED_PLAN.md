# NFL_Dashboard Audit — Approved Phase 1 Plan

_2026-08-21. Andy approved this sequencing after reviewing both independent
audits (Claude/ATLAS and Codex) and Claude's source-level verification of
Codex's comparison. This is the source of truth for what ships first —
supersedes the phase ordering in `CLAUDE_COMPARISON_AND_RECOMMENDED_PLAN.md`
on the one point below; everything else in that doc still stands._

## Change from Codex's original sequencing

**Approved:** move `AUDIT-CX-006` (prediction-market badges misattached to
the wrong game card) out of "Phase 2 — Betting-context correctness" and into
the same first pass as the Bankroll and blank-tab fixes. Rationale: it's a
correctness bug inside the exact "main matchup cards" surface Andy named
paramount — a misattributed futures/award/division contract badge on a game
card is misleading in a betting context, not merely cosmetic or a
performance concern.

## Approved Phase 1 scope (one implementation pass)

1. **AUDIT-CX-001 / AUDIT-001** — Fix Bankroll/Bet Management popup game
   normalization. `src/components/modals/BetEntryModal.jsx:147-151` — read
   `visitor`/`home` (and `visitorName`/`homeName` for display) instead of
   the nonexistent `away_team`/`home_team`. Add a focused test asserting
   game label and team options render correctly.
2. **AUDIT-CX-006** — Restrict game-card prediction-market badges to
   contracts explicitly normalized as game/matchup contracts.
   `src/lib/predictionMarketStore.js:95-104`, `src/components/dashboard/MatchupCard.jsx:468-488`.
   Futures/award/division/win-total contracts stay in futures/team views,
   not on individual game cards.
3. **AUDIT-CX-003 / AUDIT-002** — Repair the tab model. `src/App.jsx`,
   `src/components/layout/Header.jsx`. Scope is larger than Codex's original
   four: `VALID_TABS` currently accepts eleven ids but only six render
   anything — `bankroll`, `odds`, `analytics`, `mycard`, `standings`,
   `devlab`, `picks`, `props`, `dfs`, `podcasts`, and `training-camp` are all
   either dead or need a real render target. Remove invalid ids or give them
   real content; add a fallback to `dashboard` for any unknown tab; add a
   smoke test covering every accepted tab id.
4. **AUDIT-002 (Picks & Inbox)** — Add a hard UI failsafe timeout + visible
   error/offline state for the `127.0.0.1:8787` local-server check in
   `OfficialPicksTab.jsx`. Currently the code has a 3-second abort timeout
   but the browser observably stayed in "checking" past 13+ seconds in
   Codex's test — the failsafe isn't actually firing in the UI.

## Closed, not part of this plan

- **AUDIT-004** (TheOddsAPI returning 0 games locally) — closed, not a bug.
  `useSchedule.js` disables live odds on startup by design (comment:
  "DISABLED on startup to save API requests"). No fix needed here.
- **AUDIT-005 / AUDIT-CX-007** (321 per-game fallback warnings) — still
  open, unaffected by the above — collapse to one summary log. Reasonable
  to fold into Phase 1 as a small addition since it's low-risk and touches
  the same `useSchedule.js` file as item 4 above, but not required to ship
  Phase 1's core fixes.

## Verification before considering Phase 1 done

- `npm run build` and `npm run lint` clean.
- Manual/automated check: Bankroll popup shows correct game label and team
  options from every dashboard card.
- Manual/automated check: no prediction-market badge appears on a game card
  unless the contract is explicitly matchup-scoped.
- Manual/automated check: every `VALID_TABS` entry either renders real
  content or no longer exists as an option; unknown `?tab=` falls back to
  dashboard.
- Manual/automated check: Picks & Inbox shows a visible error/offline state
  within a few seconds when the local server isn't reachable, never an
  indefinite spinner.
