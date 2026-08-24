# BetOnline (BEO) Futures Screenshot → Dashboard Workflow

**Status: mandatory process, effective 2026-08-23.** BetOnline has no public
API/feed for futures odds — every BEO futures update starts as a manual
screenshot. This doc is the one place that workflow is written down; follow
it every time instead of hand-writing a new import script per batch (see
"Why this exists" at the bottom for the history of why that was the old
pattern).

## The workflow

1. **Screenshot BEO's futures pages**, naming each file with the market
   prefix it shows (case doesn't matter; the date/suffix after the prefix
   can be anything — it's ignored):

   | Prefix | Market |
   |---|---|
   | `BEO_SB_*` | Super Bowl Winner |
   | `BEO_Conf_*` | Conference Winner |
   | `BEO_Div_*` | Division Winner |
   | `BEO_RegWins*` | Regular Season Win Totals (fine to split across several screenshots, e.g. `BEO_RegWins1_*`, `BEO_RegWins2_*`) |
   | `BEO_MakePlayoffs*` | Make/Miss the Playoffs |
   | `BEO_Seeding_Exacta*` / `BEO_Exacta*` | Seeding / Exacta |
   | `BEO_SBMatchup*` | Super Bowl Exact Matchup |

   (Full mapping lives in `PREFIX_MARKET_MAP` at the top of
   `scripts/ingest-beo-screenshots.js` — add a new row there if BEO ever
   adds a market you want tracked.)

2. **Drop the screenshots in `docs/Futures_Odds/`** (top level, not a
   subfolder).

3. **Run the ingestion script** from a normal terminal on this machine (not
   through an AI-session device bridge — those have no network path to
   Supabase):

   ```
   npm run futures:ingest-beo-screenshots:dry   # preview — no writes
   npm run futures:ingest-beo-screenshots       # the real thing
   ```

   This OCRs each screenshot with Gemini Vision, normalizes the rows,
   writes `data/futures-imports/betonline-<date>.json` plus a
   `docs/FUTURES_ODDS_BETONLINE_<date>_MANUAL_REVIEW.md` summary, upserts
   into `futures_odds_snapshots` in Supabase, and archives the screenshots
   to `docs/Futures_Odds/_processed/BetOnline_<date>/`.

4. **Click "Regenerate" on the Bankroll & Futures → Intel Report page** in
   the live app. This is the step that actually gets the new odds onto the
   dashboard — the Intel Report is a *stored*, pre-built report (in the
   `futures_reports` table), not something built live on every page view.
   Regenerate fires a real GitHub Actions run of
   `agents/futures-intel-report-v2.js`, which reads whatever is currently
   in `futures_odds_snapshots` (including what step 3 just wrote) and the
   current committed generator code, and writes a fresh report. The page
   polls and swaps the new report in automatically (~10s), with an updated
   timestamp next to the title.

   ("Reload" next to it just re-fetches whatever report is already stored
   — it does **not** rebuild, so it won't show new odds by itself.)

Steps 3 and 4 are both real, billable/consequential actions (a Supabase
write; a GitHub Actions run + another Supabase write) — run them yourself,
they're not something an AI session should trigger unprompted.

## Why this exists

Before 2026-08-23, every BEO batch got a bespoke script:
`build-betonline-0729-import.js` and `build-betonline-0810-import.js` were
odds hand-transcribed into JS literals by whoever processed that batch — no
OCR at all. `parse_beo_screenshots.py` (2026-08-22) was the first to
automate the OCR step via Gemini Vision, but it hardcoded that day's date
and its exact 10 filenames, so it still needed a near-duplicate rewrite for
the next batch. `scripts/ingest-beo-screenshots.js` generalizes that last
one — same OCR approach, but driven by the filename-prefix convention above
instead of a hardcoded file list, so it runs unchanged batch after batch.
