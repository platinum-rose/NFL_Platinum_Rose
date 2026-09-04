// src/components/survivor/SurvivorAlphaView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Survivor Contest Alpha Suite & Season-Long Path Optimizer View
//
// Multi-Contest Support:
// 1. Ken's Survival League
// 2. LMS 2022
//
// Sub-Tabs:
// 1. 18-Week Contest Grid (Matrix with crosshairs & heatmap)
// 2. Path Optimizer (3 algorithmic survival routes)
// 3. Path Simulator & Risk (Live simulation & remaining weeks solver)
// 4. Weekly Matchups (Matchup card browser)
// 5. Opponents & Field Matrix (Track competitors' picks, survival & team ammo)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Grid,
  Sparkles,
  Layers,
  Activity,
  RotateCcw,
  User,
  ShieldAlert,
  HelpCircle,
  X,
  Zap,
  Users,
  Shield,
} from 'lucide-react';
import {
  SURVIVOR_CONTESTS,
  build18WeekGrid,
  computeAllTeamsFutureValues,
  solveOptimalPaths,
  simulateSurvivalPath,
  loadSurvivorContestState,
  saveSurvivorContestState,
  detectTrapPicks,
} from '../../lib/survivorAlpha.js';
import SurvivorMatrixGrid from './SurvivorMatrixGrid.jsx';
import SurvivorPathOptimizer from './SurvivorPathOptimizer.jsx';
import SurvivorWeeklyPicker from './SurvivorWeeklyPicker.jsx';
import SurvivorPathSimulator from './SurvivorPathSimulator.jsx';
import SurvivorOpponentsTracker from './SurvivorOpponentsTracker.jsx';
import SurvivorTrapAlertBanner from './SurvivorTrapAlertBanner.jsx';

