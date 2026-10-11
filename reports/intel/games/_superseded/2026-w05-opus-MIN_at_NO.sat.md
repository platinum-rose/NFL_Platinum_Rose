# MIN@NO Week 5 single-game synthesis (opus)

Written 2026-10-11T05:48:59Z (Sat 10-10 22:48 PT); HEAD 7ebef66; kickoff Sun 10-11 10:00 PT. Disposition **conflicted**, tier **research_only**. No side, no total lean.

## Game script

Minnesota arrives 4-0 as a short road favorite built on defense; New Orleans is 1-3 with a pass-heavy, fast offense and a defense that has allowed 32 points per game. The likely script is Aaron Jones carrying a conservative Vikings offense while Minnesota's blitz-heavy front chases Tyler Shough through 45-plus dropbacks. The swing factor is Minnesota's depleted offensive line.

## Away state: Minnesota

Results in order: W 39-22 vs GB, W 9-3 at CHI, W 23-16 at TB, W 15-10 vs MIA; 86-51, +35 [Source: MIN_at_NO packet, team state, built 04:23Z]. The opponents are a combined 6-11, and the last two wins came by 7 and 5 over 1-4 and 0-4 teams. Minnesota is 2-0 home, 2-0 away, 2-0 in the division, on 6.9 days of rest, with its bye in Week 6 and then IND, at DET and BUF. A win keeps it level with SF (4-0) atop the NFC order and a game clear of CHI (3-1) in the North. The bye is context, not an adjustment; four games is a small sample.

## Home state: New Orleans

Results: L 30-31 at DET, W 24-17 at BAL, L 27-35 vs LV, L 24-45 vs ATL; 105-128, -23 [Source: MIN_at_NO packet, team state, built 04:23Z]. That slate is tougher (opponents 10-6). The Saints are 0-2 at home and 0-1 in the division, on 5.7 days of rest, bye in Week 8, then at NYG and vs PIT. At 1-3 they sit third in the South, one game behind CAR and ATL (2-2); this non-division game affects conference order, not the South race.

## Matchup mechanics

The efficiency gap is on defense. Minnesota's defense posts EPA/PLY -0.184 and DVOA -22.1%; New Orleans' is +0.134 and 20.6% [Source: MIN_at_NO packet, FTN team-defense efficiency]. On offense the order flips: NO -0.008 EPA/PLY vs MIN -0.119 (DVOA -23.4%) [FTN team-offense efficiency]. Pressure is the key mechanic. Minnesota's rush has SK% 10.4%, PRESS% 40.9%, BLZ% 72.1%, and Shough's EPA/DB under pressure is -0.346 against +0.214 clean [FTN pass-rush; pass-protection]. In reverse, Minnesota's protection allows SK% 9.8% with EPA/DB -0.610 under pressure, but New Orleans generates the least heat here (PRESS% 28.1%, BLZ% 33.8%).

Availability cuts both ways [Source: MIN_at_NO packet, ESPN injuries, 04:21Z]. MIN: LT Christian Darrisaw and CB Charles Demmings Out; G Donovan Jackson and TE Josh Oliver on IR; RT Brian O'Neill, C Michael Jurgens, WRs Justin Jefferson and Jordan Addison, TE Ben Yurosek Questionable. NO: G Jeremiah Wright and LBs Kaden Elliss and Anfernee Jennings Out; DTs Nathan Shepherd, Vernon Broughton and Christen Miller, LB Jaylan Ford, Ss Lorenzo Styles Jr. and Julian Blackmon, RB Alvin Kamara and WR Barion Brown Questionable. The Saints' thinned front (run-defense DVOA 19.7%, SUCC% 51.4%) helps Jones (20-94 in Week 4); Minnesota's tackle losses meet a weak rush and matter most if O'Neill also sits. Jefferson has no Week 4 line in nflverse; T.J. Hockenson drew 13 targets that week [nflverse player_stats_weekly, 2026 wk1-4].

