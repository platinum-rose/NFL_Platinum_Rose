# Handoff: preflight regex fix + BKR manual futures capture — Week 3 synthesis session ready to resume

**Date:** 2026-09-22 / 23:00-01:00 UTC (Tue Week 3, late afternoon/evening PT)
**Author:** Claude (session continuing same-day from the Gemini podcast pipeline handoff)
**Branch:** `wip/yahoo-sync`
**Commits this session:** `caec16c` (preflight regex fix), `8c256fd` (data refresh — futures/prediction-markets/secondary-matchups). Both pushed to `origin/wip/yahoo-sync`.

## Context

This continues the same-day Gemini podcast pipeline hardening
(`handoffs/2026-09-22-2130-claude-gemini-podcast-hardening-and-youtube-intel-promotion.md`).
After that closed out, the session returned to the Week 3 TUE-WED synthesis
session per `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, still sitting at
**STOP A (Phase 1 freshness gate)**. This handoff covers finishing that
freshness pass. **Phase 2 (evidence digest) has not started.**

## What happened, in order

1. Resumed synthesis session; ran `npm run secondary-matchups` — refreshed
   Week 3 secondary-matchup vulnerability data successfully.
2. Ran the prediction-markets refresh chain — refreshed
   `data/prediction-markets/latest.json`, cross-market-coherence, and
   team-market-map, plus their `docs/` mirrors.
3. Andy reported "we captured fresh lines from BEO/BKR and BetUS this
   morning" and asked why the preflight wasn't showing them fresh.
   Investigated and found **two separate things**, not one:
   - **BEO and BetUS genuinely were fresh** (real captures from earlier
     today, correct content) — but `scripts/weekly-synthesis-preflight.mjs`
     had a **regex bug**: it only matched the old bare-date naming
     convention (`betonline-2026-MM-DD.json` / `bookmaker-2026-MM-DD.json`),
     missing today's newer suffixed filenames
     (`betonline-2026-09-22-live-futures-markets.json`, etc.), so it
     incorrectly reported them STALE.
   - **BKR (BookMaker) futures genuinely had no fresh capture anywhere in
     the repo** — confirmed via repo-wide search. This was a real gap, not
     a detection bug, contrary to Andy's belief that all three were
     captured that morning.
4. **Fixed the preflight regex** (`caec16c`): broadened both the BEO and
   BKR futures-board regexes from `/^betonline-2026-\d\d-\d\d\.json$/` to
   `/^betonline-2026-\d\d-\d\d(-.*)?\.json$/` (and the bookmaker
   equivalent), so both the old bare-date convention and today's suffixed
   convention match. Verified with `node --check` and a live preflight run
   — BEO immediately flipped to `ok` (5-6h old); BKR correctly stayed
   `STALE` at that point since no fresh file existed yet.
5. Andy said he'd have "the Codex team" recapture BKR futures and asked
   where to save them. Answered: `data/futures-imports/`, following today's
   established naming pattern (`bookmaker-2026-09-22-<descriptor>.json`).
6. Andy then asked to use Claude in Chrome to navigate to BookMaker's live
   "Odds to Win" page directly (`https://be.bookmaker.eu/en/sports/football/nfl/odds-to-win/`)
   instead of waiting on Codex. **Chrome extension would not connect**
   (`tabs_context_mcp` returned "Browser extension is not connected")
   across three retries, including after Andy said he'd just used the
   extension himself. Never diagnosed further — not a code issue on our
   side, just an unavailable browser connection this session.
7. Andy fell back to manually reading the live page himself and pasted the
   full odds table in chat: **Super Bowl LXI (32 teams), AFC (16), NFC
   (16)** — all with real moneyline odds, board dated Sep 27.
8. Built `data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json`
   from the pasted data, matching the existing BEO
   `marketSnapshots.{conference,superbowl}` schema convention (checked
   both the flat-array `super-bowl-live.json` schema and the nested
   `live-futures-markets.json` schema first, then used the nested one
   since it needed both SB + conference markets in one file). Source field
   explicitly says "manually captured by Andy, pasted to Claude" for
   auditability — this is a real board snapshot Andy read off the live
   page himself, not anything fabricated or scraped by Claude.
9. Verified via preflight: BKR flipped to `ok` (0h old) alongside BEO.
   **5 stale of 21** remaining (down from 6).
10. Andy asked to stage and commit everything from this session, then
    handoff to a fresh session.
11. **Git housekeeping**: hit the repo's recurring stale-lock-file issue —
    `.git/index.lock` blocked `git add`, and after removing it,
    `.git/HEAD.lock` blocked the commit too. Used
    `device_request_delete_permission` (once, for the `E:\dev` connected
    folder root) to get delete permission for this session, then removed
    both lock files and retried successfully. No editor or other git
    process was actually running — these were leftover crash artifacts,
    consistent with the "Empty last update token" warnings seen throughout
    this repo's sessions.
