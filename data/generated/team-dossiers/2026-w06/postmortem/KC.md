# KC Chiefs — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.836Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
4-0-0 · PF 118 PA 77 (+41) · streak W4 · net +10.3 pts/g (#3) · bye W5
Pythagorean 2.93 exp wins (delta +1.07) · one-score 2-0 · power model #4

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | DEN | H | W | 31-10 | +2.20 | +1 | 2.58 | blowout win |
| 2 | IND | H | W | 33-30 | +1.50 | +1 | 3.00 | result matched the yards battle |
| 3 | MIA | A | W | 24-10 | +1.90 | +1 | 2.67 | result matched the yards battle |
| 4 | LV | A | W | 30-27 | +1.30 | +2 | 2.50 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.15 | #4 | Def EPA/play allowed (FTN) | -0.04 | #9 |
| Off DVOA (FTN) | 20.3% | #4 | Def DVOA allowed (FTN) | -5.0% | #11 |
| Off success % (FTN) | 47.8% | #7 | Def success % allowed (FTN) | 41.2% | #7 |
| Pass offense DVOA | 37.3% | #5 | Pass defense DVOA allowed | 10.4% | #19 |
| Rush offense DVOA | 3.2% | #9 | Rush defense DVOA allowed | -21.2% | #8 |
| Pressure % allowed | 28.7% | #16 | Pressure % generated | 39.4% | #2 |
| YPP differential | 1.73 | #2 | Turnover margin | 5 | #2 |
| Points/drive | 2.69 | #6 | 3rd-down % | 0.44 | #9 |
| Red-zone TD % | 0.63 | #14 | Points/game | 29.50 | #5 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 32 → 27 · allowed 20 → 18.5 · YPP diff +1.85 → +1.60 · margin +12.0 → +8.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +1.07 wins vs Pythagorean.
- Turnover margin +5 (2 give / 7 take): extreme margins tend to regress.
- Elite pressure generation: 39.4% (#2).

## Week 6 opponent lens: vs LAC (Sun 10/18 13:25)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.15 | #4 | -0.09 | #3 |
| team offense DVOA vs opp defense DVOA allowed | 20.3 | #4 | -1.6 | #18 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 37.3 | #5 | 3.9 | #16 |
| team rush offense DVOA vs opp run defense DVOA allowed | 3.2 | #9 | -7.1 | #21 |
| team pressure allowed vs opp pressure generated | 28.7 | #16 | 30.6 | #14 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #9 | -0.21 | #32 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
