import { describe, expect, it } from 'vitest';
import { supersedeWeek1Locks, applyAvailabilityVeto } from '../../scripts/build-projected-starters.js';

const row = (team, player_name, position, source_file, extra = {}) => ({ team, player_name, position, source_file, role: 'starter', evidence_tags: [], ...extra });

describe('projected starters: stale Week 1 locks and availability veto (2026-11-04)', () => {
  it('drops a Week 1 lock when a newer weekly lock covers the same single-starter team+position', () => {
    const { kept, dropped } = supersedeWeek1Locks([
      row('BAL', 'Lamar Jackson', 'QB', 'week1-usage-locks.json'),
      row('BAL', 'Joe Fagnano', 'QB', 'week-usage-locks.json'),
      row('NYG', 'Jaxson Dart', 'QB', 'week1-usage-locks.json'),       // no newer NYG QB lock: kept
      row('BAL', 'Zay Flowers', 'WR', 'week1-usage-locks.json'),       // multi-starter position: kept
      row('BAL', 'Rashod Bateman', 'WR', 'week-usage-locks.json'),
    ]);
    expect(dropped).toEqual(['BAL Lamar Jackson QB']);
    expect(kept.map((r) => r.player_name)).toEqual(['Joe Fagnano', 'Jaxson Dart', 'Zay Flowers', 'Rashod Bateman']);
  });

  it('marks IR/OUT starters unavailable using the latest event, and leaves Q/D starters alone', () => {
    const rows = [
      row('NYG', 'Jaxson Dart', 'QB', 'week1-usage-locks.json'),
      row('JAX', 'Bhayshul Tuten', 'RB', 'week-usage-locks.json'),
      row('KC', 'Patrick Mahomes', 'QB', 'x.json'),
    ];
    const vetoed = applyAvailabilityVeto(rows, [
      { team_abbr: 'NYG', player_name: 'Jaxson Dart', normalized_status: 'QUESTIONABLE', published_at: '2026-10-30T00:00:00Z' },
      { team_abbr: 'NYG', player_name: 'Jaxson Dart', normalized_status: 'IR', published_at: '2026-11-03T00:00:00Z' },
      { team_abbr: 'JAX', player_name: 'Bhayshul Tuten', normalized_status: 'QUESTIONABLE', published_at: '2026-11-03T00:00:00Z' },
      { team_abbr: 'KC', player_name: 'Patrick Mahomes', normalized_status: 'IR', published_at: '2026-09-01T00:00:00Z' },
      { team_abbr: 'KC', player_name: 'Patrick Mahomes', normalized_status: 'ACTIVE', published_at: '2026-10-01T00:00:00Z' },
    ]);
    expect(vetoed).toEqual(['NYG Jaxson Dart QB (IR)']);
    expect(rows[0].role).toBe('unavailable');
    expect(rows[1].role).toBe('starter');
    expect(rows[2].role).toBe('starter'); // returned from IR: the latest event wins
  });
});