Resolved starters are Kyler Murray (Carson Wentz started Weeks 1-2; Murray 27/37, 247 in Week 4) and Shough (all four starts, 1,203 yards, 9 TD, 3 INT). Pace clashes: NO 73 plays per game at 24.9 sec/play, MIN 60 at 30.3 [FTN tempo]. Power ratings (SRS MIN 8.477, NO -5.097) are 2026 four-game values (matches_2026 true; the attribution wording is stale) and carry no adjustment. Secondary context (4.05 vs 2.55) is capped. Venue: fixed dome (static table), weather not applicable indoors; no source suggests relocation.

## Market

BKR (18:15 PT, 01:15Z): MIN -2.5 -103 / NO +2.5 -113; total 41.5 (o-103/u-113); ML -131/+115. BEO (20:15 PT, 03:15Z): MIN -1 -125 / NO +1 +105; total 42 (o+100/u-120); ML -135/+115 [Source: MIN_at_NO packet, market]. That is a 1.5-point spread conflict, so neither price can support a recommendation. Near-identical moneylines hint BEO's -1 -125 is the outlier (inference only). The implied score is MIN 22.0, NO 19.5. BKR sits half a point inside 3; the simulator puts an exact 3-point margin at 15.9%. The Action Network opener is missing. Splits (Fri 12:41 PT): MIN 56% tickets / 52% money, Over 76% / 73% (context only). SuperContest: MIN -2.5 (favorite field; labels reversed).

## Evidence quality

There is one tier-eligible row: VSiN's Zachary Cohen on Vikings ML (-130), which matches BKR -131 [w05-expert-verified.json#rows[518]]. That is one outlet. VSiN's Wes Reynolds on NO +3 is a near miss whose quote does not name the pick, and +3 vs +2.5 crosses the key number [rows[449]]. Corroboration-only rows conflict: Action Network shows NO +1.5 and MIN -1.5 [rows[40], rows[97]], BettingPros NO +1.5 [rows[201]] and Sharp or Square NO +2.5 [rows[131]]. The Under rows quoted 42-42.5 [rows[98], rows[202]]; the 42.5 quote is now a point off and downgraded.

## Thesis and counter-thesis

Edge hypothesis: 0.0 points on margin and 0.0 on total versus BKR. Minnesota's defensive edge and New Orleans' linebacker losses point toward MIN. Minnesota's tackle attrition, Jefferson's status, an offense at -23.4% DVOA and a soft schedule point back. On the total, NO's tempo offsets MIN's defense. The provisional quantitative pass (home margin -4.5, two points beyond the market toward MIN) is noted, not copied. Simulator at zero edge: 50.0/50.0 cover and total, 0% pushes at BKR numbers; at BEO +1/42 pushes are 2.4% side, 3.0% total. Conditional on the hypothesis, not calibrated.

Counter-thesis: Minnesota's record is inflated by a 6-11 opponent slate, and Shough's volume against a patched left side could flip a 2.5-point game. The book conflict alone forces the conflicted disposition.

## Gaps

- BKR/BEO spread conflict (2.5 vs 1); recapture required.
- Action Network opener missing; no movement history.
- Single tier-eligible outlet (VSiN); quant pass disagrees with market by 2.0 points (not backtested).
- Jefferson, Addison, O'Neill, Jurgens, Kamara Questionable; official inactives decide.
- Prop rows for Aaron Jones rush/receiving markets unavailable at BKR; BEO has only 8 MIN@NO prop rows.
- Global: 432 corroboration-only rows; SuperContest labels reversed for 6 games incl. this one; book conflict also on CLE@NYJ; BKR window ends 00:15 PT.

## Pre-kickoff delta checklist

- Official inactives (Jefferson, O'Neill, Jurgens, Kamara, NO DTs) and starters.
- Fresh BKR and BEO capture; does MIN -2.5 hold or reach 3?
- Weather: not applicable indoors; confirm venue.
- Game status confirmed scheduled.
- Reprice source picks (VSiN ML -130, +1.5 rows) on the new line.
