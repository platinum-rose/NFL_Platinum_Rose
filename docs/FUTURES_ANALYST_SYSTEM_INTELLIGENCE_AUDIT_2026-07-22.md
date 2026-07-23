# NFL Futures Analyst System Intelligence Audit

Date: 2026-07-22
Repo: `E:\dev\projects\NFL_Dashboard`

## Executive Verdict

The system is already a useful **research and candidate-discovery assistant**. It has broad data access, a sensible analyst/skeptic/risk role split, code-owned price resolution, visible counterarguments, durable artifacts, and a good offline scenario corpus.

It is **not yet a risk-worthy recommendation engine**.

The offline corpus proves that curated analyst JSON can travel through the portfolio builder, resolve known dossier legs, quarantine fabricated exactas, calculate the current unit-based summaries, and render a report. It does not prove that the dossier is internally correct, that the model can estimate true probabilities, that the committee can detect unsupported football claims, or that the resulting portfolio improves Andy's payoff distribution.

The current trust level should be:

| Use | Current verdict |
|---|---|
| Market exploration and idea generation | Yes |
| Summarizing odds, intel, and possible narratives | Yes, with source/date checks |
| Producing a watch list for human research | Yes |
| Calling something a positive-EV bet | No |
| Assigning real dollar stakes | No |
| Treating the scenario book as an actual hedge plan | No |
| Running autonomously or placing bets | No |

The practical conclusion is: **do not use a fresh live LLM run as a betting decision yet.** Fix the upstream P0 issues first. A frontier model cannot recover fields it was never given, reliably detect malformed market rows hidden inside a large dossier, or calibrate probabilities that the system has never measured.

## System Scorecard

| Dimension | Grade | Why |
|---|---:|---|
| Data breadth | B | Odds, schedules, prior performance, EPA, injuries, rosters, expert intel, and line history exist. |
| Data canonicalization | D | The live dossier mixes canonical team rows with side-labeled team rows for wins and playoffs. |
| Price freshness and lineage | D | Snapshot timestamps are fetched but removed from the model-facing dossier; no maximum-age rule protects best price. |
| Market math | C- | Multiway outright handling is useful, but binary playoff devig, win-total propagation, and exact-position pricing are not trustworthy end to end. |
| Independent forecasting intelligence | D | There is no calibrated team-strength or season simulation model in production. The LLM invents `model_fair_prob`. |
| Analyst committee design | B- | The roles are good, but the Skeptic lacks exact evidence and defaults to the same model as Stage 1. |
| Code validation | C | Price and selection checks catch some fabrication, but they validate arithmetic around an unvalidated fair probability. |
| Scenario-book logic | C- | Good taxonomy and leg resolution; no joint scenario probabilities, terminal payoff map, or real hedge optimizer. |
| Personalization | D | The batch pipeline knows only primary team names. It does not load Andy's tickets, bankroll, caps, units, or open parlays. |
| Offline QA | C+ | Five useful downstream fixtures pass, but upstream dossier, forecasting, and economic-semantic tests are missing. |
| Calibration/backtesting | F | Recommendation logging exists, but no evidence yet shows confidence, fair probabilities, or stake tiers predict outcomes or CLV. |

## Evidence Reviewed

This audit inspected the implementation and current local artifacts, not only the workflow summary:

- `agents/portfolio-dossier.js`
- `agents/portfolio-synthesize.js`
- `agents/signal-normalize.js`
- `src/components/agent/FuturesAgentChat.jsx`
- `src/lib/futures.js`
- `scripts/seed-futures-odds-0721.js`
- `scripts/run-portfolio-corpus.js`
- `.nfl/portfolio/dossier-2026-07-22.json`
- `.nfl/portfolio/portfolio-2026-07-22.md`
- all five `tests/fixtures/portfolio-corpus/*.json` scenarios
- `data/futures-imports/open-parlays-2026.json`
- `docs/FuturesPortfolioStrategy.md`
- `docs/spec-win-dist-and-coherence-sim.md`

No live model call, wager, parlay-slot change, or Supabase write was performed.

## What Is Genuinely Strong

Several architectural choices are worth preserving.

