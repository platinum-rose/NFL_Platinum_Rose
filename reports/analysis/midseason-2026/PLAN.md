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
