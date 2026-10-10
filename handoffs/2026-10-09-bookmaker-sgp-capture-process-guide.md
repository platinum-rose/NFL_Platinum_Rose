# Process Guide & Handoff: Automated Bookmaker.eu SGP & Prop Board Extraction

**Date:** 2026-10-09 PT  
**From:** Antigravity / Committee Operations  
**To:** Claude Team, Codex Team, & Future Agents  
**Repository / Branch:** `E:\dev\projects\NFL_Dashboard` (`main`)  
**Skill Reference:** `.agents/skills/bookmaker-sgp-capture/SKILL.md`  

---

## 1. Context & Purpose

This document provides a complete operational guide for capturing, extracting, and parsing live offshore **Same Game Parlay (SGP) and player prop boards** from **Bookmaker.eu (`be.bookmaker.eu`)** throughout the NFL week.

In the Week 5 master intel audit, the Codex committee noted a dependency on verified Bookmaker offshore prop lines and SGP correlation data. Because Bookmaker is a real-money bookmaker protected by **Cloudflare Challenge Platform** and rendered via an **Angular Single-Page Application (SPA)**, direct headless scrapers receive an empty SPA shell with a loading spinner. 

We solved this by developing an **automated, zero-reload background-iframe extraction runner** that runs inside an authenticated browser session, iterates dynamically across all published matchups, and outputs structured, queryable JSON boards.

---

## 2. Ingestion Results (Week 5 Verified Baseline)

The extraction run completed on **2026-10-09 at 5:07 PM PT** captured all **14 remaining scheduled games**:

- **Total Market Rows Parsed:** **5,333**
- **Consolidated Master Board:** `data/generated/props/bookmaker-live-2026-10-09-week5.json` (2.41 MB)
- **Codex Research Mirror:** `data/research-intel/source-evidence/2026-10-09-bookmaker-week5-sgp-parsed.json`
- **Raw Text Dump:** `data/research-intel/source-evidence/2026-10-09-bkr-sgp-live-week5.raw.txt`

### Slate-Wide Breakdown by Game

| Matchup | Total Rows | Passing TDs | Anytime TDs | First TDs | 2+ / 3+ TDs |
|---|:---:|:---:|:---:|:---:|:---:|
| **Philadelphia Eagles @ Jacksonville Jaguars** | 451 | 4 | 0 | 0 | 0 |
| **Indianapolis Colts @ Pittsburgh Steelers** | 311 | 4 | 25 | 0 | 0 |
| **Minnesota Vikings @ New Orleans Saints** | 237 | 3 | 0 | 0 | 0 |
| **Cleveland Browns @ New York Jets** | 466 | 4 | 26 | 26 | 0 |
| **Cincinnati Bengals @ Miami Dolphins** | 318 | 2 | 0 | 25 | 0 |
| **Las Vegas Raiders @ New England Patriots** | 416 | 4 | 0 | 0 | 0 |
| **New York Giants @ Washington Commanders** | 327 | 2 | 0 | 0 | 0 |
| **Houston Texans @ Tennessee Titans** | 592 | 4 | 0 | 0 | 28 |
| **Denver Broncos @ Los Angeles Chargers** | 498 | 4 | 26 | 26 | 26 |
| **San Francisco 49ers @ Seattle Seahawks** | 64 | 0 | 0 | 0 | 0 |
| **Detroit Lions @ Arizona Cardinals** | 443 | 4 | 0 | 0 | 0 |
| **Chicago Bears @ Green Bay Packers** | 261 | 2 | 0 | 0 | 0 |
| **Baltimore Ravens @ Atlanta Falcons** | 427 | 4 | 0 | 0 | 0 |
| **Buffalo Bills @ Los Angeles Rams** | 522 | 4 | 28 | 28 | 28 |
| **Total (14 Games)** | **5,333** | **132** | **105** | **105** | **82** |

*(Note on Zeros: Bookmaker posts Anytime TD scorer grids in waves. At 5:07 PM Friday, Anytime TD props were posted for Colts-Steelers, Browns-Jets, Broncos-Chargers, and Bills-Rams. The remaining games are scheduled to be released late Friday night / Saturday morning following final injury reports).*

---

## 3. How the Process Works (Technical Architecture)

