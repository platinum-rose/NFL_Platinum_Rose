import { describe, it, expect } from 'vitest';
import { scanDropDirectory } from '../../agents/screenshot-watcher.js';

describe('screenshot-watcher', () => {
  it('scans drop directory cleanly without crashing', async () => {
    const results = await scanDropDirectory();
    expect(Array.isArray(results)).toBe(true);
  });
});
