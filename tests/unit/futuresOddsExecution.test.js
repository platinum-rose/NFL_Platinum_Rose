import { describe, expect, it } from 'vitest';
import {
  buildFuturesOddsExecutionValidation,
  classifyFuturesOddsRow,
  exactMatchupKey,
  exactMatchupTeams,
} from '../../scripts/lib/futures-odds-execution.js';

const currentRow = {
  snapshot_time: '2026-08-10T00:00:00Z',
  captured_at: '2026-08-10T00:00:00Z',
  season: 2026,
  book: 'betus',
  market_type: 'superbowl',
  team: 'Buffalo Bills',
  selection: 'Buffalo Bills',
  price: 1000,
};

describe('futures odds execution validation', () => {
  it('marks current placeable non-exacta rows execution-reference eligible', () => {
    const validation = classifyFuturesOddsRow(currentRow);

    expect(validation.execution_reference_eligible).toBe(true);
    expect(validation.execution_source_status).toBe('execution_reference_eligible_local_snapshot');
    expect(validation.exclusion_reasons).toEqual([]);
  });

  it('keeps non-placeable, stale, wrong-season, and missing-price rows context-only', () => {
    const rows = [
      { ...currentRow, book: 'fanduel' },
      { ...currentRow, snapshot_time: '2026-08-09T00:00:00Z' },
      { ...currentRow, season: 2025 },
      { ...currentRow, price: null, odds: null },
    ];

    const reasons = rows.map((row) => classifyFuturesOddsRow(row).exclusion_reasons[0]);
    expect(reasons).toEqual([
      'non_placeable_book',
      'not_current_local_snapshot',
      'wrong_season',
      'missing_price',
    ]);
  });

  it('parses exact Super Bowl matchup rows only from exact two-team selections', () => {
    const exact = {
      ...currentRow,
      market_type: 'superbowl_matchup',
      selection: 'Buffalo Bills vs Green Bay Packers',
      team: 'Buffalo Bills vs Green Bay Packers',
      price: 6500,
    };

    expect(exactMatchupTeams(exact)).toEqual(['Buffalo Bills', 'Green Bay Packers']);
    expect(exactMatchupKey(exact)).toBe('buffalo bills|green bay packers');
    expect(exactMatchupTeams({ ...exact, selection: 'Buffalo Bills / Green Bay Packers' })).toBeNull();
  });

  it('keeps one-book exactas monitor-only and permits multiple-book exact two-team rows', () => {
    const betusExacta = {
      ...currentRow,
      market_type: 'superbowl_matchup',
      selection: 'Buffalo Bills vs Green Bay Packers',
      team: 'Buffalo Bills vs Green Bay Packers',
      price: 6500,
    };
    const betonlineExacta = {
      ...betusExacta,
      book: 'betonline',
      selection: 'Green Bay Packers vs Buffalo Bills',
      team: 'Green Bay Packers vs Buffalo Bills',
      price: 7000,
    };

    const oneBook = buildFuturesOddsExecutionValidation({
      sources: { 'fixture-betus.json': [betusExacta] },
    }, { generatedAt: '2026-08-11T12:00:00.000Z' });
    expect(oneBook.bills_packers_exacta.status).toBe('monitor_only_exacta');
    expect(oneBook.bills_packers_exacta.execution_claim_allowed).toBe(false);
    expect(oneBook.meta.exacta_execution_claim_allowed_pairs).toBe(0);

    const twoBook = buildFuturesOddsExecutionValidation({
      sources: { 'fixture-betus.json': [betusExacta], 'fixture-betonline.json': [betonlineExacta] },
    }, { generatedAt: '2026-08-11T12:00:00.000Z' });
    expect(twoBook.bills_packers_exacta.status).toBe('exacta_execution_reference_confirmed');
    expect(twoBook.bills_packers_exacta.execution_claim_allowed).toBe(true);
    expect(twoBook.bills_packers_exacta.placeable_book_count).toBe(2);
    expect(twoBook.meta.exacta_execution_claim_allowed_pairs).toBe(1);
  });

  // 2026-08-13 Codex review findings #1 and #2.
  describe('Codex review regressions: non-placeable rows must not count toward exacta execution claims', () => {
    const betusExacta = {
      ...currentRow,
      market_type: 'superbowl_matchup',
      selection: 'Buffalo Bills vs Green Bay Packers',
      team: 'Buffalo Bills vs Green Bay Packers',
      price: 6500,
    };

    function pairedWith(book, price) {
      return buildFuturesOddsExecutionValidation({
        sources: {
          'fixture-betus.json': [betusExacta],
          'fixture-other.json': [{
            ...betusExacta,
            book,
            selection: 'Green Bay Packers vs Buffalo Bills',
            team: 'Green Bay Packers vs Buffalo Bills',
            price,
          }],
        },
      }, { generatedAt: '2026-08-11T12:00:00.000Z' });
    }

    it('BetUS + DraftKings exacta remains monitor-only (finding #1 reproduction)', () => {
      const result = pairedWith('draftkings', 6600);
      const pair = result.bills_packers_exacta;
      expect(pair.placeable_book_count).toBe(1);
      expect(pair.books).toEqual(['betus']);
      expect(pair.execution_claim_allowed).toBe(false);
      expect(pair.status).toBe('monitor_only_exacta');
      const dkRow = pair.rows.find((r) => r.book_raw === 'draftkings');
      expect(dkRow.exclusion_reasons).toContain('non_placeable_book');
      expect(dkRow.counts_toward_execution_claim).toBe(false);
    });

    it('BetUS + FanDuel exacta remains monitor-only', () => {
      const result = pairedWith('fanduel', 6600);
      expect(result.bills_packers_exacta.execution_claim_allowed).toBe(false);
      expect(result.bills_packers_exacta.books).toEqual(['betus']);
    });

    it('BetUS + BetOnline exacta can pass when the price gate passes', () => {
      const result = pairedWith('betonline', 7000);
      expect(result.bills_packers_exacta.execution_claim_allowed).toBe(true);
      expect(result.bills_packers_exacta.books).toEqual(['betonline', 'betus']);
    });

    it('BetUS + mgm alias counts only after canonicalization (finding #2)', () => {
      const result = pairedWith('mgm', 7000);
      expect(result.bills_packers_exacta.execution_claim_allowed).toBe(true);
      expect(result.bills_packers_exacta.books).toEqual(['betmgm', 'betus']);
    });

    it('BetUS + williamhill_us alias counts only after canonicalization (finding #2)', () => {
      const result = pairedWith('williamhill_us', 7000);
      expect(result.bills_packers_exacta.execution_claim_allowed).toBe(true);
      expect(result.bills_packers_exacta.books).toEqual(['betus', 'caesars']);
    });
  });

  describe('Codex review finding #2: alias canonicalization in classifyFuturesOddsRow', () => {
    it('classifies a raw "mgm" row as placeable and canonicalizes to betmgm', () => {
      const validation = classifyFuturesOddsRow({ ...currentRow, book: 'mgm' });
      expect(validation.exclusion_reasons).not.toContain('non_placeable_book');
      expect(validation.book).toBe('betmgm');
      expect(validation.book_raw).toBe('mgm');
      expect(validation.book_label).toBe('BetMGM');
      expect(validation.book_access).toBe('proxy');
    });

    it('classifies a raw "williamhill_us" row as placeable and canonicalizes to caesars', () => {
      const validation = classifyFuturesOddsRow({ ...currentRow, book: 'williamhill_us' });
      expect(validation.exclusion_reasons).not.toContain('non_placeable_book');
      expect(validation.book).toBe('caesars');
      expect(validation.book_label).toBe('Caesars/William Hill');
    });

    it('keeps DraftKings/FanDuel aliases non-placeable', () => {
      const dk = classifyFuturesOddsRow({ ...currentRow, book: 'dk' });
      const fd = classifyFuturesOddsRow({ ...currentRow, book: 'fd' });
      expect(dk.exclusion_reasons).toContain('non_placeable_book');
      expect(fd.exclusion_reasons).toContain('non_placeable_book');
    });
  });
});
