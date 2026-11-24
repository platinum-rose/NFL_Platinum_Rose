# W12 Thu CHI@DET — matchup deep-dive (runbook §3a evidence file)

Built: Tue 2026-11-24 ~12:15 PM PT (Claude). Thanksgiving opener, Ford Field, Thu 11/26 (confirm kickoff on the live board). Proposals only. Nothing placed or logged. No stacks yet (the island 3-tier template comes after all five game files).

**Data window.** All from `reports/bets/2026-w12-matchup-splits.md`: nflverse PBP thru W11 (incl. MNF), FTN charting (no MNF yet), FTN Stats IQ capture 2026-11-24. Slot/outside alignment has no source → **alignment: manual**.

**Line (conflicting, capture before use).** Fox Sports Thanksgiving board: DET −2.5, ML DET −126 / CHI +108, O/U 53.5. Cleatz early snapshot: DET −2.5 (−115) / CHI +2.5 (−105), 52.5, ML DET −142 / CHI +120. The spread agrees and the total is 1 pt apart. Take the live Bookmaker/BetOnline number before building. W11 lesson: model totals ran +4.1 high, so there's no over lean from the numbers alone (S22).

## Roster gate (strict) — PASS
`npm run roster:vet -- --week 12 --date 2026-11-24 --fetch --strict --card <gate list>` → PASS, ESPN rosters 2026-11-24T03:01Z (2,569 players). **The first pass BLOCKED two memory names: DJ Moore (now BUF) and David Montgomery (now HOU).** Both were dropped and neither is used anywhere below. Gate caveat: plain-name rows only get team-checked (legs resolved = 0). Injury status below comes from `data/player-availability/latest.json` (latest event per player, thru 11/24).

Status inputs:
- **CHI out:** Cole Kmet (IR), Kyler Gordon (OUT, CB), Case Keenum (OUT), Keyshaun Elliott (OUT), Jayden Loving (OUT), Beanie Bishop Jr. (suspension).
- **CHI questionable:** Roschon Johnson.
- **CHI active news (no tag):** Caleb Williams, Swift, Monangai, Burden, Odunze, Loveland, Raymond.
- **DET IR/out (defense, heavy):** Aidan Hutchinson (IR, knee), Jack Campbell (IR), Damone Clark (IR), Devin White (IR), D.J. Reed (OUT), Ennis Rakestraw Jr. (OUT), Keith Abney II (OUT), Mekhi Wingo (OUT), Tyrus Wheat (OUT), Amen Ogbongbemiga (OUT).
- **DET questionable:** Joe Bachie. DET skill players (Goff, Gibbs, St. Brown, J. Williams, LaPorta, TeSlaa, Vaki) have no tag.
- Wed 11/25 practice estimates and the final report decide this. Re-vet the morning of the game.

## Season splits (from the splits file)
| Metric | CHI | DET |
|---|---|---|
| Off. designed-run YPC (rank) | 4.25 (11th) | 4.73 (5th) |
| Def. YPC allowed (rank, 1 = most) | 4.21 (11th) | 3.77 (23rd) |
| Off. EPA/dropback | 0.067 | **0.203** |
| Def. EPA/db allowed | −0.039 | **0.103** |
| Def. EPA/db allowed L / M / R | −0.001 / 0.19 / 0.025 | −0.026 / **0.556** / 0.293 |
| Def. blitz (FTN BLZ%, rank) | 34.3% (10th) | 27.0% (20th) |
| Def. EPA allowed vs blitz | 0.345 | 0.273 |
| Def. WR / TE / RB rec yds allowed per game | 151.1 / 46.9 / 36.1 | 147.5 / **74.0** / 31.8 |
| QB scramble rate (league 4.9%) | 6.6% (Caleb Williams) | 1.9% (Goff) |

## §3a checks

