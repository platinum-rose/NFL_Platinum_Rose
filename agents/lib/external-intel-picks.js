// Parses picks produced OUTSIDE the ingest agents (2026-09-19):
//  - Grok thread-capture CSVs  (data/vault-seed/manual/**/grok-*.csv; see docs/intel/GROK_THREAD_CAPTURE_PROMPT.md)
//  - Antigravity video notes   (data/vault-seed/manual/twitter-video-<id>.md; see docs/antigravity/TWITTER_VIDEO_QUEUE.md)
// into research_pick_signals-shaped rows keyed by tweet_url (the loader resolves note_id).

import { buildTextPickSignalRows } from './tweet-pick-signals.js';

export const EXTERNAL_COLUMNS = ['author', 'tweet_url', 'bet_type', 'team_or_market', 'market', 'selection', 'line', 'odds', 'rationale'];

// Minimal RFC-4180 CSV parser (quoted fields, embedded commas/quotes/newlines).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!header) return [];
  const cols = header.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? '').trim()])));
}

// Reads the "| Bet Type | Team/Mkt | Market | Selection | Line | Odds | Rationale |" table
// plus the **Author** / **Tweet URL** header of an Antigravity video note.
export function parseVideoNote(markdown) {
  const text = String(markdown);
  const author = (text.match(/\*\*Author:\*\*\s*@?([^\s]+)/) || [])[1] || null;
  const tweetUrl = (text.match(/\*\*Tweet URL:\*\*\s*(\S+)/) || [])[1] || null;
  const lines = text.split(/\r?\n/).filter((l) => l.trim().startsWith('|'));
  const out = [];
  for (const l of lines) {
    const cells = l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.length < 7 || /^bet type$/i.test(cells[0]) || /^:?-+/.test(cells[0])) continue;
    const [betType, team, market, selection, line, odds, ...rest] = cells;
    // "Over 76.5" -> selection OVER, line 76.5
    const ou = String(line).match(/^(over|under)\s*([\d.]+)/i);
    out.push({
      author, tweet_url: tweetUrl, bet_type: betType, team_or_market: selection || team,
      market: market && market !== betType ? market.replace(/_/g, ' ') : '',
      selection: ou ? ou[1].toUpperCase() : selection,
      line: ou ? ou[2] : line, odds, rationale: rest.join(' | '),
    });
  }
  return out;
}

const PLAYER_TYPES = new Set(['player_prop', 'anytime_td', 'first_td', 'trend']);

// Returns { rows, skipped } -- rows carry tweet_url instead of note_id.
export function toSignalRows(picks, { sourceLabel }) {
  const rows = [];
  const skipped = [];
  for (const p of picks) {
    const betType = String(p.bet_type || '').trim().toLowerCase();
    if (!betType || !p.tweet_url || !/\/status\/\d+/.test(p.tweet_url) || !p.team_or_market) {
      skipped.push({ reason: 'incomplete row', pick: p }); continue;
    }
    const noLine = !String(p.line || '').trim() && !String(p.odds || '').trim();
    if (PLAYER_TYPES.has(betType) && betType !== 'anytime_td' && betType !== 'first_td' && betType !== 'trend' && noLine && (!p.market || /best.?bet/i.test(p.market))) {
      skipped.push({ reason: 'player named with no market/line', pick: p }); continue;
    }
    const isTdMarket = betType === 'anytime_td' || betType === 'first_td' || /touchdown|\btd\b/i.test(p.market || '');
    if (PLAYER_TYPES.has(betType) && (betType !== 'trend' || isTdMarket) && /^[A-Z]{2,3}\s*@\s*[A-Z]{2,3}\b/.test(p.team_or_market)) {
      skipped.push({ reason: 'prop with no player named (game only)', pick: p }); continue;
    }
    // "100+" with line 100, "60+" with line 60: don't print the threshold twice.
    const lineStr = String(p.line ?? '').trim();
    const selStr = String(p.selection ?? '').trim();
    const dupLine = lineStr && selStr.replace(/\+$/, '') === lineStr.replace(/\+$/, '');
    const mapped = {
      is_author_pick: true,
      bet_type: betType === 'anytime_td' || betType === 'first_td' ? 'player_prop' : betType,
      team_or_market: p.team_or_market,
      market: betType === 'anytime_td' ? 'anytime TD' : betType === 'first_td' ? 'first TD' : p.market,
      selection: isTdMarket && (!selStr || selStr.toLowerCase() === String(p.team_or_market).toLowerCase()) ? 'YES'
        : betType === 'anytime_td' || betType === 'first_td' ? 'YES' : p.selection,
      line: dupLine || lineStr === '' ? null : (Number.isFinite(Number(lineStr)) ? Number(lineStr) : lineStr),
      odds: p.odds || null,
      rationale: p.rationale,
    };
    const [row] = buildTextPickSignalRows([mapped], { noteId: null, eventRef: p.tweet_url, sourceLabel, author: p.author });
    if (row) rows.push({ ...row, tweet_url: p.tweet_url });
  }
  return { rows, skipped };
}
