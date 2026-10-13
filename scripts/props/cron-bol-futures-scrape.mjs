#!/usr/bin/env node
// scripts/props/cron-bol-futures-scrape.mjs
// ==============================================================================
// BetOnline.ag NFL FUTURES capture (Super Bowl, conference, division, awards, win totals...)
// Same plumbing as cron-bol-scrape.mjs: CDP port 9223, .chrome-bol profile, lock file,
// dedicated capture tab (never touches operator tabs).
//
// Usage (PowerShell, after `npm run props:bol:launch` and being logged-in/geo-OK in that Chrome):
//   npm run futures:bol                 # capture + write
//   npm run futures:bol -- --dry-run    # capture + parse + gate, write nothing
//   npm run futures:bol -- --urls "https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures"
//   npm run futures:bol -- --no-discover  # only the listed URLs, no sub-page link discovery
//   npm run futures:bol -- --parse-only data\generated\futures\betonline-futures-<stamp>.raw.txt
//
// The raw page text is ALWAYS saved first (even if the parse gate fails) so the parser can be
// fixed offline without recapturing.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { acquireLock, releaseLock } from './cron-bol-scrape.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOCK_FILE = path.join(REPO_ROOT, '.chrome-bol', 'bol-scraper.lock'); // shared: never run alongside props scrape
const CDP = 'http://127.0.0.1:9223';

const DEFAULT_URLS = [
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/conference-futures',
];

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : null;
};
const flag = (k) => process.argv.includes(k);

const ODDS_RE = /^[+\-−]\s?\d{2,6}$/;

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return {
    mmdd: `${p(d.getMonth() + 1)}${p(d.getDate())}`,
    hhmm: `${p(d.getHours())}${p(d.getMinutes())}`,
    iso: d.toISOString(),
    day: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
  };
}

async function isCdpAvailable() {
  try {
    const res = await fetch(`${CDP}/json/version`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureChromeRunning() {
  if (await isCdpAvailable()) return true;
  console.log('🌐 Chrome CDP not detected on port 9223. Launching .chrome-bol Chrome...');
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error('Chrome executable not found.');
  const profileDir = path.join(REPO_ROOT, '.chrome-bol');
  fs.mkdirSync(profileDir, { recursive: true });
  const proc = spawn(chromePath, [
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    DEFAULT_URLS[0],
  ], { detached: true, stdio: 'ignore' });
  proc.unref();
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isCdpAvailable()) return true;
  }
  throw new Error('Failed to connect to Chrome on port 9223 after launch.');
}

// ---------- parser (pure; works on the raw dump text) ----------

const clean = (s) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

function toAmerican(tok) {
  const n = Number(tok.replace(/[−\s]/g, (c) => (c === '−' ? '-' : '')));
  return Number.isFinite(n) ? n : null;
}

// Lines that are page chrome, never a market header or selection.
const NOISE = /^(login|join now|sports|casino|live betting|poker|racebook|promotions|my account|deposit|bet slip|straight|parlay|teaser|open bets|clear|place bet|odds format|american|decimal|fractional|all|menu|search|help|more|show more|show less|view all|collapse|expand|futures|props|home|back|nfl|nfl futures|football|\d+)$/i;

export function parseFuturesDump(rawText) {
  const rows = [];
  const bad = [];
  const pages = rawText.split(/^=== PAGE\|/m).slice(1);
  for (const pg of pages) {
    const nl = pg.indexOf('\n');
    const head = pg.slice(0, nl).split('|');
    const url = head[0];
    const body = pg.slice(nl + 1).split(/^=== END PAGE/m)[0];
    const lines = body.split('\n').map(clean).filter(Boolean);

    let market = null;
    let run = []; // consecutive non-odds, non-noise lines since the last odds line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (ODDS_RE.test(line)) {
        const odds = toAmerican(line);
        const sel = run.length ? run[run.length - 1] : null;
        if (run.length > 1) market = run.slice(0, -1).join(' / ');
        run = [];
        if (!sel || odds === null || Math.abs(odds) < 100 || Math.abs(odds) > 1000000) {
          bad.push({ url, line: i, sel, raw: line });
          continue;
        }
        rows.push({ url, market: market || 'UNKNOWN', selection: sel, odds });
      } else if (!NOISE.test(line)) {
        run.push(line);
      }
    }
  }
  return { rows, bad };
}

