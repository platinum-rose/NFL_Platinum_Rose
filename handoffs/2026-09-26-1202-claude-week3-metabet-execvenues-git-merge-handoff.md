# Week 3 — Metabet Wired, Execution Venues Corrected, Git Fork Merged (2026-09-26 12:02 PT)

## Session window / git state
- HEAD: `b7ce30c` (merge commit resolving the `fc1b7b2` sibling-commit fork
  with `origin/main`'s `bf60e47` — see "Git fork resolved" below).
- Pushed to `origin/main`. `git rev-list --left-right --count origin/main...HEAD`
  = `0  0` at time of writing — fully in sync, first push of this fork/session.
- Picking up from `handoffs/2026-09-26-1057-claude-week3-saturday-intel-health-handoff.md`.

## What happened this session

1. **Ticket 739211245's 2 open spots.** Reviewed the ticket, confirmed no
   other weekend ticket was placed, logged a recommendation (PHI ML / BAL ML)
   into the wagers ledger's `progress_notes` — proposal only, not placed.
   Still awaiting Andy's actual fill + pasted-slip confirmation.

2. **Recommendation ledger rebuilt.** The old repo-file ledger was gone
   (D1-D12 history unrecoverable). Rebuilt fresh as a claude.ai Project doc:
   `claude/recommendation-ledger-2026.md` in Project "dev" — NOT a repo file.
   Future sessions should `project_read`/update it there, not recreate it.

3. **Friday cadence reviewed**, cross-validated against manual injury
   sourcing; found (not fixed) a stale-game bug in the player-props-intel
   dossier generator.

4. **Diagnostics "Run Now" buttons added** for Podcast/Article/Twitter
   Accounts/Futures sources (commit `d3b8aa7`). Root-cause bug found and
   fixed along the way: `checkLatestFileInDirSource()` and
   `checkFreshestOfCandidates()` never propagated `runTask` into their
   returned objects, so no DIR- or MULTI-type diagnostic source could ever
   have shown a button regardless of config.

5. **Futures-refresh 404s investigated** (Andy: "Futures Intel seems to
   have failed") — confirmed NOT a bug in the button wiring. TheOddsAPI's
   live NFL sport-key catalog only has 3 entries
   (`americanfootball_nfl`, `_preseason`, `_super_bowl_winner`); the other
   14 markets `agents/futures-odds-ingest.js` requests don't exist in the
   catalog right now. **Separately flagged, still unresolved: that API key
   had only 11 requests remaining** at last check.

6. **Futures-ingestion inventory** done (7+ scripts/agents catalogued) to
   answer "what other methods do we have." Landed on
   `agents/metabet-futures-ingest.js` (free, unauthenticated, ~30 books incl.
   DraftKings/FanDuel/Kalshi/Polymarket/Fanatics-adjacent codes) as the
   standout dormant candidate — last run 2026-08-29, never wired anywhere.

7. **Andy's correction: DraftKings, FanDuel, and Kalshi are no longer
   context-only — they're placeable.** Handled DK/FD (commit `44c30bf`):
   moved into `SPORTSBOOK_VENUES` in `src/lib/executionVenues.js`
   (`access: 'direct'`), `MARKET_CONTEXT_ONLY_VENUES` is now `[]` (kept
   exported, not deleted), both LLM prompt-sentence builders updated to
   skip the "never recommend a ___ price" clause gracefully when that list
   is empty. Also fixed a stale comment in `agents/portfolio-dossier.js`
   and a drift bug in `agents/lib/board-validate.js` (its hand-duplicated
   `DEFAULT_BETTABLE_BOOKS` string was one migration behind).
   **Kalshi was deliberately NOT touched** — `executionVenues.js`'s own
   long-standing comment says prediction-market execution eligibility
   needs a separate bid/ask/fee-aware check that's never been built, and
   flipping Kalshi to a plain sportsbook would remove that guardrail
   rather than build the check it exists to require. **This is the
   explicit next-session task — see below.**

8. **BetUS screenshot handling investigated — turned out to be the wrong
   problem.** The files Andy's actually been dropping in
   `docs/Futures_Odds/` (`BKR_Odds_MMDD`, `BetUS_Odds_MMDD`) are plain-text
   odds pastes, not screenshots. There's already a dedicated, working
   parser for both formats: `scripts/parse-futures-text.js` — it was just
   never wired into anything, and two dated batches (`BKR_Odds_0916`,
   `BetUS_Odds_0916`, `BetUS_Odds_0922`) were sitting unprocessed.
   Still generalized `scripts/ingest-beo-screenshots.js` (commit `48dc673`)
   for whenever Codex's browser automation produces actual BEO/BKR
   screenshot images — cross-product `BOOK_PREFIXES x MARKET_SUFFIXES`,
   per-book output splitting so a mixed BEO_*/BUS_* folder produces clean
   independent batches instead of one mistagged file.

9. **Metabet wired into the Toolbox** (Andy's primary explicit ask,
   commit `36ab3ff`) — new `metabet_futures` diagnostic source + Run Now
   button (`metabet-refresh` task), deliberately kept as a SEPARATE card
   from `futures_markets` since Metabet is free/no-quota-cost and the
   TheOddsAPI-backed button is not. Verified via a direct
   `getDiagnosticsPayload()` call before committing.

10. **Backfilled the two unprocessed BKR/BetUS text batches** (Andy's
    go-ahead) — parsed via `parse-futures-text.js`, upserted via
    `scripts/ingest-futures-json.js` (all three HTTP 201: bookmaker
    9/16 = 96 rows, betus 9/16 = 416 rows, betus 9/22 = 256 rows), commit
    `7acc444`. Archived all 5 source text files (incl. the already-
    processed-but-never-archived 9/08 batch found alongside them) into
    `docs/Futures_Odds/_processed/<Book>_<date>/` — that folder is
    gitignored, so the archive move itself isn't part of any commit.

11. **Git fork resolved and pushed.** `origin/main`'s `bf60e47` and local
    `3a7eb35` turned out to be byte-identical-tree sibling commits from two
    different sessions off the same parent `fc1b7b2` (same TNF-grading
    handoff, different attribution) — confirmed via
    `git diff 3a7eb35 bf60e47` returning empty and matching tree hashes.
    Merged (`b7ce30c`, two conflict blocks in `HANDOFF.md`'s pointer text
    resolved by keeping the newer/superset side) and pushed to
    `origin/main`. Fully in sync as of this handoff.

## Open items for the next session

1. **PRIMARY: Kalshi execution-eligibility decision.** Andy said Kalshi is
   now placeable too, but it sits in `PREDICTION_MARKET_VENUES`
   (`src/lib/executionVenues.js`), which has an explicit, deliberate
   warning that prediction-market execution needs a bid/ask/fee-aware
   check against the matching sportsbook market that has never been
   built. Ask Andy directly: (a) build that check for real now, or (b) a
   lighter override that just treats Kalshi's price like a sportsbook
   price and accepts the fee/liquidity blind spot. Do not silently move
   Kalshi into `SPORTSBOOK_VENUES` without one of those two decisions —
   that would remove a guardrail this file's own author put there on
   purpose. See `docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md`
   §1 for the original design reasoning.

2. **Fanatics futures ingestion** — explicitly deferred by Andy to next
   week. `Fanatics_SB1.PNG`/`Fanatics_SB2.PNG` sit in
   `docs/Futures_Odds/` with no parser at all (not text, not a known
   screenshot prefix). Scope this fresh next week, don't pick it up early.

3. **Circa screenshots** — 7 raw "Screenshot_2026092X..._Circa Sports
   Nevada.jpg.jpeg" phone captures sitting in `docs/Futures_Odds/`,
   unarchived, no dedicated parser confirmed this session. Matches the
   long-open "Circa re-price blocked on screenshots" item from earlier
   handoffs — still open, not touched.

4. **739211245's 2 open spots** — still not confirmed filled by Andy
   (PHI ML / BAL ML recommendation logged, awaiting his placement +
   pasted-slip check).

5. **TheOddsAPI key at ~11 requests remaining** as of this session's
   investigation — flagged, Andy has not yet responded. This key also
   powers regular odds/prediction-markets pipelines, not just futures.

6. **Player-props-intel stale-game bug** (found during Friday-cadence
   review) — flagged, not fixed.

7. **Bills $10 credit** — still not placed.

8. **Recommendation ledger location** — lives in claude.ai Project "dev"
   at `claude/recommendation-ledger-2026.md`, NOT a repo file. Read/update
   it there.

9. Two long-open, low-priority data-hygiene notes carried forward:
   ticket 739211245's `progress_notes` field contains leftover text that
   actually describes a different ticket (738490212's leg 1); ticket
   738490212's top-level `status` still says `PENDING` despite two legs
   already graded LOST.

## Standing constraints (verbatim, carry forward)

- No `git add -A` — stage files individually.
- Never run `git reset`, `git clean`, or `git stash`.
- Any Supabase write requires Andy's explicit per-change approval first.
- Never place a bet or take any sportsbook account action — prep/research/
  grading/logging only.
- Claude does not push to git by default — Andy pushes, unless he
  explicitly asks Claude to (he did, this session — see git fork item above).
- `docs/Futures_Odds/` is intentionally gitignored/untracked — leave it
  that way.
- Every ticket must have its slip pasted and checked leg-by-leg before
  being treated as placed/logged.
- File scans (grep/find) must be scope-limited (specific paths, maxdepth,
  timeout prefixes) — the device_bash bridge stalls/times out on broad
  recursive scans of this large repo.
- Never use team power ratings as supporting evidence for picks.
- $6.81 of free/bonus money sitting unassigned.
- Scheduled/automated tasks are configured to run from this specific
  checkout.
- Git operations on the E: mount cannot unlink their own lock files
  without explicit OS-level delete permission (already granted for
  `E:\dev` for the remainder of any session that needs it, via
  `mcp__remote-devices__device_request_delete_permission`).
