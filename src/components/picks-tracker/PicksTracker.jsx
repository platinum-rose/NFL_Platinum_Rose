import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy, TrendingUp, TrendingDown, List, CheckCircle2,
  Trash2, AlertTriangle, ChevronDown, Filter, BarChart3, Target,
  Clock, Award, Zap, RefreshCw, Mic
} from 'lucide-react';
import {
  loadPicks, clearAllPicks, deletePick,
  calculateStandings, statsByConfidence, statsByEdge,
  findStalePicksPending, healthCheck
} from '../../lib/picksDatabase';

// ── helpers ─────────────────────────────────────────────────

const badge = (result) => {
  const map = {
    WIN:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    LOSS:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
    PUSH:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PENDING: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
  };
  return map[result] || map.PENDING;
};

const sourceBadge = (source) => {
  if (source === 'AI_LAB')  return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  if (source === 'EXPERT')  return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return iso; }
};

// ── sub-views ───────────────────────────────────────────────

/** Overview / Standings tab */
// `onRefresh` unused here (read-only tab, no mutating actions) -- kept for
// signature parity with the sibling tabs below (AllPicksTab does call it).
// eslint-disable-next-line no-unused-vars
function OverviewTab({ onRefresh }) {
  const standings = calculateStandings();
  const confBuckets = statsByConfidence();
  const edgeBuckets = statsByEdge();
  const stale = findStalePicksPending();

  const sources = Object.entries(standings);

  return (
    <div className="space-y-6">
      {/* Stale warning */}
      {stale.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div>
            <div className="text-amber-300 font-bold text-sm">{stale.length} Ungraded Pick{stale.length > 1 ? 's' : ''}</div>
            <div className="text-amber-200/70 text-xs mt-1">
              These games have likely finished but were never graded.
              Use the <strong>Grade</strong> tab to enter final scores.
            </div>
            <div className="mt-2 space-y-1">
              {stale.slice(0, 5).map(p => (
                <div key={p.id} className="text-xs text-slate-400">
                  {fmtDate(p.gameDate)} — {p.visitor} @ {p.home} • {p.source} {p.selection} {p.line}
                </div>
              ))}
              {stale.length > 5 && <div className="text-xs text-slate-500">... and {stale.length - 5} more</div>}
            </div>
          </div>
        </div>
      )}

      {/* Standings cards */}
      {sources.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Target size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold text-slate-500">No Picks Yet</p>
          <p className="text-sm mt-1">Run AI Dev Lab simulations to start tracking picks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map(([src, s]) => (
            <div key={src} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {src === 'AI_LAB'  ? <Zap size={16} className="text-indigo-400" /> : <Award size={16} className="text-slate-400" />}
                  <span className="font-bold text-white text-sm">
                    {src === 'AI_LAB' ? 'AI Dev Lab' : src === 'EXPERT' ? 'Expert Picks' : src}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border ${s.units >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                  {s.units >= 0 ? '+' : ''}{s.units.toFixed(2)}u
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                <div>
                  <div className="text-lg font-black text-white">{s.record}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Record</div>
                </div>
                <div>
                  <div className="text-lg font-black text-white">{s.winRate}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
                </div>
                <div>
                  <div className={`text-lg font-black ${s.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{s.roi}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">ROI</div>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-400">{s.pending}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Pending</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confidence breakdown (AI Lab) */}
      {Object.values(confBuckets).some(b => b.total > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-indigo-400" /> AI Lab — By Confidence
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(confBuckets).map(([key, b]) => (
              <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">{b.label}</div>
                <div className="text-sm font-bold text-white">{b.wins}W-{b.losses}L</div>
                <div className={`text-xs mt-0.5 ${b.winRate >= 55 ? 'text-emerald-400' : b.winRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {b.total > 0 ? `${b.winRate}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge breakdown */}
      {Object.values(edgeBuckets).some(b => b.total > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" /> All Sources — By Edge Size
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(edgeBuckets).map(([key, b]) => (
              <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">{b.label}</div>
                <div className="text-sm font-bold text-white">{b.wins}W-{b.losses}L</div>
                <div className={`text-xs mt-0.5 ${b.winRate >= 55 ? 'text-emerald-400' : b.winRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {b.total > 0 ? `${b.winRate}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** All Picks list tab */
function AllPicksTab({ onRefresh }) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const picks = useMemo(() => {
    const filters = {};
    if (sourceFilter !== 'all') filters.source   = sourceFilter;
    if (resultFilter !== 'all') filters.result   = resultFilter;
    if (typeFilter   !== 'all') filters.pickType = typeFilter;
    if (dateFrom)               filters.dateFrom = dateFrom;
    if (dateTo)                 filters.dateTo   = dateTo;
    return loadPicks(filters).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // onRefresh intentionally excluded: the parent remounts this whole tab via
    // key={refreshKey} on refresh, so this memo is always recomputed fresh anyway.
  }, [sourceFilter, resultFilter, typeFilter, dateFrom, dateTo]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this pick?')) return;
    deletePick(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Sources</option>
          <option value="AI_LAB">AI Dev Lab</option>
          <option value="EXPERT">Expert Picks</option>
        </select>
        <select
          value={resultFilter}
          onChange={e => setResultFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Results</option>
          <option value="PENDING">Pending</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="PUSH">Push</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Types</option>
          <option value="spread">Spread</option>
          <option value="total">Total</option>
          <option value="moneyline">Moneyline</option>
        </select>
        <input
          type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          title="From date"
        />
        <input
          type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          title="To date"
        />
        <span className="text-xs text-slate-500 self-center ml-auto">{picks.length} pick{picks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      {picks.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <List size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No picks match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {picks.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3 group hover:border-slate-700 transition-all">
              {/* Result badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${badge(p.result)}`}>
                {p.result}
              </span>

              {/* Source badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${sourceBadge(p.source)}`}>
                {p.source === 'AI_LAB' ? 'AI' : p.source === 'EXPERT' ? 'EX' : p.source}
              </span>

              {/* Pick details */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {p.pickType === 'spread'
                    ? `${p.selection} ${p.line > 0 ? '+' : ''}${p.line}`
                    : p.pickType === 'moneyline'
                    ? `${p.selection} ${p.line > 0 ? '+' : ''}${p.line} ML`
                    : `${p.selection} ${p.line}`
                  }
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {p.visitor} @ {p.home}
                </div>
              </div>

              {/* Score (if graded) */}
              {p.homeScore !== null && (
                <div className="text-xs text-slate-400 font-mono shrink-0">
                  {p.visitorScore}-{p.homeScore}
                </div>
              )}

              {/* Confidence / Edge */}
              <div className="text-right shrink-0 hidden sm:block">
                {p.confidence > 0 && (
                  <div className="text-[10px] text-slate-500">{p.confidence}% conf</div>
                )}
                {p.edge > 0 && (
                  <div className="text-[10px] text-slate-500">{p.edge}pt edge</div>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-slate-600 shrink-0 hidden md:block w-20 text-right">
                {fmtDate(p.gameDate)}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(p.id)}
                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-all shrink-0"
                title="Delete pick"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Grade tab — enter scores for pending games */
// `onRefresh` unused here -- refresh happens via the parent's key={refreshKey}
// remount pattern (see the render call site below) after onAutoGrade/the
// grade modal complete, not via a direct call from inside this tab.
// eslint-disable-next-line no-unused-vars
function GradeTab({ onRefresh, onOpenGradeModal, onAutoGrade, autoGrading }) {
  const stalePicks = findStalePicksPending();
  const pendingPicks = loadPicks({ result: 'PENDING' });

  // Group pending picks by game
  const gameGroups = useMemo(() => {
    const groups = {};
    pendingPicks.forEach(p => {
      const key = p.gameId || `${p.visitor}@${p.home}`;
      if (!groups[key]) {
        groups[key] = {
          gameId: p.gameId,
          home: p.home,
          visitor: p.visitor,
          gameDate: p.gameDate,
          picks: [],
          isStale: false,
        };
      }
      groups[key].picks.push(p);
      if (stalePicks.some(s => s.id === p.id)) {
        groups[key].isStale = true;
      }
    });
    return Object.values(groups).sort((a, b) => {
      // Stale first, then by date
      if (a.isStale !== b.isStale) return a.isStale ? -1 : 1;
      return (a.gameDate || '').localeCompare(b.gameDate || '');
    });
  }, [pendingPicks, stalePicks]);

  return (
    <div className="space-y-4">
      {gameGroups.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <CheckCircle2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold text-slate-500">All Caught Up!</p>
          <p className="text-xs mt-1">No pending picks to grade.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {gameGroups.length} game{gameGroups.length !== 1 ? 's' : ''} with pending picks.
              Click a game to enter the final score.
            </p>
            {onAutoGrade && (
              <button
                onClick={onAutoGrade}
                disabled={autoGrading}
                className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={12} className={autoGrading ? 'animate-spin' : ''} />
                {autoGrading ? 'Checking…' : 'Auto-Grade'}
              </button>
            )}
          </div>
          {gameGroups.map(g => (
            <button
              key={g.gameId || `${g.visitor}@${g.home}`}
              onClick={() => onOpenGradeModal(g)}
              className={`w-full text-left bg-slate-900 border rounded-lg p-4 hover:border-slate-600 transition-all ${
                g.isStale ? 'border-amber-500/40' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{g.visitor} @ {g.home}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{fmtDate(g.gameDate)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {g.isStale && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                      OVERDUE
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{g.picks.length} pick{g.picks.length > 1 ? 's' : ''}</span>
                  <ChevronDown size={14} className="text-slate-600" />
                </div>
              </div>
              {/* Show the picks in this game */}
              <div className="mt-2 space-y-1">
                {g.picks.map(p => (
                  <div key={p.id} className="text-xs text-slate-500 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sourceBadge(p.source)}`}>
                      {p.source === 'AI_LAB' ? 'AI' : p.source === 'EXPERT' ? 'EX' : p.source}
                    </span>
                    {p.pickType === 'spread'
                      ? `${p.selection} ${p.line > 0 ? '+' : ''}${p.line}`
                      : p.pickType === 'moneyline'
                      ? `${p.selection} ${p.line > 0 ? '+' : ''}${p.line} ML`
                      : `${p.selection} ${p.line}`
                    }
                  </div>
                ))}
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function PicksTracker({ onOpenGradeModal, onAutoGrade, autoGrading, onOpenPodcastModal }) {
  const [tab, setTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handleClearAll = () => {
    if (!window.confirm('⚠️ Delete ALL picks and reset standings to zero?\n\nThis cannot be undone.')) return;
    clearAllPicks();
    refresh();
  };

  const handleHealthCheck = () => {
    healthCheck();
    alert('Health check printed to browser console (F12).');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'picks',    label: 'All Picks', icon: List },
    { id: 'grade',    label: 'Grade',     icon: CheckCircle2 },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="text-emerald-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
              Picks Tracker
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            AI Dev Lab • Track, Grade &amp; Analyze
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {onOpenPodcastModal && (
            <button
              onClick={onOpenPodcastModal}
              className="bg-[#00d2be]/10 hover:bg-[#00d2be]/20 text-[#00d2be] px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-[#00d2be]/30 transition-all"
            >
              <Mic size={14} /> Podcast Intel
            </button>
          )}
          <button
            onClick={handleHealthCheck}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw size={14} /> Health Check
          </button>
          <button
            onClick={handleClearAll}
            className="bg-slate-800 hover:bg-rose-900/50 text-rose-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-slate-700 hover:border-rose-500/30 transition-all"
          >
            <Trash2 size={14} /> Reset All
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[50vh]">
        {tab === 'overview' && <OverviewTab key={refreshKey} onRefresh={refresh} />}
        {tab === 'picks'    && <AllPicksTab key={refreshKey} onRefresh={refresh} />}
        {tab === 'grade'    && <GradeTab key={refreshKey} onRefresh={refresh} onOpenGradeModal={onOpenGradeModal} onAutoGrade={onAutoGrade} autoGrading={autoGrading} />}
      </div>
    </div>
  );
}
