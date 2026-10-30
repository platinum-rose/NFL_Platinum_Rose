#!/usr/bin/env node
// scripts/props/dkp-event-feed-capture.mjs
// ==============================================================================
// DraftKings Predictions - per-event FEED capture (production)
//
// Replaces page-text scraping for full player-prop boards. Drives the existing
// dedicated Chrome (CDP port 9224, profile .chrome-dkp), opens each NFL event page,
// clicks only category tabs / O-U chips, and records the JSON the DK page itself loads
// from sportsbook-nash.draftkings.com (".../sites/PREDICT/api/sportscontent/..."), then
// decodes it into draftkings_predictions_feed_v1 rows with American odds straight from DK.
//
// READ-ONLY: never clicks a price/contract button, never opens the trade slip.
//
// Usage:
//   node scripts/props/dkp-event-feed-capture.mjs                    # whole current-week slate (discovers events)
//   node scripts/props/dkp-event-feed-capture.mjs --event 34118185   # one event (id or full URL), comma list ok
//   node scripts/props/dkp-event-feed-capture.mjs --game DAL@GB      # slate discovery, filter by team abbr
//   Flags: --week N  --date YYYY-MM-DD  --keep-raw  --include-started  --dry-run
//   --defense-only: open only the DEFENSIVE tab and write draftkings-predictions-defense-<date>-<a>-at-<h>.json
//                   (no master file; collected by scripts/props/build-defensive-boards.mjs)
//
// Output (data/generated/props/):
//   draftkings-predictions-feed-<date>-<away>-at-<home>.json   per game (always written, gate result inside)
//   draftkings-predictions-feed-<date>-week<N>.json            master (only games that pass the gate)
//   raw/dkp-feed-<date>-<eventId>.network.json                 with --keep-raw
// These are NEW files; the legacy draftkings-predictions-live-* masters are untouched.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeFileAtomic,
  localDateString,
  calculateNflWeek,
  getWeekDateRange,
} from './draftkings-prediction-dump-parse.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'data', 'generated', 'props');
const SLATE_URL = 'https://predictions.draftkings.com/en/markets/football/nfl?category=games&subcategory=game-lines';
const EVENT_URL = (id, slug = 'event') => `https://predictions.draftkings.com/en/event/${slug}/${id}`;
const FEED_HOST_RE = /sportsbook-nash\.draftkings\.com\/sites\/PREDICT\/api\/sportscontent\//;

// Tabs and the O/U chips under them. Labels are matched case-insensitively and only from this list.
export const TAB_STEPS = [
  ['PASSING', ['Pass Yards O/U', 'Pass TDs O/U']],
  ['RECEIVING', ['Rec Yards O/U', 'Receptions O/U']],
  ['RUSHING', ['Rush Yards O/U', 'Rush Attempts O/U']],
  ['TEAM PROPS', []],
  ['GAME PROPS', []],
  ['HALVES', []],
  ['QUARTERS', []],
  // Sacks is the default view; T+A, solo tackles and assists sit behind their own chips (Andy, 2026-10-29).
  ['DEFENSIVE', ['Tackles + Assists', 'Tackles', 'Assists']],
  ['SPECIAL TEAMS', []],
];

// ---- pure decode helpers (unit-tested) -------------------------------------------------------

const MARKET_MAP = [
  [/^Anytime Touchdown/i, 'atd_1_plus'],
  [/^1st Touchdown/i, 'first_td'],
  [/^Score 2 or More/i, 'td_2_plus'],
  [/^Score 3 or More/i, 'td_3_plus'],
  [/^Last Touchdown/i, 'last_td'],
  [/^Passing Yards/i, 'pass_yds'],
  [/^Passing Touchdowns/i, 'pass_td'],
  [/^Passing Attempts/i, 'pass_att'],
  [/^(Passing )?Completions/i, 'pass_cmp'],
  [/^Interceptions/i, 'pass_int'],
  [/^Receiving Yards/i, 'rec_yds'],
  [/^Receptions/i, 'rec'],
  [/^Rushing Yards/i, 'rush_yds'],
  [/^Rushing Attempts/i, 'carries'],
  [/^Rush(ing)? \+ Rec(eiving)?/i, 'rush_rec_yds'],
  [/^Sacks/i, 'sacks'],
  // Order matters: combined T+A before solo tackles; both typeName forms seen as '<X> Milestones' / 'O/U'.
  [/Tackles\s*(\+|and)\s*Assists|Combined Tackles/i, 'tackles_assists'],
  [/^Assists/i, 'assists'],
  [/^(Solo )?Tackles/i, 'tackles'],
  [/Team Total Points/i, 'team_total'],
  [/^Total Points/i, 'game_total'],
  [/^Spread/i, 'spread'],
  [/^Moneyline|^To Win/i, 'moneyline'],
  [/^Overtime/i, 'overtime'],
];

