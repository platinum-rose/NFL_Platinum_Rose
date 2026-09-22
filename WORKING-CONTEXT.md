# Working Context - Platinum Rose NFL Dashboard

This file is no longer the active session-state source.

Start every session with:

1. `HANDOFF.md`
2. Live Git reconciliation:

```powershell
git status -sb
git branch --show-current
git log -5 --oneline
```

Use dated files in `handoffs/` only for the lane you are actively resuming or
reviewing. If this file, a dated handoff, or assistant memory conflicts with
live Git or `HANDOFF.md`, stop and report the mismatch before editing.

## Standing Guardrails

- Preserve dirty concurrent work. Do not clean, reset, stash, broad-stage, or
  delete unrelated files.
- Use narrow, reviewed staging only; never use `git add -A` in this repo.
- Supabase writes require explicit per-change authorization.
- Paid model/committee synthesis requires explicit authorization.
- Betting/account/official-pick/portfolio mutations require explicit current
  scope.
- Historical one-off resume prompts belong in `handoffs/archive/`, not in root
  context.
