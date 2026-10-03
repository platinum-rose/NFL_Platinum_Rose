#!/usr/bin/env node
// scripts/intel/archive_week_articles.mjs — save the FULL text of every article for an NFL week locally,
// so long articles are never lost to the Supabase body cap (20,000 chars) or a headline-only pull.
//
// Andy, 2026-10-03: "If we are hitting supabase character limits, then these articles should be downloaded
// and saved locally ... We can't be letting valuable intel like this slip through the cracks."
//
// Sources: (1) research_intel_notes for the week window (Supabase, READ-ONLY), (2) the Action Network NFL archive
// pages (https://www.actionnetwork.com/nfl/archive/N), which list articles the RSS feed misses.
// Fetch: betting/analysis outlets are re-fetched as structured markdown through r.jina.ai (the same proxy
// research-intel-ingest.js uses for Action Network); news outlets keep the Supabase body (short, never capped).
// Output (full text is local-only, gitignored): data/intel/articles/<season>-w<NN>/<source>/<slug>.md
//         index (committed): reports/intel/article-archive-<season>-w<NN>.md + data/intel/articles/<season>-w<NN>/index.json
// Re-runnable: skips files already saved unless --refetch. Batch with --max N (each fetch ~3-6 s).
// Then runs scripts/intel/classify_week_articles.py to tag each article (preview / team news / recap / general / out of window).
// usage: node scripts/intel/archive_week_articles.mjs --week 4 [--max 25] [--an-pages 4] [--refetch]
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WEEK = Number(arg('--week')); const SEASON = Number(arg('--season', 2026));
const MAX = Number(arg('--max', 25)); const AN_PAGES = Number(arg('--an-pages', 4)); const REFETCH = process.argv.includes('--refetch');
if (!WEEK) { console.error('usage: --week N'); process.exit(1); }
const WS = new Date(Date.parse('2026-09-08T04:00:00Z') + (WEEK - 1) * 7 * 86400000 - 86400000);   // same window as pull.mjs
const WW = String(WEEK).padStart(2, '0');
const DIR = `data/intel/articles/${SEASON}-w${WW}`;
fs.mkdirSync(DIR, { recursive: true });
const IDX = path.join(DIR, 'index.json');
const index = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, 'utf8')) : {};

// Outlets whose articles carry picks / trends / analysis: always keep full structured text.
const FULL = /^(Action Network|BettingPros|VSiN|Sharp Football|PFF|Walter Football|Pro Football Talk)$/;
// Skip obvious non-NFL-betting noise.
const SKIP_TITLE = /college|ncaa|nba |mlb|nhl|wnba|draft prospect|2027 nfl draft|promo code|casino|big brother|election/i;

