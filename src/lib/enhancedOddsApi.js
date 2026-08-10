// src/lib/enhancedOddsApi.js
// Enhanced odds API for multiple sportsbooks and line shopping

import logger from './logger';
import { ODDS_PROXY_URL, SUPABASE_ANON_KEY } from './apiConfig.js';
import { devig, calcEV } from './futures.js';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from './storage.js';

// ── Odds API quota tracking ──────────────────────────────────────────────────
// Persists remaining-request count + mock-fallback flag to localStorage so
// the UI can warn the user when live data is unavailable.
export const QUOTA_LS_KEY = 'oddsApi_quota';

const _currentMonth = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'

/**
 * Returns the current quota state from localStorage.
 * { remaining: number|null, month: 'YYYY-MM', isMock: boolean }
 * `remaining` is null when unknown; `isMock` is true whenever the last fetch
 * fell back to generated mock data.
 */
export const getOddsQuotaState = () => {
  const state = loadFromStorage(PR_STORAGE_KEYS.ODDS_QUOTA.key, null);
  if (!state) return { remaining: null, month: _currentMonth(), isMock: false };
  // Reset when the calendar month rolls over.
  if (state.month !== _currentMonth()) {
    return { remaining: null, month: _currentMonth(), isMock: false };
  }
  return state;
};

const _setQuotaState = (remaining, isMock) => {
  saveToStorage(PR_STORAGE_KEYS.ODDS_QUOTA.key, {
    remaining,
    month: _currentMonth(),
    isMock,
  });
};
// ────────────────────────────────────────────────────────────────────────────

const SPORTSBOOKS = {
  draftkings: { name: 'DraftKings', color: 'text-orange-400' },
  fanduel: { name: 'FanDuel', color: 'text-blue-400' },
  betmgm: { name: 'BetMGM', color: 'text-yellow-400' },
  caesars: { name: 'Caesars', color: 'text-purple-400' },
  betonline: { name: 'BetOnline', color: 'text-green-400' },
  bookmaker: { name: 'Bookmaker', color: 'text-red-400' },
  pointsbet: { name: 'PointsBet', color: 'text-pink-400' },
  unibet: { name: 'Unibet', color: 'text-indigo-400' }
};

// Store for line movement tracking
let lineHistory = new Map();

