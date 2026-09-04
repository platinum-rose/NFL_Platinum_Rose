// src/components/survivor/SurvivorPathOptimizer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Survivor Season-Long Path & Future Value Optimizer View
//
// Calculates and showcases the Top 3 algorithmic survival routes:
// 1. Max EV Path (Highest Joint Survival Probability)
// 2. Contrarian Game-Theory Path (Late-season leverage & scarcity preservation)
// 3. Conservative High-Floor Path (Highest immediate week-by-week safety)
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react';
import { formatDeadline } from '../../lib/alphaDeadlines.js';

export default function SurvivorPathOptimizer({
  paths = [],
  grid,
  onApplyPath,
  currentPicks = {},
}) {
  if (!paths || paths.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 font-mono">
        Computing survival routes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-900/40 rounded-xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} /> Season-Long Algorithmic Pathfinder
          </div>
          <h2 className="text-white font-black text-xl md:text-2xl mt-1">
            Survivor Route Optimizers
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl font-sans leading-relaxed">
            Every route strictly enforces the <strong className="text-slate-200">"No Team Reuse"</strong> rule across 18 weeks while optimizing between maximum win probabilities and preserving scarce cornerstone teams for late-season bottlenecks.
          </p>
        </div>
      </div>

      {/* Path Recommendation Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {paths.map((route) => {
          const sim = route.simulation;
          const isCurrentlyActive =
            Object.keys(route.picks).length === Object.keys(currentPicks).length &&
            Object.keys(route.picks).every((w) => route.picks[w] === currentPicks[w]);

          return (
            <div
              key={route.id}
              className={`bg-slate-950 border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xl ${
                isCurrentlyActive
                  ? 'border-amber-500/80 shadow-amber-900/20 ring-1 ring-amber-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Top */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${route.badgeColor}`}
                  >
                    {route.badge}
                  </span>
                  {isCurrentlyActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      <CheckCircle size={11} /> Active in Card
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-white font-black text-lg">{route.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed font-sans">
                    {route.description}
                  </p>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
                      18-Wk Survival Prob
                    </div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">
                      {sim.survivalProbPct}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">
                      Weeks Covered
                    </div>
                    <div className="text-xl font-black text-white mt-0.5">
                      {sim.weeksCovered} / 18
                    </div>
                  </div>
                </div>

                {/* Bottleneck Alert */}
                {sim.bottleneck && (
                  <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                    <ShieldAlert size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-300">
                        Bottleneck: Week {sim.bottleneck.week} ({sim.bottleneck.team} vs {sim.bottleneck.opponent})
                      </span>
                      <span className="text-slate-400 block text-[10px] font-mono mt-0.5">
                        Lowest win prob in route: {(sim.bottleneck.winProb * 100).toFixed(1)}% (Spread: {sim.bottleneck.spread > 0 ? '+' : ''}{sim.bottleneck.spread})
                      </span>
                    </div>
                  </div>
                )}

                {/* Pick Ribbon Preview (Weeks 1 to 18) */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                    <span>18-Week Pick Sequence</span>
                    <span className="font-mono text-slate-400">Weeks 1–18</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 font-mono text-[10px]">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => {
                      const team = route.picks[w];
                      const cell = grid?.teams?.[team]?.weeks[w];
                      const isHighFav = cell && cell.winProb >= 0.75;
                      return (
                        <div
                          key={w}
                          title={`Week ${w}: ${team} ${cell?.isHome ? 'vs' : '@'} ${cell?.opponent} (${(cell?.winProb * 100 || 0).toFixed(0)}%)`}
                          className={`p-1 rounded text-center border ${
                            isHighFav
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="text-[8px] text-slate-500">W{w}</div>
                          <div className="font-bold truncate">{team || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="p-4 bg-slate-900/40 border-t border-slate-800">
                <button
                  onClick={() => onApplyPath && onApplyPath(route.picks)}
                  disabled={isCurrentlyActive}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    isCurrentlyActive
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.99]'
                  }`}
                >
                  <Zap size={14} />
                  {isCurrentlyActive ? 'Current Pick Sequence' : `Apply ${route.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