export function validateFuturesGate({ rows, bad, pageCount }) {
  const errors = [];
  const warnings = [];
  if (pageCount === 0) errors.push('No pages captured.');
  if (rows.length < 20) errors.push(`Only ${rows.length} priced rows parsed (expected dozens+).`);
  if (bad.length > 0) errors.push(`${bad.length} bad row(s) (odds without a selection or out of range).`);
  const unknown = rows.filter((r) => r.market === 'UNKNOWN').length;
  if (unknown > 0) warnings.push(`${unknown} row(s) have no detected market header (UNKNOWN).`);
  const dup = new Set();
  for (const r of rows) {
    const k = `${r.market}|${r.selection}|${r.odds}`;
    if (dup.has(k)) warnings.push(`Duplicate row ${k}`);
    dup.add(k);
  }
  const sb = rows.filter((r) => /super\s*bowl/i.test(r.market));
  if (sb.length && sb.length < 32) warnings.push(`Super Bowl market has ${sb.length} selections (expected 32).`);
  return { passed: errors.length === 0, errors, warnings };
}

function renderMarkdown(rows, st, urls) {
  const out = [];
  out.push(`# BetOnline (BEO) NFL futures, captured ${st.day} ${st.hhmm.slice(0, 2)}:${st.hhmm.slice(2)} local`);
  out.push('');
  out.push(`Source: scripts/props/cron-bol-futures-scrape.mjs via CDP (.chrome-bol). Pages: ${urls.join(' ; ')}`);
  out.push('American odds copied unchanged. Market headers are heuristic from page text; see the .raw.txt for ground truth.');
  const byMarket = new Map();
  for (const r of rows) {
    if (!byMarket.has(r.market)) byMarket.set(r.market, []);
    byMarket.get(r.market).push(r);
  }
  for (const [m, rs] of byMarket) {
    out.push('', `## ${m}`);
    const fmt = (r) => `${r.selection} ${r.odds > 0 ? '+' : ''}${r.odds}`;
    for (let i = 0; i < rs.length; i += 6) out.push(rs.slice(i, i + 6).map(fmt).join(' | '));
  }
  return out.join('\n') + '\n';
}

function writeOutputs({ rawText, rows, urls, st }) {
  const tag = `${st.mmdd}_${st.hhmm}`;
  const rawPath = path.join(REPO_ROOT, 'data', 'generated', 'futures', `betonline-futures-${st.day}_${st.hhmm}.raw.txt`);
  const jsonPath = path.join(REPO_ROOT, 'data', 'generated', 'futures', `betonline-futures-${st.day}_${st.hhmm}.json`);
  const mdPath = path.join(REPO_ROOT, 'data', 'odds', `BEO_futures_${tag}.md`);
  fs.mkdirSync(path.dirname(rawPath), { recursive: true });
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify({
    schema: 'betonline_futures_v1', book: 'BEO', capturedAt: st.iso, urls,
    summary: { rows: rows.length, markets: new Set(rows.map((r) => r.market)).size },
    rows,
  }, null, 2), 'utf8');
  fs.writeFileSync(mdPath, renderMarkdown(rows, st, urls), 'utf8');
  return { rawPath, jsonPath, mdPath };
}

// ---------- capture ----------

