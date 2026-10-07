---
name: h2c2
description: Create a complete, locally reproducible cross-team handoff for a new Claude, Codex, or Antigravity team with no working context. Use for a team or platform transfer, not an ordinary same-team session handoff.
---

# H2C2 — Handoff 2 Claude 2

Use H2C2 when a different team needs enough durable context to continue work safely.
It is a layered transfer, not a shorter standard handoff.

## Before writing

- Reconcile live Git and the dirty-worktree boundary. Record the observed branch/HEAD
  and treat them as authoritative over prior prose.
- Identify the receiving team's lanes, open decisions, stop conditions, and source
  artifacts. Preserve real, paper, proposed, and externally reported state separately.
- Copy only nonportable, gitignored, untracked, or dirty artifacts that the receiver
  actually needs. Put them under a dated snapshot directory at their original relative
  paths and write a manifest with source path, Git state, purpose, and copy status.
- Never copy secrets, credentials, private logs, or account/session material.

## Required outputs

1. A dated detailed briefing in `handoffs/` that explains scope, verified state,
   workstreams, decisions, guardrails, corrections, and task-specific resume steps.
2. `reports/handoff-snapshots/<date>-h2c2-<slug>/H2C2_START_HERE.md`: a concise,
   required first read. It must state the live-Git check, guardrails, active lanes,
   stop conditions, and a lane-to-artifact map. It must say that the detailed briefing,
   chain digest, manifest, and historical handoffs are on-demand unless the selected
   lane needs them.
3. A snapshot README and file manifest. A chain digest is optional recovery material,
   not a mandatory startup read.
4. One short `HANDOFF.md` pickup pointer to the H2C2 start brief and detailed briefing.
   Remove or archive superseded pickup summaries rather than retaining a rolling list.

## Receiver routing

The start brief and resume prompt must direct the new team to:

1. read the start brief;
2. run the current Git checks;
3. choose one lane;
4. load only the matching detailed section and source artifacts;
5. consult the chain digest/manifest/older handoffs only for a contradiction, recovery,
   audit, or explicit history request.

Do not require every receiver to read every artifact merely because it was preserved.

## Closeout

Verify all paths in the lane map. State which artifacts are snapshots versus live
working copies. Preserve normal authorization boundaries; H2C2 does not authorize
wagers, account actions, paid calls, Supabase writes, broad staging, or destructive Git.
