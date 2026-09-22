# Handoff: Sunday Tracker (Ticketboard) — Permanent Fix Applied

**Date:** 2026-09-14 (00:30, following the 2026-09-13 23:30 diagnostic scan)
**Prepared by:** Claude (Cowork), fresh session — actual code changes made, not just diagnosis
**Reads:** `handoffs/2026-09-13-2330-claude-ticketboard-diagnostic-scan-and-fix-handoff.md` (my brief), the two Antigravity handoffs from earlier 2026-09-13, and `docs/specs/TICKETBOARD_PARLAY_CARD_AND_LEG_MINIMIZATION_SPEC_2026.md`

This is the fourth write-up of this bug today. Read §5 ("What still needs a human") before telling anyone this is 100% done — it is fixed as far as static inspection can prove, but nobody has clicked through it in a live browser yet.

---

## 1. Root cause (two independent problems, not one)

### 1a. Confirmed code bug: `applyHideFulfilledLegs()` default-minimize logic (fixed)
`scripts/generate-live-tracker.mjs`, line 6373 (pre-fix). The spec's "Bug 1" was real and still present:

```js
// BEFORE (buggy — only round-robin cards auto-minimized burnt legs)
const defaultMin = (config.isRoundRobin && burntCount > 0 && cardMinLegsState[tId] === undefined) ? true : hideFulfilledLegs;
```

