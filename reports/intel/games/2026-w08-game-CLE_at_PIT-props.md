# CLE @ PIT — Week 8 game synthesis, pass `props`

- **As of:** Fri 2026-10-30 ~11:40 PM PT (2026-10-31T06:40Z)
- **Kickoff:** Sun 11/1 10:00 AM PT, Acrisure Stadium (outdoor). Inactives ~8:30 AM PT.
- **Packet:** built 2026-10-31T06:09:18Z (`scratch/w08-game-synthesis-queue-props.json`) · **roster_vet:** PASS (8.5h)
- **Executable board:** Bookmaker per-game file `data/generated/props/bookmaker-live-2026-10-31-browns-at-steelers.json`, captured **2026-10-31T01:51:46Z**, 540 rows. BetOnline has 22 rows (game lines and specials only). DK Predictions (10/29 03:20Z) is reference only.
- **Game script (from the sides pass):** CLE +3.5 (C), total PASS at 38.5. Low-scoring, FG-heavy game decided late. PIT likely leads early (CLE outscored 58-13 in 1Q). CLE's pressure and man coverage squeeze Rodgers. BKR team totals: PIT 21.5, CLE 17.5, both unders juiced.

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Basis (pbp W1–W7 unless noted) | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Jaylen Warren (PIT) | Rec yds **Over** | 24.5 | -104 | BKR | 01:51Z | 7/7 over (27,34,49,33,87,28,36), median 34. CLE blitz 23.6% plus Rodgers' quick 2.51s TTT means checkdowns | **B** | y |
| 2 | Quinshon Judkins (CLE) | Rush yds **Under** | 46.5 | -108 | BKR | 01:51Z | 3/6 under. PIT run D DVOA -26.6%, YBCO 0.82. Judkins aYDOE -0.95. Sampson back (46% snaps W7). Trailing script | **B** | y |
| 3 | DK Metcalf (PIT) | Rec yds **Under** | 52.5 | -103 | BKR | 01:51Z | 4/7 under, median 40. SEP% 27.6%, DVOA -21.4%. Erickson u4.5 rec (BKR u4.5 -146) is the same thesis at a worse price | **C+** | y |
| 4 | Jaylen Warren (PIT) | Rush yds **Over** | 65.5 | +101 | BKR | 01:51Z | 4/7 over, 80 ypg, aYDOE +1.15. W4 vs CLE: 17-93. Dowdle took 9 carries in W7. Correlated with #1 | **C** | n (same player as #1) |
| 5 | Deshaun Watson (CLE) | Rush yds **Over** | 25.5 | -108 | BKR | 01:51Z | 4/7 over, median 29. PIT plays man and blitzes 26.9%, which opens scramble lanes | **C** | y |
| 6 | Deshaun Watson (CLE) | Pass yds **Over** | 210.5 | -109 | BKR | 01:51Z | 3/7 over, but 268 vs PIT in W4. PIT pass D DVOA +5.3%, OPEN% allowed 69.9%. 2 PIT CBs OUT. Trailing volume | **C** | n |
| 7 | Pat Freiermuth (PIT) | Rec yds **Under** | 24.5 | -106 | BKR | 01:51Z | 4/7 under, last two 11 and 20. Snaps fell to 53% as Washington's role grew | **C** | n |

**PASS:** Rodgers pass yds 218.5 and completions 20.5 (he cleared both 5/7 times, but CLE pressure cuts against them; no edge). Concepcion yds 45.5 (one 129-yd outlier against 2/7 overs). Boston yds 50.5. Fannin yds 34.5. Bernard rec 4.5/43.5. Dowdle (4-game sample). Sampson rush o11.5 -122 (one game since return). **McLaughlin rec-yds overs (Brandon Anderson):** no BKR McLaughlin rec-yds row, so no pick. The rationale also describes the Chiefs/Denver, so it is likely misattributed.

### 7e Anytime-TD candidates (BKR atd_1_plus, 01:51Z)

TD shares come from pbp (PIT 14 offensive TDs, CLE 13). They are rough share × team-total estimates, **not model probabilities**.

| Rank | Player | BKR | DK ref | Note |
|---|---|---|---|---|
| 1 | Darnell Washington (PIT) | +278 | +300 | 3 TDs in W4/W6/W7, 6 RZ targets (team high). TD vs CLE in W4. Rough fair ~35%+ vs 26.5% implied. **Best value** |
| 2 | Denzel Boston (CLE) | +241 | +245 | 3 TDs, 5 RZ targets. Thin PIT CB room |
| 3 | Harold Fannin Jr. (CLE) | +274 | +257 | 3 TDs (W3–4), 9 targets in W7 |
| 4 | Quinshon Judkins (CLE) | +125 | +138 | 6 of CLE's goal-to-go-10 carries, 3 TDs. Near fair; PIT run D tempers it |
| 5 | Pat Freiermuth (PIT) | +259 | +270 | 4 TDs (team high), but his role is shrinking |
| 6 | Germie Bernard (PIT) | +235 | +233 | 6 RZ targets, WR2 snaps 91–94% |
| 7 | DK Metcalf (PIT) | +200 | +178 | 1 TD in 7 games. Filler leg only |

**Fade:** Jaylen Warren ATD **-126** (55.8% implied). He has 2 TDs in 7 games, and PIT has 1 rushing TD all season (FTN). That price is far too short.

