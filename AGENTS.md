# Platinum Rose — Master Agent Registry (NFL)
> **Last updated:** 2026-04-17 | **Total agents:** 15 dev + 4 product Tier 1 built (BETTING, PROPS, DFS_OPTIMIZER live; INTEL live as chat surface) + 5 Tier 2 planned
> **Lock protocol:** See `AGENT_LOCK.json` + PM_PROMPT.md §Lock Management for file-mutex rules
> **Orchestration rule:** The PM agent is the only agent that writes to `AGENT_LOCK.json` and `TASK_BOARD.md` directly. All other agents work within PM-delegated file scope.
> **Pipeline agents:** For GHA pipeline agents (OddsIngest, AutoGrade, etc.), see `docs/PIPELINE_AGENTS.md`.

---


> ⚠ **Also read `CLAUDE.md`.** This file is the agent-routing registry only. Project rules -- Key Commands, environment variables, Tab Routing, localStorage keys, the CRITICAL TheOddsAPI rate-limit constraints, Session Protocols, Workflow & Process, Anti-Patterns to Avoid, and Style Constants -- live in `CLAUDE.md`, not here. Any platform (Codex, Antigravity, VS Code Copilot) working on this project should read both files, not just this one.

> **Canonical Antigravity intel:** Before any team synthesizes betting recommendations or reports podcast/article coverage, read `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md`. The Antigravity exhaustive extraction corpus in `scratch/*_master_100percent_exhaustive.md`, plus its derived structured outputs, is a first-class source input for Codex, Claude, Antigravity, and Copilot.

---

## How to Use This File

1. **Finding the right agent:** Scan the "Trigger words" column. If your request matches 2+ words, that's your agent.
2. **Starting an agent:** Open a new chat, paste the activation block from `agents/dev/{AGENT}_PROMPT.md`.
3. **Lock protocol:** PM claims locks before delegating. No two agents may hold a lock on the same file simultaneously.
4. **Product agents (Tier 1/2):** These run inside the Agent Chat UI. Listed here for planning/routing purposes until fully built.

---

## Category A: Dev Agents (15)
> Prompts will live in `agents/dev/`. Activate by pasting the activation block from each file.
> **Status:** Agent prompt files to be created in Phase 3 of `NFL_EVOLUTION_PLAN.md`.

