// agents/futures-odds-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// FuturesOddsIngestAgent — polls TheOddsAPI futures/outrights markets,
// writes snapshots to Supabase futures_odds_snapshots table.
//
// Runtime: Node.js ESM (run via GitHub Actions or: node agents/futures-odds-ingest.js)
// Env vars required:
//   SUPABASE_URL              — https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role JWT (bypasses RLS for writes)
//   ODDS_API_KEY              — TheOddsAPI key
//
// ⚠️  RATE NOTE: TheOddsAPI futures/outrights cost 2× requests each.
//    3 markets × 2 = 6 requests per run. At 1×/day = ~186 req/month (offseason).
//    Adjust or disable cron during regular season when weekly lines take priority.
//
// Design principles (same as odds-ingest.js):
//   - maxRetries, maxRunTimeMs
//   - validate before write
//   - structured logs
//   - dry_run mode
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const MAX_RETRIES = 3;
const MAX_RUNTIME_MS = 90_000; // 90s — more endpoints than regular agent
const SNAPSHOT_TTL_DAYS = 30; // Futures move slowly; keep 30 days of history

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const ARG_DRY_RUN = process.argv.includes('--dry-run');
const ARG_SEASON = Number(getArgValue('--season') || new Date().getUTCFullYear());
const DRY_RUN = ARG_DRY_RUN || process.env.DRY_RUN === 'true';

// ── TheOddsAPI futures sport keys → our market_type labels ───────────────────
// Each entry costs 2 requests from the API quota.
const FUTURES_MARKETS = [
  {
    sportKey: 'americanfootball_nfl_super_bowl_winner',
    marketType: 'superbowl',
    label: 'Super Bowl Winner',
  },
  {
    sportKey: 'americanfootball_nfl_championship_winner',
    marketType: 'conference',
    label: 'Conference Winner',
  },
  {
    sportKey: 'americanfootball_nfl_division_winner',
    marketType: 'division',
    label: 'Division Winner',
  },
  {
    sportKey: 'americanfootball_nfl_regular_season_mvp',
    marketType: 'award_mvp',
    label: 'Most Valuable Player',
  },
  {
    sportKey: 'americanfootball_nfl_offensive_player_of_the_year',
    marketType: 'award_offensive_player_of_year',
    label: 'Offensive Player of the Year',
  },
  {
    sportKey: 'americanfootball_nfl_defensive_player_of_the_year',
    marketType: 'award_defensive_player_of_year',
    label: 'Defensive Player of the Year',
  },
  {
    sportKey: 'americanfootball_nfl_offensive_rookie_of_the_year',
    marketType: 'award_offensive_rookie_of_year',
    label: 'Offensive Rookie of the Year',
  },
  {
    sportKey: 'americanfootball_nfl_defensive_rookie_of_the_year',
    marketType: 'award_defensive_rookie_of_year',
    label: 'Defensive Rookie of the Year',
  },
  {
    sportKey: 'americanfootball_nfl_comeback_player_of_the_year',
    marketType: 'award_comeback_player_of_year',
    label: 'Comeback Player of the Year',
  },
  {
    sportKey: 'americanfootball_nfl_coach_of_the_year',
    marketType: 'award_coach_of_year',
    label: 'Coach of the Year',
  },
];

const SPORTSBOOKS = 'draftkings,fanduel,betmgm,caesars,betonline,bookmaker';

