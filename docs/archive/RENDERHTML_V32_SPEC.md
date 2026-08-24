# renderHtml v3.2 — Full Spec for S226

> Written at S225 close. **Do not start coding until this doc is read.** Fix bugs first, then features, then cosmetics.

---

## Part 1 — Bugs (must fix before reviewing features)

### B1 · Line Movement section is blank
The `moverSection()` renders nothing in sample run. Likely cause: `buildMovers()` returns empty array when `series` has no data in sample mode, or the section guard `if (!si.movers?.length)` fires incorrectly. Debug path:
- Add `console.log('[debug] movers:', si.movers?.length)` before renderHtml call
- Check whether `--sample` stubs include series data on mover objects
- Check `moverSection()` guard condition

### B2 · Value Spots section is blank
Sample run has no DK/FD data (expected). But blank is wrong — the section should either:
- Show a message: *"Value Spots require public book data (DK/FD/BetMGM). Capture a DK/FD snapshot to activate."*
- Or just hide the section entirely when no divergence data exists
Currently it renders blank whitespace. Fix the guard in `catSection()` for `value_spots`.

### B3 · BTU column all dashes in live report
BetUS data (480 rows) is in Supabase as of 2026-06-26 ingest. In sample mode this is expected. But in live report the BTU column was also empty. Investigate:
- Does `buildMarketSummary` query `book = 'betus'`? Check `BOOKS` constant / query filter.
- Does `PREF_BOOKS` include `'betus'`? Check `BOOK_SHORT` and `PREF_BOOKS` arrays.
- Run: `SELECT DISTINCT book FROM futures_odds_snapshots WHERE season = 2026;` to confirm book name casing.

### B4 · Horizontal scrollbars appearing in sections
Tables are wider than their card container. Fix: add `table-layout: fixed; width: 100%; overflow-x: hidden` on `.odds-tbl`, or reduce column count. Likely culprit: `min-width` on td/th cells exceeding card width.

### B5 · Collapsible toggle not working
`toggleSec(btn)` is defined but sections don't collapse. Likely causes:
- `btn.closest('.card')` doesn't find `.card` ancestor — check DOM nesting (button is inside `.card-head` inside `.card`?)
- Or `.sec-body` class isn't applied to the correct wrapper div
- Or the JS block is outside `</body>` or has a syntax error that silently kills all JS
Fix: verify `toggleSec` is inside `<script>` tag before `</body>`, and that `btn.closest('.card')` actually resolves. Consider using `btn.closest('.card, .cat-card')` to catch both card types.

### B6 · SB/CONF/DIV sections truncated
Only showing ~10 teams for SB (the "show first N then collapse" logic). The `<details>/<summary>` expand mechanism appears broken or missing. Either:
- Restore the `<details><summary>Show all X teams</summary>` pattern for rows beyond the fold, OR
- Remove truncation entirely (show all 32 teams always, use collapsible section toggle instead)
**Recommended:** keep the section-level collapse (B5 fix), remove the row-level `<details>` truncation — just show all teams.

### B7 · Values not reflecting most current odds
In live report, odds should be from the latest per-book snapshot. Verify `buildMarketSummary` uses `ORDER BY snapshot_time DESC` and `DISTINCT ON (team, market_type, book)` (or equivalent grouping) to pick the latest row per team/market/book. If using the PostgREST approach, confirm the query window isn't accidentally capped to last-24h bucket.

---

## Part 2 — Features (from S225 user spec)

### F1 · SVG Sparklines (partially implemented)
Already coded (`svgSpark`, `svgSparkSmall`) but not visible due to B1 (blank section). Once B1 is fixed, verify:
- Line graph shows trend from opening to current
- Dashed horizontal reference line at opening value
- Green dot at current if up, red if down
- Same SVG logic applied to implied probability at bottom of mover cards
- Movement rest-table Trend column uses `svgSparkSmall`

### F2 · Mover Card book grid (partially implemented)
`mc-book-grid` with BOL/BKR/BTU headers + Open/Now rows is coded. Once B1 fixed, verify:
- Best current price gets green halo (`best-price` class)
- "pp" tooltip: "percentage points — the change in implied win probability"
- Bottom meta rows: Probability (open % → now %) and Window (first date → last date, N snapshots)

### F3 · Column header tooltips (partially implemented)
`th-tip` CSS tooltip pattern coded for outright tables. Verify these tooltips are present:
- **Consensus**: "Weighted average of all tracked book prices, converted to implied probability"
- **Prob**: "Implied win probability derived from the consensus odds (no-vig)"
- **BOL/BKR/BTU**: "BetOnline / Bookmaker / BetUS — sharp book current odds"
- **Best**: "Highest (most favorable) odds across BOL/BKR/BTU"
- **Net**: "Total probability shift since opening snapshot"
- **Trend**: "Direction of movement across all snapshots"
- **Window**: "Date range of snapshots tracked"