| # | Agent | Prompt File | Role | Trigger Words | Scope Constraint | Docs Only |
|---|-------|-------------|------|--------------|-----------------|-----------|
| 1 | **PM** | `PM_PROMPT.md` | Orchestrator — triage, plan, delegate, lock management, TASK_BOARD steward | "plan", "priority", "what's next", "delegate", "sprint", "kick off" | Writes to: `TASK_BOARD.md`, `AGENT_LOCK.json`. May NOT merge to main, add dependencies, or change architecture without creator approval. | No |
| 2 | **BUG_FIXER** | `BUG_FIXER_PROMPT.md` | Root cause analysis + fix for reported bugs | "bug", "broken", "error", "regression", "fix", "not working", "fails" | Locked files only. Does NOT refactor beyond the fix scope. Does NOT create new components. | No |
| 3 | **FEATURE_DEV** | `FEATURE_DEV_PROMPT.md` | Plan and build new features + components | "add", "build", "create", "implement", "feature", "new component" | PM-delegated file scope. Must follow CLAUDE.md file structure conventions. | No |
| 4 | **TEST_ENGINEER** | `TEST_ENGINEER_PROMPT.md` | Write Vitest + RTL + Playwright tests; maintain test suite | "test", "coverage", "spec", "unit test", "e2e", "playwright", "regression suite" | `src/**/*.test.{js,jsx}`, `e2e/**/*.spec.js`. Does not modify production code. | No |
| 5 | **CODE_QUALITY** | `CODE_QUALITY_PROMPT.md` | Proactive audits: dead code, duplicate utilities, bundle size, complexity | "audit", "dead code", "refactor", "clean up", "duplicate", "complexity", "bundle" | Read-first, then PM approves scope before changes. | No |
| 6 | **CODE_REVIEW** | `CODE_REVIEW_PROMPT.md` | Post-session correctness review (Senior Engineer lens, delta-only) | "review", "pr review", "look over", "second opinion", "code review" | Read-only unless fixing what it finds. Reviews git delta — not full codebase. | No |
| 7 | **SECURITY** | `SECURITY_PROMPT.md` | OWASP audit: key exposure, injection, SSRF, Supabase RLS, prompt injection | "security", "owasp", "api key", "env var", "injection", "xss", "rls", "exposure" | Docs only (writes to security reports). Never modifies src/ directly. | Yes |
| 8 | **UX_EXPERT** | `UX_EXPERT_PROMPT.md` | UI/UX analysis, design system, modal deprecation, accessibility | "ux", "design", "accessibility", "layout", "modal", "responsive", "dark mode" | May edit JSX/CSS. Does NOT touch data logic or hooks. | No |
| 9 | **ANALYST** | `ANALYST_PROMPT.md` | Betting model analysis, strategy R&D, edge quantification | "betting strategy", "model", "edge", "kelly criterion", "value", "expected value" | Docs only (writes to `docs/` or `reports/`). No src/ access. | Yes |
| 10 | **INTEL_AGENT** | `INTEL_AGENT_PROMPT.md` | Intel collection, injury assessment, matchup analysis | "intel", "injury", "matchup card", "scouting", "news", "source", "game analysis" | Writes to `reports/`, `logs/`. No src/ access. | Yes |
| 11 | **MOBILE_DEV** | `MOBILE_DEV_PROMPT.md` | Desktop-to-mobile responsive conversion | "mobile", "responsive", "breakpoint", "touch", "small screen", "mobile view" | JSX + CSS only. Does NOT touch data logic. | No |
| 12 | **DEVOPS** | `DEVOPS_PROMPT.md` | Data freshness, agent health, bundle monitoring, pipeline ops | "pipeline", "stale", "health", "bundle", "devops", "deployment", "monitoring" | `scripts/`, `agents/`, `vite.config.js`, config files. Does NOT touch React components. | No |
| 13 | **SESSION_STARTER** | `SESSION_STARTER_PROMPT.md` | Startup checklist: git state, tests, servers — read-only | "start session", "session start", "what's the state", "git status check" | Read-only. Runs `git status`, `git log`, test suite. Does NOT make changes. | No |
| 14 | **DOCS** | `DOCS_PROMPT.md` | CLAUDE.md / changelog maintenance; doc consistency | "update docs", "claude.md", "changelog", "document", "session close docs" | `CLAUDE.md`, `WORKING-CONTEXT.md`, `docs/*.md`. Does NOT touch src/. | No |
| 15 | **WEEKLY_BETTING_ANALYST** | `WEEKLY_BETTING_ANALYST_PROMPT.md` | NFL Sunday slate analysis: best bets, teasers, round robins, correlated parlays | "best bet", "sunday slate", "teaser", "round robin", "parlay", "weekly picks" | Docs only (`reports/bets/`). No src/ access. | Yes |

---

## Category B: Product Action Agents — Tier 1

> Tier 1 agents run inside the Agent Chat UI (Agent / Props tabs) or as standalone tools (DFS). Each has a context manifest loaded per-conversation.
> Prompts live in `agents/product/tier1/`.

| # | Agent | File | Domain | Core Tools | Status |
|---|-------|------|--------|-----------|--------|
| 1 | **BETTING** | `BETTING.md` | Spreads, totals, ML, futures, hedging, picks | `get_odds`, `get_line_movement`, `analyze_matchup`, `get_injury_report`, `calculate_hedge`, `calculate_teaser`, `log_pick` | ✅ Live (Agent tab) |
| 2 | **INTEL** | `INTEL.md` | Research synthesis, dossier queries, source reviews | `query_team`, `get_latest_intel`, `get_expert_picks`, `get_source_summary`, `flag_contradiction` | 📝 Manifest drafted — chat surface reuses Agent tab |
| 3 | **PROPS** | `PROPS.md` | Player props, line analysis, prop stacks, SGPs, backup-depth flags | `get_player_props`, `analyze_prop`, `get_prop_line_shop`, `build_sgp`, `check_backup_depth`, `get_prop_correlations`, `log_prop` | ✅ Live (Props tab) — prop lines stubbed until TheOddsAPI paid tier |
| 4 | **DFS_OPTIMIZER** | _(DFSOptimizer.jsx)_ | DraftKings/FanDuel lineup construction, lock/exclude, save lineups | In-component greedy optimizer (no Tier-1 manifest yet) | ✅ Live (DFS tab) |

---

## Category C: Product Knowledge Agents — Tier 2 (planned)
> Built starting Phase 4+. Run on schedules. Build dossiers that Tier 1 reads.
> Prompts will live in `agents/product/tier2/` when built.

