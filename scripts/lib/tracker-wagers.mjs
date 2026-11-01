import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const nameKey = (name) => String(name || '').toLowerCase().replace(/[.'’]/g, '').replace(/\b(jr|sr|ii|iii|iv)\b/g, '').replace(/\s+/g, ' ').trim();
const teamKey = (team) => ({ WSH: 'WAS', JAC: 'JAX', LVR: 'LV' }[team] || team);

// Fill missing tracking coordinates only, using vetted roster evidence. Never
// persist inferred fields to the official receipt ledger or change its prices.
export function resolveTrackerLegs(wagers, { roster, schedule, now = Date.now() }) {
  const out = structuredClone(wagers);
  for (const wager of out) for (const leg of wager.legs || []) {
    if (leg.player && (!leg.team || !leg.game)) {
      const age = now - Date.parse(roster.generated_at);
      if (!Number.isFinite(age) || age > 24 * 60 * 60 * 1000) throw new Error('Tracker roster evidence is stale; refresh the roster gate');
      const matches = Object.entries(roster.players).filter(([name]) => nameKey(name) === nameKey(leg.player));
      const teams = [...new Set(matches.flatMap(([, rows]) => rows.map((r) => teamKey(r.team))))];
      if (teams.length !== 1) throw new Error(`Cannot safely resolve tracker player: ${leg.player}`);
      const team = leg.team || teams[0];
      const games = schedule.filter((g) => Number(g.week) === Number(wager.week) && Number(g.season) === Number(wager.season) && [teamKey(g.visitor), teamKey(g.home)].includes(teamKey(team)));
      if (games.length !== 1) throw new Error(`Cannot safely resolve tracker matchup: ${leg.player}`);
      const game = games[0];
      leg.team ||= team;
      leg.opponent ||= teamKey(game.home) === teamKey(team) ? game.visitor : game.home;
      leg.game ||= `${game.visitor} @ ${game.home}`;
      leg.game_id ||= game.game_id;
      leg.kickoff_utc ||= game.kickoff_utc;
    }
    if (leg.market === 'anytime_td') {
      leg.market = 'anytime_touchdown';
      leg.line ??= 0.5;
      leg.direction = 'over';
    }
    if (leg.market === 'passing_tds') leg.market = 'passing_touchdowns';
    // Receipt direction labels must not fall into the counting grader's under
    // branch: Yes / at_least mean an over on the stored half-point threshold.
    if (['yes', 'at_least', 'more', 'higher'].includes(leg.direction)) leg.direction = 'over';
    if (['no', 'at_most', 'less', 'lower'].includes(leg.direction)) leg.direction = 'under';
  }
  return out;
}

export async function prepareTrackerWagers(wagers, root) {
  const needsRoster = wagers.some((w) => (w.legs || []).some((l) => l.player && (!l.team || !l.game)));
  let roster = { players: {} };
  if (needsRoster) {
    const dir = path.join(root, 'data/nfl-rosters');
    const files = (await readdir(dir)).filter((f) => /^espn-full-rosters-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    if (!files.length) throw new Error('No vetted tracker roster evidence');
    roster = JSON.parse(await readFile(path.join(dir, files.at(-1)), 'utf8'));
  }
  const schedule = JSON.parse(await readFile(path.join(root, 'public/schedule.json'), 'utf8'));
  return resolveTrackerLegs(wagers, { roster, schedule });
}
