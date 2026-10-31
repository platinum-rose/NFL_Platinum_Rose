# MIN @ DET — Week 8 2026 — pass: sides

As of Fri 2026-10-30 11:25 PM PT (2026-10-31T06:24Z) · Kickoff Sun 11/1 10:00 AM PT (Ford Field, dome) · Packet built 2026-10-31T06:09Z (`scratch/w08-game-synthesis-queue-sides.json`) · roster_vet PASS (age 8.5h, 2 UNVERIFIED league-wide)

## Recommendation box

| Market | Pick @ BKR line/price | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **MIN +3 (+102)** BKR 6:50 PM PT | C | DET -2.7 | 0.3 pt (MIN) + plus-money at the key number | +3 at -103 or better; **+3.5 only at -109 or better — PASS at +3.5 -118/-120**; pass at +2.5 |
| TOTAL | PASS (lean Under 46) | PASS | 45.0 | 1.0 pt Under | Under 46 at -105 or better, or Under 46.5 at -110 or better |
| MONEYLINE / SU | PASS (MIN +162 is about break-even) | PASS | DET 58% / MIN 38% | none | MIN +175 or better |
| SuperContest | **MIN +3.5** (contest line DET -3.5) | C | — | 0.8 pt, crosses the 3 | yes |
| Pool | SU **DET**, confidence 4/16 | — | DET 58% | — | — |

**Price sensitivity (+3.5 vs +3):** at BKR, **MIN +3 +102 is the better ticket than MIN +3.5 -118 (AN consensus) or -120 (BetOnline).** With my view applied, the simulator gives +3: 46.7% win, 8.3% push, 45.1% loss → EV +2.5% at +102. For +3.5: 52.1% win → EV -3.7% at -118. Paying 16-22 cents for the hook is more than the hook is worth here [sim runs below]. The +3.5 is only worth it as a free half-point, i.e. the SuperContest line.

## Game script
Detroit's #4 EPA offense (0.142/play, 30.7 PPG, 6.3 plays per drive) faces Minnesota's #1 defense (-0.193 EPA/play, 12.3 PPG allowed, 71% blitz rate, 39% pressure rate). Minnesota's #29 offense (-0.093 EPA/play, 1.86 pts/drive, #32 early-down success rate) faces Detroit's #29 defense (0.116 EPA/play, 52% conversions allowed) [Source: team dossiers 2026-w08 MIN.md/DET.md, built 2026-10-31T01:01Z; Sharp Football tweet 10/27 in news_notes]. The likely script: Minnesota grinds the clock (60.7 plays/game, 30.8 sec/play) and stays close through turnovers (TO margin +7) and pressure on Goff. Goff is +0.467 EPA/dropback when clean and -0.310 under pressure [FTN via DET dossier, through W6]. Detroit's chances rest on beating the blitz with quick throws to the slot and middle, where the secondary-matchup file flags inside-seam and slot weaknesses on MIN [secondary_matchups, 2026-10-30T22:00Z]. A one-score game in the 23-20 range is the modal outcome. The simulator puts 15.6% of results on exactly 3 points.

## QB / availability
- QBs: **Kyler Murray** (MIN, named starter, no designation) and **Jared Goff** (DET) [qb_operator_notes / scratch/w08-qb-confirmations-1030.md].
- Final Friday report [Source: vikings.com "Lions injury report Week 8 2026", 10/30 1:00 PM]:
  - **DET:** S **Kerby Joseph OUT** (knee); CB **Roger McCreary Questionable** (foot, limited). No designation, full practice Friday: St. Brown (ankle), Gibbs (shoulder) and CB Rakestraw (ankle). CB Avonte Maddox and S Thomas Harper are on IR [secondary_matchups].
  - **MIN:** S **Jay Ward Questionable** (knee, limited). No designation: RB Aaron Jones (knee; will split work with Jordan Mason [Rotowire 10/30]), LT Christian Darrisaw (DNP Friday, listed as rest), RT O'Neill, G Huber. S Jamal Adams is on IR.
