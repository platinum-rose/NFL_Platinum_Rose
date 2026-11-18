#!/usr/bin/env node
// scripts/props/bol-propshop-ladders.mjs  (Claude Team 2, 2026-11-12)
// BetOnline Prop Shop (Props Builder) LADDER capture by driving the app's own UI.
// Why: bol-propshop-capture.mjs replays the DigitalSportsTech API and gets 403 invalid_security_headers
// (requests must be signed by the app). This script instead selects each game and each stat tab in the
// Prop Shop iframe, saves the rendered text (exactly what Andy sees), parses the "18+ / +131" ladders, and
// also keeps every JSON response the app itself receives. Read-only: it never clicks a price or the betslip.
//
// Usage (repo root; uses the .chrome-bol Chrome on port 9223, launched if missing):
//   .\runbolladders.cmd                    # all games on the board, all stats
//   .\runbolladders.cmd --game "WAS @ NYG" # one game
//   .\runbolladders.cmd --probe            # save page text, clickable texts and a screenshot only
//   .\runbolladders.cmd --all-tabs         # also walk Passing/Rushing/Receiving/Defense/Over-Under/Touchdowns
//   .\runbolladders.cmd --in-frame         # keep the app inside the BetOnline page (fallback mode)
// Note: a player missing from every section usually means BetOnline has his markets suspended at that moment.
// Output: data/generated/props/bol-ladders-<date>_<hhmm>.raw.txt / .json / .api.json
//         (+ a copy of the raw text in data/research-intel/source-evidence/)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { acquireLock, releaseLock } from './cron-bol-scrape.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK_FILE = path.join(ROOT, '.chrome-bol', 'bol-scraper.lock');
const CDP = 'http://127.0.0.1:9223';
const URL = 'https://www.betonline.ag/sportsbook/props';
// Tabs under the "All Games" / "Player Filter" dropdowns (seen 2026-11-12). Each tab holds several stat ladders
// (e.g. Receiving = Receiving Yards, Receptions); the stat name is read from the section headers in the text.
// All Markets holds every section once collapsed sections are opened and VIEW MORE is clicked (verified 2026-11-12:
// 13 sections, same prices as the single tabs). --all-tabs also walks the individual tabs as a cross-check.
const TABS = process.argv.includes('--all-tabs') ? ['All Markets', 'Passing', 'Rushing', 'Receiving', 'Defense', 'Over/Under', 'Touchdowns'] : ['All Markets'];
const STAT_WORDS = /(Yards|Completions|TDs|Attempts|Interceptions|Carries|Receptions|Tackles|Sacks|Touchdowns?|Assists|Longest|Points)/i;
// A section title: has a stat word, is not a player/leg line ("Cam Skattebo 80+"), a rung, odds, or a team.
const STAT_HEADERS = { test: (x) => !!x && STAT_WORDS.test(x) && !/\d+\+$/.test(x) && !/^[+-]?\d/.test(x) && x.length < 60 && !/(H2H|Most |Listed Players)/.test(x) };
const GAME_RE = /^[A-Z]{2,3} @ [A-Z]{2,3}$/;
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const PROBE = argv.includes('--probe');
const ONLY_GAME = arg('--game');

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const STAMP = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}_${pad(local.getHours())}${pad(local.getMinutes())}`;
const OUT_DIR = path.join(ROOT, 'data', 'generated', 'props');
const DIAG_DIR = path.join(OUT_DIR, 'diagnostics');
fs.mkdirSync(DIAG_DIR, { recursive: true });

async function cdpUp() { try { return (await fetch(CDP + '/json/version', { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; } }
async function ensureChrome() {
  if (await cdpUp()) return;
  const exe = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find((p) => fs.existsSync(p));
  if (!exe) throw new Error('Chrome executable not found.');
  console.log('Launching the .chrome-bol Chrome on port 9223...');
  spawn(exe, ['--remote-debugging-port=9223', `--user-data-dir=${path.join(ROOT, '.chrome-bol')}`, '--no-first-run', '--no-default-browser-check', URL], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 15; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await cdpUp()) return; }
  throw new Error('Chrome on port 9223 did not come up.');
}

// ---------- parser (pure) ----------
const TEAM_NAMES = ['Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills', 'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns', 'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers', 'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins', 'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants', 'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'];
const ODDS = /^[+-]\d{2,6}$|^EVEN$/i;
export function parseLadderText(text, { game, stat }) {
  const L = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const rows = [];
  let cur = stat;
  for (let i = 0; i < L.length; i++) {
    if (STAT_HEADERS.test(L[i])) { cur = L[i]; continue; }
    if (!TEAM_NAMES.includes(L[i]) || i < 1) continue;
    const player = L[i - 1];
    if (!player || ODDS.test(player) || /\+$/.test(player) || /^\d+$/.test(player)) continue;
    const team = L[i];
    let j = i + 1;
    while (j + 1 < L.length) {
      const a = L[j], b = L[j + 1];
      const rung = a.match(/^(\d+(?:\.\d+)?)\+$/);
      const ou = a.match(/^(Over|Under|O|U)\s*(\d+(?:\.\d+)?)$/i);
      if ((rung || ou) && ODDS.test(b)) {
        rows.push({ game, tab: stat, stat: cur, player, team, kind: rung ? 'ladder' : 'ou', side: rung ? 'over' : (/^(o|over)$/i.test(ou[1]) ? 'over' : 'under'),
          threshold: rung ? Number(rung[1]) : Number(ou[2]), line: rung ? Number(rung[1]) - 0.5 : Number(ou[2]),
          odds: /even/i.test(b) ? 100 : Number(b) });
        j += 2;
      } else break;
    }
  }
  return rows;
}

const decToAm = (d) => (d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1)));
// Player prices from the Prop Shop's own API responses (sgmMarkets etc.): any object with a player, a statistic,
// a decimal price and a condition value.
export function parseApiMarkets(bodies, game) {
  const rows = [];
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    if (o.player && typeof o.odds === 'number' && o.statistic) {
      const p = o.player;
      const name = typeof p === 'string' ? p : (p.name || p.fullName || p.title || [p.firstName, p.lastName].filter(Boolean).join(' '));
      const team = typeof p === 'object' ? (p.team?.title || p.team?.abbreviation || p.teamAbbr || p.team || null) : null;
      const c = (o.condition || [])[0] || {};
      rows.push({ game, source: 'api', stat: o.statistic, player: name, team: typeof team === 'string' ? team : null,
        conditionType: c.type ?? null, value: c.value ?? null, threshold: typeof c.value === 'number' ? c.value : null,
        oddsDecimal: o.odds, odds: o.odds > 1 ? decToAm(o.odds) : null, active: o.isActive !== false, id: o.id });
    }
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
  };
  walk(bodies);
  return rows;
}

// ---------- UI driving ----------
let PAGE = null;
let CLOSING = false;
const trail = [];
const step = (msg) => { const line = `${new Date().toISOString().slice(11, 19)} ${msg}`; trail.push(line); if (process.env.BOL_LADDERS_VERBOSE || /⚠️|❌/.test(msg)) console.log('   ' + line); };
// Always use the current Prop Shop frame (the app can replace its iframe after a click).
async function F() {
  if (!PAGE || PAGE.isClosed()) throw new Error('The BetOnline capture tab was closed.');
  if (/troya\.xyz/.test(PAGE.url())) return PAGE.mainFrame();
  const fr = PAGE.frames().find((x) => /troya\.xyz/.test(x.url()) && !x.isDetached());
  if (!fr) throw new Error('Prop Shop frame is gone (page URL now ' + PAGE.url() + ').');
  return fr;
}
async function appFrame(page) {
  for (let i = 0; i < 40; i++) {
    const f = page.frames().find((fr) => /troya\.xyz/.test(fr.url()));
    if (f) { try { await f.waitForLoadState('domcontentloaded', { timeout: 5000 }); } catch {} return f; }
    await page.waitForTimeout(1000);
  }
  return null;
}
const frameText = async () => (await F()).evaluate(() => document.body?.innerText || '');
async function clickables() {
  return (await F()).evaluate(() => {
    const out = new Set();
    for (const el of document.querySelectorAll('button,[role=tab],[role=option],[role=button],a,li,span,div,option')) {
      const t = (el.innerText || el.textContent || '').trim();
      if (!t || t.length > 40 || el.children.length > 2) continue;
      const r = el.getBoundingClientRect();
      if (el.tagName !== 'OPTION' && (r.width === 0 || r.height === 0)) continue;
      out.add(t);
    }
    return [...out];
  });
}
const ABBR = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LVR: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NOS: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders', WSH: 'Washington Commanders' };
const fullGame = (g) => { const m = g.match(/^([A-Z]{2,3}) @ ([A-Z]{2,3})$/); return m && ABBR[m[1]] && ABBR[m[2]] ? `${ABBR[m[1]]} @ ${ABBR[m[2]]}` : g; };
const FULL_GAME_RE = new RegExp(`^(${TEAM_NAMES.join('|')}) @ (${TEAM_NAMES.join('|')})$`);
// Position of the visible element with exact text t (the first one in a given vertical band).
async function boxOf(_f, t, { minY = -1, maxY = 1e9 } = {}) {
  const f = await F();
  const loc = f.getByText(t, { exact: true }); const n = await loc.count();
  const hits = [];
  for (let k = 0; k < n; k++) {
    const el = loc.nth(k);
    if (!(await el.isVisible().catch(() => false))) continue;
    const b = await el.boundingBox().catch(() => null);
    if (b && b.y >= minY && b.y <= maxY) hits.push({ el, b });
  }
  hits.sort((x, y) => x.b.y - y.b.y);
  return hits[0] || null;
}
async function realClick(_f, hit, what) {
  step(`click "${what}" at y=${Math.round(hit.b.y)}`);
  try { await hit.el.scrollIntoViewIfNeeded({ timeout: 3000 }); await hit.el.click({ timeout: 5000 }); return true; }
  catch (e) { console.log(`   ⚠️ click on "${what}" failed: ${String(e.message).split('\n')[0]}`); return false; }
}
// The "All Games" dropdown sits next to "Player Filter (Optional)". Its options appear just below it.
async function gameSelectorBox() {
  await (await F()).evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  const pf = await boxOf(null, 'Player Filter (Optional)');
  if (!pf) return null;
  const y = pf.b.y;
  // the selector shows "All Games" or the selected game's full name, at the same height as Player Filter
  for (const t of ['All Games', ...(await clickables()).filter((x) => FULL_GAME_RE.test(x) || GAME_RE.test(x))]) {
    const h = await boxOf(null, t, { minY: y - 25, maxY: y + 25 });
    if (h) return { hit: h, label: t, y };
  }
  return null;
}
async function listGames(f) {
  const txt = await frameText();
  return [...new Set(txt.split('\n').map((x) => x.trim()).filter((x) => FULL_GAME_RE.test(x)))];
}
const abbrOf = (full) => Object.entries(ABBR).filter(([, v]) => v === full).map(([k]) => k);
function sameGame(label, wantFull) {
  if (!label) return false;
  if (label === wantFull) return true;
  const m = label.match(/^([A-Z]{2,3}) @ ([A-Z]{2,3})$/); const w = wantFull.split(' @ ');
  return !!(m && w.length === 2 && abbrOf(w[0]).includes(m[1]) && abbrOf(w[1]).includes(m[2]));
}
async function allBoxes(t) {
  const f = await F(); const loc = f.getByText(t, { exact: true }); const n = await loc.count(); const out = [];
  for (let k = 0; k < n; k++) { const el = loc.nth(k); if (!(await el.isVisible().catch(() => false))) continue; const b = await el.boundingBox().catch(() => null); if (b) out.push({ el, b }); }
  return out;
}
async function selectGame(_f, g) {
  const want = fullGame(g);
  const sel = await gameSelectorBox();
  if (!sel) { step('⚠️ game selector not found next to Player Filter'); return false; }
  if (sameGame(sel.label, want)) return true;
  const before = await allBoxes(want);
  const isNew = (h) => !before.some((x) => Math.abs(x.b.y - h.b.y) < 3 && Math.abs(x.b.x - h.b.x) < 3);
  // try the label, then up to 3 ancestor boxes (the dropdown's clickable container)
  for (let depth = 0; depth <= 3; depth++) {
    if (depth === 0) await realClick(null, sel.hit, sel.label);
    else {
      const anc = sel.hit.el.locator('xpath=' + Array(depth).fill('..').join('/'));
      const b = await anc.boundingBox().catch(() => null);
      step(`click selector ancestor ${depth}${b ? ` at y=${Math.round(b.y)}` : ''}`);
      await anc.click({ timeout: 4000 }).catch((e) => step('⚠️ ancestor click failed: ' + String(e.message).split('\n')[0]));
    }
    await PAGE.waitForTimeout(1200);
    const fresh = (await allBoxes(want)).filter(isNew).sort((x, y) => x.b.y - y.b.y);
    if (fresh.length) {
      if (!(await realClick(null, fresh[0], want + ' (dropdown option)'))) return false;
      await PAGE.waitForTimeout(2500);
      const after = await gameSelectorBox();
      if (after && sameGame(after.label, want)) return true;
      step(`⚠️ selector shows "${after?.label}" after choosing "${want}"`);
      return false;
    }
  }
  step('⚠️ the All Games dropdown never showed new options');
  await PAGE.keyboard.press('Escape').catch(() => {});
  return false;
}
// Tabs sit in one row just below the selectors.
async function clickTab(f, tab) {
  await (await F()).evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await PAGE.waitForTimeout(400);
  const pf = await boxOf(f, 'Player Filter (Optional)');
  const hit = await boxOf(f, tab, { minY: pf ? pf.b.y + 10 : 0, maxY: pf ? pf.b.y + 160 : 1e9 });
  if (!hit) return false;
  return realClick(f, hit, tab);
}
// Open collapsed sections (a stat header followed directly by another header, VIEW MORE or the footer) and keep
// clicking VIEW MORE until every player is listed.
async function expandAll() {
  const isHeader = (x) => STAT_HEADERS.test(x);
  for (let round = 0; round < 25; round++) {
    let clicked = 0;
    const f = await F();
    // 1) VIEW MORE buttons (any case)
    const vm = f.getByText(/^\s*view more\s*$/i);
    const n = await vm.count();
    for (let k = 0; k < n; k++) {
      const el = vm.nth(k);
      if (!(await el.isVisible().catch(() => false))) continue;
      await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      if (await el.click({ timeout: 3000 }).then(() => true).catch(() => false)) { clicked++; step('click VIEW MORE'); }
    }
    // 2) collapsed sections
    const lines = (await frameText()).split('\n').map((x) => x.trim()).filter(Boolean);
    const start = lines.findIndex((x) => x === 'H2H Handicap' || x === 'Exotics');
    const collapsed = [];
    for (let i = Math.max(0, start); i < lines.length - 1; i++) {
      if (isHeader(lines[i]) && !/(Bands|Exact)\)?$/.test(lines[i]) && (isHeader(lines[i + 1]) || /(Bands|Exact)\)?$/.test(lines[i + 1]) || /^(view more|powered by|performance doubles|specials|head to head)$/i.test(lines[i + 1]))) collapsed.push(lines[i]);
    }
    for (const h of [...new Set(collapsed)]) {
      if (opened.has(h)) continue;
      const hit = await boxOf(null, h);
      if (hit && (await realClick(null, hit, `section ${h}`))) { opened.add(h); clicked++; }
    }
    if (!clicked) break;
    await PAGE.waitForTimeout(1500);
  }
}
const opened = new Set();
async function scrollAll() {
  await (await F()).evaluate(async () => {
    const els = [document.scrollingElement, ...document.querySelectorAll('*')].filter((e) => e && e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible');
    for (const e of els.slice(0, 6)) { for (let y = 0; y < e.scrollHeight; y += 600) { e.scrollTop = y; await new Promise((r) => setTimeout(r, 120)); } }
  }).catch(() => {});
}

async function main() {
  const token = acquireLock(LOCK_FILE, { exitOnBusy: false });
  if (!token) { console.log('Another BetOnline capture holds the lock; try again when it finishes.'); return; }
  let page;
  const api = [];
  try {
    await ensureChrome();
    const browser = await chromium.connectOverCDP(CDP);
    const ctx = browser.contexts()[0] || (await browser.newContext());
    page = await ctx.newPage();
    PAGE = page;
    page.on('close', () => { if (!CLOSING) step('❌ capture tab closed'); });
    page.on('framedetached', (fr) => { if (/troya/.test(fr.url())) step('⚠️ Prop Shop frame detached (app reloaded it)'); });
    page.on('popup', (p) => step(`⚠️ popup opened: ${p.url()}`));
    page.on('response', async (res) => {
      const u = res.url();
      if (!/digitalsportstech\.com\/api\//.test(u) || res.status() !== 200) return;
      try { api.push({ url: u, at: new Date().toISOString(), body: await res.json() }); } catch {}
    });
    console.log(`Opening ${URL} ...`);
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const f = await appFrame(page);
    if (!f) throw new Error('Prop Shop iframe (troya.xyz) never loaded: check that the BetOnline Chrome is logged in.');
    await page.waitForTimeout(4000);
    // Load the Prop Shop app as the page itself (same signed URL), so no click can navigate the BetOnline page away.
    const appUrl = f.url();
    step(`app url ${appUrl.slice(0, 60)}...`);
    if (!argv.includes('--in-frame')) {
      await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => step('⚠️ top-level app load failed: ' + e.message));
      await page.waitForTimeout(6000);
      const t = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
      if (!/Player Filter/.test(t)) {
        step('⚠️ app did not render top-level; falling back to the iframe');
        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await appFrame(page); await page.waitForTimeout(6000);
      } else step('app loaded top-level');
    }

    const startText = await frameText();
    const startClick = await clickables();
    if (PROBE || !startText.trim()) {
      const base = path.join(DIAG_DIR, `bol-ladders-probe-${STAMP}`);
      fs.writeFileSync(base + '.txt', startText);
      fs.writeFileSync(base + '.clickables.json', JSON.stringify(startClick, null, 2));
      await page.screenshot({ path: base + '.png' }).catch(() => {});
      console.log(`Probe saved: ${base}.txt / .clickables.json / .png`);
      if (PROBE) return;
    }

    // Games: the options of the "All Games" dropdown (not the featured cards).
    let games = ONLY_GAME ? [fullGame(ONLY_GAME)] : await listGames(f);
    if (!games.length) throw new Error('No games found in the "All Games" dropdown. Rerun with --probe and tell Claude.');
    console.log(`Games: ${games.join(', ')}`);

    const blocks = [`BOL_LADDERS_HEADER|${new Date().toISOString()}|games=${games.length}`];
    const rows = [];
    const misses = [];
    const apiRows = [];
    for (const g of games) {
      const apiStart = api.length;
      if (!(await selectGame(f, g))) { misses.push(`${g}: could not select in All Games`); await page.screenshot({ path: path.join(DIAG_DIR, `bol-ladders-gamesel-${STAMP}.png`) }).catch(() => {}); continue; }
      console.log(`Selected ${g}`);
      for (const tab of TABS) {
        opened.clear();
        const before = await frameText();
        if (!(await clickTab(f, tab))) { misses.push(`${g} / ${tab}: tab not found`); continue; }
        await page.waitForTimeout(2500);
        if ((await frameText()) === before && tab !== TABS[0]) {
          misses.push(`${g} / ${tab}: page did not change after the click`);
          await page.screenshot({ path: path.join(DIAG_DIR, `bol-ladders-nochange-${STAMP}-${tab.replace(/\W+/g, '')}.png`) }).catch(() => {});
        }
        await expandAll();
        await scrollAll();
        const txt = await frameText();
        const parsed = parseLadderText(txt, { game: g, stat: tab });
        rows.push(...parsed);
        blocks.push(`=== GAME|${g}|TAB|${tab}|${new Date().toISOString()}|rows=${parsed.length}`, txt);
        console.log(`  ${g} / ${tab}: ${parsed.length} prices (screen)`);
      }
      const ar = parseApiMarkets(api.slice(apiStart).map((x) => x.body), g);
      apiRows.push(...ar);
      const mine = rows.filter((r) => r.game === g);
      const byStat = {}; for (const r of mine) (byStat[r.stat] ??= new Set()).add(r.player);
      console.log(`  ${g}: ` + Object.entries(byStat).map(([k, v]) => `${k} ${v.size}`).join(', '));
    }
    const rawPath = path.join(OUT_DIR, `bol-ladders-${STAMP}.raw.txt`);
    fs.writeFileSync(rawPath, blocks.join('\n') + '\n');
    fs.mkdirSync(path.join(ROOT, 'data', 'research-intel', 'source-evidence'), { recursive: true });
    fs.copyFileSync(rawPath, path.join(ROOT, 'data', 'research-intel', 'source-evidence', `${STAMP.slice(0, 10)}-bol-ladders.raw.txt`));
    fs.writeFileSync(path.join(OUT_DIR, `bol-ladders-${STAMP}.api.json`), JSON.stringify(api));
    const dedup = [...new Map(rows.map((r) => [[r.game, r.stat, r.player, r.side, r.threshold, r.kind].join('|'), r])).values()];
    const apiDedup = [...new Map(apiRows.map((r) => [r.id || [r.game, r.stat, r.player, r.value].join('|'), r])).values()];
    fs.writeFileSync(path.join(OUT_DIR, `bol-ladders-${STAMP}.json`), JSON.stringify({ schema: 'bol_ladders_v1', capturedAt: new Date().toISOString(), games, misses, rows: dedup, apiRows: apiDedup }, null, 2));
    console.log(`\nSaved ${rawPath}\n  ${dedup.length} ladder prices from screen text, ${apiDedup.length} from the app's data, ${api.length} API responses kept, ${misses.length} misses`);
    if (misses.length) console.log('  Misses: ' + misses.slice(0, 12).join('; '));
    if (!dedup.length && !apiDedup.length) {
      const base = path.join(DIAG_DIR, `bol-ladders-empty-${STAMP}`);
      await page.screenshot({ path: base + '.png' }).catch(() => {});
      fs.writeFileSync(base + '.clickables.json', JSON.stringify(await clickables(), null, 2));
      console.log(`  No prices parsed. Diagnostics: ${base}.png / .clickables.json (Claude can read these; no pasting needed).`);
    }
  } catch (e) {
    const base = path.join(DIAG_DIR, `bol-ladders-error-${STAMP}`);
    if (page && !page.isClosed()) await page.screenshot({ path: base + '.png' }).catch(() => {});
    fs.writeFileSync(base + '.json', JSON.stringify({ error: String(e.message || e), pageUrl: page && !page.isClosed() ? page.url() : null,
      frames: page && !page.isClosed() ? page.frames().map((x) => x.url().slice(0, 120)) : [], trail }, null, 2));
    console.log(`   Diagnostics: ${base}.json (+ .png if the tab was still open)`);
    throw e;
  } finally {
    fs.writeFileSync(path.join(DIAG_DIR, `bol-ladders-trail-${STAMP}.txt`), trail.join('\n'));
    CLOSING = true;
    if (page) await page.close().catch(() => {});
    releaseLock(LOCK_FILE, token);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
