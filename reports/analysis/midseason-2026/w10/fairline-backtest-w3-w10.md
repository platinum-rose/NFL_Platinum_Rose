# Fair-line model backtest, Weeks 3-10 (2026)

Built 2026-11-17 for decision #14. Script: `fairline_backtest.py` (same folder); output `fairline_backtest.json`.

## Method
- Same core as `reports/intel/w10-model/fair_lines_w10.py`: 0.40 SRS + 0.40 FTN DVOA + 0.20 net yards/play + 1.5 HFA; fair line = halfway between market and model; edge = half the model-market gap.
- Every input as of the game week: team stats from earlier weeks only; DVOA from the FTN export that existed before the week's first kickoff (W5: through W4, 10/09; W6-7: through W5, 10/13; W8: through W7; W9: through W8; W10: through W9). W3-4 use the Football Outsiders 2026 preseason projection (Supabase).
- No hand QB/injury adjustments (would need hindsight). The live model had them.
- Graded against the DraftKings line on the Tuesday of game week (Supabase `game_odds_snapshots`, ~10 AM PT), the first line set with the information the model has. ESPN's "open" is DK's lookahead line (matched the Tuesday line in only 3 of 14 W10 games), so results against it overstate the model and are not used.

## Results against the Tuesday line (sides)
| Weeks | Edge 2+ | Edge 1-1.9 | All games |
|---|---|---|---|
| W3-4 (preseason DVOA) | 10-5 | 4-4 | 18-12 |
| W5-8 (in-season FTN, before the model went live) | **9-11** | | **22-33** |
| W9-10 (live weeks, without the QB adjustments) | 5-0 | | 19-10 |
| W3-10 | **24-16 (60%, p = 0.13)** | 12-18 | 59-55 |

- Mean absolute margin error: model 9.59 vs Tuesday market 9.14 overall. The model beat the market only in W9-10 (9.23 vs 9.52); W5-8 it was worse (10.57 vs 9.65).
- Tuesday-to-close line movement on 2+ edge picks: 13 toward the model, 11 away, 17 no move. No sign the market later agrees with the model.

## Totals
Fair-total edge 2+: **11-23**. Over picks 8-15, Under picks 3-8. The totals half of the model has no edge in either direction.

## Read
- The 2+ point side edge is not confirmed out of sample. W5-8, the four weeks before the model went live, went 9-11 at 2+ and 22-33 overall. The good record comes from W3-4 and W9-10.
- W9-10's live 14-5 may owe more to the weekly QB/injury adjustments than to the base model (this backtest leaves them out), or to luck; 40 graded 2+ edges is too few to tell.
- The fair-total edge should not be a reason to bet a total.
