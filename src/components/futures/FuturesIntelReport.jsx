// src/components/futures/FuturesIntelReport.jsx
// ═══════════════════════════════════════════════════════════════════════════
// Futures Intel Report panel (Phase 2)
//
// Reads the latest rendered report from public.futures_reports (RLS: public
// read) and displays it in a style-isolated iframe. A "Regenerate" button
// triggers the GitHub Actions workflow via the dispatch-futures-report edge
// function (the PAT lives server-side, never in the browser), then polls for a
// newer generated_at and swaps the report in when ready.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, FileText, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { supabase, isAvailable } from '../../lib/supabase.js';

const SEASON = Number(import.meta.env.VITE_NFL_SEASON || new Date().getUTCFullYear());
const POLL_MS = 15000;
const POLL_MAX = 28; // ~7 minutes

function fmtWhen(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return iso; }
}

export default function FuturesIntelReport() {
  const [report, setReport] = useState(null);     // { html, generated_at, trigger, report_date }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regen, setRegen] = useState({ active: false, msg: '', error: null });
  const iframeRef = useRef(null);
  const pollRef = useRef(null);

  const fetchLatest = useCallback(async () => {
    if (!isAvailable()) { setError('Supabase is not configured.'); setLoading(false); return null; }
    const { data, error: e } = await supabase
      .from('futures_reports')
      .select('html, markdown, generated_at, trigger, report_date, season')
      .eq('season', SEASON)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (e) { setError(e.message); setLoading(false); return null; }
    setError(null);
    setLoading(false);
    if (data) setReport(data);
    return data;
  }, []);

  useEffect(() => { fetchLatest(); return () => clearInterval(pollRef.current); }, [fetchLatest]);

  // Auto-size the iframe to its content (same-origin srcDoc).
  const sizeIframe = useCallback(() => {
    const f = iframeRef.current;
    if (!f) return;
    try {
      const h = f.contentDocument?.documentElement?.scrollHeight;
      if (h) f.style.height = `${h + 24}px`;
    } catch { /* ignore */ }
  }, []);

  const startPolling = useCallback((priorGeneratedAt) => {
    clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks += 1;
      const data = await fetchLatest();
      if (data && data.generated_at && data.generated_at !== priorGeneratedAt) {
        clearInterval(pollRef.current);
        setRegen({ active: false, msg: 'Updated report loaded.', error: null });
        return;
      }
      if (ticks >= POLL_MAX) {
        clearInterval(pollRef.current);
        setRegen({ active: false, msg: '', error: 'Timed out waiting for the new report. The build may still be running — try Reload in a minute.' });
      } else {
        setRegen((r) => ({ ...r, msg: `Regenerating… (${ticks * (POLL_MS / 1000)}s — builds typically take 1–3 min)` }));
      }
    }, POLL_MS);
  }, [fetchLatest]);

  const handleRegenerate = useCallback(async () => {
    if (!isAvailable()) return;
    const prior = report?.generated_at || null;
    setRegen({ active: true, msg: 'Dispatching build…', error: null });
    try {
      const { error: e } = await supabase.functions.invoke('dispatch-futures-report', {
        body: { trigger: 'on_demand_ui', season: SEASON },
      });
      if (e) throw e;
      setRegen({ active: true, msg: 'Build queued — waiting for the report…', error: null });
      startPolling(prior);
    } catch (e) {
      setRegen({ active: false, msg: '', error: `Could not start a build: ${e.message || e}. Check the dispatch-futures-report function and its GitHub token.` });
    }
  }, [report, startPolling]);

  return (
    <div className="max-w-5xl mx-auto px-2">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="text-emerald-400" size={20} />
          <h2 className="text-lg font-bold text-white">Futures Intel Report</h2>
          {report?.trigger && (
            <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">{report.trigger}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {report?.generated_at && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} /> {fmtWhen(report.generated_at)}
            </span>
          )}
          <button
            onClick={fetchLatest}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5"
            title="Reload the latest stored report"
          >Reload</button>
          <button
            onClick={handleRegenerate}
            disabled={regen.active}
            className="text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 border border-emerald-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5"
            title="Trigger a fresh report build from the latest ingested intel"
          >
            <RefreshCw size={13} className={regen.active ? 'animate-spin' : ''} />
            {regen.active ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      {(regen.msg || regen.error) && (
        <div className={`mb-3 text-xs rounded-lg px-3 py-2 border ${regen.error ? 'text-rose-300 bg-rose-500/10 border-rose-500/30' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'}`}>
          {regen.error ? (<span className="flex items-center gap-1.5"><AlertTriangle size={13} /> {regen.error}</span>) : regen.msg}
        </div>
      )}

      {loading && <div className="text-slate-500 text-sm py-12 text-center">Loading latest report…</div>}

      {!loading && error && (
        <div className="text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!loading && !error && !report && (
        <div className="text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-10 text-center">
          <FileText size={28} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm">No futures report has been generated yet for the {SEASON} season.</p>
          <p className="text-xs text-slate-500 mt-1">Click <span className="text-emerald-400 font-semibold">Regenerate</span> to build the first one from the latest ingested intel.</p>
        </div>
      )}

      {!loading && report?.html && (
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0f1217]">
          <iframe
            ref={iframeRef}
            title="Futures Intel Report"
            srcDoc={report.html}
            onLoad={sizeIframe}
            className="w-full"
            style={{ height: '1400px', border: 'none', background: '#0f1217' }}
            sandbox="allow-same-origin allow-popups"
          />
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-3 flex items-center gap-1">
        <ExternalLink size={10} /> Report rendered from Supabase · sources audited in the report header · not betting advice.
      </p>
    </div>
  );
}
