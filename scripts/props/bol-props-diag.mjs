// BetOnline Prop Shop diagnostic (Claude, 2026-11-08).
// The game-page capture (cron-bol-scrape.mjs) only sees full player stat props for a few games; Andy sees all of
// them at https://www.betonline.ag/sportsbook/props. This opens that page in the .chrome-bol CDP session, records
// what it renders and which JSON/API calls carry the props, and saves everything for the parser fix. Read-only.
// usage: node scripts/props/bol-props-diag.mjs   (Chrome on port 9223 must be running: launch-bol-browser.bat, or run runbolprops.cmd first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.join(ROOT, 'data', 'research-intel', 'source-evidence', `bol-props-diag-${stamp}`);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.connectOverCDP('http://127.0.0.1:9223').catch((e) => {
  console.error('Could not reach Chrome on port 9223. Run launch-bol-browser.bat (or .\\runbolprops.cmd) first.', e.message); process.exit(1);
});
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const hits = [];
let n = 0;
page.on('response', async (res) => {
  try {
    const ct = res.headers()['content-type'] || '';
    if (!/json|javascript|text\/plain/.test(ct)) return;
    const body = await res.text();
    if (!/Rushing|Receiving|Passing Yards|Rush Yds|Rec Yds/i.test(body)) return;
    const f = `resp-${String(++n).padStart(3, '0')}.txt`;
    fs.writeFileSync(path.join(OUT, f), `URL: ${res.url()}\nMETHOD: ${res.request().method()}\nPOST: ${res.request().postData() || ''}\nCT: ${ct}\n\n${body}`);
    hits.push({ file: f, url: res.url(), method: res.request().method(), bytes: body.length });
  } catch { /* ignore */ }
});
try {
  await page.goto('https://www.betonline.ag/sportsbook/props', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(1500); await page.mouse.wheel(0, 1500).catch(() => {}); }
  const info = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    iframes: [...document.querySelectorAll('iframe')].map((f) => f.src),
    links: [...document.querySelectorAll('a')].map((a) => [a.innerText.trim().slice(0, 60), a.getAttribute('href')]).filter((x) => x[1]).slice(0, 400),
    buttons: [...new Set([...document.querySelectorAll('button,[role=tab]')].map((b) => b.innerText.trim()).filter((t) => t && t.length < 40))].slice(0, 200),
  }));
  fs.writeFileSync(path.join(OUT, 'page-info.json'), JSON.stringify(info, null, 1));
  const frames = page.frames();
  for (let i = 0; i < frames.length; i++) {
    const t = await frames[i].evaluate(() => document.body ? document.body.innerText : '').catch(() => '');
    fs.writeFileSync(path.join(OUT, `frame-${i}.txt`), `URL: ${frames[i].url()}\n\n${t}`);
  }
  fs.writeFileSync(path.join(OUT, 'api-hits.json'), JSON.stringify(hits, null, 1));
  console.log(`Saved ${OUT}\nframes=${frames.length} iframes=${info.iframes.length} api responses with prop text=${hits.length}`);
} finally {
  await page.close().catch(() => {});
  setTimeout(() => process.exit(0), 500);
}
