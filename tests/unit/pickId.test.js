/**
 * Unit tests for PICK-ID fix.
 *
 * Verifies that pick IDs are now stable natural keys (no Date.now()):
 *   "${source}-${gameId}-${pickType}-${line}"
 *
 * And that addPick deduplicates correctly — logging the same logical pick
 * twice results in exactly one row.
 *
 * Run: npx vitest run tests/unit/pickId.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── localStorage stub ─────────────────────────────────────────────────────────
// storage.js calls localStorage directly, so stubbing the global is enough.
// vitest runs in 'node' env — no DOM, no built-in localStorage.
function makeLocalStorage() {
    const store = {};
    return {
        getItem:    (k)     => (k in store ? store[k] : null),
        setItem:    (k, v)  => { store[k] = String(v); },
        removeItem: (k)     => { delete store[k]; },
        clear:      ()      => { Object.keys(store).forEach(k => delete store[k]); },
    };
}
const ls = makeLocalStorage();
vi.stubGlobal('localStorage', ls);

// ── Mock supabase + syncQueue (network / side-effects) ────────────────────────
vi.mock('../../src/lib/supabase.js', () => ({
    syncPick:         vi.fn(async () => null),
    deleteSyncedPick: vi.fn(async () => null),
}));
vi.mock('../../src/lib/syncQueue.js', () => ({
    enqueueDirty:   vi.fn(),
    dequeueSuccess: vi.fn(),
}));

// Import AFTER stubs are wired so picksDatabase picks up the ls stub
import { addPick, loadPicks } from '../../src/lib/picksDatabase.js';

// ── Shared pick factory ────────────────────────────────────────────────────────
function makePick(overrides = {}) {
    return {
        source:   'AI_LAB',
        gameId:   'nfl_2026_01_kc_bal',
        pickType: 'spread',
        line:     -3.5,
        selection: 'Kansas City Chiefs',
        home:     'Kansas City Chiefs',
        visitor:  'Baltimore Ravens',
        gameDate: '2026-09-07',
        confidence: 62,
        ...overrides,
    };
}

beforeEach(() => {
    ls.clear();
    vi.clearAllMocks();
});

// ── generateId — stable key ────────────────────────────────────────────────────

describe('pick ID — stable natural key', () => {
    it('addPick returns a predictable stable ID', () => {
        const pick = addPick(makePick());
        expect(pick.id).toBe('AI_LAB-nfl_2026_01_kc_bal-spread--3.5');
    });

    it('ID does not contain a 13-digit Unix timestamp', () => {
        const pick = addPick(makePick());
        expect(pick.id).not.toMatch(/\d{13}/);
    });

    it('ID format is "{source}-{gameId}-{pickType}-{line}"', () => {
        const pick = addPick(makePick());
        expect(pick.id).toBe('AI_LAB-nfl_2026_01_kc_bal-spread--3.5');
    });

    it('different line → different ID', () => {
        const p1 = addPick(makePick({ line: -3.5 }));
        ls.clear();
        const p2 = addPick(makePick({ line: -4 }));
        expect(p1.id).not.toBe(p2.id);
    });

    it('different pickType → different ID', () => {
        const p1 = addPick(makePick({ pickType: 'spread', line: 45.5 }));
        ls.clear();
        const p2 = addPick(makePick({ pickType: 'total', line: 45.5 }));
        expect(p1.id).not.toBe(p2.id);
    });

    it('different source → different ID', () => {
        const p1 = addPick(makePick({ source: 'AI_LAB' }));
        ls.clear();
        const p2 = addPick(makePick({ source: 'EXPERT' }));
        expect(p1.id).not.toBe(p2.id);
    });

    it('handles integer moneyline correctly', () => {
        const pick = addPick(makePick({ pickType: 'moneyline', line: -150 }));
        expect(pick.id).toBe('AI_LAB-nfl_2026_01_kc_bal-moneyline--150');
    });

    it('handles positive half-point line correctly', () => {
        const pick = addPick(makePick({ line: 3.5 }));
        expect(pick.id).toBe('AI_LAB-nfl_2026_01_kc_bal-spread-3.5');
    });
});

// ── addPick dedup ─────────────────────────────────────────────────────────────

describe('addPick — stable-key deduplication', () => {
    it('logging the same pick twice returns null on second call', () => {
        const first  = addPick(makePick());
        const second = addPick(makePick()); // same natural key → deduped
        expect(first).not.toBeNull();
        expect(second).toBeNull();
    });

    it('only 1 row exists after logging the same pick twice', () => {
        addPick(makePick());
        addPick(makePick());
        expect(loadPicks()).toHaveLength(1);
    });

    it('P&L is not double-counted — result stays PENDING on single row', () => {
        addPick(makePick());
        addPick(makePick());
        const picks = loadPicks();
        expect(picks).toHaveLength(1);
        expect(picks[0].result).toBe('PENDING');
    });

    it('picks with different lines both insert successfully', () => {
        addPick(makePick({ line: -3 }));
        addPick(makePick({ line: -3.5 }));
        expect(loadPicks()).toHaveLength(2);
    });

    it('picks with different pickTypes both insert successfully', () => {
        addPick(makePick({ pickType: 'spread', line: -3.5 }));
        addPick(makePick({ pickType: 'total',  line: 47.5 }));
        expect(loadPicks()).toHaveLength(2);
    });

    it('picks from different sources both insert successfully', () => {
        addPick(makePick({ source: 'AI_LAB' }));
        addPick(makePick({ source: 'EXPERT' }));
        expect(loadPicks()).toHaveLength(2);
    });
});
