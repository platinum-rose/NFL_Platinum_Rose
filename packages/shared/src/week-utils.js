'use strict';

/**
 * NFL week utilities — shared between game-odds-ingest.js and
 * betting-splits-ingest.js.
 *
 * Uses UTC-based arithmetic throughout to avoid DST ambiguity.
 *
 * Season anchors (Tuesday before Week 1 kickoff, UTC) are hardcoded per
 * season from the real published schedule -- mirrors SEASON_START_DATES in
 * src/lib/constants.js. Keep these two tables in sync each offseason. A
 * generic "first Thursday of September" formula is used as a fallback for
 * seasons not yet in the table, but it is only an estimate: for 2026 it is
 * off by a full week (computes 2026-09-01 vs the real 2026-09-08 opener),
 * which is exactly the kind of drift that misclassifies real games, so add
 * the real date here as soon as the schedule is announced instead of
 * relying on the fallback.
 */
const SEASON_START_DATES = {
  2024: '2024-09-03T00:00:00Z',
  2025: '2025-09-02T00:00:00Z',
  2026: '2026-09-08T00:00:00Z',
};

/**
 * Preseason week boundaries (first game night of each preseason week, UTC).
 * Preseason weeks are encoded as 100 + week (101/102/103) so they can never
 * collide with a real regular-season `week` value in shared int columns
 * (game_splits.week, game_odds_snapshots.week) -- regular season only goes
 * up to week 22 (Super Bowl), so 101-103 is always unambiguous.
 */
const PRESEASON_WEEK_STARTS = {
  // [start, end] of each preseason week's game window (UTC, inclusive).
  2026: [
    ['2026-08-13T00:00:00Z', '2026-08-16T00:00:00Z'],
    ['2026-08-20T00:00:00Z', '2026-08-24T00:00:00Z'],
    ['2026-08-27T00:00:00Z', '2026-08-30T00:00:00Z'],
  ],
};

/**
 * Returns the NFL week number for a given kickoff datetime. Regular-season
 * (and playoff) weeks return their normal 1-based number. Preseason weeks
 * return 100 + week (101, 102, or 103) -- see PRESEASON_WEEK_STARTS above.
 *
 * @param {string|Date} dt   - Kickoff time (ISO 8601 string or Date object).
 * @param {number}      season - Four-digit season year (e.g. 2026).
 * @returns {number}
 */
function weekFromDate(dt, season) {
  // Parse to UTC milliseconds; ISO strings stay UTC-clean.
  const kickoffMs = typeof dt === 'string' ? Date.parse(dt) : dt.getTime();

  let week1StartMs;
  if (SEASON_START_DATES[season]) {
    week1StartMs = Date.parse(SEASON_START_DATES[season]);
  } else {
    // Fallback estimate: first Thursday of September (Tuesday anchor).
    const sep1Ms = Date.UTC(season, 8, 1); // month 8 = September (0-indexed)
    const sep1DayOfWeek = new Date(sep1Ms).getUTCDay();
    const daysToThu = (4 - sep1DayOfWeek + 7) % 7;
    const week1ThuMs = sep1Ms + daysToThu * 86400000;
    week1StartMs = week1ThuMs - 2 * 86400000;
  }

  if (kickoffMs < week1StartMs) {
    const preWindows = PRESEASON_WEEK_STARTS[season];
    let preseasonWeek = 1;
    if (preWindows) {
      // Prefer an exact window match (a real game always falls inside one).
      const exact = preWindows.findIndex(
        ([start, end]) => kickoffMs >= Date.parse(start) && kickoffMs < Date.parse(end)
      );
      if (exact !== -1) {
        preseasonWeek = exact + 1;
      } else {
        // Fallback: largest window start at or before kickoff (handles a
        // reschedule that lands just outside the known window).
        for (let i = preWindows.length - 1; i >= 0; i--) {
          if (kickoffMs >= Date.parse(preWindows[i][0])) {
            preseasonWeek = i + 1;
            break;
          }
        }
      }
    }
    return 100 + preseasonWeek;
  }

  const diffDays = Math.floor((kickoffMs - week1StartMs) / 86400000);
  return Math.max(1, Math.ceil(diffDays / 7));
}

/**
 * Builds a stable game ID from team abbreviations, kickoff time, and season.
 *
 * Format: `{season}_{WW}_{home}_{away}` — e.g. `2026_01_KC_BUF`.
 *
 * @param {string} homeAbbr
 * @param {string} awayAbbr
 * @param {string|Date} startTime
 * @param {number} season
 * @returns {string}
 */
function buildGameId(homeAbbr, awayAbbr, startTime, season) {
  const week = weekFromDate(startTime, season);
  const ww = String(week).padStart(2, '0');
  return `${season}_${ww}_${homeAbbr}_${awayAbbr}`;
}

module.exports = { weekFromDate, buildGameId };
