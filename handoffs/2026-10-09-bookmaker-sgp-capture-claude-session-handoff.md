# Handoff: Bookmaker.eu SGP & Prop Board Capture Pipeline (For Claude Team)

**Date:** 2026-10-09 PT  
**From:** Antigravity Engineering  
**To:** Claude Team (Fresh Session Onboarding)  
**Repository / Working Directory:** `E:\dev\projects\NFL_Dashboard` (`main`)  
**Shared Skill Location:** `.agents/skills/bookmaker-sgp-capture/SKILL.md`  
**Browser Script:** `scripts/props/bookmaker-sgp-extract.browser.js`  
**Purpose:** End-to-end verification and execution protocol for capturing, extracting, and parsing live Bookmaker.eu Same Game Parlay (SGP) and player prop boards.

---

## 1. Executive Context & Architecture

Bookmaker.eu (`be.bookmaker.eu`) is our primary offshore bookmaker for market pricing and SGP correlation data. Because Bookmaker operates behind **Cloudflare Challenge Platform** and renders its odds dynamically via an **Angular Single-Page Application (SPA)** connecting to a private WebSocket backend (`wss://app.bookmaker.eu/handlers/RealTimeHandler.ashx`), direct automated HTTP/headless requests (curl, python `requests`, headless Playwright) receive only an empty HTML shell with a loading spinner.

To bypass this without breaking session security, we use an **agent-assisted, zero-tab-reload background iframe runner**:
1. The user opens `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/` in their own authenticated browser.
2. The user pastes the automated runner script into the DevTools Console.
3. The script dynamically detects all currently published NFL matchup URLs, loads them one by one inside an invisible background iframe, waits for odds hydration, extracts the DOM prop grids, and triggers an automatic text download (`bkr-sgp-live-YYYY-MM-DD-weekN.txt`).
4. Claude ingests the raw dump, runs the parser CLI, validates the structured JSON output, and surfaces the prop universe to downstream betting and narrative pipelines.

---

## 2. Division of Labor (Claude vs. Operator)

| Task | Responsible Role | Action |
|---|---|---|
| **1. Browser Navigation** | Operator (Andy) | Open `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/` in Chrome/Edge. |
| **2. Console Runner** | Operator (Andy) | Paste [`scripts/props/bookmaker-sgp-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/bookmaker-sgp-extract.browser.js) into DevTools Console and press Enter. |
| **3. Dump Ingestion** | Claude | Detect the downloaded file from `C:\Users\andre\Downloads` or repo root, move/copy to `data/generated/props/` and `data/research-intel/source-evidence/`. |
| **4. JSON Parsing** | Claude | Run `node scripts/props/bookmaker-sgp-dump-parse.mjs`. |
| **5. Validation & Audit** | Claude | Verify row counts, check market distributions, flag any delayed/missing markets, and generate summary report. |

---

## 3. Step-by-Step Execution Guide for Claude

When starting your session to test or run this workflow:

### Step 1: Prompt the Operator to Trigger the Browser Runner
Provide the user with this concise instruction:
> *"Andy, please open `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/` in your browser, open the DevTools Console (`F12`), paste the contents of `scripts/props/bookmaker-sgp-extract.browser.js`, and press Enter. It will run in the background for ~45 seconds and automatically download `bkr-sgp-live-<YYYY-MM-DD>-week<N>.txt` to your Downloads folder. Let me know once the download finishes."*

*(If the user needs the raw script directly in chat, the full script is located at [`scripts/props/bookmaker-sgp-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/bookmaker-sgp-extract.browser.js)).*

### Step 2: Ingest the Raw Downloaded File
Once the user confirms the download, locate the file in `C:\Users\andre\Downloads` or the repo root and copy it into the standard repo locations:
```powershell
# In PowerShell:
$latestFile = Get-ChildItem -Path "C:\Users\andre\Downloads" -Filter "bkr-sgp-live-*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Copy-Item $latestFile.FullName "data\research-intel\source-evidence\2026-10-09-bkr-sgp-live-week5.raw.txt"
Copy-Item $latestFile.FullName "data\generated\props\bookmaker-live-2026-10-09-week5.raw.txt"
```

### Step 3: Run the Structured Parser CLI
Execute the committed Node parser:
```bash
node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-2026-10-09-week5.raw.txt --date 2026-10-09 --week 5
```

