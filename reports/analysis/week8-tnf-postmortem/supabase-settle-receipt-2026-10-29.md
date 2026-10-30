# Supabase settle receipt — Week 8 TNF (2026-10-29 ~21:45 PT)

Approved by Andy at 21:43 PT ("approved for the Supabase settle for the 8 lost TNF tickets").
Project aambmuzfcojxqvbzhngp, table `user_bankroll_bets`. One UPDATE (guarded by `status='pending'`); SQL saved at `tmp_claude_lt/settle-tnf.sql`.

Set on each row: `status='lost'`, `result='loss'`, `profit=-amount`, `graded=true`, `settled_at/graded_at/updated_at=now()`, and per-leg `result` and `stat` from the ESPN 401873023 box score.

| id | profit | leg results |
|---|---:|---|
| bet_20261029_dkp_tnf_6pick_car_gb_boost30 | 0 (promo) | W L W W W W |
| bet_20261029_beo_1010127424_prop4_tnf_car_gb | −6.02 | W W W L |
| bet_20261029_beo_1010107890_prop8_tnf_car_gb | −5.00 | W W L W W W L W |
| bet_20261029_beo_1010136110_sgp8_tnf_car_gb | −10.00 | L W L L W L W L |
| bet_20261029_dkp_tnf_7pick_car_gb_boost20 | 0 (promo) | W L L W W W W |
| bet_20261029_dkp_48337161_2pick_car_gb | 0 (promo) | L W |
| bet_20261027_bkr_740904942_6team_ml_parlay | −5.00 | L, Sunday legs left pending (moot) |
| bet_20261027_bkr_740900674_sgp2_car4_over46 | −25.00 | L P |

Cash total −$51.02. Not touched: BKR 740983886 and 740984963, which are still pending; their TNF legs won (Jacobs ATD, Love 2+ TD) in the local wagers file only.
