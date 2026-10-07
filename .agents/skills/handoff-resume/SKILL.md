---
name: handoff-resume
description: Use whenever the user asks for a resume prompt to hand to another session or platform, or says draft a resume / cold-start prompt.
---

Treat this as a fresh Session Start, not a continuation. Read `HANDOFF.md`, reconcile
live Git (`git status -sb`, branch, and recent log), and identify the active lane.

For a standard handoff, name only the one dated handoff needed for that lane. For H2C2,
start with the packet's `H2C2_START_HERE.md`, then route to the relevant lane section;
reserve the detailed packet and chain digest for recovery or contradiction resolution.
Never present handoff prose as current when Git disagrees.
