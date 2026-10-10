# Handoff: Automated BetOnline.ag NFL Prop & Line Capture Pipeline
**Date:** October 9, 2026  
**From:** Antigravity (Pair Programming Session)  
**To:** Next Engineering Session / Antigravity Agent  
**Goal:** Replicate the proven, zero-password automated CDP capture architecture from Bookmaker.eu for **BetOnline.ag** (`sports.betonline.ag`).

---

## 1. Executive Summary & Proven Architecture Pattern

In our preceding session, we successfully built and verified an end-to-end automated extraction pipeline for **Bookmaker.eu** (`bkrp` / `scripts/props/cron-bkr-scrape.mjs`), which parsed over 5,300 prop and game-line rows across all 14 remaining Week 5 matchups without human intervention.

We want to apply the exact same architectural principles to **BetOnline.ag**:
1. **Password-Free Persistent Browser Profile:** Launch a dedicated Chrome instance with `--remote-debugging-port` and `--user-data-dir=.chrome-bol`. The operator logs in once and clears Cloudflare/bot mitigations manually. Credentials are never handled by scripts.
2. **Chrome DevTools Protocol (CDP):** An automated Node.js runner (`cron-bol-scrape.mjs`) connects to the running Chrome instance over CDP.
3. **Zero-Reload In-Page / Background Iframe Runner:** Instead of navigating the main tab and losing JavaScript state or triggering rate-limits, the runner discovers all matchup URLs and extracts them sequentially inside an invisible background iframe or in-page DOM navigator.
4. **Calendar-Anchored Week Determination:** Auto-determines the current NFL regular season week dynamically from system time (Week 1 = Tuesday Sept 8, 2026).
5. **Standardized Schema & Source Evidence Mirroring:**
   - `data/generated/props/betonline-live-YYYY-MM-DD-weekN.json`
   - `data/research-intel/source-evidence/YYYY-MM-DD-betonline-weekN-props-parsed.json`
   - `data/research-intel/source-evidence/YYYY-MM-DD-bol-live-weekN.raw.txt`
6. **Collision-Free Aliases:** Global PowerShell function and `.cmd` wrapper:
   - Short alias: **`bolp`** (BetOnline Props)
   - Long alias: **`runbolprops`**

---

## 2. BetOnline Target Analysis & Site Characteristics

### URLs to Investigate
- Main Sportsbook: `https://www.betonline.ag/sportsbook` or `https://sports.betonline.ag/`
- NFL Game Lines: `https://sports.betonline.ag/sportsbook/football/nfl`
- NFL Player Props / Same Game Parlays:
  - Check whether BetOnline embeds props directly inside matchup accordion rows or provides a dedicated props page / SGP builder modal (e.g. `Mega Parlay` / `Same Game Parlay` builder).
  - Note whether BetOnline uses a third-party prop engine (e.g. BetConstruct, Altenar, Digital Sports Tech, or proprietary).

