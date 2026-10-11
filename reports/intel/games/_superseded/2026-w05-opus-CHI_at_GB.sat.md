# CHI@GB Week 5 synthesis (opus)

Written Sat 10-10 ~22:41 PT (2026-10-11 ~05:41Z), head 7ebef66. Kickoff Sun 10-11 10:00 PT. "pkt" = data/research-intel/game-packets/2026-w05/CHI_at_GB.md, built 2026-10-11T04:23Z. BKR captured 18:15 PT (01:15Z, window ends 00:15 PT); BEO captured 20:15 PT (03:15Z). Neither is stale yet.

## Game script

Disposition **pass**, tier **skip**. This is a near pick'em division game where the market has already absorbed Chicago's quarterback change. My evidence nets to a half-point lean toward Chicago and a half-point lean to the Under. Neither lean clears noise against a 12.77-point residual SD.

## Away state: Chicago (3-1, +47)

Chicago won 59-37 at Carolina (2-2), lost 3-9 to Minnesota (4-0), beat Philadelphia (2-2) 27-7 and beat the Jets (1-3) 23-12. Its opponents are 9-7 combined. The Bears are 2-1 at home, 1-0 away and 0-1 in the division, on 7 days' rest, with a Week 10 bye still ahead [Source: pkt, team state, 04:23Z]. Three different quarterbacks have started: Williams in Weeks 1-2, Keenum in Week 3 and Bagent in Week 4 (25/34, 268 yards, 0 TD) [Source: nflverse player_stats_weekly.csv, 2026 wk1-4]. Bagent starts here by operator confirmation, which is stated, not verified. ESPN lists Williams as Questionable [Source: pkt, Quarterbacks, ESPN 04:21Z]. Next up: at ATL, NE, at SEA. With only four games, the SRS of +12.1 is a description of results so far, not a rating.

## Home state: Green Bay (2-2, -32)

Green Bay lost 22-39 at Minnesota, won 20-17 at the Jets, lost 14-35 at home to Atlanta and won 17-14 at Tampa Bay (1-4). Its opponents are 8-9 combined. The Packers are 0-1 at home and 0-1 in the division, on 7 days' rest, with a Week 11 bye [Source: pkt, team state, 04:23Z]. Minnesota leads the NFC North at 4-0. A loss here would leave Green Bay 2-3 and 0-2 in the division, while a Chicago win keeps the Bears second in the NFC order [Source: pkt, standings, 04:23Z]. Next up: DAL, at DET, CAR. The schedule offers no specific look-ahead fact.

## Matchup mechanics

Green Bay's offense is one-dimensional. Its rushing DVOA is -38.2% (EPA/att -0.349), it passes on 68.9% of dropbacks, and its passing DVOA is a modest +6.6% with CPOE at -8.8% [Source: pkt, FTN team-offense rushing/passing-analytics, 04:23Z]. Under pressure it collapses: DVOA -83.5%, EPA/DB -0.481 [Source: pkt, FTN team-offense pass-protection]. Chicago generates pressure on 35.3% of dropbacks with an 8.6% sack rate [Source: pkt, FTN team-defense pass-rush]. Green Bay's interior line is thin: center Monk and guard Banks are Doubtful and center Burton is Questionable [Source: pkt, ESPN injuries, 04:21Z]. That is the main input pushing toward Chicago.

Chicago's defense is depleted, though. Nickel CB Kyler Gordon, DT Turner and LB Elliott are Out, S Anthony Johnson Jr. is on IR, and LB Sewell is Questionable. The secondary-context severity is 5.25 for Green Bay's passing against Chicago versus 1.35 the other way (capped) [Source: pkt, secondary matchups]. Love throws often (30-53 attempts per game) and Watson has scored in 3 of 4 games (4 TDs) [Source: nflverse csv, wk1-4], so Green Bay's best path is volume passing at a short-handed back seven.

On Chicago's side, Micah Parsons is Out for Green Bay, and Green Bay already pressured at only 26.8% [Source: pkt, FTN team-defense pass-rush]. Chicago runs on 49.3% of plays and holds the ball 35.1 minutes, at 206 seconds per drive [Source: pkt, FTN tempo]. Monangai is Out after a 30-carry Week 4, which puts more volume on Swift. Left tackle Braxton Jones is on IR [Source: pkt, availability digest].

Weather: kickoff forecast is 74°F with no rain, wind 22.3 km/h and gusts to 42.1 km/h [Source: openmeteo json, CHI@GB forecast]. The stadium is outdoor.

## Market comparison

At BKR it is CHI -1.5 -101 / GB +1.5 -115, total 46 (O -118 / U +101), moneyline CHI -116 / GB +103. At BEO it is CHI -1 -113, total 46.5, moneyline -119 / -101. That is a 0.5-point spread difference, so no conflict. The implied score is CHI 23.75, GB 22.25 [Source: pkt, Market]. The packet has no Action Network opener. Earlier quotes of GB +2.5/+3 and the SuperContest's CHI -3 suggest the line moved toward Green Bay through 3; that is an inference. Splits as of Oct 9: 57% of spread tickets but only 46% of the money on CHI, and 74% of tickets on the Over [Source: Action Network, splits, 2026-10-09T19:41Z]. These are context only.

## Thesis and counter-thesis

Hypothesis: home margin -0.5 and total -0.5 against BKR. On the side, Green Bay's line injuries against Chicago's pressure largely offset Chicago's own defensive absences and its backup-QB status. On the total, Chicago's ball control, wind and both teams' game averages (44.25 and 44.5) point slightly under. The existing quantitative pass has Chicago by 4.6 with a 46.8 total. That pass is unbacktested, and its SRS inputs include Williams's games, so I do not adopt it.

Evidence quality is thin. The only tier-eligible side row is VSiN's "Packers ML (+120)" (w05-expert-verified.json#rows[519]); the price is now +103, so the price has moved. VSiN's GB +1.5 (rows[512]) is a near-miss from the same outlet. The GB +2.5/+3 rows from Action Network, The Favorites, Even Money and Fezzik (rows[41], [127], [153], [296]) are corroboration-only, at numbers that have moved 1-1.5 points. The +3 rows cross a key number, so they are a different bet. The CHI rows (rows[83], [181], [533]) are corroboration-only too.

The simulator at zero edge gives 50.0/50.0 on the side with no push, and 48.48/48.48 on the total with a 3.04% push. Under my hypothesis it gives CHI cover 51.31%, GB 48.69%, Over 46.96%, Under 50.00%, push 3.04%. These numbers are conditional on the hypothesis, not calibrated edges.

Counter-thesis: Chicago's +11.75 net points per game is real, and the market may be overpricing the QB drop. Or Love's volume could carve up a secondary missing Gordon and Johnson.

## Gaps

- CHI QB ambiguous: Williams Questionable, Bagent operator-confirmed.
- No Action Network opener; splits are from Oct 9.
- Quant pass (CHI -4.6) disagrees with the market (CHI -1.5).
- BKR window ends 00:15 PT.
- SuperContest labels reversed; use favorite CHI -3.
- Weather review_required (gusts 42.1 km/h).
- Global: 432 corroboration-only rows, 11 near-miss rows, SuperContest reversals on 6 games, BKR/BEO conflicts on two other games.

## Delta checklist

Official inactives (Williams, Monk, Banks, Burton, Hargrave, Sewell); fresh BKR/BEO capture; wind recheck; game status; reprice the VSiN ML and +2.5/+3 rows at the current number.
