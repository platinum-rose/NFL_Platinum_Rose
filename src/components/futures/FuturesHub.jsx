// src/components/futures/FuturesHub.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Unified Bankroll & Futures Command Hub
// Consolidates Futures Portfolio, Futures AI Reasoning, Futures Report & Bankroll
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense } from 'react';
import { Briefcase, Trophy, FileText, Banknote, Sparkles, RefreshCw } from 'lucide-react';

const FuturesPortfolio = lazy(() => import('./FuturesPortfolio'));
const FuturesAgentChat = lazy(() => import('../agent/FuturesAgentChat'));
const FuturesIntelReport = lazy(() => import('./FuturesIntelReport'));
const BankrollDashboard = lazy(() => import('../bankroll/BankrollDashboard'));

export default function FuturesHub() {
  const [activeSubTab, setActiveSubTab] = useState('portfolio');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 md:p-6 space-y-6">
      {/* --- HUB HEADER & SUB-NAV --- */}
      <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase size={20} />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Bankroll & Futures Command Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Super Bowl, Conference, Division, Win Totals portfolio synthesis, AI market reasoning, and bankroll tracking.
          </p>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'portfolio'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Briefcase size={14} /> Portfolio
          </button>

          <button
            onClick={() => setActiveSubTab('futures-ai')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'futures-ai'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Trophy size={14} /> Futures AI
          </button>

          <button
            onClick={() => setActiveSubTab('report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'report'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText size={14} /> Intel Report
          </button>

          <button
            onClick={() => setActiveSubTab('bankroll')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'bankroll'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Banknote size={14} /> Bankroll
          </button>
        </div>
      </div>

      {/* --- CONTENT CONTAINER WITH SUSPENSE --- */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="animate-spin text-emerald-400" size={28} />
          <span className="text-xs font-medium tracking-wide">Loading Futures & Bankroll Hub...</span>
        </div>
      }>
        {activeSubTab === 'portfolio' && <FuturesPortfolio />}
        {activeSubTab === 'futures-ai' && <FuturesAgentChat />}
        {activeSubTab === 'report' && <FuturesIntelReport />}
        {activeSubTab === 'bankroll' && <BankrollDashboard />}
      </Suspense>
    </div>
  );
}
