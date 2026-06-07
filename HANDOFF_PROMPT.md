# HANDOFF_PROMPT.md — NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read WORKING-CONTEXT.md.

## Persistent Backlogs

> Read at every session start. Mark items done in the source file, not here.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|--------------|
| Feature & Architecture | `docs/NFL_BACKLOG.md` | 1 open | 2026-06-07 |

## Last Session Summary

- Date: 2026-06-07
- Branch: main
- HEAD: e0fb78c — "S168: tweet-ingest agent (Claude/Gemini/OpenAI vision fallback) + manual drop workflow"
- Tests: 607/607 passing

## What Was Done (S168)

**DS-4 live validation** — `research-intel-ingest.js` confirmed healthy. 44 candidate notes,
42 already in DB (dedup working), 2 new inserts. Pipeline is live and idempotent.

**RSSHub self-hosting attempted on M6** — `docker run diygod/rsshub` succeeded but the Twitter
route requires real Twitter API credentials even self-hosted. X API Basic = $100/mo → rejected.
x-sharp-ingest remains DORMANT. All RSS-backed accounts already in research-intel-ingest.

**Manual tweet drop workflow built:**
- `data/tweet-drops/` drop folder with `HOWTO.md`
- `data/vault-seed/manual/TEMPLATE.md` for markdown drops
- `npm run seed:vault:manual` — seeds manual/ markdown into vault_notes
- `npm run ingest-tweets` / `npm run ingest-tweets:dry` — processes tweet-drops/

**`agents/tweet-ingest.js` built** — supports:
- `.png/.jpg/.webp` — vision AI extracts tweet handle, text, URL, date (charts/stats too)
- `.txt` — paste format, multiple tweets separated by `---`
- `.json` — `[{handle, text, url, date}]` array for bulk drops
- Vision provider fallback chain: Claude → Gemini 2.0 Flash → GPT-4o (first available key wins)
- Writes to `research_intel_notes` (source_type: 'tweet', confidence: 0.75)
- Archives processed files to `data/tweet-drops/processed/YYYY-MM-DD/`
- All 3 API keys confirmed present in .env

**`docs/NFL_BACKLOG.md` updated** — RSSHub/X API paths closed; manual drop workflow documented
as the chosen path. 1 open item remains (X ingestion, medium priority, pre-season).

## Critical Status

- DS-4 (`research-intel-ingest.js`) — **LIVE AND VALIDATED** ✅
- `x-sharp-ingest.js` — DORMANT (X API required, not worth $100/mo offseason)
- Tweet ingest agent — built, tested, committed. Ready to use in-season.
- 607/607 tests passing

## What To Do Next

1. **F-9 Sunday Slate Briefing** — proactive BETTING agent entry point (Pillar 3, not yet built)
2. **x-sharp disposition** — already resolved; only revisit if free X access becomes available
3. **PFF grades** — `data/vault-seed/pff/` still empty; drop grade export CSVs when available
4. **Performance feedback loop** (Pillar 4) — analytics aggregation + BETTING context injection

## Resume Command

```text
Resume Platinum Rose NFL. HEAD = e0fb78c (main). Suite: 607/607. DS-4 live and validated.
Tweet-ingest agent built (vision fallback: Claude→Gemini→OpenAI). x-sharp DORMANT (X API
too expensive). Next: F-9 Sunday Slate Briefing (Pillar 3). Read HANDOFF_PROMPT.md first.
```

## Notes

- Read order for fresh session: CLAUDE.md → HANDOFF_PROMPT.md → WORKING-CONTEXT.md
- `data/tweet-drops/` — drop screenshots/text/JSON here, run `npm run ingest-tweets`
- `data/vault-seed/{pff,splits,manual}/` — drop CSVs/MDs here, run `npm run seed:vault`
- Python scripts (`scripts/*.py`) are intentionally SEASON=2025 — defer to Aug 2026
- Podcast pipeline is live on M6 at Tailscale `atlas.tail1e459d.ts.net`
