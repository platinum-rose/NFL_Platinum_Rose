# Week 9 matchup post-mortem: team grades and rest-of-season intel (2026-11-10)

Claude Team 2. This is research context, not a betting recommendation, and nothing was placed or written to the ledger or Supabase.

- **Source:** nflverse play-by-play through Week 9 (refreshed 11/10), ESPN box-score team table, and the DraftKings lines in the schedule cache.
- **Script:** `reports/analysis/season/claude/scripts/matchup_postmortem.py --week 9` (reproducible, no network or paid calls).
- **Data files:**
  - `out/week-09-matchup-grades.json`: every team-game for Weeks 1-9 graded on the same scale.
  - `out/week-09-matchup-intel.json`: season unit ratings, quarterback splits, remaining strength of schedule, and all 136 remaining games with matchup edges.
  - `out/week-09-matchup-intel.md`: the generated team-by-team list of every remaining game.
  - `out/week-09-matchups-data.md`: the raw tables.
- **Hand notes:** `w09-matchup-notes.json`, next to this file.

## How the grades work

- **The measure:** each unit's Week 9 expected points added (EPA) per play, minus what that opponent usually allows or gains (with this game left out of the opponent's average).
- **The letter:** that adjusted number is ranked against all 272 team-games this season: A+ is top 5%, A top 15%, B top 35%, C the middle 30%, D bottom 35-15%, and F bottom 15%.
- **Overall:** (adjusted offense minus adjusted defense) × 62 plays, plus special-teams EPA. It roughly equals points better than an average team would have done against that opponent.
- **Caveat:** one game is noise. A grade describes how a unit played against what the opponent usually allows; it does not say who is good. The season ratings further down are the better guide for the weeks ahead.

## Grades at a glance

| Game | Score | Away: Off / Def / ST / **Overall** | Home: Off / Def / ST / **Overall** | ATS |
|---|---|---|---|---|
| JAX @ BAL | 33-10 | C / A+ / B / **A** | F / B / D / **D** | JAX by 13.5 |
| CIN @ ATL | 34-17 | A+ / F / A / **B** | B / F / F / **D** | CIN by 14 |
| CLE @ NO | 22-23 | D / C / A / **C** | C / C / F / **D** | CLE by 3.5 |
| DAL @ IND | 27-23 | B / B / F / **C** | F / C / A / **D** | IND by 0.5 |
| DEN @ CAR | 26-21 | C / D / B / **C** | B / C / D / **C** | DEN by 2 |
| DET @ MIA | 19-9 | D / B / B / **C** | F / B / D / **D** | DET by 3.5 |
| LAR @ WAS | 20-13 | C / B / C / **B** | C / C / C / **C** | LAR by 2.5 |
| NYG @ PHI | 19-11 | D / B / C / **C** | F / B / C / **D** | NYG by 5 |
| NYJ @ KC | 12-35 | F / C / A+ / **D** | B / A / F / **A** | KC by 14.5 |
| HOU @ LAC | 44-22 | A / C / C / **B** | D / F / C / **F** | HOU by 16.5 |
| LV @ SF | 17-38 | F / C / B / **D** | B / A+ / D / **A** | SF by 12.5 |
| ARI @ SEA | 3-17 | D / D / C / **D** | C / B / C / **B** | SEA by 4.5 |
| GB @ NE | 45-27 | A / B / C / **A** | C / F / C / **F** | GB by 21.5 |
| TB @ CHI | 24-27 | D / A / D / **C** | C / B / B / **B** | TB by 3.5 |
| BUF @ MIN | 23-6 | B / A+ / D / **A+** | F / A / B / **F** | BUF by 13.5 |

**Best performances of the week:**
- BUF's defense: Wentz went 8/25 for 81 yards and MIN was 0-8 on third down. This was the best-graded team-game of the season to date (100th percentile).
- JAX's defense against Fagnano.
- SF's defense against LV.

**Worst performances:** MIN's offense, LAC's whole team, and NE's defense.

## Game by game

**JAX 33 @ BAL 10 (TNF; JAX -9.5).** JAX's defense got an A+. BAL could not pass at all: Fagnano went 10/18 for 60 yards with 2 INT, and BAL's pass EPA was -0.75 per dropback. The BAL run game was fine (34-172, Justice Hill 9-85). JAX only needed a C offense: Lawrence was efficient (16/26, 242), but the run game was weak (30-77).
- **Carry forward:** BAL is now 10 points per game across 2 Fagnano starts, at -0.38 adjusted EPA/play. Only ATL's Cooper Rush (-0.44 in 2 starts) has a lower starter split this season. The run game is the only lane. Next for BAL: LAC on MNF (total 38.5), @CAR, @HOU. JAX's defense ranks top 3 against both pass and run. JAX's next three opponents are @TEN, @NYG and vs TEN, with offenses ranked 27, 22 and 27.