1. **Code resolves prices and selections.** `validateRecommendation()`, `resolveLegAgainstDossier()`, and the strict exact-matchup resolver materially reduce hallucinated tickets.
2. **Rejected ideas remain visible.** Skeptic kills, Risk/Editor passes, validator invalidations, and unresolved scenario legs are retained instead of disappearing.
3. **The committee has distinct jobs.** Separating market/football synthesis, skepticism, and portfolio editing is directionally right.
4. **Evidence pointers are rendered with values when they resolve.** This is better than unsupported prose, even though semantic claim checking is still missing.
5. **The corpus exercises real CLI control flow.** It stubs model calls while running the real synthesis script with `--no-persist` and non-canonical output suffixes.
6. **The scenario taxonomy matches Andy's actual style.** Anchors, coverage, options, ladders, pocket hedges, dead cost, and funded liability are the right vocabulary.
7. **A strong forecasting specification already exists.** `docs/spec-win-dist-and-coherence-sim.md` correctly identifies the need for matched-line win distributions and a schedule-based coherence simulation. It is proposed, not implemented.

These are the bones of a strong system. The problem is that the intelligence layer is currently built on data contracts that are not yet reliable enough.

## Critical Finding 1: The Live Dossier Has Mixed Market Schemas

The July 22 dossier contains 5,146 snapshots across six books and 17 market types, but the model-facing rows expose a serious normalization problem:

| Market | Rows in `synthesis_input` | Expected canonical shape | Actual shape |
|---|---:|---|---|
| Wins | 96 | 32 team rows with line, over, and under | 32 team rows plus 64 separate `Team Over X.5` / `Team Under X.5` rows |
| Playoffs | 96 | 32 team rows with Yes and No sides | 32 team rows plus 64 separate `Team Yes` / `Team No` rows |
| Exact division position | 128 | 32 teams x 4 outcomes | 128 single-book rows, but without correct outcome-group devig |

The source is visible in `scripts/seed-futures-odds-0721.js`: the July 21 seed writes the side label into both `team` and `selection`. `portfolio-dossier.js` then groups by `r.team || r.selection`, so the newer side-specific rows do not merge with the older canonical team rows.

Consequences:

- The model sees duplicate representations of the same underlying market.
- A stale canonical BetOnline row can remain in the three-book team row while the newest BetOnline quote lives in a separate side-labeled row.
- Strength of Schedule can be fed by the older canonical win-total representation.
- Price comparisons can mix snapshots produced under incompatible ingestion contracts.
- The corpus does not catch this because its dossiers are hand-curated into the desired shape.

This alone is a blocker for trusting a live analyst run.

## Critical Finding 2: Win-Total Fair Fields Are Computed, Then Omitted

`buildOddsView()` computes:

- `over_fair_prob`
- `under_fair_prob`
- `best_over_edge_pct`
- `best_under_edge_pct`
- `line_consensus_confidence`
- `line_value_signal`

But `buildSynthesisInput()` only forwards the consensus line, raw over implied-probability median, best prices/books, per-book rows, and lean. The prompt explicitly tells the model that the missing fair/edge fields are present, but they are not.

That caused concrete false edges in the recovered July 22 live Markdown report:

### Giants Over 7.5

- Reported: `+3.23%` edge at `-103`.
- The report's number is exactly what results from using raw `over_prob_median = 0.5238`, which includes vig.
- Same-line cross-book fair probability in the dossier detail is about `0.4899`.
- EV at `-103` using `0.4899` is about **-3.45%**, not +3.23%.

### Bears Over 9.5

- Reported: `+11.50%` edge at `+123`.
- That number uses raw `over_prob_median = 0.5000`.
- Same-line cross-book fair probability is about `0.4694`, producing about **+4.68%** EV.
- Bookmaker's own devigged pair gives `0.4354`, producing about **-2.91%** EV.

The validator recomputed the arithmetic from the model's `model_fair_prob`; it did not validate whether that probability was fair. The arithmetic was correct around the wrong probability.

This is the most important lesson in the audit: **code-owned arithmetic is not yet code-owned forecasting.**

## Critical Finding 3: Several Markets Are Not Properly Devigged

The prompt describes model-facing probabilities as vig-stripped. That is not true for every market.

### Playoffs

Playoffs are binary per team, but `playoffs` is not treated as a paired Yes/No market. The canonical Saints row uses raw implied probabilities as `fair`:

- Saints Yes at `+170` has raw implied probability `0.3704`.
- Saints No at `-210` has raw implied probability `0.6774`.
- Devigging that pair gives Saints Yes about `0.3535`.
- At Bookmaker `+200`, that produces about `+6.04%` EV, not the report's `+11.12%`.

The Saints may still be an interesting outlier. The point is that the confidence and edge magnitude are overstated by the current contract.

### Exact Division Position

The 128 BetOnline rows are treated as individual single outcomes. Each team's four finishing positions are mutually exclusive and should be grouped and devigged together. The current `fair_prob` simply equals raw implied probability.

### Thin Markets

All 256 exact Super Bowl matchups, 32 most-wins rows, 32 least-wins rows, and 128 exact-position rows are single-book in the current dossier. A one-book normalized price is market context, not evidence of independent value.

