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
});
