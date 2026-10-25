# PIT @ NO (Stade de France, Paris), Week 7 synthesis, pass `props`
As-of: Sat 2026-10-24 ~2:55 PM PT · Kickoff: Sun 10/25 6:30 AM PT (13:30Z, 14:30 CET local) · Inactives ~5:00 AM PT · Packet built 2026-10-24T21:33:58Z · roster_vet PASS (13.3h)
Boards: BKR `bookmaker-live-2026-10-24-steelers-at-saints.json` (capturedAt 20:25:11Z / 1:25 PM PT) · BEO `betonline-live-2026-10-24-steelers-at-saints.json` (21:15:13Z / 2:15 PM PT) · DKP reference only (10/23 19:10Z)

## Recommendation box
| # | Player / market | Line | Price | Book | capturedAt | Basis | Tier | Leg OK | card_slot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Aaron Rodgers completions O | 21.5 | -125 | BEO | 21:15Z | 5/6 L6 (24,23,19,22,22,33); short aDOT in wind | **B** | Y | 7a / BEO 2-leg (with #2) |
| 1a | same, BKR alt O | 20.5 | -209 | BKR | 20:25Z | BKR SGP version, **flag < -200** | B | Y | 7a BKR SGP |
| 2 | Rodgers passing TD O | 1.5 | +100 (BKR -119; alt -113) | BEO | 21:15Z | 2+ TD in 4/6; NO allowed 10 pass TD; PIT 1 rush TD all year | **B** | Y | 7a / BEO 2-leg / single |
| 3 | Pat Freiermuth anytime TD | — | +218 | BKR | 20:25Z | 4 TD, scored in 3/6; DKP ref +257 | **B** | Y | 7e ATD |
| 4 | Tyler Shough anytime TD | — | +376 | BKR | 20:25Z | rush TD W2, W6; QB-run fit vs man/blitz; DKP ref +426 | C | Y | 7e ATD / single |
| 5 | Germie Bernard receptions O | 4.5 | -150 (BKR alt -157) | BEO | 21:15Z | 6/9, 11/12 since WR room thinned | C | Y | 7d hybrid |
| 6 | Jaylen Warren longest rush O | 14.5 | -130 | BEO | 21:15Z | NO run D 45.9% success allowed; AN pick O13.5 | C | Y | 7d / BEO leg |
| 7 | Shough interceptions O | 0.5 | -145 | BEO | 21:15Z | INT in 3/6; trailing into 55 km/h gusts | C | N (BEO only) | single |
| 8 | Longest FG of game U | 49.5 | -110 | BEO | 21:15Z | crosswind gusts 53–57 km/h all game | C | N | single |

**ATD (7e) candidates:** Freiermuth +218 (lead), Shough +376, Darnell Washington +254, Olave +179. Avoid Warren -145.
**First TD (8a):** Freiermuth +845 (primary), Juwan Johnson +1030, Shough +1221 (longshot). All BKR, 20:25Z.
**2+ TD (8b):** Freiermuth +1124 is the only number worth a slip. Metcalf +826 is short for 1 TD in 6 games. Warren +330 is a no.
**BKR SGP shape (same game):** Rodgers O20.5 cmp (-209) + Rodgers O1.5 TD (-113) + Freiermuth ATD (+218). These are positively correlated. **BEO multi-game:** max 2 legs from this game, so use #1 + #2, or #2 + #6.
Heavy legs: only 1a is shorter than -200.

## Game script
This follows the sides pass, which is my own game's report: PIT by ~3.8, fair total 43, a PIT ball-control grind, Under 44.5 C [Source: reports/intel/games/2026-w07-game-PIT_at_NO-sides.md]. A fresh Open-Meteo pull on Sat shows **25–28 km/h sustained and gusts of 53–57 km/h from the west** from 14:00 to 18:00 CET, with 0% rain. That matches the packet capture, so the wind flag holds (open-air stadium, per qb_operator_notes). Expect short passing: Rodgers' aDOT is 7.6, and W6 had zero 20+ completions. PIT should run Warren into a NO defense with 45.9% rush success allowed and a stuff rate of 18.2% [FTN 10/20]. NO trails and leans on Olave and Shough's legs. Red-zone scoring for PIT goes through the air: 12 pass TD against **1** team rushing TD in 6 games [FTN team-offense/overview]. That makes the TEs and Rodgers TDs the priority, not the RB ATD.

## Availability (final Friday + Sat check)
- **PIT:** CB Echols OUT; WR Skowronek OUT; **RB Rico Dowdle Q** (knee, limited Fri) [Rotowire/Caplan via packet; thefantasyfootballers]; S DeShon Elliott Q (the team page also lists IR/DTR, so it is unresolved). Roman Wilson and Pittman Jr. are on IR, which leaves Metcalf, Bernard and MVS as the WRs. Watt has no designation.
- **NO:** G Ruiz Q, DL Shepherd Q. Kamara (back, LP) has **no designation**. QB Shough is full.
- BKR has **pulled** the Warren and Dowdle rush/carry markets and the Darnell Washington rec/yds markets (NA). I read the Warren/Dowdle pulls as Dowdle uncertainty. Washington has no injury tag I can find, so verify him at inactives before using his ATD.
- **If Dowdle is out:** Warren gets 18+ touches. Upgrade #6 to B and consider BEO Warren carries O14.5 -115. **If Dowdle is in:** keep #6 at C, and avoid Warren yardage (W6: 14-50 with Dowdle 7-40).

