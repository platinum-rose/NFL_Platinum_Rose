# MIN@NO — Week 5 astra synthesis

Written 2026-10-10 20:05:37 PT; HEAD 4a42100.

## Game and team state

This is a conflicted, research_only assessment with no side or total recommendation. Minnesota's defense offers the clearest route to controlling possessions, but its weak offense and protection uncertainty leave room for New Orleans to keep the game close. The competing mechanisms do not justify moving either market mean. The 1.5-point book disagreement independently prevents a price-specific recommendation. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, market/ftn_team_level, built 2026-10-11T02:16:45Z]

Minnesota beat Green Bay 39-22 (+17), Chicago 9-3 (+6), Tampa Bay 23-16 (+7), and Miami 15-10 (+5), in that order. Those opponents are 2-2, 3-1, 0-4, and 0-4: combined 5-11. Minnesota is 4-0, with 2-0 home, away, and division records. Its 6.9-day rest precedes an unused Week 6 bye, then Indianapolis at home, Detroit away, and Buffalo at home. That schedule supports recovery context, not a motivational adjustment. Four games remain a small sample, not a new rating. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, teams.MIN, built 2026-10-11T02:16:45Z]

New Orleans lost at Detroit 30-31 (-1), won at Baltimore 24-17 (+7), then lost at home to Las Vegas 27-35 (-8) and Atlanta 24-45 (-21). Opponent records are 2-2, 3-1, 3-1, and 2-2, combined 10-6. Its 1-3 record includes 0-2 home, 1-1 away, and 0-1 division splits. Rest is 5.7 days; its first bye remains Week 8, after visiting the Giants and hosting Pittsburgh, with Cleveland visiting Week 9. The tougher opposition cautions against reading the records literally. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, teams.NO, built 2026-10-11T02:16:45Z]

Minnesota leads Chicago by one win and stands second in the packet's NFC order behind unbeaten San Francisco; victory preserves its unbeaten position, while defeat permits Chicago to draw level. New Orleans trails 2-2 Carolina and Atlanta; 2-3 keeps contact, whereas 1-4 deepens the deficit. Results elsewhere determine the final positions. This conference game changes overall records without changing division records; the supplied conference order uses win percentage and point differential, not official tiebreakers. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, standings/same_division_game, built 2026-10-11T02:16:45Z]

## Matchup mechanics

FTN team-defense/pass-rush gives Minnesota 40.9% PRESS% and 10.4% SK%, confronting New Orleans' team-offense/pass-protection 33.8% PRESS%. That suggests disrupted dropbacks. Minnesota's team-defense/efficiency EPA/PLY is -0.184 against New Orleans' offensive -0.008. Conversely, Minnesota's offensive EPA/PLY is -0.119 against New Orleans' permissive defensive +0.134: an opportunity, not proof of a rebound. New Orleans' 28.1% defensive pressure rate still matters against Minnesota's 9.8% offensive sack rate. FTN team-offense/tempo shows New Orleans at 24.9 SEC/PLY and 73 PLY/GM versus Minnesota's 30.3 and 60; faster home possessions oppose a simple defensive Under thesis. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, ftn_team_level, built 2026-10-11T02:16:45Z]

Resolved starters are Kyler Murray and Tyler Shough. Christian Darrisaw is Out; Brian O'Neill, Justin Jefferson, Jordan Addison, and Alvin Kamara are Questionable. Those uncertainties affect protection, receiving options, and offensive balance; older digest events do not supersede ESPN. Power ratings favor Minnesota: SRS 8.477 versus -5.097, composite ranks fifth versus 24th, from an SRS/net-points/Pythagorean ensemble. However, the attribution says prior-season results despite four-game 2026 labels, so I assign no point adjustment. Manual secondary severity 4.05 for Minnesota's matchup versus 2.55 for New Orleans' stays subordinate. Venue confirmation is absent; weather is not applicable indoors if confirmed, with no outdoor adjustment justified now. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, quarterbacks/injuries ESPN 2026-10-11T02:16:11Z; power_ratings/secondary/weather built 2026-10-11T02:16:45Z]

