// src/components/modals/StorageBackupModal.jsx
// Backup & restore tool for all localStorage app data
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Upload, RefreshCw, Database, CheckCircle, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import {
  getStorageDiagnostics, downloadBackup, importAppData,
  PR_STORAGE_KEYS, CRITICAL_KEYS, clearStorage
} from '../../lib/storage';

const PERMANENCE_COLOR = {
  critical:   'text-rose-400',
  persistent: 'text-amber-400',
  ephemeral:  'text-slate-500',
};
const PERMANENCE_BADGE = {
  critical:   'bg-rose-500/10 border-rose-500/30 text-rose-400',
  persistent: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  ephemeral:  'bg-slate-700/50 border-slate-600 text-slate-500',
};

export default function StorageBackupModal({ isOpen, onClose }) {
  const [rows, setRows]         = useState([]);
  const [status, setStatus]     = useState(null);   // { type: 'ok'|'error', msg }
  const [clearing, setClearing] = useState(null);   // key being confirmed for clear
  const fileRef = useRef(null);

  const refresh = useCallback(() => setRows(getStorageDiagnostics()), []);

  // Re-reads storage diagnostics each time the modal opens -- a real sync
  // effect (reacts to the isOpen prop), not derivable state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isOpen) refresh(); }, [isOpen, refresh]);

  // ── Export ────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    try {
      downloadBackup();
      setStatus({ type: 'ok', msg: 'Backup downloaded to your machine.' });
    } catch (e) {
      setStatus({ type: 'error', msg: `Export failed: ${e.message}` });
    }
  }, []);

  // ── Import ────────────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const snapshot = JSON.parse(evt.target.result);
        const { restored, skipped } = importAppData(snapshot);
        setStatus({ type: 'ok', msg: `Restored ${restored} keys (${skipped} skipped). Reload the page.` });
        refresh();
      } catch (err) {
        setStatus({ type: 'error', msg: `Import failed: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [refresh]);

  // ── Clear individual key ──────────────────────────────────
  const handleClearKey = useCallback((key, emptyValue) => {
    clearStorage(key, emptyValue);
    setClearing(null);
    setStatus({ type: 'ok', msg: `Cleared "${key}". Reload to apply.` });
    refresh();
  }, [refresh]);

  if (!isOpen) return null;

  const totalKB = rows.reduce((sum, r) => sum + parseFloat(r.size), 0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-800/50 to-slate-900">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[#00d2be]" />
            <h2 className="text-white font-black text-base">Data & Storage Manager</h2>
            <span className="text-xs text-slate-500 font-mono ml-1">{totalKB} KB used</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition"><X size={18} /></button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition"
          >
            <Download size={12} /> Export Backup (.json)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition"
          >
            <Upload size={12} /> Restore from Backup
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-700 transition ml-auto"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Status banner */}
        {status && (
          <div className={`mx-5 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs border
            ${status.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {status.type === 'ok' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {status.msg}
            <button onClick={() => setStatus(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={11} /></button>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
          {['critical', 'persistent', 'ephemeral'].map(p => (
            <span key={p} className={`flex items-center gap-1 ${PERMANENCE_COLOR[p]}`}>
              <span className="w-2 h-2 rounded-full bg-current opacity-70" />
              {p}
            </span>
          ))}
          <span className="ml-auto text-slate-600">Critical keys are protected from accidental removal</span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1.5">
          {rows.map(row => {
            const meta = Object.values(PR_STORAGE_KEYS).find(e => e.key === row.key);
            const isCritical = CRITICAL_KEYS.has(row.key);
            return (
              <div
                key={row.key}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition
                  ${row.present
                    ? 'bg-slate-800/40 border-slate-700/50'
                    : 'bg-slate-900/30 border-slate-800/50 opacity-50'
                  }`}
              >
                {/* Permanence badge */}
                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border shrink-0 ${PERMANENCE_BADGE[meta?.permanence ?? 'ephemeral']}`}>
                  {meta?.permanence ?? '?'}
                </span>

                {/* Key name + description */}
                <div className="flex-1 min-w-0">
                  <code className="text-white text-xs font-mono">{row.key}</code>
                  {meta?.description && (
                    <div className="text-slate-600 text-[10px] truncate">{meta.description}</div>
                  )}
                </div>

                {/* Stats */}
                <span className="text-slate-500 text-xs font-mono shrink-0">{row.count}</span>
                <span className="text-slate-500 text-xs font-mono shrink-0 w-14 text-right">{row.size}</span>

                {/* Present indicator */}
                <span className={`text-[9px] font-bold shrink-0 ${row.present ? 'text-emerald-400' : 'text-slate-700'}`}>
                  {row.present ? '● SET' : '○ EMPTY'}
                </span>

                {/* Clear button — guarded for critical keys */}
                {isCritical ? (
                  <ShieldCheck size={13} className="text-rose-500/50 shrink-0" title="Protected — use Restore to overwrite" />
                ) : (
                  <button
                    onClick={() => setClearing(row.key)}
                    disabled={!row.present}
                    className="text-slate-700 hover:text-rose-400 disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                    title={`Clear "${row.key}"`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirm clear dialog */}
        {clearing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-xs mx-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-400" />
                <span className="text-white font-bold text-sm">Clear this key?</span>
              </div>
              <code className="text-xs text-slate-400 font-mono block mb-4 bg-slate-800 px-2 py-1.5 rounded">{clearing}</code>
              <p className="text-slate-500 text-xs mb-4">This will write an empty value to localStorage. Reload the page afterward.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setClearing(null)} className="px-3 py-1.5 rounded text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition">Cancel</button>
                <button
                  onClick={() => handleClearKey(clearing, Array.isArray([]) ? [] : null)}
                  className="px-3 py-1.5 rounded text-xs bg-rose-600 text-white hover:bg-rose-500 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 text-[10px] text-slate-600 text-center">
          Critical keys (picks, bankroll, experts, futures) are read-only in this UI — restore from a backup file to overwrite them.
        </div>
      </div>
    </div>
  );
}
