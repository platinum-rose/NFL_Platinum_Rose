# ARI @ DAL — Week 8 game synthesis, pass `props`

- As of: Fri 2026-10-30 11:33 PM PT (2026-10-31T06:33Z)
- Kickoff: Sun 11/1 10:00 AM PT, AT&T Stadium (retractable roof). Inactives come out about 8:30 AM PT.
- Packet built: 2026-10-31T06:09:18Z (`scratch/w08-game-synthesis-queue-props.json`). roster_vet: **PASS** (8.5 h; 2 UNVERIFIED league-wide, neither named for this game).
- Game script source: this game's sides pass (`reports/intel/games/2026-w08-game-ARI_at_DAL-sides.md`). It recommends **UNDER 54.5 (B, fair 52.5)**, a spread PASS (fair DAL -6.4) and DAL straight up. The expected range is DAL 27-20 to 30-23. Arizona trails and throws 40+ times on a short-passing, patched-OL offense that settles for field goals. Dallas scores through Lamb and Javonte Williams.

## Recommendation box

All prices come from the Bookmaker (BKR) per-game board captured 2026-10-31T01:50:49Z [`data/generated/props/bookmaker-live-2026-10-31-cardinals-at-cowboys.json`]. Projections come from nflverse play-by-play through W7 [`data/nflverse/2026/play_by_play_2026.csv.gz`, `snap_counts_2026.csv`]. None of these numbers are model probabilities.

