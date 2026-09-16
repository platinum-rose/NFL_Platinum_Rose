import { describe, expect, it } from 'vitest';
import {
  calculateParlayOdds,
  extractCuratedPlayerProps,
  buildCuratedParlayCards,
  renderMarkdown,
  renderHtml,
} from '../../scripts/build-player-props-intel.js';

describe('player props intelligence and parlay builder', () => {
  it('accurately computes two-leg and three-leg parlay odds from American prices', () => {
    // Standard -110 & -110 two-leg parlay is +264
    const standardTwoLeg = calculateParlayOdds(['-110', '-110']);
    expect(standardTwoLeg.american).toBe('+264');
    expect(standardTwoLeg.decimal).toBeCloseTo(3.645, 2);

    // Three-leg parlay: -113, +121, +148
    const threeLeg = calculateParlayOdds(['-113', '+121', '+148']);
    // -113: 1.88496, +121: 2.21, +148: 2.48 -> 1.88496 * 2.21 * 2.48 = ~10.33 -> ~+933
    expect(threeLeg.decimal).toBeGreaterThan(9.0);
    expect(threeLeg.american).toMatch(/^\+\d{3,4}$/);
  });

  it('extracts curated player props from mock articles with accurate categorizations', () => {
    const mockArticles = [
      {
        id: 3118,
        author: 'Travis Pulver',
        source: 'BettingPros',
        title: 'NFL Player Props & Bets: Patriots vs. Seahawks',
        body: 'Jadarian Price Over 1.5 Receptions (+124)... Sam Darnold 10+ Rushing Yards (+178)... Hunter Henry Over 3.5 Receptions (+148)',
      },
      {
        id: 3119,
        author: 'Mike Spector',
        source: 'BettingPros',
        title: 'NFL Thursday Night Football TD Scorers Picks: 49ers vs. Rams',
        body: 'Puka Nacua First Touchdown Scorer (+800)... Mike Evans Anytime Touchdown (+175)... Terrance Ferguson Anytime Touchdown (+400)',
      },
      {
        id: 3087,
        author: 'Adam Burke',
        source: 'VSiN',
        title: 'NFL First Touchdown Scorer Predictions for Week 1',
        body: 'Cleveland Browns: Harold Fannin (+1700)... Buffalo Bills: James Cook (+550)... Indianapolis Colts: Jonathan Taylor (+400)',
      },
    ];

    const props = extractCuratedPlayerProps(mockArticles);
    expect(props.length).toBeGreaterThanOrEqual(8);

    const priceProp = props.find((p) => p.player === 'Jadarian Price' && p.category === 'receptions');
    expect(priceProp).toBeDefined();
    expect(priceProp.line).toBe('1.5');
    expect(priceProp.price).toBe('+124');
    expect(priceProp.game).toBe('NE @ SEA');
    expect(priceProp.tier).toBe(1);

    const nacuaProp = props.find((p) => p.player === 'Puka Nacua');
    expect(nacuaProp).toBeDefined();
    expect(nacuaProp.price).toBe('+800');
    expect(nacuaProp.category).toBe('first_td');
    expect(nacuaProp.game).toBe('SF @ LAR');

    const taylorProp = props.find((p) => p.player === 'Jonathan Taylor');
    expect(taylorProp).toBeDefined();
    expect(taylorProp.price).toBe('+400');
    expect(taylorProp.game).toBe('BAL @ IND');
  });

  it('builds pre-engineered parlay cards with valid positive correlation and positive odds', () => {
    const mockArticles = [
      {
        id: 3118,
        author: 'Travis Pulver',
        source: 'BettingPros',
        title: 'NFL Player Props & Bets: Patriots vs. Seahawks',
        body: '',
      },
      {
        id: 3063,
        author: 'Phil Wood',
        source: 'BettingPros',
        title: 'NFL Same Game Parlays: Patriots vs. Seahawks',
        body: '',
      },
      {
        id: 2954,
        author: 'Zachary Cohen',
        source: 'VSiN',
        title: 'Patriots vs. Seahawks Predictions',
        body: '',
      },
      {
        id: 3119,
        author: 'Mike Spector',
        source: 'BettingPros',
        title: 'NFL Thursday Night Football TD Scorers Picks: 49ers vs. Rams',
        body: '',
      },
    ];

    const props = extractCuratedPlayerProps(mockArticles);
    const parlayCards = buildCuratedParlayCards(props);

    expect(parlayCards.length).toBeGreaterThanOrEqual(4);
    for (const card of parlayCards) {
      expect(card.title).toBeTruthy();
      expect(card.legs.length).toBeGreaterThanOrEqual(2);
      expect(card.estimated_odds).toMatch(/^[+-]\d{3,4}$/);
      expect(card.correlation_rating).toBeTruthy();
      expect(card.synergy_rationale).toBeTruthy();
    }
  });

  it('correctly synthesizes Melbourne Kickoff props and Same Game Parlay cards (LAR vs SF)', () => {
    const props = extractCuratedPlayerProps([]);
    const melbourneProps = props.filter((p) => p.game === 'SF @ LAR');

    expect(melbourneProps.length).toBeGreaterThanOrEqual(9);

    // Assert key player props exist
    const corum = melbourneProps.find((p) => p.player === 'Blake Corum');
    expect(corum).toBeDefined();
    expect(corum.category).toBe('rushing_yards');
    expect(corum.line).toBe('44.5');
    expect(corum.analyst).toContain('Scott Bogman');

    const kyren = melbourneProps.find((p) => p.player === 'Kyren Williams');
    expect(kyren).toBeDefined();
    expect(kyren.category).toBe('rushing_yards');
    expect(kyren.line).toBe('56.5');
    expect(kyren.analyst).toContain('Tara Roberts');

    const stribling = melbourneProps.find((p) => p.player === 'Deshaun Stribling');
    expect(stribling).toBeDefined();
    expect(stribling.category).toBe('receiving_yards');
    expect(stribling.line).toBe('35.5');

    const deebo = melbourneProps.find((p) => p.player === 'Deebo Samuel');
    expect(deebo).toBeDefined();
    expect(deebo.category).toBe('receiving_yards');
    expect(deebo.line).toBe('29.5');

    const nacuaRec = melbourneProps.find((p) => p.player === 'Puka Nacua' && p.category === 'receptions');
    expect(nacuaRec).toBeDefined();
    expect(nacuaRec.line).toBe('7.5');
    expect(nacuaRec.price).toBe('+116');

    const kittle = melbourneProps.find((p) => p.player === 'George Kittle');
    expect(kittle).toBeDefined();
    expect(kittle.line).toBe('3.5');

    const adamsAtd = melbourneProps.find((p) => p.player === 'Davante Adams');
    expect(adamsAtd).toBeDefined();
    expect(adamsAtd.price).toBe('+140');

    // Assert SGP cards
    const parlayCards = buildCuratedParlayCards(props);
    const groundControlCard = parlayCards.find((c) => c.id === 'parlay__sf_lar__rams_ground_control');
    expect(groundControlCard).toBeDefined();
    expect(groundControlCard.legs.length).toBe(3);
    expect(groundControlCard.estimated_odds).toBe('+580');

    const targetFunnelCard = parlayCards.find((c) => c.id === 'parlay__sf_lar__melbourne_target_funnel');
    expect(targetFunnelCard).toBeDefined();
    expect(targetFunnelCard.legs.length).toBe(3);
    expect(targetFunnelCard.estimated_odds).toBe('+655');

    const shootoutCard = parlayCards.find((c) => c.id === 'parlay__sf_lar__melbourne_primetime_shootout');
    expect(shootoutCard).toBeDefined();
    expect(shootoutCard.legs.length).toBe(3);
  });

  it('renders complete Markdown and interactive HTML dashboards', () => {
    const mockData = {
      generated_at: new Date().toISOString(),
      summary: {
        articles_scanned: 10,
        total_props: 4,
        tier_1_props: 3,
        touchdown_props: 1,
        curated_parlays: 1,
        games_covered: 1,
      },
      parlayCards: [
        {
          id: 'test-card',
          title: 'Test SGP Card',
          game: 'NE @ SEA',
          game_slate: 'Wednesday Opener',
          type: 'same_game_parlay',
          book: 'DraftKings',
          leg_count: 2,
          legs: [
            { player: 'Drake Maye', selection: 'Over 226.5 Passing Yards', price: '-117' },
            { player: 'A.J. Brown', selection: 'Over 5.5 Receptions', price: '+121' },
          ],
          estimated_odds: '+317',
          payout_multiplier: '4.17x',
          payout_on_10: '$41.70',
          payout_on_25: '$104.25',
          correlation_rating: 'High Positive (+)',
          synergy_rationale: 'Pass-heavy script stack.',
        },
      ],
      props: [
        {
          id: 'p1',
          player: 'Drake Maye',
          team: 'NE',
          game: 'NE @ SEA',
          game_slate: 'Wednesday Opener',
          category: 'passing_yards',
          category_label: 'Passing Yards',
          stat_type: 'passing',
          line: '226.5',
          side: 'over',
          price: '-117',
          book: 'DraftKings',
          tier: 1,
          tier_label: 'Tier 1: Recommended',
          analyst: 'Zachary Cohen (VSiN)',
          rationale: 'High passing volume expected.',
          parlay_utility: { role: 'Passing Anchor' },
        },
      ],
    };

    const md = renderMarkdown(mockData);
    expect(md).toContain('# NFL Week 1 Player Prop & Parlay Intelligence Dossier');
    expect(md).toContain('Test SGP Card');
    expect(md).toContain('Drake Maye');

    const html = renderHtml(mockData);
    expect(html).toContain('NFL Week 1 Player Prop &amp; Parlay Intelligence');
    expect(html).toContain('Test SGP Card');
    expect(html).toContain('Drake Maye');
    expect(html).toContain('Active Parlay Slip');
    expect(html).toContain('toggleProp');
  });
});
