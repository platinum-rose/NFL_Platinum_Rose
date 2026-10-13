# LAR Rams — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.482Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 119 PA 120 (-1) · streak L1 · net -0.2 pts/g (#17)
Pythagorean 2.48 exp wins (delta -0.48) · one-score 1-2 · power model #16

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | SF | H | L | 7-27 | -0.80 | -1 | 0.70 | blowout loss; red-zone stalls |
| 2 | NYG | H | W | 28-6 | +4.70 | -1 | 2.55 | blowout win |
| 3 | DEN | A | L | 26-30 | +1.60 | -1 | 2.17 | lost despite winning the yards-per-play battle; red-zone stalls |
| 4 | PHI | A | W | 24-20 | +2.40 | -2 | 1.71 | result matched the yards battle |
| 5 | BUF | H | L | 34-37 | -1.80 | +2 | 3.40 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.05 | #11 | Def EPA/play allowed (FTN) | -0.04 | #11 |
| Off DVOA (FTN) | 16.1% | #6 | Def DVOA allowed (FTN) | -9.9% | #5 |
| Off success % (FTN) | 46.8% | #8 | Def success % allowed (FTN) | 42.4% | #15 |
| Pass offense DVOA | 31.8% | #6 | Pass defense DVOA allowed | 0.0% | #11 |
| Rush offense DVOA | 5.4% | #6 | Rush defense DVOA allowed | -20.9% | #9 |
| Pressure % allowed | 21.1% | #1 | Pressure % generated | 25.6% | #25 |
| YPP differential | 1.22 | #5 | Turnover margin | -3 | #22 |
| Points/drive | 2.11 | #17 | 3rd-down % | 0.45 | #7 |
| Red-zone TD % | 0.65 | #9 | Points/game | 23.80 | #13 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 20.3 → 29 · allowed 21 → 28.5 · YPP diff +1.83 → +0.30 · margin -0.7 → +0.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- none triggered

## Week 6 opponent lens: vs ARI (Sun 10/18 13:05)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.05 | #11 | 0.12 | #29 |
| team offense DVOA vs opp defense DVOA allowed | 16.1 | #6 | 11.7 | #27 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 31.8 | #6 | 38.3 | #30 |
| team rush offense DVOA vs opp run defense DVOA allowed | 5.4 | #6 | -14.1 | #11 |
| team pressure allowed vs opp pressure generated | 21.1 | #1 | 25.5 | #26 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #11 | -0.03 | #17 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
