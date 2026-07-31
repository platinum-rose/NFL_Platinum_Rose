#!/usr/bin/env node
// scripts/training-camp-rss-scout.js
// F-30b — Phase 2 of the training camp intel spec (docs/TRAINING_CAMP_INTEL_SPEC_2026.md).
//
// Adds a free-tier RSS scout on top of Phase 1's manual-note importer
// (scripts/training-camp-intel.js). Network fetches only happen when --live
// is explicitly passed — config/training-camp-sources.json's
// `network_fetch_default: false` guardrail stays the resting default; this
// script requires an explicit opt-in flag every run, not just a one-time
// approval, so a stray cron/CI invocation can never silently start fetching.
//
// Matched RSS items are run through the *same* toIntelRecord/dedupeItems/
// buildSnapshot pipeline as manual notes (imported from training-camp-intel.js)
// so manual + live sources land in one unified, per-team snapshot — no
// separate "RSS-only" file to reconcile.
//
// No Supabase writes, no live model/API calls, no official picks. Local-only,
// same as Phase 1.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseArgs,
  nowIso,
  todayPacificDate,
  inferTeams,
  toIntelRecord,
  dedupeItems,
  buildSnapshot,
  writeSnapshotAndReports,
  parseManualDirectory,
} from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const DEFAULT_REPORT_DIR = path.join(ROOT, '.nfl', 'training-camp');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');
const MAX_FEED_BYTES = 3_000_000;
const LIMIT_PER_FEED = 25;
const FETCH_TIMEOUT_MS = 20_000;

// Approved free feeds (F-30b). Same URLs already run live in
// agents/research-intel-ingest.js's general research pipeline — this scout
// re-fetches them independently and applies its own camp-keyword filter +
// per-team tagging on top, rather than depending on that pipeline's output.
export const FEEDS = [
  { source: 'ESPN NFL', url: 'https://www.espn.com/espn/rss/nfl/news', source_type: 'rss' },
  { source: 'Pro Football Talk', url: 'https://profootballtalk.nbcsports.com/feed/', source_type: 'rss' },
  { source: 'PFF', url: 'https://www.pff.com/feed', source_type: 'rss' },
  { source: 'Rotowire NFL', url: 'https://www.rotowire.com/rss/news.php?sport=NFL', source_type: 'rss' },
  { source: 'Sharp Football', url: 'https://www.sharpfootballanalysis.com/feed/', source_type: 'rss' },
  { source: 'CBS Sports NFL', url: 'https://www.cbssports.com/rss/headlines/nfl/', source_type: 'rss' },
  { source: 'Yahoo Sports NFL', url: 'https://sports.yahoo.com/nfl/rss.xml', source_type: 'rss' },
  { source: 'USA Today NFL', url: 'https://rssfeeds.usatoday.com/usatodaycomnfl-topstories', source_type: 'rss' },
  { source: 'Yardbarker NFL', url: 'https://www.yardbarker.com/rss/sport/1', source_type: 'rss' },
  { source: 'FantasyPros', url: 'https://www.fantasypros.com/nfl/rss/news.php', source_type: 'rss' },
];

// Camp-relevance prefilter — narrower than research-intel-ingest.js's general
// NFL_KEYWORDS list on purpose. This is a training-camp snapshot, not a
// general news feed; --camp-only=false widens to "any team-taggable item".
const CAMP_KEYWORDS = [
  'training camp', 'camp battle', 'position battle', ' ota', 'otas', 'minicamp',
  'depth chart', 'roster cut', 'roster move', 'waived', 'released', 'signed',
  'activated', 'claimed off waivers', 'preseason', 'snap count', 'joint practice',
  'hall of fame game', 'pup list', 'physically unable to perform', 'injured reserve',
  'questionable', 'doubtful', 'out for the season', 'limited practice', 'did not practice',
  'first-team reps', 'first team reps', 'starting job', 'backup', 'competition at',
  'battle for the starting', 'inactive', 'trade', 'extension', 'holdout',
];

