// src/components/odds/ArbitrageFinder.jsx
// Arbitrage opportunity finder — reads from cached odds, falls back to demo data

import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, Info, Zap, AlertCircle } from 'lucide-react';
import { findArbitrageOpportunities, generateMockMultiBookData } from '../../lib/enhancedOddsApi';
import { loadFromStorage, PR_STORAGE_KEYS } from '../../lib/storage';

// American odds → decimal
const toDecimal = (american) => {
  const n = Number(american);
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
};

// Given two legs and a total stake, compute optimal individual stakes + profit
const calcArb = (odds1, odds2, totalStake) => {
  const d1 = toDecimal(odds1);
  const d2 = toDecimal(odds2);
  const s1 = totalStake * d2 / (d1 + d2);
  const s2 = totalStake * d1 / (d1 + d2);
  const profit = s1 * d1 - totalStake;
  return { s1, s2, profit };
};

const fmt = (odds) => (odds > 0 ? `+${odds}` : `${odds}`);

// Realistic demo opportunities for when no live odds are loaded
const DEMO_OPPORTUNITIES = [
  {
    game: 'Kansas City Chiefs @ Buffalo Bills',
    type: 'moneyline',
    profit: 2.14,
    details: {
      home: { price: -110, book: 'DraftKings' },
      away: { price: 120, book: 'FanDuel' },
    },
  },
  {
    game: 'San Francisco 49ers @ Dallas Cowboys',
    type: 'moneyline',
    profit: 1.37,
    details: {
      home: { price: -125, book: 'BetMGM' },
      away: { price: 115, book: 'Caesars' },
    },
  },
  {
    game: 'Baltimore Ravens @ Cincinnati Bengals',
    type: 'moneyline',
    profit: 0.88,
    details: {
      home: { price: -140, book: 'FanDuel' },
      away: { price: 130, book: 'BetOnline' },
    },
  },
];

export default function ArbitrageFinder() {
  const [opportunities, setOpportunities] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [stake, setStake] = useState(1000);

  const loadOpportunities = () => {
    // Try real cached odds first
    const games = loadFromStorage(PR_STORAGE_KEYS.CACHED_ODDS.key, null);
    if (games !== null) {
      try {
        const arbs = findArbitrageOpportunities(games);
        if (arbs.length > 0) {
          setOpportunities(arbs);
          setIsDemo(false);
          return;
        }
      } catch (_) { /* fall through */ }
    }
    // Try mock multi-book data
    const mockArbs = findArbitrageOpportunities(generateMockMultiBookData());
    if (mockArbs.length > 0) {
      setOpportunities(mockArbs);
    } else {
      setOpportunities(DEMO_OPPORTUNITIES);
    }
    setIsDemo(true);
  };

  // loadOpportunities is also wired to a manual refresh button below, so it
  // has to stay a real callable function rather than a lazy useState
  // initializer -- kept as a mount effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOpportunities();
  }, []);

  const bestProfit = opportunities.length > 0
    ? Math.max(...opportunities.map(o => o.profit))
    : 0;

  const totalEstProfit = opportunities.reduce((sum, o) => {
    const { profit } = calcArb(o.details.home.price, o.details.away.price, stake);
    return sum + profit;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-900/30">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Arbitrage Finder</h2>
              <p className="text-xs text-slate-400">Guaranteed-profit plays across sportsbooks</p>
            </div>
            {isDemo && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/30 tracking-wider">
                DEMO DATA
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total Stake</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min={10}
                  step={50}
                  value={stake}
                  onChange={e => setStake(Math.max(10, Number(e.target.value)))}
                  className="w-24 bg-slate-700 border border-slate-600 rounded-lg pl-6 pr-2 py-1.5 text-white text-sm text-right focus:ring-2 focus:ring-purple-500/50 outline-none"
                />
              </div>
            </div>
            <button
              onClick={loadOpportunities}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-slate-700 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center pr-3">
            <p className="text-3xl font-black text-purple-400">{opportunities.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Opportunities</p>
          </div>
          <div className="text-center px-3">
            <p className="text-3xl font-black text-emerald-400">
              {bestProfit > 0 ? `${bestProfit.toFixed(2)}%` : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Best Profit %</p>
          </div>
          <div className="text-center pl-3">
            <p className="text-3xl font-black text-emerald-400">
              {totalEstProfit > 0 ? `$${totalEstProfit.toFixed(2)}` : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Est. Profit on ${stake.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-sm text-purple-200">
        <Info size={15} className="mt-0.5 shrink-0 text-purple-400" />
        <span>
          Arbs occur when combined implied probability across two books is under 100%.
          Opportunities close fast — books typically correct within minutes of detection.
          {isDemo && <strong className="text-amber-400 ml-1">Sync live odds in the Live Odds tab to scan real markets.</strong>}
        </span>
      </div>

      {/* Opportunity cards */}
      {opportunities.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <AlertCircle size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No arbitrage opportunities found.</p>
          <p className="text-xs text-slate-500 mt-1">Sync live odds to scan current markets.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opp, i) => {
            const homeOdds = opp.details.home.price;
            const awayOdds = opp.details.away.price;
            const { s1, s2, profit } = calcArb(homeOdds, awayOdds, stake);
            const profitColor =
              opp.profit >= 2 ? 'text-emerald-400' :
              opp.profit >= 1 ? 'text-yellow-400' :
              'text-slate-300';
            const profitBg =
              opp.profit >= 2 ? 'bg-emerald-900/20 border-emerald-500/20' :
              opp.profit >= 1 ? 'bg-yellow-900/20 border-yellow-500/20' :
              'bg-slate-700/30 border-slate-600/20';

            return (
              <div key={i} className="bg-slate-800 border border-purple-500/25 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                {/* Game + profit header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-purple-400 shrink-0" />
                      <span className="text-white font-bold">{opp.game}</span>
                    </div>
                    <span className="text-xs text-slate-500 capitalize mt-0.5 block ml-5">{opp.type} arbitrage</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-3xl font-black ${profitColor}`}>+{opp.profit.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500">guaranteed</p>
                  </div>
                </div>

                {/* Bet legs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Leg 1 — Home', odds: homeOdds, book: opp.details.home.book, stake: s1 },
                    { label: 'Leg 2 — Away', odds: awayOdds, book: opp.details.away.book, stake: s2 },
                  ].map((leg, j) => (
                    <div key={j} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">{leg.label}</p>
                      <p className="text-sm font-bold text-white">{leg.book}</p>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">{fmt(leg.odds)}</p>
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Stake</span>
                        <span className="text-sm font-black text-white">${leg.stake.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Return summary */}
                <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 border ${profitBg}`}>
                  <div className="text-xs text-slate-400">
                    Total staked: <span className="text-white font-bold">${stake.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Guaranteed return:{' '}
                    <span className={`font-black ${profitColor}`}>
                      ${(stake + profit).toFixed(2)}{' '}
                      <span className="text-xs font-normal opacity-75">(+${profit.toFixed(2)})</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
