# Platinum Rose — Task Board (NFL)
> **Last updated:** 2026-05-17
> **Owner:** PM agent is the sole writer of this file.

---

## 🏗️ IN PROGRESS

| ID | Task | Assignee | Notes |
|----|------|----------|-------|
| DS-1 | 2026 Data Sprint Kickoff (scope + sequencing) | PM Agent | Concrete implementation sequence locked: DS-2 (schedule spine) → DS-3 (futures breadth) → DS-4 (research intel ingest). |
| F-9 | Sunday Slate Briefing mode (BETTING proactive entry) | feature-dev | Proactive mode scaffolded in AgentChat: Sunday auto-open briefing + manual `Best Plays` trigger. Pending: prompt calibration + game-day UX pass. |

### Data Sprint — Source Priority (Locked 2026-05-17)

1. TheOddsAPI (futures + market snapshots)
2. ESPN (season schedule + game metadata)
3. Action Network / BettingPros / VSiN (written research)
4. Podcast feeds (existing extraction path)

### Data Sprint — In-Flight Work Incorporated

1. `agents/futures-odds-ingest.js` already includes `dotenv/config`; DS-3 adopts this as the required server-agent env pattern.
2. `skills/team-normalization.md` is now the DS-2 canonical guardrail for cross-source team joins.
3. Existing bridge task `c65590da-1b4e-4401-8198-2d8cc661e2e2` (futures refresh) is treated as DS-3 seed work.

### Data Sprint — Core Tables (target state)

| Table | Purpose | Status |
|------|---------|--------|
| `games` | Canonical 2026 season schedule spine (game_id, week, kickoff, home/away, status) | planned |
| `game_odds_snapshots` | Time-series ML/spread/total by book and market | planned |
| `futures_odds_snapshots` | Super Bowl/conference/division/awards futures snapshots | partial (SB live) |
| `research_intel_notes` | Parsed article/podcast research with source attribution and confidence | live validated (NFL-only ingest filter active) |
| `research_pick_signals` | Structured picks/leans extracted from intel sources | live validated (NFL-only ingest filter active) |

---

## 📋 BACKLOG

### Features

| ID | Task | Priority | Notes |
|----|------|----------|-------|
| DS-2 | Build 2026 season schedule spine (`games`) | P0 | Ingest ESPN schedule into new canonical `games` table and local cache (`public/schedule.json`) with deterministic `game_id`; enforce team normalization (`skills/team-normalization.md`) on all joins. |
| DS-3 | Expand futures ingest breadth (`futures_odds_snapshots`) | P0 | Extend `agents/futures-odds-ingest.js` from Super Bowl-only to conference/division (+ awards where available), including explicit unavailable-market handling and run receipts; keep `dotenv/config` server-agent env pattern. |
| DS-4 | Research intel ingest v1 (`research_intel_notes`, `research_pick_signals`) | P1 | Add article + podcast normalization pipeline with source metadata, publish timestamps, and extracted picks/angles for BETTING context preload. |
| F-9 | Sunday Slate Briefing mode (BETTING agent proactive entry) | P1 | In progress — proactive Sunday opening + `Best Plays` command implemented in AgentChat; pending prompt tuning and game-day output validation. |
| F-10 | Performance feedback loop | P1 | ROI aggregation by bet type/team/situation; calibration signals injected into BETTING agent context at session start |
| F-11 | Article ingestion pipeline | P2 | Action Network, BettingPros, VSiN written content; same pattern as podcast pipeline → extract picks/angles → user_picks; blocked on RSS/scrape decision |
| F-12 | Hermes/Obsidian NFL betting vault integration | P1 | Read + write path; BETTING agent writes session notes/angles/outcomes to vault post-session; reads coach tendencies/stats/DVOA/EPA at session start; blocked on Hermes MCP architecture |
| F-13 | Twitter/X sharp-account ingestion | P2 | Creator has dedicated X account for Platinum Rose; follow list of sharp accounts; blocked on X API access decision |
| F-14 | Vault pre-load (reference data) | P2 | Historical stats, team rosters, coaching data, game strategy books into NFL vault; offseason work; blocked on vault path |
| F-15 | Props auto-grade GHA agent | P3 | Grades nfl_props_picks_v1; parallel to nfl-auto-grade.js |

### Bugs

| ID | Task | Priority | Notes |
|----|------|----------|-------|
| — | (none tracked) | — | — |

---

## ✅ DONE

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| F-0 | Phase 1: Governance Foundation | 2026-04-02 | SOUL.md, RULES.md, WORKING-CONTEXT.md, TASK_BOARD.md, AGENTS.md |
| F-1 | Phase 2: Contexts + Hooks + Rules | 2026-04-02 | contexts/ (5), hooks/hooks.json, rules/ (4) |
| F-2 | Phase 3: Dev Agent Architecture | 2026-04-02 | agents/dev/ — 15 adapted YAML-frontmatter prompts |
| F-3 | Phase 4: Product Agent Layer | 2026-04-02 | BETTING.md, INTEL.md (tier1), betting.manifest.json |
| F-4 | Phase 5: CLAUDE.md Consolidation | 2026-04-02 | Orchestration directives, session protocols, commands |
| F-5 | Phase 6: NFL-Specific Additions | 2026-04-02 | ANTI_PATTERNS.md, HANDOFF_PROMPT.md, AGENT_LOCK.json, GOTCHAS.md, gen_resume.js |
| F-6 | Agent Chat POC (BETTING agent) | 2026-04-02 | anthropicClient.js, agentTools.js, AgentChat.jsx — Agent tab live |
| F-7 | DFS Lineup Optimizer | 2026-04-02 | DFSOptimizer.jsx — DK/FD platform toggle, greedy optimizer, lock/exclude, save lineups |
| F-8 | Props Agent | 2026-04-17 | propsTools.js (7 tools), PropsAgentChat.jsx, PROPS.md + manifest, Props tab — stubbed data sources flagged |

---

## 🚫 BLOCKED

| ID | Task | Blocker | Notes |
|----|------|---------|-------|
| DS-4 | Source access decisions | RSS/API availability for Action Network, BettingPros, VSiN (fallback: approved scraping path) |

---

## Legend
- **Priority:** P0 (critical path) · P1 (high) · P2 (medium) · P3 (low/backlog)
- **Prefixes:** F- = feature, B- = bug
