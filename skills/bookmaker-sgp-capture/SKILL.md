---
name: bookmaker-sgp-capture
description: Automated workflow to discover, extract, and parse live Bookmaker.eu SGP player prop boards and game lines for all current NFL matchups.
---

# Bookmaker.eu SGP & Prop Board Automated Capture

**When to Activate:**
- When capturing, updating, or auditing live Same Game Parlay (SGP) and player prop lines from Bookmaker.eu.
- Running the Saturday morning prop refresh (when secondary markets and remaining Anytime Touchdown props are released).
- Fulfilling Codex/Claude committee requirements for verified Bookmaker offshore prop pricing.

---

## 1. Architectural Overview & Cloudflare Bypass

Bookmaker.eu (`be.bookmaker.eu`) utilizes:
1. **Cloudflare Challenge Platform** bot mitigation.
2. An **Angular Single-Page Application (SPA)** that dynamically renders odds via WebSocket (`wss://app.bookmaker.eu/handlers/RealTimeHandler.ashx`) and proxy endpoints.

Because headless backend fetches (curl, python requests, standard headless playwright) are blocked by Cloudflare, the capture is executed **inside the authenticated user's browser session via a non-reloading background iframe runner**:
- **Zero Tab Reloads:** The script creates an invisible background iframe (`#bkr_extractor_iframe`), loads each published matchup sequentially, waits for DOM hydration (`div.prop-grid .sgp-badge`), and extracts the structured text.
- **Dynamic Discovery:** It auto-scans all `-vs-` matchup links directly from the active game-lines page, supporting any schedule changes or staggered game releases.
- **Auto-Download:** When the final matchup finishes, it automatically compiles and downloads the raw text dump `bkr-sgp-live-YYYY-MM-DD.txt`.

---

## 2. Step-by-Step Operator Workflow

### Step 1: Open the Bookmaker NFL Game Lines Board
In your browser, navigate to:
```
https://be.bookmaker.eu/en/sports/football/nfl/game-lines/
```
Ensure you are logged in or have cleared any Cloudflare challenge.

