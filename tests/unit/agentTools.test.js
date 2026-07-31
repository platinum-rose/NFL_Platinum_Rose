/**
 * Unit tests for src/lib/agentTools.js
 *
 * Run: npx vitest run
 * Coverage: npx vitest run --coverage
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock all I/O dependencies so the module loads cleanly in Node.
vi.mock('../../src/lib/supabase.js', () => ({
  getLatestOddsSnapshot: vi.fn(async () => null),
  getLineMovementsDB: vi.fn(async () => []),
  searchResearchIntel: vi.fn(async () => ({ notes: [], signals: [] })),
  searchSharpTweets: vi.fn(async () => []),
  getGameSplitsForWeek: vi.fn(async () => []),
  searchPodcastPicks: vi.fn(async () => []),
  getExpertHistory: vi.fn(async () => ({ expert: null, total: 0, picks: [], by_category: {} })),
  getTeamPodcastIntel: vi.fn(async () => ({ team: null, for: [], against: [], by_expert: {} })),
  getWeeklyConsensus: vi.fn(async () => ({ week: null, season: null, games: [] })),
  getFuturesMovement: vi.fn(async () => ({ market: null, picks: [], by_expert: {} })),
  getPlayerPropContext: vi.fn(async () => ({ player: null, prop_type: null, picks: [], trend: {} })),
  getLatestFuturesOdds: vi.fn(async () => []),
  getFuturesOddsHistory: vi.fn(async () => []),
  PLACEABLE_BOOKS: new Set(['bookmaker', 'betonline', 'betus', 'betmgm', 'caesars', 'williamhill_us', 'williamhill', 'circa', 'mgm']),
  getTeamSeasonStats: vi.fn(async () => []),
  getTeamRoster: vi.fn(async () => []),
  getNormalizedSignals: vi.fn(async () => []),
  getPodcastHostSummaries: vi.fn(async () => []),
  getStrengthOfSchedule: vi.fn(async () => []),
  getGameContext: vi.fn(async () => []),
  getRefereeTendencies: vi.fn(async () => []),
  getRosterHistory: vi.fn(async () => []),
  getGameOddsForWeek: vi.fn(async () => []),
  getGameSplitsHistory: vi.fn(async () => []),
  getPodcastGeminiIntel: vi.fn(async () => []),
  supabase: null,
}));

import { getPodcastGeminiIntel } from '../../src/lib/supabase.js';

vi.mock('../../src/lib/vaultClient.js', () => ({
  readVaultNote: vi.fn(async () => null),
  writeVaultNote: vi.fn(async () => true),
  todaySessionPath: vi.fn(() => 'NFL/Sessions/2026-01-01.md'),
  loadReferenceNotes: vi.fn(async () => ''),
  listVaultNotes: vi.fn(async () => []),
  searchVaultNotes: vi.fn(async () => []),
}));

vi.mock('../../src/lib/picksDatabase.js', () => ({
  addPick: vi.fn(() => ({ success: true, pick: { id: 'test-pick-1' } })),
  calculateStandings: vi.fn(() => ({
    AI_LAB: { wins: 10, losses: 6, pushes: 1, pending: 2, units: 3.4, winRate: 62.5, roi: 21.3, record: '10-6-1' },
  })),
  statsByConfidence: vi.fn(() => ({
    low:    { label: '50–55%', total: 5, wins: 2, losses: 3, winRate: 40.0 },
    medium: { label: '55–60%', total: 8, wins: 5, losses: 3, winRate: 62.5 },
    high:   { label: '60%+',  total: 4, wins: 3, losses: 1, winRate: 75.0 },
  })),
  statsByEdge: vi.fn(() => ({
    small:  { label: '<1.5pt',  total: 6, wins: 3, losses: 3, winRate: 50.0 },
    medium: { label: '1.5–3pt', total: 9, wins: 6, losses: 3, winRate: 66.7 },
    large:  { label: '3pt+',   total: 2, wins: 2, losses: 0, winRate: 100.0 },
  })),
  statsByPickType: vi.fn(() => ({
    spread:      { total: 10, wins: 7, losses: 3, pushes: 0, winRate: 70.0, units: 3.7, byTeamCount: {} },
    total:       { total: 5,  wins: 2, losses: 3, pushes: 0, winRate: 40.0, units: -1.3, byTeamCount: {} },
    moneyline:   { total: 2,  wins: 1, losses: 1, pushes: 0, winRate: 50.0, units: -0.1, byTeamCount: {} },
    parlay:      { total: 3,  wins: 1, losses: 2, pushes: 0, winRate: 33.3, units: -0.2,
                   byTeamCount: { '3-team': { wins: 1, losses: 2, pushes: 0, total: 3, winRate: 33.3 } } },
    round_robin: { total: 1,  wins: 0, losses: 1, pushes: 0, winRate: 0,   units: -35,
                   byConfig: { '8-pick/4-team': { wins: 0, losses: 1, total: 1, netUnits: -35 } } },
  })),
  addParlay: vi.fn(() => ({ success: true, pick: { id: 'parlay-test-1', teamCount: 3 } })),
  addRoundRobin: vi.fn(() => ({ success: true, pick: { id: 'rr-test-1', totalCombinations: 70, totalStake: 35 } })),
  loadPicks: vi.fn(() => [
    { source: 'AI_LAB', result: 'WIN',     selection: 'KC',  pickType: 'spread', confidence: 62, edge: 2.5 },
    { source: 'AI_LAB', result: 'LOSS',    selection: 'BUF', pickType: 'total',  confidence: 55, edge: 1.0 },
    { source: 'AI_LAB', result: 'PENDING', selection: 'SF',  pickType: 'spread', confidence: 58, edge: 2.0 },
  ]),
}));

vi.mock('../../src/lib/storage.js', () => ({
  loadFromStorage: vi.fn(() => null),
  saveToStorage: vi.fn(),
  PR_STORAGE_KEYS: {},
}));

vi.mock('../../src/lib/apiConfig.js', () => ({
  LOCAL_DATA: { SCHEDULE: '', WEEKLY_STATS: '', YOUTUBE_FUTURES_INTEL: './youtube-futures-agent-intel-summary.json' },
  ESPN_API: { INJURIES_URL: '' },
}));

import {
  BETTING_TOOLS,
  FUTURES_TOOLS,
  PODCAST_INTEL_TOOLS,
  OPENAI_BETTING_TOOLS,
  executeTool,
} from '../../src/lib/agentTools.js';

describe('agentTools', () => {
  describe('BETTING_TOOLS', () => {
    it('exports exactly 21 tools (13 base + 8 podcast intel)', () => {
      expect(BETTING_TOOLS).toHaveLength(21);
    });

    it('each tool has name, description, and input_schema', () => {
      for (const tool of BETTING_TOOLS) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('input_schema');
        expect(typeof tool.name).toBe('string');
      }
    });

    it('tool names match the expected set', () => {
      const names = BETTING_TOOLS.map(t => t.name).sort();
      expect(names).toEqual([
        'analyze_matchup',
        'calculate_hedge',
        'calculate_teaser',
        'get_betting_splits',
        'get_expert_history',
        'get_futures_movement',
        'get_injury_report',
        'get_line_movement',
        'get_odds',
        'get_performance_stats',
        'get_player_prop_context',
        'get_team_podcast_intel',
        'get_weekly_consensus',
        'get_youtube_futures_intel',
        'log_pick',
        'read_vault_note',
        'search_episode_vault_notes',
        'search_intel',
        'search_podcast_picks',
        'search_sharp_tweets',
        'write_vault_note',
      ]);
    });

    it('PODCAST_INTEL_TOOLS contains the 8 phase-6/S301 tools', () => {
      const names = PODCAST_INTEL_TOOLS.map(t => t.name).sort();
      expect(names).toEqual([
        'get_expert_history',
        'get_futures_movement',
        'get_player_prop_context',
        'get_team_podcast_intel',
        'get_weekly_consensus',
        'get_youtube_futures_intel',
        'search_episode_vault_notes',
        'search_podcast_picks',
      ]);
    });

    it('calculate_hedge has required fields declared', () => {
      const hedge = BETTING_TOOLS.find(t => t.name === 'calculate_hedge');
      expect(hedge.input_schema.required).toEqual(
        expect.arrayContaining([
          'original_bet_amount',
          'original_odds',
          'hedge_odds',
        ]),
      );
    });
  });

  describe('OPENAI_BETTING_TOOLS', () => {
    it('has same count as BETTING_TOOLS', () => {
      expect(OPENAI_BETTING_TOOLS).toHaveLength(BETTING_TOOLS.length);
    });

    it('each entry is wrapped in OpenAI function-call format', () => {
      for (const tool of OPENAI_BETTING_TOOLS) {
        expect(tool.type).toBe('function');
        expect(tool.function).toHaveProperty('name');
        expect(tool.function).toHaveProperty('description');
        expect(tool.function).toHaveProperty('parameters');
      }
    });

    it('tool names are preserved in the OpenAI wrapper', () => {
      const bettingNames = BETTING_TOOLS.map(t => t.name).sort();
      const openaiNames = OPENAI_BETTING_TOOLS.map(t => t.function.name).sort();
      expect(openaiNames).toEqual(bettingNames);
    });
  });

  describe('executeTool', () => {
    it('returns error object for unknown tool name', async () => {
      const result = await executeTool('not_a_real_tool', {});
      expect(result).toEqual({ error: 'Unknown tool: not_a_real_tool' });
    });

    it('calculate_hedge returns a structured result', async () => {
      const result = await executeTool('calculate_hedge', {
        original_bet_amount: 100,
        original_odds: 150,
        hedge_odds: -150,
      });
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('break_even_hedge');
      expect(result.original.stake).toBe(100);
    });

    it('calculate_hedge break-even stake is mathematically correct', async () => {
      // +150 original: payout = 100×2.5 = 250
      // -150 hedge: decimal = 100/150+1 ≈ 1.667
      // breakEvenStake = 250/1.667 ≈ 150
      const result = await executeTool('calculate_hedge', {
        original_bet_amount: 100,
        original_odds: 150,
        hedge_odds: -150,
      });
      expect(result.break_even_hedge.hedge_stake).toBeCloseTo(150, 0);
    });

    it('calculate_hedge with target_profit returns target_hedge block', async () => {
      const result = await executeTool('calculate_hedge', {
        original_bet_amount: 100,
        original_odds: 200,
        hedge_odds: -200,
        target_profit: 25,
      });
      expect(result.target_hedge).not.toBeNull();
      expect(result.target_hedge.guaranteed_profit).toBe(25);
    });

    it('calculate_teaser requires at least 2 legs', async () => {
      const result = await executeTool('calculate_teaser', { legs: [] });
      expect(result).toHaveProperty('error');
    });

    it('get_performance_stats returns standings, confidence, edge, and team breakdowns', async () => {
      const result = await executeTool('get_performance_stats', {});
      expect(result).toHaveProperty('standings');
      expect(result).toHaveProperty('by_confidence');
      expect(result).toHaveProperty('by_edge');
      expect(result).toHaveProperty('by_team');
      expect(result).toHaveProperty('total_graded');
      expect(result).toHaveProperty('last_10');
    });

    it('get_performance_stats total_graded excludes PENDING picks', async () => {
      const result = await executeTool('get_performance_stats', {});
      // Mock returns 3 picks: WIN, LOSS, PENDING → 2 graded
      expect(result.total_graded).toBe(2);
      expect(result.total_pending).toBe(1);
    });

    it('get_performance_stats by_team includes top teams sorted by pick count', async () => {
      const result = await executeTool('get_performance_stats', {});
      expect(Array.isArray(result.by_team)).toBe(true);
      if (result.by_team.length > 0) {
        expect(result.by_team[0]).toHaveProperty('team');
        expect(result.by_team[0]).toHaveProperty('wins');
        expect(result.by_team[0]).toHaveProperty('losses');
        expect(result.by_team[0]).toHaveProperty('winRate');
      }
    });

    it('search_intel returns no_results when mock returns empty', async () => {
      const result = await executeTool('search_intel', { query: 'Chiefs' });
      expect(result).toHaveProperty('status', 'no_results');
      expect(result.query).toBe('Chiefs');
      expect(result).toHaveProperty('message');
    });

    it('search_intel returns error when query is missing', async () => {
      const result = await executeTool('search_intel', {});
      expect(result).toHaveProperty('error');
    });

    it('search_intel passes source filter through', async () => {
      const { searchResearchIntel } = await import('../../src/lib/supabase.js');
      await executeTool('search_intel', { query: 'Bills', source: 'VSiN', hours: 48 });
      expect(searchResearchIntel).toHaveBeenCalledWith(
        'Bills',
        expect.objectContaining({ source: 'VSiN', hours: 48 }),
      );
    });

    it('search_intel with results returns articles array', async () => {
      const { searchResearchIntel } = await import('../../src/lib/supabase.js');
      searchResearchIntel.mockResolvedValueOnce({
        notes: [{
          id: 1,
          source: 'Action Network',
          title: 'Chiefs look strong',
          summary: 'Kansas City offense rolling',
          url: 'https://example.com/1',
          published_at: '2026-05-17T10:00:00Z',
          confidence: 0.74,
        }],
        signals: [{
          note_id: 1,
          lean: 'KC -3.5',
          bet_type: 'spread',
          confidence: 0.66,
        }],
      });
      const result = await executeTool('search_intel', { query: 'Chiefs' });
      expect(result.result_count).toBe(1);
      expect(result.articles[0].source).toBe('Action Network');
      expect(result.articles[0].pick_signals).toHaveLength(1);
      expect(result.articles[0].pick_signals[0].lean).toBe('KC -3.5');
    });

    // ── Sharp tweets tool tests ─────────────────────────────────────────────

    it('search_sharp_tweets returns no_results when mock returns empty', async () => {
      const result = await executeTool('search_sharp_tweets', { query: 'Chiefs' });
      expect(result).toHaveProperty('status', 'no_results');
      expect(result.query).toBe('Chiefs');
      expect(result).toHaveProperty('message');
    });

    it('search_sharp_tweets returns error when query is missing', async () => {
      const result = await executeTool('search_sharp_tweets', {});
      expect(result).toHaveProperty('error');
    });

    it('search_sharp_tweets with results returns tweets array', async () => {
      const { searchSharpTweets } = await import('../../src/lib/supabase.js');
      searchSharpTweets.mockResolvedValueOnce([{
        author_handle: 'SharpFootball',
        author_tier: 'sharp',
        text: 'Chiefs offense is elite this week',
        tweet_url: 'https://x.com/SharpFootball/status/123456789',
        published_at: '2026-09-07T10:00:00Z',
      }]);
      const result = await executeTool('search_sharp_tweets', { query: 'Chiefs' });
      expect(result.result_count).toBe(1);
      expect(result.tweets[0].account).toBe('@SharpFootball');
      expect(result.tweets[0].tier).toBe('sharp');
      expect(result.tweets[0].text).toBe('Chiefs offense is elite this week');
    });

    it('search_sharp_tweets passes handle and hours filters through', async () => {
      const { searchSharpTweets } = await import('../../src/lib/supabase.js');
      await executeTool('search_sharp_tweets', {
        query: 'Bills',
        handle: 'VSiN',
        hours: 24,
      });
      expect(searchSharpTweets).toHaveBeenCalledWith(
        'Bills',
        expect.objectContaining({ handle: 'VSiN', hours: 24 }),
      );
    });

    // ── Vault tool tests ────────────────────────────────────────────────────

    it('read_vault_note returns not_found when mock returns null', async () => {
      const result = await executeTool('read_vault_note', { path: 'NFL/Reference/DVOA.md' });
      expect(result).toHaveProperty('status', 'not_found');
      expect(result.path).toBe('NFL/Reference/DVOA.md');
      expect(result).toHaveProperty('message');
    });

    it('read_vault_note returns error when path is missing', async () => {
      const result = await executeTool('read_vault_note', {});
      expect(result).toHaveProperty('error');
    });

    it('read_vault_note returns content when mock returns a string', async () => {
      const { readVaultNote } = await import('../../src/lib/vaultClient.js');
      readVaultNote.mockResolvedValueOnce('# DVOA Reference\n\nSome content here.');
      const result = await executeTool('read_vault_note', { path: 'NFL/Reference/DVOA.md' });
      expect(result.status).toBe('ok');
      expect(result.content).toContain('DVOA Reference');
      expect(result.char_count).toBeGreaterThan(0);
    });

    it('write_vault_note returns error when path is missing', async () => {
      const result = await executeTool('write_vault_note', { content: 'Hello' });
      expect(result).toHaveProperty('error');
    });

    it('write_vault_note returns error when content is missing', async () => {
      const result = await executeTool('write_vault_note', { path: 'NFL/Sessions/2026-01-01.md' });
      expect(result).toHaveProperty('error');
    });

    it('write_vault_note rejects paths outside NFL/ prefix', async () => {
      const result = await executeTool('write_vault_note', {
        path: 'Personal/secrets.md',
        content: 'should not write',
      });
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('NFL/');
    });

    it('write_vault_note returns written on success', async () => {
      const { writeVaultNote } = await import('../../src/lib/vaultClient.js');
      writeVaultNote.mockResolvedValueOnce(true);
      const result = await executeTool('write_vault_note', {
        path: 'NFL/Sessions/2026-09-07.md',
        content: '# Session 2026-09-07\n\n## Picks\n- KC -3.5',
        tags: ['session', 'week-1'],
      });
      expect(result.status).toBe('written');
      expect(result.path).toBe('NFL/Sessions/2026-09-07.md');
      expect(result.tags).toEqual(['session', 'week-1']);
    });

    it('write_vault_note returns error status when backend fails', async () => {
      const { writeVaultNote } = await import('../../src/lib/vaultClient.js');
      writeVaultNote.mockResolvedValueOnce(false);
      const result = await executeTool('write_vault_note', {
        path: 'NFL/Sessions/2026-09-07.md',
        content: '# Session',
      });
      expect(result.status).toBe('error');
    });

    // ── Phase 6 podcast intel tool tests ────────────────────────────────────

    it('search_podcast_picks returns no_data when mock is empty', async () => {
      const result = await executeTool('search_podcast_picks', { team: 'KC' });
      expect(result.status).toBe('no_data');
      expect(result.picks).toEqual([]);
    });

    it('search_podcast_picks formats picks with episode + expert context', async () => {
      const { searchPodcastPicks } = await import('../../src/lib/supabase.js');
      searchPodcastPicks.mockResolvedValueOnce([{
        episode_id: 'e1',
        episode_title: 'Sharp Podcast Wk 5',
        pub_date: '2026-09-04',
        expert: 'Warren Sharp',
        feed_name: 'Sharp Football Analysis',
        processed_at: '2026-09-04',
        pick: {
          category: 'spread', subject: 'KC', selection: 'KC',
          team1: 'KC', team2: 'BUF', line: -3.5, units: 1, confidence: 0.7,
          season: 2026, week: 5, summary: 'Lay it', quality_score: 0.8, needs_review: false,
        },
      }]);
      const result = await executeTool('search_podcast_picks', { team: 'KC' });
      expect(result.status).toBe('ok');
      expect(result.count).toBe(1);
      expect(result.picks[0].expert).toBe('Warren Sharp');
      expect(result.picks[0].selection).toBe('KC');
    });

    it('get_expert_history requires expert', async () => {
      const result = await executeTool('get_expert_history', {});
      expect(result.status).toBe('invalid');
    });

    it('get_expert_history returns category breakdown', async () => {
      const { getExpertHistory } = await import('../../src/lib/supabase.js');
      getExpertHistory.mockResolvedValueOnce({
        expert: 'Warren Sharp',
        total: 3,
        by_category: { spread: 2, total: 1 },
        picks: [],
      });
      const result = await executeTool('get_expert_history', { expert: 'Warren Sharp' });
      expect(result.status).toBe('ok');
      expect(result.total_picks).toBe(3);
      expect(result.by_category).toEqual({ spread: 2, total: 1 });
    });

    it('get_team_podcast_intel requires team', async () => {
      const result = await executeTool('get_team_podcast_intel', {});
      expect(result.status).toBe('invalid');
    });

    it('get_weekly_consensus requires week', async () => {
      const result = await executeTool('get_weekly_consensus', {});
      expect(result.status).toBe('invalid');
    });

    it('get_weekly_consensus returns game count from mock', async () => {
      const { getWeeklyConsensus } = await import('../../src/lib/supabase.js');
      getWeeklyConsensus.mockResolvedValueOnce({
        week: 5,
        season: 2026,
        games: [
          { matchup: 'BUF@KC', team1: 'KC', team2: 'BUF', picks: [], by_selection: { KC: 2, BUF: 1 } },
        ],
      });
      const result = await executeTool('get_weekly_consensus', { week: 5 });
      expect(result.status).toBe('ok');
      expect(result.game_count).toBe(1);
      expect(result.games[0].by_selection.KC).toBe(2);
    });

    it('get_futures_movement requires market', async () => {
      const result = await executeTool('get_futures_movement', {});
      expect(result.status).toBe('invalid');
    });

    it('get_player_prop_context requires player and prop_type', async () => {
      const result = await executeTool('get_player_prop_context', { player: 'Mahomes' });
      expect(result.status).toBe('invalid');
    });

    it('get_player_prop_context surfaces OVER/UNDER trend', async () => {
      const { getPlayerPropContext } = await import('../../src/lib/supabase.js');
      getPlayerPropContext.mockResolvedValueOnce({
        player: 'Patrick Mahomes',
        prop_type: 'pass_yds',
        picks: [{ episode_id: 'e1', expert: 'X', pick: { selection: 'OVER' } }],
        trend: { OVER: 1, UNDER: 0, OTHER: 0 },
      });
      const result = await executeTool('get_player_prop_context', {
        player: 'Patrick Mahomes',
        prop_type: 'pass_yds',
      });
      expect(result.status).toBe('ok');
      expect(result.trend.OVER).toBe(1);
    });

    // ── S300/S301 local YouTube/Gemini agent intel tool tests ───────────────

    const YOUTUBE_INTEL_FIXTURE = {
      generated_at: '2026-07-25T02:16:55.061Z',
      status: 'local_agent_intel_summary_only',
      guardrail: 'Reviewed local podcast intel for agent context only. This is not an official pick ledger, production recommendation, Supabase write, or parlay mutation.',
      items: [
        {
          item_id: 'youtube-1__ATL__make_playoffs__NO____-213__1350',
          lane: 'futures_pick',
          team: 'ATL',
          market: 'make_playoffs',
          side: 'NO',
          line: null,
          price: -213,
          speaker: 'Seth Woolcock',
          rationale: 'Messy QB situation.',
          supporting_quote: '',
          review_flags: ['price_not_in_quote'],
          reviewer_notes: '',
          source: { episode_id: 'youtube-1', episode_title: 'Ep 1', show: 'BettingPros YouTube', timestamp_url: 'https://youtube.com/watch?v=1&t=1350s', source_timestamp: 1350 },
        },
        {
          item_id: 'youtube-2__KC__mvp__Mahomes___-500__200',
          lane: 'futures_pick',
          team: 'KC',
          market: 'mvp',
          side: 'Mahomes',
          line: null,
          price: -500,
          speaker: 'Simon Hunter',
          rationale: 'Still the best QB.',
          supporting_quote: 'Mahomes is the pick again.',
          review_flags: [],
          reviewer_notes: '',
          source: { episode_id: 'youtube-2', episode_title: 'Ep 2', show: 'Sharp or Square', timestamp_url: 'https://youtube.com/watch?v=2&t=200s', source_timestamp: 200 },
        },
        {
          item_id: 'youtube-3__KC__injury__Mahomes__questionable',
          lane: 'injury_intel',
          team: 'KC',
          market: 'injury',
          side: 'Mahomes',
          line: null,
          price: null,
          speaker: 'Chad Millman',
          rationale: 'Knee recovery timeline unclear.',
          supporting_quote: '',
          review_flags: [],
          reviewer_notes: '',
          source: { episode_id: 'youtube-2', episode_title: 'Ep 2', show: 'Sharp or Square', timestamp_url: 'https://youtube.com/watch?v=2&t=210s', source_timestamp: 210 },
        },
      ],
    };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('get_youtube_futures_intel returns no_data when the local summary fetch fails', async () => {
      getPodcastGeminiIntel.mockResolvedValueOnce([]);
      const result = await executeTool('get_youtube_futures_intel', {});
      expect(result.status).toBe('no_data');
      expect(result.items).toEqual([]);
    });

    it('get_youtube_futures_intel returns all items with guardrail when unfiltered', async () => {
      getPodcastGeminiIntel.mockImplementationOnce(async ({ team, market, lane }) => {
        let items = YOUTUBE_INTEL_FIXTURE.items;
        if (team) items = items.filter(i => i.team === team);
        if (market) items = items.filter(i => i.market === market);
        if (lane) items = items.filter(i => i.lane === lane);
        return items;
      });
      const result = await executeTool('get_youtube_futures_intel', {});
      expect(result.status).toBe('ok');
      expect(result.total_matched).toBe(3);
      expect(result.guardrail).toMatch(/not an official pick ledger/i);
    });

    it('get_youtube_futures_intel filters by team and preserves review_flags', async () => {
      getPodcastGeminiIntel.mockImplementationOnce(async ({ team, market, lane }) => {
        let items = YOUTUBE_INTEL_FIXTURE.items;
        if (team) items = items.filter(i => i.team === team);
        if (market) items = items.filter(i => i.market === market);
        if (lane) items = items.filter(i => i.lane === lane);
        return items;
      });
      const result = await executeTool('get_youtube_futures_intel', { team: 'ATL' });
      expect(result.status).toBe('ok');
      expect(result.total_matched).toBe(1);
      expect(result.items[0].review_flags).toEqual(['price_not_in_quote']);
    });

    it('get_youtube_futures_intel filters by lane and market together', async () => {
      getPodcastGeminiIntel.mockImplementationOnce(async ({ team, market, lane }) => {
        let items = YOUTUBE_INTEL_FIXTURE.items;
        if (team) items = items.filter(i => i.team === team);
        if (market) items = items.filter(i => i.market === market);
        if (lane) items = items.filter(i => i.lane === lane);
        return items;
      });
      const result = await executeTool('get_youtube_futures_intel', { team: 'KC', lane: 'injury_intel' });
      expect(result.status).toBe('ok');
      expect(result.total_matched).toBe(1);
      expect(result.items[0].market).toBe('injury');
    });

    it('get_youtube_futures_intel returns no_data when filters match nothing', async () => {
      getPodcastGeminiIntel.mockImplementationOnce(async ({ team, market, lane }) => {
        let items = YOUTUBE_INTEL_FIXTURE.items;
        if (team) items = items.filter(i => i.team === team);
        if (market) items = items.filter(i => i.market === market);
        if (lane) items = items.filter(i => i.lane === lane);
        return items;
      });
      const result = await executeTool('get_youtube_futures_intel', { team: 'BUF' });
      expect(result.status).toBe('no_data');
    });

  });

  // ── FUT-TOOLS ──────────────────────────────────────────────────────────────

  describe('analyze_futures_hedge', () => {
    it('returns three scenarios for a position that has appreciated', async () => {
      const result = await executeTool('analyze_futures_hedge', {
        stake: 50,
        entry_odds: 500,
        current_odds: 200,
        hedge_odds: -140,
        hedge_description: 'field to win SB',
      });
      expect(result.status).toBe('ok');
      expect(result.scenarios.hold).toBeDefined();
      expect(result.scenarios.full_lock).toBeDefined();
      expect(result.scenarios.partial_lock).toBeUndefined();
      expect(result.summary.potential_profit_if_wins).toBe(250);
      expect(result.scenarios.full_lock.hedge_stake).toBeGreaterThan(0);
      expect(result.scenarios.full_lock.guaranteed_profit).toBeGreaterThan(0);
    });

    it('includes partial_lock when target_locked_profit is provided', async () => {
      const result = await executeTool('analyze_futures_hedge', {
        stake: 100,
        entry_odds: 300,
        current_odds: 150,
        hedge_odds: -120,
        target_locked_profit: 50,
      });
      expect(result.status).toBe('ok');
      expect(result.scenarios.partial_lock).toBeDefined();
      expect(result.scenarios.partial_lock.if_original_wins.profit).toBe(50);
    });

    it('partial_lock reports error when target exceeds win profit', async () => {
      const result = await executeTool('analyze_futures_hedge', {
        stake: 50,
        entry_odds: 200,
        current_odds: 150,
        hedge_odds: -110,
        target_locked_profit: 999,
      });
      expect(result.scenarios.partial_lock.note).toMatch(/exceed|Cannot lock/i);
    });

    it('shows line-appreciation on hold scenario when position gained value', async () => {
      const result = await executeTool('analyze_futures_hedge', {
        stake: 50,
        entry_odds: 1000,
        current_odds: 300,
        hedge_odds: -200,
      });
      expect(result.scenarios.hold.line_appreciation).toMatch(/gained value/i);
    });

    it('returns invalid when required params are missing', async () => {
      const result = await executeTool('analyze_futures_hedge', { stake: 50 });
      expect(result.status).toBe('invalid');
    });
  });

  describe('project_division_paths', () => {
    it('returns no_data when Supabase has no futures odds', async () => {
      const result = await executeTool('project_division_paths', { division: 'AFC West' });
      expect(result.status).toBe('no_data');
      expect(result.division).toBe('AFC WEST');
      expect(result.teams).toHaveLength(4);
    });

    it('lists exactly 4 teams for every division', async () => {
      const divisions = [
        'AFC East','AFC North','AFC South','AFC West',
        'NFC East','NFC North','NFC South','NFC West',
      ];
      for (const div of divisions) {
        const result = await executeTool('project_division_paths', { division: div });
        expect(result.teams).toHaveLength(4);
      }
    });

    it('accepts underscored division names', async () => {
      const result = await executeTool('project_division_paths', { division: 'nfc_west' });
      expect(result.division).toBe('NFC WEST');
      expect(result.teams).toHaveLength(4);
    });

    it('returns invalid for unknown division', async () => {
      const result = await executeTool('project_division_paths', { division: 'Big Ten West' });
      expect(result.status).toBe('invalid');
      expect(result.message).toMatch(/Unknown division/i);
    });

    it('returns ok and ranks teams correctly when Supabase has data', async () => {
      const { getLatestFuturesOdds } = await import('../../src/lib/supabase.js');
      getLatestFuturesOdds.mockResolvedValueOnce([
        { market_type: 'division_afc_west', team: 'Kansas City Chiefs',   odds: -120, book: 'DraftKings' },
        { market_type: 'division_afc_west', team: 'Denver Broncos',       odds: +250, book: 'DraftKings' },
        { market_type: 'division_afc_west', team: 'Las Vegas Raiders',    odds: +600, book: 'DraftKings' },
        { market_type: 'division_afc_west', team: 'Los Angeles Chargers', odds: +350, book: 'DraftKings' },
      ]);
      const result = await executeTool('project_division_paths', { division: 'AFC West' });
      expect(result.status).toBe('ok');
      expect(result.teams[0].team).toBe('Kansas City Chiefs');
    });
  });

  describe('track_award_race', () => {
    it('returns no_data when Supabase has no award odds', async () => {
      const result = await executeTool('track_award_race', { award: 'MVP' });
      expect(result.status).toBe('no_data');
      expect(result.award).toBe('MVP');
      expect(result.label).toBe('Most Valuable Player');
    });

    it('resolves all valid award aliases without error', async () => {
      for (const award of ['MVP','OPOY','DPOY','OROY','DROY','CPOY','COY']) {
        const result = await executeTool('track_award_race', { award });
        expect(result.status).not.toBe('invalid');
        expect(result.award).toBe(award);
      }
    });

    it('returns invalid for unknown award', async () => {
      const result = await executeTool('track_award_race', { award: 'GOAT' });
      expect(result.status).toBe('invalid');
    });

    it('returns ranked leaderboard sorted by implied prob', async () => {
      const { getLatestFuturesOdds } = await import('../../src/lib/supabase.js');
      getLatestFuturesOdds.mockResolvedValueOnce([
        { market_type: 'award_mvp', team: 'Josh Allen',      odds: +350, book: 'DraftKings' },
        { market_type: 'award_mvp', team: 'Lamar Jackson',   odds: +200, book: 'DraftKings' },
        { market_type: 'award_mvp', team: 'Patrick Mahomes', odds: +600, book: 'FanDuel'    },
      ]);
      const result = await executeTool('track_award_race', { award: 'MVP' });
      expect(result.status).toBe('ok');
      expect(result.leaderboard[0].candidate).toBe('Lamar Jackson');
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard).toHaveLength(3);
    });

    it('respects limit param', async () => {
      const { getLatestFuturesOdds } = await import('../../src/lib/supabase.js');
      getLatestFuturesOdds.mockResolvedValueOnce(
        ['A','B','C','D','E'].map((p, i) => ({
          market_type: 'award_mvp', team: `Player ${p}`,
          odds: 200 + i * 100, book: 'DK',
        }))
      );
      const result = await executeTool('track_award_race', { award: 'MVP', limit: 3 });
      expect(result.leaderboard).toHaveLength(3);
    });
  });

  describe('FUTURES_TOOLS export', () => {
    it('exports exactly 13 FUT-TOOLS schemas (3 original + 6 S296 track-1 + 4 S296 track-2)', () => {
      expect(FUTURES_TOOLS).toHaveLength(13);
      const names = FUTURES_TOOLS.map(t => t.name);
      expect(names).toContain('analyze_futures_hedge');
      expect(names).toContain('project_division_paths');
      expect(names).toContain('track_award_race');
      expect(names).toContain('get_team_analytics');
      expect(names).toContain('get_team_roster');
      expect(names).toContain('get_strength_of_schedule');
      expect(names).toContain('get_futures_odds_movement');
      expect(names).toContain('get_normalized_signals');
      expect(names).toContain('get_podcast_host_summaries');
      expect(names).toContain('get_game_context');
      expect(names).toContain('get_referee_tendencies');
      expect(names).toContain('get_roster_churn');
      expect(names).toContain('get_clv_analysis');
    });

    it('each schema has name, description, and input_schema', () => {
      for (const tool of FUTURES_TOOLS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.input_schema?.type).toBe('object');
        expect(tool.input_schema?.properties).toBeDefined();
      }
    });
  });

  describe('get_team_analytics', () => {
    it('returns invalid for an unrecognized team', async () => {
      const result = await executeTool('get_team_analytics', { team: 'Not A Team' });
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_team_analytics', { team: 'Chiefs' });
      expect(result.status).toBe('no_data');
      expect(result.team).toBe('KC');
    });

    it('shapes rows into offense/defense/tendencies when data exists', async () => {
      const { getTeamSeasonStats } = await import('../../src/lib/supabase.js');
      getTeamSeasonStats.mockResolvedValueOnce([{
        team: 'KC', season: 2025, wins: 12, losses: 5, ties: 0,
        off_epa_per_play: 0.09, off_epa_rank: 3, def_epa_per_play: -0.05, def_epa_rank: 8,
        shotgun_rate: 0.62, no_huddle_rate: 0.08, pass_rate: 0.58,
        home_ats_record: '6-3-0', away_ats_record: '5-3-0',
      }]);
      const result = await executeTool('get_team_analytics', { team: 'KC' });
      expect(result.status).toBe('ok');
      expect(result.teams[0].record).toBe('12-5');
      expect(result.teams[0].offense.epa_rank).toBe(3);
      expect(result.teams[0].tendencies.pass_rate).toBe(0.58);
    });
  });

  describe('get_team_roster', () => {
    it('returns invalid without a team', async () => {
      const result = await executeTool('get_team_roster', {});
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_team_roster', { team: 'ARI' });
      expect(result.status).toBe('no_data');
    });

    it('shapes roster rows when data exists', async () => {
      const { getTeamRoster } = await import('../../src/lib/supabase.js');
      getTeamRoster.mockResolvedValueOnce([
        { full_name: 'Jacoby Brissett', position: 'QB', depth_chart_position: 'QB1', jersey_number: 7, status: 'ACT', years_exp: 9, season: 2026, week: 3 },
      ]);
      const result = await executeTool('get_team_roster', { team: 'ARI' });
      expect(result.status).toBe('ok');
      expect(result.player_count).toBe(1);
      expect(result.players[0].name).toBe('Jacoby Brissett');
      expect(result.as_of).toEqual({ season: 2026, week: 3 });
    });
  });

  describe('get_strength_of_schedule', () => {
    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_strength_of_schedule', {});
      expect(result.status).toBe('no_data');
    });

    it('returns invalid for an unrecognized team', async () => {
      const result = await executeTool('get_strength_of_schedule', { team: 'Not A Team' });
      expect(result.status).toBe('invalid');
    });

    it('returns hardest/easiest when data exists and no team filter', async () => {
      const { getStrengthOfSchedule } = await import('../../src/lib/supabase.js');
      getStrengthOfSchedule.mockResolvedValueOnce([
        { team_abbr: 'BUF', opponent_win_total_sum: 145.5, sos_rank: 1, sos_pool_size: 2 },
        { team_abbr: 'MIA', opponent_win_total_sum: 130.0, sos_rank: 2, sos_pool_size: 2 },
      ]);
      const result = await executeTool('get_strength_of_schedule', {});
      expect(result.status).toBe('ok');
      expect(result.hardest.team_abbr).toBe('BUF');
      expect(result.easiest.team_abbr).toBe('MIA');
    });

    it('returns a single team row when team filter matches', async () => {
      const { getStrengthOfSchedule } = await import('../../src/lib/supabase.js');
      getStrengthOfSchedule.mockResolvedValueOnce([
        { team_abbr: 'KC', opponent_win_total_sum: 138.0, sos_rank: 5, sos_pool_size: 32 },
      ]);
      const result = await executeTool('get_strength_of_schedule', { team: 'Chiefs' });
      expect(result.status).toBe('ok');
      expect(result.team).toBe('KC');
      expect(result.sos_rank).toBe(5);
    });
  });

  describe('get_futures_odds_movement', () => {
    it('returns invalid without required params', async () => {
      const result = await executeTool('get_futures_odds_movement', { team: 'Chiefs' });
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when Supabase has no history', async () => {
      const result = await executeTool('get_futures_odds_movement', { team: 'Chiefs', market_type: 'superbowl' });
      expect(result.status).toBe('no_data');
    });

    it('computes direction from opening vs current (falls back to all books when none are placeable)', async () => {
      const { getFuturesOddsHistory } = await import('../../src/lib/supabase.js');
      getFuturesOddsHistory.mockResolvedValueOnce([
        { snapshot_time: '2026-07-01T00:00:00Z', book: 'draftkings', odds: 2500 },
        { snapshot_time: '2026-07-21T00:00:00Z', book: 'draftkings', odds: 1200 },
      ]);
      const result = await executeTool('get_futures_odds_movement', { team: 'Chiefs', market_type: 'superbowl' });
      expect(result.status).toBe('ok');
      expect(result.direction).toBe('shortening (more likely)');
      expect(result.snapshot_count).toBe(2);
      expect(result.placeable_books_only).toBe(false);
    });

    it('picks the best PLACEABLE price at each snapshot round, ignoring a better non-placeable quote', async () => {
      const { getFuturesOddsHistory } = await import('../../src/lib/supabase.js');
      getFuturesOddsHistory.mockResolvedValueOnce([
        { snapshot_time: '2026-07-01T00:00:00Z', book: 'draftkings', odds: 3000 }, // best price overall, but NOT placeable
        { snapshot_time: '2026-07-01T00:00:00Z', book: 'betonline', odds: 2500 },  // best PLACEABLE price at open
        { snapshot_time: '2026-07-21T00:00:00Z', book: 'draftkings', odds: 1500 },
        { snapshot_time: '2026-07-21T00:00:00Z', book: 'betonline', odds: 1200 }, // best PLACEABLE price at current
      ]);
      const result = await executeTool('get_futures_odds_movement', { team: 'Chiefs', market_type: 'superbowl' });
      expect(result.status).toBe('ok');
      expect(result.placeable_books_only).toBe(true);
      expect(result.opening.book).toBe('betonline');
      expect(result.opening.odds).toBe('+2500');
      expect(result.current.book).toBe('betonline');
      expect(result.current.odds).toBe('+1200');
      expect(result.per_book_movement.find(b => b.book === 'betonline')).toBeTruthy();
      expect(result.consensus_movement_pts).not.toBeNull();
    });
  });

  describe('get_normalized_signals', () => {
    it('returns no_data when Supabase has no matching rows', async () => {
      const result = await executeTool('get_normalized_signals', {});
      expect(result.status).toBe('no_data');
      expect(result.message).toMatch(/normalized signals matched/i);
    });

    it('shapes signal rows when data exists', async () => {
      const { getNormalizedSignals } = await import('../../src/lib/supabase.js');
      getNormalizedSignals.mockResolvedValueOnce([
        { team: 'Ravens', market: 'division', direction: 'back', strength: 0.8, rationale: 'strong roster', source_type: 'podcast_pick', author: 'Warren Sharp', model: 'gpt-4o', created_at: '2026-07-20T00:00:00Z' },
      ]);
      const result = await executeTool('get_normalized_signals', { team: 'Ravens' });
      expect(result.status).toBe('ok');
      expect(result.signals[0].team).toBe('Ravens');
      expect(result.signals[0].strength).toBe(0.8);
    });
  });

  describe('get_podcast_host_summaries', () => {
    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_podcast_host_summaries', {});
      expect(result.status).toBe('no_data');
    });

    it('flattens futures arrays and filters by team client-side', async () => {
      const { getPodcastHostSummaries } = await import('../../src/lib/supabase.js');
      getPodcastHostSummaries.mockResolvedValueOnce([
        {
          host: 'Warren Sharp', episode_id: 'ep-1',
          futures: [
            { subject_market: 'AFC_North', subject: 'Ravens', prediction: 'win the division', lean: 'favor', confidence: 70, stats_cited: [], quote: 'Ravens are the class of the AFC North.' },
            { subject_market: 'MVP', subject: 'Josh Allen', prediction: 'MVP favorite', lean: 'favor', confidence: 60, stats_cited: [], quote: 'Allen is my MVP pick.' },
          ],
        },
      ]);
      const result = await executeTool('get_podcast_host_summaries', { team: 'Ravens' });
      expect(result.status).toBe('ok');
      expect(result.count).toBe(1);
      expect(result.futures[0].subject).toBe('Ravens');
    });
  });

  describe('get_game_context', () => {
    it('returns invalid for an unrecognized team', async () => {
      const result = await executeTool('get_game_context', { team: 'Not A Team' });
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_game_context', { team: 'Chiefs' });
      expect(result.status).toBe('no_data');
    });

    it('shapes rest/venue/closing-line context when data exists', async () => {
      const { getGameContext } = await import('../../src/lib/supabase.js');
      getGameContext.mockResolvedValueOnce([{
        game_id: 'nfl_2026_2_w05_KC_at_BUF', week: 5, kickoff_utc: '2026-10-05T17:00:00Z',
        home_abbrev: 'BUF', away_abbrev: 'KC', away_rest: 6, home_rest: 10,
        div_game: false, roof: 'outdoors', surface: 'grass', referee: 'Carl Cheffers',
        closing_spread_line: -2.5, closing_total_line: 47.5, closing_home_moneyline: -140, closing_away_moneyline: 120,
      }]);
      const result = await executeTool('get_game_context', { team: 'BUF' });
      expect(result.status).toBe('ok');
      expect(result.games[0].rest.rest_edge_days).toBe(4);
      expect(result.games[0].closing_lines.spread).toBe(-2.5);
    });
  });

  describe('get_referee_tendencies', () => {
    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_referee_tendencies', {});
      expect(result.status).toBe('no_data');
    });

    it('flags low-confidence small samples', async () => {
      const { getRefereeTendencies } = await import('../../src/lib/supabase.js');
      getRefereeTendencies.mockResolvedValueOnce([
        { referee: 'Carl Cheffers', games_officiated: 51, seasons: [2022, 2023, 2024], avg_total_points: 44.08, avg_total_penalties: 11.26, avg_penalty_yards: 95.4, home_win_pct: 0.6275 },
        { referee: 'Rookie Ref', games_officiated: 4, seasons: [2025], avg_total_points: 40.0, avg_total_penalties: 9.0, avg_penalty_yards: 80.0, home_win_pct: 0.5 },
      ]);
      const result = await executeTool('get_referee_tendencies', {});
      expect(result.status).toBe('ok');
      expect(result.referees[0].sample_confidence).toBe('moderate');
      expect(result.referees[1].sample_confidence).toMatch(/low/);
    });
  });

  describe('get_roster_churn', () => {
    it('returns invalid without a team', async () => {
      const result = await executeTool('get_roster_churn', {});
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when Supabase has no rows', async () => {
      const result = await executeTool('get_roster_churn', { team: 'ARI' });
      expect(result.status).toBe('no_data');
    });

    it('returns no_data when only one snapshot exists', async () => {
      const { getRosterHistory } = await import('../../src/lib/supabase.js');
      getRosterHistory.mockResolvedValueOnce([
        { season: 2026, week: 5, full_name: 'Player A', gsis_id: 'p1', position: 'WR', status: 'ACT' },
      ]);
      const result = await executeTool('get_roster_churn', { team: 'ARI' });
      expect(result.status).toBe('no_data');
    });

    it('computes adds/drops/status_changes across two snapshots', async () => {
      const { getRosterHistory } = await import('../../src/lib/supabase.js');
      getRosterHistory.mockResolvedValueOnce([
        // Week 5 (current)
        { season: 2026, week: 5, full_name: 'Player A', gsis_id: 'p1', position: 'WR', status: 'ACT' },
        { season: 2026, week: 5, full_name: 'Player C', gsis_id: 'p3', position: 'CB', status: 'ACT' },
        { season: 2026, week: 5, full_name: 'Player D', gsis_id: 'p4', position: 'QB', status: 'IR' },
        // Week 4 (prior)
        { season: 2026, week: 4, full_name: 'Player A', gsis_id: 'p1', position: 'WR', status: 'ACT' },
        { season: 2026, week: 4, full_name: 'Player B', gsis_id: 'p2', position: 'RB', status: 'ACT' },
        { season: 2026, week: 4, full_name: 'Player D', gsis_id: 'p4', position: 'QB', status: 'ACT' },
      ]);
      const result = await executeTool('get_roster_churn', { team: 'ARI' });
      expect(result.status).toBe('ok');
      expect(result.adds_count).toBe(1);
      expect(result.adds[0].name).toBe('Player C');
      expect(result.drops_count).toBe(1);
      expect(result.drops[0].name).toBe('Player B');
      expect(result.status_change_count).toBe(1);
      expect(result.status_changes[0]).toMatchObject({ name: 'Player D', from: 'ACT', to: 'IR' });
    });
  });

  describe('get_clv_analysis', () => {
    it('returns invalid without required params', async () => {
      const result = await executeTool('get_clv_analysis', { team: 'Chiefs' });
      expect(result.status).toBe('invalid');
    });

    it('returns no_data when there is no closing-line context', async () => {
      const result = await executeTool('get_clv_analysis', { team: 'Chiefs', week: 5 });
      expect(result.status).toBe('no_data');
    });

    it('computes spread/total movement from tracked-open to closing', async () => {
      const { getGameContext, getGameOddsForWeek } = await import('../../src/lib/supabase.js');
      getGameContext.mockResolvedValueOnce([{
        game_id: 'nfl_2026_2_w05_KC_at_BUF', week: 5,
        home_abbrev: 'BUF', away_abbrev: 'KC',
        closing_spread_line: -3.0, closing_total_line: 48.0,
      }]);
      getGameOddsForWeek.mockResolvedValueOnce([
        { home_team: 'Bills', away_team: 'Chiefs', market: 'spread', spread: -1.5, captured_at: '2026-09-29T00:00:00Z' },
        { home_team: 'Bills', away_team: 'Chiefs', market: 'total', total: 46.5, captured_at: '2026-09-29T00:00:00Z' },
        { home_team: 'Bills', away_team: 'Chiefs', market: 'spread', spread: -2.5, captured_at: '2026-10-03T00:00:00Z' },
      ]);
      const result = await executeTool('get_clv_analysis', { team: 'BUF', week: 5 });
      expect(result.status).toBe('ok');
      expect(result.spread.tracked_open).toBe(-1.5);
      expect(result.spread.closing).toBe(-3.0);
      expect(result.spread.movement).toBe(-1.5);
      expect(result.total.tracked_open).toBe(46.5);
    });
  });

});
