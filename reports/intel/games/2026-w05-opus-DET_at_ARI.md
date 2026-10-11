# DET@ARI Week 5 synthesis (opus)

Generated 2026-10-11T05:34:47Z (Sat 2026-10-10 22:34 PDT). Head 7ebef66. Kickoff Sun 13:25 PT. BKR captured 18:15 PT Sat (window ends 00:15 PT); BEO captured 20:15 PT Sat (window ends 02:15 PT). Both fresh.

## Game script

The market reads Detroit 30.0, Arizona 24.5 [Source: data/research-intel/game-packets/2026-w05/DET_at_ARI.md, market-implied score, 2026-10-11T04:23Z]. The likeliest script is Detroit moving the ball through the air against a soft Arizona coverage unit, while Arizona's short passing game, now without Marvin Harrison Jr., tries to keep pace against a Detroit secondary missing three defensive backs. Both forces lift the total and cancel on the margin, so I stay on the market.

## Detroit (away)

Detroit is 2-2 with every game decided by 10 or fewer: W 31-30 vs NO (+1), L 31-41 at BUF (-10), W 31-24 vs NYJ (+7), L 26-32 at CAR (-6) [Source: data/research-intel/game-packets/2026-w05/DET_at_ARI.md, DET results, 2026-10-11T04:23Z]. Opponents are a combined 7-9. Detroit is 2-0 at home, 0-2 away, 0-0 in the division, scoring 29.8 and allowing 31.8 per game. Rest is 6.8 days; the Week 6 bye comes next, then GB and MIN at home (context only). Detroit sits third in the NFC North, two games behind 4-0 Minnesota, and this is a conference game that feeds NFC tiebreaks. Four games is a small sample.

## Arizona (home)

Arizona is 1-3: W 26-14 at LAC (+12; LAC is 0-4), L 7-31 vs SEA (-24), L 30-36 at SF (-6), L 24-36 at NYG (-12) [Source: data/research-intel/game-packets/2026-w05/DET_at_ARI.md, ARI results, 2026-10-11T04:23Z]. Opponents are 10-6. Arizona is 0-1 at home, 0-2 in the division, last in the NFC West three games behind 4-0 San Francisco, on 7.1 days of rest with its bye not until Week 14; next are at LAR and DEN at home. The only win came against a winless team, and the SEA blowout drives most of the -30 differential.

## Matchup mechanics

Detroit's offense posts EPA/PLY 0.137 with zero turnovers, and its passing game EPA/DB 0.242 and DVOA 35.6% [Source: packet FTN, team-offense efficiency, passing-analytics, 2026-10-11T04:23Z]. Arizona's defense is the mirror image: pass DVOA 49.2%, EPA/DB 0.311, EXP% 20.3%, but rush DVOA -19.1% and EPA/ATT -0.230 [Source: packet FTN, team-defense passing/rush-analytics, 2026-10-11T04:23Z]. That steers Detroit toward Jared Goff (412 yards on 52 attempts in Week 4 [Source: data/vault-seed/nflverse/player_stats_weekly.csv, Goff passing, 2026 wk1-4]) rather than Jahmyr Gibbs into Arizona's best unit. The risk to that script is Detroit's interior line: C Cade Mays is on IR and G Ben Bartch is Out [Source: packet ESPN injury report, availability, 2026-10-11T04:21Z], and Detroit's EPA/DB drops to -0.242 under pressure versus 0.407 clean [Source: packet FTN, team-offense pass-protection, 2026-10-11T04:23Z]. Arizona's rush is modest (PRESS% 25.0%, SK% 6.5%) and DT Walter Nolen III is questionable.

Arizona's offense is a short-area unit: EPA/PLY -0.039, YD/PLY 4.6, EXP% 3.9%, aDOT 6.2, three-and-out 25.6% [Source: packet FTN, ARI team-offense, 2026-10-11T04:23Z]. Jacoby Brissett is the ESPN-resolved starter, but Harrison is Out and LT Paris Johnson Jr. and G Isaiah Adams are on IR [Source: packet ESPN injury report, availability, 2026-10-11T04:21Z]. Detroit's rush is the best unit on the field (PRESS% 32.1%, SK% 7.8%, 15 sacks), and Arizona's EPA/DB under pressure is -0.561 [Source: packet FTN, pass-rush, pass-protection, 2026-10-11T04:23Z]. Against that, Detroit's coverage is weak (pass DVOA 23.9%, EPA/DB 0.267) and is now without S Brian Branch, CB Rock Ya-Sin (Out) and S Thomas Harper (IR), with DT Tyleik Williams questionable. Trey McBride (10-13 targets each week) and Michael Wilson (17 and 13 targets in Weeks 3-4) are the beneficiaries [Source: data/vault-seed/nflverse/player_stats_weekly.csv, targets, 2026 wk1-4]. The manual secondary-matchup score agrees in direction (12 vs 5.85) but is capped context.

