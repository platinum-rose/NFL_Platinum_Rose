# NFL Dashboard Crash-Recovery Handoff - Source Audit and Readiness

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD observed:** `c814f78`
**Status:** Crash recovered. Local services verified healthy. Source-audit/article-intel/podcast/training-camp work remains dirty and uncommitted.

---

## Recovery Summary

This handoff documents the work that was in progress when the machine crashed and the verification performed after restart.

The prior completed checkpoint was `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`, covering season-readiness smoke plus YouTube/Gemini futures reconciliation. After that checkpoint, the workspace moved into a broader source freshness and operational readiness push. The rolling `HANDOFF.md` and `HANDOFF_PROMPT.md` were stale at crash recovery time and still pointed at the July 29 YouTube/readiness handoff.

Post-crash service recovery is complete:
- Dashboard dev server reachable at `http://localhost:5174/platinum-rose-app/`.
- Official picks inbox reachable at `http://127.0.0.1:8787/api/inbox`.
- M6 podcast service reachable at `http://127.0.0.1:5060/health`.

Latest verified smoke command:

```powershell
npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app
```

Latest verified smoke result:
- Verdict: `READY WITH WATCH ITEMS`.
- Counts: PASS 11 / WARN 6 / FAIL 0 / INFO 1.
- Report written to `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md`.
- Timestamped artifacts include `.nfl/readiness/season-readiness-2026-07-30T06-32-10-053Z.md` and `.json`.

Use `localhost:5174` for this recovered dashboard session. Earlier checks against `127.0.0.1:5174` failed even though the browser-visible Vite URL worked.

---

## Work Recovered From The Interrupted Session

### 1. Source Audit Report

New source-audit tooling was added:
- `scripts/build-intel-source-audit-report.js`
- `npm` script: `intel:source-audit`
- Generated latest report: `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- Generated timestamped artifacts under `.nfl/source-audit/`

Observed source-audit summary before service recovery:
- Current 2
- Review 15
- Stale 1
- Blocked 2
- Missing 0
- Context 7
- Inference 2

Post-recovery source audit was regenerated after services were healthy:
- `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.json`
- `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.html`
- `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

Post-recovery source-audit summary:
- Current 2
- Review 16
- Stale 1
- Blocked 1
- Missing 0
- Context 7
- Inference 2

The service-smoke blocker cleared. The remaining blocker is DraftKings/FanDuel bet-slip parser implementation or verification.

### 2. Article Intel Review

New article review tooling was added:
- `scripts/build-article-intel-review.js`
- `npm` script: `article:intel-review`
- Generated review JSON: `data/research-intel/review/article-intel-review-latest.json`
- Generated docs: `docs/article-intel-review/article-intel-review-latest.md` and `.html`

Latest generated article review summary:
- 39 articles reviewed.
- 39 articles with body text.
- 3 likely non-NFL false positives.
- 0 actual picks.
- 8 market leads.
- 8 pick leads.
- 103 analysis notes.

Guardrail: article-derived leads require human review before promotion. This artifact does not write Supabase signals or create betting recommendations.

### 3. Research Intel Feed Hardening

`agents/research-intel-ingest.js` was modified:
- BettingPros max payload raised from 3.0 MB to 4.5 MB.
- Walter Football RSS added.
- Non-NFL filtering tightened for all-sports/generic betting items.

Latest dry-run receipt:
- `.nfl/receipts/research-intel-ingest-2026-07-30T05-03-04-428Z.json`
- Dry run: true.
- Lookback: 336 hours.
- Candidate notes: 79.
- Candidate signals: 2.
- Football Outsiders still failed with `fetch failed`.

### 4. Training Camp Refresh

Training camp RSS scout was run live and written:
- Receipt: `.nfl/receipts/training-camp-rss-scout-2026-07-30T03-46-10-171Z.json`
- Snapshot: `data/training-camp/2026/latest.json`
- Timestamped snapshot: `data/training-camp/2026/training-camp-intel-2026-07-30.json`
- Reports: `.nfl/training-camp/training-camp-intel-2026-07-30.md` and `.html`

Latest training-camp summary:
- Live: true.
- Written: true.
- Team count: 32.
- Teams with intel: 12.
- Item count: 16.
- Football Outsiders still failed with `fetch failed`.