**CIN 34 @ ATL 17 (CIN -3).** CIN's offense got an A+: Burrow went 24/29 for 271 and 3 TD, Chase 10-155, and CIN scored 3.78 points per drive. CIN's defense got an F: Bijan ran for 19-100 and ATL averaged 0.19 EPA per rush. ATL committed 12 penalties for 88 yards.
- **Carry forward:** CIN has the league's #1 offense and its #22 defense, the cleanest overs profile there is. Its remaining schedule is the second-easiest (rank 31 of 32). The W10 matchup vs PIT is CIN's pass offense (#1) against PIT's pass defense (#13), and PIT's #1 run game against CIN's #18 run defense. Both sides are flagged.

**CLE 22 @ NO 23 (NO -4.5).** A coin flip.
- Shedeur Sanders' first start: 297 yards and 2 TD, but sacked 5 times (12%). The CLE run game got an F (Judkins 15-43, -0.41 EPA per rush).
- CLE won the turnover battle by 2 and still lost. Its special teams got an A: a 57-yard punt and a missed NO field goal from 52.
- **Carry forward:** CLE's protection ranks 31st (10.6% sack rate), and next week HOU brings the #2 pass rush. That is the clearest pressure spot on the W10 board. NO's run defense ranks 31st, and CAR comes next.

**DAL 27 @ IND 23 (DAL -4.5, IND covered by 0.5).** DAL dominated the play-by-play: 508 yards to 271, 7.2 yards per play to 4.6, and Lamb went 10-195. It still almost lost, because of 14 penalties for 153 yards and a missed field goal from 50 (special teams F). IND's offense got an F: Jones posted a 15 QBR and IND had 5 three-and-outs.
- **Carry forward:** DAL is a real offense (#6) and the league's worst defense, #32 against both pass and run. Its next three are vs SF, vs TEN and vs PHI. SF @ DAL is the biggest mismatch on the W10 slate. IND's pass offense ranks 31st, but its run game ranks 5th, and next week's MIA run defense ranks 28th: a Jonathan Taylor rushing-lane spot.

**DEN 26 @ CAR 21 (DEN -3).** An even game, with C grades on both sides. CAR averaged more yards per play (5.7 to 4.8) but lost through 13 penalties for 119 yards. DEN won despite averaging fewer yards per play, which is part of a pattern.
- **Carry forward:** DEN is 7-2 but ranks only 9th by net rating, so its results have run ahead of its play. DEN is on bye in W10, then hosts LV in W11 (DEN's #7 run game against LV's #27 run defense). CAR (#13 run game) @ NO (#31 run defense) is a rushing-lane spot for Hubbard.

**DET 19 @ MIA 9 (DET -6.5).** DET covered without its offense: the passing game got an F (Goff 170 yards, 0 TD, 1 INT, QBR 19.4) and DET went 1-4 in the red zone. DET's defense (B) handled Willis (13/25, 128).
- **Carry forward:** DET's season defense still ranks 27th (#23 against the pass). For W10 NE @ DET (total 51.5), both offenses rank top 4 in explosive plays and both defenses rank bottom 7 in explosives allowed. That is a long-play spot both ways. MIA's protection ranks 29th, which is a sack spot at IND.

**LAR 20 @ WAS 13 (LAR -4.5).** LAR's defense got a B, and the WAS run game was held to 19-60. Puka Nacua went 14-150 on 19 targets, while Stafford was otherwise ordinary (QBR 36).
- **Carry forward:** LAR's run defense ranks #2, so fade ARI rushing in W10. LAR has the hardest remaining schedule in the league: GB, KC, SF, DAL and SEA twice. WAS plays TNF @ NYG.

**NYG 19 @ PHI 11 (NYG -3).** A defensive slog: NYG sacked Milton 7 times and PHI had 6 three-and-outs. NYG's run game got an F (Singletary 21-31). McCarthy was sacked 6 times (13% sack rate over his two starts).
- **Carry forward:** Milton's first start graded -0.31 adjusted EPA/play, and PHI's last four weeks are the worst in the league (-22.8 net). PHI is on bye in W10, then hosts PIT in W11, which is flagged both as a PIT run-game spot and as a PIT pass-rush spot. For W10 WAS @ NYG (41.5), the NYG pass rush (7 sacks) faces WAS's protection, ranked 19th.

**NYJ 12 @ KC 35 (KC -8.5).** KC's defense got an A against both pass and run (Geno Smith threw for 165 yards and was sacked 5 times), and KC's run game got an A (Walker 18-102). NYJ's special teams got an A+, thanks to KC's missed 51-yard field goal and field-position swings.
- **Carry forward:** NYJ's pass defense ranks 30th, and BUF (#4 pass offense) comes next. That is a flagged big edge, plus BUF's #1 explosive-play rate. KC's run game ranks #2 and goes @ATL next.

**HOU 44 @ LAC 22 (HOU -5.5).** HOU's pass offense got an A+: Stroud threw for 384 yards and 5 TD, Boutte caught 2 TD, and HOU averaged 0.51 EPA per dropback. HOU also sacked Herbert 8 times (20% of dropbacks). LAC is 0-8 with the league's worst offense (#32 overall, #32 pass, #32 run) and the worst protection.
- **Carry forward:** HOU is 3-5 but ranks 11th by net rating and has the 4th-easiest remaining schedule. W10 @ CLE combines HOU's #2 pass rush against CLE's #31 protection with HOU's explosive plays against CLE's #31 explosives allowed. LAC @ BAL on MNF is a meeting of two broken offenses.

**LV 17 @ SF 38 (SF -8.5).** LV turned it over 5 times (Cousins threw 3 INT), and SF scored a defensive or special-teams TD. SF's defense got an A+, while LV ran for only 15-24. SF ran 43 times for 190 yards and held the ball 38:18.
- **Carry forward:** SF @ DAL is the top W10 matchup: SF's #2 pass offense and #3 run game face DAL's #32 pass and run defenses. SF's special teams rank last in the league (-3.5 EPA per game), so expect a kick or return to cost them at some point. Next for LV: SEA, whose #6 run defense means fading LV rushing.

**ARI 3 @ SEA 17 (SEA -9.5).** Lock went 19/28 with a 90 QBR and was never sacked. ARI went 0-2 in the red zone, and Minshew threw for 166 yards and was sacked 3 times.
- **Carry forward:** SEA has been no worse with Lock: +0.02 adjusted EPA/play in his 3 starts, against -0.09 for Darnold. Our Week 9 fair line took 2.5 points off SEA for Lock, and on this evidence that was too much. ARI with Minshew is worse than its season numbers, and LAR's #2 run defense is next.

**GB 45 @ NE 27 (GB +3.5, won outright).** GB's pass offense got an A+ (Love 23/29 for 372 and 3 TD, Watson 7-171), and NE turned it over 4 times (Maye threw 3 INT). The GB run defense got an F, as Kiner and the NE run game got an A.
- **Carry forward:** GB is pass-first: #6 pass offense, #31 run game. W10 vs MIN puts GB's pass game against the #2 pass defense and the #1 sack rate, and GB's run game against MIN's #8 run defense. NE's pass defense ranks 24th, and NE plays @DET next.

**TB 24 @ CHI 27 (CHI -6.5, TB covered).** Caleb Williams threw 4 INT, but CHI won with a defensive or special-teams TD and 279 passing yards. TB was +3 in turnovers and still lost, going 2-12 on third down. TB's defense got an A again.
- **Carry forward:** TB is the clearest "better than its record" team. It is 3-6 but ranks 6th by net rating, with the #1 defense (#1 against the pass) and the 3rd-best last four weeks (+17.7). It also has the easiest remaining schedule in the league. TB is on bye in W10, then plays @DET in W11 (TB's #28 protection against DET's #8 pass rush).

**BUF 23 @ MIN 6 (MNF; BUF -3.5).** BUF's defense got an A+, the best grade of the season. MIN converted 0 of 8 third downs and had the ball for only 17:28. BUF went 1-3 in the red zone, or the margin would have been bigger.
- **Carry forward:** MIN now has the #31 offense and the #2 defense, and Murray is OUT. Wentz has posted -0.26 adjusted EPA/play over 3 starts. That points to MIN unders and fading MIN players, with GB @ home in W10 (total 40.5). BUF ranks #1 by net rating and over the last four weeks (+28.9).

## Season ratings: who is better or worse than their record

Net rating is points per game versus an average opponent, adjusted for opponents and weighted toward the last four weeks. The full table is in `out/week-09-matchups-data.md`.

- **Top tier:** BUF +18.7, JAX +18.4, SF +12.1, CIN +10.4, CHI +9.7.
- **Better than record (buy):**
  - TB is 3-6 but ranks 6th (+9.0).
  - HOU is 3-5 but ranks 11th (+4.4).
  - SEA is 5-4 but ranks 8th.
  - LAR is 5-4 but ranks 12th, and faces the hardest remaining schedule.
- **Worse than record (sell):**
  - MIN is 6-2 but ranks 16th (+0.7), and -13.2 over the last four weeks with Wentz.
  - PIT is 6-2 but ranks 15th.
  - NYG is 5-2-1 but ranks 17th.
  - DEN is 7-2 but ranks 9th.
  - CLE is 5-4 but ranks 21st.
- **Hot over the last four weeks:** BUF +28.9, JAX +23.2, TB +17.7, CHI +16.5.
- **Cold:** PHI -22.8, IND -17.9, BAL -17.1, LAC -15.5, MIN -13.2.
- **Quarterback changes the numbers do not capture** (adjusted offensive EPA/play, by starter):
  - BAL: Jackson +0.12 → Fagnano -0.38.
  - PHI: Hurts -0.12 → Milton -0.31.
  - MIN: Murray -0.18 → Wentz -0.26.
  - ARI: Brissett -0.03 → Minshew -0.10.
  - SEA: Darnold -0.09 → Lock +0.02.
  - NYG: Winston -0.18 → McCarthy +0.04, with Dart on IR.
  - CLE: Watson -0.06 → Sanders -0.21 (1 start).
- **Remaining strength of schedule:**
  - Hardest: LAR, CHI, MIA, NO, TEN.
  - Easiest: TB, CIN, JAX, HOU, SF.
  - This bears on futures: JAX, CIN and HOU have soft schedules ahead, while CHI (7-2) faces the second-hardest.

## Week 10 board (model vs DraftKings, Tuesday open)

The model is a walk-forward fit on Weeks 5-9 (72 games). Its average miss was 9.9 points against 9.35 for the market, and it correlates 0.80 with the market. **It does not know about quarterback changes**, so read every gap against the notes above. Spreads are the home team's line.

| Game | DK | Model | Read |
|---|---|---|---|
| WAS @ NYG (TNF) | NYG -2.5, 41.5 | NYG -0.9 | Small gap. NYG's pass rush (7 sacks in W9) faces WAS protection ranked 19th. |
| NE @ DET | DET -2.5, 51.5 | DET -0.8 | Explosive-play spot both ways; the total is fair to high. |
| KC @ ATL | ATL +3.5 | ATL +3.9 | Agrees. KC's explosives (#5) face ATL's #29 explosives allowed. |
| HOU @ CLE | CLE +4.5, 39.5 | CLE +3.9 | Agrees on the side. HOU's pass rush against CLE's protection is the best sack/pressure spot of the week. |
| MIN @ GB | GB -5.5, 40.5 | GB -2.2 | Model leans MIN. Wentz is worse than the model's MIN rating (which includes 5 Murray starts), so most of the gap is quarterback. Both run games are flagged as fades, and MIN's #1 pass rush faces GB's #10 protection: lean Under. |
| JAX @ TEN | TEN +10.5 | TEN +13.5 | Model says more JAX. JAX's pass offense (#3) faces TEN's #28 pass defense, and TEN's offense goes into JAX's top-3 defense. |
| MIA @ IND | IND -2.5 | IND -0.4 | IND's run game (#5) faces MIA's #28 run defense, and IND's pass rush faces MIA's #29 protection. IND's passing is the problem (#31). |
| CAR @ NO | NO -1.5, 48.5 | NO +3.4 | **Biggest side gap: the model has CAR by 3.4.** CAR's run game faces NO's #31 run defense. |
| BUF @ NYJ | NYJ +8.5, 50.5 | NYJ +9.4 | Agrees. BUF's passing faces NYJ's #30 pass defense. |
| SEA @ LV | LV +3.5 | LV +5.2 | Model leans SEA (Lock has not been a downgrade). LV's run game is a fade. |
| LAR @ ARI | ARI +9.5, 40.5 | ARI +5.1 | Model says fewer points, but ARI with Minshew is worse than its season numbers, so the market is probably right. Fade ARI rushing. |
| SF @ DAL | DAL +4.5, 55.5 | DAL +6.1 | The top mismatch: SF's #2 passing and #3 rushing face DAL's #32 and #32 defenses. Lean SF and SF yardage props; the total is already 55.5. |
| PIT @ CIN | CIN -3.5, 48.5 | CIN -3.0 | Agrees. Lanes are CIN's passing and PIT's running; fade CIN rushing into PIT's #1 run defense. |
| LAC @ BAL (MNF) | BAL -5.5, 38.5 | BAL -2.5 | Model leans LAC, and its BAL rating still includes 4 Jackson starts, so the true gap is bigger. Two bottom offenses (LAC #32; BAL with Fagnano): lean Under. |

## How to use this

- **Lanes on the card:** the W10 rushing-lane spots are CAR @ NO (Hubbard), MIA @ IND (Taylor), SF @ DAL (SF backs), PIT @ CIN (PIT backs) and BUF @ NYJ (Cook). Fade rushing in MIN @ GB (both sides), LAR @ ARI (ARI), SEA @ LV (LV) and JAX @ TEN (TEN).
- **Team-by-team intel:** `out/week-09-matchup-intel.md` lists every remaining game for every team with the flagged spots. Re-run the script after each week (`--week 10` on the Tuesday after Week 10) so the ratings and flags roll forward.
- **Sample size:** nine games per team is still a small sample. Treat the edges as prompts to check against injuries, the depth chart and price.
