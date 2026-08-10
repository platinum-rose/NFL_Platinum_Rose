// src/components/analytics/BookAnalytics.jsx
// ROI and win/loss breakdown per sportsbook

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  ReferenceLine, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { BookOpen, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from './analyticsFormatters';

// ── Helpers ───────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'profit', label: 'Profit' },
  { key: 'roi',    label: 'ROI %' },
  { key: 'bets',   label: 'Volume' },
  { key: 'winRate',label: 'Win %' },
];

const profitColor = (val) => (val >= 0 ? '#10b981' : '#f43f5e');

// ── Chart tooltip ─────────────────────────────────────────────

const BookTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-2">{d.book}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">W-L-P</span>
          <span className="text-white font-mono">{d.wins}-{d.losses}-{d.pushes}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Win Rate</span>
          <span className={d.winRate >= 52.4 ? 'text-emerald-400' : 'text-rose-400'}>
            {d.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Wagered</span>
          <span className="text-white">{formatCurrency(d.wagered)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Profit</span>
          <span style={{ color: profitColor(d.profit) }}>{formatCurrency(d.profit)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">ROI</span>
          <span style={{ color: profitColor(d.roi) }}>{d.roi.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// ── Mini bar: visual win-rate segment ─────────────────────────

function MiniWinBar({ wins, losses, pushes }) {
  const total = wins + losses + pushes;
  if (total === 0) return <div className="w-full h-1.5 bg-slate-700 rounded-full" />;
  const winPct   = (wins   / total) * 100;
  const lossPct  = (losses / total) * 100;
  const pushPct  = 100 - winPct - lossPct;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-px bg-slate-700">
      <div className="bg-emerald-500 h-full" style={{ width: `${winPct}%` }} />
      <div className="bg-amber-500 h-full"   style={{ width: `${pushPct}%` }} />
      <div className="bg-rose-500 h-full"    style={{ width: `${lossPct}%` }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function BookAnalytics({ bookAnalytics }) {
  const [sortKey, setSortKey] = useState('profit');

  if (!bookAnalytics || bookAnalytics.length === 0) return null;

  // Known books get no data = nothing to show. Require at least 1 bet.
  const books = [...bookAnalytics]
    .filter(b => b.bets > 0)
    .sort((a, b) => {
      if (sortKey === 'bets' || sortKey === 'winRate') return b[sortKey] - a[sortKey];
      return b[sortKey] - a[sortKey]; // profit / roi also desc
    });

  if (books.length === 0) return null;

  // Chart data — sorted by the selected key
  const chartData = books.map(b => ({
    ...b,
    // Bar value is roi for 'roi' sort, else profit
    chartValue: sortKey === 'roi' ? b.roi : b.profit,
  }));

  const chartLabel = sortKey === 'roi' ? 'ROI %' : 'Profit ($)';
  const yFmt = sortKey === 'roi'
    ? v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`
    : v => `$${v >= 0 ? '' : '-'}${Math.abs(v)}`;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-teal-400" />
          <h2 className="text-xl font-bold text-white">Performance by Sportsbook</h2>
        </div>
        {/* Sort picker */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={13} className="text-slate-500" />
          <span className="text-xs text-slate-500 mr-1">Sort by</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  sortKey === opt.key
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="book"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFmt}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <RechartsTip content={<BookTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
            <Bar dataKey="chartValue" radius={[4, 4, 0, 0]} maxBarSize={48} name={chartLabel}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={profitColor(entry.chartValue)} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="chartValue"
                position="top"
                formatter={v => sortKey === 'roi' ? `${v >= 0 ? '+' : ''}${v.toFixed(0)}%` : `${v >= 0 ? '+' : '-'}$${Math.abs(v)}`}
                style={{ fill: '#94a3b8', fontSize: 9 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase tracking-wide">
                <th className="py-2 px-2 text-left font-medium">Book</th>
                <th className="py-2 px-2 text-center font-medium">Bets</th>
                <th className="py-2 px-2 text-center font-medium">W-L-P</th>
                <th className="py-2 px-2 text-center font-medium">Win %</th>
                <th className="py-2 px-2 text-right font-medium">Wagered</th>
                <th className="py-2 px-2 text-right font-medium">Profit</th>
                <th className="py-2 px-2 text-right font-medium">ROI</th>
                <th className="py-2 px-2 text-left font-medium w-28">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const winRateClass = b.winRate >= 52.4
                  ? 'text-emerald-400'
                  : b.winRate >= 45
                    ? 'text-amber-400'
                    : 'text-rose-400';
                return (
                  <tr key={b.book} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-white text-sm">{b.book}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300 text-sm">{b.bets}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300 font-mono text-sm">
                      {b.wins}-{b.losses}-{b.pushes}
                    </td>
                    <td className={`py-2.5 px-2 text-center font-medium text-sm ${winRateClass}`}>
                      {(b.wins + b.losses) > 0 ? `${b.winRate.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300 font-mono text-sm">
                      {formatCurrency(b.wagered)}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-medium text-sm`}
                        style={{ color: profitColor(b.profit) }}>
                      {formatCurrency(b.profit)}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-medium text-sm`}
                        style={{ color: profitColor(b.roi) }}>
                      {b.roi >= 0 ? '+' : ''}{b.roi.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2">
                      <MiniWinBar wins={b.wins} losses={b.losses} pushes={b.pushes} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            {books.length > 1 && (() => {
              const totalBets    = books.reduce((s, b) => s + b.bets,    0);
              const totalWins    = books.reduce((s, b) => s + b.wins,    0);
              const totalLosses  = books.reduce((s, b) => s + b.losses,  0);
              const totalPushes  = books.reduce((s, b) => s + b.pushes,  0);
              const totalWagered = books.reduce((s, b) => s + b.wagered, 0);
              const totalProfit  = books.reduce((s, b) => s + b.profit,  0);
              const totalROI     = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
              const totalWR      = (totalWins + totalLosses) > 0
                ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
              return (
                <tfoot>
                  <tr className="border-t border-slate-600 text-xs text-slate-400">
                    <td className="py-2 px-2 font-semibold text-slate-300">Total</td>
                    <td className="py-2 px-2 text-center">{totalBets}</td>
                    <td className="py-2 px-2 text-center font-mono">{totalWins}-{totalLosses}-{totalPushes}</td>
                    <td className={`py-2 px-2 text-center font-medium ${totalWR >= 52.4 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalWR.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{formatCurrency(totalWagered)}</td>
                    <td className={`py-2 px-2 text-right font-mono font-medium`}
                        style={{ color: profitColor(totalProfit) }}>
                      {formatCurrency(totalProfit)}
                    </td>
                    <td className={`py-2 px-2 text-right font-mono font-medium`}
                        style={{ color: profitColor(totalROI) }}>
                      {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2">
                      <MiniWinBar wins={totalWins} losses={totalLosses} pushes={totalPushes} />
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>

        {/* Beat-the-close note — placeholder until closing-line data is available */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-4 py-3 text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Beat-the-close analysis</span> — Coming once closing-line data
          is collected from Supabase snapshots. Shop the book with the highest ROI above for future bets.
        </div>
      </div>
    </div>
  );
}
