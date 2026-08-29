// agents/metabet-futures-ingest.js
// ═════════════════════════════════════════════════════════════════════════════
// MetabetFuturesIngestAgent — polls the public Metabet/AreYouWatchingThis odds
// API (the same feed that powers VSiN's embedded NFL futures widget at
// vsin.com/nfl/odds/futures/) and writes team-outright futures snapshots to the
// same futures_odds_snapshots table agents/futures-odds-ingest.js and
// scripts/ingest-beo-screenshots.js already write to.
//
// Origin story (2026-08-29, see TASK_BOARD.md): agents/vegas-web-odds-ingest.js
// (uncommitted prototype) pointed at a dead URL (data.vsin.com/nfl/futures/,
// 301s to /error/) and never returned a row. Tracing VSiN's real futures page
// (vsin.com/nfl/odds/futures/) found it's powered by a Metabet embed
// (go.metabet.io/js/global.js?siteID=vsin), whose "futures board" widget calls
// this JSON endpoint client-side. The apiKey below is the SAME one embedded in
// VSiN's own public JS — not a credential we were issued, just the unauthenticated
// key their public widget uses. This is an undocumented endpoint, not a
// contracted API: it can change shape or get rate-limited without notice,
// same fragility class as any scrape.
//
// Runtime: Node.js ESM (run via GitHub Actions or: node agents/metabet-futures-ingest.js)
// Env vars required:
//   SUPABASE_URL              — https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role JWT (bypasses RLS for writes)
// No API key needed — the Metabet endpoint is public/unauthenticated.
//
// SCOPE (v2, 2026-08-30): 22 markets ingested — superbowl, conference (AFC/NFC),
//    all 8 divisions, best/worst regular-season record, 7 player awards
//    (MVP/OPOY/DPOY/OROY/DROY/CPOY/Super Bowl MVP) via the American-odds
//    `price` field (multiway pools), PLUS regular-season win totals
//    (NFL_SEASON_WINS) and make-the-playoffs (NFL_MAKE_PLAYOFFS) via the
//    decimal price1/price2 pair (see TWO_SIDED_MARKETS + decimalToAmerican()).
//    Still out of scope: stat-race markets (passing/rushing/receiving leaders,
//    sacks, INTs) and novelty props (17-0/0-17, draft #1 pick, most/fewest
//    points) — logged per-run as "unmapped_v1" in the receipt, not silently
//    dropped, and not currently needed by the synthesis validator's
//    ODDS_SIGNAL_MARKETS set. Extend MARKET_TYPE_MAP to add them if wanted.
//
// Coverage note: this feed's books are regulated US sportsbooks (DraftKings,
// FanDuel, BetMGM, ESPN Bet, Fanatics, Caesars/William Hill, Bet365,
// Sportingbet, Sports Interaction, BetRivers state skins, Underdog, Unibet) plus
// a CONSENSUS line and Kalshi. It does NOT cover BetOnline/BetUS/Bookmaker
// (offshore books never appear in a legal-market aggregator) — per
// src/lib/executionVenues.js those three are 3 of Andy's 6 placeable venues, so
// this feed does not replace manual BEO/BKR/BetUS capture as an execution-price
// source. It DOES give a real placeable price for 2 of 6 (betmgm via provider
// "MGM", caesars via provider "WILLIAM_HILL") and strong market-context/
// fair-value depth for the rest. Book normalization below routes provider codes
// through src/lib/executionVenues.js's canonical keys/aliases so downstream
// placeable-book filtering (BETTABLE_BOOKS in portfolio-dossier.js) behaves
// exactly as it already does for every other source — nothing here silently
// becomes "placeable" that isn't in that registry.
// ══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { normalizeTeam } from '../src/lib/teams.js';
import { canonicalSportsbookKey } from '../src/lib/executionVenues.js';

