/**
 * Unit tests for scripts/podcast-coverage.js's pure helper functions
 * (RSS pubDate parsing, day-diff math, flag classification). No network/Supabase
 * calls — those are exercised only by main(), which this suite never invokes.
 */
import { describe, it, expect } from 'vitest';
import { latestRssPubDate, daysBetween, fmtDate, classifyFlag } from '../../scripts/podcast-coverage.js';

function rssWithItems(pubDates) {
  const items = pubDates
    .map(d => `<item><title>Ep</title><pubDate>${d}</pubDate><guid>g-${d}</guid></item>`)
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
