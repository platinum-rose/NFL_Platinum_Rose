// src/components/intel/UnifiedIntelHub.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Unified AI Intelligence Command Center
// Combines AI Chat, Podcast Digests, Twitter Bookmarks & Training Camp Intel
// into a single, high-performance, dark-mode Command Hub.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense } from 'react';
import { Bot, Radio, Bookmark, Compass, Sparkles, RefreshCw } from 'lucide-react';

const AgentChat = lazy(() => import('../agent/AgentChat'));
const PodcastDigestTab = lazy(() => import('../podcasts/PodcastDigestTab'));
const TrainingCampIntel = lazy(() => import('../intel/TrainingCampIntel'));

export default function UnifiedIntelHub({ profileCanUseAI = true }) {
  const [activeSubTab, setActiveSubTab] = useState(profileCanUseAI ? 'agent-chat' : 'podcasts');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 md:p-6 space-y-6">
      {/* --- HUB HEADER & SUB-NAVIGATION --- */}
      <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles size={20} />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Intelligence Command Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-agent reasoning, podcast digests, personal Twitter bookmarks, and training camp scout intel.
          </p>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
          {profileCanUseAI && (
            <button
              onClick={() => setActiveSubTab('agent-chat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'agent-chat'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot size={14} /> AI Assistant
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('podcasts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'podcasts'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Radio size={14} /> Podcast Digests
          </button>

          <button
            onClick={() => setActiveSubTab('training-camp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'training-camp'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass size={14} /> Camp Scout
          </button>
        </div>
      </div>

      {/* --- CONTENT CONTAINER WITH SUSPENSE --- */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="animate-spin text-purple-400" size={28} />
          <span className="text-xs font-medium tracking-wide">Loading AI Intelligence Engine...</span>
        </div>
      }>
        {profileCanUseAI && activeSubTab === 'agent-chat' && <AgentChat />}
        {activeSubTab === 'podcasts' && <PodcastDigestTab />}
        {activeSubTab === 'training-camp' && <TrainingCampIntel />}
      </Suspense>
    </div>
  );
}
