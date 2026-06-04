// src/lib/supabase.js
// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — browser-side, uses anon key.
// Read-only for public data (odds, line movements, game results).
// Read+Write for user data (picks, bankroll bets) — permissive RLS for personal app.
// Agents use service_role key via process.env, not this file.
// ═══════════════════════════════════════════════════════════════════════════════

import logger from './logger';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isAvailable = () => !!supabase;

// Wrap any Supabase query promise with an 8-second hard timeout.
// Prevents agent tool calls from hanging indefinitely during offseason
// or when Supabase is slow / rate-limiting.
const QUERY_TIMEOUT_MS = 8000;
function withQueryTimeout(queryPromise) {
  return Promise.race([
    queryPromise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Supabase query timed out')),
        QUERY_TIMEOUT_MS
      )
    ),
  ]);
}

// ─── Odds ────────────────────────────────────────────────────────────────────

// Reverse map: DB abbreviation → full team name (matches TheOddsAPI format)
const ABBR_TO_TEAM = {
  ARI: 'Arizona Cardinals',   ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',    BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',   CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',      DEN: 'Denver Broncos',
  DET: 'Detroit Lions',       GB:  'Green Bay Packers',
  HOU: 'Houston Texans',      IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',KC:  'Kansas City Chiefs',
  LV:  'Las Vegas Raiders',   LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams',    MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',   NE:  'New England Patriots',
  NO:  'New Orleans Saints',  NYG: 'New York Giants',
  NYJ: 'New York Jets',       PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers', SF:  'San Francisco 49ers',
  SEA: 'Seattle Seahawks',    TB:  'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',    WSH: 'Washington Commanders',
};

const BOOK_META = {
  draftkings: { name: 'DraftKings', color: 'text-orange-400' },
  fanduel:    { name: 'FanDuel',    color: 'text-blue-400'   },
  betmgm:     { name: 'BetMGM',     color: 'text-yellow-400' },
  caesars:    { name: 'Caesars',    color: 'text-purple-400' },
  betonline:  { name: 'BetOnline',  color: 'text-green-400'  },
  bookmaker:  { name: 'Bookmaker',  color: 'text-red-400'    },
  pointsbet:  { name: 'PointsBet',  color: 'text-pink-400'   },
};

/**
 * Get the most recent odds snapshot from game_odds_snapshots.
 * Reshapes normalized rows into ProcessedGame[] matching enhancedOddsApi format:
 * { id, home_team, away_team, commence_time, bookmakers: { [book]: { name, color, markets: { moneyline, spread, total } } } }
 */
export async function getLatestOddsSnapshot() {
  if (!isAvailable()) return null;
  try {
    // Find the most recent captured_at bucket
    const { data: latest, error: latestErr } = await withQueryTimeout(
      supabase
        .from('game_odds_snapshots')
        .select('captured_at')
        .order('captured_at', { ascending: false })
        .limit(1)
        .single()
    );
    if (latestErr || !latest) return null;

    const capturedAt = latest.captured_at;

    // Fetch all rows for that snapshot
    const { data: rows, error: rowsErr } = await withQueryTimeout(
      supabase
        .from('game_odds_snapshots')
        .select('game_id, home_team, away_team, commence_time, book, market, home_price, away_price, spread, total')
        .eq('captured_at', capturedAt)
    );
    if (rowsErr || !rows?.length) return null;

    // Group by game_id
    const gameMap = new Map();
    for (const row of rows) {
      if (!gameMap.has(row.game_id)) {
        const homeTeam = ABBR_TO_TEAM[row.home_team] || row.home_team;
        const awayTeam = ABBR_TO_TEAM[row.away_team] || row.away_team;
        gameMap.set(row.game_id, {
          id: row.game_id,
          home_team: homeTeam,
          away_team: awayTeam,
          commence_time: row.commence_time,
          bookmakers: {},
        });
      }
      const game = gameMap.get(row.game_id);
      if (!game.bookmakers[row.book]) {
        game.bookmakers[row.book] = {
          name:    (BOOK_META[row.book] || {}).name  || row.book,
          color:   (BOOK_META[row.book] || {}).color || 'text-slate-400',
          markets: {},
        };
      }
      const bm = game.bookmakers[row.book];
      if (row.market === 'moneyline') {
        bm.markets.moneyline = { home: row.home_price, away: row.away_price };
      } else if (row.market === 'spread') {
        bm.markets.spread = {
          home_line:  row.spread != null ? row.spread : null,
          home_price: row.home_price,
          away_line:  row.spread != null ? -row.spread : null,
          away_price: row.away_price,
        };
      } else if (row.market === 'total') {
        bm.markets.total = {
          line:        row.total,
          over_price:  row.home_price,
          under_price: row.away_price,
        };
      }
    }

    return { games: Array.from(gameMap.values()), fetchedAt: capturedAt };
  } catch (e) {
    logger.warn('[supabase] getLatestOddsSnapshot failed:', e.message);
    return null;
  }
}

// ─── Line Movements ──────────────────────────────────────────────────────────

/**
 * Get line movements from Supabase (last N hours).
 * Normalises to the format used by SteamMoveTracker / LineMovementTracker:
 * { game, type, from, to, movement, book, timestamp }
 */
