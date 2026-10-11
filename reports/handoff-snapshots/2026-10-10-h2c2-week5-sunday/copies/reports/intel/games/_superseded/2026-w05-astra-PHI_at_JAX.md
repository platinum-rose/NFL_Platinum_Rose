# PHI@JAX — Week 5 astra synthesis

As of 2026-10-10 19:10:20 PT. Proposed analysis only; disposition **pass**, tier **research_only**; no side or total lean.

## Team state and game script

Jacksonville's efficient offense against Philadelphia's stalled possessions suggests a Jaguars lead, but the market already asks Jacksonville to win by more than a touchdown. Philadelphia is 2-2: Washington 24-22 (+2), Tennessee 24-20 (+4), Chicago 7-27 (-20), then the Rams 20-24 (-4). Those opponents are respectively 1-3, 0-4, 3-1 and 2-2, collectively 6-10. Philadelphia is 1-1 home, 1-1 away and 1-0 in division, with a -18 differential. Its two wins against weaker records do not establish an above-market rating. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, PHI results/splits, 2026-10-11T01:54:18Z]

Jacksonville is 3-1: Cleveland 34-10 (+24), Denver 13-20 (-7), New England 35-6 (+29), then Cincinnati 22-17 (+5). Opponent records are 3-1, 2-2, 2-2 and 2-2, collectively 9-7. Jacksonville is 2-0 home, 1-1 away, 0-0 in division and +51 overall. Four games are a small sample; neither that start nor Philadelphia's consecutive losses becomes a rating adjustment. Both have 6.9 days' rest and no bye used; Jacksonville's bye is Week 7, Philadelphia's Week 10. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, JAX results and team schedules, 2026-10-11T01:54:18Z]

Philadelphia trails the 3-1 Giants and sits third in the displayed NFC East, outside the conference's listed top eight. Winning reaches 3-2; losing reaches 2-3, with exact placement dependent on other results. Jacksonville leads 2-2 Indianapolis by one win and sits second in the displayed AFC order: winning reaches 4-1, losing 3-2. This interconference game changes neither division record. Next, Philadelphia hosts Carolina and Dallas before visiting Washington; Jacksonville hosts Houston, takes its bye, then hosts Indianapolis. Those approaching divisional games are context, not a quantified distraction. Conference ordering excludes official tiebreakers. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, standings/remaining schedules, 2026-10-11T01:54:18Z]

## Matchup and availability

FTN team-offense/efficiency EPA/PLY is JAX +0.173 versus PHI -0.107; opposing team-defense/efficiency values are PHI +0.045 and JAX -0.048. Jacksonville can sustain efficient possessions while Philadelphia faces resistance. PHI team-offense/rushing-analytics EPA/ATT -0.122 meets JAX team-defense/rush-analytics -0.170, discouraging a simple rushing escape. PHI pass-protection PRESS% 37.7 and SK% 8.7 meet JAX pass-rush PRESS% 29.7: passing more can expose drive-ending sacks. JAX protection PRESS% 28.7 meets PHI pressure 28.3, a less adverse pairing. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, named FTN tables, packet 2026-10-11T01:54:18Z; underlying capture absent]

FTN team-offense/tempo SEC/PLY is JAX 31.1 versus PHI 28.6, with DRV/GM 9.3 versus 10.5: Jacksonville's efficiency need not produce a fast, high-possession game. Power SRS favors JAX 14.746 over PHI -6.319, with composite ranks 2 and 25, but the four-game 2026 labels conflict with attribution saying prior-season results. Secondary severity favors Philadelphia's receiving opportunities, 6.45 versus 4.5, but includes stale evidence; I assign it no points. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, tempo/power/secondary, 2026-10-11T01:54:18Z]

