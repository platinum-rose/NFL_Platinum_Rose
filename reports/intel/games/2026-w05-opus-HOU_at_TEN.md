# HOU@TEN Week 5 synthesis (opus)

Written 2026-10-11 06:50Z (Sat 10-10 23:50 PT). Kickoff 17:00Z (10:00 PT). BKR captured 06:21Z (23:21 PT), BEO 06:24Z (23:24 PT). Both books' recommendation windows end 11:00Z (04:00 PT), before kickoff: these early-Sunday captures lapse first, and any later decision needs a fresh capture.

**Disposition: pass. Tier: skip. No side, no total lean. Edge 0.0 / 0.0.**

## Game script

Two 0-4 AFC South teams. The market prices Houston as a 7-point road favorite with a 37.5 total, implying roughly HOU 22.25, TEN 15.25 [Source: packet Market, BKR 7 / 37.5, 06:21Z]. The likely script is Houston throwing (FTN tendencies DPBK% 67.3%) against a slow Tennessee offense (FTN tempo PLY/GM 54.0, the lowest pace input in the quantitative pass, tempo_z -1.99) [Source: packet FTN tables, 2026-10-11 build]. Four games is a small sample for every number below.

## Away state: Houston

Results: L 31-36 BUF (3-1), L 6-20 CIN (2-2), L 17-19 at IND (2-2), L 30-34 DAL (2-3); opponents 9-8 combined. 0-3 home, 0-1 away, 0-1 division. Seven days' rest, bye still ahead in Week 8, next at JAX (3-1) [Source: packet Team state, 2026 results]. Three of four losses were by 5 or fewer points. That says they are closer than 0-4, but four games do not make a rating. A look-ahead to Jacksonville is context only.

## Home state: Tennessee

L 10-23 NYJ (1-3), L 20-24 PHI, L 7-12 at NYG (3-1), L 18-24 at BAL (3-1); opponents 9-7. Never above 20 points; 13.8 PPG. 0-2 home, 0-0 division, seven days' rest, bye Week 9, next at IND [Source: packet Team state]. The AFC South is JAX 3-1, IND 2-2, HOU and TEN 0-4. The loser goes 0-5 and is effectively out of the division race.

## Matchup mechanics

Power ratings: HOU SRS -6.688 (rank 27), TEN -10.882 (rank 31). Net PPG is -6.25 vs -7.0 [Source: packet Power ratings]. The label check shows matches_2026 true, so these are 2026 four-game values (the prior-season wording is stale), and they get no point adjustment.

Houston pass offense against Tennessee pass defense is the biggest gap. HOU passing-analytics shows EPA/DB 0.067, DVOA 25.8%, CPOE 7.9%. TEN defense passing-analytics allows EPA/DB 0.196, DVOA 35.8%, CBALL% 82.1% [Source: packet FTN passing-analytics]. Stroud's 2026 lines: 274, 353, 167, 347 yards, zero interceptions [Source: nflverse player_stats_weekly.csv, wk1-4].

The counterweight is protection. HOU pass-protection SK% is 7.0%, and EPA/DB under pressure is -0.857 against a clean-pocket EPA/DB__2 of 0.368 [Source: FTN pass-protection]. Right tackle Braden Smith is on IR. Ersery, Ingram and Fisher are all Questionable [Source: ESPN injury report, 06:35Z]. TEN's rush (pass-rush SK% 6.3%, PRESS% 22.8%) is modest, so a depleted line matters only if two or more starters sit.

