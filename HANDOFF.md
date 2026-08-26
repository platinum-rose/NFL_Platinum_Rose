# NFL_Dashboard — Session Handoff
> Auto-generated at session end. Read this to resume.

**Date:** 2026-08-26T08:06:18.976Z
**Branch:** main

## Current Pick Up Here (2026-08-25 14:24 PT, Command Hub Phase 0 + dashboard live-data hydration, Codex)

Resume in `E:\dev\projects\NFL_Dashboard`.

Start with:

```powershell
git status --short --branch
git log -n 8 --oneline --decorate
git branch -vv
```

Then read:

```text
handoffs\2026-08-25-1424-command-hub-phase0-dashboard-data-handoff.md
src\App.jsx
src\components\layout\Header.jsx
src\hooks\useSchedule.js
src\lib\supabase.js
src\lib\profiles.js
tests\unit\appTabRouting.test.js
tests\smoke.spec.js
```

Current state: worktree intentionally dirty and uncommitted. Latest known HEAD
is `ee0931b chore(fantasy): ignore ad hoc Yahoo draft exports`.

This session started Command Hub Phase 0 only:

- Visible dashboard nav label is now `Command Hub`; route id remains
  `dashboard`.
- `supercontest` is now a real sub-level nav route beside Command Hub.
- Duplicate elevated/top-level SuperContest tool was removed.
- Profile personalization now filters visible hubs using real profile data,
  including `supercontest`.
- Yahoo DFS platform support was checked and already existed in the current
  DFS optimizer pattern.

Dashboard data loading was also fixed:

- Startup prefers read-only Supabase `games` rows over local `schedule.json`.
- Local schedule remains the fallback.
- Browser startup reads cached Supabase odds snapshots instead of calling
  TheOddsAPI.
- Latest-season split fallback is used when strict current-week splits are
  empty.
- React StrictMode dev double-fetch was guarded.

Why this mattered: `public/schedule.json` only had 272 regular-season games and
no preseason rows, so the dashboard could only show regular Week 1. Supabase
`games` has 321 playable schedule rows loaded for dashboard use: 49 preseason
and 272 regular-season games.

Chrome verification is now working. Verified at:

```text
http://127.0.0.1:5180/platinum-rose-app/
```

Visible evidence:

```text
PRESEASON WEEK 3 • LIVE
Preseason Week 3
All Games (321)
16 / 321 games
LV @ HOU: PUBLIC SPLITS (47% LV / 53% HOU)
SF @ LAC: PUBLIC SPLITS (38% SF / 62% LAC)
NYJ @ PIT: PUBLIC SPLITS (15% NYJ / 85% PIT)
```

Validation passed:

```text
npx.cmd eslint src\hooks\useSchedule.js src\lib\supabase.js
npx.cmd vitest run tests/unit/appTabRouting.test.js
npm.cmd run build
git diff --check
```

Dirty files at handoff:

```text
M src/App.jsx
M src/components/layout/Header.jsx
M src/hooks/useSchedule.js
M src/lib/profiles.js
M src/lib/supabase.js
M tests/smoke.spec.js
M tests/unit/appTabRouting.test.js
M HANDOFF.md
?? handoffs\2026-08-25-1424-command-hub-phase0-dashboard-data-handoff.md
```

Important caveat: the console line `Loaded 48 game splits` counts lookup keys,
not raw source rows. Supabase currently has 16 source split rows for 2026,
latest captured on 2026-08-22, and those are expanded into multiple lookup keys
for compatibility.

Guardrails: no Phase 3 / AI Intel delegation, no paid API calls, no
Supabase/Postgres writes, no betting/picks/portfolio mutation, do not pop/apply
the M6 NFL stash, no commit/push unless Andy explicitly asks, preserve dirty
worktrees, use `npm.cmd` / `npx.cmd` on Windows.


## Previous Sessions (2026-08-22 -- 2026-08-23, condensed)

The 11 sessions below (Antigravity, Claude/Cowork, and Codex) all landed and are
committed/pushed as of the 2026-08-23 S339 closeout, which itself is superseded by the
2026-08-25 Command Hub Phase 0 entry above. Full detail was archived out of this file on
2026-08-25 (it had grown to 11 stacked "Previous Pick Up Here" blocks). Two places to read
it back:

- **Curated summary (start here):** `handoffs/archive/2026-08-23-1550-cowork-s339-resume-handoff.md`
  -- the S339 closeout resume prompt, itemizes all 11 pieces of work with status.
- **Full verbatim detail:** `handoffs/archive/2026-08-2223-handoff-previous-pickup-here-blocks-consolidated.md`
  -- every original block, unedited (exact root causes, file/line specifics, git-lock
  workarounds, etc.).

Headline items, for quick reference:
- Futures data: BetOnline Vision-OCR ingest (206 records), a 3-month manual-data backfill
  gap found and fixed (4,333 rows loaded, 8,685 total verified live), Value Spot card
  display bug fixed, Expert Signals body-extraction bug fixed (forward-only, not
  backfilled), report tab-nav/interactivity fixed (missing `allow-scripts` on the report
  iframe's sandbox). **Still open per the archived detail:** individual non-live category
  tabs render fully blank instead of an empty-state placeholder (likely the real cause of
  earlier "page is blank" reports) -- not yet fixed as of 2026-08-23.
- Fantasy/IDP: DraftSharks IDP rankings agent built (425 players ingested), IDP Defensive
  Schemes strategy guide ingested, a quant probability/Kelly-cap framework write-up.
- NFL-ATLAS-1 futures pin/watchlist feature shipped (extended the existing
  `FuturesWatchList.jsx` tab; migration `048_futures_pins.sql` run live).
- LINT-1 backlog closed (7/14 warnings fixed, incl. 2 real bugs: `picksRefreshKey`/
  `autoGraded` never wired to a refresh trigger -- now wired).
- A broad non-code archive reorg (123 file moves into `docs/archive/`/`handoffs/archive/`)
  was audited and verified byte-identical/zero breakage by Cowork, but was **still pending
  Codex's own Checkpoint 5 review as of the S339 closeout** -- status not reverified in
  this 2026-08-25 cleanup pass; check the archived detail and TASK_BOARD.md if it matters
  for current work.
- Fixed a real cross-platform coordination bug: this file previously had 3 simultaneous
  `## Current Pick Up Here` headers at once, causing a stale one to be read as current.
  **Standing convention (still in force):** before adding a new `## Current Pick Up Here`
  block, grep this file for existing ones and rename any other match to
  `## Previous Pick Up Here` (or fold into this condensed section) in the same edit.



## Uncommitted Changes

### Modified
- .atlas/lessons-learned.md
- AGENTS.md
- CLAUDE.md
- HANDOFF.md
- HANDOFF_PROMPT.md
- WORKING-CONTEXT.md
- agents/podcast-host-summary.js
- agents/podcast-ingest.js
- handoffs/2026-08-22-1155-codex-checkpoint5-archive-cleanup-handoff.md
- handoffs/2026-08-23-1550-cowork-s339-resume-handoff.md
- hooks/scripts/build-handoff.js
- src/App.jsx
- src/components/layout/Header.jsx
- src/components/podcasts/PodcastDigestTab.jsx
- src/hooks/useSchedule.js
- src/lib/profiles.js
- src/lib/supabase.js
- tests/smoke.spec.js
- tests/unit/appTabRouting.test.js
- vite.config.js

## In Progress
_No In Progress tasks._

## Last Session Summary
- **Duration:** unknown

---
_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_
