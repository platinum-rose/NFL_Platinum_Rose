# DAL @ PHI — Week 7 game synthesis, pass `sides`

As-of: Fri 10/23 6:30 PM PT (2026-10-24T01:30Z) · Kickoff: Mon 10/26 5:15 PM PT (MNF, Lincoln Financial Field, outdoor grass) · Packet built 2026-10-24T01:26:41Z · roster_vet: PASS (roster 2026-10-23T15:00Z, age 0.0h; 1 INFO / 1 UNVERIFIED)

## Recommendation box

- **SPREAD:** PHI +4.5 -113 (BKR) | **C** | fair DAL -3.5 | edge 1.0 pt | playable to +4.5 -110 (BKR -113 is break-even vs a 52.7% sim cover); best at +5; **pass at +4 or worse**
- **TOTAL:** UNDER 44 -108 (BKR) | **C** | fair 42.5 | edge 1.5 pts | playable to 43.5; pass at 43 or lower
- **MONEYLINE / SU:** **PASS**. PHI +179 is the value side only if it reaches +190 or better (sim 36.2% vs 35.8% break-even). DAL -206 is overpriced against a fair of about -165.
- **SuperContest:** PHI +4.5 (contest line = BKR line) | C | **candidate: yes**. The contest has no juice, which is where this edge actually lives. The consensus is crowded (Tuley: 67% of ATS-contest entries are on PHI).
- **Pool:** SU winner **DAL**, confidence **5/16** (DAL wins about 64% in the sim; a lean against the favourite in ATS formats only)

## Game script

DAL's offense is the better unit by a wide margin (EPA/play #8 vs PHI #30). DAL's defense is the league's worst (EPA/play allowed #32, pass DVOA allowed 40.9%), but PHI is poorly placed to exploit it. Tanner McKee posted 4.8 YPA in his W6 start. All three primary PHI pass-catchers (DeVonta Smith, Dontayvion Wicks, Dallas Goedert) did not practice Friday. The PHI OL is a cluster risk (Lane Johnson out; Landon Dickerson on IR). Expect DAL to move the ball between the 20s, while PHI tries to shorten the game with a run-first plan through Saquon Barkley (limited Friday) and a 35%-pressure-allowed pocket. The most likely result is a DAL win in the 3–7 range and a total in the low 40s. DAL has gone 1-3 in one-score games and has scored 29 points across its last two (13 and 16), so a backdoor or an outright PHI result at home is live. [Source: data/generated/team-dossiers/2026-w07/{DAL,PHI}.md, built 2026-10-22T22:58Z]

## QB / availability

- **PHI QB: Tanner McKee starts.** Jalen Hurts is on IR and out for the season (DVT plus multiple pulmonary embolisms; ESPN/NFL Network 10/19). McKee was named QB1 after W6, a 25-14 loss to CAR in which he went 26/45 for 215 yards, 1 TD, 0 INT and took 3 sacks. Hurts missed W6, so the market has already seen one McKee start. [Source: packet.qb_operator_notes; news_notes ESPN 2026-10-19T14:32Z; TSN 2026-10-18; dossier PHI Availability]
- **DAL QB:** Dak Prescott is OK. George Pickens (shoulder) practiced in full Friday. KaVontae Turpin (ribs) did not practice Thursday. Dee Winters (LB, Achilles) is doubtful. DeMarvion Overshown practiced in full. Jalen Thompson (S) is out, which the secondary-matchup file treats as a deep-pass boost for PHI. [Source: packet.availability.DAL, ESPN injuries API 2026-10-23]
- **PHI Friday practice (ESPN injuries API, 10/23 22:07–22:21Z):** DNP: DeVonta Smith (hamstring), Dontayvion Wicks (ankle), Dallas Goedert (knee). Limited: Barkley (hamstring). Questionable-tagged: Fred Johnson (OT), Nolan Smith Jr., Jalyx Hunt, AJ Epenesa, Michael Carter II, Moro Ojomo, Tyler Steen, Willie Lampkin.
- **Final designations:** this is a Monday game, so the official Out/Doubtful/Questionable designations come out **Saturday 10/24**, and my web search found none yet. Inactives are due **Mon 10/26 3:45 PM PT**.
- **Scenarios:** *If Smith and Goedert are both out*, PHI's realistic ceiling is about 17 points. Keep the spread at C and the under gains strength. *If Smith is active*, the spread upgrades to a B-leaning C (he is McKee's only proven separator; the lone W6 TD went to him). *If Barkley is out*, pass the spread, because PHI's run plan collapses (rush EPA/att is already -0.192).