```mermaid
flowchart TD
    A["User Browser (Logged-in at be.bookmaker.eu)"] -->|1. Paste Runner Script into DevTools Console| B["scripts/props/bookmaker-sgp-extract.browser.js"]
    B -->|2. Scans DOM for all published -vs- links| C["Discovered Game URLs Queue"]
    B -->|3. Creates invisible background iframe| D["#bkr_extractor_iframe (1280x900)"]
    D -->|4. Loads Matchup sequentially| E["Wait for div.prop-grid hydration (1-2s)"]
    E -->|5. Extracts EVENT, Title (T), Selection (I)| F["In-Memory Accumulator"]
    F -->|6. All games complete| G["Auto-downloads bkr-sgp-live-YYYY-MM-DD.txt"]
    G -->|7. Terminal CLI Execution| H["scripts/props/bookmaker-sgp-dump-parse.mjs"]
    H -->|8. Normalized JSON generation| I["data/generated/props/bookmaker-live-YYYY-MM-DD-weekN.json"]
    I -->|9. Research Registry Mirror| J["data/research-intel/source-evidence/"]
```

### Key Technical Safeguards:
1. **Zero Tab Reloads:** Traditional navigation (`window.location.href`) terminates script execution because the tab reloads. By loading games into a hidden `<iframe>` on the same origin (`X-Frame-Options: None`), the parent script executes uninterrupted across the entire slate.
2. **Dynamic Discovery:** Matches `a[href*="-vs-"]` dynamically, automatically adjusting for any games that move, air early, or are posted late.
3. **Safe & Read-Only:** The script only reads text from `.team-names`, `.sports-league-banner`, and `.prop-item`. It never clicks odds, interacts with betslips, or places wagers.

---

## 4. How Claude and Codex Can Run It

When Claude or Codex needs an updated offshore prop board or a Saturday morning refresh:

### Step 1: Instruct the User to Run the Console Extractor
Ask the user to:
1. Navigate in their browser to: `https://be.bookmaker.eu/en/sports/football/nfl/game-lines/`
2. Open DevTools Console (`F12`), paste the content of [`scripts/props/bookmaker-sgp-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/bookmaker-sgp-extract.browser.js), and press Enter.
3. The script will run automatically for ~45 seconds and download `bkr-sgp-live-YYYY-MM-DD.txt`.

### Step 2: Ingest and Parse the Downloaded File
Once downloaded, the agent copies the file to `data/generated/props/bookmaker-live-<date>-week<week>.raw.txt` and runs:

```bash
node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-2026-10-09-week5.raw.txt --date 2026-10-09 --week 5
```

### Step 3: Mirror the Output for Codex/Committee Access
```bash
Copy-Item "data/generated/props/bookmaker-live-2026-10-09-week5.json" "data/research-intel/source-evidence/2026-10-09-bookmaker-week5-sgp-parsed.json"
```

---

## 5. Standardized Market Schema (`bookmaker_live_markets_v1`)

Every parsed prop row contains:
```json
{
  "book": "BKR",
  "event": "Indianapolis Colts @ Pittsburgh Steelers",
  "eventUrl": "https://be.bookmaker.eu/en/sports/football/nfl/game-lines/indianapolis-colts-vs-pittsburgh-steelers/",
  "sectionTitle": "Colts vs Steelers: Daniel Jones Total Passing Yards",
  "market": "pass_yds",
  "source": "bookmaker_live_dom",
  "capturedAt": "2026-10-10T00:04:42.780Z",
  "selection": "Daniel Jones - Over 224.5-109",
  "player": "Daniel Jones",
  "side": "Over",
  "line": 224.5,
  "odds": -109,
  "available": true
}
```

### Standardized Market Keys:
- `pass_yds`: Passing yards over/under and alt ladders
- `pass_cmp`: Pass completions
- `pass_td`: Passing touchdowns
- `rush_yds`: Rushing yards over/under and alt ladders
- `carries`: Rush attempts
- `rec_yds`: Receiving yards over/under and alt ladders
- `rec`: Receptions
- `atd_1_plus`: Anytime touchdown scorer
- `first_td`: First touchdown scorer
- `td_2_plus` / `td_3_plus`: Multi-touchdown scorers
- `game_lines` / `first_half_lines` / `first_quarter_lines`: Sides, totals, moneylines

---

## 6. Maintenance & Recurring Schedule

- **Midweek:** Initial lines and QB passing yards.
- **Friday Afternoon (~17:00 PT):** Initial full prop board (captured above).
- **Saturday Morning (~10:00 PT):** Wave 2 refresh — captures newly posted Anytime TD scorers for remaining games and late injury adjustments.
- **Sunday Morning (~09:15 PT):** Pre-kickoff inactives check.