function slug(u) { return u.replace(/^https?:\/\//, '').replace(/[?#].*$/, '').split('/').filter(Boolean).slice(1).join('-').replace(/[^a-z0-9\-]+/gi, '-').slice(0, 120) || 'index'; }
function srcDir(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
function jina(url) {
  try {
    const out = execFileSync('curl', ['-sS', '-m', '45', '-H', 'X-Return-Format: markdown', `https://r.jina.ai/${url}`], { maxBuffer: 20 * 1024 * 1024 }).toString('utf8');
    // r.jina.ai answers rate limits / blocks with a small JSON error body (e.g. AbuseAlleviationError): treat as a failed fetch
    if (/^\s*\{"data":null/.test(out) || /AbuseAlleviationError|"code":\s*4\d\d/.test(out.slice(0, 400))) return null;
    return out;
  } catch (e) { return null; }
}
// Fallback: fetch the page directly and keep the article's headings, paragraphs and list items as markdown-ish text.
function direct(url) {
  let html;
  try { html = execFileSync('curl', ['-sS', '-L', '-m', '45', '-A', UA, '-H', 'Accept: text/html', url], { maxBuffer: 40 * 1024 * 1024 }).toString('utf8'); } catch { return null; }
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
  let body = (html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
  body = body.replace(/<(script|style|nav|header|footer|aside|form|svg|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<h([1-4])[^>]*>/gi, (m, n) => '\n\n' + '#'.repeat(Number(n)) + ' ').replace(/<\/h[1-4]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<(p|br|div|tr)[^>]*>/gi, '\n').replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#0?38;|&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;|&#8212;/g, '-').replace(/&[a-z]+;/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n');
  const pub = (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1];
  const au = (html.match(/"author"\s*:\s*\[?\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/) || [])[1];
  return { title: title.replace(/\s*[|\-–].*$/, '').trim(), text: body.trim(), published: pub, author: au };
}
// Trim the site chrome jina returns around the article: start at the article title, stop at related/footer blocks.
function clean(md, title) {
  let body = md.split('Markdown Content:')[1] || md;
  const t = (title || '').replace(/\s*\.\.\.$/, '').slice(0, 40);
  const lines = body.split('\n');
  let start = 0;
  if (t) { const i = lines.findIndex(l => l.includes(t) && !/^\s*\*?\s*\[/.test(l)); if (i > -1) start = i; }
  let end = lines.length;
  const stop = lines.findIndex((l, i) => i > start + 5 && /^(#+\s*)?(Related (Articles|Content)|More (NFL|from|Stories)|Popular (Articles|Now)|Recommended|Trending|Latest NFL News|Most Popular|Sign up for)/i.test(l.trim()));
  if (stop > -1) end = stop;
  return lines.slice(start, end).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function meta(md) {
  const m = {};
  const pt = md.match(/^Published Time:\s*(.+)$/m); if (pt) m.published = pt[1].trim();
  const ti = md.match(/^Title:\s*(.+)$/m); if (ti) m.title = ti[1].trim();
  const au = md.match(/\n(?:By\s+)?\[?([A-Z][a-zA-Z.'\- ]{3,40})\]?\(https:\/\/www\.actionnetwork\.com\/article\/author\//) || md.match(/\bBy\s+([A-Z][a-zA-Z.'\-]+(?: [A-Z][a-zA-Z.'\-]+){1,2})\b/);
  if (au) m.author = au[1].trim();
  return m;
}

// 1) Supabase notes (read-only)
const s = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
let notes = [], from = 0;
for (;;) {
  const { data, error } = await s.from('research_intel_notes').select('source,title,summary,url,published_at,captured_at,body').gte('captured_at', WS.toISOString()).range(from, from + 999);
  if (error) { console.error(error.message); break; }
  notes = notes.concat(data); if (data.length < 1000) break; from += 1000;
}
const cand = new Map();
for (const n of notes) {
  if (!n.url || SKIP_TITLE.test(n.title || '')) continue;
  const prev = cand.get(n.url);
  if (!prev || (n.captured_at > prev.captured_at)) cand.set(n.url, { source: n.source, title: n.title, url: n.url, published: n.published_at, captured: n.captured_at, sbBody: n.body || '', summary: n.summary || '', origin: 'supabase' });
}
// 2) Action Network archive pages
for (let p = 1; p <= AN_PAGES; p++) {
  const md = jina(`https://www.actionnetwork.com/nfl/archive/${p}`); if (!md) continue;
  for (const m of md.matchAll(/\[([^\]]{10,250})\]\((https:\/\/www\.actionnetwork\.com\/nfl\/[a-z0-9\-]+)\)/g)) {
    const [_, title, u] = m;
    if (/\/nfl\/(odds|props|picks|teams|archive|futures|weather|injury-report|referee|sharp-report|public-betting|projections|prop-projections|against-the-spread)/.test(u)) continue;
    const ctx = md.slice(m.index + m[0].length, m.index + m[0].length + 400);
    const d = ctx.match(/(\w{3} \d{1,2}, 20\d\d)/); const when = d ? new Date(d[1] + ' 12:00 UTC') : null;   // no date on the archive card: decide after the fetch
    if ((when && when < WS) || SKIP_TITLE.test(title)) continue;
    if (!cand.has(u)) cand.set(u, { source: 'Action Network', title: title.trim(), url: u, published: when ? when.toISOString() : null, captured: null, sbBody: '', origin: 'an-archive' });
    else cand.get(u).origin += '+an-archive';
  }
}
// 3) save
let fetched = 0, kept = 0;
for (const c of cand.values()) {
  const file = path.join(DIR, srcDir(c.source), slug(c.url) + '.md');
  if (index[c.url] && fs.existsSync(file) && !REFETCH && !(process.argv.includes('--refetch-small') && index[c.url].chars < 1500 && FULL.test(c.source))) continue;
  let text = '', how = '', m = {};
  // News-style outlets (PFT) keep their Supabase body when it is complete; picks columns are always re-fetched.
  const newsOk = c.source === 'Pro Football Talk' && c.sbBody.length > 0 && c.sbBody.length < 19000 && !/pick|power rank|best bet/i.test(c.title || '');
  if (FULL.test(c.source) && !newsOk) {
    if (fetched >= MAX) continue;
    const md = jina(c.url); fetched++;
    if (md && md.length > 500) { m = meta(md); text = clean(md, m.title || c.title); how = 'r.jina.ai markdown'; }
    if (!text || text.length < 1500) {
      const d = direct(c.url);
      if (d && d.text.length > (text || '').length && d.text.length > 1500) { text = d.text; m = { title: d.title || m.title, author: d.author || m.author, published: d.published || m.published }; how = 'direct html'; }
    }
  }
  if (!text && !c.sbBody && /Twitter/.test(c.source) && (c.title || c.summary)) { text = [c.title, c.summary].filter(Boolean).join('\n\n'); how = 'tweet text (title + summary)'; }
  if (!text && c.sbBody) { text = c.sbBody; how = 'supabase body' + (c.sbBody.length >= 20000 ? ' (TRUNCATED at 20,000)' : ''); }
  if (!text) { index[c.url] = { source: c.source, title: c.title, url: c.url, published: c.published, origin: c.origin, file: null, chars: 0, sb_chars: c.sbBody.length, how: 'not fetched' }; continue; }
  // Archive cards without a date (evergreen pieces): keep only if the article's own date falls in the week window.
  const pubFinal = m.published || c.published;
  if (c.origin === 'an-archive' && (!pubFinal || new Date(pubFinal) < new Date(WS.getTime() - 2 * 86400000))) {
    index[c.url] = { source: c.source, title: m.title || c.title, url: c.url, published: pubFinal || null, origin: c.origin, file: null, chars: 0, sb_chars: 0, how: 'skipped: published before the week window' };
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const fm = ['---', `source: ${JSON.stringify(c.source)}`, `title: ${JSON.stringify(m.title || c.title)}`, `author: ${JSON.stringify(m.author || '')}`,
    `url: ${c.url}`, `published: ${m.published || c.published || ''}`, `captured: ${c.captured || ''}`, `fetched_at: ${new Date().toISOString()}`,
    `fetched_via: ${how}`, `supabase_body_chars: ${c.sbBody.length}`, `chars: ${text.length}`, `week: ${WEEK}`, '---', ''].join('\n');
  fs.writeFileSync(file, fm + text + '\n', 'utf8'); kept++;
  index[c.url] = { source: c.source, title: m.title || c.title, author: m.author || '', url: c.url, published: m.published || c.published, origin: c.origin,
    file, chars: text.length, sb_chars: c.sbBody.length, how };
  if (fetched && fetched % 5 === 0) fs.writeFileSync(IDX, JSON.stringify(index, null, 1), 'utf8');   // survive a timeout mid-batch
}
fs.writeFileSync(IDX, JSON.stringify(index, null, 1), 'utf8');
const rows = Object.values(index);
const pending = [...cand.values()].filter(c => !index[c.url] || !index[c.url].file).length;
console.log(`candidates ${cand.size} · saved this run ${kept} · fetched ${fetched} · indexed ${rows.length} · still to fetch ${pending}`);
// committed index (titles/urls/sizes only — no article text)
const L = [`# Article archive: ${SEASON} Week ${WEEK}`, '', `Full text saved locally (gitignored) under \`${DIR}/\` by \`scripts/intel/archive_week_articles.mjs\`. `
  + `Supabase notes for the week window plus the Action Network NFL archive pages. "sb chars" is what Supabase holds; 20,000 means the stored body was cut off.`, '',
  '| Source | Published | Title | Author | Local chars | SB chars | Via |', '|---|---|---|---|---|---|---|'];
for (const r of rows.sort((a, b) => (a.source + (b.published || '')).localeCompare(b.source + (a.published || ''))))
  L.push(`| ${r.source} | ${(r.published || '').slice(0, 10)} | [${(r.title || '').replace(/\|/g, '/').replace(/&#0?38;|&amp;/g, '&').slice(0, 90)}](${r.url}) | ${r.author || ''} | ${r.chars} | ${r.sb_chars} | ${r.how} |`);
fs.writeFileSync(`reports/intel/article-archive-${SEASON}-w${WW}.md`, L.join('\n') + '\n', 'utf8');
// Tag each article (Week N preview, team news, Week N-1 recap, general, out of window); rewrites the index report with the split.
try { console.log(execFileSync('python3', ['scripts/intel/classify_week_articles.py', '--week', String(WEEK), '--season', String(SEASON)]).toString().trim()); }
catch (e) { console.error('classify_week_articles.py failed:', e.message); }
