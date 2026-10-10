#!/usr/bin/env node
// scripts/props/cron-bol-scrape.mjs
// ==============================================================================
// Automated Cron / CLI Runner for BetOnline.ag NFL Prop & Line Extraction
// Connects to a persistent Chrome instance via Chrome DevTools Protocol (CDP port 9223).
// Features:
// 1. Process Overlap Lock (prevents concurrent scheduler runs)
// 2. Headless/CDP Auto-Discovery (anchored to NFL regular season calendar)
// 3. Zero-Reload Background iframe Extractor
// 4. Strict 14-Game / Zero-Bad-Row Acceptance Gate before promoting output
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { parseBetOnlineDump } from './betonline-prop-dump-parse.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const LOCK_FILE = path.join(REPO_ROOT, '.chrome-bol', 'bol-scraper.lock');

export function acquireLock(customLockFile = LOCK_FILE, { exitOnBusy = true, token = null } = {}) {
  const lockDir = path.dirname(customLockFile);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }

  const ownerToken = token || randomUUID();
  const payload = JSON.stringify({
    pid: process.pid,
    startedAt: new Date().toISOString(),
    token: ownerToken,
  }, null, 2);

  // Attempt atomic exclusive creation with retry on dead/malformed lock
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Atomic exclusive creation: fails with EEXIST if file already exists
      fs.writeFileSync(customLockFile, payload, { flag: 'wx' });
      return ownerToken;
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }

      // Lock file already exists: inspect for active process or stale lock
      let existingLock = null;
      try {
        existingLock = JSON.parse(fs.readFileSync(customLockFile, 'utf8'));
      } catch {
        // Corrupted or unparseable JSON
      }

      // 1. Reclaim if lock is malformed (not valid JSON or missing pid)
      if (!existingLock || typeof existingLock !== 'object' || !existingLock.pid) {
        console.warn('⚠️ Found malformed lock file. Removing and retrying atomic acquisition...');
        try {
          fs.unlinkSync(customLockFile);
        } catch (unlinkErr) {
          if (unlinkErr.code !== 'ENOENT') throw unlinkErr;
        }
        continue;
      }

      // 2. Check if process is still alive. If live, KEEP LOCKED REGARDLESS OF AGE!
      let isAlive = false;
      try {
        process.kill(existingLock.pid, 0);
        isAlive = true;
      } catch (killErr) {
        if (killErr.code === 'EPERM') {
          isAlive = true;
        } else {
          isAlive = false;
        }
      }

      if (isAlive) {
        const ageMinutes = Math.round((Date.now() - new Date(existingLock.startedAt).getTime()) / 60000);
        console.warn(`⚠️ Scraper is already running (PID: ${existingLock.pid}, started: ${existingLock.startedAt}, active for ${ageMinutes}m). Skipping duplicate execution.`);
        if (exitOnBusy) {
          process.exit(0);
        }
        return null;
      }

      // 3. Reclaim ONLY when process is dead
      console.warn(`⚠️ Found dead lock file from PID ${existingLock.pid} (process no longer active). Removing and retrying atomic acquisition...`);
      try {
        fs.unlinkSync(customLockFile);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') throw unlinkErr;
      }
    }
  }

  console.warn('⚠️ Unable to acquire exclusive lock after clearing stale entry.');
  if (exitOnBusy) {
    process.exit(0);
  }
  return null;
}

export function releaseLock(customLockFile = LOCK_FILE, token = null) {
  try {
    if (!fs.existsSync(customLockFile)) {
      return true;
    }

    let existingLock = null;
    try {
      existingLock = JSON.parse(fs.readFileSync(customLockFile, 'utf8'));
    } catch {
      // Malformed lock file can be cleaned up
    }

    // If lock has an owner token, only delete if caller provides matching token
    if (existingLock && existingLock.token) {
      if (!token || existingLock.token !== token) {
        console.warn(`⚠️ Refusing to release lock: token mismatch (caller: ${token}, owner: ${existingLock.token})`);
        return false;
      }
    }

    fs.unlinkSync(customLockFile);
    return true;
  } catch {
    return false;
  }
}

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : null;
};

