# NFL_Dashboard - Session Handoff

> Fresh-session resume notes. Read this first, then `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD observed before BetOnline normalization checkpoint:** `5b2db46`
**Latest timestamped handoff:** `handoffs/2026-07-30-1256-antigravity-agents-handoff.md`
**Status:** Completed 32-team manual secondary matchup seed files (coverage schemes, DB roles, receiver roles across all 32 teams) and built secondary vulnerability report (a5ad873). Pushed clean to main/origin/main. Secondary-matchup seed-gap exposure, stale retry artifact cleanup, Antigravity `.agents/skills/` configs, and the 12:56 Antigravity handoff are committed and pushed. Current Codex protocol-access handoff is local and uncommitted.

---

## Pick Up Here

The computer crashed during a dirty source-freshness/readiness workstream that started after the July 29 season-smoke and YouTube/Gemini futures reconciliation handoff. The immediate recovery task is complete, and the safe recovered work has been split into narrow commits.

Latest verified service command:

```powershell
npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app
```

Latest verified smoke:
- Verdict: `READY WITH WATCH ITEMS`.
- PASS 11 / WARN 6 / FAIL 0 / INFO 1.
- Dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.
- Latest report: `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md`.

Use `localhost:5174` for the recovered dashboard session. Earlier probes against `127.0.0.1:5174` failed even while the browser-visible Vite URL worked.

---

## Completed Checkpoints

- `87476f0` - Document crash recovery source audit state.
- `0e64d66` - Add local source and article intel review tooling.
- `9273269` - Import July 29 primary futures odds.
- `642349e` - Refresh July 30 training camp intel snapshot.
- `d58f8e3` - Document post-recovery workstream triage.
- `96376e1` - Recalibrate futures synthesis source audit.
- `0cd942a` - Add futures synthesis source readiness checklist.
- `f6cee97` - Clean podcast deep-dive synthesis evidence.
- `817ec29` - Update futures synthesis handoff checkpoint.
- `5b2db46` - Add frontier futures synthesis evidence packet.
- `1c5cdee` - Document training camp source recovery.
- `b0b57ed` - Point source audit at recovered camp snapshot.
- `26c85b2` - Document post-pipeline push task plan.
- `29065e9` - Add training camp intel dashboard tab.
- `12aa0cf` - Refresh handoff after camp intel UI checkpoint.
- `4436095` - Refresh fantasy value board.
- `c797669` - Guard overnight ops automation.
- `8695b57` - Expose secondary matchup seed gaps.
- `d7fb7a0` - Gitignore readiness and source-audit retry artifacts.
- `de5c9c0` - Add Antigravity IDE `.agents/skills` project configurations.
- `6d8acdc` - Update session handoff for Antigravity skills rollout.

Latest source-readiness state:
- Source-audit gate now removes execution-only DK/FD bet-slip and weekly live-props plumbing from the futures-synthesis freshness check.
- Last fully passing written source audit: `PASSABLE`, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Current written source audit: `PASSABLE`, Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7. A fresh approved live RSS scout refreshed the app-facing July 30 training-camp files to 19 items across 10 teams, and the player-availability snapshot covers 796 events across all 32 teams with OL and defensive-front cluster flags.
- Frontier synthesis packet: `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`.
- BetOnline manual review: `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`.
- BetOnline normalized import: `data/futures-imports/betonline-2026-07-29.json`.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.json` - prior passable audit after BetOnline normalization, fresh live training-camp scout, and podcast ad-filter refresh.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.html` - prior passable audit after BetOnline normalization, fresh live training-camp scout, and podcast ad-filter refresh.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-14-57-708Z.json` - prior passable audit after adding player availability to the source gate.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-14-57-708Z.html` - prior passable audit after adding player availability to the source gate.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json` - current passable audit after splitting OL and defensive-front availability.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html` - current passable audit after splitting OL and defensive-front availability.
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

---

## Remaining Dirty Work

Current remaining dirty work includes:
- Overnight pipeline additions and untracked ops docs/systemd files. This was not committed because it adds live training-camp RSS scouting to automation and the docs contain Linux/encoding/command assumptions.
- `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` now contain the fresh approved live RSS scout snapshot: 19 items across 10 teams, with 4 high-priority items and 6 feed-health entries. Treat it as review/highlight context before synthesis, not as an official recommendation source.
- Older untracked retry artifacts under `.nfl/readiness/` and `.nfl/source-audit/`.

Do not stage this as one sweep. Review and stage by workstream.

---

## Key Files

- `handoffs/2026-07-30-1101-camp-intel-ui-handoff.md` - current Camp Intel UI and post-push handoff.
- `handoffs/2026-07-30-post-pipeline-push-task-plan.md` - post-pipeline push task plan.
- `handoffs/2026-07-30-0655-workstream-triage-handoff.md` - prior triage handoff.
- `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md` - detailed crash-recovery handoff.
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md` - prior completed checkpoint.
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` - latest readiness report.
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` - current source-acceptance checklist for the frontier synthesis packet.
- `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md` - requirement-by-requirement evidence audit for the active objective.
- `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md` - recovery note plus fresh live RSS scout receipt for the current 19-item training-camp snapshot.
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` - accepted evidence packet and approval-gated run path for the frontier synthesis.
- `docs/player-availability/player-availability-latest.md` - latest local player injury/return/practice availability report.
- `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` - BetOnline screenshot transcription and No-side playoff values.
- `scripts/build-intel-source-audit-report.js` - new source-audit report.
- `scripts/build-betonline-0729-import.js` - local BetOnline screenshot normalization generator.
- `scripts/build-article-intel-review.js` - new article-intel review.
- `agents/research-intel-ingest.js` - feed/source filtering changes.
- `scripts/parse-futures-text.js` - BetUS alternate-wins parsing guard.

---

## Guardrails

- Do not make paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast, YouTube, article, and training-camp intel are reviewed research context only until promoted by explicit human decision.
- Keep generated fixtures and local smoke outputs distinct from production betting recommendations.
- Stage narrowly; avoid `git add -A`.
- On resume, scan project-local `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, and hook folders before planning. Use relevant local `SKILL.md` guidance and project agents/workflows when they fit the task, while keeping guardrails and explicit-approval boundaries intact.

---

## Recommended Next Step

Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the current evidence packet. BetOnline is normalized, the fresh live training-camp scout is written, and player availability is available as injury/return context. The source gate is clear; the remaining decision is explicit approval before any paid/frontier model synthesis call.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-30-1259-codex-protocol-access-handoff.md, and handoffs\2026-07-30-1256-antigravity-agents-handoff.md first. Before planning, scan `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, `.agents/skills/`, and hook folders for relevant project-local skills, agents, and hooks; read only task-relevant local SKILL.md files and use matching project workflows when appropriate. Current pushed HEAD is 6d8acdc on main/origin/main. Fantasy value board, overnight/ops automation, stale retry artifact cleanup, secondary-matchup seed-gap exposure, Antigravity `.agents/skills/`, and the 12:56 handoff are already committed and pushed; do not recommit them. Preserve uncommitted Codex protocol edits unless intentionally reconciling them. Stage narrowly; do not use git add -A. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval. Immediate next step: start a fresh Codex session rooted at E:\dev, verify write access to ATLAS/GitHub/projects, then apply the same Project Capability Scan resume rule to ATLAS.
```
