import { describe, expect, it } from 'vitest';
import {
  buildFanaticsFuturesComparison,
  decimalToAmerican,
  eventContractGrossDecimal,
  parseFanaticsPrice,
} from '../../scripts/build-fanatics-futures-comparison.mjs';

describe('Fanatics futures reference comparison', () => {
  it('parses a two-sided rendered contract price without treating it as a sportsbook quote', () => {
    expect(parseFanaticsPrice('Los Angeles Rams|yes 15|no 87')).toEqual({
      team: 'Los Angeles Rams', yes_cents: 15, no_cents: 87,
    });
    expect(eventContractGrossDecimal(15)).toBe(6.6667);
    expect(decimalToAmerican(6.6667)).toBe(567);
  });

  it('aligns a matching sportsbook row but refuses to compute a best venue', () => {
    const artifact = buildFanaticsFuturesComparison({
      generatedAt: '2026-09-22T20:00:00.000Z',
      fanatics: {
        source: 'fixture',
        visualChampionSnapshot: { prices: ['Los Angeles Rams|yes 15|no 87'] },
        futures: {},
      },
      betonline: { source: 'fixture', marketSnapshots: {} },
      betonlineSuperBowl: [{ team: 'Los Angeles Rams', odds: 675 }],
    });
    expect(artifact.counts).toMatchObject({ fanatics_contracts: 1, aligned_betonline_rows: 1, comparison_eligible_rows: 0 });
    expect(artifact.entries[0]).toMatchObject({
      betonline: { american_odds: 675, decimal_return: 7.75 },
      comparison: {
        status: 'reference_only_missing_fanatics_fee_and_executable_ask',
        best_price_status: 'not_computed',
      },
    });
  });
});
