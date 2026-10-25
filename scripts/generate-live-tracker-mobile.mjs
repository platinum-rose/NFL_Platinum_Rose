#!/usr/bin/env node
/**
 * generate-live-tracker-mobile.mjs — phone edition of the Live Tracker.
 *
 * Grades every open REAL ticket (user-placed-wagers-2026.json, paper excluded)
 * against ESPN at build time and writes one self-contained page with the
 * results baked in. The page makes no network calls (it is published as a
 * private claude.ai artifact, whose sandbox blocks fetches), so freshness comes
 * from re-running this script and republishing to the same link.
 *
 *   node scripts/generate-live-tracker-mobile.mjs --week 7
 *
 * Writes:
 *   public/live-tracker-mobile.html        page (artifact fragment: no <html>/<head>)
 *   public/live-tracker-mobile-state.json  per-leg grading, for settling tickets
 *
 * Shows only tickets that are still alive. Settled/burnt tickets, the paper
 * AI card and SuperContest stay on the desktop tracker.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const WEEK = Number(argVal('--week', '7'));
const SEASON = Number(argVal('--season', '2026'));
const OUT_HTML = path.join(ROOT, argVal('--out', 'public/live-tracker-mobile.html'));
const OUT_STATE = path.join(ROOT, 'public/live-tracker-mobile-state.json');
const TZ = 'America/Los_Angeles';

// ---------- team helpers ----------
const ABBR_FIX = { WAS: 'WSH', LVR: 'LV', JAC: 'JAX', LA: 'LAR', OAK: 'LV', SD: 'LAC', ARZ: 'ARI', GNB: 'GB', KAN: 'KC', NWE: 'NE', NOR: 'NO', SFO: 'SF', TAM: 'TB' };
const normAbbr = (a) => { const u = String(a || '').toUpperCase().trim(); return ABBR_FIX[u] || u; };
const NICK = {
  cardinals: 'ARI', falcons: 'ATL', ravens: 'BAL', bills: 'BUF', panthers: 'CAR', bears: 'CHI', bengals: 'CIN', browns: 'CLE',
  cowboys: 'DAL', broncos: 'DEN', lions: 'DET', packers: 'GB', texans: 'HOU', colts: 'IND', jaguars: 'JAX', chiefs: 'KC',
  raiders: 'LV', chargers: 'LAC', rams: 'LAR', dolphins: 'MIA', vikings: 'MIN', patriots: 'NE', saints: 'NO', giants: 'NYG',
  jets: 'NYJ', eagles: 'PHI', steelers: 'PIT', '49ers': 'SF', niners: 'SF', seahawks: 'SEA', buccaneers: 'TB', titans: 'TEN',
  commanders: 'WSH', washington: 'WSH',
};
function teamFromText(text) {
  const t = String(text || '').toLowerCase();
  for (const [nick, ab] of Object.entries(NICK)) if (new RegExp(`\\b${nick}\\b`).test(t)) return ab;
  return null;
}
function parseGame(g) {
  const m = String(g || '').match(/([A-Za-z]{2,4})\s*@\s*([A-Za-z]{2,4})/);
  return m ? { away: normAbbr(m[1]), home: normAbbr(m[2]) } : null;
}
const nameKey = (s) => String(s || '').toLowerCase().replace(/[.'’]/g, '').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- ESPN ----------
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
async function getJson(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
async function loadEvents(weeks) {
  const events = [];
  for (const w of weeks) {
    try {
      const sb = await getJson(`${ESPN}/scoreboard?seasontype=2&week=${w}&dates=${SEASON}`);
      for (const e of sb.events || []) {
        const c = e.competitions[0];
        const side = (ha) => c.competitors.find((x) => x.homeAway === ha);
        const st = c.status;
        events.push({
          id: e.id, week: w, date: e.date,
          away: normAbbr(side('away').team.abbreviation), home: normAbbr(side('home').team.abbreviation),
          awayScore: Number(side('away').score || 0), homeScore: Number(side('home').score || 0),
          state: st.type.state, // pre | in | post
          completed: !!st.type.completed,
          detail: st.type.shortDetail || st.type.detail || '',
          period: st.period, clock: st.displayClock,
        });
      }
    } catch (err) { console.warn('scoreboard week', w, 'failed:', err.message); }
  }
  return events;
}
const boxCache = new Map();
async function loadBox(ev) {
  if (boxCache.has(ev.id)) return boxCache.get(ev.id);
  let players = null;
  if (ev.state !== 'pre') {
    try {
      const sum = await getJson(`${ESPN}/summary?event=${ev.id}`);
      players = new Map();
      for (const t of sum.boxscore?.players || []) {
        const team = normAbbr(t.team?.abbreviation);
        for (const g of t.statistics || []) {
          for (const a of g.athletes || []) {
            const k = nameKey(a.athlete?.displayName);
            if (!k) continue;
            const rec = players.get(k) || { name: a.athlete.displayName, team, groups: {} };
            const vals = {};
            (g.keys || []).forEach((key, i) => { vals[key] = a.stats?.[i]; });
            rec.groups[g.name] = vals;
            players.set(k, rec);
          }
        }
      }
    } catch (err) { console.warn('summary', ev.id, 'failed:', err.message); }
  }
  boxCache.set(ev.id, players);
  return players;
}
const num = (v) => { const n = parseFloat(String(v ?? '').split(/[/-]/)[0]); return Number.isFinite(n) ? n : 0; };
const frac = (v, i) => { const p = String(v ?? '').split('/'); return Number.isFinite(parseFloat(p[i])) ? parseFloat(p[i]) : 0; };

function findPlayer(players, leg) {
  if (!players) return null;
  const k = nameKey(leg.player || String(leg.selection || '').replace(/\(.*?\).*$/, '').replace(/\s(over|under|\d).*$/i, ''));
  if (players.has(k)) return players.get(k);
  const [first, ...rest] = k.split(' ');
  const last = rest.join(' ');
  for (const [pk, p] of players) {
    if (last && pk.endsWith(' ' + last) && pk[0] === first?.[0]) return p;
  }
  return null;
}

const STAT = {
  receptions: (g) => num(g.receiving?.receptions),
  receiving_yards: (g) => num(g.receiving?.receivingYards),
  rushing_yards: (g) => num(g.rushing?.rushingYards),
  carries: (g) => num(g.rushing?.rushingAttempts),
  passing_yards: (g) => num(g.passing?.passingYards),
  pass_completions: (g) => frac(g.passing?.['completions/passingAttempts'], 0),
  pass_attempts: (g) => frac(g.passing?.['completions/passingAttempts'], 1),
  passing_touchdowns: (g) => num(g.passing?.passingTouchdowns),
  pass_interceptions: (g) => num(g.passing?.interceptions),
  tackles_assists: (g) => num(g.defensive?.totalTackles),
  sacks: (g) => num(g.defensive?.sacks),
  field_goals_made: (g) => frac(g.kicking?.['fieldGoalsMade/fieldGoalAttempts'], 0),
  kicking_points: (g) => num(g.kicking?.totalKickingPoints),
  touchdowns: (g) => num(g.rushing?.rushingTouchdowns) + num(g.receiving?.receivingTouchdowns)
    + num(g.kickReturns?.kickReturnTouchdowns) + num(g.puntReturns?.puntReturnTouchdowns)
    + num(g.interceptions?.interceptionTouchdowns) + num(g.defensive?.defensiveTouchdowns),
};
const MARKET_STAT = {
  anytime_touchdown: 'touchdowns', touchdowns_2plus: 'touchdowns', touchdowns: 'touchdowns',
  tackles_assists: 'tackles_assists', pass_interceptions: 'pass_interceptions', interceptions_thrown: 'pass_interceptions',
};
const STAT_LABEL = {
  receptions: 'rec', receiving_yards: 'rec yds', rushing_yards: 'rush yds', carries: 'carries', passing_yards: 'pass yds',
  pass_completions: 'cmp', pass_attempts: 'att', passing_touchdowns: 'pass TD', pass_interceptions: 'INT',
  tackles_assists: 'tkl+ast', sacks: 'sacks', field_goals_made: 'FG', kicking_points: 'kick pts', touchdowns: 'TD',
};

// ---------- grading ----------
function findEvent(events, leg) {
  const g = parseGame(leg.game);
  if (!g) return null;
  const cands = events.filter((e) => (e.away === g.away && e.home === g.home) || (e.away === g.home && e.home === g.away));
  if (cands.length <= 1) return cands[0] || null;
  const want = Date.parse(String(leg.game_start || '').replace(' @ ', ' ')) || Date.now();
  return cands.sort((a, b) => Math.abs(Date.parse(a.date) - want) - Math.abs(Date.parse(b.date) - want))[0];
}
const fmtLine = (n) => (n > 0 ? `+${n}` : `${n}`);
const kickoffPT = (iso) => new Date(iso).toLocaleString('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: '2-digit' });

async function gradeLeg(leg, events) {
  const preset = String(leg.status || '').toUpperCase();
  if (['WON', 'LOST', 'PUSH', 'VOID'].includes(preset)) return { status: preset, now: leg.grading_note ? 'graded' : '', locked: true };
  const ev = findEvent(events, leg);
  if (!ev) return { status: 'CHECK', now: 'game not found on ESPN', locked: false };
  const out = { eventId: ev.id };
  if (ev.state === 'pre') return { ...out, status: 'PENDING', now: kickoffPT(ev.date), locked: false };
  const final = ev.completed;
  const market = String(leg.market || '').replace(/^sgp_/, '').replace(/^alternate_/, '');
  const sel = String(leg.selection || '');
  const total = ev.awayScore + ev.homeScore;

  if (market === 'spread' || market === 'moneyline') {
    const team = normAbbr(leg.team) || teamFromText(sel);
    if (team !== ev.away && team !== ev.home) return { ...out, status: 'CHECK', now: 'team not matched', locked: false };
    const mine = team === ev.home ? ev.homeScore : ev.awayScore;
    const theirs = team === ev.home ? ev.awayScore : ev.homeScore;
    const line = market === 'spread' ? Number(leg.line ?? 0) : 0;
    const adj = mine - theirs + line;
    const now = market === 'spread' ? `${team} ${mine}-${theirs} · ${adj > 0 ? 'covering by ' + adj : adj === 0 ? 'on the number' : 'short by ' + -adj}` : `${team} ${mine}-${theirs}`;
    if (final) return { ...out, status: adj > 0 ? 'WON' : adj === 0 ? 'PUSH' : 'LOST', now, locked: true };
    return { ...out, status: 'LIVE', lean: adj > 0 ? 'ahead' : 'behind', now, locked: false };
  }
  if (market === 'total' || market === 'total_points') {
    const line = Number(leg.line);
    const dir = leg.direction || (/\bu(nder)?\s?\d/i.test(sel) ? 'under' : 'over');
    if (dir === 'over') {
      if (total > line) return { ...out, status: 'WON', now: `total ${total}`, locked: true };
      if (final) return { ...out, status: total === line ? 'PUSH' : 'LOST', now: `total ${total}`, locked: true };
      return { ...out, status: 'LIVE', lean: 'behind', now: `total ${total} · needs ${Math.floor(line) + 1 - total} more`, locked: false };
    }
    if (total > line) return { ...out, status: 'LOST', now: `total ${total}`, locked: true };
    if (final) return { ...out, status: total === line ? 'PUSH' : 'WON', now: `total ${total}`, locked: true };
    return { ...out, status: 'LIVE', lean: 'ahead', now: `total ${total} · ${Math.ceil(line) - 1 - total} pts of room`, locked: false };
  }

  // player props
  const statKey = MARKET_STAT[leg.market] || leg.target_stat || leg.market;
  const getter = STAT[MARKET_STAT[statKey] || statKey];
  if (!getter) return { ...out, status: 'CHECK', now: `grade by hand (${leg.market})`, locked: false };
  const players = await loadBox(ev);
  const p = findPlayer(players, leg);
  const label = STAT_LABEL[MARKET_STAT[statKey] || statKey] || statKey;
  if (!p) {
    if (final) return { ...out, status: 'CHECK', now: 'not in final box score (inactive?)', locked: false };
    return { ...out, status: 'LIVE', lean: 'behind', now: `0 ${label} · not in box score yet`, locked: false, value: 0 };
  }
  const v = getter(p.groups);
  const line = Number(leg.line ?? 0.5);
  const dir = leg.direction || 'over';
  if (dir === 'over') {
    if (v > line) return { ...out, status: 'WON', now: `${v} ${label}`, locked: true, value: v };
    if (final) return { ...out, status: v === line ? 'PUSH' : 'LOST', now: `${v} ${label}`, locked: true, value: v };
    const need = Math.floor(line) + 1 - v;
    return { ...out, status: 'LIVE', lean: 'behind', now: `${v} ${label} · needs ${need} more`, locked: false, value: v };
  }
  if (v > line) return { ...out, status: 'LOST', now: `${v} ${label}`, locked: true, value: v };
  if (final) return { ...out, status: v === line ? 'PUSH' : 'WON', now: `${v} ${label}`, locked: true, value: v };
  return { ...out, status: 'LIVE', lean: 'ahead', now: `${v} ${label} · ${Math.ceil(line) - 1 - v} to spare`, locked: false, value: v };
}

const legTeams = (leg) => {
  const t = normAbbr(leg.team) || teamFromText(leg.selection);
  return t ? [t] : [];
};

function summarizeTicket(t, graded) {
  const legs = graded;
  const counts = { WON: 0, LOST: 0, PUSH: 0, LIVE: 0, PENDING: 0, CHECK: 0, VOID: 0 };
  legs.forEach((g) => { counts[g.status] = (counts[g.status] || 0) + 1; });
  if (t.round_robin?.combinations?.length) {
    const byTeam = new Map();
    t.legs.forEach((l, i) => legTeams(l).forEach((tm) => byTeam.set(tm, legs[i])));
    let alive = 0; let cashed = 0; let wonUsd = 0; let maxUsd = 0;
    for (const c of t.round_robin.combinations) {
      const gs = c.teams.map((tm) => byTeam.get(normAbbr(tm)));
      if (gs.some((g) => !g)) { alive++; maxUsd += c.to_win_usd; continue; }
      if (gs.some((g) => g.status === 'LOST')) continue;
      if (gs.every((g) => ['WON', 'PUSH', 'VOID'].includes(g.status))) { cashed++; wonUsd += c.to_win_usd + c.stake_usd; maxUsd += c.to_win_usd; continue; }
      alive++; maxUsd += c.to_win_usd;
    }
    const total = t.round_robin.combinations.length;
    const state = alive > 0 ? 'open' : cashed > 0 ? 'cashed' : 'burnt';
    return { kind: 'rr', state, counts, alive, cashed, total, returnedUsd: +wonUsd.toFixed(2), maxProfitUsd: +maxUsd.toFixed(2) };
  }
  const state = counts.LOST > 0 ? 'burnt' : legs.every((g) => ['WON', 'PUSH', 'VOID'].includes(g.status)) ? 'cashed' : 'open';
  return { kind: 'parlay', state, counts };
}

// ---------- page ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const BOOK_SHORT = { Bookmaker: 'BKR', BetOnline: 'BEO', 'DraftKings Predictions': 'DKP', DraftKings: 'DK', FanDuel: 'FD', Bovada: 'BOV' };
const STATUS_ORDER = { LIVE: 0, CHECK: 1, PENDING: 2, LOST: 3, WON: 4, PUSH: 5, VOID: 6 };

function legRow(leg, g) {
  const cls = g.status === 'LIVE' ? `live ${g.lean || ''}` : g.status.toLowerCase();
  const tag = { WON: 'Hit', LOST: 'Miss', PUSH: 'Push', VOID: 'Void', LIVE: g.lean === 'ahead' ? 'On pace' : 'Live', PENDING: 'Not started', CHECK: 'Check' }[g.status];
  return `<li class="leg ${cls}">
    <span class="dot" aria-hidden="true"></span>
    <div class="leg-main"><div class="leg-sel">${esc(leg.selection)}</div>
    <div class="leg-now"><span class="leg-game">${esc(leg.game)}</span>${g.now ? ` · ${esc(g.now)}` : ''}</div></div>
    <span class="leg-tag">${tag}</span></li>`;
}

function ticketCard(t, graded, sum) {
  const book = BOOK_SHORT[t.book] || t.book;
  const order = t.legs.map((l, i) => i).sort((a, b) => (STATUS_ORDER[graded[a].status] ?? 9) - (STATUS_ORDER[graded[b].status] ?? 9));
  const segs = order.map((i) => {
    const g = graded[i];
    return `<i class="seg ${g.status === 'LIVE' ? 'live ' + (g.lean || '') : g.status.toLowerCase()}"></i>`;
  }).join('');
  const c = sum.counts;
  const left = c.LIVE + c.PENDING + c.CHECK;
  let line;
  if (sum.kind === 'rr') {
    line = `${sum.alive} of ${sum.total} combos alive${sum.cashed ? ` · ${sum.cashed} cashed (${usd(sum.returnedUsd)} back)` : ''}`;
  } else {
    line = `${c.WON + c.PUSH} of ${t.legs.length} hit · ${left} to go${c.LIVE ? ` · ${c.LIVE} live` : ''}`;
  }
  const toWin = sum.kind === 'rr' ? sum.maxProfitUsd : t.potential_profit_usd;
  let title = String(t.game_title || '').replace(/^(BKR|BEO|DKP)\s+/, '').replace(/^DraftKings Predictions\s+/, '');
  if (title.length > 70 && title.includes(':')) title = title.slice(0, title.indexOf(':'));
  return `<details class="ticket" id="t-${esc(t.ticket_number)}" data-left="${left}" data-win="${toWin}">
  <summary>
    <div class="t-top"><span class="book">${esc(book)}</span><span class="tno">#${esc(t.ticket_number)}</span>${c.CHECK ? '<span class="flag">check</span>' : ''}<span class="odds">${esc(t.odds_american || (sum.kind === 'rr' ? 'RR' : ''))}</span></div>
    <div class="t-title">${esc(title)}</div>
    <div class="bar" role="img" aria-label="${esc(line)}">${segs}</div>
    <div class="t-foot"><span class="t-line">${esc(line)}</span><span class="money"><b>${usd(t.stake_usd)}</b> to win <b class="win">${usd(toWin)}</b></span></div>
  </summary>
  <ol class="legs">${order.map((i) => legRow(t.legs[i], graded[i])).join('')}</ol>
</details>`;
}

function gameChip(e) {
  const live = e.state === 'in';
  const status = e.state === 'pre' ? kickoffPT(e.date) : e.detail;
  return `<a class="game ${e.state}" href="https://www.espn.com/nfl/game/_/gameId/${e.id}" target="_blank" rel="noopener">
    <span class="g-row"><span>${e.away}</span><b>${e.state === 'pre' ? '' : e.awayScore}</b></span>
    <span class="g-row"><span>${e.home}</span><b>${e.state === 'pre' ? '' : e.homeScore}</b></span>
    <span class="g-st">${live ? '<i class="pulse"></i>' : ''}${esc(status)}</span></a>`;
}

function page({ open, settledCounts, games, builtAt, totals }) {
  const builtIso = builtAt.toISOString();
  const builtLabel = 'Graded ' + builtAt.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `<title>Platinum Rose Road Tracker</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap">
<style>
/* Layout: one column of ticket stubs under a sticky score/totals header; tap a stub to open its legs. */
:root {
  --bg: #eef0f4; --surface: #ffffff; --ink: #161a24; --muted: #5b6273; --line: #d9dde6;
  --accent: #b2325f; --win: #17824a; --loss: #bf3a3a; --live: #a8680f; --idle: #9aa1b1;
  --win-soft: #e2f3e9; --loss-soft: #f8e4e4; --live-soft: #f8eedb;
  --f-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --f-body: "Public Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --f-mono: "JetBrains Mono", ui-monospace, "Roboto Mono", monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0e1117; --surface: #171b24; --ink: #e9ebf1; --muted: #8d94a6; --line: #272d3a;
  --accent: #f07ba5; --win: #43c982; --loss: #ff7070; --live: #f0b54a; --idle: #5d6474;
  --win-soft: #15291f; --loss-soft: #2e1a1c; --live-soft: #2c2415; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #0e1117; --surface: #171b24; --ink: #e9ebf1; --muted: #8d94a6; --line: #272d3a;
  --accent: #f07ba5; --win: #43c982; --loss: #ff7070; --live: #f0b54a; --idle: #5d6474;
  --win-soft: #15291f; --loss-soft: #2e1a1c; --live-soft: #2c2415; color-scheme: dark; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font: 15px/1.4 var(--f-body); -webkit-tap-highlight-color: transparent; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--surface); }
.wrap { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); max-width: 640px; margin: 0 auto; }
header.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--surface); border-bottom: 1px solid var(--line); }
header.top .wrap { padding-block: 10px 10px; display: grid; gap: 8px; }
.brand { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.brand h1 { margin: 0; font: 700 22px/1 var(--f-display); letter-spacing: .02em; text-transform: uppercase; }
.brand h1 span { color: var(--accent); }
.brand h1 em { font-style: normal; font: 600 13px/1 var(--f-mono); letter-spacing: 0; padding: 3px 6px; border: 1px solid var(--line); border-radius: 4px; vertical-align: 3px; color: var(--muted); }
.brand h1 { white-space: nowrap; }
.fresh { font: 500 12px/1.2 var(--f-mono); color: var(--muted); text-align: right; }
.fresh.stale { color: var(--live); }
.totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tot { display: grid; gap: 2px; }
.tot small { font: 600 10.5px/1 var(--f-body); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.tot b { font: 700 19px/1.1 var(--f-mono); font-variant-numeric: tabular-nums; }
.tot b.win { color: var(--win); }
.games { display: flex; gap: 8px; overflow-x: auto; padding-block: 12px 4px; scrollbar-width: none; }
.games::-webkit-scrollbar { display: none; }
.game { flex: 0 0 auto; min-width: 92px; display: grid; gap: 2px; padding: 8px 10px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line); color: var(--ink); text-decoration: none; font: 500 13px/1.2 var(--f-mono); }
.game.in { border-color: var(--live); }
.g-row { display: flex; justify-content: space-between; gap: 10px; }
.g-row b { font-weight: 700; font-variant-numeric: tabular-nums; }
.g-st { font: 500 11px/1.2 var(--f-body); color: var(--muted); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--live); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .3; } }
.section-h { display: flex; justify-content: space-between; align-items: baseline; margin: 14px 0 8px; font: 700 15px/1 var(--f-display); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.list { display: grid; gap: 10px; padding-bottom: 24px; }
.ticket { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.ticket > summary { list-style: none; cursor: pointer; padding: 12px 14px; display: grid; gap: 8px; }
.ticket > summary::-webkit-details-marker { display: none; }
.ticket > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 12px; }
.t-top { display: flex; align-items: center; gap: 8px; font: 500 12px/1 var(--f-mono); color: var(--muted); }
.book { font-weight: 700; color: var(--accent); letter-spacing: .04em; }
.odds { margin-left: auto; color: var(--ink); font-weight: 700; }
.flag { padding: 2px 6px; border-radius: 4px; background: var(--live-soft); color: var(--live); font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: .06em; }
.t-title { font-weight: 600; font-size: 15px; line-height: 1.3; text-wrap: balance; }
.bar { display: flex; gap: 3px; height: 8px; }
.seg { flex: 1; border-radius: 2px; background: var(--line); }
.seg.won, .seg.push, .seg.void { background: var(--win); }
.seg.lost { background: var(--loss); }
.seg.live { background: var(--live); }
.seg.live.ahead { background: linear-gradient(90deg, var(--win), var(--live)); }
.seg.check { background: repeating-linear-gradient(45deg, var(--live) 0 3px, transparent 3px 6px); }
.t-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; font-size: 13px; color: var(--muted); }
.money { font-family: var(--f-mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
.money b { color: var(--ink); }
.money b.win { color: var(--win); }
.legs { list-style: none; margin: 0; padding: 4px 14px 12px; border-top: 1px dashed var(--line); display: grid; }
.leg { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: start; padding-block: 9px; border-bottom: 1px solid var(--line); }
.leg:last-child { border-bottom: 0; }
.leg-main { min-width: 0; }
.leg-sel { font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
.leg-now { font: 500 12px/1.35 var(--f-mono); color: var(--muted); margin-top: 2px; overflow-wrap: anywhere; }
.leg-game { color: var(--ink); opacity: .75; }
.dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; background: var(--idle); }
.leg-tag { font: 600 11px/1 var(--f-body); letter-spacing: .05em; text-transform: uppercase; padding: 4px 6px; border-radius: 4px; color: var(--muted); background: var(--bg); white-space: nowrap; }
.leg.won .dot, .leg.push .dot { background: var(--win); } .leg.won .leg-tag, .leg.push .leg-tag { color: var(--win); background: var(--win-soft); }
.leg.lost .dot { background: var(--loss); } .leg.lost .leg-tag { color: var(--loss); background: var(--loss-soft); }
.leg.live .dot { background: var(--live); animation: pulse 1.6s ease-in-out infinite; } .leg.live .leg-tag { color: var(--live); background: var(--live-soft); }
.leg.live.ahead .leg-tag { color: var(--win); background: var(--win-soft); }
.leg.check .dot { background: var(--live); } .leg.check .leg-tag { color: var(--live); background: var(--live-soft); }
.empty { padding: 28px 16px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 12px; }
footer { color: var(--muted); font-size: 12.5px; padding-block: 4px 32px; display: grid; gap: 6px; }
@media (prefers-reduced-motion: reduce) { .pulse, .leg.live .dot { animation: none; } }
</style>

<header class="top"><div class="wrap">
  <div class="brand"><h1>Platinum <span>Rose</span> <em>W${WEEK}</em></h1><div class="fresh" id="fresh" data-built="${builtIso}">${esc(builtLabel)}</div></div>
  <div class="totals">
    <div class="tot"><small>Open tickets</small><b>${open.length}</b></div>
    <div class="tot"><small>At risk</small><b>${usd(totals.risk)}</b></div>
    <div class="tot"><small>Max to win</small><b class="win">${usd(totals.toWin)}</b></div>
  </div>
</div></header>

<main class="wrap">
  ${games.length ? `<nav class="games" aria-label="Games your open tickets depend on">${games.map(gameChip).join('')}</nav>` : ''}
  <div class="section-h"><span>Live &amp; open</span><span>${open.length ? 'closest to cashing first' : ''}</span></div>
  <div class="list">
    ${open.length ? open.map((o) => ticketCard(o.t, o.graded, o.sum)).join('\n') : '<div class="empty">No open tickets right now. Everything for this week has settled.</div>'}
  </div>
  <footer>
    <span>Real tickets only. Week ${WEEK} so far: ${settledCounts.cashed} cashed, ${settledCounts.burnt} burnt (hidden). Paper card and SuperContest stay on the desktop tracker.</span>
    <span>Scores here are as of the time shown up top. Tap a game for ESPN's live gamecast.</span>
  </footer>
</main>

<script>
(function () {
  var el = document.getElementById('fresh');
  var built = Date.parse(el.dataset.built);
  var label = el.textContent;
  function tick() {
    var m = Math.round((Date.now() - built) / 60000);
    el.textContent = label + (m < 1 ? ' · now' : ' · ' + (m < 60 ? m + 'm ago' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm ago'));
    el.classList.toggle('stale', m >= 45);
  }
  tick(); setInterval(tick, 30000);
  var KEY = 'pr-mobile-open';
  var openSet = {};
  try { openSet = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { openSet = {}; }
  document.querySelectorAll('details.ticket').forEach(function (d) {
    if (openSet[d.id]) d.open = true;
    d.addEventListener('toggle', function () {
      if (d.open) openSet[d.id] = 1; else delete openSet[d.id];
      try { localStorage.setItem(KEY, JSON.stringify(openSet)); } catch (e) {}
    });
  });
})();
</script>
`;
}

// ---------- main ----------
const wagers = JSON.parse(await readFile(path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json'), 'utf8'));
const weekTickets = wagers.filter((w) => Number(w.week) === WEEK && !w.is_paper && (w.legs || []).length);
const pending = weekTickets.filter((w) => String(w.status).toUpperCase() === 'PENDING');
const events = await loadEvents([WEEK - 1, WEEK]);

const graded = [];
for (const t of pending) {
  const g = [];
  for (const leg of t.legs) g.push(await gradeLeg(leg, events));
  graded.push({ t, graded: g, sum: summarizeTicket(t, g) });
}
const open = graded.filter((o) => o.sum.state === 'open')
  .sort((a, b) => {
    const la = a.graded.filter((g) => !g.locked).length; const lb = b.graded.filter((g) => !g.locked).length;
    return la - lb || (b.sum.kind === 'rr' ? b.sum.maxProfitUsd : b.t.potential_profit_usd) - (a.sum.kind === 'rr' ? a.sum.maxProfitUsd : a.t.potential_profit_usd);
  });
const settledToday = weekTickets.filter((w) => String(w.status).toUpperCase() !== 'PENDING');
const settledCounts = {
  cashed: graded.filter((o) => o.sum.state === 'cashed').length + settledToday.filter((w) => /won|win|cash/i.test(String(w.result))).length,
  burnt: graded.filter((o) => o.sum.state === 'burnt').length + settledToday.filter((w) => /lost|loss/i.test(String(w.result))).length,
};
const totals = {
  risk: open.reduce((s, o) => s + Number(o.t.stake_usd || 0), 0),
  toWin: open.reduce((s, o) => s + Number(o.sum.kind === 'rr' ? o.sum.maxProfitUsd : o.t.potential_profit_usd || 0), 0),
};
const gameIds = new Set();
open.forEach((o) => o.graded.forEach((g) => { if (!g.locked && g.eventId) gameIds.add(g.eventId); }));
const stateRank = { in: 0, pre: 1, post: 2 };
const games = events.filter((e) => gameIds.has(e.id)).sort((a, b) => stateRank[a.state] - stateRank[b.state] || Date.parse(a.date) - Date.parse(b.date));

const builtAt = new Date();
await writeFile(OUT_HTML, page({ open, settledCounts, games, builtAt, totals }), 'utf8');
await writeFile(OUT_STATE, JSON.stringify({
  built_at: builtAt.toISOString(), week: WEEK,
  tickets: graded.map((o) => ({
    ticket_number: o.t.ticket_number, book: o.t.book, title: o.t.game_title, state: o.sum.state, summary: o.sum,
    legs: o.t.legs.map((l, i) => ({ leg_num: l.leg_num, selection: l.selection, game: l.game, ...o.graded[i] })),
  })),
}, null, 2), 'utf8');

console.log(`W${WEEK}: ${pending.length} pending tickets → ${open.length} open, ${graded.filter((o) => o.sum.state === 'cashed').length} now cashed, ${graded.filter((o) => o.sum.state === 'burnt').length} now burnt`);
for (const o of graded) {
  const flags = o.graded.filter((g) => g.status === 'CHECK').length;
  console.log(`  ${o.sum.state.padEnd(6)} ${o.t.ticket_number.padEnd(11)} ${JSON.stringify(o.sum.counts)}${flags ? '  CHECK×' + flags : ''}`);
}
console.log('wrote', path.relative(ROOT, OUT_HTML));
