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
          oddsLine: c.odds?.[0]?.details || '', overUnder: c.odds?.[0]?.overUnder ?? null,
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
      // First touchdown of the game (scorer is the text before the first yardage number).
      const firstTd = (sum.scoringPlays || []).find((p) => /touchdown/i.test(p.type?.text || '') || /\bTD\b/.test(p.type?.abbreviation || ''));
      players.firstTd = firstTd ? { text: firstTd.text || '', scorer: nameKey(String(firstTd.text || '').split(/\s\d+\s*(yd|yard)/i)[0]) } : null;
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
  sacks_taken: (g) => num(g.passing?.['sacks-sackYardsLost']),
  longest_reception: (g) => num(g.receiving?.longReception),
  touchdowns: (g) => num(g.rushing?.rushingTouchdowns) + num(g.receiving?.receivingTouchdowns)
    + num(g.kickReturns?.kickReturnTouchdowns) + num(g.puntReturns?.puntReturnTouchdowns)
    + num(g.interceptions?.interceptionTouchdowns) + num(g.defensive?.defensiveTouchdowns),
};
const MARKET_STAT = {
  anytime_touchdown: 'touchdowns', touchdowns_2plus: 'touchdowns', touchdowns: 'touchdowns',
  tackles_assists: 'tackles_assists', pass_interceptions: 'pass_interceptions', interceptions_thrown: 'pass_interceptions',
  tackles_combined: 'tackles_assists', kicker_points: 'kicking_points',
};
const STAT_LABEL = {
  receptions: 'rec', receiving_yards: 'rec yds', rushing_yards: 'rush yds', carries: 'carries', passing_yards: 'pass yds',
  pass_completions: 'cmp', pass_attempts: 'att', passing_touchdowns: 'pass TD', pass_interceptions: 'INT',
  tackles_assists: 'tkl+ast', sacks: 'sacks', field_goals_made: 'FG', kicking_points: 'kick pts', touchdowns: 'TD',
  sacks_taken: 'sacks taken', longest_reception: 'long rec',
};