const MAX_RUNTIME_MS = 60_000;
const SNAPSHOT_TTL_DAYS = 30; // same retention as futures-odds-ingest.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// The same public apiKey embedded in https://go.metabet.io/js/global.js?siteID=vsin
// (VSiN's own widget JS, fetched and confirmed live 2026-08-29).
const METABET_API_KEY = '219f64094f67ed78f035f5f7a08840fc';
const METABET_BASE = 'https://metabet.static.api.areyouwatchingthis.com';
const METABET_URL = `${METABET_BASE}/api/sideodds.json?location=NJ&leagueCode=FBP&apiKey=${METABET_API_KEY}&language=`;

// Metabet `type` -> our market_type taxonomy, for markets that carry a
// single American-odds `price` field per outcome (multiway pools: outright
// winner, division/conference, best/worst record, player awards).
const MARKET_TYPE_MAP = {
  NFL_WINNER: 'superbowl',
  NFL_WINNER_AFC: 'conference_afc',
  NFL_WINNER_NFC: 'conference_nfc',
  NFL_WINNER_AFC_NORTH: 'division_afc_north',
  NFL_WINNER_AFC_EAST: 'division_afc_east',
  NFL_WINNER_AFC_WEST: 'division_afc_west',
  NFL_WINNER_AFC_SOUTH: 'division_afc_south',
  NFL_WINNER_NFC_NORTH: 'division_nfc_north',
  NFL_WINNER_NFC_EAST: 'division_nfc_east',
  NFL_WINNER_NFC_WEST: 'division_nfc_west',
  NFL_WINNER_NFC_SOUTH: 'division_nfc_south',
  NFL_BEST_RECORD: 'most_wins',
  NFL_WORST_RECORD: 'least_wins',
  NFL_MVP: 'award_mvp',
  NFL_OFFENSIVE_PLAYER_OF_THE_YEAR: 'award_offensive_player_of_year',
  NFL_DEFENSIVE_PLAYER_OF_THE_YEAR: 'award_defensive_player_of_year',
  NFL_OFFENSIVE_ROOKIE_OF_THE_YEAR: 'award_offensive_rookie_of_year',
  NFL_DEFENSIVE_ROOKIE_OF_THE_YEAR: 'award_defensive_rookie_of_year',
  NFL_COMEBACK_PLAYER_OF_THE_YEAR: 'award_comeback_player_of_year',
  NFL_MVP_SUPER_BOWL: 'award_super_bowl_mvp',
};

// Markets keyed by player (playerID) rather than team (teamID).
const PLAYER_KEYED_TYPES = new Set([
  'NFL_MVP',
  'NFL_OFFENSIVE_PLAYER_OF_THE_YEAR',
  'NFL_DEFENSIVE_PLAYER_OF_THE_YEAR',
  'NFL_OFFENSIVE_ROOKIE_OF_THE_YEAR',
  'NFL_DEFENSIVE_ROOKIE_OF_THE_YEAR',
  'NFL_COMEBACK_PLAYER_OF_THE_YEAR',
  'NFL_MVP_SUPER_BOWL',
]);

// Two-sided prop markets: win totals (Over/Under a line) and make-the-playoffs
// (Yes/No). These encode odds as a DECIMAL price1 (first side)/price2 (second
// side) pair — a different format from the American `price` used by the
// multiway markets above. Verified live 2026-08-30 by cross-checking a known
// bad team's make-playoffs price1 (long decimal odds ~ low implied prob) and a
// known good team's (short decimal odds ~ high implied prob) — price1 = the
// FIRST-listed side (Over for wins, Yes for playoffs), price2 = the second
// (Under / No). Each row here produces TWO output rows (one per side), team-
// labeled "<Team> Over <line>"/"<Team> Under <line>" or "<Team> Yes"/"<Team> No"
// to match the exact label format agents/portfolio-dossier.js's
// parseWinSideLabel()/parsePlayoffSideLabel() already expect from TheOddsAPI
// and manual BEO/BKR imports — no dossier-side changes needed.
const TWO_SIDED_MARKETS = {
  NFL_SEASON_WINS: {
    marketType: 'wins',
    needsValue: true,
    sides: [
      { priceKey: 'price1', label: 'Over' },
      { priceKey: 'price2', label: 'Under' },
    ],
  },
  NFL_MAKE_PLAYOFFS: {
    marketType: 'playoffs',
    needsValue: false,
    sides: [
      { priceKey: 'price1', label: 'Yes' },
      { priceKey: 'price2', label: 'No' },
    ],
  },
};

