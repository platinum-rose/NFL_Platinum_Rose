from recaps_w2 import R
from ai_recs_w2 import PROJ
FORCE_ANDY=()
RET={'bet_20260917_738851934_bkr_sgp_2team':70.02,'bet_20260920_739004327_bm_compact_round_robin':44.83,'bet_20260920_739003867_bm_compact_round_robin':16.39}
BUCKETS=['Game-line parlays','Round robins','Sunday BEO prop parlays','TNF props & SGP','SNF/MNF island tickets']
def bucket(t):
    i=t['id']
    if 'round_robin' in i: return 'Round robins'
    if 'indkc' in i or 'nyglar' in i: return 'SNF/MNF island tickets'
    if 'tnf' in i or '738851934' in i: return 'TNF props & SGP'
    if 'beo' in i: return 'Sunday BEO prop parlays'
    return 'Game-line parlays'
TOT_LO,TOT_HI=10,80
PROJ_LABEL='Market-implied score'
NOPROJ='— (no saved TNF board)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
NAMES={'bet_20260917_996990924_tnf_8leg_shootout_parlay':'TNF 8-leg shootout','bet_20260920_beo_indkc_sgp8_2010':'SNF IND@KC 8-leg SGP','bet_20260917_997008979_tnf_6leg_prop_spread_parlay':'TNF 6-leg prop/spread','bet_20260920_bkr_indkc_sgp6_1959':'SNF IND@KC 6-leg SGP','bet_20260920_bkr_indkc_sidetotal_739074857':'SNF IND +6.5 / Under 46.5','bet_20260917_997008079_tnf_det_spread_freebet':'TNF DET +5.5 (free bet)','bet_20260917_738851934_bkr_sgp_2team':'TNF BUF −5 / Over 54 SGP','bet_20260921_mnf_nyglar_7leg_chalk':'MNF 7-leg chalk','bet_20260917_996992070_tnf_6leg_prop_parlay':'TNF 6-leg props','bet_20260920_739004834_bm_6team_parlay':'6-team parlay #739004834','bet_20260920_739003737_bm_5team_parlay':'5-team parlay #739003737','bet_20260920_739003866_bm_5team_parlay':'SC-fade 5-team #739003866','bet_20260920_739003807_bm_5team_parlay':'Former SC card 5-team #739003807'}
DIV=[
('SC','SuperContest five','MIN +5.5 / DEN −2.5 / NYJ +3.5 / MIA +13.5 / WAS +4.5','LAC −6.5 / WAS +4 / MIA +14 / LAR −6.5 / DEN −2.5','AI 3/5; official card 2/5 (LAC lost outright)','AI'),
('RR','Dog-ML RR','NYJ / ATL / WAS / ARI / MIN / IND ML','NYJ / CLE / LV / WAS / MIA / CIN ML','AI 1/6 (MIN); placed 3/6 → +$24.88','Andy'),
('RR','Master RR','DEN −3 / U39 / LAR −6.5 / MIA +13 / TB −8.5 / MIN +5 / NYJ +3 / IND +6.5','LAR −6.5 / DEN −2.5 / U40.5 / CHI −4 / TB −7 / GB-NYJ U45 / MIA +14 / WAS +5','AI 4 wins + push ≈ $10.41 back; placed 3/8 → $0','AI'),
('Chalk','ML parlays','AM chalk: TB / BAL / PHI / NE / CHI / DEN / KC ML','11-team ML: BUF / GB / TB / PHI / LAC / BAL / CAR / MIA +14 / DAL / NE / ARI +4','Both dead on TB and BAL losing outright','Push'),
('7a','Morning props','Jefferson 7+ / Barkley 80+ / Bijan 82+ / Chase 7+ / Bateman 40+ / Lloyd 14+ car','7-leg: Jefferson, Watt sack, Gesicki, Irving yds, Vele, Lloyd T+A, Hill T+A','AI 2/6; placed 4/7','Andy'),
('7b','Afternoon props','McBride 7+ / JSN 82+ / Lamb 6+ / P. Washington 5+ / CMC 63+ / Jeanty 63+','Afternoon 8 and 6 (Mayer, K. Allen, Singleton, Rodriguez, Crosby, Nailor...)','AI 4/6 (CMC 23, Jeanty 48); placed 4/8 and 2/6','AI closer'),
('D4','Afternoon 6','Njoku 3+ rec','Nailor 3+ rec','Njoku 1 catch, Nailor 1 catch: both lost','Push'),
('SNF','IND@KC combos','4-pick: Walker 81+ / Rice 50+ / Pierce 45+ / K. Allen 4+','8-leg and 6-leg SGPs built on Pierce','Pierce (1 catch, 11 yds) sank every version','Push'),
('A','Standalone','Jefferson 7+ receptions (Grade A)','Jefferson on the morning 7-leg','3 catches: lost','Push'),
('MNF','NYG@LAR','Tier 1: Kyren 64+ / Skattebo 50+ / Likely 46+ yds; LAR −6.5','Five SGPs on Dart, Nabers, Singletary, Skattebo; LAR/under side-total','AI T1 1/3; all five SGPs lost after Dart left in Q1; LAR −6.5 won','Push'),
]
NM=[('SNF IND@KC 8-leg SGP (+15700)','7 of 8: Alec Pierce 1 catch'),('SNF IND@KC 6-leg SGP (+3600)','5 of 6: Pierce 11 yds (needed 46)'),('TNF 8-leg shootout (+5500)','7 of 8: Shakir 38 yds (needed 44.5)'),('TNF 6-leg prop/spread (+1400)','5 of 6: Goff threw no INT'),('SNF IND +6.5 / Under 46.5','Under lost when OT pushed the total to 63'),('NYJ +3 (Master RR)','Pushed on the OT field goal'),('PHI/TEN Under 39 / 40 / 40.5','Final 44 after a TD with 9 seconds left'),('Bijan 82+ rush (AI 7a)','72 yards')]
ORDER=['DET@BUF','CAR@ATL','CIN@HOU','CLE@TB','GB@NYJ','MIN@CHI','NO@BAL','PHI@TEN','PIT@NE','JAX@DEN','LV@LAC','MIA@SF','SEA@ARI','WSH@DAL','IND@KC','NYG@LAR']
TEXT=dict(
eyebrow='Platinum Rose · 2026 Week 2 · TNF through MNF · settled',
lede='Every placed leg was re-graded from ESPN box scores, along with the Week 2 card v2 and the BKR-priced prop card. Three of 34 tickets paid, all two-leg or two-team structures. The market-implied board picked 10 of 15 winners, and games finished {M["tot_err"]:.1f} points under it on average. Five tickets died on exactly one leg, three of them on a single player.',
kpis=[('$428.79','Cash staked · 34 tickets ($10 BEO free bet excluded)',False),('$131.24','Returned: TNF BUF/Over SGP, dog-ML RR, SC-fade RR',False),('−$297.55','Net for the week',True),('107/211','Placed leg instances hit (51%)',False),('10/15','Market-implied board picked the right winner',False)],
money_sub='TNF was the one profitable family (+$28 on $42). The two 2-team round robins paid; the $105 master RR hit 3 of 8 legs and returned nothing. The SNF and MNF island tickets cost $100.78 and returned nothing.',
proj_name='Market-implied',
proj_sub='Week 2 had no model projection, so the open circles are the market-implied scores from the Week 2 master report (total and spread split between the teams); filled circles are the finals. Games landed {M["tot_err"]:.1f} points under the implied total on average, led by MIN/CHI (12 vs 47) and CIN/HOU (26 vs 46).',
proj_callouts=[('Winner picks: 10 of 15','Favorites that lost outright: TB, BAL, LAC, HOU and CHI. TB, BAL and LAC were the anchors of both ML chalk parlays.'),('Totals mostly under','10 of 15 games finished under the implied total. IND/KC (63 in OT) and WAS/DAL (57) were the big exceptions.'),('Margin error {M["mae"]:.1f} pts','CAR/ATL (a 31-point CAR win) and SEA/ARI (24) were the biggest misses.')],
cats_sub='Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions; the GB −3 push is left out). Passing TDs (5 of 6) and moneylines (11 of 17) were the best. Dog spreads went 6 for 16, anytime TDs 13 for 32 and rushing yards 3 for 8.',
ai_sub='The Week 2 AI record is the Saturday-night card v2 (standalones, master RR, dog-ML RR, chalk parlays, SuperContest five) plus the BKR-priced prop card. The ledger with the twelve Sunday divergences (D1–D12) is gone, so only D4 is shown by name.',
ai_note='TNF and most MNF tickets have no saved AI card, so part of the "Not in AI record" group was built with Claude in-session. The Week 2 analysis graded all twelve lost divergences IRRELEVANT: a shared leg missed on every ticket.',
ai_callouts=[('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}','The props that matched the AI card hit {pct(o["Player props"]["agree"])}%, the best group on the page. Other placed props hit {pct(o["Player props"]["andy"])}%.'),('Other placed sides: {o["Sides & totals"]["andy"][0]} of {o["Sides & totals"]["andy"][1]}','The dog-ML RR swapped in CLE, LV, MIA and CIN for ATL, ARI, MIN and IND. The AI six went 1 for 6; the placed six paid $44.83.'),('AI SuperContest: 3 of 5','MIN, DEN and NYJ covered; the official card (LAC, WAS, MIA, LAR, DEN) went 2 of 5.')],
close_sub='Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number. Five placed tickets died on exactly one leg; Alec Pierce alone cost the two SNF SGPs about $1,300 of payout.',
games_sub='Each card shows the final and linescore, the market-implied score, the AI read from card v2, what decided the game, and how our placed legs on it did.',
method=['Leg results come from the ESPN box scores in <span class="mono">data/fantasy/boxscores/</span> (16 finals). Scoring plays decide TD and first-TD legs. A player missing from the box score counts as a loss.','The AI record is <span class="mono">docs/cards/2026-W02-sun-mon-card-draft.md</span> (card v2) and <span class="mono">docs/cards/2026-W02-props-card.md</span> (BKR-priced props). There is no saved TNF card.','Round-robin returns are the Bookmaker settlements confirmed in the Week 2 analysis: $44.83 (dog-ML RR) and $16.39 (SC-fade RR).','The wagers file marks four MNF legs LOST that hit in the box score (Likely 4+ rec: 5; Newsome 3+ T+A: 5; Malachi Fields 27+ yds: 30 and 2+ rec: 2). None changes a ticket result.'],
)
