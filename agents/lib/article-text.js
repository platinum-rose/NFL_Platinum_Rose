// Helpers for reading articles linked from bookmarked tweets (2026-09-19).
// e.g. Covers "NFL ATS picks for EVERY Week 2 Game ⤵️ <link>" -- the picks live in the article.

const NON_ARTICLE_HOSTS = /(^|\.)(x\.com|twitter\.com|t\.co|youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitch\.tv|spotify\.com|apple\.com|linktr\.ee|discord\.gg|discord\.com|patreon\.com|whop\.com)$/i;
const BOOK_HOSTS = /(^|\.)(draftkings|fanduel|betmgm|caesars|espnbet|bet365|fanatics|hardrock|underdogfantasy|prizepicks|sleeper)\.[a-z.]+$/i;

export function isArticleLink(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    const host = u.hostname.replace(/^www\./, '');
    if (NON_ARTICLE_HOSTS.test(host) || BOOK_HOSTS.test(host)) return false;
    if (/\.(jpe?g|png|gif|webp|mp4|mov|pdf)$/i.test(u.pathname)) return false;
    return u.pathname.length > 1; // skip bare homepages
  } catch {
    return false;
  }
}

export function htmlTitle(html = '') {
  const m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

export function htmlToText(html = '', maxChars = 20000) {
  return String(html)
    .replace(/<(script|style|nav|header|footer|aside|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, maxChars);
}
