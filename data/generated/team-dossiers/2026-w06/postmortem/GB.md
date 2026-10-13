# GB Packers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.246Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 104 PA 112 (-8) · streak W2 · net -1.6 pts/g (#21)
Pythagorean 2.28 exp wins (delta +0.72) · one-score 2-0 · power model #17

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | MIN | A | L | 22-39 | +2.40 | -1 | 1.83 | lost despite winning the yards-per-play battle; blowout loss; red-zone stalls |
| 2 | NYJ | A | W | 20-17 | 0.00 | -1 | 1.67 | — |
| 3 | ATL | H | L | 14-35 | -2.30 | 0 | 1.40 | blowout loss |
| 4 | TB | A | W | 17-14 | +0.60 | 0 | 1.70 | result matched the yards battle |
| 5 | CHI | H | W | 31-7 | +3.70 | +5 | 2.38 | turnover margin +5; blowout win |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.03 | #19 | Def EPA/play allowed (FTN) | -0.04 | #12 |
| Off DVOA (FTN) | -9.6% | #21 | Def DVOA allowed (FTN) | -7.0% | #8 |
| Off success % (FTN) | 40.3% | #25 | Def success % allowed (FTN) | 43.3% | #18 |
| Pass offense DVOA | 18.0% | #15 | Pass defense DVOA allowed | -12.0% | #4 |
| Rush offense DVOA | -32.4% | #32 | Rush defense DVOA allowed | -1.6% | #29 |
| Pressure % allowed | 26.9% | #12 | Pressure % generated | 26.5% | #23 |
| YPP differential | 0.88 | #7 | Turnover margin | 3 | #6 |
| Points/drive | 1.80 | #27 | 3rd-down % | 0.28 | #32 |
| Red-zone TD % | 0.50 | #24 | Points/game | 20.80 | #24 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 18.7 → 24 · allowed 30.3 → 10.5 · YPP diff +0.03 → +2.15 · margin -11.7 → +13.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Run defense DVOA allowed -1.6% (#29).

## Week 6 opponent lens: vs DAL (Sun 10/18 17:20)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.03 | #19 | 0.18 | #32 |
| team offense DVOA vs opp defense DVOA allowed | -9.6 | #21 | 24.1 | #32 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 18 | #15 | 48.6 | #32 |
| team rush offense DVOA vs opp run defense DVOA allowed | -32.4 | #32 | -1.9 | #27 |
| team pressure allowed vs opp pressure generated | 26.9 | #12 | 28.2 | #19 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #12 | 0.13 | #7 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
