# PHI Eagles — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.189Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 92 PA 112 (-20) · streak L3 · net -4.0 pts/g (#26)
Pythagorean 1.93 exp wins (delta +0.07) · one-score 2-2 · power model #26

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | WAS | H | W | 24-22 | +1.60 | 0 | 2.00 | result matched the yards battle |
| 2 | TEN | A | W | 24-20 | -1.00 | -2 | 3.00 | won despite losing the yards-per-play battle |
| 3 | CHI | A | L | 7-27 | -0.10 | -3 | 0.78 | turnover margin -3; blowout loss |
| 4 | LAR | H | L | 20-24 | -2.40 | +2 | 1.54 | result matched the yards battle |
| 5 | JAX | A | L | 17-19 | -2.10 | +1 | 1.55 | result matched the yards battle |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.13 | #30 | Def EPA/play allowed (FTN) | 0.05 | #23 |
| Off DVOA (FTN) | -11.9% | #25 | Def DVOA allowed (FTN) | -0.1% | #19 |
| Off success % (FTN) | 36.0% | #31 | Def success % allowed (FTN) | 44.4% | #24 |
| Pass offense DVOA | 5.8% | #24 | Pass defense DVOA allowed | 10.2% | #18 |
| Rush offense DVOA | -20.5% | #26 | Rush defense DVOA allowed | -12.5% | #14 |
| Pressure % allowed | 37.8% | #29 | Pressure % generated | 28.1% | #20 |
| YPP differential | -0.80 | #27 | Turnover margin | -2 | #20 |
| Points/drive | 1.77 | #28 | 3rd-down % | 0.37 | #22 |
| Red-zone TD % | 0.64 | #11 | Points/game | 18.40 | #29 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 18.3 → 18.5 · allowed 23 → 21.5 · YPP diff +0.17 → -2.25 · margin -4.7 → -3.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Pass protection among the worst: pressure allowed 37.8% (#29).

## Week 6 opponent lens: vs CAR (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.13 | #30 | 0.08 | #26 |
| team offense DVOA vs opp defense DVOA allowed | -11.9 | #25 | 1.6 | #21 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 5.8 | #24 | 14.9 | #22 |
| team rush offense DVOA vs opp run defense DVOA allowed | -20.5 | #26 | -5.5 | #23 |
| team pressure allowed vs opp pressure generated | 37.8 | #29 | 30.7 | #13 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.05 | #23 | 0.09 | #8 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
