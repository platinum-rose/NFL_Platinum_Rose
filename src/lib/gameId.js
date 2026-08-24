// src/lib/gameId.js
//
// GAMEID-FORMAT (filed S296, 2026-07-21; see docs/NFL_AUDIT_BACKLOG.md's
// "Follow-ups filed from later sessions" section for the full writeup).
//
// Three incompatible `game_id` string formats describe the same games
// across this codebase, all live and actively written by GitHub Actions
// crons:
//
//   1. public.games.game_id
//      = nfl_{season}_{seasonType}_w{WW}_{AWAY}_at_{HOME}
//      (or ..._w{WW}_espn_{espnEventId} for a still-TBD matchup)
//      -- built by agents/schedule-ingest.js's makeGameId().
//
//   2. public.game_odds_snapshots.game_id / public.game_splits.game_id /
//      public.game_splits_history.game_id
//      = {season}_{WW}_{HOME}_{AWAY}   (HOME before AWAY, no seasonType)
//      -- built by packages/shared/src/week-utils.js's buildGameId(),
//      used by agents/game-odds-ingest.js and agents/betting-splits-ingest.js.
//
//   3. nflverse schedules.csv / team_stats.csv game_id
//      = {season}_{WW}_{AWAY}_{HOME}   (AWAY before HOME, no seasonType,
//      no "nfl_" prefix) -- and nflverse layers some historical/alternate
//      team codes on top (LA, STL, JAC, SD, OAK) that this app's standard
//      abbreviations don't use.
//
// Formats (2) and (3) are the *identical* string shape with opposite team
// order and no positional signal to tell them apart -- there is no safe
// way to auto-detect which one a bare string came from. Every function
// here that touches (2) or (3) therefore requires the caller to say which
// one it is; guessing wrong silently swaps home/away.
//
// This module is purely additive: it does not change any live table's
// game_id column, any ingest script's write path, or backfill anything.
// Every existing join in this codebase already routes around the format
// mismatch by matching on (season, week, home/away abbreviation) instead
// of trusting game_id strings -- this just gives that pattern one tested,
// shared home instead of every call site re-deriving its own parsing (as
// scripts/seed-game-context.py, agents/betting-splits-ingest.js, and
// agents/game-odds-ingest.js each already do independently today). This
// implements option (b) from the backlog's option analysis: a shared
// canonical-key helper for new code to point at, with zero risk to
// anything currently running.
//
// The canonical key this module produces (`canonicalGameKey()`) is a new
// derived value for safe in-memory joining/deduping across the three
// formats -- it is intentionally NOT any of the three real formats above,
// and is never written back to a table.

import { getTeamAbbreviation } from './teams.js';

export const GAME_ID_SOURCES = Object.freeze({
  GAMES_TABLE: 'games_table', // public.games
  ODDS_SPLITS: 'odds_splits', // game_odds_snapshots / game_splits / game_splits_history
  NFLVERSE: 'nflverse', // nflverse schedules.csv / team_stats.csv
});

export class GameIdParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameIdParseError';
  }
}

const GAMES_TABLE_RE =
  /^nfl_(\d{4})_(\d+)_w(\d{2})_(?:([A-Za-z]+)_at_([A-Za-z]+)|espn_(.+))$/;
const SIMPLE_RE = /^(\d{4})_(\d{2,3})_([A-Za-z]+)_([A-Za-z]+)$/;

function standardizeAbbr(raw) {
  if (!raw) return null;
  const std = getTeamAbbreviation(raw);
  if (!std) {
    throw new GameIdParseError(`Unrecognized team abbreviation: "${raw}"`);
  }
  return std;
}

/**
 * Parse a public.games.game_id string, e.g. "nfl_2026_2_w01_BUF_at_KC", or
 * the ESPN-event-id fallback used while a matchup is still TBD,
 * e.g. "nfl_2026_3_w19_espn_401547439".
 *
 * @param {string} gameId
 * @returns {{source: string, season: number, seasonType: number, week: number,
 *            homeAbbr: string|null, awayAbbr: string|null, espnEventId?: string,
 *            unresolved: boolean}}
 */
export function parseGamesTableId(gameId) {
  const m = GAMES_TABLE_RE.exec(String(gameId || ''));
  if (!m) {
    throw new GameIdParseError(`Not a recognized games-table game_id: "${gameId}"`);
  }
  const [, season, seasonType, week, away, home, espnEventId] = m;

  if (espnEventId) {
    // TBD matchup placeholder -- no team info to resolve yet.
    return {
      source: GAME_ID_SOURCES.GAMES_TABLE,
      season: Number(season),
      seasonType: Number(seasonType),
      week: Number(week),
      homeAbbr: null,
      awayAbbr: null,
      espnEventId,
      unresolved: true,
    };
  }

  return {
    source: GAME_ID_SOURCES.GAMES_TABLE,
    season: Number(season),
    seasonType: Number(seasonType),
    week: Number(week),
    homeAbbr: standardizeAbbr(home),
    awayAbbr: standardizeAbbr(away),
    unresolved: false,
  };
}

/**
 * Parse a game_odds_snapshots / game_splits / game_splits_history game_id,
 * e.g. "2026_01_KC_BUF" (HOME then AWAY). This format never carries
 * season_type in the string -- pass it in `opts.seasonType` if known from
 * context (e.g. the `games` row being joined against); otherwise it comes
 * back `null` and callers must not assume regular season (this ambiguity
 * is exactly what caused the real week-number collision seed-game-context.py
 * hit on its first production run -- see docs/NFL_AUDIT_BACKLOG.md).
 *
 * @param {string} gameId
 * @param {{seasonType?: number|null}} [opts]
 */
