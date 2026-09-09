# 2026-09-08 22:09 UTC - Claude: guarded-with-enforcement policy implemented

**Author / Agent:** Claude
**Target / Audience:** Andy, Codex, Antigravity, Claude (next session)
**Repo:** `E:\dev\projects\NFL_Dashboard`
**Branch:** `main`
**Status:** Implements Andy's explicit "guarded-with-enforcement" decision on
Codex's Stage 5 review. Verified via unit assertions and prompt-only dry-run,
NOT yet via a model call. Nothing committed.

## Context

Andy reviewed Codex's Stage 5 source-hierarchy review
(`handoffs/2026-09-08-2151-codex-stage5-source-hierarchy-review-handoff.md`)
and chose explicitly: **guarded-with-enforcement** — a Tier-3/4-only
(narrative-only) thesis may still be proposed, but must be mechanically
forced to `needs_human_review=true` and `stake_tier` small/speculative,
never core/standard. This closes out Codex's P1 policy-contradiction finding
and both P1/P2 enforcement gaps.

## What changed (4 files, all uncommitted)

### `agents/portfolio-synthesize.js`

1. Rewrote the SOURCE HIERARCHY paragraph: removed the Tier 1/Tier 3
   contradiction Codex flagged (Tier 1 no longer claims "nothing below it
   can create an edge on its own" — replaced with a GUARDED POLICY
   paragraph spelling out the actual rule). Folded the six previously-
   unclassified structured fields into Tier 1 explicitly: `dvoa`,
   `coaching_profile`, `officiating_context`, `prediction_markets`,
   `injuries`/`player_availability`, `roster_churn` — framed as a general
   class ("real, traceable structured data") rather than restating their
   existing freshness/small-sample caveats. Tightened Tier 3 language so a
   named host/outlet inside `vault_analytical_reads`/`master_reports`
   doesn't promote the whole container to Tier 2.
2. `applyRiskEditor()`: fixed the actual bug Codex found —
   `f.needs_human_review ?? c.needs_human_review ?? false` used `??`
   (nullish coalescing), which only falls through on null/undefined, so an
   explicit Risk/Editor `false` silently erased an earlier Stage 1/Skeptic
   `true`. Changed to `!!(c.needs_human_review || f.needs_human_review)` —
   monotonic OR.
3. `RISK_EDITOR_SYSTEM_PROMPT` + `buildRiskEditorUserPrompt()`: the
   Risk/Editor previously never received the incoming `needs_human_review`
   value or `evidence_ids` at all — now both are passed through, and the
   prompt states the floor (can only add `true`) and the guarded-policy cap
   explicitly. This is cooperative/belt-and-suspenders — the mechanical
   fix below is what actually holds if the model or Risk/Editor ignores it.

### `agents/lib/board-validate.js`

New `classifyEvidenceTier(evidenceId)` — classifies a resolved
`evidence_id` dot-path (e.g. `analytics.off_epa_rank`,
`vault_analytical_reads.foo`, `lean.samples[0].who`) into the SOURCE
HIERARCHY's four tiers by its first path segment. Defaults to Tier 1 unless
matched to Tier 2/3/4's narrower field sets — so a new structured dossier
field lands in Tier 1 automatically instead of silently falling outside the
hierarchy the way the six fields above did before this fix.

New `evidenceTierViolations(candidate)` — fires only when a candidate's
RESOLVED evidence traces to Tier 3/4 ONLY (no Tier 1/2 support): flags a cap
violation if `stake_tier` isn't small/speculative, and a separate violation
if `needs_human_review` isn't true. Wired into `validateBoard()` next to the
existing `namedPlayerSizingViolations()` — same annotate-and-keep pattern
(this file's locked decision #3: never mutate, stamp a visible violation
string instead, same red badge the report already renders for board
validator flags). Runs on `final` (post Risk/Editor) via the existing
`validateBoardBatch` call site, so it catches a flag any earlier stage
missed AND reverses a later stage silently clearing it — the actual
"mechanical enforcement" the SYSTEM_PROMPT text now promises the model.

## Verification done this session

- `node --check` on both files — clean.
- `node node_modules/eslint/bin/eslint.js` on both files — clean, 0 errors.
- `diff` against pre-edit backups for both files — confirmed changes are
  isolated to exactly the work described above.
- 21 inline assertions run directly against the real
  `classifyEvidenceTier`/`evidenceTierViolations` functions (not mocked):
  all four tier classifications including the six newly-added Tier 1
  fields; a Tier-3-only candidate with core stake + no flag → 2 violations;
  the same candidate properly capped+flagged → clean; Tier-1-mixed evidence
  → clean regardless of stake/flag; Tier-2-lean-only → clean (Tier 2 alone
  is sufficient grounding); Tier-4-only (training camp) → also gated;
  zero-resolved-evidence → correctly out of scope for this gate (that's a
  different, already-handled failure mode); a two-team `superbowl_matchup`
  exacta candidate → gated identically to a direct team row (confirms the
  check is evidence-based, not row-shape-based). **All 21 passed.**
- `node agents/portfolio-preflight.js --json --warn-only` — unchanged,
  3 BLOCK / 8 WARN / 22 PASS (expected — preflight doesn't inspect
  prompt/validator code).
- `--prompt-only` dry-run — confirmed programmatically that the new guarded-
  policy language and all six newly-classified Tier 1 field names are
  present in the actual rendered `system_prompt` (27,912 chars; shadow-slim
  prompt now ~233,520 tokens — still well under the 1M-context models this
  pipeline calls).

`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`
updated in place — all five items Codex's review left open under Stage 5
are now checked off with this detail.

## What's still open

- **No model-call verification.** Everything above is code-level (unit
  assertions on pure functions, prompt assembly) — none of it has been
  exercised through an actual or mocked model response yet. That's Stage
  6's job: craft mock Stage 1/Risk-Editor responses that produce a
  Tier-3-only candidate at core stake with `needs_human_review:false`, run
  it through the real pipeline, and confirm `evidenceTierViolations()`
  actually catches it end-to-end (not just via direct unit call) and that
  the final report renders the violation visibly.
- **Andy hasn't signed off on the exact wording yet** — the P1
  contradiction is resolved and the policy matches what he said explicitly,
  but the prose itself (Tier boundaries, exact escalation language) hasn't
  had his eyes on it.
- Nothing committed, staged, or pushed — same standing guardrail as every
  prior handoff today.

## Next session should

1. Get Andy's read on the rewritten SOURCE HIERARCHY prose, or he may just
   approve as-is now that the policy question is settled.
2. Set up Stage 6's mocked dry-run harness and specifically exercise this
   gate end-to-end with a crafted Tier-3-only mock response.
3. Consider looping Codex back in for a final pass now that both P1s and
   both P2s from their review are addressed — their call whether this
   needs another explicit review round or can go straight to Stage 6.

## Standing guardrails, unchanged

No `git add -A`/broad staging/commit/push without Andy's explicit approval;
no Supabase writes without per-write authorization; no paid committee
synthesis without explicit authorization; no betting picks/official-pick
promotions/portfolio mutations without authorization; no Yahoo Fantasy
work; preserve the dirty worktree.