// Over/under outcome for any counting number (props, team counts, game counts).
function overUnder(out, v, line, dir, final, label) {
  if (dir === 'over') {
    if (v > line) return { ...out, status: 'WON', now: `${v} ${label}`, locked: true, value: v };
    if (final) return { ...out, status: v === line ? 'PUSH' : 'LOST', now: `${v} ${label}`, locked: true, value: v };
    return { ...out, status: 'LIVE', lean: 'behind', now: `${v} ${label} · needs ${Math.floor(line) + 1 - v} more`, locked: false, value: v };
  }
  if (v > line) return { ...out, status: 'LOST', now: `${v} ${label}`, locked: true, value: v };
  if (final) return { ...out, status: v === line ? 'PUSH' : 'WON', now: `${v} ${label}`, locked: true, value: v };
  return { ...out, status: 'LIVE', lean: 'ahead', now: `${v} ${label} · ${Math.ceil(line) - 1 - v} to spare`, locked: false, value: v };
}

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
      if (total > line) return { ...out, status: 'WON', value: total, now: `total ${total}`, locked: true };
      if (final) return { ...out, status: total === line ? 'PUSH' : 'LOST', value: total, now: `total ${total}`, locked: true };
      return { ...out, status: 'LIVE', lean: 'behind', value: total, now: `total ${total} · needs ${Math.floor(line) + 1 - total} more`, locked: false };
    }
    if (total > line) return { ...out, status: 'LOST', value: total, now: `total ${total}`, locked: true };
    if (final) return { ...out, status: total === line ? 'PUSH' : 'WON', value: total, now: `total ${total}`, locked: true };
    return { ...out, status: 'LIVE', lean: 'ahead', value: total, now: `total ${total} · ${Math.ceil(line) - 1 - total} pts of room`, locked: false };
  }

  // game- and team-level counts from the box score
  if (market === 'game_field_goals' || market === 'team_touchdowns' || market === 'first_touchdown') {
    const players = await loadBox(ev);
    if (!players) return { ...out, status: 'CHECK', now: 'box score unavailable', locked: false };
    const line = Number(leg.line ?? 0.5);
    const dir = leg.direction || 'over';
    if (market === 'game_field_goals') {
      let fg = 0;
      for (const p of players.values()) fg += STAT.field_goals_made(p.groups);
      return overUnder(out, fg, line, dir, final, 'FG (both teams)');
    }
    if (market === 'team_touchdowns') {
      const team = normAbbr(leg.team) || teamFromText(sel);
      let td = 0;
      for (const p of players.values()) if (p.team === team) td += STAT.touchdowns(p.groups);
      return overUnder(out, td, line, dir, final, `${team} TD`);
    }
    // first_touchdown
    const ft = players.firstTd;
    if (!ft) return final ? { ...out, status: 'LOST', now: 'no touchdowns scored', locked: true } : { ...out, status: 'LIVE', lean: 'behind', now: 'no TD scored yet', locked: false };
    const me = nameKey(leg.player || sel.replace(/\sfirst\s+td.*$/i, ''));
    const hit = ft.scorer === me || (me && ft.scorer.endsWith(me.split(' ').slice(1).join(' ')) && ft.scorer[0] === me[0]);
    return { ...out, status: hit ? 'WON' : 'LOST', now: `first TD: ${String(ft.text).slice(0, 60)}`, locked: true };
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
  return overUnder(out, getter(p.groups), Number(leg.line ?? 0.5), leg.direction || 'over', final, label);
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
    const byNum = new Map();
    t.legs.forEach((l, i) => { legTeams(l).forEach((tm) => byTeam.set(tm, legs[i])); byNum.set(Number(l.leg_num ?? i + 1), legs[i]); });
    let alive = 0; let cashed = 0; let wonUsd = 0; let maxUsd = 0;
    for (const c of t.round_robin.combinations) {
      const gs = c.leg_nums?.length ? c.leg_nums.map((n) => byNum.get(Number(n))) : c.teams.map((tm) => byTeam.get(normAbbr(tm)));
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

// ---------- page (styled to match the desktop Live Tracker: navy cards, blue/green accents) ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_ORDER = { LIVE: 0, CHECK: 1, PENDING: 2, LOST: 3, WON: 4, PUSH: 5, VOID: 6 };
const TEAM_NAME = {};
for (const [nick, ab] of Object.entries(NICK)) if (!TEAM_NAME[ab] && nick !== 'niners' && nick !== 'washington') TEAM_NAME[ab] = nick === '49ers' ? '49ers' : nick[0].toUpperCase() + nick.slice(1);
const TEAM_COLOR = {
  ARI: '#97233F', ATL: '#A71930', BAL: '#5B3FBF', BUF: '#1F5BD6', CAR: '#0085CA', CHI: '#C83803', CIN: '#FB4F14', CLE: '#FF3C00',
  DAL: '#2D5BD1', DEN: '#FB4F14', DET: '#0076B6', GB: '#FFB612', HOU: '#A71930', IND: '#1F5BD6', JAX: '#006778', KC: '#E31837',
  LAC: '#0080C6', LAR: '#2D5BD1', LV: '#A5ACAF', MIA: '#008E97', MIN: '#4F2683', NE: '#C60C30', NO: '#D3BC8D', NYG: '#1F4BD6',
  NYJ: '#125740', PHI: '#004C54', PIT: '#FFB612', SEA: '#69BE28', SF: '#AA0000', TB: '#D50A0A', TEN: '#4B92DB', WSH: '#5A1414',
};
const DARK_TEXT = new Set(['GB', 'LV', 'NO', 'PIT', 'SEA']);
const teamChip = (ab) => `<span class="tchip" style="background:${TEAM_COLOR[ab] || '#334155'};color:${DARK_TEXT.has(ab) ? '#0B1120' : '#fff'}">${esc(ab)}</span>`;
const timePT = (iso) => new Date(iso).toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }) + ' PT';

