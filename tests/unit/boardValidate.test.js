import { describe, expect, it } from 'vitest';
import {
  bettableBooks,
  findRow,
  isWinsRow,
  nBooksFor,
  quotedComboFor,
  recomputedEdgePct,
  sideOfSelection,
  validateBoard,
  validateBoardBatch,
} from '../../agents/lib/board-validate.js';

function makeDossier(overrides = {}) {
  return {
    synthesis_input: {
      wins: [
        {
          team: 'Bills', team_nick: 'Bills', consensus_line: 6.5,
          line_consensus_confidence: { over_n_books: 3, under_n_books: 3 },
          best_over_edge_pct: 3.5, best_under_edge_pct: -2.1,
          books: { bookmaker: { line: 6.5, over: 130, under: -150, over_edge: 3.5, under_edge: -2.1 } },
        },
        {
          team: 'Patriots', team_nick: 'Patriots', consensus_line: 5.5,
          line_consensus_confidence: { over_n_books: 1, under_n_books: 1 },
          best_over_edge_pct: 4.0, best_under_edge_pct: null,
          books: { bookmaker: { line: 5.5, over: 110, under: -130, over_edge: 4.0, under_edge: null } },
        },
      ],
      most_wins: [
        { team: 'Chiefs', team_nick: 'Chiefs', n_books: 2, best_price: 800, best_book: 'bookmaker', books: { bookmaker: { price: 800 } } },
      ],
      playoffs: [
        { team: 'Giants', team_nick: 'Giants', n_books: 4, best_price: 150, best_book: 'bookmaker', books: { bookmaker: { price: 150 }, fanduel: { price: 140 } } },
      ],
      superbowl_matchup: [
        { team_a: 'Chiefs', team_b: '49ers', n_books: 6, best_price: 900, best_book: 'bookmaker', books: { bookmaker: { price: 900 } } },
      ],
      ...overrides,
    },
  };
}

describe('helper functions', () => {
  it('bettableBooks defaults to the same placeable set as portfolio-dossier.js', () => {
    const set = bettableBooks({});
    expect(set.has('bookmaker')).toBe(true);
    expect(set.has('betonline')).toBe(true);
    expect(set.has('fanduel')).toBe(false);
    expect(set.has('draftkings')).toBe(false);
  });

  it('bettableBooks respects a BETTABLE_BOOKS env override', () => {
    const set = bettableBooks({ BETTABLE_BOOKS: 'bookmaker, circa' });
    expect(set.has('bookmaker')).toBe(true);
    expect(set.has('circa')).toBe(true);
    expect(set.has('betonline')).toBe(false);
  });

  it('isWinsRow detects consensus_line presence', () => {
    expect(isWinsRow({ consensus_line: 6.5 })).toBe(true);
    expect(isWinsRow({ n_books: 3 })).toBe(false);
    expect(isWinsRow(null)).toBe(false);
  });

  it('sideOfSelection parses over/under from free text', () => {
    expect(sideOfSelection('Bills Over 6.5')).toBe('over');
    expect(sideOfSelection('Patriots Under 5.5')).toBe('under');
    expect(sideOfSelection('Giants to make the playoffs')).toBeNull();
  });

  it('nBooksFor uses max(over,under) n_books for wins rows and flat n_books elsewhere', () => {
    const dossier = makeDossier();
    expect(nBooksFor(dossier.synthesis_input.wins[0])).toBe(3);
    expect(nBooksFor(dossier.synthesis_input.wins[1])).toBe(1);
    expect(nBooksFor(dossier.synthesis_input.playoffs[0])).toBe(4);
    expect(nBooksFor(null)).toBeNull();
  });

  it('findRow matches wins/outright rows by team substring in selection', () => {
    const dossier = makeDossier();
    const row = findRow(dossier, { market: 'wins', selection: 'Bills Over 6.5' });
    expect(row?.team).toBe('Bills');
  });

  it('findRow matches superbowl_matchup rows requiring both teams present', () => {
    const dossier = makeDossier();
    const row = findRow(dossier, { market: 'superbowl_matchup', selection: 'Kansas City Chiefs vs San Francisco 49ers' });
    expect(row?.team_a).toBe('Chiefs');
  });

  it('findRow returns null when nothing matches', () => {
    const dossier = makeDossier();
    expect(findRow(dossier, { market: 'wins', selection: 'Nonexistent Team Over 6.5' })).toBeNull();
    expect(findRow(dossier, { market: 'not_a_real_market', selection: 'Bills Over 6.5' })).toBeNull();
  });

  it('quotedComboFor matches an exact book+price on a wins row (either side)', () => {
    const dossier = makeDossier();
    const row = dossier.synthesis_input.wins[0];
    expect(quotedComboFor(row, { book: 'bookmaker', price: 130 })).toMatchObject({ line: 6.5, side: 'over' });
    expect(quotedComboFor(row, { book: 'bookmaker', price: -150 })).toMatchObject({ line: 6.5, side: 'under' });
    expect(quotedComboFor(row, { book: 'bookmaker', price: 999 })).toBeNull();
    expect(quotedComboFor(row, { book: 'unknownbook', price: 130 })).toBeNull();
  });

  it('quotedComboFor matches an exact book+price on an outright row', () => {
    const dossier = makeDossier();
    const row = dossier.synthesis_input.playoffs[0];
    expect(quotedComboFor(row, { book: 'bookmaker', price: 150 })).toMatchObject({ price: 150 });
    expect(quotedComboFor(row, { book: 'bookmaker', price: 140 })).toBeNull(); // that price is fanduel's, not bookmaker's
  });

  it('recomputedEdgePct prefers candidate.code_edge_pct when present', () => {
    const dossier = makeDossier();
    const row = dossier.synthesis_input.wins[0];
    expect(recomputedEdgePct(row, { code_edge_pct: 9.9, selection: 'Bills Over 6.5' })).toBe(9.9);
  });

  it('recomputedEdgePct falls back to the dossier win-dist edge fields for wins rows', () => {
    const dossier = makeDossier();
    const row = dossier.synthesis_input.wins[0];
    expect(recomputedEdgePct(row, { selection: 'Bills Over 6.5' })).toBe(3.5);
    expect(recomputedEdgePct(row, { selection: 'Bills Under 6.5' })).toBe(-2.1);
  });

  it('recomputedEdgePct returns null for non-wins rows with no code_edge_pct', () => {
    const dossier = makeDossier();
    const row = dossier.synthesis_input.playoffs[0];
    expect(recomputedEdgePct(row, { selection: 'Giants to make the playoffs' })).toBeNull();
  });
});

