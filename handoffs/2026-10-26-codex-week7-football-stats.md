# Codex handoff — Week 7 football data and analytics

**Prepared:** 2026-10-26 PT
**Repo/branch:** `E:\dev\projects\NFL_Dashboard`, `claude/w5-prop-cards-2026-10-11`
**Data report:** `reports/analysis/week7-postmortem/w07-football-stats-2026-10-26.md`

## Completed

- Added `scripts/analysis/week7-postmortem/compile-game-data.mjs`, a local-only exporter from saved ESPN boxscores. It reads the Week 7 schedule manifest for the 14 event IDs, validates snapshot season/week/event identity, requires final status for stats, and keeps games without a final boxscore marked pending.
- Compiled 13 finals and DAL @ PHI pending; exports contain 26 team rows, 6,523 player-stat entries, 106 scoring plays, and 14 scoreboard rows including the pending game.
- Derived game-shape, team-production, and player-leader summaries in the football report. Scoreboard scores were cross-checked with the NFL Week 7 schedule page.
- Cross-check passed: the game-result and team-score totals both sum to 573; team stats report 8,936 total yards. All 26 team rows have an ESPN snapshot update timestamp.
- Linked the football report from the provisional betting data pack. Ticket totals remain separate; paper is excluded and per-leg ticket parity is still incomplete.

## Open items

1. Leave DAL @ PHI grading to the scheduled Claude check-in at 8:45 PM PT unless Andy reassigns it. Refresh the game data and rerun `node scripts/analysis/week7-postmortem/compile-game-data.mjs` only after a final boxscore snapshot exists.
2. Continue the post-mortem by comparing the proposal card and official pool/contest picks with game outcomes; distinguish market prices and proposed picks from actual wagers.
3. Keep ticket leg outcomes provisional until the Week 5–7 independent parity review is complete.
4. Preserve Andy's unanswered questions from the H2C2 briefing; see `handoffs/2026-10-26-codex-hedge-watch-engineering.md`.

## Resume prompt

```text
Resume the 2026 Week 7 post-mortem in E:\dev\projects\NFL_Dashboard on claude/w5-prop-cards-2026-10-11. Read this handoff, then reconcile live Git. The provisional game-data report and exports are under reports/analysis/week7-postmortem; the local exporter is scripts/analysis/week7-postmortem/compile-game-data.mjs. Coverage is 13 finals, with DAL @ PHI pending the scheduled Claude 8:45 PM PT check-in. Do not independently grade MNF or edit ledgers. After the final boxscore appears, refresh the game exports and finish comparing proposal and contest picks with actual outcomes. Keep betting post-mortem numbers separate from football stats and keep the Week 5–7 per-leg parity gap explicit. Preserve dirty shared-checkout files; stage named paths only; retain H2C2 guardrails and unanswered Andy questions.
```
