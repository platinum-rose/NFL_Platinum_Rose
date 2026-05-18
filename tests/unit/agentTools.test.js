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
  supabase: null,
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
  OPENAI_BETTING_TOOLS,
  executeTool,
} from '../../src/lib/agentTools.js';

describe('agentTools', () => {
  describe('BETTING_TOOLS', () => {
    it('exports exactly 9 tools', () => {
      expect(BETTING_TOOLS).toHaveLength(9);
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
        'get_injury_report',
        'get_line_movement',
        'get_odds',
        'get_performance_stats',
        'log_pick',
        'search_intel',
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

  });
});
