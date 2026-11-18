# 2026 mid-season post-mortem (Weeks 1-9)

Platinum Rose · written Fri 11/13 by Claude · data through MNF Week 9 (BUF @ MIN) · W10 TNF not included.
Inputs: `picks.jsonl` (3,085 graded picks), `tickets.jsonl` (318 placed tickets), `expert_grades.jsonl`, weekly podcast grade files,
`model_scores.json`, `audit_results.json` (new model audit, script `audit.py`). Independent blind re-grade of 140 picks agreed on 138.

**Approved by Andy Fri 11/13: P1, P2, P3, P6** (in force from Week 10 Sunday as rules version 2026-W10-r2). The other proposals still need his OK. Proposals are in section 7, each tagged with the audit checks it passed.

## 1. Bottom line
1. **The season is -$222 on cash, and the W5-9 turnaround is not yet distinguishable from luck.** W1-4 lost $1,317 (90% interval -$2,165 to -$614: a real loss). W5-9 made $1,094, but the interval runs from -$1,136 to +$4,278, and without the one W6 9-team hit (+$1,248) W5-9 is -$154 with a 59% chance of being a loss.
2. **Our tickets hit about as often as their prices imply, not more.** 253 cash tickets won 20 times; their prices implied 21.8 wins (vig included). W5-9: 13 wins vs 13.6 implied. There is no sign yet that ticket selection beats the market.
3. **Most of our tickets are the same bet.** In W5-9, 55% of placed legs also sat on another ticket that week (42% in W1-4). That makes the record look larger and steadier than it is, and it is why one good or bad Sunday swings the season.
4. **What is real (intervals that exclude zero):** same-game side+total 2-teamers and first-TD/2+TD three-packs lose; master round robins lose; BetOnline long-shot prop parlays lose (0 for 112, though only 2.7 wins were expected at their prices); expert spread picks lose (-38u on 379); expert total picks win (+15u on 91); the Action Network and Ross Tucker podcasts lose; the W9 analytics-first fair lines beat the market line (one week only).
5. **What is not yet real:** the BettingPros podcast edge (+10 to +14u, 17% chance it's zero or worse), PFT's straight-up record, game-line parlays overall, Bookmaker, and every prop-screen finding (one week).

## 2. Cash results with uncertainty (cluster bootstrap, 10,000 resamples; tickets that share a leg resample together)

| Slice | Tickets | Independent clusters | Net | 90% interval | P(net ≤ 0) |
|---|---|---|---|---|---|
| W1-4 | 118 | 44 | -$1,316.94 | -$2,165 to -$614 | 100% |
| W5-9 | 135 | 26 | +$1,094.45 | -$1,136 to +$4,278 | 30% |
| W5-9 without the W6 9-team (+$1,248) | 134 | 26 | -$153.78 | -$1,269 to +$990 | 59% |
| Game-line parlays (W1-9) | 72 | 23 | +$490.03 | -$1,384 to +$3,583 | 37% |
| 2-leg tickets | 21 | 19 | -$265.93 | -$428 to -$92 | 99% |
| 3-leg tickets (0 of 16 won) | 16 | 11 | -$154.71 | -$205 to -$105 | 100% |
| 4-team master round robins (0 of 5) | 5 | 5 | -$440.53 | -$525 to -$272 | 100% |
| BetOnline cash (0 of 112) | 112 | 37 | -$712.57 | -$913 to -$533 | 100% |
| Bookmaker cash (14 of 109) | 109 | 36 | -$68.49 | -$2,371 to +$3,230 | 56% |

By leg count (interim): 4-leg +$110, 5-6 leg +$90, 7+ +$684 (the one 9-team hit). DK Predictions +$513 and Pick6 +$97 are promo/exempt.

## 3. Price calibration (A2): do our tickets beat their own odds?

| Implied chance (from the price) | Tickets | Won | Expected at the price |
|---|---|---|---|
| under 5% (long-shot parlays) | 163 | 2 | 3.0 |
| 5-15% | 49 | 5 | 3.8 |
| 15-30% | 18 | 4 | 4.7 |
| 30-45% | 12 | 1 | 3.9 |
| 45-60% | 8 | 5 | 4.3 |
| 60%+ | 3 | 3 | 2.1 |
| **All** | **253** | **20** | **21.8** |

Long shots (under 5%) are 64% of all cash tickets and won 2 times against 3 expected: that bucket alone carries the season's variance. Only 7 tickets ever recorded my own pre-bet probability estimate, too few to calibrate me; proposal P9 fixes that.

## 4. Correlation (A1)
- W1-4: 677 placed legs, 42% of them on more than one ticket the same week; 8% of same-week ticket pairs share a leg.
- **W5-9: 733 legs, 55% shared; 11% of pairs share a leg.** Correlation went up as volume per slate went up.
- Biggest clusters (tickets linked through shared legs): W8 29 tickets (2 won, +$306); W5 23 tickets (0 won, -$339); W3 22 (0 won, -$332); W7 19 (0 won, -$201); W2 17 (1 won, -$269). A whole Sunday rides on a handful of players (TD scorers, QB passing, one RB's rushing).
- W10 TNF did it again: Okonkwo receptions on 3 tickets, Skattebo rushing on 3, Styles/Reese tackles on several.

## 5. Ranked sources (what to lean on, keep as a flag, or cut)
Records are graded at the stated line/price (-110 when none). Intervals: 90% bootstrap of units. n < 20 = directional only.

| Rank | Source / model | Record or score | Units | 90% interval | Verdict |
|---|---|---|---|---|---|
| 1 | **Fair lines, analytics-first (W9)** | margin error 7.65 vs market 8.25 (14 games); 8-2 ATS at edge ≥ 0.5; Brier 0.233 vs 0.250 | n/a | model better by 0.2 to 1.0 pts/game | **Lean on** (one week: keep testing) |
| 2 | **Expert totals (articles/feeds)** | 61% (n 91) | +15.0 | +0.6 to +29.3 | **Lean on as tiebreaker** |
| 3 | BettingPros podcast | 64-47 (voided-inactive rule) / 62-50 (house rule) | +10.3 to +14.3 | -7.2 to +28.2 | Keep, modest weight |
| 4 | Pro Football Talk (articles) | 57-25 straight up, mostly favorites | +7.6 | -3.9 to +19.0 | Flag (fair-priced favorites) |
| 5 | Sharp or Square podcast | 24-18 to 26-18 | +3.8 | -6.5 to +13.5 | Keep, neutral weight |
| 6 | X/Twitter bookmarks (articles layer) | n 62 | +4.8 | -6.6 to +16.3 | Keep as flag |
| 7 | VSiN podcast | 11-8 | +0.9 to +1.9 | -6.7 to +8.4 | Neutral (small n) |
| 8 | Even Money podcast feed | n 38 | -1.7 | -11.3 to +7.8 | Neutral |
| 9 | Kalshi game-winner snapshots | Brier 0.225 vs closing spread 0.216 (270 team-games) | n/a | worse than the close | Flag only |
| 10 | EPA matchup model (walk-forward W5-9) | error 9.9 vs market 9.35 (72 games) | n/a | worse than market | Matchup flags only, not a line |
| 11 | Fair lines, expert-blended synthesis (W8) | error 11.5 vs 11.3; Brier 0.251-0.259 | n/a | no edge (P 60% worse) | **Retired** (replaced W9) |
| 12 | W9 prop hit-rate screen | 377 props, -36u; Unders +5.9u, Overs -43.4u; edge ≥ 10 +5.4u | -36 | one week | Use only Unders / edge ≥ 10, directional |
| 13 | VSiN articles | n 127 | -14.4 | -31.3 to +3.2 | Downweight |
| 14 | BettingPros expert feed (non-podcast) | n 87 | -13.7 | -28.3 to +1.0 | Downweight |
| 15 | Ross Tucker podcast | 15-27 (house rule) / 23-23 (voided) | -7.4 to -13.4 | -22.9 to -3.8 | **Cut** for picks; keep straight-up for pools context |
| 16 | **Expert spread picks (all outlets)** | 46.8% (n 379) | -38.0 | -68.4 to -7.1 | **Cut** as a signal; dissent only |
| 17 | Action Network expert feed | n 85 | -18.6 | -32.5 to -4.7 | **Cut** |
| 18 | **Action Network podcasts** (Brandon Anderson 27-58, alt ladders + TD long shots) | 51-109 to 57-101 | -31 to -45 | -68.6 to -18.6 | **Cut** |
| 19 | Podcast anytime-TD picks | 10-54 | -32 | (all negative) | **Cut** |

Experts' own "best bets" went 57-70 (-17.5u), worse than their other picks: no extra weight for the label. Individuals worth tracking (n ≥ 12): Scott Bogman 12-6, Andrew Erickson 16-12, Fezzik 20-12, The Prop Dealer 10-3; fade list: Steve Makinen 13-22, Gilles Gallant 2-17, Cody Brown 8-15.
Client-facing pitches: Master Intel 7-9 (W9 3-1), SuperContest 12-10 at contest lines (W9 5-1). Pools: upset flips 9 of 16 at ~42% market chance; all in slots 1-6.

## 6. Leg types (placed legs, n 1,713)
Strong: passing TDs 64.7% (85), QB INT thrown 61% (54), moneyline 60% (199), receptions 59.6% (178), tackles+assists 59.6% (57; unplaced AI tackles 16 of 20), QB volume 59.6% (52).
Weak-looking but fine: **anytime TD 45.1% (375 legs)** is priced at plus money; the 134 legs with a recorded price beat break-even in every price band (section 7, P6). Weak: 2+ TDs 24%, first TD 5.6% (18), sacks 31.6% (38), total Unders 40.6% (64), QB rushing 38.9%. Andy-built 52.1% vs AI-backed 50.9%: no difference.

## 6b. Model audit status (from Rusty Bill's 8-prompt checklist; full table in PLAN.md)

| Audit | Status | Finding |
|---|---|---|
| A1 Correlation | Done | 55% of W5-9 legs shared across tickets; weekly mega-clusters |
| A2 Calibration | Partial | Tickets hit at their implied rate (20 vs 21.8); my own estimates not logged (7 tickets) |
| A3 Rule/version dates | Done | Leg floor -350 from W9; R9-1 and C2-C5 from W10. **All W1-9 support for those rules is in-sample (hindsight)**: W10+ results are their first real test |
| A4 CLV at price taken | **Blocked** | Closing lines live only in Supabase `game_odds_snapshots`; not on disk. Fix in P9 |
| A5 Bootstrap | Done | Sections 2 and 5 |
| A6 Leakage | Done, clean | W9 fair lines: 14 games, TNF excluded, built Fri before Sunday kickoffs, compared to the BKR line at build time. Podcast picks graded at the spoken line |

## 7. Proposed changes for Weeks 11-18 (need Andy's OK; audits passed in brackets)

| # | Change | Evidence | Confidence |
|---|---|---|---|
| P1 | **Same-game side+total 2-teamers only when the fair line backs both legs** (edge ≥ 1.5 pts each); first-TD and 2+TD three-packs promo-only | 17 of 21 two-leg tickets were same-game spread+total combos (legs 20/41, 5 won vs 7.3 expected, -$266); 3-leg 0/16 is mostly first-TD/2+TD trifectas [A2, A5] | Medium |
| P2 | **BetOnline: no cash long-shot prop parlays** (5+ legs); use BEO for bonus/reload-funded plays and straight bets where its price is best | 112 tickets, median price ~+8,500, avg 6.3 legs; 2.7 wins expected, 0 won (~7% chance); BEO legs hit 46% vs 53% elsewhere [A2, A5] | Medium-high |
| P3 | **Correlation cap:** at most 2 tickets per slate may share a player-stat leg (or a game total); the card builder flags overlaps before buying; post-mortems grade clusters, not tickets | 55% shared legs; mega-clusters [A1] | High |
| P4 | Sides/totals come from the analytics-first fair lines; expert spread picks are dissent only, expert totals a tiebreaker | fair lines W9 [A5, A6]; spreads -38u, totals +15u [A5] | Medium (fair lines: 1 week) |
| P5 | Podcast intake: cut Action Network (incl. Brandon's Playground ladders) and podcast ATD long shots from pick weighting; keep BettingPros and Sharp or Square; Ross Tucker straight-up for pools only | [A5] | Medium-high |
| P6 | **Keep ATD legs priced under +350; first TD, 2+ TD and podcast ATD long shots are promo-only** | priced ATD legs: under even 31/54 (57%), +100-199 22/44 (50% vs ~40% break-even), +200-349 10/26 (38% vs ~29%), +350 up 2/10; podcast ATD picks 10-54 | Medium |
| P7 | Props: prefer Unders, receptions, tackles+assists, passing TDs, QB INTs; receiving-yard Overs only at the screen's edge ≥ 10 | leg rates; prop screen (1 week, directional) | Medium |
| P8 | Keep C5 (no master round robins) and R9-1 (cash max 6 legs; 7+ promo) | RR 0/5 [A5]; R9-1 untested: re-check at W14 [A3] | High / to be tested |
| P9 | **Process:** (a) stamp each AI proposal and ticket with the rules + model version; (b) record my estimated probability on every proposal; (c) at Tuesday grading, store the DK closing line next to each single-game side/total ticket | enables A2, A3, A4 | High |
| P10 | Kalshi and the EPA model stay as flags, not inputs to the line | [A5] | High |
| P11 | Pools: keep evidence-backed upset flips in low-confidence slots (1-6) | 9 of 16 at ~42% | Low-medium |
| P12 | Re-run this audit after W13 (4 more weeks) before any further rule change | — | — |

## 8. Gaps and caveats
- Podcast records differ by grading rule: the interim (inactive players voided) vs the weekly grade files (house rule: absent player = loss). Both shown; the verdicts don't change.
- W4 podcasts missing; Grok picks only W7-9; fair lines only W8-9.
- Bootstrap intervals by cluster treat each week's linked tickets as one unit, so they are honest about correlation but wide.
- CLV (A4) cannot be measured until closing lines are stored with the ledger (P9c).
