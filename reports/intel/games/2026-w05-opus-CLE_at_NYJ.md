# CLE@NYJ — Week 5 single-game synthesis (opus)

Run ~22:50 PT Sat (05:50Z); kickoff 10:00 PT Sun, outdoor venue. Packet = `game-packets/2026-w05/CLE_at_NYJ.md`. BKR captured 18:15 PT (window ends 00:15 PT); BEO 20:15 PT. Neither is stale, but the books disagree by 1.5 spread points, so no price-specific call.

## Game script

Two slow, run-poor offenses meet in probable rain. Both teams run 57.5 plays per game; Cleveland averages 28.3 seconds per play and New York 31.0 with only 10.0 drives per game [Source: packet, FTN team-offense/tempo PLY/GM, SEC/PLY, DRV/GM, 2026 wk1-4]. Expect a field-position game decided on a few passing downs, roughly what the 21.0-18.5 implied score already says [Source: packet, market-implied score, 01:15Z].

## Away state: Cleveland

Cleveland is 3-1 with a -14 point differential: a 10-34 loss at Jacksonville (now 3-1), then 23-19 at Tampa Bay (1-4), 21-18 against Carolina (2-2) and 27-24 against Pittsburgh (2-2) [Source: packet, CLE results table]. Three wins by four or fewer against an 8-9 slate: the record outruns the scoring. Cleveland is 1-1 on the road, 1-0 in the division, has had 9.7 days of rest, and has not used its bye (week 11). It sits second in the AFC North behind Baltimore (3-1, +20) and sixth in the packet's AFC order; Baltimore visits next week (context only) [Source: packet, standings/next games].

## Home state: New York

The Jets are 1-3 at -8: a 23-10 win at Tennessee (0-4), then losses of 17-20 to Green Bay, 24-31 at Detroit and 12-23 at Chicago (3-1) [Source: packet, NYJ results table]. This is only their second home game (0-1 at home); they are third in the AFC East, 0-0 in division. Rest is 7.0 days; the bye is week 13. Next: at New England, then Miami and Las Vegas at home. Four games is a small sample; neither start is a rating.

## Matchup mechanics

Power ratings equal the 2026 four-game point differential (matches_2026 true). Cleveland's SRS is +0.41 (rank 14) against New York's -4.36 (rank 23), but net points per game favors the Jets slightly (-2.0 against -3.5) and Pythagorean win rate is 0.441 against 0.407 [Source: packet, power ratings, 2026 wk1-4]. They disagree; no adjustment.

Cleveland's run game is the worst unit in the matchup: -0.275 EPA per carry, 30.3% success and -32.0% DVOA, against a passing game at +0.146 EPA per dropback and 20.5% DVOA [Source: packet, FTN CLE team-offense rushing/passing-analytics]. Deshaun Watson is the resolved starter; Dillon Gabriel is on IR [Source: packet, Quarterbacks, ESPN 04:21Z]. When pressured, Cleveland drops to -0.135 EPA per dropback, but the Jets pressure on only 16.8% of dropbacks, the lowest figure on either side here, and edge rusher Will McDonald IV is questionable with Braiden McGregor on IR [Source: packet, FTN NYJ team-defense/pass-rush PRESS%; ESPN injuries 04:21Z]. That suggests cleaner pockets for Watson, Cleveland's best argument.

The Jets pass well when clean (+0.137 EPA per dropback, 5.8% CPOE, one turnover all season) and collapse under pressure (-0.592 EPA, -121.3% DVOA) [Source: packet, FTN NYJ team-offense pass-protection/passing-analytics]. Cleveland's defense pressures 36.6% of dropbacks, but three interior linemen are unavailable: Mason Graham and Mike Hall Jr. are out and Kalia Davis is on IR [Source: packet, AVAILABILITY CLE, ESPN 04:21Z]. That is the game's largest absence, blunting Cleveland's best defensive lever. Both lines also lose a guard: Teven Jenkins for Cleveland and Dylan Parham for New York. Breece Hall is out; Braelon Allen carried 14 times for 59 yards in week 4 when Hall did not record a carry [Source: nflverse player_stats_weekly.csv, NYJ RB wk1-4]. Geno Smith threw only 15 passes in week 4, and the packet tags him as "active_news" without detail, which I cannot resolve.

Secondary-matchup scores lean slightly to Cleveland's offense (3 vs 1.35); capped, no adjustment.

Weather: Open-Meteo at kickoff shows 65.8°F, 78% precipitation probability, 1.8 mm, wind 16.6 km/h with gusts of 37.1 km/h from 101° [Source: 2026-10-10-week5-weather-openmeteo.json, CLE@NYJ forecast, captured 17:56Z Sat].

## Market comparison

BKR: NYJ -2.5 (-107) / CLE +2.5 (-109), total 39.5 (-108 both), moneyline NYJ -135 / CLE +118 at 01:15Z. BEO: NYJ -1 (-125) / CLE +1 (+105), total 39.5 (-110), moneyline -140 / +120 at 03:15Z [Source: packet, Market]. The moneylines nearly agree, so the gap is partly juice, but it remains a conflict. The line sits just under 3; the simulator puts an exact three-point margin at 15.9%. No Action Network opener was captured. The splits from Friday show 84% of tickets and 74% of money on Cleveland +2.5, and 73% of tickets on the over; these are context only [Source: packet, Action Network splits, 2026-10-09 19:41Z]. SuperContest: NYJ -2.5.

## Thesis and counter-thesis

Only one row is tier-eligible: VSiN's "New York Jets -130 ML vs." [w05-expert-verified.json#rows[454]], one outlet, at a price now -135/-140. Four corroboration-only rows took NYJ -1.5 (Action Network rows[110], Sharp or Square rows[135], Even Money rows[150], podcast rows[260]); that number is one point off BKR, so they are downgraded. Cleveland support is also corroboration-only: Pro Football Talk rows[537], BettingPros rows[178], Daniel Jeremiah and Bucky Brooks rows[52] (with rows[53] on NYJ), and teasers through 8.5 (rows[161], rows[298], rows[299]). The split is preserved.

My margin edge is 0.0. Cleveland's protection advantage is offset by its depleted interior defense, and the provisional quantitative pass (home margin +0.74, so a lean to CLE) is unbacktested. For the total I use -0.5 points on weather alone, inside the 1.0 cap. Conditional on that hypothesis, the simulator gives 50.0/50.0 on the side and 48.5% over / 51.5% under, with zero pushes at both half-point lines. The zero-edge baseline is 50/50 on both. These are hypothesis-conditional, not calibrated edges.

The counter-thesis: rain and gusts often matter less than forecasts imply, and Cleveland's interior injuries could let a clean Geno Smith beat a 39.5 total that is already low.

## Gaps

- BKR/BEO conflict (-2.5 against -1); no price-specific claim until a recapture.
- Weather is flagged review_required; the forecast is from 17:56Z Saturday.
- Geno Smith has an unexplained "active_news" event; McDonald IV and Enagbare are questionable.
- The quantitative pass (CLE lean, home margin +0.74) disagrees with the market's -2.5.
- No Action Network opener; the splits are from Friday.
- Global: 432 corroboration-only rows; SuperContest reversals affect other games.
- Props: none carried. No tier-eligible prop source, and the game is conflicted.

## Pre-kickoff delta checklist

- Official inactives and starters
- Fresh BKR/BEO capture (NYJ -3?)
- Weather recheck
- Game status
- Reprice source picks
