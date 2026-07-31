# Platinum Rose NFL Handoff - YouTube Recovery + Expert Dossier Context

- **Platform:** Codex
- **Date:** 2026-07-31 13:15 local
- **Branch:** `main`
- **Workspace:** `E:\dev\projects\NFL_Dashboard`
- **Status:** Handoff for fresh session. Worktree is dirty from multiple parallel workstreams; preserve boundaries and stage narrowly.

## Objective

Continue the local/read-only futures data-gathering sprint after hardening YouTube recovery, building expert-dossier context, and reviewing whether future LLM synthesis could miss high-signal local data.

The next session should not proceed to paid/frontier synthesis until stale primary-book prices are refreshed or explicitly waived.

## Done

- Added a local recovery process for reprocess-required YouTube/Gemini observations:
  - `scripts/recover-youtube-local-intel.js`
  - `npm.cmd run youtube:recover-local`
  - Recovery artifacts under `data/shadow-harness/recovery/`
  - Human review docs under `docs/antigravity/recovery/`
- Recovered and reviewed the `youtube-qoCm4G2Jmng` Top 10 QBs episode enough to expose analyst-tendency signals, while preserving the extraction failure state.
- Confirmed Simon Hunter's list was not truly missing; it appeared in a later tainted segment and is salvageable only as local recovery context, not clean transcript evidence.
- Added expert dossiers as a local context lane:
  - `scripts/build-expert-dossiers.js`
  - `npm.cmd run expert-dossiers:build`
  - `data/expert-dossiers/latest.json`
  - `data/expert-dossiers/*.json`
  - `docs/antigravity/expert-dossiers/*.md`
  - `docs/antigravity/expert-dossiers/*.html`
- Current expert-dossier build summary:
  - 13 expert dossiers
  - 3 local-recovery signals
  - 30 rank observations
  - Chad Millman, Simon Hunter, and Rich Hribar have local-recovery QB ranking signals.
- Wired `agents/portfolio-synthesize.js` to load `data/expert-dossiers/latest.json` automatically as `EXPERT DOSSIER CONTEXT`.
- Updated `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md` so expert dossiers are named as analyst-prior/bias context only.
- Updated `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` to explicitly include:
  - podcast/YouTube freshness reconciliation
  - expert dossiers
  - training-camp coverage fill
  - starter-impact availability digest
  - projected/likely starters
  - prediction-market context
  - cross-market coherence
  - 2026 projection baselines
- Added `docs/FUTURES_INFERENCE_PACKET_COVERAGE_AUDIT_2026-07-31.md` to record which local artifacts are reachable or at risk of being missed by LLM synthesis.
- Updated `scripts/build-intel-source-audit-report.js` so the source audit includes an Expert dossiers row under Expert and Podcast Intel.
- Rebuilt the latest source audit:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-31T18-51-51-486Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-31T18-51-51-486Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

## Verified State

- `npm.cmd run expert-dossiers:build` passed:
  - `dossiers=13`
  - `recovery_signals=3`
  - `observations=30`
- Syntax checks passed:
  - `node --check scripts/build-expert-dossiers.js`
  - `node --check scripts/recover-youtube-local-intel.js`
  - `node --check scripts/build-intel-source-audit-report.js`
  - `node --check agents/portfolio-synthesize.js`
- Focused `git diff --check` passed for the edited handoff/packet/script files.
- `npm.cmd run intel:source-audit` wrote the latest audit but returned `BLOCKED`.
- Latest source-audit counts:
  - Current 2
  - Review 20
  - Stale 3
  - Blocked 0
  - Missing 0
  - Context 12
  - Inference 1
- Source-audit blocker reason:
  - July 29 normalized primary-book exports are now stale under freshness rules:
    - `data/futures-imports/betonline-2026-07-29.json`
    - `data/futures-imports/betus-2026-07-29.json`
    - `data/futures-imports/bookmaker-2026-07-29.json`
- Expert-dossier source-audit row is present and clean:
  - 13 expert dossiers
  - 3 local-recovery signals
  - 3 context-only signals
  - 0 missing dossier files
- `npx.cmd eslint scripts/build-expert-dossiers.js scripts/recover-youtube-local-intel.js scripts/build-intel-source-audit-report.js agents/portfolio-synthesize.js` still fails on pre-existing `agents/portfolio-synthesize.js` issues outside the new dossier-loader block:
  - no-useless-escape at line 597
  - unused `validateRecommendation`
  - unused `byKey`
  - two unused `section` variables

## Pending

