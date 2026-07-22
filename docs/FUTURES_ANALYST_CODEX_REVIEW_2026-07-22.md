# Futures Analyst Workflow - Codex Review Packet

_Prepared 2026-07-22 as feedback for Claude after reviewing `docs/FUTURES_ANALYST_WORKFLOW_SUMMARY_2026-07-22.md` against the current NFL Dashboard implementation._

## Executive Verdict

The current Futures/Betting Analyst workflow is directionally strong and meaningfully improved from a simple "LLM writes picks" setup. The architecture now has the right backbone:

- A canonical data layer with source-stamped odds, schedule, roster, intel, and recommendation tables.
- A deterministic feature layer that computes market math before model reasoning.
- Compact evidence packets instead of raw data dumps.
- A three-stage offline Analyst Committee: Market + Football Analyst, independent Skeptic, and Risk/Portfolio Editor.
- Structured recommendation output with disconfirming factors, bet thresholds, evidence pointers, and timing logic.
- A durable `futures_recommendations` table for future backtesting.

This is ready for **candidate discovery and reviewable thesis generation**.

It is not yet ready to treat model-ranked output as fully reliable "edge confidence" until several code-owned validation and data-completeness gaps are closed.

## Highest-Priority Enhancements

### 0. Add a Playoff Scenario Portfolio Layer

Current risk: the workflow treats recommendations mostly as isolated futures or correlation clusters. It does not yet model the user's actual long-term portfolio strategy: building a set of high-odds playoff scenarios that can later become hedgeable option value.

The portfolio is not just "find the best futures." It should support a **scenario-book strategy**:

- Primary anchor plays, such as Bills and Packers.
- Long-odds exacta / Super Bowl matchup combinations involving teams with high deep-run probability, such as Lions, Rams, Ravens, Chiefs, and Eagles.
- Pocket bets that can be played against those long-odds tickets once playoff matchups are known.
- Ladder stacks where one bet funds or reduces the liability of the next bet.

Examples to explicitly model:

- Bears Over 9.5 wins + Bears to make playoffs + small Bears Super Bowl position. If the win total and playoff bets win, those proceeds partially or fully pay for the Super Bowl liability.
- Dolphins Over wins + Dolphins make playoffs + small Dolphins AFC ticket. Each successful leg lowers the effective remaining cost of the deeper futures position.
- Bills / Packers primary positions plus exact matchup coverage using likely deep-run teams, with later playoff hedge paths mapped before the tickets are placed.

Recommended fix: add a dedicated `portfolio_strategy` layer to the dossier and final report.

It should distinguish:

- `anchor_bet`: primary conviction play.
- `ladder_bet`: a bet whose win funds a deeper position.
- `coverage_bet`: high-odds ticket that covers a playoff path or matchup branch.
- `option_bet`: long-odds ticket bought mainly for later hedge value.
- `pocket_hedge`: future playoff bet reserved for use against an existing ticket.
- `dead_cost`: amount that remains unrecovered if earlier ladder legs fail.
- `funded_liability`: amount of a later futures ticket effectively paid for by prior wins.

The analyst should output not only "recommended bets," but also **scenario maps**:

```json
{
  "strategy_type": "playoff_scenario_book",
  "anchor_positions": ["Bills Super Bowl", "Packers Super Bowl"],
  "coverage_positions": [
    "Bills vs Lions exact matchup",
    "Packers vs Ravens exact matchup"
  ],
  "ladder_stacks": [
    {
      "team": "Bears",
      "steps": [
        { "bet": "Over 9.5 wins", "role": "funding_leg" },
        { "bet": "Make playoffs", "role": "funding_leg" },
        { "bet": "Super Bowl", "role": "option_bet" }
      ],
      "intent": "Use wins from earlier legs to reduce or eliminate Super Bowl ticket liability."
    }
  ],
  "playoff_hedge_plan": [
    {
      "trigger": "Anchor team reaches conference championship",
      "action": "Price hedge against opposing conference finalist",
      "reserved_bankroll": "from ladder winnings or preassigned pocket stake"
    }
  ]
}
```

