# MIN @ DET — Week 8 2026 — pass: props

As of Fri 2026-10-30 11:40 PM PT (2026-10-31T06:40Z) · Kickoff Sun 11/1 10:00 AM PT (Ford Field, dome) · Packet built 2026-10-31T06:09Z (`scratch/w08-game-synthesis-queue-props.json`) · roster_vet PASS (8.5h) · Book: BKR per-game board `bookmaker-live-2026-10-31-vikings-at-lions.json`, capturedAt 2026-10-31T01:50Z

## Recommendation box

| Player | Market | Line | Price | Book | capturedAt | Basis | Tier | Parlay leg |
|---|---|---|---|---|---|---|---|---|
| Amon-Ra St. Brown | Receptions **Over** | 7.5 | +119 | BKR (Total Receptions) | 01:50Z | 11.3 tgt/g, 8+ rec in 4/6; answers MIN 71% blitz | **B** | y |
| Justin Jefferson | Receptions **Under** | 5.5 | +119 | BKR | 01:50Z | 4.6 rec/g, under in 3/5; Murray-era 2/6/4 | **B** | y |
| Jared Goff | Pass yds **Under** | 257.5 | -108 | BKR | 01:50Z | proj ~245; MIN 181 pass yd/g allowed | C | n with TD Under |
| Jared Goff | Pass TD **Under** | 1.5 | +103 | BKR | 01:50Z | MIN 3 pass TD allowed in 6 g; Gibbs owns RZ | C | n with yds Under |
| Kyler Murray | Rush att **Over** | 4.5 | +110 | BKR (Total Carries) | 01:50Z | 6/10/5 attempts last 3 games | C | y (small) |
| Kyler Murray | Pass TD Over 1.5 | 1.5 | +124 | BKR | 01:50Z | fair ~42% vs 44.6% implied | PASS | — |
| T.J. Hockenson | Receptions 4.5 | 4.5 | -104/-111 | BKR | 01:50Z | median 3.5 | PASS | — |
| Jahmyr Gibbs | Rush yds / carries | ladder only | — | BKR | 01:50Z | no Under row posted → no Under pick | PASS | — |

Playable-to: St. Brown O7.5 to +100 (PASS at 8.5) · Jefferson U5.5 to -105 · Goff U257.5 to -115 / U250.5 -110, PASS at 249.5 · Goff U1.5 TD to +100 · Murray O4.5 att to -115.

**7e Anytime-TD (7 legs, BKR 01:50Z):** Gibbs -371 (anchor, B) · **Aaron Jones +181 (C, best price gap: DK Predictions ref +108)** · **Hockenson +235 (C)** · St. Brown +118 · Jefferson +143 · J. Williams +189 · LaPorta +219. Swap: Jordan Mason +170 for Jones if Jones is reported as limited.

**8a First-TD:** **Gibbs +372 (B; DK ref +285)** · Aaron Jones +660 · St. Brown +719 · Hockenson +1083.

## Game script (from the sides pass)
The sides pass puts this at DET by 2.7 with a total of 45.0, so roughly DET 24, MIN 21 (BKR team totals DET 24.5 u-119, MIN 20.5) [sides report; BKR TT rows]. MIN grinds clock (60.7 plays, 30.8 sec/play) and blitzes 71% of dropbacks. DET's way through is quick throws to the slot and middle plus Gibbs volume (29 carries in W7). That script supports the props above: St. Brown gets volume on short throws, Goff's yards and TDs land under the full-season averages, MIN's passing volume stays modest (Jefferson Under), and Murray escapes pressure on scrambles.

## QB / availability
- QBs: Kyler Murray (MIN, named starter, no designation) and Jared Goff (DET) [qb_operator_notes].
- Final reports [vikings.com, 10/30 1:00 PM]: **DET** S Kerby Joseph OUT; CB Roger McCreary Questionable. St. Brown (ankle), Gibbs (shoulder) and Rakestraw were full participants Friday with no designation. **MIN** S Jay Ward Questionable. Aaron Jones (knee) was full Friday with no designation. Darrisaw had a rest DNP and no designation. Hockenson, Jefferson, LaPorta and J. Williams are not on either report.
- Jones/Mason "co-lead" the backfield [Rotowire 10/30]. If Jones is limited in-game, Mason (+170 ATD, 49.5 rush yds) inherits the work.
- Inactives Sun ~8:30 AM PT.