function normalizeBookKey(providerCode) {
  const raw = String(providerCode || '').trim().toLowerCase();
  // Route through the canonical execution-venue registry first (mgm ->
  // betmgm, william_hill -> caesars, etc.) so placeable-book filtering
  // downstream is never silently wrong.
  const canonical = canonicalSportsbookKey(raw.replace(/_/g, ''));
  if (canonical) return canonical;
  const canonicalUnderscore = canonicalSportsbookKey(raw);
  if (canonicalUnderscore) return canonicalUnderscore;
  // Not in the placeable registry (draftkings/fanduel/kalshi are recognized
  // elsewhere as context-only/prediction-market; everything else — espnbet,
  // fanatics, unibet, sportingbet, sports_interaction, bet_365, bet_rivers_*,
  // sugar_house_nj, underdog, consensus — passes through as a plain book key
  // for fair-value context, same as TheOddsAPI books that aren't placeable).
  return raw;
}

// Decimal odds (payout multiplier, e.g. 1.9523809) -> American odds. Used
// for both the two-sided markets (win totals, playoffs) and the multiway
// markets (superbowl, conference, division, wins props, awards) — every
// `price`/`price1`/`price2` field Metabet returns is decimal, never
// American, regardless of market shape.
function decimalToAmerican(decimal) {
  if (decimal == null || isNaN(decimal) || decimal <= 1) return null;
  return decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));
}

