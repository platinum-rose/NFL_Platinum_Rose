// src/lib/picksDatabase.js
// ─────────────────────────────────────────────────────────────
// Platinum Rose – Picks Tracking & Grading Engine
//
// This is the SINGLE SOURCE OF TRUTH for all pick tracking.
// It handles:
//   1. CRUD – add / load / update / delete picks
//   2. Grading – grade picks against final scores
//   3. Standings – compute W-L-P, units, ROI per source
//   4. Validation – enforce schema, dates, confidence format
import logger from './logger';
// ─────────────────────────────────────────────────────────────

import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage';
import { syncPick, deleteSyncedPick } from './supabase';
import { enqueueDirty, dequeueSuccess } from './syncQueue';

// Sync helper — fire and forget, never throws
const fireSync   = (pick)   =>
    syncPick(pick)
        .then(() => dequeueSuccess('pick', pick.id))
        .catch(() => enqueueDirty('pick', pick.id, pick));
const fireDelete  = (pickId) =>
    deleteSyncedPick(pickId)
        .then(() => dequeueSuccess('deletePick', pickId))
        .catch(() => enqueueDirty('deletePick', pickId, null));

// ── Storage Keys (canonical refs) ───────────────────────────
const STORAGE_KEY = PR_STORAGE_KEYS.PICKS.key;
const RESULTS_KEY = PR_STORAGE_KEYS.GAME_RESULTS.key;

// ── Constants ───────────────────────────────────────────────
const VALID_SOURCES   = ['AI_LAB', 'EXPERT'];
const VALID_TYPES     = ['spread', 'total', 'moneyline'];
const VALID_RESULTS   = ['WIN', 'LOSS', 'PUSH', 'PENDING'];
const JUICE           = 1.1;   // standard -110 vig

export const CONFIDENCE_BUCKETS = {
  low:    { min: 50,  max: 55,       label: '50-55%'  },
  medium: { min: 55,  max: 60,       label: '55-60%'  },
  high:   { min: 60,  max: Infinity, label: '60%+'    },
};

export const EDGE_BUCKETS = {
  small:  { min: 0,   max: 1.5,      label: '< 1.5pt' },
  medium: { min: 1.5, max: 3,        label: '1.5-3pt' },
  large:  { min: 3,   max: Infinity, label: '3pt+'    },
};

// ── Helpers ─────────────────────────────────────────────────

/** Read picks array from localStorage */
const readPicks  = () => loadFromStorage(STORAGE_KEY, []);

/** Write picks array to localStorage */
const writePicks = (picks) => saveToStorage(STORAGE_KEY, picks);

/** Read cached game results */
const readResults  = () => loadFromStorage(RESULTS_KEY, {});

/** Write cached game results */
const writeResults = (results) => saveToStorage(RESULTS_KEY, results);

/**
 * Generate a stable pick ID from the natural key.
 * Same source + gameId + pickType + line always produces the same ID,
 * so re-logging an identical pick cannot create a duplicate row.
 */
const generateId = (source, gameId, pickType, line) => {
  return `${source}-${gameId}-${pickType}-${line}`;
};

/**
 * Normalize confidence to whole-number percentage (50-100).
 * Catches the 0.57-vs-57 bug.
 */
const normalizeConfidence = (raw) => {
  if (typeof raw !== 'number' || isNaN(raw)) return 50;
  // If it looks like a decimal (0.01 – 0.99), convert to percentage
  if (raw > 0 && raw < 1) {
    logger.warn(`⚠️ Confidence was decimal (${raw}), converting to ${raw * 100}`);
    return Math.round(raw * 100);
  }
  return Math.round(raw);
};

/**
 * Build a full ISO commence_time from gameDate + gameTime.
 * Example: ("2026-02-07", "19:00") → "2026-02-07T19:00:00"
 * If an ISO string is already provided (from the odds API), pass it through.
 */
const buildCommenceTime = (gameDate, gameTime, commenceTimeISO) => {
  if (commenceTimeISO) return commenceTimeISO;
  if (!gameDate) return null;
  const time = gameTime || '00:00';
  return `${gameDate}T${time}:00`;
};

