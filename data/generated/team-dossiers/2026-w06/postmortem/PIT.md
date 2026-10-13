# PIT Steelers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.233Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 111 PA 109 (+2) · streak W1 · net +0.4 pts/g (#15)
Pythagorean 2.55 exp wins (delta +0.45) · one-score 2-1 · power model #13

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | ATL | H | W | 20-13 | -0.10 | +1 | 1.54 | 1 defensive/ST TD |
| 2 | NE | A | L | 3-20 | -2.70 | 0 | 0.25 | blowout loss |
| 3 | CIN | H | W | 30-27 | +0.70 | +1 | 3.00 | red-zone stalls |
| 4 | CLE | A | L | 24-27 | -0.40 | 0 | 2.00 | 5 sacks taken |
| 5 | IND | H | W | 34-22 | +1.70 | 0 | 3.40 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.06 | #23 | Def EPA/play allowed (FTN) | 0.00 | #18 |
| Off DVOA (FTN) | 1.3% | #12 | Def DVOA allowed (FTN) | -1.8% | #17 |
| Off success % (FTN) | 40.6% | #22 | Def success % allowed (FTN) | 43.8% | #20 |
| Pass offense DVOA | 5.9% | #23 | Pass defense DVOA allowed | 11.4% | #20 |
| Rush offense DVOA | 7.2% | #4 | Rush defense DVOA allowed | -17.0% | #10 |
| Pressure % allowed | 25.4% | #9 | Pressure % generated | 20.6% | #32 |
| YPP differential | -0.16 | #16 | Turnover margin | 2 | #12 |
| Points/drive | 2.04 | #19 | 3rd-down % | 0.33 | #28 |
| Red-zone TD % | 0.55 | #22 | Points/game | 22.20 | #18 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 17.7 → 29 · allowed 20 → 24.5 · YPP diff -0.70 → +0.65 · margin -2.3 → +4.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Rush offense DVOA 7.2% (#4).

## Week 6 opponent lens: @ TB (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.06 | #23 | -0.07 | #7 |
| team offense DVOA vs opp defense DVOA allowed | 1.3 | #12 | -9.6 | #6 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 5.9 | #23 | 0 | #11 |
| team rush offense DVOA vs opp run defense DVOA allowed | 7.2 | #4 | -23.6 | #6 |
| team pressure allowed vs opp pressure generated | 25.4 | #9 | 28.5 | #18 |
| team defense EPA/play allowed vs opp offense EPA/play | 0 | #18 | -0.09 | #27 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
