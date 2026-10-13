# CLE Browns — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.083Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 93 PA 112 (-19) · streak L1 · net -3.8 pts/g (#25)
Pythagorean 1.96 exp wins (delta +1.04) · one-score 3-1 · power model #25

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | JAX | A | L | 10-34 | -0.80 | -2 | 1.11 | blowout loss; 5 sacks taken |
| 2 | TB | A | W | 23-19 | -0.10 | +1 | 1.92 | red-zone stalls |
| 3 | CAR | H | W | 21-18 | -0.80 | 0 | 1.62 | won despite losing the yards-per-play battle |
| 4 | PIT | H | W | 27-24 | +0.40 | 0 | 2.08 | result matched the yards battle |
| 5 | NYJ | A | L | 12-17 | -1.20 | 0 | 0.92 | 8 sacks taken |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.08 | #25 | Def EPA/play allowed (FTN) | -0.03 | #15 |
| Off DVOA (FTN) | -18.5% | #29 | Def DVOA allowed (FTN) | -4.6% | #13 |
| Off success % (FTN) | 38.3% | #28 | Def success % allowed (FTN) | 42.5% | #16 |
| Pass offense DVOA | 11.0% | #19 | Pass defense DVOA allowed | -1.3% | #8 |
| Rush offense DVOA | -32.3% | #31 | Rush defense DVOA allowed | -8.8% | #18 |
| Pressure % allowed | 39.5% | #30 | Pressure % generated | 34.2% | #5 |
| YPP differential | -0.50 | #21 | Turnover margin | -1 | #19 |
| Points/drive | 1.53 | #29 | 3rd-down % | 0.31 | #30 |
| Red-zone TD % | 0.46 | #31 | Points/game | 18.60 | #27 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 18 → 19.5 · allowed 23.7 → 20.5 · YPP diff -0.57 → -0.40 · margin -5.7 → -1.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +1.04 wins vs Pythagorean.
- Pass protection among the worst: pressure allowed 39.5% (#30).
- Elite pressure generation: 34.2% (#5).

## Week 6 opponent lens: vs BAL (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.08 | #25 | -0.02 | #16 |
| team offense DVOA vs opp defense DVOA allowed | -18.5 | #29 | -4 | #14 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 11 | #19 | 3.1 | #15 |
| team rush offense DVOA vs opp run defense DVOA allowed | -32.3 | #31 | -13.8 | #12 |
| team pressure allowed vs opp pressure generated | 39.5 | #30 | 29.1 | #15 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.03 | #15 | 0.14 | #6 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
