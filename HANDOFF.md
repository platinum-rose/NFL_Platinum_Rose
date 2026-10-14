# NFL_Dashboard — Current Handoff

> Start here. This is a routing index, not a transcript. One current pickup only.
> Detail lives in dated `handoffs/`; superseded pickups are in git history and their dated files.

## PICK UP HERE (Tue 2026-10-13 ~21:45 PT, BEO futures capture built; live run in flight)

Branch `claude/w5-prop-cards-2026-10-11` (check `git log -1 --format=%s`). W6 dossiers, per-team postmortems and quant synthesis are current (see prior handoff). `npm run futures:bol` was started live by Andy; its output files are uncommitted and unreviewed.
Dated detail: `handoffs/2026-10-13-2145-claude-beo-futures-capture-live-run-handoff.md`.

Next, in order:
1. Review the live futures output (`data/odds/BEO_futures_*.md`, `data/generated/futures/*.json`): ~842 rows, `Win Total:` / `To Make Playoffs:` market names; commit it.
2. Wed/Thu: BEO props (`npm run bolp -- --week 6`, needs >=500 rows).
3. Fresh BKR W6 lines for all 14 games, then rerun `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --bkr <boards>`.
4. Dossier availability/priors layer (roster gate); parked: player-prop game-state simulator.

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
