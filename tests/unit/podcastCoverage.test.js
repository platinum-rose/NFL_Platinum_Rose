/**
 * Unit tests for scripts/podcast-coverage.js's pure helper functions
 * (RSS pubDate parsing, day-diff math, flag classification). No network/Supabase
 * calls — those are exercised only by main(), which this suite never invokes.
 */
import { describe, it, expect } from 'vitest';
import { latestRssPubDate, latestRelevantRssPubDate, daysBetween, fmtDate, classifyFlag } from '../../scripts/podcast-coverage.js';

function rssWithItems(itemsIn) {
  const items = itemsIn
    .map(item => typeof item === 'string'
      ? { title: 'Ep', date: item }
      : item)
    .map(({ title, date }) => `<item><title>${title}</title><pubDate>${date}</pubDate><guid>g-${date}</guid></item>`)
    .join('\n');
  return `<?xml version="1.0"?><rss><channel><title>Test Feed</title>${items}</channel></rss>`;
}

describe('latestRssPubDate', () => {
  it('returns the pubDate of the first <item> (feeds list newest-first)', () => {
    const xml = rssWithItems(['Mon, 20 Jul 2026 12:00:00 GMT', 'Mon, 13 Jul 2026 12:00:00 GMT']);
    const d = latestRssPubDate(xml);
    expect(d.toISOString().slice(0, 10)).toBe('2026-07-20');
  });

  it('returns null when the feed has no items', () => {
    const xml = '<?xml version="1.0"?><rss><channel><title>Empty</title></channel></rss>';
    expect(latestRssPubDate(xml)).toBeNull();
  });

  it('returns null when the first item has no pubDate', () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><title>No date</title></item></channel></rss>';
    expect(latestRssPubDate(xml)).toBeNull();
  });

  it('returns null for an unparseable pubDate string', () => {
    const xml = rssWithItems(['not-a-date']);
    expect(latestRssPubDate(xml)).toBeNull();
  });

  it('strips CDATA wrapping if present', () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><pubDate><![CDATA[Mon, 20 Jul 2026 12:00:00 GMT]]></pubDate></item></channel></rss>';
    const d = latestRssPubDate(xml);
    expect(d.toISOString().slice(0, 10)).toBe('2026-07-20');
  });
});

describe('latestRelevantRssPubDate', () => {
  it('skips clear non-NFL feed items and returns the latest NFL-relevant date', () => {
    const xml = rssWithItems([
      { title: '3M Open Betting Preview | 2026', date: 'Wed, 22 Jul 2026 12:00:00 GMT' },
      { title: '10 College Football Storylines Every Bettor Needs to Know', date: 'Tue, 21 Jul 2026 12:00:00 GMT' },
      { title: 'The 5 NFL Betting Rules Professional Gamblers Never Break', date: 'Thu, 16 Jul 2026 12:00:00 GMT' },
    ]);
    const d = latestRelevantRssPubDate(xml);
    expect(d.toISOString().slice(0, 10)).toBe('2026-07-16');
  });

  it('returns null when no dated NFL-relevant items exist', () => {
    const xml = rssWithItems([
      { title: '3M Open Betting Preview | 2026', date: 'Wed, 22 Jul 2026 12:00:00 GMT' },
      { title: 'World Cup Final Betting Preview', date: 'Tue, 21 Jul 2026 12:00:00 GMT' },
    ]);
    expect(latestRelevantRssPubDate(xml)).toBeNull();
  });
});

describe('daysBetween', () => {
  it('computes whole days between two dates', () => {
    const a = new Date('2026-07-20T00:00:00Z');
    const b = new Date('2026-07-15T00:00:00Z');
    expect(daysBetween(a, b)).toBe(5);
  });

  it('returns null if either date is missing', () => {
    expect(daysBetween(null, new Date())).toBeNull();
    expect(daysBetween(new Date(), null)).toBeNull();
  });
});

describe('fmtDate', () => {
  it('formats to YYYY-MM-DD', () => {
    expect(fmtDate(new Date('2026-07-20T18:30:00Z'))).toBe('2026-07-20');
  });
  it('returns an em dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });
});

describe('classifyFlag', () => {
  it('flags rss_error first regardless of other fields', () => {
    expect(classifyFlag({ rssError: 'HTTP 500', totalEpisodes: 10, behindDays: 0, staleDays: 2 })).toBe('rss_error');
  });

  it('flags never_ingested when zero episodes exist', () => {
    expect(classifyFlag({ rssError: null, totalEpisodes: 0, behindDays: null, staleDays: 2 })).toBe('never_ingested');
  });

  it('flags stale when behind more than the threshold', () => {
    expect(classifyFlag({ rssError: null, totalEpisodes: 5, behindDays: 3, staleDays: 2 })).toBe('stale');
  });

  it('is ok exactly at the threshold', () => {
    expect(classifyFlag({ rssError: null, totalEpisodes: 5, behindDays: 2, staleDays: 2 })).toBe('ok');
  });

  it('is ok when caught up', () => {
    expect(classifyFlag({ rssError: null, totalEpisodes: 5, behindDays: 0, staleDays: 2 })).toBe('ok');
  });
});
