# NFL_Dashboard — Current Handoff

> Start here. This is a routing index, not a transcript. One current pickup only.
> Detail lives in dated `handoffs/`; superseded pickups are in git history and their dated files.

## PICK UP HERE (Tue 2026-10-13 00:40 PT, Week 6 team dossiers built; Monte Carlo review next)

Branch `claude/w5-prop-cards-2026-10-11`. Week 5 closed out. W6 dossiers (32 teams, 14 matchups) built and validated in `data/generated/team-dossiers/2026-w06/`. Suite not verified (`npx vitest run`).
Dated detail: `handoffs/2026-10-13-0040-claude-w6-team-dossiers-built-handoff.md`.

Next, in order:
1. Andy's topic: review how the Monte Carlo simulations are run (read-only; start at `src/lib/simulation.js`, `scripts/margin-simulator.mjs`, the Astra prompt).
2. Tue 7:00 AM PT scheduled FTN capture, then rerun `node scripts/build-team-dossiers.mjs --week=6` and `node scripts/validate-team-dossiers.mjs`.
3. Dossier availability/priors layer (roster gate); capture BKR LAR@ARI and LV@BUF when posted; native-Windows items listed in the dated handoff.

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
