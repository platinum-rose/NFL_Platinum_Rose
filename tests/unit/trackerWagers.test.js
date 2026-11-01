import { describe, expect, it } from 'vitest';
import { resolveTrackerLegs } from '../../scripts/lib/tracker-wagers.mjs';

const now = Date.parse('2026-11-01T16:00Z');
const roster = { generated_at: '2026-11-01T12:00Z', players: { 'Verified Player': [{ team: 'DAL' }] } };
const schedule = [{ week: 8, season: 2026, visitor: 'ARI', home: 'DAL', game_id: 'week8-game', kickoff_utc: '2026-11-01T18:00Z' }];
const wagers = [{ week: 8, season: 2026, legs: [{ player: 'Verified Player', market: 'anytime_td', direction: 'yes', line: null }] }];

describe('tracker-only receipt normalization', () => {
  it('resolves a missing matchup from fresh unique roster evidence without editing the receipt', () => {
    const resolved = resolveTrackerLegs(wagers, { roster, schedule, now });
    expect(resolved[0].legs[0]).toMatchObject({ team: 'DAL', game: 'ARI @ DAL', opponent: 'ARI', market: 'anytime_touchdown', direction: 'over', line: 0.5 });
    expect(wagers[0].legs[0]).not.toHaveProperty('team');
    expect(wagers[0].legs[0].market).toBe('anytime_td');
  });

  it('stops on stale or ambiguous roster evidence', () => {
    expect(() => resolveTrackerLegs(wagers, { roster, schedule, now: now + 25 * 3600000 })).toThrow('stale');
    expect(() => resolveTrackerLegs(wagers, { roster: { ...roster, players: { 'Verified Player': [{ team: 'DAL' }, { team: 'ARI' }] } }, schedule, now })).toThrow('safely resolve');
  });

  it('treats receipt Yes and at_least labels as over counting thresholds', () => {
    const tickets = [{ legs: [
      { market: 'anytime_touchdown', direction: 'yes', line: 0.5 },
      { market: 'passing_touchdowns', direction: 'at_least', line: 1.5 },
      { market: 'interceptions', direction: 'less', line: 0.5 },
    ] }];
    const normalized = resolveTrackerLegs(tickets, { roster, schedule, now });
    expect(normalized[0].legs.map((l) => l.direction)).toEqual(['over', 'over', 'under']);
    expect(normalized[0].legs.map((l) => l.line)).toEqual([0.5, 1.5, 0.5]);
  });
});
