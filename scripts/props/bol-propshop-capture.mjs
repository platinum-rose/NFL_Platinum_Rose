// BetOnline Prop Shop (Props Builder) capture (Claude, 2026-11-08).
// The Prop Shop at www.betonline.ag/sportsbook/props is a DigitalSportsTech app (troya.xyz iframe) that reads
// bv2-us.digitalsportstech.com. Direct API calls are refused (403 invalid_security_headers), so this opens the page
// in the .chrome-bol CDP session, records the security headers the app itself sends, and replays the same
// read-only GET endpoints the app uses: /api/dfm/gamesByOu and /api/dfm/marketsByOu for every O/U statistic.
// Output: data/generated/props/bol-propshop-<date>-raw.json (+ a log). Read-only: no bet endpoints are called.
// usage: node scripts/props/bol-propshop-capture.mjs   (Chrome on port 9223: launch-bol-browser.bat first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const date = new Date().toISOString().slice(0, 10);
const OUT = path.join(ROOT, 'data', 'generated', 'props', `bol-propshop-${date}-raw.json`);
const STATS = ['Passing Yards', 'Pass Completions', 'Passing TDs', 'Pass Attempts', 'Rushing Yards', 'Carries', 'Receiving Yards', 'Receptions', 'Tackles', 'Sacks'];
const API = 'https://bv2-us.digitalsportstech.com';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9223').catch((e) => {
  console.error('Could not reach Chrome on port 9223. Run .\\scripts\\props\\launch-bol-browser.bat first.', e.message); process.exit(1);
});
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
let hdrs = null; const seen = [];
page.on('request', (req) => {
  const u = req.url();
  if (!u.startsWith(API) || req.method() !== 'GET') return;
  seen.push(u);
  const h = req.headers();
  if (!hdrs && Object.keys(h).some((k) => !['accept', 'user-agent', 'referer', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'origin', 'accept-language'].includes(k))) hdrs = h;
});
const out = { capturedAt: new Date().toISOString(), source: 'betonline Prop Shop (DigitalSportsTech) via .chrome-bol CDP', games: {}, markets: [], errors: [] };
try {
  await page.goto('https://www.betonline.ag/sportsbook/props', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 20 && !hdrs; i++) await page.waitForTimeout(1000);
  if (!hdrs) throw new Error('The Prop Shop app never called its API (log in / Cloudflare check in that Chrome window, then re-run).');
  const keep = Object.fromEntries(Object.entries(hdrs).filter(([k]) => !/^(host|content-length|cookie|:)/i.test(k)));
  out.headerNames = Object.keys(keep);
  const app = page.frames().find((f) => /troya\.xyz\/bv3/.test(f.url())) || page.frames().find((f) => /troya\.xyz/.test(f.url())) || page.mainFrame();
  out.appFrame = app.url().slice(0, 40);
  const get = (url) => app.evaluate(async ([u, h]) => {
    // The app's own script wraps window.fetch and signs each request (x-req-time / nonce / challenge),
    // so call it plain and let the wrapper add the headers.
    const r = await fetch(u);
    return { status: r.status, text: await r.text() };
  }, [url, keep]);
  for (const st of STATS) {
    const g = await get(`${API}/api/dfm/gamesByOu?league=nfl&statistic=${encodeURIComponent(st)}&sb=betonline`);
    if (g.status !== 200) { out.errors.push({ st, step: 'games', status: g.status, body: g.text.slice(0, 200) }); continue; }
    let games = []; try { games = JSON.parse(g.text); } catch { /* */ }
    games = Array.isArray(games) ? games : (games.data || []);
    for (const gm of games) {
      const gid = gm.providers?.[0]?.id ?? gm.id ?? gm._id;
      out.games[gid] = { date: gm.date, team1: gm.team1?.abbreviation || gm.team1?.title, team2: gm.team2?.abbreviation || gm.team2?.title };
      const m = await get(`${API}/api/dfm/marketsByOu?sb=betonline&gameId=${gid}&statistic=${encodeURIComponent(st)}`);
      if (m.status !== 200) { out.errors.push({ st, gid, step: 'markets', status: m.status, body: m.text.slice(0, 200) }); continue; }
      try { out.markets.push({ statistic: st, gameId: gid, data: JSON.parse(m.text) }); } catch { out.errors.push({ st, gid, step: 'parse' }); }
    }
    console.log(`${st}: ${games.length} games`);
  }
} catch (e) {
  out.errors.push({ fatal: String(e.message || e) });
  console.error(e.message || e);
} finally {
  out.apiCallsSeen = seen.slice(0, 50);
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`Saved ${OUT}: ${out.markets.length} market sets, ${Object.keys(out.games).length} games, ${out.errors.length} errors`);
  await page.close().catch(() => {});
  setTimeout(() => process.exit(0), 500);
}