- If McCreary is out, DET's secondary is down three regulars plus Joseph, so MIN gets a small boost (+0.2). If Darrisaw is a surprise inactive against Hutchinson, downgrade MIN about 0.5 and the +3 pick drops to a pass.
- Inactives are released Sun ~8:30 AM PT.

## Market
- **Spread:** AN open DET -3 (-103) on 10/25 → BKR DET -3 -119 / MIN +3 +102 (10/30 6:50 PM PT; the paste and the prop board `bookmaker-live-2026-10-31-vikings-at-lions.json`, capturedAt 01:50Z, agree, so there is no newer BKR number). AN consensus is MIN +3.5 -118 (7:06 PM PT) and BetOnline is MIN +3.5 -120 (10/29). The move is roughly a quarter to half a point toward DET. The SuperContest line DET -3.5 is half a point better for MIN than BKR.
- **ML:** opened MIN +135 / DET -162 → BKR MIN +162 / DET -178. That is a clear move toward Detroit.
- **Total:** opened 46.5 at AN (the primer shows a 47 open) → 46 at BKR (o +101 / u -117) and 45.5 consensus. The juice points toward the Under.
- **Splits (AN, 10/31 02:06Z):** spread bets 59% MIN, but money 51% DET. That is a **+10 money-over-bets gap on DET, so the sharp flag points toward Detroit.** ML: DET 68% of bets, 73% of money. Total: 49/50 even. BetMGM: 74% of money on DET -3.5 [johnewing 10/30].

