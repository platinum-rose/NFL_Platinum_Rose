# NFL_Dashboard - Current Handoff

> Start here, then reconcile live Git state. This file is intentionally a short
> current-state index, not a rolling archive. Historical detail belongs in
> `handoffs/` and `handoffs/archive/`.

**Last governance trim:** 2026-09-22 by Antigravity & Codex
**Last verified HEAD:** `85f70be docs(handoff): record Codex governance closeout`
**Last verified branch:** `wip/yahoo-sync` (`origin/wip/yahoo-sync`, ahead 2 before handoff edits)
**Workspace state:** very dirty/shared; run `git status -sb` before trusting any
handoff prose. A full copy of the pre-trim rolling handoff was archived at
`handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`.

## Current Pick Up Here

Latest active handoff sources:
- `handoffs/2026-09-22-1130-antigravity-scheduled-tasks-and-grok-scanner-handoff.md` (Antigravity automation & scheduled tasks closeout)
- `handoffs/2026-09-22-1110-codex-governance-weekly-synthesis-review-handoff.md` (Codex governance review)

Current state:

1. Governance/context cleanup is closed for now. `CLAUDE.md`, `AGENTS.md`, PM routing,
   `HANDOFF.md`, `HANDOFF_PROMPT.md`, and `WORKING-CONTEXT.md` now align around the
   short root handoff + dated handoff model.
2. Week 2 closed and reconciled. Every Week 2 ticket now has a ticket number in the local
   wagers JSON; the $10 IND@KC 6-leg SGP was corrected to BetOnline. The Supabase sync of
   those changes is **pending Andy's OK**.
3. Weekly card/prop/futures sessions now start from
   `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` (AGENTS.md #16). The old
   `WEEKLY_BETTING_ANALYST_PROMPT.md` is reference-only. Run
   `node scripts/weekly-synthesis-preflight.mjs` first.
4. Next: Week 3 intel gathering in TUE-WED mode. 10 of 21 local inputs were stale at
   01:00 PT Tue, and podcasts are blocked on the AssemblyAI balance.
5. Active rules: leg barrier `-350` (flag >2 legs shorter than -200); QB rushing/INT props
   need a stated matchup fit; a player missing from the final box score = lost leg; 2-team
   RRs on Bookmaker; BKR props same-game only.
6. Automation: Grok Thread Scanner & Windows Scheduled Tasks suite (13 tasks) are active
   in hidden mode. Week 3 rollover active; grok thread prompt generated in
   `data/research-intel/grok-thread-prompt-latest.md`.

## Needs Andy / Stop Conditions

- Confirm whether a reusable `bookmaker-live-parser.mjs` CLI should be built or
  reviewed next; see
  `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`.
- Approve (or not) the Supabase sync: 19 Week 2 ticket numbers + 1 book fix.
- Top up AssemblyAI (podcast ingest is failing on a negative balance).
- Bills-win free-bet credit lands Wed 9/23 by 7pm ET. Choose the play.
- Retry eslint on `scripts/generate-live-tracker.mjs` when the device bridge is
  reliable.
- Paper AI Master RR remains pending in `paper-wagers-2026.json`.
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

- Antigravity scheduled tasks + Grok scanner closeout:
  `handoffs/2026-09-22-1130-antigravity-scheduled-tasks-and-grok-scanner-handoff.md`
- Codex governance + weekly synthesis review closeout:
  `handoffs/2026-09-22-1110-codex-governance-weekly-synthesis-review-handoff.md`
- Week 3 Tuesday setup + synthesis prompt (latest):
  `handoffs/2026-09-22-0120-claude-week3-tuesday-setup-synthesis-prompt-handoff.md`
- Latest Week 2 close-out:
  `handoffs/2026-09-21-2310-claude-week2-closeout-handoff.md`
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
