#!/usr/bin/env node
// scripts/scrape-vegasinsider-futures.js
// ═══════════════════════════════════════════════════════════════════════════════
// Free, no-API-key scraper for NFL Super Bowl Winner futures odds off
// vegasinsider.com/nfl/odds/futures/ — built specifically to cover books
// TheOddsAPI (agents/futures-odds-ingest.js) can't reach on the current
// plan: Caesars (williamhill_us is paid-plan-only there) and, as a bonus,
// bet365 (not offered by TheOddsAPI's US region at all).
//
// The page server-renders ONE odds table on plain GET with no JS execution
// required (verified 2026-09-09) -- its internal id/data-content label it
// "nfl championship winner" but the actual odds values are confirmed
// identical to the real Super Bowl Winner outright market (cross-checked
// against betmgm/fanduel superbowl rows already in futures_odds_snapshots
// from the same night, e.g. LA Rams/Buffalo Bills matched exactly), so
// this writes market_type: 'superbowl' as the honest label, not VI's
// internal one. Column order (which book is which) is parsed from the
// table's own <thead>, not hardcoded, so a column reorder on their end
// doesn't silently mislabel a book's odds.
//
// Usage:
//   node scripts/scrape-vegasinsider-futures.js --book caesars
//   node scripts/scrape-vegasinsider-futures.js --book caesars --dry-run
//   node scripts/scrape-vegasinsider-futures.js --book bet365
//
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (same as
// agents/futures-odds-ingest.js). No API key needed for the scrape itself.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from 'dotenv';
import { normalizeTeam } from '../src/lib/teams.js';

// NOTE: intentionally NOT importing truncateToHour from agents/futures-odds-ingest.js --
// that module runs main() unconditionally at import time (no
// `import.meta.url === process.argv[1]` guard), which would trigger a live,
// unauthorized Supabase-writing ingestion run as a side effect of importing
// this scraper. Duplicated here instead -- it's a two-line pure function,
// identical logic, no shared-module coupling to a script with side effects.
function truncateToHour(date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

const SOURCE_URL = 'https://www.vegasinsider.com/nfl/odds/futures/';
const TABLE_ANCHOR = 'table-nfl-championship-winner'; // VI's internal id for this table; content verified == Super Bowl Winner outright, see header comment.
const MARKET_TYPE = 'superbowl';
const SEASON = Number((process.argv.find((a) => a.startsWith('--season=')) || '').split('=')[1] || 2026);

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || !process.argv[idx + 1]) return fallback;
  return process.argv[idx + 1];
}

const BOOK = getArg('--book', 'caesars').toLowerCase();
const DRY_RUN = process.argv.includes('--dry-run');

// VI's display label -> our book key convention (matches other books already
// in futures_odds_snapshots, e.g. 'betmgm', 'fanduel', 'draftkings').
const BOOK_LABEL_TO_KEY = {
  'bet365': 'bet365',
  'betmgm': 'betmgm',
  'draftkings': 'draftkings',
  'caesars': 'caesars',
  'fanduel': 'fanduel',
};

function impliedProb(americanOdds) {
  if (americanOdds > 0) return parseFloat((100 / (americanOdds + 100)).toFixed(4));
  const abs = Math.abs(americanOdds);
  return parseFloat((abs / (abs + 100)).toFixed(4));
}

