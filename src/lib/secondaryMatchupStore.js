// src/lib/secondaryMatchupStore.js
// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY MATCHUP VULNERABILITY STORE
// Matches 32-team coverage schemes, secondary DB absences, and receiver boosts.
// ═══════════════════════════════════════════════════════════════════════════════

import latestSecondaryReport from '../../data/secondary-matchups/latest.json';

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

export function getAllSecondaryMatchups() {
  if (latestSecondaryReport && Array.isArray(latestSecondaryReport.matchups)) {
    return latestSecondaryReport.matchups;
  }
  return [];
}

/**
 * Find secondary matchup vulnerability for a game.
 * Returns { visOffVsHomeDef, homeOffVsVisDef, maxTier, maxSeverity }
 */
export function getSecondaryMatchupsForGame(visitorAbbr, homeAbbr) {
  const vis = normalizeCode(visitorAbbr);
  const home = normalizeCode(homeAbbr);
  const all = getAllSecondaryMatchups();

  const visOffVsHomeDef = all.find(m => normalizeCode(m.offense_team) === vis && normalizeCode(m.defense_team) === home);
  const homeOffVsVisDef = all.find(m => normalizeCode(m.offense_team) === home && normalizeCode(m.defense_team) === vis);

  const visTier = visOffVsHomeDef?.vulnerability_tier || 'low';
  const homeTier = homeOffVsVisDef?.vulnerability_tier || 'low';

  const tierRank = { high: 4, medium: 3, watch: 2, low: 1 };
  const maxTier = (tierRank[visTier] || 1) >= (tierRank[homeTier] || 1) ? visTier : homeTier;

  return {
    visOffVsHomeDef,
    homeOffVsVisDef,
    maxTier,
    maxSeverity: Math.max(visOffVsHomeDef?.severity_score || 0, homeOffVsVisDef?.severity_score || 0),
    hasAbsences: (visOffVsHomeDef?.secondary_absences?.length || 0) > 0 || (homeOffVsVisDef?.secondary_absences?.length || 0) > 0,
  };
}
