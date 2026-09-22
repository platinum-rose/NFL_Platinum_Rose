# Handoff: Week 1 Auto-Grading, Burn-Toggle CSS Overflow Fix, Open-Slot Visual State

**Date:** 2026-09-14 (13:37 PT)
**Prepared by:** Claude (Cowork), fresh session, three separate Andy-requested tasks
**Reads:** `handoffs/2026-09-14-0030-claude-ticketboard-permanent-fix-handoff.md` (prior session's burn-minimization fix), `data/official-picks/user-placed-wagers-2026.json` (master ledger, single source of truth)

---

## Task 1: Graded ungraded legs using real ESPN box scores

**What I found first:** the two scripts named in the ask (`scripts/nfl-auto-grade.js`, `scripts/props-auto-grade.js`) do not exist in this repo. The closest existing tool is `scripts/reconcile-settlement.mjs`, but it's hardcoded to grade only the single Melbourne opener event (SF@LAR, event ID `401872657`) and does not generalize to the full Sunday slate. Rather than force-fit that, I wrote fresh grading logic (in `scratch/grading-2026-09-14/`) that reuses the same approach (ESPN `site.api.espn.com/.../summary?event=` boxscore parsing, player/team stat indexing) but works across every game and every market shape actually present in the ledger.

**Reality check on scope:** the task said to focus on "busted/burnt tickets with PENDING legs." In practice, as of today (Monday 2026-09-14, ~1:25pm PT) every Week 1 Sunday game had already gone final except tonight's KC@DEN Monday Nighter, and **no PENDING leg in the ledger belonged to KC@DEN** — so effectively every gradeable leg in the file was gradeable, busted-ticket or not. I graded all of them rather than artificially restricting to a subset that doesn't really exist in this data.

**Method:**
1. Pulled the real Week 1 scoreboard + 14 individual game `summary` box scores from ESPN's public API (all confirmed `STATUS_FINAL`).
2. Built a grading engine covering spread, moneyline, total/alternate-total, and player props (receiving/rushing/passing yards, receptions, carries, passing TDs, INTs, sacks, anytime-TD, field-goals-made), using each leg's `target_stat`/`market` field and a threshold parser that handles both sportsbook `Over/Under X.5` phrasing and DraftKings Predictions `N+` phrasing.
3. Normalized team abbreviation mismatches (`WAS` vs ESPN's `WSH`) and added nickname-text matching for legs with no `team` field.
4. Fuzzy-matched player names for nickname mismatches (ESPN box score lists "Cam Skattebo", ledger says "Cameron Skattebo" — added last-name + first-name-prefix matching).
5. **Results: 102 individual legs graded** across 3 passes (fixing team/name-matching bugs between passes) — every leg where the game was final and the player/stat was found in the box score.
6. **Two legs were left as-is, correctly, per the "don't guess" instruction:** ticket `bet_20260909_bm_738444813_2team` leg 2 — its `status` was already `"UNKNOWN"` in the ledger with a note that the original source log never captured what the pick was; genuinely unknowable, not a parsing gap on my end. And the `market: "open_slot"` leg on `bet_1789085880000_bm_open_parlay_7t` — not a real pick, correctly never graded.

**Ticket-level settlement (once all real legs on a ticket resolved):**
- **16 tickets flipped from `PENDING` to `SETTLED`/`loss`** — each had at least one LOST leg, which busts an all-or-nothing parlay/combo regardless of the other legs. Examples: `bet_20260913_995681422_hybrid_8leg_parlay` (8-leg Bovada player-prop parlay, WON 5 of 8 legs but LOST on Drake London/Christian Watson/Caleb Williams unders — busted, $10 stake lost) and `bet_20260913_dkp_8pick_combo_snf` (DK Predictions SNF combo — Dak/Dart TDs and CeeDee Lamb hit, but the Under 48.5 total and DAL moneyline both lost since DAL@NYG finished 20-28 NYG — busted, promo credit lost).
- **2 round-robin tickets** (`bet_20260913_738634013_bm_round_robin`, 8 picks/4-team combos/70 combinations; `bet_20260913_738647412_bm_compact_round_robin`, 8 picks/2-team combos/28 combinations) — graded every leg, then computed the actual combinatorics: the first only had 2 of 8 selections win (need 4 per combo → C(2,4)=0 winning combinations), the second had 1 of 8 win (need 2 per combo → C(1,2)=0). Both are mathematically guaranteed $0 payouts regardless of the bookmaker's exact per-combo pricing, so I safely settled both `SETTLED`/`loss`. **I did not fabricate a payout figure for any round-robin with surviving combinations** — there weren't any this week, but the settlement script (`scratch/grading-2026-09-14/settle-tickets.mjs`) explicitly leaves a round robin `PENDING` with a progress-note flag if `wonCount >= teams_per_combination`, since exact per-combo payout math needs the bookmaker's actual push-reduction handling, not a guess.
- **1 ticket left `PENDING`, correctly:** `bet_20260909_bm_738444813_2team` — leg 1 (NE@SEA Under 45, graded WON, final total was 23) but leg 2 is the genuinely-unknown pick, so the ticket can't be fully settled either way. Added a progress note explaining why.
- The 7 already-`SETTLED` tickets from before this session were untouched.

**Propagation:** ran `node scripts/sync-placed-wagers-to-bankroll.mjs` after grading — synced all 24 wagers to `public/user-placed-wagers-2026.json` and the Supabase `user_bankroll_bets` table. Did not hand-edit either downstream file.

**Grading code:** left in `scratch/grading-2026-09-14/` (fetch-boxscores.mjs, grade.mjs, settle-tickets.mjs, boxscores.json cache, leg-grading-report.json) for Andy's or a future session's reference — not wired into the toolbox as a reusable script since the ask was to grade this week's backlog, not build permanent tooling. If Andy wants a general-purpose "grade the whole Sunday slate" script going forward, `scratch/grading-2026-09-14/grade.mjs` is a solid starting point to promote into `scripts/`.

---

## Task 2: Fixed the burn-toggle CSS overflow

**Root cause:** `scripts/generate-live-tracker.mjs`'s `.leg-row` is `display:flex; justify-content:space-between`, containing `.leg-left` (icon + kickoff pill + selection text + source tag) and `.leg-right` (pacing badge + price + the 🔥 burn button). Neither `.leg-left` nor the parent `.bet-card` had `min-width:0`/`overflow:hidden`. Flex items default to a minimum width equal to their content's intrinsic size unless told otherwise — so a leg with a long selection string (a common case: full player names + long prop text) forced `.leg-left` wider than the card, and because `.bet-card` had no `overflow:hidden`, that excess rendered past the card's right edge and visually sat on top of the next card in the grid — exactly Andy's report of the burn button being unclickable because it's really the *next card* intercepting the click.

**Fix applied** (`scripts/generate-live-tracker.mjs`):
- `.bet-card`: added `min-width: 0; max-width: 100%; overflow: hidden;`
- `.leg-row`: added `min-width: 0;`
- `.leg-left`: added `min-width: 0; flex: 1 1 auto; overflow: hidden;` plus `.leg-left > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }` so long selection text truncates with an ellipsis instead of forcing the row wider.
- `.leg-right`: added `flex-shrink: 0;` so the pacing badge/price/burn button always keep their full size and never get squeezed or pushed out.
- Did not touch the `toggleLegBurn` click handler or the 🔥 icon/button markup itself.

**Not independently verified in a live browser** — I can't render the page and click things from here. Confirmed via grep that both regenerated HTML outputs (`public/live-tracker-sunday.html`, `docs/tracked-wagers/live-tracker-sunday.html`) contain the new CSS rules and are byte-identical to each other. Andy should reload the tracker and confirm the burn button is now fully inside its own card and clickable, especially on cards with long player-prop selection text.

---

## Task 3: Open-slot legs now render distinctly and don't count toward hits or burns

**How open slots are actually represented:** a leg with `"market": "open_slot"` and `"status": "OPEN"` (confirmed live example: `bet_1789085880000_bm_open_parlay_7t` leg 7, `"selection": "1 OPEN SPOT"`). There is no separate `open_slot`/`is_open` boolean field — the market string and status value together are the signal. I found no other representation of "unfilled combination slot" anywhere in the ledger or generator (grepped for `open_slot`, `open-slot`, `openSlot`, `OPEN SPOT` before writing anything).

**Changes in `scripts/generate-live-tracker.mjs`:**
- Each wager's server-side config (`ticketConfigJs`) now carries an `openSlotLegs: [legKey, ...]` array, and the client picks that up into a global `OPEN_SLOT_LEG_KEYS` Set right after `TICKET_CONFIG` is defined.
- Leg rendering: an open-slot leg now gets its own class `leg-item leg-open-slot`, icon `⬜` (distinct from ✅ hit, ❌ burnt/missed, ⚪ still-pending), badge text "⬜ Open Slot" (new `.badge-pacing-open-slot` style), no `onclick` (isn't wired to `toggleLeg`), and its 🔥 burn button is not rendered at all (there's nothing to burn).
- `toggleLeg()` and `toggleLegBurn()` both no-op immediately if the leg key is in `OPEN_SLOT_LEG_KEYS`, as a second layer of protection in case of stale DOM/state.
- **Count math excludes open slots:** the initial "✅ N Hit • 🔥 N Burnt • N Active" strip label, the `bullet-hits-*` "N/M Hits" badge, `applyHideFulfilledLegs()`'s won/burnt/active tally (used for auto-minimizing fulfilled legs), and `updateAllLegPacingGrades()`'s live win/loss/pacing tally (used for the card's overall temperature badge) all now filter out open-slot legs before counting — an open slot is never counted as a hit, never counted as burnt, and never included in the leg denominator.
- New CSS: `.leg-item.leg-open-slot` (gray border/background, 65% opacity, `cursor:default`) and `.badge-pacing-open-slot` (muted gray/italic badge).

**Not independently verified visually** — again, can't render the page from here. The one live example of an open slot in this week's data (`bet_1789085880000_bm_open_parlay_7t`, which this session also settled as a full loss because two of its other legs lost, so the open slot no longer matters for that ticket's outcome) should show the gray ⬜ state after Andy reloads the tracker; that ticket is a good one to visually spot-check since it's the only real open-slot leg currently in the ledger.

---

## Verification performed

- `node --check scripts/generate-live-tracker.mjs` — clean, both before and after all edits.
- `npx vitest run tests/unit/generateLiveTracker.test.js` — passes (needed `--testTimeout=30000`; the default 5s timeout was too tight for the generator's live network calls, unrelated to my changes — same generator, same timeout margin as before).
- `node scripts/generate-live-tracker.mjs` ran clean, regenerated both `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` — confirmed byte-identical via `diff`.
- Grepped both regenerated HTML files and confirmed `leg-open-slot`, `OPEN_SLOT_LEG_KEYS`, `badge-pacing-open-slot`, and the new `.leg-left`/`.bet-card` overflow CSS are present in both.
- `data/official-picks/user-placed-wagers-2026.json` re-parses as valid JSON (24-element array, same shape as before) after grading.
- `node scripts/sync-placed-wagers-to-bankroll.mjs` completed and reported all 24 wagers synced to Supabase + `public/user-placed-wagers-2026.json`.

## What still needs Andy's eyes in a real browser
1. Reload the Sunday tracker and confirm the 🔥 burn button on every card — especially cards with long player-prop text — is now fully inside its own card border and clickable (Task 2).
2. Confirm the ⬜ open-slot leg on `bet_1789085880000_bm_open_parlay_7t` (now a settled-loss ticket, but the leg itself should still render) actually looks gray/distinct and that its hit/burnt counts elsewhere on the card don't include it (Task 3).
3. Spot-check a couple of the 16 newly-`SETTLED`/loss tickets against Andy's own memory/bookmaker apps, especially the two round robins, to sanity-check the combinatorics reasoning above.
4. General regression pass on hit/unhit and burn/unburn clicking, per the still-open item from the prior 00:30 handoff — not re-verified this session since it wasn't in scope for these three tasks.

## Guardrails honored
- All grading writes went to `data/official-picks/user-placed-wagers-2026.json` only; propagated via the existing `sync-placed-wagers-to-bankroll.mjs` script; never hand-touched `public/user-placed-wagers-2026.json` or Supabase directly.
- Neither generated HTML file was hand-edited; both were produced by running `scripts/generate-live-tracker.mjs`.
- No git commit/push made.
