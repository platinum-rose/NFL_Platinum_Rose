# NFL_Dashboard — Current Handoff

## Pick up here — October 31, 2026, 8:25 PM PT (Codex → Sunday card session)

1. Reconcile live Git first; the shared checkout is intentionally dirty. Read only `handoffs/2026-10-31-2025-codex-week8-saturday-close.md` for this lane.
2. For a Sunday-card session, then read `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, run its current preflight, and stop on any required stale input or roster-gate failure.

Baseline commit: `95a4629` on `claude/w5-prop-cards-2026-10-11`. It contains the Week 8 expert-review reindex, Bookmaker roster aliases, and three official Alejandro-split ledger entries. The newest BEO 2+ TD ticket is ledger-only; no Supabase sync or tracker rebuild is authorized by default.

Guardrails: no wager, account, Supabase write, paid call, publication, or push without Andy's current per-action OK; strict roster gate before player-named output; stage explicit paths only, never `git add -A`; preserve all unrelated dirty work.
