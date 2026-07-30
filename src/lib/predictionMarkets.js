// src/lib/predictionMarkets.js
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET ENGINE (Kalshi / Polymarket)
// Implied Probability, Fee-Adjusted Net American Odds, Order Book Midpoint & EV Edge
// Pure functions, zero side-effects, 100% offline compliant.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert implied probability (0 to 1) into American Betting Odds integer.
 * @param {number} p - Probability between 0.001 and 0.999
 * @returns {number} American odds (e.g. -150, +186, +100)
 */
export function probabilityToAmerican(p) {
  const prob = Math.max(0.001, Math.min(0.999, Number(p) || 0.5));
  if (Math.abs(prob - 0.5) < 0.0001) return 100;
  if (prob > 0.5) {
    const odds = Math.round((prob / (1 - prob)) * 100);
    return -odds;
  } else {
    const odds = Math.round(((1 - prob) / prob) * 100);
    return +odds;
  }
}

/**
 * Convert American Betting Odds into implied probability (0 to 1).
 * @param {number} odds - American odds integer (e.g. -110, +150)
 * @returns {number} Implied probability (0 to 1)
 */
export function americanToProbability(odds) {
  const num = Number(odds) || 100;
  if (num === 100 || num === -100) return 0.5;
  if (num < 0) {
    const abs = Math.abs(num);
    return abs / (abs + 100);
  } else {
    return 100 / (num + 100);
  }
}

/**
 * Convert American Odds to Decimal Odds.
 * @param {number} american - American odds integer
 * @returns {number} Decimal odds (e.g. 1.91, 2.50)
 */
export function americanToDecimal(american) {
  const num = Number(american) || 100;
  if (num > 0) return Number(((num + 100) / 100).toFixed(4));
  return Number(((Math.abs(num) + 100) / Math.abs(num)).toFixed(4));
}

/**
 * Kalshi contract fee model based on contract price.
 * Standard formula: fee per contract = 0.07 * P * (1 - P)
 * @param {number} priceCents - Contract price in cents (1 to 99)
 * @returns {number} Fee fraction (e.g. 0.0175 for 50c)
 */
export function calculateKalshiFee(priceCents) {
  const p = Math.max(0.01, Math.min(0.99, (Number(priceCents) || 50) / 100));
  const feeDollars = 0.07 * p * (1 - p);
  return Number(feeDollars.toFixed(4));
}

/**
 * Polymarket taker fee model (gas/bridge + taker fee allowance).
 * Default taker fee fraction ~1.5% (0.015).
 * @param {number} priceCents - Contract price in cents
 * @param {number} [customFeePct=1.5] - Fee percentage
 * @returns {number} Fee fraction
 */
export function calculatePolymarketFee(priceCents, customFeePct = 1.5) {
  return Number(((Number(customFeePct) || 1.5) / 100).toFixed(4));
}

/**
 * Calculate net fee-adjusted American odds for a prediction market contract.
 * @param {Object} params
 * @param {number} params.priceCents - Contract price in cents (1 to 99)
 * @param {string} [params.exchange='kalshi'] - 'kalshi', 'polymarket', or 'custom'
 * @param {number} [params.customFeePct] - Custom fee percentage if exchange === 'custom'
 * @param {boolean} [params.applyFee=true] - Whether to deduct fee
 * @returns {Object} { priceCents, grossProb, feeFraction, netOutlay, netProfit, grossAmericanOdds, netAmericanOdds, decimalOdds }
 */
