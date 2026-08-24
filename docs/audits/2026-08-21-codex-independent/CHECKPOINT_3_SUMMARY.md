# Checkpoint 3 — Implementation Summary

Scope: `UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md` items 9–11 ("Bundle and Load
Performance") only. Checkpoint 1 (items 1-4) and Checkpoint 2 (items 5-8) are
already Codex-approved — see `CODEX_CHECKPOINT_1_FIX_PASS_2_REVIEW.md` and
`CODEX_CHECKPOINT_2_REVIEW.md`.

## Baseline before work

- `git status --short --branch`: `main...origin/main`, same dirty worktree
  left by Checkpoints 1/2 (uncommitted, untouched by this pass) plus the 4
  files below.
- HEAD at start: `7840966`, unchanged — no commits/pushes made.
- Tested against Andy's own already-running local dev server
  (`http://localhost:5173/platinum-rose-app/`) via Claude-in-Chrome,
  authenticated with his real Supabase data — not a sandboxed browser.

## Files changed (all uncommitted)

- `src/App.jsx` — item 9
- `src/components/agent/PersistentAgentSidebar.jsx` — item 10
- `scripts/check-bundle-budget.js` — item 11 (new file; unit-convention bug
  found and fixed mid-checkpoint during review, see item 11 / Build
  Verification below)
- `package.json` — item 11 (one new script line, `build:budget`)

## 9. Lazy-Load Modal and Tool Surfaces

`App.jsx` had ~26 modal/tool components as static top-level imports even
though every one of them is only ever conditionally rendered (`{flag &&
<X/>}`, or gated on `selectedGame`/`selectedPmContract`) — **except** four
that were unconditionally mounted with an `isOpen` prop just gating their own
internal `if (!isOpen) return null` (`PodcastIngestModal`, `AgentStatusModal`,
`PredictionMarketConverter`, `ProfileSettingsModal`). A static import means
Vite/Rollup bundles that module's code (and everything it pulls in) into
whatever chunk imports it — in this case the entry chunk that loads on every
first paint — regardless of whether the JSX conditionally renders it. So all
~26 modals' code shipped on every dashboard load whether or not the user ever
opened them.

Changes:
- All ~26 modal/tool imports converted from static `import X from '...'` to
  `const X = lazy(() => import('...'))`.
- A single `<Suspense fallback={...}>` boundary now wraps the whole
  "LAZY-MOUNTED MODALS" JSX block (it previously had no Suspense boundary at
  all, since nothing inside it suspended). Fallback is a small fixed-position
  centered "Loading..." overlay, only ever visible on a cold first-open of a
  given modal — every reopen after that reuses the already-fetched chunk.
- The four previously-always-mounted modals are now also conditionally
  mounted (`{podcastModalOpen && <PodcastIngestModal isOpen .../>}`, etc.) —
  matching the pattern every other modal in this file already used. This is
  behavior-preserving: each of the four already gated all of its real work
  (data fetch effects, rendered content) behind `if (!isOpen) return null` /
  `useEffect(() => { if (isOpen) load(); }, [isOpen])`, so mounting them only
  while `isOpen` is true is exactly equivalent to what they did before, minus
  the wasted eager fetch.
- `MyCardModal` (used for the `mycard` tab, inside the existing tab-switch
  Suspense) was also converted the same way, consistent with every other tab
  component in that switch already being lazy.

## 10. Lazy-Load Agent Mode Bodies

`PersistentAgentSidebar.jsx` already had a `<Suspense>` boundary around its
per-mode body (`{activeMode === 'general' && <AgentChat .../>}`, etc.) — but
`AgentChat`, `FuturesAgentChat`, and `PropsAgentChat` were static imports, so
the Suspense boundary had nothing lazy inside it to actually catch. Since
`DashboardLayout` (which renders `PersistentAgentSidebar`) is itself a static
top-level import in `App.jsx`, all three chat components — and everything
each one pulls in — shipped in the initial dashboard bundle even though only
one mode's body renders at a time (5 of the 7 modes share `AgentChat` via an
`agentMode` prop; only one mode is ever active).

Change: all three converted to `const X = lazy(() => import('./X'))`. The
existing Suspense fallback ("Switching Agent Mode..." spinner) now does real
work. `PropsAgentChat` is also separately lazy-imported in `App.jsx` for the
top-level `props` tab (Checkpoint 1) — both import sites point at the same
module specifier, so Rollup/Vite dedupes them into one shared async chunk;
there is no duplication. Before this change, the sidebar's *static* import of
`PropsAgentChat` would have forced that module (and its dependents) into the
eager entry graph regardless of the other, already-lazy import site — Rollup
only treats a module as a splittable async chunk if *every* import path to it
is dynamic.

## 11. Bundle Budget Visibility

