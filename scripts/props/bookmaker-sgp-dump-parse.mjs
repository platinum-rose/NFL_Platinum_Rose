#!/usr/bin/env node
// scripts/props/bookmaker-sgp-dump-parse.mjs — parse a Bookmaker SGP text dump (from
// scripts/props/bookmaker-sgp-extract.browser.js) into bookmaker_live_markets_v1 JSON:
// one file per game + a combined week file under data/generated/props/.
// usage: node scripts/props/bookmaker-sgp-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N
import fs from 'node:fs';
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const IN = arg('--in'), DATE = arg('--date'), WEEK = arg('--week');
if (!IN || !DATE || !WEEK) { console.error('usage: --in <dump.txt> --date YYYY-MM-DD --week N'); process.exit(1); }
const raw = fs.readFileSync(IN, 'utf8').split('\n');
const PM = [['Passing Yards','pass_yds'],['Pass Completions','pass_cmp'],['Passing Touchdowns','pass_td'],['Receptions','rec'],['Receiving Yards','rec_yds'],['Rushing Yards','rush_yds'],['Carries','carries']];
const TD = { 'Player To Score 1st Touchdown':'first_td','Player To Score 1+ Touchdown':'atd_1_plus','Player To Score 2+ Touchdown':'td_2_plus','Player To Score 3+ Touchdown':'td_3_plus' };
const PERIOD = [['First Half','first_half_lines'],['First Quarter','first_quarter_lines'],['Second Quarter','second_quarter_lines'],['Third Quarter','third_quarter_lines'],['Fourth Quarter','fourth_quarter_lines']];
const odds = (s) => (s == null ? null : Number(s));
const events = []; let ev = null, sec = null, secIdx = -1;
for (const line of raw) {
  const [k, ...rest] = line.split('|'); const v = rest.join('|');
  if (k === 'EVENT') { const [name, url, at] = rest; ev = { event: name, eventUrl: 'https://be.bookmaker.eu' + url, capturedAt: at, rows: [] }; events.push(ev); secIdx = -1; continue; }
  if (!ev) continue;
  if (k === 'T') {
    secIdx++; const t = v.replace(/^.{2,40}?\svs\s.{2,40}?\s*:\s*/i, '');
    let market = 'unknown', player = null, period = null;
    if (secIdx === 0 || t === 'Game') market = 'game_lines';
    else if (TD[t]) market = TD[t];
    else { const p = PERIOD.find(([n]) => v.endsWith(n)); if (p) market = p[1];
      else { const m = PM.find(([n]) => t.endsWith(' ' + n)); if (m) { market = m[1]; player = t.slice(0, -(m[0].length + 1)).trim(); } } }
    sec = { title: v, market, player, mode: null }; continue;
  }
  if (k !== 'I' || !sec) continue;
  const base = { book: 'BKR', event: ev.event, eventUrl: ev.eventUrl, sectionTitle: sec.title, market: sec.market, source: 'bookmaker_live_dom', capturedAt: ev.capturedAt, selection: v };
  if (v === 'Money Line') { sec.mode = 'ml'; continue; }
  let m;
  if (sec.player && (m = v.match(/^(.*?) (\d+(?:\.\d+)?)\+(?: ([+-]\d+))?$/))) { ev.rows.push({ ...base, player: m[1], side: 'Over', line: Number(m[2]) - 0.5, threshold: Number(m[2]), odds: odds(m[3]), available: m[3] != null }); continue; }
  if (TD[sec.title.replace(/^.{2,40}?\svs\s.{2,40}?\s*:\s*/i, '')] && (m = v.match(/^(.*?) ([+-]\d+)$/))) { ev.rows.push({ ...base, player: m[1], side: 'Yes', line: null, odds: odds(m[2]), available: true }); continue; }
  if ((m = v.match(/^(Over|Under) (\d+(?:\.\d+)?)([+-]\d+)$/))) { ev.rows.push({ ...base, player: null, bet: 'total', side: m[1], line: Number(m[2]), odds: odds(m[3]), available: true }); continue; }
  if (sec.mode === 'ml' && (m = v.match(/^(.*?) ([+-]\d+)$/))) { ev.rows.push({ ...base, player: null, bet: 'moneyline', side: m[1], line: null, odds: odds(m[2]), available: true }); continue; }
  if ((m = v.match(/^(.*?) ([+-]\d+(?:\.\d+)?)([+-]\d+)$/))) { ev.rows.push({ ...base, player: null, bet: 'spread', side: m[1], line: Number(m[2]), odds: odds(m[3]), available: true }); continue; }
  ev.rows.push({ ...base, player: sec.player, side: null, line: null, odds: null, available: false, unparsed: true });
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const summary = [];
for (const e of events) {
  const [away, home] = e.event.split(' @ ');
  const counts = {}; for (const r of e.rows) counts[r.market] = (counts[r.market] || 0) + 1;
  const out = { schema: 'bookmaker_live_markets_v1', capturedAt: e.capturedAt, event: e.event, eventUrl: e.eventUrl, scope: 'SGP-eligible sections only (sgp-badge); alt main-line expanders not opened', summary: { rows: e.rows.length, unavailable: e.rows.filter(r => !r.available).length, unparsed: e.rows.filter(r => r.unparsed).length, by_market: counts }, rows: e.rows };
  const f = `data/generated/props/bookmaker-live-${DATE}-${slug(away.split(' ').pop())}-at-${slug(home.split(' ').pop())}.json`;
  fs.writeFileSync(f, JSON.stringify(out, null, 1));
  summary.push(`${e.event.padEnd(42)} rows=${String(e.rows.length).padStart(4)} unavail=${out.summary.unavailable} unparsed=${out.summary.unparsed} unknown=${counts.unknown||0} td=${counts.atd_1_plus||0}`);
}
fs.writeFileSync(`data/generated/props/bookmaker-live-${DATE}-week${WEEK}.json`, JSON.stringify({ schema: 'bookmaker_live_markets_v1', capturedAt: events[0].capturedAt, games: events.length, rows: events.flatMap(e => e.rows) }, null, 0));
console.log(summary.join('\n'));
