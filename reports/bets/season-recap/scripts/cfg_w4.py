import os
from recaps_w4 import R
from ai_recs_w4 import PROJ
FORCE_ANDY=()
_H=os.path.dirname(os.path.abspath(__file__))
EXPERTS=os.path.join(_H,'..','w4expert-commentary.json')
# Bookmaker round-robin settlements + the BEO free-bet win (profit only; the $10 credit is not cash)
RET={'bet_20261004_bkr_739713279_round_robin_5x2':29.64,'bet_20261004_bkr_739713560_round_robin_6x2':12.28,'bet_20261004_bkr_739714646_round_robin_8x4':84.47,
     'bet_20261004_betonline_1002306890_ne_buf_spread':8.70}
BUCKETS=['TNF tickets','Game-line parlays','Round robins','Sunday BEO prop parlays','SNF island SGPs','MNF tickets']
def bucket(t):
    i=t['id']
    if 'round_robin' in i: return 'Round robins'
    if i.startswith('bet_20261001_betonline') or '739527199' in i: return 'TNF tickets'
    if 'snf_' in i: return 'SNF island SGPs'
    if i.startswith('bet_20261005'): return 'MNF tickets'
    if 'betonline' in i: return 'Sunday BEO prop parlays'
    return 'Game-line parlays'
