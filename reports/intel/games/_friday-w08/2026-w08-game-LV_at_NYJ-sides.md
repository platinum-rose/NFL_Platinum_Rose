# LV @ NYJ — Week 8 game synthesis, pass `sides`

- As-of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:22Z) · Kickoff: Sun 11/1 10:00 AM PT (MetLife, outdoors) · Inactives ~8:30 AM PT Sun
- Packet built_at: 2026-10-31T06:09:16Z (scratch/w08-game-synthesis-queue-sides.json) · roster_vet: PASS (roster age 8.5 h, 2 UNVERIFIED league-wide)

## Recommendation box

| Market | Call | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean NYJ -1 @ BKR -115) | PASS | NYJ -1.75 | 0.75 pt vs BKR -1 | NYJ -1 at -108 or better / NYJ pk; pass at -1 -115 (current) and at -1.5 |
| TOTAL | **PASS** (45.5, o -112 / u -104) | PASS | 45.5–46 | ~0 | n/a; under only at 47+, over only at 44 or lower |
| MONEYLINE / SU | **PASS** on price (NYJ -131 / LV +115); SU winner NYJ | PASS | NYJ -122 (~54.4% incl. tie split) | NYJ ML ~2 pts of prob short | NYJ ML playable at -120 or better |
| SuperContest | NYJ -1.5 is a coin flip (sim 50.7%); **not a candidate** | — | NYJ -1.75 | +0.25 | — |
| Pool | SU **NYJ**, confidence **4 / 16** (low) | — | — | — | — |

Price basis: BKR paste "LV +1 -101 | NYJ -1 -115 | o45.5 -112 | u45.5 -104 | ML LV +115 NYJ -131" captured Fri 10/30 ~6:52 PM PT [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt]; the per-game BKR board (capturedAt 2026-10-31T01:50:37Z = 6:50 PM PT) shows identical game rows, so the paste is the newest number [Source: data/generated/props/bookmaker-live-2026-10-31-raiders-at-jets.json]. BKR team totals: LV 22.5 (o -113/u -101), NYJ 23.5 (o +100/u -115); 1H NYJ -0.5 +104 / 22.5.

## Game script