Added `scripts/check-bundle-budget.js` (new) + `npm run build:budget` in
`package.json`. Deliberately minimal: reads `<outDir>/assets/*.js` after a
build already ran, prints every JS chunk sorted by size (largest first),
flags anything over the existing `vite.config.js` `chunkSizeWarningLimit`
(600 kB), and calls out the `index-*.js` entry chunk specifically since
that's what these Checkpoint 3 changes target. It never runs a build itself,
never fails (`process.exit(0)` even on a missing/empty outDir), and keeps no
baseline/state file that could go stale — informational only, so it can't
create CI churn or block anyone. Usage: `npm run build:budget` (defaults to
`dist`) or `npm run build:budget -- dist-verify-checkpoint3-after` (or any
other outDir) for a specific build.

Verified the script directly (not via a project build, see Build
Verification below): confirmed it reports 0 exit / a clear message against a
missing directory, and correctly sorts/labels/sizes a synthetic
`assets/*.js` fixture, correctly identifying the `index-*.js` file as the
entry chunk.

**Correction made during review:** the script's size formatter originally
divided by 1024 while labeling the result "kB" — Vite/Rollup's own build
summary uses decimal kB (÷1000) for the same label, so the two disagreed on
the same file's size (e.g. `1,262.5 kB` here vs. Vite's own `1,292.84 kB`
for the same `index-CctTDsx3.js`). Fixed to ÷1000 so this script's output
matches Vite's own printed numbers exactly — see Build Verification below
for the reconciled figures.

## Build Verification

**This session's own remote shell could not complete a production build** —
a hard 45-second-per-call ceiling with no way to run a command in the
background across calls (verified directly: a `nohup ... & disown`'d
process does not survive to the next call — the sandbox tears down the
whole process tree between calls), and computer-use access to a terminal on
Andy's desktop is deliberately click-only for terminals/IDEs in this
session's tooling. Same pre-existing constraint documented in `HANDOFF.md`'s
2026-08-16/17 entry and `CHECKPOINT_2_SUMMARY.md`.

**Andy ran `npm.cmd run build` natively and shared the real output**, so
this checkpoint has genuine production numbers rather than an estimate:

```
✓ 2762 modules transformed.
✓ built in 8.36s
dist/assets/index-CctTDsx3.js       1,292.84 kB │ gzip: 182.72 kB
(!) Some chunks are larger than 600 kB after minification.
```

