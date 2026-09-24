// scripts/lib/pickem.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers for straight-up pick'em and confidence pools (2026-09-24).
//   buildGames()  game_odds_snapshots moneyline rows → per-game de-vigged win prob
//   planPool()    pool config + games + evidence leans + locked picks → plan
//   gradePool()   plan/picks + final scores → points
// No I/O here; scripts/pickem-card.mjs and scripts/pickem-grade.mjs do the I/O.
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_NAMES = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
  LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers',
  SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WSH: 'Washington Commanders',
};
const NAME_TO_ABBR = Object.fromEntries(Object.entries(TEAM_NAMES).map(([a, n]) => [n.toLowerCase(), a]));

/** Normalize an abbreviation or full name to the odds-table code (WAS→WSH, LA→LAR). */
export function normTeam(t) {
  if (t == null) return t;
  const s = String(t).trim();
  const up = s.toUpperCase();
  if (up === 'WAS') return 'WSH';
  if (up === 'LA') return 'LAR';
  if (TEAM_NAMES[up]) return up;
  return NAME_TO_ABBR[s.toLowerCase()] || up;
}

export function impliedProb(american) {
  const a = Number(american);
  if (!Number.isFinite(a) || a === 0) return null;
  return a < 0 ? -a / (-a + 100) : 100 / (a + 100);
}

/**
 * Moneyline rows → games. For each game uses the latest snapshot captured at or
 * before kickoff (the closing line once a game has started), averaging the
 * de-vigged home win probability across books in that snapshot.
 */
export function buildGames(rows) {
  const byGame = new Map();
  for (const r of rows) {
    if (r.market && r.market !== 'moneyline') continue;
    if (r.captured_at && r.commence_time && new Date(r.captured_at) > new Date(r.commence_time)) continue;
    const ph = impliedProb(r.home_price);
    const pa = impliedProb(r.away_price);
    if (ph == null || pa == null) continue;
    const g = byGame.get(r.game_id) || { rows: [] };
    g.rows.push({ ...r, p_home: ph / (ph + pa) });
    byGame.set(r.game_id, g);
  }
  const games = [];
  for (const [gameId, { rows: rs }] of byGame) {
    const latest = rs.reduce((m, r) => (String(r.captured_at || '') > m ? String(r.captured_at || '') : m), '');
    const cur = rs.filter(r => String(r.captured_at || '') === latest);
    const pHome = cur.reduce((s, r) => s + r.p_home, 0) / cur.length;
    const home = normTeam(cur[0].home_team);
    const away = normTeam(cur[0].away_team);
    const fav = pHome >= 0.5 ? home : away;
    games.push({
      game_id: gameId, home, away, commence_time: cur[0].commence_time,
      p_home: round(pHome, 4), fav, dog: fav === home ? away : home,
      p_fav: round(Math.max(pHome, 1 - pHome), 4),
      books: cur.length, odds_captured_at: latest || null,
    });
  }
  return games.sort((a, b) => String(a.commence_time).localeCompare(String(b.commence_time)) || a.game_id.localeCompare(b.game_id));
}

export function probFor(game, team) {
  const t = normTeam(team);
  if (t === game.home) return game.p_home;
  if (t === game.away) return round(1 - game.p_home, 4);
  return null;
}

function round(x, d = 3) { const k = 10 ** d; return Math.round(x * k) / k; }

export function findGame(games, team) {
  const t = normTeam(team);
  return games.find(g => g.home === t || g.away === t) || null;
}

/** Σ p × confidence; picks = [{ p, confidence }]. */
export function expectedPoints(picks) {
  return round(picks.reduce((s, x) => s + x.p * (x.confidence ?? 1), 0), 3);
}

/**
 * Assign confidence slots: fixed picks keep their slot; the rest fill the free
 * slots in ascending order of win probability (EV-optimal for the free set).
 */
export function assignSlots(picks, n) {
  const used = new Set(picks.filter(p => p.confidence != null).map(p => p.confidence));
  const free = [];
  for (let s = 1; s <= n; s++) if (!used.has(s)) free.push(s);
  const floating = picks.filter(p => p.confidence == null).sort((a, b) => a.p - b.p || a.game_id.localeCompare(b.game_id));
  floating.forEach((p, i) => { p.confidence = free[i]; });
  return picks;
}

