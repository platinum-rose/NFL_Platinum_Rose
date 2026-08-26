---
name: handoff-close
description: Use whenever the user says handoff, wrap up, end session, close out, or asks to save session state. Runs the Session Close half of this project's actual Unified Session Context Protocol (AGENTS.md) -- not a self-invented persistence mechanism.
---

Run Session Close exactly per this project's own `AGENTS.md` "Unified Session Context
Protocol" section -- do not substitute a different persistence mechanism (your own
conversation transcripts/artifacts folder is fine for your own recovery, but it is never
a substitute for this project's real state files).

1. Identify the real state file yourself (`.atlas-bridge/memory.json` or
   `.atlas/memory.json` -- don't assume). Read it first.

2. Read before you write, and merge -- never replace wholesale. Before touching
   `open_tasks` or `HANDOFF.md`'s Pick Up Here, check what's currently there. Carry
   forward any task that isn't actually done. If you're adding new work, add it
   alongside existing open items -- never let it silently overwrite them. If something
   is genuinely done, say so explicitly rather than letting it vanish with no record.

3. Validate the JSON you write before calling this step done -- parse it back and
   confirm it loads cleanly. A file that fails to parse is worse than a stale one.

4. Update the real state file (health/last_commit, status_summary, open_tasks,
   session_log) and regenerate/write `HANDOFF.md`'s Pick Up Here section.

5. Compute any count (open backlog, task count, etc.) from the real array length --
   never paraphrase or estimate it from a prose description.

6. Show your work: quote real git output (`git status --short`, `git log -n 5 --oneline`)
   and real file contents rather than summarizing them from memory.

7. After closing, report exactly what changed, file by file -- including the commit
   hash if one was made, and a clear list of anything removed, added, or marked done.

If any of this conflicts with something else you were told to do for this project,
stop and flag the conflict to the user rather than silently picking one.
