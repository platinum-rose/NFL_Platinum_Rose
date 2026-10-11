# Week 5 slate merge — opus (proposed analysis only)

Generated 2026-10-11T06:57:23Z. Launch HEAD 2660814. Inputs: the 14 opus single-game outputs only (JSON + MD), their packets (window/capture fields only), and the SuperContest verified-lines file. No new evidence or probabilities were added here.

## Gates

- Preflight (`--model opus --game SLATE --expect-head 2660814 --espn`): exit 0, **14 pass, 5 warn, 0 fail**. Warnings: BKR/BEO lines >= 1.0 pt apart on MIN@NO and CLE@NYJ; 11 verbatim article rows that do not name the pick (human review); 432 corroboration-only rows; SuperContest label reversals on six games; **ESPN status check skipped (unreachable: HTTPError)**.
- Validator (`validate-game-output.py --model opus --all`): **14/14 ok, 0 fail, 0 warn**. No game is `unavailable`.
- Started/final: TB@DAL is final (not in the 14). ESPN was unreachable, so for the 14 this rests on packet `kickoff_utc` vs the clock: none had kicked off at merge time (earliest PHI@JAX 13:30Z).
- **Recommendation windows.** All captures are BKR 06:21Z / BEO 06:24Z on 2026-10-11. At merge time every window is still open (preflight PASS, >= 120 min), but each packet's `expires_for_recommendation_at` is earlier than that game's kickoff, so **all 14 games are `stale_for_recommendation`** and are kept in the table but excluded from rankings. A fresh BKR + BEO capture after the window expiry, followed by a packet rebuild and single-game rerun, is what would restore a game.
- Data-quality note: all 14 outputs record `head: fb2ad66`, not the launch HEAD 2660814. The preflight verified 2660814 and the pinned hashes, and the validator passed, but the output head field doesn't match.

## Slate table

Edge hypotheses are home-positive points vs the BKR line. Simulator probabilities are **conditional on that hypothesis**, not calibrated edges.

