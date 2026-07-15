# NFL Futures Report — Full Refresh Runbook (Windows-local)

**Built:** 2026-07-14 (S273) · **Run from:** Windows PowerShell (M6 unavailable this session)
**Repo root:** `E:\dev\projects\NFL_Dashboard`
**Goal:** refresh every source the Futures Intel Report reads (odds + articles + podcasts), then generate the report.

> The Cowork sandbox has **no network egress** to Supabase / TheOddsAPI, so every step below runs
> **natively in PowerShell** where your `.env` is loaded. Do not run these from the sandbox.
> One step is already done for you: the new **July 3 Bookmaker** odds export is parsed and staged
> (see Step 1c) — you only need to ingest it.

---

## What the report actually reads

`agents/futures-intel-report-v2.js` pulls from these tables, so each has a matching refresh step:

| Report input table | Refreshed by | Step |
|--------------------|--------------|------|
| `futures_odds_snapshots` | `futures-odds-ingest` + `win-totals-ingest` + the staged Bookmaker JSON | 1 |
| `research_intel_notes`, `research_pick_signals` | `research-intel-ingest` (RSS articles) | 2 |
| `podcast_episodes` (+ picks → `user_picks`) | `podcast-ingest` → `pick-extraction` | 3 |
| `x_sharp_tweets` | `x-sharp-ingest` (dormant — skip, see notes) | — |
| `vault_notes` (BETTING agent, not the futures report) | `intel-to-vault-sync` (optional) | 4 |

**Output of the report:** `.nfl\reports\FuturesIntel-<date>.html` (+ `.md`) locally, plus `futures_reports`
and `vault_notes` rows in Supabase.

---

## Prerequisites (run once at the start)

```powershell
cd E:\dev\projects\NFL_Dashboard
node -v            # any recent Node 18+
python --version   # 3.x, with python-docx only needed if you re-parse a docx (not needed here)
Test-Path .env     # must be True — holds SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ODDS_API_KEY, OPENAI_API_KEY, etc.
```

Every command is **dry-run first, then live**. Dry runs make no DB writes — use them to confirm a
step is healthy before committing rows.

---

## Step 1 — Odds

### 1a. Futures outrights — TheOddsAPI (now includes BetOnline)
```powershell
npm run ingest-futures:dry     # preview
npm run ingest-futures         # live write
```
**Offseason reality (verified 2026-07-15):** only the **Super Bowl Winner** market is open on
TheOddsAPI right now. Conference, division, win totals, playoffs, matchup, and awards all return
`404 unavailable` for every book — not a bug, those markets open ~Aug/preseason and will flow
automatically once sportsbooks post them.

**BetOnline is now automated.** `agents/futures-odds-ingest.js` was requesting the wrong key
(`betonline` — silently dropped by TheOddsAPI). Fixed to `betonlineag` (S273), with a
`BOOK_KEY_ALIAS` that stores it as `betonline` so API rows join the historical manual series.
Confirmed live: a healthy `npm run ingest-futures:dry` shows **128 SB rows = 4 books × 32 teams**
(DK / FanDuel / BetMGM / betonline). No more BetOnline screenshots for the SB market.
> `bookmaker` (Bookmaker.eu) and `caesars` in that book list are no-ops — Bookmaker.eu isn't on
> TheOddsAPI (import it manually, see 1c), and Caesars is `williamhill_us`, paid-plan-only.

### 1b. Win totals — TheOddsAPI (only if the market is open)
```powershell
npm run ingest-win-totals:dry  # if this shows 0 rows / "market not found", the season-wins
                               # market hasn't opened yet — skip 1b entirely this run.
npm run ingest-win-totals      # live, only if the dry run returned real lines
```

### 1c. Manual sharp-book exports — Bookmaker.eu (BKR) + BetUS
These books aren't on TheOddsAPI, so you export their futures pages as text and parse them locally.
**Three files are already parsed and staged for you** (just ingest — dry-run then live):
```powershell
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-03.json --dry-run
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-03.json
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-14.json --dry-run
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-14.json
python scripts\ingest_futures_json.py data\futures-imports\betus-2026-07-14.json --dry-run
python scripts\ingest_futures_json.py data\futures-imports\betus-2026-07-14.json
```
Row counts: bookmaker 07-03 = **160**, bookmaker 07-14 = **160**, betus 07-14 = **416**
(betus adds 256 SB-matchup rows). All extend the sharp-book line-movement series.

**Parsing a NEW BKR/BetUS drop yourself** (for next time) — put the exported text in
`docs\Futures_Odds\` and run:
```powershell
# Bookmaker (BKR):
node scripts\parse-futures-text.js --file docs\Futures_Odds\<BKR_file> --book bookmaker --out data\futures-imports\bookmaker-<YYYY-MM-DD>.json --date <YYYY-MM-DD>
# BetUS:
node scripts\parse-futures-text.js --file docs\Futures_Odds\<BetUS_file> --book betus --out data\futures-imports\betus-<YYYY-MM-DD>.json --date <YYYY-MM-DD>
```
Two BKR-format gotchas the parser is sensitive to — **check the market counts it prints**:
- **Playoffs need a `MAKE THE PLAYOFFS` divider line** above the per-team block. If a BKR export
  lists the 32 "… TO MAKE THE PLAYOFFS" lines with no divider (as the 07-03 file did), playoffs
  parse as **0** — prepend one `MAKE THE PLAYOFFS` line to a copy of the text and re-parse.
- **Alternate win totals**: if a BKR export lists 3 lines per team (o3.5/o4.5/o5.5…), `wins` comes
  back as ~95 instead of 32. Collapse to each team's **most balanced main line** (min
  |implied_over − implied_under|) before ingest, or the one-row-per-team unique index keeps a random
  juiced line. The 07-14 file was already collapsed this way.

---

## Step 2 — Articles (research intel)

Pulls the latest items from the betting/analytics RSS feeds (Action Network, BettingPros, VSiN,
Sharp Football, ESPN, etc.) into `research_intel_notes`.
```powershell
npm run ingest-research-intel:dry
npm run ingest-research-intel
```
Optional deeper pull (fetches full article bodies — slower, more API use):
```powershell
$env:INTEL_FETCH_BODY='true'; npm run ingest-research-intel; Remove-Item Env:\INTEL_FETCH_BODY
```

---

## Step 3 — Podcasts

Polls the active podcast feeds, transcribes new episodes, and extracts picks. With no
`GROQ_API_KEY` set, transcription uses your OpenAI (Whisper) / AssemblyAI cloud path — this works
on Windows but is the slow step (each episode = download + transcribe + GPT extraction).

```powershell
# Dry run (no writes) — confirm it finds feeds/episodes:
$env:DRY_RUN='true'; node agents\podcast-ingest.js; Remove-Item Env:\DRY_RUN

