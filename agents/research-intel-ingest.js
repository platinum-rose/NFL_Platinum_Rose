import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { planRevisions } from './lib/intel-revisions.js';
import { isCollegeFootballItem } from './lib/college-football-filter.js';
import { extractAnalyticalSignals } from './lib/analytical-picks.js';

const execFileAsync = promisify(execFile);
// 2026-09-01: Action Network's feed sits behind CloudFront and started
// silently 403'ing Node's native fetch()/undici specifically -- confirmed
// live that curl (same network, same day) gets a clean 200 with real XML
// while node fetch() gets a 202 + empty text/html body for the identical
// URL/UA. This is a TLS/HTTP client fingerprint block, not a UA-string
// check (changing the UA string alone did not help). Shelling out to the
// system curl binary (present on ubuntu-latest GitHub Actions runners by
// default) sidesteps it. See docs/NFL_AUDIT_BACKLOG.md B-actionnetwork-feed-403.
async function fetchViaCurl(feed) {
  const maxBytes = feed.maxBytes ?? MAX_FEED_BYTES;
  // 2026-09-02: feed.curlUA lets a feed override (or, with `null`, omit
  // entirely) the browser UA below. Added for ESPN NFL's site.api.espn.com
  // endpoint, whose Akamai WAF is fingerprinting the OPPOSITE way from
  // Action Network/THE WINDOW's CloudFront block: a browser-looking UA gets
  // a reliable 403 there, while curl's own bare default UA gets a reliable
  // 200. See the ESPN NFL feed entry below for the confirmed test results.
  const ua = feed.curlUA === null
    ? null
    : (feed.curlUA ?? ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'));
  const tmpFile = path.join(os.tmpdir(), `feed-${randomUUID()}.body`);
  try {
    const { stdout } = await execFileAsync('curl', [
      '-sS',
      '-o', tmpFile,
      '-w', '%{http_code} %{content_type}',
      ...(ua ? ['-A', ua] : []),
      '--max-time', '30',
      '--max-filesize', String(maxBytes),
      feed.url,
    ], { timeout: 35000 });

    const [statusStr, ...ctypeParts] = stdout.trim().split(' ');
    const httpStatus = Number(statusStr) || 0;
    const contentType = ctypeParts.join(' ').trim();

    let body = '';
    try {
      body = await (await import('node:fs/promises')).readFile(tmpFile, 'utf8');
    } catch { /* no body written (e.g. non-2xx with empty response) */ }

    return { httpStatus, contentType, body, error: null };
  } catch (err) {
    // curl exit 63 = --max-filesize exceeded
    if (err.code === 63) {
      return { httpStatus: null, contentType: '', body: '', error: `curl: payload exceeds ${maxBytes} bytes` };
    }
    return { httpStatus: null, contentType: '', body: '', error: err.message };
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const HOURS = Number(process.env.INTEL_LOOKBACK_HOURS || 72);
const LIMIT_PER_FEED = Number(process.env.INTEL_LIMIT_PER_FEED || 20);
const MAX_FEED_BYTES = Number(process.env.INTEL_MAX_FEED_BYTES || 2_000_000);
// 2026-09-01: feed-outage alerting (B-actionnetwork-feed-403's general fix)
// — see checkFeedHealthAndAlert() below. Alerts after this many consecutive
// failed checks for a given feed (job runs twice daily by default, so 2 ==
// roughly a day down) rather than on the first blip, to avoid noise from a
// single transient network hiccup while still catching a real outage fast.
const FEED_HEALTH_ALERT_THRESHOLD = Number(process.env.FEED_HEALTH_ALERT_THRESHOLD || 2);
const GMAIL_ADDR = process.env.GMAIL_ADDRESS;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const ALERT_TO_EMAIL = process.env.TO_EMAIL || 'andrewlrose@hotmail.com';
// F-11 Ph.2: fetch full article body after insert (disabled by default offseason)
const FETCH_BODY = process.env.INTEL_FETCH_BODY === 'true';
// 2026-08-13: was 4_000 — this is the confirmed root cause of the
// "suspected_ingest_cap" truncation pattern flagged in
// data/research-intel/review/article-intel-review-latest.json (181 of 292
// records clustered in a 3,900-4,573-char band, which is this constant, not
// natural article-length variance). research_intel_notes.body is a plain
// Postgres `text` column (migration 011_research_intel_fts.sql) with no
// length limit, so raising this needs no schema change. See
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §4.
// 2026-10-03 (Andy): was 20_000 -- 33 Week 4 notes were cut off at exactly 20,000 chars and
// 78 archived articles run longer (Abrams' primer, VSiN best-bets columns, BettingPros
// slate primers). Raised to 200_000; the body column has no limit and the FTS tsvector
// stays far under its 1 MB cap at this size. Full text is also archived locally by
// scripts/intel/archive_week_articles.mjs.
const BODY_MAX_CHARS = 200_000;
// Max explicit picks taken from one article body (teaser/RSS text keeps the old 3).
const BODY_MAX_EXPLICIT = 60;   // max picks kept from one article body (16 games x side + total, plus MLs)
// 2026-09-19: the local 30-min scheduled sweep (research-intel-cron.js) ran without
// INTEL_FETCH_BODY, won the insert race, and the GitHub runs that do fetch bodies then
// saw nothing "new" -- so most notes stayed title/teaser-only (ESPN 171/171, Action
// Network 22/22, BettingPros 29/40 in the last 4 days). Each run now also backfills
// bodies for up to this many recent body-less notes from these feeds.
const BODY_BACKFILL_LIMIT = Number(process.env.INTEL_BODY_BACKFILL_LIMIT || 20);

const FEEDS = [
  // ── Betting / sharp-money sources ─────────────────────────────────────────
  {
    // NFL-specific feed — all articles are already NFL content, so the
    // looksNflRelevant filter passes everything through cleanly.
    // 2026-09-01: fetchMethod:'curl' — see fetchViaCurl() above. CloudFront
    // blocks Node's native fetch() for this URL specifically (confirmed via
    // side-by-side curl-vs-fetch test, same day, same network); curl is not
    // blocked. Remove this flag if Action Network's CloudFront config ever
    // stops discriminating against Node's client fingerprint.
    source: 'Action Network',
    // 2026-09-23: AN rewrites the Betting Primer / Live QB Rankings / TD Machine
    // in place each week under a fixed URL -- store newer pubDates as revisions
    // (agents/lib/intel-revisions.js). Opt-in per feed: other feeds republish
    // hub/tool pages daily and would duplicate every day.
    trackRevisions: true,
    // 2026-09-02: switched to routing through the r.jina.ai reader proxy
    // (prefix + original URL). The direct-curl fix above stopped working
    // from GitHub Actions specifically -- confirmed via two consecutive
    // live workflow_dispatch runs, both still getting the CloudFront
    // challenge page (text/html) even with fetchMethod:'curl' -- while the
    // exact same curl command succeeds reliably from other networks. That
    // points to an IP-reputation block on GitHub-hosted runner ranges,
    // not the Node-vs-curl client fingerprint the original fix targeted.
    // r.jina.ai fetches server-side from its own (non-CI) IPs and returns
    // the page as text -- for this RSS URL specifically, the actual
    // <rss>/<item>/<title>/<link> XML survives intact inside that text
    // response (verified live), so the existing regex-based
    // parseRssItems() still parses it unchanged. Response content-type is
    // always text/plain from the proxy, never xml/rss/atom -- see
    // bodyOnlyFeedCheck below, which skips the content-type gate for this
    // feed and relies solely on the <rss|<feed|<rdf:RDF> body-content
    // check that already guards every feed.
    url: 'https://r.jina.ai/https://www.actionnetwork.com/nfl/feed',
    confidence: 0.74,
    source_type: 'betting',
    fetchMethod: 'curl',
    // r.jina.ai has its OWN Cloudflare bot-mitigation in front of it,
    // separate from Action Network's. A curl request that sends a
    // browser-like User-Agent (the fetchViaCurl default) trips r.jina.ai's
    // own challenge and gets back a 403 "cf-mitigated: challenge" HTML
    // page -- confirmed by direct side-by-side test, 2026-09-02: identical
    // request with -A <browser UA> => 403, identical request with no -A
    // flag at all => clean 200 with the real RSS body intact (12 items).
    // curlUA: null tells fetchViaCurl to omit the -A flag entirely.
    curlUA: null,
    bodyOnlyFeedCheck: true,
  },
  {
    // BettingPros: /nfl/news/feed/ returns HTML; /feed/ is valid RSS but
    // Can exceed 3MB in-season, so allow a higher per-feed limit while still
    // capping the payload.
    source: 'BettingPros',
    url: 'https://www.bettingpros.com/feed/',
    confidence: 0.72,
    maxBytes: 4_500_000,
    source_type: 'betting',
  },
  {
    source: 'Walter Football',
    url: 'https://walterfootball.com/rss.xml',
    // 2026-10-01: deprioritized per Andy. Walter moved all but ~2 picks a
    // week behind a paywall (WalterFootball Premium), which we won't buy.
    // Still ingested and parsed (agents/lib/analytical-picks.js handles his
    // free "Week N NFL Pick:" blocks), but at low confidence and without the
    // per-run body re-fetch.
    confidence: 0.5,
    source_type: 'analytical',
  },
  {
    // ESPN NFL: migrated 2026-09-02 from the www.espn.com RSS feed (blocked
    // by an AWS WAF JS challenge -- x-amzn-waf-action:challenge, confirmed
    // NOT curl-shellout-fixable, 0/5 success across two test batches) to
    // ESPN's own public site API, which returns JSON. That endpoint has the
    // OPPOSITE fingerprint block from Action Network/THE WINDOW: a
    // browser-looking UA gets a reliable 403 from its Akamai WAF, while
    // curl's own bare default UA gets a reliable 200 (8/8 in testing).
    // curlUA:null tells fetchViaCurl() to omit -A entirely.
    source: 'ESPN NFL',
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=25',
    confidence: 0.67,
    source_type: 'news',
    fetchMethod: 'curl',
    curlUA: null,
    format: 'json',
  },
  {
    source: 'VSiN',
    url: 'https://vsin.com/feed/',
    confidence: 0.71,
    source_type: 'betting',
  },

  // ── Analytical / editorial sources (F-17) ─────────────────────────────────
  {
    // Sharp Football Analysis: situational analytics, trends, team tendencies
    source: 'Sharp Football',
    url: 'https://www.sharpfootballanalysis.com/feed/',
    confidence: 0.69,
    source_type: 'analytical',
  },
  {
    // Pro Football Talk (NBC Sports): breaking news + coaching/roster analysis
    source: 'Pro Football Talk',
    url: 'https://profootballtalk.nbcsports.com/feed/',
    confidence: 0.66,
    source_type: 'analytical',
  },
  {
    // Pro Football Focus: grades, snap counts, advanced metrics
    source: 'PFF',
    url: 'https://www.pff.com/feed',
    nflOnly: true,
    confidence: 0.67,
    source_type: 'analytical',
  },
  {
    // Rotowire NFL: injuries, lineup news, depth-chart changes
    // Migrated from x-sharp-ingest (was RSS-backed account, not X content)
    source: 'Rotowire NFL',
    url: 'https://www.rotowire.com/rss/news.php?sport=NFL',
    // 2026-09-26: every Rotowire <link> is the PLAYER page, not the news
    // item, so url_hash dedupe silently dropped every update for any player
    // who already had a note (e.g. Caleb Williams ruled out for MNF). Key
    // dedupe on the per-item <guid> (nfl639290...) instead.
    itemKey: 'guid',
    nflOnly: true,
    confidence: 0.65,
    source_type: 'analytical',
  },
];

const NFL_KEYWORDS = [
  // In-season betting terms
  ' nfl ',
  ' national football league ',
  ' super bowl ',
  ' afc ',
  ' nfc ',
  ' touchdown ',
  ' quarterback ',
  ' qb ',
  ' week ',
  ' spread ',
  ' moneyline ',
  ' over/under ',
  ' over under ',
  ' prop ',
  ' betting ',
  ' odds ',
  ' playoffs ',
  ' wild card ',
  ' divisional round ',
  ' conference championship ',
  // Offseason terms (draft, FA, training camp)
  ' nfl draft ',
  ' draft pick ',
  ' draft class ',
  ' nfl combine ',
  ' free agent ',
  ' free agency ',
  ' training camp ',
  ' ota ',
  ' minicamp ',
  ' depth chart ',
  ' nfl roster ',
  ' waiver ',
  ' nfl trade ',
  ' preseason ',
  ' nfl 2026 ',
  ' nfl season ',
  ' head coach ',
  ' offensive coordinator ',
  ' defensive coordinator ',
];

const NON_NFL_HINTS = [
  ' nba ',
  ' mlb ',
  ' nhl ',
  ' wnba ',
  ' ncaa basketball ',
  ' march madness ',
  ' ufc ',
  ' golf ',
  ' pga ',
  ' rocket classic ',
  ' tbt ',
  ' the basketball tournament ',
  ' tennis ',
  ' soccer ',
  ' premier league ',
  ' champions league ',
  ' f1 ',
  ' formula 1 ',
  ' nascar ',
];

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function cleanHtml(input = '') {
  return String(input)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
// F-11 Ph.2: Fetch + strip article body (text only, capped at BODY_MAX_CHARS)
async function fetchArticleBody(url, maxChars = BODY_MAX_CHARS) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlatinumRoseBot/1.0)' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip scripts, styles, nav, header, footer to reduce noise. Block ends (headings, paragraphs,
    // list items) become line breaks (2026-10-03) so a pick box like "Erickson's Pick: Colts -3.5"
    // stays its own line for the pick parser instead of running into the next section.
    const stripped = html
      .replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .replace(/ *\n[\s]*/g, '\n')
      .trim();
    if (stripped.length > maxChars) {
      console.warn(`   [warn] article body exceeds ${maxChars} chars — truncating ${stripped.length} -> ${maxChars} chars for ${url}`);
    }
    return stripped.slice(0, maxChars) || null;
  } catch {
    return null;
  }
}
function firstTag(xml, tagName) {
  const open = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, 'i');
  const close = new RegExp(`</${tagName}>`, 'i');
  const mOpen = xml.match(open);
  if (!mOpen) return null;

  const start = mOpen.index + mOpen[0].length;
  const mClose = xml.slice(start).match(close);
  if (!mClose) return null;

  return cleanHtml(xml.slice(start, start + mClose.index));
}

