const TEAM_ALIASES = {
  WAS: 'WAS', WSH: 'WAS', ARI: 'ARI', ATL: 'ATL', BAL: 'BAL', BUF: 'BUF', CAR: 'CAR', CHI: 'CHI', CIN: 'CIN', CLE: 'CLE',
  DAL: 'DAL', DEN: 'DEN', DET: 'DET', GB: 'GB', HOU: 'HOU', IND: 'IND', JAX: 'JAX', JAC: 'JAX', KC: 'KC', LV: 'LV',
  LVR: 'LV', LAC: 'LAC', LAR: 'LAR', MIA: 'MIA', MIN: 'MIN', NE: 'NE', NO: 'NO', NYG: 'NYG', NYJ: 'NYJ', PHI: 'PHI',
  PIT: 'PIT', SF: 'SF', SEA: 'SEA', TB: 'TB', TEN: 'TEN',
};

export function normalizeName(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ').replace(/\b(jr|sr|ii|iii|iv)\b/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeTeam(value = '') {
  const text = String(value).toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').trim();
  if (TEAM_ALIASES[text]) return TEAM_ALIASES[text];
  for (const [alias, code] of Object.entries(TEAM_ALIASES)) if (text.split(/\s+/).includes(alias)) return code;
  const names = {
    cardinals: 'ARI', falcons: 'ATL', ravens: 'BAL', bills: 'BUF', panthers: 'CAR', bears: 'CHI', bengals: 'CIN', browns: 'CLE',
    cowboys: 'DAL', broncos: 'DEN', lions: 'DET', packers: 'GB', texans: 'HOU', colts: 'IND', jaguars: 'JAX', chiefs: 'KC',
    raiders: 'LV', chargers: 'LAC', rams: 'LAR', dolphins: 'MIA', vikings: 'MIN', patriots: 'NE', saints: 'NO', giants: 'NYG',
    jets: 'NYJ', eagles: 'PHI', steelers: 'PIT', '49ers': 'SF', seahawks: 'SEA', buccaneers: 'TB', titans: 'TEN', commanders: 'WAS',
  };
  const lowered = text.toLowerCase();
  return Object.entries(names).find(([name]) => lowered.includes(name))?.[1] ?? null;
}

