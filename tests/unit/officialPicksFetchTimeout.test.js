import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJson, PROBE_TIMEOUT_MS, FAILSAFE_TIMEOUT_MS } from '../../src/lib/officialPicksApi.js';

/**
 * Checkpoint 4 (2026-08-22) focused audit smoke test for UNIFIED_REPAIR_PLAN
 * item 2 / Checkpoint 4 item 13's "Picks & Inbox offline state" requirement.
 *
 * This covers the fetch-abort/timeout half of the offline-state mechanism
 * (fetchJson's AbortController, real production code -- exported verbatim,
 * not re-implemented) directly with fake timers.
 *
 * KNOWN GAP, documented rather than silently assumed covered: this does
 * NOT reproduce the deeper React-StrictMode `mountedRef` double-effect bug
 * that the Checkpoint 1 / Codex-review fix addressed (see the long comment
 * above `probe()` in OfficialPicksTab.jsx -- the tab could get stuck on
 * "checking" past 15s because a StrictMode double-invoked effect flipped
 * mountedRef.current to false and nothing flipped it back). That class of
 * bug is only reachable via a real component render under StrictMode,
 * which needs jsdom + @testing-library/react; this repo does not have that
 * dependency yet. A live browser check (as Checkpoint 1 already performed)
 * or adding jsdom/RTL remains the way to fully regression-guard it.
 *
 * Run: npx vitest run tests/unit/officialPicksFetchTimeout.test.js
 */
describe('fetchJson (Official Picks inbox probe timeout)', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = realFetch;
  });

  it('PROBE_TIMEOUT_MS is comfortably shorter than FAILSAFE_TIMEOUT_MS so the UI failsafe is a true backstop', () => {
    expect(PROBE_TIMEOUT_MS).toBeLessThan(FAILSAFE_TIMEOUT_MS);
  });

  it('resolves with parsed JSON when the server responds before the timeout', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ active_count: 2 }),
    }));
    const result = await fetchJson('http://127.0.0.1:8787/api/inbox');
    expect(result).toEqual({ active_count: 2 });
  });

  it('rejects with the server error message when the response is not ok', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'boom' }),
    }));
    await expect(fetchJson('http://127.0.0.1:8787/api/inbox')).rejects.toThrow('boom');
  });

  it('aborts and rejects once PROBE_TIMEOUT_MS elapses when the inbox server never responds (server not running)', async () => {
    global.fetch = vi.fn((_url, options = {}) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      });
    }));

    const pending = fetchJson('http://127.0.0.1:8787/api/inbox');
    const assertion = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS + 100);
    await assertion;
  });
});
