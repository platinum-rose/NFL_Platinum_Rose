// src/components/ui/SteamAlertPill.jsx
// §1B — "⚡ Steam / RLM Alert" pill. Compact on game cards (hover for the
// auto-correlated cause); `detailed` renders the full attribution list in the
// matchup modal. Renders nothing when no move is flagged.
import React, { useEffect, useState } from 'react';
import { Zap, ExternalLink } from 'lucide-react';
import { loadSlateSteamMoves, getGameSteamAttributions, steamGameKey } from '../../lib/steamAlertStore';

const label = (t) => (t === 'REVERSE_LINE_MOVEMENT' ? 'RLM' : t === 'KEY_NUMBER_CROSS' ? 'KEY #' : 'STEAM');
const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(d);
};

function useSteam({ home, away, week, season, detailed }) {
  const [state, setState] = useState({ moves: [], attributions: null });
  useEffect(() => {
    let cancelled = false;
    const key = steamGameKey(home, away);
    if (!key) return undefined;
    const run = async () => {
      if (detailed) {
        const attributions = await getGameSteamAttributions({ home, away, week, season });
        if (!cancelled) setState({ moves: attributions, attributions });
        return;
      }
      const slate = await loadSlateSteamMoves();
      const moves = slate.get(key) || [];
      if (cancelled) return;
      setState({ moves, attributions: null });
      if (moves.length) {
        const attributions = await getGameSteamAttributions({ home, away, week, season });
        if (!cancelled) setState({ moves, attributions });
      }
    };
    run();
    return () => { cancelled = true; };
  }, [home, away, week, season, detailed]);
  return state;
}

export default function SteamAlertPill({ home, away, week, season = 2026, detailed = false }) {
  const { moves, attributions } = useSteam({ home, away, week, season, detailed });
  if (!moves.length) return null;
  const list = attributions && attributions.length ? attributions : moves;
  const top = list[list.length - 1]; // most recent
  const hasRlm = list.some((m) => (m.flags || []).includes('REVERSE_LINE_MOVEMENT'));
  const tone = hasRlm
    ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/40'
    : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40';

  if (!detailed) {
    const cause = top?.correlated_catalysts?.[0]?.summary;
    return (
      <div className="relative group/steam font-sans normal-case tracking-normal">
        <div className={`flex items-center gap-1 border px-2 py-0.5 rounded text-[10px] font-bold cursor-help ${tone}`}>
          <Zap size={11} className="shrink-0" /> {hasRlm ? 'RLM' : 'STEAM'} ALERT
        </div>
        <div className="absolute top-full mt-1.5 left-0 hidden group-hover/steam:block w-72 p-2.5 bg-[#0c1019] text-slate-200 text-[11px] leading-normal rounded-xl border border-yellow-500/40 shadow-2xl z-50 pointer-events-none text-left">
          <div className="font-bold text-yellow-300 flex items-center gap-1 mb-1"><Zap size={12} /> Steam / RLM Alert</div>
          {list.slice(-3).map((m, i) => (
            <p key={i} className="mb-1">• <strong>{label(m.move_type || m.moveType)}</strong> {m.market} {m.line_before} → {m.line_after} <span className="text-slate-500">({fmtTime(m.detected_at || m.timestamp)} PT)</span></p>
          ))}
          <p className="text-slate-300 mt-1">
            {attributions == null ? 'Correlating injuries & sharp tweets…' : (cause ? `Likely catalyst: ${cause}` : 'No injury news or sharp posts within ±90 min — market-driven move.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
        <Zap size={14} /> Steam / RLM Alert
      </h4>
      {list.map((a, i) => (
        <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone}`}>⚡ {label(a.move_type)}</span>
            <span className="text-[10px] text-slate-400 font-mono">{a.market} {a.line_before} → {a.line_after}{a.crossed_key_number != null ? ` · through ${a.crossed_key_number}` : ''}</span>
            <span className="text-[10px] text-slate-500">{fmtTime(a.timestamp)} PT{a.confirming_books?.length > 1 ? ` · ${a.confirming_books.length} books` : ''}</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{a.causal_hypothesis}</p>
          {a.correlated_catalysts?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {a.correlated_catalysts.slice(0, 4).map((c, j) => (
                <li key={j} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span className="text-slate-500 font-mono shrink-0">{c.offset_minutes > 0 ? '+' : ''}{c.offset_minutes}m</span>
                  <span className="flex-1">{c.source === 'injury' ? '🏥' : c.source === 'sharp_tweet' ? '🐦' : '📡'} {c.author ? `${c.author}: ` : ''}{c.summary}</span>
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#00d2be] shrink-0"><ExternalLink size={10} /></a>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
