// src/lib/hostCitationStore.js
// ═══════════════════════════════════════════════════════════════════════════════
// HOST CITATION STORE — Runtime accessor for expert podcast citations
// Loads pre-built citation index from data/generated/host-citations-latest.json
// ═══════════════════════════════════════════════════════════════════════════════

import citationData from '../../data/generated/host-citations-latest.json';
import { NFL_TEAMS } from './teams.js';

// Build team full-name → abbreviation lookup
const FULL_NAME_TO_ABBR = Object.fromEntries(
  Object.values(NFL_TEAMS).map(t => [t.fullName, t.abbreviation])
);

const allCitations = citationData?.citations || [];

/**
 * Get all citations for a team (by full name or abbreviation), newest-first.
 * @param {string} teamIdentifier - e.g. 'Buffalo Bills' or 'BUF'
 * @returns {Array} Citation objects sorted by pubDate descending
 */
export function getCitationsForTeam(teamIdentifier) {
  const abbr = FULL_NAME_TO_ABBR[teamIdentifier] || teamIdentifier;
  return allCitations.filter(c => c.team === abbr);
}

/**
 * Get citations for a specific team + market slot.
 * @param {string} teamIdentifier - e.g. 'Buffalo Bills' or 'BUF'
 * @param {string} marketSlot - 'superbowl', 'conference', 'division', 'wins', 'playoffs', 'general'
 * @returns {Array} Filtered citations
 */
export function getCitationsForTeamMarket(teamIdentifier, marketSlot) {
  const abbr = FULL_NAME_TO_ABBR[teamIdentifier] || teamIdentifier;
  return allCitations.filter(c => c.team === abbr && c.market === marketSlot);
}

/**
 * Get a sentiment summary for a team: bullish and bearish citations grouped.
 * @param {string} teamIdentifier
 * @returns {{ bullish: Array, bearish: Array, total: number }}
 */
export function getHostSentimentSummary(teamIdentifier) {
  const citations = getCitationsForTeam(teamIdentifier);
  return {
    bullish: citations.filter(c => c.sentiment === 'bullish'),
    bearish: citations.filter(c => c.sentiment === 'bearish'),
    total: citations.length,
  };
}

/**
 * Get unique hosts who have cited a team, with their latest sentiment.
 * Returns one entry per host (most recent take wins).
 * @param {string} teamIdentifier
 * @returns {Array<{ host, show, sentiment, quote, pubDate, episodeSlug }>}
 */
export function getUniqueHostTakes(teamIdentifier) {
  const citations = getCitationsForTeam(teamIdentifier);
  const hostMap = new Map();
  // Citations already sorted newest-first from the build script
  for (const c of citations) {
    if (!hostMap.has(c.host)) {
      hostMap.set(c.host, {
        host: c.host,
        show: c.show,
        sentiment: c.sentiment,
        quote: c.quote,
        pubDate: c.pubDate,
        episodeSlug: c.episodeSlug,
        episodeTitle: c.episodeTitle,
      });
    }
  }
  return [...hostMap.values()];
}

/**
 * Get market-level consensus for a team across a specific market slot.
 * @param {string} teamIdentifier
 * @param {string} marketSlot
 * @returns {{ bullishCount: number, bearishCount: number, bullishHosts: string[], bearishHosts: string[] }}
 */
export function getMarketConsensus(teamIdentifier, marketSlot) {
  const citations = getCitationsForTeamMarket(teamIdentifier, marketSlot);
  const bullishHosts = [...new Set(citations.filter(c => c.sentiment === 'bullish').map(c => c.host))];
  const bearishHosts = [...new Set(citations.filter(c => c.sentiment === 'bearish').map(c => c.host))];
  return {
    bullishCount: bullishHosts.length,
    bearishCount: bearishHosts.length,
    bullishHosts,
    bearishHosts,
  };
}

/**
 * Get the full citation index.
 * @returns {Array}
 */
export function getAllCitations() {
  return allCitations;
}

/**
 * Get meta information about the citation index.
 * @returns {object}
 */
export function getCitationMeta() {
  return citationData?.meta || {};
}
