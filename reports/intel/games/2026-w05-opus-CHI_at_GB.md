# Week 5 CHI@GB synthesis (opus, HEAD fb2ad66)

Written Sat 10-10 23:52 PT (2026-10-11 06:52Z, device clock). Kickoff Sun 10:00 PT (17:00Z). BKR captured 06:21:29Z (Sat 23:21 PT); BEO 06:24:03Z (Sat 23:24 PT). Both recommendation windows end 11:00Z (Sun 04:00 PT), six hours before kickoff, so these early-Sunday captures will be `stale_for_recommendation` by game time [Source: CHI_at_GB.json, market.expires_for_recommendation_at, 06:35Z build]. Nothing here is price-specific; disposition is pass.

## Game script

The market reads this as a coin flip: BKR Chicago -1.5, total 47, implied 24.25-22.75 [Source: packet, market_implied_score, 06:21Z]. Chicago brings the better four-game profile but a backup quarterback; Green Bay brings the worse profile, no Micah Parsons and two doubtful interior linemen. Expect Chicago to lean on the run and the clock and Green Bay to throw.

## Away state: Chicago (3-1)

Results in order: W 59-37 at CAR (+22), L 3-9 vs MIN (-6), W 27-7 vs PHI (+20), W 23-12 vs NYJ (+11); opponents 9-7 combined; 0-1 in the division; 7 days rest, bye in Week 10 [Source: packet, team state, 06:35Z]. The +47 differential leans on the Week 1 shootout: the last three games total 53 points scored. Four games is a small sample. Chicago has started three quarterbacks: Caleb Williams Weeks 1-2, Case Keenum Week 3 (34 att), Tyson Bagent Week 4 (25/34, 268 yds, 0 TD) [Source: player_stats_weekly.csv, 2026 wk1-4]. Tyson Bagent is the operator-resolved starter; Williams is Questionable on the ESPN injury report, so the QB flag stays open in gaps. ESPN injury report Out: CB Kyler Gordon, DT Shemar Turner, LB Keyshaun Elliott, RB Kyle Monangai; S Anthony Johnson Jr. on IR; LB Noah Sewell Questionable [Source: ESPN injury report, 06:35Z]. LT Braxton Jones sits in the ESPN roster IR/Out group (unconfirmed), not on the injury report. Next: at ATL, vs NE, at SEA.

## Home state: Green Bay (2-2)

L 22-39 at MIN (-17), W 20-17 at NYJ (+3), L 14-35 vs ATL (-21), W 17-14 at TB (+3); opponents 8-9; 0-1 at home, 0-1 in the division; 7 days rest, bye Week 11 [Source: packet, team state, 06:35Z]. ESPN injury report: DE Micah Parsons Out, LB Edgerrin Cooper IR, C Jacob Monk and G Aaron Banks Doubtful, C Jager Burton, DT Javon Hargrave and DT Anthony Campbell Questionable [Source: ESPN injury report, 06:35Z]. WR Jayden Reed is in the roster IR/Out group (unconfirmed). A Chicago win puts it 4-1, second behind 4-0 Minnesota; a Green Bay win ties them at 3-2. Next: vs DAL, at DET, vs CAR. No schedule fact supports a look-ahead angle.

## Matchup mechanics

Green Bay's offense is the weakest unit on the field: FTN team-offense efficiency EPA/PLY -0.089 and DVOA -19.0%, rushing-analytics EPA/ATT -0.349 and DVOA -38.2%, and dropbacks on 68.9% of plays (tendencies DPBK%) [Source: FTN team-offense, 4 GP]. In the pass-protection table it collapses under pressure (EPA/DB -0.481) but is fine from a clean pocket (EPA/DB__2 0.224). Chicago's pass rush pressures at 35.3% (pass-rush PRESS%) with an 8.6% SK% [Source: FTN team-defense pass-rush]. With Monk and Banks doubtful, that pressure edge is the clearest path to a Chicago win. Against that, Chicago's coverage loses Gordon and Johnson, and the manual secondary context rates GB offense vs CHI defense at 5.25 against 1.35 the other way (capped context only).

