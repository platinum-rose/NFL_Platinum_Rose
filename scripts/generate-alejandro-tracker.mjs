#!/usr/bin/env node
/**
 * generate-alejandro-tracker.mjs — Alejandro's light Live Tracker (spec: docs/specs/alejandro-live-tracker-spec-2026-11-15.md).
 *
 * Writes ONE self-contained HTML page holding only tickets Alejandro has a share in (open + full season
 * ledger), with his share of every stake/payout and Andy's leg notes. The page polls ESPN itself
 * (Option B: hosted on a normal static host), so it stays live without republishing; rebuild only when
 * tickets change.
 *
 * Grading code is NOT duplicated: the leg/ticket grading block is sliced out of
 * scripts/generate-live-tracker-mobile.mjs at build time, so both trackers grade a leg identically.
 *
 *   node scripts/generate-alejandro-tracker.mjs [--out public/alejandro/index.html] [--week 10]
 * Leg notes: data/official-picks/alejandro-leg-notes-2026.json  { "<leg key>": "note", ... }
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wagerSplit } from './lib/wager-splits.mjs';
import { prepareTrackerWagers } from './lib/tracker-wagers.mjs';
import { extractTeamScoringCounts, gradeTeamCountLeg } from './lib/team-scoring-counts.mjs';
import { ESPN_API_BASE } from './lib/espn-http.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const OUT = path.join(ROOT, argVal('--out', 'public/alejandro/index.html'));
const PARTNER = 'Alejandro';

const isPartner = (w) => (w.ownership_shares?.[PARTNER] || 0) > 0 || w.split_partner === PARTNER
  || (w.split_participants || []).some((p) => p.name === PARTNER);

// ---- grading block from the phone tracker (single source of truth) ----
const mobileSrc = await readFile(path.join(ROOT, 'scripts/generate-live-tracker-mobile.mjs'), 'utf8');
const slice = (from, to) => {
  const a = mobileSrc.indexOf(from); const b = mobileSrc.indexOf(to, a + 1);
  if (a < 0 || b < 0) throw new Error(`Grading slice markers moved in generate-live-tracker-mobile.mjs: ${from} .. ${to}`);
  return mobileSrc.slice(a, b);
};
const gradingCode = slice('// ---------- team helpers ----------', '// ---------- ESPN ----------')
  + slice('const num = (v)', '// ---------- page');

const wagers = JSON.parse(await readFile(path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json'), 'utf8'));
let notes = {};
try { notes = JSON.parse(await readFile(path.join(ROOT, 'data/official-picks/alejandro-leg-notes-2026.json'), 'utf8')); } catch { /* optional */ }

const mine = wagers.filter((w) => isPartner(w) && !w.is_paper && (w.legs || []).length);
const open = mine.filter((w) => String(w.status).toUpperCase() === 'PENDING');
const settled = mine.filter((w) => String(w.status).toUpperCase() !== 'PENDING');
const openPrepared = open.length ? await prepareTrackerWagers(open, ROOT) : [];

const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
function shareOf(w) {
  const s = wagerSplit(w);
  const payout = Number(w.potential_payout_usd ?? 0);
  const people = s.count === 3 ? 'Andy / Amanda / Alejandro' : 'Andy / Alejandro';
  return { fraction: s.fraction, stake: r2(s.contribution), payout: r2(payout * s.fraction), label: s.count === 3 ? `3-way: ${people}` : `50/50 with Andy`, count: s.count };
}
function publicTicket(w, isOpen) {
  const sh = shareOf(w);
  const settledPayout = w.settled_payout_usd != null ? Number(w.settled_payout_usd) : null;
  return {
    id: w.id, book: w.book, ticket: w.ticket_number || null, type: w.ticket_type || '', week: w.week,
    placed: w.placed_at || w.date || null, title: w.game_title || '',
    stake: r2(w.stake_usd ?? w.cash_risk_usd), payout: r2(w.potential_payout_usd), odds: w.odds_american || null,
    boost: /boost/i.test(String(w.promotion || '')) ? w.promotion : null,
    share: sh,
    result: isOpen ? null : (w.result || null),
    returned: settledPayout != null ? r2(settledPayout) : null,
    myReturned: settledPayout != null ? r2(settledPayout * sh.fraction) : null,
    round_robin: w.round_robin || null,
    legs: (w.legs || []).map((l) => ({
      leg_num: l.leg_num, key: l.key, player: l.player || null, team: l.team || null, opponent: l.opponent || null,
      game: l.game || null, kickoff_utc: l.kickoff_utc || null, market: l.market, target_stat: l.target_stat || null,
      line: l.line ?? null, direction: l.direction || null, selection: l.selection || '', status: l.status || 'PENDING',
      grading: l.grading || null, note: notes[l.key] || null,
    })),
  };
}
const data = {
  builtAt: new Date().toISOString(),
  open: openPrepared.map((w) => publicTicket(w, true)),
  settled: settled.map((w) => publicTicket(w, false)).sort((a, b) => String(b.placed).localeCompare(String(a.placed))),
};

