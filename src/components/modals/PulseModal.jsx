import React from 'react';
import { X, Activity, TrendingUp, Users, AlertTriangle, Zap, CloudRain, Thermometer } from 'lucide-react';
import { getInjuryStatusStyle } from '../../lib/injuries';

export default function PulseModal({ isOpen, onClose, games = [] }) {
  if (!isOpen) return null;

  // --- INTEL ENGINE ---
  const getInsights = () => {
      const rlm = [];       // Reverse Line Movement (The Holy Grail)
      const weather = [];   // Bad Weather Games
      const sharps = [];    // Money > Ticket discrepancies
      const publicFade = []; // Extreme Public plays to fade
      const criticalInjuries = []; // OUT/critical-impact players (F-27d)

      games.forEach(g => {
          // CRITICAL INJURY CHECK — reuses the same injuries.home/visitor
          // shape App.jsx already merges onto each game for MatchupCard.
          const collectCritical = (list, teamAbbrev) => {
              (list || []).forEach(inj => {
                  if (inj.impact === 'critical' || inj.status === 'OUT') {
                      criticalInjuries.push({ ...inj, team: teamAbbrev });
                  }
              });
          };
          collectCritical(g.injuries?.home, g.home);
          collectCritical(g.injuries?.visitor, g.visitor);

          // WEATHER CHECK (Mocking detection based on potential strings)
          // Ideally, 'game.weather' comes from your API. We search for keywords.
          const w = (g.weather || "").toLowerCase();
          if (w.includes('snow') || w.includes('rain') || w.includes('wind') || w.includes('storm')) {
              weather.push({ game: `${g.visitor} @ ${g.home}`, cond: g.weather });
          }

          if (!g.splits) return;
          const ats = g.splits.ats || {};
          
          const hTix = ats.homeTicket || 0;
          const hCash = ats.homeMoney || 0;
          const vTix = ats.visitorTicket || 0;
          const vCash = ats.visitorMoney || 0;

          // 1. REVERSE LINE MOVEMENT DETECTOR
          // Public is Heavy (>65%) but Money is on the other side (<45% cash on public side)
          if (hTix > 65 && hCash < 50) {
             rlm.push({ team: g.home, vs: g.visitor, tix: hTix, cash: hCash, line: g.spread });
          } else if (vTix > 65 && vCash < 50) {
             rlm.push({ team: g.visitor, vs: g.home, tix: vTix, cash: vCash, line: g.spread * -1 });
          }

          // 2. SHARP MONEY TARGETS (Raw Diff > 15%)
          const diffHome = hCash - hTix;
          const diffVis = vCash - vTix;
          if (diffHome > 15) sharps.push({ team: g.home, diff: diffHome, line: g.spread });
          if (diffVis > 15) sharps.push({ team: g.visitor, diff: diffVis, line: g.spread * -1 });

          // 3. PUBLIC HEAVY (Blind Public Plays)
          if (hTix > 75) publicFade.push({ team: g.home, pct: hTix });
          if (vTix > 75) publicFade.push({ team: g.visitor, pct: vTix });
      });

      // Worst-first: OUT before questionable-critical, then alphabetical by team
      criticalInjuries.sort((a, b) => (a.status === 'OUT' ? 0 : 1) - (b.status === 'OUT' ? 0 : 1));

      return { rlm, weather, sharps, publicFade, criticalInjuries };
  };

  const { rlm, weather, sharps, publicFade, criticalInjuries } = getInsights();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
           <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="text-rose-500 animate-pulse" /> Market Pulse & Urgent Intel
             </h2>
             <p className="text-slate-400 text-sm">Reverse Line Movement, Weather Alerts, and Sharp Money.</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* CONTENT GRID */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar bg-slate-900">
            
            {/* COL 1: URGENT ALERTS (RLM & Weather) */}
            <div className="space-y-6">
                {/* REVERSE LINE MOVEMENT */}
                <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={64} className="text-rose-500" /></div>
                    <h3 className="text-rose-400 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-xs relative z-10">
                        <Zap size={16} /> Reverse Line Movement
                    </h3>
                    {rlm.length === 0 ? <p className="text-slate-500 text-xs italic relative z-10">No RLM signals detected.</p> : (
                        <ul className="space-y-3 relative z-10">
                            {rlm.map((item, i) => (
                                <li key={i} className="text-sm bg-slate-900/50 p-3 rounded border border-rose-500/10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold">{item.team} <span className="text-xs text-slate-400">({item.line > 0 ? `+${item.line}` : item.line})</span></span>
                                        <span className="text-rose-400 font-black text-xs">FADE PUBLIC</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex justify-between">
                                        <span>Tickets: <span className="text-rose-300">{item.tix}%</span></span>
                                        <span>Money: <span className="text-emerald-400">{item.cash}%</span></span>
                                    </div>
                                    <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${item.cash}%` }} className="bg-emerald-500"></div>
                                        <div style={{ width: `${item.tix - item.cash}%` }} className="bg-rose-500"></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* WEATHER WATCH */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-indigo-400 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-xs">
                        <CloudRain size={16} /> Weather Impact
                    </h3>
                    {weather.length === 0 ? <p className="text-slate-500 text-xs italic">No severe weather alerts.</p> : (
                        <ul className="space-y-2">
                             {weather.map((w, i) => (
                                 <li key={i} className="flex justify-between items-start text-sm border-b border-indigo-500/10 pb-2">
                                     <span className="text-slate-200 font-medium">{w.game}</span>
                                     <span className="text-indigo-300 text-xs font-bold text-right max-w-[120px]">{w.cond}</span>
                                 </li>
                             ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* COL 2: SHARP MONEY */}
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5">
                <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-xs">
                    <TrendingUp size={16} /> Sharp Money (&gt;15% Diff)
                </h3>
                {sharps.length === 0 ? <p className="text-slate-500 text-xs italic">No sharp discrepancies.</p> : (
                    <ul className="space-y-3">
                        {sharps.map((s, i) => (
                            <li key={i} className="flex justify-between items-center text-sm border-b border-emerald-500/10 pb-2">
                                <span className="text-white font-bold">{s.team} <span className="text-slate-500 text-xs ml-1">({s.line > 0 ? `+${s.line}` : s.line})</span></span>
                                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono font-bold">+{s.diff}% Edge</span>
                            </li>
                        ))}
                    </ul>
                )}
                
                {/* CRITICAL INJURIES — wired up via F-25's injuries.home/visitor (F-27d) */}
                <div className="mt-8 pt-4 border-t border-slate-800">
                    <h3 className="text-slate-500 font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-[10px]">
                        <AlertTriangle size={12} /> Critical Injuries
                    </h3>
                    {criticalInjuries.length === 0 ? (
                        <div className="text-xs text-slate-600 bg-slate-900/50 p-3 rounded border border-slate-800/50 italic">
                            No OUT or critical-impact tags this slate.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {criticalInjuries.slice(0, 8).map((inj, i) => (
                                <li key={`${inj.team}-${inj.name}-${i}`} className="flex justify-between items-center text-xs bg-slate-900/50 p-2.5 rounded border border-slate-800/50">
                                    <div className="min-w-0">
                                        <span className="text-white font-bold">{inj.name}</span>
                                        <span className="text-slate-500 ml-1">{inj.team} &middot; {inj.position}</span>
                                    </div>
                                    <span
                                        className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ml-2"
                                        style={{ backgroundColor: `${getInjuryStatusStyle(inj.status).color}33`, color: getInjuryStatusStyle(inj.status).color }}
                                    >
                                        {inj.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* COL 3: PUBLIC FADES & KEY NUMBERS */}
            <div className="space-y-6">
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-xs">
                        <Users size={16} /> Public Heavy (&gt;75%)
                    </h3>
                    {publicFade.length === 0 ? <p className="text-slate-500 text-xs italic">Public is split.</p> : (
                        <ul className="space-y-3">
                             {publicFade.map((p, i) => (
                                <li key={i} className="flex justify-between items-center text-sm border-b border-blue-500/10 pb-2">
                                    <span className="text-white font-bold">{p.team}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div style={{ width: `${p.pct}%` }} className="h-full bg-blue-500"></div>
                                        </div>
                                        <span className="text-blue-300 font-mono text-xs">{p.pct}%</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-xs">
                        <AlertTriangle size={16} /> Key Number Risks
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-4">Games sitting on 3, 7, or 10.</p>
                    <div className="space-y-2">
                         {games.filter(g => Math.abs(g.spread) === 3 || Math.abs(g.spread) === 7).length === 0 
                            ? <p className="text-slate-500 text-xs italic">No games on key numbers.</p> 
                            : games.filter(g => Math.abs(g.spread) === 3 || Math.abs(g.spread) === 7).map((g, i) => (
                             <div key={i} className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-700 pb-1">
                                 <span>{g.visitor}/{g.home}</span>
                                 <span className="text-white font-bold bg-slate-700 px-1.5 rounded">{Math.abs(g.spread)}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}