// Parse author byline from an RSS item chunk.
// Priority: dc:creator → author → itunes:author (managingEditor is channel-level, skip).
function parseItemAuthor(chunk) {
  const raw =
    firstTag(chunk, 'dc:creator') ||
    firstTag(chunk, 'author') ||
    firstTag(chunk, 'itunes:author') ||
    null;
  if (!raw) return null;
  // Strip email addresses (some feeds use "email (Name)" format)
  const cleaned = raw.replace(/[^\s]+@[^\s]+/g, '').replace(/[()]/g, '').trim();
  return cleaned || null;
}

function parseRssItems(xml) {
  return xml
    .split(/<item[\s>]/i)
    .slice(1)
    .map(chunk => {
      const title = firstTag(chunk, 'title');
      const link = firstTag(chunk, 'link');
      const guid = firstTag(chunk, 'guid');
      const description = firstTag(chunk, 'description');
      const pubDateRaw = firstTag(chunk, 'pubDate');
      const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;
      const author = parseItemAuthor(chunk);

      return {
        title: title || '(untitled)',
        link: link || guid,
        guid: guid || null,
        description: description || '',
        published_at: publishedAt,
        author,
      };
    })
    .filter(item => !!item.link);
}

// F-17: Atom feed parser (e.g. The Ringer, Bleacher Report).
// Atom uses <entry> elements and self-closing <link rel="alternate" href="…"/>.
function parseAtomItems(xml) {
  return xml
    .split(/<entry[\s>]/i)
    .slice(1)
    .map(chunk => {
      const title = firstTag(chunk, 'title');

      // Atom <link> is self-closing: <link rel="alternate" href="…" />
      const linkMatch = chunk.match(
        /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i
      ) || chunk.match(
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["']/i
      ) || chunk.match(
        // Fallback: any <link href="…"> when rel is absent
        /<link[^>]+href=["']([^"']+)["']/i
      );
      const link = linkMatch ? linkMatch[1] : firstTag(chunk, 'id');

      const summary = firstTag(chunk, 'summary') || firstTag(chunk, 'content') || '';
      const dateRaw = firstTag(chunk, 'published') || firstTag(chunk, 'updated');
      const publishedAt = dateRaw ? new Date(dateRaw).toISOString() : null;
      // Atom: <author><name>First Last</name></author>
      const authorChunk = firstTag(chunk, 'author') || '';
      const authorName = firstTag(authorChunk, 'name') || cleanHtml(authorChunk) || null;

      return {
        title: title || '(untitled)',
        link,
        description: cleanHtml(summary),
        published_at: publishedAt,
        author: authorName || null,
      };
    })
    .filter(item => !!item.link);
}

// 2026-09-02: ESPN NFL migrated from RSS (www.espn.com/espn/rss/nfl/news,
// blocked by an AWS WAF JS challenge -- see docs/NFL_AUDIT_BACKLOG.md
// B-espn-waf-challenge) to ESPN's own public site API, which returns JSON,
// not XML/Atom. Maps the same shape parseRssItems()/parseAtomItems() return
// so nothing downstream (extractSignals, dedupe, insert) needs to change.
function parseEspnApiItems(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }
  const articles = Array.isArray(parsed?.articles) ? parsed.articles : [];
  return articles
    .map(a => {
      const link = a?.links?.web?.href || a?.links?.mobile?.href || null;
      const publishedAt = a?.published ? new Date(a.published).toISOString() : null;
      return {
        title: a?.headline || '(untitled)',
        link,
        description: a?.description || '',
        published_at: publishedAt,
        author: a?.byline || null,
      };
    })
    .filter(item => !!item.link);
}

function canonicalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    const allowed = new URLSearchParams();
    for (const [k, v] of u.searchParams.entries()) {
      const key = k.toLowerCase();
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'gclid') {
        continue;
      }
      allowed.append(k, v);
    }
    u.search = allowed.toString();
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function classifyBetType(text) {
  const t = text.toLowerCase();
  if (/\bover\b|\bunder\b/.test(t)) return 'total';
  if (/\+\d+(\.\d+)?|-\d+(\.\d+)?/.test(t)) return 'spread';
  if (/moneyline|\bml\b/.test(t)) return 'moneyline';
  if (/mvp|coach of the year|rookie|division|conference|super bowl/.test(t)) return 'futures';
  return 'other';
}

function normalizeForMatch(value = '') {
  return ` ${String(value).toLowerCase().replace(/\s+/g, ' ').trim()} `;
}

function looksNflRelevant(item, source = '', options = {}) {
  // 2026-09-23: BettingPros/VSiN mix college football into the same feed, and
  // the "football" escape hatch below let CFB titles through. Reject first.
  if (isCollegeFootballItem(item)) return false;

  // 2026-09-26: NFL-only feeds (PFF, Rotowire NFL) skip the keyword gate --
  // it dropped real NFL items with no generic football word in them, e.g.
  // PFF "The Packers' offensive line has been a catastrophic problem..."
  // and "PFF Protection Tracker". CFB is still rejected above.
  if (options.nflOnly) return true;

  const titleHaystack = normalizeForMatch([source, item.title].join(' '));
  const fullHaystack = normalizeForMatch([
    source,
    item.title,
    item.description,
    item.link,
  ].join(' '));

  const hasNfl = NFL_KEYWORDS.some(k => fullHaystack.includes(k));
  if (!hasNfl) return false;

  // Only apply non-NFL block to the title — descriptions can have cross-sport
  // sidebar links that would otherwise kill valid NFL articles.
  const titleHasNonNfl = NON_NFL_HINTS.some(k => titleHaystack.includes(k));
  if (titleHasNonNfl && !/\b(nfl|football|super bowl|afc|nfc)\b/i.test(titleHaystack)) return false;

  // Generic betting/picks language in an all-sports feed is not NFL evidence.
  // Require an actual football term in the item metadata before ingesting.
  if (!/\b(nfl|football|super bowl|afc|nfc|quarterback|qb|touchdown|playoff|division|training camp|preseason)\b/i.test(fullHaystack)) {
    return false;
  }

  return !titleHasNonNfl;
}

