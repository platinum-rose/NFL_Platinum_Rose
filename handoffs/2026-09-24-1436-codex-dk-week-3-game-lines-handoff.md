---
date: 2026-09-24 14:36 America/Los_Angeles
author: Codex
audience: Claude team
status: Read-only DraftKings Predictions Week 3 game-market snapshot; no trade interaction
source: https://predictions.draftkings.com/en/markets/football/nfl
---

# DraftKings Predictions NFL Week 3 Game Markets

## Current State & Progress

Captured directly from the DraftKings Predictions NFL **Game Lines** board after the BEO snapshot. This is a contract/probability board, not a sportsbook odds board. The values below are the displayed spread/total contract probabilities and `To Win` probabilities. No contract was selected, added to Trade Slip, reviewed, or submitted.

| Game | Spread contracts | Total contracts | To Win contracts |
|---|---|---|---|
| ATL @ GB | ATL +5.5 52% / GB -5.5 49% | O 42.5 53% / U 42.5 49% | ATL 32% / GB 71% |
| CAR @ CLE | CAR -2.5 53% / CLE +2.5 50% | O 42.5 50% / U 42.5 53% | CAR 59% / CLE 44% |
| TEN @ NYG | TEN +2.5 51% / NYG -2.5 52% | O 39.5 47% / U 39.5 55% | TEN 46% / NYG 57% |
| LAC @ BUF | LAC +7.5 53% / BUF -7.5 50% | O 48.5 56% / U 48.5 46% | LAC 26% / BUF 77% |
| NYJ @ DET | NYJ +6.5 51% / DET -6.5 51% | O 48.5 48% / U 48.5 54% | NYJ 28% / DET 74% |
| SEA @ WAS | SEA -7.5 51% / WAS +7.5 52% | O 39.5 54% / U 39.5 49% | SEA 77% / WAS 25% |
| CIN @ PIT | CIN -3.5 50% / PIT +3.5 53% | O 42.5 50% / U 42.5 52% | CIN 64% / PIT 39% |
| NE @ JAX | NE +2.5 48% / JAX -2.5 55% | O 45.5 52% / U 45.5 50% | NE 42% / JAX 61% |
| HOU @ IND | HOU -1.5 52% / IND +1.5 50% | O 42.5 53% / U 42.5 50% | HOU 56% / IND 47% |
| KC @ MIA | KC -10.5 52% / MIA +10.5 51% | O 45.5 53% / U 45.5 50% | KC 87% / MIA 16% |
| MIN @ TB | MIN -1.5 50% / TB +1.5 53% | O 42.5 51% / U 42.5 52% | MIN 54% / TB 49% |
| ARI @ SF | ARI +8.5 51% / SF -8.5 53% | O 48.5 49% / U 48.5 54% | ARI 22% / SF 81% |
| LV @ NO | LV +3.5 54% / NO -3.5 48% | O 42.5 56% / U 42.5 47% | LV 40% / NO 63% |
| BAL @ DAL | BAL -3.5 50% / DAL +3.5 53% | O 51.5 55% / U 51.5 47% | BAL 63% / DAL 39% |
| LAR @ DEN | LAR -2.5 50% / DEN +2.5 52% | O 45.5 48% / U 45.5 55% | LAR 57% / DEN 46% |
| PHI @ CHI | PHI -4.5 52% / CHI +4.5 51% | O 42.5 48% / U 42.5 55% | PHI 69% / CHI 33% |

## Standing Constraints & Guardrails

- These are displayed DraftKings Predictions probabilities, not American odds and not directly interchangeable with BEO prices.
- The board is live and may move. Re-open the source before treating a value as current.
- Do not click a contract price, add a market to Trade Slip, use Review, or submit a trade.

## Next Operational Objectives

1. Read the paired BEO handoff and compare the game, market definition, and threshold before noting a difference.
2. Keep BEO and DK values in separate source columns; a line discrepancy is not a trade instruction.

## 📋 Resume Prompt

```text
Resume the read-only Week 3 NFL line comparison from E:\dev\projects\NFL_Dashboard\handoffs\2026-09-24-1436-codex-dk-week-3-game-lines-handoff.md.
- This file contains the matching 16-game DraftKings Predictions Game Lines snapshot.
- Treat every percentage as a DK contract probability, not as American odds.
- Read E:\dev\projects\NFL_Dashboard\handoffs\2026-09-24-1433-codex-beo-week-3-game-lines-handoff.md for the BEO source snapshot.
- Re-open each live market before asserting it remains current; do not select, review, or submit any trade or wager.
Next: make a source-labelled, definition-matched comparison table for the Week 3 main lines.
```
