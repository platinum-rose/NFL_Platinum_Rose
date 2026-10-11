# Week 5 synthesis (opus): DET@ARI

Written Sat 10-10 23:50 PT (06:50Z, device clock). Kickoff Sun 10-11 13:25 PT (20:25Z). BKR captured 23:21 PT Sat (06:21:29Z); BEO 23:24 PT Sat (06:24:03Z). These early-Sunday (UTC) captures' recommendation windows end 05:21 PT (BKR) and 05:24 PT (BEO), about eight hours before kickoff; any price here lapses and must be recaptured. [Source: packet DET_at_ARI.md, Market windows, 2026-10-11T06:35Z]

**Disposition: pass, tier skip. No side, no total lean. Edge 0.0 / 0.0.**

## Game script

The market expects a Detroit-won shootout: implied DET 30.0, ARI 24.5. The FTN tables fit that shape, so I find no edge. [Source: packet DET_at_ARI.md, market-implied score, 2026-10-11T06:21Z]

## Away state: Detroit (2-2)

Detroit beat NO 31-30 (+1), lost at BUF 31-41 (-10), beat NYJ 31-24 (+7), lost at CAR 26-32 (-6): 2-0 at home, 0-2 away, 0-0 in the division, 29.8 points scored and 31.8 allowed per game against opponents with a combined 7-9 record. Rest is 6.8 days. Week 6 is Detroit's bye, followed by GB and MIN at home. Detroit is third in the NFC North, behind MIN (4-0) and CHI (3-1), and is outside the provisional NFC top eight. A loss leaves it two games behind MIN entering the bye. [Source: packet DET_at_ARI.md, Team state + standings, 2026-10-11T06:35Z]

## Home state: Arizona (1-3)

Arizona won at LAC 26-14 (+12), then lost to SEA 7-31 (-24), at SF 30-36 (-6) and at NYG 24-36 (-12). It is 0-1 at home and 0-2 in the division, last in the NFC West behind 4-0 SF. Opponents: combined 10-6. Rest is 7.1 days, with no bye until week 14 and LAR, DEN and DAL next. Four games is a small sample for both teams. [Source: packet DET_at_ARI.md, Team state, 2026-10-11T06:35Z]

## Matchup mechanics

**Detroit's pass offense against Arizona's pass defense is the central mismatch.** Arizona's pass defense allows EPA/DB 0.311, DVOA 49.2% and EXP% 20.3%. Its run defense is much better: EPA/ATT -0.230, DVOA -19.1%. That points Detroit toward early-down dropbacks. Detroit's tendencies table shows DPBK% 65.2% (share of plays that are dropbacks), and its passing-analytics table shows EPA/DB 0.242 with zero turnovers. [Source: packet FTN team-defense passing/rush-analytics ARI; team-offense DET, 2026-10-11T06:35Z]

**Protection decides how much of that edge Detroit can use.** In Detroit's pass-protection table, clean-pocket EPA/DB__2 is 0.407 (SUCC%__2 57.7%) and pressured EPA/DB is -0.242. Arizona's pass rush generates PRESS% 25.0% and SK% 6.5%. Detroit's interior line is thinner: C Cade Mays is on IR and G Ben Bartch is Out on the ESPN injury report. [Source: packet FTN pass-protection DET, pass-rush ARI; ESPN injury report, 2026-10-11T06:35Z]

**Arizona's offense is the weaker unit.** It posts EPA/PLY -0.039, YD/PLY 4.6 and EXP% 3.8%. Its pass-protection table shows pressured EPA/DB -0.561 against Detroit's PRESS% 32.1% and 15 sacks (SK% 7.8%). Arizona is also without OT Paris Johnson Jr. and G Isaiah Adams (both IR) and WR Marvin Harrison Jr. (Out), all per the ESPN injury report. **Detroit's secondary has the larger absences:** S Brian Branch and CB Rock Ya-Sin are Out and S Thomas Harper is on IR. Kerby Joseph and Avonte Maddox appear only in ESPN's roster IR/Out group, which is unconfirmed. Detroit's pass defense already allows EPA/DB 0.267, so Brissett's short game (aDOT 6.2) has room against it. The secondary-matchup severity score, which is capped context, is 12 for ARI offense against DET defense and 5.85 the other way. [Source: packet FTN tables; ESPN injury report and roster IR/Out group, 2026-10-11T06:35Z]