12. **Staged narrowly** (not `git add -A` — this repo's working tree has
    hundreds of unrelated pre-existing dirty/untracked scratch files from
    prior sessions, per the standing "preserve the dirty checkout"
    guardrail). Cross-checked file mtimes against today's date before
    staging anything, to avoid sweeping up stale untracked files that just
    happened to share a directory. Committed only:
    - `data/futures-imports/`: the 5 fresh 2026-09-22 capture files (BEO
      x2, BetUS, DraftKings, Fanatics) + the new BKR file — explicitly
      excluded `betonline-2026-09-09.json` and `price-watch-list-2026.json`
      (older untracked files in the same directory, confirmed via mtime
      not from today).
    - `data/prediction-markets/` + `docs/prediction-markets/`: today's
      refresh outputs (`latest.json`, cross-market-coherence,
      team-market-map, + dated 2026-09-22 copies + docs mirrors) —
      excluded the 2026-09-19-dated copies already sitting untracked in
      the same directory.
    - `data/secondary-matchups/` + `docs/secondary-matchups/`: today's
      `latest.json` and the new Week 3 (`w03`) report + docs — excluded
      the modified-but-not-touched-today `w01` (mtime 9/18) and untracked
      `w02` (mtime 9/19) files sitting in the same directories.
    - Left `scripts/weekly-synthesis-preflight.mjs` in its own prior commit
      (`caec16c`), didn't re-touch it.
    - Left everything else in the dirty tree alone (hundreds of untracked
      `scratch/*` files from unrelated prior sessions — confirmed by mtime
      these predate today).
13. Committed as `8c256fd`, pushed to `origin/wip/yahoo-sync`.

## Current preflight state (5 stale of 21)

```
STALE Roster map                       91h  815 players
STALE BKR current lines                65h  [data/odds/BKR_current_lines_0920_0130]
STALE Alpha packet                     90h
STALE Podcast recs (legacy file)      234h  (long-stale legacy file, likely not worth chasing)
STALE Prop boards Week3                     0 board file(s)
```

Everything else — including both futures boards (BEO + BKR) — is `ok`.

## Known open items / not done this session

- **Roster map refresh** — not run. Would need
  `gh workflow run nfl-roster-refresh.yml` or manual trigger.
- **Expert-picks promotion gap** — `agents/pick-extraction.js` was never
  run for episodes ingested manually earlier today (the GitHub Actions
  `workflow_run` auto-trigger only fires after an Actions-run
  `podcast-ingest`, not a manual one). Real automation gap, flagged in the
  prior handoff too, still not fixed.
- **Alpha packet refresh** (`npm run alpha:packet`) — not run. Gated on
  prediction-markets (done) and ideally roster map (not done).
- **BKR current lines** (`data/odds/BKR_current_lines_*`, separate from
  the futures board) — still stale, not addressed this session.
- **Prop boards Week3** — 0 board files found; not investigated.
- **BetUS is not tracked by `weekly-synthesis-preflight.mjs` at all** —
  it's simply not in the `SOURCES` list, so its freshness never shows one
  way or the other in this report. Flagged to Andy, not added since he
  didn't ask for it — worth a quick add if BetUS freshness needs ongoing
  visibility.
- **Claude in Chrome would not connect this session** — three retries,
  never diagnosed further (Andy fell back to manual capture, which
  worked fine). Worth a fresh check next session; may just have been a
  transient extension/session pairing issue.
- **Git repo lock-file cruft** — recurring across sessions
  (`.git/index.lock`, `.git/HEAD.lock`, "Empty last update token"
  warnings). Not investigated as a root cause; workaround
  (`device_request_delete_permission` + `rm`) is quick and known to work.

## Files touched this session

- `scripts/weekly-synthesis-preflight.mjs` — regex fix, commit `caec16c`.
- `data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json` —
  **new**, manual BKR capture, commit `8c256fd`.
- 5 other same-day futures capture files (BEO x2, BetUS, DraftKings,
  Fanatics) — pre-existing untracked, now committed in `8c256fd`.
- Prediction-markets + secondary-matchups refresh outputs (12 files) —
  committed in `8c256fd`.
- **Not committed / not touched**: the large pre-existing dirty/untracked
  tree (`scratch/*`, older dated data files in the same directories, etc.)
  — confirmed via mtime these predate today and were left alone per the
  "preserve the dirty checkout" guardrail.

## Suggested next steps (fresh session)

1. Re-run `node scripts/weekly-synthesis-preflight.mjs` to confirm the
   freshness picture still matches this handoff (5 stale of 21) before
   deciding whether to proceed past STOP A.
2. Decide whether the remaining 5 stale items (roster map, BKR current
   lines, alpha packet, legacy podcast recs, Week 3 prop boards) block
   further progress or get marked provisional for this session — per
   `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`'s STOP A/B/C gates.
3. If clearing STOP A, proceed to Phase 2a (record rules — already read
   this session, in prior context) then Phase 2b (evidence digest, sources
   a-m), Bills-credit play, TNF early read, and §8 Futures review — the
   BEO/BKR futures boards being fresh now should clear the futures-related
   STOP C gate for those two books specifically.
4. Consider running the roster map refresh and `pick-extraction.js` gap
   fix if time allows before Phase 2 — both are quick, low-risk, and
   currently blocking or degrading downstream freshness.
5. Recommendation ledger (per §9 output structure) should still be written
   to the claude.ai Project "DEV" doc `claude/recommendation-ledger-2026.md`
   once real recommendations exist — not yet reached this session.