### 8a First-TD candidates (BKR first_td)

PIT has scored the game's first TD in 4 of 7 games (W3, W4 vs CLE, W5, W7). CLE has done it once (W3, Fannin).
1. **Darnell Washington +950** (scored the first TD in W7)
2. **Pat Freiermuth +988**
3. Denzel Boston +911
4. Harold Fannin Jr. +1022

Warren at +469 is the favourite, but it is short for the same reason as his ATD price.

## QB / availability

- QBs: Deshaun Watson (CLE) vs Aaron Rodgers (PIT) [qb_operator_notes]. Neither is on an injury report.
- **PIT:** WR Ben Skowronek Q (calf). He is depth only, with no prop impact. CB Slaughter and CB Echols are OUT, Mukuamu is on IR and Kent is on PUP [availability 10/30]. Roman Wilson (last target W5) is not in the roster map or on the BKR board, so he is ignored.
- **CLE:** OT Tytus Howard Q (concussion), CB Myles Harden Q, S Daniel Thomas Q. Verse has no designation. RB Dylan Sampson was a full participant Thursday [ESPN 10/29]. **If Howard is out:** sacks go up and Watson scrambles more, which helps #5 and hurts #6. **If Harden is out:** the slot CB with the team-best tDVOA -31% is gone, which weakens #3 slightly.
- The one web check found no current-week official report (results were W4–W6 pages). Statuses above are from the packet.

## Market and splits

Side and total are unchanged from the sides pass: BKR PIT -3.5 / 38.5, AN open -3.5 / 39.5. The total dropped a point against 78% of over money (RLM toward the under). Lower totals make the under-leaning props (#2, #3, #7) consistent. #6 is the contrarian piece and is tied to the CLE-trails script.

## Quant notes

- PIT run D: EPA/att -0.128, DVOA -26.6%, STF 25.2%. PIT pass D: DVOA +5.3%, TGHT% 17.2% (receivers open). The read is **run under / pass over** for CLE.
- CLE run D: DVOA -11.8%, YACO 2.50. CLE pressure 32.6%, with Rodgers sacked on 40.9% of pressures. Warren's routes (53.6%) and target share (14.2%) are steady.
- Simulator selftest PASS. The sides view (-1.0 margin adj) gives 52.7% CLE cover and 50% over at 38.5. No calibrated prop model exists, so the props carry `model_prob` = null.

## Expert agreement

- **Agree:** Andrew Erickson (BettingPros YouTube), Metcalf u4.5 rec, "under in 5 of 7, low separation" → #3. Cody Brown's 22-leg alt parlay has Warren 2+ rec and Watson 10+ rush yds. These are alt lines and not comparable, but directionally they support #1 and #5.
- **Disagree:** Cody Brown has Freiermuth 10+ alt rec yds (same caveat; against #7). Rich Hribar notes Rodgers was QB5 vs CLE in W4 (299 yds, 3 TD), which argues against the PIT pass-volume unders.
- `props_intel_articles` is empty, and no AN props article is specific to this game.

## Counter-case

1. Dowdle's 6 catches in W7 show he can take the checkdown work → Warren under.
2. Judkins had 17-96 last week, and CLE's line graded well (Fano 92.2 PFF). A CLE lead flips the script.
3. Metcalf had 115 yards vs CLE in W4. One deep shot clears 52.5.
4. Dowdle took 9 carries and 44% of snaps in W7, so a split caps Warren.
5. A pocket-passing week (W7: 3 carries for 19) misses.
6. PIT's pass D is still 4th in TD rate. If CLE is not trailing, volume falls short.
7. Washington or Freiermuth red-zone variance: one 25-yard catch beats the number.

## Ambiguity / missing data

- BetOnline player props are not posted (`missing_inputs`). Re-check Saturday ~2 PM and compare prices.
- The BKR board is about 5h old at writing. Lines may have moved.
- TD-share estimates rest on 7-game samples.
- The availability feed is flagged needs_human_review throughout. The QB file is not Andy-confirmed.
- Brandon Anderson's McLaughlin rationale references the Chiefs/DEN (likely misattributed).

## Pre-kickoff delta checklist

- **Howard OUT:** keep #5, drop #6 to PASS.
- **Harden OUT:** #3 becomes PASS.
- **Skowronek OUT:** no change.
- **Sampson inactive:** #2 becomes PASS (Judkins gets the full workload).
- **Dowdle out:** upgrade #1 and #4 to B.
- **Price changes:** Warren rec yds to 27.5+ → C. Judkins to 42.5 → PASS. Metcalf to 48.5 → PASS. Watson pass to 220.5+ → PASS.
- **Washington ATD below +240:** no longer the top value leg.
- Spread to PIT -3 or total to 37.5: re-check #6 and #7.

## Gate notes

- missing_inputs: BetOnline player-prop board thin (22 rows). Only BKR prices were used.
- roster_vet PASS. Kickoff has not passed.
- Friday web check: no current-week official page was found.
- secondary_matchups coach names (Tomlin/Austin, Fitzpatrick) are stale and ignored. PIT's HC is McCarthy [an_primer].
- youtube_picks_approved verify flags: Metcalf (staged SEA → roster PIT) and McLaughlin (staged DEN → roster CLE). Roster map used.
- No BKR QB INT legs used.
