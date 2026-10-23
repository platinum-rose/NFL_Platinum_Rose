# Weekly Hypothesis Ledger

## Purpose

This is a prospective, local research record for testing whether weekly synthesis improves on a market baseline. It never places a wager, modifies sportsbook state, writes Supabase, or replaces the official placed-ticket ledger.

The ledger records three independent objects:

1. Recommendation or leg: forecast, hypothesis, price, evidence, CLV, and calibration.
2. Ticket: real or paper combination of legs, used for correlation, payout, stake, and realized ROI.
3. Evidence snapshot: read-only dated capture of an executable book, consensus source, or other input.

## Week 5 pilot boundary

The pilot begins with the remaining 2026 Week 5 slate. It must not invent historical closes or decision prices. Existing official placed tickets remain governed by the official ledger. This pilot may reference an official ticket only after the user expressly authorizes its placement or settlement record.

## Lifecycle

Recommendation status: draft, proposed, frozen, resolved, pass, void, or superseded.

- Frozen means decision price, probability, hypothesis, and evidence are immutable. A changed thesis or price requires a new recommendation.
- Pass is required for a considered actionable market declined because of price, evidence, conflict, execution, or no edge.
- Unpriced thesis is permitted but excluded from calibration until a forecast probability is frozen.

## Required recommendation contract

Every recommendation contains:

- Stable recommendation ID, season, week, timestamps, status.
- Event identity and kickoff time.
- Market type, selection, line, and price.
- Edge type: math, market_dislocation, matchup_thesis, or portfolio.
- Forecast status, probability when priced, and probability band.
- Decision quality: eligible, review, or blocked; plus explicit gaps and conflicts.
- Consensus, best executable, and accepted-book market observations.
- One primary hypothesis, dated drivers, disconfirming condition, and worst acceptable line or price.
- Source-evidence IDs or local paths.
- Frozen snapshot, lock snapshot, kickoff close, and every observed post-lock move.
- Settlement result when known.

Pass records preserve all market and evidence fields and additionally name one reason: no_edge, price_beyond_threshold, stale_or_missing_market, contradictory_evidence, insufficient_sample, or execution_unavailable.

## Forecast rules

Forecast probability is the chance of the stated selection, never a payout probability or stake instruction.

| Band | Probability | Treatment |
|---|---:|---|
| modest | 55–57% | monitor or small-edge record |
| actionable standard | 58–60% | eligible if decision-quality gate passes |
| strong | 61–64% | eligible if decision-quality gate passes |
| exceptional | 65%+ | human review required before freeze |

Decision quality is independent of forecast probability:

- Eligible: evidence is current, traceable, and adequate to freeze.
- Review: informative but contains a material gap or conflict.
- Blocked: cannot responsibly be frozen or compared.

## Market and close policy

For every frozen recommendation retain consensus, best executable, accepted-book when placed, last verified pre-lock snapshot, kickoff close, and every observed post-lock price change.

If a close cannot be verified, record close_unknown with source and reason. Do not reconstruct it from memory. Exclude it from CLV aggregates.

Bookmaker and BetOnline are primary executable sources. Consensus is a separate market baseline, never a substitute for an executable quote.

## Ticket policy

Tickets link to recommendation IDs rather than duplicating recommendations. A ticket is paper or official_reference. The official ticket number can appear only after explicit user authorization.

The pilot does not write official placement, cancellation, or settlement. It may reference an already-authorized official record for evaluation.

Parlays are scored on two levels:

- leg: forecast, price, CLV, and result;
- ticket: stake, payout, correlation, and realized ROI.

## Weekly review

The weekly review keeps separate reports:

1. Forecast and evidence: CLV, calibration, edge type, hypothesis, source, and decision-quality performance.
2. Bankroll and ticket: ticket ROI, stake, payout, correlation, and settlement.

Interpretation thresholds:

- Fewer than 30 resolved forecasts: exploratory only.
- 30–99: directional and explicitly low confidence.
- 100 or more: eligible for human weight-adjustment review only.

No source or feature weight changes automatically.
