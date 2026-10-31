# PHI @ WAS — Week 8 game synthesis, pass `props`

As-of: Fri 2026-10-30 ~11:40 PM PT (2026-10-31T06:40Z) · Kickoff: Sun 11/1 5:20 PM PT (SNF, outdoors) · Inactives ~3:50 PM PT Sun · Packet built 2026-10-31T06:09Z · roster_vet: PASS (8.5h) · Book: BKR per-game board, capturedAt 2026-10-31T01:52:30Z [Source: prop_boards.bookmaker]

## Recommendation box

| Player | Market | Line | Price | Book | capturedAt | Basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|
| Chig Okonkwo (WAS TE) | Receptions OVER | 3.5 | +116 | BKR | 01:52Z | 4 & 7 rec in Daniels' last 2 starts; PHI te_middle/seam boosts; McLaurin IR (5.6 tgt/g vacated); Bates Q | **B** | y |
| Makai Lemon (PHI WR) | Receptions OVER | 4.5 | -122 | BKR | 01:52Z | Top WR again (Smith, Wicks OUT); W7 7/8; slot vs WAS passive zone (underneath boost) | **B** | y |
| Tanner McKee (PHI QB) | Completions OVER | 20.5 | +103 | BKR | 01:52Z | 26 & 23 comp in 2 starts (45/35 att); 6-pt dog = volume; short aDOT targets | **B** | y |
| Rachaad White (WAS RB) | Rush yds UNDER | 44.5 | -107 | BKR | 01:52Z | Season high 43; 4.0 YPC; W6 without Croskey-Merritt: 7-27 | C | y |
| Rachaad White (WAS RB) | Receptions OVER | 2.5 | +114 | BKR | 01:52Z | 14/15 catch rate; W6 lead-back role 4 rec; Bogman o2.5 (+118) | C | y |
| Stefon Diggs (WAS WR) | Rec yds OVER | 42.5 | -108 | BKR | 01:52Z | Highest opp score (4.8) vs PHI medium-vuln coverage; McLaurin IR | C | y |
| Jayden Daniels (WAS QB) | Rush yds OVER | 36.5 | -109 | BKR | 01:52Z | 31/69/103/10 in 4 starts; PHI LB Jihaad Campbell OUT; full practice all week | C | n (elbow risk) |
| Saquon Barkley (PHI RB) | Carries UNDER | 14.5 | -105 | BKR | 01:52Z | Season max 15; DNP-DNP-Ltd (hamstring/back); trailing script | C | y |

**PASS:** Antonio Williams o36.5 rec yds (-122). Erickson's lead was at 32.5 and Bogman's at 33.5, so the number has moved 3-4 yds and the edge is gone. Barkley rush yds, McKee pass yds and Daniels pass yds are coin flips. Lemon rec yds 43.5 conflicts with his 0.59 YPRR. No BKR QB INT legs.

**7e Anytime-TD candidates (BKR 1+ TD, 01:52Z):** Rachaad White +110 · Saquon Barkley +110 · Stefon Diggs +175 · Dallas Goedert +195 · Jayden Daniels +200 · Chig Okonkwo +274 · Darius Cooper +302. Longshots: Makai Lemon +294; Jeremy McNichols +333 (status flag below).

**8a First-TD candidates (BKR, 01:52Z):** Rachaad White +562 · Saquon Barkley +597 · Stefon Diggs +773 · Jayden Daniels +798 · Dallas Goedert +868 · Chig Okonkwo +910. Lean WAS-side: Quinn teams are 20-9 1H ATS off extended prep, and PHI has not won a 1st quarter this season [Source: an_primer, Abrams 2026-10-30].

## Game script (consistent with the sides pass)

Sides pass: WAS by ~5 (fair -5.0), Over 40.5 lean (fair 42), WAS SU [Source: reports/intel/games/2026-w08-game-PHI_at_WAS-sides.md]. The sim re-run matches it: `--home-line -6 --total 40.5 --margin-adj -1.0 --total-adj 1.5` gives mean margin WAS +5.8, mean total 42.0 (selftest PASS). BKR team totals: WAS 23.5, PHI 16.5.

