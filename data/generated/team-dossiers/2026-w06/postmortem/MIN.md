# MIN Vikings — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.601Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
5-0-0 · PF 109 PA 64 (+45) · streak W5 · net +9.0 pts/g (#4)
Pythagorean 3.90 exp wins (delta +1.10) · one-score 3-0 · power model #3

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | GB | H | W | 39-22 | -2.40 | +1 | 3.00 | won despite losing the yards-per-play battle; blowout win |
| 2 | CHI | A | W | 9-3 | +0.60 | +2 | 1.00 | result matched the yards battle |
| 3 | TB | A | W | 23-16 | +0.40 | +1 | 1.77 | 1 defensive/ST TD |
| 4 | MIA | H | W | 15-10 | -0.70 | +1 | 1.50 | won despite losing the yards-per-play battle; red-zone stalls |
| 5 | NO | A | W | 23-13 | +2.10 | +1 | 2.09 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.12 | #29 | Def EPA/play allowed (FTN) | -0.21 | #1 |
| Off DVOA (FTN) | -19.4% | #30 | Def DVOA allowed (FTN) | -24.7% | #1 |
| Off success % (FTN) | 35.1% | #32 | Def success % allowed (FTN) | 33.1% | #1 |
| Pass offense DVOA | -8.5% | #28 | Pass defense DVOA allowed | -24.0% | #1 |
| Rush offense DVOA | -15.4% | #21 | Rush defense DVOA allowed | -25.7% | #4 |
| Pressure % allowed | 24.6% | #7 | Pressure % generated | 38.3% | #3 |
| YPP differential | 0.00 | #15 | Turnover margin | 6 | #1 |
| Points/drive | 1.87 | #25 | 3rd-down % | 0.38 | #17 |
| Red-zone TD % | 0.50 | #24 | Points/game | 21.80 | #21 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 23.7 → 19 · allowed 13.7 → 11.5 · YPP diff -0.47 → +0.70 · margin +10.0 → +7.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +1.10 wins vs Pythagorean.
- Turnover margin +6 (4 give / 10 take): extreme margins tend to regress.
- Results (net pts/g #4) outrun underlying efficiency (avg FTN EPA rank #15).
- Elite pressure generation: 38.3% (#3).
- One-score record 3-0: small-sample close-game swing.

## Week 6: bye week

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