## Market notes
- Game lines: BKR PIT -3 -108 / 44.5 (o-106/u-110) / ML -160/+139. BEO PIT -3 -110 / 44.5. The AN open was PIT -2 / 44.5, and the total has not moved despite the wind.
- BEO team TDs: PIT O2.5 -130, NO U2.5 -175. Total TD O4.5 -145. Total FG O3.5 -120 / U3.5 -110. Books expect PIT through the air and a quiet NO.
- Rodgers O1.5 TD is the clearest book gap: BEO +100 vs BKR -119/-113.
- There are no tackles + assists markets on either executable board, so Andy's best season category is unavailable. Watch for Payton Wilson (11 tkl W6) and Pete Werner (11 tkl W6) if they post Sunday.

## Quantitative basis (nflverse weekly 2026 W1–W6; FTN through W6)
- Rodgers: completions 24/23/19/22/22/33; att 40/39/34/40/31/49; pass TD 1/0/3/3/3/2; 40+ completions in 3/6.
- Metcalf rec 4/4/3/5/3/11 (5+ in only 2/6) → **PASS O4.5 -130** despite a 23.7% target share.
- Bernard rec 4/1/2/6/11. The jump came after Wilson went out.
- Freiermuth TD in W1, W4, W5 (x2). Washington TD in W4 and W6.
- Shough: TD 3/1/4/1/0/3, INT 2/0/1/0/2/0, rush TD W2 and W6.
- Olave rec 10/8/9/8/4/4, yds 182/86/107/116/46/43. He is trending down, NO is the expected loser (Andy's receptions rule), and the wind is a factor → PASS O5.5 -148 / O65.5 -196.
- Simulator self-test passed. I re-ran the sides adjustment only for script context. Props have no calibrated joint model, so no model probabilities are given.

## Expert / article map
- **For:** Action Network has Warren longest rush O13.5 ("16+ in 5 of 6"; BEO's 14.5 is a half point worse). Steve Krebs (BettingPros) has Rodgers 28+ attempts at -542 as an anchor. That matches the volume thesis, but the price is beyond the barrier.
- **Against:** Sal Bets has Warren U69.5 rush yds (Dowdle splits carries). That fits my avoid on Warren yardage, and it argues against #6.
- YouTube: Matt Moore's Taysom Hill ATD +4000 is a joke pick, not a signal. Hill is not on the BKR board.

## Counter-cases
- **#1/#2 Rodgers:** a PIT lead plus the wind could drop him to ~30 attempts (W5: 22/31 but 3 TD). The TD-over and completions legs then split.
- **#3 Freiermuth:** Washington and Bernard soak up the red-zone looks. W6 he had 2-11.
- **#4 Shough:** a PIT front with a 7.0% sack rate caps his scrambles, and he had 0–1 carries in 3/6 games.
- **#5 Bernard:** this is a 2-game role sample, and MVS could absorb snaps.
- **#6 Warren:** Dowdle active leaves Warren at ~12 carries.
- **#7 Shough INT:** he was clean in W6, and PIT averages only 1 INT per game.
- **#8 FG U:** a tailwind half could set up a 50+ try, and grading when no FG is made depends on BEO rules.

## Ambiguity / missing data
- Dowdle status and Washington's NA markets are unresolved until inactives.
- The BKR board carries unfamiliar names (Tonyan, Homer, B. Johnson, Welch, Nowakowski, Heidenreich). None are used.
- No T+A markets. Prices are from Sat captures (BKR 1:25 PM, BEO 2:15 PM PT).

## Pre-kickoff delta checklist
1. 5:00 AM PT inactives: Dowdle OUT → #6 to B. Washington OUT → Freiermuth ATD/FTD to primary B+. Elliott OUT → small boost to Olave/NO pass (still PASS on receptions).
2. Wind at 6 AM PT: gusts under 30 km/h → drop #8 and the wind half of #7. Gusts 55+ → keep everything.
3. Rodgers O1.5 TD: pass if BEO moves to -125 or worse and BKR to -135 or worse.
4. Bernard: PASS if MVS is reported as a starter.
5. Shough INT: BEO only, since BKR SGPs refuse INT legs.

## Gate notes
- roster_vet PASS (13.3h; 9 UNVERIFIED). Not re-run.
- missing_inputs empty. Kickoff not passed.
- Friday designations came from the sides-pass team-site fetch plus a Sat Dowdle web check (no Saturday change).
- The secondary_matchups coverage notes carry stale coach names (Dennis Allen; Tomlin/Austin). Ignored. Dossiers list PIT HC McCarthy and NO HC Moore.
