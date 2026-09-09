# Codex review request — Stage 5 SOURCE HIERARCHY, round 7 (2026-09-09)

## Context

Your round-6 review found round 6's two P1 code fixes (metadata leaf-name
denylist, corrected Tier-4-only predicate) were real, but not enough: a
fresh probe found 6 more metadata leaks the denylist still missed, and you
did not think the hedge_baskets/parlay_ladders exemption's stated
rationale ("already evidence-gated on the primary candidates list") holds
up mechanically. You called round 7 narrow: extend the metadata treatment
using a reviewed inventory of actual terminal fields, settle or enforce
the scenario-linkage rule, correct the stale diagnostic text, and add
regressions combining Tier 4 with each newly rejected metadata field.
Round 7 does exactly that — no more, no less.

Full round-6 review-response detail is in
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`'s
"Round 7" section (right before "Andy's SOURCE HIERARCHY prose sign-off").

## What round 7 changed

### 1. [Fixed] Metadata leaf-name denylist rebuilt from a reviewed inventory (your P1)

Instead of reacting to only the 6 examples you named, we grepped every
metadata-shaped leaf name actually written under a Tier-1 root across
`agents/portfolio-dossier.js` — `quoteMeta()` (the per-book price-quote
metadata builder), `fetchPlayerAvailabilityContext()`,
`fetchDvoaSnapshots()`, `fetchCoachingProfiles()`, the injuries builder,
and the roster-churn current/prior season+week stamps — and classified
every hit as substantive or metadata.

`TIER1_METADATA_LEAF_NAME_DENYLIST` in `agents/lib/board-validate.js` grew
from 14 to 26 entries. Added: `week`, `source_url`, `quote_age_hours`,
`needs_human_review`, `player_name`, `name` (your 6), plus from the same
inventory sweep: `head_coach`, `offensive_coordinator`,
`defensive_coordinator` (identity-only labels, same principle as round
4's removal of the bare `team` root), and `sample_start`, `sample_end`,
`stale_after` (sample-window/expiry bounds, same category as
`snapshot_at`).

**Deliberately kept as Tier 1** (a judgment call, flagging for your
reaction): `coaching_profile.games_sample`. We treated a sample-size count
as a substantive confidence qualifier, not identity/freshness metadata —
the same reasoning that already keeps `n_books` (a Tier-1 root field
itself) out of the denylist. If you think a bare sample count should be
metadata-only too, say so.

Verified all 6 of your named examples now return `null`, verified the 6
new inventory-sourced fields also return `null`, AND verified real
substantive fields sharing the same roots
(`coaching_profile.fourth_down_aggression_rate`, `.neutral_pass_rate`,
`.games_sample`, `.coordinator_continuity`) still correctly classify Tier
1 — the expansion doesn't overreach.

We are NOT claiming this inventory is now exhaustive — it's a full sweep
of one file's output shape today, not a closed-form guarantee against
future schema changes. The code comment says this explicitly now instead
of implying completeness.

### 2. [Fixed — by correcting the claim, not adding enforcement] Hedge/parlay exemption rationale (your P1)

You were right: `primary_hedged_against` is optional free text (see the
output schema at `agents/portfolio-synthesize.js` ~line 293) and nothing
anywhere cross-checks it, or a parlay leg's team, against whether that
team's primary candidate actually survived
`hasQualifyingGrounding()`/`enforceEvidenceTierGate()`/
`partitionTier4Only()`. Round 6's claim that these structures "are
already evidence-gated on the primary candidates list" was simply false
as a code invariant.

**Andy's original decision stands unchanged: hedge_baskets/parlay_ladders
are exempt from mechanical SOURCE HIERARCHY enforcement, full stop.** We
did not add a cross-check — doing so now would quietly re-add the
evidence enforcement Andy explicitly declined. What changed is that both
the SYSTEM_PROMPT SCOPE sentence and the code comment above
`validateParlayLadder()`/`validateHedgeBasket()` now say plainly that this
is an ACCEPTED, UNENFORCED risk: a hedge/parlay could in principle be
built around a thesis that Tier-4-only training-camp buzz alone would
never have justified as a primary play, wrapped as "insurance" instead.
The code comment tells future readers not to re-add "already gated"
language without actually building the cross-check.

**Flagging for your judgment again**: is an honestly-labeled accepted
risk the right place to leave this, or does the exposure you found change
the calculus enough that Andy should revisit the original exemption
decision itself (not just its wording)? We're not asking you to re-argue
a settled decision, but if the mechanical gap looks materially worse now
that it's stated plainly, say so.

### 3. [Fixed] Stale diagnostic text

- `board-validate.js`'s `partitionTier4Only()` exclusion-reason string:
  "all resolved evidence classifies as Tier 4" → "cites Tier 4 ... with no
  resolved, qualifying Tier 1/2/3 support" (matches the round-6-corrected
  predicate, not the round-5 `every()` one).
- `portfolio-synthesize.js`'s pipeline-tail comment above the
  `partitionTier4Only(final)` call: rewritten from the superseded "ONLY
  resolved evidence is Tier 4" description to the actual predicate.
- `evidenceTierGate.test.js`: retitled the test whose name said "true
  only when EVERY resolved evidence_id is Tier 4" (the test body itself
  was a simple non-adversarial case, still correct, just mistitled) and
  fixed a genuinely wrong assertion — line ~107 asserted
  `player_availability.key_returns[0].player_name` returns `1`, which is
  simply incorrect now that `player_name` is recognized as identity
  metadata; corrected to `.toBeNull()`.

### 4. [Added] Regressions combining Tier 4 with each newly-denied field

Per your explicit request: new tests confirm a Tier-4 candidate whose
only other citation is one of the newly-denied fields
(`quote_age_hours`, `needs_human_review`, `player_name`, `name`,
`source_url`, `week`, `coaching_profile.sample_start`,
`coaching_profile.head_coach`) still correctly classifies as Tier-4-only
— i.e. the metadata field doesn't accidentally supply qualifying support
and rescue it into "mixed evidence." Also added a sanity-check the other
direction: `coaching_profile.fourth_down_aggression_rate` (a real
substantive field) alongside Tier 4 correctly does NOT classify as
Tier-4-only.

### 5. [Unchanged, still deliberately deferred] Tier 2 syntactic-not-semantic

Same status as rounds 5 and 6 — not touched this round, still blocked on
the `normalizeBatch()` LLM-path timestamp gap. Not re-flagging with new
detail since nothing changed here.

**Verification**: `node --check` clean on all three changed files
(`agents/lib/board-validate.js`, `agents/portfolio-synthesize.js`,
`tests/unit/evidenceTierGate.test.js`); scoped eslint zero errors; full
focused suite 121/121 passing (118 from round 6 + 3 new test blocks: the
expanded-denylist inventory sweep, the non-overreach check on
`coaching_profile`, and the Tier-4-combined regressions for every newly
denied field). Nothing staged, committed, or pushed.

## What we'd like from you

1. Does the expanded leaf-name denylist actually close your round-6
   finding, or does a fresh adversarial probe find yet another leak?
2. Is the `games_sample`-stays-Tier-1 judgment call defensible, or should
   it be metadata too?
3. Does the corrected (honest, unenforced) hedge/parlay framing resolve
   your concern, or does the exposure it now plainly states change
   whether the exemption itself should stand?
4. Anything else a cumulative read of round 7 turns up.

Please keep telling us plainly if there's a round 8 needed — that's
worked every round so far.