| # | Agent | File (planned) | Output File | Schedule | Status |
|---|-------|---------------|------------|---------|--------|
| 1 | **COACHES INSIDER** | `coaches_insider.md` | `coaches_dossier.json` | Weekly (NFL) | Phase 4+ |
| 2 | **DEFENSIVE MATCHUP** | `defensive_matchup.md` | `defensive_profiles.json` | Weekly (NFL) | Phase 4+ |
| 3 | **PLAYER PROFILES** | `player_profiles.md` | `player_profiles.json` | Weekly + post-injury-report | Phase 4+ |
| 4 | **TEAM HEALTH** | `team_health.md` | `team_health.json` | Daily during season | Phase 4+ |
| 5 | **SEASON ARCHIVE** | `season_archive.md` | `season_archive.json` | Weekly rollup | Phase 4+ |

Tier 2 agents do not chat. They build. Tier 1 reads what Tier 2 builds.

---

## Agent Routing Guide

**"I have a bug"** → BUG_FIXER
**"I want a new feature"** → FEATURE_DEV (after PM scope + lock)
**"I want to check test coverage"** → TEST_ENGINEER
**"Something looks inefficient or messy"** → CODE_QUALITY (after PM scopes)
**"Review what I just changed"** → CODE_REVIEW
**"Is this secure?"** → SECURITY
**"The UI feels off"** → UX_EXPERT
**"I want betting strategy / model analysis"** → ANALYST
**"I need research on a matchup / injury"** → INTEL_AGENT
**"Best bets for this week's NFL slate?"** → WEEKLY_BETTING_ANALYST
**"Mobile layout is broken"** → MOBILE_DEV
**"Pipeline is stale / overnight failed"** → DEVOPS
**"Start of session — what's the state?"** → SESSION_STARTER
**"Close session / update docs"** → DOCS

---

## Lock Management Summary

> Full protocol: `agents/dev/PM_PROMPT.md` §Lock Management Protocol (Phase 3)

**Core rules:**
- PM writes `AGENT_LOCK.json` before delegating any task that edits files
- Each lock entry: `{ file: "path", locked_by: "AGENT_NAME", task: "brief", acquired: "ISO timestamp" }`
- An agent MUST NOT edit a file locked by another agent
- PM clears locks on task completion or agent timeout (>2 hours)
- `AGENT_LOCK.json` is never locked itself — PM is always the sole writer

**Hot files** (require explicit PM unlock before editing):
- `src/App.jsx` — central state; any edit triggers full regression
- `src/lib/storage.js` — storage layer; key changes require migration
- `src/lib/picksDatabase.js` — picks schema; changes require migration + caller updates
- `CLAUDE.md` — project bible; only DOCS agent or creator edits
- `AGENT_LOCK.json` — only PM writes this

---

*This registry is maintained by the DOCS agent. Update after any agent is added, retired, or scope-changed.*

<RULE[E:\dev\projects\NFL_Dashboard\AGENTS.md]>
<!-- BEGIN UNIFIED SESSION CONTEXT PROTOCOL -->
## Unified Session Context Protocol (Claude, Codex, Antigravity, VS Code Copilot)

### Session Start Protocol (Targeted Read)
1. **Dynamic Session Counter**: Evaluate `global.total_sessions` from `.atlas/memory.json` or `HANDOFF.md §Pick Up Here`. Do not assume session numbers.
2. **Targeted State Read**:
   - Read `HANDOFF.md` §`Pick Up Here` (stop at historical archive).
   - Read `HANDOFF.md` §`Persistent Backlogs` (if present).
   - Read machine state (`.atlas/memory.json` or `.atlas-bridge/` state).
3. **Git State Verification**: Run `git status --short` and `git log -n 5 --oneline` to note recent commits and uncommitted files.
4. **Surface Brief**: Print compact summary (Last Commit, Active Task, Open Backlog Count) and confirm next steps with user.

### Session Close Protocol (State Persistence)
1. **Update Memory State**: Write updated domain/task state to `.atlas/memory.json` (including `last_session_platform` = `claude` | `codex` | `antigravity` | `copilot`).
2. **Update Session Handoff**: Write a clean `(DONE)` summary block (≤ 30 lines) to `HANDOFF.md §Pick Up Here`.
3. **Update Backlogs**: Reconcile open items in tracking backlog files.
4. **Snapshot Audit**: Log immutable session log snapshot via `SessionLogger` (if supported).
<!-- END UNIFIED SESSION CONTEXT PROTOCOL -->