export function isCampRelevant(text) {
  const lower = ` ${String(text || '').toLowerCase()} `;
  return CAMP_KEYWORDS.some((k) => lower.includes(k));
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

// RSS/Atom parsing + byte-capped fetch adapted from agents/research-intel-ingest.js
// (kept local/duplicated rather than imported, so this script's guardrails
// can't be affected by future changes to that unrelated production agent).
export function parseRssItems(xml) {
  return xml
    .split(/<item[\s>]/i)
    .slice(1)
    .map((chunk) => {
      const title = firstTag(chunk, 'title');
      const link = firstTag(chunk, 'link') || firstTag(chunk, 'guid');
      const description = firstTag(chunk, 'description');
      const pubDateRaw = firstTag(chunk, 'pubDate');
      const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;
      return {
        title: title || '(untitled)',
        link,
        description: description || '',
        published_at: publishedAt,
      };
    })
    .filter((item) => !!item.link);
}

export function parseAtomItems(xml) {
  return xml
    .split(/<entry[\s>]/i)
    .slice(1)
    .map((chunk) => {
      const title = firstTag(chunk, 'title');
      const linkMatch = chunk.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)
        || chunk.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["']/i)
        || chunk.match(/<link[^>]+href=["']([^"']+)["']/i);
      const link = linkMatch ? linkMatch[1] : firstTag(chunk, 'id');
      const summary = firstTag(chunk, 'summary') || firstTag(chunk, 'content') || '';
      const dateRaw = firstTag(chunk, 'published') || firstTag(chunk, 'updated');
      const publishedAt = dateRaw ? new Date(dateRaw).toISOString() : null;
      return {
        title: title || '(untitled)',
        link,
        description: cleanHtml(summary),
        published_at: publishedAt,
      };
    })
    .filter((item) => !!item.link);
}

export function canonicalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    const allowed = new URLSearchParams();
    for (const [k, v] of u.searchParams.entries()) {
      const key = k.toLowerCase();
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'gclid') continue;
      allowed.append(k, v);
    }
    u.search = allowed.toString();
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Byte-capped streaming fetch — mirrors agents/research-intel-ingest.js so a
 * misbehaving feed can't blow up memory. Returns { source, status, reason, items }.
 * status: 'available' | 'unavailable' (bad response/shape) | 'error' (network/size).
 */
export async function fetchFeed(feed, { maxBytes = MAX_FEED_BYTES, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'NFL-Platinum-Rose-TrainingCampScout/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      return { source: feed.source, status: 'unavailable', reason: `HTTP ${res.status}`, items: [] };
    }

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    const looksLikeFeed = contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
    if (!looksLikeFeed) {
      return { source: feed.source, status: 'unavailable', reason: `Unsupported content-type: ${contentType || 'unknown'}`, items: [] };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return { source: feed.source, status: 'error', reason: 'Response stream unavailable', items: [] };
    }

    const chunks = [];
    let totalBytes = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel('Feed exceeds configured size limit');
        return { source: feed.source, status: 'error', reason: `Feed payload too large (> ${maxBytes} bytes)`, items: [] };
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const xml = new TextDecoder().decode(merged);

    if (!/<rss|<feed|<rdf:RDF/i.test(xml)) {
      return { source: feed.source, status: 'unavailable', reason: 'Response is not a parseable RSS/Atom feed', items: [] };
    }

    const isAtom = feed.format === 'atom' || /^\s*<feed[\s>]/i.test(xml);
    const parsed = isAtom ? parseAtomItems(xml) : parseRssItems(xml);
    return { source: feed.source, status: 'available', reason: null, items: parsed };
  } catch (err) {
    return { source: feed.source, status: 'error', reason: err.message, items: [] };
  }
}

/**
 * Core orchestrator: parses manual notes (always), optionally fetches RSS
 * feeds live, merges both into one deduped snapshot via the Phase 1 pipeline.
 */
