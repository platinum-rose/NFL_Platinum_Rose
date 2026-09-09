# 2026-09-08 21:51 UTC - Codex: Stage 5 source-hierarchy review

**Author / Agent:** Codex
**Target / Audience:** Andy, Claude, Antigravity, Codex (next session)
**Repo:** `E:\dev\projects\NFL_Dashboard`
**Branch / HEAD:** `main` at `0fc6112`, one commit ahead of `origin/main`
**Status:** Review complete; prompt change is conditionally approved in
principle, but the wording and downstream enforcement are not ready for final
sign-off. Nothing staged, committed, pushed, persisted, or model-called.

## Scope and live-state reconciliation

- Read Claude's requested first-read handoff:
  `handoffs/2026-09-08-2129-claude-source-hierarchy-handoff.md`.
- Reconciled live Git. The checkout remains intentionally dirty; the Stage 5
  prompt addition is part of broader uncommitted work in
  `agents/portfolio-synthesize.js`. This review is limited to the new
  per-field trust notes and `SOURCE HIERARCHY` paragraph.
- Inspected the surrounding SYSTEM_PROMPT, the Stage 2 Skeptic and Stage 3
  Risk/Editor prompts, evidence resolution, strict recommendation validation,
  board validation, vault/master-report shapes, model defaults, and every
  scoped BettorDay reference relevant to the synthesis path.
- Did not repeat the already-recorded prompt-only run or run any model. No
  Supabase write, paid call, pick/portfolio mutation, staging, commit, or push.

## Findings (priority order)

### P1 - The Tier-3-only safety rule is not enforced downstream

The new text asks the Stage 1 model to set `needs_human_review=true`, but the
pipeline has no code-owned source-tier check. `validateRecommendationStrict()`
only verifies that at least one `evidence_id` resolves; it does not classify
resolved IDs as Tier 1/2/3/4. `board-validate.js` has a mechanical sizing gate
for unresolved named-player cases, but nothing analogous for narrative-only
theses.

There is also a non-monotonic merge: `applyRiskEditor()` uses the Risk/Editor's
boolean whenever it is present, so a final-stage `false` can erase an earlier
Stage 1 `true`. The Risk/Editor prompt never receives the source hierarchy or
resolved evidence values and is not instructed to preserve narrative-tier
flags. Therefore a Tier-3-only candidate can finish unflagged and retain a
core/standard stake even if Stage 1 followed the new instruction correctly.

**Required before final approval:** add a post-hoc evidence-tier validator and
make review flags monotonic across stages (`earlier || later || codeOwnedFlag`).
Depending on Andy's wording decision below, Tier-3/4-only recommendations must
either be routed to watch/pass or forcibly marked for review and capped at
small/speculative. Add cases for ordinary team rows and two-team exactas.

### P1 - The new eligibility rule contradicts its own escalation rule

Tier 1 says a thesis needs Tier-1 support "to exist at all; nothing below it
can create an edge on its own." Tier 3 then defines what to do with "a play
backed ONLY by Tier 3": keep it, flag it for human review, and avoid a
core/standard stake. Both cannot be the operative contract.

Andy should choose one clear policy:

1. **Strict eligibility:** no Tier-1 grounding means watch/pass, never a
   recommendation; or
2. **Guarded exploration:** Tier-3-only material may produce a candidate, but
   it must be `needs_human_review=true` and small/speculative, while only
   Tier-1-grounded plays may become core/standard.

The second option better matches the current "mine the entire market" and
watch-list behavior, but this is a product/risk decision for Andy.

### P2 - Several existing evidence fields are left outside the hierarchy

The prompt's Tier 1 list includes analytics/EPA, `sos`, `prior`,
`schedule_context`, and `clv_signal`, but omits `dvoa`, `coaching_profile`,
`officiating_context`, `prediction_markets`, injuries/player availability, and
top-level `roster_churn`. Existing EDGE TYPE, WHAT TO HUNT, injury, stale-price,
and knowledge instructions explicitly invite those fields to support theses.
The model now has no stable answer for whether those inputs satisfy the new
Tier-1 eligibility rule or sit below it.

The hierarchy should classify all usable evidence families, or describe Tier 1
as a general class (for example, current traceable market/structured dossier
evidence) and list exceptions/freshness constraints separately. Do not label
all structured evidence as equally strong: officiating and CLV already carry
small-sample cautions, DVOA is an imported opinion, and injuries must respect
freshness/review flags.

### P2 - Named analysts inside narrative containers should not be promoted wholesale

The proposed assignment is defensible as written: normalized named,
timestamped, directional leans are Tier 2; `vault_analytical_reads` and
`master_reports` remain Tier 3 even when a title or `experts` string names a
trusted host/outlet. Container provenance is not the same as a normalized,
market-specific claim.

An individual vault/master-report claim may qualify for Tier 2 only after it
has the same auditable contract as normalized intel: named speaker, timestamp,
explicit market/direction, and a traceable source. Vault deep reads carry a
source/date/URL, but master-report prompt objects currently carry
`source_document`, title, and optional experts without a normalized timestamp.

### P3 - Prompt clarity is good, but testing must target behavior and the actual model

The four-tier structure is not excessive for this large prompt; the repeated
inline tags help local attention. The problem is coverage and enforceability,
not the number of tiers. Tighten the duplicated prose after the policy is
settled, but do not remove the standalone hierarchy.

Prompt-only verification proves assembly, not instruction following. The
mocked Stage 6 harness should cover Tier-3-only, Tier-4-only, mixed Tier-1/3,
and Risk/Editor attempts to clear flags. A later authorized behavioral test
must use the actual default models currently named by `MODELS`
(`claude-opus-5`, `claude-fable-5-1`); mocked fixed responses cannot establish
that those models weigh the prose correctly.

## BettorDay conclusion

`bettorday_trench` is moot for this prompt-framing item. It is absent from
`slimTeamProfile()` and no live call attaches it to team profiles. The old
loader remains renamed and unused, plus comments/ingest/data/fantasy artifacts
remain elsewhere; none requires matching SYSTEM_PROMPT guidance while the lane
is disconnected.

Two checklist instructions were stale because they still told Stage 6/9 to
exercise or inspect `bettorday_trench`. They now target
`vault_analytical_reads`, `master_reports`, and `training_camp_intel` instead,
and explicitly test final flag/stake enforcement. The separate decision about
retiring BettorDay ingestion remains outside this review.

## Files changed by this review

- Added this handoff.
- Updated only the directly affected Stage 5, Stage 6, and Stage 9 checklist
  wording in
  `docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`.
- Did not edit `agents/portfolio-synthesize.js` or any implementation file.

## Verification / next gate

- Run Markdown/diff checks on these two documentation changes.
- Claude/Andy should resolve the strict-vs-guarded eligibility wording first.
- Then implement the mechanical tier gate + monotonic review merge and add
  focused offline tests.
- Only after those are clean should Stage 6 mocked rehearsal run. A real paid
  model call remains prohibited without Andy's explicit authorization.

## Standing guardrails

No cleanup/stash/reset/revert; no broad staging; no commit or push without
Andy's explicit approval; no Supabase writes; no paid synthesis; no betting,
official-pick, proposal, or portfolio mutations; preserve all unrelated dirty
work.
