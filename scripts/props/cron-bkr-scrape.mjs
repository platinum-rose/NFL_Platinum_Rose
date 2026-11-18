#!/usr/bin/env node
// scripts/props/cron-bkr-scrape.mjs
// ==============================================================================
// Automated Cron / CLI Runner for Bookmaker.eu SGP & Prop Board Extraction
// Connects to a persistent Chrome instance via Chrome DevTools Protocol (CDP port 9222).
// Password-free, Cloudflare-safe, runs on a schedule or on-demand.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const NFL_GAME_PATH_PREFIX = '/en/sports/football/nfl/game-lines/';
const LOCK_PATH = path.join(REPO_ROOT, '.chrome-bkr', 'bkr-scraper.lock');

function calculateNflWeek(date = new Date()) {
  const w1Tuesday = new Date('2026-09-08T00:00:00Z');
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor((date.getTime() - w1Tuesday.getTime()) / msPerWeek);
  return Math.max(1, Math.min(18, 1 + diffWeeks));
}

async function isCdpAvailable() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureChromeRunning() {
  if (await isCdpAvailable()) return true;

  console.log('🌐 Chrome CDP not detected on port 9222. Launching background Chrome session...');
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].find(p => fs.existsSync(p));

  if (!chromePath) {
    throw new Error('Chrome executable not found on system.');
  }

  const profileDir = path.join(REPO_ROOT, '.chrome-bkr');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const proc = spawn(chromePath, [
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://be.bookmaker.eu/en/sports/football/nfl/game-lines/'
  ], { detached: true, stdio: 'ignore' });
  proc.unref();

  // Wait up to 12s for port 9222 to become available
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await isCdpAvailable()) {
      console.log('✅ Chrome session connected on port 9222.');
      return true;
    }
  }
  throw new Error('Failed to connect to Chrome on port 9222 after launch.');
}

function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  const token = randomUUID();
  const payload = JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString() });
  try {
    fs.writeFileSync(LOCK_PATH, payload, { flag: 'wx' });
    return token;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    let existing;
    try { existing = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8')); } catch { existing = null; }
    if (existing?.pid) {
      try {
        process.kill(existing.pid, 0);
        console.log('Another Bookmaker capture is already running; leaving its work untouched.');
        return null;
      } catch {}
    }
    fs.rmSync(LOCK_PATH, { force: true });
    fs.writeFileSync(LOCK_PATH, payload, { flag: 'wx' });
    return token;
  }
}

function releaseLock(token) {
  if (!token || !fs.existsSync(LOCK_PATH)) return;
  try {
    const existing = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
    if (existing.token === token) fs.rmSync(LOCK_PATH, { force: true });
  } catch {}
}

// 2026-11-13: Bookmaker moved NFL to its new Angular /sportsbook site (old /en/sports/football/nfl/game-lines/ URLs redirect).
// Flow: open the NFL board -> click each game's "+N Props" link (navigation only; never odds or the bet slip) to learn the
// game URLs -> read each game page as {head, url, at, blocks{h4 title: block text}} (bkr_sportsbook_v2_capture_v1, the format
// of the Week 9 in-page capture) -> scripts/props/bkr-sportsbook-v2-to-dump.py -> bookmaker-sgp-dump-parse.mjs.
// --probe saves the board's and the first game page's structure to data/generated/props/diagnostics/ and stops.
// NFL > GAME LINES on the new site (seen 11/13; the old URL now lands on an all-sports page). Override with --board-url <url>.
// 2026-11-17: Bookmaker's NFL > GAME LINES id (seclvlcat/...) changes during the week (58BBEF15-... on 11/13, F8576B5F-... on 11/17),
// so it is not hard-coded any more. openNflBoard(): --board-url if given; else the last URL that worked (saved in BOARD_URL_CACHE);
// else click NFL > GAME LINES in the site's left menu, the same thing Andy does by hand. The URL that renders the board is saved.
const NFL_BOARD_URL_SEED = 'https://be.bookmaker.eu/sportsbook/category/sport/EA5AE3D9-5311-41DE-BB4E-FF45F149AC86/seclvlcat/F8576B5F-F2A4-42A7-BBC5-EE050CEBDBBC';
const BOARD_URL_CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'generated', 'props', 'diagnostics', 'bkr-nfl-board-url.json');
const _bi = process.argv.indexOf('--board-url');
const BOARD_URL_ARG = _bi > 0 ? process.argv[_bi + 1] : null;
const PROPS_LINK = /^\+\s?\d+\s+Props$/i;
const PROBE = process.argv.includes('--probe');
const PROBE_TAB = process.argv.includes('--probe-tab');

