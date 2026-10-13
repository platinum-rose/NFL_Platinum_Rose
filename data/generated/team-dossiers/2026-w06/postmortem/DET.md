# DET Lions — post-mortem, W1–W5 (for Week 6 synthesis)
Built from dossier 2026-w06 (2026-10-13T18:14:52.202Z, git e05d47c). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.

## Season result
3-2-0 · PF 164 PA 148 (+16) · streak W1 · net +3.2 pts/g (#10)
Pythagorean 2.80 exp wins (delta +0.20) · one-score 2-1 · power model #12

## Game by game
| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |
|---|---|---|---|---|---|---|---|---|
| 1 | NO | H | W | 31-30 | -0.40 | +2 | 2.21 | — |
| 2 | BUF | A | L | 31-41 | -0.80 | 0 | 3.44 | result matched the yards battle |
| 3 | NYJ | H | W | 31-24 | +0.50 | +1 | 3.44 | result matched the yards battle |
| 4 | CAR | A | L | 26-32 | +0.40 | 0 | 2.60 | — |
| 5 | ARI | A | W | 45-21 | +1.70 | +1 | 4.09 | blowout win |

## Underlying profile (season to date)
| Unit | Value | Rank | Unit | Value | Rank |
|---|---|---|---|---|---|
| Off EPA/play (FTN) | 0.17 | #3 | Def EPA/play allowed (FTN) | 0.13 | #30 |
| Off DVOA (FTN) | 11.5% | #8 | Def DVOA allowed (FTN) | 10.1% | #25 |
| Off success % (FTN) | 48.8% | #3 | Def success % allowed (FTN) | 46.7% | #28 |
| Pass offense DVOA | 29.3% | #10 | Pass defense DVOA allowed | 18.4% | #25 |
| Rush offense DVOA | 10.7% | #2 | Rush defense DVOA allowed | -5.4% | #25 |
| Pressure % allowed | 25.6% | #10 | Pressure % generated | 32.8% | #8 |
| YPP differential | 0.28 | #13 | Turnover margin | 4 | #5 |
| Points/drive | 3.16 | #1 | 3rd-down % | 0.37 | #21 |
| Red-zone TD % | 0.77 | #4 | Points/game | 32.80 | #1 |

## Trend (W1–W3 vs last 2)
Direction: **improving** · pts/g 31 → 35.5 · allowed 31.7 → 26.5 · YPP diff -0.23 → +1.05 · margin -0.7 → +9.0 (Two-game window on small samples; descriptive, not predictive.)

## Flags (explicit thresholds, descriptive)
- Turnover margin +4 (1 give / 5 take): extreme margins tend to regress.
- Red-zone TD rate 77% is high (league avg 60%).
- Rush offense DVOA 10.7% (#2).

## Week 6: bye week

## Caveats
- 5-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.
- Coaching context is historical only; availability/priors layers are not built in dossier v1.
