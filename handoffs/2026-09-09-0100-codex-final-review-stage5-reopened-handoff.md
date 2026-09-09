# 2026-09-09 — Codex — Final cumulative review of Stage 5/6 (session close) — NOT CLEAN, Stage 5 REOPENE@

## What this is

At session close, Codex was asked to do one final independent review of
everything done this session (rounds 3-4 of the guarded-with-enforcement
policy, the Stage 6 mocked run, and Andy's SOURCE HIERARCHY prose
sign-off) before handing off to a fresh session for Stage 7. **The
cumulative review came back NOT CLEAN.** Codex found a new fail-open
grounding bypass plus an unresolved contradiction in the prose Andy had
just approved. Codex's explicit recommendation: reopen Stage 5 before
treating Stage 5/6 as closed or starting ordinary Stage 7 work.

**This reverses the prior session's closure.** Everything previously
recorded as "Stage 5/6 fully closed" and "enforcement mechanics fully
verified" is superseded by this review.

## Findings

### P1 — Any resolved `lean.*` field qualifies as Tier 2, even without a named or timestamped call

`classifyEvidenceTier()` (`agents/lib/board-validate.js` ~line 369)
classifies solely by the first path segment. So all of these qualify as
Tier 2: `lean.n`, `lean.back`, `lean.fade`, `lean.avg_strength`,
`lean.samples[0].who`.

Codex reproduced the unsafe consequence directly: a core/unreviewed
candidate whose only resolved evidence is `lean.n = 1` returns
`hasQualifyingGrounding() === true`, and `enforceEvidenceTierGate()`
returns it unchanged (not forced). The real dossier contains 106 rows with
`lean` data — reachable, not synthetic.

This conflicts with the prompt's own definition of Tier 2 as a "specific,
dated, directional call." An aggregate count or average strength is not
that.

**Worse: the dossier producer strips timestamps when constructing lean
samples** (`agents/portfolio-dossier.js` ~line 1324). Across the current
dossier's 348 lean samples: 348 have `who`, 348 have direction, **0 have a
timestamp**. So even the intended `lean.samples[0].who` case cannot
satisfy the policy as written — the data needed to make it a legitimate
"dated" Tier-2 call doesn't exist in the dossier at all.

### P1 — Round 4 did not fully close the metadata-only bypass

Removing the four top-level locator fields (`team`, `best_book`,
`best_over_book`, `best_under_book`) was correct, but the classifier still
trusts every descendant of an allowed Tier-1 root. Real, resolvable
metadata-only examples Codex found: `analytics.season`,
`analytics.staleness_note`, `dvoa.source_name`, `dvoa.snapshot_at`,
`injuries.freshness`, `player_availability.snapshot_at`,
`prediction_markets.snapshot_at`, `prior.season`.

Each currently classifies as Tier 1 and lets a core/unreviewed candidate
through unchanged. Same essential problem as `team`/`best_book`: these
identify provenance, age, or context, not the direction or value of the
recommendation.

The checklist's round-4 statement "No other identity/locator-only field
found remaining in the allowlist" accurately reflected Codex's earlier
root-level review, but that conclusion is now superseded by this deeper
path-level review — root-only allowlisting was never fine-grained enough.

### P1 — The approved SOURCE HIERARCHY prose contradicts itself

`agents/portfolio-synthesize.js`:
- Line 214: says a core/standard stake needs support from Tier 1.
- Line 218: says Tier 1 OR Tier 2 grounding permits core/standard.

The enforcement code implements the second (looser) rule — Tier-2-only
evidence qualifies for core/standard.

Second conflict: Tier 4 is described (lines 206, 217) as never a primary
driver, only color for a thesis already grounded above it — yet the
guarded-policy paragraph explicitly permits a Tier-4-ONLY play (small/
speculative + reviewed). Those two statements describe different
policies.

**Andy's "approved as-is" sign-off does not resolve this** — the prose
itself contains two different policies depending on which paragraph you
read, so approving it "as written" approved an internal contradiction.
Codex recommends Andy clarify, before any further implementation:
1. Can a genuinely validated Tier-2-only call support core/standard, or
   is Tier 1 mandatory?
2. Can Tier-4-only evidence originate a small/review play, or must Tier 4
   always accompany higher-tier grounding?

