# Handoff Command — NFL Platinum Rose
> Load this only when the user types `/handoff` or when a session is long (6+ tasks completed, multi-hour).

---

## When to trigger
- User types `/handoff`
- Session has completed 6+ tasks
- Multi-hour session — proactively suggest running `/handoff`

---

## Output 1: Save file to `handoffs/YYYY-MM-DD-HHMM.md`

Use this structure:

```
# Handoff — YYYY-MM-DD HH:MM
Session: ~Xh | Model: [model name]

## CRITICAL (mid-flight / broken / blocking)
- [item]

## DONE
- [file] — one-line description

## PENDING
- [task] — current state, what remains

## BLOCKERS (waiting on external)
- [item]

## OPEN DECISIONS (need user input)
- [item]

## GOTCHAS DISCOVERED
- [anti-pattern or trap found this session]

## Resume Prompt
[Required. One copy-pasteable prompt for the next fresh session. It must include workspace path, files to read first, current objective, latest verified state, immediate next step, and any guardrails such as no live API/model calls, no Supabase writes, and no betting/parlay changes without approval.]
```

---

## Output 2: Chat message to user

Display the same content in chat, formatted as:

1. **Session summary** — Bullet-point recap organized by CRITICAL / DONE / PENDING
2. **Context briefing** — Self-contained block to paste into a fresh chat:
   - Project name, stack, dev URL, workspace path
   - All files modified this session with one-line descriptions
   - Current state of any in-progress work
   - Immediate next steps in priority order
   - Anti-patterns encountered
   - **Resume Prompt**: One copy-pasteable prompt

Then tell the user: "Handoff saved to `handoffs/YYYY-MM-DD-HHMM.md`. To continue: paste the Resume Prompt into a fresh chat."

---

## What to SKIP in handoffs
- Completed tasks already documented in CLAUDE.md
- Debugging output and intermediate steps
- Concept explanations (can re-derive)
- Casual conversation
- Failed attempts that led nowhere (unless blocking)
