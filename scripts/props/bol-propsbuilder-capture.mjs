#!/usr/bin/env node
// scripts/props/bol-propsbuilder-capture.mjs
// ═══════════════════════════════════════════════════════════
// BetOnline Props Builder capture (read-only) — added 2026-11-14 (Claude, Andy OK'd).
//
// Why: BetOnline's game pages only list yardage / reception props for a few games. The full player
// over/under board lives in the Props Builder (https://www.betonline.ag/sportsbook/props), an iframe
// served by DigitalSportsTech (troya.xyz -> bv2-us.digitalsportstech.com). Its API rejects direct or
// replayed calls (signed challenge + nonce: 403 "replay_detected"), so this script drives the UI
// in the BOL capture Chrome (CDP 9223) and saves the JSON the page itself receives:
//   Over/Under tab -> open each stat -> open each game  (dfm/marketsByOu responses)
// It never clicks odds buttons, the bet slip, or anything account-related.
//
// Merge rules: rows are added to the BEO master JSON and per-matchup files written by cron-bol-scrape.mjs.
// Main-board rows win when the same game + player + market already exists. Over/Under is read from
// DST "condition": 3 = Over, 1 = Under (checked against Bookmaker on 2026-11-14).
//
// Usage:
//   node scripts/props/bol-propsbuilder-capture.mjs --master data/generated/props/betonline-live-<date>-week<N>.json
//   (cron-bol-scrape.mjs calls captureAndMergePropsBuilder() after it writes the master; failures there are non-fatal)
// ═══════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const CDP = 'http://127.0.0.1:9223';
const PROPS_URL = 'https://www.betonline.ag/sportsbook/props';
const STATS = {
  'Passing Yards': 'pass_yds', 'Pass Completions': 'pass_cmp', 'Passing TDs': 'pass_td', 'Pass Attempts': 'pass_att',
  'Rushing Yards': 'rush_yds', 'Carries': 'carries', 'Receiving Yards': 'rec_yds', 'Receptions': 'rec',
};
const NICK = {
  cardinals: 'ARI', falcons: 'ATL', ravens: 'BAL', bills: 'BUF', panthers: 'CAR', bears: 'CHI', bengals: 'CIN', browns: 'CLE',
  cowboys: 'DAL', broncos: 'DEN', lions: 'DET', packers: 'GB', texans: 'HOU', colts: 'IND', jaguars: 'JAX', chiefs: 'KC',
  raiders: 'LV', chargers: 'LAC', rams: 'LAR', dolphins: 'MIA', vikings: 'MIN', patriots: 'NE', saints: 'NO', giants: 'NYG',
  jets: 'NYJ', eagles: 'PHI', steelers: 'PIT', '49ers': 'SF', seahawks: 'SEA', buccaneers: 'TB', titans: 'TEN', commanders: 'WAS',
};
const DST_ABBR = { nos: 'NO', lvr: 'LV', jac: 'JAX', wsh: 'WAS', la: 'LAR' };
const teamOf = (name) => NICK[String(name || '').trim().split(/\s+/).pop().toLowerCase()] || null;
const dstCode = (a) => DST_ABBR[a] || String(a || '').toUpperCase();
const american = (d) => (d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1)));

