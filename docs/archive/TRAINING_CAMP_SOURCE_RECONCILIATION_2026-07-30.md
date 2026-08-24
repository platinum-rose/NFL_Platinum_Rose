# Training Camp Source Reconciliation - 2026-07-30

Purpose: preserve the July 30 training-camp recovery trail and record the fresh approved live RSS scout used before frontier synthesis.

This is source-control and handoff evidence only. It is not a betting recommendation, not an official-picks action, and not approval for a paid/frontier model call.

## Current State

- Current app-facing file: `data/training-camp/2026/latest.json`
- Current timestamped file: `data/training-camp/2026/training-camp-intel-2026-07-30.json`
- Current generated at: `2026-07-30T15:21:34.180Z`
- Current evidence: 32 teams, 10 teams with intel, 19 items, 4 high-priority items, 6 feed-health entries.
- Current audit impact: `npm.cmd run intel:source-audit` is `PASSABLE` after the fresh approved live RSS scout refreshed the app-facing files.
- Current audit artifact: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T15-21-51-624Z.json`
- Current audit action: review/highlight the refreshed training-camp intel before synthesis.

Do not interpret the earlier failed sandbox scout output as evidence that there is no training-camp intel; the normal-network rerun succeeded and overwrote the transient 0-item output.

## Recovery Snapshot

- Recovered copy: `data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json`
- Source commit: `642349e`
- Source blob: `data/training-camp/2026/latest.json`
- Receipt: `.nfl/receipts/training-camp-rss-scout-2026-07-30T03-46-10-171Z.json`
- Verified generated at: `2026-07-30T03:46:07.745Z`
- Verified evidence: 32 teams, 12 teams with intel, 16 items.
- Guardrails recorded in snapshot: live model calls false, Supabase writes false, official picks generated false.
- Feed health: 6 feeds recorded; Football Outsiders reported `fetch failed`.

The recovered copy was created as a new file first. After user approval, it was restored into `latest.json` and `training-camp-intel-2026-07-30.json`.

## Fresh Live RSS Scout

- Command: `npm.cmd run training-camp:scout:live`
- Successful receipt: `.nfl/receipts/training-camp-rss-scout-2026-07-30T15-21-35-524Z.json`
- Snapshot generated at: `2026-07-30T15:21:34.180Z`
- Evidence: 32 teams, 10 teams with intel, 19 items, 4 high-priority items.
- Feed health: ESPN NFL available, Pro Football Talk available, PFF available, Rotowire NFL available, Sharp Football available with 0 kept, Football Outsiders `fetch failed`.

The first sandboxed live scout attempt could not reach any feeds and wrote a 0-item snapshot. The same approved command was rerun with normal network access immediately afterward, succeeded, and replaced the app-facing files.

## Decision Point

The fresh 19-item live RSS scout snapshot is now written into both app-facing files. The follow-up gate command passed:

```powershell
npm.cmd run intel:source-audit
```

The current source gate has 0 stale, 0 blocked, and 0 missing sources. Any paid/frontier model call still requires explicit approval.

## Resume Note

The safe next move is to ask explicit approval for the frontier-model synthesis run. Keep staging narrow and do not stage unrelated dirty work.