**1. Alignment (WR/TE) — matchup data: manual.**
- CHI vs DET: DET's middle of the field is the softest spot in this game (0.556 EPA/db allowed, vs 0.29 to the right and −0.03 to the left). The middle-field profiles are Loveland (aDOT 6.7) and Burden (7.5), so they're the natural beneficiaries. Odunze (aDOT 14.4) is a perimeter/deep profile. Who aligns where is unsourced.
- DET vs CHI: **CHI slot CB Kyler Gordon is OUT** (availability file 11/23). St. Brown's 2026 slot share is unsourced, so the "slot CB out" upgrade stays manual and is a tiebreaker only.

**2. Coverage shell (FTN).**
- DET D: man 38.0% (11th) / zone 58.8%; single-high 57.2% / two-high 33.6%. EPA/db allowed: man 0.023, **zone 0.212**, 1-high 0.029, **2-high 0.37**. DET is soft in zone and very soft in two-high.
- CHI D: man 35.4% / zone 63.8%; 1-high 54.5% / 2-high 41.6%. EPA/db: man 0.035, zone −0.081, 1-high −0.028, 2-high −0.09. CHI's zone is good and its man coverage is the weak spot.
- CHI receivers vs DET: **Loveland fit 1.50 vs 1.33 (+13%, FAVOURED; 1.82 vs 1-high)**. **Raymond +14% FAVOURED** (small role, 45 targets). Burden +9% neutral, but 3.28 YPRR vs two-high (DET's worst shell). Odunze +4% neutral (2.04 vs zone). Swift −5%.
- DET receivers vs CHI: St. Brown, LaPorta, Gibbs and J. Williams are all +1 to +3% neutral. **St. Brown is 2.71 vs man**, which is CHI's weaker family. J. Williams is 1.27 vs man / 2.21 vs zone, so CHI's zone-heavy mix suits him poorly. TeSlaa and Vaki are below the FTN route minimum.

**3. Low-blitz D + scrambling QB → QB rush — no look (borderline for CHI).** Caleb Williams scrambles at 6.6% (above league), but DET is a mid-pack blitzer (27.0%, 20th), not a low-blitz team. With Hutchinson on IR, DET's pass rush is thinner. **Caleb rush yards is price-only**, not a §3a lead. Goff: no.

**4. TE-leak defense → TE TD.**
- **CHI side: LOOK.** DET is 3rd most in TE yds allowed (74.0/g) and **1st in TE TDs allowed**. DET's LB room is gutted (Campbell, Clark and White on IR). With Kmet on IR, Loveland is the only TE with volume (60 targets, 18 over the last 3) → **price Loveland ATD**.
- **DET side: no leak.** CHI is 22nd in TE yds and 18th in TE TDs. LaPorta is yardage-only (0.62 EPA/target vs blitz, and CHI blitzes 34.3%).

**5. Run-defense split.**
- **DET run: RUN EDGE.** DET is 5th in YPC (4.73) and CHI allows 4.21 (11th most) → Gibbs yards/ATD lean. Caveat: as the favourite, DET's run volume is partly script-dependent (R11-2 Tier 1 rule).
- **CHI run: neutral.** CHI is 11th in YPC and DET allows 3.77 (23rd). CHI is weak vs 8+ man boxes (1.26 YPC), so there are no CHI rush-yard overs.

**6. RB1 / goal-line ATD coverage list (hard gate before a card locks).**
| Team | Lead back | Goal-line back | ATD leg on any W12 ticket? |
|---|---|---|---|
| CHI | D'Andre Swift (168 carries, 10 TD, 52 carries last 3) | Swift (19 inside-5) over Monangai (6) | None yet (card not built) |
| DET | Jahmyr Gibbs (223 carries, 4.92 YPC, 13 TD) | Gibbs (21 inside-5). Vaki 1 | None yet |
Pre-card note: any Gibbs yardage leg needs a Gibbs ATD leg or a stated reason. Swift's ATD is a price question (neutral run split, but he's the clear goal-line back).

