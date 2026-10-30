// Local public-source capture using the existing ingestion parsers.
// No database clients, credentials, email, paid services, or canonical writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { htmlToBodyText } from '../../../agents/lib/article-body.js';

const runFile = promisify(execFile);
const BASE = path.dirname(fileURLToPath(import.meta.url));
const EXPANDED = process.argv.includes('--expanded');
const OUT = EXPANDED ? path.join(BASE, 'expanded') : BASE;
const ROOT = path.resolve(BASE, '../../..');
const AGENT = path.join(ROOT, 'agents/research-intel-ingest.js');
const SINCE = '2026-10-27T07:00:00.000Z';
const STARTED = new Date().toISOString();
const LIMIT = 1000;
const digest = value => createHash('sha256').update(value).digest('hex');
const save = async (name, value) => fs.writeFile(path.join(OUT, name), JSON.stringify(value, null, 2) + '\n');
const safe = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

await fs.mkdir(path.join(OUT, 'feeds'), { recursive: true });
await fs.mkdir(path.join(OUT, 'articles'), { recursive: true });
try { await fs.access(path.join(OUT, 'capture.json')); throw new Error('Capture exists; preserve the existing snapshot.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

const original = await fs.readFile(AGENT, 'utf8');
const end = original.lastIndexOf('\nmain().catch(');
if (end < 0) throw new Error('Unexpected agent entry point; refusing to execute it.');
let engineText = original.slice(0, end)
  .replace("import { createClient } from '@supabase/supabase-js';", "const createClient = () => { throw new Error('Database access is disabled in this local capture'); };")
  .replace("import nodemailer from 'nodemailer';", "const nodemailer = { createTransport() { throw new Error('Email is disabled in this local capture'); } };")
  .replace("import 'dotenv/config';", '')
  .replace(/from '(\.\/[^']+)'/g, (_all, relative) => `from '${pathToFileURL(path.resolve(path.dirname(AGENT), relative)).href}'`)
  .replace('const __filename = fileURLToPath(import.meta.url);', `const __filename = ${JSON.stringify(AGENT)};`)
  .replace('items: parsedJson,', 'items: parsedJson, raw_feed_text: xml, content_type: contentType,')
  .replace('items: parsed,', 'items: parsed, raw_feed_text: xml, content_type: contentType,');
engineText += '\nexport { FEEDS, fetchFeed, looksNflRelevant, canonicalizeUrl, sha256, parseRssItems, parseAtomItems, parseEspnApiItems };\n';
if (engineText.includes("import 'dotenv/config'") || engineText.includes("from '@supabase/supabase-js'")) throw new Error('Unsafe loader import retained');
const engine = await import('data:text/javascript;base64,' + Buffer.from(engineText).toString('base64'));
const priorCapture = EXPANDED ? JSON.parse(await fs.readFile(path.join(BASE, 'capture.json'), 'utf8')) : null;
const cachedNotes = new Map();
const morningRows = JSON.parse(await fs.readFile(path.join(ROOT,'reports/engineering/week8-article-ingest-2026-10-29/proposed-notes.json'),'utf8'));
const morning = new Map(morningRows.map(row => [String(row.canonical_url||row.url).replace(/\/$/,''),row]));

const allowed = {
  'Action Network': 'actionnetwork.com', 'BettingPros': 'bettingpros.com', 'Walter Football': 'walterfootball.com',
  'ESPN NFL': 'espn.com', 'VSiN': 'vsin.com', 'Sharp Football': 'sharpfootballanalysis.com',
  'Pro Football Talk': 'nbcsports.com', 'PFF': 'pff.com', 'Rotowire NFL': 'rotowire.com',
};
const feeds = [], notes = [], excluded = [];
await Promise.all(engine.FEEDS.map(async feed => {
  let result;
  let effectiveUrl = feed.url;
  const saved = priorCapture?.feeds.find(row => row.source === feed.source);
  if (EXPANDED && (saved?.raw_file || feed.source === 'Action Network')) {
    const rawPath = feed.source === 'Action Network' ? path.join(BASE, 'action-network-direct.xml') : path.join(BASE, saved.raw_file);
    const raw = await fs.readFile(rawPath, 'utf8');
    const parsed = feed.format === 'json' ? engine.parseEspnApiItems(raw) : feed.format === 'atom' ? engine.parseAtomItems(raw) : engine.parseRssItems(raw);
    result = { status: parsed.length ? 'available' : 'unavailable', reason: parsed.length ? null : 'Saved source contained no parseable entries', items: parsed, raw_feed_text: raw };
    if (feed.source === 'Action Network') effectiveUrl = 'https://www.actionnetwork.com/nfl/feed';
  } else { const chosen = feed.source === 'Action Network' ? { ...feed, url: 'https://www.actionnetwork.com/nfl/feed' } : feed; effectiveUrl = chosen.url; result = await engine.fetchFeed(chosen); }
  const recent = result.items.filter(item => !item.published_at || (item.published_at >= SINCE && item.published_at <= STARTED));
  const capped = recent.slice(0, LIMIT);
  const relevant = capped.filter(item => engine.looksNflRelevant(item, feed.source, { nflOnly: feed.nflOnly === true }));
  const feedName = `feeds/${safe(feed.source)}.${feed.format === 'json' ? 'json' : 'xml'}`;
  if (result.raw_feed_text) await fs.writeFile(path.join(OUT, feedName), result.raw_feed_text);
  feeds.push({ source: feed.source, url: effectiveUrl, configured_url: feed.url, status: result.status, reason: result.reason,
    total_feed_items: result.items.length, in_window_items: recent.length, inspected_after_cap: capped.length,
    nfl_candidates: relevant.length, omitted_by_feed_cap: Math.max(0, recent.length - LIMIT),
    raw_file: result.raw_feed_text ? feedName : null,
    raw_sha256: result.raw_feed_text ? digest(result.raw_feed_text) : null });
  for (const item of capped.filter(item => !relevant.includes(item))) excluded.push({ source: feed.source, title: item.title, url: item.link, reason: 'existing_NFL_relevance_filter' });
  for (const item of relevant) {
    const canonical = engine.canonicalizeUrl(item.link);
    const summary = String(item.description || '').slice(0, 800);
    const urlHash = engine.sha256(feed.itemKey === 'guid' && item.guid ? `${canonical}#guid=${item.guid}` : canonical);
    notes.push({ local_id: `public-${urlHash.slice(0, 20)}`, source: feed.source, source_type: feed.source_type || 'article',
      url: item.link, canonical_url: canonical, url_hash: urlHash, content_hash: engine.sha256(`${item.title}|${summary}`),
      title: item.title, summary, rss_description: item.description || '', published_at: item.published_at,
      captured_at: STARTED, confidence: feed.confidence, author: item.author || null,
      guid: item.guid || null, track_revisions: feed.trackRevisions === true,
      body: null, body_status: 'pending_public_fetch', database_status: 'not_queried',
      interpretation_status: 'raw_source_only_not_roster_cleared' });
  }
  console.log(JSON.stringify({ phase: 'feed', source: feed.source, status: result.status, nfl_candidates: relevant.length, omitted_by_feed_cap: Math.max(0, recent.length - LIMIT) }));
}));
const unique = [...new Map(notes.map(note => [note.url_hash, note])).values()].sort((a,b) => a.source.localeCompare(b.source));
await save('feed-preview.json', { started_at: STARTED, since: SINCE, limit_per_feed: LIMIT, feeds, candidates: unique, excluded });

let completed = 0;
async function captureBody(note) {
  const old = morning.get(String(note.canonical_url).replace(/\/$/,''));
  note.morning_comparison = !old ? 'new_url_to_morning_batch' : old.content_hash !== note.content_hash || old.published_at !== note.published_at ? 'changed_metadata_to_morning_batch' : 'unchanged_to_morning_batch';
  if (note.morning_comparison === 'unchanged_to_morning_batch') { note.body_status='unchanged_reuse_morning_evidence'; return; }
  if (note.source === 'Rotowire NFL') {
    note.body_status = 'rss_item_only_player_page_not_fetched';
    note.body_source = 'retained_item_specific_RSS_description';
    return;
  }
  if (note.source === 'Walter Football') {
    note.body_status = 'metadata_only_deprioritized_source';
    return;
  }
  let target;
  try { target = new URL(note.url); } catch { note.body_status = 'invalid_public_url'; return; }
  const domain = allowed[note.source];
  if (target.protocol !== 'https:' || !domain || !(target.hostname === domain || target.hostname.endsWith('.' + domain))) {
    note.body_status = 'url_outside_expected_public_source'; return;
  }
  const stem = `articles/${safe(note.source)}-${note.url_hash.slice(0, 20)}`;
  const rawPath = path.join(OUT, stem + '.html');
  try {
    const cached = cachedNotes.get(note.url_hash);
    let raw;
    if (cached?.raw_file) {
      raw = await fs.readFile(path.join(BASE, cached.raw_file), 'utf8');
      await fs.writeFile(rawPath, raw);
      note.http_status = cached.http_status; note.content_type = cached.content_type;
      note.reused_public_capture = cached.captured_at;
    } else {
      const { stdout } = await runFile('curl', ['-sS', '-L', '--max-time', '20', '--max-filesize', '8000000',
        '-A', 'Mozilla/5.0 (compatible; PlatinumRoseBot/1.0)', '-o', rawPath, '-w', '%{http_code} %{content_type}', note.url],
        { timeout: 25000, maxBuffer: 1024 * 1024 });
      const [status, ...contentType] = stdout.trim().split(' ');
      note.http_status = Number(status); note.content_type = contentType.join(' ');
      raw = await fs.readFile(rawPath, 'utf8');
    }
    note.raw_file = stem + '.html'; note.raw_sha256 = digest(raw); note.raw_bytes = Buffer.byteLength(raw);
    if (note.http_status < 200 || note.http_status >= 300) { note.body_status = 'unavailable_http_' + note.http_status; return; }
    if (!/html|text/i.test(note.content_type)) { note.body_status = 'unsupported_body_content_type'; return; }
    if (/^\s*<(?:!doctype html|html)/i.test(raw) && /<title>\s*(?:Just a moment|Access Denied|Attention Required)/i.test(raw)) {
      note.body_status = 'public_fetch_challenged'; return;
    }
    const article = (raw.match(/<article\b[\s\S]*?<\/article>/i) || raw.match(/<main\b[\s\S]*?<\/main>/i) || [raw])[0];
    let fullBody = htmlToBodyText(article);
    note.body_extraction_scope = 'article_or_main_element';
    if (fullBody.length < 500) {
      const wholePage = htmlToBodyText(raw);
      if (wholePage.length > fullBody.length) { fullBody = wholePage; note.body_extraction_scope = 'whole_page_fallback_needs_chrome_review'; }
    }
    await fs.writeFile(path.join(OUT, stem + '.txt'), fullBody);
    note.body_file = stem + '.txt'; note.body_sha256 = digest(fullBody); note.body_chars_retained = fullBody.length;
    note.body = fullBody.slice(0, 200000);
    note.body_status = fullBody.length < 500 ? 'thin_public_body' : 'public_body_captured_not_human_verified';
    note.proposed_database_body_would_be_capped = fullBody.length > 200000;
    note.paywall_or_subscription_marker = /subscribe to (?:read|continue)|subscriber.only|premium content|unlock this (?:article|content)/i.test(fullBody);
    if (note.paywall_or_subscription_marker) note.body_status = 'subscription_marker_review_needed';
    else if (note.body_extraction_scope === 'whole_page_fallback_needs_chrome_review') note.body_status = 'page_text_retained_needs_article_boundary_review';
  } catch (error) { note.body_status = 'public_fetch_error'; note.fetch_error = String(error.message).slice(0, 300); }
  finally {
    completed += 1;
    if (completed % 10 === 0) console.log(JSON.stringify({ phase: 'body_progress', completed, candidates: unique.length }));
  }
}
let nextIndex = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (nextIndex < unique.length) await captureBody(unique[nextIndex++]);
}));