The saved roster gate passes, but does not certify starters. Jalen Hurts has Week 1 starter evidence; Tanner McKee's October 4 source calls him the backup despite a likely-starter label. Jacksonville has no quarterback projection or operator confirmation. Saquon Barkley's locked role conflicts with the digest's out event. These gaps limit confidence in the script. London weather forecasts 57.9°F, zero precipitation, wind 10.4 km/h and gusts 22.7; no weather adjustment follows. [Source: data/generated/master-intel/w05-roster-vet.json, PASS, roster source 2026-10-10T02:16:47Z] [Source: data/projected-starters/2026/latest.json, PHI/JAX roles, 2026-10-10T16:45:21Z] [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, availability/London quote, 2026-10-11T01:54:18Z] [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, PHI@JAX forecast for 2026-10-11T13:00Z, captured 2026-10-10T17:56:55Z]

## Market and source disagreement

Both books imply JAX 24.75, PHI 17.25. Captures below are fresh snapshots at writing, not live offers. Action Network opened JAX -3.5 and total 43.5; movement to -7.5/42 crosses 7, not 3. The separate SuperContest reference favors JAX -7.5. Older splits show JAX spread tickets/handle 60%/57% and Under 60%/63% at 41.5; these describe positioning only. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, market/opener/SuperContest, opener spread 2026-10-05T00:14:25Z and total 00:12:25Z; splits 2026-10-09T19:41:08Z]

| Book | Captured PT (Oct 10) / UTC | Spread PHI / JAX | Over / Under 42 | ML PHI / JAX | Packet expiry PT (Oct 11) |
|---|---|---|---|---|---|
| BKR | 18:15:40 / 2026-10-11T01:15:40.538Z | +7.5 -103 / -7.5 -113 | -102 / -114 | +293 / -350 | 00:15:40 |
| BEO | 18:19:56 / 2026-10-11T01:19:56.400Z | +7.5 -105 / -7.5 -115 | -107 / -113 | +299 / -375 | 00:19:56 |

[Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, BKR/BEO captures and recommendation windows, timestamps in table]

