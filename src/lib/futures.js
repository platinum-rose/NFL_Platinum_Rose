// src/lib/futures.js
// Futures portfolio management — positions, parlays, P&L calculations

import { loadFromStorage, saveToStorage, ALPHA_STATE_DOMAINS, getAlphaStorageKey } from './storage';

export const STORAGE_KEY = 'nfl_futures_portfolio_v1';

let storageScope = null;

export function configureFuturesStorageScope(scope = null) {
  storageScope = scope;
}

function getStorageKey() {
  if (!storageScope?.profileId) return STORAGE_KEY;
  return getAlphaStorageKey({
    profileId: storageScope.profileId,
    stateDomain: ALPHA_STATE_DOMAINS.FUTURES_PORTFOLIO,
  });
}

// ── Bet type enum ────────────────────────────────────────────────────────────
export const FUTURES_TYPES = {
  PLAYOFFS:    'playoffs',      // Make the Playoffs (Yes/No)
  WINS:        'wins',          // Regular Season Wins O/U
  DIVISION:    'division',      // Divisional Winner
  CONFERENCE:  'conference',    // Conference Winner (AFC / NFC)
  SUPERBOWL:   'superbowl',    // Super Bowl Winner
  SB_MATCHUP:  'sb_matchup',   // Exact Super Bowl Matchup
};

export const FUTURES_TYPE_LABELS = {
  [FUTURES_TYPES.PLAYOFFS]:   'Make Playoffs',
  [FUTURES_TYPES.WINS]:       'Season Wins O/U',
  [FUTURES_TYPES.DIVISION]:   'Division Winner',
  [FUTURES_TYPES.CONFERENCE]: 'Conference Winner',
  [FUTURES_TYPES.SUPERBOWL]:  'Super Bowl Winner',
  [FUTURES_TYPES.SB_MATCHUP]: 'Exact SB Matchup',
};

export const POSITION_STATUS = {
  OPEN:   'OPEN',
  WON:    'WON',
  LOST:   'LOST',
  HEDGED: 'HEDGED',
  VOID:   'VOID',
};

// ── Parlay enums ─────────────────────────────────────────────────────────────

export const PARLAY_STATUS = {
  LIVE:   'LIVE',
  WON:    'WON',
  LOST:   'LOST',
  PUSHED: 'PUSHED',
  VOIDED: 'VOIDED',
};

export const PARLAY_LEG_TYPES = {
  SPREAD:    'SPREAD',
  TOTAL:     'TOTAL',
  MONEYLINE: 'MONEYLINE',
  FUTURES:   'FUTURES',
};

export const PARLAY_LEG_TYPE_LABELS = {
  SPREAD:    'Spread',
  TOTAL:     'Total',
  MONEYLINE: 'Moneyline',
  FUTURES:   'Futures',
};

export const LEG_RESULT = {
  PENDING: 'PENDING',
  WIN:     'WIN',
  LOSS:    'LOSS',
  PUSH:    'PUSH',
};

// ── Odds math helpers ────────────────────────────────────────────────────────

/** Convert American odds to decimal odds */
export function americanToDecimal(odds) {
  if (odds >= 100) return (odds / 100) + 1;
  if (odds <= -100) return (100 / Math.abs(odds)) + 1;
  return 2; // even
}

/** Convert American odds to implied probability */
export function impliedProbability(odds) {
  if (odds >= 100) return 100 / (odds + 100);
  if (odds <= -100) return Math.abs(odds) / (Math.abs(odds) + 100);
  return 0.5;
}

/**
 * Remove bookmaker overround (vig) by normalising raw implied
 * probabilities across all outcomes in a market.
 *
 * Example — standard -110 / -110 line:
 *   devig(0.5238, 0.5238) → [0.5, 0.5]
 *
 * @param  {...number} rawProbs  Raw implied probabilities (0–1 each)
 * @returns {number[]}           Fair probabilities that sum to 1.0
 */
export function devig(...rawProbs) {
  const total = rawProbs.reduce((s, p) => s + p, 0);
  if (total <= 0) return rawProbs.map(() => 0);
  return rawProbs.map(p => p / total);
}

/**
 * Expected value per unit staked for a single bet.
 * Requires a fair (devigified) probability — do NOT pass raw implied.
 * EV > 0 means positive expected value.
 *
 * @param {number} pFair  Fair win probability (0–1)
 * @param {number} odds   American odds integer
 * @returns {number}      EV per unit wagered (0.05 = +$0.05 per $1)
 */
export function calcEV(pFair, odds) {
  const decimal = americanToDecimal(odds);
  return pFair * (decimal - 1) - (1 - pFair);
}

/** Calculate potential payout (including stake return) */
export function calcPayout(stake, americanOdds) {
  return stake * americanToDecimal(americanOdds);
}

/** Calculate profit only (payout - stake) */
export function calcProfit(stake, americanOdds) {
  return calcPayout(stake, americanOdds) - stake;
}

