# IND@PIT, Week 5 single-game synthesis (opus)

Written Sat 2026-10-10 22:26 PT (05:26Z). Kickoff Sun 10:00 PT (17:00Z). BKR captured Sat 18:15 PT (01:15Z, about 4h old, window ends Sun 00:15 PT); BEO captured Sat 20:15 PT (03:15Z). Neither capture is stale under the 6-hour rule. HEAD 7ebef66.

**Disposition: price moved. Tier 2-. Side: none. Total lean: Under 43.5. Edge hypothesis: home margin 0.0, total -1.0 (weather only).**

## Game script

This is two 2-2 teams with opposite shapes. Indianapolis runs well and passes poorly; Pittsburgh throws on two of every three dropbacks behind a leaky line and stops the run. The likely script is a field-position game: Jonathan Taylor runs into Pittsburgh's best unit, Aaron Rodgers throws into Indianapolis's weakest unit while absorbing sacks, and both offenses stall often. In forecast wind that points toward a game below 43.5. It does not separate the sides.

## Away state: Indianapolis

The Colts lost to BAL 23-41 (home, -18) and at KC 30-33 (-3), then beat HOU 19-17 (home, +2) and won at WAS 30-13 (+17). Opponents are 8-8 combined; the two wins came against teams now 0-4 and 1-3. They are -2 on points, 1-0 in the division, second in the AFC South behind 3-1 JAX, and eighth in the win%-only AFC order. They have 7.1 days of rest, have not had their bye (Week 13), and play TEN at home next. [Source: game-packets/2026-w05/IND_at_PIT.md, results/standings, 04:23Z]

## Home state: Pittsburgh

The Steelers beat ATL 20-13 (home, +7), lost at NE 3-20 (-17), beat CIN 30-27 (home, +3) and lost at CLE 24-27 (-3). Opponents are 9-7. They are -10 on points, 2-0 at home and 0-2 away, fourth in an AFC North where BAL and CLE are 3-1. They have 9.7 days of rest and play at TB and NO next, with the bye in Week 9. This is a non-division AFC game, so it matters for conference tiebreaks, not the division. Four games is a small sample, and neither record becomes a rating here. [Source: game-packets/2026-w05/IND_at_PIT.md, results/standings, 04:23Z]

## Matchup mechanics

Pittsburgh's offense posts FTN EPA/play -0.115 and success 40.2%, with a 27.7% three-and-out rate and 13 sacks allowed (SK% 7.6%). It drops back 67.2% of the time [Source: FTN team-offense efficiency/tempo/pass-protection, PIT, packet]. Indianapolis's pass defense is soft (pass DVOA 12.1%, EPA/DB 0.109), but it is now without DE Arden Key (IR) and LB Jaylon Carlies (Out), and CB Charvarius Ward is Questionable [Source: ESPN injury report, 04:21Z]. Rodgers's sack volume and the Colts' thinner front roughly offset.

Indianapolis runs at rush DVOA 9.4% and EPA/att 0.119; Taylor has 19, 24, 23 and 20 carries [Source: nflverse player_stats_weekly 2026 w1-w4]. Pittsburgh's run defense is its strength (rush DVOA -13.7%, stuff rate 23.5%). The Colts' passing is the weak link: pass DVOA -19.4%, CPOE -5.6%, aDOT 5.8, and Daniel Jones has thrown one interception in every game. Pittsburgh's coverage is exploitable (OPEN% 68.4%, pass DVOA 11.0%; secondary severity 8.1 for IND offense vs PIT defense), and CB Jamel Dean is Out, CB Jalen Ramsey Questionable, and S DeShon Elliott on IR. But IND has WRs Darius Slayton and Ashton Dulin Out, Keenan Allen Questionable, and Alec Pierce listed in ESPN's IR/Out roster group. Jones and Rodgers are the resolved starters; neither QB is ambiguous [Source: packet Quarterbacks, ESPN depth 04:21Z].

Power ratings: SRS IND -2.24 vs PIT -0.62; net PPG -0.5 vs -2.5. The label check shows these equal the 2026 four-game values, so they get no point adjustment. Pace is neutral (63.3 vs 64.0 plays per game).

Weather: outdoor stadium (static table; no neutral-site flag). The forecast is 64F, wind 25.2 km/h, gusts 58 km/h, precipitation probability 54% but 0 mm [Source: 2026-10-10-week5-weather-openmeteo.json, IND@PIT, captured 2026-10-10T17:56Z]. Gusts like that hurt deep passing and kicking. This is the only input I let move the total.

## Market

BKR: PIT -3 +103 / IND +3 -118, total 43.5 -108/-108, ML -146/+127. BEO: PIT -2.5 -117 / IND +2.5 -103, total 43.5 -110, ML -148/+128 [Source: packet Market, BKR 01:15Z, BEO 03:15Z]. The implied score is PIT 23.25-20.25. BKR's -3 is juiced toward the dog, which is effectively a -2.75 market. The simulator puts an exact 3-point margin at 15.6%, so the half point is worth a lot. No Action Network opener was captured. Splits (Oct 9 19:41Z, context only): IND +2.5 has 65% of tickets and 61% of money, and Over 43.5 has 73% and 64%. The SuperContest line is PIT -2.5 (contest only).

## Evidence and thesis

There are three tier-eligible rows from two outlets. VSiN's Matt Youmans: "Best Bet: Steelers -2.5" (w05-expert-verified.json#rows[444]). ESPN: "Picks: Steelers -2.5 (-118), Under 44.5 (-118)" (rows[390]). Both side picks were made at -2.5. BKR now hangs -3, which crosses the key number, so at BKR that is a different bet; -2.5 survives only at BEO -117. ESPN's Under was at 44.5. It is now 43.5, a full point worse, so it is downgraded. The corroboration-only rows lean PIT (Action Network, Sharp Football, Sharp or Square, Even Money, PFT) and Over (BettingPros 43.5, Kezirian 44.5). The disagreement is kept, not averaged.

I hold the margin at 0.0. The PIT case (sources, home split, rest) is offset by the IND passing-vs-coverage mismatch and the quant pass's IND lean. The total moves -1.0 on wind and gusts alone. Simulator, conditional on this hypothesis and not calibrated: Under 53.0% / Over 47.0% (push 0%); side unchanged at 45.9% / 45.9% with 8.3% push. The zero-edge baseline is 50/50 on both (side push 8.3%).

**Counter-thesis:** Indianapolis's defense allows 26.0 PPG. Both teams have hit 30. Precipitation is 0 mm. The quant pass projects 44.5. A calmer forecast deletes my only numeric input.

## Gaps
- Quant pass (unbacktested) has home margin +1.42 vs market +3 (leans IND) and total 44.48 (leans Over); it disagrees with the market and my Under.
- Action Network opener missing; no movement history.
- Weather forecast is 11+ hours old at write.
- Alec Pierce: ESPN roster IR/Out group but not on the injury list.
- Global WARNs: BKR expires 00:15 PT; book conflicts on MIN@NO and CLE@NYJ only; 432 corroboration-only rows; SuperContest label reversals for six other games.

## Pre-kickoff delta checklist
- Official inactives: Allen, Ward, Ramsey, Dowdle; both QBs.
- Fresh BKR/BEO capture: does -2.5 return, and does the total hold 43.5?
- Weather recheck: if wind falls below 15 km/h and gusts below 40 km/h, the total edge goes to 0 and this becomes a pass.
- Game status (venue, time).
- Reprice the VSiN/ESPN picks at the live number.
