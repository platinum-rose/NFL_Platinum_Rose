/**
 * Unit tests for src/lib/expertStats.js
 *
 * gradeExpertPicksForGame, computeExpertStandings, getAllExpertPicks
 * are all pure functions — no mocks needed.
 *
 * Run: npx vitest run tests/unit/expertStats.test.js
 */

import { describe, it, expect, vi } from 'vitest';

// gradeExpertPicksFromResults reads from localStorage via storage.js — mock it.
vi.mock('../../src/lib/storage.js', () => ({
    loadFromStorage: vi.fn(() => ({})),
    saveToStorage: vi.fn(),
}));

import {
    gradeExpertPicksForGame,
    gradeExpertPicksFromResults,
    computeExpertStandings,
    getAllExpertPicks,
} from '../../src/lib/expertStats.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Build a minimal spread pick */
const spreadPick = (overrides = {}) => ({
    id: 'pick-1',
    expert: 'Kirk Herbstreit',
    pick: 'Chiefs -3',
    line: -3,
    pickType: 'spread',
    isHomeTeam: true,
    home: 'Chiefs',
    visitor: 'Raiders',
    units: 1,
    result: 'PENDING',
    ...overrides,
});

/** Build a minimal total pick */
const totalPick = (overrides = {}) => ({
    id: 'pick-2',
    expert: 'Kirk Herbstreit',
    pick: 'Over 47',
    line: 47,
    pickType: 'total',
    isHomeTeam: null,
    home: 'Chiefs',
    visitor: 'Raiders',
    units: 1,
    result: 'PENDING',
    ...overrides,
});

/** Minimal consensus with one game */
const singleGameConsensus = (spreadPicks = [], totalPicks = []) => ({
    'game-001': {
        expertPicks: {
            spread: spreadPicks,
            total: totalPicks,
        },
    },
});

// ── gradeExpertPicksForGame ───────────────────────────────────────────────────

describe('gradeExpertPicksForGame', () => {
    it('returns unchanged consensus when gameId not found', () => {
        const consensus = {};
        const result = gradeExpertPicksForGame(consensus, 'unknown-game', 20, 17);
        expect(result.graded).toBe(0);
        expect(result.consensus).toBe(consensus);
    });

    it('returns graded=0 for a game with no picks', () => {
        const consensus = singleGameConsensus([], []);
        const result = gradeExpertPicksForGame(consensus, 'game-001', 20, 17);
        expect(result.graded).toBe(0);
    });

    // ── Spread grading ────────────────────────────────────────────────────────

    it('grades a spread WIN for home team covering', () => {
        // Home -3, wins by 7 → covers
        const pick = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        const consensus = singleGameConsensus([pick]);
        const { consensus: updated, graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 24, 17
        );
        expect(graded).toBe(1);
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('WIN');
    });

    it('grades a spread LOSS for home team not covering', () => {
        // Home -3, wins by only 2 → does not cover
        const pick = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        const consensus = singleGameConsensus([pick]);
        const { consensus: updated, graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 19, 17
        );
        expect(graded).toBe(1);
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('LOSS');
    });

    it('grades a spread PUSH when home team wins exactly on the number', () => {
        // Home -3, wins by exactly 3 → push
        const pick = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        const consensus = singleGameConsensus([pick]);
        const { consensus: updated, graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 20, 17
        );
        expect(graded).toBe(1);
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('PUSH');
    });

    it('grades visitor spread pick correctly (visitor wins)', () => {
        // Visitor at +3 — visitor loses by 7 → visitor pick LOSS
        const pick = spreadPick({
            id: 'p1', line: 3, isHomeTeam: false,
        });
        const consensus = singleGameConsensus([pick]);
        // Home wins 24-17: visitor loses by 7, but had +3 → net = -7 + 3 = -4 → LOSS
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 24, 17
        );
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('LOSS');
    });

    it('grades visitor spread WIN when visitor covers', () => {
        // Visitor +7 — home wins by 3 → visitor covers (net = -3 + 7 = +4 → WIN)
        const pick = spreadPick({
            id: 'p1', line: 7, isHomeTeam: false,
        });
        const consensus = singleGameConsensus([pick]);
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 20, 17
        );
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('WIN');
    });

    // ── Total grading ─────────────────────────────────────────────────────────

    it('grades an OVER WIN when total exceeds the line', () => {
        const pick = totalPick({ id: 'p2', pick: 'Over 40', line: 40 });
        const consensus = singleGameConsensus([], [pick]);
        const { consensus: updated, graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 24, 20   // total = 44 > 40
        );
        expect(graded).toBe(1);
        expect(updated['game-001'].expertPicks.total[0].result).toBe('WIN');
    });

    it('grades an OVER LOSS when total is under the line', () => {
        const pick = totalPick({ id: 'p2', pick: 'Over 50', line: 50 });
        const consensus = singleGameConsensus([], [pick]);
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 17, 14  // total = 31 < 50
        );
        expect(updated['game-001'].expertPicks.total[0].result).toBe('LOSS');
    });

    it('grades an UNDER WIN when total is under the line', () => {
        const pick = totalPick({ id: 'p2', pick: 'Under 50', line: 50 });
        const consensus = singleGameConsensus([], [pick]);
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 17, 14   // total = 31 < 50 → UNDER wins
        );
        expect(updated['game-001'].expertPicks.total[0].result).toBe('WIN');
    });

    it('grades a total PUSH when score equals the line exactly', () => {
        const pick = totalPick({ id: 'p2', pick: 'Over 44', line: 44 });
        const consensus = singleGameConsensus([], [pick]);
        const { consensus: updated, graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 24, 20   // total = 44 exactly
        );
        expect(graded).toBe(1);
        expect(updated['game-001'].expertPicks.total[0].result).toBe('PUSH');
    });

    it('handles "o" shorthand in pick text as over', () => {
        const pick = totalPick({ id: 'p2', pick: 'o', line: 40 });
        const consensus = singleGameConsensus([], [pick]);
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 24, 20  // 44 > 40 → WIN
        );
        expect(updated['game-001'].expertPicks.total[0].result).toBe('WIN');
    });

    it('grades an already-graded pick as unchanged', () => {
        const pick = spreadPick({ id: 'p1', result: 'WIN' });
        const consensus = singleGameConsensus([pick]);
        const { graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 30, 17
        );
        expect(graded).toBe(0);
    });

    it('handles spread pick with NaN line as LOSS', () => {
        const pick = spreadPick({ id: 'p1', line: 'bad', isHomeTeam: true });
        const consensus = singleGameConsensus([pick]);
        const { consensus: updated } = gradeExpertPicksForGame(
            consensus, 'game-001', 30, 17
        );
        expect(updated['game-001'].expertPicks.spread[0].result).toBe('LOSS');
    });

    it('grades multiple picks in one call', () => {
        const p1 = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        const p2 = totalPick({ id: 'p2', pick: 'Over 44', line: 44 });
        const consensus = singleGameConsensus([p1], [p2]);
        const { graded } = gradeExpertPicksForGame(
            consensus, 'game-001', 30, 17  // spread: 30-17=13, -3 net = 10 → WIN; total = 47 > 44 → WIN
        );
        expect(graded).toBe(2);
    });

    it('does not mutate the original consensus object', () => {
        const pick = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        const consensus = singleGameConsensus([pick]);
        const original = JSON.parse(JSON.stringify(consensus));
        gradeExpertPicksForGame(consensus, 'game-001', 30, 17);
        expect(consensus['game-001'].expertPicks.spread[0].result).toBe('PENDING');
        expect(consensus).toEqual(original);
    });
});

