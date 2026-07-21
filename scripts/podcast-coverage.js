#!/usr/bin/env node
// scripts/podcast-coverage.js
// ═══════════════════════════════════════════════════════════════════════════════
// Podcast coverage/freshness check.
//
// Why this exists: neither podcast-ingest.js nor podcast-reextract.js report
// whether all configured shows are actually caught up. Freshness has only ever
// been checked ad hoc via Supabase SQL. This gives a one-shot answer per feed:
//   - latest episode we've actually ingested (from podcast_episodes)
//   - latest episode the RSS feed itself has published
//   - how far behind we are, and episode processing-status breakdown
//
// Usage:
//   node scripts/podcast-coverage.js               # human-readable table
//   node scripts/podcast-coverage.js --json         # machine-readable
//   node scripts/podcast-coverage.js --show "Sharp" # substring filter on feed name
//   node scripts/podcast-coverage.js --stale-days 3 # flag threshold (default 2)
//
// Exit code: 0 if every active feed is within the stale-days threshold, 1 if any
//   feed is stale, has zero ingested episodes, or its RSS couldn't be fetched.
//   (Exit code is meant to make this cron/CI-usable later.)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const JSON_OUT    = hasFlag('--json');
const SHOW_FILTER = (argVal('--show', '') || '').toLowerCase();
const STALE_DAYS  = Number(argVal('--stale-days', '2')) || 2;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Lightweight RSS parsing (same approach as agents/podcast-ingest.js) ───────

function tag(xml, tagName) {
  const open  = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, 'i');
  const close = new RegExp(`<\\/${tagName}>`, 'i');
  const openM = xml.match(open);
  if (!openM) return null;
  const start = openM.index + openM[0].length;
  const closeM = xml.slice(start).match(close);
  if (!closeM) return null;
  return xml.slice(start, start + closeM.index).replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

/** Returns the pubDate (Date|null) of the first <item> in the feed — feeds list newest-first. */
export function latestRssPubDate(xml) {
  const items = xml.split(/<item[\s>]/).slice(1);
  if (!items.length) return null;
  const pubDateStr = tag(items[0], 'pubDate');
  if (!pubDateStr) return null;
  const d = new Date(pubDateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function fetchRss(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ─── Formatting ────────────────────────────────────────────────────────────────

export function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function fmtDate(d) {
  return d ? d.toISOString().slice(0, 10) : '—';
}

export function classifyFlag({ rssError, totalEpisodes, behindDays, staleDays }) {
  if (rssError) return 'rss_error';
  if (totalEpisodes === 0) return 'never_ingested';
  if (behindDays !== null && behindDays > staleDays) return 'stale';
  return 'ok';
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: feeds, error: fErr } = await supabase
    .from('podcast_feeds')
    .select('id, name, expert, rss_url, active')
    .order('name');
  if (fErr) { console.error(`❌ load feeds: ${fErr.message}`); process.exit(1); }
  if (!feeds?.length) { console.error('  No podcast_feeds rows found.'); process.exit(1); }

  const filtered = SHOW_FILTER
    ? feeds.filter(f => f.name.toLowerCase().includes(SHOW_FILTER))
    : feeds;

  const results = [];
  for (const feed of filtered) {
    // Latest ingested episode for this feed (any status).
    const { data: latestEp } = await supabase
      .from('podcast_episodes')
      .select('pub_date, status')
      .eq('feed_id', feed.id)
      .order('pub_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Status breakdown across all episodes for this feed.
    const { data: allEps } = await supabase
      .from('podcast_episodes')
      .select('status')
      .eq('feed_id', feed.id);
    const statusCounts = {};
    for (const e of allEps || []) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    const totalEpisodes = (allEps || []).length;

    let rssLatest = null, rssError = null;
    try {
      const xml = await fetchRss(feed.rss_url);
      rssLatest = latestRssPubDate(xml);
    } catch (err) {
      rssError = err.message;
    }

    const ingestedLatest = latestEp?.pub_date ? new Date(latestEp.pub_date) : null;
    const behindDays = daysBetween(rssLatest, ingestedLatest);
    const flag = classifyFlag({ rssError, totalEpisodes, behindDays, staleDays: STALE_DAYS });

    results.push({
      name: feed.name,
      expert: feed.expert,
      active: feed.active,
      total_episodes: totalEpisodes,
      status_counts: statusCounts,
      latest_ingested: fmtDate(ingestedLatest),
      latest_rss: rssError ? null : fmtDate(rssLatest),
      behind_days: behindDays,
      rss_error: rssError,
      flag,
    });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('Podcast Coverage Report');
    console.log(`(stale threshold: >${STALE_DAYS} days behind)\n`);
    const nameW = Math.max(4, ...results.map(r => r.name.length));
    console.log(
      `${'Show'.padEnd(nameW)}  ${'Active'.padEnd(6)}  ${'Ingested'.padEnd(10)}  ${'RSS Latest'.padEnd(10)}  ${'Behind'.padEnd(7)}  ${'Episodes'.padEnd(8)}  Flag`
    );
    for (const r of results) {
      const behindStr = r.behind_days === null ? '—' : `${r.behind_days}d`;
      const flagStr = r.flag === 'ok' ? '✅ ok'
        : r.flag === 'stale' ? `⚠️  stale`
        : r.flag === 'never_ingested' ? '🛑 never ingested'
        : `🛑 rss_error: ${r.rss_error}`;
      console.log(
        `${r.name.padEnd(nameW)}  ${(r.active ? 'yes' : 'no').padEnd(6)}  ${r.latest_ingested.padEnd(10)}  ${(r.latest_rss || '—').padEnd(10)}  ${behindStr.padEnd(7)}  ${String(r.total_episodes).padEnd(8)}  ${flagStr}`
      );
    }
    const badCount = results.filter(r => r.flag !== 'ok').length;
    console.log(`\n${results.length} feed(s) checked, ${badCount} need attention.`);
  }

  const anyBad = results.some(r => r.flag !== 'ok');
  process.exit(anyBad ? 1 : 0);
}

// Only auto-run when executed directly (`node scripts/podcast-coverage.js`), not
// when imported by tests for the pure helper functions above.
// Uses pathToFileURL rather than a plain `file://${process.argv[1]}` template
// string, which breaks on Windows: process.argv[1] is a backslash path
// (E:\dev\...) and doesn't match the forward-slash file:// URL import.meta.url
// actually produces (file:///E:/dev/...), so the guard would silently never
// fire and the script would exit with no output at all -- exactly what happened
// when this ran on Andy's Windows machine.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
}
