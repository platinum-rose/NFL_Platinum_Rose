import React, { useState } from 'react';
import { User, Trash2, Eraser, Award, Calendar, AlertCircle, Pencil, Check, X, Shield, BookmarkPlus } from 'lucide-react';
import { addExpertPick } from '../../lib/picksDatabase';

export default function ExpertManagerModal({ isOpen, onClose, experts: _experts, expertConsensus, onUpdatePick, onDeletePick, onClearExpert }) {
  const [selectedExpertName, setSelectedExpertName] = useState(null);
  
  // EDIT STATE
  const [editingPick, setEditingPick] = useState(null); // { gameId, pick, line, units }
  const [editForm, setEditForm] = useState({});

  if (!isOpen) return null;

  // Get list of experts who actually have picks currently
  const activeExperts = new Set();
  Object.values(expertConsensus).forEach(game => {
      [...game.expertPicks.spread, ...game.expertPicks.total].forEach(p => activeExperts.add(p.expert));
  });
  const activeExpertList = Array.from(activeExperts).sort();

  // Get picks for the selected expert
  const getSelectedExpertPicks = () => {
      if (!selectedExpertName) return [];
      const picks = [];
      Object.entries(expertConsensus).forEach(([gameId, gameData]) => {
          const { spread, total } = gameData.expertPicks;
          [...spread, ...total].forEach(p => {
              if (p.expert === selectedExpertName) {
                  picks.push({ ...p, gameId, type: p.pickType || (p.pick === 'Over' || p.pick === 'Under' ? 'Total' : 'Spread') });
              }
          });
      });
      return picks;
  };

  const handleStartEdit = (pick) => {
      setEditingPick(pick);
      setEditForm({ ...pick });
  };

  const handleSaveEdit = () => {
      if (!editingPick) return;
      onUpdatePick(editingPick.gameId, editingPick, editForm);
      setEditingPick(null);
  };

  const selectedPicks = getSelectedExpertPicks();

  return (
    <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* LEFT SIDEBAR: EXPERT LIST */}
        <div className="w-1/3 border-r border-slate-800 bg-slate-950 flex flex-col">
            <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Shield className="text-emerald-400" size={18} /> Expert Manager
                </h3>
                <p className="text-xs text-slate-500 mt-1">Select an analyst to manage their card.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {activeExpertList.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 italic text-center">No active experts found. Load some data first.</div>
                ) : (
                    activeExpertList.map(expert => (
                        <button 
                            key={expert} 
                            onClick={() => setSelectedExpertName(expert)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${selectedExpertName === expert ? 'bg-emerald-900/30 text-white border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedExpertName === expert ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                {expert.charAt(0)}
                            </div>
                            <span className="font-bold text-sm truncate">{expert}</span>
                        </button>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-slate-800">
                <button onClick={onClose} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors">Close Manager</button>
            </div>
        </div>

        {/* RIGHT CONTENT: EDITOR */}
        <div className="w-2/3 bg-slate-900 flex flex-col">
            {selectedExpertName ? (
                <>
                    {/* HEADER */}
                    <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white">{selectedExpertName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{selectedPicks.length} Active Picks</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => { if(window.confirm("Clear all picks for this expert?")) onClearExpert(selectedExpertName); }}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/30 px-3 py-1.5 rounded border border-rose-900/50 transition-colors"
                        >
                            <Eraser size={12} /> Clear Card
                        </button>
                    </div>

                    {/* PICKS LIST */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {selectedPicks.length === 0 ? (
                            <div className="text-center py-20 opacity-30">
                                <User size={48} className="mx-auto mb-4" />
                                <p>No picks on record.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedPicks.map((pick, i) => {
                                    const isEditing = editingPick && editingPick.pick === pick.pick && editingPick.gameId === pick.gameId;

                                    return (
                                        <div key={i} className={`p-4 rounded-xl border transition-all ${isEditing ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}>
                                            <div className="flex justify-between items-center">
                                                
                                                {/* PICK INFO */}
                                                <div className="flex gap-4 items-center">
                                                    <div className={`w-1 h-12 rounded-full ${pick.type === 'Total' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">{pick.type}</div>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    className="bg-slate-950 border border-indigo-500 text-white text-sm font-bold p-1 rounded w-32"
                                                                    value={editForm.pick}
                                                                    onChange={e => setEditForm({...editForm, pick: e.target.value})}
                                                                />
                                                                <input 
                                                                    className="bg-slate-950 border border-indigo-500 text-white text-sm font-mono p-1 rounded w-16 text-center"
                                                                    value={editForm.line}
                                                                    onChange={e => setEditForm({...editForm, line: e.target.value})}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="text-lg font-black text-white">
                                                                {pick.pick} <span className={pick.type === 'Total' ? 'text-blue-400' : 'text-emerald-400'}>{pick.line}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="flex gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={handleSaveEdit} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"><Check size={16} /></button>
                                                            <button onClick={() => setEditingPick(null)} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"><X size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleStartEdit(pick)} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/50 rounded-lg transition-colors" title="Edit pick"><Pencil size={16} /></button>
                                                            <button
                                                              onClick={() => {
                                                                const saved = addExpertPick(pick);
                                                                if (saved) alert(`✅ ${pick.expert}'s pick sent to Picks Tracker!`);
                                                                else alert('Already tracked or required fields missing.');
                                                              }}
                                                              className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50 rounded-lg transition-colors"
                                                              title="Send to Picks Tracker"
                                                            >
                                                              <BookmarkPlus size={16} />
                                                            </button>
                                                            <button onClick={() => onDeletePick(pick.gameId, pick)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors" title="Delete pick"><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* RATIONALE PREVIEW */}
                                            {!isEditing && pick.rationale && (
                                                <div className="mt-3 text-xs text-slate-500 italic border-t border-slate-700/50 pt-2 pl-5 truncate">
                                                    "{Array.isArray(pick.rationale) ? pick.rationale[0] : pick.rationale}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <Award size={64} className="mb-4 opacity-20" />
                    <p className="font-bold">Select an Expert</p>
                    <p className="text-sm">View and edit picks on the left.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}