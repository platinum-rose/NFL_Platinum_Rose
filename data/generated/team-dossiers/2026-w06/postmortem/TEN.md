# TEN Titans — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:53.138Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
0-5-0 · PF 58 PA 109 (-51) · streak L5 · net -10.2 pts/g (#30)
Pythagorean 0.92 exp wins (delta -0.92) · one-score 0-3 · power model #32

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | NYJ | H | L | 10-23 | -1.80 | -1 | 1.00 | result matched the yards battle |
| 2 | PHI | H | L | 20-24 | +1.00 | +2 | 2.22 | lost despite winning the yards-per-play battle |
| 3 | NYG | A | L | 7-12 | +0.50 | -2 | 0.70 | lost despite winning the yards-per-play battle; red-zone stalls |
| 4 | BAL | A | L | 18-24 | -1.20 | -2 | 1.64 | result matched the yards battle |
| 5 | HOU | H | L | 3-26 | -2.00 | -2 | 0.33 | blowout loss |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.15 | #31 | Def EPA/play allowed (FTN) | 0.06 | #24 |
| Off DVOA (FTN) | -18.3% | #28 | Def DVOA allowed (FTN) | 15.4% | #30 |
| Off success % (FTN) | 40.5% | #23 | Def success % allowed (FTN) | 42.6% | #17 |
| Pass offense DVOA | -9.7% | #29 | Pass defense DVOA allowed | 41.4% | #31 |
| Rush offense DVOA | -23.5% | #28 | Rush defense DVOA allowed | -7.6% | #19 |
| Pressure % allowed | 31.1% | #20 | Pressure % generated | 21.5% | #31 |
| YPP differential | -0.70 | #26 | Turnover margin | -5 | #27 |
| Points/drive | 1.18 | #32 | 3rd-down % | 0.36 | #24 |
| Red-zone TD % | 0.46 | #28 | Points/game | 11.60 | #32 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 12.3 → 10.5 · allowed 19.7 → 25 · YPP diff -0.10 → -1.60 · margin -7.3 → -14.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -0.92 wins vs Pythagorean.
- Turnover margin -5 (7 give / 2 take): extreme margins tend to regress.
- Pass defense DVOA allowed 41.4% (#31).
- One-score record 0-3: small-sample close-game swing.

## Week 6 opponent lens: @ IND (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.15 | #31 | 0.09 | #28 |
| team offense DVOA vs opp defense DVOA allowed | -18.3 | #28 | 10.3 | #26 |
| team pass offense DVOA vs opp pass defense DVOA allowed | -9.7 | #29 | 15.7 | #24 |
| team rush offense DVOA vs opp run defense DVOA allowed | -23.5 | #28 | 3.5 | #31 |
| team pressure allowed vs opp pressure generated | 31.1 | #20 | 23.1 | #28 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.06 | #24 | -0.05 | #21 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
