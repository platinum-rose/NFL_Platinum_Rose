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
      article({ id: 'truncated', title: 'NFL Picks', body: 'NFL football '.repeat(400) }),
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
});
