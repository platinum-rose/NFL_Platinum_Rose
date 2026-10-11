# Week 5 single-game synthesis: BAL@ATL (opus)

Generated 2026-10-11T06:50Z (Sat 10-10 23:50 PT) at HEAD fb2ad66. Kickoff 2026-10-12T00:20Z (Sun 10-11 17:20 PT). Disposition **price moved**, tier **research_only**, no side, no total lean, edge 0.0 / 0.0.

## Timing and staleness

Both captures are from late Saturday PT (early Sunday UTC): BKR 2026-10-11T06:21:29Z (Sat 23:21 PT), BEO 2026-10-11T06:24:03Z (Sat 23:24 PT) [Source: packet Market, captured_at, 2026-10-11T06:21Z/06:24Z]. Packet windows end 12:21Z/12:24Z (Sun 05:21/05:24 PT), about twelve hours before kickoff; after that these prices are `stale_for_recommendation`. Nothing below is a live price.

## Game script

The market expects a modest Atlanta win: BKR has Falcons -3 (-117) / Ravens +3 (+102), total 43.5 (O -103 / U -113), moneyline ATL -160 / BAL +139, an implied score of ATL 23.25, BAL 20.25 [Source: packet Market, BKR, 2026-10-11T06:21Z]. Likeliest script: Atlanta leans on its run game while a backup-led Baltimore offense works behind a patched interior line; Atlanta turnovers are the main upset path.

## Away state: Baltimore

Baltimore is 3-1 (PF 116, PA 96, +20), 2-0 away and 1-1 at home, with no division games yet. Results in order: won 41-23 at IND (+18), lost 17-24 to NO (-7), won 34-31 at DAL (+3), beat TEN 24-18 (+6). Opponents are a combined 5-12; four games against weak competition is a small sample [Source: packet Team state BAL, results table, 2026-10-11T06:35Z]. Rest 7.3 days, bye ahead (week 13), next at CLE, CIN, at BUF. They lead the AFC North over 3-1 Cleveland (next opponent) on differential only; fifth in the packet's AFC order.

The quarterback change dominates. Lamar Jackson is Out on the ESPN injury report and Tyler Huntley is the operator-confirmed starter (stated, not verified) [Source: packet Quarterbacks, RESOLVED STARTER, 2026-10-11T06:35Z]. Huntley's only 2026 action: 8 of 9 for 63 yards in week 4 [Source: player_stats_weekly.csv, BAL weeks 1-4, season 2026]. Center Cam Jurgens and edge Trey Hendrickson are also Out, and Marlon Humphrey and Zay Flowers are Questionable on the ESPN injury report. The ESPN roster IR/Out group (unconfirmed) also lists centers Ethan Pocic and Danny Pinter (unresolved; if true, snap-exchange risk rises).

## Home state: Atlanta

Atlanta is 2-2 (PF 96, PA 92, +4), 0-1 at home, 2-1 away, 1-1 in the NFC South. Results: lost 13-20 at PIT, lost 3-34 to CAR, won 35-14 at GB, won 45-24 at NO; opponents are a combined 7-9 [Source: packet Team state ATL, results table, 2026-10-11T06:35Z]. The split matters: Cooper Rush and Jack Strand took the snaps in the two losses, and Michael Penix Jr. started both wins (18/25, 256 yards; 15/20, 223 yards) [Source: player_stats_weekly.csv, ATL QB rows weeks 1-4]. Atlanta has 6.0 days of rest, a bye in week 11, and two more home games next (CHI, SF). A win keeps pace with division leader Carolina (2-2). Za'Darius Smith is Out; Jake Matthews, Divine Deablo and Samson Ebukam are Questionable on the ESPN injury report. A.J. Terrell Jr., Da'Shawn Hand and Anterio Thompson appear only in the ESPN roster IR/Out group (unconfirmed).

## Matchup mechanics

