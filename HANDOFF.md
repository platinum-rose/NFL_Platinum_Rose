# NFL_Dashboard - Session Handoff

> Fresh-session resume notes. Read this first, then `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

**Date:** 2026-07-30 UTC / 2026-07-29 Pacific
**Branch:** main
**HEAD observed:** `c814f78`
**Latest timestamped handoff:** `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`
**Status:** Crash recovered; service-aware smoke is green with watch items; post-recovery source audit regenerated; source-audit/article-intel/podcast/training-camp work remains dirty and uncommitted.

---

## Pick Up Here

The computer crashed during a dirty source-freshness/readiness workstream that started after the July 29 season-smoke and YouTube/Gemini futures reconciliation handoff. The immediate recovery task is complete: all local services are reachable and the service-aware smoke check is back to `READY WITH WATCH ITEMS`.

Recovered service command:

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

## Recovered Dirty Work

Current dirty work includes:
- Source audit tooling: `scripts/build-intel-source-audit-report.js`, `npm.cmd run intel:source-audit`, `.nfl/source-audit/`, and `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`.
- Article intel review tooling: `scripts/build-article-intel-review.js`, `npm.cmd run article:intel-review`, `data/research-intel/review/`, and `docs/article-intel-review/`.
- Research intel feed hardening in `agents/research-intel-ingest.js`, including Walter Football and stricter non-NFL filtering.
- July 30 training-camp refresh: 16 items, 32 teams, 12 teams with intel; Football Outsiders still failing.
- Manual futures imports for BetUS and Bookmaker dated 2026-07-29, plus a BetUS alternate-wins parser guard.
- Large regenerated podcast/deep-dive surface, including new July 21-23 episode files and a 57-episode index.
- Overnight pipeline additions and untracked ops docs/systemd files.

Do not stage this as one sweep. Review and stage by workstream.

---

## Key Files

- `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md` - detailed crash-recovery handoff.
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md` - prior completed checkpoint.
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` - latest readiness report.
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

Review the dirty work by workstream before committing. The post-recovery source audit was regenerated at `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.json`; it is now blocked only by DraftKings/FanDuel bet-slip parser implementation or verification, not by local service recovery.

Decide commit boundaries for source-audit/article tooling, research/training-camp/futures imports, podcast generated artifacts, and ops docs.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-29-0405-season-readiness-youtube-futures-handoff.md, and handoffs\2026-07-30-0635-crash-recovery-source-audit-handoff.md first. HEAD observed during crash recovery was c814f78. The machine crashed during a dirty source-freshness/readiness workstream after the July 29 YouTube/season-smoke handoff. Recovered work includes new source-audit tooling, article-intel review tooling, research-intel feed hardening, a July 30 training-camp RSS refresh, BetUS/Bookmaker futures imports, BetUS parser adjustment, regenerated podcast/deep-dive artifacts, overnight pipeline additions, and ops docs. Post-crash service smoke passed with READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 / INFO 1 using npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app. Official picks inbox and M6 passed on 8787 and 5060. Post-recovery intel:source-audit was regenerated and is BLOCKED only by DraftKings/FanDuel parser implementation or verification; service-smoke is no longer a blocker. Review/stage narrowly by workstream; do not use git add -A. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval.
```
