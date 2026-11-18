# How intel becomes recommendations: review against outcomes (Weeks 5-10)

Platinum Rose · written Mon 11/16 by Claude (Fable run) · proposals only; nothing changes until Andy approves. P12 (re-audit after W13) stands.
Evidence: `w10/synth_calibration.json`, `w10/failure_modes.json`, `w10/dkp_pricing.json`, `w10/p_rules_oos.json`, `w10/a4_clv.json`, each written by the script of the same name. Hit rates use unique positions (a leg on five tickets counts once) unless stated. n < 20 is directional only. Audits cited: A1 correlation, A2 calibration, A3 rule dates, A4 closing line, A5 bootstrap/intervals, A6 leakage.

## Executive summary

**Top 5 changes**
1. **Cap cash tickets at 4 legs, and build them from the four categories that held up out of sample** (QB INT, passing TDs, receptions, tackles). 5-or-more-leg cash tickets are 4 of 198 this season; at the 57% a leg we actually hit, a 7-leg ticket cashes 2% of the time.
2. **Play a side or total only when the fair line shows an edge of 2 points or more.** Synthesis recommendations with a 2+ point edge went 24-13 (65%); under 2 points, 34-39.
3. **Flip the prop default from Overs to Unders.** Synthesis prop Overs went 41-64 (39% against a 54% break-even, -27.9u); prop Unders went 29-16 (64%, +11.0u). The W9 prop screen said the same (Unders +5.9u, Overs -43.4u).
4. **Enforce the overlap cap in the build script, not by memory.** W10 was the first week under P3 and overlap rose to 64% of legs; Derrick Henry sat on 5 of 6 MNF tickets.
5. **Stop writing probabilities that all say 52%.** 61 of 78 graded synthesis probabilities sit between 50% and 55% and they hit 47.5%. Replace the A/B/C tier with a stated edge and a required reason code, and score it weekly.

**3 sources to lean on more**
- The analytics-first fair lines and margin simulator: beat the market line two weeks running (14-5 ATS at edge ≥ 0.5). Recommendations that cite the model and no expert went 16-10 (+13.4u).
- Andy's own QB INT / passing TD / tackles reads: 64%, 65% and 63% on 56 to 100 legs each, all confirmed in W10.
- Defender tackle legs on teams favored by less than a touchdown: 19-6 (underdogs 17-14).

**3 to cut or down-weight**
- Expert spread picks and "best bets" (-48.5u on 441; best bets 67-88), plus the Action Network, Ross Tucker and VSiN picks (each now a loss with an interval that excludes zero).
- First-TD and WR/TE anytime-TD legs sourced from prediction-market prices: recommendations citing a Kalshi/DKP reference went 7-26.
- Receiving-yard Overs at 70+ yards (5-9) and every expert or screen receiving-yard Over (experts 6-9, W9 screen 25-45).

## 1. Stage by stage: what each step added and where it lost

| Stage | What it produced | Accuracy | Added or lost |
|---|---|---|---|
| Captures (lines, props, splits, weather, markets) | inputs | fresh except Saturday's article review (83 h) and props intel (29 h); DKP feed has no QB INT or FG rows | Lost: the best prop category cannot be priced from the feed |
| Intel: experts, podcasts, X | 1,396 graded article/expert picks (W4-10), 665 podcast picks | spreads 46% (-48.5u); totals +9.4u (not distinguishable); podcasts overall negative | **Lost** on sides. Adds nothing measurable beyond the closing line |
| Models: fair lines + simulator | 28 games (W9-10) | margin error 0.5-0.6 points better than the market both weeks; 14-5 ATS at edge ≥ 0.5 | **Added.** The only stage that beat the market |
| Models: prop screen (W9), tackle board | 377 screen props; 62 tackle legs | screen -36u overall, Unders +5.9u; tackles 65% | Added on Unders and tackles only |
| Synthesis: per-game recommendations (W7, W8, W10) | 449 graded | B tier 47% vs 52.5% break-even (-8.8u); C tier 35% vs 37% (-28.3u) | **Lost** overall. Tiers sort hit rate but neither tier beats its price. W10 alone: B 4-1, C 16-13 |
| Synthesis: Master Intel pitches | 26 (W7-10) | 15-11; W10 8-2 | Added in W9-10, after the switch to fair lines |
| What Andy placed | 1,948 legs | props: Andy-only 52%, AI-backed 54%; sides/totals: Andy-only 58%, AI-backed 47% | Andy's own sides and totals beat the AI-backed ones over the season (W5-10: 60% vs 53%), partly because his include more moneyline favorites. Construction then loses it: 58% legs in W10, 3 of 39 tickets |

