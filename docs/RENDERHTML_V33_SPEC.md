# renderHtml v3.3 — Layout Planning Spec (S229)

> Locked 2026-06-28. All decisions below come from the S229 questionnaire session.
> **Do not deviate from these decisions without a new planning session.**
> Implement in a single coding session (S230 or later).

---

## Section 1 — Outright Tables

### 1a · Collapse thresholds

| Category | Show by default | Collapse remainder |
|---|---|---|
| Super Bowl Winner | 10 rows | ▼ Show N more |
| Conference (AFC / NFC) | 8 rows **per subsection** | ▼ Show N more per sub |
| Division (8 divisions) | 4 rows **per division** | ▼ Show N more per div |
| Playoffs | 5 rows **per division** | ▼ Show N more per div |
| SB Exact Matchup | 15 rows | ▼ Show N more |
| Most Wins / Least Wins | 10 rows | ▼ Show N more |

- Each subsection collapses independently (Conference AFC vs NFC, each division separate).
- "Show N more" button expands only that subsection, not the whole category section.
- Currently implemented via `collapseAfter` param in `outrightTable()` / `winsTable()` — no architectural change needed, just update the `ca` value per category/subsection.

### 1b · Sort order — user-sortable columns

**Default:** no opinionated sort — render in consensus-probability order (current behavior) as the initial state.

**Sortable columns (click header to toggle asc/desc):**

For outright tables (`outrightTable()`):
- `Team` (alphabetical)
- `BOL` / `BKR` / `BTU` (American odds numeric)
- `Best` (American odds numeric)
- `Consensus` (implied %)
- `Δ pp` (if present — probability change since opening)

For win totals table (`winsTable()`):
- `Team` (alphabetical)
- `Line` (numeric)
- `SoS` (numeric rank — see §2)
- `Playoffs %` (numeric — see §2)
- `Over` / `Under` (price numeric)

Implementation: add `onclick="sortTable(this, colIdx, 'numeric'|'alpha')"` on each `<th>` + shared `sortTable()` JS function. Sort indicator arrow in `<span class="si">`. Existing `sortMoverTbl()` in Line Movement can be the model — generalize it.

---

## Section 2 — Win Totals

### 2a · New columns

Add two columns to `winsTable()`, rendered between Team and the book O/U prices:

**Column A: SoS Rank**
- Source: `t.sosRank` (already computed in `buildWinsTotals()`)
- Display: rank integer (1 = hardest schedule). Color: red badge if rank ≤ 8, green badge if rank ≥ 25.
- Tooltip: "Strength of Schedule rank (1 = hardest). Based on 2026 schedule opponent win totals."

**Column B: Playoffs %**
- Source: `t.playoffsImplied` — new field, computed in `buildWinsTotals()` from the `playoffs` market snapshots.
- Implementation: after fetching wins data, fetch latest `playoffs` market snapshot per team from `futures_odds_snapshots`. Average across sharp books. Store as `t.playoffsImplied` (0–1 float).
- Display: format as `fmtPct(t.playoffsImplied)`. Green if > 0.6, amber if 0.4–0.6, no color below.
- Tooltip: "Implied probability of making the playoffs (average of sharp books: BOL/BKR/BTU)."
- If no playoffs data: show `—`.

---

## Section 3 — Line Movement

### 3a · Category pill filter

Add a filter bar above the mover card grid, identical in style to the Value Spots filter bar.

**Pills:** All · Super Bowl · Conference · Division · Win Total · Playoffs

**Behavior:**
- Clicking a pill filters both the top card grid AND the rest table simultaneously.
- Active pill gets `.active` CSS class. "All" is default active.
- Filter logic: each mover card `<div class="mover-card">` gets `data-cats="superbowl"` etc. (use `spotMarketCat(m.market)` — already exists, reuse it). Rest table rows get `data-market` already — map to cat via JS.
- JS: single `applyMoverFilter(cat)` function, mirrors `applySpotFilter()`.

**Implementation notes:**
- Cat counts in filter badge: count movers per category before rendering.
- No collapse change to the 9-card / rest-table split — just add filtering on top.

---

## Section 4 — Value Spots

### 4a · New spot type: Playoffs spread spots

Add to `buildValueSpots()` after existing divergence logic:

**Logic:** For each team with `playoffs` market data across ≥ 2 sharp books:
- Compute implied probability per book (americanToImplied).
- If max − min spread across books ≥ 0.08 (8 percentage points): it's a spot.
- Fields: `{ spotType: 'spread', market: 'To Make the Playoffs', team, markets: [{market, book, odds, implied}], divergence: max−min, ... }`

**Rendering:** use existing spread card layout (same as SB/Conf/Div spots). Category tag = 'Playoffs'. `spotMarketCat()` already maps playoff market strings → `'playoffs'` — no change needed there.

**Threshold:** 0.08 implied probability spread (vs 0.05 for outright markets — playoffs odds are tighter so use larger threshold to avoid noise). Make it a named constant: `PLAYOFF_DIVERGENCE_THRESHOLD = 0.08`.

### 4b · New spot type: Win Total line-discrepancy spots

Add to `buildValueSpots()`:

**Logic:** For each team with `wins` market data across ≥ 2 sharp books:
- Extract the consensus line per book (the O/U number, not the price).
- If max line − min line ≥ 0.5 wins across books: it's a spot.
- Fields: `{ spotType: 'wins_line', team, market: 'Win Total', bookLines: [{book, line, over, under}], lineSpread: max−min }`

**Rendering:** new `wins_line` card type (alongside existing `wins_ou`):
- Header shows team + "Win Total Line Split"
- Body shows a small table: Book | Line | Over | Under
- Explanation text: "Books disagree on the line — buy the higher Over or lower Under depending on your lean."
- Category tag = 'Win Total'.

**Sort:** wins_line cards sort by `lineSpread` descending (biggest disagreement first).

---

## Section 5 — Expert Signals

**No change.** Keep group-by-source layout, sorted by confidence. ✓

---

## Section 6 — Coverage Audit

**No change.** Keep at bottom. ✓

---

## Implementation order (recommended)

1. **Collapse thresholds** — trivial, change `ca` constants. (§1a)
2. **Sortable columns** — generalize `sortMoverTbl()` → `sortTable()`, wire up outright + wins tables. (§1b)
3. **Win Totals columns** — fetch playoffs data in `buildWinsTotals()`, add SoS + Playoffs % columns. (§2)
4. **Line Movement filter bar** — copy filter bar pattern from Value Spots, wire `data-cats` on cards. (§3)
5. **Value Spots: Playoffs spread spots** — add to `buildValueSpots()`. (§4a)
6. **Value Spots: Win Total line-discrepancy spots** — add `wins_line` card type. (§4b)

No architectural changes required. All work is in `agents/futures-intel-report-v2.js`.

---

## Constants to add/change

```js
// Collapse thresholds (update in renderHtml catSection())
// SB=10 (unchanged), Conf=8/sub, Div=4/sub, Playoffs=5/div, Matchup=15 (unchanged)

// New divergence threshold
const PLAYOFF_DIVERGENCE_THRESHOLD = 0.08;
const WIN_LINE_DIVERGENCE_THRESHOLD = 0.5; // wins

// Already exists (keep):
const DIVERGENCE_THRESHOLD = 0.05; // outright markets
```

---

## Files touched

| File | Change |
|---|---|
| `agents/futures-intel-report-v2.js` | All changes above |

No other files touched. No new dependencies.