The Risk/Portfolio Editor should evaluate:

- Maximum total exposure if all ladder legs fail.
- Effective cost basis if early legs win.
- Which tickets create real playoff hedge optionality.
- Whether exacta combinations cover enough plausible playoff paths.
- Whether the book is overconcentrated in one conference, division, or QB injury scenario.
- Whether a longshot has value as an option even if it is not the highest standalone EV bet.

This should become a first-class section in the report, separate from "Strongest math edge" or "Longshots." Suggested section name:

- `Scenario Book / Playoff Hedge Map`

### 1. Add a Code-Side Recommendation Validator

Current risk: `portfolio-synthesize.js` trusts model-provided fields such as `edge_type`, `edge_pct`, `book`, `price`, `model_fair_prob`, and `evidence_ids`.

Recommended fix: add a deterministic validation pass after Stage 3 and before rendering/persistence.

The validator should:

- Confirm the recommended `market`, `selection`, `book`, and `price` exist in the dossier.
- Confirm the book is placeable.
- Recompute implied probability and EV from `model_fair_prob` and `price`.
- Verify `edge_pct` matches the recomputed number within tolerance.
- Verify `evidence_ids` point to fields that actually exist in the relevant dossier row.
- Downgrade or kill `edge_type=math` if `value_gap`, `book_divergence`, or win-total math does not support it.
- Force `needs_human_review=true` when the thesis relies on model knowledge not present in the dossier.

Suggested implementation target:

- `agents/portfolio-synthesize.js`
- Add something like `validateRecommendation(candidate, dossier)`.
- Run it after `applyRiskEditor()` and before `rankByAxis()`.

### 2. Fix Win-Total Edge Math

Win totals are probably the most important futures market, but the current dossier gives the model:

- `consensus_line`
- `line_spread`
- `over_prob_median`
- `best_over`
- `best_over_book`
- `best_under`
- `best_under_book`

It does **not** appear to compute a true code-owned fair probability or edge for both Over and Under.

Recommended fix:

- For each team win total, compute devigged Over and Under probabilities per book.
- Normalize around the same line where possible.
- Separate price edge from line edge:
  - Example: `Over 8.5 -105` is not directly comparable to `Over 9.5 +120`.
- Add:
  - `best_over_edge_pct`
  - `best_under_edge_pct`
  - `over_fair_prob`
  - `under_fair_prob`
  - `line_value_signal`
  - `line_consensus_confidence`
- Sort win-total rows by actual computed opportunity, not by missing `value_gap`.

Implementation target:

- `agents/portfolio-dossier.js`
- Current rows are built around `teamOut[tm] = { type: 'wins', ... }`.
- Current sorting uses `value_gap` / `book_divergence`, which does not work well for wins.

### 3. Add a Real Season Simulation Layer

The LLM should explain edge, not be the primary fair-probability engine.

Recommended fix: build a Monte Carlo season simulator that produces code-owned probabilities for:

- Win totals
- Division winners
- Playoff qualification
- Conference winner
- Super Bowl winner

Inputs should include:

- Market win totals as priors.
- Team EPA/rating inputs.
- Schedule, rest, travel, and division-game context.
- QB / roster / injury adjustments.
- Home-field and venue effects.
- Optional correlation assumptions for divisional outcomes.

Then the LLM receives:

- Market implied probability.
- Simulation probability.
- Difference between the two.
- Key drivers of the simulation output.

This would make "math edge" a real computed category rather than a model self-tag.

### 4. Persist Actual Futures Positions

The workflow now logs what the analyst recommends, but the user's actual futures positions still live primarily in browser `localStorage` under `nfl_futures_portfolio_v1`.

This limits:

- Offline portfolio risk analysis.
- Exposure/correlation checks.
- Backtesting proposed bets versus actual bets placed.
- Closed-position history.

Recommended fix:

- Add Supabase tables for:
  - `futures_positions`
  - `futures_hedges`
  - `futures_parlays`