function ptDate(d = new Date()) {
  return new Date(d.getTime() - 8 * 3600e3).toISOString().slice(0, 10);
}

function scheduleFor(week) {
  try {
    const all = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'public', 'schedule.json'), 'utf8'));
    return all.filter(g => g.week === week && g.season === 2026);
  } catch { return []; }
}

// Click the visible leaf element whose whole text matches re (navigation only: menu items, never odds or the bet slip).
async function clickMenuText(page, re) {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src, 'i');
    const el = [...document.querySelectorAll('body *')].find(e => rx.test((e.textContent || '').replace(/\s+/g, ' ').trim()) && e.getClientRects().length
      && ![...e.children].some(c => rx.test((c.textContent || '').replace(/\s+/g, ' ').trim())));
    if (!el) return false;
    document.querySelectorAll('[data-claude-nav]').forEach(x => x.removeAttribute('data-claude-nav'));
    el.setAttribute('data-claude-nav', '1'); return true;
  }, re.source);
  if (!ok) return false;
  await page.locator('[data-claude-nav="1"]').click({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3500);
  return true;
}

function saveBoardUrl(url) {
  try { fs.mkdirSync(path.dirname(BOARD_URL_CACHE), { recursive: true }); fs.writeFileSync(BOARD_URL_CACHE, JSON.stringify({ url, saved_at: new Date().toISOString() }, null, 2)); } catch {}
}

