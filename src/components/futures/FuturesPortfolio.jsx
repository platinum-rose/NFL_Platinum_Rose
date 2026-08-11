// src/components/futures/FuturesPortfolio.jsx
// Main Futures Portfolio tab — summary cards, position table, sub-tabs
import React, { useState, useCallback, useMemo } from 'react';
import {
  Briefcase, Plus, TrendingUp, TrendingDown, DollarSign, Target,
  Shield, Trash2, Edit3, ChevronDown, ChevronUp, AlertTriangle,
  BarChart3, Layers, Trophy, Award, Calculator, Activity, GitMerge, Bell
} from 'lucide-react';
import HedgeCalculator from './HedgeCalculator';
import FuturesOddsMonitor from './FuturesOddsMonitor';
import FuturesMarketBrowser from './FuturesMarketBrowser';
import FuturesWatchList from './FuturesWatchList';
import ParlayTracker from './ParlayTracker';
import PlayoffBracket from './PlayoffBracket';
import {
  getPositions, getPortfolioSummary, getExposureByTeam,
  deletePosition, updatePosition,
  FUTURES_TYPE_LABELS, POSITION_STATUS, FUTURES_TYPES,
  calcProfit
} from '../../lib/futures';
import { TEAM_LOGOS } from '../../lib/teams';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) => n?.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) ?? '—';
const fmtUSD = (n) => `$${fmt(Math.abs(n))}`;
const fmtOdds = (o) => (o >= 0 ? `+${o}` : `${o}`);
const statusColor = {
  OPEN: 'text-cyan-400',
  WON: 'text-emerald-400',
  LOST: 'text-rose-400',
  HEDGED: 'text-amber-400',
  VOID: 'text-slate-500',
};
const statusBg = {
  OPEN: 'bg-cyan-500/10 border-cyan-500/30',
  WON: 'bg-emerald-500/10 border-emerald-500/30',
  LOST: 'bg-rose-500/10 border-rose-500/30',
  HEDGED: 'bg-amber-500/10 border-amber-500/30',
  VOID: 'bg-slate-500/10 border-slate-500/30',
};

