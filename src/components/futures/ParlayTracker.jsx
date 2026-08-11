// src/components/futures/ParlayTracker.jsx
// Phase D — Multi-leg parlay tracker with per-leg result toggles, auto-status
// advance, and hedge calculator integration.
import React, { useState, useMemo, useCallback } from 'react';
import {
  GitMerge, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle,
  Shield, TrendingUp, Link, X, Search,
} from 'lucide-react';
import {
  getParlays, addParlay, deleteParlay, updateParlayLeg, updateParlay,
  getPositions, computeParlayOdds, calcPayout, americanToDecimal,
  PARLAY_STATUS, PARLAY_LEG_TYPES, PARLAY_LEG_TYPE_LABELS,
  LEG_RESULT, FUTURES_TYPE_LABELS, POSITION_STATUS,
} from '../../lib/futures';
import { loadFromStorage } from '../../lib/storage';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt    = (n, d = 0) => n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';
const fmtUSD = (n) => `$${fmt(Math.abs(n ?? 0), 2)}`;
const fmtOdds = (o) => (Number(o) >= 0 ? `+${Number(o)}` : `${Number(o)}`);

// ── Style maps ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  LIVE:   'text-cyan-400',
  WON:    'text-emerald-400',
  LOST:   'text-rose-400',
  PUSHED: 'text-amber-400',
  VOIDED: 'text-slate-500',
};
const STATUS_BG = {
  LIVE:   'bg-cyan-500/10 border-cyan-500/30',
  WON:    'bg-emerald-500/10 border-emerald-500/30',
  LOST:   'bg-rose-500/10 border-rose-500/30',
  PUSHED: 'bg-amber-500/10 border-amber-500/30',
  VOIDED: 'bg-slate-500/10 border-slate-500/30',
};
const LEG_TYPE_COLOR = {
  SPREAD:    'text-blue-400 bg-blue-500/10',
  TOTAL:     'text-emerald-400 bg-emerald-500/10',
  MONEYLINE: 'text-purple-400 bg-purple-500/10',
  FUTURES:   'text-amber-400 bg-amber-500/10',
};
const RESULT_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-800/40 border-slate-700' },
  WIN:     { label: 'WIN',     color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
  LOSS:    { label: 'LOSS',    color: 'text-rose-400',    bg: 'bg-rose-500/20 border-rose-500/40' },
  PUSH:    { label: 'PUSH',    color: 'text-amber-400',   bg: 'bg-amber-500/20 border-amber-500/40' },
};

const BOOKS = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetOnline', 'Bookmaker', 'PointsBet', 'Unibet', 'BetRivers', 'Other'];
const RESULT_CYCLE = [LEG_RESULT.PENDING, LEG_RESULT.WIN, LEG_RESULT.LOSS, LEG_RESULT.PUSH];
const EMPTY_LEG = () => ({ type: PARLAY_LEG_TYPES.SPREAD, description: '', team: '', odds: '' });

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * ParlayTracker — 5th sub-tab inside FuturesPortfolio.
 *
 * Props:
 *   onSendToHedge({ label, stake, potentialPayout, mode }) — called when user
 *     clicks a hedge button; parent switches to the Hedge Calc tab with prefill.
 */