What that means for players:
- **WAS, off a 13-day bye**, should move the ball through Diggs, Okonkwo and the backs underneath PHI's match-zone, two-high shell. That shell is missing S Andre' Sam, S Tucker Large and CB Jonathan Jones and is tagged slot, seam, TE-middle and underneath boosts [Source: secondary_matchups]. PHI allows EPA/DB 0.159 and DVOA 15.9% through W7 [Source: PHI dossier FTN].
- **WAS's run game is inefficient**: EPA/att -0.151, DVOA -17.7%, 37.6% success [Source: WAS dossier FTN]. That supports White unders on the ground and Daniels scrambles as the explosive rushing.
- **PHI trails and throws short.** McKee has a depleted WR room. Lemon (slot, aDOT 5.2) and Goedert soak volume against a passive zone tagged `underneath_volume_boost` [Source: secondary_matchups]. That supports completions and receptions overs and fades yardage.
- **Barkley's carries are capped** by game script and by health.

## QB / availability

- PHI: Hurts IR, so **McKee starts**. Smith, Wicks, LB J. Campbell, Covey and CB J. Jones are OUT; CB Bennett is Q [Source: qb_operator_notes]. Barkley has no designation after DNP Wed/Thu and limited Fri [Source: news_notes ESPN 2026-10-30 20:24Z]. Dameon Pierce, who had W5-W7 goal-line work (6 carries inside the 10), is on IR [Source: news_notes Rotowire 2026-10-28; nflverse pbp]. Jaydon Blue was promoted from the practice squad.
- WAS: **Daniels has no designation** (elbow, full practice). McLaurin IR; Kinlaw OUT; Payne Q but likely IR (ESPN); Bates, Burks and Newton Q [Source: qb_operator_notes; news_notes ESPN 2026-10-31 00:01Z].
- **RB ambiguity (WAS):**
  - Jacory Croskey-Merritt (W1-W5 lead back, 67 att) missed W6 with a groin injury. He has **no BKR prop rows**. A commanders.com teaser says he is on IR, while the ESPN roster file lists him active. BKR prices White as the lead back (12.5 carries).
  - McNichols is in ESPN's injuredReserveOrOut group but has BKR rows and does not appear on the 10/28 team practice report.
  - **If Croskey-Merritt is active**, White's unders get stronger and his receptions over weakens. **If McNichols is out**, White's carries rise, so drop the rush-yds under to PASS.
- If Barkley is inactive, void his carries under; Blue and Bigsby become the RBs, and Barkley's ATD and FTD candidates drop out.

## Market

- Prop prices are all BKR at 01:52Z. BetOnline Sunday props aren't posted yet (missing_inputs). DK Predictions is reference only: ATD Barkley +122, White +178, Diggs +223, Goedert +233 (10/29 03:20Z). BKR is shorter on White and Barkley.
- Expert leads repriced:
  - White receptions o2.5: Bogman +118 → BKR +114. Holds.
  - White rec yds: Welsh o11.5 → BKR 13.5 -115. Moved 2 yds, so pass.
  - Goedert ATD: Welsh +220 → +195.
  - McNichols ATD: Erickson +430 → +333.
  - A. Williams: 32.5/33.5 → 36.5. Pass.
- Splits: 88% of Over money but the total ticked down, a mild reverse move [Source: splits AN 2026-10-31T02:06Z].

## Quantitative (nflverse pbp W1-W7, this report's own pull)

- McKee: W6 26/45, 215 yds · W7 23/35, 211 yds, 1 INT.
- Lemon targets by week: 4, 1, 4, 6, 7, 6, 8; W7 7 rec, 67 yds, 1 TD. Season YPRR 0.59 and TPRR 0.13 [FTN]. Volume yes, efficiency no.
- Goedert, last 3 games: 6, 6, 5 rec (38, 61, 48 yds). BKR o4.5 is -134, too juiced for the card.
- Okonkwo: W5 4 rec, 60 yds; W6 7 rec, 69 yds (both Daniels starts). 15 catches on 20 targets for the season.
- White: carries 7, 7, 8, 7, 7; rush yds 22, 43, 35, 18, 27. Targets 2, 6, 1, 1, 5 with 14 catches on 15. 4 red-zone touches inside the 10 (2 rush, 2 targets).
- Diggs, rec yds by week: 55, 47, 33, 35, 44 (mean 43). 4 TD; 3 targets inside the 10.
- Daniels, rush yds by start: 31, 69, 103, 10.
- Barkley carries: 15, 4, 15, 2, 7 (the 2 and 7 were injury-shortened).
- Darius Cooper: 4 TD on 18 targets, 3 targets inside the 10.

These are projections and recent games only. **No prop carries a model probability**, because there is no calibrated player model.

## Expert agreement / disagreement (this matchup, W8)