| Game | Kickoff (UTC) | BKR (home / total) | Disposition | Tier | Side lean | Total lean | Edge (margin, total) | Sim home cov / away cov / over / under | BKR/BEO conflict | Window expires (BKR) | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PHI@JAX | 10-11 13:30 | JAX -8 / 41 | conflicted | skip | none (edge +0.5 toward JAX at -8; tier-eligible VSiN rows on PHI +7.5/+8: conflicted) | none | +0.5, 0 | 0.502 / 0.473 / 0.485 / 0.485 | no | 09:21Z | stale_for_recommendation |
| CHI@GB | 10-11 17:00 | GB +1.5 / 47 | pass | skip | none | none (edge -0.5, weather only, no pick) | 0, -0.5 | 0.500 / 0.500 / 0.470 / 0.500 | no | 11:00Z | stale_for_recommendation |
| HOU@TEN | 10-11 17:00 | TEN +7 / 37.5 | pass | skip | none (only tier-eligible row is TEN +7.5, a different bet from +7) | none | 0, 0 | 0.472 / 0.472 / 0.500 / 0.500 | no | 11:00Z | stale_for_recommendation |
| CIN@MIA | 10-11 17:00 | MIA +7 / 43.5 | pass | skip | none | none | 0, 0 | 0.472 / 0.472 / 0.500 / 0.500 | no | 11:00Z | stale_for_recommendation |
| LV@NE | 10-11 17:00 | NE -3.5 / 45 | pass | skip | none (VSiN split NE -3.5 / LV +3.5) | none recorded (edge +0.5 Over, no pick) | 0, +0.5 | 0.500 / 0.500 / 0.500 / 0.470 | no | 11:00Z | stale_for_recommendation |
| MIN@NO | 10-11 17:00 | NO +2.5 / 41.5 | conflicted | research_only | none (edge -0.5 toward MIN; book conflict) | none | -0.5, 0 | 0.487 / 0.513 / 0.500 / 0.500 | YES: BKR home line 2.5 vs BEO 1 (>=1.0 pt apart); recapture before relying on either | 11:00Z | stale_for_recommendation |
| CLE@NYJ | 10-11 17:00 | NYJ -2.5 / 39.5 | conflicted | research_only | none (book conflict) | none | 0, 0 | 0.500 / 0.500 / 0.500 / 0.500 | YES: BKR home line -2.5 vs BEO -1 (>=1.0 pt apart); recapture before relying on either | 11:00Z | stale_for_recommendation |
| IND@PIT | 10-11 17:00 | PIT -3 / 43.5 | price moved | research_only | none | Under (research_only; -0.5 weather-only) | 0, -0.5 | 0.459 / 0.459 / 0.485 / 0.515 | no | 11:00Z | stale_for_recommendation |
| NYG@WAS | 10-11 17:00 | WAS -3.5 / 41.5 | pass | skip | none (VSiN split) | none | 0, 0 | 0.500 / 0.500 / 0.500 / 0.500 | no | 11:00Z | stale_for_recommendation |
| DEN@LAC | 10-11 20:05 | LAC +3.5 / 42 | conflicted | 2- | none (tier 2- recorded but disposition conflicted, no pick, edge 0.0) | none | 0, 0 | 0.500 / 0.500 / 0.485 / 0.485 | no | 12:21Z | stale_for_recommendation |
| DET@ARI | 10-11 20:25 | ARI +5.5 / 54.5 | pass | skip | none | none | 0, 0 | 0.500 / 0.500 / 0.500 / 0.500 | no | 12:21Z | stale_for_recommendation |
| SF@SEA | 10-11 20:25 | SEA -3 / 46.5 | pass | skip | none | none | 0, 0 | 0.459 / 0.459 / 0.500 / 0.500 | no | 12:21Z | stale_for_recommendation |
| BAL@ATL | 10-12 00:20 | ATL -3 / 43.5 | price moved | research_only | none (source +3.5 vs BKR +3 crosses 3) | none | 0, 0 | 0.459 / 0.459 / 0.500 / 0.500 | no | 12:21Z | stale_for_recommendation |
| BUF@LAR | 10-13 00:15 | LAR -3.5 / 54.5 | pass | skip | none | none | 0, 0 | 0.500 / 0.500 / 0.500 / 0.500 | no | 12:21Z | stale_for_recommendation |

### Invalidators, weather and the key schedule fact per game

