# CIN@MIA: Week 5 single-game synthesis (opus)

Written 2026-10-11T05:34:02Z (22:34 PT Sat 2026-10-10). Head 7ebef66. BKR captured 2026-10-11T01:15:40Z (18:15 PT Sat), recommendation window to 07:15Z; BEO captured 03:15:09Z (20:15 PT). Both are inside their windows; no book conflict.

## Game script

The market expects Cincinnati to control this game: BKR CIN -7, total 43.5 implies about CIN 25.25, MIA 18.25 [Source: packet market_implied_score, BKR 01:15Z]. The likely script is Joe Burrow throwing against a soft Miami pass defense while Malik Willis tries to survive a Bengals rush that gets home. Miami's path to staying inside a touchdown is a slow, run-and-scramble game that shortens the clock.

## Away state: Cincinnati

The Bengals are 2-2, +12: beat TB 33-27 (+6), won at HOU 20-6 (+14), lost at PIT 27-30 (-3), lost at home to JAX 17-22 (-5) [Source: packet team state, built 04:23Z]. Opponents are a combined 6-11, so the record came against a soft schedule. They are 0-1 in the division, third in the AFC North and seventh in the packet's AFC order, with seven days' rest; the Week 6 bye follows, then at BAL. A loss sends them into the bye at 2-3 (context only).

## Home state: Miami

The Dolphins are 0-4, -55: lost at LV 13-27, at SF 13-35, home to KC 10-24 and at MIN 10-15 [Source: packet team state]. Those opponents are a combined 15-1, a figure that includes their four wins over Miami, so the schedule has been brutal. Miami is last in the AFC East, 0-0 in the division, on 6.9 days' rest, with the Week 6 bye before NYJ, NE and DET. Four games is a small sample.

## Matchup mechanics

SRS is CIN +4.317 vs MIA -3.623, about 7.9 points on a neutral field; net points per game are +3.0 vs -13.75. The label check confirms these are 2026 four-game values despite stale prior-season wording [Source: packet power ratings, matches_2026 true]. SRS ranks Miami 21st while net PPG ranks it 32nd: schedule explains much of the ugliness.

Cincinnati's pass offense (EPA/DB 0.120, DVOA 27.3%) meets a Miami pass defense allowing EPA/DB 0.308, DVOA 33.9%, with 72.6% of targets open [Source: FTN passing-analytics, offense and defense]. Miami generates little pressure (PRESS% 19.4%, SK% 3.2%), and Burrow's clean-pocket EPA/DB is 0.302 against -0.389 under pressure [Source: FTN pass-rush, pass-protection]. CBs Storm Duck and Reese Taylor are Out [Source: ESPN injury report 04:21Z]. That is the most lopsided unit matchup here, but it runs through Ja'Marr Chase and Tee Higgins, both Questionable; Higgins drew 16 targets in Week 4 [Source: nflverse player_stats_weekly, 2026 wk1-4].

The other side runs the opposite way. Miami's offense is EPA/play -0.141, DVOA -22.2%, three-and-out 24.3%, scoring-drive rate 27.0%; Willis has been sacked 11 times (SK% 8.7%) with EPA/DB -0.661 under pressure, and Cincinnati's rush posts SK% 8.5% and PRESS% 29.3% [Source: FTN efficiency, pass-protection, pass-rush]. Cincinnati is without S Kyle Dugger (Out) and CB Jalen Davis (IR), with S Bryan Cook Questionable; Miami's aDOT 10.0 and 17.2% explosive-pass rate are its backdoor route [Source: ESPN injury report; FTN passing-analytics]. Miami's front is thin too: DT Kenneth Grant on IR, DE Robert Beal Jr. Out [Source: packet availability digest].

Miami runs 52.5 plays a game at 30.0 seconds per play, against Cincinnati's 62.3 [Source: FTN tempo]. Fewer possessions cap scoring. Hard Rock Stadium is outdoor: forecast 89.6 F, 2% precipitation, wind 15.7 km/h gusting 20.5 [Source: Open-Meteo, 2026-10-10T17:56Z]. Heat is context only.

## Market

BKR: CIN -7 -103 / MIA +7 -113, total 43.5 (Over -113, Under -103), moneyline -332/+279. BEO: -7 at -110 both ways, total 44, -340/+274 [Source: packet market]. The juice shades toward Miami +7 and the Over. Action Network showed 6.5 on Oct 9 with 75% of tickets and 87% of money on Cincinnati, 71%/79% on the Over; context only, and no opener was captured [Source: Action Network splits, 2026-10-09T19:41Z]. The line sits on 7, where the simulator puts a 5.55% push. The SuperContest line is CIN -7 (labels reversed; favorite field used).

## Evidence

Two tier-eligible rows exist, both VSiN, so one outlet: Dave Tuley's best bet Dolphins +7 (rows[562]) and Zachary Cohen's Bengals ML parlay leg (rows[521]), compatible with a Cincinnati win by under seven. Steve Makinen's Miami +7 (rows[509], VSiN) is a near miss. Corroboration only: Action Network and Sharp or Square on Miami +6.5, Steve Fezzik on +7.5, and BettingPros, Andrew Erickson and Ryan Wormeli on Cincinnati -7.5; each crosses 7, so each is a different bet.

## Thesis and counter-thesis

I move the home margin +0.5 toward Miami: the schedule-adjusted SRS gap and Miami's tempo both argue for a closer game than seven, and the packet's provisional blend sits at -6.61. That is not enough. At +0.5 the simulator gives Miami 48.6%, Cincinnati 45.8%, push 5.6% (51.5% excluding pushes), conditional on my hypothesis and not calibrated, against a -113 price. The zero-edge baseline is 47.2/47.2 with a 5.55% push; the total is 50/50 with no push. Total edge 0.0: tempo argues Under, Miami's pass defense argues Over, and I do not net them. Disposition pass, research only.

Counter-thesis: if Chase and Higgins both play, Burrow faces a secondary missing two corners with time to throw, and a double-digit win is ordinary. One outlet at a juiced number cannot outweigh that.

Prop (usage context only): Greg Dulcich over 25.5 receiving yards, BKR -112 at 01:15Z; VSiN rows[383] quoted 26.5 at -125. He had 18, 17 and 55 yards in Weeks 1-3, no Week 4 row, and TE Justin Joly is Out.

## Gaps

- Only one tier-eligible outlet (VSiN, two rows).
- Chase and Higgins Questionable; the BKR capture has no Burrow, Chase or Higgins prop rows.
- De'Von Achane: ESPN roster groups him injuredReserveOrOut, but he is absent from the packet's injury list; no Week 4 stat row.
- Quant pass home margin -6.61 vs BKR -7 (menu Miami 51.4%, Over 52.0%); recorded, not copied.
- Game warnings: AVAILABILITY CIN and MIA; SuperContest labels reversed; one near-miss row.
- Global: corroboration-only rows; label reversals and book conflicts elsewhere.
- No Action Network opener; no forward projections (FPI/DVOA pending).
- Venue from a static table; no source suggests relocation.
- Weather capture is over 11 hours old.
- Preflight WARN: BKR window ends 00:15 PT (07:15Z).

## Pre-kickoff delta checklist

- Official inactives: Chase, Higgins, Cook, Wright, Woodard, Bozeman.
- Fresh BKR/BEO capture; reprice if 7 moves.
- Weather recheck (heat, storms); game status.
- Reprice VSiN rows[562] and [521] at the live number.
