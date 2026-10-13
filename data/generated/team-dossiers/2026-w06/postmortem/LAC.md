# LAC Chargers — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.870Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
0-5-0 · PF 84 PA 129 (-45) · streak L5 · net -9.0 pts/g (#29)
Pythagorean 1.33 exp wins (delta -1.33) · one-score 0-3 · power model #29

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | ARI | H | L | 14-26 | -0.20 | -2 | 1.40 | result matched the yards battle |
| 2 | LV | H | L | 14-26 | -0.10 | -2 | 1.08 | result matched the yards battle |
| 3 | BUF | A | L | 16-24 | -0.20 | +4 | 1.45 | turnover margin +4; red-zone stalls |
| 4 | SEA | A | L | 23-30 | -0.50 | -3 | 1.77 | turnover margin -3 |
| 5 | DEN | H | L | 17-23 | -0.10 | -2 | 1.31 | 5 sacks taken |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.21 | #32 | Def EPA/play allowed (FTN) | -0.09 | #3 |
| Off DVOA (FTN) | -26.1% | #32 | Def DVOA allowed (FTN) | -1.6% | #18 |
| Off success % (FTN) | 37.7% | #29 | Def success % allowed (FTN) | 40.6% | #6 |
| Pass offense DVOA | -16.9% | #32 | Pass defense DVOA allowed | 3.9% | #16 |
| Rush offense DVOA | -11.1% | #18 | Rush defense DVOA allowed | -7.1% | #21 |
| Pressure % allowed | 39.5% | #30 | Pressure % generated | 30.6% | #14 |
| YPP differential | -0.22 | #18 | Turnover margin | -5 | #27 |
| Points/drive | 1.40 | #31 | 3rd-down % | 0.35 | #26 |
| Red-zone TD % | 0.61 | #15 | Points/game | 16.80 | #30 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 14.7 → 20 · allowed 25.3 → 26.5 · YPP diff -0.17 → -0.30 · margin -10.7 → -6.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -1.33 wins vs Pythagorean.
- Turnover margin -5 (13 give / 8 take): extreme margins tend to regress.
- Results (net pts/g #29) trail underlying efficiency (avg FTN EPA rank #17.5).
- Pass protection among the worst: pressure allowed 39.5% (#30).
- One-score record 0-3: small-sample close-game swing.

## Week 6 opponent lens: @ KC (Sun 10/18 13:25)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.21 | #32 | -0.04 | #9 |
| team offense DVOA vs opp defense DVOA allowed | -26.1 | #32 | -5 | #11 |
| team pass offense DVOA vs opp pass defense DVOA allowed | -16.9 | #32 | 10.4 | #19 |
| team rush offense DVOA vs opp run defense DVOA allowed | -11.1 | #18 | -21.2 | #8 |
| team pressure allowed vs opp pressure generated | 39.5 | #30 | 39.4 | #2 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.09 | #3 | 0.15 | #4 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