async function fetchMetabetFutures() {
  const res = await fetch(METABET_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFLDashboardFuturesIngest/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from Metabet API`);
  return res.json();
}

function parseMetabetResults(data, season, capturedAt) {
  const teamsByID = new Map((data.teams || []).map(t => [t.teamID, t]));
  const playersByID = new Map((data.players || []).map(p => [p.playerID, p]));
  const rows = [];
  const marketSummary = [];

  for (const result of data.results || []) {
    const metabetType = result.type;
    const marketType = MARKET_TYPE_MAP[metabetType];
    const twoSided = TWO_SIDED_MARKETS[metabetType];

    if (twoSided) {
      let kept = 0, skipped = 0;
      for (const so of result.sideOdds || []) {
        // Only ingest the clean paired form (both sides present, plus the
        // line for win totals) — a small minority of rows arrive as a lone
        // unpaired `price` for this market type (different, ambiguous
        // encoding) and are skipped rather than guessed at.
        const hasPair = so[twoSided.sides[0].priceKey] != null && so[twoSided.sides[1].priceKey] != null;
        const hasValue = !twoSided.needsValue || (so.value != null && !isNaN(so.value));
        if (!hasPair || !hasValue) { skipped++; continue; }

        const team = teamsByID.get(so.teamID);
        if (!team) { skipped++; continue; }
        const baseLabel = normalizeTeam(`${team.city} ${team.name}`) || `${team.city} ${team.name}`;
        const book = normalizeBookKey(so.provider);

        for (const side of twoSided.sides) {
          const decimal = so[side.priceKey];
          const odds = decimalToAmerican(decimal);
          if (odds == null) continue;
          const impliedProb = 1 / decimal;
          const teamLabel = twoSided.needsValue
            ? `${baseLabel} ${side.label} ${so.value}`
            : `${baseLabel} ${side.label}`;

          rows.push({
            snapshot_time: capturedAt,
            market_type: twoSided.marketType,
            team: teamLabel,
            selection: teamLabel,
            book,
            odds,
            price: odds,
            implied_prob: parseFloat(impliedProb.toFixed(4)),
            // Deliberately NOT setting a top-level `line` field: the team
            // label already encodes "<Team> Over/Under <line>" and
            // agents/portfolio-dossier.js's canonicalizeSnapshots() only
            // triggers its wins Over/Under merge (parseWinSideLabel) when
            // r.line is null — an explicit line here would skip that merge
            // and break downstream parsing. Same convention TheOddsAPI's
            // parseOutrights() in futures-odds-ingest.js already follows.
            captured_at: capturedAt,
            season,
          });
        }
        kept++;
      }
      marketSummary.push({ metabetType, title: result.title, market_type: twoSided.marketType, status: 'ingested', rows: kept, skipped });
      continue;
    }

    if (!marketType) {
      marketSummary.push({ metabetType, title: result.title, market_type: null, status: 'unmapped_v1', rows: 0 });
      continue;
    }

    const isPlayerKeyed = PLAYER_KEYED_TYPES.has(metabetType);
    let kept = 0, skipped = 0;

    for (const so of result.sideOdds || []) {
      // The `price` field here is DECIMAL odds (payout multiplier), same as
      // the price1/price2 fields on two-sided markets — NOT American odds
      // despite the field's plain name. Verified against live data: every
      // provider (FanDuel, DraftKings, MGM, bet365, Consensus, etc.) returns
      // e.g. price: 6 for the Rams' Super Bowl odds, which is decimal 6.0 ->
      // American +500, matching BookMaker (+495) and BetOnline (+550)
      // almost exactly. Treating that `6` as literal American odds (the
      // original v1 bug here) corrupted every multiway row — 14,467 of
      // 17,149 rows (84%) from the 2026-08-29 live run were wrong for this
      // reason and were purged and re-ingested after this fix.
      // Kalshi rows on these same markets use price1/price2 instead of a
      // bare `price` and are skipped here (Kalshi is a prediction-market
      // venue, handled separately per src/lib/executionVenues.js, not
      // folded into sportsbook pricing).
      if (so.price == null || isNaN(so.price)) { skipped++; continue; }

      let teamLabel;
      if (isPlayerKeyed) {
        const player = playersByID.get(so.playerID);
        if (!player) { skipped++; continue; }
        teamLabel = `${player.firstName} ${player.lastName}`.trim();
      } else {
        const team = teamsByID.get(so.teamID);
        if (!team) { skipped++; continue; }
        teamLabel = normalizeTeam(`${team.city} ${team.name}`) || `${team.city} ${team.name}`;
      }

      const book = normalizeBookKey(so.provider);
      const odds = decimalToAmerican(so.price);
      if (odds == null) { skipped++; continue; }
      const impliedProb = 1 / so.price;

      rows.push({
        snapshot_time: capturedAt,
        market_type: marketType,
        team: teamLabel,
        selection: teamLabel,
        book,
        odds,
        price: odds,
        implied_prob: parseFloat(impliedProb.toFixed(4)),
        captured_at: capturedAt,
        season,
      });
      kept++;
    }

    marketSummary.push({ metabetType, title: result.title, market_type: marketType, status: 'ingested', rows: kept, skipped });
  }

  return { rows, marketSummary };
}

function validateRows(rows) {
  return rows.filter(r =>
    r.market_type && typeof r.market_type === 'string' &&
    r.team && typeof r.team === 'string' &&
    r.book && typeof r.book === 'string' &&
    typeof r.odds === 'number' && !isNaN(r.odds) &&
    typeof r.implied_prob === 'number' && r.implied_prob >= 0 && r.implied_prob <= 1
  );
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function hasEnhancedFuturesSchema(supabase) {
  const { error } = await supabase.from('futures_odds_snapshots').select('selection').limit(1);
  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('column') && msg.includes('selection')) return false;
  }
  return true;
}

export function truncateToHour(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

export async function writeSnapshots(supabase, rows, useEnhancedColumns) {
  if (rows.length === 0) return 0;
  // Same upsert conflict key as futures-odds-ingest.js and
  // ingest-beo-screenshots.js: (market_type, team, book, snapshot_time) via
  // migration 022's uq_futures_odds_snapshot constraint.
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
    const { error } = await supabase
      .from('futures_odds_snapshots')
      .upsert(batch, { onConflict: 'market_type,team,book,snapshot_time' });
    if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    written += batch.length;
  }
  return written;
}

async function pruneOldSnapshots(supabase) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('futures_odds_snapshots')
    .delete()
    .lt('snapshot_time', cutoff);
  if (error) console.warn('  ⚠️  Prune failed:', error.message);
  else if (count > 0) console.log(`  🗑  Pruned ${count} rows older than ${SNAPSHOT_TTL_DAYS}d`);
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `metabet-futures-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return filePath;
}

async function main() {
  const startTime = Date.now();
  const runStartedAt = new Date().toISOString();
  const capturedAt = truncateToHour(new Date());
  console.log('🎯 MetabetFuturesIngestAgent starting…');
  console.log(`   season=${ARG_SEASON} DRY_RUN=${DRY_RUN}`);

  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_KEY)) {
    console.log('ℹ️  No Supabase credentials — switching to dry-run mode.');
  }
  const effectiveDryRun = DRY_RUN || !SUPABASE_URL || !SUPABASE_KEY;

  console.log('\n📡 Fetching Metabet NFL futures board…');
  const data = await fetchMetabetFutures();
  console.log(`  📥 ${(data.results || []).length} market(s), ${(data.teams || []).length} teams, ${(data.players || []).length} players`);

  if (Date.now() - startTime > MAX_RUNTIME_MS) {
    console.warn('⏱  Max runtime reached during fetch/parse');
  }

  const { rows: parsed, marketSummary } = parseMetabetResults(data, ARG_SEASON, capturedAt);
  const valid = validateRows(parsed);
  const invalid = parsed.length - valid.length;

  console.log(`\n📋 Parsed ${parsed.length} rows (${invalid} invalid) across ${marketSummary.filter(m => m.status === 'ingested').length} ingested markets`);
  const unmapped = marketSummary.filter(m => m.status === 'unmapped_v1');
  if (unmapped.length > 0) {
    console.log(`   Unmapped (not yet in taxonomy): ${unmapped.map(m => m.title).join(', ')}`);
  }

  const sample = valid.slice(0, 5);
  for (const r of sample) {
    console.log(`     ${r.market_type} | ${r.team} | ${r.book} | ${r.odds > 0 ? '+' : ''}${r.odds} | ${(r.implied_prob * 100).toFixed(1)}%`);
  }

  const receipt = {
    run_started_at: runStartedAt,
    captured_at: capturedAt,
    completed_at: new Date().toISOString(),
    season: ARG_SEASON,
    dry_run: effectiveDryRun,
    source: 'metabet_static_api_areyouwatchingthis',
    total_rows: valid.length,
    markets: marketSummary,
    sample_rows: sample,
  };

  if (effectiveDryRun) {
    console.log('\n🔍 DRY RUN — skipping Supabase write.');
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    console.log('✅ Dry run complete.');
    return;
  }

  if (valid.length === 0) {
    console.warn('⚠️  No rows to write.');
    const receiptPath = await writeReceipt(receipt);
    console.log(`🧾 Run receipt: ${receiptPath}`);
    return;
  }

  console.log('\n💾 Writing to Supabase…');
  const supabase = getSupabase();
  const hasEnhancedSchema = await hasEnhancedFuturesSchema(supabase);
  if (!hasEnhancedSchema) {
    console.log('  ℹ️  Enhanced DS-3 columns not present yet; writing legacy-compatible rows only.');
  }
  const written = await writeSnapshots(supabase, valid, hasEnhancedSchema);
  console.log(`  ✅ Wrote ${written} rows to futures_odds_snapshots`);

  await pruneOldSnapshots(supabase);

  const receiptPath = await writeReceipt(receipt);
  console.log(`🧾 Run receipt: ${receiptPath}`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ MetabetFuturesIngestAgent done in ${elapsed}s`);
}

if (process.argv[1] && process.argv[1].endsWith('metabet-futures-ingest.js')) {
  main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
