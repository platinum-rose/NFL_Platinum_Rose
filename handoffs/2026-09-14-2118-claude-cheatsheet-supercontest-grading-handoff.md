# Handoff: Player Cheat Sheet Grading & SuperContest Settled-Card Collapse

**Date:** 2026-09-14 (~21:18 UTC / mid-afternoon PT), ahead of tonight's KC@DEN Monday Nighter (kickoff 2026-09-15T00:15Z, confirmed via `public/schedule.json`)
**Prepared by:** Claude (Cowork), fresh session, two Andy-requested tasks
**Reads:** `handoffs/2026-09-14-1337-claude-grading-css-overflow-open-slot-handoff.md` (the 102-leg grading session), `handoffs/2026-09-14-0030-claude-ticketboard-permanent-fix-handoff.md` (localStorage key inventory, single-source-of-truth confirmation), `data/official-picks/user-placed-wagers-2026.json` (read-only, not modified this session)

---

## Task 1: Player Cheat Sheet — root cause and fix

**What "Players" tab actually is:** confirmed by reading `showTab()`/the tab nav markup — the "Players" tab (`tab-players-wrap`) *is* the Player Cheat Sheet (⚡ Player Cheat Sheet & Gauges). It is rendered by a block at `scripts/generate-live-tracker.mjs` around line 2780 (`.player-box-card.player-card-block`) and updated client-side by `renderPlayerCheatSheetStats()`. `renderFantasyPlayerStats`/`renderFantasyStatProgressBars` (named in Andy's paraphrase) actually belong to the separate **Fantasy** tab (`.ff-player-card` elements) — a different tab entirely, confirmed by grepping which DOM class each function queries.

**Root cause (not a data-grading gap — the 102 legs graded in the prior session were already correct in the ledger):** `renderPlayerCheatSheetStats()` correctly computes each prop's hit/miss from `athleteLiveStatsMap` (server-embedded real box-score stats, already working) and `checkedState` (seeded from each ticket's `legsWon`, already working). But whether a card counts as **"Final"** — the flag that drives `partitionPlayers()` moving a card out of the live view into the "✅ Fulfilled Players" section — came from `teamStatusMap`, a variable initialized to `let latestTeamStatusMap = {};` (empty) and only ever populated later by an async client-side ESPN scoreboard poll (`fetchLiveScoreboard()`). On the very first render — which is when `partitionPlayers()` first runs at page load — that map was always empty, so **every player card, including ones whose games finished a full day ago, read as not-final** and stayed in the "live/active" section until (and unless) a live poll happened to succeed in the browser. That's the literal "needs to be cleaned up and cleared out" symptom: nothing was wrong with the grades, the sheet just never learned a game was over until an unreliable runtime network call succeeded.

**Fix (`scripts/generate-live-tracker.mjs`):**
- `loadConcludedGameStats()` (already fetches the ESPN scoreboard at build time to discover box scores) now also builds a `teamStatusMap` from that same fetch — the identical shape (`isCompleted`, `isLive`, `statusDesc`, etc.) the client's own live-poll function produces — and returns it alongside the existing `athleteStatsMap`/`athleteInjuriesMap`.
- `generateLiveTracker()` captures this as `initialTeamStatusMap` and seeds `let latestTeamStatusMap = ${JSON.stringify(initialTeamStatusMap)};` instead of `{}`.
- Result: `renderPlayerCheatSheetStats()`'s very first call (already wired into the init sequence) now knows immediately, from real data embedded at generation time, which games are Final — no dependency on a live poll succeeding first. Verified by extracting `latestTeamStatusMap` from the regenerated HTML: 32 teams present, `DAL` correctly `isCompleted:true` (`Final: DAL 20 - NYG 28`), `KC`/`DEN` correctly `isCompleted:false` (tonight's game, not yet started).
- This also benefits the Fantasy tab for free, since `renderFantasyPlayerStats()` takes the same `teamStatusMap` — same single source of truth, consistent with the prior session's confirmed architecture.
- **I did not touch** `applyHideFulfilledLegs()`, `checkedState`/`legsWon` seeding, or the existing `partitionPlayers()`/`collapseFulfilledPlayers()` logic — that plumbing was already correct and didn't need changing, it just never had good enough initial data to act on.

