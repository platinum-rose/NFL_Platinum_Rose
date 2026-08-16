# NFL Futures Synthesis Incident Review - Codex/Claude Comparison

Date: 2026-08-13 Pacific
Repository: E:\dev\projects\NFL_Dashboard
Scope: read-only reconciliation and comparison of the Codex incident brief against the saved Claude response

## Authority boundary

This comparison does not authorize betting, official picks, portfolio or parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, live source reacquisition, commit, or push.

The next required decision is Andy's approval before moving from comparison into intel-reacquisition design/build.

## Reconciled current state

- Current observed Git state: `main...origin/main` at `694be71`.
- Dirty/untracked work remains present and intentionally preserved.
- Newer concurrent handoff discovered and included in reconciliation: `handoffs/2026-08-13-0140-gmail-and-twitter-intel-ingestion-handoff.md`.
- The 01:40 Gmail/Twitter/Screenshot handoff describes live automation, Supabase writes, M6 deployment, tests, commits, and push activity from a separate lane. It also has an inconsistent HEAD header. Current Git state is authority for this comparison.
- Protected futures artifacts remain separate:
  - `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`
  - `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`
  - `handoffs/2026-08-13-0054-futures-claude-incident-review-handoff.md`
  - `handoffs/2026-08-13-0135-concurrent-session-preservation-handoff.md`

## Bottom-line comparison

Claude materially corroborates the Codex incident brief.

Claude reports independently reproducing the quantitative contamination findings it checked and states that it found no fabricated, materially inflated, or mischaracterized quantitative claim in the Codex brief. Claude agrees that no actionable August 11 futures portfolio existed, agrees the August 12 cleanup was real and useful at the evidence-lane level, and agrees that the cleanup does not establish factual completeness or portfolio readiness.

The main added emphasis from Claude is not a factual disagreement. It is an implementation warning: the post-cleanup portfolio dossier still does not exist, and several synthesis-code risks from the July 22 audit remain live.

## Agreements

| Topic | Codex brief | Claude response | Comparison |
|---|---|---|---|
| August 11 actionability | No actionable portfolio; local Sol result was research-only `ACTIONABLE NOW: NONE`; committee did not execute. | Verified two independent reasons: committee did not run and the dossier failed on its own diagnostics. | Agreement. Treat August 11 as no-action/no-portfolio. |
| Portfolio state | No NFL futures placed; Bills-Packers exacta is proposed, not existing; expired Bookmaker parlays have zero guaranteed value. | Did not dispute. Uses same exacta and parlay constraints in analysis. | Agreement. |
| Article corpus | 31 metadata-only and 181 suspected-truncated records require reacquisition; zero execution-usable actual picks after cleanup. | Endorses reacquisition design and adds likely root cause: hardcoded approximately 4,000-character ingestion cap. | Agreement plus useful root-cause emphasis. |
| Training-camp/team identity | Cleanup repaired duplicates and wrong-team ownership but revealed missing true coverage. | Reports the targeted contamination instances were independently confirmed and quarantined. | Agreement. |
| Availability/named players | Connor McGovern and Micah Parsons remain withheld/conflicted and cannot support anchor theses as resolved facts. | Directly confirms both remain load-bearing unresolved cases. | Agreement. |
| Projected starters | Estimated only; zero manually verified starter signals. | Uses this as a reason no historical candidate survived as actionable. | Agreement. |
| Prediction markets | Repaired map removes wrong-season/collision contamination but remains context-only without execution terms/liquidity/fees/fill. | Confirms map/gate behavior and repeats bid/ask/fill/fee/settlement requirements. | Agreement. |
| YouTube/podcast | Accepted cohort fingerprint is repaired; stale sidecar must not enter the next dossier. | Confirms forbidden episodes are absent from accepted cohort and endorses same-source fingerprint logic. | Agreement. |
| Sportsbook exacta eligibility | Bills-Packers +6500 is monitor-only because it is single-book and lacks execution-claim eligibility. | Confirms exacta is BetUS-only and `execution_claim_allowed: false`. | Agreement. |
| Market-anchored simulation | Useful for coherence but not independent football alpha. | Confirms circular market anchoring in code and recommends a genuinely independent football layer. | Agreement, with stronger code-level emphasis from Claude. |
| Forced-bet pressure | Prompt should allow zero plays/reserve-only. | Confirms problematic prompt language and recommends deleting recommendation-count pressure. | Agreement. |
| Model agreement | Codex/Claude agreement is analyst agreement, not source corroboration. | Recommends shared-source agreement labeling using evidence IDs/fingerprints. | Agreement plus concrete comparison-label design. |

