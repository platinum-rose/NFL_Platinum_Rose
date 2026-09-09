import { NFL_TEAMS, normalizeTeam } from './teams.js';

export function canonicalExactMatchup(value) {
  const parts = String(value || '').split(/\s+vs\.?\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;

  const teams = parts.map((part) => {
    const nick = normalizeTeam(part);
    if (!nick) return null;
    return { nick, fullName: NFL_TEAMS[nick]?.fullName || part };
  });
  if (teams.some((team) => !team) || teams[0].nick === teams[1].nick) return null;

  teams.sort((a, b) => a.nick.localeCompare(b.nick));
  return {
    key: teams.map((team) => team.nick.toLowerCase()).join('|'),
    label: teams.map((team) => team.fullName).join(' vs '),
    teams: teams.map((team) => team.nick),
    queryLabels: [
      `${teams[0].fullName} vs ${teams[1].fullName}`,
      `${teams[1].fullName} vs ${teams[0].fullName}`,
    ],
  };
}

export function isTeamEligibleForFuturesMarket(teamValue, marketType) {
  const nick = normalizeTeam(teamValue);
  if (!nick) return true;
  const market = String(marketType || '').toLowerCase();
  const team = NFL_TEAMS[nick];
  if (market.startsWith('division_')) {
    const expected = `division_${String(team?.division || '').toLowerCase().replace(/\s+/g, '_')}`;
    return market === expected;
  }
  if (market === 'conference_afc' || market === 'conference_nfc') {
    return market === `conference_${String(team?.conference || '').toLowerCase()}`;
  }
  return true;
}

export function canonicalFuturesMarketIdentity(row) {
  if (String(row?.market_type || '').toLowerCase() !== 'superbowl_matchup') return null;
  return canonicalExactMatchup(row.team || row.selection);
}
