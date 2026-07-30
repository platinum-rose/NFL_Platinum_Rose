// tests/unit/fantasyValueReport.test.js
import { describe, expect, test } from 'vitest';
import { buildBoard, nameKey, tierFor } from '../../agents/fantasy-value-report.js';

function calculateProjPpg(statPpg, games, posMean, k = 6) {
  if (statPpg == null || games == null || posMean == null) return null;
  const w = games / (games + k);
  return w * statPpg + (1 - w) * posMean;
}

function calculateValueGap(adpPosRank, projPosRank) {
  if (adpPosRank == null || projPosRank == null) return null;
  return adpPosRank - projPosRank;
}

describe('Fantasy Value vs ADP Engine', () => {
  describe('Name Key Normalization', () => {
    test('normalizes name with suffixes and punctuation', () => {
      expect(nameKey('Marvin Harrison Jr.')).toBe('marvin harrison');
      expect(nameKey('Odell Beckham Jr.')).toBe('odell beckham');
      expect(nameKey('Patrick Mahomes II')).toBe('patrick mahomes');
      expect(nameKey('De\'Von Achane')).toBe('devon achane');
    });

    test('handles clean names and extra spaces', () => {
      expect(nameKey('  Ja\'Marr   Chase  ')).toBe('jamarr chase');
      expect(nameKey('CeeDee Lamb')).toBe('ceedee lamb');
    });
  });

  describe('Positional Mean Regression Calculation', () => {
    test('regresses high-ppg small sample heavily toward positional mean', () => {
      // 2 games at 25 ppg, posMean = 15 ppg, k = 6 -> w = 2/8 = 0.25
      // projPpg = 0.25 * 25 + 0.75 * 15 = 6.25 + 11.25 = 17.5
      const proj = calculateProjPpg(25, 2, 15, 6);
      expect(proj).toBeCloseTo(17.5, 2);
    });

    test('gives full weight to full-season sample', () => {
      // 17 games at 20 ppg, posMean = 12 ppg, k = 6 -> w = 17/23 = 0.7391
      // projPpg = (17*20 + 6*12)/23 = (340 + 72)/23 = 412/23 = 17.913
      const proj = calculateProjPpg(20, 17, 12, 6);
      expect(proj).toBeCloseTo(17.913, 2);
    });
  });

  describe('Value Gap & Tier Assignment', () => {
    test('computes value gap (adpPosRank - projPosRank)', () => {
      // Drafted as WR20, projected as WR14 -> value gap = +6 (Strong Value)
      const gap = calculateValueGap(20, 14);
      expect(gap).toBe(6);
      expect(tierFor(gap)).toBe('strong_value');
    });

    test('categorizes value tiers correctly', () => {
      expect(tierFor(7)).toBe('strong_value');
      expect(tierFor(4)).toBe('value');
      expect(tierFor(0)).toBe('fair');
      expect(tierFor(-1)).toBe('fair');
      expect(tierFor(-4)).toBe('reach');
      expect(tierFor(null)).toBe('no_projection');
    });
  });

  describe('Board Scope', () => {
    test('excludes positions the Phase A model does not score', () => {
      const board = buildBoard(
        [
          {
            player_id: 'wr-1',
            player_name: 'Useful Receiver',
            position: 'WR',
            team: 'KC',
            games: 17,
            fantasy_points: 100,
            fantasy_points_ppr: 170,
          },
          {
            player_id: 'pk-1',
            player_name: 'Accurate Kicker',
            position: 'PK',
            team: 'KC',
            games: 17,
            fantasy_points: 120,
            fantasy_points_ppr: 120,
          },
        ],
        [
          { player: 'Useful Receiver', player_id: 'wr-1', position: 'WR', team: 'KC', adp: 80, adp_pos_rank: 20 },
          { player: 'Accurate Kicker', player_id: 'pk-1', position: 'PK', team: 'KC', adp: 140, adp_pos_rank: null },
          { player: 'Kansas City Defense', position: 'DEF', team: 'KC', adp: 150, adp_pos_rank: null },
        ],
      );

      expect(board.map((row) => row.player)).toEqual(['Useful Receiver']);
    });
  });
});