async function openNflBoard(page) {
  const quick = () => page.waitForFunction(() => { const t = document.body?.innerText || '';
    return /MONEY LINE/.test(t) && /SPREAD/.test(t) && /\+\s?\d+\s+Props/i.test(t); }, null, { timeout: 20000 }).then(() => true).catch(() => false);
  let cached = null; try { cached = JSON.parse(fs.readFileSync(BOARD_URL_CACHE, 'utf8')).url; } catch {}
  for (const [why, url] of [['--board-url', BOARD_URL_ARG], ['last working URL', BOARD_URL_ARG ? null : (cached || NFL_BOARD_URL_SEED)]]) {
    if (!url) continue;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (await quick()) { console.log(`   board via ${why}`); saveBoardUrl(page.url()); return true; }
    console.log(`   ${why} did not show the NFL board (${page.url()})`);
    if (BOARD_URL_ARG) return waitForBoard(page);
  }
  console.log('   finding NFL > GAME LINES in the site menu...');
  if (!/bookmaker\.eu\/sportsbook/.test(page.url())) await page.goto('https://be.bookmaker.eu/sportsbook', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  if (!(await clickMenuText(page, /^NFL$/))) { console.log('   NFL not found in the menu'); return false; }
  if (!(await clickMenuText(page, /^GAME LINES$/))) console.log('   GAME LINES tab not found; staying on the NFL page');
  if (!(await waitForBoard(page))) return false;
  saveBoardUrl(page.url());
  console.log(`   board found at ${page.url()} (saved for next run)`);
  return true;
}

async function waitForBoard(page) {
  const ok = async (ms) => page.waitForFunction(() => {
    const t = document.body?.innerText || '';
    return /MONEY LINE/.test(t) && /SPREAD/.test(t) && /\+\s?\d+\s+Props/i.test(t);
  }, null, { timeout: ms }).then(() => true).catch(() => false);
  if (await ok(30000)) return true;
  console.log('⚠️ Board not rendered after 30s; reloading once and retrying for 45s...');
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  return ok(45000);
}

async function saveDiag(page, tag, extra = {}) {
  const diagDir = path.join(REPO_ROOT, 'data', 'generated', 'props', 'diagnostics');
  fs.mkdirSync(diagDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shot = path.join(diagDir, `bkr-${tag}-${stamp}.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a,button,[role="button"],[routerlink],[ng-reflect-router-link]')];
    return {
      url: location.href, title: document.title,
      loginForm: !!document.querySelector('input[type="password"]'),
      propsLinks: els.filter(e => /\+\s?\d+\s+Props/i.test(e.innerText || '')).slice(0, 5).map(e => ({ tag: e.tagName, href: e.getAttribute('href'), cls: e.className, html: e.outerHTML.slice(0, 400) })),
      h4: [...document.querySelectorAll('h4')].slice(0, 40).map(h => h.innerText.trim()),
      headings: [...document.querySelectorAll('h1,h2,h3,h5,h6,[class*="header"],[class*="title"]')].slice(0, 40).map(h => `${h.tagName}.${(h.className || '').toString().slice(0, 60)}: ${(h.innerText || '').trim().slice(0, 80)}`),
      bodyStart: (document.body?.innerText || '').slice(0, 2500),
    };
  }).catch(e => ({ error: String(e) }));
  const jp = path.join(diagDir, `bkr-${tag}-${stamp}.json`);
  fs.writeFileSync(jp, JSON.stringify({ ...info, ...extra }, null, 2));
  console.log(`🧾 Diagnostics saved: ${jp} (+ .png)`);
  return info;
}

// Mark the visible "+N Props" text nodes that sit in an NFL game row (both team names from this week's schedule).
async function markPropsLinks(page, schedule) {
  const pairs = schedule.map(g => [g.visitorName, g.homeName]);
  return page.evaluate((pairs) => {
    document.querySelectorAll('[data-claude-props]').forEach(e => e.removeAttribute('data-claude-props'));
    const re = /^\+\s?\d+\s+Props$/i;
    const leaves = [...document.querySelectorAll('body *')].filter(e => re.test((e.textContent || '').trim())
      && ![...e.children].some(c => re.test((c.textContent || '').trim())) && e.getClientRects().length > 0);
    const out = [];
    for (const el of leaves) {
      let box = el, pair = null;
      for (let up = 0; up < 8 && box.parentElement; up++) {
        box = box.parentElement;
        const t = box.innerText || '';
        pair = pairs.find(([a, h]) => t.includes(a) && t.includes(h));
        if (pair) break;
        if (/AWAY \/ HOME/.test(t)) break; // reached the banner: not a single game row
      }
      if (!pair || out.some(o => o.away === pair[0])) continue;
      el.setAttribute('data-claude-props', String(out.length));
      out.push({ i: out.length, away: pair[0], home: pair[1], label: (el.textContent || '').trim() });
    }
    return out;
  }, pairs);
}

async function discoverGameUrls(page, schedule) {
  const boardUrl = page.url();
  const first = await markPropsLinks(page, schedule);
  console.log(`   ${first.length} NFL games with a props link on the board`);
  const urls = [];
  for (let i = 0; i < first.length; i++) {
    const marks = await markPropsLinks(page, schedule);
    const m = marks.find(x => x.away === first[i].away);
    if (!m) { console.log(`   ⚠️ ${first[i].away} @ ${first[i].home}: props link not found after returning to the board; skipped`); continue; }
    const loc = page.locator(`[data-claude-props="${m.i}"]`);
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click({ timeout: 10000 });
    const moved = await page.waitForURL(u => u.toString() !== boardUrl, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!moved) throw new Error(`Clicking "${m.label}" for ${m.away} @ ${m.home} did not open a game page (URL unchanged). Run with --probe and send the diagnostics.`);
    urls.push(page.url());
    console.log(`   - ${m.away} @ ${m.home}: ${page.url()}`);
    await page.goto(boardUrl, { waitUntil: 'domcontentloaded' });
    if (!(await waitForBoard(page))) throw new Error('Board did not re-render after returning from a game page.');
  }
  return [...new Set(urls)];
}

async function readGame(page, url, schedule) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('h4').length >= 2, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500); // odds hydration
  for (let i = 0; i < 20; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, 1400); return window.innerHeight + window.scrollY >= document.body.scrollHeight - 5; });
    await page.waitForTimeout(400);
    if (done) break;
  }
  // Expand collapsed section headers only (accordion toggles carry aria-expanded; odds buttons do not).
  const expanded = await page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll('[aria-expanded="false"]')) {
      if (n >= 120) break;
      if (el.closest('[class*="betslip" i],[class*="bet-slip" i]')) continue;
      try { el.click(); n++; } catch {}
    }
    return n;
  });
  if (expanded) await page.waitForTimeout(3000);
  const collect = () => page.evaluate(() => {
    const blocks = {};
    for (const h of document.querySelectorAll('h4')) {
      const title = (h.innerText || '').trim();
      if (!title) continue;
      let box = h;
      while (box.parentElement && box.parentElement.querySelectorAll('h4').length === 1 && box.parentElement !== document.body) box = box.parentElement;
      blocks[title] = (box.innerText || '').trim();
    }
    return blocks;
  });
  // Market tabs: the game view's filter chips (a.gameview__filters-nav-item: Team Totals, each team, Passing Yds ... Carries).
  // Found by class, not label, so new tabs are picked up; ALL is already on screen. Seen 2026-11-13.
  const tabs = await page.evaluate(() => {
    document.querySelectorAll('[data-claude-tab]').forEach(e => e.removeAttribute('data-claude-tab'));
    const out = [];
    for (const e of document.querySelectorAll('a.gameview__filters-nav-item')) {
      const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || /^all$/i.test(t) || !e.getClientRects().length) continue;
      e.setAttribute('data-claude-tab', String(out.length)); out.push(t);
    }
    return out;
  });
  const blocks = await collect();
  const top = await page.evaluate(() => (document.body?.innerText || '').slice(0, 1500));
  for (const [i, t] of tabs.entries()) {
    const before = Object.keys(await collect()).join('|');
    await page.locator(`[data-claude-tab="${i}"]`).click({ timeout: 8000 }).catch(() => {});
    await page.waitForFunction((b) => [...document.querySelectorAll('h4')].map(h => (h.innerText || '').trim()).filter(Boolean).join('|') !== b, before, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200); // odds hydration
    for (const [k, v] of Object.entries(await collect())) if (!(k in blocks)) blocks[k] = v;
  }
  const g = { blocks, top, url: page.url(), tabs };
  // Head in the converter's format: "Back <Away> VS <Home> <MON> <D>", built from the schedule so away/home are right.
  const s = schedule.find(x => g.top.includes(x.homeName) && g.top.includes(x.visitorName));
  let head;
  if (s) {
    const d = new Date(new Date(s.kickoff_utc).getTime() - 8 * 3600e3);
    head = `Back ${s.visitorName} VS ${s.homeName} ${d.toUTCString().slice(8, 11).toUpperCase()} ${d.getUTCDate()}`;
  } else {
    const m = g.top.match(/([A-Z][\w .'-]+?)\s+VS\s+([A-Z][\w .'-]+?)\s+[A-Z]{3} \d/);
    head = m ? `Back ${m[1]} VS ${m[2]} ${g.top.match(/[A-Z]{3} \d+/)[0]}` : null;
  }
  return { head, url: new URL(g.url).pathname, at: new Date().toISOString(), blocks: g.blocks, tabs: g.tabs, game_id: s?.game_id || null };
}

function runCmd(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: REPO_ROOT, stdio: 'inherit' });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args[0]} exited with code ${code}`)));
  });
}