## 2. Attribution: which inputs pushed the picks that hit

Each recommendation's `reasons` text was tagged by input family (regex in `synth_calibration.py`). Passes excluded.

| Input cited | Record | Rate | Break-even | Units |
|---|---|---|---|---|
| Simulator / fair line | 27-20 | 57% | 49% | **+13.4** |
| Weather (n < 20) | 7-4 | 64% | 53% | +2.3 |
| Splits / money | 17-17 | 50% | 50% | +1.0 |
| Defense matchup | 38-41 | 48% | 52% | -6.9 |
| Injury / role news | 46-55 | 46% | 46% | -4.1 |
| Expert / podcast | 21-29 | 42% | 46% | -5.9 |
| Usage / FTN / EPA | 51-76 | 40% | 46% | -17.6 |
| Line move / price | 11-19 | 37% | 47% | -9.1 |
| Prediction-market reference | 7-26 | 21% | 29% | **-13.7** |

| Mix | Record | Units |
|---|---|---|
| Model cited, no expert | 16-10 (62%) | +13.4 |
| Model and expert both cited | 11-10 | 0.0 |
| Expert cited, no model | 10-19 (34%) | -5.9 |
| Neither (mostly TD scorers and usage-based props) | 121-223 (35%) | -44.6 |

Where a good input was diluted: when an expert agreed with the model the record was no better than a coin flip, and expert-only picks lost. Usage/FTN reasoning is the most-cited family and the second-worst: on sides and totals it went 5-13. Number of input families cited does not help beyond two (two families 37-39; three 16-23; four or more 13-13).

Edge size is what separates sides and totals: **edge 2+ points 24-13 (+9.2u); 1 to 1.9 points 18-22; under 1 point 16-17.**

## 3. Failure modes, each tested

| # | Hypothesis | Evidence | n | Verdict |
|---|---|---|---|---|
| 1 | Receiving-yard Overs lose | Placed: 79-69 (53%); priced legs 22-28 against a 55% break-even. W10 5-8. By threshold: under 40 yds 39-33, 40-69 yds 35-27, **70+ yds 5-9**. AI paper 25-27; synthesis recs 10-11; experts 6-9; W9 screen Overs 25-45. Receptions Overs for comparison: 104-72 (59%) | 148 placed | **Real as "no edge"**, a loss at 70+ and whenever the pick comes from an expert or the screen. Not a disaster category for Andy's own low rungs |
| 2 | Committee-RB and backup ATDs lose | By role over the prior 4 weeks: lead RB 39-32 (55%); **committee/backup RB 20-14 (59%)**; **WR/TE/other 57-99 (37%)**; no prior games 18-26. W10 committee backs went 5-3 | 305 | **Rejected.** The weak ATD legs are receivers and tight ends, not committee backs. Priced WR/TE legs: 38% hit vs 37% break-even, so they are fair-priced lottery legs that kill parlays |
| 3 | Defender tackles fail on big favorites | Team favored by 7+: 4-2. Favored by less than 7: **19-6 (76%)**. Underdog or pick: 17-14 (55%). Lake (LAR -8.5, 2 tackles) is one of the two misses | 62 | **Not shown** (n = 6). The surprise runs the other way: underdog defenders are the weaker group |
| 4 | Milestones are set one notch too high | Of 658 Over/milestone legs, 381 won (58%). **110 losses were within one notch** (10 yards, or 1 catch/carry/tackle/TD); one notch lower lifts the hit rate to 75%. But 94 wins cleared by less than a notch. DKP charges about 22% of the price for one 10-yard notch (+12 points of implied probability); our legs gained 13 to 16 points from it on rushing and receiving yards. 11 tickets lost only on one-notch misses (6 in W8, 1 in W10) | 658 | **Real but small.** One notch lower is roughly fair on yardage, slightly better than fair on rushing. It matters for cashing 3-4 leg tickets, not for edge |
| 5 | Fading the public works | Public spread side (60%+ of bets): 46-44. At 70%+: 25-23. Money-vs-bets gap ≥ 10: money side 18-16. Our spread legs with the public 35-28, against it 24-21 | 134 games | **No signal either way.** Stop spending capture and reasoning on splits |
| 6 | Totals in wind or weather | Windy games (25+ km/h or gusts 40+): 2 games, both went over. Breezy (15-25): unders 4-2, average 8.3 points under the close. Our Unders in calm or indoor games: **5-14**; in breezy games 4-3. All total Unders 23-34 (40%) | 68 games | **Not enough windy games to test.** The real finding: Unders without a weather reason lose |
| 7 | QB INT is real | 36-20 (64%) unique; 67% in W10, 61% W1-4, 67% W5-9. League base rate for QBs with 15+ attempts: 54%. P(36 of 56 at the league rate) = 7%. Priced legs: 9-7 at a 55% break-even (+0.6u) | 56 | **Probably real selection skill, not yet proven as profit.** Andy picks QBs who throw picks 10 points more often than average, but only 16 legs have a recorded price |

