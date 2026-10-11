# Week 5 single-game synthesis: LV@NE (opus)

Generated 2026-10-11 06:50Z (Sat 10-10 23:50 PT, device clock). HEAD fb2ad66. Kickoff 2026-10-11 17:00Z (Sun 10:00 PT), outdoor venue. Disposition **pass**, tier **skip**. Edge hypothesis: home margin 0.0, total +0.5.

Captures: BKR 2026-10-11T06:21:29Z (Sat 23:21 PT); BEO 2026-10-11T06:24:03Z (Sat 23:24 PT). Both books' recommendation windows end 2026-10-11T11:00Z (Sun 04:00 PT), six hours before kickoff, so these prices will be stale for recommendation well before the game unless re-captured. [Source: data/research-intel/game-packets/2026-w05/LV_at_NE.md, Market section, built 2026-10-11T06:35Z]

## Game script

The market sees a modest New England home win: BKR Patriots -3.5 (-108 both sides), total 45 (Over -114 / Under -102), moneyline NE -188 / LV +164, an implied score of NE 24.25, LV 20.75. [Source: packet, BKR market, 2026-10-11T06:21Z] Likeliest script: Raiders passing into a depleted Patriots corner room, against a turnover-prone New England offense. Neither run game is efficient.

## Away state: Las Vegas

Las Vegas is 3-1 (PF 115, PA 84, +31), with wins over MIA 27-13 (W1, home, +14), at LAC 26-14 (W2, +12) and at NO 35-27 (W3, +8), then a 27-30 home loss to KC in Week 4 (-3). [Source: packet, LV results table, 2026-10-11T06:35Z] Opponents are a combined 5-11; the only winning team faced (KC) beat them. They are 2-0 on the road and 1-1 in the division, sit second in the AFC West behind KC (4-0) and third in the packet's AFC order. Rest is 6.9 days, no bye used, bye in Week 13. Next up are BUF and LAR at home, then at NYJ. Four games is a small sample, not a rating.

## Home state: New England

New England is 2-2 (PF 65, PA 77, -12): lost at SEA 10-13 (-3), beat PIT 20-3 at home (+17), lost at JAX 6-35 (-29), and won at BUF 29-26 (+3). [Source: packet, NE results table, 2026-10-11T06:35Z] Opponents are a combined 11-5, a far harder slate, so the differentials overstate the gap. They are 1-0 at home, 1-0 in the division, second in the AFC East behind BUF (3-1). Rest is 7.0 days; bye in Week 11. Next come NYJ at home, then at CHI and at MIA. A loss drops them to 2-3 and two games behind LV.

## Matchup mechanics

Power ratings: LV SRS 6.19 (rank 6), NE SRS 2.40 (rank 11). The label check shows these equal the 2026 four-game point differential (`matches_2026` true for both), so they are 2026 four-game values with stale attribution wording, and they get no point adjustment on their own. Market prior is reversed: NE implied win total 10.35, LV 8.67. [Source: packet, Power ratings, 2026-10-11T06:35Z]

Raiders passing against the Patriots secondary is the central matchup. In the FTN team-offense passing-analytics table, LV has EPA/DB 0.161 and DVOA 29.6%; their pass-protection table shows a 3.2% SK% and clean-pocket EPA/DB__2 0.210. [Source: packet, FTN team-offense passing-analytics and pass-protection, LV] The ESPN injury report lists four NE corners Out: Christian Gonzalez, Carlton Davis III, Karon Prunty and Channing Canada, with Charles Woods (CB) and Craig Woodson (S) Questionable. [Source: ESPN injury report via packet, NE, 2026-10-11T06:35Z] The NE pass rush in the FTN team-defense pass-rush table is mild (PRESS% 27.0%, SK% 5.7%), so Kirk Cousins (ESPN-resolved starter) should have time. [Source: packet, Quarterbacks, ESPN depth 2026-10-11T06:35Z]