export default function ParlayTracker({ onSendToHedge }) {
  const [refreshKey, setRefresh]     = useState(0);
  const [showForm, setShowForm]      = useState(false);
  const [expandedId, setExpandedId]  = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter]   = useState('all');

  // Link-picker state (which form leg index is picking a linked bet/position)
  const [linkPickerLegIdx, setLinkPickerLegIdx] = useState(null);
  const [linkPickerSearch, setLinkPickerSearch] = useState('');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fName,  setFName]  = useState('');
  const [fBook,  setFBook]  = useState('');
  const [fStake, setFStake] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fLegs,  setFLegs]  = useState([EMPTY_LEG(), EMPTY_LEG()]);

  const refresh = useCallback(() => setRefresh(k => k + 1), []);

  // ── Data ───────────────────────────────────────────────────────────────────
  // refreshKey isn't read in any of these three bodies -- it exists purely to
  // force recompute (re-read from localStorage) after refresh() fires.
  /* eslint-disable react-hooks/exhaustive-deps */
  const parlays   = useMemo(() => getParlays(), [refreshKey]);
  const positions = useMemo(
    () => getPositions().filter(p => p.status === POSITION_STATUS.OPEN),
    [refreshKey],
  );
  const bankrollBets = useMemo(() => {
    const data = loadFromStorage('nfl_bankroll_data_v1', { bets: [] });
    return (data.bets || []).filter(
      b => b.status === 'pending' && !b.isParlay && b.type !== 'parlay',
    );
  }, [refreshKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // ── Form derived ───────────────────────────────────────────────────────────
  // Memoized (not just filtered inline) so it has a stable reference across
  // renders when fLegs hasn't changed — handleSaveParlay's useCallback below
  // depends on it, and a fresh array every render would defeat that
  // memoization entirely (react-hooks/preserve-manual-memoization).
  const fValidLegs = useMemo(() => fLegs.filter(
    l => l.description.trim() && l.odds !== '' && !isNaN(Number(l.odds)) && Math.abs(Number(l.odds)) >= 100,
  ), [fLegs]);
  const fTotalOdds = fValidLegs.length >= 2
    ? computeParlayOdds(fValidLegs.map(l => ({ ...l, odds: Number(l.odds), result: LEG_RESULT.PENDING })))
    : null;
  const fStakeNum = parseFloat(fStake) || 0;
  const fPayout   = fTotalOdds != null && fStakeNum > 0 ? calcPayout(fStakeNum, fTotalOdds) : null;

  // ── Filtered + sorted parlays ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const order = { LIVE: 0, WON: 1, LOST: 2, PUSHED: 3, VOIDED: 4 };
    const sorted = [...parlays].sort((a, b) => {
      const od = (order[a.status] ?? 5) - (order[b.status] ?? 5);
      return od !== 0 ? od : new Date(b.createdAt) - new Date(a.createdAt);
    });
    return statusFilter === 'all' ? sorted : sorted.filter(p => p.status === statusFilter);
  }, [parlays, statusFilter]);

  // ── Link-picker source list ────────────────────────────────────────────────
  const linkSources = useMemo(() => {
    const items = [];
    bankrollBets.forEach(b => items.push({
      id: `br_${b.id}`,
      source: 'bankroll',
      description: b.description || `${b.team || '?'} ${b.betType || ''}`.trim(),
      team: b.team || '',
      odds: b.odds || 0,
      type: PARLAY_LEG_TYPES[String(b.betType || 'SPREAD').toUpperCase()] || PARLAY_LEG_TYPES.SPREAD,
      linkedBetId: String(b.id),
      linkedPositionId: null,
    }));
    positions.forEach(p => items.push({
      id: `pos_${p.id}`,
      source: 'futures',
      description: `${p.team} — ${FUTURES_TYPE_LABELS[p.type] || p.type}`,
      team: p.team,
      odds: p.odds,
      type: PARLAY_LEG_TYPES.FUTURES,
      linkedPositionId: p.id,
      linkedBetId: null,
    }));
    return items;
  }, [bankrollBets, positions]);

  const filteredLinkSources = useMemo(() => {
    if (!linkPickerSearch.trim()) return linkSources;
    const q = linkPickerSearch.toLowerCase();
    return linkSources.filter(
      s => s.description.toLowerCase().includes(q) || s.team.toLowerCase().includes(q),
    );
  }, [linkSources, linkPickerSearch]);

  // ── Form handlers ──────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFName(''); setFBook(''); setFStake(''); setFNotes('');
    setFLegs([EMPTY_LEG(), EMPTY_LEG()]);
    setShowForm(false);
    setLinkPickerLegIdx(null);
    setLinkPickerSearch('');
  }, []);

  const handleUpdateLeg = useCallback((idx, field, val) =>
    setFLegs(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l)),
  []);

  const handleAddLeg    = useCallback(() => setFLegs(prev => [...prev, EMPTY_LEG()]), []);
  const handleRemoveLeg = useCallback(
    (idx) => setFLegs(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev),
    [],
  );

  const handleLinkItem = useCallback((item) => {
    if (linkPickerLegIdx == null) return;
    setFLegs(prev => prev.map((l, i) =>
      i !== linkPickerLegIdx ? l : {
        type: item.type,
        description: item.description,
        team: item.team,
        odds: String(item.odds),
        linkedPositionId: item.linkedPositionId || null,
        linkedBetId: item.linkedBetId || null,
      },
    ));
    setLinkPickerLegIdx(null);
    setLinkPickerSearch('');
  }, [linkPickerLegIdx]);

  const handleSaveParlay = useCallback(() => {
    if (fValidLegs.length < 2) return;
    if (!fStake || parseFloat(fStake) <= 0) return;
    addParlay({
      name: fName.trim(),
      legs: fValidLegs.map(l => ({ ...l, odds: Number(l.odds) })),
      stake: parseFloat(fStake),
      book: fBook,
      notes: fNotes,
    });
    resetForm();
    refresh();
  }, [fValidLegs, fName, fBook, fStake, fNotes, resetForm, refresh]);

  // ── Parlay actions ─────────────────────────────────────────────────────────
  const handleLegResult = useCallback((parlayId, legId, currentResult) => {
    const next = RESULT_CYCLE[(RESULT_CYCLE.indexOf(currentResult) + 1) % RESULT_CYCLE.length];
    updateParlayLeg(parlayId, legId, { result: next });
    refresh();
  }, [refresh]);

  const handleDeleteParlay = useCallback((id) => {
    deleteParlay(id);
    setConfirmDelete(null);
    if (expandedId === id) setExpandedId(null);
    refresh();
  }, [expandedId, refresh]);

  const handleStatusOverride = useCallback((parlayId, status) => {
    updateParlay(parlayId, { status });
    refresh();
  }, [refresh]);

  // ── Summary metrics ────────────────────────────────────────────────────────
  const live        = parlays.filter(p => p.status === PARLAY_STATUS.LIVE);
  const settled     = parlays.filter(p => p.status === PARLAY_STATUS.WON || p.status === PARLAY_STATUS.LOST);
  const liveStake   = live.reduce((s, p) => s + p.stake, 0);
  const livePayout  = live.reduce((s, p) => s + p.potentialPayout, 0);
  const settledPL   = settled.reduce((s, p) =>
    p.status === PARLAY_STATUS.WON ? s + (p.potentialPayout - p.stake) : s - p.stake, 0);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="Live Parlays"    value={live.length}         color="cyan" />
        <MiniCard label="Live Stake"      value={fmtUSD(liveStake)}   color="blue" />
        <MiniCard label="Live Max Payout" value={fmtUSD(livePayout)}  color="emerald" />
        <MiniCard
          label="Settled P&L"
          value={`${settledPL >= 0 ? '+' : ''}${fmtUSD(settledPL)}`}
          color={settledPL >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', PARLAY_STATUS.LIVE, PARLAY_STATUS.WON, PARLAY_STATUS.LOST, PARLAY_STATUS.PUSHED].map(s => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s}
          </FilterChip>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-900/30"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Cancel' : 'New Parlay'}
          </button>
        </div>
      </div>

      {/* ── Add Parlay form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-slate-900/70 border border-purple-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <GitMerge size={14} className="text-purple-400" /> New Parlay
          </h3>

          {/* Top fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name (optional)</label>
              <input
                value={fName}
                onChange={e => setFName(e.target.value)}
                placeholder="e.g. SNF 3-leg parlay"
                className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sportsbook</label>
              <select
                value={fBook}
                onChange={e => setFBook(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select…</option>
                {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stake ($)</label>
              <input
                type="number" min="0" step="1"
                value={fStake}
                onChange={e => setFStake(e.target.value)}
                placeholder="50"
                className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Legs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Legs ({fLegs.length})
              </span>
              <button
                onClick={handleAddLeg}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
              >
                <Plus size={11} /> Add Leg
              </button>
            </div>

            {fLegs.map((leg, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 text-xs font-bold w-5">#{idx + 1}</span>
                  <select
                    value={leg.type}
                    onChange={e => handleUpdateLeg(idx, 'type', e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(PARLAY_LEG_TYPE_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setLinkPickerLegIdx(idx); setLinkPickerSearch(''); }}
                    className="text-[10px] px-2 py-1 rounded border border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 font-bold flex items-center gap-1 transition"
                  >
                    <Link size={10} /> Link existing
                  </button>
                  <button
                    onClick={() => handleRemoveLeg(idx)}
                    className="ml-auto text-slate-600 hover:text-rose-400 transition"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      value={leg.description}
                      onChange={e => handleUpdateLeg(idx, 'description', e.target.value)}
                      placeholder="e.g. Eagles -3.5 · Chiefs ML · Over 48"
                      className="w-full bg-slate-900 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={leg.odds}
                      onChange={e => handleUpdateLeg(idx, 'odds', e.target.value)}
                      placeholder="e.g. -110"
                      className="w-full bg-slate-900 border border-slate-600 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Link picker (inline, per-leg) */}
                {linkPickerLegIdx === idx && (
                  <div className="mt-1 bg-slate-950 border border-cyan-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Search size={12} className="text-slate-500 shrink-0" />
                      <input
                        autoFocus
                        value={linkPickerSearch}
                        onChange={e => setLinkPickerSearch(e.target.value)}
                        placeholder="Search bankroll bets or futures positions…"
                        className="flex-1 bg-transparent text-white text-xs outline-none"
                      />
                      <button
                        onClick={() => setLinkPickerLegIdx(null)}
                        className="text-slate-500 hover:text-white transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {filteredLinkSources.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-2">
                        No matching bets or positions
                      </p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-0.5">
                        {filteredLinkSources.map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleLinkItem(item)}
                            className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded hover:bg-slate-800 transition"
                          >
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${LEG_TYPE_COLOR[item.type] || 'text-slate-400 bg-slate-700'}`}>
                              {PARLAY_LEG_TYPE_LABELS[item.type]}
                            </span>
                            <span className="text-white text-xs truncate flex-1">{item.description}</span>
                            <span className="text-slate-400 text-xs font-mono shrink-0">{fmtOdds(item.odds)}</span>
                            <span className={`text-[9px] uppercase font-bold shrink-0 ${item.source === 'futures' ? 'text-amber-400' : 'text-cyan-400'}`}>
                              {item.source}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payout preview */}
          {fTotalOdds != null && (
            <div className="flex items-center gap-4 bg-slate-800/50 rounded-lg px-4 py-2 text-sm flex-wrap">
              <span className="text-slate-500 text-xs">Total Odds</span>
              <span className="text-white font-mono font-bold">{fmtOdds(fTotalOdds)}</span>
              {fPayout != null && (
                <>
                  <span className="text-slate-500 text-xs">·  Payout</span>
                  <span className="text-emerald-400 font-mono font-bold">{fmtUSD(fPayout)}</span>
                  <span className="text-slate-500 text-xs">({fmtUSD(fPayout - fStakeNum)} profit)</span>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Notes (optional)</label>
            <textarea
              value={fNotes}
              onChange={e => setFNotes(e.target.value)}
              rows={2}
              placeholder="Context, angles, matchup notes…"
              className="mt-1 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveParlay}
              disabled={fValidLegs.length < 2 || fStakeNum <= 0}
              className="px-5 py-2 text-sm rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Parlay
            </button>
          </div>
        </div>
      )}

      {/* ── Parlay cards ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyParlays onNew={() => setShowForm(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(parlay => (
            <ParlayCard
              key={parlay.id}
              parlay={parlay}
              expanded={expandedId === parlay.id}
              onToggle={() => setExpandedId(expandedId === parlay.id ? null : parlay.id)}
              onLegResult={handleLegResult}
              onStatusOverride={(s) => handleStatusOverride(parlay.id, s)}
              onDelete={() => setConfirmDelete(parlay.id)}
              onSendToHedge={onSendToHedge}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-rose-400" size={20} />
              <h3 className="text-white font-bold">Delete Parlay?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteParlay(confirmDelete)}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PARLAY CARD
// ══════════════════════════════════════════════════════════════════════════════
function ParlayCard({ parlay, expanded, onToggle, onLegResult, onStatusOverride, onDelete, onSendToHedge }) {
  const wonLegs     = parlay.legs.filter(l => l.result === LEG_RESULT.WIN);
  const lossCount   = parlay.legs.filter(l => l.result === LEG_RESULT.LOSS).length;
  const pendingCount = parlay.legs.filter(l => l.result === LEG_RESULT.PENDING).length;
  const label       = parlay.name || `${parlay.legs.length}-leg parlay`;

  // Running value = what the current won legs are worth multiplicatively
  const wonDecimal  = wonLegs.length > 0
    ? wonLegs.reduce((prod, l) => prod * americanToDecimal(Number(l.odds)), 1)
    : null;
  const runningValue = wonDecimal != null ? parlay.stake * wonDecimal : null;

  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all ${expanded ? 'ring-1 ring-purple-500/30' : ''}`}>

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition"
      >
        <GitMerge size={15} className="text-purple-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{label}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-slate-500 text-xs">{parlay.legs.length} legs</span>
            {parlay.book && <span className="text-slate-600 text-xs">· {parlay.book}</span>}
            {wonLegs.length > 0 && (
              <span className="text-emerald-400 text-xs font-bold">{wonLegs.length}W</span>
            )}
            {lossCount > 0 && (
              <span className="text-rose-400 text-xs font-bold">{lossCount}L</span>
            )}
            {pendingCount > 0 && (
              <span className="text-slate-500 text-xs">{pendingCount} pending</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-[10px]">Odds</div>
          <div className="text-white font-mono text-sm font-bold">{fmtOdds(parlay.totalOdds)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-[10px]">Stake</div>
          <div className="text-white font-mono text-sm">{fmtUSD(parlay.stake)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-[10px]">To Win</div>
          <div className="text-emerald-400 font-mono text-sm font-bold">
            {fmtUSD(parlay.potentialPayout - parlay.stake)}
          </div>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${STATUS_BG[parlay.status]} ${STATUS_COLOR[parlay.status]}`}>
          {parlay.status}
        </span>
        {expanded
          ? <ChevronUp size={14} className="text-slate-500 shrink-0" />
          : <ChevronDown size={14} className="text-slate-500 shrink-0" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/50 px-4 py-4 space-y-4">

          {/* Running-value hedge banner — only when LIVE + legs have won */}
          {wonLegs.length > 0 && parlay.status === PARLAY_STATUS.LIVE && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-emerald-400 font-bold text-sm">
                  {wonLegs.length} leg{wonLegs.length > 1 ? 's' : ''} won
                </span>
                {runningValue != null && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    Position currently worth ~{fmtUSD(runningValue)} if cashed out.
                    {pendingCount > 0 && ` ${pendingCount} leg${pendingCount > 1 ? 's' : ''} still pending.`}
                  </p>
                )}
              </div>
              {onSendToHedge && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  {pendingCount > 0 && runningValue != null && (
                    <button
                      onClick={() => onSendToHedge({
                        label: `${label} (live legs)`,
                        stake: parlay.stake,
                        potentialPayout: runningValue,
                        mode: 'running',
                      })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-bold transition whitespace-nowrap"
                    >
                      Hedge Live Legs
                    </button>
                  )}
                  <button
                    onClick={() => onSendToHedge({
                      label,
                      stake: parlay.stake,
                      potentialPayout: parlay.potentialPayout,
                      mode: 'full',
                    })}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 font-bold flex items-center gap-1 transition whitespace-nowrap"
                  >
                    <Shield size={11} /> Hedge Full Payout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legs list */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Legs</span>
            {parlay.legs.map(leg => {
              const rc = RESULT_CONFIG[leg.result] || RESULT_CONFIG.PENDING;
              return (
                <div
                  key={leg.id}
                  className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                >
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${LEG_TYPE_COLOR[leg.type] || 'text-slate-400 bg-slate-700'}`}>
                    {PARLAY_LEG_TYPE_LABELS[leg.type] || leg.type}
                  </span>
                  <span className="text-white text-xs flex-1 truncate">
                    {leg.description || '—'}
                  </span>
                  <span className="text-slate-400 text-xs font-mono shrink-0">
                    {fmtOdds(leg.odds)}
                  </span>
                  {/* Cycle result on click */}
                  <button
                    onClick={() => onLegResult(parlay.id, leg.id, leg.result)}
                    title="Click to cycle: Pending → WIN → LOSS → PUSH"
                    className={`text-xs font-bold px-3 py-1 rounded-lg border transition min-w-[64px] text-center shrink-0 ${rc.bg} ${rc.color}`}
                  >
                    {rc.label}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {parlay.notes && (
            <p className="text-slate-500 text-xs italic">{parlay.notes}</p>
          )}

          {/* Meta + actions */}
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-slate-800">
            <span className="text-slate-600 text-xs">
              {new Date(parlay.createdAt).toLocaleDateString()}
            </span>
            <select
              value={parlay.status}
              onChange={e => onStatusOverride(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
            >
              {Object.values(PARLAY_STATUS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-400 text-xs font-bold hover:bg-rose-600/20 transition ml-auto"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SMALL HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function MiniCard({ label, value, color }) {
  const border = { cyan: 'border-cyan-500/20', blue: 'border-blue-500/20', emerald: 'border-emerald-500/20', rose: 'border-rose-500/20' }[color] || 'border-slate-700';
  const txt    = { cyan: 'text-cyan-400',  blue: 'text-blue-400',  emerald: 'text-emerald-400',  rose: 'text-rose-400' }[color] || 'text-white';
  return (
    <div className={`bg-slate-900/50 border ${border} rounded-xl px-4 py-3`}>
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{label}</div>
      <div className={`font-black text-lg ${txt}`}>{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all
        ${active
          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
          : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
        }`}
    >
      {children}
    </button>
  );
}

function EmptyParlays({ onNew }) {
  return (
    <div className="text-center py-14 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
      <GitMerge className="w-10 h-10 text-slate-700 mx-auto mb-3" />
      <h3 className="text-slate-400 font-bold text-lg mb-1">No Parlays Tracked</h3>
      <p className="text-slate-600 text-sm mb-4">
        Add a parlay to track per-leg results and unlock hedge opportunities.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-900/30"
      >
        <Plus size={14} /> Add First Parlay
      </button>
    </div>
  );
}