## Critical Finding 4: There Is No Independent Probability Model

The dossier's `fair_prob` is mostly a transformed market consensus. That is useful for finding book outliers, but it is not an independent estimate of the event's true probability.

The Stage 1 model supplies `model_fair_prob` with no deterministic model, calibration history, decomposition, or uncertainty interval. The validator confirms that:

`edge_pct = model_fair_prob x decimal_payout - 1`

It does not establish that `model_fair_prob` is credible.

The proposed modules from `docs/spec-win-dist-and-coherence-sim.md` do not exist:

- `agents/lib/win-dist.js`
- `agents/portfolio-simulate.js`
- `agents/lib/board-validate.js`

Until a coherent forecast engine exists, the LLM should not be allowed to create a fair probability from prose. It should explain or challenge a probability produced by code.

## Critical Finding 5: Freshness Is Not Enforced

`fetchSnapshots()` retrieves `snapshot_time`, but `buildOddsView()` removes the timestamp from the per-book row and the model-facing dossier. The system keeps the latest row **available in the query window**, not necessarily a currently available quote.

There is no hard gate for:

- quote age;
- last successful ingest by book and market;
- stale-book exclusion;
- synchronized comparison timestamps;
- a final price re-check before a recommendation is published.

The normalized signal file used by the July 22 dossier was generated on July 16. Source capture dates are not carried into the compact evidence packets. Some anchor-team injury records were several weeks old, but no age threshold downgraded them.

The correct contract is `price + book + line/side + observed_at + max_age + availability_status`, not just `price + book`.

## Critical Finding 6: Football Context Is Temporally Misdescribed

The prompt calls `analytics` current-season EPA/play. In the preseason July 22 dossier, the latest analytics rows are from the **2025 season**. The row contains `season: 2025`, but the surrounding instruction encourages the model to treat it as current form.

This should be labeled `prior_season_baseline` before Week 1, then transition explicitly to `current_season` only after a minimum sample threshold.

Injuries also need starter/depth weighting. The current team rollup sets `qb_status` from any QB row. A questionable backup quarterback can therefore become a team-level QB flag. The 49ers profile, for example, reports `qb_status: Questionable` from Mac Jones, not necessarily QB1 availability.

Other missing or weak football inputs that materially affect futures:

- QB1 probability distribution and backup quality;
- depth-chart rank and snap-weighted injury value;
- expected return dates, PUP/IR eligibility, suspensions, and holdouts;
- offensive-line continuity and projected starting five;
- coordinator, play-caller, and scheme changes;
- roster additions/losses weighted by position value;
- opponent rest differential, travel miles, time zones, and consecutive road games;
- camp/preseason depth-chart movement;
- team-level projection priors independent of sportsbook prices.

Current dossier coverage also shows zero teams with CLV, officiating, or roster-churn signals. Those features exist in code but add no intelligence to this particular run.

## Critical Finding 7: The Committee Is Less Independent Than It Appears

The three roles are useful, but their current information flow limits them.

1. Stage 2 and Stage 3 default to the first Stage 1 model. They are separate calls, but not model-independent by default.
2. The Skeptic receives `evidence_ids`, not the resolved evidence values, source dates, or dossier rows. It cannot truly determine whether a claim is supported.
3. Validation runs after Stage 3. The Risk/Editor reviews raw scenario structures that may later be invalidated, and its `scenario_review` can remain attached after those structures change.
4. `mergeStage1()` chooses the highest-confidence model's entire version as representative, then averages confidence. It does not ensemble fair probabilities or preserve disagreement intervals in the decision.
5. Stage 1 is told to produce at least 12-20 plays, maintain a mix, and avoid merely listing chalk. These instructions pressure the model to manufacture action. A risk-worthy analyst must be rewarded for returning **zero bets** when nothing clears the threshold.
6. `json_object` mode guarantees parseable JSON, not full schema conformance. Required fields and enums are not enforced with a strict JSON Schema.

Recommended committee flow:

1. Code creates a small set of mechanically valid candidates.
2. Stage 1 explains the market and football case; it does not invent prices or probabilities.
3. Code resolves every evidence item into exact values and dates.
4. Stage 2 receives the resolved evidence packet and attacks the claim blind to Stage 1 confidence.
5. Code applies forecast, correlation, bankroll, and positive-EV gates.
6. Stage 3 edits a portfolio that is already mathematically valid.
7. Code re-fetches price and availability immediately before the human sees `BET NOW`.

## Critical Finding 8: Ranking Can Promote Bad Bets