Pace is nearly identical (66.8 vs 65.8 plays per game). Power ratings are confirmed 2026 four-game values (matches_2026 true): net PPG -2.0 vs -7.5, a 5.5-point gap equal to the spread [Source: data/research-intel/game-packets/2026-w05/DET_at_ARI.md, power ratings, 2026-10-11T04:23Z]; no adjustment on that alone. Arizona's stadium has a retractable roof and has no Open-Meteo entry, so weather is not applied.

## Market

BKR: DET -5.5 -110 / ARI +5.5 -106, total 54.5 (O -107 / U -109), moneyline -254 / +218. BEO: -5.5 -110 both ways, 54.5 -110, -255 / +211 [Source: data/research-intel/game-packets/2026-w05/DET_at_ARI.md, market, 2026-10-11T04:23Z]. No book conflict. At 5.5 the line sits between 3 and 7; the simulator's exact-margin share is 14.3% at 3 and 8.8% at 7. The Action Network opener is missing. Splits are stale (Oct 9, 12:41 PT): 54%/56% tickets/money on DET spread, 56%/58% on the over, 92%/97% on the DET moneyline; context only. SuperContest lists DET -5.5 (favorite field used; labels reversed).

## Evidence quality

All 36 verified rows are corroboration_only; none can support a tier. Sources split and several quote a stale number: ARI +4.5 from Even Money/Ross Tucker (rows[168], rows[310]), Steve Fezzik (rows[309]) and Ryan Wormeli (rows[337]) are a full point off and downgraded. BettingPros has both ARI +5.5 (rows[188]) and DET -4.5 (rows[175]); Sharp or Square has DET -5.5 (rows[138]) and ARI +6 (rows[184]); Simon Hunter has DET -5.5 and -4.5 (rows[253], rows[376]). The BettingPros over at 52 (rows[187]) is 2.5 points stale. Disagreement is preserved, not averaged.

## Thesis and counter-thesis

Edge hypothesis: 0.0 home-margin points and 0.0 total points versus BKR. Zero-edge simulator: ARI cover 0.500, DET cover 0.500, over 0.500, under 0.500, pushes 0 and 0 [Source: scripts/intel/margin-simulator.mjs, calibration 0ea35592, 2026-10-11T05:34:47Z]. These are hypothesis-conditional, not calibrated edges. The provisional quant pass (home margin -3.43, total 56.27) disagrees by about 2 points on each; not adopted, because ratings match the market and FTN signals offset. Disposition pass, tier research_only.

Counter-thesis: Arizona's two high-volume targets meet a depleted Detroit secondary while Detroit's interior line is two starters short, so ARI +5.5 and the over are live. The reverse case is Detroit's 15-sack rush against a reshuffled Arizona line. Neither has a tier-eligible source.

## Gaps

- No tier_eligible rows; all 36 corroboration_only.
- Quant pass vs market: home margin -3.43 vs -5.5, total 56.27 vs 54.5.
- Warnings: DET/ARI availability lines; SuperContest labels reversed; retractable roof unchecked.
- Questionable: Tyleik Williams, Walter Nolen III, Karson Sharar.
- Action Network opener missing; splits stale.
- FTN ARI PT/GM 20.3 vs packet PPG 21.8.
- Global preflight WARNs: corroboration-only rows, SuperContest reversals, two other-game book conflicts, BKR expiry within 120 min.

## Pre-kickoff delta checklist

- Official inactives and starters (Goff, Brissett, questionable DTs).
- Fresh BKR/BEO capture after 00:15 PT.
- Roof status and weather recheck.
- Game status unchanged.
- Reprice source picks against the fresh line (4.5, 6, 7).
