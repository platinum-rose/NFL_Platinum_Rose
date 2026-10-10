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

function validateNflCapture({ gameLinks, rawDumpText }) {
  if (!gameLinks.length || gameLinks.some(link => !link.startsWith(NFL_GAME_PATH_PREFIX) || !link.includes('-vs-'))) {
    throw new Error('Acceptance gate rejected non-NFL or malformed matchup links before any artifact was written.');
  }
  const eventPaths = [...rawDumpText.matchAll(/^EVENT\|[^|]*\|([^|]+)\|/gm)].map(match => match[1]);
  if (eventPaths.length !== gameLinks.length) {
    throw new Error('Acceptance gate rejected incomplete capture: ' + eventPaths.length + '/' + gameLinks.length + ' NFL matchups produced evidence.');
  }
  if (eventPaths.some(link => !link.startsWith(NFL_GAME_PATH_PREFIX)) || new Set(eventPaths).size !== gameLinks.length) {
    throw new Error('Acceptance gate rejected evidence that was not exclusively one-per-NFL matchup.');
  }
  if (!rawDumpText.includes('\nT|') || !rawDumpText.includes('\nI|')) {
    throw new Error('Acceptance gate rejected an empty NFL prop capture.');
  }
}

async function run() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const weekNum = calculateNflWeek();
  console.log(`\n===============================================================`);
  console.log(`🏈 Bookmaker.eu SGP Cron Extraction — Week ${weekNum} (${dateStr})`);
  console.log(`===============================================================\n`);

  const lockToken = acquireLock();
  if (!lockToken) return;

  try {
  await ensureChromeRunning();

  console.log('🔌 Connecting to browser via CDP (http://127.0.0.1:9222)...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const defaultContext = browser.contexts()[0] || await browser.newContext();

  // Never reuse or navigate an operator tab. The profile supplies the authenticated session.
  const page = await defaultContext.newPage();
  let rawDumpText;
  try {
    console.log('Opening an isolated Bookmaker capture tab...');
    await page.goto('https://be.bookmaker.eu/en/sports/football/nfl/game-lines/', { waitUntil: 'domcontentloaded' });

  // Robust Angular selector wait: ensure schedule and matchup cards are fully rendered
  console.log('⏳ Waiting for NFL matchup board to render...');
  await page.waitForSelector('a[href^="/en/sports/football/nfl/game-lines/"][href*="-vs-"]', { timeout: 30000 });

  const gameLinks = await page.$$eval('a[href^="/en/sports/football/nfl/game-lines/"][href*="-vs-"]', els => {
    return els.map(a => a.getAttribute('href'))
      .filter(h => h && h.startsWith('/en/sports/football/nfl/game-lines/') && h.includes('-vs-'))
      .map(h => h.startsWith('http') ? new URL(h).pathname : h)
      .filter((h, i, arr) => arr.indexOf(h) === i);
  });

  if (!gameLinks || gameLinks.length === 0) {
    throw new Error('No NFL matchup links found on the page.');
  }

  console.log(`✅ Discovered ${gameLinks.length} active matchups on the board:`);
  for (const g of gameLinks) {
    console.log(`   - ${g.split('/').filter(Boolean).pop()}`);
  }

  // Inject extraction runner directly with discovered links
  console.log('\n🚀 Extracting SGP prop grids across all games via background iframe...');
  rawDumpText = await page.evaluate(async (links) => {
    let iframe = document.getElementById('bkr_extractor_iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'bkr_extractor_iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1280px';
      iframe.style.height = '900px';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);
    }

    const results = [];
    for (let idx = 0; idx < links.length; idx++) {
      const path = links[idx];
      iframe.src = path;

      let doc = null;
      let grids = [];
      for (let sec = 0; sec < 25; sec++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc) {
            grids = [...doc.querySelectorAll('div.prop-grid')];
            if (grids.length >= 2) {
              await new Promise(r => setTimeout(r, 1500)); // wait for odds hydration
              grids = [...doc.querySelectorAll('div.prop-grid')];
              break;
            }
          }
        } catch {}
      }

      if (!doc || grids.length === 0) continue;

      const hdr = [...doc.querySelectorAll('.team-names')].slice(0, 2).map(e => e.innerText.trim());
      const eventName = hdr.length === 2 ? hdr.join(' @ ') : path.split('/').filter(Boolean).pop().replace(/-/g, ' ');
      const sgpGrids = grids.filter(x => x.querySelector('.sgp-badge') || x.innerText.includes('SGP'));
      const targetGrids = sgpGrids.length > 0 ? sgpGrids : grids;

      const L = ['EVENT|' + eventName + '|' + path + '|' + new Date().toISOString()];
      for (const x of targetGrids) {
        const banner = (x.querySelector('.sports-league-banner')?.innerText || '').replace(/\bSGP\b/, '').replace(/\s+/g, ' ').trim();
        L.push('T|' + banner);
        for (const item of x.querySelectorAll('.prop-item')) {
          const t = item.innerText.replace(/\s+/g, ' ').trim();
          if (t && !/^\+ \d+ /.test(t)) L.push('I|' + t);
        }
      }
      results.push(L.join('\n'));
    }

    iframe.remove();
    return results.join('\n') + '\nEND|' + results.length + '\n';
  }, gameLinks);

  validateNflCapture({ gameLinks, rawDumpText });
  } finally {
    await page.close();
  }

  // Write raw dump files
  const rawPath1 = path.join(REPO_ROOT, 'data', 'generated', 'props', `bookmaker-live-${dateStr}-week${weekNum}.raw.txt`);
  const rawPath2 = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-bkr-sgp-live-week${weekNum}.raw.txt`);
  
  fs.mkdirSync(path.dirname(rawPath1), { recursive: true });
  fs.mkdirSync(path.dirname(rawPath2), { recursive: true });
  fs.writeFileSync(rawPath1, rawDumpText, 'utf8');
  fs.writeFileSync(rawPath2, rawDumpText, 'utf8');
  console.log(`\n💾 Saved raw dump: ${rawPath1} (${Math.round(rawDumpText.length / 1024)} KB)`);

  // Run parser
  console.log('⚙️ Parsing raw dump into structured JSON...');
  const parserScript = path.join(REPO_ROOT, 'scripts', 'props', 'bookmaker-sgp-dump-parse.mjs');
  
  await new Promise((resolve, reject) => {
    const p = spawn('node', [parserScript, '--in', rawPath1, '--date', dateStr, '--week', String(weekNum)], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`Parser failed with code ${code}`)));
  });

  // Mirror master output for research
  const masterJson = path.join(REPO_ROOT, 'data', 'generated', 'props', `bookmaker-live-${dateStr}-week${weekNum}.json`);
  const mirrorJson = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-bookmaker-week${weekNum}-sgp-parsed.json`);
  if (fs.existsSync(masterJson)) {
    fs.copyFileSync(masterJson, mirrorJson);
    console.log(`📋 Mirrored research JSON: ${mirrorJson}`);
  }

  console.log(`\n✅ Bookmaker SGP extraction and parse finished successfully for Week ${weekNum}!`);
  } finally {
    releaseLock(lockToken);
  }
}

run().catch(err => {
  console.error('\n❌ Cron execution error:', err.message);
  process.exit(1);
});
