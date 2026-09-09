# Engineering & Operational Review Report: Pipeline Hardening, Defect Remediation & Full Corpus Expansion
**To:** Codex Review Team  
**From:** Antigravity Engineering  
**Date:** September 9, 2026  
**Subject:** Remediation of Codex Review Findings [P1/P2] — Round 2 Sign-Off: Preflight Keyset Pagination, Shipping UI Aggregation & Complete Manifest Gate Testing

---

## 1. Executive Summary

Following Round 2 review by the Codex team, all remaining [P2] findings—specifically deterministic preflight database paging, elimination of copied UI averaging, and direct execution of the preflight manifest verification gate through mocked boundaries—have been comprehensively remediated, verified by automated unit tests, and validated in end-to-end preflight gates against the live database.

### Key Milestones & System Status
1. **[P1] Truncated Reports Fully Remediated:** Raised Gemini 3.8 Flash output token ceiling to 64,000, concatenated all response parts, enforced strict `finishReason === 'STOP'`, added durable audit comments, and re-extracted all 3 truncated reports to 100% completeness (all 32 teams covered).
2. **[P1] Action Network Body Persistence Fixed:** Updated database persistence to key on the `url_hash` unique constraint rather than `url`, guaranteeing 100% of scraped article bodies (19k–68k chars) and SHA-256 content hashes are durably stored in Supabase `research_intel_notes`.
3. **[P1] Implied Probability Derivation Fixed:** Implemented consistent derivation of missing implied probabilities in `FuturesMarketBrowser.jsx` via `deriveImpliedProbability()` in `src/lib/futuresQuoteSelection.js`. Manual odds without precomputed `implied_prob` (e.g. BetOnline's `+8300` Bills–Packers) now correctly derive their probability from American odds, fixing `avgImplied` to display ~1.3% instead of the corrupted ~0.7%.
4. **[P1] Synthetic Sources Excluded from Best Sportsbook Quotes:** Added synthetic book recognition (`isSyntheticBook`) in `FuturesMarketBrowser.jsx` to exclude `consensus`, `average`, and `fair` sources from `bestBook` selection. The 180 selections where synthetic consensus was erroneously highlighted in green now highlight genuine placeable sportsbook quotes.
5. **[P2] Deterministic Keyset Pagination for 365-Day Movement History (PASS in R2):** Upgraded `getFuturesOddsHistory()` in `src/lib/supabase.js` to use deterministic keyset pagination over `(snapshot_time ASC, id ASC)` via `fetchFuturesOddsHistoryPaged()`. Evaluated by Codex with zero drops or boundary duplicates across tied timestamps.
6. **[P2] Protected Applied Manifest from Dry-Run Overwrites:** Updated `scripts/backfill-futures-imports.js` to export and use `manifestPathForMode()`, ensuring `--dry-run` writes to `import-manifest-2026.dry-run.json` without modifying `import-manifest-2026.json`.
7. **[P2] Deterministic Preflight Keyset Pagination & Explicit Count Check (Round 2 Fix):** Extracted `fetchPersistedImportRowsPaged()` in `src/lib/futuresImportAudit.js` with stable ordering `.order('id', { ascending: true })` and keyset cursor `.gt('id', lastId)`. Explicitly confirms `dbRows.length === liveCount` after paging, preventing false hash mismatches from missing or overlapping rows.
8. **[P2] Shipping UI Average Aggregation Extracted & Tested (Round 2 Fix):** Extracted `computeAverageImpliedProbability()` and `aggregateSelectionQuotes()` into `src/lib/futuresQuoteSelection.js`, used directly by `FuturesMarketBrowser.jsx`. Replaced copied test reduction with direct execution of these shipping helpers.
9. **[P2] Preflight Manifest Gate Production Harness & Unit Test Coverage (Round 2 Fix):** Extracted `auditFuturesImportManifest()` into `src/lib/futuresImportAudit.js` as the single-source production verification engine for both `agents/portfolio-preflight.js` and regression tests. Added mocked unit tests for missing-hash fail-closed behavior (BLOCK), hash mismatches, paged count discrepancies, and successful pass.
10. **Corpus & Database Health:** Total master reports in Supabase `vault_notes` (`NFL/Reference/Reports/%`) stands at **103**. Supabase `futures_odds_snapshots` holds **26,666 valid season-2026 rows**.
11. **Test & Verification Suite:** Focused ESLint 0 errors, 0 warnings; Vitest 100% pass rate (**93/93 test files, 1,348/1,348 unit tests**); production Vite build clean; preflight manifest audit PASS.

---

## 2. Detailed Remediation of Round 2 Codex Findings

### A. [P2] Deterministic Keyset Pagination for Preflight Database Paging
- **Reference:** `agents/portfolio-preflight.js:330-345`, `src/lib/futuresImportAudit.js:fetchPersistedImportRowsPaged()`
- **Codex Finding:** The manifest audit used 1,000-row `.range()` pages without an `.order()` clause, allowing PostgreSQL to return rows in non-deterministic order between queries, potentially skipping or duplicating rows and causing false hash mismatches on imports > 1,000 rows. The loop also did not confirm `dbRows.length === liveCount`.
- **Remediation:**
  1. Extracted and exported `fetchPersistedImportRowsPaged(sb, entry, { pageSize = 1000 })` in `src/lib/futuresImportAudit.js`.
  2. Enforced strict total ordering using keyset pagination: `.order('id', { ascending: true })` and `.gt('id', lastId)`.
  3. Added explicit post-pagination count validation: if `dbRows.length !== liveCount`, preflight flags a failure: `${name}: paged read retrieved ${dbRows.length}/${liveCount} rows`.
- **Implementation:**
  ```javascript
  export async function fetchPersistedImportRowsPaged(sb, entry, { pageSize = 1000 } = {}) {
    if (!sb) return { rows: [], error: new Error('Supabase client is not configured') };
    const dbRows = [];
    let lastId = null;
    let fetchErr = null;

    while (true) {
      let query = sb
        .from('futures_odds_snapshots')
        .select('id, snapshot_time, captured_at, season, book, market_type, team, selection, odds, price, implied_prob, line, over_price, under_price')
        .eq('season', entry.season)
        .eq('book', entry.book)
        .eq('snapshot_time', entry.snapshot_time)
        .order('id', { ascending: true })
        .limit(pageSize);

      if (lastId != null) query = query.gt('id', lastId);

      const { data: pageData, error: pageErr } = await query;
      if (pageErr) { fetchErr = pageErr; break; }
      if (!pageData || pageData.length === 0) break;
      dbRows.push(...pageData);
      lastId = pageData[pageData.length - 1].id;
      if (pageData.length < pageSize) break;
    }

    return { rows: dbRows, error: fetchErr };
  }
  ```
- **Verification:**
  - Unit test in `tests/unit/futuresOddsReconciliationGaps.test.js` exercises `fetchPersistedImportRowsPaged()` across multi-page datasets, asserting that `.order('id', { ascending: true })` and `.gt('id', lastId)` keyset boundaries are invoked and all rows are assembled in strict ascending order.
  - Live preflight against the real database audited 24 dated imports (23 persisted, 1 invalid duplicate, 5,484 rows) in 2.1s with zero errors or false hash mismatches.

---

### B. [P2] Component UI Aggregation Extracted Behind Production Functions
- **Reference:** `src/components/futures/FuturesMarketBrowser.jsx:153-165`, `src/lib/futuresQuoteSelection.js`
- **Codex Finding:** The `avgImplied` calculation in the unit test remained copied from the component (`reduce` loop) rather than exercising the component's shipping aggregation logic.
- **Remediation:**
  1. Extracted and exported `computeAverageImpliedProbability(bookEntries)` and `aggregateSelectionQuotes(bookEntries)` in `src/lib/futuresQuoteSelection.js`.
  2. Refactored `FuturesMarketBrowser.jsx` to delegate all selection aggregation to `aggregateSelectionQuotes(bookEntries)`:
     ```javascript
     const rows = Array.from(byTeam.values()).map(entry => {
       const bookEntries = Array.from(entry.books.values());
       const stats = aggregateSelectionQuotes(bookEntries);

       return {
         team: entry.team,
         books: entry.books,
         ...stats,
         meta: getTeamMeta(entry.team),
       };
     });
     ```
  3. Refactored `tests/unit/futuresOddsReconciliationGaps.test.js` to directly import and test `computeAverageImpliedProbability()` and `aggregateSelectionQuotes()`:
     ```javascript
     // Direct execution of shipping aggregation helper
     const fixedAvg = computeAverageImpliedProbability(entries);
     expect((fixedAvg * 100).toFixed(1)).toBe('1.3');

     // Direct execution of component selection stats helper
     const aggregated = aggregateSelectionQuotes(entries);
     expect((aggregated.avgImplied * 100).toFixed(1)).toBe('1.3');
     expect(aggregated.bestBook).toBe('betonline');
     expect(aggregated.bestOdds).toBe(8300);
     expect(aggregated.bestImplied).toBeCloseTo(100 / 8400, 5);
     ```
- **Verification:** Both unit tests and the UI component now execute the exact same production aggregation functions.

---

### C. [P2] Preflight Manifest Gate Production Extraction & Boundary Testing
- **Reference:** `agents/portfolio-preflight.js`, `src/lib/futuresImportAudit.js:auditFuturesImportManifest()`, `tests/unit/futuresOddsReconciliationGaps.test.js`
- **Codex Finding:** No test invoked the preflight manifest gate, leaving the fail-closed missing-hash behavior and database paging loop unexercised against broken wiring.
- **Remediation:**
  1. Extracted and exported `auditFuturesImportManifest({ manifestJson, fileNames, readFileBytes, rowCount, fetchPersistedRows })` in `src/lib/futuresImportAudit.js`.
  2. Refactored `agents/portfolio-preflight.js` to invoke `auditFuturesImportManifest()` directly.
  3. Added comprehensive mocked boundary unit tests in `tests/unit/futuresOddsReconciliationGaps.test.js`:
     - **Missing `semantic_sha256` Fails Closed:** Verifies that a persisted manifest entry with `semantic_sha256: null` produces `${name}: persisted entry is missing semantic_sha256 in manifest` and sets `passed: false` (BLOCK).
     - **Database Content Hash Mismatch:** Verifies that corrupted or modified database rows produce `${name}: live database content hash mismatch`.
     - **Paged Read Count Discrepancy:** Verifies that if `fetchPersistedRows` returns fewer rows than `liveCount`, it produces `${name}: paged read retrieved X/Y rows`.
     - **Valid Manifest & Content Pass:** Verifies that matching rows and hashes produce `passed: true` with 0 problems.
- **Verification:** Unit test suite verifies all four gate branches; `portfolio-preflight.js` invokes this exact same production function on every preflight check.

---

## 3. Comprehensive Verification Matrix

| Quality Gate | Target Command | Scope & Details | Result |
| :--- | :--- | :--- | :--- |
| **Focused Unit Suite** | `npm test tests/unit/futuresOddsReconciliationGaps.test.js` | 12 tests covering all P1/P2 remediation shipping helpers | **12 / 12 PASS (100%)** |
| **Full Vitest Suite** | `npm test` | 93 test files across entire repository | **93 / 93 Files PASS (1,348 tests, 0 fails)** |
| **Scoped ESLint** | `npx eslint <modified_files>` | Scoped across touched shipping files and tests | **0 Errors, 0 Warnings** |
| **Live Preflight Manifest Audit** | `node agents/portfolio-preflight.js --warn-only` | Validates 24 dated import files & 5,484 rows via keyset query against Supabase | **`futures_import_manifest` PASS** |
| **Production Vite Bundle** | `npm run build` | Validates JSX compilation and bundling | **Clean Build (Exit Code 0)** |

---

## 4. Prompt for Codex Review Team

```markdown
Codex Remediation Review Request — Round 2 Fix Verification
Branch: main | HEAD: 66fcc03 (uncommitted changes scoped to remediation)
Repository: NFL_Dashboard

Please review the remediation for the two P2 findings identified in Round 2:

1. [P2 Fixed] Preflight Paged Audit Read with Keyset Pagination on `id ASC` & Count Check:
   - Extracted and exported `fetchPersistedImportRowsPaged(sb, entry, { pageSize = 1000 })` in `src/lib/futuresImportAudit.js`.
   - Uses strict total ordering with keyset pagination: `.order('id', { ascending: true })` and `.gt('id', lastId)`.
   - Enforces explicit count validation after pagination: flags `${name}: paged read retrieved ${dbRows.length}/${liveCount} rows` if `dbRows.length !== liveCount`.
   - Extracted `auditFuturesImportManifest()` in `src/lib/futuresImportAudit.js` as the single-source production verification engine used by `agents/portfolio-preflight.js`.

2. [P2 Fixed] Tests Fully Exercise Shipping Production Logic Behind Mocked Boundaries:
   - Extracted `computeAverageImpliedProbability()` and `aggregateSelectionQuotes()` into `src/lib/futuresQuoteSelection.js` and wired them directly into `FuturesMarketBrowser.jsx:153-165`.
   - Refactored `tests/unit/futuresOddsReconciliationGaps.test.js` to eliminate all copied UI averaging logic, directly testing `computeAverageImpliedProbability()` and `aggregateSelectionQuotes()`.
   - Added unit test directly exercising `auditFuturesImportManifest()` with mocked boundaries:
     * Asserts persisted entry missing `semantic_sha256` in manifest fails closed with `${name}: persisted entry is missing semantic_sha256 in manifest` and `passed: false` (BLOCK).
     * Asserts database content hash mismatch flags `${name}: live database content hash mismatch`.
     * Asserts paged read count discrepancy flags `${name}: paged read retrieved X/Y rows`.
     * Asserts valid manifest and database match yields `passed: true` with 0 problems.
   - Added unit test directly exercising `fetchPersistedImportRowsPaged()` asserting keyset cursor pagination with `.order('id', { ascending: true })` and `.gt('id', lastId)`.

Verification Results:
- Focused suite: 12/12 passed (`tests/unit/futuresOddsReconciliationGaps.test.js`)
- Full Vitest suite: 93 files, 1,348/1,348 passed (100% green)
- Scoped ESLint: 0 errors, 0 warnings
- Live Preflight: `futures_import_manifest` PASS (24 dated imports: 23 persisted, 1 invalid duplicate, 5,484 rows verified against live database via keyset pagination)
- No external portfolio mutations, paid API calls, git staging, or commits were made.
```
