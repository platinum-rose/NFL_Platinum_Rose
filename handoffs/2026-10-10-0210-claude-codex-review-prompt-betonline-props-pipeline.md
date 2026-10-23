# Codex Review Request — Automated BetOnline.ag NFL Prop & Line Capture Pipeline (Week 5 Baseline)

**Date:** October 9, 2026 (Evening PT) / October 10, 2026 (UTC)  
**From:** Antigravity / Claude Engineering Pair  
**To:** Codex Team / Independent Review Agent  
**Subject:** Independent Audit of Extracted Live Odds & Proposition Data from BetOnline.ag (`sports.betonline.ag`)

---

## 1. Context & Architecture Summary

To eliminate manual data entry and Cloudflare blocking during weekly NFL board reconciliation, we replicated the proven, password-free Chrome DevTools Protocol (CDP) architecture from **Bookmaker.eu** (`bkrp` / `cron-bkr-scrape.mjs`) for **BetOnline.ag**:

1. **Persistent Chrome Session (CDP Port 9223):** Launches a dedicated user profile (`.chrome-bol`) where the operator clears Cloudflare Turnstile once. Zero credentials are stored or handled in code.
2. **Zero-Reload In-Page Background Runner:** An invisible background iframe (`#bol_extractor_iframe`) traverses discovered matchups sequentially without navigating the main tab or dropping session state.
3. **Calendar-Anchored Dynamic Discovery:** Automatically calculates current NFL regular season week from system time (anchored to Tuesday Sept 8, 2026 for Week 1). Discovers all current-week matchups on `/sportsbook/football/nfl` while automatically filtering out advance lookahead slates (e.g., Week 6 TNF / next Sunday).
4. **End-to-End Execution Verified:** A test run of `bolp` (`scripts/props/cron-bol-scrape.mjs`) successfully extracted all **14 remaining Week 5 games** and parsed **676 proposition and game-line rows**.

---

## 2. Target Files for Review

