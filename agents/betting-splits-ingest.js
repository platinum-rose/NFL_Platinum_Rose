// agents/betting-splits-ingest.js
// ─────────────────────────────────────────────────────────────────────────────
// F-21: Action Network betting splits ingest agent
//
// Fetches public-bettor % and public-money % for all current NFL games from
// the Action Network public API and writes to two tables:
//   game_splits         — upsert on game_id (always the freshest snapshot)
//   game_splits_history — pure append (one row per game per run, never updated)
//
// The history table enables movement analysis: how did ticket%/money% shift
// from Tuesday open through Sunday kickoff? Sharp divergence signals live there.
//
// Design:
//   - One row per game (upsert on game_id) — always the freshest snapshot
//   - Every run appends a new history row regardless of whether splits changed
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

import fs from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRequire } from 'node:module';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const require = createRequire(import.meta.url);

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
const _seasonArgIdx = process.argv.indexOf('--season');
const SEASON        = Number(
  (_seasonArgIdx !== -1 ? process.argv[_seasonArgIdx + 1] : null)
  || process.env.SPLITS_SEASON
  || new Date().getFullYear()
);

// Action Network public API — no key required
const AN_NFL_URL = 'https://api.actionnetwork.com/web/v1/scoreboard/nfl';

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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

const { weekFromDate, buildGameId } = require('../packages/shared/src/week-utils');

// ── Splits extraction ─────────────────────────────────────────────────────────

function extractPct(value) {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n > 0 && n < 1 ? Math.round(n * 100) : Math.round(n);
}

/**
 * Tries to extract split percentages from an AN game object.
 * Checks game.consensus, game.odds, and game.markets[bookId].event.bet_info.
 */
