// src/lib/survivorAlpha.js
// ═══════════════════════════════════════════════════════════════════════════════
// Alpha Survivor Contest Engine & Season-Long Path Optimizer
//
// Single source of truth for:
//   1. Spread to Straight-Up Win Probability modeling
//   2. 18-Week Survivor Grid Mapping for all 32 NFL teams
//   3. Future Value (FV) & Scarcity quantification
//   4. Optimal Path Solver (Max EV, Contrarian / Game-Theory, Conservative)
//   5. Live Path Simulation & Risk Breakdown
//   6. Profile-scoped persistence and "No Team Reuse" validation
//   7. Straight-up Auto-Grading via gradeMoneyline reuse
// ═══════════════════════════════════════════════════════════════════════════════

import { NFL_TEAMS, getTeam, getTeamAbbreviation } from './teams.js';
import { gradeMoneyline } from './picksDatabase.js';
import { getPickDeadline, isGameLocked } from './alphaDeadlines.js';
import {
  ALPHA_STATE_DOMAINS,
  loadAlphaState,
  saveAlphaState,
} from './storage.js';

// Standard NFL empirical standard deviation of margin of victory
export const NFL_MARGIN_SIGMA = 13.45;

/**
 * Standard error function approximation (Chebyshev fitting)
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard normal cumulative distribution function: Phi(z)
 */
