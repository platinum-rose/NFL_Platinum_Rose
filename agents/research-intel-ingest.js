import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

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
// F-11 Ph.2: fetch full article body after insert (disabled by default offseason)
const FETCH_BODY = process.env.INTEL_FETCH_BODY === 'true';
const BODY_MAX_CHARS = 4_000;

const FEEDS = [
  // ── Betting / sharp-money sources ─────────────────────────────────────────
  {
    // NFL-specific feed — all articles are already NFL content, so the
    // looksNflRelevant filter passes everything through cleanly.
    source: 'Action Network',
    url: 'https://www.actionnetwork.com/nfl/feed',
    confidence: 0.74,
    source_type: 'betting',
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
    confidence: 0.63,
    source_type: 'analytical',
  },
  {
    // BettingPros /nfl/news/feed/ returns HTML — using ESPN NFL RSS instead
    source: 'ESPN NFL',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    confidence: 0.67,
    source_type: 'news',
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
    confidence: 0.67,
    source_type: 'analytical',
  },
  {
    // Rotowire NFL: injuries, lineup news, depth-chart changes
    // Migrated from x-sharp-ingest (was RSS-backed account, not X content)
    source: 'Rotowire NFL',
    url: 'https://www.rotowire.com/rss/news.php?sport=NFL',
    confidence: 0.65,
    source_type: 'analytical',
  },
  {
    // Football Outsiders: DVOA, efficiency metrics, situational analytics
    // Migrated from x-sharp-ingest (was RSS-backed account, not X content)
    source: 'Football Outsiders',
    url: 'https://www.footballoutsiders.com/rss.xml',
    confidence: 0.68,
    source_type: 'analytical',
  },
  {
    // THE WINDOW: Matt Russell's sports betting newsletter (EMR, lookahead lines, win totals)
    source: 'THE WINDOW (Matt Russell)',
    url: 'https://mrussauthentic.substack.com/feed',
    confidence: 0.75,
    source_type: 'newsletter',
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
async function fetchArticleBody(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlatinumRoseBot/1.0)' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip scripts, styles, nav, header, footer to reduce noise
    const stripped = html
      .replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return stripped.slice(0, BODY_MAX_CHARS) || null;
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

function looksNflRelevant(item, source = '') {
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

function extractSignals(item, source, baseConfidence) {
  const text = `${item.title} ${item.description}`.trim();
  const lower = text.toLowerCase();
  const signals = [];

  const spreadOrTotalMatches = text.match(/\b[A-Z][A-Za-z .&'-]{2,30}\s(?:\+|-)\d+(?:\.\d+)?\b|\b(?:Over|Under)\s\d+(?:\.\d+)?\b/g) || [];
  for (const m of spreadOrTotalMatches.slice(0, 3)) {
    signals.push({
      source,
      team_or_market: m,
      bet_type: classifyBetType(m),
      lean: m,
      rationale: item.title,
      event_ref: item.link,
      confidence: Number((baseConfidence - 0.08).toFixed(3)),
    });
  }

  if (signals.length === 0 && /pick|best bet|lean|prediction|odds/i.test(lower)) {
    signals.push({
      source,
      team_or_market: item.title,
      bet_type: classifyBetType(text),
      lean: item.title,
      rationale: item.description.slice(0, 220),
      event_ref: item.link,
      confidence: Number((baseConfidence - 0.12).toFixed(3)),
    });
  }

  return signals;
}

async function fetchFeed(feed) {
  try {
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

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    const looksLikeFeed =
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

    const xml = new TextDecoder().decode(
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

    const feedItems = recentItems.filter(item => looksNflRelevant(item, feed.source));

    const notes = feedItems.map(item => {
      const canonical = canonicalizeUrl(item.link);
      const summary = item.description.slice(0, 800);
      return {
        source: feed.source,
        source_type: feed.source_type ?? 'article',
        url: item.link,
        canonical_url: canonical,
        url_hash: sha256(canonical),
        content_hash: sha256(`${item.title}|${summary}`),
        title: item.title,
        summary,
        published_at: item.published_at,
        confidence: feed.confidence,
        author: item.author || null,
      };
    });

    // Analytical sources produce contextual articles, not explicit pick
    // signals — skip signal extraction to avoid low-quality noise.
    const signals = feed.source_type === 'analytical'
      ? []
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

  const uniqueNotes = Array.from(
    new Map(candidateNotes.map(n => [n.url_hash, n])).values()
  );

  let existingHashes = new Set();
  if (uniqueNotes.length > 0) {
    const { data, error } = await supabase
      .from('research_intel_notes')
      .select('url_hash')
      .in('url_hash', uniqueNotes.map(n => n.url_hash));

    if (error) throw new Error(`Lookup failed: ${error.message}`);
    existingHashes = new Set((data || []).map(d => d.url_hash));
  }

  const newNotes = uniqueNotes.filter(n => !existingHashes.has(n.url_hash));

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
  if (FETCH_BODY && insertedNotes.length > 0) {
    console.log(`  Fetching article bodies for ${insertedNotes.length} new notes…`);
    let bodiesFetched = 0;
    for (const note of insertedNotes) {
      const body = await fetchArticleBody(note.url);
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
      // Polite delay between article fetches
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`  Bodies fetched: ${bodiesFetched}/${insertedNotes.length}`);
  }

  const noteIdByHash = new Map(insertedNotes.map(n => [n.url_hash, n.id]));
  const signalsToInsert = candidateSignals
    .map(signal => {
      const canonical = canonicalizeUrl(signal.event_ref);
      const hash = sha256(canonical);
      const noteId = noteIdByHash.get(hash);
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
      skipped_existing_notes: uniqueNotes.length - newNotes.length,
    },
  });

  console.log(`  Inserted notes: ${insertedNotes.length}`);
  console.log(`  Inserted signals: ${signalsToInsert.length}`);
  console.log(`  Receipt: ${receiptPath}`);
}

main().catch(err => {
  console.error(`ResearchIntelIngestAgent failed: ${err.message}`);
  process.exit(1);
});
