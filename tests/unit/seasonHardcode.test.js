/**
 * Unit tests for SEASON-HARDCODE fix.
 *
 * Verifies that getNFLWeekInfo(), getCurrentSeasonYear(), and getSeasonStartDate()
 * return correct values for dates spanning:
 *   - preseason (before anchor date)
 *   - regular season weeks 1–18
 *   - each playoff round
 *   - offseason
 *   - year boundary (Jan → still previous season; Jun → new season)
 *   - 2027 season (no entry in SEASON_START_DATES → estimation fallback)
 *
 * Run: npx vitest run tests/unit/seasonHardcode.test.js
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// constants.js uses import.meta.env — mock it at the top level so the module
// can be imported cleanly in the node test environment.
vi.mock('../../src/lib/constants.js', async (importOriginal) => {
    const real = await importOriginal();
    return real; // use the real implementation; env stubs are applied per test
});

import {
    getCurrentSeasonYear,
    getSeasonStartDate,
    getNFLWeekInfo,
    SEASON_START_DATES,
} from '../../src/lib/constants.js';

afterEach(() => {
    vi.restoreAllMocks();
});

// ── getCurrentSeasonYear() ─────────────────────────────────────────────────────
describe('getCurrentSeasonYear()', () => {
    it('before June 1 returns previous year (offseason)', () => {
        expect(getCurrentSeasonYear(new Date('2027-02-15'))).toBe(2026);
    });

    it('June 1 belongs to the new season year', () => {
        expect(getCurrentSeasonYear(new Date('2027-06-01'))).toBe(2027);
    });

    it('July during new year = new season', () => {
        expect(getCurrentSeasonYear(new Date('2026-07-04'))).toBe(2026);
    });

    it('December mid-season = same year', () => {
        expect(getCurrentSeasonYear(new Date('2026-12-20'))).toBe(2026);
    });

    it('Jan 1 following year = previous season (offseason)', () => {
        expect(getCurrentSeasonYear(new Date('2027-01-01'))).toBe(2026);
    });
});

// ── getSeasonStartDate() ───────────────────────────────────────────────────────
describe('getSeasonStartDate()', () => {
    it('returns known 2026 anchor (Sep 8)', () => {
        const d = getSeasonStartDate(2026);
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(8); // September (0-indexed)
        expect(d.getDate()).toBe(8);
    });

    it('returns known 2025 anchor (Sep 2)', () => {
        const d = getSeasonStartDate(2025);
        expect(d.getFullYear()).toBe(2025);
        expect(d.getDate()).toBe(2);
    });

    it('returns known 2024 anchor (Sep 3)', () => {
        const d = getSeasonStartDate(2024);
        expect(d.getDate()).toBe(3);
    });

    it('2027 falls back to estimation — returns a September Tuesday', () => {
        expect(SEASON_START_DATES[2027]).toBeUndefined(); // confirms no hardcode
        const d = getSeasonStartDate(2027);
        expect(d.getFullYear()).toBe(2027);
        expect(d.getMonth()).toBe(8); // September
        // Estimated anchor is a Tuesday (getDay() === 2)
        expect(d.getDay()).toBe(2);
    });
});

// ── getNFLWeekInfo() — 2026 season ────────────────────────────────────────────
describe('getNFLWeekInfo() — 2026 season', () => {
    // 2026 anchor = Sep 8. Week 1 starts Sep 8 (day 0 of the 7-day window).

    it('preseason: Aug 1 2026', () => {
        const info = getNFLWeekInfo(new Date('2026-08-01'));
        expect(info.phase).toBe('preseason');
        expect(info.week).toBe(101);
        expect(info.label).toBe('PRESEASON WEEK 1');
        expect(info.season).toBe(2026);
    });

    it('preseason: day before anchor (Sep 7 2026)', () => {
        const info = getNFLWeekInfo(new Date('2026-09-07'));
        expect(info.phase).toBe('preseason');
    });

    it('Week 1: anchor day (Sep 8 2026)', () => {
        const info = getNFLWeekInfo(new Date('2026-09-08'));
        expect(info.week).toBe(1);
        expect(info.phase).toBe('regular');
        expect(info.label).toBe('WEEK 1');
    });

    it('Week 1: Sep 14 2026 (last day of week 1 window)', () => {
        const info = getNFLWeekInfo(new Date('2026-09-14'));
        expect(info.week).toBe(1);
    });

    it('Week 2: Sep 15 2026', () => {
        const info = getNFLWeekInfo(new Date('2026-09-15'));
        expect(info.week).toBe(2);
        expect(info.phase).toBe('regular');
    });

    it('Week 18: last regular season week', () => {
        // Week 18 starts at anchor + 17*7 = anchor + 119 days
        const anchor = new Date('2026-09-08');
        const week18Start = new Date(anchor);
        week18Start.setDate(anchor.getDate() + 17 * 7);
        const info = getNFLWeekInfo(week18Start);
        expect(info.week).toBe(18);
        expect(info.phase).toBe('regular');
    });

    it('Wild Card: week 19', () => {
        const anchor = new Date('2026-09-08');
        const wcStart = new Date(anchor);
        wcStart.setDate(anchor.getDate() + 18 * 7);
        const info = getNFLWeekInfo(wcStart);
        expect(info.week).toBe(19);
        expect(info.phase).toBe('playoffs');
        expect(info.label).toBe('WILD CARD');
    });

    it('Divisional: week 20', () => {
        const anchor = new Date('2026-09-08');
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + 19 * 7);
        const info = getNFLWeekInfo(d);
        expect(info.label).toBe('DIVISIONAL');
    });

    it('Conference: week 21', () => {
        const anchor = new Date('2026-09-08');
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + 20 * 7);
        const info = getNFLWeekInfo(d);
        expect(info.label).toBe('CONFERENCE');
    });

    it('Super Bowl: week 22', () => {
        const anchor = new Date('2026-09-08');
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + 21 * 7);
        const info = getNFLWeekInfo(d);
        expect(info.label).toBe('SUPER BOWL');
    });

    it('Offseason: well past Super Bowl', () => {
        const info = getNFLWeekInfo(new Date('2027-04-01'));
        expect(info.phase).toBe('offseason');
    });
});

// ── Year boundary: Jan/Feb 2027 still in 2026 season ─────────────────────────
describe('getNFLWeekInfo() — year boundary', () => {
    it('Jan 15 2027 → season=2026 (still in playoffs/offseason)', () => {
        const info = getNFLWeekInfo(new Date('2027-01-15'));
        expect(info.season).toBe(2026);
    });

    it('Feb 28 2027 → season=2026 (offseason)', () => {
        const info = getNFLWeekInfo(new Date('2027-02-28'));
        expect(info.season).toBe(2026);
    });

    it('Jun 1 2027 → season=2027 (new season year)', () => {
        const info = getNFLWeekInfo(new Date('2027-06-01'));
        expect(info.season).toBe(2027);
        // Before 2027 season starts → preseason
        expect(info.phase).toBe('preseason');
    });
});

// ── getNFLWeekInfo() includes season in all return objects ───────────────────
describe('getNFLWeekInfo() — season field always present', () => {
    const phases = [
        new Date('2026-08-01'), // preseason
        new Date('2026-09-08'), // week 1
        new Date('2027-01-20'), // post-season
        new Date('2027-04-15'), // offseason
    ];
    phases.forEach((date) => {
        it(`season field present for ${date.toISOString().split('T')[0]}`, () => {
            const info = getNFLWeekInfo(date);
            expect(typeof info.season).toBe('number');
            expect(info.season).toBeGreaterThan(2000);
        });
    });
});
