---
name: handoff-close
description: Use whenever the user says handoff, wrap up, end session, close out, or asks to save session state. Runs the Session Close half of this project's actual Unified Session Context Protocol (AGENTS.md) -- not a self-invented persistence mechanism.
---

Run Session Close exactly per this project's `AGENTS.md` "Unified Session Context
Protocol." Read before writing and preserve concurrent/dirty work.

For a standard same-team handoff, write one dated handoff with: verified Git state,
completed work, active lane, concrete next action, stop conditions, and named artifacts.
Update `HANDOFF.md` as a short router only: one current pickup, current guardrails,
open decisions, and links. Move superseded prose to dated handoffs; do not create a
rolling archive in the root file.

For a zero-context transfer to another team or platform, invoke `h2c2` instead. It adds
a concise required entry brief, a detailed recovery packet, and a local manifest/copies
of needed nonportable inputs. Do not use H2C2 for an ordinary same-team continuation.

Before closing, show the relevant Git state and report the files changed. If live Git and
handoff prose conflict, stop and surface the mismatch rather than guessing.