function calculateNflWeek(date = new Date()) {
  const w1Tuesday = new Date('2026-09-08T00:00:00Z');
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor((date.getTime() - w1Tuesday.getTime()) / msPerWeek);
  return Math.max(1, Math.min(18, 1 + diffWeeks));
}

async function isCdpAvailable() {
  try {
    const res = await fetch('http://127.0.0.1:9223/json/version', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureChromeRunning() {
  if (await isCdpAvailable()) return true;

  console.log('🌐 Chrome CDP not detected on port 9223. Launching background Chrome session...');
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].find(p => fs.existsSync(p));

  if (!chromePath) {
    throw new Error('Chrome executable not found on system.');
  }

  const profileDir = path.join(REPO_ROOT, '.chrome-bol');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const proc = spawn(chromePath, [
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://sports.betonline.ag/sportsbook/football/nfl'
  ], { detached: true, stdio: 'ignore' });
  proc.unref();

  // Wait up to 15s for port 9223 to become available
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await isCdpAvailable()) {
      console.log('✅ Chrome session connected on port 9223.');
      return true;
    }
  }
  throw new Error('Failed to connect to Chrome on port 9223 after launch.');
}

export function validateAcceptanceGate({ targetGames, events, allRows, masterPayload }) {
  const errors = [];

  // Gate 1: Matchup coverage
  if (events.length !== targetGames.length) {
    errors.push(`Incomplete matchup count: captured ${events.length} of expected ${targetGames.length} games.`);
  }

  // Gate 2: Depth check
  if (allRows.length < 500) {
    errors.push(`Row count below minimum threshold: got ${allRows.length}, expected >= 500.`);
  }

  // Gate 3: Zero-bad-row integrity check
  let nullOdds = 0;
  let nanOdds = 0;
  let missingMarket = 0;
  let unknownMarkets = 0;
  let gamePropsWithPlayer = 0;
  let playerPropsWithoutPlayer = 0;

  for (const r of allRows) {
    if (r.odds === null || r.odds === undefined) nullOdds++;
    if (isNaN(r.odds)) nanOdds++;
    if (!r.market) missingMarket++;
    if (r.market === 'unknown') unknownMarkets++;

    const isGameOrTeamProp = ['game_lines', 'first_half_lines', 'first_quarter_lines', 'team_td_total', 'game_td_total', 'team_fg_total', 'game_fg_total', 'game_special'].includes(r.market);
    if (isGameOrTeamProp && r.player !== null) {
      gamePropsWithPlayer++;
    }
    if (!isGameOrTeamProp && !r.player) {
      playerPropsWithoutPlayer++;
    }
  }

  if (nullOdds > 0) errors.push(`Found ${nullOdds} row(s) with null odds.`);
  if (nanOdds > 0) errors.push(`Found ${nanOdds} row(s) with NaN odds.`);
  if (missingMarket > 0) errors.push(`Found ${missingMarket} row(s) with missing market key.`);
  if (unknownMarkets > 0) errors.push(`Found ${unknownMarkets} row(s) with unclassified 'unknown' market.`);
  if (gamePropsWithPlayer > 0) errors.push(`Found ${gamePropsWithPlayer} game/team prop row(s) with non-null player.`);
  if (playerPropsWithoutPlayer > 0) errors.push(`Found ${playerPropsWithoutPlayer} player prop row(s) without player name.`);

  return {
    passed: errors.length === 0,
    errors,
    stats: {
      games: events.length,
      rows: allRows.length,
      players: masterPayload.summary.players,
      markets: masterPayload.summary.markets,
    }
  };
}

let currentLockToken = null;

