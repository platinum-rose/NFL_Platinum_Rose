// src/components/analytics/OutcomesDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Unified bet outcome tracking — merges nfl_bankroll_data_v1 + pr_picks_v1.
// Features:
//   • Summary stats strip (W-L-P, win%, bankroll $, AI units)
//   • Dual cumulative P&L chart (recharts, dollars + units)
//   • Filterable / sortable outcome history table
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Filter, RefreshCw,
  DollarSign, Zap, Target, Clock, CheckCircle, XCircle, Award
} from 'lucide-react';
import { mergeOutcomes, calcOutcomeStats, buildCumulativeSeries } from '../../lib/outcomesMerger';

// ── Constants ─────────────────────────────────────────────────

const SOURCES  = ['all', 'bankroll', 'ai_picks'];
const RESULTS  = ['all', 'WIN', 'LOSS', 'PUSH', 'PENDING'];
const BET_TYPES = ['all', 'spread', 'total', 'moneyline', 'parlay', 'prop', 'futures'];

const SOURCE_LABEL = { bankroll: 'Bankroll', ai_picks: 'AI Lab', all: 'All Sources' };
const TYPE_LABELS  = { all: 'All Types', spread: 'Spread', total: 'Total', moneyline: 'ML', parlay: 'Parlay', prop: 'Prop', futures: 'Futures' };

// ── Helpers ───────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return '—'; }
};

const fmtDateShort = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const fmtDollars = (n) => {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
};

