// src/components/survivor/SurvivorMatrixGrid.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// 18-Week Survivor Contest Matrix & Heatmap Grid
// Features:
// 1. Horizontal Strike-Through for burned teams (Rose beam across row)
// 2. Vertical Guideline for selected weekly picks (Gold beam down column)
// 3. Interactive Hover Crosshairs (Dynamic Purple Laser Row + Column on hover)
// 4. Interactive Key/Legend Tier Filtering (Focus on Heavy/Solid Favs)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Flame,
  ArrowUpDown,
  Filter,
  Eye,
  Crosshair,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { getFavoriteTier, getBurnedTeams, isTeamAvailable } from '../../lib/survivorAlpha.js';
import { formatDeadline } from '../../lib/alphaDeadlines.js';

export default function SurvivorMatrixGrid({
  grid,
  futureValues = {},
  currentPicks = {},
  onSelectPick,
  onRemovePick,
  activeWeek = 1,
  onWeekChange,
}) {
  const [sortMode, setSortMode] = useState('fv'); // 'fv' | 'division' | 'alpha'
  const [conferenceFilter, setConferenceFilter] = useState('ALL'); // 'ALL' | 'AFC' | 'NFC'
  const [hoveredCell, setHoveredCell] = useState(null); // { team: string, week: number } | null
  const [showCrosshairs, setShowCrosshairs] = useState(true);

  // Interactive Tier Filter (e.g. filter for heavy_favorite & moderate_favorite)
  const [activeTiers, setActiveTiers] = useState(new Set()); // Empty set = show all

  const allTeams = useMemo(() => {
    if (!grid?.teams) return [];
    let list = Object.values(grid.teams);

    if (conferenceFilter !== 'ALL') {
      list = list.filter((t) => t.conference === conferenceFilter);
    }

    if (sortMode === 'fv') {
      list.sort((a, b) => {
        const fvA = futureValues[a.teamAbbr]?.fvScore ?? 0;
        const fvB = futureValues[b.teamAbbr]?.fvScore ?? 0;
        return fvB - fvA;
      });
    } else if (sortMode === 'division') {
      list.sort((a, b) => (a.division || '').localeCompare(b.division || '') || a.teamAbbr.localeCompare(b.teamAbbr));
    } else {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return list;
  }, [grid?.teams, futureValues, sortMode, conferenceFilter]);

  const burnedTeams = useMemo(() => getBurnedTeams(currentPicks), [currentPicks]);
  const pickedWeeks = useMemo(() => {
    const map = {};
    for (const [w, team] of Object.entries(currentPicks)) {
      if (team) map[Number(w)] = team;
    }
    return map;
  }, [currentPicks]);

  const weeksList = Array.from({ length: 18 }, (_, i) => i + 1);

  // Toggle a tier in the active filter set
  const toggleTierFilter = (tierId) => {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) {
        next.delete(tierId);
      } else {
        next.add(tierId);
      }
      return next;
    });
  };

  const clearTierFilter = () => {
    setActiveTiers(new Set());
  };

  const isTierFilterActive = activeTiers.size > 0;

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters, Sort, Crosshair Toggle, and Interactive High-Contrast Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sorting */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2 flex items-center gap-1">
              <ArrowUpDown size={11} /> Sort:
            </span>
            <button
              onClick={() => setSortMode('fv')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                sortMode === 'fv'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Future Value (FV)
            </button>
            <button
              onClick={() => setSortMode('division')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                sortMode === 'division'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Division
            </button>
            <button
              onClick={() => setSortMode('alpha')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                sortMode === 'alpha'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Alphabetical
            </button>
          </div>

          {/* Conference Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2 flex items-center gap-1">
              <Filter size={11} /> Conf:
            </span>
            {['ALL', 'AFC', 'NFC'].map((conf) => (
              <button
                key={conf}
                onClick={() => setConferenceFilter(conf)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  conferenceFilter === conf
                    ? 'bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {conf}
              </button>
            ))}
          </div>

          {/* Visual Crosshair Strike-Through Toggle */}
          <button
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showCrosshairs
                ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-lg shadow-purple-900/40 ring-2 ring-purple-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair size={14} className={showCrosshairs ? 'text-purple-300 animate-spin-slow' : 'text-slate-500'} />
            Crosshair Guides: <strong className={showCrosshairs ? 'text-purple-300 font-black' : 'text-slate-500'}>{showCrosshairs ? 'ON' : 'OFF'}</strong>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE TIER FILTER LEGEND                                      */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-0.5 flex items-center gap-1">
            <Filter size={10} /> Filter Key:
          </span>

          {/* Heavy Fav Toggle */}
          <button
            onClick={() => toggleTierFilter('heavy_favorite')}
            title="Click to toggle Heavy Favorites on the grid"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 transition-all cursor-pointer select-none ${
              activeTiers.has('heavy_favorite')
                ? 'bg-emerald-500 text-slate-950 font-black border-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400 scale-105'
                : isTierFilterActive
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400/60 opacity-60 hover:opacity-100'
                : 'bg-emerald-950 border-emerald-400 text-emerald-200 hover:brightness-125'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeTiers.has('heavy_favorite') ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
            Heavy Fav (&gt;75%)
            {activeTiers.has('heavy_favorite') && <Check size={12} className="stroke-[3]" />}
          </button>

          {/* Solid Fav Toggle */}
          <button
            onClick={() => toggleTierFilter('moderate_favorite')}
            title="Click to toggle Solid Favorites on the grid"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 transition-all cursor-pointer select-none ${
              activeTiers.has('moderate_favorite')
                ? 'bg-teal-400 text-slate-950 font-black border-white shadow-lg shadow-teal-500/40 ring-2 ring-teal-300 scale-105'
                : isTierFilterActive
                ? 'bg-teal-950/40 border-teal-500/30 text-teal-300/60 opacity-60 hover:opacity-100'
                : 'bg-teal-950 border-teal-400 text-teal-200 hover:brightness-125'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeTiers.has('moderate_favorite') ? 'bg-slate-950' : 'bg-teal-400'}`}></span>
            Solid Fav (60-74%)
            {activeTiers.has('moderate_favorite') && <Check size={12} className="stroke-[3]" />}
          </button>

          {/* Tossup Toggle */}
          <button
            onClick={() => toggleTierFilter('slight_favorite')}
            title="Click to toggle Tossups on the grid"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
              activeTiers.has('slight_favorite')
                ? 'bg-slate-200 text-slate-950 font-black border-white shadow-lg ring-2 ring-slate-300 scale-105'
                : isTierFilterActive
                ? 'bg-slate-900/40 border-slate-700 text-slate-500 opacity-60 hover:opacity-100'
                : 'bg-slate-900 border-slate-500 text-slate-200 hover:brightness-125'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeTiers.has('slight_favorite') ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
            Tossup (50-59%)
            {activeTiers.has('slight_favorite') && <Check size={12} className="stroke-[3]" />}
          </button>

          {/* Slight Dog Toggle */}
          <button
            onClick={() => toggleTierFilter('slight_underdog')}
            title="Click to toggle Slight Underdogs on the grid"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
              activeTiers.has('slight_underdog')
                ? 'bg-amber-400 text-slate-950 font-black border-white shadow-lg ring-2 ring-amber-300 scale-105'
                : isTierFilterActive
                ? 'bg-amber-950/30 border-amber-800 text-amber-500/60 opacity-60 hover:opacity-100'
                : 'bg-amber-950/90 border-amber-500 text-amber-200 hover:brightness-125'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeTiers.has('slight_underdog') ? 'bg-slate-950' : 'bg-amber-400'}`}></span>
            Slight Dog
            {activeTiers.has('slight_underdog') && <Check size={12} className="stroke-[3]" />}
          </button>

          {/* Heavy Dog Toggle */}
          <button
            onClick={() => toggleTierFilter('heavy_underdog')}
            title="Click to toggle Heavy Underdogs on the grid"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
              activeTiers.has('heavy_underdog')
                ? 'bg-rose-500 text-white font-black border-white shadow-lg ring-2 ring-rose-400 scale-105'
                : isTierFilterActive
                ? 'bg-rose-950/30 border-rose-900 text-rose-500/60 opacity-60 hover:opacity-100'
                : 'bg-rose-950/90 border-rose-500 text-rose-200 hover:brightness-125'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeTiers.has('heavy_underdog') ? 'bg-white' : 'bg-rose-400'}`}></span>
            Dog (&lt;40%)
            {activeTiers.has('heavy_underdog') && <Check size={12} className="stroke-[3]" />}
          </button>

          {/* Reset Filter Button */}
          {isTierFilterActive && (
            <button
              onClick={clearTierFilter}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-600 transition-all ml-1 shadow-sm"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 18-Week Interactive Scrollable Grid */}
      <div className="bg-slate-950 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl relative w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[960px] 2xl:min-w-full">
            <thead>
              <tr className="bg-slate-900 border-b-2 border-slate-700 text-[10px] xl:text-[11px] font-black uppercase text-slate-300 tracking-wider">
                <th className="py-2.5 px-2.5 sticky left-0 z-30 bg-slate-900 border-r-2 border-slate-700 w-32 xl:w-36">
                  NFL Team
                </th>
                <th className="py-2.5 px-1 border-r-2 border-slate-700 text-center w-11 xl:w-12 text-emerald-400 font-mono">
                  FV
                </th>
                {weeksList.map((w) => {
                  const isCurrentWeek = w === activeWeek;
                  const pickedInWeek = pickedWeeks[w];
                  const isHoveredCol = showCrosshairs && hoveredCell?.week === w;

                  return (
                    <th
                      key={w}
                      onClick={() => onWeekChange && onWeekChange(w)}
                      className={`py-2 px-0.5 text-center border-r border-slate-700/80 cursor-pointer transition-all min-w-[44px] xl:min-w-0 relative ${
                        isHoveredCol
                          ? 'bg-purple-900/60 text-purple-200 ring-1 ring-purple-400'
                          : pickedInWeek
                          ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 text-amber-300 border-b-2 border-b-amber-400'
                          : isCurrentWeek
                          ? 'bg-emerald-950/70 text-emerald-300 font-black'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      {/* Vertical Header Laser Top Anchor */}
                      {isHoveredCol && (
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,1)] z-30"></div>
                      )}
                      {pickedInWeek && (
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] z-30"></div>
                      )}

                      <div className="text-[10px] font-bold leading-none">Wk {w}</div>
                      {pickedInWeek ? (
                        <div className="text-[9px] font-mono text-amber-300 truncate font-black mt-0.5 bg-amber-500/20 px-0.5 py-0.5 rounded border border-amber-400/40 flex items-center justify-center gap-0.5">
                          <Trophy size={8} className="text-amber-400 flex-shrink-0" /> {pickedInWeek}
                        </div>
                      ) : (
                        <div className="text-[8px] font-mono text-slate-500 mt-0.5">-</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {allTeams.map((team) => {
                const teamAbbr = team.teamAbbr;
                const fvData = futureValues[teamAbbr] || { fvScore: 0, tier: '' };
                const isBurned = burnedTeams.includes(teamAbbr);
                const weekPicked = Object.keys(currentPicks).find((w) => currentPicks[w] === teamAbbr);
                const isHoveredRow = showCrosshairs && hoveredCell?.team === teamAbbr;

                return (
                  <tr
                    key={teamAbbr}
                    className={`transition-colors relative ${
                      isHoveredRow
                        ? 'bg-purple-950/35'
                        : isBurned
                        ? 'bg-slate-950/60'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Team Column (Sticky Left) */}
                    <td
                      className={`py-2 px-2.5 sticky left-0 z-20 border-r-2 border-slate-700 flex items-center justify-between gap-1.5 transition-colors ${
                        isHoveredRow ? 'bg-purple-950 border-purple-400' : 'bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {team.logo ? (
                          <img src={team.logo} alt={teamAbbr} className="w-5 h-5 object-contain flex-shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                            {teamAbbr}
                          </span>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-white text-xs leading-none">{teamAbbr}</span>
                          <span className="text-[9px] text-slate-400 block truncate font-sans">{team.name}</span>
                        </div>
                      </div>

                      {isBurned && (
                        <span
                          title={`Burned in Week ${weekPicked}`}
                          className="px-1 py-0.5 rounded text-[8px] font-black uppercase bg-rose-950 text-rose-200 border border-rose-500 shadow-sm flex-shrink-0"
                        >
                          Wk {weekPicked}
                        </span>
                      )}
                    </td>

                    {/* Future Value Score */}
                    <td
                      title={`${team.fullName}: FV ${fvData.fvScore}/10 (${fvData.tier})`}
                      className={`py-2 px-1 border-r-2 border-slate-700 text-center font-bold ${
                        isHoveredRow ? 'bg-purple-950/40' : 'bg-slate-950'
                      }`}
                    >
                      <span
                        className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold ${
                          fvData.fvScore >= 7.5
                            ? 'bg-emerald-900 text-emerald-200 border border-emerald-400'
                            : fvData.fvScore >= 5.0
                            ? 'bg-teal-900 text-teal-200 border border-teal-400'
                            : fvData.fvScore >= 2.5
                            ? 'bg-slate-800 text-slate-200 border border-slate-600'
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {fvData.fvScore.toFixed(1)}
                      </span>
                    </td>

                    {/* Weeks 1–18 Cells */}
                    {weeksList.map((w) => {
                      const cell = team.weeks[w];
                      const isPickedHere = currentPicks[w] === teamAbbr;
                      const isBurnedElsewhere = isBurned && !isPickedHere;
                      const isHoveredCol = showCrosshairs && hoveredCell?.week === w;
                      const isColOccupied = Boolean(pickedWeeks[w]);
                      const isExactHoveredCell = showCrosshairs && hoveredCell?.team === teamAbbr && hoveredCell?.week === w;

                      if (!cell || cell.isBye) {
                        return (
                          <td
                            key={w}
                            onMouseEnter={() => setHoveredCell({ team: teamAbbr, week: w })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`py-2 px-0.5 text-center border-r border-slate-800/80 bg-slate-950/90 text-slate-600 text-[9px] font-mono select-none relative ${
                              isHoveredRow || isHoveredCol ? 'bg-purple-950/20' : ''
                            } ${isBurnedElsewhere ? 'opacity-40' : ''} ${
                              isTierFilterActive ? 'opacity-20' : ''
                            }`}
                          >
                            {/* 1. Dynamic Hover Crosshair Lasers (Row & Col) */}
                            {isHoveredRow && (
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-purple-400/80 shadow-[0_0_6px_rgba(192,132,252,0.9)] pointer-events-none z-20"></div>
                            )}
                            {isHoveredCol && (
                              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-purple-400/80 shadow-[0_0_6px_rgba(192,132,252,0.9)] pointer-events-none z-20"></div>
                            )}

                            {/* 2. Horizontal Strike line across burned team */}
                            {isBurnedElsewhere && (
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-rose-500/90 shadow-[0_0_6px_rgba(244,63,94,0.9)] pointer-events-none z-10"></div>
                            )}

                            {/* 3. Vertical Guideline down occupied week */}
                            {isColOccupied && !isPickedHere && (
                              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400/50 shadow-[0_0_4px_rgba(251,191,36,0.6)] pointer-events-none z-10"></div>
                            )}

                            BYE
                          </td>
                        );
                      }

                      const tier = getFavoriteTier(cell.winProb, cell.spread);
                      const isWin = cell.result === 'WIN';
                      const isLoss = cell.result === 'LOSS';

                      // Tier Filter Match
                      const matchesTierFilter = !isTierFilterActive || activeTiers.has(tier.tier);
                      const isDimmedByFilter = isTierFilterActive && !matchesTierFilter && !isPickedHere;

                      const isTrapHere =
                        isPickedHere &&
                        !cell.isLocked &&
                        !cell.result &&
                        ((typeof cell.winProb === 'number' && cell.winProb < 0.60) ||
                          (typeof cell.spread === 'number' && cell.spread > -3.5));

                      return (
                        <td
                          key={w}
                          onMouseEnter={() => setHoveredCell({ team: teamAbbr, week: w })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            if (cell.isLocked) return;
                            if (isPickedHere) {
                              onRemovePick && onRemovePick(w);
                            } else {
                              onSelectPick && onSelectPick(w, teamAbbr);
                            }
                          }}
                          title={
                            isTrapHere
                              ? `⚠️ TRAP ALERT! ${teamAbbr} win prob ${(cell.winProb * 100).toFixed(1)}% (spread ${cell.spread > 0 ? '+' : ''}${cell.spread}) has fallen into dangerous toss-up territory. Consider pivoting!`
                              : `${teamAbbr} ${cell.isHome ? 'vs' : '@'} ${cell.opponent} | Spread: ${cell.spread > 0 ? '+' : ''}${cell.spread} | Win: ${(cell.winProb * 100).toFixed(1)}% | ${formatDeadline(cell.kickoff_utc)}`
                          }
                          className={`py-1 px-0.5 text-center border-r border-slate-800 cursor-pointer transition-all relative select-none ${
                            isPickedHere
                              ? isTrapHere
                                ? 'bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 border-2 border-rose-300 text-slate-950 font-black shadow-xl shadow-rose-500/50 scale-[1.05] z-30 ring-2 ring-rose-400 animate-pulse'
                                : 'bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-200 text-slate-950 font-black shadow-xl shadow-amber-500/50 scale-[1.04] z-30 ring-2 ring-amber-300'
                              : isDimmedByFilter
                              ? 'opacity-20 grayscale brightness-50 bg-slate-950 border-slate-900 text-slate-700 hover:opacity-60'
                              : isBurnedElsewhere
                              ? 'bg-slate-950/90 opacity-45 hover:opacity-80 border-slate-800'
                              : tier.bgClass
                          } ${cell.isLocked ? 'cursor-not-allowed opacity-75' : ''} ${
                            isHoveredRow && !isPickedHere && !isDimmedByFilter ? 'brightness-110' : ''
                          } ${isHoveredCol && !isPickedHere && !isDimmedByFilter ? 'brightness-110' : ''} ${
                            isExactHoveredCell ? 'ring-2 ring-purple-400 z-20' : ''
                          }`}
                        >
                          {/* ────────────────────────────────────────────────────────── */}
                          {/* 1. DYNAMIC HOVER CROSSHAIR LASERS (Row + Col)             */}
                          {/* ────────────────────────────────────────────────────────── */}
                          {isHoveredRow && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-purple-400/90 shadow-[0_0_8px_rgba(192,132,252,1)] pointer-events-none z-20"></div>
                          )}
                          {isHoveredCol && (
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-purple-400/90 shadow-[0_0_8px_rgba(192,132,252,1)] pointer-events-none z-20"></div>
                          )}

                          {/* ────────────────────────────────────────────────────────── */}
                          {/* 2. HORIZONTAL STRIKE-THROUGH (Burned Team Row)            */}
                          {/* ────────────────────────────────────────────────────────── */}
                          {isBurnedElsewhere && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)] pointer-events-none z-10"></div>
                          )}

                          {/* ────────────────────────────────────────────────────────── */}
                          {/* 3. VERTICAL COLUMN GUIDELINE (Occupied Week Column)       */}
                          {/* ────────────────────────────────────────────────────────── */}
                          {isColOccupied && !isPickedHere && (
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400/60 shadow-[0_0_5px_rgba(251,191,36,0.7)] pointer-events-none z-10"></div>
                          )}

                          {/* Cell Content */}
                          <div className="flex flex-col items-center justify-center leading-tight py-0.5 relative z-10">
                            {/* Opponent & Venue */}
                            <div
                              className={`flex items-center gap-0.5 text-[9px] font-bold ${
                                isPickedHere ? 'text-slate-950' : isDimmedByFilter ? 'text-slate-600' : 'text-white'
                              }`}
                            >
                              <span className={isPickedHere ? 'text-slate-900 font-normal' : 'text-slate-400'}>
                                {cell.isHome ? 'v' : '@'}
                              </span>
                              <span className="font-bold">{cell.opponent}</span>
                            </div>

                            {/* Spread & Win Prob Highlight Pill */}
                            <div
                              className={`text-[8.5px] font-mono mt-0.5 px-0.5 rounded leading-tight ${
                                isPickedHere
                                  ? isTrapHere
                                    ? 'bg-rose-950 text-rose-200 border border-rose-300 font-black'
                                    : 'bg-slate-950 text-amber-300 font-black'
                                  : isDimmedByFilter
                                  ? 'bg-slate-900 text-slate-600'
                                  : tier.pillClass
                              }`}
                            >
                              {cell.spread <= 0 ? cell.spread : `+${cell.spread}`}
                            </div>

                            {/* Picked Trophy Crown / Trap Badge */}
                            {isPickedHere && (
                              <div
                                className={`absolute -top-2 -right-1 rounded-full p-0.5 border shadow-md flex items-center gap-0.5 ${
                                  isTrapHere
                                    ? 'bg-rose-950 text-rose-300 border-rose-400'
                                    : 'bg-slate-950 text-amber-400 border-amber-300'
                                }`}
                              >
                                {isTrapHere ? (
                                  <AlertTriangle size={9} className="text-rose-300" />
                                ) : (
                                  <Trophy size={10} />
                                )}
                              </div>
                            )}

                            {/* Trap Indicator Banner in Cell */}
                            {isTrapHere && (
                              <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit bg-rose-900 text-rose-100 font-black text-[7px] px-1 rounded-full shadow border border-rose-400/80">
                                TRAP
                              </div>
                            )}

                            {/* Lock Icon */}
                            {cell.isLocked && (
                              <div className="absolute top-0.5 left-0.5 text-slate-400 opacity-80">
                                <Lock size={8} />
                              </div>
                            )}

                            {/* Result Badges */}
                            {isWin && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                                <CheckCircle2 size={8} />
                              </div>
                            )}

                            {isLoss && (
                              <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5">
                                <XCircle size={8} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
