// tests/unit/fantasyProsProjections.test.js
// F-26c §3 — covers the pure mapping logic in agents/lib/fantasypros-projections.js.
// No network calls (that lib file makes none) — safe to run in any sandbox.
//
// MOCK_RESPONSE mirrors the REAL live-confirmed shape (Andy, 2026-08-10, raw-vs-mapped
// diagnostic dump against /nfl/2026/projections?position=QB — see git history for the
// full dump). Corrects an earlier version of this file that assumed stat/points fields
// were flat on the player object; they're actually nested under `stats`
// (player.stats.points, not player.points) — the original mapper had the same wrong
// assumption and silently mapped 0 rows in a live dry-run before this was caught.
// position_id/team_id/fpid/name ARE flat and were correct from the start.
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
      stats: {
        rush_att: 260, rush_yds: 1300, rush_tds: 11,
        rec_rec: 55, rec_yds: 450, rec_tds: 3,
        points: 245.5, points_ppr: 300.5, points_half: 273.0,
      },
    },
    {
      fpid: 23133,
      name: 'Bijan Robinson',
      position_id: 'RB',
      team_id: 'ATL',
      stats: {
        rush_att: 240, rush_yds: 1150, rush_tds: 9,
        rec_rec: 48, rec_yds: 400, rec_tds: 2,
        points: 210.0, points_ppr: 258.0, points_half: 234.0,
      },
    },
    {
      // No projection at all for this one — should be filtered out.
      fpid: 99999,
      name: 'No Projection Guy',
      position_id: 'RB',
      team_id: 'FA',
      stats: {
        rush_att: null, rush_yds: null, rush_tds: null,
        points: null, points_ppr: null, points_half: null,
      },
    },
  ],
};

// Real captured response for Josh Allen, QB, BUF (Andy, 2026-08-10 live dump) —
// trimmed to the fields mapProjections() actually reads. This is the exact
// fixture that would have caught the nested-stats bug before it shipped; keep
// it byte-faithful to the real dump, don't "clean it up".
const REAL_JOSH_ALLEN_RESPONSE = {
  season: 2026, week: '0', count: 84, players: [
    {
      fpid: 17298, mflid: 13589, name: 'Josh Allen', position_id: 'QB', team_id: 'BUF',
      filename: 'josh-allen-qb.php',
      stats: {
        points: 372.23, points_ppr: 372.23, points_half: 372.23,
        pass_att: 491.6, pass_cmp: 333.35, pass_yds: 3815.58, pass_tds: 27.41, pass_ints: 11.19,
        pass_yds_300: 0, pass_yds_400: 0,
        rush_att: 118.12, rush_yds: 585.15, rush_tds: 11.81, rush_yds_100: 0, rush_yds_200: 0,
        scrimage_yards_100: 0, scrimage_yards_200: 0, fumbles: 4.1, ret_tds: 0, '2pt_tds': 0,
      },
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
    const rows = mapProjections({ players: [{ fpid: 1, name: 'X', stats: { points_ppr: 100 } }] }, { season: 2026, week: 0, position: 'WR' });
    expect(rows[0].position).toBe('WR');
  });

  it('handles an empty/malformed response without throwing', () => {
    expect(mapProjections({}, { season: 2026 })).toEqual([]);
    expect(mapProjections(null, { season: 2026 })).toEqual([]);
  });

  it('exports the expected position list', () => {
    expect(PROJECTION_POSITIONS).toEqual(['QB', 'RB', 'WR', 'TE']);
  });

  // Regression test for the live bug found 2026-08-10: a real dry-run mapped
  // 0/84 rows because every stat field was read off the player object
  // directly instead of player.stats.*. This fixture is the actual captured
  // response, not a hand-simplified guess — if a future edit reverts to
  // reading flat fields, this is the test that catches it.
  it('regression: reads stats from the nested `stats` object, not flat on the player (2026-08-10 live bug)', () => {
    const rows = mapProjections(REAL_JOSH_ALLEN_RESPONSE, { season: 2026, week: 0, ros: false, position: 'QB' });
    expect(rows).toHaveLength(1);
    const allen = rows[0];
    expect(allen.fpid).toBe('17298');
    expect(allen.player).toBe('Josh Allen');
    expect(allen.position).toBe('QB');
    expect(allen.team).toBe('BUF');
    expect(allen.proj_ppr).toBe(372.23);
    expect(allen.proj_std).toBe(372.23);
    expect(allen.pass_att).toBe(491.6);
    expect(allen.pass_yds).toBe(3815.58);
    expect(allen.pass_td).toBe(27.41);
    expect(allen.interceptions).toBe(11.19); // real field is pass_ints, not pass_int
    expect(allen.rush_yds).toBe(585.15);
    expect(allen.rush_td).toBe(11.81);
    expect(allen.fumbles_lost).toBe(4.1); // real field is `fumbles`, not `fumbles_lost`
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