This is intel-only and not a pick ledger.

### 5. Futures Odds Parsing And Manual Imports

Manual futures imports were added:
- `data/futures-imports/betus-2026-07-29.json`
- `data/futures-imports/bookmaker-2026-07-29.json`

`scripts/parse-futures-text.js` was modified to ignore BetUS alternate season wins while parsing regular season win totals. The intent appears to be preventing alternate win-total ladders from contaminating primary win-total rows.

Source audit still flags BetOnline as stale at a July 14 snapshot. Refresh BetOnline before treating primary execution-book coverage as complete.

### 6. Podcast Deep-Dive Refresh

Podcast transcript/deep-dive artifacts were heavily regenerated:
- Existing `data/podcasts/m6-diarized-all/*.json` and `.md` files changed.
- New July 21-23 podcast files were added.
- `data/podcasts/m6-diarized-all/manifest.json` changed.
- `docs/podcast-transcript-deep-dives/index.json` now shows 57 episodes.
- `docs/podcast-transcript-deep-dives/index.html` changed.
- New deep-dive docs were added for selected July 22-23 episodes.

Treat this as a large generated-artifact surface. Review carefully before staging; do not mix blindly with the source-audit tooling commit unless that is intentional.

### 7. Overnight Pipeline And Ops Docs

`scripts/overnight.js` was modified to add:
- `research-intel`
- `training-camp-scout`
- `daily-brief`

New ops/documentation files were added:
- `docs/NFL_DASHBOARD_USER_GUIDE.md`
- `infra/systemd/nfl-overnight.service`
- `infra/systemd/nfl-overnight.timer`

These need review before commit. The systemd files contain Linux host paths/user assumptions and may not belong in the same narrow Windows crash-recovery commit.

---

## Current Watch Items

The latest service-aware smoke has no failures, but six warnings remain:
- Working tree is dirty; stage narrowly.
- Latest futures watchlist has validator flags, so treat cards as review-only.
- No active official-picks proposal draft exists, so approve/reject has not been end-to-end smoke-tested.
- Migration 044 exists locally, but live application status still needs confirmation.
- DraftKings/FanDuel bet-slip parsers still need implementation or verification.
- Props tooling still appears to depend on stub/mock data, not a live prop source.

---

## Recommended Recovery Sequence

1. Re-run syntax checks for the new/modified scripts:

```powershell
node --check scripts/build-intel-source-audit-report.js
node --check scripts/build-article-intel-review.js
node --check scripts/parse-futures-text.js
node --check agents/research-intel-ingest.js
```

2. Review the dirty work by workstream, not all at once:
- Source audit and article review tooling.
- Research intel ingest/feed changes.
- Training-camp generated refresh.
- Futures manual imports/parser change.
- Podcast generated refresh.
- Overnight/systemd/user-guide ops docs.

3. Stage narrowly. Avoid `git add -A`.

4. Before any betting-facing recommendation work, confirm primary execution-book freshness and preserve the human approval boundary.

---

## Guardrails

- Do not make paid model/API calls without explicit approval.
- Do not write Supabase without explicit approval.
- Do not approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast, YouTube, article, and training-camp intel are reviewed research context only until promoted by explicit human decision.
- Public/Vegas market data can support market-shape context; betting recommendations still require actual primary-book execution prices or explicit proxy labeling.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-29-0405-season-readiness-youtube-futures-handoff.md, and handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md first. HEAD observed during crash recovery was c814f78. The machine crashed during a dirty source-freshness/readiness workstream after the July 29 YouTube/season-smoke handoff. Recovered work includes new source-audit tooling, article-intel review tooling, research-intel feed hardening, a July 30 training-camp RSS refresh, BetUS/Bookmaker futures imports, BetUS parser adjustment, regenerated podcast/deep-dive artifacts, overnight pipeline additions, and ops docs. Post-crash service smoke passed with READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 / INFO 1 using npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app. Official picks inbox and M6 passed on 8787 and 5060. Post-recovery intel:source-audit was regenerated and is BLOCKED only by DraftKings/FanDuel parser implementation or verification; service-smoke is no longer a blocker. Review/stage narrowly by workstream; do not use git add -A. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
