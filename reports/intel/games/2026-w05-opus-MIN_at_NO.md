# MIN@NO, Week 5 single-game synthesis (model label: opus)

Written 2026-10-11T06:51Z (Sat 10-10 23:51 PT), HEAD fb2ad66. Kickoff 2026-10-11T17:00Z (Sun 10:00 PT). BKR captured 2026-10-11T06:21:29.799Z (Sat 23:21 PT); BEO captured 2026-10-11T06:24:03.238Z (Sat 23:24 PT). These early-Sunday captures' recommendation windows end 2026-10-11T11:00Z (Sun 04:00 PT), before kickoff; after that they are `stale_for_recommendation`.

**Disposition: conflicted. Tier: research_only. Side: none. Total: none.** Edge hypothesis: home margin -0.5 (toward MIN), total 0.0.

## Game script

At BKR the market expects about MIN 22.0, NO 19.5 [Source: packet market_implied_score, BKR NO +2.5 / 41.5, 2026-10-11T06:21:29Z]. Likely script: Minnesota's blitz-heavy defense sets the terms against a pass-first Saints offense while Aaron Jones shields a line without its left tackle.

## Away state: Minnesota (4-0, NFC North 1st)

Minnesota beat GB 39-22 (+17, H), CHI 9-3 (+6, A), TB 23-16 (+7, A) and MIA 15-10 (+5, H). That is a +35 differential, with records of 2-0 home, 2-0 away and 2-0 in the division [Source: packet team_state MIN, built 2026-10-11T06:35Z]. Opponents are a combined 6-11 and three wins were by seven or fewer; four games is too small a sample for a rating. Rest 6.9 days; bye Week 6, then IND, at DET, BUF. A win keeps it level with SF (4-0) atop the NFC and a game ahead of CHI (3-1) [Source: packet standings].

## Home state: New Orleans (1-3, NFC South 3rd)

New Orleans lost at DET 30-31 (-1), won at BAL 24-17 (+7), and lost to LV 27-35 (-8, H) and ATL 24-45 (-21, H). That is a -23 differential, 0-2 at home and 0-1 in the division, against opponents with a combined 10-6 record [Source: packet team_state NO]. Rest 5.7 days (a day less); bye Week 8; next at NYG, PIT, CLE. Leader CAR is 2-2: the Saints are one game back.

## Matchup mechanics

**Saints offense against Vikings defense.** Minnesota's defense allows EPA/PLY -0.184 (DVOA -22.1%) in the FTN team-defense efficiency table, and in the pass-rush table has SK% 10.4% and PRESS% 40.9% on BLZ% 72.1% [Source: FTN team-defense efficiency/pass-rush, MIN]. Dropbacks are 67.8% of New Orleans's plays (FTN tendencies, DPBK%). In the FTN pass-protection table the Saints' pressured EPA/DB is -0.346, against a clean-pocket EPA/DB__2 of 0.214 [Source: FTN team-offense tendencies/pass-protection, NO]. Shough is fine when clean, and Minnesota pressures over 40% of dropbacks.

**Vikings offense against Saints defense.** Minnesota's offense is weak: EPA/PLY -0.119 in the FTN efficiency table, and a pressured EPA/DB of -0.610 in the pass-protection table [Source: FTN team-offense, MIN]. The New Orleans defense is worse: EPA/PLY 0.134, rush DVOA 19.7% and MTKL% 17.4%. Its PRESS% of only 28.1% limits how much damage Minnesota's line injuries can do [Source: FTN team-defense, NO]. The resolved starters are Kyler Murray and Tyler Shough, from the ESPN depth chart plus injury report. No QB-ambiguous warning [Source: packet Quarterbacks, ESPN 2026-10-11T06:35:38Z].

**Availability.** ESPN injury report: MIN has OT Darrisaw and CB Demmings Out; OT O'Neill, C Jurgens, WR Jefferson, WR Addison and TE Yurosek Questionable; and G Jackson and TE Oliver on IR. NO has G J. Wright and LBs Elliss and Jennings Out, with three DTs, two safeties, LB Ford, RB Kamara and WR B. Brown Questionable [Source: ESPN injury report, 2026-10-11T06:35:38Z]. Script-changing: MIN's tackles and NO's two starting linebackers. Etienne, Bresee and Banks (NO) and Mason (MIN) are in the ESPN roster IR/Out group (unconfirmed), not confirmed Out [Source: ESPN roster IR/Out group (unconfirmed), 2026-10-11T06:35:36Z].

