# NE @ MIA — Week 8 game synthesis, pass `props`

- As of: Fri 2026-10-30 ~11:40 PM PT (2026-10-31 06:40 UTC)
- Kickoff: Sun 11/1 1:25 PM PT (2026-11-01 21:25 UTC), Hard Rock Stadium (outdoor). Inactives about **11:55 AM PT Sunday**.
- Packet built 2026-10-31T06:09:18Z (`scratch/w08-game-synthesis-queue-props.json`) · roster_vet **PASS** (8.5 h) · missing_inputs: BetOnline player-prop board thin (22 rows, no player props)
- Prop prices: **BKR per-game board** `data/generated/props/bookmaker-live-2026-10-31-patriots-at-dolphins.json`, capturedAt **2026-10-31T01:52:20Z** (Fri 6:52 PM PT). DraftKings Predictions (10/29 03:20Z) is reference only.

## Recommendation box

| # | Player (team) | Market | Pick | Price | Book / capturedAt | Projection / basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|
| 1 | Ollie Gordon II (MIA) | Rush yds | **Over 61.5** | -115 | BKR 01:52Z | median about 66. Totals of 100, 88 and 103 in his last 3 games; 25 carries in W7 | **B** | y |
| 2 | Malik Willis (MIA) | Completions | **Under 16.5** | -106 | BKR 01:52Z | median about 15. 15/14/20/9/15/14 this season, so the under hit in 5 of 6 | **B** | y |
| 3 | Malik Willis (MIA) | Rush yds | **Over 33.5** | -108 | BKR 01:52Z | median about 38. 39/6/56/11/74/37, over in 4 of 6 | **B** | y |
| 4 | Drake Maye (NE) | Rush yds | **Over 23.5** | -102 | BKR 01:52Z | median about 26. 47/17/18/54/25/24/26, over in 5 of 7 | C | y |
| 5 | Hunter Henry (NE) | Rec yds | **Over 44.5** | -106 | BKR 01:52Z | median about 47. 62/44/48/71 over his last 4 games | C (B if A.J. Brown is OUT) | y |
| 6 | Ollie Gordon II (MIA) | Carries | Over 15.5 (alternative to #1, do not stack) | +105 | BKR 01:52Z | 18 and 25 carries in his last 2 games | C | n (same player as #1) |
| — | PASS | Maye pass yds 233.5 / pass TD o1.5 -129; Malik Washington rec/yds; Dulcich; A.J. Brown yds (no BKR row) | — | — | — | conflicted, or no captured row | PASS | — |

**7e Anytime-TD candidates (BKR atd_1_plus, 01:52Z):** 1) **Ollie Gordon II +120** (B: a rushing TD in each of his last 4 games; DKP reference +133). 2) **Malik Willis +219** (C+: a rushing TD in 3 of 6 starts; DKP +223). 3) Rhamondre Stevenson -145 (C anchor: 3 TDs in 7 games, but the price is short; DKP -122. Upgrade if Henderson is out). 4) Hunter Henry +130 (C: TDs in 2 of his last 3 games and MIA is weak against TEs, but BKR is well shorter than DKP's +203). 5) DeMario Douglas +185 (C: 3 TDs in W5-W6; gets a boost if A.J. Brown is out).
**8a First-TD candidates (BKR first_td):** 1) **Ollie Gordon II +691** (my fair price is about +525, so this is value). 2) Rhamondre Stevenson +427 (the likeliest single scorer, but short; my fair price is about +550). 3) Malik Willis +910. 4) DeMario Douglas +868.

