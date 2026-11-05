# Week 7 page config: AUTO DRAFT by scripts/gen_cfg.py (20261105-0135). Numbers are computed; strings marked [auto draft] need a human pass.
from recaps_w7 import R
FORCE_ANDY=()
RET={'bet_20261025_bkr_740807158_sc_compact_rr_2s': 13.52}
BUCKETS=['Game-line parlay', '2-team RR', 'Teaser', 'Prop parlay / stack', 'Island SGP ladder (TNF/SNF/MNF)']
_FAM={'bet_20261019_bkr_740506458_3team_teaser': 'Teaser',
 'bet_20261019_bkr_740512242_6team_flex_sgp_xweek': 'Game-line parlay',
 'bet_20261022_beo_1007918593_sgp5_propshop_ne_chi': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261022_beo_1007934817_tnf_7leg_chi_ml': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261022_beo_1007940273_tnf_8leg_ne_chi': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261022_bkr_740627432_8team_parlay': 'Game-line parlay',
 'bet_20261022_bkr_740627731_8team_open2': 'Game-line parlay',
 'bet_20261022_bkr_740636092_9team_lottery': 'Game-line parlay',
 'bet_20261022_bkr_740636102_10team_lottery': 'Game-line parlay',
 'bet_20261022_dkp_43564438_7pick_tier3_boost25_ne_chi': 'Promo / trade credit',
 'bet_20261022_dkp_43579067_6pick_tier3_ne_chi': 'Promo / trade credit',
 'bet_20261022_dkp_43591231_4pick_tier1_ne_chi': 'Promo / trade credit',
 'bet_20261022_dkp_43598793_5pick_tier2_ne_chi': 'Promo / trade credit',
 'bet_20261025_beo_1008680961_week_7_beo_8leg_crossgame_parlay': 'Prop parlay / stack',
 'bet_20261025_beo_1008725429_week_7_beo_dog_ml_round_robin_by_2s': '2-team RR',
 'bet_20261025_beo_1008729493_week_7_beo_6leg_prop_parlay': 'Prop parlay / stack',
 'bet_20261025_beo_1008731202_week_7_beo_6leg_prop_parlay': 'Prop parlay / stack',
 'bet_20261025_beo_1008919809_week_7_beo_4leg_prop_parlay': 'Prop parlay / stack',
 'bet_20261025_beo_1008920800_week_7_beo_5leg_prop_parlay': 'Prop parlay / stack',
 'bet_20261025_beo_1008926148_week_7_beo_8leg_prop_parlay': 'Prop parlay / stack',
 'bet_20261025_bkr_740807098_sc_5team_parlay': 'Game-line parlay',
 'bet_20261025_bkr_740807158_sc_compact_rr_2s': '2-team RR',
 'bet_20261025_bkr_740821195_4team_spread_parlay': 'Game-line parlay',
 'bet_20261025_bkr_740822735_5team_sgp_parlay': 'Game-line parlay',
 'bet_20261025_bkr_740837231_snf_island_sgp_5leg': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261025_dkp_45451260_8pick_7e_atd_lottery': 'Promo / trade credit',
 'bet_20261025_dkp_45474408_4pick_kraft_love_mahomes_tbcar_over': 'Promo / trade credit',
 'bet_20261025_dkp_45488862_5pick_int_pressure_combo': 'Promo / trade credit',
 'bet_20261025_dkp_45868275_8pick_boost30_rebuild_no_rodgers': 'Promo / trade credit',
 'bet_20261025_dkp_46447402_4pick_snf_atd_kc_sea': 'Promo / trade credit',
 'bet_20261025_dkp_46464866_8pick_snf_kc_sea': 'Promo / trade credit',
 'bet_20261026_bkr_740869210_mnf_sgp_6leg': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261026_bkr_740869686_mnf_sgp_5leg': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261026_bkr_740871157_mnf_2team_u445_dal_m25': 'Game-line parlay',
 'bet_20261026_dkp_46908050_6pick_mnf_dal_phi': 'Promo / trade credit',
 'bet_20261026_dkp_46920838_8pick_mnf_dal_phi': 'Promo / trade credit',
 'bet_20261026_dkp_46957964_6pick_mnf_dal_phi': 'Promo / trade credit',
 'bet_20261026_dkp_46998409_5pick_mnf_dal_phi': 'Promo / trade credit',
 'bet_20261026_dkp_47012140_5pick_mnf_dal_phi': 'Promo / trade credit'}
