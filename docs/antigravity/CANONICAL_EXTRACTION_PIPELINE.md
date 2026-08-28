# Canonical Antigravity Extraction Pipeline

> Status: canonical source contract for Codex, Claude, Antigravity, and Copilot.
> Created: 2026-08-28.
> Scope: expert-intel extraction artifacts used for betting-recommendation synthesis.

## Purpose

Antigravity's exhaustive extraction passes are canonical project inputs. Any team synthesizing betting recommendations must check these outputs before concluding that expert intel is missing, stale, or unsupported.

This document does not authorize betting execution, official-pick mutation, Supabase writes, paid API calls, AI-agent chat enablement, or portfolio changes. It only defines the source contract and handoff workflow for local expert-intel artifacts.

## Canonical Outputs

Use these files as first-class source inputs:

| Artifact | Path | Role |
|---|---|---|
| Exhaustive master reports | `scratch/*_master_100percent_exhaustive.md` | Human-readable, source-attributed extraction corpus. |
| Structured recommendation dataset | `data/podcasts/actionable_betting_recommendations_2026.json` | Machine-readable recommendation candidates derived from master reports. |
| Master betting packet | `docs/fantasy/MASTER_BETTING_INTELLIGENCE_PACKET_2026.md` | Human-readable synthesis packet generated from structured recommendations. |
| Alpha data packet | `data/alpha/alpha-packet-2026.json` and `public/alpha/alpha-packet-2026.json` | Offline packet that bundles team dashboards, intel, and read-only market context. |
| Antigravity review docs | `docs/antigravity/*.md` | Antigravity pipeline specs, queue state, freshness reviews, and migration notes. |
| Source inventory and freshness report | `docs/antigravity/source-inventory-and-freshness-latest.md` | Current Antigravity inventory, processed/skipped source disposition, and lifecycle gap report. |
| Podcast transcript corpus | `data/podcasts/m6-diarized-all/manifest.json` and referenced files | Canonical local transcript inventory for processed podcast episodes. |
| Article evidence review | `data/research-intel/review/article-intel-review-latest.json` and `docs/article-intel-review/article-intel-review-latest.md` | Local article-pick evidence lanes: `actual_picks`, `market_leads`, and `analysis_notes`. |

Current verified baseline from the 2026-08-28 Antigravity refresh:

- 63 exhaustive master reports.
- 57 diarized podcast episodes in the canonical manifest.
- 209 structured recommendations.
- 19 master reports extracted but not yet folded into `data/podcasts/actionable_betting_recommendations_2026.json`.
- Antigravity/Codex session evidence in `.nfl/session-log.jsonl` sessions `S240`, `S241`, and `S243`, plus `docs/antigravity/source-inventory-and-freshness-latest.md`.

These counts are a baseline, not a freshness guarantee. Recount live files before publishing a new status report.

## Canonical Workflow

When Antigravity processes new podcasts or articles:

1. Update or add local source/transcript artifacts.
2. Generate an exhaustive master report using the naming pattern `scratch/{source_slug}_master_100percent_exhaustive.md`.
3. Preserve source attribution: expert/author, title, date, URL when available, quoted support, and explicit team/market/side.
4. Keep setup-board reads, market screens, and generic price context as `market_context`, not recommendations.
5. Separate explicit recommendations, passes/fades, conditional/watchlist positions, weekly bets, draft/contest-only positions, parlay-only positions, and generic market context.
6. Rebuild derived review outputs only after preserving the raw/master artifact.
7. Record freshness and source coverage in `docs/antigravity/` or the relevant review directory.

## Cross-Team Required Checks

Before Codex, Claude, Antigravity, or Copilot synthesizes betting recommendations, it must:

1. Read this document.
2. Recount `scratch/*_master_100percent_exhaustive.md`.
3. Inspect `data/podcasts/actionable_betting_recommendations_2026.json`.
4. Inspect `data/podcasts/m6-diarized-all/manifest.json` for podcast coverage.
5. Inspect `data/research-intel/review/article-intel-review-latest.json` for article evidence status.
6. Compare live/web/RSS candidates against the local manifest before calling a source "unprocessed".
7. Report gaps as one of: `not_discovered`, `discovered_not_transcribed`, `transcribed_not_extracted`, `master_extracted_not_structured`, `structured_not_promoted`, or `stale_needs_refresh`.

## Recommendation Eligibility Rules

An item can be a betting recommendation candidate only when it has:

- explicit action language from a named expert/author/source
- identifiable team/player/game/market
- side or selection
- line, odds, price, threshold, or clear market condition when applicable
- source trail back to a transcript, article, or master report

Do not promote sportsbook board reads, generic discussion, ambiguous fragments, ad reads, non-NFL false positives, or stale preseason picks after kickoff unless the status is clearly historical/grading-only.

## Safety Boundaries

These outputs are research and recommendation-candidate inputs. They do not authorize:

- placing bets
- locking official picks
- mutating owner portfolio, official pick ledger, odds caches, or production recommendation artifacts
- writing to Supabase/Postgres
- calling paid APIs
- making live AI/model calls without explicit approval
- storing API keys in the app

## Refresh Request Template For Antigravity

Use this when asking Antigravity to process new material:

```text
Resume in E:\dev\projects\NFL_Dashboard.

Read first:
- docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
- AGENTS.md
- CLAUDE.md
- HANDOFF.md
- data/podcasts/m6-diarized-all/manifest.json
- data/podcasts/actionable_betting_recommendations_2026.json
- data/research-intel/review/article-intel-review-latest.json

Goal:
Discover and process the latest NFL podcasts/articles from Action Network, VSiN, BettingPros, and already-approved local source queues. Produce canonical exhaustive master reports and a freshness/gap report for Codex and Claude.

Required output:
- Add/update source inventory and freshness report under docs/antigravity/.
- For each processed source, write scratch/{source_slug}_master_100percent_exhaustive.md.
- Preserve raw/transcript/source provenance.
- Classify each item as explicit recommendation, pass/fade, conditional/watchlist, weekly bet, parlay-only, draft/contest-only, or market_context.
- Do not promote to official picks.
- Do not mutate bankroll, portfolio, odds caches, official pick ledger, or production recommendation artifacts.
- Do not write to Supabase/Postgres.
- Do not call paid APIs unless separately approved.
- If model/API calls are required, report the exact need and stop for approval.

At closeout, report:
- processed sources
- skipped sources and why
- master reports added/updated
- structured rows added/changed, if any
- gaps remaining
- exact commands/tools used
- confirmation of no official-pick/bankroll/portfolio/Supabase mutation
```
