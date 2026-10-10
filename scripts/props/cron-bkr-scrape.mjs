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
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

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

async function run() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const weekNum = calculateNflWeek();
  console.log(`\n===============================================================`);
  console.log(`🏈 Bookmaker.eu SGP Cron Extraction — Week ${weekNum} (${dateStr})`);
  console.log(`===============================================================\n`);

  await ensureChromeRunning();

  console.log('🔌 Connecting to browser via CDP (http://127.0.0.1:9222)...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const defaultContext = browser.contexts()[0] || await browser.newContext();

  // Find or create Bookmaker page
  let page = defaultContext.pages().find(p => p.url().includes('bookmaker.eu'));
  let createdPage = false;
  if (!page) {
    page = await defaultContext.newPage();
    createdPage = true;
    console.log('Navigating to Bookmaker NFL lines page...');
    await page.goto('https://be.bookmaker.eu/en/sports/football/nfl/game-lines/');
  } else {
    console.log(`Using existing Bookmaker tab: ${page.url()}`);
    if (!page.url().includes('/nfl/game-lines/')) {
      console.log('Navigating active tab to /nfl/game-lines/...');
      await page.goto('https://be.bookmaker.eu/en/sports/football/nfl/game-lines/');
    }
  }

  // Robust Angular selector wait: ensure schedule and matchup cards are fully rendered
  console.log('⏳ Waiting for NFL matchup board to render...');
  await page.waitForSelector('a[href*="-vs-"]', { timeout: 30000 });

  const gameLinks = await page.$$eval('a[href*="-vs-"]', els => {
    return els.map(a => a.getAttribute('href'))
      .filter(h => h && h.includes('/game-lines/'))
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
  const rawDumpText = await page.evaluate(async (links) => {
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

  if (createdPage) await page.close();

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
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Cron execution error:', err.message);
  process.exit(1);
});