const priorPath = path.join(ROOT, 'reports/engineering/week8-articles-2026-10-28-202315Z/research-articles-raw.json');
const prior = JSON.parse(await fs.readFile(priorPath, 'utf8'));
const priorByUrl = new Map((prior.rows || []).map(row => [engine.canonicalizeUrl(row.url || row.canonical_url || ''), row]));
for (const note of unique) {
  const old = priorByUrl.get(note.canonical_url);
  note.comparison_to_oct28_export = !old ? 'url_absent_from_saved_export' :
    old.content_hash && old.content_hash !== note.content_hash ? 'changed_metadata_vs_saved_export' : 'url_already_in_saved_export';
}
const bodyCounts = Object.fromEntries([...new Set(unique.map(note => note.body_status))].map(status => [status, unique.filter(note => note.body_status === status).length]));
const summary = { feeds: feeds.length, available_feeds: feeds.filter(feed => feed.status === 'available').length,
  raw_candidate_notes: notes.length, unique_candidate_notes: unique.length, duplicate_candidate_notes: notes.length - unique.length,
  body_status_counts: bodyCounts, retained_body_characters: unique.reduce((total, note) => total + (note.body_chars_retained || 0), 0),
  absent_from_saved_oct28_export: unique.filter(note => note.comparison_to_oct28_export === 'url_absent_from_saved_export').length,
  current_database_new_count: null, supabase_actions: 0, paid_calls: 0, emails_sent: 0 };
await save('capture.json', { schema: 'local_public_article_capture_v1', started_at: STARTED, completed_at: new Date().toISOString(),
  since: SINCE, through: STARTED, limit_per_feed: LIMIT, status: 'local_capture_only_not_ingested_into_supabase',
  implementation_source: 'agents/research-intel-ingest.js', implementation_sha256: digest(original),
  historical_comparator: path.relative(ROOT, priorPath), historical_comparator_sha256: digest(await fs.readFile(priorPath)),
  summary, feeds: feeds.sort((a,b) => a.source.localeCompare(b.source)), rows: unique, excluded });
const manifest = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name !== 'sha256-manifest.json') {
      const bytes = await fs.readFile(full); manifest.push({ path: path.relative(OUT, full), bytes: bytes.length, sha256: digest(bytes) });
    }
  }
}
await walk(OUT);
await save('sha256-manifest.json', { generated_at: new Date().toISOString(), files: manifest });
console.log(JSON.stringify({ phase: 'complete', ...summary }, null, 2));
