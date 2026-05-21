// agents/betting-splits-ingest.js
// ─────────────────────────────────────────────────────────────────────────────
// F-21: Action Network betting splits ingest agent
//
// Fetches public-bettor % and public-money % for all current NFL games from
// the Action Network public API and upserts them to `game_splits`.
//
// Design:
//   - One row per game (upsert on game_id) — always the freshest snapshot
//   - Graceful offseason handling: logs info and exits cleanly if no games
//   - Defensive field extraction: tries multiple known AN response shapes
//   - --dump flag: prints raw API response and exits (for schema inspection)
//   - Dry-run safe: --dry-run or DRY_RUN=true skips Supabase writes
//
// Usage:
//   node agents/betting-splits-ingest.js [--dry-run] [--dump] [--season <yr>]
//
// Env vars:
//   SUPABASE_URL              Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY Supabase service role JWT
//   DRY_RUN                   "true" to skip writes
//   SPLITS_SEASON             Override season year (default: current year)
// ─────────────────────────────────────────────────────────────────────────────

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN       = process.argv.includes('--dry-run')
                   || process.env.DRY_RUN === 'true';
const DUMP_MODE     = process.argv.includes('--dump');
const SEASON        = Number(
  process.argv[process.argv.indexOf('--season') + 1]
  || process.env.SPLITS_SEASON
  || new Date().getFullYear()
);

// Action Network public API — no key required
const AN_NFL_URL = 'https://api.actionnetwork.com/web/v1/games'
                 + '?league=nfl&division=nfl'
                 + '&prebuild=true&tournament-type=regular';

