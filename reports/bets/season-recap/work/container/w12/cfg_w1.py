from recaps_w1 import R
from ai_recs_w1 import PROJ
FORCE_ANDY=()
RET={'bet_20260906_bm_738317559_2team':50.86,'bet_20260909_bm_738444813_2team':29.70}
BUCKETS=['Game-line parlays','Round robins','Sunday prop parlays','Island SGP ladders','DK Predictions contracts']
def bucket(t):
    i=t['id']
    if 'round_robin' in i: return 'Round robins'
    if 'dkp' in i: return 'DK Predictions contracts'
    if 'beo' in i or 'bkr_3team' in i or 'bkr_6team' in i: return 'Island SGP ladders'
    if '9956' in i: return 'Sunday prop parlays'
    return 'Game-line parlays'
TOT_LO,TOT_HI=10,100
PROJ_LABEL='AI model projection'
NOPROJ='—'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
NAMES={'bet_20260913_dkp_6pick_combo_snf':'SNF DK 6-pick combo','bet_20260913_dkp_4pick_combo_snf':'SNF DK 4-pick combo','bet_20260913_dkp_8pick_combo_snf':'SNF DK 8-pick combo','bet_1789086780000_bm_parlay_rams_under':'Melbourne: Rams + Under 2-team','bet_1789085490285_dkp_stribling_td':'Stribling ATD contract','bet_1789085490286_dkp_ferguson_td':'T. Ferguson ATD contract','bet_20260914_bkr_2team_open_parlay':'MNF 2-team open (DEN +4)','bet_20260906_bm_738317559_2team':'Notre Dame −20.5 / NE +4','bet_20260909_bm_738444813_2team':'SEA ML / Under 45','bet_1789085880000_bm_open_parlay_7t':'7-team open parlay','bet_20260913_738634509_bm_parlay':'6-team parlay #738634509','bet_1789078788963_beo_tier2_parlay':'Melbourne Tier 2 SGP','bet_1789078322607_beo_parlay':'Melbourne Tier 1 SGP','bet_1789080171509_beo_tier3_moonshot':'Melbourne Tier 3 moonshot','bet_20260913_995681422_hybrid_8leg_parlay':'Sunday hybrid 8-leg','bet_20260909_dkp_ne_sea_w1_combo':'NE@SEA DK 6-pick combo','bet_20260913_995678217_td_parlay':'Sunday ATD 7-leg','bet_20260913_995680154_morning_parlay':'Sunday morning 6-leg','bet_20260913_995680761_afternoon_parlay':'Sunday afternoon 6-leg','bet_20260913_dkp_6pick_combo':'Sunday DK 6-pick combo','bet_20260914_bkr_3team_anytime_td_sgp':'MNF ATD 3-leg SGP','bet_20260914_bkr_6team_parlay':'MNF 6-leg SGP'}
DIV=[
('Side','CHI@CAR','CAR +3.5 & ML (94, A+, five-show consensus)','CAR +3.5 ×2, CAR ML, Burden TD','CHI 59–37: all lost','Push'),
('Side','BAL@IND','IND +3.5 & ML (89, A)','IND +3.5, IND ML','BAL 41–23: all lost','Push'),
('Side','TB@CIN','TB +3.5 & Under 50.5 (92, A+)','TB +3 / +3.5 / +4, TB ML (no Under)','CIN 33–27, total 60: all lost','Push'),
('Line','BUF@HOU','HOU +7.5 as a teaser leg (96, A+)','HOU +2 in the master RR','BUF by 5: +7.5 wins, +2 loses','AI'),
('Side','ARI@LAC','ARI +10 (91, A+)','ARI +10, +11, ML','ARI won outright 26–14','Push'),
('Total','GB@MIN','Under 46.5 (84, B+)','Under 46.5 and Under 47 (3 tickets)','Total 61: all lost','Push'),
('Side','NYJ@TEN','TEN −1.5 (TSI #1 model bet) and Under 41.5','Neither placed (Geno INT prop only)','NYJ won by 13; Under won','Andy'),
('Side','MIA@LV','MIA +3.5 and Over 40.5 (85, A)','MIA +3, MIA ML; LV ML elsewhere','LV by 14: MIA lost, LV ML won','Andy'),
('Side','DAL@NYG','Under 48.5 best bet; no side','DAL −3, DAL ML ×2 plus the Under','NYG 28–20: DAL lost, Under won by 0.5','AI'),
('Card','Melbourne','AI SGP: Evans ATD / CMC 61+ / Juszczyk 5+ yds','BEO Tier 1–3 SGPs (Nacua, Kittle, Stafford legs)','AI card 2/3 (Juszczyk 0 catches); tiers 2/4, 3/5, 2/7','AI closer'),
('Card','Sunday TDs','TD Trio: Taylor / Hurts / Hampton','ATD 7-leg (different scorers)','AI trio 2/3 (Hurts no TD); ATD 7-leg 3/7','AI closer'),
]
NM=[('SNF DK 6-pick combo','5 of 6: CeeDee Lamb 80+ yds finished with 44'),('SNF DK 4-pick combo','3 of 4: Pickens 70+ yds finished with 28'),('MIA@LV Over 40.5 (AI)','Final total 40'),('DAL@NYG Under 48.5','Won by half a point (48)'),('HOU +2 (RR)','Lost by 5 in a game decided on a 1:36 TD'),('NO@DET Under 48.5 (AI)','Tied through regulation at 24–24, then 13 OT points'),('Rhamondre Stevenson 57.5+ rush (AI)','51 yards'),('Sunday hybrid 8-leg (+51500)','5 of 8: London 29, Q. Johnston 17, Reed no TD')]
ORDER=['NE@SEA','SF@LAR','ATL@PIT','BAL@IND','BUF@HOU','CHI@CAR','CLE@JAX','NO@DET','NYJ@TEN','TB@CIN','ARI@LAC','GB@MIN','MIA@LV','WSH@PHI','DAL@NYG','DEN@KC']
TEXT=dict(
eyebrow='Platinum Rose · 2026 Week 1 · Wed opener through MNF · settled',
lede='Every placed leg was re-graded from ESPN box scores, along with the Week 1 AI recommendations saved in the master intel packet. Two of 27 tickets paid, and both were two-leg parlays. The AI model picked 8 of 16 winners, and its four A+ sides split 2–2. Underdog spreads were the biggest leak: 4 of 13 covered, and most of the losses came in blowouts.',
kpis=[('$370.77','Cash staked · 27 tickets (6 DK promo-credit tickets excluded)',False),('$80.56','Returned: two 2-leg parlays (Notre Dame / NE +4 and SEA ML / Under 45)',False),('−$290.21','Net for the week',True),('63/136','Placed leg instances hit (46%)',False),('8/16','AI model projections that picked the right winner',False)],
money_sub='Game-line parlays took nearly half the stake and returned all of the money that came back. Both round robins ($133) returned nothing: the 4-team RR hit 2 of 8 legs and the dog-ML RR hit 1 of 8.',
proj_name='AI model projection',
proj_sub='Open circles are the Platinum Rose AI synth-engine projections from the Week 1 master packet; filled circles are the finals. The model missed game totals by 13.2 points on average and finals averaged {M["tot_err"]:+.1f} above it. Its misses were big in both directions: NE/SEA and SF/LAR came in far under, while CHI/CAR landed 53 points over.',
proj_callouts=[('CHI/CAR: 96 vs 43','Chicago ran for 291 yards. The model’s top side (CAR +3.5, graded 94) lost by 22.'),('Winner picks: 8 of 16','The model had IND, MIA and LAR winning; all three lost by 14 or more. Margin error averaged {M["mae"]:.1f} points.'),('A+ grades split 2–2','HOU +7.5 (teaser) and ARI +10 hit; CAR +3.5 and TB +3.5 lost. Its totals went 6 for 10.')],
cats_sub='Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions; the Notre Dame leg is left out). Tackles and rushing yards were the best prop types. Dog spreads went 4 for 13 and anytime TDs 10 for 25.',
ai_sub='Week 1 has no recommendation ledger (it was rebuilt from Week 3), so the AI record here is what the Week 1 master packet saved: the forecast board’s side and total picks, the five AI paper cards and the master prop card. A placed leg is tagged "in AI record" when it matches one of those.',
ai_note='Most of the Week 1 prop tickets were built after the packet and have no saved AI version, so "Not in AI record" does not mean Andy went against the AI. Read the prop bars as coverage, not as a verdict.',
ai_callouts=[('AI-backed sides: {o["Sides & totals"]["agree"][0]} of {o["Sides & totals"]["agree"][1]}','Agreement was high on sides, and the shared reads (CAR, IND, TB, GB/MIN Under) lost together.'),('AI cards: 2 of 3 each','Melbourne SGP (Juszczyk 0 catches), TD Trio (Hurts no TD) and Safe Floor (Sean Tucker did not play) each missed by one leg.'),('Unplaced AI props: {pct(o["Player props"]["ai_only"])}%','{o["Player props"]["ai_only"][0]} of {o["Player props"]["ai_only"][1]}: Flowers 150 yds, Taylor first TD, P. Washington first TD, Maye 47 rush yds hit.')],
close_sub='Placed tickets and the saved AI cards, sorted by how many legs missed. Hover a leg for the actual number. Two DK SNF combos each died on a single receiving-yards leg.',
games_sub='Each card shows the final and linescore, the AI model projection and read from the master packet, what decided the game, and how our placed legs on it did.',
method=['Leg results come from the ESPN box scores in <span class="mono">data/fantasy/boxscores/</span> (16 finals). Scoring plays decide TD and first-TD legs. A player missing from the box score counts as a loss.','The AI record is the Week 1 master packet (<span class="mono">dist/nfl_week1_master_packet/</span>): forecast board recommendations, the five AI paper cards (legs saved for three of them) and the master prop card. The two NE@SEA AI SGPs have no saved legs and are left out.','Round-robin returns are $0 for both RRs (not enough winning legs for any combo). Cash totals match <span class="mono">docs/tracked-wagers/week1_2026_analysis.md</span>.','The wagers file still marks two legs on the NE@SEA DK combo as LOST that hit in the box score (JSN 8 catches and a TD). The ticket still lost on Darnold, who threw for 13 yards.'],
)