function numeric(value) {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function boxSummary(box) {
  const competitors = box.header?.competitions?.[0]?.competitors || [];
  const teams = Object.fromEntries(competitors.map((entry) => [
    normalizeTeam(entry.team?.abbreviation), { score: numeric(entry.score), homeAway: entry.homeAway },
  ]).filter(([team]) => team));
  const players = new Map();
  for (const teamGroup of box.boxscore?.players || []) {
    const team = normalizeTeam(teamGroup.team?.abbreviation);
    for (const statGroup of teamGroup.statistics || []) {
      for (const athlete of statGroup.athletes || []) {
        const name = normalizeName(athlete.athlete?.displayName);
        if (!name) continue;
        if (!players.has(name)) players.set(name, { team, name: athlete.athlete.displayName, stats: {} });
        const target = players.get(name);
        statGroup.keys.forEach((key, index) => { target.stats[key] = athlete.stats?.[index] ?? '0'; });
      }
    }
  }
  return { teams, players, scoringPlays: box.scoringPlays || [] };
}

function stat(player, keys) {
  for (const key of keys) if (player?.stats?.[key] != null) return numeric(player.stats[key]);
  return null;
}

function statOrZero(player, keys) {
  return stat(player, keys) ?? 0;
}

function playerFor(summary, requested) {
  const name = normalizeName(requested);
  if (summary.players.has(name)) return summary.players.get(name);
  const last = name.split(' ').at(-1);
  const matches = [...summary.players.values()].filter((p) => normalizeName(p.name).split(' ').at(-1) === last);
  return matches.length === 1 ? matches[0] : null;
}

export function thresholdFromLeg(leg) {
  const text = String(leg.selection || '');
  const plus = text.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (plus) return Number(plus[1]);
  if (Number.isFinite(Number(leg.line))) return Math.abs(Number(leg.line));
  const over = text.match(/(?:over|at least)\s+(\d+(?:\.\d+)?)/i);
  return over ? Number(over[1]) : null;
}

export function directionFromLeg(leg) {
  const text = String(leg.selection || '');
  if (/\bunder\b|\bno on\b/i.test(text)) return 'under';
  if (/\bover\b|\bat least\b|\+/i.test(text)) return 'over';
  return null;
}

export function gradeThreshold(actual, line, direction, { inclusive = false } = {}) {
  if (actual == null || line == null || !direction) return { result: 'UNRESOLVED', actual };
  if (inclusive) return { result: (direction === 'over' ? actual >= line : actual <= line) ? 'WON' : 'LOST', actual };
  if (actual === line) return { result: 'PUSH', actual };
  return { result: (direction === 'over' ? actual > line : actual < line) ? 'WON' : 'LOST', actual };
}

export function firstTouchdownScorer(scoringPlays = []) {
  const first = scoringPlays.find((play) => play.scoringType?.name === 'touchdown');
  if (!first) return null;
  const text = String(first.text || '');
  const passing = text.match(/^(.+?)\s+\d+\s+Yd pass from /i);
  return normalizeName(passing?.[1] || text.split(/\s+\d+\s+Yd|\s+for\s+/i)[0]);
}

export function gradeLeg(leg, summary) {
  const market = String(leg.market || '').toLowerCase();
  if (market === 'open_slot' || !summary) return { result: 'UNRESOLVED', actual: null, reason: 'no_supported_nfl_boxscore' };
  const team = normalizeTeam(leg.team || leg.selection);
  const opponent = normalizeTeam(leg.opponent) || Object.keys(summary.teams).find((code) => code !== team);
  const player = playerFor(summary, leg.player || leg.selection);
  const line = thresholdFromLeg(leg);
  const direction = directionFromLeg(leg);
  const inclusive = /\+|at least/i.test(String(leg.selection || ''));

  if (market === 'moneyline' || market === 'spread') {
    if (!team || !summary.teams[team] || !opponent || !summary.teams[opponent]) return { result: 'UNRESOLVED', actual: null, reason: 'unresolved_team_or_game' };
    const margin = summary.teams[team].score - summary.teams[opponent].score;
    if (market === 'moneyline') return { result: margin > 0 ? 'WON' : margin < 0 ? 'LOST' : 'PUSH', actual: margin };
    const adjusted = margin + Number(leg.line);
    return { result: adjusted > 0 ? 'WON' : adjusted < 0 ? 'LOST' : 'PUSH', actual: margin };
  }
  if (market === 'total' || market === 'alternate_total_points') {
    const codes = [...new Set(String(leg.game || '').match(/\b(?:ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|HOU|IND|JAX|KC|LV|LAC|LAR|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SF|SEA|TB|TEN|WAS|WSH)\b/g) || [])].map(normalizeTeam);
    if (codes.length !== 2 || !summary.teams[codes[0]] || !summary.teams[codes[1]]) return { result: 'UNRESOLVED', actual: null, reason: 'unresolved_total_game' };
    return gradeThreshold(summary.teams[codes[0]].score + summary.teams[codes[1]].score, line, direction, { inclusive });
  }
  if (market === 'team_total') {
    if (!team || !summary.teams[team]) return { result: 'UNRESOLVED', actual: null, reason: 'unresolved_team_total' };
    return gradeThreshold(summary.teams[team].score, line, direction, { inclusive });
  }
  if (!player) return { result: 'UNRESOLVED', actual: null, reason: 'unresolved_player' };
  const byMarket = {
    receptions: ['receptions'], receiving_yards: ['receivingYards'], rushing_yards: ['rushingYards'], carries: ['rushingAttempts'], rush_attempts: ['rushingAttempts'],
    passing_yards: ['passingYards'], pass_attempts: ['completions/passingAttempts'], completions: ['completions/passingAttempts'], pass_completions: ['completions/passingAttempts'],
    passing_touchdowns: ['passingTouchdowns'], passing_tds: ['passingTouchdowns'], pass_interceptions: ['interceptions'], interceptions_thrown: ['interceptions'],
    field_goals_made: ['fieldGoalsMade', 'fieldGoalsMade/fieldGoalAttempts'], sacks: ['sacks'], tackles_assists: ['totalTackles', 'soloTackles'], interceptions: ['interceptions'],
  };
  if (market === 'anytime_touchdown' || market === 'anytime_td' || market === 'touchdowns') {
    const actual = statOrZero(player, ['rushingTouchdowns']) + statOrZero(player, ['receivingTouchdowns']);
    return gradeThreshold(actual, line || 1, direction || 'over', { inclusive: true });
  }
  if (market === 'first_touchdown') {
    const actual = firstTouchdownScorer(summary.scoringPlays) === normalizeName(player.name) ? 1 : 0;
    return gradeThreshold(actual, 1, 'over', { inclusive: true });
  }
  const keys = byMarket[market];
  if (!keys) return { result: 'UNRESOLVED', actual: null, reason: `unsupported_market:${market}` };
  let actual = statOrZero(player, keys);
  if (market === 'completions' || market === 'pass_completions') actual = numeric(player.stats['completions/passingAttempts']?.split('/')[0]);
  if (market === 'pass_attempts') actual = numeric(player.stats['completions/passingAttempts']?.split('/')[1]);
  const graded = gradeThreshold(actual, line, direction, { inclusive });
  return graded.result === 'UNRESOLVED' ? { ...graded, reason: 'missing_stat_or_line' } : graded;
}

export function gradeRoundRobin(results, size) {
  const combos = [];
  const choose = (start, picked) => {
    if (picked.length === size) { combos.push(picked); return; }
    for (let i = start; i < results.length; i += 1) choose(i + 1, [...picked, results[i]]);
  };
  choose(0, []);
  return combos.map((combo) => combo.includes('LOST') ? 'LOST' : combo.every((result) => result === 'WON') ? 'WON' : 'UNRESOLVED');
}
