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
- Current pushed HEAD: `29065e9`.
- Working tree: dirty by design; stage narrowly.
- Latest timestamped handoff: `handoffs/2026-07-30-1101-camp-intel-ui-handoff.md`.
- Detailed crash-recovery handoff: `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
- Prior completed checkpoint: `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`.
- Verification:
  - `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app` passed with `READY WITH WATCH ITEMS`.
  - Counts: PASS 11 / WARN 6 / FAIL 0 / INFO 1.
  - Dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.
  - `npm.cmd run intel:source-audit` was recalibrated around futures-portfolio synthesis freshness, excluding DK/FD bet-slip parser and weekly live-props plumbing from the current gate.
  - Last fully passing audit was `PASSABLE`: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
  - Current source audit is `PASSABLE`: Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7. A fresh approved live RSS scout refreshed the app-facing July 30 training-camp files to 19 items across 10 teams, and player availability covers 796 events across all 32 teams with OL and defensive-front cluster flags.
  - Current source-audit artifacts: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json`, `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html`, and `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`.
- Live/paid model calls during recovery: none by Codex.
- Supabase writes during recovery: none by Codex.
- Official-pick approvals: none.
- Open parlay changes: none.
- Latest pushed checkpoint: Training Camp Intel UI tab added and mojibake cleaned in `29065e9`; post-pipeline task plan committed in `26c85b2`.

## Current Objective

Continue from the crash-recovery triage checkpoint. The current objective is a maximum-effort frontier-model futures portfolio synthesis using the prepared local evidence packet. BetOnline July 29 screenshots are normalized, the fresh approved live training-camp RSS scout is written, player availability is snapshotted, and the source audit is passable. DK/FD bet-slip parsers and weekly live props are out of scope for this focus.

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
- Split safe recovered work into narrow commits:
  - `87476f0` - Document crash recovery source audit state.
  - `0e64d66` - Add local source and article intel review tooling.
  - `9273269` - Import July 29 primary futures odds.
  - `642349e` - Refresh July 30 training camp intel snapshot.
  - `96376e1` - Recalibrate futures synthesis source audit.
  - `0cd942a` - Add futures synthesis source readiness checklist.
  - `f6cee97` - Clean podcast deep-dive synthesis evidence.
  - `817ec29` - Update futures synthesis handoff checkpoint.
  - `5b2db46` - Add frontier futures synthesis evidence packet.
  - `1c5cdee` - Document training camp source recovery.
  - `b0b57ed` - Point source audit at recovered camp snapshot.
- Created `handoffs/2026-07-30-0655-workstream-triage-handoff.md`.
- Refreshed `HANDOFF.md` and this rolling handoff so future sessions resume from the Camp Intel UI checkpoint.
- Recalibrated `scripts/build-intel-source-audit-report.js`:
  - Execution-only DK/FD bet-slip parser and weekly live-props checks no longer block the futures-synthesis freshness gate.
  - Stale structured BetOnline rows no longer count as stale if current July 29 BetOnline screenshots are present; the report requires manual review/normalization before using BetOnline as source of truth.
  - Review items no longer fail the frontier gate by themselves; they must be accepted, rejected, or caveated before model synthesis.
  - Empty training-camp latest snapshots now include the recovered 16-item snapshot path in the audit action.
