// ─────────────────────────────────────────────────────────────────────────────
// storage.js — Platinum Rose centralized localStorage layer
//
// ALL reads/writes should go through these helpers, not raw localStorage.
// Provides:
//   - Type-safe load/save with try/catch
//   - Explicit clear (persists empty state through refresh)
//   - Key catalog (PR_STORAGE_KEYS) — single source of truth
//   - Backup / restore for disaster recovery
// ─────────────────────────────────────────────────────────────────────────────
import logger from './logger';

/**
 * Catalog of ALL localStorage keys used by the app.
 * Update this list before adding any new key elsewhere.
 *
 * permanence:
 *   'critical'   — must never be accidentally wiped (user entered data)
 *   'persistent' — should survive refresh but not catastrophic to lose
 *   'ephemeral'  — OK to lose; will rebuild on next API call
 */
export const PR_STORAGE_KEYS = {
  // Expert picks —————————————————————————————————————————————————————————
  EXPERT_CONSENSUS: {
    key: 'nfl_expert_consensus',
    permanence: 'critical',
    description: 'Expert pick consensus per game (AI-extracted or manual)',
  },
  // Picks Tracker ————————————————————————————————————————————————————————
  PICKS: {
    key: 'pr_picks_v1',
    permanence: 'critical',
    description: 'AI Lab picks with grading',
  },
  GAME_RESULTS: {
    key: 'pr_game_results_v1',
    permanence: 'persistent',
    description: 'Cached game results for auto-grading',
  },
  // Bankroll —————————————————————————————————————————————————————————————
  BANKROLL: {
    key: 'nfl_bankroll_data_v1',
    permanence: 'critical',
    description: 'Bankroll bets and settings',
  },
  // Futures Portfolio ————————————————————————————————————————————————————
  FUTURES: {
    key: 'nfl_futures_portfolio_v1',
    permanence: 'critical',
    description: 'Futures positions and open parlays',
  },
  FUTURES_WATCHLIST: {
    key: 'nfl_futures_watchlist_v1',
    permanence: 'persistent',
    description: 'Watch List — tracked teams, markets, and price targets',
  },
  PLAYOFF_BRACKET: {
    key: 'pr_playoff_bracket_v1',
    permanence: 'persistent',
    description: 'Playoff bracket seed assignments for exposure overlay',
  },
  // Betting card —————————————————————————————————————————————————————————
  MY_BETS: {
    key: 'nfl_my_bets',
    permanence: 'persistent',
    description: "User's current betting card",
  },
  // Splits / overlays ————————————————————————————————————————————————————
  SPLITS: {
    key: 'nfl_splits',
    permanence: 'persistent',
    description: 'Action Network betting splits (imported)',
  },
  CONTEST_LINES: {
    key: 'nfl_contest_lines',
    permanence: 'persistent',
    description: 'SuperContest locked lines, keyed by game id: { value, lockedAt } (older bare-number entries are still read for back-compat -- see App.jsx gamesWithSplits)',
  },
  SIM_RESULTS: {
    key: 'nfl_sim_results',
    permanence: 'persistent',
    description: 'Dev Lab Monte Carlo simulation results',
  },
  // Odds cache ———————————————————————————————————————————————————————————
  CACHED_ODDS: {
    key: 'cached_odds_data',
    permanence: 'ephemeral',
    description: 'Cached API odds response',
  },
  CACHED_ODDS_TIME: {
    key: 'cached_odds_time',
    permanence: 'ephemeral',
    description: 'Timestamp of last odds cache',
  },
  LINE_MOVEMENTS: {
    key: 'lineMovements',
    permanence: 'ephemeral',
    description: 'In-browser line movement tracking',
  },
  // User preferences —————————————————————————————————————————————————————
  OPENAI_KEY: {
    key: 'PR_OPENAI_KEY',
    permanence: 'persistent',
    description: 'User-provided OpenAI API key',
  },
  // Props Agent (F-8) ————————————————————————————————————————————————————
  PROPS_PICKS: {
    key: 'nfl_props_picks_v1',
    permanence: 'critical',
    description: 'Logged player prop picks and SGP legs (PROPS agent)',
  },
  // Odds API quota ———————————————————————————————————————————————————————
  ODDS_QUOTA: {
    key: 'oddsApi_quota',
    permanence: 'ephemeral',
    description: 'Odds API quota state (remaining requests + month)',
  },
  // Injury data source (F-27c) ————————————————————————————————————————————
  INJURY_SOURCE: {
    key: 'nfl_injury_source_v1',
    permanence: 'ephemeral',
    description: 'Live/mock-fallback state from the last injury fetch (per-team)',
  },
  // Fantasy Roster & Keepers —————————————————————————————————————————————
  FANTASY_ROSTER: {
    key: 'nfl_fantasy_rosters_v1',
    permanence: 'critical',
    description: 'Manually imported fantasy football rosters and keeper settings',
  },
  // Sync dirty queue —————————————————————————————————————————————————————
  SYNC_QUEUE: {
    key: 'nfl_sync_dirty_queue_v1',
    permanence: 'persistent',
    description: 'Dirty sync queue for failed Supabase writes',
  },
  // Fantasy Hub season phase (2026-08-24) ———————————————————————————————
  FANTASY_PHASE: {
    key: 'pr_fantasy_phase_v1',
    permanence: 'persistent',
    description: 'Fantasy Hub preseason/in-season toggle -- changes which Value Board view (draft projections vs. weekly rankings) opens by default',
  },
  // Official Picks Inbox pins (Phase 1, 2026-08-24) ————————————————————————
  OFFICIAL_PICKS_PINNED: {
    key: 'pr_official_picks_pinned_v1',
    permanence: 'persistent',
    description: 'Locally-pinned draft proposal filenames in the Official Picks inbox (client-only -- the inbox itself is server-backed, this never touches the local inbox server or Supabase)',
  },
};

