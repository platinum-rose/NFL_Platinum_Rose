# NFL_Dashboard — Current Handoff

> Start here. This is a routing index, not a transcript. One current pickup only.
> Detail lives in dated `handoffs/`; superseded pickups are in git history and their dated files.

## PICK UP HERE (Mon night 2026-10-12, Week 5 closed out and synced; Week 6 prep next)

Branch `claude/w5-prop-cards-2026-10-11`. W5 settlement, player-games, tracker, Supabase bankroll sync and commit are done. Suite not verified (`npx vitest run`).
Dated detail: `handoffs/2026-10-12-2200-claude-w5-closeout-settlement-handoff.md`.

Next, in order:
1. Andy pastes the rest of the BKR Week 6 opening lines (saved so far: `data/odds/BKR_current_lines_1012_2150`, through WSH@SF).
2. Tuesday: `weekly-archive.mjs --week 5` natively on Windows; Week 6 setup; DKP gate fix only with Andy's OK.
3. Optional: DK promo ticket numbers; BEO insurance refund on #1004819658 (Wed).

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

- MNF BUF@LAR result and any pasted slips.
- Real ticket number for `bet_20261011_betonline_snf_island_6leg` (`pending-not-supplied`) and the leg count on #1004561835.

## Maintenance rule

Keep this file under one screen: one pickup, fast-resume steps, guardrails, stop conditions. A standard handoff adds one dated file in `handoffs/` and OVERWRITES the pickup block above (no stacked or "superseded" blocks). A zero-context team/platform transfer uses the `h2c2` skill.
