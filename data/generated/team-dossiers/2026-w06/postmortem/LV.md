# LV Raiders — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.520Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 132 PA 129 (+3) · streak L2 · net +0.6 pts/g (#13)
Pythagorean 2.57 exp wins (delta +0.43) · one-score 1-1 · power model #14

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | MIA | H | W | 27-13 | -0.90 | 0 | 2.45 | won despite losing the yards-per-play battle |
| 2 | LAC | A | W | 26-14 | +0.10 | +2 | 2.00 | result matched the yards battle |
| 3 | NO | A | W | 35-27 | +0.10 | +3 | 2.92 | turnover margin +3 |
| 4 | KC | H | L | 27-30 | -1.30 | -2 | 2.25 | result matched the yards battle |
| 5 | NE | A | L | 17-45 | -2.70 | 0 | 1.55 | blowout loss |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.02 | #15 | Def EPA/play allowed (FTN) | 0.01 | #20 |
| Off DVOA (FTN) | -0.9% | #15 | Def DVOA allowed (FTN) | 8.3% | #24 |
| Off success % (FTN) | 41.5% | #19 | Def success % allowed (FTN) | 44.3% | #23 |
| Pass offense DVOA | 25.7% | #13 | Pass defense DVOA allowed | 15.4% | #23 |
| Rush offense DVOA | -25.9% | #29 | Rush defense DVOA allowed | -1.8% | #28 |
| Pressure % allowed | 36.9% | #28 | Pressure % generated | 39.5% | #1 |
| YPP differential | -0.94 | #29 | Turnover margin | 3 | #6 |
| Points/drive | 2.23 | #11 | 3rd-down % | 0.39 | #14 |
| Red-zone TD % | 0.56 | #20 | Points/game | 26.40 | #9 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 29.3 → 22 · allowed 18 → 37.5 · YPP diff -0.23 → -2.00 · margin +11.3 → -15.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Pass protection among the worst: pressure allowed 36.9% (#28).
- Elite pressure generation: 39.5% (#1).
- Run defense DVOA allowed -1.8% (#28).

## Week 6 opponent lens: vs BUF (Sun 10/18 13:25)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.02 | #15 | 0.13 | #31 |
| team offense DVOA vs opp defense DVOA allowed | -0.9 | #15 | 13.8 | #28 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 25.7 | #13 | 28.2 | #28 |
| team rush offense DVOA vs opp run defense DVOA allowed | -25.9 | #29 | -7.2 | #20 |
| team pressure allowed vs opp pressure generated | 36.9 | #28 | 27.8 | #22 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.01 | #20 | 0.19 | #2 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