| Game | QB / availability invalidators | Weather flag | Most decision-relevant schedule/standings fact (per output) |
|---|---|---|---|
| PHI@JAX | Official inactives: PHI C Drew Kendall / G Landon Dickerson; JAX Greenard status. PHI Out: Barkley, D. Smith, Hollywood Brown (ESPN injury report). | none (London; 57.9F, 0% precip) | Neutral London site (from VSiN quote only) removes JAX home field; JAX 3-1 leads AFC South by a game. |
| CHI@GB | CHI QB Tyson Bagent (operator-confirmed); output invalidator if Caleb Williams starts. GB Parsons Out; Monk, Banks Doubtful. | REVIEW: wind 22.3 km/h, gusts 42.1 km/h (forecast 13h old) | Division game: CHI win -> 4-1; GB loss -> 2-3 and 0-2 in division. |
| HOU@TEN | Stroud / Ward must start; HOU OL (Braden Smith IR; Ersery, Ingram, Fisher Q); TEN WR Carnell Tate Q. | none (66F, gusts 24.8 km/h) | Both 0-4; loser drops to 0-5. First division game for TEN. |
| CIN@MIA | CIN Chase and Higgins Questionable (unresolved passing script). | heat context only (89.6F) | MIA 0-4, -55 diff vs 15-1 opponents; both teams bye in Week 6. |
| LV@NE | NE CBs Gonzalez, Davis III, Prunty, Canada Out; Over basis falls if Gonzalez/Davis active. Jeanty Q; Moses Q. | none recorded (recheck if sustained wind > ~25 km/h) | LV 3-1 vs 5-11 opponents; NE 2-2 vs 11-5 opponents (schedule-strength offset). |
| MIN@NO | MIN OT Darrisaw Out; O'Neill, Jurgens Q; Jefferson status. NO LBs Elliss, Jennings Out. | n/a (dome) | MIN 4-0 level with SF atop NFC; NO 1-3, 0-2 home, 5.7 days rest. |
| CLE@NYJ | Watson (CLE) / Geno Smith (NYJ) must start; NYJ Breece Hall Out (injury report). | REVIEW: precip 78%, 1.8 mm, gusts 37.1 km/h | CLE win ties BAL atop AFC North before hosting BAL; NYJ loss = two games behind BUF. |
| IND@PIT | Daniel Jones / Aaron Rodgers must start; PIT Ramsey Q; IND Allen Q, Slayton and Dulin Out. | REVIEW: wind 25.2 km/h, gusts 58 km/h, precip 54% | PIT 9.7 days rest vs IND 7.1 (+2.6); PIT 2-0 home. |
| NYG@WAS | Jayden Daniels (elbow) inactive or limited reprices WAS; McLaurin Q. | REVIEW: precip probability 72%, gusts 26.3 km/h | Division game: WAS loss -> 1-4, three games behind NYG. |
| DEN@LAC | LAC OL (Alt, Awosika Out; Slater, Penning IR; Taylor Q); McConkey Q; DEN CBs Surtain II, Moss Out. | none captured (open-sided venue) | Division game: LAC loss -> 0-5, 0-2 division. |
| DET@ARI | Kerby Joseph / Avonte Maddox (roster group, unconfirmed); ARI Walter Nolen III Q. | unknown (retractable roof unconfirmed; no forecast) | DET 0-2 away, 2-0 home; zero tier-eligible rows for this game. |
| SF@SEA | Purdy / Darnold must start; SF Bosa and Thompson Jr. Out; Stout Q. | none (59F, gusts 23 km/h) | Division game: SEA win pulls level at 4-1 with SF in NFC West. |
| BAL@ATL | Lamar Jackson Out; Tyler Huntley starts (operator-confirmed). Penix must be active. | unknown (retractable roof unconfirmed) | BAL leads AFC North on differential over 3-1 CLE (next opponent). |
| BUF@LAR | Josh Allen / Stafford must start; Ed Oliver Out vs Myles Garrett IR (offsetting). | verification required (covered/open-sided) | Monday night; both 8.3 days rest; BUF leads AFC East. |

Availability conventions: CHI QB is Tyson Bagent (operator-confirmed). ESPN roster IR/Out group entries are unconfirmed and are never treated as Out; only the ESPN injury report is used for Out/Questionable.

## Slate-level checks

### Edge sanity

- Margin edges: 12 of 14 are 0.0; PHI@JAX +0.5 (toward JAX) and MIN@NO -0.5 (toward MIN). Mean absolute margin edge **0.071 pts**, well under the 1.5 threshold, so **no shrinkage was applied** and no simulator rerun was needed.
- Total edges: 11 of 14 are 0.0; CHI@GB -0.5, IND@PIT -0.5 (both weather-only Under inputs), LV@NE +0.5 (NE CB absences). Mean absolute total edge 0.107 pts.
- The opposite risk applies: the single-game runs consistently declined to adopt the provisional quantitative pass, which disagrees with the market by 1–3 pts in several games (CHI@GB ~3.1, NYG@WAS ~2.7, SF@SEA ~2.9, MIN@NO ~2.0, CLE@NYJ ~1.8, IND@PIT ~1.6). That pass is unbacktested, and leaving it out is consistent with the prompt.

### Correlation and exposure