# Live — default processes up to 3 new episodes per run:
node agents\podcast-ingest.js
#   To pull more in one pass:  $env:MAX_PER_RUN='6'; node agents\podcast-ingest.js; Remove-Item Env:\MAX_PER_RUN
```

Then promote the extracted picks into `user_picks` (idempotent — safe to re-run):
```powershell
node agents\pick-extraction.js
```

> If podcast transcription stalls or burns too much API budget, you can skip Step 3 and still get a
> full odds+articles report — the podcast section just won't have this week's new episodes.

---

## Step 4 — Intel → Vault sync (optional)

Not required for the futures report (it reads `research_intel_notes` directly), but it closes the
loop for the BETTING agent's per-team vault notes. Run it if you want the vault current too:
```powershell
node agents\intel-to-vault-sync.js --dry-run
node agents\intel-to-vault-sync.js
```

---

## Step 5 — Generate the Futures Report

Smoke-test the layout offline first (no DB, exercises every section), then the real run:
```powershell
npm run futures-report:sample   # offline layout smoke test — should print all sections
npm run futures-report:dry      # real data, no DB write — preview counts
npm run futures-report          # live: writes .nfl\reports + Supabase futures_reports/vault_notes
```
Open the result:
```powershell
$r = Get-ChildItem .nfl\reports\FuturesIntel-*.html | Sort-Object LastWriteTime | Select-Object -Last 1
Start-Process $r.FullName
```

---

## Step 6 — Verify

1. **All 7–8 categories present** in the HTML: Super Bowl, Conference (AFC/NFC), Divisions (all 8),
   Total Wins, Playoffs, plus Most/Least Wins and SB Matchup where data exists.
2. **Fresh columns** show the 2026-07-14 snapshots (bookmaker + betus) and trend sparklines extend
   to 07-14; the `betonline` column now populates from the API for the SB market.
3. **Odds coverage** (run in Supabase SQL editor):
   ```sql
   select book, snapshot_time::date, count(*)
   from futures_odds_snapshots
   group by 1,2 order by 1,2;
   ```
   You should see `bookmaker … 2026-07-14 … 160`, `betus … 2026-07-14 … 416`, and a fresh
   `betonline … <today>` row from the API.
4. **Intel/podcast counts** — the report's "Signal Sources" section should list this run's new
   article + podcast counts (non-zero if Steps 2–3 ran).

---

## Notes & gotchas

- **PowerShell ≠ bash.** No heredocs. Use the `.py`/`.js` scripts as shown; set env vars with
  `$env:NAME='x'` and clear with `Remove-Item Env:\NAME`.
- **Empty Value Spots is correct offseason** — divergence needs public books on non-SB markets,
  which aren't open yet.
- **`x-sharp-ingest` is dormant** (needs self-hosted RSSHub on M6) — skip it this session; the
  report tolerates an empty `x_sharp_tweets` table.
- **Don't edit `futures-intel-report-v2.js`.** If layout looks off, the fix lives in the
  `CATEGORIES` array per `docs/FUTURES_REPORT_SPEC.md` — not in `renderHtml()`.
- **Verifying the API key from PowerShell?** `.env` is only auto-loaded by the node/python scripts
  (via dotenv), NOT into your shell — so `$env:ODDS_API_KEY` is blank in a bare `curl`. Either load
  it first (`$env:ODDS_API_KEY = ((Get-Content .env | Where-Object {$_ -match '^ODDS_API_KEY='}) -replace '^ODDS_API_KEY=','').Trim()`)
  or run the check through node so dotenv fills it in.
- **Commit natively when done.** Tracked files from S273: `data\futures-imports\bookmaker-2026-07-03.json`,
  `data\futures-imports\bookmaker-2026-07-14.json`, `data\futures-imports\betus-2026-07-14.json`, and
  the `agents\futures-odds-ingest.js` BetOnline fix. Add them in a native `git add` + commit (the raw
  `docs\Futures_Odds\*` exports are gitignored and won't/shouldn't be committed). Do not commit from
  the sandbox.

---

## TL;DR — the confident one-shot sequence

```powershell
cd E:\dev\projects\NFL_Dashboard
npm run ingest-futures            # now includes BetOnline (SB market) automatically
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-03.json
python scripts\ingest_futures_json.py data\futures-imports\bookmaker-2026-07-14.json
python scripts\ingest_futures_json.py data\futures-imports\betus-2026-07-14.json
npm run ingest-win-totals:dry     # run live only if it shows real lines
npm run ingest-research-intel
node agents\podcast-ingest.js
node agents\pick-extraction.js
npm run futures-report
# then open .nfl\reports\FuturesIntel-<today>.html
```
