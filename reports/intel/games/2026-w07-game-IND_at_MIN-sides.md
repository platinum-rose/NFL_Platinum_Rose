# IND @ MIN — Week 7 game synthesis, pass `sides`

As-of: Fri 2026-10-23 18:29 PT · Kickoff: Sun 10/25 10:00 PT (U.S. Bank Stadium, fixed dome) · Inactives ~8:30 AM PT Sun · Packet built 2026-10-24T01:26:41Z · roster_vet: PASS (age 0.0h; 1 INFO / 1 UNVERIFIED)

## Recommendation box

- **SPREAD: PASS (lean MIN -6.5 -107 BKR)** | tier PASS | fair MIN -7.0 | edge +0.5 pt (MIN) | becomes MIN tier C at -6 or better; IND not playable unless +7.5
- **TOTAL: UNDER 41.5 -109 BKR** | tier B | fair 39.5 | edge 2.0 pts | playable to u41 -110; pass at 40.5 or lower
- **MONEYLINE / SU: PASS on price (MIN -253)** | SU winner MIN | fair MIN ~-241 (70.7% excl. tie) | no edge vs -253 (71.7% break-even)
- **SuperContest (MIN -6.5):** not a candidate. Lean MIN, but the edge is under the threshold.
- **Pool:** SU **MIN**, confidence **13/16** (BUK BUK: MIN). Survivor-safe per two YouTube voices.
- Card-fit: Under 41.5 `parlay_leg_ok` = yes (independent of side; avoid pairing with a MIN big-margin leg). `standalone_preferred` = no (B-tier, not a top-margin read).

## Game script

