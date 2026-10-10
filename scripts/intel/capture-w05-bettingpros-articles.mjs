#!/usr/bin/env node
// Evidence-only capture for the current Week 5 BettingPros NFL index.
// It deliberately does not normalize selections, call Supabase, or create tickets.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = path.join(root, 'data', 'research-intel', 'source-evidence', '2026-10-10-bettingpros-week5-current-articles.json');

const urls = [
  'https://www.bettingpros.com/articles/nfl-first-td-scorers-picks-predictions-week-5-2026/',
  'https://www.bettingpros.com/articles/nfl-same-game-parlays-picks-eagles-vs-jaguars-week-5-2026/',
  'https://www.bettingpros.com/articles/best-nfl-bets-trends-for-week-5-2026/',
  'https://www.bettingpros.com/articles/nfl-week-5-anytime-td-scorer-win-parlays-2026/',
  'https://www.bettingpros.com/articles/nfl-week-5-picks-sleepers-longshot-bets-2026/',
  'https://www.bettingpros.com/articles/nfl-week-5-prizepicks-player-predictions-sunday-2026/',
  'https://www.bettingpros.com/articles/nfl-week-5-picks-predictions-underdog-bets-2026/',
  'https://www.bettingpros.com/articles/nfl-betting-primer-picks-predictions-week-5-2026/',
];

function metadata(markdown) {
  const title = markdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || null;
  const published = markdown.match(/^Published Time:\s*(.+)$/m)?.[1]?.trim() || null;
  const author = markdown.match(/^Author:\s*(.+)$/m)?.[1]?.trim()
    || markdown.match(/(?:^|\n)By\s+([^\n]{2,100})/m)?.[1]?.trim() || null;
  return { title, published, author };
}

function htmlToText(html) {
  return html
    .replace(/<(script|style|nav|header|footer|aside|form|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<h([1-4])[^>]*>/gi, (_, level) => `\n\n${'#'.repeat(Number(level))} `)
    .replace(/<\/h[1-4]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<(p|br|div|tr)[^>]*>/gi, '\n')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;|&#8212;/g, '-')
    .replace(/&[a-z]+;/gi, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function capture(url) {
  const retrieved_at = new Date().toISOString();
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(45_000),
    });
    const full_body = await response.text();
    const valid = response.ok && full_body.length >= 500 && !/AbuseAlleviationError|\"code\"\s*:\s*4\d\d/i.test(full_body.slice(0, 600));
    if (valid) return {
      url,
      retrieved_at,
      http_status: response.status,
      capture_status: valid ? 'body_captured' : 'body_unavailable',
      ...metadata(full_body),
      body_characters: valid ? full_body.length : 0,
      sha256: valid ? crypto.createHash('sha256').update(full_body).digest('hex') : null,
      full_body_evidence: valid ? full_body : null,
    };

    // The archive proxy sometimes rate-limits a repeated run. Preserve the
    // publisher response as raw HTML and derive a local reviewable text body.
    const direct = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-Dashboard-Evidence/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(45_000),
    });
    const raw_html = await direct.text();
    const direct_text = htmlToText(raw_html);
    const direct_valid = direct.ok && direct_text.length >= 500;
    const title = (raw_html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]*>/g, '').trim() || null;
    const published = raw_html.match(/\"datePublished\"\s*:\s*\"([^\"]+)\"/)?.[1] || null;
    return {
      url,
      retrieved_at,
      http_status: direct.status,
      capture_status: direct_valid ? 'body_captured_direct_html' : 'body_unavailable',
      title,
      published,
      author: null,
      body_characters: direct_valid ? direct_text.length : 0,
      sha256: direct_valid ? crypto.createHash('sha256').update(raw_html).digest('hex') : null,
      raw_html: direct_valid ? raw_html : null,
      full_body_evidence: direct_valid ? direct_text : null,
    };
  } catch (error) {
    return { url, retrieved_at, capture_status: 'fetch_error', error: error.message, body_characters: 0, full_body_evidence: null };
  }
}

const records = [];
for (const url of urls) {
  const record = await capture(url);
  records.push(record);
  console.log(`${record.capture_status}: ${url} (${record.body_characters || 0} chars)`);
}

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, `${JSON.stringify({
  schema: 'article_source_evidence_v1',
  captured_at: new Date().toISOString(),
  scope: 'Current Week 5 NFL articles surfaced on the BettingPros NFL article index',
  status: 'raw_source_evidence_only',
  source: 'BettingPros',
  records,
  risks: [
    'Publication-time prices and lines are source evidence, not current executable offers.',
    'No selections have been normalized or promoted by this capture.',
    'A failed or short response is retained as an explicit access gap.',
  ],
}, null, 2)}\n`, 'utf8');
console.log(`wrote ${out}`);
