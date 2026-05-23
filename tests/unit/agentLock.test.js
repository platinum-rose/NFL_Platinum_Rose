/**
 * Unit tests for AGENT-LOCK fix.
 *
 * protect-hot-files.js reads AGENT_LOCK.json to decide whether to warn.
 * The bug was that it checked `lock.locked` / `lock.agent` — fields that
 * don't exist in the actual schema.  The fix reads `activeLocks` array.
 *
 * We test the lock-detection logic inline (no subprocess) to avoid the
 * stdin-reading complexity of the hook entry point.
 */

import { describe, it, expect } from 'vitest';

// ── Inline lock-detection logic (mirrors the fixed hook) ─────────────────────

function hasActiveLock(lockJson) {
    try {
        const lock = typeof lockJson === 'string'
            ? JSON.parse(lockJson)
            : lockJson;
        return Array.isArray(lock?.activeLocks) && lock.activeLocks.length > 0;
    } catch {
        return false;
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AGENT_LOCK detection (protect-hot-files)', () => {
    it('returns false when activeLocks is empty (no lock held)', () => {
        const lock = { locks: {}, activeLocks: [], completedToday: [] };
        expect(hasActiveLock(lock)).toBe(false);
    });

    it('returns true when activeLocks has one entry', () => {
        const lock = { activeLocks: ['test-agent'] };
        expect(hasActiveLock(lock)).toBe(true);
    });

    it('returns true when activeLocks has multiple entries', () => {
        const lock = { activeLocks: ['agent-1', 'agent-2'] };
        expect(hasActiveLock(lock)).toBe(true);
    });

    it('returns false for the actual AGENT_LOCK.json default schema', () => {
        // This is the exact content of the file in the repo
        const raw = JSON.stringify({
            locks: {},
            lastUpdated: '2026-04-02T22:00:00.000Z',
            activeLocks: [],
            completedToday: [],
            conflictLog: [],
        });
        expect(hasActiveLock(raw)).toBe(false);
    });

    it('does NOT trigger on legacy lock.locked = true (old schema ignored)', () => {
        // Old schema the bug relied on — should evaluate as no-lock with the fix
        const lock = { locked: true, agent: 'old-agent' };
        expect(hasActiveLock(lock)).toBe(false);
    });

    it('returns false when activeLocks is missing entirely', () => {
        expect(hasActiveLock({})).toBe(false);
    });

    it('returns false when activeLocks is not an array', () => {
        expect(hasActiveLock({ activeLocks: 'bad-value' })).toBe(false);
    });

    it('returns false when lock file JSON is invalid', () => {
        expect(hasActiveLock('not-json{')).toBe(false);
    });

    it('returns false when lock is null', () => {
        expect(hasActiveLock(null)).toBe(false);
    });
});
