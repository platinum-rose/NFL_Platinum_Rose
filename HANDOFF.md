# NFL_Dashboard — Session Handoff
> Fresh-session resume notes. Read this first, then WORKING-CONTEXT.md.

**Date:** 2026-05-17
**Branch:** main
**Status:** Data Sprint in progress (DS-2 and DS-3 complete, DS-4 ready to run)

## What Shipped This Sprint

### DS-2 — Schedule Spine

- `supabase/migrations/007_games_schedule.sql` applied.
- `agents/schedule-ingest.js` supports regular season + playoff representation (`--include-playoffs`).
- Duplicate `game_id` for TBD playoff matchups resolved.
- `public/schedule.json` regenerated from ingest.

### DS-3 — Futures Breadth

- `agents/futures-odds-ingest.js` expanded to conference/division/awards market keys.
- Explicit unavailable-market reporting added to run receipts.
- Crash-safe and schema-compatible writes added.
- `supabase/migrations/008_futures_breadth_dimensions.sql` applied and verified.

### DS-4 — Research Intel Ingest

- `supabase/migrations/009_research_intel.sql` created and now confirmed applied.
- `agents/research-intel-ingest.js` implemented for Action Network, BettingPros, VSiN.
- Feed guardrails added to prevent OOM/non-feed payload crashes.
- `src/lib/supabase.js` includes `getRecentResearchIntelNotes()` and `getRecentResearchPickSignals()`.
- `package.json` scripts include `ingest-research-intel` and `ingest-research-intel:dry`.

## Current Blockers

None. Migration 009 is now reported as successful.

## Immediate Next Actions (Fresh Session)

1. Run live DS-4 ingest using `npm run ingest-research-intel`.
1. Validate inserts in Supabase by checking row counts in `research_intel_notes` and `research_pick_signals`.
1. Spot-check latest inserted rows for `source`, `title`, `summary`, `bet_type`, and `confidence`.
1. Review the latest DS-4 receipt under `.nfl/receipts/`.
1. If validation is clean, commit remaining DS-4 verification updates and push.

## Known Local-Only Noise (Do Not Commit)

- `.nfl/receipts/` (run artifacts)
- `supabase/.temp/` (local tooling cache)
- `skills/deployment-flow/` (out-of-scope local doc)

---
Resume order: CLAUDE.md → HANDOFF.md → WORKING-CONTEXT.md → TASK_BOARD.md
