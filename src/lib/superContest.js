// src/lib/superContest.js
// ???????????????????????????????????????????????????????????????????????????????
// SuperContest domain utilities: metadata lookup, stability calculation,
// slate filtering, and watchlist persistence helpers.
// ???????????????????????????????????????????????????????????????????????????????

import publishedWeek1Data from '../../data/supercontest/week-01-lines.json';
import publishedWeek2Data from '../../data/supercontest/week-02-lines.json';
import liveMarketComparison from '../../data/supercontest/live-market-comparison.json';
import { PR_STORAGE_KEYS } from './storage.js';

export const WATCHLIST_STORAGE_KEY = PR_STORAGE_KEYS.SUPERCONTEST_WATCHLIST?.key || 'nfl_supercontest_watchlist_v1';
export const SUNDAY_TRACKER_SC_KEY_PREFIX = 'sunday_supercontest_picks_week_';

/** Wednesday-published contest lines by week. Add each new week's week-NN-lines.json here. */
const PUBLISHED_LINES_BY_WEEK = { 1: publishedWeek1Data, 2: publishedWeek2Data };
export const SC_WEEKS = Object.keys(PUBLISHED_LINES_BY_WEEK).map(Number).sort((a, b) => a - b);
export const SC_LATEST_WEEK = SC_WEEKS[SC_WEEKS.length - 1];

/** Recommended / consensus pick map for Week 1 matchups */
export const SC_WEEK1_RECOMMENDED_PICKS = {
  'CAR': 'CAR', 'CHI': 'CAR', // Panthers +3.0 (#1 Best Bet)
  'IND': 'IND', 'BAL': 'IND', // Colts +3.5 (#2 Best Bet)
  'TB': 'TB', 'CIN': 'TB',    // Buccaneers +3.5 (#3 Best Bet)
  'ARI': 'ARI', 'LAC': 'ARI', // Cardinals +9.5 (#4 Best Bet)
  'HOU': 'HOU', 'BUF': 'HOU', // Texans +1.5 (#5 Best Bet)
  'PHI': 'PHI', 'WAS': 'PHI', // Eagles -4.5 (#6 Alternate)
  'MIA': 'MIA', 'LV': 'MIA',  // Dolphins +3.5 (#7 Alternate)
  'SF': 'SF', 'LAR': 'SF',    // 49ers +3.5 (#8 Alternate)
  'KC': 'KC', 'DEN': 'KC',    // Chiefs -2.5 (#9 Alternate)
  'DAL': 'DAL', 'NYG': 'DAL', // Cowboys -3.0 (#10 Alternate)
  'PIT': 'PIT', 'ATL': 'PIT', // Steelers -3.5 (moved to -6.0)
  'MIN': 'MIN', 'NYJ': 'MIN',
  'TEN': 'TEN', 'JAX': 'TEN',
  'GB': 'GB', 'DET': 'GB',
  'NO': 'NO', 'CLE': 'NO',
  'SEA': 'SEA', 'NE': 'SEA'
};

/** Week 2 card (2026-09-19 night, BKR lines, Burrow cleared) -- see docs/cards/2026-W02-sun-mon-card-draft.md */
export const SC_WEEK2_RECOMMENDED_PICKS = {
  'MIN': 'MIN', 'CHI': 'MIN', // Vikings +5.5 (#1)
  'DEN': 'DEN', 'JAX': 'DEN', // Broncos -2.5 (#2, BKR -3)
  'NYJ': 'NYJ', 'GB': 'NYJ',  // Jets +3.5 (#3, BKR +3)
  'MIA': 'MIA', 'SF': 'MIA',  // Dolphins +13.5 (#4)
  'WAS': 'WAS', 'DAL': 'WAS', // Commanders +4.5 (#5)
  'LAR': 'LAR', 'NYG': 'LAR', // Rams -7 (#6 alternate; market now -6.5)
  'PIT': 'PIT', 'NE': 'PIT',  // Steelers +5.5 (#7 alternate)
  'HOU': 'HOU', 'CIN': 'HOU', // Texans -2.5 (#8 alternate; Burrow cleared)
  'TB': 'TB', 'CLE': 'TB',    // Buccaneers -8.5 (#9 alternate)
  'BAL': 'BAL', 'NO': 'BAL',  // Ravens -8.5 (#10 alternate)
  'PHI': 'PHI', 'TEN': 'PHI', // lean only
  'CAR': 'CAR', 'ATL': 'CAR', // lean only
  'LAC': 'LAC', 'LV': 'LAC',  // lean only
  'ARI': 'ARI', 'SEA': 'ARI', // lean only (contest +3.5 worse than market)
  'IND': 'IND', 'KC': 'IND',  // lean only
  'BUF': 'BUF', 'DET': 'BUF'  // TNF final
};

