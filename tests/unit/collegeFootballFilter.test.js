import { describe, expect, it } from 'vitest';
import { isCollegeFootballItem } from '../../agents/lib/college-football-filter.js';

describe('isCollegeFootballItem', () => {
  // Real titles that leaked into research_intel_notes 9/21-9/23.
  it.each([
    'College Football Week 4 Picks: Best Early Bets (2026)',
    'College Football Picks &#038; Predictions: Week 4 (2026)',
    'College Football Player Props &#038; Bets: Week 4 (Saturday)',
    'Steve Makinen: Evaluating Current College Football Strength Ratings for Week 4',
    'College Football Week 4 Picks: Liberty vs. Coastal Carolina',
    'Expert College Football Picks: Week 4 best bets and predictions from Zachary Cohen',
    'Week 4 College Football Hub: Picks, Best Bets, and Previews',
    'Week 4 College Football Power Ratings and Projections for Every Game',
    'Heisman odds: who leads after Week 4',
    'CFB Week 5 lookahead lines',
  ])('rejects CFB title: %s', (title) => {
    expect(isCollegeFootballItem({ title, link: 'https://vsin.com/x/' })).toBe(true);
  });

  it('rejects by URL path when the title has no college term', () => {
    expect(isCollegeFootballItem({ title: 'Clemson vs. Cal predictions', link: 'https://vsin.com/college-football/clemson-vs-cal-picks/' })).toBe(true);
    expect(isCollegeFootballItem({ title: 'Saturday best bets', link: 'https://www.actionnetwork.com/ncaaf/saturday-best-bets' })).toBe(true);
  });

  it.each([
    ['NFL Week 3 Picks &#038; Predictions: Best Early Bets (2026)', 'https://www.bettingpros.com/articles/nfl-week-3-picks/'],
    ['2027 NFL Draft: Stock up, stock down after Week 3 of college football', 'https://www.pff.com/news/draft-stock'],
    ['Falcons vs. Packers Predictions: Week 3 Thursday Night Football odds, picks', 'https://vsin.com/nfl/falcons-vs-packers/'],
    ['Seven things Solak thinks entering NFL Week 3', 'https://www.espn.com/nfl/story/_/id/1'],
    ['Panthers vs. Browns Fantasy Football Worksheet, Week 3', 'https://www.sharpfootballanalysis.com/fantasy/panthers-browns/'],
    ['Week 3 NFL Odds & Picks', 'not a url'],
  ])('keeps NFL item: %s', (title, link) => {
    expect(isCollegeFootballItem({ title, link })).toBe(false);
  });
});
