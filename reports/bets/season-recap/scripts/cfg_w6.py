# Week 6 page config: AUTO DRAFT by scripts/gen_cfg.py (20261105-0135). Numbers are computed; strings marked [auto draft] need a human pass.
from recaps_w6 import R
FORCE_ANDY=()
RET={'bet_20261015_bkr_740279274_4team_teaser6': 100.5,
 'bet_20261015_bkr_740291356_9team_parlay_sunday': 1263.23,
 'bet_20261018_bkr_740441886_5team_ticketA_rebuild': 409.07,
 'bet_20261018_bkr_740479908_dal_gb_under56_hedge': 245.63,
 'bet_20261018_bkr_740483956_dal_gb_under55p5_live': 85.71,
 'bet_20261018_bkr_740488148_dal_plus15p5_live_hedge': 81.6}
BUCKETS=['Game-line parlay', 'Teaser', 'Single', 'Prop parlay / stack', 'Island SGP ladder (TNF/SNF/MNF)']
_FAM={'bet_20261013_bkr_740212915_9team_parlay': 'Game-line parlay',
 'bet_20261015_betonline_1005591415_lv_buf_spread_freebet': 'Promo / trade credit',
 'bet_20261015_betonline_1005675166_sea_den_prop8': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261015_betonline_1005682691_sea_den_sgp8': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261015_bkr_740269810_sgp2_sea_den': 'Game-line parlay',
 'bet_20261015_bkr_740279274_4team_teaser6': 'Teaser',
 'bet_20261015_bkr_740291356_9team_parlay_sunday': 'Game-line parlay',
 'bet_20261015_dkp_3pick_combo_sea_den': 'Promo / trade credit',
 'bet_20261015_dkp_5pick_combo_sea_den': 'Promo / trade credit',
 'bet_20261015_dkp_6pick_combo_sea_den': 'Promo / trade credit',
 'bet_20261015_dkp_7pick_combo_sea_den': 'Promo / trade credit',
 'bet_20261017_bkr_740404798_5team_parlay': 'Game-line parlay',
 'bet_20261017_bkr_740416960_5team_parlay': 'Game-line parlay',
 'bet_20261018_beo_1006732445_7leg_td_sack_stack': 'Prop parlay / stack',
 'bet_20261018_beo_w6_atd8_td_stack': 'Prop parlay / stack',
 'bet_20261018_beo_w6_slot3_5leg_parlay': 'Prop parlay / stack',
 'bet_20261018_bkr_740418415_6team_flex_sgp': 'Game-line parlay',
 'bet_20261018_bkr_740418657_3leg_first_td': 'Prop parlay / stack',
 'bet_20261018_bkr_740419086_8team_prop_stack_7d': 'Prop parlay / stack',
 'bet_20261018_bkr_740440846_5team_slot3_rebuild': 'Prop parlay / stack',
 'bet_20261018_bkr_740441886_5team_ticketA_rebuild': 'Game-line parlay',
 'bet_20261018_bkr_740444569_7team_chi_atl_over_props': 'Prop parlay / stack',
 'bet_20261018_bkr_740456086_6team_flex_sgp_rebuild': 'Prop parlay / stack',
 'bet_20261018_bkr_740479908_dal_gb_under56_hedge': 'Single',
 'bet_20261018_bkr_740482284_dal_ml_hedge': 'Single',
 'bet_20261018_bkr_740483359_dal_plus4_live_hedge': 'Single',
 'bet_20261018_bkr_740483956_dal_gb_under55p5_live': 'Single',
 'bet_20261018_bkr_740487866_dal_plus9p5_live_hedge': 'Single',
 'bet_20261018_bkr_740488148_dal_plus15p5_live_hedge': 'Single',
 'bet_20261018_dkp_5pick_combo_dal_gb': 'Promo / trade credit',
 'bet_20261018_dkp_6pick_combo_buf_dal_ari': 'Promo / trade credit',
 'bet_20261018_dkp_dal_plus3p5_live_hedge': 'Promo / trade credit',
 'bet_20261019_beo_1007037537_sgp6_primetime_insured': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261019_beo_8leg_mnf_was_sf_17900': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261019_dkp_6pick_combo_was_sf': 'Promo / trade credit',
 'bet_20261019_dkp_6pick_combo_was_sf_cmc_sf_ml': 'Promo / trade credit',
 'bet_20261019_dkp_6pick_combo_was_sf_final_boost25': 'Promo / trade credit'}
