# ARI @ DAL — Week 8 game synthesis, pass `sides`

- As of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:23Z)
- Kickoff: Sun 11/1 10:00 AM PT, AT&T Stadium (retractable roof, turf). Inactives come out about 8:30 AM PT.
- Packet built: 2026-10-31T06:09:16Z (`scratch/w08-game-synthesis-queue-sides.json`). roster_vet: **PASS** (roster age 8.5 h; 2 UNVERIFIED league-wide).

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean ARI +7, but -116 is too expensive) | PASS | DAL -6.4 | 0.6 pt to ARI | ARI +7 at -105 or better, or any +7.5; pass at +7 -110 or worse and at +6.5 |
| TOTAL | **UNDER 54.5 -108** | **B** | 52.5 | 2.0 pts | under 53.5 -110; pass at 53 |
| MONEYLINE/SU | ARI +252 is only a thin value lean (C); **DAL to win straight up** | C (ARI ML) | DAL -239 / ARI +239 | about 1 pt of win probability | ARI ML +240 or longer |
| SuperContest | DAL -6.5 / ARI +6.5: coin flip (sim 50.3% ARI) | — | — | 0.1 pt | **No** |
| Pool | SU **DAL**, confidence **10/16** (sim DAL win 70.5% excl. tie) | | | | |

Prices: BKR paste, Fri 10/30 6:52 PM PT [`data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt`]. It matches the BKR prop board game rows captured 2026-10-31T01:50:49Z (6:50 PM PT): ARI +7 -116 / DAL -7 +100, o/u 54.5 -108/-108, ML +252/-297 [`data/generated/props/bookmaker-live-2026-10-31-cardinals-at-cowboys.json`]. No newer BKR row exists.

## Game script

Both defenses are bottom five by EPA. DAL's defense is #32 (0.140 EPA/play); ARI's is #28 (0.102). Dallas's offense ranks #5 (0.126) and scores 2.97 points per drive with a 74% red-zone TD rate. Arizona's offense ranks #22 and scores 1.84 points per drive [dossiers, `data/generated/team-dossiers/2026-w08/{ARI,DAL}.md`, through W7].

The likely game: Dallas moves the ball, mostly through CeeDee Lamb and Javonte Williams (25-155 last week), against a run defense whose front has thinned. Walter Nolen III is OUT. Arizona has a short-passing offense: Brissett's aDOT is 6.8, his explosive-pass rate is 4.6%, and he threw 48 times in Week 7. That offense now plays behind a patched line. Paris Johnson Jr. and Isaiah Adams are on IR, Jon Gaines II is OUT and Hjalte Froholdt is Q (ESPN injuries, fetched 10/30).

Long, slow Cardinals drives (27.2 sec/play, 6.3 plays/drive per FTN) end in field goals. Ryland went 3-for-3 last week, and ARI's red-zone TD rate is 43%. That points to a Dallas win in the 27-20 to 30-23 range, not a shootout.

## QB / availability

QBs are Andy-confirmed: **Jacoby Brissett** (ARI) and **Dak Prescott** (DAL) [`qb_operator_notes`, scratch/w08-qb-confirmations-1030.md]. Mike LaFleur coaches ARI (AN primer and PFT 10/27). The dossier header still says "Jonathan Gannon", but its coaching block is marked historical_context_only, so it is treated as stale. DAL's DC is Christian Parker (ESPN 10/30).

Final designations, from one web check of the ESPN injury pages on 10/30 plus the packet's Rotowire items:
- **ARI OUT:** G Jon Gaines II, DT Walter Nolen III, TE Tip Reiman.
- **ARI Q:** CB Max Melton, S Andrew Wingard, C Hjalte Froholdt.
- **ARI no designation (will play):** RB Jeremiyah Love (returning from ankle), RB Tyler Allgeier, WR Michael Wilson.
- **ARI IR:** LT Paris Johnson Jr., G Isaiah Adams, CB Will Johnson, S Joey Blount.
- **DAL OUT:** WR KaVontae Turpin, LB Dee Winters.
- **DAL Q:** WR George Pickens (shoulder/hamstring; operator note says he is expected to play), DT Kenny Clark (back), TE Luke Schoonmaker.
- **DAL IR/out:** S P.J. Locke, LB Marist Liufau, DT Jonathan Bullard, S Jalen Thompson.
- S Caleb Downs (DAL) was limited Thursday.

