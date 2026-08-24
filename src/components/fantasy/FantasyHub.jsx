// src/components/fantasy/FantasyHub.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Unified Fantasy & Props Command Hub
// Consolidates ADP Value Board, FantasyPros Rankings, DFS Optimizer & Props
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense } from 'react';
import { Layers, Zap, Award, BarChart2, RefreshCw, UserCheck, Sprout, CalendarClock } from 'lucide-react';

import FantasyRosterManager from './FantasyRosterManager';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage';

const FantasyValueBoard = lazy(() => import('./FantasyValueBoard'));
const DFSOptimizer = lazy(() => import('../dfs/DFSOptimizer'));
const PropsAgentChat = lazy(() => import('../agent/PropsAgentChat'));

const PHASE_KEY = PR_STORAGE_KEYS.FANTASY_PHASE.key;

export default function FantasyHub() {
  const [activeSubTab, setActiveSubTab] = useState('value-board');

  // Preseason/In-Season phase toggle (2026-08-24): draft prep (ADP value,
  // season-long projections) and in-season management (weekly ECR,
  // start/sit) are different jobs done at different times of year. Rather
  // than inventing separate phase-specific tabs, this changes which view
  // the Value Board sub-tab opens on by default -- draft tools up front
  // preseason, weekly rankings up front once games are being played. The
  // sub-tab itself still has the full toggle, so nothing is hidden, just
  // re-defaulted. Persisted so it doesn't reset every visit.
  const [phase, setPhase] = useState(() => loadFromStorage(PHASE_KEY, 'preseason'));

  const handlePhaseChange = (next) => {
    setPhase(next);
    saveToStorage(PHASE_KEY, next);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 md:p-6 space-y-6">
      {/* --- HUB HEADER & SUB-NAV --- */}
      <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BarChart2 size={20} />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Fantasy & Props Command Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            FantasyPros ADP vs Value projections, consensus expert rankings (ECR), roster & keeper surplus evaluator, DFS optimizer, and player props.
          </p>
        </div>

        {/* PHASE TOGGLE */}
        <div className="flex items-center gap-1 bg-[#0a0d14] p-1 rounded-xl border border-slate-800/80 shrink-0">
          <button
            onClick={() => handlePhaseChange('preseason')}
            title="Draft prep: ADP value board and season projections open by default"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              phase === 'preseason' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Sprout size={12} /> Preseason
          </button>
          <button
            onClick={() => handlePhaseChange('season')}
            title="Weekly management: expert rankings open by default"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              phase === 'season' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' : 'text-slate-500 hover:text-white'
            }`}
          >
            <CalendarClock size={12} /> In-Season
          </button>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('value-board')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'value-board'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Award size={14} /> Value Board
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'roster'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserCheck size={14} /> My Roster & Keepers
          </button>

          <button
            onClick={() => setActiveSubTab('dfs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'dfs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers size={14} /> DFS Optimizer
          </button>

          <button
            onClick={() => setActiveSubTab('props')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'props'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Zap size={14} /> Player Props
          </button>
        </div>
      </div>

      {/* --- CONTENT CONTAINER WITH SUSPENSE --- */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="animate-spin text-blue-400" size={28} />
          <span className="text-xs font-medium tracking-wide">Loading Fantasy & Props Hub...</span>
        </div>
      }>
        {activeSubTab === 'value-board' && (
          <FantasyValueBoard key={phase} defaultView={phase === 'season' ? 'rankings' : 'value'} />
        )}
        {activeSubTab === 'roster' && <FantasyRosterManager />}
        {activeSubTab === 'dfs' && <DFSOptimizer />}
        {activeSubTab === 'props' && <PropsAgentChat />}
      </Suspense>
    </div>
  );
}