// ── Validation ──────────────────────────────────────────────

/**
 * Validate a pick object before saving.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
export const validatePick = (pick) => {
  const errors = [];

  if (!pick.gameId)                          errors.push('Missing gameId');
  if (!VALID_SOURCES.includes(pick.source))  errors.push(`Invalid source: ${pick.source}`);
  if (!VALID_TYPES.includes(pick.pickType))  errors.push(`Invalid pickType: ${pick.pickType}`);
  if (!pick.selection)                       errors.push('Missing selection');
  if (typeof pick.line !== 'number')         errors.push('line must be a number');
  if (!pick.home || !pick.visitor)           errors.push('Missing home/visitor');
  if (!pick.gameDate)                        errors.push('Missing gameDate — cannot grade without it');

  // Confidence sanity
  const conf = normalizeConfidence(pick.confidence);
  if (conf < 50 || conf > 100) errors.push(`Confidence out of range: ${conf}`);

  return errors.length ? { valid: false, errors } : { valid: true };
};

// ── CRUD ────────────────────────────────────────────────────

/**
 * Add a new pick. Returns the saved pick object (or null on failure).
 */
export const addPick = (pickData) => {
  const pick = {
    id:             generateId(pickData.source, pickData.gameId, pickData.pickType, pickData.line),
    gameId:         pickData.gameId,
    source:         pickData.source,
    pickType:       pickData.pickType,
    selection:      pickData.selection,
    line:           pickData.line,
    edge:           pickData.edge ?? 0,
    confidence:     normalizeConfidence(pickData.confidence),
    home:           pickData.home,
    visitor:        pickData.visitor,
    gameDate:       pickData.gameDate,       // "2026-02-07"
    gameTime:       pickData.gameTime || '', // "19:00"
    commenceTime:   buildCommenceTime(pickData.gameDate, pickData.gameTime, pickData.commenceTime),
    isHomeTeam:     pickData.isHomeTeam ?? false,
    createdAt:      new Date().toISOString(),
    result:         'PENDING',
    homeScore:      null,
    visitorScore:   null,
    gradedAt:       null,
    pinned:         pickData.pinned ?? false,
  };

  const check = validatePick(pick);
  if (!check.valid) {
    logger.error('❌ Pick validation failed:', check.errors, pick);
    return null;
  }

  const picks = readPicks();

  // Stable-key dedup — same source + gameId + pickType + line → same ID
  const isDupe = picks.some(p => p.id === pick.id);
  if (isDupe) {
    logger.warn('⚠️ Duplicate pick blocked:', pick.id);
    return null;
  }

  picks.push(pick);
  writePicks(picks);
  fireSync(pick);  // cloud sync — non-blocking
  logger.log(`✅ Pick saved: ${pick.source} ${pick.selection} ${pick.pickType} ${pick.line}`);
  return pick;
};

/** Load all picks, optionally filtered. */
export const loadPicks = (filters = {}) => {
  let picks = readPicks();

  if (filters.source)   picks = picks.filter(p => p.source === filters.source);
  if (filters.result)   picks = picks.filter(p => p.result === filters.result);
  if (filters.pickType) picks = picks.filter(p => p.pickType === filters.pickType);
  if (filters.dateFrom) picks = picks.filter(p => p.gameDate >= filters.dateFrom);
  if (filters.dateTo)   picks = picks.filter(p => p.gameDate <= filters.dateTo);

  return picks;
};

/** Delete a pick by ID. */
export const deletePick = (pickId) => {
  const picks = readPicks().filter(p => p.id !== pickId);
  writePicks(picks);
  fireDelete(pickId);  // cloud sync — non-blocking
};

/**
 * Toggle a pick's pinned state (Phase 1, 2026-08-24). Local-only -- unlike
 * addPick/deletePick this does NOT call fireSync/fireDelete, so it never
 * touches Supabase; pinning is a purely client-side sort/priority hint, not
 * pick data that needs to round-trip through the cloud sync queue.
 * @returns {boolean|null} the pick's new pinned state, or null if not found
 */