export function standardNormalCdf(z) {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

/**
 * Converts a point spread (from the chosen team's perspective) to straight-up win probability.
 * e.g., spread = -7.0 (7-point favorite) -> ~0.70 (70% win probability)
 *       spread = 0.0 (pick'em) -> 0.50 (50% win probability)
 *       spread = +3.5 (3.5-point dog) -> ~0.40 (40% win probability)
 *
 * @param {number} spread - Point spread (negative for favorites, positive for dogs)
 * @returns {number} Win probability between 0.01 and 0.99
 */
export function spreadToWinProbability(spread) {
  if (typeof spread !== 'number' || Number.isNaN(spread)) return 0.5;
  // Margin of victory is modeled as Normal(mean = -spread, variance = sigma^2)
  // Prob(Victory > 0) = Phi(-spread / sigma)
  const z = -spread / NFL_MARGIN_SIGMA;
  const prob = standardNormalCdf(z);
  return Math.min(0.99, Math.max(0.01, Math.round(prob * 10000) / 10000));
}

/**
 * Converts American moneyline to implied win probability without vig.
 * @param {number} moneyline - e.g. -250 or +210
 * @returns {number} Win probability between 0.01 and 0.99
 */
export function moneylineToWinProbability(moneyline) {
  if (typeof moneyline !== 'number' || Number.isNaN(moneyline)) return 0.5;
  if (moneyline < 0) {
    return Math.round((-moneyline / (-moneyline + 100)) * 10000) / 10000;
  }
  return Math.round((100 / (moneyline + 100)) * 10000) / 10000;
}

/**
 * Categorizes a win probability / spread into a favorite strength tier with high-contrast UI colors.
 * @param {number} winProb - Win probability (0 to 1)
 * @param {number} spread - Point spread
 * @returns {Object} { tier, label, bgClass, textClass, badgeClass, pillClass, glow }
 */
export function getFavoriteTier(winProb, spread) {
  if (winProb >= 0.75 || spread <= -7.0) {
    return {
      tier: 'heavy_favorite',
      label: 'Heavy Fav',
      bgClass: 'bg-emerald-950/90 border-2 border-emerald-400 hover:bg-emerald-900 shadow-md shadow-emerald-950/60',
      textClass: 'text-emerald-300 font-bold',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50',
      pillClass: 'bg-emerald-500 text-slate-950 font-black',
      glow: 'shadow-emerald-900/40 ring-1 ring-emerald-400/40',
    };
  }
  if (winProb >= 0.60 || spread <= -3.5) {
    return {
      tier: 'moderate_favorite',
      label: 'Solid Fav',
      bgClass: 'bg-teal-950/85 border-2 border-teal-400/90 hover:bg-teal-900 shadow-md shadow-teal-950/50',
      textClass: 'text-teal-200 font-bold',
      badgeClass: 'bg-teal-500/20 text-teal-200 border border-teal-400/40',
      pillClass: 'bg-teal-400 text-slate-950 font-black',
      glow: 'shadow-teal-900/30',
    };
  }
  if (winProb >= 0.50 || spread <= 0) {
    return {
      tier: 'slight_favorite',
      label: 'Slight Fav',
      bgClass: 'bg-slate-900/90 border border-slate-500 hover:bg-slate-800 shadow-sm',
      textClass: 'text-slate-100 font-medium',
      badgeClass: 'bg-slate-700 text-slate-200 border border-slate-600',
      pillClass: 'bg-slate-700 text-slate-100 font-bold',
      glow: '',
    };
  }
  if (winProb >= 0.40 || spread <= 3.5) {
    return {
      tier: 'slight_underdog',
      label: 'Slight Dog',
      bgClass: 'bg-amber-950/80 border border-amber-500/80 hover:bg-amber-900/80 shadow-sm',
      textClass: 'text-amber-200 font-medium',
      badgeClass: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
      pillClass: 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/50',
      glow: '',
    };
  }
  return {
    tier: 'heavy_underdog',
    label: 'Underdog',
    bgClass: 'bg-rose-950/85 border border-rose-500/80 hover:bg-rose-900/80 shadow-sm',
    textClass: 'text-rose-200 font-medium',
    badgeClass: 'bg-rose-500/20 text-rose-200 border border-rose-500/40',
    pillClass: 'bg-rose-500/30 text-rose-200 font-bold border border-rose-500/50',
    glow: '',
  };
}

/**
 * Builds the complete 18-week matrix for all 32 NFL teams.
 *
 * @param {Array} schedule - Array of regular-season games with kickoff_utc and spread
 * @param {Object} [results={}] - Game results cache keyed by gameId { homeScore, visitorScore }
 * @param {Date} [now=new Date()] - Evaluation timestamp for lock status
 * @returns {Object} { teams: { [abbr]: { teamAbbr, fullName, weeks: { [w]: cell } } }, weekSummaries: { [w]: summary } }
 */
export function build18WeekGrid(schedule = [], results = {}, now = new Date()) {
  const teamsMap = {};
  const allTeamAbbrs = Object.values(NFL_TEAMS).map((t) => t.abbreviation);

  // Initialize empty grid for each team
  for (const abbr of allTeamAbbrs) {
    const teamMeta = Object.values(NFL_TEAMS).find((t) => t.abbreviation === abbr);
    teamsMap[abbr] = {
      teamAbbr: abbr,
      fullName: teamMeta?.fullName || abbr,
      name: teamMeta?.name || abbr,
      division: teamMeta?.division || '',
      conference: teamMeta?.conference || '',
      logo: teamMeta?.logo || '',
      weeks: {},
    };

    for (let w = 1; w <= 18; w += 1) {
      teamsMap[abbr].weeks[w] = {
        week: w,
        isBye: true,
        opponent: null,
        isHome: false,
        spread: null,
        winProb: 0,
        kickoff_utc: null,
        gameId: null,
        isLocked: false,
        result: null, // 'WIN', 'LOSS', 'PUSH', null
        homeScore: null,
        visitorScore: null,
      };
    }
  }

  const weekSummaries = {};
  for (let w = 1; w <= 18; w += 1) {
    weekSummaries[w] = {
      week: w,
      games: [],
      favoriteCount: 0,
      heavyFavCount: 0,
      scarcityIndex: 1.0,
    };
  }

  // Populate from schedule
  for (const game of schedule) {
    const week = Number(game.week);
    if (week < 1 || week > 18) continue;

    const homeAbbr = getTeamAbbreviation(game.home) || game.home;
    const visitorAbbr = getTeamAbbreviation(game.visitor) || game.visitor;
    if (!homeAbbr || !visitorAbbr) continue;

    const gameId = game.id || game.game_id || `${homeAbbr}_${visitorAbbr}_w${week}`;
    const homeSpread = typeof game.spread === 'number' ? game.spread : 0;
    const visitorSpread = -homeSpread;

    const homeWinProb = spreadToWinProbability(homeSpread);
    const visitorWinProb = spreadToWinProbability(visitorSpread);

    const locked = isGameLocked(game, now);
    const resultObj = results[gameId] || results[game.id] || results[game.game_id] || null;

    let homeResult = null;
    let visitorResult = null;
    if (resultObj && typeof resultObj.homeScore === 'number' && typeof resultObj.visitorScore === 'number') {
      homeResult = gradeMoneyline({ isHomeTeam: true }, resultObj.homeScore, resultObj.visitorScore);
      visitorResult = gradeMoneyline({ isHomeTeam: false }, resultObj.homeScore, resultObj.visitorScore);
    }

    if (teamsMap[homeAbbr]) {
      teamsMap[homeAbbr].weeks[week] = {
        week,
        isBye: false,
        opponent: visitorAbbr,
        isHome: true,
        spread: homeSpread,
        winProb: homeWinProb,
        kickoff_utc: game.kickoff_utc || null,
        gameId,
        isLocked: locked,
        result: homeResult,
        homeScore: resultObj?.homeScore ?? null,
        visitorScore: resultObj?.visitorScore ?? null,
      };
    }

    if (teamsMap[visitorAbbr]) {
      teamsMap[visitorAbbr].weeks[week] = {
        week,
        isBye: false,
        opponent: homeAbbr,
        isHome: false,
        spread: visitorSpread,
        winProb: visitorWinProb,
        kickoff_utc: game.kickoff_utc || null,
        gameId,
        isLocked: locked,
        result: visitorResult,
        homeScore: resultObj?.homeScore ?? null,
        visitorScore: resultObj?.visitorScore ?? null,
      };
    }

    weekSummaries[week].games.push({
      gameId,
      home: homeAbbr,
      visitor: visitorAbbr,
      homeSpread,
      homeWinProb,
      visitorWinProb,
      kickoff_utc: game.kickoff_utc || null,
      isLocked: locked,
    });
  }

  // Compute weekly scarcity index (fewer >= 0.70 favorites = higher scarcity value)
  for (let w = 1; w <= 18; w += 1) {
    const highFavs = Object.values(teamsMap).filter((t) => t.weeks[w] && !t.weeks[w].isBye && t.weeks[w].winProb >= 0.70).length;
    const medFavs = Object.values(teamsMap).filter((t) => t.weeks[w] && !t.weeks[w].isBye && t.weeks[w].winProb >= 0.60).length;
    weekSummaries[w].heavyFavCount = highFavs;
    weekSummaries[w].favoriteCount = medFavs;
    // Scarcity index: normalized between 1.0 (many options) and 3.0 (brutal bottleneck week with <= 2 heavy favorites)
    weekSummaries[w].scarcityIndex = highFavs <= 2 ? 3.0 : highFavs <= 4 ? 2.0 : highFavs <= 6 ? 1.4 : 1.0;
  }

  return { teams: teamsMap, weekSummaries };
}

/**
 * Calculates a team's Future Value (FV) across remaining weeks.
 *
 * Future Value quantifies the opportunity cost of burning a team now vs saving it.
 * Higher FV = high surplus win probabilities in future weeks, especially in scarce bottleneck weeks.
 *
 * @param {string} team - Team abbreviation
 * @param {number} fromWeek - Starting week (inclusive)
 * @param {Object} grid - Matrix output from build18WeekGrid
 * @returns {Object} { fvScore: number, tier: string, topFutureWeeks: Array }
 */
export function calculateTeamFutureValue(team, fromWeek = 1, grid) {
  const teamAbbr = getTeamAbbreviation(team) || team;
  const teamData = grid?.teams?.[teamAbbr];
  if (!teamData) return { team: teamAbbr, fvScore: 0, rawSum: 0, topFutureWeeks: [] };

  let weightedFv = 0;
  const futureWeeks = [];

  for (let w = Math.max(1, fromWeek + 1); w <= 18; w += 1) {
    const cell = teamData.weeks[w];
    if (!cell || cell.isBye) continue;

    if (cell.winProb >= 0.55) {
      const surplusProb = cell.winProb - 0.50; // surplus above 50%
      const scarcity = grid.weekSummaries?.[w]?.scarcityIndex || 1.0;
      const weekValue = surplusProb * scarcity;
      weightedFv += weekValue;

      if (cell.winProb >= 0.65) {
        futureWeeks.push({
          week: w,
          opponent: cell.opponent,
          isHome: cell.isHome,
          winProb: cell.winProb,
          spread: cell.spread,
          scarcity,
        });
      }
    }
  }

  // Normalize FV to a clean 0 to 10 scale
  const fvScore = Math.min(10.0, Math.round((weightedFv * 4.5) * 10) / 10);

  futureWeeks.sort((a, b) => b.winProb - a.winProb);

  const tier =
    fvScore >= 7.5 ? 'Elite Cornerstone (Save)'
    : fvScore >= 5.0 ? 'High Future Value'
    : fvScore >= 2.5 ? 'Moderate Utility'
    : 'Burn Target (Low FV)';

  return {
    team: teamAbbr,
    fvScore,
    tier,
    topFutureWeeks: futureWeeks.slice(0, 4),
  };
}

/**
 * Computes all 32 teams' Future Values for a given week.
 */
export function computeAllTeamsFutureValues(fromWeek = 1, grid) {
  const result = {};
  if (!grid?.teams) return result;

  for (const team of Object.keys(grid.teams)) {
    result[team] = calculateTeamFutureValue(team, fromWeek, grid);
  }
  return result;
}

/**
 * Validates if a team is available to pick in a specific week.
 *
 * Enforces the core survivor rule: No team may be reused across the 18-week season.
 *
 * @param {string} team - Team abbreviation
 * @param {Object} currentPicks - Object mapping week -> teamAbbr (e.g. { 1: 'KC', 2: 'SF' })
 * @param {number} forWeek - The week currently being picked
 * @returns {boolean} True if team is available
 */
export function isTeamAvailable(team, currentPicks = {}, forWeek = null) {
  if (!team) return false;
  const teamAbbr = getTeamAbbreviation(team) || team;
  for (const [w, pickedTeam] of Object.entries(currentPicks)) {
    if (Number(w) !== Number(forWeek) && (getTeamAbbreviation(pickedTeam) || pickedTeam) === teamAbbr) {
      return false;
    }
  }
  return true;
}

/**
 * Returns array of teams already burned in other weeks.
 */
export function getBurnedTeams(currentPicks = {}, excludeWeek = null) {
  const burned = [];
  for (const [w, team] of Object.entries(currentPicks)) {
    if (Number(w) !== Number(excludeWeek) && team) {
      burned.push(getTeamAbbreviation(team) || team);
    }
  }
  return burned;
}

/**
 * Simulates a survival path and calculates cumulative probability, bottleneck weeks, and expected life.
 *
 * @param {Object} picks - Map of week -> teamAbbr (e.g. { 1: 'KC', 2: 'BAL', ... })
 * @param {Object} grid - 18-week grid from build18WeekGrid
 * @returns {Object} Detailed simulation metrics
 */
export function simulateSurvivalPath(picks = {}, grid) {
  if (!grid?.teams) {
    return {
      survivalProb: 0,
      survivalProbPct: '0.0%',
      weeksCovered: 0,
      steps: [],
      bottleneck: null,
      isValid: false,
      violations: ['Grid data not loaded'],
    };
  }

  const steps = [];
  const usedTeams = new Set();
  const violations = [];
  let jointProb = 1.0;
  let bottleneckWeek = null;
  let lowestProbInPath = 1.0;

  for (let w = 1; w <= 18; w += 1) {
    const rawTeam = picks[w] || null;
    const team = rawTeam ? (getTeamAbbreviation(rawTeam) || rawTeam) : null;
    if (!team) {
      steps.push({
        week: w,
        team: null,
        opponent: null,
        winProb: 0,
        spread: null,
        cumulativeProb: jointProb,
        status: 'unpicked',
        result: null,
      });
      continue;
    }

    // Check reuse
    if (usedTeams.has(team)) {
      violations.push(`Week ${w}: Team ${team} reused (already picked in prior week)`);
    }
    usedTeams.add(team);

    const cell = grid.teams[team]?.weeks[w];
    if (!cell || cell.isBye) {
      violations.push(`Week ${w}: Team ${team} is on BYE in Week ${w}`);
      steps.push({
        week: w,
        team,
        opponent: 'BYE',
        winProb: 0,
        spread: null,
        cumulativeProb: 0,
        status: 'bye_error',
        result: null,
      });
      jointProb = 0;
      continue;
    }

    const prob = cell.winProb;
    jointProb *= prob;

    if (prob < lowestProbInPath) {
      lowestProbInPath = prob;
      bottleneckWeek = {
        week: w,
        team,
        opponent: cell.opponent,
        winProb: prob,
        spread: cell.spread,
      };
    }

    steps.push({
      week: w,
      team,
      opponent: cell.opponent,
      isHome: cell.isHome,
      winProb: prob,
      spread: cell.spread,
      cumulativeProb: Math.round(jointProb * 10000) / 10000,
      isLocked: cell.isLocked,
      result: cell.result,
      homeScore: cell.homeScore,
      visitorScore: cell.visitorScore,
      status: cell.result === 'WIN' ? 'won' : cell.result === 'LOSS' ? 'eliminated' : 'pending',
    });
  }

  const weeksCovered = Object.keys(picks).filter((k) => picks[k]).length;
  const isComplete = weeksCovered === 18 && violations.length === 0;

  return {
    survivalProb: Math.round(jointProb * 10000) / 10000,
    survivalProbPct: `${(jointProb * 100).toFixed(2)}%`,
    weeksCovered,
    isComplete,
    isValid: violations.length === 0,
    violations,
    bottleneck: bottleneckWeek,
    steps,
  };
}

/**
 * Algorithmic Pathfinder: Computes the Top 3 Season-Long Survival Routes
 *
 * 1. Max EV Path: Maximizes cumulative survival probability across all 18 weeks.
 * 2. Contrarian / Game-Theory Path: Preserves scarce cornerstone teams for late-season & crunch weeks.
 * 3. High-Floor Conservative Path: Maximizes immediate week-by-week survival safety.
 *
 * @param {Object} grid - 18-week grid from build18WeekGrid
 * @param {Object} [lockedPicks={}] - Pre-existing locked/fixed picks { 1: 'KC' }
 * @returns {Array} List of 3 computed path recommendation objects
 */
export function solveOptimalPaths(grid, lockedPicks = {}) {
  if (!grid?.teams) return [];

  const allTeams = Object.keys(grid.teams);
  const futureValues = computeAllTeamsFutureValues(1, grid);

  // Helper to solve a full 18-week assignment with given heuristics
  const solvePath = (strategyName, scoreFn) => {
    const pathPicks = { ...lockedPicks };
    const usedTeams = new Set(Object.values(lockedPicks).filter(Boolean));

    // Sort weeks by difficulty / scarcity to assign hardest bottleneck weeks first
    const unassignedWeeks = [];
    for (let w = 1; w <= 18; w += 1) {
      if (!pathPicks[w]) {
        unassignedWeeks.push(w);
      }
    }

    // Assign remaining weeks sequentially or by priority
    for (const w of unassignedWeeks) {
      let bestTeam = null;
      let bestScore = -Infinity;

      for (const team of allTeams) {
        if (usedTeams.has(team)) continue;

        const cell = grid.teams[team]?.weeks[w];
        if (!cell || cell.isBye) continue;

        const fv = futureValues[team]?.fvScore || 0;
        const score = scoreFn(cell.winProb, fv, w, cell.spread);

        if (score > bestScore) {
          bestScore = score;
          bestTeam = team;
        }
      }

      if (bestTeam) {
        pathPicks[w] = bestTeam;
        usedTeams.add(bestTeam);
      }
    }

    const sim = simulateSurvivalPath(pathPicks, grid);
    return {
      id: strategyName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: strategyName,
      picks: pathPicks,
      simulation: sim,
    };
  };

  // Route 1: Max EV Path (Joint probability maximizer with lookahead)
  const maxEvRoute = solvePath('Max EV Survival Path', (winProb, fv, week) => {
    const fvPenalty = week <= 6 ? fv * 0.02 : week <= 12 ? fv * 0.008 : 0;
    return winProb - fvPenalty;
  });
  maxEvRoute.description = 'Maximizes full 18-week cumulative survival rate, balancing top win probabilities with sensible team preservation.';
  maxEvRoute.badge = 'Recommended (Highest EV)';
  maxEvRoute.badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  // Route 2: Contrarian / Game-Theory Path
  const contrarianRoute = solvePath('Contrarian Game-Theory Path', (winProb, fv, week) => {
    if (week <= 8) {
      if (fv >= 7.0 && winProb < 0.88) return winProb - 0.40;
      return winProb - (fv * 0.04);
    }
    return winProb + (fv * 0.01);
  });
  contrarianRoute.description = 'Saves Tier-1 juggernauts for late-season and Thanksgiving bottlenecks, exploiting field attrition in large pools.';
  contrarianRoute.badge = 'High Leverage';
  contrarianRoute.badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';

  // Route 3: Conservative High-Floor Path
  const conservativeRoute = solvePath('Conservative High-Floor Path', (winProb) => {
    return winProb;
  });
  conservativeRoute.description = 'Prioritizes maximum weekly safety first to avoid early elimination and extend survival duration.';
  conservativeRoute.badge = 'Highest Floor';
  conservativeRoute.badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';

  return [maxEvRoute, contrarianRoute, conservativeRoute];
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile-Scoped Persistence & History
// ─────────────────────────────────────────────────────────────────────────────

export const SURVIVOR_CONTESTS = [
  {
    id: 'kens_survival_league',
    name: "Ken's Survival League",
    shortName: "Ken's Survival",
    description: "Ken's Survival League pool with player tracking and availability matrix.",
    rules: '18 Weeks · 1 Pick / Week · No Team Reuse',
  },
  {
    id: 'lms_2022',
    name: 'LMS 2022',
    shortName: 'LMS 2022',
    description: 'Last Man Standing 2022 survivor contest with field availability analytics.',
    rules: '18 Weeks · 1 Pick / Week · No Team Reuse',
  },
];

/**
 * Loads the profile's saved Survivor picks from local storage.
 *
 * @param {string} profileId - Tester or owner profile ID
 * @param {number} [season=2026] - Season year
 * @param {string} [contestId='kens_survival_league'] - Contest ID
 * @returns {Object} Saved picks map { [week]: teamAbbr }
 */
export function loadSurvivorPicks(profileId, season = 2026, contestId = null) {
  if (!profileId) return {};
  if (contestId) {
    const contestData = loadAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, null, { season, week: contestId });
    if (contestData && typeof contestData === 'object' && contestData.picks) {
      return contestData.picks;
    }
    if (contestData && typeof contestData === 'object' && !contestData.picks && !Array.isArray(contestData)) {
      return contestData;
    }
  }
  return loadAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, {}, { season, week: 'all' }) || {};
}

