// src/components/supercontest/SuperContestView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SuperContest — dedicated, persistent view.
//
// Promoted out of the old flat header "Tools" row per Andy's 2026-08-24
// per-feature placement decision: SuperContest is visited deeply a few times
// a week with his betting partner and needs its own standalone surface, not
// a generic modal buried among Teasers/Splits/Kalshi-Poly/Sizing.
//
// Phase 2 (2026-08-24) -- drift table + first-draft confidence model. This
// was blocked on two open decisions (how a line's "lock" is captured/timed,
// and what feeds the confidence model). Andy asked to see the entire
// redesign built end-to-end rather than stopping at more placeholders, so
// this ships a real, working first draft using explicit, defensible defaults
// instead of guessing at something more elaborate:
//
//   LOCK MOMENT: the timestamp of the most recent "Save Updates" click that
//   actually changed that game's line. Re-saving without editing a line does
//   NOT reset its lock time (see handleSave below) -- lock is meant to mean
//   "when I committed to this number," not "when I last opened this screen."
//   This is stored alongside the line value in contestLines (App.jsx /
//   useSchedule.js): { value, lockedAt } instead of a bare number. Old
//   bare-number entries from before this change are still read correctly
//   (App.jsx normalizes both shapes).
//
//   CONFIDENCE MODEL: there is no "which side did I take" concept anywhere
//   in this data model -- SuperContest only ever stored a single spread
//   NUMBER per game, not a home/visitor selection. A real win-probability
//   confidence score would need that and doesn't exist yet (a bigger,
//   separate decision). What's real and available today: how far the
//   market has moved off your locked number, and how lopsided public/expert
//   consensus is on this game. Combined into a "Line Stability Score" --
//   NOT a win-probability, just a real signal for "is my locked number
//   still well-positioned or has the market moved past it." See
//   calculateStability() below for the exact (simple, transparent) formula.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, X, Activity, Save, TrendingUp, 
  Microscope, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, ArrowUpDown,
  Minus, CheckCircle2, Lock, Unlock, Check, Star, UserCheck, Users, Shield,
  Filter, EyeOff, Search
} from 'lucide-react';
import { getTeamLogo } from '../../lib/teams';
import { loadFromStorage, saveToStorage } from '../../lib/storage';
import { 
  getSuperContestMetadata, 
  calculateStability, 
  filterWeekGames, 
  sortSuperContestGames,
  timeAgo, 
  WATCHLIST_STORAGE_KEY,
  syncPicksToSundayTracker,
  getRecommendedPickTeam,
  SC_WEEKS,
  SC_LATEST_WEEK,
  getTeamContestSpread
} from '../../lib/superContest';
import MatchupWizardModal from '../modals/MatchupWizardModal';

const postLockedCardToToolbox = async (week, lockedCard) => {
  if (!lockedCard || !Array.isArray(lockedCard)) return false;
  try {
    const res = await fetch('http://127.0.0.1:4567/api/supercontest/locked-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week, lockedCard }),
    });
    return res.ok;
  } catch (err) {
    void err;
    return false;
  }
};