`node scripts/check-bundle-budget.js dist` (run against that real output —
item 11's own script, dogfooded for the first time) confirms:

- **56 JS chunks, 4,697.5 kB total.**
- **All 26 modal/tool components + `PredictionMarketConverter` are separate
  chunks** (e.g. `BetEntryModal-BLYWyasA.js` 9.9 kB, `MatchupWizardModal-
  CuK6WVY0.js` 27.4 kB, `MyCardModal-B26GfPon.js` 13.4 kB, down to
  `LineHistoryModal-Ctq8e1Qw.js` at 1.4 kB) — none of them appear in
  `index-CctTDsx3.js`. This is direct, real-build proof that item 9's
  `lazy()` conversion works: these files are not reachable from the entry
  chunk's static import graph at all, only via dynamic `import()`.
- **All 3 agent-mode bodies are separate chunks** — `AgentChat-CyAz10gw.js`
  186.8 kB, `PropsAgentChat-5AeCDPHs.js` 34.2 kB, `FuturesAgentChat-
  sHLiI5dV.js` 25.0 kB — same proof for item 10.
- **The entry chunk itself, `index-CctTDsx3.js`, is still 1,292.8 kB
  minified (182.72 kB gzip) and still over Vite's own 600 kB warning
  limit.** No true pre-Checkpoint-3 build exists to diff against (Checkpoint
  2's own build attempt never got past the `EPERM` unlink error, so no
  chunk sizes were ever recorded before now) — this is the first real
  chunk-size data point for this repo since Checkpoint 1. So while the
  *mechanism* is proven correct (29 components verifiably excluded from the
  entry graph), the *magnitude* of item 9/10's savings can't be stated as a
  clean before/after delta from this data alone. See Known Residual Issues
  below for what's likely still driving the entry chunk's size and is out
  of this checkpoint's scope.
- Two other pre-existing large chunks are already correctly split out (not
  part of `index.js`, not touched by Checkpoint 3): `FuturesPortfolio-
  T3aZDAkm.js` (836.9 kB) and `latest-DWM6UrYL.js` (653.1 kB, also over the
  600 kB warning) — both were already dynamic imports before this checkpoint
  and are unrelated to items 9-11.

**Unit-convention bug found and fixed during review:** the numbers above
now match Vite's own printed build summary exactly (`index-CctTDsx3.js`:
1,292.8 kB here vs. Vite's own `1,292.84 kB`). They didn't on the first pass
of this checkpoint — `check-bundle-budget.js` originally divided byte sizes
by 1024 while labeling the result `kB`, while Vite/Rollup's own build
summary uses decimal kB (÷1000) for the same label. Same underlying file,
two conventions, two different-looking numbers (1,262.5 kB vs. 1,292.84 kB)
for `index-CctTDsx3.js` — caught in review rather than by anything failing,
since both numbers were internally consistent, just disagreeing with each
other. Fixed by switching `fmtKb()` (and the over-budget comparison) to
÷1000, matching Vite/Rollup's convention, specifically so this script's
output can be eyeballed straight against Vite's own printed build output
without a mental unit-conversion step. Re-ran against the same `dist/` — all
figures in this section are post-fix and reconciled with Vite's own numbers.

Optional follow-up for an exact isolated delta: temporarily `git stash push
-- src/App.jsx src/components/agent/PersistentAgentSidebar.jsx`, rebuild,
record the pre-Checkpoint-3 `index-*.js` size, then `git stash pop` to
restore. Not done here since it requires another native-shell round trip
and the current evidence already directly confirms the mechanism works;
flagging as available if Codex wants the precise number.

## Browser checks performed

All against Andy's live authenticated dev server
(`http://localhost:5173/platinum-rose-app/`), Vite HMR picked up all four
changed files with no overlay/compile error.

- **Dashboard first render**: current-slate default intact ("Preseason Week
  3", 16/321 games), matchup cards, spread/total consensus, prediction-market
  badges, and weather badges (from Checkpoint 2) all rendered normally.
  Persistent agent sidebar rendered on first paint with prior chat history
  intact (confirms `AgentChat`'s lazy chunk loaded and hydrated correctly for
  the default `general` mode).
- **Bankroll modal** (`BetEntryModal`, lazy): clicked a real game-card
  "Bankroll" button — modal opened with the clicked game
  ("Las Vegas Raiders @ Houston Texans") pre-selected, Kelly sizing showed
  "Recommended: 0.8 units" / "Bet Amount: $40.00" — no `undefined`, no
  `$NaN`.
- **Prediction-market modal** (`PredictionMarketModal`, lazy): clicked a
  real game-card Polymarket badge — opened "Raiders vs. Texans" market
  details with correct contract price/odds, confirming Checkpoint 1's
  matchup-badge filtering fix still holds through the lazy-load change.
- **Agent mode bodies** (item 10): switched sidebar mode to "Futures AI"
  (`FuturesAgentChat`, lazy) — rendered "FUTURES Agent ready" with live
  suggested prompts; switched to "Player Props" (`PropsAgentChat`, lazy) —
  rendered "PROPS Agent ready" with its own suggested prompts. Both loaded
  and rendered correctly on first selection.
- **The four newly-conditional modals** (item 9): opened each from its real
  header trigger — `ProfileSettingsModal` (profile icon) showed the 3 preset
  profiles with "Master View" active/checked; `AgentStatusModal` (agent
  status icon) loaded live Supabase pipeline data (6 active feeds, 7
  processed, 13 queued, 31 expert picks, recent-episodes list);
  `PredictionMarketConverter` (Kalshi/Poly button) rendered the odds
  converter with a live calculation (35¢ → +173 net fee-adjusted, sportsbook
  comparison). All three worked exactly as before, now mounting only on open.
  (`PodcastIngestModal`'s trigger — the Picks & Inbox "podcast" button — was
  not separately re-clicked this pass since its `isOpen`-gated internal
  logic is identical to the other three and its conversion is mechanically
  identical; flagging as verified-by-pattern rather than independently
  clicked.)
- **`mycard` tab** (`MyCardModal`, newly lazy): navigated directly via
  `?tab=mycard` — "Betting Card" / Slip Builder rendered normally, no error
  boundary.
- **`bankroll` tab** (`BankrollDashboard`, already lazy pre-Checkpoint-3, spot
  checked for regression): navigated via `?tab=bankroll` — rendered
  normally.
- **Console**: read on every page load / interaction above, `onlyErrors`
  and unfiltered — zero errors or exceptions across the whole pass. Log-level
  output matched Checkpoint 2's expected quiet baseline (one live-odds
  summary line, one splits-404 info line, no per-game warning floods).

Not separately re-verified this pass (no reason to expect regression, not
touched): `official-picks`, `intel`, `injuries`, `futures`, `devlab`,
`picks`, `standings`, `podcasts`, `training-camp`, `dfs` tabs, and the
remaining ~20 modals not explicitly listed above — all converted through the
exact same mechanical `import` → `lazy(() => import(...))` change as the
ones that were spot-checked, with no logic changes to any of them.

## Verification performed

- `npx eslint src/App.jsx src/components/agent/PersistentAgentSidebar.jsx
  scripts/check-bundle-budget.js` → **0 errors, 2 pre-existing warnings**
  (`picksRefreshKey`, `autoGraded` unused-var warnings in `App.jsx` — present
  before this checkpoint, already noted in
  `CODEX_CHECKPOINT_1_FIX_PASS_2_REVIEW.md`; not introduced here).
- No new unit tests added — items 9-11 are import/mounting/bundling changes
  with no new pure logic/helpers, consistent with the plan's own file-scope
  list (`src/App.jsx`, `PersistentAgentSidebar.jsx`, build tooling). No
  existing test file references `App.jsx` or `PersistentAgentSidebar.jsx`
  (`grep -rl "App.jsx\|PersistentAgentSidebar" tests/` → no matches), so
  there was no existing regression suite scoped to these files to re-run.
- `scripts/check-bundle-budget.js` sanity-checked against a synthetic
  fixture first (missing-outDir handling, sort order, entry-chunk
  detection), then run for real against Andy's actual `dist/` output — see
  Build Verification above for the real report.
- Full live-browser pass against Andy's real running dev server via
  Claude-in-Chrome — see Browser checks above.
- Production build: **completed natively by Andy** (`npm.cmd run build`,
  2,762 modules, 8.36s, 0 errors) — see Build Verification above for the
  real chunk-size results.

## Known residual issues (not fixed here — out of this checkpoint's scope)

Carried forward from Checkpoint 2's nonblocking follow-ups (untouched by
Checkpoint 3, none of them blocked the bundle/load work so none were pulled
in):
- `All Games (321)` label may be slightly misleading since completed games
  stay hidden by default.
