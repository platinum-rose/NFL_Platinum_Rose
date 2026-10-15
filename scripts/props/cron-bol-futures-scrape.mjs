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
import { writeImportFile } from './beo-futures-to-imports.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOCK_FILE = path.join(REPO_ROOT, '.chrome-bol', 'bol-scraper.lock'); // shared: never run alongside props scrape
const CDP = 'http://127.0.0.1:9223';

const DEFAULT_URLS = [
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/conference-futures',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/division-futures',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/super-bowl-exact-matchup',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/super-bowl-futures',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-regular-season/first-head-coach-fired',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-team-wins/most-regular-season-wins',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-team-wins/regular-season-wins',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-team-wins/worst-record',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-playoff-specials/seeding',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-playoff-specials/to-make-the-playoffs',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/coach-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/comeback-player-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/defensive-player-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/defensive-rookie-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/mvp',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/offensive-player-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/offensive-rookie-of-the-year',
  'https://www.betonline.ag/sportsbook/futures-and-props/nfl-draft/1st-overall-pick',
];

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : null;
};
const flag = (k) => process.argv.includes(k);
const PROBE = process.argv.includes('--probe');

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

const DATE_RE = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)$|^(?:Today|Tomorrow),?\s+\d{1,2}:\d{2}\s*(?:AM|PM)$|^[A-Z][a-z]{2}\s+\d{1,2},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)$/i;
const SKIP = /^(read more|show more|show less|live now|live|starting in|all|american odds|decimal odds|fractional odds|spread|moneyline|total)$/i;

