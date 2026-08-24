# NFL Futures Intel Report — Canonical Layout Spec

> **MANDATORY READ** — Any session touching `agents/futures-intel-report-v2.js` MUST read this file first.
> All layout decisions live here and in the `CATEGORIES` array at the top of the agent file.
> Do NOT hardcode thresholds inside `renderHtml()` — read them from `cat.collapseAfter`, `cat.perDivDetails`, `cat.showNoOdds`.

Last updated: 2026-06-28 (S232)

---

## Architecture rule: config drives layout

Layout decisions (collapse thresholds, per-div collapsible, No-odds column) live in the `CATEGORIES` array
at the top of `futures-intel-report-v2.js`. The `catSection()` renderer reads from `cat.*` — it does NOT
use hardcoded ternary chains like `cat.id === 'superbowl' ? 10 : cat.id === 'conference' ? 6 : ...`.

**If you need to change a threshold, change it in `CATEGORIES`. Nowhere else.**

---

## Section-by-section spec

### 1. Super Bowl Winner (`id: 'superbowl'`)
- **Data**: all 32 teams, 2 books minimum (BOL/BKR/BTU)
- **Collapse**: `collapseAfter: 10` — show top 10, "Show N more ▼" button for the rest
- **Columns**: Team · Open · Prob (bar) · Consensus · BOL · BKR · BTU · Trend (sparkline) · Change
- **All columns sortable** via `sortTable()`. Trend column is NOT sortable (plain `<th>`).
- **perDivDetails**: false — single flat table, no per-div collapsible
- **Verdict**: rendered above the table as `<ul class="verdict-list">` for `•` bullet lines

### 2. Conference Winners (`id: 'conference'`)
- **Data**: AFC + NFC subsections, each with their full market teams
- **Collapse**: `collapseAfter: 6` per subsection (AFC top 6, NFC top 6), "Show N more ▼" for rest
- **Columns**: same as SB Winner
- **perDivDetails**: false — subsections use `<h3 class="sub-head">` headers, NOT `<details>`

### 3. Division Winners (`id: 'division'`)
- **Data**: all 8 division markets, each subsection = one division's teams
- **Collapse**: `collapseAfter: 4` per division table
- **perDivDetails**: TRUE — each of the 8 divisions is wrapped in `<details class="div-expand" open>`
  so each division is independently collapsible. Default open.
- **Columns**: same as SB Winner

### 4. Total Team Wins (`id: 'wins'`)
- **Data**: all 32 teams
- **Collapse**: `collapseAfter: 10` — show top 10, "Show N more ▼" for rest
- **Columns (winsTable)**: Team · Line · [bar] · Over BOL/BKR/BTU · Under BOL/BKR/BTU · Δ · SoS · PO% · ATS%
- **All columns sortable** via `sortTable()`
- **SoS rank**: from `enrichWinTotals()` — color red if rank ≤ 25th percentile, green if ≥ 75th
- **Playoffs %**: from `enrichPlayoffsPct()` — green > 60%, amber 40-60%

### 5. To Make the Playoffs (`id: 'playoffs'`)
- **Data**: all 32 teams, grouped by division
- **Collapse**: `collapseAfter: 5` per division sub-table
- **perDivDetails**: TRUE — each of the 8 divisions in `<details class="div-expand" open>`
- **showNoOdds**: TRUE — outrightTable appends a "No (est.)" column = `impliedToAmerican(1 - t.consensus)`
- **Columns**: Team · Open · Prob · Consensus · BOL · BKR · BTU · Trend · Change · No (est.)

### 6. Super Bowl Exact Matchup (`id: 'superbowl_matchup'`)
- **Data**: all matchup pairs as team strings like "Chiefs vs Eagles"
- **Collapse**: `collapseAfter: 15`
- **Special**: team filter chip bar above the table (filter by individual team name)
- **CSS**: `#matchup-tbl .tm { min-width: 200px; white-space: normal; resize: horizontal }` — allows wide matchup names

### 7. Most Wins (`id: 'most_wins'`) / Least Wins (`id: 'least_wins'`)
- **Data**: 32 teams ranked desc (Most) or asc (Least) by consensus win-total line
- **Collapse**: `collapseAfter: 10`
- **Rendering**: 
  - If source is `wins_line` → `winsTable()` (shows Line/O/U prices + SoS + ATS%)
  - If source is `direct` or `proxy` → `outrightTable()` with `showEnrich: true` (adds SoS + ATS% cols)
- **enrichWinTotals()** enriches teams in these categories regardless of subsection `kind`

---

## Line Movement section

- **Card grid**: top 8 movers shown as `<div class="mover-card">` in a grid
- **Rest**: movers beyond 8 wrapped in `<details class="tbl-expand">` — collapsed by default
- **Filter bar**: category pills (All · Super Bowl · Conference · Division · Win Total · Playoffs)
- **Minimum**: needs ≥2 snapshot dates with `|movement| ≥ 0.01` (1pp) to show movers
- **Empty state**: shown when `model.movers.length === 0` — this is correct, not a bug

