// src/components/futures/FuturesHub.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Unified Bankroll & Futures Command Hub
// Consolidates Futures Portfolio, Futures AI Reasoning, Futures Report & Bankroll
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Briefcase, Trophy, FileText, Banknote, Sparkles, RefreshCw } from 'lucide-react';

const FuturesPortfolio = lazy(() => import('./FuturesPortfolio'));
const FuturesAgentChat = lazy(() => import('../agent/FuturesAgentChat'));
const FuturesIntelReport = lazy(() => import('./FuturesIntelReport'));
const BankrollDashboard = lazy(() => import('../bankroll/BankrollDashboard'));

// onShowCalculator (2026-08-24 fix): this hub's own "Bankroll" sub-tab
// renders BankrollDashboard.jsx, which has a "Calculator" button wired to an
// onShowCalculator prop -- wiring that prop was done at App.jsx's separate,
// mobile-only `activeTab === 'bankroll'` route first (Task #12, Sizing
// header-button removal) without realizing THIS is the actual reachable
// path from the desktop "Bankroll & Futures" nav tab, which renders
// FuturesHub -> its own BankrollDashboard instance, never that other route.
// Caught live-testing: the button rendered but did nothing here. Now both
// entry points open the same UnitCalculatorModal via the same App.jsx state.
export default function FuturesHub({
  onShowCalculator,
  onAddPosition,
  onAddBet,
  onImportBets,
  onShowPending,
  onShowSettings,
  profileCanUseAI = true,
  profileCanAccessOwnerPortfolio = true,
}) {
  const visibleSubTabs = useMemo(() => [
    profileCanAccessOwnerPortfolio && { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    profileCanUseAI && { id: 'futures-ai', label: 'Futures AI', icon: Trophy },
    { id: 'report', label: 'Intel Report', icon: FileText },
    profileCanAccessOwnerPortfolio && { id: 'bankroll', label: 'Bankroll', icon: Banknote },
  ].filter(Boolean), [profileCanAccessOwnerPortfolio, profileCanUseAI]);

  const [activeSubTab, setActiveSubTab] = useState(() => visibleSubTabs[0]?.id || 'report');
  const selectedSubTab = visibleSubTabs.some((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : visibleSubTabs[0]?.id || 'report';

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
            Super Bowl, Conference, Division, Win Totals portfolio synthesis, market context, and bankroll tracking.
          </p>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
          {visibleSubTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedSubTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- CONTENT CONTAINER WITH SUSPENSE --- */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="animate-spin text-emerald-400" size={28} />
          <span className="text-xs font-medium tracking-wide">Loading Futures & Bankroll Hub...</span>
        </div>
      }>
        {profileCanAccessOwnerPortfolio && selectedSubTab === 'portfolio' && <FuturesPortfolio onAddPosition={onAddPosition} />}
        {profileCanUseAI && selectedSubTab === 'futures-ai' && <FuturesAgentChat />}
        {selectedSubTab === 'report' && <FuturesIntelReport />}
        {profileCanAccessOwnerPortfolio && selectedSubTab === 'bankroll' && (
          <BankrollDashboard
            onShowCalculator={onShowCalculator}
            onAddBet={onAddBet}
            onImportBets={onImportBets}
            onShowPending={onShowPending}
            onShowSettings={onShowSettings}
          />
        )}
      </Suspense>
    </div>
  );
}
