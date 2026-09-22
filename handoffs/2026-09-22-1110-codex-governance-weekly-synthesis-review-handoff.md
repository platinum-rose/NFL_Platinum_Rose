# Codex Handoff - Governance + Weekly Synthesis Review

**Created:** 2026-09-22 11:10 PT
**Branch:** `wip/yahoo-sync`
**Verified HEAD before handoff edits:** `f95e460 docs(governance): align Claude session protocol with handoff index`
**Remote state:** `wip/yahoo-sync...origin/wip/yahoo-sync [ahead 1]` after the Codex governance commit
**Workspace state:** very dirty/shared. Preserve unrelated changes.

## Summary

Codex completed the governance/context cleanup review lane and final review of the new weekly synthesis prompt. The active weekly card / prop-stack / futures workflow is now `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`; the old `WEEKLY_BETTING_ANALYST_PROMPT.md` is reference-only. `CLAUDE.md` was committed by Codex to align Claude session start/close protocol with the new short `HANDOFF.md` root index.

## Commits To Know

- `f95e460 docs(governance): align Claude session protocol with handoff index` - Codex committed `CLAUDE.md` only.
- `0d2080b docs(betting): commit Week 1 post-mortem (referenced by Week 2 analysis and synthesis prompt)`
- `b45fe0a docs(handoff): Week 3 Tuesday setup - ticket reconciliation + synthesis prompt`
- `4f30082 docs(handoffs): add untracked historical dated handoffs (2026-09-09..09-18) and archive`
- `f34045c docs(governance): Codex handoff governance trim`
- `a0ad4b4 docs(agents): PM prompt roster routes weekly card work to WEEKLY_SYNTHESIS_SESSION`
- `67d2176 docs(agents): neutralize WEEKLY_BETTING_ANALYST prompt as an active route`
- `c03fbe2 docs(agents): address Codex review of weekly synthesis prompt`

## What Was Verified

- `git diff --check -- CLAUDE.md` passed before commit.
- `git diff --cached --check` passed before `f95e460`.
- Final review of `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` and `docs/FUTURES_HEDGE_REFERENCE.md` found no blocking issues.
- `scripts/weekly-synthesis-preflight.mjs` parsed with `node --check` and ran locally for Week 3.
- Preflight run showed 10 stale of 21 local sources on 2026-09-22 around 08:11 PT. Supabase SQL was not rerun by Codex in the final review.

## Current State / Important Notes

- `HANDOFF.md` is now the root current-state index. It should stay short.
- `HANDOFF_PROMPT.md` is an archived-prompt pointer only, not active context.
- `WORKING-CONTEXT.md` is a compatibility pointer only.
- `CLAUDE.md` now tells sessions to read `HANDOFF.md`, reconcile live Git, then read only the dated handoff for the active lane.
- `AGENTS.md` routes weekly card / prop stack / futures review work to agent #16, `WEEKLY_SYNTHESIS_SESSION`.
- `agents/dev/PM_PROMPT.md` routes weekly-card work to `WEEKLY_SYNTHESIS_SESSION_PROMPT.md` and marks `WEEKLY_BETTING_ANALYST_PROMPT.md` as reference-only.
- The old analyst prompt had additional unstaged edits from another session during this work. Do not stage it without reviewing that diff.

## Open Items

1. Push `f95e460` if Andy wants the Codex `CLAUDE.md` governance commit on origin.
2. Continue Week 3 TUE-WED synthesis only after reconciling stale inputs from `node scripts/weekly-synthesis-preflight.mjs`.
3. Supabase sync is still pending Andy's explicit OK for Week 2 ticket numbers and the BetOnline book correction.
4. AssemblyAI balance is still a blocker for podcast ingest unless already topped up after this handoff.
5. Do not mutate betting/account/Supabase/official-pick/portfolio state without explicit current-scope authorization.

## Resume Prompt

```text
Resume NFL_Dashboard governance/weekly-synthesis coordination on branch wip/yahoo-sync. Start by running git status -sb, git branch --show-current, and git log -5 --oneline. Read HANDOFF.md first, then this dated handoff: handoffs/2026-09-22-1110-codex-governance-weekly-synthesis-review-handoff.md. Live Git beats handoff prose.

Important state: Codex committed f95e460 (CLAUDE.md only) to align Claude session protocol with the short HANDOFF.md root index. Before this handoff commit, the branch was ahead of origin by 1 and the checkout was very dirty with unrelated betting/data/pipeline edits. Preserve dirty work; do not clean, reset, stash, broad-stage, or stage agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md without reviewing the other session's unstaged diff.

Weekly workflow state: agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md is the active weekly card / prop-stack / futures prompt. docs/FUTURES_HEDGE_REFERENCE.md is the small hedge reference. WEEKLY_BETTING_ANALYST_PROMPT.md is reference-only. Run node scripts/weekly-synthesis-preflight.mjs before any Week 3 synthesis and stop on stale required sources unless Andy explicitly approves proceeding.

Guardrails: no Supabase writes, paid synthesis, betting/account mutations, official-pick promotion, portfolio mutation, broad staging, push, or destructive Git actions without Andy's explicit current approval.
```