- **For:**
  - Bogman (BettingPros): White o2.5 rec.
  - Welsh: White rec yds over, Goedert ATD.
  - Erickson: A. Williams over, McNichols ATD.
  - Bogman: A. Williams o33.5.
  - Cody Brown (X image): Diggs 30+ alt, an alt line and not comparable.
  - PFF: A. Williams as a flex.
- **Against / caution:** no expert fades the props above. Quinn (via Rotowire 10/26) said Diggs' workload "isn't expected to change much" without McLaurin, which caps the Diggs upside and is why that pick is tier C.
- Welsh's PHI ML pick was conditional on Smith playing, so it is dropped.

## Counter-cases

- **Okonkwo o3.5:** Bates' return or a run-heavy lead script cuts TE routes. He had 2 catches in W1 and W4.
- **Lemon o4.5:** a 7.1% drop rate and poor separation (32%). PHI could feature Goedert, Brown and Cooper instead, and McKee may be sacked into checkdowns to the RBs.
- **McKee o20.5 cmp:** if Barkley is effective and the game stays close, attempts fall to ~30. WAS has a 1.4% INT-worthy rate and is a takeaway defense (+6 TO margin), so drives can end early.
- **White u44.5 rush:** if Croskey-Merritt and McNichols are both out and WAS leads big, White could see 15+ carries in a clock-kill script. PHI allowed 155 yds to Javonte Williams in W7.
- **White o2.5 rec:** a WAS lead lowers checkdowns, and Ekeler is a passing-down threat.
- **Diggs o42.5:** WAS spreads targets (Williams, Okonkwo, Burks). Diggs posted 33 and 35 in two games, and his YDOE is -34.8.
- **Daniels o36.5 rush:** WAS may limit designed runs because of the elbow, and he ran 4 times for 10 yds in W6. Kneel-downs while leading cost yards.
- **Barkley u14.5 car:** with Pierce on IR, Barkley gets the goal-line and closing carries. A close game could produce 16-18 carries.

## Ambiguity / missing data

- BetOnline player props are not posted (missing_inputs). Only BKR rows are executable.
- Croskey-Merritt status conflicts (ESPN active, team-site teaser says IR, no BKR rows). McNichols status conflicts (ESPN IR/out group vs BKR rows).
- The Eagles' Friday practice/designation page was not retrieved. Designations come from qb_operator_notes (Andy-confirmed) and ESPN/Rotowire news.
- "WAS allowed 8 TDs to TEs in 6 games" (Welsh) is unverified in the packet. WAS has allowed 15 pass TD in 6 games [FTN].
- Hollywood (Marquise) Brown is on the PHI roster per ESPN. He had 5 targets in W7 only; no pick.

## Pre-kickoff delta checklist

1. Inactives (~3:50 PM PT):
   - If Croskey-Merritt is active, keep the White rush under (upgrade to B) and cut White o2.5 rec to PASS.
   - If McNichols is out, cut the White rush under to PASS.
   - If Barkley is out, void the carries under and the Barkley ATD/FTD.
   - If Bates is active, Okonkwo drops to C.
2. Price stops:
   - Okonkwo o3.5 playable to -120; pass at o4.5.
   - Lemon o4.5 playable to -130; pass at 5.5.
   - McKee o20.5 cmp playable to -115; pass at 21.5.
   - White u44.5 playable to 41.5.
   - Diggs to 44.5.
   - Daniels rush to 38.5.
   - Barkley u14.5 to -120; pass at 13.5.
3. Re-run BetOnline Saturday ~2 PM PT. Line-shop the same legs there.
4. A Daniels downgrade voids all WAS overs.

## Gate notes

- roster_vet PASS (8.5h). missing_inputs: BetOnline player-prop board thin (32 rows, no player props), so props are BKR-only; no tier cap needed because the picks don't depend on BetOnline.
- Kickoff not passed. Player teams and status come from qb_operator_notes first, then ESPN roster/news.
- Web search for final injury reports:
  - The commanders.com W8 report (10/28 page; Fri column blank) lists Bates, Diggs (Thu full), Kinlaw, Burks, Omenihu, Newton, Daniels (full), Allegretti.
  - An atozsports "final injury report" result was a 2023 article and was discarded.
  - A fantasyfootballers item confirms Croskey-Merritt was ruled out for W6 (groin).
- Simulator selftest PASS. Used for the game-script mean only; no prop probabilities.
- Did not rerun the roster gate; no git; no writes beyond the three outputs.