def bucket(t): return _FAM.get(t['id']) or 'Prop parlay / stack'
TOT_LO,TOT_HI=15,75
PROJ_LABEL='Master Intel fair line'
NOPROJ='— (no fair line logged)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
PROJ={}
NAMES={}
DIV=[]
NM=[('Week 6 9-team parlay (SEA ML / CLE +6 / BUF ML / ARI +14 / H (cash)', '8 of 9: Seattle Seahawks ML (actual SEA 14-17)'),
 ('Week 6 SuperContest 5-team parlay (3 legs placed, 2 open spo (cash)', '2 of 3: San Francisco 49ers -7 (actual SF 23-17)'),
 ('Week 6 Sunday 5-team parlay (HOU-JAX U44 / CHI -1 / GB ML /  (cash)', '4 of 5: HOU/JAX Under 44 (actual total 65)'),
 ('Week 6 Flex SGP 6-team (LV +5 & Over 52 SGP / CLE +3.5 / CHI (cash)', '5 of 6: Dallas Cowboys / Green Bay Packers Over 52.5 (actual total 36)'),
 ('DraftKings Predictions 6-Pick Combo +30% boost (Williams 20+ (promo)', '5 of 6: 30+ Daniels Rushing Yards (actual 10.0)')]
ORDER=['SEA@DEN', 'HOU@JAX', 'BAL@CLE', 'CAR@PHI', 'CHI@ATL', 'NO@NYG', 'NYJ@NE', 'PIT@TB', 'TEN@IND', 'ARI@LAR', 'BUF@LV', 'LAC@KC', 'DAL@GB', 'WSH@SF']
SEASON=[('1', 365.82, 80.56, 63, 136, ''),
 ('2', 428.79, 131.24, 107, 211, ''),
 ('3', 498.41, 39.21, 87, 206, ''),
 ('4', 401.32, 126.39, 85, 171, ''),
 ('5', 412.45, 25.21, 106, 207, ''),
 ('6', 902.95, 2185.74, 98, 180, '')]
TEXT={'eyebrow': 'Platinum Rose · 2026 Week 6 · settled · [auto draft]',
 'lede': '[auto draft] Every placed leg re-graded from ESPN box scores. Cash: 26 tickets, 6 won, $902.95 staked, $2185.74 back, net +$1,282.79. Promo: 11 tickets, $113.96 credit '
         '-> $9.09.',
 'kpis': [('$902.95', 'Cash staked · 26 tickets', False),
          ('$2185.74', 'Returned', False),
          ('+$1,282.79', 'Net for the week', False),
          ('98/180', 'Placed leg instances hit', False),
          ('6 of 26', 'Cash tickets that cashed', False)],
 'money_sub': '[auto draft] Stake and money back by ticket family (lib.py families; cash tickets only).',
 'proj_name': 'Fair line',
 'proj_sub': 'No fair-line projection was logged for this week.',
 'proj_callouts': [],
 'cats_sub': 'Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions).',
 'ai_sub': 'No machine-readable AI record exists for this week, so every placed leg shows as "not in AI record".',
 'ai_note': '[auto draft]',
 'ai_callouts': [('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}',
                  'Other placed props hit {pct(o["Player props"]["andy"])}%; unplaced AI props hit {pct(o["Player props"]["ai_only"])}%.')],
 'close_sub': 'Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number.',
 'games_sub': 'Each card shows the final, the fair line, the AI legs on the game and how our placed legs did. Recaps are an auto draft from the box score.',
 'method': ['Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w6games.json</span>; the two graders were cross-checked first '
            '(work/w6/crosscheck_w6.md).',
            'The AI record is <span class="mono">data/official-picks/ai-proposals/2026-w06.json</span> (empty for this week).',
            'Cash returned is the settled payout of cash-funded tickets (lib.py); DraftKings Predictions tickets count as tagged.',
            'Fair lines: none logged.',
            'Generated by scripts/postmortem.py (gen_cfg.py auto draft).']}