1. Refresh or explicitly waive stale July 29 primary-book exports before any paid/frontier synthesis.
2. Decide whether to run a fresh primary-book normalization pass for BetUS, Bookmaker/BKR, and BetOnline.
3. Keep `youtube-OAxHvrVUPpw` NFC South and `youtube-qoCm4G2Jmng` Top 10 QBs out of accepted YouTube intel until extraction quality is resolved.
4. Use recovered QB rankings only through `local_recovery_context_only` expert-dossier signals after human review.
5. Consider adding a July 31 replacement synthesis packet once prices are refreshed/waived, because the July 30 packet now has a July 31 addendum but remains dated July 30.
6. Optional cleanup: address pre-existing eslint issues in `agents/portfolio-synthesize.js` in a separate narrow pass if that file needs lint-clean status.

## Supabase Migration State

- No Supabase migration is owed from this checkpoint.
- No Supabase writes were made.
- Persistent rule remains active: if a future task requires a Supabase migration, notify the user at task completion unless live application/verification is confirmed, and record the migration as an unfinished handoff item until confirmed live.

## Guardrails Observed

- No paid/frontier model calls.
- No Supabase writes.
- No official-pick approvals, proposals, or persistence.
- No production recommendation persistence.
- No portfolio mutation.
- No open-parlay changes.
- No `git add -A`; no staging was performed in this checkpoint.

## Dirty Worktree Boundaries

The worktree is dirty from multiple workstreams. Preserve unrelated changes. Start by running `git status --short` and inspecting diffs before edits.

Known current changed/untracked areas include:

- YouTube hardening and recovery:
  - `scripts/youtube-podcast-sweep.js`
  - `scripts/gemini-podcast-shadow-harness.js`
  - `scripts/run_gemini_youtube_shadow.py`
  - `scripts/build-youtube-futures-intel-review.js`
  - `scripts/recover-youtube-local-intel.js`
  - `scripts/repair-segmented-youtube-observation.js`
  - `data/shadow-harness/observations/`
  - `data/shadow-harness/recovery/`
  - `docs/antigravity/recovery/`
- Expert dossiers and inference packet work:
  - `scripts/build-expert-dossiers.js`
  - `data/expert-dossiers/`
  - `docs/antigravity/expert-dossiers/`
  - `agents/portfolio-synthesize.js`
  - `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md`
  - `scripts/build-intel-source-audit-report.js`
  - `docs/FUTURES_INFERENCE_PACKET_COVERAGE_AUDIT_2026-07-31.md`
  - `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
  - `package.json`
- Prior data-gathering sprint artifacts:
  - `docs/projected-starters/`
  - `docs/player-availability/starter-impact-digest-latest.md`
  - `docs/training-camp/training-camp-coverage-fill-latest.md`
  - `docs/prediction-markets/*`
  - `data/prediction-markets/*`
  - `data/generated/team-profiles/*`
- Existing protocol/context edits:
  - `.codex/rules/session.md`
  - `CONTEXT_HANDOFF_PROTOCOL.md`

## Immediate Next Step

Open a fresh session, read the files below, perform the project capability scan, inspect current git status, then decide whether the next local action is:

1. refresh/normalize primary-book prices so the source audit can return PASSABLE again, or
2. explicitly mark July 29 primary books as waived/stale context only and defer paid/frontier synthesis.

Do not run any paid/frontier model or live write path without explicit approval.

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard from handoffs\2026-07-31-1315-youtube-recovery-expert-dossier-handoff.md. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/FUTURES_INFERENCE_PACKET_COVERAGE_AUDIT_2026-07-31.md, docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html, docs/antigravity/recovery/youtube-qoCm4G2Jmng-local-recovery.md, docs/antigravity/expert-dossiers/index.md, data/expert-dossiers/latest.json, and this handoff. Before planning, scan .codex/rules/, .codex/hooks.json, skills/, agents/, .agents/skills/, and hook folders for relevant project-local guidance; read only task-relevant local SKILL.md files. Objective: continue the local/read-only futures data-gathering sprint after YouTube recovery and expert-dossier wiring, preserving dirty-work boundaries. Verified state: expert dossiers are built locally with 13 dossiers, 3 local-recovery signals, and 30 rank observations; agents/portfolio-synthesize.js loads data/expert-dossiers/latest.json automatically as EXPERT DOSSIER CONTEXT; source audit includes an Expert dossiers row with 0 missing dossier files. Latest source audit is BLOCKED, not PASSABLE, because the July 29 normalized primary-book exports for BetOnline, BetUS, and Bookmaker/BKR are stale under freshness rules. No model/API call, Supabase write, official-pick action, production recommendation persistence, portfolio mutation, or open-parlay change was made. No Supabase migration is owed from this checkpoint. Immediate next step: inspect git status, preserve unrelated dirty work, then refresh/normalize the primary-book exports or explicitly waive stale primary-book rows before any paid/frontier synthesis. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals/persistence, no production recommendation persistence, and no open-parlay changes without explicit approval; stage narrowly and do not use git add -A.
```
