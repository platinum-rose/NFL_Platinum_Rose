// src/components/fantasy/FantasyRankingsPanel.jsx
// F-26c §2 — FantasyPros weekly/draft Expert Consensus Rankings panel.
// "The literal original F-26 ask" per TASK_BOARD — start/sit, weekly rankings.
//
// Unlike FantasyValueBoard (which reads a generated public/*.json file), this
// panel reads fantasy_rankings (migration 046) directly via Supabase's public-read
// RLS policy — the table is small (a few hundred rows per as_of_date) and this
// avoids needing a separate report-generation/sync step to see the latest ingest.
//
// This is Expert Consensus Rank (opinion), NOT the same signal as the Value Board's
// ADP-vs-projection value_gap — don't conflate rank_ecr here with that tab's numbers.
//
// Backend: agents/fantasypros-rankings-ingest.js (npm run ingest-fantasypros-rankings:draft
// / --type weekly --week N). Spec: docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md §2.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ListOrdered, RefreshCw, Search, Users, AlertTriangle } from 'lucide-react';
import { getFantasyRankings, getFantasyRankingsAvailableWeeks } from '../../lib/supabase';

const POSITION_FILTERS = ['ALL', 'QB', 'RB', 'WR', 'TE'];
const SCORING_OPTIONS = [
  { value: 'ppr', label: 'PPR' },
  { value: 'half', label: 'Half-PPR' },
  { value: 'standard', label: 'Standard' },
];

const TIER_STYLE = [
  'bg-slate-800 text-slate-400 border-slate-700', // tier 0 / unknown (index guard)
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', // tier 1
  'bg-lime-500/20 text-lime-300 border-lime-500/30',           // tier 2
  'bg-amber-500/20 text-amber-300 border-amber-500/30',        // tier 3
  'bg-orange-500/20 text-orange-300 border-orange-500/30',     // tier 4
  'bg-rose-500/20 text-rose-300 border-rose-500/30',           // tier 5+
];
function tierStyle(tier) {
  if (tier == null) return TIER_STYLE[0];
  return TIER_STYLE[Math.min(tier, TIER_STYLE.length - 1)];
}

// Low std dev = experts agree on this player; high = genuinely disputed rank.
// Thresholds are eyeballed, not derived from a real distribution — decision
// support framing only, not a statistical claim.
function agreementLabel(std) {
  if (std == null) return null;
  if (std <= 3) return { label: 'Consensus', className: 'text-emerald-400' };
  if (std <= 8) return { label: 'Some spread', className: 'text-amber-400' };
  return { label: 'Disputed', className: 'text-rose-400' };
}

function RankingRow({ row }) {
  const agreement = agreementLabel(row.rank_std);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition">
      <div className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border font-black text-sm ${tierStyle(row.tier)}`}>
        {row.pos_rank || row.rank_ecr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white truncate">{row.player}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{row.position}</span>
          {row.team && <span className="text-[10px] text-slate-600">{row.team}</span>}
          {row.opponent && <span className="text-[10px] text-slate-600">vs {row.opponent}</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
          <span>ECR {row.rank_ecr}{row.rank_min != null && row.rank_max != null ? ` (range ${row.rank_min}-${row.rank_max})` : ''}</span>
          {row.total_experts != null && (
            <span className="flex items-center gap-1">
              <Users size={11} /> {row.total_experts} expert{row.total_experts === 1 ? '' : 's'}
            </span>
          )}
          {agreement && <span className={`font-semibold ${agreement.className}`}>{agreement.label}</span>}
          {row.owned_avg != null && <span>{Number(row.owned_avg).toFixed(0)}% owned</span>}
        </div>
      </div>
      {row.tier != null && (
        <div className="shrink-0 text-right">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${tierStyle(row.tier)}`}>
            Tier {row.tier}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FantasyRankingsPanel() {
  const [state, setState] = useState('loading'); // loading | ready | empty | error
  const [rows, setRows] = useState([]);
  const [asOfDate, setAsOfDate] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([0]);

  const [season] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(0); // 0 = draft/season-long
  const [scoring, setScoring] = useState('ppr');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [{ rows: data, asOfDate: asOf }, weeks] = await Promise.all([
        getFantasyRankings({ season, week, scoring }),
        getFantasyRankingsAvailableWeeks({ season, scoring }),
      ]);
      setRows(data);
      setAsOfDate(asOf);
      setAvailableWeeks(weeks.length ? weeks : [0]);
      setState(data.length ? 'ready' : 'empty');
    } catch (e) {
      setErrorMsg(e.message || 'Failed to load rankings');
      setState('error');
    }
  }, [season, week, scoring]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (positionFilter !== 'ALL' && r.position !== positionFilter) return false;
      if (q && !r.player?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, positionFilter, search]);

  return (
    <div className="space-y-5">
      {/* Guardrail strip */}
      <div className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
        Expert Consensus Rankings (opinion-based) — a different signal from the Value Board's
        ADP-vs-projection gap on the other tab. Decision support for start/sit and draft prep,
        not a live recommendation. Regenerate via{' '}
        <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">
          npm run ingest-fantasypros-rankings:draft
        </code>{' '}or{' '}
        <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">
          node agents/fantasypros-rankings-ingest.js --type weekly --week N
        </code>.
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative min-w-[180px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
            />
          </div>

          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-600"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>{w === 0 ? 'Draft / Season-long' : `Week ${w}`}</option>
            ))}
          </select>

          <select
            value={scoring}
            onChange={(e) => setScoring(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-600"
          >
            {SCORING_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <button
            onClick={load}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Reload"
          >
            <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {POSITION_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPositionFilter(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                positionFilter === p ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {asOfDate && (
        <div className="text-[11px] text-slate-600">
          As of {asOfDate} · {filtered.length} of {rows.length} players
        </div>
      )}

      {state === 'loading' && (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading rankings...</span>
        </div>
      )}

      {state === 'empty' && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <ListOrdered size={40} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-300 font-bold">No rankings loaded for this week/scoring yet</p>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            Run the ingest, which writes directly to the fantasy_rankings table this panel reads:
          </p>
          <p className="mt-3 text-xs">
            <code className="bg-slate-950 px-2 py-1 rounded text-slate-300">
              node agents/fantasypros-rankings-ingest.js --type draft
            </code>
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load rankings: {errorMsg}
        </div>
      )}

      {state === 'ready' && (
        filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">No players match the current filters.</div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((row) => (
              <RankingRow key={`${row.player}-${row.position}-${row.week}`} row={row} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
