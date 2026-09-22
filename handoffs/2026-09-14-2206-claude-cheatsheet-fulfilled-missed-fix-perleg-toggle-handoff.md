# Handoff: Player Cheat Sheet — Real Root Cause of the Fulfilled/Missed Bug, Fixed + Per-Leg Hit/Burn Toggle

**Date:** 2026-09-14 ~22:06 UTC, ahead of tonight's KC@DEN
**Prepared by:** Claude (Cowork), fresh session
**Context:** The 21:18 session's "seed `latestTeamStatusMap` at build time" fix was correct as far as it went, but it did **not** fix what Andy actually saw. This session found the real bug.

## Why the 21:18 fix didn't work

That session diagnosed the *team-final* signal correctly (`latestTeamStatusMap` was empty at first paint) and fixed it. But it never looked at what `partitionPlayers()` actually **does** with a final game. That function's real logic:

```js
const isConcludedOrHit = isHit || isFinal;   // <-- the bug
if (isConcludedOrHit) concludedCont.appendChild(card);  // "✅ FULFILLED PLAYERS ... HIT 100% OF PROPS"
```

Any card whose game is over — hit or not — got dumped into a section whose own header literally says **"HIT 100% OF PROPS."** The 21:18 fix made `isFinal` compute correctly for the first time, which actually made the bug *fire* correctly for the first time too: every Sunday player whose prop missed got swept into the "Fulfilled" bucket the moment their game went final. That's bug #2 in Andy's report, and it's the dominant bug — not a stale-data problem, a bucketing-logic problem.

