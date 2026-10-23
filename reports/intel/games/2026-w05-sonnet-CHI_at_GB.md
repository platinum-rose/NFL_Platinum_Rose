# CHI@GB, Week 5 single-game synthesis (sonnet, read-only research)

Written Sat 2026-10-10 18:4x PT (kickoff Sun 10:00 PT). BKR captured 18:15 PT, BEO 18:19 PT; both fresh (about 0.5 h old, inside the 6 h limit). Nothing here is a wager, ticket or stake.

## Game script and the two teams

**Away state, Chicago (3-1, +47).** Results: W 59-37 at CAR (+22), L 3-9 vs MIN (-6), W 27-7 vs PHI (+20), W 23-12 vs NYJ (+11). Opponents are a combined 9-7 [Source: CHI_at_GB.md, CHI schedule table, 2026-10-11T01:22Z]. The Bears are 2-1 home, 1-0 away, 0-1 in the division, and rested 7 days with their bye still ahead (week 10). The quarterback has rotated: Williams weeks 1-2, Keenum week 3, Bagent week 4 [Source: player_stats_weekly.csv, passing rows weeks 1-4]. Bagent is the stated Week 5 starter [Source: projected-starters/2026/latest.json, CHI QB, ESPN 2026-10-05]. The packet does not say why Williams is out. Four games is a small sample, so the +47 margin is not a rating.

**Home state, Green Bay (2-2, -32).** L 22-39 at MIN (-17), W 20-17 at NYJ (+3), L 14-35 vs ATL (-21), W 17-14 at TB (+3). Opponents are a combined 7-9, and Tampa Bay was 0-4 [Source: CHI_at_GB.md, GB schedule table]. Green Bay is 0-1 at home, 2-1 away, 0-1 in the division, rested 7 days, with the bye (week 11) still ahead. Both wins were by 3.

**Standings.** Minnesota leads the NFC North at 4-0; Chicago is second and third in the NFC; Green Bay is fourth and outside the NFC top eight [Source: CHI_at_GB.md, standings; win% then point differential only, no NFL tiebreakers]. Whoever loses falls to 0-2 in the division. Next opponents are context only: CHI at ATL, GB vs DAL.

## Matchup mechanics

Chicago's offense is the strength: DVOA 12.3%, EPA/play 0.077, passing DVOA 39.8% on EPA/dropback 0.221, with 74.5 plays per game against Green Bay's 58.8 [Source: FTN team-offense efficiency, passing-analytics, tempo]. Its run game is weak (DVOA -2.5%, stuffed 17.7%), and Monangai (30 carries in week 4) is listed out. Green Bay's defense is middling: DVOA 7.0%, pass DVOA 9.7%, pressure rate only 26.8% [Source: FTN team-defense efficiency, passing-analytics, pass-rush]. Chicago's front is the better one (pressure 35.3%, 10 sacks, pass DVOA -13.3%).

Green Bay's offense is the problem: DVOA -19.0%, rush DVOA -38.2% (EPA/att -0.349), CPOE -8.8%, drop rate 7.1%, six turnovers [Source: FTN team-offense tables]. Center Monk and guard Banks are doubtful, which matters against Chicago's pass rush [Source: packet availability digest, GB]. Chicago also has OT Jones on IR and CB Gordon out. The manual secondary-context severity (capped) is 5.25 for GB offense against CHI defense and 1.35 the other way.

Power ratings (nflverse-derived SRS, 4 games): CHI +12.1 (rank 3), GB -7.4 (rank 29) [Source: packet power ratings]. A 19.5-point rating gap against a 1.5-point line shows the market discounting the quarterback change and the tiny sample. The packet's provisional, unbacktested quantitative pass has Chicago by 4.6, total 46.8, away cover 57.2%. That is an existing pipeline output, not my edge.

Weather: Lambeau, forecast 73.9F, no rain, wind 22.3 km/h gusting 42.1 km/h, flagged review_required [Source: 2026-10-10-week5-weather-openmeteo.json, CHI@GB, captured 2026-10-10T17:56Z]. This is an 8-hour-old forecast, not observed conditions.

## Market

BKR: CHI -1.5 -101 / GB +1.5 -115; total 46 (O -118, U +101); ML CHI -116 / GB +103. BEO: CHI -1 -113 / GB +1 -107; total 46.5; ML CHI -119 / GB -101. The books differ by 0.5, below the 1.0 conflict threshold. Implied score CHI 23.75, GB 22.25. Action Network opened CHI -1.5 and a 44.5 total on 10-05, so the spread is unchanged and the total is up 1.5 [Source: packet Action Network opener]. Splits from 10-09 (context only): 57% of spread tickets on CHI but 54% of money on GB; 74% of tickets on the over. SuperContest lists CHI -3, a separate contest reference 1.5 points from the book line.

## Evidence quality

Only two tier-eligible rows exist, from two outlets. VSiN, Packers ML +120 (rows[519], now +103 BKR / -101 BEO; a price change, not a line change), supports Green Bay. ESPN, Watson anytime touchdown (rows[392]), is a prop. VSiN GB +1.5 (rows[512]) is a near_miss, and it matches the current number. Many corroboration_only rows take GB +2.5 or +3 (for example rows[41], [127], [296]); the line has since moved 1 to 1.5 points, and +3 crosses a key number, so they are downgraded. Other corroboration-only rows take CHI -2.5 (rows[173], [289]) and CHI -1.5 (rows[181]). Disagreement is preserved, not averaged. BettingPros over 44.5 (rows[195]) is stale against 46.

## Thesis and counter-thesis

Edge hypothesis: 0.0 points on margin and 0.0 on total. The ratings and the pipeline lean Chicago, while the only eligible source leans Green Bay, and the quarterback uncertainty and four-game sample cancel any supported disagreement with the market. Conditional on that hypothesis the simulator gives 50.0% home cover, 50.0% away cover, 48.5% over and 48.5% under (3.0% total push); these are not calibrated edges. Disposition: conflicted, tier 2-, no side or total lean.

Counter-thesis: Chicago's offense and pass rush are clearly better, so -1.5 is too short if Bagent performs like week 4 (268 yards on 34 attempts). Reversing it: Green Bay at home, in a divisional game that is a must-win by the numbers, with Chicago on its third quarterback.

## Gaps

- No reason is given for Williams' absence, and no Bagent or Chicago depth-chart confirmation after 10-05.
- No observed weather and no wind-direction effect model; there is no calibrated total-versus-wind adjustment.
- The roster gate reports blocking 0 and no CHI or GB items; it was read from the stored file, not rerun, and its roster source is 23 h old.
- FTN tables are four-game samples. The secondary-context file is manual.

## Pre-kickoff delta checklist

1. Official inactives and starters: Bagent versus Williams or Keenum, Monk, Banks, Jones, Gordon, Monangai.
2. Fresh BKR and BEO capture (stale after 6 h, or 3 h once inside 6 h of kickoff); a move through 3 changes the bet.
3. Weather recheck for gusts above 42 km/h.
4. Game status.
5. Reprice the VSiN ML +120 pick against the current price.
