# LV @ NYJ: Week 8 game synthesis, pass `sides` (Saturday re-run)

- As-of: Sat 2026-10-31 ~3:20 PM PT · Kickoff: Sun 11/1 10:00 AM PT (MetLife, outdoors) · Inactives ~8:30 AM PT Sun
- Packet built_at: 2026-10-31T21:55:40Z (scratch/w08-game-synthesis-queue-sides.json) · roster_vet: PASS (roster age 0.3 h; 14 UNVERIFIED league-wide)
- Friday baseline: reports/intel/games/_friday-w08/2026-w08-game-LV_at_NYJ-sides.md (generated 2026-10-31T06:22Z)

## Recommendation box

| Market | Call | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean NYJ -1.5 @ BKR -108) | PASS | NYJ -1.75 | +0.25 pt vs BKR -1.5 | NYJ -1 at -110 or better / pk = tier C; pass at -1.5 (current) and worse |
| TOTAL | **PASS** (45.5, o -112 / u -104) | PASS | 45.5–46 | ~0 | under only at 47+; over only at 44 or lower |
| MONEYLINE / SU | **PASS** on price (NYJ -127 / LV +112); SU winner **NYJ** | PASS | NYJ -122 (sim 54.3% win incl. half of 2.4% ties) | ~1.5 prob pts short of -127 break-even (55.9%) | NYJ ML -120 or better |
| SuperContest | NYJ -1.5 (= BKR now) sim 50.7%: **not a candidate** | — | NYJ -1.75 | +0.25 | — |
| Pool | SU **NYJ**, confidence **4 / 16** | — | — | — | — |

Price basis: BKR paste "LV +1.5 -108 \| NYJ -1.5 -108 \| o45.5 -112 \| u45.5 -104 \| ML LV +112 NYJ -127", captured Sat ~2:26 PM PT [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt]. The per-game BKR board (capturedAt 2026-10-31T21:26:54Z = 2:26 PM PT) has identical rows, so it is the newest number [Source: data/generated/props/bookmaker-live-2026-10-31-raiders-at-jets.json]. Team totals: LV 22.5 (o -114 / u -101), NYJ 23.5 (o +101 / u -115). 1H: NYJ -0.5 +100, total 22.5.

## Changes vs Friday

1. **Spread:** NYJ -1 -115 → **NYJ -1.5 -108**. In no-vig terms that is about -1.25 → -1.5: a quarter-point move toward the Jets. The NYJ -1 at -108 trigger Friday set for a tier-C bet never came; the market moved past it. [BKR raw Fri 6:52 PM vs Sat 2:26 PM]
2. **ML:** NYJ -131 / LV +115 → NYJ -127 / LV +112. The hold shrank and the NYJ ML moved closer to fair (-122), but it is still short of the -120 trigger.
3. **Total:** 45.5 unchanged at the same prices (o -112 / u -104). The NYJ team-total over went +100 → +101; the 1H NYJ -0.5 went +104 → +100.
4. **Splits (AN, 2:23 PM PT):** spread LV 81% bets / 82% money (Fri 82/82); ML LV 72% / 78% (Fri 72/81, gap +9 → +6); total over 70% / 74% (Fri 69/78, gap +9 → +4). The money gaps narrowed and **no sharp flag fires**. The line moved toward the Jets against roughly 81% of LV tickets, a mild reverse move. It supports Friday's NYJ lean, but that lean is now priced in.
5. **New LV voices (Sat):** Travis Pulver (BettingPros underdog card) Raiders ML +102 (now +112, so a better price for LV); Matt Youmans (VSiN) Raiders +7.5 in a 6-pt teaser (-140); Lock & Cash (X) Raiders +7.5 teaser leg. The two teaser legs are not comparable to the full-game number. **No new NYJ side voices.**
6. **Injuries:** T'Vondre Sweat was placed on IR Saturday (he was already Out, so no change). The official Friday designations are unchanged and there was no Saturday update or roster move on raiders.com. Breece Hall (quad) remains Questionable [ESPN 10/31 20:20Z; raiders.com 10/30 12:56 PM].
7. **Model:** fair line unchanged at NYJ -1.75. margin_adj vs BKR went from +0.75 (vs -1) to +0.25 (vs -1.5), and NYJ cover fell from 52.0% at -1 to 50.7% at -1.5. **All three markets remain PASS.**

