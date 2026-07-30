---
name: parallel-session-sync
description: Scans, parses, and reconciles cross-session handoff documents (Codex, Claude, Antigravity) to maintain context awareness across parallel agents.
---
# Parallel Session Handoff Sync Skill

Use this skill whenever the user asks to sync handoffs, inspect parallel session progress, or analyze a new handoff document from Codex, Claude, or another agent thread.

## Activation Triggers
- "Sync handoff" / "Check latest handoff" / "Analyze parallel session"
- "What did Codex/Claude just finish?"
- Handoff file created in `handoffs/*.md`

## Automated Execution Steps

1. **Scan `handoffs/` Directory**:
   - Run `Get-ChildItem handoffs/` sorted by `LastWriteTime` descending.
   - Identify the most recent handoff file(s).

2. **Inspect Git History & Status**:
   - Run `git log -n 5 --oneline` to see recently committed work across sessions.
   - Run `git status --short` to see uncommitted edits.

3. **Reconcile Workstreams**:
   - Compare the workstreams requested in the handoff against what has ALREADY been completed in git / local files.
   - Mark completed items as ✅ `[DONE in Antigravity/Git]`.
   - Identify remaining unblocked items for the active session.

4. **Synthesize Session Context**:
   - Provide a concise 3-part summary to the user:
     1. **Latest Handoff Summary**: Objective, timestamp, source platform.
     2. **Workstream Reconciliation**: Completed items vs. Pending items.
     3. **Recommended Next Actions**: The exact next steps for the active session.
