# NFL_Dashboard — Session Handoff
> Auto-generated at session end. Read this to resume.

**Date:** 2026-04-22
**Branch:** main

## What shipped 2026-04-22 — Supabase RLS fix

| Item | Status | Notes |
|------|--------|-------|
| `supabase/migrations/006_rls_podcast_feeds.sql` | ✅ | Forward migration: `ALTER TABLE public.podcast_feeds ENABLE ROW LEVEL SECURITY` + `public_read_podcast_feeds` policy. Apply in Supabase SQL Editor at `aambmuzfcojxqvbzhngp`. |
| `supabase/migrations/003_podcast.sql` patched | ✅ | RLS block added after seed INSERT so fresh deploys don't repeat the gap. |
| Supabase alert resolved | ✅ | `rls_disabled_in_public` on `podcast_feeds` — only affected table; all others (odds_snapshots, line_movements, game_results, futures_odds_snapshots, podcast_episodes, podcast_transcripts, user_picks, user_bankroll_bets) had RLS enabled correctly. |

**Action required:** Run `006_rls_podcast_feeds.sql` in the Supabase SQL editor for project `aambmuzfcojxqvbzhngp` to apply to the live database.

---

## Prior state (2026-04-19)

### Uncommitted Changes

### Modified
- AGENTS.md
- CLAUDE.md
- HANDOFF_PROMPT.md
- NFL_EVOLUTION_PLAN.md
- RULES.md
- TASK_BOARD.md
- WORKING-CONTEXT.md
- agents/nfl-auto-grade.js
- agents/product/tier1/BETTING.md
- agents/product/tier1/INTEL.md
- contexts/offseason.md
- docs/ANTI_PATTERNS.md
- docs/GOTCHAS.md
- docs/PIPELINE_AGENTS.md
- docs/TESTING.md
- package.json
- src/App.jsx
- src/components/dashboard/ExpertLeaderboard.jsx
- src/components/dashboard/Standings.jsx
- src/components/futures/PlayoffBracket.jsx
- src/components/layout/Header.jsx
- src/lib/agentTools.js
- src/lib/bankroll.js
- src/lib/constants.js
- src/lib/injuries.js
- src/lib/storage.js
- tests/smoke.spec.js

## In Progress
_No In Progress tasks._

---
_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_
