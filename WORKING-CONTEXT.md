# WORKING-CONTEXT.md — NFL Platinum Rose
> **Live operational state. Update this file at every session close.**
> **Read this at session start before touching any file.**
> Last updated: 2026-06-07 | Branch: `main` | HEAD: `e0fb78c`

---

## Current Mode

```
MODE: Offseason Architecture Build
Active: June 7, 2026
Context: DS-4 research intel pipeline live and validated. Tweet-ingest agent built
         (Claude/Gemini/OpenAI vision fallback). x-sharp-ingest DORMANT — X API
         costs $100/mo, not worth it offseason. Manual tweet drop workflow live.
         607/607 tests passing.
Reference: docs/NFL_BACKLOG.md (1 open item: X ingestion, medium priority)
```

---

## Active Sprint — S168 State

| ID | Task | Status | Notes |
|----|------|--------|-------|
| **DS-2** | Season schedule spine | ✅ Done | `games` table + schedule-ingest.js |
| **DS-3** | Futures breadth expansion | ✅ Done | migration 008; market availability receipts |
| **DS-4** | Research intel ingest v1 | ✅ Live & validated | 44 candidates/run; dedup healthy |
| **F-13** | X/Twitter sharp-account ingest | ⛔ DORMANT | X API = $100/mo; manual drop workflow chosen instead |
| **F-14** | Vault pre-load (reference data) | ✅ Done | DVOA + ATS + nflverse all seeded |
| **Tweet Ingest** | Manual tweet drop agent | ✅ Done | agents/tweet-ingest.js; Claude→Gemini→OpenAI vision |
| **Vault-seed** | vault-seed.js agent | ✅ Done | auto-detects CSV schemas; manual/ dir supported |
| **game_splits_history** | Append table for splits | ✅ Done | migration 024; dual-write |
| **Sharp books ingest** | bookmaker + betonline in odds | ✅ Done | added to SPORTSBOOKS constant |

---

## Migration State (All Applied)

| # | File | Purpose |
|---|------|---------|
| 001–009 | init through research_intel | Core schema including `research_intel_notes` + `research_intel_signals` |
| 010–013 | odds snapshots, FTS, vault_notes, x_sharp_tweets | Odds + vault + X ingest tables |
| 014–018 | historical_stats, pbp_tendencies, player_injuries, RLS | Analytics + injury pipeline |
| 019–024 | RLS, audit, pick IDs, odds upsert keys, podcast v2, splits history | Latest — migration 024 is most recent |

---

## Manual Intel Drop Dirs

| Dir | Format | Command | Destination |
|-----|--------|---------|-------------|
| `data/tweet-drops/` | .png/.jpg/.webp/.txt/.json | `npm run ingest-tweets` | `research_intel_notes` (source_type: tweet) |
| `data/vault-seed/manual/` | .md (see TEMPLATE.md) | `npm run seed:vault:manual` | `vault_notes` (NFL/Reference/) |
| `data/vault-seed/ats/` | .csv (Spreadspoke) | `npm run seed:vault:ats` | `vault_notes` |
| `data/vault-seed/dvoa/` | .json | `npm run seed:vault:dvoa` | `vault_notes` |
| `data/vault-seed/pff/` | ⏳ Empty | `npm run seed:vault` | `vault_notes` |
| `data/vault-seed/splits/` | ⏳ Empty | `npm run seed:vault:splits` | `vault_notes` |

---

## Data Source Health

| Source | Status | Notes |
|--------|--------|-------|
| TheOddsAPI | ⏸️ Offseason | Manual fetch only; bookmaker + betonline included |
| ESPN Scoreboard/Injuries | ✅ Available | Offseason — no active games |
| Supabase | ✅ Connected | 24 migrations applied |
| Schedule.json | ✅ Local | `public/schedule.json` |
| Research intel feeds | ✅ Live | 6/9 feeds returning NFL content (offseason); Rotowire empty, Football Outsiders blocked, BettingPros multi-sport |
| X/Sharp accounts | ⛔ DORMANT | RSSHub requires X API credentials; $100/mo rejected |
| nflverse data | ✅ Seeded | 100 vault notes |
| DVOA | ✅ Seeded | dvoa-2025.json |
| ATS (Spreadspoke) | ✅ Seeded | nfl_2025.csv |
| Podcast Pipeline | ✅ Built | Groq → AssemblyAI → Whisper fallback; Tailscale serve on M6 |
| Tweet ingest | ✅ Built | agents/tweet-ingest.js; all 3 vision API keys configured |

---

## Offseason Architecture Vision (Locked 2026-05-08)

1. **NFL Betting Vault** — ✅ Done (F-12 `vaultClient.js`)
2. **Expanded Data Ingestion** — ✅ Done (research-intel + vault-seed + tweet-ingest)
3. **BETTING Agent Game-Day Proactive Mode** — 🔲 F-9 Sunday Slate Briefing (not yet built)
4. **Performance Feedback Loop** — 🔲 Analytics aggregation + BETTING context injection (not yet built)

---

## npm Scripts (Key)

```bash
npm run ingest-tweets            # Process data/tweet-drops/ → research_intel_notes
npm run ingest-tweets:dry        # Preview without writing
npm run seed:vault               # Run vault-seed agent (all dirs)
npm run seed:vault:manual        # Seed manual/ dir only
npm run ingest-research-intel    # DS-4 live RSS ingest
npm run ingest-research-intel:dry
npm run test                     # vitest (607 tests)
```

---

## Blockers

None.

---

## Open Questions

1. **Rotowire NFL feed**: returns 0 items (offseason empty). Will auto-recover in-season.
2. **Football Outsiders**: `fetch failed` — domain blocking the bot. Low priority.
3. **BettingPros**: 0 NFL items offseason (multi-sport feed). Will improve in-season.
4. **PFF grades export**: `data/vault-seed/pff/` empty — when available, drop CSVs there.

## Deferred

- **Python scripts season bump** (`scripts/*.py`): SEASON=2025 intentional — revisit Aug 2026.
- **Props auto-grade pipeline**: No GHA agent yet.
- **TheOddsAPI props tier**: PROPS agent built; prop lines require paid tier — revisit pre-season.
- **F-9 Sunday Slate Briefing**: Pillar 3, not yet started. Top priority next session.
- **Performance feedback loop** (Pillar 4): Not yet started.

---

## Next Session Priority

1. **F-9 Sunday Slate Briefing** — proactive BETTING agent entry point (Pillar 3)
2. **PFF grades** — drop CSVs in `data/vault-seed/pff/` when available
3. **Props auto-grade** — GHA pipeline for `nfl_props_picks_v1`

---

## Head Commit

```text
Branch: main
Commit: e0fb78c — S168: tweet-ingest agent (Claude/Gemini/OpenAI vision fallback) + manual drop workflow
Remote: origin/main synced
Tests: 607/607 passing
```