| # | Player | Market | Line | Price | Book | Projection / basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|
| 1 | Trey McBride (ARI) | Receptions OVER | 7.5 | -114 | BKR | ~8.4. 11.1 targets/g, 8.4 rec/g, 8+ catches in 5 of 7 games, 93-97% snaps | **B** | Yes (but don't pair with #2) |
| 2 | Jacoby Brissett (ARI) | Completions OVER | 23.5 | -116 | BKR | ~26 (40 att × 65.6%). Over in 5 of 7 games; 6 of 7 games with 35+ attempts | **C** | Correlated with #1, pick one |
| 3 | Javonte Williams (DAL) | Anytime TD | — | -267 | BKR | Has scored in **7 of 7** games (9 TDs), with 20 of DAL's 24 carries inside the 10. DAL team total 30.5 | **B** (ATD) | Yes, 7e anchor |
| 4 | Michael Wilson (ARI) | Rec yards UNDER | 57.5 | -104 | BKR | ~52. Under in 5 of 7 games, median 55. Playing through a ribs injury (no designation) | **C** | Yes |
| 5 | Jeremiyah Love (ARI) | Rush yards UNDER | 40.5 | +101 | BKR | ~36. First game back from a 2-game ankle absence; 45-49% snaps before the injury; committee with Allgeier and Knight; trailing script; G Gaines OUT | **C** | Yes |
| 6 | Ryan Flournoy (DAL) | Receptions OVER (alt row) | 3.5 | +103 | BKR | ~4. Over in 4 of 7 games, 78-87% snaps, Turpin OUT. **Upgrade to B if Pickens is inactive** | **C** | Yes |
| — | CeeDee Lamb | Rec yards O82.5 -104 | | | | Anderson took 78.5 and the line is now 4 points higher. Median 74, over in 3 of 7 | PASS | — |
| — | Brissett | Pass yards O257.5 -108 | | | | Vetri took 249.5 and the line is 8 points higher. Projection 245-260 | PASS | — |
| — | Javonte Williams | Rush yards 77.5 | | | | Over in 2 of 7 games; the line prices in W7's 25-155. Thin ARI front argues the other way. No edge | PASS | — |
| — | George Pickens | all | | | | Q (shoulder/hamstring), 60% snaps in W7. No pick until inactives | PASS | — |

### 7e Anytime-TD candidates (7 legs, best first; BKR price, with DK Predictions implied % as reference only)
1. **Javonte Williams -267** (DK 68%). TD in 7 of 7 games.
2. **CeeDee Lamb -145** (DK 53%). 6 TDs, 14 red-zone targets; Prop Guru backs him (36.1% RZ target share, ARI allows 1.4 WR TD/g).
3. **Trey McBride -126** (DK 53%). 17 red-zone targets, the most on ARI; 4 TDs.
4. **Jake Ferguson +199** (DK 32%). 3 TDs, 5 RZ targets; snaps fell to 54-56%.
5. **Michael Wilson +180** (DK 36%). 13 RZ targets.
6. **Jeremiyah Love +150** (DK 41%). Workload risk on his return.
7. **George Pickens +100** (DK 46%). **Only if active.** Swap in Flournoy +247 if he is out.

BKR's ATD prices are 3-6 implied points richer than the DK Predictions reference on the top three (for example JW 72.8% vs 68%). That cost is real in a 7-leg ladder.

### 8a First-TD candidates (BKR)
- **Javonte Williams +424.** Scored DAL's first TD in 2 of the 3 games in which DAL scored first.
- **CeeDee Lamb +629**
- **Trey McBride +823.** Opponents scored the game's first TD in 4 of 7 DAL games, and ESPN (Archer, 10/30) says DAL allowed a league-high number of opening-possession TDs. ARI scored first in 3 of 7 games.
- Longshot: **Jeremiyah Love +868**

## Game script fit

The sides read (ARI trailing by about a touchdown, total in the low 50s) drives every pick:
- Arizona volume overs (McBride catches, Brissett completions) don't need yardage efficiency. Brissett's aDOT is 6.8 with a 5.7 Y/A season mark, and that profile turns pass attempts into short completions.
- The yardage unders (Wilson, Love) fit the under and the patched OL: Paris Johnson Jr. and Isaiah Adams are on IR, Gaines is OUT and Froholdt is Q.
- Dallas scores through Williams in close and Lamb in the red zone, which supports the ATD anchors.
- I avoided Lamb and Dak yardage overs (Dak O269.5 hit in 4 of 7; ARI allows 8.5 YPA). They conflict with the under-54.5 thesis.

## QB / availability

QBs are Andy-confirmed: Brissett and Prescott [`qb_operator_notes`]. Designations come from the sides pass's ESPN check plus the packet; the one web search this pass returned only stale or irrelevant pages.

**DAL**
- OUT: WR **KaVontae Turpin** (BKR still lists his ATD +601; ignore it), LB Dee Winters.
- Q: **Pickens**, TE Schoonmaker, DT Kenny Clark.

**ARI**
- OUT: G Gaines, DT Nolen, TE Tip Reiman.
- Q: C Froholdt, CB Melton, S Wingard.
- No designation: Love, Allgeier, M. Wilson.

Scenarios:
- **If Pickens is OUT:** Flournoy rec O3.5 moves to B; Lamb's target share rises, though his yardage line is already 82.5. The ATD ladder drops Pickens for Flournoy +247.
- **If Love is limited or inactive:** the Love under wins by default. Allgeier (ATD +315) and Knight (+293) take the carries.
- **If Froholdt is also out:** more quick game, which helps McBride and completions and hurts Wilson's yards.

## Market notes

BKR 10/29 23:00Z → 10/31 01:50Z:
- McBride rec yds 70.5 → 74.5; his under 7.5 receptions moved -108 → -102.
- Lamb rec yds 81.5 → 82.5.
- Williams rush 78.5 → 77.5.
- Brissett completions 23.5 held (under -101 → +100).

[Source: `bookmaker-live-2026-10-29-cardinals-at-cowboys.json`]

BetOnline has no player props posted yet (only 26 game-level rows from 10/29); re-check Saturday around 2 PM. Game lines: BKR -7 / 54.5 and BOL -7 -108 / o54.5 -113.

## Expert agreement / disagreement

- **Brandon Anderson** (AN Playground and expert pull, 10/30): Lamb O78.5 -115 plus a ladder at 100+ (+252), 150+ (+950) and 150 + 2 TD (+1900). Same show and same opinion across pipelines, so it counts once. Repriced at 82.5, the edge is gone, so I pass. The ladder is an SGP/alt and not comparable.
- **Sal Vetri** (Twitter video): Brissett O249.5 pass yards. Supports Brissett volume; I take it through completions, not yards.
- **Sal Bets:** Javonte Williams 2+ TDs. **Prop Guru:** Lamb ATD. Both agree with ATD #1 and #2.
- **Disagreement:** the sides pass and the under thesis (Torbert, BettingPros U52.5, Bet Labs rising-totals Under) cut against any yardage overs. Hribar's worksheet (Prescott with a 30+ implied team total; ARI allows a league-high 8.5% pass TD rate) supports Dak pass TDs. I passed Dak O2.5 TD +117 because it conflicts with the under; noted as an alternative.

## Counter-case per pick

- **McBride O7.5:** Love's return brings back RB check-downs. Higgins gains TE snaps with Reiman out. Two of seven games ended on exactly 7.
- **Brissett completions:** a 2-3 INT game or an early blowout pulls him. W2 (17 completions) and W4 (21) show the floor.
- **JW ATD:** DAL scoring through the air (Lamb or Pickens) and Goodson vulture carries (10 in W7). At -267 there is little room.
- **Wilson U57.5:** DAL has the worst pass DVOA (40.9%), and ARI throwing 45+ times gives him volume. He hit 89 and 95 in W3-W4.
- **Love U40.5:** DAL allows 145.7 rush yds/g, the most of either team. If he gets his pre-injury 13 carries he clears 40.
- **Flournoy O3.5:** if Pickens plays fully, Flournoy finished at 2 catches in 2 of 7 games.

## Ambiguity / missing data

- `missing_inputs`: the BetOnline player-prop board is thin (26 rows) and has no props. All picks are on BKR only.
- Weather is null; the roof is retractable and expected closed. No effect.
- PBP receiving yards are gross play totals and may differ by a yard or two from official box scores.
- Pickens' status is the biggest swing factor for the DAL pass-catcher props.
- BKR still lists Turpin despite his OUT designation. That suggests the board isn't fully refreshed for injuries.

## Pre-kickoff delta checklist

- **Pickens inactive:** Flournoy to B. Replace Pickens with Flournoy in the ATD ladder.
- **Love inactive or listed limited:** Love under resolves; add Allgeier ATD +315 as an ATD alternate.
- **McBride moves to 8.5:** pass. Playable to 7.5 -125.
- **Brissett completions move to 24.5:** pass.
- **Wilson yards move to 54.5 or lower:** pass. **Love yards move to 35.5 or lower:** pass.
- **Total moves to 52.5 or lower** (the sides thesis is priced in): consider the yardage unders fully priced.
- Re-pull BetOnline Saturday around 2 PM for better numbers on McBride and Brissett.

## Gate notes

- roster_vet is PASS (8.5 h).
- Kickoff has not passed.
- `missing_inputs`: BOL props are thin. BOL-dependent markets are capped at C and none are picked.
- The final-injury web search returned stale pages; designations come from the sides pass's ESPN fetch (10/30) plus packet Rotowire.
- `player-availability/latest.json` misclassification caveat noted; Love, Allgeier and Wilson are treated as having no designation.
- No calibrated joint model exists for props, so all tiers are judgment. The margin simulator self-test passed and was re-run at -7/54.5 (margin_adj -0.6, total_adj -2.0) for script consistency with the sides pass only.