/**
 * Compute combined American odds from an array of legs.
 * PUSH legs are excluded (they reduce the parlay by one leg).
 */
export function computeParlayOdds(legs) {
  const active = legs.filter(l => l.result !== LEG_RESULT.PUSH);
  if (active.length === 0) return 100; // all pushed → even money
  const decimal = active.reduce((prod, l) => prod * americanToDecimal(Number(l.odds)), 1);
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

/** Derive parlay status from its current legs — call after any leg update */
function deriveParlayStatus(legs) {
  if (legs.some(l => l.result === LEG_RESULT.LOSS)) return PARLAY_STATUS.LOST;
  const nonPush = legs.filter(l => l.result !== LEG_RESULT.PUSH);
  if (nonPush.length === 0) return PARLAY_STATUS.PUSHED;
  if (nonPush.every(l => l.result === LEG_RESULT.WIN)) return PARLAY_STATUS.WON;
  return PARLAY_STATUS.LIVE;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

function loadData() {
  return loadFromStorage(getStorageKey(), { positions: [], parlays: [] });
}

function saveData(data) {
  saveToStorage(getStorageKey(), data);
}

/** List all positions */
export function getPositions() {
  return loadData().positions || [];
}

/** List all open parlays */
export function getParlays() {
  return loadData().parlays || [];
}

/** Add a new futures position */
export function addPosition(pos) {
  const data = loadData();
  const newPos = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    type: pos.type,
    team: pos.team,
    team2: pos.team2 || null,
    selection: pos.selection,         // "Yes", "Over", "Under", team name
    line: pos.line ?? null,           // 10.5 for wins O/U
    odds: Number(pos.odds),           // American: +1400, -110
    impliedProb: impliedProbability(Number(pos.odds)),
    stake: Number(pos.stake),
    potentialPayout: calcPayout(Number(pos.stake), Number(pos.odds)),
    book: pos.book || '',
    status: POSITION_STATUS.OPEN,
    hedges: [],
    notes: pos.notes || '',
  };
  data.positions = [...(data.positions || []), newPos];
  saveData(data);
  return newPos;
}

/** Update a position by id */
export function updatePosition(id, updates) {
  const data = loadData();
  data.positions = (data.positions || []).map(p => {
    if (String(p.id) !== String(id)) return p;
    const updated = { ...p, ...updates };
    // Recalc derived fields if odds or stake changed
    if (updates.odds !== undefined || updates.stake !== undefined) {
      const odds = Number(updates.odds ?? p.odds);
      const stake = Number(updates.stake ?? p.stake);
      updated.odds = odds;
      updated.stake = stake;
      updated.impliedProb = impliedProbability(odds);
      updated.potentialPayout = calcPayout(stake, odds);
    }
    return updated;
  });
  saveData(data);
}

/** Delete a position by id */
export function deletePosition(id) {
  const data = loadData();
  data.positions = (data.positions || []).filter(p => String(p.id) !== String(id));
  saveData(data);
}

/** Add a hedge bet to a position */
export function addHedge(positionId, hedge) {
  const data = loadData();
  data.positions = (data.positions || []).map(p => {
    if (String(p.id) !== String(positionId)) return p;
    const newHedge = {
      id: String(Date.now()),
      parentPositionId: positionId,
      createdAt: new Date().toISOString(),
      team: hedge.team,
      odds: Number(hedge.odds),
      stake: Number(hedge.stake),
      potentialPayout: calcPayout(Number(hedge.stake), Number(hedge.odds)),
      book: hedge.book || '',
      trigger: hedge.trigger || '',
      status: hedge.status || 'PLANNED',
    };
    return { ...p, hedges: [...(p.hedges || []), newHedge] };
  });
  saveData(data);
}

// ── Open Parlays ─────────────────────────────────────────────────────────────

/** Add an open parlay with per-leg type, description, linked position/bet */
export function addParlay(parlay) {
  const data = loadData();
  const legs = (parlay.legs || []).map((leg, i) => ({
    id: String(Date.now() + i),
    type: leg.type || PARLAY_LEG_TYPES.SPREAD,
    description: leg.description || '',
    team: leg.team || '',
    odds: Number(leg.odds || 0),
    result: leg.result || LEG_RESULT.PENDING,
    linkedPositionId: leg.linkedPositionId || null,
    linkedBetId: leg.linkedBetId || null,
  }));
  const totalOdds = legs.length > 0 ? computeParlayOdds(legs) : 0;
  const stake = Number(parlay.stake || 0);
  const newParlay = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    name: parlay.name || '',
    legs,
    totalOdds,
    stake,
    potentialPayout: stake > 0 && totalOdds !== 0 ? calcPayout(stake, totalOdds) : Number(parlay.potentialPayout || 0),
    book: parlay.book || '',
    status: PARLAY_STATUS.LIVE,
    notes: parlay.notes || '',
    runningOdds: null, // set dynamically as legs win
  };
  data.parlays = [...(data.parlays || []), newParlay];
  saveData(data);
  return newParlay;
}