VSiN supports Philadelphia +7.5 through Youmans and Tuley; Cohen quoted +8 (-110) and moneyline +320, versus captured +7.5 and +293/+299. Four eligible rows remain one outlet, not four independent votes. Opposing Jacksonville -4.5 and -6.5 rows are corroboration-only, downgraded for movement and different bets after crossing 7; disagreement remains unresolved. [Source: w05-expert-verified.json#rows[447], VSiN PHI +7.5, 2026-10-10T17:33:20Z] [Source: w05-expert-verified.json#rows[559], VSiN PHI +7.5, 2026-10-08T01:33:21Z] [Source: w05-expert-verified.json#rows[516], VSiN PHI +8, 2026-10-08T20:33:26Z] [Source: w05-expert-verified.json#rows[517], VSiN PHI ML, 2026-10-08T20:33:26Z] [Source: w05-expert-verified.json#rows[198], BettingPros JAX -4.5, 2026-10-06T15:30:56Z] [Source: w05-expert-verified.json#rows[371], Simon Hunter JAX -6.5, 2026-10-06T18:24:28Z]

## Hypothesis, counter-thesis and decision

My home-margin and total adjustments are both 0.0 points. Jacksonville's advantages do not supply a validated incremental margin beyond the market; Philadelphia's hook and source support lack independent confirmation. Against historical margin residual SD 12.77, inventing a precise adjustment would overstate this evidence. No cap exception applies. Simulator probabilities are conditional on this hypothesis, not calibrated edges; they match the zero-edge baseline, with totals 50/50 only after excluding pushes. [Source: scripts/intel/margin-simulator.mjs, zero-edge CLI and pinned 2018-2025 calibration, 2026-10-11T02:10:20.981940+00:00]

| Scenario | JAX cover | PHI cover | Side push | Over | Under | Total push |
|---|---|---|---|---|---|---|
| Zero-edge baseline = hypothesis 0/0 | 50.00% | 50.00% | 0% | 48.4800% | 48.4800% | 3.0400% |

The strongest counter-thesis is that Jacksonville's efficiency advantage overwhelms Philadelphia's protection and depleted running game, making the provisional 9.07-point margin directionally right. Conversely, secondary weaknesses and the hook favor a Philadelphia backdoor cover. Neither establishes a reliable price advantage. I pass, retain research_only, and withhold props until roles and prices are reconciled. Official starter confirmation plus fresh source support could reopen Philadelphia +7.5; +7 removes the hook. A fresh Jacksonville -6.5 would require a separate reassessment. [Source: data/research-intel/game-packets/2026-w05/PHI_at_JAX.json, quantitative means/FTN/availability/source disagreement, 2026-10-11T01:54:18Z]

## Gaps

- Preflight: 16 PASS, 4 WARN, 0 FAIL. Global warnings: two other games have BKR/BEO conflicts; 11 near-miss article rows are not tier-eligible; 432 rows are corroboration-only; six other games have reversed SuperContest labels. This packet has game_warnings=[] and no game-line book conflict.
- Quarterbacks: neither team has operator confirmation; JAX has no projected QB row. PHI Jalen Hurts starter evidence is Week 1 usage; Tanner McKee likely_starter_or_primary contradicts its October 4 top-backup source. No official Week 5 inactives are supplied.
- Availability and depth disagree: Saquon Barkley remains a locked starter in projected data but is out in the packet digest. Do not interpret historical usage or a role lock as active status.
- Power ratings label season 2026 and four games but attribution says prior-season results; raw FTN capture timestamps and a calibrated conversion from metrics to point adjustments are absent.
- Secondary severity 6.45 for JAX includes an unverified 2025-04-03 injury row. Omit that row as a current-status claim and apply no secondary points; other manual roles and scheme notes need reconciliation.
- Provisional quantitative means favor JAX by 9.0673 with total 42.985, versus market margin 7.5 and total 42: disagreements +1.5673 margin and +0.985 total. Unbacktested inputs and uncertain provenance do not justify copying its cover probabilities or adjustments.
- Four tier-eligible rows represent VSiN alone, including two rows from the same article. JAX -4.5/-6.5 context picks cross 7 to current -7.5 and are different bets. Source prices for PHI +7.5 are absent.
- Packet standings claim inclusion of the completed Week 5 TB@DAL game while DAL still displays 2-2; conference order is win percentage then point differential, not official tiebreakers. Subsequent opponent records are absent.
- London is identified in a source quote and weather coordinates; explicit venue/neutral-site metadata and travel timing are absent. No ordinary Jacksonville home-field or travel adjustment is added.
- Props withheld: Strange source Under 35.5 -110 (digest; corroboration only) is now BKR Under 31.5 +102 and BEO Under 33.5 -115. Weeks 1-4 targets 3/2/5/8 and yards 23/17/32/95 do not establish a stable under role. No prop probability or edge assigned.
- Roster-vet PASS has blocking=[], but generated_at is absent; roster_source=2026-10-10T02:16:47.619206+00:00 and stored roster_age_h=23.6 is not a live clock. Read under the prompt permitted saved-result option; pre-kickoff revalidation needed.
- At total 42 the zero-edge baseline is 50/50 conditional on no push; unconditional Over/Under are each 48.4800% with 3.0400% push. Prompt shorthand 50/50 does not identify this distinction.

## Pre-kickoff delta checklist

- [ ] Confirm official inactives, quarterbacks and role changes; rerun roster validation.
- [ ] Recapture both books before their packet expiry; verify spread, total, moneyline and available main-line props.
- [ ] Recheck London kickoff weather; sustained wind >=25 km/h, gusts >=40 km/h or precipitation >=1 mm triggers reassessment, not automatic points.
- [ ] Confirm game status, kickoff 2026-10-11T13:30Z (06:30 PT), and venue designation.
- [ ] Reprice every retained source pick; preserve movement across 7 and outlet independence.
- [ ] Reconcile standings timing, power provenance and stale secondary evidence before any upgrade.