export function americanOf(displayOdds) {
  const a = displayOdds?.american;
  if (a == null) return null;
  const n = Number(String(a).replace(/[\u2212\u2013]/g, '-').replace('+', ''));
  return Number.isFinite(n) ? n : null;
}

export function classifyMarket(typeName = '', marketName = '') {
  const period = /1st Half/i.test(typeName + marketName) ? '1h_' : /1st Quarter/i.test(typeName + marketName) ? '1q_' : '';
  for (const [re, key] of MARKET_MAP) if (re.test(typeName) || re.test(marketName)) return period + key;
  return 'other';
}

function teamAbbrFromEvent(participants = []) {
  const out = { away: null, home: null, awayName: null, homeName: null };
  for (const p of participants) {
    const abbr = p.metadata?.shortName || p.name?.split(' ')[0] || null;
    if (/away/i.test(p.venueRole)) { out.away = abbr; out.awayName = p.name; }
    if (/home/i.test(p.venueRole)) { out.home = abbr; out.homeName = p.name; }
  }
  return out;
}

// responses: [{url, status, body}] as recorded from the page.
export function decodeFeedResponses(responses, fallbackEventId = null) {
  const markets = new Map();
  const selections = new Map();
  let eventMeta = null;
  for (const r of responses) {
    if (!FEED_HOST_RE.test(r.url) || r.status !== 200) continue;
    let b;
    try { b = typeof r.body === 'string' ? JSON.parse(r.body) : r.body; } catch { continue; }
    if (/pagedata\/event\/v1\/events/.test(r.url) && b?.events?.[0]) eventMeta = eventMeta || b.events[0];
    for (const m of b?.markets || []) markets.set(m.id, m);
    for (const s of b?.selections || []) selections.set(s.id, s);
  }
  const teams = teamAbbrFromEvent(eventMeta?.participants);
  const event = {
    eventId: eventMeta?.id || fallbackEventId,
    name: eventMeta?.name || null,
    start: eventMeta?.startEventDate || null,
    away: teams.away, home: teams.home, awayName: teams.awayName, homeName: teams.homeName,
  };
  const rows = [];
  for (const s of selections.values()) {
    const m = markets.get(s.marketId);
    if (!m) continue;
    const typeName = m.marketType?.name || '';
    const market = classifyMarket(typeName, m.name);
    const p0 = (s.participants || [])[0] || null;
    let team = null;
    if (p0?.type === 'Player') team = /away/i.test(p0.venueRole) ? teams.away : /home/i.test(p0.venueRole) ? teams.home : null;
    if (market === 'team_total' || market.endsWith('team_total')) team = /^away/i.test(typeName) ? teams.away : /^home/i.test(typeName) ? teams.home : (m.name || '').startsWith(teams.away || '~') ? teams.away : teams.home;
    const milestone = s.milestoneValue ?? null;
    const points = s.points ?? null;
    const kind = milestone != null ? 'milestone' : points != null ? 'ou' : 'main';
    const lineEquiv = milestone != null ? (Number.isInteger(milestone) ? milestone - 0.5 : milestone) : points;
    rows.push({
      book: 'DKP',
      source: 'dkp_event_feed',
      market,
      marketName: m.name,
      marketType: typeName,
      kind,
      player: p0?.type === 'Player' ? p0.name : null,
      team,
      side: kind === 'main' && p0?.type === 'Player' ? 'Yes' : (s.outcomeType || s.label),
      label: s.label,
      line: points,
      milestone,
      lineEquiv,
      american: americanOf(s.displayOdds),
      decimal: s.trueOdds ?? null,
      pct: s.displayOdds?.percentage ?? null,
      isMainLine: (s.tags || []).includes('MainPointLine'),
      marketId: m.id,
      selectionId: s.id,
    });
  }
  rows.sort((a, b) => (a.market + (a.player || '')).localeCompare(b.market + (b.player || '')) || (a.lineEquiv ?? 0) - (b.lineEquiv ?? 0));
  return { event, rows };
}

