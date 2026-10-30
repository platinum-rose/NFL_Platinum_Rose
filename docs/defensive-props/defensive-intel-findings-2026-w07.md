# Defensive prop intel — what Weeks 1–7 taught us (2026)

Source: walk-forward backtest over 107 ESPN box scores (Weeks 1–7, 4,537 defender-game rows; 1,308 scored player-weeks for defenders averaging 3+ T+A). Full tables: `docs/defensive-props/defensive-backtest-2026-w07.md`. Rebuild: `npm run defense:props` then `node scripts/backtest-defensive-props.mjs`.

## Rules for placing defensive prop legs

1. **Season form alone is not an edge.** A line set half a tackle under a player's prior median went over 49% of the time; half a tackle over, 34%. Books set T+A lines near the median, so a player's average only tells you the line is fair.
2. **Discount raw hit rates.** A player who hit a line in 96% of prior games hit it 75% of the time the next week; 68% → 55%; 48% → 41%. At the bottom, 1% → 11%. Use calibrated rate ≈ 0.10 + 0.67 × raw. Against a −350 leg (78% implied), even a "perfect" season hit rate is not enough on its own.
3. **Opponent snap volume is the biggest in-game driver.** Team defensive T+A vs. opponent plays: r = 0.80 (about 1.1 team T+A per opponent play). Players beat their own average in 56% of games when the opponent ran 68+ plays (+0.7) and in 33% when it ran ≤ 58 (−0.6). CBs gain the most from volume (+1.0). Opponent play counts do **not** carry over well week to week (r = 0.18), so get expected volume from the game itself: total, spread, pace and likely script, not the opponent's season average.
4. **Vacated tackles are the most reliable bump.** When a 6+ T+A linebacker is missing, the other linebackers gain about 2.2 T+A (61% go up). A missing 6+ safety → other safeties +1.6. A missing LB gives safeties only +0.4, and a missing safety does not help LBs. Check the injury report for a team's tackle leaders first.
5. **Linebackers are the stable bet; corners and DL are noise.** Correlation of a player's early (W1–3) vs. late (W4–7) average: LB 0.59, S 0.30, CB 0.08, DL −0.12. Typical game-to-game swing (CV): LB 37%, S 44%, CB 46%. Prefer LB T+A overs; treat CB/DL T+A as coin flips unless snap volume or a vacated role points their way.
6. **Losing-team safeties and DL get a bit more work;** winning teams' safeties and DL a bit less (S: +0.3 lost vs. −0.3 won; DL +0.3 / −0.3). LBs barely move with the result. High opponent rush volume (30+ carries) helps LBs (+0.7); high pass volume (38+ attempts) helps CBs (+0.8) and safeties (+0.4).
7. **Do not adjust for the stat crew (venue).** Assist rates at the same venue did not agree between the home and visiting defense (r = 0.06), and odd vs. even home games barely agreed (r = 0.21). So far, assist crediting looks like noise, not a scorer habit. Applying it made projections worse.
8. **Do not adjust for the opponent's season "tackles allowed" by position.** Early-season factors did not predict late-season ones (LB r = 0.10, S r = 0.08), and applying them raised error (MAE 2.14 vs. 2.06 for the plain season average).
9. **Sacks:** a player with a sack in over half his games had a sack the next week 38% of the time; 26–50% → 18%; no prior sacks → 8%. A sack leg is at best a ~35–40% proposition even for the most consistent rushers.
10. **Solo-tackle share is not a stable trait** (split-half r ≈ 0.15–0.2 for every group). Solo props follow T+A volume; don't pay up for a "high-solo" profile.

## Changes made to the weekly sheet (`scripts/build-defensive-props.mjs`)

- Projection = season average + vacated-tackle bump (LB→LB +2.2, S→S +1.6, LB→S +0.4). The bump is scaled by the share of the player's games the absent teammate played in, so an absence already baked into the average counts less.
- Hit-rate columns are calibrated (0.10 + 0.67 × raw).
- Opponent and stat-crew factors stay in the sheet for reference only.

## First out-of-sample check — Week 8 TNF (CAR @ GB, final 27–19)

GB: Franklin (LB, 6.8) OUT and Cooper (LB, 7.5) on IR.

| Player | Season avg | Sheet projection | Actual |
|---|---|---|---|
| Isaiah McDuffie (LB) | 4.7 | 7.8 | 10 |
| Ty'Ron Hopper (LB) | 3.2 | 6.1 | 8 |
| Evan Williams (S) | 8.7 | 9.3 | 10 |
| Javon Bullard (S) | 5.3 | 5.9 | 4 |
| Xavier McKinney (S) | 4.4 | 5.0 | 3 |

The linebacker bump was right and still too small. The safety bump was mixed, as rule 4 predicts.

## Caveats