export async function capturePropsBuilder({ log = console.log } = {}) {
  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0] || await browser.newContext();
  const page = await ctx.newPage();
  const markets = []; let games = null;
  page.on('response', async (r) => {
    const u = r.url();
    if (!/digitalsportstech\.com\/api\//.test(u)) return;
    try {
      if (/\/api\/sgmGames\?/.test(u) && /league=nfl/.test(u)) games = JSON.parse((await r.body()).toString('utf8'));
      else if (/\/api\/dfm\/marketsByOu/.test(u)) markets.push({ url: u, body: JSON.parse((await r.body()).toString('utf8')) });
    } catch { /* ignore */ }
  });
  try {
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto(PROPS_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(18000);
    const fr = page.frames().find((f) => /troya/.test(f.url()));
    if (!fr) throw new Error('Props Builder iframe (troya.xyz) not found — is the BOL Chrome logged in?');
    await fr.getByText('Over/Under', { exact: true }).first().click();
    await page.waitForTimeout(3000);
    const gameRe = /^[A-Z][A-Za-z0-9 .']+ @ [A-Z][A-Za-z0-9 .']+$/;
    for (const st of Object.keys(STATS)) {
      const hdr = fr.locator(`text=Over/Under (${st})`).first();
      try { await hdr.scrollIntoViewIfNeeded(); await hdr.click({ timeout: 8000 }); } catch (e) { log(`  ⚠️ ${st}: header not found (${e.message.split('\n')[0]})`); continue; }
      await page.waitForTimeout(3500);
      const rows = fr.getByText(gameRe);
      const n = await rows.count();
      for (let i = 0; i < n; i++) {
        try { const row = rows.nth(i); await row.scrollIntoViewIfNeeded(); await row.click({ timeout: 5000 }); await page.waitForTimeout(2500); } catch { /* skip */ }
      }
      log(`  Props Builder ${st}: ${n} games, ${markets.length} market responses so far`);
      try { await hdr.scrollIntoViewIfNeeded(); await hdr.click({ timeout: 5000 }); } catch { /* ignore */ }
      await page.waitForTimeout(1500);
    }
  } finally {
    await page.close().catch(() => {});
  }
  return { capturedAt: new Date().toISOString(), games: games || [], markets };
}

export function mergePropsBuilder(master, cap) {
  const nix = new Map();
  for (const g of cap.games) {
    const pid = (g.providers || []).find((p) => p.name === 'nix')?.id;
    if (pid) nix.set(Number(pid), [dstCode(g.team2?.[0]?.abbreviation), dstCode(g.team1?.[0]?.abbreviation)]);
  }
  const evByTeams = new Map();
  for (const r of master.rows || []) {
    const [a, h] = String(r.event || '').split(' @ ');
    if (a && h) evByTeams.set(`${teamOf(a)}@${teamOf(h)}`, r);
  }
  const have = new Set((master.rows || []).filter((r) => r.bet === 'prop').map((r) => `${r.event}|${r.player}|${r.market}`));
  const seen = new Set(); const added = [];
  for (const resp of cap.markets) {
    const gid = Number((resp.url.match(/gameId=(\d+)/) || [])[1]);
    const teams = nix.get(gid); if (!teams) continue;
    const ev = evByTeams.get(`${teams[0]}@${teams[1]}`); if (!ev) continue;
    for (const blk of Array.isArray(resp.body) ? resp.body : [resp.body]) {
      const mk = STATS[blk?.statistic]; if (!mk) continue;
      for (const pl of blk.players || []) {
        if (have.has(`${ev.event}|${pl.name}|${mk}`)) continue;
        for (const x of pl.markets || []) {
          if (!x.isActive) continue;
          const side = x.condition === 3 ? 'Over' : x.condition === 1 ? 'Under' : null;
          if (!side) continue;
          const k = `${ev.event}|${pl.name}|${mk}|${side}|${x.value}`;
          if (seen.has(k)) continue; seen.add(k);
          const title = `${pl.name} ${pl.team || ''} ${blk.statistic} (Props Builder)`.replace(/\s+/g, ' ');
          added.push({
            book: 'BEO', source: 'betonline_props_builder_dst', eventId: ev.eventId, eventUrl: PROPS_URL, event: ev.event, game: ev.event,
            startTime: ev.startTime, market: mk, bet: 'prop', marketTitle: title, sectionTitle: title, player: pl.name, team: pl.team,
            side, line: x.value, odds: american(x.odds), selection: `${side} ${x.value} ${blk.statistic}`, available: true, capturedAt: cap.capturedAt,
          });
        }
      }
    }
  }
  return added;
}

export async function captureAndMergePropsBuilder({ masterJson, log = console.log }) {
  const master = JSON.parse(fs.readFileSync(masterJson, 'utf8'));
  log('\n🧱 Capturing BetOnline Props Builder (over/under player props)...');
  const cap = await capturePropsBuilder({ log });
  const dir = path.dirname(masterJson);
  const stem = path.basename(masterJson).replace(/-week\d+\.json$/, '');   // betonline-live-<date>
  fs.writeFileSync(path.join(dir, `${stem.replace('betonline-live', 'betonline-propsbuilder-raw')}.json`), JSON.stringify(cap), 'utf8');
  const added = mergePropsBuilder(master, cap);
  if (!added.length) { log('⚠️ Props Builder: no rows added (nothing captured or every player already on the main board).'); return { added: 0 }; }
  master.rows = [...master.rows, ...added];
  master.totalRows = master.rows.length;
  master.propsBuilder = { capturedAt: cap.capturedAt, rowsAdded: added.length, responses: cap.markets.length, source: PROPS_URL };
  fs.writeFileSync(masterJson, JSON.stringify(master, null, 2), 'utf8');
  // per-matchup files (same naming as cron-bol-scrape.mjs)
  const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const byEv = new Map();
  for (const r of added) { if (!byEv.has(r.event)) byEv.set(r.event, []); byEv.get(r.event).push(r); }
  for (const [ev, rows] of byEv) {
    const [a, h] = ev.split(' @ ');
    const p = path.join(dir, `${stem}-${slug(a.split(' ').pop())}-at-${slug(h.split(' ').pop())}.json`);
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    d.rows = [...(d.rows || []), ...rows];
    d.summary = { ...(d.summary || {}), rows: d.rows.length, props_builder_rows: rows.length };
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
  }
  const byMk = {}; for (const r of added) byMk[r.market] = (byMk[r.market] || 0) + 1;
  log(`✅ Props Builder: +${added.length} rows across ${byEv.size} games ${JSON.stringify(byMk)}`);
  return { added: added.length, games: byEv.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const i = process.argv.indexOf('--master');
  const masterJson = i > -1 ? path.resolve(process.argv[i + 1]) : null;
  if (!masterJson) { console.error('usage: --master data/generated/props/betonline-live-<date>-week<N>.json'); process.exit(1); }
  captureAndMergePropsBuilder({ masterJson }).then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
}
