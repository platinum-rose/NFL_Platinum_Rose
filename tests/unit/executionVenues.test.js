import { describe, expect, it } from 'vitest';
import {
  MARKET_CONTEXT_ONLY_VENUES,
  PLACEABLE_SPORTSBOOK_KEYS,
  PLACEABLE_SPORTSBOOK_LABELS,
  PREDICTION_MARKET_VENUES,
  SPORTSBOOK_VENUES,
  canonicalSportsbookKey,
  isPlaceableSportsbook,
  isPredictionMarketVenue,
  placeableVenuesPromptSentence,
  sportsbookAccessType,
} from '../../src/lib/executionVenues.js';

describe('canonical execution-venue registry', () => {
  it('recognizes all six sportsbooks Andy stated as currently usable execution venues', () => {
    const keys = SPORTSBOOK_VENUES.map((v) => v.key).sort();
    expect(keys).toEqual(['betmgm', 'betonline', 'betus', 'bookmaker', 'caesars', 'circa']);
  });

  it('marks direct-access books distinctly from proxy-access books', () => {
    expect(sportsbookAccessType('bookmaker')).toBe('direct');
    expect(sportsbookAccessType('betus')).toBe('direct');
    expect(sportsbookAccessType('betonline')).toBe('direct');
    expect(sportsbookAccessType('betmgm')).toBe('proxy');
    expect(sportsbookAccessType('caesars')).toBe('proxy');
    expect(sportsbookAccessType('circa')).toBe('proxy');
  });

  it('resolves aliases to a canonical key', () => {
    expect(canonicalSportsbookKey('MGM')).toBe('betmgm');
    expect(canonicalSportsbookKey('williamhill_us')).toBe('caesars');
    expect(canonicalSportsbookKey('WilliamHill')).toBe('caesars');
    expect(canonicalSportsbookKey('BKR')).toBe('bookmaker');
    expect(canonicalSportsbookKey('unknown_book')).toBeNull();
  });

  it('isPlaceableSportsbook is case/whitespace tolerant and rejects market-context-only books', () => {
    expect(isPlaceableSportsbook(' BetMGM ')).toBe(true);
    expect(isPlaceableSportsbook('betmgm')).toBe(true);
    expect(isPlaceableSportsbook('draftkings')).toBe(false);
    expect(isPlaceableSportsbook('fanduel')).toBe(false);
    expect(isPlaceableSportsbook('')).toBe(false);
    expect(isPlaceableSportsbook(undefined)).toBe(false);
  });

  it('PLACEABLE_SPORTSBOOK_KEYS Set and PLACEABLE_SPORTSBOOK_LABELS Map cover the same six books', () => {
    for (const venue of SPORTSBOOK_VENUES) {
      expect(PLACEABLE_SPORTSBOOK_KEYS.has(venue.key)).toBe(true);
      expect(PLACEABLE_SPORTSBOOK_LABELS.get(venue.key)).toBe(venue.label);
    }
    expect(PLACEABLE_SPORTSBOOK_LABELS.size).toBe(6);
  });

  it('keeps prediction-market venues and market-context-only books out of the sportsbook set', () => {
    expect(PLACEABLE_SPORTSBOOK_KEYS.has('kalshi')).toBe(false);
    expect(PLACEABLE_SPORTSBOOK_KEYS.has('polymarket')).toBe(false);
    expect(PLACEABLE_SPORTSBOOK_KEYS.has('draftkings')).toBe(false);
    expect(PLACEABLE_SPORTSBOOK_KEYS.has('fanduel')).toBe(false);
    expect(isPredictionMarketVenue('kalshi')).toBe(true);
    expect(isPredictionMarketVenue('polymarket')).toBe(true);
    expect(isPredictionMarketVenue('betmgm')).toBe(false);
  });

  it('generates a prompt sentence that mentions every sportsbook, both PM venues, and excludes DK/FD as placeable', () => {
    const sentence = placeableVenuesPromptSentence();
    for (const venue of SPORTSBOOK_VENUES) {
      expect(sentence).toContain(venue.label);
    }
    for (const pm of PREDICTION_MARKET_VENUES) {
      expect(sentence).toContain(pm.label);
    }
    for (const contextOnly of MARKET_CONTEXT_ONLY_VENUES) {
      expect(sentence).toContain(contextOnly.label);
    }
    expect(sentence.startsWith('PLACEABLE BOOKS ONLY:')).toBe(true);
  });
});
