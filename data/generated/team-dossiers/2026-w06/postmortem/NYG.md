# NYG Giants — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.718Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-1-1 · PF 109 PA 106 (+3) · streak T1 · net +0.6 pts/g (#13)
Pythagorean 2.58 exp wins (delta +0.92) · one-score 2-0-1 · power model #23

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | DAL | H | W | 28-20 | +1.10 | 0 | 4.00 | result matched the yards battle |
| 2 | LAR | A | L | 6-28 | -4.70 | +1 | 0.60 | blowout loss |
| 3 | TEN | H | W | 12-7 | -0.50 | +2 | 1.09 | won despite losing the yards-per-play battle |
| 4 | ARI | H | W | 36-24 | +0.90 | 0 | 3.00 | 1 defensive/ST TD |
| 5 | WAS | A | T | 27-27 | -1.40 | -2 | 2.08 | tied |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.03 | #18 | Def EPA/play allowed (FTN) | 0.02 | #21 |
| Off DVOA (FTN) | -16.4% | #27 | Def DVOA allowed (FTN) | 4.8% | #23 |
| Off success % (FTN) | 41.5% | #19 | Def success % allowed (FTN) | 45.7% | #25 |
| Pass offense DVOA | 6.1% | #22 | Pass defense DVOA allowed | 13.1% | #21 |
| Rush offense DVOA | -21.6% | #27 | Rush defense DVOA allowed | -6.9% | #22 |
| Pressure % allowed | 31.6% | #21 | Pressure % generated | 28.6% | #17 |
| YPP differential | -0.92 | #28 | Turnover margin | 1 | #17 |
| Points/drive | 2.15 | #15 | 3rd-down % | 0.44 | #8 |
| Red-zone TD % | 0.64 | #11 | Points/game | 21.80 | #21 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 15.3 → 31.5 · allowed 18.3 → 25.5 · YPP diff -1.37 → -0.25 · margin -3.0 → +6.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +0.92 wins vs Pythagorean.
- One-score record 2-0-1: small-sample close-game swing.

## Week 6 opponent lens: vs NO (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.03 | #18 | 0.08 | #27 |
| team offense DVOA vs opp defense DVOA allowed | -16.4 | #27 | 18.7 | #31 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 6.1 | #22 | 23.9 | #27 |
| team rush offense DVOA vs opp run defense DVOA allowed | -21.6 | #27 | 13.1 | #32 |
| team pressure allowed vs opp pressure generated | 31.6 | #21 | 24.7 | #27 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.02 | #21 | -0.05 | #22 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
