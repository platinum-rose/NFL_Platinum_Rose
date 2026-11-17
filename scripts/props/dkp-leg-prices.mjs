#!/usr/bin/env node
// scripts/props/dkp-leg-prices.mjs
// ==============================================================================
// Copy each DraftKings Predictions leg's feed price onto the ticket at logging time
// (Andy 2026-11-17, midseason audit decision 9: 163 of 232 W10 DKP legs had no price, so
// leg-level break-even could not be judged).
//
// Source: data/generated/props/draftkings-predictions-feed-*.json (dkp-event-feed-capture.mjs).
// For each unpriced leg it takes the most recent capture made BEFORE the ticket was placed
// (or the most recent capture at all when placed_at has no time) and writes
//   legs[].price = <american>, price_source = 'dkp_feed', price_feed_captured_at, price_feed_file.
// Legs it cannot match stay unpriced and are listed. Never changes a leg that already has a price.
//
// Usage:
//   node scripts/props/dkp-leg-prices.mjs --ticket <id>[,<id>] [--apply]
//   node scripts/props/dkp-leg-prices.mjs --week N [--apply]       # every DKP ticket that week
// Dry run by default. --apply backs up the ledger, then writes it.
// add-placed-wager.mjs calls priceDkpTicket() on DraftKings Predictions tickets before saving.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const PROPS_DIR = path.join(REPO_ROOT, 'data', 'generated', 'props');
const WAGERS_PATH = path.join(REPO_ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
export const DKP_BOOK = 'DraftKings Predictions';

// Ledger market name -> feed market key.
export const LEG_TO_FEED = {
  anytime_td: 'atd_1_plus', anytime_touchdown: 'atd_1_plus', atd: 'atd_1_plus',
  first_td: 'first_td', first_touchdown: 'first_td', first_touchdown_scorer: 'first_td',
  two_plus_touchdowns: 'td_2_plus', touchdowns_2plus: 'td_2_plus', touchdowns_2_plus: 'td_2_plus',
  receptions: 'rec', receiving_yards: 'rec_yds', rushing_yards: 'rush_yds', passing_yards: 'pass_yds',
  passing_touchdowns: 'pass_td', pass_td: 'pass_td',
  pass_interceptions: 'pass_int', interceptions_thrown: 'pass_int', interceptions: 'pass_int',
  tackles_assists: 'tackles_assists', tackles_combined: 'tackles_assists', sacks: 'sacks',
  carries: 'carries', rushing_attempts: 'carries', rush_attempts: 'carries',
  field_goals_made: 'fg_made', spread: 'spread', total: 'game_total', game_total: 'game_total', moneyline: 'moneyline',
};
const YES_MARKETS = new Set(['atd_1_plus', 'first_td', 'td_2_plus']);
const TEAM_FIX = { WAS: 'WSH', JAC: 'JAX', LA: 'LAR', LVR: 'LV' };

export const nameKey = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[.'’]/g, '').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const team = (t) => { const u = String(t || '').toUpperCase().trim(); return TEAM_FIX[u] || u; };
export const gameKey = (g) => { const m = String(g || '').match(/([A-Za-z]{2,4})\s*@\s*([A-Za-z]{2,4})/); return m ? `${team(m[1])}@${team(m[2])}` : null; };

// Feed market for a row; older captures left kicker milestones in 'other'.
const rowMarket = (r) => (r.market === 'other' && /Field Goals Made/i.test(`${r.marketType} ${r.marketName}`) ? 'fg_made' : r.market);
// The over/under threshold a row prices: milestone "3+" is 2.5; sacks "0.5+" is 0.5; O/U uses line.
function rowLine(r) {
  if (r.kind === 'milestone') return Number(r.lineEquiv);
  if (r.kind === 'ou') return Number(r.line);
  const m = String(r.label || '').match(/^(\d+(?:\.\d+)?)\+$/);
  if (m) return Number(m[1]) % 1 ? Number(m[1]) : Number(m[1]) - 0.5;
  return null;
}

export function matchLeg(leg, rows) {
  const fm = LEG_TO_FEED[String(leg.market || '').replace(/^sgp_/, '').replace(/^alternate_/, '')];
  if (!fm) return null;
  const g = gameKey(leg.game);
  const cands = rows.filter((r) => rowMarket(r) === fm && (!g || !r.game || gameKey(r.game) === g) && r.american != null);
  if (fm === 'spread' || fm === 'game_total' || fm === 'moneyline') {
    const dir = String(leg.direction || '').toLowerCase();
    return cands.find((r) => {
      if (fm === 'game_total') return Number(r.line) === Number(leg.line) && String(r.side).toLowerCase() === (dir === 'under' ? 'under' : 'over');
      const side = String(r.label || '').split(' ')[0];
      const lineOk = fm === 'moneyline' || Number(r.line) === Number(leg.line);
      return lineOk && team(side) === team(leg.team);
    }) || null;
  }
  const who = nameKey(leg.player);
  if (!who) return null;
  const mine = cands.filter((r) => nameKey(r.player) === who);
  if (YES_MARKETS.has(fm)) return mine.find((r) => /^yes$/i.test(r.side) || nameKey(r.label) === who) || null;
  const line = Number(leg.line);
  const under = String(leg.direction || '').toLowerCase() === 'under';
  return mine.find((r) => rowLine(r) === line && (r.kind !== 'ou' || String(r.side).toLowerCase() === (under ? 'under' : 'over'))
    && (r.kind === 'ou' || !under)) || null;
}

export function loadFeeds(week, dir = PROPS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^draftkings-predictions-feed-.*\.json$/.test(f)).map((f) => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (week != null && d.week != null && Number(d.week) !== Number(week)) return null;
      return { file: f, capturedAt: d.capturedAt || null, rows: d.rows || [] };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)));
}