`rankByAxis()` sorts math and longshot candidates by `Math.abs(edge_pct)`. A large negative edge can rank as strongly as a positive edge. It also labels an item low-correlation when `correlated_week1` is empty, which is not a portfolio correlation calculation.

The recovered report kept Seattle NFC West at **-3.02%** edge as a value/thesis recommendation. A negative-EV standalone position should be rejected unless it is explicitly a hedge and improves portfolio utility after accounting for cost.

The ranking layer needs hard code gates:

- standalone `edge_lower_bound > 0`;
- current price still available;
- complete market/side/line match;
- no unresolved required evidence;
- confidence calibrated or hidden;
- hedge positions admitted only when terminal portfolio outcomes improve;
- no minimum number of plays.

## Critical Finding 9: The Scenario Book Is a Taxonomy, Not Yet a Hedge Engine

The new scenario book is useful for organizing ideas, but its current math is descriptive.

It does not calculate:

- joint probability that a basket leg becomes live;
- probability of at least one covered playoff path;
- expected portfolio return;
- probability of profit;
- worst-case loss or conditional value at risk;
- terminal payoff by playoff bracket state;
- marginal value of a new ticket versus the existing portfolio;
- optimal pocket-hedge size once a matchup is known.

Important conceptual distinctions should become first-class:

| Ticket type | What it really does |
|---|---|
| Bills vs Packers exacta | Cross-anchor correlation amplifier |
| Bills vs several NFC teams | Diversifies Bills' possible opponent; still loses if Bills fail |
| Packers vs several AFC teams | Diversifies Packers' possible opponent; still loses if Packers fail |
| Exactas containing neither Bills nor Packers | Actual anchor-failure coverage |
| Bears wins/playoffs/SB stack | Positive-correlated ladder; may create cash-flow funding, not diversification |
| Playoff opponent moneyline/spread | Potential state-contingent hedge once the bracket is known |

Calling all exacta baskets “variance insurance” is too broad. Most exactas containing an anchor amplify the anchor's path rather than insure an anchor miss.

The ladder also mixes two different strategies:

- **Prepositioned:** all tickets are bought now. Earlier wins offset later losses in final P/L, but do not fund tickets already purchased.
- **Strict sequential:** later tickets are bought only after earlier legs resolve. They can be funded by realized profit, but later odds are unknown and cannot be modeled at today's price.

Win total and make-playoffs legs often resolve at nearly the same time, so they may not form a useful cash-funding sequence. The scenario engine needs settlement timing and future-price assumptions.

## Critical Finding 10: Andy's Portfolio Is Not Actually Loaded

The batch pipeline's personalization is currently `--primary "Buffalo Bills,Green Bay Packers"`. That is only a list of team names.

Known real inputs are:

| Position/resource | Dollars | Futures units (`$20`) | Current interpretation |
|---|---:|---:|---|
| Bills vs Packers exacta at `+6500` | $100 | 5u | Anchor-correlation amplifier; $6,500 profit if it wins |
| Bills Super Bowl target cap | up to $200 | up to 10u | Anchor position; actual entries/blended odds not yet supplied |
| Packers Super Bowl target cap | up to $200 | up to 10u | Anchor position; actual entries/blended odds not yet supplied |
| Maximum planned primary exposure | $500 | 25u | Exacta plus both SB caps |
| Open-parlay sunk stake | $162.50 | 8.125u | Already spent; not new hedge reserve |
| Open-parlay displayed potential win | $3,327.12 | 166.356u | Placeholder/conditional value, based on assumed remaining-slot odds |

The batch model receives none of the dollar amounts, current stakes, blended prices, target caps, or reserve rules.

The live chat has a separate schema mismatch:

- `src/lib/futures.js` stores `type`, `odds`, `stake`, and `status`.
- `FuturesAgentChat.jsx` reads `market`, `odds_at_entry`, unit-formatted `stake`, and filters with `!closed_at`.
- The live prompt therefore can show unknown market/odds fields and can include settled positions as open.
- The manifest describes bankroll injection, but `FuturesAgentChat.jsx` does not load `nfl_bankroll_data_v1`.
- Open parlays are not included in the live context block.

A model cannot personalize around state it never receives correctly.

## Open Parlays: Treat as Unverified Contingent Assets

`data/futures-imports/open-parlays-2026.json` says the tickets are valid for about one year. Andy's later house-rule check says open parlays may only remain open for 90 days. Every ticket is already beyond 90 days from placement.

Until Bookmaker confirms the actual ticket state, the analyst should use:

```json
{
  "availability_status": "unverified_house_rule_conflict",
  "counts_as_required_hedge_reserve": false,
  "counts_as_guaranteed_payout_capacity": false
}
```

