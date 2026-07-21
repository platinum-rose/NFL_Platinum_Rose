/**
 * Unit tests for agents/lib/obsidian-launch.js's ensureObsidianReachable().
 * checkFn/launchFn are injected mocks -- no real network calls or process
 * spawning happen in this file.
 */
import { describe, it, expect, vi } from 'vitest';
import { ensureObsidianReachable } from '../../agents/lib/obsidian-launch.js';

const FAST = { maxWaitMs: 30, pollIntervalMs: 5 };

describe('ensureObsidianReachable', () => {
  it('returns immediately without launching if already reachable', async () => {
    const checkFn = vi.fn().mockResolvedValue(true);
    const launchFn = vi.fn().mockReturnValue(true);
    const result = await ensureObsidianReachable({ url: 'https://localhost:27124/', checkFn, launchFn, ...FAST });
    expect(result).toEqual({ reachable: true, launched: false });
    expect(launchFn).not.toHaveBeenCalled();
  });

  it('launches and polls until reachable, then resolves launched: true', async () => {
    const checkFn = vi.fn()
      .mockResolvedValueOnce(false)  // initial check
      .mockResolvedValueOnce(false)  // poll 1
      .mockResolvedValueOnce(true);  // poll 2
    const launchFn = vi.fn().mockReturnValue(true);
    const result = await ensureObsidianReachable({ url: 'https://localhost:27124/', checkFn, launchFn, ...FAST });
    expect(result).toEqual({ reachable: true, launched: true });
    expect(launchFn).toHaveBeenCalledTimes(1);
    expect(checkFn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately if unreachable and launchFn reports no-op (non-Windows)', async () => {
    const checkFn = vi.fn().mockResolvedValue(false);
    const launchFn = vi.fn().mockReturnValue(false);
    await expect(
      ensureObsidianReachable({ url: 'https://localhost:27124/', checkFn, launchFn, ...FAST })
    ).rejects.toThrow(/auto-launch is only supported on Windows/);
    // Only the initial check -- no polling once we know we can't launch.
    expect(checkFn).toHaveBeenCalledTimes(1);
  });

  it('throws a timeout error if still unreachable after maxWaitMs', async () => {
    const checkFn = vi.fn().mockResolvedValue(false);
    const launchFn = vi.fn().mockReturnValue(true);
    await expect(
      ensureObsidianReachable({ url: 'https://localhost:27124/', checkFn, launchFn, ...FAST })
    ).rejects.toThrow(/still isn't reachable/);
  });

  it('passes url and obsidianKey through to checkFn', async () => {
    const checkFn = vi.fn().mockResolvedValue(true);
    await ensureObsidianReachable({ url: 'https://localhost:27124/', obsidianKey: 'secret-key', checkFn, ...FAST });
    expect(checkFn).toHaveBeenCalledWith('https://localhost:27124/', 'secret-key');
  });
});
