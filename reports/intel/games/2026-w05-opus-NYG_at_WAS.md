# NYG@WAS — Week 5 single-game synthesis (opus)

Written Sat 10-10 22:39 PT (05:39Z). Kickoff Sun 10:00 PT. BKR captured 18:15 PT (01:15Z, window ends 00:15 PT); BEO captured 20:15 PT (03:15Z). Neither is stale. **Disposition: pass. Tier: skip.** HEAD 7ebef66.

## Game script

The market prices Washington by 3.5 with a 41.5 total, an implied 22.5-19.0 [Source: NYG_at_WAS.md, market-implied score, built 04:23Z]. The likeliest script is a low-efficiency division game: both offenses grade poorly (NYG offense DVOA -18.8%, WAS -16.6%, FTN team-offense/efficiency) and both run games are worse (rushing DVOA -17.3% and -22.0%). Points should come through the air, where Washington's depleted secondary is the most important matchup fact on either side.

## Away state: Giants

New York is 3-1 (+3): W DAL 28-20 (+8), L at LAR 6-28 (-22), W TEN 12-7 (+5), W ARI 36-24 (+12) [Source: NYG_at_WAS.md, results table, 04:23Z]. Opponents are a combined 5-12, so the record flatters them; all three wins came at home and they are 0-1 on the road. They lead the NFC East (1-0 division) and sit fifth in the NFC order. Rest is 7.0 days, bye in Week 8; next come NO at home and HOU on the road, which gives no look-ahead hook. Four games is a small sample, not a rating.

Jameis Winston is the resolved starter (operator-confirmed 01:54Z, ESPN depth QB1) [Source: packet Quarterbacks, ESPN 04:21Z]. He has started since Week 2: 27, 22 and 29 attempts, 111/118/250 yards, sacked 2/3/4 times [Source: player_stats_weekly.csv, 2026 wks 2-4]. ESPN lists S Jason Pinnock out and DE Chauncey Golston and WR Braxton Berrios on IR.

## Home state: Commanders

Washington is 1-3 (-34): L at PHI 22-24 (-2), L at DAL 20-37 (-17), W SEA 33-31 (+2), L IND 13-30 (-17), against opponents a combined 9-8 [Source: NYG_at_WAS.md, results table]. They are 1-1 at home, 0-2 in the division and last in the East; a loss leaves them 0-3 in the division with SF away next, then a Week 7 bye. Rest is 7.1 days.

Jayden Daniels (elbow) returns as the resolved starter; Mariota (out) and Kaliakmanis started Weeks 3-4 [Source: ESPN injury report 04:21Z; player_stats_weekly.csv wks 3-4]. The absences are heavy: WR Stefon Diggs out, WR Terry McLaurin questionable, safeties Tyler Owens, Percy Butler and Nick Cross out, DE Charles Omenihu out, CB Trey Amos on IR. McLaurin's status is the swing item for the WAS passing game.

## Matchup mechanics

Giants pass offense against Commanders pass defense is where an edge could live. Washington's defense allows passing DVOA 19.7%, EXP% 13.2% and OPEN% 72.1% (FTN team-defense/passing-analytics), and that was with three of the four safeties now out. The Giants' passing EPA/DB is 0.028 with aDOT 9.3 [Source: FTN team-offense/passing-analytics, NYG]. The offset is protection: New York's SK% is 8.7% with QBH% 19.7%, and Washington blitzes at 47.4% (BLZ%), although its SK% is only 4.6% and Omenihu is out.

The other side is murkier. Washington's run offense (DVOA -22.0%) meets a Giants run defense at DVOA -9.0%, so expect Daniels to carry the offense. New York's defense allows CPOE 7.19% with only three sacks (SK% 2.1%), but has six interceptions. Washington plays faster (65.3 plays/game, 27.7 sec/play vs 61.0 and 30.3) [Source: FTN team-offense/tempo].

Power ratings favor New York (SRS -4.1 vs -11.4; net PPG +0.75 vs -8.5), and `matches_2026` is true, so these are four-game values. The prompt allows no point adjustment from them alone. Secondary-matchup severity is near even (5.55 vs 5.25) and capped.

Weather: outdoor; 68°F, precipitation probability 72% but 0.0 mm forecast precipitation, wind 12.8 km/h with gusts to 26.3 km/h [Source: weather-openmeteo.json, NYG@WAS, captured 2026-10-10T17:56Z]. That is not enough for a total adjustment.

## Market comparison

BKR: WAS -3.5 -108 / NYG +3.5 -108, total 41.5 (o-103/u-113), ML -182/+159. BEO: identical numbers at slightly different prices, so there is no book conflict. The Action Network row on 10-09 19:41Z showed WAS -4.5, which means the line has moved a point toward New York and now sits half a point off 3. The public splits are lopsided (NYG 74% of tickets and 75% of money; Over 77%/70%) but count only as context. The SuperContest line is WAS -3.5.

## Thesis and counter-thesis

My hypothesis is home margin -1.0 (one point toward NYG) and total 0.0. The basis is Washington's missing safeties and receivers combined with FTN pass-defense and pass-protection numbers that partly cancel. The simulator gives NYG +3.5 a 52.66% cover chance (zero-edge baseline 50/50, push 0%) and the total stays 50/50 [Source: margin-simulator.mjs]. Those figures are conditional on my hypothesis, not a calibrated edge. Below the 2-point threshold that is a pass.

The evidence does not break the tie. The only tier-eligible rows are both from VSiN and point in opposite directions, so they count as one conflicted outlet: w05-expert-verified.json#rows[452] (Reynolds, WAS -3.5) and #rows[564] (Tuley, NYG +3.5). The 25 other rows are corroboration-only and split as well.

The counter-thesis is Daniels himself. The four-game WAS numbers were built largely without him, so the market's -3.5 may already reflect a healthy QB1 that those numbers understate. Against that, New York's 3-1 came against a combined 5-12 schedule.

Invalidators: McLaurin ruled inactive, or Daniels limited; a move to WAS -3 or -4.5; precipitation or wind gusts rising materially at recheck.

## Gaps

- Prop context only: Isaiah Likely over 42.5 receiving yards, -108 at BKR (01:16Z). His targets were 8/10/5/12 in Weeks 1-4. The Sharp Football row #rows[415] quoted o40.5 -125: a different number, and corroboration-only.
- The quantitative pass has home margin +0.76 (cover 43.4%), about 2.7 points toward NYG relative to the market. It is provisional and was not copied.
- The Action Network opener field is malformed ("Jayden Daniels").
- The digest lists Brian Burns, Roy Robertson-Harris, Jer'Zhan Newton and Jaxson Dart on IR, but ESPN's non-active list omits them. Unresolved.
- McLaurin is questionable; weather review is required (72% precipitation probability).
- Global: corroboration-only rows, SuperContest label reversals for other games, BKR expiry 00:15 PT.

## Delta checklist

- Official inactives and starters (McLaurin, Daniels)
- Fresh BKR/BEO capture
- Weather recheck
- Game status
- Reprice source picks