export async function getLineMovementsDB(hours = 24) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await withQueryTimeout(
      supabase
        .from('line_movements')
        .select('*')
        .gte('detected_at', cutoff)
        .order('detected_at', { ascending: false })
        .limit(200)
    );

    if (error || !data) return [];

    // Normalise to storage format expected by getLineMovements()
    return data.map(row => ({
      id:        row.id,
      game:      row.game_key?.replace('_', ' @ ') ?? 'Unknown',
      home_team: row.home_team,
      away_team: row.away_team,
      book:      row.book,
      type:      row.type,
      from:      row.from_line,
      to:        row.to_line,
      movement:  row.movement,
      timestamp: row.detected_at,
    }));
  } catch (e) {
    logger.warn('[supabase] getLineMovementsDB failed:', e.message);
    return [];
  }
}

// ─── Picks / Grading (future tables) ─────────────────────────────────────────

/**
 * Get all line movements for a specific game_key (for historical chart).
 * Unlike getLineMovementsDB this queries by game_key and uses a long window.
 * @param {string} gameKey  — e.g. "Buffalo Bills_Kansas City Chiefs"
 * @param {number} hours    — how far back to look (default 7 days)
 */
export async function getLineHistoryDB(gameKey, hours = 7 * 24) {
  if (!isAvailable() || !gameKey) return [];
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('line_movements')
      .select('*')
      .eq('game_key', gameKey)
      .gte('detected_at', cutoff)
      .order('detected_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getLineHistoryDB failed:', e.message);
    return [];
  }
}

/**
 * Get all unique game keys from line_movements in the last N hours.
 * Used to populate the game selector in LineHistoryChart.
 */
export async function getActiveGameKeys(hours = 7 * 24) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('line_movements')
      .select('game_key, home_team, away_team')
      .gte('detected_at', cutoff);

    if (error || !data) return [];
    // Deduplicate by game_key
    const seen = new Set();
    return data.filter(r => {
      if (seen.has(r.game_key)) return false;
      seen.add(r.game_key);
      return true;
    });
  } catch (e) {
    logger.warn('[supabase] getActiveGameKeys failed:', e.message);
    return [];
  }
}

// ─── Futures Odds ─────────────────────────────────────────────────────────────

/**
 * Get the most recent futures odds snapshot for each team+market+book combo.
 * Returns the latest row per (market_type, team, book) — i.e. current market odds.
 * Used by FuturesOddsMonitor to compare entry price vs current odds.
 *
 * @returns {Promise<Array>} rows: { market_type, team, book, odds, implied_prob, snapshot_time }
 */
export async function getLatestFuturesOdds() {
  if (!isAvailable()) return [];
  try {
    // Get timestamps of most recent snapshot per market_type so we can filter to it
    const { data: latest, error: latestErr } = await supabase
      .from('futures_odds_snapshots')
      .select('market_type, snapshot_time')
      .order('snapshot_time', { ascending: false })
      .limit(3); // one per market type

    if (latestErr || !latest?.length) return [];

    // Group latest snapshot_time by market_type
    const latestByMarket = new Map();
    for (const row of latest) {
      if (!latestByMarket.has(row.market_type)) {
        latestByMarket.set(row.market_type, row.snapshot_time);
      }
    }

    // Fetch all rows within 15 minutes of the latest snapshot per market
    const allRows = [];
    for (const [marketType, latestTime] of latestByMarket) {
      const windowStart = new Date(new Date(latestTime).getTime() - 15 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('futures_odds_snapshots')
        .select('market_type, team, book, odds, implied_prob, snapshot_time')
        .eq('market_type', marketType)
        .gte('snapshot_time', windowStart)
        .order('snapshot_time', { ascending: false });

      if (!error && data) allRows.push(...data);
    }

    return allRows;
  } catch (e) {
    logger.warn('[supabase] getLatestFuturesOdds failed:', e.message);
    return [];
  }
}

/**
 * Get historical futures odds for a specific team+market (for trend chart).
 * @param {string} team        — exact team name as stored
 * @param {string} marketType  — 'superbowl' | 'conference' | 'division'
 * @param {number} days        — how far back (default 30 days)
 */
export async function getFuturesOddsHistory(team, marketType, days = 30) {
  if (!isAvailable() || !team || !marketType) return [];
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('futures_odds_snapshots')
      .select('snapshot_time, book, odds, implied_prob')
      .eq('team', team)
      .eq('market_type', marketType)
      .gte('snapshot_time', cutoff)
      .order('snapshot_time', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getFuturesOddsHistory failed:', e.message);
    return [];
  }
}

// All market_type values stored by futures-odds-ingest (conference/division use subtypes).
const ALL_WATCHLIST_MARKET_TYPES = [
  'superbowl',
  'conference_afc', 'conference_nfc',
  'division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west',
  'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west',
  'wins', 'playoffs',
];

/**
 * Batch-fetch futures odds history for multiple teams × markets.
 * Returns a nested map: { [team]: { [marketType]: Array<{snapshot_time, bestOdds, book}> } }
 * "bestOdds" per snapshot = longest (highest payout) odds across all books.
 * For wins: filters to Over side (selection ILIKE 'Over%').
 * For playoffs: filters to Yes side (selection = 'Yes').
 *
 * @param {string[]} teams — exact team names as stored (e.g. "Buffalo Bills")
 * @param {string[]} _marketTypes — ignored; queries all known market subtypes automatically
 * @param {number}   days  — how far back (default 60)
 */
export async function getWatchlistOddsHistory(teams, _marketTypes, days = 60) {
  if (!isAvailable() || !teams?.length) return {};
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Try with the selection column (migration 022+). If that column doesn't exist yet,
    // fall back to the basic 5-column schema — wins/playoffs won't be filtered by side
    // but at least the core markets will render.
    let data, error;
    ({ data, error } = await supabase
      .from('futures_odds_snapshots')
      .select('team, market_type, book, odds, snapshot_time, selection')
      .in('team', teams)
      .in('market_type', ALL_WATCHLIST_MARKET_TYPES)
      .gte('snapshot_time', cutoff)
      .order('snapshot_time', { ascending: true }));

    if (error?.message?.toLowerCase().includes('selection')) {
      // Pre-migration 022 schema — retry without selection column
      ({ data, error } = await supabase
        .from('futures_odds_snapshots')
        .select('team, market_type, book, odds, snapshot_time')
        .in('team', teams)
        .in('market_type', ALL_WATCHLIST_MARKET_TYPES)
        .gte('snapshot_time', cutoff)
        .order('snapshot_time', { ascending: true }));
    }

    if (error || !data) return {};

    // Group into { team: { marketType: [{snapshot_time, bestOdds, book}] } }
    // Collapse each (team, market_type, snapshot_time window) to a single best-odds point.
    const toDecimal = (o) => {
      if (o == null) return 0;
      if (o >= 100)  return o / 100 + 1;
      if (o <= -100) return 100 / Math.abs(o) + 1;
      return 2;
    };

    // Bucket snapshots within 30-minute windows so multiple books → one data point
    const BUCKET_MS = 30 * 60 * 1000;
    const grouped = {};
    for (const row of data) {
      const { team, market_type, book, odds, snapshot_time, selection } = row;

      // For wins: only track the Over side (the "with the team" bet).
      // For playoffs: only track the Yes side.
      if (market_type === 'wins'    && selection && !String(selection).toLowerCase().startsWith('over')) continue;
      if (market_type === 'playoffs' && selection && String(selection).toLowerCase() !== 'yes') continue;

      if (!grouped[team]) grouped[team] = {};
      if (!grouped[team][market_type]) grouped[team][market_type] = new Map();

      const ts = new Date(snapshot_time).getTime();
      const bucket = Math.floor(ts / BUCKET_MS) * BUCKET_MS;

      const existing = grouped[team][market_type].get(bucket);
      if (!existing || toDecimal(odds) > toDecimal(existing.bestOdds)) {
        grouped[team][market_type].set(bucket, {
          snapshot_time: new Date(bucket).toISOString(),
          bestOdds: odds,
          book,
        });
      }
    }

    // Convert Maps → sorted arrays
    const result = {};
    for (const [team, markets] of Object.entries(grouped)) {
      result[team] = {};
      for (const [market, bucketMap] of Object.entries(markets)) {
        result[team][market] = [...bucketMap.values()].sort(
          (a, b) => new Date(a.snapshot_time) - new Date(b.snapshot_time),
        );
      }
    }
    return result;
  } catch (e) {
    logger.warn('[supabase] getWatchlistOddsHistory failed:', e.message);
    return {};
  }
}