---

## Task 2: SuperContest board — root cause and fix

**Root cause:** `scMatrixList` (the 16-game SuperContest matrix, built once at generation time) had `isConcluded` **hardcoded to exactly two games** — `SEA/NE` and `LAR/SF`, the Thursday Melbourne openers — left over from an earlier week. Every one of Sunday's 14 now-finished games was permanently `isConcluded: false` in the generated HTML, and the "My Official 5-Pick Card" / Alternates cards had their cover badges hardcoded to `'🕒 Upcoming'` (one more hardcoded exception for `SF`). Confirmed by reading the literal code — this was a stale allowlist, not a computed value.

Separately, the matrix **table's** "concluded" branch rendered a static score/badge with **no element `id`** — meaning even if `isConcluded` had been correct, `updateSuperContestLiveScores()` (the live-poll function) could never reach those DOM nodes to update them, and the badge was hardcoded green (`sc-cover-covering`) regardless of whether the pick actually won or lost. Confirmed via curl that ESPN's scoreboard endpoint *does* still return the full Week-1 slate (all Sunday games `STATUS_FINAL` plus tonight's `KC@DEN` scheduled) even now that it's Monday — so a live poll reaching this endpoint would have real data available; the bug was that nothing in the generated page was wired to actually use it correctly for settled games.

**Fix (`scripts/generate-live-tracker.mjs`):**
- `loadConcludedGameStats()` also now builds `teamScoreMap` (per-team abbreviation → own score, opponent score, opponent abbrev, isCompleted), normalizing the `WSH`→`WAS` / `JAC`→`JAX` mismatches the codebase already knows about elsewhere.
- `scMatrixList`'s `isConcluded`/`finalScore`/`finalResult` are now computed for real, per game, from that data (ATS margin math matching the client's own existing formula) instead of the 2-team hardcode. The matrix table's "concluded" branch now uses the correct win/loss/push class (`sc-cover-covering`/`sc-cover-atrisk`/`sc-cover-push`) instead of an unconditional green badge.
- A derived `scResultByTeam` map (win/loss/push per team, built from the now-correct matrix) feeds the Top-5 card and Alternates card badges — both the initial server-rendered markup and the two client-side rebuild paths (locked-card / unlocked variants, used when Andy toggles picks) — replacing the hardcoded `'Upcoming'`/`SF`-special-case text. Single source of truth, not three places computing (or failing to compute) the same thing independently.
- **New: collapsible Red/Green settled cards**, matching the Tickets-tab cashed/burnt pattern Andy asked for. Added `.sc-settled-win` / `.sc-settled-loss` / `.sc-settled-push` CSS (same green/red/amber palette already used for `.bet-card.cashed`/`.burnt`), plus a `.collapsed` state that hides the middle "market intelligence" and "rationale" blocks and keeps only the header + live score/cover badge visible — same collapse pattern as `.player-card-block.collapsed`. Each card auto-collapses once settled (default-on-first-load, same "respect an explicit user override, otherwise auto-collapse" rule `applyHideFulfilledLegs()` already uses for Tickets-tab legs) via a new `applySuperContestSettledCards()` function, called at page-load hydration, after every SuperContest-pick re-render, and at the end of `updateSuperContestLiveScores()` (so tonight's KC@DEN pick, if it's part of Andy's card, will auto-collapse red/green the moment that game goes final too). Clicking a card's score/badge row toggles it back open — new `toggleScCardCollapse()`, persisted to a new localStorage key `sunday_sc_card_collapse_week_N` (`SC_CARD_COLLAPSE_KEY`), following the exact same key-naming and per-week-suffix convention as the other 22 keys catalogued in the 00:30 handoff.
- Verified in the regenerated HTML: 9 SuperContest cards now carry `data-sc-settled="true"` with real per-team `win`/`loss` results (sample: 7 losses, 2 wins) instead of the old 1-team stub.

---

## Verification performed

- `node --check scripts/generate-live-tracker.mjs` — clean, after every edit round.
- `node scripts/generate-live-tracker.mjs` — completed successfully, wrote both `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`; confirmed byte-identical via `diff` (0 lines of diff).
- Grepped both regenerated HTML files for the new markers (`applySuperContestSettledCards`, `SC_RESULT_BY_TEAM`, `sc-settled-win`, `toggleScCardCollapse`, the fixed `renderPlayerCheatSheetStats(latestTeamStatusMap)` seeding) — all present, identical counts in both files.
- Extracted and parsed the embedded `latestTeamStatusMap` and `data-sc-result` attributes directly from the generated HTML (not just grep-for-presence) to confirm the *values* are correct, not just that the code ran: 32 real teams with correct Final/not-Final status; 9 real settled SuperContest picks with a believable win/loss mix.
- **`npx vitest run tests/unit/generateLiveTracker.test.js` could NOT be completed this session** — it made real ESPN network calls (consistent with the prior session's note that the default timeout is too tight) and did not finish even at a 60s test timeout plus ~3 minutes of wall-clock waiting across two attempts, including a background+poll attempt. This is a tooling/time-budget limitation of this remote session, not a result — I did not get a pass or fail signal from it. `node scripts/generate-live-tracker.mjs` running clean end-to-end (the same code path the test exercises) is the strongest signal I have that generation itself isn't broken.
- Did **not** touch `data/official-picks/user-placed-wagers-2026.json` — no ledger writes were needed for either task, so `sync-placed-wagers-to-bankroll.mjs` was not run.
- No git commit/push made.

## What still needs Andy's eyes in a real browser before kickoff

1. **Highest priority — I cannot verify this at all from here:** open the Players tab and confirm Sunday's now-finished-game players have actually dropped into the "✅ Fulfilled Players" section (or show a clear ❌ Final/missed state if they busted) without needing a page refresh or waiting on a live poll. This is the core of Task 1 and depends on real browser DOM behavior I can't observe.
2. Open the SuperContest tab and confirm the Top-5/Alternates cards for Sunday's picks are showing red or green (not the old gray "Upcoming") and are visually collapsed to just their header + score line. Click one to confirm it expands/collapses correctly and the state survives a refresh.
3. Spot-check 2–3 of the 9 now-"settled" SuperContest picks against Andy's own line memory — I computed win/loss with the standard ATS margin formula (`(favScore + line) - dogScore`) already used elsewhere in this file, but did not independently re-verify against a sportsbook.
4. Tonight's KC@DEN game is the one live test that will exercise the *dynamic* (not build-time) path for both fixes — confirm after it goes final that both the relevant player-prop cards and any SuperContest picks on those two teams correctly flip to graded/collapsed without a manual refresh, since `updateSuperContestLiveScores()`'s live-poll path was extended today but only build-time-tested.
5. `public/schedule.json` on disk is dated Sep 11 and still shows every Sunday game as `status: "pre"` with 0-0 scores — stale, but *not* the cause of either bug fixed today (both fixes bypass it entirely and use a fresh ESPN scoreboard fetch at generation time instead). Worth a separate look at whatever is supposed to keep that file current, since other code paths that do trust it directly could be quietly wrong the same way these two were.

## Guardrails honored

- All edits went into `scripts/generate-live-tracker.mjs` only; both generated HTML files were produced solely by running the generator, never hand-edited.
- `data/official-picks/user-placed-wagers-2026.json` was read for context but not written to.
- No git commit/push made.