// ── Supabase client ───────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 422 || res.status === 404) {
        return {
          status: 'unavailable',
          reason: `HTTP ${res.status}`,
          data: [],
        };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return {
        status: 'available',
        reason: null,
        data: await res.json(),
      };
    } catch (err) {
      if (attempt === retries) {
        return {
          status: 'error',
          reason: err.message,
          data: [],
        };
      }
      const delay = attempt * 2000;
      console.log(`  Retry ${attempt}/${retries} in ${delay}ms — ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── Parse outrights response → flat rows ─────────────────────────────────────
// TheOddsAPI outrights response is an array of "events" — typically one event
// per market (e.g. "Super Bowl Winner"). Each event has bookmakers with
// market.key === 'outrights', and outcomes where each outcome.name = team name.

function resolveMarketType(baseType, eventTitle = '') {
  const title = eventTitle.toLowerCase();

  if (baseType === 'conference') {
    if (title.includes('afc')) return 'conference_afc';
    if (title.includes('nfc')) return 'conference_nfc';
  }

  if (baseType === 'division') {
    const m = title.match(/(afc|nfc)\s+(east|west|north|south)/);
    if (m) return `division_${m[1]}_${m[2]}`;
  }

  return baseType;
}

function parseOutrights(rawEvents, marketType, season, capturedAt) {
  const rows = [];

  for (const event of rawEvents) {
    const resolvedMarketType = resolveMarketType(
      marketType,
      event?.description || event?.title || ''
    );

    for (const book of (event.bookmakers || [])) {
      const outrightMarket = (book.markets || []).find(m => m.key === 'outrights');
      if (!outrightMarket) continue;

      for (const outcome of (outrightMarket.outcomes || [])) {
        const odds = outcome.price;
        if (!odds || isNaN(odds)) continue;

        // Compute implied probability (handle vig)
        let impliedProb;
        if (odds >= 100)  impliedProb = 100 / (odds + 100);
        else              impliedProb = Math.abs(odds) / (Math.abs(odds) + 100);

        rows.push({
          snapshot_time: capturedAt,
          market_type: resolvedMarketType,
          team:          outcome.name,
          book:          book.key,
          odds:          Math.round(odds),
          implied_prob:  parseFloat(impliedProb.toFixed(4)),
          selection: outcome.name,
          price: Math.round(odds),
          captured_at: capturedAt,
          season,
        });
      }
    }
  }

  return rows;
}

// ── Validate rows ─────────────────────────────────────────────────────────────

function validateRows(rows) {
  return rows.filter(r =>
    r.market_type && typeof r.market_type === 'string' &&
    r.team        && typeof r.team === 'string' &&
    r.book        && typeof r.book === 'string' &&
    typeof r.odds === 'number' && !isNaN(r.odds) &&
    typeof r.implied_prob === 'number' && r.implied_prob >= 0 && r.implied_prob <= 1
  );
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `futures-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return filePath;
}

// ── Write to Supabase ─────────────────────────────────────────────────────────

async function hasEnhancedFuturesSchema(supabase) {
  const { error } = await supabase
    .from('futures_odds_snapshots')
    .select('selection')
    .limit(1);

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('column') && msg.includes('selection')) {
      return false;
    }
  }

  return true;
}

async function writeSnapshots(supabase, rows, useEnhancedColumns) {
  if (rows.length === 0) return 0;

  // Insert in batches of 200
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(row => {
      if (useEnhancedColumns) return row;

      return {
        snapshot_time: row.snapshot_time,
        market_type: row.market_type,
        team: row.team,
        book: row.book,
        odds: row.odds,
        implied_prob: row.implied_prob,
      };
    });

    const { error } = await supabase.from('futures_odds_snapshots').insert(batch);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    written += batch.length;
  }
  return written;
}

// ── Prune old snapshots ───────────────────────────────────────────────────────