// ── computeExpertStandings ────────────────────────────────────────────────────

describe('computeExpertStandings', () => {
    it('returns empty array for empty consensus', () => {
        expect(computeExpertStandings({})).toEqual([]);
    });

    it('returns one entry per expert', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'PickA', result: 'WIN' }),
                        spreadPick({ id: 'p2', expert: 'PickB', result: 'LOSS' }),
                    ],
                    total: [],
                },
            },
        };
        const standings = computeExpertStandings(consensus);
        expect(standings).toHaveLength(2);
        const names = standings.map(s => s.expert);
        expect(names).toContain('PickA');
        expect(names).toContain('PickB');
    });

    it('counts wins and losses correctly', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'Expert1', result: 'WIN' }),
                        spreadPick({ id: 'p2', expert: 'Expert1', result: 'LOSS' }),
                        spreadPick({ id: 'p3', expert: 'Expert1', result: 'WIN' }),
                    ],
                    total: [],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.wins).toBe(2);
        expect(expert.losses).toBe(1);
        expect(expert.graded).toBe(3);
    });

    it('computes record string in W-L format', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'E1', result: 'WIN' }),
                        spreadPick({ id: 'p2', expert: 'E1', result: 'LOSS' }),
                    ],
                    total: [],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.record).toBe('1-1');
    });

    it('includes push in record when pushes > 0', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'E1', result: 'WIN' }),
                        spreadPick({ id: 'p2', expert: 'E1', result: 'PUSH' }),
                    ],
                    total: [],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.record).toBe('1-0-1');
    });

    it('winPct is null when no graded picks exist', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [spreadPick({ id: 'p1', expert: 'E1', result: 'PENDING' })],
                    total: [],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.winPct).toBeNull();
    });

    it('tracks pending picks separately', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'E1', result: 'PENDING' }),
                        spreadPick({ id: 'p2', expert: 'E1', result: 'PENDING' }),
                    ],
                    total: [],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.pending).toBe(2);
        expect(expert.graded).toBe(0);
    });

    it('sorts winners before losers by winPct', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'Loser', result: 'LOSS' }),
                        spreadPick({ id: 'p2', expert: 'Winner', result: 'WIN' }),
                    ],
                    total: [],
                },
            },
        };
        const standings = computeExpertStandings(consensus);
        expect(standings[0].expert).toBe('Winner');
        expect(standings[1].expert).toBe('Loser');
    });

    it('tracks spreadRecord and totalRecord separately', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [spreadPick({ id: 'p1', expert: 'E1', result: 'WIN' })],
                    total:  [totalPick({ id: 'p2', expert: 'E1', result: 'LOSS' })],
                },
            },
        };
        const [expert] = computeExpertStandings(consensus);
        expect(expert.spreadRecord).toBe('1-0');
        expect(expert.totalRecord).toBe('0-1');
    });

    it('skips picks missing expert field', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [{ ...spreadPick(), expert: null, id: 'p1', result: 'WIN' }],
                    total: [],
                },
            },
        };
        const standings = computeExpertStandings(consensus);
        expect(standings).toHaveLength(0);
    });
});

