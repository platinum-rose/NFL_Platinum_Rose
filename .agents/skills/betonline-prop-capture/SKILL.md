---
name: betonline-prop-capture
description: Automated workflow to discover, extract, and parse live BetOnline.ag NFL player props, alternate markets, and game lines for all current NFL matchups.
---

# BetOnline.ag NFL Prop & Line Automated Capture

**When to Activate:**
- When capturing, updating, or auditing live NFL player props and game lines from BetOnline.ag (`sports.betonline.ag`).
- Running the weekend prop refresh to intake BetOnline's passing, rushing, receiving, touchdown, and defensive proposition markets.
- Cross-referencing offshore prop pricing against Bookmaker.eu, DraftKings, and domestic books.

---

## 1. Architectural Overview & Cloudflare Bypass

BetOnline.ag (`sports.betonline.ag`) utilizes:
1. **Cloudflare Bot Mitigation / Turnstile** protection.
2. A **Dynamic Single-Page Application (SPA)** with real-time odds hydration and dynamic Same Game Parlay / Parlay Builder sub-routes.

Because headless backend fetches (standard curl, raw requests) are intercepted by Cloudflare, the capture is executed **inside the operator's authenticated browser session via a non-reloading background iframe runner**:
- **Zero Tab Reloads:** The runner creates an invisible background iframe (`#bol_extractor_iframe`), loads each published matchup sequentially, waits for DOM hydration (`Passing Yards`, `Passing Touchdowns`, `Spread`), and extracts the structured text.
- **Dynamic Discovery:** It auto-scans all active `/sportsbook/football/nfl/game/<id>` matchup links directly from the live board, automatically anchoring to the current NFL calendar week (Tuesday through Monday).
- **Auto-Download:** When run from DevTools Console, it compiles and automatically triggers download of `bol-live-YYYY-MM-DD-weekN.raw.txt`.
- **Zero Credentials Handled:** Authentication and Cloudflare verification remain 100% local within the persistent Chrome profile.

---

## 2. Step-by-Step Operator Workflow

### Step 1: Open the BetOnline NFL Board
In your persistent Chrome session (port 9223), navigate to:
```
https://sports.betonline.ag/sportsbook/football/nfl
```
Ensure you have cleared any Cloudflare challenge.

