# Weekly Master Betting Intelligence Report — Runbook

**Owner:** any agent (Claude, Codex, Antigravity). **Cadence:** every **Saturday night** before the Sunday slate (after prop boards post), optional Sunday-morning refresh.
**Format:** locked template v2 (picks first; approved 2026-10-02). See `docs/MASTER_INTEL_REPORT_FORMAT.md` for the layout, the plain-English rules, the hand-written inputs and the agent instructions. This runbook covers the build steps.
**Output:** `dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.{html,pdf,docx,md,json}` (gitignored; archive all five to Google Drive, share the html).
**Structure:** Part A What to bet (Our Picks + sections 1–5), Part B Why we like them (Week at a Glance + 6–7), Part C Reference (8–11); see format doc §2, generated from data plus four hand-written inputs (format doc §3).

> **Guardrails.** Everything here is read-only. No bet placement, no bet-slip clicks, no Supabase writes (the pull is SELECT-only), no `git add -A`.
> Sportsbook pages are real-money accounts. Read the rendered page only. DK Predictions and Kalshi prices are contract percentages, not sportsbook odds; never swap one for the other without a fee/spread check.

## 1. Pipeline at a glance

| Step | Command / action | Produces | Required? |
|---|---|---|---|
| 0 | `node scripts/weekly-synthesis-preflight.mjs` | freshness table (fix STALE rows first) | yes |
| 1 | Bookmaker SGP capture (§2) | `data/generated/props/bookmaker-live-<date>-week<N>.raw.txt` | **yes** |
| 2 | `node scripts/props/bookmaker-sgp-dump-parse.mjs --in <raw.txt> --date <date> --week <N>` | per-game + `bookmaker-live-<date>-week<N>.json` | **yes** |
| 3 | `python3 scripts/props/beo.py docs/Player_Prop_Odds_Weekly/Week<N> data/generated/props/beo-w<NN>.json` | BEO prop boards | optional (tackles+assists section) |
| 4 | Andy saves DK Predictions pages → `python3 scripts/props/dk-predictions-mhtml-parse.py docs/Player_Prop_Odds_Weekly/Week<N>/DK/*.mhtml` | `dk-predictions-<date>-<away>-at-<home>.json` | optional |
| 5 | YouTube: `node scripts/youtube-podcast-sweep.js --lookback-days 3` then Gemini extraction (§4) | `data/podcasts/youtube-extracted-picks-2026-w<NN>.json` | optional |
| 6 | Weekly refreshes: availability → starters → secondary → prediction markets → alpha packet (§5) | `data/player-availability/latest.json` etc. | yes (stale injuries = wrong report) |
| 7 | Synthesis digest + card (agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md) | `scratch/w<NN>-synthesis-digest-sat.md`, `reports/bets/2026-w<NN>-card.md` | optional (sections 1/4/5/7 are richer with it) |
| 8 | `node scripts/master-intel/pull.mjs --week <N>` | `data/generated/master-intel/w<NN>-pull.json` (signals, articles, expert picks, splits, feed health) | **yes** |
| 7b | **Roster gate:** `python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <date> --fetch --strict` (live 2026 ESPN rosters; after the digest + card) | `data/generated/master-intel/w<NN>-roster-vet.json` | **yes: BLOCK = stop and fix** |
| 8b | Write the narratives file (game write-ups, `## TICKETS`, `## SUPERCONTEST`) and `data/survivor/pick-intel-<season>-w<NN>.json` (§8, format doc §3) | `reports/intel/master-intel-narratives-<season>-w<NN>.md` | **yes** |
| 9 | `python3 scripts/master-intel/build.py --week <N> --date <date>` | md + html + docx + json in `dist/nfl_week<N>_master_packet/` | **yes** |
| 9b | `python3 scripts/master-intel/export_pdf.py dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.html` | pdf (all boxes expanded). Needs Playwright + Chromium; if the local machine lacks them, run it wherever they exist | **yes** |
| 9c | Archive the five files to Google Drive (`Platinum Rose / Master Intel / <season> / Week <NN>`) | — | **yes** |
| 10 | QA checklist (§6) | — | **yes** |

