import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBookmarkedTweet } from '../../agents/twitter-bookmarks-agent.js';

// This test's 'NFL bookmark' case exercises the real processBookmarkedTweet
// path, which writes a local report file to .nfl/reports/twitter-bookmarks/
// (no fs mocking exists in this agent yet -- flagged as a real follow-up,
// not fixed here). That file is keyed by today's date + the fixture's id,
// so re-running this suite twice on the same day previously hit the agent's
// own deduplication gate and failed with skipped:true -- not a real
// regression, just this test polluting its own fixture path.
//
// Move the fixture report aside (not delete -- the sandboxed dev shell this
// repo runs under blocks rm/rmdir on mounted files, mv/rename is fine) into
// a git-ignored archive dir before and after each run so the test stays
// idempotent within a day. .nfl/reports/ is already git-ignored wholesale.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '..', '..', '.nfl', 'reports', 'twitter-bookmarks');
const ARCHIVE_DIR = path.join(REPORTS_DIR, '_test_fixture_archive');
const REPORT_FILENAME = `${new Date().toISOString().split('T')[0]}-TestSharp-test-nfl-bm-1.md`;
const REPORT_PATH = path.join(REPORTS_DIR, REPORT_FILENAME);

const archiveFixtureReport = () => {
  if (!existsSync(REPORT_PATH)) return;
  mkdirSync(ARCHIVE_DIR, { recursive: true });
  renameSync(REPORT_PATH, path.join(ARCHIVE_DIR, `${Date.now()}-${REPORT_FILENAME}`));
};

beforeEach(archiveFixtureReport);
afterEach(archiveFixtureReport);

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

  it('skips College Basketball bookmarks (NFL-only scope, confirmed 2026-08-28)', async () => {
    const bm = {
      id: 'test-cbb-bm-2',
      author: 'TestCbb',
      author_name: 'Test CBB',
      text: 'March Madness CBB Kenpom rank: UConn -4.5 vs Duke.',
      created_at: new Date().toISOString(),
      url: 'https://x.com/TestCbb/status/2'
    };
    const res = await processBookmarkedTweet(bm);
    expect(res.skipped).toBe(true);
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