## Market / prices
- All picks are priced on the BKR per-game board (01:50Z), which agrees with the gameline paste (MIN +3 +102 / 46).
- BetOnline Sunday player props are not posted (32 rows, no player markets): re-run Sat ~2 PM PT. DraftKings Predictions (10/29 03:20Z) is a reference only.
- The DK reference has MIN RBs much shorter than BKR: Jones 48% vs BKR 35.6%, Mason 47% vs 37%. Gibbs FTD is 26% at DK vs 21.2% at BKR. Those gaps are where the ATD/FTD value sits.
- Analyst reprices: Sal Vetri had Goff U274.5 -110, and BKR is 17 yards tighter at 257.5. Erickson and Woolcock (BettingPros) had Hockenson ATD +260, and BKR is +235. Welsh had Murray o1.5 pass TD +128, and BKR is +124. Cody Brown's alt legs (Goff 200+, J. Williams 30+, Gibbs 20+ rec) come from a 22-leg parlay and are not comparable.

## Quantitative [pbp `data/nflverse/2026/play_by_play_2026.csv.gz`; dossiers]
- **DET receiving:** St. Brown 68 tgt / 46 rec / 525 yds and 5 TD. Gibbs 40 tgt / 32 rec. LaPorta 39 / 28 / 334. J. Williams 38 / 23 / 367 and 4 TD. Gibbs has 9 TD and 43 red-zone opportunities (St. Brown 16, LaPorta 10).
- **Goff by game:** 206 / 327 / 269 / 412 / 271 / 303 yds, 2/4/2/1/3/2 TD.
- **MIN receiving:** Hockenson 32 tgt / 27 rec. Jefferson 31 / 23 / 302 and 3 TD (5 g). Addison 25 / 13. A. Jones has 14 RZ opps (team-high) and Hockenson 7.
- **Murray by game:** 168 / 247 / 229 / 150 yds; rush attempts 0 / 6 / 10 / 5.
- **MIN D:** 181 pass yd/g allowed and 3 pass TD / 3 rush TD in 6 games. FTN pass D DVOA -26.5%, CPOE allowed -8.5%, 39% pressure, 71% blitz.
- **DET D:** 313 pass yd/g allowed and 16 pass TD / 6 rush TD. Pass D DVOA +16.3%, but rush D EPA -0.117/att.
- Goff's pressure split is -0.310 EPA/DB pressured vs +0.467 clean.
- No simulator was used for props (no calibrated joint model). These are judgment projections, not model probabilities.

## Expert agreement / disagreement
- **Agree:** Sal Vetri (Goff Under). Erickson and Woolcock (Hockenson ATD; two shows, counted as two opinions, same outlet). Welsh (Murray o1.5 TD, which I PASS at this price). Brandon Anderson's DET thesis (Goff beats the blitz) supports the St. Brown Over, not Goff's yards.
- **Disagree:** Brandon Anderson and Kendra Middleton both expect Detroit's offense to score freely, which argues against both Goff Unders. SharpFootball's tweet (Gibbs 2.5 YPC vs MIN last season; MIN allows the fewest RB receiving points) is context for passing on Gibbs overs.

## Counter-case
- **St. Brown O7.5:** MIN allows a league-low completion rate over expected. If DET leans on Gibbs with a lead, St. Brown could finish at 5-6 catches, as in two of six games.
- **Jefferson U5.5:** DET's secondary is thin (Joseph OUT, Maddox/Harper IR, McCreary Q). A DET two-score lead turns MIN into a catch-up team built around Jefferson.
- **Goff Unders:** Goff has 14 TD / 0 INT and topped 269 yards in 4 of 6. MIN's elite numbers came against the league's easiest schedule.
- **Murray attempts:** MIN could keep him in the pocket in a division road game (zero rushes in W3).
- **ATD/FTD:** MIN's defense has allowed 1 TD per game, so every DET leg beyond Gibbs is thinner than its price implies. MIN usually elects to receive (Fezzik), which favors a MIN first TD.

## Ambiguity / missing data
- BetOnline player props are not posted.
- Gibbs markets are over-only ladders.
- Woolcock's "10 TE TDs allowed" claim is unverified.
- Welsh's staging tagged Murray as ARI; operator notes and the roster map say MIN.
- MIN's backfield split is unclear.
- FTN data runs through W6 only.
- `props_intel_articles` is empty.

## Pre-kickoff delta checklist
1. Inactives (~8:30 AM PT): any St. Brown or Gibbs surprise voids their legs. A Darrisaw or O'Neill inactive raises Murray scrambles and lowers MIN ATDs.
2. McCreary OUT → trim Jefferson U5.5 to C.
3. St. Brown line to 8.5 or price below +100 → PASS. Jefferson U5.5 worse than -105 → PASS. Goff yds at 249.5 or lower → PASS.
4. Reports that Jones is limited → swap the ATD leg to Mason +170.
5. Saturday BetOnline board: shop St. Brown and Jefferson reception lines.

## Gate notes
- missing_inputs: the BetOnline player-prop board is thin or missing, so BKR is the only executable book. ATD/FTD lists use BKR rows only.
- roster_vet PASS (8.5h, not rerun). Kickoff not passed.
- Final injury reports checked (vikings.com 10/30).
- No QB INT legs, per the session rule. DK Predictions is a reference only.
- No other game was touched.
