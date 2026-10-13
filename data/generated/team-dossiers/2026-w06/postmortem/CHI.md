# CHI Bears — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.004Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 119 PA 96 (+23) · streak L1 · net +4.6 pts/g (#7)
Pythagorean 3.12 exp wins (delta -0.12) · one-score 0-1 · power model #5

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | CAR | A | W | 59-37 | +0.20 | +2 | 4.21 | blowout win |
| 2 | MIN | H | L | 3-9 | -0.60 | -2 | 0.30 | red-zone stalls |
| 3 | PHI | H | W | 27-7 | +0.10 | +3 | 3.00 | turnover margin +3; blowout win |
| 4 | NYJ | H | W | 23-12 | +0.60 | -2 | 2.56 | red-zone stalls |
| 5 | GB | A | L | 7-31 | -3.70 | -5 | 0.58 | turnover margin -5; blowout loss |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.00 | #13 | Def EPA/play allowed (FTN) | 0.00 | #19 |
| Off DVOA (FTN) | -0.1% | #14 | Def DVOA allowed (FTN) | 1.5% | #20 |
| Off success % (FTN) | 45.4% | #11 | Def success % allowed (FTN) | 42.1% | #13 |
| Pass offense DVOA | 16.6% | #16 | Pass defense DVOA allowed | 2.0% | #13 |
| Rush offense DVOA | -6.7% | #16 | Rush defense DVOA allowed | 0.8% | #30 |
| Pressure % allowed | 31.8% | #23 | Pressure % generated | 32.5% | #10 |
| YPP differential | -0.68 | #25 | Turnover margin | -4 | #24 |
| Points/drive | 2.13 | #16 | 3rd-down % | 0.44 | #10 |
| Red-zone TD % | 0.43 | #32 | Points/game | 23.80 | #13 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 29.7 → 15 · allowed 17.7 → 21.5 · YPP diff -0.10 → -1.55 · margin +12.0 → -6.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin -4 (10 give / 6 take): extreme margins tend to regress.
- Red-zone TD rate 43% is low (league avg 60%).
- Run defense DVOA allowed 0.8% (#30).

## Week 6 opponent lens: @ ATL (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0 | #13 | -0.04 | #8 |
| team offense DVOA vs opp defense DVOA allowed | -0.1 | #14 | -4.7 | #12 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 16.6 | #16 | -0.1 | #10 |
| team rush offense DVOA vs opp run defense DVOA allowed | -6.7 | #16 | -13.1 | #13 |
| team pressure allowed vs opp pressure generated | 31.8 | #23 | 34.2 | #5 |
| team defense EPA/play allowed vs opp offense EPA/play | 0 | #19 | 0.01 | #12 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
