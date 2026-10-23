# NFL_Dashboard — Current Handoff

> Start here, then reconcile live Git. This is a routing index, not a transcript.
> Detailed history belongs in dated `handoffs/`; cross-team recovery material belongs in
> its dated H2C2 snapshot packet.

## Latest (Claude Team 3, 2026-10-12 ~19:15)

**PICK UP HERE (Week 5 prop cards):** read `handoffs/2026-10-12-1915-claude-team3-w5-prop-cards-pickup-handoff.md` (resume prompt at the bottom). Branch `claude/w5-prop-cards-2026-10-11`, commit `050eb21`. Open: verify overnight ledger settlements, NYG@WSH tie, CIN -7 push, MNF BUF@LAR, tests not run.

## Current pick-up point

**PICK UP HERE: H2C2 round 2, Week 5 Sunday cards (Claude Team 3), 2026-10-11 ~00:50 PT:**

1. Read `reports/handoff-snapshots/2026-10-11-h2c2-week5-cards/H2C2_START_HERE.md`.
2. Run `git status -sb`, `git branch --show-current`, and `git log -12 --oneline`.
3. Choose one lane and load only the matching section of
   `handoffs/2026-10-11-0050-claude-h2c2-week5-cards-round2-briefing.md`.

State: 14 fresh Opus syntheses, slate merge and Master Intel report (gitignored `dist/nfl_week5_master_packet/`; md + single-file html copied to the snapshot) are done on Saturday-night captures that lapse before most kickoffs. Andy recaptures BKR/BEO in the morning. Nothing is pushed.

**Superseded (kept for history):** the 2026-10-10 ~23:15 PT pick-up below.

**H2C2 transfer to Claude Team 2 (Week 5 Sunday cards), 2026-10-10 ~23:15 PT:**

1. Read `reports/handoff-snapshots/2026-10-10-h2c2-week5-sunday/H2C2_START_HERE.md`.
2. Run `git status -sb`, `git branch --show-current`, and `git log -5 --oneline`.
3. Choose one lane and load only the matching section of
   `handoffs/2026-10-10-2310-claude-h2c2-team2-week5-sunday-briefing.md`.

State: all 14 Week 5 per-game syntheses exist (Opus; Astra for 4) on Saturday-night
captures that have expired; review notes and the ESPN roster-group availability gap are in
`reports/intel/games/2026-w05-per-game-review-notes.md` and `...-espn-roster-ir-out-gap.md`.
Codex's card-prep lane: `handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md`.

## Active lanes

- **A. Sunday-morning refresh (first):** Andy recaptures BKR/BEO; ESPN status, roster vet,
  packet rebuild, commit, new HEAD. PHI@JAX kicks off 06:30 PT.
- **B. Pipeline fixes:** ESPN roster-group availability, prompt notes, BEO-expiry check.
- **C. Per-game reruns** on fresh packets (Opus via Claude agents or Astra via Codex).
- **D. Sunday card build:** reconcile Codex's review-only card with per-game outputs and
  fresh prices; proposed only unless Andy authorizes tickets.
- **E. Slate merge** (optional; untested prompt).

## Guardrails

- Preserve the dirty shared checkout. Never reset, clean, stash, broad-stage, or delete
  unrelated work; never use `git add -A`.
- Sportsbooks are read-only. Do not place wagers, make account/cashier actions, or call
  TheOddsAPI.
- Supabase writes, paid synthesis, portfolio/ledger changes, and official-pick promotion
  require current, specific authorization. Keep real, paper, and proposed records separate.
- Run the roster gate before presenting player-specific cards or narratives.
- If live Git or current evidence contradicts a handoff, stop and report the mismatch.

## Maintenance rule

Keep this file under one screen: one current pickup, active lanes, guardrails, and stop
conditions. A standard handoff adds one dated file and updates this pointer. A zero-context
team/platform transfer uses the `h2c2` skill: start brief, detailed packet, and manifest
of locally preserved nonportable inputs.
