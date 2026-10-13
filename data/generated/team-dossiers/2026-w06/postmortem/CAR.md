# CAR Panthers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:51.970Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-2-0 · PF 121 PA 109 (+12) · streak W1 · net +3.0 pts/g (#12) · bye W5
Pythagorean 2.25 exp wins (delta -0.25) · one-score 1-1 · power model #11

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | CHI | H | L | 37-59 | -0.20 | -2 | 2.85 | blowout loss |
| 2 | ATL | A | W | 34-3 | +1.40 | +5 | 3.09 | turnover margin +5; blowout win; 1 defensive/ST TD |
| 3 | CLE | A | L | 18-21 | +0.80 | 0 | 1.50 | lost despite winning the yards-per-play battle; red-zone stalls |
| 4 | DET | H | W | 32-26 | -0.40 | 0 | 3.20 | — |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.09 | #8 | Def EPA/play allowed (FTN) | 0.08 | #26 |
| Off DVOA (FTN) | 9.4% | #10 | Def DVOA allowed (FTN) | 1.6% | #21 |
| Off success % (FTN) | 43.5% | #14 | Def success % allowed (FTN) | 46.4% | #27 |
| Pass offense DVOA | 29.2% | #11 | Pass defense DVOA allowed | 14.9% | #22 |
| Rush offense DVOA | -4.9% | #15 | Rush defense DVOA allowed | -5.5% | #23 |
| Pressure % allowed | 33.1% | #25 | Pressure % generated | 30.7% | #13 |
| YPP differential | 0.40 | #10 | Turnover margin | 3 | #6 |
| Points/drive | 2.66 | #7 | 3rd-down % | 0.38 | #17 |
| Red-zone TD % | 0.65 | #10 | Points/game | 30.25 | #4 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 35.5 → 25 · allowed 31 → 23.5 · YPP diff +0.60 → +0.20 · margin +4.5 → +1.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- none triggered

## Week 6 opponent lens: @ PHI (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.09 | #8 | 0.05 | #23 |
| team offense DVOA vs opp defense DVOA allowed | 9.4 | #10 | -0.1 | #19 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 29.2 | #11 | 10.2 | #18 |
| team rush offense DVOA vs opp run defense DVOA allowed | -4.9 | #15 | -12.5 | #14 |
| team pressure allowed vs opp pressure generated | 33.1 | #25 | 28.1 | #20 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.08 | #26 | -0.13 | #30 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
