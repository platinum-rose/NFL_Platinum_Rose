// scripts/props/book-balance.mjs
// ==============================================================================
// Record the sportsbook account balance at capture time (Andy 2026-11-18).
//
// Every book capture script calls recordBookBalance() right after its first page load,
// while the signed-in site header is on screen. Best-effort: it never throws and never
// takes more than ~8 s, so a balance problem can't break a line/prop capture.
//
// Writes:
//   data/bankroll/book-balances-2026.jsonl   one line per reading (append-only history)
//   data/bankroll/book-balances-latest.json  newest reading per book
//   data/generated/props/diagnostics/balance-<book>-<ts>.{json,png}  when no balance is found
//
// How it reads: scans the header area for dollar amounts and the label beside each one
// (Balance / Available / Pending or At Risk / Free Play or Bonus). Per-book CSS overrides,
// if the generic scan misreads a site, go in data/bankroll/balance-selectors.json:
//   { "BetOnline": { "balance": "css selector", "available": "...", "pending": "...", "free_play": "..." } }
// Standalone: node scripts/props/capture-book-balances.mjs [--book bol|bkr|dkp|all]
// ==============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(ROOT, 'data', 'bankroll');
const HISTORY = path.join(DIR, 'book-balances-2026.jsonl');
const LATEST = path.join(DIR, 'book-balances-latest.json');
const SELECTORS = path.join(DIR, 'balance-selectors.json');
const DIAG = path.join(ROOT, 'data', 'generated', 'props', 'diagnostics');
const FIELDS = ['balance', 'available', 'pending', 'free_play'];

export const parseMoney = (s) => {
  const m = String(s || '').replace(/−/g, '-').match(/(-)?\s*(?:\$|USD\s?)\s*(-)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!m) return null;
  const v = Number(m[3].replace(/,/g, ''));
  return Number.isFinite(v) ? (m[1] || m[2] ? -v : v) : null;
};

// label text -> field
export function labelField(label) {
  const t = String(label || '').toLowerCase();
  if (/free\s*-?\s*play|bonus|promo|site credit|casino credit/.test(t)) return 'free_play';
  if (/pending|at\s*risk|in\s*play|open bets|risk/.test(t)) return 'pending';
  if (/available|withdraw/.test(t)) return 'available';
  if (/balance|cash|wallet|funds|account/.test(t)) return 'balance';
  return null;
}

// candidates: [{ text, label, top, selectorField? }] from the page scan -> reading
export function classify(cands, opts = {}) {
  const out = { balance: null, available: null, pending: null, free_play: null };
  const used = [];
  for (const f of FIELDS) {                       // explicit selector overrides first
    const c = cands.find((x) => x.selectorField === f && parseMoney(x.text) !== null);
    if (c) { out[f] = parseMoney(c.text); used.push({ field: f, via: 'selector', text: c.text }); }
  }
  for (const c of cands) {                        // then labelled amounts
    if (c.selectorField) continue;
    const f = labelField(c.label) || labelField(c.text.replace(/[-$\d,.\s]/g, ' '));
    const v = parseMoney(c.text);
    if (f && v !== null && out[f] === null) { out[f] = v; used.push({ field: f, via: 'label', label: c.label, text: c.text }); }
  }
  if (out.balance === null) {                     // one unlabelled amount in the top bar = the balance
    const top = [...new Set(cands.filter((c) => !c.selectorField && c.top < 160 && parseMoney(c.text) !== null).map((c) => parseMoney(c.text)))];
    if (top.length === 1) { out.balance = top[0]; used.push({ field: 'balance', via: 'only_header_amount' }); }
    else if (top.length > 1 && opts.unlabelled === 'last') { out.balance = top[top.length - 1]; out.other_header_amounts = top.slice(0, -1); used.push({ field: 'balance', via: 'last_header_amount' }); }
    else if (top.length > 1 && opts.unlabelled === 'largest') { out.balance = Math.max(...top); out.other_header_amounts = top.filter((v) => v !== out.balance); used.push({ field: 'balance', via: 'largest_header_amount' }); }
    else if (out.available !== null) { out.balance = out.available; used.push({ field: 'balance', via: 'available' }); }
  }
  return { ...out, used };
}

