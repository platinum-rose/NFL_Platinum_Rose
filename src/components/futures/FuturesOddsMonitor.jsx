// src/components/futures/FuturesOddsMonitor.jsx
// Shows open futures positions alongside current market odds from Supabase.
// Compares entry price vs best available now — highlights value shifts.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Clock, AlertCircle,
  Wifi, WifiOff, ArrowUpRight, ArrowDownRight, ExternalLink,
  ChevronDown, ChevronUp, BarChart2
} from 'lucide-react';
import { getPositions, FUTURES_TYPE_LABELS, POSITION_STATUS } from '../../lib/futures';
import { getLatestFuturesOdds } from '../../lib/supabase';
import { TEAM_LOGOS } from '../../lib/teams';
import { getContractsForTeam } from '../../lib/predictionMarketStore';

// ── Odds math ─────────────────────────────────────────────────────────────────
const toDecimal = (american) => {
  if (american >= 100)  return (american / 100) + 1;
  if (american <= -100) return (100 / Math.abs(american)) + 1;
  return 2;
};
const toImplied = (american) => {
  if (american >= 100)  return 100 / (american + 100);
  if (american <= -100) return Math.abs(american) / (Math.abs(american) + 100);
  return 0.5;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtOdds = (o) => (o == null ? '—' : o >= 0 ? `+${o}` : `${o}`);
const fmtPct  = (p) => (p == null ? '—' : `${(p * 100).toFixed(1)}%`);

const BOOK_NAMES = {
  draftkings: 'DraftKings', fanduel: 'FanDuel', betmgm: 'BetMGM',
  caesars: 'Caesars', betonline: 'BetOnline', bookmaker: 'Bookmaker',
};
const bookLabel = (key) => BOOK_NAMES[key] || key;

// Map our FUTURES_TYPES to the agent's market_type values
const TYPE_TO_MARKET = {
  superbowl:  'superbowl',
  conference: 'conference',
  division:   'division',
  // playoffs and wins are not yet sourced from TheOddsAPI
};

/**
 * Given a list of current odds rows for a team+market, return the best
 * (longest, i.e. highest positive or least negative) odds and the book.
 */
function bestOdds(rows) {
  if (!rows?.length) return null;
  // "Best" for the bettor = longest odds = highest decimal
  return rows.reduce((best, r) => {
    if (!best || toDecimal(r.odds) > toDecimal(best.odds)) return r;
    return best;
  }, null);
}

/**
 * Value direction from the bettor's perspective:
 *   - odds got longer (higher value) → 'better' (🟢 your position is worth more)
 *   - odds got shorter  → 'worse'
 *   - no change        → 'flat'
 */
function valueDirection(entryOdds, currentOdds) {
  if (currentOdds == null) return 'unknown';
  const entryDecimal   = toDecimal(entryOdds);
  const currentDecimal = toDecimal(currentOdds);
  const delta = currentDecimal - entryDecimal;
  if (Math.abs(delta) < 0.05) return 'flat';
  return delta > 0 ? 'worse' : 'better'; // shorter odds = team is now more favored = your ticket worth more
}

const VALUE_STYLE = {
  better:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: TrendingUp,   label: 'Value ↑' },
  worse:   { color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       Icon: TrendingDown, label: 'Value ↓' },
  flat:    { color: 'text-slate-400',   bg: 'bg-slate-800/40 border-slate-700',        Icon: Minus,        label: 'Flat'    },
  unknown: { color: 'text-slate-600',   bg: 'bg-slate-800/30 border-slate-800',        Icon: Minus,        label: '—'       },
};

