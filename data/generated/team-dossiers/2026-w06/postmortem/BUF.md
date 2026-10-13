# BUF Bills — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.397Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
4-1-0 · PF 164 PA 141 (+23) · streak W1 · net +4.6 pts/g (#7)
Pythagorean 2.94 exp wins (delta +1.06) · one-score 3-1 · power model #9

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | HOU | A | W | 36-31 | +2.70 | +2 | 3.00 | red-zone stalls |
| 2 | DET | H | W | 41-31 | +0.80 | 0 | 4.56 | result matched the yards battle |
| 3 | LAC | H | W | 24-16 | +0.20 | -4 | 2.18 | turnover margin -4 |
| 4 | NE | H | L | 26-29 | +0.80 | 0 | 2.36 | lost despite winning the yards-per-play battle |
| 5 | LAR | A | W | 37-34 | +1.80 | -2 | 3.36 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.19 | #2 | Def EPA/play allowed (FTN) | 0.13 | #31 |
| Off DVOA (FTN) | 31.4% | #2 | Def DVOA allowed (FTN) | 13.8% | #28 |
| Off success % (FTN) | 48.3% | #5 | Def success % allowed (FTN) | 48.0% | #30 |
| Pass offense DVOA | 56.7% | #2 | Pass defense DVOA allowed | 28.2% | #28 |
| Rush offense DVOA | 18.0% | #1 | Rush defense DVOA allowed | -7.2% | #20 |
| Pressure % allowed | 24.0% | #6 | Pressure % generated | 27.8% | #22 |
| YPP differential | 1.26 | #4 | Turnover margin | -4 | #24 |
| Points/drive | 3.09 | #3 | 3rd-down % | 0.50 | #2 |
| Red-zone TD % | 0.71 | #6 | Points/game | 32.80 | #1 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 33.7 → 31.5 · allowed 26 → 31.5 · YPP diff +1.23 → +1.30 · margin +7.7 → 0.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +1.06 wins vs Pythagorean.
- Turnover margin -4 (9 give / 5 take): extreme margins tend to regress.
- Pass defense DVOA allowed 28.2% (#28).
- Pass offense DVOA 56.7% (#2).
- Rush offense DVOA 18.0% (#1).

## Week 6 opponent lens: @ LV (Sun 10/18 13:25)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.19 | #2 | 0.01 | #20 |
| team offense DVOA vs opp defense DVOA allowed | 31.4 | #2 | 8.3 | #24 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 56.7 | #2 | 15.4 | #23 |
| team rush offense DVOA vs opp run defense DVOA allowed | 18 | #1 | -1.8 | #28 |
| team pressure allowed vs opp pressure generated | 24 | #6 | 39.5 | #1 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.13 | #31 | -0.02 | #15 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