const fmtUnits = (n) => {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}u`;
};

const resultBadge = (result) => {
  const map = {
    WIN:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    LOSS:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
    PUSH:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PENDING: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
  };
  return map[result] || map.PENDING;
};

const sourcePill = (source) => {
  if (source === 'bankroll') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (source === 'ai_picks') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
};

const typePill = (type) => {
  const map = {
    spread:    'text-cyan-400',
    total:     'text-violet-400',
    moneyline: 'text-amber-400',
    parlay:    'text-pink-400',
    prop:      'text-teal-400',
    futures:   'text-orange-400',
  };
  return map[type] || 'text-slate-400';
};

const positiveClass = (n) => (n === null ? '' : n >= 0 ? 'text-emerald-400' : 'text-rose-400');

// ── Chart tooltip ─────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label: _label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl max-w-xs">
      <p className="text-slate-400 mb-2">{fmtDateShort(d.date)}</p>
      {d.label && <p className="text-white font-medium mb-1 truncate">{d.label}</p>}
      {d.source && (
        <p className={`text-xs mb-2 ${d.source === 'bankroll' ? 'text-blue-300' : 'text-indigo-300'}`}>
          {SOURCE_LABEL[d.source]}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={positiveClass(p.value)}>{p.dataKey === 'dollars' ? `$${p.value?.toFixed(2)}` : `${p.value?.toFixed(3)}u`}</span>
        </div>
      ))}
    </div>
  );
};

// ── StatCard ──────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, positive }) {
  const colorClass =
    positive === true  ? 'text-emerald-400' :
    positive === false ? 'text-rose-400' :
    positive === null  ? 'text-slate-400' :
    'text-white';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="p-2 rounded-lg bg-slate-800/60">
        <Icon size={18} className="text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-lg font-bold leading-tight ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────

function FilterBar({ source, setSource, resultFilter, setResultFilter, typeFilter, setTypeFilter }) {
  const btnBase = 'px-3 py-1 text-xs rounded-full border transition-colors';
  const active  = 'bg-[#00d2be]/20 border-[#00d2be]/50 text-[#00d2be]';
  const inactive = 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Filter size={14} className="text-slate-500 mr-1 shrink-0" />

      {/* Source */}
      <div className="flex gap-1">
        {SOURCES.map(s => (
          <button key={s} className={`${btnBase} ${source === s ? active : inactive}`} onClick={() => setSource(s)}>
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>

      <span className="text-slate-700">|</span>

      {/* Result */}
      <div className="flex gap-1">
        {RESULTS.map(r => (
          <button key={r} className={`${btnBase} ${resultFilter === r ? active : inactive}`} onClick={() => setResultFilter(r)}>
            {r === 'all' ? 'All Results' : r}
          </button>
        ))}
      </div>

      <span className="text-slate-700">|</span>

      {/* Type */}
      <div className="flex gap-1">
        {BET_TYPES.map(t => (
          <button key={t} className={`${btnBase} ${typeFilter === t ? active : inactive}`} onClick={() => setTypeFilter(t)}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Outcome Row ───────────────────────────────────────────────

function OutcomeRow({ o }) {
  const pnl   = o.source === 'bankroll' ? o.profit : null;
  const units = o.source === 'ai_picks'  ? o.units  : null;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
      {/* Date */}
      <td className="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(o.date)}</td>

      {/* Source */}
      <td className="py-2.5 px-3">
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${sourcePill(o.source)}`}>
          {o.source === 'bankroll' ? 'BRL' : 'AI'}
        </span>
      </td>

      {/* Type */}
      <td className="py-2.5 px-3">
        <span className={`text-xs font-mono uppercase ${typePill(o.type)}`}>{o.type}</span>
      </td>

      {/* Description */}
      <td className="py-2.5 px-3 text-sm text-white max-w-xs">
        <span className="truncate block">{o.description}</span>
        {o.confidence !== null && (
          <span className="text-xs text-slate-500 mt-0.5 block">Conf {o.confidence}% • Edge {o.edge?.toFixed(1) ?? '—'}</span>
        )}
      </td>

      {/* Line / odds */}
      <td className="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap font-mono">
        {o.line !== null ? (o.line > 0 ? `+${o.line}` : o.line) : '—'}
      </td>

      {/* Result */}
      <td className="py-2.5 px-3">
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${resultBadge(o.result)}`}>
          {o.result}
        </span>
      </td>

      {/* P&L */}
      <td className={`py-2.5 px-3 text-sm font-mono text-right ${positiveClass(pnl ?? units)}`}>
        {pnl !== null ? fmtDollars(pnl) : units !== null ? fmtUnits(units) : '—'}
      </td>

      {/* Stake */}
      <td className="py-2.5 px-3 text-xs text-slate-400 font-mono text-right">
        {o.amount !== null ? `$${o.amount.toFixed(2)}` : '—'}
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────

export default function OutcomesDashboard() {
  const [source,       setSource]       = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [chartMode,    setChartMode]    = useState('both'); // 'both' | 'dollars' | 'units'

  // Raw merged outcomes — re-computed on refresh
  const allOutcomes = useMemo(() => mergeOutcomes(), [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered outcomes for the table
  const filtered = useMemo(() => {
    let r = allOutcomes;
    if (source !== 'all')       r = r.filter(o => o.source === source);
    if (resultFilter !== 'all') r = r.filter(o => o.result === resultFilter);
    if (typeFilter !== 'all')   r = r.filter(o => o.type === typeFilter);
    return r;
  }, [allOutcomes, source, resultFilter, typeFilter]);

  // Stats from the full (unfiltered) set
  const stats  = useMemo(() => calcOutcomeStats(allOutcomes), [allOutcomes]);
  // Chart series from the full set
  const series = useMemo(() => buildCumulativeSeries(allOutcomes), [allOutcomes]);

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const hasDollars = stats.totalWagered > 0  || stats.bankrollCount > 0;
  const hasUnits   = stats.picksCount > 0;
  const isEmpty    = allOutcomes.length === 0;

  // ── Color helpers for chart ──────────────────────────────
  const showDollars = chartMode !== 'units' && hasDollars;
  const showUnits   = chartMode !== 'dollars' && hasUnits;

  // ── Empty state ──────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="text-center py-20">
        <Target size={48} className="mx-auto mb-4 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-400 mb-2">No Outcomes Yet</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Add bankroll bets in the Bankroll tab or run AI simulations in Dev Lab to start tracking outcomes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Outcome Tracker</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Bankroll bets + AI picks · {stats.settled} settled · {stats.pending} pending
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-slate-700 rounded-lg
                     text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Stats strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={CheckCircle} label="Wins"     value={stats.wins}      positive={true}  />
        <StatCard icon={XCircle}     label="Losses"   value={stats.losses}    positive={false} />
        <StatCard icon={Minus}       label="Pushes"   value={stats.pushes}    positive={null}  />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={stats.settled > 0 ? `${stats.winRate.toFixed(1)}%` : '—'}
          sub={`${stats.settled} settled`}
          positive={stats.winRate > 52.4 ? true : stats.winRate > 0 ? null : null}
        />
        {hasDollars && (
          <StatCard
            icon={DollarSign}
            label="Bankroll P&L"
            value={`${stats.totalDollars >= 0 ? '+' : ''}$${Math.abs(stats.totalDollars).toFixed(2)}`}
            sub={`ROI ${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
            positive={stats.totalDollars >= 0}
          />
        )}
        {hasUnits && (
          <StatCard
            icon={Zap}
            label="AI Units"
            value={`${stats.totalUnits >= 0 ? '+' : ''}${stats.totalUnits.toFixed(2)}u`}
            sub={`${stats.picksCount} picks`}
            positive={stats.totalUnits >= 0}
          />
        )}
      </div>

      {/* ── Cumulative P&L chart ────────────────────────────── */}
      {series.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Cumulative P&amp;L</h3>
            <div className="flex gap-1">
              {['both', 'dollars', 'units'].map(m => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    chartMode === m
                      ? 'bg-[#00d2be]/20 border-[#00d2be]/50 text-[#00d2be]'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {m === 'both' ? 'Both' : m === 'dollars' ? '$ Bankroll' : 'AI Units'}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gDollars" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDateShort}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              {showDollars && (
                <YAxis
                  yAxisId="dollars"
                  orientation="left"
                  tickFormatter={v => `$${v}`}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
              )}
              {showUnits && (
                <YAxis
                  yAxisId="units"
                  orientation={showDollars ? 'right' : 'left'}
                  tickFormatter={v => `${v}u`}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
              )}
              <RechartsTip content={<ChartTooltip />} />
              <ReferenceLine y={0} yAxisId={showDollars ? 'dollars' : 'units'} stroke="#334155" strokeDasharray="4 4" />
              <Legend
                formatter={v => v === 'dollars' ? 'Bankroll $' : 'AI Units'}
                wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
              />
              {showDollars && (
                <Area
                  yAxisId="dollars"
                  type="monotone"
                  dataKey="dollars"
                  name="dollars"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gDollars)"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#3b82f6', fill: '#0f172a' }}
                />
              )}
              {showUnits && (
                <Area
                  yAxisId="units"
                  type="monotone"
                  dataKey="units"
                  name="units"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#gUnits)"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#a78bfa', fill: '#0f172a' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Source comparison blocks ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasDollars && (
          <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={15} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Bankroll Bets</h3>
              <span className="ml-auto text-xs text-slate-500">{stats.bankrollCount} total</span>
            </div>
            {(() => {
              const br = calcOutcomeStats(allOutcomes.filter(o => o.source === 'bankroll'));
              return (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-slate-500">W-L-P</p>
                    <p className="text-sm font-bold text-white">{br.wins}-{br.losses}-{br.pushes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Win %</p>
                    <p className={`text-sm font-bold ${br.winRate >= 52.4 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {br.settled > 0 ? `${br.winRate.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">P&L</p>
                    <p className={`text-sm font-bold ${br.totalDollars >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {br.totalWagered > 0 ? fmtDollars(br.totalDollars) : '—'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {hasUnits && (
          <div className="bg-slate-900 border border-indigo-900/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">AI Dev Lab Picks</h3>
              <span className="ml-auto text-xs text-slate-500">{stats.picksCount} total</span>
            </div>
            {(() => {
              const ap = calcOutcomeStats(allOutcomes.filter(o => o.source === 'ai_picks'));
              return (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-slate-500">W-L-P</p>
                    <p className="text-sm font-bold text-white">{ap.wins}-{ap.losses}-{ap.pushes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Win %</p>
                    <p className={`text-sm font-bold ${ap.winRate >= 52.4 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ap.settled > 0 ? `${ap.winRate.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Units</p>
                    <p className={`text-sm font-bold ${ap.totalUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ap.picksCount > 0 ? fmtUnits(ap.totalUnits) : '—'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Filters + table ─────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-sm font-semibold text-white shrink-0">Outcome History</h3>
          <span className="text-xs text-slate-500">{filtered.length} records</span>
        </div>

        <div className="px-4 py-3 border-b border-slate-800/60">
          <FilterBar
            source={source}         setSource={setSource}
            resultFilter={resultFilter} setResultFilter={setResultFilter}
            typeFilter={typeFilter}  setTypeFilter={setTypeFilter}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-600">
            <Filter size={32} className="mx-auto mb-3 opacity-40" />
            <p>No outcomes match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="py-2 px-3 text-left font-medium">Date</th>
                  <th className="py-2 px-3 text-left font-medium">Src</th>
                  <th className="py-2 px-3 text-left font-medium">Type</th>
                  <th className="py-2 px-3 text-left font-medium">Description</th>
                  <th className="py-2 px-3 text-left font-medium">Line</th>
                  <th className="py-2 px-3 text-left font-medium">Result</th>
                  <th className="py-2 px-3 text-right font-medium">P&amp;L</th>
                  <th className="py-2 px-3 text-right font-medium">Stake</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => <OutcomeRow key={o.id} o={o} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