export const fetchMultiBookOdds = async () => {
  if (!ODDS_PROXY_URL) {
    logger.warn('⚠️ ODDS_PROXY_URL not configured. Using mock data.');
    _setQuotaState(null, true);
    return generateMockMultiBookData();
  }

  try {
    logger.log('🔄 Fetching multi-sportsbook odds via proxy...');

    const bookmakers = Object.keys(SPORTSBOOKS).join(',');
    const response = await fetch(ODDS_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        queryParams: {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          bookmakers,
          oddsFormat: 'american',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Track remaining quota forwarded by the odds-proxy edge function.
    const xRemaining = response.headers.get('x-requests-remaining');
    _setQuotaState(
      xRemaining !== null ? parseInt(xRemaining, 10) : null,
      false
    );

    const data = await response.json();
    logger.log(`✅ Success! Fetched odds for ${data.length} games from multiple books.`);

    // Process and track line movements
    const processedData = processMultiBookData(data);
    trackLineMovements(processedData);

    return processedData;

  } catch (error) {
    logger.error("❌ Failed to fetch multi-book odds:", error);
    _setQuotaState(null, true);
    return generateMockMultiBookData();
  }
};

const processMultiBookData = (rawData) => {
  return rawData.map(game => {
    const gameData = {
      id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      commence_time: game.commence_time,
      bookmakers: {}
    };

    // Process each bookmaker's odds
    game.bookmakers.forEach(book => {
      const bookKey = book.key;
      const bookData = {
        name: SPORTSBOOKS[bookKey]?.name || bookKey,
        color: SPORTSBOOKS[bookKey]?.color || 'text-slate-400',
        markets: {}
      };

      // Process markets (spread, total, moneyline)
      book.markets.forEach(market => {
        if (market.key === 'h2h') {
          bookData.markets.moneyline = {
            home: market.outcomes.find(o => o.name === game.home_team)?.price || null,
            away: market.outcomes.find(o => o.name === game.away_team)?.price || null
          };
        } else if (market.key === 'spreads') {
          const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
          bookData.markets.spread = {
            home_line: homeOutcome?.point || null,
            home_price: homeOutcome?.price || null,
            away_line: homeOutcome ? -homeOutcome.point : null,
            away_price: market.outcomes.find(o => o.name === game.away_team)?.price || null
          };
        } else if (market.key === 'totals') {
          const overOutcome = market.outcomes.find(o => o.name === 'Over');
          bookData.markets.total = {
            line: overOutcome?.point || null,
            over_price: overOutcome?.price || null,
            under_price: market.outcomes.find(o => o.name === 'Under')?.price || null
          };
        }
      });

      gameData.bookmakers[bookKey] = bookData;
    });

    return gameData;
  });
};

const trackLineMovements = (currentData) => {
  const now = new Date().toISOString();

  currentData.forEach(game => {
    const gameKey = `${game.away_team}_${game.home_team}`;
    const previousData = lineHistory.get(gameKey);

    if (previousData) {
      // Compare with previous odds to detect movements
      Object.entries(game.bookmakers).forEach(([bookKey, bookData]) => {
        const prevBook = previousData.bookmakers[bookKey];
        if (prevBook) {
          detectLineMovement(gameKey, bookKey, prevBook, bookData, now);
        }
      });
    }

    // Store current data for future comparison
    lineHistory.set(gameKey, {
      ...game,
      timestamp: now
    });
  });
};

const detectLineMovement = (gameKey, bookKey, prevData, currentData, timestamp) => {
  const movements = [];

  // Check spread movement
  if (prevData.markets.spread && currentData.markets.spread) {
    const prevLine = prevData.markets.spread.home_line;
    const currentLine = currentData.markets.spread.home_line;

    if (prevLine !== currentLine && prevLine !== null && currentLine !== null) {
      movements.push({
        game: gameKey,
        book: bookKey,
        type: 'spread',
        from: prevLine,
        to: currentLine,
        movement: currentLine - prevLine,
        timestamp
      });
    }
  }

  // Check total movement
  if (prevData.markets.total && currentData.markets.total) {
    const prevLine = prevData.markets.total.line;
    const currentLine = currentData.markets.total.line;

    if (prevLine !== currentLine && prevLine !== null && currentLine !== null) {
      movements.push({
        game: gameKey,
        book: bookKey,
        type: 'total',
        from: prevLine,
        to: currentLine,
        movement: currentLine - prevLine,
        timestamp
      });
    }
  }

  // Store movements for alert system
  if (movements.length > 0) {
    const existingMovements = loadFromStorage(PR_STORAGE_KEYS.LINE_MOVEMENTS.key, []);
    saveToStorage(PR_STORAGE_KEYS.LINE_MOVEMENTS.key, [...existingMovements, ...movements]);
  }
};

export const getBestOdds = (gameData) => {
  const bestOdds = {
    spread: { home: null, away: null },
    total: { over: null, under: null },
    moneyline: { home: null, away: null }
  };

  Object.entries(gameData.bookmakers).forEach(([bookKey, bookData]) => {
    // Find best spread odds
    if (bookData.markets.spread) {
      const homePrice = bookData.markets.spread.home_price;
      const awayPrice = bookData.markets.spread.away_price;

      if (!bestOdds.spread.home || homePrice > bestOdds.spread.home.price) {
        bestOdds.spread.home = {
          price: homePrice,
          line: bookData.markets.spread.home_line,
          book: bookData.name,
          bookKey
        };
      }

      if (!bestOdds.spread.away || awayPrice > bestOdds.spread.away.price) {
        bestOdds.spread.away = {
          price: awayPrice,
          line: bookData.markets.spread.away_line,
          book: bookData.name,
          bookKey
        };
      }
    }

    // Find best total odds
    if (bookData.markets.total) {
      const overPrice = bookData.markets.total.over_price;
      const underPrice = bookData.markets.total.under_price;

      if (!bestOdds.total.over || overPrice > bestOdds.total.over.price) {
        bestOdds.total.over = {
          price: overPrice,
          line: bookData.markets.total.line,
          book: bookData.name,
          bookKey
        };
      }

      if (!bestOdds.total.under || underPrice > bestOdds.total.under.price) {
        bestOdds.total.under = {
          price: underPrice,
          line: bookData.markets.total.line,
          book: bookData.name,
          bookKey
        };
      }
    }

    // Find best moneyline odds
    if (bookData.markets.moneyline) {
      const homePrice = bookData.markets.moneyline.home;
      const awayPrice = bookData.markets.moneyline.away;

      if (!bestOdds.moneyline.home || homePrice > bestOdds.moneyline.home.price) {
        bestOdds.moneyline.home = {
          price: homePrice,
          book: bookData.name,
          bookKey
        };
      }

      if (!bestOdds.moneyline.away || awayPrice > bestOdds.moneyline.away.price) {
        bestOdds.moneyline.away = {
          price: awayPrice,
          book: bookData.name,
          bookKey
        };
      }
    }
  });

  return bestOdds;
};

export const getLineMovements = (hours = 24) => {
  const movements = loadFromStorage(PR_STORAGE_KEYS.LINE_MOVEMENTS.key, []);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  return movements
    .filter(movement => new Date(movement.timestamp) > cutoffTime)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const findArbitrageOpportunities = (gamesData) => {
  const opportunities = [];

  gamesData.forEach(game => {
    const bestOdds = getBestOdds(game);

    // Check moneyline arbitrage
    if (bestOdds.moneyline.home && bestOdds.moneyline.away) {
      const homeImplied = oddsToImpliedProbability(bestOdds.moneyline.home.price);
      const awayImplied = oddsToImpliedProbability(bestOdds.moneyline.away.price);

      // Devigify: remove book margin before computing EV
      const [homeFair, awayFair] = devig(homeImplied, awayImplied);
      const homeEV = calcEV(homeFair, bestOdds.moneyline.home.price);
      const awayEV = calcEV(awayFair, bestOdds.moneyline.away.price);

      if (homeImplied + awayImplied < 1) {
        opportunities.push({
          game: `${game.away_team} @ ${game.home_team}`,
          type: 'moneyline',
          profit: ((1 / (homeImplied + awayImplied)) - 1) * 100,
          home_fair_prob: homeFair,
          away_fair_prob: awayFair,
          home_ev: homeEV,
          away_ev: awayEV,
          details: {
            home: bestOdds.moneyline.home,
            away: bestOdds.moneyline.away
          }
        });
      } else if (homeEV > 0 || awayEV > 0) {
        // No arb, but at least one side is +EV vs devigified consensus
        opportunities.push({
          game: `${game.away_team} @ ${game.home_team}`,
          type: 'positive_ev',
          profit: 0,
          home_fair_prob: homeFair,
          away_fair_prob: awayFair,
          home_ev: homeEV,
          away_ev: awayEV,
          details: {
            home: bestOdds.moneyline.home,
            away: bestOdds.moneyline.away
          }
        });
      }
    }
  });

  return opportunities;
};

const oddsToImpliedProbability = (americanOdds) => {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
};

// Mock data generator for demonstration
const generateMockMultiBookData = () => {
  logger.log("📊 Generating mock multi-sportsbook data...");

  const mockGames = [
    {
      id: 'mock_1',
      home_team: 'Kansas City Chiefs',
      away_team: 'Buffalo Bills',
      commence_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_2',
      home_team: 'San Francisco 49ers',
      away_team: 'Dallas Cowboys',
      commence_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock_3',
      home_team: 'Baltimore Ravens',
      away_team: 'Cincinnati Bengals',
      commence_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return mockGames.map(game => ({
    ...game,
    bookmakers: {
      draftkings: {
        name: 'DraftKings',
        color: 'text-orange-400',
        markets: {
          spread: { home_line: -3, home_price: -110, away_line: 3, away_price: -110 },
          total: { line: 47.5, over_price: -110, under_price: -110 },
          moneyline: { home: -150, away: 130 }
        }
      },
      fanduel: {
        name: 'FanDuel',
        color: 'text-blue-400',
        markets: {
          spread: { home_line: -2.5, home_price: -108, away_line: 2.5, away_price: -112 },
          total: { line: 47, over_price: -105, under_price: -115 },
          moneyline: { home: -145, away: 125 }
        }
      },
      betmgm: {
        name: 'BetMGM',
        color: 'text-yellow-400',
        markets: {
          spread: { home_line: -3, home_price: -105, away_line: 3, away_price: -115 },
          total: { line: 48, over_price: -110, under_price: -110 },
          moneyline: { home: -155, away: 135 }
        }
      }
    }
  }));
};

export { SPORTSBOOKS, generateMockMultiBookData };