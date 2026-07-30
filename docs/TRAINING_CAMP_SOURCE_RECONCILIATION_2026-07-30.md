# Training Camp Source Reconciliation - 2026-07-30

Purpose: preserve the last verified July 30 training-camp intel snapshot after crash recovery without overwriting the current dirty worktree files.

This is source-control and handoff evidence only. It is not a betting recommendation, not an official-picks action, and not approval for a paid/frontier model call.

## Current State

- Current app-facing file: `data/training-camp/2026/latest.json`
- Current timestamped file: `data/training-camp/2026/training-camp-intel-2026-07-30.json`
- Current generated at: `2026-07-30T08:07:12.833Z`
- Current evidence: 32 teams, 0 teams with intel, 0 items, no feed-health detail.
- Current audit impact: `npm.cmd run intel:source-audit` is now `PASSABLE` after restoring the recovered snapshot into the app-facing files.
- Current audit artifact: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T08-56-51-813Z.json`
- Current audit action: review/highlight the restored training-camp intel before synthesis.

Do not interpret the current empty files as evidence that there is no training-camp intel.

## Verified Snapshot

- Recovered copy: `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json`
- Source commit: `642349e`
- Source blob: `data/training-camp/2026/latest.json`
- Receipt: `.nfl/receipts/training-camp-rss-scout-2026-07-30T03-46-10-171Z.json`
- Verified generated at: `2026-07-30T03:46:07.745Z`
- Verified evidence: 32 teams, 12 teams with intel, 16 items.
- Guardrails recorded in snapshot: live model calls false, Supabase writes false, official picks generated false.
- Feed health: 6 feeds recorded; Football Outsiders reported `fetch failed`.

The recovered copy was created as a new file first. After user approval, it was restored into `latest.json` and `training-camp-intel-2026-07-30.json`.

## Decision Point

The recovered 16-item snapshot has been restored into both app-facing files. The follow-up gate command passed:

```powershell
npm.cmd run intel:source-audit
```

The current source gate has 0 stale, 0 blocked, and 0 missing sources. Any paid/frontier model call still requires explicit approval.

## Resume Note

The safe next move is to ask explicit approval for the frontier-model synthesis run. Keep staging narrow and do not stage unrelated dirty work.
