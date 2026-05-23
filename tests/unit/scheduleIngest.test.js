import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── ESPN response builder ─────────────────────────────────────────────────────
function makeEspnEvent(homeAbbr, awayAbbr, id = '1') {
    return {
        id,
        status: { type: { state: 'scheduled' } },
        competitions: [{
            date: '2026-09-10T01:00:00Z',
            competitors: [
                { homeAway: 'home', team: { displayName: 'Home Team', abbreviation: homeAbbr } },
                { homeAway: 'away', team: { displayName: 'Away Team', abbreviation: awayAbbr } },
            ],
        }],
    };
}

function okResponse(events = []) {
    return {
        ok: true,
        status: 200,
        json: async () => ({ events }),
    };
}

function errResponse(status = 503) {
    return { ok: false, status };
}

// ── fetchWeek unit tests ──────────────────────────────────────────────────────
describe('fetchWeek', () => {
    let fetchWeek;

    beforeEach(async () => {
        vi.resetModules();
        // Must re-import after each reset so fetch stub is in scope
        ({ fetchWeek } = await import('../../agents/schedule-ingest.js'));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('throws when ESPN returns a non-2xx status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(503)));
        await expect(fetchWeek(2026, 2, 5)).rejects.toThrow(
            'ESPN request failed for week 5: HTTP 503',
        );
    });

    it('throws on 404', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(404)));
        await expect(fetchWeek(2026, 2, 1)).rejects.toThrow('HTTP 404');
    });

    it('returns an empty array when ESPN has no events', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse([])));
        const rows = await fetchWeek(2026, 2, 1);
        expect(rows).toEqual([]);
    });

    it('returns one row per valid ESPN event', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            okResponse([makeEspnEvent('KC', 'BUF', '42')]),
        ));
        const rows = await fetchWeek(2026, 2, 1);
        expect(rows).toHaveLength(1);
        expect(rows[0].week).toBe(1);
        expect(rows[0].season).toBe(2026);
    });

    it('skips events missing home or away team data', async () => {
        const badEvent = {
            id: '99',
            status: { type: { state: 'scheduled' } },
            competitions: [{ date: '2026-09-10T01:00:00Z', competitors: [] }],
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse([badEvent])));
        const rows = await fetchWeek(2026, 2, 1);
        expect(rows).toEqual([]);
    });

    it('passes AbortSignal to fetch', async () => {
        const mockFetch = vi.fn().mockResolvedValue(okResponse());
        vi.stubGlobal('fetch', mockFetch);
        await fetchWeek(2026, 2, 1);
        const [, init] = mockFetch.mock.calls[0];
        expect(init).toHaveProperty('signal');
    });
});

// ── per-week resilience (loop try/catch) ─────────────────────────────────────
describe('per-week resilience', () => {
    let fetchWeek;

    beforeEach(async () => {
        vi.resetModules();
        ({ fetchWeek } = await import('../../agents/schedule-ingest.js'));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('week 8 failure does not abort weeks 1-7 or 9-18', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url) => {
            const m = url.match(/week=(\d+)/);
            const week = m ? Number(m[1]) : 0;
            return week === 8 ? errResponse(503) : okResponse([]);
        }));

        const allRows = [];
        const failedWeeks = [];
        for (let week = 1; week <= 18; week += 1) {
            try {
                const rows = await fetchWeek(2026, 2, week);
                allRows.push(...rows);
            } catch (_err) {
                failedWeeks.push(week);
            }
        }

        expect(failedWeeks).toEqual([8]);
        expect(failedWeeks).toHaveLength(1);
    });

    it('multiple week failures are all collected without aborting', async () => {
        const BAD_WEEKS = new Set([3, 7, 14]);
        vi.stubGlobal('fetch', vi.fn(async (url) => {
            const m = url.match(/week=(\d+)/);
            const week = m ? Number(m[1]) : 0;
            return BAD_WEEKS.has(week) ? errResponse(500) : okResponse([]);
        }));

        const failedWeeks = [];
        for (let week = 1; week <= 18; week += 1) {
            try {
                await fetchWeek(2026, 2, week);
            } catch (_err) {
                failedWeeks.push(week);
            }
        }

        expect(failedWeeks).toEqual([3, 7, 14]);
        expect(failedWeeks).toHaveLength(3);
    });

    it('all-weeks failure still accumulates all failure records', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(503)));

        const failedWeeks = [];
        for (let week = 1; week <= 18; week += 1) {
            try {
                await fetchWeek(2026, 2, week);
            } catch (_err) {
                failedWeeks.push(week);
            }
        }

        expect(failedWeeks).toHaveLength(18);
    });
});
