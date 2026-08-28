// src/components/official-picks/OfficialPicksTab.jsx
// F-29 -- Platinum Rose AI official picks tab.
//
// Wires the local official-picks inbox server (scripts/official-pick-inbox-server.js,
// http://127.0.0.1:8787) and its ledger scorecard report into the main dashboard.
//
// This tab is a thin client over a local-only, loopback-bound Node server:
//   - GET  /api/inbox    -> { active_count, ledger_summary, items[] }
//   - POST /api/approve  -> locks a valid draft proposal as an official paper pick
//   - POST /api/reject   -> archives a draft with a reason
//   - GET  /ledger        -> full HTML scorecard report (embedded via iframe)
//
// Guardrails (see docs/PLATINUM_ROSE_AI_OFFICIAL_PICKS_SPEC_2026.md):
//   - Platinum Rose AI is a paper-tracked, human-verified expert -- never autonomous.
//   - This tab never generates proposals. It only surfaces drafts that already
//     exist on disk (data/official-picks/proposals/active/) and lets a human
//     approve or reject them. Real AI proposal generation is explicitly held
//     until the full futures synthesis run (per TASK_BOARD F-29).
//   - No Supabase writes happen from this tab -- the local ledger JSON file is
//     the only thing mutated, exactly as today's CLI/inbox-server workflow does.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck, RefreshCw, ExternalLink, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, WifiOff, Inbox, ScrollText,
  Loader2, Pin, PinOff,
} from 'lucide-react';
import { OFFICIAL_PICKS } from '../../lib/apiConfig';
import { FAILSAFE_TIMEOUT_MS, fetchJson } from '../../lib/officialPicksApi';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage';
import { useAlphaDataPacket } from '../../lib/useAlphaDataPacket';

// Pin (Phase 1, 2026-08-24): the inbox itself is a thin client over the
// local loopback server (see file header) -- there's no server-side field
// to persist a "pin" into, and Approve/Reject already cover "delete" (Reject
// archives a draft with a reason, same end state as removing it). Pin is
// therefore a purely client-side, local-only overlay: a set of draft
// filenames kept in localStorage so a reviewer can flag drafts to come back
// to. It never calls the inbox server and never touches Supabase.
const PINNED_KEY = PR_STORAGE_KEYS.OFFICIAL_PICKS_PINNED.key;
const loadPinned = () => new Set(loadFromStorage(PINNED_KEY, []));
const savePinned = (set) => saveToStorage(PINNED_KEY, Array.from(set));

const BASE = OFFICIAL_PICKS.BASE;

function fmtUnits(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `${Number(value).toFixed(2).replace(/\.?0+$/, '') || '0'}u`;
}

