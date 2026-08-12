import { describe, expect, it } from 'vitest';
import { buildPredictionMarketMap } from '../../scripts/build-prediction-market-map.js';
import { buildCrossMarketCoherence } from '../../scripts/build-cross-market-coherence.js';

const FIXTURE = 'tests/fixtures/prediction-market-evidence-cleanup-mini.json';
const GENERATED_AT = '2026-08-11T20:00:00.000Z';

describe('prediction-market evidence cleanup P01-P02', () => {
  it('gates taxonomy and 2026 season before disambiguated team mapping', async () => {
    const { snapshot } = await buildPredictionMarketMap({
      source: FIXTURE,
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });

    expect(snapshot.meta.schema).toBe('prediction_market_team_map_v2');
    expect(snapshot.meta.mapped_count).toBe(9);
    expect(snapshot.meta.unmapped_count).toBe(4);
    expect(snapshot.meta.wrong_season_mapped_count).toBe(0);
    expect(snapshot.meta.eligible_context_count).toBe(9);
    expect(snapshot.meta.actionable_count).toBe(6);
    expect(snapshot.meta.execution_eligible_count).toBe(0);

    expect(snapshot.contracts.find((row) => row.id === 'nyg_super_bowl')).toMatchObject({
      team: 'NYG',
      market: 'super_bowl',
      season: 2026,
      season_source: 'title_postseason_event_year',
    });
    expect(snapshot.contracts.find((row) => row.id === 'nyj_super_bowl')).toMatchObject({
      team: 'NYJ',
      market: 'super_bowl',
      season: 2026,
    });
    expect(snapshot.contracts.find((row) => row.id === 'lac_division')).toMatchObject({
      team: 'LAC',
      market: 'division',
      taxonomy_source: 'title',
    });
    expect(snapshot.contracts.find((row) => row.id === 'lar_conference')).toMatchObject({
      team: 'LAR',
      market: 'conference',
      season: 2026,
    });

    for (const id of ['ambiguous_new_york', 'ambiguous_los_angeles']) {
      expect(snapshot.contracts.find((row) => row.id === id)).toMatchObject({
        team: null,
        mapped: false,
        mapping_method: 'ambiguous_shared_city',
      });
    }
    expect(snapshot.contracts.find((row) => row.id === 'wrong_season_giants')).toMatchObject({
      team: null,
      mapped: false,
      season: 2027,
      season_scope_status: 'wrong_season',
      unmapped_reason: 'wrong_season:2027',
    });
    expect(snapshot.contracts.find((row) => row.id === 'taxonomy_before_team_mapping')).toMatchObject({
      team: null,
      mapped: false,
      mapping_method: 'taxonomy_gate',
      contract_taxonomy: 'player_or_transaction',
    });
  });

  it('separates eligible context from actionable coherence and excludes warned rows from math', async () => {
    const { snapshot: map } = await buildPredictionMarketMap({
      source: FIXTURE,
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });
    const { snapshot } = await buildCrossMarketCoherence({
      sourceData: map,
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });

    expect(snapshot.meta.schema).toBe('prediction_market_cross_market_coherence_v2');
    expect(snapshot.meta.eligible_context_contract_count).toBe(9);
    expect(snapshot.meta.actionable_contract_count).toBe(6);
    expect(snapshot.meta.context_only_contract_count).toBe(3);
    expect(snapshot.meta.eligible_context_team_count).toBe(4);
    expect(snapshot.meta.team_count).toBe(4);
    expect(snapshot.meta.execution_eligible_contract_count).toBe(0);
    expect(snapshot.meta.execution_source_status).toBe('blocked_settlement_terms_unverified');

    const giants = snapshot.teams.find((team) => team.team === 'NYG');
    expect(giants.contract_counts).toEqual({ eligible_context: 5, actionable: 3, context_only: 2 });
    expect(giants.implied_win_pct_by_market.division).toBeNull();
    expect(giants.win_total_ladder.points).toEqual([{ threshold: 8, implied_prob: 40 }]);
    expect(giants.win_total_ladder.violations).toEqual([]);
    expect(giants.championship_ladder.violations).toEqual([]);
    expect(snapshot.meta.caveats.join(' ')).toMatch(/fee-adjusted/i);
    expect(snapshot.meta.caveats.join(' ')).toMatch(/liquidity-warned/i);
    expect(snapshot.meta.caveats.join(' ')).toMatch(/settlement terms/i);
  });

  it('keeps the July 31 source with 77% liquidity warnings blocked as an execution source', async () => {
    const { snapshot: legacyCoherence } = await buildCrossMarketCoherence({
      source: 'data/prediction-markets/team-market-map-2026-07-31.json',
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });
    const { snapshot: map } = await buildPredictionMarketMap({
      source: 'data/prediction-markets/latest.json',
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });
    const { snapshot } = await buildCrossMarketCoherence({
      sourceData: map,
      generatedAt: GENERATED_AT,
      season: 2026,
      dryRun: true,
    });

    expect(legacyCoherence.meta.source_schema).toBe('prediction_market_team_map_v1');
    expect(legacyCoherence.meta.explicit_eligibility_contract).toBe(false);
    expect(legacyCoherence.meta.actionable_contract_count).toBe(0);
    expect(legacyCoherence.meta.source_liquidity_warning_rate_pct).toBeGreaterThanOrEqual(77);
    expect(legacyCoherence.meta.execution_source_status).toBe('blocked_settlement_terms_unverified');
    expect(map.meta.source_generated_at).toBe('2026-07-31T02:38:11.234Z');
    expect(map.meta.liquidity_warning_rate_pct).toBeGreaterThanOrEqual(77);
    expect(map.meta.execution_eligible_count).toBe(0);
    expect(map.meta.execution_source_status).toBe('blocked_settlement_terms_unverified');
    expect(snapshot.meta.source_liquidity_warning_rate_pct).toBeGreaterThanOrEqual(77);
    expect(snapshot.meta.execution_eligible_contract_count).toBe(0);
    expect(snapshot.meta.execution_source_status).toBe('blocked_settlement_terms_unverified');
  });
});
