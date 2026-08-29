import { describe, it, expect } from 'vitest';
import { isNflBettingIntel } from '../../agents/lib/sportsRelevanceFilter.js';

// NFL-only scope confirmed 2026-08-28. The 2026-08-24 cleanup commit
// (958f499) silently narrowed this filter from "Football + CBB" to
// NFL-only without updating this test, the function's old name, or the
// surrounding twitter-bookmarks-agent.js fetch/routing code -- all
// reconciled in this pass. CBB content is now explicitly expected to be
// rejected, not routed anywhere.

describe('sportsRelevanceFilter', () => {
  it('accepts NFL sharp betting tweets', () => {
    const tweet = 'Warren Sharp: KC Chiefs spread moved from -2.5 to -3.0 against BAL.';
    const res = isNflBettingIntel(tweet);
    expect(res.isRelevant).toBe(true);
    expect(res.sport).toBe('NFL');
  });

  it('rejects College Basketball March Madness betting tweets (NFL-only scope)', () => {
    const tweet = 'March Madness CBB Kenpom rank: UConn -4.5 vs Duke in Final Four.';
    const res = isNflBettingIntel(tweet);
    expect(res.isRelevant).toBe(false);
    expect(res.sport).toBe(null);
  });

  it('rejects crypto and non-sports tweets', () => {
    const tweet = 'Check out this new Bitcoin crypto NFT project launching today!';
    const res = isNflBettingIntel(tweet);
    expect(res.isRelevant).toBe(false);
  });
});