**Terry McLaurin (bug #1) proof:** Ledger `leg_bet_20260913_995680761_afternoon_parlay_2` — Over 50.5 receiving yards, `status: "LOST"`, `actual_stat: 14`. Independently re-pulled WAS@PHI from ESPN (`summary?event=` for that game via `public/schedule.json`) — box score confirms 14 receiving yards, matching the ledger exactly. The ledger's own grading was already correct; nothing wrong there. `latestTeamStatusMap.WAS` in the regenerated HTML is `isCompleted:true`. So under the *old* partition logic, McLaurin's card (final, not hit) landed in the "Fulfilled" bucket exactly like the other 31 — same root cause as bug #2, not a separate bug. "Still shows as unresolved" was Andy's read of a card sitting in a section that claims 100%-hit while showing 14/50.5 — genuinely ambiguous/wrong-looking, which is exactly what a mislabeled bucket produces.

## Scope — independently re-verified, not guessed

Re-implemented the exact client-side matching/partition logic in Python against the regenerated HTML's real embedded data (`athleteLiveStatsMap`, `latestTeamStatusMap`, `TICKET_CONFIG.legsWon`) plus the ledger. Result: **32 players** whose games are final would have landed in the "✅ FULFILLED PLAYERS • HIT 100% OF PROPS" section despite not hitting (all or some of their props), vs **16** who genuinely hit everything. Zero players are stuck in the "still live" bucket now that today's Sunday slate is final (confirmed: `Live: 0`).

Spot-checked 3 players by pulling live ESPN box scores directly (not the ledger) for independent confirmation:
- **Terry McLaurin** (WAS@PHI, event 401872660... actually event id for that game, see schedule.json): 14 rec yds — matches ledger, LOST vs 50.5 line.
- **Josh Allen** (BUF@HOU, event 401872660): rushing line `['CAR','YDS','AVG','TD','LONG'] = ['6','23','3.8','2','21']` → 23 rush yds vs ledger's `actual_stat: 23` — matches, LOST vs 30.5 line.
- **CeeDee Lamb** (DAL@NYG, event 401872930): receiving line `['REC','YDS',...] = ['5','44',...]` → 44 rec yds vs ledger's `actual_stat: 44` — matches, LOST vs 80 line.

All three: ledger was already right; the display bug was 100% in `scripts/generate-live-tracker.mjs`'s partition/render logic, never in the data.

## The fix (`scripts/generate-live-tracker.mjs` only)

1. **`partitionPlayers()`** — split the single `isHit || isFinal` bucket into two: cards that actually hit every prop still go to `#concluded-players-container` under "✅ FULFILLED PLAYERS • HIT 100% OF PROPS"; cards whose game is final but did **not** hit everything now go to a new `#missed-players-container` under a new red-styled "❌ MISSED PROPS — GAME FINAL • DID NOT HIT" section (new `#missed-players-section-wrap`, new CSS `.missed-divider-*`). Cards still in progress stay in the live section as before. `filterAndSortPlayers()`'s sort-reinsertion step was extended to also handle the new container so custom/gametime sort order applies there too.
2. **`renderPlayerCheatSheetStats()`** — per-leg `isHit`/`isLegChecked` now also respects `burntLegsState` (a leg manually marked 🔥 Burnt can no longer be miscounted as hit via the `currentVal >= target` fallback), and each `.sub-gauge-item` gets `sg-hit`/`sg-burnt` classes for the new per-leg visual state.

## New feature: per-leg Hit/Burn toggle on Player Cheat Sheet cards

Each player card's `.player-props-detail` used to render a plain read-only progress row per prop. It now renders each leg as its own clickable row (`.sub-gauge-item`), wired to the **exact same** `toggleLeg(legKey, ticketId)` / `toggleLegBurn(legKey, ticketId, event)` functions, the same shared `checkedState` / `burntLegsState` localStorage-backed globals, and the same `🔥` burn-button pattern already used on the Tickets tab — no parallel toggle system. Clicking a leg row toggles Hit; the 🔥 button (event-stopped so it doesn't also toggle Hit) toggles Burnt; both immediately re-run `renderPlayerCheatSheetStats(latestTeamStatusMap)` so the card, its badge, and its section placement update live. `data-leg-key`/`data-ticket-id` were added to each `playerPropsMap` entry (server-side, from `bet.id` and `leg.key`) so every leg is individually addressable — required because a player can carry multiple distinct props across different tickets (e.g. a receiving-yards leg on one parlay and an anytime-TD leg on another). Verified in the regenerated HTML: Jaxon Smith-Njigba (2 legs — 6+ Receptions on one ticket, Anytime TD on another) now renders two separate `.sub-gauge-item` rows, each with its own `toggleLeg`/`toggleLegBurn` wiring and its own 🔥 button (`pbtn-burn-leg-<key>`, deliberately prefixed differently from the Tickets tab's `btn-burn-leg-<key>` to avoid duplicate-DOM-id collisions between the two tabs sharing the same leg keys).

## Verification performed

- `node --check scripts/generate-live-tracker.mjs` clean after every edit round.
- `node scripts/generate-live-tracker.mjs` ran clean; `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` are byte-identical (`diff` = 0 lines).
- Re-implemented the render/partition logic in Python against the real embedded `athleteLiveStatsMap`/`latestTeamStatusMap`/`TICKET_CONFIG` from the regenerated HTML: 16 Fulfilled, 32 Missed, 0 Live. `Terry McLaurin` confirmed in the Missed bucket, not Fulfilled and not stuck live.
- Grepped the regenerated HTML: `MISSED PROPS — GAME FINAL (` and `FULFILLED PLAYERS (` both present as distinct section headers; McLaurin's `.sub-gauge-item` carries the correct `data-leg-key`/`data-ticket-id`/`toggleLeg(...)` wiring; Jaxon Smith-Njigba's card carries two independent `.sub-gauge-item` rows for his two separate props (receptions leg on `bet_20260909_dkp_ne_sea_w1_combo` leg 4, anytime-TD leg 5 on the same ticket — but structurally supports legs from different tickets identically since `ticketId` comes from each leg's own `bet.id`).
- Independently re-pulled live ESPN box scores (not the ledger) for McLaurin, Josh Allen, and CeeDee Lamb — all three match the ledger's `actual_stat` exactly, confirming the ledger's own grading (from the 13:37 session) was never the problem.
- Did **not** modify `data/official-picks/user-placed-wagers-2026.json` — every spot-checked value was already correct, so `sync-placed-wagers-to-bankroll.mjs` was not run (guardrail: only run it if the ledger is touched).
- No git commit/push made.

## What still needs Andy's eyes in a real browser

1. Confirm visually that the new "❌ MISSED PROPS — GAME FINAL" section appears below "✅ FULFILLED PLAYERS" with ~32 red cards, and that the green section now only holds genuine 100%-hit players (~16).
2. Click a leg's 🔥 burn button on a multi-leg player card (e.g. Jaxon Smith-Njigba) and confirm it turns that one row red without affecting the card's other leg, and that the card re-partitions correctly.
3. `data-target` for a leg with a 0 or negative line (rare, but exists for some `anytime_touchdown` markets encoded as `0.5`) — not observed as a problem in this data set, but worth a glance if a future prop uses a literal `0` line, since `currentVal >= 0` would always read as hit.
4. The "Hide Fulfilled" checkbox still also hides the new Missed section when checked (inherited behavior, not changed this session) — confirm that's the UX Andy wants, or ask if Missed should have its own hide toggle.

## Guardrails honored

- All edits in `scripts/generate-live-tracker.mjs` only; both generated HTML files produced solely by running the generator.
- `data/official-picks/user-placed-wagers-2026.json` read-only this session (three independent ESPN re-checks all confirmed it was already correct).
- No git commit/push made.
