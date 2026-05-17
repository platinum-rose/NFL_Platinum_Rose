# WORKING-CONTEXT.md — NFL Platinum Rose
> **Live operational state. Update this file at every session close.**
> **Read this at session start before touching any file.**
> Last updated: 2026-05-08 | Branch: `main` | HEAD: _(run `git log -1 --oneline`)_

---

## Current Mode

```
MODE: Offseason Architecture Build (Week 1 target)
Active: May 8, 2026
Context: Governance migration done. F-6 BETTING, F-7 DFS, F-8 PROPS agents all live.
         Futures ingest confirmed live (96 SB rows, 2026-05-08). ODDS_API_KEY rotated.
         Creator Q&A session completed 2026-05-08 — full offseason architecture direction locked.
         Python scripts (scripts/*.py) intentionally still SEASON = 2025 — deferred to Aug 2026.
Reference: TASK_BOARD.md, ## Offseason Architecture Vision below
```

---

## Active Sprint

| ID | Task | Status | Notes |
|----|------|--------|-------|
| **Phase 1** | Governance Foundation | ✅ Done | SOUL.md, RULES.md, WORKING-CONTEXT.md, TASK_BOARD.md, AGENTS.md |
| **Phase 2** | Contexts + Hooks + Rules | ✅ Done | contexts/ (5), hooks/hooks.json, rules/ (4) |
| **Phase 3** | Dev Agent Architecture | ✅ Done | agents/dev/ — 15 adapted YAML-frontmatter agent prompts |
| **Phase 4** | Product Agent Layer | ✅ Done | BETTING.md, INTEL.md, PROPS.md (tier1), betting/props manifests |
| **Phase 5** | CLAUDE.md Consolidation | ✅ Done | Orchestration Directives, Session Protocols, Custom Commands, Prompting Discipline |
| **Phase 6** | NFL-Specific Additions | ✅ Done | ANTI_PATTERNS.md, HANDOFF_PROMPT.md, AGENT_LOCK.json, GOTCHAS.md, gen_resume.js |
| **F-6** | BETTING Agent Chat | ✅ Done | Agent tab live (7 tools) |
| **F-7** | DFS Lineup Optimizer | ✅ Done | DFS tab live (DK/FD, greedy optimizer) |
| **F-8** | PROPS Agent Chat | ✅ Done | Props tab live (7 tools; prop lines stubbed) |

---

## Data Source Health

| Source | Status | Last Refreshed | Notes |
|--------|--------|---------------|-------|
| TheOddsAPI | ⏸️ Offseason | — | 500 req/month free plan; manual fetch only; props NOT available on free tier |
| ESPN Scoreboard | ✅ Available | — | NFL offseason — no active games |
| ESPN Injuries | ✅ Available | — | Endpoints now `seasons/2026` primary, `seasons/2025` fallback |
| Supabase | ✅ Connected | — | odds_snapshots, line_movements, game_results, futures, podcasts, user_picks |
| Schedule.json | ✅ Local | — | `public/schedule.json` |
| Weekly Stats | ✅ Local | — | `public/weekly_stats.json` — still 2025 data until Python scripts re-bumped (late Aug 2026) |
| Podcast Pipeline | ✅ Built | — | Groq → AssemblyAI → OpenAI Whisper fallback chain |

---

## Offseason Architecture Vision (Locked 2026-05-08)

> Sourced from Creator Q&A session. This is the authoritative direction for all offseason build work.
> PM Agent: all new task scoping must align with these four pillars.

### Pillar 1 — Hermes/Obsidian NFL Betting Vault
- A **dedicated NFL betting vault** (separate from personal Obsidian second brain) that evolves into a betting brain.
- **Writes to vault** (after every BETTING session): angles played, outcomes, lessons learned, sharp signals noted.
- **Reads from vault** (at BETTING agent conversation start): coach historical play-calling tendencies, game theory notes,
  statistical patterns, player season stats, DVOA, EPA, reference material ingested by the Creator.
- Vault to be pre-loaded this offseason with: historical stats, team rosters, coaching data, game strategy reference books.
- Integration mechanism: Hermes MCP server (being built with M6). Details TBD pending Hermes architecture finalization.

### Pillar 2 — Expanded Data Ingestion
Trusted sources by priority (Creator-confirmed 2026-05-08):
1. **Sharp money % + public bet %** — Action Network is primary source
2. **Podcast experts** — already in pipeline (Sharp or Square, Even Money, Action Network, Warren Sharp)
3. **Action Network articles** — RSS or scrape; same trust level as podcasts
4. **BettingPros articles** — scrape or RSS
5. **VSiN articles** — scrape or RSS
6. **Twitter/X sharp accounts** — Creator has a dedicated X account used solely for Platinum Rose NFL/NCAA;
   list of sharp accounts to follow is maintained separately. X API access status: TBD (see open questions).

All article/written ingestion follows the same pattern as podcast pipeline:
→ ingest → extract picks + angles → promote to `user_picks` (source='EXPERT') or new `intel_notes` table.

### Pillar 3 — BETTING Agent Game-Day Proactive Mode
- By Sunday morning most bets are already placed.
- Use case: BETTING agent for **afternoon slate + MNF** — last-minute intel, line moves, injury news.
- Agent must **proactively open with its best plays** (not wait to be asked), then let Creator drill down.
- This implies a "Sunday Slate Briefing" entry mode — a specific prompt/command that triggers proactive output.
- No parlay/total separation in bankroll — everything is one bankroll, **fixed unit size**.
- ROI tracking by bet type (straights / parlays / futures) is required for post-season analysis.

