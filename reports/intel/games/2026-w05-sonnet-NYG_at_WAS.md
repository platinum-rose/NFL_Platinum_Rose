# NYG@WAS, Week 5 single-game synthesis (sonnet test)

Written Sat 2026-10-10 about 18:50 PT (2026-10-11 01:50Z). Kickoff Sun 2026-10-11 10:00 PT. Bookmaker (BKR) captured 18:15 PT and BetOnline (BEO) 18:19 PT; both inside their windows, neither stale. [Source: data/research-intel/game-packets/2026-w05/NYG_at_WAS.md, Market, 2026-10-11T01:15:40Z and 2026-10-11T01:19:56Z]

## Game script

Two weak offenses meet in a 41.5 total. The market-implied score is Washington 22.5, New York 19.0. [Source: packet, market-implied score, BKR -3.5 / 41.5] Neither team runs well, so points depend on two poor pass defenses and on Washington's quarterback health.

## Away state: Giants

New York is 3-1, first in the NFC East and fifth in the NFC order. Results: W 28-20 over DAL (home), L 6-28 at LAR, W 12-7 over TEN (home), W 36-24 over ARI (home). Opponents faced are 5-11 combined, three of four games were at home, and the lone road game was a 22-point loss. They are 1-0 in the division, rested 7.0 days, with the bye still ahead in Week 8. [Source: packet, Team state, 2026-10-11T01:40Z] Point differential is only +3, and four games is a small sample, so I do not turn the record into a rating. The packet shows SRS -4.1 (rank 22) and model rank 14. [Source: packet, Power ratings, nflverse games.csv via packet]

The quarterback picture is untidy. The packet starter row lists Jaxson Dart at 0.95 from a Week 1 usage lock. Weekly stats show Dart with 5 attempts in Week 2 and Jameis Winston with 27, 22 and 29 attempts in Weeks 2 to 4, both books post Winston passing props, and the digest lists Dart as IR. I treat Winston as the likely starter, unconfirmed. [Source: data/vault-seed/nflverse/player_stats_weekly.csv, QB rows weeks 1-4, season 2026; data/research-intel/source-evidence/2026-10-11-bookmaker-week5-sgp-parsed.json, Winston pass_yds main line 200.5, 2026-10-11T01:15:40Z]

## Home state: Commanders

Washington is 1-3, last in the division at 0-2, with a -34 point differential. Results: L 22-24 at PHI, L 20-37 at DAL, W 33-31 over SEA (home), L 13-30 to IND (home). Opponents faced are 9-7 combined, a harder slate than New York's, yet they allow 30.5 points a game. They are 1-1 at home and 0-2 away, rested 7.1 days, with the bye in Week 7. [Source: packet, Team state] SRS is -11.4 (rank 32) and net points per game -8.5, though the market's win-total ranking puts them 26th against New York's 25th. Jayden Daniels is operator-confirmed as the starter (stated 2026-10-11T00:28Z, not verified; elbow, with a "setback" event in the digest). Official inactives decide. The stats file shows Daniels only in Weeks 1 and 2, so I cannot see the last two games with him.

## Matchup mechanics

The Giants offense is poor: DVOA -18.8%, success rate 39.3%, rushing DVOA -17.3%. Protection is the weak point, with an 8.7% sack rate and 33.1% pressure rate. Washington blitzes on 47.4% of dropbacks but gets only a 4.6% sack rate, so pressure on Winston is plausible, but Washington's pass defense is porous (passing DVOA 19.7%, open rate 72.1%), which rewards quick throws. [Source: packet, FTN team-offense pass-protection, team-defense pass-rush and passing-analytics] Washington's run defense is good (rush DVOA -17.5%, stuff rate 23.5%), so New York should depend on short passing.

Washington's offense is as poor (DVOA -16.6%, rushing DVOA -22.0%) but protects the ball, with 1 turnover against New York's 5. The Giants defense is middling (DVOA -0.3%), better against the run (-9.0%) than the pass (5.8%). Washington plays faster, 65.3 plays and 27.7 seconds per play against 61.0 and 30.3. The digest lists defensive-front and receiver injured-reserve events for New York and defensive-front and secondary events for Washington, none confirmed current. Secondary-matchup severities are near equal (5.55 and 5.25) and capped.

Weather: kickoff forecast is 68.4 F, 72% precipitation probability but 0 mm expected, wind 12.8 km/h, gusts 26.3 km/h. That is not a material total signal, so I apply none. [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, NYG@WAS forecast, 2026-10-10T17:56:55Z]

## Market

BKR has Washington -3.5 (-108 each side), total 41.5 (over -103, under -113), moneyline Giants +159, Washington -182. BEO has the same numbers, spread prices Giants -113 and Washington -107, moneylines +157 and -180. The books agree. The Action Network opener on 2026-10-05 was Washington -3.5 with a total of 44.5, so the spread is unchanged while the total fell 3 points. Splits captured 2026-10-09, when the line was Washington -4.5, showed 74% of tickets and 75% of money on the Giants and 77% of tickets on the over; that snapshot is a day old at a different number and is context only. SuperContest lists Washington -3.5 as a contest reference, not a price.

## Evidence quality and thesis

Only two rows are tier-eligible, both VSiN: Washington -3.5 [Source: w05-expert-verified.json#rows[452]] and Giants +3.5 [Source: w05-expert-verified.json#rows[564]]. One outlet counts once, and the two disagree; I preserve that and do not average. The other 25 rows are corroboration-only.

My edge hypothesis is 0.0 on the home margin and 0.0 on the total. The SRS gap favors New York, but it is four games of data and the market already prices health and home field. The existing quantitative pass (Washington cover 43.4%) disagrees with the market; it is provisional and I do not copy it. Conditional on 0.0, the simulator gives 50/50 on side and total. Disposition is conflicted, tier skip, no side or total lean.

## Counter-thesis and invalidators

The strongest case against me is that the market underprices New York: Washington ranks last in SRS, allows 30.5 points a game and is 0-2 in the division. A Daniels scratch, or confirmation of a different Giants starter, would move the line and could flip the read. A move through 3 to Washington -3 or -4, or the total moving a point or more, makes it a different bet.

## Gaps

- Weather: review_required, precipitation probability 72%; no adjustment applied.
- Global warnings once: 432 corroboration-only rows, and SuperContest label reversals on six other games.
- QB: Giants starter unconfirmed, packet row (Dart) conflicts with stats and book props (Winston); Daniels Weeks 3-4 missing from the stats file.
- Existing quantitative pass (Washington cover 43.4%, home margin +0.76) differs from the market line; not copied.
- No current injury report in the packet; four-game sample.

## Pre-kickoff delta checklist

- Official inactives and starters: Daniels, Winston or Dart, Nabers, Likely.
- Fresh BKR and BEO capture (BKR window ends 2026-10-11 00:15 PT).
- Weather recheck for rain and gusts.
- Game status and any line move through 3.
- Reprice any source pick against the live number.