export const togglePickPin = (pickId) => {
  const picks = readPicks();
  const idx = picks.findIndex(p => p.id === pickId);
  if (idx === -1) return null;
  picks[idx] = { ...picks[idx], pinned: !picks[idx].pinned };
  writePicks(picks);
  return picks[idx].pinned;
};

/** Delete ALL picks (full reset). */
export const clearAllPicks = () => {
  writePicks([]);
  writeResults({});
  logger.log('🗑️ All picks and results cleared');
};

// ── Grading ─────────────────────────────────────────────────

/**
 * Grade a spread pick.
 *   Home pick (line is negative, e.g. -7.5):
 *     actualMargin > |line| → WIN   (covered)
 *     actualMargin < |line| → LOSS
 *     actualMargin = |line| → PUSH
 *   Away pick (line is positive, e.g. +7.5):
 *     Invert perspective.
 */
export const gradeSpread = (pick, homeScore, visitorScore) => {
  const actualMargin = homeScore - visitorScore; // positive = home won

  if (pick.isHomeTeam) {
    // Picked home team.  Line is from home POV (e.g. -7.5 means home favored by 7.5).
    const diff = actualMargin + pick.line; // pick.line is negative for favorites
    // e.g. home wins by 10, line = -7.5 → diff = 10 + (-7.5) = 2.5 → WIN
    if (diff > 0) return 'WIN';
    if (diff < 0) return 'LOSS';
    return 'PUSH';
  } else {
    // Picked away team.  pick.line stored from the picked team's POV (positive).
    const diff = -actualMargin + pick.line;
    if (diff > 0) return 'WIN';
    if (diff < 0) return 'LOSS';
    return 'PUSH';
  }
};

/**
 * Grade a total pick (OVER / UNDER).
 */
export const gradeTotal = (pick, homeScore, visitorScore) => {
  const actualTotal = homeScore + visitorScore;
  const isOver = pick.selection.toUpperCase() === 'OVER';

  if (isOver) {
    if (actualTotal > pick.line) return 'WIN';
    if (actualTotal < pick.line) return 'LOSS';
  } else {
    if (actualTotal < pick.line) return 'WIN';
    if (actualTotal > pick.line) return 'LOSS';
  }
  return 'PUSH';
};

/**
 * Grade a moneyline pick.
 * WIN if the picked team won; LOSS if they lost; PUSH on an exact tie.
 */
export const gradeMoneyline = (pick, homeScore, visitorScore) => {
  if (homeScore === visitorScore) return 'PUSH';
  const homeWon = homeScore > visitorScore;
  return pick.isHomeTeam ? (homeWon ? 'WIN' : 'LOSS') : (homeWon ? 'LOSS' : 'WIN');
};

/**
 * Grade a single pick given final scores.
 * Returns the updated pick (also persists to storage).
 */
export const gradePick = (pickId, homeScore, visitorScore) => {
  const picks = readPicks();
  const idx = picks.findIndex(p => p.id === pickId);
  if (idx === -1) {
    logger.error(`Pick not found: ${pickId}`);
    return null;
  }

  const pick = picks[idx];
  const result =
    pick.pickType === 'spread'    ? gradeSpread(pick, homeScore, visitorScore)
    : pick.pickType === 'moneyline' ? gradeMoneyline(pick, homeScore, visitorScore)
    :                                 gradeTotal(pick, homeScore, visitorScore);

  picks[idx] = {
    ...pick,
    result,
    homeScore,
    visitorScore,
    gradedAt: new Date().toISOString(),
  };

  writePicks(picks);
  fireSync(picks[idx]);  // cloud sync — non-blocking
  logger.log(`📝 Graded: ${pick.selection} ${pick.line} → ${result} (${homeScore}-${visitorScore})`);
  return picks[idx];
};

/**
 * Grade ALL pending picks for a specific game.
 */