### Step 2: Run the Automated Extractor in Console (Manual Fallback)
1. Press `F12` (or right-click -> **Inspect**) and switch to the **Console** tab.
2. Copy and paste the entire content of:
   [`scripts/props/betonline-prop-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/betonline-prop-extract.browser.js)
3. Press **Enter**.

The script will log progress in the console:
```text
🚀 Starting automated BetOnline extraction for Week 5 across 14 games via background iframe...
⏳ [1/14] Loading Philadelphia Eagles @ Jacksonville Jaguars (/sportsbook/football/nfl/game/491141343)...
✅ [1/14] Captured Philadelphia Eagles @ Jacksonville Jaguars (559 lines)
...
🎉 Complete! Successfully captured 14/14 games for Week 5.
📁 Downloaded: bol-live-2026-10-09-week5.raw.txt
```

### Step 3: Run the Structured Parser
From the terminal, run the Node parser:
```bash
node scripts/props/betonline-prop-dump-parse.mjs --in data/generated/props/betonline-live-YYYY-MM-DD-weekN.raw.txt --date YYYY-MM-DD --week N
```

Example for Week 5:
```bash
node scripts/props/betonline-prop-dump-parse.mjs --in data/generated/props/betonline-live-2026-10-09-week5.raw.txt --date 2026-10-09 --week 5
```

---

## 3. Output Artifacts & Registries

The parser generates structured JSON following the `betonline_live_markets_v1` schema:

1. **Slate-Wide Consolidated JSON:**
   `data/generated/props/betonline-live-<date>-week<N>.json`  
   *(Consolidated market rows covering sides, totals, moneylines, props, and Parlay Builder lines).*
2. **Mirror for Research & Evidence Pipeline:**
   `data/research-intel/source-evidence/<date>-betonline-week<N>-props-parsed.json`
3. **Raw Text Evidence:**
   `data/research-intel/source-evidence/<date>-bol-live-week<N>.raw.txt`
4. **Per-Matchup Dedicated JSONs:**
   `data/generated/props/betonline-live-<date>-<away>-at-<home>.json`

---

## 4. Market Key Reference

The parser extracts and normalizes the following standardized project market keys:

| Market Key | Market Description | Example Line / Selection |
|---|---|---|
| `pass_yds` | Player Passing Yards Over/Under | `Over 190.5 Passing Yards -115` |
| `pass_cmp` | Player Pass Completions Over/Under | `Over 18.5 Completions -115` |
| `pass_td` | Quarterback Passing Touchdowns | `Over 0.5 Passing Touchdowns -200` |
| `pass_att` | Quarterback Passing Attempts | `Over 31.5 Passing Attempts -115` |
| `pass_int` | Interceptions Thrown | `Over 0.5 Interceptions Thrown -130` |
| `rush_yds` | Player Rushing Yards Over/Under | `Over 67.5 Rushing Yards -115` |
| `carries` | Player Rush Attempts / Carries | `Over 15.5 Rushing Attempts +100` |
| `rec_yds` | Player Receiving Yards Over/Under | `Over 10.5 Receiving Yards -115` |
| `rec` | Player Receptions Over/Under | `Over 1.5 Receptions -120` |
| `longest_completion` | Longest Completion Distance | `Over 31.5 Yards -115` |
| `longest_rush` | Longest Rush Distance | `Over 12.5 Yards -115` |
| `longest_rec` | Longest Reception Distance | `Over 18.5 Yards -115` |
| `atd_1_plus` | Anytime Touchdown Scorer | `Yes +140` |
| `first_td` | First Touchdown Scorer | `Yes +550` |
| `fantasy_points` | Fantasy Points (PPR) | `Over 8.5 Fantasy Points -115` |
| `game_lines` | Game Spread, Total, and Moneyline | `Philadelphia Eagles +7.5 -110` |
| `first_half_lines` | First Half Spread, Total, ML | `Philadelphia Eagles 1H +4 +100` |
| `first_quarter_lines` | First Quarter Spread, Total | `Philadelphia Eagles 1Q +2.5 -105` |

---

## 5. Fully Automated Cron / CLI Execution (Password-Free)

For hands-free recurring extraction throughout the week without manually pasting code into DevTools:

### Step 1: Launch Persistent Chrome Session (Once)
```bash
npm run props:bol:launch
```
or double-click `scripts/props/launch-bol-browser.bat`.
This opens a dedicated Chrome profile (`.chrome-bol`) with remote debugging enabled on port 9223. Clear any Cloudflare prompt once in this window; session cookies persist.

### Step 2: Run Automated Scraper & Parser On-Demand
You can use any of the short aliases from anywhere:
```bash
bolp
# or: runbolprops
# or: npm run bolp
# or: npm run props:bol:cron
```
This runner (`scripts/props/cron-bol-scrape.mjs`):
1. Connects to the running Chrome instance over CDP (port 9223).
2. Auto-discovers all published NFL matchups for the current week.
3. Extracts all player props and game-line markets via the background iframe.
4. Saves raw dumps to `data/generated/props/` and `data/research-intel/source-evidence/`.
5. Runs the parser and outputs `betonline-live-<date>-week<week>.json`.

### Step 3: Register Recurring Background Cron (Windows Task Scheduler)
Run PowerShell as Administrator to schedule the scraper automatically:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/props/register-bol-cron.ps1 -IntervalHours 3
```
- Runs automatically in the background every 3 hours.
- Does not require entering or storing passwords.
- Cloudflare-safe and read-only.
