import { describe, it, expect } from 'vitest';
import { processBookmarkedTweet } from '../../agents/twitter-bookmarks-agent.js';

describe('twitter-bookmarks-agent', () => {
  it('processes NFL bookmark into NFL/Bookmarks path', async () => {
    const bm = {
      id: 'test-nfl-bm-1',
      author: 'TestSharp',
      author_name: 'Test Sharp',
      text: 'KC Chiefs vs BAL Ravens spread moved from -2.5 to -3.0.',
      created_at: new Date().toISOString(),
      url: 'https://x.com/TestSharp/status/1'
    };
    const res = await processBookmarkedTweet(bm);
    expect(res.skipped).toBe(false);
    expect(res.sport).toBe('NFL');
    expect(res.vaultPath).toContain('NFL/Bookmarks/');
  });

  it('processes College Basketball bookmark into NCAA/Bookmarks path', async () => {
    const bm = {
      id: 'test-cbb-bm-2',
      author: 'TestCbb',
      author_name: 'Test CBB',
      text: 'March Madness CBB Kenpom rank: UConn -4.5 vs Duke.',
      created_at: new Date().toISOString(),
      url: 'https://x.com/TestCbb/status/2'
    };
    const res = await processBookmarkedTweet(bm);
    expect(res.skipped).toBe(false);
    expect(res.sport).toBe('NCAA_CBB');
    expect(res.vaultPath).toContain('NCAA/Bookmarks/');
  });

  it('skips non-target tech or crypto bookmarks', async () => {
    const bm = {
      id: 'test-tech-bm-3',
      author: 'TechNews',
      author_name: 'Tech News',
      text: 'New smartphone announced with quantum AI camera sensor.',
      created_at: new Date().toISOString(),
      url: 'https://x.com/TechNews/status/3'
    };
    const res = await processBookmarkedTweet(bm);
    expect(res.skipped).toBe(true);
  });
});
