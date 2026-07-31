import { describe, expect, it } from 'vitest';
import { buildProjectedStarters } from '../../scripts/build-projected-starters.js';
import { buildAvailabilityImpactDigest } from '../../scripts/build-availability-impact-digest.js';
import { buildPredictionMarketMap } from '../../scripts/build-prediction-market-map.js';
import { buildTrainingCampCoverageFill } from '../../scripts/build-training-camp-coverage-fill.js';
import { buildPodcastYoutubeFreshnessReconciliation } from '../../scripts/build-podcast-youtube-freshness-reconciliation.js';

describe('data gathering sprint contracts', () => {
  it('builds a projected-starters snapshot with honest manual coverage status', async () => {
    const { snapshot } = await buildProjectedStarters({
      availability: 'tests/fixtures/data-gathering-availability-mini.json',
      generatedAt: '2026-07-30T12:30:00.000Z',
      dryRun: true,
    });

    expect(snapshot.meta.schema).toBe('projected_starters_snapshot_v1');
    expect(Object.keys(snapshot.teams)).toHaveLength(32);
    expect(snapshot.teams.KC.players[0].player_name).toBe('Test Starter');
    expect(snapshot.teams.KC.coverage_status).toBe('estimated_from_local_starter_language');
    expect(snapshot.teams.KC.missing).toContain('manual all-position depth chart');
    expect(snapshot.meta.teams_needing_manual_depth_chart).toBe(32);
  });

  it('builds an impact digest with starter matching and classification warnings', async () => {
    const { digest } = await buildAvailabilityImpactDigest({
      availability: 'tests/fixtures/data-gathering-availability-mini.json',
      projectedStarters: 'tests/fixtures/data-gathering-projected-starters-mini.json',
      generatedAt: '2026-07-30T12:30:00.000Z',
      dryRun: true,
    });

    const starterEvent = digest.top_events.find((event) => event.player_name === 'Test Starter');
    const warningEvent = digest.top_events.find((event) => event.player_name === 'Test Tackle');

    expect(digest.meta.schema).toBe('starter_impact_availability_digest_v1');
    expect(starterEvent.starter_match.role).toBe('manual_projection');
    expect(warningEvent.signal).toBe('classification_review');
    expect(warningEvent.classification_warning).toBe('worsening_label_conflicts_with_improving_text');
  });

  it('maps prediction-market team abbreviations from tickers before fuzzy title matching', async () => {
    const { snapshot } = await buildPredictionMarketMap({
      source: 'tests/fixtures/data-gathering-prediction-markets-mini.json',
      generatedAt: '2026-07-30T12:30:00.000Z',
      dryRun: true,
    });

    expect(snapshot.meta.mapped_count).toBe(1);
    expect(snapshot.meta.unmapped_count).toBe(1);
    expect(snapshot.mapped[0].team).toBe('NYJ');
    expect(snapshot.mapped[0].market).toBe('make_playoffs');
    expect(snapshot.unmapped[0].unmapped_reason).toBe('no_team_match');
  });

  it('keeps training-camp coverage fill separate from canonical camp coverage', async () => {
    const { snapshot } = await buildTrainingCampCoverageFill({
      camp: 'tests/fixtures/training-camp-coverage-camp-mini.json',
      articleReview: 'tests/fixtures/training-camp-coverage-article-mini.json',
      availabilityDigest: 'tests/fixtures/training-camp-coverage-digest-mini.json',
      generatedAt: '2026-07-30T12:30:00.000Z',
      dryRun: true,
    });

    const chiefs = snapshot.teams.find((team) => team.team === 'KC');
    const bills = snapshot.teams.find((team) => team.team === 'BUF');
    const packers = snapshot.teams.find((team) => team.team === 'GB');

    expect(snapshot.meta.schema).toBe('training_camp_coverage_fill_v1');
    expect(chiefs.coverage_status).toBe('existing_camp_intel');
    expect(bills.coverage_status).toBe('local_source_fill_ready_for_review');
    expect(packers.coverage_status).toBe('availability_context_only_needs_camp_source');
    expect(snapshot.meta.teams_needing_manual_camp_source).toBe(31);
  });

  it('reconciles podcast and YouTube freshness without promoting review-only rows', async () => {
    const { snapshot } = await buildPodcastYoutubeFreshnessReconciliation({
      agentSummary: 'tests/fixtures/podcast-youtube-agent-summary-mini.json',
      reviewStatus: 'tests/fixtures/podcast-youtube-review-status-mini.json',
      reviewReport: 'tests/fixtures/podcast-youtube-review-report-mini.json',
      youtubeCandidates: 'tests/fixtures/podcast-youtube-candidates-mini.json',
      podcastDeepDiveIndex: 'tests/fixtures/podcast-youtube-deep-dive-index-mini.json',
      observationFiles: ['youtube-window-futures-shadow-youtube.json'],
      generatedAt: '2026-07-30T12:30:00.000Z',
      dryRun: true,
    });

    const bills = snapshot.anchors.find((team) => team.team === 'BUF');
    const chiefs = snapshot.anchors.find((team) => team.team === 'KC');

    expect(snapshot.meta.schema).toBe('podcast_youtube_freshness_reconciliation_v1');
    expect(snapshot.youtube.accepted.exported_items).toBe(1);
    expect(snapshot.youtube.review_status.review_only_count).toBe(1);
    expect(snapshot.youtube.candidates.window_candidate_count).toBe(2);
    expect(snapshot.youtube.candidates.window_futures_eligible_count).toBe(1);
    expect(snapshot.youtube.candidates.window_observed_count).toBe(1);
    expect(snapshot.podcast.window_episode_count).toBe(1);
    expect(bills.accepted_pick_count).toBe(1);
    expect(chiefs.accepted_pick_count).toBe(0);
    expect(chiefs.pending_or_needs_review_count).toBe(1);
  });
});
