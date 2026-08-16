// src/components/fantasy/FantasyHub.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Unified Fantasy & Props Command Hub
// Consolidates ADP Value Board, FantasyPros Rankings, DFS Optimizer & Props
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense } from 'react';
import { Layers, Zap, Award, BarChart2, RefreshCw } from 'lucide-react';

const FantasyValueBoard = lazy(() => import('./FantasyValueBoard'));
const DFSOptimizer = lazy(() => import('../dfs/DFSOptimizer'));
const PropsAgentChat = lazy(() => import('../agent/PropsAgentChat'));

export default function FantasyHub() {
  const [activeSubTab, setActiveSubTab] = useState('value-board');

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
            FantasyPros ADP vs Value projections, consensus expert rankings (ECR), DFS lineup optimizer, and player props.
          </p>
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
        {activeSubTab === 'value-board' && <FantasyValueBoard />}
        {activeSubTab === 'dfs' && <DFSOptimizer />}
        {activeSubTab === 'props' && <PropsAgentChat />}
      </Suspense>
    </div>
  );
}