const RECOMMENDED_PICKS_BY_WEEK = { 1: SC_WEEK1_RECOMMENDED_PICKS, 2: SC_WEEK2_RECOMMENDED_PICKS };

export const SUNDAY_TRACKER_LOCKED_CARD_PREFIX = 'sunday_supercontest_locked_card_week_';

/** Get the contest spread number and label for a specific team in a game */
export function getTeamContestSpread(game, teamAbbr) {
  if (!game || !teamAbbr) return { spread: 0, label: 'PK' };
  const team = String(teamAbbr).toUpperCase();
  const meta = getSuperContestMetadata(game);
  if (meta && meta.scMatch) {
    const fav = (meta.publishedFav || '').toUpperCase();
    const dog = (meta.publishedDog || '').toUpperCase();
    const spreadNum = meta.publishedSpreadNum; // e.g. -3.5
    if (team === fav && spreadNum !== null) {
      return {
        spread: spreadNum,
        label: `${team} ${spreadNum > 0 ? '+' : ''}${spreadNum}`
      };
    }
    if (team === dog && spreadNum !== null) {
      const dogSpread = -spreadNum;
      return {
        spread: dogSpread,
        label: `${team} ${dogSpread > 0 ? '+' : ''}${dogSpread}`
      };
    }
  }

  const home = (game.home || '').toUpperCase();
  const homeSpread = meta?.homeRelativeContestSpread ?? (typeof game.contestSpread === 'number' ? game.contestSpread : (typeof game.spread === 'number' ? game.spread : 0));
  if (team === home) {
    return {
      spread: homeSpread,
      label: `${team} ${homeSpread > 0 ? '+' : ''}${homeSpread}`
    };
  }
  const visSpread = -homeSpread;
  return {
    spread: visSpread,
    label: `${team} ${visSpread > 0 ? '+' : ''}${visSpread}`
  };
}

/** Get the team abbreviation to pick for SuperContest from a game */
export function getRecommendedPickTeam(game) {
  if (!game) return null;
  const home = (game.home || '').toUpperCase();
  const visitor = (game.visitor || '').toUpperCase();

  const recommended = RECOMMENDED_PICKS_BY_WEEK[Number(game.week) || 1] || {};
  if (recommended[visitor]) return recommended[visitor];
  if (recommended[home]) return recommended[home];

  const meta = getSuperContestMetadata(game);
  if (meta.publishedFav) return meta.publishedFav;
  return home || visitor;
}

/** Sync locked picks to the Live Sunday Tracker's SuperContest tab in localStorage */
export function syncPicksToSundayTracker(pickGameIds = [], weekGames = [], week = 1, lockedSides = {}) {
  const scPicks = {};
  const gameMap = new Map((weekGames || []).map(g => [g.id, g]));
  const lockedCard = [];

  pickGameIds.forEach(item => {
    if (!item) return;
    let team = null;
    let game = null;

    // item can be a direct team abbreviation or a gameId
    if (typeof item === 'string' && item.length <= 4 && !item.match(/^\d+$/)) {
      team = item.toUpperCase();
      game = (weekGames || []).find(g => (g.home || '').toUpperCase() === team || (g.visitor || '').toUpperCase() === team);
    } else {
      game = gameMap.get(item);
      if (lockedSides && lockedSides[item]) {
        team = String(lockedSides[item]).toUpperCase();
      } else {
        team = game ? getRecommendedPickTeam(game) : null;
      }
    }

    if (team) {
      scPicks[team.toUpperCase()] = true;
      if (game) {
        const meta = getSuperContestMetadata(game);
        const spreadInfo = getTeamContestSpread(game, team);
        const isHome = (game.home || '').toUpperCase() === team;
        const opponent = isHome ? (game.visitor || '').toUpperCase() : (game.home || '').toUpperCase();
        const opponentSpreadInfo = getTeamContestSpread(game, opponent);

        lockedCard.push({
          gameId: game.id,
          team,
          pickTeam: team,
          pickLabel: `${team} ${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread}`,
          spread: spreadInfo.spread,
          spreadLabel: `${team} ${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread}`,
          opponent,
          isHome,
          lockedSpread: `${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread}`,
          contestSpread: `${team} ${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread} vs ${opponent} ${opponentSpreadInfo.spread > 0 ? '+' : ''}${opponentSpreadInfo.spread}`,
          currentSpread: meta?.currentSpreadLabel || `${team} ${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread}`,
          matchup: `${game.visitor} @ ${game.home}`,
          kickoffDay: game.kickoff_day || 'Sun',
          kickoffTime: game.kickoff_time || '1:00 PM ET',
          clvText: meta?.movementSummary || 'Official Locked Pick',
          reason: `Locked SuperContest Card Pick: ${team} ${spreadInfo.spread > 0 ? '+' : ''}${spreadInfo.spread} (${isHome ? 'Home' : 'Away'} vs ${opponent}).`
        });
      }
    }
  });

  const storageKey = `${SUNDAY_TRACKER_SC_KEY_PREFIX}${week}`;
  const lockedCardKey = `${SUNDAY_TRACKER_LOCKED_CARD_PREFIX}${week}`;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify(scPicks));
      window.localStorage.setItem(lockedCardKey, JSON.stringify(lockedCard));
    }
  } catch {
    // silent catch for localStorage unavailable/quota
  }

  return { key: storageKey, lockedCardKey, picks: scPicks, count: Object.keys(scPicks).length, lockedCard };
}


