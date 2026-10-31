# Week 8 synthesis digest (FRI build) - Fri 2026-10-30 ~3:45 PM PT, saved under the Saturday filename so build.py reads it. Rewrite Saturday night after the BKR prop capture.
Status: PROPOSALS ONLY. Nothing placed, promoted or written to Supabase. Tier key: 1 = matchup/role data, 2 = named expert (2+ independent = consensus), 3 = market price, 4 = price only.
Method (Friday, no per-game deep syntheses this week): fair line = Action Network consensus line moved 35% toward an SRS + home-field baseline (`data/generated/team-profiles/team-power-ratings-2026.json`, through Week 7); fair total = consensus total moved 35% toward a points-for/points-against baseline (nflverse 2026 results). Confidence = `scripts/intel/margin-simulator.mjs` cover probability excluding pushes at the current consensus number. Inputs and outputs: `reports/intel/w08-model/fair-lines-w08.json`. The baseline does not see injuries; each note says where that matters.

## A. Freshness (Fri 10/30 afternoon)
| Input | Status | Note |
|---|---|---|
| BKR game lines + props | Thu 10/29 4:00 PM PT | props for 7 of 13 Sunday/Monday games; Saturday capture still to do |
| Action Network splits + current consensus line | Fri 10/30 ~3:40 PM PT | browser read (VM proxy blocks the API); `reports/engineering/week8-an-browser-pull-2026-10-30/raw.json` |
| Action Network openers | Sun 10/25 5 PM PT cutoff | `data/odds/actionnetwork-openers-2026-w08.json` |
| Injuries | ESPN Friday designations ~3:35 PM PT; availability rebuilt by the 3 PM cadence | inactives pending Sunday |
| Expert picks | Supabase SELECT pull 94 rows (Fri) | no cleaned YouTube digest this week |

## B. Slate (consensus Fri ~3:40 PM PT; BKR Thu in brackets where different)
| Game | Spread | Total | Kick (PT) |
|---|---|---|---|
| TEN@CIN | CIN -12.5 [BKR -10.5] | 46.5 [46] | Sun 10:00 |
| IND@JAX | JAX -10 | 46.5 [46] | Sun 10:00 |
| CLE@PIT | PIT -3.5 | 39.5 [38.5] | Sun 10:00 |
| BAL@BUF | BUF -3 | 54.5 [55] | Sun 10:00 |
| MIN@DET | DET -3.5 [BKR -3 -119] | 46 | Sun 10:00 |
| ATL@TB | TB -2.5 | 43.5 [44.5] | Sun 10:00 |
| ARI@DAL | DAL -7 | 54.5 | Sun 10:00 |
| LV@NYJ | NYJ -1.5 [BKR -1] | 45.5 [46] | Sun 10:00 |
| LAC@LAR | LAR -6.5 | 45.5 [45] | Sun 1:05 |
| NE@MIA | NE -7 | 43.5 | Sun 1:25 |
| KC@DEN | KC -1.5 [BKR -1] | 40.5 | Sun 1:25 |
| PHI@WAS | WAS -6 | 40.5 | Sun 5:20 SNF |
| CHI@SEA | SEA -3 | 46.5 [46] | Mon 5:15 MNF |
CAR@GB is FINAL (GB 27, CAR 19). Every CAR/GB signal is dropped.

## C. Sides and totals: Platinum Rose recommendations (elevation bar applied)
| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| MIN@DET | spread | MIN | conf 58.1%; fair DET -0.4 vs DET -3.5 (edge 3.1); MIN #1 SRS (8.5) and 6-0; Sharp or Square on MIN +3.5; DET without Kerby Joseph, MIN pass game vs a high-vulnerability DET secondary | 1+2 (B) | MIN +3.5 (BKR shows +3 +102; take +3.5 where offered, +3 at plus money). Risk: line moved 3 to 3.5 toward DET with 51% of money on 42% of bets; Gibbs and St. Brown carry no designation |

