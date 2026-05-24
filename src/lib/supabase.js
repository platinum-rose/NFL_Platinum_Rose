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

/**
 * Get the most recent odds snapshot written by OddsIngestAgent.
 * Returns { games: ProcessedGame[], fetchedAt: string } or null.
 */
export async function getLatestOddsSnapshot() {
  if (!isAvailable()) return null;
  try {
    const { data, error } = await withQueryTimeout(
      supabase
        .from('odds_snapshots')
        .select('games, fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()
    );

    if (error || !data) return null;
    return { games: data.games || [], fetchedAt: data.fetched_at };
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


