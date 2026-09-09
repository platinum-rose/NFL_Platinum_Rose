# Codex review request — Stage 5 SOURCE HIERARCHY, round 5 (2026-09-09)

## Context

Your last review (final cumulative session-close check) found the Stage 5
"guarded-with-enforcement" evidence-tier policy was NOT clean despite four
implementation rounds and a Stage 6 mock run all having missed it. Full
detail: `handoffs/2026-09-09-0100-codex-final-review-stage5-reopened-handoff.md`
and the "REOPENED 2026-09-09" section of
`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`.

Andy has now answered both open policy questions, and round 5 implements
your fix list plus one additional finding Andy surfaced himself. Please
review the round-5 diff (nothing committed -- working tree only) against
both his answers and your own recommendations, and tell us if it's clean
or if there's another gap.

## Andy's policy answers (resolve the P1 prose contradiction)

1. **Tier 1 is mandatory for core/standard.** A genuinely valid, dated
   Tier 2 citation no longer suffices alone -- tightens the original
   "Tier 1 OR 2" guarded policy to "Tier 1, period."
2. **Tier 4 can never originate a play, at any stake size** -- not even
   small/speculative. It may only add color to a thesis already grounded
   in Tier 1/2/3. This is stricter than Tier 3, which still may originate
   a small/speculative, flagged play alone (unchanged from the original
   policy).

## What round 5 changed

### 1. `classifyEvidenceTier()` (`agents/lib/board-validate.js`)

- `lean.*` aggregate/count fields (`lean.n`, `lean.avg_strength`,
  `lean.back`/`fade`/`over`/`under`) no longer classify as Tier 2. Only a
  citation of an actual `lean.samples[...]` entry does. This directly
  closes your repro (`lean.n = 1` passing as a "named, dated call").
- New `TIER1_METADATA_LEAF_DENYLIST`, checked at the `root.child` path
  shape (not deeper, not root-only): `analytics.season`,
  `analytics.staleness_note`, `dvoa.source_name`, `dvoa.snapshot_at`,
  `injuries.freshness`, `player_availability.snapshot_at`,
  `prediction_markets.snapshot_at`, `prior.season`. These now return
  `null` (non-qualifying) instead of inheriting their root's Tier 1
  status. **Please check this denylist is exhaustive against the current
  dossier shape** -- we scoped it to exactly the 8 fields you named; if a
  path-level scan turns up more provenance/freshness-only descendants
  under `analytics`/`dvoa`/`coaching_profile`/`schedule_context`/
  `officiating_context`/`clv_signal`/`injuries`/`player_availability`/
  `prediction_markets`/`prior`/`sos`/`roster_churn`/`adjacent_signals`,
  they're not yet covered.

### 2. `hasQualifyingGrounding()` -- Tier 1 now mandatory

Changed from `t === 1 || t === 2` to `t === 1` only. This alone also
structurally closes the `lean.n` bypass a second, independent way: even
if a `lean.*` field somehow still classified as Tier 2, Tier 2 no longer
qualifies a candidate for core/standard by itself.

### 3. New `isTier4OnlyCandidate()` / `partitionTier4Only()`

