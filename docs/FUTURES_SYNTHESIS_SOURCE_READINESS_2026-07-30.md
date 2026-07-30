# Futures Synthesis Source Readiness - 2026-07-30

Purpose: verify the current intel bundle for a maximum-effort frontier-model futures portfolio synthesis.

This is a source-readiness checklist, not a betting recommendation and not approval to call a paid model. It reads local artifacts only.

## Gate Status

- Latest audit command: `npm.cmd run intel:source-audit`
- Latest verdict: `PASSABLE`
- Counts: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7 / Inference 1
- Latest JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-10-51-837Z.json`
- Latest HTML: `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

## Scope Decision

The current focus is futures portfolio synthesis readiness. The following are out of scope for this gate:

- DraftKings/FanDuel bet-slip parser implementation or verification.
- Weekly live-props source wiring.
- Official-picks approval/proposal persistence.
- Supabase writes or portfolio mutation.

## Accepted Current Evidence

- Primary sportsbook structured rows:
  - BetUS 2026-07-29, 416 rows.
  - Bookmaker 2026-07-29, 128 rows.
- Raw current primary-book exports:
  - Bookmaker/BKR 2026-07-29 raw text.
  - BetUS 2026-07-29 raw text.
  - BetOnline 2026-07-29 screenshots.
- Reviewed YouTube/Gemini futures intel:
  - 45 promoted/exported items.
  - 115 review records.
  - Known DET bad-leak check is 0.
- Article/research intel:
  - RSS ingest ran 2026-07-30.
  - Article full-body review covers 39 articles.
  - 0 actual pick candidates, 8 market/inference leads, 103 contextual notes.
- Training camp intel:
  - 2026-07-30 local snapshot.
  - 16 items, 32 teams, 12 teams with intel.
- Team/context data:
  - 2026 schedule spine has 272 regular-season games.
  - 2025 analytics, coaching tendency, and DVOA team profiles are present.
  - Fantasy value board is available as player/usage context only.

## Required Caveats Before Frontier Synthesis

- BetOnline has current July 29 screenshots, but the structured BetOnline JSON import is stale. Do not use stale BetOnline structured rows as source of truth unless they are normalized or manually reviewed against the screenshots.
- Podcast/deep-dive generated output has known sponsor/ad leakage. Use raw/source-stamped M6 transcript evidence or explicitly caveat generated deep-dive text until the filter is fixed and regenerated.
- The latest portfolio synthesis artifact is useful prior context, but it was generated on 2026-07-27. Rebuild the synthesis packet after accepting or caveating the current July 30 source bundle.
- Season readiness is `READY WITH WATCH ITEMS`, PASS 11 / WARN 6 / FAIL 0. The watch items are not source-freshness blockers, but should be explicitly waived or noted before model execution.

## Next Acceptance Steps

1. Mark each of the 17 audit review items as accepted, accepted-with-caveat, or excluded.
2. Resolve or caveat podcast/deep-dive sponsor/ad leakage.
3. Normalize or manually review BetOnline screenshots before using BetOnline as a placeable-price source.
4. Build the frontier-model evidence packet from accepted sources only.
5. Ask for explicit approval before any paid model/API call or persisted recommendation output.