### F4 · Sortable movement table
Movement rest-table (`#mover-rest-tbl`) should be sortable by the Market column (to filter by SB Winner, AFC East Winner, Win Total, etc.). `sortMoverTbl()` is coded — verify it actually runs on header click and that the Market column is `th` with `onclick`.

### F5 · Value Spots — no display columns for DK/FD
Keep tracking DK/FD in the divergence calc but don't show them as columns. Currently blank (B2). When DK/FD data exists, show: Team | Sharp Consensus | Public Consensus | Gap | Direction. No raw book columns.

### F6 · SB/CONF/DIV/Playoffs — no DK/FD columns
DK/FD columns already removed in code. Verify the outright table only shows: Rank | Team | BOL | BKR | BTU | Best | Prob | Consensus. (8 columns — should not trigger scrollbar with B4 fixed.)

### F7 · Cross-book discrepancy highlight
If `max(BOL,BKR,BTU) - min(BOL,BKR,BTU) > 1500` American odds points: row gets amber background (`.row-disc`), ⚠ badge on team name. Already coded — verify it fires correctly with real data (Carolina Panthers example: BOL +7500 vs BKR +10157 = 2657 diff).

### F8 · Prob/Consensus overlap fix for heavy favorites
When Prob > ~60%, the probability bar and the Consensus cell overlap visually. Fix: either display Prob as a plain number (no bar) when > 75%, or make the bar go right-to-left (inverted for favorites), or just show the numeric percentage with a colored badge instead of a bar.

### F9 · Playoffs grouped by NFL division
Already coded with `TEAM_DIVISION` map and `DIVISION_ORDER`. Once B5/B6 fixed, verify division headers appear: `AFC East`, `AFC North`, etc., each with its own `outrightTable` of that division's teams.

### F10 · SB Exact Matchup multi-team filter
`filterMatchups()` and the text input `#mf-input` are coded. Verify:
- Typing "Lions" shows only matchups where "Lions" appears in the team string
- Typing "Lions, Ravens" shows matchups involving either team
- Clear button resets
- Match count shows `N of 256 matchups`

### F11 · Least Wins — favorites at top
`buildCategoryModel` fix for `least_wins` direction is coded. Verify in sample output that the team with the highest probability to win fewest games appears first (i.e., the strongest favorites are at the top, not longshots).

### F12 · NFL content filter in Expert/Coverage sections
`isNflRelevant()` already coded. Verify World Cup / FIFA / NBA / NHL / MLB articles are excluded. In sample mode there's no real data so this is tested only on live run.

### F13 · All sections collapsible
Depends on B5 fix. Every section card should have a `▼ / ▶` toggle in its header. Default state: all expanded. Click collapses `.sec-body`. Second click re-expands.

---

## Part 3 — Cosmetic / UX

### C1 · Nav links at top
Quick-jump anchor links to each section (`#sb`, `#conf`, `#div`, etc.) should be present and styled. Already coded as `catNavLinks` — verify they render.

### C2 · "pp" label clarification
In mover card delta display (e.g. "▲ 4.2 pp"), add a `title="percentage points"` tooltip on the pp span so users understand it on hover.

### C3 · Section headers consistent
All section headers should follow pattern: `<h2>[emoji] [Section Name]</h2>` + subtitle + collapse toggle. Verify consistency across all 8 sections.

---

## Implementation Order for S226

1. **Read this doc** + read `agents/futures-intel-report-v2.js` current state
2. Fix B3 (BTU book name) — quick DB query to confirm
3. Fix B5 (collapsible toggle) — JS closest() bug
4. Fix B6 (truncation) — remove row-level `<details>`, keep section collapse
5. Fix B1 (movers blank) — debug sample data path
6. Fix B2 (value spots blank) — add "no public data" message
7. Fix B4 (scrollbars) — table CSS
8. Fix B7 (stale odds) — verify query logic
9. Verify F1–F13 render correctly now that bugs are fixed
10. Commit everything in one clean commit
11. Push → M6 pull → live report run → SCP to Windows → visual review

---

## Key constants to verify in code

```js
const PREF_BOOKS = ['betonline', 'bookmaker', 'betus']; // must match DB book column values exactly
const BOOK_SHORT = { betonline: 'BOL', bookmaker: 'BKR', betus: 'BTU' };
```

Run this query on M6 before coding:
```sql
SELECT DISTINCT book, COUNT(*) FROM futures_odds_snapshots WHERE season = 2026 GROUP BY book;
```
If DB has `'betus'` but code uses `'BetUS'` (or vice versa), B3 is a case-mismatch.