export function summarizeRows(rows) {
  const by = {};
  for (const r of rows) by[r.market] = (by[r.market] || 0) + 1;
  return by;
}

// Fail-closed gate for promoting a game into the master.
export function validateEventCapture({ event, rows }, { expectTeams = null } = {}) {
  const defects = [];
  const by = summarizeRows(rows);
  if (!event.eventId) defects.push('no event metadata in feed');
  if (!event.away || !event.home) defects.push('could not resolve away/home teams');
  if (rows.length < 100) defects.push(`row count ${rows.length} < 100`);
  if ((by.atd_1_plus || 0) < 10) defects.push(`anytime-TD rows ${by.atd_1_plus || 0} < 10`);
  if (!by.spread && !by.game_total) defects.push('no game lines (spread/total)');
  const nullOdds = rows.filter(r => r.american == null).length;
  if (nullOdds) defects.push(`${nullOdds} row(s) with null odds`);
  if (expectTeams && event.away && event.home) {
    const set = new Set([event.away, event.home]);
    if (!expectTeams.every(t => set.has(t))) defects.push(`event ${event.away}@${event.home} does not match requested ${expectTeams.join('@')}`);
  }
  return { pass: defects.length === 0, defects };
}

// Gate for --defense-only captures: only the DEFENSIVE tab is opened, so no TD/game-line rows are expected.
export function validateDefenseCapture({ event, rows }, { expectTeams = null } = {}) {
  const defects = [];
  const by = summarizeRows(rows);
  if (!event.eventId) defects.push('no event metadata in feed');
  if (!event.away || !event.home) defects.push('could not resolve away/home teams');
  const def = (by.tackles_assists || 0) + (by.tackles || 0) + (by.assists || 0) + (by.sacks || 0);
  if (def < 5) defects.push(`defensive rows ${def} < 5`);
  const nullOdds = rows.filter(r => r.american == null).length;
  if (nullOdds) defects.push(`${nullOdds} row(s) with null odds`);
  if (expectTeams && event.away && event.home) {
    const set = new Set([event.away, event.home]);
    if (!expectTeams.every(t => set.has(t))) defects.push(`event ${event.away}@${event.home} does not match requested ${expectTeams.join('@')}`);
  }
  return { pass: defects.length === 0, defects };
}

