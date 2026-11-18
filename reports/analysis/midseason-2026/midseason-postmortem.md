# 2026 mid-season post-mortem (Weeks 1-10)

Platinum Rose · updated Mon 11/16 by Claude (Fable run) · data through MNF Week 10 (LAC 23, BAL 20). The W1-9 version is kept as `midseason-postmortem.md.bak-w1-9-20261116` and in `w1-9-snapshot/`.
Inputs: `picks.jsonl` (3,540 graded picks), `tickets.jsonl` (360 placed tickets), `expert_grades.jsonl`, weekly podcast grade files, `model_scores.json`, `audit_results.json`, and the new `w10/*.json` files (each has the script that made it beside it).
Money below is the pick-accuracy lens: cash-funded tickets at full ticket value, legacy NCAA fill excluded. It is not the official bankroll; that needs a ruling (pipeline audit, section 4).

## What changed with Week 10 (one page)

**Week 10: 39 cash tickets, 3 won, -$309.62.** Legs hit 58% (137-98), the third straight week near 60%, and the week still lost because 28 of the 39 tickets had 5 or more legs.

| | Before (W1-9) | After W10 | Read |
|---|---|---|---|
| Season cash net | -$222 | **-$532** (90% interval -$2,994 to +$2,709) | not distinguishable from zero |
| W5 onward | +$1,094 | **+$785**; without the W6 9-team hit **-$463** (74% chance that is a real loss) | the turnaround now rests even more on one ticket |
| Tickets won vs wins implied by their prices | 20 vs 21.8 | **23 vs 26.1** | still no sign that ticket selection beats the price |
| 7+ leg cash tickets other than the W6 hit | 0 of 86 | **0 of 101, -$1,143** (interval -$1,603 to -$728) | **real**. W10 added 15 more losers (-$141) with legs at 62% |
| Legs shared across tickets | 55% (W5-9) | **64% in W10**; 31 of 39 cash tickets were one linked cluster | overlap got worse the week after P3 was approved |
| Fair lines (analytics-first) | 1 week: error 7.65 vs market 8.25 | **2 weeks: W10 error 9.91 vs 10.46**; 14-5 against the spread at edge ≥ 0.5 | holding up out of sample |
| Expert totals | 61% (+15u): "lean on" | **W10 6-11**; season +9.4u, interval now -6.8 to +25.6 | **downgraded**: no longer distinguishable from zero |
| Expert spreads | 46.8% (-38u) | **W10 27-35**; season -48.5u (interval -81 to -14) | **real**, confirmed out of sample |
| Receiving-yard Overs (placed) | 54% | **W10 5-9**; season 52% vs ~55% break-even | P7's warning confirmed |
| QB INT, tackles, passing TDs, receptions | 60-65% | **W10: 9-4, 10-3, 10-5, 14-9** | all four held out of sample |
| Master Intel pitches | 7-9 | **W10 8-2** (15-11) | best week; small sample |
| SuperContest (Andy's locked five) | 20-24-1 | **W10 4-1** (24-25-1) | coin flip so far |

Three new findings:
1. **Under legs were never corrupted in the ledger.** The settler bug is real but lives in a different script than the one blamed, and every earlier week's grades check out (pipeline audit, section 1).
2. **Closing lines for all 150 games were already on disk** inside the cached ESPN summaries. Audit A4 is unblocked: on main-line bets Andy's number beat the close 43 times, tied 32, lost 18 (average +0.12 points). Two-thirds of side/total legs are bought points or alt lines, which is where the old impression of "beating the number" came from.
3. **The rules approved for W10 were mostly not followed.** P3 (overlap), R9-1 (max 6 legs) and C5 (no master round robin) were all broken on cash tickets. The tickets that broke R9-1 went 0 for 15.

## 1. Cash results with uncertainty (cluster bootstrap, 10,000 resamples; tickets that share a leg resample together)

| Slice | Tickets | Clusters | Net | 90% interval | P(net ≤ 0) | Verdict |
|---|---|---|---|---|---|---|
| W1-4 | 118 | 44 | -$1,316.94 | -$2,165 to -$614 | 100% | real loss |
| W5-9 | 135 | 26 | +$1,094.45 | -$1,136 to +$4,278 | 30% | not distinguishable |
| **W10** | 39 | 4 | **-$309.62** | -$655 to -$116 | 100% | one cluster: a single bad week, not a trend |
| W5-10 | 174 | 30 | +$784.83 | -$1,498 to +$4,017 | 36% | not distinguishable |
| W5-10 without the W6 9-team | 173 | 30 | -$463.40 | -$1,623 to +$717 | 74% | leaning loss |
| W1-10 | 292 | 74 | -$532.11 | -$2,994 to +$2,709 | 66% | not distinguishable |
| 7+ legs, without the W6 9-team | 101 | 31 | -$1,142.81 | -$1,603 to -$728 | 100% | **real** |
| 2-leg tickets | 24 | 22 | -$362.22 | -$530 to -$182 | 100% | **real** |
| 3-leg tickets (0 of 18) | 18 | 12 | -$174.71 | -$230 to -$125 | 100% | **real** |
| 4-team master round robins (1 of 6) | 6 | 6 | -$368.95 | -$630 to -$100 | 99% | **real** |
| BetOnline cash (0 of 116) | 116 | 39 | -$745.22 | -$943 to -$568 | 100% | **real** |
| Bookmaker cash | 119 | 39 | -$102.91 | -$2,421 to +$3,207 | 57% | not distinguishable |
| Island SGP ladders | 86 | 26 | -$193.60 | -$591 to +$337 | 77% | not distinguishable |
| Game-line parlays | 78 | 25 | +$390.74 | -$1,489 to +$3,516 | 40% | not distinguishable |

## 2. Product split

Full-ticket dollars. Views overlap (an Alejandro DKP 7-pick is in two rows). "Expected wins" = sum of 1/price over priced tickets. n < 20 is directional only.

**Week 10**

| Product | Tickets | Won | Staked | Net | Legs | Leg rate | Expected wins |
|---|---|---|---|---|---|---|---|
| Andy solo cash tickets (no RRs, no legacy fill) | 27 | 1 | $326.78 | -$304.84 | 84-61 | 58% | 2.9 |
| Alejandro splits (n < 20) | 10 | 0 | $99.90 | -$99.90 (Andy's half -$49.95) | 37-28 | 57% | 0.4 |
| DKP pick-combos, 2-4 legs (n < 20) | 3 | 0 | $49.69 | -$49.69 | 5-4 | 56% | 0.4 |
| DKP pick-combos, 5-6 legs (n < 20) | 8 | 0 | $79.94 | -$79.94 | 25-21 | 54% | 0.4 |
| DKP pick-combos, 7+ legs (n < 20) | 13 | 0 | $129.86 | -$129.86 | 56-40 | 58% | 0.3 |
| BKR round robins (n < 20) | 2 | 2 | $125.00 | +$95.12 | 9-3 | 75% | n/a |
| BKR open-spot fill (legacy, off the 2026 bankroll) | 1 | 1 | $37.50 | +$361.93 | 4-0 | — | 0.1 |
| Island 3-tier tickets (TNF/SNF/MNF) (n < 20) | 13 | 1 | $124.86 | -$102.92 | 48-29 | 62% | 0.9 |
| AI paper: TNF/Island builds (n < 20) | 15 | 4 | 15u | +21.5u | 32-20 | 62% | 2.4 |
| AI paper: Master Intel templates (n < 20) | 16 | 1 | 16u | -8.1u | 42-33 | 56% | 0.9 |
| SuperContest: Andy's locked five | 5 picks | 4-1 | — | — | — | — | — |
| SuperContest: AI pitches | 7 picks | 4-3 | — | — | — | — | — |

**Weeks 1-10**

| Product | Tickets | Won | Staked | Net | Legs | Leg rate | Expected wins |
|---|---|---|---|---|---|---|---|
| Andy solo cash tickets | 243 | 16 | $3,164.74 | -$371.25 | 690-662 | 51% | 20.9 |
| Alejandro splits (W8-10) | 27 | 1 | $274.74 | +$334.26 (Andy's share +$68.13) | 87-69 | 56% | 1.0 |
| DKP pick-combos, 2-4 legs | 21 | 2 | $228.45 | -$61.22 | 30-25 | 55% | 4.3 |
| DKP pick-combos, 5-6 legs | 37 | 3 | $348.77 | +$399.23 | 124-87 | 59% | 1.8 |
| DKP pick-combos, 7+ legs | 26 | 0 | $234.85 | -$234.85 | 113-84 | 57% | 0.5 |
| BKR round robins (n < 20) | 18 | 6 | $880.95 | -$390.18 | 49-62 | 44% | n/a |
| BKR open-spot parlays (n < 20) | 5 | 1 | $147.50 | +$251.93 | 13-8 | 62% | 0.3 |
| Island 3-tier tickets | 86 | 4 | $642.78 | -$193.60 | 280-242 | 54% | 3.2 |
| AI paper: TNF/Island builds | 56 | 10 | 56u | +11.1u (38 priced) | 122-91 | 57% | 4.7 |
| AI paper: card templates (W2-9) | 95 | 11 | 95u | -27.9u (57 priced) | 196-208 | 49% | 13.6 |
| SuperContest: Andy's locked five | 50 picks | 24-25-1 | — | — | — | 49% (36% to 63%) | — |
| SuperContest: AI pitches (W7-10) | 29 picks | 16-13 | — | — | — | — | — |

Reads: DKP 5-6 leg combos are the only DKP shape that has paid (3 wins against 1.8 expected); DKP 7+ is 0 of 26. The Alejandro split record is one W8 win; W10 was 0 of 10 at 6.5 legs a ticket. Pools: Duma has paid $50 (entry covered); W10 pool picks were not re-scored in this run.

## 3. Leg types (placed legs, n 1,948; each leg counted on every ticket it sat on)

| Category | W1-9 | W10 | W1-10 | Rate | 95% interval |
|---|---|---|---|---|---|
| Anytime TD | 169-206 | 25-29 | 194-235 | 45% | 41-50% |
| Moneyline | 120-79 | 8-1 | 128-80 | 62% | 55-68% |
| Receptions | 106-72 | 14-9 | 120-81 | 60% | 53-66% |
| Receiving yards | 79-68 | **5-9** | 84-77 | 52% | 45-60% |
| Spread (dog) | 70-79 | 2-5 | 72-84 | 46% | 39-54% |
| Spread (favorite) | 50-35 | 16-6 | 66-41 | 62% | 52-70% |
| Passing TDs | 55-30 | 10-5 | 65-35 | 65% | 55-74% |
| Rushing yards | 38-32 | 16-8 | 54-40 | 57% | 47-67% |
| Total Under | 26-38 | 5-4 | 31-42 | 42% | 32-54% |
| Tackles + assists | 34-23 | 10-3 | 44-26 | 63% | 51-73% |
| QB INT thrown | 33-21 | 9-4 | 42-25 | 63% | 51-73% |
| QB volume (yards, completions, attempts) | 31-21 | 4-4 | 35-25 | 58% | 46-70% |
| Total Over | 17-18 | 5-2 | 22-20 | 52% | 38-67% |
| Sacks | 12-26 | 1-1 | 13-27 | 33% | 20-48% |
| Carries | 16-11 | 2-3 | 18-14 | 56% | 39-72% |
| 2+ TD | 6-19 | 1-0 | 7-19 | 27% | 14-46% |
| Kicker FGs | 9-8 | 3-1 | 12-9 | 57% | 37-76% |
| First TD | 1-17 | 1-2 | 2-19 | 10% | 3-29% |
| QB rushing yards (n < 20) | 7-11 | 0-0 | 7-11 | 39% | 20-61% |

W10 out of sample: the four categories P7 preferred (receptions, tackles, passing TDs, QB INT) went **36-18 (67%)** as unique positions; every other prop went 45-39 (54%); receiving-yard Overs 5-8. Dog spreads went 0-5 as unique positions while favorites went 9-4.

## 4. Sources and models with W10 added

| Source / model | Through W9 | W10 | Now | Verdict |
|---|---|---|---|---|
| **Fair lines, analytics-first** | W9: error 7.65 vs market 8.25; 8-2 ATS at edge ≥ 0.5 | error 9.91 vs 10.46; 6-3 ATS at edge ≥ 0.5 (5-2 at ≥ 1, 3-1 at ≥ 2); totals 6-2 at edge ≥ 2; Brier 0.234 vs 0.250 | 14-5 ATS over two weeks | **Lean on.** Two weeks, 28 games: still directional |
| Master Intel pitches | 7-9 | **8-2** | 15-11 | first week built on synthesis fair lines with a stated edge |
| SuperContest AI pitches | 12-10 | 4-3 | 16-13 | neutral |
| Expert totals | 55-35 (+15u) | **6-11 (-5.6u)** | +9.4u, interval -6.8 to +25.6, P(≤0) 18% | **Downgrade** from "lean on" to "flag" |
| Expert spreads | 173-197 (-38u) | 27-35 (-10.5u) | -48.5u, interval -81 to -14 | **Cut** (confirmed) |
| Experts' "best bets" | 57-70 | 10-18 | 67-88 | no extra weight (confirmed) |
| BettingPros podcast | +10 to +14u | 14-15 (-1.8u) | 76-65, +8.5u, interval -11 to +28 | keep, modest weight; not distinguishable |
| Sharp or Square podcast | +3.8u | 4-6 | 28-24, +1.5u | neutral |
| Ross Tucker podcast | 15-27 | 5-12 (-7.5u) | 20-39, -20.8u, interval -32 to -9 | **Cut** (real) |
| Action Network podcasts | 51-109 | 1-7 (10 picks got through) | 52-116, -50.7u, interval -75 to -25 | **Cut** (real). Check the intake filter: P5 said these should not reach pick weighting |
| VSiN articles | -14.4u | 10-18 (-8.9u) | -23.3u, interval -42 to -4 | **Cut** (now real) |
| Action Network expert feed | -18.6u | — | -19.6u, interval -34 to -6 | **Cut** (real) |
| Pro Football Talk | +7.6u | 8-4 | +7.7u, interval -4.6 to +19.8 | flag (fair-priced favorites) |
| Kalshi game winners | Brier 0.225 vs 0.216 close | 0.190 vs 0.189 | 0.231 vs 0.213 (298 team-games) | flag only (confirmed) |
| Podcast props (yardage/count) | — | 3-11 | — | no weight |

## 5. P1-P12 scored out of sample on Week 10

Everything W1-9 said about these rules was in-sample (audit A3). W10 is one week and one cluster of tickets: each row is a single observation, not a proof. "Counterfactual" assumes the stake stays in the pocket.

| # | Rule | W10 tickets or picks it touches | Counterfactual | Verdict | Audits |
|---|---|---|---|---|---|
| P1 | Same-game side+total 2-leggers only with fair-line backing; TD three-packs promo only | 2 two-leggers (SNF PIT +4.5/Over, MNF live 2H), 0 won, -$54.29; 1 first-TD three-pack, -$10 | +$64.29 | **Lock in** | A2, A5 |
| P2 | No BetOnline cash prop parlays with 5+ legs | 2 tickets (6-leg TNF, 8-leg ATD), -$17.65. BEO cash is now 0 of 116 | +$17.65 | **Lock in** | A2, A5 |
| P3 | At most 2 tickets per slate share a player-stat leg or game total | **Not followed.** 11 tickets were a 3rd-or-later use; 64% of legs were shared. Henry sat on 5 tickets (-$49.95). Dropping the 11: +$21.32, or +$92.90 if the hedged master round robin is kept | +$21 to +$93 | **Lock in, and enforce at build time**: `scripts/cards/check_overlap.py` exists but did not stop the buys | A1 |
| P4 | Sides/totals from the fair lines; expert spreads dissent only; expert totals tiebreaker | Fair lines 6-3 ATS; expert spreads 27-35; expert totals 6-11 | — | **Lock in the fair lines; revise: drop the totals tiebreaker** | A5, A6 |
| P5 | Cut Action Network and podcast ATD long shots; keep BettingPros, Sharp or Square; Ross Tucker for pools only | AN 1-7, Ross Tucker 5-12, BettingPros 14-15, podcast TD picks 1-4 | — | **Lock in** | A5 |
| P6 | ATD legs under +350; first TD and 2+ TD promo only | ATD 19-21 as unique positions; only 11 had a price (5-6). Two cash tickets carried a first-TD or 2+ TD leg, both lost (-$20) | +$20 | **Lock in; revise** with the role finding: WR/TE anytime TDs are the weak ones (synthesis review) | A5 |
| P7 | Prefer receptions, tackles, passing TDs, QB INT, Unders; receiving-yard Overs only with a big screen edge | Preferred four 36-18; receiving-yard Overs 5-8; prop Unders 3-2 | — | **Lock in** | A5 |
| P8a | C5: no master round robins | **Broken once**: the 8-team master RR by 4s cashed +$71.58 after a live hedge. Season 1 of 6, -$369 | -$71.58 | **Keep.** One hedged win does not offset five full losses | A5 |
| P8b | R9-1: cash tickets max 6 legs | **Broken on 15 tickets**: 0 won, -$140.51, with legs at 62% | +$140.51 | **Lock in**: first out-of-sample test passed | A3, A5 |
| P9 | Version stamps, a probability on every proposal, closing line stored | 52 of 66 W10 game recommendations carry a probability; 8 of 41 tickets have an estimate in the notes; 0 tickets carry a rules version. Closing lines: built this run | — | **Lock in; finish** (a) and (b) | — |
| P10 | Kalshi and the EPA model as flags only | Kalshi 0.190 vs 0.189 | — | **Lock in** | A5 |
| P11 | Pools: upset flips in low-confidence slots | not re-scored for W10 | — | **Open** | — |
| P12 | Re-audit after W13 | — | — | stands | — |

If every lock-in rule above had been followed in W10 (P1, P2, P6, R9-1; P3 overlaps with them), the cash loss would have been **-$94.82** instead of -$309.62, on 20 tickets instead of 39 (19 tickets, -$214.80, would not have been placed).

## 6. Audits

| Audit | Status | W10 update |
|---|---|---|
| A1 Correlation | Done | W10: 223 legs, **64% also on another ticket**; 11% of ticket pairs share a leg; 31 of 39 cash tickets form one cluster. Most reused: Henry TD (5), Hubbard TD (4), Warren TD (4), Burrow passing (4), BUF@NYJ and PIT@CIN totals (4 each) |
| A2 Calibration | Done for prices; partial for estimates | Tickets: 23 wins vs 26.1 implied (W10: 3 vs 4.3). Synthesizer probabilities (78 graded, W7/8/10): Brier 0.252 vs 0.250 for a coin flip; 61 of 78 sit between 50% and 55% and hit 47.5%. They carry no information yet (synthesis review, section 5) |
| A3 Rule dates | Done | W10 is the first out-of-sample week for C2-C5, R9-1 and P1-P7 |
| A4 CLV | **Unblocked** | section 6b |
| A5 Bootstrap | Done | sections 1 and 4 |
| A6 Leakage | Done, clean | W10 synthesis inputs all predate the build; two were stale (article review 83 h, props intel 29 h) |

### 6b. Closing-line value (A4)

Source: DraftKings close from ESPN's game summary, 150 of 150 games. 464 unique placed side/total legs matched. Method and test: `scripts/closing-lines/` on branch `claude/closing-line-capture-2026-11`; analysis `w10/a4_clv.py`.

| Slice | Legs | Beat the close | Tied | Worse | Avg CLV | Record when beat / tied / worse |
|---|---|---|---|---|---|---|
| **Main lines** (price -118 to +105, not live) | 93 | 43 | 32 | 18 | **+0.12 pts** | 20-21 / 11-21 / 10-8 |
| Spreads, main lines | 75 | 32 | 29 | 14 | +0.09 | 16-14 / 11-18 / 8-6 |
| Totals, main lines (n < 20) | 18 | 11 | 3 | 4 | +0.25 | 4-7 / 0-3 / 2-2 |
| Bought points, alt lines, live (not comparable) | 188 | 157 | 25 | 6 | +1.36 | 78-76 |
| Moneylines (implied probability) | 159 | 74 | — | 49 | +0.35 pts of probability | — |
| AI paper, main lines | 56 | 15 | 24 | 17 | +0.08 | — |

Reads: on like-for-like prices Andy beats the close more often than not, by a small margin. It is the first positive process signal that does not depend on results, and it is small: +0.12 points is worth roughly half a percent of win rate. 188 of 281 point-spread and total legs were bought to a better number, which costs price and showed no better record (78-76). The AI paper lines show no CLV: they are written at the current number, usually late in the week.

## 7. Gaps and caveats
- W10 is one correlated week. Its out-of-sample "tests" are single observations.
- Product rows use full-ticket dollars. The official bankroll needs Andy's ruling on DKP, promo and split tickets before any season ROI is quoted (pipeline audit, section 4).
- The W10 prop screen was not run, so P7's "screen edge ≥ 10" clause is untested since W9.
- Pools and Grok/X picks were not re-scored for W10.
- The independent blind re-grade of 61 W10 picks was started but not finished in this session (see the handoff).
- Changes for Weeks 11-18 are in `synthesis-review-2026-11.md`. Nothing changes until Andy approves.
