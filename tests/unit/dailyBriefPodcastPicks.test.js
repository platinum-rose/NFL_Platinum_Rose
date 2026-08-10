/**
 * Unit tests for Phase 7c — fetchTopPodcastPicks + renderTopPodcastPicks
 * Run: npx vitest run tests/unit/dailyBriefPodcastPicks.test.js
 */
import { describe, it, expect, afterEach } from 'vitest';
import { fetchTopPodcastPicks, renderTopPodcastPicks } from '../../agents/nfl-daily-brief.js';

// ── Fake Supabase builder ─────────────────────────────────────────────────────
// Mimics the .from().select().gte().order().limit() chain used by fetchTopPodcastPicks

function makeSupabase(rows, error = null) {
  const chain = {
    select: () => chain,
    gte:    () => chain,
    order:  () => chain,
    limit:  () => Promise.resolve({ data: error ? null : rows, error }),
  };
  return { from: () => chain };
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeRow({ picks = [], isNFLRelevant = true, feedName = 'The Mover' } = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    processed_at: new Date().toISOString(),
    picks,
    podcast_episodes: {
      id: 'ep-' + Math.random().toString(36).slice(2),
      title: isNFLRelevant ? 'NFL Week 14 Preview' : 'NBA Prop Special',
      pub_date: new Date().toISOString(),
      is_nfl_relevant: isNFLRelevant,
      podcast_feeds: { name: feedName, expert: null },
    },
  };
}

function makePick(overrides = {}) {
  return {
    category:      'spread',
    subject:       'Kansas City Chiefs',
    selection:     'Chiefs -3',
    line:          -3,
    summary:       'Sharp money leaning Chiefs.',
    confidence:    0.75,
    quality_score: 0.8,
    needs_review:  false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchTopPodcastPicks', () => {
  it('drops needs_review picks, sorts by confidence desc, caps at 8', async () => {
    // 9 valid picks + 1 needs_review — expect 8 returned, sorted
    const picks = [
      makePick({ confidence: 0.5, selection: 'Pick-5' }),
      makePick({ confidence: 0.9, selection: 'Pick-9' }),
      makePick({ confidence: 0.6, selection: 'Pick-6' }),
      makePick({ confidence: 0.3, selection: 'Pick-3' }),
      makePick({ confidence: 0.8, selection: 'Pick-8' }),
      makePick({ confidence: 0.4, selection: 'Pick-4' }),
      makePick({ confidence: 0.7, selection: 'Pick-7' }),
      makePick({ confidence: 0.2, selection: 'Pick-2' }),
      makePick({ confidence: 0.1, selection: 'Pick-1' }),
      makePick({ confidence: 0.99, selection: 'ShouldDrop', needs_review: true }),
    ];
    const supabase = makeSupabase([makeRow({ picks })]);
    const result = await fetchTopPodcastPicks(supabase);

    expect(result).toHaveLength(8);
    expect(result[0].selection).toBe('Pick-9');
    expect(result[1].selection).toBe('Pick-8');
    expect(result.every(p => !p.needs_review)).toBe(true);
    expect(result.find(p => p.selection === 'ShouldDrop')).toBeUndefined();
  });

  it('excludes non-NFL episodes', async () => {
    const nflRow   = makeRow({ picks: [makePick({ selection: 'Chiefs -3' })], isNFLRelevant: true });
    const nonNFLRow = makeRow({ picks: [makePick({ selection: 'Lakers ML' })], isNFLRelevant: false });
    const supabase = makeSupabase([nflRow, nonNFLRow]);
    const result = await fetchTopPodcastPicks(supabase);

    expect(result).toHaveLength(1);
    expect(result[0].selection).toBe('Chiefs -3');
  });

  it('returns [] on Supabase error without throwing', async () => {
    const supabase = makeSupabase([], { message: 'connection refused' });
    const result = await fetchTopPodcastPicks(supabase);
    expect(result).toEqual([]);
  });

  it('reads pick.category and attaches feedName from episode', async () => {
    const pick = makePick({ category: 'total', selection: 'Over 47.5' });
    const supabase = makeSupabase([makeRow({ picks: [pick], feedName: 'Sharp Talk' })]);
    const result = await fetchTopPodcastPicks(supabase);

    expect(result[0].category).toBe('total');
    expect(result[0].feedName).toBe('Sharp Talk');
  });
});

describe('renderTopPodcastPicks', () => {
  it('returns empty string for empty array (section auto-hides)', () => {
    expect(renderTopPodcastPicks([])).toBe('');
  });

  it('renders category label, selection, confidence, feedName', () => {
    const pick = {
      category:   'spread',
      selection:  'Bills -6.5',
      line:       -6.5,
      confidence: 0.8,
      units:      2,
      summary:    'Line movement supports Bills.',
      feedName:   'The Spread',
      episodeId:  'ep-abc',
    };
    const html = renderTopPodcastPicks([pick]);
    expect(html).toContain('Spread');
    expect(html).toContain('Bills -6.5');
    expect(html).toContain('80%');
    expect(html).toContain('The Spread');
    expect(html).toContain('Line movement supports Bills.');
    expect(html).toContain('Podcast Digest Tab');
  });

  it('escapes XSS in summary and selection', () => {
    const pick = {
      category:   'prop',
      selection:  '<script>alert(1)</script>',
      summary:    '<img src=x onerror=alert(2)>',
      confidence: 0.5,
      feedName:   'Risky Feed',
      episodeId:  'ep-xss',
    };
    const html = renderTopPodcastPicks([pick]);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  describe('M6_DIGEST_BASE env var', () => {
    const originalEnv = process.env.M6_DIGEST_BASE;

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.M6_DIGEST_BASE;
      else process.env.M6_DIGEST_BASE = originalEnv;
    });

    it('omits digest link when M6_DIGEST_BASE is unset', () => {
      delete process.env.M6_DIGEST_BASE;
      const pick = makePick({ feedName: 'Feed', episodeId: 'ep-1' });
      const html = renderTopPodcastPicks([{ ...pick, feedName: 'Feed', episodeId: 'ep-1' }]);
      expect(html).not.toContain('/digest/');
    });

    it('includes tailnet digest link when M6_DIGEST_BASE is set', () => {
      process.env.M6_DIGEST_BASE = 'http://m6.local:8088';
      const pick = { ...makePick(), feedName: 'Feed', episodeId: 'ep-42' };
      const html = renderTopPodcastPicks([pick]);
      expect(html).toContain('http://m6.local:8088/digest/episodes/ep-42.html');
    });
  });
});
