import { describe, expect, it } from 'vitest';

import {
  buildReport,
  loadArticles,
  normalizedLimit,
  renderMarkdown,
} from '../../scripts/build-article-intel-review.js';

const SINCE = '2026-07-30T00:00:00.000Z';

function article(overrides = {}) {
  const summary = overrides.summary || 'NFL futures analysis.';
  return {
    id: overrides.id || 'article-1',
    source: overrides.source || 'Fixture Sportsbook Analysis',
    source_type: overrides.source_type || 'betting',
    title: overrides.title || 'NFL futures analysis',
    summary,
    body: overrides.body === undefined ? `${summary} ${'NFL football evidence. '.repeat(40)}` : overrides.body,
    url: overrides.url || 'https://example.test/article',
    published_at: overrides.published_at || '2026-08-10T12:00:00.000Z',
    captured_at: overrides.captured_at || '2026-08-10T13:00:00.000Z',
    author: overrides.author || 'Fixture Analyst',
  };
}

function collection(overrides = {}) {
  return {
    since: SINCE,
    requested_limit: null,
    local_only: false,
    local_files_scanned: 0,
    database_status: 'complete',
    database_pages: 1,
    database_rows: 1,
    database_cap_reached: false,
    complete_for_since_window: true,
    deduped_records: 1,
    ...overrides,
  };
}

function fakeSupabase(rows) {
  return {
    from() {
      return {
        select() { return this; },
        gte() { return this; },
        order() { return this; },
        range(from, to) {
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
        },
      };
    },
  };
}

