// src/lib/agentTools.js
// ═══════════════════════════════════════════════════════════════════════════════
// BETTING Agent — Tool Definitions + Executor
// Implements the 8 tools defined in agents/manifests/betting.manifest.json.
//
// Tools: log_pick · get_odds · get_line_movement · analyze_matchup ·
//        get_injury_report · calculate_hedge · calculate_teaser ·
//        get_performance_stats · search_intel · search_sharp_tweets ·
//        read_vault_note · write_vault_note · get_betting_splits
// ═══════════════════════════════════════════════════════════════════════════════

import { getLatestOddsSnapshot, getLineMovementsDB, searchResearchIntel, searchSharpTweets, getGameSplitsForWeek } from './supabase.js';
import { readVaultNote, writeVaultNote, todaySessionPath } from './vaultClient.js';
import {
  addPick,
  calculateStandings,
  statsByConfidence,
  statsByEdge,
  loadPicks,
} from './picksDatabase.js';
import { PR_STORAGE_KEYS } from './storage.js';
import { LOCAL_DATA, ESPN_API } from './apiConfig.js';
import { normalizeTeam, getTeamAbbreviation } from './teams.js';

// ─── ESPN Team ID Mapping ─────────────────────────────────────────────────────
// Used by get_injury_report tool
const ESPN_TEAM_IDS = {
  ARI: 22, ATL: 1,  BAL: 33, BUF: 2,  CAR: 29, CHI: 3,  CIN: 4,  CLE: 5,
  DAL: 6,  DEN: 7,  DET: 8,  GB: 9,   HOU: 34, IND: 11, JAX: 30, KC: 12,
  LV: 13,  LAC: 24, LAR: 14, MIA: 15, MIN: 16, NE: 17,  NO: 18,  NYG: 19,
  NYJ: 20, PHI: 21, PIT: 23, SF: 25,  SEA: 26, TB: 27,  TEN: 28, WAS: 35,
};

// ─── Anthropic Tool Definitions ──────────────────────────────────────────────
// Format: { name, description, input_schema: { type, properties, required } }

