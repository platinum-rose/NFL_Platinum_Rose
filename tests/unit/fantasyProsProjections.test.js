// tests/unit/fantasyProsProjections.test.js
// F-26c §3 — covers the pure mapping logic in agents/lib/fantasypros-projections.js.
// No network calls (that lib file makes none) — safe to run in any sandbox.
//
// MOCK_RESPONSE's confirmed fields (fpid, name, points*, rush_*, rec_*) mirror the
// real live-confirmed shape from docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md
// §0/§3 (2026-08-09). position/team and all pass_* fields are best-guesses — see
// fantasypros-projections.js's file header.
import { describe, it, expect } from 'vitest';
import { mapProjections, dedupeProjections, PROJECTION_POSITIONS } from '../../agents/lib/fantasypros-projections.js';

const MOCK_RESPONSE = {
  sport: 'NFL',
  year: '2026',
  week: '0',
  position_id: 'RB',
  players: [
    {
      fpid: 22968,
      name: 'Jahmyr Gibbs',
      position_id: 'RB',
      team_id: 'DET',
      rush_att: 260, rush_yds: 1300, rush_tds: 11,
      rec_rec: 55, rec_yds: 450, rec_tds: 3,
      points: 245.5, points_ppr: 300.5, points_half: 273.0,
    },
    {
      fpid: 23133,
      name: 'Bijan Robinson',
      position_id: 'RB',
      team_id: 'ATL',
      rush_att: 240, rush_yds: 1150, rush_tds: 9,
      rec_rec: 48, rec_yds: 400, rec_tds: 2,
      points: 210.0, points_ppr: 258.0, points_half: 234.0,
    },
    {
      // No projection at all for this one — should be filtered out.
      fpid: 99999,
      name: 'No Projection Guy',
      position_id: 'RB',
      team_id: 'FA',
      rush_att: null, rush_yds: null, rush_tds: null,
      points: null, points_ppr: null, points_half: null,
    },
  ],
};

describe('mapProjections', () => {
  it('maps confirmed-shape fields correctly', () => {
    const rows = mapProjections(MOCK_RESPONSE, { season: 2026, week: 0, ros: false, position: 'RB' });
    expect(rows).toHaveLength(2);
    const gibbs = rows.find((r) => r.player === 'Jahmyr Gibbs');
    expect(gibbs.fpid).toBe('22968');
    expect(gibbs.position).toBe('RB');
    expect(gibbs.team).toBe('DET');
    expect(gibbs.rush_att).toBe(260);
    expect(gibbs.rush_td).toBe(11);
    expect(gibbs.rec).toBe(55);
    expect(gibbs.rec_td).toBe(3);
    expect(gibbs.proj_std).toBe(245.5);
    expect(gibbs.proj_ppr).toBe(300.5);
    expect(gibbs.proj_half).toBe(273.0);
    expect(gibbs.season).toBe(2026);
    expect(gibbs.week).toBe(0);
    expect(gibbs.ros).toBe(false);
    expect(gibbs.source).toBe('fantasypros');
  });

  it('filters out players with no projection at all (Number(null) is 0, not NaN)', () => {
    const rows = mapProjections(MOCK_RESPONSE, { season: 2026, week: 0, ros: false, position: 'RB' });
    expect(rows.find((r) => r.player === 'No Projection Guy')).toBeUndefined();
  });

  it('falls back to the caller-supplied position when position_id is absent', () => {
    const rows = mapProjections({ players: [{ fpid: 1, name: 'X', points_ppr: 100 }] }, { season: 2026, week: 0, position: 'WR' });
    expect(rows[0].position).toBe('WR');
  });

  it('handles an empty/malformed response without throwing', () => {
    expect(mapProjections({}, { season: 2026 })).toEqual([]);
    expect(mapProjections(null, { season: 2026 })).toEqual([]);
  });

  it('exports the expected position list', () => {
    expect(PROJECTION_POSITIONS).toEqual(['QB', 'RB', 'WR', 'TE']);
  });
});

describe('dedupeProjections', () => {
  const base = { player: 'Dupe Player', position: 'WR', season: 2026, week: 0, ros: false, source: 'fantasypros', as_of_date: '2026-08-10' };

  it('keeps the higher-proj_ppr row on collision and reports the collision', () => {
    const records = [
      { ...base, proj_ppr: 150 },
      { ...base, proj_ppr: 220 },
    ];
    let collided = false;
    const out = dedupeProjections(records, { onDuplicate: () => { collided = true; } });
    expect(out).toHaveLength(1);
    expect(out[0].proj_ppr).toBe(220);
    expect(collided).toBe(true);
  });

  it('leaves distinct players untouched', () => {
    const records = [
      { ...base, player: 'A', proj_ppr: 100 },
      { ...base, player: 'B', proj_ppr: 90 },
    ];
    expect(dedupeProjections(records)).toHaveLength(2);
  });
});