- Sync local UI state to Supabase.
- Feed current open exposure into `portfolio-dossier.js`.
- Persist whether a recommendation was later accepted, ignored, superseded, or bet at a different price.

### 5. Make Injuries a First-Class Batch Signal

The repo already has an injury ingestion path:

- `supabase/migrations/016_player_injuries.sql`
- `agents/injury-ingest.js`
- `src/lib/supabase.js` has `getRecentPlayerInjuries()`

But the offline futures dossier does not appear to consume `player_injuries`.

Recommended fix:

- Add `fetchInjuryContext()` to `portfolio-dossier.js`.
- Roll injuries up by team and position group.
- Highlight QB, OL, CB, EDGE, WR1/RB1/TE1, and key defensive absences.
- Track:
  - `injury_count`
  - `key_position_flags`
  - `qb_status`
  - `ir_pup_nfi_count`
  - `freshness`
  - `reported_at`
  - `captured_at`
- Add a rule: any recommendation leaning on roster health must cite current injury data or set `needs_human_review=true`.

### 6. Fix Live Tool Season Leakage

Potential issue: some live Supabase helpers are season-sensitive in one table but not in the joined odds table.

Specific concern:

- `getStrengthOfSchedule({ season })` filters `games` by season, but its `futures_odds_snapshots` query for win totals does not appear to filter by season.
- `getFuturesOddsHistory(team, marketType, days)` does not include season filtering and returns raw rows rather than a best-price timeline.

Recommended fix:

- Add `season` filters to all futures odds history and SoS helper queries.
- Make `season` an explicit tool argument where needed.
- For odds movement, return:
  - opening best placeable price
  - current best placeable price
  - per-book movement
  - best-price movement
  - consensus movement
  - snapshot count

### 7. Improve Backtesting Logs

The new `futures_recommendations` table is a good start, but it has two limitations:

- `unique (run_date, key)` can overwrite multiple same-day runs.
- Passed/killed candidates are only retained in raw local artifacts, not queryable Supabase rows.

Recommended fix:

- Add a `run_id` UUID or timestamp.
- Create a `futures_recommendation_runs` table.
- Persist every candidate with:
  - `stage`
  - `candidate_status`: `stage1_candidate | skeptic_killed | risk_passed | final`
  - `kill_reason` / `pass_reason`
  - model names and raw confidence
- Keep final recommendations easy to query, but do not discard rejected candidates.

Why this matters:

- You need to learn whether the Skeptic is good.
- A killed longshot that later wins is extremely valuable feedback.
- A passed correlated play that later provided hedge value should inform portfolio logic.

### 8. Compute Real Portfolio Correlation

Current "low correlation" appears to rely heavily on whether the model populated `correlated_week1`.

That is too weak.

Recommended fix: build a deterministic correlation graph.

Correlation dimensions:

- Same team.
- Same division.
- Same conference.
- Same market nesting: division -> playoffs -> conference -> Super Bowl.
- Mutually exclusive division winners.
- Shared QB/coach injury or personnel driver.
- Same Week 1 catalyst.
- Same macro thesis, such as "NFC North undervalued" or "AFC West favorite fade."

Then expose:

- `portfolio_correlation_score`
- `cluster_id`
- `cluster_exposure`
- `mutual_exclusion_flags`
- `recommended_max_stake_tier`

The LLM can explain correlation, but code should detect the obvious structure.

### 9. Make Model Independence Real

Currently Stage 2 and Stage 3 default to the first Stage 1 model unless flags override them.

Recommended fix:

- Default Stage 1 to the strongest reasoning model available.
- Default Stage 2 Skeptic to a different provider/model when possible.
- Default Stage 3 Risk/Editor to either:
  - a cheaper model plus code validation, or
  - the same high-end model only when the portfolio is small.

Ideal routing:

- Stage 1: high-end frontier reasoning model.
- Stage 2: different-model adversarial review.
- Stage 3: risk model + deterministic validator.
- Optional Stage 4: cheap formatting/editor pass only after all code checks pass.