/** Match game with official Wednesday SuperContest publication & live market comparison */
export function getSuperContestMetadata(game) {
  if (!game) return {};
  const home = (game.home || '').toUpperCase();
  const visitor = (game.visitor || '').toUpperCase();

  // Find in published Wednesday lines
  const published = PUBLISHED_LINES_BY_WEEK[Number(game.week) || 1] || publishedWeek1Data;
  const scMatch = (published?.games || []).find(s => {
    const fav = (s.favorite_abbr || '').toUpperCase();
    const dog = (s.underdog_abbr || '').toUpperCase();
    return (fav === home && dog === visitor) || (fav === visitor && dog === home);
  });

  // Find in live market comparison
  const mktMatch = (liveMarketComparison?.games || []).find(m => {
    const fav = (m.fav_abbr || m.favorite || '').toUpperCase();
    const dog = (m.dog_abbr || m.underdog || '').toUpperCase();
    return (fav === home && dog === visitor) || (fav === visitor && dog === home);
  });

  const publishedFav = scMatch?.favorite_abbr || null;
  const publishedDog = scMatch?.underdog_abbr || null;
  const publishedSpreadNum = scMatch?.contest_line != null ? Number(scMatch.contest_line) : null;
  
  // Home-relative published contest spread:
  // If home is favorite, home spread is negative (e.g. -3.5)
  // If visitor is favorite, home spread is positive (e.g. +3.5)
  let homeRelativeContestSpread = null;
  if (publishedSpreadNum !== null) {
    if (home === publishedFav) {
      homeRelativeContestSpread = publishedSpreadNum;
    } else if (home === publishedDog) {
      homeRelativeContestSpread = -publishedSpreadNum;
    }
  }

  // Published contest spread label: e.g. "CHI -3.0"
  const contestSpreadLabel = scMatch
    ? `${scMatch.favorite_abbr} ${scMatch.contest_line > 0 ? '+' : ''}${scMatch.contest_line}`
    : (game.contestSpread != null ? `${home} ${game.contestSpread > 0 ? '+' : ''}${game.contestSpread}` : 'N/A');

  // Opening line:
  const openingSpreadLabel = mktMatch?.opening_spread || mktMatch?.locked_contest_spread || contestSpreadLabel;

  // Current live spread:
  const currentSpreadLabel = mktMatch?.live_dk_spread 
    || (typeof game.spread === 'number' ? `${home} ${game.spread > 0 ? '+' : ''}${game.spread}` : 'N/A');

  // Total:
  const currentTotal = mktMatch?.live_dk_total || (typeof game.total === 'number' && game.total > 0 ? game.total : null);

  // Movement & steam summary:
  const movementSummary = mktMatch?.clv_summary || 'Exact match (0.0 movement)';
  const movementPoints = mktMatch?.clv_points_fav || 0;

  const isConcluded = game.status === 'post' || game.status === 'STATUS_FINAL';

  return {
    scMatch,
    mktMatch,
    publishedFav,
    publishedDog,
    publishedSpreadNum,
    homeRelativeContestSpread,
    contestSpreadLabel,
    openingSpreadLabel,
    currentSpreadLabel,
    currentTotal,
    movementSummary,
    movementPoints,
    isConcluded
  };
}

