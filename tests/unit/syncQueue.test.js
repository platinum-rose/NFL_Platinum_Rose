import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── localStorage stub (vitest runs in 'node' env, no DOM) ──────────────────
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

// Import after stubbing so the module picks up the stub
import {
    QUEUE_KEY,
    enqueueDirty,
    dequeueSuccess,
    getDirtyQueue,
    flushDirtyQueue,
} from '../../src/lib/syncQueue.js';

beforeEach(() => {
    ls.clear();
});

// ── enqueueDirty ─────────────────────────────────────────────────────────────
describe('enqueueDirty', () => {
    it('adds a new entry to the queue', () => {
        enqueueDirty('bet', 'b1', { id: 'b1', amount: 50 });
        const q = getDirtyQueue();
        expect(q).toHaveLength(1);
        expect(q[0]).toMatchObject({ type: 'bet', id: 'b1' });
    });

    it('deduplicates by type+id — newest payload wins', () => {
        enqueueDirty('bet', 'b1', { id: 'b1', amount: 50 });
        enqueueDirty('bet', 'b1', { id: 'b1', amount: 75 }); // update
        const q = getDirtyQueue();
        expect(q).toHaveLength(1);
        expect(q[0].payload.amount).toBe(75);
    });

    it('keeps separate entries for different ids', () => {
        enqueueDirty('bet', 'b1', { id: 'b1' });
        enqueueDirty('bet', 'b2', { id: 'b2' });
        expect(getDirtyQueue()).toHaveLength(2);
    });

    it('keeps separate entries for same id but different types', () => {
        enqueueDirty('bet',  'x1', { id: 'x1' });
        enqueueDirty('pick', 'x1', { id: 'x1' });
        expect(getDirtyQueue()).toHaveLength(2);
    });

    it('stores failedAt as an ISO timestamp string', () => {
        enqueueDirty('pick', 'p1', { id: 'p1' });
        const { failedAt } = getDirtyQueue()[0];
        expect(new Date(failedAt).getTime()).not.toBeNaN();
    });
});

// ── dequeueSuccess ────────────────────────────────────────────────────────────
describe('dequeueSuccess', () => {
    it('removes the matching entry', () => {
        enqueueDirty('bet', 'b1', {});
        enqueueDirty('bet', 'b2', {});
        dequeueSuccess('bet', 'b1');
        const q = getDirtyQueue();
        expect(q).toHaveLength(1);
        expect(q[0].id).toBe('b2');
    });

    it('does nothing when entry does not exist', () => {
        enqueueDirty('bet', 'b1', {});
        dequeueSuccess('bet', 'MISSING');
        expect(getDirtyQueue()).toHaveLength(1);
    });
});

// ── flushDirtyQueue ───────────────────────────────────────────────────────────
describe('flushDirtyQueue', () => {
    it('calls syncBet for queued bets and clears on success', async () => {
        enqueueDirty('bet', 'b1', { id: 'b1', amount: 100 });
        const syncBetFn = vi.fn().mockResolvedValue(undefined);
        await flushDirtyQueue(syncBetFn, undefined, undefined);
        expect(syncBetFn).toHaveBeenCalledWith({ id: 'b1', amount: 100 });
        expect(getDirtyQueue()).toHaveLength(0);
    });

    it('calls syncPickFn for queued picks and clears on success', async () => {
        enqueueDirty('pick', 'p1', { id: 'p1' });
        const syncPickFn = vi.fn().mockResolvedValue(undefined);
        await flushDirtyQueue(undefined, syncPickFn, undefined);
        expect(syncPickFn).toHaveBeenCalledWith({ id: 'p1' });
        expect(getDirtyQueue()).toHaveLength(0);
    });

    it('calls deletePickFn for queued deletePick entries', async () => {
        enqueueDirty('deletePick', 'p2', null);
        const deletePickFn = vi.fn().mockResolvedValue(undefined);
        await flushDirtyQueue(undefined, undefined, deletePickFn);
        expect(deletePickFn).toHaveBeenCalledWith('p2');
        expect(getDirtyQueue()).toHaveLength(0);
    });

    // Core audit test: simulate 503 → entry stays in queue → retry succeeds
    it('leaves entry in queue when sync still fails (simulated 503)', async () => {
        enqueueDirty('bet', 'b1', { id: 'b1' });
        const syncBetFn = vi.fn().mockRejectedValue(new Error('503'));
        await flushDirtyQueue(syncBetFn, undefined, undefined);
        expect(getDirtyQueue()).toHaveLength(1); // still dirty
    });

    it('retries on next flush after transient failure', async () => {
        enqueueDirty('bet', 'b1', { id: 'b1' });

        // First flush — 503
        const failingSync = vi.fn().mockRejectedValue(new Error('503'));
        await flushDirtyQueue(failingSync, undefined, undefined);
        expect(getDirtyQueue()).toHaveLength(1);

        // Second flush — success
        const successSync = vi.fn().mockResolvedValue(undefined);
        await flushDirtyQueue(successSync, undefined, undefined);
        expect(getDirtyQueue()).toHaveLength(0);
    });

    it('is a no-op when the queue is empty', async () => {
        const syncBetFn = vi.fn();
        await flushDirtyQueue(syncBetFn, undefined, undefined);
        expect(syncBetFn).not.toHaveBeenCalled();
    });
});
