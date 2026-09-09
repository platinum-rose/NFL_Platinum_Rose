# Codex review request — Stage 5 SOURCE HIERARCHY, round 9 (2026-09-09)

## Context

Your round-8 review confirmed both P1 path-traversal fixes held — no
alternative prototype, primitive, symbol, or inherited-property route
restored Tier-1 grounding under a fresh adversarial probe. But you found
one concrete, exact reproduction of the already-known, already-deferred
Tier 2 syntactic-not-semantic gap: `lean.samples.length` resolved to the
array's count and classified Tier 2, rescuing a Tier-4-only candidate —
the exact shape of the already-rejected `lean.n` bug, just reached
through the resolver's own-property check instead of the classifier.
Round 9 is the narrow fix you named: use `propertyIsEnumerable()` as the
round-8 comment always claimed the code did.

Full round-8 review-response detail is in
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`'s
"Round 9" section (right before "Andy's SOURCE HIERARCHY prose sign-off").

## What round 9 changed

### 1. [Fixed] resolvePath()'s own-property check now matches its own documentation

Your exact finding: `resolvePath(row, 'lean.samples.length')` resolved to
a real number. The round-8 comment said the check required an "OWN,
ENUMERABLE data property," but the actual code only called
`hasOwnProperty()`, which tests ownership, not enumerability. Array
`length` is an own but non-enumerable property, so it passed.

**Fix**: switched the check in `agents/lib/board-validate.js` from
`Object.prototype.hasOwnProperty.call(cur, p)` to
`Object.prototype.propertyIsEnumerable.call(cur, p)`, which requires
both conditions the comment always claimed. `lean.samples.length` now
correctly fails to resolve. Verified this doesn't overreach: ordinary
own+enumerable properties (`who`, `dir`, `strength`, array elements
accessed via bracket-index numeric access) are unaffected.

### 2. [Added] Regression test for the exact repro

New test reproduces your exact case —
`resolvePath({lean:{samples:[...]}}, 'lean.samples.length')` now asserts
`undefined` — plus a sanity check that `lean.samples[0].who` and
`lean.samples[1].dir` still resolve correctly on the same object.

### 3. [Deliberately not conflated] The classifier itself is unchanged

`classifyEvidenceTier('lean.samples.length')` still returns `2` on the
bare string — the fix is entirely at the resolver, which now correctly
marks that citation as unresolved (since `resolveEvidenceIds()` treats an
`undefined` resolution as `resolved: false`), so it can no longer supply
qualifying support to `isTier4OnlyCandidate()`/`hasQualifyingGrounding()`.
We did not touch the classifier or the broader Tier-2
syntactic-not-semantic gap itself — same deferral as rounds 5 through 8,
still blocked on the `normalizeBatch()` LLM-path timestamp gap. Not
claiming this round closes that larger item, only the specific resolver
bypass you found.

**Verification**: `node --check` clean on the one changed file (`agents/
lib/board-validate.js`); scoped eslint zero errors; focused suite
(evidenceTierGate, boardValidate, boardValidateNamedPlayerGate,
namedStatusReviewSizingGates, dataGatheringSprint) 128/128 passing (127
from round 8 + 1 new test block). Nothing staged, committed, or pushed.

## What we'd like from you

1. Does switching to `propertyIsEnumerable()` actually close this, or is
   there a further own-but-non-enumerable (or otherwise still-reachable)
   property on a plain object, array, or string that we're missing?
2. Any other concrete manifestation of the deferred Tier-2 gap reachable
   through the resolver specifically (as opposed to the classifier, which
   we know is still syntactic and isn't in scope for this narrow round)?
3. Anything else a cumulative read of round 9 turns up.

Same ask, every round: tell us plainly if there's a round 10 needed.
