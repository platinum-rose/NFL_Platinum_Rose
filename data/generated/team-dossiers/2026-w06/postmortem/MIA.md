# MIA Dolphins — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.980Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
0-5-0 · PF 70 PA 132 (-62) · streak L5 · net -12.4 pts/g (#32)
Pythagorean 0.91 exp wins (delta -0.91) · one-score 0-2 · power model #31

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | LV | A | L | 13-27 | +0.90 | 0 | 1.18 | lost despite winning the yards-per-play battle; red-zone stalls; 5 sacks taken |
| 2 | SF | A | L | 13-35 | -2.70 | 0 | 1.62 | blowout loss |
| 3 | KC | H | L | 10-24 | -1.90 | -1 | 1.11 | result matched the yards battle |
| 4 | MIN | A | L | 10-15 | +0.70 | -1 | 1.11 | lost despite winning the yards-per-play battle |
| 5 | CIN | H | L | 24-31 | +0.30 | -2 | 2.40 | — |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.12 | #28 | Def EPA/play allowed (FTN) | 0.07 | #25 |
| Off DVOA (FTN) | -22.6% | #31 | Def DVOA allowed (FTN) | 14.2% | #29 |
| Off success % (FTN) | 37.5% | #30 | Def success % allowed (FTN) | 47.0% | #29 |
| Pass offense DVOA | -16.2% | #31 | Pass defense DVOA allowed | 35.2% | #29 |
| Rush offense DVOA | -15.6% | #22 | Rush defense DVOA allowed | -8.9% | #17 |
| Pressure % allowed | 35.2% | #27 | Pressure % generated | 21.7% | #30 |
| YPP differential | -0.54 | #22 | Turnover margin | -4 | #24 |
| Points/drive | 1.48 | #30 | 3rd-down % | 0.41 | #12 |
| Red-zone TD % | 0.46 | #28 | Points/game | 14.00 | #31 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 12 → 17 · allowed 28.7 → 23 · YPP diff -1.23 → +0.50 · margin -16.7 → -6.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -0.91 wins vs Pythagorean.
- Turnover margin -4 (8 give / 4 take): extreme margins tend to regress.
- Pass defense DVOA allowed 35.2% (#29).

## Week 6: bye week

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
