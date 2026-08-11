import React, { useState, useMemo } from 'react';
import logger from '../../lib/logger';
import { Microscope, Play, RefreshCw, Activity, Star, Trophy, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { TEAM_LOGOS } from '../../lib/teams';

const groupGamesByWeek = (gamesList) => {
    if (!gamesList || gamesList.length === 0) return { current: [], future: [] };
    const sorted = [...gamesList].sort((a, b) => a.id - b.id);
    return { current: sorted, future: [] };
};

// --- HELPER COMPONENTS ---
const StarRating = ({ count }) => (
    <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className={i < count ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"} />
        ))}
    </div>
);

const RankBadge = ({ rank, type }) => {
    if (!rank) return <span className="text-[9px] text-slate-600">-</span>;
    let color = "text-slate-400";
    if (rank <= 5) color = "text-emerald-400 font-bold";
    else if (rank <= 12) color = "text-emerald-200";
    else if (rank >= 25) color = "text-rose-400";

    return (
        <div className="flex items-center gap-1 text-[9px]">
            <span className="text-slate-500 uppercase">{type}</span>
            <span className={color}>#{rank}</span>
        </div>
    );
};

export default function DevLab({ games, stats, onSimComplete, savedResults }) {
  const [isRunning, setIsRunning] = useState(false);
  const [simResults, setSimResults] = useState(savedResults || {});

  // New: tempo toggle
  const [useTempo, setUseTempo] = useState(false);

  const { current: currentGames } = groupGamesByWeek(games);

  // --- RATINGS, LEAGUE TEMPO & RANKINGS ---
  // Pure derivations of `stats` -- computed during render via useMemo rather
  // than useState+useEffect (avoids react-hooks/set-state-in-effect and the
  // extra render that a setState-from-effect round-trip would cost).
  const { ratings, leagueTempo } = useMemo(() => {
    if (!stats || stats.length === 0) return { ratings: {}, leagueTempo: 1.0 };

    const processedRatings = {};

    // compute league mean (tempo values are plays/game)
    const tempos = stats.map(s => parseFloat(s.tempo)).filter(v => !isNaN(v) && v > 0);
    const meanTempo = tempos.length ? tempos.reduce((a,b) => a + b, 0) / tempos.length : 30.0;

    stats.forEach(teamStat => {
        if (teamStat.team) {
            const rawTempo = parseFloat(teamStat.tempo) || meanTempo;
            // 1.0 = league average; clip to avoid extremes
            const tempoMult = Math.max(0.85, Math.min(1.15, rawTempo / meanTempo));

            processedRatings[teamStat.team] = {
                off: parseFloat(teamStat.off_epa || 0),
                def: parseFloat(teamStat.def_epa || 0),
                offPass: parseFloat(teamStat.off_pass_epa || teamStat.off_epa || 0),
                offRush: parseFloat(teamStat.off_rush_epa || teamStat.off_epa || 0),
                defPass: parseFloat(teamStat.def_pass_epa || teamStat.def_epa || 0),
                defRush: parseFloat(teamStat.def_rush_epa || teamStat.def_epa || 0),
                tempo: tempoMult
            };
        }
    });

    return { ratings: processedRatings, leagueTempo: meanTempo };
  }, [stats]);

  // ðŸ”¥ CALCULATE RANKINGS
  const ranks = useMemo(() => {
    const teamKeys = Object.keys(ratings);
    const offSorted = [...teamKeys].sort((a,b) => ratings[b].off - ratings[a].off); // Higher is better
    const defSorted = [...teamKeys].sort((a,b) => ratings[a].def - ratings[b].def); // Lower is better (EPA)

    const newRanks = {};
    teamKeys.forEach(t => {
        newRanks[t] = {
            off: offSorted.indexOf(t) + 1,
            def: defSorted.indexOf(t) + 1
        };
    });
    return newRanks;
  }, [ratings]);

  // --- MONTE CARLO ENGINE (Web Worker â€” off main thread) ---
  const handleRunSims = () => {
      if (!ratings || Object.keys(ratings).length === 0) {
          alert("âš ï¸ No Data Loaded! Waiting for stats engine...");
          return;
      }

      setIsRunning(true);

      const worker = new Worker(
          new URL('../../workers/simulationWorker.js', import.meta.url),
          { type: 'module' }
      );

      worker.onmessage = ({ data: { results } }) => {
          worker.terminate();
          setSimResults(results);
          if (onSimComplete) onSimComplete(results);
          setIsRunning(false);
      };

      worker.onerror = (e) => {
          logger.error('[DevLab] Simulation worker error:', e.message);
          worker.terminate();
          setIsRunning(false);
      };

      worker.postMessage({ games, ratings, useTempo });
  };

  // --- ðŸ”¥ NEW "HUMAN READABLE" CARD ---
  const SimCard = ({ game, res }) => {
      if (!res) return null;
      if (!res.hasData) return (<div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex flex-col items-center justify-center opacity-70"><div className="text-slate-500 font-bold mb-1">{game.visitor} @ {game.home}</div><div className="text-[10px] text-rose-400">Data Missing</div></div>);

      // 1. Determine Edge & Confidence
      let edgeTeam = null;
      let edgePct = 0;
      let confidence = "None";
      let stars = 0;

      if (parseFloat(res.homeCoverPct) >= 53.0) { edgeTeam = game.home; edgePct = parseFloat(res.homeCoverPct); }
      else if (parseFloat(res.visCoverPct) >= 53.0) { edgeTeam = game.visitor; edgePct = parseFloat(res.visCoverPct); }

      if (edgePct >= 60) { confidence = "High"; stars = 5; }
      else if (edgePct >= 57) { confidence = "Med"; stars = 4; }
      else if (edgePct >= 55) { confidence = "Low"; stars = 3; }
      else if (edgePct >= 53) { confidence = "Lean"; stars = 1; }

      const totalEdge = parseFloat(res.overPct) >= 55.0 ? 'OVER' : parseFloat(res.underPct) >= 55.0 ? 'UNDER' : null;

      // 2. Get Ranks
      const vRank = ranks[game.visitor] || {};
      const hRank = ranks[game.home] || {};

      return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all group relative overflow-hidden">

              {/* --- HEADER: Value Rating --- */}
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-2">
                  <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">AI Value Rating</div>
                      <StarRating count={stars} />
                  </div>
                  {edgeTeam && (
                      <div className={`text-right`}>
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Recommended</div>
                          <div className="text-xs font-black text-white">{edgeTeam} {game.spread > 0 && edgeTeam === game.home ? `+${game.spread}` : ''}</div>
                      </div>
                  )}
              </div>

              {/* --- SCOREBOARD (Rounded Numbers) --- */}
              <div className="flex justify-between items-center mb-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="flex flex-col items-center w-1/3">
                      <img src={TEAM_LOGOS[game.visitor]} alt={game.visitor} className="w-10 h-10 object-contain mb-1" />
                      <div className="text-2xl font-black text-white">{Math.round(res.projVis)}</div>
                      <RankBadge rank={vRank.off} type="OFF" />
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3 text-center">
                      <div className="text-[9px] text-slate-600 font-bold uppercase">Proj Total</div>
                      <div className="text-sm font-mono text-slate-400">{Math.round(res.projTotal)}</div>
                      <div className="text-[9px] text-slate-600 mt-1">Line: {game.total}</div>
                  </div>

                  <div className="flex flex-col items-center w-1/3">
                      <img src={TEAM_LOGOS[game.home]} alt={game.home} className="w-10 h-10 object-contain mb-1" />
                      <div className="text-2xl font-black text-white">{Math.round(res.projHome)}</div>
                      <RankBadge rank={hRank.off} type="OFF" />
                  </div>
              </div>

              {/* --- EXPLANATION --- */}
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Spread Confidence</span>
                      <span className={`font-bold ${confidence === 'High' ? 'text-emerald-400' : confidence === 'Med' ? 'text-emerald-200' : 'text-slate-500'}`}>
                          {confidence === 'None' ? 'No Edge' : `${confidence} (${edgePct.toFixed(0)}%)`}
                      </span>
                  </div>

                  {/* Stats Context Bar */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] text-center pt-2 border-t border-slate-800">
                      <div className="bg-slate-800/50 rounded p-1">
                          <div className="text-slate-500">Def. Rank</div>
                          <div className="flex justify-between px-2 mt-0.5">
                              <span className={vRank.def <= 10 ? "text-emerald-400" : "text-slate-400"}>#{vRank.def}</span>
                              <span className="text-slate-600">vs</span>
                              <span className={hRank.def <= 10 ? "text-emerald-400" : "text-slate-400"}>#{hRank.def}</span>
                          </div>
                      </div>
                      <div className="bg-slate-800/50 rounded p-1">
                          <div className="text-slate-500">Total Play</div>
                          <div className={`font-bold mt-0.5 ${totalEdge ? 'text-purple-400' : 'text-slate-500'}`}>
                              {totalEdge ? `${totalEdge} ${game.total}` : 'Pass'}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
         <div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Microscope className="text-emerald-400" /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">AI Dev Lab</span></h2>
             <p className="text-slate-400 text-sm mt-1">Monte Carlo Engine â€¢ Totals, Spreads & Player Props â€¢ {Object.keys(ratings || {}).length} Teams Loaded</p>
         </div>
         <div className="flex gap-3 items-center">
             <label className="flex items-center gap-2 text-sm text-slate-300">
               <input type="checkbox" checked={useTempo} onChange={() => setUseTempo(!useTempo)} className="h-4 w-4" />
               <span>Use Tempo Mult</span>
               <span className="text-xs text-slate-500 ml-2">mean: {leagueTempo ? leagueTempo.toFixed(1) : '-'}</span>
             </label>
             <button onClick={handleRunSims} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50">{isRunning ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}{isRunning ? "Running..." : "Run Simulation"}</button>
         </div>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 min-h-[60vh]">
         {Object.keys(simResults).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full py-20 text-slate-700">
                 <Microscope size={64} className="opacity-20 mb-4" />
                 <p className="text-lg font-bold text-slate-600">Ready to Simulate</p>
                 <p className="text-sm">Data loaded successfully. Click 'Run Simulation' to start.</p>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {currentGames.map(game => <SimCard key={game.id} game={game} res={simResults[game.id]} />)}
             </div>
         )}
      </div>
    </div>
  );
}