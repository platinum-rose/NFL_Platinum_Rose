# PIT @ NO (Stade de France, Paris) — Week 7 synthesis, pass `sides`
As-of: Fri 2026-10-23 ~6:30 PM PT · Kickoff: Sun 10/25 6:30 AM PT (13:30Z) · Inactives ~5:00 AM PT Sun · Packet built 2026-10-24T01:26:41Z · roster_vet PASS (age 0.0h; 1 INFO, 1 UNVERIFIED)
Supersedes the earlier pilot output for this game.

## Recommendation box
- **SPREAD:** PASS (lean PIT -3 -108 BKR) | tier PASS | fair PIT -3.5 (mean -3.8) | edge +0.5 pt vs -3 | model PIT cover 51.4% excl push vs 51.9% break-even at -108 → becomes PIT C at -2.5 (any price to -115) ; becomes NO C at +3.5 -110 or better
- **TOTAL:** UNDER 44.5 -110 (BKR) | tier C | fair 43.0 | edge 1.5 pts | model under 54.5% | playable to 44 -110 / 43.5 -105; pass at 43
- **MONEYLINE / SU:** PASS | PIT -161 implies 61.7% (no-vig ~60%) vs model 62.6% excl tie; NO +140 needs 41.7% vs model 37.4% | SU winner **PIT**
- **SuperContest (PIT -3.5):** **NO +3.5** | tier C | model NO 52.4% at the contest line (no juice) | candidate = yes, as a fill, not a lead pick
- **Pool:** SU PIT · confidence **8 of 16** (62–63% win; mid-board)

## Game script
A neutral-site game: no real home field, both teams flew in, and the Saints arrived Monday 10/20 [Source: news_notes PFT 2026-10-20T16:34Z]. Pittsburgh is the better team. EPA/play defense ranks #6 for PIT and #28 for NO, while the offenses are similar (#24 PIT, #20 NO) [Source: team-dossiers/2026-w07 PIT.md, NO.md, nflverse through W6]. PIT runs a pass-heavy offense (DPBK 67%, neutral pass rate 0.661) through a thin WR room: Pittman Jr. and Roman Wilson are on IR, Skowronek is Out, and MVS was re-signed [Source: news_notes ESPN 2026-10-20T22:22Z; neworleanssaints.com Friday report]. The forecast calls for 26 km/h sustained wind gusting to 54 km/h (~16/33 mph, westerly) in an open-air stadium [Source: packet.weather; qb_operator_notes]. That wind taxes Rodgers' short-to-intermediate game less than deep shots and kicks, but it lowers the ceiling for both offenses. Expect a lot of PIT ball control against a NO defense that is 45.9% rush success allowed and a FTN rush-D DVOA of +10.8%. NO's scoring (25.3 PPG) rests on an 84% RZ TD rate and turnover-fed short fields, which is hard to repeat. Most likely shape: a 20–17 / 23–20 Steelers grind.

## QB / availability (final Friday designations, web-verified)
[Source: neworleanssaints.com "Injury Report … Week 7 Friday", fetched 2026-10-24 UTC; packet.availability ESPN API]
- **PIT:** CB Brandin Echols OUT (hamstring); WR Ben Skowronek OUT (calf); RB Rico Dowdle Q (knee, limited); S DeShon Elliott Q (knee, full; the page also lists him IR/DTR, which is unresolved). Watt, Ramsey, Highsmith and Heyward carry no designation. PIT did not practice Friday, so their report is an estimate.
- **NO:** G Cesar Ruiz Q (knee, LP); DL Nathan Shepherd Q (illness, DNP). Kamara (back, LP) has no designation. QB Tyler Shough (left hand) is full with no designation. Rookie WR Jordyn Tyson stays IR. Elliss, Jennings and McKinstry are cleared.
- QBs: Aaron Rodgers (PIT) and Tyler Shough (NO), both confirmed by packet `projected_starters` and the dossiers.
- **If Dowdle is out:** Jaylen Warren carries the load. Effect on the side is negligible. **If Ruiz is out:** NO interior protection weakens against a PIT front with a 7.0% sack rate, which modestly helps PIT and the under. **If Elliott is out:** a 3rd PIT DB is gone alongside Echols, and the secondary feed already flags PIT as a "high" vulnerability (6.19). That is the main NO-side risk.

