// src/lib/steamMoveCorrelator.js
// ═══════════════════════════════════════════════════════════════════════════════
// Steam-move & reverse-line-movement (RLM) detector + catalyst correlator
// (ATLAS spec 2026-10-20 §1B).
//
// line_movements, game_splits(_history), player_injuries and x_sharp_tweets
// live in separate tables and were never time-aligned. This module:
//   1. flags STEAM moves (spread |Δ| ≥ 1.0 or a ≥0.5 move through a key
//      number; total |Δ| ≥ 1.5) inside a rolling window (default 120 min),
//   2. flags RLM (line moves toward the money side while the tickets are on
//      the other side, money-vs-ticket divergence ≥ 20 pts),
//   3. pulls injuries / sharp tweets / normalized signals for the two teams
//      inside [T_move − 90m, T_move + 90m] (injuries get a −180m lookback
//      because practice reports post before books react), scores them, and
//      writes a one-line causal hypothesis.
//
// Conventions (verified against agents/odds-ingest.js):
//   line_movements.type='spread' from_line/to_line are the HOME line
//   (negative = home favored). type='total' is the game total.
//   game_splits.spread_home_bettors / spread_home_money are % on HOME;
//   total_over_bettors / total_over_money are % on the OVER.
//
// Pure module — no Supabase / network / DOM.
// ═══════════════════════════════════════════════════════════════════════════════

import { NFL_TEAMS, getTeamAbbreviation } from './teams.js';

export const STEAM_SPREAD_PTS = 1.0;
export const STEAM_TOTAL_PTS = 1.5;
export const KEY_NUMBER_MIN_MOVE = 0.5;
export const SPREAD_KEY_NUMBERS = [3, 7, 6, 10, 14];
export const RLM_DIVERGENCE_PCT = 20;
export const DEFAULT_MOVE_WINDOW_MIN = 120;
export const DEFAULT_CORRELATION_WINDOW_MIN = 90;
export const INJURY_LOOKBACK_MIN = 180;

const MIN = 60 * 1000;

// ─── helpers ────────────────────────────────────────────────────────────────

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ms(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : null;
}

function iso(t) { return t == null ? null : new Date(t).toISOString(); }

export function teamAbbr(raw) {
  if (!raw) return null;
  const up = String(raw).trim().toUpperCase();
  if (up === 'WSH') return 'WAS';
  const a = getTeamAbbreviation(raw);
  return a ? String(a).toUpperCase() : null;
}

function teamRecord(abbr) {
  return Object.values(NFL_TEAMS).find(t => t.abbreviation === abbr) || null;
}

// Team codes that are real English words in ALL-CAPS tweet text ("NO INJURY
// DESIGNATION", "WAS ruled out", "LA traffic"). The plain-code matcher is
// case-sensitive, so lowercase words never matched anyway — only these three
// need betting context: #NO / @NO / vs NO / at NO, or "NO -3", "NO +7",
// "NO ML", "NO @ ATL", "NO/ATL". Codes like DAL, DEN, BUF match normally.
export const AMBIGUOUS_ABBRS = new Set(['NO', 'WAS', 'LA']);
// Cities shared by two teams — matching the bare city would cross-contaminate.
const SHARED_CITIES = new Set(['new york', 'los angeles', 'ny', 'la']);

