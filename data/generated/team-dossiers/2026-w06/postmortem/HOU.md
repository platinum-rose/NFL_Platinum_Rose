# HOU Texans — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.286Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
1-4-0 · PF 110 PA 112 (-2) · streak W1 · net -0.4 pts/g (#18)
Pythagorean 2.45 exp wins (delta -1.45) · one-score 0-3 · power model #20

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | BUF | H | L | 31-36 | -2.70 | -2 | 2.82 | result matched the yards battle |
| 2 | CIN | H | L | 6-20 | +0.30 | 0 | 0.46 | red-zone stalls |
| 3 | IND | A | L | 17-19 | +0.20 | +3 | 1.70 | turnover margin +3 |
| 4 | DAL | H | L | 30-34 | +2.10 | 0 | 2.73 | lost despite winning the yards-per-play battle |
| 5 | TEN | A | W | 26-3 | +2.00 | +2 | 2.60 | blowout win |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.00 | #14 | Def EPA/play allowed (FTN) | -0.04 | #9 |
| Off DVOA (FTN) | 5.6% | #11 | Def DVOA allowed (FTN) | -6.9% | #9 |
| Off success % (FTN) | 42.0% | #16 | Def success % allowed (FTN) | 38.9% | #3 |
| Pass offense DVOA | 31.8% | #6 | Pass defense DVOA allowed | 6.6% | #17 |
| Rush offense DVOA | -18.5% | #24 | Rush defense DVOA allowed | -26.3% | #3 |
| Pressure % allowed | 23.2% | #4 | Pressure % generated | 28.9% | #16 |
| YPP differential | 0.38 | #11 | Turnover margin | 3 | #6 |
| Points/drive | 2.06 | #18 | 3rd-down % | 0.38 | #19 |
| Red-zone TD % | 0.56 | #20 | Points/game | 22.00 | #19 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 18 → 28 · allowed 25 → 18.5 · YPP diff -0.73 → +2.05 · margin -7.0 → +9.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -1.45 wins vs Pythagorean.
- One-score record 0-3: small-sample close-game swing.

## Week 6 opponent lens: @ JAX (Sun 10/18 06:30)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0 | #14 | -0.08 | #4 |
| team offense DVOA vs opp defense DVOA allowed | 5.6 | #11 | -18 | #4 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 31.8 | #6 | -2.8 | #6 |
| team rush offense DVOA vs opp run defense DVOA allowed | -18.5 | #24 | -36.9 | #1 |
| team pressure allowed vs opp pressure generated | 23.2 | #4 | 31.5 | #12 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #9 | 0.15 | #5 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
