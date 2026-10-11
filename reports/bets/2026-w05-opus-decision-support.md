# Week 5 decision support — opus (PROPOSED ANALYSIS ONLY)

Generated 2026-10-11T06:57:23Z. Proposed analysis only: no tickets, stakes, payouts, parlay math, account actions, ledger or official-pick changes. Sources: the 14 opus single-game outputs (validator 14/14 ok) and `data/supercontest/week-05-2026-verified-lines.json`.

**Window status:** captures are BKR 06:21Z / BEO 06:24Z on 2026-10-11. Every packet's `expires_for_recommendation_at` (09:21Z for PHI@JAX; 11:00Z for 1 pm ET games; 12:21Z for the later games) falls before kickoff, so all 14 games are `stale_for_recommendation`. A fresh BKR + BEO capture, packet rebuild and single-game rerun would be needed to restore any of them.

## Sportsbook rankings (tier 2 / 2- only)

### Sides: **none**

### Totals: **none**

The rankings are left empty on purpose. The lists were not padded to the old targets of 10 sides and 8 totals.

| Game | Tier | Disposition | Edge (margin, total) | Why omitted |
|---|---|---|---|---|
| PHI@JAX | skip | conflicted | +0.5, 0 | tier skip; stale_for_recommendation |
| CHI@GB | skip | pass | 0, -0.5 | tier skip; stale_for_recommendation |
| HOU@TEN | skip | pass | 0, 0 | tier skip; stale_for_recommendation |
| CIN@MIA | skip | pass | 0, 0 | tier skip; stale_for_recommendation |
| LV@NE | skip | pass | 0, +0.5 | tier skip; stale_for_recommendation |
| MIN@NO | research_only | conflicted | -0.5, 0 | tier research_only; stale_for_recommendation; BKR/BEO book conflict |
| CLE@NYJ | research_only | conflicted | 0, 0 | tier research_only; stale_for_recommendation; BKR/BEO book conflict |
| IND@PIT | research_only | price moved | 0, -0.5 | tier research_only; stale_for_recommendation; Under is research_only (-0.5 weather-only) |
| NYG@WAS | skip | pass | 0, 0 | tier skip; stale_for_recommendation |
| DEN@LAC | 2- | conflicted | 0, 0 | tier 2- recorded, but disposition conflicted, no side/total pick, edge 0.0 (single outlet VSiN vs quant pass); stale_for_recommendation |
| DET@ARI | skip | pass | 0, 0 | tier skip; stale_for_recommendation |
| SF@SEA | skip | pass | 0, 0 | tier skip; stale_for_recommendation |
| BAL@ATL | research_only | price moved | 0, 0 | tier research_only; stale_for_recommendation |
| BUF@LAR | skip | pass | 0, 0 | tier skip; stale_for_recommendation |

## SuperContest (separate from sportsbook prices; proposed only)

Contest lines come from the user-verified board (recorded 2026-10-09; `source_capture_time` null). The file has no lock or submission rules, so those are **unavailable**. Joins are by unordered team pair using the file's favorite/spread fields. **The file's away/home labels are reversed for TEN@HOU, MIA@CIN, NO@MIN, GB@CHI, LAC@DEN and ARI@DET.** TB@DAL is final and excluded.

| Game (schedule order) | File label | Contest line | BKR line | Contest differs from BKR? |
|---|---|---|---|---|
| PHI@JAX | PHI@JAX | JAX -7.5 | JAX -8 | **YES** |
| CHI@GB | GB@CHI (REVERSED) | CHI -3 | CHI -1.5 | **YES** |
| HOU@TEN | TEN@HOU (REVERSED) | HOU -7.5 | HOU -7 | **YES** |
| CIN@MIA | MIA@CIN (REVERSED) | CIN -7 | CIN -7 | no |
| LV@NE | LV@NE | NE -3.5 | NE -3.5 | no |
| MIN@NO | NO@MIN (REVERSED) | MIN -2.5 | MIN -2.5 | no |
| CLE@NYJ | CLE@NYJ | NYJ -2.5 | NYJ -2.5 | no |
| IND@PIT | IND@PIT | PIT -2.5 | PIT -3 | **YES** |
| NYG@WAS | NYG@WAS | WAS -3.5 | WAS -3.5 | no |
| DEN@LAC | LAC@DEN (REVERSED) | DEN -3.5 | DEN -3.5 | no |
| DET@ARI | ARI@DET (REVERSED) | DET -5.5 | DET -5.5 | no |
| SF@SEA | SF@SEA | SEA -3 | SEA -3 | no |
| BAL@ATL | BAL@ATL | ATL -3.5 | ATL -3 | **YES** |
| BUF@LAR | BUF@LAR | LAR -3 | LAR -3.5 | **YES** |

