import { describe, expect, it } from 'vitest';
import {
  validateArticleEvidence,
  validateFuturesEvidenceBundle,
  validatePredictionArtifacts,
  validateSourceAuditArtifact,
  validateTeamIdentityArtifact,
  validateYoutubeArtifacts,
} from '../../scripts/lib/futures-evidence-gates.js';

const fingerprint = 'a'.repeat(64);

function cohort(overrides = {}) {
  return {
    schema: 'youtube_reviewed_local_intel_cohort_v1',
    item_count: 43,
    fingerprint_sha256: fingerprint,
    forbidden_episode_evidence_count: 0,
    forbidden_episode_evidence_absent: true,
    ...overrides,
  };
}

function passingArticle() {
  return {
    schema: 'article_intel_review_v2',
    schema_version: 2,
    collection: {
      complete_for_since_window: true,
      database_status: 'complete',
      local_only: false,
    },
    summary: {
      article_records_assessed: 2,
      body_evidence: { body_available: 2, suspected_ingest_cap: 0, metadata_only: 0, thin_body: 0 },
      unresolved_pick_oriented_records: 0,
      selections_needing_execution_verification: 1,
    },
    actual_picks: [{ selection: 'Josh Allen', market: 'mvp', price: 700, book: 'Bookmaker/BKR' }],
  };
}

function passingPrediction() {
  const predictionMap = {
    meta: {
      schema: 'prediction_market_team_map_v2',
      season: 2026,
      generated_at: '2026-08-12T00:00:00.000Z',
      mapped_count: 1,
      eligible_context_count: 1,
      wrong_season_mapped_count: 0,
    },
    contracts: [{
      id: 'kalshi_KXNFLWINS-27NYJ-9',
      ticker: 'KXNFLWINS-27NYJ-9',
      title: 'Will the New York Jets win at least 9 games this season?',
      team: 'NYJ',
      season: 2026,
      season_scope_status: 'eligible',
      taxonomy_supported: true,
      mapped: true,
      context_eligible: true,
      actionable_coherence_eligible: true,
      liquidity_warning: false,
      normalized_contract: {
        schema: 'prediction_market_contract_normalization_v1',
        price: { yes_bid_cents: 48, yes_ask_cents: 50, last_or_mark_cents: 50 },
        liquidity: { fillable_yes_size: 10, volume_24h: 100 },
        fees: { fee_adjustment_status: 'net_odds_available', gross_american_odds: 100, net_american_odds: -106 },
        timing: { expiration_at: '2027-01-12T15:00:00.000Z', expiration_status: 'present' },
        settlement: { settlement_terms_status: 'present' },
        sportsbook_equivalent: {
          status: 'mapped_to_sportsbook_market_key',
          market_type: 'wins',
          team: 'NYJ',
          side: 'over',
          line: 8.5,
          key: '2026|NYJ|wins|over|8.5',
        },
      },
    }],
  };
  const coherence = {
    meta: {
      schema: 'prediction_market_cross_market_coherence_v2',
      source_schema: 'prediction_market_team_map_v2',
      source_generated_at: predictionMap.meta.generated_at,
      explicit_eligibility_contract: true,
      actionable_contract_count: 1,
      eligible_context_contract_count: 1,
      execution_source_status: 'blocked_settlement_terms_unverified',
    },
  };
  return { predictionMap, coherence };
}

function passingYoutube() {
  return {
    reviewReport: { accepted_cohort: cohort() },
    status: { accepted_cohort: cohort(), items: [] },
    queue: { cohort: cohort(), exported_items: 43, items: [], notes: [] },
    summary: { cohort: cohort(), exported_items: 43, items: [], notes: [] },
    freshness: { youtube: { accepted: { cohort: cohort() } } },
  };
}