There is also a mechanical error in `docs/FuturesPortfolioStrategy.md`: it says that if one filled slot loses, the bettor still has the remaining open slot. `src/lib/futures.js` correctly marks the entire parlay `LOST` when any leg loses. A losing filled leg kills the ticket; unused slots on that ticket do not survive.

The displayed potential wins are conditional on assumed remaining-slot prices. They should not be treated as fixed assets. A proper ticket record needs the locked base multiplier, remaining slots, allowed markets, expiry/rule status, and payout formula as future legs are added.

## What the Offline Corpus Actually Proves

The five fixtures currently prove:

- mocked model output reaches the real CLI;
- strict exacta resolution works in either team order;
- fabricated exactas are quarantined;
- partially resolvable ladders remain visible;
- scenario fields and reports render;
- current unit summaries match fixture expectations.

They do not prove:

- live ingestion normalizes markets correctly;
- snapshot freshness;
- binary/multiway devig correctness;
- fair-probability quality;
- semantic evidence support;
- probability calibration;
- recommendation stability across runs/models;
- correlation or scenario coverage;
- dollar personalization;
- open-parlay availability;
- profitability or positive closing-line value.

The corpus should be kept, but renamed mentally as a **portfolio plumbing corpus**.

## Recommended Risk-Worthy Architecture

```text
Raw feeds
  -> canonical market normalizer
  -> freshness/coverage/lineage gate
  -> deterministic fair-probability and schedule simulation
  -> mechanically valid candidate generator (zero candidates allowed)
  -> LLM thesis analyst
  -> evidence resolver with exact values, dates, and sources
  -> independent skeptic
  -> deterministic correlation + terminal-payoff optimizer
  -> LLM risk editor
  -> live price/availability re-check
  -> human decision
```

The LLM's highest-value jobs are:

- connecting football mechanisms across heterogeneous evidence;
- generating creative but testable hypotheses;
- identifying disconfirming evidence;
- explaining scenario paths;
- identifying what new information would change the bet.

The LLM should not own:

- fair probabilities;
- EV arithmetic;
- market identity;
- quote freshness;
- correlation detection that code can infer;
- bankroll caps;
- terminal payoff math;
- ticket availability;
- the final decision to bet.

## Frontier Model Recommendation

The current OpenAI path uses Chat Completions, `gpt-4o`, `temperature: 0.4`, `json_object`, and no reasoning configuration. That is no longer the highest-quality configuration for this workload.

After the deterministic fixes, benchmark the current flagship reasoning model using the Responses API, strict Structured Outputs, and explicit reasoning effort. As of this audit, OpenAI documents GPT-5.6 Sol as its frontier model for complex professional work and recommends the Responses API for reasoning workflows. Pro mode or maximum reasoning should be tested only on the small, evidence-resolved final audit stage, not used to brute-force the full malformed dossier.

Official references:

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-5.6 Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

Recommended routing to evaluate:

| Stage | Suggested model role |
|---|---|
| Candidate extraction/formatting | Lower-cost structured model or code |
| Football thesis synthesis | Frontier reasoning model, high effort |
| Skeptic | Different provider/model family when practical; blind to original confidence |
| Portfolio optimization | Code first; model explains output |
| Final high-value audit | Frontier model, high/max effort or pro mode if evals justify cost |

Model upgrades should be judged by an eval set. A model name is not a trust certificate.

## Implementation Priorities

### P0 - Required Before Another Live Recommendation Run

1. Canonicalize wins/playoffs rows into one schema and quarantine legacy mixed-shape rows.
2. Add dossier conformance tests: exactly 32 canonical teams for wins/playoffs, explicit side fields, no side text in `team`.
3. Forward all computed win-total fair/edge fields into `synthesis_input`.
4. Devig playoff Yes/No pairs and exact-position outcome groups correctly.
5. Carry `observed_at`, source row identity, and quote age; reject stale best prices.
6. Validate win-total team + side + line + book + price, not just team + side + approximate price.
7. Reject negative-EV standalone recommendations and remove the minimum-play quota.
8. Re-run Risk/Editor only after current-price and scenario-leg validation.
9. Add a machine-readable user portfolio ledger and load it into batch synthesis.
10. Fix the live chat's futures-position schema mapping and load bankroll/open-parlay context.
11. Preserve all six open-parlay records as open/unverified, but exclude them from guaranteed planning capacity until the house-rule conflict is resolved.

### P1 - Required for Real Forecasting Intelligence

