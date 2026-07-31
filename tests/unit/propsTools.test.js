/**
 * Unit tests for src/lib/propsTools.js
 *
 * Run: npx vitest run
 * Coverage: npx vitest run --coverage
 */
import { describe, it, expect, vi } from 'vitest';

// Mock I/O dependencies so the module loads cleanly in Node.
vi.mock('../../src/lib/supabase.js', () => ({
  getLatestOddsSnapshot: vi.fn(async () => null),
  supabase: null,
}));

vi.mock('../../src/lib/storage.js', () => ({
  loadFromStorage: vi.fn(() => null),
  saveToStorage: vi.fn(),
  PR_STORAGE_KEYS: {
    PICKS: { key: 'pr_picks_v1', permanence: 'critical', description: 'AI Lab picks with grading' },
    GAME_RESULTS: { key: 'pr_game_results_v1', permanence: 'persistent', description: 'Cached game results for auto-grading' },
    PROPS_PICKS: { key: 'nfl_props_picks_v1', permanence: 'critical', description: 'Logged player prop picks and SGP legs' },
  },
}));

vi.mock('../../src/lib/apiConfig.js', () => ({
  LOCAL_DATA: { SCHEDULE: '', WEEKLY_STATS: '' },
  ESPN_API: { INJURIES_URL: '' },
}));

import {
  PROP_MARKETS,
  PROPS_TOOLS,
  executePropTool,
} from '../../src/lib/propsTools.js';

describe('propsTools', () => {
  describe('PROP_MARKETS', () => {
    it('contains passing markets', () => {
      expect(PROP_MARKETS).toHaveProperty('player_pass_yds');
      expect(PROP_MARKETS).toHaveProperty('player_pass_tds');
      expect(PROP_MARKETS).toHaveProperty('player_pass_attempts');
    });

    it('contains rushing markets', () => {
      expect(PROP_MARKETS).toHaveProperty('player_rush_yds');
      expect(PROP_MARKETS).toHaveProperty('player_rush_attempts');
    });

    it('contains receiving markets', () => {
      expect(PROP_MARKETS).toHaveProperty('player_reception_yds');
      expect(PROP_MARKETS).toHaveProperty('player_receptions');
    });

    it('each market entry has a label and baseline', () => {
      for (const [key, meta] of Object.entries(PROP_MARKETS)) {
        expect(meta, `${key} missing label`).toHaveProperty('label');
        expect(meta, `${key} missing baseline`).toHaveProperty('baseline');
        // baseline may be a number or an object depending on market type
        expect(
          typeof meta.baseline === 'number' || typeof meta.baseline === 'object',
          `${key} baseline unexpected type: ${typeof meta.baseline}`,
        ).toBe(true);
      }
    });
  });

  describe('PROPS_TOOLS', () => {
    it('exports exactly 8 tools', () => {
      expect(PROPS_TOOLS).toHaveLength(8);
    });

    it('each tool has name, description, and input_schema', () => {
      for (const tool of PROPS_TOOLS) {
        expect(tool, `${tool?.name} missing name`).toHaveProperty('name');
        expect(tool, `${tool?.name} missing description`).toHaveProperty('description');
        expect(tool, `${tool?.name} missing input_schema`).toHaveProperty('input_schema');
      }
    });

    it('includes the key tool names', () => {
      const names = PROPS_TOOLS.map(t => t.name);
      expect(names).toContain('get_player_props');
      expect(names).toContain('analyze_prop');
      expect(names).toContain('log_prop');
      expect(names).toContain('build_sgp');
    });

    it('get_player_props has team as required field', () => {
      const tool = PROPS_TOOLS.find(t => t.name === 'get_player_props');
      expect(tool.input_schema.required).toContain('team');
    });
  });

  describe('executePropTool', () => {
    it('returns error for an unknown tool name', async () => {
      const result = await executePropTool('not_a_props_tool', {});
      expect(result).toEqual({ error: 'Unknown PROPS tool: not_a_props_tool' });
    });
  });
});