Chicago's offense plays 74.5 plays a game with 35.11 minutes of possession against Green Bay's 58.8 (tempo PLY/GM, TOP). Its passing-analytics EPA/DB 0.221 is a team figure built mostly with other quarterbacks and does not describe Bagent. Green Bay's defense allows a 51.7% third-down rate (efficiency CONV%) and, without Parsons, a 26.8% PRESS%.

Power ratings: CHI SRS 12.116 (rank 3) vs GB -7.417 (rank 29). `matches_2026` is true, so these are four-game 2026 values despite the stale prior-season wording. No points are added for them alone.

Weather: outdoor, 73.9°F, 0% precipitation, wind 22.3 km/h from 209°, gusts 42.1 km/h [Source: Open-Meteo capture, 2026-10-10T17:56Z]. The forecast is 13 hours old. The gusts are a mild headwind against a pass-first home offense and against kickers.

## Market comparison

BKR: CHI -1.5 -101 / GB +1.5 -115, O/U 47 -108/-108, ML -116/+103. BEO: CHI -1 -116 / GB +1 -104, O/U 47 -105/-115, ML -129/+109 [Source: bookmaker/betonline-live-2026-10-11-week5.json, 06:21Z/06:24Z]. The books are 0.5 apart, so they don't conflict. A 3 is the live key: side_push at a line of 3 is 8.27% and at 7 is 5.55% [Source: margin-simulator.mjs, side_push]. The Action Network opener is missing. Splits from 10-09 19:41Z show the total at 45.5, now 47, with 74% of tickets on the Over; spread tickets 57% CHI and money 54% GB (context only). The SuperContest has CHI -3 as favorite (labels reversed).

## Thesis and counter-thesis

Edge hypothesis: home margin 0.0, total -0.5 (wind/gust only). The numbers lean Chicago and the market already discounts that for Bagent; the provisional quant row (CHI by 4.6) disagrees with the line by about 3 points but is unbacktested. The source evidence leans Green Bay but is thin. The only tier-eligible side row is VSiN's "Bet: Packers ML (+120)" [Source: w05-expert-verified.json#rows[519]], and that price is now +103/+109, so it has moved. VSiN's GB +1.5 row is the same outlet and is a near miss [rows[512]]. The GB +2.5 and CHI -2.5 rows (corroboration-only) are a point off the current line; the GB +3 rows cross 3 and count as a different bet. Disagreement is preserved, not averaged. Conditional on this hypothesis the simulator gives 50.0/50.0 side (no push at 1.5) and Over 47.0% / Under 50.0% / push 3.0%, against a 48.5/48.5/3.0 baseline. These are not calibrated edges. The verdict is pass.

Counter-thesis: Green Bay's pass protection under pressure plus Chicago's pass rush and Green Bay's interior-line absences could make Chicago -1.5 cheap. If so, the 0.0 margin is wrong toward Green Bay.

## Gaps

- QB CHI ambiguous: Caleb Williams Questionable; operator says Tyson Bagent (stated, not verified).
- Windows lapse 04:00 PT; weather review_required and 13 h old; Action Network opener missing.
- Quant pass (CHI by 4.6) vs market CHI -1.5 not reconciled.
- Global: 432 corroboration-only rows; SuperContest label reversals on 6 games; MIN@NO and CLE@NYJ book conflicts (other games).

## Pre-kickoff delta checklist

- Official inactives: Williams/Bagent, Monk, Banks, Burton, Hargrave, Sewell; roster-group players (Braxton Jones, Jayden Reed).
- Fresh BKR/BEO capture after 04:00 PT; watch 3.
- Weather recheck: gusts above 40 km/h.
- Game status; reprice every source pick against the new number.
