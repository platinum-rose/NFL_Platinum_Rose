import { describe, it, expect } from 'vitest';
import { getGameOptions } from '../../src/lib/betEntryGameOptions.js';

/**
 * Checkpoint 4 (2026-08-22) focused audit smoke test for UNIFIED_REPAIR_PLAN
 * item 1 / Checkpoint 4 item 13's "Bankroll popup from schedule-shaped
 * game" requirement.
 *
 * Reproduces the Checkpoint 1 bug directly: BetEntryModal's game
 * normalization previously assumed old-style away_team/home_team fields
 * and could produce blank team options / "undefined @ undefined" labels
 * against the real schedule.json shape (visitor/home/visitorName/
 * homeName). getGameOptions() was extracted verbatim from BetEntryModal.jsx
 * so this exercises the real production code, not a re-implementation.
 *
 * Run: npx vitest run tests/unit/betEntryGameOptions.test.js
 */
describe('getGameOptions (Bankroll popup game normalization)', () => {
  it('resolves two real team options from schedule-shaped fields (visitor/home/visitorName/homeName)', () => {
    const schedule = [
      {
        id: 'nfl_2026_1_w01_CAR_at_ARI',
        visitor: 'CAR',
        home: 'ARI',
        visitorName: 'Carolina Panthers',
        homeName: 'Arizona Cardinals',
      },
    ];
    const options = getGameOptions(schedule);
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe('nfl_2026_1_w01_CAR_at_ARI');
    expect(options[0].label).toBe('Carolina Panthers @ Arizona Cardinals');
    expect(options[0].teams).toEqual(['CAR', 'ARI']);
    expect(options[0].label).not.toMatch(/undefined/);
  });

  it('falls back to legacy away_team/home_team fields when schedule-shaped fields are absent', () => {
    const schedule = [{ away_team: 'DET', home_team: 'CIN' }];
    const options = getGameOptions(schedule);
    expect(options[0].teams).toEqual(['DET', 'CIN']);
    expect(options[0].label).toBe('DET @ CIN');
    expect(options[0].label).not.toMatch(/undefined/);
  });

  it('never renders "undefined @ undefined" for a game missing every team field', () => {
    const options = getGameOptions([{ id: 'malformed-game' }]);
    expect(options[0].label).toBe('TBD @ TBD');
    expect(options[0].teams).toEqual([]);
  });

  it('returns an empty list for an empty/missing schedule instead of throwing', () => {
    expect(getGameOptions([])).toEqual([]);
    expect(getGameOptions()).toEqual([]);
  });

  it('derives a stable id from visitor/home abbreviations when the game has no id field', () => {
    const options = getGameOptions([{ visitor: 'TB', home: 'NYJ' }]);
    expect(options[0].id).toBe('TB-NYJ');
  });
});