export function calculateNetOdds({ priceCents, exchange = 'kalshi', customFeePct = 1.5, applyFee = true }) {
  const cents = Math.max(1, Math.min(99, Number(priceCents) || 50));
  const p = cents / 100;
  let fee = 0;

  if (applyFee) {
    if (exchange === 'kalshi') {
      fee = calculateKalshiFee(cents);
    } else if (exchange === 'polymarket') {
      fee = calculatePolymarketFee(cents, customFeePct);
    } else {
      fee = Number(((Number(customFeePct) || 0) / 100).toFixed(4));
    }
  }

  const netOutlay = p + fee;
  const netProfit = Math.max(0.0001, 1.0 - netOutlay);
  const grossAmericanOdds = probabilityToAmerican(p);

  // Net effective probability based on total cost to return $1.00
  const netProb = Math.min(0.999, Math.max(0.001, netOutlay));
  const netAmericanOdds = probabilityToAmerican(netProb);
  const decimalOdds = Number((1.0 / netProb).toFixed(4));

  return {
    priceCents: cents,
    grossProb: Number(p.toFixed(4)),
    feeFraction: Number(fee.toFixed(4)),
    netOutlay: Number(netOutlay.toFixed(4)),
    netProfit: Number(netProfit.toFixed(4)),
    grossAmericanOdds,
    netAmericanOdds,
    decimalOdds,
  };
}

/**
 * Order book bid/ask evaluator for prediction market Yes/No contracts.
 * @param {Object} params
 * @param {number} params.yesBid - Highest bid for YES in cents (e.g. 58)
 * @param {number} params.yesAsk - Lowest ask for YES in cents (e.g. 60)
 * @param {string} [params.exchange='kalshi'] - 'kalshi' or 'polymarket'
 * @returns {Object} Detailed order book breakdown for YES, NO, and Midpoint
 */
export function evaluateOrderBook({ yesBid, yesAsk, exchange = 'kalshi', customFeePct = 1.5 }) {
  const bid = Math.max(1, Math.min(99, Number(yesBid) || 50));
  const ask = Math.max(bid, Math.min(99, Number(yesAsk) || bid + 2));
  const midCents = (bid + ask) / 2;
  const midProb = midCents / 100;
  const spreadCents = ask - bid;

  const buyYes = calculateNetOdds({ priceCents: ask, exchange, customFeePct });
  const noAsk = 100 - bid;
  const buyNo = calculateNetOdds({ priceCents: noAsk, exchange, customFeePct });
  const fairMidAmerican = probabilityToAmerican(midProb);

  return {
    yesBid: bid,
    yesAsk: ask,
    noBid: 100 - ask,
    noAsk: noAsk,
    spreadCents,
    midpointCents: Number(midCents.toFixed(1)),
    midpointProb: Number(midProb.toFixed(4)),
    fairMidAmericanOdds: fairMidAmerican,
    buyYes,
    buyNo,
  };
}

/**
 * Compare prediction market odds vs traditional sportsbook odds for price shopping.
 * @param {number} pmAmericanOdds - Fee-adjusted net American odds from prediction market (e.g. +186)
 * @param {number} sportsbookAmericanOdds - Traditional sportsbook American odds (e.g. +160 or -110)
 * @returns {Object} { pmOdds, bookOdds, pmDecimal, bookDecimal, decimalDelta, americanDelta, betterMarket, valueEdgePct }
 */
export function compareMarketOdds(pmAmericanOdds, sportsbookAmericanOdds) {
  const pmOdds = Number(pmAmericanOdds) || 100;
  const bookOdds = Number(sportsbookAmericanOdds) || 100;

  const pmDecimal = americanToDecimal(pmOdds);
  const bookDecimal = americanToDecimal(bookOdds);

  const decimalDelta = Number((pmDecimal - bookDecimal).toFixed(4));
  const americanDelta = pmOdds - bookOdds;

  let betterMarket = 'equal';
  if (decimalDelta > 0.001) betterMarket = 'prediction_market';
  else if (decimalDelta < -0.001) betterMarket = 'sportsbook';

  const valueEdgePct = bookDecimal > 0 ? Number(((decimalDelta / bookDecimal) * 100).toFixed(2)) : 0;

  return {
    pmOdds,
    bookOdds,
    pmDecimal,
    bookDecimal,
    decimalDelta,
    americanDelta,
    betterMarket,
    valueEdgePct,
    isSignificantEdge: valueEdgePct >= 3.0, // 3%+ EV edge flag
  };
}
