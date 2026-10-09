# Handoff: Week 5 Friday input refresh for podcast extraction

**Date:** 2026-10-09 PT
**From:** Codex
**To:** Antigravity podcast-intelligence team
**Repository / branch:** `E:\dev\projects\NFL_Dashboard` / `main`
**Purpose:** Consume fresh Week 5 context while discovering and extracting any additional relevant Week 5 podcasts. This is an input refresh, not approval to alter official picks, bankroll, tickets, sportsbook state, or Supabase.

## New committed inputs

### Action Network source evidence

- `data/research-intel/source-evidence/2026-10-09-action-network-sunday-matchup-articles.json`
  - Six captured Sunday matchup article bodies.
- `data/research-intel/source-evidence/2026-10-09-action-network-week5-live-picks-raw.jsonl`
  - 263 unique scheduled pick rows across 14 remaining games; raw provider payloads.
- `data/research-intel/source-evidence/2026-10-09-action-network-week5-betting-splits-raw.json`
  - Action split snapshot captured at `2026-10-09T19:41:08.878Z`.
- `data/research-intel/source-evidence/2026-10-09-action-network-week5-live-picks-splits-capture.md`
  - Capture audit and coverage table.
- `data/research-intel/normalized-review/2026-10-09-action-network-sunday-attributable-selections.json`
  - Attributable analyst selections only, including quotes and market metadata.
- `data/research-intel/normalized-review/2026-10-09-action-network-week5-live-picks-splits-review.md`
  - Source-only review record; no recommendation promotion.

### Friday research context

- Player availability: `data/player-availability/player-availability-2026-10-09.json` and `data/player-availability/latest.json`
- Projected starters: `data/projected-starters/2026/projected-starters-2026-10-09.json` and `data/projected-starters/2026/latest.json`
- Secondary matchup matrix: `data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json` and `data/secondary-matchups/latest.json`
- Article-derived prop review: `data/research-intel/review/player-props-intel-latest.json`

Readable matching reports are under `docs/player-availability/`, `docs/projected-starters/`, `docs/secondary-matchups/`, and `docs/player-props-intel/`.

## Known limits and required treatment

- The Action split source has numeric `book_id: 15` but no resolved sportsbook name. It is a timestamped context snapshot, **not** executable pricing.
- The current Action game-picks capture contains picks and split fields. Coaching-trend and game-page statistical-analysis modules have **not** been captured.
- Availability is a mixed ESPN/FantasyPros/training-camp aggregation; do not label it final official practice status or game-day inactives.
- Starter signals require reconciliation: the generated summary says 103 total signals while its manual/estimated subcounts total 105.
- Secondary output has 30 matchup records while the active remaining-game prop window has 14 games; confirm scope before Sunday-only use.
- Prop review has only five extracted props across five games and zero curated parlays. Do not infer slate-wide prop coverage.
- Treat all podcast-derived outputs as source evidence with speaker, episode, timestamp, and quote. Do not promote to recommendations or tickets.

## Requested Antigravity work

1. Discover incremental Week 5 podcast/video episodes published after the prior Week 5 ingestion manifest, with particular attention to Friday/Saturday game previews, late injury/news reactions, coaching/scheme analysis, and player props.
2. Deduplicate against the existing Week 5 episode registry before processing.
3. Preserve raw episode/source metadata and exact attributable quotations; mark unattributed consensus claims as context only.
4. Report coverage and evidence gaps rather than fabricating lines, prices, player status, or speaker attribution.
5. Return a dated manifest and a source-evidence-only summary for review. Do not write Supabase, alter official portfolios/ledgers/tickets, call sportsbook cashiers, or execute any wager.

## Existing Week 5 ingestion context

The prior `2026-10-08-2359-antigravity-to-codex-week5-podcast-intel.md` handoff reports 18 completed Week 5 episodes. Treat that report as historical context; reconcile its claimed outputs against live files before relying on it, and process only genuinely new material.
