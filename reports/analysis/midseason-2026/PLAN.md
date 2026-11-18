# Mid-season post-mortem 2026 (Weeks 1-9): plan

Started Wed 11/11 ~1:15 PM PT by Claude Team 2. Due **Sat 11/14** so findings feed the Week 10 Sunday card. Scope (Andy, 11/11): Weeks 1-9, gaps flagged as low-confidence; deliverable = ranked scorecard **plus proposed weight/rule changes for Weeks 11-18**, applied only after Andy's OK.
Question to answer: **which data sources, models and proposal types actually predicted outcomes, so we can lean on them and cut the rest.**

## What gets scored (one row per pick, graded against cached ESPN finals/box scores)
| Layer | Sources on disk | Weeks | Notes |
|---|---|---|---|
| Podcast experts | `data/podcasts/youtube-extracted-picks-2026-wNN.json` | 3, 5-9 (W8-9 graded) | grade W3, W5-W7 with `scripts/master-intel/grade_podcast_picks.py`; W4 missing |
| Article experts | `reports/intel/expert-verification-2026-wNN.md`, `docs/article-intel-review/`, expert registry | 4-9 | verified picks need grading (new) |
| Grok X threads / bookmarks | `reports/intel/master-intel-narratives-*`, `.nfl/reports/twitter-bookmarks/` | 7-9 | grade where a pick is explicit |
| Master Intel / SuperContest pitches | `reports/intel/master-pitches-2026-wNN.json`, `supercontest-pitches-*` | 7-9 | what went to clients |
| Analytics models | fair lines `reports/intel/w08-model`, `w09-model`; W5-6 quantitative synthesis; EPA matchup model (`season-through-wNN.json`); prop hit-rate screen (`card-w09-screen.json`) | 5-9 | MAE vs market, ATS/total hit rate at the edge threshold, prop screen hit rate by grade |
| Simulator | `scripts/intel/margin-simulator.mjs` outputs in fair-lines files | 8-9 | calibration: predicted cover/over % vs results (Brier, reliability bins) |
| Prediction markets | `data/prediction-markets/` | 1-9 | Kalshi win % calibration vs results |
| AI proposals | `ai-proposals/2026-w09.json`, legacy `ai_recs_wN.py`, `w0N-*-proposals.json` | 5-9 | placed vs unplaced, by family |
| Paper tickets | `paper-wagers-2026.json` (92) | 2-10 | AI + Andy imaginary |
| Placed tickets | `user-placed-wagers-2026.json` (319) + weekly scorecards W5-9 | 1-9 | by family, legs, market, book, builder, rules |
| Pools | `data/pickem/*` | 1-9 | market strategy vs results, leverage flips |

## Metrics
- Hit rate with a 95% interval (Wilson) and sample size; **units at the stated price** (-110 only when none was given).
- Sides/totals: ATS and O/U record vs the closing line where we have it (closing-line value as the long-run signal).
- Models: MAE of projected margin/total vs result, hit rate when edge >= 1 / 2 / 3 points, Brier score and reliability for probabilities.
- Props: hit rate by market (ATD, yardage, receptions, tackles, QB props) and by rung (base vs alt ladder), so rule C3 gets tested.
- Small samples flagged (n < 20 = directional only).

## Steps
1. Inventory + normalize every pick into `reports/analysis/midseason-2026/picks.jsonl` (source, expert, week, game, market, selection, line, price, result).
2. Grade the ungraded layers (podcasts W3/W5-W7, article picks W4-W9, pitches, Grok).
3. Score models and the simulator (MAE, edge buckets, calibration).
4. Score proposals and placed/paper tickets (family, legs, market, builder, rule compliance).
5. **Independent check:** a separate agent re-grades a random 10% sample from the raw box scores without seeing our grades; disagreements get adjudicated.
6. Report (`reports/analysis/midseason-2026/midseason-postmortem.md` + HTML, copy in the DEV project) with a ranked source table and **proposed changes for Weeks 11-18** (source weights, which experts to drop, model weights, rule changes). Andy approves before anything changes.

## Model audit (added Fri 11/13, from Rusty Bill's 8-prompt model-audit thread, x.com/Rusty_Bill/status/2120266980137767335)
Goal: check that the headline numbers survive realistic prices, correlated bets and rule changes before any W11-18 change rests on them.
| # | Audit | What we run | Data |
|---|---|---|---|
| A1 | Correlation clusters | group placed tickets that share a leg (same player + stat family, or same game/side); recount W/L and net by cluster; flag cards with shared legs at build time | `tickets.jsonl` legs |
| A2 | Calibration of Claude's estimates | parse pre-bet probability estimates from ledger notes ("Est. P(all) ~6-7%", "fair ~+770 (11.5%)"); bucket vs results; Brier; implied-price vs estimate | ledger `progress_notes` |
| A3 | Rule/version stamps | date each rule (R9-1, C2-C5, leg floor, analytics-first) and model (W8 synthesis, W9/W10 fair lines); split results into made-under-the-rule vs scored-retroactively | handoffs, card files |
| A4 | EV/CLV at the price taken | per ticket: price at placement vs DK close (`game_odds_snapshots`) for single-game sides/totals; derived DKP odds count as taken price | ledger, odds snapshots |
| A5 | Bootstrap intervals | resample tickets (by cluster, so correlated legs move together) for W1-4 vs W5-9 net, family nets, and source unit totals; report 90% intervals; mark "not distinguishable from zero" | `tickets.jsonl`, `expert_grades.jsonl` |
| A6 | Leakage check | confirm weekly fair-lines inputs (FTN capture, injuries, line snapshot) predate the proposal time; podcast picks graded at the spoken line | file mtimes, staging timestamps |
Proposals for W11-18 must cite which audits they passed.