function clockChip(ev) {
  if (!ev) return '';
  if (ev.state === 'pre') return `<span class="chip time">${esc(timePT(ev.date))}</span>`;
  if (ev.state === 'in') return `<span class="chip live"><i class="pulse"></i>${esc(ev.detail)}</span>`;
  return `<span class="chip final">${esc(ev.detail || 'Final')}</span>`;
}

function legName(leg) {
  const sel = String(leg.selection || '');
  const p = String(leg.player || '');
  if (p && sel.startsWith(p)) {
    const rest = sel.slice(p.length).trim();
    return `<b>${esc(p)}</b>${rest ? ` • ${esc(rest)}` : ''}`;
  }
  return `<b>${esc(sel)}</b>`;
}

function legRow(leg, g, ev) {
  const cls = { WON: 'hit', PUSH: 'push', VOID: 'push', LOST: 'burnt', LIVE: 'live', PENDING: 'pending', CHECK: 'check' }[g.status] || 'pending';
  const mark = { hit: '✓', push: '=', burnt: '✕', check: '!' }[cls] || '';
  const hasNum = g.value !== undefined && leg.line != null && !/spread|moneyline/.test(String(leg.market));
  let progress = '';
  if (hasNum) {
    const line = Number(leg.line);
    const over = (leg.direction || 'over') === 'over';
    const target = over ? Math.floor(line) + 1 : line;
    const pct = Math.max(0, Math.min(100, (g.value / (target || 1)) * 100));
    const tail = cls === 'hit' ? ' ✅' : cls === 'burnt' ? ' ❌' : '';
    const fill = cls === 'hit' ? 'green' : cls === 'burnt' ? 'red' : over ? 'blue' : 'amber';
    progress = `<div class="prog-row"><span>Stat Progress${over ? '' : ' (under)'}</span><b>${g.value} / ${line}${tail}</b></div>
      <div class="pbar"><i class="${fill}" style="width:${pct.toFixed(0)}%"></i></div>`;
  } else if (g.status !== 'PENDING' || !ev) {
    progress = `<div class="prog-row"><span>${g.status === 'CHECK' ? 'Needs a hand grade' : 'Score'}</span><b class="${cls}">${esc(g.now || '')}</b></div>`;
  }
  return `<div class="leg-item ${cls}">
    <span class="chk" aria-hidden="true">${mark}</span>
    <div class="leg-body">
      <div class="leg-name">${legName(leg)}</div>
      <div class="leg-meta">${clockChip(ev)}<span class="leg-game">${esc(leg.game)}</span></div>
      ${progress}
    </div></div>`;
}

