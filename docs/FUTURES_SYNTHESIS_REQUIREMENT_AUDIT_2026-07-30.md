# Futures Synthesis Requirement Audit - 2026-07-30

Purpose: verify the active objective requirement-by-requirement before any frontier-model futures portfolio synthesis.

This audit is local/read-only except for generated Markdown/HTML/JSON evidence files. It made no paid model/API calls, no Supabase writes, no official-pick approvals, no production recommendation persistence, no portfolio mutation, and no open-parlay changes.

## Requirement Status

| Requirement | Status | Current evidence |
|---|---|---|
| Exclude DraftKings/FanDuel bet-slip parser implementation and verification from current focus | Proven for the source gate | Current source-audit artifact `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-49-41-721Z.json` has no DK/FD/bet-slip source checks. Handoff/readiness docs mark DK/FD parser work out of scope for this gate. |
| Exclude weekly/live props source wiring from current focus | Proven for the source gate | Current source-audit artifact has no weekly/live-props source checks. Handoff/readiness docs mark weekly/live props out of scope for this preseason futures-synthesis gate. |
| Verify current futures market-price sources | Proven with caveats | BetUS import dry-run passed with 416 rows; Bookmaker import dry-run passed with 128 rows; BetOnline import check-only and dry-run passed with 160 rows. BetOnline exact Super Bowl matchup is unavailable in the July 29 screenshot bundle. Public/API futures rows are consensus/context only. |
| Verify podcast/expert intel source quality | Proven with caveats | `npm.cmd run podcast-deep-dives` regenerated 57 transcript deep dives from local M6 exports at `2026-07-30T08:48:17.626Z`; referenced Markdown/HTML files exist; hard ad/legal scan returned no matches for the current generated deep dives. Podcast output remains research context, not betting authority. |
| Verify article/RSS intel source quality | Proven with caveats | Article review parsed: 39 articles reviewed, 0 actual pick candidates, 8 market/inference leads, 103 contextual notes. Research ingest receipt has 10 configured feeds and 1 feed issue. Use article leads as synthesis context only. |
| Verify training-camp intel freshness | Not complete | Current `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` are all-32 empty placeholders. Recovered verified snapshot exists with 16 items across 12 teams, but it has not been restored into the app-facing files. |
| Verify generated source audit frontier readiness | Not complete | Current audit is `BLOCKED`, Current 2 / Review 16 / Stale 1 / Blocked 0 / Missing 0 / Context 7 / Inference 1. Sole stale item: Training camp local snapshot. |
| Produce maximum-effort frontier-model narrative and pick recommendations | Not started by design | Source gate must clear first, then the user must explicitly approve any paid/frontier model call and any persisted recommendation output. |

## Latest Local Verification Commands

```powershell
node --check scripts\build-podcast-transcript-deep-dives.js
node --check scripts\build-intel-source-audit-report.js
npm.cmd run podcast-deep-dives
npm.cmd run intel:source-audit
node scripts/build-betonline-0729-import.js --check-only
node scripts/ingest-futures-json.js --file data/futures-imports/betus-2026-07-29.json --dry-run
node scripts/ingest-futures-json.js --file data/futures-imports/bookmaker-2026-07-29.json --dry-run
node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run
```

## Latest Counts

- Current source audit: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-49-41-721Z.json`
- Current audit verdict: `BLOCKED`
- Current audit counts: Current 2 / Review 16 / Stale 1 / Blocked 0 / Missing 0 / Context 7 / Inference 1
- Sole stale source: `Training camp local snapshot`
- BetUS normalized import: 416 rows
- Bookmaker normalized import: 128 rows
- BetOnline normalized import: 160 rows
- Podcast deep dives: 57 episodes, generated `2026-07-30T08:48:17.626Z`
- Article review: 39 articles, 8 market/inference leads, 103 contextual notes
- Recovered training-camp snapshot: 16 items across 12 teams, generated `2026-07-30T03:46:07.745Z`

## Required Next Action

Resolve the training-camp app-facing snapshot before any frontier-model run:

1. Restore `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json` into `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json`, or approve a fresh live RSS scout.
2. Rerun `npm.cmd run intel:source-audit`.
3. Require 0 stale, 0 blocked, and 0 missing sources.
4. Ask for explicit approval before any paid/frontier model call or persisted recommendation output.
