# Codex final targeted review — guarded-with-enforcement round 3

**Reviewed:** 2026-09-08 22:56 UTC  
**Repository:** `E:\dev\projects\NFL_Dashboard`  
**Live branch / HEAD:** `main` / `0fc6112` (`main...origin/main [ahead 1]`)  
**Mode:** offline, review-only; dirty worktree preserved

## Decision

**Round 3 closes the earlier enforcement-placement and exacta-in-`final`
findings, but it does not fully close the fail-open grounding blocker. Do not
advance to Stage 6 as a closure/blessing run until the identity-only bypass
below is corrected and covered by a regression test.**

No source files were changed during this review. The only writes are this
dated review handoff and the requested material Stage 5 checklist update.

## Findings

### P1 — `team` is identity metadata but currently qualifies as Tier 1, bypassing enforcement

`TIER1_FIELD_ROOTS` includes `team` in
`agents/lib/board-validate.js:328`. The strict validator resolves evidence IDs
against `{ ...teamProfile, ...row }` (`agents/portfolio-synthesize.js:1051-1058`),
so a normal dossier row's `team` field resolves successfully. Then
`hasQualifyingGrounding()` accepts any resolved Tier 1/2 ID
(`agents/lib/board-validate.js:369-375`), and
`enforceEvidenceTierGate()` returns the candidate unchanged
(`agents/lib/board-validate.js:429-441`).

Direct probe against the checked-out helper:

```json
{
  "tier": 1,
  "grounded": true,
  "same": true,
  "result": {
    "stake_tier": "core",
    "needs_human_review": false,
    "evidence_resolved": [{ "id": "team", "resolved": true }]
  }
}
```

That means a Tier-3/4 narrative thesis can cite `team` and retain an unsafe
`core`/unreviewed state. The new tests do not exercise identity-only metadata.

**Closure criterion:** remove identity-only fields from the set that can
independently establish qualifying grounding, or separate “resolvable field”
from “substantive Tier 1/2 support.” Add a regression case proving a candidate
with only resolved `team` evidence is forced to `needs_human_review: true` and
`stake_tier: small` (or remains speculative if already speculative). Review
other locator/display-only roots under the same substantive-evidence rule.

### P2 — the allowlist is fail-closed but not complete/reachable for real production evidence

The safe direction is correct: unknown IDs now overguard instead of escaping.
However, comparison with `.nfl/portfolio/dossier-2026-09-04.json` found real
structured row roots absent from the Tier 1 allowlist, including quote
freshness/traceability (`best_availability_status`, `best_observed_at`,
`best_quote_age_hours`), distribution outputs (`win_dist`, `tails`), and other
computed fields (`best_edge_over`, `best_edge_under`, `over_prob_median`). Some
may be intentionally non-qualifying, but that choice is not captured as an
explicit policy distinction.

More importantly, three roots the classifier explicitly recognizes cannot be
resolved by the current evidence context:

- `roster_churn` and `adjacent_signals` are top-level dossier maps, while
  `evidenceRowFor()` exposes only the matched market row plus one team profile.
- `experts` is also top-level and therefore cannot resolve through the current
  flat-path contract.

Historical raw artifacts also contain noncanonical but sometimes meaningful
shapes such as `wins.*`, `conference_*.*`, `division_*.*`,
`dossier.team_profiles.*`, and `team_profiles.*`; round 3 intentionally treats
them as unrecognized. This is safe, but a mocked Stage 6 run should quantify
how often legitimate structured support is capped because its path is
noncanonical or unreachable.

**Disposition:** P2 correctness/overguarding, not an unsafe bypass. After the
P1 correction, Stage 6 is the right place to exercise canonical Tier 1, Tier 2,
narrative-only, unknown, empty, and unreachable-top-level IDs end to end.

## Items that are now correctly closed

### Enforcement placement

The real value-forcing gate is after strict validation and board annotation and
before every consumer of `final`: ranking, proposal export, HTML/Markdown/raw
rendering, `persistRecommendations()`, and the `final` branch of
`persistRecommendationRuns()` (`agents/portfolio-synthesize.js:3607-3698`).
The pre-enforcement validation strings remain an audit trail; downstream final
recommendation values are enforced.

### Exactas in the final recommendation path

`partitionSimPriceOnly()` removes `superbowl_matchup` candidates before the
tier gate and all final consumers (`agents/portfolio-synthesize.js:3637-3650`).
This closes the earlier team-B resolution concern for recommendation cards,
proposal export, and recommendation persistence.

Exacta legs can still appear in `hedge_baskets`, `parlay_ladders`, and the
scenario book. Those are separate structures and do not bypass the `final`
recommendation/persistence path, so they do not need the candidate evidence-tier
gate as currently modeled. There is nevertheless a policy-framing follow-up:
the report renders unit stakes, payouts, exposure, and “Coverage Positions” for
these structures even when a leg is simulation-only. Stage 6 should require
that exacta material remain clearly labeled as simulation/scenario planning,
not a placeable card or execution claim. The human watchlist is likewise a
separate deterministic review surface, not a recommendation consumer.

## Verification performed

- `node --check agents/lib/board-validate.js` — pass
- `node --check agents/portfolio-synthesize.js` — pass
- ESLint on both changed source files plus `tests/unit/evidenceTierGate.test.js`
  — pass, zero output
- Focused Vitest run — **5 files passed, 84 tests passed**:
  - `tests/unit/evidenceTierGate.test.js` — 29
  - `tests/unit/boardValidate.test.js` — 25
  - `tests/unit/boardValidateNamedPlayerGate.test.js` — 11
  - `tests/unit/namedStatusReviewSizingGates.test.js` — 12
  - `tests/unit/dataGatheringSprint.test.js` — 7
- Direct helper probe demonstrating the `team`-only bypass — reproduced

No model calls, paid synthesis, network reacquisition, Supabase/Postgres writes,
recommendation persistence, betting action, staging, commit, push, stash,
cleanup, or source-code edit was performed.

## Recommended next step

Make one narrow round-4 correction for substantive grounding and add the
identity-only regression test. Then run the same static/focused checks and ask
for a final spot review. If clean, proceed to Stage 6's mocked, zero-spend
end-to-end matrix with explicit assertions for canonical support, narrative-only
support, empty/unknown IDs, top-level evidence, exacta exclusion from `final`,
and simulation-only labeling in scenario structures.