export function parseOddsSplitsId(gameId, { seasonType = null } = {}) {
  const m = SIMPLE_RE.exec(String(gameId || ''));
  if (!m) {
    throw new GameIdParseError(`Not a recognized odds/splits game_id: "${gameId}"`);
  }
  const [, season, week, home, away] = m;
  return {
    source: GAME_ID_SOURCES.ODDS_SPLITS,
    season: Number(season),
    seasonType,
    week: Number(week),
    homeAbbr: standardizeAbbr(home),
    awayAbbr: standardizeAbbr(away),
    unresolved: false,
  };
}

/**
 * Parse an nflverse schedules.csv / team_stats.csv game_id, e.g.
 * "2026_01_BUF_KC" (AWAY then HOME -- opposite order from (2)). May use
 * nflverse's historical/alternate team codes (LA, STL, JAC, SD, OAK),
 * which `getTeamAbbreviation()` resolves to this app's standard codes
 * (LAR, JAX, LAC, LV respectively). Also carries no season_type.
 *
 * @param {string} gameId
 * @param {{seasonType?: number|null}} [opts]
 */
export function parseNflverseId(gameId, { seasonType = null } = {}) {
  const m = SIMPLE_RE.exec(String(gameId || ''));
  if (!m) {
    throw new GameIdParseError(`Not a recognized nflverse game_id: "${gameId}"`);
  }
  const [, season, week, away, home] = m;
  return {
    source: GAME_ID_SOURCES.NFLVERSE,
    season: Number(season),
    seasonType,
    week: Number(week),
    homeAbbr: standardizeAbbr(home),
    awayAbbr: standardizeAbbr(away),
    unresolved: false,
  };
}

const PARSERS_BY_SOURCE = {
  [GAME_ID_SOURCES.GAMES_TABLE]: (id) => parseGamesTableId(id),
  [GAME_ID_SOURCES.ODDS_SPLITS]: (id, opts) => parseOddsSplitsId(id, opts),
  [GAME_ID_SOURCES.NFLVERSE]: (id, opts) => parseNflverseId(id, opts),
};

/**
 * Parse a game_id string given which of the 3 live formats it came from.
 * `source` is required (one of GAME_ID_SOURCES) -- see the module header
 * for why formats (2)/(3) can't be safely auto-detected.
 *
 * @param {string} gameId
 * @param {string} source - one of GAME_ID_SOURCES
 * @param {{seasonType?: number|null}} [opts]
 */
export function parseGameId(gameId, source, opts) {
  const parser = PARSERS_BY_SOURCE[source];
  if (!parser) {
    throw new GameIdParseError(
      `Unknown game_id source "${source}" -- expected one of: ${Object.values(GAME_ID_SOURCES).join(', ')}`,
    );
  }
  return parser(gameId, opts);
}

/**
 * Build the one canonical key this module standardizes all 3 formats onto.
 * This is an in-memory/application-layer join key only -- it is never
 * written to any table, and does not match any of the 3 real formats.
 *
 * `seasonType` defaults to 2 (regular season, this app's/ESPN's own
 * convention) since 2 of the 3 source formats don't carry it at all. Get
 * it wrong and games sharing a week number across season types (e.g. a
 * Week 18 game vs. a wild-card-round game) can collide -- pass the real
 * value whenever it's known from context.
 *
 * @param {{season: number, seasonType?: number, week: number, homeAbbr: string, awayAbbr: string}} game
 * @returns {string}
 */
export function canonicalGameKey({ season, seasonType = 2, week, homeAbbr, awayAbbr }) {
  if (season == null || week == null || !homeAbbr || !awayAbbr) {
    throw new GameIdParseError(
      'canonicalGameKey() requires season, week, homeAbbr, and awayAbbr',
    );
  }
  const home = standardizeAbbr(homeAbbr);
  const away = standardizeAbbr(awayAbbr);
  const ww = String(week).padStart(2, '0');
  return `${season}-t${seasonType}-w${ww}-${home}-${away}`;
}

/**
 * One-call convenience: parse a raw game_id of a known source format and
 * fold it straight into the canonical key. If `seasonType` isn't passed
 * and the source format doesn't carry one, defaults to 2 (regular season)
 * same as canonicalGameKey() -- pass it explicitly for playoff/preseason
 * games from formats (2)/(3).
 *
 * @param {string} gameId
 * @param {string} source - one of GAME_ID_SOURCES
 * @param {{seasonType?: number|null}} [opts]
 * @returns {string}
 */
export function canonicalGameKeyFromAny(gameId, source, { seasonType, ...rest } = {}) {
  const parsed = parseGameId(gameId, source, { seasonType, ...rest });
  if (parsed.unresolved) {
    throw new GameIdParseError(
      `Cannot build a canonical key for an unresolved TBD-matchup game_id: "${gameId}"`,
    );
  }
  return canonicalGameKey({
    season: parsed.season,
    seasonType: seasonType ?? parsed.seasonType ?? 2,
    week: parsed.week,
    homeAbbr: parsed.homeAbbr,
    awayAbbr: parsed.awayAbbr,
  });
}
