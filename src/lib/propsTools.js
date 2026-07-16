// src/lib/propsTools.js
// ═══════════════════════════════════════════════════════════════════════════════
// PROPS Agent — Tool Definitions + Executor (F-8)
// Player props, same-game parlays (SGPs), backup-depth analysis.
//
// Tools:
//   get_player_props        · analyze_prop            · get_prop_line_shop
//   build_sgp               · check_backup_depth      · get_prop_correlations
//   log_prop
//
// Data sources:
//   - Supabase odds_snapshots (team totals, game totals)
//   - public/schedule.json     (active slate)
//   - public/weekly_stats.json (team scoring context for prop scaling)
//   - ESPN injuries API        (starter status → backup-depth analysis)
//   - Local stub lines         (free tier TheOddsAPI does NOT expose player props,
//                                so get_player_props returns structured stub lines
//                                derived from team scoring context until the paid
//                                player-props endpoint is wired. Flagged TODO.)
// ═══════════════════════════════════════════════════════════════════════════════

import { getLatestOddsSnapshot, supabase, isAvailable } from './supabase.js';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage.js';
import { LOCAL_DATA, ESPN_API } from './apiConfig.js';

// ─── ESPN Team ID Mapping (shared with agentTools; duplicated here so PROPS is
//    a self-contained module that doesn't cross-import BETTING internals) ─────
const ESPN_TEAM_IDS = {
  ARI: 22, ATL: 1,  BAL: 33, BUF: 2,  CAR: 29, CHI: 3,  CIN: 4,  CLE: 5,
  DAL: 6,  DEN: 7,  DET: 8,  GB: 9,   HOU: 34, IND: 11, JAX: 30, KC: 12,
  LV: 13,  LAC: 24, LAR: 14, MIA: 15, MIN: 16, NE: 17,  NO: 18,  NYG: 19,
  NYJ: 20, PHI: 21, PIT: 23, SF: 25,  SEA: 26, TB: 27,  TEN: 28, WAS: 35,
};

// ─── Known prop markets (aligned with TheOddsAPI player-props market names) ──
export const PROP_MARKETS = {
  player_pass_yds:        { label: 'Passing Yards',    position: 'QB', baseline: 235 },
  player_pass_tds:        { label: 'Passing TDs',      position: 'QB', baseline: 1.5 },
  player_pass_attempts:   { label: 'Pass Attempts',    position: 'QB', baseline: 32.5 },
  player_pass_completions:{ label: 'Completions',      position: 'QB', baseline: 21.5 },
  player_pass_interceptions: { label: 'Interceptions', position: 'QB', baseline: 0.5 },
  player_rush_yds:        { label: 'Rushing Yards',    position: 'RB', baseline: 62.5 },
  player_rush_attempts:   { label: 'Rush Attempts',    position: 'RB', baseline: 14.5 },
  player_rush_tds:        { label: 'Rush TDs',         position: 'RB', baseline: 0.5 },
  player_reception_yds:   { label: 'Receiving Yards',  position: 'WR', baseline: 55.5 },
  player_receptions:      { label: 'Receptions',       position: 'WR', baseline: 4.5 },
  player_anytime_td:      { label: 'Anytime TD',       position: 'ALL', baseline: null },
};

// ─── Anthropic Tool Definitions ──────────────────────────────────────────────