In the FTN team-offense efficiency table NE has DVOA -16.7% and TO 8; their passing-analytics INTW% is 6.5%. Under pressure their pass-protection EPA/DB is -0.433, against 0.268 on clean pockets (EPA/DB__2). [Source: packet, FTN team-offense, NE] LV's FTN team-defense pass-rush table shows PRESS% 39.5% and SK% 8.2%, so Maye (ESPN-resolved starter) will face pressure; NE's protection is uncertain with OT Morgan Moses Questionable. On the ground both teams are poor (FTN rushing-analytics: LV EPA/ATT -0.250, NE -0.146). Ashton Jeanty is Questionable for LV and Rhamondre Stevenson Questionable for NE (ESPN injury report). LV's C Trey Zuhn III is Out (ESPN injury report). Pace favors points slightly: LV runs 67.8 PLY/GM, NE 63.3 (FTN tempo).

ESPN roster IR/Out group entries (unconfirmed, not injury-report entries) include NE's Harold Landry III and Julian Hill and LV's Keyron Crawford; treated as unresolved. [Source: packet, ESPN roster IR/Out group, 2026-10-11T06:35:36Z] Secondary matchup context flags LV offense vs NE defense at severity 10.05, capped context only.

Weather is not a factor: 64.6F, 2% precipitation, wind 15.6 km/h gusting 24.1 at kickoff. [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, LV@NE forecast]

## Market comparison

BEO matches BKR at NE -3.5 (-113 / LV -107) and 45 (Over -114 / Under -106). [Source: packet, BEO, 2026-10-11T06:24Z] The line sits on 3.5, the hook past the key number: the simulator's side_push at a -3 line is 8.27%, which is the value LV +3.5 gets over +3. [Source: margin-simulator.mjs, home-line -3] No Action Network opener is in the packet; the splits capture (2026-10-09T19:41Z) had -3.5 and 45.5, with 77% of spread money on LV and 81% on the Over, context only. The SuperContest lists NE as a 3.5-point favorite.

## Thesis and counter-thesis

The tier-eligible evidence splits within one outlet: VSiN's Youmans has "Best Bet: Patriots -3.5" (rows[445]) while VSiN's Tuley has "Best Bet: Raiders +3.5" (rows[563]). By outlet that is one source disagreeing with itself. The only total row, VSiN Reynolds "Over 45" (rows[453]), is a single outlet. The existing quantitative pass projects NE by 0.85, about 2.7 points short of the line, but it is unbacktested and I do not copy it. The NE corner absences and the LV passing efficiency point to a small Over lean (+0.5), well short of a recommendation. Side edge 0.0: the corner losses help LV; NE's harder schedule and market prior offset them. Counter-thesis: LV's 39.5% pressure rate could turn NE's 6.5% team INTW% (FTN passing-analytics) into short fields and a lopsided game.

Hypothesis-conditional (not calibrated): cover 0.50/0.50 (push 0); Over 0.500 / Under 0.470 (push 0.030) vs zero-edge 0.4848/0.4848.

## Gaps

- VSiN side rows conflict (rows[445] vs rows[563]); Over row[453] single-source.
- Near-miss and corroboration-only rows: context only.
- Quant pass (NE +0.85) disagrees with NE -3.5.
- No Action Network opener in the packet.
- Questionable: Jeanty, Stevenson, Moses, Barmore, Dre'Mont Jones, Elliss, Woods, Woodson.
- ESPN roster IR/Out group (unconfirmed) on both teams is unresolved.
- Global: corroboration-only rows; SuperContest reversals in other games.
- Recommendation windows lapse at 11:00Z, before kickoff.

## Pre-kickoff delta checklist

- Official inactives and starters (Jeanty, Stevenson, Moses, NE CB/S group)
- Fresh BKR/BEO capture after 11:00Z; any move to NE -3 or -4, or a total of 44/46
- Weather recheck (wind)
- Game status
- Reprice VSiN source picks against the current number
