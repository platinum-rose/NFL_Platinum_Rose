// tests/unit/fantasyProsRankings.test.js
// F-26c part 2 — covers the pure mapping logic in agents/lib/fantasypros-rankings.js.
// No network calls (that lib file makes none) — safe to run in any sandbox.
import { describe, it, expect } from 'vitest';
import { mapConsensusRankings, scoringParam, RANKING_POSITIONS, dedupeRankings } from '../../agents/lib/fantasypros-rankings.js';

// Shape mirrors a real /nfl/2026/consensus-rankings?position=RB response, trimmed to
// what mapConsensusRankings actually reads (confirmed live 2026-08-09).
const MOCK_RESPONSE = {
  sport: 'NFL',
  type: 'Draft',
  year: '2026',
  week: '0',
  position_id: 'RB',
  scoring: 'STD',
  count: 3,
  total_experts: 90,
  players: [
    {
      player_id: 22968,
      player_name: 'Jahmyr Gibbs',
      player_team_id: 'DET',
      player_position_id: 'RB',
      player_owned_avg: 99.5,
      rank_ecr: 1,
      rank_min: '1',
      rank_max: '4',
      rank_std: '0.58',
      pos_rank: 'RB1',
      tier: 1,
    },
    {
      player_id: 23133,
      player_name: 'Bijan Robinson',
      player_team_id: 'ATL',
      player_position_id: 'RB',
      player_owned_avg: 99.1,
      rank_ecr: 2,
      rank_min: '1',
      rank_max: '5',
      rank_std: '0.71',
      pos_rank: 'RB2',
      tier: 1,
    },
    {
      // No rank_ecr at all — should be excluded, not silently coerced to rank_ecr: 0.
      player_id: 99999,
      player_name: 'Unranked Guy',
      player_team_id: 'FA',
      player_position_id: 'RB',
      player_owned_avg: null,
      rank_ecr: null,
      rank_min: null,
      rank_max: null,
      rank_std: null,
      pos_rank: null,
      tier: null,
    },
  ],
};

const MOCK_WEEKLY_RESPONSE = {
  ...MOCK_RESPONSE,
  type: 'Weekly',
  week: '1',
  total_experts: 5,
  players: MOCK_RESPONSE.players.slice(0, 2).map((p) => ({ ...p, player_opponent: 'vs. NO' })),
};

describe('mapConsensusRankings', () => {
  it('excludes players with no rank_ecr (regression: Number(null) is 0, not NaN)', () => {
    const records = mapConsensusRankings(MOCK_RESPONSE, { season: 2026, week: 0, scoring: 'ppr' });
    expect(records.some((r) => r.player === 'Unranked Guy')).toBe(false);
    expect(records.every((r) => r.rank_ecr !== null)).toBe(true);
  });

  it('maps core fields from the real API response shape', () => {
    const records = mapConsensusRankings(MOCK_RESPONSE, { season: 2026, week: 0, scoring: 'ppr' });
    const gibbs = records.find((r) => r.player === 'Jahmyr Gibbs');
    expect(gibbs).toMatchObject({
      position: 'RB',
      team: 'DET',
      season: 2026,
      week: 0,
      scoring: 'ppr',
      rank_ecr: 1,
      pos_rank: 'RB1',
      rank_min: 1,
      rank_max: 4,
      tier: 1,
      total_experts: 90,
      source: 'fantasypros',
    });
    expect(gibbs.rank_std).toBeCloseTo(0.58);
  });

  it('coerces stringified numeric fields (rank_min/rank_max/rank_std) to real numbers', () => {
    const records = mapConsensusRankings(MOCK_RESPONSE, { season: 2026, week: 0, scoring: 'ppr' });
    const gibbs = records.find((r) => r.player === 'Jahmyr Gibbs');
    expect(typeof gibbs.rank_min).toBe('number');
    expect(typeof gibbs.rank_max).toBe('number');
    expect(typeof gibbs.rank_std).toBe('number');
  });

  it('defaults week to 0 (season-long) when not passed, not null', () => {
    const records = mapConsensusRankings(MOCK_RESPONSE, { season: 2026, scoring: 'ppr' });
    expect(records.every((r) => r.week === 0)).toBe(true);
  });

  it('carries the weekly-only opponent field through when present', () => {
    const records = mapConsensusRankings(MOCK_WEEKLY_RESPONSE, { season: 2026, week: 1, scoring: 'ppr' });
    expect(records.every((r) => r.opponent === 'vs. NO')).toBe(true);
    expect(records.every((r) => r.week === 1)).toBe(true);
  });

  it('leaves opponent null for season-long (draft) rows', () => {
    const records = mapConsensusRankings(MOCK_RESPONSE, { season: 2026, week: 0, scoring: 'ppr' });
    expect(records.every((r) => r.opponent === null)).toBe(true);
  });

  it('returns an empty array for a malformed/empty response rather than throwing', () => {
    expect(mapConsensusRankings({}, { season: 2026 })).toEqual([]);
    expect(mapConsensusRankings(null, { season: 2026 })).toEqual([]);
  });
});