export async function runScout(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || generatedAt.slice(0, 10) || todayPacificDate();
  const inputDir = path.resolve(ROOT, options.inputDir || path.join('data', 'training-camp', String(season), 'manual'));
  const outDir = path.resolve(ROOT, options.outDir || path.join('data', 'training-camp', String(season)));
  const reportDir = path.resolve(ROOT, options.reportDir || DEFAULT_REPORT_DIR);
  const capturedFallback = options.capturedAt || generatedAt;
  const campOnly = options.campOnly !== false;
  const sourceFilter = options.source ? String(options.source).toLowerCase() : null;
  const live = Boolean(options.live);
  const feedFetcher = options.fetchFeedImpl || fetchFeed;

  const { items: manualItems } = await parseManualDirectory(inputDir, season, capturedFallback);

  const feedsToFetch = FEEDS.filter((f) => !sourceFilter || f.source.toLowerCase().includes(sourceFilter));
  const feedHealth = [];
  const rssItems = [];

  if (live) {
    for (const feed of feedsToFetch) {
      const result = await feedFetcher(feed);
      const recent = result.items.slice(0, LIMIT_PER_FEED);
      let keptCount = 0;

      for (const item of recent) {
        const text = `${item.title} ${item.description}`;
        if (campOnly && !isCampRelevant(text)) continue;

        const teams = inferTeams({}, text);
        if (!teams.length) continue;

        const canonicalUrl = canonicalizeUrl(item.link);
        const raw = {
          source: feed.source,
          source_type: feed.source_type || 'rss',
          source_url: canonicalUrl,
          published_at: item.published_at,
          captured_at: capturedFallback,
          body: item.description,
          summary: item.title,
          dedupe_key: canonicalUrl,
          needs_human_review: true,
        };

        for (const team of teams) {
          rssItems.push(toIntelRecord({ raw, team, sourceFile: null, season, capturedFallback }));
          keptCount += 1;
        }
      }

      feedHealth.push({
        source: feed.source,
        url: feed.url,
        status: result.status,
        reason: result.reason,
        fetched_items: result.items.length,
        kept_items: keptCount,
      });
    }
  } else {
    for (const feed of feedsToFetch) {
      feedHealth.push({
        source: feed.source,
        url: feed.url,
        status: 'skipped',
        reason: 'Live fetch not enabled — pass --live to fetch (network_fetch_default is false).',
        fetched_items: 0,
        kept_items: 0,
      });
    }
  }

  const items = dedupeItems([...manualItems, ...rssItems]);
  const snapshot = buildSnapshot({ season, generatedAt, items, inputDir, feedHealth });

  if (options.dryRun) {
    return { snapshot, feedHealth, outputs: null };
  }
  const outputs = await writeSnapshotAndReports(snapshot, outDir, reportDir, date);
  return { snapshot, feedHealth, outputs };
}

function parseBool(value, defaultValue) {
  if (value === undefined) return defaultValue;
  if (value === true) return true;
  const s = String(value).toLowerCase();
  if (s === 'false' || s === '0' || s === 'no') return false;
  return true;
}

async function writeReceipt(payload) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `training-camp-rss-scout-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const season = Number(args.season || DEFAULT_SEASON);
  const inputDir = args['manual-dir'] || args.input || path.join('data', 'training-camp', String(season), 'manual');
  const outDir = args['out-dir'] || path.join('data', 'training-camp', String(season));
  const reportDir = args['report-dir'] || DEFAULT_REPORT_DIR;
  const date = args.date || null;
  const live = args.live === true || String(args.live).toLowerCase() === 'true';
  const campOnly = parseBool(args['camp-only'], true);
  const source = args.source || null;
  const noWrite = args['dry-run'] === true || args['no-persist'] === true;

  const { snapshot, feedHealth, outputs } = await runScout({
    season, inputDir, outDir, reportDir, date,
    live, campOnly, source,
    dryRun: noWrite,
  });

  console.log(`Training camp scout complete: ${snapshot.meta.item_count} items (manual + RSS), ${snapshot.meta.team_count} teams, ${snapshot.meta.teams_with_intel} with intel.`);
  if (!live) {
    console.log('Live network fetch was NOT performed — pass --live to enable RSS fetching.');
  }
  for (const feed of feedHealth) {
    console.log(`  [${feed.status}] ${feed.source} — ${feed.kept_items} kept${feed.reason ? ` (${feed.reason})` : ''}`);
  }
  if (noWrite) {
    console.log('--dry-run/--no-persist: snapshot/report files were not written.');
  }
  if (outputs) {
    console.log(`Snapshot: ${outputs.jsonPath}`);
    console.log(`Latest: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.mdPath}`);
    console.log(`HTML: ${outputs.htmlPath}`);
  }

  const receiptPath = await writeReceipt({
    generated_at: snapshot.meta.generated_at,
    live,
    camp_only: campOnly,
    source_filter: source,
    written: !noWrite,
    feed_health: feedHealth,
    item_count: snapshot.meta.item_count,
    team_count: snapshot.meta.team_count,
    teams_with_intel: snapshot.meta.teams_with_intel,
  });
  console.log(`Receipt: ${receiptPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
