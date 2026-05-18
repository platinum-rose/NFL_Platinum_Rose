# NFL_Dashboard — Session Handoff
> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-05-18
**Branch:** main
**HEAD:** `4d1125b`
**Tests:** 84/84 passing
**Status:** F-13 complete and committed. Migration 013 created (NOT YET applied to Supabase).

---

## Pick Up Here

### What Shipped This Session

**F-13 — X/Twitter sharp-account ingestion via RSSHub** — commit `4d1125b`
- `config/sharp-accounts.json` — 8 sharp NFL accounts configured
- `supabase/migrations/013_x_sharp_tweets.sql` — ⚠️ NOT yet applied (apply before tool works at runtime)
- `agents/x-sharp-ingest.js` — GHA Node.js agent (RSSHub RSS parsing, dedup via `url_hash`)
- `.github/workflows/x-sharp-ingest.yml` — schedule: every 4h + hourly on game days
- `src/lib/supabase.js` — `getRecentSharpTweets` + `searchSharpTweets`
- `src/lib/agentTools.js` — `search_sharp_tweets` tool (12 tools total)
- `src/components/agent/AgentChat.jsx` — sharp tweets injected into system prompt
- 84/84 tests passing

> **F-12 (DONE)** — commit `24cacb7` — vault dual-backend + read/write tools

---

## Immediate Next Actions

1. **Apply migration 013** to Supabase before `search_sharp_tweets` tool works at runtime:
   - Paste `supabase/migrations/013_x_sharp_tweets.sql` into Supabase SQL editor, or
   - Run `npx supabase db push` (requires Supabase CLI linked to project)

2. **Add `RSSHUB_BASE_URL` secret** to GitHub repo settings (optional — falls back to public `https://rsshub.app`):
   - Settings → Secrets → New repository secret → `RSSHUB_BASE_URL`
   - Self-hosted Docker instance recommended for production (avoids rate limits)

3. **F-14** is the only remaining P2 backlog item.

---

## Known Local-Only Noise (Do Not Commit)

- `.nfl/receipts/` (run artifacts)
- `supabase/.temp/` (local tooling cache)

---

Resume order: HANDOFF.md → TASK_BOARD.md
