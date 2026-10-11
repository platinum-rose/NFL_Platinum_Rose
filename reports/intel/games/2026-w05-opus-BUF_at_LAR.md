# Week 5 single-game synthesis: BUF@LAR (opus)

Run at 2026-10-11 06:49Z = Sat 10-10 23:49 PT (device clock), HEAD fb2ad66. Kickoff Mon 10-12 17:15 PT (2026-10-13T00:15Z). PKT = `data/research-intel/game-packets/2026-w05/BUF_at_LAR.md`. BKR captured Sat 23:21 PT (06:21Z), BEO Sat 23:24 PT (06:24Z); both are fresh now, but their recommendation windows end Sun 05:21 PT and 05:24 PT, about 36 hours before kickoff, so any price here will be stale long before the game. **Disposition: pass, tier skip, edge 0.0 / 0.0.**

## Game script

The market prices this as Rams 29.0, Bills 25.5 (LAR -3.5, total 54.5) [Source: PKT, market-implied score, BKR 2026-10-11T06:21Z]. I agree: a shootout where Buffalo has the best offense on the field, LA the better defense, and the hook past 3 decides the spread.

## Away state: Buffalo (3-1, AFC East leader)

Buffalo beat HOU 36-31 (away), DET 41-31 and LAC 24-16, then lost 26-29 at home to NE. That is +20 total, 31.8 points scored and 26.8 allowed per game. The four opponents are a combined 4-12, the softest schedule in this matchup, and four games is a small sample [Source: PKT, team state, built 2026-10-11T06:35Z]. Buffalo is 0-1 in the division and fourth in the AFC order on point differential. Rest is 8.3 days and the Week 7 bye is still ahead. Next come @LV (3-1) and BAL at home. A loss costs little in the division (NE 2-2). No look-ahead adjustment.

## Home state: Los Angeles (2-2, third in the NFC West)

The Rams lost 7-27 to SF, beat NYG 28-6, lost 26-30 at DEN and won 24-20 at PHI: +2, against opponents a combined 11-5 [Source: PKT, team state]. They are 0-1 in the division and two games behind 4-0 SF, eighth in the NFC order, so this is the more urgent game for them. Rest is 8.3 days, the bye comes in Week 11, and ARI (1-3) is next at home.

## Matchup mechanics

FTN `team-offense/efficiency` has Buffalo at EPA/PLY 0.162 and DVOA 29.8%, against the Rams' 0.003 and 13.9%. On defense the order flips: LAR `team-defense/efficiency` is EPA/PLY -0.122, DVOA -18.7%, while BUF is 0.105 and 9.5% [Source: PKT, FTN team-level tables, GP 4]. Buffalo's pass defense is the worst unit in the game (`team-defense/passing-analytics` EPA/DB 0.191, EXP% 18.1%). That suits a Rams offense that drops back on 63.8% of plays (`tendencies` DPBK%) and runs 69.0 plays a game (`tempo` PLY/GM, against BUF's 60.0). LA's weakness: 7 offensive turnovers, 6 INTs.

Protection decides the passing game. Buffalo's `pass-protection` EPA/DB is -0.208 under pressure and 0.455 from a clean pocket (EPA/DB__2), with PRESS% 28.3%. The Rams' pass rush has PRESS% 30.2%, but Myles Garrett DE is on IR per the ESPN injury report, which should leave Josh Allen more clean pockets. Going the other way, Ed Oliver DT is Out (ESPN injury report), which weakens a Buffalo rush with PRESS% 34.7% and 10 sacks [Source: ESPN injury report via PKT, fetched 2026-10-11T06:35Z]. Also on that report: Joshua Palmer WR Out; Dee Alford CB, Te'Cory Couch CB, Landon Jackson DE, DJ Moore WR Questionable. Dorian Strong and Jordan Hancock (CB) and Zane Durant (DT) sit in the ESPN roster IR/Out group (unconfirmed), not Out. For the Rams, Quentin Lake S is Questionable and Terrance Ferguson TE is on IR. The availability digest lists a Khalil Shakir "setback" that the ESPN injury report does not carry, so it is unresolved [Source: availability digest via PKT]. Starters are resolved as Josh Allen and Matthew Stafford [Source: PKT, ESPN depth chart, 2026-10-11T06:35Z].

The absences offset on side and lean toward points. The power ratings disagree too. SRS favors LAR (2.861 vs 0.787) and net PPG favors BUF (+5.0 vs +0.5). The label check (`matches_2026` true) confirms these are four-game 2026 values, and they justify no adjustment.

Venue: the static table lists the stadium as covered but open-sided, and BUF@LAR is not in the Open-Meteo outdoor list [Source: `2026-10-10-week5-weather-openmeteo.json`, outdoor_games, 2026-10-10T17:56Z]. No weather adjustment. Confirm before kickoff.

## Market

BKR: BUF +3.5 -108 / LAR -3.5 -106, O/U 54.5 -108/-108, ML +157/-179. BEO: +3.5 -115 / -3.5 -105, 54.5 -110/-110, ML +153/-175. The books agree, with no BKR/BEO conflict. The Action Network opener is missing from the packet. Action splits (10-09 19:41Z) show -3.5 then as well, with 73% of tickets and 61% of money on BUF and 69% of money on the Over (context only). The SuperContest line is LAR -3. At the zero-edge baseline, a line of -3 has `side_push` 0.0827 [Source: margin-simulator.mjs, --home-line -3, run 06:49Z]. The half-point at -3.5 therefore removes the most valuable landing spot, and both sources that took a side did so at 3.

## Thesis and counter-thesis

The evidence does not move the line. The only tier-eligible rows are both VSiN, which counts as one outlet. `rows[446]` "Best Bet: Rams -3 (-120)" crosses 3 against the current -3.5, so it is a different bet. `rows[570]` is a teaser leg at Over 48.5, six points from 54.5, also a different bet. The near-miss `rows[514]` (VSiN, "Buffalo +3", context only) also crosses 3 and takes the other side from rows[446]. The source disagreement stays unresolved. The quantitative pass (home margin 3.0, total 55.4) sits 0.5 and 0.9 points from the market and is unbacktested. Edge hypothesis: 0.0 on margin and 0.0 on total. Simulator conditional on that: home cover 0.50, away cover 0.50, over 0.50, under 0.50, pushes 0 at -3.5/54.5. These are not calibrated edges.

Counter-thesis: Buffalo's large efficiency lead, together with Garrett's absence, could be worth more than the market's home-field gap, which would make +3.5 the right side. No two independent inputs agree on direction.

## Gaps

- No Action Network opener in the packet, so the movement can't be measured.
- Two tier-eligible rows, but both from one outlet (VSiN), and both cross key numbers or are teaser legs.
- Unbacktested quantitative-pass disagreement (margin 3.0 vs 3.5, total 55.4 vs 54.5) is recorded and not used.
- The weather/venue row reads `venue_condition_verification_required`. The roof has no live status.
- Shakir setback appears in the digest only. BKR team totals (BUF 24.5, LAR 29.5) were captured as unavailable.
- Global: 432 corroboration-only rows; SuperContest label reversals in 6 other games (not this one).
- Recommendation windows lapse Sun 05:21/05:24 PT, about 36 hours before kickoff.

## Pre-kickoff delta checklist

1. Official inactives: Oliver, Moore, Alford, Couch, L. Jackson, Lake, plus the unconfirmed roster-group CBs.
2. Fresh BKR/BEO capture; check whether the line moves to -3 or to -4 and beyond.
3. Venue/roof and weather recheck.
4. Game status (MNF, not postponed).
5. Reprice rows[446]/[514]/[570] against the new line.
