// agents/lib/article-body.js
//
// Article body fetch + HTML-to-text used by research-intel-ingest (and the
// re-extraction script scripts/intel/reextract-week-signals.mjs), so both read
// an article exactly the same way.
//
// 2026-10-03: block ends (headings, paragraphs, list items) become line breaks so a
// pick box like "Erickson's Pick: Colts -3.5" stays its own line for the pick parser;
// numeric entities (&#8217; &#8211;) are decoded; default cap 200,000 chars.

export const BODY_MAX_CHARS = 200_000;

export function htmlToBodyText(html = '') {
  return String(html)
    .replace(/<(script|style|nav|header|footer|aside|noscript|svg|form)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|section|article)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&(?:rsquo|lsquo|#39|#x27);/g, "'")
    .replace(/&(?:ldquo|rdquo|quot);/g, '"')
    .replace(/&(?:ndash|mdash);/g, '-')
    .replace(/&#(\d{2,5});/g, (m, n) => { const c = Number(n); return c === 8217 || c === 8216 ? "'" : c === 8220 || c === 8221 ? '"' : c === 8211 || c === 8212 ? '-' : String.fromCharCode(c); })
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n\s*/g, '\n')
    .trim();
}

/** Fetch an article and return its text (null on failure). */
export async function fetchArticleBody(url, maxChars = BODY_MAX_CHARS, { timeoutMs = 8_000 } = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlatinumRoseBot/1.0)' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const text = htmlToBodyText(await res.text());
    if (text.length > maxChars) {
      console.warn(`   [warn] article body exceeds ${maxChars} chars — truncating ${text.length} -> ${maxChars} chars for ${url}`);
    }
    return text.slice(0, maxChars) || null;
  } catch {
    return null;
  }
}
