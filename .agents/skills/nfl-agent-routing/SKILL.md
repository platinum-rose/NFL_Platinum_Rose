---
name: nfl-agent-routing
description: Routing guide for the 15+ specialized agents and lock management protocol.
---

# NFL Agent Routing & Registry

**When to Activate:** Read this skill when you need to delegate work, understand the lock protocol, or determine which specialized agent to invoke based on user requests.

## Lock Management Protocol
- **PM Only:** The PM agent is the only agent that writes to `AGENT_LOCK.json` and `TASK_BOARD.md` directly.
- **No Shared Locks:** An agent MUST NOT edit a file locked by another agent.
- **Hot Files:** `src/App.jsx`, `src/lib/storage.js`, `src/lib/picksDatabase.js`, `CLAUDE.md`. Require explicit PM unlock/delegation before editing.

## Agent Routing Guide
Route user requests to the appropriate specialist agent:

- **BUG_FIXER**: "bug", "broken", "error", "fix". Root cause analysis + fix. Locked files only.
- **FEATURE_DEV**: "add", "build", "create", "feature". PM-delegated scope.
- **TEST_ENGINEER**: "test", "coverage", "e2e". Maintains test suite.
- **CODE_QUALITY**: "audit", "dead code", "refactor". Proactive audits. Read-first.
- **CODE_REVIEW**: "review", "pr review". Correctness review of git delta.
- **SECURITY**: "security", "owasp", "api key". OWASP audits. Docs only.
- **UX_EXPERT**: "ux", "design", "accessibility". UI analysis, JSX/CSS edits.
- **ANALYST**: "betting strategy", "model", "edge". Betting analysis. Docs only.
- **INTEL_AGENT**: "intel", "injury", "matchup card". Matchup analysis. Docs only.
- **WEEKLY_BETTING_ANALYST**: "best bet", "sunday slate", "parlay". Sunday slate analysis. Docs only.
- **MOBILE_DEV**: "mobile", "responsive". Desktop-to-mobile conversion.
- **DEVOPS**: "pipeline", "stale", "devops". Pipeline ops. `scripts/`, `.github/`, config files.
- **SESSION_STARTER**: "start session". Read-only startup checklist (git, tests).
- **DOCS**: "update docs", "claude.md". Doc maintenance.
- **PM**: "plan", "delegate", "sprint". Orchestrator, triage, lock steward.

## Product Tier 1 Agents (Live in App)
These agents have manifests in `agents/manifests/` and operate inside the application Chat UI:
- **BETTING** (`betting.manifest.json`): Spreads, totals, ML, picks.
- **PROPS** (`props.manifest.json`): Player props, SGPs.
- **DFS_OPTIMIZER**: DraftKings/FanDuel lineup builder.
- **INTEL**: Research synthesis, dossier queries.