### Step 2: Run the Automated Extractor in Console
1. Press `F12` (or right-click -> **Inspect**) and switch to the **Console** tab.
2. Copy and paste the entire content of:
   [`scripts/props/bookmaker-sgp-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/bookmaker-sgp-extract.browser.js)
3. Press **Enter**.

The script will log progress in the console:
```text
🚀 Starting automated SGP extraction across 14 games via hidden iframe...
⏳ [1/14] Loading /en/sports/football/nfl/game-lines/philadelphia-eagles-vs-jacksonville-jaguars/...
✅ [1/14] Captured Philadelphia Eagles @ Jacksonville Jaguars (451 lines)
...
🎉 Complete! Successfully captured 14/14 games.
📁 Downloaded: bkr-sgp-live-2026-10-09-week5.txt
```

### Step 3: Save the Dump to the Repository
Move or copy the downloaded file from your Downloads folder into:
```
data/research-intel/source-evidence/bkr-sgp-live-YYYY-MM-DD-weekN.raw.txt
```
*(Also mirrored to `data/generated/props/bookmaker-live-YYYY-MM-DD-weekN.raw.txt`).*

### Step 4: Run the Structured Parser
From the terminal, run the Node parser:
```bash
node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-YYYY-MM-DD-weekN.raw.txt --date YYYY-MM-DD --week N
```

Example for Week 5:
```bash
node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-2026-10-09-week5.raw.txt --date 2026-10-09 --week 5
```

---

## 3. Output Artifacts & Registries

The parser generates structured JSON following the `bookmaker_live_markets_v1` schema:

1. **Slate-Wide Consolidated JSON:**
   `data/generated/props/bookmaker-live-<date>-week<N>.json`  
   *(Over 5,000+ structured market rows covering sides, totals, moneylines, props, and SGPs).*
2. **Mirror for Codex Research Pipeline:**
   `data/research-intel/source-evidence/<date>-bookmaker-week<N>-sgp-parsed.json`
3. **Per-Matchup Dedicated JSONs:**
   `data/generated/props/bookmaker-live-<date>-<away>-at-<home>.json`

---

## 4. Market Key Reference

The parser extracts and normalizes the following standardized market keys:

| Market Key | Market Description | Example Line / Selection |
|---|---|---|
| `pass_yds` | Player Passing Yards Over/Under & Ladders | `Daniel Jones - Over 224.5 -109` |
| `pass_cmp` | Player Pass Completions Over/Under | `Brock Purdy - Under 21.5 -115` |
| `pass_td` | Quarterback Passing Touchdowns | `Jalen Hurts - Over 1.5 -125` |
| `rush_yds` | Player Rushing Yards Over/Under & Ladders | `Jonathan Taylor - Over 74.5 -114` |
| `carries` | Player Rush Attempts / Carries | `Derrick Henry - Over 18.5 -110` |
| `rec_yds` | Player Receiving Yards Over/Under & Ladders | `Jaxon Smith-Njigba 80+ +120` |
| `rec` | Player Receptions Over/Under | `Michael Wilson - Over 4.5 -105` |
| `atd_1_plus` | Anytime Touchdown Scorer (1+ TD) | `Josh Allen - Yes +110` |
| `first_td` | First Touchdown Scorer | `Bijan Robinson - Yes +450` |
| `td_2_plus` | Player to Score 2+ Touchdowns | `Derrick Henry - Yes +320` |
| `td_3_plus` | Player to Score 3+ Touchdowns | `Derrick Henry - Yes +1200` |
| `game_lines` | Game Spread, Total, and Moneyline | `Indianapolis Colts +3 -118` |
| `first_half_lines` | First Half Spread, Total, ML | `Pittsburgh Steelers -1.5 -103` |
| `first_quarter_lines` | First Quarter Spread, Total, ML | `Colts +0.5 -110` |

---

## 5. Fully Automated Cron / CLI Execution (Password-Free)

For hands-free recurring extraction throughout the week without manually pasting code into DevTools:

### Step 1: Launch Persistent Chrome Session (Once)
```bash
npm run props:bkr:launch
```
This opens a dedicated Chrome profile (`.chrome-bkr`) with remote debugging enabled on port 9222. Log into Bookmaker.eu once in this window; cookies and Cloudflare clearance will persist.

### Step 2: Run Automated Scraper & Parser On-Demand
You can use any of the short aliases from anywhere:
```bash
bkrp
# or: runbkrprops
# or: npm run bkrp
```
This script (`scripts/props/cron-bkr-scrape.mjs`):
1. Connects to the running Chrome instance over CDP (port 9222).
2. Auto-discovers all published NFL matchups on the board.
3. Extracts all SGP and game-line prop grids via the background iframe.
4. Saves raw dumps to `data/generated/props/` and `data/research-intel/source-evidence/`.
5. Runs the parser and outputs `bookmaker-live-<date>-week<week>.json`.

### Step 3: Register Recurring Background Cron (Windows Task Scheduler)
Run PowerShell as Administrator to schedule the scraper automatically:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/props/register-bkr-cron.ps1 -IntervalHours 3
```
- Runs automatically in the background every 3 hours.
- Does not require entering or storing passwords.
- Cloudflare-safe and bankroll-safe.

---

## 6. Sportsbook Release Timing & Re-Run Guidance

- **Wave 1 (Midweek - Friday Afternoon):** Game lines, quarter/half lines, passing/rushing/receiving yardage props, and QB passing TDs are posted.
- **Wave 2 (Friday Evening - Saturday Morning):** Anytime Touchdown (`atd_1_plus`), First TD (`first_td`), and late game props (e.g. SNF/MNF) are added once Friday practice injury designations are final.
- **Wave 3 (Sunday Morning ~09:15 PT):** Pre-kickoff injury inactives and final line shifts.
- **Re-running:** `npm run props:bkr:cron` overwrites previous versions cleanly without creating stale duplicates.
