# Checkpoint 1 -- Fix Pass #2 (response to Codex review)

Date: 2026-08-21
Author: Claude (S336)
Reviewed against: docs/audits/2026-08-21-codex-independent/CODEX_CHECKPOINT_1_REVIEW.md

## Scope

This is a narrow fix pass addressing exactly the 3 P1 blocking findings from
Codex's Checkpoint 1 review. No Checkpoint 2 work was started. The two P2
non-blocking follow-ups (BankrollDashboard inert action buttons, `agent`
deeplink gap) were intentionally NOT touched -- Codex marked them optional
and out of the narrow-pass scope; both are still open and are called out
below as residual.

## Files changed (this pass)

- `src/lib/predictionMarketStore.js` -- rewrote `getContractForGame()` matching logic
- `src/components/dashboard/MatchupCard.jsx` -- pass `game.commence_time` to `getContractForGame()`; removed now-fully-unused `getContractsForTeam` import
- `src/components/dashboard/Dashboard.jsx` -- pass `g.commence_time` to `getContractForGame()` in the `pm_market` filter chip (same fix, second call site)
- `src/components/official-picks/OfficialPicksTab.jsx` -- fixed the `mountedRef` StrictMode double-invoke bug
- `src/components/analytics/AnalyticsDashboard.jsx` -- fixed `loadAnalytics` TDZ ordering bug
- `tests/unit/predictionMarketStore.test.js` -- added 6 new tests reproducing Codex's exact real-audit examples

## P1 #1 -- Prediction-market date/rematch matching

Root cause: the whole-token team match from the first pass fixed the
substring false-positives, but never checked *when* a contract was for.
Division rivals play twice a season, and the ingested data has separate
preseason and regular-season contracts for the same two teams -- team-only
matching can't tell them apart.

Fix: `getContractForGame(visitorAbbr, homeAbbr, gameDateStr)` now takes a
3rd argument, the scheduled kickoff. A candidate contract's date is parsed
from an ISO `YYYY-MM-DD` in its ticker/title, or from a "Month Day" mention
in the title (e.g. "their January 30 matchup"). A contract whose date
conflicts with the scheduled game (beyond a 1.5-day tolerance, to absorb
UTC-vs-local calendar-day rollover on late kickoffs) is never used, even if
it's the only team-matching candidate. Both call sites (`MatchupCard.jsx`
and `Dashboard.jsx`'s `pm_market` filter chip) now pass `commence_time`.

Also added, since the audit's SF@LAR example ("in their January 30
matchup?") had no `vs./@` head-to-head wording at all: a candidate must now
contain an explicit head-to-head connector ("vs.", "versus", "@", "at") in
its title, not just both team names. Undated candidates are only used when
they're the single unambiguous one; 0 or 2+ undated candidates for the same
pair return null rather than guessing (covers rematch ambiguity for
undated contracts, since a real second scheduled meeting would otherwise
have no way to disambiguate which game an undated contract belongs to).

Verification:
- 6 new unit tests reproduce Codex's exact real audit examples verbatim
  (DEN@KC vs. the 2025-11-16 Chiefs/Broncos contract, SEA/KC preseason vs.
  Week 7, LAC/HOU preseason vs. Week 9, the undated SF/LAR "January 30"
  prop, a UTC-rollover tolerance case, and an ambiguous-undated-rematch
  case) -- all pass.
- Full predictionMarketStore.test.js: 12/12 pass (6 original + 6 new).
- Could not re-run the live-browser badge-count spot check Codex did
  (70/321 games) in this environment -- see "Verification gap" below.

## P1 #2 -- Picks & Inbox offline failsafe not resolving

Root cause found by re-reading the component against React 18
`<StrictMode>` (confirmed active in `src/main.jsx`): the `mountedRef`
pattern only *cleared* `mountedRef.current` in an effect cleanup and never
*set* it in the effect body. StrictMode's dev-mode double-invoke of effects
(mount -> cleanup -> mount again) runs that cleanup once as part of its
own simulated-unmount cycle, permanently flipping `mountedRef.current` to
`false` before the component is ever "really" interacted with -- and
`false` never gets reset back to `true`, since nothing in the effect body
sets it. Every `if (!mountedRef.current) return;` guard inside `probe()`
(both the offline failsafe's own state update, and the real
success/failure branches) was therefore silently dead code, so
`serverStatus` could never leave `"checking"` no matter how long you
waited -- this exactly matches Codex's observation (stuck past 15s).

Fix: the mount effect now sets `mountedRef.current = true` in its body
(not just `false` in cleanup), so after StrictMode's double-invoke settles,
it's back to `true` for the "real" mounted lifetime of the component. This
is the standard fix for this well-documented anti-pattern.

Verification:
- Ran a framework-free simulation of React 18 StrictMode's documented
  effect double-invoke contract against both the old and new `mountedRef`
  patterns: old pattern ends at `false` (matches the observed bug), new
  pattern ends at `true` (bug eliminated). Output:
  ```
  OLD pattern mountedRef.current after StrictMode double-invoke: false <-- BUG
  NEW pattern mountedRef.current after StrictMode double-invoke: true <-- FIXED
  ```
- Could not re-run Codex's exact live-browser check (navigate with no
  local inbox server running, wait 15s, confirm offline text) in this
  environment -- see "Verification gap" below.

## P1 #3 -- `analytics` tab crash (`Cannot access 'loadAnalytics' before initialization`)

