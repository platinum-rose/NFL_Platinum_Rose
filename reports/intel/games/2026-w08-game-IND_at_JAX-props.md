# IND @ JAX — Week 8 2026 game synthesis, pass `props`

- As-of: Fri 2026-10-30 11:35 PM PT (2026-10-31T06:35Z)
- Kickoff: Sun 11/1 10:00 AM PST (18:00Z), EverBank Stadium, outdoor. Inactives come out about 8:30 AM PT.
- Packet built_at: 2026-10-31T06:09:18Z (scratch/w08-game-synthesis-queue-props.json) · roster_vet: **PASS** (8.5 h old)
- Executable board: BKR per-game file `data/generated/props/bookmaker-live-2026-10-31-colts-at-jaguars.json`, capturedAt **2026-10-31T01:51:25Z** (583 rows). BetOnline has game specials only (no player props). The DraftKings Predictions board (10/29 03:20Z) is used as a reference only.
- Anchored to the sides pass (`2026-w08-game-IND_at_JAX-sides.md`): Under 46 (B), JAX SU (conf 14), spread PASS. Projected script is a 24-27 to 13-17 JAX win, JAX leading on the run and play-action, and IND chasing against a pass-funnel defense.

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Projection / basis | Tier | Playable-to | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Jonathan Taylor (IND) | Rush yds **UNDER** | 57.5 | -113 | BKR | 01:51Z | ~50 (16 att × 3.2) | **B** | u54.5; pass at 52.5 or below, or past -130 | y (with Under 46, JAX ML) |
| 2 | Bhayshul Tuten (JAX) | Carries **OVER** | 14.5 | -124 | BKR | 01:51Z | ~17 (15.7/g season, lead script) | **B** | o14.5 to -140; o15.5 only at -101 or better (alt row) | y |
| 3 | Tyler Warren (IND) | Receptions **OVER** | 4.5 | -106 (alt ladder) | BKR | 01:51Z | ~5.5 (6.0 rec/g, 97% catchable) | **B** | to -125; pass at 5.5 | y |
| 4 | Daniel Jones (IND) | Pass TD **UNDER** | 0.5 | +171 | BKR | 01:51Z | P(0) ~41% (fair ~+145) | C | to +150 | y (with Under / JT under) |
| 5 | Daniel Jones (IND) | Completions **OVER** | 19.5 | -111 | BKR | 01:51Z | ~21 (21.7/g, trailing, funnel) | C | to -120; pass at 20.5 | y, but not with #4 in a small SGP |
| 6 | Parker Washington (JAX) | Rec yds **OVER** | 69.5 | -104 | BKR | 01:51Z | ~72 (69/g; slot CB Walley out) | C | to 72.5; **B if Meyers is inactive** | n with Under 46 |

Passes: Tuten rush yds o66.5 (market already moved 6 yds past the experts' 60.5), JT carries u15.5 -108 (a cleaner way to play #1, so don't double it), Lawrence pass yds 240.5 and pass TD 2.5 (fair, near the line), Downs rec/yds (trade-request noise), Strange rec o3.5 -137 (price). No QB INT legs.

**7e Anytime-TD candidates (BKR 01:51Z; DK ref in parentheses)**
1. Jonathan Taylor **-125** (DK -122). 7 rush TD in 6 games and ~40% of IND TDs. Fair is about -110, close to the price, and it's the best BKR ATD value. C.
2. Bhayshul Tuten **-126** (DK +100). He has the volume, but BKR is juiced by about 6% vs DK. Fair is about +100. C, high-probability leg.
3. Parker Washington **-126** (DK +113). 4 TD on 46 targets. Juiced at BKR too. C.
4. Brenton Strange +171 (DK +223) · 5. Jakobi Meyers +187 (Q; DK +213) · 6. Tyler Warren +201 (DK +270) · 7. Chris Rodriguez Jr. +219 (DK +355; goal-line role).
BKR prices JAX's secondary scorers well short of DK. For 4-7, shop or use them only to fill the 7-leg ATD build.

