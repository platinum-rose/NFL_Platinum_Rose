// --- CONFIGURATION ---
export const APP_VERSION = "v2.0 (GitHub Live)";

// Known season anchor dates: the Tuesday before Week 1 kickoff.
// Update this map each offseason (typically April/May when the schedule releases).
export const SEASON_START_DATES = {
    2024: '2024-09-03T00:00:00',
    2025: '2025-09-02T00:00:00',
    2026: '2026-09-08T00:00:00',
};

// Preseason week windows ([start, end] of each week's game slate, local
// time) -- keep in sync with PRESEASON_WEEK_STARTS in
// packages/shared/src/week-utils.js. Preseason weeks are encoded as
// 100 + week (101/102/103) everywhere a shared `week` int column is used
// (game_splits, game_odds_snapshots), so they can never collide with a real
// regular-season week number.
export const PRESEASON_WEEK_STARTS = {
    2026: [
        ['2026-08-13T00:00:00', '2026-08-16T00:00:00'],
        ['2026-08-20T00:00:00', '2026-08-24T00:00:00'],
        ['2026-08-27T00:00:00', '2026-08-30T00:00:00'],
    ],
};

/**
 * Normalize a Date to local midnight using its UTC date components.
 * ISO date strings ("YYYY-MM-DD") are parsed as UTC midnight; extracting
 * their UTC y/m/d and rebuilding as a local date gives the correct calendar
 * date for comparisons against local-time season anchors.
 * @param {Date} d
 * @returns {Date}
 */
const _normalizeDate = (d) =>
    new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/**
 * Returns the NFL season year for a given date.
 * Dates before June 1 belong to the previous season's offseason.
 * @param {Date} [now=new Date()]
 * @returns {number}
 */
export const getCurrentSeasonYear = (now = new Date()) => {
    const d = _normalizeDate(now);
    return d.getMonth() < 5 ? d.getFullYear() - 1 : d.getFullYear();
};

/**
 * Returns the season anchor Date (Tuesday before Week 1 kickoff) for the
 * given season year.  Reads VITE_SEASON_START_DATE env var first (allows
 * runtime override without a code change), falls back to SEASON_START_DATES
 * lookup, then estimates via the second Thursday of September.
 * @param {number} [year=getCurrentSeasonYear()]
 * @returns {Date}
 */
export const getSeasonStartDate = (year = getCurrentSeasonYear()) => {
    // Env-var override (set in .env: VITE_SEASON_START_DATE=YYYY-MM-DD)
    const envDate = import.meta?.env?.VITE_SEASON_START_DATE;
    if (envDate) {
        const parsed = new Date(`${envDate}T00:00:00`);
        // Only use the override if it's for the right season year.
        if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() === year) {
            return parsed;
        }
    }

    // Known-date lookup
    if (SEASON_START_DATES[year]) {
        return new Date(SEASON_START_DATES[year]);
    }

    // Estimation fallback: second Thursday of September minus 2 days (Tuesday anchor).
    const sep1 = new Date(`${year}-09-01T00:00:00`);
    const dayOfWeek = sep1.getDay(); // 0=Sun…6=Sat
    const daysToFirstThursday = (4 - dayOfWeek + 7) % 7;
    const secondThursday = new Date(sep1);
    secondThursday.setDate(1 + daysToFirstThursday + 7);
    secondThursday.setDate(secondThursday.getDate() - 2); // back to Tuesday
    return secondThursday;
};

/**
 * Derive current NFL week and phase from date.
 * Returns { week: number, phase: string, label: string, season: number }
 * @param {Date} [now=new Date()]
 */
export const getNFLWeekInfo = (now = new Date()) => {
    const d = _normalizeDate(now);
    const season = getCurrentSeasonYear(d);
    const seasonStart = getSeasonStartDate(season);

    // Before season. "Current" week here means the active-or-next preseason
    // slate: once a week's games are all in the past, roll forward to the
    // next one (rather than sticking on the just-finished week) so the
    // header and splits query never go stale during the gap between
    // preseason weeks.
    if (d < seasonStart) {
        const preWindows = PRESEASON_WEEK_STARTS[season];
        let preseasonWeek = 1;
        if (preWindows) {
            const upcoming = preWindows.findIndex(([, end]) => d < new Date(end));
            preseasonWeek = upcoming === -1 ? preWindows.length : upcoming + 1;
        }
        return { week: 100 + preseasonWeek, phase: 'preseason', label: `PRESEASON WEEK ${preseasonWeek}`, season };
    }

    const diffDays = Math.floor((d - seasonStart) / (1000 * 60 * 60 * 24));
    const rawWeek = Math.floor(diffDays / 7) + 1;

    if (rawWeek <= 18) {
        return { week: rawWeek, phase: 'regular', label: `WEEK ${rawWeek}`, season };
    }

    // Playoff mapping (approximate — weeks 19-22 after season start)
    const playoffWeek = rawWeek - 18;
    if (playoffWeek === 1) return { week: 19, phase: 'playoffs', label: 'WILD CARD', season };
    if (playoffWeek === 2) return { week: 20, phase: 'playoffs', label: 'DIVISIONAL', season };
    if (playoffWeek === 3) return { week: 21, phase: 'playoffs', label: 'CONFERENCE', season };
    if (playoffWeek === 4) return { week: 22, phase: 'playoffs', label: 'SUPER BOWL', season };

    return { week: rawWeek, phase: 'offseason', label: 'OFFSEASON', season };
};

export const CURRENT_WEEK = getNFLWeekInfo().week;

// --- STORAGE KEYS ---
// We only need this one so your "My Card" saves to your browser
export const STORAGE_KEY_BETS = 'platinum_rose_bets_v17';

// --- EXPERTS ---
// Re-export from unified experts.js for backward compatibility
export { INITIAL_EXPERTS, EXPERTS, findExpert } from './experts.js';

// Note: WEEK_17_SCHEDULE removed — schedule is loaded dynamically from public/schedule.json
// Note: INITIAL_EXPERTS is now defined in experts.js and re-exported above