export default function SuperContestView({ isOpen, onClose, games = [], onUpdateContestLines, onSelectGame: _onSelectGame }) {
  const [selectedWeek, setSelectedWeek] = useState(SC_LATEST_WEEK);
  const [lines, setLines] = useState({});
  const [analyzingGame, setAnalyzingGame] = useState(null);
  const [trackerSynced, setTrackerSynced] = useState(false);

  // Trim schedule to the selected regular season week (default Week 1, 16 games)
  const weekGames = useMemo(() => filterWeekGames(games, selectedWeek), [games, selectedWeek]);

  // Andy & Amanda's Watchlists & Locked Weekly Selections
  const [watchlists, setWatchlists] = useState(() => loadFromStorage(WATCHLIST_STORAGE_KEY, {}));

  // Current week's watchlist state with strict schema validation:
  const currentWeekWatchlist = useMemo(() => {
    const raw = watchlists[selectedWeek];
    if (!raw || typeof raw !== 'object') {
      return {
        andy: [],
        amanda: [],
        lockedPicks: [],
        locked: false,
        lockedAt: null,
        snapshot: null,
        andySides: {},
        amandaSides: {},
        lockedSides: {},
      };
    }
    return {
      andy: Array.isArray(raw.andy) ? raw.andy : [],
      amanda: Array.isArray(raw.amanda) ? raw.amanda : [],
      lockedPicks: Array.isArray(raw.lockedPicks) ? raw.lockedPicks.slice(0, 5) : [],
      locked: Boolean(raw.locked),
      lockedAt: raw.lockedAt || null,
      snapshot: raw.snapshot || null,
      andySides: (raw.andySides && typeof raw.andySides === 'object' && !Array.isArray(raw.andySides)) ? raw.andySides : {},
      amandaSides: (raw.amandaSides && typeof raw.amandaSides === 'object' && !Array.isArray(raw.amandaSides)) ? raw.amandaSides : {},
      lockedSides: (raw.lockedSides && typeof raw.lockedSides === 'object' && !Array.isArray(raw.lockedSides)) ? raw.lockedSides : {},
    };
  }, [watchlists, selectedWeek]);

  const andyPicks = useMemo(() => Array.isArray(currentWeekWatchlist.andy) ? currentWeekWatchlist.andy : [], [currentWeekWatchlist.andy]);
  const amandaPicks = useMemo(() => Array.isArray(currentWeekWatchlist.amanda) ? currentWeekWatchlist.amanda : [], [currentWeekWatchlist.amanda]);
  const lockedPicks = useMemo(() => Array.isArray(currentWeekWatchlist.lockedPicks) ? currentWeekWatchlist.lockedPicks.slice(0, 5) : [], [currentWeekWatchlist.lockedPicks]);
  const andySides = useMemo(() => (currentWeekWatchlist.andySides && typeof currentWeekWatchlist.andySides === 'object') ? currentWeekWatchlist.andySides : {}, [currentWeekWatchlist.andySides]);
  const amandaSides = useMemo(() => (currentWeekWatchlist.amandaSides && typeof currentWeekWatchlist.amandaSides === 'object') ? currentWeekWatchlist.amandaSides : {}, [currentWeekWatchlist.amandaSides]);
  const lockedSides = useMemo(() => (currentWeekWatchlist.lockedSides && typeof currentWeekWatchlist.lockedSides === 'object') ? currentWeekWatchlist.lockedSides : {}, [currentWeekWatchlist.lockedSides]);
  const isWeekLocked = Boolean(currentWeekWatchlist.locked);
  const consensusMatchups = useMemo(() => {
    return andyPicks.filter(id => {
      if (!amandaPicks.includes(id)) return false;
      const game = weekGames.find(g => g.id === id);
      const defaultTeam = game ? getRecommendedPickTeam(game) : null;
      const andyTeam = andySides[id] || defaultTeam;
      const amandaTeam = amandaSides[id] || defaultTeam;
      return andyTeam === amandaTeam;
    });
  }, [andyPicks, amandaPicks, andySides, amandaSides, weekGames]);

  // Matchup Filters: 'all' | 'watchlist_any' | 'consensus' | 'andy' | 'amanda' | 'locked' | 'unreviewed' | 'movement'
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Matchup Sorting: 'default' | 'most_volatile' | 'most_stable' | 'movement'
  const [sortBy, setSortBy] = useState('default');

  const watchlistAnySet = useMemo(() => new Set([...andyPicks, ...amandaPicks]), [andyPicks, amandaPicks]);
  const watchlistAnyCount = watchlistAnySet.size;

  const unreviewedCount = useMemo(() => {
    return weekGames.filter(g => !andyPicks.includes(g.id) && !amandaPicks.includes(g.id)).length;
  }, [weekGames, andyPicks, amandaPicks]);

  const movementCount = useMemo(() => {
    return weekGames.filter(g => {
      const meta = getSuperContestMetadata(g);
      return meta.movementPoints !== 0;
    }).length;
  }, [weekGames]);

  // Filtered games list based on activeFilter and searchQuery
  const filteredWeekGames = useMemo(() => {
    return weekGames.filter(g => {
      // Category filter
      if (activeFilter === 'watchlist_any' && !watchlistAnySet.has(g.id)) return false;
      if (activeFilter === 'consensus' && !consensusMatchups.includes(g.id)) return false;
      if (activeFilter === 'andy' && !andyPicks.includes(g.id)) return false;
      if (activeFilter === 'amanda' && !amandaPicks.includes(g.id)) return false;
      if (activeFilter === 'locked' && !lockedPicks.includes(g.id)) return false;
      if (activeFilter === 'unreviewed' && (andyPicks.includes(g.id) || amandaPicks.includes(g.id))) return false;
      if (activeFilter === 'movement') {
        const meta = getSuperContestMetadata(g);
        if (meta.movementPoints === 0) return false;
      }

      // Search query (team code or team name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const v = (g.visitor || '').toLowerCase();
        const h = (g.home || '').toLowerCase();
        const vn = (g.visitorName || '').toLowerCase();
        const hn = (g.homeName || '').toLowerCase();
        if (!v.includes(q) && !h.includes(q) && !vn.includes(q) && !hn.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [weekGames, activeFilter, searchQuery, andyPicks, amandaPicks, lockedPicks, watchlistAnySet, consensusMatchups]);

  // Sorted and filtered games list based on sortBy selection
  const sortedFilteredGames = useMemo(() => {
    return sortSuperContestGames(filteredWeekGames, sortBy, lines);
  }, [filteredWeekGames, sortBy, lines]);

  const toggleWatchlist = (person, gameId, side = null) => {
    if (isWeekLocked) {
      alert(`Week ${selectedWeek} selections are currently locked. Click "Unlock Selections" if you need to modify your card.`);
      return;
    }
    setWatchlists(prev => {
      const prevWeek = prev[selectedWeek] || { andy: [], amanda: [], lockedPicks: [], locked: false, lockedAt: null, andySides: {}, amandaSides: {}, lockedSides: {} };
      const currentList = prevWeek[person] || [];
      const sidesKey = person === 'andy' ? 'andySides' : 'amandaSides';
      const currentSides = { ...(prevWeek[sidesKey] || {}) };

      const game = weekGames.find(g => g.id === gameId);
      const defaultTeam = game ? getRecommendedPickTeam(game) : (game ? game.home : null);

      let updatedList = [...currentList];

      if (side) {
        if (currentList.includes(gameId)) {
          if (currentSides[gameId] === side) {
            // Clicked same side again -> toggle off
            updatedList = currentList.filter(id => id !== gameId);
            delete currentSides[gameId];
          } else {
            // Switch side
            currentSides[gameId] = side;
          }
        } else {
          updatedList.push(gameId);
          currentSides[gameId] = side;
        }
      } else {
        if (currentList.includes(gameId)) {
          updatedList = currentList.filter(id => id !== gameId);
          delete currentSides[gameId];
        } else {
          updatedList.push(gameId);
          currentSides[gameId] = defaultTeam;
        }
      }

      const next = {
        ...prev,
        [selectedWeek]: {
          ...prevWeek,
          [person]: updatedList,
          [sidesKey]: currentSides,
        },
      };
      saveToStorage(WATCHLIST_STORAGE_KEY, next);
      return next;
    });
  };

  const toggleRowLock = (gameId, side = null) => {
    if (isWeekLocked) {
      alert(`Week ${selectedWeek} selections are currently locked. Click "Unlock Selections" if you need to modify your card.`);
      return;
    }
    setWatchlists(prev => {
      const prevWeek = prev[selectedWeek] || { andy: [], amanda: [], lockedPicks: [], locked: false, lockedAt: null, andySides: {}, amandaSides: {}, lockedSides: {} };
      const currentLocked = prevWeek.lockedPicks || [];
      const currentLockedSides = { ...(prevWeek.lockedSides || {}) };
      const andyS = prevWeek.andySides || {};
      const amandaS = prevWeek.amandaSides || {};

      const game = weekGames.find(g => g.id === gameId);
      const defaultTeam = andyS[gameId] || amandaS[gameId] || (game ? getRecommendedPickTeam(game) : (game ? game.home : null));

      let updatedLocked = [...currentLocked];

      if (side) {
        if (currentLocked.includes(gameId)) {
          if (currentLockedSides[gameId] === side) {
            // Clicked same locked side again -> unlock
            updatedLocked = currentLocked.filter(id => id !== gameId);
            delete currentLockedSides[gameId];
          } else {
            // Switch locked side
            currentLockedSides[gameId] = side;
          }
        } else {
          if (currentLocked.length >= 5) {
            alert('SuperContest limit reached: You can only lock a maximum of 5 picks for your official card. Please unlock an existing pick first.');
            return prev;
          }
          updatedLocked.push(gameId);
          currentLockedSides[gameId] = side;
        }
      } else {
        if (currentLocked.includes(gameId)) {
          updatedLocked = currentLocked.filter(id => id !== gameId);
          delete currentLockedSides[gameId];
        } else {
          if (currentLocked.length >= 5) {
            alert('SuperContest limit reached: You can only lock a maximum of 5 picks for your official card. Please unlock an existing pick first.');
            return prev;
          }
          updatedLocked.push(gameId);
          currentLockedSides[gameId] = defaultTeam;
        }
      }

      const next = {
        ...prev,
        [selectedWeek]: {
          ...prevWeek,
          lockedPicks: updatedLocked.slice(0, 5),
          lockedSides: currentLockedSides,
        },
      };
      saveToStorage(WATCHLIST_STORAGE_KEY, next);

      // Automatically sync to Live Sunday Tracker with exact locked sides!
      const syncRes = syncPicksToSundayTracker(updatedLocked.slice(0, 5), weekGames, selectedWeek, currentLockedSides);
      if (syncRes && syncRes.lockedCard) {
        postLockedCardToToolbox(selectedWeek, syncRes.lockedCard);
      }
      return next;
    });
    setTrackerSynced(true);
    setTimeout(() => setTrackerSynced(false), 3000);
  };

  const handleSyncSundayTracker = () => {
    const effectiveLockedSides = { ...(currentWeekWatchlist.lockedSides || {}) };
    const lockedList = (currentWeekWatchlist.lockedPicks || []).slice(0, 5);
    const allPicksToSync = (lockedList.length > 0
      ? lockedList
      : Array.from(new Set([
          ...consensusMatchups,
          ...(andyPicks.slice(0, 5)),
          ...(amandaPicks.slice(0, 5))
        ]))
    ).slice(0, 5);
    allPicksToSync.forEach(id => {
      if (!effectiveLockedSides[id]) {
        effectiveLockedSides[id] = andySides[id] || amandaSides[id] || (weekGames.find(g => g.id === id) ? getRecommendedPickTeam(weekGames.find(g => g.id === id)) : null);
      }
    });
    const syncRes = syncPicksToSundayTracker(allPicksToSync, weekGames, selectedWeek, effectiveLockedSides);
    if (syncRes && syncRes.lockedCard) {
      postLockedCardToToolbox(selectedWeek, syncRes.lockedCard).then(() => {
        setTrackerSynced(true);
        setTimeout(() => setTrackerSynced(false), 4000);
      });
    } else {
      setTrackerSynced(true);
      setTimeout(() => setTrackerSynced(false), 3000);
    }
  };

  const handleLockWeekSelections = () => {
    const totalSelected = new Set([...andyPicks, ...amandaPicks, ...lockedPicks]).size;
    if (totalSelected === 0) {
      alert(`Please select at least one matchup for Andy or Amanda or lock a pick before freezing Week ${selectedWeek} selections.`);
      return;
    }

    const confirmMsg = `Lock Week ${selectedWeek} contest selections?\n\n` +
      `• Andy: ${andyPicks.length} matchup(s) selected\n` +
      `• Amanda: ${amandaPicks.length} matchup(s) selected\n` +
      `• Locked Picks: ${lockedPicks.length} matchup(s)\n\n` +
      `This will timestamp and freeze your official card and sync directly to the Live Sunday Tracker.`;

    if (!window.confirm(confirmMsg)) return;

    const now = new Date().toISOString();
    const buildSnapshotPicks = (pickIds, personSides = {}) => {
      return pickIds.map(id => {
        const game = weekGames.find(g => g.id === id);
        const meta = game ? getSuperContestMetadata(game) : null;
        const lineVal = lines[id] !== undefined ? lines[id] : game?.contestSpread;
        const pickTeam = personSides[id] || (game ? getRecommendedPickTeam(game) : null);
        const spreadInfo = game && pickTeam ? getTeamContestSpread(game, pickTeam) : null;
        return {
          id,
          visitor: game?.visitor,
          home: game?.home,
          matchup: `${game?.visitor} @ ${game?.home}`,
          contestSpread: spreadInfo?.label || meta?.contestSpreadLabel || `${game?.home} ${lineVal > 0 ? '+' : ''}${lineVal}`,
          currentSpread: meta?.currentSpreadLabel || (game?.spread ? `${game?.home} ${game?.spread > 0 ? '+' : ''}${game?.spread}` : 'N/A'),
          lockedContestLine: lineVal,
          pickTeam,
          pickSpread: spreadInfo?.spread ?? null,
        };
      });
    };

    const effectiveLockedSides = { ...(currentWeekWatchlist.lockedSides || {}) };
    const effectiveLockedPicks = lockedPicks.length > 0 ? [...lockedPicks] : [];

    if (effectiveLockedPicks.length < 5) {
      const candidates = Array.from(new Set([
        ...consensusMatchups,
        ...andyPicks,
        ...amandaPicks
      ]));
      for (const cId of candidates) {
        if (effectiveLockedPicks.length >= 5) break;
        if (!effectiveLockedPicks.includes(cId)) {
          effectiveLockedPicks.push(cId);
          if (!effectiveLockedSides[cId]) {
            effectiveLockedSides[cId] = andySides[cId] || amandaSides[cId] || (weekGames.find(g => g.id === cId) ? getRecommendedPickTeam(weekGames.find(g => g.id === cId)) : null);
          }
        }
      }
    }

    // Sync to Live Sunday Tracker
    const syncRes = syncPicksToSundayTracker(effectiveLockedPicks, weekGames, selectedWeek, effectiveLockedSides);
    if (syncRes && syncRes.lockedCard) {
      postLockedCardToToolbox(selectedWeek, syncRes.lockedCard);
    }
    setTrackerSynced(true);

    const snapshot = {
      lockedAt: now,
      week: selectedWeek,
      andy: buildSnapshotPicks(andyPicks, andySides),
      amanda: buildSnapshotPicks(amandaPicks, amandaSides),
      lockedPicks: buildSnapshotPicks(effectiveLockedPicks, effectiveLockedSides),
    };

    setWatchlists(prev => {
      const prevWeek = prev[selectedWeek] || {};
      const next = {
        ...prev,
        [selectedWeek]: {
          ...prevWeek,
          locked: true,
          lockedAt: now,
          lockedPicks: effectiveLockedPicks,
          lockedSides: effectiveLockedSides,
          snapshot,
        },
      };
      saveToStorage(WATCHLIST_STORAGE_KEY, next);
      return next;
    });
  };

  const handleUnlockWeekSelections = () => {
    if (window.confirm(`Unlock Week ${selectedWeek} selections to make changes?`)) {
      setWatchlists(prev => {
        const prevWeek = prev[selectedWeek] || {};
        const next = {
          ...prev,
          [selectedWeek]: {
            ...prevWeek,
            locked: false,
          },
        };
        saveToStorage(WATCHLIST_STORAGE_KEY, next);
        return next;
      });
    }
  };

  // Pre-load published SuperContest lines from Wednesday release (week-NN-lines.json for the selected week)
  useEffect(() => {
    if (isOpen && weekGames.length > 0) {
      const init = {};
      weekGames.forEach(g => {
        // If user already saved a custom contest line in localStorage, preserve it
        if (g.contestSpread !== null && g.contestSpread !== undefined && g.contestSpread !== '') {
          init[g.id] = g.contestSpread;
        } else {
          // Pre-load from Wednesday's official published lines
          const meta = getSuperContestMetadata(g);
          if (meta.homeRelativeContestSpread !== null) {
            init[g.id] = meta.homeRelativeContestSpread;
          } else if (typeof g.spread === 'number') {
            init[g.id] = g.spread;
          } else {
            init[g.id] = '';
          }
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(init);
    }
  }, [isOpen, weekGames]);

  if (!isOpen) return null;

  // Restore Wednesday's published lines for all Week 1 games
  const handleResetPublished = () => {
    const fresh = {};
    weekGames.forEach(g => {
      const meta = getSuperContestMetadata(g);
      if (meta.homeRelativeContestSpread !== null) {
        fresh[g.id] = meta.homeRelativeContestSpread;
      } else if (typeof g.spread === 'number') {
        fresh[g.id] = g.spread;
      } else {
        fresh[g.id] = '';
      }
    });
    setLines(fresh);
  };

  // Overwrite with live market spreads
  const handleSyncLive = () => {
    if (window.confirm('Overwrite all SuperContest lines with current live spreads?')) {
      const newLines = {};
      weekGames.forEach(g => newLines[g.id] = g.spread);
      setLines(newLines);
    }
  };

  // Lock timestamps only advance for lines that actually changed value
  const handleSave = () => {
    const now = new Date().toISOString();
    const locked = {};
    weekGames.forEach(g => {
      const val = lines[g.id];
      if (val === '' || val === undefined || Number.isNaN(val)) return;
      const unchanged = g.contestSpread != null && Number(val) === Number(g.contestSpread);
      locked[g.id] = { value: Number(val), lockedAt: unchanged && g.contestLineLockedAt ? g.contestLineLockedAt : now };
    });
    if (onUpdateContestLines) {
      onUpdateContestLines(locked);
    }
    onClose();
  };

  const lockedGames = weekGames.filter(g => (lines[g.id] !== undefined && lines[g.id] !== '') || g.contestSpread != null);

  return (
    <div className="fixed inset-0 bg-[#0a0d14] z-[80] flex flex-col animate-in fade-in duration-200" id="supercontest-dashboard-view">

      {/* VIEW HEADER */}
      <div className="border-b border-slate-800 bg-slate-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-black text-lg tracking-tight leading-none">SuperContest Dashboard</h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  Week {selectedWeek} Slate ({weekGames.length} Games)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Pre-Loaded Wed Lines
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Official locked contest spreads, opening lines, live DraftKings movements, and instant deep-dive match analysis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Close SuperContest View"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-5 py-6 space-y-6">

          {/* TOOLBAR, SLATE CONTROLS & WATCHLIST STATUS */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={14} className="text-orange-400" />
                Active Slate:
              </span>
              <div className="flex items-center gap-1.5">
                {SC_WEEKS.map(w => (
                  <button 
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                      selectedWeek === w
                        ? 'bg-orange-600/20 text-orange-300 border-orange-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Week {w} (16 Games)
                  </button>
                ))}
              </div>

              {/* WATCHLIST COUNTERS WITH QUICK FILTER TOGGLES */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveFilter(prev => prev === 'andy' ? 'all' : 'andy')}
                  className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFilter === 'andy'
                      ? 'ring-2 ring-sky-400 bg-sky-500/30 text-sky-200 border-sky-400 shadow-md shadow-sky-950/50'
                      : andyPicks.length === 5 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm' 
                      : andyPicks.length > 0
                      ? 'bg-sky-950/40 text-sky-300 border-sky-500/30 hover:border-sky-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Click to filter by Andy's Watchlist"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  <span>Andy's Watchlist:</span>
                  <span className="font-mono">{andyPicks.length}/5</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter(prev => prev === 'amanda' ? 'all' : 'amanda')}
                  className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFilter === 'amanda'
                      ? 'ring-2 ring-rose-400 bg-rose-500/30 text-rose-200 border-rose-400 shadow-md shadow-rose-950/50'
                      : amandaPicks.length === 5 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-sm' 
                      : amandaPicks.length > 0
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Click to filter by Amanda's Watchlist"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  <span>Amanda's Watchlist:</span>
                  <span className="font-mono">{amandaPicks.length}/5</span>
                </button>

                {consensusMatchups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter(prev => prev === 'consensus' ? 'all' : 'consensus')}
                    className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      activeFilter === 'consensus'
                        ? 'ring-2 ring-amber-400 bg-amber-500/30 text-amber-200 border-amber-400 shadow-md shadow-amber-950/50'
                        : 'border-amber-500/40 bg-amber-500/20 text-amber-300 hover:border-amber-400'
                    }`}
                    title="Click to filter by Consensus picks (Both Like)"
                  >
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{consensusMatchups.length} Consensus (Both Like)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveFilter(prev => prev === 'locked' ? 'all' : 'locked')}
                  className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFilter === 'locked'
                      ? 'ring-2 ring-emerald-400 bg-emerald-500/30 text-emerald-200 border-emerald-400 shadow-md shadow-emerald-950/50'
                      : lockedPicks.length === 5 
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-sm' 
                      : lockedPicks.length > 0
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Click to filter by Locked Picks"
                >
                  <Lock size={11} className="text-emerald-400" />
                  <span>Card Locked:</span>
                  <span className="font-mono">{lockedPicks.length}/5</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* SYNCED BADGE */}
              {trackerSynced && (
                <span className="px-2.5 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm animate-in fade-in">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Synced to Sunday Tracker!
                </span>
              )}

              {/* SUNDAY TRACKER LIVE LINK */}
              <a 
                href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/live-tracker-sunday.html?tab=supercontest`}
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-sky-950/60 hover:bg-sky-900 text-sky-300 hover:text-white text-xs font-bold rounded-lg border border-sky-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                title="Open Live Sunday Tracker SuperContest tab in a new tab"
              >
                <Activity size={13} className="text-sky-400" />
                <span>Live Sunday Tracker</span>
                <ArrowUpRight size={12} className="text-sky-400" />
              </a>

              {/* LOCK / UNLOCK SELECTIONS BUTTON */}
              {isWeekLocked ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Lock size={13} className="text-emerald-400" />
                    Locked {timeAgo(currentWeekWatchlist.lockedAt) || 'for week'}
                  </span>
                  <button 
                    onClick={handleUnlockWeekSelections}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                    title="Unlock selections to modify picks"
                  >
                    <Unlock size={13} className="text-amber-400" />
                    Unlock
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLockWeekSelections}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all"
                  title="Lock Week selections for official tracking and sync to Sunday Tracker"
                >
                  <Lock size={13} />
                  Lock Week {selectedWeek} Selections
                </button>
              )}

              <button 
                onClick={handleSyncSundayTracker}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Manually synchronize current card selections to Live Sunday Tracker"
              >
                <RefreshCw size={13} className="text-sky-400" />
                Sync to Tracker
              </button>

              <button 
                onClick={handleResetPublished}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Reset all lines to Wednesday's official published SuperContest release"
              >
                <RefreshCw size={13} className="text-amber-400" />
                Reset to Wed Lines
              </button>
              <button 
                onClick={handleSyncLive} 
                className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                title="Overwrite with current live market spreads"
              >
                <Activity size={13} />
                Sync Live Odds
              </button>
            </div>
          </div>

          {/* OFFICIAL LOCKED SELECTIONS CARD (DISPLAYED WHEN LOCKED) */}
          {isWeekLocked && (
            <div className="bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-emerald-500/40 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <Lock size={12} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white tracking-tight">
                      Official Week {selectedWeek} Locked Selections
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      (Locked {currentWeekWatchlist.lockedAt ? new Date(currentWeekWatchlist.lockedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'recently'})
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleUnlockWeekSelections}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Unlock size={12} /> Unlock to Edit Card
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Andy's Locked Card */}
                <div className="bg-slate-950/80 rounded-lg p-3 border border-sky-500/30 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck size={13} className="text-sky-400" />
                      Andy's Official Card ({andyPicks.length}/5)
                    </span>
                  </div>
                  {andyPicks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No selections chosen for Andy.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {andyPicks.map(id => {
                        const g = weekGames.find(item => item.id === id);
                        if (!g) return null;
                        const pickTeam = andySides[id] || getRecommendedPickTeam(g);
                        const spreadInfo = getTeamContestSpread(g, pickTeam);
                        const isShared = amandaPicks.includes(id) && (amandaSides[id] || getRecommendedPickTeam(g)) === pickTeam;
                        return (
                          <div key={id} className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{g.visitor} @ {g.home}</span>
                              <span className="font-bold text-sky-300 font-mono text-[11px] bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/30">
                                [{pickTeam}]
                              </span>
                              {isShared && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                                  <Star size={9} className="fill-amber-400 text-amber-400" /> Consensus
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-amber-300 font-bold">
                              {spreadInfo.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Amanda's Locked Card */}
                <div className="bg-slate-950/80 rounded-lg p-3 border border-rose-500/30 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck size={13} className="text-rose-400" />
                      Amanda's Official Card ({amandaPicks.length}/5)
                    </span>
                  </div>
                  {amandaPicks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No selections chosen for Amanda.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {amandaPicks.map(id => {
                        const g = weekGames.find(item => item.id === id);
                        if (!g) return null;
                        const pickTeam = amandaSides[id] || getRecommendedPickTeam(g);
                        const spreadInfo = getTeamContestSpread(g, pickTeam);
                        const isShared = andyPicks.includes(id) && (andySides[id] || getRecommendedPickTeam(g)) === pickTeam;
                        return (
                          <div key={id} className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{g.visitor} @ {g.home}</span>
                              <span className="font-bold text-rose-300 font-mono text-[11px] bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30">
                                [{pickTeam}]
                              </span>
                              {isShared && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                                  <Star size={9} className="fill-amber-400 text-amber-400" /> Consensus
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-amber-300 font-bold">
                              {spreadInfo.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Official 5-Pick Locked Card (Synced to Sunday Tracker) */}
                {lockedPicks.length > 0 && (
                  <div className="md:col-span-2 bg-slate-950/90 rounded-lg p-3 border border-emerald-500/40 shadow-inner mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={13} className="text-emerald-400" />
                        Official Locked 5-Pick Card (Synced to Live Sunday Tracker)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {lockedPicks.length}/5 Picks
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {lockedPicks.map(id => {
                        const g = weekGames.find(item => item.id === id);
                        if (!g) return null;
                        const pickTeam = lockedSides[id] || andySides[id] || amandaSides[id] || getRecommendedPickTeam(g);
                        const spreadInfo = getTeamContestSpread(g, pickTeam);
                        return (
                          <div key={id} className="bg-slate-900/95 rounded border border-emerald-500/40 p-2.5 text-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-200 truncate">{g.visitor} @ {g.home}</span>
                              <img src={getTeamLogo(pickTeam)} alt={pickTeam} className="w-4 h-4 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                            <div className="font-mono text-emerald-300 font-bold text-sm mt-1.5">
                              {spreadInfo.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 16 MATCHUP CARDS WITH LIVE DRIFT & DEEP DIVE BUTTONS */}
          <div className="space-y-3" id="supercontest-matchups-container">

            {/* FILTER TOOLBAR: WATCHLIST, UNREVIEWED, CONSENSUS, LOCKED, STEAM & SEARCH */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1 uppercase tracking-wider">
                  <Filter size={13} className="text-orange-400" />
                  Filter:
                </span>

                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    activeFilter === 'all'
                      ? 'bg-orange-600/20 text-orange-300 border-orange-500/50 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  All ({weekGames.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('watchlist_any')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'watchlist_any'
                      ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/60 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups on either Andy or Amanda's watchlist"
                >
                  <Users size={12} className="text-indigo-400" />
                  <span>Watchlist ({watchlistAnyCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('consensus')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'consensus'
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups both Andy and Amanda like"
                >
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>Both Like ({consensusMatchups.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('andy')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'andy'
                      ? 'bg-sky-500/25 text-sky-200 border-sky-400/60 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups on Andy's watchlist"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Andy ({andyPicks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('amanda')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'amanda'
                      ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups on Amanda's watchlist"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Amanda ({amandaPicks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('locked')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'locked'
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups locked as official picks"
                >
                  <Lock size={12} className="text-emerald-400" />
                  <span>Locked ({lockedPicks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('unreviewed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'unreviewed'
                      ? 'bg-purple-600/25 text-purple-200 border-purple-400/60 shadow-sm shadow-purple-950/40'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups not yet on either watchlist — perfect for scouting fresh candidates"
                >
                  <EyeOff size={12} className="text-purple-400" />
                  <span>Not on Watchlist ({unreviewedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('movement')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    activeFilter === 'movement'
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-sm shadow-cyan-950/40'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title="Matchups with active line movement / CLV steam"
                >
                  <TrendingUp size={12} className="text-cyan-400" />
                  <span>Steam ({movementCount})</span>
                </button>
              </div>

              {/* SORT & SEARCH CONTROLS */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* SORT SELECTOR */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                    <ArrowUpDown size={12} className="text-amber-400" />
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1 focus:border-indigo-500 outline-none cursor-pointer transition-colors"
                    title="Sort matchups by volatility, stability, or line movement"
                  >
                    <option value="default">Schedule (Default)</option>
                    <option value="most_volatile">Volatility (Most Volatile)</option>
                    <option value="most_stable">Stability (Most Stable)</option>
                    <option value="movement">Movement (Largest Steam)</option>
                  </select>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative shrink-0">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search team or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none w-full sm:w-44 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Week {selectedWeek} Matchup Board (Showing {sortedFilteredGames.length} of {weekGames.length} Games)
                </span>
                {sortBy !== 'default' && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                    <ArrowUpDown size={10} />
                    Sorted: {sortBy === 'most_volatile' ? 'Most Volatile' : sortBy === 'most_stable' ? 'Most Stable' : 'Largest Movement'}
                  </span>
                )}
                {(activeFilter !== 'all' || searchQuery || sortBy !== 'default') && (
                  <button
                    type="button"
                    onClick={() => { setActiveFilter('all'); setSearchQuery(''); setSortBy('default'); }}
                    className="text-[10px] font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer ml-1"
                  >
                    Reset Filter &amp; Sort
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Click any matchup row or <strong className="text-indigo-400">Analyze</strong> to open wizard pop-up
              </span>
            </div>

            <div className="grid gap-3">
              {sortedFilteredGames.map((g, idx) => {
                const meta = getSuperContestMetadata(g);
                const hasSteam = meta.movementPoints !== 0;
                const isPositiveFav = meta.movementPoints > 0;
                const isConcluded = meta.isConcluded;
                const isAndyChecked = andyPicks.includes(g.id);
                const isAmandaChecked = amandaPicks.includes(g.id);
                const isRowLocked = lockedPicks.includes(g.id);
                const isConsensus = isAndyChecked && isAmandaChecked;
                const lockedVal = lines[g.id] ?? (meta.homeRelativeContestSpread ?? (typeof g.contestSpread === 'number' ? g.contestSpread : (typeof g.spread === 'number' ? g.spread : 0)));
                const stability = calculateStability(g, lockedVal);
                const recTeam = getRecommendedPickTeam(g);
                const andySide = andySides[g.id] || (isAndyChecked ? recTeam : null);
                const amandaSide = amandaSides[g.id] || (isAmandaChecked ? recTeam : null);
                const lockedSide = lockedSides[g.id] || (isRowLocked ? (andySide || amandaSide || recTeam) : null);
                const visSpread = getTeamContestSpread(g, g.visitor);
                const homeSpread = getTeamContestSpread(g, g.home);

                return (
                  <div 
                    key={g.id} 
                    onClick={() => setAnalyzingGame(g)}
                    className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
                      isRowLocked
                        ? 'bg-slate-900/85 border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-950/30'
                        : isConsensus
                        ? 'bg-slate-900/80 border-amber-500/40 hover:border-amber-400 hover:shadow-amber-950/30'
                        : isAndyChecked || isAmandaChecked
                        ? 'bg-slate-900/70 border-slate-700 hover:border-indigo-500/40 hover:shadow-indigo-950/20'
                        : 'bg-slate-900/50 hover:bg-slate-850 border-slate-800 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-x-5 gap-y-3">
                      
                      {/* MATCHUP TEAMS, LOGOS & STATUS BADGES */}
                      <div className="w-full lg:w-[270px] shrink-0 flex items-center gap-2.5">
                        <div className="text-xs font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                          #{idx + 1}
                        </div>

                        {/* Visitor */}
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={getTeamLogo(g.visitor)} 
                            alt={g.visitor} 
                            className="w-7 h-7 object-contain drop-shadow shrink-0" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="truncate min-w-0 max-w-[110px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-200 text-sm">{g.visitor}</span>
                              <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                {visSpread.spread > 0 ? `+${visSpread.spread}` : visSpread.spread === 0 ? 'PK' : visSpread.spread}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{g.visitorName || g.visitor}</div>
                            {/* Visitor Pick Badges */}
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {andySide === g.visitor && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-500/25 text-sky-200 border border-sky-400/40">
                                  Andy
                                </span>
                              )}
                              {amandaSide === g.visitor && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/25 text-rose-200 border border-rose-400/40">
                                  Amanda
                                </span>
                              )}
                              {lockedSide === g.visitor && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 inline-flex items-center gap-0.5">
                                  <Lock size={8} /> Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-600 px-0.5">@</span>

                        {/* Home */}
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={getTeamLogo(g.home)} 
                            alt={g.home} 
                            className="w-7 h-7 object-contain drop-shadow shrink-0" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="truncate min-w-0 max-w-[110px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-200 text-sm">{g.home}</span>
                              <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                {homeSpread.spread > 0 ? `+${homeSpread.spread}` : homeSpread.spread === 0 ? 'PK' : homeSpread.spread}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{g.homeName || g.home}</div>
                            {/* Home Pick Badges */}
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {andySide === g.home && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-500/25 text-sky-200 border border-sky-400/40">
                                  Andy
                                </span>
                              )}
                              {amandaSide === g.home && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/25 text-rose-200 border border-rose-400/40">
                                  Amanda
                                </span>
                              )}
                              {lockedSide === g.home && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 inline-flex items-center gap-0.5">
                                  <Lock size={8} /> Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* CENTER: STABILITY + LINE STRIP + ANALYZE (focus of the row) */}
                      <div className="flex-1 min-w-0 flex items-center justify-center gap-3 flex-wrap xl:flex-nowrap">
                          {/* Badges Container: Stability (Volatile, Stable, Watch) + Row Locked */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            {/* Line Stability Badge */}
                            <span 
                              className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 shrink-0 ${stability.tier.className}`}
                              title={`Line Stability: ${stability.tier.label} (Score: ${stability.score}/100)${stability.hasConviction ? '' : ' • Estimated splits'} • Drift: ${stability.driftPts > 0 ? `+${stability.driftPts}` : stability.driftPts} pts`}
                            >
                              <Activity size={10} className={stability.tier.label === 'Stable' ? 'text-emerald-400' : stability.tier.label === 'Watch' ? 'text-amber-400' : 'text-rose-400'} />
                              <span>{stability.tier.label}</span>
                              <span className="text-[9px] opacity-75 font-mono">({stability.score})</span>
                            </span>

                            {/* Row Locked Badge */}
                            {isRowLocked && (
                              <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                <Lock size={9} className="text-emerald-400" />
                                {lockedSide ? `${lockedSide} Locked` : 'Locked'}
                              </span>
                            )}
                          </div>
                      {/* 4-COLUMN ODDS & MOVEMENT STRIP: Opening -> Contest -> Current -> Movement */}
                      <div className="w-full sm:w-[440px] shrink-0 grid grid-cols-4 gap-3 bg-slate-950/90 px-3 py-3 rounded-lg border border-indigo-500/25 shadow-md shadow-indigo-950/30">
                        {/* 1. Opening Line */}
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Opening Line
                          </div>
                          <div className="text-sm font-mono font-bold text-slate-300 mt-1">
                            {meta.openingSpreadLabel}
                          </div>
                        </div>

                        {/* 2. Official Contest Spread (Wed Lock) */}
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                            Contest Line
                          </div>
                          <div className="text-sm font-mono font-black text-amber-300 mt-1">
                            {meta.contestSpreadLabel}
                          </div>
                        </div>

                        {/* 3. Current Live Line (DraftKings) */}
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            Current Line
                          </div>
                          <div className="text-sm font-mono font-bold text-cyan-200 mt-1">
                            {isConcluded ? 'FINAL' : meta.currentSpreadLabel}
                          </div>
                        </div>

                        {/* 4. Movement / Steam Delta (Prominently Highlighted) */}
                        <div className="text-center flex flex-col items-center justify-center">
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                            Movement
                          </div>
                          <div className="mt-1 w-full flex justify-center">
                            {hasSteam ? (
                              <span 
                                className={`inline-flex items-center justify-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded-md border shadow-sm ${
                                  isPositiveFav 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-950/40' 
                                    : 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-rose-950/40'
                                }`}
                                title={meta.movementSummary || `Movement: ${meta.movementPoints} pts`}
                              >
                                {isPositiveFav ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                                {meta.movementPoints > 0 ? `+${meta.movementPoints}` : meta.movementPoints}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1 text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                                <Minus size={11} strokeWidth={2.5} /> 0.0
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                        {/* Analyze Matchup Pop-up Trigger (Direct Local Launch - No Tab Flash) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalyzingGame(g);
                          }}
                          className="px-4 py-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 hover:text-white text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                          title={`Analyze Matchup: ${g.visitor} @ ${g.home}`}
                        >
                          <Microscope size={16} className="text-indigo-400" />
                          <span>Analyze</span>
                        </button>

                      </div>

                      {/* RIGHT RAIL: ANDY, AMANDA & ROW-LEVEL LOCK PICK */}
                      <div className="w-full lg:w-auto shrink-0 flex flex-row lg:flex-col items-stretch justify-end gap-1.5 flex-wrap">
                        
                        {/* Andy's Watchlist Selector */}
                        <div className="flex items-center rounded-lg border bg-slate-950/70 border-slate-800 overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist('andy', g.id);
                            }}
                            className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                              isAndyChecked
                                ? 'bg-sky-500/25 text-sky-200'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={isAndyChecked ? "Remove from Andy's Watchlist" : "Add to Andy's Watchlist"}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              isAndyChecked ? 'bg-sky-500 border-sky-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                            }`}>
                              {isAndyChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span className="text-[11px] font-semibold">Andy</span>
                          </button>
                          <div className="flex border-l border-slate-800 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist('andy', g.id, g.visitor);
                              }}
                              className={`px-1.5 py-1 font-bold transition-colors cursor-pointer ${
                                andySide === g.visitor
                                  ? 'bg-sky-500 text-slate-950'
                                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
                              }`}
                              title={`Set Andy's pick to ${g.visitor}`}
                            >
                              {g.visitor}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist('andy', g.id, g.home);
                              }}
                              className={`px-1.5 py-1 font-bold border-l border-slate-800 transition-colors cursor-pointer ${
                                andySide === g.home
                                  ? 'bg-sky-500 text-slate-950'
                                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
                              }`}
                              title={`Set Andy's pick to ${g.home}`}
                            >
                              {g.home}
                            </button>
                          </div>
                        </div>

                        {/* Amanda's Watchlist Selector */}
                        <div className="flex items-center rounded-lg border bg-slate-950/70 border-slate-800 overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist('amanda', g.id);
                            }}
                            className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                              isAmandaChecked
                                ? 'bg-rose-500/25 text-rose-200'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={isAmandaChecked ? "Remove from Amanda's Watchlist" : "Add to Amanda's Watchlist"}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              isAmandaChecked ? 'bg-rose-500 border-rose-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                            }`}>
                              {isAmandaChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span className="text-[11px] font-semibold">Amanda</span>
                          </button>
                          <div className="flex border-l border-slate-800 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist('amanda', g.id, g.visitor);
                              }}
                              className={`px-1.5 py-1 font-bold transition-colors cursor-pointer ${
                                amandaSide === g.visitor
                                  ? 'bg-rose-500 text-slate-950'
                                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
                              }`}
                              title={`Set Amanda's pick to ${g.visitor}`}
                            >
                              {g.visitor}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist('amanda', g.id, g.home);
                              }}
                              className={`px-1.5 py-1 font-bold border-l border-slate-800 transition-colors cursor-pointer ${
                                amandaSide === g.home
                                  ? 'bg-rose-500 text-slate-950'
                                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
                              }`}
                              title={`Set Amanda's pick to ${g.home}`}
                            >
                              {g.home}
                            </button>
                          </div>
                        </div>

                        {/* Row-Level Lock Pick Selector */}
                        <div className="flex items-center rounded-lg border bg-slate-950/70 border-slate-800 overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowLock(g.id);
                            }}
                            className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                              isRowLocked
                                ? 'bg-emerald-500/25 text-emerald-200'
                                : 'text-slate-400 hover:text-amber-300'
                            }`}
                            title={isRowLocked ? "Unlock this pick" : "Lock this matchup as an official contest pick and sync to Sunday Tracker"}
                          >
                            <Lock size={12} className={isRowLocked ? "text-emerald-400" : "text-slate-400"} />
                            <span className="text-[11px] font-semibold">{isRowLocked ? 'Locked' : 'Lock Pick'}</span>
                          </button>
                          <div className="flex border-l border-slate-800 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowLock(g.id, g.visitor);
                              }}
                              className={`px-1.5 py-1 font-bold transition-colors cursor-pointer ${
                                lockedSide === g.visitor
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
                              }`}
                              title={`Lock official contest pick on ${g.visitor}`}
                            >
                              {g.visitor}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowLock(g.id, g.home);
                              }}
                              className={`px-1.5 py-1 font-bold border-l border-slate-800 transition-colors cursor-pointer ${
                                lockedSide === g.home
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
                              }`}
                              title={`Lock official contest pick on ${g.home}`}
                            >
                              {g.home}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {sortedFilteredGames.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-12 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
                  <EyeOff size={28} className="mx-auto text-slate-500" />
                  <p className="font-semibold text-slate-300">
                    No matchups match the selected filter ({activeFilter === 'unreviewed' ? 'Not on Watchlist' : activeFilter}).
                  </p>
                  <button
                    type="button"
                    onClick={() => { setActiveFilter('all'); setSearchQuery(''); setSortBy('default'); }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 font-bold rounded-lg border border-slate-700 text-xs transition-colors"
                  >
                    Clear Filters &amp; Sort (Show All {weekGames.length} Games)
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* VIEW FOOTER */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {lockedGames.length} of {weekGames.length} Week {selectedWeek} lines locked
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg text-white font-bold text-sm shadow-lg shadow-orange-950/40 flex items-center gap-2 transition-all"
            >
              <Save size={16} /> Save Updates
            </button>
          </div>
        </div>
      </div>

      {/* DIRECT POP-UP: MATCHUP WIZARD MODAL (NO DASHBOARD FLASH) */}
      {analyzingGame && (
        <MatchupWizardModal
          isOpen={Boolean(analyzingGame)}
          game={analyzingGame}
          stats={[]}
          onClose={() => setAnalyzingGame(null)}
        />
      )}

    </div>
  );
}
