// src/components/injuries/InjuryCenter.jsx
// F-25 -- dedicated league-wide injury view.
//
// The per-game injury badges (MatchupCard) and per-game deep-dive
// (InjuryReportModal) already existed and are fully wired. What was missing
// was a single place to scan injury designations across all 32 teams at
// once, sorted by impact, without having to open each matchup individually.
//
// Reuses the same data (`injuries` map from useSchedule/lib/injuries.js) and
// the same InjuryBadge/InjuryImpactIcon components as the existing modal --
// no new data source, no new fetch.

import React, { useMemo, useState } from 'react';
import { HeartPulse, Search, CheckCircle, Filter } from 'lucide-react';
import { InjuryBadge, InjuryImpactIcon } from '../ui/InjuryBadge';
import { getTeamImpactSummary } from '../../lib/injuries';
import { NFL_TEAMS } from '../../lib/teams';

const STATUS_FILTERS = ['ALL', 'OUT', 'DOUBTFUL', 'QUESTIONABLE', 'PROBABLE'];

const IMPACT_BADGE_CLASS = {
  critical: 'bg-red-900 text-red-300 border-red-800',
  high: 'bg-orange-900 text-orange-300 border-orange-800',
  medium: 'bg-yellow-900 text-yellow-300 border-yellow-800',
  low: 'bg-slate-800 text-slate-300 border-slate-700',
  none: 'bg-green-900 text-green-300 border-green-800',
};

function TeamInjuryCard({ team, injuries }) {
  const impact = getTeamImpactSummary(injuries);
  const sorted = [...injuries].sort((a, b) => {
    const impactPriority = { critical: 1, high: 2, medium: 3, low: 4 };
    const diff = (impactPriority[a.impact] || 4) - (impactPriority[b.impact] || 4);
    if (diff !== 0) return diff;
    const statusPriority = { OUT: 1, DOUBTFUL: 2, QUESTIONABLE: 3, PROBABLE: 4 };
    return (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {team.logo && (
              <img src={team.logo} alt={team.abbreviation} className="w-6 h-6 object-contain" loading="lazy" />
            )}
            <span className="font-bold text-white truncate">{team.fullName || team.name}</span>
          </div>
          <div className="text-[11px] text-slate-500">{team.division}</div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${IMPACT_BADGE_CLASS[impact.level]}`}>
          {impact.text}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-600 text-xs py-1">
          <CheckCircle size={14} className="text-green-600" />
          No reported injuries
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((injury, i) => (
            <div key={`${injury.name}-${i}`} className="flex items-center justify-between gap-2 bg-slate-950/60 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <InjuryImpactIcon impact={injury.impact} />
                <span className="text-sm text-white font-medium truncate">{injury.name}</span>
                <span className="text-[11px] text-slate-500 shrink-0">{injury.position}</span>
              </div>
              <InjuryBadge injury={injury} size="small" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InjuryCenter({ injuries = {} }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hideClear, setHideClear] = useState(false);

  const hasData = Object.keys(injuries).length > 0;

  const leagueStats = useMemo(() => {
    const stats = { OUT: 0, DOUBTFUL: 0, QUESTIONABLE: 0, PROBABLE: 0, teamsAffected: 0 };
    Object.values(injuries).forEach((list) => {
      if ((list || []).length > 0) stats.teamsAffected += 1;
      (list || []).forEach((i) => {
        if (stats[i.status] !== undefined) stats[i.status] += 1;
      });
    });
    return stats;
  }, [injuries]);

  const teamRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.values(NFL_TEAMS)
      .map((team) => {
        const abbrev = team.abbreviation;
        const raw = injuries[abbrev] || [];
        const filtered = raw.filter((injury) => {
          const matchesStatus = statusFilter === 'ALL' || injury.status === statusFilter;
          const matchesSearch = !q ||
            injury.name?.toLowerCase().includes(q) ||
            team.fullName?.toLowerCase().includes(q) ||
            team.name?.toLowerCase().includes(q) ||
            abbrev.toLowerCase().includes(q);
          return matchesStatus && matchesSearch;
        });
        return { team, injuries: filtered, rawCount: raw.length };
      })
      .filter((row) => {
        if (q && !(
          row.team.fullName?.toLowerCase().includes(q) ||
          row.team.name?.toLowerCase().includes(q) ||
          row.team.abbreviation.toLowerCase().includes(q)
        ) && row.injuries.length === 0) {
          return false; // searching by player name -- hide teams with no match
        }
        if (hideClear && row.injuries.length === 0) return false;
        if (statusFilter !== 'ALL' && row.injuries.length === 0 && !q) return false;
        return true;
      })
      .sort((a, b) => {
        const rankA = getTeamImpactSummary(a.injuries).rank;
        const rankB = getTeamImpactSummary(b.injuries).rank;
        if (rankA !== rankB) return rankA - rankB;
        return (a.team.fullName || '').localeCompare(b.team.fullName || '');
      });
  }, [injuries, search, statusFilter, hideClear]);

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <HeartPulse size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">League Injury Report</h2>
            <p className="text-xs text-slate-400">All 32 teams, sorted worst-impact-first. Data via ESPN, mock fallback when live feed is unavailable.</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[100px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Teams affected</div>
          <div className="text-lg font-black text-white">{leagueStats.teamsAffected}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[100px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Out</div>
          <div className="text-lg font-black text-red-400">{leagueStats.OUT}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[100px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Doubtful</div>
          <div className="text-lg font-black text-orange-400">{leagueStats.DOUBTFUL}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[100px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Questionable</div>
          <div className="text-lg font-black text-yellow-400">{leagueStats.QUESTIONABLE}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 min-w-[100px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Probable</div>
          <div className="text-lg font-black text-green-400">{leagueStats.PROBABLE}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player or team..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                statusFilter === s ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setHideClear((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
            hideClear
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
          }`}
        >
          <Filter size={12} /> Hide clear teams
        </button>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <HeartPulse size={18} className="animate-pulse" />
          <span className="text-sm">Loading injury reports...</span>
        </div>
      ) : teamRows.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 font-bold">No matches</p>
          <p className="text-slate-600 text-sm mt-2">Try clearing the search or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teamRows.map((row) => (
            <TeamInjuryCard key={row.team.abbreviation} team={row.team} injuries={row.injuries} />
          ))}
        </div>
      )}
    </div>
  );
}
