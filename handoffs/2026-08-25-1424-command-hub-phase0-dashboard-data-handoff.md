# NFL_Dashboard Handoff - 2026-08-25 14:24 PT

## Current Pick Up Here

Resume in `E:\dev\projects\NFL_Dashboard`.

This session started from a clean Windows checkout aligned with `origin/main`
at:

```text
ee0931b chore(fantasy): ignore ad hoc Yahoo draft exports
```

Work is intentionally uncommitted. Do not commit or push unless Andy explicitly
asks.

## What Changed

Command Hub Phase 0 scope was started and kept narrow:

- Renamed the visible dashboard nav label to `Command Hub` while preserving
  the existing `dashboard` route id for compatibility.
- Added `supercontest` as a real sub-level nav route beside Command Hub.
- Removed the duplicate elevated/top-level SuperContest tool from the header.
- Wired profile personalization through real visible hub filtering, including
  the new `supercontest` hub.
- Confirmed Yahoo DFS platform support already existed in the DFS optimizer
  pattern before this session.

Dashboard data loading was fixed:

- `src/hooks/useSchedule.js` now has a single guarded boot loader so React
  StrictMode dev mounts do not double-fetch schedule/odds/splits/injuries.
- Browser startup no longer calls TheOddsAPI. It reads the latest cached
  Supabase odds snapshot via `getLatestOddsSnapshot()`.
- `src/lib/supabase.js` now exposes read-only `getGamesForSeason(season)`.
- Dashboard schedule hydration now prefers Supabase `games` rows and falls
  back to `public/schedule.json` only when Supabase is unavailable/empty.
- Supabase `games` rows are mapped into the existing card shape
  (`id`, `game_id`, `week`, `season_type`, `kickoff_utc`, team abbreviations,
  names, spread, total, moneylines, context fields).
- `src/lib/supabase.js` now exposes read-only
  `getLatestGameSplitsForSeason(season)` as a fallback when the strict
  current-week `game_splits` query is empty.

## Why The Dashboard Looked Stale

The local `public/schedule.json` contained only 272 regular-season games
(`season_type=2`), with no preseason rows. The dashboard slate picker was
working as designed, but it only received regular-season data, so it defaulted
to regular Week 1.

Read-only Supabase inspection showed the `games` table already has the full
schedule:

- 49 preseason games
- 272 regular-season games
- 13 playoff placeholder rows

The `game_splits` table currently has only 16 rows for 2026, all marked
`week=1`, latest captured `2026-08-22T19:14:20.542+00:00`. Those rows match
the preseason Week 3 slate by team pair, so loading the Supabase schedule makes
the split fallback visible on the preseason cards.

## Verified Evidence

Chrome extension/browser control is now working in this Codex session.

Verified in Chrome at:

```text
http://127.0.0.1:5180/platinum-rose-app/
```

Visible dashboard evidence:

```text
PRESEASON WEEK 3 • LIVE
Preseason Week 3
All Games (321)
16 / 321 games
```

Visible split evidence on preseason cards:

```text
LV @ HOU: PUBLIC SPLITS (47% LV / 53% HOU)
SF @ LAC: PUBLIC SPLITS (38% SF / 62% LAC)
NYJ @ PIT: PUBLIC SPLITS (15% NYJ / 85% PIT)
CAR @ JAX: PUBLIC SPLITS (34% CAR / 66% JAX)
```

Console/log evidence from Chrome/local verification:

```text
🚀 Fetching dashboard schedule, cached odds, splits, and injuries...
ℹ️ No splits rows for PRESEASON WEEK 3; using 16 latest season split rows from 8/22/2026, 12:14:20 PM.
✅ Schedule Loaded: 321 games from Supabase games (49 preseason, 272 regular)
☁️ Dashboard odds loaded from Supabase snapshot: 272 games
📥 Loaded 48 game splits
```

Note: `Loaded 48 game splits` is currently counting lookup keys, not source
rows. The 16 source split rows are each keyed multiple ways for compatibility
(`game_id`, `away_home`, `home_away`).

Validation run:

