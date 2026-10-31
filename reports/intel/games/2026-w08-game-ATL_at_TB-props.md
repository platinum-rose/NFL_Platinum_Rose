# ATL @ TB — Week 8 game synthesis, pass `props`

As of: Fri 2026-10-30 ~11:40 PM PT (2026-10-31T06:40Z) · Kickoff: Sun 11/1 10:00 AM PT (inactives ~8:30 AM PT) · Packet built 2026-10-31T06:09Z · roster_vet: PASS (roster 8.5 h old) · Board: BKR per-game file, capturedAt 2026-10-31T01:51Z (Fri 6:51 PM PT) [Source: prop_boards.bookmaker]

## Recommendation box

| Player | Market | Line | Price | Book | capturedAt | Projection / basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|
| Bijan Robinson | Rush yds **UNDER** | 80.5 | -108 | BKR | 01:51Z | ~68 (≈19 car × 3.6). TB allowed team rush yds of 106/44/78/86/50/89/88. No opponent's whole team has topped 106 | **B** | y (fits Under 43.5) |
| Kyle Pitts | Receptions **OVER** | 3.5 | -106 | BKR | 01:51Z | ~4.3 (5/5/5 rec in the last 3 games on 6/7/5 targets) | C | y |
| Drake London | Receptions **OVER** | 6.5 | +110 | BKR | 01:51Z | ~6.4–6.8 (10 targets in each of the last 3 games, 29% target share) | C | y (not with Penix under legs) |
| Cade Otton | Rec yds **UNDER** | 33.5 | -108 | BKR | 01:51Z | ~27 (season 26.6/g. Last 3 games 25/4/0. 5 of 7 games under) | C | y |
| Michael Penix Jr. | Pass TD **OVER** | 1.5 | +144 | BKR | 01:51Z | ~44% (rough Poisson estimate: ATL TDs come through the air because TB has allowed only 2 rush TDs in 7 games) | C | n (cuts against Under 43.5) |
| Baker Mayfield | Pass yds | 213.5 | -108 | BKR | 01:51Z | Full games 216/182/217. ATL allows 271 pass yds/g | **PASS** | — |
| Chris Godwin | Rec yds / rec | 40.5 / 4.5 | -110 / +101 | BKR | 01:51Z | 6 of 7 games under, but Egbuka (OUT) leaves 8 targets/g behind | **PASS** | — |
| Bijan Robinson | Rec yds | 29.5 | -118 | BKR | 01:51Z | TB allows only ~36 RB rec yds/g total. Brandon Anderson's escalators disagree | **PASS** | — |

Penix pass yds 228.5 is a PASS (median 225, conflicting volume vs wind). Bucky Irving has no BKR rush row, so there is no Irving yardage pick.

**7e Anytime-TD candidates (BKR):**
- Bucky Irving -126 (listed on BKR as "Mar'Keise Irving"). Anchor, about fair (~54% est.), C.
- Kyle Pitts +241. Best value, est. ~34%, C.
- Chris Godwin +191. About fair now that Egbuka's red-zone share is vacated.
- Sean Tucker +420. Fair longshot vulture.
- Bijan Robinson -267. Chalk only. Overpriced vs my ~55% estimate (DK Predictions ref -170).

Drake London +140 is overpriced (1 TD in 7 games).

**8a First-TD candidates (BKR):** No price is above fair because the market's hold eats any edge. The least overpriced, in order:
1. Kyle Pitts +991 (est. ~8%)
2. Bucky Irving +450 (est. ~15%)
3. Bijan Robinson +363 (est. ~16%)

ATL is 7-0 to the 1Q over, and Bowles's teams are 3-13-1 SU in the 1H off 10+ point wins [an_primer]. That tilts the first score slightly toward ATL. All TD percentages are rough share-of-team-TD estimates, not model probabilities.

## Game script

