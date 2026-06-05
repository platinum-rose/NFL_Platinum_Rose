/**
 * Unit tests for src/lib/agentTools.js
 *
 * Run: npx vitest run
 * Coverage: npx vitest run --coverage
 */
import { describe, it, expect, vi } from 'vitest';

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
  supabase: null,
}));

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
  LOCAL_DATA: { SCHEDULE: '', WEEKLY_STATS: '' },
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
    it('exports exactly 19 tools (13 base + 6 podcast intel)', () => {
      expect(BETTING_TOOLS).toHaveLength(19);
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
        'log_pick',
        'read_vault_note',
        'search_intel',
        'search_podcast_picks',
        'search_sharp_tweets',
        'write_vault_note',
      ]);
    });

    it('PODCAST_INTEL_TOOLS contains the 6 phase-6 tools', () => {
      const names = PODCAST_INTEL_TOOLS.map(t => t.name).sort();
      expect(names).toEqual([
        'get_expert_history',
        'get_futures_movement',
        'get_player_prop_context',
        'get_team_podcast_intel',
        'get_weekly_consensus',
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
    it('exports exactly 3 FUT-TOOLS schemas', () => {
      expect(FUTURES_TOOLS).toHaveLength(3);
      const names = FUTURES_TOOLS.map(t => t.name);
      expect(names).toContain('analyze_futures_hedge');
      expect(names).toContain('project_division_paths');
      expect(names).toContain('track_award_race');
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

});