- **One weather system, one stale forecast.** The two Under inputs (CHI@GB gusts 42 km/h; IND@PIT gusts 58 km/h, 54% precip) and the review-required flags at CLE@NYJ (78% precip) and NYG@WAS (72% precip) all come from the same Open-Meteo capture (2026-10-10T17:56Z, ~13 h old). If that forecast is wrong, it is wrong for all four games together.
- **Single-outlet dependence.** Nearly every tier-eligible row on the slate is VSiN, and VSiN appears on both sides of LV@NE, NYG@WAS and BUF@LAR. A slate built on those rows is one outlet's view.
- **Backup / changed QBs already priced.** CHI (Bagent), BAL (Huntley for Lamar Jackson), WAS (Daniels returning from elbow). In each, the output's edge is 0.0 because the market moved first, and each output lists a QB-status invalidator.
- **Key-number clustering at 3.** CHI@GB, IND@PIT, SF@SEA, BAL@ATL, BUF@LAR, NYG@WAS, LV@NE and DEN@LAC are all within 0.5 of 3. Small line moves at recapture change which bet exists (simulator side_push at 3 = 0.0827).
- **Divisional/standings links.** CHI@GB, MIN@NO and DET@ARI all affect the NFC North race (MIN 4-0, CHI 3-1, DET 2-2, GB 2-2). Division games: CHI@GB, HOU@TEN, NYG@WAS, DEN@LAC, SF@SEA.
- **Favorite+Over / dog+Under pairs:** none. No game has both a side lean and a total lean.

### Internal consistency

- PHI@JAX (JAX +0.5, total 0), MIN@NO (MIN +0.5, total 0), IND@PIT (margin 0, Under), CHI@GB (margin 0, Under 0.5): each tells a coherent score story.
- LV@NE: mild tension. The +0.5 Over rests on LV's passing game vs four NE corners Out, which would also tilt the margin toward LV, but the side is held at 0.0 because VSiN rows conflict. This isn't an error, but the two inputs are not independent.
- DEN@LAC: tier `2-` is recorded alongside disposition `conflicted`, no side pick and edge 0.0. That tier/disposition pairing is inconsistent and the game isn't rankable (see decision-support file).
- LV@NE and CHI@GB carry a non-zero total edge with `total_lean.pick = null`; IND@PIT carries the same -0.5 with `Under` as its pick. Labelling isn't uniform across outputs.

### Standings stakes (context only)

- HOU@TEN: both 0-4; the loser is 0-5.
- DEN@LAC: LAC 0-4 (0-1 div); a loss means 0-5 and 0-2 in the division, behind KC 4-0. DEN 2-2.
- NYG@WAS: WAS 1-3 (0-2 div); a loss means 1-4, three games behind NYG 3-1.
- CHI@GB: CHI 3-1 to 4-1 with a win; GB 2-2 to 2-3 and 0-2 in the division with a loss.
- CLE@NYJ: CLE 3-1 ties BAL atop the AFC North with a win before hosting BAL in Week 6; NYJ 1-3 falls two games behind BUF with a loss.
- SF@SEA: SF 4-0 vs SEA 3-1; a SEA win means 4-1 each.
- CIN@MIA: MIA 0-4 (-55); CIN 2-2. MIN@NO: MIN 4-0 vs NO 1-3 (0-2 home).

## Gaps

- No ranked side or total exists. Every game is `stale_for_recommendation`, and none carries a rankable tier with a pick.
- Book conflicts (MIN@NO 1.5 pt, CLE@NYJ 1.5 pt) need a recapture before any price claim.
- Action Network opener is null in every packet; movement comes only from 2026-10-09 splits.
- Venue/roof is unconfirmed for DET@ARI, BAL@ATL and BUF@LAR, and DEN@LAC has no forecast. PHI@JAX is in London, which is known only from a VSiN quote.
- ESPN live status was unreachable at preflight. Official inactives decide every QB/availability invalidator above.
- Output head field fb2ad66 does not match launch HEAD 2660814 (all 14).

Decision support (rankings, SuperContest, pools, prop menus): `reports/bets/2026-w05-opus-decision-support.md`. Machine-readable version: `data/research-intel/proposed/2026-w05-opus-slate-merge.json`.
