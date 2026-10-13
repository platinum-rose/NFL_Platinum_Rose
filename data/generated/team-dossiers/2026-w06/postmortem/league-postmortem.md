# League post-mortem, W1–W5 (Week 6 synthesis input)
Built from dossier 2026-w06. No market data, no player names. Sorted by net points/game.

| Team | Rec | Net pts/g | YPP diff | Off EPA rk | Def EPA rk | Pythag delta | TO mrg | Trend | Flags |
|---|---|---|---|---|---|---|---|---|---|
| SF | 5-0-0 | +12.2 | +1.84 | #1 | #6 | +1.16 | +2 | declining | overperforming_results, rz_hot, pass_off_strong |
| JAX | 4-1-0 | +10.6 | +0.18 | #5 | #4 | +0.04 | +5 | improving | positive_to_luck, pass_off_strong |
| KC | 4-0-0 | +10.3 | +1.73 | #4 | #9 | +1.07 | +5 | flat | overperforming_results, positive_to_luck, pass_rush_strong |
| MIN | 5-0-0 | +9.0 | 0.00 | #29 | #1 | +1.10 | +6 | improving | overperforming_results, positive_to_luck, results_above_efficiency, pass_rush_strong, close_game_lucky |
| SEA | 3-2-0 | +5.8 | +1.40 | #26 | #2 | -0.20 | +2 | declining | pass_rush_strong |
| BAL | 4-1-0 | +5.4 | +1.16 | #6 | #16 | +0.91 | +3 | declining | overperforming_results, rz_hot, pass_off_strong, rush_off_strong |
| BUF | 4-1-0 | +4.6 | +1.26 | #2 | #31 | +1.06 | -4 | flat | overperforming_results, negative_to_luck, pass_def_weak, pass_off_strong, rush_off_strong |
| CHI | 3-2-0 | +4.6 | -0.68 | #13 | #19 | -0.12 | -4 | declining | negative_to_luck, rz_cold, rush_def_weak |
| CIN | 3-2-0 | +3.8 | -0.18 | #10 | #13 | +0.03 | +2 | flat | — |
| DET | 3-2-0 | +3.2 | +0.28 | #3 | #30 | +0.20 | +4 | improving | positive_to_luck, rz_hot, rush_off_strong |
| NE | 3-2-0 | +3.2 | +0.58 | #9 | #17 | +0.04 | -5 | flat | negative_to_luck |
| CAR | 2-2-0 | +3.0 | +0.40 | #8 | #26 | -0.25 | +3 | flat | — |
| LV | 3-2-0 | +0.6 | -0.94 | #15 | #20 | +0.43 | +3 | declining | pass_pro_weak, pass_rush_strong, rush_def_weak |
| NYG | 3-1-1 | +0.6 | -0.92 | #18 | #21 | +0.92 | +1 | improving | overperforming_results, close_game_lucky |
| DAL | 2-3-0 | +0.4 | -0.66 | #7 | #32 | -0.54 | -3 | flat | rz_hot, pass_def_weak |
| PIT | 3-2-0 | +0.4 | -0.16 | #23 | #18 | +0.45 | +2 | improving | rush_off_strong |
| LAR | 2-3-0 | -0.2 | +1.22 | #11 | #11 | -0.48 | -3 | declining | — |
| HOU | 1-4-0 | -0.4 | +0.38 | #14 | #9 | -1.45 | +3 | improving | underperforming_results, close_game_unlucky |
| ATL | 2-3-0 | -0.6 | +0.82 | #12 | #8 | -0.43 | -5 | improving | negative_to_luck, pass_rush_strong |
| NYJ | 2-3-0 | -0.6 | +0.38 | #20 | #5 | -0.41 | +3 | flat | — |
| GB | 3-2-0 | -1.6 | +0.88 | #19 | #12 | +0.72 | +3 | improving | rush_def_weak |
| TB | 1-4-0 | -2.4 | -0.28 | #27 | #7 | -1.17 | -2 | flat | underperforming_results, pass_pro_weak |
| DEN | 3-2-0 | -2.8 | -0.58 | #24 | #14 | +0.90 | +1 | flat | overperforming_results, close_game_lucky |
| IND | 2-3-0 | -2.8 | -1.58 | #21 | #28 | -0.18 | -6 | flat | negative_to_luck, rush_def_weak |
| CLE | 3-2-0 | -3.8 | -0.50 | #25 | #15 | +1.04 | -1 | flat | overperforming_results, pass_pro_weak, pass_rush_strong |
| PHI | 2-3-0 | -4.0 | -0.80 | #30 | #23 | +0.07 | -2 | declining | pass_pro_weak |
| NO | 1-4-0 | -6.6 | -1.12 | #22 | #27 | -0.79 | -6 | declining | underperforming_results, negative_to_luck, rz_hot, rush_def_weak |
| WAS | 1-3-1 | -6.8 | -0.40 | #16 | #22 | -0.26 | +5 | improving | positive_to_luck |
| LAC | 0-5-0 | -9.0 | -0.22 | #32 | #3 | -1.33 | -5 | flat | underperforming_results, negative_to_luck, results_below_efficiency, pass_pro_weak, close_game_unlucky |
| TEN | 0-5-0 | -10.2 | -0.70 | #31 | #24 | -0.92 | -5 | declining | underperforming_results, negative_to_luck, pass_def_weak, close_game_unlucky |
| ARI | 1-4-0 | -10.8 | -1.82 | #17 | #29 | -0.38 | +2 | flat | pass_def_weak |
| MIA | 0-5-0 | -12.4 | -0.54 | #28 | #25 | -0.91 | -4 | improving | underperforming_results, negative_to_luck, pass_def_weak |

## Regression watchlists (descriptive)
- Results ahead of underlying efficiency: MIN
- Results behind underlying efficiency: LAC
- Wins ahead of point differential: SF, KC, MIN, BAL, BUF, NYG, DEN, CLE
- Wins behind point differential: HOU, TB, NO, LAC, TEN, MIA
- Positive turnover luck: JAX, KC, MIN, DET, WAS · negative: BUF, CHI, NE, ATL, IND, NO, LAC, TEN, MIA
- Weak pass protection: LV, TB, CLE, PHI, LAC · strong pass rush: KC, MIN, SEA, LV, ATL, CLE
- Trending up (last 2 games): JAX, MIN, DET, NYG, PIT, HOU, ATL, GB, WAS, MIA · down: SF, SEA, BAL, CHI, LV, LAR, PHI, NO, TEN
