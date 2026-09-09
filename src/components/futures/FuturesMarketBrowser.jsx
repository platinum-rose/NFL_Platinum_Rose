// src/components/futures/FuturesMarketBrowser.jsx
// Browse all futures odds from Supabase — Super Bowl, Conference, Division winners.
// Independent of user positions — shows the full market.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw, Clock, AlertCircle, Wifi, WifiOff, Trophy,
  ChevronDown, ChevronUp, Search, Filter, ArrowUpDown
} from 'lucide-react';
import { getLatestFuturesOdds } from '../../lib/supabase';
import { TEAM_LOGOS, NFL_TEAMS } from '../../lib/teams';

// ── Constants ─────────────────────────────────────────────────────────────────
const MARKET_LABELS = {
  superbowl: 'Super Bowl Winner',
  conference_afc: 'AFC Winner', conference_nfc: 'NFC Winner',
  division_afc_east: 'AFC East', division_afc_north: 'AFC North',
  division_afc_south: 'AFC South', division_afc_west: 'AFC West',
  division_nfc_east: 'NFC East', division_nfc_north: 'NFC North',
  division_nfc_south: 'NFC South', division_nfc_west: 'NFC West',
  wins: 'Win Totals (Over)', playoffs: 'Make Playoffs',
  most_wins: 'Most Wins', least_wins: 'Least Wins',
  conference_no_1_seed: 'Conference No. 1 Seed',
  superbowl_matchup: 'Super Bowl Exact Matchup', exacta: 'Conference Seeding Exacta',
  award_mvp: 'MVP', award_super_bowl_mvp: 'Super Bowl MVP',
  award_offensive_player_of_year: 'OPOY', award_defensive_player_of_year: 'DPOY',
  award_offensive_rookie_of_year: 'OROY', award_defensive_rookie_of_year: 'DROY',
  award_comeback_player_of_year: 'Comeback Player',
};
const MARKET_ORDER = Object.keys(MARKET_LABELS);

const BOOK_NAMES = {
  draftkings: 'DK',
  fanduel:    'FD',
  betmgm:     'MGM',
  caesars:    'CZR',
  betonline:  'BOL',
  betus:      'BTU',
  bookmaker:  'BKR',
};
const BOOK_FULL = {
  draftkings: 'DraftKings',
  fanduel:    'FanDuel',
  betmgm:     'BetMGM',
  caesars:    'Caesars',
  betonline:  'BetOnline',
  betus:      'BetUS',
  bookmaker:  'Bookmaker',
};
const BOOK_ORDER = ['betonline', 'betus', 'bookmaker', 'betmgm', 'caesars', 'draftkings', 'fanduel'];

const fmtOdds = (o) => (o == null ? '—' : o >= 0 ? `+${o}` : `${o}`);

// ── Team name resolution ──────────────────────────────────────────────────────
// TheOddsAPI returns full names like "Kansas City Chiefs" — resolve to our key system.
const teamNameMap = new Map();
for (const [key, data] of Object.entries(NFL_TEAMS)) {
  teamNameMap.set(key.toLowerCase(), key);
  teamNameMap.set(data.fullName.toLowerCase(), key);
  teamNameMap.set(data.city.toLowerCase(), key);
  teamNameMap.set(data.abbreviation.toLowerCase(), key);
  for (const alias of data.aliases) {
    teamNameMap.set(alias.toLowerCase(), key);
  }
  for (const alt of data.altAbbreviations) {
    teamNameMap.set(alt.toLowerCase(), key);
  }
}

function resolveTeamKey(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  // Exact match
  if (teamNameMap.has(lower)) return teamNameMap.get(lower);
  // Try last word (e.g. "Kansas City Chiefs" → "chiefs")
  const lastWord = lower.split(' ').pop();
  if (teamNameMap.has(lastWord)) return teamNameMap.get(lastWord);
  return null;
}

function getTeamLogo(apiName) {
  const key = resolveTeamKey(apiName);
  if (key && TEAM_LOGOS[key]) return TEAM_LOGOS[key];
  // Fallback: try direct lookup
  return TEAM_LOGOS[apiName] || TEAM_LOGOS[apiName?.split(' ').pop()] || '';
}