Baltimore runs 48.5% of the time (FTN team-offense tendencies, RUSH%), and Atlanta's run defense is its strength: FTN team-defense rush-analytics EPA/ATT -0.291, SUCC% 30.4% and DVOA -28.2%, against Baltimore's offensive rushing-analytics EPA/ATT -0.031 [Source: packet FTN team-level tables, 2026-10-11T06:35Z]. Baltimore's passing-analytics EPA/DB 0.349 is Jackson's offense and does not transfer to Huntley. Under pressure, their pass-protection EPA/DB falls to -0.237 against 0.583 from a clean pocket (EPA/DB__2). Atlanta's pass-rush PRESS% is 34.4%.

On the other side, Atlanta runs 59.2% of the time with rushing-analytics EPA/ATT 0.122, against a middling Baltimore run defense (EPA/ATT -0.027). Atlanta's weakness is ball security: 7 turnovers at a 3.07% rate (team-offense efficiency TO%) and pass-protection EPA/DB -0.723 under pressure. Both play slowly (tempo PLY/GM 59.8 and 57.0). Power ratings match the 2026 four-game point differential (matches_2026 true): BAL net +5.0 per game, ATL +1.0, SRS -0.709 against 0.381. A small, schedule-driven gap; no adjustment. Secondary severity is even (4.05/4.35). Weather: retractable roof, status unconfirmed; no Open-Meteo outdoor entry, so no weather input.

## Market comparison

BEO deals ATL -3.5 (+100) / BAL +3.5 (-120), total 43.5 (O -115 / U -105), moneyline -170 / +149. A half-point gap, not a conflict. The Action Network opener is null in the packet. Action Network splits (captured 10-09 19:41Z, at -3.5) showed 53% of spread tickets but only 41% of money on BAL, and 72% of tickets on the Over at 44; context only. The SuperContest lists ATL -3.5 as a separate contest reference. At BKR -3, the zero-edge simulator gives a side_push of 8.27% at the key number 3.

## Thesis and counter-thesis

The only tier-eligible rows all come from one outlet, VSiN: three back Ravens +3.5 (rows 448, 451, 568) and one reads "Falcons +3 (-118)" (row 525), which disagrees with the others and does not fit Atlanta being favored. One outlet supports at most tier 2-, and moving from +3.5 to the BKR +3 crosses the key number 3, so that is a different bet. All other rows are corroboration_only and split. My evidence points two ways: Atlanta's run defense, the Jurgens absence and Huntley at quarterback favor the Falcons, while Atlanta's turnovers and its two backup-quarterback losses mean its 2-2 record understates the Penix version. Jackson was ruled out Friday, before these captures, so the market has absorbed the biggest input. I keep the edge at 0.0. Counter-thesis: Huntley's Ravens are worse than a three-point road underdog, making Atlanta -3 the value and the VSiN calls stale.

## Gaps

- BKR BAL +3 vs BEO +3.5 (0.5, no conflict); source +3.5 not at BKR.
- Windows end Sun 05:21/05:24 PT; recapture needed.
- Single tier-eligible outlet (VSiN); row 525 contradicts 448/451/568.
- Quant pass home margin +2.43 vs market 3; not copied.
- Action Network opener null.
- Roof unconfirmed; no weather entry.
- ESPN roster IR/Out group unconfirmed (Pocic, Pinter, Terrell, Hand).
- Global: 432 corroboration-only rows, SuperContest reversals elsewhere, BKR/BEO conflicts on MIN@NO, CLE@NYJ.

## Pre-kickoff delta checklist

- [ ] Official inactives and starters: Huntley at QB, the BAL center (Jurgens/Pocic/Pinter), Flowers, Humphrey, Matthews, Deablo, Ebukam.
- [ ] Fresh BKR/BEO capture (the windows lapse Sun 05:21 PT).
- [ ] Roof status at Mercedes-Benz Stadium.
- [ ] Game status: confirm it is still at 17:20 PT.
- [ ] Reprice the VSiN +3.5 rows against the live number; if it is +3.5 again, re-check the tier.