- `MatchupCard.jsx` stadium lookup still misses some abbreviations (`LAC`
  confirmed).
- `useSchedule.js` splits-merge behavior is broader than just the 404
  warning-severity fix and should stay visible, not silently accepted.

New from this checkpoint:
- **The entry chunk (`index-*.js`) is still 1,292.8 kB minified / 182.72 kB
  gzip — over Vite's 600 kB warning limit even after items 9-11.** Items
  9-11 were scoped to modal/tool and agent-mode lazy-loading specifically,
  not a full audit of everything else statically reachable from `App.jsx`.
  Likely contributors, unconfirmed without further investigation: React +
  ReactDOM have no manual vendor chunk (only `recharts`/`lucide-react`/
  `@supabase/supabase-js` do, per `vite.config.js`); `src/lib/experts.js`
  (measured at ~112 kB unminified via the dev server's per-module resource
  sizes) is a static data import in `App.jsx`
  (`import { INITIAL_EXPERTS } from './lib/experts'`); and the eagerly-kept
  shell itself (`Header.jsx`, `Dashboard.jsx`, `DashboardLayout.jsx`,
  `MatchupCard.jsx`, all hooks) was intentionally left eager since it's
  needed for first paint. Worth a dedicated look in a future checkpoint —
  not fixed here to avoid scope creep beyond items 9-11.
- `PodcastIngestModal`'s conditional-mount conversion was verified by
  pattern match against the other three always-mounted-turned-conditional
  modals, not independently clicked this pass.
- Browser checks (see above) were run against Andy's dev server, not this
  production build — dev-mode module-splitting behavior and production
  chunk-splitting behavior are different mechanisms (Vite always serves
  per-module in dev regardless of `lazy()`; the real chunk boundaries only
  exist in a production build), so the dev-server checks prove the
  components render and behave correctly, while this build's chunk list is
  what proves the splitting itself. A production-build browser pass (via
  `npm.cmd run preview`) would close that last gap if Andy wants it.

## Cleanup / no writes

No commits, no pushes, no `git add`, no Supabase writes, no bets/picks/
portfolio mutations, no paid model/API calls, no Yahoo work. Worktree left
exactly as dirty as before plus the 4 files listed above.

## Recommendation

Checkpoint 3 (items 9-11) implemented, browser-verified against Andy's live
dev server, and now build-verified against a real native production build
(`npm.cmd run build`, run by Andy) confirming all 29 lazy-loaded components
are genuinely separate chunks excluded from the entry bundle. A unit-
convention bug in `check-bundle-budget.js` itself (÷1024 vs. Vite's own
÷1000 "kB") was caught in review and fixed — see Build Verification; all
sizes in this doc are now reconciled with Vite's own printed numbers. Open
items for Codex: (1) the entry chunk is still over the 600 kB warning limit
at 1,292.8 kB min / 182.72 kB gzip — flagged as a residual, not fixed here,
since it's outside items 9-11's scope; (2) no isolated before/after delta
exists for items 9-11 specifically, only direct proof the mechanism works
(see Build Verification's optional `git stash` follow-up if an exact number
is wanted). Stopping here for Codex review before Checkpoint 4, per the
unified plan's stop condition.
