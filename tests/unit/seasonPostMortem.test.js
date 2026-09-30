import { describe, expect, it } from 'vitest';
import { firstTouchdownScorer, gradeRoundRobin, gradeThreshold, normalizeTeam, thresholdFromLeg } from '../../scripts/analysis/season-post-mortem/grade.mjs';
import { simulate } from '../../scripts/analysis/season-post-mortem/simulate.mjs';

describe('season post-mortem grading primitives', () => {
  it('normalizes WSH to WAS', () => expect(normalizeTeam('WSH')).toBe('WAS'));
  it('recognizes team names containing numeric aliases', () => expect(normalizeTeam('San Francisco 49ers +4')).toBe('SF'));
  it('excludes a push from wins and losses', () => expect(gradeThreshold(45, 45, 'over').result).toBe('PUSH'));
  it('treats 1+ thresholds as inclusive rather than pushes', () => expect(gradeThreshold(1, 1, 'over', { inclusive: true }).result).toBe('WON'));
  it('uses the displayed 1+ threshold rather than the stored half-unit line', () => expect(thresholdFromLeg({ selection: 'Dallas Turner 1+ Sacks', line: 0.5 })).toBe(1));
  it('uses the touchdown scorer rather than a field goal or passer for first TD', () => {
    expect(firstTouchdownScorer([{ scoringType: { name: 'field-goal' }, text: 'Kicker 45 Yd Field Goal' }, { scoringType: { name: 'touchdown' }, text: 'Receiver Name 4 Yd pass from Quarterback Name' }])).toBe('receiver name');
  });
  it('grades round robins per combo', () => {
    expect(gradeRoundRobin(['WON', 'WON', 'LOST'], 2)).toEqual(['WON', 'LOST', 'LOST']);
  });
  it('makes basket simulation repeatable and avoids duplicate games in a basket', () => {
    const rows = [{ game: 'A @ B', result: 'WON' }, { game: 'C @ D', result: 'LOST' }, { game: 'E @ F', result: 'WON' }];
    expect(simulate(rows, { trials: 25, seed: 7 })).toEqual(simulate(rows, { trials: 25, seed: 7 }));
  });
});