## Market

- **Opener → current:** AN open DAL -5.5 / 45 (Sun 10/18 5:00 PM PT, **before** the Hurts season-ending news on 10/19). BKR is now DAL -4.5 -103 / PHI +4.5 -113, o/u 44 -108, ML DAL -206 / PHI +179. The BKR paste (Fri ~11:40 AM PT) matches the BKR board capture at 2026-10-23T20:12Z, so these are the newest numbers. The spread moved **1 point toward PHI and the total fell 1** even after the Hurts news. [Source: market.an_opener; data/generated/props/bookmaker-live-2026-10-23-cowboys-at-eagles.json]
- **Contest line:** DAL -4.5 (captured 2026-10-22T15:03Z), with no gap to BKR.
- **Splits (AN, 2026-10-23T19:40Z):** Spread: DAL 66% of bets / 71% of money, so the line moved against the public (reverse line movement toward PHI); the bets-money gap is only 5, so no sharp flag. **ML: PHI 18% of bets / 31% of money, a 13-point gap = sharp flag on PHI ML.** Total: under 64% of bets / 62% of money, no flag.
- **DK Predictions (reference only):** PHI +4.5 at 53%, U45.5 at 56%, DAL win 66%.

## Quantitative

| Signal | DAL | PHI |
|---|---|---|
| SRS / model rank | -3.49 / #22 | -5.35 / #27 |
| Net PPG | -1.3 | -5.2 |
| EPA/play off / def | 0.092 (#8) / 0.165 (#32) | -0.124 (#30) / 0.048 (#23) |
| Pts/drive | 2.77 | 1.69 |
| Sack rate allowed | 2.8% | 7.4% |
| Avg game total (W1–6) | 51.7 | 40.5 |

On a neutral field the ratings make DAL roughly a 2–4 point favourite, and home field pulls that back to about DAL -1 to -2. Part of PHI's rating comes from Hurts games, but Hurts himself was poor this year (DVOA -17.8%), so the McKee downgrade is smaller than his name suggests: I estimate 1.5–2 points, mostly from lost QB rushing. The three-way pass-catcher hit is worth about another point if it holds. **Fair line: DAL -3.5. Fair total: 42.5.** DAL's defense is a real over risk, but PHI's offense is unlikely to cash in on it. The secondary-matchup file flags a slot/seam/TE-middle boost for DAL against PHI's match-zone coverage, and a deep/outside boost for PHI against DAL's single-high man (Thompson out). That PHI boost needs Smith and Wicks healthy to matter. [Source: packet.power_ratings, data/generated/team-profiles/team-power-ratings-2026.json 2026-10-23T15:30Z; packet.secondary_matchups (coach names in those notes ignored per rule 7)]

**Simulator** (`scripts/intel/margin-simulator.mjs`, selftest all PASS; calibration 2018–2025, sdMargin 12.77). The contest line equals the BKR line, so the SuperContest run is identical.

| Run | PHI cover | DAL cover | Over | Under (excl push) | PHI win |
|---|---|---|---|---|---|
| Baseline (home +4.5, 44) | 50.0% | 50.0% | 50.0% | 50.0% | 33.7% |
| Adjusted (margin-adj +1.0, total-adj -1.5) | 52.7% | 47.3% | 45.3% | 54.7% | 36.2% |

Adjustment reasons: **margin +1.0** = the line moved against the public on a ticket-heavy favourite, a 2-4 road favourite with a TO margin of -4 and a 1-3 record in one-score games, and multiple independent expert takes on PHI; this is partly offset by the PHI skill-position injuries. **Total -1.5** = PHI's pass-catcher and OL depletion with a backup QB, and DAL's offense stalled for two straight games. At BKR -113, the 52.7% PHI cover is break-even. That is why the spread is tier C and the SuperContest is the preferred home for it.

## Expert / podcast / article agreement

- **PHI +4.5:** Dave Tuley (VSiN Best Bet, 10/22), Andrew Erickson (YouTube, "division home dogs 19-5 ATS"), Emerson Lotzia (YouTube "Peg of the Week"; his rationale cites rallying behind Hurts, which is outdated, so weight it lightly), Simon Hunter (YouTube, "playing the number"), and John Ewing / Bet Labs (division dogs 20-8 ATS, a trend rather than a pick). All of them were priced at +4.5 at publish time, so there has been no line movement since. [Source: packet.pick_signals, youtube_picks_approved, article_selections]
- **DAL:** PFT predicts DAL 21-13, which covers -4.5 and projects a total of 34, supporting the under. Stephen A. Smith (ESPN video 10/22) picks DAL to beat the "anemic" Eagles straight up.
- Dropped: Steve Makinen's "Rams -3.5" appears in article_selections tagged DAL/PHI but is not about this game.

## Counter-case

- **PHI +4.5:** DAL is clearly the better team in the trenches on offense and has the better QB by a wide margin. McKee plus three DNP pass-catchers behind a patched OL against a DAL defense blitzing 27.5% could produce a 24-10 game. A 4-point line has little key-number protection: a 7-point DAL win (9.1% of outcomes) beats it, and fair value sits only 1 point away.
- **Under 44:** DAL's defense allows 6.1 YPP and 26.5 PPG, and DAL games have averaged 51.7 points. One PHI explosive play or a short field from a DAL turnover (they give away 1.2 per game) pushes this past 44.
- **ML pass:** a backup-QB home dog in a division game, with a 13-point sharp ML flag, is exactly the profile that wins outright about 36% of the time. Passing could miss a +179 hit.

## Ambiguity / missing data

- `missing_inputs[]` is empty. There is no BetOnline board (path null). FTN is weekly only (through W6). There are no official game designations yet (due Sat 10/24).
- The availability feed carries both "Nolan Smith Jr. DE" and "LB", and both "A.J."/"AJ" Epenesa, which are known misclassification duplicates. The projected-starters file lists both Hurts and McKee under "known" for PHI; McKee is the starter.
- The season-to-date SRS for PHI blends in Hurts games, so the size of the McKee delta is a judgment call.

## Pre-kickoff delta checklist

1. Sat 10/24 designations: **if DeVonta Smith is Out**, hold PHI at C and consider moving the under toward B. If Smith is cleared without a designation, upgrade the spread.
2. If Barkley is Out or Doubtful, pass the spread (and the under gets stronger).
3. Price: if PHI +5 appears, add it (it hits 5 and protects the push at 4/5). If the line drops to PHI +4 or +3.5, pass. If the total drops to 43 or below, pass the under.
4. If PHI ML reaches +190 or better, reconsider as a small C.
5. Inactives: Mon 10/26, 3:45 PM PT. Also watch DAL OT Broderick Jones and Drew Shelton, and CB Cobie Durant.

## Gate notes

- Roster gate PASS (0.0h); not rerun, per the rule.
- The QB fact is confirmed by Andy's operator note, ESPN 10/19, and TSN 10/18 (McKee is QB1).
- The Friday official-designation search returned nothing for this game. MNF teams designate on Saturday, so practice participation from the ESPN injuries API (10/23) is used instead.
- The `secondary_matchups` coverage notes name coaches; those names are ignored, and the dossiers (Schottenheimer, Sirianni) are authoritative.
- Lotzia's YouTube rationale is outdated (it references Hurts); kept as a signal per the approval but down-weighted.
- No gate stopped the run.
