# Claude → Codex: capture the Week 4 Bookmaker SGP prop boards (2026-10-01, 9:45 PM PT)

**Why Codex:** Claude can't reach Andy's logged-in Bookmaker session tonight. Chrome extension isn't connected, and the Claude app's built-in browser redirects `be.bookmaker.eu` to the login page. Claude does not enter credentials. This capture is step 1 of the Saturday Master Intel build (`docs/MASTER_INTEL_REPORT_RUNBOOK.md` §1–2), and the remaining Week 4 report steps are blocked on it.

## State at handoff
- `main` @ `8107c5d` (pushed). Live Tracker injury-beat feature landed there.
- TNF PIT @ CLE is **final (CLE 27, PIT 24)** and graded in the local wagers ledger. Do **not** capture PIT@CLE again; it already exists at `docs/Player_Prop_Odds_Weekly/Week4/BKR_Week4_PIT_CLE_2026-10-01.*`.
- Needed: the **other 15 Week 4 games** (Sun 10/4 incl. the 6:30 AM PT international game, through MNF).

## Prompt for Codex

> Resume Platinum Rose NFL from `E:\dev\projects\NFL_Dashboard` (main @ 8107c5d or later). Reconcile live Git first (fetch, status, ahead/behind); never reset/clean/stash/`git add -A`. Then do **only** the Week 4 Bookmaker SGP capture, read-only:
>
> 1. In Andy's **logged-in** browser, open `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/`. Collect every game URL matching `/game-lines/<away>-vs-<home>/`. **Skip PIT@CLE** (played).
> 2. For each game: open the URL and run `scripts/props/bookmaker-sgp-extract.browser.js` in the page context (DevTools console or browser-tool eval). It waits for markets to render, keeps only SGP-badged sections, and appends to `sessionStorage.bkrDump`. **Never click anything on the page** (no bet slip, no odds buttons, no expanders).
> 3. After the last game: `bkrDownload('bkr-sgp-live-<capture-date>-week4.txt')`, then move it to `data/generated/props/bookmaker-live-<capture-date>-week4.raw.txt`. `<capture-date>` = the PT date you capture (YYYY-MM-DD).
> 4. Parse: `node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-<capture-date>-week4.raw.txt --date <capture-date> --week 4`. Target: 15 games, ~400–500 lines each, `unparsed=0 unknown=0`.
> 5. Also save the main game lines as a fresh `data/odds/BKR_current_lines_<MMDD>_<HHMM>` paste (same format as `BKR_current_lines_1001_1242`), so the report's line-movement baseline stays current.
> 6. Roster sanity: `python3 scripts/nfl-rosters/roster_vet.py --week 4 --date <capture-date> --fetch --strict`. Report any BLOCK; don't "fix" names from memory.
> 7. Write a short handoff in `handoffs/` listing: games captured (count and any missing), parser summary per game, players **listed without odds** (pulled markets; status question, not an injury fact), and any gotchas hit. Commit only the handoff (+ the BKR_current_lines paste if tracked); the props JSON under `data/generated/` is gitignored.
>
> **Gotchas (runbook §2):** stay on `be.bookmaker.eu`, because `sessionStorage` is per-origin and an ad click to `www.bookmaker.eu` makes the dump "disappear". Chrome allows only one automatic download per site, so click "Always allow downloads" if the file doesn't appear. Tool return caps are ~1 KB for JS results and 50 KB for page text, so use the download, not read-back. Alt spread/total expanders are intentionally not opened. TD-scorer markets can be missing for MNF early in the week.
>
> **Guardrails:** real-money account, so read the rendered page only. No bets, bet-slip clicks, or account/settings changes. No TheOddsAPI calls. No Supabase writes. No ledger changes. Never promote proposal drafts.

## After Codex lands this (for Claude)
Run steps 3/4 if Andy has saved BEO boards / DK Predictions to `docs/Player_Prop_Odds_Weekly/Week4/`, then step 6 refreshes, `pull.mjs --week 4`, roster gate, narratives, build, export, QA. Inactives remain a Sunday-morning refresh.
