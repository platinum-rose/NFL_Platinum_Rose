# DEN Broncos — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.623Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 97 PA 111 (-14) · streak W1 · net -2.8 pts/g (#23)
Pythagorean 2.10 exp wins (delta +0.90) · one-score 3-0 · power model #21

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | KC | A | L | 10-31 | -2.20 | -1 | 0.83 | blowout loss |
| 2 | JAX | H | W | 20-13 | +1.70 | 0 | 2.22 | result matched the yards battle |
| 3 | LAR | H | W | 30-26 | -1.60 | +1 | 3.00 | won despite losing the yards-per-play battle; 1 defensive/ST TD |
| 4 | SF | A | L | 14-24 | -0.90 | -1 | 1.56 | result matched the yards battle |
| 5 | LAC | A | W | 23-17 | +0.10 | +2 | 1.77 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.07 | #24 | Def EPA/play allowed (FTN) | -0.04 | #14 |
| Off DVOA (FTN) | -7.4% | #19 | Def DVOA allowed (FTN) | -5.5% | #10 |
| Off success % (FTN) | 39.4% | #26 | Def success % allowed (FTN) | 40.1% | #5 |
| Pass offense DVOA | 7.5% | #21 | Pass defense DVOA allowed | -2.0% | #7 |
| Rush offense DVOA | -3.7% | #14 | Rush defense DVOA allowed | -9.3% | #15 |
| Pressure % allowed | 30.6% | #19 | Pressure % generated | 33.2% | #7 |
| YPP differential | -0.58 | #23 | Turnover margin | 1 | #17 |
| Points/drive | 1.88 | #24 | 3rd-down % | 0.34 | #27 |
| Red-zone TD % | 0.56 | #19 | Points/game | 19.40 | #26 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 20 → 18.5 · allowed 23.3 → 20.5 · YPP diff -0.70 → -0.40 · margin -3.3 → -2.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +0.90 wins vs Pythagorean.
- One-score record 3-0: small-sample close-game swing.

## Week 6 opponent lens: vs SEA (Thu 10/15 17:15)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.07 | #24 | -0.14 | #2 |
| team offense DVOA vs opp defense DVOA allowed | -7.4 | #19 | -23.4 | #2 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 7.5 | #21 | -16.6 | #2 |
| team rush offense DVOA vs opp run defense DVOA allowed | -3.7 | #14 | -32.3 | #2 |
| team pressure allowed vs opp pressure generated | 30.6 | #19 | 37.5 | #4 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #14 | -0.09 | #26 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