## Market, evidence and hypothesis

The table preserves both captured books. BKR implies Minnesota 22.0, New Orleans 19.5. Both spreads sit below key number 3; neither approaches 7. The separate SuperContest reference is Minnesota -2.5 despite reversed team labels. Action Network's opener is absent, so movement is unknown. Its older splits show Minnesota 56% tickets/52% handle and Over 76%/73%; these are stale_for_recommendation context, not independent evidence of value. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, market/supercontest_row; splits 2026-10-09T19:41:08.878Z]

Only VSiN row 518 is tier-eligible, backing Minnesota moneyline at quoted -130 versus captured -131/-140; it does not establish spread value. VSiN row 449 is a near-miss Saints +3 reference, a different key-number proposition from +2.5. They count as one outlet, and disagreement remains unresolved. Corroboration-only Action Network Minnesota -1.5 and BettingPros Under 42.5 lose one point versus BKR and are downgraded. [Source: w05-expert-verified.json#rows[518], MIN ML, 2026-10-08T20:33:26Z] [Source: w05-expert-verified.json#rows[449], near_miss, 2026-10-10T12:03:19Z] [Source: w05-expert-verified.json#rows[97], corroboration_only, 2026-10-10T17:46:01Z] [Source: w05-expert-verified.json#rows[202], corroboration_only, 2026-10-06T15:30:56Z]

I retain home-margin 0.0 and total 0.0 points. The strongest counter-thesis is that Minnesota's pressure advantage and New Orleans' permissive defense warrant a Minnesota lean; protection injuries, tougher Saints opposition, and uncertain rating provenance prevent quantifying it. Historical margin residual SD is 12.772 points. The simulator's zero-edge baseline and retained hypothesis both yield 50% home cover, away cover, Over, and Under, excluding pushes; side and total pushes are 0%. These are hypothesis-conditional probabilities, not calibrated edges. [Source: scripts/intel/margin-simulator.mjs, home-line=2.5/total=41.5/adjustments=0, 2026-10-11T03:03:40Z]

| Captured snapshot | MIN spread | NO spread | Over | Under | MIN ML | NO ML |
|---|---|---|---|---|---|---|
| BKR 2026-10-11T01:15:40.538Z (Oct 10 18:15:40 PT) | -2.5 (-103) | +2.5 (-113) | 41.5 (-103) | 41.5 (-113) | -131 | +115 |
| BEO 2026-10-11T01:19:56.400Z (Oct 10 18:19:56 PT) | -1 (-125) | +1 (+105) | 42 (+100) | 42 (-120) | -140 | +120 |

[Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, market.BKR/market.BEO, captures shown above]

Both snapshots remain inside the packet's recommendation windows at writing, but are conflicted. BKR expires Oct 11 00:15:40 PT; BEO expires 00:19:56 PT. Captures older than six hours, or three hours within six hours of kickoff, are stale_for_recommendation. Kickoff is Oct 11 10:00 PT. [Source: data/research-intel/game-packets/2026-w05/MIN_at_NO.json, expiry/kickoff, built 2026-10-11T02:16:45Z]

## Gaps

- Book conflict: NO +2.5/+1; recapture required.
- SuperContest labels reversed; use MIN favorite/-2.5.
- One near-miss row; context only.
- Global: corroboration-only/near-miss rows, other contest reversals, and narratives-only roster warning.
- Opener and venue confirmation absent; no MIN@NO outdoor entry.
- Power provenance conflicts; FTN scoring differs from schedule.
- Provisional means MIN by 4.495/42.338 disagree with BKR 2.5/41.5; unbacktested.
- Older/incomplete projected starters; ESPN takes precedence.
- Props empty: Jones rushing unavailable at BKR, absent at BEO.
- Underlying FTN/power/contest capture timestamps absent.

## Pre-kickoff delta checklist

- Check official inactives, resolved starters, and named Questionable players.
- Recapture both books; resolve the conflict and reassess at 3/7.
- Confirm venue/roof, recheck weather, and verify game status.
- Reprice source picks; review missing provenance and player roles.
