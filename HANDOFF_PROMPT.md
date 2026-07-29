# HANDOFF_PROMPT.md - NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read `HANDOFF.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and the latest timestamped handoff.

## Persistent Backlogs

> Read the source file and mark items there, not in this handoff.

| Backlog | File | Open Items | Last Touched |
|---|---|---:|---|
| NFL Dashboard Audit Findings | `docs/NFL_AUDIT_BACKLOG.md` | Review current file before editing; this handoff did not modify it. | 2026-07-27 |
| Season Readiness | `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` | 6 watch items, 0 fails. | 2026-07-29 |

## Last Session Summary

- Date: 2026-07-29 UTC.
- Branch: `main`.
- HEAD observed: `dc6be68`.
- Working tree: dirty by design; stage narrowly.
- Latest timestamped handoff: `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`.
- Verification:
  - `npm.cmd run test:youtube-futures-review` passed.
  - `npm.cmd run test:youtube-local-intel-export` passed.
  - `npm.cmd run test:youtube-agent-intel-summary` passed.
  - `npm.cmd run smoke:season -- --require-services` passed.
- Live/paid calls: none.
- Supabase writes: none.
- Official-pick approvals: none.
- Open parlay changes: none.

## Current Objective

Prepare the NFL Dashboard for season kickoff with a local/read-only smoke test and by making the YouTube/Gemini futures intel export reflect already-completed human review.

## Completed This Session

- Added `smoke:season`, implemented by `scripts/season-readiness-smoke.js`.
- Generated `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` plus timestamped `.nfl/readiness/` reports.
- Fixed YouTube/Gemini review persistence:
  - Per-episode `human_verification` now promotes verified futures picks to local intel.
  - Resolved disputed/fabricated rows now default to `reject`.
  - Legacy review-match metadata and direct Andy review decisions are preserved through rebuilds.
  - Season-long futures markets stay in `futures_pick` even when rationale text mentions injuries.
- Cross-checked current review rows against legacy commit `95cca82` and recovered 18 exact semantic matches.
- Applied Andy's final decisions on the last 7 futures review rows:
  - Rejected 5 unresolved awards props from `youtube-veVjJ_EUYdk`.
  - Promoted `NYG Jaxson Dart season rushing TDs Over 5.5`.
  - Promoted `SF Brock Purdy MVP +2000`.
- Final YouTube futures state:
  - 45 promoted futures items.
  - 6 rejected futures items.
  - 0 futures items left in `needs_review` / `pending_review`.
  - Hallucinated `TEN win_total OVER` remains rejected.

## Latest Smoke Result

- Verdict: `READY WITH WATCH ITEMS`.
- Counts: PASS 11 / WARN 6 / FAIL 0 / INFO 1.
- YouTube futures intel: PASS, `exported_items: 45`.
- Local services: dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.

## Modified And Added Files

- `package.json`
- `scripts/season-readiness-smoke.js`
- `scripts/build-youtube-futures-intel-review.js`
- `scripts/export-youtube-futures-local-intel.js`
- `scripts/test-youtube-futures-intel-review.js`
- `scripts/test-youtube-agent-intel-summary.js`
- `data/shadow-harness/fixtures/youtube-futures-intel-review-expected.json`
- `data/shadow-harness/reports/youtube-futures-intel-review-latest.json`
- `data/shadow-harness/review/youtube-futures-intel-review-status.json`
- `data/shadow-harness/review/youtube-futures-local-intel-queue.json`
- `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`
- `public/youtube-futures-agent-intel-summary.json`
- `docs/antigravity/youtube-futures-intel-review-latest.md`
- `docs/antigravity/youtube-futures-local-intel-queue.md`
- `docs/antigravity/youtube-futures-agent-intel-summary.md`
- `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md`
- `.nfl/readiness/*`
- `HANDOFF.md`
- `HANDOFF_PROMPT.md`
- `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`

## Immediate Next Steps

1. Review and commit this narrow diff.
2. Create one real official-picks proposal draft and exercise approve/reject through the inbox UI.
3. Confirm whether migration 044 has been applied live before relying on production official-picks flows.
4. Address the clearest pre-kickoff betting-surface gaps: props live data source and DraftKings/FanDuel bet-slip parsers.
5. Refresh/review training-camp intel closer to kickoff; current latest RSS scout has one feed issue: Football Outsiders fetch failed.

## Guardrails

- Do not make live paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast/YouTube intel is reviewed local context only, not an official pick ledger.
- Keep QA output and fixtures distinct from analyst opinions or betting authorization.

## Resume Command

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, HANDOFF.md, WORKING-CONTEXT.md, TASK_BOARD.md, and handoffs\2026-07-29-0405-season-readiness-youtube-futures-handoff.md first. HEAD observed during handoff was dc6be68; working tree is dirty with intended season-readiness smoke and YouTube-futures repair artifacts, so stage narrowly and do not sweep unrelated files. Completed: added smoke:season; fixed YouTube/Gemini human-verification persistence; recovered 18 legacy-promoted semantic matches from commit 95cca82; applied Andy's final decisions on the last 7 futures rows; regenerated review/export/agent/public summaries. Verified: test:youtube-futures-review, test:youtube-local-intel-export, test:youtube-agent-intel-summary, and smoke:season -- --require-services all passed. Final YouTube futures state is 45 promoted, 6 rejected, 0 pending/needs-review, with TEN win-total Over rejected as hallucinated. Guardrails: no paid model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval. Recommended next: review and commit this narrow diff, then smoke-test a real official-picks proposal through the inbox, confirm migration 044 live status, and prioritize props live source plus bet-slip parser implementation before kickoff.
```