/**
 * Get recent research intel notes for BETTING context preload.
 * @param {number} hours — lookback window (default 72)
 * @param {number} limit — max rows (default 200)
 */
export async function getRecentResearchIntelNotes(hours = 72, limit = 200) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('research_intel_notes')
      .select('id, source, title, summary, url, published_at, confidence, captured_at')
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getRecentResearchIntelNotes failed:', e.message);
    return [];
  }
}

/**
 * Get recent structured research pick signals for BETTING preload.
 * @param {number} hours — lookback window (default 72)
 * @param {number} limit — max rows (default 300)
 */
export async function getRecentResearchPickSignals(hours = 72, limit = 300) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('research_pick_signals')
      .select('id, note_id, source, team_or_market, bet_type, lean, rationale, event_ref, confidence, captured_at')
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getRecentResearchPickSignals failed:', e.message);
    return [];
  }
}

/**
 * Search research intel notes by keyword across title and summary.
 * Used by the BETTING agent's search_intel tool for mid-conversation lookups.
 * @param {string} query — keyword or team name
 * @param {object} opts
 * @param {string} [opts.source] — filter to a single source
 * @param {number} [opts.hours=168] — lookback window (default 7 days)
 * @param {number} [opts.limit=5] — max notes to return
 * @returns {{ notes: Array, signals: Array }}
 */
export async function searchResearchIntel(query, { source, hours = 168, limit = 5 } = {}) {
  if (!isAvailable()) return { notes: [], signals: [] };
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Use Postgres full-text search (migration 011) when available; fall back to ilike.
    // FTS uses plainto_tsquery so multi-word queries work naturally.
    let notesQuery;
    const ftsQuery = query.trim().split(/\s+/).join(' & ');  // "KC Chiefs" → "KC & Chiefs"
    notesQuery = supabase
      .from('research_intel_notes')
      .select('id, source, title, summary, url, published_at, confidence, captured_at')
      .gte('captured_at', cutoff)
      .textSearch('tsv', ftsQuery, { type: 'plain', config: 'english' })
      .order('captured_at', { ascending: false })
      .limit(Math.min(limit, 10));

    if (source) notesQuery = notesQuery.eq('source', source);
    let { data: notes, error } = await notesQuery;

    // Fall back to ilike if FTS column doesn't exist yet (pre-migration 011)
    if (error?.message?.includes('column') || error?.code === '42703') {
      const term = `%${query}%`;
      let fallback = supabase
        .from('research_intel_notes')
        .select('id, source, title, summary, url, published_at, confidence, captured_at')
        .gte('captured_at', cutoff)
        .or(`title.ilike.${term},summary.ilike.${term}`)
        .order('captured_at', { ascending: false })
        .limit(Math.min(limit, 10));
      if (source) fallback = fallback.eq('source', source);
      const { data: fallbackNotes, error: fallbackErr } = await fallback;
      if (fallbackErr || !fallbackNotes) return { notes: [], signals: [] };
      notes = fallbackNotes;
      error = null;
    }

    if (error || !notes) return { notes: [], signals: [] };

    // Fetch pick signals attached to matched notes
    let signals = [];
    if (notes.length > 0) {
      const noteIds = notes.map(n => n.id);
      const { data: sigData } = await supabase
        .from('research_pick_signals')
        .select('note_id, source, team_or_market, bet_type, lean, rationale, confidence')
        .in('note_id', noteIds);
      signals = sigData || [];
    }

    return { notes, signals };
  } catch (e) {
    logger.warn('[supabase] searchResearchIntel failed:', e.message);
    return { notes: [], signals: [] };
  }
}

