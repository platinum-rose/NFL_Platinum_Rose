# 2026-09-08 2242 — Claude — guarded-with-enforcement, round 3 (Codex P1/P1/P2 fixes)

## What this is

Round 3 of the Stage 5 (source weighting / trust hierarchy) work — implements
the three blocking findings from Codex's second review
(`handoffs/2026-09-08-2218-codex-guarded-policy-rereview-handoff.md`), which
found round 2's `evidenceTierViolations()` detected policy violations
correctly but never actually enforced them, plus two related gaps.

## Files changed (both uncommitted, per standing guardrail)

### `agents/lib/board-validate.js`

- Rewrote `classifyEvidenceTier(evidenceId)`: was fail-open (defaulted any
  unmatched dot-path root to Tier 1); now fail-closed via an explicit
  `TIER1_FIELD_ROOTS` allowlist built from `agents/portfolio-dossier.js`'s
  actual row/profile field names. Unmatched → `null` ("unrecognized"), never
  Tier 1.
- New `hasQualifyingGrounding(candidate)`: single source of truth for "does
  this candidate have real Tier 1/2 support" — true only when a RESOLVED
  evidence_id classifies as 1 or 2. Closes both the fail-open-classifier gap
  and the empty-`evidence_ids` bypass in one place.
- Rewrote `evidenceTierViolations(candidate)` to use `hasQualifyingGrounding`
  (kept as an annotator — annotate-and-keep, unchanged contract).
- New `enforceEvidenceTierGate(candidate)`: **the actual enforcement fix.**
  Pure, non-mutating — returns the same reference when no change is needed,
  else a new object with `needs_human_review: true` and `stake_tier`
  downgraded to `'small'` (unless already small/speculative), tagged
  `evidence_tier_enforced: true`.
- New `isSimPriceOnlyCandidate(candidate)` / `partitionSimPriceOnly(candidates)`:
  excludes `superbowl_matchup` candidates from `final` entirely (locked
  decision #4 already said they're sim-price-only/never-carded; this makes
  it real instead of just annotated). This is the P2 exacta fix — sidesteps
  `teamProfileForRow()`'s team_a-only merge gap rather than trying to repair
  it.

### `agents/portfolio-synthesize.js`

- Import line extended: `enforceEvidenceTierGate`, `partitionSimPriceOnly`
  added alongside the existing `validateBoardBatch` import.
- Pipeline tail (right after `final = validateBoardBatch(final, dossier);`,
  before `meta.final_empty = ...`): now runs `partitionSimPriceOnly(final)`
  (excluded candidates appended to `passed`, logged) then
  `final = final.map(enforceEvidenceTierGate)` (logged when any candidate is
  actually normalized). This covers every downstream consumer of `final` in
  one place — ranking, proposal export, the raw.json write, both persistence
  calls.

## New test file

`tests/unit/evidenceTierGate.test.js` — 29 tests, Vitest, following the
existing `boardValidate.test.js` convention. Covers: all 4 tiers plus the 8
concrete unrecognized-shape examples Codex named (`wins.*`,
`division_afc_east.*`, `conference_afc.*`, `dossier.team_profiles.*`,
`team_profiles.*`, `bettorday_trench`, empty string, undefined);
`hasQualifyingGrounding` for grounded/narrative-only/empty/unresolved/mixed
cases; `evidenceTierViolations` incl. non-mutation; `enforceEvidenceTierGate`
incl. same-reference no-op vs. new-object-on-change, non-mutation of the
original object, and "already speculative stays speculative"; the sim-price
partition incl. non-mutation, empty list, and a synthetic exacta case
matching the real bug shape (Tier-1-looking evidence that actually only
reflects team_a).

Replaces round 2's informal `scratch/_tmp_test_evidence_tier*.mjs` scripts
(moved to `_to_delete/`, not durable tests — this is what Codex meant by
"make the focused assertions durable tests").

## Verification run this round

- `node --check` clean on both changed files and the new test file.
- `eslint` clean (0 errors) on both changed files and the new test file.
- New suite: 29/29 pass.
- Existing related suites re-run clean: `boardValidate.test.js` (25),
  `boardValidateNamedPlayerGate.test.js` (11),
  `namedStatusReviewSizingGates.test.js` (12), `dataGatheringSprint.test.js`
  (7) — 84 tests total, zero regressions from this change.
- `agents/portfolio-preflight.js`: 3 BLOCK / 8 WARN / 22 pass — identical to
  the round-2 baseline (all pre-existing data-staleness issues: stale
  prediction-markets feed, stale ledger/watchlist, stale dossier — none
  related to this code).
- Diffed both changed files against fresh pre-edit backups
  (`/tmp/board-validate.js.bak2`, `/tmp/portfolio-synthesize.js.bak3`) to
  confirm the changes are isolated to exactly this work.
- No model calls, no writes, no staging, no commit, no push.

## Not done yet (deferred, per Codex's own stated order)

Stage 6's real mocked end-to-end run — showing the final HTML/Markdown/raw
output actually contains the forced review flag and capped tier on a live
(mocked) model response — has not been attempted. Codex was explicit that
Stage 6 "should run after the P1 corrections... should not be used to bless
the current annotate-only behavior," and this round is exactly those P1/P2
corrections. Recommend: Codex re-review of this round first, then Stage 6.

## Standing guardrails (unchanged, still honored)

No `git add -A`/staging/commit/push without Andy's explicit approval. No
Supabase writes. No paid committee synthesis (real model calls). No betting
picks/official-pick promotions/portfolio mutations without authorization. No
Yahoo Fantasy work. Worktree preserved (no reset/stash/clean/revert).
