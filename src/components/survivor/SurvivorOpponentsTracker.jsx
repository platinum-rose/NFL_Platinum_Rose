// src/components/survivor/SurvivorOpponentsTracker.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Survivor Opponents & Field Availability Matrix
//
// Features:
// 1. Full Pool Roster Grid (Opponents x Weeks 1-18)
// 2. Field Team Availability Matrix (Burned vs Available across surviving pool)
// 3. High-Leverage Contrarian Edge identification
// 4. Quick Add, Bulk Import, Edit & Auto-Grade for pool players
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trophy,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  calculateFieldExposure,
  autoGradeOpponents,
  getFavoriteTier,
} from '../../lib/survivorAlpha.js';
import { NFL_TEAMS, getTeamAbbreviation } from '../../lib/teams.js';

export default function SurvivorOpponentsTracker({
  contest,
  opponents = [],
  myPicks = {},
  grid,
  activeWeek = 1,
  onUpdateOpponents,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ALIVE' | 'ELIMINATED'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [bulkText, setBulkText] = useState('');

  // Quick cell picker state: { opponentId, week, currentTeam }
  const [editingCell, setEditingCell] = useState(null);

  const weeksList = Array.from({ length: 18 }, (_, i) => i + 1);
  const allTeamAbbrs = useMemo(() => Object.values(NFL_TEAMS).map((t) => t.abbreviation), []);

  // Compute field analytics
  const fieldAnalytics = useMemo(() => {
    return calculateFieldExposure(opponents, activeWeek, grid, myPicks);
  }, [opponents, activeWeek, grid, myPicks]);

  // Filtered opponents list
  const filteredOpponents = useMemo(() => {
    let list = [...opponents];
    if (statusFilter === 'ALIVE') {
      list = list.filter((o) => o.status !== 'eliminated');
    } else if (statusFilter === 'ELIMINATED') {
      list = list.filter((o) => o.status === 'eliminated');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((o) => o.name.toLowerCase().includes(q));
    }

    return list;
  }, [opponents, statusFilter, searchTerm]);

  // Handlers
  const handleAddOpponent = (e) => {
    e?.preventDefault();
    if (!newPlayerName.trim()) return;

    const newOpp = {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newPlayerName.trim(),
      status: 'alive',
      eliminatedWeek: null,
      picks: {},
    };

    onUpdateOpponents([...opponents, newOpp]);
    setNewPlayerName('');
    setShowAddModal(false);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newEntries = lines.map((line, idx) => {
      // Check if line format is "Name, KC, SF, BAL" or just "Name"
      const parts = line.split(/[,\t]/).map((p) => p.trim()).filter(Boolean);
      const name = parts[0] || `Player ${idx + 1}`;
      const picks = {};

      for (let i = 1; i < parts.length; i += 1) {
        const team = getTeamAbbreviation(parts[i]) || parts[i].toUpperCase();
        if (allTeamAbbrs.includes(team)) {
          picks[i] = team;
        }
      }

      return {
        id: `opp_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        status: 'alive',
        eliminatedWeek: null,
        picks,
      };
    });

    const graded = autoGradeOpponents([...opponents, ...newEntries], grid);
    onUpdateOpponents(graded);
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleDeleteOpponent = (id) => {
    if (window.confirm('Remove this competitor from the contest tracking roster?')) {
      onUpdateOpponents(opponents.filter((o) => o.id !== id));
    }
  };

  const handleSetOpponentPick = (oppId, week, teamAbbr) => {
    const updated = opponents.map((opp) => {
      if (opp.id === oppId) {
        const nextPicks = { ...opp.picks };
        if (teamAbbr) {
          nextPicks[week] = teamAbbr;
        } else {
          delete nextPicks[week];
        }
        return { ...opp, picks: nextPicks };
      }
      return opp;
    });

    const graded = autoGradeOpponents(updated, grid);
    onUpdateOpponents(graded);
    setEditingCell(null);
  };

  const handleAutoGrade = () => {
    const graded = autoGradeOpponents(opponents, grid);
    onUpdateOpponents(graded);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* POOL HEADER & QUICK STATS                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Users size={14} className="text-indigo-300" />
              {contest?.name || "Ken's Survival League"} · Opponents &amp; Field Roster
            </div>
            <h2 className="text-white font-black text-lg md:text-xl mt-0.5">
              Competitor Picks &amp; Field Availability Intelligence
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 font-sans">
              Track what teams your competitors have burned, monitor surviving field attrition, and spot high-leverage contrarian windows.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all"
            >
              <UserPlus size={13} /> Add Player
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Upload size={13} /> Bulk Roster
            </button>
            <button
              onClick={handleAutoGrade}
              title="Re-check all players against final scores"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} /> Auto-Grade
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Surviving Players */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Surviving Field</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {fieldAnalytics.aliveCount} <span className="text-slate-500 text-sm">/ {fieldAnalytics.totalCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {fieldAnalytics.survivalRate}% of pool alive
            </div>
          </div>

          {/* Eliminated Players */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Eliminated Entries</div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {fieldAnalytics.eliminatedCount}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Knocked out of the contest
            </div>
          </div>

          {/* Win Equity */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Your Implied Equity</div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
              {fieldAnalytics.aliveCount > 0 ? `${(100 / fieldAnalytics.aliveCount).toFixed(1)}%` : '100%'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              1 in {Math.max(1, fieldAnalytics.aliveCount)} remaining paths
            </div>
          </div>

          {/* Current Week Chalk */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Wk {activeWeek} Pool Chalk</div>
            <div className="text-xl font-black text-purple-300 font-mono mt-0.5 truncate">
              {fieldAnalytics.weekDistribution[0]
                ? `${fieldAnalytics.weekDistribution[0].team} (${fieldAnalytics.weekDistribution[0].pct}%)`
                : 'No picks yet'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {fieldAnalytics.weekDistribution[0]
                ? `${fieldAnalytics.weekDistribution[0].count} players on this pick`
                : 'Log picks to see field share'}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: FIELD TEAM AVAILABILITY MATRIX                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Flame size={15} className="text-amber-400" />
              Field Team Availability &amp; Leverage Matrix
            </h3>
            <p className="text-slate-400 text-[11px] font-sans">
              Shows how many surviving competitors hold each team vs how many have already burned them.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full w-fit">
            💎 High Leverage = You hold team &amp; 50%+ of field burned it
          </span>
        </div>

        {/* Teams Availability Grid Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {Object.values(fieldAnalytics.teamAvailability)
            .sort((a, b) => b.burnedPct - a.burnedPct)
            .map((item) => {
              const teamMeta = NFL_TEAMS[item.team];
              return (
                <div
                  key={item.team}
                  className={`p-2 rounded-xl border transition-all ${
                    item.isHighLeverage
                      ? 'bg-gradient-to-br from-emerald-950/80 to-purple-950/80 border-emerald-400 shadow-md shadow-emerald-950/50'
                      : !item.userAvailable
                      ? 'bg-slate-950/60 border-slate-800 opacity-60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {teamMeta?.logo ? (
                        <img src={teamMeta.logo} alt={item.team} className="w-4 h-4 object-contain" />
                      ) : null}
                      <span className="font-bold text-white text-xs">{item.team}</span>
                    </div>
                    {item.isHighLeverage && (
                      <span className="text-[9px] font-black text-emerald-300" title="High Leverage Edge">
                        💎 EDGE
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Burned:</span>
                    <span className={item.burnedPct >= 50 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {item.burnedPct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.burnedPct >= 65
                          ? 'bg-rose-500'
                          : item.burnedPct >= 35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.burnedPct}%` }}
                    ></div>
                  </div>

                  <div className="mt-1 text-[9px] font-mono flex items-center justify-between">
                    <span className={item.userAvailable ? 'text-emerald-400 font-bold' : 'text-rose-400 line-through'}>
                      {item.userAvailable ? '✓ In Your Ammo' : '✗ Burned by You'}
                    </span>
                    <span className="text-slate-500">{item.availableCount} left</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: COMPETITOR ROSTER & PICKS MATRIX                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              Pool Player Pick Grid
            </h3>

            {/* Filter alive / eliminated */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                  statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({opponents.length})
              </button>
              <button
                onClick={() => setStatusFilter('ALIVE')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                  statusFilter === 'ALIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Alive ({fieldAnalytics.aliveCount})
              </button>
              <button
                onClick={() => setStatusFilter('ELIMINATED')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                  statusFilter === 'ELIMINATED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Eliminated ({fieldAnalytics.eliminatedCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search competitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Interactive Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-left text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-[10px] font-black uppercase text-slate-400">
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-900 w-44">Player / Entry</th>
                <th className="py-2.5 px-2 text-center w-24">Status</th>
                {weeksList.map((w) => (
                  <th
                    key={w}
                    className={`py-2 px-1 text-center border-r border-slate-800 text-[10px] min-w-[50px] ${
                      w === activeWeek ? 'bg-indigo-950 text-indigo-300 font-bold' : ''
                    }`}
                  >
                    Wk {w}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {/* ──────────────────────────────────────────────────────── */}
              {/* ROW 0: MY ENTRY (Sticky at Top)                          */}
              {/* ──────────────────────────────────────────────────────── */}
              <tr className="bg-amber-950/20 border-b-2 border-amber-500/40 text-slate-100 font-bold">
                <td className="py-2.5 px-3 sticky left-0 z-10 bg-slate-950 border-r border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-amber-300 font-black">My Entry (You)</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500 text-slate-950 font-black">
                    YOU
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    ACTIVE
                  </span>
                </td>
                {weeksList.map((w) => {
                  const pick = myPicks[w];
                  return (
                    <td
                      key={w}
                      className={`py-2 px-1 text-center border-r border-slate-800 ${
                        w === activeWeek ? 'bg-amber-950/30' : ''
                      }`}
                    >
                      {pick ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm">
                          {pick}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2.5 px-2 text-center">-</td>
              </tr>

              {/* ──────────────────────────────────────────────────────── */}
              {/* OPPONENT ROWS                                            */}
              {/* ──────────────────────────────────────────────────────── */}
              {filteredOpponents.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-12 text-center text-slate-500 font-sans text-xs">
                    {opponents.length === 0
                      ? 'No competitors added yet. Click "+ Add Player" or "Bulk Roster" above to populate your pool!'
                      : 'No competitors match your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredOpponents.map((opp) => {
                  const isAlive = opp.status !== 'eliminated';

                  return (
                    <tr
                      key={opp.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        !isAlive ? 'opacity-50 bg-slate-950/60' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-slate-950 border-r border-slate-800 font-sans font-bold text-slate-200 truncate max-w-[170px]">
                        {opp.name}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2 text-center">
                        {isAlive ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            ALIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                            OUT (Wk {opp.eliminatedWeek || '?'})
                          </span>
                        )}
                      </td>

                      {/* Weeks 1–18 Picks */}
                      {weeksList.map((w) => {
                        const pick = opp.picks?.[w];
                        const isEditingThis =
                          editingCell?.opponentId === opp.id && editingCell?.week === w;

                        return (
                          <td
                            key={w}
                            onClick={() =>
                              setEditingCell(
                                isEditingThis
                                  ? null
                                  : { opponentId: opp.id, week: w, currentTeam: pick || '' }
                              )
                            }
                            className={`py-1.5 px-1 text-center border-r border-slate-800/80 cursor-pointer transition-all hover:bg-slate-800 relative ${
                              w === activeWeek ? 'bg-slate-900/60' : ''
                            }`}
                          >
                            {pick ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isAlive
                                    ? 'bg-slate-800 text-slate-100 border border-slate-600'
                                    : 'bg-rose-950/60 text-rose-300 border border-rose-900/50 line-through'
                                }`}
                              >
                                {pick}
                              </span>
                            ) : (
                              <span className="text-slate-700 text-[9px] hover:text-slate-400">+</span>
                            )}

                            {/* In-Cell Team Selector Dropdown */}
                            {isEditingThis && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-slate-900 border-2 border-indigo-500 rounded-xl p-2 shadow-2xl w-48 text-left"
                              >
                                <div className="text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                                  <span>Wk {w} Pick for {opp.name}</span>
                                  <button onClick={() => setEditingCell(null)} className="text-slate-400 hover:text-white">
                                    <X size={11} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto pr-1">
                                  <button
                                    onClick={() => handleSetOpponentPick(opp.id, w, null)}
                                    className="col-span-4 text-[9px] text-rose-400 hover:bg-rose-950/60 p-1 rounded font-bold border border-rose-800/40 text-center mb-1"
                                  >
                                    Clear Pick
                                  </button>
                                  {allTeamAbbrs.map((team) => (
                                    <button
                                      key={team}
                                      onClick={() => handleSetOpponentPick(opp.id, w, team)}
                                      className={`text-[10px] font-bold p-1 rounded transition-all text-center ${
                                        pick === team
                                          ? 'bg-indigo-600 text-white font-black'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                      }`}
                                    >
                                      {team}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteOpponent(opp.id)}
                          title="Remove player"
                          className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD SINGLE COMPETITOR                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-400" />
                Add Competitor to {contest?.name}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddOpponent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Competitor / Entry Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ken, Dave B., Entry #2"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 disabled:opacity-50"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: BULK ROSTER IMPORT                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Upload size={16} className="text-indigo-400" />
                Bulk Roster Import for {contest?.name}
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-400 text-xs">
              Paste player names (one per line). Optionally include their prior picks comma-separated (e.g.{' '}
              <code className="text-indigo-300 font-mono">John Doe, KC, SF, BAL</code>).
            </p>

            <textarea
              rows={8}
              placeholder={`Ken\nDave B., KC, BAL\nSarah T., SF\nMike W.`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 disabled:opacity-50"
              >
                Import Players
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