export const gradeGame = (gameId, homeScore, visitorScore) => {
  const picks = readPicks();
  let graded = 0;

  const updated = picks.map(pick => {
    if (pick.gameId !== gameId || pick.result !== 'PENDING') return pick;

    const result =
      pick.pickType === 'spread'    ? gradeSpread(pick, homeScore, visitorScore)
      : pick.pickType === 'moneyline' ? gradeMoneyline(pick, homeScore, visitorScore)
      :                                 gradeTotal(pick, homeScore, visitorScore);

    graded++;
    return {
      ...pick,
      result,
      homeScore,
      visitorScore,
      gradedAt: new Date().toISOString(),
    };
  });

  writePicks(updated);

  // Sync graded picks to Supabase — fire and forget
  updated
    .filter(p => p.gameId === gameId && p.result !== 'PENDING')
    .forEach(p => fireSync(p));

  // Cache the result for future reference
  const results = readResults();
  results[gameId] = { homeScore, visitorScore, gradedAt: new Date().toISOString() };
  writeResults(results);

  logger.log(`📝 Graded ${graded} picks for game ${gameId}: ${homeScore}-${visitorScore}`);
  return graded;
};

/**
 * Find picks that SHOULD have been graded (game date is in the past)
 * but are still PENDING.
 */
export const findStalePicksPending = () => {
  const now = new Date();
  const picks = readPicks();

  return picks.filter(pick => {
    if (pick.result !== 'PENDING') return false;
    if (!pick.gameDate) return true; // No date = definitely stale

    // Game date + ~4 hours buffer for game to finish
    const gameEnd = new Date(pick.commenceTime || `${pick.gameDate}T23:59:59`);
    gameEnd.setHours(gameEnd.getHours() + 4);
    return now > gameEnd;
  });
};

// ── Standings / Stats ───────────────────────────────────────

/**
 * Compute standings for a given source (or all sources).
 */
export const calculateStandings = (source = null) => {
  const picks = source ? loadPicks({ source }) : readPicks();

  const bySource = {};

  picks.forEach(pick => {
    const s = pick.source;
    if (!bySource[s]) {
      bySource[s] = { wins: 0, losses: 0, pushes: 0, pending: 0, units: 0, picks: [] };
    }

    const row = bySource[s];
    row.picks.push(pick);

    switch (pick.result) {
      case 'WIN':     row.wins++;    row.units += 1;      break;
      case 'LOSS':    row.losses++;  row.units -= JUICE;  break;
      case 'PUSH':    row.pushes++;                       break;
      case 'PENDING': row.pending++;                      break;
    }
  });

  // Derived stats
  Object.values(bySource).forEach(row => {
    const decided = row.wins + row.losses;
    row.winRate = decided > 0 ? +(row.wins / decided * 100).toFixed(1) : 0;
    row.roi     = decided > 0 ? +(row.units / decided * 100).toFixed(1) : 0;
    row.record  = `${row.wins}-${row.losses}${row.pushes ? '-' + row.pushes : ''}`;
  });

  return bySource;
};

/**
 * Breakdown by confidence bucket (AI Lab only).
 */
export const statsByConfidence = () => {
  const aiPicks = loadPicks({ source: 'AI_LAB' }).filter(p => p.result !== 'PENDING');
  const buckets = {};

  Object.entries(CONFIDENCE_BUCKETS).forEach(([key, range]) => {
    const inBucket = aiPicks.filter(p => p.confidence >= range.min && p.confidence < range.max);
    const wins = inBucket.filter(p => p.result === 'WIN').length;
    const total = inBucket.length;
    buckets[key] = {
      label: range.label,
      total,
      wins,
      losses: inBucket.filter(p => p.result === 'LOSS').length,
      winRate: total > 0 ? +(wins / total * 100).toFixed(1) : 0,
    };
  });

  return buckets;
};

/**
 * Breakdown by edge bucket (both sources).
 */