Two even, below-average teams (model rank LV #24, NYJ #23). Most likely script: a Jets offense built on short passing (Geno Smith aDOT 6.6, CPOE +3.6 per FTN) attacks a Raiders defense that has fallen apart for four weeks (league-high 3.25 points per drive and 6.5 yards per play allowed over that stretch) [Source: packet article_notes, Sharp Football Hribar worksheet, 2026-10-28]. Las Vegas can't run (rush EPA/att -0.255, success 30.4%, DVOA -27%) [Source: FTN via team-dossiers/2026-w08/LV.md], so Kirk Cousins throws often (neutral pass rate 0.613) into a Jets pass rush that loses two edge rushers this week. Expect a one-score game that comes down to red-zone finishing (NYJ RZ TD 45%, 31st) and turnovers. A Jets win by 1–3 is the median outcome; the market already prices that.

## QB / availability

- QBs: Kirk Cousins (LV) and Geno Smith (NYJ) start; Kubiak: "There is no controversy" [Source: packet qb_operator_notes; news_notes ESPN/Rotowire 2026-10-26]. Note: scratch/w08-qb-confirmations-1030.md is labeled "web-checked by Claude (not Andy-confirmed)".
- Official Friday report (Raiders.com, 10/30 12:56 PM): **LV** Out: DE Patrick Johnson (stinger), TE Carter Runyon (foot); Q: WR Jack Bech (forearm), G/C Jackson Powers-Johnson (back). TE Brock Bowers (calf) full Thursday, no designation. **NYJ** Out: EDGE Joseph Ossai (ankle), OL Max Mitchell (concussion), DL T'Vondre Sweat (knee); Doubtful: EDGE David Bailey (groin); Q: RB Breece Hall (quad), OL Dylan Parham (knee) [Source: web, raiders.com Week 8 injury report, 2026-10-30].
- If Hall is out: Braelon Allen (also managing an ankle; he has been lead back for four games) carries the load; the Jets' run game is already poor (EPA/att -0.152), so the spread impact is small (≤0.5 pt). If Bailey is a surprise active, it helps the Jets a little. The Jets' pass rush losing Ossai, Bailey and Sweat partly offsets LV's defensive slide: it is the main reason the adjustment stays small.
- Packet availability for NYJ is null (no ESPN status data); it was filled with the web check above.

## Market

- AN open (Sun 10/25 5:00 PM PT): NYJ -1.5 (-104), total 44.5, ML LV -103 / NYJ -118 [Source: packet market.an_opener]. BKR now: NYJ -1 -115, 45.5. Movement: half a point toward LV on the spread (BKR prices it back with juice: -115 on the Jets ≈ -1.25 no-vig); total +1.
- Opener conflict: the AN ML opener has LV as a slight favorite (-103) while the spread opener has NYJ -1.5, and Millman's pull row reads "Jets +1.5 as home dog" while his YouTube segment says "sharp money flipped the line in favor of the Jets." So the lookahead line probably had LV favored and early sharp money flipped it to the Jets. The AN primer lists total_open 41.5 against the AN opener's 44.5 (see Ambiguity).
- SuperContest locked NYJ -1.5 (captured 10/29) vs BKR -1: the contest asks the Jets to lay half a point more.
- Splits (AN, 7:06 PM PT): spread 82% bets / 82% money on LV, no gap; ML LV 72% bets / 81% money (+9, just under the 10-pt sharp flag); total over 69% / 78% (+9, under the flag). No sharp flag fires. 82% of tickets on LV moved the line only half a point and BKR still charges -115 on the Jets: mild resistance that favors NYJ [Source: packet splits, an_primer.game.public]. BetMGM: 66% of money on Jets -1.5 [Source: news_notes johnewing 10/30]. Books disagree on where the public money sits, which weakens the split signal.

## Quantitative

- Power: SRS LV -2.42 / NYJ -1.90; net PPG -2.0 / -1.86; Pythag .456 / .447. Even on a neutral field, so ~1.5 pts of home field puts fair at NYJ -1.5 to -2 [Source: packet power_ratings].
- nflverse EPA/play: NYJ offense +0.004 (#14) and defense -0.006 (#14) vs LV offense -0.010 (#18) and defense +0.061 (#24). FTN: LV defense DVOA 12.7% (poor), passing DVOA allowed 18.1%; NYJ defense 5.0%. Schedule caveat: NYJ's schedule to date ranks 4th easiest [Source: news_notes SharpFootball 10/27].
- Pass-rush mismatch: LV pressure 36.7% vs NYJ sacks allowed 8.7%, so Geno is exposed, but LV DE Patrick Johnson is out and its defensive front is flagged as a cluster risk [Source: packet availability.LV.summary].
- Kalshi/Polymarket win totals: LV 7.42 / NYJ 5.9 (context only; the market rates LV higher than the model, delta -0.22 vs -0.80) [Source: packet prediction_markets].
- Prior LV game totals: 40, 40, 62, 57, 62, 63, 56 (avg 54.3). NYJ: 33, 37, 55, 35, 29, 45, 53 (avg 41.0). The blend is ~47.6, but NYJ plays slow (58.6 plays/gm, 29.6 s/play) and LV fast (65.0, 26.2) [Source: team dossiers game logs and FTN tempo].
- Secondary matchups: tier "watch" for both teams; Bowers (te_middle) and Garrett Wilson (alpha_x) are the matched targets. The coach names in the coverage notes are stale and were ignored [Source: packet secondary_matchups].

Simulator (scripts/intel/margin-simulator.mjs, selftest all PASS):

| Run | home_line | total | margin_adj | NYJ cover (excl push) | push | NYJ win | Over |
|---|---|---|---|---|---|---|---|
| BKR baseline | -1 | 45.5 | 0 | 50.0% | 2.4% | 52.4% | 50.0% |
| BKR adjusted | -1 | 45.5 | +0.75 | 52.0% | 2.4% | 54.4% | 50.0% |
| Contest baseline | -1.5 | 45.5 | 0 | 50.0% | 0 | 53.6% | 50.0% |
| Contest adjusted | -1.5 | 45.5 | +0.25 | 50.7% | 0 | 54.3% | 50.0% |

Adjustments: margin +0.75 home (soft cap 2.0 respected). Reasons: (1) Koerner's projection is NYJ -2 vs -1.5 [packet youtube_picks_approved, AN PRO 10/28]; (2) the EPA/FTN gap on defense plus LV allowing 3.25 pts/drive over its last 4 [Hribar worksheet 10/28]; (3) LV crosses three time zones for a 10 AM PT body-clock kickoff, road teams crossing 2+ zones are 6-13 ATS this season, and LV is 2-14 SU in its last 16 games in the Eastern time zone [an_primer]; partly offset by (4) NYJ's edge depletion (Ossai Out, Bailey Doubtful, Sweat Out) [raiders.com 10/30]. Total adjustment: 0. LV's high-scoring games and leaking defense offset NYJ's slow pace, poor red-zone rate and Geno Smith's 16-6 record to the 1H under.
Break-even at -115 is 53.5%; 52.0% is below it. **PASS at the current price.** At the contest line, 50.7% is a coin flip.

## Expert / podcast / article agreement

- **NYJ:** Stuckey (Action Network, NYJ -1.5), Chad Millman (Sharp or Square, "Brass Balls Trade," sharp flip; one opinion despite also appearing in expert_picks_pull), John Jastremski (The Favorites, NYJ -1.5 -110), Sean Koerner (ATS confidence #10/26, edge 0.7%), lockandcash (Jets ML -120 best bet; the duplicate Grok row was dropped), BettingPros (Jets ML -105, 10/26).
- **LV:** Brandon Anderson (AN, Raiders +1.5: "Jets 1-3 as favorites under Glenn"), Zachary Cohen (VSiN, Raiders ML +105, 10/28), PFT (Raiders 24-17), Tuley (VSiN, Raiders +7.5 teaser only; not comparable to the full-game number).
- Repricing: the NYJ -1.5 calls are now -1 (better for the Jets side by 0.5). The LV +1.5 call is now +1 and the LV ML +105 is now +115 (better price, worse line).
- Total: BettingPros under 44.5 (now 45.5, a full point better for the under); PFT's 24-17 implies 41. No over voices.
- The AN primer trends cut both ways. NYJ is 3-12-1 ATS after games decided by 3 or fewer (they lost 28-25 last week) and 0-2 SU/ATS in the second game of a homestand under Glenn. Cousins is 0-6 ATS with referee John Hussey. Bet Labs systems ("Business Trip off road loss," "Road dog, no playoffs recently") point to LV.

## Counter-case

- **Against NYJ (lean):** LV is 5-2 ATS, and the Raiders have scored 33 points more than their implied totals this season [Hribar]. NYJ's pass protection allows an 8.7% sack rate and Geno takes sacks under pressure. Glenn's Jets are 4-17-3 in first halves and 1-3 as favorites. With two Jets edge rushers and their nose tackle out, Cousins gets clean pockets. Bet Labs systems and Anderson side with LV.
- **Against a total pass:** an over case exists: every LV game this season has reached 40+, and LV has allowed 3.25 pts/drive over its last 4. An under case also exists: the Jets' pace and red-zone finishing (45%) are poor, and Geno is 16-6 to the 1H under.

## Ambiguity / missing data

- missing_inputs[] is empty. NYJ availability in the packet is null; it was filled by the web check.
- AN primer `total_open` 41.5 vs AN opener 44.5. The opener file is treated as the baseline; 41.5 may be a lookahead number.
- The ML opener had LV favored while the spread opener had NYJ -1.5 (the spread and ML openers were captured at different times).
- The QB notes file is Claude-web-checked, not Andy-confirmed.
- The two books disagree on where the public is (AN shows 82% on LV; BetMGM shows 66% of money on Jets -1.5).

## Pre-kickoff delta checklist

- NYJ -1 at -108 or better, or a pick'em: the lean becomes a tier-C NYJ play. NYJ -1.5 or worse: hard pass.
- NYJ ML -120 or better: the ML becomes tier C (above break-even only at that price).
- Breece Hall inactive: no change (≤0.5). Bailey active: +0.25 NYJ. Powers-Johnson out: +0.25 NYJ (LV interior OL).
- Total 47+: consider the under (tier C). 44 or lower: consider the over. Weather is immaterial (15 °C, 0% precip, 6 km/h wind).
- Inactives ~8:30 AM PT Sunday.

## Gate notes

1. missing_inputs: none.
2. roster_vet: PASS, 8.5 h old.
3. Kickoff not passed (forward picks valid).
4. Teams and roles come from the packet plus raiders.com (10/30). Availability for NYJ is null in the packet; the official report was web-checked.
5. QB facts are stable; no QB is on either report.
6. Final Friday report retrieved from raiders.com (both teams).
7. Coach names in secondary_matchups are stale and were ignored. The LV dossier misspells the HC as "Kubliak"; it is Klint Kubiak per an_primer.
