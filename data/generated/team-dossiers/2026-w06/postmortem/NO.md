# NO Saints — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.681Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
1-4-0 · PF 118 PA 151 (-33) · streak L3 · net -6.6 pts/g (#27)
Pythagorean 1.79 exp wins (delta -0.79) · one-score 1-2 · power model #27

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | DET | A | L | 30-31 | +0.40 | -2 | 2.14 | 5 sacks taken |
| 2 | BAL | A | W | 24-17 | -0.90 | +1 | 2.67 | won despite losing the yards-per-play battle |
| 3 | LV | H | L | 27-35 | -0.10 | -3 | 2.45 | turnover margin -3 |
| 4 | ATL | H | L | 24-45 | -2.90 | -1 | 2.40 | blowout loss |
| 5 | MIN | H | L | 13-23 | -2.10 | -1 | 1.44 | 1 defensive/ST TD |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | -0.05 | #22 | Def EPA/play allowed (FTN) | 0.08 | #27 |
| Off DVOA (FTN) | -12.7% | #26 | Def DVOA allowed (FTN) | 18.7% | #31 |
| Off success % (FTN) | 43.0% | #15 | Def success % allowed (FTN) | 49.4% | #31 |
| Pass offense DVOA | -0.4% | #26 | Pass defense DVOA allowed | 23.9% | #27 |
| Rush offense DVOA | -15.6% | #22 | Rush defense DVOA allowed | 13.1% | #32 |
| Pressure % allowed | 32.6% | #24 | Pressure % generated | 24.7% | #27 |
| YPP differential | -1.12 | #30 | Turnover margin | -6 | #31 |
| Points/drive | 2.22 | #12 | 3rd-down % | 0.46 | #6 |
| Red-zone TD % | 0.81 | #3 | Points/game | 23.60 | #16 |

## Trend (W1–W3 vs last 2)
Direction: **declining** · pts/g 27 → 18.5 · allowed 27.7 → 34 · YPP diff -0.20 → -2.50 · margin -0.7 → -15.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Record is behind point differential: -0.79 wins vs Pythagorean.
- Turnover margin -6 (11 give / 5 take): extreme margins tend to regress.
- Red-zone TD rate 81% is high (league avg 60%).
- Run defense DVOA allowed 13.1% (#32).

## Week 6 opponent lens: @ NYG (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | -0.05 | #22 | 0.02 | #21 |
| team offense DVOA vs opp defense DVOA allowed | -12.7 | #26 | 4.8 | #23 |
| team pass offense DVOA vs opp pass defense DVOA allowed | -0.4 | #26 | 13.1 | #21 |
| team rush offense DVOA vs opp run defense DVOA allowed | -15.6 | #22 | -6.9 | #22 |
| team pressure allowed vs opp pressure generated | 32.6 | #24 | 28.6 | #17 |
| team defense EPA/play allowed vs opp offense EPA/play | 0.08 | #27 | -0.03 | #18 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