/**
 * Saves the profile's Survivor picks to local storage.
 *
 * @param {string} profileId - Tester or owner profile ID
 * @param {Object} picks - Picks map { [week]: teamAbbr }
 * @param {number} [season=2026] - Season year
 * @param {string} [contestId=null] - Contest ID
 */
export function saveSurvivorPicks(profileId, picks, season = 2026, contestId = null) {
  if (!profileId) return;
  if (contestId) {
    const existing = loadAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, {}, { season, week: contestId }) || {};
    const updated = { ...existing, picks };
    saveAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, updated, { season, week: contestId });
  }
  saveAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, picks, { season, week: 'all' });
}

/**
 * Loads the full state for a specific survivor contest (my picks + opponents roster).
 *
 * @param {string} profileId
 * @param {string} contestId
 * @param {number} [season=2026]
 * @returns {Object} { picks: {}, opponents: [] }
 */
export function loadSurvivorContestState(profileId, contestId = 'kens_survival_league', season = 2026) {
  if (!profileId) return { picks: {}, opponents: [] };
  const raw = loadAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, null, { season, week: contestId });
  if (raw && typeof raw === 'object') {
    return {
      picks: raw.picks || {},
      opponents: Array.isArray(raw.opponents) ? raw.opponents : [],
    };
  }
  // Fallback to legacy single-picks state if opening Ken's league for the first time
  const legacyPicks = loadAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, {}, { season, week: 'all' }) || {};
  return {
    picks: legacyPicks,
    opponents: [],
  };
}