1. Implement the matched-line win-distribution model from `docs/spec-win-dist-and-coherence-sim.md`.
2. Implement the schedule Monte Carlo coherence model and conservation tests.
3. Produce uncertainty intervals; only surface edges whose lower bound clears zero and a market-specific margin.
4. Add a deterministic correlation graph and joint payoff matrix.
5. Convert scenario-book structures into terminal payoff tables by playoff state.
6. Separate exacta roles into amplifier, opponent coverage, and anchor-failure coverage.
7. Deduplicate intel by source episode/take and score source reliability using historical CLV/outcomes.
8. Send exact evidence values, dates, and source IDs to the Skeptic.
9. Replace free-text thresholds with numeric, machine-testable thresholds.
10. Add strict JSON Schema outputs and pinned model/version metadata to every run.

### P2 - Required Evaluation Infrastructure

1. Implement shadow mode with no wagering or production persistence.
2. Capture post-recommendation CLV at fixed horizons and at market close.
3. Backfill prior-season market snapshots where possible and implement Brier/log-loss scoring.
4. Add repeated-run and model-version stability measurement.
5. Add a no-Skeptic comparison arm so the Skeptic's incremental value is measurable.
6. Track abstention quality and preserve `NO BET` decisions as first-class results.
7. Implement full portfolio-distribution scoring: expected return, probability of profit, max loss, and downside tail.
8. Freeze a versioned benchmark suite, run manifest, scorer, and result-report format.

P2 builds the evaluation machinery and accumulates enough shadow observations to evaluate the system. Completing P2 does not itself authorize real-money use. The promotion benchmark below runs only after P0, P1, and P2 are complete.

## Post-P0-P2 Benchmark Protocol

This is the required release evaluation for deciding whether the analyst has demonstrated enough intelligence to generate risk-worthy recommendations. It is not a test of whether a report sounds persuasive, and it must not be run only on the examples used while building the system.

### 1. Preconditions

Do not start a promotion benchmark until all of the following are true:

- every P0, P1, and P2 item has an implementation reference and passing test;
- wins, playoffs, conference, division, awards, and exacta markets use canonical schemas;
- the dossier records source identity, quote timestamp, quote age, and a reproducible content hash;
- the probability model and portfolio simulator are versioned and pass conservation tests;
- strict output schemas and the final live-price re-check are enforced in code;
- Andy's units, position ledger, target caps, exactas, cash reserves, and ticket roles are loaded from a machine-readable snapshot;
- open parlays with unresolved house-rule status are present but have `eligible_as_required_hedge_resource: false`;
- benchmark mode cannot place bets, modify parlay slots, or write a canonical production report.

If any precondition fails, the result is `NOT READY TO BENCHMARK`, not a partial pass.

### 2. Freeze the Benchmark Package

Create a held-out, versioned package with these suites:

| Suite | Minimum contents | What it tests |
|---|---:|---|
| Contract and ingestion | Every supported market plus at least 50 malformed/stale/duplicate examples | Canonicalization, freshness, identity, devig grouping, quarantine |
| Forecast and market | At least 200 settled or closing-price observations when available | Calibration, log loss, Brier score, CLV, edge decay |
| Analyst semantics | At least 50 evidence-rich cases, including deliberate contradictions | Evidence support, football reasoning, uncertainty, disconfirmation |
| Portfolio and scenarios | At least 25 multi-position books | Correlation, exacta role, ladders, hedge maps, terminal payoff math |
| Adversarial and counterfactual | At least 25 cases | Fabricated prices, swapped teams, stale quotes, repeated-source consensus, prompt pressure to bet |
| Personalization | Andy's real ledger plus at least 10 boundary cases | Units, caps, reserves, sunk cost, open-parlay availability, incremental exposure |

Keep development fixtures separate from held-out evaluation cases. Record the package version and SHA-256 hashes in a manifest. Never silently replace a failed case; append a new suite version and retain the old result.

If the forecast suite cannot meet its minimum sample sizes, mechanical testing may continue, but the system remains in shadow mode with verdict `INSUFFICIENT OUT-OF-SAMPLE EVIDENCE`.

### 3. Comparison Arms

Run every eligible case through the same information cutoff and price snapshot:

| Arm | Purpose |
|---|---|
| A. Market baseline | No-vig market probability and deterministic portfolio rules; no LLM |
| B. Current-production baseline | Existing `gpt-4o` committee and prompts, while the model remains callable |
| C. Frontier standard | Current flagship reasoning model through Responses API with strict outputs and the selected normal/high effort |
| D. Frontier deep audit | Higher/max reasoning or pro mode only on the evidence-resolved final audit stage |
| E. Independent skeptic | Winning candidate arm with a different model family/provider for blind criticism |

Also run these ablations: no Skeptic, no expert commentary, no deterministic simulation, same-model Skeptic, and evidence with source reputation removed. Ablations show which components add measurable value instead of merely adding tokens.