export const statsByEdge = (source = null) => {
  const picks = (source ? loadPicks({ source }) : readPicks()).filter(p => p.result !== 'PENDING');
  const buckets = {};

  Object.entries(EDGE_BUCKETS).forEach(([key, range]) => {
    const inBucket = picks.filter(p => p.edge >= range.min && p.edge < range.max);
    const wins = inBucket.filter(p => p.result === 'WIN').length;
    const total = inBucket.length;
    buckets[key] = {
      label: range.label,
      total,
      wins,
      losses: inBucket.filter(p => p.result === 'LOSS').length,
      winRate: total > 0 ? +(wins / total * 100).toFixed(1) : 0,
    };
  });

  return buckets;
};

// ── Diagnostic / Debug ──────────────────────────────────────

/**
 * Full health check — run from browser console:
 *   import('/src/lib/picksDatabase.js').then(m => m.healthCheck())
 */
export const healthCheck = () => {
  const picks = readPicks();
  const stale = findStalePicksPending();
  const standings = calculateStandings();

  logger.log('\n🩺 PICKS DATABASE HEALTH CHECK\n' + '═'.repeat(60));
  logger.log(`Total picks:   ${picks.length}`);
  logger.log(`Pending:       ${picks.filter(p => p.result === 'PENDING').length}`);
  logger.log(`Graded:        ${picks.filter(p => p.result !== 'PENDING').length}`);
  logger.log(`Stale pending: ${stale.length} (past game date, never graded)`);

  if (stale.length > 0) {
    logger.log('\n⚠️ STALE PENDING PICKS (should be graded):');
    stale.forEach(p => {
      logger.log(`  ${p.gameDate} | ${p.visitor} @ ${p.home} | ${p.source} ${p.selection} ${p.line}`);
    });
  }

  // Check confidence format
  const badConf = picks.filter(p => p.confidence > 0 && p.confidence < 1);
  if (badConf.length) {
    logger.log(`\n❌ ${badConf.length} picks have decimal confidence (bug):`);
    badConf.slice(0, 5).forEach(p => logger.log(`  ${p.id}: ${p.confidence}`));
  }

  // Check missing dates
  const noDate = picks.filter(p => !p.gameDate);
  if (noDate.length) {
    logger.log(`\n❌ ${noDate.length} picks are missing gameDate — cannot be graded`);
  }

  logger.log('\n📊 STANDINGS:');
  Object.entries(standings).forEach(([src, s]) => {
    logger.log(`  ${src}: ${s.record} | Win%: ${s.winRate} | Units: ${s.units > 0 ? '+' : ''}${s.units.toFixed(2)} | ROI: ${s.roi}%`);
  });

  logger.log('\n' + '═'.repeat(60) + '\n');

  return { picks, stale, standings };
};

/**
 * Convert an expert consensus pick into a tracked pr_picks_v1 pick.
 * Source will be 'EXPERT'. Duplicate guard prevents re-tracking the same pick.
 *
 * @param {Object} expertPick  - object from expertConsensus[gameId].expertPicks.spread/total
 *                               (must include .gameId, added by ExpertManagerModal)
 */
export const addExpertPick = (expertPick) => {
  // Normalize pickType to lowercase VALID_TYPES value
  const rawType = (expertPick.pickType || '').toLowerCase();
  const pickType = rawType.includes('total')  ? 'total'
                 : rawType.includes('money')  ? 'moneyline'
                 :                              'spread';

  // Ensure line is a number
  const line = typeof expertPick.line === 'number'
    ? expertPick.line
    : parseFloat(expertPick.line) || 0;

  // selection lives in 'pick' field on expert objects
  const selection = expertPick.pick || expertPick.selection || '';

  return addPick({
    source:      'EXPERT',
    gameId:      expertPick.gameId,
    pickType,
    selection,
    line,
    edge:        0,
    confidence:  50,   // experts don't have confidence scores
    home:        expertPick.home || '',
    visitor:     expertPick.visitor || '',
    gameDate:    expertPick.gameDate || '',
    gameTime:    '',
    commenceTime: null,
    isHomeTeam:  expertPick.isHomeTeam ?? false,
  });
};

