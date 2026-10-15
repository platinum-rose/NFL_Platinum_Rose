# NFL_Dashboard — Current Handoff

> Start here. This is a routing index, not a transcript. One current pickup only.
> Detail lives in dated `handoffs/`; superseded pickups are in git history and their dated files.

## PICK UP HERE (Thu 2026-10-15 19:00 PT, futures/exacta tooling + free-bet tracking)

Branch `claude/w5-prop-cards-2026-10-11`; HEAD is the handoff commit on top of `d968cf2` (local, Andy pushes). Verify with `git log --oneline -6`.
Required read: `handoffs/2026-10-15-1900-claude-futures-exacta-freebet-handoff.md`.

Next: Andy's go on the $38.54 free-money exacta plan; TNF prop recapture before 5:15 PM PT; Week 6 QBs and quant-synthesis go (dry-run first); decide W6 vs W5 tracker HTML. Free bet 1005591415 (LV +4.5, pending) is tracked but not bankroll.

## Fast resume (do this, nothing more)

1. Read this file, then only the one dated handoff linked above.
2. `git rev-parse --short HEAD` and `git branch --show-current` (use a 20 s timeout). Do NOT run `git status` on this checkout unless about to commit: it takes 2+ minutes and can leave `.git/index.lock`.
3. If HEAD or branch disagree with this file, stop and report. Otherwise start the next item.

## Guardrails

- Preserve the dirty shared checkout. Never reset, clean, stash, broad-stage, or delete unrelated work; never use `git add -A`.
- Commits on this mount: if `git commit` times out, check no git process is running, remove the zero-byte `.git/index.lock`, then use plumbing (`git write-tree`, `git commit-tree`, `git update-ref`).
- Sportsbooks are read-only. Do not place wagers, make account/cashier actions, or call TheOddsAPI.
- Supabase writes, paid synthesis, portfolio/ledger changes, and official-pick promotion require current, specific authorization. Keep real, paper, and proposed records separate.
- Run the roster gate before presenting player-specific cards or narratives.
- If live Git or current evidence contradicts a handoff, stop and report the mismatch.

## Needs Andy / Stop Conditions

- Week 5 Bills-credit receipt, and any pasted slips.
- Real ticket number for `bet_20261011_betonline_snf_island_6leg` (`pending-not-supplied`) and the leg count on #1004561835.

## Maintenance rule

Keep this file under one screen: one pickup, fast-resume steps, guardrails, stop conditions. A standard handoff adds one dated file in `handoffs/` and OVERWRITES the pickup block above (no stacked or "superseded" blocks). A zero-context team/platform transfer uses the `h2c2` skill.
