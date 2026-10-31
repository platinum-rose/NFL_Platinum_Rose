# 2026 W08 — LAC @ LAR — game synthesis, pass `sides`

As-of: Fri 2026-10-30 ~11:25 PM PT · Kickoff: Sun 11/1 1:05 PM PT (SoFi; inactives ~11:35 AM PT) · Packet built 2026-10-31T06:09:16Z (`scratch/w08-game-synthesis-queue-sides.json`) · roster_vet: PASS (roster 8.5 h old, 2 UNVERIFIED league-wide) · missing_inputs: none

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **LAC +6.5 -109** | C | LAR -5.5 | 1.0 pt | +6.5 at -112 or better; **+7 upgrades to B**; pass at +6 |
| TOTAL | **Under 45 -109** | C | 44.0 | 1.0 pt | 45 at -110; pass at 44.5; 45.5+ firms up |
| MONEYLINE / SU | **PASS** (LAC +232 ≈ fair; Rams SU) | PASS | LAR ~-205 / LAC +205 (≈67/33) | ~1.5% win prob | LAC ML only at +250 or better |
| SuperContest | **LAC +6.5** (contest line LAR -6.5): sim 52.7% cover, no juice → candidate **Y** | C | | | |
| Pool | SU **Rams**; confidence **7 of 16** (sim LAR win 67–71%) | | | | |

Card fit: `parlay_leg_ok` n for both picks (thin edges add vig, don't stack them); `standalone_preferred` n (the edge isn't big enough). Sources: BKR lines [data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt, Fri 6:52 PM PT; same numbers on the per-game board data/generated/props/bookmaker-live-2026-10-31-chargers-at-rams.json capturedAt 2026-10-31T01:51:58Z].