// Retry constants
const MAX_RETRIES    = 2;
const RETRY_DELAY_MS = 2_000;
const MAX_RUNTIME_MS = 60_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; NFLDashboard/1.0)',
    'Accept':     'application/json',
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 404 || res.status === 422) {
        return { status: 'unavailable', reason: `HTTP ${res.status}`, data: null };
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return { status: 'ok', data };
    } catch (err) {
      if (attempt === retries) {
        return { status: 'error', reason: err.message, data: null };
      }
      console.warn(`  ↩  Retry ${attempt + 1}/${retries}: ${err.message}`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// ── Team normalization ────────────────────────────────────────────────────────

// Action Network uses standard NFL abbreviations; map the non-standard ones
// to our game_id format (which matches game-odds-ingest.js conventions).
const AN_ABBR_MAP = {
  'WSH': 'WSH', 'WAS': 'WSH',  // Commanders
  'LAR': 'LAR', 'LA':  'LAR',  // Rams
  'JAX': 'JAX', 'JAC': 'JAX',  // Jaguars
  'GBP': 'GB',  'GB':  'GB',   // Packers
  'KCC': 'KC',  'KC':  'KC',   // Chiefs
  'LVR': 'LV',  'LV':  'LV',   // Raiders
  'NOS': 'NO',  'NO':  'NO',   // Saints
  'NEP': 'NE',  'NE':  'NE',   // Patriots
  'SFO': 'SF',  'SF':  'SF',   // 49ers
  'TBB': 'TB',  'TB':  'TB',   // Buccaneers
};

function normalizeTeam(abbr) {
  if (!abbr) return 'UNK';
  const upper = abbr.toUpperCase();
  return AN_ABBR_MAP[upper] || upper;
}

// ── Week calculation (mirrors game-odds-ingest.js) ────────────────────────────

function weekFromDate(dt, season) {
  const d = new Date(dt);
  const sep1 = new Date(season, 8, 1);
  const dayOfWeek = sep1.getDay();
  const daysToThu = (4 - dayOfWeek + 7) % 7;
  const week1Thu = new Date(sep1);
  week1Thu.setDate(sep1.getDate() + daysToThu);
  const week1Start = new Date(week1Thu);
  week1Start.setDate(week1Thu.getDate() - 2);
  const diffDays = Math.floor((d - week1Start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
}

function buildGameId(homeAbbr, awayAbbr, startTime, season) {
  const week = weekFromDate(startTime, season);
  const ww = String(week).padStart(2, '0');
  return `${season}_${ww}_${homeAbbr}_${awayAbbr}`;
}

// ── Splits extraction ─────────────────────────────────────────────────────────
//
// Action Network's API response shape has changed over time. This function
// tries the three known variants so the ingest survives format drift.
//
// If --dump is passed the agent prints the raw game object and exits, making
// it easy to identify which shape is in use at any given time.

function extractPct(value) {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  // AN sometimes returns 0–1 fractions, normalise to 0–100 integers
  return n > 0 && n < 1 ? Math.round(n * 100) : Math.round(n);
}

/**
 * Tries to extract split percentages from an AN game object.
 * Returns an object with keys matching game_splits columns (null where absent).
 */
function extractSplits(game) {
  // Shape A: game.consensus object
  const c = game.consensus || {};

  // Shape B: game.odds[] where book_id 15 = DraftKings consensus row
  const consensusOdds = (game.odds || []).find(
    o => o.book_id === 15 || o.type === 'consensus',
  ) || {};

  // Shape C: flat keys directly on the game object
  const flat = game;

  // Helper that returns first non-null value from a priority list
  const pick = (...vals) => {
    for (const v of vals) {
      if (v != null) return extractPct(v);
    }
    return null;
  };

  return {
    spread_home_bettors: pick(
      c.spread?.home_bettors,
      c.spread?.home_tickets,
      consensusOdds.spread_public,
      flat.spread_home_bettors,
    ),
    spread_home_money: pick(
      c.spread?.home_money,
      c.spread?.home_dollars,
      consensusOdds.spread_money_public,
      flat.spread_home_money,
    ),
    total_over_bettors: pick(
      c.total?.over_bettors,
      c.total?.over_tickets,
      consensusOdds.ou_public,
      flat.total_over_bettors,
    ),
    total_over_money: pick(
      c.total?.over_money,
      c.total?.over_dollars,
      consensusOdds.ou_money_public,
      flat.total_over_money,
    ),
    ml_home_bettors: pick(
      c.moneyline?.home_bettors,
      c.moneyline?.home_tickets,
      c.ml?.home_bettors,
      consensusOdds.ml_public,
      flat.ml_home_bettors,
    ),
    ml_home_money: pick(
      c.moneyline?.home_money,
      c.moneyline?.home_dollars,
      c.ml?.home_money,
      consensusOdds.ml_money_public,
      flat.ml_home_money,
    ),
  };
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseGames(payload, capturedAt) {
  // AN wraps games under a "games" key
  const games = payload.games || payload;
  if (!Array.isArray(games) || games.length === 0) {
    return [];
  }

  const rows = [];

  for (const game of games) {
    try {
      // Extract team abbreviations
      const homeTeam = normalizeTeam(
        game.home_team?.abbr
        || game.teams?.find(t => t.is_home)?.abbr
        || game.home_abbr,
      );
      const awayTeam = normalizeTeam(
        game.away_team?.abbr
        || game.teams?.find(t => !t.is_home)?.abbr
        || game.away_abbr,
      );

      if (homeTeam === 'UNK' || awayTeam === 'UNK') {
        console.warn(`  ⚠  Skipping game ${game.id}: could not identify teams`);
        continue;
      }

      const startTime = game.start_time || game.scheduled || game.commence_time;
      if (!startTime) {
        console.warn(`  ⚠  Skipping game ${game.id}: no start time`);
        continue;
      }

      const week   = weekFromDate(startTime, SEASON);
      const gameId = buildGameId(homeTeam, awayTeam, startTime, SEASON);
      const splits = extractSplits(game);

      const anyData = Object.values(splits).some(v => v != null);
      if (!anyData) {
        // Splits not available yet (common mid-week or offseason)
        console.log(`  ○  ${awayTeam} @ ${homeTeam} — no splits available`);
        continue;
      }

      rows.push({
        game_id:  gameId,
        season:   SEASON,
        week,
        home_team: homeTeam,
        away_team: awayTeam,
        ...splits,
        source:      'actionnetwork',
        captured_at: capturedAt,
      });

      console.log(
        `  ✓  ${awayTeam} @ ${homeTeam} (W${String(week).padStart(2, '0')})` +
        ` | Spread home ${splits.spread_home_bettors ?? '--'}%t / ` +
        `${splits.spread_home_money ?? '--'}%$ | ` +
        `O/U over ${splits.total_over_bettors ?? '--'}%t / ` +
        `${splits.total_over_money ?? '--'}%$`,
      );
    } catch (err) {
      console.warn(`  ⚠  Error parsing game ${game.id}: ${err.message}`);
    }
  }

  return rows;
}

// ── Supabase write ────────────────────────────────────────────────────────────

async function upsertSplits(supabase, rows) {
  const { data, error } = await supabase
    .from('game_splits')
    .upsert(rows, { onConflict: 'game_id' })
    .select('game_id');

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }
  return data?.length ?? 0;
}

// ── Receipt ───────────────────────────────────────────────────────────────────

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts   = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(RECEIPTS_DIR, `splits-ingest-${ts}.json`);
  await writeFile(file, JSON.stringify(receipt, null, 2));
  console.log(`\n📄 Receipt: ${file}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startMs  = Date.now();
  const capturedAt = new Date().toISOString();

  console.log('══════════════════════════════════════════════════');
  console.log('  NFL Betting Splits Ingest — Action Network');
  console.log(`  Season: ${SEASON}  |  DryRun: ${DRY_RUN}  |  Dump: ${DUMP_MODE}`);
  console.log('══════════════════════════════════════════════════');

  // ── Fetch ──
  console.log(`\n→ Fetching: ${AN_NFL_URL}`);
  const { status, reason, data } = await fetchWithRetry(AN_NFL_URL);

  if (status !== 'ok') {
    console.warn(`\n⚠  API unavailable: ${reason}`);
    console.log('No splits ingested (offseason or network error).');
    await writeReceipt({ status: 'skipped', reason, captured_at: capturedAt });
    process.exit(0);
  }

  // ── Dump mode ──
  if (DUMP_MODE) {
    const games = data.games || data;
    if (Array.isArray(games) && games.length > 0) {
      console.log('\n── First game raw object (--dump) ──');
      console.log(JSON.stringify(games[0], null, 2));
    } else {
      console.log('\n── Full response (--dump) ──');
      console.log(JSON.stringify(data, null, 2));
    }
    process.exit(0);
  }

  // ── Check for offseason empty ──
  const games = data.games || data;
  if (!Array.isArray(games) || games.length === 0) {
    console.log('\nℹ  No games returned — likely offseason. Nothing to ingest.');
    await writeReceipt({ status: 'offseason', captured_at: capturedAt, rows: 0 });
    process.exit(0);
  }

  console.log(`\n→ Parsing ${games.length} games…`);
  const rows = parseGames(data, capturedAt);

  if (rows.length === 0) {
    console.log('\nℹ  No splits data available yet (lines may not be posted).');
    await writeReceipt({ status: 'no_splits', captured_at: capturedAt, rows: 0 });
    process.exit(0);
  }

  console.log(`\n→ ${rows.length} games with splits data`);

  // ── Write ──
  if (DRY_RUN) {
    console.log('\n[dry-run] Would upsert:');
    for (const row of rows) {
      console.log(`  ${row.game_id}: ${JSON.stringify(row)}`);
    }
  } else {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('\n✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
      process.exit(1);
    }
    const supabase = getSupabase();
    console.log('\n→ Upserting to game_splits…');
    const written = await upsertSplits(supabase, rows);
    console.log(`\n✓ ${written} rows upserted`);
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const receipt = {
    status:      'ok',
    captured_at: capturedAt,
    season:      SEASON,
    rows:        rows.length,
    dry_run:     DRY_RUN,
    elapsed_s:   Number(elapsed),
  };

  await writeReceipt(receipt);
  console.log(`\n✅ Done in ${elapsed}s`);

  if (Date.now() - startMs > MAX_RUNTIME_MS) {
    console.warn('⚠  Exceeded MAX_RUNTIME_MS — consider splitting the job');
  }
}

main().catch(err => {
  console.error('\n✗ Fatal:', err.message);
  process.exit(1);
});
