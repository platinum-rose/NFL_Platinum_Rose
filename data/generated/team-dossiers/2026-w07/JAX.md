# JAX Jaguars — dossier, target Week 7 (data through W6)
Built 2026-10-20T23:00:32.141Z · git 45833b2 · no market data (lines, ATS/OU, prices) in this file · roster_gate: passed — player names appear ONLY in the Availability section (roster-gated); never name players from anywhere else.
Freshness: standing current (W6) · ESPN game log current (W6) · nflverse efficiency current (W6) · FTN current (through W6) · coaching historical_context_only · availability built · priors built.

## Identity [Source: schedules.csv/coaching/slate]
JAX · AFC AFC South · HC Liam Coen · EverBank Stadium (outdoors, grass) · W7: BYE

## Standing [Source: data/generated/team-profiles/team-standings-2026-w06.json, through W6]
4-2-0 (0.667) · PF 154 PA 104 (+50) · home 3-1-0 · away 1-1-0 · div 0-1-0 · conf 3-2-0 · streak L1 · div rank 1 · conf rank 3 (win% then point diff; not official tiebreakers)

## Game log (ESPN, W1–W6)
| Wk | Opp | H/A | Res | Score | Yds | YPP | Opp YPP | 3D% | RZ TD% | Sk (for/against) | TO (give/take) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | CLE | H | W | 34-10 | 360 | 6.4 | 5.6 | 0.500 | 1 | 5/1 | 0/2 |
| 2 | DEN | A | L | 13-20 | 268 | 4.9 | 6.6 | 0.417 | 0.50 | 0/2 | 1/1 |
| 3 | NE | H | W | 35-6 | 315 | 5.2 | 5.3 | 0.667 | 1 | 2/1 | 1/3 |
| 4 | CIN | A | W | 22-17 | 323 | 6 | 6.2 | 0.455 | 0.50 | 2/4 | 0/2 |
| 5 | PHI | H | W | 19-17 | 408 | 6 | 3.9 | 0.312 | 0 | 1/2 | 1/0 |
| 6 | HOU | H | L | 31-34 | 412 | 6.1 | 7.2 | 0.583 | 0.75 | 0/0 | 1/1 |
Season (ESPN, 6g): 25.7 PPG / 17.3 allowed · 348 yd/g (5.77 YPP) vs 346 allowed (5.80) · 3D 0.479 · RZ TD 0.667 · sacks 1.7 made / 1.7 taken per g · TO margin +5 (4 give / 9 take) · 2.64 pts/drive