### Pillar 4 — Performance Feedback Loop
- Track ROI by: bet type, team, situation (home/away, spread range, dome/outdoor, etc.).
- Surface calibration signals back to BETTING agent: "You're 2-8 on road underdog parlays — flag these."
- Requires: pick history already in Supabase ✅; need analytics aggregation layer + BETTING agent context injection.

---

## Data Sprint Kickoff (Locked 2026-05-17)

Execution order is fixed for this sprint:

1. DS-2 — season schedule spine
2. DS-3 — futures breadth expansion
3. DS-4 — research intel ingest v1

### In-Flight Changes Folded Into This Plan

- `agents/futures-odds-ingest.js` dotenv import is now the baseline server-agent env pattern for DS-3.
- `package.json` + `package-lock.json` dotenv dependency updates are accepted as DS-3 prerequisites.
- `skills/team-normalization.md` is promoted as a hard requirement for DS-2 joins across ESPN/TheOddsAPI/user data.
- `.atlas-bridge/tasks.jsonl` queued futures refresh task (`c65590da-1b4e-4401-8198-2d8cc661e2e2`) is treated as seed execution for DS-3.

### In-Flight Changes Explicitly Not In Scope for Data Sprint

- `.atlas-bridge/sync.json` (bridge metadata)
- `skills/deployment-flow/SKILL.md` (useful operational guidance, but not DS-2/DS-3/DS-4 scope)
- `supabase/.temp/` artifacts (local tooling cache)

### DS-2 — Season Schedule Spine (P0)

Objective:

- Create canonical `games` schedule backbone for all joins (odds, results, picks, intel).

Primary sources:

- ESPN schedule endpoints (2026 season)
- Existing local fallback: `public/schedule.json`

Schema target (`games`):

- `game_id` (text, deterministic)
- `season` (int)
- `week` (int)
- `kickoff_utc` (timestamptz)
- `home_team` (text)
- `away_team` (text)
- `status` (text: scheduled/live/final/postponed)
- `espn_event_id` (text)
- `updated_at` (timestamptz)

Success criteria:

- 2026 full schedule loaded with stable `game_id` and no duplicate game rows.
- Weekly queryability validated (`week = N` returns complete slate).

### DS-3 — Futures Breadth Expansion (P0)

Objective:

- Extend futures coverage beyond Super Bowl into conference, division, and awards where available.

Primary source:

- TheOddsAPI futures markets

Schema target (`futures_odds_snapshots`):

- existing fields retained
- add/verify dimensions: `market_type`, `book`, `selection`, `price`, `captured_at`, `season`
- explicit market availability status (`available` / `unavailable`) in run report

Success criteria:

- `agents/futures-odds-ingest.js` writes deterministic snapshots for all available market groups.
- Unavailable market groups are logged as expected offseason gaps, not silent failures.

### DS-4 — Research Intel Ingest v1 (P1)

Objective:

- Normalize written + podcast research into structured tables used by BETTING agent preloads.

Primary sources:

- Action Network / BettingPros / VSiN written content
- existing podcast extraction outputs

Schema targets:

- `research_intel_notes`: `source`, `url`, `published_at`, `title`, `summary`, `confidence`, `captured_at`
- `research_pick_signals`: `source`, `team_or_market`, `bet_type`, `lean`, `rationale`, `event_ref`, `captured_at`

Success criteria:

- BETTING context can query the last 72h of source-attributed research signals.
- Duplicate URL/content ingestion prevented by content hash or canonical URL key.

---

## Blockers

None.

## Open Questions (blocking architecture finalization — 2026-05-08)

1. **Hermes/Obsidian**: What is the current Hermes MCP server integration pattern? What vault path will
   the NFL betting vault live at? What note format (frontmatter schema)?
2. **Twitter/X**: Does Creator have X API access (Basic/Premium tier)? Or is sharp-account ingestion
   a manual curation workflow via the dedicated account?
3. **Article ingestion**: Action Network / BettingPros / VSiN — do any of these have usable RSS feeds,
   or is this web scraping territory (Playwright / Firecrawl)?
4. **Reference data on hand**: Does Creator have any existing DVOA CSVs, PFF grade exports, roster files,
   or game strategy PDFs ready to load into the vault now?

## Deferred (known, non-blocking)

- **Python scripts season bump** (`scripts/*.py`): intentionally still `SEASON = 2025`. 2026 regular-season stats data doesn't exist until Sep 2026; premature bump would wipe `weekly_stats.json`. Revisit late-August 2026.
- **Props auto-grade pipeline agent**: no GHA agent yet grades `nfl_props_picks_v1`. Candidate future feature (parallel to `agents/nfl-auto-grade.js`).
- **TheOddsAPI props tier**: PROPS agent fully built; prop lines require paid tier. Revisit pre-season.

---

## Head Commit

```text
Branch: main
Commit: (run `git log -1 --oneline` — latest is the F-8 PROPS agent + season bump)
Remote: origin/main synced
```

---

## Next Session Priority

**Vision locked (2026-05-08). Offseason build sequence targets Week 1 readiness.**
Four open architecture questions must be answered before full task breakdown (see ## Open Questions above).

Pending answers, work can begin on:

1. **F-9 Sunday Slate Briefing mode** — proactive BETTING agent entry point (Pillar 3)
2. **F-10 Performance feedback loop** — ROI aggregation by bet type/team/situation (Pillar 4)
3. **F-11 Article ingestion pipeline** — Action Network / BettingPros / VSiN written content (Pillar 2)
4. **F-12 Hermes/Obsidian NFL vault integration** — read + write path (Pillar 1; blocked on open Q #1)

Run `npm run resume` to generate canonical resume command at session start.
