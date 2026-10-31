# ARI @ DAL — Week 8 game synthesis, pass `sides` (Saturday re-run)

- As of: Sat 2026-10-31 ~3:30 PM PT (22:30Z). Kickoff: Sun 11/1 10:00 AM PT, AT&T Stadium (retractable roof, turf). Inactives come out about **8:30 AM PT Sunday**.
- Packet built: 2026-10-31T21:55:40Z (`scratch/w08-game-synthesis-queue-sides.json`). roster_vet: **PASS** (roster age 0.3 h; 14 UNVERIFIED league-wide, none named for this game).
- Friday baseline: `reports/intel/games/_friday-w08/2026-w08-game-ARI_at_DAL-sides.md`.

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean ARI +7; BKR's -116 is too expensive) | PASS | DAL -6.4 | 0.6 pt to ARI | ARI +7 at -105 or better, or any +7.5. BetOnline's +7 -112 is still a pass. Pass at +6.5. |
| TOTAL | **UNDER 54.5 -108** | **B** | 52.5 | 2.0 pts | Under 53.5 -110. Pass at 53. |
| MONEYLINE/SU | ARI +252 is a thin value lean (C). **DAL wins straight up.** | C (ARI ML) | DAL -239 / ARI +239 | About 1 pt of win probability | ARI ML +240 or longer |
| SuperContest | DAL -6.5 / ARI +6.5 is a coin flip (sim 50.3% ARI) | — | — | 0.1 pt | **No** |
| Pool | SU **DAL**, confidence **10/16** (sim DAL win 70.5% excluding ties) | | | | |

Prices come from the BKR paste, Sat 2:26 PM PT [`data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt`]. They match the BKR prop-board game rows captured 2026-10-31T21:27:04Z: ARI +7 -116 / DAL -7 +100, o/u 54.5 -108/-108, ML +252/-297. Team totals are DAL 30.5 and ARI 23.5 [`data/generated/props/bookmaker-live-2026-10-31-cardinals-at-cowboys.json`]. BetOnline (21:32Z) has ARI +7 -112 / DAL -7 -108, o54.5 -113 / u54.5 -107, and ML +249/-305 [`betonline-live-2026-10-31-cardinals-at-cowboys.json`].

## Changes vs Friday

1. **BKR prices: no change.** Every number in the Saturday 2:26 PM capture matches the Friday 6:52 PM capture to the cent. A line frozen for 20 hours is plausible, since BKR hangs ARI +7 at -116 instead of moving to 6.5. Still, check it live before acting.
2. **New BetOnline reference.** ARI +7 is -112 there, the best +7 price on file. That still needs 52.8% and the sim gives 51.8%, so the spread stays a pass.
3. **AN splits** (Fri 02:06Z → Sat 21:23Z):
   - Spread: DAL bets/money moved from 46/47 to 43/43. Slight drift toward ARI, still balanced.
   - Total: over bets/money moved from 36/41 to 40/40. The small over-money edge is gone, which mildly helps the under.
   - ML: DAL bets/money moved from 90/28 to 90/34. The gap narrowed from 62 to 56 points but is still a **sharp-money flag on the ARI ML**.
4. **New ARI-side voices:**
   - VSiN Matt Youmans picks Cardinals +7 (captured 10/31 14:54Z).
   - In a BettingPros YouTube episode, Pat Fitzmaurice says "six and a half seems like a lot" for Dallas. That is a survivor-pool caution, not a formal pick.
   - No new DAL side picks.
5. **New Saturday X bookmarks are all props.** Examples: McBride 7+ receptions (7/7 games), McBride ATD, Lamb 60+ yards, Dak o224.5 passing, Pickens o39.5 receiving. None is a full-game side or total. Lamb and McBride overs point mildly against the under, but alt-ladder legs are not comparable to the total.
6. **BettingPros Saturday refresh section:** no rows for ARI@DAL.
7. **Injuries:** no Saturday change found. Pickens is still Q (shoulder/hamstring) with no downgrade and no Saturday roster move. Froholdt is still Q. Availability feed's probability of playing: Pickens 0.92, Wingard 0.33, Melton 0.81, Kenny Clark 0.87.
8. **Roof:** still undecided. The weather file omits DAL because the roof is retractable.
9. **Simulator inputs and outputs: same as Friday.** Recommendations are unchanged: spread PASS, Under 54.5 B, ARI ML C, DAL SU 10/16, no SuperContest pick.

## Game script

Both defenses are bottom five by EPA. DAL ranks #32 (0.140 EPA/play) and ARI #28 (0.102). DAL's offense ranks #5 at 2.97 points per drive; ARI's ranks #22 at 1.84 [team dossiers `data/generated/team-dossiers/2026-w08/{ARI,DAL}.md`, through W7].

