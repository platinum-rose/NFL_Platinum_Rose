# MIA @ NYJ — Week 7 game synthesis, pass: sides

As of Fri 2026-10-23 18:30 PT · Kickoff Sun 10/25 10:00 PT (MetLife, outdoors) · inactives about 08:30 PT Sun · packet built 2026-10-24T01:26:41Z · roster_vet PASS (roster age 0.0 h, 1 INFO / 1 UNVERIFIED)

## Recommendation box

- **SPREAD:** NYJ -4.5 -102 (BKR) | **C** | fair NYJ -6.0 | edge +1.5 pts | playable to -5 -110; pass at -5.5 or worse
- **TOTAL:** UNDER 39 -109 (BKR) | **B** | fair 37.5 | edge 1.5 pts | playable to 38.5 -115; pass at 38 or lower
- **MONEYLINE/SU:** PASS (NYJ -216 = 68.4% breakeven vs 68.8% model win prob excluding ties; MIA +187 needs 34.8%, model ~29%) | SU winner NYJ
- **SuperContest:** contest line NYJ -4.5 (same as BKR). Lean NYJ, **not a SuperContest candidate** at tier C
- **Pool:** SU **NYJ**, confidence **10/16** (BUK BUK: NYJ)

Sim (BKR -4.5 / 39, my adjustments margin +1.5, total -1.5): NYJ cover 50.0% to 54.0% · Under (excluding push) 50.0% to 54.7% · NYJ win 66.3% to 69.9%. [Source: scripts/intel/margin-simulator.mjs, calibration sha 0ea35592, run 2026-10-24T01:29Z]

## Game script

Miami has not led at any point this season [Source: news_notes, Sharp Football Worksheet (Hribar), 2026-10-21]. The likely script is a Jets lead built on short, high-percentage passing. Geno Smith throws only 24.4% of his passes 10+ yards downfield, and Miami allows a league-high 89.7% completion rate on throws under 10 yards (87 of 97) [Source: article_notes 9029, Sharp Worksheet]. That fits Smith's profile: aDOT 7.0, CPOE +2.8, INT% 0.6 [Source: NYJ dossier FTN QB1]. The Jets then lean on the run and on Jason Sanders field goals. Their red-zone TD rate is 0.375, with zero RZ TDs in weeks 4-6 [Source: NYJ dossier game log]. That points to a field-goal-heavy game in the low 20s for NYJ.