/**
 * Saves full contest state (picks + opponents list) to profile-scoped storage.
 *
 * @param {string} profileId
 * @param {string} contestId
 * @param {Object} state - { picks, opponents }
 * @param {number} [season=2026]
 */
export function saveSurvivorContestState(profileId, contestId = 'kens_survival_league', state = {}, season = 2026) {
  if (!profileId) return;
  saveAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, state, { season, week: contestId });
  if (state.picks) {
    saveAlphaState(profileId, ALPHA_STATE_DOMAINS.SURVIVOR, state.picks, { season, week: 'all' });
  }
}

/**
 * Auto-grades all opponents' picks against real game outcomes in grid.
 *
 * @param {Array} opponents - List of opponent objects [{ id, name, status, eliminatedWeek, picks }]
 * @param {Object} grid - 18-week grid from build18WeekGrid
 * @returns {Array} Updated opponents with accurate alive/eliminated statuses
 */
export function autoGradeOpponents(opponents = [], grid) {
  if (!Array.isArray(opponents) || !grid?.teams) return opponents;

  return opponents.map((opp) => {
    let status = 'alive';
    let eliminatedWeek = null;

    for (let w = 1; w <= 18; w += 1) {
      const pickTeam = opp.picks?.[w];
      if (!pickTeam) continue;

      const teamAbbr = getTeamAbbreviation(pickTeam) || pickTeam;
      const cell = grid.teams[teamAbbr]?.weeks?.[w];
      if (!cell) continue;

      if (cell.result === 'LOSS') {
        status = 'eliminated';
        eliminatedWeek = w;
        break; // First loss eliminates the entry
      }
    }

    return {
      ...opp,
      status: opp.status === 'eliminated' && opp.eliminatedWeek ? opp.status : status,
      eliminatedWeek: opp.eliminatedWeek || eliminatedWeek,
    };
  });
}