async function fetchPage() {
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`vegasinsider.com fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  if (!html || html.length < 1000) throw new Error('vegasinsider.com returned an unexpectedly short/empty page — layout may have changed or the request was blocked');
  return html;
}

function parseTable(html) {
  const anchorIdx = html.indexOf(TABLE_ANCHOR);
  if (anchorIdx === -1) throw new Error(`table anchor "${TABLE_ANCHOR}" not found -- vegasinsider.com's page structure has changed, this scraper needs updating`);
  const theadEnd = html.indexOf('</thead>', anchorIdx);
  const tableEnd = html.indexOf('</table>', anchorIdx);
  if (theadEnd === -1 || tableEnd === -1) throw new Error('could not locate table head/body boundaries -- page structure changed');

  const thead = html.slice(anchorIdx, theadEnd);
  const columns = [...thead.matchAll(/book-pinup blank"><span class="hidden">([^<]+)<\/span>/g)].map((m) => m[1].trim().toLowerCase());
  if (!columns.length) throw new Error('no book columns found in table head -- page structure changed');

  const bookIndex = columns.indexOf(BOOK);
  if (bookIndex === -1) throw new Error(`book "${BOOK}" not found in this table's columns: [${columns.join(', ')}]`);

  const tableHtml = html.slice(anchorIdx, tableEnd);
  const rowChunks = tableHtml.split(/<tr[^>]*data-name="[a-z0-9-]+"/).slice(1);
  const rows = [];
  for (const chunk of rowChunks) {
    const nameMatch = chunk.match(/"description":"([^"]+)"/);
    const oddsMatches = [...chunk.matchAll(/class="data-value">\s*([+\-0-9]+)\s*<\/span>/g)].map((m) => m[1]);
    if (!nameMatch || oddsMatches.length <= bookIndex) continue;
    const rawOdds = oddsMatches[bookIndex];
    const odds = Number(rawOdds);
    if (!Number.isFinite(odds) || odds === 0) continue;
    rows.push({ team: nameMatch[1], odds });
  }
  return { columns, rows };
}

async function main() {
  console.log(`VegasInsider futures scrape — book=${BOOK} market=${MARKET_TYPE} season=${SEASON}${DRY_RUN ? ' [DRY RUN]' : ''}`);
  const bookKey = BOOK_LABEL_TO_KEY[BOOK];
  if (!bookKey) throw new Error(`unrecognized --book "${BOOK}" -- known: ${Object.keys(BOOK_LABEL_TO_KEY).join(', ')}`);

  const html = await fetchPage();
  const { columns, rows } = parseTable(html);
  console.log(`Parsed columns: [${columns.join(', ')}] — reading index ${columns.indexOf(BOOK)} ("${BOOK}")`);
  if (!rows.length) throw new Error('parsed zero rows -- table structure likely changed, refusing to write nothing silently as if this were a real empty market');
  if (rows.length < 20) console.warn(`   WARNING: only ${rows.length} teams parsed (expected up to 32) — page structure may have partially changed`);

  // 2026-09-09 fix (P1 #2 technical defects, Andy's "fix now" decision):
  // (1) hour-truncate captured_at/snapshot_time via the same truncateToHour()
  // agents/futures-odds-ingest.js already exports, so a rerun within the
  // same hour resolves to the upsert's no-op update path instead of
  // inserting a duplicate row (migration 022's
  // unique(market_type, team, book, snapshot_time) constraint only
  // dedupes when snapshot_time is actually identical across runs).
  // (2) normalize the scraped full team name ("Pittsburgh Steelers") to the
  // short nickname convention ("Steelers") the rest of futures_odds_snapshots
  // already uses (agents/futures-odds-ingest.js writes TheOddsAPI's
  // outcome.name directly into both `team` and `selection`, which is always
  // a nickname) -- src/lib/teams.js's normalizeTeam() is the shared
  // canonical-name lookup used throughout the app for exactly this.
  const now = truncateToHour(new Date());
  const dbRows = rows.map(({ team: rawTeam, odds }) => {
    // 2026-09-09 fix (Codex minor finding, flagged 2026-09-09): comparing
    // `team === rawTeam` conflated two different cases -- normalizeTeam()
    // FAILING to recognize rawTeam (real fallback) vs. normalizeTeam()
    // SUCCEEDING but the canonical name happening to equal the raw scraped
    // string (e.g. rawTeam is already "Chiefs"). The latter produced a
    // false "not recognized" warning. Check normalizeTeam()'s own return
    // value directly instead of re-deriving success from string equality.
    const normalized = normalizeTeam(rawTeam);
    const team = normalized || rawTeam;
    if (!normalized) {
      console.warn(`   WARNING: normalizeTeam() did not recognize "${rawTeam}" -- writing raw scraped name as a fallback, verify manually`);
    }
    return {
      market_type: MARKET_TYPE,
      team,
      book: bookKey,
      odds,
      implied_prob: impliedProb(odds),
      selection: team,
      price: odds,
      captured_at: now,
      snapshot_time: now,
      season: SEASON,
    };
  });

  console.log(`Sample: ${JSON.stringify(dbRows.slice(0, 3).map((r) => ({ team: r.team, book: r.book, odds: r.odds })))}`);
  console.log(`Total rows to write: ${dbRows.length}`);

  if (DRY_RUN) {
    console.log('DRY RUN — no database write performed.');
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { error } = await sb.from('futures_odds_snapshots').upsert(dbRows, { onConflict: 'market_type,team,book,snapshot_time' });
  if (error) throw new Error(`futures_odds_snapshots upsert failed: ${error.message}`);
  console.log(`✅ Wrote ${dbRows.length} rows to futures_odds_snapshots (book=${bookKey})`);
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
