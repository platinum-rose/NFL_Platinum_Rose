import React, { useState, useMemo } from 'react';
import { Clock, Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import MatchupCard from './MatchupCard';
import { getSecondaryMatchupsForGame } from '../../lib/secondaryMatchupStore';
import { getContractForGame } from '../../lib/predictionMarketStore';

// Known dome team abbreviations (home-field only)
const DOME_ABBRS = new Set(['ARI', 'ATL', 'DAL', 'DET', 'HOU', 'IND', 'LV', 'LAC', 'LAR', 'MIN', 'NO']);

const SORT_OPTIONS = [
  { value: 'default',     label: 'Game Time' },
  { value: 'spread_fav',  label: 'Biggest Favorite' },
  { value: 'spread_dog',  label: 'Biggest Underdog' },
  { value: 'total_high',  label: 'Total: High → Low' },
  { value: 'total_low',   label: 'Total: Low → High' },
  { value: 'sec_severity', label: 'Secondary Mismatch: High → Low' },
];

const FILTER_CHIPS = [
  { id: 'all',          label: 'All',                   tooltip: 'Show all scheduled games for the selected week.' },
  { id: 'sec_mismatch', label: '🛡️ Secondary Mismatch', tooltip: 'Highlights games where a high-volume passing offense faces an injured or weak pass defense secondary.' },
  { id: 'pm_market',    label: '📊 Has Prediction Market', tooltip: 'Highlights games with active Kalshi or Polymarket prediction market probability lines.' },
  { id: 'experts',       label: 'Has Expert Picks',       tooltip: 'Filters for games with active pick recommendations from tracked sharp handicappers.' },
  { id: 'big_spread',   label: 'Big Spread (7+)',       tooltip: 'Filters for games with heavy favorites (-7.0 points or larger).' },
  { id: 'high_total',   label: 'High Total (48+)',      tooltip: 'Filters for high-scoring shootout projections (48.0+ total points).' },
  { id: 'low_total',    label: 'Low Total (41−)',       tooltip: 'Filters for low-scoring defensive grind projections (41.0- total points).' },
  { id: 'dome',         label: 'Dome Game',             tooltip: 'Filters for games played inside weather-controlled indoor stadiums.' },
];


const Dashboard = ({ 
  schedule, 
  stats, 
  simResults = {},
  onGameClick, 
  onShowHistory,
  onShowInjuries,
  onAddBankrollBet
}) => {
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('default');
  const [filter, setFilter]     = useState('all');
  const [sortOpen, setSortOpen] = useState(false);

  // Build stat lookup map once (O(1) per team)
  const statsMap = useMemo(() => {
    const m = new Map();
    (stats || []).forEach(s => m.set(s.team, s));
    return m;
  }, [stats]);

  // F-27b fix: this used to fabricate commence_time as "right now" for every
  // game (plus unused status/home_score/visitor_score fields), so every
  // matchup card displayed the current time instead of the real kickoff.
  // schedule.json already carries the real kickoff time as `kickoff_utc`.
  const enriched = useMemo(() => schedule.map(game => ({
    ...game,
    commence_time: game.kickoff_utc || null,
    homeStats: statsMap.get(game.home) || {},
    visStats:  statsMap.get(game.visitor) || {},
  })), [schedule, statsMap]);

  // --- FILTER ---
  const filtered = useMemo(() => {
    let list = enriched;

    // Text search: match any of home/visitor abbr or full name
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(g =>
        (g.home       || '').toLowerCase().includes(q) ||
        (g.visitor    || '').toLowerCase().includes(q) ||
        (g.homeName   || '').toLowerCase().includes(q) ||
        (g.visitorName|| '').toLowerCase().includes(q)
      );
    }

    // Chip filter
    switch (filter) {
      case 'sec_mismatch':
        list = list.filter(g => {
          const sec = getSecondaryMatchupsForGame(g.visitor, g.home);
          return sec.maxTier === 'high' || sec.maxTier === 'medium';
        });
        break;
      case 'pm_market':
        list = list.filter(g => !!getContractForGame(g.visitor, g.home));
        break;
      case 'experts':
        list = list.filter(g => {
          const picks = g.consensus?.expertPicks;
          if (!picks) return false;
          return (picks.spread?.length > 0) || (picks.total?.length > 0);
        });
        break;
      case 'big_spread':
        list = list.filter(g => typeof g.spread === 'number' && Math.abs(g.spread) >= 7);
        break;
      case 'high_total':
        list = list.filter(g => typeof g.total === 'number' && g.total >= 48);
        break;
      case 'low_total':
        list = list.filter(g => typeof g.total === 'number' && g.total <= 41);
        break;
      case 'dome':
        list = list.filter(g => DOME_ABBRS.has((g.home || '').toUpperCase()));
        break;
      default:
        break;
    }

    return list;
  }, [enriched, search, filter]);

  // --- SORT ---
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'spread_fav':  return list.sort((a, b) => (a.spread ?? 99) - (b.spread ?? 99));
      case 'spread_dog':  return list.sort((a, b) => (b.spread ?? -99) - (a.spread ?? -99));
      case 'total_high':  return list.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
      case 'total_low':   return list.sort((a, b) => (a.total ?? 99) - (b.total ?? 99));
      case 'sec_severity':
        return list.sort((a, b) => {
          const secA = getSecondaryMatchupsForGame(a.visitor, a.home);
          const secB = getSecondaryMatchupsForGame(b.visitor, b.home);
          return secB.maxSeverity - secA.maxSeverity;
        });
      default:            return list; // preserve schedule order
    }
  }, [filtered, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';
  const isFiltered = search.trim() || filter !== 'all';

  return (
    <div className="space-y-4">
      {/* ── Controls bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team…"
            className="w-full h-9 pl-8 pr-8 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500
                       focus:outline-none focus:border-[#00d2be] focus:ring-1 focus:ring-[#00d2be]/40 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300
                       hover:border-slate-500 focus:outline-none transition whitespace-nowrap"
          >
            <SlidersHorizontal size={13} className="text-slate-400" />
            <span>{currentSortLabel}</span>
            <ChevronDown size={12} className={`text-slate-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition
                    ${sortBy === opt.value ? 'text-[#00d2be] font-semibold' : 'text-slate-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Game count badge */}
        {isFiltered && (
          <span className="shrink-0 text-xs text-slate-400 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 whitespace-nowrap">
            {sorted.length} / {enriched.length} games
          </span>
        )}
      </div>

      {/* ── Filter chips with mouse-over tooltips ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <div key={chip.id} className="relative group">
            <button
              onClick={() => setFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${filter === chip.id
                  ? 'bg-[#00d2be]/20 border-[#00d2be] text-[#00d2be] shadow-[0_0_8px_rgba(0,210,190,0.3)]'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
            >
              {chip.label}
            </button>

            {/* MOUSE-OVER TOOLTIP POPUP */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-56 p-2 bg-[#0c1019] text-slate-200 text-[11px] leading-snug rounded-lg border border-slate-700 shadow-xl z-50 pointer-events-none text-center animate-in fade-in zoom-in-95 duration-150">
              {chip.tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0c1019]"></div>
            </div>
          </div>
        ))}
      </div>


      {/* ── Card grid ── */}
      {/* Click outside handler for sort dropdown */}
      {sortOpen && <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enriched.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-slate-400 font-semibold">No Active Games</h3>
            <p className="text-slate-500">Waiting for schedule update...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg text-slate-400 font-semibold">No games match your filters</h3>
            <button
              onClick={() => { setSearch(''); setFilter('all'); }}
              className="mt-3 text-sm text-[#00d2be] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          sorted.map(game => {
            const gameSim = simResults[game.id] || null;
            return (
              <MatchupCard
                key={game.id}
                game={game}
                simData={gameSim || {}}
                onPlaceBet={() => onGameClick(game)}
                onAnalyze={() => onGameClick(game)}
                onShowHistory={onShowHistory}
                onShowInjuries={() => onShowInjuries(game)}
                onAddBankrollBet={onAddBankrollBet ? () => onAddBankrollBet(game) : undefined}
                experts={[]}
                myBets={[]}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;