# IND Colts — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.324Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 124 PA 138 (-14) · streak L1 · net -2.8 pts/g (#23)
Pythagorean 2.18 exp wins (delta -0.18) · one-score 1-1 · power model #24

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | BAL | H | L | 23-41 | -3.20 | -1 | 1.92 | blowout loss |
| 2 | KC | A | L | 30-33 | -1.50 | -1 | 3.00 | result matched the yards battle |
| 3 | HOU | H | W | 19-17 | -0.20 | -3 | 1.90 | turnover margin -3; red-zone stalls |
| 4 | WAS | A | W | 30-13 | -1.30 | -1 | 2.31 | won despite losing the yards-per-play battle; blowout win |
| 5 | PIT | A | L | 22-34 | -1.70 | 0 | 2.20 | red-zone stalls |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.05 | #21 | Def EPA/play allowed (FTN) | 0.09 | #28 |
| Off DVOA (FTN) | -8.4% | #20 | Def DVOA allowed (FTN) | 10.3% | #26 |
| Off success % (FTN) | 41.9% | #17 | Def success % allowed (FTN) | 43.8% | #20 |
| Pass offense DVOA | -10.7% | #30 | Pass defense DVOA allowed | 15.7% | #24 |
| Rush offense DVOA | 3.8% | #8 | Rush defense DVOA allowed | 3.5% | #31 |
| Pressure % allowed | 23.3% | #5 | Pressure % generated | 23.1% | #28 |
| YPP differential | -1.58 | #31 | Turnover margin | -6 | #31 |
| Points/drive | 2.27 | #10 | 3rd-down % | 0.35 | #25 |
| Red-zone TD % | 0.67 | #8 | Points/game | 24.80 | #11 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 24 → 26 · allowed 30.3 → 23.5 · YPP diff -1.63 → -1.50 · margin -6.3 → +2.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin -6 (8 give / 2 take): extreme margins tend to regress.
- Run defense DVOA allowed 3.5% (#31).

## Week 6 opponent lens: vs TEN (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.05 | #21 | 0.06 | #24 |
| team offense DVOA vs opp defense DVOA allowed | -8.4 | #20 | 15.4 | #30 |
| team pass offense DVOA vs opp pass defense DVOA allowed | -10.7 | #30 | 41.4 | #31 |
| team rush offense DVOA vs opp run defense DVOA allowed | 3.8 | #8 | -7.6 | #19 |
| team pressure allowed vs opp pressure generated | 23.3 | #5 | 21.5 | #31 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.09 | #28 | -0.15 | #31 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
