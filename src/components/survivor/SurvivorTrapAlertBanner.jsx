// src/components/survivor/SurvivorTrapAlertBanner.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Survivor Trap Game Alert Banner
//
// Automatically detects and highlights saved picks that have moved into
// dangerous toss-up or underdog territory (< 60% win prob or > -3.5 spread),
// providing immediate 1-click high-confidence pivot alternatives.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { NFL_TEAMS } from '../../lib/teams.js';

export default function SurvivorTrapAlertBanner({
  trapAlerts = [],
  onSelectPick,
}) {
  if (!trapAlerts || trapAlerts.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {trapAlerts.map((alert) => {
        const teamMeta = NFL_TEAMS[alert.team];
        const isCritical = alert.severity === 'CRITICAL';

        return (
          <div
            key={`trap_wk_${alert.week}_${alert.team}`}
            className={`border-2 rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden transition-all ${
              isCritical
                ? 'bg-gradient-to-r from-rose-950 via-slate-950 to-rose-950 border-rose-500 shadow-rose-950/50'
                : 'bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-amber-500 shadow-amber-950/50'
            }`}
          >
            {/* Header / Severity Tag */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start md:items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse ${
                    isCritical
                      ? 'bg-rose-500/20 border border-rose-500 text-rose-400'
                      : 'bg-amber-500/20 border border-amber-500 text-amber-400'
                  }`}
                >
                  {isCritical ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                        isCritical
                          ? 'bg-rose-900/60 text-rose-200 border-rose-500/40'
                          : 'bg-amber-900/60 text-amber-200 border-amber-500/40'
                      }`}
                    >
                      {isCritical ? '🚨 Critical Underdog Alert' : '⚠️ Trap Game Alert'}
                    </span>
                    <span className="text-white font-bold text-xs font-mono">
                      Week {alert.week} Pick Compromised
                    </span>
                  </div>

                  <h3 className="text-white font-black text-base md:text-lg mt-0.5 flex items-center gap-2">
                    <span>
                      {alert.fullName} ({alert.team})
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {alert.spread > 0 ? `+${alert.spread}` : alert.spread} · {alert.winProbPct} Win Prob
                    </span>
                  </h3>
                </div>
              </div>

              {/* Status Explanation */}
              <div className="text-xs text-slate-300 max-w-md font-sans bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Risk Analysis:
                </span>
                {alert.reason}
              </div>
            </div>

            {/* Pivot Alternatives Strip */}
            {alert.alternativePivots && alert.alternativePivots.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Zap size={14} className="text-amber-400" />
                  <span>Recommended Wk {alert.week} Pivots:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {alert.alternativePivots.map((pivot) => (
                    <button
                      key={pivot.team}
                      onClick={() => onSelectPick(alert.week, pivot.team)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 group"
                    >
                      <span className="font-black text-amber-300 group-hover:text-white">
                        {pivot.team}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 group-hover:text-white">
                        {pivot.spread > 0 ? `+${pivot.spread}` : pivot.spread} ({pivot.winProbPct})
                      </span>
                      <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