Dallas should move the ball through Lamb and Javonte Williams. Arizona plays slow, short-area football (Brissett aDOT 6.8, 27.2 sec/play per FTN) behind a patched line. Its drives tend to stall into Ryland field goals; ARI's red-zone TD rate is 43%. Most likely result: DAL by 7–10 in the 27-20 to 31-23 range, not a 31-28 shootout. BKR's team totals of 30.5 and 23.5 sum to 54, which agrees with the market's shape. Our under view sits about 2 points below it.

## QB / availability

The packet has no QB operator notes. The AN primer lists **Jacoby Brissett** (ARI) and **Dak Prescott** (DAL), both non-backup [packet `an_primer.game`]. Friday's Andy-confirmed QB file agreed. Mike LaFleur coaches ARI; DAL's DC is Christian Parker (ESPN 10/30).

**Final designations** come from the Friday report as carried in the packet (FantasyPros/Rotowire 10/30) and the ESPN team injury pages fetched Saturday. ESPN's ARI page still shows Thursday-dated Q tags for players the Friday final report changed.

- **ARI**
  - OUT: G Jon Gaines II, DT Walter Nolen III.
  - Q: C Hjalte Froholdt, CB Max Melton, S Andrew Wingard (feed probability 0.33), OT Elijah Wilkinson, LB Mack Wilson Sr.
  - Expected to play: RB Jeremiyah Love (no designation, per Rotowire/ESPN 10/30).
  - Status unclear: Allgeier and Michael Wilson are listed Q on the ESPN page, but Friday's report said no designation.
  - IR: LT Paris Johnson Jr., G Isaiah Adams, CB Will Johnson.
- **DAL**
  - OUT: WR KaVontae Turpin, LB Dee Winters.
  - Q: WR George Pickens (shoulder/hamstring), DT Kenny Clark (back), TE Luke Schoonmaker.
  - Return designation (IR-R) or out: S P.J. Locke, LB Marist Liufau, DT Jonathan Bullard.
  - S Caleb Downs was limited Thursday.

Scenarios:
- **If Pickens is OUT:** DAL's projection drops about 1 point. Fair spread moves to about -5.5, so ARI +7 becomes a playable C. The under gets a little stronger.
- **If Froholdt plus Melton or Wingard are OUT:** ARI's offensive downgrade outweighs its secondary losses. Hold the under and avoid ARI.
- **If Kenny Clark is out:** small help to ARI's run game, no change.

## Market

- **Spread:** AN open (Sun 10/25, 5:00 PM PT) was DAL -6.5 -109. BKR now has -7, with ARI +7 juiced to -116. The SuperContest locked DAL -6.5, half a point better for DAL backers [`data/odds/actionnetwork-openers-2026-w08.json`; `data/supercontest/week-08-lines.json`].
- **Total:** AN open 53.0, now 54.5 (+1.5), even though 60%+ of tickets are on the under. That is mild reverse movement, below the 10-point money-gap flag.
- **ML:** AN open -301/+230, now -297/+252.
- **Splits** (AN 21:23Z): spread 43% bets / 43% money on DAL. Total 40% / 40% on the over. ML 90% of bets / 34% of money on DAL. **Sharp flag: ARI ML (56-point gap).**

## Quantitative