The benchmark should select models through configuration. Do not hard-code a model name as permanent; preserve the exact provider, model slug or snapshot, API surface, reasoning settings, and prompt hash in each run.

### 4. Run Controls

For each run:

1. Freeze the dossier hash, benchmark-suite version, personalization snapshot, prompt version, code commit, probability-model version, and simulation seed.
2. Enforce the same information cutoff for every comparison arm. No arm may see results, closing prices, or later injury news unavailable at decision time.
3. Use strict JSON Schema outputs and reject schema repair that changes recommendation meaning.
4. Run stochastic LLM arms five times per semantic/portfolio case. Deterministic components run once per seed set.
5. Preserve candidate, Skeptic, Risk Editor, validator, price-recheck, and final decisions separately.
6. Record input/output tokens, cached tokens, latency, provider errors, retries, and estimated cost.
7. Disable database persistence and canonical report filenames. A benchmark is read-only except for its isolated result directory.
8. Score results with code. Human reviewers may grade semantic rubrics blind to model identity, but must not hand-correct model outputs before scoring.

### 5. Required Metrics

Report counts and confidence intervals, not just averages.

| Dimension | Required measures |
|---|---|
| Mechanical integrity | Schema pass rate; canonical-row count; stale, unavailable, fabricated, wrong-line, and wrong-book violations; probability/payoff conservation |
| Forecast quality | Brier score, log loss, calibration error and reliability buckets versus no-vig market baseline |
| Market value | CLV at 24 hours, 7 days, and close; median CLV; positive-CLV rate; edge decay; recommendation price still available rate |
| Selection quality | Accepted-bet precision; negative-EV violations; `NO BET` rate; performance of accepted versus rejected candidates |
| Committee lift | Candidate versus post-Skeptic and post-Risk scores; losers removed; winners incorrectly killed; net lift after cost |
| Stability | Core-pick Jaccard similarity, rank correlation, fair-probability standard deviation, and hard-gate agreement across repeats |
| Evidence quality | Evidence-ID resolution; exact-value/date support; contradiction detection; unsupported causal claims |
| Portfolio quality | Expected return, probability of profit, maximum loss, 5% CVaR, concentration, scenario coverage, and incremental exposure versus the existing book |
| Personalization | Unit, ticket, stake-cap, reserve, role, and open-parlay-policy violations |
| Operations | Latency, cost, failure rate, retry rate, and output truncation |

Outcome win rate is diagnostic only. It is not a promotion metric by itself because a small set of long-odds futures can be profitable or unprofitable through variance alone.

### 6. Promotion Gates

All hard gates must pass:

- 100% strict-schema and canonical-market compliance;
- zero fabricated, stale, unavailable, wrong-team, wrong-line, or wrong-book final recommendations;
- zero negative-EV standalone final recommendations under the code-owned probability model;
- zero unresolved required evidence IDs and at least 95% blind semantic-support accuracy;
- zero stake-cap, reserve, ticket-role, or open-parlay availability violations;
- 100% probability/payoff conservation within the configured numerical tolerance;
- no forced recommendation count, and `NO BET` remains an allowed final portfolio;
- final-price re-check executed for 100% of promoted recommendations.

Statistical gates require enough held-out observations:

- Brier score and log loss must be no worse than the no-vig market baseline; the 90% bootstrap confidence interval for the score difference must include improvement and must not show material degradation;
- median closing-line value must be positive, with a 90% bootstrap lower bound at or above zero across at least 100 recommendation observations;
- hard-gate decisions must agree on at least 95% of five repeated runs, and core-pick Jaccard similarity must be at least 0.70;
- the Skeptic/Risk path must improve or preserve the predeclared composite score versus the no-Skeptic arm; otherwise remove or redesign the stage;
- the selected frontier arm must beat or tie the deterministic/current-production baseline on quality gates without unacceptable cost or latency regression;
- the simulated portfolio must remain inside Andy's configured loss, concentration, and reserve limits in every terminal state.

Thresholds may be tightened before a run, but never loosened after seeing results. If sample size is insufficient, confidence intervals are inconclusive, or any hard gate fails, the system remains a human-reviewed shadow candidate generator.

### 7. Execution Order

1. Freeze and hash the suite, prompts, dossier snapshots, personalization, code commit, and scoring configuration.
2. Run contract/conservation tests; stop immediately on any hard failure.
3. Run deterministic and no-vig market baselines.
4. Run each LLM comparison arm and five-repeat stability set.
5. Run component ablations and the independent-Skeptic arm.
6. Perform blind semantic grading and automated quantitative scoring.
7. Bootstrap confidence intervals and generate the full result report.
8. Issue exactly one verdict: `FAIL`, `SHADOW ONLY - INSUFFICIENT EVIDENCE`, `SHADOW ONLY - QUALITY GAP`, or `LIMITED HUMAN-APPROVED PILOT`.
9. Require human sign-off before any live analyst call is allowed to inform a wager.