## Market
- **AN open (Sun 10/18 5 PM PT):** PIT -2 / 44.5 / ML PIT -135 [Source: packet.market.an_opener].
- **BKR paste (Fri ~11:40 PT):** PIT -3 -115, o/u 44.5 -106/-110, ML -173/+150 [Source: bookmaker-gamelines-2026-10-23-week7.raw.txt].
- **BKR board (newest, 2026-10-23T20:10:43Z / 1:10 PM PT):** **PIT -3 -108 / NO +3 -108; o44.5 -106 / u44.5 -110; ML PIT -161 / NO +140** [Source: bookmaker-live-2026-10-23-steelers-at-saints.json]. All pricing above uses these numbers.
- Movement: PIT moved a full point (-2 → -3) early in the week, then the juice came back toward NO intraday Friday (-115 → -108; ML -173 → -161). The total has not moved off 44.5 despite the wind.
- SuperContest line PIT -3.5 [Source: data/supercontest/week-07-lines.json, 2026-10-22T15:03Z]. That is a 0.5-pt gap to BKR, and the contest hook sits on the right side of 3 for NO.
- **Splits (AN, 2026-10-23T19:40Z):** spread NO 55% bets / 56% money, no flag. Total over 44% / 48%, no flag. **ML: NO 20% bets / 34% money, a 14-pt gap and a sharp-money flag on the NO moneyline**, consistent with the intraday ML drift.
- DK Predictions (reference only, 19:10Z): NO +3.5 54%, Under 45.5 53%, PIT win 63%.