describe('futures evidence hard gates', () => {
  it('blocks legacy, partial, unresolved, and malformed article evidence', () => {
    const result = validateArticleEvidence({
      summary: { actual_picks: 1 },
      actual_picks: [{ selection: 'NO', market: 'player_prop', price: null, book: null }],
    });
    expect(result.status).toBe('blocked');
    expect(result.blockers.join(' ')).toMatch(/legacy/i);
    expect(result.blockers.join(' ')).toMatch(/not confirmed complete/i);
    expect(result.blockers.join(' ')).toMatch(/lack a named selection/i);
  });

  it('passes complete article evidence while keeping non-executable selections as warnings', () => {
    const result = validateArticleEvidence(passingArticle());
    expect(result.status).toBe('pass');
    expect(result.warnings).toHaveLength(1);
  });

  it('blocks contaminated team-identity artifacts', () => {
    const result = validateTeamIdentityArtifact({
      meta: {
        team_identity_validation: {
          schema: 'team_identity_validation_v1',
          status: 'blocked',
          duplicate_evidence_rows: 1,
          primary_source_mismatch_count: 2,
        },
      },
    }, 'fixture');
    expect(result.status).toBe('blocked');
    expect(result.blockers.join(' ')).toMatch(/duplicate/i);
    expect(result.blockers.join(' ')).toMatch(/source-prefix/i);
  });

  it('blocks invalid prediction identity, liquidity eligibility, and lineage', () => {
    const { predictionMap, coherence } = passingPrediction();
    predictionMap.contracts[0].team = 'NYG';
    predictionMap.contracts[0].liquidity_warning = true;
    coherence.meta.source_generated_at = '2026-08-11T00:00:00.000Z';
    const result = validatePredictionArtifacts({ predictionMap, coherence });
    expect(result.status).toBe('blocked');
    expect(result.blockers.join(' ')).toMatch(/identity collision/i);
    expect(result.blockers.join(' ')).toMatch(/liquidity-warned/i);
    expect(result.blockers.join(' ')).toMatch(/lineage/i);
  });

  it('blocks mismatched YouTube cohorts and forbidden accepted evidence', () => {
    const payload = passingYoutube();
    payload.summary.cohort = cohort({ fingerprint_sha256: 'b'.repeat(64) });
    payload.queue.items = [{ source: { episode_id: 'youtube-qoCm4G2Jmng' } }];
    const result = validateYoutubeArtifacts(payload);
    expect(result.status).toBe('blocked');
    expect(result.blockers.join(' ')).toMatch(/fingerprints do not match/i);
    expect(result.blockers.join(' ')).toMatch(/forbidden YouTube evidence/i);
  });

  it('blocks a legacy passing synthesis context when the explicit current audit is blocked', () => {
    const result = validateSourceAuditArtifact({
      generated_at: '2026-08-12T00:00:00.000Z',
      summary: { frontierReady: false, counts: { blocked: 1, missing: 0, stale: 0 } },
    });
    expect(result.status).toBe('blocked');
  });

  it('evaluates the whole bundle and preserves the upstream article blocker', () => {
    const { predictionMap, coherence } = passingPrediction();
    const youtube = passingYoutube();
    const identityValidation = {
      schema: 'team_identity_validation_v1',
      status: 'pass',
      duplicate_evidence_rows: 0,
      primary_source_mismatch_count: 0,
      missing_primary_team_count: 0,
    };
    const namedValidation = { schema: 'named_status_review_validation_v1', status: 'pass' };
    const availability = {
      meta: {
        generated_at: 'availability',
        team_identity_validation: identityValidation,
        availability_evidence_validation: {
          schema: 'availability_evidence_validation_v1',
          status: 'pass',
          unflagged_contradiction_count: 0,
        },
        named_status_review_validation: namedValidation,
      },
    };
    const starters = { meta: { generated_at: 'starters', named_status_review_validation: namedValidation } };
    const impact = {
      meta: {
        named_status_review_validation: namedValidation,
        inputs: {
          availability: { generated_at: 'availability' },
          projected_starters: { generated_at: 'starters' },
        },
      },
    };
    const result = validateFuturesEvidenceBundle({
      article: {},
      camp: { meta: { team_identity_validation: identityValidation } },
      availability,
      starters,
      impact,
      predictionMap,
      coherence,
      youtubeReview: youtube.reviewReport,
      youtubeStatus: youtube.status,
      youtubeQueue: youtube.queue,
      youtubeSummary: youtube.summary,
      freshness: youtube.freshness,
      oddsExecution: {
        meta: {
          schema: 'futures_odds_execution_validation_v1',
          current_snapshot_date: '2026-08-10',
          placeable_books: { bookmaker: 'Bookmaker/BKR' },
        },
        rows: [],
      },
    });
    expect(result.status).toBe('blocked');
    expect(result.blockers.some((message) => message.startsWith('article:'))).toBe(true);
    expect(result.validations.prediction_markets.status).toBe('pass');
    expect(result.validations.youtube.status).toBe('pass');
  });
});
