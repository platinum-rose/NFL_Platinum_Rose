# 2026 W08: LAC @ LAR, game synthesis, pass `props`

As of Fri 2026-10-30, 11:35 PM PT. Kickoff is Sun 11/1 at 1:05 PM PT at SoFi; inactives come out about 11:35 AM PT. The packet was built 2026-10-31T06:09:18Z (`scratch/w08-game-synthesis-queue-props.json`). roster_vet: PASS (8.5 h old). missing_inputs: the BetOnline player-prop board is thin (32 rows, no player props). This pass follows the game script in `2026-w08-game-LAC_at_LAR-sides.md`: LAC +6.5 C, Under 45 C, Rams SU (sim mean margin LAR +6.2, mean total 44.0).

## Recommendation box (all prices from BKR per-game board `data/generated/props/bookmaker-live-2026-10-31-chargers-at-rams.json`, capturedAt 2026-10-31T01:51:58Z)

| Player | Market | Line | Price | Book | Projection / basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|
| Blake Corum (LAR) | Rush yds **Over** | 47.5 | -109 | BKR | ~12 car × 4.7 ≈ 56. W7: 17-93 with Adams out; 53% success rate | **B** | y (same Rams-lead script) |
| Kyren Williams (LAR) | Rush yds **Over** | 59.5 | -111 | BKR | ~14 car × 4.8 ≈ 67. Season 70/g; W7 16-99 | C | y, correlated with Corum |
| Puka Nacua (LAR) | Receptions **Over** | 7.5 | -126 | BKR | 9.0 rec/g on 12.4 tgt (5 GP); W7 8/10 without Adams | C | y at alt 6.5 (-332) only |
| Matthew Stafford (LAR) | Pass yds **Under** | 250.5 | -108 | BKR | ~230. W7 195 on 29 att; run-leaning; McVay home-fav Under trend | C | y (fits Under 45) |
| Ladd McConkey (LAC) | Rec yds **Over** | 43.5 | -123 | BKR | YPRR 2.08 × ~30 routes ≈ 60; slot/underneath boost vs LAR zone | C | n (concussion return, price) |
| Justin Herbert | Pass yds 205.5 (-109/-107) | | | BKR | Conflicted: 190/g season vs trailing volume and healthy WRs | PASS | |
| Herbert rush 23.5 / Hampton 9.5 car, 32.5 yds / Higbee 3.5 rec | | | | BKR | Thin data or role unclear (see Ambiguity) | PASS | |

**7e Anytime-TD candidates (BKR; DK Predictions 10/29 shown as a reference only, not executable):**
1. Kyren Williams **-150** (DK -133)
2. Puka Nacua **-126** (DK -122)
3. Blake Corum **+160** (DK +163)
4. Omarion Hampton **+175** (DK +203)
5. Tyler Higbee **+178** (DK +245)
6. Ladd McConkey **+230** (DK +285)
7. Tre Harris **+284** / Quentin Johnston +284

Avoid Davis Allen at +222. DK has him at +525, so BKR is pricing in his two TDs from W7.

**8a First-TD candidates (BKR):** Kyren Williams **+489** (DK +400), Puka Nacua **+562** (DK +488), Blake Corum +798, Tyler Higbee +823, Omarion Hampton +868. On the first two, BKR pays better than the DK reference.

## Game script
This is the sides script. The Rams build a 7–10 point lead and lean on the run. McVay is running more without Davante Adams, who is out after hamstring surgery: Rams RBs had 33 carries in W7, and ESPN/Barshop wrote on 10/28 that the Rams are "leaning on the run game" [news_notes; pick_signals]. LAC's run defense has allowed 124 rush yds/g and **9 rush TDs in 6 games**, with opponents running on 48.5% of plays [LAC dossier FTN team-defense overview (1), through W6]. That combination makes the Rams RB overs and Kyren/Corum TDs the core of this card. Stafford's yardage is capped by the run lean and the expected lead (W7: 23/29, 195, 3 TD). LAC's passing upside depends on McConkey and Tre' Harris both being cleared (ESPN/Eric Smith, 10/30) and on garbage-time volume.

## QB / availability
- QBs: Herbert and Stafford start [qb_operator_notes]. LAC OUT: Derwin James, Deane Leonard, Kayode Awosika, Brenen Thompson. McConkey is off the injury report and Harris has no designation [availability 10/30]. LAR: Adams out, Myles Garrett not returning in W8, TE Terrance Ferguson not practicing (ESPN 10/28). Coleman Shelton is OUT per the operator notes; Parkinson (ribs) and Whittington (back) are Q.
- **If Parkinson is inactive**, Higbee's routes go up: lean Higbee over 3.5 rec (-108) at C. If he's active, PASS. **McDuffie** is OUT per the operator notes but Q per Caplan 10/30. That only affects LAC receivers: if he's inactive, McConkey's over firms up.
- My web search found no final W8 Rams report. Recheck at inactives.

