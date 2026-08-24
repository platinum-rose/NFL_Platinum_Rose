import { describe, it, expect } from 'vitest';
import { getCurrentSlate, slateLabelFor } from '../../src/lib/currentSlate.js';

const game = (overrides) => ({
  id: `${overrides.season_type}-${overrides.week}-${overrides.home}`,
  season_type: 1,
  week: 1,
  status: 'pre',
  home: 'AAA',
  visitor: 'BBB',
  ...overrides,
});

describe('getCurrentSlate', () => {
  it('returns null for an empty schedule', () => {
    expect(getCurrentSlate([])).toBeNull();
    expect(getCurrentSlate(null)).toBeNull();
  });

  it('picks the earliest slate that still has an unplayed game, skipping fully-final earlier slates', () => {
    const games = [
      game({ season_type: 1, week: 1, status: 'post', home: 'A1' }),
      game({ season_type: 1, week: 2, status: 'post', home: 'A2a' }),
      game({ season_type: 1, week: 2, status: 'post', home: 'A2b' }),
      game({ season_type: 1, week: 3, status: 'pre', home: 'A3a' }),
      game({ season_type: 1, week: 3, status: 'pre', home: 'A3b' }),
      game({ season_type: 2, week: 1, status: 'pre', home: 'B1' }),
    ];
    const slate = getCurrentSlate(games);
    expect(slate.count).toBe(2);
    expect([...slate.ids].sort()).toEqual(['1-3-A3a', '1-3-A3b']);
    expect(slate.label).toBe('Preseason Week 3');
  });

  it('reproduces the real 2026-08-21 schedule.json boundary: preseason week 1-2 final, week 3 next up', () => {
    const games = [
      game({ season_type: 1, week: 1, status: 'post', home: 'ARI' }),
      ...Array.from({ length: 16 }, (_, i) => game({ season_type: 1, week: 2, status: 'post', home: `T${i}` })),
      ...Array.from({ length: 16 }, (_, i) => game({ season_type: 1, week: 3, status: 'pre', home: `U${i}` })),
      ...Array.from({ length: 16 }, (_, i) => game({ season_type: 1, week: 4, status: 'pre', home: `V${i}` })),
      ...Array.from({ length: 16 }, (_, i) => game({ season_type: 2, week: 1, status: 'pre', home: `W${i}` })),
    ];
    const slate = getCurrentSlate(games);
    expect(slate.label).toBe('Preseason Week 3');
    expect(slate.count).toBe(16);
  });

  it('falls back to the last slate when the entire schedule is already final', () => {
    const games = [
      game({ season_type: 2, week: 17, status: 'post', home: 'X' }),
      game({ season_type: 2, week: 18, status: 'STATUS_FINAL', home: 'Y' }),
    ];
    const slate = getCurrentSlate(games);
    expect(slate.label).toBe('Week 18');
    expect(slate.count).toBe(1);
  });

  it('treats a slate as unplayed if ANY game in it is still pending, even if some are already final', () => {
    const games = [
      game({ season_type: 2, week: 5, status: 'post', home: 'Thu' }),
      game({ season_type: 2, week: 5, status: 'pre', home: 'Sun1' }),
      game({ season_type: 2, week: 5, status: 'pre', home: 'Sun2' }),
    ];
    const slate = getCurrentSlate(games);
    expect(slate.count).toBe(3); // whole slate included, filtering completed games is Dashboard's job
    expect(slate.label).toBe('Week 5');
  });
});

describe('slateLabelFor', () => {
  it('labels preseason, regular season, and playoff weeks', () => {
    expect(slateLabelFor({ season_type: 1, week: 3 })).toBe('Preseason Week 3');
    expect(slateLabelFor({ season_type: 2, week: 9 })).toBe('Week 9');
    expect(slateLabelFor({ season_type: 2, week: 19 })).toBe('Wild Card');
    expect(slateLabelFor({ season_type: 2, week: 22 })).toBe('Super Bowl');
  });

  it('falls back to a generic label with no sample game', () => {
    expect(slateLabelFor(null)).toBe('Current Slate');
  });
});
