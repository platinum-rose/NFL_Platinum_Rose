# WAS Commanders — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.411Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
1-3-1 · PF 115 PA 149 (-34) · streak T1 · net -6.8 pts/g (#28)
Pythagorean 1.76 exp wins (delta -0.26) · one-score 1-1-1 · power model #28

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | PHI | A | L | 22-24 | -1.60 | 0 | 1.83 | result matched the yards battle |
| 2 | DAL | A | L | 20-37 | -0.30 | -1 | 2.22 | blowout loss; red-zone stalls |
| 3 | SEA | H | W | 33-31 | -2.80 | +3 | 2.54 | won despite losing the yards-per-play battle; turnover margin +3; 1 defensive/ST TD |
| 4 | IND | H | L | 13-30 | +1.30 | +1 | 1.08 | lost despite winning the yards-per-play battle; blowout loss |
| 5 | NYG | H | T | 27-27 | +1.40 | +2 | 2.08 | tied; 5 sacks taken |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.02 | #16 | Def EPA/play allowed (FTN) | 0.04 | #22 |
| Off DVOA (FTN) | -11.4% | #23 | Def DVOA allowed (FTN) | 3.5% | #22 |
| Off success % (FTN) | 39.4% | #26 | Def success % allowed (FTN) | 45.8% | #26 |
| Pass offense DVOA | 10.9% | #20 | Pass defense DVOA allowed | 18.7% | #26 |
| Rush offense DVOA | -18.9% | #25 | Rush defense DVOA allowed | -22.4% | #7 |
| Pressure % allowed | 34.4% | #26 | Pressure % generated | 26.4% | #24 |
| YPP differential | -0.40 | #20 | Turnover margin | 5 | #2 |
| Points/drive | 1.95 | #21 | 3rd-down % | 0.32 | #29 |
| Red-zone TD % | 0.50 | #24 | Points/game | 23.00 | #17 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 25 → 20 · allowed 30.7 → 28.5 · YPP diff -1.57 → +1.35 · margin -5.7 → -8.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin +5 (2 give / 7 take): extreme margins tend to regress.

## Week 6 opponent lens: @ SF (Mon 10/19 17:15)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.02 | #16 | -0.07 | #6 |
| team offense DVOA vs opp defense DVOA allowed | -11.4 | #23 | -19.3 | #3 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 10.9 | #20 | -14.6 | #3 |
| team rush offense DVOA vs opp run defense DVOA allowed | -18.9 | #25 | -24.8 | #5 |
| team pressure allowed vs opp pressure generated | 34.4 | #26 | 27.9 | #21 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.04 | #22 | 0.2 | #1 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