/** Update top-level parlay fields (status, notes, name…) */
export function updateParlay(id, updates) {
  const data = loadData();
  data.parlays = (data.parlays || []).map(p =>
    String(p.id) !== String(id) ? p : { ...p, ...updates }
  );
  saveData(data);
}

/**
 * Update a single leg by legId and auto-advance the parlay's status.
 * Also recomputes runningOdds = product of WON legs (for hedge calc display).
 */
export function updateParlayLeg(parlayId, legId, updates) {
  const data = loadData();
  data.parlays = (data.parlays || []).map(p => {
    if (String(p.id) !== String(parlayId)) return p;
    const legs = p.legs.map(l =>
      String(l.id) === String(legId) ? { ...l, ...updates } : l
    );
    const newStatus = deriveParlayStatus(legs);
    // Running odds = product of WON legs only (what you've banked so far)
    const wonLegs = legs.filter(l => l.result === LEG_RESULT.WIN);
    const runningOdds = wonLegs.length > 0 ? computeParlayOdds(wonLegs) : null;
    return { ...p, legs, status: newStatus, runningOdds };
  });
  saveData(data);
}

/** Add a new leg to an existing parlay */
export function addParlayLeg(parlayId, leg) {
  const data = loadData();
  data.parlays = (data.parlays || []).map(p => {
    if (String(p.id) !== String(parlayId)) return p;
    const newLeg = {
      id: String(Date.now()),
      type: leg.type || PARLAY_LEG_TYPES.SPREAD,
      description: leg.description || '',
      team: leg.team || '',
      odds: Number(leg.odds || 0),
      result: LEG_RESULT.PENDING,
      linkedPositionId: leg.linkedPositionId || null,
      linkedBetId: leg.linkedBetId || null,
    };
    const legs = [...p.legs, newLeg];
    const totalOdds = computeParlayOdds(legs);
    return { ...p, legs, totalOdds, potentialPayout: calcPayout(p.stake, totalOdds) };
  });
  saveData(data);
}

/** Delete a parlay */
export function deleteParlay(id) {
  const data = loadData();
  data.parlays = (data.parlays || []).filter(p => String(p.id) !== String(id));
  saveData(data);
}

// ── Portfolio analytics ──────────────────────────────────────────────────────

/** Compute summary metrics for the entire portfolio */
export function getPortfolioSummary() {
  const positions = getPositions();
  const parlays = getParlays();

  const open = positions.filter(p => p.status === POSITION_STATUS.OPEN);
  const settled = positions.filter(p => p.status === POSITION_STATUS.WON || p.status === POSITION_STATUS.LOST);

  const totalInvested   = open.reduce((s, p) => s + p.stake, 0);
  const maxPayout       = open.reduce((s, p) => s + p.potentialPayout, 0);
  const hedgeStakes     = open.reduce((s, p) => s + (p.hedges || []).reduce((h, hb) => h + hb.stake, 0), 0);

  // settled P&L
  const settledProfit = settled.reduce((s, p) => {
    if (p.status === POSITION_STATUS.WON) return s + (p.potentialPayout - p.stake);
    if (p.status === POSITION_STATUS.LOST) return s - p.stake;
    return s;
  }, 0);

  // Count by type
  const byType = {};
  for (const t of Object.values(FUTURES_TYPES)) {
    byType[t] = open.filter(p => p.type === t).length;
  }

  // Count by status
  const byStatus = {};
  for (const s of Object.values(POSITION_STATUS)) {
    byStatus[s] = positions.filter(p => p.status === s).length;
  }

  // Open parlays summary
  const liveParlays = parlays.filter(p => p.status === 'LIVE');
  const parlayExposure = liveParlays.reduce((s, p) => s + p.stake, 0);
  const parlayMaxPayout = liveParlays.reduce((s, p) => s + p.potentialPayout, 0);

  return {
    totalPositions: positions.length,
    openPositions: open.length,
    totalInvested,
    hedgeStakes,
    totalExposure: totalInvested + hedgeStakes,
    maxPayout,
    settledProfit,
    byType,
    byStatus,
    liveParlays: liveParlays.length,
    parlayExposure,
    parlayMaxPayout,
  };
}

/** Group open positions by team for exposure view */
export function getExposureByTeam() {
  const positions = getPositions().filter(p => p.status === POSITION_STATUS.OPEN);
  const map = new Map();
  for (const p of positions) {
    const key = p.team;
    if (!map.has(key)) map.set(key, { team: key, positions: [], totalStake: 0, totalPayout: 0 });
    const entry = map.get(key);
    entry.positions.push(p);
    entry.totalStake += p.stake;
    entry.totalPayout += p.potentialPayout;
  }
  return Array.from(map.values()).sort((a, b) => b.totalPayout - a.totalPayout);
}
