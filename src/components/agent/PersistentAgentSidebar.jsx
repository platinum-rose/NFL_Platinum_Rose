// src/components/agent/PersistentAgentSidebar.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Persistent Multi-Mode AI Agent Sidebar
// Permanently docked on the right side of the screen with instant mode switching
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense } from 'react';
import { Bot, Target, Briefcase, Zap, Shirt, Shield, ListFilter, TrendingUp, Trophy, ChevronRight, ChevronLeft, Sparkles, RefreshCw } from 'lucide-react';

import AgentChat from './AgentChat';
import FuturesAgentChat from './FuturesAgentChat';
import PropsAgentChat from './PropsAgentChat';


const AGENT_MODES = [
  { id: 'general', label: 'Sides & Totals', icon: Target, color: 'text-purple-400 border-purple-500/30' },
  { id: 'futures', label: 'Futures AI', icon: Briefcase, color: 'text-emerald-400 border-emerald-500/30' },
  { id: 'props', label: 'Player Props', icon: Zap, color: 'text-amber-400 border-amber-500/30' },
  { id: 'fantasy', label: 'Fantasy Rosters', icon: Shirt, color: 'text-blue-400 border-blue-500/30' },
  { id: 'survivor', label: 'Survivor Pool', icon: Shield, color: 'text-cyan-400 border-cyan-500/30' },
  { id: 'supercontest', label: 'SuperContest', icon: Trophy, color: 'text-rose-400 border-rose-500/30' },
  { id: 'confidence', label: 'Confidence Pool', icon: TrendingUp, color: 'text-emerald-400 border-emerald-500/30' },
];

export default function PersistentAgentSidebar({ isCollapsed, onToggleCollapse }) {
  const [activeMode, setActiveMode] = useState('general');

  if (isCollapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center py-4 px-2 bg-[#121824] border-l border-slate-800 w-16 h-full shadow-2xl space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all border border-purple-500/30"
          title="Expand AI Assistant Sidebar"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="w-8 h-px bg-slate-800 my-2"></div>

        {AGENT_MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id);
                onToggleCollapse();
              }}
              className={`p-2.5 rounded-xl transition-all border ${
                activeMode === mode.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-900/40'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title={mode.label}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="w-full lg:w-[400px] xl:w-[440px] bg-[#121824] border-l border-slate-800/80 flex flex-col h-[calc(100vh-60px)] sticky top-14 shadow-2xl z-30 transition-all duration-300">
      {/* --- SIDEBAR HEADER --- */}
      <div className="p-3.5 border-b border-slate-800 bg-[#0a0d14]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight uppercase">Platinum Rose AI Assistant</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Mode: {AGENT_MODES.find(m => m.id === activeMode)?.label}
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
          title="Collapse Sidebar"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* --- AGENT MODE SELECTOR PILLS --- */}
      <div className="p-2 bg-[#0d121f] border-b border-slate-800/60 grid grid-cols-3 gap-1">
        {AGENT_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-white' : ''} />
              <span className="truncate">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- ACTIVE AGENT CHAT CONTAINER --- */}
      <div className="flex-1 overflow-y-auto p-2">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <RefreshCw className="animate-spin text-purple-400" size={24} />
            <span className="text-[11px] font-medium">Switching Agent Mode...</span>
          </div>
        }>
          {activeMode === 'general' && <AgentChat agentMode="general" />}
          {activeMode === 'futures' && <FuturesAgentChat />}
          {activeMode === 'props' && <PropsAgentChat />}
          {activeMode === 'fantasy' && <AgentChat agentMode="fantasy" />}
          {activeMode === 'survivor' && <AgentChat agentMode="survivor" />}
          {activeMode === 'supercontest' && <AgentChat agentMode="supercontest" />}
          {activeMode === 'confidence' && <AgentChat agentMode="confidence" />}

        </Suspense>
      </div>
    </aside>
  );
}