TOT_LO,TOT_HI=20,75
PROJ_LABEL='Master Intel projection'
NOPROJ='— (TNF: no projection in the Master Intel build)'
ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]
NAMES={
'bet_20261001_betonline_1001392960':'TNF 4-leg props #1001392960','bet_20261001_betonline_1001390385':'TNF 8-leg props #1001390385',
'bet_20261001_betonline_1001388000':'TNF 5-leg props #1001388000','bet_20261001_bkr_739565346':'10-team ML/spread (TNF CLE +3.5 + weekend)',
'bet_20260930_bkr_739527199':'TNF SGP Under 40 / CLE +3.5','bet_20261002_w04_jays_lockbox_promo_2team':"Jay's Lock Box promo (no cash)",
'bet_20261004_bkr_739714534_6team_parlay':'6-team parlay #739714534','bet_20261004_bkr_739714258_5team_parlay':'Slot 3 morning-to-SNF 5-team',
'bet_20261004_bkr_739713278_5team_parlay':'SC-card 5-team spread parlay','bet_20261004_betonline_1002306890_ne_buf_spread':'BEO free bet NE +7 (won $8.70)',
'bet_20261004_betonline_1002306704_2td_parlay':'2+ TD 5-leg','bet_20261004_betonline_1002306303_hybrid_prop_parlay':'Hybrid 8-leg props + DET',
'bet_20261004_betonline_1002304945_morning_prop_parlay':'Morning 8-leg props (7a build)','bet_20261004_betonline_1002303293_atd_parlay':'Anytime TD 6-leg',
'bet_20261004_betonline_1002396982_late_prop_parlay':'Late 8-leg props','bet_20261004_betonline_afternoon_8leg_20261004':'Afternoon 8-leg (7b-A build)',
'bet_20261004_betonline_afternoon_8leg_b_20261004':'Afternoon 8-leg #2 (7b-C build)','bet_20261004_betonline_afternoon_7leg_c_20261004':'Afternoon 7-leg TD/receptions',
'bet_20261004_bkr_739761492_5team_parlay':'Afternoon-to-SNF 5-team','bet_20261004_betonline_snf_island_8leg_20261004':'SNF DET@CAR 8-leg SGP',
'bet_20261004_betonline_snf_7leg_b_20261004':'SNF 7-leg SGP #2','bet_20261005_kalshi_mnf_3td_combo':'MNF Kalshi TD combo (Hooper / Fant / NO D/ST)',
'bet_20261005_betonline_1002759127':'MNF 8-leg SGP #1002759127','bet_20261005_betonline_1002756348':'MNF 6-leg SGP #1002756348',
'bet_20261005_betonline_1002754993':'MNF 7-leg SGP ×2','bet_20261005_bkr_739813995':'MNF NO −1 / Over 46'}
DIV=[
('TNF','PIT@CLE','S2: CLE ML + Rodgers 1+ INT (S1: Warren 76+ rush / Rodgers U19.5 comp)','SGP Under 40 + CLE +3.5; 4-, 8- and 5-leg BEO prop parlays','S2 hit both legs; S1 lost on completions (22). The Under lost at 51; the prop parlays went 1/4, 4/8 and 4/5','AI'),
('SC','SuperContest five','ARI −1.5 / MIA +10.5 / LAR −3 / TEN +11.5 / DEN +2.5','SF −2.5 / ARI −1.5 / MIA +10.5 / LAR −3 / NE +6.5','AI 3/5; official card 4/5 (SF instead of DEN was the difference)','Andy'),
('Slot 3','Morning parlay','NE +7 / NYJ +3.5 / GB-TB U38.5 / SEA ML / DET ML','Same five with Under 40 (#739714258)','3/5 both ways: NYJ and DET lost','Push'),
('Slot 4/5','Afternoon + Hybrid','ARI ML / LAR ML / MIA +9.5 / DEN +2.5 / DET ML; Hybrid ARI ML / MIA / NE / DEN ML','SC-card 5-team (ARI / NE / SF / MIA / LAR); afternoon 5-team (DEN +3.5 / LV +5 / SEA −6.5 / U40 / O50.5)','AI 2/5 and 2/4; placed 4/5 and 4/5, each one leg short','Andy closer'),
('RR','Round robins','Skip the master RR (playbook: cap $35 or skip); ARI + JAX ML 2-leg','8x4 RR ($105) and 6x2 ML RR ($30); the 5x2 is the SC card','8x4 −$20.53 and 6x2 −$17.72: skipping saved $38.25. ARI + JAX (paper) lost on ARI','AI'),
('7a','Morning props','Brissett / Stafford 2+ TD, Winston / Daniels INT, Nacua / Meyers / Pollard ATD','8-leg: 1.5 pass-TD lines, Cook 76+, P. Washington 6+, Adams and Javonte ATD','AI 5/7; placed 4/8. Stafford threw no TD: both dead','Push'),
('7b-A','Afternoon props','Darnold / Purdy 2+ TD, Bolton 9+ / Cashman 8+ T+A (+769)','8-leg: Herbert INT, Purdy, Darnold, Cashman + Dean 8+, K. Walker ATD, Goff 2+ TD, Willis INT','AI 4/4: would have paid $38.45 on $5. Placed 5/8 (Dean 5, Goff 1 TD, Willis 0 INT)','AI'),
('7b-C','Afternoon #2','Cousins 2+ / Kelce ATD / E. Jones / JSN 7+ / Warner 9+ / Taaffe / St. Brown 7+','Same seven, Warner at 8+, plus Waller ATD','AI 4/7; placed 4/8 (Kelce, JSN, Warner, Waller)','Push'),
('8b / 7e','TD ladders','8b Henry / Montgomery / Gibbs 2+ TD; 7e M. Wilson / G. Wilson / Lamar / J. Williams ATD','2+ TD 5-leg and ATD 6-leg sharing Montgomery, Gibbs, Lamar, G. Wilson','AI 0/3 and 0/4; placed 0/5 and 1/6','Push'),
('SNF','DET@CAR ladder','T1 Young 233+ / Gibbs 5+ rec / Barnes 5+ / Goff 23+; T2 Hubbard ATD / Lloyd / Clark / J. Williams 4+ / Hutchinson sack','8-leg mixing the tiers + Waller ATD; 7-leg #2 (DET leads)','AI T1 2/4, T2 4/5, T3 2/4; placed 6/8 (Gibbs 4 rec, Waller) and 2/7','Push'),
('MNF','ATL@NO','ATL +8.5 (Wong teaser leg)','NO −1 / Over 46; three BEO SGPs; Kalshi TD combo','ATL won by 21: NO −1 lost and all five MNF tickets lost','AI'),
]
NM=[('Afternoon 7-leg TD/receptions (+16300)','6 of 7: Jeanty, no TD'),('TNF 5-leg props (+12600)','4 of 5: Mason Graham left injured, no sack'),
('SC-card 5-team (+1830)','4 of 5: ARI −1.5 lost 24–36'),('Afternoon-to-SNF 5-team (+1819)','4 of 5: DEN +3.5 lost 14–24'),
('James Cook 76+ rush (morning 8-leg)','75 yards'),('Drake London 6+ rec (two MNF SGPs)','5 catches'),
('Jahmyr Gibbs 5+ rec (SNF 8-leg and AI Tier 1)','4 catches'),('Ronnie Hickman 6+ T+A (TNF 8-leg)','5'),('Fred Warner 8+ T+A (afternoon 8-leg #2)','7'),('Bobby Okereke 8+ T+A (AI SNF Tier 3)','7')]
ORDER=['PIT@CLE','IND@WSH','ARI@NYG','DAL@HOU','GB@TB','JAX@CIN','LAR@PHI','NE@BUF','NYJ@CHI','TEN@BAL','MIA@MIN','DEN@SF','KC@LV','LAC@SEA','DET@CAR','ATL@NO']
SEASON=[('1',370.77,80.56,63,136,''),('2',428.79,131.24,107,211,''),('3',498.41,39.21,87,206,''),('4',401.32,135.09,85,171,'incl. $8.70 free-bet win')]
TEXT=dict(
eyebrow='Platinum Rose · 2026 Week 4 · TNF through MNF · settled',
lede='Every placed leg was re-graded from ESPN box scores, along with the Saturday card, the Sunday afternoon stacks, the SNF ladder and the TNF scenario drafts. No straight ticket cashed: the only money back came from three Bookmaker round robins and the BEO free bet on NE +7. Two unplaced AI builds would have paid: TNF scenario S2 (CLE ML + Rodgers INT) and the 7b-A afternoon four. The Master Intel projection picked {M["winners"]} of 15 winners, and games finished {M["tot_err"]:.1f} points over it on average.',
kpis=[('$401.32','Cash staked · 27 tickets (promo and free bet excluded)',False),('$135.09','Returned: three BKR round robins + $8.70 free-bet win',False),('−$266.23','Net for the week',True),('85/171','Placed leg instances hit (50%)',False),('9/15','Master Intel projection picked the right winner',False)],
money_sub='Round robins were the only family with money back ($126.39 on $150); the 5x2 built on the SuperContest card made +$14.64. Every straight ticket lost: game-line parlays $100.08, MNF $57.81, TNF $41.29, Sunday BEO props $39.98 and the SNF SGPs $12.16, all with $0 back.',
proj_name='Projection',
proj_sub='Open circles are the Master Intel projected scores from the Saturday build; filled circles are the finals. TNF has no projection. Seven underdogs won outright, and the projection missed the home margin by {M["mae"]:.1f} points on average.',
proj_callouts=[('Winner picks: {M["winners"]} of 15','Wrong: ARI, CIN, BUF, HOU, DET and NO. ARI (the ML or spread on four AI tickets) and DET (the SNF cap on Slots 3 and 4) did the most damage.'),('Totals ran over','{M["over_n"]} of 15 finished over the projected total. ATL/NO landed at 69 against 48, ARI/NYG and DAL/HOU 16 over. MIA/MIN (25 vs 36) and JAX/CIN (39 vs 52) were the big unders.'),('Margin error {M["mae"]:.1f} pts','ATL/NO (23 points), ARI/NYG (16) and IND/WSH (11) were the biggest misses. KC/LV and LAR/PHI were within a point.')],
cats_sub='Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions). Passing TDs (6 of 9), QB interceptions (5 of 8), tackles (6 of 9) and receptions (8 of 13) carried the props. Anytime TDs went 11 for 31, 2+ TD 0 for 5 and sacks 0 for 5. Dog spreads went 7 for 10; moneylines 7 for 16.',
ai_sub='The Week 4 AI record is the Saturday card (game-line parlays, singles, SuperContest A, prop stacks 7a–8a, Wong teaser), the Sunday 11:30 afternoon stacks (7b-A/B/C), the SNF DET@CAR ladder and the TNF scenario drafts (S1/S2). A placed leg counts as in the AI record when the same player and stat, or team and side, is in it, even at a different line.',
ai_note='MNF had no AI card: those tickets were built from the ATL@NO prop planner, so they count as "Not in AI record". The eleven paper tickets and the unbooked afternoon, SNF and TNF builds appear in the closest-tickets section; none was placed and none is in the cash totals.',
ai_callouts=[('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}','Props that matched the AI record hit {pct(o["Player props"]["agree"])}%; other placed props hit {pct(o["Player props"]["andy"])}%. On Sunday alone it was 20 of 34 against 11 of 30.'),('AI 7b-A: 4 of 4','The afternoon four (Darnold, Purdy, Bolton, Cashman) would have paid $38.45 on $5. The placed 8-leg kept three of its legs, added five, and three of the additions missed.'),('SuperContest: official 4 of 5','Andy and Amanda\'s five beat the AI five by one pick: SF −2.5 instead of DEN +2.5. The same five paid the 5x2 RR.')],
close_sub='Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number. Six placed tickets died on one leg, two of them two-leg tickets. The TNF 5-leg lost Mason Graham to an injury.',
games_sub='Each card shows the final and linescore, the Master Intel projection, the AI read from the card, what decided the game, the post-game expert view (paraphrased, with sources) and how our placed legs on it did.',
method=['Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w4games.json</span> (16 finals). Scoring plays decide TD, first-TD and D/ST TD legs. Kicking points come from the kicker\'s box line (Boswell 4, needed 8). A player with no box line counts as a loss (Mason Graham, Za\'Darius Smith, Rashee Rice).',
'The AI record is <span class="mono">reports/bets/2026-w04-card.md</span>, <span class="mono">2026-w04-afternoon-props.md</span>, <span class="mono">2026-w04-snf-island.md</span> and the TNF drafts in <span class="mono">reports/analysis/week4-intel/</span>. Paper tickets are in <span class="mono">data/official-picks/paper-wagers-2026.json</span>.',
'Round-robin returns are the Bookmaker settlements in the wagers ledger: $29.64 (5x2), $12.28 (6x2 ML) and $84.47 (8x4). The BEO NE +7 free bet won $8.70 profit, counted as returned; the $10 credit itself is not cash. The $100 Jay\'s Lock Box promo is excluded.',
'Nine legs inside settled tickets are still marked PENDING in the wagers ledger (TNF props, ATL +4, three Sunday INT legs). The box scores grade them; no ticket result changes.',
'Expert views are paraphrased from <span class="mono">w4expert-commentary.json</span>; source links are on each card.'],
)
