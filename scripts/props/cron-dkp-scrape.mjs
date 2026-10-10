#!/usr/bin/env node
// scripts/props/cron-dkp-scrape.mjs
// ==============================================================================
// Automated Cron / CLI Runner for DraftKings Prediction Markets NFL Extraction
// Connects to a persistent Chrome instance via Chrome DevTools Protocol (CDP port 9224).
//
// Features:
// 1. Process Overlap Lock with UUID Ownership Token (prevents concurrent scheduler runs)
// 2. Dedicated Capture Tab Isolation (never touches or reuses operator tabs)
// 3. Automated Slate-Wide Game Lines and Touchdown Markets Ingestion
// 4. Strict 14-Game / Zero-Bad-Row Acceptance Gate before promoting output
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { parseDraftKingsPredictionsDump, validateAcceptanceGate } from './draftkings-prediction-dump-parse.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const LOCK_FILE = path.join(REPO_ROOT, '.chrome-dkp', 'dkp-scraper.lock');

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
        // On Windows and POSIX, process.kill(pid, 0) throws EPERM if the process exists
        // but we lack permissions to signal it (e.g. running in different security context or elevation).
        // That means the process IS alive!
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
    const res = await fetch('http://127.0.0.1:9224/json/version', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureChromeRunning() {
  if (await isCdpAvailable()) return true;

  console.log('🌐 Chrome CDP not detected on port 9224. Launching background Chrome session...');
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].find(p => fs.existsSync(p));

  if (!chromePath) {
    throw new Error('Chrome executable not found on system.');
  }

  const profileDir = path.join(REPO_ROOT, '.chrome-dkp');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const proc = spawn(chromePath, [
    '--remote-debugging-port=9224',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=game-lines'
  ], { detached: true, stdio: 'ignore' });
  proc.unref();

  // Wait up to 15s for port 9224 to become available
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await isCdpAvailable()) {
      console.log('✅ Chrome session connected on port 9224.');
      return true;
    }
  }
  throw new Error('Failed to connect to Chrome on port 9224 after launch.');
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
    console.log(`🎯 DraftKings Predictions NFL Pipeline — Week ${weekNum} (${dateStr})`);
    console.log(`===============================================================\n`);

    await ensureChromeRunning();

    console.log('🔌 Connecting to browser via CDP (http://127.0.0.1:9224)...');
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const defaultContext = browser.contexts()[0] || await browser.newContext();

    // NEVER navigate or reuse an operator's existing tab.
    // Always open a dedicated capture tab in the persistent .chrome-dkp profile and ensure cleanup.
    console.log('📄 Opening dedicated capture tab in .chrome-dkp profile (isolated from operator tabs)...');
    const capturePage = await defaultContext.newPage();

    let gameLinesText = '';
    let tdScorersText = '';

    try {
      console.log('Navigating dedicated tab to Game Lines board...');
      await capturePage.goto('https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=game-lines', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await capturePage.waitForSelector('main', { timeout: 30000 });
      await capturePage.waitForTimeout(2500);
      gameLinesText = await capturePage.evaluate(() => document.body.innerText);
      console.log(`✅ Captured Game Lines board (${gameLinesText.length} chars)`);

      console.log('Navigating dedicated tab to TD Scorers board...');
      await capturePage.goto('https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=td-scorers&nav_1=anytime-td-scorer', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await capturePage.waitForSelector('main', { timeout: 30000 });
      await capturePage.waitForTimeout(2500);
      tdScorersText = await capturePage.evaluate(() => document.body.innerText);
      console.log(`✅ Captured TD Scorers board (${tdScorersText.length} chars)`);
    } finally {
      console.log('🧹 Closing dedicated capture tab...');
      await capturePage.close().catch(() => {});
    }

    // Assemble structured dump format
    const rawDumpText = [
      `DKP_HEADER|${dateStr}|week${weekNum}|${new Date().toISOString()}`,
      'SECTION_START|GAME_LINES',
      gameLinesText,
      'SECTION_END|GAME_LINES',
      'SECTION_START|TD_SCORERS',
      tdScorersText,
      'SECTION_END|TD_SCORERS',
      'DKP_END'
    ].join('\n\n');

    // Parse in-memory first to evaluate Acceptance Gate
    console.log('\n⚙️ Parsing and validating against Acceptance Gate...');
    const { events, allRows, summary, masterPayload } = parseDraftKingsPredictionsDump(rawDumpText, dateStr, weekNum);

    const expectedGames = arg('--expected-games') ? Number(arg('--expected-games')) : null;
    const gate = validateAcceptanceGate({ events, allRows, masterPayload, expectedGames });
    if (!gate.passed) {
      console.error('\n❌ ACCEPTANCE GATE FAILED:');
      for (const err of gate.errors) {
        console.error(`   - ${err}`);
      }
      throw new Error(`Acceptance gate failed with ${gate.errors.length} defect(s). Existing master output was NOT overwritten.`);
    }

    console.log(`✅ Acceptance Gate PASSED: ${gate.stats.games} games, ${gate.stats.rows} rows, 0 bad rows, ${gate.stats.players} verified players, ${gate.stats.markets} distinct markets, 0 unresolved teams.`);

    // Write raw dump files
    const rawPath1 = path.join(REPO_ROOT, 'data', 'generated', 'props', `draftkings-predictions-live-${dateStr}-week${weekNum}.raw.txt`);
    const rawPath2 = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-dkp-live-week${weekNum}.raw.txt`);

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
        schema: 'draftkings_predictions_v1',
        book: 'DKP',
        capturedAt: masterPayload.capturedAt,
        event: ev.game,
        game: ev.game,
        startTime: ev.startTime,
        summary: {
          rows: ev.rows.length,
          by_market: counts,
        },
        rows: ev.rows,
      };

      const perMatchupPath = path.join(REPO_ROOT, 'data', 'generated', 'props', `draftkings-predictions-live-${dateStr}-${awaySlug}-at-${homeSlug}.json`);
      fs.writeFileSync(perMatchupPath, JSON.stringify(out, null, 2), 'utf8');
    }

    // Write consolidated master JSON and mirror
    const masterJson = path.join(REPO_ROOT, 'data', 'generated', 'props', `draftkings-predictions-live-${dateStr}-week${weekNum}.json`);
    const mirrorJson = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-draftkings-predictions-week${weekNum}-props-parsed.json`);

    fs.writeFileSync(masterJson, JSON.stringify(masterPayload, null, 2), 'utf8');
    fs.writeFileSync(mirrorJson, JSON.stringify(masterPayload, null, 2), 'utf8');

    console.log(`\n===============================================================`);
    console.log(`📊 DraftKings Predictions Summary — Week ${weekNum} (${dateStr})`);
    console.log(`===============================================================`);
    console.log(summary.join('\n'));
    console.log(`---------------------------------------------------------------`);
    console.log(`TOTAL: ${allRows.length} rows across ${events.length} games (Unique players: ${masterPayload.summary.players}, Markets: ${masterPayload.summary.markets})`);
    console.log(`💾 Saved master JSON: ${masterJson}`);
    console.log(`📋 Mirrored research JSON: ${mirrorJson}`);

    console.log(`\n✅ DraftKings Predictions pipeline completed successfully with strict acceptance sign-off!`);
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