export const BETTING_TOOLS = [
  {
    name: 'get_odds',
    description: 'Retrieve current odds from all sportsbooks. Use before any spread/total recommendation. Returns spreads, totals, and moneylines from Supabase (cached from TheOddsAPI). Prefer this over live API calls to preserve the 500 req/month quota.',
    input_schema: {
      type: 'object',
      properties: {
        teams: {
          type: 'string',
          description: 'Optional team name(s) to filter by (home or away). Leave empty for all games.',
        },
        market: {
          type: 'string',
          enum: ['spreads', 'totals', 'h2h', 'all'],
          description: 'Market type to retrieve. Default: all',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_line_movement',
    description: 'Returns opening line vs. current line plus directional movement. Use when the Creator asks about line moves, sharp money, steam moves, or reverse line movement.',
    input_schema: {
      type: 'object',
      properties: {
        game: {
          type: 'string',
          description: 'Partial team name or game description (e.g. "Chiefs" or "KC vs DEN")',
        },
        hours: {
          type: 'number',
          description: 'Look-back window in hours. Default: 24',
        },
      },
      required: [],
    },
  },
  {
    name: 'analyze_matchup',
    description: 'Returns model projections and key intel for an NFL game. Always call this before making a spread or total recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        home_team: {
          type: 'string',
          description: 'Home team abbreviation or full name (e.g. "KC" or "Kansas City Chiefs")',
        },
        away_team: {
          type: 'string',
          description: 'Away team abbreviation or full name (e.g. "BUF" or "Buffalo Bills")',
        },
      },
      required: ['home_team', 'away_team'],
    },
  },
  {
    name: 'get_injury_report',
    description: 'Returns current injury designations for a team from ESPN. Use when injury intel is needed before a recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team abbreviation (e.g. "KC", "BUF", "PHI")',
        },
      },
      required: ['team'],
    },
  },
  {
    name: 'calculate_hedge',
    description: 'Calculates hedge bet amounts for profit locking or loss minimization on an active position.',
    input_schema: {
      type: 'object',
      properties: {
        original_bet_amount: {
          type: 'number',
          description: 'Original wager amount in dollars',
        },
        original_odds: {
          type: 'number',
          description: 'American odds on original bet (e.g. +150, -110)',
        },
        hedge_odds: {
          type: 'number',
          description: 'American odds available on the opposite side for hedging',
        },
        target_profit: {
          type: 'number',
          description: 'Optional guaranteed profit target (dollars). If omitted, calculates break-even hedge.',
        },
      },
      required: ['original_bet_amount', 'original_odds', 'hedge_odds'],
    },
  },
  {
    name: 'calculate_teaser',
    description: 'Evaluates teaser bet value. Checks key number crossings (3, 7) and Wong teaser qualification. Returns EV estimate and recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        legs: {
          type: 'array',
          description: 'Array of teaser legs. Each leg: { team, spread, teaser_points }',
          items: {
            type: 'object',
            properties: {
              team:          { type: 'string' },
              spread:        { type: 'number', description: 'Current spread (e.g. -7.5, +2.5)' },
              teaser_points: { type: 'number', description: 'Teaser points to add (default 6)' },
            },
            required: ['team', 'spread'],
          },
        },
        teaser_odds: {
          type: 'number',
          description: 'Teaser payout odds in American format (e.g. -120 for standard 2-team 6pt)',
        },
      },
      required: ['legs'],
    },
  },
  {
    name: 'log_pick',
    description: 'Records a pick or bet to the Creator\'s Picks Tracker. CRITICAL: The system prompt instructs you to ALWAYS ask for explicit user confirmation before calling this tool. Never auto-log without a clear "log it", "record that", or "add the bet" instruction from the Creator.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Team abbreviation or "OVER"/"UNDER" for totals',
        },
        pick_type: {
          type: 'string',
          enum: ['spread', 'total', 'moneyline'],
          description: 'Type of bet',
        },
        line: {
          type: 'number',
          description: 'Spread or total line (e.g. -3.5, 47.5)',
        },
        odds: {
          type: 'number',
          description: 'American odds (e.g. -110, +130)',
        },
        amount_units: {
          type: 'number',
          description: 'Wager size in units (e.g. 1, 2, 3)',
        },
        game_context: {
          type: 'string',
          description: 'Game description (e.g. "KC @ BUF" or "Chiefs vs Bills")',
        },
        notes: {
          type: 'string',
          description: 'Rationale or context for the pick',
        },
        book: {
          type: 'string',
          description: 'Sportsbook name (e.g. "DraftKings", "FanDuel")',
        },
      },
      required: ['team', 'pick_type', 'line', 'odds', 'amount_units'],
    },
  },
  {
    name: 'get_performance_stats',
    description: 'Returns the Creator\'s historical pick performance — overall record, units, ROI, breakdown by confidence tier, edge size, and team. Use this to calibrate bet sizing recommendations and to answer questions about past performance (e.g. "how have I done on totals?", "what\'s my record on high-confidence plays?"). No inputs required.',
    input_schema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['AI_LAB', 'EXPERT'],
          description: 'Filter to a specific pick source (optional). Omit for all picks.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_intel',
    description: 'Search recent research articles and pick signals by keyword, team, or source. Use when the Creator asks what a specific outlet said about a team or market (e.g. "what did Action Network say about the Chiefs?", "any VSiN angles on the Bills spread?"). Searches titles and summaries from the last 7 days by default.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword, team name, or topic to search for (e.g. "Chiefs", "AFC West", "over")',
        },
        source: {
          type: 'string',
          enum: ['Action Network', 'BettingPros', 'ESPN NFL', 'VSiN'],
          description: 'Optional — filter results to a single source',
        },
        hours: {
          type: 'number',
          description: 'Lookback window in hours (default: 168 = 7 days)',
        },
        limit: {
          type: 'number',
          description: 'Max articles to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_vault_note',
    description: 'Read a note from the NFL betting vault. Use at session start to load reference data: coach tendencies (NFL/Reference/CoachTendencies.md), DVOA analytics (NFL/Reference/DVOA.md), ATS trends (NFL/Reference/ATS_Trends.md), key numbers (NFL/Reference/KeyNumbers.md), or team-specific notes (NFL/Teams/<ABBR>.md). Also use when the Creator asks about notes or angles from a previous session (NFL/Sessions/YYYY-MM-DD.md).',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Vault-relative path to the note (e.g. "NFL/Reference/CoachTendencies.md", "NFL/Sessions/2026-09-07.md", "NFL/Teams/KC.md")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_vault_note',
    description: 'Write or update a note in the NFL betting vault. Use post-session to save angles, picks, and rationale to NFL/Sessions/YYYY-MM-DD.md. Also use to update team notes (NFL/Teams/<ABBR>.md) or add a new trend to NFL/Reference/ATS_Trends.md. Always confirm with the Creator before writing.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Vault-relative path for the note (e.g. "NFL/Sessions/2026-09-07.md")',
        },
        content: {
          type: 'string',
          description: 'Full markdown content to write. For session notes, use the standard format: # Session YYYY-MM-DD\n\n## Angles\n...\n\n## Picks\n...\n\n## Outcome Notes\n...',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for this note (e.g. ["session", "week-1", "KC"])',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'get_betting_splits',
    description: 'Retrieve current betting splits (public bettor% and public money%) for this week\'s NFL games from Action Network. Use to identify sharp vs. public divergence: when money% differs significantly from ticket%, sharp money is on the minority side. Call this before any pick that hinges on contrarian or sharp-money angles.',
    input_schema: {
      type: 'object',
      properties: {
        team: {
          type: 'string',
          description: 'Optional: filter to a specific team (e.g. "KC", "BUF"). Omit to return all games.',
        },
        week: {
          type: 'number',
          description: 'NFL week number. Omit to use the current week.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_sharp_tweets',
    description: 'Search recent tweets from tracked sharp NFL accounts (Warren Sharp, VSiN, Action Network, PFF, BettingPros, and others). Use when looking for sharp-money signals, line-move intel, injury reactions, or quick angles that may not yet appear in full articles.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms (team names, player names, bet type, concept). E.g. "Chiefs spread", "Mahomes injury", "steam move".',
        },
        handle: {
          type: 'string',
          description: 'Optional: filter to a specific account handle (e.g. "SharpFootball", "VSiN"). Omit for all accounts.',
        },
        hours: {
          type: 'number',
          description: 'Look-back window in hours. Default: 168 (7 days).',
        },
        limit: {
          type: 'number',
          description: 'Max tweets to return. Default: 8.',
        },
      },
      required: ['query'],
    },
  },
];