// Convenience set of all critical keys (never wipe these)
export const CRITICAL_KEYS = new Set(
  Object.values(PR_STORAGE_KEYS)
    .filter(e => e.permanence === 'critical')
    .map(e => e.key)
);

// ─────────────────────────────────────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read a value from localStorage. Returns defaultValue on miss or parse error. */
export const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    logger.warn(`[storage] Failed to load "${key}":`, e);
    return defaultValue;
  }
};

/** Write a value to localStorage. Logs a warning on failure (quota exceeded, etc.). */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    logger.warn(`[storage] Failed to save "${key}":`, e);
  }
};

/**
 * Explicitly clear a key — writes an empty value rather than removing the entry.
 * This ensures an "empty" state PERSISTS through a hard refresh, unlike simply
 * calling setMyBets([]) which may not trigger the auto-save guard.
 *
 * Use this from any "Clear All" action instead of relying on the auto-save effect.
 */
export const clearStorage = (key, emptyValue = null) => {
  try {
    localStorage.setItem(key, JSON.stringify(emptyValue));
  } catch (e) {
    logger.warn(`[storage] Failed to clear "${key}":`, e);
  }
};

/** Remove a key entirely (use only for ephemeral/cache keys). */
export const removeFromStorage = (key) => {
  if (CRITICAL_KEYS.has(key)) {
    logger.warn(`[storage] removeFromStorage blocked: "${key}" is a critical key. Use clearStorage() instead.`);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (e) {
    logger.warn(`[storage] Failed to remove "${key}":`, e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Backup / Restore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Export all known app data to a plain JS object.
 * Safe to JSON.stringify and save as a .json file for external backup.
 */
export const exportAppData = () => {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {},
  };
  for (const entry of Object.values(PR_STORAGE_KEYS)) {
    try {
      const raw = localStorage.getItem(entry.key);
      snapshot.data[entry.key] = raw !== null ? JSON.parse(raw) : null;
    } catch {
      snapshot.data[entry.key] = null;
    }
  }
  return snapshot;
};

/**
 * Download a backup JSON file to the user's machine.
 */
export const downloadBackup = () => {
  const snapshot = exportAppData();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `platinum-rose-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Restore app data from a previously exported snapshot.
 * Only writes keys that exist in PR_STORAGE_KEYS (safety guard).
 * Returns { restored: number, skipped: number }.
 */
export const importAppData = (snapshot) => {
  if (!snapshot?.data || typeof snapshot.data !== 'object') {
    throw new Error('Invalid backup file: missing "data" object');
  }
  const knownKeys = new Set(Object.values(PR_STORAGE_KEYS).map(e => e.key));
  let restored = 0, skipped = 0;
  for (const [key, value] of Object.entries(snapshot.data)) {
    if (!knownKeys.has(key)) { skipped++; continue; }
    if (value === null) { skipped++; continue; }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      restored++;
    } catch {
      skipped++;
    }
  }
  return { restored, skipped };
};

/**
 * Returns a human-readable summary of current storage usage.
 * Useful for debugging in the console: import { getStorageDiagnostics } from '@/lib/storage'
 */
export const getStorageDiagnostics = () => {
  const rows = [];
  for (const [_name, entry] of Object.entries(PR_STORAGE_KEYS)) {
    const raw = localStorage.getItem(entry.key);
    const bytes = raw ? new Blob([raw]).size : 0;
    let count = '—';
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) count = `${parsed.length} items`;
        else if (typeof parsed === 'object' && parsed !== null) count = `${Object.keys(parsed).length} keys`;
        else count = 'scalar';
      } catch { count = 'parse error'; }
    }
    rows.push({ key: entry.key, permanence: entry.permanence, size: `${(bytes / 1024).toFixed(1)} KB`, count, present: raw !== null });
  }
  logger.log(rows);
  return rows;
};
