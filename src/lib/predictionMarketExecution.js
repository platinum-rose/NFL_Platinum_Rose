// src/lib/predictionMarketExecution.js
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION-MARKET EXECUTION-ELIGIBILITY CHECK (prediction_market_execution_v1)
//
// 2026-09-26 (Andy, option (a)): Kalshi is placeable, but ONLY through this
// check -- never by folding it into SPORTSBOOK_VENUES. This is the
// "bid/ask/fillable-size/fee/settlement equivalence check against the matching
// sportsbook market" that src/lib/executionVenues.js's PREDICTION_MARKET_VENUES
// comment has required since 2026-08-13 and that was never built.
//
// A Kalshi contract is execution_eligible only when ALL of these hold:
//   1. venue is a placeable prediction-market venue (Kalshi only for now;
//      Polymarket stays context-only),
//   2. its series is on the settlement-equivalence allowlist below and maps
//      to exactly one dossier sportsbook market/team (and, for win totals,
//      the exact sportsbook line),
//   3. a live YES ask exists (priced at the ASK -- what you can actually buy
//      at -- never the last trade, which can sit above or below the book),
//   4. the order book is sane: bid >= 1c (two-sided), spread <= maxSpreadCents, and
//      24h volume >= minVolume24h,
//   5. the snapshot is fresh (<= maxQuoteAgeHours old),
//   6. the sportsbook quote it is compared against was observed within
//      maxQuoteGapHours of the Kalshi snapshot (a stale book price makes any
//      live Kalshi ask look like an edge -- caught on the first real run
//      against a 2-week-old dossier: 49 fake "eligible" rows at +100-290%),
//   7. the all-in cost (ask + Kalshi taker fee, rounded up to the cent on the
//      whole order at the reference stake) beats the best placeable
//      sportsbook price for the SAME selection, by no more than
//      maxPlausibleAdvantagePct (a bigger gap almost always means a market
//      mismatch or stale data, not free money -- stop and verify).
// Anything else is a named reason in `reasons` and execution_eligible=false.
// Fillable size is not in the local snapshot (Kalshi's /markets list has no
// ask depth), so it is a caveat + needs_live_check, not a silent pass.
//
// Pure functions, no I/O.
// ═══════════════════════════════════════════════════════════════════════════════

import { normalizeTeam } from './teams.js';

export const PREDICTION_MARKET_EXECUTION_SCHEMA = 'prediction_market_execution_v1';

// Only these venues can ever be execution-eligible through this check.
export const PLACEABLE_PREDICTION_MARKET_KEYS = Object.freeze(new Set(['kalshi']));

export const DEFAULT_EXECUTION_THRESHOLDS = Object.freeze({
  maxSpreadCents: 5,
  minVolume24h: 25,
  maxQuoteAgeHours: 36,
  maxQuoteGapHours: 36,
  maxPlausibleAdvantagePct: 60,
  referenceStakeDollars: 10,
  kalshiTakerFeeRate: 0.07,
});

const DIVISION_SERIES = {
  KXNFLAFCEAST: 'division_afc_east', KXNFLAFCNORTH: 'division_afc_north',
  KXNFLAFCSOUTH: 'division_afc_south', KXNFLAFCWEST: 'division_afc_west',
  KXNFLNFCEAST: 'division_nfc_east', KXNFLNFCNORTH: 'division_nfc_north',
  KXNFLNFCSOUTH: 'division_nfc_south', KXNFLNFCWEST: 'division_nfc_west',
};

// Settlement-equivalence allowlist: Kalshi series whose YES side settles the
// same way as a sportsbook market the dossier already prices. Anything not
// listed here (KXNFLWINS-ANY, KXNFLDIVISIONWINS, KXNFL1SEED, props, awards...)
// is never execution-eligible. `caveat` is surfaced on every row from that
// series; `needs_human_review` forces a review flag even when eligible.
export const SETTLEMENT_EQUIVALENT_SERIES = Object.freeze({
  KXSB: { market: () => 'superbowl', caveat: null, needs_human_review: false },
  KXNFLPLAYOFF: { market: () => 'playoffs', caveat: null, needs_human_review: false },
  KXNFLAFCCHAMP: { market: () => 'conference_afc', caveat: null, needs_human_review: false },
  KXNFLNFCCHAMP: { market: () => 'conference_nfc', caveat: null, needs_human_review: false },
  ...Object.fromEntries(Object.entries(DIVISION_SERIES).map(([series, market]) => [
    series, { market: () => market, caveat: null, needs_human_review: false },
  ])),
  KXNFLWINS: {
    market: () => 'wins',
    // Sportsbook win totals commonly void if the team doesn't play all 17
    // games; Kalshi "at least N games" resolves regardless. Near-equivalent,
    // not identical -- always review.
    caveat: 'Kalshi "at least N wins" vs sportsbook Over N-0.5: books may void if fewer than 17 games are played; Kalshi resolves regardless.',
    needs_human_review: true,
  },
});

