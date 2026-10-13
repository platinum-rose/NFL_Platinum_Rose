# JAX Jaguars — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.366Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
4-1-0 · PF 123 PA 70 (+53) · streak W3 · net +10.6 pts/g (#2)
Pythagorean 3.96 exp wins (delta +0.04) · one-score 2-1 · power model #1

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | CLE | H | W | 34-10 | +0.80 | +2 | 3.78 | blowout win |
| 2 | DEN | A | L | 13-20 | -1.70 | 0 | 1.44 | result matched the yards battle |
| 3 | NE | H | W | 35-6 | -0.10 | +2 | 3.50 | blowout win |
| 4 | CIN | A | W | 22-17 | -0.20 | +2 | 2.44 | — |
| 5 | PHI | H | W | 19-17 | +2.10 | -1 | 1.58 | red-zone stalls |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.15 | #5 | Def EPA/play allowed (FTN) | -0.08 | #4 |
| Off DVOA (FTN) | 11.0% | #9 | Def DVOA allowed (FTN) | -18.0% | #4 |
| Off success % (FTN) | 45.9% | #10 | Def success % allowed (FTN) | 41.4% | #10 |
| Pass offense DVOA | 40.1% | #4 | Pass defense DVOA allowed | -2.8% | #6 |
| Rush offense DVOA | -0.3% | #12 | Rush defense DVOA allowed | -36.9% | #1 |
| Pressure % allowed | 28.3% | #15 | Pressure % generated | 31.5% | #12 |
| YPP differential | 0.18 | #14 | Turnover margin | 5 | #2 |
| Points/drive | 2.55 | #9 | 3rd-down % | 0.46 | #5 |
| Red-zone TD % | 0.64 | #11 | Points/game | 24.60 | #12 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 27.3 → 20.5 · allowed 12 → 17 · YPP diff -0.33 → +0.95 · margin +15.3 → +3.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin +5 (3 give / 8 take): extreme margins tend to regress.
- Pass offense DVOA 40.1% (#4).

## Week 6 opponent lens: vs HOU (Sun 10/18 06:30)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.15 | #5 | -0.04 | #9 |
| team offense DVOA vs opp defense DVOA allowed | 11 | #9 | -6.9 | #9 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 40.1 | #4 | 6.6 | #17 |
| team rush offense DVOA vs opp run defense DVOA allowed | -0.3 | #12 | -26.3 | #3 |
| team pressure allowed vs opp pressure generated | 28.3 | #15 | 28.9 | #16 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.08 | #4 | 0 | #14 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
