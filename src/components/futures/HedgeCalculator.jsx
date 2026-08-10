// src/components/futures/HedgeCalculator.jsx
// Interactive hedge calculator — single-position + portfolio matrix modes
import React, { useState, useMemo, useCallback } from 'react';
import {
  Shield, ChevronDown, CheckCircle2, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, Plus, Zap, BarChart2, Lock, Info
} from 'lucide-react';
import { getPositions, addHedge, FUTURES_TYPE_LABELS, POSITION_STATUS } from '../../lib/futures';
import {
  analyzeScenario, computeAllModes, portfolioMatrix
} from '../../lib/hedgeCalculator';
import { TEAM_LOGOS } from '../../lib/teams';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n, d = 0) => isNaN(n) ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtUSD = (n) => {
  if (isNaN(n) || n == null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : n > 0 ? '+' : '';
  return `${sign}$${fmt(abs, 2)}`;
};
const fmtOdds = (o) => (Number(o) >= 0 ? `+${Number(o)}` : `${Number(o)}`);
const fmtRoi  = (r) => `${r >= 0 ? '+' : ''}${fmt(r, 1)}%`;
const pnlColor = (n) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-slate-400');

const BOOKS = [
  'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetOnline',
  'Bookmaker', 'PointsBet', 'Unibet', 'BetRivers', 'Other',
];

const MODES = [
  { id: 'lock',      label: 'Lock Profit',  icon: Lock,      tip: 'Equal profit in both outcomes — the safest hedge' },
  { id: 'breakeven', label: 'Break Even',   icon: Shield,    tip: 'Zero loss if futures fails; still profits if it wins' },
  { id: 'custom',    label: 'Custom Stake', icon: Zap,       tip: 'Enter your own hedge stake and see the outcome' },
];

// ═══════════════════════════════════════════════════════════════════════════���═══
export default function HedgeCalculator({ onRefresh, prefill = null, prefillActive = false }) {
  const [refreshKey, setRefreshKey]     = useState(0);
  const [selectedId, setSelectedId]     = useState('');
  const [hedgeOddsRaw, setHedgeOddsRaw] = useState('');
  const [hedgeBook, setHedgeBook]       = useState('');
  const [mode, setMode]                 = useState('lock');
  const [customStake, setCustomStake]   = useState('');
  const [saved, setSaved]               = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [showMatrix, setShowMatrix]     = useState(false);

  // Reload positions
  const positions = useMemo(() => getPositions().filter(p => p.status === POSITION_STATUS.OPEN), [refreshKey]);
  const selected  = useMemo(() => positions.find(p => String(p.id) === String(selectedId)) || null, [positions, selectedId]);

  const hedgeOdds    = parseInt(hedgeOddsRaw, 10);
  const hedgeOddsOk  = !isNaN(hedgeOdds) && Math.abs(hedgeOdds) >= 100;

  // ── Compute results ────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!selected || !hedgeOddsOk) return null;
    const { stake, potentialPayout } = selected;
    return computeAllModes(stake, potentialPayout, hedgeOdds);
  }, [selected, hedgeOdds, hedgeOddsOk]);

  const activeResult = useMemo(() => {
    if (!results) return null;
    if (mode === 'lock')      return results.lock;
    if (mode === 'breakeven') return results.breakEven;
    if (mode === 'custom') {
      const cs = parseFloat(customStake);
      if (isNaN(cs) || cs <= 0 || !selected) return null;
      return analyzeScenario(selected.stake, selected.potentialPayout, cs, hedgeOdds);
    }
    return null;
  }, [results, mode, customStake, selected, hedgeOdds]);

  // ── Portfolio matrix (same event type) ────────────────────────────────────
  const matrixPositions = useMemo(() => {
    if (!selected) return [];
    return positions.filter(p => p.type === selected.type);
  }, [positions, selected]);

  const matrix = useMemo(() => {
    if (matrixPositions.length < 2) return [];
    return portfolioMatrix(matrixPositions);
  }, [matrixPositions]);

  // Source position for display — either the prefilled parlay or the selected
  // saved futures position
  const hedgeSource = prefillActive ? prefill : selected;

  // ── Save hedge ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!selected || !activeResult || !hedgeOddsOk) return;
    setSaveError('');
    try {
      addHedge(selected.id, {
        team: selected.type === 'sb_matchup' ? selected.team2 || selected.team : selected.team,
        odds: hedgeOdds,
        stake: activeResult.hedgeStake,
        book: hedgeBook,
        trigger: 'Manual hedge via calculator',
        status: 'PLANNED',
      });
      setSaved(true);
      setRefreshKey(k => k + 1);
      if (onRefresh) onRefresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save hedge.');
    }
  }, [selected, activeResult, hedgeOdds, hedgeBook, hedgeOddsOk, onRefresh]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/30">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-white font-black text-base leading-none">Hedge Calculator</h3>
          <p className="text-slate-500 text-xs mt-0.5">Compute optimal hedge stakes · Lock guaranteed profit</p>
        </div>
      </div>

      {positions.length === 0 && !prefill ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
          <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No open positions to hedge.</p>
          <p className="text-slate-600 text-xs mt-1">Add a futures position first, or use the Parlay tab to send a parlay here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Prefill banner (from ParlayTracker) OR position picker */}
            {prefillActive ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Hedging Parlay
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {prefill.mode === 'running' ? 'Live legs value' : 'Full payout'}
                  </span>
                </div>
                <p className="text-white font-bold text-sm truncate">{prefill.label}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-400">Stake <span className="text-white font-mono">${fmt(prefill.stake, 2)}</span></span>
                  <span className="text-slate-400">Payout <span className="text-emerald-400 font-mono">${fmt(prefill.potentialPayout, 2)}</span></span>
                </div>
                {positions.length > 0 && (
                  <div className="pt-1">
                    <label className="text-[10px] text-slate-500">Or switch to a saved position:</label>
                    <select
                      value={selectedId}
                      onChange={e => { setSelectedId(e.target.value); setSaved(false); }}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— Use parlay numbers above —</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.team} · {FUTURES_TYPE_LABELS[p.type] || p.type} · ${p.stake}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Select Futures Position to Hedge
                </label>
                <select
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setSaved(false); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="">— Choose position —</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.team}{p.team2 ? ` / ${p.team2}` : ''} · {FUTURES_TYPE_LABELS[p.type] || p.type} · {fmtOdds(p.odds)} · ${p.stake}
                    </option>
                  ))}
                </select>

                {/* Selected position summary */}
                {selected && (
                  <PositionSummaryCard pos={selected} />
                )}
              </div>
            )}

            {/* Hedge odds input */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Hedge Bet Configuration
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Hedge Odds (American)</label>
                  <input
                    type="number"
                    placeholder="-110"
                    value={hedgeOddsRaw}
                    onChange={e => setHedgeOddsRaw(e.target.value)}
                    className={`w-full bg-slate-800 border text-sm rounded-lg px-3 py-2.5 focus:outline-none transition
                      ${hedgeOddsRaw && !hedgeOddsOk ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white focus:border-amber-500'}`}
                  />
                  {hedgeOddsRaw && !hedgeOddsOk && (
                    <p className="text-rose-400 text-[10px] mt-1">Enter valid American odds (≥100 or ≤-100)</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Sportsbook</label>
                  <select
                    value={hedgeBook}
                    onChange={e => setHedgeBook(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">— Optional —</option>
                    {BOOKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Mode tabs */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-2">Hedge Strategy</label>
                <div className="flex gap-1.5 flex-wrap">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      title={m.tip}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                        ${mode === m.id
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                    >
                      <m.icon size={11} /> {m.label}
                    </button>
                  ))}
                </div>
                {mode !== 'custom' && (
                  <p className="text-slate-600 text-[10px] mt-2 flex items-center gap-1">
                    <Info size={10} />
                    {MODES.find(m2 => m2.id === mode)?.tip}
                  </p>
                )}
              </div>

              {/* Custom stake input */}
              {mode === 'custom' && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Custom Hedge Stake ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="1"
                    value={customStake}
                    onChange={e => setCustomStake(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            {!selected || !hedgeOddsOk ? (
              <div className="h-full flex items-center justify-center bg-slate-900/30 border border-dashed border-slate-800 rounded-xl py-12">
                <div className="text-center">
                  <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Select a position + enter hedge odds</p>
                  <p className="text-slate-600 text-xs mt-1">Results will appear here</p>
                </div>
              </div>
            ) : (
              <>
                {/* Recommended stake card */}
                <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-amber-400/70 tracking-wider">
                      {MODES.find(m2 => m2.id === mode)?.label} Result
                    </span>
                    {activeResult?.isLocked && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Lock size={9} /> Locked
                      </span>
                    )}
                  </div>

                  {activeResult ? (
                    <div className="grid grid-cols-2 gap-3">
                      <BigStat
                        label="Hedge Stake"
                        value={`$${fmt(activeResult.hedgeStake, 2)}`}
                        sub={`@ ${fmtOdds(activeResult.hedgeOdds)} → $${fmt(activeResult.hedgePayout, 2)} payout`}
                        accent="amber"
                      />
                      <BigStat
                        label="Total Invested"
                        value={`$${fmt(activeResult.totalInvested, 2)}`}
                        sub={`$${fmt(hedgeSource?.stake)} stake + $${fmt(activeResult.hedgeStake, 2)} hedge`}
                        accent="blue"
                      />
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      {mode === 'custom' ? 'Enter a custom stake amount' : 'Enter valid hedge odds'}
                    </p>
                  )}
                </div>

                {/* Scenario table */}
                {activeResult && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Outcome Scenarios</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="px-4 py-2 text-left text-[10px] text-slate-500 font-bold uppercase tracking-wider">Outcome</th>
                          <th className="px-4 py-2 text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net P&L</th>
                          <th className="px-4 py-2 text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider">ROI</th>
                          <th className="px-4 py-2 text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider">vs No Hedge</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ScenarioRow
                          label={`✅ Futures Wins`}
                          labelSub={hedgeSource?.team || ''}
                          net={activeResult.futuresWin}
                          roi={(activeResult.futuresWin / activeResult.totalInvested) * 100}
                          vsDelta={activeResult.futuresWin - results.noHedge.futuresWin}
                        />
                        <ScenarioRow
                          label={`❌ Futures Loses`}
                          labelSub="Hedge covers"
                          net={activeResult.futuresLose}
                          roi={(activeResult.futuresLose / activeResult.totalInvested) * 100}
                          vsDelta={activeResult.futuresLose - results.noHedge.futuresLose}
                        />
                      </tbody>
                    </table>

                    {/* vs No Hedge comparison footer */}
                    <div className="border-t border-slate-800 px-4 py-2.5 bg-slate-950/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">No-Hedge worst case</span>
                        <span className={`font-mono font-bold ${pnlColor(results.noHedge.futuresLose)}`}>
                          {fmtUSD(results.noHedge.futuresLose)}
                        </span>
                        <span className="text-slate-500 mx-2">→</span>
                        <span className="text-slate-500">Hedged worst case</span>
                        <span className={`font-mono font-bold ${pnlColor(activeResult.minNet)}`}>
                          {fmtUSD(activeResult.minNet)}
                        </span>
                        <span className={`ml-3 flex items-center gap-1 font-bold ${pnlColor(activeResult.minNet - results.noHedge.futuresLose)}`}>
                          {activeResult.minNet > results.noHedge.futuresLose
                            ? <TrendingUp size={12} />
                            : <TrendingDown size={12} />
                          }
                          {fmtUSD(activeResult.minNet - results.noHedge.futuresLose)} saved
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save button — only for saved futures positions, not parlay prefill */}
                {activeResult && !prefillActive && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all
                        ${saved
                          ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                        }`}
                    >
                      {saved ? <><CheckCircle2 size={14} /> Saved to Position</> : <><Plus size={14} /> Save Hedge to Position</>}
                    </button>
                    {hedgeBook && <span className="text-slate-500 text-xs">on {hedgeBook}</span>}
                    {saveError && <span className="text-rose-400 text-xs">{saveError}</span>}
                  </div>
                )}
                {activeResult && prefillActive && (
                  <p className="text-slate-600 text-xs italic">
                    Save this hedge manually once placed — parlay stakes aren't linked to saved positions.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Portfolio Matrix ── */}
      {matrix.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowMatrix(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition"
          >
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-purple-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Portfolio Scenarios — {matrixPositions.length} {FUTURES_TYPE_LABELS[selected?.type] || 'Futures'} Positions
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                {matrix.length} outcomes
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-500 transition-transform ${showMatrix ? 'rotate-180' : ''}`}
            />
          </button>

          {showMatrix && (
            <div className="border-t border-slate-800">
              <p className="px-4 py-2 text-[10px] text-slate-600">
                Net P&L across all your {FUTURES_TYPE_LABELS[selected?.type] || selected?.type} positions for each possible winner (hedge bets with PLACED status included).
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40">
                    <th className="px-4 py-2 text-left text-[10px] text-slate-500 font-bold uppercase tracking-wider">If Winner Is…</th>
                    {matrixPositions.map(p => (
                      <th key={p.id} className="px-3 py-2 text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-20">
                        {p.team}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-right text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Net</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map(row => (
                    <tr key={row.winner} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={TEAM_LOGOS[row.winner] || TEAM_LOGOS[row.winner?.split(' ').pop()] || ''}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          <span className="text-white font-bold text-xs">{row.winner}</span>
                        </div>
                      </td>
                      {row.breakdown.map(b => (
                        <td key={b.team} className={`px-3 py-2.5 text-right font-mono text-xs font-bold ${pnlColor(b.pnl)}`}>
                          {fmtUSD(b.pnl)}
                        </td>
                      ))}
                      <td className={`px-4 py-2.5 text-right font-mono text-sm font-black ${pnlColor(row.totalNet)}`}>
                        {fmtUSD(row.totalNet)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PositionSummaryCard({ pos }) {
  const logo = TEAM_LOGOS[pos.team] || TEAM_LOGOS[pos.team?.split(' ').pop()] || '';
  return (
    <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5">
      <img src={logo} alt="" className="w-8 h-8 object-contain shrink-0" onError={e => { e.target.style.display = 'none'; }} />
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm truncate">{pos.team}{pos.team2 ? ` / ${pos.team2}` : ''}</div>
        <div className="text-purple-400 text-[10px] uppercase font-bold">{FUTURES_TYPE_LABELS[pos.type] || pos.type}</div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-white font-mono text-sm font-bold">{pos.odds >= 0 ? `+${pos.odds}` : pos.odds}</div>
        <div className="text-slate-400 text-xs">{`$${pos.stake}`} → <span className="text-emerald-400">${pos.potentialPayout.toFixed(0)}</span></div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub, accent }) {
  const colors = {
    amber:   'text-amber-400',
    blue:    'text-blue-400',
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
  };
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-black ${colors[accent] || 'text-white'}`}>{value}</div>
      {sub && <div className="text-slate-600 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

function ScenarioRow({ label, labelSub, net, roi, vsDelta }) {
  return (
    <tr className="border-b border-slate-800/50 last:border-0">
      <td className="px-4 py-3">
        <div className="text-white text-xs font-bold">{label}</div>
        {labelSub && <div className="text-slate-500 text-[10px]">{labelSub}</div>}
      </td>
      <td className={`px-4 py-3 text-right font-mono font-black text-sm ${pnlColor(net)}`}>
        {fmtUSD(net)}
      </td>
      <td className={`px-4 py-3 text-right font-mono text-xs ${pnlColor(roi)}`}>
        {fmtRoi(roi)}
      </td>
      <td className={`px-4 py-3 text-right font-mono text-xs ${pnlColor(vsDelta)}`}>
        {vsDelta > 0 ? `+$${Math.abs(vsDelta).toFixed(2)}` : vsDelta < 0 ? `-$${Math.abs(vsDelta).toFixed(2)}` : '—'}
      </td>
    </tr>
  );
}
