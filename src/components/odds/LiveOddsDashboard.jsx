// src/components/odds/LiveOddsDashboard.jsx
// Live Odds Integration & Line Shopping Dashboard

import logger from '../../lib/logger';
import React, { useState, useEffect } from 'react';
import {
  RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Search,
  Filter, Clock, DollarSign, Target, Zap, Activity, Star
} from 'lucide-react';
import { fetchMultiBookOdds, getBestOdds, SPORTSBOOKS, getOddsQuotaState } from '../../lib/enhancedOddsApi';
import { getBankrollData } from '../../lib/bankroll';
import { getLatestOddsSnapshot } from '../../lib/supabase';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage';

export default function LiveOddsDashboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [showBestOdds, setShowBestOdds] = useState(true);
  const [userBets, setUserBets] = useState([]);
  const [quotaState, setQuotaState] = useState(() => getOddsQuotaState());

  useEffect(() => {
    (async () => {
      // 1. Try Supabase snapshot (written by OddsIngestAgent every 4h)
      try {
        const snap = await getLatestOddsSnapshot();
        if (snap?.games?.length) {
          const ageMin = Math.round((Date.now() - new Date(snap.fetchedAt).getTime()) / 60000);
          if (ageMin < 60) { // use if < 1 hour old
            logger.log(`☁️ Using Supabase odds snapshot (${ageMin}m old, ${snap.games.length} games)`);
            setGames(snap.games);
            setLastUpdate(new Date(snap.fetchedAt));
            // Mirror to cache so BetValueComparison + OddsCenter badge work
            saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, snap.games);
            saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS_TIME.key, new Date(snap.fetchedAt).getTime());
            setLoading(false);
            loadUserBets();
            return;
          }
        }
      } catch (e) {
        logger.warn('⚠️ Supabase unavailable, falling back to localStorage/API');
      }

      // 2. Try cache (< 10 min old)
      const cached = loadFromStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, null);
      const cacheTime = loadFromStorage(PR_STORAGE_KEYS.CACHED_ODDS_TIME.key, null);
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 10 * 60 * 1000) {
          logger.log('📦 Using localStorage cache (age: ' + Math.round(age / 60000) + ' min)');
          setGames(cached);
          setLastUpdate(new Date(parseInt(cacheTime)));
          setLoading(false);
          loadUserBets();
          return;
        }
      }

      // 3. Fall back to direct API call
      loadOdds();
      loadUserBets();

      // ⚠️ AUTO-REFRESH DISABLED — agent handles polling now
    })();
  }, []);

  const loadOdds = async () => {
    setLoading(true);
    try {
      logger.log('🔄 Fetching odds from API (this counts against your 500/month limit)...');
      const oddsData = await fetchMultiBookOdds();
      setGames(oddsData);
      setLastUpdate(new Date());
      setQuotaState(getOddsQuotaState());

      // Cache the results
      saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, oddsData);
      saveToStorage(PR_STORAGE_KEYS.CACHED_ODDS_TIME.key, Date.now());

      logger.log(`✅ Loaded odds for ${oddsData.length} games (cached for 10 minutes)`);
    } catch (error) {
      logger.error('Failed to load odds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBets = () => {
    const bankrollData = getBankrollData();
    setUserBets(bankrollData.bets || []);
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = !searchTerm ||
      game.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.away_team.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' ||
      (filter === 'upcoming' && new Date(game.commence_time) > new Date());

    return matchesSearch && matchesFilter;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'time') return new Date(a.commence_time) - new Date(b.commence_time);
    if (sortBy === 'home') return a.home_team.localeCompare(b.home_team);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Odds & Line Shopping</h1>
          <p className="text-slate-400 mt-1">Real-time odds comparison and line movement tracking</p>
          {lastUpdate && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <Clock size={12} />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          onClick={loadOdds}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Odds
        </button>
      </div>

      {/* Simulated-data warning — shown whenever the last fetch fell back to mock */}
      {quotaState.isMock && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-900/40 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            &#9888;&#65039; Simulated data &mdash; quota exhausted or API
            unavailable. Odds shown are <strong>not live</strong>.
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg"
            >
              <option value="all">All Games</option>
              <option value="upcoming">Upcoming Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg"
            >
              <option value="time">Sort by Time</option>
              <option value="home">Sort by Home Team</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showBestOdds}
                onChange={(e) => setShowBestOdds(e.target.checked)}
                className="rounded"
              />
              Best Odds Only
            </label>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading live odds...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGames.map((game) => {
            const bestOdds = getBestOdds(game);
            const gameTime = new Date(game.commence_time);
            const isLive = gameTime <= new Date() && gameTime >= new Date(Date.now() - 4 * 60 * 60 * 1000);

            return (
              <div key={game.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                {/* Game Header */}
                <div className="p-4 border-b border-slate-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {game.away_team.split(' ').pop()} @ {game.home_team.split(' ').pop()}
                          </h3>
                          {isLive && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                              <Activity size={12} />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{formatTime(game.commence_time)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sportsbooks Comparison */}
                <div className="p-4 space-y-3">
                  {/* Sportsbooks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(game.bookmakers).map(([bookKey, bookData]) => (
                      <div key={bookKey} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <div className="text-sm font-bold text-white mb-3">{bookData.name}</div>

                        {/* Spread */}
                        {bookData.markets.spread && (
                          <div className="mb-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Spread</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-300">{game.home_team.split(' ').pop()}</span>
                                <span className="text-white font-bold">
                                  {bookData.markets.spread.home_line > 0 ? '+' : ''}{bookData.markets.spread.home_line}
                                  <span className="text-slate-400 ml-1">{bookData.markets.spread.home_price}</span>
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">{game.away_team.split(' ').pop()}</span>
                                <span className="text-white font-bold">
                                  {bookData.markets.spread.away_line > 0 ? '+' : ''}{bookData.markets.spread.away_line}
                                  <span className="text-slate-400 ml-1">{bookData.markets.spread.away_price}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        {bookData.markets.total && (
                          <div className="mb-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-300">O {bookData.markets.total.line}</span>
                                <span className="text-white font-bold">{bookData.markets.total.over_price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">U {bookData.markets.total.line}</span>
                                <span className="text-white font-bold">{bookData.markets.total.under_price}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Moneyline */}
                        {bookData.markets.moneyline && (
                          <div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">ML</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-300">{game.home_team.split(' ').pop()}</span>
                                <span className="text-white font-bold">{bookData.markets.moneyline.home > 0 ? '+' : ''}{bookData.markets.moneyline.home}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">{game.away_team.split(' ').pop()}</span>
                                <span className="text-white font-bold">{bookData.markets.moneyline.away > 0 ? '+' : ''}{bookData.markets.moneyline.away}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Best Odds Summary */}
                  {bestOdds && (
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mt-3">
                      <div className="text-xs font-semibold text-blue-300 mb-2">💡 Best Available Odds</div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        {bestOdds.spread.home && (
                          <div>
                            <div className="text-slate-400">Best Spread</div>
                            <div className="text-white font-bold">{game.home_team.split(' ').pop()} {bestOdds.spread.home.line}</div>
                            <div className="text-slate-500">{bestOdds.spread.home.book}</div>
                          </div>
                        )}
                        {bestOdds.total.over && (
                          <div>
                            <div className="text-slate-400">Best Total</div>
                            <div className="text-white font-bold">O/U {bestOdds.total.over.line}</div>
                            <div className="text-slate-500">{bestOdds.total.over.book}</div>
                          </div>
                        )}
                        {bestOdds.moneyline.home && (
                          <div>
                            <div className="text-slate-400">Best ML</div>
                            <div className="text-white font-bold">{bestOdds.moneyline.home.price}</div>
                            <div className="text-slate-500">{bestOdds.moneyline.home.book}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sortedGames.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-400">No games found matching your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}