// ── getAllExpertPicks ──────────────────────────────────────────────────────────

describe('getAllExpertPicks', () => {
    it('returns empty array for empty consensus', () => {
        expect(getAllExpertPicks({})).toEqual([]);
    });

    it('returns all picks across all games as flat array', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [spreadPick({ id: 'p1' })],
                    total:  [totalPick({ id: 'p2' })],
                },
            },
            'g2': {
                expertPicks: {
                    spread: [spreadPick({ id: 'p3', expert: 'Other' })],
                    total:  [],
                },
            },
        };
        const picks = getAllExpertPicks(consensus);
        expect(picks).toHaveLength(3);
    });

    it('adds gameId to each pick', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [spreadPick({ id: 'p1' })],
                    total:  [],
                },
            },
        };
        const [pick] = getAllExpertPicks(consensus);
        expect(pick.gameId).toBe('g1');
    });

    it('adds category "spread" to spread picks', () => {
        const consensus = singleGameConsensus([spreadPick({ id: 'p1' })], []);
        const picks = getAllExpertPicks(consensus);
        expect(picks[0].category).toBe('spread');
    });

    it('adds category "total" to total picks', () => {
        const consensus = singleGameConsensus([], [totalPick({ id: 'p2' })]);
        const picks = getAllExpertPicks(consensus);
        expect(picks[0].category).toBe('total');
    });

    it('filters by expert when filterExpert is provided', () => {
        const consensus = {
            'g1': {
                expertPicks: {
                    spread: [
                        spreadPick({ id: 'p1', expert: 'Alice' }),
                        spreadPick({ id: 'p2', expert: 'Bob' }),
                    ],
                    total: [],
                },
            },
        };
        const picks = getAllExpertPicks(consensus, 'Alice');
        expect(picks).toHaveLength(1);
        expect(picks[0].expert).toBe('Alice');
    });

    it('returns all picks when filterExpert is null', () => {
        const consensus = singleGameConsensus(
            [spreadPick({ id: 'p1' }), spreadPick({ id: 'p2', expert: 'Other' })],
            []
        );
        const picks = getAllExpertPicks(consensus, null);
        expect(picks).toHaveLength(2);
    });
});

// ── gradeExpertPicksFromResults ───────────────────────────────────────────────

describe('gradeExpertPicksFromResults', () => {
    it('returns 0 when no game results are final', async () => {
        const { loadFromStorage } = await import('../../src/lib/storage.js');
        loadFromStorage.mockReturnValueOnce({});
        const count = gradeExpertPicksFromResults([
            { espn_id: 'g1', status: 'scheduled', home_score: 0, away_score: 0 },
        ]);
        expect(count).toBe(0);
    });

    it('returns 0 when consensus has no matching gameId', async () => {
        const { loadFromStorage } = await import('../../src/lib/storage.js');
        loadFromStorage.mockReturnValueOnce({});
        const count = gradeExpertPicksFromResults([
            { espn_id: 'g99', status: 'final', home_score: 24, away_score: 17 },
        ]);
        expect(count).toBe(0);
    });

    it('grades picks for final games and returns count', async () => {
        const { loadFromStorage, saveToStorage } = await import(
            '../../src/lib/storage.js'
        );
        const pick = spreadPick({ id: 'p1', line: -3, isHomeTeam: true });
        loadFromStorage.mockReturnValueOnce(singleGameConsensus([pick]));
        const count = gradeExpertPicksFromResults([
            { espn_id: 'game-001', status: 'final', home_score: 30, away_score: 17 },
        ]);
        expect(count).toBe(1);
        expect(saveToStorage).toHaveBeenCalled();
    });
});
