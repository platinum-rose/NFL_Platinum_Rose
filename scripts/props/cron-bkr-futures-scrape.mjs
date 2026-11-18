#!/usr/bin/env node
// scripts/props/cron-bkr-futures-scrape.mjs
// ==============================================================================
// Bookmaker.eu NFL FUTURES capture, reference only (no wagers, no ledger/Supabase writes).
// Same plumbing as cron-bkr-scrape.mjs: CDP port 9222 (BKR Chrome profile), shared lock file,
// a dedicated capture tab that is closed afterwards (operator tabs are never touched).
//
// Usage (from the repo root, BKR Chrome signed in):
//   .\runbkrfutures.cmd                       # capture the 4 default BKR futures pages (SB, AFC, NFC, divisions)
//   .\runbkrfutures.cmd --discover            # try link discovery from the old NFL board instead
//   .\runbkrfutures.cmd --list                # only print the futures links it finds
//   .\runbkrfutures.cmd --urls "https://be.bookmaker.eu/en/sports/football/..." [more urls]
//
// Output: raw page text per page (always written first) to
//   data/generated/futures/bookmaker-futures-<stamp>.raw.txt  (+ copy in data/research-intel/source-evidence/)
// Added 2026-11-12 by Claude Team 2.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const LOCK_PATH = path.join(REPO_ROOT, '.chrome-bkr', 'bkr-scraper.lock'); // shared with the props capture
const CDP = 'http://127.0.0.1:9222';
const BASE = 'https://be.bookmaker.eu';
const NFL_BOARD = BASE + '/en/sports/football/nfl/game-lines/';

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const urlIdx = args.indexOf('--urls');
const cliUrls = urlIdx >= 0 ? args.slice(urlIdx + 1).filter((a) => !a.startsWith('--')) : [];
// BKR's current sportsbook UI (seen 2026-11-12) uses category GUID pages with no futures hrefs to discover,
// so these four pages are the defaults: Super Bowl, AFC, NFC, Divisions.
const FUT = 'https://be.bookmaker.eu/sportsbook/category/sport/EA5AE3D9-5311-41DE-BB4E-FF45F149AC86/seclvlcat/';
const DEFAULT_URLS = ['3E571623-6264-48AA-88CB-E14A1292E9D4', '2C58D534-5C94-4FA4-9ED7-C39AB7B90034', 'D2CEF581-1C53-4CD6-B3FD-B725B03AE4A8', '74528B1B-6D9D-4C16-A8EC-B2C981DB82D6'].map((g) => FUT + g);
const explicitUrls = cliUrls.length ? cliUrls : (args.includes('--discover') ? [] : DEFAULT_URLS);

function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  const token = randomUUID();
  const payload = JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString(), job: 'futures' });
  try {
    fs.writeFileSync(LOCK_PATH, payload, { flag: 'wx' });
    return token;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    let existing = null;
    try { existing = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8')); } catch {}
    if (existing?.pid) {
      try { process.kill(existing.pid, 0); console.log('Another Bookmaker capture is running; try again when it finishes.'); return null; } catch {}
    }
    fs.rmSync(LOCK_PATH, { force: true });
    fs.writeFileSync(LOCK_PATH, payload, { flag: 'wx' });
    return token;
  }
}
function releaseLock(token) {
  try {
    const existing = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
    if (existing.token === token) fs.rmSync(LOCK_PATH, { force: true });
  } catch {}
}

async function cdpUp() {
  try { return (await fetch(CDP + '/json/version', { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

async function discoverFuturesLinks(page) {
  await page.goto(NFL_BOARD, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  return page.evaluate(() => {
    const out = new Map();
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      const text = (a.innerText || '').replace(/\s+/g, ' ').trim();
      const hay = (href + ' ' + text).toLowerCase();
      if (!hay.includes('futur')) continue;
      if (!/football|nfl|super ?bowl/.test(hay)) continue;
      const abs = href.startsWith('http') ? href : location.origin + (href.startsWith('/') ? '' : '/') + href;
      if (!out.has(abs)) out.set(abs, text);
    }
    return [...out.entries()].map(([url, text]) => ({ url, text }));
  });
}

async function capturePage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  // Scroll to the bottom in steps so lazy sections render, then expand collapsed headers once.
  for (let i = 0; i < 15; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, 1500); return window.innerHeight + window.scrollY >= document.body.scrollHeight - 5; });
    await page.waitForTimeout(600);
    if (done) break;
  }
  const expanded = await page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll('[aria-expanded="false"]')) {
      if (n >= 80) break;
      try { el.click(); n++; } catch {}
    }
    return n;
  });
  if (expanded) await page.waitForTimeout(4000);
  return page.evaluate(() => ({
    url: location.href,
    title: document.title,
    loginForm: !!document.querySelector('input[type="password"]'),
    text: document.body?.innerText || '',
  }));
}

async function run() {
  const token = acquireLock();
  if (!token) return;
  let page;
  try {
    if (!(await cdpUp())) throw new Error('BKR Chrome not reachable on port 9222. Start it the way runbkrprops.cmd does (or run runbkrprops.cmd once), sign in, then rerun.');
    const browser = await chromium.connectOverCDP(CDP);
    const ctx = browser.contexts()[0] || (await browser.newContext());
    page = await ctx.newPage();

    let urls = explicitUrls;
    if (!urls.length) {
      const found = await discoverFuturesLinks(page);
      console.log(`Futures links found on the NFL board: ${found.length}`);
      for (const f of found) console.log(`  - ${f.text || '(no text)'}  ${f.url}`);
      urls = found.map((f) => f.url);
      if (!urls.length) {
        const diag = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => (a.innerText || '').trim() + ' | ' + a.getAttribute('href')).filter((s) => /football|nfl/i.test(s)).slice(0, 150));
        const dpath = path.join(REPO_ROOT, 'data', 'generated', 'futures', 'diagnostics', `bkr-futures-nolinks-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(dpath), { recursive: true });
        fs.writeFileSync(dpath, JSON.stringify(diag, null, 2));
        throw new Error(`No futures links found. Football links saved to ${dpath}. Rerun with --urls "<futures page url>".`);
      }
    }
    if (listOnly) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blocks = [`BKR_FUTURES_HEADER|${new Date().toISOString()}|pages=${urls.length}`];
    for (const url of urls) {
      console.log(`Capturing ${url} ...`);
      try {
        const r = await capturePage(page, url);
        if (r.loginForm) console.log('  ⚠️ Page shows a login form: sign in to the BKR Chrome and rerun if prices are missing.');
        console.log(`  ${r.text.length} chars, title "${r.title}"`);
        blocks.push(`PAGE|${r.url}|${r.title}|${new Date().toISOString()}`, 'RAW_TEXT_START', r.text, 'RAW_TEXT_END');
      } catch (e) {
        console.log(`  ❌ ${e.message}`);
        blocks.push(`PAGE_ERROR|${url}|${e.message}`);
      }
    }
    const raw = blocks.join('\n') + '\n';
    const out1 = path.join(REPO_ROOT, 'data', 'generated', 'futures', `bookmaker-futures-${stamp}.raw.txt`);
    const out2 = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${stamp.slice(0, 10)}-bkr-futures.raw.txt`);
    for (const o of [out1, out2]) { fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, raw, 'utf8'); }
    console.log(`\n💾 Saved: ${out1} (${Math.round(raw.length / 1024)} KB)\n   copy: ${out2}`);
  } finally {
    if (page) await page.close().catch(() => {});
    releaseLock(token);
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