describe('validateBoard', () => {
  it('returns no violations for a clean, fully-matching wins candidate', () => {
    const dossier = makeDossier();
    const candidate = {
      market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 3.5,
    };
    expect(validateBoard(candidate, dossier)).toEqual([]);
  });

  it('flags no_dossier_row when the market/selection cannot be matched', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'wins', selection: 'Unmapped Team Over 3.5', book: 'bookmaker', price: 100 }, dossier);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('no_dossier_row');
  });

  it('flags sim_price_only_market for any superbowl_matchup candidate, even a well-quoted one', () => {
    const dossier = makeDossier();
    const violations = validateBoard({
      market: 'superbowl_matchup', selection: 'Kansas City Chiefs vs San Francisco 49ers', book: 'bookmaker', price: 900,
    }, dossier);
    expect(violations.some((v) => v.startsWith('sim_price_only_market'))).toBe(true);
  });

  it('flags thin_market when fewer than 3 books quote the row (kills most_wins-style cards)', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'most_wins', selection: 'Kansas City Chiefs to lead the league in wins', book: 'bookmaker', price: 800 }, dossier);
    expect(violations.some((v) => v.startsWith('thin_market'))).toBe(true);
  });

  it('flags thin_market on a wins row with only 1 book quoting a side', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'wins', selection: 'Patriots Over 5.5', book: 'bookmaker', price: 110, edge_pct: 4.0 }, dossier);
    expect(violations.some((v) => v.startsWith('thin_market'))).toBe(true);
  });

  it('flags book_not_bettable when the candidate cites a non-placeable book', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'playoffs', selection: 'Giants to make the playoffs', book: 'fanduel', price: 140 }, dossier);
    expect(violations.some((v) => v.startsWith('book_not_bettable'))).toBe(true);
  });

  it('flags no_matching_quote when the book+price combo does not exist in the dossier', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 999, edge_pct: 3.5 }, dossier);
    expect(violations.some((v) => v.startsWith('no_matching_quote'))).toBe(true);
  });

  it('flags edge_mismatch when the claimed edge diverges from the dossier by more than 2pts', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 9.5 }, dossier);
    expect(violations.some((v) => v.startsWith('edge_mismatch'))).toBe(true);
  });

  it('does not flag edge_mismatch when within the 2pt tolerance', () => {
    const dossier = makeDossier();
    const violations = validateBoard({ market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 5.4 }, dossier);
    expect(violations.some((v) => v.startsWith('edge_mismatch'))).toBe(false);
  });

  it('returns [] for a null/undefined candidate rather than throwing', () => {
    expect(validateBoard(null, makeDossier())).toEqual([]);
  });
});

describe('validateBoardBatch (annotate-and-keep)', () => {
  it('stamps validation onto failing candidates without dropping any candidate', () => {
    const dossier = makeDossier();
    const candidates = [
      { key: 'clean', market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 3.5 },
      { key: 'bad-book', market: 'playoffs', selection: 'Giants to make the playoffs', book: 'fanduel', price: 140 },
      { key: 'thin', market: 'most_wins', selection: 'Kansas City Chiefs to lead the league in wins', book: 'bookmaker', price: 800 },
    ];
    const result = validateBoardBatch(candidates, dossier);
    expect(result).toHaveLength(3); // annotate-and-keep: nothing dropped
    expect(result.find((c) => c.key === 'clean').validation).toBeUndefined();
    expect(result.find((c) => c.key === 'bad-book').validation.some((v) => v.startsWith('book_not_bettable'))).toBe(true);
    expect(result.find((c) => c.key === 'thin').validation.some((v) => v.startsWith('thin_market'))).toBe(true);
  });

  it('is a no-op on an empty list', () => {
    expect(validateBoardBatch([], makeDossier())).toEqual([]);
  });
});
