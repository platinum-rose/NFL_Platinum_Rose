# Week 5 synthesis (opus): CLE@NYJ

Run at 2026-10-11T06:50:50Z (Sat 10-10 23:50 PT). BKR captured 06:21Z (Sat 23:21 PT), BEO 06:24Z (Sat 23:24 PT); both packet recommendation windows end 11:00Z (Sun 04:00 PT), six hours before the 17:00Z kickoff, so these early-Sunday captures will lapse before kickoff. [Source: packet CLE_at_NYJ.md, Market, 2026-10-11T06:35Z]

## Game script
A slow, low-total game between two flawed offenses, priced NYJ -2.5 / 39.5 at BKR. The books disagree on the side (BKR NYJ -2.5, BEO NYJ -1), so no price-specific recommendation is possible: disposition conflicted, tier research_only, edge 0.0 / 0.0.

## Away state: Cleveland (3-1, AFC North 2nd)
Results in order: L 10-34 at JAX (3-1), W 23-19 at TB (1-4), W 21-18 vs CAR (2-2), W 27-24 vs PIT (2-2). The three wins came by 4, 3 and 3; point differential is -14 (20.2 PPG for, 23.8 against), and opponents are a combined 8-9. CLE is 2-0 at home, 1-1 away, 1-0 in the division, enters on 9.7 days of rest, and has not had its bye (Week 11). Next comes BAL at home, then TEN and PIT on the road, so a win here keeps CLE level with BAL at the top of the division before the head-to-head. CLE is the AFC's sixth team on win percentage. Four games is a small sample; a 3-1 record built on one-score wins is not a rating. [Source: packet, Team state CLE, 2026-10-11T06:35Z]

## Home state: New York (1-3, AFC East 3rd)
Results: W 23-10 at TEN (0-4), L 17-20 vs GB (2-2), L 24-31 at DET (2-2), L 12-23 at CHI (3-1). Differential -8, opponents 7-9, 0-1 at home, 1-2 away, 0-0 division, 7.0 days of rest, bye in Week 13. This is only its second home game; next are at NE, then MIA and LV at home. A loss drops NYJ to 1-4 and two games behind BUF. [Source: packet, Team state NYJ, 2026-10-11T06:35Z]

## Matchup mechanics
Quarterbacks: the packet resolves Deshaun Watson (CLE) and Geno Smith (NYJ) as starters from ESPN depth plus injury report; no QB ambiguity warning. Geno threw only 15 passes in Week 4. [Source: nflverse player_stats_weekly.csv, attempts wk4]

Protection decides this game. FTN pass-protection shows CLE at EPA/DB -0.135 under pressure vs 0.331 clean (EPA/DB__2), and NYJ at -0.592 under pressure vs 0.356 clean. NYJ's pass rush is passive (FTN pass-rush PRESS% 16.8%, SK% 6.3%) and may be thinner with Will McDonald IV Questionable and Braiden McGregor on IR (ESPN injury report). CLE's rush is aggressive (PRESS% 36.6%, 12 sacks), but CLE lists Mason Graham and Mike Hall Jr. Out and Kalia Davis on IR (ESPN injury report): three interior linemen, which also weakens a run defense already at FTN rush-analytics EPA/ATT -0.021. Alex Wright and Jeremiah Owusu-Koramoah sit only in the ESPN roster IR/Out group (unconfirmed), not confirmed Out. [Source: FTN team tables + ESPN injury feed, 2026-10-11T06:35Z]

Neither team runs well: CLE rushing EPA/ATT -0.275 (SUCC% 30.3%), NYJ -0.193, and NYJ is without Breece Hall (Out, ESPN injury report). Both guards Teven Jenkins (CLE) and Dylan Parham (NYJ) are Out. Tempo is slow (both 57.5 PLY/GM; SEC/PLY 28.3 CLE, 31.0 NYJ), consistent with a sub-40 total. Power ratings (2026 four-game values; matches_2026 true) have CLE SRS 0.405 vs NYJ -4.359, but net PPG favors NYJ (-2.0 vs -3.5); no point adjustment from those alone. Secondary-matchup severity is 3 (CLE offense vs NYJ) vs 1.35, capped context. [Source: packet, Power ratings / FTN, 2026-10-11T06:35Z]

Weather: MetLife is outdoor. Open-Meteo forecast for kickoff: 65.8F, 78% precipitation probability, 1.8 mm, wind 16.6 km/h gusting 37.1 km/h. That supports caution on the passing game but the forecast is from 10-10 17:56Z and must be rechecked; I apply no total adjustment. [Source: 2026-10-10-week5-weather-openmeteo.json, CLE@NYJ forecast, 2026-10-10T17:56:55Z]

## Market comparison
BKR: NYJ -2.5 -107 / CLE +2.5 -109, total 39.5 -108 both ways, ML NYJ -135 / CLE +118. BEO: NYJ -1 -125 / CLE +1 +105, total 39.5 -110, ML NYJ -140 / CLE +120. Implied score NYJ 21.0, CLE 18.5. Key number 3 sits just above the line: at a -3 line the simulator's side_push is 8.27%. Action Network (10-09 19:41Z, context only) shows CLE +2.5 with 84% of tickets and 74% of money, Over with 73%/63%; no opener is in the packet. SuperContest lists NYJ -2.5 (favorite field). [Source: packet Market, BKR 06:21:29Z, BEO 06:24:03Z]

## Evidence
The only tier-eligible row is VSiN, NYJ moneyline at -130 (w05-expert-verified.json#rows[454]); the price has moved to -135/-140. NYJ -1.5 calls from Action Network (rows[110]), Sharp or Square (rows[135]) and Even Money (rows[150]) are corroboration-only and quoted a full point off the current -2.5, so they are downgraded. CLE support (BettingPros ML rows[178], Pro Football Talk rows[537], Even Money teaser rows[161]) is also corroboration-only. Sources are split and kept unaveraged.

## Thesis and counter-thesis
Edge 0.0 on margin and total. The zero-edge simulator gives 50.0% / 50.0% on side and total with 0 push at 2.5 and 39.5 (conditional on that hypothesis, not a calibrated edge). The packet's quantitative pass sees NYJ by 0.74, about 1.8 points toward CLE, but it is unbacktested and only supports that the BEO -1 may be the better-shaded number. The counter-thesis: CLE's interior absences let NYJ, even without Hall, control the line and protect Geno, making -2.5 cheap. The book conflict blocks either reading.

## Gaps
- BOOK CONFLICT BKR -2.5 vs BEO -1; recapture required.
- Windows end 11:00Z; captures lapse before kickoff.
- Quant pass (NYJ +0.74) disagrees with market (-2.5).
- Weather review_required; forecast 13h old.
- No Action Network opener/movement in packet.
- Global: 432 corroboration-only rows; SuperContest label reversals on six other games.

## Pre-kickoff delta checklist
- Official inactives: McDonald IV, Enagbare, CLE DT group, roster-group players.
- Confirm Watson and Smith start.
- Fresh BKR and BEO capture; reconcile the side.
- Weather recheck (rain, gusts).
- Game status; reprice VSiN and the -1.5 source picks.