/**
 * Plan one pool.
 * @param pool   pools-2026.json entry { id, format: 'confidence'|'straight_up', strategy, leverage?, flips? }
 * @param games  buildGames() output for the week
 * @param leans  [{ team, tier, why }] evidence leans (dogs the card likes)
 * @param locked { [TEAM]: { confidence?, status } } picks already made for this pool (keyed by picked team)
 */
export function planPool(pool, games, leans = [], locked = {}) {
  const n = games.length;
  const isConf = pool.format === 'confidence';
  const lockedByGame = new Map();
  for (const [team, v] of Object.entries(locked || {})) {
    const g = findGame(games, team);
    if (g) lockedByGame.set(g.game_id, { team: normTeam(team), ...v });
  }
  const leanByTeam = new Map(leans.map(l => [normTeam(l.team), l]));

  // Baseline: every favorite, slots by win probability.
  const baseline = assignSlots(games.map(g => ({ game_id: g.game_id, team: g.fav, p: g.p_fav, confidence: null })), n);
  const baselineEv = isConf ? expectedPoints(baseline) : round(baseline.reduce((s, x) => s + x.p, 0), 3);

  const picks = games.map(g => {
    const lk = lockedByGame.get(g.game_id);
    if (lk) {
      return { game_id: g.game_id, team: lk.team, opp: lk.team === g.home ? g.away : g.home, p: probFor(g, lk.team),
        confidence: isConf ? (lk.confidence ?? null) : null, source: 'locked', status: lk.status || 'submitted' };
    }
    return { game_id: g.game_id, team: g.fav, opp: g.dog, p: g.p_fav, confidence: null, source: 'market' };
  });

  const flips = [];
  const lev = pool.leverage || {};
  const fl = pool.flips || {};
  const coinMax = lev.coinflip_max_prob ?? fl.coinflip_max_prob ?? 0.57;
  const heavyMin = lev.heavy_fav_min_prob ?? 0.65;

  const tierRank = (t) => (String(t).startsWith('1') ? 1 : String(t).startsWith('2') ? 2 : String(t).startsWith('3') ? 3 : 4);
  const candidates = games
    .filter(g => !lockedByGame.has(g.game_id) && leanByTeam.has(g.dog))
    .map(g => ({ g, lean: leanByTeam.get(g.dog) }))
    .filter(x => tierRank(x.lean.tier) <= (lev.max_tier ?? fl.max_tier ?? 2));

  if (pool.strategy === 'weekly_leverage' && isConf) {
    const lockedHeavy = [...lockedByGame.values()].filter(lk => {
      const g = findGame(games, lk.team);
      return g && lk.team === g.dog && g.p_fav >= heavyMin;
    }).length;
    let heavyLeft = Math.max(0, (lev.max_heavy_fades ?? 1) - lockedHeavy);
    const heavy = candidates.filter(x => x.g.p_fav >= heavyMin)
      .sort((a, b) => tierRank(a.lean.tier) - tierRank(b.lean.tier) || a.g.p_fav - b.g.p_fav);
    for (const x of heavy) {
      if (heavyLeft <= 0) break;
      const slot = lev.heavy_fade_slot ?? 3;
      if (picks.some(p => p.confidence === slot)) break;
      const p = picks.find(pp => pp.game_id === x.g.game_id);
      Object.assign(p, { team: x.g.dog, opp: x.g.fav, p: round(1 - x.g.p_fav, 4), confidence: slot, source: 'heavy_fade', why: x.lean.why, tier: x.lean.tier });
      flips.push(p); heavyLeft--;
    }
    const coin = candidates.filter(x => x.g.p_fav <= coinMax)
      .sort((a, b) => a.g.p_fav - b.g.p_fav || tierRank(a.lean.tier) - tierRank(b.lean.tier))
      .slice(0, lev.max_coinflip_flips ?? 2);
    for (const x of coin) {
      const p = picks.find(pp => pp.game_id === x.g.game_id);
      Object.assign(p, { team: x.g.dog, opp: x.g.fav, p: round(1 - x.g.p_fav, 4), source: 'coinflip_flip', why: x.lean.why, tier: x.lean.tier });
      flips.push(p);
    }
  } else if (pool.strategy === 'su_flips' && !isConf) {
    const coin = candidates.filter(x => x.g.p_fav <= coinMax)
      .sort((a, b) => a.g.p_fav - b.g.p_fav || tierRank(a.lean.tier) - tierRank(b.lean.tier))
      .slice(0, fl.max ?? 2);
    for (const x of coin) {
      const p = picks.find(pp => pp.game_id === x.g.game_id);
      Object.assign(p, { team: x.g.dog, opp: x.g.fav, p: round(1 - x.g.p_fav, 4), source: 'coinflip_flip', why: x.lean.why, tier: x.lean.tier });
      flips.push(p);
    }
  }

  const byGameId = new Map(games.map(g => [g.game_id, g]));
  const score = () => {
    if (isConf) {
      for (const p of picks) {
        const pinned = (p.source === 'locked' && lockedByGame.get(p.game_id)?.confidence != null) || p.source === 'heavy_fade';
        if (!pinned) p.confidence = null;
      }
      assignSlots(picks, n);
      return expectedPoints(picks);
    }
    return round(picks.reduce((s, x) => s + x.p, 0), 3);
  };
  const revert = (p) => {
    const g = byGameId.get(p.game_id);
    Object.assign(p, { team: g.fav, opp: g.dog, p: g.p_fav, confidence: null, source: 'market', why: undefined, tier: undefined });
  };

  // Enforce the EV-cost budget: drop coin-flip flips (most expensive first), then the heavy fade.
  let ev = score();
  const budget = lev.max_ev_cost ?? fl.max_ev_cost;
  if (budget != null) {
    const order = [...flips.filter(f => f.source === 'coinflip_flip').reverse(), ...flips.filter(f => f.source === 'heavy_fade')];
    for (const f of order) {
      if (baselineEv - ev <= budget) break;
      revert(f);
      ev = score();
    }
  }
  const plan = { picks, ev };

  for (const p of plan.picks) {
    const g = byGameId.get(p.game_id);
    p.commence_time = g.commence_time;
    p.market_fav = g.fav;
    p.against_market = p.team !== g.fav;
  }
  return {
    pool_id: pool.id, format: pool.format, strategy: pool.strategy,
    games: n, baseline_ev: baselineEv, ev, ev_cost: round(baselineEv - ev, 3),
    flips: plan.picks.filter(p => p.against_market).map(p => ({ team: p.team, opp: p.opp, p: p.p, confidence: p.confidence, source: p.source, tier: p.tier ?? null })),
    picks: plan.picks.sort((a, b) => (isConf ? b.confidence - a.confidence : String(a.commence_time).localeCompare(String(b.commence_time)))),
  };
}

