# 2026-09-08 2308 — Claude — guarded-with-enforcement, round 4 (Codex final round-3 review, identity-metadata fix)

## What this is

Round 4 — the single narrow correction Codex's final round-3 review asked
for (`handoffs/2026-09-08-2256-codex-guarded-policy-round3-final-review-
handoff.md`), which found round 3's enforcement placement and exacta
exclusion were both correctly closed, but one P1 bypass remained: `team`
was in the Tier 1 allowlist, and since `team` resolves from essentially
every dossier row regardless of real analytical support, a Tier-3/4-only
candidate could cite `evidence_ids: ['team']` alone and stay `core`/
unreviewed. Codex reproduced this directly against the checked-out helper.

## Fix

`agents/lib/board-validate.js`, `TIER1_FIELD_ROOTS`:

- Removed `team` — identity metadata (the row's own team-name string), not
  evidence.
- Also removed `best_book`, `best_over_book`, `best_under_book` — per
  Codex's explicit instruction to "review other locator/display-only roots
  under the same substantive-evidence rule." These are book-NAME labels
  (which sportsbook offered a price, e.g. `"bookmaker"`), not price/edge
  data themselves — citing one alone carries the same zero evidentiary
  weight `team` did.
- Left untouched: the paired numeric/price fields that actually carry
  signal — `best_price`, `best_prob`, `best_over`, `best_under`,
  `value_gap`, `book_divergence`, etc. Only the identity/locator siblings
  were removed.

`agents/portfolio-synthesize.js` was NOT touched this round — the fix is
entirely inside `TIER1_FIELD_ROOTS`.

## New tests

7 new tests added to `tests/unit/evidenceTierGate.test.js` (now 36 total),
in a new `describe('round-4 fix: identity/locator-only fields do not
qualify as Tier 1...')` block:

- `classifyEvidenceTier('team')` is now `null`.
- `classifyEvidenceTier` for `best_book`/`best_over_book`/`best_under_book`
  is now `null`.
- The paired numeric fields (`best_price`, `best_prob`, `best_over`,
  `best_under`) still classify as Tier 1.
- Codex's exact repro: a candidate whose ONLY resolved evidence is `'team'`
  is NOT qualifying grounding (`hasQualifyingGrounding` false).
- `enforceEvidenceTierGate` forces `needs_human_review: true` +
  `stake_tier: 'small'` on a `team`-only-grounded `core` candidate (the
  reported bypass) — non-mutating, confirmed against the original object.
- A candidate grounded by `team` plus a book-name locator ONLY is still
  forced to guarded (no real Tier 1/2 support even combined).
- A candidate grounded by `team` alongside a REAL Tier 1 price field is
  correctly treated as grounded (no-op) — confirms the fix isn't
  over-punishing candidates that DO have real support, just because `team`
  also happens to be cited.

## Verification

- `node --check` clean on `board-validate.js` and the test file.
- `eslint` clean (0 errors) on both.
- New suite: 36/36 pass.
- Full related suite re-run clean: `evidenceTierGate.test.js` (36),
  `boardValidate.test.js` (25), `boardValidateNamedPlayerGate.test.js`
  (11), `namedStatusReviewSizingGates.test.js` (12),
  `dataGatheringSprint.test.js` (7) — 91 tests total, zero regressions.
- `agents/portfolio-preflight.js`: 3 BLOCK / 8 WARN / 22 pass — unchanged
  from the round-3 baseline (pre-existing data staleness, unrelated).
- Diffed `agents/lib/board-validate.js` against a fresh pre-edit backup
  (`/tmp/board-validate.js.bak4`) — change isolated to the
  `TIER1_FIELD_ROOTS` set and its doc comment. `agents/portfolio-
  synthesize.js` diffed against `/tmp/portfolio-synthesize.js.bak4` — zero
  changes, confirming this round touched only one file.
- No model calls, writes, staging, commit, or push.

## Not addressed this round (by design — Codex's own disposition)

Codex explicitly called the allowlist-completeness finding "P2
correctness/overguarding, not an unsafe bypass" and recommended treating it
as a Stage 6 acceptance check rather than a code change now:
- Some real structured dossier row roots may be absent from
  `TIER1_FIELD_ROOTS` (e.g. quote-freshness/traceability fields, win-dist
  outputs) and are therefore safely overguarded rather than incorrectly
  admitted — conservative, not urgent.
- `roster_churn`, `adjacent_signals`, and `experts` are recognized by the
  classifier but structurally can't resolve through the current
  `evidenceRowFor()` merge (top-level dossier maps, not part of the
  row+profile merge) — a pre-existing gap, not a round-4 regression.

Recommend: one more Codex spot-check of this narrow round-4 diff, then
proceed to Stage 6's real mocked end-to-end run with explicit test cases
for canonical Tier 1/2, narrative-only, unknown/empty, unreachable
top-level IDs, exacta exclusion, and simulation-only labeling of
hedge_baskets/parlay_ladders (per Codex's Stage 6 recommendation).

## Standing guardrails (unchanged, still honored)

No `git add -A`/staging/commit/push without Andy's explicit approval. No
Supabase writes. No paid committee synthesis (real model calls). No betting
picks/official-pick promotions/portfolio mutations without authorization.
No Yahoo Fantasy work. Worktree preserved (no reset/stash/clean/revert).