## Market
- No captured BetOnline player props (the 10/29 board has only game and specials markets). DK Predictions is a reference only. Every pick above is priced only at BKR, so there was no line shopping.
- The BKR TD prices are shorter than DK on LAR TEs (Higbee, Allen) and McConkey, and longer on Kyren/Puka first TD.
- Sides context: BKR has LAR -6.5 and total 45; team totals are LAR 26.5 (o-104) and LAC 19.5. The 13-pt money gap points to sharp money on LAC.

## Quantitative
- Simulator selftest PASS. `--home-line -6.5 --total 45 --margin-adj -1 --total-adj -1` gives mean margin LAR +6.2 and mean total 44.0, which implies about LAR 25 / LAC 19. Props are **not** modeled; there are no model probabilities for them.
- FTN through W7 for LAR: Kyren 96-492 (5.1), 5 rush TD, 2 fumbles, 67.9% snaps. Corum 64-316 (4.9), 53.1% success vs Kyren's 42.7%, 9.4% stuffed. Puka 32.5% TGT/RTE, YPRR 2.54. Higbee 3.7 rec/g, but W7 without Adams was 2/3 for 14 while Allen got 5 targets. Stafford 7.1 Y/A, 14 TD / 7 INT.
- FTN for LAC: Herbert 6.3 Y/A, 9.5% sack rate, CPOE -2.1, 190 yds/g. Hampton 3.6 YPC with 3 of LAC's 4 rush TDs. McConkey 2.08 YPRR on limited snaps (37.9%).
- LAC pass defense: CPOE allowed +2.7, catchable-ball rate 74.3%, explosive rate 14.9%. With James out, the defense is graded **high** vulnerability for TE middle, slot and deep passes [secondary_matchups]. That is the main risk to the Stafford under.

## Expert / podcast agreement
- **For:**
  - Sal Bets: Kyren 2+ TD parlay leg, citing "LAC allows 3rd-most rush TDs" (BKR 2+ TD +379).
  - PFF start'em: elevate Corum.
  - Cody Brown: Puka 60+ and Kyren 40+ as alt legs in a 22-leg parlay. These are not comparable to the main lines.
  - Chris Welsh (BettingPros YT): McConkey ATD @ +280. BKR is shorter at +230.
  - Fezzik and Even Money: Under on the game total, which supports the Stafford under.
- **Against:** Caesars reported sharp Over 43.5 (@PatrickE_Vegas), which works against the Stafford under. No captured expert takes a prop under on the Rams RBs.

## Counter-cases
- **Corum O47.5:** Kyren takes the goal-line work and the leading-script carries, and Corum falls back to his season average of 9 carries for 45 yards. LAC's run D is #7 in EPA overall, and its stuff rate is 20.2%.
- **Kyren O59.5:** A real committee (Corum's success rate is higher) caps him near 13 carries. Kyren has 2 fumbles, and a negative game script is possible.
- **Puka O7.5 rec:** At -126 the price is steep. Puka has soft-tissue re-injury risk (personal bookmark, 10/24). A run-heavy plan with a lead could hold him to 6–7 catches.
- **Stafford U250.5:** With James out, the middle and deep areas open up. LAC's turnovers hand the Rams short fields, but scores off short fields cut Stafford's yards rather than add to them. The real risk is a high-scoring shootout (Caesars sharp over).
- **McConkey O43.5:** He's coming back from a concussion. Harris and Johnston share targets, and Herbert's sack rate kills drives.

## Ambiguity / missing data
- BetOnline player props are not posted yet; re-run Saturday ~2 PM.
- McDuffie status conflict (OUT vs Q).
- No season rushing line for Herbert in the packet.
- LAC RB split is unclear: Hampton's 9.5-carry line suggests a committee with Vidal and Mitchell.
- LAC FTN data is through W6 (bye, so nothing missing).
- The LAR dossier venue says "Melbourne"; this is a known bug.

## Pre-kickoff delta checklist
1. Inactives: Parkinson OUT → Higbee over 3.5 rec becomes a C play. McDuffie OUT → McConkey over firms up.
2. Corum line moves to 50.5+ → he drops to C; at 52.5 → PASS. Kyren 61.5+ → PASS.
3. Puka 8.5 or -135 or worse → PASS (use the 6.5 alt only as a leg).
4. Stafford 245.5 or lower → PASS.
5. BetOnline Saturday board: shop every leg above. Any better number goes ahead of BKR.
6. Any LAC play-caller news or an LAR RB injury → re-evaluate the RB overs.

## Gate notes
- missing_inputs: the BetOnline player board is thin, so every price is from BKR. No pick depended on BetOnline, so nothing was capped.
- roster_vet: PASS. Kickoff is in the future; these are forward picks.
- Availability feed: McDuffie Q vs operator OUT. The ESPN feed lists Shelton Q while the operator notes say OUT; I used OUT.
- Friday injury web search: no final W8 Rams report found.
- Ignored the coach names in secondary_matchups per rule 7.
- No BKR QB INT legs were used.
