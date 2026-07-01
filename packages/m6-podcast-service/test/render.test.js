/**
 * Phase 7a render layer tests (spec §8).
 *
 * All tests are offline + Windows-friendly:
 *   - A fake Supabase client is injected (no real network calls)
 *   - digestDir is pointed at os.tmpdir() scratch space
 *   - No systemd, no M6 filesystem assumptions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildRenderer } from '../render/index.js';
import { slugify } from '../render/aggregate.js';

// ── Fake Supabase helpers ─────────────────────────────────────────────────

/**
 * Build a minimal fake Supabase client backed by an in-memory episode array.
 * Supports the exact query pattern used by the renderer:
 *   supabase.from(table).select(cols).eq(col,val)[.eq(...)][.maybeSingle()]
 *
 * @param {object[]} episodes
 * @returns {object} fake supabase
 */
function makeFakeSupabase(episodes) {
  return {
    from(_table) {
      let filters = {};
      let single = false;

      const chain = {
        select() { return this; },
        order() { return this; },
        eq(col, val) {
          filters = { ...filters, [col]: val };
          return this;
        },
        maybeSingle() {
          single = true;
          return this;
        },
        // Thenable — resolved when awaited.
        then(resolve, reject) {
          try {
            let result = episodes;
            for (const [col, val] of Object.entries(filters)) {
              result = result.filter((e) => e[col] === val);
            }
            const data = single ? (result[0] ?? null) : result;
            Promise.resolve({ data, error: null }).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        },
      };
      return chain;
    },
  };
}

// ── Test data ─────────────────────────────────────────────────────────────

/** One episode for expert "Sharp Sports", Week 5 picks. */
function ep1() {
  return {
    id: 'ep-1',
    title: 'Week 5 Breakdown',
    pub_date: '2025-10-08',
    status: 'done',
    is_partial: false,
    duration_secs: 3600,
    podcast_feeds: { expert: 'sharp-sports', name: 'Sharp Sports Podcast' },
    podcast_transcripts: {
      extraction_model: 'qwen3:8b',
      extraction_quality_score: 0.82,
      picks: [
        {
          category: 'spread',
          team1: 'KC',
          team2: 'LV',
          selection: 'KC',
          line: -7,
          odds_american: -110,
          summary: 'Mahomes dominant at home, LV pass rush depleted',
          units: 2,
          quality_score: 0.8,
          needs_review: false,
          week: 5,
          season: 2025,
        },
        {
          category: 'total',
          team1: 'KC',
          team2: 'LV',
          selection: 'UNDER',
          line: 47.5,
          summary: 'LV offense struggling',
          units: 1,
          quality_score: 0.75,
          needs_review: false,
          week: 5,
          season: 2025,
        },
      ],
      intel: ['LV pass rush degraded', 'KC perfect at home this season'],
    },
  };
}

/** One episode for expert "Betting Edge", also Week 5 — same matchup, other side. */
function ep2() {
  return {
    id: 'ep-2',
    title: 'Edge Report W5',
    pub_date: '2025-10-09',
    status: 'done',
    is_partial: false,
    duration_secs: 2400,
    podcast_feeds: { expert: 'betting-edge', name: 'Betting Edge Podcast' },
    podcast_transcripts: {
      extraction_model: 'qwen3:8b',
      extraction_quality_score: 0.79,
      picks: [
        {
          category: 'spread',
          team1: 'KC',
          team2: 'LV',
          selection: 'LV',
          line: 7,
          summary: 'LV covers on the road',
          units: 1,
          quality_score: 0.7,
          needs_review: false,
          week: 5,
          season: 2025,
        },
      ],
      intel: ['LV road record +7 or more: 6-2 ATS'],
    },
  };
}

/** Partial episode for expert "Sharp Sports". */
function epPartial() {
  return {
    id: 'ep-partial',
    title: 'Partial Feed Test',
    pub_date: '2025-10-10',
    status: 'done',
    is_partial: true,
    duration_secs: 600,
    podcast_feeds: { expert: 'sharp-sports', name: 'Sharp Sports Podcast' },
    podcast_transcripts: {
      extraction_model: 'qwen3:8b',
      extraction_quality_score: 0.5,
      picks: [],
      intel: ['Partial transcript — audio cut short'],
    },
  };
}

// ── Scratch directory per test ────────────────────────────────────────────

let tmpDir;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nfl-render-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function cfg() {
  return { digestDir: tmpDir };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('renderEpisode', () => {
  it('writes episodes/<id>.html with title, expert, pick summary/line/units, intel', async () => {
    const episode = ep1();
    const renderer = buildRenderer({ supabase: makeFakeSupabase([episode]), cfg: cfg() });

    await renderer.renderEpisode('ep-1');

    const html = await fs.readFile(path.join(tmpDir, 'episodes', 'ep-1.html'), 'utf8');

    expect(html).toContain('Week 5 Breakdown');
    expect(html).toContain('Sharp Sports Podcast');
    expect(html).toContain('Mahomes dominant at home, LV pass rush depleted'); // pick summary
    expect(html).toContain('-7');                                                // line
    expect(html).toContain('2u');                                                // units
    expect(html).toContain('LV pass rush degraded');                             // intel
    expect(html).toContain('KC vs LV');                                          // matchup
    expect(html).toContain('qwen3:8b');                                          // extraction_model
  });
});

describe('XSS escaping', () => {
  it('escapes <script> in pick summary — never writes raw HTML from transcript', async () => {
    const episode = ep1();
    episode.podcast_transcripts.picks[0].summary = '<script>alert(1)</script>';
    const renderer = buildRenderer({ supabase: makeFakeSupabase([episode]), cfg: cfg() });

    await renderer.renderEpisode('ep-1');

    const html = await fs.readFile(path.join(tmpDir, 'episodes', 'ep-1.html'), 'utf8');

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('renderWeekly', () => {
  it('groups two experts picks on the same matchup into one consensus row with correct side counts', async () => {
    const episodes = [ep1(), ep2()];
    const renderer = buildRenderer({ supabase: makeFakeSupabase(episodes), cfg: cfg() });

    await renderer.renderWeekly('2025-W5');

    const html = await fs.readFile(path.join(tmpDir, 'weekly', '2025-W5.html'), 'utf8');

    // Both team names present
    expect(html).toContain('KC');
    expect(html).toContain('LV');
    // Side counts: ep1 picks KC, ep2 picks LV → each side: 1
    expect(html).toContain('KC: 1');
    expect(html).toContain('LV: 1');
    // Both experts referenced
    expect(html).toContain('sharp-sports');
    expect(html).toContain('betting-edge');
  });
});

describe('renderExpert', () => {
  it('lists only that experts done episodes, grouped by week', async () => {
    const episodes = [ep1(), ep2()];
    const renderer = buildRenderer({ supabase: makeFakeSupabase(episodes), cfg: cfg() });

    await renderer.renderExpert('sharp-sports');

    const html = await fs.readFile(path.join(tmpDir, 'experts', 'sharp-sports.html'), 'utf8');

    // ep1 belongs to sharp-sports
    expect(html).toContain('Week 5 Breakdown');
    // ep2 does NOT belong to sharp-sports
    expect(html).not.toContain('Edge Report W5');
    // Week grouping present
    expect(html).toContain('2025-W5');
  });
});

describe('slugify', () => {
  it('produces strings matching ^[a-z0-9-]{1,64}$ (Phase 8 contract)', () => {
    const cases = [
      'Sharp Sports',
      'The Betting Edge Podcast!',
      '  Spaces  ',
      'ALL CAPS',
      'Under-scored_name',
      'a'.repeat(100), // over 64 chars
    ];
    const pattern = /^[a-z0-9-]{1,64}$/;
    for (const name of cases) {
      const slug = slugify(name);
      expect(slug).toMatch(pattern);
    }
  });

  it('detects collisions when two expert names produce the same slug', () => {
    // "Sharp Sports" and "Sharp Sports!" both → "sharp-sports"
    expect(slugify('Sharp Sports')).toBe(slugify('Sharp Sports!'));
  });
});

describe('atomic write', () => {
  it('leaves no *.tmp file after success; overwrites existing file with new content', async () => {
    const { atomicWrite } = await import('../render/writeFile.js');
    const target = path.join(tmpDir, 'test.html');

    await atomicWrite(target, '<h1>First</h1>');
    const first = await fs.readFile(target, 'utf8');
    expect(first).toContain('First');

    // No .tmp left
    await expect(fs.access(target + '.tmp')).rejects.toThrow();

    // Overwrite
    await atomicWrite(target, '<h1>Second</h1>');
    const second = await fs.readFile(target, 'utf8');
    expect(second).toContain('Second');
    expect(second).not.toContain('First');

    // Still no .tmp
    await expect(fs.access(target + '.tmp')).rejects.toThrow();
  });
});

describe('is_partial banner', () => {
  it('renders a visible partial banner for is_partial episodes', async () => {
    const episode = epPartial();
    const renderer = buildRenderer({ supabase: makeFakeSupabase([episode]), cfg: cfg() });

    await renderer.renderEpisode('ep-partial');

    const html = await fs.readFile(path.join(tmpDir, 'episodes', 'ep-partial.html'), 'utf8');

    expect(html).toContain('partial-banner');
    // The banner text
    expect(html).toMatch(/Partial episode/i);
  });
});

describe('renderForEpisode', () => {
  it('writes episode page + expert summary + expert-week + weekly pages', async () => {
    const episodes = [ep1(), ep2()];
    const renderer = buildRenderer({ supabase: makeFakeSupabase(episodes), cfg: cfg() });

    const { written } = await renderer.renderForEpisode('ep-1');

    // Must have written at least 4 files: episode, expert, expert-week, weekly
    expect(written.length).toBeGreaterThanOrEqual(4);

    // Episode page
    const epFile = path.join(tmpDir, 'episodes', 'ep-1.html');
    await expect(fs.access(epFile)).resolves.toBeUndefined();

    // Expert summary page
    const expFile = path.join(tmpDir, 'experts', 'sharp-sports.html');
    await expect(fs.access(expFile)).resolves.toBeUndefined();

    // Expert-week page
    const ewFile = path.join(tmpDir, 'experts', 'sharp-sports', '2025-W5.html');
    await expect(fs.access(ewFile)).resolves.toBeUndefined();

    // Weekly page
    const wFile = path.join(tmpDir, 'weekly', '2025-W5.html');
    await expect(fs.access(wFile)).resolves.toBeUndefined();
  });
});

describe('renderAll — empty vault', () => {
  it('writes 0 files and does not throw when no done episodes exist', async () => {
    const renderer = buildRenderer({ supabase: makeFakeSupabase([]), cfg: cfg() });

    const result = await renderer.renderAll();

    expect(result.written).toBe(0);
    expect(result.episodes).toBe(0);
    // digestDir should be untouched (no subdirs created)
    const entries = await fs.readdir(tmpDir);
    expect(entries).toHaveLength(0);
  });
});