// ── Exports summary ─────────────────────────────────────────
// addPick, addExpertPick, loadPicks, deletePick, clearAllPicks
// gradePick, gradeGame, gradeSpread, gradeTotal, gradeMoneyline
// findStalePicksPending
// calculateStandings, statsByConfidence, statsByEdge
// validatePick, healthCheck
// CONFIDENCE_BUCKETS, EDGE_BUCKETS

// ── Multi-leg pick types ──────────────────────────────────────

/** All valid pick types across straight bets and multi-leg tickets. */
export const ALL_PICK_TYPES = ['spread', 'total', 'moneyline', 'parlay', 'round_robin'];

/**
 * Binomial coefficient C(n, r) — used for RR combination counts.
 * e.g. C(8, 4) = 70 sub-parlays in an 8-pick/4-team RR.
 */
const nCr = (n, r) => {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;
  let result = 1;
  for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1);
  return Math.round(result);
};

// ── Validation ────────────────────────────────────────────────

/**
 * Validate a parlay before saving.
 * Each leg needs at minimum: team (selection) + game (description) + line.
 */
export const validateParlay = (data) => {
  const errors = [];
  if (!Array.isArray(data.legs) || data.legs.length < 2)
    errors.push('Parlay requires at least 2 legs');
  if (data.legs?.some(l => !l.team || !l.game))
    errors.push('Each leg requires team and game');
  if (typeof data.combinedOdds !== 'number')
    errors.push('combinedOdds must be a number (American odds, e.g. +600)');
  if (typeof data.stake !== 'number' || data.stake <= 0)
    errors.push('stake must be a positive number of units');
  if (!data.gameDate)
    errors.push('Missing gameDate (use date of last leg)');
  return errors.length ? { valid: false, errors } : { valid: true };
};

/**
 * Validate a round-robin before saving.
 * parlaySize must be < totalLegs; minimum 5 total legs.
 */
export const validateRoundRobin = (data) => {
  const errors = [];
  if (!Array.isArray(data.legs) || data.legs.length < 5)
    errors.push('Round robin requires at least 5 legs');
  if (typeof data.totalLegs !== 'number' || data.totalLegs < 5)
    errors.push('totalLegs must be >= 5');
  if (typeof data.parlaySize !== 'number' || data.parlaySize < 2)
    errors.push('parlaySize must be >= 2');
  if (data.parlaySize >= data.totalLegs)
    errors.push('parlaySize must be less than totalLegs');
  if (typeof data.stakePer !== 'number' || data.stakePer <= 0)
    errors.push('stakePer must be a positive number of units');
  if (!data.gameDate)
    errors.push('Missing gameDate (use date of latest leg)');
  return errors.length ? { valid: false, errors } : { valid: true };
};

// ── CRUD ──────────────────────────────────────────────────────

/**
 * Log a parlay. Stored as a single pick entry with legs embedded.
 * Grade later with setPickResult() once all legs resolve.
 *
 * push rule: if a leg pushes, decrement effectiveTeamCount and pass via
 * setPickResult(id, result, { effectiveTeamCount: N, payout: X }).
 *
 * @param {object} data
 *   legs         -- [{ team, game, line?, result? }]  min 2 items
 *   combinedOdds -- American odds for the full ticket (e.g. +600)
 *   stake        -- units wagered
 *   gameDate     -- 'YYYY-MM-DD' of last leg
 *   contestName  -- optional ('Super Contest')
 *   contestWeek  -- optional (NFL week number)
 *   rationale    -- optional notes
 *   source       -- optional, defaults to 'AI_LAB'
 */
