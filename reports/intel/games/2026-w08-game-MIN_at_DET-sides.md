# MIN @ DET — Week 8 2026 — pass: sides (Saturday re-run)

As of Sat 2026-10-31 ~3:20 PM PT · Kickoff Sun 11/1 10:00 AM PT (Ford Field, dome) · Packet built 2026-10-31T21:55Z (`scratch/w08-game-synthesis-queue-sides.json`) · roster_vet PASS (age 0.3h, 14 UNVERIFIED league-wide, none in this game's picks) · Friday version: `reports/intel/games/_friday-w08/2026-w08-game-MIN_at_DET-sides.md`

## Recommendation box

| Market | Pick @ BKR line/price | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **MIN +3 (+105)** BKR Sat 2:26 PM PT | C | DET -2.7 | 0.3 pt + plus-money at the 3 (sim EV +3.9%) | +3 at -103 or better; +3.5 only at -109 or better (PASS at BOL +3.5 -120); PASS at +2.5 |
| TOTAL | PASS (lean Under 45.5) | PASS | 45.0 | 0.5 pt Under (sim EV -1.2% at -109) | Under 46.5 at -110 or better, or Under 46 at -105 or better |
| MONEYLINE / SU | PASS (MIN +167 slightly +EV on the sim but rests on a 0.3-pt view) | PASS | DET 59% / MIN 38% (tie 2%) | ~1.7 pp | MIN +175 or better → C |
| SuperContest | **MIN +3.5** (contest line DET -3.5) | C | DET -2.7 | 0.8 pt, crosses the 3 | yes (sim 52.1%) |
| Pool | SU **DET**, confidence 4/16 | — | DET 59% | — | — |

The +3 at +105 is now the best ticket on the board for this side: it beats BetOnline +3.5 -120 by the simulator (EV +3.9% vs about -3.7%). [Source: `data/generated/props/bookmaker-live-2026-10-31-vikings-at-lions.json` capturedAt 2026-10-31T21:26:44Z; `data/generated/props/betonline-live-2026-10-31-vikings-at-lions.json` 21:32Z]

## Changes vs Friday

| Item | Friday (10/30 6:50 PM PT) | Saturday (10/31 2:26 PM PT) | Effect |
|---|---|---|---|
| BKR spread | MIN +3 +102 / DET -3 -119 | MIN +3 **+105** / DET -3 **-121** | Same pick, better price; EV +2.5% → +3.9%; tier stays C |
| BKR total | 46 (o +101 / u -117) | **45.5** (o -107 / u -109) | Under edge shrinks 1.0 → 0.5 pt; stays PASS |
| BKR ML | MIN +162 / DET -178 | MIN **+167** / DET **-184** | Moved further toward DET; still under the +175 trigger; PASS |
| AN spread splits | DET 41% bets / 51% money (+10, sharp flag DET) | DET 39% bets / **46%** money (**+7**) | DET sharp flag drops below the 10-pt threshold; money still leans DET relative to tickets |
| AN ML splits | DET 68% bets / 73% money | DET 68% / **61%** money (MIN ML money +7 over bets) | Mild money on the MIN ML |
| New experts | — | Travis Pulver MIN +3 (+100) / ML (+142); Dan Servodidio DET ML in a parlay with Hockenson ATD; Sal Vetri Goff u274.5 (best bet) | 1 new MIN side, 1 new DET ML; net neutral |
| Availability | Final Friday report | Unchanged (re-verified vikings.com 10/30 report) | No change |
| Margin view | DET by 2.7 | DET by 2.7 | Unchanged; total view 45.0 unchanged |

## Game script
Unchanged from Friday: Detroit's #4 EPA offense (30.7 PPG) faces Minnesota's #1 defense (12.3 PPG allowed, ~70% blitz rate), and Minnesota's #29 offense (#32 early-down success rate) faces Detroit's #29 defense [Source: team dossiers `data/generated/team-dossiers/2026-w08/{MIN,DET}.md`, built 2026-10-31T01:01Z, not rebuilt Saturday; Sharp Football tweet 10/27 in news_notes]. Minnesota slows the game down, wins the turnover margin and gets pressure on Goff (+0.467 EPA/dropback clean vs -0.310 under pressure [FTN via DET dossier]). Detroit answers with quick throws to the slot and middle [secondary_matchups 10/30 22:00Z]. The modal outcome is a one-score game around 24-21. The simulator puts 15.6% of results on exactly 3.

## QB / availability
- QBs: **Kyler Murray** (MIN) and **Jared Goff** (DET), per the packet's an_primer and projected starters (Sat 21:45Z). No QB news.
- **Final report** [Source: vikings.com "Lions injury report Week 8 2026", dated 10/30, re-fetched Sat]:
  - DET: S **Kerby Joseph OUT** (knee); CB **Roger McCreary Questionable** (foot). St. Brown (ankle) and Gibbs (shoulder) were DNP Wednesday and full Thursday and Friday, with no designation. CB Avonte Maddox and S Thomas Harper are on IR [secondary_matchups].
  - MIN: S **Jay Ward Questionable** (knee). LT **Christian Darrisaw** DNP Friday (rest), no designation. RB Aaron Jones (knee) is full Friday and expected to play, splitting work with Jordan Mason [Rotowire 10/30]. S Jamal Adams is on IR.
- If McCreary is out, that is a small MIN boost (+0.2). If Darrisaw is a surprise inactive, take 0.5 off MIN and the +3 becomes a PASS. Inactives come out Sun ~8:30 AM PT.
- Sal Vetri's claim that St. Brown is "playing through an ankle injury" is accurate history but outdated: St. Brown was full Thursday and Friday.

## Market
- **Spread:** AN open DET -3 (-103), Sun 10/25 → BKR DET -3 -121 / MIN +3 +105. The paste (2:26 PM PT) and the per-game BKR board (21:26:44Z) match. BetOnline DET -3.5 +100 / MIN +3.5 -120. The juice keeps drifting toward DET at -3, but BKR still won't move to -3.5. The SuperContest line (-3.5) is half a point better for MIN than BKR.
- **ML:** opened MIN +135 / DET -162 → MIN +167 / DET -184. A steady move toward DET (+32 cents on MIN since the open).
- **Total:** AN open 46.5 (the primer shows a 47 open) → 45.5 (o -107 / u -109). The Under move has happened; the value on the Under is mostly gone.
- **Splits** (AN, 10/31 21:23Z): spread MIN 61% of bets / 54% of money, DET 39% / 46%. The DET money edge is +7, **below the 10-point sharp flag**. ML: DET 68% of bets / 61% of money. Total: over 53/52, neutral. Conflict: BetMGM had 74% of money on DET -3.5 [johnewing 10/30], and a 10/31 X post says one tracker shows 96% of money on DET [realedgenetwork]. AN is the auditable feed, so I use AN.

## Quantitative
- Power ratings [team-power-ratings-2026.json 10/28]: MIN SRS 8.46 (#1) vs DET 1.67 (#14). I discount the SRS gap for the easiest schedule to date, a 4-0 record in one-score games and turnover luck. ESPN (Schatz, 10/31) ranks the 2026 Vikings among the weakest 6-0 teams ever by DVOA. Market win-total ranks are #4 vs #9.
- Prediction markets (context only): MIN division 40% vs DET 24%.
- **Adjustments** (home-positive; carried from Friday and re-checked against the Saturday inputs):

| Driver | Pts | Source |
|---|---|---|
| DET secondary depletion (Joseph OUT, Maddox/Harper IR, McCreary Q) | -0.4 | vikings.com 10/30; secondary_matchups (tier high, 6.3) |
| MIN blitz vs Goff's pressure split | -0.3 | FTN via dossiers |
| Division road dog situation (23-10 ATS; Bet Labs systems) | -0.2 | an_primer |
| MIN offense weakness / SOS / turnover regression; Koerner -3.8; ML move to DET (the sharp spread flag has eased) | +0.6 | dossiers; youtube_picks_approved; splits |
| **Net margin_adj** | **-0.3 at -3 / -0.8 at -3.5** | within the soft cap |
| Total: MIN pace and the league-low pass-TD rate it allows vs DET scoring and the Joseph absence | **-0.5 vs 45.5** (view 45.0) | dossiers; Sharp worksheet 10/28 |

- **Simulator** (`scripts/intel/margin-simulator.mjs`, selftest PASS, Sat run):

| Run | MIN cover | push | DET cover | Over/Under | DET win |
|---|---|---|---|---|---|
| -3 / 45.5 baseline | 45.9% | 8.3% | 45.9% | 50.0/50.0 | 60.1% |
| -3 / 45.5, adj -0.3 / -0.5 | **46.7%** | 8.3% | 45.1% | 48.5/**51.5** | 59.4% |
| -3.5 / 45.5 baseline | 50.0% | 0 | 50.0% | — | 64.1% |
| -3.5 / 45.5, adj -0.8 / -0.5 (contest) | **52.1%** | 0 | 47.9% | 48.5/51.5 | 62.1% |

## Expert / podcast / article agreement
- **MIN side:** Simon Hunter (Sharp or Square; several episodes and the article count as ONE opinion, +3.5). Chad Millman (+3.5; the Discord community pick is excluded). Dave Tuley (VSiN best bet, +3.5). **New Sat: Travis Pulver (BettingPros, MIN +3 +100 / ML +142, 10/31). His ML price is stale; it is +167 now, which is better for him.** Doug Kezirian has MIN ML as a parlay leg. Fezzik and Even Money have MIN 1Q +0.5 (not comparable).
- **DET side:** Brandon Anderson (-3 -110; article and video are one opinion), Jason Radowitz (-3 -112), ESPN early picks (-3), Kendra Middleton (-3.5), **Sean Koerner (-3.5, projection -3.8)**, Even Money (-3), PFT (27-13). **New Sat: Dan Servodidio, DET ML (-170) in a parlay with T.J. Hockenson ATD.** Hockenson is **MIN** [roster-map-latest.json and espn-full-rosters-latest.json], so the parlay pairs a DET win with a Vikings TE score. That is a correlation-hedged parlay, not a strong DET side opinion.
- Props with side or total implications: Sal Vetri Goff u274.5 (X, best bet) and Trent Conner Goff u0.5 INT (both lean low DET passing). Phil Wood has Goff 2+ INT +429. These go to the props pass and are not counted here.
- Count: 4 MIN vs 7 DET (plus a DET ML parlay leg). Most DET tickets were bought at -110/-112, and DET now costs -121.

## Counter-case
- **MIN +3:** Goff (14 TD / 0 INT) is the kind of QB who punishes a 70% blitz. Minnesota's 6-0 record rests on a soft schedule and close-game luck. The ML has moved 32 cents toward DET since the open. Goff is 5-0 SU / 4-0-1 ATS vs Murray, and undefeated 3+ point dogs this late in a season are 0-4 SU.
- **Under (pass):** Joseph's absence opens deep and middle routes (DET allows 188 WR yards per game per xEP 10/31), and DET games average 58 combined points.
- **ML (pass):** at +167, the edge exists only if the 0.3-pt view holds. The market's direction is against MIN.

## Ambiguity / missing data
- The `weather` field is null; Ford Field is a dome.
- The packet lists Jay Ward as a CB; the official report lists him as a S.
- Splits conflict: AN 46% DET money vs BetMGM 74% and one tracker's 96%.
- Dossiers and FTN were not rebuilt Saturday (01:01Z / through W6).
- article_selections tags Radowitz with [DET, LAC] and lists the pick twice.
- YouTube pick rows carry no publish dates, so I could not separate Saturday episodes from earlier ones. No new sides opinion appears beyond the Friday list.
- Several web-search results were 2025 Lions-Vikings pages and were ignored.

## Pre-kickoff delta checklist
1. BKR MIN +3 drops to -104 or worse → PASS. BKR posts +3.5 at -109 or better → take +3.5.
2. DET -2.5 → PASS the side. DET -4 → re-run.
3. Inactives Sun ~8:30 AM PT: McCreary out → small MIN boost. Darrisaw or O'Neill inactive → PASS. A St. Brown or Gibbs surprise → MIN up.
4. Total 46.5 at -110 or better → Under is playable at C.
5. MIN ML +175 or better → playable at C.

## Gate notes
- missing_inputs: none. roster_vet PASS (0.3h). Kickoff not passed.
- The roster gate was not rerun (shared file). Hockenson's team was verified from the roster files.
- Price gate: the BKR paste (2:26 PM PT) and the board rows (21:26:44Z) match; no newer BKR number.
- Adjustments are within the soft cap (|0.3|/|0.8| margin, |0.5| total).
- One web check of the injury report: vikings.com 10/30 report confirmed; no change.