**Ratings and venue.** Power ratings are 2026 four-game values (matches_2026 true; attribution wording stale): SRS MIN 8.477, NO -5.097; no adjustment on them alone. Fixed dome: weather not applicable indoors [Source: packet VENUE].

## Market comparison

BKR has MIN -2.5 -103 / NO +2.5 -113, total 41.5 (O -108, U -107) and moneyline MIN -132 / NO +116. BEO has MIN -1 -125 / NO +1 +105, total 42 (O +100, U -120) and moneyline MIN -137 / NO +117 [Source: bookmaker-live-2026-10-11-week5.json 06:21:29Z; betonline-live-2026-10-11-week5.json 06:24:03Z]. The 1.5-point spread gap is a book conflict. The packet has no Action Network opener, so movement cannot be read. Stale splits (2026-10-09T19:41Z): MIN 56% of tickets, Over 76%; context only. The SuperContest favorite field gives MIN -2.5. Key number: at home line +3 the simulator's side_push is 0.0827, so BKR's +2.5 sits just under 3 [Source: margin-simulator.mjs, 2026-10-11T06:49Z].

## Thesis and counter-thesis

**Thesis.** Two inputs point the same way: the defensive gap (DVOA -22.1% vs 20.6%) and New Orleans's missing linebackers. On those I move the home margin 0.5 points toward Minnesota. Total unchanged: the teams' scoring profiles offset, and it is indoors. The provisional quant pass has a home margin of -4.50, 2.0 points more pro-Minnesota than the market; I record that gap but do not copy it.

**Counter-thesis.** Minnesota's one-score wins came against weak opponents, and its offense is poor across every FTN efficiency table. Line injuries could worsen its -0.610 pressured EPA/DB. Corroboration-only feeds (Action Network, BettingPros, Sharp or Square) back NO at +1.5 to +2.5. The only tier-eligible row is one VSiN Minnesota moneyline (rows[518]), and the book conflict blocks any price claim.

Conditional on this hypothesis (not calibrated), BKR simulator: home cover 0.4869, away 0.5131, Over/Under 0.50/0.50, pushes 0; zero-edge baseline 0.50/0.50, no pushes. BEO 1/42 baseline: 0.50/0.50 excluding pushes; side push 0.0244, total push 0.0304.

## Player-prop research candidates (usage context only, no edge)

| player | market | line/price | BKR capturedAt | 2026 usage W1-W4 |
|---|---|---|---|---|
| Aaron Jones (MIN) | carries Over | 17.5 / +101 | 2026-10-11T06:21:44.982Z | 12, 23, 17, 20 carries |
| Chris Olave (NO) | receptions Over | 6.5 / +104 | 2026-10-11T06:21:44.982Z | 10, 8, 9, 8 rec |
| Tyler Shough (NO) | completions Over | 22.5 / -114 | 2026-10-11T06:21:44.982Z | 35, 27, 29, 30 cmp |

[Source: player_stats_weekly.csv 2026]. Roster gate PASS.

## Gaps

- BOOK CONFLICT: BKR NO +2.5 vs BEO NO +1; no price-specific recommendation.
- Windows end 11:00Z, before kickoff; recapture required.
- No Action Network opener; splits dated 2026-10-09.
- Quant pass margin -4.50 vs BKR +2.5, recorded only.
- One tier-eligible row (VSiN rows[518]); rows[449] (NO +3) near-miss, crosses 3.
- Global: 432 corroboration-only rows; SuperContest labels reversed (6 games).
- Digest says Jurgens/Yurosek IR; ESPN report says Questionable (used).

## Pre-kickoff delta checklist

- [ ] Official inactives and starters (MIN tackles, Jefferson, Addison; NO DTs, Kamara)
- [ ] Fresh BKR/BEO capture; does the conflict resolve or the line reach 3?
- [ ] Weather: not applicable indoors; confirm dome venue
- [ ] Game status
- [ ] Reprice source picks at the current number