## Disagreements or corrections

No material factual disagreement was found in Claude's response.

Claude adds two clarifying nuances:

- The stale sidecar's "34 team/market combos" figure is pipeline-canonical, while a naive raw string-pair count produces 66. This is not a contradiction, but it should be documented as pipeline-derived rather than hand-count-derived.
- The prompt/committee/output-validation architecture issues predate this incident and were already flagged in `docs/FUTURES_ANALYST_SYSTEM_INTELLIGENCE_AUDIT_2026-07-22.md`. The Codex brief correctly treated them as still-open, but the comparison should explicitly classify them as old unresolved synthesis-system risks, not newly discovered August 11 evidence-lane failures.

## Reproduced counts and status claims

Claude claims it independently reproduced the material counts across:

- Article corpus and article cleanup.
- Training-camp deduplication and identity cleanup.
- Availability and named-player conflicts.
- Projected starters.
- Prediction-market mapping/coherence.
- YouTube/podcast accepted cohort and forbidden-episode exclusion.
- Sportsbook execution eligibility.
- Verification receipt.
- Prompt, committee, merge, venue-list, and simulation-code architecture.

Because this comparison reviewed Claude's saved response against the Codex brief rather than re-running Claude's entire audit harness, treat those reproduced counts as Claude-reported verification that corroborates the Codex brief. No contradictory count appeared in the response.

## Unresolved factual questions

These remain blockers before synthesis:

- Full-body recovery for the 31 metadata-only and 181 suspected-truncated article records.
- Current, timestamped resolution for Connor McGovern's Bills role/health/depth-chart status.
- Current, timestamped resolution for Micah Parsons' team ownership, injury/PUP status, return expectation, and role.
- Candidate-first, manually verified depth-chart state for relevant teams.
- Current placeable multi-book sportsbook pricing for candidate futures.
- Kalshi/Polymarket execution equivalence with bid/ask, fillable size, fees, settlement, expiration, and contract identity.
- A post-cleanup portfolio dossier built only after approved truth and eligibility contracts are in place.

## Modeling recommendations carried forward

- Keep three probability layers separate: market prior, independent football projection, and posterior scenario distribution.
- Build the independent football layer from verified roster/depth-chart/injury/coaching/performance evidence, not from market win totals or de-vigged division prices.
- Preserve model disagreement as an explicit interval or spread that reduces stake caps; do not average it away.
- Require evidence IDs, exact source excerpts, current-price IDs, missing-data declarations, and strict JSON Schema validation for model outputs.
- Remove prompt pressure for 12-20 plays and make zero-play/reserve-only a valid outcome.
- Use deterministic comparison to distinguish independent evidence corroboration from shared-source model agreement.

## Next gates before any new dossier or synthesis

1. Andy approves moving from comparison into design/build.
2. Design article and source reacquisition workflow, including body hashing, old/new body retention, retrieval timestamping, author/publication preservation, multi-selection splitting, and historical-price/current-price separation.
3. Define one canonical execution-venue registry consumed by dossier builder, price selector, execution validator, synthesis prompt, and final report.
4. Add named-player and depth-chart resolution gates for anchor-dependent reasoning.
5. Add dossier freshness/hash stamping so a stale pre-cleanup dossier cannot be silently reused.
6. Fix or replace the synthesis architecture risks: forced-bet prompt language, non-independent skeptic/risk stages, loose output validation, and confidence-only merge logic.
7. Only then generate a fresh frozen evidence packet and post-cleanup dossier for blind Codex/Claude analysis.

## Approval question

The comparison phase is complete. The recommended next action is to ask Andy:

Do you approve moving into design/build for the article and source reacquisition workflow, while still prohibiting betting, official picks, portfolio mutation, Supabase writes, paid model/API calls, fresh synthesis, commit, and push unless separately approved?