### 10. Expand Missing Intel Classes

The current workflow has strong market, schedule, roster, EPA, and expert-signal coverage. Additional intel that could materially affect futures results:

- Current injury status and return timelines.
- Suspensions and off-field availability.
- Depth chart quality by position group.
- Offensive line continuity.
- Defensive coordinator / offensive coordinator changes.
- Play-caller changes.
- Coach tendencies already derived in `scripts/derive_coach_tendencies.py`, but they do not appear first-class in the futures dossier.
- Weather/venue risk for late-season outdoor games.
- Transaction/news feed freshness.
- Expert source reliability scoring based on historical CLV/ROI.
- Duplicate-take clustering so one popular narrative does not count as five independent signals.
- Book liquidity/limit quality, not just whether the book is placeable.
- Price availability check immediately before finalizing a recommendation.

## Specific Gotchas Found

### Award Markets May Not Be Properly Devigged

The workflow summary says awards are in scope, but `portfolio-dossier.js` has a hardcoded `MULTIWAY` set that includes Super Bowl, conference, division, most/least wins, and matchup markets. It does not appear to include `award_*` markets.

If award odds enter `futures_odds_snapshots`, they may be treated like single-outcome markets unless the multi-way detection logic is expanded.

Recommended fix:

- Treat any `market_type` beginning with `award_` as multi-way.
- Or replace hardcoded `MULTIWAY` with a market metadata map.

### Roster Churn Is Useful But Too Blunt

Current roster churn counts adds/drops/status changes. That is a good instability signal, but it does not know whether the churn was:

- QB1
- backup linebacker
- practice squad move
- short-term injury
- transaction upgrade
- roster cut

Recommended fix:

- Add positional weighting.
- Include player names for high-impact positions.
- Cross-check churn against `player_injuries`.
- Treat positive churn separately from negative churn.

### Evidence IDs Are Pointers, Not Proof

The current `evidence_ids` concept is useful, but it is not true lineage. The model can cite `analytics.off_epa_rank` even if the actual claim was stronger than the data supports.

Recommended fix:

- Add a resolver that renders the exact evidence values next to the recommendation.
- Example:
  - `analytics.off_epa_rank = 6`
  - `sos.market_rank = 28`
  - `lean.samples[0] = Warren Sharp, back, strength 0.8`
- If an evidence ID cannot be resolved, mark the recommendation for review.

## Suggested Implementation Order

1. Add the playoff scenario portfolio layer.
2. Add post-committee validator.
3. Fix win-total fair probability and edge math.
4. Add `run_id` and persist passed/killed candidates.
5. Add injury context to the batch dossier.
6. Persist actual futures positions to Supabase.
7. Fix season filtering in live futures/SOS helpers.
8. Add deterministic correlation graph.
9. Add award-market multi-way devig support.
10. Add a basic season simulator.
11. Add source-quality and expert-performance weighting.

## Recommended Near-Term Definition Of Done

Before treating a recommendation as a real bet candidate, it should pass:

- Role in the portfolio is clear: anchor, ladder, coverage, option, hedge, or standalone.
- Scenario-book exposure and funded-liability math are shown when relevant.
- Price exists in the current dossier.
- Book is placeable.
- Edge math recomputes correctly.
- Evidence IDs resolve to actual fields and values.
- Injuries/roster claims are supported by current data or flagged.
- Correlation with existing positions is computed, not just narrated.
- Bet threshold is numeric and testable.
- Recommendation is persisted with a unique run ID.
- If the recommendation is passed or killed, that decision is persisted too.

## Final Assessment

Claude's workflow is good enough to start generating interesting futures candidates. The next step is to make the system harder to fool:

- Code owns math.
- Code owns validation.
- Code owns correlation.
- Code owns persistence.
- LLMs own synthesis, skepticism, explanation, and creative hypothesis generation.

That separation is the path from a clever analyst report to a genuinely useful betting-intelligence system.
