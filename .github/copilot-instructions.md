# NFL_Dashboard — Copilot Instructions

# GitHub Copilot Chat Instructions — Unified Project Context

You are assisting with development on this repository. Follow the **Unified Session Context Protocol** for every session.

## Startup & Context Rules
1. **Read Session Handoff**: Before generating code or diagnosing bugs, read `HANDOFF.md` §`Pick Up Here` and §`Persistent Backlogs`.
2. **Respect Boundaries**: Scope edits strictly to files inside this repository unless explicitly directed.
3. **Session Close Checklist**: When concluding a session, remind the user or update `HANDOFF.md §Pick Up Here` with a clean `(DONE)` summary block.

---
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
