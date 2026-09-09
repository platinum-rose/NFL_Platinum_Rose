import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import path from 'node:path';
import {
  deriveImpliedProbability,
  isSyntheticBook,
  selectBestAndWorstQuotes,
  computeAverageImpliedProbability,
  aggregateSelectionQuotes,
} from '../../src/lib/futuresQuoteSelection.js';
import { fetchFuturesOddsHistoryPaged } from '../../src/lib/supabase.js';
import { manifestPathForMode, DIR, MANIFEST_PATH } from '../../scripts/backfill-futures-imports.js';
import {
  computeSemanticHash,
  canonicalSemanticRows,
  FUTURES_IMPORT_KEYS,
  fetchPersistedImportRowsPaged,
  auditFuturesImportManifest,
} from '../../src/lib/futuresImportAudit.js';

describe('Codex Review Findings Fixes (Direct Shipping Logic Execution)', () => {
  describe('Finding 1: Implied probability derivation for manual odds', () => {
    it('preserves existing implied_prob when present', () => {
      const row = { book: 'betus', odds: 7000, implied_prob: 0.0141 };
      expect(deriveImpliedProbability(row)).toBe(0.0141);
    });

    it('derives implied_prob from positive American odds when missing', () => {
      const row = { book: 'betonline', odds: 8300, implied_prob: null };
      const derived = deriveImpliedProbability(row);
      // 100 / (8300 + 100) = 100 / 8400 = 0.0119047...
      expect(derived).toBeCloseTo(100 / 8400, 5);
    });

    it('derives implied_prob from negative American odds when missing', () => {
      const row = { book: 'betus', odds: -150, implied_prob: null };
      const derived = deriveImpliedProbability(row);
      // 150 / (150 + 100) = 0.6
      expect(derived).toBeCloseTo(0.6, 5);
    });

    it('prevents corruption of avgImplied on live Bills-Packers exacta pair via shipping aggregation helpers', () => {
      // Live scenario: BetUS has implied_prob 0.0141, BetOnline has missing implied_prob (null)
      const betUs = { book: 'betus', odds: 7000, implied_prob: 0.0141 };
      const betOnline = { book: 'betonline', odds: 8300, implied_prob: null };
      const entries = [betUs, betOnline];

      // Buggy legacy calculation where missing implied_prob substituted zero:
      const brokenAvg = entries.reduce((s, r) => s + (r.implied_prob || 0), 0) / entries.length;
      expect((brokenAvg * 100).toFixed(1)).toBe('0.7');

      // Direct execution of shipping aggregation helper
      const fixedAvg = computeAverageImpliedProbability(entries);
      expect((fixedAvg * 100).toFixed(1)).toBe('1.3');

      // Direct execution of component selection stats helper
      const aggregated = aggregateSelectionQuotes(entries);
      expect((aggregated.avgImplied * 100).toFixed(1)).toBe('1.3');
      expect(aggregated.bestBook).toBe('betonline'); // +8300 payout beats +7000 payout
      expect(aggregated.bestOdds).toBe(8300);
      expect(aggregated.bestImplied).toBeCloseTo(100 / 8400, 5);
      expect(aggregated.worstOdds).toBe(7000);
      expect(aggregated.bookCount).toBe(2);

      expect(computeAverageImpliedProbability([])).toBe(0);
    });
  });

  describe('Finding 2: Do not mark synthetic sources as best books', () => {
    it('identifies synthetic books correctly via isSyntheticBook()', () => {
      expect(isSyntheticBook('consensus')).toBe(true);
      expect(isSyntheticBook('Consensus')).toBe(true);
      expect(isSyntheticBook('average')).toBe(true);
      expect(isSyntheticBook('fair')).toBe(true);
      expect(isSyntheticBook('market_consensus')).toBe(true);

      expect(isSyntheticBook('draftkings')).toBe(false);
      expect(isSyntheticBook('fanduel')).toBe(false);
      expect(isSyntheticBook('betonline')).toBe(false);
      expect(isSyntheticBook('betus')).toBe(false);
      expect(isSyntheticBook('caesars')).toBe(false);
    });

    it('exercises selectBestAndWorstQuotes() shipping function to exclude synthetic books', () => {
      const bookEntries = [
        { book: 'draftkings', odds: 1000, implied_prob: 0.0909 },
        { book: 'consensus', odds: 1200, implied_prob: 0.0769 }, // Longest payout, but synthetic!
        { book: 'betonline', odds: 1100, implied_prob: 0.0833 },
      ];

      const { best, worst } = selectBestAndWorstQuotes(bookEntries);

      expect(best.book).toBe('betonline');
      expect(best.book).not.toBe('consensus');
      expect(worst.book).toBe('draftkings');
    });

    it('falls back to synthetic sources only if no real sportsbook quotes exist in selectBestAndWorstQuotes()', () => {
      const bookEntries = [
        { book: 'consensus', odds: 1200, implied_prob: 0.0769 },
      ];

      const { best } = selectBestAndWorstQuotes(bookEntries);
      expect(best.book).toBe('consensus');
    });
  });

  describe('Finding 3: Keyset pagination with deterministic total order (snapshot_time, id)', () => {
    function createMockSupabaseClient(pages) {
      let callIndex = 0;
      const orCalls = [];
      const orderCalls = [];
      const gteCalls = [];

      const queryBuilder = {
        select: vi.fn(() => queryBuilder),
        eq: vi.fn(() => queryBuilder),
        in: vi.fn(() => queryBuilder),
        gte: vi.fn((col, val) => {
          gteCalls.push({ col, val });
          return queryBuilder;
        }),
        order: vi.fn((col, opts) => {
          orderCalls.push({ col, opts });
          return queryBuilder;
        }),
        limit: vi.fn(() => queryBuilder),
        or: vi.fn((clause) => {
          orCalls.push(clause);
          return queryBuilder;
        }),
        then: vi.fn((resolve) => {
          const page = pages[callIndex++] || [];
          return resolve({ data: page, error: null });
        }),
      };

      const client = {
        from: vi.fn(() => queryBuilder),
      };

      return { client, orCalls, orderCalls, gteCalls, queryBuilder };
    }

    it('exercises fetchFuturesOddsHistoryPaged() with deterministic total ordering and keyset boundary condition', async () => {
      const boundaryTimestamp = '2026-06-01T12:00:00Z';
      const page1 = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        snapshot_time: i < 999 ? '2026-06-01T10:00:00Z' : boundaryTimestamp,
        team: 'Buffalo Bills',
        selection: 'Buffalo Bills',
        book: 'draftkings',
        odds: 1000 + i,
        implied_prob: 0.09,
        season: 2026,
      }));
      const page2 = Array.from({ length: 50 }, (_, i) => ({
        id: 1001 + i,
        snapshot_time: i === 0 ? boundaryTimestamp : '2026-06-01T14:00:00Z', // Tied timestamp at page boundary!
        team: 'Buffalo Bills',
        selection: 'Buffalo Bills',
        book: 'draftkings',
        odds: 2000 + i,
        implied_prob: 0.04,
        season: 2026,
      }));

      const { client, orCalls, orderCalls, gteCalls } = createMockSupabaseClient([page1, page2]);

      const result = await fetchFuturesOddsHistoryPaged(client, {
        team: 'Buffalo Bills',
        marketType: 'superbowl',
        days: 365,
        season: 2026,
        pageSize: 1000,
      });

      // Validates order by both snapshot_time and id for strict total order
      expect(orderCalls).toEqual([
        { col: 'snapshot_time', opts: { ascending: true } },
        { col: 'id', opts: { ascending: true } },
        { col: 'snapshot_time', opts: { ascending: true } },
        { col: 'id', opts: { ascending: true } },
      ]);

      // Validates first page used gte and second page used compound keyset condition over (snapshot_time, id)
      expect(gteCalls).toHaveLength(1);
      expect(gteCalls[0].col).toBe('snapshot_time');
      expect(orCalls).toHaveLength(1);
      expect(orCalls[0]).toBe(`snapshot_time.gt.${boundaryTimestamp},and(snapshot_time.eq.${boundaryTimestamp},id.gt.1000)`);

      // All 1050 rows retrieved without dropping or duplicating the tied timestamp row at index 1000
      expect(result).toHaveLength(1050);
      expect(result[999].id).toBe(1000);
      expect(result[1000].id).toBe(1001);
      expect(result[999].snapshot_time).toBe(boundaryTimestamp);
      expect(result[1000].snapshot_time).toBe(boundaryTimestamp);
    });
  });

  describe('Finding 4: Dry-run manifest destination isolation via shipping helper', () => {
    it('exercises manifestPathForMode() to isolate dry-run from production manifest', () => {
      expect(manifestPathForMode('dry-run')).toBe(path.join(DIR, 'import-manifest-2026.dry-run.json'));
      expect(manifestPathForMode('applied')).toBe(MANIFEST_PATH);
      expect(manifestPathForMode('dry-run')).not.toBe(MANIFEST_PATH);
    });
  });

  describe('Finding 5: Persisted database row content hash validation via shipping helper', () => {
    it('exercises canonicalSemanticRows() and computeSemanticHash() shipping functions', () => {
      const rows = [
        {
          snapshot_time: '2026-06-02T00:00:00Z',
          captured_at: '2026-06-02T00:00:00Z',
          season: 2026,
          book: 'betonline',
          market_type: 'superbowl',
          team: 'Kansas City Chiefs',
          selection: 'Kansas City Chiefs',
          odds: 550,
          price: 550,
          implied_prob: 0.1538,
          line: null,
          over_price: null,
          under_price: null,
        },
      ];

      expect(FUTURES_IMPORT_KEYS).toContain('odds');
      expect(FUTURES_IMPORT_KEYS).toContain('implied_prob');

      const semantic = canonicalSemanticRows(rows);
      expect(semantic).toHaveLength(1);
      expect(semantic[0].odds).toBe(550);
      expect(semantic[0].snapshot_time).toBeUndefined();
      expect(semantic[0].captured_at).toBeUndefined();

      const hash1 = computeSemanticHash(rows);
      const hash2 = computeSemanticHash(rows);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);

      // Verify capture timestamps are ignored in canonical semantic representation
      const rowsDifferentTimestamp = [
        {
          ...rows[0],
          snapshot_time: '2026-09-01T00:00:00Z',
          captured_at: '2026-09-01T00:00:00Z',
        },
      ];
      expect(computeSemanticHash(rowsDifferentTimestamp)).toBe(hash1);

      // Verify tampering in price/odds/line causes hash mismatch
      const corruptedRows = [
        {
          ...rows[0],
          odds: 600,
          price: 600,
        },
      ];
      expect(computeSemanticHash(corruptedRows)).not.toBe(hash1);
    });

    it('exercises fetchPersistedImportRowsPaged() keyset pagination with stable total order on id ASC', async () => {
      let callIndex = 0;
      const orderCalls = [];
      const gtCalls = [];

      const page1 = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        season: 2026,
        book: 'betonline',
        snapshot_time: '2026-06-02T00:00:00Z',
        odds: 100 + i,
      }));
      const page2 = Array.from({ length: 5 }, (_, i) => ({
        id: 11 + i,
        season: 2026,
        book: 'betonline',
        snapshot_time: '2026-06-02T00:00:00Z',
        odds: 200 + i,
      }));
      const pages = [page1, page2];

      const queryBuilder = {
        select: vi.fn(() => queryBuilder),
        eq: vi.fn(() => queryBuilder),
        order: vi.fn((col, opts) => {
          orderCalls.push({ col, opts });
          return queryBuilder;
        }),
        gt: vi.fn((col, val) => {
          gtCalls.push({ col, val });
          return queryBuilder;
        }),
        limit: vi.fn(() => queryBuilder),
        then: vi.fn((resolve) => {
          const page = pages[callIndex++] || [];
          return resolve({ data: page, error: null });
        }),
      };

      const mockClient = {
        from: vi.fn(() => queryBuilder),
      };

      const entry = { season: 2026, book: 'betonline', snapshot_time: '2026-06-02T00:00:00Z' };
      const { rows, error } = await fetchPersistedImportRowsPaged(mockClient, entry, { pageSize: 10 });

      expect(error).toBeNull();
      expect(rows).toHaveLength(15);
      expect(rows[0].id).toBe(1);
      expect(rows[9].id).toBe(10);
      expect(rows[10].id).toBe(11);
      expect(rows[14].id).toBe(15);

      // Verifies strict total ordering on id ASC
      expect(orderCalls).toEqual([
        { col: 'id', opts: { ascending: true } },
        { col: 'id', opts: { ascending: true } },
      ]);
      // Verifies keyset cursor using .gt('id', 10) on second page
      expect(gtCalls).toEqual([
        { col: 'id', val: 10 },
      ]);
    });

    it('exercises auditFuturesImportManifest() fail-closed semantic hash verification and count gates', async () => {
      const sampleDbRows = [
        {
          id: 1,
          season: 2026,
          book: 'betonline',
          snapshot_time: '2026-06-02T00:00:00Z',
          captured_at: '2026-06-02T00:00:00Z',
          market_type: 'superbowl',
          team: 'Kansas City Chiefs',
          selection: 'Kansas City Chiefs',
          odds: 550,
          price: 550,
          implied_prob: 0.1538,
          line: null,
          over_price: null,
          under_price: null,
        },
      ];
      const validSemanticHash = computeSemanticHash(sampleDbRows);
      const fakeDiskBytes = Buffer.from('{"test": true}');
      const fakeDiskHash = crypto.createHash('sha256').update(fakeDiskBytes).digest('hex');

      // 1. Missing semantic_sha256 in manifest must FAIL CLOSED (BLOCK)
      const missingHashResult = await auditFuturesImportManifest({
        manifestJson: {
          mode: 'applied',
          files: [
            {
              file: 'betonline-2026-06-02.json',
              status: 'persisted',
              sha256: fakeDiskHash,
              semantic_sha256: null, // Missing!
              season: 2026,
              book: 'betonline',
              snapshot_time: '2026-06-02T00:00:00Z',
              row_count: 1,
            },
          ],
        },
        fileNames: ['betonline-2026-06-02.json'],
        readFileBytes: async () => fakeDiskBytes,
        rowCount: async () => 1,
        fetchPersistedRows: async () => ({ rows: sampleDbRows, error: null }),
      });
      expect(missingHashResult.passed).toBe(false);
      expect(missingHashResult.problems).toContain('betonline-2026-06-02.json: persisted entry is missing semantic_sha256 in manifest');

      // 2. Hash mismatch between live database rows and manifest semantic_sha256 must FAIL
      const hashMismatchResult = await auditFuturesImportManifest({
        manifestJson: {
          mode: 'applied',
          files: [
            {
              file: 'betonline-2026-06-02.json',
              status: 'persisted',
              sha256: fakeDiskHash,
              semantic_sha256: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
              season: 2026,
              book: 'betonline',
              snapshot_time: '2026-06-02T00:00:00Z',
              row_count: 1,
            },
          ],
        },
        fileNames: ['betonline-2026-06-02.json'],
        readFileBytes: async () => fakeDiskBytes,
        rowCount: async () => 1,
        fetchPersistedRows: async () => ({ rows: sampleDbRows, error: null }),
      });
      expect(hashMismatchResult.passed).toBe(false);
      expect(hashMismatchResult.problems).toContain('betonline-2026-06-02.json: live database content hash mismatch');

      // 3. Paged read count discrepancy (liveCount !== dbRows.length) must FAIL
      const countMismatchResult = await auditFuturesImportManifest({
        manifestJson: {
          mode: 'applied',
          files: [
            {
              file: 'betonline-2026-06-02.json',
              status: 'persisted',
              sha256: fakeDiskHash,
              semantic_sha256: validSemanticHash,
              season: 2026,
              book: 'betonline',
              snapshot_time: '2026-06-02T00:00:00Z',
              row_count: 2,
            },
          ],
        },
        fileNames: ['betonline-2026-06-02.json'],
        readFileBytes: async () => fakeDiskBytes,
        rowCount: async () => 2,
        fetchPersistedRows: async () => ({ rows: [sampleDbRows[0]], error: null }), // Returned only 1 row!
      });
      expect(countMismatchResult.passed).toBe(false);
      expect(countMismatchResult.problems).toContain('betonline-2026-06-02.json: paged read retrieved 1/2 rows');

      // 4. Valid manifest with matching live rows and content hash PASSES cleanly
      const passResult = await auditFuturesImportManifest({
        manifestJson: {
          mode: 'applied',
          files: [
            {
              file: 'betonline-2026-06-02.json',
              status: 'persisted',
              sha256: fakeDiskHash,
              semantic_sha256: validSemanticHash,
              season: 2026,
              book: 'betonline',
              snapshot_time: '2026-06-02T00:00:00Z',
              row_count: 1,
            },
          ],
          totals: { persisted_valid_files: 1, valid_rows: 1 },
        },
        fileNames: ['betonline-2026-06-02.json'],
        readFileBytes: async () => fakeDiskBytes,
        rowCount: async () => 1,
        fetchPersistedRows: async () => ({ rows: sampleDbRows, error: null }),
      });
      expect(passResult.passed).toBe(true);
      expect(passResult.problems).toHaveLength(0);
      expect(passResult.totals.valid_rows).toBe(1);
    });
  });
});