function getTeamMeta(apiName) {
  const key = resolveTeamKey(apiName);
  if (key && NFL_TEAMS[key]) return NFL_TEAMS[key];
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FuturesMarketBrowser() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError]           = useState('');
  const [activeMarket, setActiveMarket] = useState('superbowl');
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('bestOdds'); // 'bestOdds' | 'team' | 'impliedProb'
  const [sortDir, setSortDir]       = useState('asc');      // For odds: asc = favorites first

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOdds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getLatestFuturesOdds();
      setMarketData(rows || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load odds');
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOdds(); }, [fetchOdds]);

  // ── Available markets ──────────────────────────────────────────────────────
  const availableMarkets = useMemo(() => {
    const types = new Set(marketData.map(r => r.market_type));
    return MARKET_ORDER.filter(m => types.has(m));
  }, [marketData]);

  // Auto-select first available market if current isn't available
  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(activeMarket)) {
      setActiveMarket(availableMarkets[0]);
    }
  }, [availableMarkets, activeMarket]);

  // ── Group data by team for active market ───────────────────────────────────
  const teamRows = useMemo(() => {
    const filtered = marketData.filter(r => r.market_type === activeMarket);

    // Group by team
    const byTeam = new Map();
    for (const row of filtered) {
      if (!byTeam.has(row.team)) {
        byTeam.set(row.team, { team: row.team, books: new Map() });
      }
      const entry = byTeam.get(row.team);
      // Keep latest odds per book (data is sorted desc by snapshot_time)
      if (!entry.books.has(row.book)) {
        entry.books.set(row.book, row);
      }
    }

    // Compute derived fields
    const rows = Array.from(byTeam.values()).map(entry => {
      const bookEntries = Array.from(entry.books.values());
      // Best price for the bettor = longest payout (lowest implied probability).
      // Manual rows may omit implied_prob, so derive it from American odds.
      const implied = (row) => row.implied_prob ?? (row.odds > 0
        ? 100 / (row.odds + 100)
        : Math.abs(row.odds) / (Math.abs(row.odds) + 100));
      const best = bookEntries.reduce((b, r) => (!b || implied(r) < implied(b) ? r : b), null);
      const worst = bookEntries.reduce((w, r) => (!w || implied(r) > implied(w) ? r : w), null);

      const avgImplied = bookEntries.length > 0
        ? bookEntries.reduce((s, r) => s + (r.implied_prob || 0), 0) / bookEntries.length
        : 0;

      return {
        team: entry.team,
        books: entry.books,
        bestOdds: best?.odds ?? null,
        bestBook: best?.book ?? null,
        bestImplied: best?.implied_prob ?? null,
        worstOdds: worst?.odds ?? null,
        avgImplied,
        bookCount: bookEntries.length,
        meta: getTeamMeta(entry.team),
      };
    });

    // Filter by search
    const searchLower = search.toLowerCase();
    const searchFiltered = search
      ? rows.filter(r =>
          r.team.toLowerCase().includes(searchLower) ||
          r.meta?.city?.toLowerCase().includes(searchLower) ||
          r.meta?.abbreviation?.toLowerCase().includes(searchLower) ||
          r.meta?.conference?.toLowerCase().includes(searchLower) ||
          r.meta?.division?.toLowerCase().includes(searchLower)
        )
      : rows;

    // Sort
    searchFiltered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'bestOdds') {
        // Sort by implied probability (higher = more favored)
        cmp = (b.avgImplied || 0) - (a.avgImplied || 0);
      } else if (sortBy === 'team') {
        cmp = a.team.localeCompare(b.team);
      } else if (sortBy === 'impliedProb') {
        cmp = (b.avgImplied || 0) - (a.avgImplied || 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return searchFiltered;
  }, [marketData, activeMarket, search, sortBy, sortDir]);

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // ── Which books appear in current market ───────────────────────────────────
  const activeBooks = useMemo(() => {
    const books = new Set();
    for (const row of teamRows) {
      for (const book of row.books.keys()) books.add(book);
    }
    const known = BOOK_ORDER.filter((book) => books.has(book));
    const extra = [...books].filter((book) => !BOOK_ORDER.includes(book)).sort();
    return [...known, ...extra];
  }, [teamRows]);

  const hasData    = marketData.length > 0;
  const snapshotTime = marketData[0]?.snapshot_time;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-sm font-bold text-white">Futures Market</span>
          {hasData ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
              <Wifi size={9} /> Live
            </span>
          ) : !loading && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
              <WifiOff size={9} /> No Data
            </span>
          )}
          {teamRows.length > 0 && (
            <span className="text-[10px] text-slate-600">{teamRows.length} teams</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock size={10} /> {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchOdds}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="text-rose-400 shrink-0" />
          <span className="text-rose-400 text-xs">{error}</span>
        </div>
      )}

      {/* No data */}
      {!hasData && !loading && !error && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-bold">No futures odds available yet</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Futures markets (Super Bowl, Conference, Division winners) are typically posted by sportsbooks
              in the spring/summer. During the offseason, TheOddsAPI may return empty results.
              The <code className="text-amber-400/80">FuturesOddsIngestAgent</code> runs daily at 10:00 UTC
              and will auto-populate once books start posting 2026 season odds.
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasData && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-slate-900/50 border border-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Market tabs + Search */}
      {hasData && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Market type pills */}
            <div className="flex items-center gap-1">
              {availableMarkets.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMarket(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                    ${activeMarket === m
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}
                >
                  {MARKET_LABELS[m] || m}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search team…"
                className="pl-7 pr-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500 w-44"
              />
            </div>
          </div>

          {/* Snapshot time */}
          {snapshotTime && (
            <p className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock size={9} />
              Last snapshot: {new Date(snapshotTime).toLocaleString()}
            </p>
          )}

          {/* Odds table */}
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#0f0f0f] text-left px-3 py-2">
                    <button
                      onClick={() => toggleSort('team')}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 tracking-wider transition"
                    >
                      Team
                      {sortBy === 'team' && <ArrowUpDown size={10} className="text-purple-400" />}
                    </button>
                  </th>
                  {activeBooks.map(book => (
                    <th key={book} className="text-center px-2 py-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider"
                        title={BOOK_FULL[book] || book}>
                        {BOOK_NAMES[book] || book}
                      </span>
                    </th>
                  ))}
                  <th className="text-center px-3 py-2">
                    <button
                      onClick={() => toggleSort('impliedProb')}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 tracking-wider transition mx-auto"
                    >
                      Prob
                      {sortBy === 'impliedProb' && <ArrowUpDown size={10} className="text-purple-400" />}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row, idx) => {
                  const logo = getTeamLogo(row.team);
                  return (
                    <tr
                      key={row.team}
                      className={`group transition
                        ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'}
                        hover:bg-slate-800/40`}
                    >
                      {/* Team cell */}
                      <td className="sticky left-0 z-10 px-3 py-2.5 whitespace-nowrap"
                        style={{ backgroundColor: idx % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'rgba(15,23,42,0.1)' }}>
                        <div className="flex items-center gap-2.5 group-hover:bg-transparent">
                          {logo && (
                            <img src={logo} alt="" className="w-6 h-6 object-contain shrink-0"
                              onError={e => { e.target.style.display = 'none'; }} />
                          )}
                          <div>
                            <div className="text-white font-bold text-sm leading-tight">{row.team}</div>
                            {row.meta && (
                              <div className="text-slate-600 text-[10px] leading-tight">
                                {row.meta.conference} · {row.meta.division?.replace(row.meta.conference + ' ', '')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Odds per book */}
                      {activeBooks.map(book => {
                        const entry = row.books.get(book);
                        if (!entry) {
                          return (
                            <td key={book} className="text-center px-2 py-2.5">
                              <span className="text-slate-700">—</span>
                            </td>
                          );
                        }
                        const isBest = entry.book === row.bestBook;
                        return (
                          <td key={book} className="text-center px-2 py-2.5">
                            <span className={`font-mono text-sm font-bold
                              ${isBest ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {fmtOdds(entry.odds)}
                            </span>
                          </td>
                        );
                      })}

                      {/* Avg implied probability */}
                      <td className="text-center px-3 py-2.5">
                        <span className="font-mono text-sm text-amber-400 font-bold">
                          {(row.avgImplied * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {teamRows.length === 0 && search && (
            <div className="text-center py-8 text-slate-600 text-sm">
              No teams matching "{search}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
