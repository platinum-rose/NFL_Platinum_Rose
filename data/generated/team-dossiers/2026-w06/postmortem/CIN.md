# CIN Bengals — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.514Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 128 PA 109 (+19) · streak W1 · net +3.8 pts/g (#9)
Pythagorean 2.97 exp wins (delta +0.03) · one-score 2-2 · power model #8

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | TB | H | W | 33-27 | +0.20 | +3 | 3.67 | turnover margin +3; 1 defensive/ST TD |
| 2 | HOU | A | W | 20-6 | -0.30 | 0 | 1.54 | 5 sacks taken |
| 3 | PIT | A | L | 27-30 | -0.70 | -1 | 3.38 | result matched the yards battle |
| 4 | JAX | H | L | 17-22 | +0.20 | -2 | 1.89 | — |
| 5 | MIA | A | W | 31-24 | -0.30 | +2 | 3.10 | — |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.06 | #10 | Def EPA/play allowed (FTN) | -0.04 | #13 |
| Off DVOA (FTN) | 12.8% | #7 | Def DVOA allowed (FTN) | -2.4% | #16 |
| Off success % (FTN) | 46.5% | #9 | Def success % allowed (FTN) | 41.7% | #11 |
| Pass offense DVOA | 29.7% | #9 | Pass defense DVOA allowed | 2.3% | #14 |
| Rush offense DVOA | 0.1% | #11 | Rush defense DVOA allowed | -9.2% | #16 |
| Pressure % allowed | 27.0% | #13 | Pressure % generated | 31.7% | #11 |
| YPP differential | -0.18 | #17 | Turnover margin | 2 | #12 |
| Points/drive | 2.72 | #5 | 3rd-down % | 0.50 | #2 |
| Red-zone TD % | 0.53 | #23 | Points/game | 25.60 | #10 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 26.7 → 24 · allowed 21 → 23 · YPP diff -0.27 → -0.05 · margin +5.7 → +1.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- none triggered

## Week 6: bye week

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