describe('article evidence integrity', () => {
  it('pages the complete date window instead of applying the old 100-row default cap', async () => {
    const rows = Array.from({ length: 1205 }, (_, index) => article({
      id: `db-${index}`,
      title: `NFL analysis ${index}`,
    }));

    const complete = await loadArticles(SINCE, 0, { client: fakeSupabase(rows) });
    expect(complete.collection.database_rows).toBe(1205);
    expect(complete.collection.database_pages).toBe(2);
    expect(complete.collection.database_cap_reached).toBe(false);
    expect(complete.collection.complete_for_since_window).toBe(true);

    const capped = await loadArticles(SINCE, 100, { client: fakeSupabase(rows) });
    expect(capped.collection.database_rows).toBe(100);
    expect(capped.collection.database_cap_reached).toBe(true);
    expect(capped.collection.complete_for_since_window).toBe(false);
    expect(normalizedLimit(0)).toBeNull();
  });

  it('extracts four structured selection mentions and three unique selections from two multi-pick articles', () => {
    const rows = [
      article({
        id: 'sharp-1',
        source: 'Sharp Football',
        title: '2026 NFL Player Prop Best Bets',
        summary: 'Josh Allen – Over 24.5 Passing Touchdowns (-110); Fernando Mendoza – Under 2299.5 Passing Yards (-115).',
      }),
      article({
        id: 'sharp-2',
        source: 'Sharp Football',
        title: 'More 2026 NFL Player Prop Picks',
        summary: 'Tyler Shough - Under 3449.5 Passing Yards (+100). Fernando Mendoza - Under 2299.5 Passing Yards (-115).',
      }),
    ];

    const report = buildReport(rows, SINCE, collection({ database_rows: 2, deduped_records: 2 }));
    expect(report.summary.explicit_analyst_selection_mentions).toBe(4);
    expect(report.summary.unique_explicit_analyst_selections).toBe(3);
    expect(report.summary.actual_picks).toBe(0);
    expect(report.summary.selections_needing_execution_verification).toBe(4);
    expect(report.summary.unresolved_pick_oriented_records).toBe(0);
    expect(report.analyst_selections.map((item) => item.selection)).toEqual([
      'Josh Allen',
      'Fernando Mendoza',
      'Tyler Shough',
      'Fernando Mendoza',
    ]);
    expect(report.analyst_selections.every((item) => item.review_flags.includes('missing_book'))).toBe(true);
    expect(report.analyst_selections.some((item) => /^(NO|BUF|GB|LV)$/i.test(item.selection))).toBe(false);
  });

  it('keeps explicit selections without execution evidence out of strict actual picks', () => {
    const report = buildReport([
      article({
        id: 'strict-1',
        title: 'NFL Super Bowl Best Bet',
        summary: 'Best Bet: Buffalo Bills to win the Super Bowl at BetUS +1000.',
      }),
      article({
        id: 'strict-2',
        title: 'NFL Super Bowl Pick',
        summary: 'Pick: Green Bay Packers to win the Super Bowl +2000.',
      }),
    ], SINCE, collection({ database_rows: 2, deduped_records: 2 }));

    expect(report.analyst_selections).toHaveLength(2);
    expect(report.actual_picks).toHaveLength(1);
    expect(report.actual_picks[0]).toMatchObject({
      book: 'BetUS',
      price: '+1000',
      evidence_status: 'execution_evidence_present',
    });
    expect(report.analyst_selections.find((item) => item.selection.includes('Green Bay')))
      .toMatchObject({ evidence_status: 'needs_price_or_venue_verification' });
  });

  it('reports body evidence and unresolved pick-oriented records without calling them reviewed', () => {
    const report = buildReport([
      article({ id: 'missing', title: 'NFL Best Bets', body: '' }),
      article({ id: 'truncated', title: 'NFL Picks', body: 'NFL football '.repeat(1600) }),
      article({ id: 'available', title: 'NFL team analysis' }),
    ], SINCE, collection({ database_rows: 3, deduped_records: 3 }));

    expect(report.summary.body_evidence).toMatchObject({
      metadata_only: 1,
      suspected_ingest_cap: 1,
      body_available: 1,
    });
    expect(report.summary.unresolved_pick_oriented_records).toBe(2);
    expect(report.summary).not.toHaveProperty('articles_reviewed');
    expect(renderMarkdown(report)).not.toMatch(/Articles reviewed/i);
  });

  it('uses manual source dispositions to clear reviewed pick-oriented records without promoting picks', () => {
    const row = article({
      id: 'manual-1',
      title: 'NFL Hall of Fame Game Picks & Predictions',
      body: '',
      url: 'https://example.test/manual-review',
    });
    const report = buildReport([row], SINCE, collection(), {
      manualDispositions: [{
        id: 'manual-1',
        url: row.url,
        disposition: 'reviewed_no_actionable_actual_pick',
        reviewed_at: '2026-08-12T05:20:00.000Z',
        reviewer: 'A05',
        evidence_basis: ['source_url_retained', 'no_execution_usable_pick_allowed'],
        notes: 'Manual review keeps the article out of actual_picks.',
      }],
      manualDispositionsPath: 'data/research-intel/review/article-intel-manual-dispositions.json',
    });

    expect(report.summary.unresolved_pick_oriented_records).toBe(0);
    expect(report.summary.manually_dispositioned_pick_oriented_records).toBe(1);
    expect(report.summary.actual_picks).toBe(0);
    expect(report.articles[0].pick_review_status).toBe('manual_reviewed_no_actionable_actual_pick');
    expect(report.articles[0].manual_review.source_url).toBe(row.url);
  });

  it('correctly classifies Tier 2 analyst best bets with consensus assumed', () => {
    const row = article({
      id: 'tuley-1',
      source: 'VSiN',
      title: "Dave Tuley's NFL Week 1 Best Bets",
      author: 'Dave Tuley',
      summary: 'Best Bet: Cleveland Browns +8. Best Bet: New England Patriots +3.5.',
    });
    const report = buildReport([row], SINCE, collection({ database_rows: 1, deduped_records: 1 }));
    expect(report.tiered_picks).toHaveLength(2);
    expect(report.tiered_picks[0].tier).toBe(2);
    expect(report.tiered_picks[0].weight).toBe(0.75);
    expect(report.tiered_picks[0].analyst).toBe('Dave Tuley (VSiN)');
    expect(report.tiered_picks[0].selection).toBe('Cleveland Browns +8');
    expect(report.summary.weighted_picks.tier_2_analyst_best_bets).toBe(2);
  });
});

