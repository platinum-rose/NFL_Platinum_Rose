# Week 5 page config: AUTO DRAFT by scripts/gen_cfg.py (20261105-0135). Numbers are computed; strings marked [auto draft] need a human pass.
from recaps_w5 import R
FORCE_ANDY=()
RET={'bet_20261011_bkr_740069722_round_robin_6x2': 25.21}
BUCKETS=['Game-line parlay', '2-team RR', '4-team master RR', 'Prop parlay / stack', 'Island SGP ladder (TNF/SNF/MNF)']
_FAM={'bet_20261008_bkr_739927852': 'Game-line parlay',
 'bet_20261008_bkr_739929149': 'Game-line parlay',
 'bet_20261009_unknown_1003626841': 'Prop parlay / stack',
 'bet_20261009_unknown_1003628818': 'Prop parlay / stack',
 'bet_20261010_betonline_1004236400': 'Prop parlay / stack',
 'bet_20261011_betonline_1004387953': 'Prop parlay / stack',
 'bet_20261011_betonline_1004397711': 'Prop parlay / stack',
 'bet_20261011_betonline_1004398638': 'Prop parlay / stack',
 'bet_20261011_betonline_1004494024': 'Prop parlay / stack',
 'bet_20261011_betonline_1004549505_5team_parlay': 'Game-line parlay',
 'bet_20261011_betonline_1004561835': 'Prop parlay / stack',
 'bet_20261011_betonline_1004562475': 'Prop parlay / stack',
 'bet_20261011_betonline_7d_hybrid_8leg': 'Prop parlay / stack',
 'bet_20261011_betonline_7e_atd_7leg': 'Prop parlay / stack',
 'bet_20261011_betonline_8a_first_td_3leg': 'Prop parlay / stack',
 'bet_20261011_betonline_8b_2plus_td_3leg': 'Prop parlay / stack',
 'bet_20261011_betonline_snf_island_6leg': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261011_betonline_td_rebuild_6leg': 'Prop parlay / stack',
 'bet_20261011_bkr_740069722_round_robin_6x2': '2-team RR',
 'bet_20261011_bkr_740070028_8team_parlay': 'Game-line parlay',
 'bet_20261011_bkr_740070029_round_robin_8x4': '4-team master RR',
 'bet_20261011_bkr_740070077_6team_parlay': 'Game-line parlay',
 'bet_20261011_bkr_740070347_6team_parlay': 'Game-line parlay',
 'bet_20261011_bkr_740087500_supercontest_5team_parlay': 'Game-line parlay',
 'bet_20261011_bkr_740087501_supercontest_rr_5x2': '2-team RR',
 'bet_20261011_bkr_740093896_7team_parlay': 'Game-line parlay',
 'bet_20261011_bkr_740111777_5team_parlay': 'Game-line parlay',
 'bet_20261012_betonline_1004805051': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261012_betonline_1004819658': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261012_betonline_mnf_7leg_5900': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261012_betonline_mnf_8leg_14600': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261012_betonline_mnf_8leg_6700': 'Island SGP ladder (TNF/SNF/MNF)',
 'bet_20261012_dkp_2pick_combo_mnf_promo': 'Promo / trade credit',
 'bet_20261012_dkp_5pick_combo_mnf_promo': 'Promo / trade credit',
 'bet_20261012_dkp_8pick_combo_mnf_promo': 'Promo / trade credit'}
def bucket(t): return _FAM.get(t['id']) or 'Prop parlay / stack'
TOT_LO,TOT_HI=20,80
PROJ_LABEL='Master Intel fair line'
NOPROJ='— (no fair line logged)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
PROJ={}
NAMES={}
DIV=[]
NM=[('Week 5 Bookmaker TB @ DAL 2-team SGP #739927852 (cash)', '1 of 2: Over 47.5 (actual total 40)'),
 ('Week 5 7-team parlay (favorites + BUF +4) (cash)', '5 of 6: Atlanta Falcons Moneyline (actual ATL 23-30)'),
 ('Week 5 5-team parlay (SF +3.5 / DET ML / BUF-LAR O54 / ATL M (cash)', '4 of 5: Atlanta Falcons Moneyline (actual ATL 23-30)'),
 ('Week 5 5-team parlay (DET -4.5 / BUF +3.5 / DEN -3 / ATL ML  (cash)', '4 of 5: Atlanta Falcons Moneyline (actual ATL 23-30)'),
 ('Week 5 MNF BUF@LAR SGP 5-leg (Nacua TD, Allen TD, Cook 60+ r (cash)', '4 of 5: Davante Adams over 62.5 Receiving Yards (actual 51.0)')]
ORDER=['TB@DAL', 'PHI@JAX', 'CIN@MIA', 'CLE@NYJ', 'HOU@TEN', 'IND@PIT', 'LV@NE', 'MIN@NO', 'NYG@WSH', 'CHI@GB', 'DEN@LAC', 'DET@ARI', 'SF@SEA', 'BAL@ATL', 'BUF@LAR']
SEASON=[('1', 365.82, 80.56, 63, 136, ''),
 ('2', 428.79, 131.24, 107, 211, ''),
 ('3', 498.41, 39.21, 87, 206, ''),
 ('4', 401.32, 126.39, 85, 171, ''),
 ('5', 412.45, 25.21, 106, 207, '')]
TEXT={'eyebrow': 'Platinum Rose · 2026 Week 5 · settled · [auto draft]',
 'lede': '[auto draft] Every placed leg re-graded from ESPN box scores. Cash: 32 tickets, 0 won, $412.45 staked, $25.21 back, net −$387.24. Promo: 3 tickets, $50.24 credit -> '
         '$84.00.',
 'kpis': [('$412.45', 'Cash staked · 32 tickets', False),
          ('$25.21', 'Returned', False),
          ('−$387.24', 'Net for the week', True),
          ('106/207', 'Placed leg instances hit', False),
          ('0 of 32', 'Cash tickets that cashed', True)],
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
 'method': ['Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w5games.json</span>; the two graders were cross-checked first '
            '(work/w5/crosscheck_w5.md).',
            'The AI record is <span class="mono">data/official-picks/ai-proposals/2026-w05.json</span> (empty for this week).',
            'Cash returned is the settled payout of cash-funded tickets (lib.py); DraftKings Predictions tickets count as tagged.',
            'Fair lines: none logged.',
            'Generated by scripts/postmortem.py (gen_cfg.py auto draft).']}