async function capturePages(urls, discover) {
  console.log('🔌 Connecting to browser via CDP...');
  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0] || await browser.newContext();
  const page = await ctx.newPage(); // dedicated tab
  const seen = new Set();
  const queue = [...urls];
  const blocks = [];
  try {
    while (queue.length && seen.size < 25) {
      const url = queue.shift();
      if (seen.has(url)) continue;
      seen.add(url);
      console.log(`➡️  ${url}`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      } catch (e) {
        console.warn(`   ⚠️ navigation problem: ${e.message}`);
        continue;
      }
      // wait until something odds-shaped renders
      try {
        await page.waitForFunction(
          () => /(^|\n)\s*[+\-−]\d{3,5}\s*(\n|$)/.test(document.body.innerText),
          null, { timeout: 25000 },
        );
      } catch {
        console.warn('   ⚠️ no odds-like text rendered within 25s (login/geo wall? wrong URL?)');
      }
      // expand collapsed sections + scroll to trigger lazy render
      await page.evaluate(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        for (const el of Array.from(document.querySelectorAll('[aria-expanded="false"]')).slice(0, 80)) {
          try { el.click(); } catch {}
          await sleep(60);
        }
        for (let y = 0; y < 30; y++) { window.scrollBy(0, 900); await sleep(250); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);

      const { text, links } = await page.evaluate(() => ({
        text: document.body.innerText || '',
        links: Array.from(document.querySelectorAll('a[href]')).map((a) => a.href),
      }));
      console.log(`   captured ${text.length} chars`);
      blocks.push(`=== PAGE|${url}|${new Date().toISOString()}\n${text}\n=== END PAGE`);

      if (discover) {
        for (const l of links) {
          if (/betonline\.ag\/sportsbook\/futures-and-props\/nfl/i.test(l) && !seen.has(l) && !queue.includes(l)) {
            queue.push(l.split('#')[0]);
          }
        }
      }
    }
  } finally {
    if (!page.isClosed()) await page.close().catch(() => {});
  }
  return blocks.join('\n\n') + '\n';
}

async function run() {
  const dry = flag('--dry-run');
  const parseOnly = arg('--parse-only');
  const st = stamp();

  let rawText;
  let urls;
  let lockToken = null;

  if (parseOnly) {
    rawText = fs.readFileSync(path.resolve(parseOnly), 'utf8');
    urls = [...rawText.matchAll(/^=== PAGE\|([^|\n]+)/gm)].map((m) => m[1]);
  } else {
    lockToken = acquireLock(LOCK_FILE);
    if (!lockToken) return;
    urls = arg('--urls') ? arg('--urls').split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_URLS;
  }

  try {
    if (!parseOnly) {
      console.log(`\n🏈 BetOnline NFL futures capture (${st.day}) ${dry ? '[DRY RUN]' : ''}\n`);
      await ensureChromeRunning();
      rawText = await capturePages(urls, !flag('--no-discover'));
      if (!dry) {
        // always keep the raw capture, even if the gate fails
        const rawPath = path.join(REPO_ROOT, 'data', 'generated', 'futures', `betonline-futures-${st.day}_${st.hhmm}.raw.txt`);
        fs.mkdirSync(path.dirname(rawPath), { recursive: true });
        fs.writeFileSync(rawPath, rawText, 'utf8');
        console.log(`💾 Raw dump: ${rawPath}`);
      }
    }

    const { rows, bad } = parseFuturesDump(rawText);
    const pageCount = (rawText.match(/^=== PAGE\|/gm) || []).length;
    const gate = validateFuturesGate({ rows, bad, pageCount });

    const markets = new Map();
    for (const r of rows) markets.set(r.market, (markets.get(r.market) || 0) + 1);
    console.log(`\n📊 ${rows.length} rows, ${markets.size} markets, ${pageCount} pages`);
    for (const [m, n] of markets) console.log(`   - ${m}: ${n}`);
    for (const w of gate.warnings.slice(0, 15)) console.warn(`   ⚠️ ${w}`);

    if (!gate.passed) {
      console.error('\n❌ GATE FAILED:');
      for (const e of gate.errors) console.error(`   - ${e}`);
      if (bad.length) console.error('   sample bad rows:', JSON.stringify(bad.slice(0, 5)));
      throw new Error('Futures gate failed. Raw dump kept (if not --dry-run); no parsed files written.');
    }

    if (dry) {
      console.log('\n✅ Gate passed (dry run, nothing written).');
      return;
    }
    const out = writeOutputs({ rawText, rows, urls, st });
    console.log(`\n✅ Gate passed.\n💾 ${out.mdPath}\n💾 ${out.jsonPath}`);
  } finally {
    if (lockToken) releaseLock(LOCK_FILE, lockToken);
  }
}

if (process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  run().then(() => process.exit(0)).catch((err) => {
    console.error('\n❌ Futures scraper error:', err.message);
    process.exit(1);
  });
}
