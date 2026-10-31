# NE @ MIA — Week 8 game synthesis, pass `sides`

- As of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31 06:25 UTC)
- Kickoff: Sun 11/1 1:25 PM PT (2026-11-01 21:25 UTC), Hard Rock Stadium (outdoor, grass). Inactives at about 11:55 AM PT Sunday.
- Packet built: 2026-10-31T06:09:16Z (queue `scratch/w08-game-synthesis-queue-sides.json`) · roster_vet: **PASS** (roster age 8.5 h) · missing_inputs: none

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS at MIA +7 -117** (lean MIA) | C lean / PASS at this price | NE -6.5 | 0.5 pt to MIA | MIA +7 at -110 or better, or any +7.5. Pass at +7 -115 or worse, or +6.5 |
| TOTAL | **UNDER 43.5 -111** | **B** | 41.5 | 2.0 pts | to 42.5 -115. Pass at 42 or lower |
| MONEYLINE / SU | PASS (NE -324 / MIA +273). SU winner **NE** | PASS | NE about 73% (fair about -270) | none: NE price is too short, MIA +273 is at fair | — |
| SuperContest | **MIA +7** (contest line NE -7) | C | NE -6.5 | 0.5 pt | candidate = yes, low-confidence slot |
| Pool | SU: **NE** · confidence **11/16** | — | — | — | drops to 9 if A.J. Brown is out and the wind holds |

[Source: market.bkr_current_line_text + data/generated/props/bookmaker-live-2026-10-31-patriots-at-dolphins.json, capturedAt 2026-10-31T01:52:20Z = Fri 6:52 PM PT. The prop-board game rows match the paste exactly, and nothing newer exists.]