// Runs inside the page: collect dollar amounts in the header / account area with nearby label text.
function scanPage(sel) {
  const money = /(?:\$|USD\s?)\s*-?\s*[\d,]+(?:\.\d{1,2})?/i;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (el) => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();
  const out = [];
  const all = [];   // every element, including inside open shadow roots
  const walk = (root) => { for (const el of root.querySelectorAll('*')) { all.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const qsa = (css) => all.filter((el) => { try { return el.matches(css); } catch { return false; } });
  for (const [field, css] of Object.entries(sel || {})) {
    if (!['balance', 'available', 'pending', 'free_play'].includes(field)) continue;
    try { for (const el of qsa(css)) if (vis(el)) out.push({ text: txt(el), label: field, top: el.getBoundingClientRect().top, selectorField: field }); } catch {}
  }
  const zone = '[class*="balance" i],[class*="account" i],[class*="wallet" i],[class*="user" i],[data-testid*="balance" i],[aria-label*="balance" i],header,nav,[class*="header" i],[role="banner"]';
  const roots = new Set(qsa(zone).filter(vis));
  // anything else in the top 160 px of the page
  for (const el of all) { const r = el.getBoundingClientRect(); if (r.top >= 0 && r.top < 160 && r.height < 120 && el.children.length <= 3 && vis(el)) roots.add(el); }
  const seen = new Set();
  for (const root of roots) {
    const kids = []; const w2 = (r) => { for (const el of r.querySelectorAll('*')) { kids.push(el); if (el.shadowRoot) w2(el.shadowRoot); } }; w2(root.shadowRoot || root);
    const leaves = [root, ...kids].filter((el) => {
      if (seen.has(el) || !vis(el)) return false;
      const t = txt(el); if (!money.test(t) || t.length > 80) return false;
      return ![...el.children].some((ch) => money.test(txt(ch)));   // deepest element holding the amount
    });
    for (const el of leaves) {
      seen.add(el);
      const t = txt(el); const amt = t.match(money)[0];
      let label = t.replace(amt, ' ').trim();
      // label from siblings / parent when the element is just the number
      for (let p = el, i = 0; i < 3 && label.replace(/[^a-z]/gi, '').length < 3 && p; i++, p = p.parentElement) {
        const sib = p.previousElementSibling; const pt = txt(p.parentElement);
        label = (sib && txt(sib).length < 40 ? txt(sib) : '') || (pt.length < 60 ? pt.replace(amt, ' ').trim() : '') || label;
        if (p.getAttribute && (p.getAttribute('aria-label') || p.getAttribute('title'))) label = p.getAttribute('aria-label') || p.getAttribute('title');
      }
      const r = el.getBoundingClientRect();
      out.push({ text: amt, label: label.slice(0, 60), top: Math.round(r.top), left: Math.round(r.left), html: (el.parentElement?.outerHTML || el.outerHTML).slice(0, 400) });
    }
  }
  out.sort((a, b) => (a.top - b.top) || ((a.left ?? 0) - (b.left ?? 0)));
  const body = txt(document.body);
  const loggedOut = !out.length && (/\/login\b/i.test(location.pathname) || qsa('button,a,[role="button"]').some((el) => vis(el) && /^(log ?in|sign ?in|join( now)?|register|sign up)$/i.test(txt(el))));
  return { cands: out.slice(0, 40), loggedOut, header: body.slice(0, 2500) };
}

const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

export async function recordBookBalance(page, { book, script, quiet = false } = {}) {
  const at = new Date().toISOString();
  const rec = { captured_at: at, book, script, url: null, status: 'error', balance: null, available: null, pending: null, free_play: null, currency: 'USD' };
  try {
    await Promise.race([(async () => {
      rec.url = page.url();
      const sel = readJson(SELECTORS, {})[book] || {};
      const scanAll = async () => {   // main page plus child frames (some books render the account bar in an iframe)
        const main = await page.evaluate(scanPage, sel);
        for (const fr of page.frames()) {
          if (fr === page.mainFrame() || fr.url() === 'about:blank' || fr.isDetached()) continue;
          const sub = await fr.evaluate(scanPage, sel).catch(() => null);
          if (sub?.cands?.length) main.cands.push(...sub.cands.map((c) => ({ ...c, frame: fr.url().slice(0, 80) })));
        }
        return main;
      };
      let scan = await scanAll();
      if (!scan.cands.length && !scan.loggedOut) { await page.waitForTimeout(2500); scan = await scanAll(); } // header can render late
      const r = classify(scan.cands, { unlabelled: sel.unlabelled });
      Object.assign(rec, { balance: r.balance, available: r.available, pending: r.pending, free_play: r.free_play, read_via: r.used });
      if (r.other_header_amounts) rec.other_header_amounts = r.other_header_amounts;
      rec.status = r.balance !== null ? 'ok' : scan.loggedOut ? 'logged_out' : 'not_found';
      if (rec.status !== 'ok') {
        fs.mkdirSync(DIAG, { recursive: true });
        const base = path.join(DIAG, `balance-${String(book).toLowerCase().replace(/\W+/g, '-')}-${at.replace(/[:.]/g, '-')}`);
        fs.writeFileSync(base + '.json', JSON.stringify({ ...rec, candidates: scan.cands, header_text: scan.header }, null, 2));
        const w = await page.evaluate(() => window.innerWidth).catch(() => 1400);
        await page.screenshot({ path: base + '.png', clip: { x: 0, y: 0, width: w, height: 220 } }).catch(() => {});
        rec.diagnostics = path.relative(ROOT, base + '.json').replace(/\\/g, '/');
      }
    })(), new Promise((_, rej) => setTimeout(() => rej(new Error('balance read timed out')), 8000))]);
  } catch (e) { rec.status = 'error'; rec.error = e.message; }
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.appendFileSync(HISTORY, JSON.stringify(rec) + '\n');
    if (rec.status === 'ok') { const L = readJson(LATEST, {}); L[book] = rec; fs.writeFileSync(LATEST, JSON.stringify(L, null, 2)); }
  } catch (e) { rec.write_error = e.message; }
  if (!quiet) {
    const $ = (v) => (v === null || v === undefined ? '-' : `$${v.toFixed(2)}`);
    console.log(rec.status === 'ok'
      ? `💰 ${book} balance ${$(rec.balance)}` + (rec.available !== null ? ` · available ${$(rec.available)}` : '') + (rec.pending !== null ? ` · pending ${$(rec.pending)}` : '') + (rec.free_play !== null ? ` · free play ${$(rec.free_play)}` : '')
      : `💰 ${book} balance not read (${rec.status}${rec.error ? ': ' + rec.error : ''})${rec.diagnostics ? ' -> ' + rec.diagnostics : ''}`);
  }
  return rec;
}
export { scanPage };