Root cause: `useEffect(() => { loadAnalytics(); }, [loadAnalytics]);` was
declared *before* `const loadAnalytics = useCallback(...)`. `const`
bindings are in the temporal dead zone until their declaration line runs,
so referencing `loadAnalytics` in the effect's dependency array (evaluated
during render, top-to-bottom) threw a `ReferenceError` on every render of
this component, immediately on mount.

Fix: moved the `useEffect` to after the `useCallback` declaration -- no
other logic changed.

Verification:
- Ran a minimal, framework-free reproduction of the exact broken/fixed
  declaration order in plain Node: the broken order throws
  `ReferenceError: Cannot access 'loadAnalytics' before initialization`
  (the literal message from Codex's browser check); the fixed order
  returns normally.
- `npx eslint` on this file: 0 errors.
- Could not re-run Codex's exact live-browser check (`?tab=analytics`,
  confirm no error boundary) in this environment -- see "Verification gap"
  below.

## Commands run and results

- `npx vitest run tests/unit/predictionMarketStore.test.js tests/unit/bankroll.test.js tests/unit/teamIdentity.test.js` -- 3 files, **38/38 tests pass** (was 32; +6 new).
- `npx eslint src/components/modals/BetEntryModal.jsx src/components/official-picks/OfficialPicksTab.jsx src/App.jsx src/lib/predictionMarketStore.js src/components/dashboard/MatchupCard.jsx src/components/dashboard/Dashboard.jsx src/components/analytics/AnalyticsDashboard.jsx tests/unit/predictionMarketStore.test.js` -- **0 errors**, same 2 pre-existing `src/App.jsx` warnings Codex already noted as pre-existing (`picksRefreshKey`, `autoGraded` unused vars, unrelated to this pass).
- `npx vite build --outDir /tmp/dist_check_cp1fix` -- **build succeeds**, same pre-existing large-chunk warnings as before (Checkpoint 3 scope, not this pass).

## Verification gap (repeated, environment-specific -- same root cause as last pass)

This Cowork session reaches your repo through a device bridge into a
sandboxed VM, not a local shell. Confirmed this pass:
- `npx playwright install chromium` on the device VM fails with
  `403 Connection blocked by network allowlist` against
  `cdn.playwright.dev` -- no Chromium binary is obtainable there.
- The VM's filesystem is too slow for a full-repo copy into the (separate)
  cloud container that does have Chromium pre-installed -- a plain
  `du -sh` over the repo (excluding `node_modules`/`dist*`) timed out at
  45s.
- Backgrounded dev-server processes on the device VM are killed at the end
  of every tool call, so a server can't be kept alive for a separate
  browser-automation call to reach it, even if a browser were available.

Net effect: I cannot reproduce Codex's exact live-browser checks (navigate
Chrome, read rendered text/console) from this session. Where a bug's root
cause was a plain JS/React semantics issue (TDZ ordering, StrictMode
effect double-invoke), I built minimal framework-free reproductions of the
*exact* failure and fix, shown above, as the closest available substitute.
For the badge-matching fix, the 6 new unit tests reproduce Codex's literal
audit data. None of this replaces an actual click-through, and a real
browser check (by Codex, or by Andy) before this is considered fully closed
is still recommended, same as last pass.

## Residual (unchanged from last pass, intentionally not addressed here)

- P2: `BankrollDashboard` top-level tab renders some action buttons with no
  handler wired (`onShowSettings()` etc.) -- Codex flagged as optional/low-risk,
  not touched this pass.
- P2: `agents/nfl-daily-brief.js` links to `?tab=agent`, which is still not
  in `VALID_TABS` -- flagged as residual by Codex, not part of the original
  11-tab checkpoint scope, not touched.
- `_to_delete/` in the repo root now also contains `vite.tmp.config.js` and
  `cp1_verify.mjs` (verification scratch files from this pass, same
  can't-delete-on-this-mount constraint as before) -- still needs Andy to
  clear manually along with the items already flagged there.

## Stop condition

Per the unified repair plan: stopping here for Codex review. Not proceeding
to Checkpoint 2.


---

## Addendum -- live browser verification + Codex approval (same session)

Codex approved Checkpoint 1 based on the fix pass above. Separately, Andy pointed out
Claude-in-Chrome can drive his own already-running local Chrome directly -- a mechanism
this session had not tried when it wrote the "verification gap" section above. Used it
against his live `http://localhost:5173/platinum-rose-app/` dev server (already
authenticated, real Supabase data) and confirmed all 3 fixes hold in the actual browser:

- `?tab=analytics` -- renders the full Betting Analytics view (KPI tiles, Performance by
  Bet Type, etc.), zero console errors on a clean page load.
- `?tab=official-picks` -- with no local inbox server running, resolves to the clean
  "Local inbox server isn't running" offline state within a few seconds of navigating
  (previously stuck on "Checking..." indefinitely).
- Dashboard, "Has Prediction Market" filter, live preseason Week 3 slate -- 32 badges,
  every one a genuine same-slate head-to-head match (`TeamA vs. TeamB` matching the
  card's actual matchup exactly), including a live "Seahawks vs. Chiefs" badge correctly
  attached to the actual preseason meeting -- the exact pairing Codex's audit flagged as
  misattributed to the wrong (regular-season) game.
- Bankroll popup (spot check, already-approved fix) -- still shows a real selected game
  ("Las Vegas Raiders @ Houston Texans") and a real bet amount ("$40.00"), no `$NaN`.
  No bet was submitted (modal closed via the X control, not "Add Bet").

**Checkpoint 1 is fully closed.** Next: Checkpoint 2, in a fresh session.