This agrees with the sides pass (Under 43.5 C, lean TB -2.5, fair TB -3 / 42.5) [Source: reports/intel/games/2026-w08-game-ATL_at_TB-sides.md]. Implied scores are roughly TB 22.5 / ATL 20. BKR team totals are TB 22.5 and ATL 20.5 [board].

TB's run defense is elite:
- Rush DVOA -21.5%, stuff rate 25%.
- 518 rush yds and 2 rush TDs allowed in 7 games [FTN via TB.md].

That pushes ATL into Penix dropbacks against a 42% blitz. Penix is quick (TTT 2.31) and leans on London and Pitts underneath. TB's zone-heavy, two-high shell carries hot-read and underneath-volume weakness tags [secondary_matchups].

TB, without Egbuka, grinds with Irving (21/19/24 carries over the last 3 games). The wind forecast (~13 mph, gusts ~18, 45% rain) favors volume/short-area overs and yardage unders [weather].

## QB / availability

- QBs: Penix (ATL) and Mayfield (TB) confirmed [qb_operator_notes].
- ATL: RB Brian Robinson Jr. OUT. He had 4 rush TDs and 26% of snaps, so Bijan inherits the goal-line work. WR Olamide Zaccheaus Q (minor role).
- TB: WR Emeka Egbuka OUT (24.7% target share, 3 TDs). RB Kenny Gainwell Q (hip, expected to play). RT Luke Goedeke Q (calf).
- If Gainwell is out, Irving's ATD and First-TD odds improve and Tucker gains a role. If Goedeke is out, Mayfield faces more pressure, which reinforces passing unders and does not change the picks.
- The web search for a Friday final report only surfaced the 10/28 buccaneers.com report. Designations come from RotoWire 10/30 and the operator notes.

## Market

- Every prop row is a single BKR capture (01:51Z). There are no earlier prop prices, so I can't compute movement. Game lines on the board match the sides pass (TB -2.5 -108, 43.5).
- BetOnline has no player-prop rows yet (32 game-level rows). Its game TD total is 5.5 (u -155), roughly 4.9 expected TDs, which matches my 2.6 TB + 2.3 ATL split.
- DK Predictions (ref only, 10/29):
  - Bijan ATD -170 vs BKR -267. BKR is much worse.
  - Pitts +285 vs BKR +241.
  - Irving -127 vs BKR -126. Same.
- Splits: sharp money on the Under (70% of bets / 47% of money) [splits]. That supports the yardage unders.

## Quantitative (pbp 2026 W1–W7, data/nflverse/2026/play_by_play_2026.csv.gz)

- **Bijan rush:** 83/72/194/145/86/61/63 (last 3 games: 86/61/63). In W7, with BRob out, he had 20 carries for 63 yds. Season YPC 5.4, YDOE +101.
- **TB rush D:** 3.4 YPC allowed. Opponents rush only 34% of plays against TB.
- **Bijan receiving:** 8/3/2/1/4/2/5 rec, 90/9/19/2/32/-8/45 yds. TB allows 6.3 RB targets, 5.4 rec and 36 yds per game to all RBs combined.
- **London (Penix starts W3–7):**
  - Receptions 9/5/7/4/7: 3 of 5 over 6.5.
  - Yards 194/96/118/62/66.
  - TB defense: catchable-ball rate 76.9%, 66.7% "open".
- **Pitts:**
  - Last 4 games: 3/5/5/5 rec.
  - TDs: 4 in the last 3 games.
  - TB has allowed TE TDs to Gesicki, Kraft, Waller and Whiteheart.
- **Otton:** 3/5/3/4/3/1/0 rec and 26/38/56/37/25/4/0 yds. Snap share 94%, but YDOE -53.
- **Godwin:** 4/3/3/6/3/4/4 rec and 40/46/25/31/37/37/27 yds. He's the "alpha" slot target vs ATL's match-quarters.
- **Mayfield:** full games 216/182/217 yds. ATL has allowed 286+ passing in 5 of 7 games on 40 att/g. That conflict is why Mayfield is a PASS.
- **Penix:** 9 TD and 1 INT in 5 starts. 256/223/240/225/213 pass yds.
- **TD scorers vs ATL D:** 8 RB TDs in 7 games (Kamara ×2, Swift ×2, Henry, McCaffrey, Hubbard, Juszczyk). TB's RBs scored in 4 of 7 games, Irving in 3 of 7 (5 TDs).

