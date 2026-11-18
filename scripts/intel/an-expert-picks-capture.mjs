#!/usr/bin/env node
// scripts/intel/an-expert-picks-capture.mjs  (Claude Team 2, 2026-11-12)
// Action Network EXPERT PICKS feed capture (the "Expert Picks" list on each game page / matchup pop-up).
// Many of these experts never publish articles, so research-intel-ingest.js misses them.
// How: the public NFL odds page lists every game link; each game page embeds its picks server-side in
// __NEXT_DATA__ (props.pageProps.game.experts[].picks). Plain HTTPS GETs, no login, no browser, no bets.
//
// Usage (repo root):
//   .\runanpicks.cmd                     # every NFL game on the AN odds page (current week)
//   .\runanpicks.cmd --game 290970       # one AN game id (comma list ok)
//   .\runanpicks.cmd --from-html file    # parse a saved game page (testing)
// Output (data/research-intel/action-network-picks/):
//   an-expert-picks-<date>_<hhmm>.json   this run's snapshot
//   an-expert-picks-2026-week<N>.json    week ledger: every pick seen this week, keyed by AN pick id, latest status/result kept
//   an-expert-picks-latest.md            readable table by game
// Local files only: no Supabase writes (add that as a separate, approved step).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'data', 'research-intel', 'action-network-picks');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nflWeek(d = new Date()) { // same convention as the props scrapers (Week 1 = Tue 2026-09-08)
  return Math.max(1, Math.min(18, 1 + Math.floor((d - new Date('2026-09-08T00:00:00Z')) / (7 * 864e5))));
}
// Direct first; on 403/failure fall back to the r.jina.ai reader (same route research-intel-ingest.js uses for AN,
// see docs/NFL_AUDIT_BACKLOG.md B-actionnetwork-feed-403), asking it for raw HTML so __NEXT_DATA__ survives.
async function get(url) {
  const tries = [
    { u: url, h: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, via: 'direct' },
    { u: 'https://r.jina.ai/' + url, h: { 'x-return-format': 'html', 'user-agent': UA }, via: 'jina' },
  ];
  // AN fingerprints Node's fetch (202 + empty body) but serves curl normally (research-intel-ingest.js notes).
  const viaCurl = () => {
    const r = spawnSync(process.platform === 'win32' ? 'curl.exe' : 'curl', ['-sL', '--compressed', '-m', '45', '-A', UA, url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return r.status === 0 && r.stdout && r.stdout.includes('__NEXT_DATA__') ? r.stdout : null;
  };
  for (const t of tries) {
    if (t.via === 'jina') { const c = viaCurl(); if (c) { console.log(`  (via curl) ${url}`); return c; } }
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch(t.u, { headers: t.h, signal: AbortSignal.timeout(45000) });
        if (r.ok) { const txt = await r.text(); if (txt.includes('__NEXT_DATA__') || (!/nfl-game/.test(url) && /nfl-game/.test(txt))) { if (t.via !== 'direct') console.log(`  (via ${t.via}) ${url}`); return txt; } }
        else console.log(`  HTTP ${r.status} (${t.via}) ${url}`);
        if (r.status === 403 || r.status === 404) break;
      } catch (e) { console.log(`  fetch failed (${t.via}: ${e.message}) ${url}`); }
      await sleep(1500 * (a + 1));
    }
  }
  return null;
}
export function nextData(html) {
  const m = html && html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}