## Game script (aligned with the sides pass)
The sides synthesis has **NE by 4-10, UNDER 43.5 (B)** with about 20 mph sustained wind and an 80% chance of rain. MIA is a slow, run-first team (56.5 plays/game) and NE leads by one score or two [Source: reports/intel/games/2026-w08-game-NE_at_MIA-sides.md; packet weather, Open-Meteo]. That script points to MIA run volume and Willis scrambles, not Willis passing volume. MIA has 7 rushing TDs against 4 passing TDs and runs on 44% of plays. Its pass protection allows a 9.6% sack rate, and OT Kadyn Proctor is OUT. NE generates a 32% pressure rate and a 6.7% sack rate [Source: MIA/NE dossiers, FTN through W6/W7; availability 10/30]. For NE, the wind caps Maye's downfield volume (aDOT 9.0), which favours short TE work and QB scrambles over deep yardage. MIA's pass defense is very poor (EPA/DB 0.315, DVOA +30.1%, opponents' completion rate 81.8%), which is why I pass on Maye's pass yards rather than taking the under.

## QB / availability
- QBs (Andy-confirmed): **Drake Maye (NE)**, **Malik Willis (MIA)** [Source: qb_operator_notes].
- **A.J. Brown (NE) is Q** (knee and ankle). He missed practice Thursday and Friday and is a game-time decision. If he is **OUT**, Henry (#5) moves to B, and Douglas and Henry gain ATD equity. If he is **IN**, the picks stand. BKR has no yardage row for Brown, so Sal Vetri's o59.5 cannot be priced here.
- **TreVeyon Henderson (NE) is Q** (illness). If he is OUT, Stevenson's ATD and first-TD chances improve. BKR has no NE RB rushing-yard rows.
- MIA: Malik Washington and Greg Dulcich have no designation. CB JuJu Brents and CB Reese Taylor are Q [Source: availability 10/30 ESPN/FantasyPros].
- **De'Von Achane (MIA)** has no BKR prop row and no usage since W3 [Source: player-usage-trends-2026.json]. His status was not verified. If he is active, that is a headwind for Gordon's volume.
- One web search for Friday's final injury reports found no usable 2026 Week 8 page (the CBS piece could not be fetched). Designations come from the packet's feed.

## Market
- Game: BKR NE -7 +101 / MIA +7 -117, total 43.5, team totals NE 25.5 / MIA 17.5 (board 01:52Z, same as the paste). AN open: NE -7.5 / 44.5. Splits: NE 75/76%, over 77/77%, so the money moved against the public [Source: packet market, splits].
- Prop repricing: Anderson's Gordon o58.5 (10/30) is now **61.5** (+3). Welsh's Maye rush o21.5 -114 is now **23.5** (+2). Welsh's Willis completions u16.5 -102 is now **u16.5 -106** (same number). Welsh's Henry ATD +160 is now **+130** at BKR. Cohen's Maye o1.5 pass TD -115 (DK/FD) is **-129** at BKR.

## Quantitative
- Gordon (FTN through W6): 5.0 YPC, rush DVOA +30.0%, 17% explosive runs. Since W3 his carries went 17/9/18/25, and W7 usage was 26.5 [nflverse weekly; usage trends]. NE run defense: DVOA -6.8% and 95 yards/game allowed, which is middling. That conflicts with Anderson's "27th-ranked" description, so I project about 66, not 75+.
- Willis: 55.7% completions, CPOE -2.6, sack rate 8.6%, and 28.6% of pressures end in sacks. He has averaged 4.0 Y/carry on scrambles and designed runs [FTN through W6; nflverse W7].
- Maye: 4-8 carries every game. His rushing yards over the last 4 games are 54/25/24/26 (the last 3 cleared 23.5 by only 0.5 to 2.5 yards).
- Henry: 13.3% target share, 75% separation rate, 1.45 YPRR, 7 of 7 catches for 71 yards in W7. MIA allows 4th-most TDs to TEs [Prop Guru; Welsh].
- Simulator: not applicable to props, and no calibrated joint model exists. The game context is from the sides run: Under 56.0% at 43.5, MIA cover 51.5% [sides JSON sim_runs].

## Expert agreement / disagreement
- **For:** Brandon Anderson (AN), Gordon o58.5. Chris Welsh (BettingPros), Willis u16.5 completions, Maye rush o21.5 (5-star) and Henry ATD. Cody Brown, Maye rush 15+ alt and Maye 175+ pass alt. The Prop Guru (X), Henry ATD. Sal Vetri, A.J. Brown o59.5 rec yds (not priceable at BKR). Zachary Cohen (VSiN), Maye o1.5 pass TDs.
- **Against / tension:** Cody Brown's Malik Washington 25+ rec yds leg and the Vrabel 12-3 AFC East over trend argue for more passing volume than I project. PFT's 31-20 projection (total 51) implies a Maye ceiling game. I pass on Maye's yards and TDs for that reason.

## Counter-case
- **Gordon over / carries:** if NE leads by 14+ before halftime, MIA abandons the run, Gordon finishes around 12 carries for 45 yards, and Willis's completions go **over**. Picks #1-3 share that risk. The SGP is effectively a bet that **MIA stays within one score**, which is the sides read.
- **Willis completions under:** trailing game scripts produce 27-36 attempts (W1, W3), which can clear 17.
- **Willis rush over:** NE spies him or the wet field slows scrambles. In two of his games he had only 2 carries.
- **Maye rush over:** with a lead, NE runs the clock with RBs and kneels, and Maye's last 3 totals cleared by 2.5 yards or less.
- **Henry yds:** wind lowers NE's pass rate. If Brown plays fully, Henry's targets fall back to about 5.

## Ambiguity / missing data
- BetOnline Sunday props were not posted (re-run Saturday about 2 PM PT). BKR has no rows for A.J. Brown yards, NE RB rushing yards, Doubs or Hollins.
- Achane's status was not verified. FTN for MIA is one week stale. Friday's official reports were not confirmed by web search.
- Projections are hand-built medians from nflverse W1-W7 and FTN, not model output.

## Pre-kickoff delta checklist
1. **A.J. Brown inactive** → Henry yds to B, and push Henry/Douglas up the ATD list. If he is active, no change.
2. **Henderson OUT** → Stevenson ATD to B-, first-TD +427 becomes fair.
3. **Achane active** → cut Gordon to C, and pass on rush yds above 63.5.
4. **Wind under 12 mph Sunday morning** → Willis completions to C. Re-check Maye pass yds (it is a PASS now).
5. **Price lines:** Gordon is playable to 63.5 -120 and a pass at 64.5. Willis completions u16.5 to -125, pass at u15.5. Willis rush yds to 35.5, pass at 36.5. Maye rush yds to 24.5, pass at 25.5. Henry yds to 46.5.
6. **Spread moves to NE -8.5 or more** (a blowout signal) → downgrade #1-#3 one tier each.

## Gate notes
- missing_inputs: BetOnline player-prop board thin. All picks use BKR only, and no market depended on BOL, so nothing is capped.
- roster_vet PASS (8.5 h). Teams and roles come from qb_operator_notes, the packet availability feed, nflverse 2026 weekly and FTN tables. Nothing was taken from memory.
- Kickoff has not passed, so these are forward picks. The roster gate was not rerun.
- No QB INT legs were used (BKR SGP rule). No tickets or stakes.
- The web search for Friday's final injury reports returned no fetchable 2026 page.
