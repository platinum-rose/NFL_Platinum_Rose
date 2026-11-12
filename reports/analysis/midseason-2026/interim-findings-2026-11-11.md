# Mid-season post-mortem: interim findings (Wed 11/11 ~3 PM PT)

Work in progress; numbers will move as layers are added and the independent re-grade runs. Plan: `PLAN.md`. Data: `picks.jsonl` (2,929 rows), `tickets.jsonl` (318), `expert_grades.jsonl` (1,175), `model_scores.json`.

## Cash results (reconciled to the season scorecard: W1-9 net -$222.49)
- **W1-4: -$1,316.94 (ROI -78%) vs W5-9: +$1,094.45 (ROI +50%).** The process changes from W5 on (post-mortems, fair lines, rules) line up with the turnaround, but W6's 9-team parlay (+$1,248) is most of it. Without W6, W5-9 is -$188.
- By family: game-line parlays +$490 (72 tickets, 7 won); prop parlays +$48; **4-team master RRs -$441 (5 tickets, 0 won; C5 confirmed)**; singles -$199; island SGP ladders -$91 over the season (W9 +$305 alone).
- By legs: **2-leg -$266 (ROI -63%), 3-leg -$155 (0 of 16)**, 4-leg +$110, 5-6 leg +$90, 7+ +$684 (one 9-team hit).
- By book: **BetOnline 112 cash tickets, 0 won, -$713**. Bookmaker +$560 (75 tickets); "Bookmaker.eu" is logged separately (-$628, 34 tickets) and needs merging/review. DK Predictions +$513, Pick6 +$97.

## Leg hit rates (placed legs, W1-9, n = 1,713 graded)
- Andy-built legs 52.1% vs AI-backed legs 50.9%: **no difference yet**.
- Strong: passing TDs 64.7% (n 85), QB INT thrown 61% (54), moneyline 60% (199), receptions 59.6% (178), tackles+ast 59.6% (57), QB volume 59.6% (52).
- Weak: **anytime TD 45.1% (375 legs, the biggest category)**, 2+ TD 24%, first TD 5.6% (18), sacks 31.6% (38), total Unders 40.6% (64), QB rushing 38.9%.
- Unplaced AI legs: tackles+ast **16 of 20 (80%)**; first TD 29%.

## Experts
- Podcasts (W3, 5-9; inactive players voided): BettingPros 64-47 (+14.3u), Sharp or Square 26-18 (+3.8u), VSiN 11-8 (+1.9u); **Action Network 57-101 (-31.1u), driven by Brandon Anderson 27-58 (-24.8u: alt ladders and TD long shots)**; Ross Tucker 23-23 (-7.4u). Best individuals (n >= 13): Scott Bogman 12-6, Andrew Erickson 16-12, Simon Hunter 31-22, John Hansen 9-5. By market: totals 23-15, spreads 121-106 (+3.9u); **anytime TD 10-54 (-32u)** and receptions 7-14.
- Article/expert picks (W4-9, verified only): totals 61% (n 90), spreads 46.8% (n 370, -38u), anytime TD 40.5% (n 163). **Experts' "best bets" went 57-70 (-17.5u), worse than their other picks.** Moneyline picks re-priced from the closing spread (no stated price): 95-66 but only -3.0u, i.e. they picked favorites at fair prices; PFT's 57-25 straight-up record is +7.6u, not +26.8u.
- People with n >= 12: Fezzik 20-12, PFT/Florio strong (mostly favorites), The Prop Dealer 10-3; weak: Steve Makinen 13-22, Gilles Gallant 2-17, Simon Hunter 5-15, Cody Brown 8-15.

## What we sent clients (Master Intel / SuperContest pitches, W7-9)
- Master Intel pitches: W7 3-5, W8 1-3, **W9 3-1** (7-9 total).
- SuperContest pitches (at the contest line): W7 4-4, W8 3-5, **W9 5-1** (12-10 total).
- W9 was the first analytics-first week (experts as dissent only). Small samples, but every layer improved that week.

## Pick'em pools (weeks with a saved picks + plan file: W1-4, W6, W9)
- Favorites picked: 86 of 125 won (69%), in line with market odds.
- **Upset picks against the market: 9 of 16 won (56%) at an average market chance of ~42%**, so the evidence-backed flips have added a little. Small sample. Every confidence-pool upset sat in slots 1-6, which kept the cost low.
- Standings: the duma 18th of 93, Yahoo 18th of 54, CBS 19th of 73. Week 9 was the best week in all three (135, 119, 13-2).

## Models
- **Fair lines, analytics-first (W9): beat the market.** Margin error 7.65 vs market 8.25; simulator Brier 0.233 vs 0.250 coin flip; 8-2 ATS where the edge was >= 0.5.
- **Fair lines, expert-blended synthesis (W8): did not.** Error 11.5-11.7 vs market 11.3-11.5; Brier 0.251-0.259 (worse than a coin flip).
- EPA matchup model (walk-forward W5-9, 72 games): error 9.9 vs market 9.35. Useful for matchup flags, not as a line.
- Two weeks of fair lines is a tiny sample: directional only.
- **Kalshi game-winner prices (270 team-games, W1-9): Brier 0.225 vs 0.216 for the closing spread.** Our stored Kalshi snapshots (often 1-4 days early) add nothing beyond the closing line; keep them as a flag only.
- **W9 prop hit-rate screen (377 graded props): -36u overall.** It only worked at the extremes: edge >= 10 pts 91-80 (+5.4u); **Unders 86-70 (+5.9u) vs Overs 91-130 (-43.4u)**; receiving-yards Overs -30.6u; passing TDs 15-6 (+5.2u). One week: directional only.

## Still to do
 final report + proposed changes (Fri/Sat).

## Independent re-grade (separate agent, blind, 140 random picks across placed legs, podcasts, experts and pitches)
- **Agreed on 138 of 140 (98.6%).** Both disagreements were ambiguous picks we had graded as losses (a "BAL anytime TD" with no player named; a TD prop with direction "unknown"). Both are now ungradable in our graders. Sample: `regrade_sample_blind.json`; results: `regrade_results_independent.json`.