**Roster gate (since 2026-09-27):** `build.py` runs `roster_vet.py --fetch --strict` itself and **exits** if any player in the card, digest, narratives, matchup seeds or picks is on the wrong 2026 team, on no roster, on the practice squad, or (for card legs) ruled out. Narratives: every capitalized name must be a 2026 roster player or be listed in `data/nfl-rosters/non-player-names.json` (coaches, analysts, shows). Never write a player's team or role from memory. `--allow-roster-issues` builds anyway only with Andy's explicit OK and prints the issues in the report's gaps. If the matchup seeds fail, run `python3 scripts/nfl-rosters/rebuild_matchup_seeds.py` then `npm run secondary-matchups` (never `scripts/build-manual-secondary-seeds.js`, whose rosters are stale).

`--date` is the BKR capture date (it's in the capture filenames). Use `--no-export` to skip html/docx while iterating.
Export uses `scripts/master-intel/convert_summary.py` (vendored copy of the Week 1/2 converter; needs `python-docx`).

## 2. Bookmaker SGP capture (step 1)

Bookmaker has no API and it's a real-money account, so capture reads the rendered page in Andy's logged-in browser.

1. Open `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/`. Collect each game URL: links matching `/game-lines/<away>-vs-<home>/`.
2. For each game, open the URL and run `scripts/props/bookmaker-sgp-extract.browser.js` in the page context (paste into DevTools console, or have the browser tool evaluate it). The script waits for markets to render, keeps only **SGP-badged** sections, and appends the game to `sessionStorage.bkrDump`. It never clicks anything.
3. After the last game, run `bkrDownload('bkr-sgp-live-<date>-week<N>.txt')`, then move the file to `data/generated/props/bookmaker-live-<date>-week<N>.raw.txt`.

Gotchas (all hit on 2026-09-26):
- **Stay on `be.bookmaker.eu`.** `sessionStorage` is per origin. An ad click that lands on `www.bookmaker.eu` makes the data "disappear" until you navigate back.
- **Chrome allows one automatic download per site**, then silently blocks the rest until someone clicks "Always allow downloads" in the address bar. If the file doesn't show up, that's why. Queued downloads then all land at once (`(1)`, `(2)` copies).
- **Tool return caps.** Browser-agent JS results are truncated at about 1 KB, and page-text reads at 50 KB. Don't try to read 200 KB of lines back through the tool. Use the download.
- **Alt spread/total expanders (`+ 8`) are not opened.** Main lines only for game markets. Player ladders are complete.
- A player listed with **no odds** means the book pulled that market. The report surfaces these ("Listed without odds at BKR"). Treat it as a status question, not an injury fact.
- Neutral-site games (Rio, London, etc.) title the first section with the city. The parser treats the first section as `game_lines` regardless.
- Claude in Chrome **refuses predictions.draftkings.com** (safety restriction), but not Bookmaker. DK is always Andy-saved (step 4).

Expected result: 15–16 games, about 400–500 lines each, `unparsed=0 unknown=0` in the parser's summary. TD-scorer markets can be missing for late games (MNF) early in the week. That's normal.

## 3. What each section is built from

The section list, the defaults (what's collapsed, what's linked, the plain-English rules) and the data behind each section are in `docs/MASTER_INTEL_REPORT_FORMAT.md` §2. Persisted state: big-money signals keep their first-seen line in `data/generated/master-intel/big-money-flags-<season>-w<NN>.json` (local, gitignored), which is what lets later builds show line drift. Don't delete it mid-week.

## 4. YouTube extraction (step 5)

- `node scripts/youtube-podcast-sweep.js --lookback-days 3 --max-per-run 5` discovers new episodes. It needs the OAuth token. `invalid_grant` means re-run `node scripts/youtube-oauth-setup.js` on Andy's machine (and see TASK_BOARD `B-YT-OAUTH`: publish the Google app so tokens stop expiring every 7 days).
- Extraction: `node scripts/youtube-podcast-sweep.js --run-saved-futures --gemini-scope all --only-ids <ids> --max-per-run 5 --run-gemini` (about $0.03/episode, 1–8 min each). **Run it from a normal terminal**, not a sandbox with a short timeout. Needs `pip install google-genai`.
- Raw Gemini picks need cleaning before use: college games, Week N+1 lookaheads, 1Q/1H lines labelled as full-game, props missing `player`. Write the cleaned list to `data/podcasts/youtube-extracted-picks-2026-w<NN>.json` (`picks[]` with `game` as `AWY@HOM`, `pick`, `price`, `speaker`, `show`, `raw`, `verify`). Andy reviews it before anything is promoted.

## 5. Refresh commands (step 6)

```
node scripts/build-player-availability.js --live-injuries
node scripts/build-projected-starters.js
node scripts/build-secondary-matchup-vulnerability.js
node scripts/build-prediction-markets.js && node scripts/build-prediction-market-map.js && node scripts/build-cross-market-coherence.js
node scripts/build-player-props-intel.js      # drops already-played games (kickoff+4h) as of 5f75399
node scripts/build-alpha-data-packet.js
```
Articles ingest runs on its own (GitHub Actions, twice daily). The Toolbox "Research Intel Ingest" button is a dry-run preview. TheOddsAPI is on a quota floor, so game lines come from the BKR capture, not `game_odds_snapshots`.

## 6. QA checklist (step 10 — do it, don't skip it)

1. Builder output ends with `wrote … (N lines)` and prints every `GAP:`. Each gap must also appear in §11 Known Gaps.
2. §2: spot-check 2 games' spread/total/ML against the BKR page, and one splits row against Action Network.
3. §3: no game shows the same outlet on both sides. If one does, the voting collapse broke.
4. §6: QB names match the week's starters (injury swaps: check projected starters). Any "Listed without odds" player gets a line in the chat summary.
5. Games already played show **FINAL** and contribute nothing to §1–5/7–8.
6. Open the html once. Sections collapse, the filters work, links resolve, logos show, the side menu works, the disclaimer is at the bottom. Confirm the five exports exist.
7. Summary to Andy: ≤15 lines. Top clashes, sharp flags, pulled players, known gaps. Don't paste the report.

## 7. Known limitations

- The article-signal team matcher is keyword-based. Shared-city teams (NYG/NYJ, LAC/LAR) only match on nickname. A news article can still register as a "lean". §3 is a consensus *indicator*; the card's digest is the vetted version.
- Outlet feeds (ESPN NFL, VSiN, BettingPros) aggregate several writers and count as one vote. Podcast shows and their hosts (e.g. "Sharp or Square" and "Simon Hunter") can each appear. Read the names.
- No Monte Carlo. §2 is market-implied only.
- DK and Kalshi percentages are shown raw (pre-fee). Execution-eligibility for Kalshi lives in `src/lib/predictionMarketExecution.js` (dossier futures path), not here.

## 8. Section 7 game narratives and projected scores (dossier) (written step, before the final build)

`build.py` reads `reports/intel/master-intel-narratives-<season>-w<NN>.md`. There is one `## AWAY@HOME` block per remaining game:

```
## TEN@NYG
projection: TEN 19, NYG 16

### Game script
...how the game plays out, citing only evidence in the dossier...
### Why the card leans this way
...consensus, splits, line movement, injuries, secondary tier; name the card tickets...
### What breaks it
...the counter-case and what to re-check before kickoff...
```

- Build a first pass with `--no-export`, then write the narratives from that week's §6 evidence: BKR lines, splits, secondary matchups, injuries, expert/YouTube picks and card leans. Rebuild after.
- Projection method: start at the market-implied score, then move it only for evidence that is cited in the text. It is not a model output, and no edge % is used. If the projection disagrees with a card lean (for example a dog ML that is a price bet, not a predicted win), say so.
- Line movement is automatic. The baseline is the earliest `data/odds/BKR_current_lines_*` paste whose `GAME LINES - MON DD` header matches the kickoff date. Paste a Tuesday snapshot every week so there is a baseline.
- Build.py prints the projected margin and total against the market in each box and adds the Projected column to §2. Missing games are listed under Known gaps.
- Rewrite a game's block when the lines, the QB or the card change (for example after tonight's DK saves).
- **Quality bar:** every block must meet the game narrative minimum in `docs/MASTER_INTEL_REPORT_FORMAT.md` §3 (named players and prices, expert split with names, bets-vs-money split, card tickets or why we pass, specific "what breaks it"). Don't write narratives before the card, splits and expert registry exist for the week.
