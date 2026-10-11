# PHI@JAX Week 5 synthesis (opus)

Written Sat 10-10 22:40 PT (2026-10-11T05:40:55Z), head 7ebef66. BKR captured Sat 18:15 PT (01:15Z), window ends Sun 00:15 PT; BEO captured Sat 20:15 PT (03:15Z), window ends 00:30 PT. Both captures are under 6 hours old and neither window has lapsed. Kickoff Sun 06:30 PT. **Disposition: pass. Tier: skip.**

## Game script and venue

The roof table calls this an outdoor Jacksonville home game, but it cannot detect neutral sites. Source quotes place it in London ("Eagles +7.5 vs Jaguars (London)") [Source: w05-expert-verified.json#rows[447]], and the weather capture is sampled at Wembley coordinates (51.55, -0.27): 58F, 0% precipitation, wind 10.4 km/h, gusts 22.7 km/h [Source: weather-openmeteo.json, PHI@JAX, 2026-10-10T17:56Z]. No weather adjustment. Jacksonville is the designated home team, but the usual home-field value should be read as reduced. The market script is JAX 24.75, PHI 17.25 [Source: packet, BKR -7.5/42].

## Away state: Philadelphia 2-2

PHI beat WAS 24-22 and TEN 24-20 (combined 1-7 opponents), then lost 7-27 at CHI (3-1) and 20-24 to LAR (2-2). Point differential -18; opponents 6-10 combined; 1-1 away, 1-0 division [Source: packet team state, 2026-10-11T04:23Z]. Rest 6.9 days, bye in Week 10. PHI is second in the NFC East behind NYG (3-1) and outside the NFC top eight. Next come CAR and DAL at home, then WAS away; no look-ahead fact applies.

The availability list matters most here. Out: Saquon Barkley (36 carries), DeVonta Smith (27 targets, team high), Hollywood Brown, C Drew Kendall, S Marcus Epps; Tank Bigsby is on IR (28 carries); Jonathan Greenard is Questionable [Source: ESPN injury report, 2026-10-11T04:21Z]. Barkley and Bigsby took 64 of the 79 carries by those three backs, with Will Shipley the third [Source: player_stats_weekly.csv, weeks 1-4]. Jalen Hurts is the resolved starter.

## Home state: Jacksonville 3-1

JAX beat CLE 34-10, lost 13-20 at DEN, beat NE 35-6 and won 22-17 at CIN. Point differential +51 against 9-7 combined opponents; 2-0 home, 0-0 division. Rest 6.9 days, bye in Week 7. JAX leads the AFC South by a game over IND and is AFC No. 2 behind KC. Next is HOU at home, then the bye; no letdown fact applies. Absences: S Eric Murray Doubtful, S Caleb Ransaw on IR; the digest also lists DE B.J. Green II and CB Christian Braswell on IR [Source: availability digest]. Trevor Lawrence is the resolved starter. Four games is a small sample for both teams.

## Matchup mechanics

Power ratings: SRS JAX +14.7 (1st), PHI -6.3 (26th). `matches_2026` is true, so these are four-game 2026 values; no adjustment on them alone. A 21-point SRS gap against a 7.5 line is the market regressing heavily, which is appropriate.

JAX's offense (FTN team-offense efficiency DVOA 21.1%, EPA/PLY 0.173; passing DVOA 47.2%) faces a PHI defense with pass DVOA 12.1% and only 4 sacks (pass-rush SK% 2.6%) [Source: FTN team tables]. Lawrence (104 attempts, 8 TD, 2 INT) should have a clean pocket. PHI's offense is already weak (DVOA -9.2%, SUCC% 37.0%, rushing DVOA -14.6%) and gives up sacks (SK% 8.7%, pressure 37.7%). It now faces a JAX defense at DVOA -19.2%, rush DVOA -32.5%, 6 takeaways and an interceptable-throw rate (INTW%) of 7.2%. Without its top two backs and its center, PHI probably has to pass more into that defense. The counterweight: JAX pass defense allows a 16.8% explosive rate and 71.0% OPEN%, and PHI's remaining receivers, Dontayvion Wicks (197 yards) and Darius Cooper (3 TD), can produce chunk plays. Pace is slow on both sides (PLY/GM 57.5 and 56.5; SEC/PLY 28.6 and 31.1), which argues against a high total. Secondary-matchup severity (6.45 PHI offense, 4.5 JAX offense) is capped context.

## Market

BKR: JAX -7.5 -113 / PHI +7.5 -103, total 42 (o-102/u-114), ML -350/+293. BEO: JAX -7.5 -115 / +7.5 -105, total 41.5, ML -375/+299. The books do not conflict. Juice on JAX hints at -8 pressure. Simulator exact-margin odds: 3 points 12.8%, 7 points 8.1%; 7 sits half a point inside. The packet has no Action Network opener. Corroboration-only early-line rows quoted JAX -4.5 [rows[198], rows[204], rows[318]], which points to a roughly 3-point move through 7, consistent with PHI's injuries being priced in. Action Network splits (2026-10-09T19:41Z, context only): JAX 60% of tickets and 57% of money; Under 60% and 63%. The SuperContest lists JAX as a 7.5-point favorite.

## Evidence quality

The only tier-eligible outlet is VSiN, with three writers on PHI: Youmans +7.5 [rows[447]], Cohen +8 and ML +320 [rows[516], rows[517]], and Tuley "+7.5 or better" [rows[559]]. They count as one source. Cohen's +8 is 0.5 off and needs no downgrade. Corroboration-only JAX rows include Jeremiah & Brooks ML [rows[85]], Pro Football Talk ML [rows[532]] and BettingPros -7 [rows[139]]. A -7 quote is on the other side of a key number and counts as a different bet.

## Thesis and counter-thesis

Edge hypothesis: +0.5 home margin and -0.5 total against BKR. The PHI availability cluster and the FTN efficiency gaps lean JAX and toward lower PHI scoring, but the move from -4.5 has absorbed most of that. Baseline: 50.0/50.0 side (push 0), 48.5/48.5 total (push 3.0%). Conditional on the hypothesis: JAX cover 51.4%, PHI 48.6%; Over 47.0%, Under 50.0%, push 3.0%. These are conditional, not calibrated edges. Both sit well inside noise (residual SD 12.77), so the answer is a pass.

The counter-thesis has three parts. A London neutral site removes JAX's home edge, so 7.5 may overstate the gap. All three VSiN writers back PHI. JAX's explosive-pass allowance gives a depleted PHI offense a backdoor route.

## Gaps

- Neutral site not detectable by the roof table; London comes from the VSiN quote and the Wembley weather coordinates.
- Quant pass has JAX by 9.07 and a 42.98 total, against the market's 7.5 and 42; noted, not copied.
- No AN opener; the move is inferred from corroboration-only -4.5 quotes.
- BKR prop capture 2026-10-10T22:25Z is over 6 hours old, so no props.
- Greenard Questionable, Murray Doubtful. Dallas Goedert has no week 3-4 stats and no injury entry.
- Projected starters lack second-source reconciliation; the power-rating attribution wording is stale.
- Global: 432 corroboration-only rows, 11 near-miss rows, 6 SuperContest label reversals and BKR/BEO conflicts on other games, and all BKR windows expire within 120 min.

## Pre-kickoff delta checklist

- Official inactives (Greenard, Murray, Goedert, PHI offensive line) and starters
- Fresh BKR/BEO capture; recheck 7/7.5/8
- Wembley weather recheck; game status
- Reprice VSiN picks against the current number