A SuperContest entry has to contain five picks, so these choices are forced. **No choice is supported by a non-zero edge in its game output.** Every pick is **low-confidence**, and the tie-break used for each is stated.

### Five proposed choices

**1. TEN +7.5** (HOU@TEN). Contest HOU -7.5; BKR HOU -7 (TEN +7); differs from BKR: YES. Confidence: low.
- Output: opus HOU@TEN: disposition pass, tier skip, edge 0.0/0.0. The game's only tier-eligible row (VSiN rows[565]) is "Titans +7.5", exactly the contest number; the output says a TEN +7.5 price re-aligns with it ("reassess as a 2- at most").
- Tie-break basis: Contest line crosses key number 7 in the dog's favour vs BKR +7 (simulator side_push at 7 = 0.0555 in the packet sweep) and matches the only tier-eligible source line.
- Evidence: Per-game evidence does not support a lean: edge hypothesis is 0.0 and the source is a single outlet. Invalidators: Stroud/Ward not starting; 2+ HOU OL out strengthens TEN; Tate inactive weakens TEN.

**2. GB +3** (CHI@GB). Contest CHI -3 (file lists GB@CHI; labels reversed); BKR CHI -1.5 (GB +1.5); differs from BKR: YES. Confidence: low.
- Output: opus CHI@GB: pass, skip, margin edge 0.0 (CHI four-game edge offset by backup QB Bagent and CHI defensive absences; market already prices the QB change). VSiN GB rows (+1.5, ML +120) are not tier-supporting.
- Tie-break basis: Largest contest-vs-BKR gap on the slate: 1.5 pts more than BKR for GB, through key number 3 (side_push at 3 = 0.0827).
- Evidence: Per-game evidence does not support a lean; choice rests on the contest number only. Invalidator: Caleb Williams active and starting instead of Bagent (operator confirms Bagent) reprices CHI upward.

**3. PIT -2.5** (IND@PIT). Contest PIT -2.5; BKR PIT -3; differs from BKR: YES. Confidence: low.
- Output: opus IND@PIT: price moved, research_only, margin edge 0.0. Two independent tier-eligible outlets (ESPN rows[390] "Steelers -2.5", VSiN rows[444] "Steelers -2.5") quoted exactly the contest number; the output's first invalidator says a -2.5 price makes them the same bet and re-opens the side.
- Tie-break basis: Contest line avoids losing on a 3-point PIT win (0.5 better than BKR -3) and is the only game where two independent tier-eligible outlets name this exact number.
- Evidence: The output's own margin edge is still 0.0 (power ratings split; offsetting rushing and secondary absences). Invalidators: Ramsey out, QB change, weather (gusts 58 km/h).

**4. BAL +3.5** (BAL@ATL). Contest ATL -3.5; BKR ATL -3 (BAL +3); differs from BKR: YES. Confidence: low.
- Output: opus BAL@ATL: price moved, research_only, edge 0.0 (Lamar Jackson Out priced before capture). VSiN rows[448]/[451]/[568] quote "Ravens +3.5"; the output says a +3.5 price reprices them to the source line (single outlet, 2- at most). VSiN rows[525] "Falcons +3 (-118)" contradicts.
- Tie-break basis: Contest line crosses key number 3 in BAL's favour vs BKR +3 and matches the single-outlet source line.
- Evidence: Single outlet with an internal contradiction; edge 0.0. Invalidators: Huntley not the starter; Penix not active; centre depth (Pocic/Pinter roster-group, unconfirmed).

