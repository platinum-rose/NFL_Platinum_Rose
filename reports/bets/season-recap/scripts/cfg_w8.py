import os,json
from recaps_w8 import R
from ai_recs_w8 import PROJ
FORCE_ANDY=()
_H=os.path.dirname(os.path.abspath(__file__))
# Cash returned per ticket = stake + profit_usd from the wagers ledger (cash tickets only; promo credits and the free bet excluded).
_W=json.load(open(os.path.join(_H,'..','..','..','..','data','official-picks','user-placed-wagers-2026.json')))
RET={w['id']:round((w.get('stake_usd') or 0)+(w.get('profit_usd') or 0),2) for w in _W
     if w.get('week')==8 and w.get('funding_type') not in ('promo_credit','free_bet') and (w.get('profit_usd') or -1e9)>-(w.get('stake_usd') or 0)}
BUCKETS=['TNF tickets','BKR game-line parlays','Round robins','DraftKings Predictions','BEO prop parlays','BKR split SGP / ATD','FanDuel qualifiers']
def bucket(t):
    i=t['id']
    if 'round_robin' in i or '_rr_' in i: return 'Round robins'
    if 'tnf' in i or 'car4_over46' in i: return 'TNF tickets'
    if '_dkp_' in i: return 'DraftKings Predictions'
    if '_fdp_' in i: return 'FanDuel qualifiers'
    if 'flex_sgp' in i or 'atd_alejandro' in i: return 'BKR split SGP / ATD'
    if '_bkr_' in i: return 'BKR game-line parlays'
    return 'BEO prop parlays'
