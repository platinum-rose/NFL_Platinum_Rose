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

const FEEDS = [
  {
    source: 'Action Network',
    url: 'https://www.actionnetwork.com/feed',
    confidence: 0.74,
  },
  {
    source: 'BettingPros',
    url: 'https://www.bettingpros.com/nfl/news/feed/',
    confidence: 0.69,
  },
  {
    source: 'VSiN',
    url: 'https://vsin.com/feed/',
    confidence: 0.71,
  },
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

      return {
        title: title || '(untitled)',
        link: link || guid,
        description: description || '',
        published_at: publishedAt,
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
      if (totalBytes > MAX_FEED_BYTES) {
        await reader.cancel('Feed exceeds configured size limit');
        return {
          source: feed.source,
          status: 'error',
          reason: `Feed payload too large (> ${MAX_FEED_BYTES} bytes)`,
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
    const parsed = parseRssItems(xml);

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
    const feedItems = result.items
      .filter(item => !item.published_at || item.published_at >= cutoff)
      .slice(0, LIMIT_PER_FEED);

    const notes = feedItems.map(item => {
      const canonical = canonicalizeUrl(item.link);
      const summary = item.description.slice(0, 800);
      return {
        source: feed.source,
        source_type: 'article',
        url: item.link,
        canonical_url: canonical,
        url_hash: sha256(canonical),
        content_hash: sha256(`${item.title}|${summary}`),
        title: item.title,
        summary,
        published_at: item.published_at,
        confidence: feed.confidence,
      };
    });

    const signals = feedItems.flatMap(item =>
      extractSignals(item, feed.source, feed.confidence)
    );

    feedResults.push({
      source: feed.source,
      url: feed.url,
      status: result.status,
      reason: result.reason,
      fetched_items: result.items.length,
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
      .select('id,url_hash');

    if (error) throw new Error(`Insert notes failed: ${error.message}`);
    insertedNotes = data || [];
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
