# 2026-09-08 22:18 UTC - Codex: guarded-policy enforcement re-review

**Author / Agent:** Codex
**Target / Audience:** Andy, Claude, Antigravity, Codex (next session)
**Repo:** `E:\dev\projects\NFL_Dashboard`
**Branch / HEAD:** `main` at `0fc6112`, one commit ahead of `origin/main`
**Status:** Targeted re-review complete. The prompt policy and monotonic merge
are approved; mechanical enforcement remains open. Nothing staged, committed,
pushed, persisted, or model-called.

## Scope and verification

- Read `handoffs/2026-09-08-2209-claude-guarded-policy-implementation-handoff.md`
  first and reviewed only the four follow-up areas requested.
- Reconciled live Git and preserved the intentionally dirty checkout.
- Inspected the rewritten hierarchy, Risk/Editor prompt/input, merge behavior,
  evidence resolution, board validation, final-report rendering, proposal
  export, and both persistence paths.
- Spot checks: `node --check` and focused ESLint passed for both changed code
  files. The existing board/named-player suites passed: 3 files, 48 tests.
  The first Vitest attempt used unsupported `--runInBand` and ran zero tests;
  it was immediately rerun with the supported command and passed.
- Ran read-only pure-function probes and inventoried evidence-ID shapes from 32
  existing `.nfl/portfolio/*.raw.json` artifacts. No preflight or prompt-only
  rerun was needed; no Stage 6 or paid model call was made.

## Findings

### P1 - Detection is not the mechanical forcing Andy selected

`evidenceTierViolations()` correctly detects a resolved Tier-3/4-only
candidate that is unflagged and core/standard. But it returns violation strings
only. `validateBoardBatch()` preserves the candidate's original
`needs_human_review` and `stake_tier` and merely adds `validation`.

The consequence is observable throughout the final path:

- HTML/Markdown show the original core/standard tier and omit the dedicated
  Needs Review badge when the value is false; a generic board-validator badge
  appears beside them.
- `candidateToOfficialProposal()` does not copy `candidate.validation` into the
  proposal or readiness checks. It can export the candidate at core units with
  `needs_human_review=false`, and warnings do not make `proposal_ready=false`.
- `persistRecommendations()` stores the original core/standard tier and false
  review flag; it does not store board validation. The run-trail payload retains
  the diagnostic, but still labels the row `final`.

A direct probe confirmed the mismatch: the helper returned both expected
violations for a Tier-3-only core/unflagged candidate, while the candidate
remained exactly core/unflagged afterward.

**Required fix:** before ranking, proposal export, report rendering, and
persistence, apply a code-owned normalization to a copy of each final candidate:
set `needs_human_review=true` and downgrade core/standard to small (or the
explicitly chosen small/speculative rule). Keep the violation text as audit
evidence. The locked annotate-and-keep board-validator contract can remain
unchanged; enforcement can be a separate pure transformation followed by the
validator assertion.

### P1 - The classifier is fail-open and does not match real evidence-ID shapes

`classifyEvidenceTier()` recognizes only the first segment and defaults every
unknown prefix to Tier 1. That is unsafe for a risk gate: a new narrative field,
metadata such as `team_nick`, or a differently nested ID becomes primary
grounding automatically.

The real artifact inventory contained 92 unique IDs across 32 raw reports, with
many noncanonical heads: market keys (`wins.*`, `division_*.*`,
`conference_*.*`), `dossier.team_profiles.*`, `team_profiles.*`, composite
candidate keys, and the retired `bettorday_trench`. Some paths put an intended
Tier-2 `lean` below a market or dossier prefix, so first-segment classification
does not express their actual source tier. The current resolver may leave many
of these unresolved, but that is not a safe substitute for classification.

There are two direct bypasses:

- `evidence_ids: []` is not flagged by strict validation and produces no tier
  violation, so an evidence-free core/unflagged candidate survives this gate.
- All-unresolved evidence makes strict validation set the review flag, but no
  code caps the stake. Mixed resolved/unresolved citations can also let a weak
  resolved ID mask an unresolved narrative citation.

**Required fix:** define explicit qualifying Tier-1 and Tier-2 roots/shapes,
normalize supported legacy/nested paths before classification, and treat
unknown, empty, or unresolved evidence as guarded (review required plus capped)
unless another resolved qualifying Tier-1/2 citation exists. Do not default
unknown evidence to Tier 1.

### P2 - The exacta unit assertion bypasses the real two-profile problem

The helper itself is row-shape-independent, so a synthetic candidate with
pre-populated `evidence_resolved` unsurprisingly gates the same way for a direct
row and an exacta. The live integration is different:
`teamProfileForRow()` selects `row.team_nick || row.team_a`; for
`superbowl_matchup`, only `team_a` is merged into the evidence-resolution
object. Evidence from `team_b` cannot be represented reliably by the current
unqualified paths, and same-named fields on both teams would collide.

Exactas are already marked sim-price-only, but board validation is
annotate-and-keep, so they still proceed through ranking, optional proposal
export, report output, and persistence. Either:

1. support team-qualified evidence IDs and resolve both profiles for exactas;
   or
2. make sim-price-only status an actual exclusion before any proposal/persistence
   consumer, in which case source-tier enforcement for an exacta card becomes
   moot.

The second option is simpler and aligns with locked decision #4, but it is
slightly broader than this Stage 5 patch.

## Items approved

- The rewritten SOURCE HIERARCHY cleanly resolves the earlier contradiction and
  accurately states Andy's guarded-with-enforcement policy.
- The six formerly unclassified structured families are now clearly described.
- The Tier-3 named-host non-promotion rule is correct.
- `!!(c.needs_human_review || f.needs_human_review)` is the correct monotonic
  merge. No legitimate in-run true-to-false safety transition was found; a flag
  should clear only after new evidence in a later run or explicit human review,
  not because a downstream model emitted false.
- Passing incoming `needs_human_review` and `evidence_ids` to the Risk/Editor is
  useful, low-volume defense in depth. Keep it, but do not call it enforcement.
- Every recommendation path inside this main pipeline does pass through strict
  validation and `validateBoardBatch`; the bypass is the validator's semantics
  and evidence resolution, not a separate final-candidate branch.

## Closure criteria

The prior prose P1/P2 findings are closed. The enforcement P1 remains open until:

1. unsafe values are normalized before all final consumers;
2. unknown/missing/unresolved evidence fails guarded rather than primary;
3. durable unit tests cover normalization, persistence/proposal readiness, and
   real two-profile exacta handling or exclusion; and
4. Stage 6's mocked end-to-end run shows the final HTML/Markdown/raw output
   contains the forced review flag and capped tier.

Code-level testing is necessary but not sufficient here. The current inline
assertions prove detection only, and they are not durable regression tests.
Stage 6 should run after the P1 corrections; it should not be used to bless the
current annotate-only behavior.

## Files changed by this review

- Added this handoff.
- Reopened and corrected only the affected Stage 5 enforcement entry in
  `docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`.
- Did not edit either implementation file.

## Standing guardrails

No cleanup/stash/reset/revert; no broad staging; no commit or push without
Andy's explicit approval; no Supabase writes; no paid synthesis; no betting,
official-pick, proposal, or portfolio mutations; preserve all unrelated dirty
work.