- Added `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` as the current source-acceptance checklist.
- Expanded podcast/deep-dive ad/legal filtering, regenerated the 57-episode deep-dive set, and documented source acceptance plus verification receipts in `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` and `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`.
- Added `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the model-ready local evidence packet and approval-gated run path.
- Added BetOnline July 29 normalization:
  - `scripts/build-betonline-0729-import.js`
  - `data/futures-imports/betonline-2026-07-29.json`
  - `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`
  - `npm.cmd run futures:betonline-0729`, `node scripts/build-betonline-0729-import.js --check-only`, and `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run` passed with 160 rows and no DB write.
- Added local player-availability layer:
  - `agents/lib/player-availability.js`
  - `scripts/build-player-availability.js`
  - `data/player-availability/latest.json`
  - `docs/player-availability/player-availability-latest.md`
  - `npm.cmd run player-availability:live` generated 796 events across 32 teams with 121 improving, 194 worsening, 26 OL worsening, and 36 defensive-front worsening; no Supabase writes or model calls.

## Recovered Workstream Status

- New source audit tooling:
  - `scripts/build-intel-source-audit-report.js`
  - `npm.cmd run intel:source-audit`
  - `.nfl/source-audit/`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
  - Status: committed in `0e64d66`, with latest successful report committed in `87476f0`.
- New article intel review tooling:
  - `scripts/build-article-intel-review.js`
  - `npm.cmd run article:intel-review`
  - `data/research-intel/review/`
  - `docs/article-intel-review/`
  - Status: committed in `0e64d66`.
- Research feed hardening:
  - `agents/research-intel-ingest.js`
  - Walter Football RSS added.
  - All-sports/non-NFL filtering tightened.
  - Status: committed in `0e64d66`.
- Training-camp refresh:
  - `data/training-camp/2026/latest.json`
  - `data/training-camp/2026/training-camp-intel-2026-07-30.json`
  - Latest receipt: 19 items, 32 teams, 10 teams with intel, Football Outsiders fetch failed.
  - Status: committed in `642349e`; recovery copy preserved under `data/training-camp/2026/recovered/`; `.nfl/training-camp/` reports and receipts remain untracked.
- Futures import/parser work:
  - `data/futures-imports/betus-2026-07-29.json`
  - `data/futures-imports/bookmaker-2026-07-29.json`
  - `scripts/parse-futures-text.js` guard for BetUS alternate season wins.
  - Status: committed in `9273269`.
- Podcast/deep-dive refresh:
  - Large generated changes under `data/podcasts/m6-diarized-all/`.
  - New July 21-23 episode files.
  - `docs/podcast-transcript-deep-dives/index.json` now shows 57 episodes.
  - Status: committed in `f6cee97`; ad/legal filter expanded again to catch sponsored-by copy and regenerated. Hard promo/legal scan is clean; remaining sportsbook mentions are price/context references.
- BetOnline July 29 normalization:
  - `scripts/build-betonline-0729-import.js` generates the import and manual review doc from all nine BEO screenshots.
  - `data/futures-imports/betonline-2026-07-29.json` has 160 rows: Super Bowl, AFC/NFC conference, all divisions, playoffs Yes, and wins.
  - `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` preserves playoff No-side prices not represented in the current uniform import schema.
  - Status: local-only and no-write verified; no Supabase promotion has happened.
- Player availability:
  - `scripts/build-player-availability.js` builds local JSON/Markdown/HTML from the ESPN injuries API plus training-camp availability-like notes.
  - `agents/portfolio-dossier.js` now includes compact `player_availability` per team for futures synthesis.
  - `agents/portfolio-synthesize.js` preserves `player_availability` in the compact model prompt and labels this section as injuries and player availability.
  - Status: local-only, review-context only; no Supabase writes, no official picks, and no model calls.
- Ops/documentation:
  - `scripts/overnight.js` adds research intel, training-camp scout, and daily brief steps.
  - New untracked `docs/NFL_DASHBOARD_USER_GUIDE.md`.
  - New untracked `infra/systemd/nfl-overnight.service` and `.timer`.
  - Status: still dirty; review separately because this changes live-fetch automation assumptions and contains Linux/encoding/command assumptions.

## Immediate Next Steps

1. Ask explicit approval before any paid/frontier model synthesis call.

2. Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the evidence packet for the approval-gated frontier-model run, including `docs/player-availability/player-availability-latest.md` as injury/return context.

3. Keep no Supabase writes, recommendation persistence, official-pick approvals/proposals, or open-parlay changes without explicit approval.

4. Review `scripts/overnight.js`, `docs/NFL_DASHBOARD_USER_GUIDE.md`, and `infra/systemd/` separately before committing any ops automation.

5. Clean older retry artifacts only after deciding they are no longer useful crash-window evidence.

## Guardrails

- Do not make live paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast/YouTube/article/training-camp intel is reviewed local context only, not an official pick ledger.
- Keep QA output and generated artifacts distinct from analyst opinions or betting authorization.
- Stage narrowly; do not use `git add -A`.

## Resume Command

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, HANDOFF.md, WORKING-CONTEXT.md, TASK_BOARD.md, handoffs\2026-07-30-post-pipeline-push-task-plan.md, and handoffs\2026-07-30-1101-camp-intel-ui-handoff.md first. Current pushed HEAD is 29065e9 on main/origin/main. The injury/player-availability/OL-DL/secondary-matchup pipeline work and the Training Camp Intel UI tab are already committed and pushed; do not recommit them. Remaining dirty workstreams are fantasy value board, overnight/ops automation, and old retry artifacts. Stage narrowly; do not use git add -A. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals, no production recommendation persistence, and no open-parlay changes without explicit approval. Immediate next step: review the fantasy value board workstream first, then ops automation, then stale retry artifacts, then resume secondary-matchup seed completion and parser-quality tasks.
```
