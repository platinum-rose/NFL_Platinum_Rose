# PIT Steelers — dossier, target Week 6 (data through W5)
Built 2026-10-15T21:03:57.067Z · git d93786a · no market data (lines, ATS/OU, prices) in this file · roster_gate: passed — player names appear ONLY in the Availability section (roster-gated); never name players from anywhere else.
Freshness: standing current (W5) · ESPN game log current (W5) · nflverse efficiency current (W5) · FTN current (through W5) · coaching historical_context_only · availability built · priors built.

## Identity [Source: schedules.csv/coaching/slate]
PIT · AFC AFC North · HC Mike McCarthy · Acrisure Stadium (outdoors, grass) · W6: @ TB Sun 10/18 10:00

## Standing [Source: data/generated/team-profiles/team-standings-2026-w05.json, through W5]
3-2-0 (0.600) · PF 111 PA 109 (+2) · home 3-0-0 · away 0-2-0 · div 1-1-0 · conf 2-2-0 · streak W1 · div rank 3 · conf rank 8 (win% then point diff; not official tiebreakers)

## Game log (ESPN, W1–W5)
| Wk | Opp | H/A | Res | Score | Yds | YPP | Opp YPP | 3D% | RZ TD% | Sk (for/against) | TO (give/take) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ATL | H | W | 20-13 | 264 | 4.1 | 4.2 | 0.231 | 0.50 | 4/2 | 1/2 |
| 2 | NE | A | L | 3-20 | 235 | 3.5 | 6.2 | 0.167 | 0 | 3/4 | 2/2 |
| 3 | CIN | H | W | 30-27 | 411 | 7 | 6.3 | 0.583 | 0.33 | 1/2 | 1/2 |
| 4 | CLE | A | L | 24-27 | 361 | 5.6 | 6 | 0.308 | 0.67 | 2/5 | 2/2 |
| 5 | IND | H | W | 34-22 | 352 | 6.5 | 4.8 | 0.364 | 1 | 1/1 | 0/0 |
Season (ESPN, 5g): 22.2 PPG / 21.8 allowed · 325 yd/g (5.34 YPP) vs 324 allowed (5.50) · 3D 0.328 · RZ TD 0.545 · sacks 2.2 made / 2.8 taken per g · TO margin +2 (6 give / 8 take) · 2.04 pts/drive

