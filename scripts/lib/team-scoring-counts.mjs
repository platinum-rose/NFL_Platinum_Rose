// Shared with the generated desktop page via function.toString(). Keep these
// functions self-contained so both trackers use the same counting rules.
export function extractTeamScoringCounts(summary, expectedEventId) {
  const eventId = String(summary?.header?.id || '');
  if (!eventId || (expectedEventId && eventId !== String(expectedEventId))) return {};
  const comp = summary.header.competitions?.[0];
  const teams = comp?.competitors || [];
  const norm = (t) => ({ WSH: 'WAS', JAC: 'JAX', LVR: 'LV' }[t] || t);
  const plays = summary.scoringPlays;
  const scores = teams.map((t) => Number(t.score));
  const noScore = scores.length === 2 && scores.every((s) => s === 0);
  // A missing scoring log during a nonzero-score game is unknown, not zero TDs.
  const hasLog = Array.isArray(plays) && (plays.length > 0 || noScore) && plays.every((p) => p.team?.id != null);
  const out = {};
  for (const side of teams) {
    const team = norm(side.team?.abbreviation);
    if (!team) continue;
    const mine = (plays || []).filter((p) => String(p.team?.id) === String(side.team?.id));
    // Count scoring events, never passer + receiver totals (which double-count
    // passing TDs). This also includes defensive and special-teams touchdowns.
    const td = hasLog || noScore ? mine.filter((p) => p.scoringType?.name === 'touchdown' || p.type?.abbreviation === 'TD' || /touchdown/i.test(p.type?.text || '')).length : null;
    const logFg = hasLog || noScore ? mine.filter((p) => (p.scoringType?.name === 'field-goal' || p.type?.abbreviation === 'FG') && !/miss|block|no good/i.test(p.type?.text || '')).length : null;
    const kicking = summary.boxscore?.players?.find((t) => norm(t.team?.abbreviation) === team)?.statistics?.find((g) => g.name === 'kicking');
    const idx = kicking?.keys?.indexOf('fieldGoalsMade/fieldGoalAttempts') ?? -1;
    const made = (value) => {
      const m = String(value ?? '').match(/^(\d+)\s*\/\s*\d+$/);
      return m ? Number(m[1]) : null;
    };
    let fg = idx >= 0 ? made(kicking.totals?.[idx]) : null;
    if (fg === null && idx >= 0 && kicking.athletes?.length) {
      const values = kicking.athletes.map((a) => made(a.stats?.[idx]));
      if (values.every((n) => n !== null)) fg = values.reduce((a, b) => a + b, 0);
    }
    // Totals and individual kicker rows are alternatives, never added together.
    // If the scoring log and kicking box disagree, wait for the next refresh.
    if (fg !== null && logFg !== null && fg !== logFg) fg = null;
    else if (fg === null) fg = logFg;
    out[team] = { eventId, touchdowns: td, fieldGoals: fg, completed: comp.status?.type?.completed === true, state: comp.status?.type?.state || '', clock: comp.status?.displayClock || '', period: comp.status?.period || 0 };
  }
  return out;
}

export function gradeTeamCountLeg(leg, counts) {
  const team = ({ WSH: 'WAS', JAC: 'JAX', LVR: 'LV' }[leg.team] || leg.team);
  const data = counts?.[team];
  const isTd = leg.market === 'team_touchdowns';
  const value = data?.[isTd ? 'touchdowns' : 'fieldGoals'];
  const label = `${team} ${isTd ? 'TD' : 'FG made'}`;
  if (!['team_touchdowns', 'team_field_goals'].includes(leg.market) || !data || (leg.eventId && String(leg.eventId) !== data.eventId) || !Number.isFinite(value) || leg.line == null || !Number.isFinite(Number(leg.line))) {
    return { status: 'CHECK', locked: false, now: `${label}: awaiting box score`, value: null };
  }
  const line = Number(leg.line);
  const over = leg.direction !== 'under';
  let status = data.state === 'pre' ? 'PENDING' : 'LIVE';
  if (over && value > line) status = 'WON';
  else if (!over && value > line) status = 'LOST';
  else if (data.completed) status = value === line ? 'PUSH' : over ? 'LOST' : 'WON';
  return { status, value, locked: ['WON', 'LOST', 'PUSH'].includes(status), lean: over ? 'behind' : 'ahead', now: `${value} ${label}${status === 'LIVE' ? ` · ${over ? 'needs ' + (Math.floor(line) + 1 - value) + ' more' : 'under ' + line + ' still open'}` : ''}` };
}