// Fills prices on unpriced legs in place. Returns { priced: [...], missing: [...] }.
export function priceDkpTicket(ticket, feeds = loadFeeds(ticket.week)) {
  const placed = /T\d{2}:\d{2}/.test(String(ticket.placed_at || '')) ? Date.parse(ticket.placed_at) : null;
  const usable = placed ? feeds.filter((f) => f.capturedAt && Date.parse(f.capturedAt) <= placed) : feeds;
  const out = { priced: [], missing: [] };
  for (const leg of ticket.legs || []) {
    if (leg.price != null && leg.price !== '') continue;
    let hit = null;
    for (const f of usable) { const r = matchLeg(leg, f.rows); if (r) { hit = { r, f }; break; } }
    if (!hit) { out.missing.push(leg.selection || leg.market); continue; }
    leg.price = hit.r.american;
    leg.price_source = 'dkp_feed';
    leg.price_feed_captured_at = hit.f.capturedAt;
    leg.price_feed_file = hit.f.file;
    out.priced.push(`${leg.selection} ${hit.r.american > 0 ? '+' : ''}${hit.r.american}`);
  }
  return out;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/props/dkp-leg-prices.mjs')) {
  const args = process.argv.slice(2);
  const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const ids = arg('--ticket') ? new Set(arg('--ticket').split(',').map((s) => s.trim())) : null;
  const week = arg('--week') ? Number(arg('--week')) : null;
  if (!ids && week == null) { console.error('Pass --ticket <id> or --week N'); process.exit(1); }
  const raw = fs.readFileSync(WAGERS_PATH, 'utf8');
  const wagers = JSON.parse(raw);
  const feedCache = new Map();
  let changed = 0; let legsPriced = 0; let legsMissing = 0;
  for (const t of wagers) {
    if (t.book !== DKP_BOOK) continue;
    if (ids ? !ids.has(t.id) : Number(t.week) !== week) continue;
    if (!feedCache.has(t.week)) feedCache.set(t.week, loadFeeds(t.week));
    const r = priceDkpTicket(t, feedCache.get(t.week));
    legsPriced += r.priced.length; legsMissing += r.missing.length;
    if (r.priced.length) changed += 1;
    console.log(`${t.id}: priced ${r.priced.length}, unmatched ${r.missing.length}${r.missing.length ? ` (${r.missing.join('; ')})` : ''}`);
  }
  console.log(`${legsPriced} leg(s) priced on ${changed} ticket(s); ${legsMissing} leg(s) unmatched.`);
  if (args.includes('--apply') && changed) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
    fs.copyFileSync(WAGERS_PATH, `${WAGERS_PATH}.bak-dkp-leg-prices-${stamp}`);
    fs.writeFileSync(WAGERS_PATH, JSON.stringify(wagers, null, 2) + '\n', 'utf8');
    console.log('ledger written (backup made first)');
  } else if (changed) console.log('dry run: pass --apply to write');
}