Scenarios:
- **If Pickens is OUT**, DAL scoring drops about 1 point. That pushes the under further and moves the fair spread to about -5.5, which turns ARI +7 into a playable C.
- **If Froholdt (C) and Melton/Wingard are all OUT**, the ARI offense downgrade outweighs the DAL-side effect. Hold the under and avoid ARI.
- **If Kenny Clark is out**, it helps ARI's run game a little. No change to any pick.

## Market

- **Spread:** AN open DAL -6.5 (-109) on 10/26 → BKR -7 now, with ARI +7 juiced to -116. The market sits between 6.5 and 7.
- **Total:** AN open 53.0 → 54.5. The AN primer's "total_open 49.5" conflicts with the opener file; see Ambiguity.
- **ML:** AN open DAL -301 / ARI +230 → -297 / +252.
- **SuperContest:** locked at DAL -6.5, a half point better for DAL backers than BKR [`data/odds/actionnetwork-openers-2026-w08.json`; `data/supercontest/week-08-lines.json`].

Splits (Action Network, 10/31 02:06Z, about 7:06 PM PT):
- **Spread:** 46% bets / 47% money on DAL. Balanced.
- **Total:** 36% bets / 41% money on the over. Tickets lean heavily under, yet the total rose 1.5 points. That is reverse movement toward the over, but the 5-point money gap is below the 10-point flag.
- **ML:** 90% of bets but only 28% of money on DAL. That 62-point gap is a **sharp-money flag on the ARI ML**.

## Quantitative

