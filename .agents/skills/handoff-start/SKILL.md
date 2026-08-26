---
name: handoff-start
description: Use whenever the user says session start, resume, pick up here, or asks what's the current state of this project. Runs the Session Start half of this project's Unified Session Context Protocol (AGENTS.md).
---

Run Session Start per this project's `AGENTS.md` "Unified Session Context Protocol".
Before summarizing anything: identify the real state file yourself (`.atlas-bridge/
memory.json` or `.atlas/memory.json` -- don't assume), read HANDOFF.md's "Pick Up Here"
section, run `git status --short` and `git log -n 5 --oneline` and show the raw output,
and compute the open backlog count as the literal length of the open-tasks array in the
real state file -- never from a prose summary line. Give the user: Last Commit, Active
Task, Open Backlog Count -- and call out anything in the git output that doesn't match
what the state file claims (a stale last_commit field, a stale date, a task the state
file says is open but the code shows is already done, etc.). If any state file conflicts
with another (e.g. WORKING-CONTEXT.md vs HANDOFF.md), stop and flag the mismatch rather
than picking one to trust.