const finite = (v) => (v === null || v === undefined || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null));

function americanToProb(price) {
  const n = finite(price);
  if (n === null || n === 0) return null;
  return n > 0 ? 100 / (n + 100) : -n / (-n + 100);
}

function probToAmerican(p) {
  if (!(p > 0 && p < 1)) return null;
  return p >= 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
}

const round = (x, n = 4) => (x == null ? null : Number(x.toFixed(n)));

/**
 * Kalshi taker fee for an order of `contracts` at `priceCents`:
 * ceil_to_cent(rate * C * P * (1 - P)). Returns dollars.
 */
export function kalshiOrderFeeDollars(priceCents, contracts, rate = DEFAULT_EXECUTION_THRESHOLDS.kalshiTakerFeeRate) {
  const cents = finite(priceCents);
  const c = finite(contracts);
  if (cents === null || c === null || c <= 0 || cents <= 0 || cents >= 100) return null;
  const p = cents / 100;
  const raw = rate * c * p * (1 - p);
  // epsilon guards float noise like 0.4600000001 -> 0.47
  return Math.ceil(raw * 100 - 1e-9) / 100;
}

/**
 * All-in executable price for buying YES at the ask with a reference stake.
 * Returns { contracts, fee_dollars, cost_per_contract, net_prob, net_american, net_decimal }.
 */
export function kalshiNetPriceAtAsk(askCents, stakeDollars = DEFAULT_EXECUTION_THRESHOLDS.referenceStakeDollars, rate = DEFAULT_EXECUTION_THRESHOLDS.kalshiTakerFeeRate) {
  const ask = finite(askCents);
  if (ask === null || ask <= 0 || ask >= 100) return null;
  const contracts = Math.max(1, Math.floor((stakeDollars * 100) / ask));
  const fee = kalshiOrderFeeDollars(ask, contracts, rate);
  const cost = (contracts * ask) / 100 + fee;
  const netProb = cost / contracts;
  if (!(netProb > 0 && netProb < 1)) {
    return { contracts, fee_dollars: fee, cost_per_contract: round(netProb), net_prob: round(netProb), net_american: null, net_decimal: null };
  }
  return {
    contracts,
    fee_dollars: fee,
    cost_per_contract: round(netProb),
    net_prob: round(netProb),
    net_american: probToAmerican(netProb),
    net_decimal: round(1 / netProb),
  };
}

/**
 * Resolve which dossier synthesis_input market/team/line a Kalshi contract
 * is settlement-equivalent to. Returns null when not on the allowlist or not
 * cleanly parseable.
 */
export function dossierTargetForKalshiContract(contract) {
  const series = String(contract?.series_ticker || '');
  const spec = SETTLEMENT_EQUIVALENT_SERIES[series];
  if (!spec) return null;
  const parts = String(contract?.ticker || '').split('-');
  if (series === 'KXNFLWINS') {
    // KXNFLWINS-27IND-9: <season><TEAM> packed into one segment, threshold last.
    if (parts.length !== 3) return null;
    const team = normalizeTeam(parts[1].replace(/^\d+/, ''));
    const n = finite(parts[2]);
    if (!team || n === null) return null;
    return { market: 'wins', team, side: 'over', line: n - 0.5, spec };
  }
  // <SERIES>-<season>-<TEAM>
  if (parts.length !== 3) return null;
  const team = normalizeTeam(parts[2]);
  if (!team) return null;
  return { market: spec.market(), team, side: 'yes', line: null, spec };
}