- **Power ratings:** DAL SRS -0.76 (#19), model rank 17. ARI SRS -9.66 (#30), model rank 31. Raw SRS implies about DAL -10, but seven games of data need heavy regression [`team-power-ratings-2026.json`].
- **Prediction-market win medians:** DAL 9.26, ARI 5.83 (context only).
- **FTN:** pass DVOA allowed is 40.9% for DAL's defense and 35.1% for ARI's. ARI's pressure rate is 24.9%, against a DAL offensive line that allows a 2.6% sack rate.
- **Secondary matchups:** DAL offense vs ARI defense is "medium" (Lamb slot/seam, Pickens deep). ARI offense vs DAL defense is "watch" (McBride seam). Stale coach names in these notes were ignored.

**Adjustments** (vs BKR -7 / 54.5), unchanged from Friday:
- `margin_adj -0.6`: Koerner's projection of DAL -6.3, plus a rest edge for ARI (DAL is on 6 days after MNF, ARI on 7). ARI's OL injuries partly offset this.
- `total_adj -2.0` (soft cap). Reasons:
  - Pace-neutral estimate of 51–52.5.
  - Referee Ron Torbert's games are 64-44-1 to the under.
  - 53+ totals from Week 7 on go over only 43% of the time (Evan Abrams, AN primer 10/30).
  - ARI's red zone is field-goal heavy.

| Run | Line / total | DAL cover* | ARI cover* | Push | Over | Under | DAL win (excl tie) |
|---|---|---|---|---|---|---|---|
| Baseline | -7 / 54.5 | 50.0% | 50.0% | 5.6% | 50.0% | 50.0% | 71.9% |
| Adjusted | -7 / 54.5 (-0.6 / -2.0) | 48.2% | **51.8%** | 5.6% | 44.0% | **56.1%** | 70.5% |
| Contest | -6.5 (-0.1) / 54.5 (-2.0) | 49.7% | 50.3% | 0 | — | — | 69.3% |

\*Excluding push. Selftest passed. Breakevens:
- ARI +7 -116 needs 53.7% (pass). At BetOnline -112 it needs 52.8% (pass).
- Under -108 needs 51.9%, leaving about a 4-point cushion.
- ARI +252 needs 28.4%; the model has 29.5%.

## Expert / podcast / article agreement

Most picks were published at -6.5; the line is now -7.

- **DAL -6.5:** Steve Fezzik (Ross Tucker show), Kendra Middleton (AN Favorites), Even Money, and Brandon Anderson (Four Square parlay leg only, not comparable).
- **ARI:**
  - Chad Millman and Simon Hunter at +7, plus the Sharp or Square entry at +6.5. Same show, so this counts as one cluster.
  - **Matt Youmans (VSiN), +7, new Saturday.**
  - Sean Koerner +6.5 (confidence #12/26, 0.6% edge).
  - Pat Fitzmaurice's caution (BettingPros YouTube, new to this run).
  - Evan Abrams trends:
    - 6+ point favorites are 8-21-3 ATS this season.
    - DAL is 0-5 ATS as a 6+ point favorite.
    - Dak is 1-10 ATS vs the NFC West.
  - PFT picks ARI 23-20. Its implied total of 43 suggests a parse issue, so it is treated as an outlier.
- **DAL straight up:** Brissett has lost 25 straight starts when the opponent scores 21+, and is 1-7 SU at the start of a road trip.
- **Total, under:** BettingPros Under 52.5 (an even better number now), Torbert's under trend, and the Bet Labs rising-totals under system.
- **Total, over:** no direct full-game over pick. Indirect over-leaning prop chatter includes:
  - Anderson: Lamb o78.5 receiving yards.
  - Sal Vetri: Brissett o249.5 passing yards.
  - Saturday X bookmarks: McBride 7+ receptions, Lamb 60+ receiving yards, Dak o224.5 passing yards.
  - Sal Bets: Javonte Williams 2+ TDs.

## Counter-case

- **Under:**
  - Both pass defenses are bottom five, and DAL leads the league in plays per possession (6.9).
  - The total rose 1.5 points against majority under tickets.
  - Love's return gives ARI a real run game, and McBride has 7+ catches in 7 of 7 games. If ARI converts in the red zone, this ends 31-27.
  - The book's team totals already sum to 54, so the market does not see the under.
- **Spread pass:** DAL won by 17 at PHI and has the #5 offense. Raw SRS says -10. If ARI's patched OL collapses, DAL covers easily.
- **ARI ML:** ARI's 0-25 record when the opponent scores 21+ means an upset needs a DAL offensive failure. DAL has had two already (16 vs TB, and a 31-34 loss to BAL).

## Ambiguity / missing data

- **Packet `weather` is null** because DAL has a retractable roof. The roof decision is not public.
- **Total opener:** AN primer says 49.5, the opener file says 53.0. The file is used.
- **ESPN ARI injury page lags** (Thursday-dated Q for Nolen and Gaines). The packet's 10/30 OUT tags and Friday's finals are used.
- **Froholdt** is missing from `player-availability/latest.json`. His status comes from ESPN only.
- **Identical BKR prices Fri→Sat:** possibly a stale capture.
- **Projected starters:** DAL lists only Dak and J. Williams.
- **Off-topic items dropped:** John Ewing's win totals, W7 DAL@PHI items, and the Rotowire Waddle note.

## Pre-kickoff delta checklist

- **BKR ARI +7 at -105 or better, or any +7.5:** the spread becomes ARI C.
- **DAL -6.5 anywhere:** pass the side.
- **Total 55.5+:** upgrade the under. **Total 53 or lower:** pass it.
- **Pickens inactive (about 8:30 AM PT):** fair line about -5.5. ARI +7 becomes C; keep the under.
- **Froholdt, Melton or Wingard inactive:** more weight on DAL and the under.
- **Roof open:** no change.
- **ARI ML at +240 or shorter:** drop the C.

## Gate notes

- `missing_inputs[]` is empty.
- roster_vet is PASS (0.3 h old).
- Kickoff has not passed.
- The availability feed carries its misclassification caveat.
- One web search found no Saturday injury news. Direct ESPN team pages were fetched; ESPN's ARI page lags the Friday final report.
- The weather field is null (roof).
- Stale coach names in `secondary_matchups` (Zimmer, Gannon) were ignored.
- BKR prices are unchanged from Friday; possible stale capture.