// ═══════════════════════════════════════════════════════════════════════════���═══
export default function FuturesOddsMonitor() {
  const [marketData, setMarketData]     = useState([]);   // raw rows from Supabase
  const [loading, setLoading]           = useState(false);
  const [lastFetched, setLastFetched]   = useState(null);
  const [error, setError]               = useState('');
  const [expanded, setExpanded]         = useState(new Set());
  const [refreshKey, setRefreshKey]     = useState(0);

  // refreshKey isn't read in the body -- it exists purely to force this memo
  // to re-read from localStorage after the manual refresh button below fires.
  const positions = useMemo(
    () => getPositions().filter(p => p.status === POSITION_STATUS.OPEN),
    [refreshKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Build current odds map: `${marketType}|${team}` → [rows] ─────────────
  const currentOddsMap = useMemo(() => {
    const map = new Map();
    for (const row of marketData) {
      const key = `${row.market_type}|${row.team}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return map;
  }, [marketData]);

  // ── Fetch from Supabase ────────────────────────────────────────────────────
  const fetchOdds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getLatestFuturesOdds();
      setMarketData(rows || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load odds');
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOdds(); }, [fetchOdds]);

  const toggleExpand = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const refresh = () => {
    setRefreshKey(k => k + 1);
    fetchOdds();
  };

  // ── Derived: annotate each position with current market data ─────────────
  const annotated = useMemo(() => {
    return positions.map(pos => {
      const marketType = TYPE_TO_MARKET[pos.type];
      const isSupported = !!marketType;

      const currentRows  = isSupported ? (currentOddsMap.get(`${marketType}|${pos.team}`) || []) : [];
      const best         = bestOdds(currentRows);
      const direction    = isSupported && best ? valueDirection(pos.odds, best.odds) : 'unknown';
      const probDelta    = best ? toImplied(pos.odds) - toImplied(best.odds) : null;
      // Positive probDelta = team's probability dropped = odds got longer = your ticket worth more

      return { pos, isSupported, currentRows, best, direction, probDelta };
    });
  }, [positions, currentOddsMap]);

  const supported    = annotated.filter(a => a.isSupported);
  const unsupported  = annotated.filter(a => !a.isSupported);
  const hasData      = marketData.length > 0;
  const noPositions  = positions.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-white">Odds Monitor</span>
          {hasData ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
              <Wifi size={9} /> Live
            </span>
          ) : !loading && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
              <WifiOff size={9} /> No Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock size={10} /> {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="text-rose-400 shrink-0" />
          <span className="text-rose-400 text-xs">{error}</span>
        </div>
      )}

      {/* No Supabase data info */}
      {!hasData && !loading && !error && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-bold">No current odds in database</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              The <code className="text-amber-400/80">FuturesOddsIngestAgent</code> hasn't run yet, or Supabase is not configured.
              Run it manually via <strong className="text-slate-400">GitHub Actions → Futures Odds Ingest → Run workflow</strong>,
              or odds will auto-populate once the daily cron fires.
            </p>
          </div>
        </div>
      )}

      {/* No positions */}
      {noPositions ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
          <BarChart2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No open positions to monitor.</p>
        </div>
      ) : (
        <div className="space-y-2">

          {/* Supported positions */}
          {supported.map(({ pos, currentRows, best, direction, probDelta }) => {
            const style    = VALUE_STYLE[direction];
            const isExp    = expanded.has(pos.id);
            const logo     = TEAM_LOGOS[pos.team] || TEAM_LOGOS[pos.team?.split(' ').pop()] || '';

            return (
              <div
                key={pos.id}
                className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all
                  ${isExp ? 'border-slate-700 ring-1 ring-purple-500/20' : 'border-slate-800'}`}
              >
                {/* Main row */}
                <button
                  onClick={() => toggleExpand(pos.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition"
                >
                  <img src={logo} alt="" className="w-7 h-7 object-contain shrink-0"
                    onError={e => { e.target.style.display = 'none'; }} />

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{pos.team}</div>
                    <div className="text-purple-400 text-[10px] uppercase font-bold">
                      {FUTURES_TYPE_LABELS[pos.type] || pos.type}
                    </div>
                  </div>

                  {/* Entry odds */}
                  <div className="text-right shrink-0">
                    <div className="text-slate-500 text-[10px]">Entry</div>
                    <div className="text-slate-300 font-mono text-sm">{fmtOdds(pos.odds)}</div>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    {direction === 'better' && <ArrowDownRight size={16} className="text-emerald-400" />}
                    {direction === 'worse'  && <ArrowUpRight   size={16} className="text-rose-400" />}
                    {direction === 'flat'   && <Minus          size={16} className="text-slate-500" />}
                    {direction === 'unknown'&& <Minus          size={16} className="text-slate-700" />}
                  </div>

                  {/* Current best */}
                  <div className="text-right shrink-0">
                    <div className="text-slate-500 text-[10px]">
                      {best ? `Best (${bookLabel(best.book)})` : 'Current'}
                    </div>
                    <div className={`font-mono text-sm font-bold ${best ? style.color : 'text-slate-600'}`}>
                      {best ? fmtOdds(best.odds) : (hasData ? '—' : 'No data')}
                    </div>
                  </div>

                  {/* Value badge */}
                  {best && (
                    <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${style.bg} ${style.color}`}>
                      <style.Icon size={9} /> {style.label}
                    </span>
                  )}

                  {/* Prob delta */}
                  {probDelta != null && (
                    <div className="text-right shrink-0 hidden md:block">
                      <div className="text-slate-500 text-[10px]">Prob Δ</div>
                      <div className={`font-mono text-xs font-bold ${probDelta > 0.005 ? 'text-emerald-400' : probDelta < -0.005 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {probDelta > 0 ? '-' : '+'}{fmtPct(Math.abs(probDelta))}
                      </div>
                    </div>
                  )}

                  {isExp ? <ChevronUp size={13} className="text-slate-500 shrink-0" /> : <ChevronDown size={13} className="text-slate-500 shrink-0" />}
                </button>

                {/* Expanded: all books */}
                {isExp && (
                  <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/40">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                      Current Odds by Book
                    </div>
                    {currentRows.length === 0 ? (
                      <p className="text-slate-600 text-xs">No current odds for this team in the database.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {currentRows
                          .slice()
                          .sort((a, b) => toDecimal(b.odds) - toDecimal(a.odds))
                          .map(row => {
                            const dir = valueDirection(pos.odds, row.odds);
                            const s   = VALUE_STYLE[dir];
                            return (
                              <div
                                key={`${row.book}-${row.odds}`}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 border text-xs ${s.bg}`}
                              >
                                <span className="text-slate-400 font-bold">{bookLabel(row.book)}</span>
                                <span className={`font-mono font-black text-sm ml-2 ${s.color}`}>
                                  {fmtOdds(row.odds)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Prediction Markets (Kalshi / Polymarket) section */}
                    {(() => {
                      const pmContracts = getContractsForTeam(pos.team, pos.type);
                      if (!pmContracts.length) return null;
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <span>📊 Prediction Market Rates (Net Fee-Adjusted)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {pmContracts.slice(0, 3).map((pm) => (
                              <div
                                key={pm.id}
                                className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-emerald-300 uppercase text-[10px] mr-1.5">[{pm.exchange}]</span>
                                  <span className="text-slate-300 text-[11px] truncate max-w-[160px] inline-block align-bottom">{pm.title}</span>
                                </div>
                                <div className="text-right ml-2 shrink-0">
                                  <span className="text-emerald-400 font-mono font-bold text-sm block">
                                    {pm.net_american_odds > 0 ? `+${pm.net_american_odds}` : pm.net_american_odds}
                                  </span>
                                  <span className="text-slate-400 text-[10px] font-mono">{pm.price_cents}¢ ({pm.decimal_odds}x)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Implied prob comparison */}
                    {best && (
                      <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Entry Implied Prob</span>
                          <span className="text-white font-mono">{fmtPct(toImplied(pos.odds))}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Current Best Prob</span>
                          <span className="text-white font-mono">{fmtPct(toImplied(best.odds))}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Prob Change</span>
                          <span className={`font-mono font-bold ${probDelta > 0.005 ? 'text-emerald-400' : probDelta < -0.005 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {probDelta != null
                              ? `${probDelta > 0 ? '−' : '+'}${fmtPct(Math.abs(probDelta))} ${probDelta > 0.005 ? '(less likely → your ticket ↑)' : probDelta < -0.005 ? '(more likely → shorter odds)' : ''}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Snapshot time */}
                    {best?.snapshot_time && (
                      <p className="text-slate-700 text-[10px] mt-2 flex items-center gap-1">
                        <Clock size={9} />
                        Snapshot: {new Date(best.snapshot_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unsupported bet types (Playoffs, Wins O/U) */}
          {unsupported.length > 0 && (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl px-4 py-3">
              <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider mb-2">
                Not yet tracked ({unsupported.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unsupported.map(({ pos }) => (
                  <div key={pos.id} className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-white font-bold">{pos.team}</span>
                    <span className="text-slate-500">{FUTURES_TYPE_LABELS[pos.type] || pos.type}</span>
                    <span className="text-purple-400 font-mono">{fmtOdds(pos.odds)}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-700 text-[10px] mt-2">
                Make Playoffs &amp; Season Wins O/U markets are not available via TheOddsAPI outrights.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
