// src/lib/alphaDeadlines.js
// ═══════════════════════════════════════════════════════════════════════════════
// Alpha Deadlines & Lock Enforcement Engine
//
// Implements the canonical pick deadline policy defined in
// docs/specs/ALPHA_PHASE3_SUPERCONTEST_SURVIVOR_HANDOFF.md §5:
//
// 1. Default deadline: Sunday 10:00 AM Pacific (America/Los_Angeles) for that
//    game's scheduled NFL week slate.
// 2. Kickoff override: If a game's kickoff_utc is BEFORE Sunday 10:00 AM Pacific
//    (Thursday Night Football, Friday/Saturday specials, London/Munich morning games),
//    the deadline is that game's own kickoff_utc.
// 3. Late Sunday afternoon, Sunday night, and Monday night games lock at Sunday
//    10:00 AM Pacific (standard pool cutoff rule).
// 4. Live evaluation: Callers evaluate lock status dynamically at the moment of
//    selection, edit, confirm, or grading, never relying on stale render caches.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Derives the Sunday 10:00 AM Pacific UTC timestamp for the NFL week containing the given kickoff.
 * @param {string|Date} kickoff - ISO timestamp or Date object
 * @returns {string} ISO UTC timestamp representing Sunday 10:00 AM Pacific
 */
export function getSunday10amPacificUtc(kickoff) {
  if (!kickoff) return null;
  const d = typeof kickoff === 'string' ? new Date(kickoff) : kickoff;
  if (Number.isNaN(d.getTime())) return null;

  const pacificFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour12: false,
    hour: 'numeric',
  });

  const parts = pacificFormatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const pYear = parseInt(map.year, 10);
  const pMonth = parseInt(map.month, 10);
  const pDay = parseInt(map.day, 10);
  const weekday = map.weekday;

  // Day offsets from Pacific weekday to the Sunday of that NFL week (Tue->Mon window)
  const dayOffsets = {
    Tue: 5,
    Wed: 4,
    Thu: 3,
    Fri: 2,
    Sat: 1,
    Sun: 0,
    Mon: -1,
  };

  const diffDays = dayOffsets[weekday] ?? 0;
  const sundayUtcDate = new Date(Date.UTC(pYear, pMonth - 1, pDay + diffDays, 12, 0, 0));
  const sYear = sundayUtcDate.getUTCFullYear();
  const sMonth = String(sundayUtcDate.getUTCMonth() + 1).padStart(2, '0');
  const sDay = String(sundayUtcDate.getUTCDate()).padStart(2, '0');

  // Test at 17:00 UTC (10:00 AM PDT) and adjust if standard time (PST) requires 18:00 UTC
  const testIso = `${sYear}-${sMonth}-${sDay}T17:00:00Z`;
  const testDate = new Date(testIso);
  const testHourLA = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    }).format(testDate),
    10
  );

  const diffHour = 10 - testHourLA;
  const sunday10amUtcMs = testDate.getTime() + diffHour * 3600000;
  return new Date(sunday10amUtcMs).toISOString();
}

/**
 * Returns the effective lock deadline for a game in ISO UTC format.
 * @param {Object} game - Game object containing kickoff_utc (or commenceTime/gameDate)
 * @returns {string|null} ISO UTC timestamp of pick deadline
 */
export function getPickDeadline(game) {
  if (!game) return null;
  const kickoffStr = game.kickoff_utc || game.commenceTime || (game.gameDate ? `${game.gameDate}T17:00:00.000Z` : null);
  if (!kickoffStr) return null;

  const kickoffDate = new Date(kickoffStr);
  if (Number.isNaN(kickoffDate.getTime())) return null;

  const sunday10amIso = getSunday10amPacificUtc(kickoffDate);
  if (!sunday10amIso) return kickoffDate.toISOString();

  const sunday10amDate = new Date(sunday10amIso);

  // If kickoff is earlier than Sunday 10am Pacific (Thu, Fri, Sat, early Sunday London/Munich),
  // the deadline is the game's kickoff. Otherwise, Sunday 10am Pacific.
  return kickoffDate < sunday10amDate ? kickoffDate.toISOString() : sunday10amIso;
}

/**
 * Evaluates whether a game's pick deadline has passed.
 * @param {Object} game - Game object
 * @param {Date|string|number} [now=new Date()] - Evaluation timestamp
 * @returns {boolean} True if deadline has passed
 */
export function isGameLocked(game, now = new Date()) {
  const deadline = getPickDeadline(game);
  if (!deadline) return false;
  const nowDate = typeof now === 'string' || typeof now === 'number' ? new Date(now) : now;
  return nowDate.getTime() >= new Date(deadline).getTime();
}

/**
 * Formats a deadline for UI display (Pacific Time).
 * @param {string|Date} deadline - ISO timestamp or Date
 * @returns {string} Formatted string, e.g. "Sun Sep 13, 10:00 AM PDT" or "Thu Sep 10, 5:20 PM PDT"
 */
export function formatDeadline(deadline) {
  if (!deadline) return 'TBD';
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (Number.isNaN(d.getTime())) return 'TBD';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d);
}