```text
npx.cmd eslint src\hooks\useSchedule.js src\lib\supabase.js
npx.cmd vitest run tests/unit/appTabRouting.test.js
npm.cmd run build
git diff --check
```

Results:

- Focused ESLint: passed.
- App route unit test: 21/21 passed.
- Production build: passed, with only the repo's normal Browserslist/chunk-size
  warnings.
- Diff whitespace check: passed.

Known unrelated test note:

- `npx.cmd vitest run tests/unit/seasonHardcode.test.js` has one pre-existing
  preseason expectation mismatch (`Aug 1 2026` expects week `0`, current code
  returns `101` / `PRESEASON WEEK 1`). This was not expanded/fixed.

## Current Dirty Files

```text
M src/App.jsx
M src/components/layout/Header.jsx
M src/hooks/useSchedule.js
M src/lib/profiles.js
M src/lib/supabase.js
M tests/smoke.spec.js
M tests/unit/appTabRouting.test.js
```

This handoff file and `HANDOFF.md` will also be dirty after the handoff update.

## Local Servers

Useful local URLs from this session:

```text
http://127.0.0.1:5174/platinum-rose-app/  standard dev server
http://127.0.0.1:5180/platinum-rose-app/  VITE_BYPASS_AUTH=true verification server
```

The Chrome tab was left open on the `5180` URL.

## Guardrails

- Do not pop/apply the M6 NFL stash. It was previously inspected as
  backup-only generated/local residue.
- Do not start Phase 3 / AI Intel delegation without Andy's explicit approval;
  that can involve billed Anthropic API usage.
- Do not make paid API calls.
- Do not write Supabase/Postgres or mutate betting, picks, or portfolio state
  without explicit approval.
- Do not commit or push unless Andy explicitly asks.
- Preserve dirty worktrees; inspect scoped diffs before editing.
- Use `npm.cmd` / `npx.cmd` on Windows for NFL commands.
- Prefer focused checks first, then broader checks only if the touched surface
  warrants it.

## Suggested Next Steps

1. Review the current scoped diffs independently before editing.
2. Reopen/refresh Chrome at `http://127.0.0.1:5180/platinum-rose-app/` and
   confirm the preseason slate and splits remain visible.
3. Decide whether to keep the latest-season splits fallback as-is or refine the
   logging/UI language so it is clear the current source has 16 rows expanded
   into multiple lookup keys.
4. If Andy approves, finalize Phase 0 changes with a narrow commit.

## Resume Prompt

Resume in `E:\dev\projects\NFL_Dashboard`.

First run:

```powershell
git status --short --branch
git log -n 8 --oneline --decorate
git branch -vv
```

Read first:

```text
HANDOFF.md
handoffs\2026-08-25-1424-command-hub-phase0-dashboard-data-handoff.md
src\App.jsx
src\components\layout\Header.jsx
src\hooks\useSchedule.js
src\lib\supabase.js
src\lib\profiles.js
tests\unit\appTabRouting.test.js
tests\smoke.spec.js
```

Objective:

Continue/review NFL_Dashboard Command Hub Phase 0 only:

- Dashboard rename
- SuperContest shell/routing only
- Real Profile personalization wiring
- Yahoo DFS platform option following the existing DK/FD pattern
- Read-only dashboard data hydration from Supabase `games`, cached odds
  snapshots, and available splits

Expected current behavior:

- Chrome extension/browser control should now connect.
- Dashboard at `http://127.0.0.1:5180/platinum-rose-app/` should show
  `PRESEASON WEEK 3 • LIVE`.
- Dashboard should show 321 games from Supabase schedule data.
- Preseason Week 3 cards should show real splits where latest-season split rows
  match by team pair.

Guardrails:

- No Phase 3 / AI Intel agent delegation without Andy's explicit approval.
- No paid API calls.
- No Supabase/Postgres writes.
- No betting, picks, or portfolio mutation.
- Do not pop/apply M6 NFL stash.
- No commit or push unless Andy explicitly asks.
- Preserve dirty worktrees and inspect scoped diffs before editing.
- Use `npm.cmd` / `npx.cmd` on Windows.