Minnesota (5-0, off a W6 bye) wins with defense: 12.8 PPG allowed, EPA/play allowed -0.210 (#1), blitz rate 70% and pressure rate 38.3% [Source: MIN.md dossier FTN/nflverse, built 2026-10-22T22:58Z]. Its offense is ordinary: EPA/play -0.088 (#26), 4.60 YPP, 61.6 plays/gm at 31.0 sec/play. Indianapolis (2-4) passes 60% of the time with a QB at CPOE -6.2%, INT-worthy rate 6.0%, 15 sacks taken, and EPA/dropback -0.967 under pressure [Source: IND.md FTN QB1 block]. Most likely script: Flores pressure produces 1-2 Colts giveaways and stalled drives, MIN builds a 10-14 point lead on a short-field score or two, then shortens the game with the run. MIN games average a league-low 34.6 combined points [Source: Sharp Football Hribar worksheet, news_notes, 2026-10-21]. MIN results: 39-22, 9-3, 23-16, 15-10, 23-13. That is 1 of 5 over 41.5, and **only 2 of 5 wins by 7 or more**. The low totals compress margins, which is why I'm not laying 6.5.

## QB / availability

- QBs: **Daniel Jones** starts for IND (Steichen confirmed) [Source: ESPN 2026-10-19, news_notes]. **Kyler Murray** for MIN [Source: qb_operator_notes, Andy-confirmed]. The Anthony Richardson misdemeanor charge doesn't affect the depth chart.
- **Official final report (vikings.com, Fri 10/23 2:30 PM):** IND **Out**: CB Ahmad "Sauce" Gardner (calf), WR Anthony Gould (concussion), TE Tyler Warren (groin). IND **Questionable**: LB Bryce Boettcher (groin, DNP), LB C.J. Allen (ankle, DNP), CB Justin Walley (knee, LP), P Rigoberto Sanchez (foot, DNP). MIN: only RB Jordan Mason questionable (thumb, full Friday). Hockenson, Jefferson, Darrisaw, O'Neill, Addison and Pierre carry no designation.
- IND WR Alec Pierce stays on IR (no practice window) [Source: Rotowire 2026-10-19].
- Swing scenarios: with **Boettcher and Allen both out**, IND's LB group is thin against TE/RB volume, which nudges MIN margin up. That isn't enough on its own to make the side playable. With **Sanchez out** (punter), IND's field position gets worse, a small under/MIN positive. The CB room without Gardner, and possibly Walley, faces Jefferson coming off a bye [Source: secondary_matchups sec_cbe82e07418148b3, severity 4.95 "medium"].

## Market

- AN open (Sun 10/18 5 PM PT): MIN -5.5 (-112), total 42.5, ML MIN -272 / IND +210. BKR current (paste ~11:40 PT, confirmed by BKR board capture 2026-10-23T20:11Z): MIN -6.5 -107 / IND +6.5 -109, o/u 41.5 (-107/-109), ML -253/+218 [Source: bookmaker-gamelines-2026-10-23-week7.raw.txt; bookmaker-live-2026-10-23-colts-at-vikings.json].
- Movement: side +1.0 toward MIN (5.5→6.5) after the Ballard firing and Warren news. Total -1.0 (42.5→41.5). The ML barely moved, and slightly toward IND.
- SuperContest line MIN -6.5 = BKR (no gap) [Source: week-07-lines.json, captured 2026-10-22T15:03Z].
- Splits (AN 2026-10-23T19:40Z): spread MIN 47% bets / 40% money, so money leans IND by 7 pts (under the 10-pt sharp flag). Total over 70%/68%: public over, no gap. ML MIN 92%/82%: a 10-pt gap, so ML money is relatively on IND, a mild **sharp flag on IND +218**. A Caesars sharp-action note lists "Colts-Vikings Under 43.5/42.5" [Source: X @PatrickE_Vegas 2026-10-22], which fits the total's downward move.
- Trend context: favorites of 6+ are 8-19-3 ATS in 2026 [Source: X @johnewing / Bet Labs 2026-10-21]. Rest advantage at home is 10-1 ATS (MIN qualifies) [Source: X @FATBOSSPICKS 2026-10-19]. These two trends cancel.

## Quantitative

- Power (packet, 2026-10-23): MIN SRS +8.8 (#1), net PPG +9.0, Pythag 0.779. IND SRS -4.7 (#25), net -3.3. The raw gap implies a double-digit line. I regress heavily: MIN has a 5-game sample, a +6 turnover margin (10 takes), a 3-0 record in one-score games and a 2025 DVOA of #18. IND's 2025 prior was DVOA #5. Market win totals (MIN 11.6, market rank 5 vs model rank 2) also discount MIN.
- FTN: IND defense DVOA +9.5%, pass D DVOA +15.0%, only 21.1% pressure. MIN offense DVOA -19.4% (FTN for MIN is stale_1wk, through W5). IND offense rush DVOA +5.8% is its one functional unit, and MIN run D is -26.7% DVOA.
- Secondary: IND→MIN "watch" (MIN S Jamal Adams IR; slot/underneath boosts favor Downs/Allen). MIN→IND "medium" (Gardner out: alpha/boundary boosts for Jefferson). Coach names in the coverage notes are ignored per gate rule 7.
- Simulator (`margin-simulator.mjs`, selftest all PASS; calib 2018-2025, sdMargin 12.77, sdTotal 13.13):

| Run | home line / total | margin_adj / total_adj | MIN cover | Under | MIN win (excl tie) |
|---|---|---|---|---|---|
| Baseline | -6.5 / 41.5 | 0 / 0 | 50.0% | 50.0% | 69.6% |
| Adjusted | -6.5 / 41.5 | +0.5 / -2.0 | 51.4% | 56.0% | 70.7% |
| Sensitivity | -6.5 / 41.5 | +1.0 / -2.0 | 52.7% | 56.0% | — |

Adjustment reasons. Margin +0.5: Jones vs the league's heaviest blitz, Gardner and Gould out, two IND LBs DNP Friday, and MIN rest. That is offset by low-total margin compression and MIN's weak offense. Total -2.0: MIN's scoring environment (34.6 avg), slow MIN pace, Flores vs a pressure-fragile QB, and a possible backup punter. That is offset partly by IND's bad defense and IND games averaging 51 points. 51.4% is below the -107 break-even (51.7%), so the side is a PASS. 56.0% under clears -109 (52.2%) by 3.8 pts, so tier B. The SuperContest line equals BKR, so the same run applies.

## Expert / podcast / article agreement

- **MIN side:** Josh Shepardson (Sharp, -6.5), Steve Makinen (VSiN, -6.5), PFT (30-17 MIN), BettingPros (-5.5, published 10/20, 1 pt worse now), Pat Fitzmaurice (-5.5 -108), Andrew Erickson (-5 -125). Both of those are stale by 1-1.5 pts. Jeremiah/Brooks and Krebs: MIN ML (straight-up).
- **IND side:** Dave Tuley (VSiN, best bet IND +6.5) and Steve Fezzik (IND +6.5, 2u). These are the two most market-oriented voices, and both take the dog at the current number.
- The Action Network / Brandon Anderson "MIN -2.5" pick is a **2nd-half** line (YouTube and AN text pipelines: ONE opinion). It isn't comparable to the full game. Its "post-London fatigue" premise couldn't be verified: IND's W6 was a home game vs TEN.
- **Under:** BettingPros u40 (at a better number than BKR's current), Fitzmaurice u41.5, Caesars sharp note. **Over:** no expert over found. PFT's 30-17 score implies 47, which is a score guess and not an over pick.

## Counter-case

- **Spread (lean MIN):** IND's run game (rush DVOA +5.8%, Taylor) can shorten the game. MIN's offense is #26 in EPA and has won by 6, 7 and 5 three times. Big favorites are 8-19-3 ATS, and the sharpest voices are on IND. MIN covering 6.5 needs the turnover script.
- **Under:** IND games average 51.3 combined points. IND's defense allows 26.3 PPG and lost its CB1. MIN, healthy off a bye with Jefferson/Hockenson/Addison, could post its GB-style 39. IND's -8 turnover margin creates short fields, and short fields create points. The total has already dropped a point.
- **ML:** MIN is 5-0 and the market still prices it at only ~70%. IND +218 has the ML-money flag, but my sim gives IND 29-30%, not enough at +218 (31.4% break-even).

## Ambiguity / missing data

- missing_inputs[] empty. Weather status says "venue verification required", but it's a fixed dome, so weather doesn't matter.
- MIN projected starters `needs_manual_depth_chart`. The availability feed showed Mason on IR and stale questionables; the official report supersedes it.
- Packet power ratings (SRS -4.66 / +8.84) differ from the dossier's (-2.81 / +8.29). I used the packet, which is newer.
- CoversJLo "look-ahead spot" thread truncated, so I couldn't evaluate it. No BetOnline board.
- MIN FTN is through W5 (bye), which doesn't matter for MIN since it didn't play W6.

## Pre-kickoff delta checklist

- Spread to **MIN -6** → upgrade to MIN tier C. Spread to **-7 / -7.5** → stays PASS (IND +7.5 becomes a C look).
- Total to **41** → still under (tier C). To **40.5 or lower** → PASS. Back to **42.5+** → under tier B+.
- Inactives 8:30 AM PT: Boettcher/Allen (IND LBs), Walley (CB), Sanchez (P). Two or more out → small MIN/under bump. Mason inactive → little effect (Jones handles volume).
- Any Jones benching/injury news, or an IND trade-deadline sell-off move involving Taylor (unlikely before Sunday): re-run.

## Gate notes

1. missing_inputs: none.
2. roster_vet PASS, age 0.0h (1 UNVERIFIED entry not tied to a pick here).
3. Kickoff not passed; forward picks issued.
4. Player teams/roles taken from packet/operator notes/official report. No memory-based roster claims.
5. QB facts settled (Jones, Murray). No dual-scenario QB swing.
6. Final Friday injury report pulled from vikings.com (2026-10-23) and listed above. The feed had Mason as IR, which the official report corrects to questionable.
7. Stale coach names in the coverage notes ignored. Brian Flores confirmed as MIN DC via PFT 2026-10-20.
