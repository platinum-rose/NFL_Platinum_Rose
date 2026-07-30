# HANDOFF_PROMPT.md - NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read `HANDOFF.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

## Persistent Backlogs

> Read the source file and mark items there, not in this handoff.

| Backlog | File | Open Items | Last Touched |
|---|---|---:|---|
| NFL Dashboard Audit Findings | `docs/NFL_AUDIT_BACKLOG.md` | Review current file before editing; this handoff did not modify it. | 2026-07-27 |
| Season Readiness | `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` | 6 watch items, 0 fails after service recovery. | 2026-07-30 |

## Last Session Summary

- Date: 2026-07-30 UTC / 2026-07-29 Pacific.
- Branch: `main`.
- HEAD observed: `c814f78`.
- Working tree: dirty by design; stage narrowly.
- Latest timestamped handoff: `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
- Prior completed checkpoint: `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`.
- Verification:
  - `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app` passed with `READY WITH WATCH ITEMS`.
  - Counts: PASS 11 / WARN 6 / FAIL 0 / INFO 1.
  - Dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.
  - `npm.cmd run intel:source-audit` regenerated the source audit after service recovery; it is blocked only by DraftKings/FanDuel parser implementation or verification.
- Live/paid model calls during recovery: none by Codex.
- Supabase writes during recovery: none by Codex.
- Official-pick approvals: none.
- Open parlay changes: none.

## Current Objective

Recover and document the interrupted source-freshness/readiness session, then review the dirty work by workstream before committing anything.

## Completed In Recovery

- Recovered local services after the crash:
  - Dashboard at `http://localhost:5174/platinum-rose-app/`.
  - Official picks inbox at `http://127.0.0.1:8787/api/inbox`.
  - M6 health at `http://127.0.0.1:5060/health`.
- Re-ran service-aware season smoke successfully.
- Regenerated source audit after service recovery:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- Created `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
- Refreshed `HANDOFF.md` and this rolling handoff so future sessions do not resume from the stale July 29 pointer.

## Recovered Dirty Work

- New source audit tooling:
  - `scripts/build-intel-source-audit-report.js`
  - `npm.cmd run intel:source-audit`
  - `.nfl/source-audit/`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- New article intel review tooling:
  - `scripts/build-article-intel-review.js`
  - `npm.cmd run article:intel-review`
  - `data/research-intel/review/`
  - `docs/article-intel-review/`
- Research feed hardening:
  - `agents/research-intel-ingest.js`
  - Walter Football RSS added.
  - All-sports/non-NFL filtering tightened.
- Training-camp refresh:
  - `data/training-camp/2026/latest.json`
  - `data/training-camp/2026/training-camp-intel-2026-07-30.json`
  - `.nfl/training-camp/training-camp-intel-2026-07-30.*`
  - Latest receipt: 16 items, 32 teams, 12 teams with intel, Football Outsiders fetch failed.
- Futures import/parser work:
  - `data/futures-imports/betus-2026-07-29.json`
  - `data/futures-imports/bookmaker-2026-07-29.json`
  - `scripts/parse-futures-text.js` guard for BetUS alternate season wins.
- Podcast/deep-dive refresh:
  - Large generated changes under `data/podcasts/m6-diarized-all/`.
  - New July 21-23 episode files.
  - `docs/podcast-transcript-deep-dives/index.json` now shows 57 episodes.
- Ops/documentation:
  - `scripts/overnight.js` adds research intel, training-camp scout, and daily brief steps.
  - New untracked `docs/NFL_DASHBOARD_USER_GUIDE.md`.
  - New untracked `infra/systemd/nfl-overnight.service` and `.timer`.

## Immediate Next Steps

1. Re-run syntax checks:

```powershell
node --check scripts/build-intel-source-audit-report.js
node --check scripts/build-article-intel-review.js
node --check scripts/parse-futures-text.js
node --check agents/research-intel-ingest.js
```

2. Review/stage by workstream, not all at once:
   source-audit/article tooling, research feed changes, training-camp refresh, futures imports/parser, podcast generated artifacts, and ops docs.

3. Preserve known watch items:
   official-picks proposal smoke, migration 044 live status, DK/FD parsers, and live props source.

## Guardrails

- Do not make live paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast/YouTube/article/training-camp intel is reviewed local context only, not an official pick ledger.
- Keep QA output and generated artifacts distinct from analyst opinions or betting authorization.
- Stage narrowly; do not use `git add -A`.

## Resume Command

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, HANDOFF.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-29-0405-season-readiness-youtube-futures-handoff.md, and handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md first. HEAD observed during crash recovery was c814f78. The machine crashed during a dirty source-freshness/readiness workstream after the July 29 YouTube/season-smoke handoff. Recovered work includes new source-audit tooling, article-intel review tooling, research-intel feed hardening, a July 30 training-camp RSS refresh, BetUS/Bookmaker futures imports, BetUS parser adjustment, regenerated podcast/deep-dive artifacts, overnight pipeline additions, and ops docs. Post-crash service smoke passed with READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 / INFO 1 using npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app. Official picks inbox and M6 passed on 8787 and 5060. Post-recovery intel:source-audit was regenerated and is BLOCKED only by DraftKings/FanDuel parser implementation or verification; service-smoke is no longer a blocker. Review/stage narrowly by workstream; do not use git add -A. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
