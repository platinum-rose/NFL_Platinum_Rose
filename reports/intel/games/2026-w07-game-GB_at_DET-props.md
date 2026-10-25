# GB @ DET — Week 7 game synthesis, pass `props`

As-of: Sat 2026-10-24 14:40 PT · Kickoff: Sun 10/25 13:25 PT (Ford Field, fixed dome) → **card window 7b (afternoon)** · Packet built 2026-10-24T21:33:58Z · roster_vet: PASS (roster age 13.3h; 1 INFO, 9 UNVERIFIED) · Boards: BKR 2026-10-24T20:26:43Z, BetOnline (BEO) 2026-10-24T21:15:44Z, DK Predictions 2026-10-23T19:10Z (reference only)

## Recommendation box (props; no stakes)

| # | Player | Market | Line | Price | Book | capturedAt | Basis | Tier | parlay_leg_ok | card_slot |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Jordan Love | Pass TD Over | 1.5 | -177 (BEO -175) | BKR / BEO | 20:26Z / 21:15Z | DET pass D allowed 14 pass TD in 5 g (2.8/g), DVOA 18.7%, 62% open-target rate; Kerby Joseph out, Branch limited; GB implied ~25 pts | **B** | Y | 7b (BEO leg) + BKR SGP |
| 2 | Amon-Ra St. Brown | Receptions Over (alt) | 6.5 | -202 | BKR | 20:26Z | Expected winner's target leader (11 targets in last game); main line 7.5 is -101 | **B** | Y (heavy leg, <-200) | BKR SGP / 7d |
| 3 | Christian Watson | Rec Yds Over (alt) | 67.5 | -213 | BKR | 20:26Z | 538 yds in 6 g (89.7/g, 18.6 ypc); top GB target vs a DET deep-safety hole; experts on 80+ | **B** | Y (heavy leg, <-200) | BKR SGP |
| 4 | Jordan Love | Pass Yds Over (alt) | 263.5 | -178 | BKR | 20:26Z | Love 281 yds/g; DET allows ~321 pass yds/g; GB likely trailing | **B-** | Y (correlated with #1/#3; same-game only) | BKR SGP |
| 5 | Jahmyr Gibbs | Anytime TD | 0.5 | -325 | BEO (BKR -409 breaks the -350 barrier) | 21:15Z | DET 8 rush TD in 5 g, RZ TD 77%; DK ref 76% | **B** | Y (heavy leg) | 7e anchor / 7d |
| 6 | Tucker Kraft | Anytime TD | 0.5 | +170 (BKR +140) | BEO | 21:15Z | DET allowed 9 TE TDs in 5 g (Anderson); Branch limited reopens TE-middle; DK ref 35% | **B** | Y | 7e |
| 7 | Jared Goff | Pass TD Over (alt) | 1.5 | -310 | BKR | 20:26Z | 12 TD / 0 INT in 5 g, home off bye; BUT GB pass D DVOA -18.3%, 7 pass TD allowed in 6 g | **C** | Y, heavy (flag) | 7d only if needed |
| 8 | Josh Jacobs | Carries Under | 13.5 | -118 | BKR | 20:26Z | Season debut with no football since May ("missed exposure", LaFleur); Lloyd/Strong still in the room | **C** | N (inactive = LOST) | single, after inactives |

**Anytime-TD candidates (7e):** Gibbs -325 BEO (anchor), St. Brown -130 BEO / -161 BKR, **Kraft +170 BEO**, Watson +135 BEO / +120 BKR, Golden +160 BEO / +150 BKR, LaPorta +160 BEO, Jameson Williams +195 BEO, longshot Mark Redman +722 BKR. Max 2 per game on BEO: **Kraft + Gibbs** (or Kraft + St. Brown to keep the price up).

**First-TD candidates (8a):** **Gibbs +303 BKR** (DK ref 24% ≈ +317, so BKR is ~fair), St. Brown +616, Watson +868, Kraft +910, Golden +873. **8b 2+ TD:** Gibbs +125 BKR (note: DK ref 37% ≈ +170, so BKR is short; shop).

**BEO 7b two-leg allotment for this game:** Love o1.5 pass TD -175 + Kraft ATD +170 (or Gibbs ATD -325 if the stack wants chalk; flag it as a <-200 leg).
**BKR SGP (same-game, no INT legs):** Love o1.5 TD + Love o263.5 yds + Watson o67.5 yds + St. Brown o6.5 rec — shootout script; three legs are <-200, flag.

## Game script
BKR moved off 3 since the sides pass: **DET -3.5 -112 / GB +3.5 -103, total 53.5 -108/-108, ML DET -182** (20:26Z), BEO the same -3.5 / 53.5 (21:15Z) [Source: prop_boards.bookmaker / betonline game_lines]. Implied DET ~28.5, GB ~25. The sides report's script stands: DET's #3 offense (EPA/play 0.190) off a bye vs a GB front missing Parsons, Hargrave, Ford and now Zaire Franklin; GB answers vertically against DET's #31 defense with Joseph out and Branch on a limited comeback count [Source: reports/intel/games/2026-w07-game-GB_at_DET-sides.md; DET.md/GB.md built 2026-10-22T22:58Z]. Sim at -3.5 / 53.5 with the sides view (-0.5 / +1.0): DET win 62.8%, Over 53.0%, median total 54 [scripts/intel/margin-simulator.mjs, calib sha 0ea35592; selftest PASS]. Props carry no model probability.

## QB / availability
- GB: Love (back) full Thursday, no designation; Watson, Golden, Savion Williams off the report; **Franklin OUT**; Melton, Banks, St-Juste, Riley questionable [packet availability.GB, ESPN API 2026-10-23/24; PFT 2026-10-23T21:08Z]. **Jacobs** is cleared (off the Commissioner Exempt List) and "on track," but LaFleur flagged missed football exposure; workload unknown → no Jacobs overs, Jacobs ATD +110 is a pass [Newsweek; Rotowire 2026-10-23T16:05Z].
- DET: Goff healthy; Branch (Achilles, PUP return) questionable with a limited snap count; Joseph OUT; Ya-Sin Q [availability.DET 2026-10-24T00:08Z; sides report].
- **If Branch is inactive:** Kraft ATD and Golden become stronger (slot/TE-middle tags). **If Love has any setback:** void all GB legs. Inactives: **Sun 11:55 PT**.

## Market notes
- Love pass TD: BKR -177 vs BEO -175, same. Alt -200 at 1.5 on the BKR ladder is a duplicate row; use -177.
- Watson rec yds: BKR 77.5 -114 / BEO 74.5 -115 (median lines — Andy avoids). Anderson's +370 "BOGO" 80+ pair isn't on our boards; the BKR alt rows are Watson 87.5 +115 and Golden 83.5 +116. If Andy wants the expert play, it's a BKR 2-leg same-game pairing of those alts, a longshot single, not a stack leg.
- Redman ATD: experts priced **+1850**; BKR now **+722** (DK ref 11% ≈ +809). The value is gone; keep him as an ATD/8a lottery only.
- Kraft receptions o4.5 -119 BKR (Shepardson, Sharp Football) — not used: GB is not the expected winner (Andy's receptions rule). o3.5 is -483 (past the barrier).
- **No tackles+assists markets on either board** for this game, so the season's best category isn't available here.

## Quantitative support
- DET defense (FTN through W5): 321 pass yds/g allowed, 14 pass TD / 3 INT, EPA/DB 0.235, blitz 29.6%. Rush D: EPA/att -0.097, 6 rush TD.
- GB defense (FTN through W6): 7 pass TD / 9 INT allowed, INTW 5.1%, EPA/DB -0.075 → **the reason Goff over 1.5 TD is only C** and why no Goff yardage over is listed.
- GB offense: explosive-pass 17.8%, aDOT 8.8, run EPA/att -0.277 (supports Love pass volume and the Jacobs under).
- Secondary matchups: Watson opportunity 3.6 (outside/deep/post-cross tags); Golden/Savion Williams slot 2.4; Kraft TE-middle [packet secondary_matchups; stale coach names ignored].

## Expert agreement / disagreement
- For GB passing: Brandon Anderson (Watson & Golden 80+, Redman ATD; YouTube + Action Network = one opinion), Sal Bets (Watson o69.5), Matt Perrault and Andrew Erickson (Over).
- Against: Steve Makinen/VSiN Under 53.5 (at the current number), which cuts against every yardage/TD over here.

## Counter-case
- **Love TD / yards / Watson:** GB's offense has topped 23 once in six games, RZ TD rate 50%, Love CPOE -6.1%. A Jacobs-led ball-control plan plus DET's 8.1% sack rate can cap Love at one TD. Watson has an ankle tag from the week.
- **St. Brown 6.5 rec:** GB pass D is genuinely good (DVOA -18.3%), and a Gibbs-heavy script from a lead lowers DET's dropbacks.
- **Gibbs ATD / Kraft ATD:** TD props are binary; GB allowed only 9 rush TD in 6 g, and DET spreads TDs (LaPorta, J. Williams).
- **Jacobs under:** BKR is pricing a lead-back role (51.5 yds, 13.5 carries); if GB commits to him, he clears early.

## Ambiguity / missing data
- `missing_inputs[]` empty. No `qb_operator_notes`. DET FTN is through W5 (bye).
- Several BKR TD-board names (Jonnu Smith, Tyler Conklin, Tay Martin, Kaleb Johnson, Jacob Saylors, Josh Whyle) were not checked against rosters → not used.
- Final Friday DET designations only partly captured (Branch Q); the official injury pages were not fetchable; one SI hit was a prior-season page and was discarded.
- The 9 TE-TDs-allowed stat comes from one analyst (Anderson) and has not been checked independently.

## Pre-kickoff delta checklist
1. Inactives 11:55 PT: Jacobs inactive → drop #8. Branch out → upgrade Kraft ATD and add Golden ATD +160.
2. Love pass TD o1.5 shorter than -200 at both books → drop to C.
3. Total ≤52.5 or DET -4.5+ → trim GB yardage legs (#3, #4).
4. Gibbs ATD at BEO past -350 → remove from stacks (barrier).
5. Watson alt 67.5 shorter than -250 → swap to 77.5 only as a single.

## Gate notes
- Roster vet PASS (13.3h, 9 UNVERIFIED entries not named in packet); every player used is in the packet availability/board rows with current-week news.
- Kickoff ahead: forward picks.
- Andy rules applied: -350 barrier (BKR Gibbs ATD -409 rejected → BEO -325); <-200 legs flagged (#2, #3, #5, #7); no median -110/-120 yardage; no INT legs (no matchup fit: DET INTW 0.9%; Goff 0 INT); QB rushing passed (no fit).
- DK Predictions used only as a price reference.