describe('article intel review fixes (2026-10-07)', () => {
  it('stores unit-sized picks with a numeric price so they pass the actual-pick gate', () => {
    const report = buildReport([
      article({
        id: 'walter-units',
        source: 'Walter Football',
        title: 'NFL Picks',
        summary: 'Week 5 NFL Pick: Cowboys 38, Buccaneers 17. Pick: Cowboys -8 (3 Units).',
      }),
    ], SINCE, collection());

    const pick = report.analyst_selections.find((item) => item.selection === 'Cowboys -8');
    expect(pick).toBeTruthy();
    expect(pick.price).toBe('-110');
    expect(Number.isFinite(Number(pick.price))).toBe(true);
    expect(report.validation_results.article_evidence.metrics.invalid_actual_picks).toBe(0);
  });

  it('treats survivor, confidence-pool, MVP-odds and tool pages as context, not unresolved picks', () => {
    const report = buildReport([
      article({ id: 'surv', title: 'NFL Survivor Pool Week 5 Picks, Strategy: Target Bengals, Texans' }),
      article({ id: 'conf', title: 'NFL Week 5 Confidence Pool Picks & Predictions (2026)' }),
      article({ id: 'mvp', title: 'Mahomes Odds Surge in NFL MVP Race' }),
      article({ id: 'tdm', title: 'NFL Anytime Touchdown Machine: Live TD Odds, Trends and More' }),
      article({ id: 'real', title: 'NFL Week 5 Best Bets' }),
    ], SINCE, collection({ database_rows: 5, deduped_records: 5 }));

    const byId = Object.fromEntries(report.articles.map((a) => [a.id, a.pick_review_status]));
    expect(byId.surv).toBe('context_only_title');
    expect(byId.conf).toBe('context_only_title');
    expect(byId.mvp).toBe('context_only_title');
    expect(byId.tdm).toBe('context_only_title');
    expect(byId.real).toBe('unresolved_no_selection_extracted');
    expect(report.summary.unresolved_pick_oriented_records).toBe(1);
  });

  it('extracts priced parlay legs written as "Leg N: selection ( price )"', () => {
    const report = buildReport([
      article({
        id: 'bp-parlay',
        source: 'BettingPros',
        title: 'NFL Week 5 Picks & Predictions: Best Early Parlays (2026)',
        summary: 'Early NFL Week 5 Parlay #1. Leg 1: Dak Prescott 30+ Pass Attempts ( -375 ). Dallas threw the ball on 45 plays.',
      }),
    ], SINCE, collection());

    const leg = report.analyst_selections.find((item) => /Dak Prescott/.test(item.selection));
    expect(leg).toBeTruthy();
    expect(leg.selection).toBe('Dak Prescott 30+ Pass Attempts');
    expect(leg.price).toBe('-375');
    expect(report.articles[0].pick_review_status).toBe('explicit_selection_extracted');
  });
});

