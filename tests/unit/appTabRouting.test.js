import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Checkpoint 4 (2026-08-22) focused audit smoke test for UNIFIED_REPAIR_PLAN
 * item 3 / Checkpoint 4 item 13's "every accepted tab id" requirement.
 *
 * Rather than rendering the full App component tree (this repo has no
 * jsdom/@testing-library/react setup), this is a source-level structural
 * check against the real src/App.jsx file: every id in VALID_TABS must
 * have a matching `activeTab === '<id>' &&` render branch, and vice versa.
 * This directly guards the Checkpoint 1 stale-tab-id bug class -- a tab id
 * accepted by the URL/nav layer with no renderable content is exactly what
 * left bankroll/odds/analytics/mycard/standings/devlab/picks/props/dfs/
 * podcasts/training-camp blank before that fix.
 *
 * Run: npx vitest run tests/unit/appTabRouting.test.js
 */
const appSourcePath = path.resolve(__dirname, '../../src/App.jsx');
const appSource = fs.readFileSync(appSourcePath, 'utf8');

function extractValidTabs(source) {
  const match = source.match(/const VALID_TABS = new Set\(\[([\s\S]*?)\]\)/);
  if (!match) {
    throw new Error(
      'Could not find "const VALID_TABS = new Set([...])" in src/App.jsx -- ' +
      'has the tab-routing structure been renamed/restructured? Update this test to match.'
    );
  }
  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

function extractRenderedTabIds(source) {
  return Array.from(source.matchAll(/activeTab === '([^']+)'\s*&&/g)).map((m) => m[1]);
}

describe('App.jsx tab routing (Checkpoint 1 stale-tab-id regression guard)', () => {
  const validTabs = extractValidTabs(appSource);
  const renderedIds = extractRenderedTabIds(appSource);

  it('finds the expected accepted tab ids in src/App.jsx (sanity check that parsing worked)', () => {
    expect(validTabs).toEqual(
      expect.arrayContaining([
        'dashboard', 'official-picks', 'intel', 'fantasy', 'injuries', 'futures',
        'bankroll', 'odds', 'analytics', 'mycard', 'standings', 'devlab',
        'picks', 'props', 'dfs', 'podcasts', 'training-camp',
      ])
    );
  });

  it.each(validTabs)('accepted tab id %j has a render branch in App.jsx', (tabId) => {
    expect(renderedIds).toContain(tabId);
  });

  it('every render branch corresponds to an accepted tab id (no unreachable/orphaned branch)', () => {
    for (const id of renderedIds) {
      expect(validTabs).toContain(id);
    }
  });

  it('has no duplicate accepted tab ids', () => {
    expect(new Set(validTabs).size).toBe(validTabs.length);
  });
});
