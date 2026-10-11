# BUF@LAR Week 5 single-game synthesis (opus)

Written Sat 2026-10-10 22:34 PT (2026-10-11T05:34:01Z, device clock). Kickoff Mon 2026-10-12 5:15 PM PT (2026-10-13T00:15Z). HEAD 7ebef66. **Disposition: pass. Tier: skip.** Edge hypothesis 0.0 margin / 0.0 total.

## Game script

BKR LAR -3.5 / 54.5 implies roughly LAR 29.0, BUF 25.5 [Source: BUF_at_LAR packet, market-implied score, BKR 2026-10-11T01:15Z]. The question is whether Buffalo's offense beats the best defense on the field before Stafford's volume beats Buffalo's secondary.

## Away state: Buffalo

Buffalo is 3-1 (+20): W 36-31 at HOU, W 41-31 vs DET, W 24-16 vs LAC, L 26-29 vs NE. Those opponents are a combined 4-12, including two 0-4 teams [Source: packet results table, built 2026-10-11T04:23Z]. The Bills are 2-1 at home, 1-0 away and 0-1 in the division. They lead the AFC East by a game and sit fourth in the win%-only AFC order. They have 8.3 days of rest, their bye comes in Week 7, and they play at Las Vegas next, so no look-ahead angle applies. Four games against soft opposition is a small sample, and 31.8 points per game is not a rating.

## Home state: Los Angeles

The Rams are 2-2 (+2): L 7-27 vs SF, W 28-6 vs NYG, L 26-30 at DEN, W 24-20 at PHI. Those opponents are a combined 11-5, a much harder schedule than Buffalo's [Source: packet results table]. Los Angeles is third in the NFC West, two games behind 4-0 San Francisco, and eighth in the NFC order. A loss drops them below .500, though in a non-conference game. They also have 8.3 days of rest, their bye comes in Week 11, and Arizona visits next.

## Matchup mechanics

Buffalo's offense posts 0.162 EPA/play and 29.8% DVOA, with 45.5% passing DVOA and a 21.5% explosive-pass rate. Its defense allows 0.105 EPA/play, 22.6% pass DVOA and 18.1% explosive passes [Source: FTN team-offense/team-defense efficiency and passing-analytics, packet 2026-10-11T04:23Z]. The Rams are the mirror image: their defense allows -0.122 EPA/play (-18.7% DVOA, -15.8% pass, -22.2% rush), and their offense sits near neutral at 0.003 EPA/play with seven turnovers, six of them interceptions [Source: same]. Stafford threw 55 and 51 times in Weeks 3-4, and that volume meets a weak pass defense [Source: player_stats_weekly.csv, 2026 wk3-4].

Pressure is the swing factor. Buffalo's EPA per dropback falls from 0.455 when kept clean to -0.208 under pressure, and its line allows a 28.3% pressure rate [Source: FTN pass-protection BUF]. The Rams generate pressure at 30.2%, but Myles Garrett is on IR, and those season numbers may include his snaps [Source: ESPN injuries 2026-10-11T04:21Z]. Buffalo is without DT Ed Oliver (Out). DE Landon Jackson and CBs Dee Alford and Te'Cory Couch are questionable. WR Joshua Palmer is out and DJ Moore is questionable. The Rams list only S Quentin Lake as questionable, plus TE Terrance Ferguson on IR. Both quarterbacks are ESPN-resolved starters: Josh Allen and Matthew Stafford [Source: packet Quarterbacks, ESPN 2026-10-11T04:21Z].

The ratings split. SRS favors LAR (2.861 vs 0.787) on schedule strength, while net points per game (5.0 vs 0.5) and Pythagorean win% (.600 vs .514) favor Buffalo. All are confirmed 2026 four-game values (`matches_2026` true), so none gets a point adjustment [Source: packet power-ratings label check]. The Rams run more plays per game (69.0 vs 60.0) [Source: FTN tempo]. The venue is listed as covered but open-sided, and Open-Meteo has no outdoor entry for this game, so I apply no weather adjustment. Secondary-matchup severity is similar both ways (3.34 vs 3.97) and stays capped context.

## Market comparison

BKR at 6:15 PM PT Saturday: LAR -3.5 -106 / BUF +3.5 -108, total 54.5 at -108 both ways, moneyline -178/+156. BEO at 8:15 PM PT matches at -3.5 and 54.5, with BUF +3.5 at -115 [Source: packet market, BKR 2026-10-11T01:15Z, BEO 2026-10-11T03:15Z]. Both captures are fresh, and the books agree. The half point above 3 matters: the simulator puts 15.1% of outcomes on a margin of exactly 3. The SuperContest favorite field shows LAR -3. Action Network splits put 73% of tickets and 61% of money on Buffalo +3.5, and 62%/69% on the Over. Those splits are context only, and the opener is missing [Source: Action Network splits 2026-10-09T19:41Z].

## Thesis and counter-thesis

Both tier-eligible rows are from VSiN, and neither applies at the current number. Matt Youmans' "Best Bet: Rams -3 (-120)" crosses the key number at -3.5, so it is now a different bet [Source: w05-expert-verified.json#rows[446]]. Dave Tuley's Over 48.5 was a teaser leg six points below 54.5 [Source: w05-expert-verified.json#rows[570]]. Steve Makinen's "Buffalo +3", from the same outlet, is a near-miss row and counts as context only [Source: w05-expert-verified.json#rows[514]]. The provisional quant pass, which is unbacktested, puts the home margin at +3.0 and the total at 55.4, half a point toward Buffalo and 0.9 toward the Over. I do not adopt it.

My evidence cancels. Buffalo's offensive efficiency, Garrett's absence and the Rams' interception rate argue for the underdog. The Rams' defense, their tougher schedule, SRS and Oliver's absence argue for the favorite. Edge hypothesis: 0.0 on the margin and 0.0 on the total. At zero edge the simulator returns 50.0/50.0 on the side and 50.0/50.0 on the total, with 0% push on both because both lines sit on half-points. That is conditional on the hypothesis, not a calibrated edge.

The strongest case against passing is Buffalo +3.5: the underdog has the better offense and gets the hook past 3. I still pass because the only tier-eligible side support points the other way, the 4-12 opponent record inflates Buffalo's numbers, and a 0.5-point gap from the quant pass is noise against a 12.77-point residual SD. I would reopen the game if any of these happened: Jackson, Alford or Couch ruled out; Moore inactive; the line moving to -3 or +4; or Lake ruled out.

## Gaps

- Action Network opener missing; movement unknown.
- Venue verification required; no Open-Meteo entry.
- Quant pass (+3.0, 55.4) differs from market by 0.5/0.9; not adopted.
- Preflight WARN: BKR expires within 120 min (00:15 PT Sun) for this game.
- Near-miss Makinen row context only; global corroboration-only rows and other-game SuperContest label reversals noted once.

## Pre-kickoff delta checklist

- [ ] Inactives: Jackson, Alford, Couch, Moore (BUF); Lake (LAR); Allen/Stafford start.
- [ ] Fresh BKR/BEO capture (BKR window ends 00:15 PT Sun); watch -3/+4.
- [ ] Venue/weather recheck; game status.
- [ ] Reprice VSiN rows 446/514/570.
