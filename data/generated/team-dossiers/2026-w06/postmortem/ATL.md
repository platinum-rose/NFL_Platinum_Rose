# ATL Falcons — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:26.320Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
2-3-0 · PF 119 PA 122 (-3) · streak L1 · net -0.6 pts/g (#19)
Pythagorean 2.43 exp wins (delta -0.43) · one-score 0-2 · power model #15

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | PIT | A | L | 13-20 | +0.10 | -1 | 1.00 | — |
| 2 | CAR | H | L | 3-34 | -1.40 | -5 | 0.25 | turnover margin -5; blowout loss |
| 3 | GB | A | W | 35-14 | +2.30 | 0 | 3.18 | blowout win |
| 4 | NO | A | W | 45-24 | +2.90 | +1 | 4.09 | blowout win |
| 5 | BAL | H | L | 23-30 | +0.20 | 0 | 2.30 | 1 defensive/ST TD; red-zone stalls |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.01 | #12 | Def EPA/play allowed (FTN) | -0.04 | #8 |
| Off DVOA (FTN) | -5.9% | #17 | Def DVOA allowed (FTN) | -4.7% | #12 |
| Off success % (FTN) | 48.6% | #4 | Def success % allowed (FTN) | 39.6% | #4 |
| Pass offense DVOA | -6.4% | #27 | Pass defense DVOA allowed | -0.1% | #10 |
| Rush offense DVOA | 6.5% | #5 | Rush defense DVOA allowed | -13.1% | #13 |
| Pressure % allowed | 21.1% | #1 | Pressure % generated | 34.2% | #5 |
| YPP differential | 0.82 | #8 | Turnover margin | -5 | #27 |
| Points/drive | 2.16 | #14 | 3rd-down % | 0.42 | #11 |
| Red-zone TD % | 0.69 | #7 | Points/game | 23.80 | #13 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 17 → 34 · allowed 22.7 → 27 · YPP diff +0.33 → +1.55 · margin -5.7 → +7.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin -5 (9 give / 4 take): extreme margins tend to regress.
- Elite pressure generation: 34.2% (#5).

## Week 6 opponent lens: vs CHI (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.01 | #12 | 0 | #19 |
| team offense DVOA vs opp defense DVOA allowed | -5.9 | #17 | 1.5 | #20 |
| team pass offense DVOA vs opp pass defense DVOA allowed | -6.4 | #27 | 2 | #13 |
| team rush offense DVOA vs opp run defense DVOA allowed | 6.5 | #5 | 0.8 | #30 |
| team pressure allowed vs opp pressure generated | 21.1 | #1 | 32.5 | #10 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.04 | #8 | 0 | #13 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
