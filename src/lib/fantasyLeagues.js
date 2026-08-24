// src/lib/fantasyLeagues.js
// ═══════════════════════════════════════════════════════════════════════════════
// Centralized Multi-League Management System
// 
// Official League Managers (12 Teams):
// 1. Fat Lazy Americans (User Team)
// 2. Berserker
// 3. Billy Goat Tavern
// 4. Dumpster Fire
// 5. I LIKE BIG TDS
// 6. Kona’s Kickers
// 7. MombaMentality
// 8. No Talent Ass Clowns
// 9. Oroszlanok
// 10. Postino's Banditos
// 11. Rafi Bomb Returns!
// 12. Wailin Raylans
// ═══════════════════════════════════════════════════════════════════════════════

import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage.js';

export const OFFICIAL_LEAGUE_MANAGERS = [
  "Fat Lazy Americans",
  "Berserker",
  "Billy Goat Tavern",
  "Dumpster Fire",
  "I LIKE BIG TDS",
  "Kona’s Kickers",
  "MombaMentality",
  "No Talent Ass Clowns",
  "Oroszlanok",
  "Postino's Banditos",
  "Rafi Bomb Returns!",
  "Wailin Raylans"
];

export const FANTASY_LEAGUES = [
  {
    id: 'the_league',
    name: 'The League',
    tagline: 'Primary 12-Team Keeper Dynasty Matrix',
    isKeeperLeague: true,
    maxKeepers: 2,
    leagueSize: 12,
    masterJsonUrl: '/league_keeper_master_2026.json',
    icon: '🏆',
    description: '12 Teams, 2 Keepers, -2 Draft Round Cost, Round 10 FA, Week 11 Deadline',
    themeColor: 'cyan',
  },
  {
    id: 'honey_badgers',
    name: 'Honey Badgers',
    tagline: 'High-Stakes Rivalry League',
    isKeeperLeague: true,
    maxKeepers: 2,
    leagueSize: 12,
    masterJsonUrl: null,
    icon: '🦡',
    description: '12 Teams, 2 Keepers Max, Custom Roster Ingestion',
    themeColor: 'amber',
  },
  {
    id: 'rose_bowl',
    name: 'Rose Bowl',
    tagline: 'Redraft / Non-Keeper Season-Long League',
    isKeeperLeague: false,
    maxKeepers: 0,
    leagueSize: 12,
    masterJsonUrl: null,
    icon: '🌹',
    description: 'Redraft League — Zero Keepers, Pure ADP & Weekly Lineup Optimization',
    themeColor: 'rose',
  },
  {
    id: 'rfi_invitational',
    name: 'RFI Invitational',
    tagline: 'Single Keeper Invitational League',
    isKeeperLeague: true,
    maxKeepers: 1,
    leagueSize: 12,
    masterJsonUrl: null,
    icon: '🎖️',
    description: '12 Teams, 1 Keeper Max Limit',
    themeColor: 'purple',
  },
];

const ACTIVE_LEAGUE_KEY = 'nfl_active_fantasy_league_v1';

export function getActiveLeagueId() {
  return loadFromStorage(ACTIVE_LEAGUE_KEY, 'the_league');
}

export function setActiveLeagueId(leagueId) {
  saveToStorage(ACTIVE_LEAGUE_KEY, leagueId);
}

export function getLeagueProfile(leagueId) {
  return FANTASY_LEAGUES.find(l => l.id === leagueId) || FANTASY_LEAGUES[0];
}

export function getLeagueRoster(leagueId) {
  const allRosters = loadFromStorage(PR_STORAGE_KEYS.FANTASY_ROSTER.key, {});
  if (Array.isArray(allRosters)) {
    return leagueId === 'the_league' ? allRosters : [];
  }
  return allRosters[leagueId] || [];
}

export function saveLeagueRoster(leagueId, rosterItems) {
  const raw = loadFromStorage(PR_STORAGE_KEYS.FANTASY_ROSTER.key, {});
  const allRosters = Array.isArray(raw) ? { the_league: raw } : (raw || {});
  allRosters[leagueId] = rosterItems;
  saveToStorage(PR_STORAGE_KEYS.FANTASY_ROSTER.key, allRosters);
}