function ticketCard(t, graded, sum, evById) {
  const order = t.legs.map((l, i) => i).sort((a, b) => (STATUS_ORDER[graded[a].status] ?? 9) - (STATUS_ORDER[graded[b].status] ?? 9));
  const c = sum.counts;
  const left = c.LIVE + c.PENDING + c.CHECK;
  const done = c.WON + c.PUSH + (c.VOID || 0);
  const line = sum.kind === 'rr'
    ? `${sum.alive} of ${sum.total} combos alive${sum.cashed ? ` · ${sum.cashed} cashed (${usd(sum.returnedUsd)} back)` : ''}`
    : `${done} of ${t.legs.length} hit · ${left} to go${c.LIVE ? ` · ${c.LIVE} live` : ''}`;
  const toWin = sum.kind === 'rr' ? sum.maxProfitUsd : t.potential_profit_usd;
  let title = String(t.game_title || '').replace(/^Platinum Rose AI paper:\s*/, '');
  if (title.length > 90 && title.includes(':')) title = title.slice(0, title.indexOf(':'));
  const legsLabel = sum.kind === 'rr' ? `Round robin (${t.legs.length} picks)` : `${t.category || 'Parlay'} (${t.legs.length} legs)`;
  const funding = String(t.funding_type || 'cash').toUpperCase();
  const pct = sum.kind === 'rr' ? (sum.cashed / sum.total) * 100 : (done / t.legs.length) * 100;
  const tid = t.ticket_number || t.id;
  const badges = t.is_paper
    ? `<span class="badge badge-paper">📝 Imaginary</span>${t.card_section ? `<span class="badge badge-id">Card §${esc(t.card_section)}</span>` : ''}`
    : `<span class="badge badge-cash">${esc(funding)}</span><span class="badge badge-id">#${esc(tid)}</span>`;
  return `<details class="bet-card${t.is_paper ? ' paper' : ''}" id="t-${esc(tid)}">
  <summary>
    <div class="card-header"><div class="card-title">${esc(title)}</div><span class="chev" aria-hidden="true">▾</span></div>
    <div class="card-subtitle">${esc(t.book)} • ${esc(legsLabel)}</div>
    <div class="badges">${badges}${c.CHECK ? '<span class="badge badge-check">check leg</span>' : ''}</div>
    <div class="money-row">
      <div><small>Stake:</small><b>${usd(t.stake_usd)}</b></div>
      <div><small>Odds:</small><b class="odds">${esc(t.odds_american || (sum.kind === 'rr' ? 'RR' : '—'))}</b></div>
      <div><small>To Win:</small><b class="towin">${usd(toWin)}</b></div>
    </div>
    <div class="progress-bar-wrap"><div class="progress-fill" style="width:${pct.toFixed(0)}%"></div></div>
    <div class="card-line">${esc(line)}</div>
  </summary>
  <div class="card-legs">${order.map((i) => legRow(t.legs[i], graded[i], evById.get(graded[i].eventId))).join('')}</div>
</details>`;
}

function gameCard(e) {
  const pre = e.state === 'pre';
  const lead = (ab, mine, theirs) => (!pre && mine > theirs ? ' lead' : '');
  const odds = [e.oddsLine, e.overUnder != null ? `O/U ${e.overUnder}` : ''].filter(Boolean).join(' • ');
  return `<a class="game-card ${e.state}" href="https://www.espn.com/nfl/game/_/gameId/${e.id}" target="_blank" rel="noopener">
    <div class="gc-top">${clockChip(e)}</div>
    <div class="gc-team${lead(e.away, e.awayScore, e.homeScore)}">${teamChip(e.away)}<span>${esc(TEAM_NAME[e.away] || e.away)}</span><b>${pre ? '' : e.awayScore}</b></div>
    <div class="gc-team${lead(e.home, e.homeScore, e.awayScore)}">${teamChip(e.home)}<span>${esc(TEAM_NAME[e.home] || e.home)}</span><b>${pre ? '' : e.homeScore}</b></div>
    ${odds ? `<div class="gc-odds">${esc(odds)}</div>` : ''}
  </a>`;
}

function paperRow(o) {
  const r = o.sum.state === 'cashed' ? 'hit' : 'burnt';
  const title = String(o.t.game_title || '').replace(/^Platinum Rose AI paper:\s*/, '');
  return `<div class="paper-row"><span class="pr-title">${esc(title)}</span><span class="pr-pl ${r}">${o.pl >= 0 ? '+' : '−'}${usd(Math.abs(o.pl))}</span></div>`;
}

function paperSection(paper, evById) {
  if (!paper.all.length) return '';
  const pl = paper.settled.reduce((a, o) => a + o.pl, 0);
  return `<details class="paper-wrap" id="paper-section" open>
  <summary class="slips-h paper-h"><span class="dot purple" aria-hidden="true"></span><span>📝 Imaginary · Platinum AI Card (${paper.open.length} Live)</span><span class="chev" aria-hidden="true">▾</span></summary>
  <p class="paper-note">Not placed. Kept out of Cash Risk and Potential Win. Paper record so far: ${paper.settled.filter((o) => o.sum.state === 'cashed').length} cashed, ${paper.settled.filter((o) => o.sum.state === 'burnt').length} burnt, <b class="${pl >= 0 ? 'hit' : 'burnt'}">${pl >= 0 ? '+' : '−'}${usd(Math.abs(pl))}</b> paper P&amp;L. Open paper risk ${usd(paper.risk)} to win ${usd(paper.toWin)}.</p>
  <div class="list">${paper.open.map((o) => ticketCard(o.t, o.graded, o.sum, evById)).join('\n') || '<div class="empty">Every paper ticket has settled.</div>'}</div>
  ${paper.settled.length ? `<details class="paper-settled" id="paper-settled"><summary>Settled paper tickets (${paper.settled.length})</summary><div class="paper-rows">${paper.settled.map(paperRow).join('')}</div></details>` : ''}
</details>`;
}