## L. Leans that did not clear the bar
| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| TEN@CIN | spread | CIN | conf 57.2%; fair CIN -15.0 vs -12.5 | 1 (C) | CIN -12.5. Not elevated: the line already moved 10 to 12.5 after Carnell Tate was ruled out; the value is in the SuperContest at -10.5 |
| LAC@LAR | spread | LAR | conf 54.6%; fair LAR -8.2 | 1 (C) | LAR -6.5. Not elevated: 70% of bets on LAR but the line fell from 7.5 to 6.5 (reverse line movement against LAR) and no named expert on the side |
| PHI@WAS | spread | PHI | conf 54.6%; fair WAS -4.3 before injuries | 2 (C) | PHI +6. Not elevated: the baseline ignores DeVonta Smith, Dontayvion Wicks, Britain Covey and Jonathan Jones all OUT; Action Network writer on PHI +6; big moneyline money on PHI (68% of money, 17% of bets) |
| CHI@SEA | spread | CHI | conf 53.7%; fair SEA -1.7 | 2 (C) | CHI +3. Not elevated: edge 1.3; Action Network and Even Money on CHI +3.5, Sharp or Square and Warren Sharp on SEA |
| BAL@BUF | spread | BAL | market + experts; model fair BUF -4.0 disagrees | 2 flag (C) | BAL +3. Not elevated: model on BUF. Warren Sharp, Sharp or Square, Even Money and BettingPros on BAL +3.5; 63% of spread money on BAL with 44% of bets (big-money flag); line 3.5 to 3 |
| KC@DEN | total | Under | RLM: 77% of bets on the Over, total fell 42 to 40.5; Even Money U41.5, BettingPros U42.5 | 2 (C) | Under 40.5. Not elevated: model fair 40.6, no edge |
| ATL@TB | total | Under | big-money flag: 70% of bets on the Over, 52% of money on the Under; total 45 to 43.5; Action Network and Even Money Under 45.5 | 2 flag (C) | Under 43.5. Not elevated: model leans Over (fair 44.7) |
| CLE@PIT | spread | CLE | Even Money, BettingPros and Sharp or Square on CLE +3.5 | 2 (C) | CLE +3.5. Not elevated: model fair PIT -4.6 disagrees |
| NE@MIA | spread | MIA | BettingPros, Sharp or Square and Even Money on MIA +7.5 | 2 (C) | MIA +7. Not elevated: model fair NE -8.2 disagrees; A.J. Brown (NE) questionable |

## D. Teasers (6-pt) named by experts
| Game | Leg | Source | Tier | Note |
|---|---|---|---|---|
| MIN@DET | MIN +9.5 | Even Money (MIN +0.5 listed is a teased DET -6.5 the other way; reads as a MIN teaser leg) | 2 | Wong-eligible through 3 and 7 |
| PHI@WAS | PHI +10.5 | Even Money (Eagles +4.5) | 2 | label as teaser leg |

## F. Availability / QB flags (Friday designations)
- OUT: DeVonta Smith, Dontayvion Wicks, Britain Covey, Jonathan Jones, Jihaad Campbell (PHI); Carnell Tate, Tyjae Spears (TEN); Emeka Egbuka (TB); Kerby Joseph (DET); Derwin James Jr., Deane Leonard (LAC); RJ Harvey, Talanoa Hufanga (DEN); Brian Robinson Jr. (ATL); Kyle Dugger (CIN); Jaylinn Hawkins (BAL); KaVontae Turpin (DAL); Kadyn Proctor (MIA).
- QUESTIONABLE: A.J. Brown and TreVeyon Henderson (NE); Dalton Kincaid, DJ Moore, Spencer Brown (BUF); Jaylen Waddle, Zach Allen, Garett Bolles (DEN); George Pickens (DAL); Calvin Ridley (TEN); Breece Hall (NYJ); Trent McDuffie (LAR); Jakobi Meyers (JAX); Kenny Gainwell (TB); Rashid Shaheed, Zach Charbonnet (SEA); Charles Cross (SEA, doubtful); Colston Loveland, Kyle Monangai (CHI).
- Weather (Open-Meteo, Fri 6 PM PT; `data/research-intel/review/2026-w08-weather-venue.json`): NE@MIA 80% rain, wind 32 km/h gusting 38 (review); ATL@TB 45% rain, wind 21 km/h (review). Other outdoor sites calm and dry.
- QBs: every Sunday/Monday starter has no designation (a QB with no report entry starts).

## H. Pools
See `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md` (Friday 1 PM re-check).

## I. Open Week 8 exposure
BKR weekend parlays from `handoffs/2026-10-29-1740-claude-week8-tnf-placed-weekend-parlays.md` (both alive after TNF), FanDuel Predicts promo tickets (`reports/bets/2026-w08-fdp-promo-plan.md`).

## J. Dropped / guarded
| Item | Why |
|---|---|
| PHI@WAS Over 40.5 | Baseline says 42.7, but it cannot see PHI's receiver outs; 83% of bets on the Over and the total fell 41 to 40.5 |
| IND@JAX JAX -10, ARI@DAL DAL -7 | Edges 1.4 and 1.2, below the bar; ARI moneyline drew 73% of the money on 10% of bets |
| LV@NYJ | No edge; 82% of bets on LV, line steady |
