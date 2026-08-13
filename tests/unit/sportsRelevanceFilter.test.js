import { describe, it, expect } from 'vitest';
import { isFootballOrCbbBettingIntel } from '../../agents/lib/sportsRelevanceFilter.js';

describe('sportsRelevanceFilter', () => {
  it('accepts NFL sharp betting tweets', () => {
    const tweet = 'Warren Sharp: KC Chiefs spread moved from -2.5 to -3.0 against BAL.';
    const res = isFootballOrCbbBettingIntel(tweet);
    expect(res.isRelevant).toBe(true);
    expect(res.sport).toBe('NFL');
  });

  it('accepts College Basketball March Madness betting tweets', () => {
    const tweet = 'March Madness CBB Kenpom rank: UConn -4.5 vs Duke in Final Four.';
    const res = isFootballOrCbbBettingIntel(tweet);
    expect(res.isRelevant).toBe(true);
    expect(res.sport).toBe('NCAA_CBB');
  });

  it('rejects crypto and non-sports tweets', () => {
    const tweet = 'Check out this new Bitcoin crypto NFT project launching today!';
    const res = isFootballOrCbbBettingIntel(tweet);
    expect(res.isRelevant).toBe(false);
  });
});