## Quantitative
- **Power ratings** [team-power-ratings-2026.json, 10/28]: MIN SRS 8.46 (#1) vs DET 1.67 (#14). I am **not using SRS directly.** MIN has played the easiest schedule to date [SharpFootball 10/27], is 4-0 in one-score games and has +1.34 Pythag luck. The market win-total implied rank (#4 vs #9) narrows the gap. The baseline card's SRS-only adjustment (-3.08) breached the 3.0 hard cap and is rejected.
- **Prediction markets** (context only): MIN division 40% vs DET 24%. Win-total medians 11.75 vs 11.19.
- **FTN** (through W6, a week stale): DET defense DVOA +8.5% with a 27.6% blitz rate. MIN defense DVOA -24.0%, with a league-low 1.7% pass-TD rate (3 pass TDs allowed) [SharpFootball 10/30].
- **Adjustments** (home-positive, my view minus the market):

| Driver | Pts | Source |
|---|---|---|
| DET secondary depletion (Joseph OUT, Maddox/Harper IR, McCreary Q) | -0.4 | vikings.com 10/30; secondary_matchups (DET tier "high", severity 6.3) |
| MIN blitz/pressure vs Goff's pressure split | -0.3 | FTN via dossiers |
| Division road dog situational (23-10 ATS in 2026; Bet Labs "Great Condition Div Road Dogs" 388-297-20) | -0.2 | an_primer (Evan Abrams 10/30) |
| MIN offensive weakness + easiest SOS + TO regression; Koerner proj -3.8; sharp money/ML move to DET | +0.6 | dossiers; youtube_picks_approved (Koerner); splits |
| **Net margin_adj** | **-0.3 at -3 (-0.8 at -3.5)** | within the 2.0 soft cap |
| Total: MIN pace/TOP and league-low TD rate allowed vs DET games averaging 58.2 combined and the Joseph absence | **-1.0** | dossiers; Sharp Football worksheet 10/28 |

- **Simulator** (`scripts/intel/margin-simulator.mjs`, selftest PASS):

| Run | MIN cover | push | DET cover | Over/Under | DET win |
|---|---|---|---|---|---|
| -3 / 46 baseline | 45.9% | 8.3% | 45.9% | 48.5/48.5 | 60.1% |
| -3 / 46, adj -0.3 / -1.0 | **46.7%** | 8.3% | 45.1% | 45.5/**51.5** | 59.4% |
| -3.5 / 46 baseline | 50.0% | 0 | 50.0% | — | 64.1% |
| -3.5 / 46, adj -0.8 / -1.0 (contest) | **52.1%** | 0 | 47.9% | 45.5/51.5 | 62.1% |

## Expert / podcast / article agreement
- **MIN side (all at +3.5):** Simon Hunter (Sharp or Square; 3 episodes plus the article are ONE opinion), Chad Millman (Sharp or Square, "betting the number with the hook"; the Discord community pick is excluded), and Dave Tuley (VSiN best bet). Doug Kezirian has MIN ML as a parlay leg. Fezzik and Even Money have MIN 1Q +0.5 (not comparable).
- **DET side:** Brandon Anderson (AN article + Brandon's Playground = one opinion, -3 -110), BettingPros/Jason Radowitz (-3 -112, 10/27), ESPN early picks (-3), Kendra Middleton (-3.5), **Sean Koerner (-3.5, proj -3.8, ATS confidence 8/26)**, Even Money (-3) and PFT (27-13).
- Count: 3 MIN vs 6 DET. Most DET picks were priced at -3 -110/-112 and are now -3 -119, a worse price than they recommended.
- **Trends that cut against each other:** Goff is 5-0 SU / 4-0-1 ATS vs Murray. Undefeated teams that are 3+ point dogs this late are 0-4 SU. Murray is 4-22 1H ATS in division games. On the other side, the Lions are 0-8 ATS after a SU win, have a Miami road game on deck (15-28 ATS), and preseason contenders are 12-25-1 ATS vs non-contenders [an_primer].

## Counter-case
- **MIN +3:** Detroit's offense is the best unit on the field, and Goff (14 TD / 0 INT) is the kind of poised passer who makes a 70% blitz pay. Minnesota scores 20.8 PPG against the league's easiest schedule, so its 6-0 record carries a lot of luck (one-score games, turnovers). Sharp money and the ML move both lean Detroit, and Koerner's number (-3.8) would make DET -3 a small play.
- **Under (pass):** Kerby Joseph's absence opens deep and middle routes for Jefferson, Addison and Hockenson. Detroit games average 58 points, and either defense allowing a short field could push this past 46.
- **ML (pass):** the market has already moved 27 cents toward DET. My 38% for MIN is at break-even.

## Ambiguity / missing data
- The packet's `weather` field is null; Ford Field is a dome, so weather is moot.
- Both dossiers mark availability as "missing". I used the packet availability feed plus the vikings.com Friday report.
- The secondary_matchups coverage note names a stale DET defensive coach; ignored.
- article_selections tags the Radowitz Lions -3 as teams [DET, LAC] (tag artifact) and lists it twice.
- The BetOnline file has no per-row capturedAt (file-level 10/29 23:10Z).
- FTN data runs only through W6.
- A web-search hit (SI.com "four players questionable") was a 2025 article and was dropped.

## Pre-kickoff delta checklist
1. BKR MIN +3 juice moves to -104 or worse → PASS. BKR shows +3.5 at -109 or better → switch to +3.5 (tier C→B is possible at +3.5 -105).
2. Line moves to DET -2.5 → PASS the side. DET -4 → re-run; probably still MIN at that point.
3. Sun ~8:30 AM PT inactives: McCreary out → small MIN boost. Darrisaw or O'Neill inactive → MIN downgrade, PASS. Any surprise from St. Brown or Gibbs → MIN up.
4. Total: 46.5 or higher at -110 → Under becomes playable (C). 45 or lower → stays PASS.
5. MIN ML reaches +175 or better → MIN ML becomes playable (C).

## Gate notes
- missing_inputs: none. roster_vet PASS (8.5h). Kickoff not passed.
- Roster rerun not performed (shared file). QB status comes from qb_operator_notes.
- Price gate: the BKR paste (6:52 PM PT) and the prop-board game rows (01:50Z) match, so there is no newer BKR number.
- Hard-cap issue from the baseline card (SRS-only -3.08) is noted and rejected. This run's |margin_adj| is 0.3/0.8 and |total_adj| is 1.0, both within the soft cap.