### Pipeline Code
- **CDP Cron Runner:** [`scripts/props/cron-bol-scrape.mjs`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/cron-bol-scrape.mjs)
- **Dump Parser:** [`scripts/props/betonline-prop-dump-parse.mjs`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/betonline-prop-dump-parse.mjs)
- **Browser Extractor:** [`scripts/props/betonline-prop-extract.browser.js`](file:///E:/dev/projects/NFL_Dashboard/scripts/props/betonline-prop-extract.browser.js)
- **Skill Documentation:** [`skills/betonline-prop-capture/SKILL.md`](file:///E:/dev/projects/NFL_Dashboard/skills/betonline-prop-capture/SKILL.md)

### Extracted Evidence & Structured Data Artifacts
- **Slate Consolidated Master JSON:** [`data/generated/props/betonline-live-2026-10-10-week5.json`](file:///E:/dev/projects/NFL_Dashboard/data/generated/props/betonline-live-2026-10-10-week5.json)
- **Mirrored Research Intel JSON:** [`data/research-intel/source-evidence/2026-10-10-betonline-week5-props-parsed.json`](file:///E:/dev/projects/NFL_Dashboard/data/research-intel/source-evidence/2026-10-10-betonline-week5-props-parsed.json)
- **Verbatim Raw Text Dump:** [`data/research-intel/source-evidence/2026-10-10-bol-live-week5.raw.txt`](file:///E:/dev/projects/NFL_Dashboard/data/research-intel/source-evidence/2026-10-10-bol-live-week5.raw.txt) (69 KB)
- **Per-Matchup JSONs:** [`data/generated/props/betonline-live-2026-10-10-<away>-at-<home>.json`](file:///E:/dev/projects/NFL_Dashboard/data/generated/props/)

---

## 3. Data Integrity & Verification Audit

Our pre-review integrity audit on the 676 extracted rows produced zero data defects:

| Metric | Result | Target / Standard |
|---|---|---|
| **Total Week 5 Games Captured** | **14 / 14** (100%) | All remaining Sunday & Monday Week 5 games |
| **Total Rows Parsed** | **676 rows** | > 500 rows |
| **Null or Undefined Odds** | **0** | Strict 0 |
| **NaN Odds Values** | **0** | Strict 0 |
| **Missing Game Names** | **0** | Strict 0 |
| **Missing Market Keys** | **0** | Strict 0 |
| **Duplicate Row Keys** (`eventId + player + market + side + line`) | **0** | Strict 0 |

### Market Category Breakdown

```text
┌────────────────────────┬─────────┬───────────────────────────────────────────────┐
│ Market Category        │ Rows    │ Description                                   │
├────────────────────────┼─────────┼───────────────────────────────────────────────┤
│ game_lines             │ 84      │ Game Spreads, Moneylines, and Totals (Over/Under) │
│ first_half_lines       │ 84      │ 1st Half Spreads, Moneylines, and Totals      │
│ first_quarter_lines    │ 56      │ 1st Quarter Spreads and Totals                │
│ pass_yds               │ 12      │ Passing Yards Over/Under                      │
│ pass_cmp               │ 12      │ Pass Completions Over/Under                   │
│ pass_td                │ 12      │ Passing Touchdowns Over/Under                 │
│ pass_int               │ 12      │ Interceptions Thrown Over/Under               │
│ pass_att               │ 12      │ Passing Attempts Over/Under                   │
│ longest_completion     │ 12      │ Longest Completion Yards Over/Under           │
│ rush_yds               │ 20      │ Rushing Yards Over/Under                      │
│ carries                │ 6       │ Rushing Attempts / Carries Over/Under         │
│ rec_yds                │ 42      │ Receiving Yards Over/Under                    │
│ rec                    │ 40      │ Receptions Over/Under                         │
│ targets                │ 22      │ Targets Over/Under                            │
│ longest_rush           │ 6       │ Longest Rush Distance Over/Under              │
│ longest_rec            │ 34      │ Longest Reception Distance Over/Under         │
│ rush_rec_yds           │ 4       │ Combined Rush + Rec Yards                     │
│ fantasy_points         │ 56      │ Fantasy Points PPR (Player & Kicker)          │
│ unknown                │ 150     │ Team/Game Props (Total TDs, FGs, 2-Pt, 1Q)    │
└────────────────────────┴─────────┴───────────────────────────────────────────────┘
Total: 676 rows
```

### Staggered Book Release Cadence
- In this initial Friday evening pull, morning games (e.g. `PHI @ JAC` with 126 rows, `CHI @ GB` with 124 rows, `SF @ SEA` with 148 rows) already carry extensive player prop ladders.
- Afternoon/evening games currently carry full game lines, 1st half, and 1st quarter lines; player props will populate in Wave 2 (Saturday morning) and Wave 3 (Sunday morning).

---

## 4. Specific Review Requests for Codex

Please perform an independent review focusing on the following:

1. **Schema & Field Standardization:**
   - Confirm row structure conforms with project conventions:
     ```json
     {
       "book": "BEO",
       "source": "betonline_live_dom",
       "eventId": "491141343",
       "eventUrl": "https://sports.betonline.ag/sportsbook/football/nfl/game/491141343",
       "game": "Philadelphia Eagles @ Jacksonville Jaguars",
       "startTime": "Sun, 6:30 AM",
       "market": "pass_yds",
       "marketTitle": "Jalen Hurts PHI Passing Yards",
       "player": "Jalen Hurts",
       "team": "PHI",
       "side": "Over",
       "line": 190.5,
       "odds": -115,
       "selection": "Over 190.5 Passing Yards"
     }
     ```
   - Does this cleanly align with Bookmaker.eu (`BKR` / `bookmaker_live_markets_v1`) for cross-book line comparisons?

2. **Sub-Classification of the 150 `unknown` Rows:**
   - The 150 rows currently marked `unknown` represent game and team props (e.g. `Total Touchdowns Philadelphia Eagles`, `Total Field Goals`, `Both Teams to Score in the 1st Quarter`, `Will there be a Successful 2-Point Conversion?`).
   - Does Codex recommend:
     - (A) Splitting them into distinct market keys: `team_td_total`, `game_td_total`, `team_fg_total`, `game_fg_total`, `game_special`?
     - (B) Retaining them under `unknown` or a generalized `game_props` bucket so they don't pollute player prop aggregation?

3. **Team Suffix Parsing:**
   - Verify that all player props parse `team` correctly (e.g., `"Jalen Hurts PHI"` -> `player: "Jalen Hurts", team: "PHI"`).
   - Verify that two-word and three-word team city/name combinations in game lines (`Philadelphia Eagles`, `New York Jets`, `San Francisco 49ers`) are properly preserved in `team` and `side`.

4. **Ready for Recurring Scheduled Task:**
   - If data integrity and schema pass inspection, confirm sign-off to proceed with registering the Windows Task Scheduler background sync (`scripts/props/register-bol-cron.ps1`).

---

## 5. Quick Verification Commands for Codex

```bash
# 1. Run unit test suite
npx vitest run tests/unit/betonlineLiveParser.test.js

# 2. Inspect consolidated master JSON
node -e "
const d = JSON.parse(fs.readFileSync('data/generated/props/betonline-live-2026-10-10-week5.json', 'utf8'));
console.log('Summary:', d.summary);
console.log('Games:', d.events.map(e => e.game + ' (' + e.rowCount + ' rows)'));
"

# 3. Test dump parser against raw text evidence
node scripts/props/betonline-prop-dump-parse.mjs --in data/research-intel/source-evidence/2026-10-10-bol-live-week5.raw.txt --date 2026-10-10 --week 5
```
