// agents/game-odds-ingest.js
// ─────────────────────────────────────────────────────────────────────────────
// DS-5: Game-level odds ingest agent
//
// Fetches spread / moneyline / total for all upcoming NFL games from
// TheOddsAPI and writes time-series snapshots to `game_odds_snapshots`.
//
// Design:
//   - One run = one captured_at timestamp for the entire batch
//   - Append-only: never update existing rows (line movement via time series)
//   - Prunes snapshots older than SNAPSHOT_TTL_DAYS to control table growth
//   - Dry-run safe: --dry-run flag or DRY_RUN=true skips Supabase writes
//   - Graceful degradation: no ODDS_API_KEY → skip with info log (no crash)
//
// Usage:
//   node agents/game-odds-ingest.js [--dry-run] [--season <year>]
//
// Env vars:
//   ODDS_API_KEY              TheOddsAPI key
//   SUPABASE_URL              Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY Supabase service role JWT
//   DRY_RUN                   "true" to skip writes
//   GAME_ODDS_SEASON          Override season year (default: current year)
//   SNAPSHOT_TTL_DAYS         Days to retain snapshots (default: 90)
//   ODDS_QUOTA_FLOOR          Skip the run when TheOddsAPI credits remaining < this (default: 15)
//
// Single source of truth (2026-09-24): this agent is the ONLY scheduled caller
// of TheOddsAPI game odds. It also derives `line_movements` (previously written
// by the retired agents/odds-ingest.js) by diffing each snapshot bucket against
// the previous one. The toolbox's scripts/sync-live-market-lines.mjs reads
// game_odds_snapshots instead of calling the API.
//   --force   ignore ODDS_QUOTA_FLOOR for this run
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Config ──────────────────────────────────────────────────────────────────

const ODDS_API_KEY  = process.env.ODDS_API_KEY;
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN       = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const _seasonArgIdx = process.argv.indexOf('--season');
const SEASON        = Number(
  (_seasonArgIdx !== -1 ? process.argv[_seasonArgIdx + 1] : null) ||
  process.env.GAME_ODDS_SEASON ||
  new Date().getFullYear()
);
const SNAPSHOT_TTL_DAYS = Number(process.env.SNAPSHOT_TTL_DAYS || 90);
const SPORT_KEY         = 'americanfootball_nfl';
const SPORTSBOOKS       = 'draftkings,fanduel,betmgm,caesars,pointsbet,bookmaker,betonline';
const MARKETS           = 'spreads,h2h,totals';
const MAX_RUNTIME_MS    = 90_000;
const MAX_RETRIES       = 2;
const RETRY_DELAY_MS    = 1_500;
const QUOTA_FLOOR       = Number(process.env.ODDS_QUOTA_FLOOR ?? 15);
const FORCE             = process.argv.includes('--force') || process.env.ODDS_FORCE === 'true';
const MOVEMENT_TTL_DAYS = 7;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function readQuota(res) {
  const rem  = res?.headers?.get?.('x-requests-remaining');
  const used = res?.headers?.get?.('x-requests-used');
  return {
    remaining: rem  == null || rem  === '' ? null : Number(rem),
    used:      used == null || used === '' ? null : Number(used),
  };
}

