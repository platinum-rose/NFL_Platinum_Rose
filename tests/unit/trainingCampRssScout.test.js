import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEEDS,
  parseRssItems,
  parseAtomItems,
  canonicalizeUrl,
  isCampRelevant,
  fetchFeed,
  runScout,
} from '../../scripts/training-camp-rss-scout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'training-camp-intel', 'manual');

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Sample Feed</title>
  <item>
    <title>Bills open camp battle at left tackle</title>
    <link>https://example.com/bills-lt-battle?utm_source=twitter&amp;utm_medium=social#top</link>
    <description>Buffalo's depth chart at left tackle is wide open entering training camp.</description>
    <pubDate>Mon, 20 Jul 2026 12:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Packers sign new sponsorship deal</title>
    <link>https://example.com/packers-sponsorship</link>
    <description>Green Bay announced a new stadium sponsorship agreement.</description>
    <pubDate>Mon, 20 Jul 2026 13:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

const SAMPLE_ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Bengals QB questionable with hamstring</title>
    <link rel="alternate" href="https://example.com/bengals-qb-hamstring" />
    <summary>The Bengals starting quarterback is questionable for the preseason opener.</summary>
    <published>2026-07-21T10:00:00Z</published>
  </entry>
</feed>`;

describe('parseRssItems', () => {
  it('extracts title, link, description, and published date', () => {
    const items = parseRssItems(SAMPLE_RSS);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Bills open camp battle at left tackle');
    expect(items[0].link).toContain('bills-lt-battle');
    expect(items[0].description).toContain('depth chart');
    expect(items[0].published_at).toBe(new Date('Mon, 20 Jul 2026 12:00:00 GMT').toISOString());
  });

  it('drops items with no link', () => {
    const xml = '<rss><channel><item><title>No link</title></item></channel></rss>';
    expect(parseRssItems(xml)).toHaveLength(0);
  });
});

describe('parseAtomItems', () => {
  it('extracts entries via rel=alternate link', () => {
    const items = parseAtomItems(SAMPLE_ATOM);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Bengals QB questionable with hamstring');
    expect(items[0].link).toBe('https://example.com/bengals-qb-hamstring');
    expect(items[0].description).toContain('questionable');
  });
});

describe('canonicalizeUrl', () => {
  it('strips utm params, fbclid/gclid, and hash fragments', () => {
    const out = canonicalizeUrl('https://example.com/a?utm_source=x&utm_medium=y&fbclid=z&keep=1#frag');
    expect(out).toBe('https://example.com/a?keep=1');
  });

  it('returns the raw input if the URL is unparseable', () => {
    expect(canonicalizeUrl('not a url')).toBe('not a url');
  });
});

describe('isCampRelevant', () => {
  it('matches camp-specific keywords', () => {
    expect(isCampRelevant('Buffalo\'s depth chart at left tackle is wide open')).toBe(true);
    expect(isCampRelevant('Player is questionable with a hamstring injury')).toBe(true);
  });

  it('rejects unrelated NFL business news', () => {
    expect(isCampRelevant('Green Bay announced a new stadium sponsorship agreement')).toBe(false);
  });
});

describe('FEEDS', () => {
  it('is a non-empty list of {source,url} pairs', () => {
    expect(FEEDS.length).toBeGreaterThan(0);
    for (const feed of FEEDS) {
      expect(typeof feed.source).toBe('string');
      expect(feed.url).toMatch(/^https:\/\//);
    }
  });
});

describe('fetchFeed', () => {
  it('parses a live RSS response into items', async () => {
    const stub = async () => new Response(SAMPLE_RSS, {
      status: 200,
      headers: { 'content-type': 'application/rss+xml' },
    });
    const originalFetch = global.fetch;
    global.fetch = stub;
    try {
      const result = await fetchFeed({ source: 'Test Feed', url: 'https://example.com/feed' });
      expect(result.status).toBe('available');
      expect(result.items).toHaveLength(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('reports unavailable on a non-2xx response', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 503, headers: new Headers() });
    try {
      const result = await fetchFeed({ source: 'Down Feed', url: 'https://example.com/down' });
      expect(result.status).toBe('unavailable');
      expect(result.reason).toContain('503');
      expect(result.items).toEqual([]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('reports error when the response is not parseable XML', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response('<html>not a feed</html>', {
      status: 200,
      headers: { 'content-type': 'text/xml' },
    });
    try {
      const result = await fetchFeed({ source: 'Bad Feed', url: 'https://example.com/bad' });
      expect(result.status).toBe('unavailable');
      expect(result.items).toEqual([]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('runScout', () => {
  it('parses manual notes only when live is false, and marks every feed skipped', async () => {
    const { snapshot, feedHealth, outputs } = await runScout({
      season: 2026,
      inputDir: FIXTURE_DIR,
      live: false,
      dryRun: true,
      generatedAt: '2026-08-02T20:00:00.000Z',
    });

    expect(outputs).toBeNull();
    expect(snapshot.meta.item_count).toBeGreaterThanOrEqual(4); // same fixture as Phase 1 test
    expect(feedHealth.every((f) => f.status === 'skipped')).toBe(true);
    expect(feedHealth.every((f) => f.kept_items === 0)).toBe(true);
  });

  it('merges live RSS items (camp-relevant, team-taggable) with manual items', async () => {
    const fakeFetcher = async (feed) => {
      if (feed.source === 'ESPN NFL') {
        return {
          source: feed.source,
          status: 'available',
          reason: null,
          items: [
            {
              title: 'Bills camp battle: starting job at left tackle wide open',
              link: 'https://example.com/bills-lt-2026?utm_source=x',
              description: 'Buffalo\'s depth chart at left tackle remains unsettled entering training camp.',
              published_at: '2026-07-25T12:00:00.000Z',
            },
            {
              title: 'Packers announce new stadium sponsor',
              link: 'https://example.com/packers-sponsor',
              description: 'Green Bay unveiled a new jersey sponsorship logo today.',
              published_at: '2026-07-25T12:00:00.000Z',
            },
          ],
        };
      }
      return { source: feed.source, status: 'available', reason: null, items: [] };
    };

    const { snapshot, feedHealth, outputs } = await runScout({
      season: 2026,
      inputDir: FIXTURE_DIR,
      live: true,
      campOnly: true,
      generatedAt: '2026-08-02T20:00:00.000Z',
      date: '2026-08-02',
      dryRun: true,
      fetchFeedImpl: fakeFetcher,
    });

    expect(outputs).toBeNull();
    expect(snapshot.meta.guardrails.network_fetches).toBe(true);
    expect(snapshot.meta.feed_health).toEqual(feedHealth);

    const espnHealth = feedHealth.find((f) => f.source === 'ESPN NFL');
    expect(espnHealth.status).toBe('available');
    // Camp-battle/depth-chart item kept; sponsorship item dropped (no camp keyword)
    expect(espnHealth.kept_items).toBe(1);

    const bufItem = snapshot.teams.BUF.items.find((i) => i.source === 'ESPN NFL');
    expect(bufItem).toBeTruthy();
    expect(bufItem.source_type).toBe('rss');
    expect(bufItem.needs_human_review).toBe(true);
    expect(bufItem.source_url).toBe('https://example.com/bills-lt-2026?utm_source=x'.replace('?utm_source=x', ''));

    // Manual fixture items are still present alongside the RSS item.
    expect(snapshot.teams.GB.items.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.teams.CIN.items.length).toBeGreaterThanOrEqual(1);
  });

  it('widens beyond camp keywords when campOnly is false', async () => {
    const fakeFetcher = async (feed) => {
      if (feed.source !== 'PFF') return { source: feed.source, status: 'available', reason: null, items: [] };
      return {
        source: feed.source,
        status: 'available',
        reason: null,
        items: [{
          title: 'Chiefs announce new sponsorship deal',
          link: 'https://example.com/chiefs-sponsor',
          description: 'Kansas City unveiled a new jersey patch sponsor.',
          published_at: '2026-07-25T12:00:00.000Z',
        }],
      };
    };

    const strict = await runScout({
      season: 2026, inputDir: FIXTURE_DIR, live: true, campOnly: true, source: 'PFF',
      generatedAt: '2026-08-02T20:00:00.000Z', dryRun: true, fetchFeedImpl: fakeFetcher,
    });
    expect(strict.feedHealth[0].kept_items).toBe(0);

    const wide = await runScout({
      season: 2026, inputDir: FIXTURE_DIR, live: true, campOnly: false, source: 'PFF',
      generatedAt: '2026-08-02T20:00:00.000Z', dryRun: true, fetchFeedImpl: fakeFetcher,
    });
    expect(wide.feedHealth[0].kept_items).toBe(1);
  });

  it('restricts to a single feed via the source filter', async () => {
    const { feedHealth } = await runScout({
      season: 2026, inputDir: FIXTURE_DIR, live: false, source: 'PFF',
      generatedAt: '2026-08-02T20:00:00.000Z', dryRun: true,
    });
    expect(feedHealth).toHaveLength(1);
    expect(feedHealth[0].source).toBe('PFF');
  });
});