/**
 * Get the latest game odds snapshot for a given week.
 * Returns one row per (game_id, book, market) — most recent captured_at.
 * Table: game_odds_snapshots (written by GameOddsIngestAgent)
 */
export async function getGameOddsForWeek(week, season = new Date().getFullYear()) {
  if (!isAvailable()) return [];
  try {
    // Subquery equivalent: pick the max captured_at per (game_id, book, market)
    // Supabase doesn't support DISTINCT ON, so we order and rely on the caller
    // to deduplicate if needed. In practice the BETTING tool groups by game_id.
    const { data, error } = await supabase
      .from('game_odds_snapshots')
      .select('game_id, home_team, away_team, commence_time, book, market, home_price, away_price, spread, total, captured_at')
      .eq('season', season)
      .eq('week', week)
      .order('captured_at', { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getGameOddsForWeek failed:', e.message);
    return [];
  }
}

/**
 * Get game results for auto-grading pending picks.
 * Table: game_results (written by NFLAutoGradeAgent)
 */
export async function getGameResults({ week, season } = {}) {
  if (!isAvailable()) return [];
  try {
    let query = supabase.from('game_results').select('*');
    if (week)   query = query.eq('week', week);
    if (season) query = query.eq('season', season);
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getGameResults failed:', e.message);
    return [];
  }
}

/**
 * Look up specific games by ESPN ID (for auto-grading pending picks).
 * @param {string[]} espnIds  — array of ESPN game IDs that match pick.gameId
 * @returns {Promise<Array>}
 */
export async function getGameResultsByIds(espnIds) {
  if (!isAvailable() || !espnIds?.length) return [];
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .in('espn_id', espnIds)
      .eq('status', 'final');

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getGameResultsByIds failed:', e.message);
    return [];
  }
}

// ─── Podcast Ingest ───────────────────────────────────────────────────────────

/**
 * Fetch recent processed podcast episodes with their transcripts, picks, and intel.
 * Joins podcast_episodes → podcast_transcripts + podcast_feeds.
 * Used by PodcastIngestModal to list actionable episodes.
 *
 * @param {number} limit  — max episodes to return (default 30)
 * @returns {Promise<Array>} episodes with nested feed + transcript data
 */
export async function getPodcastEpisodes(limit = 30) {
  if (!isAvailable()) return [];
  try {
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select(`
        id, title, pub_date, status, is_partial, duration_secs,
        podcast_feeds ( name, expert ),
        podcast_transcripts ( picks, intel, processed_at )
      `)
      .eq('status', 'done')
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getPodcastEpisodes failed:', e.message);
    return [];
  }
}

// ─── Phase 6: Podcast intel queries (BETTING + FUTURES agent tools) ──────────
//
// These queries fan out from `podcast_transcripts.picks` (JSONB array).
// Each pick conforms to the v2 shape enforced by migration 023:
//   { category, subject, subject_market?, selection, team1, team2?, line?,
//     odds_american?, summary, units?, confidence, season?, week?, game_date?,
//     quality_score, needs_review, source_chunk_idx?, source_timestamp_secs? }
//
// Filtering/flattening happens client-side because the data volume is bounded
// (≤ ~1 episode/day × ~10 picks). When picks volume grows past ~10k, move
// these to a server-side RPC. All callers MUST exclude needs_review picks
// before surfacing to agents (acceptance §A5).

const POD_LOOKBACK_DEFAULT_HOURS = 14 * 24;
const POD_NEEDS_REVIEW_FILTER = (p) => p && p.needs_review !== true;

/**
 * Fetch recent episodes joined with feed + transcript, flattening each pick
 * into a row carrying its episode/expert context. Internal helper.
 * @param {{ hours?: number, limit?: number }} opts
 * @returns {Promise<Array<{episode_id, episode_title, pub_date, expert, feed_name, processed_at, pick}>>}
 */
async function _flattenPodcastPicks({ hours = POD_LOOKBACK_DEFAULT_HOURS, limit = 200 } = {}) {
  if (!isAvailable()) return [];
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  try {
    const { data, error } = await withQueryTimeout(
      supabase
        .from('podcast_episodes')
        .select(`
          id, title, pub_date,
          podcast_feeds ( name, expert ),
          podcast_transcripts ( picks, processed_at )
        `)
        .eq('status', 'done')
        .gte('pub_date', since)
        .order('pub_date', { ascending: false })
        .limit(limit)
    );
    if (error || !Array.isArray(data)) return [];
    const rows = [];
    for (const ep of data) {
      const transcript = Array.isArray(ep.podcast_transcripts)
        ? ep.podcast_transcripts[0]
        : ep.podcast_transcripts;
      const picks = transcript?.picks;
      if (!Array.isArray(picks)) continue;
      const feed = Array.isArray(ep.podcast_feeds) ? ep.podcast_feeds[0] : ep.podcast_feeds;
      for (const pick of picks) {
        if (!POD_NEEDS_REVIEW_FILTER(pick)) continue;
        rows.push({
          episode_id: ep.id,
          episode_title: ep.title,
          pub_date: ep.pub_date,
          expert: feed?.expert || null,
          feed_name: feed?.name || null,
          processed_at: transcript?.processed_at || null,
          pick,
        });
      }
    }
    return rows;
  } catch (e) {
    logger.warn('[supabase] _flattenPodcastPicks failed:', e.message);
    return [];
  }
}

/**
 * Search recent podcast picks by team / expert / category / week.
 * Tool: `search_podcast_picks`.
 * @param {{ team?: string, expert?: string, category?: string, week?: number, season?: number, limit?: number }} opts
 */
export async function searchPodcastPicks({ team, expert, category, week, season, limit = 25 } = {}) {
  const rows = await _flattenPodcastPicks({ limit: 200 });
  const teamU = team ? String(team).toUpperCase() : null;
  const expertL = expert ? String(expert).toLowerCase() : null;
  const filtered = rows.filter(({ pick, expert: ex }) => {
    if (category && pick.category !== category) return false;
    if (week != null && pick.week !== week) return false;
    if (season != null && pick.season !== season) return false;
    if (expertL && !(ex && ex.toLowerCase().includes(expertL))) return false;
    if (teamU) {
      const subj = String(pick.subject || '').toUpperCase();
      const t1 = String(pick.team1 || '').toUpperCase();
      const t2 = String(pick.team2 || '').toUpperCase();
      if (subj !== teamU && t1 !== teamU && t2 !== teamU) return false;
    }
    return true;
  });
  return filtered.slice(0, limit);
}

/**
 * Per-expert ledger of recent picks with category breakdown.
 * Tool: `get_expert_history`. Grading (W/L/units) is composed in agentTools
 * by joining with game_results — this function returns the raw pick log.
 * @param {{ expert: string, weeksBack?: number, limit?: number }} opts
 */
export async function getExpertHistory({ expert, weeksBack = 8, limit = 100 } = {}) {
  if (!expert) return { expert: null, total: 0, picks: [], by_category: {} };
  const rows = await _flattenPodcastPicks({ hours: weeksBack * 7 * 24, limit: 300 });
  const expertL = String(expert).toLowerCase();
  const matches = rows.filter(r => r.expert && r.expert.toLowerCase().includes(expertL));
  const byCategory = {};
  for (const r of matches) {
    const cat = r.pick.category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  return {
    expert,
    total: matches.length,
    by_category: byCategory,
    picks: matches.slice(0, limit),
  };
}

/**
 * Picks for and against a given team across recent episodes.
 * Tool: `get_team_podcast_intel`.
 * @param {{ team: string, weeksBack?: number, limit?: number }} opts
 */
export async function getTeamPodcastIntel({ team, weeksBack = 4, limit = 50 } = {}) {
  if (!team) return { team: null, for: [], against: [], by_expert: {} };
  const teamU = String(team).toUpperCase();
  const rows = await _flattenPodcastPicks({ hours: weeksBack * 7 * 24, limit: 300 });
  const forPicks = [];
  const againstPicks = [];
  const byExpert = {};
  for (const r of rows) {
    const { pick, expert } = r;
    const subj = String(pick.subject || '').toUpperCase();
    const t1 = String(pick.team1 || '').toUpperCase();
    const t2 = String(pick.team2 || '').toUpperCase();
    if (subj !== teamU && t1 !== teamU && t2 !== teamU) continue;
    const sel = String(pick.selection || '').toUpperCase();
    if (sel === teamU || subj === teamU) forPicks.push(r);
    else againstPicks.push(r);
    if (expert) byExpert[expert] = (byExpert[expert] || 0) + 1;
  }
  return {
    team: teamU,
    for: forPicks.slice(0, limit),
    against: againstPicks.slice(0, limit),
    by_expert: byExpert,
  };
}

/**
 * Cross-expert consensus board for a given week. Groups picks by matchup
 * (team1+team2) and counts sides taken.
 * Tool: `get_weekly_consensus`.
 * @param {{ week: number, season?: number }} opts
 */
export async function getWeeklyConsensus({ week, season } = {}) {
  if (week == null) return { week: null, season: season || null, games: [] };
  const rows = await _flattenPodcastPicks({ limit: 400 });
  const games = new Map();
  for (const r of rows) {
    const { pick } = r;
    if (pick.week !== week) continue;
    if (season != null && pick.season !== season) continue;
    if (pick.category !== 'spread' && pick.category !== 'moneyline' && pick.category !== 'total') continue;
    const t1 = String(pick.team1 || '').toUpperCase();
    const t2 = String(pick.team2 || '').toUpperCase();
    if (!t1 || !t2) continue;
    const key = [t1, t2].sort().join('@');
    if (!games.has(key)) {
      games.set(key, { matchup: key, team1: t1, team2: t2, picks: [], by_selection: {} });
    }
    const game = games.get(key);
    game.picks.push(r);
    const sel = String(pick.selection || 'unknown').toUpperCase();
    game.by_selection[sel] = (game.by_selection[sel] || 0) + 1;
  }
  return {
    week,
    season: season || null,
    games: Array.from(games.values()).sort((a, b) => b.picks.length - a.picks.length),
  };
}

/**
 * Futures-market line/expert timeline for a single market.
 * Tool: `get_futures_movement`. Pairs podcast picks with stored futures odds
 * history when available (caller can layer that join in agentTools).
 * @param {{ market: string, weeksBack?: number, limit?: number }} opts
 */
export async function getFuturesMovement({ market, weeksBack = 12, limit = 100 } = {}) {
  if (!market) return { market: null, picks: [], by_expert: {} };
  const rows = await _flattenPodcastPicks({ hours: weeksBack * 7 * 24, limit: 400 });
  const marketL = String(market).toLowerCase();
  const matches = rows.filter(r =>
    r.pick.category === 'future' &&
    String(r.pick.subject_market || '').toLowerCase() === marketL
  );
  matches.sort((a, b) => new Date(a.pub_date) - new Date(b.pub_date));
  const byExpert = {};
  for (const r of matches) {
    if (r.expert) byExpert[r.expert] = (byExpert[r.expert] || 0) + 1;
  }
  return {
    market,
    picks: matches.slice(0, limit),
    by_expert: byExpert,
  };
}

/**
 * Player-prop pick context: recent expert picks for a single player+prop.
 * Tool: `get_player_prop_context`.
 * @param {{ player: string, propType: string, weeksBack?: number, limit?: number }} opts
 */
export async function getPlayerPropContext({ player, propType, weeksBack = 6, limit = 30 } = {}) {
  if (!player || !propType) return { player: null, prop_type: null, picks: [], trend: {} };
  const rows = await _flattenPodcastPicks({ hours: weeksBack * 7 * 24, limit: 400 });
  const playerL = String(player).toLowerCase();
  const propL = String(propType).toLowerCase();
  const matches = rows.filter(r =>
    r.pick.category === 'prop' &&
    String(r.pick.subject || '').toLowerCase().includes(playerL) &&
    String(r.pick.subject_market || '').toLowerCase() === propL
  );
  const trend = { OVER: 0, UNDER: 0, OTHER: 0 };
  for (const r of matches) {
    const sel = String(r.pick.selection || '').toUpperCase();
    if (sel === 'OVER') trend.OVER += 1;
    else if (sel === 'UNDER') trend.UNDER += 1;
    else trend.OTHER += 1;
  }
  return {
    player,
    prop_type: propType,
    picks: matches.slice(0, limit),
    trend,
  };
}

// ─── User Picks Sync ──────────────────────────────────────────────────────────
// localStorage is the primary store. These functions provide fire-and-forget
// cloud sync so data survives a browser cache clear and is accessible on
// multiple devices. Permissive RLS on user_picks allows anon key writes.

/**
 * Upsert a single pick to Supabase.
 * Called fire-and-forget after every localStorage write in picksDatabase.js.
 * @param {Object} pick  — pick object from picksDatabase.js
 */
export async function syncPick(pick) {
  if (!isAvailable() || !pick?.id) return;
  try {
    await supabase.from('user_picks').upsert({
      id:            pick.id,
      game_id:       pick.gameId,
      source:        pick.source,
      pick_type:     pick.pickType,
      selection:     pick.selection,
      line:          pick.line,
      edge:          pick.edge ?? 0,
      confidence:    pick.confidence,
      home:          pick.home,
      visitor:       pick.visitor,
      game_date:     pick.gameDate,
      game_time:     pick.gameTime || null,
      commence_time: pick.commenceTime || null,
      is_home_team:  pick.isHomeTeam ?? false,
      result:        pick.result ?? 'PENDING',
      home_score:    pick.homeScore ?? null,
      visitor_score: pick.visitorScore ?? null,
      graded_at:     pick.gradedAt ? new Date(pick.gradedAt).toISOString() : null,
      created_at:    pick.createdAt ? new Date(pick.createdAt).toISOString() : new Date().toISOString(),
      updated_at:    new Date().toISOString(),
      // Extended fields (populated for podcast/expert picks)
      rationale:     pick.rationale || null,
      expert:        pick.expert    || null,
      units:         pick.units     ?? null,
    }, { onConflict: 'id' });
  } catch (e) {
    logger.warn('[supabase] syncPick failed (non-fatal):', e.message);
  }
}

/**
 * Delete a pick from Supabase by ID.
 * Called fire-and-forget after deletePick() in picksDatabase.js.
 * @param {string} pickId
 */
export async function deleteSyncedPick(pickId) {
  if (!isAvailable() || !pickId) return;
  try {
    await supabase.from('user_picks').delete().eq('id', pickId);
  } catch (e) {
    logger.warn('[supabase] deleteSyncedPick failed (non-fatal):', e.message);
  }
}

/**
 * Load all picks from Supabase for boot-time hydration.
 * Returns an array of pick objects normalized to the picksDatabase.js schema.
 * @returns {Promise<Array>}
 */
export async function loadUserPicks() {
  if (!isAvailable()) return [];
  try {
    const { data, error } = await supabase
      .from('user_picks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    // Normalize column_name → camelCase to match picksDatabase.js schema
    return data.map(r => ({
      id:           r.id,
      gameId:       r.game_id,
      source:       r.source,
      pickType:     r.pick_type,
      selection:    r.selection,
      line:         r.line !== null ? Number(r.line) : 0,
      edge:         r.edge !== null ? Number(r.edge) : 0,
      confidence:   r.confidence ?? 50,
      home:         r.home,
      visitor:      r.visitor,
      gameDate:     r.game_date,
      gameTime:     r.game_time || '',
      commenceTime: r.commence_time || null,
      isHomeTeam:   r.is_home_team ?? false,
      result:       r.result ?? 'PENDING',
      homeScore:    r.home_score ?? null,
      visitorScore: r.visitor_score ?? null,
      gradedAt:     r.graded_at ?? null,
      createdAt:    r.created_at,
      updatedAt:    r.updated_at ?? r.created_at ?? null,
      // Extended fields (populated for podcast/expert picks)
      rationale:    r.rationale   ?? null,
      expert:       r.expert      ?? null,
      units:        r.units !== null ? Number(r.units) : null,
    }));
  } catch (e) {
    logger.warn('[supabase] loadUserPicks failed (non-fatal):', e.message);
    return [];
  }
}


// ─── User Bankroll Bets Sync ──────────────────────────────────────────────────

/**
 * Upsert a single bankroll bet to Supabase.
 * Called fire-and-forget after every write in bankroll.js.
 * @param {Object} bet  — bet object from bankroll.js
 */
export async function syncBet(bet) {
  if (!isAvailable() || !bet?.id) return;
  try {
    await supabase.from('user_bankroll_bets').upsert({
      id:             bet.id,
      timestamp:      bet.timestamp ? new Date(bet.timestamp).toISOString() : new Date().toISOString(),
      week:           bet.week ?? null,
      status:         bet.status ?? 'pending',
      is_parlay:      bet.isParlay ?? false,
      is_hedging_bet: bet.isHedgingBet ?? false,
      open_slots:     bet.openSlots ?? 0,
      legs:           bet.legs ?? [],
      source:         bet.source ?? 'Manual',
      ticket_number:  bet.ticketNumber ?? null,
      imported:       bet.imported ?? false,
      imported_at:    bet.importedAt ? new Date(bet.importedAt).toISOString() : null,
      description:    bet.description ?? '',
      amount:         bet.amount ?? null,
      odds:           bet.odds ?? null,
      type:           bet.type ?? null,
      potential_win:  bet.potentialWin ?? 0,
      profit:         bet.profit ?? null,
      settled_at:     bet.settledAt ? new Date(bet.settledAt).toISOString() : null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (e) {
    logger.warn('[supabase] syncBet failed (non-fatal):', e.message);
  }
}

/**
 * Load all bankroll bets from Supabase for boot-time hydration.
 * Returns an array of bet objects normalized to the bankroll.js schema.
 * @returns {Promise<Array>}
 */
export async function loadUserBets() {
  if (!isAvailable()) return [];
  try {
    const { data, error } = await supabase
      .from('user_bankroll_bets')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error || !data) return [];

    // Normalize column_name → camelCase to match bankroll.js schema
    return data.map(r => ({
      id:            r.id,
      timestamp:     r.timestamp,
      week:          r.week,
      status:        r.status ?? 'pending',
      isParlay:      r.is_parlay ?? false,
      isHedgingBet:  r.is_hedging_bet ?? false,
      openSlots:     r.open_slots ?? 0,
      legs:          r.legs ?? [],
      source:        r.source ?? 'Manual',
      ticketNumber:  r.ticket_number ?? null,
      imported:      r.imported ?? false,
      importedAt:    r.imported_at ?? null,
      description:   r.description ?? '',
      amount:        r.amount !== null ? Number(r.amount) : null,
      odds:          r.odds !== null ? Number(r.odds) : null,
      type:          r.type ?? null,
      potentialWin:  r.potential_win !== null ? Number(r.potential_win) : 0,
      profit:        r.profit !== null ? Number(r.profit) : null,
      settledAt:     r.settled_at ?? null,
      updatedAt:     r.updated_at ?? r.timestamp ?? null,
    }));
  } catch (e) {
    logger.warn('[supabase] loadUserBets failed (non-fatal):', e.message);
    return [];
  }
}

// ─── F-13: X/Twitter Sharp-Account Tweets ────────────────────────────────────

/**
 * Fetch the most recent sharp tweets across all tracked accounts.
 * Used for system-prompt pre-load context.
 * @param {number} hours  Look-back window (default 48h)
 * @param {number} limit  Max rows returned (default 30)
 * @returns {Promise<Array>}
 */
export async function getRecentSharpTweets(hours = 48, limit = 30) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(
      Date.now() - hours * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from('x_sharp_tweets')
      .select(
        'id, author_handle, author_tier, author_tags, text, tweet_url, published_at, captured_at',
      )
      .gte('captured_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getRecentSharpTweets failed (non-fatal):', e.message);
    return [];
  }
}

/**
 * Full-text search over x_sharp_tweets.
 * Falls back to ilike if the FTS index is not yet available.
 * @param {string} query
 * @param {{ handle?: string, tier?: string, hours?: number, limit?: number }} opts
 * @returns {Promise<Array>}
 */
export async function searchSharpTweets(query, { handle, tier, hours = 168, limit = 10 } = {}) {
  if (!isAvailable()) return [];
  try {
    const cutoff   = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const ftsQuery = query.trim().split(/\s+/).join(' & ');

    let q = supabase
      .from('x_sharp_tweets')
      .select(
        'id, author_handle, author_tier, author_tags, text, tweet_url, published_at, captured_at',
      )
      .gte('captured_at', cutoff)
      .textSearch('tsv', ftsQuery, { type: 'plain', config: 'english' })
      .order('published_at', { ascending: false })
      .limit(Math.min(limit, 20));

    if (handle) q = q.eq('author_handle', handle);
    if (tier)   q = q.eq('author_tier', tier);

    let { data, error } = await q;

    // Fallback: ilike on text if FTS column absent (pre-migration 013)
    if (error?.message?.includes('column') || error?.code === '42703') {
      const term = `%${query}%`;
      let fb = supabase
        .from('x_sharp_tweets')
        .select(
          'id, author_handle, author_tier, author_tags, text, tweet_url, published_at, captured_at',
        )
        .gte('captured_at', cutoff)
        .ilike('text', term)
        .order('published_at', { ascending: false })
        .limit(Math.min(limit, 20));

      if (handle) fb = fb.eq('author_handle', handle);
      if (tier)   fb = fb.eq('author_tier', tier);

      const { data: fbData, error: fbErr } = await fb;
      if (fbErr || !fbData) return [];
      data  = fbData;
      error = null;
    }

    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] searchSharpTweets failed:', e.message);
    return [];
  }
}

/**
 * Get recent significant player injuries for BETTING agent pre-load.
 * Returns Out/Doubtful/Questionable/IR/PUP players captured within the
 * last N hours.  Used as the `### Recent Injuries` context block.
 * @param {number} hours  — lookback window (default 168 = 7 days)
 * @param {number} limit  — max rows (default 100)
 */
export async function getRecentPlayerInjuries(hours = 168, limit = 100) {
  if (!isAvailable()) return [];
  try {
    const cutoff = new Date(
      Date.now() - hours * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabase
      .from('player_injuries')
      .select(
        'player_name, team_abbr, position, injury_status, ' +
        'injury_type, short_comment, reported_at',
      )
      .in('injury_status', ['Out', 'Doubtful', 'Questionable', 'IR', 'PUP'])
      .gte('captured_at', cutoff)
      .order('reported_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] getRecentPlayerInjuries failed:', e.message);
    return [];
  }
}

/**
 * Get the latest odds snapshot for a specific NFL week.
 * Deduplicates to one row per (game_id, market): most-recent capture wins,
 * with DraftKings preferred over other books for consistency.
 * Returns empty array during offseason / before data is available.
 * @param {number} week    — NFL week number (0 or falsy → returns [])
 * @param {number} season  — NFL season year (default 2026)
 */
export async function getLatestWeekOdds(week, season = 2026) {
  if (!isAvailable() || !week) return [];
  try {
    const { data, error } = await supabase
      .from('game_odds_snapshots')
      .select(
        'game_id, home_team, away_team, commence_time, book, ' +
        'market, home_price, away_price, spread, total, captured_at',
      )
      .eq('season', season)
      .eq('week', week)
      .order('captured_at', { ascending: false })
      .limit(500);
    if (error || !data) return [];

    // Deduplicate: data is already sorted newest-first.
    // First pass: collect DraftKings rows (preferred book).
    // Second pass: fill any remaining gaps with the first available book.
    const seen = new Map();
    for (const row of data) {
      if (row.book === 'draftkings') {
        const key = `${row.game_id}|${row.market}`;
        if (!seen.has(key)) seen.set(key, row);
      }
    }
    for (const row of data) {
      const key = `${row.game_id}|${row.market}`;
      if (!seen.has(key)) seen.set(key, row);
    }
    return [...seen.values()];
  } catch (e) {
    logger.warn('[supabase] getLatestWeekOdds failed:', e.message);
    return [];
  }
}

// F-21: Game-level betting splits from Action Network
// Returns one row per game for the given week — the most recent upserted snapshot.
// Each row: { game_id, home_team, away_team, week,
//             spread_home_bettors, spread_home_money,
//             total_over_bettors,  total_over_money,
//             ml_home_bettors,     ml_home_money,
//             captured_at }
export async function getGameSplitsForWeek(week, season = 2026) {
  if (!isAvailable() || !week) return [];
  try {
    const { data, error } = await supabase
      .from('game_splits')
      .select([
        'game_id', 'home_team', 'away_team', 'week',
        'spread_home_bettors', 'spread_home_money',
        'total_over_bettors',  'total_over_money',
        'ml_home_bettors',     'ml_home_money',
        'captured_at',
      ].join(', '))
      .eq('season', season)
      .eq('week', week)
      .order('captured_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    logger.warn('[supabase] getGameSplitsForWeek failed:', e.message);
    return [];
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the current Supabase session, or null if not signed in.
 * Safe to call before supabase is initialised.
 */
export async function getSession() {
  if (!isAvailable()) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/**
 * Sign in with email + password.
 * @returns {{ session, error }}
 */
export async function signIn(email, password) {
  if (!isAvailable()) return { session: null, error: new Error('Supabase unavailable') };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data?.session ?? null, error: error ?? null };
}

/** Sign out the current user and clear the local session. */
export async function signOut() {
  if (!isAvailable()) return;
  await supabase.auth.signOut();
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 * @param {(session: import('@supabase/supabase-js').Session|null) => void} callback
 */
export function onAuthStateChange(callback) {
  if (!isAvailable()) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  );
  return () => subscription.unsubscribe();
}

// ─── F-AUDIT: Audit Log Reader ────────────────────────────────────────────────

/**
 * Query the audit_log table for recent write events.
 * Requires an authenticated session (service_role or authed RLS policy).
 *
 * @param {object} opts
 * @param {string}  [opts.tableName]  Filter to a specific table name.
 * @param {string}  [opts.actor]      Filter to a specific actor (UUID or 'anon').
 * @param {number}  [opts.limit=50]   Max rows to return.
 * @returns {Promise<Array<{
 *   id: number, ts: string, table_name: string, record_id: string,
 *   action: string, actor: string, patch_digest: string
 * }>>}
 */
export async function queryAuditLog({ tableName, actor, limit = 50 } = {}) {
  if (!isAvailable()) return [];
  try {
    let q = supabase
      .from('audit_log')
      .select('id, ts, table_name, record_id, action, actor, patch_digest')
      .order('ts', { ascending: false })
      .limit(Math.min(limit, 200));

    if (tableName) q = q.eq('table_name', tableName);
    if (actor)     q = q.eq('actor', actor);

    const { data, error } = await q;
    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[supabase] queryAuditLog failed (non-fatal):', e.message);
    return [];
  }
}


