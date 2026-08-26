---
name: handoff-resume
description: Use whenever the user asks for a resume prompt to hand to another session or platform, or says draft a resume / cold-start prompt.
---

Treat this as a fresh Session Start, not a continuation. Confirm which file is the real
state file, read it alongside HANDOFF.md's "Pick Up Here" section, run git status/log,
and quote the raw output. If the state file disagrees with what git actually shows, stop
and flag the mismatch to the user instead of proceeding as if the file is correct.
