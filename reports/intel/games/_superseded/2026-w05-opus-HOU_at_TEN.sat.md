# HOU@TEN, Week 5 single-game synthesis (opus)

Written ~05:35Z Sun (Sat 22:35 PT); HEAD 7ebef66; kickoff 17:00Z (10:00 PT). "Packet" = `data/research-intel/game-packets/2026-w05/HOU_at_TEN.md` (built 04:23Z). BKR captured 01:15Z (18:15 PT), window ends 00:15 PT; BEO captured 03:15Z (20:15 PT). Both are under six hours old.

**Disposition: price moved. Tier: skip. No side or total lean. Edge 0.0 margin / 0.0 total.**

## Game script

Two 0-4 AFC South teams. The market makes Houston a full-touchdown road favorite and implies about HOU 22.25, TEN 15.25 [Source: packet, implied score, BKR 01:15Z]. The likeliest script has Houston's passing game doing most of the scoring against a slow Tennessee offense that rarely makes big plays. Houston's injured offensive line is the main thing that could keep it within one score.

## Houston (away)

Houston lost 31-36 to BUF, 6-20 to CIN, 17-19 at IND and 30-34 to DAL. Three of the four were by five points or fewer, against opponents now 9-8 combined [Source: packet, HOU results, ESPN 04:21Z]. They have scored 84 and allowed 109, are 0-3 at home and 0-1 in the division, and come in on 7 days' rest with the bye in Week 8. Next: at JAX, then NYG. Four games is a small sample, so close losses are not a rating.

## Tennessee (home)

Tennessee lost 10-23 to NYJ, 20-24 to PHI, 7-12 at NYG and 18-24 at BAL; those opponents are 9-7 combined [Source: packet, TEN results, ESPN 04:21Z]. They score 13.8 points per game and allow 20.8, are 0-2 at home, have 7 days' rest and a Week 9 bye. Next: at IND, then CLE. Jacksonville (3-1) leads the division and Indianapolis is 2-2 [Source: packet, standings]. The loser drops to 0-5, three games behind Jacksonville. That is context only.

## Matchup mechanics

The clearest mismatch is Houston's passing game against Tennessee's pass defense. Houston's passing has a 25.8% DVOA, 0.067 EPA per dropback and 7.9% CPOE [Source: FTN team-offense/passing-analytics HOU]. Tennessee's pass defense allows a 35.8% DVOA and 0.196 EPA per dropback [Source: FTN team-defense/passing-analytics TEN]. Tennessee is also without S Amani Hooker (Out) and CB Joshua Williams (IR) [Source: ESPN injuries, 04:21Z]. The capped secondary-matchup context agrees: severity 5.85 for this matchup, 2.55 the other way.

Houston's line is the counterweight. OT Braden Smith is on IR, and OT Aireontae Ersery, G Ed Ingram and OT Blake Fisher are Questionable. Houston already allows a 7.0% sack rate, and its run game is weak: rush DVOA -19.3%, success rate 30.1% [Source: FTN pass-protection/rushing-analytics HOU]. If two of those three linemen sit, the passing edge shrinks.

Tennessee's offense is the weakest unit in the game: DVOA -10.8%, 5.0 yards per play, 6.5 aDOT, 54.0 plays per game, 23.72 minutes of possession [Source: FTN efficiency/tempo TEN]. Houston's defense is about average (DVOA -0.5%), with 14 sacks and an 8.8% sack rate. Tennessee's line, though, allows only 4.4%. The digest lists four Houston defensive linemen on IR (Mario Edwards Jr., Ali Gaye, Dylan Horton, Solomon Byrd), and it is unclear whether the FTN numbers predate those losses.

ESPN depth charts resolve C.J. Stroud and Cam Ward as the starters, with no flag [Source: packet, Quarterbacks, 04:21Z]. The game is outdoors and the weather is not a factor: 66F, 4% chance of precipitation, wind 13.5 km/h gusting to 24.8 [Source: Open-Meteo, 2026-10-10T17:56Z].

The power ratings are 2026 four-game values (matches_2026 true): SRS HOU -6.688, TEN -10.882; net points per game -6.25 vs -7.0. On those alone Houston is about four points better on a neutral field, less than a seven-point road line implies. The rules allow no adjustment from power ratings alone, and the market's win-total prior (8.6 vs 4.45) explains the gap.

## Market

BKR: HOU -7 -103 / TEN +7 -113, total 37.5 at -108 both ways, moneyline -344/+289 [Source: BKR, 01:15Z]. BEO: -7 at -110 each side, total 38, moneyline -375/+299 [Source: BEO, 03:15Z]. The line is exactly on the key number 7, and the push probability is 5.55%. There is no Action Network opener. Its 10-09 splits showed HOU -7.5, with 70% of tickets and 66% of money on Houston and 77%/70% on the Over; context only [Source: Action Network, 2026-10-09T19:41Z]. The SuperContest has Houston as a 7.5-point favorite (labels reversed; read from the favorite field).

## Evidence, thesis and counter-thesis

The only tier-eligible row is VSiN's Dave Tuley: "Best Bet: Titans +7.5" [Source: w05-expert-verified.json#rows[565], 2026-10-08T01:33Z]. VSiN's Steve Makinen also backs Titans +7.5, but his row is a near miss from the same outlet [rows[511]]. The corroboration-only rows split. For Tennessee: Even Money, Steve Fezzik and Action Network. For Houston: Action Network, Sharp or Square, BettingPros, Ryan Wormeli, Chad Millman and Simon Hunter. That disagreement stands as is. The Action Network Under 38.5 is a full point off the current 37.5, so it is downgraded.

Tuley's number was +7.5. At +7, a seven-point Houston win becomes a push instead of a win, so this is a moved price, not the same bet. My own inputs cancel out: the pass matchup favors Houston, while the line injuries and the SRS gap favor Tennessee. So the edge is 0.0 on both the margin and the total. At zero edge the simulator gives home cover 47.22%, away cover 47.22% and push 5.55% (50/50 excluding pushes); over and under are 50.0% each with no push [Source: margin-simulator.mjs]. These numbers depend on that hypothesis and are not calibrated edges. The provisional quant pass makes Houston a 5.06-point favorite. I note that disagreement but do not copy it.

Counter-thesis: if Houston's line is mostly intact, Stroud against a depleted secondary could make this a two-score game that a 13.8-point offense cannot chase. In the other direction, a return to +7.5 would reopen Tuley's side as a 2- candidate, and two or more Houston OL inactives would strengthen it.

## Gaps

- Carried warnings: AVAILABILITY HOU/TEN, SuperContest labels reversed, 1 near-miss row.
- Global: BKR expires 00:15 PT; BKR/BEO conflicts on other games only; 432 corroboration-only rows; SuperContest reversals elsewhere.
- No Action Network opener (quotes show 6.5, then 7.5, now 7).
- Quant pass (HOU -5.06) disagrees with the market; it is unbacktested.
- Nico Collins has no nflverse rows for Weeks 2-3.
- Roster vet: BKR "Cameron Ward" alias is UNVERIFIED.

## Pre-kickoff delta checklist

- Inactives: Ersery, Ingram, Fisher, Stewart, McDonald; Tate, Martin-Robinson.
- Fresh BKR/BEO capture (watch for +7.5).
- Weather recheck; ESPN game status.
- Reprice Tuley/Makinen +7.5 and the Under 38.5.
