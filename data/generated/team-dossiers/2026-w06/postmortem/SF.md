# SF 49ers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.300Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
5-0-0 · PF 154 PA 93 (+61) · streak W5 · net +12.2 pts/g (#1)
Pythagorean 3.84 exp wins (delta +1.16) · one-score 2-0 · power model #2

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | LAR | A | W | 27-7 | +0.80 | +1 | 3.00 | blowout win |
| 2 | MIA | H | W | 35-13 | +2.70 | 0 | 4.38 | blowout win |
| 3 | ARI | H | W | 36-30 | +4.20 | -1 | 3.60 | result matched the yards battle |
| 4 | DEN | H | W | 24-14 | +0.90 | +1 | 2.18 | result matched the yards battle |
| 5 | SEA | A | W | 32-29 | +0.60 | +1 | 2.46 | 1 defensive/ST TD |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.20 | #1 | Def EPA/play allowed (FTN) | -0.07 | #6 |
| Off DVOA (FTN) | 36.6% | #1 | Def DVOA allowed (FTN) | -19.3% | #3 |
| Off success % (FTN) | 51.6% | #1 | Def success % allowed (FTN) | 42.3% | #14 |
| Pass offense DVOA | 71.2% | #1 | Pass defense DVOA allowed | -14.6% | #3 |
| Rush offense DVOA | 4.3% | #7 | Rush defense DVOA allowed | -24.8% | #5 |
| Pressure % allowed | 24.7% | #8 | Pressure % generated | 27.9% | #21 |
| YPP differential | 1.84 | #1 | Turnover margin | 2 | #12 |
| Points/drive | 3.12 | #2 | 3rd-down % | 0.52 | #1 |
| Red-zone TD % | 0.88 | #1 | Points/game | 30.80 | #3 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 32.7 → 28 · allowed 16.7 → 21.5 · YPP diff +2.57 → +0.75 · margin +16.0 → +6.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +1.16 wins vs Pythagorean.
- Red-zone TD rate 88% is high (league avg 60%).
- Pass offense DVOA 71.2% (#1).

## Week 6 opponent lens: vs WAS (Mon 10/19 17:15)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.2 | #1 | 0.04 | #22 |
| team offense DVOA vs opp defense DVOA allowed | 36.6 | #1 | 3.5 | #22 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 71.2 | #1 | 18.7 | #26 |
| team rush offense DVOA vs opp run defense DVOA allowed | 4.3 | #7 | -22.4 | #7 |
| team pressure allowed vs opp pressure generated | 24.7 | #8 | 26.4 | #24 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.07 | #6 | -0.02 | #16 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
