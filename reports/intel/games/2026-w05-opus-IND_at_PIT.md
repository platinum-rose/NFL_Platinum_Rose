# Week 5 synthesis: IND@PIT (opus)

Run 06:50Z = Sat 23:50 PT. Kickoff 17:00Z = Sun 10:00 PT. Captures: BKR 06:21Z (23:21 PT), BEO 06:24Z (23:24 PT). Both recommendation windows end 11:00Z (Sun 04:00 PT), six hours before kickoff, so these lines go stale_for_recommendation before the game.

**Disposition: price moved. Tier: research_only. Side: none. Total lean: Under (research only). Edge: margin 0.0, total -0.5.**

## Game script

BKR has PIT -3 +103 with a total of 43.5, which implies PIT 23.25, IND 20.25 [Source: packet, implied score, BKR 06:21Z]. The expected script: Indianapolis leans on Jonathan Taylor against Pittsburgh's best unit because its depleted receiver room struggles through the air. Rodgers drops back against a thinned Colts rush. Gusty outdoor wind pushes both teams toward the run.

## Away: Indianapolis 2-2

The Colts lost to BAL by 18 at home and at KC by 3, then beat HOU by 2 at home and won at WAS by 17. Their opponents are a combined 8-8, and both wins came against teams now 0-4 and 1-3. They are 1-1 away and 1-0 in the division, with 7.1 days of rest and a Week 13 bye. They sit a game behind JAX and eighth in the AFC order. Next: TEN at home, @MIN, @JAX [Source: packet, team state].

## Home: Pittsburgh 2-2

The Steelers beat ATL by 7, lost at NE by 17, beat CIN by 3 and lost at CLE by 3. Their opponents are a combined 9-7. They are 2-0 at home, 0-2 away and 1-1 in the division. They have 9.7 days of rest (2.6 more than IND) and a Week 9 bye. They are fourth in the North, a game behind BAL and CLE, and play @TB and @NO next. Four games is a small sample; no schedule adjustment.

## Matchup mechanics

**IND run game.** The game turns on strength against strength. IND's rushing-analytics table shows EPA/ATT 0.119 and SUCC% 45.9%. PIT's defensive rush-analytics table shows EPA/ATT -0.074 allowed and STF% 23.5% [Source: FTN team tables, packet].

**IND passing game.** IND's passing-analytics EPA/DB is -0.205 and INTW% is 4.5%. Its pass-protection table shows a large pressure effect: EPA/DB -1.060 under pressure against 0.112 clean (EPA/DB__2). PIT's pass rush has SK% 7.7% and BLZ% 28.5%.

**PIT secondary.** On the ESPN injury report, Jamel Dean is Out, DeShon Elliott is on IR and Jalen Ramsey is Questionable. The capped secondary-context severity for IND's offense is 8.1. IND has few receivers to exploit it, though. Per the ESPN injury report, Darius Slayton and Ashton Dulin are Out, Keenan Allen is Questionable and Will Mallory is on IR. Alec Pierce appears only in the unconfirmed ESPN roster IR/Out group.

**PIT offense.** PIT's tendencies table shows DPBK% 67.2% (the share of plays that are dropbacks). Its passing-analytics EPA/DB is -0.147 with aDOT 9.2, and its tempo table shows a 3&O rate of 27.7%.

**IND pass defense.** IND allows passing-analytics EPA/DB of 0.109 with DVOA 12.1%, and its pass-rush SK% is 5.9%. Arden Key is on IR per the ESPN injury report, Micheal Clemons is in the unconfirmed roster group and Charvarius Ward is Questionable.

**Pace and quarterbacks.** Pace is neutral: IND runs 63.3 plays per game and PIT 64.0. The resolved starters are Daniel Jones and Aaron Rodgers, from the ESPN depth chart. Neither is operator-confirmed, and the QB flag is ok.

**Power ratings.** These are 2026 four-game values (matches_2026 true) and they are mixed. SRS favors PIT (-0.624 vs -2.243), while net PPG favors IND (-0.5 vs -2.5). I apply no adjustment.

**Weather.** Open-Meteo forecasts 25.2 km/h sustained wind, 58 km/h gusts, 54% precipitation probability, 0 mm of precipitation and 64.4F at an outdoor venue [Source: weather-openmeteo.json, IND@PIT, 2026-10-10T17:56Z]. The forecast is about 13 hours old.

## Market

| Book (capture) | Spread | Total | Moneyline |
|---|---|---|---|
| BKR (06:21Z) | PIT -3 +103 / IND +3 -118 | 43.5 -108 / -108 | IND +127 / PIT -146 |
| BEO (06:24Z) | PIT -2.5 -117 / IND +2.5 -103 | 43.5 -110 / -110 | +133 / -153 |

The two books sit on opposite sides of the key number 3. The side_push value at -3 is 8.27%. The packet has no Action Network opener. Its splits (10-09 19:41Z, at -2.5) show IND with 65% of tickets and 61% of money, and the Over with 73% of tickets. These are context only. The SuperContest has PIT -2.5.

## Thesis and counter-thesis

Two independent tier-eligible outlets took PIT -2.5: ESPN with "Picks: Steelers -2.5 (-118), Under 44.5 (-118)" `w05-expert-verified.json#rows[390]`, and VSiN with "Best Bet: Steelers -2.5" `w05-expert-verified.json#rows[444]`. BKR -3 crosses the key number, which makes it a different bet. ESPN's Under at 44.5 is a full point off the current 43.5, so it is downgraded. Corroboration-only rows (Action Network rows[45], Sharp or Square rows[136], Even Money rows[149], Sharp Football rows[507]) also back PIT -2.5. Jeremiah/Brooks are split (rows[50] vs rows[51]), and BettingPros has Over 43.5 (rows[200]).

My hypothesis is 0.0 on the margin and -0.5 on the total, the total coming from the wind fields alone (below the weather cap of 1.0). Zero-edge baseline: cover 45.87% each way with an 8.27% push, and the total at 50/50 with 0% push. Conditional on my hypothesis, Over is 48.48% and Under is 51.52%. These are not calibrated edges.

Counter-thesis: the provisional quant pass has the home margin at +1.42, which is 1.6 points toward IND. Either depleted secondary could still give up explosive plays.

## Gaps

- Both windows end 11:00Z, before kickoff, so a fresh capture is required. The weather forecast (17:56Z Sat) is marked review_required.
- The quant pass margin (+1.42) disagrees with the market (3.0); I did not use its cover percentages.
- The source side was taken at -2.5 against BKR -3. The ESPN Under was taken at 44.5 against 43.5 now.
- The packet has no AN opener, and the splits are about 41 hours old. BKR team totals were unavailable at capture.
- The ESPN roster IR/Out group is unconfirmed for both teams. The venue comes from a static table (no relocation signal).
- Global: 432 corroboration-only rows; 11 near-miss rows; SuperContest label reversals in 6 other games; BKR/BEO conflicts in MIN@NO and CLE@NYJ.

## Pre-kickoff delta checklist

- [ ] Inactives and starters: Ramsey, Dowdle, Allen, Ward, Pierce; both QBs.
- [ ] Fresh BKR/BEO capture (-2.5 or -3; total).
- [ ] Weather recheck at 17:00Z.
- [ ] Game status and venue.
- [ ] Reprice the source picks (PIT -2.5, Under 44.5).
