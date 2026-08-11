// src/components/odds/SteamMoveTracker.jsx
// Steam move / sharp money tracker — reads lineMovements from localStorage, falls back to demo data

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, Info, RefreshCw } from 'lucide-react';
import { getLineMovements } from '../../lib/enhancedOddsApi';
import { getLineMovementsDB } from '../../lib/supabase';

// Significance thresholds by market type
const SIG_THRESHOLDS = {
  spread:    { HIGH: 1.5, MEDIUM: 0.5 },
  total:     { HIGH: 1.5, MEDIUM: 0.5 },
  moneyline: { HIGH: 15,  MEDIUM: 5 },
};

const getSignificance = (move) => {
  const t = SIG_THRESHOLDS[move.type] || SIG_THRESHOLDS.spread;
  const abs = Math.abs(move.movement);
  if (abs >= t.HIGH)   return 'HIGH';
  if (abs >= t.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

const timeAgo = (ts) => {
  const mins = Math.round((Date.now() - new Date(ts)) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
};

const DEMO_MOVES = [
  { game: 'KC @ BUF',  type: 'spread',    from: -3.5, to: -5,   movement: -1.5, book: 'DraftKings', timestamp: new Date(Date.now() - 18  * 60000).toISOString() },
  { game: 'SF @ DAL',  type: 'total',     from: 47.5, to: 49,   movement:  1.5, book: 'FanDuel',    timestamp: new Date(Date.now() - 35  * 60000).toISOString() },
  { game: 'BAL @ CIN', type: 'moneyline', from: -150, to: -130, movement:  20,  book: 'BetMGM',     timestamp: new Date(Date.now() - 62  * 60000).toISOString() },
  { game: 'LAR @ SEA', type: 'spread',    from: -7,   to: -5.5, movement:  1.5, book: 'Caesars',    timestamp: new Date(Date.now() - 88  * 60000).toISOString() },
  { game: 'GB @ MIN',  type: 'total',     from: 44,   to: 42.5, movement: -1.5, book: 'DraftKings', timestamp: new Date(Date.now() - 110 * 60000).toISOString() },
  { game: 'PHI @ NYG', type: 'spread',    from: -6,   to: -7.5, movement: -1.5, book: 'BetOnline',  timestamp: new Date(Date.now() - 145 * 60000).toISOString() },
  { game: 'DEN @ LV',  type: 'moneyline', from: -105, to: -120, movement: -15,  book: 'Caesars',    timestamp: new Date(Date.now() - 190 * 60000).toISOString() },
  { game: 'IND @ TEN', type: 'total',     from: 41,   to: 43,   movement:  2,   book: 'FanDuel',    timestamp: new Date(Date.now() - 240 * 60000).toISOString() },
];

const TYPE_COLORS = {
  spread:    'text-purple-400 bg-purple-900/20 border-purple-600/30',
  total:     'text-cyan-400 bg-cyan-900/20 border-cyan-600/30',
  moneyline: 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30',
};

const SIG_STYLES = {
  HIGH:   { label: 'HIGH',   style: 'text-red-400 bg-red-900/20 border-red-500/30',     dot: 'bg-red-400 animate-pulse' },
  MEDIUM: { label: 'MED',    style: 'text-amber-400 bg-amber-900/20 border-amber-500/30', dot: 'bg-amber-400' },
  LOW:    { label: 'LOW',    style: 'text-slate-400 bg-slate-700/40 border-slate-600/30', dot: 'bg-slate-500' },
};

export default function SteamMoveTracker() {
  const [moves, setMoves] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sigFilter, setSigFilter] = useState('all');

  const load = async () => {
    // Try Supabase first (populated by OddsIngestAgent), fall back to localStorage
    let real = await getLineMovementsDB(24).catch(() => []);
    if (real.length === 0) real = getLineMovements(24);

    if (real.length > 0) {
      setMoves(real.map(m => ({ ...m, significance: m.significance || getSignificance(m) })));
      setIsDemo(false);
    } else {
      setMoves(DEMO_MOVES.map(m => ({ ...m, significance: getSignificance(m) })));
      setIsDemo(true);
    }
  };

  // load() is also wired to a manual refresh button below, so it has to stay
  // a real callable function; it's also a real async fetch (getLineMovementsDB).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const filtered = moves.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (sigFilter  !== 'all' && m.significance !== sigFilter) return false;
    return true;
  });

  const highCount    = moves.filter(m => m.significance === 'HIGH').length;
  const gamesCount   = new Set(moves.map(m => m.game)).size;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900/30">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Steam Move Tracker</h2>
              <p className="text-xs text-slate-400">Sharp money & coordinated line movements</p>
            </div>
            {isDemo && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/30 tracking-wider">
                DEMO DATA
              </span>
            )}
          </div>

          {/* Filters + refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Types</option>
              <option value="spread">Spread</option>
              <option value="total">Total</option>
              <option value="moneyline">Moneyline</option>
            </select>
            <select
              value={sigFilter}
              onChange={e => setSigFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Signals</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium+</option>
            </select>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-700 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center pr-3">
            <p className="text-3xl font-black text-blue-400">{moves.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Movements (24h)</p>
          </div>
          <div className="text-center px-3">
            <p className="text-3xl font-black text-red-400">{highCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">High Signal</p>
          </div>
          <div className="text-center pl-3">
            <p className="text-3xl font-black text-amber-400">{gamesCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Games Affected</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm text-blue-200">
        <Info size={15} className="mt-0.5 shrink-0 text-blue-400" />
        <span>
          Steam moves are rapid, coordinated line shifts across multiple books — a hallmark of sharp or syndicate action.
          Moves ≥1.5 points (spread/total) or ≥15 (ML) are classified HIGH signal.
          {isDemo && <strong className="text-amber-400 ml-1">Sync live odds to track real-time movements.</strong>}
        </span>
      </div>

      {/* Moves table */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <Activity size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No movements match the current filters.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_160px_110px_90px_90px] text-[10px] font-bold uppercase tracking-wider text-slate-500 px-5 py-3 border-b border-slate-700 bg-slate-900/40">
            <span>Game</span>
            <span>Type</span>
            <span>Movement</span>
            <span>Book</span>
            <span>Signal</span>
            <span className="text-right">Time</span>
          </div>

          {filtered.map((move, i) => {
            const sig  = SIG_STYLES[move.significance] || SIG_STYLES.LOW;
            const tc   = TYPE_COLORS[move.type] || 'text-slate-400 bg-slate-700/20 border-slate-600/30';
            const isUp = move.movement > 0;

            return (
              <div
                key={i}
                className={`flex flex-col gap-2 md:grid md:grid-cols-[1fr_100px_160px_110px_90px_90px] md:items-center px-5 py-3.5 border-b border-slate-700/50 last:border-0 transition-colors hover:bg-slate-700/30 ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}`}
              >
                {/* Game */}
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sig.dot}`}></span>
                  <span className="text-white font-semibold text-sm">{move.game}</span>
                </div>

                {/* Type badge */}
                <div>
                  <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded border ${tc}`}>
                    {move.type}
                  </span>
                </div>

                {/* Movement arrow */}
                <div className="flex items-center gap-1.5 font-mono text-sm">
                  {isUp
                    ? <TrendingUp  size={14} className="text-red-400   shrink-0" />
                    : <TrendingDown size={14} className="text-emerald-400 shrink-0" />
                  }
                  <span className="text-slate-400">{move.from}</span>
                  <span className="text-slate-600 mx-0.5">→</span>
                  <span className="text-white font-bold">{move.to}</span>
                  <span className={`text-xs ml-1 ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                    ({isUp ? '+' : ''}{move.movement})
                  </span>
                </div>

                {/* Book */}
                <span className="text-sm text-slate-300">{move.book}</span>

                {/* Significance badge */}
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${sig.style}`}>
                    {sig.label}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  {timeAgo(move.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
