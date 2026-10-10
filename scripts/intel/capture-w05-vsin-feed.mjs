#!/usr/bin/env node
// Captures raw VSiN RSS bodies for the explicitly identified Week 5 NFL hub.
// Local evidence only: no Supabase, normalization, recommendation, or ticket action.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = path.join(root, 'data', 'research-intel', 'source-evidence', '2026-10-10-vsin-week5-current-feed.json');
const wanted = new Set([
  'https://vsin.com/nfl/matt-youmans-nfl-week-5-best-bets-and-predictions/',
  'https://vsin.com/nfl/average-joe-contest-nfl-consensus-picks-week-5/',
  'https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/',
  'https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/',
  'https://vsin.com/nfl/tuleys-takes-for-nfl-week-5/',
  'https://vsin.com/nfl/steve-makinen-week-5-nfl-best-bets/',
  'https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/',
  'https://vsin.com/nfl/nfl-first-touchdown-scorer-predictions-for-week-5/',
  'https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/',
  'https://vsin.com/nfl/nfl-week-5-betting-hub-picks-odds-and-previews/',
]);

function htmlToText(html) {
  return html.replace(/<(script|style|nav|header|footer|aside|form|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<h([1-4])[^>]*>/gi, (_, level) => `\n\n${'#'.repeat(Number(level))} `).replace(/<\/h[1-4]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<(p|br|div|tr)[^>]*>/gi, '\n').replace(/<\/?[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, '-').replace(/&[a-z]+;/gi, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

const xml = await (await fetch('https://vsin.com/feed/', { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-Dashboard-Evidence/1.0)' }, signal: AbortSignal.timeout(45_000) })).text();
const records = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
  const text = (tag) => item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))?.[1]?.trim() || null;
  const url = text('link');
  return {
    title: text('title'), url, author: text('dc:creator'), published_at: text('pubDate'),
    full_body_evidence: text('content:encoded'),
  };
}).filter((record) => wanted.has(record.url)).map((record) => ({
  ...record,
  capture_status: record.full_body_evidence?.length >= 500 ? 'body_captured_from_rss' : 'body_unavailable',
  body_characters: record.full_body_evidence?.length || 0,
  sha256: record.full_body_evidence ? crypto.createHash('sha256').update(record.full_body_evidence).digest('hex') : null,
}));

const captured = new Set(records.map((record) => record.url));
for (const url of wanted) {
  if (captured.has(url)) continue;
  const retrieved_at = new Date().toISOString();
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-Dashboard-Evidence/1.0)', Accept: 'text/html' }, signal: AbortSignal.timeout(45_000) });
    const raw_html = await response.text();
    const full_body_evidence = htmlToText(raw_html);
    const valid = response.ok && full_body_evidence.length >= 500;
    records.push({
      url, retrieved_at, http_status: response.status, capture_status: valid ? 'body_captured_direct_html' : 'not_present_in_current_feed_or_direct_body_unavailable',
      title: (raw_html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]*>/g, '').trim() || null,
      published_at: raw_html.match(/\"datePublished\"\s*:\s*\"([^\"]+)\"/)?.[1] || null,
      body_characters: valid ? full_body_evidence.length : 0,
      raw_html: valid ? raw_html : null, full_body_evidence: valid ? full_body_evidence : null,
      sha256: valid ? crypto.createHash('sha256').update(raw_html).digest('hex') : null,
    });
  } catch (error) {
    records.push({ url, retrieved_at, capture_status: 'fetch_error', error: error.message, body_characters: 0, full_body_evidence: null });
  }
}
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, `${JSON.stringify({
  schema: 'article_source_evidence_v1', captured_at: new Date().toISOString(), source: 'VSiN',
  scope: 'Current Week 5 NFL hub articles identified from the VSiN public RSS feed',
  status: 'raw_source_evidence_only', records,
  risks: ['RSS bodies are publication-time content, not current executable prices.', 'Missing feed entries are retained as explicit gaps.'],
}, null, 2)}\n`, 'utf8');
console.log(`wrote ${out}; captured=${records.filter((r) => r.capture_status === 'body_captured_from_rss').length}; missing=${records.filter((r) => r.capture_status !== 'body_captured_from_rss').length}`);
