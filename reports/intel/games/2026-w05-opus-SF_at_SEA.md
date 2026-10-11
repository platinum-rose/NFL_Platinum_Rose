# SF@SEA, Week 5 single-game synthesis (opus)

Packet = `data/research-intel/game-packets/2026-w05/SF_at_SEA.md` (built 04:23Z). Written Sat 2026-10-10 22:35 PT (device 2026-10-11T05:35:09Z), head 7ebef66. **Pass / skip**, edge 0.0 / 0.0.

## Game script

This is the NFC West's top two teams, Sunday 1:25 PM PT, outdoors in Seattle. Bookmaker has SEA -3 (-123), SF +3 (+105), total 46.5 (O -104 / U -112), ML SEA -172 / SF +149 [Source: packet BKR, 2026-10-11T01:15Z]. That implies about SEA 24.75, SF 21.75. The script turns on one question: can San Francisco's efficient passing outpace Seattle's pass rush while its own front plays without Nick Bosa and James Thompson Jr.?

## San Francisco (away)

The 49ers are 4-0, 122-64. In order: won 27-7 at LAR, 35-13 vs MIA, 36-30 vs ARI, 24-14 vs DEN (+20, +22, +6, +10). Three of the four were at home. They are 2-0 in the division, against opponents a combined 5-11 [Source: packet SF table, 04:23Z]. Four games against weak opposition is a small sample, not a rating. They come in on 7 days' rest with the bye in Week 8; Washington at home comes next, and there is no look-ahead angle.

## Seattle (home)

The Seahawks are 3-1, 105-73: won 13-10 vs NE, 31-7 at ARI, lost 31-33 at WAS, won 30-23 vs LAC (+3, +24, -2, +7). They are 2-0 at home and 1-0 in the division, against opponents a combined 4-12. They also have 7 days' rest, with the bye in Week 11; at DEN, then KC, come next. Sam Darnold is the ESPN-resolved starter, but Drew Lock threw most of Weeks 1-2. Darnold started Weeks 3-4 (31/45, 379 yds, 4 TD, 2 INT; then 13/22, 168, 2 TD, 1 INT) [Source: player_stats_weekly.csv, SEA QB wk1-4], so Seattle's season numbers blend two quarterbacks.

Stakes: a SF win means 5-0 and a two-game lead plus the head-to-head. A Seattle win ties both at 4-1, with Seattle 2-0 in the division. The packet order has SF 1st and SEA 4th in the NFC.

## Matchup mechanics

The 49ers' passing game is the best unit on the field: passing DVOA 89.7%, EPA/DB 0.565, zero sacks allowed on a 20.3% pressure rate [Source: packet FTN team-offense passing/pass-protection]. Their run game is ordinary (EPA/att -0.057), and Seattle's rush defense is elite (DVOA -37.4%), so expect SF to throw into Seattle's 36.9% pressure rate, 7.4% sack rate and 6 interceptions [Source: packet FTN team-defense pass-rush/overview]. That strength-on-strength matchup decides the side.

Seattle passes well (DVOA 40.2%) but cannot run (EPA/att -0.220). Its backfield is thin: Zach Charbonnet Out, George Holani Questionable, Jadarian Price on IR. Emanuel Wilson had 21 carries in both Weeks 2 and 4. Under pressure Seattle collapses (EPA/DB -0.575). San Francisco's pressure rate was only 25.8% even with Bosa, and Bosa and Thompson are now Out, with three more defensive linemen on IR per the digest [Source: packet ESPN injury report 04:21Z]. Safety Marques Sigle is Out and CB Upton Stout is Questionable. Those losses remove SF's best route to exploiting Seattle's protection; Seattle's own absences (CB Julian Neal IR, LB Chazz Surratt Out) matter less. The capped secondary-context score agrees (5.33 SEA offense vs 3.75).

The power ratings favor SF (SRS 14.04 vs 1.70). The label check shows these are 2026 four-game values built on soft schedules, so they carry no adjustment. Pace is similar: SF runs 57.0 plays per game and SEA 59.3. On weather, the forecast is 59°F, 0% precipitation and 23 km/h gusts, with no material flag [Source: weather-openmeteo.json, 2026-10-10T17:56Z].

## Market comparison

BetOnline matches: SEA -3 -118 / SF +3 -102, 46.5 at -110, ML -170/+149 [Source: packet BEO, 03:15Z]. There is no conflict, and both captures are fresh (the BKR window ends 07:15Z). The packet has no Action Network opener. 82% of tickets and 88% of money are on SF +3 [Source: AN splits, 2026-10-09T19:41Z], yet Seattle is the juiced side, so the price leans Seattle against public money. The SuperContest lists SEA as a 3-point favorite. The simulator puts 15.6% on an exact 3-point margin.

Only one row is tier-eligible: VSiN Seattle -3 (`w05-expert-verified.json#rows[450]`), quote truncated to "Seattle Seahawks -3 vs." Six SEA -2.5 rows ([42], [123], [186], [340], [348], [369]) are corroboration-only and sit across the key number 3, so they back a different bet. SF backers (PFF ML [179], Ross Tucker +3 [308]) are corroboration-only. So are the Under rows (BettingPros [189]/[141], Woolcock [246], Erickson [339]), and ESPN's Under 49 [393] is a near-miss, downgraded for being 2.5 points off.

## Thesis and counter-thesis

My edge hypothesis is 0.0 on the margin and 0.0 on the total. SF's efficiency edge and its defensive-front losses offset, and the move toward Seattle against public money suggests the absences are priced. At zero edge the simulator gives home 0.4587, away 0.4587, push 0.0827 (50/50 excluding pushes), and Over/Under 0.50/0.50 with total push 0. These numbers are conditional, not calibrated.

The strongest case against me is that the market overreacts to one rusher. SF has 0 sacks allowed, and the provisional quant pass makes the game a pick'em (home +0.10), so SF +3 at +105 could be the value side. Invalidators: Stout or Trent Williams inactive, a move to -2.5 or -3.5, gusts above 40 km/h, or a second tier-eligible outlet.

## Gaps

- AVAILABILITY SF: Out Thompson Jr., Bosa, Sigle, Juszczyk; Questionable Stout.
- AVAILABILITY SEA: Out Surratt, Charbonnet; Questionable Holani; IR Neal, Charles.
- 2 near-miss rows ([393], [505]): context only.
- Global WARNs (corroboration-only rows, SuperContest reversals and book conflicts on other games) are context only.
- The quant pass (home +0.10, home cover 43.0%) disagrees with the market by about 3 points toward SF; it was not adopted.
- The digest lists Trent Williams "setback" and Mykel Williams "out"; ESPN does not, and ESPN was used.
- Preflight WARN: Bookmaker window for this game expires within 120 min (00:15 PT); this file was written before it lapsed.
- No AN opener; VSiN quote truncated.

## Pre-kickoff delta checklist

- Official inactives and starters
- Fresh BKR/BEO capture
- Weather recheck
- Game status
- Reprice the -2.5 source picks at -3
