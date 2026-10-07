---
name: handoff-start
description: Use whenever the user says session start, resume, pick up here, or asks what's the current state of this project. Runs the Session Start half of this project's Unified Session Context Protocol (AGENTS.md).
---

Run Session Start per this project's `AGENTS.md` "Unified Session Context Protocol".

Read `HANDOFF.md`, then run `git status -sb`, `git branch --show-current`, and
`git log -5 --oneline`. Live Git beats handoff prose: report a meaningful mismatch before
editing.

For a standard handoff, load only the linked dated handoff for the active lane. For an
H2C2 cross-team handoff, load `H2C2_START_HERE.md`, select the lane, then load only that
lane's briefing section and named artifacts. Do not load the chain digest, historical
handoffs, snapshot manifest, or unrelated lanes unless the task requires recovery or a
contradiction must be resolved.

Return a compact brief: branch/HEAD, dirty-state warning, active lane, stop conditions,
and the next safe action.