async function pruneOldSnapshots(supabase) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('futures_odds_snapshots')
    .delete()
    .lt('snapshot_time', cutoff);

  if (error) console.warn('  ⚠️  Prune failed:', error.message);
  else if (count > 0) console.log(`  🗑  Pruned ${count} rows older than ${SNAPSHOT_TTL_DAYS}d`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const runStartedAt = new Date().toISOString();
  const capturedAt = new Date().toISOString();
  console.log('🏈 FuturesOddsIngestAgent starting…');
  console.log(
    `   season=${ARG_SEASON} DRY_RUN=${DRY_RUN} | markets=${FUTURES_MARKETS.length}`
  );

  // Validate env — degrade gracefully so GHA runs don't fail-spam
  if (!ODDS_API_KEY) {
    console.log('ℹ️  No ODDS_API_KEY — skipping. Set the secret in GitHub repo settings.');
    return;
  }
  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.log('ℹ️  No Supabase credentials — switching to dry-run mode.');
    // Fall through as dry run so we still validate the API fetch works
  }

  const effectiveDryRun = DRY_RUN || !SUPABASE_URL || !SUPABASE_KEY;
  const supabase = effectiveDryRun ? null : getSupabase();
  const allRows = [];
  let apiCalls = 0;
  const availability = [];

  // Fetch each futures market
  for (const market of FUTURES_MARKETS) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      console.warn(`⏱  Max runtime reached, skipping remaining markets`);
      break;
    }

    console.log(`\n📊 [${market.marketType}] ${market.label}`);
    const url = `https://api.the-odds-api.com/v4/sports/${market.sportKey}/odds` +
      `?regions=us&markets=outrights&bookmakers=${SPORTSBOOKS}` +
      `&apiKey=${ODDS_API_KEY}&oddsFormat=american`;

    apiCalls++;
    const result = await fetchWithRetry(url);
    if (result.status !== 'available') {
      const reason = result.reason || 'Unknown';
      availability.push({
        market: market.marketType,
        label: market.label,
        sportKey: market.sportKey,
        status: result.status,
        reason,
        events: 0,
        rows: 0,
      });
      console.log(`  ⏭  ${result.status}: ${reason}`);
      continue;
    }

    const raw = result.data;

    const parsed = parseOutrights(raw, market.marketType, ARG_SEASON, capturedAt);
    const valid = validateRows(parsed);
    const invalid = parsed.length - valid.length;

    availability.push({
      market: market.marketType,
      label: market.label,
      sportKey: market.sportKey,
      status: 'available',
      reason: null,
      events: raw.length,
      rows: valid.length,
    });

    console.log(`  📥 ${raw.length} event(s), ${valid.length} rows (${invalid} invalid)`);
    if (invalid > 0) console.warn(`  ⚠️  ${invalid} rows failed validation`);

    // Sample log
    const sample = valid.slice(0, 3);
    for (const r of sample) {
      console.log(`     ${r.team} | ${r.book} | ${r.odds > 0 ? '+' : ''}${r.odds} | ${(r.implied_prob * 100).toFixed(1)}%`);
    }
    if (valid.length > 3) console.log(`     … and ${valid.length - 3} more`);

    allRows.push(...valid);
    // Polite delay between API calls
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📋 Total rows collected: ${allRows.length} (${apiCalls} API calls)`);

  const receipt = {
    run_started_at: runStartedAt,
    captured_at: capturedAt,
    completed_at: new Date().toISOString(),
    season: ARG_SEASON,
    dry_run: effectiveDryRun,
    api_calls: apiCalls,
    total_rows: allRows.length,
    available_markets: availability.filter(x => x.status === 'available').length,
    unavailable_markets: availability.filter(x => x.status !== 'available').length,
    markets: availability,
  };

  if (effectiveDryRun) {
    console.log('🔍 DRY RUN — skipping Supabase write. Sample output:');
    console.table(allRows.slice(0, 10));
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    console.log('✅ Dry run complete.');
    return;
  }

  if (allRows.length === 0) {
    console.warn('⚠️  No rows to write — all markets unavailable?');
    return;
  }

  // Write to Supabase
  console.log('\n💾 Writing to Supabase…');
  const hasEnhancedSchema = await hasEnhancedFuturesSchema(supabase);
  if (!hasEnhancedSchema) {
    console.log('  ℹ️  Enhanced DS-3 columns not present yet; writing legacy-compatible rows only.');
  }

  const written = await writeSnapshots(supabase, allRows, hasEnhancedSchema);
  console.log(`  ✅ Wrote ${written} rows to futures_odds_snapshots`);

  // Prune old data
  await pruneOldSnapshots(supabase);

  const receiptPath = await writeReceipt(receipt);
  console.log(`🧾 Run receipt: ${receiptPath}`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ FuturesOddsIngestAgent done in ${elapsed}s`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