describe('article intel review extractor fix (2026-10-22): listed props, SGP legs, ATD lists', () => {
  const pick = (report, re) => report.analyst_selections.filter((item) => re.test(item.selection));

  it('extracts an SGP list without dashes, including a Team/Team game-total leg', () => {
    const report = buildReport([
      article({
        id: 'an-sgp',
        source: 'Action Network',
        title: 'Bears vs Patriots Odds, Picks, Parlay for Thursday Night Football',
        summary: 'Bears vs Patriots Same-Game Parlay Patriots/Bears Over 50.5 (-118) A.J. Brown Over 69.5 Receiving Yards (-112) D\'Andre Swift Over 61.5 Rushing Yards (-111) Parlay Odds: +440 ( DraftKings ).',
      }),
    ], SINCE, collection());
    const total = report.analyst_selections.find((i) => i.selection === 'Over 50.5');
    expect(total?.market).toBe('game_total');
    expect(total?.price).toBe('-118');
    expect(pick(report, /A\.J\. Brown Over 69\.5 Receiving Yards/)).toHaveLength(1);
    expect(pick(report, /D'Andre Swift Over 61\.5 Rushing Yards/)).toHaveLength(1);
    expect(report.analyst_selections.filter((i) => /Brown|Swift|Over 50\.5/.test(i.selection))).toHaveLength(3);
  });

  it('extracts every anytime-TD pick from a "(+price; book)" list and strips page-word prefixes', () => {
    const report = buildReport([
      article({
        id: 'an-atd',
        source: 'Action Network',
        title: 'Patriots vs Bears Anytime Touchdown Scorer Props',
        summary: 'Scorer Picks Hunter Henry Anytime Touchdown (+240; betMGM) Caleb Williams Anytime Touchdown (+350; DraftKings) Kyle Williams Anytime Touchdown (+750; DraftKings).',
      }),
    ], SINCE, collection());
    const names = report.analyst_selections.map((i) => i.selection).sort();
    expect(names).toEqual(['Caleb Williams Anytime Touchdown', 'Hunter Henry Anytime Touchdown', 'Kyle Williams Anytime Touchdown']);
    const henry = report.analyst_selections.find((i) => /Henry/.test(i.selection));
    expect(henry.price).toBe('+240');
    expect(henry.book).toBe('BetMGM');
  });

  it('keeps all four props from a summary list, with no fused line or "NOW" prefix, and one row per pick', () => {
    const report = buildReport([
      article({
        id: 'an-props',
        source: 'Action Network',
        title: 'Patriots vs Bears Player Props',
        summary: 'D’Andre Swift Over 16.5 Receiving Yards (-115, Bet365 ) AJ Brown Over 5.5 Receptions (+124, DraftKings ) AJ Brown Anytime Touchdown (+145, BetMGM ) Eli Raridon Anytime Touchdown (+600, BetMGM ). NOW A.J. Brown Anytime Touchdown (+145) Eli Raridon Anytime Touchdown (+600 at BetMGM).',
      }),
    ], SINCE, collection());
    expect(report.analyst_selections).toHaveLength(4);
    const swift = report.analyst_selections.find((i) => /Swift/.test(i.selection));
    expect(swift.line).toBe('16.5');
    const raridon = report.analyst_selections.find((i) => /Raridon/.test(i.selection));
    expect(raridon.line).toBeNull();
    expect(report.analyst_selections.some((i) => /^NOW\b/.test(i.selection))).toBe(false);
  });

  it('collapses a sentence-fragment spread pick to one clean selection', () => {
    const report = buildReport([
      article({
        id: 'an-1h',
        source: 'Action Network',
        title: 'Patriots vs Bears Prediction, Pick, Odds',
        summary: 'Patriots vs Bears pick: Patriots 1st Half Spread +2.5 My Patriots vs Bears best bet is the Patriots to cover the first half. Patriots 1st Half Spread +2.5 Patriots vs Bears Betting Trends.',
      }),
    ], SINCE, collection());
    const spreads = report.analyst_selections.filter((i) => i.market === 'spread');
    expect(spreads).toHaveLength(1);
    expect(spreads[0].selection).toBe('Patriots 1st Half Spread +2.5');
  });

  it('rejects team-led or single-token names', () => {
    const report = buildReport([
      article({
        id: 'an-junk',
        source: 'Action Network',
        title: 'NFL picks',
        summary: 'Bears Over 2.5 Passing Touchdowns (+116). Parlay Over 40.5 Rushing Yards (-112).',
      }),
    ], SINCE, collection());
    expect(report.analyst_selections.filter((i) => /Bears|Parlay/.test(i.selection) && i.market === 'player_prop_or_stat_future')).toHaveLength(0);
  });
});