## 4. Construction

**Leg count.** Cash tickets, no round robins:

| Legs | Tickets | Won | Leg rate | Cash rate | Expected if legs were independent | One leg short |
|---|---|---|---|---|---|---|
| 2 | 24 | 5 | 46% | 21% | 22% | 58% |
| 3 | 18 | 0 | 29% | 0% | 3% | 39% |
| 4 | 21 | 4 | 59% | 19% | 12% | 24% |
| 5-6 | 109 | 3 | 51% | 2.8% | 2.4% | 17% |
| 7-8 | 82 | 0 | 52% | 0% | 0.6% | 7% |
| 9+ | 10 | 1 | 59% | 10% | 0.6% | 10% |

At 57% a leg: 3 legs 18.5%, 4 legs 10.6%, 5 legs 6.0%, 6 legs 3.4%, 7 legs 2.0%, 8 legs 1.1%. 201 of 274 cash tickets had 5 or more legs. The 3-leg row is the first-TD and 2+ TD packs.

**Overlap (P3).** W10: 64% of legs on more than one ticket, one cluster of 31 tickets. MNF: Henry on 5 tickets; he scored twice on 10 carries for 10 yards, so every TD leg won and every yardage leg lost. One ticket lost on Henry legs alone; the others also missed elsewhere.

**DKP combo pricing.** 84 DKP tickets. There is no cap: the largest payout was 480.6x (W7 8-pick), W10's largest 132.2x.

| Shape | Tickets | Median payout | Per-leg price (decimal) | Won |
|---|---|---|---|---|
| Single game, 4 legs | 5 | 9.4x | 1.75 | 1 |
| Single game, 5-6 legs | 26 | 29.2x | 1.81 | 1 |
| Single game, 7-8 legs | 14 | 62.3x | 1.69 | 0 |
| Multi game, 5-6 legs | 11 | 28.7x | 1.85 | 2 |
| Multi game, 7-8 legs | 12 | 58.7x | 1.71 | 0 |

Against the product of the legs' own single prices (W10, same-day feed, 4 tickets fully priced; directional): DKP paid 72% to 95% of the independent product, including boosts. Tickets with two defensive legs from one team priced at 1.69 a leg against 1.77 for other single-game tickets (2 tickets). DKP's displayed probability matches its price within half a point on all 12 tickets checked: the "probability" is just the price. The feed cannot price QB INT, FG or reception milestones, so this map stays thin until that is fixed (pipeline audit, fix 2).

**Round robins.** 2-team RRs: 12 tickets, 5 won, -$21.23 on $250.95 (break-even). 4-team master RRs: 6 tickets, 1 won, -$368.95 on $630.

**Island tiers vs their own odds bands.** 86 Island tickets; only 9 carry a tier label, so the tier template is not what gets placed. By price instead:

| Price band | Tickets | Won | Expected at the price | Net | Leg rate |
|---|---|---|---|---|---|
| under +400 (n < 20) | 2 | 1 | 0.5 | +$6.94 | 86% |
| +400 to +1500 (n < 20) | 13 | 3 | 1.3 | **+$307.36** | 68% |
| +1500 to +5000 | 26 | 0 | 1.0 | -$220.72 | 55% |
| +5000 and up | 45 | 0 | 0.5 | -$287.18 | 50% |

71 of 86 Island tickets were priced past +1500 and none cashed. The Tier 1 band is the only one that has paid.

**Alejandro "core split" backtest (W5-10).** Walk-forward: for each week, categories at 57%+ on 20+ legs through the prior week; pool = that week's placed legs in those categories; 20,000 random combos from 3+ games; payout = product of leg prices (unpriced legs assumed -125), no correlation and no SGP haircut.

