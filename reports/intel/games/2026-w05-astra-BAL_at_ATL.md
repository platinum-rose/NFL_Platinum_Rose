# BAL@ATL — Week 5 astra research
Packet reference: data/research-intel/game-packets/2026-w05/BAL_at_ATL.json.
## Decision and timing
As of October 10, 2026 21:16:30 PT, this is a pass, research_only, with no side or total lean. Both captures remain inside the packet's recommendation windows, but freshness alone does not establish value. BKR expires October 11 at 00:15:40 PT; BEO expires at 02:15:09 PT. These are snapshots, not verified executable offers. [Source: BAL_at_ATL.json, market, 2026-10-11T03:17Z]

| Book / capture PT, October 10 | Spread | Total | Moneyline |
|---|---|---|---|
| BKR 18:15:40 | BAL +3 (+102); ATL -3 (-117) | O44 +103; U44 -120 | BAL +139; ATL -160 |
| BEO 20:15:09 | BAL +3.5 (-120); ATL -3.5 (+100) | O43.5 -115; U43.5 -105 | BAL +149; ATL -170 |

[Source: BAL_at_ATL.json, BKR/BEO, 2026-10-11T01:15:40.538Z/03:15:09.478Z]

## Schedule and stakes
Baltimore's ordered results are at Indianapolis 41–23 (+18), home New Orleans 17–24 (-7), at Dallas 34–31 (+3), and home Tennessee 24–18 (+6). Those opponents are respectively 2–2, 1–3, 2–2 and 0–4, combined 5–11. Baltimore is 3–1, with home/away/division splits of 1–1/2–0/0–0, 7.3 days' rest and an unused Week 13 bye. Atlanta lost at Pittsburgh 13–20 (-7), lost home Carolina 3–34 (-31), then won at Green Bay 35–14 (+21) and New Orleans 45–24 (+21). Opponents are 2–2/2–2/2–2/1–3, combined 7–9. Atlanta is 2–2, splits 0–1/2–1/1–1, with 6.0 days' rest and its unused bye in Week 11. Four games are a small sample, not a hot-start rating. [Source: BAL_at_ATL.json, teams/results, 2026-10-11T03:17Z]

Baltimore shares the AFC North's best record with Cleveland; Atlanta shares the NFC South's best record with Carolina. A win takes Baltimore to 4–1 or Atlanta to 3–2; a loss leaves either at 3–2 or 2–3 respectively. This interconference game changes neither division record. Packet conference positions are fifth/eighth, using win percentage and point differential, not official tiebreakers; other results determine subsequent order. Baltimore next visits Cleveland, hosts Cincinnati and visits Buffalo. Atlanta hosts Chicago and San Francisco before visiting Tampa Bay. Baltimore's upcoming division pair and Atlanta's extended home stretch are context, without a look-ahead adjustment. [Source: BAL_at_ATL.json, standings/schedule, 2026-10-11T03:17Z]

## Matchup and competing scripts
The working script is sustained rushing and constrained Baltimore passing. FTN team-offense/efficiency gives Baltimore 0.165 EPA/PLY, but that aggregate cannot simply transfer to replacement quarterback Tyler Huntley. He is the operator-confirmed starter, stated rather than independently verified; Lamar Jackson is Out. Atlanta's resolved starter is Michael Penix Jr. Baltimore also loses center Cam Jurgens and defender Trey Hendrickson, weakening protection and pressure respectively; questionable Zay Flowers and Marlon Humphrey affect receiving and coverage. Atlanta loses Za'Darius Smith, while questionable Jake Matthews, Divine Deablo and Samson Ebukam could weaken protection or defensive support. Both teams' injuries matter. [Source: BAL_at_ATL.json, FTN/quarterbacks/ESPN, 2026-10-11T02:16:11Z]

FTN team-defense/rush-analytics gives Atlanta -0.291 EPA/ATT and 30.4% SUCC% allowed, a substantial obstacle to Baltimore's 48.5% rushing tendency. Atlanta's team-offense/rushing-analytics is +0.122 EPA/ATT against Baltimore's -0.027 allowed. Protection complicates that advantage: Baltimore allowed 28.5% PRESS% against Atlanta's 34.4% generated; Atlanta allowed 20.4% against Baltimore's 30.8%. These are descriptive rates, not combined projections. Team-offense/tempo shows 59.8/57.0 plays per game and 29.9/30.4 SEC/PLY for Baltimore/Atlanta, suggesting limited volume. The counter-thesis is efficient Atlanta rushing plus weakened Baltimore coverage, or Atlanta's depleted front allowing Baltimore to sustain drives. [Source: BAL_at_ATL.json, FTN named tables, 2026-10-11T03:17Z]

