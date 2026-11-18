> Current quote worksheet: [revised BEO builder ladder](2026-w08-snf-island-builder-2026-11-01.md). It uses the user-supplied builder rows and refreshed upstream ticket liveness. The older straight-market prices and reservations below are historical.

# Week 8 PHI@WAS SNF - Island ladder proposals

**PROPOSED ONLY - actual SGP quotes and final inactive confirmation pending.** Prepared November 1, 2026, about 4:00 PM Pacific. No wager was placed or logged. Kickoff is 5:20 PM Pacific; ESPN still reported STATUS_SCHEDULED at 3:59 PM. Stop if game state changes or the kickoff time is reached.

## The three structures

BEO individual prices below were captured November 1 at **3:10:14 PM Pacific**. The products are the mathematically computed products of the individual prices. They assume independence and are **not accepted SGP quotes**. Every set still needs confirmation that the builder supports the exact legs.

| Tier | Template stake | Locked actual-quote target | Individual-price product |
|---|---:|---:|---:|
| T1 | $10 | +600 to +1000 | +685 |
| T2 | $5 | +1800 to +3000 | +1968 |
| T3 | $5 | +6500 to +20000 | +11120 |

Base template: **$20** for one ticket per tier. No shared leg or player across tiers. SGP correlation can change the combined price enough to put a stack outside its band; if that happens, the structure remains unready. Do not treat the product as a promised payout.

## T1: Volume with separate players

| Game | Proposed market / threshold | BEO observed price | Source tier | Rationale / limitation |
|---|---|---:|---|---|
| PHI@WAS | Tanner McKee 20+ completions | -115 | 1 - verified role/usage | 23/35 and 26/45 in his two starts; this asks for 20 completions, not a high yardage total. |
| PHI@WAS | Chig Okonkwo 4+ receptions | +110 | 1 - verified role/usage | Four and seven catches on six and seven targets in his last two games; starting TE in fresh depth chart. |
| PHI@WAS | Saquon Barkley 51+ rushing yards | +100 | 1 - verified role/usage | 62 rushing yards on seven carries in Week 7. Limited recent sample after missed games; volume is a risk. |

The most grounded of the three. Okonkwo receptions is on the expected favorite; McKee completions fits a trailing passing-volume route. Barkley is coming off a limited recent sample, and a previous hamstring/back issue still limits confidence in volume.

## T2: Two-sided scoring with Washington passing production

| Game | Proposed market / threshold | BEO observed price | Source tier | Rationale / limitation |
|---|---|---:|---|---|
| PHI@WAS | Jayden Daniels 2+ passing TDs | +120 | 1 - verified role/usage | Two passing TDs in his last game, zero the prior game; favorable price is not a probability estimate. |
| PHI@WAS | Stefon Diggs 5+ receptions | +135 | 1 - verified role/usage | Six catches on seven targets in last game, active/full practice in current injury feed. No assumed workload surge. |
| PHI@WAS | Makai Lemon anytime TD | +300 | 4 - price-driven TD | Seven catches, 67 yards and a TD on eight targets last game; expanded WR role. TD choice is price-driven, not a validated scoring edge. |

This needs Washington passing production plus a Philadelphia receiving touchdown. Daniels passing TDs and Diggs receptions share offensive risk. Lemon is a price-driven scoring leg, not a model-supported edge. Product +1968 is close to the minimum +1800, so the actual quote may fail the tier requirement.

## T3: Three receiving TDs; deliberately speculative

| Game | Proposed market / threshold | BEO observed price | Source tier | Rationale / limitation |
|---|---|---:|---|---|
| PHI@WAS | Dallas Goedert anytime TD | +230 | 4 - price-driven TD | Five catches on seven targets last game gives a role basis; price-driven TD leg, with existing receptions exposure. |
| PHI@WAS | Hollywood Brown anytime TD | +750 | 4 - price-driven TD | Five targets but only two catches and 30 yards last game. Weakest scoring leg; price-driven and requires a larger passing-TD game. |
| PHI@WAS | Antonio Williams anytime TD | +300 | 4 - price-driven TD | Three catches for 50 yards last game; team reports expanded opportunities. Price-driven TD choice. |

Lowest conviction. This requires three receiving scorers, including **two Philadelphia passing touchdowns**. McKee has thrown one TD in each of his last two starts; Hollywood had only two catches last game. That is the explicit failure case, and this slot can be left empty rather than chased.

## Existing exposure and overlap

Reservations use the canonical local ledger and the last approved mobile grading snapshot, **3:23 PM Pacific**. They are kept conservative; no new tracker refresh was authorized or performed for this proposal. Detailed ownership and ticket IDs remain in the private export local-exposure-current.json.

- Two Washington ML caps remained open in that snapshot; each was an equal two-way split. Other earlier Washington ML caps were already marked burnt by recorded losing legs. These are contingent multi-game outcomes, not banked cash or a new Washington position.
- Existing Daniels anytime TD: **SOFT overlap** with T2 passing TDs.
- Existing Goedert over 1.5 receptions / 2+ receptions on V2: **SOFT overlap** with T3 anytime TD.
- Old Diggs receiving-yards and Antonio receptions tickets were marked burnt; their pending SNF legs no longer reserve those players.
- No exact pending player/market/line duplicate exists in the three proposals. Amanda's separate solo ticket is not Andy exposure. No mutually exclusive profits or imaginary stakes are added together.

## Evidence and gates

