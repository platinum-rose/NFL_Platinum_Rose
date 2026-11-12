# 2026 Week 10 — pick'em & confidence pools

Generated 2026-11-11T03:09:55.182Z by `scripts/pickem-card.mjs`. Win % = de-vigged moneyline averaged across books (odds as of 2026-11-10T21:11:13.935Z; closing line for games already started). Evidence leans: `data/pickem/leans-2026-w10.json`. Picks already made: `data/pickem/picks-2026-w10.json`. Proposals only — Andy submits.

## the duma 2 (SimplySportsware confidence pool)
Confidence · 93 rows in October 29 overall standings entrants · prizes: weekly, rolling_4_week, season · strategy: **market**
Standings (2026-11-10 Week 9 final): rank ? of 93, ? pts

Expected points: **74.132** vs market-only 74.132 (cost 0).

| Conf | Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|---|
| 14 | JAX | TEN | 81.5% | Sun 10:00 AM | open |  |
| 13 | LAR | ARI | 78.6% | Sun 1:05 PM | open |  |
| 12 | BUF | NYJ | 78.1% | Sun 10:00 AM | open |  |
| 11 | SEA | LV | 70.9% | Sun 1:05 PM | open |  |
| 10 | BAL | LAC | 67.4% | Mon 5:15 PM | open |  |
| 9 | HOU | CLE | 66.7% | Sun 10:00 AM | open |  |
| 8 | SF | DAL | 65.9% | Sun 1:25 PM | open |  |
| 7 | CIN | PIT | 64.1% | Sun 5:20 PM | open |  |
| 6 | IND | MIA | 63.4% | Sun 10:00 AM | open |  |
| 5 | GB | MIN | 62.3% | Sun 10:00 AM | open |  |
| 4 | KC | ATL | 62.0% | Sun 10:00 AM | open |  |
| 3 | DET | NE | 59.0% | Sun 6:30 AM | open |  |
| 2 | NYG | WSH | 56.0% | Thu 5:15 PM | open |  |
| 1 | NO | CAR | 52.8% | Sun 10:00 AM | open |  |

## Ken's Pickem League (Yahoo Pro Football Pick'em confidence pool)
Confidence · 54 on the Week 4 final standings entrants · prizes: weekly, season · strategy: **weekly_leverage**
Standings (2026-11-10 Week 9 final (API standings + per-game picks from the Yahoo picks page)): rank 18 of 54, ? pts

Expected points: **74.075** vs market-only 74.132 (cost 0.057).

| Conf | Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|---|
| 14 | JAX | TEN | 81.5% | Sun 10:00 AM | open |  |
| 13 | LAR | ARI | 78.6% | Sun 1:05 PM | open |  |
| 12 | BUF | NYJ | 78.1% | Sun 10:00 AM | open |  |
| 11 | SEA | LV | 70.9% | Sun 1:05 PM | open |  |
| 10 | BAL | LAC | 67.4% | Mon 5:15 PM | open |  |
| 9 | HOU | CLE | 66.7% | Sun 10:00 AM | open |  |
| 8 | SF | DAL | 65.9% | Sun 1:25 PM | open |  |
| 7 | CIN | PIT | 64.1% | Sun 5:20 PM | open |  |
| 6 | IND | MIA | 63.4% | Sun 10:00 AM | open |  |
| 5 | GB | MIN | 62.3% | Sun 10:00 AM | open |  |
| 4 | KC | ATL | 62.0% | Sun 10:00 AM | open |  |
| 3 | DET | NE | 59.0% | Sun 6:30 AM | open |  |
| 2 | NYG | WSH | 56.0% | Thu 5:15 PM | open |  |
| 1 | CAR | NO | 47.2% | Sun 10:00 AM | open | coin-flip flip (tier 2): Fair NO +1.8 (model NO +3.6) vs BEO pick; EPA intel model NO +3.4; CAR run game vs NO run D #31; Fezzik+Tucker tease CAR. NO ~53% at BEO. |

## BUKBUK NFL POOL (CBS straight-up pick'em)
Straight-up · 73 entries in October 29 standings entrants · prizes: weekly, season · strategy: **su_flips**
Standings (2026-11-10 Week 9 final (overall read after MNF)): rank 19 of 73, ? pts

Expected wins: **9.232** vs market-only 9.288 (cost 0.056).

| Pick | vs | Win % | Kickoff (PT) | Status | Note |
|---|---|---|---|---|---|
| NYG | WSH | 56.0% | Thu 5:15 PM | open |  |
| DET | NE | 59.0% | Sun 6:30 AM | open |  |
| KC | ATL | 62.0% | Sun 10:00 AM | open |  |
| HOU | CLE | 66.7% | Sun 10:00 AM | open |  |
| GB | MIN | 62.3% | Sun 10:00 AM | open |  |
| IND | MIA | 63.4% | Sun 10:00 AM | open |  |
| CAR | NO | 47.2% | Sun 10:00 AM | open | coin-flip flip (tier 2): Fair NO +1.8 (model NO +3.6) vs BEO pick; EPA intel model NO +3.4; CAR run game vs NO run D #31; Fezzik+Tucker tease CAR. NO ~53% at BEO. |
| BUF | NYJ | 78.1% | Sun 10:00 AM | open |  |
| JAX | TEN | 81.5% | Sun 10:00 AM | open |  |
| LAR | ARI | 78.6% | Sun 1:05 PM | open |  |
| SEA | LV | 70.9% | Sun 1:05 PM | open |  |
| SF | DAL | 65.9% | Sun 1:25 PM | open |  |
| CIN | PIT | 64.1% | Sun 5:20 PM | open |  |
| BAL | LAC | 67.4% | Mon 5:15 PM | open |  |

## How the strategies work
- **market** — every favorite; confidence ranked by win probability (maximizes expected points; cumulative prizes).
- **weekly_leverage** — market ranking plus ≤1 heavy-favorite fade at a low slot and ≤2 contrarian sides on near coin flips, each backed by tier 1–2 evidence, within the pool's expected-points budget.
- **su_flips** — straight-up favorites; flip ≤2 near coin flips where tier 1–2 evidence backs the dog.
