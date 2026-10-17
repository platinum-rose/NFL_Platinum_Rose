# 2026 Week 6 — pick'em & confidence pools

Generated 2026-10-16T23:00:30.212Z by `scripts/pickem-card.mjs`. Win % = de-vigged moneyline averaged across books (odds as of 2026-10-16T17:38:00Z; closing line for games already started). Evidence leans: `data/pickem/leans-2026-w06.json`. Picks already made: `data/pickem/picks-2026-w06.json`. Proposals only — Andy submits.

## the duma 2 (SimplySportsware confidence pool)
Confidence · 93 on the 10/05 standings entrants · prizes: weekly, quarterly, four_game_segment, season · strategy: **market**
Standings (2026-10-05 Week 4 final): rank ? of 93, ? pts

Expected points: **64.285** vs market-only 64.285 (cost 0).

| Conf | Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|---|
| 13 | LAR | ARI | 86.0% | Sun 1:05 PM | open |  |
| 12 | KC | LAC | 77.3% | Sun 1:25 PM | open |  |
| 11 | SF | WSH | 75.6% | Mon 5:15 PM | open |  |
| 10 | NE | NYJ | 75.1% | Sun 10:00 AM | open |  |
| 9 | IND | TEN | 72.6% | Sun 10:00 AM | open |  |
| 8 | BUF | LV | 66.9% | Sun 1:25 PM | open |  |
| 7 | CAR | PHI | 61.5% | Sun 10:00 AM | open |  |
| 6 | BAL | CLE | 59.7% | Sun 10:00 AM | open |  |
| 5 | JAX | HOU | 57.5% | Sun 6:30 AM | open |  |
| 4 | PIT | TB | 56.7% | Sun 10:00 AM | open |  |
| 3 | GB | DAL | 52.3% | Sun 5:20 PM | open |  |
| 2 | NO | NYG | 50.7% | Sun 10:00 AM | open |  |
| 1 | CHI | ATL | 50.3% | Sun 10:00 AM | open |  |

## Ken's Pickem League (Yahoo Pro Football Pick'em confidence pool)
Confidence · 54 on the Week 4 final standings entrants · prizes: weekly, season · strategy: **weekly_leverage**
Standings (2026-10-13 Week 5 final (API; per-game picks not captured)): rank 34 of 54, ? pts

Expected points: **63.982** vs market-only 64.285 (cost 0.303).

| Conf | Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|---|
| 13 | LAR | ARI | 86.0% | Sun 1:05 PM | open |  |
| 12 | KC | LAC | 77.3% | Sun 1:25 PM | open |  |
| 11 | SF | WSH | 75.6% | Mon 5:15 PM | open |  |
| 10 | NE | NYJ | 75.1% | Sun 10:00 AM | open |  |
| 9 | IND | TEN | 72.6% | Sun 10:00 AM | open |  |
| 8 | BUF | LV | 66.9% | Sun 1:25 PM | open |  |
| 7 | CAR | PHI | 61.5% | Sun 10:00 AM | open |  |
| 6 | BAL | CLE | 59.7% | Sun 10:00 AM | open |  |
| 5 | JAX | HOU | 57.5% | Sun 6:30 AM | open |  |
| 4 | GB | DAL | 52.3% | Sun 5:20 PM | open |  |
| 3 | NO | NYG | 50.7% | Sun 10:00 AM | open |  |
| 2 | CHI | ATL | 50.3% | Sun 10:00 AM | open |  |
| 1 | TB | PIT | 43.3% | Sun 10:00 AM | open | coin-flip flip (tier 2): Stuckey and Brandon on TB at home with rest; model TB +2.5 cover 52.0%; PIT-TB wind borderline; Daniels starts vs PIT |

## BUKBUK NFL POOL (CBS straight-up pick'em)
Straight-up · 73 on the 10/05 standings entrants · prizes: weekly, season · strategy: **su_flips**
Standings (2026-10-06 Week 4 final (overall re-read after MNF)): rank 19 of 73, ? pts

Expected wins: **8.288** vs market-only 8.423 (cost 0.135).

| Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|
| JAX | HOU | 57.5% | Sun 6:30 AM | open |  |
| BAL | CLE | 59.7% | Sun 10:00 AM | open |  |
| CAR | PHI | 61.5% | Sun 10:00 AM | open |  |
| CHI | ATL | 50.3% | Sun 10:00 AM | open |  |
| NO | NYG | 50.7% | Sun 10:00 AM | open |  |
| NE | NYJ | 75.1% | Sun 10:00 AM | open |  |
| TB | PIT | 43.3% | Sun 10:00 AM | open | coin-flip flip (tier 2): Stuckey and Brandon on TB at home with rest; model TB +2.5 cover 52.0%; PIT-TB wind borderline; Daniels starts vs PIT |
| IND | TEN | 72.6% | Sun 10:00 AM | open |  |
| LAR | ARI | 86.0% | Sun 1:05 PM | open |  |
| BUF | LV | 66.9% | Sun 1:25 PM | open |  |
| KC | LAC | 77.3% | Sun 1:25 PM | open |  |
| GB | DAL | 52.3% | Sun 5:20 PM | open |  |
| SF | WSH | 75.6% | Mon 5:15 PM | open |  |

## How the strategies work
- **market** — every favorite; confidence ranked by win probability (maximizes expected points; cumulative prizes).
- **weekly_leverage** — market ranking plus ≤1 heavy-favorite fade at a low slot and ≤2 contrarian sides on near coin flips, each backed by tier 1–2 evidence, within the pool's expected-points budget.
- **su_flips** — straight-up favorites; flip ≤2 near coin flips where tier 1–2 evidence backs the dog.
