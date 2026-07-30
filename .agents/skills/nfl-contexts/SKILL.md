---
name: nfl-contexts
description: Defines the operating rules for different modes depending on the current season or task context.
---

# NFL Context Modes

**When to Activate:** Read this skill to understand behavioral rules for different operating contexts. Check `WORKING-CONTEXT.md` to see which mode is currently active.

## 1. Offseason Mode
**Active during:** Post-Super Bowl to NFL preseason start.
**Rules:**
- **Allowed:** Full feature development within PM-scoped plan, architecture changes/refactoring, new npm dependencies (with PM approval), localStorage key migrations (must have backward-compat helper), deploying to production.
- **Restricted:** Breaking API changes to existing localStorage schema without migration. Deleting `src/` files without a PM task brief.
- **Forbidden:** Releasing without passing the test suite, removing critical storage keys.
- **Agent Behavior:** Agents like FEATURE_DEV, CODE_QUALITY, UX_EXPERT are fully active.

## 2. Season-Active Mode
**Active during:** NFL regular season or playoffs.
**Rules:**
- **Allowed:** Bug fixes scoped to broken behavior only (no refactor, no cleanup), data pipeline ops (odds ingest, auto-grade), read operations, docs updates.
- **Restricted (Requires Approval):** Any edit to `src/` files, `public/` JSON files, new npm dependencies, schema changes.
- **Forbidden:** New features or components, refactors outside bug fix scope, architecture changes, production deploys.
- **Agent Behavior:** FEATURE_DEV, CODE_QUALITY on standby. DEVOPS, INTEL_AGENT, PM triage, BUG_FIXER active.

## 3. Dev Mode (Standard Development)
**Active during:** General development tasks.
**Rules:**
- **Allowed:** Feature work within PM-assigned file scope, new components/hooks, writing tests.
- **Restricted:** Edits outside PM-delegated scope, new npm dependencies, localStorage key changes without migration, touching `AGENT_LOCK.json` (PM only).
- **Forbidden:** Breaking changes to shared data contracts without migration, touching hot files without explicit lock.

## 4. Research Mode
**Active during:** Investigation, discovery, and analysis tasks (e.g., "what's already implemented?").
**Rules:**
- **Allowed:** Read any file, spawn subagents for multi-file investigations, write reports to `reports/` or `docs/`.
- **Restricted:** Read-only mode. No `src/` edits. If a fix is found, hand off to BUG_FIXER/FEATURE_DEV.
- **Forbidden:** Modifying any file without explicit creator instruction to switch mode.
- **Output:** Summarize findings (What exists, What's missing, Recommendation).

## 5. Review Mode
**Active during:** Post-session code review or PR reviews.
**Rules:**
- **Allowed:** Read any file, write review report, fix what you find (scope limited strictly to the change delta). Focus on Security, Data Integrity, Logic (date handling), and Quality.
- **Restricted:** No refactors outside the reviewed delta. No new features.
- **Forbidden:** Reviewing the full codebase when asked to review a PR (review git delta only).
