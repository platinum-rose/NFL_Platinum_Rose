import React, { useState, useEffect } from 'react';
import { ListFilter, X, Activity, Save } from 'lucide-react';

export default function ContestLinesModal({ isOpen, onClose, games, onUpdateContestLines }) {
  const [lines, setLines] = useState({});

  // Initialize with existing contest lines. Resets local draft state each
  // time the modal opens or the games prop changes -- a real sync effect,
  // not derivable state.
  useEffect(() => {
      if(isOpen) {
          const init = {};
          games.forEach(g => init[g.id] = g.contestSpread || '');
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLines(init);
      }
  }, [isOpen, games]);

  if(!isOpen) return null;

  // Syncs Live Spreads into the Contest Fields
  const handleSyncLive = () => { 
      if(window.confirm("Overwrite all Contest Lines with current Live Spreads?")) { 
          const newLines = {}; 
          games.forEach(g => newLines[g.id] = g.spread); 
          setLines(newLines); 
      } 
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <div className="flex items-center gap-2 text-orange-400">
                <ListFilter size={20}/>
                <h3 className="font-bold text-lg text-white">SuperContest Lines</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20}/>
            </button>
        </div>

        {/* TOOLBAR */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3 justify-center">
            <button onClick={handleSyncLive} className="px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-2 transition-all">
                <Activity size={14}/>
                Sync Live Odds
            </button>
            <span className="text-[11px] text-slate-500">Official contest lines aren't available via API &mdash; enter manually below or sync live spreads.</span>
        </div>

        {/* GRID */}
        <div className="p-6 overflow-y-auto grid gap-3 custom-scrollbar bg-slate-900">
            {games.map(g => (
                <div key={g.id} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="w-1/3 font-bold text-slate-300 text-sm">{g.visitor}</div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Line</span>
                        <input 
                            type="number" 
                            step="0.5" 
                            className="w-20 bg-slate-950 border border-slate-700 rounded py-1.5 text-center text-white font-mono font-bold focus:border-orange-500 outline-none transition-all" 
                            value={lines[g.id] !== undefined ? lines[g.id] : ''} 
                            onChange={e => setLines({...lines, [g.id]: parseFloat(e.target.value)})} 
                        />
                    </div>
                    <div className="w-1/3 text-right font-bold text-slate-300 text-sm">{g.home}</div>
                </div>
            ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
            <button onClick={() => { onUpdateContestLines(lines); onClose(); }} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all">
                <Save size={16}/> Save Updates
            </button>
        </div>
      </div>
    </div>
  );
}