A limited pilot, if earned, should use a separately approved cap. A conservative default is no more than 0.25 futures unit per new recommendation and 2 futures units total before the next review; this is a safety policy for evaluating the system, not evidence that any bet is good.

### 8. Required Artifacts and Target Interface

Recommended durable layout:

```text
tests/fixtures/futures-benchmark/<suite-version>/
.nfl/benchmarks/<run-id>/manifest.json
.nfl/benchmarks/<run-id>/outputs/
.nfl/benchmarks/<run-id>/scores.json
.nfl/benchmarks/<run-id>/report.md
docs/FUTURES_ANALYST_BENCHMARK_RESULTS_<date>.md
```

Target command after the harness is implemented:

```powershell
npm.cmd run benchmark:futures -- --suite full --repeats 5 --no-persist
```

This command does not exist at audit time. The P2 build is responsible for implementing it or an equivalent interface. The command must default to read-only benchmark output and require a separate explicit flag for any billable model arm.

The result report must contain:

```markdown
# Futures Analyst Benchmark Result

- Run ID / date / code commit
- Suite version and hashes
- Dossier and personalization snapshot hashes
- Models, prompts, reasoning settings, seeds, and repetitions
- Sample sizes and missing-data exclusions
- Hard-gate table: pass/fail with failing case IDs
- Metric table by comparison arm with confidence intervals
- Ablation and committee-lift results
- Stability and cost/latency results
- Portfolio distribution and personalization violations
- Known limitations and leakage audit
- Verdict and exact rationale
- Required remediation before rerun
```

Do not describe the analyst as risk-worthy unless the stored benchmark report shows that every required gate passed. Passing the existing five-scenario portfolio corpus is a prerequisite, not a substitute for this benchmark.

## Recommended Machine-Readable Personalization Contract

```json
{
  "units": {
    "futures_usd": 20,
    "in_season_usd": 10
  },
  "limits": {
    "primary_planned_cap_usd": 500,
    "in_season_reserve_usd": null,
    "playoff_cash_hedge_reserve_usd": null
  },
  "positions": [
    {
      "id": "bills_packers_exacta",
      "market": "superbowl_matchup",
      "selection": "Buffalo Bills vs Green Bay Packers",
      "role": "anchor_correlation_amplifier",
      "stake_usd": 100,
      "price": 6500,
      "status": "open"
    },
    {
      "id": "bills_sb",
      "market": "superbowl",
      "selection": "Buffalo Bills",
      "role": "anchor_bet",
      "current_stake_usd": null,
      "target_cap_usd": 200,
      "blended_price": null,
      "status": "building"
    },
    {
      "id": "packers_sb",
      "market": "superbowl",
      "selection": "Green Bay Packers",
      "role": "anchor_bet",
      "current_stake_usd": null,
      "target_cap_usd": 200,
      "blended_price": null,
      "status": "building"
    }
  ],
  "open_parlays": {
    "source": "data/futures-imports/open-parlays-2026.json",
    "availability_status": "unverified_house_rule_conflict",
    "eligible_as_required_hedge_resource": false
  }
}
```

## Trust Gates for a Future Live Run

A live run may be useful in shadow mode when all P0 gates pass. It should not produce a real bet candidate unless every final position has:

- canonical market, team, side, and line;
- currently placeable price with timestamp and maximum age;
- deterministic or explicitly modeled fair probability;
- uncertainty interval and positive lower-bound edge;
- exact evidence values with dates and source identity;
- no unresolved required evidence;
- independent skeptic review;
- deterministic correlation and exposure classification;
- dollar stake within Andy's caps and reserves;
- terminal scenario/payoff impact;
- final live price re-check;
- human approval.

## Final Assessment

The system has enough intelligence to **discover questions worth investigating**. It does not yet have enough measured forecasting intelligence to decide which answers are worth risking money on.

That is not a failure of the overall design. It is the normal boundary between an impressive LLM research workflow and a real forecasting system. The next gains will come less from a more eloquent model and more from canonical market contracts, independent probabilities, uncertainty, scenario payoffs, and calibration.

Once those are code-owned, a frontier LLM can become genuinely valuable: not as the source of the edge, but as the analyst who understands why the edge may exist, attacks it intelligently, and explains how it fits Andy's portfolio.
