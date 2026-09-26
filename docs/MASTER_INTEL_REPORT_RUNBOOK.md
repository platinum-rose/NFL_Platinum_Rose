# Weekly Master Betting Intelligence Report — Runbook

**Owner:** any agent (Claude, Codex, Antigravity). **Cadence:** Saturday afternoon (after prop boards post), optional Sunday-morning refresh.
**Output:** `dist/nfl_week<N>_master_packet/nfl_week<N>_master_betting_intelligence_summary.{md,html,docx}` (gitignored; share the html/docx).
**Structure:** the same 11 sections as the Week 1–2 master dossiers, generated from data instead of hand-typed dicts.

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
| 9 | `python3 scripts/master-intel/build.py --week <N> --date <date>` | md + html + docx in `dist/nfl_week<N>_master_packet/` | **yes** |
| 10 | QA checklist (§6) | — | **yes** |

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

| § | Section | Source(s) | Logic |
|---|---|---|---|
| 1 | Executive Master Board | digest table (`game \| market \| lean \| source \| tier`), card ticket headings | tier-1 leans first; skip/split rows dropped; ticket list parsed from `### name — book — **$stake** — price — returns` headings |
| 2 | Market-implied board | BKR game lines, AN splits | implied score = total/2 ± spread/2; no-vig ML win %; **sharp** flag when money − tickets ≥ 15 pts |
| 3 | Consensus & clashes | research_pick_signals, user_picks EXPERT, YouTube picks | each source counts **once per game** on its majority side (ties dropped); clash = ≥2 sources each side |
| 4 | Feature plays | tier-1 digest rows; named expert picks | — |
| 5 | Wong teasers + dog RR | BKR spreads | favorites −7.5..−8.5, dogs +1.5..+2.5; teased +6 |
| 6 | Game dossier | everything above + availability, secondary matchups, BKR ladders, DK | per game: market card, QB (from BKR passing markets), splits, secondary tier, skill injuries, consensus, expert/YouTube picks, BKR ≈−110 main rungs, shortest ATD, pulled players, DK %, card leans. Games already played are marked FINAL |
| 7 | Parlay cards | card ticket headings + §5 build rules from the synthesis prompt | — |
| 8 | Prop card | player-props-intel (tier 1, completed games excluded), BEO tackles+assists, BKR 2+ pass TD | — |
| 9 | Survivor | `data/survivor/yahoo-survivor-entrants-2026.json` | user entry status + no-vig win % ranking |
| 10 | Systems & trends | articles/X bookmarks this week matching system/trend/ATS keywords | links only; read before using. Plus the standing "quant prop model failed validation" rule |
| 11 | Source registry | pull counts, feed health, auto-detected gaps | "Known Gaps" lists every missing optional input |

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
6. Open the html once. Tables render and the "Back to Executive Master Board" links work.
7. Summary to Andy: ≤15 lines. Top clashes, sharp flags, pulled players, known gaps. Don't paste the report.

## 7. Known limitations

- The article-signal team matcher is keyword-based. Shared-city teams (NYG/NYJ, LAC/LAR) only match on nickname. A news article can still register as a "lean". §3 is a consensus *indicator*; the card's digest is the vetted version.
- Outlet feeds (ESPN NFL, VSiN, BettingPros) aggregate several writers and count as one vote. Podcast shows and their hosts (e.g. "Sharp or Square" and "Simon Hunter") can each appear. Read the names.
- No Monte Carlo. §2 is market-implied only.
- DK and Kalshi percentages are shown raw (pre-fee). Execution-eligibility for Kalshi lives in `src/lib/predictionMarketExecution.js` (dossier futures path), not here.
