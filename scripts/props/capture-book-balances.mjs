#!/usr/bin/env node
// scripts/props/capture-book-balances.mjs
// Read the account balance from each book's capture Chrome without running a line/prop capture.
//   node scripts/props/capture-book-balances.mjs [--book bol|bkr|dkp|all]   (runbalances.cmd)
// Uses the same CDP Chromes as the capture scripts (BKR 9222, BOL 9223, DKP 9224). A Chrome that isn't
// running is skipped (start it with its runXXXprops.cmd / props:XXX:launch and sign in first).
import { chromium } from '@playwright/test';
import { recordBookBalance } from './book-balance.mjs';

const BOOKS = {
  bkr: { book: 'Bookmaker', cdp: 'http://127.0.0.1:9222', url: 'https://be.bookmaker.eu/sportsbook' },
  bol: { book: 'BetOnline', cdp: 'http://127.0.0.1:9223', url: 'https://sports.betonline.ag/sportsbook/football/nfl' },
  dkp: { book: 'DraftKings Predictions', cdp: 'http://127.0.0.1:9224', url: 'https://predictions.draftkings.com/en/markets/football/nfl' },
};
const i = process.argv.indexOf('--book');
const pick = (i > -1 ? process.argv[i + 1] : 'all').toLowerCase();
const keys = pick === 'all' ? Object.keys(BOOKS) : pick.split(',');
let failed = 0;
for (const k of keys) {
  const b = BOOKS[k];
  if (!b) { console.log(`Unknown book "${k}" (use bol, bkr, dkp or all)`); failed++; continue; }
  const up = await fetch(b.cdp + '/json/version', { signal: AbortSignal.timeout(2000) }).then((r) => r.ok).catch(() => false);
  if (!up) { console.log(`💰 ${b.book}: capture Chrome not running on ${b.cdp.split(':').pop()}; skipped`); failed++; continue; }
  const browser = await chromium.connectOverCDP(b.cdp);
  const page = await (browser.contexts()[0] || (await browser.newContext())).newPage();   // own tab; never touch operator tabs
  try {
    await page.goto(b.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    const r = await recordBookBalance(page, { book: b.book, script: 'capture-book-balances' });
    if (r.status !== 'ok') failed++;
  } catch (e) { console.log(`💰 ${b.book}: ${e.message}`); failed++; }
  finally { await page.close().catch(() => {}); }
}
process.exit(failed ? 1 : 0);