- Seven weeks is a small sample; the calibration and bumps should be refit as weeks are added.
- ESPN only lists defenders who recorded a stat, so a 0-tackle game is invisible (slight upward bias).
- No historical sportsbook defensive prop lines are stored yet, so "edge" is measured against the player's own median, not actual prices.

---

# Backfill v2 — snaps, play-by-play, expected plays, and Andy's own legs (added 2026-10-29 ~22:30 PT)

Data added for Weeks 1–7 (`node scripts/fetch-nflverse.mjs`, then `python scripts/defensive_backfill.py`):
- nflverse snap counts: 96.6% of defender-games matched.
- nflverse play-by-play tackle credits: 92.4% matched.
- Closing spread and total for all 107 games.

Outputs:
- `data/defensive-props/defensive-enriched-2026.json`
- `data/defensive-props/expected-plays-model-2026.json`
- `data/defensive-props/defensive-backtest-v2-2026-w07.json`

Andy's leg review: `reports/analysis/defensive-legs-review/andy-defensive-legs-2026-w01-w08.json`.

## What the backfill showed

1. **Opponent play volume can't be predicted from the betting lines, at least not yet.** A walk-forward model using closing total, spread, the opponent's prior play counts and the defense's prior plays faced had error of 6.53 plays vs. 6.49 for the plain league average (r ≈ 0). Total alone: r = 0.10; spread alone: r = 0.02. Volume is the biggest driver of tackles (r = 0.80 in-game), but it is decided inside the game. **Don't pay up for a "high-volume script" angle on its own.**
2. **Snap counts don't sharpen the average.**
   - T+A per snap × last-3 snap share × expected plays scored error 2.07 vs. 2.06 for the season average.
   - Snaps help a little for DL (1.55 vs. 1.63).
   - Last-3 snap share predicts next week's snap share no better than the season share (error 0.110 vs. 0.112).
   - Use snaps to *spot role changes* (new starter, rotation), not to project.
3. **Compare a book line to the player's average, not the median.**
   - The fair line sits about 0.25 under the average: a line half a tackle under the average went over 53% of the time; a line at the average, 45%.
   - A line 1 tackle under the average went over **63%**; 1 tackle over, **31%**.
   - When the average is 0.5+ above the median, a median-based line went over **69%** (293 cases, steady each week 4–7).
   - The weekly sheet's projection is now average − 0.3, because defenders finished about 0.35 tackles under their prior average the following week.
4. **The vacated-tackle bump is real but smaller out of sample.**
   - Linebackers covering a missing 6+ T+A linebacker ran +1.2 tackles vs. baseline (43 cases), not the +2.2 the in-sample study suggested.
   - Safeties ran +0.7.
   - The sheet now uses LB→LB +1.4, S→S +1.6, LB→S +0.4, scaled by the games shared with the absent player.
5. **Where tackles come from (play-by-play, Weeks 1–7):**

| Position | Runs | Short passes | Deep passes | Sacks | Special teams |
|---|---|---|---|---|---|
| LB | 55% | 29% | 1% | 4% | 11% |
| S | 45% | 37% | 6% | 1% | 11% |
| CB | 31% | 54% | 8% | 1% | 7% |
| DL | 79% | 9% | 0% | 10% | 3% |

ESPN's tackle totals include some special-teams tackles. They run about 0.36 higher than play-by-play scrimmage tackles, and match exactly in 72% of games. Check each book's settlement rule. A linebacker who also covers kicks gets a small bump on ESPN-settled markets.

## Andy's defensive legs, Weeks 1–8 (124 graded overs)

"ROI if straights" scores each leg as a 1-unit straight bet at its listed price (70 legs had prices).

| Market | Legs | Hit rate | Avg implied (priced) | ROI if straights | Model's pre-week probability |
|---|---|---|---|---|---|
| **Tackles + assists** | 46 | **58.7%** | 58.0% | **+27.9%** (26 priced) | 54.8% |
| **Sacks** | 34 | **26.5%** | 42.3% | **−37.3%** (24 priced) | 24.0% |
| INT (mostly QB INTs thrown) | 44 | 56.8% | 49.6% | −25.7% (20 priced) | 52.6% |

- **Sacks are the leak:** 9 wins in 34, at prices implying 42%. The model would have said about 24%. Its sack calibration (prior sack-game rate over 50% → 38% next week) matched what happened. **Stop playing sack overs as parlay filler.** If you play one at all, it's a lone plus-money leg on a rusher with a sack in over half his games, at a price implying under 35%.
- **Tackles are the best defensive market for you:** 59% hits at about −140 average implied, +28% as straights. Keep using them, with the average-vs-line rule above.
- **QB INT legs** hit 57%, but the priced ones lost money (−26%). The small split is telling: when the model's probability beat the price, they went 6-2 (+40%); when it didn't, 0-4. Price-check INT legs against the QB's prior INT rate (shrunk toward the league ~45%).
- The samples are small (8–26 priced legs per bucket). Re-run weekly; `grade_andy_defensive_legs.py` is rerunnable.
