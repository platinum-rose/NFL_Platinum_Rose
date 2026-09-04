// src/components/survivor/SurvivorWeeklyPicker.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Granular Week-by-Week Matchup Picker for Survivor Pools
//
// Shows all matchups for the active week with team future value badges,
// kickoff deadlines, straight-up win probabilities, and pick controls.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Lock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getFavoriteTier, isTeamAvailable, getBurnedTeams } from '../../lib/survivorAlpha.js';
import { formatDeadline } from '../../lib/alphaDeadlines.js';

export default function SurvivorWeeklyPicker({
  grid,
  futureValues = {},
  currentPicks = {},
  activeWeek = 1,
  onWeekChange,
  onSelectPick,
  onRemovePick,
}) {
  const weekSummary = grid?.weekSummaries?.[activeWeek];
  const weekGames = weekSummary?.games || [];
  const currentWeekPick = currentPicks[activeWeek] || null;
  const burnedTeams = getBurnedTeams(currentPicks, activeWeek);

  const handlePrevWeek = () => {
    if (activeWeek > 1) onWeekChange(activeWeek - 1);
  };

  const handleNextWeek = () => {
    if (activeWeek < 18) onWeekChange(activeWeek + 1);
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            disabled={activeWeek <= 1}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white font-black text-base">Week {activeWeek}</span>
            <span className="text-[11px] font-mono text-slate-400">({weekGames.length} Games)</span>
          </div>

          <button
            onClick={handleNextWeek}
            disabled={activeWeek >= 18}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Current Pick Status */}
        <div className="flex items-center gap-2">
          {currentWeekPick ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <Trophy size={14} className="text-amber-400" />
              <div className="text-xs">
                <span className="text-slate-400">Week {activeWeek} Pick:</span>{' '}
                <strong className="text-amber-300 font-mono">{currentWeekPick}</strong>
              </div>
              <button
                onClick={() => onRemovePick && onRemovePick(activeWeek)}
                className="text-[10px] text-rose-400 hover:text-rose-300 ml-1 underline font-mono"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono italic">
              No pick selected for Week {activeWeek}
            </div>
          )}
        </div>
      </div>

      {/* Matchup Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {weekGames.map((game) => {
          const homeTeam = grid?.teams?.[game.home];
          const visitorTeam = grid?.teams?.[game.visitor];
          const homeCell = homeTeam?.weeks[activeWeek];
          const visitorCell = visitorTeam?.weeks[activeWeek];

          const homeFv = futureValues[game.home]?.fvScore ?? 0;
          const visitorFv = futureValues[game.visitor]?.fvScore ?? 0;

          const isHomePicked = currentWeekPick === game.home;
          const isVisitorPicked = currentWeekPick === game.visitor;

          const homeAvailable = isTeamAvailable(game.home, currentPicks, activeWeek);
          const visitorAvailable = isTeamAvailable(game.visitor, currentPicks, activeWeek);

          const homeTier = getFavoriteTier(game.homeWinProb, game.homeSpread);
          const visitorTier = getFavoriteTier(game.visitorWinProb, -game.homeSpread);

          return (
            <div
              key={game.gameId}
              className={`bg-slate-950 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                isHomePicked || isVisitorPicked
                  ? 'border-amber-500/80 ring-1 ring-amber-500/40 shadow-lg shadow-amber-900/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Kickoff Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  {formatDeadline(game.kickoff_utc)}
                </span>
                {game.isLocked && (
                  <span className="flex items-center gap-1 text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              {/* Sides (Visitor vs Home) */}
              <div className="space-y-2.5">
                {/* Visitor Team Row */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    isVisitorPicked
                      ? 'bg-amber-500/20 border-amber-400'
                      : visitorTier.bgClass
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {visitorTeam?.logo ? (
                      <img src={visitorTeam.logo} alt={game.visitor} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="w-7 h-7 rounded bg-slate-800 text-xs font-bold flex items-center justify-center">
                        {game.visitor}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-sm">{game.visitor}</span>
                        <span className="text-[10px] text-slate-400">(@ {game.home})</span>
                        {!visitorAvailable && (
                          <span className="px-1 py-0.2 rounded text-[8px] bg-rose-950 text-rose-300 font-bold border border-rose-800/40 uppercase">
                            Burned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Spread: <strong className="text-slate-200">{-game.homeSpread > 0 ? `+${-game.homeSpread}` : -game.homeSpread}</strong> • Win: <strong className={visitorTier.textClass}>{(game.visitorWinProb * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      title={`Future Value: ${visitorFv.toFixed(1)}/10`}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      FV {visitorFv.toFixed(1)}
                    </span>
                    <button
                      onClick={() => {
                        if (game.isLocked) return;
                        if (isVisitorPicked) onRemovePick && onRemovePick(activeWeek);
                        else onSelectPick && onSelectPick(activeWeek, game.visitor);
                      }}
                      disabled={game.isLocked || (!visitorAvailable && !isVisitorPicked)}
                      className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                        isVisitorPicked
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : visitorAvailable
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {isVisitorPicked ? 'Picked' : 'Pick'}
                    </button>
                  </div>
                </div>

                {/* Home Team Row */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    isHomePicked
                      ? 'bg-amber-500/20 border-amber-400'
                      : homeTier.bgClass
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {homeTeam?.logo ? (
                      <img src={homeTeam.logo} alt={game.home} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="w-7 h-7 rounded bg-slate-800 text-xs font-bold flex items-center justify-center">
                        {game.home}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-sm">{game.home}</span>
                        <span className="text-[10px] text-slate-400">(vs {game.visitor})</span>
                        {!homeAvailable && (
                          <span className="px-1 py-0.2 rounded text-[8px] bg-rose-950 text-rose-300 font-bold border border-rose-800/40 uppercase">
                            Burned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Spread: <strong className="text-slate-200">{game.homeSpread > 0 ? `+${game.homeSpread}` : game.homeSpread}</strong> • Win: <strong className={homeTier.textClass}>{(game.homeWinProb * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      title={`Future Value: ${homeFv.toFixed(1)}/10`}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      FV {homeFv.toFixed(1)}
                    </span>
                    <button
                      onClick={() => {
                        if (game.isLocked) return;
                        if (isHomePicked) onRemovePick && onRemovePick(activeWeek);
                        else onSelectPick && onSelectPick(activeWeek, game.home);
                      }}
                      disabled={game.isLocked || (!homeAvailable && !isHomePicked)}
                      className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all ${
                        isHomePicked
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : homeAvailable
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {isHomePicked ? 'Picked' : 'Pick'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