// GET /v4/sports does not count against the usage quota, but it returns the
// same x-requests-* headers, so it is a free pre-flight quota check.
async function checkQuota() {
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${ODDS_API_KEY}`);
    if (!res.ok) return { remaining: null, used: null, error: `HTTP ${res.status}` };
    return readQuota(res);
  } catch (err) {
    return { remaining: null, used: null, error: err.message };
  }
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 422 || res.status === 404) {
        return { status: 'unavailable', reason: `HTTP ${res.status}`, data: null };
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return { status: 'available', data, quota: readQuota(res) };
    } catch (err) {
      if (attempt === retries) {
        return { status: 'error', reason: err.message, data: null };
      }
      console.warn(`  ↩  Retry ${attempt + 1}/${retries}: ${err.message}`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// ── Normalization ─────────────────────────────────────────────────────────────

// TheOddsAPI team names → our abbreviations (matches games table)
const TEAM_NAME_MAP = {
  'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG',
  'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN', 'Washington Commanders': 'WSH',
};

function normalizeTeam(name) {
  return TEAM_NAME_MAP[name] || name.toUpperCase().replace(/\s+/g, '_');
}

const { weekFromDate, buildGameId } = require('../packages/shared/src/week-utils'); // CJS via createRequire

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseGameOdds(events, capturedAt) {
  const rows = [];

  for (const event of events) {
    const homeTeam = normalizeTeam(event.home_team);
    const awayTeam = normalizeTeam(event.away_team);
    const commenceTime = event.commence_time;
    const gameId = buildGameId(homeTeam, awayTeam, commenceTime, SEASON);
    const week = weekFromDate(commenceTime, SEASON);

    for (const bookmaker of event.bookmakers || []) {
      const book = bookmaker.key;

      for (const market of bookmaker.markets || []) {
        const outcomes = market.outcomes || [];

        if (market.key === 'h2h') {
          // Moneyline: home_price = home outcome, away_price = away outcome
          const homeOut = outcomes.find(o => normalizeTeam(o.name) === homeTeam);
          const awayOut = outcomes.find(o => normalizeTeam(o.name) === awayTeam);
          rows.push({
            game_id: gameId,
            season: SEASON,
            week,
            home_team: homeTeam,
            away_team: awayTeam,
            commence_time: commenceTime,
            book,
            market: 'moneyline',
            home_price: homeOut?.price ?? null,
            away_price: awayOut?.price ?? null,
            spread: null,
            total: null,
            captured_at: capturedAt,
          });
        } else if (market.key === 'spreads') {
          const homeOut = outcomes.find(o => normalizeTeam(o.name) === homeTeam);
          const awayOut = outcomes.find(o => normalizeTeam(o.name) === awayTeam);
          rows.push({
            game_id: gameId,
            season: SEASON,
            week,
            home_team: homeTeam,
            away_team: awayTeam,
            commence_time: commenceTime,
            book,
            market: 'spread',
            home_price: homeOut?.price ?? null,
            away_price: awayOut?.price ?? null,
            spread: homeOut?.point ?? null,
            total: null,
            captured_at: capturedAt,
          });
        } else if (market.key === 'totals') {
          const overOut  = outcomes.find(o => o.name === 'Over');
          const underOut = outcomes.find(o => o.name === 'Under');
          rows.push({
            game_id: gameId,
            season: SEASON,
            week,
            home_team: homeTeam,
            away_team: awayTeam,
            commence_time: commenceTime,
            book,
            market: 'total',
            home_price: overOut?.price  ?? null,
            away_price: underOut?.price ?? null,
            spread: null,
            total: overOut?.point ?? underOut?.point ?? null,
            captured_at: capturedAt,
          });
        }
      }
    }
  }

  return rows;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateRow(row) {
  if (!row.game_id || !row.book || !row.market) return false;
  if (!row.home_team || !row.away_team) return false;
  return true;
}

function validateRows(rows) {
  return rows.filter(validateRow);
}

// ── Supabase ─────────────────────────────────────────────────────────────────

export function truncateToHour(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

export async function writeSnapshots(supabase, rows) {
  // Upsert in chunks of 500 — idempotent on (game_id, book, market, captured_at).
  // captured_at is pre-truncated to the UTC hour so re-runs within the same
  // hour resolve to a no-op update rather than a duplicate insert.
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('game_odds_snapshots')
      .upsert(chunk, { onConflict: 'game_id,book,market,captured_at' });
    if (error) {
      console.error('  ✗ Upsert error:', error.message);
    } else {
      written += chunk.length;
    }
  }
  return written;
}

async function pruneOldSnapshots(supabase) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_DAYS * 86400 * 1000).toISOString();
  const { error, count } = await supabase
    .from('game_odds_snapshots')
    .delete({ count: 'exact' })
    .lt('captured_at', cutoff);
  if (error) console.warn('  ✗ Prune failed:', error.message);
  else if (count > 0) console.log(`  🗑  Pruned ${count} rows older than ${SNAPSHOT_TTL_DAYS}d`);
}

// ── Line movements (replaces agents/odds-ingest.js) ─────────────────────────

/**
 * Pure: diff two snapshot buckets and return `line_movements` rows.
 * Same semantics as the retired odds-ingest agent: spread = home line,
 * total = total line, moneyline = home price. `names` maps game_id →
 * { home, away } full team names so game_key keeps the "Away_Home" format
 * the dashboard (LineMovementTracker / SteamMoveTracker / LineHistoryChart) reads.
 */
export function detectMovements(prevRows, currRows, names, detectedAt) {
  const prev = new Map(prevRows.map(r => [`${r.game_id}|${r.book}|${r.market}`, r]));
  const out = [];
  for (const c of currRows) {
    const p = prev.get(`${c.game_id}|${c.book}|${c.market}`);
    if (!p) continue;
    let from = null;
    let to = null;
    if (c.market === 'spread')         { from = p.spread;     to = c.spread; }
    else if (c.market === 'total')     { from = p.total;      to = c.total; }
    else if (c.market === 'moneyline') { from = p.home_price; to = c.home_price; }
    else continue;
    if (from == null || to == null) continue;
    const f = Number(from);
    const t = Number(to);
    if (!Number.isFinite(f) || !Number.isFinite(t) || f === t) continue;
    const n = names?.get?.(c.game_id) || { home: c.home_team, away: c.away_team };
    out.push({
      detected_at: detectedAt,
      game_key:    `${n.away}_${n.home}`,
      home_team:   n.home,
      away_team:   n.away,
      book:        c.book,
      type:        c.market,
      from_line:   f,
      to_line:     t,
      movement:    Number((t - f).toFixed(2)),
    });
  }
  return out;
}

async function bucketExists(supabase, capturedAt) {
  const { data, error } = await supabase
    .from('game_odds_snapshots')
    .select('id')
    .eq('captured_at', capturedAt)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data || []).length > 0;
}

async function previousCapturedAt(supabase, capturedAt) {
  const { data, error } = await supabase
    .from('game_odds_snapshots')
    .select('captured_at')
    .lt('captured_at', capturedAt)
    .order('captured_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.captured_at ?? null;
}

async function fetchBucketRows(supabase, capturedAt) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('game_odds_snapshots')
      .select('game_id, book, market, spread, total, home_price')
      .eq('captured_at', capturedAt)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function writeMovements(supabase, movements) {
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < movements.length; i += CHUNK) {
    const { error } = await supabase.from('line_movements').insert(movements.slice(i, i + CHUNK));
    if (error) console.error('  ✗ line_movements insert error:', error.message);
    else written += Math.min(CHUNK, movements.length - i);
  }
  return written;
}

async function pruneOldMovements(supabase) {
  const cutoff = new Date(Date.now() - MOVEMENT_TTL_DAYS * 86400 * 1000).toISOString();
  const { error } = await supabase.from('line_movements').delete().lt('detected_at', cutoff);
  if (error) console.warn('  ✗ line_movements prune failed:', error.message);
}

// ── Receipt ───────────────────────────────────────────────────────────────────

async function writeReceipt(data) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = data.captured_at.replace(/[:.]/g, '-');
  const p  = path.join(RECEIPTS_DIR, `game-odds-ingest-${ts}.json`);
  await writeFile(p, JSON.stringify(data, null, 2));
  return p;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime    = Date.now();
  const runStartedAt = new Date().toISOString();
  const capturedAt   = truncateToHour(new Date());

  console.log('🏈 GameOddsIngestAgent starting…');
  console.log(`   season=${SEASON} DRY_RUN=${DRY_RUN} | books=${SPORTSBOOKS} | markets=${MARKETS}`);

  if (!ODDS_API_KEY) {
    console.log('ℹ️  No ODDS_API_KEY — skipping. Set the secret in GitHub repo settings.');
    return;
  }
  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.log('ℹ️  No Supabase credentials — switching to dry-run mode.');
  }

  const effectiveDryRun = DRY_RUN || !SUPABASE_URL || !SUPABASE_KEY;
  const supabase = effectiveDryRun ? null : getSupabase();

  // Free pre-flight quota check — stop cleanly instead of failing once credits run out.
  const quotaBefore = await checkQuota();
  if (quotaBefore.remaining != null) {
    console.log(`📊 TheOddsAPI quota: ${quotaBefore.remaining} remaining (used ${quotaBefore.used}) | floor=${QUOTA_FLOOR}${FORCE ? ' (forced)' : ''}`);
  } else {
    console.log(`📊 TheOddsAPI quota: unknown (${quotaBefore.error || 'no header'}) — continuing`);
  }
  if (!FORCE && quotaBefore.remaining != null && quotaBefore.remaining < QUOTA_FLOOR) {
    console.log(`⏸  ${quotaBefore.remaining} credits < floor ${QUOTA_FLOOR} — skipping this run (use --force / ODDS_QUOTA_FLOOR to override).`);
    const receiptPath = await writeReceipt({
      run_started_at: runStartedAt, captured_at: capturedAt, completed_at: new Date().toISOString(),
      season: SEASON, dry_run: effectiveDryRun, status: 'skipped_quota', quota: quotaBefore,
      quota_floor: QUOTA_FLOOR, events: 0, rows_written: 0,
    });
    console.log(`🧾 Run receipt: ${receiptPath}`);
    return;
  }

  // Build URL — fetch upcoming events with odds
  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT_KEY}/odds` +
    `?regions=us&markets=${MARKETS}&bookmakers=${SPORTSBOOKS}` +
    `&apiKey=${ODDS_API_KEY}&oddsFormat=american`;

  if (Date.now() - startTime > MAX_RUNTIME_MS) {
    console.warn('⏱  Max runtime exceeded before fetch.');
    return;
  }

  console.log('\n📊 Fetching game odds from TheOddsAPI…');
  const result = await fetchWithRetry(url);

  if (result.status !== 'available') {
    console.log(`  ⊘ ${result.status}: ${result.reason}`);
    // Offseason = 404/422 from TheOddsAPI — not an error, expected behavior.
    const receipt = {
      run_started_at: runStartedAt,
      captured_at: capturedAt,
      completed_at: new Date().toISOString(),
      season: SEASON,
      dry_run: effectiveDryRun,
      status: result.status,
      reason: result.reason,
      events: 0,
      rows_written: 0,
    };
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    console.log('✅ Done (no events available — offseason or no upcoming games).');
    return;
  }

  const raw    = result.data;
  if (result.quota?.remaining != null) {
    console.log(`  📊 After fetch: ${result.quota.remaining} credits remaining (used ${result.quota.used})`);
  }
  const parsed = parseGameOdds(raw, capturedAt);
  const valid  = validateRows(parsed);
  const invalid = parsed.length - valid.length;

  console.log(`  📥 ${raw.length} event(s) → ${parsed.length} rows parsed (${invalid} invalid)`);
  if (invalid > 0) console.warn(`  ⚠️  ${invalid} rows failed validation — check team name mapping`);

  // Sample log
  const sample = valid.slice(0, 6);
  for (const r of sample) {
    const spreadStr = r.spread != null ? ` spread=${r.spread}` : '';
    const totalStr  = r.total  != null ? ` total=${r.total}`   : '';
    console.log(`     ${r.away_team}@${r.home_team} | ${r.book} | ${r.market}${spreadStr}${totalStr} | home=${r.home_price} away=${r.away_price}`);
  }
  if (valid.length > 6) console.log(`     … and ${valid.length - 6} more`);

  const receipt = {
    run_started_at: runStartedAt,
    captured_at: capturedAt,
    completed_at: new Date().toISOString(),
    season: SEASON,
    dry_run: effectiveDryRun,
    status: 'available',
    events: raw.length,
    rows_parsed: parsed.length,
    rows_valid: valid.length,
    rows_invalid: invalid,
    rows_written: 0,
    quota: result.quota ?? null,
    movements_written: 0,
  };

  if (effectiveDryRun) {
    console.log('\n📋 DRY RUN — skipping Supabase write. Sample:');
    console.table(valid.slice(0, 8).map(r => ({
      game_id: r.game_id, book: r.book, market: r.market,
      spread: r.spread, total: r.total,
      home_price: r.home_price, away_price: r.away_price,
    })));
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    console.log('✅ Dry run complete.');
    return;
  }

  if (valid.length === 0) {
    console.warn('⚠️  No valid rows to write.');
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    return;
  }

  console.log('\n💾 Writing to Supabase…');
  // A re-run inside the same UTC hour upserts the same bucket; don't re-emit movements for it.
  let rerun = false;
  try { rerun = await bucketExists(supabase, capturedAt); }
  catch (e) { console.warn(`  ⚠️  bucket check failed (${e.message}) — movements skipped this run`); rerun = true; }

  const written = await writeSnapshots(supabase, valid);
  receipt.rows_written = written;
  console.log(`  ✅ Wrote ${written} rows to game_odds_snapshots`);

  // Derive line_movements vs the previous bucket (non-fatal on failure).
  if (rerun) {
    console.log('  ↪  Same-hour re-run — line movements already recorded for this bucket.');
  } else {
    try {
      const prevAt = await previousCapturedAt(supabase, capturedAt);
      if (!prevAt) {
        console.log('  ℹ️  No previous bucket — no movements to compute.');
      } else {
        const prevRows = await fetchBucketRows(supabase, prevAt);
        const names = new Map();
        for (const ev of raw) {
          const h = normalizeTeam(ev.home_team);
          const a = normalizeTeam(ev.away_team);
          names.set(buildGameId(h, a, ev.commence_time, SEASON), { home: ev.home_team, away: ev.away_team });
        }
        const movements = detectMovements(prevRows, valid, names, runStartedAt);
        receipt.movements_prev_bucket = prevAt;
        receipt.movements_written = movements.length ? await writeMovements(supabase, movements) : 0;
        console.log(`  📈 ${movements.length} line movement(s) vs ${prevAt} → ${receipt.movements_written} written to line_movements`);
      }
    } catch (e) {
      console.warn(`  ⚠️  line movement step failed: ${e.message}`);
    }
  }

  await pruneOldSnapshots(supabase);
  await pruneOldMovements(supabase);

  const receiptPath = await writeReceipt(receipt);
  console.log(`🧾 Run receipt: ${receiptPath}`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ GameOddsIngestAgent done in ${elapsed}s`);
}

main().catch(err => { console.error(err); process.exit(1); });
