# Week 5 single-game synthesis: CIN@MIA (opus, HEAD fb2ad66)

Written Sat 10-10 23:49 PT (06:49Z, device clock). Kickoff Sun 10-11 10:00 PT (17:00Z). BKR captured 06:21Z (23:21 PT Sat); BEO captured 06:24Z (23:24 PT Sat). Both recommendation windows end 11:00Z = 04:00 PT Sunday, six hours before kickoff, so any price claim here lapses overnight and must be re-captured. Disposition: **pass / skip**. This is research only, not a wager.

## Game script

The market prices Cincinnati as a 7-point road favorite, total 43.5, implied score CIN 25.25, MIA 18.25 [Source: game-packets/2026-w05/CIN_at_MIA.md, market-implied score, 2026-10-11T06:21Z]. The expected script is Cincinnati leading, Miami forced into dropbacks behind a protection unit that has collapsed under pressure. The deciding unknown is whether Ja'Marr Chase and Tee Higgins play: both are Questionable on the ESPN injury report [Source: ESPN injury report, CIN WR Questionable, 2026-10-11T06:35Z], and the BKR capture posts no receiving props for either player or any Burrow passing line, while it does list Chase Brown and Miami's skill players [Source: bookmaker-live-2026-10-11-week5.json, CIN@MIA prop rows, capturedAt 2026-10-11T06:22:02Z].

## Away state: Cincinnati

CIN is 2-2: W 33-27 vs TB (+6), W 20-6 at HOU (+14), L 27-30 at PIT (-3), L 17-22 vs JAX (-5) [Source: packet, CIN results, built 06:35Z]. Opponents are a combined 6-11; home 1-1, away 1-1, division 0-1. Rest is 7.0 days, with the bye in Week 6, and the next game is at BAL in Week 7. CIN sits third in the AFC North behind BAL and CLE (both 3-1) and seventh in the packet's AFC order (win% and point differential only, no official tiebreakers). Four games is a small sample; the +12 differential is not a rating.

## Home state: Miami

MIA is 0-4: L 13-27 at LV (-14), L 13-35 at SF (-22), L 10-24 vs KC (-14), L 10-15 at MIN (-5) [Source: packet, MIA results, built 06:35Z]. The schedule has been brutal: opponents are a combined 15-1, and three of four games were on the road. Rest is 6.9 days, the bye is also Week 6, and the next game is at NYJ. Miami is last in the AFC East at -55 and has not played a division game.

## Matchup mechanics

Power ratings: CIN SRS 4.317, MIA -3.623; the label check shows both equal the 2026 four-game point differential (matches_2026 true), so they are four-game values and the attribution text is stale [Source: packet, power ratings label check, 06:35Z]. The SRS gap of about 7.9 points is consistent with the line, and I apply no adjustment from it alone.

The clearest mismatch is pressure: CIN's FTN team-defense pass-rush table shows PRESS% 29.3% and SK% 8.5%. Miami's FTN team-offense pass-protection table shows PRESS% 33.1%, SK% 8.7%, and under-pressure EPA/DB -0.661 (SUCC% 16.7%), against a clean-pocket EPA/DB__2 of 0.157 [Source: FTN team-offense pass-protection and team-defense pass-rush, MIA/CIN, packet 06:35Z]. If Cincinnati gets home, Miami's offense stalls. The reverse matters too: Burrow's offense under pressure posts EPA/DB -0.389, while Miami's rush generates only PRESS% 19.4% with 4 sacks. Miami's front is also thin: Kenneth Grant DT (IR, availability digest only) and Robert Beal Jr. DE (Out, ESPN injury report).

Miami's pass defense is the soft spot: FTN team-defense passing-analytics EPA/DB 0.308, OPEN% 72.6%, CPOE allowed 4.39%. That favors Cincinnati only if its receivers play. Miami's secondary is also thin: Storm Duck CB and Reese Taylor CB are Out (ESPN injury report). Cincinnati's own secondary lost Kyle Dugger S (Out) and Jalen Davis CB (IR), and Bryan Cook S is Questionable. The ESPN roster IR/Out group lists De'Von Achane, Darrell Baker Jr., Ja'Sir Taylor, Andrei Iosivas and others. It is unconfirmed; I treat it as unresolved.

Pace lowers the ceiling. Miami runs 52.5 plays per game at 30.0 sec/play with a 24.3% three-and-out rate, while Cincinnati runs 62.3 plays at 28.3 sec/play [Source: FTN team-offense tempo, packet 06:35Z]. Quarterbacks: Joe Burrow and Malik Willis are the resolved starters from the ESPN depth chart, with no ambiguity flag [Source: packet Quarterbacks, ESPN 06:35Z]. Weather: the stadium is outdoor; the forecast is 89.6 F, 2% precipitation, wind 15.7 km/h, gusts 20.5 km/h [Source: 2026-10-10-week5-weather-openmeteo.json, CIN@MIA, 2026-10-10T17:56Z]. That is heat context only and no total adjustment.

## Market

BKR has MIA +7 -113 / CIN -7 -103, total 43.5 (O -113 / U -103), ML CIN -337 / MIA +283. BEO has MIA +7 -108 / CIN -7 -112, total 44, ML -340/+274. No book conflict. Action Network showed 6.5 on 2026-10-09T19:41Z, with 75% of tickets and 87% of money on CIN (context only), so the line has moved onto 7. The simulator's side_push at 7 is 0.0555, which is the key-number value. The SuperContest line has CIN as a 7-point favorite; its home/away labels are reversed.

## Evidence

The only tier-eligible rows are both VSiN: Tuley's "Best Bet: Dolphins +7" (rows[562]) and Cohen's Bengals ML parlay leg (rows[521]), a different market leaning the other way. Makinen's Miami +7 (rows[509]) is near-miss context from the same outlet. One outlet, split internally, is not tier-2 support.

## Thesis and counter-thesis

Edge hypothesis is 0.0 margin and 0.0 total. At the zero-edge baseline the simulator gives home cover 0.4722, away cover 0.4722, side push 0.0555 (50/50 excluding pushes), over/under 0.50/0.50, total push 0. These numbers are conditional on the hypothesis, not calibrated edges. The pressure mismatch argues for CIN; the schedule-adjusted SRS gap, the quantitative pass's -6.61 mean margin, and VSiN's Miami +7 lean toward MIA. The two directions cancel, and the line sits on 7. The strongest case against passing is that Chase or Higgins sits, which would make +7 meaningfully better for Miami.

## Gaps

- Chase/Higgins status unresolved; no BKR CIN WR or Burrow props captured.
- Quantitative pass (unbacktested) home margin -6.61 vs market -7.0 (+0.39 toward MIA); cover %s not copied.
- Recommendation windows end 04:00 PT, before kickoff; captures are late Saturday PT.
- ESPN roster IR/Out group (Achane, Iosivas, Ja'Sir Taylor, etc.) unconfirmed.
- Only one tier-eligible outlet (VSiN), split across markets; Makinen row is near-miss.
- Global: 432 corroboration-only rows; SuperContest labels reversed on 6 games.
- Venue from the static roof table; neutral-site/relocation is not detectable.

## Pre-kickoff delta checklist

- Official inactives (Chase, Higgins, Cook; roster-group names).
- Fresh BKR/BEO capture after 04:00 PT; recheck 7 vs 6.5/7.5 and the juice on MIA +7.
- Weather recheck (heat; any storms).
- Game status (ESPN) and kickoff unchanged.
- Reprice VSiN MIA +7 if the line leaves 7 (crossing 7 = different bet).