export function eventIdFromInput(v) {
  const m = String(v).match(/(\d{6,})\s*$/) || String(v).match(/\/(\d{6,})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

// Capture window for a week: Tuesday 00:00Z through the following Tuesday 12:00Z (covers Monday-night games).
export function weekWindow(weekNum, seasonYear = 2026) {
  const { start } = getWeekDateRange(weekNum, seasonYear);
  return { start, end: new Date(start.getTime() + 7 * 24 * 3600 * 1000 + 12 * 3600 * 1000) };
}

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- browser driver --------------------------------------------------------------------------

async function isCdpAvailable() {
  try {
    const res = await fetch('http://127.0.0.1:9224/json/version', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

async function captureEvent(browser, idOrSlug, { keepRaw, dateStr, tabs = null }) {
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  const responses = [];
  page.on('response', async (r) => {
    try {
      const url = r.url();
      if (!FEED_HOST_RE.test(url)) return;
      const body = await r.text();
      if (body.length > 8_000_000) return;
      responses.push({ url, status: r.status(), at: new Date().toISOString(), body });
    } catch { /* response body unavailable */ }
  });
  // Diagnostics (2026-10-30): record which tabs/chips existed and were clicked, plus what the
  // DEFENSIVE view showed, so "DK has not posted defense yet" can be told apart from a click miss.
  const diagnostics = { clicks: [], tabsSeen: [], defensiveText: null };
  const click = async (label) => {
    const loc = page.getByText(new RegExp('^\\s*' + label.replace(/[+/]/g, '\\$&') + '\\s*$', 'i')).first();
    const found = (await loc.count()) > 0;
    if (!found) { diagnostics.clicks.push({ label, found, clicked: false }); return false; }
    try { await loc.click({ timeout: 4000 }); await page.waitForTimeout(2200); diagnostics.clicks.push({ label, found, clicked: true }); return true; }
    catch { diagnostics.clicks.push({ label, found, clicked: false }); return false; }
  };
  try {
    await page.goto(idOrSlug.startsWith('http') ? idOrSlug : EVENT_URL(idOrSlug), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    const bodyLines = async () => (await page.evaluate(() => document.body.innerText || '')).split('\n').map(x => x.trim()).filter(Boolean);
    const known = new Set(TAB_STEPS.map(([t]) => t).concat(['POPULAR', 'TD SCORERS', 'GAME LINES']));
    diagnostics.tabsSeen = [...new Set((await bodyLines()).filter(l => known.has(l.toUpperCase())))];
    for (const [tab, chips] of (tabs ? TAB_STEPS.filter(([t]) => tabs.includes(t)) : TAB_STEPS)) {
      if (!(await click(tab))) continue;
      if (tab === 'DEFENSIVE') {
        const lines = await bodyLines(); const i = lines.findIndex(l => l.toUpperCase() === 'TEAM PROPS');
        diagnostics.defensiveText = lines.slice(i > -1 ? i + 1 : 0, (i > -1 ? i + 1 : 0) + 40).join(' | ').slice(0, 800);
      }
      for (const c of chips) await click(c);
    }
  } finally {
    await page.close().catch(() => {});
  }
  const decoded = decodeFeedResponses(responses, eventIdFromInput(idOrSlug));
  decoded.diagnostics = diagnostics;
  if (keepRaw) {
    const rawDir = path.join(OUT_DIR, 'raw');
    fs.mkdirSync(rawDir, { recursive: true });
    writeFileAtomic(path.join(rawDir, `dkp-feed-${dateStr}-${decoded.event.eventId || 'unknown'}.network.json`),
      JSON.stringify({ capturedAt: new Date().toISOString(), responses }));
  }
  return decoded;
}

async function discoverSlateEvents(browser) {
  const page = await browser.contexts()[0].newPage();
  try {
    await page.goto(SLATE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 3000); await page.waitForTimeout(500); }
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="/event/"]')).map(a => a.href));
    return [...new Set(hrefs)].map(h => ({ url: h, id: eventIdFromInput(h) })).filter(e => e.id);
  } finally { await page.close().catch(() => {}); }
}

async function main() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
  const has = (k) => process.argv.includes(k);
  const dateStr = arg('--date') || localDateString();
  const weekNum = arg('--week') ? Number(arg('--week')) : calculateNflWeek();
  const keepRaw = has('--keep-raw');
  const defenseOnly = has('--defense-only'); // DEFENSIVE tab only (sacks, T+A, solo tackles, assists); separate output files
  const dry = has('--dry-run');
  const includeStarted = has('--include-started');
  const gameFilter = arg('--game') ? arg('--game').toUpperCase().split('@') : null;

  if (!(await isCdpAvailable())) {
    console.error('Chrome CDP not detected on port 9224. Start it first: npm run props:dkp:launch  (then clear any verification once).');
    process.exit(1);
  }

  // Share the lock with cron-dkp-scrape.mjs so the two never drive the profile at once.
  const { acquireLock, releaseLock } = await import('./cron-dkp-scrape.mjs');
  const token = acquireLock();
  if (!token) return;
  let browser;
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    console.log(`\nDKP event-feed capture - Week ${weekNum} (${dateStr})${dry ? ' [dry run]' : ''}`);

    let targets;
    if (arg('--event')) targets = arg('--event').split(',').map(v => ({ url: v.trim(), id: eventIdFromInput(v) })).filter(t => t.id);
    else {
      targets = await discoverSlateEvents(browser);
      console.log(`Discovered ${targets.length} event link(s) on the slate.`);
      if (!targets.length) throw new Error('No event links found on the slate page; pass --event <id|url> explicitly.');
    }

    const win = weekWindow(weekNum);
    const games = [];
    for (const t of targets) {
      process.stdout.write(`- event ${t.id} ... `);
      const decoded = await captureEvent(browser, t.url.startsWith('http') ? t.url : t.id, { keepRaw, dateStr, tabs: defenseOnly ? ['DEFENSIVE'] : null });
      const { event, rows } = decoded;
      const start = event.start ? new Date(event.start) : null;
      if (!arg('--event')) {
        if (start && (start < win.start || start > win.end)) { console.log(`skip (outside week ${weekNum}: ${event.start})`); continue; }
        if (start && start < new Date() && !includeStarted) { console.log('skip (already started)'); continue; }
      }
      if (gameFilter && !(gameFilter.every(g => [event.away, event.home].includes(g)))) { console.log(`skip (${event.away}@${event.home} != ${gameFilter.join('@')})`); continue; }
      const gate = (defenseOnly ? validateDefenseCapture : validateEventCapture)(decoded, { expectTeams: gameFilter && gameFilter.length === 2 ? gameFilter : null });
      console.log(`${event.away}@${event.home}: ${rows.length} rows, gate ${gate.pass ? 'PASS' : 'FAIL'}${gate.pass ? '' : ' - ' + gate.defects.join('; ')}`);
      if (defenseOnly) {
        const d = decoded.diagnostics || {};
        const c = (d.clicks || []).map(x => `${x.label}:${x.clicked ? 'ok' : x.found ? 'click-failed' : 'not-found'}`).join(', ');
        console.log(`    tabs seen: ${(d.tabsSeen || []).join(', ') || 'none'} | clicks: ${c}`);
      }
      const out = {
        schema: 'draftkings_predictions_feed_v1',
        book: 'DKP',
        capturedAt: new Date().toISOString(),
        date: dateStr, week: weekNum,
        event, gate, diagnostics: decoded.diagnostics,
        summary: { rows: rows.length, by_market: summarizeRows(rows) },
        rows,
      };
      games.push(out);
      if (!dry) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        writeFileAtomic(path.join(OUT_DIR, `draftkings-predictions-${defenseOnly ? 'defense' : 'feed'}-${dateStr}-${slug(event.away)}-at-${slug(event.home)}.json`), JSON.stringify(out, null, 2));
      }
    }

    const passed = games.filter(g => g.gate.pass);
    if (!dry && passed.length && !defenseOnly) {
      const master = {
        schema: 'draftkings_predictions_feed_master_v1', book: 'DKP', capturedAt: new Date().toISOString(), date: dateStr, week: weekNum,
        games: passed.map(g => ({ eventId: g.event.eventId, away: g.event.away, home: g.event.home, start: g.event.start, rows: g.summary.rows })),
        rows: passed.flatMap(g => g.rows.map(r => ({ ...r, game: `${g.event.away}@${g.event.home}`, eventId: g.event.eventId }))),
      };
      writeFileAtomic(path.join(OUT_DIR, `draftkings-predictions-feed-${dateStr}-week${weekNum}.json`), JSON.stringify(master));
      console.log(`\nMaster written: ${passed.length} game(s), ${master.rows.length} rows.`);
    }
    const failed = games.filter(g => !g.gate.pass);
    if (failed.length) console.warn(`\n${failed.length} game(s) failed the gate (per-game files still written, excluded from master).`);
    if (!games.length) console.warn('\nNo games captured.');
  } finally {
    try { await browser?.close(); } catch { /* CDP disconnect only */ }
    releaseLock(undefined, token);
  }
  process.exit(0);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((err) => { console.error('DKP event-feed capture failed:', err.message); process.exit(1); });
}
