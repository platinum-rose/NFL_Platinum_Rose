import { describe, expect, it } from 'vitest';
import {
  resolveTargetWeek,
  buildWeekScope,
  isTranscriptInScope,
  buildWeekGameLookup,
  canonTeam,
} from '../../agents/lib/pick-week-scope.js';

// Trimmed real 2026 shapes: Week 2 SNF/MNF, Week 3 TNF/Sun/MNF, a Week 17 rematch.
const schedule = [
  { id: 'w2-snf', week: 2, home: 'KC', visitor: 'IND', kickoff_utc: '2026-09-21T00:20:00.000Z' },
  { id: 'w2-mnf', week: 2, home: 'LAR', visitor: 'NYG', kickoff_utc: '2026-09-22T00:15:00.000Z' },
  { id: 'w2-minchi', week: 2, home: 'CHI', visitor: 'MIN', kickoff_utc: '2026-09-20T17:00:00.000Z' },
  { id: 'w3-tnf', week: 3, home: 'GB', visitor: 'ATL', kickoff_utc: '2026-09-25T00:15:00.000Z' },
  { id: 'w3-buf', week: 3, home: 'BUF', visitor: 'LAC', kickoff_utc: '2026-09-27T17:00:00.000Z' },
  { id: 'w3-tb', week: 3, home: 'TB', visitor: 'MIN', kickoff_utc: '2026-09-27T20:05:00.000Z' },
  { id: 'w3-mnf', week: 3, home: 'CHI', visitor: 'PHI', kickoff_utc: '2026-09-29T00:15:00.000Z' },
  { id: 'w17-chimin', week: 17, home: 'MIN', visitor: 'CHI', kickoff_utc: '2026-12-27T18:00:00.000Z' },
];

describe('resolveTargetWeek', () => {
  it('Tuesday after MNF resolves to the next week', () => {
    expect(resolveTargetWeek(schedule, new Date('2026-09-23T02:00:00Z'))).toBe(3);
  });
  it('stays on the current week while MNF is still in progress', () => {
    expect(resolveTargetWeek(schedule, new Date('2026-09-22T02:30:00Z'))).toBe(2);
  });
  it('honours a PICK_WEEK override and rejects junk', () => {
    expect(resolveTargetWeek(schedule, new Date(), '17')).toBe(17);
    expect(() => resolveTargetWeek(schedule, new Date(), 'abc')).toThrow(/PICK_WEEK/);
  });
  it('returns null for an empty schedule', () => {
    expect(resolveTargetWeek([], new Date())).toBeNull();
  });
});

describe('isTranscriptInScope', () => {
  const scope = buildWeekScope(schedule, 3);
  it('keeps Week 3 episodes and Monday pre-MNF episodes', () => {
    expect(isTranscriptInScope('2026-09-22T17:00:00Z', null, scope)).toBe(true);
    expect(isTranscriptInScope('2026-09-21T18:00:00Z', null, scope)).toBe(true);
  });
  it('drops last week and August episodes', () => {
    expect(isTranscriptInScope('2026-09-19T12:00:00Z', null, scope)).toBe(false);
    expect(isTranscriptInScope('2026-08-26T12:00:00Z', null, scope)).toBe(false);
  });
  it('falls back to processed_at and rejects undated rows', () => {
    expect(isTranscriptInScope(null, '2026-09-22T21:37:54Z', scope)).toBe(true);
    expect(isTranscriptInScope(null, null, scope)).toBe(false);
  });
});

describe('buildWeekGameLookup', () => {
  const lookup = buildWeekGameLookup(buildWeekScope(schedule, 3).games);
  it('matches only this week\'s game, never a later rematch', () => {
    expect(lookup.get('MIN').id).toBe('w3-tb');
    expect(lookup.get('CHI').id).toBe('w3-mnf');
  });
  it('a last-week pairing (Week 2 MIN@CHI) does not resolve', () => {
    expect(lookup.get('MIN_vs_CHI')).toBeUndefined();
    expect(lookup.get('CHI_vs_MIN')).toBeUndefined();
  });
  it('resolves both orderings of a real Week 3 pairing', () => {
    expect(lookup.get('BUF_vs_LAC').id).toBe('w3-buf');
    expect(lookup.get('LAC_vs_BUF').id).toBe('w3-buf');
  });
});

describe('team-code normalisation', () => {
  const games = [{ id: 'w3-seawas', week: 3, home: 'WAS', visitor: 'SEA', kickoff_utc: '2026-09-27T17:00:00.000Z' }];
  const lookup = buildWeekGameLookup(games);
  it('a WSH-coded pick finds the WAS-coded schedule game', () => {
    expect(lookup.get(`${canonTeam('WSH')}_vs_${canonTeam('SEA')}`).id).toBe('w3-seawas');
    expect(lookup.get(canonTeam('wsh')).id).toBe('w3-seawas');
  });
  it('maps LA -> LAR and JAC -> JAX, leaves others alone', () => {
    expect(canonTeam('LA')).toBe('LAR');
    expect(canonTeam('JAC')).toBe('JAX');
    expect(canonTeam('KC')).toBe('KC');
    expect(canonTeam(null)).toBeNull();
  });
});
