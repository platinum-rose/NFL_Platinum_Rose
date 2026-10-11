# Week 5 SF@SEA (opus) — pass / skip

Written Sat 10-10 ~23:50 PT (2026-10-11 ~06:50Z, device clock). Captures: BKR 06:21Z (23:21 PT), BEO 06:24Z (23:24 PT), late Saturday PT / early Sunday UTC. Recommendation windows end 05:21 and 05:24 PT Sunday, about eight hours before the 13:25 PT kickoff, so every price below will be `stale_for_recommendation` by game time and must be recaptured [Source: packet SF_at_SEA.md, market windows, 2026-10-11T06:35Z].

## Game script

Division game, NFC West, first 2026 meeting. SEA is a 3-point home favorite at both books (BKR SEA -3 -123 / SF +3 +105; total 46.5, o-103/u-113; ML SEA -172 / SF +149). Market-implied score SEA 24.75, SF 21.75 [Source: packet, BKR, 06:21Z]. My base script is a field-position game where Seattle's run defense forces San Francisco into Purdy dropbacks, and Seattle's offense lives on Darnold's clean-pocket throws against a depleted 49ers front.

## Away state: San Francisco (4-0)

Results: W 27-7 at LAR (+20), W 35-13 MIA (+22), W 36-30 ARI (+6), W 24-14 DEN (+10). PF 122, PA 64, +58. Three of four at home; 1-0 away; 2-0 division. Opponents are a combined 5-11. Rest 7 days, bye still ahead (Week 8); next WAS home, at ATL [Source: packet, team state, 2026-10-11]. Four games against weak schedules is a small sample; I do not treat 4-0 as a rating.

## Home state: Seattle (3-1)

Results: W 13-10 NE (+3), W 31-7 at ARI (+24), L 31-33 at WAS (-2), W 30-23 LAC (+7). PF 105, PA 73, +32; 2-0 home, 1-0 division. Opponents a combined 4-12. Rest 7 days, bye Week 11; next at DEN, then KC and CHI at home. A Seattle win pulls SEA level with SF at 4-1 atop the NFC West (SF 4-0 is NFC 1, SEA 3-1 NFC 4 in the packet order); a SF win opens a two-game division lead. Darnold has started only Weeks 3-4; Drew Lock threw the Week 1-2 passes [Source: nflverse player_stats_weekly.csv, attempts, 2026 wk1-4].

## Matchup mechanics

Power ratings favor SF: SRS 14.0 vs 1.7, net 14.5 vs 8.0 points per game, model rank 1 vs 7. The label check confirms these equal 2026 four-game point differential (attribution wording is stale), so they get no point adjustment alone [Source: packet power ratings, matches_2026 true].

SF offense vs SEA defense: FTN team-offense passing-analytics EPA/DB 0.565 and DVOA 89.7%, pass-protection SK% 0.0% and PRESS% 20.3%. Seattle's defense is the best unit it faces: team-defense efficiency EPA/PLY -0.142, DVOA -22.5%, 7 takeaways; pass-rush PRESS% 36.9%, SK% 7.4%; rush-analytics DVOA -37.4%. SF's rushing-analytics EPA/ATT is already -0.057, so the run likely stalls and Purdy carries the load [Source: FTN tables in packet].

SEA offense vs SF defense: Seattle's rushing-analytics EPA/ATT -0.220 and DVOA -28.4%, with Charbonnet Out (ESPN injury report) and Holani Questionable (ESPN injury report), leaving Emanuel Wilson (21 carries Weeks 2 and 4). Seattle's pass-protection pressured EPA/DB is -0.575 but clean-pocket EPA/DB__2 is 0.497. That matters because SF's pass rush was already modest (team-defense pass-rush PRESS% 25.8%, SK% 3.9%) and Nick Bosa and James Thompson Jr. are Out (ESPN injury report). Several more SF linemen sit in the ESPN roster IR/Out group (unconfirmed) and are not counted as Out. SF CB Upton Stout is Questionable (ESPN injury report) [Source: ESPN injury feed via packet, 2026-10-11T06:35Z].

Pace is neutral: SF 57.0 plays/game, SEA 59.3 (FTN tempo). Venue is outdoor; Open-Meteo shows 59F, 0% precipitation, wind 14.2 km/h, gusts 23 km/h, so no weather adjustment [Source: openmeteo weather json, captured 2026-10-10T17:56Z]. Secondary-matchup severity is 3.75 for SF's offense and 5.33 for SEA's offense; it is capped context only.

## Market

Both books match at SEA -3 / 46.5. The Action Network opener is missing in the packet, so I cannot measure movement. Splits (2026-10-09T19:41Z) show 82% of tickets and 88% of money on SF +3, and 71%/73% on the Over; context only. The SuperContest lists SEA -3 as favorite. Three is the key number: at -3 the simulator's side_push is 8.27%, so many corroboration-only picks quoted at SEA -2.5 are a different bet now.

## Evidence

One tier-eligible row: VSiN (Wes Reynolds), "Seattle Seahawks -3 vs." at the current number [w05-expert-verified.json#rows[450]]. Corroboration-only SEA support: Action Network rows[42], The Favorites rows[123], Sharp or Square rows[186] (all -2.5), BettingPros rows[190], PFT rows[543]. Contrary corroboration-only: PFF SF ML rows[179] and Ross Tucker SF +3 rows[308]. Under picks were quoted at 47.5/47/49 (rows[141], rows[246], rows[339]; near-miss ESPN rows[393] at 49), at least one point above 46.5, so they are downgraded.

## Thesis and counter-thesis

Edge hypothesis: 0.0 home margin, 0.0 total. Each side has one numeric input pointing its way: SF's ratings and passing efficiency versus Seattle's run defense and pass rush plus SF's missing pass rushers. One tier-eligible outlet, -123 juice at the key number, and a public skewed toward SF do not add up to a priced edge. At zero edge, the simulator gives 45.87% each side, 8.27% push (50/50 excluding pushes), and Over/Under 50/50 with 0% push. These numbers are conditional on the hypothesis, not calibrated edges. Disposition: pass, tier skip.

Counter-thesis: the quantitative pass prices this near pick'em (home margin +0.1), which would favor SF +3. If SF's 0% sack rate holds against Seattle's 36.9% pressure rate, the stronger four-game team is getting a full field goal.

## Gaps

- Recommendation windows lapse before kickoff (05:21/05:24 PT); recapture required.
- Quant pass vs market disagreement about 2.9 points; not copied.
- No Action Network opener; BEO prop rows lack row-level capturedAt.
- Darnold: two 2026 starts only. "Michael Evans" UNVERIFIED in roster gate.
- Global: 432 corroboration-only rows; SuperContest label reversals for other games.

## Pre-kickoff delta checklist

- Official inactives: Stout, Holani, the SF roster IR/Out group, and both starting QBs.
- Fresh BKR/BEO capture; SEA -2.5 or -3.5 changes the read.
- Weather recheck (wind gusts above 30 km/h or rain).
- Game status and venue confirmation.
- Reprice source picks against the new number.
