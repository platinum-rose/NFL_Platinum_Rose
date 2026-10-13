# BAL Ravens — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:51.884Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
4-1-0 · PF 146 PA 119 (+27) · streak W3 · net +5.4 pts/g (#6)
Pythagorean 3.09 exp wins (delta +0.91) · one-score 3-1 · power model #10

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | IND | A | W | 41-23 | +3.20 | +1 | 3.15 | blowout win |
| 2 | NO | H | L | 17-24 | +0.90 | -1 | 2.12 | lost despite winning the yards-per-play battle |
| 3 | DAL | A | W | 34-31 | +0.70 | +1 | 2.83 | result matched the yards battle |
| 4 | TEN | H | W | 24-18 | +1.20 | +2 | 2.00 | result matched the yards battle |
| 5 | ATL | A | W | 30-23 | -0.20 | 0 | 2.73 | — |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.14 | #6 | Def EPA/play allowed (FTN) | -0.02 | #16 |
| Off DVOA (FTN) | 22.2% | #3 | Def DVOA allowed (FTN) | -4.0% | #14 |
| Off success % (FTN) | 49.7% | #2 | Def success % allowed (FTN) | 41.2% | #7 |
| Pass offense DVOA | 55.9% | #3 | Pass defense DVOA allowed | 3.1% | #15 |
| Rush offense DVOA | 9.7% | #3 | Rush defense DVOA allowed | -13.8% | #12 |
| Pressure % allowed | 29.6% | #17 | Pressure % generated | 29.1% | #15 |
| YPP differential | 1.16 | #6 | Turnover margin | 3 | #6 |
| Points/drive | 2.57 | #8 | 3rd-down % | 0.39 | #15 |
| Red-zone TD % | 0.74 | #5 | Points/game | 29.20 | #6 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 30.7 → 27 · allowed 26 → 20.5 · YPP diff +1.60 → +0.50 · margin +4.7 → +6.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is ahead of point differential: +0.91 wins vs Pythagorean.
- Red-zone TD rate 74% is high (league avg 60%).
- Pass offense DVOA 55.9% (#3).
- Rush offense DVOA 9.7% (#3).

## Week 6 opponent lens: @ CLE (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.14 | #6 | -0.03 | #15 |
| team offense DVOA vs opp defense DVOA allowed | 22.2 | #3 | -4.6 | #13 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 55.9 | #3 | -1.3 | #8 |
| team rush offense DVOA vs opp run defense DVOA allowed | 9.7 | #3 | -8.8 | #18 |
| team pressure allowed vs opp pressure generated | 29.6 | #17 | 34.2 | #5 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.02 | #16 | -0.08 | #25 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