function page({ open, settledCounts, games, builtAt, totals, evById, paper }) {
  const builtIso = builtAt.toISOString();
  const builtLabel = 'Graded ' + builtAt.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `<title>Platinum Rose Road Tracker</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: desktop Live Tracker palette on one phone column: header panel, game board strip, slip cards with leg boxes. Single dark look, same as desktop. */
:root {
  --bg-main: #0B1120; --bg-card: #151F32; --bg-leg: #111A2B; --bg-chip: #1E293B; --border: #273752;
  --blue: #3B82F6; --green: #10B981; --gold: #F59E0B; --cyan: #38BDF8; --purple: #818CF8; --red: #EF4444;
  --text: #F8FAFC; --muted: #94A3B8;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg-main); color: var(--text); font: 14px/1.5 var(--font); -webkit-tap-highlight-color: transparent; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg-main); }
.wrap { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); max-width: 640px; margin: 0 auto; }
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg-main); padding-block: 10px 6px; }
.panel { background: linear-gradient(180deg, #16213A, var(--bg-card)); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; display: grid; gap: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
.title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.title-row h1 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -.01em; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 3px rgba(16,185,129,.2); flex: 0 0 auto; }
.fresh { font-size: 12px; color: var(--muted); }
.fresh.stale { color: var(--gold); }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.kpi small { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.kpi b { font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; }
.kpi b.blue { color: var(--blue); } .kpi b.green { color: var(--green); }
.board-h, .slips-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 14px 0 8px; font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.board-h span:last-child { color: var(--muted); font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 12px; }
.slips-h { justify-content: flex-start; }
.games { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.games::-webkit-scrollbar { display: none; }
.game-card { flex: 0 0 auto; width: 168px; display: grid; gap: 6px; padding: 10px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); text-decoration: none; }
.game-card.in { border-color: rgba(245,158,11,.55); }
.gc-team { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
.gc-team.lead { color: var(--text); }
.gc-team b { font-size: 15px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.gc-odds { font-size: 11px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 6px; }
.tchip { font-size: 10.5px; font-weight: 800; padding: 1px 5px; border-radius: 4px; min-width: 32px; text-align: center; letter-spacing: .02em; }
.chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
.chip.time { background: rgba(59,130,246,.15); color: #93C5FD; border: 1px solid rgba(59,130,246,.4); }
.chip.live { background: rgba(245,158,11,.14); color: var(--gold); border: 1px solid rgba(245,158,11,.45); }
.chip.final { background: var(--bg-chip); color: var(--muted); border: 1px solid var(--border); }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .25; } }
.slips-h .dot { animation: pulse 1.8s ease-in-out infinite; }
.list { display: grid; gap: 12px; padding-bottom: 20px; }
.bet-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.bet-card > summary { list-style: none; cursor: pointer; padding: 14px; display: grid; gap: 6px; }
.bet-card > summary::-webkit-details-marker { display: none; }
.bet-card > summary:focus-visible { outline: 2px solid var(--blue); outline-offset: -2px; border-radius: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.card-title { font-size: 15px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
.chev { color: var(--muted); transition: transform .2s; padding-top: 2px; }
.bet-card[open] .chev { transform: rotate(180deg); }
.card-subtitle { font-size: 12px; color: var(--muted); }
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
.badge { font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.badge-cash { background: var(--bg-chip); color: #E2E8F0; }
.badge-id { background: transparent; color: var(--muted); border: 1px solid var(--border); text-transform: none; font-variant-numeric: tabular-nums; }
.badge-check { background: rgba(245,158,11,.15); color: var(--gold); }
.money-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.money-row small { display: block; font-size: 12px; color: var(--text); opacity: .85; }
.money-row b { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
.money-row b.odds { color: var(--cyan); } .money-row b.towin { color: var(--green); }
.progress-bar-wrap { background: var(--bg-chip); border-radius: 999px; height: 6px; overflow: hidden; margin-top: 4px; }
.progress-fill { background: var(--blue); height: 100%; }
.card-line { font-size: 12px; color: var(--muted); }
.card-legs { display: grid; gap: 8px; padding: 0 12px 12px; }
.leg-item { display: grid; grid-template-columns: 20px 1fr; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--bg-leg); border: 1px solid var(--border); }
.leg-item.hit { border-color: rgba(16,185,129,.45); }
.leg-item.burnt { border-color: rgba(239,68,68,.45); opacity: .8; }
.leg-item.live { border-color: rgba(245,158,11,.45); }
.chk { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #CBD5E1; background: #E2E8F0; margin-top: 2px; display: grid; place-items: center; font-size: 11px; font-weight: 900; color: #fff; line-height: 1; }
.leg-item.hit .chk, .leg-item.push .chk { background: var(--green); border-color: var(--green); }
.leg-item.burnt .chk { background: var(--red); border-color: var(--red); }
.leg-item.live .chk { background: transparent; border-color: var(--gold); }
.leg-item.check .chk { background: var(--gold); border-color: var(--gold); color: #0B1120; }
.leg-body { min-width: 0; display: grid; gap: 6px; }
.leg-name { font-size: 13.5px; line-height: 1.35; overflow-wrap: anywhere; }
.leg-name b { font-weight: 700; }
.leg-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; }
.leg-game { font-size: 11.5px; color: var(--muted); }
.prog-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--muted); }
.prog-row b { color: var(--text); font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; overflow-wrap: anywhere; }
.prog-row b.hit { color: var(--green); } .prog-row b.burnt { color: var(--red); } .prog-row b.live { color: var(--gold); }
.pbar { background: var(--bg-chip); border-radius: 999px; height: 5px; overflow: hidden; margin-top: -2px; }
.pbar i { display: block; height: 100%; background: var(--blue); }
.pbar i.green { background: var(--green); } .pbar i.red { background: var(--red); } .pbar i.amber { background: var(--gold); }
.empty { padding: 28px 16px; text-align: center; color: var(--muted); background: var(--bg-card); border: 1px dashed var(--border); border-radius: 12px; }
footer { color: var(--muted); font-size: 12px; padding-block: 4px 32px; display: grid; gap: 6px; }
.badge-paper { background: rgba(129,140,248,.16); color: var(--purple); border: 1px solid rgba(129,140,248,.45); text-transform: none; }
.bet-card.paper { border-color: rgba(129,140,248,.35); border-style: dashed; }
.dot.purple { background: var(--purple); box-shadow: 0 0 0 3px rgba(129,140,248,.2); }
.paper-wrap > summary { list-style: none; cursor: pointer; }
.paper-wrap > summary::-webkit-details-marker, .paper-settled > summary::-webkit-details-marker { display: none; }
.paper-h { color: var(--purple); justify-content: flex-start; }
.paper-h .chev { margin-left: auto; }
.paper-wrap[open] > summary .chev { transform: rotate(180deg); }
.paper-note { margin: 0 0 10px; font-size: 12px; color: var(--muted); }
.paper-note b.hit, .pr-pl.hit { color: var(--green); } .paper-note b.burnt, .pr-pl.burnt { color: var(--red); }
.paper-settled { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 20px; }
.paper-settled > summary { list-style: none; cursor: pointer; padding: 12px 14px; font-size: 13px; font-weight: 700; color: var(--muted); }
.paper-rows { display: grid; padding: 0 14px 10px; }
.paper-row { display: flex; justify-content: space-between; gap: 12px; padding-block: 8px; border-top: 1px solid var(--border); font-size: 13px; }
.pr-title { min-width: 0; overflow-wrap: anywhere; }
.pr-pl { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .pulse, .slips-h .dot { animation: none; } .chev { transition: none; } }
</style>

<div class="top"><div class="wrap"><div class="panel">
  <div class="title-row"><span class="dot" aria-hidden="true"></span><h1>🏈 NFL Live Tracker • Week ${WEEK}</h1></div>
  <div class="fresh" id="fresh" data-built="${builtIso}">${esc(builtLabel)}</div>
  <div class="kpis">
    <div class="kpi"><small>Cash risk</small><b>${usd(totals.risk)}</b></div>
    <div class="kpi"><small>Potential win</small><b class="blue">${usd(totals.toWin)}</b></div>
    <div class="kpi"><small>Total cashed</small><b class="green">${usd(settledCounts.cashedUsd)}</b></div>
  </div>
</div></div></div>

<main class="wrap">
  ${games.length ? `<div class="board-h"><span>📅 Game Board</span><span>${games.length} games · tap for ESPN</span></div>
  <nav class="games" aria-label="Games your open tickets depend on">${games.map(gameCard).join('')}</nav>` : ''}
  <div class="slips-h"><span class="dot" aria-hidden="true"></span><span>⚡ Live Active Slips (${open.length} Live)</span></div>
  <div class="list">
    ${open.length ? open.map((o) => ticketCard(o.t, o.graded, o.sum, evById)).join('\n') : '<div class="empty">No open tickets right now. Everything for this week has settled.</div>'}
  </div>
  ${paperSection(paper, evById)}
  <footer>
    <span>Real tickets are listed closest to cashing first. Week ${WEEK} so far: ${settledCounts.cashed} real tickets cashed, ${settledCounts.burnt} burnt (hidden). SuperContest is on the desktop tracker.</span>
    <span>Scores are as of the time shown up top. Tap a game for ESPN's live gamecast.</span>
  </footer>
</main>

<script>
(function () {
  var el = document.getElementById('fresh');
  var built = Date.parse(el.dataset.built);
  var label = el.textContent;
  function tick() {
    var m = Math.round((Date.now() - built) / 60000);
    el.textContent = label + (m < 1 ? ' · just now' : ' · ' + (m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min ago'));
    el.classList.toggle('stale', m >= 45);
  }
  tick(); setInterval(tick, 30000);
  var KEY = 'pr-mobile-open';
  var openSet = {};
  try { openSet = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { openSet = {}; }
  document.querySelectorAll('details.bet-card, details.paper-settled').forEach(function (d) {
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
// Paper (imaginary) AI card tickets: graded the same way, never in cash totals.
const paperAll = JSON.parse(await readFile(path.join(ROOT, 'data/official-picks/paper-wagers-2026.json'), 'utf8'))
  .filter((w) => Number(w.week) === WEEK && (w.legs || []).length && String(w.status).toUpperCase() === 'PENDING');
const paperGraded = [];
for (const t of paperAll) {
  const g = [];
  for (const leg of t.legs) g.push(await gradeLeg(leg, events));
  const sum = summarizeTicket(t, g);
  const stake = Number(t.stake_usd || 0);
  const pl = sum.kind === 'rr' ? sum.returnedUsd - stake : sum.state === 'cashed' ? Number(t.potential_profit_usd || 0) : -stake;
  paperGraded.push({ t, graded: g, sum, pl: +pl.toFixed(2) });
}
const byCloseness = (a, b) => {
  const la = a.graded.filter((g) => !g.locked).length; const lb = b.graded.filter((g) => !g.locked).length;
  return la - lb || (b.sum.kind === 'rr' ? b.sum.maxProfitUsd : b.t.potential_profit_usd || 0) - (a.sum.kind === 'rr' ? a.sum.maxProfitUsd : a.t.potential_profit_usd || 0);
};
const paperOpen = paperGraded.filter((o) => o.sum.state === 'open').sort(byCloseness);
const paper = {
  all: paperGraded, open: paperOpen,
  settled: paperGraded.filter((o) => o.sum.state !== 'open').sort((a, b) => b.pl - a.pl),
  risk: paperOpen.reduce((s, o) => s + Number(o.t.stake_usd || 0), 0),
  toWin: paperOpen.reduce((s, o) => s + Number(o.sum.kind === 'rr' ? o.sum.maxProfitUsd : o.t.potential_profit_usd || 0), 0),
};

const settledToday = weekTickets.filter((w) => String(w.status).toUpperCase() !== 'PENDING');
const settledCounts = {
  cashed: graded.filter((o) => o.sum.state === 'cashed').length + settledToday.filter((w) => /won|win|cash/i.test(String(w.result))).length,
  burnt: graded.filter((o) => o.sum.state === 'burnt').length + settledToday.filter((w) => /lost|loss/i.test(String(w.result))).length,
  cashedUsd: settledToday.filter((w) => /won|win|cash/i.test(String(w.result))).reduce((a, w) => a + Number(w.settled_payout_usd || 0), 0),
};
const totals = {
  risk: open.reduce((s, o) => s + Number(o.t.stake_usd || 0), 0),
  toWin: open.reduce((s, o) => s + Number(o.sum.kind === 'rr' ? o.sum.maxProfitUsd : o.t.potential_profit_usd || 0), 0),
};
const gameIds = new Set();
[...open, ...paperOpen].forEach((o) => o.graded.forEach((g) => { if (!g.locked && g.eventId) gameIds.add(g.eventId); }));
const stateRank = { in: 0, pre: 1, post: 2 };
const games = events.filter((e) => gameIds.has(e.id)).sort((a, b) => stateRank[a.state] - stateRank[b.state] || Date.parse(a.date) - Date.parse(b.date));

const builtAt = new Date();
const evById = new Map(events.map((e) => [e.id, e]));
await writeFile(OUT_HTML, page({ open, settledCounts, games, builtAt, totals, evById, paper }), 'utf8');
await writeFile(OUT_STATE, JSON.stringify({
  built_at: builtAt.toISOString(), week: WEEK,
  tickets: [...graded, ...paperGraded].map((o) => ({
    paper: !!o.t.is_paper, ticket_number: o.t.ticket_number || o.t.id, book: o.t.book, title: o.t.game_title, state: o.sum.state, summary: o.sum,
    legs: o.t.legs.map((l, i) => ({ leg_num: l.leg_num, selection: l.selection, game: l.game, ...o.graded[i] })),
  })),
}, null, 2), 'utf8');

console.log(`W${WEEK}: ${pending.length} pending tickets → ${open.length} open, ${graded.filter((o) => o.sum.state === 'cashed').length} now cashed, ${graded.filter((o) => o.sum.state === 'burnt').length} now burnt`);
for (const o of graded) {
  const flags = o.graded.filter((g) => g.status === 'CHECK').length;
  console.log(`  ${o.sum.state.padEnd(6)} ${o.t.ticket_number.padEnd(11)} ${JSON.stringify(o.sum.counts)}${flags ? '  CHECK×' + flags : ''}`);
}
console.log(`paper: ${paperAll.length} pending → ${paperOpen.length} open, ${paper.settled.length} decided (paper P&L ${paper.settled.reduce((a, o) => a + o.pl, 0).toFixed(2)})`);
for (const o of paperGraded) {
  const flags = o.graded.filter((g) => g.status === 'CHECK').map((g, i) => g.now);
  console.log(`  ${o.sum.state.padEnd(6)} ${String(o.t.id).slice(9, 60).padEnd(52)} ${JSON.stringify(o.sum.counts)}${flags.length ? '  CHECK: ' + flags.join(' | ') : ''}`);
}
console.log('wrote', path.relative(ROOT, OUT_HTML));