Tracing the interaction with the already-fixed `toggleLegBurn()` (spec's "Bug 2", confirmed already live at line 3752) showed the *interactive click* path was actually fine — `toggleLegBurn` sets `cardMinLegsState[ticketId] = true` immediately on first burn, before `applyHideFulfilledLegs()` runs, for every card type, so the `isRoundRobin` restriction never even gets consulted on that path. The bug only bites on **page load/hydration**: if `burntLegsState` (key `sunday_burnt_legs_week_1`) has entries from an earlier session but `cardMinLegsState` (key `sunday_card_min_legs_week_1`) doesn't yet have an entry for that ticket — exactly the situation you'd expect after today's history got partially reset, since these are two independently-persisted localStorage keys that can desync — a **standard (non-round-robin) parlay with burnt legs stayed expanded instead of auto-collapsing**, while round-robin cards behaved correctly. This matches Andy's literal complaint.

**Fix applied** (matches the spec's own verified Step 2, checked directly against the real file rather than trusted blind):
```js
// AFTER
const defaultMin = (burntCount > 0 && cardMinLegsState[tId] === undefined) ? true : hideFulfilledLegs;
```

### 1b. Newly found, likely bigger contributor: inconsistent tracker launch origins (fixed one instance, flagged the rest)
This was not in the spec at all — it's what the diagnostic scan's §3.5 ("dual-origin localStorage") was reaching for, and the real mechanism is worse than a simple GitHub-Pages-vs-local split. There are (at least) **three different ways the Sunday Tracker gets opened**, each landing on a different browser origin, each with its own empty `localStorage`:

| Launch path | How it's triggered | URL it opens |
|---|---|---|
| Toolbox App "Launch Gameday" button | `scripts/toolbox-app-server.mjs`, `runTask('launch-gameday')` | **was hardcoded** `http://localhost:5180/live-tracker-sunday.html?tab=supercontest` |
| Toolbox App server itself | `npm run app` / desktop shortcut | actually listens on `serverPort`, **default 4567** (`DEFAULT_PORT = 4567`), or whatever `--port` was passed |
| Toolbox CLI menu / `--launch-tracker sunday` | `scripts/toolbox.mjs`, `launchInBrowser('public/live-tracker-sunday.html')` | opens the file directly as a **local path**, which browsers treat as a `file://` origin — distinct from any `http://` origin |
| GitHub Pages copy | `.github/workflows/deploy.yml`, deploys `docs/` on CI success after pushes to `main` | `https://<user>.github.io/<repo>/...` — a fourth, remote origin, and only updates after CI runs, so it's never "live" same-second as clicks made locally |

The concrete, verifiable bug: **the "Launch Gameday" button's URL (port 5180) never matched the server's own actual port (`serverPort`, default 4567).** The Melbourne tracker launcher two lines below it correctly uses `` `http://127.0.0.1:${serverPort}/public/live-tracker-melbourne.html` `` — Sunday's was never updated to match when the server's default port was set/changed, or copy-pasted from a stale earlier dev session that happened to run on 5180. Whatever was reachable at `localhost:5180` at any given moment (an old lingering server process from a previous session, nothing at all, or — per the 1620/1650 Antigravity handoffs, which both say "Toolbox Server: Running in background serving `http://localhost:5180/...`" — apparently sometimes a real server really was on 5180) is **not guaranteed to be the same origin as the one Andy's browser tab had accumulated history on**. Reloading the button, restarting the machine, or the background 5180 process dying and something else being reachable there would silently swap origins and wipe every `localStorage` key back to empty — reproducing "reverted 10 versions back" with zero JS logic bugs involved.

**Fix applied:**
```js
// BEFORE
const sunUrl = 'http://localhost:5180/live-tracker-sunday.html?tab=supercontest';
// AFTER
const sunUrl = `http://127.0.0.1:${serverPort}/live-tracker-sunday.html?tab=supercontest`;
```
This makes the Sunday launcher consistent with the Melbourne launcher and with the server's own actual listening port, whatever that is at runtime.

**Not fixed (flagged, not touched, needs a decision from Andy):** `scripts/toolbox.mjs`'s CLI menu option ("Launch Sunday Tracker in Browser") still opens via `file://` — a different origin than the Toolbox App's `http://127.0.0.1:<port>` copy. I did not change this because (a) it's a legitimate standalone-launch path when the app server isn't running at all, so forcing it to an HTTP URL would break that use case with no way for me to verify in a live browser, and (b) I have no way to ask which one Andy actually uses day-to-day. **Recommendation: Andy should pick exactly one launch method going forward** — the Toolbox App's "Launch Gameday" button is now the more reliable one (fixed port bug) — and stop using the CLI's `file://` launcher and the GitHub Pages `docs/` copy for live interactive tracking. The `docs/` copy should be treated as a passive remote-viewing mirror only, never a tab where he clicks hits/burns.

I could not find any `<a href>` or `location.href`/`window.open` inside the generated HTML itself pointing at the other copy or another origin — grepped the whole file for `github.io`, `localhost`, and `https://` link targets; the only external references are ESPN/Yahoo API and CDN asset URLs. So there was nothing to fix *inside* `generate-live-tracker.mjs`'s own output for "internal links" — the actual cross-origin risk lives entirely in the external launcher scripts, which is why the fix above is in `toolbox-app-server.mjs`, not the generator.

---

## 2. Bug 3 (ESPN poll corrupting manual overrides) — ruled out, with evidence

Traced `fetchLiveScoreboard()` (line 7747) → `updateAllLegPacingGrades()` (line 5751) → DOM mutation end-to-end:

- `fetchLiveScoreboard()` only calls `fetchSummaryForEvent()`, `updateLeftSidebarScoreboard()`, `updateSuperContestLiveScores()`, `updateFantasyLiveScores()`, and `updateAllLegPacingGrades()`. None of these touch `checkedState` or `burntLegsState`.
- `updateAllLegPacingGrades()` (lines 5751–6240) reads `burntLegsState[legKey]`/`checkedState[legKey]` and the DOM's existing `leg-burnt`/`checked`/`leg-missed` classes, but only ever **reflects** them (adds `pace-red`/`leg-burnt` class and a "❌ BURNT" badge *if* `isBurnt` is already true) — grepped the full function body for every `classList.add(...)`/`checked`/`leg-missed`/`render(` occurrence and confirmed it never writes `checked` or `leg-missed` classes, never writes to `checkedState`/`burntLegsState`, and never calls `render()`. No recursion, no override-clobbering.
- `fetchSummaryForEvent()` (line 4687) only populates `athleteInjuryMap` and `athleteLiveStatsMap` — pure read-side data used later by pacing math, never touches manual-state objects either.

Bug 3 as described in the spec is not present at the cited location or anywhere in the current call chain. This matches the diagnostic scan's "not reproduced" finding — now confirmed by an actual trace rather than a grep.

---

## 3. Tab consistency audit (Andy's "all tabs, same source" requirement)

Checked for shadow/duplicate state: searched all top-level `let ... State`/`...Map` declarations in the file. There is exactly **one** `checkedState`, one `burntLegsState`, one `athleteLiveStatsMap`, one `athleteInjuryMap`, and exactly one `render()` function (line 7234) and one `showTab()` (line 3846). `showTab()` only toggles `display` on pre-rendered wraps (`tab-players-wrap`, `tab-supercontest-wrap`, etc.) and calls filter/sort/partition functions on content `render()` already built from the shared state — it does not recompute hit/burnt status from a second source. `ffKeptState`/`ffLeagueCollapseState`/`ffCardCollapseState` are Fantasy-tab-only UI state (kept/collapsed), not duplicate grading state, and are legitimately scoped to that tab.

**Verified via static inspection: Players and SuperContest tabs read the same `checkedState`/`burntLegsState`/`athleteLiveStatsMap` as Tickets — no shadow copies exist.** The Yahoo Fantasy roster feed (`refreshYahooFantasyRosters()`, ~line 5491) remains wired only into the Fantasy tab, as before — extending it into Tickets-tab leg pacing is a feature request, not a bug, per the original diagnostic scan's §4.6, and out of scope here.

---

## 4. Corrected localStorage key inventory (ground truth, read directly from `scripts/generate-live-tracker.mjs` lines 3543–3563 — do not use the spec doc's table, it has multiple wrong key strings)

All keys are per-week (`_week_${week}` suffix, e.g. `_week_1`):

| Constant name | Actual key string | Purpose |
|---|---|---|
| `STORAGE_KEY` | `sunday_tracker_state_week_N` | `checkedState` (leg "hit" checkmarks) — **not a dedicated `CHECKED_LEGS_KEY`, contrary to spec** |
| `SPLITS_KEY` | `sunday_splits_week_N` | Alejandro split state |
| `BURNS_KEY` | `sunday_burns_week_N` | `manualBurns` (whole-ticket manual burn) — spec calls this `BURNT_KEY` with wrong string |
| `BURNT_LEGS_KEY` | `sunday_burnt_legs_week_N` | `burntLegsState` (per-leg burn) |
| `HIDE_BURNT_KEY` | `sunday_hide_burnt_week_N` | global hide-burnt toggle |
| `CASHED_KEY` | `sunday_cashed_state_week_N` | `manualCashed` — spec has wrong string here too |
| `HIDE_CASHED_KEY` | `sunday_hide_cashed_week_N` | global hide-cashed toggle |
| `HIDE_FULFILLED_KEY` | `sunday_hide_fulfilled_week_N` | global hide-fulfilled (ticket-level) toggle |
| `ARCHIVE_KEY` | `sunday_settled_archive_week_N` | settled/archived tickets |
| `ORDER_KEY` | `sunday_card_order_week_N` | card drag order — spec says `sunday_cards_order` (plural), wrong |
| `COLLAPSED_KEY` | `sunday_card_collapsed_week_N` | collapsed-card state |
| `PLAYER_ORDER_KEY` | `sunday_player_order_week_N` | Players tab order |
| `PLAYER_COLLAPSED_KEY` | `sunday_player_collapsed_week_N` | Players tab collapse |
| `PLAYER_SORT_KEY` | `sunday_player_sort_week_N` | Players tab sort mode |
| `AUTO_COLLAPSE_KEY` | `sunday_auto_collapse_week_N` | auto-collapse preference |
| `SPLIT_HISTORY_KEY` | `sunday_split_history_week_N` | split history log |
| `BOARD_CLEARED_KEY` | `sunday_board_cleared_week_N` | board-cleared flag |
| `CUSTOM_SLIPS_KEY` | `sunday_custom_slips_week_N` | manually-added slips |
| `ACTIVE_TAB_KEY` | `sunday_active_tab_week_N` | which tab was open |
| `HIDE_FULFILLED_LEGS_KEY` | `sunday_hide_fulfilled_legs_week_N` | global hide-fulfilled (leg-level) toggle |
| `CARD_MIN_LEGS_KEY` | `sunday_card_min_legs_week_N` | `cardMinLegsState` — the key at the center of Bug 1 |
| `SC_PICKS_KEY` | `sunday_supercontest_picks_week_N` | SuperContest picks |
| `SC_LOCKED_CARD_KEY` | `sunday_supercontest_locked_card_week_N` | SuperContest locked card |

20 keys confirmed by direct grep of the constant declarations — matches the diagnostic scan's count. **All of these are per-origin.** If Andy ever lands on a different origin (see §1b), every single one of these reads back empty, which is fully sufficient on its own to explain "10 versions of history disappeared" — no JS logic bug required.

---

## 5. What's actually verified vs. what still needs a human click-through

**Verified via static inspection + automated test (concrete evidence, not claims):**
- `node --check` passes clean on both edited files (no syntax errors introduced).
- `npx vitest run tests/unit/generateLiveTracker.test.js` — 1/1 passing, post-edit.
- `node scripts/generate-live-tracker.mjs` ran clean, rewrote both `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` (confirmed via `ls -la` timestamps updated to the regeneration time, both files byte-identical to each other via `diff`).
- Grepped the regenerated output HTML and confirmed the old buggy pattern (`config.isRoundRobin && burntCount > 0`) is gone and the fixed line (`(burntCount > 0 && cardMinLegsState[tId] === undefined)`) is present in both copies.
- Confirmed the already-fixed `toggleLegBurn()` card-min-state code is still intact post-regeneration.
- Traced the full ESPN-poll call chain by reading the actual function bodies (not grep-only) and ruled out Bug 3 with specific line evidence (§2).
- Confirmed via `let ... State =` / `Map =` declaration audit that Tickets/Players/SuperContest share one state layer (§3).

**NOT verified — genuinely needs Andy, in a real browser, before anyone calls this fixed a fifth time:**
1. **Click a leg into "burnt" on a reloaded page** (not a fresh session — reload with pre-existing `burntLegsState` from localStorage) on a **standard, non-round-robin** parlay and confirm it now auto-minimizes on load. This is the exact scenario the fix targets and the one thing static analysis cannot fully prove, since it depends on real localStorage content and real DOM timing.
2. **Click "Launch Gameday" in the Toolbox App** after this fix and confirm the browser actually lands on the app server's real port with prior `localStorage` intact (I cannot start a browser or the Node server and click through it from here).
3. Decide, and tell whoever operates the tooling, which single launch path is canonical going forward, and stop using the others for live tracking during games — I can't make that decision for Andy, only flag it (§1b).
4. General regression pass: hit/unhit legs, burn/unburn, round-robin combination payout recompute, and tab-switching, on a live loaded board with real Sunday data — the automated test only checks that generation succeeds and key elements exist, it does not simulate clicks.

---

## 6. Files changed

- `scripts/generate-live-tracker.mjs` — line 6373, `applyHideFulfilledLegs()`: removed the `config.isRoundRobin &&` restriction from `defaultMin` so standard parlays with burnt legs also auto-minimize on load, matching round-robin behavior and the spec's own verified fix.
- `scripts/toolbox-app-server.mjs` — line 335, `runTask('launch-gameday'/'launch-sunday')`: replaced hardcoded stale port `5180` with the server's actual `serverPort` variable, matching the pattern already used for the Melbourne tracker launcher two lines below it.
- `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` — regenerated via `node scripts/generate-live-tracker.mjs`, not hand-edited.

## 7. Guardrails honored
- Did not touch `data/official-picks/user-placed-wagers-2026.json` or `scripts/sync-placed-wagers-to-bankroll.mjs`.
- Did not hand-edit either generated HTML file directly — both were produced by running the generator.
- No git commit/push made (consistent with the standing "no commit without Andy's explicit approval" instruction from the prior two Antigravity handoffs — nothing in this session's instructions asked for one either).