export function picksFromGamePage(nd, url = null) {
  const game = nd?.props?.pageProps?.game;
  if (!game) return { game: null, rows: [] };
  const teams = (game.teams || []).map((t) => t.abbr || t.display_name || t.full_name);
  const away = (game.teams || []).find((t) => t.id === game.away_team_id);
  const home = (game.teams || []).find((t) => t.id === game.home_team_id);
  const label = away && home ? `${away.abbr}@${home.abbr}` : teams.join('@');
  const rows = [];
  for (const e of game.experts || []) {
    for (const p of e.picks || []) {
      rows.push({
        pick_id: p.id, an_game_id: p.game_id ?? game.id, game: label, starts_at: p.starts_at ?? game.start_time,
        expert: (e.name || e.username || '').trim(), expert_id: e.id, username: e.username, verified_expert: !!e.is_expert,
        expert_record: e.record ? { window: e.record.window, w: e.record.win, l: e.record.loss, p: e.record.push, units_net: e.record.units_net, roi: e.record.roi } : null,
        play: p.play, type: p.type, period: p.period, value: p.value, odds: p.odds, units: p.units,
        player_id: p.player_id ?? null, custom_type: p.custom_pick_type ?? null, is_live: !!p.is_live,
        status: p.status, result: p.result, units_net: p.units_net, settled_at: p.settled_at,
        created_at: p.created_at, updated_at: p.updated_at, book_id: p.book_id ?? null, source_url: url,
      });
    }
  }
  return { game: { an_game_id: game.id, label, start_time: game.start_time, status: game.status, url }, rows };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const now = new Date();
  const pt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${pt.getFullYear()}-${pad(pt.getMonth() + 1)}-${pad(pt.getDate())}_${pad(pt.getHours())}${pad(pt.getMinutes())}`;
  const week = Number(arg('--week')) || nflWeek(now);

  let pages = [];
  if (arg('--from-html')) pages = [{ url: null, html: fs.readFileSync(arg('--from-html'), 'utf8') }];
  else {
    let urls;
    const only = arg('--game');
    const odds = await get('https://www.actionnetwork.com/nfl/odds');
    if (!odds) throw new Error('Could not load https://www.actionnetwork.com/nfl/odds');
    urls = [...new Set([...odds.matchAll(/\/nfl-game\/[a-z0-9-]+\/(\d+)/g)].map((m) => `https://www.actionnetwork.com${m[0]}`))];
    if (only) { const ids = only.split(',').map((s) => s.trim()); urls = urls.filter((u) => ids.some((id) => u.endsWith('/' + id))); }
    console.log(`Games on the AN odds page: ${urls.length}`);
    for (const u of urls) { const html = await get(u); pages.push({ url: u, html }); await sleep(1200); }
  }

  const games = []; const rows = []; const misses = [];
  for (const pg of pages) {
    const nd = pg.html ? nextData(pg.html) : null;
    if (!nd) { misses.push(`${pg.url}: no page data`); continue; }
    const r = picksFromGamePage(nd, pg.url);
    if (!r.game) { misses.push(`${pg.url}: no game object`); continue; }
    games.push({ ...r.game, picks: r.rows.length });
    rows.push(...r.rows);
    console.log(`  ${r.game.label.padEnd(9)} ${String(r.rows.length).padStart(3)} picks from ${new Set(r.rows.map((x) => x.expert)).size} experts`);
  }
  if (!rows.length && !argv.includes('--from-html')) {
    console.log('  0 picks found. If AN stopped embedding picks for logged-out visitors, tell Claude (fallback: read the page through the signed-in Chrome).');
  }

  const snap = { schema: 'an_expert_picks_v1', capturedAt: now.toISOString(), week, games, misses, rows };
  fs.writeFileSync(path.join(OUT, `an-expert-picks-${stamp}.json`), JSON.stringify(snap, null, 2));
  // Week ledger: union by pick id; newer status/result wins; deleted picks keep last_seen.
  const ledgerPath = path.join(OUT, `an-expert-picks-2026-week${week}.json`);
  const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : { schema: 'an_expert_picks_ledger_v1', week, picks: {} };
  for (const r of rows) {
    const prev = ledger.picks[r.pick_id];
    ledger.picks[r.pick_id] = { ...(prev || {}), ...r, first_seen: prev?.first_seen || now.toISOString(), last_seen: now.toISOString() };
  }
  ledger.updatedAt = now.toISOString();
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  // Readable table
  const byGame = {};
  for (const r of rows) (byGame[r.game] ??= []).push(r);
  const md = [`# Action Network expert picks (captured ${stamp.replace('_', ' ')} PT, week ${week})`, '',
    `Source: AN game pages (__NEXT_DATA__ expert picks). ${rows.length} picks, ${games.length} games. Ledger: ${path.basename(ledgerPath)}.`, ''];
  for (const [g, rs] of Object.entries(byGame)) {
    md.push(`## ${g}`, '', '| Expert | Record (AN window) | Pick | Odds | Units | Posted (UTC) |', '|---|---|---|---|---|---|');
    for (const r of rs) {
      const rec = r.expert_record ? `${r.expert_record.w}-${r.expert_record.l}-${r.expert_record.p} ${r.expert_record.units_net >= 0 ? '+' : ''}${Number(r.expert_record.units_net).toFixed(1)}u` : '';
      md.push(`| ${r.expert} | ${rec} | ${r.play} | ${r.odds > 0 ? '+' : ''}${r.odds} | ${r.units} | ${String(r.created_at).slice(5, 16)} |`);
    }
    md.push('');
  }
  fs.writeFileSync(path.join(OUT, 'an-expert-picks-latest.md'), md.join('\n'));
  console.log(`\nSaved ${rows.length} picks (${games.length} games, ${misses.length} misses) -> ${path.relative(ROOT, OUT)}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error('❌', e.message); process.exit(1); });
}
