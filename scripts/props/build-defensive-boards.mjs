#!/usr/bin/env node
// scripts/props/build-defensive-boards.mjs
// Collects every captured defensive prop offer for a week into one board file and appends
// it to the season history used to grade defensive lines against results:
//   - BetOnline SGP builder ladders  data/generated/props/betonline-sgp-<date>-<a>-at-<h>.json
//   - DK Predictions event feeds      data/generated/props/draftkings-predictions-{feed,defense}-<date>-<a>-at-<h>.json
// Markets: tackles_assists, tackles (solo), assists, sacks, def_int, pass_int (QB INTs thrown).
// Output:
//   data/defensive-props/boards/defensive-boards-week-NN.json   (latest offer per book/player/market/threshold)
//   data/defensive-props/boards/defensive-board-history-<season>.jsonl  (every capture, de-duplicated)
// Local files only. Usage: node scripts/props/build-defensive-boards.mjs [--week 8] [--season 2026]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROPS = path.join(ROOT, 'data', 'generated', 'props');
const OUT = path.join(ROOT, 'data', 'defensive-props', 'boards');
const DEF = new Set(['tackles_assists', 'tackles', 'assists', 'sacks', 'def_int', 'pass_int']);

export const implied = (a) => (a == null ? null : a > 0 ? 100 / (a + 100) : -a / (-a + 100));
const round = (v, d = 4) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

// DK labels: '0.5+' / '4+' / 'Over 4.5' -> N+ threshold
export function dkThreshold(r) {
  const s = String(r.label ?? r.line ?? '');
  let m = s.match(/(\d+(?:\.\d+)?)\+/);
  if (m) { const x = Number(m[1]); return Number.isInteger(x) ? x : Math.ceil(x); }
  m = s.match(/over\s*(\d+(?:\.\d+)?)/i);
  if (m) return Math.floor(Number(m[1])) + 1;
  if (r.line != null && Number.isFinite(Number(r.line))) return Math.floor(Number(r.line)) + 1;
  return null;
}

export function normalizeDkRow(r, game, capturedAt) {
  if (!DEF.has(r.market) || (r.side && !/^(yes|over)$/i.test(r.side))) return null;
  const n = dkThreshold(r);
  if (!n || r.american == null) return null;
  return { book: 'DKP', source: 'dkp_event_feed', game, capturedAt, market: r.market, player: r.player, team: r.team, threshold: n, line: n - 0.5, american: r.american };
}

export function collect({ week, files }) {
  const offers = [];
  for (const f of files) {
    let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    const base = path.basename(f);
    if (d.schema === 'betonline_sgp_ladders_v1') {
      if (week && d.week && Number(d.week) !== Number(week)) continue;
      for (const r of d.rows) if (DEF.has(r.market)) offers.push({ ...r, week: d.week ?? week, file: base });
    } else if (/^draftkings-predictions-(feed|defense)-\d{4}-\d{2}-\d{2}-[a-z]+-at-[a-z]+\.json$/.test(base)) {
      const game = (base.match(/-([a-z]+)-at-([a-z]+)\.json$/) || []).slice(1).map(s => s.toUpperCase()).join('@');
      if (week && d.week && Number(d.week) !== Number(week)) continue;
      for (const r of d.rows || []) { const o = normalizeDkRow(r, game, d.capturedAt); if (o) offers.push({ ...o, week: d.week ?? week, file: base }); }
    }
  }
  for (const o of offers) {
    o.implied = round(implied(o.american));
    const t = Date.parse(o.capturedAt); if (Number.isFinite(t)) o.capturedAt = new Date(t).toISOString(); // one format for de-dup
  }
  // latest capture wins per book/game/player/market/threshold
  const latest = new Map();
  for (const o of offers) {
    const k = [o.book, o.game, o.player, o.market, o.threshold].join('|');
    if (!latest.has(k) || String(o.capturedAt) > String(latest.get(k).capturedAt)) latest.set(k, o);
  }
  return { offers, latest: [...latest.values()] };
}

function main() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
  const week = arg('--week') ? Number(arg('--week')) : null;
  const season = arg('--season') || '2026';
  const files = fs.existsSync(PROPS) ? fs.readdirSync(PROPS).filter(f => /^(betonline-sgp-|draftkings-predictions-(feed|defense)-).*\.json$/.test(f)).map(f => path.join(PROPS, f)) : [];
  const { offers, latest } = collect({ week, files });
  fs.mkdirSync(OUT, { recursive: true });
  const histPath = path.join(OUT, `defensive-board-history-${season}.jsonl`);
  const seen = new Set();
  if (fs.existsSync(histPath)) for (const line of fs.readFileSync(histPath, 'utf8').split('\n')) {
    if (!line.trim()) continue; const o = JSON.parse(line); seen.add([o.book, o.game, o.player, o.market, o.threshold, o.capturedAt].join('|'));
  }
  const add = offers.filter(o => !seen.has([o.book, o.game, o.player, o.market, o.threshold, o.capturedAt].join('|')));
  if (add.length) fs.appendFileSync(histPath, add.map(o => JSON.stringify(o)).join('\n') + '\n');
  const byMarket = latest.reduce((m, o) => ({ ...m, [`${o.book}:${o.market}`]: (m[`${o.book}:${o.market}`] || 0) + 1 }), {});
  if (week) {
    fs.writeFileSync(path.join(OUT, `defensive-boards-week-${String(week).padStart(2, '0')}.json`),
      JSON.stringify({ schema: 'defensive_boards_v1', week, generatedAt: new Date().toISOString(), games: [...new Set(latest.map(o => o.game))], byMarket, offers: latest }, null, 2) + '\n');
  }
  console.log(JSON.stringify({ week, files: files.length, offers: offers.length, latest: latest.length, historyAdded: add.length, byMarket }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