TOT_LO,TOT_HI=10,85
PROJ_LABEL='Master Intel fair line'
NOPROJ='— (TNF: no fair line in the Week 8 synthesis)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
NAMES={
'bet_20261031_dkp_6pick_aaa_tuten_irving_allen_rodgers_schwesinger_nacua':'A-A-A DK 6-pick (Tuten / Irving / Allen / Rodgers / Schwesinger / Nacua) — won $609',
'bet_20261029_bkr_740983886_11team_weekend_parlay':'BKR 11-team weekend (D50 build)','bet_20261029_bkr_740984963_10team_weekend_parlay':'BKR 10-team weekend (D51 build)',
'bet_20261031_bkr_741127297_sc_5team_parlay':'SuperContest 5-team parlay','bet_20261031_bkr_741127298_sc_compact_rr_2s':'SuperContest compact RR by 2s (returned $5.10)',
'bet_20261027_bkr_740900674_sgp2_car4_over46':'TNF SGP CAR +4 / Over 46','bet_20261029_dkp_tnf_6pick_car_gb_boost30':'TNF DK 6-pick (promo)',
'bet_20261102_bkr_1011531336_mnf_chi_sea_2team':'MNF BKR 2-team CHI +3 / Under 47.5','bet_20261031_fdp_day2_qualifier_jax_ml':'FDP Day 2 qualifier JAX ML (won)',
}
DIV=[
('TNF','CAR@GB ladder','S1 Jacobs 77+ R+R / Young INT / Kraft 5+ / Young U10.5 rush; S3/S3b volume (Young 23+ cmp, Metchie, Hubbard rec); D53 Under 47.5 + four straights','DK 6-pick promo (McKinney / Jacobs carries / Young INT / Kraft / Watson rec / Hubbard ATD); BEO 4-, 8-leg and SGP 8; BKR CAR +4 / Over 46','Paper S3 and S3b went 5 of 5 and S4 rebuilt 3 of 4; Under 47.5 won. No placed TNF ticket cashed; the DK 6-pick missed by one tackle (McKinney 3)','AI'),
('D50/D51','Weekend parlays','D50 11 legs (Jacobs ATD, BUF/DAL/PIT/LAR/NE/WSH ML, Chase/Irving ATD, two Unders); D51 9 legs','BKR 11-team and 10-team built from the same lists','Placed 8/11 and 7/10; AI 8/11 and 7/9. DAL ML, both bought Unders and Stevenson ATD lost','Push'),
('SC','SuperContest five','CIN −10.5 / BAL +3.5 / CLE +3.5 / LAC +6.5 / CHI +3','Official card with JAX and MIN swapped in','AI 1-4 (CHI only); official 2-3','Andy'),
('Singles','Friday card totals','ARI/DAL U54.5, BAL/BUF O55, IND/JAX U46, NE/MIA U43.5 at $20 each','Not placed','1-3 on paper (NE/MIA Under by half a point): skipping saved about $42','Andy'),
('RR','Round robins','Master RR 8 legs by 4s ($70) and dog-ML RR by 2s ($20)','SuperContest compact RR by 2s ($15)','Master RR 2/8 on paper, no four-leg combo cashes; dog RR 2/5 (ARI, CHI). Placed compact RR returned $5.10','Andy'),
('Props','Card prop templates','7a/7b/7d, Core 8, Lottery 13, 7e ATD, 8a first TD, 8b 2+ TD','DK Predictions and BEO stacks built off the same reads','Every template lost: Okonkwo 4+ rec (2) on five templates, Warren rec yds (0) on four, Ward U191.5 (304) on four','Push'),
('A-A-A','The winner','Tuten, Irving and Allen ATD sat on D50/D51','A-A-A DK six-pick: Tuten / Irving / Allen / Rodgers / Schwesinger / Nacua','6 of 6, $14.98 → $609: the whole week’s cash result','Andy'),
('SNF','PHI@WSH ladder','T1 McKee 20+ / Okonkwo 4+ / Barkley 51+; T2 Daniels 2+ TD / Diggs 5+ / Lemon ATD; T3 three receiving TDs','Five DK Predictions SNF tickets (split and solo)','AI T1 1/3, T2 0/3, T3 0/3; placed 3/6, 3/6, 2/3, 5/8, 6/8. None cashed','Push'),
('MNF','CHI@SEA','Five paper SGPs; Safer 2-leg went 2 of 2','BKR CHI +3 / Under 47.5; DK SEA +3.5 single and 2-pick; FDP bonuses M1/M2','FDP bonuses hit (4/4, 5/5) on promo; the Under (51) sank the BKR 2-team and SEA +3.5 lost','AI closer'),
]
NM=[('TNF DK 6-pick (+3458, promo)','5 of 6: McKinney 3 T+A, needed 4'),('FDP bonus 1-D 6-leg (promo)','5 of 6: Zay Flowers 0 rec yds after Lamar left'),
('FDP bonus 2 T1 5-leg (promo)','4 of 5: Javonte Williams, no TD'),('FDP Day 1 qualifier 5-ML','4 of 5: DAL lost 30–33 in OT'),
('Amanda solo DK 3-pick (+345)','2 of 3: Stafford threw 1 TD, needed 2'),('MNF BKR 2-team (+262)','1 of 2: total 51 against Under 47.5'),
('Alejandro DK 3-pick ATD (+2328)','2 of 3: Darnell Washington, no TD'),('AI TNF S1 (paper)','3 of 4: Jacobs 52 R+R, needed 77'),
('Amon-Ra St. Brown 8+ rec (7d, Core 8, Lottery)','7 catches'),('Jaxon Smith-Njigba 8+ rec (Lottery, MNF SGP)','6 catches, 118 yds')]
ORDER=['CAR@GB','ARI@DAL','ATL@TB','BAL@BUF','CLE@PIT','IND@JAX','LV@NYJ','MIN@DET','TEN@CIN','LAC@LAR','KC@DEN','NE@MIA','PHI@WSH','CHI@SEA']
# Season rows from the wagers ledger (cash only: stake + profit_usd). Leg hits: W1-W4 recap pages, W5-W7 ledger leg status, W8 box-score regrade.
SEASON=[('1',365.82,80.56,63,136,''),('2',428.79,131.24,107,211,''),('3',498.41,39.21,87,206,''),('4',401.32,126.39,85,171,''),
        ('5',412.45,25.21,93,182,''),('6',902.95,2185.74,69,128,''),('7',292.57,13.52,61,138,''),('8',348.27,616.10,154,252,'DK tickets booked as cash')]
