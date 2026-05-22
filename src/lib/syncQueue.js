/**
 * syncQueue.js — Persistent dirty-flag retry queue for Supabase sync.
 *
 * When a cloud sync call fails (network error, 503, auth timeout), the
 * payload is written here.  On the next boot (or on explicit flush) each
 * queued item is retried.  Success clears the entry; failure leaves it
 * for the next attempt.
 *
 * Storage layout  (localStorage key: QUEUE_KEY)
 * ──────────────────────────────────────────────
 * [
 *   {
 *     type:      'bet' | 'pick' | 'deletePick',
 *     id:        string,         // dedup key
 *     payload:   Object | null,  // null for deletePick
 *     failedAt:  ISO string
 *   },
 *   ...
 * ]
 */

export const QUEUE_KEY = 'nfl_sync_dirty_queue_v1';

function loadQueue() {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
        // storage quota exceeded — best-effort
    }
}

/**
 * Add (or update) an entry in the dirty queue.
 * Deduplicates by type + id: newest payload always wins.
 */
export function enqueueDirty(type, id, payload = null) {
    const queue = loadQueue().filter(
        e => !(e.type === type && e.id === id)
    );
    queue.push({ type, id, payload, failedAt: new Date().toISOString() });
    saveQueue(queue);
}

/**
 * Remove a successfully-synced entry from the dirty queue.
 */
export function dequeueSuccess(type, id) {
    saveQueue(loadQueue().filter(e => !(e.type === type && e.id === id)));
}

/**
 * Return all pending dirty entries (read-only snapshot).
 */
export function getDirtyQueue() {
    return loadQueue();
}

/**
 * Flush the dirty queue by retrying each entry.
 * Callers supply the sync functions so this module stays dependency-free.
 *
 * @param {Function} syncBetFn       (bet) => Promise<void>
 * @param {Function} syncPickFn      (pick) => Promise<void>
 * @param {Function} deletePickFn    (id)   => Promise<void>
 */
export async function flushDirtyQueue(syncBetFn, syncPickFn, deletePickFn) {
    const queue = loadQueue();
    if (queue.length === 0) return;

    console.log(`[syncQueue] Flushing ${queue.length} dirty item(s)…`);

    for (const entry of queue) {
        try {
            if (entry.type === 'bet' && syncBetFn) {
                await syncBetFn(entry.payload);
            } else if (entry.type === 'pick' && syncPickFn) {
                await syncPickFn(entry.payload);
            } else if (entry.type === 'deletePick' && deletePickFn) {
                await deletePickFn(entry.id);
            }
            dequeueSuccess(entry.type, entry.id);
            console.log(`[syncQueue] Flushed ${entry.type}:${entry.id}`);
        } catch (e) {
            // Still failing — leave in queue for next boot
            console.warn(
                `[syncQueue] Retry failed for ${entry.type}:${entry.id}`,
                e.message
            );
        }
    }
}