Miami's offense averages 14.0 PPG and 1.48 points per drive. It has a 23.4% three-and-out rate, an 8.6% sack rate, and Malik Willis's INT-worthy rate is 3.8% [Source: MIA dossier FTN/ESPN]. Its path to points is explosive plays: 16.4% explosive-pass rate and 10.2 aDOT, plus Willis scrambles. The Jets defense limits that well: EPA/play -0.049 (#5), 7.7% sack rate [Source: NYJ dossier nflverse/FTN]. Projected score: NYJ 22, MIA 15.5.

## QB / availability

No Andy-confirmed QB notes exist for this game (`qb_operator_notes` is empty). The QBs come from projected starters and the availability feed.
- **MIA:** Malik Willis (right thumb) was a full participant Wednesday, and Hafley said "I foresee him being good to go" [Source: availability, Rotowire/Sun Sentinel 2026-10-21; PFT 2026-10-21]. Willis was not seen throwing during the bye week, so the risk is small but real. Caleb Douglas (WR, ankle) will play after missing 3 games [ESPN 2026-10-23]. Jaylen Wright (RB) has no designation [Sun Sentinel 2026-10-23]. CB Reese Taylor is OUT, DE Robert Beal Jr. is DOUBTFUL and LB Willie Gay Jr. is QUESTIONABLE [ESPN injuries API 2026-10-23T20:18Z]. De'Von Achane is in the dossier's IR/Out group (W4 ACL per NBC injury roundup). The feed flags a defensive-front cluster risk for MIA (5 events, 4 worsening). Miami cut K Riley Patterson and re-signed K Zane Gonzalez [PFT/ESPN 2026-10-20].
- **NYJ:** Geno Smith is the QB [projected_starters]. RB Breece Hall (quad) is **QUESTIONABLE**: he missed 3 games, returned to limited practice Thursday, and his status is "genuinely up in the air" [Rotowire/NY Post 2026-10-23]. WR Adonai Mitchell (finger) has no designation and will play [ESPN 2026-10-23]. OUT: DE Joseph Ossai and LB Kiko Mauigoa. OT Max Mitchell (concussion, DNP Thursday) is listed OUT in the feed. G Dylan Parham (knee) and RB Kene Nwangwu are questionable.
- **If Hall is out:** Braelon Allen leads the backfield (17-78 last week). I estimate the cost at 0.3 points or less because the Jets' run game is already weak (rush DVOA -13.8%). This does not flip the pick. **If Willis is a surprise inactive or limited (not expected):** NYJ side and Under both strengthen; re-run the sim.
- Inactives come out around 08:30 PT Sunday.

## Market

- **Spread:** AN open NYJ -5.5 (-110, 2026-10-19T00:04Z), now BKR NYJ -4.5 -102 / MIA +4.5 -114. The line has moved 1 point toward Miami. The BKR live board at 2026-10-23T20:11Z matches Andy's 11:40 PT paste, so there is no newer number [Source: bkr gamelines raw; bookmaker-live-2026-10-23-dolphins-at-jets.json]. The juice skew (NYJ -102) says BKR is leaning toward -4 next.
- **Total:** AN open 39.5, now 39 (o -107 / u -109).
- **ML:** AN open NYJ -228 / MIA +185, now NYJ -216 / MIA +187.
- **SuperContest:** NYJ -4.5, the same as BKR, so there is no gap [Source: data/supercontest/week-07-lines.json 2026-10-22T15:03Z].
- **Splits** (Action Network, 2026-10-23T19:40Z): spread NYJ 51% of bets / 45% of money, a 6-point lean to MIA money (below the 10-point sharp flag). Total over 68% of bets / 65% of money, yet the total dropped half a point. That is mild **reverse line movement toward the Under**. ML NYJ 86/86.
- **1H (BKR):** NYJ -3 -103, total 19 [Source: BKR board 20:11Z].
- **Prediction markets:** win-total medians MIA 2.91, NYJ 6.48. The ladders are coherent and there is no divergence edge (context only).

## Quantitative

| Metric | MIA | NYJ |
|---|---|---|
| Record / SRS (packet) | 0-5 / -6.73 (#27) | 2-4 / -0.25 (#20) |
| Net PPG | -12.4 (#32) | -1.67 (#20) |
| EPA/play off / def | -0.103 (#28) / +0.092 (#29) | -0.035 (#18) / -0.049 (#5) |
| YPP for / against | 5.16 / 5.70 | 4.97 / 4.68 |
| Pass def DVOA (FTN) | 34.8% (bad) | 5.4% |
| Sack rate allowed / generated | 8.6% / 2.5% | 9.2% / 7.7% |

Sources: packet power_ratings; dossiers (nflverse W6; FTN through W5 for MIA, flagged stale_1wk, and through W6 for NYJ).

The SRS gap of 6.5 points plus about 1.5 for home field puts a raw number near NYJ -8. I discount that to **-6.0**. Reasons: the 5-game Miami sample, Miami's bye/rest edge, a new kicker, and the Jets' 5-18 record under Glenn with repeated end-of-half failures [PFT 2026-10-19]. The secondary-matchups file rates MIA's coverage as a medium vulnerability (4.43), with slot/TE-middle/underneath boosts that fit the Jets' short passing. Its coverage notes name stale coaches and players, so I ignored those names per gate rule 7.

Totals: NYJ projects at about 22 against a defense allowing 26.4 PPG, discounted for the Jets' red-zone stalls. MIA projects at about 15.5 against a top-5 EPA defense. Fair total **37.5**. Weather is moot: 64°F, 0% precipitation, wind 5.5 km/h [Source: packet weather, Open-Meteo].

| Sim run | NYJ cover | Under (ex-push) | NYJ win |
|---|---|---|---|
| Baseline -4.5 / 39 | 50.0% | 50.0% | 66.3% |
| Adjusted (+1.5 / -1.5) | 54.0% | 54.7% | 69.9% |
| Conservative (+1.0 / -1.0) | 52.7% | 53.1% | 68.7% |

The SuperContest line equals the BKR line, so the contest-line run is the same as the adjusted row.

## Expert agreement vs disagreement

- **NYJ side:** ESPN best bets (Jets -4.5 -115). Action Network (Jets ML -115, which is a 1H-led thesis; its listed price is not a full-game ML). ESPN survivor (Kraemer) also backs the Jets.
- **MIA side:** three YouTube voices, each a separate show: Chad Millman (Polymarket "Brass Balls" MIA +4.5), Simon Hunter (MIA off bye vs NYJ off a road game) and Ross Tucker (MIA +4.5, 2 units). John Ewing/Bet Labs: division dogs are 20-8 ATS, listed at MIA +5. PFT's 16-13 Jets prediction wins straight up but **does not cover 4.5**.
- **Total:** Under from BettingPros (both QBs questionable, MIA capped near 17-20) and Matt Perrault (Under 39.5 -113, a 0.5-point worse number now). PFT's 29-point projection supports the Under. No Over voices found.
- **Dropped:** every `article_selections` item, because they are CHI/NE/SEA TNF props and not this matchup.

## Counter-case

- **NYJ -4.5:** The market moved a full point toward Miami while the bet count split evenly. Miami is fresh off a bye with a winless-team desperation angle. Division dogs are 71% ATS this season. The Jets are bad at closing halves (5-18 under Glenn). Their offense has scored zero red-zone TDs in three straight games, which makes a 3-point Jets win (PFT's 16-13) a live outcome that cashes MIA +4.5.
- **Under 39:** Miami's defense is 29th in EPA and allows 34.8% pass DVOA, and Geno's efficiency (77.3% accurate-completion rate) could produce a 27-point Jets day. Miami has 8 giveaways, and short fields from Willis turnovers could turn field goals into touchdowns. Willis's 16.4% explosive-pass rate can also produce quick scores. One defensive or special-teams TD (Miami's ST is "among the worst") breaks the Under.
- **ML pass:** The NYJ price is fair at -216. MIA +187 needs 34.8% against a model ~29%.

## Ambiguity / missing data

- `missing_inputs[]` is empty. BetOnline has no board for this game (BKR only).
- The official Friday team injury reports (nyjets.com / miamidolphins.com) did not resolve for 2026. Statuses come from the ESPN injuries API, Rotowire and ESPN news dated 10/21-10/23.
- MIA's FTN tables are stale by one week (through W5, but Miami was on a bye in W6, so no games are missing).
- The Action Network ML pick at -115 is not a full-game ML price (likely 1H). It is cited as a directional signal only.

## Pre-kickoff delta checklist

1. BKR moves to NYJ -4: upgrade the spread toward B. At -5.5: pass on the spread.
2. Total drops to 38: pass on the Under (fair 37.5). Total moves back to 39.5 or higher: keep B, better price.
3. Hall inactive: no change. Willis surprise limitation or inactive: NYJ to B and Under to B+ (re-run the sim).
4. Max Mitchell / Parham both out and DE return news for MIA: trim NYJ to a lean.
5. Late money flips the spread split by 10+ toward MIA with the line at 4: treat it as a sharp flag and pass on the spread.

## Gate notes

- Missing inputs: none.
- Roster vet: PASS (age 0.0 h). Players named only from the packet availability, projected starters and news.
- Kickoff has not passed. Forward picks are valid.
- QB operator notes are empty. Willis and Smith are taken from projected starters plus news.
- Final injury reports: official team pages for 2026 could not be retrieved. Rotowire game page and ESPN news (10/23) were used.
- Secondary-matchup coverage notes carry stale coach and player names. I ignored those names.
