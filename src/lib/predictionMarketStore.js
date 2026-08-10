// src/lib/predictionMarketStore.js
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET DATA STORE & RECONCILIATION HELPER
// Loads latest Kalshi / Polymarket aggregated contracts and matches them by team/game.
// ═══════════════════════════════════════════════════════════════════════════════

import sampleContracts from '../../data/prediction-markets/sample-nfl-contracts.json';
import latestSnapshot from '../../data/prediction-markets/latest.json';
import { calculateNetOdds } from './predictionMarkets.js';

// Alias map to handle team code variations (e.g. KC vs KAN, SF vs SFO, GB vs GNB)
const TEAM_ALIASES = {
  KAN: 'KC', KCC: 'KC',
  SFO: 'SF',
  GNB: 'GB',
  NWE: 'NE',
  NOR: 'NO',
  TAM: 'TB',
  WAS: 'WSH', WDC: 'WSH',
  LVR: 'LV', OAK: 'LV',
  LAC: 'LAC', SD: 'LAC',
  LAR: 'LAR', STL: 'LAR',
};

function normalizeCode(code) {
  if (!code) return '';
  const upper = String(code).trim().toUpperCase();
  return TEAM_ALIASES[upper] || upper;
}

/**
 * Get all ingested contracts from latest snapshot or sample fallback.
 * @returns {Array} List of normalized prediction market contract objects
 */
export function getPredictionMarketContracts() {
  if (latestSnapshot && Array.isArray(latestSnapshot.contracts) && latestSnapshot.contracts.length > 0) {
    return latestSnapshot.contracts;
  }
  return sampleContracts.map((c) => {
    const net = calculateNetOdds({ priceCents: c.last_price || c.yes_ask || 50, exchange: c.exchange });
    return {
      ...c,
      price_cents: c.last_price || c.yes_ask || 50,
      net_american_odds: net.netAmericanOdds,
      gross_american_odds: net.grossAmericanOdds,
      decimal_odds: net.decimalOdds,
    };
  });
}

/**
 * Get prediction market contracts matching a specific team and market type.
 * @param {string} teamAbbr - Team abbreviation (e.g. 'KC', 'DET', 'SF')
 * @param {string} [marketType] - 'super_bowl', 'win_totals', 'division', 'game'
 * @returns {Array} List of matching contracts sorted by volume/liquidity
 */
export function getContractsForTeam(teamAbbr, marketType = null) {
  const targetTeam = normalizeCode(teamAbbr);
  const all = getPredictionMarketContracts();

  return all.filter((c) => {
    const title = (c.title || '').toUpperCase();
    const ticker = (c.ticker || '').toUpperCase();
    const teamMatch = c.team ? normalizeCode(c.team) === targetTeam : title.includes(targetTeam) || ticker.includes(targetTeam);

    if (!teamMatch) return false;
    if (!marketType) return true;

    if (marketType === 'super_bowl' || marketType === 'superbowl') {
      return /SUPER BOWL|SB|CHAMPION/i.test(title) || c.market_type === 'super_bowl';
    }
    if (marketType === 'win_totals' || marketType === 'wins') {
      return /WINS|OVER|UNDER/i.test(title) || c.market_type === 'win_totals';
    }
    if (marketType === 'division') {
      return /DIVISION|NFC|AFC/i.test(title) || c.market_type === 'division';
    }
    return true;
  });
}

/**
 * Find best prediction market contract for a head-to-head game matchup.
 * @param {string} visitorAbbr - Visitor team code (e.g. 'BAL')
 * @param {string} homeAbbr - Home team code (e.g. 'KC')
 * @returns {Object|null} Best prediction market contract for the matchup
 */
export function getContractForGame(visitorAbbr, homeAbbr) {
  const vis = normalizeCode(visitorAbbr);
  const home = normalizeCode(homeAbbr);
  const all = getPredictionMarketContracts();

  const gameContract = all.find((c) => {
    const text = `${c.title || ''} ${c.ticker || ''}`.toUpperCase();
    return (text.includes(vis) && text.includes(home)) || /WEEK 1|MATCHUP|VS/i.test(text);
  });

  if (gameContract) return gameContract;

  // Fallback to team contract
  const homeContracts = getContractsForTeam(home, 'game');
  return homeContracts.length > 0 ? homeContracts[0] : null;
}
