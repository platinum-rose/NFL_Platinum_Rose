// src/components/intel/TrainingCampIntel.jsx
// ---------------------------------------------------------------------------
// 32-Team Training Camp & Beat Intel Radar (Phase 4)
//
// Ingests local training camp intel snapshots, provides interactive 32-team
// coverage filtering, signal-type chips, player/team keyword search, anchor
// team badges (BUF/GB), and human-review flags.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import {
  Activity,
  ChevronDown,
  FileText,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import latestCampData from '../../../data/training-camp/2026/latest.json';

const SIGNAL_TYPES = [
  { id: 'all', label: 'All Signals' },
  { id: 'injury', label: 'Injuries' },
  { id: 'depth_chart', label: 'Depth Chart' },
  { id: 'role_usage', label: 'Role & Usage' },
  { id: 'coach_quote', label: 'Coach Quotes' },
  { id: 'beat_consensus', label: 'Beat Consensus' },
  { id: 'roster_move', label: 'Roster Moves' },
  { id: 'scheme', label: 'Scheme & Practice' },
  { id: 'market_move', label: 'Market Moves' },
];

const ANCHOR_TEAMS = ['BUF', 'GB'];

function getSignalBadgeColor(signalType) {
  switch (signalType) {
    case 'injury':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'depth_chart':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'role_usage':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'coach_quote':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'beat_consensus':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'roster_move':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'market_move':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-600';
  }
}

function getStrengthBadge(strength) {
  if (strength >= 0.9) return { label: 'CRITICAL', color: 'bg-red-600 text-white' };
  if (strength >= 0.7) return { label: 'STARTER', color: 'bg-amber-600 text-white' };
  if (strength >= 0.45) return { label: 'ROTATION', color: 'bg-blue-600 text-white' };
  return { label: 'SOFT BUZZ', color: 'bg-slate-600 text-slate-200' };
}

export default function TrainingCampIntel() {
  const [selectedSignal, setSelectedSignal] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [anchorOnly, setAnchorOnly] = useState(false);

  const snapshot = latestCampData || {};
  const meta = snapshot.meta || {};

  const teamList = useMemo(() => Object.values(snapshot.teams || {}), [snapshot.teams]);
  const totalItems = useMemo(
    () => teamList.reduce((acc, t) => acc + (t.items?.length || 0), 0),
    [teamList]
  );
  const teamsWithIntel = useMemo(
    () => teamList.filter((t) => (t.items?.length || 0) > 0).length,
    [teamList]
  );

  // Filtered teams & items
  const filteredTeams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return teamList.filter((t) => {
      if (anchorOnly && !ANCHOR_TEAMS.includes(t.team)) return false;

      // Filter items per team
      const matchingItems = (t.items || []).filter((item) => {
        if (selectedSignal !== 'all' && item.signal_type !== selectedSignal) return false;
        if (highPriorityOnly && (item.signal_strength || 0) < 0.7) return false;

        if (!query) return true;

        const inPlayer = (item.player || '').toLowerCase().includes(query);
        const inSummary = (item.summary || '').toLowerCase().includes(query);
        const inExcerpt = (item.raw_excerpt || '').toLowerCase().includes(query);
        const inSource = (item.source || '').toLowerCase().includes(query);
        const inTeam = (t.team || '').toLowerCase().includes(query) || (t.full_name || '').toLowerCase().includes(query);

        return inPlayer || inSummary || inExcerpt || inSource || inTeam;
      });

      if (!query && selectedSignal === 'all' && !highPriorityOnly) return true;

      // If querying or filtering, include team if team name matches OR has matching items
      const teamMatches = (t.team || '').toLowerCase().includes(query) || (t.full_name || '').toLowerCase().includes(query);
      return teamMatches || matchingItems.length > 0;
    });
  }, [teamList, searchQuery, selectedSignal, highPriorityOnly, anchorOnly]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                32-Team Training Camp & Beat Intel Radar
              </h2>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Decision Support
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Source-stamped camp reports, depth chart shifts, and role signals across all 32 NFL franchises.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Coverage</span>
              <span className="text-base font-bold text-emerald-400">
                {teamsWithIntel} / {meta.team_count || 32}
              </span>
              <span className="text-slate-400 text-[10px]"> teams active</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Total Signals</span>
              <span className="text-base font-bold text-cyan-400">{totalItems}</span>
              <span className="text-slate-400 text-[10px]"> nuggets</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Guardrail</span>
              <span className="text-base font-bold text-amber-400">HUMAN GATE</span>
              <span className="text-slate-400 text-[10px]"> no auto-picks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by team (e.g. BUF), player name, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setHighPriorityOnly(!highPriorityOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition ${
                highPriorityOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> High Impact Only
            </button>
            <button
              onClick={() => setAnchorOnly(!anchorOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap transition ${
                anchorOnly
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Anchors (BUF / GB)
            </button>
          </div>
        </div>

        {/* Signal Type Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {SIGNAL_TYPES.map((sig) => (
            <button
              key={sig.id}
              onClick={() => setSelectedSignal(sig.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedSignal === sig.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{sig.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 32-Team Radar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTeams.map((teamObj) => {
          const isAnchor = ANCHOR_TEAMS.includes(teamObj.team);
          const items = teamObj.items || [];
          const isExpanded = expandedTeam === teamObj.team;

          return (
            <div
              key={teamObj.team}
              className={`bg-slate-900/80 border rounded-xl p-4 transition ${
                isAnchor ? 'border-cyan-500/40 shadow-cyan-950/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">{teamObj.team}</span>
                  <span className="text-xs text-slate-400">{teamObj.nick}</span>
                  {isAnchor && (
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">
                      ANCHOR
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {items.length} items
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{teamObj.division}</span>
                {items.length === 0 && <span className="text-slate-600 italic">Not collected yet</span>}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="mt-3 space-y-2">
                  {(isExpanded ? items : items.slice(0, 2)).map((item, idx) => {
                    const badge = getStrengthBadge(item.signal_strength || 0);
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-semibold ${getSignalBadgeColor(
                              item.signal_type
                            )}`}
                          >
                            {item.signal_type?.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-slate-200 text-xs leading-snug">{item.summary}</p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                          <span className="font-medium text-slate-400">{item.source || 'RotoWire'}</span>
                          <span className="font-mono">{item.player || teamObj.team}</span>
                        </div>
                      </div>
                    );
                  })}

                  {items.length > 2 && (
                    <button
                      onClick={() => setExpandedTeam(isExpanded ? null : teamObj.team)}
                      className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 py-1 transition flex items-center justify-center gap-1"
                    >
                      {isExpanded ? (
                        <>Show less <ChevronDown className="w-3 h-3 rotate-180" /></>
                      ) : (
                        <>+{items.length - 2} more items <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No training camp signals matched your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSignal('all');
              setHighPriorityOnly(false);
              setAnchorOnly(false);
            }}
            className="mt-3 text-xs text-cyan-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
