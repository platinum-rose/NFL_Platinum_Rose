// Cross-feed processing order for agents/podcast-ingest.js.
//
// 2026-09-19: the ingest processed feeds one at a time in a fixed order under a single
// MAX_PER_RUN cap, so the first feeds (The Favorites, Sharp or Square, Even Money) used the
// whole budget — often on stale Week 1 episodes — while Action Network, BettingPros, Move the
// Sticks, The Athletic, Sharp Football and PFF were never reached. Now every feed is discovered
// first, then candidates are processed newest-first across ALL feeds, and episodes older than
// maxAgeDays are left queued (not errored) so a deliberate backfill can still pick them up.

export const DEFAULT_MAX_EPISODE_AGE_DAYS = 10;

export function planEpisodeQueue(candidates = [], { now = new Date(), maxAgeDays = DEFAULT_MAX_EPISODE_AGE_DAYS } = {}) {
  const nowMs = new Date(now).getTime();
  const cutoffMs = Number.isFinite(maxAgeDays) && maxAgeDays > 0 ? nowMs - maxAgeDays * 864e5 : -Infinity;
  const ts = (ep) => {
    const t = Date.parse(ep?.pub_date ?? '');
    return Number.isNaN(t) ? null : t;
  };
  const tooOld = [];
  const eligible = [];
  for (const ep of candidates) {
    const t = ts(ep);
    if (t != null && t < cutoffMs) tooOld.push(ep);
    else eligible.push(ep);
  }
  // Newest first; unknown dates go last.
  eligible.sort((a, b) => (ts(b) ?? -Infinity) - (ts(a) ?? -Infinity));
  return { queue: eligible, tooOld };
}