## Efficiency (nflverse, through W5, current) [Source: data/generated/team-profiles/team-analytic-snapshots-2026-w5.json, data/generated/team-profiles/team-regression-snapshots-2026-w5.json]
EPA/play off -0.045 (#23) · def 0.014 (#16) · EPA/dropback -0.082 · CPOE -2.88 · neutral pass rate 0.649 · sack rate allowed 0.070 / generated 0.065
Pythag win% 0.511 (2.55 exp wins, delta 0.45, rank 10) · one-score 2-1
Unavailable in source (null, not imputed): dropback_success_rate, success_rate, explosive_play_rate, explosive_pass_rate, explosive_run_rate, pressure_rate_allowed, pressure_rate_generated, early_down_pass_rate, shotgun_rate, no_huddle_rate, play_action_rate, motion_rate, fumble_recovery_pct, takeaway_margin, rz_td_pct_off, rz_td_pct_def, third_down_over_expected.

## FTN Stats iQ (team tables; through W5, current; statistical context only) [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, generated 2026-10-13T18:14:44.676Z]
- team-defense/efficiency: GP 5 · EPA/PLY 0.000 · DVOA -1.8% · SUCC% 43.8% · EXP% 10.8% · CONV% 38.2% · TO 6 · TO% 2.0% · 3&O 10.7% · MTKL% 12.2% · PEN% 4.0% · PENY 27.2
- team-defense/overview: GP 5 · YD/PLY 5.7 · PT/GM 19.4 · FD% 29.0% · TO 6 · DPBK% 58.9% · YD 1,168 · TD 5 · INT 4 · RUSH% 41.1% · YD__2 517 · TD__2 4
- team-defense/pass-rush: GP 5 · DPBK 175 · SK 11 · SK% 6.3% · QBH% 14.3% · PRESS 36 · PRESS% 20.6% · QPRESS% 33.3% · TTPR 2.65 · DISR% 1.1% · BLZ% 26.9%
- team-defense/passing-analytics: GP 5 · EPA/DB 0.040 · SUCC% 47.4% · DVOA 11.4% · CPOE -4.22% · CBALL% 74.7% · EXP% 18.6% · INTW% 3.8% · TGHT% 19.0% · OPEN% 68.4% · TA% 0.6% · DROP% 2.5%
- team-defense/rush-analytics: GP 5 · EPA/ATT -0.056 · SUCC% 38.5% · DVOA -17.0% · aRYOE  · EXP% 9.0% · STF% 23.0% · YBCO 0.98 · YACO 1.79
- team-offense/efficiency: GP 5 · EPA/PLY -0.059 · DVOA 1.3% · SUCC% 40.6% · EXP% 9.0% · CONV% 36.4% · TO 5 · TO% 1.61% · PENY 30.8 · PEN% 6.45%
- team-offense/overview: GP 5 · YD/PLY 5.6 · PT/GM 19.8 · FD% 26.5% · TO 5 · DPBK% 66.1% · YD 1,234 · TD 10 · INT 4 · RUSH% 33.9% · YD__2 508 · TD__2 1
- team-offense/pass-protection: GP 5 · SK 14 · SK% 6.8% · QBSK% 42.9% · QBH% 16.1% · PRESS% 25.4% · UPRES% 31.4% · BLITZ% 25.4% · TTPR 2.77 · TTT 2.58 · EPA/DB -0.637 · DVOA -106.0% · SUCC% 21.2% · EPA/DB__2 0.081 · DVOA__2 9.1% · SUCC%__2 47.7%
- team-offense/passing-analytics: GP 5 · EPA/DB -0.101 · SUCC% 41.0% · DVOA 5.9% · CPOE -2.6% · CBALL% 67.9% · EXP% 15.5% · INTW% 2.1% · HLT% 1.6% · TA% 4.3% · DROP% 4.8% · aDOT 8.5 · aYAC 6.5
- team-offense/rushing-analytics: GP 5 · EPA/ATT 0.025 · SUCC% 40.0% · DVOA 7.2% · aRYOE  · EXP% 9.5% · STF% 21.9% · aYBCO 0.72 · aYACO 3.03 · CRT% 66.0%
- team-offense/tempo: GP 5 · PLY/GM 62.0 · TOP 28.57 · DRV/GM 11.4 · SEC/PLY 27.6 · PLY/DRV 5.4 · YD/DRV 30.6 · SEC/DRV 150 · 3&O 28.1% · SCD% 36.8%
- team-offense/tendencies: GP 5 · DPBK% 66.1% · RUSH% 33.9% · SHG% 64.8% · NH% 9.7% · MOT% 48.1% · PA% 18.5% · IZ% 17.1% · OZ% 25.7% · MD% 39.0% · PWR% 3.8% · CTR% 0.0%
- QB1 (Aaron Rodgers): air-yards [GP 5, aDOT 8.5, AIR 1,575, cAIR 672, cAIR% 42.7%, PRYD 903, PRYD% 57.3%, dAIR 82] · analytics [GP 5, EPA -17.8, EPA/DB -0.088, SUCC% 41.6%, ACOMP% 67.2%, DVOA -12.8%, DYAR -81, xCOMP 61.9%, CPOE -2.5%, aYDOE -0.347] · efficiency [GP 5, CBALL% 68.1%, INTW% 2.2%, HLT% 1.6%, EXP% 9.2%, DROP% 4.9%, TA% 4.3%, TD% 5.4%, INT% 2.2%, SK% 6.9%] · overview [GP 5, DPBK 202, ATT 185, COMP 110, COMP% 59.5%, YD 1,234, YD/ATT 6.7, TD 10, INT 4, FUML 1] · pressure [GP 5, SK 14, SK% 6.9%, QBSK% 42.9%, AVSK% 1.5%, QBH% 15.8%, TTPR 2.77, TTT 2.59, RATE 25.2%, EPA/DB -0.614, DVOA -105.6%, RATE__2 74.8%, EPA/DB__2 0.089, DVOA__2 10.0%]

## Power (separate signal, not a projection) [Source: data/generated/team-profiles/team-power-ratings-2026.json]
SRS 2.48 (#11) · net PPG 0.4 (#15) · Pythag 0.511 (#15) · model rank #13

## Scheme context (historical_context_only; historical context only, stale after 2026-10-27T06:07:42.084Z)
HC Mike McCarthy · neutral pass rate 0.649 · sample 2026-09-13 → 2026-10-11 (5g) · 4th-down, shotgun, no-huddle, play-action, motion, pace: unavailable (null in source)
Secondary-matchup context is manual_review_capped and keyed to source Week 6 — current. See PIT.json → scheme_context.secondary_matchup.

## Availability (built; intel only; roster_gate passed; ESPN 2026-10-15T21:03:20Z)
Names below are ESPN/operator data re-checked against the roster snapshot; ESPN statuses lag, official inactives decide.
QB: Aaron Rodgers [ok]
Out/IR: Ben Skowronek WR Out; Roman Wilson WR Out; Michael Pittman Jr. WR Injured Reserve; DeShon Elliott S Injured Reserve; Derrick Harmon DT Injured Reserve
Questionable/Doubtful: Jamel Dean CB Questionable; Jalen Ramsey CB Questionable; Keeanu Benton DT Questionable
Roster IR/Out group, unconfirmed (ESPN day-to-day, not confirmed Out): 7 players; skill: Cole Burgess WR; Max Hurleman RB
OL/DL cluster risk (derived): OL none, DL watch
Impact digest (top by score): Aaron Rodgers QB active_news/unknown; Robert Spears-Jennings S active_news/unknown; Jaylen Warren RB active_news/unknown; Sean Murphy-Bunting CB active_news/unknown
Projected starters: manual_and_estimated_signals, 4 players

## Priors (prior_season / preseason_prior; not current-season evidence)
2025 final [prior_season]: 10-7 · diff 10 · Pythag 0.515 · SRS #17 · EPA off #12 def #21 · DVOA 8.2 (#12) off 2.3 def -5.5
Camp notes [preseason_prior, Jul 31]: 2 kept, 0 withheld (player left the team)
Trench composite [preseason_prior, 2026-09-02]: #8 · run block z -0.80 · pass block z 0.44 · run D z 0.24 · pass rush z 1.42
