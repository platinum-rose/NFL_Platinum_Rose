# NFL_Dashboard - Session Handoff

> Fresh-session resume notes. Read this first, then `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD observed before frontier packet checkpoint:** `817ec29`
**Latest timestamped handoff:** `handoffs/2026-07-30-0655-workstream-triage-handoff.md`
**Status:** Crash recovery committed. Source audit recalibrated toward futures-portfolio synthesis readiness; podcast/deep-dive ad filtering has been expanded and verified; frontier synthesis packet is prepared. DK/FD bet-slip parsers and weekly live props are out of current scope.

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

Latest source-readiness state:
- Source-audit gate now removes execution-only DK/FD bet-slip and weekly live-props plumbing from the futures-synthesis freshness check.
- Latest source audit: `PASSABLE`, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
- Frontier synthesis packet: `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`.
- Latest artifacts:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

---

## Remaining Dirty Work

Current remaining dirty work includes:
- Overnight pipeline additions and untracked ops docs/systemd files. This was not committed because it adds live training-camp RSS scouting to automation and the docs contain Linux/encoding/command assumptions.
- Older untracked retry artifacts under `.nfl/readiness/` and `.nfl/source-audit/`.

Do not stage this as one sweep. Review and stage by workstream.

---

## Key Files

- `handoffs/2026-07-30-0655-workstream-triage-handoff.md` - current triage handoff.
- `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md` - detailed crash-recovery handoff.
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md` - prior completed checkpoint.
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` - latest readiness report.
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` - current source-acceptance checklist for the frontier synthesis packet.
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` - accepted evidence packet and approval-gated run path for the frontier synthesis.
- `scripts/build-intel-source-audit-report.js` - new source-audit report.
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

Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the current model-ready evidence packet. The remaining decision is whether to normalize/review the July 29 BetOnline screenshots before the model run or proceed with BetOnline exact prices excluded and BetUS/Bookmaker-BKR as current placeable-price sources.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs\FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md, docs\FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md, and handoffs\2026-07-30-0655-workstream-triage-handoff.md first. Current focus is a maximum-effort frontier-model futures portfolio narrative and recommendation synthesis, not DK/FD bet-slip parsers or weekly live props. Crash recovery was committed in 87476f0; source/article intel tooling in 0e64d66; July 29 primary futures imports in 9273269; July 30 training-camp snapshot in 642349e; post-recovery triage in d58f8e3; source-audit recalibration in 96376e1; source-readiness checklist in 0cd942a; podcast cleanup/evidence checkpoint in f6cee97; handoff checkpoint in 817ec29. Latest source audit is PASSABLE, Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7. Latest source-audit artifacts are .nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json and docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html. Podcast/deep-dive output was regenerated after expanded ad/legal filtering; the expanded hard promo/legal scan is clean and remaining sportsbook mentions are price/context references. The model-ready evidence packet is docs\FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md. BetOnline has current July 29 screenshots; stale structured BetOnline rows must not be used as source of truth unless normalized or manually reviewed. Next: decide whether to normalize/review BetOnline screenshots before the model run or proceed with BetOnline exact prices excluded, then ask explicit approval for any paid/frontier model call. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