## Efficiency (nflverse, through W6, current) [Source: data/generated/team-profiles/team-analytic-snapshots-2026-w6.json, data/generated/team-profiles/team-regression-snapshots-2026-w6.json]
EPA/play off 0.152 (#4) · def -0.033 (#12) · EPA/dropback 0.275 · CPOE 3.61 · neutral pass rate 0.537 · sack rate allowed 0.051 / generated 0.049
Pythag win% 0.717 (4.30 exp wins, delta -0.30, rank 19) · one-score 2-2
Unavailable in source (null, not imputed): dropback_success_rate, success_rate, explosive_play_rate, explosive_pass_rate, explosive_run_rate, pressure_rate_allowed, pressure_rate_generated, early_down_pass_rate, shotgun_rate, no_huddle_rate, play_action_rate, motion_rate, fumble_recovery_pct, takeaway_margin, rz_td_pct_off, rz_td_pct_def, third_down_over_expected.

## FTN Stats iQ (team tables; through W6, current; statistical context only) [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, generated 2026-10-20T15:14:32.004Z]
- team-defense/efficiency: GP 6 · EPA/PLY -0.029 · DVOA -10.7% · SUCC% 42.4% · EXP% 7.9% · CONV% 37.7% · TO 7 · TO% 2.0% · 3&O 19.0% · MTKL% 9.5% · PEN% 4.2% · PENY 28.3
- team-defense/overview: GP 6 · YD/PLY 6.0 · PT/GM 17.3 · FD% 28.9% · TO 7 · DPBK% 65.2% · YD 1,698 · TD 7 · INT 7 · RUSH% 34.8% · YD__2 433 · TD__2 4
- team-defense/pass-rush: GP 6 · DPBK 232 · SK 10 · SK% 4.3% · QBH% 14.2% · PRESS 69 · PRESS% 29.7% · QPRESS% 50.7% · TTPR 2.42 · DISR% 0.4% · BLZ% 30.6%
- team-defense/passing-analytics: GP 6 · EPA/DB 0.060 · SUCC% 47.0% · DVOA 5.4% · CPOE 5.51% · CBALL% 71.2% · EXP% 15.0% · INTW% 5.2% · TGHT% 27.4% · OPEN% 62.3% · TA% 4.7% · DROP% 1.9%
- team-defense/rush-analytics: GP 6 · EPA/ATT -0.195 · SUCC% 33.9% · DVOA -31.1% · aRYOE  · EXP% 5.6% · STF% 20.2% · YBCO 0.97 · YACO 1.67
- team-offense/efficiency: GP 6 · EPA/PLY 0.152 · DVOA 16.0% · SUCC% 47.0% · EXP% 10.5% · CONV% 47.4% · TO 4 · TO% 1.10% · PENY 40.3 · PEN% 8.84%
- team-offense/overview: GP 6 · YD/PLY 6.0 · PT/GM 25.7 · FD% 32.6% · TO 4 · DPBK% 55.8% · YD 1,480 · TD 14 · INT 4 · RUSH% 44.2% · YD__2 677 · TD__2 4
- team-offense/pass-protection: GP 6 · SK 10 · SK% 5.0% · QBSK% 30.0% · QBH% 14.9% · PRESS% 25.2% · UPRES% 28.3% · BLITZ% 31.7% · TTPR 2.51 · TTT 2.49 · EPA/DB -0.243 · DVOA -62.4% · SUCC% 33.3% · EPA/DB__2 0.439 · DVOA__2 49.5% · SUCC%__2 55.6%
- team-offense/passing-analytics: GP 6 · EPA/DB 0.267 · SUCC% 50.0% · DVOA 42.5% · CPOE 2.7% · CBALL% 73.5% · EXP% 17.5% · INTW% 3.2% · HLT% 1.6% · TA% 3.2% · DROP% 5.9% · aDOT 8.1 · aYAC 5.3
- team-offense/rushing-analytics: GP 6 · EPA/ATT 0.007 · SUCC% 43.1% · DVOA 2.3% · aRYOE  · EXP% 10.0% · STF% 18.8% · aYBCO 1.20 · aYACO 2.61 · CRT% 66.1%
- team-offense/tempo: GP 6 · PLY/GM 60.3 · TOP 29.91 · DRV/GM 10.0 · SEC/PLY 29.7 · PLY/DRV 6.0 · YD/DRV 36.0 · SEC/DRV 179 · 3&O 10.0% · SCD% 46.7%
- team-offense/tendencies: GP 6 · DPBK% 55.8% · RUSH% 44.2% · SHG% 54.4% · NH% 3.6% · MOT% 62.7% · PA% 22.8% · IZ% 35.0% · OZ% 33.1% · MD% 10.0% · PWR% 3.1% · CTR% 5.6%
- QB1 (Trevor Lawrence): air-yards [GP 6, aDOT 8.1, AIR 1,500, cAIR 1,015, cAIR% 67.7%, PRYD 485, PRYD% 32.3%, dAIR 91] · analytics [GP 6, EPA 53.9, EPA/DB 0.267, SUCC% 50.0%, ACOMP% 73.2%, DVOA 24.9%, DYAR 421, xCOMP 62.2%, CPOE 2.7%, aYDOE 0.717] · efficiency [GP 6, CBALL% 73.5%, INTW% 3.2%, HLT% 1.6%, EXP% 11.4%, DROP% 5.9%, TA% 3.2%, TD% 7.6%, INT% 2.2%, SK% 5.0%] · overview [GP 6, DPBK 202, ATT 185, COMP 120, COMP% 64.9%, YD 1,480, YD/ATT 8.0, TD 14, INT 4, FUML 0] · pressure [GP 6, SK 10, SK% 5.0%, QBSK% 30.0%, AVSK% 5.4%, QBH% 14.9%, TTPR 2.51, TTT 2.49, RATE 25.2%, EPA/DB -0.243, DVOA -62.4%, RATE__2 74.8%, EPA/DB__2 0.439, DVOA__2 49.5%]

## Power (separate signal, not a projection) [Source: data/generated/team-profiles/team-power-ratings-2026.json]
SRS 11.19 (#1) · net PPG 10.6 (#2) · Pythag 0.792 (#1) · model rank #1

## Scheme context (historical_context_only; historical context only, stale after 2026-11-03T18:43:44.785Z)
HC Liam Coen · neutral pass rate 0.537 · sample 2026-09-13 → 2026-10-18 (6g) · 4th-down, shotgun, no-huddle, play-action, motion, pace: unavailable (null in source)
Secondary-matchup context is manual_review_capped and keyed to source Week 6 — stale_prior_week_matchups. See JAX.json → scheme_context.secondary_matchup.

## Availability (built; intel only; roster_gate passed; ESPN 2026-10-20T22:47:55Z)
Names below are ESPN/operator data re-checked against the roster snapshot; ESPN statuses lag, official inactives decide.
QB: Trevor Lawrence [ok]
Out/IR: Anton Harrison OT Injured Reserve
Questionable/Doubtful: Ross Matiscik LS Questionable; Montaric Brown CB Questionable; Antonio Johnson S Questionable
Roster IR/Out group, unconfirmed (ESPN day-to-day, not confirmed Out): 9 players; skill: none
OL/DL cluster risk (derived): OL watch, DL none
Impact digest (top by score): Bhayshul Tuten RB active_news/unknown
Projected starters: manual_and_estimated_signals, 1 players

## Priors (prior_season / preseason_prior; not current-season evidence)
2025 final [prior_season]: 13-4 · diff 138 · Pythag 0.693 · SRS #3 · EPA off #15 def #3 · DVOA 17.7 (#6) off 3.9 def -10.1
Camp notes [preseason_prior, Jul 31]: 1 kept, 1 withheld (player left the team)
Trench composite [preseason_prior, 2026-09-02]: #10 · run block z -0.42 · pass block z 0.51 · run D z 1 · pass rush z -0.51