## Value Spots section

- **Spot types** (in priority order in the return array):
  1. `spread` (divergence): outright markets where ≥1 sharp book has ≥200 American odds spread vs another
  2. `wins_ou`: win-total O/U where over or under price gap ≥10 pts across books
  3. `playoffs_spread`: playoff implied-prob gap ≥8pp across sharp books
  4. `wins_line`: sharp books disagree on the O/U line number by ≥0.5 wins
- **Empty state**: shown when `model.valueSpots.length === 0` — correct, thresholds may not be met
- **Max**: 35 spots total (`slice(0, 35)` in `buildValueSpots()`)

---

## Thresholds (constants at top of agent file, NEVER inside renderHtml)

```
DIVERGENCE_THRESHOLD        = 0.05   // sharp vs public implied-prob gap (pp)
SPREAD_THRESHOLD            = 200    // American odds gap across sharp books (outright markets)
WINS_OU_THRESHOLD           = 10     // American odds gap for win-total O/U prices
PLAYOFF_DIVERGENCE_THRESHOLD= 0.08   // implied-prob spread across books for playoff spots
WIN_LINE_DIVERGENCE_THRESHOLD= 0.5   // books disagree on win total line by this many wins
```

---

## Verdict rendering

All verdict text (from `deterministicVerdict()`) uses `prose()`:
- Lines starting with `•` → `<ul class="verdict-list"><li>...</li></ul>`
- Plain text lines → `<p class="verdict-p">...</p>`
- `\n` separates items

---

## CSS classes for structural elements

| Class | Purpose |
|---|---|
| `.div-expand` | `<details>` wrapper for per-div collapsible blocks |
| `.div-expand-sum` | `<summary>` inside `.div-expand` |
| `.tbl-expand` | `<details>` for collapsible table sections (mover rest) |
| `.show-more-btn` | "Show N more ▼" button inside `.tbl-wrap` |
| `.hidden-row` | rows hidden until "Show more" is clicked |
| `.verdict-list` | `<ul>` inside `.verdict-body` |
| `.mover-grid` | flex grid of top 8 mover cards |
| `#matchup-tbl` | SB Exacta table (special `.tm` width override) |

---

## Sample data validation (`--sample --dry-run`)

Run `node agents/futures-intel-report-v2.js --sample --dry-run` before every commit.
The sample data in `sampleSnapshots()` is designed to exercise EVERY section:
- 14 SB teams → "Show 4 more" button appears (10 visible, 4 hidden)
- 9 conf teams each → "Show 3 more" button appears
- All 8 divisions populated → all 8 `<details>` blocks visible
- 32 playoff teams (4/div) → all 8 division details blocks visible
- 16 win total teams → "Show 6 more" button appears
- 18 SB Exacta matchups → "Show 3 more" button appears
- SB BOL offset of -250 on favorites → fires SPREAD_THRESHOLD=200 value spots
- 2 snapshot dates, 8 days apart → movers fire for all teams with price change

---

## File structure (do not reorganize)

```
agents/futures-intel-report-v2.js
├── Constants (CATEGORIES, MARKET_LABELS, SHARP_BOOKS, thresholds)
├── Data helpers (groupSeries, buildMarketSummary, buildWinTotalsSummary, ...)
├── Analysis (buildCategoryModel, enrichWinTotals, enrichPlayoffsPct, buildMovers, buildValueSpots, ...)
├── renderMarkdown()
└── renderHtml()
    ├── Core helpers (prose, svgSpark, svgSparkSmall, bestPref, ...)
    ├── Table renderers (winsTable, outrightTable)
    │   └── outrightTable(teams, tableId, collapseAfter, opts)
    │       opts.showNoOdds  → add No (est.) column (playoffs)
    │       opts.showEnrich  → add SoS + ATS% columns (most/least wins)
    ├── catSection(cat) — reads cat.collapseAfter, cat.perDivDetails, cat.showNoOdds
    ├── movementHtml — topMovers (8) + collapsible rest
    ├── valueHtml — sorted spot cards
    └── Full HTML template
```

---

## Known-good state (after S232)

Commit after verifying `--sample --dry-run` produces:
- SB: 10 visible + "Show 4 more"
- Conference: 6 per conf + "Show 3 more"  
- Division: 8 collapsible `<details>` sections, 4 teams each
- Win Totals: 10 visible + "Show 6 more", with SoS/PO%/ATS% columns
- Playoffs: 8 collapsible `<details>` sections, 5 visible per div, No (est.) column
- SB Exacta: 15 visible + "Show 3 more"
- Most/Least Wins: 10 visible + "Show 6 more"
- Line Movement: mover cards visible (sample has 2 snapshot dates)
- Value Spots: spread spots visible (sample BOL has -250 offset on favorites)