async function run() {
  const dateStr = ptDate();
  const weekNum = calculateNflWeek();
  console.log(`\n===============================================================`);
  console.log(`🏈 Bookmaker SGP capture (new /sportsbook site) — Week ${weekNum} (${dateStr} PT)${PROBE ? ' [probe]' : ''}`);
  console.log(`===============================================================\n`);

  const lockToken = acquireLock();
  if (!lockToken) return;
  try {
    await ensureChromeRunning();
    console.log('🔌 Connecting to browser via CDP (http://127.0.0.1:9222)...');
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const ctx = browser.contexts()[0] || await browser.newContext();
    const page = await ctx.newPage(); // never reuse or navigate an operator tab
    let capture;
    try {
      console.log('Opening an isolated Bookmaker capture tab...');
      console.log('⏳ Opening the NFL board...');
      if (!(await openNflBoard(page))) {
        const info = await saveDiag(page, 'board-timeout');
        if (info.loginForm) console.log('   Looks logged out: sign in in the BKR Chrome window (port 9222) and rerun.');
        throw new Error('NFL board did not render.');
      }
      if (PROBE_TAB) {
        // Open the first NFL game, inspect the market-tab labels, click PASSING YDS (or the first stat tab) and dump the result.
        const marks = await markPropsLinks(page, scheduleFor(weekNum));
        await page.locator('[data-claude-props="0"]').click({ timeout: 10000 });
        await page.waitForTimeout(8000);
        const labels = ['TEAM TOTALS', 'PASSING YDS', 'COMPLETIONS', 'TD PASSES', 'INTS', 'RECEIVING YDS', 'RECEPTIONS', 'RUSHING YDS', 'CARRIES'];
        const cands = await page.evaluate((labels) => labels.map(l => ({ label: l, hits: [...document.querySelectorAll('body *')]
          .filter(e => (e.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase() === l && ![...e.children].some(c => (c.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase() === l))
          .slice(0, 3).map(e => { const chain = []; let x = e; for (let i = 0; i < 5 && x; i++, x = x.parentElement) chain.push(`${x.tagName}.${(x.className || '').toString().slice(0, 80)}`); return { visible: e.getClientRects().length > 0, raw: e.textContent, chain, html: e.outerHTML.slice(0, 250) }; }) })), labels);
        const tgt = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(e => /^passing yds$/i.test((e.textContent || '').trim()) && e.getClientRects().length && ![...e.children].some(c => /^passing yds$/i.test((c.textContent || '').trim()))); if (!e) return false; e.setAttribute('data-claude-probe', '1'); return true; });
        if (tgt) await page.locator('[data-claude-probe="1"]').click({ timeout: 8000 }).catch(e => console.log('tab click failed: ' + e.message));
        await page.waitForTimeout(6000);
        const after = await page.evaluate(() => {
          const t = document.body.innerText; const i = t.indexOf('CARRIES');
          const blk = [...document.querySelectorAll('body *')].find(e => /\bOv \d/.test(e.innerText || '') && (e.innerText || '').length < 400 && e.children.length >= 2 && /[A-Z][a-z]+ [A-Z][a-z]+/.test(e.innerText || ''));
          const chain = []; let x = blk; for (let k = 0; k < 6 && x; k++, x = x.parentElement) chain.push(`${x.tagName}.${(x.className || '').toString().slice(0, 80)} [${(x.innerText || '').length}ch]`);
          return { url: location.href, h3: document.querySelectorAll('h3').length, h4: [...document.querySelectorAll('h4')].map(h => h.innerText.trim()).slice(0, 25), h5: [...document.querySelectorAll('h5')].map(h => h.innerText.trim()).slice(0, 25),
                   textAfterTabs: t.slice(Math.max(0, i), Math.max(0, i) + 3000), sampleBlock: blk ? { text: blk.innerText.slice(0, 400), html: blk.outerHTML.slice(0, 900), chain } : null };
        });
        await saveDiag(page, 'probe-tab', { candidates: cands, clickedPassingYds: tgt, after });
        console.log(`Probe-tab: PASSING YDS found=${tgt}; h4 after click=${after.h4.length}, h5=${after.h5.length}. Send me the bkr-probe-tab-*.json file.`);
        return;
      }
      if (PROBE) {
        const marks = await markPropsLinks(page, scheduleFor(weekNum));
        console.log(`Probe: ${marks.length} NFL props links: ` + marks.map(m => `${m.away} @ ${m.home} (${m.label})`).join('; '));
        const leafHtml = await page.evaluate(() => { const e = document.querySelector('[data-claude-props="0"]'); if (!e) return null; const chain = []; let x = e; for (let i = 0; i < 6 && x; i++, x = x.parentElement) chain.push(x.outerHTML.slice(0, 300)); return chain; });
        await saveDiag(page, 'probe-board', { marks, leafHtml });
        if (marks.length) await page.locator('[data-claude-props="0"]').click({ timeout: 10000 }).catch(e => console.log('probe click failed: ' + e.message));
        await page.waitForTimeout(8000);
        await saveDiag(page, 'probe-game');
        console.log('Probe done. Send me the two bkr-probe-*.json files.');
        return;
      }
      console.log('🔎 Finding game pages ("+N Props" links)...');
      const schedule = scheduleFor(weekNum);
      const urls = await discoverGameUrls(page, schedule);
      if (!urls.length) throw new Error('No NFL "+N Props" game links found.');
      const games = [];
      for (const [i, u] of urls.entries()) {
        const g = await readGame(page, u, schedule);
        const nb = Object.keys(g.blocks).length;
        console.log(`   ${i + 1}/${urls.length} ${g.head || '(no header)'}: ${nb} sections across ${g.tabs.length + 1} tabs`);
        if (!g.head || nb < 2) {
          await saveDiag(page, `game-thin-${i + 1}`);
          throw new Error(`Game page ${u} gave ${nb} sections / header ${g.head}. Diagnostics saved; nothing written.`);
        }
        games.push(g);
      }
      capture = { schema: 'bkr_sportsbook_v2_capture_v1', captured_for_week: weekNum, exported_at: new Date().toISOString(), source: 'cron-bkr-scrape.mjs (v2 site)', games };
    } finally {
      await page.close().catch(() => {});
    }
    if (!capture) return; // probe / probe-tab
    const propsDir = path.join(REPO_ROOT, 'data', 'generated', 'props');
    const capPath = path.join(propsDir, `bkr-sportsbook-capture-${dateStr}-week${weekNum}.json`);
    const rawPath = path.join(propsDir, `bookmaker-live-${dateStr}-week${weekNum}.raw.txt`);
    fs.writeFileSync(capPath, JSON.stringify(capture, null, 1), 'utf8');
    console.log(`\n💾 Saved capture: ${capPath} (${capture.games.length} games)`);
    console.log('⚙️ Converting to the SGP dump format...');
    const py = process.platform === 'win32' ? 'python' : 'python3';
    await runCmd(py, [path.join('scripts', 'props', 'bkr-sportsbook-v2-to-dump.py'), capPath, rawPath]);
    const raw = fs.readFileSync(rawPath, 'utf8');
    const ev = (raw.match(/^EVENT\|/gm) || []).length;
    if (ev !== capture.games.length || !raw.includes('\nT|') || !raw.includes('\nI|')) throw new Error(`Acceptance gate: ${ev}/${capture.games.length} games in the dump, or no sections/items.`);
    const ev2 = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-bkr-sgp-live-week${weekNum}.raw.txt`);
    fs.mkdirSync(path.dirname(ev2), { recursive: true }); fs.copyFileSync(rawPath, ev2);
    console.log('⚙️ Parsing raw dump into structured JSON...');
    await runCmd('node', [path.join('scripts', 'props', 'bookmaker-sgp-dump-parse.mjs'), '--in', rawPath, '--date', dateStr, '--week', String(weekNum)]);
    const masterJson = path.join(propsDir, `bookmaker-live-${dateStr}-week${weekNum}.json`);
    if (fs.existsSync(masterJson)) fs.copyFileSync(masterJson, path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-bookmaker-week${weekNum}-sgp-parsed.json`));
    // 2026-11-17: the game-lines file the synthesis queue and final gate read (was written by hand from this capture).
    if (fs.existsSync(masterJson)) {
      console.log('⚙️ Writing the BKR game-lines file...');
      await runCmd(py, [path.join('scripts', 'props', 'bkr-gamelines-from-live.py'), masterJson]).catch(e => console.log(`   game-lines file not written: ${e.message}`));
    }
    console.log(`\n✅ Bookmaker capture finished for Week ${weekNum}: ${masterJson}`);
  } finally {
    releaseLock(lockToken);
  }
}

run().then(() => process.exit(0)).catch(err => {   // explicit exit: the CDP connection would keep node alive
  console.error('\n❌ Cron execution error:', err.message);
  process.exit(1);
});