### Key Differences & Investigation Checklist for Next Session
1. **Port Configuration:**
   - Bookmaker uses CDP port `9222` with profile `.chrome-bkr`.
   - For BetOnline, use CDP port **`9223`** with profile directory **`.chrome-bol`** (or share port 9222 if running sequentially, but a distinct port allows concurrent runs).
   - Ensure `.chrome-bol` is added to [`.gitignore`](file:///E:/dev/projects/NFL_Dashboard/.gitignore).
2. **DOM Hierarchy & Dynamic Discovery:**
   - Inspect the schedule board to see how games are represented in the DOM (e.g. `div.event-row`, `a[href*="/nfl/"]`, or matchup IDs).
   - Determine how player props are loaded:
     - Are props loaded via sub-routes (e.g. `/sportsbook/football/nfl/player-props` or `/event/<id>`)?
     - Or does clicking a game open a tabbed drawer with categories: `Passing`, `Rushing`, `Receiving`, `Touchdowns`?
3. **WebSocket vs REST Endpoints:**
   - Check Network tab in DevTools: Does BetOnline use REST JSON endpoints (e.g. `api/sports/offering/...`) or WebSocket pushes? If clean REST endpoints exist that carry the cookies, CDP can evaluate direct `fetch()` calls from the authenticated page context.

---

## 3. Required File Artifacts to Build

Follow the structure established in Bookmaker:

| Purpose | Bookmaker Reference (Template) | BetOnline Target File |
|---|---|---|
| Browser Extractor (Console) | `scripts/props/bookmaker-sgp-extract.browser.js` | `scripts/props/betonline-prop-extract.browser.js` |
| Automated CDP Cron Runner | `scripts/props/cron-bkr-scrape.mjs` | `scripts/props/cron-bol-scrape.mjs` |
| Dump Parser | `scripts/props/bookmaker-sgp-dump-parse.mjs` | `scripts/props/betonline-prop-dump-parse.mjs` |
| Chrome Launcher (PS1) | `scripts/props/launch-bkr-browser.ps1` | `scripts/props/launch-bol-browser.ps1` |
| Chrome Launcher (BAT) | `scripts/props/launch-bkr-browser.bat` | `scripts/props/launch-bol-browser.bat` |
| Task Scheduler Registration | `scripts/props/register-bkr-cron.ps1` | `scripts/props/register-bol-cron.ps1` |
| Batch Wrapper | `bkrp.cmd`, `runbkrprops.cmd` | `bolp.cmd`, `runbolprops.cmd` |
| Skill Documentation | `skills/bookmaker-sgp-capture/SKILL.md` | `skills/betonline-prop-capture/SKILL.md` |
| Agent Skill Mirror | `.agents/skills/bookmaker-sgp-capture/` | `.agents/skills/betonline-prop-capture/` |

---

## 4. Immediate Step-by-Step Guide for the Fresh Session

### Step 1: Launch Persistent Chrome Session for BetOnline
Create and run `scripts/props/launch-bol-browser.ps1`:
```powershell
$ProfileDir = "E:\dev\projects\NFL_Dashboard\.chrome-bol"
$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $ChromePath --remote-debugging-port=9223 --user-data-dir="$ProfileDir" "https://sports.betonline.ag/sportsbook/football/nfl"
```
- Verify operator can access BetOnline, pass Cloudflare challenge, and log in (if required for full market visibility).

### Step 2: DOM Reconnaissance (Operator or Playwright Inspector)
Inspect the active page via CDP:
1. What selector discovers all NFL matchups on the board?
2. Where are the Anytime Touchdown, Passing Yards, Rushing Yards, and Receiving Yards props housed?
3. Can matchups be loaded via background iframe (`#bol_extractor_iframe`), or should the script navigate between tabs/subviews?

### Step 3: Implement `betonline-prop-extract.browser.js`
- Adapt the Bookmaker iframe/extractor logic to BetOnline's DOM structure.
- Ensure progress is logged clearly to the console (`[1/14] Loading ...`, `[1/14] Captured ...`).
- Save a clean, line-delimited or structured text dump automatically upon completion.

### Step 4: Implement `cron-bol-scrape.mjs`
- Connect via `chromium.connectOverCDP('http://127.0.0.1:9223')`.
- Target the existing BetOnline tab or open one.
- Evaluate the extraction script, retrieve the raw dump, write to `data/generated/props/`, and invoke the parser.

### Step 5: Implement `betonline-prop-dump-parse.mjs`
- Normalize market keys into standard project conventions:
  - `pass_yds`, `pass_cmp`, `pass_td`, `rush_yds`, `carries`, `rec_yds`, `rec`, `atd_1_plus`, `first_td`, `game_lines`, `first_half_lines`.

### Step 6: Aliases & Profile Setup
Add to PowerShell profile:
```powershell
# NFL Dashboard BetOnline Prop Extractor Aliases
function runbolprops { node E:\dev\projects\NFL_Dashboard\scripts\props\cron-bol-scrape.mjs @args }
function bolp        { node E:\dev\projects\NFL_Dashboard\scripts\props\cron-bol-scrape.mjs @args }
```
Create root wrapper `bolp.cmd` and `runbolprops.cmd`.

---

## 5. Strict Guardrails & Safety Commitments
- **Zero Credential Storage:** Never request, store, or write BetOnline usernames or passwords. Authentication remains strictly local in the persistent Chrome session.
- **Zero Supabase Writes:** This pipeline produces local JSON files for evidence and analytics only.
- **Read-Only / No Betting:** The scraper only inspects odds and prop offerings; it does not place wagers, submit betslips, or alter bankroll state.
- **Clean Git Hygiene:** Ensure `.chrome-bol` is included in `.gitignore`.