export const PROPS_TOOLS = [
  {
    name: 'get_player_props',
    description: 'Retrieve player prop lines for a team or game. Returns structured prop lines across markets (passing yds, rushing yds, receiving yds, receptions, anytime TD, etc). NOTE: TheOddsAPI free tier does not include player props — this returns baseline stub lines derived from team scoring context until the paid props endpoint is wired. Always tell the Creator when a line is stubbed.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team abbreviation (e.g. "KC", "BUF") or full team name.',
        },
        player: {
          type: 'string',
          description: 'Optional player name filter (partial match).',
        },
        market: {
          type: 'string',
          enum: Object.keys(PROP_MARKETS).concat(['all']),
          description: 'Prop market filter. Default: all.',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'analyze_prop',
    description: 'Analyze a player prop against recent volume / scoring context. Returns a projection, edge vs the line, and key factors (game script, pace, opponent defense). Use before every prop recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        player: {
          type: 'string',
          description: 'Player name',
        },
        team: {
          type: 'string',
          description: 'Player team abbreviation',
        },
        opponent: {
          type: 'string',
          description: 'Opposing team abbreviation',
        },
        market: {
          type: 'string',
          enum: Object.keys(PROP_MARKETS),
          description: 'Prop market being analyzed',
        },
        line: {
          type: 'number',
          description: 'Current line (e.g. 62.5 for rushing yards)',
        },
        direction: {
          type: 'string',
          enum: ['over', 'under'],
          description: 'Side being considered',
        },
      },
      required: ['player', 'team', 'market', 'line', 'direction'],
    },
  },
  {
    name: 'get_prop_line_shop',
    description: 'Returns best available line across sportsbooks for a given prop. Flags the book offering the best number on each side. Falls back to stub book comparison if real prop data is not in Supabase yet.',
    input_schema: {
      type: 'object',
      properties: {
        player: { type: 'string', description: 'Player name' },
        market: { type: 'string', enum: Object.keys(PROP_MARKETS) },
      },
      required: ['player', 'market'],
    },
  },
  {
    name: 'build_sgp',
    description: 'Build a same-game parlay — combines multiple props from the same game and returns combined odds with a correlation adjustment. Positive correlation (QB pass yds over + WR rec yds over) increases hit probability but books price it up; negative correlation (RB rush yds over + opponent team total over) decreases. Returns approximate SGP price with a caveat that true pricing is book-specific.',
    input_schema: {
      type: 'object',
      properties: {
        legs: {
          type: 'array',
          description: 'Array of SGP legs. Each leg: { player, team, market, line, direction, odds }',
          items: {
            type: 'object',
            properties: {
              player:    { type: 'string' },
              team:      { type: 'string' },
              market:    { type: 'string', enum: Object.keys(PROP_MARKETS) },
              line:      { type: 'number' },
              direction: { type: 'string', enum: ['over', 'under'] },
              odds:      { type: 'number', description: 'American odds on this leg (e.g. -115, +140)' },
            },
            required: ['player', 'market', 'line', 'direction', 'odds'],
          },
        },
        correlation_hint: {
          type: 'string',
          enum: ['positive', 'negative', 'independent'],
          description: 'Optional correlation type. Default: auto-detect from legs.',
        },
      },
      required: ['legs'],
    },
  },
  {
    name: 'check_backup_depth',
    description: 'Check whether a starter is injured and, if so, flag the backup and estimated volume impact. Use this before any prop bet on a position where the starter has an injury designation. Pulls from ESPN injury API.',
    input_schema: {
      type: 'object',
      properties: {
        team: { type: 'string', description: 'Team abbreviation (e.g. "KC")' },
        position: {
          type: 'string',
          enum: ['QB', 'RB', 'WR', 'TE', 'ALL'],
          description: 'Position to check. Default: ALL.',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'get_prop_correlations',
    description: 'Returns known NFL stat correlations that matter for SGP construction. No parameters — returns a structured correlation matrix (e.g. QB pass yds ↔ WR1 rec yds = strong positive, RB rush yds ↔ team total = positive, QB pass yds ↔ own RB rush yds = mild negative in blowouts).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'log_prop',
    description: 'Record a prop or SGP pick to the Creator\'s Prop Tracker (localStorage nfl_props_picks_v1). Never call without explicit user confirmation — always ask "Shall I log this?" first. SGPs are logged as a single entry with legs[] attached.',
    input_schema: {
      type: 'object',
      properties: {
        player:    { type: 'string', description: 'Player name (for single prop) or "SGP" for parlay' },
        team:      { type: 'string', description: 'Team abbreviation' },
        market:    { type: 'string', description: 'Market (e.g. player_rush_yds) or "sgp"' },
        line:      { type: 'number', description: 'Line (ignored for SGP)' },
        direction: { type: 'string', enum: ['over', 'under', 'yes', 'sgp'] },
        odds:      { type: 'number', description: 'American odds on the pick' },
        units:     { type: 'number', description: 'Wager size in units' },
        book:      { type: 'string', description: 'Sportsbook' },
        week:      { type: 'number', description: 'NFL week the prop is for (enables auto-grading). Include whenever known.' },
        season:    { type: 'number', description: 'Season year (defaults to current NFL season).' },
        game_context: { type: 'string', description: 'Game (e.g. "KC @ BUF")' },
        notes:     { type: 'string', description: 'Rationale / context' },
        legs: {
          type: 'array',
          description: 'For SGPs only — array of leg descriptors',
          items: {
            type: 'object',
            properties: {
              player:    { type: 'string' },
              market:    { type: 'string' },
              line:      { type: 'number' },
              direction: { type: 'string' },
              odds:      { type: 'number' },
            },
          },
        },
      },
      required: ['direction', 'odds', 'units'],
    },
  },
];

// ─── Tool Executor ───────────────────────────────────────────────────────────

export async function executePropTool(name, input) {
  switch (name) {
    case 'get_player_props':      return toolGetPlayerProps(input);
    case 'analyze_prop':          return toolAnalyzeProp(input);
    case 'get_prop_line_shop':    return toolGetPropLineShop(input);
    case 'build_sgp':             return toolBuildSGP(input);
    case 'check_backup_depth':    return toolCheckBackupDepth(input);
    case 'get_prop_correlations': return toolGetCorrelations();
    case 'log_prop':              return toolLogProp(input);
    default:
      return { error: `Unknown PROPS tool: ${name}` };
  }
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

const americanToDecimal = (a) => a > 0 ? (a / 100) + 1 : (100 / Math.abs(a)) + 1;
const decimalToAmerican = (d) => {
  if (d >= 2) return Math.round((d - 1) * 100);
  return -Math.round(100 / (d - 1));
};
const impliedProb = (american) => {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
};

// ─── Stub prop generator ─────────────────────────────────────────────────────
// Until a paid player-props endpoint is wired, we generate deterministic stub
// lines from team scoring context + baseline per market. Clearly flagged.
function generateStubProps(teamAbbr, teamStats) {
  const offense = parseFloat(teamStats?.pts_for_avg || teamStats?.points_for || 22);
  const scalar = offense / 22; // 22 = league avg

  const q = (v) => parseFloat((v * scalar).toFixed(1));

  return [
    { player: `${teamAbbr} QB`,  team: teamAbbr, market: 'player_pass_yds',      line: q(235),  over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} QB`,  team: teamAbbr, market: 'player_pass_tds',      line: q(1.5),  over_odds: +100, under_odds: -120 },
    { player: `${teamAbbr} QB`,  team: teamAbbr, market: 'player_pass_attempts', line: q(32.5), over_odds: -110, under_odds: -110 },
    { player: `${teamAbbr} RB1`, team: teamAbbr, market: 'player_rush_yds',      line: q(62.5), over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} RB1`, team: teamAbbr, market: 'player_rush_attempts', line: q(14.5), over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} WR1`, team: teamAbbr, market: 'player_reception_yds', line: q(72.5), over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} WR1`, team: teamAbbr, market: 'player_receptions',    line: q(5.5),  over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} WR2`, team: teamAbbr, market: 'player_reception_yds', line: q(47.5), over_odds: -115, under_odds: -105 },
    { player: `${teamAbbr} TE1`, team: teamAbbr, market: 'player_reception_yds', line: q(38.5), over_odds: -115, under_odds: -105 },
  ];
}

async function loadWeeklyStats() {
  try {
    const resp = await fetch(LOCAL_DATA.WEEKLY_STATS);
    if (resp.ok) return await resp.json();
  } catch { /* non-fatal */ }
  return {};
}

function findTeamStats(statsBlob, teamQuery) {
  if (!statsBlob) return null;
  const arr = Array.isArray(statsBlob) ? statsBlob : Object.values(statsBlob).flat();
  const q = (teamQuery || '').toLowerCase();
  return arr.find(t => (t.team || '').toLowerCase().includes(q) || (t.abbr || '').toLowerCase() === q) || null;
}

// ─── Individual Tool Implementations ─────────────────────────────────────────

async function toolGetPlayerProps({ team, player, market = 'all' }) {
  if (!team) return { error: 'team is required' };

  const stats = await loadWeeklyStats();
  const teamStats = findTeamStats(stats, team);

  // Try to pull any prop markets that may already be present in odds_snapshots
  // (future-proofing for when props are ingested).
  let realProps = [];
  try {
    const snap = await getLatestOddsSnapshot();
    if (snap?.games) {
      for (const g of snap.games) {
        if (!g.player_props) continue;
        if (g.home !== team && g.away !== team &&
            !(g.home_team || '').toLowerCase().includes(team.toLowerCase()) &&
            !(g.away_team || '').toLowerCase().includes(team.toLowerCase())) continue;
        realProps.push(...(g.player_props || []));
      }
    }
  } catch { /* non-fatal */ }

  const useStub = realProps.length === 0;
  let props = useStub ? generateStubProps(team.toUpperCase(), teamStats) : realProps;

  if (player) {
    const q = player.toLowerCase();
    props = props.filter(p => (p.player || '').toLowerCase().includes(q));
  }
  if (market && market !== 'all') {
    props = props.filter(p => p.market === market);
  }

  return {
    team,
    prop_count: props.length,
    props,
    source: useStub ? 'stub (team-scaled baseline lines)' : 'supabase:odds_snapshots',
    _note: useStub
      ? 'TheOddsAPI free tier does not expose player props. These lines are baseline approximations scaled by team offensive PPG. Ask the Creator to paste real lines for higher precision.'
      : undefined,
  };
}

async function toolAnalyzeProp({ player, team, opponent, market, line, direction }) {
  const stats = await loadWeeklyStats();
  const teamStats = findTeamStats(stats, team);
  const oppStats  = opponent ? findTeamStats(stats, opponent) : null;

  const meta = PROP_MARKETS[market];
  if (!meta) return { error: `Unknown market: ${market}. Known: ${Object.keys(PROP_MARKETS).join(', ')}` };

  const offensePPG = parseFloat(teamStats?.pts_for_avg     || teamStats?.points_for     || 22);
  const defensePPG = parseFloat(oppStats?.pts_allowed_avg  || oppStats?.points_against  || 22);

  const paceFactor    = offensePPG / 22;
  const matchupFactor = defensePPG / 22;

  // Naive projection: baseline × pace × matchup factor (capped)
  const baseline = meta.baseline ?? 1;
  const projection = parseFloat((baseline * paceFactor * matchupFactor).toFixed(2));

  const edge = parseFloat((projection - line).toFixed(2));
  const hitsOver = projection > line;
  const alignedWithPick = (direction === 'over' && hitsOver) || (direction === 'under' && !hitsOver);
  const magnitude = Math.abs(edge) / (line || 1);

  let tier = 'pass';
  if (alignedWithPick && magnitude > 0.10) tier = 'strong';
  else if (alignedWithPick && magnitude > 0.04) tier = 'lean';
  else if (alignedWithPick) tier = 'slight_lean';

  const factors = [
    `Team pace factor: ${paceFactor.toFixed(2)} (${offensePPG.toFixed(1)} PPG vs 22 league avg)`,
    `Opponent matchup factor: ${matchupFactor.toFixed(2)} (${defensePPG.toFixed(1)} PPG allowed vs 22 league avg)`,
    `Baseline for ${meta.label}: ${baseline}`,
    `Model projection: ${projection} vs line ${line}`,
  ];

  return {
    player,
    team,
    opponent: opponent || 'N/A',
    market,
    line,
    direction,
    projection,
    edge,
    aligns_with_pick: alignedWithPick,
    magnitude_pct: parseFloat((magnitude * 100).toFixed(1)),
    tier,
    key_factors: factors,
    model_confidence: 'low — offseason proxies; real volume data required',
    recommendation: tier === 'strong'
      ? `STRONG: projection ${projection} vs line ${line} → ${direction.toUpperCase()} has edge`
      : tier === 'lean'
      ? `LEAN: projection ${projection} vs line ${line} → slight ${direction.toUpperCase()} lean`
      : tier === 'slight_lean'
      ? `SLIGHT LEAN: projection favors ${direction.toUpperCase()} but thin edge`
      : `PASS: projection does not support ${direction.toUpperCase()} side`,
  };
}

async function toolGetPropLineShop({ player, market }) {
  // Real implementation would query Supabase prop-odds table per book.
  // Stubbed: generate 4 synthetic books with jittered lines to demonstrate shopping UX.
  const meta = PROP_MARKETS[market];
  if (!meta) return { error: `Unknown market: ${market}` };

  const base = meta.baseline ?? 50;
  const books = [
    { book: 'DraftKings', line: base,       over_odds: -115, under_odds: -105 },
    { book: 'FanDuel',    line: base - 0.5, over_odds: -110, under_odds: -110 },
    { book: 'BetMGM',     line: base,       over_odds: -105, under_odds: -115 },
    { book: 'Caesars',    line: base + 0.5, over_odds: -115, under_odds: -105 },
  ];

  const bestOver = books.reduce((a, b) => {
    const ap = a.line + impliedProb(a.over_odds);
    const bp = b.line + impliedProb(b.over_odds);
    return bp < ap ? b : a; // lower line + better (less juice) over
  });
  const bestUnder = books.reduce((a, b) => {
    const ap = -a.line + impliedProb(a.under_odds);
    const bp = -b.line + impliedProb(b.under_odds);
    return bp < ap ? b : a;
  });

  return {
    player,
    market,
    books,
    best_over:  { book: bestOver.book,  line: bestOver.line,  odds: bestOver.over_odds },
    best_under: { book: bestUnder.book, line: bestUnder.line, odds: bestUnder.under_odds },
    _note: 'Book comparison is stubbed pending real prop-odds ingest. Real shopping requires paid TheOddsAPI tier or a dedicated prop aggregator.',
  };
}

function toolBuildSGP({ legs, correlation_hint }) {
  if (!Array.isArray(legs) || legs.length < 2) {
    return { error: 'SGP requires at least 2 legs' };
  }

  // Combined decimal (independent baseline)
  const combinedDecimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  const independentAmerican = decimalToAmerican(combinedDecimal);

  // Auto-detect correlation if not provided
  let corrType = correlation_hint;
  if (!corrType) {
    const sameTeam = new Set(legs.map(l => l.team)).size === 1;
    const markets = legs.map(l => l.market);
    const hasPass = markets.some(m => m.startsWith('player_pass_'));
    const hasRec  = markets.some(m => m.startsWith('player_reception') || m === 'player_receptions');
    const hasRush = markets.some(m => m.startsWith('player_rush'));
    if (sameTeam && hasPass && hasRec) corrType = 'positive';
    else if (sameTeam && hasPass && hasRush) corrType = 'negative';
    else corrType = 'independent';
  }

  // Correlation haircut (approximation of book pricing):
  //   positive correlation  → book shortens ~15-25%
  //   negative correlation  → book lengthens slightly (~5%)
  //   independent           → approx. parlay price (slight haircut ~5% for juice)
  const haircutMap = { positive: 0.80, negative: 1.05, independent: 0.95 };
  const haircut = haircutMap[corrType] || 0.95;
  const adjustedDecimal = Math.max(1.01, (combinedDecimal - 1) * haircut + 1);
  const sgpAmerican = decimalToAmerican(adjustedDecimal);

  const impliedHit = 1 / adjustedDecimal;

  return {
    legs: legs.map(l => ({
      player: l.player,
      market: l.market,
      line: l.line,
      direction: l.direction,
      odds: l.odds,
      implied: parseFloat((impliedProb(l.odds) * 100).toFixed(1)) + '%',
    })),
    correlation_type:       corrType,
    correlation_haircut:    `${((1 - haircut) * 100).toFixed(0)}% ${haircut < 1 ? 'shortened' : 'lengthened'}`,
    independent_parlay_price:  independentAmerican,
    approx_sgp_price:          sgpAmerican,
    implied_win_probability:   parseFloat((impliedHit * 100).toFixed(1)) + '%',
    recommendation: corrType === 'positive'
      ? 'Correlated SGP — book will price this shorter than raw parlay. Real quote may vary ±15% depending on book.'
      : corrType === 'negative'
      ? 'Negatively correlated — legs fight each other. Usually -EV unless each leg has standalone value.'
      : 'Roughly independent legs — SGP approximates a standard parlay. Check book for actual quote.',
    _note: 'True SGP pricing is book-proprietary. These numbers are approximations; always verify against the actual book ticket before betting.',
  };
}

async function toolCheckBackupDepth({ team, position = 'ALL' }) {
  if (!team) return { error: 'team is required' };

  const abbr = team.toUpperCase().replace(/^(THE )/i, '').trim().split(' ').pop();
  const teamId = ESPN_TEAM_IDS[abbr];
  if (!teamId) {
    return {
      status: 'unknown_team',
      message: `No ESPN team ID for "${team}"`,
    };
  }

  const url = `${ESPN_API.INJURIES_URL}/${teamId}/injuries`;
  let injuries = [];
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      injuries = (data?.items || []).map(item => ({
        player:   item?.athlete?.displayName ?? 'Unknown',
        position: item?.athlete?.position?.abbreviation ?? 'N/A',
        status:   (item?.status?.type?.description ?? 'Unknown').toUpperCase(),
        injury:   item?.injuries?.[0]?.type?.description ?? 'Unknown',
      }));
    }
  } catch { /* fall through to empty */ }

  // Filter by position if requested
  let relevant = position === 'ALL' ? injuries : injuries.filter(i => i.position === position);

  // Flag starters who are OUT / DOUBTFUL → backup opportunity
  const DEGRADED = ['OUT', 'DOUBTFUL', 'INJURED RESERVE', 'SUSPENDED'];
  const backupFlags = relevant
    .filter(i => DEGRADED.some(d => i.status.includes(d)))
    .map(i => ({
      starter_out: i.player,
      position: i.position,
      status: i.status,
      injury: i.injury,
      volume_impact_estimate: i.position === 'QB' ? 'Backup QB starts — team pass volume often -10% to -20%, WR prop lines typically drop'
        : i.position === 'RB' ? 'Next RB on depth chart gets bulk of carries — rush prop line for backup typically 60-75% of starter baseline'
        : i.position === 'WR' ? 'Targets redistribute to WR2/WR3/TE — look for prop line boosts on remaining pass-catchers'
        : i.position === 'TE' ? 'Mild target bump to WRs; TE2 usually not a prop-worthy bump'
        : 'Position-specific impact unclear',
      recommendation: 'Confirm depth chart before betting — ESPN API does not return depth. This flag is an alert, not a full analysis.',
    }));

  return {
    team: abbr,
    position_filter: position,
    total_injuries: injuries.length,
    degraded_starters: backupFlags.length,
    flags: backupFlags,
    full_injury_list: relevant.slice(0, 15),
    _note: 'Real depth chart data (QB2, RB2, etc.) requires a paid source like Sportradar. This tool surfaces injury-driven volume risks only.',
  };
}

function toolGetCorrelations() {
  // Hardcoded domain knowledge — stat correlations that matter for NFL SGPs
  return {
    strong_positive: [
      { pair: 'QB pass yds ↔ WR1 rec yds',   coefficient: 0.60, note: 'Classic anchor SGP — QB pass volume drives WR1 production' },
      { pair: 'QB pass yds ↔ TE rec yds',    coefficient: 0.45, note: 'Targets tend to distribute; less tight than WR1 but meaningful' },
      { pair: 'Team total ↔ Anytime TD skill players', coefficient: 0.50, note: 'Higher scoring = more TDs to spread' },
      { pair: 'RB rush yds ↔ RB rush TDs',   coefficient: 0.50, note: 'Goal-line carries usually go to bell-cow back' },
      { pair: 'QB pass TDs ↔ WR anytime TD', coefficient: 0.55, note: 'Red-zone target share matters' },
    ],
    mild_positive: [
      { pair: 'QB completions ↔ QB pass yds', coefficient: 0.70, note: 'Nearly tautological — careful, book prices heavily' },
      { pair: 'Game total over ↔ QB pass yds over', coefficient: 0.35, note: 'Shootouts feature more dropbacks' },
      { pair: 'RB rush attempts ↔ team spread cover', coefficient: 0.30, note: 'Favorites rush more late' },
    ],
    mild_negative: [
      { pair: 'QB pass yds ↔ own team RB rush yds', coefficient: -0.20, note: 'In blowouts one eats the other; in close games balanced' },
      { pair: 'WR1 rec yds ↔ WR2 rec yds (same team)', coefficient: -0.25, note: 'Target competition within team' },
    ],
    avoid: [
      { pair: 'Opponent QB pass yds ↔ own defense TDs', coefficient: 0.0, note: 'No predictable relationship; do not build around this' },
    ],
    usage_tips: [
      'Positive correlations are priced INTO the SGP — book will shorten the combined price by 15-25%.',
      'Independent legs (different games) are NOT SGPs; those are normal parlays.',
      'Never stack 4+ positively correlated props — variance collapses, EV usually negative.',
      'A 2-leg SGP with one strong positive correlation and mild edge on each leg is the gold standard.',
    ],
  };
}

// Current NFL season (labeled by starting year; Jan/Feb belong to the prior year).
function currentNflSeason() {
  const d = new Date();
  return d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear();
}

// Resolve an nflverse player_id from a display name via player_stats (most recent
// row wins). Returns null if not found — the grader then skips until backfilled.
async function resolvePlayerId(name, season) {
  if (!name || !isAvailable()) return null;
  try {
    const { data } = await supabase
      .from('player_stats')
      .select('player_id, season')
      .ilike('player_name', name.trim())
      .order('season', { ascending: false })
      .limit(1);
    return data?.[0]?.player_id ?? null;
  } catch { return null; }
}

// Mirror a single prop into user_bankroll_bets as a gradable row so
// agents/props-auto-grade.js can settle it. SGPs are logged as bet_type='sgp'
// (not auto-graded — no single stat_column). Best-effort: never blocks logging.
async function syncPropToBankroll(entry, { week, season }) {
  if (!isAvailable()) return { synced: false, reason: 'supabase unavailable' };
  const isSGP = Array.isArray(entry.legs) && entry.legs.length > 0;
  const isRealMarket = !!PROP_MARKETS[entry.market];

  // anytime-TD "yes" grades as over 0.5 total TDs
  let statCol = null, line = entry.line, direction = entry.direction;
  if (!isSGP && isRealMarket) {
    statCol = entry.market;
    if (entry.market === 'player_anytime_td') { direction = 'over'; line = line ?? 0.5; }
  }
  const playerId = statCol ? await resolvePlayerId(entry.player, season) : null;

  const row = {
    id: entry.id,
    timestamp: entry.logged_at,
    week: week ?? null,
    season,
    status: 'pending',
    bet_type: isSGP ? 'sgp' : 'prop',
    type: isSGP ? 'sgp' : 'prop',
    graded: false,
    result: null,
    stat_column: statCol,
    player_id: playerId,
    player: entry.player,
    line,
    direction,
    odds: entry.odds,
    amount: entry.units,
    source: 'PROPS_AGENT',
    description: entry.game_context || entry.notes || null,
    legs: isSGP ? entry.legs : [],
    is_parlay: isSGP,
  };
  try {
    const { error } = await supabase.from('user_bankroll_bets').upsert(row, { onConflict: 'id' });
    if (error) return { synced: false, reason: error.message };
    return { synced: true, gradable: !!(statCol && playerId), player_id: playerId, stat_column: statCol };
  } catch (e) { return { synced: false, reason: e.message }; }
}

async function toolLogProp({ player, team, market, line, direction, odds, units, book, week, season, game_context, notes, legs }) {
  // Load existing prop picks
  const key = PR_STORAGE_KEYS.PROPS_PICKS.key;
  const existing = loadFromStorage(key, []);
  const seasonY = typeof season === 'number' ? season : currentNflSeason();

  const id = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    player:    player     || (legs?.length ? 'SGP' : 'Unknown'),
    team:      team       || null,
    market:    market     || (legs?.length ? 'sgp' : null),
    line:      line       ?? null,
    direction: direction  || 'over',
    odds:      typeof odds === 'number' ? odds : -110,
    units:     typeof units === 'number' ? units : 1,
    book:      book       || 'Unknown',
    week:      typeof week === 'number' ? week : null,
    season:    seasonY,
    game_context: game_context || null,
    notes:     notes      || '',
    legs:      Array.isArray(legs) ? legs : null,
    result:    'pending',
    logged_at: new Date().toISOString(),
    source:    'PROPS_AGENT',
  };

  const next = [...existing, entry];
  saveToStorage(key, next);

  // Best-effort mirror to Supabase so props-auto-grade can settle it.
  const sync = await syncPropToBankroll(entry, { week: entry.week, season: seasonY });

  const gradeNote = sync.synced
    ? (sync.gradable
        ? 'Synced to bankroll — will auto-grade after the game.'
        : `Synced, but not auto-gradable yet${!entry.week ? ' (no week set)' : ''}${sync.stat_column && !sync.player_id ? ` (player_id unresolved for "${entry.player}")` : ''}.`)
    : `Not synced to Supabase (${sync.reason}); logged locally.`;

  return {
    status: 'logged',
    pick_id: id,
    sync,
    summary: legs?.length
      ? `✅ SGP Logged: ${legs.length} legs · ${odds > 0 ? '+' : ''}${odds} · ${units}u @ ${book || '?'}`
      : `✅ Prop Logged: ${player} ${market} ${direction} ${line} (${odds > 0 ? '+' : ''}${odds}) · ${units}u @ ${book || '?'} — ${gradeNote}`,
    entry,
  };
}

// ─── OpenAI Function-Call Format ──────────────────────────────────────────────

export const OPENAI_PROPS_TOOLS = PROPS_TOOLS.map(t => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));