/** Regex matchers for a team in free text (tweets/signals). */
export function teamTextMatchers(abbr) {
  const t = teamRecord(abbr);
  if (!t) return [];
  const words = [t.name, t.fullName, t.city, ...(t.aliases || []).filter(a => a.length >= 4)]
    .filter(Boolean)
    .filter(w => !SHARED_CITIES.has(String(w).toLowerCase().trim()))
    .map(w => String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const out = words.length ? [new RegExp(`\\b(${words.join('|')})\\b`, 'i')] : [];
  // Abbreviations only as whole uppercase tokens (avoid "NE" in "ONE").
  // 'LA' (a Rams alt code) is shared with the Chargers — never match it bare.
  const abbrs = [t.abbreviation, ...(t.altAbbreviations || [])].filter(a => a && a !== 'LA');
  const plain = abbrs.filter(a => !AMBIGUOUS_ABBRS.has(a));
  const tagged = abbrs.filter(a => AMBIGUOUS_ABBRS.has(a));
  if (plain.length) out.push(new RegExp(`(^|[^A-Za-z])(${plain.join('|')})([^A-Za-z]|$)`));
  if (tagged.length) {
    // Tagged / opponent forms: '#NO', '@NO', 'vs NO', 'VS NO', 'at NO', 'AT NO', 'ATL/NO'.
    out.push(new RegExp(`(?:[#@]\\s?|\\b(?:vs|VS|Vs)\\.?\\s+|\\b(?:at|AT)\\s+|\\b[A-Z]{2,3}\\/)(${tagged.join('|')})([^A-Za-z]|$)`));
    out.push(new RegExp(`(^|[^A-Za-z])(${tagged.join('|')})(?:\\s*[+-]\\d|\\s+(?:ML|@|vs\\.?|at)\\b|\\s*@|\\/[A-Z]{2,3}\\b)`));
  }
  return out;
}

function textMentions(text, matchers) {
  if (!text) return false;
  return matchers.some(re => re.test(text));
}

/** Normalize one line-movement row from any of the shapes in the codebase. */
function normalizeMove(row) {
  const r = row || {};
  const market = String(r.type || r.market || (r.old_total != null || r.new_total != null ? 'total' : 'spread')).toLowerCase();
  const from = num(r.from_line ?? r.from ?? (market === 'total' ? r.old_total : r.old_spread));
  const to = num(r.to_line ?? r.to ?? (market === 'total' ? r.new_total : r.new_spread));
  const t = ms(r.detected_at ?? r.timestamp ?? r.captured_at ?? r.created_at);
  return {
    market: market.startsWith('total') ? 'total' : market.startsWith('money') || market === 'h2h' ? 'moneyline' : 'spread',
    from, to, t,
    book: r.book || r.bookmaker || 'consensus',
    home_team: r.home_team ?? null,
    away_team: r.away_team ?? null,
    raw: row,
  };
}

/** Did a spread move through a key number? Returns the key number or null. */
export function crossedKeyNumber(fromLine, toLine, keys = SPREAD_KEY_NUMBERS) {
  const f = num(fromLine); const t = num(toLine);
  if (f == null || t == null) return null;
  if (Math.abs(t - f) < KEY_NUMBER_MIN_MOVE) return null;
  // Only meaningful when the favorite doesn't flip (same side of 0, or touching it).
  if (f * t < 0) return null;
  const lo = Math.min(Math.abs(f), Math.abs(t));
  const hi = Math.max(Math.abs(f), Math.abs(t));
  for (const k of keys) {
    if ((lo < k && hi >= k) || (lo <= k && hi > k)) return k;
  }
  return null;
}

function fmtSpread(teamCode, line) {
  if (line == null) return `${teamCode} ?`;
  if (line === 0) return `${teamCode} PK`;
  return `${teamCode} ${line > 0 ? '+' : ''}${line}`;
}

/** Splits snapshot nearest at/before t (falls back to nearest within 6h after). */
function splitsAt(splitsHistory, t) {
  if (!Array.isArray(splitsHistory) || !splitsHistory.length || t == null) return null;
  let before = null; let after = null;
  for (const s of splitsHistory) {
    const st = ms(s.captured_at ?? s.updated_at ?? s.timestamp);
    if (st == null) continue;
    if (st <= t && (!before || st > before._t)) before = { ...s, _t: st };
    if (st > t && st - t <= 6 * 60 * MIN && (!after || st < after._t)) after = { ...s, _t: st };
  }
  return before || after;
}

function readSplits(snap, market) {
  if (!snap) return null;
  // Accept both the DB columns and the prompt-style *_Bets_pct / *_Handle_pct names.
  if (market === 'total') {
    const tickets = num(snap.total_over_bettors ?? snap.total_Bets_pct ?? snap.over_bets_pct);
    const money = num(snap.total_over_money ?? snap.total_Handle_pct ?? snap.over_handle_pct);
    return tickets == null || money == null ? null : { tickets, money, side: 'over' };
  }
  const tickets = num(snap.spread_home_bettors ?? snap.spread_Bets_pct ?? snap.home_bets_pct);
  const money = num(snap.spread_home_money ?? snap.spread_Handle_pct ?? snap.home_handle_pct);
  return tickets == null || money == null ? null : { tickets, money, side: 'home' };
}

// ─── 1. detection ───────────────────────────────────────────────────────────

/**
 * @param {Array} lineHistory   line_movements rows (raw DB or getLineMovementsDB shape)
 * @param {Array} splitsHistory game_splits_history / game_splits rows for the game
 * @param {{ windowMinutes?: number, homeTeam?: string, awayTeam?: string }} options
 * @returns {Array} move events sorted by time
 */
export function detectSteamAndReverseLineMoves(lineHistory = [], splitsHistory = [], options = {}) {
  const windowMs = (options.windowMinutes ?? (options.windowHours != null ? options.windowHours * 60 : DEFAULT_MOVE_WINDOW_MIN)) * MIN;
  const moves = (Array.isArray(lineHistory) ? lineHistory : [])
    .map(normalizeMove)
    .filter(m => m.t != null && m.from != null && m.to != null && m.market !== 'moneyline')
    .sort((a, b) => a.t - b.t);

  // Group per (market, book) so a book's sequence of small ticks can add up.
  const series = new Map();
  for (const m of moves) {
    const k = `${m.market}|${m.book}`;
    if (!series.has(k)) series.set(k, []);
    series.get(k).push(m);
  }

  const events = [];
  for (const list of series.values()) {
    let start = 0;
    for (let i = 0; i < list.length; i++) {
      while (start < i && list[i].t - list[start].t > windowMs) start++;
      const first = list[start];
      const last = list[i];
      const lineBefore = first.from;
      const lineAfter = last.to;
      const delta = +(lineAfter - lineBefore).toFixed(2);
      if (delta === 0) continue;
      const market = last.market;
      const key = market === 'spread' ? crossedKeyNumber(lineBefore, lineAfter) : null;
      const steam = market === 'spread' ? Math.abs(delta) >= STEAM_SPREAD_PTS : Math.abs(delta) >= STEAM_TOTAL_PTS;

      // RLM — compare the move direction to tickets vs money at move time.
      const split = readSplits(splitsAt(splitsHistory, last.t), market);
      let rlm = false;
      let splitsSnapshot = null;
      if (split) {
        // Spread: delta < 0 → home got more favored → money toward HOME.
        // Total:  delta > 0 → total went up → money toward OVER.
        const towardPrimary = market === 'spread' ? delta < 0 : delta > 0;
        const ticketPct = towardPrimary ? split.tickets : 100 - split.tickets;
        const moneyPct = towardPrimary ? split.money : 100 - split.money;
        const divergence = +(moneyPct - ticketPct).toFixed(1);
        rlm = ticketPct < 50 && divergence >= RLM_DIVERGENCE_PCT;
        splitsSnapshot = {
          move_side: market === 'spread' ? (towardPrimary ? 'home' : 'away') : (towardPrimary ? 'over' : 'under'),
          ticket_pct: ticketPct,
          money_pct: moneyPct,
          divergence,
          public_side_ticket_pct: 100 - ticketPct,
        };
      }

      if (!steam && key == null && !rlm) continue;

      const flags = [];
      if (steam) flags.push('STEAM');
      if (key != null) flags.push('KEY_NUMBER_CROSS');
      if (rlm) flags.push('REVERSE_LINE_MOVEMENT');
      const moveType = rlm ? 'REVERSE_LINE_MOVEMENT' : steam ? 'STEAM' : 'KEY_NUMBER_CROSS';

      events.push({
        move_type: moveType,
        flags,
        market,
        book: last.book,
        line_before: lineBefore,
        line_after: lineAfter,
        delta,
        crossed_key_number: key,
        started_at: iso(first.t),
        detected_at: iso(last.t),
        _t: last.t,
        splits_snapshot: splitsSnapshot,
        home_team: last.home_team ?? options.homeTeam ?? null,
        away_team: last.away_team ?? options.awayTeam ?? null,
      });
      start = i + 1; // reset the window so one move isn't re-emitted on every tick
    }
  }

  return mergeConfirmingBooks(events);
}


/**
 * Collapse same-direction events (same market) from different books within
 * 30 min into one event with confirming_books (multi-book agreement = real
 * steam). Keeps the largest move, unions flags, and never lets a confirming
 * book without a splits snapshot wipe one we already have.
 */
export function mergeConfirmingBooks(events = []) {
  const timed = events
    .map(e => ({ ...e, _t: e._t ?? Date.parse(e.detected_at) }))
    .sort((a, b) => a._t - b._t);
  const merged = [];
  for (const e of timed) {
    const prev = merged.find(p => p.market === e.market && Math.sign(p.delta) === Math.sign(e.delta) && Math.abs(p._t - e._t) <= 30 * MIN);
    if (prev) {
      if (!prev.confirming_books.includes(e.book)) prev.confirming_books.push(e.book);
      if (Math.abs(e.delta) > Math.abs(prev.delta)) {
        Object.assign(prev, {
          ...e,
          confirming_books: prev.confirming_books,
          flags: [...new Set([...prev.flags, ...e.flags])],
          // A confirming book without splits / a key-number cross must not
          // wipe what the first book already established.
          splits_snapshot: e.splits_snapshot || prev.splits_snapshot,
          crossed_key_number: e.crossed_key_number ?? prev.crossed_key_number,
        });
      } else {
        prev.flags = [...new Set([...prev.flags, ...e.flags])];
        if (!prev.splits_snapshot && e.splits_snapshot) prev.splits_snapshot = e.splits_snapshot;
        if (prev.crossed_key_number == null && e.crossed_key_number != null) prev.crossed_key_number = e.crossed_key_number;
      }
      if (prev.flags.includes('REVERSE_LINE_MOVEMENT')) prev.move_type = 'REVERSE_LINE_MOVEMENT';
      else if (prev.flags.includes('STEAM')) prev.move_type = 'STEAM';
    } else {
      merged.push({ ...e, confirming_books: [e.book] });
    }
  }
  return merged;
}

// ─── 2. correlation ─────────────────────────────────────────────────────────

const POS_WEIGHT = { QB: 1.0, LT: 0.8, OT: 0.7, T: 0.7, WR: 0.7, EDGE: 0.7, DE: 0.7, CB: 0.65, RB: 0.6, TE: 0.6, S: 0.5, LB: 0.5, DT: 0.5, G: 0.45, C: 0.45, K: 0.3, P: 0.2 };
const STATUS_WEIGHT = { OUT: 1.0, IR: 1.0, DOUBTFUL: 0.85, PUP: 0.8, QUESTIONABLE: 0.6, PROBABLE: 0.2, ACTIVE: 0.1 };
const TIER_WEIGHT = { sharp: 1.0, analyst: 0.85, media: 0.75, creator: 0.55 };

function proximity(offsetMin, windowMin) {
  return Math.max(0, 1 - Math.abs(offsetMin) / Math.max(1, windowMin));
}

/**
 * Time-correlate catalysts with one move.
 * @param {object} moveEvent  output of detectSteamAndReverseLineMoves (needs detected_at + teams)
 * @param {{ injuries?: Array, sharpTweets?: Array, normalizedSignals?: Array }} data
 * @param {number} windowMinutes
 */
export function correlateMoveCatalysts(moveEvent, { injuries = [], sharpTweets = [], normalizedSignals = [] } = {}, windowMinutes = DEFAULT_CORRELATION_WINDOW_MIN) {
  const t = ms(moveEvent?.detected_at ?? moveEvent?.timestamp);
  if (t == null) return [];
  const teams = [teamAbbr(moveEvent.home_team), teamAbbr(moveEvent.away_team)].filter(Boolean);
  const matchers = teams.flatMap(teamTextMatchers);
  const out = [];

  for (const inj of injuries || []) {
    const it = ms(inj.reported_at ?? inj.captured_at ?? inj.timestamp);
    if (it == null) continue;
    const team = teamAbbr(inj.team_abbr ?? inj.team);
    if (!team || !teams.includes(team)) continue;
    const offset = (it - t) / MIN;
    if (offset < -Math.max(windowMinutes, INJURY_LOOKBACK_MIN) || offset > windowMinutes) continue;
    const pos = String(inj.position || '').toUpperCase();
    const status = String(inj.injury_status || inj.status || '').toUpperCase();
    const score = proximity(offset, offset < 0 ? Math.max(windowMinutes, INJURY_LOOKBACK_MIN) : windowMinutes)
      * (POS_WEIGHT[pos] ?? 0.4) * (STATUS_WEIGHT[status] ?? 0.5) * (offset <= 0 ? 1 : 0.7);
    out.push({
      source: 'injury',
      timestamp: iso(it),
      offset_minutes: Math.round(offset),
      team,
      player: inj.player_name ?? inj.player ?? null,
      position: pos || null,
      status: status || null,
      summary: `${team} ${pos ? pos + ' ' : ''}${inj.player_name ?? inj.player ?? 'player'} — ${inj.injury_status ?? inj.status ?? 'status change'}${inj.injury_type ? ` (${inj.injury_type})` : ''}`,
      relevance_score: +score.toFixed(3),
    });
  }

  for (const tw of sharpTweets || []) {
    const tt = ms(tw.published_at ?? tw.captured_at ?? tw.timestamp);
    if (tt == null) continue;
    const offset = (tt - t) / MIN;
    if (Math.abs(offset) > windowMinutes) continue;
    if (!textMentions(tw.text, matchers)) continue;
    const tier = String(tw.author_tier || 'sharp').toLowerCase();
    const score = proximity(offset, windowMinutes) * (TIER_WEIGHT[tier] ?? 0.6) * (offset <= 0 ? 1 : 0.6);
    out.push({
      source: 'sharp_tweet',
      timestamp: iso(tt),
      offset_minutes: Math.round(offset),
      author: tw.author_handle ? `@${tw.author_handle}` : null,
      author_tier: tier,
      url: tw.tweet_url ?? null,
      summary: String(tw.text || '').replace(/\s+/g, ' ').slice(0, 220),
      relevance_score: +score.toFixed(3),
    });
  }

  for (const sig of normalizedSignals || []) {
    const st = ms(sig.published_at ?? sig.created_at ?? sig.captured_at ?? sig.timestamp);
    if (st == null) continue;
    const offset = (st - t) / MIN;
    if (Math.abs(offset) > windowMinutes) continue;
    const sigTeam = teamAbbr(sig.team ?? sig.team_abbr);
    if (sigTeam ? !teams.includes(sigTeam) : !textMentions(`${sig.summary || sig.rationale || ''} ${sig.text || sig.raw_text || ''}`, matchers)) continue;
    const score = proximity(offset, windowMinutes) * 0.5 * (offset <= 0 ? 1 : 0.6);
    out.push({
      source: 'signal',
      timestamp: iso(st),
      offset_minutes: Math.round(offset),
      team: sigTeam,
      summary: String(sig.summary || sig.rationale || sig.text || sig.raw_text || sig.signal_type || 'signal').slice(0, 220),
      relevance_score: +score.toFixed(3),
    });
  }

  return out.sort((a, b) => b.relevance_score - a.relevance_score);
}

// ─── 3. hypothesis ──────────────────────────────────────────────────────────

export function buildCausalHypothesis(ev, catalysts = []) {
  const home = teamAbbr(ev.home_team) || 'HOME';
  const away = teamAbbr(ev.away_team) || 'AWAY';
  let line;
  if (ev.market === 'spread') {
    // Show from the favorite's perspective after the move.
    const fav = ev.line_after <= 0 ? home : away;
    const sign = ev.line_after <= 0 ? 1 : -1;
    line = `Spread moved from ${fmtSpread(fav, ev.line_before * sign)} to ${fmtSpread(fav, ev.line_after * sign)}`;
    if (ev.crossed_key_number != null) line += ` (through key number ${ev.crossed_key_number})`;
  } else {
    line = `Total moved from ${ev.line_before} to ${ev.line_after} (${ev.delta > 0 ? '+' : ''}${ev.delta})`;
  }
  const parts = [line];
  if (ev.confirming_books?.length > 1) parts.push(`across ${ev.confirming_books.length} books`);

  const top = catalysts[0];
  if (top) {
    // offset_minutes = catalyst time − move time. Phrase it from the
    // catalyst's side so "after" always means the catalyst came after the move.
    const mins = Math.abs(top.offset_minutes);
    const timing = top.offset_minutes > 0 ? `${mins} min after the move` : `${mins} min before the move`;
    const what = top.source === 'injury' ? `${top.status || 'injury'} report: ${top.summary}`
      : top.source === 'sharp_tweet' ? `sharp post by ${top.author || 'tracked account'}: "${top.summary.slice(0, 90)}${top.summary.length > 90 ? '…' : ''}"`
      : `signal: ${top.summary}`;
    parts.push(`likely catalyst (${timing}) — ${what}${top.offset_minutes > 0 ? ' (posted after the move; may be a reaction, not the cause)' : ''}`);
  } else {
    parts.push('no injury news or sharp posts found within the correlation window — likely pure market/syndicate money');
  }
  const s = ev.splits_snapshot;
  if (s) {
    parts.push(`${s.money_pct}% of money vs ${s.ticket_pct}% of tickets on the ${s.move_side} side${ev.flags?.includes('REVERSE_LINE_MOVEMENT') ? ' (reverse line movement)' : ''}`);
  }
  return parts.join('; ') + '.';
}

// ─── 4. one-call API ────────────────────────────────────────────────────────

/**
 * Detect steam/RLM for one game and attach correlated catalysts.
 *
 * @returns {Array<{ moveType, delta, timestamp, windowStart, windowEnd,
 *   correlatedInjuries, correlatedTweets, correlatedSignals, causalHypothesis,
 *   ...SteamMoveAttribution }>}
 */
export function detectAndCorrelateSteamMoves({
  gameId = null,
  homeTeam = null,
  awayTeam = null,
  lineMovements = [],
  bettingSplits = [],
  playerInjuries = [],
  sharpTweets = [],
  normalizedSignals = [],
  windowMinutes = DEFAULT_MOVE_WINDOW_MIN,
  correlationWindowMinutes = DEFAULT_CORRELATION_WINDOW_MIN,
} = {}) {
  const events = detectSteamAndReverseLineMoves(lineMovements, bettingSplits, { windowMinutes, homeTeam, awayTeam });
  return events.map(ev => {
    const evTeams = { ...ev, home_team: ev.home_team ?? homeTeam, away_team: ev.away_team ?? awayTeam };
    const catalysts = correlateMoveCatalysts(evTeams, { injuries: playerInjuries, sharpTweets, normalizedSignals }, correlationWindowMinutes);
    const t = ev._t;
    const home = teamAbbr(evTeams.home_team) || evTeams.home_team;
    const away = teamAbbr(evTeams.away_team) || evTeams.away_team;
    const hypothesis = buildCausalHypothesis(evTeams, catalysts);
    const { _t, ...rest } = ev;
    return {
      // prompt-style fields
      moveType: ev.move_type,
      delta: ev.delta,
      timestamp: ev.detected_at,
      windowStart: iso(t - correlationWindowMinutes * MIN),
      windowEnd: iso(t + correlationWindowMinutes * MIN),
      correlatedInjuries: catalysts.filter(c => c.source === 'injury'),
      correlatedTweets: catalysts.filter(c => c.source === 'sharp_tweet'),
      correlatedSignals: catalysts.filter(c => c.source === 'signal'),
      causalHypothesis: hypothesis,
      // spec SteamMoveAttribution fields
      ...rest,
      game_id: gameId,
      matchup: `${away} @ ${home}`,
      home_team: home,
      away_team: away,
      correlated_catalysts: catalysts,
      causal_hypothesis: hypothesis,
    };
  });
}

/** Compact one-liner for UI pills. */
export function summarizeSteamAlert(attr) {
  if (!attr) return null;
  const label = attr.moveType === 'REVERSE_LINE_MOVEMENT' ? 'RLM' : attr.moveType === 'KEY_NUMBER_CROSS' ? 'Key #' : 'Steam';
  const top = attr.correlated_catalysts?.[0];
  return {
    label,
    market: attr.market,
    move: `${attr.line_before} → ${attr.line_after}`,
    detail: top ? top.summary : 'No news in window — market-driven',
    when: attr.timestamp,
  };
}
