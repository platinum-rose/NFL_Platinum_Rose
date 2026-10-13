# NE Patriots — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T23:40:27.041Z, git 706ab47). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 110 PA 94 (+16) · streak W2 · net +3.2 pts/g (#10)
Pythagorean 2.96 exp wins (delta +0.04) · one-score 1-1 · power model #6

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | SEA | A | L | 10-13 | -1.80 | -3 | 1.11 | turnover margin -3 |
| 2 | PIT | H | W | 20-3 | +2.70 | 0 | 1.82 | blowout win; 1 defensive/ST TD |
| 3 | JAX | A | L | 6-35 | +0.10 | -2 | 0.60 | blowout loss; red-zone stalls |
| 4 | BUF | A | W | 29-26 | -0.80 | 0 | 2.42 | won despite losing the yards-per-play battle |
| 5 | LV | H | W | 45-17 | +2.70 | 0 | 4.09 | blowout win |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.06 | #9 | Def EPA/play allowed (FTN) | -0.01 | #17 |
| Off DVOA (FTN) | -1.1% | #16 | Def DVOA allowed (FTN) | -8.9% | #7 |
| Off success % (FTN) | 44.5% | #13 | Def success % allowed (FTN) | 41.8% | #12 |
| Pass offense DVOA | 26.4% | #12 | Pass defense DVOA allowed | -11.2% | #5 |
| Rush offense DVOA | -15.3% | #20 | Rush defense DVOA allowed | -5.5% | #23 |
| Pressure % allowed | 31.7% | #22 | Pressure % generated | 32.6% | #9 |
| YPP differential | 0.58 | #9 | Turnover margin | -5 | #27 |
| Points/drive | 2.01 | #20 | 3rd-down % | 0.38 | #20 |
| Red-zone TD % | 0.57 | #18 | Points/game | 22.00 | #19 |

## Trend (W1–W3 vs last 2)
Direction: **flat** · pts/g 12 → 37 · allowed 17 → 21.5 · YPP diff +0.33 → +0.95 · margin -5.0 → +15.5 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin -5 (11 give / 6 take): extreme margins tend to regress.

## Week 6 opponent lens: vs NYJ (Sun 10/18 10:00)
| Matchup | Team | Rank | Opp | Rank |
|---|---|---|---|---|
| team offense EPA/play vs opp defense EPA/play allowed | 0.06 | #9 | -0.08 | #5 |
| team offense DVOA vs opp defense DVOA allowed | -1.1 | #16 | -2.7 | #15 |
| team pass offense DVOA vs opp pass defense DVOA allowed | 26.4 | #12 | -1.2 | #9 |
| team rush offense DVOA vs opp run defense DVOA allowed | -15.3 | #20 | -4.7 | #26 |
| team pressure allowed vs opp pressure generated | 31.7 | #22 | 21.9 | #29 |
| team defense EPA/play allowed vs opp offense EPA/play | -0.01 | #17 | -0.04 | #20 |

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
