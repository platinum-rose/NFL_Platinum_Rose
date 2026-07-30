# NFL_Dashboard - Session Handoff

> Fresh-session resume notes. Read this first, then `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD observed before BetOnline normalization checkpoint:** `5b2db46`
**Latest timestamped handoff:** `handoffs/2026-07-30-0655-workstream-triage-handoff.md`
**Status:** Crash recovery committed. Source audit recalibrated toward futures-portfolio synthesis readiness; podcast/deep-dive ad filtering has been expanded and verified; frontier synthesis packet is prepared; BetOnline July 29 screenshots are normalized. DK/FD bet-slip parsers and weekly live props are out of current scope.

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

Latest source-readiness state:
- Source-audit gate now removes execution-only DK/FD bet-slip and weekly live-props plumbing from the futures-synthesis freshness check.
- Last fully passing written source audit: `PASSABLE`, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Current written source audit: `BLOCKED`, Current 2 / Review 16 / Stale 1 / Blocked 0 / Missing 0 / Context 7. The stale item is the current worktree training-camp latest snapshot, which is an all-32 empty placeholder. The audit action now points to the verified 16-item recovery copy at `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json`.
- Frontier synthesis packet: `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`.
- BetOnline manual review: `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`.
- BetOnline normalized import: `data/futures-imports/betonline-2026-07-29.json`.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-39-21-827Z.json` - current blocked audit after BetOnline normalization and recovery-action update.
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-39-21-827Z.html` - current blocked audit after BetOnline normalization and recovery-action update.
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

---

## Remaining Dirty Work

Current remaining dirty work includes:
- Overnight pipeline additions and untracked ops docs/systemd files. This was not committed because it adds live training-camp RSS scouting to automation and the docs contain Linux/encoding/command assumptions.
- `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` are currently overwritten to all-32 empty placeholders. Do not treat that as absence of camp intel; decide whether to restore the recovered verified 16-item snapshot or approve a fresh live RSS scout.
- Older untracked retry artifacts under `.nfl/readiness/` and `.nfl/source-audit/`.

Do not stage this as one sweep. Review and stage by workstream.

---

## Key Files

- `handoffs/2026-07-30-0655-workstream-triage-handoff.md` - current triage handoff.
- `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md` - detailed crash-recovery handoff.
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md` - prior completed checkpoint.
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` - latest readiness report.
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` - current source-acceptance checklist for the frontier synthesis packet.
- `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md` - non-destructive recovery note for the verified 16-item training-camp snapshot.
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` - accepted evidence packet and approval-gated run path for the frontier synthesis.
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

---

## Recommended Next Step

Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the current evidence packet. BetOnline is now normalized. The remaining source-gate decision is training camp: restore the recovered verified 16-item July 30 snapshot or approve a fresh live RSS scout, then rerun `npm.cmd run intel:source-audit` before any frontier-model call.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs\FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md, docs\TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md, docs\FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs\FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md, handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md, and handoffs\2026-07-30-0655-workstream-triage-handoff.md first. Current focus is a maximum-effort frontier-model futures portfolio narrative and recommendation synthesis, not DK/FD bet-slip parsers or weekly live props. BetUS, Bookmaker/BKR, and BetOnline July 29 imports are current; BetOnline was manually normalized into data\futures-imports\betonline-2026-07-29.json with 160 rows and a manual review doc preserving playoff No-side prices. Current blocker: data\training-camp\2026\latest.json and data\training-camp\2026\training-camp-intel-2026-07-30.json are uncommitted all-32 empty placeholders, while the recovered verified July 30 snapshot at data\training-camp\2026\recovered\training-camp-intel-2026-07-30-0346-verified.json has 16 items across 12 teams. Next: restore the recovered training-camp snapshot or approve a fresh live RSS scout, rerun npm.cmd run intel:source-audit, then ask explicit approval for any paid/frontier model call. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
