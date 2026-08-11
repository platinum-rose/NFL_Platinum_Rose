// File: src/components/modals/MyCardModal.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Check, AlertCircle, X, ExternalLink, Calculator, Layers, Split, Repeat, Ban, Lock, FileText } from 'lucide-react';

const TEASER_PAYOUTS = {
    2: -120,
    3: 150,
    4: 235,
    5: 350,
    6: 550
};

// Combinatorics Helper for Round Robin
const getCombinations = (arr, k) => {
    if (k > arr.length || k <= 0) return [];
    if (k === arr.length) return [arr];
    if (k === 1) return arr.map(i => [i]);
    const combs = [];
    for (let i = 0; i < arr.length - k + 1; i++) {
        const head = arr.slice(i, i + 1);
        const tailcombs = getCombinations(arr.slice(i + 1), k - 1);
        for (let j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
};

export default function MyCardView({ bets, onRemoveBet, onUpdateBet: _onUpdateBet, onPlaceBet: _onPlaceBet, onCreateParlay, onClearCard, onLockBets }) {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' or 'locked'
  const [selectedIds, setSelectedIds] = useState([]);
  const [wager, setWager] = useState('');
  const [mode, setMode] = useState('straight'); // straight, parlay, teaser, robin
  const [robinSize, setRobinSize] = useState(2); 

  // Separate bets by status
  const openBets = bets.filter(b => b.status === 'OPEN');
  const lockedBets = bets.filter(b => b.status === 'PLACED');

  // Auto-select open bets when switching to builder or loading.
  // Intentionally depends on openBets.length rather than openBets itself:
  // openBets is a fresh array (new reference) every render via .filter(),
  // so depending on the array would refire this effect -> setSelectedIds
  // with a new array -> re-render -> refire, forever. Depending on the
  // length only re-triggers when the actual set of open bets changes.
  useEffect(() => {
      if (activeTab === 'builder') {
          setSelectedIds(openBets.map(b => b.id));
      }
  }, [openBets.length, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 🔥 VALIDATION HELPERS PER MODE
  const isTeasable = (bet) => {
      if (bet.isTeaser) return true; // Already a teaser leg (from button)
      if (bet.type === 'moneyline') return false; // No ML
      if (!bet.isMainLine) return false; // No Alt Lines (Bought points)
      return true;
  };

  const isParlayable = (bet) => {
      if (bet.isTeaser) return false; // 🔥 Teasers CANNOT be parlayed
      return true;
  };

  // Filter active bets based on selection AND mode eligibility
  const activeBets = openBets.filter(b => selectedIds.includes(b.id));
  
  // For calculation, we only consider VALID bets for the current mode
  const validModeBets = activeBets.filter(b => {
      if (mode === 'teaser') return isTeasable(b);
      if (mode === 'parlay' || mode === 'robin') return isParlayable(b);
      return true; // Straight bets accept everything
  });

  // --- VALIDATION MESSAGES ---
  const validateTeaser = () => {
      if (validModeBets.length < 2) return "Teasers require at least 2 eligible picks.";
      if (validModeBets.length > 6) return "Max 6 teams for Standard Teaser odds.";
      return null;
  };

  const validateParlay = () => {
      if (validModeBets.length < 2) return "Parlays require at least 2 eligible picks.";
      
      // Check Correlations
      const games = {};
      for (const bet of validModeBets) {
          if (!games[bet.gameId]) games[bet.gameId] = [];
          games[bet.gameId].push(bet);
      }

      for (const gameId in games) {
          const gBets = games[gameId];
          if (gBets.length > 1) {
              const hasSpread = gBets.find(b => b.type === 'spread');
              const hasML = gBets.find(b => b.type === 'moneyline');
              if (hasSpread && hasML && hasSpread.side === hasML.side) {
                  return "Cannot parlay Spread & ML on same team (Correlated).";
              }
              const totals = gBets.filter(b => b.type === 'total');
              if (totals.length > 1) return "Cannot parlay multiple totals from same game.";
          }
      }
      return null;
  };

  // --- 🧮 CALCULATION ENGINES ---

  // 1. PARLAY ODDS
  const calculateParlay = () => {
      const error = validateParlay();
      if (error) return { odds: null, error };

      let decimalOdds = 1;
      validModeBets.forEach(bet => {
          const amer = bet.odds;
          const dec = amer > 0 ? (amer / 100) + 1 : (100 / Math.abs(amer)) + 1;
          decimalOdds *= dec;
      });
      let finalAmer = decimalOdds >= 2 ? Math.round((decimalOdds - 1) * 100) : Math.round(-100 / (decimalOdds - 1));
      return { odds: finalAmer };
  };

  // 2. TEASER ODDS
  const calculateTeaser = () => {
      const error = validateTeaser();
      if (error) return { odds: null, error };
      const count = validModeBets.length;
      return { odds: TEASER_PAYOUTS[count] || null }; 
  };

  // Helper to display Teased Line
  const getTeasedLineDisplay = (bet) => {
      if (bet.isTeaser) return bet.detail; 
      // Calculate 6-point shift
      let lineVal = bet.line;
      let newLine = 0;
      if (bet.type === 'total') {
          newLine = bet.side === 'over' ? lineVal - 6 : lineVal + 6;
      } else {
          newLine = lineVal + 6;
      }
      const sign = newLine > 0 && bet.type !== 'total' ? '+' : '';
      return `${bet.matchup.split(' @ ')[0]}... ${sign}${newLine} (Teased)`; 
  };

  // 3. ROUND ROBIN
  const calculateRobin = () => {
      const error = validateParlay();
      if (error) return { combs: 0, error };
      if (validModeBets.length < 3) return { combs: 0, error: "Pick 3+ eligible bets" };
      
      const combinations = getCombinations(validModeBets, robinSize);
      return { combs: combinations.length, size: robinSize };
  };

  // --- RENDER HELPERS ---
  const { odds: parlayOdds, error: parlayError } = calculateParlay();
  const { odds: teaserOdds, error: teaserError } = calculateTeaser();
  const { combs: robinCombs, error: robinError } = calculateRobin();

  const handlePlace = () => {
      const validIds = validModeBets.map(b => b.id);

      if (mode === 'straight') {
          if (confirm(`Confirm placing ${activeBets.length} Straight Bets?`)) {
              onLockBets(activeBets.map(b => b.id));
              alert(`✅ Locked In ${activeBets.length} Straight Bets!`);
          }
      } else if (mode === 'parlay') {
          onCreateParlay(validIds, parlayOdds, 'parlay');
          alert(`✅ Parlay Locked In!`);
      } else if (mode === 'teaser') {
          onCreateParlay(validIds, teaserOdds, 'teaser');
          alert(`✅ Teaser Locked In!`);
      } else if (mode === 'robin') {
          onCreateParlay(validIds, "Varies", 'round-robin', { combinations: robinCombs, subSize: robinSize });
          alert(`✅ Round Robin Locked In!`);
      }
  };

  const estPayout = () => {
      if (!wager) return 0;
      const w = parseFloat(wager);
      if (mode === 'straight' || mode === 'robin') return 0; 
      const o = mode === 'teaser' ? teaserOdds : parlayOdds;
      if (!o) return 0;
      return o > 0 ? w * (o / 100) : w / (Math.abs(o) / 100);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* HEADER & TABS */}
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <Calculator className="text-emerald-400" /> Betting Card
          </h2>
          
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button 
                  onClick={() => setActiveTab('builder')} 
                  className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'builder' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                  <FileText size={16} /> Slip Builder ({openBets.length})
              </button>
              <button 
                  onClick={() => setActiveTab('locked')} 
                  className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'locked' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                  <Lock size={16} /> Locked Bets ({lockedBets.length})
              </button>
          </div>
      </div>

      {/* --- VIEW: LOCKED BETS --- */}
      {activeTab === 'locked' && (
          <div className="space-y-4">
              {lockedBets.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-600 font-bold">
                      No locked bets yet. Go to the Slip Builder to place wagers.
                  </div>
              ) : (
                  lockedBets.map(bet => (
                      <div key={bet.id} className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onRemoveBet(bet.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={16} /></button>
                          </div>
                          
                          <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${bet.type === 'parlay' ? 'bg-indigo-500/20 text-indigo-400' : bet.type === 'teaser' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-white'}`}>
                                  {bet.type === 'parlay' ? <Layers size={20} /> : bet.type === 'teaser' ? <Split size={20} /> : bet.type === 'round-robin' ? <Repeat size={20} /> : <FileText size={20} />}
                              </div>
                              <div>
                                  <h4 className="text-white font-bold text-lg">{bet.matchup}</h4>
                                  <div className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-wide">{bet.type} • {bet.odds > 0 ? `+${bet.odds}` : bet.odds} Odds</div>
                                  
                                  {/* Render Legs for Multis */}
                                  {bet.legs && (
                                      <div className="mt-3 space-y-1 pl-3 border-l-2 border-slate-700">
                                          {bet.legs.map((leg, i) => (
                                              <div key={i} className="text-sm text-slate-300">
                                                  <span className="text-slate-500 mr-2">•</span>{leg.detail}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  
                                  {/* Straight Bet Detail */}
                                  {!bet.legs && <div className="mt-2 text-emerald-400 font-bold font-mono">{bet.detail}</div>}
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* --- VIEW: SLIP BUILDER --- */}
      {activeTab === 'builder' && (
          <>
              {/* MODE SELECTOR */}
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 mb-6 w-full md:w-auto self-start">
                  <button onClick={() => setMode('straight')} className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-bold transition-all ${mode === 'straight' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Straight</button>
                  <button onClick={() => setMode('parlay')} className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-bold transition-all flex justify-center items-center gap-2 ${mode === 'parlay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Layers size={14} /> Parlay</button>
                  <button onClick={() => setMode('teaser')} className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-bold transition-all flex justify-center items-center gap-2 ${mode === 'teaser' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Split size={14} /> Teaser</button>
                  <button onClick={() => setMode('robin')} className={`flex-1 md:flex-none px-4 py-2 rounded text-sm font-bold transition-all flex justify-center items-center gap-2 ${mode === 'robin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Repeat size={14} /> Robin</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LEFT: SELECTION LIST */}
                  <div className="lg:col-span-2 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>Selected Picks ({activeBets.length})</span>
                          <button onClick={onClearCard} className="hover:text-rose-400 transition-colors">Clear All</button>
                      </div>

                      {openBets.length === 0 && <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-600 font-bold">Your builder is empty. Select picks from The Board.</div>}

                      {openBets.map(bet => {
                          const isChecked = selectedIds.includes(bet.id);
                          
                          // 🔥 DYNAMIC INELIGIBILITY CHECK
                          let isDisabled = false;
                          if (mode === 'teaser') {
                              isDisabled = !isTeasable(bet);
                          } else if (mode === 'parlay' || mode === 'robin') {
                              isDisabled = !isParlayable(bet); 
                          }

                          return (
                              <div key={bet.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all 
                                  ${isDisabled ? 'bg-slate-900 border-slate-800 opacity-50 grayscale' : 
                                    isChecked ? 'bg-slate-800 border-slate-600 shadow-lg' : 'bg-slate-900/50 border-slate-800 opacity-50'}
                              `}>
                                  <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      onChange={() => toggleSelect(bet.id)} 
                                      className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-0 cursor-pointer" 
                                  />
                                  <div className="flex-1">
                                      <div className="flex justify-between">
                                          <span className={`font-bold text-sm ${isDisabled ? 'text-slate-500' : 'text-white'}`}>{bet.matchup}</span>
                                          <button onClick={() => onRemoveBet(bet.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={14} /></button>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                          
                                          {/* 🔥 BADGE LOGIC */}
                                          {isDisabled ? (
                                              <span className="text-xs font-bold bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded flex items-center gap-1 border border-rose-900/50">
                                                  <Ban size={10} /> Ineligible
                                              </span>
                                          ) : mode === 'teaser' ? (
                                              <span className="text-xs font-mono bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                  {getTeasedLineDisplay(bet)}
                                              </span>
                                          ) : (
                                              <span className="text-xs font-mono bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                                  {bet.detail}
                                              </span>
                                          )}

                                          <span className={`text-xs ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  {/* RIGHT: BET SLIP / CALCULATOR */}
                  <div>
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl sticky top-6">
                          
                          {/* --- PARLAY MODE --- */}
                          {mode === 'parlay' && (
                              <div className="space-y-4">
                                  <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-wider flex items-center gap-2"><Layers size={14} /> Standard Parlay</h3>
                                  {parlayError ? (
                                      <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded text-rose-300 text-xs font-bold text-center">{parlayError}</div>
                                  ) : (
                                      <div className="text-center py-4 bg-slate-950 rounded-lg border border-slate-800">
                                          <div className="text-slate-400 text-xs uppercase mb-1">Combined Odds</div>
                                          <div className="text-3xl font-black text-white">{parlayOdds > 0 ? `+${parlayOdds}` : parlayOdds}</div>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* --- TEASER MODE --- */}
                          {mode === 'teaser' && (
                              <div className="space-y-4">
                                  <h3 className="text-purple-400 font-bold uppercase text-xs tracking-wider flex items-center gap-2"><Split size={14} /> 6-Point Teaser</h3>
                                  {teaserError ? (
                                      <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded text-rose-300 text-xs font-bold text-center">{teaserError}</div>
                                  ) : (
                                      <div className="text-center py-4 bg-slate-950 rounded-lg border border-slate-800">
                                          <div className="text-slate-400 text-xs uppercase mb-1">Teaser Odds</div>
                                          <div className="text-3xl font-black text-purple-400">{teaserOdds > 0 ? `+${teaserOdds}` : teaserOdds}</div>
                                      </div>
                                  )}
                                  <div className="text-[10px] text-slate-500 text-center">
                                      {validModeBets.length} eligible legs selected
                                  </div>
                              </div>
                          )}

                          {/* --- ROUND ROBIN MODE --- */}
                          {mode === 'robin' && (
                              <div className="space-y-4">
                                  <h3 className="text-emerald-400 font-bold uppercase text-xs tracking-wider flex items-center gap-2"><Repeat size={14} /> Round Robin</h3>
                                  
                                  <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                                      <span className="text-xs font-bold text-slate-300">Combinations:</span>
                                      <select 
                                          value={robinSize} 
                                          onChange={(e) => setRobinSize(parseInt(e.target.value))}
                                          className="bg-slate-950 border border-slate-700 text-white text-xs rounded px-2 py-1 outline-none"
                                      >
                                          {validModeBets.length >= 2 && <option value="2">By 2s</option>}
                                          {validModeBets.length >= 3 && <option value="3">By 3s</option>}
                                          {validModeBets.length >= 4 && <option value="4">By 4s</option>}
                                          {validModeBets.length >= 5 && <option value="5">By 5s</option>}
                                      </select>
                                  </div>

                                  {robinError ? (
                                      <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded text-rose-300 text-xs font-bold text-center">{robinError}</div>
                                  ) : (
                                      <div className="text-center py-4 bg-slate-950 rounded-lg border border-slate-800">
                                          <div className="text-slate-400 text-xs uppercase mb-1">Total Bets</div>
                                          <div className="text-3xl font-black text-emerald-400">{robinCombs} <span className="text-sm font-medium text-slate-500">bets</span></div>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* --- WAGER INPUT (Global) --- */}
                          <div className="pt-6 border-t border-slate-800 mt-6 space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                                      {mode === 'robin' ? 'Wager Per Bet ($)' : 'Total Wager ($)'}
                                  </label>
                                  <input 
                                      type="number" 
                                      value={wager} 
                                      onChange={(e) => setWager(e.target.value)} 
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                                      placeholder="100"
                                  />
                              </div>

                              {mode === 'robin' && !robinError && (
                                  <div className="flex justify-between items-center text-sm font-bold">
                                      <span className="text-slate-400">Total Risk:</span>
                                      <span className="text-white">${(wager * robinCombs).toFixed(2)}</span>
                                  </div>
                              )}

                              {(mode === 'parlay' || mode === 'teaser') && (
                                  <div className="flex justify-between items-center text-sm font-bold">
                                      <span className="text-slate-400">Est. Payout:</span>
                                      <span className="text-emerald-400">${estPayout().toFixed(2)}</span>
                                  </div>
                              )}

                              <button 
                                  onClick={handlePlace}
                                  disabled={
                                      (mode === 'parlay' && parlayError) || 
                                      (mode === 'teaser' && teaserError) || 
                                      (mode === 'robin' && robinError) ||
                                      validModeBets.length === 0
                                  }
                                  className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg text-white
                                      ${mode === 'straight' ? 'bg-slate-700 hover:bg-slate-600' : 
                                        mode === 'parlay' ? 'bg-indigo-600 hover:bg-indigo-500' :
                                        mode === 'teaser' ? 'bg-purple-600 hover:bg-purple-500' :
                                        'bg-emerald-600 hover:bg-emerald-500'}
                                      disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}
                              >
                                  {mode === 'straight' ? 'Lock In Straight Bets' : 
                                   mode === 'robin' ? 'Create Round Robin' : 
                                   'Lock In Bet'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </>
      )}
    </div>
  );
}