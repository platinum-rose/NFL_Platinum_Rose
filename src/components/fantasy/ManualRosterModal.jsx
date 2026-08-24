// src/components/fantasy/ManualRosterModal.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Manual Roster & Master JSON Import Modal
// Supports bulk text/CSV paste, JSON file/text import, and dual-box reconciliation
// for league-wide keeper evaluation (-2 draft spots & Round 10 FA rules).
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { X, Upload, Plus, FileText, Check, AlertCircle, Sparkles, Layers, RefreshCw, FileCode } from 'lucide-react';
import { parseRawRosterText } from '../../lib/fantasyRosterParser';
import { reconcileRosterWithDraftBoard } from '../../lib/keeperEvaluator';

export default function ManualRosterModal({ isOpen, onClose, onRosterImported }) {
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'reconcile' | 'bulk' | 'single'
  const [rawText, setRawText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);

  // Dual-Box Reconciliation State
  const [draftBoardText, setDraftBoardText] = useState('');
  const [finalRosterText, setFinalRosterText] = useState('');

  // Single Player Form State
  const [singleName, setSingleName] = useState('');
  const [singlePos, setSinglePos] = useState('WR');
  const [singleTeam, setSingleTeam] = useState('CIN');
  const [singleCost, setSingleCost] = useState('8');
  const [replaceExisting, setReplaceExisting] = useState(true);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    const val = e.target.value;
    setRawText(val);
    const parsed = parseRawRosterText(val);
    setParsedPreview(parsed);
  };

  const handleImportBulk = () => {
    if (parsedPreview.length === 0) return;
    onRosterImported(parsedPreview, replaceExisting ? 'replace' : 'append');
    onClose();
  };

  const handleImportJson = () => {
    try {
      const data = JSON.parse(jsonText);
      let playersToImport = [];

      if (Array.isArray(data)) {
        playersToImport = data;
      } else if (data.players && Array.isArray(data.players)) {
        playersToImport = data.players;
      } else if (data.teams && Array.isArray(data.teams)) {
        // Flatten team rosters into unified list
        data.teams.forEach(teamObj => {
          const tName = teamObj.teamName || teamObj.owner || 'My Team';
          (teamObj.finalRoster || teamObj.roster || []).forEach(p => {
            playersToImport.push({
              ...p,
              draftTeam: tName,
              keeperCostRound: p.keeperCostRound || p.lastSeasonRound || 10,
              acquisitionType: p.acquisitionType || (p.keeperCostRound ? 'Drafted' : 'Free Agent Pickup')
            });
          });
        });
      }

      if (playersToImport.length > 0) {
        onRosterImported(playersToImport, 'replace');
        onClose();
      } else {
        alert("No valid player records found in JSON structure.");
      }
    } catch (e) {
      alert("Invalid JSON format. Please check syntax: " + e.message);
    }
  };

  const handleLoadMasterPreset = () => {
    fetch('/league_keeper_master_2026.json')
      .then(res => {
        if (!res.ok) throw new Error("Preset file not found");
        return res.json();
      })
      .then(data => {
        setJsonText(JSON.stringify(data, null, 2));
      })
      .catch(err => {
        alert("Could not load master preset: " + err.message);
      });
  };

  const handleReconcileImport = () => {
    const draftBoard = parseRawRosterText(draftBoardText);
    const finalRoster = parseRawRosterText(finalRosterText);

    if (finalRoster.length === 0 && draftBoard.length === 0) return;

    const reconciled = reconcileRosterWithDraftBoard(
      finalRoster.length > 0 ? finalRoster : draftBoard,
      draftBoard
    );

    onRosterImported(reconciled, 'replace');
    onClose();
  };

  const handleAddSingle = (e) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    const playerObj = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      player: singleName.trim(),
      position: singlePos,
      team: singleTeam.toUpperCase(),
      keeperCostRound: parseInt(singleCost, 10) || 10,
      keeperCostAuction: null,
      status: 'candidate',
      notes: `Round ${singleCost} keeper cost`,
      updatedAt: new Date().toISOString(),
    };
    onRosterImported([playerObj], 'append');
    setSingleName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121824] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0d14]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Upload size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Import Roster & League Keeper Master</h3>
              <p className="text-[11px] text-slate-400">Import Master JSON, CSVs, or Reconcile Final Roster vs Draft Board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode size={14} /> Master JSON Import
          </button>

          <button
            onClick={() => setActiveTab('reconcile')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reconcile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} /> Reconcile Roster vs Draft
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} /> Bulk CSV / Text
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus size={14} /> Single Player
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          
          {/* TAB 0: MASTER JSON IMPORT */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Paste League Keeper Master JSON
                </label>

                <button
                  type="button"
                  onClick={handleLoadMasterPreset}
                  className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles size={13} /> Load Preset JSON
                </button>
              </div>

              <textarea
                rows={9}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`{\n  "leagueName": "Fat Lazy Americans League",\n  "teams": [\n    {\n      "teamName": "Fat Lazy Americans",\n      "finalRoster": [\n        { "player": "Dak Prescott", "position": "QB", "team": "DAL" }\n      ]\n    }\n  ]\n}`}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  disabled={!jsonText.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check size={14} /> Import Master JSON
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: BULK PASTE / CSV */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Paste CSV or Raw Yahoo Text
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={handleTextChange}
                  placeholder={`Paste CSV export or Yahoo text:\n"Trey McBride",TE,ARI,8,"Drafted (Round 8)"\n"Kyle Monangai",RB,CHI,10,"Free Agent Pickup"`}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* LIVE PARSE PREVIEW SUMMARY */}
              {rawText.trim() && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Detected Players:</span>
                    <span className="font-bold text-emerald-400">{parsedPreview.length} Players Found</span>
                  </div>

                  {parsedPreview.length > 0 && (
                    <div className="max-h-28 overflow-y-auto divide-y divide-slate-800/60 text-[11px]">
                      {parsedPreview.slice(0, 8).map((p, i) => (
                        <div key={i} className="py-1 flex items-center justify-between">
                          <span className="font-bold text-white">{p.player} ({p.position}, {p.team})</span>
                          <span className="text-slate-400">Round {p.keeperCostRound} • {p.acquisitionType || 'Drafted'}</span>
                        </div>
                      ))}
                      {parsedPreview.length > 8 && (
                        <div className="py-1 text-[10px] text-slate-500 text-center">
                          + {parsedPreview.length - 8} more players
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500/40"
                  />
                  <span>Replace existing roster entries</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportBulk}
                    disabled={parsedPreview.length === 0}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check size={14} /> Import {parsedPreview.length} Players
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECONCILE FINAL ROSTER VS DRAFT BOARD */}
          {activeTab === 'reconcile' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} /> League Keeper Rules Applied:
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                  <li><strong className="text-white">Drafted & Kept Players:</strong> Cost = <span className="text-cyan-400 font-bold">Last Year Draft Round - 2 Spots</span> (e.g. Nico Collins Rd 7 → Keep in Rd 5).</li>
                  <li><strong className="text-white">Free Agent / Waiver Pickups:</strong> Kept in <span className="text-cyan-400 font-bold">Round 10</span>.</li>
                  <li><strong className="text-white">Dropped Mid-Season Players:</strong> Marked <span className="text-rose-400 font-bold">Ineligible</span>.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    1. Draft Board Export (Step 1/2 CSV)
                  </label>
                  <textarea
                    rows={6}
                    value={draftBoardText}
                    onChange={(e) => setDraftBoardText(e.target.value)}
                    placeholder="Paste full draft board export here..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    2. Final Season Roster (End of Season)
                  </label>
                  <textarea
                    rows={6}
                    value={finalRosterText}
                    onChange={(e) => setFinalRosterText(e.target.value)}
                    placeholder="Paste final roster text/CSV here..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReconcileImport}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Reconcile & Apply Keeper Rules
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SINGLE PLAYER ADD */}
          {activeTab === 'single' && (
            <form onSubmit={handleAddSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. Nico Collins"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Position</label>
                  <select
                    value={singlePos}
                    onChange={(e) => setSinglePos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="QB">QB</option>
                    <option value="RB">RB</option>
                    <option value="WR">WR</option>
                    <option value="TE">TE</option>
                    <option value="K">K</option>
                    <option value="DEF">DEF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Team</label>
                  <input
                    type="text"
                    value={singleTeam}
                    onChange={(e) => setSingleTeam(e.target.value)}
                    placeholder="e.g. HOU"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Last Draft Round</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={singleCost}
                    onChange={(e) => setSingleCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Player
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