// NFL-DASHBOARD-BUG-5 (2026-08-23): factored out of extractSignals() so the
// same explicit-pick regex can run against either the short RSS title+
// description (what extractSignals() below has always used) OR the full
// article body fetched by fetchArticleBody() (see the F-11 Ph.2 backfill
// loop in main() — that step was fetching and storing the full body but
// NEVER re-running pick extraction against it, so an explicit pick stated
// only in an article's body text, and not repeated in its RSS teaser, was
// silently never captured as a research_pick_signals row).
function extractSignalsFromText(text, { source, baseConfidence, eventRef, fallbackLabel, fallbackRationale, maxExplicit = 3 }) {
  const clean = String(text || '').trim();
  const lower = clean.toLowerCase();
  const signals = [];

  const allMatches = clean.match(/\b[A-Z][A-Za-z .&'-]{2,30}\s(?:\+|-)\d+(?:\.\d+)?\b|\b(?:Over|Under)\s\d+(?:\.\d+)?\b/g) || [];
  // Long bodies repeat the same line many times (headline, pick box, recap): keep each lean once.
  const seenLean = new Set();
  const spreadOrTotalMatches = allMatches.filter((m) => {
    const k = m.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seenLean.has(k)) return false; seenLean.add(k); return true;
  });
  for (const m of spreadOrTotalMatches.slice(0, maxExplicit)) {
    signals.push({
      source,
      team_or_market: m,
      bet_type: classifyBetType(m),
      lean: m,
      rationale: fallbackLabel,
      event_ref: eventRef,
      confidence: Number((baseConfidence - 0.08).toFixed(3)),
    });
  }

  if (signals.length === 0 && fallbackLabel && /pick|best bet|lean|prediction|odds/i.test(lower)) {
    signals.push({
      source,
      team_or_market: fallbackLabel,
      bet_type: classifyBetType(clean),
      lean: fallbackLabel,
      rationale: fallbackRationale,
      event_ref: eventRef,
      confidence: Number((baseConfidence - 0.12).toFixed(3)),
    });
  }

  return signals;
}

function extractSignals(item, source, baseConfidence) {
  return extractSignalsFromText(`${item.title} ${item.description}`, {
    source,
    baseConfidence,
    eventRef: item.link,
    fallbackLabel: item.title,
    fallbackRationale: item.description.slice(0, 220),
  });
}

// Body-text pick extraction. 2026-10-03 (Andy): every feed's article BODY now goes through the
// pick-language-gated parser in agents/lib/analytical-picks.js. The old open regex
// (extractSignalsFromText) took any "Team +3" in the text, so on full bodies it kept quoted lines
// that are not picks ("The advance line was Colts -4.5", odds tables, last week's results):
// on the Week 4 corpus it produced 134 lines for 66 known picks. The gated parser needs a pick cue
// nearby ("Pick:", "Best Bet:", "I'll take", "give me"). Betting feeds skip the predicted-score
// parser (their previews quote past results). RSS teasers (title + description) keep the old
// extractor (extractSignals below), which is short text where the open regex is fine.
// A picks column ("Wes Reynolds: NFL Week 4 Best Bets") states each pick as its own heading line.
const PICK_COLUMN_TITLE = /best bets?|picks|predictions|takes\b|plays\b|leans\b/i;
function bodySignalsFor({ source, sourceType, confidence, url, title, body }) {
  return extractAnalyticalSignals(body, {
    source,
    baseConfidence: confidence,
    eventRef: url,
    max: BODY_MAX_EXPLICIT,
    scores: sourceType === 'analytical',
    pickColumn: PICK_COLUMN_TITLE.test(title || ''),
    // "Week 4" in the title: sections about other weeks (last week's results) are skipped.
    week: Number((String(title || '').match(/\bweek (\d{1,2})\b/i) || [])[1]) || null,
  });
}

function maxBodyCharsFor(source) {
  return FEEDS.find((f) => f.source === source)?.maxBodyChars || BODY_MAX_CHARS;
}

async function fetchFeed(feed) {
  try {
    let httpStatus, contentType, xml;

    if (feed.fetchMethod === 'curl') {
      const curlResult = await fetchViaCurl(feed);
      if (curlResult.error) {
        return { source: feed.source, status: 'error', reason: curlResult.error, items: [] };
      }
      httpStatus = curlResult.httpStatus;
      contentType = String(curlResult.contentType || '').toLowerCase();
      xml = curlResult.body;
      if (!(httpStatus >= 200 && httpStatus < 300)) {
        return { source: feed.source, status: 'unavailable', reason: `HTTP ${httpStatus}`, items: [] };
      }
    } else {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'NFL-Platinum-Rose-ResearchIntel/1.0' },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        return {
          source: feed.source,
          status: 'unavailable',
          reason: `HTTP ${res.status}`,
          items: [],
        };
      }

      contentType = String(res.headers.get('content-type') || '').toLowerCase();

      const reader = res.body?.getReader();
      if (!reader) {
        return {
          source: feed.source,
          status: 'error',
          reason: 'Response stream unavailable',
          items: [],
        };
      }

      const chunks = [];
      let totalBytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > (feed.maxBytes ?? MAX_FEED_BYTES)) {
          await reader.cancel('Feed exceeds configured size limit');
          return {
            source: feed.source,
            status: 'error',
            reason: `Feed payload too large (> ${feed.maxBytes ?? MAX_FEED_BYTES} bytes)`,
            items: [],
          };
        }
        chunks.push(value);
      }

      xml = new TextDecoder().decode(
        chunks.length === 1 ? chunks[0] : (() => {
          const merged = new Uint8Array(totalBytes);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return merged;
        })()
      );
    }

    // 2026-09-02: JSON feeds (currently just ESPN NFL's site API -- see
    // parseEspnApiItems() above) skip the XML/content-type checks below
    // entirely; the format:'json' flag on the feed config is authoritative.
    if (feed.format === 'json') {
      const parsedJson = parseEspnApiItems(xml);
      if (!parsedJson.length) {
        return {
          source: feed.source,
          status: 'unavailable',
          reason: 'Response is not a parseable JSON article list',
          items: [],
        };
      }
      return {
        source: feed.source,
        status: 'available',
        reason: null,
        items: parsedJson,
      };
    }

    // 2026-09-02: bodyOnlyFeedCheck (currently just Action Network, routed
    // through the r.jina.ai reader proxy -- see the FEEDS entry above)
    // skips the content-type gate entirely, since that proxy always
    // reports text/plain regardless of the source content type. The
    // <rss|<feed|<rdf:RDF body-content check right below still applies
    // and is what actually guards against a non-feed response.
    const looksLikeFeed =
      feed.bodyOnlyFeedCheck === true ||
      contentType.includes('xml') ||
      contentType.includes('rss') ||
      contentType.includes('atom');

    if (!looksLikeFeed) {
      return {
        source: feed.source,
        status: 'unavailable',
        reason: `Unsupported content-type: ${contentType || 'unknown'}`,
        items: [],
      };
    }

    if (!/<rss|<feed|<rdf:RDF/i.test(xml)) {
      return {
        source: feed.source,
        status: 'unavailable',
        reason: 'Response is not a parseable RSS/Atom feed',
        items: [],
      };
    }
    // F-17: use Atom parser when feed declares format:'atom' or when the
    // XML root element is <feed> (Atom) rather than <rss> or <rdf:RDF>.
    const isAtom = feed.format === 'atom' || /^\s*<feed[\s>]/i.test(xml);
    const parsed = isAtom ? parseAtomItems(xml) : parseRssItems(xml);

    return {
      source: feed.source,
      status: 'available',
      reason: null,
      items: parsed,
    };
  } catch (err) {
    return {
      source: feed.source,
      status: 'error',
      reason: err.message,
      items: [],
    };
  }
}