### P2 — Stage 6's committee-merge checklist item is overstated

The checklist marks the Stage 1 → Skeptic → Risk/Editor merge, `entry_plan`,
and `rankByAxis()` item complete. But the Stage 6 mock returned Stage 2
`{verdicts: []}` and Stage 3 `{finalized: [], passes: []}` — this exercises
only the no-op/fallthrough route. It does NOT demonstrate: Skeptic
hold/downgrade/kill application, Risk/Editor tier or review updates, the
monotonic review-flag merge under an actual editor response,
`entry_plan.scale_in` propagation, Risk/Editor passes, or meaningful
ranking changes. No focused tests currently reference
`applySkepticVerdicts()` or `applyRiskEditor()`. Does not negate the
evidence-tier artifact result, but Stage 6 as defined in the checklist is
not fully complete.

Previously recorded limitations also remain accurate: resolved Tier-3/
Tier-4 evidence not exercised end-to-end; `partitionSimPriceOnly()` not
exercised end-to-end; the mock harness unavailable for independent
inspection (was deleted after the run); the unreachable `roster_churn`/
`adjacent_signals`/`experts` acceptance check carried into Stage 6 but not
actually exercised.

## What DID verify cleanly

- The five requested suites passed exactly 91/91: `evidenceTierGate` (36),
  `boardValidate` (25), `boardValidateNamedPlayerGate` (11),
  `namedStatusReviewSizingGates` (12), `dataGatheringSprint` (7).
- Scoped lint: zero errors.
- Nothing staged; staged diff empty.
- No new session commit exists. `HEAD` remains `0fc6112`, one commit
  ahead of `origin/main`; that commit predates rounds 3/4.
- `git diff --check` clean.
- `portfolio-synthesize.js` last modified before the round-3 handoff and
  before round 4/Stage 6 — consistent with round 4 and Stage 6 not
  touching it.
- The round-3 import and tail enforcement changes are present in the
  expected locations.
- The Stage 6 addendum and checklist accurately record Codex's own
  Dolphins correction and exacta/Tier-3/Tier-4 qualifications from the
  prior review.

**Caveat on scope**: git cannot independently prove a historical "no
later changes" claim — no round-3 content hash or surviving pre/post-round
baseline exists. The repo has ~21 tracked modifications and ~377
untracked entries, so a general claim that every dirty path is documented
cannot be established from the three reviewed handoffs alone. The
previously-flagged untracked `.env` backup and Yahoo credential file also
remain present (pre-existing, unrelated to this work).

## Disposition (Codex's explicit recommendation)

**Do not carry forward "Stage 5/6 fully closed" or "enforcement mechanics
fully verified."** Reopen Stage 5 narrowly to:

1. Resolve the two prose-policy contradictions with Andy (Tier-1-vs-
   Tier-1-or-2 for core/standard; Tier-4-only origination vs. Tier-4-as-
   color-only).
2. Replace root-only qualification with substantive path/shape
   validation (a resolved field under an allowed root is not
   automatically substantive — `lean.n`, `dvoa.snapshot_at`, etc. need to
   be excluded specifically, likely via a more granular allow-list or an
   explicit denylist of metadata leaf fields under each Tier-1/2 root).
3. Preserve and mechanically validate timestamps for Tier-2 lean
   evidence — currently the dossier producer strips them entirely, so
   "dated call" cannot be enforced even in principle until
   `portfolio-dossier.js` is fixed to retain them.
4. Add regressions for `lean.n`, `lean.avg_strength`, metadata-only
   Tier-1 descendants (the 8 examples above), and a legitimate fully
   formed Tier-2 citation (once timestamps are restored).
5. Correct the checklist's Stage 6 merge-logic status (mark it
   incomplete/no-op-only, not done).
6. Rerun a better mock matrix before restoring closure — one that
   actually exercises Skeptic hold/downgrade/kill and Risk/Editor
   updates, not just the fallthrough path.

No files were changed, staged, committed, or pushed, and no model or
database calls were made during this review.

## Standing guardrails (unchanged, still honored)

No `git add -A`/staging/commit/push without Andy's explicit approval. No
Supabase writes. No paid committee synthesis. No betting picks/
official-pick promotions/portfolio mutations. No Yahoo Fantasy work.
Worktree preserved (no reset/stash/clean/revert).