### Step 4: Mirror the Master JSON for Downstream Research
```powershell
Copy-Item "data/generated/props/bookmaker-live-2026-10-09-week5.json" "data/research-intel/source-evidence/2026-10-09-bookmaker-week5-sgp-parsed.json"
```

---

## 4. Verification & Validation Protocol

Claude must run an automated validation check on the generated JSON file:

```bash
python -c "
import json
with open('data/generated/props/bookmaker-live-2026-10-09-week5.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
print('Games captured:', d.get('games'))
print('Total rows:', len(d.get('rows', [])))
from collections import Counter
print('Top markets:', Counter(r.get('market') for r in d.get('rows', [])).most_common(10))
"
```

### Expected Benchmarks (Week 5 Baseline):
- **Games Captured:** 14 (all active Sunday/Monday games; Thursday completed games omitted).
- **Total Rows:** > 4,500 rows (baseline achieved: **5,333 rows**).
- **Key Markets Present:**
  - `rec_yds` (> 1,000 lines)
  - `rec` (> 800 lines)
  - `rush_yds` (> 600 lines)
  - `carries` (> 400 lines)
  - `pass_yds` (> 400 lines)
  - `pass_td` (Quarterback passing TDs across 13+ games)
  - `atd_1_plus` (Anytime TDs for games released so far)
  - `game_lines`, `first_half_lines`, `first_quarter_lines`

---

## 5. Known Quirks, Staggered Releases & Troubleshooting

1. **Why do some games show `td=0` in the parser console output?**
   - In `bookmaker-sgp-dump-parse.mjs`, `td=` strictly prints the count of `atd_1_plus` (*"Player To Score 1+ Touchdown"*).
   - It does **not** count Quarterback Passing TDs (`pass_td`), which are active for almost every game.
   - Offshore books release Anytime Touchdown scorer boards in waves (typically 4–5 marquee games on Friday afternoon, with the remainder posted late Friday night or Saturday morning after practice inactives are finalized). This is normal behavior, not a scraper defect.
2. **Why does SF @ SEA have fewer rows than other games?**
   - Bookmaker opened SF @ SEA late. Initial Friday boards contained only game lines and quarter lines (64 rows). The full player prop board is populated during Saturday morning's wave.
3. **What if the browser console logs `sgp directive ignored > leagueId: 1`?**
   - This is Bookmaker's internal Angular log confirming that NFL (league 1) SGP rules are active. It is not an error and does not affect extraction.
4. **Zero Tab Reloads is Mandatory:**
   - If the operator's tab reloads, the script stops. The production runner in `scripts/props/bookmaker-sgp-extract.browser.js` handles this safely by keeping the parent tab static and loading pages through an invisible `#bkr_extractor_iframe`.

---

## 6. Output Files & Downstream Integration

Upon completion, Claude should verify that these files exist and are populated:

1. **Consolidated Board JSON:**
   `data/generated/props/bookmaker-live-2026-10-09-week5.json`
2. **Mirror for Master Intel Research:**
   `data/research-intel/source-evidence/2026-10-09-bookmaker-week5-sgp-parsed.json`
3. **14 Dedicated Matchup JSONs:**
   `data/generated/props/bookmaker-live-2026-10-09-*.json`
4. **Raw Evidence Text Dump:**
   `data/research-intel/source-evidence/2026-10-09-bkr-sgp-live-week5.raw.txt`

### Strict Guardrail Reminders:
- **Zero Supabase Writes:** Do not write this data to Supabase.
- **Zero Bets / Tickets:** Read-only pricing extraction; do not alter official wagers, portfolios, or bankroll files.

---

## 7. Fully Automated Cron Execution (`npm run props:bkr:cron`)

In addition to the in-browser console workflow, the repository now features a **password-free automated runner** via Chrome DevTools Protocol (CDP port 9222):

1. **Launch Persistent Session:**
   ```bash
   npm run props:bkr:launch
   ```
   *(Launches Chrome with `.chrome-bkr` profile. Log in once; Cloudflare clearance & cookies persist).*
2. **Execute Scrape & Parse Automatically:**
   ```bash
   bkrp
   # or: runbkrprops
   # or: npm run bkrp
   ```
   *(Directly drives Chrome over CDP, auto-discovers all board matchups, extracts all SGP grids, and parses them into JSON without any manual copy-pasting).*
3. **Register Windows Task Scheduler Cron:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/props/register-bkr-cron.ps1 -IntervalHours 3
   ```