- **Power ratings:** DAL SRS -0.76 (#19) vs ARI -9.66 (#30). Model rank 17 vs 31. Raw SRS plus home field implies about DAL -10, but seven games of SRS need heavy regression [`team-power-ratings-2026.json`].
- **Prediction markets:** DAL median 9.26 wins, ARI 5.83. Context only.
- **FTN:** ARI defense pass DVOA 35.1% and pressure rate 24.9%. DAL defense pass DVOA 40.9%, success rate 55.1%, and 0.5% takeaway rate. DAL's offense allows a 2.6% sack rate, so ARI's thin rush won't get home.
- **Secondary matchups:** DAL offense vs ARI defense is tier "medium" (slot, seam and deep boosts for Lamb and Pickens). ARI offense vs DAL defense is "watch" (McBride seam). Coach names in those notes are ignored.
- **Scoring check:** game totals average 52.7 in DAL games and 50.0 in ARI games. Pace-neutral estimate is DAL 28.4, ARI 23.0, total 51.4.

**Adjustments** (vs BKR -7 / 54.5):
- `margin_adj -0.6`. Koerner's projection is DAL -6.3 (AN PRO, 10/28). DAL comes off Monday night on 6 days of rest vs 7 for ARI, and rest-advantage teams are 22-8-1 ATS this season. ARI's OL losses partly offset this.
- `total_adj -2.0` (soft cap). Pace-neutral estimate 51-52.5. Referee Ron Torbert's games are 64-44-1 to the under. 53+ totals from Week 7 on are 43% overs (Evan Abrams, AN primer 10/30). ARI's OL injuries and FG-heavy red zone point lower.

| Run | Line / total | DAL cover* | ARI cover* | Push | Over | Under | DAL win (excl tie) |
|---|---|---|---|---|---|---|---|
| Baseline | -7 / 54.5 | 50.0% | 50.0% | 5.6% | 50.0% | 50.0% | 71.9% |
| Adjusted | -7 / 54.5 (-0.6 / -2.0) | 48.2% | **51.8%** | 5.6% | 44.0% | **56.1%** | 70.5% |
| Contest | -6.5 (-0.1) | 49.7% | 50.3% | 0 | — | — | 69.3% |

\*Cover is excluding push. Breakevens: ARI +7 -116 needs 53.7%, so the spread is a pass. Under -108 needs 51.9%, so the under has about a 4-point cushion. ARI +252 needs 28.4%; the model has 29.5%.

## Expert / podcast / article agreement

Publish-time lines were mostly -6.5; the line has since moved half a point to -7.

- **DAL -6.5:** Steve Fezzik (Ross Tucker show), Kendra Middleton (AN Favorites), Brandon Anderson (AN, parlay leg only, not comparable), Even Money.
- **ARI:** Chad Millman and Simon Hunter at +7 (Sharp or Square, the same show, so counted as one cluster with the Sharp or Square +6.5 entry). Sean Koerner ARI +6.5, confidence #12/26 with a 0.6% edge. Evan Abrams' Bet Labs systems ("Business Trip off loss on road", "Road dog, no playoffs") and trends: 6+ point favorites are 8-21-3 ATS this season; DAL is 0-5 ATS as a 6+ favorite and has lost three straight outright as a 6+ home favorite; Dak is 1-10 ATS vs the NFC West.
- **Toward DAL SU:** Brissett has lost 25 straight starts when the opponent scores 21+, and is 1-7 SU at the start of a road trip.
- **Total, under:** BettingPros (Under 52.5, so it is better now at 54.5), the Bet Labs "Beware of rising totals" Under system (86-65-1), Torbert. **Over:** no direct full-game over pick. Indirect support: Brandon Anderson's Lamb o78.5 receiving yards, Sal Vetri's Brissett o249.5 passing yards, and Prop Guru and Sal Bets ATD picks.
- **PFT** picks ARI to win 23-20. Its implied total of 43 does not fit this game, which suggests a parse error. Treated as an outlier.

## Counter-case

- **Under:** both defenses are bottom five in EPA and pass DVOA. Dallas leads the league in plays per possession (6.9, Hribar). The total rose against 64% under tickets, so somebody paid for the over. If Love's return gives ARI a run game and McBride works the seam (10-13-111 last week), this goes 31-27.
- **Spread pass / ARI lean:** Dallas covers easily if ARI's patched line collapses. ARI is 0-3 at home, but 2-2 on the road includes a win at LAC. On the other side, DAL won by 17 at PHI and has the #5 offense. Raw SRS says -10, which supports laying 7.
- **ARI ML:** Brissett's record when the opponent scores 21+ (0-25) makes the outright upset need a DAL offensive failure. DAL's offense failed twice at home already (16 vs TB, 31-34 vs BAL).

## Ambiguity / missing data

- **Total opener:** the AN primer has total_open 49.5 and the opener file has 53.0 (10/26 00:44Z). The file is used. Either way the total moved up.
- **Weather:** the packet's `weather` field is null. AT&T Stadium is a retractable dome, so weather is moot if the roof is closed.
- **Off-topic packet entries:** John Ewing's "DAL O 8.5 / ARI O 5.5" are season win totals from a BetMGM tweet, not game picks, and were dropped. Week 7 DAL@PHI items in `pick_signals`/`article_notes` were dropped. The Rotowire Waddle note ("30-16 win over the Cardinals") conflicts with ARI's 30-16 home loss to DEN and was ignored.
- **ARI coach:** the dossier lists HC Gannon, but news and the AN primer say LaFleur. Treated as a staleness issue in the dossier.
- **Final injury report:** the single web search returned only prior-season reports. Final designations came from the live ESPN pages (fetched 10/30) plus packet Rotowire items.

## Pre-kickoff delta checklist

- **BKR ARI +7 reaches -105 or better, or any +7.5:** spread becomes a C on ARI.
- **Line drops to DAL -6.5:** pass the side, including the contest.
- **Total rises to 55.5+:** under upgrades to a B+ with more cushion.
- **Total falls to 53 or lower:** pass the under.
- **Pickens inactive (8:30 AM PT):** fair spread about DAL -5.5. Lean ARI +7, keep the under.
- **Froholdt, Melton or Wingard inactive:** more weight on DAL and the under.
- **Roof open:** no change.
- **ARI ML drifts to +240 or shorter:** drop the C lean.

## Gate notes

- `missing_inputs[]` is empty.
- roster_vet is PASS (8.5 h). The 2 UNVERIFIED players are not named in the queue, and no props are made in this pass.
- Kickoff has not passed.
- `player-availability/latest.json` carries a misclassification caveat. It agrees with ESPN except that Q tags appear for players now listed with no designation (Love, M. Wilson, Allgeier).
- The web-search gate returned stale 2025 pages, and direct ESPN fetches were used instead.
- Coach names in `secondary_matchups` (Zimmer, Gannon) were ignored.