function fmtPct(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function fmtConfidence(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `${Number(value).toFixed(1).replace(/\.0$/, '')}%`;
}

function fmtMoney(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `$${Number(value).toFixed(2)}`;
}

function StatChip({ label, value, accent = '' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[110px]">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className={`text-lg font-black ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}

function readinessStatus(readiness) {
  if (!readiness) return { label: 'Unknown', className: 'bg-slate-700/40 text-slate-400 border-slate-600/30' };
  if (readiness.exacta_hold) return { label: 'Hold', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  if (readiness.proposal_ready) return { label: 'Ready', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  return { label: 'Needs work', className: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
}

function CandidateCard({ item, busy, pinned, onTogglePin, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const p = item.proposal || {};
  const r = item.readiness || {};
  const status = readinessStatus(r);
  const canApprove = r.proposal_ready && !r.exacta_hold && !busy;
  const checks = [
    ...(r.errors || []).map((m) => ({ kind: 'error', m })),
    ...(r.warnings || []).map((m) => ({ kind: 'warning', m })),
    ...(r.info || []).map((m) => ({ kind: 'info', m })),
  ];

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden ${pinned ? 'border-amber-500/40' : 'border-slate-800'}`}>
      <div className="flex items-start gap-0">
        <button
          className="flex-1 text-left p-4 flex items-start gap-3 min-w-0"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="mt-0.5 text-slate-500 shrink-0">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.className}`}>
                {status.label}
              </span>
              {p.pick_scope && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{p.pick_scope}</span>
              )}
            </div>
            <div className="text-sm font-bold text-white truncate pr-2">{p.selection || '(no selection)'}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              {p.market_type && <span>{p.market_type}{p.market ? ` / ${p.market}` : ''}</span>}
              {p.book && <span>{p.book}{p.price != null ? ` ${p.price}` : ''}{p.line != null ? ` / line ${p.line}` : ''}</span>}
              {p.stake_units != null && <span className="text-cyan-400 font-medium">{fmtUnits(p.stake_units)}{p.stake_usd != null ? ` (${fmtMoney(p.stake_usd)})` : ''}</span>}
              {p.confidence != null && <span>{fmtConfidence(p.confidence)} conf</span>}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 p-3 shrink-0">
          <button
            onClick={() => onTogglePin(item.file)}
            title={pinned ? 'Unpin' : 'Pin to top'}
            className={`p-1.5 rounded-lg transition-all ${pinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-white'}`}
          >
            {pinned ? <Pin size={14} className="fill-current" /> : <PinOff size={14} />}
          </button>
          <button
            onClick={() => onApprove(item.file)}
            disabled={!canApprove}
            title={canApprove ? 'Approve as official paper pick' : 'Not ready to approve'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
              canApprove
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={13} /> Approve
          </button>
          <button
            onClick={() => onReject(item.file)}
            disabled={busy}
            title="Reject and archive this draft"
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-3 text-xs">
          <div className="text-slate-500 font-mono">{item.file}</div>
          {p.thesis && <div><span className="text-slate-400 font-bold">Thesis: </span><span className="text-slate-300">{p.thesis}</span></div>}
          {p.market_view && <div><span className="text-slate-400 font-bold">Market view: </span><span className="text-slate-300">{p.market_view}</span></div>}
          {p.football_view && <div><span className="text-slate-400 font-bold">Football view: </span><span className="text-slate-300">{p.football_view}</span></div>}
          {p.disconfirming_factor && <div><span className="text-slate-400 font-bold">Disconfirming factor: </span><span className="text-slate-300">{p.disconfirming_factor}</span></div>}
          {checks.length > 0 && (
            <div className="space-y-1 pt-1">
              {checks.map((c, i) => (
                <div key={i} className={`flex items-start gap-1.5 ${
                  c.kind === 'error' ? 'text-rose-400' : c.kind === 'warning' ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  <span>{c.m}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfficialLedgerCard({ pick }) {
  const result = String(pick.result_status || 'pending').toUpperCase();
  const resultClass = result === 'WON' || result === 'WIN'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : result === 'LOST' || result === 'LOSS'
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    : result === 'PUSH'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-slate-700/40 text-slate-400 border-slate-600/30';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${resultClass}`}>
              {result}
            </span>
            {pick.pick_scope && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{pick.pick_scope}</span>
            )}
            {pick.week != null && <span className="text-[10px] text-slate-500">Week {pick.week}</span>}
          </div>
          <div className="text-sm font-bold text-white">{pick.selection || '(no selection)'}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            {pick.market_type && <span>{pick.market_type}{pick.market ? ` / ${pick.market}` : ''}</span>}
            {pick.book && <span>{pick.book}{pick.price != null ? ` ${pick.price}` : ''}{pick.line != null ? ` / line ${pick.line}` : ''}</span>}
            {pick.stake_units != null && <span className="text-cyan-400 font-medium">{fmtUnits(pick.stake_units)}{pick.stake_usd != null ? ` (${fmtMoney(pick.stake_usd)})` : ''}</span>}
            {pick.confidence != null && <span>{fmtConfidence(pick.confidence)} conf</span>}
          </div>
        </div>
      </div>
      {pick.thesis && <p className="text-xs text-slate-300"><span className="text-slate-500 font-bold">Thesis: </span>{pick.thesis}</p>}
      {pick.market_view && <p className="text-xs text-slate-400"><span className="text-slate-500 font-bold">Market: </span>{pick.market_view}</p>}
      {pick.football_view && <p className="text-xs text-slate-400"><span className="text-slate-500 font-bold">Football: </span>{pick.football_view}</p>}
    </div>
  );
}

function AlphaProposalCard({ item }) {
  const proposal = item.proposal || {};
  const confidence = proposal.confidence != null ? Number(proposal.confidence) : null;
  const units = proposal.recommended_units ?? proposal.stake_units;

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30">
              ACTIVE DRAFT
            </span>
            {proposal.market && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{proposal.market}</span>
            )}
            {proposal.source && <span className="text-[10px] text-slate-500">{proposal.source}</span>}
          </div>
          <div className="text-sm font-bold text-white">{proposal.pick || proposal.selection || '(no pick text)'}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            {proposal.game_id && <span>{proposal.game_id}</span>}
            {proposal.odds != null && <span>{proposal.odds > 0 ? `+${proposal.odds}` : proposal.odds}</span>}
            {proposal.contest_line != null && <span>contest {proposal.contest_line}</span>}
            {proposal.closing_line != null && <span>market {proposal.closing_line}</span>}
            {units != null && <span className="text-cyan-400 font-medium">{fmtUnits(units)}</span>}
            {confidence != null && <span>{confidence > 1 ? confidence : Math.round(confidence * 100)}% conf</span>}
          </div>
        </div>
      </div>
      {proposal.subject && <p className="text-xs text-slate-400"><span className="text-slate-500 font-bold">Subject: </span>{proposal.subject}</p>}
      {proposal.rationale && <p className="text-xs text-slate-300"><span className="text-slate-500 font-bold">Rationale: </span>{proposal.rationale}</p>}
      <div className="text-[10px] text-slate-600 font-mono">{item.file}</div>
    </div>
  );
}

function AlphaOfficialPicksView() {
  const { packet, loading, error } = useAlphaDataPacket();
  const ledger = packet?.market_context?.official_paper_ledger;
  const picks = ledger?.picks || [];
  const activeProposals = ledger?.active_proposals || [];
  const pending = picks.filter((pick) => String(pick.result_status || '').toLowerCase() === 'pending').length
    + activeProposals.filter((item) => String(item.proposal?.status || '').toLowerCase().includes('pending')).length;
  const netUnits = picks.reduce((sum, pick) => sum + (Number(pick.net_units) || 0), 0);

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ShieldCheck size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Platinum Rose AI — Official Picks</h2>
            <p className="text-xs text-slate-400">Read-only paper ledger and active draft proposals from the Alpha data packet.</p>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
        Alpha tester view is read-only for official paper picks. Test picks and bankroll entries save separately to the active tester profile.
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading official picks from the Alpha packet...</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2.5">
            <StatChip label="Official paper" value={picks.length} accent="text-emerald-400" />
            <StatChip label="Active drafts" value={activeProposals.length} accent="text-amber-400" />
            <StatChip label="Pending" value={pending} accent="text-amber-400" />
            <StatChip label="Net units" value={fmtUnits(netUnits)} accent={netUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <StatChip label="Updated" value={ledger?.meta?.updated_at ? new Date(ledger.meta.updated_at).toLocaleDateString() : '-'} />
          </div>

          {activeProposals.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Active Draft Proposals</div>
              {activeProposals.map((item) => <AlphaProposalCard key={item.file} item={item} />)}
            </div>
          )}

          {picks.length === 0 && activeProposals.length === 0 ? (
            <div className="text-center py-20">
              <Inbox size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 font-bold">No Official Picks in Packet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Official Paper Ledger</div>
              {picks.map((pick) => <OfficialLedgerCard key={pick.pick_id || pick.selection} pick={pick} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OfficialPicksTab({ alphaMode = false }) {
  if (alphaMode) return <AlphaOfficialPicksView />;
  return <OwnerOfficialPicksTab />;
}

function OwnerOfficialPicksTab() {
  const [serverStatus, setServerStatus] = useState('checking'); // checking | online | offline
  const [data, setData] = useState(null);
  const [view, setView] = useState('inbox'); // inbox | ledger
  const [busyFile, setBusyFile] = useState(null);
  const [toast, setToast] = useState('');
  const [ledgerNonce, setLedgerNonce] = useState(0);
  const [pinned, setPinned] = useState(() => loadPinned());
  const mountedRef = useRef(true);

  const handleTogglePin = (file) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file); else next.add(file);
      savePinned(next);
      return next;
    });
  };

  // NOTE: this must SET true on mount, not just clear on unmount. React 18
  // <StrictMode> (see src/main.jsx) intentionally double-invokes effects in
  // dev: mount -> run effect -> run cleanup -> run effect again. With a
  // mount-effect that only returns a cleanup (no body), the first
  // simulated-unmount cleanup flips `mountedRef.current` to false and
  // nothing ever flips it back to true, so every `if (!mountedRef.current)
  // return;` guard below (in `probe()`) becomes permanently dead code and
  // `serverStatus` can never leave "checking" -- this was confirmed via
  // live browser check (2026-08-21, Codex review) staying stuck on
  // "Checking local inbox server..." past 15s even with the offline
  // failsafe timer in place, because the failsafe's own state update was
  // also being silently dropped by this same guard.
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const probe = useCallback(async () => {
    setServerStatus((s) => (s === 'online' ? 'online' : 'checking'));

    // Failsafe: force the offline state if we're still "checking" once this
    // fires. Cleared in `finally` below as soon as the real probe settles
    // (success or failure) -- this only fires if that never happened.
    const failsafeTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setServerStatus((s) => (s === 'checking' ? 'offline' : s));
      setData((d) => (d === null ? d : null));
    }, FAILSAFE_TIMEOUT_MS);

    try {
      const json = await fetchJson(`${BASE}/api/inbox`);
      if (!mountedRef.current) return;
      setData(json);
      setServerStatus('online');
    } catch {
      if (!mountedRef.current) return;
      setServerStatus('offline');
      setData(null);
    } finally {
      clearTimeout(failsafeTimer);
    }
  }, []);

  useEffect(() => { probe(); }, [probe]);

  const handleRefresh = () => {
    probe();
    setLedgerNonce((n) => n + 1);
  };

  const handleApprove = async (file) => {
    setBusyFile(file);
    try {
      const res = await fetchJson(`${BASE}/api/approve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file }),
      });
      setToast(res.message || 'Approved.');
      await probe();
      setLedgerNonce((n) => n + 1);
    } catch (e) {
      setToast(`Approve failed: ${e.message}`);
    } finally {
      setBusyFile(null);
      setTimeout(() => setToast(''), 5000);
    }
  };

  const handleReject = async (file) => {
    const reason = window.prompt('Reason for rejecting this draft?', 'Rejected from Official Picks tab');
    if (reason === null) return; // cancelled
    setBusyFile(file);
    try {
      const res = await fetchJson(`${BASE}/api/reject`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file, reason: reason || 'Rejected from Official Picks tab' }),
      });
      setToast(res.message || 'Rejected.');
      await probe();
      setLedgerNonce((n) => n + 1);
    } catch (e) {
      setToast(`Reject failed: ${e.message}`);
    } finally {
      setBusyFile(null);
      setTimeout(() => setToast(''), 5000);
    }
  };

  const ledger = data?.ledger_summary;
  // Pinned drafts sort first, so a reviewer's flagged items don't scroll off
  // as new drafts land in the inbox.
  const items = [...(data?.items || [])].sort((a, b) => {
    const aPinned = pinned.has(a.file);
    const bPinned = pinned.has(b.file);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ShieldCheck size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Platinum Rose AI — Official Picks</h2>
            <p className="text-xs text-slate-400">Local paper-tracked expert. Human verification required before any pick goes official.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {serverStatus === 'online' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('inbox')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${view === 'inbox' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'}`}
              >
                <Inbox size={13} /> Inbox
              </button>
              <button
                onClick={() => setView('ledger')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${view === 'ledger' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'}`}
              >
                <ScrollText size={13} /> Ledger Scorecard
              </button>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} className={serverStatus === 'checking' ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Guardrail strip */}
      <div className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
        Paper-tracked, human-verified only. No autonomous betting, no live AI proposal generation, no Supabase writes happen from this tab — approvals and rejections only update the local ledger file.
      </div>

      {/* Toast */}
      {toast && (
        <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg">
          {toast}
        </div>
      )}

      {/* Checking */}
      {serverStatus === 'checking' && (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Checking local inbox server at {BASE}...</span>
        </div>
      )}

      {/* Offline */}
      {serverStatus === 'offline' && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <WifiOff size={40} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-300 font-bold">Local inbox server isn't running</p>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            This tab reads from the local Platinum Rose AI inbox/ledger server, which isn't reachable at{' '}
            <code className="text-slate-400">{BASE}</code>.
          </p>
          <div className="mt-4 text-xs text-slate-400 space-y-1">
            <p>Start it with one of:</p>
            <p><code className="bg-slate-950 px-2 py-1 rounded text-slate-300">Launch Platinum Rose Inbox.cmd</code></p>
            <p><code className="bg-slate-950 px-2 py-1 rounded text-slate-300">npm run official:picks:serve</code></p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-5 px-4 py-2 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Online: Inbox view */}
      {serverStatus === 'online' && view === 'inbox' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2.5">
            <StatChip label="Active drafts" value={data.active_count ?? 0} />
            <StatChip label="Official paper" value={ledger?.official_paper ?? 0} accent="text-emerald-400" />
            <StatChip label="Total picks" value={ledger?.total_picks ?? 0} />
            <StatChip label="Pending" value={ledger?.pending ?? 0} accent="text-amber-400" />
            <StatChip label="Net units" value={fmtUnits(ledger?.net_units)} accent={Number(ledger?.net_units) >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <StatChip label="ROI" value={fmtPct(ledger?.roi)} />
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <Inbox size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 font-bold">No Active Draft Proposals</p>
              <p className="text-slate-600 text-sm mt-2 max-w-sm mx-auto">
                Drafts placed in <code className="text-slate-500">data/official-picks/proposals/active/</code> will
                show up here for human review. This tab does not generate proposals.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CandidateCard
                  key={item.file}
                  item={item}
                  busy={busyFile === item.file}
                  pinned={pinned.has(item.file)}
                  onTogglePin={handleTogglePin}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online: Ledger view */}
      {serverStatus === 'online' && view === 'ledger' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <a
              href={`${BASE}/ledger`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-all"
            >
              <ExternalLink size={12} /> Open in new tab
            </a>
          </div>
          <iframe
            key={ledgerNonce}
            title="Platinum Rose AI Ledger Scorecard"
            src={`${BASE}/ledger?_=${ledgerNonce}`}
            className="w-full h-[75vh] rounded-xl border border-slate-800 bg-white"
          />
        </div>
      )}
    </div>
  );
}