/**
 * Calculates field exposure, consensus pick distributions, and remaining team availabilities.
 *
 * @param {Array} opponents - List of opponent objects
 * @param {number} currentWeek - Current active week (1-18)
 * @param {Object} grid - 18-week grid from build18WeekGrid
 * @param {Object} myPicks - User's current picks
 * @returns {Object} Field analytics breakdown
 */
export function calculateFieldExposure(opponents = [], currentWeek = 1, grid, myPicks = {}) {
  const totalCount = opponents.length;
  const aliveOpponents = opponents.filter((o) => o.status !== 'eliminated');
  const aliveCount = aliveOpponents.length;
  const eliminatedCount = totalCount - aliveCount;
  const survivalRate = totalCount > 0 ? Math.round((aliveCount / totalCount) * 1000) / 10 : 100;

  // 1. Current Week Pick Distribution
  const weekPickCounts = {};
  aliveOpponents.forEach((opp) => {
    const pick = opp.picks?.[currentWeek];
    if (pick) {
      const abbr = getTeamAbbreviation(pick) || pick;
      weekPickCounts[abbr] = (weekPickCounts[abbr] || 0) + 1;
    }
  });

  const weekDistribution = Object.entries(weekPickCounts)
    .map(([team, count]) => ({
      team,
      count,
      pct: aliveCount > 0 ? Math.round((count / aliveCount) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 2. All 32 NFL Teams Field Availability Matrix
  const teamAvailability = {};
  const allTeamAbbrs = grid?.teams ? Object.keys(grid.teams) : [];

  allTeamAbbrs.forEach((team) => {
    let burnedCount = 0;
    aliveOpponents.forEach((opp) => {
      const oppPicksValues = Object.values(opp.picks || {}).map((p) => getTeamAbbreviation(p) || p);
      if (oppPicksValues.includes(team)) {
        burnedCount += 1;
      }
    });

    const availableCount = Math.max(0, aliveCount - burnedCount);
    const availablePct = aliveCount > 0 ? Math.round((availableCount / aliveCount) * 1000) / 10 : 100;
    const burnedPct = aliveCount > 0 ? Math.round((burnedCount / aliveCount) * 1000) / 10 : 0;

    const userHasBurned = Object.values(myPicks).map((p) => getTeamAbbreviation(p) || p).includes(team);

    teamAvailability[team] = {
      team,
      burnedCount,
      burnedPct,
      availableCount,
      availablePct,
      userAvailable: !userHasBurned,
      // High leverage = User still holds team AND >60% of alive field has already burned it
      isHighLeverage: !userHasBurned && burnedPct >= 50 && aliveCount >= 3,
    };
  });

  return {
    totalCount,
    aliveCount,
    eliminatedCount,
    survivalRate,
    weekDistribution,
    teamAvailability,
  };
}

/**
 * Auto-grades a survivor pick given final scores.
 * Reuses pure gradeMoneyline from picksDatabase.js.
 *
 * @param {Object} pick - { team, isHomeTeam }
 * @param {number} homeScore
 * @param {number} visitorScore
 * @returns {'WIN'|'LOSS'|'PUSH'}
 */
export function gradeSurvivorPick(pick, homeScore, visitorScore) {
  return gradeMoneyline(pick, homeScore, visitorScore);
}

/**
 * Detects any saved survivor picks that have drifted into "Trap Game" territory
 * (win probability < 60% or spread > -3.5) before kickoff, and finds available safer pivot alternatives.
 *
 * @param {Object} picks - Map of { [week]: teamAbbr }
 * @param {Object} grid - 18-week grid from build18WeekGrid
 * @param {Date} [now=new Date()] - Evaluation timestamp
 * @returns {Array} List of trap alert objects
 */
export function detectTrapPicks(picks = {}, grid, now = new Date()) {
  if (!grid?.teams || !picks) return [];

  const trapAlerts = [];

  for (let w = 1; w <= 18; w += 1) {
    const rawPick = picks[w];
    if (!rawPick) continue;

    const teamAbbr = getTeamAbbreviation(rawPick) || rawPick;
    const cell = grid.teams[teamAbbr]?.weeks?.[w];
    if (!cell || cell.isBye) continue;

    // Skip past or locked games
    if (cell.result || cell.isLocked) continue;

    // A pick is a trap if win probability is < 60% or spread is > -3.5
    const isTrap =
      (typeof cell.winProb === 'number' && cell.winProb < 0.60) ||
      (typeof cell.spread === 'number' && cell.spread > -3.5);

    if (isTrap) {
      // Find safer available alternative teams for this week (not burned in other weeks)
      const alternativePivots = [];

      for (const [otherAbbr, otherTeamData] of Object.entries(grid.teams)) {
        if (otherAbbr === teamAbbr) continue;

        // Check if other team is available (not burned in weeks other than w)
        const isBurnedElsewhere = Object.entries(picks).some(([otherW, p]) => {
          return Number(otherW) !== w && (getTeamAbbreviation(p) || p) === otherAbbr;
        });

        if (isBurnedElsewhere) continue;

        const altCell = otherTeamData.weeks?.[w];
        if (!altCell || altCell.isBye || altCell.isLocked || altCell.result) continue;

        // Alternatives should have win probability >= 60%
        if (altCell.winProb >= 0.60) {
          alternativePivots.push({
            team: otherAbbr,
            fullName: otherTeamData.fullName || otherAbbr,
            spread: altCell.spread,
            winProb: altCell.winProb,
            winProbPct: `${Math.round(altCell.winProb * 1000) / 10}%`,
            opponent: altCell.opponent,
            isHome: altCell.isHome,
            tier: getFavoriteTier(altCell.winProb, altCell.spread),
          });
        }
      }

      alternativePivots.sort((a, b) => b.winProb - a.winProb);

      trapAlerts.push({
        week: w,
        team: teamAbbr,
        fullName: grid.teams[teamAbbr]?.fullName || teamAbbr,
        spread: cell.spread,
        winProb: cell.winProb,
        winProbPct: `${Math.round((cell.winProb || 0.5) * 1000) / 10}%`,
        opponent: cell.opponent,
        isHome: cell.isHome,
        kickoff_utc: cell.kickoff_utc,
        severity: cell.winProb < 0.50 ? 'CRITICAL' : 'WARNING',
        reason:
          cell.winProb < 0.50
            ? `Picked team is currently an underdog (${cell.spread > 0 ? '+' : ''}${cell.spread}) with ${(cell.winProb * 100).toFixed(1)}% win probability`
            : `Spread has tightened to ${cell.spread} (${(cell.winProb * 100).toFixed(1)}% win probability), putting this pick in toss-up territory`,
        alternativePivots: alternativePivots.slice(0, 4), // Top 4 safer pivots
      });
    }
  }

  return trapAlerts;
}