Mirrors the existing `partitionSimPriceOnly()` exclude-with-reason
pattern rather than inventing a new mechanism. A candidate whose only
resolved evidence is Tier 4 is excluded from `final` entirely (not
capped to small/speculative -- that treatment is what the policy allows
for Tier-3-only, and we didn't want Tier-4-only silently inheriting it).
Wired into `agents/portfolio-synthesize.js`'s pipeline tail immediately
after `partitionSimPriceOnly()`, before the `enforceEvidenceTierGate()`
call. **Open question for you**: is hard exclusion the right mechanical
treatment here, or should Tier-4-only still surface somewhere (e.g. a
`watchlistReview`-style side list) rather than disappearing from every
downstream artifact the way `simExcluded`/`tier4Excluded` currently do?
We didn't audit `hedge_baskets`/`parlay_ladders` legs or `watchlistReview`
for the same exposure -- `partitionSimPriceOnly()`'s own docstring notes
those arrays are separate and untouched, and we left that scope as-is.

### 4. SOURCE HIERARCHY prose (`agents/portfolio-synthesize.js` SYSTEM_PROMPT)

Rewrote the TIER 2 description, GUARDED POLICY paragraph (~line 218),
and the sizing-guidance restatement (~line 671) to state both of Andy's
rules without contradiction. Please confirm the new wording actually
matches the code behavior above -- this is exactly the kind of
prose/code drift your review caught last time.

### 5. Timestamp passthrough fix (Andy's own follow-up finding)

Andy asked whether the 0-of-348-samples-have-a-timestamp result might be
a transform-layer bug rather than genuinely absent source data. We
traced it and confirmed: **it's a transform bug, not missing data.**

- `agents/signal-normalize.js`'s `gatherPickSignalRows()` queries
  `research_pick_signals` with `captured_at` explicitly in the
  `.select()` (line ~241) but never copied it into the row object it
  built -- now fixed, `captured_at: r.captured_at || null` added.
- Same file's `gatherHostSummaryRows()` queries `podcast_host_summaries`
  with `created_at` (line ~157) with the same drop -- now fixed with
  `captured_at: r.created_at || null`.
- `agents/portfolio-dossier.js`'s own separate `fetchPickSignals()`
  (used by the inline-fallback lean layer, `buildLeanView()`) also
  selects `captured_at` and dropped it in the `add()` helper -- fixed,
  now threading `captured_at`/`created_at`/`pub_date` from each of the
  three source shapes (pick signals, user picks, podcast picks) into
  each sample.
- `makeNormalizedFindLean()` (portfolio-dossier.js, the path that
  actually builds the 348 samples you inspected) now carries
  `s.captured_at` through into `lean.samples[*].captured_at`.

**NOT fixed, flagged explicitly**: `normalizeBatch()` (the LLM-
normalization path in signal-normalize.js) never captured a date on its
source `items` in the first place -- that's one level further upstream
(wherever `items.push({ source_type, source_ref, raw_text, author })` is
built for article/podcast_intel/podcast_pick/expert_pick sources). We
left a NOTE comment at that call site rather than fabricate a date.
Since `research_pick_signals`/`podcast_host_summaries` (the two paths we
did fix) are pre-classified and don't go through `normalizeBatch()`, we
believe this gap is scoped to the LLM-classified minority of signals,
but haven't measured what fraction that is in the live dossier.

Since Tier 1 is now mandatory, this timestamp fix no longer affects
whether a candidate can reach core/standard -- but it's still needed for
Tier 2 classification to mean what the prose says, for report/reviewer
legibility, and per your original recommendation #3.

### 6. Stage 6 checklist correction

Marked the "Confirm Stage 1 -> Skeptic -> Risk/Editor merge logic" item
back to `[ ]` (was `[x]`) with your P2 finding recorded verbatim as the
reason. Not re-run yet -- item 6 of your list (a better mock matrix
exercising real hold/downgrade/kill and tier/review updates) is still
open.

### 7. Regression tests

Added 16 new tests to `tests/unit/evidenceTierGate.test.js`: the
lean-aggregate-vs-sample classification split, all 8 metadata-leak
fields (both directions -- denied AND their sibling substantive fields
still passing), the `hasQualifyingGrounding` Tier-1-mandatory change
(including your exact `lean.n`-only repro, now closed), and the full
`isTier4OnlyCandidate`/`partitionTier4Only` behavior. Updated one
pre-existing test that asserted the now-superseded "Tier 2 alone
qualifies" behavior, with a comment explaining why.

**Verification run**: `node --check` clean on all 4 changed source
files; scoped eslint (`board-validate.js`, `portfolio-synthesize.js`,
`signal-normalize.js`, `portfolio-dossier.js`) zero errors; full focused
suite 107/107 passing (`evidenceTierGate` 52, `boardValidate` 25,
`boardValidateNamedPlayerGate` 11, `namedStatusReviewSizingGates` 12,
`dataGatheringSprint` 7).

## What we have NOT done (please flag if any of this should block closure)

- The `normalizeBatch()` LLM-path timestamp gap (S5 above).
- A fresh Stage 6 mock matrix with real (non-empty) Stage 2/3 responses
  exercising Skeptic hold/downgrade/kill and Risk/Editor tier/review
  updates -- your item 6, still outstanding.
- No live/paid model run of any kind. No git add/commit/push. No
  Supabase writes.
- We have not re-scanned the full historical `.raw.json` corpus (33
  files) or the live dossier against the corrected classifier to
  produce fresh prevalence numbers post-fix -- happy to if useful for
  your review, just say so.

## What we'd like from you

1. Does the round-5 diff actually close the three P1s from your last
   review, given Andy's two policy answers?
2. Is the `TIER1_METADATA_LEAF_DENYLIST` list complete, or did a
   path-level scan (like the one you ran last time) turn up more
   metadata-only descendants we missed?
3. Is hard-excluding Tier-4-only candidates from `final` (vs. capping)
   the right mechanical choice, and does it need to also cover
   `hedge_baskets`/`parlay_ladders`/`watchlistReview`?
4. Anything in the prose rewrite that still doesn't match the code, or
   introduces a new ambiguity?
5. Any other reachable bypass a cumulative read of the new diff turns up
   -- same spirit as your last review, which is exactly what caught what
   four earlier rounds missed.

Please do not mark Stage 5/6 "closed" or "fully verified" in your
response unless you mean it this time -- we'd rather hear "still not
clean, here's why" than get a fifth round.