**Quarterbacks and pace.** Resolved starters (ESPN depth chart, no ambiguity): Jared Goff and Jacoby Brissett. Pace is similar: 66.8 vs 65.8 plays per game. The power ratings are 2026 four-game values (matches_2026 true): SRS DET -3.252 vs ARI -6.928, net PPG -2.0 vs -7.5. They are not adjusted on their own. [Source: packet Quarterbacks, Power ratings, 2026-10-11T06:35Z]

**Venue.** State Farm Stadium has a retractable roof, and its status is unconfirmed. The Open-Meteo file has no DET@ARI outdoor entry, so no weather is applied. [Source: 2026-10-10-week5-weather-openmeteo.json, outdoor_games, 2026-10-10T17:56Z]

## Market comparison

| Book | Captured | Spread | Total | ML |
|---|---|---|---|---|
| BKR | 06:21Z | DET -5.5 -110 / ARI +5.5 -106 | 54.5 o-107 u-109 | -254 / +218 |
| BEO | 06:24Z | DET -5.5 -110 / ARI +5.5 -110 | 54.5 -110 | -250 / +207 |

- Books agree; no Action Network opener in packet. Its splits (captured 10-09 19:41Z) show the spread at 54% tickets / 56% money on DET, the over at 56/58, and the moneyline at 92/97 on DET. These are context only.
- The SuperContest line is DET -5.5, using its favorite field because its labels are reversed.
- 5.5 is not a key number. The simulator's side_push is 0.0555 at 7 and 0.0827 at 3, so a move to 7 would matter more than the half-point. [Source: margin-simulator.mjs side_push, 2026-10-11T06:50Z]

## Thesis and counter-thesis

**No tier-eligible row exists for this game.** All 36 are corroboration-only, and they split. On ARI, Even Money +4.5 (rows[168]), BettingPros +5.5 (rows[188]) and Sharp or Square +6 (rows[184]) take Arizona, and Action Network (rows[35]) and Jeremiah/Brooks (rows[55]) take the ARI moneyline. On DET, The Favorites -4.5 (rows[121]), BettingPros -4.5 (rows[175]), Sharp or Square -5.5 (rows[138]) and PFT on the DET moneyline (rows[542]) take Detroit. BettingPros and Sharp or Square appear on both sides. The 4.5 quotes are a point off and are downgraded. The over at 52 (rows[187]) is downgraded.

The provisional quant pass projects home margin -3.43 and a total of 56.3, against the market's -5.5 and 54.5. That leans ARI and over, but it is unbacktested. The FTN mechanics point both ways: Detroit's pass offense against Arizona's pass defense favors Detroit, and Detroit's depleted secondary against Arizona's short game favors Arizona. **I hold the edge at 0.0.**

**Strongest counter-thesis.** Arizona's 10-6 opponent slate, two banged-up secondaries in a projected 54.5-point game, and a backdoor-friendly number together could justify ARI +5.5. Its evidence is corroboration-grade only.

## Gaps

- No tier-eligible rows; 36 corroboration-only.
- Action Network opener missing.
- Roof status unknown.
- Roster IR/Out group unresolved for both teams.
- Questionable: Walter Nolen III, Karson Sharar, Tyleik Williams.
- Quant pass disagrees with market (-3.43 vs -5.5).
- Global: 432 corroboration-only and 11 near-miss rows slate-wide; SuperContest reversals on 6 games; BKR/BEO conflicts on MIN@NO and CLE@NYJ (not this game).

## Pre-kickoff delta checklist

- Official inactives (Branch, Ya-Sin, Nolen, Williams, roster-group players).
- Fresh BKR/BEO capture after the 05:21 PT lapse; flag any move to 6.5/7 or 4.5.
- Roof status and weather recheck.
- Game status.
- Reprice source picks against the new number.
