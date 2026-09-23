// agents/lib/pick-week-scope.js
// Week scoping for agents/pick-extraction.js (added 2026-09-22).
//
// Problem this fixes: pick-extraction promoted EVERY unpromoted transcript
// (back to August) and matched picks against all 272 season games, so the
// "last game in the file" won a team-pair / single-team lookup (often Week 18,
// or the second meeting of division rivals). Stale Week 1-2 picks would have
// landed in user_picks with this week's created_at and looked like current
// expert picks to the weekly synthesis session.
//
// Rules:
//   1. Target week = week of the earliest game that has not finished
//      (kickoff + IN_PROGRESS_GRACE_MS still in the future). PICK_WEEK env
//      overrides it.
//   2. A transcript is only considered if its episode pub_date (fallback:
//      transcript processed_at) falls inside the week's window:
//      [prev week's last kickoff - PRE_WEEK_LOOKBACK_MS, this week's last
//      kickoff + grace]. Out-of-window transcripts are skipped untouched.
//   3. A pick is only promoted if it matches a game IN the target week.
//      Picks for other weeks (recaps, look-aheads) are skipped, never given
//      a synthetic podcast_* game id.

export const IN_PROGRESS_GRACE_MS = 4.5 * 60 * 60 * 1000;
export const PRE_WEEK_LOOKBACK_MS = 36 * 60 * 60 * 1000;

function kickoffMs(game) {
  const ms = Date.parse(game?.kickoff_utc ?? '');
  return Number.isNaN(ms) ? null : ms;
}

export function resolveTargetWeek(schedule, now = new Date(), override = undefined) {
  if (override !== undefined && override !== null && String(override).trim() !== '') {
    const week = Number(override);
    if (!Number.isInteger(week) || week < 1) throw new Error(`Invalid PICK_WEEK override: "${override}"`);
    return week;
  }
  const nowMs = now.getTime();
  let best = null;
  for (const game of schedule ?? []) {
    const k = kickoffMs(game);
    if (k === null || !Number.isInteger(game.week)) continue;
    if (k + IN_PROGRESS_GRACE_MS > nowMs && (best === null || k < best.k)) best = { k, week: game.week };
  }
  return best ? best.week : null;
}

export function buildWeekScope(schedule, week) {
  const games = (schedule ?? []).filter((g) => g.week === week && kickoffMs(g) !== null);
  if (games.length === 0) return null;
  const kicks = games.map(kickoffMs);
  const firstKick = Math.min(...kicks);
  const lastKick = Math.max(...kicks);
  const prevKicks = (schedule ?? []).filter((g) => g.week === week - 1).map(kickoffMs).filter((k) => k !== null);
  const anchor = prevKicks.length ? Math.max(...prevKicks) : firstKick - 7 * 24 * 60 * 60 * 1000;
  return {
    week,
    games,
    windowStart: new Date(anchor - PRE_WEEK_LOOKBACK_MS),
    windowEnd: new Date(lastKick + IN_PROGRESS_GRACE_MS),
  };
}

export function isTranscriptInScope(pubDate, processedAt, scope) {
  const ms = Date.parse(pubDate ?? processedAt ?? '');
  if (Number.isNaN(ms) || !scope) return false;
  return ms >= scope.windowStart.getTime() && ms <= scope.windowEnd.getTime();
}

// Same key shape the agent always used ("HOME_vs_VIS", both orders, plus a
// single-team fallback) but built ONLY from the target week's games, so every
// key is unique (each team plays at most once per week).
export function buildWeekGameLookup(games) {
  const lookup = new Map();
  for (const game of games ?? []) {
    if (!game.home || !game.visitor) continue;
    lookup.set(`${game.home}_vs_${game.visitor}`, game);
    lookup.set(`${game.visitor}_vs_${game.home}`, game);
    lookup.set(game.home, game);
    lookup.set(game.visitor, game);
  }
  return lookup;
}
