# ARI Cardinals — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:51.801Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
1-4-0 · PF 108 PA 162 (-54) · streak L4 · net -10.8 pts/g (#31)
Pythagorean 1.38 exp wins (delta -0.38) · one-score 0-1 · power model #30

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | LAC | A | W | 26-14 | +0.20 | +2 | 2.36 | result matched the yards battle |
| 2 | SEA | H | L | 7-31 | -2.50 | 0 | 0.70 | blowout loss |
| 3 | SF | A | L | 30-36 | -4.20 | +1 | 3.00 | result matched the yards battle |
| 4 | NYG | A | L | 24-36 | -0.90 | 0 | 1.85 | result matched the yards battle |
| 5 | DET | H | L | 21-45 | -1.70 | -1 | 1.75 | blowout loss; 5 sacks taken |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.03 | #17 | Def EPA/play allowed (FTN) | 0.12 | #29 |
| Off DVOA (FTN) | 0.1% | #13 | Def DVOA allowed (FTN) | 11.7% | #27 |
| Off success % (FTN) | 45.2% | #12 | Def success % allowed (FTN) | 43.9% | #22 |
| Pass offense DVOA | 12.1% | #18 | Pass defense DVOA allowed | 38.3% | #30 |
| Rush offense DVOA | -9.8% | #17 | Rush defense DVOA allowed | -14.1% | #11 |
| Pressure % allowed | 27.2% | #14 | Pressure % generated | 25.5% | #26 |
| YPP differential | -1.82 | #32 | Turnover margin | 2 | #12 |
| Points/drive | 1.93 | #22 | 3rd-down % | 0.41 | #13 |
| Red-zone TD % | 0.61 | #16 | Points/game | 21.60 | #23 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 21 → 22.5 · allowed 27 → 40.5 · YPP diff -2.17 → -1.30 · margin -6.0 → -18.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Pass defense DVOA allowed 38.3% (#30).

## Week 6 opponent lens: @ LAR (Sun 10/18 13:05)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.03 | #17 | -0.04 | #11 |
| team offense DVOA vs opp defense DVOA allowed | 0.1 | #13 | -9.9 | #5 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 12.1 | #18 | 0 | #11 |
| team rush offense DVOA vs opp run defense DVOA allowed | -9.8 | #17 | -20.9 | #9 |
| team pressure allowed vs opp pressure generated | 27.2 | #14 | 25.6 | #25 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.12 | #29 | 0.05 | #11 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