export const addParlay = (data) => {
  const check = validateParlay(data);
  if (!check.valid) {
    logger.error('Parlay validation failed:', check.errors);
    return { success: false, errors: check.errors };
  }

  const teamCount = data.legs.length;
  const id = 'parlay-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const pick = {
    id,
    pickType:           'parlay',
    source:             data.source || 'AI_LAB',
    teamCount,
    effectiveTeamCount: teamCount,
    legs:               data.legs.map(l => ({ team: l.team, game: l.game, line: l.line ?? null, result: l.result || 'PENDING' })),
    combinedOdds:       data.combinedOdds,
    stake:              data.stake,
    payout:             null,
    gameDate:           data.gameDate,
    contestName:        data.contestName || null,
    contestWeek:        data.contestWeek || null,
    result:             'PENDING',
    rationale:          data.rationale || '',
    createdAt:          new Date().toISOString(),
    gradedAt:           null,
  };

  const picks = readPicks();
  picks.push(pick);
  writePicks(picks);
  fireSync(pick);
  const oddsStr = (data.combinedOdds > 0 ? '+' : '') + data.combinedOdds;
  logger.log('Parlay saved: ' + teamCount + '-teamer @ ' + oddsStr + ' ' + data.stake + 'u (' + id + ')');
  return { success: true, pick };
};

/**
 * Log a round-robin.
 * Combination count is computed automatically: C(totalLegs, parlaySize).
 * Total stake = stakePer x combinations.
 *
 * @param {object} data
 *   legs          -- [{ team, game, line? }]  min 5 items
 *   totalLegs     -- total picks in the RR (must match legs.length)
 *   parlaySize    -- legs per sub-parlay (e.g. 4 for a 4-team RR)
 *   stakePer      -- units wagered per sub-parlay
 *   gameDate      -- 'YYYY-MM-DD' of latest leg
 *   rationale     -- optional notes
 *   source        -- optional, defaults to 'AI_LAB'
 */
export const addRoundRobin = (data) => {
  const check = validateRoundRobin(data);
  if (!check.valid) {
    logger.error('Round-robin validation failed:', check.errors);
    return { success: false, errors: check.errors };
  }

  const totalCombinations = nCr(data.totalLegs, data.parlaySize);
  const totalStake        = +(data.stakePer * totalCombinations).toFixed(2);
  const id = 'rr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

  const pick = {
    id,
    pickType:          'round_robin',
    source:            data.source || 'AI_LAB',
    totalLegs:         data.totalLegs,
    parlaySize:        data.parlaySize,
    totalCombinations,
    legs:              data.legs.map(l => ({ team: l.team, game: l.game, line: l.line ?? null, result: l.result || 'PENDING' })),
    stakePer:          data.stakePer,
    totalStake,
    wonCombinations:   null,
    totalPayout:       null,
    netUnits:          null,
    gameDate:          data.gameDate,
    result:            'PENDING',
    rationale:         data.rationale || '',
    createdAt:         new Date().toISOString(),
    gradedAt:          null,
  };

  const picks = readPicks();
  picks.push(pick);
  writePicks(picks);
  fireSync(pick);
  logger.log('RR saved: ' + data.totalLegs + '-pick/' + data.parlaySize + '-team ' + totalCombinations + ' combos ' + totalStake + 'u total (' + id + ')');
  return { success: true, pick };
};

/**
 * Directly set a pick result -- for manual grading of parlays, RRs, futures,
 * and any bet that cannot be auto-graded by final score.
 *
 * For parlays:  pass extra = { payout, effectiveTeamCount }
 * For RRs:      pass extra = { wonCombinations, totalPayout, netUnits }
 *
 * @param {string} pickId
 * @param {'WIN'|'LOSS'|'PUSH'} result
 * @param {object} [extra]  optional additional fields to merge onto the pick
 */
export const setPickResult = (pickId, result, extra) => {
  if (!VALID_RESULTS.includes(result)) {
    logger.error('setPickResult: invalid result "' + result + '"');
    return null;
  }
  const picks = readPicks();
  const idx = picks.findIndex(p => p.id === pickId);
  if (idx === -1) {
    logger.error('setPickResult: pick not found: ' + pickId);
    return null;
  }
  picks[idx] = Object.assign({}, picks[idx], { result, gradedAt: new Date().toISOString() }, extra || {});
  writePicks(picks);
  fireSync(picks[idx]);
  logger.log('setPickResult: ' + pickId + ' -> ' + result);
  return picks[idx];
};

