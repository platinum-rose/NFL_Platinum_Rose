# Codex review request -- Stage 5 SOURCE HIERARCHY, round 6 (2026-09-09)

## Context

Your round-5 review found round 5's fixes were real but incomplete: two
P1 bypasses IN the new round-5 code, plus a pre-existing P1 gap
(hedge_baskets/parlay_ladders) round 5 never touched, plus P2
prose/comment drift. Round 6 addresses all three P1s (two by fixing the
code, one by an explicit policy decision from Andy) and the P2 prose
issues. One P2 remains deliberately deferred, same as last round.

Full round-5 review-response detail is in
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`'s
"Round 6" section (right before "Andy's SOURCE HIERARCHY prose
sign-off", which now carries a SUPERSEDED marker on the old entry).

## What round 6 changed

### 1. [Fixed] Tier-1 metadata bypass (your P1 #1)

You found round 5's `TIER1_METADATA_LEAF_DENYLIST` checked only the
`root.child` shape (2 segments) against 8 hardcoded full paths, and
broke on: deeper nesting (`player_availability.key_returns[0].source`,
`.published_at` -- 3+ segments), a dynamic middle key per sportsbook
(`books.betmgm.source_row_id`, `.observed_at`, `.availability_status` --
no static enumeration could cover every book), and new leaf names
(`analytics.is_current_season`, `analytics.seasons_behind`,
`dvoa.season`, `dvoa.source_key`, `dvoa.attribution_note`, `sim.source`,
`sim_win_total.source`).

**Fix**: replaced the root.child full-path denylist with a LEAF-NAME
denylist (`TIER1_METADATA_LEAF_NAME_DENYLIST` in
`agents/lib/board-validate.js`), checked against the path's LAST segment
via a new `pathSegments()` helper -- depth-agnostic and dynamic-key-
agnostic by construction, since it doesn't matter how deep a field is
nested or what the intermediate keys are, only what the leaf is actually
called. Consolidated denylist: `season`, `seasons_behind`,
`is_current_season`, `source`, `source_key`, `source_name`,
`source_row_id`, `attribution_note`, `staleness_note`, `freshness`,
`snapshot_at`, `observed_at`, `published_at`, `availability_status`.

Verified all 12 of your specific repro examples now return `null`, AND
verified real substantive fields sharing the same roots (`player_
availability.key_returns[0].status`, `books.betmgm.price`, `sim.
win_prob`) still correctly classify Tier 1 -- the fix doesn't overreach.
**Please stress-test this leaf-name list again** -- same spirit as
before, we don't have full confidence it's exhaustive, just that it's a
structurally more robust approach than round 5's.

### 2. [Fixed] `partitionTier4Only()` bypassable with non-evidence (your P1 #2)

You found: `isTier4OnlyCandidate()` required `resolved.every(...)` to be
Tier 4, so (a) adding one resolved non-qualifying citation (`team`, or
an unrecognized field) alongside a Tier-4 one flipped `every()` to
false and let it through, and (b) an UNRESOLVED Tier-4-only citation
(zero resolved evidence) also slipped through because `resolved.length
=== 0` short-circuited before checking what was cited.

**Fix**: implemented your own corrected predicate exactly -- a candidate
is Tier-4-originated if it cites Tier 4 AT ALL (resolved or not) AND has
no resolved, qualifying Tier 1/2/3 support. Added regression tests for
all four of your probe cases plus the one you confirmed was already
correct (Tier 4 + resolved Tier 3 -> kept).

### 3. [Resolved by decision, not code] hedge_baskets/parlay_ladders evidence gap (your P1 #3)

Confirmed your finding exactly: their output schema
(`agents/portfolio-synthesize.js` ~line 291) has no `evidence_ids`
field, and `validateParlayLadder()`/`validateHedgeBasket()` (~line 2314)
only resolve legs against dossier prices, no evidence-tier check at all.

**Andy's explicit decision**: exempt them as scenario structures, not
add evidence enforcement. Rationale: they're insurance/combo structures
built around theses that, if core/standard, are already evidence-gated
on the primary candidates list -- not new standalone plays needing their
own citation trail. This is now documented as a DELIBERATE decision, not
a silent gap: a new "SCOPE" sentence in SYSTEM_PROMPT's GUARDED POLICY
paragraph states the exemption explicitly (and that real evidence should
still inform the thesis prose where available -- the exemption is from
mechanical enforcement only), and matching code comments sit directly
above both validator functions so a future review sees this as
intentional. **Flagging for your judgment**: does this rationale hold up
adversarially, or does it understate the risk (e.g. could a hedge basket
effectively smuggle in a Tier-4-only "play" that the primary-list gates
would have blocked, just wrapped as insurance)? We'd rather hear now if
the exemption itself is the wrong call than have it stand unchallenged.

### 4. [Fixed] P2 prose/comment/log inconsistencies

- SYSTEM_PROMPT: "all fields under these containers count as Tier 1"
  (which contradicted the metadata denylist) now carries an explicit
  EXCEPTION clause naming identity/provenance/freshness metadata.
  "This is about relative weight, not exclusion" now explicitly scopes
  itself to sit BELOW the hard Tier-1-mandatory/Tier-4-exclusion rules.
- Stale "Tier 1/2" language (from before round 5 made Tier 2 alone
  non-qualifying) fixed in `board-validate.js` (`evidenceTierViolations`
  docstrings + its violation-message text) and `portfolio-synthesize.js`
  (pipeline-tail comments + the `evidence-tier gate` console.log line).
- The old checklist "APPROVED AS-IS 2026-09-09" sign-off entry is now
  marked SUPERSEDED in place (struck through, preserved for history, not
  deleted) with an explicit note that Andy approved the corrected round-
  5/6 prose, not the self-contradictory text that entry describes.

### 5. [Deliberately deferred again] Tier 2 still syntactic, not semantic

Your P2: any `lean.samples[...]` citation qualifies as Tier 2 regardless
of whether that specific sample has a real name/date/direction (an
isolated `.who` alone still counts). Since Tier 1 is mandatory this
can't unlock core/standard by itself, but it can still support a
small/speculative play "underneath" Tier 4 without being genuine
corroboration. Not fixed because the LLM-normalization signal path
(`normalizeBatch()`) still doesn't carry timestamps at all -- a hard
"must have a real date" mechanical check right now would disqualify most
Tier-2 citations from that lane. Flagging to you again rather than
letting it go unremarked a second round.

**Verification**: `node --check` clean on both changed files (`agents/
lib/board-validate.js`, `agents/portfolio-synthesize.js`); scoped eslint
zero errors; full focused suite 118/118 passing (107 from round 5 + 11
new regression tests reproducing your exact probe cases for both P1
code fixes). Nothing staged, committed, or pushed.

## What we'd like from you

1. Do the two code fixes (metadata leaf-name denylist, corrected
   Tier-4-only predicate) actually close your P1 #1 and #2, or does a
   fresh adversarial probe find another angle?
2. Is the leaf-name denylist list complete, or is there a metadata
   pattern it still misses?
3. React to Andy's hedge_baskets/parlay_ladders exemption decision
   specifically -- is the rationale sound, or does it leave a real
   exploitable gap the "insurance, not a standalone play" framing
   glosses over?
4. Anything else a cumulative read of round 6 turns up.

Same ask as last time: please don't say "closed" unless you mean it --
tell us plainly if there's a round 7 needed.