/** Real-data "Line Stability Score" -- drift vs conviction */
export function calculateStability(game, lockedValue) {
  const currentSpread = typeof game.spread === 'number' ? game.spread : lockedValue;
  const driftPts = Math.round((currentSpread - lockedValue) * 10) / 10;

  const atsSplits = game.splits?.ats || {};
  let convictionPct = null; // 0-50
  if (atsSplits.visitorTicket != null || atsSplits.homeTicket != null) {
    const v = parseFloat(atsSplits.visitorTicket) || 0;
    const h = parseFloat(atsSplits.homeTicket) || 0;
    convictionPct = Math.abs(Math.max(v, h) - 50);
  } else {
    const spreadPicks = game.consensus?.expertPicks?.spread || [];
    if (spreadPicks.length > 0) {
      const homePicks = spreadPicks.filter(p => p.pick?.includes(game.home)).length;
      convictionPct = Math.abs(Math.round((homePicks / spreadPicks.length) * 100) - 50);
    }
  }

  const stabilityFromDrift = Math.max(0, 100 - Math.abs(driftPts) * 15);
  const stabilityFromConviction = convictionPct == null ? 50 : convictionPct * 2; // 0-100
  const score = Math.round(stabilityFromDrift * 0.6 + stabilityFromConviction * 0.4);

  const tier = score >= 70
    ? { label: 'Stable', className: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30' }
    : score >= 40
    ? { label: 'Watch', className: 'text-amber-400 bg-amber-900/30 border-amber-500/30' }
    : { label: 'Volatile', className: 'text-rose-400 bg-rose-900/30 border-rose-500/30' };

  return { driftPts, score, tier, hasConviction: convictionPct != null };
}

/** Filter and sort schedule games for a specific regular season week (default Week 1, 16 games) */
export function filterWeekGames(games = [], selectedWeek = 1) {
  const filtered = (games || []).filter(g => 
    Number(g.week) === selectedWeek && (g.season_type == null || Number(g.season_type) === 2)
  );
  return [...filtered].sort((a, b) => {
    const tA = a.kickoff_utc ? Date.parse(a.kickoff_utc) : 0;
    const tB = b.kickoff_utc ? Date.parse(b.kickoff_utc) : 0;
    return tA - tB;
  });
}

export function timeAgo(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * Sort SuperContest games by selected criteria:
 * - 'most_volatile' | 'volatility': Lowest stability score first (most volatile)
 * - 'most_stable': Highest stability score first
 * - 'movement': Largest net line movement/steam first
 * - 'default': Kickoff / schedule order
 */
export function sortSuperContestGames(games = [], sortBy = 'default', lines = {}) {
  if (!Array.isArray(games)) return [];
  const list = [...games];

  if (sortBy === 'default') {
    return list;
  }

  return list.sort((a, b) => {
    const metaA = getSuperContestMetadata(a);
    const metaB = getSuperContestMetadata(b);
    const lockedValA = lines[a.id] ?? (metaA.homeRelativeContestSpread ?? (typeof a.contestSpread === 'number' ? a.contestSpread : (typeof a.spread === 'number' ? a.spread : 0)));
    const lockedValB = lines[b.id] ?? (metaB.homeRelativeContestSpread ?? (typeof b.contestSpread === 'number' ? b.contestSpread : (typeof b.spread === 'number' ? b.spread : 0)));
    const stabA = calculateStability(a, lockedValA);
    const stabB = calculateStability(b, lockedValB);

    if (sortBy === 'most_volatile' || sortBy === 'volatility') {
      if (stabA.score !== stabB.score) {
        return stabA.score - stabB.score; // lowest stability score = most volatile first
      }
      return Math.abs(stabB.driftPts) - Math.abs(stabA.driftPts);
    }

    if (sortBy === 'most_stable') {
      if (stabA.score !== stabB.score) {
        return stabB.score - stabA.score; // highest stability score = most stable first
      }
      return Math.abs(stabA.driftPts) - Math.abs(stabB.driftPts);
    }

    if (sortBy === 'movement') {
      return Math.abs(metaB.movementPoints) - Math.abs(metaA.movementPoints);
    }

    return 0;
  });
}

