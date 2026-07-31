# NFL_Dashboard — Codex Session Rules

# OpenAI Codex Session Rules — Unified Project Context

Follow the **Unified Session Context Protocol** for every session.

<!-- BEGIN UNIFIED SESSION CONTEXT PROTOCOL -->
## Unified Session Context Protocol (Claude, Codex, Antigravity, VS Code Copilot)

### Session Start Protocol (Targeted Read)
1. **Dynamic Session Counter**: Evaluate `global.total_sessions` from `.atlas/memory.json` or `HANDOFF.md §Pick Up Here`. Do not assume session numbers.
2. **Targeted State Read**:
   - Read `HANDOFF.md` §`Pick Up Here` (stop at historical archive).
   - Read `HANDOFF.md` §`Persistent Backlogs` (if present).
   - Read machine state (`.atlas/memory.json` or `.atlas-bridge/` state).
3. **Project Capability Scan**: Before planning or editing, check project-local capability folders and configs:
   - `.codex/rules/` and `.codex/hooks.json` for active Codex session rules and hooks.
   - `skills/` for task-specific local `SKILL.md` guidance; read only the relevant skill entry before applying it.
   - `agents/` for project-specific agent roles, scripts, or reusable workflows that match the task.
   - `hooks/` or `.codex/hooks/` for available quality, safety, or session automation.
   - Treat local skills and agents as reusable project context, but do not assume they are automatically active unless this runtime exposes them or the task explicitly invokes them.
4. **Git State Verification**: Run `git status --short` and `git log -n 5 --oneline` to note recent commits and uncommitted files.
5. **Surface Brief**: Print compact summary (Last Commit, Active Task, Open Backlog Count, Relevant Local Skills/Agents/Hooks) and confirm next steps with user.

### Session Close Protocol (State Persistence)
1. **Update Memory State**: Write updated domain/task state to `.atlas/memory.json` (including `last_session_platform` = `claude` | `codex` | `antigravity` | `copilot`).
2. **Update Session Handoff**: Write a clean `(DONE)` summary block (≤ 30 lines) to `HANDOFF.md §Pick Up Here`.
3. **Update Backlogs**: Reconcile open items in tracking backlog files.
4. **Supabase Migration Debt Rule**: If a task requires a Supabase migration, notify the user at task completion unless live application/verification is already confirmed. As redundancy, record the migration as an unfinished handoff item until it is confirmed live; do not hide it behind generic "no Supabase writes" language.
5. **Snapshot Audit**: Log immutable session log snapshot via `SessionLogger` (if supported).
<!-- END UNIFIED SESSION CONTEXT PROTOCOL -->
