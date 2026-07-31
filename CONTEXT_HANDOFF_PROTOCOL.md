- At >=80% context usage: warn user and save handoff to memory/YYYY-MM-DD-HHMM-context-handoff.md, do not continue in current session.
- Handoff must include: objective, done, pending, exact resume command, blockers/decisions.
- Resume protocol must include a project capability scan before planning: check `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, and `hooks/` or `.codex/hooks/`; read only task-relevant local `SKILL.md` files and use matching project agents/workflows when appropriate.
- Resume only in fresh session.

Before compaction, write a structured summary to today's memory file
(memory/YYYY-MM-DD.md) using bullet points, not prose. Prioritize by urgency.

CRITICAL (always preserve)

- Session identifier — Agent, session type, start time, duration (helps next
session know what was running)
- Unfinished tasks and their current state — What's in progress, next steps,
blockers
- Promises or commitments made to Jeremy — What you said you'd do and when
- Deadlines within 48 hours — Include: what, when, who requested it
- Anything Jeremy said to "remember" or "don't forget" — Explicit markers

IMPORTANT (preserve if space)

- Decisions made and why — Not just what, but the reasoning
- Source of requests — Jeremy directly, cron job, another agent, self-initiated
- Priority indicators if Jeremy emphasized urgency — Flag high-pressure items
- Blockers or waiting-on items — What's preventing progress
- Config changes made this session — Changes to openclaw.json, cron jobs, agent
settings

SKIP

- Completed tasks already logged to memory — No need to repeat what's done
- Debugging output and intermediate steps — Debugging sessions can be re-run if
needed
- Explanations of concepts (can re-derive)
- Casual conversation — Chat history, banter, thinking out loud
- Failed attempts that led nowhere — Unless they're blocking current work or part
of a pattern

Format

[HH:MM] AgentId:SessionType — Topic

Session: [start → end], [duration], [model used]
CRITICAL:
- [item 1]
- [item 2]
IMPORTANT:
- [item 1]
- [item 2]
Blockers:
- [item 1]

When to Write

- Compaction triggers (32K tokens remaining)
- Session ending with unfinished work
- Major decision or config change
- Jeremy made an explicit "remember this" request

Context Handoff Protocol

If a complex or multi-step task is in progress, also write a handoff document to:
memory/YYYY-MM-DD-HHMM-context-handoff.md

Include these sections:
- Objective: What was the task/goal this session was working on
- Done: What was completed (bullet points)
- Pending: What remains unfinished, with current state of each item
- Resume Command: Exact instruction the next session should receive to continue
(e.g., "resume [task description] from
memory/YYYY-MM-DD-HHMM-context-handoff.md")
- Blockers/Decisions: Anything waiting on Jeremy, external systems, or open
questions

After writing both files, send the user a message:
"Context is getting full. I saved a handoff at [path]. To continue in a fresh
session: resume [task] from [path]"

If no complex task is in progress (casual chat, simple Q&A), skip the handoff doc
— the memory summary is sufficient.