def bucket(t): return _FAM.get(t['id']) or 'Prop parlay / stack'
TOT_LO,TOT_HI=15,70
PROJ_LABEL='Master Intel fair line'
NOPROJ='— (no fair line logged)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
PROJ={}
NAMES={}
DIV=[]
NM=[('Cross-week Flex SGP 6-team (WAS +7.5 / Under 52 SGP; Bears / (cash)', '5 of 6: Kansas City Chiefs +3.5 (actual KC 3-20)'),
 ('BKR 3-team 6-pt football teaser (SF -1, MIN -0.5, KC +8) (cash)', '2 of 3: Kansas City Chiefs +8 (teased from +2) (actual KC 3-20)'),
 ('DraftKings Predictions 4-Pick Combo (7% implied): Tucker Kra (promo)', '3 of 4: Patrick Mahomes 2+ Passing Touchdowns (actual 0.0)'),
 ('BKR 5-team parlay (GB@DET Under 57 + GB +4.5, KC@SEA SEA ML  (cash)', '4 of 5: Over 41 (SGP with SEA ML) (actual total 23)'),
 ('BKR MNF SGP 6-leg moonshot (Javonte 1st TD, Lamb TD, Barkley (cash)', '5 of 6: Javonte Williams Player To Score 1st Touchdown (actual Saquon Barkley)'),
 ('BKR MNF 2-team parlay: Under 44.5 + Dallas -2.5 (cash)', '1 of 2: Under 44.5 (actual total 59)'),
 ('DraftKings Predictions 5-Pick Combo (3.2% implied), MNF DAL  (promo)', '4 of 5: Dallas Goedert Anytime TD Scorer (actual 0.0)'),
 ('Platinum Rose AI Hybrid A (BEO, no Paris game) (paper)', '3 of 4: Under 39.5 (actual total 53)'),
 ('Platinum Rose AI Hybrid B (BEO, no Paris game) (paper)', '3 of 4: Patrick Mahomes pass TD Over 1.5 (actual 0.0)'),
 ('Platinum Rose AI A Receiving-Yards Core 4-Leg (SNF cap) (paper)', '3 of 4: Sam LaPorta receiving yds Over 40.5 (actual 18.0)'),
 ('Platinum Rose AI MNF Island Tier 1 (fresh) (paper)', '3 of 4: CeeDee Lamb receptions Over 6.5 (actual 5.0)'),
 ('Platinum Rose AI MNF Island Tier 3 moonshot (fresh) (paper)', '4 of 5: Javonte Williams first TD (actual Saquon Barkley)')]
ORDER=['NE@CHI', 'PIT@NO', 'CIN@BAL', 'CLE@TEN', 'IND@MIN', 'MIA@NYJ', 'NYG@HOU', 'SF@ATL', 'TB@CAR', 'DEN@ARI', 'GB@DET', 'LAR@LV', 'KC@SEA', 'DAL@PHI']
SEASON=[('1', 365.82, 80.56, 63, 136, ''),
 ('2', 428.79, 131.24, 107, 211, ''),
 ('3', 498.41, 39.21, 87, 206, ''),
 ('4', 401.32, 126.39, 85, 171, ''),
 ('5', 412.45, 25.21, 106, 207, ''),
 ('6', 902.95, 2185.74, 98, 180, ''),
 ('7', 292.57, 13.52, 110, 227, '')]
TEXT={'eyebrow': 'Platinum Rose · 2026 Week 7 · settled · [auto draft]',
 'lede': '[auto draft] Every placed leg re-graded from ESPN box scores. Cash: 24 tickets, 0 won, $292.57 staked, $13.52 back, net −$279.05. Promo: 15 tickets, $94.94 credit -> '
         '$139.00.',
 'kpis': [('$292.57', 'Cash staked · 24 tickets', False),
          ('$13.52', 'Returned', False),
          ('−$279.05', 'Net for the week', True),
          ('110/227', 'Placed leg instances hit', False),
          ('0 of 24', 'Cash tickets that cashed', True)],
 'money_sub': '[auto draft] Stake and money back by ticket family (lib.py families; cash tickets only).',
 'proj_name': 'Fair line',
 'proj_sub': 'No fair-line projection was logged for this week.',
 'proj_callouts': [],
 'cats_sub': 'Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions).',
 'ai_sub': 'AI record: 152 distinct legs (paper ledger). A placed leg counts as AI-backed when the same proposition is in that record.',
 'ai_note': '[auto draft]',
 'ai_callouts': [('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}',
                  'Other placed props hit {pct(o["Player props"]["andy"])}%; unplaced AI props hit {pct(o["Player props"]["ai_only"])}%.')],
 'close_sub': 'Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number.',
 'games_sub': 'Each card shows the final, the fair line, the AI legs on the game and how our placed legs did. Recaps are an auto draft from the box score.',
 'method': ['Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w7games.json</span>; the two graders were cross-checked first '
            '(work/w7/crosscheck_w7.md).',
            'The AI record is <span class="mono">data/official-picks/ai-proposals/2026-w07.json</span>.',
            'Cash returned is the settled payout of cash-funded tickets (lib.py); DraftKings Predictions tickets count as tagged.',
            'Fair lines: none logged.',
            'Generated by scripts/postmortem.py (gen_cfg.py auto draft).']}