TEXT=dict(
eyebrow='Platinum Rose · 2026 Week 8 · TNF through MNF · settled',
lede='Every placed leg was re-graded from ESPN box scores, along with the Friday card, the TNF and SNF ladders, the D50/D51 weekend lists, the Saturday afternoon five and the MNF paper SGPs. One DraftKings Predictions six-pick (the A-A-A split, $14.98 → $609) turned the week positive; without it, cash was −$326.17. DK tickets are booked as cash here; under Andy’s 10/27 DK-as-promo rule the week is −$221.40 plus the DK account change.',
kpis=[('$348.27','Cash staked · 32 tickets (18 promo tickets and the free bet excluded)',False),('$616.10','Returned: A-A-A $609 + SC compact RR $5.10 + FDP qualifier $2.00',False),('+$267.83','Net for the week (as tagged)',False),('154/252','Placed leg instances hit (61%)',False),('2 of 32','Cash tickets that cashed',True)],
money_sub='DraftKings Predictions was the only bucket with money back ($609 on $119.77, all from one ticket). Every BKR game-line parlay, TNF ticket, BEO prop parlay and split SGP lost. Outside the cash total: 18 promo tickets turned $169.42 of credit into $75.88 (FDP MNF bonuses 4/4 and 5/5), and the BEO free bet on the MNF 2H Over won $17.39.',
proj_name='Fair line',
proj_sub='Open circles are the Master Intel fair-line scores from the Week 8 synthesis; filled circles are the finals. TNF has no fair line. The projection missed the home margin by {M["mae"]:.1f} points on average.',
proj_callouts=[('Winner picks: {M["winners"]} of 13','Wrong: ARI over DAL (33–30 OT), LV over NYJ, DEN over KC and CHI over SEA. ARI and CHI were both in the AI dog-ML round robin.'),('Totals split','{M["over_n"]} of 13 finished over the fair total. The BAL@BUF Over died when Lamar left on the first series; TEN@CIN (79) and LV@NYJ (71) blew through every Under read.')],
cats_sub='Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions). Rushing yards carried the props; receptions and receiving yards were the bleed (Okonkwo, Warren, St. Brown, JSN all short).',
ai_sub='The Week 8 AI record is the Friday card (singles, templates, RRs, 7a–8b, Core 8, Lottery 13, SuperContest AI five), the TNF CAR@GB ladder (S1–S5, S3b, S4 rebuilt, D53 straights), the D50/D51 weekend lists, the Saturday afternoon five and the SNF PHI@WSH ladder. A placed leg counts as AI-backed when the same proposition is in that record.',
ai_note='MNF paper SGPs come from the paper ledger and appear in the closest-tickets section. The TNF S4 team-sacks leg is left out: the grader has no team-sack stat.',
ai_callouts=[('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}','Props that matched the AI record hit {pct(o["Player props"]["agree"])}%; other placed props hit {pct(o["Player props"]["andy"])}%. Unplaced AI props hit {pct(o["Player props"]["ai_only"])}%.'),('AI-backed sides: {o["Sides & totals"]["agree"][0]} of {o["Sides & totals"]["agree"][1]}','Sides and totals Andy added on his own went {o["Sides & totals"]["andy"][0]} of {o["Sides & totals"]["andy"][1]}. The four card totals singles went 1–3 on paper.')],
close_sub='Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number. The TNF DK 6-pick missed by one tackle; paper TNF S3 and S3b went 5 of 5 and were never placed.',
games_sub='Each card shows the final and linescore, the Master Intel fair line, the AI read, what decided the game and how our placed legs on it did. No post-game expert file was built this week.',
method=['Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w8games.json</span> (14 finals). Scoring plays decide TD and first-TD legs.',
'The AI record is <span class="mono">reports/bets/season-recap/ai_recs_w8.py</span>, built from <span class="mono">2026-w08-card.md</span>, <span class="mono">2026-w08-tnf-island-ladder-2026-10-29.md</span>, <span class="mono">2026-w08-weekend-parlay-proposal-2026-10-29.md</span>, <span class="mono">2026-w08-afternoon-provisional-2026-10-31.md</span> and <span class="mono">2026-w08-snf-island-ladder-2026-11-01.md</span>.',
'Cash returned is stake + profit from the wagers ledger for cash-funded tickets. DraftKings Predictions tickets are counted as cash, as tagged; the 10/27 DK-as-promo basis is still Andy’s open decision.',
'Season rows use the same ledger basis. Leg hit counts: Weeks 1–4 from those recap pages, Weeks 5–7 from ledger leg status, Week 8 from this regrade.',
'Grader fix 11/04: city-name sides (“Chicago ML”, “Kansas City ML”) are now mapped to teams; before, five paper RR/template legs were mis-graded.'],
)