// Best placeable sportsbook price for the exact selection on a dossier row.
function sportsbookQuoteFor(row, target, placeableBooks) {
  if (!row) return null;
  if (target.market === 'wins') {
    // Only books quoting the SAME line (never compare Over 9.5 to Over 8.5).
    let best = null;
    for (const [book, q] of Object.entries(row.books || {})) {
      if (placeableBooks && !placeableBooks.has(book)) continue;
      if (finite(q?.line) !== target.line) continue;
      const price = finite(q?.over);
      const prob = americanToProb(price);
      if (prob === null) continue;
      if (!best || prob < best.prob) best = { book, price, prob, observed_at: q?.observed_at || null };
    }
    return best;
  }
  const price = finite(row.best_price);
  const prob = americanToProb(price);
  if (!row.best_book || prob === null) return null;
  return { book: row.best_book, price, prob, observed_at: row.best_observed_at || null };
}

/**
 * Evaluate one prediction-market contract against its dossier row.
 * `row` is the synthesis_input row for (target.market, target.team), or null.
 */
export function evaluatePredictionMarketExecution(contract, row, options = {}) {
  const t = { ...DEFAULT_EXECUTION_THRESHOLDS, ...(options.thresholds || {}) };
  const now = options.now ? new Date(options.now) : new Date();
  const venue = String(contract?.exchange || '').toLowerCase();
  const target = dossierTargetForKalshiContract(contract);
  const reasons = [];
  const caveats = ['fillable_size_unverified: ask depth is not in the local snapshot -- confirm size on Kalshi before entry.'];

  if (!PLACEABLE_PREDICTION_MARKET_KEYS.has(venue)) reasons.push(`venue_not_placeable:${venue || 'unknown'}`);
  if (!target) reasons.push(`series_not_settlement_equivalent:${contract?.series_ticker || 'unknown'}`);
  if (target?.spec?.caveat) caveats.push(target.spec.caveat);

  const bid = finite(contract?.yes_bid_cents);
  const ask = finite(contract?.yes_ask_cents);
  const volume = finite(contract?.volume_24h);
  const spread = bid !== null && ask !== null ? ask - bid : null;
  if (ask === null || ask <= 0 || ask >= 100) reasons.push('no_live_yes_ask');
  // A 0c bid means nobody is buying -- not a two-sided market, even when the
  // 0/1c spread passes the absolute-cents cap (caught live: KXSB-27-TB/IND).
  if (bid === null || bid <= 0) reasons.push('no_two_sided_market');
  if (spread !== null && spread < 0) reasons.push('inverted_order_book');
  if (spread !== null && spread > t.maxSpreadCents) reasons.push(`spread_too_wide:${spread}c>${t.maxSpreadCents}c`);
  if (volume === null || volume < t.minVolume24h) reasons.push(`volume_24h_too_low:${volume ?? 'missing'}<${t.minVolume24h}`);

  const updated = contract?.updated_at ? new Date(contract.updated_at) : null;
  const ageHours = updated && !Number.isNaN(updated.getTime()) ? round((now - updated) / 3_600_000, 2) : null;
  if (ageHours === null) reasons.push('quote_timestamp_missing');
  else if (ageHours > t.maxQuoteAgeHours) reasons.push(`quote_stale:${ageHours}h>${t.maxQuoteAgeHours}h`);

  const net = ask !== null && ask > 0 && ask < 100 ? kalshiNetPriceAtAsk(ask, t.referenceStakeDollars, t.kalshiTakerFeeRate) : null;
  if (ask !== null && ask > 0 && ask < 100 && net?.net_american == null) reasons.push('fee_makes_contract_unpayable');

  const sb = target ? sportsbookQuoteFor(row, target, options.placeableBooks) : null;
  if (target && !row) reasons.push(`no_dossier_row:${target.market}:${target.team}`);
  else if (target && !sb) reasons.push(target.market === 'wins' ? `no_placeable_sportsbook_quote_at_line:${target.line}` : 'no_placeable_sportsbook_quote');

  let advantagePct = null;
  if (net?.net_prob && sb?.prob) {
    // Decimal-payout improvement vs the sportsbook: >0 means Kalshi pays more.
    advantagePct = round(((1 / net.net_prob) / (1 / sb.prob) - 1) * 100, 2);
    if (!(net.net_prob < sb.prob)) reasons.push(`does_not_beat_sportsbook:${net.net_american}_vs_${sb.price}@${sb.book}`);
    else if (advantagePct > t.maxPlausibleAdvantagePct) reasons.push(`implausible_advantage_verify_match:${advantagePct}%>${t.maxPlausibleAdvantagePct}%`);
  }

  let quoteGapHours = null;
  if (sb && updated && !Number.isNaN(updated.getTime())) {
    const sbAt = sb.observed_at ? new Date(sb.observed_at) : null;
    if (!sbAt || Number.isNaN(sbAt.getTime())) reasons.push('sportsbook_quote_timestamp_missing');
    else {
      quoteGapHours = round(Math.abs(updated - sbAt) / 3_600_000, 2);
      if (quoteGapHours > t.maxQuoteGapHours) reasons.push(`quotes_not_contemporaneous:${quoteGapHours}h>${t.maxQuoteGapHours}h`);
    }
  }

  const eligible = reasons.length === 0;
  return {
    schema: PREDICTION_MARKET_EXECUTION_SCHEMA,
    venue,
    ticker: contract?.ticker || null,
    series_ticker: contract?.series_ticker || null,
    title: contract?.title || null,
    market: target?.market || null,
    team: target?.team || null,
    side: target?.side || null,
    line: target?.line ?? null,
    yes_bid_cents: bid,
    yes_ask_cents: ask,
    last_price_cents: finite(contract?.price_cents),
    spread_cents: spread,
    volume_24h: volume,
    quote_observed_at: contract?.updated_at || null,
    quote_age_hours: ageHours,
    reference_stake_dollars: t.referenceStakeDollars,
    contracts_at_reference_stake: net?.contracts ?? null,
    fee_dollars_at_reference_stake: net?.fee_dollars ?? null,
    net_prob_at_ask: net?.net_prob ?? null,
    net_american_at_ask: net?.net_american ?? null,
    sportsbook_best_book: sb?.book ?? null,
    sportsbook_best_price: sb?.price ?? null,
    sportsbook_best_prob: sb ? round(sb.prob) : null,
    sportsbook_quote_observed_at: sb?.observed_at ?? null,
    quote_gap_hours: quoteGapHours,
    payout_advantage_pct: advantagePct,
    execution_eligible: eligible,
    needs_human_review: eligible && Boolean(target?.spec?.needs_human_review),
    reasons,
    caveats,
  };
}