## Game script
The Rams should control it on early downs: LAR offense EPA/play +0.058 (#10), 2.19 pts/drive, RZ TD 69%. LAC runs the league's worst offense: EPA/play -0.202 (#32), 15.0 PPG, 1.25 pts/drive, 9.5% sack rate, 12 giveaways [team dossiers 2026-w08 LAC.md/LAR.md; FTN team context]. LAC's defense is real (EPA/play -0.047, #7), but it is missing elite S Derwin James. The likely flow is the Rams up 7–10 by halftime, then a slow second half with the Rams leaning on the run (ESPN/Barshop 10/28: "Rams leaning on the run game" with Davante Adams out after hamstring surgery). The question is whether LAC gets one late score to land inside the number. Herbert has 16 closes as a west-coast underdog; 13 were losses, and only one of those was by 10+ points (exactly 10) [an_primer, Abrams 10/30]. That fits a "lose by 3–6" range.

## QB / availability
- QBs: Herbert (LAC) and Stafford (LAR) start; no QB has a designation [qb_operator_notes; scratch/w08-qb-confirmations-1030.md, Fri 9:25 PM PT, which says it was web-checked by Claude, not Andy].
- LAC OUT: S Derwin James, DB Deane Leonard, G Kayode Awosika, WR Brenen Thompson. Questionable: CB Donte Jackson (hamstring, limited Thu) and CB Rodney Shelley. WR Ladd McConkey (concussion) is off the report and will play (Rotowire/Athletic 10/30). WR Tre' Harris has no designation [availability feed 10/30].
- LAR: C Coleman Shelton OUT. TE Colby Parkinson Q (ribs), WR Jordan Whittington Q (back), LS Joe Cardona doubtful. WR Davante Adams is out (surgery). DE Myles Garrett won't return in W8 (ESPN/Rotowire 10/28). DE Kobie Turner and DT Poona Ford are on IR (SI/MacMillan 10/27). The packet flags `defensive_front cluster_risk=true` for LAR.
- **CB Trent McDuffie conflict:** operator notes say OUT, but the availability feed (Caplan/SI 10/30) says Q (groin, "improving"). He was inactive W6–W7. *If McDuffie is out*, LAC's slot/underneath passing gets a small boost, which helps LAC +6.5 and slightly hurts the under. *If he plays*, nothing in the picks changes. My Friday web search turned up only a Monday SI report (Q) and no final Rams report, so the conflict is still open.
- Ignore "Aaron Donald UNKNOWN" in the LAR feed (known misclassification). The LAR dossier's venue line ("Melbourne Cricket Ground") is a schedule-file bug. Slate and BKR both put this game at 1:05 PM PT in LA.

## Market
- AN open (Sun 10/25 5:00 PM PT): LAR -7.5 / 45.5 / ML -372/+283. BKR now: LAR -6.5 -107 / 45 / ML -271/+232. **The spread moved 1 point toward LAC and through the 7.** The total dropped 0.5. AN's primer shows total_open 48 at another book, and Caesars reported sharp Over 43.5 on 10/29 (@PatrickE_Vegas, news_notes). The total has been bet both ways and is now centred at 44.5–45 (BetOnline 44.5 -115/-105 on 10/29; DK 44.5 on 10/27).
- Splits (AN, 7:06 PM PT): spread LAR 69% bets / 56% money → **LAC has 31% of bets but 44% of money, a 13-pt gap = sharp flag on LAC**. ML is 96/96 Rams (no signal). Total: Over 68% bets / 73% money (5-pt gap, no flag; public-over lean).
- BKR vs SuperContest: both at 6.5, so no gap.
- Kalshi/Polymarket are context only: LAC median 4.85 wins, LAR 10.05 [prediction_markets].

## Quantitative
- Power: LAR SRS -0.37 (#17), LAC -10.1 (#32). On SRS alone LAR is about -10, plus a near-zero home edge (shared stadium). Market-implied ranks are closer (LAC #29 / LAR #14). The power gap is the strongest argument against LAC, and it rests on 6 LAC games with 0-3 in one-score games and Pythag 1.36 expected wins [power_ratings].
- FTN: LAR rush D DVOA -20.7% and pass-rush pressure 30.0%. But the rush numbers were built with Garrett/Turner/Ford, who are now out. LAC pass protection: 38.9% pressure, 21 sacks. **The Rams' depleted front is the main matchup lever toward LAC staying close.**
- Secondary: LAR offense vs LAC is tier **high** (James out, severity 5.63), with boosts for TE middle, slot, and deep passes. LAC offense vs LAR is low [secondary_matchups; I ignored the coach names there per the rule].
- Simulator (`scripts/intel/margin-simulator.mjs`, selftest PASS, calibration 2018-2025):

| Run | home line / total | margin_adj / total_adj | LAC cover | LAR cover | Over | Under (excl push) | LAR win |
|---|---|---|---|---|---|---|---|
| Baseline | -6.5 / 45 | 0 / 0 | 50.0% | 50.0% | 50.0% | 50.0% | 70.6% |
| Adjusted (BKR = SC line) | -6.5 / 45 | **-1.0 / -1.0** | **52.7%** | 47.3% | 46.9% | **53.1%** | 68.3% |
| Sensitivity | -6 / 44.5 | -0.5 / -0.5 | 51.4% (excl push) | | 48.5% | 51.5% | |

Adjustment reasons. **margin -1.0:** (a) LAC off a bye vs a team on normal rest; rest-advantage teams are 22-8-1 ATS this season, and winless teams off a bye are 30-11 ATS [an_primer]; (b) the Rams have lost Garrett, Turner and Ford, the core of the pass rush they would use against LAC's #32 protection [news_notes; SI 10/27]; (c) 13-pt sharp money gap on LAC plus the move off 7.5; (d) 6+ point favorites are 8-21-3 ATS this year. Offsetting: a -10 power gap, and James is out. **total -1.0:** (a) McVay is 30-12 to the Under as a home favorite since 2020, missing the total by 5.0 PPG [an_primer]; (b) points-for/against blend gives LAR ~24.7 + LAC ~18.9 ≈ 43.6, and the BKR team totals add to 46 (26.5/19.5); (c) LAC's drives are slow (27.5 s/play) and the Rams run-heavy without Adams. Offsetting: Caesars sharp Over 43.5 and James out.

## Expert / podcast / article split
- **LAC +6.5:** Steve Makinen (VSiN best bet), Stuckey (Action Network YouTube; LAC ML parlay leg, bye/health), Sean Koerner (AN PRO, ATS confidence #13/26: projection +6.4 vs +6.5, so essentially no edge). AN Bet Labs systems: "winless teams on road wk5+" 64-40, "Business Trip off loss on road".
- **LAR -6.5:** Jason Radowitz (-6.5 -112), Iain MacMillan (SI, -6.5), BettingPros early bets (-6.5 -112), PFT (30-13 Rams). Steve Krebs: Rams ML -290 (tier 3). I dropped the BettingPros "Rams -5.5" because it comes from a Week 9 lookahead URL, and the Radowitz "Lions -3" row because it was tagged to LAC but is the wrong game.
- **Total:** Under from Steve Fezzik (Ross Tucker show, under parlay leg), Even Money (u45.5, u44.5 — priced at a better number than today's 45). Over from Caesars sharp action at 43.5. The parlay legs are not full-game best bets; I count them as soft.

## Counter-cases
- **LAC +6.5:** LAC hasn't covered all year (0-5-1) and has scored under 24 in every game. Its offense is historically bad, and McDaniel's role as play-caller is under review. James out opens the middle for Stafford. A two-score Rams lead, Stafford at 14-7 ATS as a favorite, and SRS all point to -10. A 7 or 10-point Rams win is very plausible.
- **Under 45:** LAC's defense is down two DBs. LAC gives the ball away 2+ times a game, which hands the Rams short fields. Sharps bet over at 43.5, and the Rams scored 34/35 in two of their last three wins. One defensive or return TD clears 45.
- **ML pass:** LAC +232 needs about a 30% win rate; the sim says about 32%. That gap is too small for a 0-6 team.

## Ambiguity / missing data
McDuffie status (OUT vs Q). No final Friday Rams report found online. The total opener differs by source (45.5 AN file vs 48 primer vs 43.5 Caesars). The dossier venue is wrong (Melbourne). LAC FTN tables are 1 week stale (through W6, but LAC was on bye). The LAR Q tags on the availability feed are unverified. qb_operator_notes is labelled "web-checked by Claude, not Andy-confirmed".

## Pre-kickoff delta checklist
1. LAC +7 appears at BKR → upgrade the spread to B. If the line drops to +6 or lower → pass the spread and keep LAC +6.5 as a SuperContest-only pick.
2. Total 45.5+ → under firms up. 44.5 or lower → pass.
3. Inactives at 11:35 AM PT: McDuffie active = no change. Donte Jackson inactive = LAC CB depth thins, so trim the under. Parkinson/Whittington out = slight Rams pass-volume downgrade, which helps the under.
4. Any LAC play-caller change or McConkey setback → re-evaluate the LAC side.
5. Sharp-split reversal (LAR money ≥ 70%) → drop the spread to PASS.

## Gate notes
- missing_inputs: none. roster_vet PASS (8.5 h).
- Kickoff hasn't passed; this is a forward pick.
- Availability feed issues: McDuffie Q vs operator OUT; "Aaron Donald UNKNOWN" is a misclassification; Byron Young, Landman and D. Johnson are UNKNOWN status.
- Dossier venue bug (LAR "Melbourne Cricket Ground") and LAC dossier availability marked "missing". The secondary-matchup coach names (Minter/Shula) were ignored per rule 7.
- Weather null: indoor (SoFi), not relevant.
- I did one Friday injury web search for each team; no final Rams report was found.
