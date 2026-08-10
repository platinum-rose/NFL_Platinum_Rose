// src/components/dashboard/ExpertLeaderboard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Expert Accuracy Leaderboard — computes live W-L-P stats from localStorage
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Trophy, TrendingUp, TrendingDown, BarChart3, ChevronDown,
  ChevronUp, Clock, CheckCircle, XCircle, MinusCircle, Award,
} from 'lucide-react';
import { loadFromStorage } from '../../lib/storage';
import { computeExpertStandings, getAllExpertPicks, CONSENSUS_KEY } from '../../lib/expertStats';

// ─── helpers ─────────────────────────────────────────────────────────────────

const pct = (v) => v == null ? '—' : `${v.toFixed(1)}%`;
const uFmt = (v) => v == null ? '—' : (v >= 0 ? `+${v.toFixed(2)}u` : `${v.toFixed(2)}u`);

const resultBadge = (result) => {
  switch (result) {
    case 'WIN':     return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">W</span>;
    case 'LOSS':    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20    text-rose-400    border border-rose-500/30"   >L</span>;
    case 'PUSH':    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20  text-slate-400   border border-slate-500/30"  >P</span>;
    default:        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20  text-amber-400   border border-amber-500/30"  >?</span>;
  }
};

const rankColor  = (i) => i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-600';
const winPctColor = (wp) => wp == null ? 'text-slate-500' : wp >= 60 ? 'text-emerald-400' : wp >= 52 ? 'text-[#00d2be]' : wp >= 45 ? 'text-amber-400' : 'text-rose-400';
const roiColor    = (r)  => r  == null ? 'text-slate-500' : r  >= 10 ? 'text-emerald-400' : r  >= 0  ? 'text-[#00d2be]' : 'text-rose-400';

// ─── pick detail row ──────────────────────────────────────────────────────────

function PickDetailRow({ pick }) {
  const isTot  = (pick.pickType || '').toLowerCase().includes('total');
  const gameLabel = [pick.visitor, pick.home].filter(Boolean).join(' @ ') || `Game ${pick.gameId}`;
  const lineStr   = pick.line != null ? ` (${pick.line > 0 ? '+' : ''}${pick.line})` : '';

  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        {resultBadge(pick.result)}
        <span className="text-slate-400 text-xs truncate max-w-[180px]">{gameLabel}</span>
        <span className={`text-xs ${isTot ? 'text-blue-400' : 'text-purple-400'}`}>
          {isTot ? 'Total' : 'Spread'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-white text-xs font-medium">
          {pick.pick}{lineStr}
        </span>
        <span className="text-slate-500 text-xs">{pick.units ?? 1}u</span>
      </div>
    </div>
  );
}

// ─── expert row ───────────────────────────────────────────────────────────────

