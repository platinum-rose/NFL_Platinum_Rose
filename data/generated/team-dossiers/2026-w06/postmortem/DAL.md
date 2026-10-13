# DAL Cowboys — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.125Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 138 PA 136 (+2) · streak L1 · net +0.4 pts/g (#15)
Pythagorean 2.54 exp wins (delta -0.54) · one-score 1-3 · power model #18

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | NYG | A | L | 20-28 | -1.10 | 0 | 2.86 | result matched the yards battle |
| 2 | WAS | H | W | 37-20 | +0.30 | +1 | 4.62 | blowout win |
| 3 | BAL | H | L | 31-34 | -0.70 | -1 | 2.82 | result matched the yards battle |
| 4 | HOU | A | W | 34-30 | -2.10 | 0 | 3.40 | won despite losing the yards-per-play battle |
| 5 | TB | H | L | 16-24 | +0.30 | -3 | 1.60 | turnover margin -3 |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.13 | #7 | Def EPA/play allowed (FTN) | 0.18 | #32 |
| Off DVOA (FTN) | 16.9% | #5 | Def DVOA allowed (FTN) | 24.1% | #32 |
| Off success % (FTN) | 47.9% | #6 | Def success % allowed (FTN) | 51.0% | #32 |
| Pass offense DVOA | 30.3% | #8 | Pass defense DVOA allowed | 48.6% | #32 |
| Rush offense DVOA | -3.2% | #13 | Rush defense DVOA allowed | -1.9% | #27 |
| Pressure % allowed | 25.6% | #10 | Pressure % generated | 28.2% | #19 |
| YPP differential | -0.66 | #24 | Turnover margin | -3 | #22 |
| Points/drive | 3.06 | #4 | 3rd-down % | 0.49 | #4 |
| Red-zone TD % | 0.83 | #2 | Points/game | 27.60 | #7 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 29.3 → 25 · allowed 27.3 → 27 · YPP diff -0.50 → -0.90 · margin +2.0 → -2.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Red-zone TD rate 83% is high (league avg 60%).
- Pass defense DVOA allowed 48.6% (#32).

## Week 6 opponent lens: @ GB (Sun 10/18 17:20)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.13 | #7 | -0.04 | #12 |
| team offense DVOA vs opp defense DVOA allowed | 16.9 | #5 | -7 | #8 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 30.3 | #8 | -12 | #4 |
| team rush offense DVOA vs opp run defense DVOA allowed | -3.2 | #13 | -1.6 | #29 |
| team pressure allowed vs opp pressure generated | 25.6 | #10 | 26.5 | #23 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.18 | #32 | -0.03 | #19 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
