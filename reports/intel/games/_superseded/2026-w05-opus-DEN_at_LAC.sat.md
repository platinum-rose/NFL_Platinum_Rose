# DEN@LAC Week 5 single-game synthesis (opus)

Written 2026-10-11T05:19:18Z (Sat 10-10 22:19 PT), HEAD 7ebef66. Kickoff Sun 10-11 13:05 PT. **Disposition: pass. Tier: research_only.** No side, no total lean; edge hypothesis 0.0 margin / 0.0 total.

## Game script

Denver is a 3.5-point road favorite in an AFC West game between two weak offenses; the market implies DEN 22.75, LAC 19.25 [Source: game-packets/2026-w05/DEN_at_LAC.md, market_implied_score, BKR 01:15Z]. Expect a slow game: Denver runs 58.0 plays per game, LAC 61.3, and both tempo z-scores are below -1.0 [Source: game-packets/2026-w05/DEN_at_LAC.md, FTN tempo PLY/GM]. The game turns on Denver's pass rush against a Chargers line missing most of its starters, and on whether LAC's thinned receivers can attack a Denver secondary without both starting corners.

## Away state: Denver (2-2)

Denver lost 31-10 at KC, beat JAX 20-13 and LAR 30-26 at home, and lost 24-14 at SF. Its opponents are 13-3 combined, and both losses came on the road to teams now 4-0. Denver is 2-0 home, 0-2 away and 0-1 in the division, -20 in point differential, on seven days' rest, with its bye in Week 10. Next: SEA at home, at ARI, KC at home [Source: game-packets/2026-w05/DEN_at_LAC.md, team state, built 04:23Z]. A win makes it 3-2 and 1-1 in the division, still behind KC (4-0) and LV (3-1).

## Home state: LA Chargers (0-4)

LAC lost 26-14 to ARI and LV at home, 24-16 at BUF and 30-23 at SEA. Opponents are 10-6 combined; ARI is now 1-3. LAC is 0-2 home and 0-1 in the division, -39 in point differential, on seven days' rest, with its bye in Week 7 and a trip to KC next [Source: game-packets/2026-w05/DEN_at_LAC.md, team state]. A loss means 0-5 and 0-2 in the division. Four games is a small sample, so neither record counts as a rating.

## Matchup mechanics

SRS has Denver +5.86 (rank 7) and LAC -9.31 (rank 30); net points per game are -5.0 and -9.75. These are 2026 four-game values (matches_2026 true; the attribution text is stale), so I make no adjustment on them alone [Source: game-packets/2026-w05/DEN_at_LAC.md, power_ratings label check]. Net points imply a neutral-field gap of about 4.75, close to the line.

The main mismatch is Denver's rush against LAC's protection. LAC allows an 8.3% sack rate and 39.3% pressure rate and has 9 turnovers (3.67% of plays) [Source: game-packets/2026-w05/DEN_at_LAC.md, FTN team-offense pass-protection/efficiency, LAC]. Denver pressures 31.6% of dropbacks and blitzes 38.6% [Source: game-packets/2026-w05/DEN_at_LAC.md, FTN team-defense pass-rush, DEN]. ESPN lists tackle Joe Alt and guard Kayode Awosika Out, Rashawn Slater and Trevor Penning on IR, and guard Branson Taylor Questionable [Source: ESPN injury report via packet, 04:21Z]. Justin Herbert should face heavy pressure on passing downs.

Denver's absences cut the other way: corners Pat Surtain II and Riley Moss are Out. LAC may not be able to exploit that. Quentin Johnston and Brenen Thompson are Out and Ladd McConkey is Questionable, which leaves Tre Harris (21 targets, Weeks 1-4) and TE Oronde Gadsden II (8 targets in Week 4) [Source: nflverse player_stats_weekly.csv, 2026 W1-W4]. LAC's own secondary is missing Derwin James Jr. and Donte Jackson.

Denver's offense posts -0.023 EPA/play and -2.1% DVOA, against LAC's -0.159 and -25.4% [Source: game-packets/2026-w05/DEN_at_LAC.md, FTN team-offense efficiency]. LAC's run defense is its best unit (EPA/att -0.165, stuff rate 22.4%), which pushes Denver toward Bo Nix's short passing (aDOT 5.3, explosive rate 6.9%). The packet resolves Nix and Herbert as starters with no flag. SoFi is listed as covered but open-sided, and there is no weather row for this game, so I make no weather adjustment.

## Market

Bookmaker (Sat 18:15 PT): DEN -3.5 -113 / LAC +3.5 -103, total 42 (O -114 / U -102), moneyline -194 / +170. BetOnline (Sat 20:15 PT): -3.5 -112 / +3.5 -108, total 42 at -110 both ways, moneyline -188 / +164 [Source: game-packets/2026-w05/DEN_at_LAC.md, market]. The books do not conflict. Both captures are fresh now but will be stale before kickoff. The opener is missing. Friday splits had Denver at 54% of spread tickets, the over 41.5 at 69% of tickets and Denver at 86% of moneyline tickets; these are context only. The SuperContest line is DEN -3.5 (labels reversed). An exact 3-point margin carries 15.1% in the simulator, so +3.5 and +3 are different bets.

## Thesis and counter-thesis

Two tier-eligible rows back LAC +3.5, but both are VSiN (w05-expert-verified.json#rows[455], Reynolds; w05-expert-verified.json#rows[567], Tuley best bet), so they count as one outlet. The corroboration-only rows split: Action Network, Even Money, Fezzik, Tucker, Wormeli and Millman lean LAC; BettingPros/Erickson, Simon Hunter and PFT lean DEN. The provisional quant pass has DEN by 4.39 with a 42.7 total.

My margin edge is 0.0. The VSiN view and Denver's missing corners favor LAC. LAC's battered line against a blitz-heavy rush, its turnover rate and the quant pass favor Denver. These roughly cancel within 12.77 points of residual noise. My total edge is also 0.0: tempo and weak offenses point under, while two depleted secondaries and the quant 42.7 point over. At zero edge the simulator gives home cover 50.0%, away cover 50.0% and side push 0; over 48.5%, under 48.5% and total push 3.0%. These numbers depend on that hypothesis and are not calibrated edges.

Counter-thesis: I may be passing on a classic spot, a home underdog at +3.5 past the key number with a sharp outlet behind it, against a road team that is 0-2 away and averaging 12 points in those games.

## Props (usage context only)

| player | market | line/price | book, captured | 2026 usage |
|---|---|---|---|---|
| RJ Harvey (DEN) | rec Over | 4.5 +122 | BKR 01:17Z | 4/6/10 rec W1/W3/W4 |
| J.K. Dobbins (DEN) | rush yds Under | 52.5 -104 | BKR 01:17Z | 36/36/49/40 W1-W4 |

## Gaps

- The opener is null, and the total moved from 41.5 on Friday to 42.
- There is no weather row; roof status comes from the static table.
- The quant pass disagrees with the 0.0 edge; I did not copy it.
- The digest lists Njoku, Henningsen and Bailey on IR, but ESPN does not.
- Near-miss rows[506] is context only. Global warnings: corroboration-only rows, SuperContest label reversals, and BKR/BEO conflicts on other games.

## Pre-kickoff delta checklist

- Inactives: Taylor, McConkey, Kolar, Shelley, Matlock; DEN CB depth
- Fresh BKR/BEO capture; watch for a move to 3 or 4
- SoFi weather/roof recheck
- Game status
- Reprice VSiN +3.5 if the line moves to +3
