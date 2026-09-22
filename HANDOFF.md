# NFL_Dashboard - Current Handoff

> Start here, then reconcile live Git state. This file is intentionally a short
> current-state index, not a rolling archive. Historical detail belongs in
> `handoffs/` and `handoffs/archive/`.

**Last governance trim:** 2026-09-22 by Codex
**Last verified HEAD:** `e02482e fix(bankroll): use recorded settled profit for partial round-robin wins`
**Last verified branch:** `wip/yahoo-sync` (`origin/wip/yahoo-sync`, in sync)
**Workspace state:** very dirty/shared; run `git status -sb` before trusting any
handoff prose. A full copy of the pre-trim rolling handoff was archived at
`handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`.

## Current Pick Up Here

Latest active handoff source:
`handoffs/2026-09-21-2310-claude-week2-closeout-handoff.md` (Week 2 fully
settled and reconciled across wagers JSON, futures ledger, Supabase and git;
Week 3 tracker built; rule corrections: -350 leg barrier, QB rush/INT on
matchup fit, missing-from-box-score = loss). Earlier context:
`handoffs/2026-09-22-0240-claude-to-claude-full-project-handoff.md`

Active Week 2 / MNF state from the trimmed rolling handoff:

1. Live tracker Week 1 stat leak was fixed and verified in
   `scripts/generate-live-tracker.mjs`.
2. BetOnline stop-label parsing was fixed and covered by
   `tests/unit/betonlineLiveParser.test.js`.
3. Bookmaker live-capture regressions were patched via
   `scripts/props/bookmaker-live-normalize.mjs` and
   `tests/unit/bookmakerLiveNormalize.test.js`; this is a stopgap until a real
   reusable Bookmaker parser exists.
4. The live tracker now treats injured-player `Out` as informational and
   separate from `Burnt`; do not re-couple those states.
5. Six MNF NYG @ LAR tickets were logged in
   `data/official-picks/user-placed-wagers-2026.json`; grading was pending in
   the old handoff because the game was still live.
6. Nine WAS @ DAL player-prop legs were graded at leg level only; ticket-level
   settlement was intentionally left untouched.
7. A larger Week 2 Sunday backlog remains: the old handoff found 131 pending
   legs from final Sunday games. Do not bulk-grade or settle silently.
8. The requested "Graveyard" list of proposed-but-unused prop legs was searched
   for and not found anywhere in the repo.

## Needs Andy / Stop Conditions

- Ask how to handle the 131-leg Week 2 Sunday grading backlog before changing
  real wager settlement state.
- Ask what Andy means by the "Graveyard" list before creating a replacement.
- Confirm whether a reusable `bookmaker-live-parser.mjs` CLI should be built or
  reviewed next; see
  `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`.
- Any Supabase write, paid synthesis, betting/account mutation, official-pick
  promotion, or real wager settlement requires explicit current scope.
- If live Git status contradicts this file, live Git wins and the mismatch
  should be reported before edits.

## Active Guardrails

- Preserve the dirty checkout. Do not clean, reset, stash, broad-stage, or
  delete unrelated files.
- Do not use `git add -A`; stage narrow, reviewed file sets only.
- The old blanket "no commit/push without Andy approval" guardrail was recorded
  as repealed on 2026-09-15, but commits still need normal scoped judgment,
  clean evidence, and no unrelated dirty work.
- Supabase writes still need explicit per-change authorization.
- Paid model/committee synthesis still needs explicit authorization.
- Betting/account/official-pick/portfolio state must not be mutated unless the
  user explicitly authorizes that exact lane.
- Roster surprises must be verified against live/current data before calling
  them contamination.

## Detailed Handoffs

- Full current orientation:
  `handoffs/2026-09-22-0240-claude-to-claude-full-project-handoff.md`
- Bookmaker parser request:
  `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`
- BetOnline ATD collision review:
  `handoffs/2026-09-21-2011-claude-codex-review-prompt-betonline-atd-collision.md`
- Week 2 Sunday props tooling:
  `handoffs/2026-09-20-1440-claude-week2-sunday-props-tooling-handoff.md`
- Friday pipeline / podcast overhaul:
  `handoffs/2026-09-19-1040-claude-friday-pipeline-podcast-overhaul-handoff.md`
- Lessons-learned token handoff:
  `handoffs/2026-09-18-0110-claude-lessons-learned-token-handoff.md`
- TNF close / price watch handoff:
  `handoffs/2026-09-17-2130-claude-tnf-close-price-watch-handoff.md`
- Legacy rolling handoff before this trim:
  `handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`

## Historical Notes

Older Week 1 / query-dialect / fantasy / Alpha / Antigravity content is no
longer active root context. Load it only when the task asks for that lane or a
linked dated handoff points to it.

## Maintenance Rule

Keep this file short. Add only current pickup, current guardrails, open
decisions, and links to dated handoffs. Archive completed or superseded detail in
`handoffs/` instead of appending another full session transcript here.