Power ratings are 2026 four-game values: Baltimore/Atlanta net PPG +5/+1, SRS -0.709/+0.381 and composite ranks 11/13. The label check matches 2026 despite stale prior-season attribution; these mixed comparisons earn no adjustment. Secondary severity 4.05/4.35 is capped context, not an independent driver. Atlanta's retractable roof is unconfirmed, and no BAL@ATL outdoor forecast entry exists. Weather gets zero adjustment; if closed, weather is “not applicable indoors.” The static table cannot establish relocation status. [Source: BAL_at_ATL.json, power/secondary/venue, 2026-10-11T03:17Z] [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, missing game entry, 2026-10-10T17:56:55.559Z]

## Market and evidence
BKR implies Atlanta 23.5–Baltimore 20.5. Three matters immediately: Baltimore +3.5 protects a three-point loss whereas +3 pushes; seven has not been crossed. SuperContest Atlanta -3.5 is only a contest reference. Action Network's opener is null, so movement cannot be established. Its October 9 snapshot shows Atlanta 47% tickets/59% handle and Over 72%/73%, context only. [Source: BAL_at_ATL.json, implied-score/opener/splits/contest, 2026-10-09T19:41:08.878Z]

VSiN's three Baltimore +3.5 selections represent one outlet, not three independent confirmations; BKR +3 loses their key-number protection. Cohen's “Falcons +3 (-118) vs.” differs six points from BKR Atlanta -3 and is a different bet, not support for laying points. Disagreement remains unresolved. [Source: w05-expert-verified.json#rows[448]; w05-expert-verified.json#rows[451]; w05-expert-verified.json#rows[568]; w05-expert-verified.json#rows[525], picks, 2026-10-07–10]

BettingPros Over 43.5 and Under 46.5 are corroboration-only; the latter is downgraded 2.5 points against 44. They are not averaged into consensus. [Source: w05-expert-verified.json#rows[75]; w05-expert-verified.json#rows[191], totals, 2026-10-06–10]

## Hypothesis and invalidators
Home-margin and total adjustments remain 0.0/0.0 points. Historical margin residual SD is 12.77; neither injuries already known to the market nor small-sample metrics establish an incremental edge. Hypothesis-conditional probabilities therefore equal the zero-edge baseline: Atlanta/Baltimore cover 45.865% each, side push 8.270%; Over/Under 48.480% each, total push 3.039%. Excluding pushes, each pair is 50/50. These are conditional probabilities, not calibrated betting edges. [Source: scripts/intel/margin-simulator.mjs, zero-edge CLI, 2026-10-11T04:16:30.335408Z]

Reconsider only after resolving source pricing, starters and roof status with fresh markets. Baltimore +3.5 versus +3 materially changes the thesis; losing Matthews or Flowers changes the script. Props are omitted because captured main-line pricing and week-specific usage were not validated. [Source: BAL_at_ATL.json, research invalidators, 2026-10-11T03:17Z]

## Gaps
- Carry both availability warnings: BAL IR Ja'Kobi Lane/Durham Smythe; ATL IR Yasir Abdullah add depth losses.
- Roof/venue unconfirmed; outdoor BAL@ATL entry absent.
- Global warnings: other-game book conflicts, 11 near-misses, 432 corroboration-only rows, six SuperContest reversals.
- Provisional model margin 2.428/total 44.745 disagrees with market 3/44; unbacktested, percentages unused.
- ATL FTN scoring 21/20 differs from results 24/23 PPG; cause absent.
- Opener absent; +3 source sign unresolved; standings claim a final but show four-game records.
- BEO roster warning spells Huntley “Huntely”; no prop promoted.

[Source: BAL_at_ATL.json; w05-roster-vet.json; week5-preflight.py, gaps, 2026-10-11T04:12Z]

## Pre-kickoff delta checklist
- Confirm official inactives and starters, including questionable players and IR depth.
- Refresh both books; honor packet expiry and reprice every source pick.
- Confirm game status, venue and roof; recheck weather if open.
- Resolve source sign and scoring discrepancies before reconsidering disposition.
