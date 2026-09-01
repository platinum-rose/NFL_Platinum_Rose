import { describe, it, expect } from 'vitest';
import { isNflBettingIntel, isFantasyDraftMechanics } from '../../agents/lib/sportsRelevanceFilter.js';

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

// 2026-09-01: real bookmarks from the first live ingestion run shaped these
// cases -- both true positives and, importantly, near-miss false positives
// (an injury update and a camp-news post that each mention "ADP"/"draft" in
// passing but are NOT draft-mechanics content) that a naive "adp"/"draft"
// keyword match would have wrongly excluded from the betting committee.
describe('isFantasyDraftMechanics', () => {
  it('flags explicit pick-slot notation with draft-strategy framing', () => {
    expect(isFantasyDraftMechanics('1.11 AND 1.12 ARE SECRETLY THE BEST DRAFT SPOTS. Two elite Fantasy Football RBs are all yours.')).toBe(true);
  });

  it('flags bare pick-slot notation even without the word "draft"', () => {
    expect(isFantasyDraftMechanics("YOU'RE WASTING THE 1.01 OR 1.02 WITHOUT EVEN REALIZING IT. Here's the perfect strategy for every pick after that: Round 1...")).toBe(true);
  });

  it('flags "dominate your draft" ADP-vs-projection framing', () => {
    expect(isFantasyDraftMechanics('30 Fantasy Football Facts to help you DOMINATE your draft this year: 1. Derrick Henry (RB13 ADP) is projected to finish as RB6.')).toBe(true);
  });

  it('does NOT flag an injury update that happens to mention ADP in passing', () => {
    const tweet = '#NFL Injury Updates\n\n#Giants Malik Nabers - Lean playing Wk 1. Suspect ADP will rise in next 2 wks when he projects to return to contact drills';
    expect(isFantasyDraftMechanics(tweet)).toBe(false);
  });

  it('does NOT flag camp-usage news that mentions "fantasy drafts" in passing', () => {
    const tweet = '10 training camp updates you need to know... Bookmark this for your fantasy drafts (and bets). James Cook has been getting more targets in the passing game.';
    expect(isFantasyDraftMechanics(tweet)).toBe(false);
  });

  it('does NOT flag player-performance analytics with no draft framing', () => {
    expect(isFantasyDraftMechanics('Receiving first downs predict next-season fantasy football WR production (.729 correlation) better than almost any other stat.')).toBe(false);
  });
});