function ExpertRow({ stat, rank, picks }) {
  const [expanded, setExpanded] = useState(false);

  const hasPending = stat.pending > 0;

  return (
    <>
      <tr
        className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <td className="px-4 py-3 text-center">
          <span className={`font-mono font-bold text-lg ${rankColor(rank)}`}>
            #{rank + 1}
          </span>
        </td>

        {/* Expert name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {rank < 3 && <Award size={14} className={rankColor(rank)} />}
            <span className="text-white font-semibold">{stat.expert}</span>
          </div>
        </td>

        {/* Record */}
        <td className="px-4 py-3 text-center font-mono text-white font-medium">
          {stat.record}
        </td>

        {/* Win% */}
        <td className="px-4 py-3 text-center">
          <span className={`font-mono font-bold ${winPctColor(stat.winPct)}`}>
            {pct(stat.winPct)}
          </span>
        </td>

        {/* Net units */}
        <td className="px-4 py-3 text-center">
          <span className={`font-mono text-sm ${roiColor(stat.units)}`}>
            {uFmt(stat.units)}
          </span>
        </td>

        {/* Spread record */}
        <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">
          {stat.spreadRecord}
        </td>

        {/* Total record */}
        <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">
          {stat.totalRecord}
        </td>

        {/* Pending badge */}
        <td className="px-4 py-3 text-center">
          {hasPending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
              <Clock size={9} /> {stat.pending}
            </span>
          )}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-center text-slate-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {/* Expanded pick list */}
      {expanded && (
        <tr className="bg-slate-900/60">
          <td colSpan={9} className="px-6 py-3">
            {picks.length === 0 ? (
              <p className="text-slate-500 text-sm">No picks recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {picks.map((p, i) => <PickDetailRow key={p.id ?? i} pick={p} />)}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ standings }) {
  const totals = standings.reduce(
    (acc, s) => {
      acc.wins    += s.wins;
      acc.losses  += s.losses;
      acc.pushes  += s.pushes;
      acc.pending += s.pending;
      return acc;
    },
    { wins: 0, losses: 0, pushes: 0, pending: 0 }
  );
  const graded  = totals.wins + totals.losses + totals.pushes;
  const winPct  = graded > 0 ? (totals.wins / (graded - totals.pushes || 1)) * 100 : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total Wins',    value: totals.wins,   color: 'text-emerald-400', icon: CheckCircle },
        { label: 'Total Losses',  value: totals.losses, color: 'text-rose-400',    icon: XCircle    },
        { label: 'Overall Win%',  value: winPct != null ? `${winPct.toFixed(1)}%` : '—', color: winPctColor(winPct), icon: BarChart3 },
        { label: 'Pending Picks', value: totals.pending, color: 'text-amber-400', icon: Clock },
      ].map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center gap-3">
          <Icon size={20} className={color} />
          <div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Trophy size={48} className="text-slate-700 mb-4" />
      <p className="text-slate-400 font-semibold">No expert picks tracked yet.</p>
      <p className="text-slate-600 text-sm mt-2 max-w-sm">
        Upload a podcast transcript via "Analyze Transcript" or add picks manually
        via the Expert Manager — they'll appear here once confirmed.
      </p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ExpertLeaderboard({ expertConsensus, refreshKey }) {
  const [sortField, setSortField] = useState('winPct');
  const [filter,    setFilter]    = useState('all'); // all | graded | pending

  // If caller passes expertConsensus use it; otherwise read from storage directly
  const consensus = expertConsensus ?? loadFromStorage(CONSENSUS_KEY, {});

  const standings = useMemo(
    () => computeExpertStandings(consensus),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consensus, refreshKey]
  );

  // Per-expert pick lookup (for expanded rows), keyed by expert name
  const picksByExpert = useMemo(() => {
    const all = getAllExpertPicks(consensus);
    return all.reduce((acc, p) => {
      if (!acc[p.expert]) acc[p.expert] = [];
      acc[p.expert].push(p);
      return acc;
    }, {});
  }, [consensus, refreshKey]); // eslint-disable-line

  const filtered = standings.filter(s => {
    if (filter === 'graded')  return s.graded  > 0;
    if (filter === 'pending') return s.pending > 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'winPct') {
      if (a.winPct == null && b.winPct == null) return 0;
      if (a.winPct == null) return 1;
      if (b.winPct == null) return -1;
      return b.winPct - a.winPct;
    }
    if (sortField === 'units') return b.units - a.units;
    if (sortField === 'record') return b.graded - a.graded;
    return 0;
  });

  const hasAny = standings.length > 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="p-2 bg-amber-400/10 rounded-lg">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Expert Leaderboard</h2>
            <p className="text-xs text-slate-500">Live accuracy tracking — Season 2026</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-1.5 rounded-lg"
          >
            <option value="all">All Experts</option>
            <option value="graded">With Graded Picks</option>
            <option value="pending">With Pending Picks</option>
          </select>
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-1.5 rounded-lg"
          >
            <option value="winPct">Sort: Win%</option>
            <option value="units">Sort: Units</option>
            <option value="record">Sort: Most Picks</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
      {hasAny && <SummaryBar standings={standings} />}

      {/* Leaderboard table */}
      {!hasAny ? (
        <EmptyState />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3 text-left">Expert</th>
                  <th className="px-4 py-3 text-center">Record</th>
                  <th className="px-4 py-3 text-center">Win%</th>
                  <th className="px-4 py-3 text-center">Units</th>
                  <th className="px-4 py-3 text-center">Spread</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Pending</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No experts match the current filter.
                    </td>
                  </tr>
                ) : (
                  sorted.map((stat, i) => (
                    <ExpertRow
                      key={stat.expert}
                      stat={stat}
                      rank={i}
                      picks={(picksByExpert[stat.expert] || []).sort((a, b) => {
                        // Pending first, then by added date
                        if (a.result === 'PENDING' && b.result !== 'PENDING') return -1;
                        if (b.result === 'PENDING' && a.result !== 'PENDING') return 1;
                        return new Date(b.addedAt ?? 0) - new Date(a.addedAt ?? 0);
                      })}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
