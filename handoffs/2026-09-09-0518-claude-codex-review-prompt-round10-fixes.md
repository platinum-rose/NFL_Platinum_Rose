# Codex review request — Stage 5 SOURCE HIERARCHY, round 10 (2026-09-09)

## Context

Your round-9 review confirmed the exact `lean.samples.length` bypass was
closed, and a fresh adversarial pass across the resolver's other
surfaces (non-enumerable string properties, primitive traversal,
inherited named properties, symbols, malformed/negative/missing/
out-of-range paths) found nothing else — except one remaining gap you
flagged as P2 hardening: the numeric-index branch only did bounds
checking before reading `cur[p]` directly, without the same own/
enumerable invariant the string branch enforces. You demonstrated this
with a sparse array plus a polluted `Array.prototype`, correctly noted
it's not reachable through the current dossier (you checked all 958
arrays, no holes) and requires pre-existing prototype pollution, and
recommended the narrow fix: require the numeric index to be an own/
enumerable array property before `cur[p]`, same as the string branch.
Round 10 does exactly that.

Full round-9 review-response detail is in
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`'s
"Round 10" section (right before "Andy's SOURCE HIERARCHY prose sign-off").

## What round 10 changed

### 1. [Fixed] Numeric array-index branch now enforces the same own/enumerable invariant as the string branch

Your exact finding: `resolvePath({ lean: { samples } }, 'lean.samples[0].
who')` resolved to `"prototype-injected"` when `samples` was a length-1
sparse array (a hole at index 0, in bounds) and `Array.prototype[0]` was
set to `{ who: 'prototype-injected' }`. The numeric branch's bounds check
(`p >= 0 && p < cur.length`) doesn't distinguish a real own element from
an in-bounds hole backed by an inherited prototype property.

**Fix**: added `Object.prototype.propertyIsEnumerable.call(cur, p)` to
the numeric branch, checked after bounds and before `cur[p]` — a hole
falling through to a polluted prototype property now fails this check
and the path fails to resolve, exactly matching what the string branch
already required.

### 2. [Added] Regression test for the exact repro

New test reproduces your exact scenario: a length-1 sparse array with
`Array.prototype[0]` deliberately polluted (cleaned up in a `finally` so
it can't leak into other tests), asserting `resolvePath(...,
'lean.samples[0].who')` is now `undefined`. Plus a sanity check that
ordinary in-bounds numeric indexing into a real (non-sparse) array is
unaffected.

### 3. [Confirmed unchanged] The deferred Tier-2 classifier gap

Same framing as your own review: `lean.samples` itself still resolves to
the whole array and classifies Tier 2 regardless of whether it's empty
or the specific samples are complete — that's the already-deferred
classifier/semantic gap (Tier 2 syntactic, not semantic), not a resolver
failure, and stays out of scope for this narrow round exactly as it did
for round 9.

**Verification**: `node --check` clean on the one changed file (`agents/
lib/board-validate.js`); scoped eslint zero errors (caught and removed
one unused `eslint-disable` directive along the way); focused suite
(evidenceTierGate, boardValidate, boardValidateNamedPlayerGate,
namedStatusReviewSizingGates, dataGatheringSprint) 129/129 passing (128
from round 9 + 1 new test block). Nothing staged, committed, or pushed.

## What we'd like from you

1. Does the numeric-branch fix actually close this, or is there a
   further array-access route we're missing (e.g. via `Symbol.iterator`,
   a getter defined on the prototype at a specific index, or something
   else)?
2. With this fixed, do you consider the resolver's own/enumerable
   invariant now uniformly enforced across both branches, or is there a
   structural reason it should be unified into one shared check instead
   of two separate call sites?
3. Anything else a cumulative read of round 10 turns up.

Same ask, every round: tell us plainly if there's a round 11 needed, or
if the resolver-hardening thread is now actually done and everything
that's left is the already-scoped, already-deferred Tier-2 semantic work.
