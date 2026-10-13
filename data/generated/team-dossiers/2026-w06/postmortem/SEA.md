# SEA Seahawks — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.266Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 134 PA 105 (+29) · streak L1 · net +5.8 pts/g (#5)
Pythagorean 3.20 exp wins (delta -0.20) · one-score 2-2 · power model #7

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | NE | H | W | 13-10 | +1.80 | +3 | 1.30 | turnover margin +3 |
| 2 | ARI | A | W | 31-7 | +2.50 | 0 | 3.10 | blowout win |
| 3 | WAS | A | L | 31-33 | +2.80 | -3 | 2.38 | lost despite winning the yards-per-play battle; turnover margin -3 |
| 4 | LAC | H | W | 30-23 | +0.50 | +3 | 2.14 | turnover margin +3 |
| 5 | SF | H | L | 29-32 | -0.60 | -1 | 1.93 | 5 sacks taken |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.09 | #26 | Def EPA/play allowed (FTN) | -0.14 | #2 |
| Off DVOA (FTN) | -10.1% | #22 | Def DVOA allowed (FTN) | -23.4% | #2 |
| Off success % (FTN) | 41.1% | #21 | Def success % allowed (FTN) | 37.8% | #2 |
| Pass offense DVOA | 22.2% | #14 | Pass defense DVOA allowed | -16.6% | #2 |
| Rush offense DVOA | -29.6% | #30 | Rush defense DVOA allowed | -32.3% | #2 |
| Pressure % allowed | 30.2% | #18 | Pressure % generated | 37.5% | #4 |
| YPP differential | 1.40 | #3 | Turnover margin | 2 | #12 |
| Points/drive | 2.17 | #13 | 3rd-down % | 0.30 | #31 |
| Red-zone TD % | 0.58 | #17 | Points/game | 26.80 | #8 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 25 → 29.5 · allowed 16.7 → 27.5 · YPP diff +2.37 → -0.05 · margin +8.3 → +2.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Elite pressure generation: 37.5% (#4).

## Week 6 opponent lens: @ DEN (Thu 10/15 17:15)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.09 | #26 | -0.04 | #14 |
| team offense DVOA vs opp defense DVOA allowed | -10.1 | #22 | -5.5 | #10 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 22.2 | #14 | -2 | #7 |
| team rush offense DVOA vs opp run defense DVOA allowed | -29.6 | #30 | -9.3 | #15 |
| team pressure allowed vs opp pressure generated | 30.2 | #18 | 33.2 | #7 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.14 | #2 | -0.07 | #24 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