| Week | Categories in force | Pool (hit rate) | 3-leg cash rate | 4-leg cash rate |
|---|---|---|---|---|
| 5 | passing TDs, QB INT, tackles, rushing yds | 21 (52%) | 5% | 3% |
| 6 (n < 20) | passing TDs, tackles | 7 (43%) | 4% | 0% |
| 7 (n < 20) | tackles, passing TDs | 17 (59%) | 11% | 6% |
| 8 | passing TDs, tackles, carries, QB INT | 34 (68%) | 30% | 19% |
| 9 (n < 20) | QB INT, carries, tackles, passing TDs | 16 (75%) | 33% | 25% |
| 10 | carries, QB INT, passing TDs, tackles, receptions | 58 (64%) | 22% | 15% |
| **Average** | | | **17.6%** at about +470 | **11.2%** at about +900 |

Average return: 3-leg +0.6%, 4-leg +15%, with three losing weeks then three winning ones. That is break-even within noise, against the actual splits' 1 cash in 27 tickets at 5.8 legs. **The core split does not create an edge; it turns a 4% ticket into an 18% ticket at the same expected value.** Worth doing for that reason, at +300 to +600.

## 5. Calibration of the synthesizer itself

**Tiers** (W7, W8, W10; 449 graded; no A-tier pick has been graded):

| Tier | Record | Hit rate | Avg break-even | Units | Read |
|---|---|---|---|---|---|
| B | 41-46 | 47% | 52.5% | -8.8 | below its price |
| C | 117-216 | 35% | 37% | -28.3 | below its price; first TD alone is 11-82 (-17.3u) |
| PASS (graded as if played) | 9-20 | 31% | 52% | -11.8 | **the passes were right** |
| B sides/totals (n < 20) | 8-7 | 53% | 51.5% | +0.5 | |
| B props | 25-26 | 49% | 54% | -4.5 | |
| C TD scorers | 53-143 | 27% | 26% | -12.8 | fair-priced lottery legs |
| "Standalone preferred" flag | 38-45 | 46% | 43% | **+7.8** | the flag carries information |
| "Parlay leg only" flag | 89-172 | 34% | 41% | -55.3 | |

The tiers rank correctly (B > C > PASS) and W10 was the best week (B 4-1, C 16-13), but a tier does not tell you whether the price is beaten. The "standalone preferred" flag does.

**Probabilities** (78 graded with a `model_prob`):

| Stated probability | n | Average stated | Hit rate |
|---|---|---|---|
| under 45% (n < 20) | 4 | 37% | 50% |
| 50-55% | 61 | 52.8% | **47.5%** |
| 55-60% (n < 20) | 10 | 56.5% | 60% |

Brier 0.2516 against 0.2500 for a coin flip and 0.2520 for the price-implied probability. By week: W7 0.256, W8 0.262, W10 0.243. Picks where the stated probability beat the price went 28-29. **The probabilities do not separate winners from losers yet**; almost all of them are the simulator's 51-55% on sides and totals. Only 7 tickets before W10 and 8 of 41 in W10 carry any estimate.

**Proposed recalibration**
1. Replace A/B/C with two numbers on every recommendation: `edge_pts` (sides/totals) or `edge_prob` (props: stated probability minus the no-vig price), and a `basis` code from a fixed list (model, usage, matchup, news, expert, market). No number, no recommendation.
2. Shrink every stated probability halfway to the no-vig market price until 200 graded picks show a Brier score below the market's. In practice: a 55% claim against a 51% market becomes 53%.
3. Publish thresholds, not tiers: sides/totals play at edge ≥ 2 points; props play at edge ≥ 4 points of probability; anything else is listed as a lean and never used as a cash parlay leg.
4. First TD, 2+ TD and WR/TE anytime TD are never tiered. They go in a separate "lottery (promo only)" list.
5. Tuesday post-mortem prints the reliability table above for the season to date; the rule in 2 is lifted or tightened from that table, not by feel.

## 6. Recommendations for Weeks 11-18

Ranked by expected value to pick accuracy. "Effect" is the expected change in the relevant hit rate or cash rate. Confidence reflects sample size and whether the finding survived W10 out of sample.