export default function SurvivorAlphaView({
  isOpen = true,
  onClose,
  schedule = [],
  results = {},
  activeProfile = null,
  season = 2026,
}) {
  const profileId = activeProfile?.id || 'amanda_rose';
  const profileName = activeProfile?.name || activeProfile?.displayLabel || 'Alpha Tester';

  // Active Contest: 'kens_survival_league' | 'lms_2022'
  const [activeContestId, setActiveContestId] = useState('kens_survival_league');

  // Sub-tabs: 'matrix' | 'optimizer' | 'weekly' | 'simulator' | 'opponents'
  const [activeSubTab, setActiveSubTab] = useState('matrix');
  const [activeWeek, setActiveWeek] = useState(1);

  // Contest-scoped state: { picks: {}, opponents: [] }
  const [contestState, setContestState] = useState(() =>
    loadSurvivorContestState(profileId, 'kens_survival_league', season)
  );

  // Sync state when active profile or contest changes
  useEffect(() => {
    setContestState(loadSurvivorContestState(profileId, activeContestId, season));
  }, [profileId, activeContestId, season]);

  // Active contest metadata
  const currentContest = useMemo(() => {
    return (
      SURVIVOR_CONTESTS.find((c) => c.id === activeContestId) || SURVIVOR_CONTESTS[0]
    );
  }, [activeContestId]);

  const picks = contestState?.picks || {};
  const opponents = contestState?.opponents || [];

  // Save contest state on change
  const handleUpdateContestState = useCallback(
    (newState) => {
      setContestState(newState);
      saveSurvivorContestState(profileId, activeContestId, newState, season);
    },
    [profileId, activeContestId, season]
  );

  // Save picks on mutation
  const handlePicksChange = useCallback(
    (newPicks) => {
      const updated = { ...contestState, picks: newPicks };
      handleUpdateContestState(updated);
    },
    [contestState, handleUpdateContestState]
  );

  // Save opponents on mutation
  const handleOpponentsChange = useCallback(
    (newOpponents) => {
      const updated = { ...contestState, opponents: newOpponents };
      handleUpdateContestState(updated);
    },
    [contestState, handleUpdateContestState]
  );

  // Build the 18-week grid from schedule & results
  const grid = useMemo(() => {
    return build18WeekGrid(schedule, results);
  }, [schedule, results]);

  // Compute all teams' Future Values
  const futureValues = useMemo(() => {
    return computeAllTeamsFutureValues(1, grid);
  }, [grid]);

  // Algorithmic paths seeded with current picks
  const optimalPaths = useMemo(() => {
    return solveOptimalPaths(grid, picks);
  }, [grid, picks]);

  // Live simulation of current card
  const currentSim = useMemo(() => {
    return simulateSurvivalPath(picks, grid);
  }, [picks, grid]);

  // Pre-kickoff trap game detection for saved picks
  const trapAlerts = useMemo(() => {
    return detectTrapPicks(picks, grid);
  }, [picks, grid]);

  // Pick handlers
  const handleSelectPick = useCallback(
    (week, team) => {
      const updated = { ...picks, [week]: team };
      handlePicksChange(updated);
    },
    [picks, handlePicksChange]
  );

  const handleRemovePick = useCallback(
    (week) => {
      const updated = { ...picks };
      delete updated[week];
      handlePicksChange(updated);
    },
    [picks, handlePicksChange]
  );

  const handleApplyOptimalPath = useCallback(
    (pathPicks) => {
      handlePicksChange(pathPicks);
      setActiveSubTab('matrix');
    },
    [handlePicksChange]
  );

  const handleClearAll = useCallback(() => {
    if (window.confirm(`Reset all weekly picks in ${currentContest.name}?`)) {
      handlePicksChange({});
    }
  }, [currentContest.name, handlePicksChange]);

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & CONTEST SELECTOR BAR                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Row 1: App Title & Contest Profile Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 flex-shrink-0">
                <Trophy size={20} className="font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-black text-xl md:text-2xl tracking-tight">
                    Survivor Contest Command Center
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <User size={11} /> {profileName}
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{currentContest.name}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-mono">{currentContest.rules}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONTEST PROFILE SELECTOR TABS */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2 flex items-center gap-1">
              <Shield size={11} /> Contest:
            </span>
            {SURVIVOR_CONTESTS.map((contest) => {
              const isSelected = activeContestId === contest.id;
              return (
                <button
                  key={contest.id}
                  onClick={() => setActiveContestId(contest.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-1 ring-amber-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Trophy size={12} className={isSelected ? 'text-slate-950' : 'text-amber-400'} />
                  {contest.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Live Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3 md:gap-5 font-mono text-xs">
            {/* Active Contest Badge */}
            <div className="text-left bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">
                Active Pool
              </span>
              <span className="text-sm font-bold text-amber-300">
                {currentContest.shortName}
              </span>
            </div>

            {/* Survival Probability */}
            <div className="text-left bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">
                Joint Survival %
              </span>
              <span className="text-sm font-black text-emerald-400">
                {currentSim.survivalProbPct}
              </span>
            </div>

            {/* Picks Set */}
            <div className="text-left bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">
                Picks Set
              </span>
              <span className="text-sm font-black text-white">
                {currentSim.weeksCovered} / 18
              </span>
            </div>

            {/* Opponents Tracked */}
            <div className="text-left bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[9px] text-slate-500 font-sans uppercase font-bold block">
                Competitors
              </span>
              <span className="text-sm font-black text-indigo-300">
                {opponents.length} Tracked
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              title="Reset all picks in this contest"
              className="p-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset Picks
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeSubTab === 'matrix'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Grid size={14} /> 18-Week Contest Grid
          </button>
          <button
            onClick={() => setActiveSubTab('opponents')}
            className={`px-4 py-2 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeSubTab === 'opponents'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Users size={14} /> Pool Opponents &amp; Field Matrix ({opponents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('optimizer')}
            className={`px-4 py-2 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeSubTab === 'optimizer'
                ? 'border-purple-500 text-purple-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Sparkles size={14} /> Path Optimizer (3 Routes)
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-4 py-2 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeSubTab === 'simulator'
                ? 'border-amber-500 text-amber-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Activity size={14} /> Path Simulator &amp; Risk
          </button>
          <button
            onClick={() => setActiveSubTab('weekly')}
            className={`px-4 py-2 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeSubTab === 'weekly'
                ? 'border-cyan-500 text-cyan-300 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Layers size={14} /> Weekly Matchups
          </button>
        </div>
      </div>

      {/* Pre-Kickoff Trap Game Alert Banner */}
      <SurvivorTrapAlertBanner
        trapAlerts={trapAlerts}
        onSelectPick={handleSelectPick}
      />

      {/* Active Sub-Tab View Content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === 'matrix' && (
          <SurvivorMatrixGrid
            grid={grid}
            futureValues={futureValues}
            currentPicks={picks}
            activeWeek={activeWeek}
            onWeekChange={setActiveWeek}
            onSelectPick={handleSelectPick}
            onRemovePick={handleRemovePick}
          />
        )}

        {activeSubTab === 'opponents' && (
          <SurvivorOpponentsTracker
            contest={currentContest}
            opponents={opponents}
            myPicks={picks}
            grid={grid}
            activeWeek={activeWeek}
            onUpdateOpponents={handleOpponentsChange}
          />
        )}

        {activeSubTab === 'optimizer' && (
          <SurvivorPathOptimizer
            paths={optimalPaths}
            grid={grid}
            currentPicks={picks}
            onApplyPath={handleApplyOptimalPath}
          />
        )}

        {activeSubTab === 'weekly' && (
          <SurvivorWeeklyPicker
            grid={grid}
            futureValues={futureValues}
            currentPicks={picks}
            activeWeek={activeWeek}
            onWeekChange={setActiveWeek}
            onSelectPick={handleSelectPick}
            onRemovePick={handleRemovePick}
          />
        )}

        {activeSubTab === 'simulator' && (
          <SurvivorPathSimulator
            grid={grid}
            currentPicks={picks}
            futureValues={futureValues}
            onApplyPath={handleApplyOptimalPath}
          />
        )}
      </div>
    </div>
  );
}
