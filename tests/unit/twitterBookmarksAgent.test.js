import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 2026-09-01: force DRY_RUN before the agent module loads. Without this, the
// module's top-level `const DRY_RUN = argv.includes('--dry-run') ||
// process.env.DRY_RUN === 'true'` evaluates false under `npm test` (no argv
// flag, no env var set here), which meant every test run instantiated a real
// Supabase client from .env and processBookmarkedTweet() upserted this
// fixture straight into the LIVE production `vault_notes` table -- confirmed
// by 6 real `NFL/Bookmarks/*-TestSharp-test-nfl-bm-1.md` rows sitting in
// Supabase, one per day this suite happened to run. A static top-of-file
// import is hoisted before this assignment would run, so the import is
// deferred to a dynamic import after DRY_RUN is set.
process.env.DRY_RUN = 'true';
const { processBookmarkedTweet, buildPropSignalRows, shouldSkipAsAlreadyProcessed } = await import('../../agents/twitter-bookmarks-agent.js');

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

describe('buildPropSignalRows (Vision-OCR player-prop -> research_pick_signals mapping)', () => {
  it('maps a well-formed player prop into a signal row', () => {
    const rows = buildPropSignalRows(
      [{ player_name: 'Justin Jefferson', prop_type: 'Receiving Yards', side: 'OVER', line: '84.5', rationale: 'Circa ticket screenshot' }],
      { noteId: 42, eventRef: 'https://x.com/Sharp/status/999' }
    );
    expect(rows).toEqual([{
      note_id: 42,
      source: 'Twitter/X Bookmarks (Personal)',
      team_or_market: 'Justin Jefferson - Receiving Yards',
      bet_type: 'player_prop',
      lean: 'OVER 84.5',
      rationale: 'Circa ticket screenshot',
      event_ref: 'https://x.com/Sharp/status/999',
      confidence: 0.5,
    }]);
  });

  it('drops props missing player_name or prop_type rather than guessing', () => {
    const rows = buildPropSignalRows(
      [{ prop_type: 'Rushing Yards', side: 'UNDER', line: '60.5' }, { player_name: 'Someone' }],
      { noteId: 1, eventRef: 'https://x.com/x/status/1' }
    );
    expect(rows).toEqual([]);
  });

  it('falls back to "unspecified" lean when neither side nor line is present', () => {
    const rows = buildPropSignalRows(
      [{ player_name: 'Travis Kelce', prop_type: 'Receptions' }],
      { noteId: 7, eventRef: 'https://x.com/x/status/7' }
    );
    expect(rows[0].lean).toBe('unspecified');
  });

  it('returns an empty array for no props', () => {
    expect(buildPropSignalRows([], { noteId: 1, eventRef: 'x' })).toEqual([]);
    expect(buildPropSignalRows(undefined, { noteId: 1, eventRef: 'x' })).toEqual([]);
  });
});

// 2026-09-01: regression test for the DRY_RUN-only-dedup bug -- a concurrent
// edit ANDed `&& DRY_RUN` into this check, which meant it only ever fired
// during --dry-run and never in a real unattended run. This pins the
// predicate down independent of any DRY_RUN state.
describe('shouldSkipAsAlreadyProcessed', () => {
  it('skips when the local file exists and --force was not passed', () => {
    expect(shouldSkipAsAlreadyProcessed(false, true)).toBe(true);
  });

  it('does NOT skip when the local file does not exist', () => {
    expect(shouldSkipAsAlreadyProcessed(false, false)).toBe(false);
  });

  it('does NOT skip when --force was passed, even if the file exists', () => {
    expect(shouldSkipAsAlreadyProcessed(true, true)).toBe(false);
  });

  it('does NOT skip when neither the file exists nor --force was passed', () => {
    expect(shouldSkipAsAlreadyProcessed(false, false)).toBe(false);
  });
});
