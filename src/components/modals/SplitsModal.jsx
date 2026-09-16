import React, { useState } from 'react';
import { X, Banknote, AlignCenterVertical, Layers, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';

// --- HELPER: BADGE LOGIC ---
const getEdgeBadge = (vBets, hBets, vMoney, hMoney, teamV, teamH) => {
    const vb = parseInt(vBets) || 0;
    const hb = parseInt(hBets) || 0;
    const vm = parseInt(vMoney) || 0;
    const hm = parseInt(hMoney) || 0;

    // SHARP: Money is 10%+ higher than Tickets
    if (vm - vb >= 10) return { label: 'SHARP', team: teamV, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50' };
    if (hm - hb >= 10) return { label: 'SHARP', team: teamH, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/50' };

    // PUBLIC: Tickets >= 60%
    if (vb >= 60) return { label: 'PUBLIC', team: teamV, color: 'text-blue-300 bg-blue-950/50 border-blue-500/50' };
    if (hb >= 60) return { label: 'PUBLIC', team: teamH, color: 'text-blue-300 bg-blue-950/50 border-blue-500/50' };

    return null;
};

// --- VISUAL COMPARISON BAR ---
const ComparisonBar = ({ leftVal, rightVal, leftColor, rightColor, labelType }) => {
    const l = parseInt(leftVal) || 0;
    const r = parseInt(rightVal) || 0;
    const total = l + r || 100;
    const lPct = (l / total) * 100;
    
    const leftLabel = labelType === 'money' ? '$$$' : 'Tix';
    const rightLabel = labelType === 'money' ? '$$$' : 'Tix';

    return (
        <div className="w-full flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-px">
                <span className="flex items-center gap-1">{leftLabel} <span className="text-slate-300">{l}%</span></span>
                <span className="flex items-center gap-1"><span className="text-slate-300">{r}%</span> {rightLabel}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className={`h-full ${leftColor} transition-all duration-500`} style={{ width: `${lPct}%` }}></div>
                <div className={`h-full ${rightColor} transition-all duration-500 flex-1`}></div>
            </div>
        </div>
    );
};

const SplitsModal = ({ isOpen, onClose, games }) => {
  const [showML, setShowML] = useState(false);

  if (!isOpen) return null;

  // Filter games that actually have split data attached
  const gamesWithSplits = games.filter(g => g.splits && (g.splits.ml || g.splits.ats || g.splits.total));

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/20 p-2 rounded-full"><AlignCenterVertical size={20} className="text-indigo-400" /></div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Splits Analysis</h2>
              <p className="text-xs text-slate-400">Identify Sharp Money & Public Heavy Sides</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowML(!showML)}
                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded border transition-all ${showML ? 'bg-amber-900/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              >
                  {showML ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                  {showML ? 'Hide Moneyline' : 'Show Moneyline'}
              </button>
              <div className="h-6 w-px bg-slate-800 mx-2"></div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-0 overflow-auto flex-1 bg-slate-950/30">
          
          {gamesWithSplits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <AlertTriangle size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No Splits Data Found</p>
                <p className="text-sm mt-2 text-center max-w-md">
                    No betting splits in Supabase yet for this week. The Action Network
                    ingest agent refreshes this on its normal schedule, or run it now from
                    the Toolbox's Data Source Health tab.
                </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 border-separate border-spacing-0">
                <thead className="text-xs uppercase bg-slate-900 text-slate-400 font-bold tracking-wider sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-800 w-48 bg-slate-900">Matchup</th>
                    <th className="px-4 py-3 text-center border-b border-l border-slate-800 bg-indigo-950/30 text-indigo-300">
                        <div className="flex items-center justify-center gap-2"><AlignCenterVertical size={14}/> Spread (ATS)</div>
                    </th>
                    <th className="px-4 py-3 text-center border-b border-l border-slate-800 bg-emerald-950/30 text-emerald-300">
                        <div className="flex items-center justify-center gap-2"><Layers size={14}/> Total</div>
                    </th>
                    {showML && (
                        <th className="px-4 py-3 text-center border-b border-l border-slate-800 bg-amber-950/30 text-amber-300 w-64 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-center gap-2"><Banknote size={14}/> Moneyline</div>
                        </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {gamesWithSplits.map(game => {
                    const ml = game.splits?.ml || {};
                    const ats = game.splits?.ats || {};
                    const tot = game.splits?.total || {};

                    const atsBadge = getEdgeBadge(ats.visitorTicket, ats.homeTicket, ats.visitorMoney, ats.homeMoney, game.visitor, game.home);
                    const totBadge = getEdgeBadge(tot.overTicket, tot.underTicket, tot.overMoney, tot.underMoney, 'Over', 'Under');
                    const mlBadge = showML ? getEdgeBadge(ml.visitorTicket, ml.homeTicket, ml.visitorMoney, ml.homeMoney, game.visitor, game.home) : null;

                    return (
                      <tr key={game.id} className="hover:bg-slate-900/40 transition-colors group">
                        <td className="px-4 py-6 font-bold text-white border-r border-slate-800/50 bg-slate-950/50">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-indigo-400">{game.visitor}</span>
                                    <span className="text-[10px] text-slate-600 font-mono">VIS</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-rose-400">{game.home}</span>
                                    <span className="text-[10px] text-slate-600 font-mono">HOME</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-800/50 relative min-w-[280px]">
                            {atsBadge && (
                                <div className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 ${atsBadge.color}`}>
                                    {atsBadge.label}: {atsBadge.team}
                                </div>
                            )}
                            <div className="flex flex-col gap-3 mt-1">
                                <ComparisonBar leftVal={ats.visitorTicket} rightVal={ats.homeTicket} leftColor="bg-indigo-500" rightColor="bg-rose-500" labelType="ticket" />
                                <ComparisonBar leftVal={ats.visitorMoney} rightVal={ats.homeMoney} leftColor="bg-indigo-500" rightColor="bg-rose-500" labelType="money" />
                            </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-800/50 relative min-w-[280px]">
                             {totBadge && (
                                <div className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 ${totBadge.color}`}>
                                    {totBadge.label}: {totBadge.team}
                                </div>
                            )}
                            <div className="flex flex-col gap-3 mt-1">
                                <ComparisonBar leftVal={tot.overTicket} rightVal={tot.underTicket} leftColor="bg-emerald-500" rightColor="bg-slate-600" labelType="ticket" />
                                <ComparisonBar leftVal={tot.overMoney} rightVal={tot.underMoney} leftColor="bg-emerald-500" rightColor="bg-slate-600" labelType="money" />
                            </div>
                            <div className="flex justify-between w-full mt-1 px-1">
                                <span className="text-[9px] font-bold text-emerald-500/80">OVER</span>
                                <span className="text-[9px] font-bold text-slate-500">UNDER</span>
                            </div>
                        </td>
                        {showML && (
                            <td className="px-6 py-4 relative min-w-[280px] bg-slate-900/20 animate-in fade-in slide-in-from-right-2">
                                {mlBadge && (
                                    <div className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 ${mlBadge.color}`}>
                                        {mlBadge.label}: {mlBadge.team}
                                    </div>
                                )}
                                <div className="flex flex-col gap-3 mt-1">
                                    <ComparisonBar leftVal={ml.visitorTicket} rightVal={ml.homeTicket} leftColor="bg-indigo-500" rightColor="bg-rose-500" labelType="ticket" />
                                    <ComparisonBar leftVal={ml.visitorMoney} rightVal={ml.homeMoney} leftColor="bg-indigo-500" rightColor="bg-rose-500" labelType="money" />
                                </div>
                            </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitsModal;