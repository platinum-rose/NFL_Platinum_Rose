/**
 * currentSlate — pick the "current/next unplayed slate" out of a full
 * season's schedule, so the dashboard can default to a scan-sized set of
 * games instead of rendering all ~320 at once.
 *
 * A "slate" is every game sharing the same (season_type, week). Games are
 * grouped by slate, slates are ordered by (season_type, week) ascending, and
 * the first slate containing at least one game that hasn't finished yet is
 * the active one. If the entire schedule is already final, the last slate
 * is used as a fallback so there's always something to show.
 */

// Playoff week-number → display label (weeks 19-22, matching the app's
// getNFLWeekInfo() convention in src/lib/constants.js).
const PLAYOFF_WEEK_LABELS = { 19: 'Wild Card', 20: 'Divisional', 21: 'Conference', 22: 'Super Bowl' };

const isUnplayed = (g) => g.status !== 'post' && g.status !== 'STATUS_FINAL';

const slateKeyOf = (g) => Number(g.season_type) * 100 + Number(g.week);

/**
 * Build a human label for a (season_type, week) slate from a sample game.
 * @param {object} sampleGame
 * @returns {string}
 */
export const slateLabelFor = (sampleGame) => {
  if (!sampleGame) return 'Current Slate';
  const seasonType = Number(sampleGame.season_type);
  const week = Number(sampleGame.week);
  if (seasonType === 1) return `Preseason Week ${week}`;
  if (week <= 18) return `Week ${week}`;
  return PLAYOFF_WEEK_LABELS[week] || `Week ${week}`;
};

/**
 * @param {Array<object>} games — schedule entries with season_type, week,
 *   id, and status fields.
 * @returns {{ids: Set<string>, label: string, count: number}|null}
 */
export const getCurrentSlate = (games) => {
  if (!games || games.length === 0) return null;

  const groups = new Map();
  games.forEach(g => {
    const k = slateKeyOf(g);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(g);
  });

  const keys = [...groups.keys()].sort((a, b) => a - b);
  const nextUnplayedKey = keys.find(k => groups.get(k).some(isUnplayed));
  const activeKey = nextUnplayedKey ?? keys[keys.length - 1];
  const slateGames = groups.get(activeKey) || [];

  return {
    ids: new Set(slateGames.map(g => g.id)),
    label: slateLabelFor(slateGames[0]),
    count: slateGames.length,
  };
};
