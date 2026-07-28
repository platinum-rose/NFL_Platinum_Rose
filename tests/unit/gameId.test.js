// tests/unit/gameId.test.js
import { describe, it, expect } from 'vitest';
import {
  GAME_ID_SOURCES,
  GameIdParseError,
  parseGamesTableId,
  parseOddsSplitsId,
  parseNflverseId,
  parseGameId,
  canonicalGameKey,
  canonicalGameKeyFromAny,
} from '../../src/lib/gameId.js';

describe('gameId — parsing each of the 3 live formats', () => {
  it('parses a public.games.game_id string', () => {
    const parsed = parseGamesTableId('nfl_2026_2_w01_BUF_at_KC');
    expect(parsed).toMatchObject({
      source: GAME_ID_SOURCES.GAMES_TABLE,
      season: 2026,
      seasonType: 2,
      week: 1,
      homeAbbr: 'KC',
      awayAbbr: 'BUF',
      unresolved: false,
    });
  });

  it('parses the ESPN-event-id fallback used for still-TBD matchups', () => {
    const parsed = parseGamesTableId('nfl_2026_3_w19_espn_401547439');
    expect(parsed.unresolved).toBe(true);
    expect(parsed.espnEventId).toBe('401547439');
    expect(parsed.season).toBe(2026);
    expect(parsed.seasonType).toBe(3);
    expect(parsed.week).toBe(19);
    expect(parsed.homeAbbr).toBeNull();
    expect(parsed.awayAbbr).toBeNull();
  });

  it('parses a game_odds_snapshots/game_splits game_id (HOME then AWAY, no seasonType)', () => {
    const parsed = parseOddsSplitsId('2026_01_KC_BUF');
    expect(parsed).toMatchObject({
      source: GAME_ID_SOURCES.ODDS_SPLITS,
      season: 2026,
      seasonType: null,
      week: 1,
      homeAbbr: 'KC',
      awayAbbr: 'BUF',
      unresolved: false,
    });
  });

  it('accepts an explicit seasonType override for odds/splits ids', () => {
    const parsed = parseOddsSplitsId('2026_01_KC_BUF', { seasonType: 3 });
    expect(parsed.seasonType).toBe(3);
  });

  it('parses an nflverse game_id (AWAY then HOME -- opposite order from format 2)', () => {
    const parsed = parseNflverseId('2026_01_BUF_KC');
    expect(parsed).toMatchObject({
      source: GAME_ID_SOURCES.NFLVERSE,
      season: 2026,
      week: 1,
      homeAbbr: 'KC',
      awayAbbr: 'BUF',
      unresolved: false,
    });
  });

  it('normalizes all 4 of nflverse\'s documented alternate team codes', () => {
    expect(parseNflverseId('2026_01_SD_KC').awayAbbr).toBe('LAC'); // San Diego -> Chargers
    expect(parseNflverseId('2026_01_OAK_KC').awayAbbr).toBe('LV'); // Oakland -> Raiders
    expect(parseNflverseId('2026_01_LA_KC').awayAbbr).toBe('LAR'); // LA (Rams' nflverse code) -> Rams
    expect(parseNflverseId('2026_01_JAC_KC').awayAbbr).toBe('JAX'); // Jacksonville alt code
  });

  it('parseGameId() dispatches to the right parser by source', () => {
    expect(parseGameId('nfl_2026_2_w01_BUF_at_KC', GAME_ID_SOURCES.GAMES_TABLE).homeAbbr).toBe('KC');
    expect(parseGameId('2026_01_KC_BUF', GAME_ID_SOURCES.ODDS_SPLITS).homeAbbr).toBe('KC');
    expect(parseGameId('2026_01_BUF_KC', GAME_ID_SOURCES.NFLVERSE).homeAbbr).toBe('KC');
  });

  it('rejects malformed strings and unknown sources', () => {
    expect(() => parseGamesTableId('not_a_game_id')).toThrow(GameIdParseError);
    expect(() => parseOddsSplitsId('garbage')).toThrow(GameIdParseError);
    expect(() => parseNflverseId('garbage')).toThrow(GameIdParseError);
    expect(() => parseGameId('2026_01_KC_BUF', 'not_a_real_source')).toThrow(GameIdParseError);
  });

  it('rejects an unrecognized team abbreviation rather than silently passing it through', () => {
    expect(() => parseOddsSplitsId('2026_01_ZZZ_BUF')).toThrow(GameIdParseError);
  });
});

describe('gameId — canonical key (the actual fix)', () => {
  it('builds a canonical key from a structured game object', () => {
    const key = canonicalGameKey({ season: 2026, seasonType: 2, week: 1, homeAbbr: 'KC', awayAbbr: 'BUF' });
    expect(key).toBe('2026-t2-w01-KC-BUF');
  });

  it('defaults seasonType to 2 (regular season) when omitted', () => {
    const key = canonicalGameKey({ season: 2026, week: 1, homeAbbr: 'KC', awayAbbr: 'BUF' });
    expect(key).toBe('2026-t2-w01-KC-BUF');
  });

  it('requires season/week/homeAbbr/awayAbbr', () => {
    expect(() => canonicalGameKey({ season: 2026, week: 1, homeAbbr: 'KC' })).toThrow(GameIdParseError);
  });

  // The core proof this module exists for: the same real game, described by
  // all 3 live formats, must collapse onto one identical canonical key.
  it('collapses all 3 real formats for the same game to the identical canonical key', () => {
    const fromGamesTable = canonicalGameKeyFromAny(
      'nfl_2026_2_w01_BUF_at_KC',
      GAME_ID_SOURCES.GAMES_TABLE,
    );
    const fromOddsSplits = canonicalGameKeyFromAny(
      '2026_01_KC_BUF',
      GAME_ID_SOURCES.ODDS_SPLITS,
      { seasonType: 2 },
    );
    const fromNflverse = canonicalGameKeyFromAny(
      '2026_01_BUF_KC',
      GAME_ID_SOURCES.NFLVERSE,
      { seasonType: 2 },
    );

    expect(fromGamesTable).toBe('2026-t2-w01-KC-BUF');
    expect(fromOddsSplits).toBe(fromGamesTable);
    expect(fromNflverse).toBe(fromGamesTable);
  });

  it('collapses an nflverse alt-code id to the same key as the standard-code equivalent', () => {
    const standard = canonicalGameKeyFromAny('2026_01_KC_LAC', GAME_ID_SOURCES.ODDS_SPLITS, { seasonType: 2 });
    const altCode = canonicalGameKeyFromAny('2026_01_SD_KC', GAME_ID_SOURCES.NFLVERSE, { seasonType: 2 });
    expect(altCode).toBe(standard);
  });

  it('a different seasonType for the same season/week/teams produces a different key (guards the real week-number collision bug)', () => {
    const regularSeason = canonicalGameKeyFromAny('2026_18_KC_BUF', GAME_ID_SOURCES.ODDS_SPLITS, { seasonType: 2 });
    const postseason = canonicalGameKeyFromAny('2026_18_KC_BUF', GAME_ID_SOURCES.ODDS_SPLITS, { seasonType: 3 });
    expect(regularSeason).not.toBe(postseason);
  });

  it('refuses to build a canonical key for an unresolved TBD-matchup game_id', () => {
    expect(() =>
      canonicalGameKeyFromAny('nfl_2026_3_w19_espn_401547439', GAME_ID_SOURCES.GAMES_TABLE),
    ).toThrow(GameIdParseError);
  });
});