Simulator (`--selftest` passed; -2.5/43.5, adj +0.5/-1.0): mean margin TB +2.4, mean total 42.5. Used only to frame team scoring; props carry no model probability.

## Expert agreement

- **For:**
  - Bucky Irving ATD: @thepropguru_ (5 TDs, 66.7% of TB red-zone carries over the last 3 games, ATL allows 1.3 RB TDs/g) [pick_signals].
  - Under 45.5 game: Brandon Anderson and Fezzik. Same direction as the yardage unders.
- **Against:**
  - Bijan rush under: Sal Vetri (Over 79.5 on volume, 80%+ snaps). Cody Brown (Bijan 60+ alt, and Irving 40+ alt, in a 22-leg "100% hit-rate" parlay; alt legs aren't comparable).
  - Bijan receiving PASS: Brandon Anderson (40+ +225, 50+ +400, 80+ +2000 escalators; longshot ladders aren't comparable to 29.5).
- No expert on Pitts, London, Otton or Penix TD props.

## Counter-cases

- **Bijan U80.5:** With BRob out he could see 22+ carries, and one 25-yd run flips it. He hit 145 and 194 earlier. TB's 74 yds/g allowed partly reflects opponents passing while leading.
- **Pitts O3.5 rec:** Wind and a TB blitz could shift targets to Bijan checkdowns. Pitts went 0–1 rec in 3 of the first 4 games (route share 68%).
- **London O6.5:** Wind and rain lower catch rate (London is at 67%). TB's 42% blitz can cause sacks and throwaways. He had 4 rec on 10 targets in W6.
- **Otton U33.5:** Egbuka's 8 targets/g need a home, and ATL's match-quarters carries the "te_middle_boost" tag. Otton was a 5-rec / 38-56 yd player in September.
- **Penix O1.5 TD:** If ATL scores at the goal line on Bijan runs (he now has the BRob share), passing TDs fall. Wind also caps attempts.

## Ambiguity / missing data

- missing_inputs: the BetOnline player-prop board is thin/missing. All picks are BKR-only, so re-run when BOL posts (Saturday ~2 PM).
- No per-player defensive split by position beyond the pbp aggregation. The RB/TE identification for TB's allowed TDs is by name.
- The BKR ATD name "Mar'Keise Irving" is mapped to Bucky Irving (only TB Irving; packet roster lists Bucky Irving).
- The TD-share percentages are judgment estimates.

## Pre-kickoff delta checklist

1. Gainwell inactive: Irving ATD to B, Irving First-TD +450 becomes playable. Tucker +420 drops off.
2. Zaccheaus inactive: no change (slot targets to London, Pitts and Dotson help the London/Pitts overs slightly).
3. Goedeke inactive: hold. A Mayfield yds under becomes C only if the price moves to 205.5 or lower.
4. Game-day wind under 8 mph and dry: drop the Otton under to PASS and make London O6.5 B.
5. Price limits:
   - Bijan U80.5: pass at 74.5 or lower.
   - Pitts O3.5: pass at -130.
   - London O6.5: pass at -115.
   - Otton U33.5: pass at 29.5.
   - Penix O1.5 TD: pass at +125 or shorter.
6. Re-check the BOL board Saturday ~2 PM for better prices on all five.

## Gate notes

- missing_inputs: "betonline player-prop board thin/missing (32 rows)". BKR is the only executable book, and nothing is capped beyond the noted tiers.
- roster_vet PASS (8.5 h). Kickoff has not passed.
- player-availability rows have no summaries for the key skill players. Status comes from operator notes and RotoWire.
- The web search for Friday final reports returned only the 10/28 TB report.
- No paid calls, no DB writes, no git.