function extractSplits(game) {
  const c = game.consensus || {};

  const consensusOdds = (game.odds || []).find(
    o => o.book_id === 15 || o.type === 'consensus',
  ) || {};

  const flat = game;

  let mSpreadHomeBettors = null, mSpreadHomeMoney = null;
  let mTotalOverBettors = null, mTotalOverMoney = null;
  let mMlHomeBettors = null, mMlHomeMoney = null;

  if (game.markets) {
    for (const [_bookId, bookObj] of Object.entries(game.markets)) {
      const spreads = bookObj?.event?.spread || [];
      const totals = bookObj?.event?.total || [];
      const mls = bookObj?.event?.moneyline || [];

      for (const item of spreads) {
        if (item.bet_info?.tickets?.percent != null) {
          if (item.side === 'home' && mSpreadHomeBettors == null) {
            mSpreadHomeBettors = item.bet_info.tickets.percent;
            mSpreadHomeMoney = item.bet_info.money.percent;
          }
        }
      }
      for (const item of totals) {
        if (item.bet_info?.tickets?.percent != null) {
          if (item.side === 'over' && mTotalOverBettors == null) {
            mTotalOverBettors = item.bet_info.tickets.percent;
            mTotalOverMoney = item.bet_info.money.percent;
          }
        }
      }
      for (const item of mls) {
        if (item.bet_info?.tickets?.percent != null) {
          if (item.side === 'home' && mMlHomeBettors == null) {
            mMlHomeBettors = item.bet_info.tickets.percent;
            mMlHomeMoney = item.bet_info.money.percent;
          }
        }
      }
    }
  }

  const pick = (...vals) => {
    for (const v of vals) {
      if (v != null) return extractPct(v);
    }
    return null;
  };

  return {
    spread_home_bettors: pick(
      mSpreadHomeBettors,
      c.spread?.home_bettors,
      c.spread?.home_tickets,
      consensusOdds.spread_public,
      flat.spread_home_bettors,
    ),
    spread_home_money: pick(
      mSpreadHomeMoney,
      c.spread?.home_money,
      c.spread?.home_dollars,
      consensusOdds.spread_money_public,
      flat.spread_home_money,
    ),
    total_over_bettors: pick(
      mTotalOverBettors,
      c.total?.over_bettors,
      c.total?.over_tickets,
      consensusOdds.ou_public,
      flat.total_over_bettors,
    ),
    total_over_money: pick(
      mTotalOverMoney,
      c.total?.over_money,
      c.total?.over_dollars,
      consensusOdds.ou_money_public,
      flat.total_over_money,
    ),
    ml_home_bettors: pick(
      mMlHomeBettors,
      c.moneyline?.home_bettors,
      c.moneyline?.home_tickets,
      c.ml?.home_bettors,
      consensusOdds.ml_public,
      flat.ml_home_bettors,
    ),
    ml_home_money: pick(
      mMlHomeMoney,
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
  const games = payload.games || payload;
  if (!Array.isArray(games) || games.length === 0) {
    return [];
  }

  const rows = [];

  for (const game of games) {
    try {
      const homeObj = game.home_team || game.teams?.find(t => t.id === game.home_team_id || t.is_home);
      const awayObj = game.away_team || game.teams?.find(t => t.id === game.away_team_id || (!t.is_home && t.id !== game.home_team_id));

      const homeTeam = normalizeTeam(
        homeObj?.abbr
        || homeObj?.abbreviation
        || game.home_abbr,
      );
      const awayTeam = normalizeTeam(
        awayObj?.abbr
        || awayObj?.abbreviation
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

async function writeLocalSplitsCache(rows) {
  const splitsMap = {};

  // Read schedule.json to map team pairs to ESPN game.id
  let schedule = [];
  try {
    const schedPath = path.join(ROOT, 'public', 'schedule.json');
    if (fs.existsSync(schedPath)) {
      schedule = JSON.parse(fs.readFileSync(schedPath, 'utf8'));
    }
  } catch (_e) {
    // fallback
  }

  for (const r of rows) {
    const spreadHomeTix = r.spread_home_bettors ?? 50;
    const spreadHomeCash = r.spread_home_money ?? 50;
    const spreadAwayTix = 100 - spreadHomeTix;
    const spreadAwayCash = 100 - spreadHomeCash;

    const overTix = r.total_over_bettors ?? 50;
    const overCash = r.total_over_money ?? 50;
    const underTix = 100 - overTix;
    const underCash = 100 - overCash;

    const entry = {
      visitor: r.away_team,
      home: r.home_team,
      splits: {
        ats: {
          visitorTicket: spreadAwayTix,
          visitorMoney: spreadAwayCash,
          homeTicket: spreadHomeTix,
          homeMoney: spreadHomeCash,
        },
        total: {
          overTicket: overTix,
          overMoney: overCash,
          underTicket: underTix,
          underMoney: underCash,
        },
      },
    };

    // Index by r.game_id
    splitsMap[r.game_id] = entry;

    // Index by team pair strings
    splitsMap[`${r.away_team}_${r.home_team}`] = entry;
    splitsMap[`${r.away_team}_at_${r.home_team}`] = entry;

    // Match against schedule.json to index by ESPN game.id and game_id
    const schedGame = schedule.find(
      g => (g.visitor === r.away_team && g.home === r.home_team) ||
           (g.visitor === r.home_team && g.home === r.away_team)
    );
    if (schedGame) {
      if (schedGame.id) splitsMap[schedGame.id] = entry;
      if (schedGame.game_id) splitsMap[schedGame.game_id] = entry;
    }
  }

  const pubFile = path.join(ROOT, 'public', 'betting_splits.json');
  await writeFile(pubFile, JSON.stringify(splitsMap, null, 2));
  console.log(`  💾 Updated public/betting_splits.json with ${Object.keys(splitsMap).length} game splits`);

  if (fs.existsSync(path.join(ROOT, 'dist'))) {
    await writeFile(path.join(ROOT, 'dist', 'betting_splits.json'), JSON.stringify(splitsMap, null, 2));
    console.log(`  💾 Updated dist/betting_splits.json with ${Object.keys(splitsMap).length} game splits`);
  }
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

/**
 * Append every snapshot to game_splits_history — pure INSERT, no upsert.
 * Strips updated_at (history rows are immutable) before inserting.
 */
async function insertHistory(supabase, rows) {
  const historyRows = rows.map(({ updated_at: _drop, ...rest }) => rest);
  const { error } = await supabase
    .from('game_splits_history')
    .insert(historyRows);
  if (error) {
    // Non-fatal: log but don't abort — current snapshot write already succeeded
    console.warn(`  ⚠  game_splits_history insert failed: ${error.message}`);
    return 0;
  }
  return historyRows.length;
}

// ── Receipt ───────────────────────────────────────────────────────────────────

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts   = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(RECEIPTS_DIR, `splits-ingest-${ts}.json`);
  await writeFile(file, JSON.stringify(receipt, null, 2));
  console.log(`\n📄 Receipt: ${file}`);
}

async function fetchActionNetworkSplitsPayload() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':     'text/html,application/json',
  };

  try {
    const res = await fetch('https://www.actionnetwork.com/nfl/public-betting', { headers });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        const sb = parsed.props?.pageProps?.scoreboardResponse;
        if (sb && Array.isArray(sb.games) && sb.games.length > 0) {
          console.log(`  ✓ Retrieved Action Network web payload (${sb.games.length} games with markets)`);
          return { status: 'ok', data: sb };
        }
      }
    }
  } catch (err) {
    console.warn(`  ⚠ Action Network web page fetch failed: ${err.message}, falling back to API`);
  }

  return await fetchWithRetry(AN_NFL_URL);
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
  console.log('\n→ Fetching Action Network splits…');
  const { status, reason, data } = await fetchActionNetworkSplitsPayload();

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

  // Write local JSON cache for frontend consumption
  await writeLocalSplitsCache(rows);

  // ── Write ──
  if (DRY_RUN) {
    console.log('\n[dry-run] Would upsert:');
    for (const row of rows) {
      console.log(`  ${row.game_id}: ${JSON.stringify(row)}`);
    }
  } else {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.log('\nℹ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — local betting_splits.json written successfully.');
    } else {
      const supabase = getSupabase();
      console.log('\n→ Upserting to game_splits…');
      const written = await upsertSplits(supabase, rows);
      console.log(`  ✓ ${written} rows upserted to game_splits`);

      console.log('→ Appending to game_splits_history…');
      const historyWritten = await insertHistory(supabase, rows);
      console.log(`  ✓ ${historyWritten} rows inserted into game_splits_history`);
    }
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const receipt = {
    status:          'ok',
    captured_at:     capturedAt,
    season:          SEASON,
    rows:            rows.length,
    dry_run:         DRY_RUN,
    history_written: DRY_RUN ? 0 : rows.length,
    elapsed_s:       Number(elapsed),
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
