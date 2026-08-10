// tests/unit/fantasyProsInjuries.test.js
// F-26c §4 — covers the pure mapping logic in agents/lib/fantasypros-injuries.js.
// No network calls (that lib file makes none) — safe to run in any sandbox.
//
// IMPORTANT: the mock response shape here is a best-guess, not a confirmed live
// shape (see fantasypros-injuries.js's file header — this endpoint was built
// without a working live call from the Cowork sandbox, TASK_BOARD F-31). These
// tests verify the mapping logic behaves correctly against ITS OWN assumed
// input shape, and that the defensive fallback fields work — they do NOT prove
// the real API matches this shape. Re-run against a real captured response on
// Andy's native machine before trusting this in production.
import { describe, it, expect } from 'vitest';
import { mapFantasyProsInjury, flattenFantasyProsInjuries } from '../../agents/lib/fantasypros-injuries.js';

const MOCK_RAW = {
  player_name: 'Christian McCaffrey',
  team_id: 'SF',
  position_id: 'RB',
  status: 'Questionable',
  comment: 'Limited in practice Thursday (knee).',
  injury_update_date: '2026-09-10T18:00:00Z',
  probability_of_playing: '0.65',
  practice_1: 'DNP',
  practice_2: 'Limited',
  practice_3: 'Full',
};

describe('mapFantasyProsInjury', () => {
  it('maps a well-formed record onto the generic injury-record shape', () => {
    const rec = mapFantasyProsInjury(MOCK_RAW, { capturedAt: '2026-09-10T20:00:00.000Z' });
    expect(rec.player_name).toBe('Christian McCaffrey');
    expect(rec.team_abbr).toBe('SF');
    expect(rec.position).toBe('RB');
    expect(rec.injury_status).toBe('Questionable');
    expect(rec.short_comment).toBe('Limited in practice Thursday (knee).');
    expect(rec.reported_at).toBe('2026-09-10T18:00:00.000Z');
    expect(rec.source).toBe('FantasyPros injuries API');
    expect(rec.probability_of_playing).toBeCloseTo(0.65);
    expect(rec.practice_1).toBe('DNP');
    expect(rec.practice_2).toBe('Limited');
    expect(rec.practice_3).toBe('Full');
  });

  it('returns null when there is no player name at all', () => {
    expect(mapFantasyProsInjury({ status: 'Out' })).toBeNull();
  });

  it('falls back through alternate field-name variants', () => {
    const alt = { player: 'Alt Name', team: 'KC', position: 'WR', injury_status: 'Out', notes: 'Ankle.' };
    const rec = mapFantasyProsInjury(alt, { capturedAt: 'x' });
    expect(rec.player_name).toBe('Alt Name');
    expect(rec.team_abbr).toBe('KC');
    expect(rec.injury_status).toBe('Out');
    expect(rec.short_comment).toBe('Ankle.');
  });

  it('leaves probability_of_playing null (not 0) when the field is absent — Number(null) is 0, not NaN', () => {
    const rec = mapFantasyProsInjury({ player_name: 'No Prob Player', status: 'Active' });
    expect(rec.probability_of_playing).toBeNull();
  });
});

describe('flattenFantasyProsInjuries', () => {
  it('handles a bare-array response', () => {
    const out = flattenFantasyProsInjuries([MOCK_RAW], { capturedAt: 'x' });
    expect(out).toHaveLength(1);
  });

  it('handles a { players: [...] } container', () => {
    const out = flattenFantasyProsInjuries({ players: [MOCK_RAW] }, { capturedAt: 'x' });
    expect(out).toHaveLength(1);
  });

  it('handles a { injuries: [...] } container', () => {
    const out = flattenFantasyProsInjuries({ injuries: [MOCK_RAW] }, { capturedAt: 'x' });
    expect(out).toHaveLength(1);
  });

  it('returns an empty array for an unrecognized shape', () => {
    expect(flattenFantasyProsInjuries({ nope: true })).toEqual([]);
  });

  it('drops malformed rows (no player name) rather than throwing', () => {
    const out = flattenFantasyProsInjuries([MOCK_RAW, { status: 'Out' }], { capturedAt: 'x' });
    expect(out).toHaveLength(1);
  });
});