Tennessee's offense runs into Houston's best unit. HOU defense rush-analytics allows EPA/ATT -0.110, DVOA -23.6%, and its pass rush posts SK% 8.8%, PRESS% 25.6% [Source: FTN HOU defense]. Cam Ward's aDOT is 6.5 (passing-analytics), so the passing game is short. TEN is missing S Amani Hooker (Out) and CB Joshua Williams (IR); WR Carnell Tate (Questionable) is their target leader with 6, 5, 9 and 12 targets [Source: ESPN injury report; nflverse wk1-4]. HOU has S M.J. Stewart and DT Kayden McDonald Questionable and WR Tank Dell on IR. The availability digest lists Stewart as out, but I use the injury report. The ESPN roster IR/Out groups (HOU 13 names, TEN 8) are unconfirmed and not treated as Out. Secondary context (capped) leans HOU offense, 5.85 vs 2.55 severity.

QBs: C.J. Stroud and Cam Ward are the resolved starters from ESPN depth plus injury report; no ambiguity flag [Source: packet Quarterbacks, 06:35Z].

Weather: Nashville is outdoor. 66F, 4% precipitation, wind 13.5 km/h with gusts 24.8 km/h; no material flag [Source: Open-Meteo, 2026-10-10T17:56Z]. No neutral-site signal appears in the source quotes.

## Market comparison

BKR: HOU -7 -104 / TEN +7 -112, total 37.5 (O -110 / U -106), ML -340/+286. BEO: -7 -110 both sides, total 38, ML -375/+299. The books agree on the side and differ by 0.5 on the total. Action Network on 10-09 showed TEN +7.5 / 38 with 70% of tickets and 66% of money on HOU, and 77% of tickets on the Over [Source: Action Network splits, 2026-10-09T19:41Z]. That is context only; no opener is in the packet. SuperContest uses HOU -7.5 (its labels are reversed; I used the favorite field).

Seven is the key number. At BKR +7 the simulator's side_push is 0.0555, so 7 is worth about 5.6% pushes to whoever holds it.

## Thesis and counter-thesis

The only tier-eligible source is VSiN's Tuley, "Titans +7.5" (rows[565]). Steve Makinen's near-miss (rows[511]), also VSiN and therefore not a second outlet, says the same. Both are at +7.5, which crosses 7 against today's +7, so that is a different bet and cannot support a tier here. Every other row is corroboration-only: Action Network, Even Money and podcasts on TEN +7.5/+6.5, and Action Network, Sharp or Square and BettingPros on HOU -7/-6.5 [Source: w05-expert-verified.json rows[44],[101],[134],[151],[203]]. Sources disagree, and I keep the disagreement rather than averaging it. The unbacktested quantitative pass has the home margin at -5.06 vs the market's -7 (TEN cover 55.3%). I record that, but it moves nothing here.

My hypothesis: 0.0 points on the margin, 0.0 on the total. Simulator at BKR 7 / 37.5 gives home cover 0.4722, away cover 0.4722, side push 0.0555, Over/Under 0.50/0.50, total push 0. That equals the zero-edge baseline (50/50 excluding pushes). It is conditional, not calibrated.

Counter-thesis: Houston's pass offense against Tennessee's leaky pass defense is a real mismatch. If the line holds, Houston's three close losses suggest a better team than the record. The case for Tennessee is a Houston line missing several starters on a 37.5 total, where 7 points is a lot. Neither side gets past noise against a 12.77-point residual SD.

## Gaps

- Captures early-Sunday; windows lapse 04:00 PT, before kickoff.
- One tier-eligible outlet, at +7.5 (different bet).
- Quant pass disagrees with the market (-5.06 vs -7); unbacktested.
- No Action Network opener.
- Collins has no Weeks 2-3 rows; reason unknown.
- Global: 432 corroboration-only rows; SuperContest reversals for 5 other games; BKR/BEO conflicts on MIN@NO and CLE@NYJ only.

## Pre-kickoff delta checklist

- [ ] Official inactives: HOU OL (Ersery, Ingram, Fisher), Stewart, McDonald; TEN Tate, Martin-Robinson
- [ ] Fresh BKR/BEO capture; flag +7.5 or -6.5
- [ ] Weather recheck (wind, rain)
- [ ] Game status unchanged (home venue, 17:00Z kickoff)
- [ ] Reprice VSiN +7.5 against the live number
