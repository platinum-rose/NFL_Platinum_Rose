// src/components/fantasy/FantasyRosterManager.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Multi-League Fantasy Roster, Keeper Matrix & Game-Day Matchup Command Center
// 
// Features:
// - Direct bundling of master dataset (277 players across 12 teams).
// - Live 2026 FantasyPros Consensus ADP & Projections Integration (439 ranked players).
// - Positional Order Sorting: QB > WR > RB > TE > K > DEF.
// - Filter OUT Ineligible Players toggle.
// - Position Filter (QB, WR, RB, TE, K, DEF).
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import {
  Shirt, Upload, Plus, Sparkles, TrendingUp, Award, CheckCircle2,
  AlertTriangle, HelpCircle, Trash2, Edit3, RefreshCw, Layers, Target, Shield, Users, Info, Flame,
  ArrowUpDown, Swords, ChevronDown, RefreshCcw, Filter, EyeOff, CheckSquare, Square
} from 'lucide-react';
import { PR_STORAGE_KEYS } from '../../lib/storage';
import { evaluateRosterKeepers, generateDraftStrategyInsights } from '../../lib/keeperEvaluator';
import {
  FANTASY_LEAGUES,
  OFFICIAL_LEAGUE_MANAGERS,
  getActiveLeagueId,
  setActiveLeagueId,
  getLeagueProfile,
  getLeagueRoster,
  saveLeagueRoster
} from '../../lib/fantasyLeagues';
import ManualRosterModal from './ManualRosterModal';
import LeagueSelector from './LeagueSelector';

// Direct static imports of master dataset & live FantasyPros ADP board
import masterLeagueData from '../../../public/league_keeper_master_2026.json';
import fantasyValueBoardData from '../../../public/fantasy-value-board.json';

