# Handoff Document Standards & Conventions

**Rule:** Every handoff document created in `handoffs/` MUST include a standardized, copy-pasteable **Resume Prompt** section at the very bottom.

---

## Required Handoff Sections

1. **Header Metadata:**
   - Date & Time (with timezone)
   - Author / Agent Name
   - Target / Audience (Claude, Antigravity, Andy)
   - Status & Key Commits
2. **Current State & Progress:**
   - Tasks completed with commit hashes and verification outcomes.
   - Known bugs / audit findings and their resolution status.
3. **Standing Constraints & Guardrails:**
   - File ownership rules (e.g. `agents/fantasy-rose-bowl-build.js` sole owner of board files).
   - Environment / credential restrictions.
4. **Next Operational Objectives:**
   - High-leverage development vectors for the next agent/session.
5. **Resume Prompt (`## 📋 Resume Prompt`):**
   - Must be enclosed in a clear code block (markdown format).
   - Must contain:
     - Exact handoff file path reference.
     - 3–5 bullet context snapshot.
     - Standing constraints reminder.
     - Call to action for next operational step.

---

## Standard Resume Prompt Template

```markdown
Resume NFL Dashboard development from handoff: `handoffs/{TIMESTAMP}-{AGENT}-{TOPIC}-handoff.md`.

Context snapshot:
- {Key deliverable 1 and commit hash}
- {Key deliverable 2 and verification status}
- {Integration status with Claude / production pipelines}

Standing constraints:
- Pipeline Ownership Rule: `agents/fantasy-rose-bowl-build.js` is the sole owner of `docs/fantasy/2026_Rose_Bowl_*` and `public/2026_Rose_Bowl_*`.
- No scratch scripts writing to live production draft files.

Please inspect current repository state and ask for the next operational objective or proceed with {NEXT_OBJECTIVE}.
```