## Prop leads (for the island stacks; Andy places, nothing logged)
| Game | Leg | §3a basis | Flags |
|---|---|---|---|
| CHI@DET | Jahmyr Gibbs anytime TD | #5 RUN EDGE; #6 21 inside-5 carries, 13 TD | DET is the favourite → keep out of Tier 1 if R11-2 is accepted |
| CHI@DET | Jahmyr Gibbs over rush yds | #5 DET 4.73 vs CHI allows 4.21 | script-dependent; pair with the ATD (#6) |
| CHI@DET | Colston Loveland over rec yds | #2 FAVOURED (+13%); #1 DET middle 0.556; #4 DET 74 TE yds/g; DET LBs on IR | alignment: manual |
| CHI@DET | Colston Loveland anytime TD | #4 LOOK (DET 1st in TE TDs allowed); Kmet IR | price-dependent |
| CHI@DET | Luther Burden III over receptions / rec yds | 22 targets last 3; 3.28 YPRR vs two-high; DET middle soft | #2 neutral (+9%); alignment: manual |
| CHI@DET | D'Andre Swift anytime TD | #6 goal-line lead (19 inside-5) | #5 neutral → price only |
| CHI@DET | Sam LaPorta over rec yds | CHI blitzes 34.3%, LaPorta 0.62 EPA/target vs blitz | #4 fails (no TE leak) → tiebreaker only, no TE TD |
| CHI@DET | Amon-Ra St. Brown over receptions | 2.71 YPRR vs man; CHI slot CB Gordon OUT | #2 neutral (+3%); alignment: manual |

Not proposed:
- QB rush overs (#3 no look; Caleb only as price-only).
- Rome Odunze yards (#2 neutral, deep aDOT with no shell edge).
- Jameson Williams yards (1.27 YPRR vs man, and CHI zone allows −0.081).
- Kalif Raymond (FAVOURED +14% but a 45-target role).
- Cole Kmet (IR). Roschon Johnson (questionable, small role).
- Game total (lines conflict; W11 lesson on high model totals).

Concentration: if R11-1 is accepted, cash on this game is capped at $60 total.

Open data to close before stacks: live spread/total and prop prices; Wed CHI/DET injury estimates and final designations; FTN charting for MNF (re-run the splits); slot/outside alignment (no source).

## Roster-gate rows (every player named above)
| Game | Player | Side |
|---|---|---|
| CHI@DET | Caleb Williams | CHI |
| CHI@DET | D'Andre Swift | CHI |
| CHI@DET | Kyle Monangai | CHI |
| CHI@DET | Roschon Johnson | CHI |
| CHI@DET | Luther Burden III | CHI |
| CHI@DET | Rome Odunze | CHI |
| CHI@DET | Kalif Raymond | CHI |
| CHI@DET | Colston Loveland | CHI |
| CHI@DET | Cole Kmet | CHI |
| CHI@DET | Kyler Gordon | CHI |
| CHI@DET | Case Keenum | CHI |
| CHI@DET | Keyshaun Elliott | CHI |
| CHI@DET | Jayden Loving | CHI |
| CHI@DET | Beanie Bishop Jr. | CHI |
| CHI@DET | Jared Goff | DET |
| CHI@DET | Jahmyr Gibbs | DET |
| CHI@DET | Sione Vaki | DET |
| CHI@DET | Amon-Ra St. Brown | DET |
| CHI@DET | Jameson Williams | DET |
| CHI@DET | Isaac TeSlaa | DET |
| CHI@DET | Sam LaPorta | DET |
| CHI@DET | Aidan Hutchinson | DET |
| CHI@DET | Jack Campbell | DET |
| CHI@DET | Damone Clark | DET |
| CHI@DET | Devin White | DET |
| CHI@DET | D.J. Reed | DET |
| CHI@DET | Ennis Rakestraw Jr. | DET |
| CHI@DET | Keith Abney II | DET |
| CHI@DET | Mekhi Wingo | DET |
| CHI@DET | Tyrus Wheat | DET |
| CHI@DET | Amen Ogbongbemiga | DET |
| CHI@DET | Joe Bachie | DET |