export function parseFuturesDump(rawText) {
  const rows = [];
  const bad = [];
  const orphans = { count: 0 };
  const seen = new Set();
  const pages = rawText.split(/^=== PAGE\|/m).slice(1);
  for (const pg of pages) {
    const nl = pg.indexOf('\n');
    const url = pg.slice(0, nl).split('|')[0];
    const body = pg.slice(nl + 1).split(/^=== END PAGE/m)[0];
    for (const snap of body.split(/^=== SNAP ===$/m)) {
      const lines = snap.split('\n').map(clean).filter(Boolean);
      let market = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^live now$/i.test(line)) { market = null; continue; }
        if (DATE_RE.test(line)) {
          // market header is the nearest previous line that is not odds / noise
          let j = i - 1;
          while (j >= 0 && (ODDS_RE.test(lines[j]) || SKIP.test(lines[j]))) j--;
          market = j >= 0 ? lines[j] : null;
          continue;
        }
        if (ODDS_RE.test(line)) {
          const odds = toAmerican(line);
          let j = i - 1;
          while (j >= 0 && (ODDS_RE.test(lines[j]) || SKIP.test(lines[j]))) j--;
          const sel = j >= 0 && !DATE_RE.test(lines[j]) ? lines[j] : null;
          if (market === null) { orphans.count++; continue; }
          if (!sel || odds === null || Math.abs(odds) < 100 || Math.abs(odds) > 1000000) { bad.push({ url, line: i, market, sel, raw: line }); continue; }
          const key = `${market}|${sel}|${odds}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ url, market, selection: sel, odds });
        }
      }
    }
  }
  // Disambiguate per-team markets that share bare team names across pages.
  for (const r of rows) {
    if (/\/nfl-team-wins\/regular-season-wins/.test(r.url)) r.market = `Win Total: ${r.market}`;
    else if (/\/to-make-the-playoffs/.test(r.url) && !/playoff/i.test(r.market)) r.market = `To Make Playoffs: ${r.market}`;
  }
  return { rows, bad, orphans: orphans.count };
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
  // Also emit the dated import file the futures pipeline reads (data/futures-imports/betonline-<day>.json).
  // Non-fatal: the capture above is already saved. Supabase is NOT touched here; run
  // `node scripts/backfill-futures-imports.js` afterwards to reconcile (see docs/BEO_FUTURES_INGESTION_WORKFLOW.md).
  let imp = null;
  try {
    imp = writeImportFile({ schema: 'betonline_futures_v1', capturedAt: st.iso, rows }, st.day);
  } catch (err) {
    imp = { written: false, reason: `import conversion failed: ${err.message}` };
  }
  return { rawPath, jsonPath, mdPath, imp };
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
      // SPA settle: wait for network idle, then a fixed extra wait (sidebar live odds satisfy the check above too early)
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(PROBE ? 10000 : 6000);
      if (PROBE) {
        const probe = await page.evaluate(() => {
          const odds = /(^|\n)\s*[+\-\u2212]\d{3,5}\s*(?=\n|$)/g;
          const info = { href: location.href, title: document.title, bodyLen: (document.body.innerText || '').length, iframes: document.querySelectorAll('iframe').length };
          const sel = ['main', '[role="main"]', '#root', '#app', 'app-root', '[class*="content"]', '[class*="Content"]', '[class*="market"]', '[class*="Market"]', '[class*="futures"]', '[class*="Futures"]', '[class*="odds"]', '[class*="Odds"]'];
          info.containers = sel.map((s) => ({ s, n: document.querySelectorAll(s).length, maxLen: Math.max(0, ...Array.from(document.querySelectorAll(s)).map((e) => (e.innerText || '').length)) }));
          const cands = Array.from(document.querySelectorAll('div,section,ul,table,main')).map((e) => {
            const t = e.innerText || ''; return { tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 90), len: t.length, odds: (t.match(odds) || []).length, head: t.slice(0, 120).replace(/\s+/g, ' ') };
          }).filter((c) => c.odds > 0);
          cands.sort((a, b) => b.odds - a.odds || a.len - b.len);
          info.topOddsContainers = cands.slice(0, 25);
          return info;
        });
        probe.frames = page.frames().map((f) => ({ url: f.url() }));
        blocks.push(`=== PROBE|${url}\n${JSON.stringify(probe, null, 2)}\n=== END PROBE`);
        try {
          const shot = path.join(REPO_ROOT, 'data', 'generated', 'futures', `probe-${new Date().toISOString().replace(/[:.]/g, '-')}-${seen.size}.png`);
          fs.mkdirSync(path.dirname(shot), { recursive: true });
          await page.screenshot({ path: shot, fullPage: false });
          console.log(`   📸 ${shot}`);
        } catch {}
      }
      // Expand every market with real clicks ("SHOW MORE" until none left), wheel-scroll the page, and snapshot <main> text
      // after each step (the list is virtualized). Never click aria-expanded / nav items: that navigates away.
      const snaps = []; let prev = null; let same = 0; let steps = 0;
      await page.mouse.move(640, 500);
      for (let step = 0; step < 150; step++) {
        steps++;
        for (let k = 0; k < 80; k++) {
          const loc = page.locator('main').getByText(/^\s*show more\s*$/i);
          if (!(await loc.count())) break;
          try { await loc.first().click({ timeout: 2500 }); } catch { break; }
          await page.waitForTimeout(200);
        }
        const t = await page.evaluate(() => (document.querySelector('main') || document.body).innerText || '');
        if (t !== prev) { snaps.push(t); prev = t; same = 0; } else if (++same >= 3) break;
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(450);
      }
      const text = snaps.join('\n=== SNAP ===\n');
      const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => a.href));
      console.log(`   captured ${text.length} chars in ${snaps.length} snapshots over ${steps} steps`);
      blocks.push(`=== PAGE|${url}|${new Date().toISOString()}\n${text}\n=== END PAGE`);

      if (discover) {
        for (const l of links) {
          if (/betonline\.ag\/sportsbook\/futures-and-props\/nfl(?!-game-props)/i.test(l) && !seen.has(l) && !queue.includes(l)) {
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
    urls = arg('--urls') ? arg('--urls').split(',').map((s) => s.trim()).filter(Boolean)
      : PROBE ? ['https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/super-bowl-futures', 'https://www.betonline.ag/sportsbook/futures-and-props/nfl-player-futures/mvp']
        : DEFAULT_URLS;
  }

  try {
    if (!parseOnly) {
      console.log(`\n🏈 BetOnline NFL futures capture (${st.day}) ${dry ? '[DRY RUN]' : ''}\n`);
      await ensureChromeRunning();
      rawText = await capturePages(urls, flag('--discover') && !PROBE);
      {
        // always keep the raw capture (dry run included), even if the gate fails
        const rawPath = path.join(REPO_ROOT, 'data', 'generated', 'futures', `betonline-futures-${st.day}_${st.hhmm}${dry ? '.dry' : ''}.raw.txt`);
        fs.mkdirSync(path.dirname(rawPath), { recursive: true });
        fs.writeFileSync(rawPath, rawText, 'utf8');
        console.log(`💾 Raw dump: ${rawPath}`);
      }
    }

    if (PROBE) { console.log('\n🔎 Probe done: raw + screenshots saved, nothing parsed.'); return; }
    const { rows, bad, orphans } = parseFuturesDump(rawText);
    if (orphans) console.log(`   (ignored ${orphans} odds outside any market: sidebar/live scores)`);
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
    console.log(out.imp?.written
      ? `💾 ${out.imp.target} (${out.imp.rows} rows) — next: node scripts/backfill-futures-imports.js --dry-run, then without --dry-run`
      : `ℹ️ futures-imports file not written: ${out.imp?.reason}`);
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
