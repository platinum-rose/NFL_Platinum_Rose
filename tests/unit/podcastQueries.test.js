/**
 * Unit tests for the Phase 6 podcast intel queries in src/lib/supabase.js.
 *
 * Run: npx vitest run tests/unit/podcastQueries.test.js
 *
 * Strategy: mock `@supabase/supabase-js` so `createClient()` returns a
 * chainable builder that resolves to a configurable `{ data, error }` payload.
 * Each test sets the next payload via `__setNext(...)`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Holds the response the next builder call should resolve with.
let nextPayload = { data: [], error: null };

// Chainable builder stub: every method returns `this` except for the final
// `then`-able resolution, which is provided via `.limit()` returning a Promise.
function makeBuilder() {
  const builder = {
    _calls: [],
    select: vi.fn(function (...a) { this._calls.push(['select', a]); return this; }),
    eq: vi.fn(function (...a) { this._calls.push(['eq', a]); return this; }),
    gte: vi.fn(function (...a) { this._calls.push(['gte', a]); return this; }),
    order: vi.fn(function (...a) { this._calls.push(['order', a]); return this; }),
    not: vi.fn(function (...a) { this._calls.push(['not', a]); return this; }),
    limit: vi.fn(function (...a) {
      this._calls.push(['limit', a]);
      return Promise.resolve(nextPayload);
    }),
    from: vi.fn(function () { return this; }),
  };
  return builder;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => makeBuilder()),
}));

// Force isAvailable() true by faking env at module load.
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const {
  searchPodcastPicks,
  getExpertHistory,
  getTeamPodcastIntel,
  getWeeklyConsensus,
  getFuturesMovement,
  getPlayerPropContext,
} = await import('../../src/lib/supabase.js');

// Helper: build a fake podcast_episodes row (with nested feed + transcript).
function ep({ id, title = 'Test Ep', expert = 'Warren Sharp', feed = 'Sharp Football', pubDate = '2026-09-04', picks = [] }) {
  return {
    id,
    title,
    pub_date: pubDate,
    podcast_feeds: { name: feed, expert },
    podcast_transcripts: { picks, processed_at: pubDate },
  };
}

function pick(overrides = {}) {
  return {
    category: 'spread',
    subject: 'KC',
    selection: 'KC',
    team1: 'KC',
    team2: 'BUF',
    line: -3.5,
    summary: 'Chiefs lay the points',
    confidence: 0.7,
    season: 2026,
    week: 5,
    quality_score: 0.8,
    needs_review: false,
    ...overrides,
  };
}

beforeEach(() => {
  nextPayload = { data: [], error: null };
});

describe('podcast intel queries — Phase 6', () => {
  describe('searchPodcastPicks', () => {
    it('filters by team (case-insensitive) and excludes needs_review picks', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ subject: 'KC', team1: 'KC', team2: 'BUF', selection: 'KC' }),
              pick({ subject: 'BUF', team1: 'BUF', team2: 'KC', selection: 'BUF', needs_review: true }),
              pick({ subject: 'SF', team1: 'SF', team2: 'SEA', selection: 'SF' }),
            ],
          }),
        ],
        error: null,
      };
      const out = await searchPodcastPicks({ team: 'kc' });
      expect(out).toHaveLength(1);
      expect(out[0].pick.subject).toBe('KC');
    });

    it('filters by category and week', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ category: 'spread', week: 5 }),
              pick({ category: 'total', week: 5 }),
              pick({ category: 'total', week: 6 }),
            ],
          }),
        ],
        error: null,
      };
      const out = await searchPodcastPicks({ category: 'total', week: 5 });
      expect(out).toHaveLength(1);
      expect(out[0].pick.category).toBe('total');
      expect(out[0].pick.week).toBe(5);
    });

    it('returns empty array when supabase errors', async () => {
      nextPayload = { data: null, error: { message: 'boom' } };
      const out = await searchPodcastPicks({ team: 'KC' });
      expect(out).toEqual([]);
    });

    it('honors limit', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: Array.from({ length: 10 }, () => pick()),
          }),
        ],
        error: null,
      };
      const out = await searchPodcastPicks({ team: 'KC', limit: 3 });
      expect(out).toHaveLength(3);
    });
  });

  describe('getExpertHistory', () => {
    it('returns category breakdown for matching expert', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            expert: 'Warren Sharp',
            picks: [pick({ category: 'spread' }), pick({ category: 'total' })],
          }),
          ep({
            id: 'e2',
            expert: 'Other Guy',
            picks: [pick({ category: 'spread' })],
          }),
        ],
        error: null,
      };
      const out = await getExpertHistory({ expert: 'Warren Sharp' });
      expect(out.expert).toBe('Warren Sharp');
      expect(out.total).toBe(2);
      expect(out.by_category).toEqual({ spread: 1, total: 1 });
    });

    it('returns empty result when expert is missing', async () => {
      const out = await getExpertHistory({});
      expect(out.total).toBe(0);
      expect(out.picks).toEqual([]);
    });
  });

  describe('getTeamPodcastIntel', () => {
    it('partitions picks for vs against the team', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ subject: 'KC', team1: 'KC', team2: 'BUF', selection: 'KC' }),       // for KC
              pick({ subject: 'BUF', team1: 'BUF', team2: 'KC', selection: 'BUF' }),     // against KC
              pick({ subject: 'SF', team1: 'SF', team2: 'SEA', selection: 'SF' }),      // unrelated
            ],
          }),
        ],
        error: null,
      };
      const out = await getTeamPodcastIntel({ team: 'KC' });
      expect(out.team).toBe('KC');
      expect(out.for).toHaveLength(1);
      expect(out.against).toHaveLength(1);
      expect(out.by_expert['Warren Sharp']).toBe(2);
    });
  });

  describe('getWeeklyConsensus', () => {
    it('groups by matchup and counts selections', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ team1: 'KC', team2: 'BUF', selection: 'KC', week: 5 }),
              pick({ team1: 'KC', team2: 'BUF', selection: 'KC', week: 5 }),
              pick({ team1: 'BUF', team2: 'KC', selection: 'BUF', week: 5 }),
              pick({ team1: 'SF', team2: 'SEA', selection: 'SF', week: 5 }),
              pick({ team1: 'KC', team2: 'BUF', selection: 'KC', week: 6 }), // wrong week
            ],
          }),
        ],
        error: null,
      };
      const out = await getWeeklyConsensus({ week: 5 });
      expect(out.week).toBe(5);
      expect(out.games).toHaveLength(2);
      const kcGame = out.games.find(g => g.matchup === 'BUF@KC');
      expect(kcGame).toBeDefined();
      expect(kcGame.by_selection.KC).toBe(2);
      expect(kcGame.by_selection.BUF).toBe(1);
    });

    it('skips picks without team1/team2 or non-game categories', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ category: 'future', team1: null, team2: null, week: 5 }),
              pick({ category: 'prop', team1: null, team2: null, week: 5 }),
            ],
          }),
        ],
        error: null,
      };
      const out = await getWeeklyConsensus({ week: 5 });
      expect(out.games).toHaveLength(0);
    });
  });

  describe('getFuturesMovement', () => {
    it('filters to futures matching subject_market and orders by pub_date asc', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e2',
            pubDate: '2026-09-15',
            picks: [pick({ category: 'future', subject: 'NFC North', subject_market: 'NFC_North', selection: 'DET' })],
          }),
          ep({
            id: 'e1',
            pubDate: '2026-09-01',
            picks: [pick({ category: 'future', subject: 'NFC North', subject_market: 'NFC_North', selection: 'GB' })],
          }),
          ep({
            id: 'e3',
            picks: [pick({ category: 'future', subject_market: 'AFC_North' })],
          }),
        ],
        error: null,
      };
      const out = await getFuturesMovement({ market: 'NFC_North' });
      expect(out.picks).toHaveLength(2);
      expect(out.picks[0].episode_id).toBe('e1'); // earlier first
      expect(out.picks[1].episode_id).toBe('e2');
    });
  });

  describe('getPlayerPropContext', () => {
    it('matches player + propType and counts OVER/UNDER trend', async () => {
      nextPayload = {
        data: [
          ep({
            id: 'e1',
            picks: [
              pick({ category: 'prop', subject: 'Patrick Mahomes', subject_market: 'pass_yds', selection: 'OVER' }),
              pick({ category: 'prop', subject: 'patrick mahomes', subject_market: 'pass_yds', selection: 'UNDER' }),
              pick({ category: 'prop', subject: 'Josh Allen', subject_market: 'pass_yds', selection: 'OVER' }),
              pick({ category: 'prop', subject: 'Patrick Mahomes', subject_market: 'rush_yds', selection: 'OVER' }),
            ],
          }),
        ],
        error: null,
      };
      const out = await getPlayerPropContext({ player: 'Patrick Mahomes', propType: 'pass_yds' });
      expect(out.picks).toHaveLength(2);
      expect(out.trend.OVER).toBe(1);
      expect(out.trend.UNDER).toBe(1);
    });

    it('returns empty when player or propType missing', async () => {
      const out = await getPlayerPropContext({ player: 'Patrick Mahomes' });
      expect(out.picks).toEqual([]);
    });
  });
});

describe('round 3 — direction-aware stances and exact prop stats', () => {
  it('getTeamPodcastIntel: make-playoffs NO / miss-playoffs YES / win-total UNDER count AGAINST the team', async () => {
    nextPayload = {
      data: [ep({
        id: 'e1',
        picks: [
          pick({ category: 'future', subject: 'DAL', subject_market: 'make_playoffs', selection: 'NO', team1: 'DAL', team2: null }),
          pick({ category: 'future', subject: 'DAL', subject_market: 'Miss_Playoffs', selection: 'YES', team1: 'DAL', team2: null }),
          pick({ category: 'future', subject: 'DAL', subject_market: 'NFC_East_Win_Total', selection: 'UNDER', team1: 'DAL', team2: null }),
          pick({ category: 'future', subject: 'DAL', subject_market: 'make_playoffs', selection: 'YES', team1: 'DAL', team2: null }),
          pick({ category: 'spread', subject: 'DAL', team1: 'DAL', team2: 'PHI', selection: 'DAL' }),
        ],
      })],
      error: null,
    };
    const out = await getTeamPodcastIntel({ team: 'DAL' });
    expect(out.against).toHaveLength(3);
    expect(out.for).toHaveLength(2);
  });

  it('getTeamPodcastIntel: a Saints spread pick (selection "NO") is FOR the Saints', async () => {
    nextPayload = { data: [ep({ id: 'e1', picks: [pick({ subject: 'NO', team1: 'ATL', team2: 'NO', selection: 'NO' })] })], error: null };
    const out = await getTeamPodcastIntel({ team: 'NO' });
    expect(out.for).toHaveLength(1);
    expect(out.against).toHaveLength(0);
  });

  it('getPlayerPropContext: exact stat match — rush_rec_yds does not count as rec_yds', async () => {
    nextPayload = {
      data: [ep({
        id: 'e1',
        picks: [
          pick({ category: 'prop', subject: 'Christian McCaffrey', subject_market: 'receiving_yards', selection: 'OVER' }),
          pick({ category: 'prop', subject: 'Christian McCaffrey', subject_market: 'rush_rec_yds', selection: 'OVER' }),
          pick({ category: 'prop', subject: 'Christian McCaffrey', subject_market: 'player_reception_yds', selection: 'UNDER' }),
        ],
      })],
      error: null,
    };
    const out = await getPlayerPropContext({ player: 'Christian McCaffrey', propType: 'rec_yds' });
    expect(out.picks).toHaveLength(2);
    expect(out.trend).toMatchObject({ OVER: 1, UNDER: 1 });
  });
});
