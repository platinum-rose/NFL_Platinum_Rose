# 2026-09-08 21:29 UTC - Claude: Stage 5 source-hierarchy / trust-framing

**Author / Agent:** Claude
**Target / Audience:** Andy, Codex, Antigravity, Claude (next session)
**Repo:** `E:\dev\projects\NFL_Dashboard`
**Branch:** `main`
**Status:** One implementation item done and verified prompt-side; NOT yet
model-verified; NOT committed.

## What changed

Picked up the top open item from `PRE_COMMITTEE_CHECKLIST.md` Stage 5
("Prompt content quality / source weighting") per Andy's direction. Edited
`agents/portfolio-synthesize.js`'s `SYSTEM_PROMPT`:

1. Added a one-line trust-tier tag + short interpretive note to each of the
   three previously-unframed team-profile fields' bullets:
   `vault_analytical_reads`, `master_reports` (both Tier 3 — supplementary
   narrative), and `training_camp_intel` (Tier 4 — color only).
2. Added a new standalone `SOURCE HIERARCHY` paragraph (inserted right
   before `WHAT TO HUNT`) spelling out four tiers of evidentiary weight:
   Tier 1 sportsbook price action + computed signals (primary), Tier 2
   named+timestamped analyst leans (corroboration), Tier 3
   vault_analytical_reads/master_reports (supplementary — a play resting on
   Tier 3 alone should get `needs_human_review=true`), Tier 4
   training_camp_intel (color, never a thesis driver alone).

`bettorday_trench` needed no update — it's already fully removed from the
prompt (Decision #2, earlier today), so there's no lane left to frame.

## Verification done this session

- `node --check agents/portfolio-synthesize.js` — clean.
- `node node_modules/eslint/bin/eslint.js agents/portfolio-synthesize.js` —
  clean, 0 errors.
- `diff` against a pre-edit backup — confirmed the change is isolated to
  exactly the two insertions described above; nothing else in the file
  touched.
- `node agents/portfolio-preflight.js --json --warn-only` — re-ran after the
  edit: still `3 BLOCK / 8 WARN / 22 PASS`, identical to before the edit
  (expected — preflight doesn't inspect prompt text). No regression.
- `--prompt-only` dry-run (`--dossier .nfl/portfolio/dossier-2026-09-04.json
  --prompt-only --shadow-slim --skip-intel-audit --allow-expired-evidence-
  lanes --prompt-out .nfl/portfolio/prompt-preview-section5-2026-09-08.json`)
  — ran clean, no model call. Confirmed programmatically that both the new
  `SOURCE HIERARCHY` text and the new per-field bullets appear in the
  actual rendered `system_prompt` (not just source — the real prompt path).
  Full shadow-slim prompt now ~232,800 tokens (up from 225,788 recorded
  earlier today — the increase is this addition, ~26,117 system-prompt
  characters). Per this morning's note, prompt size is not a truncation
  risk against the 1M-context models the pipeline now calls.

## What's still open on this item

- **Not model-verified.** The checklist is explicit that this stage needs
  at least one model call to confirm the model actually weighs the new
  tiering correctly — a `--prompt-only` run proves the text assembles and
  is wired in, nothing more. That verification belongs in Stage 6 (mocked
  committee dry-run) or Stage 9 (full rehearsal), neither of which has been
  run yet against ANY of today's pipeline changes, not just this one.
- **Not reviewed by Andy.** The exact wording of the source-hierarchy
  statement is a judgment call (what counts as Tier 3 vs Tier 4, the
  needs_human_review escalation rule) — flagging for his sign-off before
  treating it as final, per the checklist's own instruction to draft this
  for review rather than ship it unilaterally.
- **Not committed.** Per standing guardrail — scoped `git add` only with
  Andy's explicit approval.

`docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md`
updated in place: Stage 5's first two checkboxes marked done with detail,
third left open with an explicit note on what's still missing.

## Next session should

1. Get Andy's read on the source-hierarchy wording (or he may just approve
   it as-is).
2. Set up and run Stage 6's mocked dry-run harness (same pattern as the
   2026-07-22 board-validator work — mock-fetch-preload style, zero spend)
   to actually verify the model uses the new tiering as intended — this
   was already flagged as not-yet-run for ALL of today's changes, not
   introduced by this item.
3. Once Andy signs off and Stage 6 is clean, this item plus everything
   else in the earlier 21:04 handoff becomes ready for a scoped, approved
   commit — still awaiting that approval.

## Standing guardrails, unchanged

No `git add -A`/broad staging/commit/push without Andy's explicit approval;
no Supabase writes without per-write authorization; no paid committee
synthesis without explicit authorization; no betting picks/official-pick
promotions/portfolio mutations without authorization; no Yahoo Fantasy
work; preserve the dirty worktree.