/**
 * Grade picks against final scores.
 * @param picks   [{ team, opp, confidence? }]
 * @param results game_results rows (full team names or abbreviations, status 'final')
 */
export function gradePool(picks, results, format = 'confidence') {
  const finals = results.filter(r => String(r.status || '').toLowerCase() === 'final');
  let points = 0; let max = 0; let correct = 0; let graded = 0;
  const detail = picks.map(p => {
    const team = normTeam(p.team);
    const r = finals.find(x => [normTeam(x.home_team), normTeam(x.away_team)].includes(team));
    const value = format === 'confidence' ? Number(p.confidence ?? 0) : 1;
    max += value;
    if (!r) return { ...p, result: 'pending', points: 0 };
    graded++;
    const home = normTeam(r.home_team);
    const hs = Number(r.home_score); const as = Number(r.away_score);
    const winner = hs === as ? null : (hs > as ? home : normTeam(r.away_team));
    const result = winner == null ? 'tie' : (winner === team ? 'win' : 'loss');
    const pts = result === 'win' ? value : 0;
    if (result === 'win') correct++;
    points += pts;
    return { ...p, result, points: pts, score: `${normTeam(r.away_team)} ${as} @ ${home} ${hs}` };
  });
  return { points, max_points: max, correct, graded, total: picks.length, detail };
}