const TIER_BADGE_STYLE = {
  'S-Tier': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'A-Tier': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'B-Tier': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'C-Tier': 'bg-slate-700/40 text-slate-400 border-slate-600/30',
  'Ineligible': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

const MY_TEAM_NAME = "Fat Lazy Americans";

// Custom positional hierarchy requested: QB > WR > RB > TE > K > DEF
const POSITION_ORDER_MAP = {
  'QB': 1,
  'WR': 2,
  'RB': 3,
  'TE': 4,
  'K': 5,
  'DEF': 6,
  'DST': 6,
  'LB': 7,
  'DB': 8,
  'DL': 9,
  'IDP': 10,
};

export default function FantasyRosterManager() {
  const [activeLeagueId, setActiveLeagueState] = useState(() => getActiveLeagueId());
  const activeProfile = useMemo(() => getLeagueProfile(activeLeagueId), [activeLeagueId]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [hideIneligible, setHideIneligible] = useState(false);
  const [sortField, setSortField] = useState('surplus'); // surplus, adp, cost, name, pos
  const [sortAsc, setSortAsc] = useState(false); // default desc for surplus

  // Game-Day Matchup Comparison Mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [rivalTeam, setRivalTeam] = useState('Berserker');

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editRoundVal, setEditRoundVal] = useState('');

  // Extract live FantasyPros ADP board array
  const marketBoard = useMemo(() => {
    return Array.isArray(fantasyValueBoardData?.board) ? fantasyValueBoardData.board : [];
  }, []);

  // Extract initial 277 master players synchronously
  const masterPlayersList = useMemo(() => {
    if (Array.isArray(masterLeagueData?.players) && masterLeagueData.players.length > 0) {
      return masterLeagueData.players;
    }
    if (Array.isArray(masterLeagueData?.teams)) {
      return masterLeagueData.teams.flatMap(t =>
        (t.finalRoster || []).map(p => ({ ...p, draftTeam: t.teamName }))
      );
    }
    return [];
  }, []);

  // Initialize roster state synchronously from master dataset or localStorage
  const [roster, setRoster] = useState(() => {
    const stored = getLeagueRoster(activeLeagueId);
    if (activeLeagueId === 'the_league') {
      const isCorrupted = Array.isArray(stored) && (stored.length < 50 || stored.some(p => p.draftTeam === 'A.J. Brown' || p.draftTeam === 'Aaron Jones Sr.'));
      if (isCorrupted || !stored || stored.length === 0) {
        saveLeagueRoster('the_league', masterPlayersList);
        return masterPlayersList;
      }
    }
    return Array.isArray(stored) && stored.length > 0 ? stored : masterPlayersList;
  });

  // Handle switching active league
  const handleSelectLeague = useCallback((newLeagueId) => {
    setActiveLeagueId(newLeagueId);
    setActiveLeagueState(newLeagueId);
    setTeamFilter('ALL');
    setPositionFilter('ALL');
    setIsCompareMode(false);

    const stored = getLeagueRoster(newLeagueId);
    if (newLeagueId === 'the_league') {
      const isCorrupted = Array.isArray(stored) && (stored.length < 50 || stored.some(p => p.draftTeam === 'A.J. Brown' || p.draftTeam === 'Aaron Jones Sr.'));
      if (isCorrupted || !stored || stored.length === 0) {
        setRoster(masterPlayersList);
        saveLeagueRoster('the_league', masterPlayersList);
        return;
      }
    }
    setRoster(Array.isArray(stored) && stored.length > 0 ? stored : masterPlayersList);
  }, [masterPlayersList]);

  // Save roster for current league
  const updateRosterState = useCallback((newRoster) => {
    setRoster(newRoster);
    saveLeagueRoster(activeLeagueId, newRoster);
  }, [activeLeagueId]);

  // Reset to master data
  const handleResetToMasterData = useCallback(() => {
    setRoster(masterPlayersList);
    saveLeagueRoster('the_league', masterPlayersList);
    setTeamFilter('ALL');
    setPositionFilter('ALL');
    setHideIneligible(false);
  }, [masterPlayersList]);

  // Evaluate roster with 9-rule keeper engine against 2026 FantasyPros ADP board
  const evaluatedRoster = useMemo(() => {
    const rawRoster = roster.length > 0 ? roster : masterPlayersList;
    return evaluateRosterKeepers(rawRoster, marketBoard, activeProfile.leagueSize);
  }, [roster, masterPlayersList, marketBoard, activeProfile.leagueSize]);

  // Filtered & Sorted roster
  const filteredRoster = useMemo(() => {
    let result = evaluatedRoster.filter(item => {
      let itemTeam = item.draftTeam || MY_TEAM_NAME;
      if (itemTeam === 'My Team' || itemTeam === 'Waiver Pickup' || itemTeam === 'Pos') {
        itemTeam = MY_TEAM_NAME;
      }
      // Manager Team Filter
      if (teamFilter !== 'ALL' && itemTeam.trim().toLowerCase() !== teamFilter.trim().toLowerCase()) return false;

      // Position Filter
      if (positionFilter !== 'ALL') {
        const pPos = (item.position || '').toUpperCase();
        if (positionFilter === 'DEF' && !['DEF', 'DST', 'LB', 'DB', 'DL', 'IDP'].includes(pPos)) return false;
        if (positionFilter !== 'DEF' && pPos !== positionFilter) return false;
      }

      // Hide Ineligible Filter
      if (hideIneligible && item.isEligible === false) return false;

      // Status Filter
      if (statusFilter === 'ELIGIBLE' && item.isEligible === false) return false;
      if (statusFilter === 'KEEPER' && item.status !== 'keeper') return false;
      if (statusFilter === 'CANDIDATE' && item.status === 'keeper') return false;
      if (statusFilter === 'INELIGIBLE' && item.isEligible !== false) return false;

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      let valA, valB;
      if (sortField === 'pos') {
        const orderA = POSITION_ORDER_MAP[a.position?.toUpperCase()] || 99;
        const orderB = POSITION_ORDER_MAP[b.position?.toUpperCase()] || 99;
        if (orderA !== orderB) {
          return sortAsc ? orderA - orderB : orderB - orderA;
        }
        return a.player.localeCompare(b.player);
      } else if (sortField === 'surplus') {
        valA = a.surplusRounds != null ? a.surplusRounds : -999;
        valB = b.surplusRounds != null ? b.surplusRounds : -999;
      } else if (sortField === 'adp') {
        valA = a.adp != null ? a.adp : 999;
        valB = b.adp != null ? b.adp : 999;
      } else if (sortField === 'cost') {
        valA = a.thisSeasonKeeperCost != null ? a.thisSeasonKeeperCost : 999;
        valB = b.thisSeasonKeeperCost != null ? b.thisSeasonKeeperCost : 999;
      } else if (sortField === 'name') {
        return sortAsc ? a.player.localeCompare(b.player) : b.player.localeCompare(a.player);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [evaluatedRoster, statusFilter, teamFilter, positionFilter, hideIneligible, sortField, sortAsc]);

  // Game-Day Roster Comparison Teams
  const myTeamRoster = useMemo(() => {
    return evaluatedRoster.filter(p => {
      const t = (p.draftTeam || '').trim().toLowerCase();
      return t === MY_TEAM_NAME.toLowerCase() || t === 'my team';
    });
  }, [evaluatedRoster]);

  const rivalTeamRoster = useMemo(() => {
    return evaluatedRoster.filter(p => (p.draftTeam || '').trim().toLowerCase() === rivalTeam.toLowerCase());
  }, [evaluatedRoster, rivalTeam]);

  // Keeper counts & limits
  const activeKeepers = useMemo(() => {
    return evaluatedRoster.filter(p => p.status === 'keeper' && p.isEligible);
  }, [evaluatedRoster]);

  const draftStrategy = useMemo(() => {
    return generateDraftStrategyInsights(evaluatedRoster, activeProfile.leagueSize);
  }, [evaluatedRoster, activeProfile.leagueSize]);

  const handleToggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'pos' || field === 'adp' || field === 'cost');
    }
  };

  const handleToggleMyTeamFilter = () => {
    if (teamFilter === MY_TEAM_NAME) {
      setTeamFilter('ALL');
    } else {
      setTeamFilter(MY_TEAM_NAME);
    }
  };

  const handleToggleKeeperStatus = (id) => {
    if (!activeProfile.isKeeperLeague) return;

    const target = roster.find(p => p.id === id || p.player === id);
    if (!target) return;

    if (target.status !== 'keeper' && activeKeepers.length >= activeProfile.maxKeepers) {
      alert(`Notice: ${activeProfile.name} allows a maximum of ${activeProfile.maxKeepers} keeper${activeProfile.maxKeepers > 1 ? 's' : ''} per team.`);
    }

    const updated = roster.map(p => {
      if (p.id === id || p.player === id) {
        return {
          ...p,
          status: p.status === 'keeper' ? 'candidate' : 'keeper',
        };
      }
      return p;
    });

    updateRosterState(updated);
  };

  const handleRemovePlayer = (id) => {
    const updated = roster.filter(p => p.id !== id && p.player !== id);
    updateRosterState(updated);
  };

  const handleSaveEditRound = (id) => {
    const rd = parseInt(editRoundVal, 10);
    if (isNaN(rd) || rd < 1 || rd > 20) {
      setEditingPlayerId(null);
      return;
    }
    const updated = roster.map(p => {
      if (p.id === id || p.player === id) {
        return { ...p, keeperCostRound: rd, lastSeasonRound: rd };
      }
      return p;
    });
    updateRosterState(updated);
    setEditingPlayerId(null);
  };

  const handleImportRosters = (importedRoster) => {
    updateRosterState(importedRoster);
    setIsImportModalOpen(false);
  };

  const isRedraftLeague = !activeProfile.isKeeperLeague;

  return (
    <div className="space-y-6">
      {/* LEAGUE SELECTOR BAR */}
      <LeagueSelector
        activeLeagueId={activeLeagueId}
        onSelectLeague={handleSelectLeague}
      />

      {/* GAME-DAY MATCHUP & RIVAL ROSTER COMPARISON TOOL BANNER */}
      <div className="bg-[#121824] border border-purple-900/50 p-4 md:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Swords size={22} />
          </span>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>Game-Day Active Roster Matchup & Rival Inspector</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                12 Verified Managers Ingested
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare your active roster ({MY_TEAM_NAME}) head-to-head against any rival manager on game day, or inspect their potential keeper locks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-lg ${
            isCompareMode
              ? 'bg-purple-600 text-white border-purple-400 shadow-purple-900/40'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:text-white'
          }`}
        >
          <Swords size={16} />
          {isCompareMode ? 'Hide Head-to-Head Comparison' : 'Launch Game-Day Matchup Tool'}
        </button>
      </div>

      {/* GAME-DAY SIDE-BY-SIDE MATCHUP PANEL */}
      {isCompareMode && (
        <div className="bg-[#121824] border border-purple-800/60 rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-base">
              <Swords size={20} />
              <span>Head-to-Head Active Roster Matchup</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold">Select Rival Manager:</span>
              <select
                value={rivalTeam}
                onChange={(e) => setRivalTeam(e.target.value)}
                className="bg-[#0a0d14] border border-purple-500/50 text-purple-200 font-bold text-xs px-3.5 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                {OFFICIAL_LEAGUE_MANAGERS.filter(t => t.toLowerCase() !== MY_TEAM_NAME.toLowerCase()).map(t => (
                  <option key={t} value={t} className="bg-[#121824] text-slate-200">{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MY TEAM */}
            <div className="bg-[#0a0d14] border border-cyan-900/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
                <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Shield size={16} />
                  <span>{MY_TEAM_NAME} (My Roster)</span>
                </h4>
                <span className="text-xs text-slate-400">{myTeamRoster.length} Players</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {myTeamRoster.map(p => (
                  <div key={p.id || p.player} className="flex items-center justify-between bg-[#121824] p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.player}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">{p.position}</span>
                      <span className="text-[10px] text-slate-500">{p.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.adp && <span className="text-[10px] text-slate-400">ADP #{p.adp}</span>}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TIER_BADGE_STYLE[p.keeperTier]}`}>
                        Rd {p.thisSeasonKeeperCost}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIVAL TEAM */}
            <div className="bg-[#0a0d14] border border-purple-900/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                <h4 className="font-bold text-purple-400 text-sm flex items-center gap-2">
                  <Swords size={16} />
                  <span>{rivalTeam} (Rival Roster)</span>
                </h4>
                <span className="text-xs text-slate-400">{rivalTeamRoster.length} Players</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {rivalTeamRoster.map(p => (
                  <div key={p.id || p.player} className="flex items-center justify-between bg-[#121824] p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.player}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">{p.position}</span>
                      <span className="text-[10px] text-slate-500">{p.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.adp && <span className="text-[10px] text-slate-400">ADP #{p.adp}</span>}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TIER_BADGE_STYLE[p.keeperTier]}`}>
                        Rd {p.thisSeasonKeeperCost}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTROLS & SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KEEPER SUMMARY CARD */}
        <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Shirt size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">
                  {isRedraftLeague ? 'Full Redraft Board & Roster Ranks' : `${activeProfile.name} Keeper Matrix`}
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluated against live 2026 FantasyPros consensus ADP ({marketBoard.length} ranked players)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToMasterData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold shadow-lg transition-all"
                title="Reload 277-player master dataset from public/league_keeper_master_2026.json"
              >
                <RefreshCcw size={13} /> Reset Master Data
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition-all"
              >
                <Upload size={14} /> Import / Reconcile
              </button>
            </div>
          </div>

          {!isRedraftLeague && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Keepers</span>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">
                  {activeKeepers.length} / {activeProfile.maxKeepers}
                </div>
              </div>

              <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Surplus</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  +{draftStrategy.totalSurplusRounds} Rds
                </div>
              </div>

              <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">S-Tier Candidates</span>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {evaluatedRoster.filter(p => p.keeperTier === 'S-Tier' && p.isEligible).length}
                </div>
              </div>

              <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Roster</span>
                <div className="text-lg font-bold text-slate-200 mt-0.5">
                  {evaluatedRoster.length} Players
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI DRAFT STRATEGY INSIGHTS CARD */}
        <div className="bg-[#121824] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>AI Draft Strategy Outlook</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-slate-400">Primary Draft Need:</span>
              <div className="font-semibold text-white text-sm mt-0.5">{draftStrategy.primaryNeed}</div>
            </div>

            <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              {draftStrategy.earlyRoundFocus}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* MY TEAM TOGGLE BUTTON */}
          <button
            onClick={handleToggleMyTeamFilter}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              teamFilter === MY_TEAM_NAME
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-900/40 ring-2 ring-cyan-500/30'
                : 'bg-[#0a0d14] text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            🛡️ My Team ({MY_TEAM_NAME}) {teamFilter === MY_TEAM_NAME && '✓'}
          </button>

          {/* MANAGER TEAM DROPDOWN */}
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded-xl border border-slate-800">
            <Users size={14} className="text-slate-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121824] text-slate-200">All 12 League Teams</option>
              {OFFICIAL_LEAGUE_MANAGERS.map(t => (
                <option key={t} value={t} className="bg-[#121824] text-slate-200">{t}</option>
              ))}
            </select>
          </div>

          {/* POSITION FILTER DROPDOWN */}
          <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter size={14} className="text-slate-400" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121824] text-slate-200">All Positions</option>
              <option value="QB" className="bg-[#121824] text-slate-200">QB Only</option>
              <option value="WR" className="bg-[#121824] text-slate-200">WR Only</option>
              <option value="RB" className="bg-[#121824] text-slate-200">RB Only</option>
              <option value="TE" className="bg-[#121824] text-slate-200">TE Only</option>
              <option value="K" className="bg-[#121824] text-slate-200">K Only</option>
              <option value="DEF" className="bg-[#121824] text-slate-200">DEF / IDP Only</option>
            </select>
          </div>

          {/* HIDE INELIGIBLE PLAYERS TOGGLE BUTTON */}
          <button
            onClick={() => setHideIneligible(!hideIneligible)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              hideIneligible
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md'
                : 'bg-[#0a0d14] text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Filter out ineligible players from table"
          >
            {hideIneligible ? <CheckSquare size={14} className="text-rose-400" /> : <Square size={14} />}
            <span>Filter Out Ineligible</span>
          </button>

          {!isRedraftLeague && (
            <div className="flex items-center bg-[#0a0d14] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setStatusFilter('KEEPER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'KEEPER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Keepers
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Showing <span className="text-white font-bold">{filteredRoster.length}</span> of {evaluatedRoster.length} players
        </div>
      </div>

      {/* ROSTER / KEEPER TABLE */}
      <div className="bg-[#121824] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0d14]/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleToggleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Player & Pos</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleToggleSort('pos')}>
                  <div className="flex items-center gap-1" title="Positional Sort: QB > WR > RB > TE > K > DEF">
                    <span>Pos Hierarchy</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Manager / Team</th>
                <th className="py-3.5 px-4">Acquisition & Rd</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleToggleSort('cost')}>
                  <div className="flex items-center gap-1">
                    <span>2026 Keeper Cost</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleToggleSort('adp')}>
                  <div className="flex items-center gap-1">
                    <span>Live 2026 ADP</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleToggleSort('surplus')}>
                  <div className="flex items-center gap-1">
                    <span>Surplus Rounds</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                {!isRedraftLeague && <th className="py-3.5 px-4 text-center">Keeper Status</th>}
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRoster.map((player) => {
                const isKeeper = player.status === 'keeper' && player.isEligible;
                const isEditing = editingPlayerId === player.id || editingPlayerId === player.player;
                const managerName = player.draftTeam || MY_TEAM_NAME;

                return (
                  <tr
                    key={player.id || player.player}
                    className={`transition-colors hover:bg-slate-800/30 ${
                      isKeeper ? 'bg-cyan-950/20' : player.isEligible === false ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    {/* PLAYER & POSITION */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{player.player}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {player.position}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">{player.team}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{player.recommendation}</div>
                    </td>

                    {/* POSITION BADGE */}
                    <td className="py-3 px-4">
                      <span className="font-extrabold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-xs">
                        {player.position}
                      </span>
                    </td>

                    {/* MANAGER / DRAFT TEAM */}
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2.5 py-1 rounded border ${
                        managerName === MY_TEAM_NAME
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800/80 text-slate-200 border-slate-700'
                      }`}>
                        {managerName}
                      </span>
                    </td>

                    {/* ACQUISITION */}
                    <td className="py-3 px-4">
                      <div className="text-slate-300 font-medium">{player.acquisitionLabel || player.acquisitionType || 'Drafted'}</div>
                    </td>

                    {/* 2026 KEEPER COST */}
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={editRoundVal}
                            onChange={(e) => setEditRoundVal(e.target.value)}
                            className="w-14 bg-slate-900 border border-cyan-500 px-2 py-1 rounded text-white text-xs"
                          />
                          <button
                            onClick={() => handleSaveEditRound(player.id || player.player)}
                            className="px-2 py-1 bg-cyan-600 text-white rounded text-[11px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={player.isEligible === false ? 'line-through text-slate-500' : 'text-cyan-400 font-extrabold'}>
                            {player.isEligible === false ? 'N/A' : `Round ${player.thisSeasonKeeperCost}`}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPlayerId(player.id || player.player);
                              setEditRoundVal(player.thisSeasonKeeperCost || '');
                            }}
                            className="text-slate-500 hover:text-slate-300"
                            title="Edit Draft Round"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* LIVE 2026 ADP */}
                    <td className="py-3 px-4">
                      {player.adp ? (
                        <div>
                          <div className="font-bold text-emerald-300 text-sm">ADP #{player.adp}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Exp. Rd {player.expectedRound}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unranked</span>
                      )}
                    </td>

                    {/* SURPLUS ROUNDS */}
                    <td className="py-3 px-4">
                      {player.isEligible === false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Ineligible
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TIER_BADGE_STYLE[player.keeperTier]}`}>
                            {player.surplusRounds >= 0 ? `+${player.surplusRounds} Rds` : `${player.surplusRounds} Rds`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{player.keeperTier}</span>
                        </div>
                      )}
                    </td>

                    {/* KEEPER STATUS TOGGLE */}
                    {!isRedraftLeague && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleKeeperStatus(player.id || player.player)}
                          disabled={player.isEligible === false}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                            isKeeper
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 shadow-lg shadow-cyan-900/20'
                              : player.isEligible === false
                              ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80 hover:text-white'
                          }`}
                        >
                          {isKeeper ? '✓ Kept' : player.isEligible === false ? 'Ineligible' : 'Set Keeper'}
                        </button>
                      </td>
                    )}

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemovePlayer(player.id || player.player)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove Player"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL / BULK IMPORT MODAL */}
      {isImportModalOpen && (
        <ManualRosterModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportRosters}
          existingRoster={roster}
        />
      )}
    </div>
  );
}
