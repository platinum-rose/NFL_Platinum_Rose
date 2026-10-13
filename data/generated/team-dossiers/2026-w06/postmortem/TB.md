# TB Buccaneers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.342Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
1-4-0 · PF 100 PA 112 (-12) · streak W1 · net -2.4 pts/g (#22)
Pythagorean 2.17 exp wins (delta -1.17) · one-score 1-4 · power model #22

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | CIN | A | L | 27-33 | -0.20 | -3 | 3.00 | turnover margin -3; 1 defensive/ST TD |
| 2 | CLE | H | L | 19-23 | +0.10 | -1 | 1.73 | red-zone stalls |
| 3 | MIN | H | L | 16-23 | -0.40 | -1 | 1.07 | 6 sacks taken |
| 4 | GB | H | L | 14-17 | -0.60 | 0 | 1.56 | result matched the yards battle |
| 5 | DAL | A | W | 24-16 | -0.30 | +3 | 2.18 | turnover margin +3 |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.09 | #27 | Def EPA/play allowed (FTN) | -0.07 | #7 |
| Off DVOA (FTN) | -7.2% | #18 | Def DVOA allowed (FTN) | -9.6% | #6 |
| Off success % (FTN) | 40.5% | #23 | Def success % allowed (FTN) | 41.2% | #7 |
| Pass offense DVOA | 0.8% | #25 | Pass defense DVOA allowed | 0.0% | #11 |
| Rush offense DVOA | 2.3% | #10 | Rush defense DVOA allowed | -23.6% | #6 |
| Pressure % allowed | 41.3% | #32 | Pressure % generated | 28.5% | #18 |
| YPP differential | -0.28 | #19 | Turnover margin | -2 | #20 |
| Points/drive | 1.91 | #23 | 3rd-down % | 0.38 | #16 |
| Red-zone TD % | 0.47 | #27 | Points/game | 20.00 | #25 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 20.7 → 19 · allowed 26.3 → 16.5 · YPP diff -0.17 → -0.45 · margin -5.7 → +2.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -1.17 wins vs Pythagorean.
- Pass protection among the worst: pressure allowed 41.3% (#32).

## Week 6 opponent lens: vs PIT (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.09 | #27 | 0 | #18 |
| team offense DVOA vs opp defense DVOA allowed | -7.2 | #18 | -1.8 | #17 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 0.8 | #25 | 11.4 | #20 |
| team rush offense DVOA vs opp run defense DVOA allowed | 2.3 | #10 | -17 | #10 |
| team pressure allowed vs opp pressure generated | 41.3 | #32 | 20.6 | #32 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.07 | #7 | -0.06 | #23 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