**5. LAC +3.5** (DEN@LAC). Contest DEN -3.5 (file lists LAC@DEN; labels reversed); BKR DEN -3.5 (LAC +3.5); differs from BKR: no. Confidence: low.
- Output: opus DEN@LAC: conflicted, tier 2- (the slate's only 2-), edge 0.0. Two VSiN tier-eligible rows on LAC +3.5 offset by the provisional quant pass (home margin -4.39 toward DEN).
- Tie-break basis: Only game where the output records a 2- tier and the source line equals the contest line; LAC +3.5 sits above key number 3.
- Evidence: Output disposition is conflicted and records no side pick; LAC is 0-4 with heavy OL absences. Invalidators: McConkey inactive; line to LAC +3.

### Five proposed alternates

**A1. MIN -2.5** (MIN@NO). Contest MIN -2.5 (file lists NO@MIN; labels reversed); BKR MIN -2.5 (BEO MIN -1: book conflict); differs from BKR: no. Confidence: low. Lean supported by output: weak (+0.5 pt, book conflict blocks pricing).
- Output: opus MIN@NO: conflicted, research_only, margin edge -0.5 toward MIN (FTN defensive DVOA gap, NO LBs Out, offset by MIN OL absences). VSiN rows[518] MIN ML is tier-eligible.
- Tie-break basis: Output's numeric lean (MIN); contest line stays under 3.
- Caveat: BEO has MIN -1; O'Neill/Jurgens out pushes the edge to 0 or toward NO.

**A2. LAR -3** (BUF@LAR). Contest LAR -3; BKR LAR -3.5; differs from BKR: YES. Confidence: low. Lean supported by output: False.
- Output: opus BUF@LAR: pass, skip, edge 0.0. VSiN rows[446] "Rams -3 (-120)" names the contest number; same-outlet near-miss rows[514] "Buffalo +3" opposes it.
- Tie-break basis: Contest line is 0.5 better than BKR for LAR and lands on 3 (push protection on a 3-point LAR win).
- Caveat: Same outlet on both sides; Monday kickoff, ~36h after capture.

**A3. MIA +7** (CIN@MIA). Contest CIN -7 (file lists MIA@CIN; labels reversed); BKR CIN -7; differs from BKR: no. Confidence: low. Lean supported by output: False.
- Output: opus CIN@MIA: pass, skip, edge 0.0. VSiN rows[562]/[509] MIA +7 (single outlet); quant pass -6.61 leans 0.39 toward MIA (not adopted).
- Tie-break basis: Single-outlet source side at the contest number; Chase/Higgins Questionable.
- Caveat: If Chase and Higgins both play the MIA case weakens; MIA 0-4, -55 diff.

**A4. JAX -7.5** (PHI@JAX). Contest JAX -7.5; BKR JAX -8; differs from BKR: YES. Confidence: low. Lean supported by output: weak and contradicted by the only tier-eligible source.
- Output: opus PHI@JAX: conflicted, skip, margin edge +0.5 toward JAX (PHI Out: Barkley, D. Smith, Hollywood Brown; JAX efficiency), against four VSiN tier-eligible rows on PHI +7.5/+8.
- Tie-break basis: Output's numeric lean (JAX) and the contest line is 0.5 better than BKR for JAX.
- Caveat: Neutral London site; earliest kickoff (13:30Z) and earliest window lapse (09:21Z).

**A5. SEA -3** (SF@SEA). Contest SEA -3; BKR SEA -3 (-123); differs from BKR: no. Confidence: low. Lean supported by output: False.
- Output: opus SF@SEA: pass, skip, edge 0.0. Single VSiN row on SEA -3 at -123 juice; SF pass rush depleted (Bosa, Thompson Jr. Out) vs SF SRS edge.
- Tie-break basis: Contest line removes the -123 juice the book charges at -3; single-outlet source side.
- Caveat: Quant pass leans ~2.9 pts toward SF (not adopted); SEA -2.5 or SF +3.5 at a recapture changes the read.

Not proposed: LV@NE (VSiN split on both sides; no lean); NYG@WAS (VSiN split on both sides; no lean); DET@ARI (zero tier-eligible rows; edge 0.0); CLE@NYJ (book conflict (BKR -2.5 vs BEO -1); only source is NYJ ML).

**Shared risk in the five:** four of the five are underdogs (TEN, GB, BAL, LAC), so a favourites-cover Sunday hits them together. Three of the five (TEN +7.5, GB +3, BAL +3.5) depend mainly on the contest line being kinder than BKR rather than on game evidence, and three rest on VSiN as their only source.

## Pick'em / confidence pools

`pool rules unavailable`: no pool file, rules or lock time are in this stage's inputs. No ordering is offered because no single-game output supports a win-probability ordering beyond the market.

## Survivor

Not an output (both pools are lost). No survivor data was in this stage's inputs, so there are no data-quality findings beyond that.

## Prop construction menus — not tickets

These come from the single-game `props` arrays. **Each one needs builder/pricing verification**, since prices are as captured 06:21–06:24Z and will be stale. No probabilities, edges or combined prices are given.

### Source-supported

| Game | Player | Market | Side | Line | Captured price (book) | Thesis (from output) |
|---|---|---|---|---|---|---|
| CHI@GB | Christian Watson (GB) | anytime TD | Yes | 0.5 | +180 (BEO) | Source-supported by tier-eligible ESPN row rows[392] (quoted +195; captured BEO +180). 2026 usage: targets 8/11/10/3 and receiving TDs 2/1/1/0 in wks 1-4 (player_stats_weekly.csv). No probability or edge. |

Christian Watson is the only prop backed by a tier-eligible row (ESPN rows[392]). It is still an anytime-TD market (high variance), and the price has moved from the quoted +195 to the captured +180.

### Usage context only

| Game | Player | Market | Side | Line | Captured price (book) | Thesis (from output) |
|---|---|---|---|---|---|---|
| PHI@JAX | Bhayshul Tuten (JAX) | rush_yds | Over | 66.5 | -108 (BKR) | 2026 weeks 1-4 carries 15/13/15/17, rushing yards 66/65/73/73 (player_stats_weekly.csv); main-line row Over -108 / Under -102. No model probability. |
| PHI@JAX | Brenton Strange (JAX) | rec_yds | Under | 31.5 | +101 (BKR) | Action Network (corroboration-only rows[105]) quoted u35.5 -110; captured BKR main line is 31.5 (Under +101), a 4-point move. Weeks 1-4 targets 3/2/5/8, rec yds 23/17/32/95. |
| HOU@TEN | Tony Pollard (TEN) | rush_yds | Over | 48.5 | +101 (BKR) | Carries 7/14/17/16 and rush yards 35/64/74/48 in Weeks 1-4 (nflverse); HOU rush defense FTN rush-analytics EPA/ATT -0.110, DVOA -23.6% is a stout matchup. No probability. |
| HOU@TEN | Nico Collins (HOU) | rec_yds | Over | 77.5 | -109 (BKR) | 10 and 8 targets, 75 and 118 yards in Weeks 1 and 4 (no rows Weeks 2-3); TEN pass defense allows FTN passing-analytics EPA/DB 0.196. Not on ESPN injury report. No probability. |
| CIN@MIA | Greg Dulcich (MIA) | receiving yards | Over | 25.5 | -114 (BKR) | 2026 weeks 1-3: 18, 17, 55 yds on 2/3/7 targets; no week 4 row. VSiN rows[383] (corroboration-only) quoted o26.5 -125 vs captured 25.5 -114. |
| CIN@MIA | Malik Washington (MIA) | receptions | Over | 4.5 | -114 (BKR) | 2026 weeks 1-4: 3, 4, 5, 5 receptions on 8/5/10/5 targets; Caleb Douglas Out (ESPN injury report). No source support. |
| LV@NE | Kirk Cousins (LV) | pass_yds | Over | 231.5 | -108 (BKR) | 2026 passing yards W1 160, W2 253, W3 248, W4 365 (nflverse); NE four CBs Out per ESPN injury report. |
| LV@NE | Drake Maye (NE) | pass_yds | Under | 229.5 | -110 (BKR) | 2026 passing yards W1 178, W2 208, W3 199, W4 269 (nflverse); LV FTN PRESS% 39.5%. |
| MIN@NO | Aaron Jones (MIN) | carries | Over | 17.5 | +101 (BKR) | Carries W1 12, W2 23, W3 17, W4 20 (player_stats_weekly.csv 2026). VSiN rows[518] quotes rush yds Over 71.5 -110, a different market not open at BKR. Jordan Mason in ESPN roster IR/Out group (unconfirmed). |
| MIN@NO | Chris Olave (NO) | receptions | Over | 6.5 | +104 (BKR) | Receptions W1 10, W2 8, W3 9, W4 8 on 13/10/13/12 targets (player_stats_weekly.csv 2026). |
| MIN@NO | Tyler Shough (NO) | pass completions | Over | 22.5 | -114 (BKR) | Completions W1 35, W2 27, W3 29, W4 30 (player_stats_weekly.csv 2026); NO DPBK% 67.8%, but MIN PRESS% 40.9%. |
| CLE@NYJ | Quinshon Judkins (CLE) | rush_yds | Under | 59.5 | -110 (BKR) | Rushing yards wk1-4: 33, 21, 70, 53 on 12/12/18/17 carries (player_stats_weekly.csv); 1 of 4 above 59.5. Source prices -114 (ESPN rows[395]) and -112 (Sharp Football rows[413]) vs captured -110; corroboration-only. |
| IND@PIT | Jonathan Taylor (IND) | rush_yds | Over | 86.5 | -108 (BKR) | 2026 carries 19/24/23/20 and rush yds 98/92/68/95 (wks 1-4; 3 of 4 over 86.5). ESPN rows[391] (tier-eligible) quotes a different market, OVER 105.5 (-114) total yards; BKR has no rush+rec main line, so it is not the same bet. |
| IND@PIT | Jonathan Taylor (IND) | carries | Over | 19.5 | +106 (BKR) | Carries 19/24/23/20 in wks 1-4 (3 of 4 over 19.5); faces PIT rush D STF% 23.5%. |
| IND@PIT | Jaylen Warren (PIT) | rec_yds | Over | 20.5 | -113 (BKR) | Receiving yds 27/34/49/33 on 6/4/4/6 targets wks 1-4 (4 of 4 over). Cody Brown rows[379] OVER 20.5 is corroboration-only, no source price. |
| NYG@WAS | Isaiah Likely (NYG) | receiving yards | Over | 42.5 | -112 (BKR) | Targets 8/10/5/12 and 78/33/13/66 yds in 2026 weeks 1-4 (player_stats_weekly.csv), 41% target share week 4; Sharp Football row[415] quoted o40.5 -125 (corroboration only) vs captured 42.5 -112: different line and price. |
| NYG@WAS | Isaiah Likely (NYG) | receptions | Over | 4.5 | -108 (BKR) | Receptions 8/5/2/7 in weeks 1-4 on 35 targets; WAS defense OPEN% 72.1% (FTN). No source price; usage context only. |
| DEN@LAC | Omarion Hampton (LAC) | carries | Over | 10.5 | -130 (BKR) | Carries wk1-4: 12, 23, 15, 9 (nflverse); Keaton Mitchell rising (4,5,8,10). No source support. |
| DEN@LAC | Justin Herbert (LAC) | pass_yds | Over | 200.5 | -108 (BKR) | Pass yds wk1-4: 209, 192, 226, 189 (nflverse); WR absences and OL injuries cut both ways. No source support. |
| DET@ARI | Sam LaPorta (DET) | rec_yds | Over | 51.5 | -114 (BKR) | 2026 targets 8/7/4/13 and rec yds 48/52/44/84 (wks 1-4, player_stats_weekly.csv). Sharp Football (rows[414], corroboration-only) quoted OVER 50.5 -120; captured BKR is 51.5 -114. No model probability. |
| SF@SEA | Brock Purdy (SF) | passing yards | Over/Under | 222.5 | -106 (BKR) | 205, 287, 297, 218 yards Weeks 1-4 on 22-34 attempts (nflverse); main-line row, both sides -106. |
| BAL@ATL | Derrick Henry (BAL) | rush_yds | Under | 78.5 | -114 (BKR) | Carries 24/16/26/23 and rush yds 144/68/89/73 (weeks 1-4, player_stats_weekly.csv); ATL FTN rush-analytics EPA/ATT -0.291. No model probability. |
| BAL@ATL | Bijan Robinson (ATL) | rush_yds | Over | 87.5 | -114 (BKR) | Carries 21/16/29/19, rush yds 83/72/194/145 (weeks 1-4; 194 and 145 in Penix starts); BAL FTN rush-analytics EPA/ATT -0.027. No model probability. |
| BUF@LAR | Kyren Williams (LAR) | receiving yards | Over | 22.5 | -108 (BKR) | Targets 3/2/7/13 and rec yds 24/12/70/67 in 2026 wks 1-4 (player_stats_weekly.csv); TE Terrance Ferguson on IR (ESPN). Digest sources quoted o19.5 (Rich Hribar, Tera Roberts; corroboration only, src px not BKR) vs 22.5 now. |

### High-variance TD

| Game | Player | Market | Side | Line | Captured price (book) | Thesis (from output) |
|---|---|---|---|---|---|---|
| CHI@GB | Tucker Kraft (GB) | anytime TD | Yes | 0.5 | +220 (BEO) | Corroboration-only source (Action Network digest, +250 quoted vs BEO +220). Usage: targets 6/3/8/7, TD in wk4 only. Usage context only. |
| CHI@GB | Luther Burden III (CHI) | anytime TD | Yes | 0.5 | +250 (BEO) | Corroboration-only source (Action Network digest, +240 quoted vs BEO +250). Usage: targets 5/7/11/6, one TD (wk3); QB change to Bagent adds variance. Usage context only. |
| HOU@TEN | Tony Pollard (TEN) | atd_1_plus | Yes | 0.5 | +202 (BKR) | Digest source price +250 (Action Network, corroboration-only) vs captured BKR +202; 1 rushing TD in 4 games (Week 4). |
| LV@NE | Brock Bowers (LV) | atd_1_plus | Yes | 0.5 | +128 (BKR) | Receiving TDs in W3 (13 tgt) and W4 (11 tgt) per nflverse; no W1-W2 rows. Source price +145 (Action Network rows[16], corroboration-only) vs captured +128. |
| CLE@NYJ | Garrett Wilson (NYJ) | atd_1_plus | Yes | 0.5 | +143 (BKR) | Targets wk1-4: 7, 7, 13, 4; receiving TDs in wk2 and wk3 (player_stats_weekly.csv). Source price +140 (BettingPros rows[59]) vs captured +143; corroboration-only. |
| IND@PIT | Roman Wilson (PIT) | atd_1_plus | Yes | 0.5 | +250 (BKR) | 6 targets in each of wks 1-4, TDs in wks 3 and 4. BettingPros rows[64] (+250) is corroboration-only; digest also lists a +285 source price vs captured +250. |
| SF@SEA | Christian McCaffrey (SF) | anytime TD | Yes | 0.5 | -141 (BKR) | TDs in Weeks 2 (2), 3, 4; 10-15 carries and 4-8 targets per week (nflverse wk1-4). No model edge. |
| SF@SEA | Jaxon Smith-Njigba (SEA) | anytime TD | Yes | 0.5 | -120 (BKR) | 6 receiving TDs in 4 games, 6-14 targets per week (nflverse wk1-4). No model edge. |

### Correlation and anti-correlation notes

- **LV@NE:** Cousins pass yds Over and Bowers ATD move together with the +0.5 Over input (NE corners Out). Maye pass yds Under works against a high-scoring script.
- **IND@PIT:** Taylor rush yds Over and Taylor carries Over are close to the same leg. Both fit a windy, run-heavy script that also fits the Under input, while Warren rec yds Over fits a PIT pass-catching script.
- **CHI@GB:** the three ATD legs (Watson, Kraft, Burden) work against the -0.5 weather Under input. Burden's legs carry extra variance from the QB change to Bagent.
- **MIN@NO:** Jones carries Over fits a MIN-lead script (the output's -0.5 lean). Shough completions Over and Olave receptions Over fit NO trailing, so they are consistent with that same script, not opposed to it.
- **HOU@TEN:** Pollard rush yds Over (TEN control) and Collins rec yds Over (HOU passing) assume different game scripts.
- **BAL@ATL:** Henry Under and Bijan Over both lean on an ATL-control script. The output's margin edge is 0.0, so this is a script bet the output does not support.
- **DEN@LAC:** Hampton carries Over and Herbert pass yds Over partly cannibalise each other.
- **PHI@JAX:** Tuten rush Over fits the output's JAX lean. Strange rec Under is a separate 4-point line-move thesis.
- **NYG@WAS:** both Likely legs (yds, receptions) are effectively one thesis.
- **CLE@NYJ:** the Judkins Under is exposed to the rain flag (78% precip), which could push volume toward the run.
- **Cross-game:** the weather-linked legs (IND@PIT, CHI@GB, CLE@NYJ) share the same 13-hour-old forecast.

No ticket, stake, account, Supabase, ledger or official-pick state was changed by this stage.