| # | Change | Evidence (n) | Audits | Expected effect | Confidence | Type |
|---|---|---|---|---|---|---|
| 1 | **Cash tickets: 4 legs maximum; 5-6 legs only on DKP; 7+ promo only** (tightens R9-1) | 5+ leg cash tickets 4 of 198; 7+ without the one hit 0 of 101, -$1,143; W10 7+ went 0 of 15 with legs at 62% (274 tickets) | A2, A3, A5 | ticket cash rate from about 3% to 10-18% at 57% legs | **High** | card construction |
| 2 | **Sides/totals need a fair-line edge of 2+ points** to be a straight bet or a cash parlay leg; 1-2 points is a lean | edge 2+ 24-13; below 2, 34-39 (95 recs); fair lines 14-5 ATS at edge ≥ 0.5 over 2 weeks | A5, A6 | sides/totals from about 50% to 58-62% | Medium | synthesis rule |
| 3 | **Props: Unders first.** An Over needs a named volume reason and may not be a receiving-yard Over at 70+ | recs: Overs 41-64, Unders 29-16 (150); W9 screen Overs 91-130, Unders 86-70 (377); placed prop Unders 14-8 | A5 | prop recommendations from 39% to 50%+ | Medium-high | synthesis rule, model input |
| 4 | **Build cash tickets from the "core four": QB INT, passing TDs, receptions, tackles** (3-4 legs, +300 to +600), including the Alejandro split | all four at 60-65% on 56-201 legs; 36-18 in W10 out of sample; backtest cash rate 18% (3-leg) | A3, A5 | Alejandro split cash rate from 4% to about 15-18%, at break-even EV | Medium | card construction |
| 5 | **Enforce overlap at build time**: `check_overlap.py` blocks a 3rd ticket on one player (any stat) or one game total; the card shows the block | W10: 64% of legs shared, 31-ticket cluster, Henry on 5 tickets (223 legs) | A1 | fewer all-or-nothing Sundays; no hit-rate change | **High** | card construction |
| 6 | **Expert spreads, best bets, Action Network, Ross Tucker, VSiN: out of pick weighting.** Expert totals drop from tiebreaker to flag | spreads -48.5u (441), interval excludes zero; W10 27-35; totals W10 6-11; expert-only recs 10-19 | A5 | removes a 42-47% input from sides | **High** | source weights |
| 7 | **WR/TE anytime TD, first TD, 2+ TD: promo tickets only.** RB anytime TD (lead or committee) stays allowed under +350 | WR/TE ATD 57-99 (156); RB ATD 59-46 (105); first TD 2-19; recs citing a market reference 7-26 | A5 | cash-leg ATD rate from 45% to about 56% | Medium-high | synthesis rule, card construction |
| 8 | **Replace tiers with edge + basis code; shrink probabilities halfway to the market** (section 5) | Brier 0.252 vs 0.250 (78); tiers below their price (449) | A2 | calibration becomes measurable; no immediate hit-rate change | High (that it is needed) | synthesis rule |
| 9 | **Island: Tier 1 band only for cash (+400 to +1500, 4-5 legs).** Tiers 2-3 promo | +400 to +1500: 3 of 13, +$307; past +1500: 0 of 71, -$508 | A2, A5 | Island cash rate from 5% to about 15-20% | Medium (13 tickets) | card construction |
| 10 | **Total Unders need a stated reason** (wind 15+ km/h, a fair-total edge of 2+, or a QB downgrade). No "public is on the Over" Unders | Unders 23-34; in calm/indoor games 5-14; public total side 40-34 | A5 | total Unders from 40% toward 50% | Medium | synthesis rule |
| 11 | **Stop buying points on parlay legs** unless it crosses 3 or 7 | 188 bought/alt legs: 78-76, no better than main lines (93 legs, +0.12 CLV) | A4 | better parlay prices at the same hit rate | Medium | card construction |
| 12 | **Yardage milestones: take one notch lower on rushing legs when the ticket has 3-4 legs**; leave receiving yards and long tickets alone | rushing 60% to 76% one notch lower for 22% of the price (80 legs) | A5 | rushing legs +16 points of hit rate at a fair price | Low-medium | card construction |
| 13 | **Drop splits and "public fade" as a reason; cut the capture to twice on game days** | public side 46-44; our with/against 35-28 vs 24-21 (134 games) | A5 | none on accuracy; less noise in the reasons | High | capture, source weights |
| 14 | **Fix the capture gaps that block measurement**: DKP feed QB INT/FG/reception rows; leg prices on DKP tickets; Saturday refresh of article review and props intel; closing-line step on Tuesday | 163 of 232 W10 legs unpriced; 11 of 24 DKP tickets partly unpriceable | A2, A4, A6 | enables every calibration above | High | capture |
| 15 | **Keep C5 (no master RRs), P1, P2 as approved** | master RR 1 of 6, -$369; 2-leg -$362; BEO 0 of 116 | A5 | — | High | card construction |

Not recommended: any rule about defenders on big favorites (6 legs), committee backs (the data points the other way), or wind (2 games).

Decisions for Andy are listed as yes/no questions in the handoff.
