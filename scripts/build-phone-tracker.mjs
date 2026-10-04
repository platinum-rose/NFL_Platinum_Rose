#!/usr/bin/env node
/**
 * build-phone-tracker.mjs — standalone copy of the Sunday Live Tracker for viewing on a
 * phone (published as a private claude.ai page, where the page cannot reach ESPN).
 *
 * What it adds on top of generate-live-tracker.mjs:
 *  1. ESPN snapshot: today's scoreboard + the summary of every started game, embedded as
 *     window.__ESPN_CACHE. A fetch shim tries the network first and falls back to the
 *     snapshot, so leg grading works where ESPN is blocked.
 *  2. Desktop marks: an optional JSON export from the desktop tracker ("📲 Export marks")
 *     is embedded as window.__TRACKER_SEED and written into this page's localStorage once
 *     per export (keyed by its exported_at), so manual burns / pushes / outs / cashes carry over.
 *
 * Usage: node scripts/build-phone-tracker.mjs --week 4 --out <file.html> [--seed <marks.json>] [--dates 20261004]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLiveTracker } from './generate-live-tracker.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const week = parseInt(arg('--week', '4'), 10);
const out = path.resolve(ROOT, arg('--out', `data/generated/phone-tracker/phone-tracker-week-${week}.html`));
const seedPath = arg('--seed', null);
const dates = arg('--dates', null);

const DROP = ['news', 'article', 'videos', 'standings', 'broadcasts', 'againstTheSpread', 'meta', 'wallclockAvailable', 'drives', 'winprobability', 'pickcenter', 'odds', 'leaders', 'tuneInPrompt']; // client uses boxscore, header, injuries, scoringPlays
async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

const tmp = path.resolve(ROOT, `data/generated/phone-tracker/.base-week-${week}.html`);
await mkdir(path.dirname(tmp), { recursive: true });
await generateLiveTracker({ week, outPaths: [tmp] });
let html = await readFile(tmp, 'utf8');

const cache = { built_at: new Date().toISOString(), scoreboard: null, summary: {} };
try {
  const sbUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' + (dates ? `?dates=${dates}` : '');
  cache.scoreboard = await getJson(sbUrl);
  for (const ev of cache.scoreboard.events || []) {
    const state = ev.competitions?.[0]?.status?.type?.state;
    if (state === 'pre') continue;
    try {
      const s = await getJson(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${ev.id}`);
      for (const k of DROP) delete s[k];
      cache.summary[ev.id] = s;
    } catch (e) { console.warn(`   ⚠️ summary ${ev.id}: ${e.message}`); }
  }
  console.log(`   📡 ESPN snapshot: scoreboard + ${Object.keys(cache.summary).length} game summaries`);
} catch (e) {
  console.warn(`   ⚠️ ESPN snapshot failed: ${e.message} (phone copy will show build-time data only)`);
}

let seed = null;
if (seedPath) {
  seed = JSON.parse(await readFile(path.resolve(ROOT, seedPath), 'utf8'));
  console.log(`   📲 Seeding ${Object.keys(seed.keys || {}).length} desktop keys (exported ${seed.exported_at})`);
}

const safe = (o) => JSON.stringify(o).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const shim = `<script>
window.__ESPN_CACHE = ${safe(cache)};
window.__TRACKER_SEED = ${safe(seed)};
(function () {
  var C = window.__ESPN_CACHE, of = window.fetch ? window.fetch.bind(window) : null;
  function hit(s) {
    if (!C) return null;
    if (s.indexOf('/scoreboard') >= 0 && C.scoreboard) return C.scoreboard;
    var m = s.match(/summary\\?event=(\\d+)/);
    return m && C.summary && C.summary[m[1]] ? C.summary[m[1]] : null;
  }
  if (of) window.fetch = async function (u, o) {
    var s = String((u && u.url) || u);
    if (/espn\\.com/.test(s)) {
      try { var r = await of(u, o); if (r && r.ok) return r; } catch (e) {}
      var d = hit(s);
      if (d) return new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return of(u, o);
  };
  var S = window.__TRACKER_SEED;
  if (S && S.keys) {
    try {
      var vk = 'phone_tracker_seed_version_week_${week}';
      if (localStorage.getItem(vk) !== S.exported_at) {
        Object.keys(S.keys).forEach(function (k) { localStorage.setItem(k, S.keys[k]); });
        localStorage.setItem(vk, S.exported_at);
      }
    } catch (e) {}
  }
})();
</script>
`;
const at = html.indexOf('<script>');
if (at < 0) throw new Error('no <script> in tracker HTML');
html = html.slice(0, at) + shim + html.slice(at);
html = html.replace(/<title>[^<]*<\/title>/, '<title>Platinum Rose Live Tracker</title>').replace(/^\s*<!DOCTYPE html>\s*/i, '');
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, html, 'utf8');
console.log(`   ✅ Wrote phone tracker: ${path.relative(ROOT, out)} (${(html.length / 1e6).toFixed(2)} MB)`);