/**
 * Annotate dossier synthesis_input rows in place with
 * `prediction_market_execution: [...]` and return a summary for dossier meta.
 * Only rows that some allowlisted contract maps to get the field.
 */
export function annotateSynthesisInputWithPredictionMarketExecution(synthesisInput, contracts, options = {}) {
  const summary = {
    schema: PREDICTION_MARKET_EXECUTION_SCHEMA,
    evaluated_contract_count: 0,
    execution_eligible_count: 0,
    rejection_reason_counts: {},
    thresholds: { ...DEFAULT_EXECUTION_THRESHOLDS, ...(options.thresholds || {}) },
    source_generated_at: options.sourceGeneratedAt || null,
  };
  if (!synthesisInput || !Array.isArray(contracts)) return summary;
  const index = new Map();
  for (const [market, rows] of Object.entries(synthesisInput)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const team = row?.team_nick || normalizeTeam(row?.team);
      if (team) index.set(`${market}|${team}`, row);
    }
  }
  for (const contract of contracts) {
    if (!PLACEABLE_PREDICTION_MARKET_KEYS.has(String(contract?.exchange || '').toLowerCase())) continue;
    const target = dossierTargetForKalshiContract(contract);
    if (!target) continue;
    const row = index.get(`${target.market}|${target.team}`) || null;
    const result = evaluatePredictionMarketExecution(contract, row, options);
    summary.evaluated_contract_count += 1;
    if (result.execution_eligible) summary.execution_eligible_count += 1;
    for (const r of result.reasons) {
      const k = r.split(':')[0];
      summary.rejection_reason_counts[k] = (summary.rejection_reason_counts[k] || 0) + 1;
    }
    if (row) (row.prediction_market_execution ??= []).push(result);
  }
  return summary;
}

/** Eligible execution entry on a row for a given venue (+ win-total line), or null. */
export function eligiblePredictionMarketEntry(row, venue, line = null) {
  const v = String(venue || '').toLowerCase();
  const entries = Array.isArray(row?.prediction_market_execution) ? row.prediction_market_execution : [];
  return entries.find((e) => e.execution_eligible && e.venue === v && (line === null || e.line === line)) || null;
}
