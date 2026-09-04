import { describe, expect, it } from 'vitest';
import {
  getSunday10amPacificUtc,
  getPickDeadline,
  isGameLocked,
  formatDeadline,
} from '../../src/lib/alphaDeadlines.js';

describe('alphaDeadlines', () => {
  describe('getSunday10amPacificUtc', () => {
    it('calculates Sunday 10:00 AM PDT (UTC-7 = 17:00 UTC) during daylight saving time', () => {
      // Week 1 Thursday kickoff: Sep 10, 2026 00:20 UTC (Sep 9 5:20 PM PDT)
      const thursdayKickoff = '2026-09-10T00:20:00.000Z';
      const sunday10am = getSunday10amPacificUtc(thursdayKickoff);
      // Sunday is Sep 13, 2026. 10:00 AM PDT = 17:00 UTC.
      expect(sunday10am).toBe('2026-09-13T17:00:00.000Z');
    });

    it('calculates Sunday 10:00 AM PST (UTC-8 = 18:00 UTC) after fall-back DST switch', () => {
      // Week 11 Thursday kickoff: Nov 19, 2026 (PST is UTC-8)
      const novKickoff = '2026-11-19T01:15:00.000Z';
      const sunday10am = getSunday10amPacificUtc(novKickoff);
      // Sunday is Nov 22, 2026. 10:00 AM PST = 18:00 UTC.
      expect(sunday10am).toBe('2026-11-22T18:00:00.000Z');
    });
  });

  describe('getPickDeadline', () => {
    it('overrides deadline to kickoff_utc for Thursday night games', () => {
      const thursdayGame = {
        id: 'game_thu',
        kickoff_utc: '2026-09-10T00:20:00.000Z',
      };
      const deadline = getPickDeadline(thursdayGame);
      expect(deadline).toBe('2026-09-10T00:20:00.000Z');
    });

    it('overrides deadline to kickoff_utc for early London morning games before Sunday 10am Pacific', () => {
      // London game at 6:30 AM PDT = 13:30 UTC
      const londonGame = {
        id: 'game_london',
        kickoff_utc: '2026-10-11T13:30:00.000Z',
      };
      const deadline = getPickDeadline(londonGame);
      expect(deadline).toBe('2026-10-11T13:30:00.000Z');
    });

    it('uses Sunday 10:00 AM Pacific for early afternoon (1:00 PM Eastern / 10:00 AM Pacific) main slate', () => {
      const earlySundayGame = {
        id: 'game_sun_early',
        kickoff_utc: '2026-09-13T17:00:00.000Z',
      };
      const deadline = getPickDeadline(earlySundayGame);
      expect(deadline).toBe('2026-09-13T17:00:00.000Z');
    });

    it('uses Sunday 10:00 AM Pacific for late Sunday afternoon and Monday Night Football games', () => {
      const lateSundayGame = {
        id: 'game_sun_late',
        kickoff_utc: '2026-09-13T20:25:00.000Z',
      };
      expect(getPickDeadline(lateSundayGame)).toBe('2026-09-13T17:00:00.000Z');

      const mnfGame = {
        id: 'game_mnf',
        kickoff_utc: '2026-09-14T00:15:00.000Z',
      };
      expect(getPickDeadline(mnfGame)).toBe('2026-09-13T17:00:00.000Z');
    });
  });

  describe('isGameLocked', () => {
    it('accurately evaluates whether game is locked based on the evaluation timestamp', () => {
      const mnfGame = {
        id: 'game_mnf',
        kickoff_utc: '2026-09-14T00:15:00.000Z',
      };
      // Before Sunday 10:00 AM PDT (e.g. Sunday 9:00 AM PDT = 16:00 UTC)
      expect(isGameLocked(mnfGame, new Date('2026-09-13T16:00:00.000Z'))).toBe(false);

      // Exactly at Sunday 10:00 AM PDT
      expect(isGameLocked(mnfGame, new Date('2026-09-13T17:00:00.000Z'))).toBe(true);

      // After Sunday 10:00 AM PDT (e.g. Sunday 11:00 AM PDT = 18:00 UTC)
      expect(isGameLocked(mnfGame, new Date('2026-09-13T18:00:00.000Z'))).toBe(true);
    });
  });

  describe('formatDeadline', () => {
    it('formats deadline into human readable Pacific format', () => {
      const formatted = formatDeadline('2026-09-13T17:00:00.000Z');
      expect(formatted).toContain('Sun');
      expect(formatted).toContain('Sep 13');
      expect(formatted).toContain('10:00 AM');
      expect(formatted).toMatch(/PDT|GMT-7/);
    });
  });
});