## Game script

Two even, below-average teams (model rank LV #24, NYJ #23) [packet power_ratings]. The Jets run a short passing game (Geno Smith aDOT 6.6) against a Raiders defense allowing a league-high 3.25 points per drive and 6.5 yards per play over the last four weeks [Source: packet article_notes, Sharp Football Hribar worksheet, 2026-10-28]. LV can't run (rush EPA/att -0.255), so Cousins throws into a Jets front missing Ossai, Sweat and very likely Bailey [FTN via team-dossiers/2026-w08/LV.md; raiders.com 10/30]. The median outcome is a 1–3 point Jets win (sim median margin NYJ +2), and the market already prices it there.

## QB / availability

- Kirk Cousins (LV) and Geno Smith (NYJ) start. Kubiak: "There is no controversy" [news_notes ESPN/Rotowire 2026-10-26; an_primer]. qb_operator_notes is empty, so nothing here is Andy-confirmed.
- Final Friday report [Source: web, raiders.com Week 8 injury report, 10/30 12:56 PM, re-fetched Sat]:
  - **LV:** Out DE Patrick Johnson (stinger) and TE Carter Runyon (foot); Questionable WR Jack Bech (forearm) and G/C Jackson Powers-Johnson (back). Bowers (calf) carries no designation.
  - **NYJ:** Out EDGE Joseph Ossai (ankle), OL Max Mitchell (concussion) and DL T'Vondre Sweat (knee; IR Sat); Doubtful EDGE David Bailey (groin); Questionable RB Breece Hall (quad) and OL Dylan Parham (knee). Braelon Allen (ankle) carries no designation.
- **If Hall is out:** Allen leads, as he has for four games. Impact ≤0.5 pt, no change to the pick. **If Bailey is active:** +0.25 NYJ. **If Powers-Johnson is out:** +0.25 NYJ. **If Parham is out:** -0.25 NYJ (Jets OL already down Mitchell; 8.7% sack rate).

## Market

- AN open (Sun 10/25 5:00 PM PT): NYJ -1.5 (-104), total 44.5, ML LV -103 / NYJ -118 [packet market.an_opener]. Saturday BKR: NYJ -1.5 -108, total 45.5. Opener→current: spread unchanged at -1.5 (it dipped to -1 Friday and came back); total +1.
- SuperContest locked NYJ -1.5 [data/supercontest/week-08-lines.json, 10/29], so there is now **zero gap** to BKR (it was 0.5 Friday).
- Splits: see Changes #4. BetMGM (Fri) showed 66% of money on Jets -1.5 [news_notes johnewing 10/30], so the books still disagree on where the public sits.

## Quantitative

- Power: SRS LV -2.42 / NYJ -1.90; Pythag .456 / .447. On a neutral field they are even, so home field puts the fair line at NYJ -1.5 to -2 [packet power_ratings].
- EPA/FTN (from the dossiers, unchanged since Friday): LV defense EPA/play +0.061 (#24), FTN def DVOA 12.7%; NYJ defense -0.006 (#14). Caveat: NYJ's schedule to date ranks 4th easiest [news_notes SharpFootball 10/27].
- Prediction-market win totals: LV 7.42 / NYJ 5.9 (context only) [packet prediction_markets].
- Secondary matchups are tier "watch" both ways (Bowers te_middle; G. Wilson alpha_x). Stale coach names in those notes were ignored.
- Weather: 15.3 °C, 0% precipitation, 6 km/h wind, materiality none [packet weather].

Simulator (scripts/intel/margin-simulator.mjs; selftest all PASS):

| Run | home_line | total | margin_adj | NYJ cover | push | NYJ win | tie | Over |
|---|---|---|---|---|---|---|---|---|
| BKR / contest baseline | -1.5 | 45.5 | 0 | 50.0% | 0 | 53.6% | 2.4% | 50.0% |
| BKR / contest adjusted | -1.5 | 45.5 | +0.25 | **50.7%** | 0 | 54.3% | 2.4% | 50.0% |
| Sensitivity | -1.5 | 45.5 | +0.5 | 51.3% | 0 | 55.0% | 2.4% | 50.0% |

Adjustment +0.25 home (fair -1.75 vs the -1.5 market). The reasons carry over from Friday: Koerner's projection of NYJ -2, the EPA/DVOA defensive gap, LV's 4-week defensive collapse, and LV's body-clock trip east (2-14 SU in its last 16 Eastern-time games). Offsetting them is NYJ's depleted edge rush. Total adjustment: 0. Break-even at -108 is 51.9%, so **50.7% is short: PASS.** For the ML, NYJ needs 55.9% at -127; the sim gives 54.3%, or 55.5% if ties are split evenly. **PASS.**

## Expert / podcast / article agreement

- **NYJ:** Stuckey (AN, -1.5), Chad Millman (Sharp or Square, -1.5 "Brass Balls"; one opinion although he appears in both expert_picks_pull and YouTube), John Jastremski (-1.5 -110), Sean Koerner (ATS confidence #10/26, projection -2), lockandcash (Jets ML -120, Fri), BettingPros early (Jets ML -105, 10/26).
- **LV:** Brandon Anderson (AN, +1.5), Zachary Cohen (VSiN, ML +105), PFT (24-17 LV), **Travis Pulver (BettingPros, ML +102, Sat)**; teaser-only: Tuley, **Youmans**, **Lock & Cash** (+7.5).
- Repricing: the NYJ -1.5 calls are now exactly at the market (no gain vs publish). The LV ML calls (+102/+105) now get +112, a better price.
- Total: BettingPros under 44.5 (the market is now 45.5, a point better for the under); PFT's 24-17 implies 41. No over voices.
- AN primer trends conflict. Against NYJ: 3-12-1 ATS after games decided by ≤3, 0-2 in the second game of a homestand under Glenn, 4-17-3 in first halves. Against LV: Cousins 0-6 ATS with referee Hussey, 2-14 SU in the East. The Bet Labs systems favor LV.

## Counter-case

- **Against the NYJ lean:** LV is 5-2 ATS and has outscored its implied totals by 33 points this season [Hribar]. The Jets are 1-3 as favorites under Glenn and allow an 8.7% sack rate. With Ossai, Sweat and Bailey out, Cousins gets cleaner pockets. Bet Labs systems, Anderson and now Pulver are on LV, and the +112 ML is a live dog price for a team the prediction markets rate 1.5 wins better.
- **Against passing the total:** the over case is LV games averaging 54.3 total points and LV allowing 3.25 pts/drive. The under case is NYJ's slow pace (58.6 plays/gm), 45% red-zone TD rate (31st) and Geno's 16-6 record to the 1H under.

## Ambiguity / missing data

- missing_inputs[] is empty. Projected starters are thin (LV: Jeanty only) and there is no Andy-confirmed QB note.
- AN primer `total_open` reads 41.5 against the AN opener's 44.5; the opener file is treated as the baseline.
- The books disagree on public money (AN: LV-heavy; BetMGM Fri: 66% of money on NYJ -1.5).
- The weather file is Friday's forecast (01:02Z); it is not material.
- No calibrated model exists for the Raiders +7.5 teaser legs, so no probability is given for them.

## Pre-kickoff delta checklist

- NYJ -1 at -110 or better, or pk: **tier-C NYJ**. NYJ -2 or worse: hard pass. LV +2.5 or better: re-check LV (needs fair to stay ≤ -1.75; sim ~52%+).
- NYJ ML -120 or better: tier-C ML. LV ML +125 or better: re-check the dog (fair LV ≈ +122).
- Total 47+: under tier C. 44 or lower: over tier C.
- Inactives ~8:30 AM PT: Hall out (no change); Bailey active (+0.25 NYJ); Powers-Johnson out (+0.25 NYJ); Parham out (-0.25 NYJ).

## Gate notes

1. missing_inputs: none.
2. roster_vet: PASS, 0.3 h old.
3. Kickoff not passed; forward picks valid.
4. Teams and roles come from the packet plus raiders.com (official, 10/30). Availability feed rows are tagged needs_human_review, and the official report overrides them (for example, the feed shows Bowers as UNKNOWN; officially he carries no designation).
5. QBs are stable; no QB is on either report.
6. One web check made: raiders.com combined Week 8 report (no Saturday update).
7. Stale coach names in secondary_matchups were ignored. HC is Klint Kubiak per an_primer.