## Game script
New England has 10 days of rest after its Thursday Week 7 loss in Chicago (24-30). Miami is on normal rest after its first win, 28-25 at the Jets [Source: news_notes PFT 10/26-10/28; dossiers]. The forecast is about 20 mph sustained wind (32 km/h, gusts 38 km/h), an 80% chance of rain and 27°C at kickoff [Source: packet weather, Open-Meteo, data/research-intel/review/2026-w08-weather-venue.json]. That hurts New England more, because its offense runs through the pass: EPA/dropback 0.228 and FTN pass DVOA +38.0%, against EPA/rush -0.173 and rush DVOA -16.3% [Source: NE dossier FTN through W7]. The likely script is NE moving the ball in the air early and building a one-score or two-score lead while wind and rain shorten its drives. Miami leans on the run (its rush offense is its best unit and NE's run defense is mediocre) and plays slowly: 56.5 plays/game and 29.5 seconds/play [Source: MIA dossier FTN tempo]. Many outcomes land NE by 4-10 with a total in the high 30s to low 40s.

## QB / availability
- QBs confirmed by Andy: **Drake Maye (NE)** and **Malik Willis (MIA)** [Source: qb_operator_notes, scratch/w08-qb-confirmations-1030.md].
- **NE WR A.J. Brown is Questionable** (knee and ankle). He missed practice Thursday and Friday and is a game-time decision [Source: qb_operator_notes; ESPN 10/30 17:57Z; Rotowire 10/30]. **If Brown is out**, NE loses a 27% target-share receiver (Sal Vetri's tweet) and the passing ceiling falls further in the wind. That supports the under and trims the NE margin by about 0.5 pt (already in the view). **If Brown is in**, he is likely limited, so the picks hold.
- NE RB TreVeyon Henderson is Q (illness), LB Christian Elliss is Q, and CB Carlton Davis III is Q [Source: availability ESPN injuries API 10/30].
- MIA: OT Kadyn Proctor is OUT, which hurts a pass protection that already allows a 9.6% sack rate. CB JuJu Brents and CB Reese Taylor are Q. WR Malik Washington and TE Greg Dulcich have no designation [Source: availability 10/30].
- The one web search for Friday's official reports returned only 2023 pages (patriots.com and atozsports Week 8 2023). These designations therefore come from the packet's 10/30 ESPN/Rotowire feed, which is flagged for misclassification bugs.

## Market
- **AN open**: NE -7.5 (-113 home), total 44.5 [Source: data/odds/actionnetwork-openers-2026-w08.json, open Sun 10/25 5:00 PM PT]. The AN primer lists the total open at 45 [Source: an_primer.game.total_open].
- **BKR now**: NE -7 +101 / MIA +7 -117, total 43.5 (o -105 / u -111), ML NE -324 / MIA +273, 1H NE -3.5 / 22, team totals NE 25.5 and MIA 17.5. AN consensus is 7 / 43 [Source: an_primer.game].
- Movement: the spread moved 0.5 pt toward MIA, and the juice now sits on MIA (+7 -117 is close to NE -6.75). The total fell 1-1.5 pts.
- **Splits** (AN, 10/31 02:06Z): NE spread 75% of bets / 76% of money, and the over 77% / 77%. No money-vs-bets gap of 10+ points, so there is no formal sharp flag. Both the side and the total moved **against** about 76% of the public, which is reverse line movement toward MIA and the under [Source: packet splits; an_primer.public].
- SuperContest NE -7 equals the BKR number, but the contest has no juice. MIA +7 there avoids the -117 that kills the BKR side.

## Quantitative
- Power: NE SRS +5.80 (#6), MIA -6.14 (#27). Net PPG +2.4 vs -9.8. Pythag .566 vs .247. Model rank #9 vs #30 [Source: team-power-ratings-2026.json]. Raw SRS implies about NE -10.5 at a neutral site and about -9 at MIA. NE's -7 turnover margin and MIA's 32nd-ranked strength of schedule (SharpFootball 10/27) argue for regressing that number toward the market.
- MIA defense is weak: EPA/play allowed 0.119 (#30), defense DVOA +13.2%, and opponents convert 55.3% [Source: MIA dossier]. MIA offense: EPA/play -0.035 (#21), CPOE -6.9.
- Secondary matchups: MIA two-high match zone is vulnerable to slot, seam and TE routes (DeMario Douglas, Hunter Henry), and S Ronnie Harrison Jr. is on IR [Source: secondary_matchups 2026-w08].
- **Simulator** (calibration 2018-2025, sha 0ea35592; self-tests all pass). Probabilities exclude pushes.

| Run | home-line / total | margin-adj / total-adj | MIA cover | push | Over / Under | MIA win |
|---|---|---|---|---|---|---|
| Baseline | +7 / 43.5 | 0 / 0 | 50.0% | 5.6% | 50.0 / 50.0 | 26.1% |
| **Adjusted (view)** | +7 / 43.5 | **+0.5 / -2.0** | **51.5%** | 5.6% | **44.0 / 56.0** | 27.2% |
| Sensitivity | +7 / 43.5 | +1.0 / -1.0 | 52.9% | 5.6% | 47.0 / 53.0 | 28.3% |
| At +7.5 | +7.5 / 43.5 | 0 / -2.0 | 50.0% | 0 | 44.0 / 56.0 | 24.0% |

The SuperContest line is the same number (MIA +7), so the adjusted run also covers the contest. Break-evens: MIA +7 -117 needs 53.9% excluding pushes, and the model gives 51.5%, so **no play at BKR**. Under -111 needs 52.6%, and the model gives 56.0%, about 3.4 points of edge.

Adjustments (home-positive):
- margin +0.5: the A.J. Brown downgrade, about 20 mph wind compressing the margin of a pass-first favorite, and reverse line movement against 76% NE money.
- total -2.0 (soft cap): about 20 mph sustained wind with an 80% rain chance [Open-Meteo], the Bet Labs "Med to High Wind" under system (1297-1122-32), Hochuli games 60-44-2 to the under since 2020 [an_primer], MIA's slow tempo, and Brown questionable.

## Expert / podcast agreement
- **MIA side**: Sean Koerner (AN PRO, MIA +7, ATS confidence #3 of 26, projection +6.5); Brandon Anderson (AN, MIA +7.5 parlay leg; that line is no longer available); BettingPros, Sharp or Square and Even Money (all MIA +7.5, published 10/27-10/28, so 0.5 pt stale against today's +7); VSiN "Tuley's Takes" (pass; notes MIA is picked 55/45 in ATS contests). Trend support comes from Evan Abrams: 6+ point favorites are 8-21-3 ATS, division dogs 23-10 ATS, favorites with Hochuli 43-60-2 ATS, and NE 3-10-1 ATS at Miami since 2012.
- **NE side**: PFT (NE 31-20); Steve Krebs (NE ML -370). Trend support from Abrams: Vrabel is 5-0 SU/ATS with NE off a SU loss; NE has the rest edge (rest-advantage favorites are 15-3-1 ATS); Maye is 16-0 SU and 12-4 ATS as a 3+ point favorite; and teams off their first win this late are 3-10 SU. The Bet Labs "Business Trip" system favors NE.
- **Total**: The under view rests on weather, the wind system, the Hochuli trend and the market drop. The counter is Vrabel 12-3 to the over against the AFC East (+5.6 PPG) and PFT's 51 projected total. No named expert in the packet gives a full-game total pick.
- Props from Anderson (Gordon rushing over 58.5) and Welsh/Prop Guru (Henry ATD) are left for the props pass.

## Counter-case
- **Under**: Miami's rain often comes in short bursts, and if the wind forecast eases the main reason for the under is gone. MIA's defense is #30 by EPA, and NE scored 45 against LV. Turnovers from Willis or Maye on a wet field can give short-field scores. NE's team total of 25.5 alone covers 60% of the full-game number.
- **MIA side (lean)**: NE has the rest edge, Vrabel off a loss is 5-0 with NE, the raw power gap is about 9-10 pts, and MIA's 7.1 opponent YPP last week was against the Jets. Maye's 16-0 SU as a big favorite shows he does not lose these games, and a 10-point win covers easily.
- **NE SU**: about 27% MIA upset probability, with wind-driven variance and a field-goal game script.

## Ambiguity / missing data
- Friday's official injury reports were not verified by web search (only 2023 results came back), and the availability feed is flagged as buggy.
- The AN total open differs between sources: 44.5 in the openers file, 45 in the primer.
- The weather forecast is from Friday night, about 38 hours before kickoff. The wind number is the main driver of the under.
- MIA's FTN data is stale by one week (through W6). Henderson's illness status is unresolved.

## Pre-kickoff delta checklist
1. **Wind**: If the Sunday-morning forecast is under 12 mph sustained, cut the total adjustment to -1.0 and the under falls to C, or PASS below 43. If it is 20 mph or more, keep B.
2. **A.J. Brown inactive** (about 11:55 AM PT): keep the under. If BKR moves to NE -6.5, the MIA lean disappears (PASS). If he is **active**, keep the under at B and leave the side as PASS.
3. **Price**: an under of 42.5 or lower, or an over 43.5 price shorter than -120 → re-check (pass at 42). Any **MIA +7.5** → MIA becomes playable at C. MIA +7 at -110 or better → playable at C.
4. Check Henderson (illness), Davis and Elliss, plus any late MIA OL loss beyond Proctor.
5. SuperContest: the line is locked at NE -7, so MIA +7 stays a low-slot candidate unless Brown is ruled in at full health.

## Gate notes
- missing_inputs: none. roster_vet: PASS (8.5 h; 2 UNVERIFIED league-wide, none cited here).
- Kickoff has not passed, so this is a forward pick.
- Players' teams, roles and status come only from qb_operator_notes and the availability feed. No player status was taken from memory.
- Web injury search: the 2026 Friday reports were not found (results were from 2023). Designations rely on the packet feed, which has known misclassification bugs.
- Stale staff names in secondary_matchups ("Jerod Mayo", "Anthony Weaver") were ignored. The dossiers say HC Vrabel and HC Hafley.
- The roster gate was not rerun.
