// src/components/survivor/SurvivorPathSimulator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Survivor Live Path Simulation & Interactive Remaining Weeks Pathfinder
//
// Features:
// 1. Live risk simulator with compounding survival curve and bottleneck detection.
// 2. "Simulate Remaining Weeks" engine: solves optimal completion for all unselected
//    weeks while strictly preserving user's existing manual picks.
// 3. One-click "Apply Simulated Path to Card" action.
// 4. Clear distinction between 🔒 User Manual Picks and 🔮 Simulated Picks.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart2,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  simulateSurvivalPath,
  solveOptimalPaths,
  getBurnedTeams,
} from '../../lib/survivorAlpha.js';

export default function SurvivorPathSimulator({
  grid,
  currentPicks = {},
  futureValues = {},
  onApplyPath,
}) {
  const [selectedStrategy, setSelectedStrategy] = useState('max_ev'); // 'max_ev' | 'contrarian' | 'conservative'
  const [previewPicks, setPreviewPicks] = useState(null);

  // Active working picks: either previewed simulated picks or user's current card
  const activePicks = previewPicks || currentPicks;
  const isPreviewing = previewPicks !== null;

  // Run simulation on active picks
  const sim = useMemo(() => {
    return simulateSurvivalPath(activePicks, grid);
  }, [activePicks, grid]);

  // Count unselected weeks
  const unselectedWeeksCount = useMemo(() => {
    let unpicked = 0;
    for (let w = 1; w <= 18; w += 1) {
      if (!currentPicks[w]) unpicked += 1;
    }
    return unpicked;
  }, [currentPicks]);

  // Compute remaining elite future value
  const pickedTeamsSet = new Set(Object.values(activePicks).filter(Boolean));
  let burnedEliteCount = 0;

  Object.entries(futureValues).forEach(([team, data]) => {
    if (data.fvScore >= 7.0 && pickedTeamsSet.has(team)) {
      burnedEliteCount += 1;
    }
  });

  // Handler: Run Simulation on Remaining Weeks
  const handleSimulateRemaining = () => {
    if (!grid?.teams) return;

    // Solve optimal path using currentPicks as locked seeds
    const paths = solveOptimalPaths(grid, currentPicks);
    let chosenRoute = paths[0]; // Max EV default

    if (selectedStrategy === 'contrarian') {
      chosenRoute = paths[1] || paths[0];
    } else if (selectedStrategy === 'conservative') {
      chosenRoute = paths[2] || paths[0];
    }

    if (chosenRoute?.picks) {
      setPreviewPicks(chosenRoute.picks);
    }
  };

  // Handler: Commit Simulated Path to Card
  const handleCommitSimulatedPath = () => {
    if (previewPicks && onApplyPath) {
      onApplyPath(previewPicks);
      setPreviewPicks(null);
    }
  };

  // Handler: Discard Preview
  const handleDiscardPreview = () => {
    setPreviewPicks(null);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE SIMULATION CONTROL BAR                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border-2 border-purple-800/60 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Zap size={14} className="text-purple-300 animate-pulse" />
              Path Optimizer &amp; Remaining Weeks Solver
            </div>
            <h2 className="text-white font-black text-lg md:text-xl mt-0.5">
              Simulate &amp; Complete Remaining Season Picks
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Keep your existing picks locked and algorithmically solve the optimal sequence for the remaining{' '}
              <strong className="text-purple-300 font-mono">{unselectedWeeksCount} unselected weeks</strong>.
            </p>
          </div>

          {/* Strategy Selection & Run Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setSelectedStrategy('max_ev')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedStrategy === 'max_ev'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Max EV Route
              </button>
              <button
                onClick={() => setSelectedStrategy('contrarian')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedStrategy === 'contrarian'
                    ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Contrarian
              </button>
              <button
                onClick={() => setSelectedStrategy('conservative')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedStrategy === 'conservative'
                    ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                High Floor
              </button>
            </div>

            <button
              onClick={handleSimulateRemaining}
              disabled={unselectedWeeksCount === 0 && !isPreviewing}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={14} />
              {unselectedWeeksCount === 0
                ? 'Re-Simulate Path'
                : `Simulate ${unselectedWeeksCount} Remaining Weeks`}
            </button>
          </div>
        </div>

        {/* Preview Confirmation Strip (When Simulation is Active) */}
        {isPreviewing && (
          <div className="bg-purple-950/80 border-2 border-purple-400 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-white font-bold text-xs flex items-center gap-2">
                  <span>Simulated Path Generated for Remaining Weeks</span>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                    {sim.survivalProbPct} Full Survival Rate
                  </span>
                </div>
                <div className="text-purple-200 text-[11px] font-mono mt-0.5">
                  Your manual picks are preserved (🔒) and remaining weeks are completed with optimal {selectedStrategy.toUpperCase()} targets (🔮).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDiscardPreview}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleCommitSimulatedPath}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check size={14} /> Apply Simulated Path to Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cumulative Survival Rate */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
            <span>Survival Probability</span>
            <Sparkles size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {sim.survivalProbPct}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Compounded across {sim.weeksCovered} picks
          </div>
        </div>

        {/* Picks Covered */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
            <span>Picks Scheduled</span>
            <ShieldCheck size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {sim.weeksCovered} <span className="text-slate-500 text-base">/ 18</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {18 - sim.weeksCovered} weeks remaining to complete
          </div>
        </div>

        {/* Bottleneck Week */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
            <span>Critical Bottleneck</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 mt-1 font-mono truncate">
            {sim.bottleneck ? `Wk ${sim.bottleneck.week}: ${sim.bottleneck.team}` : 'None'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {sim.bottleneck
              ? `${(sim.bottleneck.winProb * 100).toFixed(1)}% win prob vs ${sim.bottleneck.opponent}`
              : 'Add picks to evaluate risk'}
          </div>
        </div>

        {/* Elite Preservation */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-bold">
            <span>Tier-1 Reserved</span>
            <Flame size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">
            {Math.max(0, 6 - burnedEliteCount)} <span className="text-slate-500 text-base">/ 6</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Cornerstone teams saved for late weeks
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {!sim.isValid && sim.violations.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 shadow-lg space-y-1">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase">
            <AlertTriangle size={15} /> Rule Violations Detected
          </div>
          <ul className="list-disc list-inside text-xs text-rose-200 font-mono space-y-0.5">
            {sim.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Week-by-Week Survival Curve Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-400" />
            18-Week Compounding Survival Trajectory
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Joint Survival = P(W1) × P(W2) × ... × P(Wn)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                <th className="py-2.5 px-3">Week</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Picked Team</th>
                <th className="py-2.5 px-3">Matchup</th>
                <th className="py-2.5 px-3 text-right">Spread</th>
                <th className="py-2.5 px-3 text-right">Win Prob</th>
                <th className="py-2.5 px-3 text-right">Joint Survival %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-[11px]">
              {sim.steps.map((step) => {
                const isUserManualPick = Boolean(currentPicks[step.week]);
                const isSimulatedPick = isPreviewing && !isUserManualPick && Boolean(previewPicks[step.week]);
                const isUnpicked = !step.team;
                const isWin = step.result === 'WIN';
                const isLoss = step.result === 'LOSS';

                return (
                  <tr
                    key={step.week}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      isSimulatedPick
                        ? 'bg-purple-950/20 text-purple-100'
                        : isUserManualPick
                        ? 'bg-amber-950/15 text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-300">Week {step.week}</td>

                    {/* Pick Type Badge */}
                    <td className="py-2.5 px-3">
                      {isUserManualPick ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1 w-fit">
                          <Lock size={9} /> Manual
                        </span>
                      ) : isSimulatedPick ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold flex items-center gap-1 w-fit">
                          <Sparkles size={9} /> Simulated
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[9px]">-</span>
                      )}
                    </td>

                    {/* Picked Team */}
                    <td className="py-2.5 px-3 font-bold">
                      {step.team ? (
                        <span
                          className={
                            isUserManualPick
                              ? 'text-amber-400 font-black text-sm'
                              : 'text-purple-300 font-black text-sm'
                          }
                        >
                          {step.team}
                        </span>
                      ) : (
                        <span className="italic text-slate-600">Unselected</span>
                      )}
                    </td>

                    {/* Matchup */}
                    <td className="py-2.5 px-3">
                      {step.opponent ? (
                        <span className="font-sans">
                          {step.isHome ? 'vs' : '@'} <strong className="text-slate-200">{step.opponent}</strong>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Spread */}
                    <td className="py-2.5 px-3 text-right">
                      {step.spread != null
                        ? step.spread <= 0
                          ? step.spread
                          : `+${step.spread}`
                        : '-'}
                    </td>

                    {/* Win Prob */}
                    <td className="py-2.5 px-3 text-right font-bold">
                      {step.winProb > 0 ? (
                        <span
                          className={
                            step.winProb >= 0.75
                              ? 'text-emerald-400'
                              : step.winProb >= 0.60
                              ? 'text-teal-300'
                              : 'text-amber-300'
                          }
                        >
                          {(step.winProb * 100).toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Joint Survival */}
                    <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                      {step.team ? `${(step.cumulativeProb * 100).toFixed(2)}%` : '-'}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center">
                      {isWin ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                          SURVIVED
                        </span>
                      ) : isLoss ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                          ELIMINATED
                        </span>
                      ) : step.team ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSimulatedPick
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isSimulatedPick ? 'PROPOSED' : 'SCHEDULED'}
                        </span>
                      ) : (
                        <span className="text-slate-700">-</span>
                      )}
                    </td>
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