## Quantitative
- Power ratings: SRS PIT +2.8 (#10) vs NO -3.2 (#23), a 6.0 neutral gap. Net PPG +1.5 vs -4.3. Market-implied win totals 9.57 vs 7.33 [Source: packet.power_ratings]. The SRS gap overstates PIT: its one-score record is 3-1 and its Pythag delta is +0.76 (lucky). The win-total gap maps to about -3.5 neutral.
- FTN (through W6): NO D DVOA +16.3% (pass +20.9%), PIT D DVOA -8.3%. PIT pass protection allows 7.3% sacks. NO blitzes 33% and pressures at 22.3% [Source: FTN context via dossiers, generated 2026-10-20T15:14Z].
- Secondary matchups: PIT pass O vs NO = medium (2.7), with DK Metcalf as the alpha boundary target. NO pass O vs PIT = **high (6.19)**, with Chris Olave as the alpha [Source: packet.secondary_matchups]. The stale coach and player names in the coverage note are ignored.
- **Adjustments:** margin_adj **-0.5** (home-positive, so PIT +0.5 vs market). The reasons: PIT defense quality, NO RZ-TD regression, and NO defense 28th in EPA, partly offset by PIT's OT game last week, its depleted WRs and the sharp ML money on NO. total_adj **-1.5**: 16/33-mph wind in an open stadium, both offenses bottom-12 in EPA/play, and NO's 84% RZ TD rate regressing.

| Run | Line / total | adj (m / t) | Home (NO) cover | Away (PIT) cover | Push | Over / Under | NO win |
|---|---|---|---|---|---|---|---|
| Baseline | NO +3 / 44.5 | 0 / 0 | 45.9% | 45.9% | 8.3% | 50.0 / 50.0 | 39.9% |
| Adjusted (BKR) | NO +3 / 44.5 | -0.5 / -1.5 | 44.6% | 47.2% (51.4% excl push) | 8.3% | 45.5 / **54.5** | 38.6% |
| SuperContest | NO +3.5 / 44.5 | +0.9 / -1.5 | **52.4%** | 47.6% | 0 | 45.5 / 54.5 | 38.2% |

The contest run restates the same view (PIT by about 3.8, the adjusted mean) against the contest line. The simulator re-centres -3.5 to a mean of -4.7, so the view is +0.9 home-positive there.

## Expert / podcast / article map (all verified as W7 PIT@NO)
- **PIT side:** Action Network (PIT -3; "international favorites ≤3 cover 76% ATS"); Brandon Anderson, YouTube (PIT -3; rushing DVOA vs the league-worst run D). He is an Action Network voice, so treat it as possibly the same opinion as AN, with no consensus boost. BettingPros and ESPN had PIT -2.5 from 10/19, which was priced before the move and is 0.5 pt worse now. PFT SU PIT 23-20, which would be a push at -3 and an NO cover at +3.5.
- **NO side:** Dave Tuley, VSiN (Best Bet NO +3.5); Emerson Lotzia (NO +3.5, early-travel spot vs PIT's OT game); Simon Hunter (NO +3.5, international-favorite regression); Ross Tucker (NO +3.5, 1u). Every NO voice needs **+3.5**, which BKR does not offer (+3 -108).
- Read: experts lean PIT at ≤-3 and NO at +3.5. The number decides the side, not the teams. That supports PASS at BKR -3 and NO in the contest.
- Totals: no expert total picks. PFT's 23-20 implies 43.

## Counter-cases
- **Spread lean PIT:** NO's offense has been efficient by success rate (41.3%) and 3rd-down conversion (42.5%). PIT allows a 16.9% explosive pass rate and is without Echols and possibly Elliott. The OT game plus the Paris trip is a real fatigue spot. The sharp ML money is on NO.
- **Under 44.5:** NO's defense is bad enough (EPA/DB +0.092) that PIT could score 27 or more. Both teams have hit 30+ (PIT 34 vs IND; NO 30, 34). Wind can create turnovers and short fields that inflate scoring. The forecast could soften by Sunday morning.
- **NO +3.5 (SuperContest):** the PIT defense (#6 EPA, 7% sacks vs a NO OL possibly missing Ruiz) could produce a two-score win. Rodgers' 49 attempts last week show PIT can win through volume.

## Ambiguity / missing data
- `missing_inputs[]` is empty. No BetOnline board was captured (prop_boards.betonline null), so there is no second executable price.
- DeShon Elliott is listed as both Q and IR/DTR on the same team page. ESPN feed and secondary feed disagree as well.
- The PIT Friday report is an estimate (no practice).
- The wind forecast is a single Open-Meteo capture (2026-10-23T19:26Z) with no game-time hourly confirmation.
- The "international favorites ≤3 cover 76%" trend is unaudited and is not used in the thesis.

## Pre-kickoff delta checklist
1. BKR moves to PIT -2.5 → PIT -2.5 becomes tier C (up to -115). BKR moves to NO +3.5 -110 or better → NO +3.5 becomes tier C at BKR.
2. Sunday morning wind update: if sustained wind is under ~15 km/h and gusts are under ~30 km/h, drop the under to PASS. If gusts are 55+ km/h, keep the under to 43.5.
3. Total moves to 43 or lower → under becomes PASS.
4. Inactives (~5:00 AM PT): Elliott out → nudge toward NO (contest pick strengthens). Ruiz out → small PIT/under nudge. Dowdle out → no change.
5. NO ML: if it drifts to +130 or shorter on the sharp flag, that confirms money on NO. The spread lean stays PASS.

## Gate notes
- Roster gate: PASS (0.0h). Not re-run, per instructions.
- missing_inputs: none. BetOnline board absent, so BKR is the only executable book.
- Kickoff not passed; forward picks issued.
- The Friday designations were missing from the packet feed (it showed Echols Q and Elliott IR). Resolved with the web fetch of the official team-site Friday report.
- The secondary_matchups coverage note carries stale coach and personnel names (Dennis Allen, Lattimore, Mathieu). Ignored, per rule 7.
- The paste file mtime (18:44Z) does not match its header (~11:40 PT). The newer board capture (20:10Z) was used.
