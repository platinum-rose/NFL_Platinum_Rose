// tests/unit/fantasyProsAdp.test.js
// F-26c part 1 — covers the pure mapping/ranking logic in agents/lib/fantasypros-adp.js.
// No network calls (that lib file makes none) — safe to run in any sandbox.
import { describe, it, expect } from 'vitest';
import { rankPositions, mapFantasyProsPlayers, ADP_POSITIONS } from '../../agents/lib/fantasypros-adp.js';

const MOCK_PLAYERS = [
  { player_name: 'Jahmyr Gibbs', position_id: 'RB', team_id: 'DET', rank_adp: 2, rank_adp_ppr: 1 },
  { player_name: 'Bijan Robinson', position_id: 'RB', team_id: 'ATL', rank_adp: 3, rank_adp_ppr: 2 },
  { player_name: "Ja'Marr Chase", position_id: 'WR', team_id: 'CIN', rank_adp: 1, rank_adp_ppr: 3 },
  { player_name: 'Atlanta Falcons', position_id: 'DST', team_id: 'ATL', rank_adp: 310, rank_adp_ppr: 244 },
  { player_name: 'No ADP Guy', position_id: 'WR', team_id: 'FA', rank_adp: null, rank_adp_ppr: null },
];

describe('mapFantasyProsPlayers', () => {
  it('filters to QB/RB/WR/TE only, dropping team DST rows', () => {
    const records = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09' });
    expect(records.some((r) => r.position === 'DST')).toBe(false);
    expect(records.every((r) => ADP_POSITIONS.includes(r.position))).toBe(true);
  });

  it('excludes players with a null ADP for the requested scoring format (regression: Number(null) is 0, not NaN)', () => {
    const records = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09' });
    expect(records.some((r) => r.player === 'No ADP Guy')).toBe(false);
    expect(records.every((r) => Number.isFinite(r.adp))).toBe(true);
  });

  it('selects rank_adp_ppr for ppr scoring and rank_adp for standard scoring', () => {
    const ppr = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09' });
    const std = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'standard', asOf: '2026-08-09' });
    const gibbsPpr = ppr.find((r) => r.player === 'Jahmyr Gibbs');
    const gibbsStd = std.find((r) => r.player === 'Jahmyr Gibbs');
    expect(gibbsPpr.adp).toBe(1); // rank_adp_ppr
    expect(gibbsStd.adp).toBe(2); // rank_adp
  });

  it('computes a 1-based positional rank per position, sorted by adp ascending', () => {
    const records = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09' });
    const gibbs = records.find((r) => r.player === 'Jahmyr Gibbs'); // adp 1 (PPR)
    const bijan = records.find((r) => r.player === 'Bijan Robinson'); // adp 2 (PPR)
    expect(gibbs.adp_pos_rank).toBe(1);
    expect(bijan.adp_pos_rank).toBe(2);
  });

  it('computes adp_round as ceil(adp / teams), minimum 1', () => {
    const records = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09', teams: 12 });
    const chase = records.find((r) => r.player === "Ja'Marr Chase"); // adp 3 (PPR) -> round 1
    expect(chase.adp_round).toBe(1);
  });

  it('stamps source and as_of_date onto every row', () => {
    const records = mapFantasyProsPlayers(MOCK_PLAYERS, { scoring: 'ppr', asOf: '2026-08-09' });
    expect(records.every((r) => r.source === 'fantasypros')).toBe(true);
    expect(records.every((r) => r.as_of_date === '2026-08-09')).toBe(true);
  });
});

describe('rankPositions', () => {
  it('leaves non-finite values unranked (null) and sorted last', () => {
    const rows = [
      { position: 'WR', val: 5 },
      { position: 'WR', val: null },
      { position: 'WR', val: 1 },
    ];
    rankPositions(rows, 'val');
    expect(rows.find((r) => r.val === 1).val_pos_rank).toBe(1);
    expect(rows.find((r) => r.val === 5).val_pos_rank).toBe(2);
    expect(rows.find((r) => r.val === null).val_pos_rank).toBe(null);
  });

  it('ranks each position independently', () => {
    const rows = [
      { position: 'QB', val: 10 },
      { position: 'RB', val: 1 },
      { position: 'QB', val: 1 },
    ];
    rankPositions(rows, 'val');
    expect(rows.find((r) => r.position === 'RB' && r.val === 1).val_pos_rank).toBe(1);
    expect(rows.find((r) => r.position === 'QB' && r.val === 1).val_pos_rank).toBe(1);
    expect(rows.find((r) => r.position === 'QB' && r.val === 10).val_pos_rank).toBe(2);
  });
});
