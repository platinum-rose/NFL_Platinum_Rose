/**
 * validate-wager-legs.mjs
 *
 * Guards the data that the Live Tracker grades against live ESPN stats.
 * The tracker only links a prop leg to a player's box score when the leg has
 * (a) a `player` name and (b) a specific `market` it can map to a stat
 * (touchdown, sacks, receptions, rec/rush/pass yards, carries, ...).
 * Legs missing either one stay "pre-game" forever and never flip to HIT/BURNT.
 * That bit us three times on 2026-10-18 (Godwin, Walker, burnt-ticket legs).
 *
 * Usage:
 *   import { validateWager, inferLegFields } from './lib/validate-wager-legs.mjs';
 *   CLI audit:  node scripts/check-wager-legs.mjs [--week 6] [--fix]
 */

// Markets that are about a team/game, not a player. These need no player name.
export const GAME_LINE_MARKETS = new Set([
  'total', 'spread', 'moneyline', 'ml', 'h2h', 'team_total', 'alternate_total_points',
  'alternate_spread', 'sgp_spread', 'sgp_total', 'sgp_moneyline', 'first_half_total',
  'first_half_spread', 'game_total', 'futures', 'future', 'outright', 'prediction', 'open_slot',
]);

// Generic buckets the tracker cannot map to a stat.
export const GENERIC_MARKETS = new Set(['player_prop', 'prop', 'selection', 'props', 'player', '']);

// selection text -> market. First match wins; order matters.
const MARKET_RULES = [
  [/first\s+(?:td|touchdown)|1st\s+td/i, 'first_td'],
  [/pass(?:ing)?\s+(?:td|touchdown)/i, 'pass_td'],
  [/pass(?:ing)?\s+(?:yd|yard)/i, 'pass_yds'],
  [/completion/i, 'completions'],
  [/interception/i, 'interceptions'],
  [/sack/i, 'sacks'],
  [/tackle/i, 'tackles_assists'],
  [/field goal/i, 'field_goals_made'],
  [/rush(?:ing)?\s+(?:attempt|att)|carries/i, 'carries'],
  [/rush(?:ing)?\s*\+\s*rec/i, 'rush_rec_yds'],
  [/rush(?:ing)?\s+(?:yd|yard)/i, 'rush_yds'],
  [/rec(?:eiving)?\s+(?:yd|yard)/i, 'rec_yds'],
  [/reception/i, 'receptions'],
  [/anytime\s+(?:td|touchdown)|\b1\+\s*(?:td|touchdown)|\bscore anytime\b|anytime td scorer/i, 'anytime_touchdown'],
];

const PLAYER_RE = /^(.+?)\s+(?:over\s|under\s|anytime\b|\d+\+|1st\b|first\b|to\s|score\b|will\b)/i;

/** Best-effort fill of `player` and `market` from the selection text. Mutates and returns leg. */
export function inferLegFields(leg) {
  const sel = String(leg.selection || '');
  const mk = String(leg.market || '').toLowerCase();
  if (GAME_LINE_MARKETS.has(mk)) return leg;
  if (!leg.player) {
    const m = PLAYER_RE.exec(sel);
    if (m) leg.player = m[1].replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
  }
  if (GENERIC_MARKETS.has(mk)) {
    for (const [re, market] of MARKET_RULES) {
      if (re.test(sel)) { leg.market = market; break; }
    }
  }
  return leg;
}

/** Returns an array of human-readable problems for one wager. Empty = clean. */
export function validateWager(wager) {
  const problems = [];
  const legs = Array.isArray(wager?.legs) ? wager.legs : [];
  for (const leg of legs) {
    const mk = String(leg.market || '').toLowerCase();
    if (GAME_LINE_MARKETS.has(mk)) continue;
    const tag = `leg ${leg.leg_num} "${leg.selection}"`;
    if (!leg.player) problems.push(`${tag}: missing player (tracker cannot link it to live stats)`);
    if (GENERIC_MARKETS.has(mk)) problems.push(`${tag}: generic market "${leg.market}" (use anytime_touchdown, sacks, receptions, rec_yds, rush_yds, carries, pass_td, ...)`);
    if (!leg.team) problems.push(`${tag}: missing team`);
  }
  return problems;
}

export function validateWagers(wagers, { skipSettled = false } = {}) {
  const out = [];
  for (const w of wagers) {
    if (skipSettled && w.status === 'SETTLED') continue;
    const problems = validateWager(w);
    if (problems.length) out.push({ id: w.id, ticket: w.ticket_number || null, problems });
  }
  return out;
}
