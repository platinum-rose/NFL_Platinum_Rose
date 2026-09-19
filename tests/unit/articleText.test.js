import { describe, expect, it } from 'vitest';
import { htmlTitle, htmlToText, isArticleLink } from '../../agents/lib/article-text.js';

describe('linked article helpers', () => {
  it('keeps article links, drops social/video/sportsbook/image links', () => {
    expect(isArticleLink('https://www.covers.com/nfl/picks-against-the-spread-for-every-week-2-game-2026')).toBe(true);
    expect(isArticleLink('https://vsin.com/nfl/nfl-week-2-best-bets-from-wes-reynolds/')).toBe(true);
    expect(isArticleLink('https://youtu.be/kCtaV8lQRKA')).toBe(false);
    expect(isArticleLink('https://x.com/Covers/status/1')).toBe(false);
    expect(isArticleLink('https://sportsbook.draftkings.com/event/123')).toBe(false);
    expect(isArticleLink('https://www.covers.com/')).toBe(false);
    expect(isArticleLink('https://pbs.example.com/img.jpg')).toBe(false);
    expect(isArticleLink('not a url')).toBe(false);
  });

  it('strips page chrome and keeps readable text', () => {
    const html = '<html><head><title> Week 2 ATS Picks </title><script>x()</script></head><body><nav>menu</nav><h1>Bears -4.5</h1><p>Take Chicago &amp; lay it.</p></body></html>';
    expect(htmlTitle(html)).toBe('Week 2 ATS Picks');
    const text = htmlToText(html);
    expect(text).toContain('Bears -4.5');
    expect(text).toContain('Take Chicago & lay it.');
    expect(text).not.toContain('menu');
    expect(text).not.toContain('x()');
  });
});
