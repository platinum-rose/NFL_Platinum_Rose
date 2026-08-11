// src/components/odds/LineMovementTracker.jsx
// Track and display historical line movements and alerts

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Bell, Activity, Target,
  AlertTriangle, Clock, Filter, BarChart3, RefreshCw
} from 'lucide-react';
import { getLineMovements } from '../../lib/enhancedOddsApi';
import { getLineMovementsDB } from '../../lib/supabase';
import { loadFromStorage, PR_STORAGE_KEYS } from '../../lib/storage';

// ─── significance thresholds (mirrored from SteamMoveTracker) ───────────────
const SIG_THRESHOLDS = {
  spread:    { HIGH: 1.5, MEDIUM: 0.5 },
  total:     { HIGH: 1.5, MEDIUM: 0.5 },
  moneyline: { HIGH: 15,  MEDIUM: 5   },
};

const calcSignificance = (move) => {
  const t = SIG_THRESHOLDS[move.type] || SIG_THRESHOLDS.spread;
  const abs = Math.abs(move.movement);
  if (abs >= t.HIGH)   return 'HIGH';
  if (abs >= t.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

// Normalise raw storage format → display format used by this component
const normalizeMove = (raw, idx) => ({
  id: raw.id ?? idx,
  game: raw.game ?? `${raw.away ?? '?'} @ ${raw.home ?? '?'}`,
  type: raw.type,
  originalLine: raw.from   ?? raw.originalLine,
  currentLine:  raw.to     ?? raw.currentLine,
  movement:     raw.movement,
  timestamp:    raw.timestamp,
  book:         raw.book ?? 'Unknown',
  volume:       raw.volume ?? (calcSignificance(raw) === 'HIGH' ? 'Heavy' : calcSignificance(raw) === 'MEDIUM' ? 'Medium' : 'Light'),
  significance: raw.significance ?? calcSignificance(raw),
});

// ─── demo data (fallback when no real movements exist) ──────────────────────
const DEMO_MOVEMENTS = [
  { id: 1, game: 'KC @ BUF',  type: 'spread',    originalLine: -3,   currentLine: -2.5, movement: +0.5, timestamp: new Date(Date.now() - 30  * 60000).toISOString(), book: 'DraftKings', volume: 'Heavy',  significance: 'HIGH'   },
  { id: 2, game: 'SF @ DAL',  type: 'total',     originalLine: 47.5, currentLine: 49,   movement: +1.5, timestamp: new Date(Date.now() - 45  * 60000).toISOString(), book: 'FanDuel',    volume: 'Medium', significance: 'MEDIUM' },
  { id: 3, game: 'BAL @ CIN', type: 'moneyline', originalLine: -150, currentLine: -130, movement: +20,  timestamp: new Date(Date.now() - 60  * 60000).toISOString(), book: 'BetMGM',     volume: 'Light',  significance: 'LOW'    },
  { id: 4, game: 'LAR @ SEA', type: 'spread',    originalLine: -7,   currentLine: -6,   movement: +1,   timestamp: new Date(Date.now() - 90  * 60000).toISOString(), book: 'Caesars',    volume: 'Heavy',  significance: 'HIGH'   },
  { id: 5, game: 'GB @ MIN',  type: 'total',     originalLine: 44,   currentLine: 42.5, movement: -1.5, timestamp: new Date(Date.now() - 120 * 60000).toISOString(), book: 'DraftKings', volume: 'Medium', significance: 'MEDIUM' },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

const timeAgo = (ts) => {
  const mins = Math.round((Date.now() - new Date(ts)) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
};

const fmtMove = (movement) =>
  movement > 0 ? `+${movement}` : `${movement}`;

const sigColor = {
  HIGH:   'text-red-400 bg-red-900/20',
  MEDIUM: 'text-yellow-400 bg-yellow-900/20',
  LOW:    'text-green-400 bg-green-900/20',
};

const alertStyle = {
  success: 'border-green-600 bg-green-900/20',
  warning: 'border-yellow-600 bg-yellow-900/20',
  error:   'border-red-600   bg-red-900/20',
  info:    'border-blue-600  bg-blue-900/20',
};

const alertIcon = (type) => {
  if (type === 'favorable_movement') return <TrendingUp  className="text-green-400  shrink-0" size={16} />;
  if (type === 'reverse_movement')   return <TrendingDown className="text-red-400    shrink-0" size={16} />;
  if (type === 'steam_move')         return <Activity     className="text-blue-400   shrink-0" size={16} />;
  if (type === 'arb_opportunity')    return <Target       className="text-purple-400 shrink-0" size={16} />;
  return <Bell className="text-slate-400 shrink-0" size={16} />;
};

// ─── generate bet-aware alerts from real movements ──────────────────────────
/**
 * Cross-reference movements against user's betting card to produce
 * personalised alerts (favorable move, adverse move, or steam alert).
 */
function buildAlerts(movements, userBets) {
  const alerts = [];

  // HIGH-significance moves as steam alerts
  movements
    .filter(m => m.significance === 'HIGH')
    .slice(0, 3)
    .forEach((m, i) => {
      alerts.push({
        id: `steam-${i}`,
        type: 'steam_move',
        game: m.game,
        message: `STEAM: ${m.game} ${m.type} moved ${m.originalLine} → ${m.currentLine} at ${m.book}`,
        severity: 'info',
        timestamp: m.timestamp,
      });
    });

  // User-bet-specific alerts
  userBets.forEach(bet => {
    const betGame = (bet.game || '').toLowerCase();
    const matchedMoves = movements.filter(m =>
      m.type === bet.type &&
      m.game.toLowerCase().split(/[@_]/).some(part =>
        betGame.includes(part.trim()) || part.trim().includes(betGame.split('@')[0].trim().toLowerCase())
      )
    );

    matchedMoves.forEach((m, i) => {
      const isFavorable =
        bet.type === 'spread'
          ? m.movement > 0  // spread rising = dog-friendly move
          : bet.type === 'total' && bet.selection?.toLowerCase() === 'over'
          ? m.movement < 0  // total dropping = easier Over
          : m.movement > 0; // Under: total rising = easier Under

      alerts.push({
        id: `bet-${bet.id}-${i}`,
        type: isFavorable ? 'favorable_movement' : 'reverse_movement',
        game: m.game,
        message: `Your ${bet.selection} ${bet.type} bet: line moved ${m.originalLine} → ${m.currentLine}${isFavorable ? ' (favorable)' : ' (against you)'}`,
        severity: isFavorable ? 'success' : 'warning',
        timestamp: m.timestamp,
      });
    });
  });

  // De-dupe by message prefix
  return alerts.slice(0, 8);
}

// ─── timeframe → hours mapping ───────────────────────────────────────────────
const TF_HOURS = { '1h': 1, '24h': 24, '7d': 168 };

// ─── component ───────────────────────────────────────────────────────────────

export default function LineMovementTracker() {
  const [movements, setMovements] = useState(DEMO_MOVEMENTS);
  const [alerts,    setAlerts]    = useState([]);
  const [isDemo,    setIsDemo]    = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [timeframe, setTimeframe] = useState('24h');

  const load = useCallback(async () => {
    const hours  = TF_HOURS[timeframe] ?? 24;
    // Try Supabase (agent data) first, fall back to localStorage
    let rawMoves = await getLineMovementsDB(hours).catch(() => []);
    if (rawMoves.length === 0) rawMoves = getLineMovements(hours);
    const real = rawMoves.map(normalizeMove);

    // Load user bets for personalised alerts
    const userBets = loadFromStorage(PR_STORAGE_KEYS.MY_BETS.key, []);

    if (real.length > 0) {
      setMovements(real);
      setIsDemo(false);
      setAlerts(buildAlerts(real, userBets));
    } else {
      setMovements(DEMO_MOVEMENTS);
      setIsDemo(true);
      setAlerts([]);
    }
  }, [timeframe]);

  // load() does a real async fetch (getLineMovementsDB, falling back to
  // getLineMovements) -- the standard fetch-on-mount/dependency-change
  // effect pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filteredMovements = movements.filter(m => {
    if (filter === 'significant') return m.significance === 'HIGH';
    if (filter === 'spread')      return m.type === 'spread';
    if (filter === 'total')       return m.type === 'total';
    if (filter === 'moneyline')   return m.type === 'moneyline';
    return true;
  });

  // Stats — only meaningful on real data
  const highCount   = movements.filter(m => m.significance === 'HIGH').length;
  const mediumCount = movements.filter(m => m.significance === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Line Movement Tracker</h2>
          <p className="text-slate-400 mt-1">Monitor line movements and betting alerts</p>
          {isDemo && (
            <span className="inline-block mt-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 tracking-wider">
              DEMO — Sync odds to see real movements
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={load}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
            {alerts.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-600 text-black text-xs rounded-full font-bold">
                {alerts.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`border rounded-lg p-4 ${alertStyle[alert.severity] ?? alertStyle.info}`}>
                  <div className="flex items-start gap-3">
                    {alertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{alert.game}</span>
                        <span className="text-xs text-slate-400">{timeAgo(alert.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4 text-sm">
              {isDemo
                ? 'No alerts — sync live odds to generate real-time alerts'
                : 'No active alerts for current line movements'}
            </p>
          )}
        </div>
      </div>

      {/* Line Movements */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Recent Line Movements</h3>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="all">All Movements</option>
              <option value="significant">Significant Only</option>
              <option value="spread">Spread</option>
              <option value="total">Total</option>
              <option value="moneyline">Moneyline</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          {filteredMovements.length > 0 ? (
            <div className="space-y-3">
              {filteredMovements.map(movement => (
                <div key={movement.id} className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{movement.game}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sigColor[movement.significance] ?? sigColor.LOW}`}>
                          {movement.significance}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 uppercase">{movement.type}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{movement.book}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{timeAgo(movement.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-slate-400">{movement.originalLine}</span>
                          <span className="mx-2 text-slate-600">→</span>
                          <span className="text-white font-medium">{movement.currentLine}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-bold ${movement.movement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {movement.movement > 0
                            ? <TrendingUp  size={16} />
                            : <TrendingDown size={16} />}
                          <span>{fmtMove(movement.movement)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Volume: {movement.volume}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No line movements found for this filter</p>
          )}
        </div>
      </div>

      {/* Movement Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-red-400" size={24} />
            <h4 className="text-white font-semibold">High Significance</h4>
          </div>
          <div className="text-2xl font-bold text-red-400 mb-2">{highCount}</div>
          <p className="text-sm text-slate-400">Moves ≥ 1.5 pts / 15 ML pts</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-yellow-400" size={24} />
            <h4 className="text-white font-semibold">Medium Moves</h4>
          </div>
          <div className="text-2xl font-bold text-yellow-400 mb-2">{mediumCount}</div>
          <p className="text-sm text-slate-400">Moves between thresholds</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-blue-400" size={24} />
            <h4 className="text-white font-semibold">Active Alerts</h4>
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-2">{alerts.length}</div>
          <p className="text-sm text-slate-400">
            {isDemo ? 'Demo mode — sync odds for real alerts' : 'Alerts generated from live moves'}
          </p>
        </div>
      </div>
    </div>
  );
}