// ── Sub-tab enum ─────────────────────────────────────────────────────────────
const SUBTABS = [
  { id: 'positions', label: 'Positions',       icon: Layers },
  { id: 'market',    label: 'Market',          icon: Trophy },
  { id: 'watchlist', label: 'Watch List',      icon: Bell },
  { id: 'exposure',  label: 'Exposure',        icon: BarChart3 },
  { id: 'hedge',     label: 'Hedge Calc',      icon: Calculator },
  { id: 'monitor',   label: 'Odds Monitor',    icon: Activity },
  { id: 'parlays',   label: 'Parlays',         icon: GitMerge },
  { id: 'bracket',   label: 'Playoff Bracket', icon: Award },
];

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function FuturesPortfolio({ onAddPosition }) {
  const [subTab, setSubTab]       = useState('positions');
  const [refreshKey, setRefresh]  = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Parlay → Hedge calc prefill state
  const [hedgePrefill, setHedgePrefill] = useState(null);

  const handleHedgeParlay = useCallback((parlayData) => {
    setHedgePrefill(parlayData);
    setSubTab('hedge');
  }, []);

  // Force re-read from localStorage. refreshKey isn't read in any of these
  // three bodies -- it exists purely to force recompute after refresh() fires.
  /* eslint-disable react-hooks/exhaustive-deps */
  const positions = useMemo(() => getPositions(), [refreshKey]);
  const summary   = useMemo(() => getPortfolioSummary(), [refreshKey]);
  const exposure  = useMemo(() => getExposureByTeam(), [refreshKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const refresh = useCallback(() => setRefresh(k => k + 1), []);

  const handleDelete = useCallback((id) => {
    deletePosition(id);
    setConfirmDelete(null);
    refresh();
  }, [refresh]);

  const handleStatusChange = useCallback((id, newStatus) => {
    updatePosition(id, { status: newStatus });
    refresh();
  }, [refresh]);

  // Apply filters
  const filtered = useMemo(() => {
    let list = positions;
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    return list;
  }, [positions, typeFilter, statusFilter]);

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Briefcase size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-tight leading-none">Futures Portfolio</h2>
            <p className="text-slate-500 text-xs mt-0.5">Track positions · Monitor odds · Build hedge strategies</p>
          </div>
        </div>
        <button
          onClick={onAddPosition}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/30"
        >
          <Plus size={14} /> Add Position
        </button>
      </div>

      {/* Summary */}
      <SummaryCards summary={summary} />

      {/* Parlay quick stats (when parlays exist) */}
      {(summary.liveParlays > 0) && (
        <div className="flex items-center gap-4 bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-2.5">
          <GitMerge size={14} className="text-purple-400 shrink-0" />
          <span className="text-purple-300 font-bold text-sm">{summary.liveParlays} live parlay{summary.liveParlays > 1 ? 's' : ''}</span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-slate-400 text-xs">{fmtUSD(summary.parlayExposure)} staked</span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-emerald-400 text-xs font-mono">{fmtUSD(summary.parlayMaxPayout)} max payout</span>
          <button
            onClick={() => setSubTab('parlays')}
            className="ml-auto text-xs text-purple-400 hover:text-purple-300 font-bold transition"
          >
            View Parlays →
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
        {SUBTABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all
              ${subTab === tab.id
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'positions' && (
        <PositionsView
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filtered={filtered}
          onAddPosition={onAddPosition}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          handleDelete={handleDelete}
          handleStatusChange={handleStatusChange}
        />
      )}
      {subTab === 'market'    && <FuturesMarketBrowser />}
      {subTab === 'watchlist' && <FuturesWatchList />}
      {subTab === 'exposure'  && <ExposureView exposure={exposure} onAddPosition={onAddPosition} />}
      {subTab === 'hedge'     && (
        <HedgeCalculator
          onRefresh={refresh}
          prefill={hedgePrefill}
        />
      )}
      {subTab === 'monitor'   && <FuturesOddsMonitor />}
      {subTab === 'parlays'   && (
        <ParlayTracker onSendToHedge={handleHedgeParlay} />
      )}
      {subTab === 'bracket'   && <PlayoffBracket />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <SumCard label="Open Positions" value={summary.openPositions} icon={Layers} color="cyan" />
      <SumCard label="Total Invested" value={fmtUSD(summary.totalInvested)} icon={DollarSign} color="blue" />
      <SumCard label="Max Payout" value={fmtUSD(summary.maxPayout)} icon={TrendingUp} color="emerald" />
      <SumCard label="Hedge Exposure" value={fmtUSD(summary.hedgeStakes)} icon={Shield} color="amber" />
      <SumCard
        label="Settled P&L"
        value={`${summary.settledProfit >= 0 ? '+' : '-'}${fmtUSD(summary.settledProfit)}`}
        icon={summary.settledProfit >= 0 ? TrendingUp : TrendingDown}
        color={summary.settledProfit >= 0 ? 'emerald' : 'rose'}
      />
    </div>
  );
}

function PositionsView({
  typeFilter, setTypeFilter, statusFilter, setStatusFilter, filtered,
  onAddPosition, expandedId, setExpandedId, confirmDelete, setConfirmDelete,
  handleDelete, handleStatusChange,
}) {
  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">Type</span>
        <Chip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</Chip>
        {Object.entries(FUTURES_TYPE_LABELS).map(([val, label]) => (
          <Chip key={val} active={typeFilter === val} onClick={() => setTypeFilter(val)}>{label}</Chip>
        ))}
        <div className="h-4 w-px bg-slate-700 mx-2" />
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">Status</span>
        <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</Chip>
        {Object.values(POSITION_STATUS).map(s => (
          <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</Chip>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={onAddPosition} />
      ) : (
        <div className="space-y-2">
          {filtered.map(pos => (
            <PositionRow
              key={pos.id}
              pos={pos}
              expanded={expandedId === pos.id}
              onToggle={() => setExpandedId(expandedId === pos.id ? null : pos.id)}
              onDelete={() => setConfirmDelete(pos.id)}
              onStatusChange={(s) => handleStatusChange(pos.id, s)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-rose-400" size={20} />
              <h3 className="text-white font-bold">Delete Position?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">This cannot be undone. All linked hedges will also be removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExposureView({ exposure, onAddPosition }) {
  return (
    <div className="space-y-2">
      {exposure.length === 0 ? (
        <EmptyState onAdd={onAddPosition} />
      ) : (
        exposure.map(entry => (
          <div key={entry.team} className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">
            <img
              src={TEAM_LOGOS[entry.team] || TEAM_LOGOS[entry.team?.split(' ').pop()] || ''}
              alt=""
              className="w-8 h-8 object-contain"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm truncate">{entry.team}</div>
              <div className="text-slate-500 text-xs">{entry.positions.length} position{entry.positions.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs">Stake</div>
              <div className="text-white font-mono text-sm">{fmtUSD(entry.totalStake)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs">Potential</div>
              <div className="text-emerald-400 font-mono text-sm font-bold">{fmtUSD(entry.totalPayout)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs">ROI</div>
              <div className="text-cyan-400 font-mono text-sm">
                {entry.totalStake > 0 ? `${fmt(((entry.totalPayout - entry.totalStake) / entry.totalStake) * 100)}%` : '—'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SumCard({ label, value, icon: Icon, color }) {
  const ring   = { cyan: 'border-cyan-500/20', blue: 'border-blue-500/20', emerald: 'border-emerald-500/20', amber: 'border-amber-500/20', rose: 'border-rose-500/20' }[color] || 'border-slate-700';
  const iconCl = { cyan: 'text-cyan-400', blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400' }[color] || 'text-slate-400';
  return (
    <div className={`bg-slate-900/50 border ${ring} rounded-xl px-4 py-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className={iconCl} />
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{label}</span>
      </div>
      <div className="text-white font-black text-xl">{value}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all
        ${active
          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
          : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
        }`}
    >
      {children}
    </button>
  );
}

function PositionRow({ pos, expanded, onToggle, onDelete, onStatusChange }) {
  const profit = calcProfit(pos.stake, pos.odds);
  const hedgeCount = (pos.hedges || []).length;
  const typeLabel  = FUTURES_TYPE_LABELS[pos.type] || pos.type;
  const logo       = TEAM_LOGOS[pos.team] || TEAM_LOGOS[pos.team?.split(' ').pop()] || '';

  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all ${expanded ? 'ring-1 ring-purple-500/30' : ''}`}>
      {/* Main row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition">
        <img src={logo} alt="" className="w-7 h-7 object-contain shrink-0" onError={e => { e.target.style.display = 'none'; }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm truncate">{pos.team}</span>
            {pos.team2 && <span className="text-slate-500 text-xs">vs {pos.team2}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{typeLabel}</span>
            {pos.selection && <span className="text-slate-500 text-xs">{pos.selection}{pos.line != null ? ` ${pos.line}` : ''}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-xs">Odds</div>
          <div className="text-white font-mono text-sm font-bold">{fmtOdds(pos.odds)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-xs">Stake</div>
          <div className="text-white font-mono text-sm">{fmtUSD(pos.stake)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-xs">To Win</div>
          <div className="text-emerald-400 font-mono text-sm font-bold">{fmtUSD(profit)}</div>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusBg[pos.status]} ${statusColor[pos.status]}`}>
          {pos.status}
        </span>
        {hedgeCount > 0 && (
          <span className="text-amber-400 text-xs font-bold flex items-center gap-0.5"><Shield size={11} />{hedgeCount}</span>
        )}
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/50 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Detail label="Book" value={pos.book || '—'} />
            <Detail label="Implied Prob" value={`${(pos.impliedProb * 100).toFixed(1)}%`} />
            <Detail label="Potential Payout" value={fmtUSD(pos.potentialPayout)} />
            <Detail label="Added" value={new Date(pos.createdAt).toLocaleDateString()} />
          </div>
          {pos.notes && <p className="text-slate-500 text-xs italic">{pos.notes}</p>}

          {/* Hedges */}
          {hedgeCount > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400/70 tracking-wider">Linked Hedges</span>
              {pos.hedges.map(h => (
                <div key={h.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                  <Shield size={11} className="text-amber-400 shrink-0" />
                  <span className="text-white font-bold">{h.team}</span>
                  <span className="text-slate-500">{fmtOdds(h.odds)}</span>
                  <span className="text-slate-400">{fmtUSD(h.stake)}</span>
                  <span className="text-emerald-400 font-mono">{fmtUSD(h.potentialPayout)}</span>
                  <span className={`ml-auto text-[9px] uppercase font-bold ${h.status === 'PLACED' ? 'text-cyan-400' : 'text-slate-500'}`}>{h.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <select
              value={pos.status}
              onChange={e => onStatusChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
            >
              {Object.values(POSITION_STATUS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-400 text-xs font-bold hover:bg-rose-600/20 transition"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{label}</span>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
      <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
      <h3 className="text-slate-400 font-bold text-lg mb-1">No Futures Positions</h3>
      <p className="text-slate-600 text-sm mb-4">Start building your portfolio by adding a position.</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-900/30"
      >
        <Plus size={14} /> Add First Position
      </button>
    </div>
  );
}
