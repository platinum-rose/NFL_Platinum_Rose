# PHI @ WAS — Week 8 game synthesis, pass `sides`

As-of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:24Z) · Kickoff: Sun 11/1 5:20 PM PT (SNF, outdoors, Northwest Stadium) · Inactives ~3:50 PM PT Sun · Packet built 2026-10-31T06:09Z · roster_vet: PASS (roster age 8.5h, 2 UNVERIFIED league-wide)

## Recommendation box

- **SPREAD: PASS (lean PHI +6 @ BKR -113)** | PASS | fair WAS -5.0 | edge 1.0 pt on PHI | playable to PHI +6 -110 or any +6.5 (tier C); pass at +6 -113 or worse and at +5.5. The sim gives PHI +6 a 52.8% cover chance (pushes excluded) against 53.05% breakeven at -113, so the price takes the edge.
- **TOTAL: OVER 40.5 @ BKR -106** | C | fair 42.0 | edge +1.5 | playable to 41 (-110); pass at 41.5.
- **MONEYLINE/SU: PHI ML +216 @ BKR (small)** | C | fair WAS -195 / PHI +195 (PHI 33.9% excl. tie) | edge ~2.3 pp vs 31.6% breakeven | playable to PHI +205; pass below +200. **Straight-up winner: WAS** (sim 66%). WAS ML -251 is a pass (implied 71.5% vs 66%).
- **SuperContest (WAS -5.5):** lean PHI +5.5 (51.4% sim), **not a candidate**: 0.5-pt edge.
- **Pool:** BUK BUK SU = **WAS**; confidence **6 / 16** (backup-QB dog with sharp ML money against it, so keep it low).
- Card fit: Over is `parlay_leg_ok` = y (independent of the side). WAS ML as the SNF moneyline cap: likely SU side, but a negative-value leg at -251; better capped with the Over. Nothing here is `standalone_preferred`.

## Game script

Washington comes off its bye with 13 days of rest. Philadelphia plays on a short week after Monday's 38-21 home loss to Dallas [Source: news_notes, ESPN 2026-10-27]. Tanner McKee starts for PHI (Hurts on IR) without WRs DeVonta Smith or Dontayvion Wicks, so rookie Makai Lemon is the top WR for the second straight week [Source: qb_operator_notes; news_notes Rotowire 2026-10-30 22:33Z]. Saquon Barkley has no designation after limited work Friday [Source: news_notes ESPN 2026-10-30 20:24Z]. Expect PHI to lean on Barkley against a thin WAS interior: Kinlaw OUT, Payne Q/likely out, Newton Q. Washington's offense with Daniels should move the ball against a PHI defense ranked #27 in EPA. Both defenses are bottom-eight by EPA (PHI def 0.086, WAS def 0.080 [Source: team dossiers 2026-w08, nflverse through W7]). The likely game is WAS by about a field goal to a touchdown, at a pace that scores more than 40.

## QB / availability

- PHI: Hurts IR, **McKee starts** (W7: 23/35, 211 yds, 1 TD, 1 INT). Smith, Wicks, LB Jihaad Campbell, Britain Covey and CB Jonathan Jones are OUT; CB Jakorian Bennett is Q. Safeties Andre' Sam and Tucker Large are on IR [Source: qb_operator_notes; secondary_matchups].
- WAS: **Jayden Daniels has no designation** (elbow; full practice all week). Terry McLaurin is on IR and DT Javon Kinlaw is OUT. TE John Bates, WR Treylon Burks, DT Jer'Zhan Newton and DT Daron Payne are Q [Source: qb_operator_notes].
- **Payne conflict:** operator notes and commanders.com list him Q. ESPN reported Fri 00:01Z a "significant foot injury in practice Friday that likely will land him on IR", and the availability feed shows OUT. Treat him as **likely out**, which supports the Over and PHI's run game a little.
- If Barkley is a surprise inactive, PHI's offense loses its only proven playmaker. Drop the Over to PASS and the PHI ML to PASS. If Daniels is somehow limited, the side flips toward PHI.

## Market