// ── Analytics ─────────────────────────────────────────────────

/**
 * Performance breakdown by pick type.
 * Returns a record keyed by type with W-L-P, win rate, and units.
 *
 * parlay entry  -> byTeamCount sub-breakdown (e.g. { '3-team': { wins:4, losses:2, ... } })
 * round_robin   -> byConfig sub-breakdown  (e.g. { '8-pick/4-team': { wins:1, netUnits:-8 } })
 *
 * Unit accounting:
 *   straight bets -- WIN +1u, LOSS -JUICE (-1.1u at standard -110)
 *   parlays       -- WIN uses stored payout; LOSS uses stored stake
 *   RRs           -- WIN/LOSS use stored netUnits when available, else +/-totalStake
 */
export const statsByPickType = () => {
  const graded   = readPicks().filter(p => p.result !== 'PENDING');
  const allTypes = ['spread', 'total', 'moneyline', 'parlay', 'round_robin'];

  const result = {};
  allTypes.forEach(type => {
    const inType  = graded.filter(p => p.pickType === type);
    const wins    = inType.filter(p => p.result === 'WIN').length;
    const losses  = inType.filter(p => p.result === 'LOSS').length;
    const pushes  = inType.filter(p => p.result === 'PUSH').length;
    const decided = wins + losses;

    const units = inType.reduce((acc, p) => {
      if (p.result === 'WIN') {
        if (p.pickType === 'round_robin') return acc + (p.netUnits != null ? p.netUnits : (p.totalPayout != null ? p.totalPayout : 1));
        if (p.pickType === 'parlay')      return acc + (p.payout != null ? p.payout : 1);
        return acc + 1;
      }
      if (p.result === 'LOSS') {
        if (p.pickType === 'round_robin') return acc - (p.totalStake != null ? p.totalStake : JUICE);
        if (p.pickType === 'parlay')      return acc - (p.stake != null ? p.stake : JUICE);
        return acc - JUICE;
      }
      return acc;
    }, 0);

    result[type] = {
      total:   inType.length,
      wins,
      losses,
      pushes,
      winRate: decided > 0 ? +(wins / decided * 100).toFixed(1) : 0,
      units:   +units.toFixed(2),
    };
  });

  // Parlay sub-breakdown by effective team count
  const byTeamCount = {};
  graded.filter(p => p.pickType === 'parlay').forEach(p => {
    const key = (p.effectiveTeamCount != null ? p.effectiveTeamCount : p.teamCount) + '-team';
    if (!byTeamCount[key]) byTeamCount[key] = { wins: 0, losses: 0, pushes: 0, total: 0, winRate: 0 };
    byTeamCount[key].total++;
    if (p.result === 'WIN')       byTeamCount[key].wins++;
    else if (p.result === 'LOSS') byTeamCount[key].losses++;
    else if (p.result === 'PUSH') byTeamCount[key].pushes++;
  });
  Object.values(byTeamCount).forEach(b => {
    const d = b.wins + b.losses;
    b.winRate = d > 0 ? +(b.wins / d * 100).toFixed(1) : 0;
  });
  result.parlay.byTeamCount = byTeamCount;

  // RR sub-breakdown by config string
  const byConfig = {};
  graded.filter(p => p.pickType === 'round_robin').forEach(p => {
    const key = p.totalLegs + '-pick/' + p.parlaySize + '-team';
    if (!byConfig[key]) byConfig[key] = { wins: 0, losses: 0, total: 0, netUnits: 0 };
    byConfig[key].total++;
    if (p.result === 'WIN')       byConfig[key].wins++;
    else if (p.result === 'LOSS') byConfig[key].losses++;
    byConfig[key].netUnits = +(byConfig[key].netUnits + (p.netUnits != null ? p.netUnits : 0)).toFixed(2);
  });
  result.round_robin.byConfig = byConfig;

  return result;
};
