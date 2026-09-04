# Working Context - Platinum Rose NFL Dashboard

Active workspace memory for the assistant. Keep this brief and accurate.

## Current State

As of: 2026-09-04T11:23:32-07:00.

Verified Git state: `main` is ahead of `origin/main` by 1 commit. Local HEAD is `65d47e3 fix(futures): repair data-correctness, prompt-assembly, and fail-loud gaps in the portfolio pipeline`; `origin/main` is `2c9334a feat(futures): add scale-in entry pattern to Risk/Editor stage`. The worktree is heavily dirty and must be preserved.

Current pickup: prepare for actual NFL dev work in a fresh session. Start with `handoffs/2026-09-04-fresh-nfl-dev-and-writers-room-ingest-handoff.md`, then inspect live Git and scoped diffs before editing.

Likely next dev lane: review/verify the local portfolio-pipeline commit `65d47e3` and related dirty files, then decide whether to continue portfolio integrity, article-evidence/Bookmaker-BetUS capture, or NFL Writers Room adoption as the explicit work lane.

Recent context:

- Antigravity already ingested 2026 final roster snapshots for Honey Badgers and Rose Bowl:
  - `data/fantasy/honey_badgers_final_rosters_2026.csv`
  - `data/fantasy/rose_bowl_final_rosters_2026.csv`
- Do not regenerate Honey Badgers or Rose Bowl roster snapshots unless Andy explicitly asks.
- `nfl_dashboard_final_roster_compilation.md` was not found by exact repo/memory search in the prior session.
- NFL comedy voice source prep now lives under `docs/writers-room/nfl-comedy-voice/`.
- NFL_Dashboard still lacks Writers Room adoption in `.atlas-bridge\manifest.json`; narrative tooling adoption/config is a separate lane.

Standing guardrails:

- Do not clean, reset, stash, broad-stage, commit, or push without explicit approval.
- Do not run `agents/portfolio-synthesize.js` against paid models/API without explicit approval.
- Do not perform Supabase writes without explicit per-write approval.
- Do not mutate betting picks, official picks, portfolios, parlays, or proposal slots without explicit approval.
- No Yahoo Fantasy work unless explicitly directed.
- Preserve unrelated dirty work; inspect scoped diffs before touching shared files.