async function writeReceipt(payload) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `research-intel-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

async function ensureResearchTables(supabase) {
  const { error: notesError } = await supabase
    .from('research_intel_notes')
    .select('id')
    .limit(1);

  if (notesError) {
    const msg = String(notesError.message || 'unknown error');
    if (msg.includes("Could not find the table 'public.research_intel_notes'")) {
      throw new Error(
        'Missing table research_intel_notes. Apply migration 009_research_intel.sql, then rerun ingest.'
      );
    }
    throw new Error(`research_intel_notes check failed: ${msg}`);
  }

  const { error: signalsError } = await supabase
    .from('research_pick_signals')
    .select('id')
    .limit(1);

  if (signalsError) {
    const msg = String(signalsError.message || 'unknown error');
    if (msg.includes("Could not find the table 'public.research_pick_signals'")) {
      throw new Error(
        'Missing table research_pick_signals. Apply migration 009_research_intel.sql, then rerun ingest.'
      );
    }
    throw new Error(`research_pick_signals check failed: ${msg}`);
  }
}

// ── Feed-outage alerting (general fix for B-actionnetwork-feed-403) ──────────
// A dead/blocked feed used to just quietly return `status: 'unavailable'` or
// `'error'` from fetchFeed() with nothing downstream ever looking at it --
// exactly how Action Network's feed sat broken for 6+ days unnoticed. This
// tracks per-feed consecutive-failure streaks in Supabase (migration
// 051_feed_health.sql) across runs and emails once when a feed crosses
// FEED_HEALTH_ALERT_THRESHOLD consecutive failed checks, and once more when
// it recovers -- not on every run, so a multi-day outage doesn't spam the
// inbox twice a day.
async function sendFeedHealthEmail(subject, text, html) {
  if (!GMAIL_ADDR || !GMAIL_PASS) {
    console.warn('  [feed-health] GMAIL_ADDRESS/GMAIL_APP_PASSWORD not set — skipping alert email');
    return null;
  }
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: GMAIL_ADDR, pass: GMAIL_PASS },
  });
  const info = await transport.sendMail({
    from: `"NFL Dashboard" <${GMAIL_ADDR}>`,
    to: ALERT_TO_EMAIL,
    subject,
    text,
    html,
  });
  return info.messageId;
}

async function checkFeedHealthAndAlert(supabase, feedResults) {
  const nowIso = new Date().toISOString();
  const newlyDown = [];
  const recovered = [];
  let anyStillDown = false;

  for (const fr of feedResults) {
    const { data: existing, error: readErr } = await supabase
      .from('feed_health')
      .select('*')
      .eq('source', fr.source)
      .maybeSingle();
    if (readErr) {
      console.warn(`  [feed-health] read failed for ${fr.source}: ${readErr.message}`);
      continue;
    }

    const wasAlerting = !!existing?.alert_sent_at;
    const prevFailures = existing?.consecutive_failures ?? 0;
    const isFailure = fr.status !== 'available';

    let consecutiveFailures = isFailure ? prevFailures + 1 : 0;
    let alertSentAt = existing?.alert_sent_at ?? null;
    let lastSuccessAt = existing?.last_success_at ?? null;

    if (isFailure) {
      if (consecutiveFailures >= FEED_HEALTH_ALERT_THRESHOLD) {
        anyStillDown = true;
        if (!wasAlerting) {
          newlyDown.push({
            source: fr.source,
            reason: fr.reason,
            consecutive_failures: consecutiveFailures,
            last_success_at: lastSuccessAt,
          });
          alertSentAt = nowIso;
        }
      }
    } else {
      lastSuccessAt = nowIso;
      if (wasAlerting) {
        recovered.push({ source: fr.source, down_since: existing.last_success_at });
      }
      alertSentAt = null;
    }

    const { error: upsertErr } = await supabase.from('feed_health').upsert({
      source: fr.source,
      last_status: fr.status,
      last_reason: fr.reason,
      consecutive_failures: consecutiveFailures,
      last_success_at: lastSuccessAt,
      last_checked_at: nowIso,
      alert_sent_at: alertSentAt,
      updated_at: nowIso,
    });
    if (upsertErr) {
      console.warn(`  [feed-health] upsert failed for ${fr.source}: ${upsertErr.message}`);
    }
  }

  if (newlyDown.length || recovered.length) {
    const sections = [];
    if (newlyDown.length) {
      sections.push(
        `DOWN (${newlyDown.length}):\n` +
        newlyDown.map((d) =>
          `  - ${d.source}: ${d.reason}` +
          ` (${d.consecutive_failures} consecutive failed checks` +
          `${d.last_success_at ? `, last succeeded ${d.last_success_at}` : ', no prior success on record'})`
        ).join('\n')
      );
    }
    if (recovered.length) {
      sections.push(
        `RECOVERED (${recovered.length}):\n` +
        recovered.map((r) => `  - ${r.source}`).join('\n')
      );
    }

    const subject = newlyDown.length
      ? `⚠️ NFL Dashboard: ${newlyDown.length} research-intel feed(s) down — ${newlyDown.map((d) => d.source).join(', ')}`
      : `✅ NFL Dashboard: research-intel feed(s) recovered — ${recovered.map((r) => r.source).join(', ')}`;

    const text =
      `research-intel-ingest.js feed health check (${nowIso})\n\n` +
      sections.join('\n\n') +
      `\n\nAlerts fire after ${FEED_HEALTH_ALERT_THRESHOLD}+ consecutive failed checks ` +
      `(this job runs twice daily), and again once a feed recovers -- not every run. ` +
      `See TASK_BOARD.md's B-actionnetwork-feed-403 entry for background.`;
    const html = `<pre style="font-family:monospace;white-space:pre-wrap">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;

    if (DRY_RUN) {
      console.log(`  [feed-health] dry run — would send: ${subject}`);
    } else {
      try {
        const msgId = await sendFeedHealthEmail(subject, text, html);
        if (msgId) console.log(`  [feed-health] alert sent: ${subject} (msgId=${msgId})`);
      } catch (err) {
        console.warn(`  [feed-health] alert email failed (non-fatal): ${err.message}`);
      }
    }
  }

  return { anyStillDown, newlyDown, recovered };
}

async function main() {
  const startedAt = new Date().toISOString();
  const cutoff = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString();

  console.log('ResearchIntelIngestAgent start');
  console.log(`  dryRun=${DRY_RUN} feeds=${FEEDS.length} lookbackHours=${HOURS}`);

  const feedResults = [];
  const candidateNotes = [];
  const candidateSignals = [];

  for (const feed of FEEDS) {
    const result = await fetchFeed(feed);
    const recentItems = result.items
      .filter(item => !item.published_at || item.published_at >= cutoff)
      .slice(0, LIMIT_PER_FEED);

    const feedItems = recentItems.filter(item => looksNflRelevant(item, feed.source, { nflOnly: feed.nflOnly === true }));

    const notes = feedItems.map(item => {
      const canonical = canonicalizeUrl(item.link);
      const summary = item.description.slice(0, 800);
      return {
        source: feed.source,
        source_type: feed.source_type ?? 'article',
        url: item.link,
        canonical_url: canonical,
        url_hash: sha256(feed.itemKey === 'guid' && item.guid ? `${canonical}#guid=${item.guid}` : canonical),
        content_hash: sha256(`${item.title}|${summary}`),
        title: item.title,
        summary,
        published_at: item.published_at,
        confidence: feed.confidence,
        author: item.author || null,
      };
    });

    // Analytical sources (2026-10-01): no longer skipped. Their articles go
    // through extractAnalyticalSignals() -- source-specific parsers, predicted
    // scores, and pick-language-gated lines, with no title-as-pick fallback --
    // instead of the betting-feed extractor (see agents/lib/analytical-picks.js).
    const signals = feed.source_type === 'analytical'
      ? feedItems.flatMap(item =>
          extractAnalyticalSignals(`${item.title}. ${item.description}`, {
            source: feed.source, baseConfidence: feed.confidence, eventRef: item.link,
          }).map(s => ({ ...s, author: item.author || null }))
        )
      : feedItems.flatMap(item =>
          extractSignals(item, feed.source, feed.confidence).map(s => ({ ...s, author: item.author || null }))
        );

    feedResults.push({
      source: feed.source,
      url: feed.url,
      status: result.status,
      reason: result.reason,
      fetched_items: result.items.length,
      recent_items: recentItems.length,
      nfl_items: feedItems.length,
      candidate_notes: notes.length,
      candidate_signals: signals.length,
    });

    candidateNotes.push(...notes);
    candidateSignals.push(...signals);
  }

  if (DRY_RUN || !SUPABASE_URL || !SUPABASE_KEY) {
    const receiptPath = await writeReceipt({
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      dry_run: true,
      lookback_hours: HOURS,
      feeds: feedResults,
      totals: {
        candidate_notes: candidateNotes.length,
        candidate_signals: candidateSignals.length,
      },
    });

    console.log(`  Candidate notes: ${candidateNotes.length}`);
    console.log(`  Candidate signals: ${candidateSignals.length}`);
    console.log(`  Receipt: ${receiptPath}`);
    return;
  }

  const supabase = getSupabase();
  await ensureResearchTables(supabase);

  let feedHealth = { anyStillDown: false };
  try {
    feedHealth = await checkFeedHealthAndAlert(supabase, feedResults);
  } catch (err) {
    console.warn(`  [feed-health] check failed (non-fatal): ${err.message}`);
  }

  const uniqueNotes = Array.from(
    new Map(candidateNotes.map(n => [n.url_hash, n])).values()
  );

  let existingHashes = new Set();
  const storedPublishedByHash = new Map();
  if (uniqueNotes.length > 0) {
    const { data, error } = await supabase
      .from('research_intel_notes')
      .select('url_hash,published_at')
      .in('url_hash', uniqueNotes.map(n => n.url_hash));

    if (error) throw new Error(`Lookup failed: ${error.message}`);
    existingHashes = new Set((data || []).map(d => d.url_hash));
    for (const d of data || []) storedPublishedByHash.set(d.url_hash, d.published_at);
  }

  // 2026-09-23: evergreen pages rewritten in place under a fixed URL (Action
  // Network primer / QB rankings / TD Machine) come back with a newer pubDate;
  // store those as revision rows instead of skipping them (agents/lib/intel-revisions.js).
  const revisionSources = new Set(FEEDS.filter(f => f.trackRevisions).map(f => f.source));
  const { revisions: revisionCandidates, revisionHashByBase } = planRevisions(
    uniqueNotes.filter(n => existingHashes.has(n.url_hash) && revisionSources.has(n.source)),
    storedPublishedByHash,
    sha256
  );
  let revisionNotes = [];
  if (revisionCandidates.length > 0) {
    const { data, error } = await supabase
      .from('research_intel_notes')
      .select('url_hash')
      .in('url_hash', revisionCandidates.map(n => n.url_hash));
    if (error) throw new Error(`Revision lookup failed: ${error.message}`);
    const storedRevisions = new Set((data || []).map(d => d.url_hash));
    revisionNotes = revisionCandidates.filter(n => !storedRevisions.has(n.url_hash));
    if (revisionNotes.length > 0) {
      console.log(`  Revised evergreen pages: ${revisionNotes.map(n => `${n.source}: ${n.title}`).join(' | ')}`);
    }
  }

  const newNotes = [
    ...uniqueNotes.filter(n => !existingHashes.has(n.url_hash)),
    ...revisionNotes,
  ];

  let insertedNotes = [];
  if (newNotes.length > 0) {
    const { data, error } = await supabase
      .from('research_intel_notes')
      .insert(newNotes)
      .select('id,url_hash,url');

    if (error) throw new Error(`Insert notes failed: ${error.message}`);
    insertedNotes = data || [];
  }

  // F-11 Ph.2: Back-fill article bodies for newly inserted notes
  // NFL-DASHBOARD-BUG-5 (2026-08-23): this loop used to only backfill the
  // display `body` column. It now ALSO re-runs pick extraction against that
  // full body text (extractSignalsFromText, factored out above) — a pick
  // stated deep in an article ("Eagles vs Patriots pick: Patriots +2.5
  // (-118)") is very often absent from the RSS title/description that
  // extractSignals() saw earlier in this run, so it was never captured
  // before. Results are pushed into candidateSignals so they flow through
  // the SAME note_id-resolution + insert path as teaser-derived signals
  // below — no other code needed to change.
  const noteMetaByHash = new Map(newNotes.map(n => [n.url_hash, n]));
  if (FETCH_BODY && insertedNotes.length > 0) {
    console.log(`  Fetching article bodies for ${insertedNotes.length} new notes…`);
    let bodiesFetched = 0;
    let bodySignalsAdded = 0;
    for (const note of insertedNotes) {
      const body = await fetchArticleBody(note.url, maxBodyCharsFor(noteMetaByHash.get(note.url_hash)?.source));
      if (!body) continue;
      // Update body — the tsvector trigger handles tsv column automatically
      const { error: bodyErr } = await supabase
        .from('research_intel_notes')
        .update({ body })
        .eq('id', note.id);
      if (bodyErr) {
        console.warn(`  [warn] Body update failed for note ${note.id}: ${bodyErr.message}`);
      } else {
        bodiesFetched++;
      }

      const meta = noteMetaByHash.get(note.url_hash);
      // Analytical sources are routed to the analytical parser (see bodySignalsFor).
      if (meta) {
        const bodySignals = bodySignalsFor({
          source: meta.source,
          sourceType: meta.source_type,
          confidence: meta.confidence,
          url: note.url,
          title: meta.title,
          body,
        });
        // Dedup against whatever the teaser pass already found for this
        // same note (matched by event_ref, since candidateSignals hasn't
        // been resolved to note_id yet at this point in main()).
        const seenKeys = new Set(
          candidateSignals
            .filter((s) => s.event_ref === note.url)
            .map((s) => `${String(s.team_or_market).toLowerCase().trim()}|${s.bet_type}`)
        );
        for (const bs of bodySignals) {
          const key = `${String(bs.team_or_market).toLowerCase().trim()}|${bs.bet_type}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          candidateSignals.push(bs);
          bodySignalsAdded++;
        }
      }

      // Polite delay between article fetches
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`  Bodies fetched: ${bodiesFetched}/${insertedNotes.length}`);
    console.log(`  Additional pick signals found in article bodies: ${bodySignalsAdded}`);
  }

  // Backfill: recent notes from these feeds that were stored without a body.
  // Body-derived signals for these carry note_id directly and are deduped against the
  // signals already stored for that note (teaser signals for pre-existing notes are
  // never re-inserted -- noteIdByHash below stays limited to this run's inserts).
  const backfillSignals = [];
  let backfilled = 0;
  if (FETCH_BODY && BODY_BACKFILL_LIMIT > 0) {
    const insertedIds = new Set(insertedNotes.map((n) => n.id));
    const since = new Date(Date.now() - HOURS * 3600 * 1000).toISOString();
    const { data: bodyless, error: bfErr } = await supabase
      .from('research_intel_notes')
      .select('id,url,source,source_type,confidence,title')
      .is('body', null)
      .gte('captured_at', since)
      .in('source', FEEDS.map((f) => f.source))
      .order('captured_at', { ascending: false })
      .limit(BODY_BACKFILL_LIMIT + insertedNotes.length);
    if (bfErr) {
      console.warn(`  [warn] Body backfill lookup failed: ${bfErr.message}`);
    } else {
      const targets = (bodyless || []).filter((n) => !insertedIds.has(n.id)).slice(0, BODY_BACKFILL_LIMIT);
      if (targets.length > 0) {
        console.log(`  Backfilling article bodies for ${targets.length} earlier notes…`);
        const { data: priorSigs } = await supabase
          .from('research_pick_signals')
          .select('note_id,team_or_market,bet_type')
          .in('note_id', targets.map((n) => n.id));
        const seen = new Set((priorSigs || []).map((s) => `${s.note_id}|${String(s.team_or_market).toLowerCase().trim()}|${s.bet_type}`));
        for (const note of targets) {
          const body = await fetchArticleBody(note.url, maxBodyCharsFor(note.source));
          if (body) {
            const { error: upErr } = await supabase.from('research_intel_notes').update({ body }).eq('id', note.id);
            if (upErr) {
              console.warn(`  [warn] Body backfill failed for note ${note.id}: ${upErr.message}`);
            } else {
              backfilled++;
              {
                const sigs = bodySignalsFor({
                  source: note.source,
                  sourceType: note.source_type,
                  confidence: note.confidence,
                  url: note.url,
                  title: note.title,
                  body,
                });
                for (const bs of sigs) {
                  const key = `${note.id}|${String(bs.team_or_market).toLowerCase().trim()}|${bs.bet_type}`;
                  if (seen.has(key)) continue;
                  seen.add(key);
                  backfillSignals.push({
                    note_id: note.id,
                    source: bs.source,
                    author: bs.author || null,
                    team_or_market: bs.team_or_market,
                    bet_type: bs.bet_type,
                    lean: bs.lean,
                    rationale: bs.rationale,
                    event_ref: bs.event_ref,
                    confidence: bs.confidence,
                  });
                }
              }
            }
          }
          await new Promise((r) => setTimeout(r, 300));
        }
        console.log(`  Bodies backfilled: ${backfilled}/${targets.length} (+${backfillSignals.length} signals)`);
      }
    }
  }

  // Body refresh (2026-10-01): feeds whose articles keep changing after first
  // capture (Walter's weekly picks pages fill in "Week N NFL Pick:" blocks
  // Tue-Thu) are re-fetched every run for `refreshBodyDays`, the body is
  // updated when it changed, and signals are re-extracted -- deduped against
  // every signal already stored for that note, so nothing is double-counted.
  let bodiesRefreshed = 0;
  if (FETCH_BODY) {
    const insertedIds = new Set(insertedNotes.map((n) => n.id));
    for (const feed of FEEDS.filter((f) => f.refreshBodyDays > 0)) {
      const since = new Date(Date.now() - feed.refreshBodyDays * 86400 * 1000).toISOString();
      const { data: recent, error: rfErr } = await supabase
        .from('research_intel_notes')
        .select('id,url,source,source_type,confidence,title,body')
        .eq('source', feed.source)
        .gte('captured_at', since)
        .order('captured_at', { ascending: false })
        .limit(10);
      if (rfErr) { console.warn(`  [warn] Body refresh lookup failed for ${feed.source}: ${rfErr.message}`); continue; }
      const targets = (recent || []).filter((n) => !insertedIds.has(n.id));
      if (targets.length === 0) continue;
      const { data: priorSigs } = await supabase
        .from('research_pick_signals')
        .select('note_id,team_or_market,bet_type')
        .in('note_id', targets.map((n) => n.id));
      const seen = new Set((priorSigs || []).map((x) => `${x.note_id}|${String(x.team_or_market).toLowerCase().trim()}|${x.bet_type}`));
      for (const sig of backfillSignals) seen.add(`${sig.note_id}|${String(sig.team_or_market).toLowerCase().trim()}|${sig.bet_type}`);
      for (const note of targets) {
        const body = await fetchArticleBody(note.url, feed.maxBodyChars || BODY_MAX_CHARS);
        if (!body) continue;
        if (body !== note.body) {
          const { error: upErr } = await supabase.from('research_intel_notes').update({ body }).eq('id', note.id);
          if (upErr) { console.warn(`  [warn] Body refresh failed for note ${note.id}: ${upErr.message}`); continue; }
          bodiesRefreshed++;
        }
        const sigs = bodySignalsFor({ source: note.source, sourceType: note.source_type || feed.source_type, confidence: note.confidence ?? feed.confidence, url: note.url, title: note.title, body });
        for (const bs of sigs) {
          const key = `${note.id}|${String(bs.team_or_market).toLowerCase().trim()}|${bs.bet_type}`;
          if (seen.has(key)) continue;
          seen.add(key);
          backfillSignals.push({
            note_id: note.id, source: bs.source, author: bs.author || null, team_or_market: bs.team_or_market,
            bet_type: bs.bet_type, lean: bs.lean, rationale: bs.rationale, event_ref: bs.event_ref, confidence: bs.confidence,
          });
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    if (bodiesRefreshed > 0) console.log(`  Bodies refreshed (changed since capture): ${bodiesRefreshed}`);
  }

  const noteIdByHash = new Map(insertedNotes.map(n => [n.url_hash, n.id]));
  const signalsToInsert = candidateSignals
    .map(signal => {
      const canonical = canonicalizeUrl(signal.event_ref);
      const hash = sha256(canonical);
      const noteId = noteIdByHash.get(hash) ?? noteIdByHash.get(revisionHashByBase.get(hash));
      if (!noteId) return null;
      return {
        note_id: noteId,
        source: signal.source,
        author: signal.author || null,
        team_or_market: signal.team_or_market,
        bet_type: signal.bet_type,
        lean: signal.lean,
        rationale: signal.rationale,
        event_ref: signal.event_ref,
        confidence: signal.confidence,
      };
    })
    .filter(Boolean);

  signalsToInsert.push(...backfillSignals);
  if (signalsToInsert.length > 0) {
    const { error } = await supabase
      .from('research_pick_signals')
      .insert(signalsToInsert);

    if (error) throw new Error(`Insert signals failed: ${error.message}`);
  }

  const receiptPath = await writeReceipt({
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    dry_run: false,
    lookback_hours: HOURS,
    feeds: feedResults,
    totals: {
      candidate_notes: candidateNotes.length,
      candidate_signals: candidateSignals.length,
      inserted_notes: insertedNotes.length,
      inserted_signals: signalsToInsert.length,
      bodies_backfilled: backfilled,
      bodies_refreshed: bodiesRefreshed,
      skipped_existing_notes: uniqueNotes.length - newNotes.length,
      revised_evergreen_notes: revisionNotes.length,
    },
  });

  console.log(`  Inserted notes: ${insertedNotes.length}`);
  console.log(`  Inserted signals: ${signalsToInsert.length}`);
  console.log(`  Receipt: ${receiptPath}`);

  // Keep the GitHub Actions run visibly red for as long as a feed stays
  // down (not just on the run that first crosses the alert threshold) --
  // matches the "warn loudly, don't silently pass" principle applied
  // elsewhere in this pipeline (dossier-freshness-gate.js).
  if (feedHealth.anyStillDown) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(`ResearchIntelIngestAgent failed: ${err.message}`);
  process.exit(1);
});