- AN open (Sun 10/25 5:00 PM PT): WAS -3.5 (-114), total 41, ML WAS -190 / PHI +160. BKR now (Fri 6:52 PM PT; prop-board file rows match, capturedAt 2026-10-31T01:52Z): **WAS -6 -103 / PHI +6 -113, o/u 40.5 (-106/-110), ML -251/+216**. That is a **2.5-pt move toward WAS**, past 4 and 5 but short of 7. The total is down 0.5.
- The AN primer header lists `total_open` 46.5 against the 41.0 in the openers file; see Ambiguity.
- BKR -6 vs SuperContest -5.5: the contest gives WAS backers half a point.
- Splits (AN, 7:06 PM PT): spread WAS 53% bets / 61% money (8-pt gap, below the sharp flag). **ML: WAS 83% bets but only 33% money, so 67% of ML money is on PHI against 17% of bets. That 50-pt gap is a sharp/large-ticket flag on the PHI ML.** Total: Over 83% bets / 88% money, yet the number ticked *down*, a mild reverse move against the Over.
- Other flags: Caesars reported sharp action on **Commanders -5.5** (@PatrickE_Vegas, 10/29). BetMGM shows 72% of money on WAS -6 (@johnewing, 10/30).

## Quantitative

| Signal | PHI | WAS |
|---|---|---|
| SRS / model rank | -7.39 / #28 | -7.66 / #27 |
| Off EPA/play | -0.107 (#30) | -0.007 (#16) |
| Def EPA/play allowed | 0.086 (#27) | 0.080 (#25) |
| PPG for/against | 18.1 / 25.0 | 22.0 / 28.7 |
| TO margin | -3 | +6 |
| Avg game total (season) | 43.1 | 50.7 |

[Source: power_ratings; team dossiers 2026-w08 (game logs, nflverse through W7)]

- Power ratings call this a pick'em on a neutral field, about WAS -1.5 to -2 with home field. Both SRS figures are skewed: PHI's includes 5 Hurts starts, and WAS played about 2 games without Daniels (FTN shows Daniels GP 4). EPA/play favors WAS by about 0.1 per play net, worth roughly 3-4 pts after regression. Add rest and the WR depletion and I land at **WAS -5**.
- FTN PHI pass protection: 6.8% sack rate and 35% pressure. WAS's pass rush is already thinned by the DT injuries.
- Secondary matchups: PHI's coverage has medium vulnerability with slot, seam and TE-middle boosts for WAS (Diggs opportunity 4.8). WAS's coverage has low vulnerability vs PHI. Coach names in that file are ignored per gate rule 7.
- Prediction markets give context only: PHI median 6 wins, WAS 6.5.

Simulator (`margin-simulator.mjs`, calibration 2018-2025, selftest PASS):

| Run | home line / total | adj (margin, total) | PHI cover* | Over | WAS win (excl tie) |
|---|---|---|---|---|---|
| BKR baseline | -6 / 40.5 | 0, 0 | 50.0% (push 2.5%) | 50.0% | 68.5% |
| BKR adjusted | -6 / 40.5 | -1.0, +1.5 | **52.8%** | **54.5%** | 66.1% |
| SC baseline | -5.5 / 40.5 | 0, 0 | 50.0% | 50.0% | 67.4% |
| SC adjusted | -5.5 / 40.5 | -0.5, +1.5 | 51.4% | 54.5% | 66.2% |

*PHI cover excludes pushes.

**Adjustments.** Margin -1.0, within the soft cap:
- (a) Koerner's projection is PHI +4.3 vs +5.5, an independent model that sits 1.2-1.7 below market [Source: youtube_picks_approved, Koerner AN PRO 10/28].
- (b) Market overshoot. The line moved 2.5 pts after one blowout loss into a slate where 6+ pt favorites are 8-21-3 ATS and division dogs 23-10 ATS [Source: an_primer SLATE trend, 2026-10-30].
- Netted against: the WAS rest edge (rest-advantage favorites 15-3-1 ATS) and sharp action on WAS -5.5 at Caesars.

Total +1.5:
- (a) The season game-total averages (43.1 / 50.7) both clear 40.5.
- (b) Both defenses are bottom-8 by EPA, and WAS is missing 2-3 interior DL.
- (c) Coach trends in this matchup: Quinn is 8-1 to the Over vs the NFC East; Sirianni is 7-1 to the Over vs WAS [Source: an_primer, Abrams 2026-10-30].
- Netted against: PHI's depleted WR room under McKee, and the total slipping against 88% Over money.

## Experts / podcasts / articles (this matchup, Week 8 only)

- **PHI side:** Brandon Anderson (AN, +6; same pick on his show and in the expert pull, counted as one opinion), Steve Makinen (VSiN, +6), Dave Tuley (VSiN, +6), Sean Koerner (PHI +5.5, ATS confidence #2 of 26), Even Money (+4.5; stale line). On the PHI ML: Scott Bogman (BettingPros, +228). Chris Welsh's +228 ML was **conditional on DeVonta Smith playing**; Smith is OUT, so it is dropped. Bet Labs systems on PHI: Great Condition Div Road Dogs (388-297-20), Business Trip Off Loss on Road, Fade Big Line Moves. WAS is 2-9 ATS vs backup QBs over five seasons.
- **WAS side:** Doug Kezirian (AN, -5.5; two AN videos, counted as one opinion), Andrew Erickson (BettingPros, -5.5), BettingPros staff (-3.5; priced at the old line, so the edge is gone at -6), PFT (WAS 24-21; margin 3, total 45, which also supports the Over). Supporting trends: Sirianni is 2-6 SU/ATS with a backup QB and 3-8 ATS as a 3+ dog, and PHI is 0-7 2H ATS and 1-9 ATS in its last 10 vs the NFC. Bet Labs: Team off Bye vs Same Div (ML).
- **Dropped:** all Week 7 DAL@PHI pieces in pick_signals and article_notes (prior week).
- **Takeaway:** experts lean PHI ATS, but the original bettors' leads were at +6 or worse for the price. Repriced to -113, the edge is thin.

## Counter-cases

- **PHI +6 (lean):** WAS has 13 days of rest against a team on a short week, and rest-advantage favorites are 15-3-1 ATS. PHI's 2H collapse (0-7 2H ATS) and an offense ranked #30 by EPA without its top two WRs can produce a 10+ point loss. Sharp action came in on WAS -5.5.
- **Over 40.5:** PHI averages 18 ppg and has had team totals of 14 and 17 recently. The book's PHI team total is 16.5. Teams in their game after facing Dallas are 17-5 to the 1H Under. Money is 88% on the Over and the line still fell.
- **PHI ML:** PHI is 1-10 SU when Sirianni's team closes as more than a 3-pt dog. A McKee-led team winning outright needs turnovers, and PHI is -3 in turnover margin.

## Ambiguity / missing data

- `missing_inputs` is empty.
- AN primer `total_open` 46.5 vs openers file 41.0. The 46.5 is likely a pre-Hurts or look-ahead number. I used 41.0 as the "AN open".
- Daron Payne: Q (operator notes, team site) vs likely IR (ESPN).
- PFT reported the NFL flexed referee Alex Moore's crew out of prime time, yet the AN primer still lists Moore. The crew is unconfirmed.
- WAS FTN data is stale by one week (through W6, bye). The availability feed has known misclassification bugs.

## Pre-kickoff delta checklist

1. Inactives (~3:50 PM PT Sun): if Barkley is out, pass the Over and the PHI ML. If Payne or Newton are active, trim the Over.
2. If the spread reaches +6.5, upgrade PHI to C. If it drops to +5.5 or the price is -115 or worse, stay PASS.
3. Over is playable to 41; pass at 41.5 or higher.
4. PHI ML: pass below +200. If it reaches +230 or better, keep C and consider a small stake.
5. A Daniels downgrade (none expected) flips the side.

## Gate notes

- roster_vet PASS (8.5h old).
- No missing inputs.
- Kickoff has not passed.
- QB facts come from qb_operator_notes (Andy-confirmed).
- Ran one web search for final injury reports. The commanders.com report page (no Friday designations rendered) has a "Daron Payne questionable" headline. A Bleeding Green Nation "final injury report" result turned out to be a prior-season Week 16 article and was discarded.
- Ignored coach names in secondary_matchups (gate rule 7).
- BKR prop-board game_lines rows (capturedAt 2026-10-31T01:52Z) match the paste, so no newer number was available.