**8a First-TD candidates (BKR)**: Jonathan Taylor **+597** (DK +525, best price relative to fair ~+600) · Bhayshul Tuten +527 (DK +456; fair ~+590) · Parker Washington +562 (DK +488) · Chris Rodriguez Jr. +1083 (Erickson's pick was at +1700 elsewhere; BKR is shorter) · longshot Travis Hunter +1353 (Welsh's pick was at +3000 elsewhere; BKR doesn't match it).

## Game script
JAX is coming off its bye with an elite run defense (rush DVOA -31.1%, 33.9% success allowed, 72 rush yds/g allowed) but a soft pass defense (pass DVOA +5.4%, CPOE +5.4%, 65% of opponent plays are dropbacks). That's a clear **pass funnel** [JAX dossier, FTN through W6]. IND just traded G Quenton Nelson and DT DeForest Buckner [qb_operator_notes]. Expect JAX to lead and lean on Tuten/Rodriguez with ~60 plays. IND should chase through Warren and Keenan Allen on short throws, with Taylor's carries squeezed. That's consistent with the sides pass: JAX TT 28.5 / IND TT 17.5, Under 46.

## QB / availability
- QBs (Andy-confirmed): **Daniel Jones** (IND), **Trevor Lawrence** (JAX) [qb_operator_notes].
- IND: WR Anthony Gould OUT. TE Drew Ogletree Q. CB Justin Walley (slot) OUT. TE Tyler Warren is "good to go" (groin). WR Josh Downs will play despite his trade request. CB Sauce Gardner will play [availability 10/29-30; news_notes PFT/ESPN].
- JAX: WR Jakobi Meyers **Q** (hamstring/ankle, missed Fri). S Antonio Johnson OUT. RB LeQuint Allen Jr. was limited (hamstring).
- **If Meyers is OUT:** Washington moves to B, and Strange gets a small receptions bump. **If Allen Jr. is out:** Tuten's carries get stronger (Rodriguez is the only other back). **If Warren is a surprise inactive or limited:** void #3, and Jones's completions drop to PASS. **If Taylor is traded or inactive:** void #1 and all JT ATD/FTD; Seth McGowan (11 carries in W7) takes the role.
- The one web search for the final Friday reports returned no 2026 W8 pages. Designations come from the packet.

## Market
- Movement: Tuten rush yds went 60.5 (Hribar, Anderson at -114/-115) to **66.5** at BKR. Washington rec yds went 65.5 (Anderson) to **69.5**. JT carries went 16.5 (Erickson u-118) to **15.5** at BKR. So the analyst leads are priced out by 1-6 units, and the remaining value is in the props the market hasn't moved.
- Game line: JAX -10 / 46. AN splits show JAX 64% of the money vs 56% of bets (+8, below the sharp flag) and Under 52% of the money [splits 02:06Z].
- BetOnline team TD totals (10/29 23:10Z): IND o1.5 TDs -180 / JAX 3.5 u-155, game TD 5.5 u-145. That's a TD environment consistent with the Under.

## Quantitative basis (props have no calibrated model; these are usage projections, not model probabilities)
- **Taylor:** 122 att / 492 yds (4.0 ypc) in 6 games, 73% rush share [FTN rushing usage]. Against a -31% rush DVOA defense, with a degraded OL and a negative script, plus McGowan getting 11 carries in W7, the projection is 15-16 att at ~3.2 = ~50 yds.
- **Tuten:** 94 att in 6 games (15.7/g), 56% carry share, Rodriguez 23%. In leading scripts JAX's rush rate rises off its 44% base. IND is 27th in YPC allowed and lost Buckner [Hribar; dossier].
- **Warren:** 30 rec on 36 targets in 5 games, 22% TPRR, 97% catchable. JAX's LBs allow 67-75% catch rates (Oluokun 18/24, V. Miller 10/15) [FTN coverage].
- **Jones:** 4 TD / 6 INT, TD% 1.8, 21.7 comp/g. JAX has allowed 7 pass TD in 6 games. A blended λ of ~0.9 gives P(0 pass TD) ≈ 41% vs the 36.9% implied by +171.
- **Washington:** 46 targets (25.7% share), 2.36 YPRR, 69 yds/g. IND's slot CB Walley (31 targets, 77% allowed) is OUT [secondary_matchups; FTN coverage].

## Expert / podcast agreement
- **Tuten over:** Rich Hribar (o60.5), Brandon Anderson (o60.5, "Bijan Tuton" in the pull = Tuten). Sal Bets has Tuten 2+ TDs. This pass expresses it through carries because the yardage number moved.
- **Washington over:** Brandon Anderson (o65.5 and 100+ escalator +300).
- **JT under:** Andrew Erickson (attempts u16.5). Seth Woolcock has IND TT u18.5, which fits #1 and #4.
- **FTD longshots:** Chris Welsh (Hunter +3000), Erickson (Rodriguez +1700). Neither price is matched at BKR.
- Cody Brown's alt legs (Lawrence 175+, Meyers 25+) are part of a 22-leg parlay and aren't comparable to the main lines.
- Nobody in the packet takes the other side of the six picks. That's a thin-disagreement caution, not a confirmation.

## Counter-case
1. **JT under:** He's IND's only efficient engine, with 7 TD and a 20 att/g base. One 40-yard run wipes out the under. If IND keeps it within 7, he gets 20+ carries.
2. **Tuten carries:** Rodriguez (goal line) and Allen Jr. could take series off the bye. A Lawrence passing day (he had 4 TD vs HOU) cuts the run share.
3. **Warren:** Groin. A JAX blitz-heavy press-man scheme could make Jones look outside or take sacks (7.3% sack rate).
4. **Jones U0.5 TD:** Garbage-time TDs against a soft pass defense. JT stealing TDs is the case for this pick, but a short-field pass TD after a Lawrence turnover beats it.
5. **Jones completions:** IND could be run-dominant early, or Jones could be benched or turnover-limited. 59.6% comp%.
6. **Washington:** A run-heavy JAX lead caps his volume. 16 yd/rec is boom-bust, and the Under script works against him.

## Ambiguity / missing data
- BetOnline Sunday player props aren't posted (`missing_inputs`). Re-run Saturday around 2 PM for a second executable book. No pick here depends on BetOnline.
- BKR's Warren receptions and rec-yds come from the alt-ladder rows only (no main O/U pair), so the price is real but the vig is unknown.
- BKR lists Josh Cameron ATD at +209 (DK +400) despite 0 targets in W6. It's likely a pricing or label oddity, so ignored.
- FTN JAX tables are through W6 (bye) and IND's are through W7. Player-level W7 IND usage isn't in the packet beyond the ESPN notes.
- The availability feed has known misclassification bugs (it lists a 2025 "Travis Hunter (CB) OUT" row, which is stale and ignored).

## Pre-kickoff delta checklist
1. 8:30 AM PT inactives: Meyers OUT moves Washington to B. Allen Jr. OUT strengthens Tuten. Warren or Taylor inactive voids #1/#3 and their TD legs.
2. JT rush yds drops to 54.5 or lower, or past -130: pass #1. Tuten carries moves to 15.5 at worse than -101: pass #2.
3. Spread goes to JAX -11.5 or more (bigger script): all six strengthen slightly. Spread goes to -8.5: Tuten and JT under drop to C.
4. Jones TD price moves under +150: pass #4. Warren moves to 5.5: pass #3.
5. Saturday BetOnline props post: compare and take the better number.
6. Any Taylor trade news before kickoff (deadline 11/10) voids all JT legs.

## Gate notes
1. `missing_inputs`: the BetOnline player-prop board is thin (22 rows, specials only). That's noted. No pick depends on it, so no tier cap was applied.
2. roster_vet PASS (8.5 h). Every player's team and status comes from the packet or availability. IND: Taylor, Warren, Downs, Allen, Treadwell, McGowan. JAX: Tuten, Rodriguez, Washington, Meyers, Strange, Hunter, Thomas Jr.
3. Kickoff hasn't happened, so these are forward picks.
4. The one web search for the final Friday reports returned only old pages. Designations come from qb_operator_notes and the availability feed.
5. Coach names in `secondary_matchups` were ignored. HCs per the dossiers: Steichen, Coen.
6. The simulator wasn't used. Props have no calibrated joint model, and the game-level sim runs are in the sides pass.
