# WORKING-CONTEXT.md - NFL Platinum Rose

> Live operational state. Update at session close.
> Last updated: 2026-07-22 16:35 | Branch: `main` | HEAD: `4cbd3be` plus uncommitted futures/report/podcast work

## Current Mode

```text
MODE: Futures Analyst Risk-Intelligence Build + Offline Report UX
ACTIVE: Full-system audit complete; report UX and podcast-source attribution improved offline
VERDICT: Research-capable, not yet risk-worthy
CANONICAL AUDIT: docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md
LATEST HANDOFF: handoffs/2026-07-22-1635.md
```

## Current Objective

Build and test an NFL futures analyst that can synthesize data intelligently while keeping probability, price, portfolio math, limits, and promotion decisions code-owned. The relevant question is not whether the model can write an impressive report; it is whether held-out evidence shows calibrated, stable, price-aware recommendations that improve on market and deterministic baselines.

## Current State

- Five curated offline portfolio scenarios pass through the real CLI with model calls stubbed.
- Scenario-book roles, ladder summaries, strict exacta resolution, and unresolved-coverage quarantine are implemented in the dirty tree.
- The corpus proves portfolio plumbing and rendering, not live analyst intelligence.
- A code/data audit documents ten critical gaps and a P0-P2 remediation order.
- The audit now includes the required post-P0-P2 benchmark protocol.
- No live analyst API call or Supabase write was made during audit/handoff work.
- Open parlays were not modified.
- Offline portfolio HTML now renders one recommendation card per team section rather than repeating cards under multiple ranking views.
- Team sections, parlay ladders, hedge baskets, passed/killed, and watch list are collapsible.
- Podcast narrative summaries exist under `docs/podcast-narratives/` and are linked from portfolio evidence when matched.
- Upstream podcast host-summary extraction can request `source_timestamp`, but existing processed podcast summaries need regeneration before timestamps appear.

## Primary Risks

1. Mixed wins/playoffs schemas duplicate and misidentify market rows.
2. Win-total fair/edge values are computed but omitted from model input.
3. Several reported edges use raw implied probabilities instead of correctly paired no-vig probabilities.
4. There is no production independent win/schedule probability model or uncertainty interval.
5. Quote freshness and final availability are not enforced end to end.
6. Committee stages are not sufficiently independent and can reward model confidence.
7. Ranking can retain negative-EV plays and the prompt pressures the model to recommend action.
8. Scenario maps do not yet model joint probabilities and terminal portfolio payoffs.
9. Batch and live-chat personalization do not load Andy's complete real ledger.
10. Passing curated fixtures does not establish calibration, CLV, stability, or profitability.

## Required Build Order

### P0

Canonical schemas, conformance tests, fair-field transmission, correct devig, quote freshness, exact validation, no forced bets, negative-EV rejection, final validation ordering, machine-readable personalization, and live-chat schema/context repair.

### P1

Matched-line win distribution, schedule Monte Carlo, uncertainty intervals, deterministic correlation and joint payoff models, exacta-role taxonomy, source reliability, exact evidence packets, numeric thresholds, and strict version metadata.

### P2

Read-only shadow mode, CLV capture, calibration scoring, repeated-run stability, committee ablations, abstention scoring, portfolio-distribution metrics, and a versioned benchmark harness.

### Promotion Benchmark

After P0-P2 are complete, run the held-out protocol in the canonical audit. Hard failures block promotion. Insufficient samples keep the analyst in shadow mode. The existing five-case corpus is only a prerequisite.

## Personalization Snapshot

```text
Futures unit: $20
In-season unit: $10
Bills vs Packers exacta: $100 at +6500
Bills Super Bowl target cap: about $200
Packers Super Bowl target cap: about $200
Primary planned cap: about $500
Open parlays: 6 tickets, 11 slots, $162.50 sunk; availability unverified
```

Bills and Packers are anchors. The Bills-Packers exacta is a cross-anchor amplifier. Exactas containing one anchor provide opponent coverage but still fail if that anchor fails. Neither-anchor exactas are the true anchor-failure coverage class.

## Safety Boundaries

- Do not run a live model call without explicit approval.
- Do not write benchmark or analyst output to Supabase.
- Do not overwrite canonical portfolio reports with tests.
- Do not fill or modify open parlay slots.
- Do not count unverified open parlays as guaranteed hedge capacity.
- Preserve unrelated dirty/untracked files.

## Verification

```powershell
npm.cmd run test:portfolio-corpus
# 5 portfolio corpus scenario(s) passed on 2026-07-22

node --check agents\portfolio-synthesize.js
node --check scripts\run-portfolio-corpus.js
# both passed on 2026-07-22

npx.cmd vitest run tests/unit/podcastHostSummary.test.js
npm.cmd run test:futures-dossier
npm.cmd run podcast-narratives
# passed on 2026-07-22
```

## Next Session Priority

Read `HANDOFF_PROMPT.md`, this file, and `handoffs/2026-07-22-1635.md`. Recommended next: inspect the new report UX in-browser, add a top team table-of-contents and source-quality badges if desired, then plan podcast timestamp backfill before any host-summary overwrite/live extraction. Do not jump to a live model run, Supabase persistence, or open-parlay changes without explicit approval.