// ---- page ----
const pageScript = `
const TZ = 'America/Los_Angeles';
const ESPN = ${JSON.stringify(ESPN_API_BASE)};
const DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};
${extractTeamScoringCounts.toString()}
${gradeTeamCountLeg.toString()}
${gradingCode}
// ---- browser ESPN layer (same shapes as the phone tracker's Node loaders) ----
const getJson = async (u) => { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error('ESPN ' + r.status); return r.json(); };
let boxCache = new Map();
async function loadEvents(weeks) {
  const events = [];
  for (const w of weeks) {
    const sb = await getJson(ESPN + '/scoreboard?seasontype=2&week=' + w);
    for (const e of sb.events || []) {
      const c = e.competitions[0]; const side = (ha) => c.competitors.find((x) => x.homeAway === ha); const st = c.status;
      events.push({ id: e.id, week: w, date: e.date, away: normAbbr(side('away').team.abbreviation), home: normAbbr(side('home').team.abbreviation),
        awayScore: Number(side('away').score || 0), homeScore: Number(side('home').score || 0), state: st.type.state, completed: !!st.type.completed,
        detail: st.type.shortDetail || st.type.detail || '', period: st.period, clock: st.displayClock });
    }
  }
  return events;
}
async function loadBox(ev) {
  if (boxCache.has(ev.id)) return boxCache.get(ev.id);
  let players = null;
  if (ev.state !== 'pre') {
    const sum = await getJson(ESPN + '/summary?event=' + ev.id);
    players = new Map();
    players.teamScoringCounts = extractTeamScoringCounts(sum, ev.id);
    for (const t of sum.boxscore?.players || []) {
      const team = normAbbr(t.team?.abbreviation);
      for (const g of t.statistics || []) for (const a of g.athletes || []) {
        const k = nameKey(a.athlete?.displayName); if (!k) continue;
        const rec = players.get(k) || { name: a.athlete.displayName, team, groups: {} };
        const vals = {}; (g.keys || []).forEach((key, i) => { vals[key] = a.stats?.[i]; });
        rec.groups[g.name] = vals; players.set(k, rec);
      }
    }
    const firstTd = (sum.scoringPlays || []).find((p) => /touchdown/i.test(p.type?.text || '') || /\\bTD\\b/.test(p.type?.abbreviation || ''));
    players.firstTd = firstTd ? { text: firstTd.text || '', scorer: nameKey(String(firstTd.text || '').split(/\\s\\d+\\s*(yd|yard)/i)[0]) } : null;
  }
  boxCache.set(ev.id, players);
  return players;
}
// ---- render ----
const $ = (s) => document.querySelector(s);
const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CHIP = { WON: 'won', LOST: 'lost', PUSH: 'push', VOID: 'push', LIVE: 'live', PENDING: 'pend', CHECK: 'check' };
function legHtml(l, g) {
  const st = g?.status || l.status || 'PENDING';
  const lean = st === 'LIVE' ? (g.lean === 'ahead' ? ' ahead' : ' behind') : '';
  return '<div class="leg"><div class="leg-top"><span class="sel">' + h(l.selection) + '</span><span class="chip ' + (CHIP[st] || 'pend') + lean + '">' + h(st) + '</span></div>'
    + (g?.now ? '<div class="now">' + h(g.now) + '</div>' : '')
    + (l.note ? '<div class="note">💡 ' + h(l.note) + '</div>' : '') + '</div>';
}
function cardHtml(t, graded, sum) {
  const st = sum ? sum.state : (t.result === 'win' ? 'cashed' : t.result === 'loss' ? 'burnt' : (t.result || 'settled'));
  const won = graded ? graded.filter((g) => ['WON', 'PUSH', 'VOID'].includes(g.status)).length : 0;
  const stateTxt = st === 'open' ? (won + ' of ' + t.legs.length + ' hit · alive') : st === 'cashed' ? 'CASHED' : st === 'burnt' ? 'BURNT' : String(st).toUpperCase();
  const myPay = t.myReturned != null ? t.myReturned : t.share.payout;
  return '<article class="card ' + st + '"><header><div><b>' + h(t.book) + '</b> · ' + h(t.type) + (t.ticket ? ' · #' + h(t.ticket) : '') + '</div><span class="state">' + h(stateTxt) + '</span></header>'
    + '<div class="money"><div><small>Your stake</small>' + money(t.share.stake) + '<em> of ' + money(t.stake) + '</em></div>'
    + '<div><small>' + (t.myReturned != null ? 'You got back' : 'Your payout') + '</small>' + money(myPay) + '<em> of ' + money(t.myReturned != null ? t.returned : t.payout) + '</em></div></div>'
    + '<div class="badges"><span class="badge">🤝 ' + h(t.share.label) + '</span>' + (t.boost ? '<span class="badge boost">⚡ ' + h(t.boost) + '</span>' : '') + (t.odds ? '<span class="badge">' + h(t.odds) + '</span>' : '') + '</div>'
    + '<div class="legs">' + t.legs.map((l, i) => legHtml(l, graded ? graded[i] : null)).join('') + '</div></article>';
}
async function refresh() {
  try {
    boxCache = new Map();
    const weeks = [...new Set(DATA.open.map((t) => t.week))];
    const events = weeks.length ? await loadEvents(weeks) : [];
    let risk = 0, potential = 0, alive = 0; const cards = [];
    for (const t of DATA.open) {
      const graded = []; for (const l of t.legs) graded.push(await gradeLeg(l, events));
      const sum = summarizeTicket(t, graded);
      risk += t.share.stake; if (sum.state !== 'burnt') { potential += t.share.payout; alive++; }
      cards.push({ t, graded, sum });
    }
    const order = { open: 0, cashed: 1, burnt: 2 };
    cards.sort((a, b) => (order[a.sum.state] ?? 3) - (order[b.sum.state] ?? 3));
    $('#open').innerHTML = cards.map((c) => cardHtml(c.t, c.graded, c.sum)).join('') || '<p class="empty">No open tickets right now.</p>';
    $('#k-alive').textContent = alive + ' / ' + DATA.open.length;
    $('#k-risk').textContent = money(risk);
    $('#k-pot').textContent = money(potential);
    const live = events.some((e) => e.state === 'in');
    $('#fresh').textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' PT' + (live ? ' · games live' : '');
    $('#fresh').classList.remove('stale');
    schedule(live ? 60000 : 300000);
  } catch (err) {
    $('#fresh').textContent = 'Live scores unavailable (' + err.message + '). Retrying…';
    $('#fresh').classList.add('stale');
    schedule(90000);
  }
}
let timer; function schedule(ms) { clearTimeout(timer); timer = setTimeout(refresh, ms); }
function renderLedger() {
  const rows = DATA.settled;
  let staked = 0, back = 0, w = 0, l = 0;
  for (const t of rows) { staked += t.share.stake; back += t.myReturned || 0; if ((t.myReturned || 0) > 0) w++; else l++; }
  $('#ledger-sum').innerHTML = '<b>' + w + '-' + l + '</b> · your stakes ' + money(staked) + ' · back ' + money(back) + ' · net <b class="' + (back - staked >= 0 ? 'pos' : 'neg') + '">' + (back - staked >= 0 ? '+' : '−') + money(Math.abs(back - staked)) + '</b>';
  $('#ledger').innerHTML = rows.map((t) => cardHtml(t, null, null)).join('');
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
renderLedger(); refresh();
`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Alejandro · Live Tickets</title>
<style>
:root{--bg:#0B1120;--card:#151F32;--leg:#111A2B;--line:#273752;--blue:#3B82F6;--green:#10B981;--gold:#F59E0B;--red:#EF4444;--text:#F8FAFC;--muted:#94A3B8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:0 12px calc(24px + env(safe-area-inset-bottom))}
.top{position:sticky;top:0;z-index:5;background:var(--bg);padding:calc(10px + env(safe-area-inset-top)) 0 8px}
.panel{background:linear-gradient(180deg,#16213A,var(--card));border:1px solid var(--line);border-radius:12px;padding:12px 14px}
h1{font-size:17px;margin:0 0 8px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.kpis small,.money small{display:block;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.kpis b{font-size:16px}#fresh{font-size:12px;color:var(--muted);margin-top:6px}#fresh.stale{color:var(--gold)}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:18px 2px 8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px}
.card.burnt{opacity:.6}.card.cashed{border-color:var(--green)}
.card header{display:flex;justify-content:space-between;gap:8px;align-items:baseline;font-size:13px}
.state{font-size:11px;font-weight:700;color:var(--blue);white-space:nowrap}.cashed .state{color:var(--green)}.burnt .state{color:var(--red)}
.money{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0;font-size:16px;font-weight:700}.money em{font-style:normal;font-weight:400;font-size:12px;color:var(--muted)}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.badge{font-size:11px;background:#1E293B;border:1px solid var(--line);border-radius:999px;padding:2px 8px}.badge.boost{color:#C4B5FD}
.leg{background:var(--leg);border-radius:8px;padding:8px 10px;margin-top:6px}.leg-top{display:flex;justify-content:space-between;gap:8px;align-items:center}
.sel{font-weight:600}.now{font-size:12px;color:var(--muted)}.note{font-size:12px;color:#CBD5E1;margin-top:2px}
.chip{font-size:10.5px;font-weight:700;border-radius:6px;padding:2px 7px;min-width:58px;text-align:center}
.chip.won{background:rgba(16,185,129,.18);color:var(--green)}.chip.lost{background:rgba(239,68,68,.18);color:var(--red)}
.chip.live.ahead{background:rgba(16,185,129,.12);color:#6EE7B7}.chip.live.behind{background:rgba(245,158,11,.15);color:var(--gold)}
.chip.pend,.chip.push,.chip.check{background:#1E293B;color:var(--muted)}
details summary{cursor:pointer;list-style:none}details summary::-webkit-details-marker{display:none}
#ledger-sum{font-size:13px;color:var(--muted);margin:0 2px 10px}.pos{color:var(--green)}.neg{color:var(--red)}.empty{color:var(--muted)}
footer{font-size:11px;color:var(--muted);text-align:center;margin-top:16px}
</style></head><body>
<div class="top"><div class="panel"><h1>Alejandro · Live Tickets</h1>
<div class="kpis"><div><small>Alive</small><b id="k-alive">–</b></div><div><small>Your open stake</small><b id="k-risk">–</b></div><div><small>Your live payout</small><b id="k-pot">–</b></div></div>
<div id="fresh">Loading live scores…</div></div></div>
<h2>Open tickets</h2><section id="open"></section>
<details><summary><h2>Season ledger ▾</h2></summary><div id="ledger-sum"></div><section id="ledger"></section></details>
<footer>Tickets as of ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT · scores from ESPN, refreshed every minute during games. Leg results are a guide; the book's settlement is final.</footer>
<script>${pageScript}</script>
</body></html>`;

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, html, 'utf8');
console.log(`Alejandro tracker: ${data.open.length} open, ${data.settled.length} settled -> ${path.relative(ROOT, OUT)} (${(html.length / 1024).toFixed(0)} KB)`);