describe('scoringParam', () => {
  it('maps internal scoring names to the API\'s expected query values', () => {
    expect(scoringParam('ppr')).toBe('PPR');
    expect(scoringParam('half')).toBe('HALF');
    expect(scoringParam('standard')).toBe('STD');
  });

  it('defaults to PPR for an unrecognized value', () => {
    expect(scoringParam('nonsense')).toBe('PPR');
  });
});

describe('RANKING_POSITIONS', () => {
  it('matches the same QB/RB/WR/TE scope as the ADP and value-report pieces', () => {
    expect(RANKING_POSITIONS).toEqual(['QB', 'RB', 'WR', 'TE']);
  });
});

describe('dedupeRankings', () => {
  // Regression coverage for a real live failure (2026-08-09): FantasyPros'
  // consensus-rankings response contained 2 entries for the same player within one
  // position call, which Postgres rejected as "ON CONFLICT DO UPDATE command cannot
  // affect row a second time" on the real upsert.
  const base = { position: 'QB', season: 2026, week: 0, scoring: 'ppr', source: 'fantasypros', as_of_date: '2026-08-10' };

  it('collapses a duplicate (player, position, ...) key, keeping the better (lower) rank_ecr', () => {
    const records = [
      { ...base, player: 'Some Duplicate Guy', rank_ecr: 45 },
      { ...base, player: 'Some Duplicate Guy', rank_ecr: 47 },
    ];
    const deduped = dedupeRankings(records);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].rank_ecr).toBe(45);
  });

  it('fires onDuplicate exactly once per collision, not per row', () => {
    const records = [
      { ...base, player: 'Josh Allen', rank_ecr: 1 },
      { ...base, player: 'Some Duplicate Guy', rank_ecr: 45 },
      { ...base, player: 'Some Duplicate Guy', rank_ecr: 47 },
      { ...base, player: 'Lamar Jackson', rank_ecr: 2 },
    ];
    let dupeEvents = 0;
    const deduped = dedupeRankings(records, { onDuplicate: () => { dupeEvents += 1; } });
    expect(deduped).toHaveLength(3);
    expect(dupeEvents).toBe(1);
  });

  it('does not fire onDuplicate or drop anything when there are no collisions', () => {
    const records = [
      { ...base, player: 'Josh Allen', rank_ecr: 1 },
      { ...base, player: 'Lamar Jackson', rank_ecr: 2 },
    ];
    let dupeEvents = 0;
    const deduped = dedupeRankings(records, { onDuplicate: () => { dupeEvents += 1; } });
    expect(deduped).toHaveLength(2);
    expect(dupeEvents).toBe(0);
  });

  it('does not treat the same player name at a different position as a duplicate', () => {
    const records = [
      { ...base, player: 'Josh Allen', position: 'QB', rank_ecr: 1 },
      { ...base, player: 'Josh Allen', position: 'RB', rank_ecr: 99 },
    ];
    expect(dedupeRankings(records)).toHaveLength(2);
  });
});
