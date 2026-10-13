# NYJ Jets — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.774Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 93 PA 96 (-3) · streak W1 · net -0.6 pts/g (#19)
Pythagorean 2.41 exp wins (delta -0.41) · one-score 1-2 · power model #19

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | TEN | A | W | 23-10 | +1.80 | +1 | 2.09 | result matched the yards battle |
| 2 | GB | H | L | 17-20 | 0.00 | +1 | 1.42 | — |
| 3 | DET | A | L | 24-31 | -0.50 | -1 | 2.67 | 5 sacks taken |
| 4 | CHI | A | L | 12-23 | -0.60 | +2 | 1.50 | result matched the yards battle |
| 5 | CLE | H | W | 17-12 | +1.20 | 0 | 1.31 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.04 | #20 | Def EPA/play allowed (FTN) | -0.08 | #5 |
| Off DVOA (FTN) | -11.6% | #24 | Def DVOA allowed (FTN) | -2.7% | #15 |
| Off success % (FTN) | 41.9% | #17 | Def success % allowed (FTN) | 43.5% | #19 |
| Pass offense DVOA | 14.5% | #17 | Pass defense DVOA allowed | -1.2% | #9 |
| Rush offense DVOA | -13.3% | #19 | Rush defense DVOA allowed | -4.7% | #26 |
| Pressure % allowed | 23.0% | #3 | Pressure % generated | 21.9% | #29 |
| YPP differential | 0.38 | #12 | Turnover margin | 3 | #6 |
| Points/drive | 1.80 | #26 | 3rd-down % | 0.36 | #23 |
| Red-zone TD % | 0.46 | #28 | Points/game | 18.60 | #27 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 21.3 → 14.5 · allowed 20.3 → 17.5 · YPP diff +0.43 → +0.30 · margin +1.0 → -3.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- none triggered

## Week 6 opponent lens: @ NE (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.04 | #20 | -0.01 | #17 |
| team offense DVOA vs opp defense DVOA allowed | -11.6 | #24 | -8.9 | #7 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 14.5 | #17 | -11.2 | #5 |
| team rush offense DVOA vs opp run defense DVOA allowed | -13.3 | #19 | -5.5 | #23 |
| team pressure allowed vs opp pressure generated | 23 | #3 | 32.6 | #9 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.08 | #5 | 0.06 | #9 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
