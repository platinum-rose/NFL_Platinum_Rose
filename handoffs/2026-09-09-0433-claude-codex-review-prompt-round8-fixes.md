# Codex review request — Stage 5 SOURCE HIERARCHY, round 8 (2026-09-09)

## Context

Your round-7 review confirmed round 7's named-example fixes held, but
found the underlying mechanism was still structurally bypassable — not by
a missing leaf name this time, but by how path traversal works at all.
Two P1s: (1) classification only checked the FINAL path segment against
the metadata denylist, so appending a further property to a denied field
(`.length`, `.0`) restored Tier-1 classification; (2) `resolvePath()` used
unrestricted `cur[p]` access, so a citation path could walk the JS
prototype chain (`.constructor`, `.toString`, `.__proto__`) and resolve to
a real value. You recommended fixing path ancestry and safe own-property
resolution, not adding more denylist names. Round 8 does exactly that.

Full round-7 review-response detail is in
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`'s
"Round 8" section (right before "Andy's SOURCE HIERARCHY prose sign-off").

## What round 8 changed

### 1. [Fixed] classifyEvidenceTier() checks every path segment, not only the last

Your exact finding, all reproduced and confirmed before fixing:
`analytics.staleness_note.length`, `dvoa.source_name.length`, `injuries.
freshness.length`, `books.betmgm.source_row_id.length`, and `analytics.
staleness_note.0` all resolved to real values and classified Tier 1 —
because the old check (`agents/lib/board-validate.js`) only looked at the
final segment (`length`, `0`), which isn't itself a denied name, while
ignoring that a denied name sat earlier in the same path.

**Fix**: `classifyEvidenceTier()` now returns `null` if ANY segment along
the path matches `TIER1_METADATA_LEAF_NAME_DENYLIST`, not just the last
one. A denied field can no longer be laundered back to Tier 1 by reading
a further property off of it.

### 2. [Fixed] resolvePath() hardened against prototype-chain and terminal-value traversal

Your exact finding: `analytics.constructor`, `analytics.toString`, and
`analytics.__proto__` all resolved via unrestricted `cur[p]` access.
Separately (same root issue as #1, at the resolver level rather than the
classifier): `.length`/`.0` on an already-resolved string primitive read a
JS-level property rather than failing to resolve.

**Fix**, two restrictions in `resolvePath()`:
- Traversal is only allowed into a plain object or a real array. Once
  `cur` is a primitive (string/number/boolean), it's terminal — a further
  segment fails to resolve (closes the `.length`/`.0` bypass at the
  resolver level too, independent of the classifier fix above).
- A string-keyed segment must be an actual OWN, enumerable data property
  (`Object.prototype.hasOwnProperty.call(cur, p)`), and `__proto__`/
  `constructor`/`prototype` are rejected outright regardless of what
  `hasOwnProperty` would report about them.

**Also**: `resolvePath()` moved from `agents/portfolio-synthesize.js` into
`agents/lib/board-validate.js`. It was a private helper in a file that
runs a top-level IIFE on import, which meant it could never be unit
tested directly — every prior round's coverage of it was zero. It's now
exported and imported back into `portfolio-synthesize.js`; the one real
call site (`resolveEvidenceIds()`) is unchanged in behavior, just in
import source.

### 3. [Added] Regression tests for both fixes

Every one of your exact probe strings now has a test asserting the
correct rejected outcome: `analytics.staleness_note.length`, `dvoa.
source_name.length`, `injuries.freshness.length`, `books.betmgm.
source_row_id.length`, `analytics.staleness_note.0` (classifier, all
`null`), and `analytics.constructor`, `analytics.toString`, `analytics.
__proto__`, `analytics.hasOwnProperty`, `analytics.prototype` (resolver,
all `undefined`). Plus sanity checks: ordinary nested-path and
array-index resolution (`lean.samples[0].who`, `player_availability.
key_returns[0].status`) is unaffected, out-of-range/negative array
indices still fail cleanly, and a merely-missing (not malicious) property
still resolves to `undefined` rather than being treated as an attack.

### 4. [Noted, not changed] Your P2/accepted-risk reclassification

You reclassified the hedge/parlay exemption from "implementation bypass"
to "deliberate policy exception" now that the wording is honest, with no
code change requested — just a recommendation Andy revisit it before
scenario outputs become actionable betting proposals. Recorded in the
checklist as accepted, not left as an open item.

### 5. [Confirmed, not changed] games_sample judgment call

You confirmed `coaching_profile.games_sample` staying Tier 1 is
defensible and consistent with the `n_books` precedent, and said not to
denylist it. No change made.

**Verification**: `node --check` clean on both changed files (`agents/
lib/board-validate.js`, `agents/portfolio-synthesize.js`); scoped eslint
zero errors; focused suite (evidenceTierGate, boardValidate,
boardValidateNamedPlayerGate, namedStatusReviewSizingGates,
dataGatheringSprint) 127/127 passing (121 from round 7 + 6 new test
blocks). Nothing staged, committed, or pushed.

## What we'd like from you

1. Do the every-segment denylist check and the hardened `resolvePath()`
   actually close both P1s, or does a fresh adversarial probe find
   another path-traversal angle (a different prototype property, a
   different way to reach a primitive's own properties, symbol keys,
   etc.)?
2. Is moving `resolvePath()` into `board-validate.js` (for testability) a
   reasonable structural choice, or does it raise a concern we're missing?
3. Anything else a cumulative read of round 8 turns up.

Same ask, every round: tell us plainly if there's a round 9 needed.
