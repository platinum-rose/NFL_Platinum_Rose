// agents/win-totals-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1.5: Manual win-total ingest
//
// Reads a hand-maintained win-totals file (typically pasted from the sharp books
// BetOnline / Bookmaker) and upserts it into futures_odds_snapshots as
// market_type='wins', one row per (team, book) carrying the line + over/under.
// Consumed by futures-intel-report-v2.js for Total / Most / Least Wins.
//
// Input file (default data/win-totals/<season>.json):
//   {
//     "season": 2026,
//     "captured_at": "2026-06-25T00:00:00Z",   // optional; defaults to now
//     "books": {
//       "betonline": { "Chiefs": { "line": 11.5, "over": -120, "under": 100 }, ... },
//       "bookmaker": { "Kansas City Chiefs": { "line": 11.5, "over": -115, "under": -105 }, ... }
//     }
//   }
// Team names may be nicknames or cities — they are normalized to full names so
// they line up with the outright markets.
//
// Usage:
//   node agents/win-totals-ingest.js [--season 2026] [--file path] [--dry-run]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const argVal = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const DRY_RUN = argv.includes('--dry-run');
const SEASON = Number(argVal('--season', new Date().getUTCFullYear()));
const FILE = argVal('--file', path.join(ROOT, 'data', 'win-totals', `${SEASON}.json`));

// Nickname / city → canonical full team name (matches TheOddsAPI outright naming).
const TEAM_CANON = {
  cardinals: 'Arizona Cardinals', falcons: 'Atlanta Falcons', ravens: 'Baltimore Ravens',
  bills: 'Buffalo Bills', panthers: 'Carolina Panthers', bears: 'Chicago Bears',
  bengals: 'Cincinnati Bengals', browns: 'Cleveland Browns', cowboys: 'Dallas Cowboys',
  broncos: 'Denver Broncos', lions: 'Detroit Lions', packers: 'Green Bay Packers',
  texans: 'Houston Texans', colts: 'Indianapolis Colts', jaguars: 'Jacksonville Jaguars',
  chiefs: 'Kansas City Chiefs', raiders: 'Las Vegas Raiders', chargers: 'Los Angeles Chargers',
  rams: 'Los Angeles Rams', dolphins: 'Miami Dolphins', vikings: 'Minnesota Vikings',
  patriots: 'New England Patriots', saints: 'New Orleans Saints', giants: 'New York Giants',
  jets: 'New York Jets', eagles: 'Philadelphia Eagles', steelers: 'Pittsburgh Steelers',
  '49ers': 'San Francisco 49ers', niners: 'San Francisco 49ers', seahawks: 'Seattle Seahawks',
  buccaneers: 'Tampa Bay Buccaneers', bucs: 'Tampa Bay Buccaneers', titans: 'Tennessee Titans',
  commanders: 'Washington Commanders',
};
const FULL_NAMES = new Set(Object.values(TEAM_CANON));

function canonTeam(name) {
  const raw = String(name).trim();
  if (FULL_NAMES.has(raw)) return raw;
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (TEAM_CANON[key]) return TEAM_CANON[key];
  // try last word (e.g. "KC Chiefs" → "chiefs")
  const last = raw.toLowerCase().split(/\s+/).pop()?.replace(/[^a-z0-9]/g, '');
  if (last && TEAM_CANON[last]) return TEAM_CANON[last];
  return raw; // pass through; will be flagged below
}

function truncateToHour(d) { const x = new Date(d); x.setUTCMinutes(0, 0, 0); return x.toISOString(); }

function getSupabase() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function buildRows(doc) {
  const capturedAt = truncateToHour(doc.captured_at || new Date());
  const season = Number(doc.season || SEASON);
  const rows = [];
  const unknown = new Set();
  for (const [book, teams] of Object.entries(doc.books || {})) {
    for (const [teamRaw, v] of Object.entries(teams)) {
      const team = canonTeam(teamRaw);
      if (!FULL_NAMES.has(team)) unknown.add(teamRaw);
      const line = Number(v.line);
      const over = v.over != null ? Math.round(Number(v.over)) : null;
      const under = v.under != null ? Math.round(Number(v.under)) : null;
      if (isNaN(line)) continue;
      rows.push({
        snapshot_time: capturedAt, captured_at: capturedAt, season,
        market_type: 'wins', team, selection: team, book: book.toLowerCase(),
        odds: over ?? -110, price: over ?? -110, implied_prob: null,
        line, over_price: over, under_price: under,
      });
    }
  }
  return { rows, unknown: [...unknown] };
}

async function main() {
  console.log(`📥 win-totals-ingest — season ${SEASON} | file ${path.relative(ROOT, FILE)} | dry=${DRY_RUN}`);
  let doc;
  try { doc = JSON.parse(await readFile(FILE, 'utf8')); }
  catch (e) { throw new Error(`Could not read/parse ${FILE}: ${e.message}`); }

  const { rows, unknown } = buildRows(doc);
  if (unknown.length) console.warn(`⚠️  Unrecognized team names (stored as-is): ${unknown.join(', ')}`);
  console.log(`   ${rows.length} rows across ${Object.keys(doc.books || {}).length} book(s)`);

  if (!rows.length) { console.log('Nothing to write.'); return; }
  if (DRY_RUN) {
    console.log('[DRY RUN] sample row:', JSON.stringify(rows[0]));
    return;
  }
  const sb = getSupabase();
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await sb.from('futures_odds_snapshots')
      .upsert(batch, { onConflict: 'market_type,team,book,snapshot_time' });
    if (error) throw new Error(`upsert: ${error.message}`);
    written += batch.length;
  }
  console.log(`✅ Wrote ${written} win-total rows.`);
}

main().catch((e) => { console.error('[win-totals-ingest] Fatal:', e.message); process.exit(1); });