async function run() {
  currentLockToken = acquireLock();
  if (!currentLockToken) {
    return;
  }

  try {
    const dateStr = arg('--date') || new Date().toISOString().slice(0, 10);
    const weekNum = arg('--week') ? Number(arg('--week')) : calculateNflWeek();

    console.log(`\n===============================================================`);
    console.log(`🏈 BetOnline.ag NFL Prop Extraction Pipeline — Week ${weekNum} (${dateStr})`);
    console.log(`===============================================================\n`);

    await ensureChromeRunning();

    console.log('🔌 Connecting to browser via CDP (http://127.0.0.1:9223)...');
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
    const defaultContext = browser.contexts()[0] || await browser.newContext();

    // NEVER navigate or reuse an operator's existing tab.
    // Always open a dedicated capture tab in the persistent .chrome-bol profile and ensure cleanup.
    console.log('📄 Opening dedicated capture tab in .chrome-bol profile (isolated from operator tabs)...');
    const capturePage = await defaultContext.newPage();

    let rawDumpText = null;
    let targetGames = [];

    try {
      console.log('Navigating dedicated tab to BetOnline NFL board...');
      await capturePage.goto('https://sports.betonline.ag/sportsbook/football/nfl', { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Wait for board to render
      console.log('⏳ Waiting for NFL matchup board to render...');
      await capturePage.waitForSelector('a[href*="/sportsbook/football/nfl/game/"]', { timeout: 30000 });

      targetGames = await capturePage.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('a[href*="/sportsbook/football/nfl/game/"]'));
        const games = [];
        for (const r of rows) {
          const href = r.getAttribute('href');
          if (!href) continue;
          const text = r.innerText.replace(/\s+/g, ' ').trim();
          const matchTeams = text.match(/\d+\s*-\s*([A-Za-z0-9 ]+?)\s+\d+\s*-\s*([A-Za-z0-9 ]+?)\s+(?:Spread|Moneyline)/);
          const teams = matchTeams ? `${matchTeams[1].trim()} @ ${matchTeams[2].trim()}` : text.slice(0, 60);
          const timeMatch = text.match(/^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat|Today|Tomorrow|\w+ \d+),?\s+\d+:\d+\s+(?:AM|PM)/i);
          const startTime = timeMatch ? timeMatch[0] : '';
          const eventId = href.split('/').filter(Boolean).pop();

          const isAdvanceDate = /^[A-Z][a-z]{2}\s+\d{1,2}/.test(startTime);
          if (isAdvanceDate) {
            break;
          }
          if (/^Thu,/i.test(startTime) && games.length >= 10) {
            break;
          }

          if (!games.some(g => g.href === href)) {
            games.push({ href, teams, startTime, eventId });
          }
        }
        return games;
      });

      if (!targetGames || targetGames.length === 0) {
        throw new Error('No current-week NFL matchup links found on the page.');
      }

      console.log(`✅ Discovered ${targetGames.length} active matchups for Week ${weekNum}:`);
      for (const g of targetGames) {
        console.log(`   - ${g.teams} (${g.startTime || 'Scheduled'})`);
      }

      // Inject extraction runner directly with discovered links via background iframe
      console.log('\n🚀 Extracting props & game lines across all games via background iframe...');
      rawDumpText = await capturePage.evaluate(async (games) => {
        let iframe = document.getElementById('bol_extractor_iframe');
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'bol_extractor_iframe';
          iframe.style.position = 'fixed';
          iframe.style.top = '-9999px';
          iframe.style.left = '-9999px';
          iframe.style.width = '1280px';
          iframe.style.height = '1200px';
          iframe.style.opacity = '0';
          document.body.appendChild(iframe);
        }

        const results = [];
        for (let idx = 0; idx < games.length; idx++) {
          const game = games[idx];
          iframe.src = game.href;

          let doc = null;
          for (let sec = 0; sec < 25; sec++) {
            await new Promise(r => setTimeout(r, 1000));
            try {
              doc = iframe.contentDocument || iframe.contentWindow.document;
              if (doc && doc.body) {
                const t = doc.body.innerText || '';
                if (t.includes('Passing Yards') || t.includes('Passing Touchdowns') || t.includes('Spread') || t.includes('All Markets')) {
                  await new Promise(r => setTimeout(r, 1000));
                  break;
                }
              }
            } catch {}
          }

          if (!doc || !doc.body) continue;

          const rawText = doc.body.innerText || '';
          const block = [
            `EVENT|${game.teams}|${game.href}|${new Date().toISOString()}|${game.startTime}|${game.eventId}`,
            'RAW_TEXT_START',
            rawText,
            'RAW_TEXT_END'
          ].join('\n');

          results.push(block);
        }

        iframe.remove();
        return results.join('\n\n') + '\nEND|' + results.length + '\n';
      }, targetGames);
    } finally {
      if (capturePage && !capturePage.isClosed()) {
        console.log('🧹 Closing dedicated capture tab...');
        await capturePage.close().catch(() => {});
      }
    }

    // Parse in-memory first to evaluate Acceptance Gate
    console.log('\n⚙️ Parsing and validating against Acceptance Gate...');
    const { events, allRows, summary, masterPayload } = parseBetOnlineDump(rawDumpText, dateStr, weekNum);

    const gate = validateAcceptanceGate({ targetGames, events, allRows, masterPayload });
    if (!gate.passed) {
      console.error('\n❌ ACCEPTANCE GATE FAILED:');
      for (const err of gate.errors) {
        console.error(`   - ${err}`);
      }
      throw new Error(`Acceptance gate failed with ${gate.errors.length} defect(s). Existing master output was NOT overwritten.`);
    }

    console.log(`✅ Acceptance Gate PASSED: ${gate.stats.games}/${targetGames.length} games, ${gate.stats.rows} rows, 0 bad rows, ${gate.stats.players} verified players, ${gate.stats.markets} distinct markets.`);

    // Write raw dump files
    const rawPath1 = path.join(REPO_ROOT, 'data', 'generated', 'props', `betonline-live-${dateStr}-week${weekNum}.raw.txt`);
    const rawPath2 = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-bol-live-week${weekNum}.raw.txt`);

    fs.mkdirSync(path.dirname(rawPath1), { recursive: true });
    fs.mkdirSync(path.dirname(rawPath2), { recursive: true });
    fs.writeFileSync(rawPath1, rawDumpText, 'utf8');
    fs.writeFileSync(rawPath2, rawDumpText, 'utf8');
    console.log(`\n💾 Saved raw dump: ${rawPath1} (${Math.round(rawDumpText.length / 1024)} KB)`);
    console.log(`💾 Mirrored raw evidence: ${rawPath2}`);

    // Write per-matchup JSON files
    const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const ev of events) {
      const [awayRaw, homeRaw] = (ev.game || '').split(' @ ');
      const awaySlug = slug((awayRaw || 'away').split(' ').pop());
      const homeSlug = slug((homeRaw || 'home').split(' ').pop());

      const counts = {};
      for (const r of ev.rows) {
        counts[r.market] = (counts[r.market] || 0) + 1;
      }

      const out = {
        schema: 'betonline_live_markets_v1',
        book: 'BEO',
        capturedAt: ev.capturedAt,
        event: ev.game,
        game: ev.game,
        eventId: ev.eventId,
        eventUrl: ev.eventUrl,
        startTime: ev.startTime,
        summary: {
          rows: ev.rows.length,
          by_market: counts,
        },
        rows: ev.rows,
      };

      const perMatchupPath = path.join(REPO_ROOT, 'data', 'generated', 'props', `betonline-live-${dateStr}-${awaySlug}-at-${homeSlug}.json`);
      fs.writeFileSync(perMatchupPath, JSON.stringify(out, null, 2), 'utf8');
    }

    // Write consolidated master JSON and mirror
    const masterJson = path.join(REPO_ROOT, 'data', 'generated', 'props', `betonline-live-${dateStr}-week${weekNum}.json`);
    const mirrorJson = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-betonline-week${weekNum}-props-parsed.json`);

    fs.writeFileSync(masterJson, JSON.stringify(masterPayload, null, 2), 'utf8');
    fs.writeFileSync(mirrorJson, JSON.stringify(masterPayload, null, 2), 'utf8');

    console.log(`\n===============================================================`);
    console.log(`📊 BetOnline Extraction Summary — Week ${weekNum} (${dateStr})`);
    console.log(`===============================================================`);
    console.log(summary.join('\n'));
    console.log(`---------------------------------------------------------------`);
    console.log(`TOTAL: ${allRows.length} rows across ${events.length} games (Unique players: ${masterPayload.summary.players}, Markets: ${masterPayload.summary.markets})`);
    console.log(`💾 Saved master JSON: ${masterJson}`);
    console.log(`📋 Mirrored research JSON: ${mirrorJson}`);

    console.log(`\n✅ BetOnline prop pipeline completed successfully with strict acceptance sign-off!`);
  } finally {
    if (currentLockToken) {
      releaseLock(LOCK_FILE, currentLockToken);
    }
  }
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  run().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('\n❌ Scraper execution error:', err.message);
    process.exit(1);
  });
}
