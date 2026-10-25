# SF @ ATL: Week 7 game synthesis, pass `props`

As of Sat 2026-10-24 14:40 PT. Kickoff Sun 10/25 10:00 PT at Mercedes-Benz Stadium (retractable roof). Inactives come out around 08:30 PT Sun. Packet built 2026-10-24T21:33:58Z. roster_vet: PASS (13.3h; 1 INFO / 9 UNVERIFIED).
Boards: BKR player-prop board captured 2026-10-24T20:26:04Z (529 rows). BetOnline captured 2026-10-24T21:15:29Z, but it has **no player props**, only game specials. DK Predictions (2026-10-23T19:10Z) is used as a price reference only.
Game lines on the newest BKR board: SF -2 -113 / o-u 49 -108 / ML SF -141, ATL +123. That is half a point lower than the Friday paste on both the spread (-2.5) and the total (49.5).

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Basis | Tier | parlay_leg_ok | card_slot |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Brock Purdy | Pass TD Over | 1.5 | -129 | BKR | 2026-10-24T20:26Z | 14 TD in 6 GP (2.33/g), TD% 8.1%. ATL allowed 10 pass TD in 6 games and is 28th in pts/drive over the last 3 weeks | B | Y | 7a / 7d |
| 2 | George Kittle | Anytime TD | Yes | -105 | BKR | 2026-10-24T20:26Z | 5 TD in 6 GP. Red-zone alpha with Evans and Samuel out. Bowman (slot CB) is out and Sigle-type middle coverage is thin (te_middle boost) | B | Y | 7e / 7a |
| 3 | Christian McCaffrey | Receptions Over | 5.5 | -112 | BKR | 2026-10-24T20:26Z | 9-10 targets in W6, a 35% share after Evans exited (Sharp). Season TGT/RTE 28.7%. ATL allows 5.3 RB rec/g | B | Y | 7a / 7d |
| 4 | Christian McCaffrey | Anytime TD | Yes | -271 | BKR | 2026-10-24T20:26Z | 7 rush TD in 6 GP, 45.8% of SF carries. **Shorter than -200: flag** | C (anchor only) | Y (count it as a heavy leg) | 7e / 7d |
| 5 | George Kittle | Receptions Over | 5.5 | -106 | BKR | 2026-10-24T20:26Z | 26 rec in 6 GP (4.3/g) with Evans soaking 24% of targets. That target share now flows to Kittle and CMC | C | Y (correlates with #2) | 7d |
| 6 | Michael Penix Jr. | Pass TD Under | 1.5 | -142 | BKR | 2026-10-24T20:26Z | 6 TD in 4 GP. Run-first ATL (49.4% rush), and Bijan takes the RZ carries. SF has allowed 7 pass TD in 6 games. Morris (SF DC) is expected to pressure him. Pairs with the Under | C | Y | single / 7a |
| 7 | Brandin Cooks | Receptions Over | 1.5 | -240 | BKR | 2026-10-24T20:26Z | Projected top outside WR with Evans and Samuel out. **Shorter than -200: flag.** Kirk was activated Saturday and cuts into his share | C (filler) | Y (heavy leg) | 7a |

Tackles + assists (Andy's best category) are a **PASS: no captured row**. BKR has no tackle markets on the board and BetOnline has no player props. Watch item: Fred Warner T+A if a line posts. ATL is running 49% of the time, and SF is missing LBs Wallow and Gifford, so his volume should rise (he made 8 tackles in W6).

**Anytime-TD candidates (7e):** Kittle -105 (B). McCaffrey -271 (anchor, flag). Drake London +125 (C value: alpha with a 28.8% target share but 0 TD on 47 targets, so regression plus RZ role). Kyle Pitts +239 (C: 3 TD, and SF lost S Sigle, giving a te_middle boost). Cooks +289 (longshot). Bijan Robinson -373 is **past the -350 barrier**, so he is excluded from stacks (DKP ref -223 Fri, so BKR is heavily juiced).
**First-TD candidates (8a):** McCaffrey +383, Bijan +363, Kittle +660 (Tight Ends Day / scripted-opener angle), London +823.
**2+ TD (8b):** Bijan +170, McCaffrey +223. Both are realistic legs. Three legs won't reach +7000 without a Kittle +601 leg.
**Same-game SGP shape (BKR, 7d):** Purdy o1.5 TD + Kittle ATD + CMC o5.5 rec, all positively correlated. AN's alternative is Kittle ATD + Under 50 (+435 at publish). The Under is now 49 on BKR.
**Multi-game (BEO):** not possible here because BetOnline has no player-prop rows captured. If a BEO stack wants this game, use at most 2 legs (Purdy o1.5 TD, Kittle ATD), repriced once a BEO board exists.

## Game script

This builds on the sides pass (reports/intel/games/2026-w07-game-SF_at_ATL-sides.md). The likeliest result is SF winning by 3 to 7 in a mid-to-high-40s game. The simulator at the current BKR line (ATL +2 / 49, adj -0.5 / -1.0) gives SF 57% to win, a 48 median total and a 15.9% chance of a 3-point margin [Source: scripts/intel/margin-simulator.mjs run 2026-10-24T21:38Z]. Without Evans (24% target share, 42.7% of air yards) and Samuel, SF's tree narrows to Kittle and McCaffrey, with Cooks, Kirk and Watkins outside [Source: FTN receiving usage via ftn-stats-iq-weekly-synthesis-context-latest.json, through W6]. SF's drives run long (5.8 plays, 166 sec), and its RZ TD rate is 0.85. That supports TD-scorer legs on Kittle and CMC and passing TDs for Purdy over yardage. ATL runs first, and Penix collapses under pressure (EPA/DB -1.13 when pressured) [Source: ATL dossier FTN QB pressure].

## QB / availability

- QBs: Purdy (SF) and Penix (ATL), both Andy-confirmed. Dalton is inactive [Source: qb_operator_notes; availability ATL 2026-10-21].
- **SF Out:** Bosa, Mike Evans, Deebo Samuel, Sigle, Wallow, Gifford. **Q:** Upton Stout. **Christian Kirk was activated from IR Saturday and his Q tag removed** [Source: Rotowire game page, fetched 2026-10-24]. Kirk's BKR rows show as unavailable (board pulled while he was Q). His return trims Cooks and Watkins volume, which is why Cooks is only a C filler and Watkins gets nothing.
- **ATL Out:** Bowman (slot CB), Deablo (LB), Brian Robinson (RB; Herbert backs up Bijan), Jerrell (OT), Beaux Collins (WR, IR). **Q:** Za'Darius Smith, Zaccheaus, C.J. Henderson, Daniels. **A.J. Terrell was activated from IR Saturday**, likely to play [Source: Rotowire; AJC 10/21]. If Terrell plays, outside WR props lose some appeal. Kittle and CMC (middle and underneath) are unaffected.
- Questionable-player rule: no prop above is on a Q player. Zaccheaus (Q) is excluded.

## Market notes

- Kittle ATD: AN and Brandon Anderson published at +130, BKR is now -105 and DKP was +122 on Friday. That is about 35 cents of Tight Ends Day steam. Still B, but **playable only to -120**. At -125 or shorter it drops to C.
- CMC receptions: experts published o5.5 and 6+ at +145. BKR main line o5.5 -112 (alt 4.5 -357 is past the barrier, 6.5 is +166). Playable to -125.
- Purdy pass TD o1.5: -129 main, -139 on the alt ladder. Playable to -145.
- BKR ATD prices run well over DKP on favorites (Bijan -373 vs -223, CMC -271 vs -213), so there is no edge on BKR for those. If Andy builds 7e elsewhere, the DKP reference prices are better (DKP is reference only and not executable).

## Expert agreement

- **Kittle ATD:** Action Network (Tight Ends Day, scored in 3 of the last 4 NTEDs), Brandon Anderson (YouTube; same person as AN, counted as one opinion), plus the AN SGP Kittle ATD + Under 50 [Source: expert_picks_pull 2026-10-23T13:53Z; youtube_picks_approved]. No dissent found.
- **CMC receptions over 5.5:** Warren Sharp (35% target share W6; ATL allows 5.3 RB rec/g) and Action Network/Anderson (6+ +145, 7+ +245). Two independent sources.
- No experts on the Purdy TD or Penix props. Those rest on the data alone.

## Counter-case

- **Purdy o1.5 TD:** SF's RZ work goes to McCaffrey on the ground (7 rush TD). Without Evans, SF may lean on the run with a lead, and a 23-17 style game gives one passing TD.
- **Kittle ATD:** at -105 the steam has removed most of the value. Terrell's return lets ATL roll coverage toward Kittle, and CMC vultures RZ TDs.
- **CMC o5.5 rec:** Kirk's return restores a slot outlet. A positive script means more carries and fewer checkdowns. His season average is 4.7 rec/g.
- **CMC ATD -271:** a heavy leg. Legs from -151 to -199 hit only 43% this season, and legs at -200 or shorter hit 69% vs 73% implied.
- **Penix u1.5 TD:** with Bosa out, SF's rush is weaker, ATL could trail and throw late, and Pitts and London get RZ looks.
- **Cooks o1.5 rec:** Kirk and Watkins split the WR targets, and Cooks could finish with 1 catch.

## Ambiguity / missing data

- missing_inputs: "betonline player-prop board thin/missing (48 rows)". BEO multi-game legs can't be priced (capped at C or omitted).
- No tackle markets captured on any executable board, so Andy's preferred T+A category is unusable for this game.
- Bijan main rush/receiving rows are unavailable on BKR (suspended at capture), and only alt rows exist. No Bijan yardage pick.
- Roof status is unconfirmed. It's a retractable roof, so weather is treated as moot.
- Drake London receptions (o5.5 -131) were excluded under Andy's rule (receptions only for the expected winner). ATL is the underdog.

## Pre-kickoff delta checklist

1. Kittle ATD shortens past -120: tier C. Past -150: drop from 7e.
2. Kirk confirmed active with a full snap role: Cooks o1.5 dropped. Kirk inactive: Cooks becomes B-.
3. A.J. Terrell inactive: Kittle and Cooks get a small boost, and Purdy o1.5 TD becomes B+.
4. Purdy o1.5 TD goes past -145: C.
5. CMC o5.5 rec goes past -125: C. If BKR moves the line to 6.5, pass.
6. Game total drops to 47.5 or lower: downgrade Purdy TD and the ATD legs one tier. Penix u1.5 is unaffected.
7. A T+A line posts for Warner: evaluate as a B candidate.

## Gate notes

- missing_inputs: BetOnline player props missing. Noted, and BEO legs left unpriced.
- roster_vet PASS (13.3h, 9 UNVERIFIED). Not rerun. All recommended players are on the BKR board and in the packet availability/FTN data. Kirk and Terrell activations were verified by web search.
- Kickoff not yet passed, so forward picks are valid.
- Final injury designations came from the Rotowire game page (Saturday activations included).
- Coach names in secondary_matchups (Lake/Sorensen) were ignored. The ATL dossier's HC line is stale (historical_context_only).
- No model probabilities are given for props. The simulator is context only.