// ─── Tool Executor ───────────────────────────────────────────────────────────

/**
 * Execute a tool by name with the given input.
 * Returns a serializable result object or string.
 *
 * @param {string} name   - Tool name
 * @param {object} input  - Tool input (per input_schema)
 * @returns {Promise<object|string>}
 */
export async function executeTool(name, input) {
  switch (name) {
    case 'get_odds':        return toolGetOdds(input);
    case 'get_line_movement': return toolGetLineMovement(input);
    case 'analyze_matchup': return toolAnalyzeMatchup(input);
    case 'get_injury_report': return toolGetInjuryReport(input);
    case 'calculate_hedge': return toolCalculateHedge(input);
    case 'calculate_teaser': return toolCalculateTeaser(input);
    case 'log_pick':        return toolLogPick(input);
    case 'get_performance_stats': return toolGetPerformanceStats(input);
    case 'search_intel':        return toolSearchIntel(input);
    case 'search_sharp_tweets': return toolSearchSharpTweets(input);
    case 'read_vault_note':     return toolReadVaultNote(input);
    case 'write_vault_note':    return toolWriteVaultNote(input);
    case 'get_betting_splits': return toolGetBettingSplits(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── OpenAI Function-Call Format ──────────────────────────────────────────────
// OpenAI requires { type: 'function', function: { name, description, parameters } }
// instead of Anthropic's { name, description, input_schema }.

export const OPENAI_BETTING_TOOLS = BETTING_TOOLS.map(t => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

// ─── Individual Tool Implementations ─────────────────────────────────────────

async function toolGetOdds({ teams } = {}) {
  const snapshot = await getLatestOddsSnapshot();
  if (!snapshot) {
    return {
      status: 'unavailable',
      reason: 'No odds snapshot found — OddsIngestAgent has not run recently or it is the NFL offseason.',
      guidance: 'Do not fabricate lines or spreads. State clearly that live odds are not loaded and advise the user to check back during the regular season.',
    };
  }

  let games = snapshot.games || [];

  // Filter by team name if provided
  if (teams && teams.trim()) {
    const q = teams.toLowerCase();
    games = games.filter(g =>
      g.home?.toLowerCase().includes(q) ||
      g.away?.toLowerCase().includes(q) ||
      g.home_team?.toLowerCase().includes(q) ||
      g.away_team?.toLowerCase().includes(q)
    );
  }

  return {
    fetched_at: snapshot.fetchedAt,
    game_count: games.length,
    games: games.slice(0, 20), // cap to avoid context overflow
  };
}

async function toolGetLineMovement({ game, hours = 24 } = {}) {
  const movements = await getLineMovementsDB(hours);
  if (!movements || movements.length === 0) {
    return {
      status: 'unavailable',
      reason: 'No line movements found — no sharp activity in the window or it is the NFL offseason.',
      guidance: 'Do not fabricate movement data. Acknowledge that no line movement is available and do not speculate about steam or reverse-line action.',
    };
  }

  let filtered = movements;
  if (game && game.trim()) {
    const q = game.toLowerCase();
    filtered = movements.filter(m =>
      m.game?.toLowerCase().includes(q) ||
      m.home_team?.toLowerCase().includes(q) ||
      m.away_team?.toLowerCase().includes(q)
    );
  }

  return {
    window_hours: hours,
    movement_count: filtered.length,
    movements: filtered.slice(0, 30),
  };
}

async function toolAnalyzeMatchup({ home_team, away_team }) {
  if (!home_team || !away_team) {
    return { error: 'Both home_team and away_team are required.' };
  }

  // Load schedule from public/
  let schedule = [];
  try {
    const resp = await fetch(LOCAL_DATA.SCHEDULE);
    if (resp.ok) schedule = await resp.json();
  } catch { /* non-fatal */ }

  // Load weekly stats
  let stats = {};
  try {
    const resp = await fetch(LOCAL_DATA.WEEKLY_STATS);
    if (resp.ok) stats = await resp.json();
  } catch { /* non-fatal */ }

  const homeLower = home_team.toLowerCase();
  const awayLower = away_team.toLowerCase();

  // Normalize inputs to canonical abbreviations for reliable schedule lookup
  const homeCanon = normalizeTeam(home_team);
  const awayCanon = normalizeTeam(away_team);
  const homeAbbr = homeCanon ? getTeamAbbreviation(homeCanon) : null;
  const awayAbbr = awayCanon ? getTeamAbbreviation(awayCanon) : null;

  // Find matching game in schedule — prefer exact abbreviation match, fall
  // back to fuzzy string match so the tool still works with partial inputs.
  const game = schedule.find(g => {
    const h = g.home || g.home_abbrev || '';
    const v = g.visitor || g.away_abbrev || '';
    if (homeAbbr && awayAbbr) {
      return h === homeAbbr && v === awayAbbr;
    }
    // Fuzzy fallback when normalization fails (unknown/misspelled team names)
    const hLower = h.toLowerCase();
    const vLower = v.toLowerCase();
    return (hLower.includes(homeLower) || homeLower.includes(hLower)) &&
           (vLower.includes(awayLower) || awayLower.includes(vLower));
  });

  // Find stats entries
  const statsArr = Array.isArray(stats) ? stats : Object.values(stats).flat();
  const homeStats = statsArr.find(t => (t.team || '').toLowerCase().includes(homeLower));
  const awayStats  = statsArr.find(t => (t.team || '').toLowerCase().includes(awayLower));

  // Basic projection: points scored avg vs allowed avg
  const homeOffense  = parseFloat(homeStats?.pts_for_avg  || homeStats?.points_for  || 24);
  const homeDefense  = parseFloat(homeStats?.pts_allowed_avg || homeStats?.points_against || 24);
  const awayOffense  = parseFloat(awayStats?.pts_for_avg  || awayStats?.points_for  || 24);
  const awayDefense  = parseFloat(awayStats?.pts_allowed_avg || awayStats?.points_against || 24);

  const homeProj  = (homeOffense + (28 - awayDefense)) / 2;
  const awayProj  = (awayOffense + (28 - homeDefense)) / 2;
  const predictedMargin = homeProj - awayProj;
  const predictedTotal  = homeProj + awayProj;

  const intelBullets = [];
  if (game?.spread) intelBullets.push(`Market spread: ${home_team} ${game.spread}`);
  if (game?.total)  intelBullets.push(`Market total: ${game.total}`);
  if (homeStats?.record) intelBullets.push(`${home_team} record: ${homeStats.record}`);
  if (awayStats?.record)  intelBullets.push(`${away_team} record: ${awayStats.record}`);
  intelBullets.push(`Model home projection: ${homeProj.toFixed(1)} pts`);
  intelBullets.push(`Model away projection: ${awayProj.toFixed(1)} pts`);

  return {
    home_team,
    away_team,
    home_proj: parseFloat(homeProj.toFixed(1)),
    away_proj:  parseFloat(awayProj.toFixed(1)),
    predicted_margin: parseFloat(predictedMargin.toFixed(1)),
    predicted_total:  parseFloat(predictedTotal.toFixed(1)),
    market_spread: game?.spread ?? 'N/A',
    market_total:  game?.total  ?? 'N/A',
    game_date: game?.date ?? 'N/A',
    key_intel_bullets: intelBullets,
    model_confidence: 'low (offseason — limited stats)',
    data_sources: {
      schedule_found: !!game,
      home_stats_found: !!homeStats,
      away_stats_found: !!awayStats,
    },
  };
}

async function toolGetInjuryReport({ team }) {
  if (!team) return { error: 'team is required' };

  const abbr = team.toUpperCase().replace(/^(the )/i, '').trim().split(' ').pop();
  const teamId = ESPN_TEAM_IDS[abbr];

  if (!teamId) {
    return {
      status: 'unknown_team',
      message: `No ESPN team ID for "${team}". Known abbreviations: ${Object.keys(ESPN_TEAM_IDS).join(', ')}`,
    };
  }

  const urls = [
    `${ESPN_API.INJURIES_URL}/${teamId}/injuries`,
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/teams/${teamId}/injuries`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data = await resp.json();

      const items = data?.items || [];
      const injuries = items.slice(0, 15).map(item => ({
        player:   item?.athlete?.displayName ?? item?.displayName ?? 'Unknown',
        position: item?.athlete?.position?.abbreviation ?? 'N/A',
        status:   item?.status?.type?.description ?? item?.type?.description ?? 'Unknown',
        injury:   item?.injuries?.[0]?.type?.description ?? 'Unknown',
      }));

      return { team: abbr, team_id: teamId, injury_count: injuries.length, injuries };
    } catch { /* try next */ }
  }

  return {
    status: 'unavailable',
    message: 'ESPN injury API returned no data. This is common in the offseason.',
    team: abbr,
  };
}

function toolCalculateHedge({ original_bet_amount, original_odds, hedge_odds, target_profit }) {
  // Convert American odds to decimal
  const toDecimal = (american) => {
    if (american > 0) return (american / 100) + 1;
    return (100 / Math.abs(american)) + 1;
  };

  const origDecimal  = toDecimal(original_odds);
  const hedgeDecimal = toDecimal(hedge_odds);

  const originalPayout   = original_bet_amount * origDecimal;
  const originalProfit   = originalPayout - original_bet_amount;

  // Break-even hedge: guarantee $0 net regardless of outcome
  // If original wins: originalProfit - hedgeStake
  // If hedge wins: (hedgeStake * (hedgeDecimal - 1)) - original_bet_amount
  // Set them equal to find break-even hedge_stake
  const breakEvenHedge = originalPayout / hedgeDecimal;
  const breakEvenProfit = originalProfit - breakEvenHedge;

  // Target hedge (if specified)
  let targetHedge = null;
  let targetGuarantee = null;
  if (target_profit !== undefined && target_profit !== null) {
    // Win original + hedge loses: originalProfit - targetHedge = target_profit
    // → targetHedge = originalProfit - target_profit
    targetHedge = originalProfit - target_profit;
    targetGuarantee = target_profit;
    if (targetHedge < 0) {
      targetHedge = null; // can't lock in more profit than original payout allows
    }
  }

  return {
    original: {
      stake: original_bet_amount,
      odds: original_odds,
      potential_profit: parseFloat(originalProfit.toFixed(2)),
      potential_payout: parseFloat(originalPayout.toFixed(2)),
    },
    break_even_hedge: {
      hedge_stake: parseFloat(breakEvenHedge.toFixed(2)),
      hedge_odds,
      guaranteed_profit: parseFloat(breakEvenProfit.toFixed(2)),
      recommendation: breakEvenProfit >= 0
        ? `Bet $${breakEvenHedge.toFixed(2)} on the opposite side to guarantee $${breakEvenProfit.toFixed(2)}`
        : 'Break-even hedge not achievable at these odds — you would lock in a loss.',
    },
    target_hedge: targetHedge !== null ? {
      hedge_stake: parseFloat(targetHedge.toFixed(2)),
      guaranteed_profit: parseFloat(targetGuarantee.toFixed(2)),
    } : null,
  };
}

function toolCalculateTeaser({ legs, teaser_odds = -120 }) {
  if (!Array.isArray(legs) || legs.length < 2) {
    return { error: 'Teasers require at least 2 legs.' };
  }

  // Key numbers in NFL: 3 and 7 (most common final margins)
  const KEY_NUMBERS = [3, 7];

  const crossesKeyNumber = (spread, teaserPts) => {
    const newSpread = spread + teaserPts;
    return KEY_NUMBERS.some(k => {
      const min = Math.min(spread, newSpread);
      const max = Math.max(spread, newSpread);
      return k > min && k <= max;
    });
  };

  const legsAnalysis = legs.map(leg => {
    const points = leg.teaser_points || 6;
    const newSpread = leg.spread + points;
    const crossesKey = crossesKeyNumber(leg.spread, points);
    return {
      team:        leg.team,
      original_spread: leg.spread,
      teaser_points:   points,
      new_spread:      newSpread,
      crosses_key_number: crossesKey,
    };
  });

  // Wong teaser: at least 2 legs each crossing a key number (typically from -8.5 to -2.5 range)
  const wongQualifyingLegs = legsAnalysis.filter(l => l.crosses_key_number);
  const wongQualified = wongQualifyingLegs.length >= 2;

  // Quick EV estimate (rough):
  // Standard 6pt underdog: ~73% win rate per leg (with key number boost)
  // Without key number: ~68% per leg
  const perLegWinProb = legsAnalysis.map(l => l.crosses_key_number ? 0.73 : 0.68);
  const combinedWinProb = perLegWinProb.reduce((acc, p) => acc * p, 1);

  const toDecimal = (american) => american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
  const payoutDecimal = toDecimal(teaser_odds);
  const ev = (combinedWinProb * (payoutDecimal - 1)) - (1 - combinedWinProb);

  return {
    legs: legsAnalysis,
    teaser_odds,
    crosses_key_numbers: wongQualifyingLegs.map(l => l.team),
    wong_qualified: wongQualified,
    estimated_win_probability: parseFloat((combinedWinProb * 100).toFixed(1)) + '%',
    ev_estimate: parseFloat(ev.toFixed(3)),
    recommendation: wongQualified
      ? `✅ WONG-QUALIFIED: ${wongQualifyingLegs.map(l => l.team).join(' + ')} both cross key numbers. EV: ${ev.toFixed(3)} (above 0 = +EV).`
      : `⚠️ NOT WONG: Only ${wongQualifyingLegs.length} of ${legs.length} legs cross key numbers. EV: ${ev.toFixed(3)}. Teasers without key number crossings are typically -EV.`,
  };
}

async function toolLogPick({ team, pick_type, line, odds, amount_units, game_context, notes, book }) {
  // Map to picksDatabase.addPick schema
  const gameId = `agent-${game_context?.replace(/\s+/g, '-').toLowerCase() || team}-${Date.now()}`;
  const result = addPick({
    gameId,
    source: 'AI_LAB',
    pickType: pick_type,
    selection: team,
    line: parseFloat(line),
    confidence: 60,
    edge: 0,
    rationale: notes || `Logged by BETTING agent${book ? ` · Book: ${book}` : ''}`,
    expert: 'BETTING Agent',
    units: amount_units || 1,
    gameDate: new Date().toISOString().split('T')[0],
    gameTime: '00:00',
    commenceTimeISO: null,
    odds: odds || -110,
  });

  if (!result.success) {
    return { status: 'error', message: result.error || 'Failed to log pick', validation_errors: result.errors };
  }

  return {
    status: 'logged',
    pick_id: result.pick?.id,
    summary: `✅ Logged: ${team} ${pick_type} ${line} (${odds > 0 ? '+' : ''}${odds}) · ${amount_units}u · ${game_context || ''}`,
  };
}

function toolGetPerformanceStats({ source } = {}) {
  const filterSource = source || null;
  const standings = calculateStandings(filterSource);
  const confBreakdown = statsByConfidence();
  const edgeBreakdown = statsByEdge(filterSource);

  const allPicks = loadPicks(filterSource ? { source: filterSource } : {});
  const graded = allPicks.filter(p => p.result !== 'PENDING');
  const pending = allPicks.filter(p => p.result === 'PENDING').length;

  // Team breakdown — group by selection
  const byTeamMap = {};
  graded.forEach(p => {
    const team = p.selection || 'unknown';
    if (!byTeamMap[team]) {
      byTeamMap[team] = { wins: 0, losses: 0, pushes: 0 };
    }
    if (p.result === 'WIN') byTeamMap[team].wins++;
    else if (p.result === 'LOSS') byTeamMap[team].losses++;
    else if (p.result === 'PUSH') byTeamMap[team].pushes++;
  });
  const byTeam = Object.entries(byTeamMap)
    .map(([team, s]) => {
      const total = s.wins + s.losses;
      return {
        team,
        wins: s.wins,
        losses: s.losses,
        pushes: s.pushes,
        winRate: total > 0 ? +(s.wins / total * 100).toFixed(1) : 0,
      };
    })
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 15);

  // Rolling last-10 graded
  const last10 = graded.slice(-10);
  const JUICE = 1.1;
  const last10Units = last10.reduce((acc, p) => {
    if (p.result === 'WIN') return acc + 1;
    if (p.result === 'LOSS') return acc - JUICE;
    return acc;
  }, 0);

  return {
    total_graded: graded.length,
    total_pending: pending,
    standings,
    last_10: {
      wins: last10.filter(p => p.result === 'WIN').length,
      losses: last10.filter(p => p.result === 'LOSS').length,
      units: +last10Units.toFixed(2),
    },
    by_confidence: confBreakdown,
    by_edge: edgeBreakdown,
    by_team: byTeam,
  };
}

async function toolSearchIntel({ query, source, hours = 168, limit = 5 } = {}) {
  if (!query?.trim()) {
    return { error: 'query is required.' };
  }

  const { notes, signals } = await searchResearchIntel(query.trim(), {
    source,
    hours,
    limit,
  });

  if (notes.length === 0) {
    return {
      status: 'no_results',
      query,
      source: source || 'all sources',
      window_hours: hours,
      message: `No articles found matching "${query}" in the last ${hours}h. The intel agent may not have captured content on this topic yet.`,
    };
  }

  // Group signals by note id for easy attachment
  const signalsByNoteId = {};
  signals.forEach(s => {
    if (!signalsByNoteId[s.note_id]) signalsByNoteId[s.note_id] = [];
    signalsByNoteId[s.note_id].push(s);
  });

  return {
    query,
    source: source || 'all sources',
    window_hours: hours,
    result_count: notes.length,
    articles: notes.map(n => ({
      source: n.source,
      title: n.title,
      summary: n.summary,
      url: n.url,
      published_at: n.published_at,
      confidence: n.confidence,
      pick_signals: (signalsByNoteId[n.id] || []).map(s => ({
        lean: s.lean,
        bet_type: s.bet_type,
        confidence: s.confidence,
      })),
    })),
  };
}

async function toolSearchSharpTweets({ query, handle, hours = 168, limit = 8 } = {}) {
  if (!query?.trim()) {
    return { error: 'query is required.' };
  }

  const tweets = await searchSharpTweets(query.trim(), {
    handle,
    hours,
    limit,
  });

  if (tweets.length === 0) {
    return {
      status: 'no_results',
      query,
      handle: handle || 'all accounts',
      window_hours: hours,
      message: `No sharp tweets found matching "${query}" in the last ${hours}h. The ingest agent may not have captured recent content, or try a broader query.`,
    };
  }

  return {
    query,
    handle: handle || 'all accounts',
    window_hours: hours,
    result_count: tweets.length,
    tweets: tweets.map(t => ({
      account:      `@${t.author_handle}`,
      tier:         t.author_tier,
      text:         t.text,
      url:          t.tweet_url,
      published_at: t.published_at,
    })),
  };
}

async function toolReadVaultNote({ path } = {}) {
  if (!path?.trim()) {
    return { error: 'path is required.' };
  }

  const content = await readVaultNote(path.trim());
  if (content === null) {
    return {
      status: 'not_found',
      path,
      message: `Note not found at "${path}". Common reference paths: NFL/Reference/CoachTendencies.md, NFL/Reference/DVOA.md, NFL/Reference/ATS_Trends.md, NFL/Reference/KeyNumbers.md. Session paths: NFL/Sessions/YYYY-MM-DD.md.`,
    };
  }

  return {
    status: 'ok',
    path,
    char_count: content.length,
    content,
  };
}

async function toolWriteVaultNote({ path, content, tags = [] } = {}) {
  if (!path?.trim()) return { error: 'path is required.' };
  if (!content?.trim()) return { error: 'content is required.' };

  // Safety: scope writes to NFL/ prefix only
  const safePath = path.trim();
  if (!safePath.startsWith('NFL/')) {
    return {
      error: 'Vault writes are scoped to the NFL/ prefix. Use paths like "NFL/Sessions/YYYY-MM-DD.md" or "NFL/Teams/KC.md".',
    };
  }

  const ok = await writeVaultNote(safePath, content.trim(), tags || []);
  if (!ok) {
    return {
      status: 'error',
      path: safePath,
      message: 'Write failed. Check that VITE_OBSIDIAN_API_KEY is set and Obsidian is running (local dev), or that vault_notes table is accessible (production).',
    };
  }

  return {
    status: 'written',
    path: safePath,
    char_count: content.trim().length,
    tags: tags || [],
    message: `\u2705 Note saved to ${safePath}`,
  };
}

async function toolGetBettingSplits({ team, week } = {}) {
  const { getNFLWeekInfo } = await import('./nflWeek.js');
  const currentWeek = week || getNFLWeekInfo().week;

  if (!currentWeek) {
    return {
      status: 'offseason',
      message: 'No active NFL games — splits are only available during the regular and postseason.',
      splits: [],
    };
  }

  const rows = await getGameSplitsForWeek(currentWeek);

  if (!rows || rows.length === 0) {
    return {
      status: 'unavailable',
      week: currentWeek,
      message: 'No splits data in database. The betting-splits-ingest agent may not have run yet for this week, or lines have not been posted.',
      splits: [],
    };
  }

  // Optionally filter by team
  let filtered = rows;
  if (team && team.trim()) {
    const q = team.trim().toUpperCase();
    filtered = rows.filter(r =>
      r.home_team?.toUpperCase().includes(q) ||
      r.away_team?.toUpperCase().includes(q),
    );
    if (filtered.length === 0) {
      return {
        status: 'not_found',
        week: currentWeek,
        message: `No game found for team "${team}" in week ${currentWeek}.`,
        splits: [],
      };
    }
  }

  const formatted = filtered.map(r => ({
    matchup:       `${r.away_team} @ ${r.home_team}`,
    game_id:       r.game_id,
    spread: {
      home_bettors: r.spread_home_bettors,
      home_money:   r.spread_home_money,
      away_bettors: r.spread_home_bettors != null ? 100 - r.spread_home_bettors : null,
      away_money:   r.spread_home_money   != null ? 100 - r.spread_home_money   : null,
    },
    total: {
      over_bettors:  r.total_over_bettors,
      over_money:    r.total_over_money,
      under_bettors: r.total_over_bettors != null ? 100 - r.total_over_bettors : null,
      under_money:   r.total_over_money   != null ? 100 - r.total_over_money   : null,
    },
    moneyline: {
      home_bettors: r.ml_home_bettors,
      home_money:   r.ml_home_money,
      away_bettors: r.ml_home_bettors != null ? 100 - r.ml_home_bettors : null,
      away_money:   r.ml_home_money   != null ? 100 - r.ml_home_money   : null,
    },
    captured_at: r.captured_at,
  }));

  return {
    status:  'ok',
    week:    currentWeek,
    source:  'actionnetwork',
    count:   formatted.length,
    splits:  formatted,
    note: 'Sharp money divergence signal: when ticket% and money% differ significantly (>15%), the money side represents larger-bet (sharper) action.',
  };
}