- Strict vet of the actual nine-leg proposed card and digest: **PASS, zero blockers**. ESPN full roster snapshot: November 1, 3:07 PM Pacific, 32 teams / 2,559 players.
- Fresh public ESPN game state, injuries, depth charts, schedules and last-three-completed-game box scores were fetched around 3:50 PM Pacific. Washington's latest game is Week 6 before its bye; Philadelphia's latest is Week 7. These source facts replace the stale full-season usage aggregate for this scoped proposal.
- Current game summary was checked again at 3:59 PM. The checked ESPN summary exposed no final inactive list. Injury/roster clearance is not described as official final-inactives confirmation.
- BEO pregate raw contains 212 SNF rows. Its full-slate acceptance failed a 500-row minimum plus six unclassified first-TD yes/no rows; those first-TD markets are excluded, and the canonical capture was not overwritten. Each of the nine selected rows has one exact name/market/side/threshold/price match with finite odds and an explicit source timestamp.
- New DK Predictions raw is timestamped 3:20 PM and contains SNF TD observations. Those are pre-fee contract prices, with no captured accepted combo quote; they are comparison-only and are not substituted into the BEO structures.
- Broad weekly preflight used --no-fetch and remains blocked for historical full-card roster issues and unused stale inputs. This report does not claim the broad weekly pipeline is green. The unrelated full-suite failures were not repaired or rerun.

## Per-leg exposure fields

| Game | Market and line | Book | Price / band | Source tier | Expected winner? | QB exposure | Reservation |
|---|---|---|---|---|---|---|
| PHI@WAS | Tanner McKee over 19.5 completions | BEO | -115 / inside -350 barrier | 1 | no - PHI | Tanner McKee | FREE in approved snapshot |
| PHI@WAS | Chig Okonkwo over 3.5 receptions | BEO | +110 / inside -350 barrier | 1 | yes - WAS | Jayden Daniels | FREE in approved snapshot |
| PHI@WAS | Saquon Barkley over 50.5 rushing yards | BEO | +100 / inside -350 barrier | 1 | no - PHI | Tanner McKee | FREE in approved snapshot |
| PHI@WAS | Jayden Daniels over 1.5 passing touchdowns | BEO | +120 / inside -350 barrier | 1 | yes - WAS | Jayden Daniels | SOFT - existing different market |
| PHI@WAS | Stefon Diggs over 4.5 receptions | BEO | +135 / inside -350 barrier | 1 | yes - WAS | Jayden Daniels | FREE in approved snapshot |
| PHI@WAS | Makai Lemon ATD | BEO | +300 / inside -350 barrier | 4 | no - PHI | Tanner McKee | FREE in approved snapshot |
| PHI@WAS | Dallas Goedert ATD | BEO | +230 / inside -350 barrier | 4 | no - PHI | Tanner McKee | SOFT - existing different market |
| PHI@WAS | Hollywood Brown ATD | BEO | +750 / inside -350 barrier | 4 | no - PHI | Tanner McKee | FREE in approved snapshot |
| PHI@WAS | Antonio Williams ATD | BEO | +300 / inside -350 barrier | 4 | yes - WAS | Jayden Daniels | FREE in approved snapshot |

All three tickets also share the game environment. McKee is a common offensive risk for the Philadelphia skill legs across the ladder; Daniels is the corresponding common Washington risk. Distinct player names do not make the tickets statistically independent.

## Left out and checks

- Rachaad White: Washington has publicly described an expanded role for Austin Ekeler; his pass-catching volume is not secure enough to add solely to inflate odds. [Commanders practice report](https://www.commanders.com/news/commanders-lean-in-utilizing-austin-ekeler).
- Antonio's role support is a team report about more opportunities, not a guarantee that McLaurin's entire workload transfers. [Commanders role report](https://www.commanders.com/news/commanders-antonio-williams-bigger-role-terry-mclaurin-injury).
- No full-game spread/total, no prop round robin, no QB rushing/INT market, no defensive market assumed from an unopened heading.
- No leg below -350 and no leg below -200; no unsupported -120 to -100 connector. Nine legs, nine players, no shared anchor, no exact existing duplicate.
- The three single-leg products fall in the template bands. Actual combined quotes remain pending; no insurance, boost or promotion is assigned.
- No sportsbook account action, paid call, Supabase write, ledger/tracker mutation, publication, stage, commit or push occurred in this proposal build.

## Source receipts

Private export folder: E:/data/exports/PlatinumRose/snf-island-2026-11-01-1550PT/

- stack-proposals.json: exact source rows, tiers, computed products, checks, exposure input hashes.
- beo-current-snf.json and dk-current-snf.json: scoped normalized evidence; original raw files are unchanged.
- espn-source-manifest.json and official response files: 12 source URLs, fresh fetch times and SHA-256 hashes.
- role-usage-current.json: verified recent role data; scoped-card-roster-vet.json: strict vet receipt.
- local-exposure-current.json: private owner-aware reconciliation; snf-synthesis-digest.md: sourced leg digest.

## Action Network source update

Read reports/bets/2026-w08-snf-action-network-review-2026-11-01.md before choosing or quoting these stacks. Lemon and Goedert ATD now have named-expert support with price caveats; D. Brown is Dyami, not Hollywood; Andy clarifies the abbreviated Daniels 2+ TD row as passing TDs; its original contract and price remain unverified. Nick Cross / Elijah Mitchell / Dyami markets require venue quotes before any replacement. Earlier displayed prices and products are retained as historical draft evidence.
