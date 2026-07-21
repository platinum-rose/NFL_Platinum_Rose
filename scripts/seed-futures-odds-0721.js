/**
 * scripts/seed-futures-odds-0721.js
 *
 * Manual import of futures odds captured 2026-07-21 from:
 *   - BetOnline (BEO) → book key: 'betonline'   (Regular Season Wins, To Make the
 *     Playoffs, Exact Division Position — all transcribed from
 *     docs/Futures_Odds/BEO_*_0721.png screenshots)
 *   - BetUS         → book key: 'betus'         (Super Bowl Winner 2027 LXI, from
 *     docs/Futures_Odds/BetUS_SB_0721.png)
 *
 * Markets covered:
 *   wins (BEO, all 32 teams — includes BEO_SF_Wins.png patch for the 49ers, whose
 *     line fell in the gap between the RegWins3/RegWins4 screenshots)
 *   playoffs (BEO, all 32 teams)
 *   division_exact_position (BEO, all 32 teams, selections '1st'/'2nd'/'3rd'/'4th'
 *     — NEW market type, not seen in prior batches. Distinct from the existing
 *     division_afc_X / division_nfc_X "wins the division" outright markets; this is
 *     "exact finishing position within division", 4 priced outcomes per team.
 *     Andy confirmed this convention 2026-07-21: reuse the existing `selection`
 *     column from migration 022, same pattern as playoffs' Yes/No.)
 *   superbowl (BetUS, all 32 teams)
 *
 * Usage:
 *   node scripts/seed-futures-odds-0721.js           # live write
 *   node scripts/seed-futures-odds-0721.js --dry-run # print rows, no DB write
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const CAPTURED_AT = '2026-07-21T12:00:00Z';
const SEASON = 2026;

// ── Implied probability from American odds ────────────────────────────────────
function impliedProb(americanOdds) {
  if (americanOdds > 0) {
    return parseFloat((100 / (americanOdds + 100)).toFixed(4));
  }
  const abs = Math.abs(americanOdds);
  return parseFloat((abs / (abs + 100)).toFixed(4));
}

// ── Build rows from a flat odds map ──────────────────────────────────────────
// oddsMap: { 'Full Team Name': americanOdds, ... }
function outcomeRows(marketType, book, oddsMap) {
  return Object.entries(oddsMap).map(([team, odds]) => ({
    market_type: marketType,
    team,
    book,
    odds,
    implied_prob: impliedProb(odds),
    selection: team,
    price: odds,
    captured_at: CAPTURED_AT,
    season: SEASON,
    snapshot_time: CAPTURED_AT,
  }));
}

// ── Build rows for over/under win totals ──────────────────────────────────────
// entries: [ { team, line, overOdds, underOdds }, ... ]
function winTotalRows(book, entries) {
  const rows = [];
  for (const { team, line, overOdds, underOdds } of entries) {
    const overLabel = `${team} Over ${line}`;
    const underLabel = `${team} Under ${line}`;
    rows.push({
      market_type: 'wins',
      team: overLabel,
      book,
      odds: overOdds,
      implied_prob: impliedProb(overOdds),
      selection: overLabel,
      price: overOdds,
      captured_at: CAPTURED_AT,
      season: SEASON,
      snapshot_time: CAPTURED_AT,
    });
    rows.push({
      market_type: 'wins',
      team: underLabel,
      book,
      odds: underOdds,
      implied_prob: impliedProb(underOdds),
      selection: underLabel,
      price: underOdds,
      captured_at: CAPTURED_AT,
      season: SEASON,
      snapshot_time: CAPTURED_AT,
    });
  }
  return rows;
}

// ── Build rows for make-playoffs yes/no ───────────────────────────────────────
// entries: [ { team, yesOdds, noOdds }, ... ]
function playoffRows(book, entries) {
  const rows = [];
  for (const { team, yesOdds, noOdds } of entries) {
    const yesLabel = `${team} Yes`;
    const noLabel  = `${team} No`;
    rows.push({
      market_type: 'playoffs',
      team: yesLabel,
      book,
      odds: yesOdds,
      implied_prob: impliedProb(yesOdds),
      selection: yesLabel,
      price: yesOdds,
      captured_at: CAPTURED_AT,
      season: SEASON,
      snapshot_time: CAPTURED_AT,
    });
    rows.push({
      market_type: 'playoffs',
      team: noLabel,
      book,
      odds: noOdds,
      implied_prob: impliedProb(noOdds),
      selection: noLabel,
      price: noOdds,
      captured_at: CAPTURED_AT,
      season: SEASON,
      snapshot_time: CAPTURED_AT,
    });
  }
  return rows;
}

// ── Build rows for exact division position (1st/2nd/3rd/4th) ─────────────────
// entries: [ { team, first, second, third, fourth }, ... ] (American odds)
function divPositionRows(book, entries) {
  const rows = [];
  const POSITIONS = [['1st', 'first'], ['2nd', 'second'], ['3rd', 'third'], ['4th', 'fourth']];
  for (const entry of entries) {
    for (const [label, key] of POSITIONS) {
      const odds = entry[key];
      const selLabel = `${entry.team} ${label}`;
      rows.push({
        market_type: 'division_exact_position',
        team: selLabel,
        book,
        odds,
        implied_prob: impliedProb(odds),
        selection: selLabel,
        price: odds,
        captured_at: CAPTURED_AT,
        season: SEASON,
        snapshot_time: CAPTURED_AT,
      });
    }
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BETONLINE (BEO) — captured 2026-07-21
// ═══════════════════════════════════════════════════════════════════════════════

// Regular Season Win Totals (Over/Under) — all 32 teams
// (49ers line came via a separate patch screenshot, BEO_SF_Wins.png, whose line
// fell in the gap between the RegWins3/RegWins4 screenshots.)
const BEO_WIN_TOTALS = [
  { team: 'Arizona Cardinals',     line: 4.5,  overOdds:  135, underOdds: -165 },
  { team: 'Atlanta Falcons',       line: 7.5,  overOdds:  105, underOdds: -135 },
  { team: 'Baltimore Ravens',      line: 11.5, overOdds:  110, underOdds: -140 },
  { team: 'Buffalo Bills',         line: 10.5, overOdds: -140, underOdds:  110 },
  { team: 'Carolina Panthers',     line: 7.5,  overOdds:  125, underOdds: -155 },
  { team: 'Chicago Bears',         line: 9.5,  overOdds:  100, underOdds: -130 },
  { team: 'Cincinnati Bengals',    line: 9.5,  overOdds: -170, underOdds:  140 },
  { team: 'Cleveland Browns',      line: 5.5,  overOdds: -115, underOdds: -115 },
  { team: 'Dallas Cowboys',        line: 9.5,  overOdds:  100, underOdds: -130 },
  { team: 'Denver Broncos',        line: 9.5,  overOdds: -130, underOdds:  100 },
  { team: 'Detroit Lions',         line: 10.5, overOdds: -135, underOdds:  105 },
  { team: 'Green Bay Packers',     line: 9.5,  overOdds: -120, underOdds: -110 },
  { team: 'Houston Texans',        line: 9.5,  overOdds: -130, underOdds:  100 },
  { team: 'Indianapolis Colts',    line: 7.5,  overOdds: -135, underOdds:  105 },
  { team: 'Jacksonville Jaguars',  line: 9.5,  overOdds:  110, underOdds: -140 },
  { team: 'Kansas City Chiefs',    line: 10.5, overOdds:  120, underOdds: -150 },
  { team: 'Las Vegas Raiders',     line: 5.5,  overOdds: -145, underOdds:  115 },
  { team: 'Los Angeles Chargers',  line: 9.5,  overOdds: -145, underOdds:  115 },
  { team: 'Los Angeles Rams',      line: 11.5, overOdds: -145, underOdds:  115 },
  { team: 'Miami Dolphins',        line: 4.5,  overOdds:  145, underOdds: -175 },
  { team: 'Minnesota Vikings',     line: 8.5,  overOdds: -115, underOdds: -115 },
  { team: 'New England Patriots',  line: 9.5,  overOdds: -160, underOdds:  130 },
  { team: 'New Orleans Saints',    line: 7.5,  overOdds: -135, underOdds:  105 },
  { team: 'New York Giants',       line: 7.5,  overOdds: -110, underOdds: -120 },
  { team: 'New York Jets',         line: 5.5,  overOdds:  100, underOdds: -130 },
  { team: 'Philadelphia Eagles',   line: 9.5,  overOdds: -145, underOdds:  115 },
  { team: 'Pittsburgh Steelers',   line: 7.5,  overOdds: -145, underOdds:  115 },
  { team: 'San Francisco 49ers',   line: 10.5, overOdds:  105, underOdds: -135 },
  { team: 'Seattle Seahawks',      line: 10.5, overOdds: -115, underOdds: -115 },
  { team: 'Tampa Bay Buccaneers',  line: 8.5,  overOdds:  120, underOdds: -150 },
  { team: 'Tennessee Titans',      line: 6.5,  overOdds:  100, underOdds: -130 },
  { team: 'Washington Commanders', line: 7.5,  overOdds: -130, underOdds:  100 },
];

// Make the Playoffs (Yes/No) — all 32 teams
const BEO_PLAYOFFS = [
  { team: 'Arizona Cardinals',     yesOdds: 2000,  noOdds: -10000 },
  { team: 'Atlanta Falcons',       yesOdds:  205,  noOdds:   -265 },
  { team: 'Baltimore Ravens',      yesOdds: -325,  noOdds:    250 },
  { team: 'Buffalo Bills',         yesOdds: -325,  noOdds:    250 },
  { team: 'Carolina Panthers',     yesOdds:  250,  noOdds:   -325 },
  { team: 'Chicago Bears',         yesOdds:  105,  noOdds:   -135 },
  { team: 'Cincinnati Bengals',    yesOdds: -200,  noOdds:    160 },
  { team: 'Cleveland Browns',      yesOdds:  700,  noOdds:  -1400 },
  { team: 'Dallas Cowboys',        yesOdds: -105,  noOdds:   -125 },
  { team: 'Denver Broncos',        yesOdds: -150,  noOdds:    120 },
  { team: 'Detroit Lions',         yesOdds: -210,  noOdds:    170 },
  { team: 'Green Bay Packers',     yesOdds: -115,  noOdds:   -115 },
  { team: 'Houston Texans',        yesOdds: -160,  noOdds:    130 },
  { team: 'Indianapolis Colts',    yesOdds:  170,  noOdds:   -210 },
  { team: 'Jacksonville Jaguars',  yesOdds: -115,  noOdds:   -115 },
  { team: 'Kansas City Chiefs',    yesOdds: -180,  noOdds:    150 },
  { team: 'Las Vegas Raiders',     yesOdds:  500,  noOdds:   -800 },
  { team: 'Los Angeles Chargers',  yesOdds: -170,  noOdds:    140 },
  { team: 'Los Angeles Rams',      yesOdds: -500,  noOdds:    350 },
  { team: 'Miami Dolphins',        yesOdds: 1400,  noOdds:  -3000 },
  { team: 'Minnesota Vikings',     yesOdds:  160,  noOdds:   -200 },
  { team: 'New England Patriots',  yesOdds: -220,  noOdds:    180 },
  { team: 'New Orleans Saints',    yesOdds:  170,  noOdds:   -210 },
  { team: 'New York Giants',       yesOdds:  250,  noOdds:   -325 },
  { team: 'New York Jets',         yesOdds:  700,  noOdds:  -1400 },
  { team: 'Philadelphia Eagles',   yesOdds: -155,  noOdds:    125 },
  { team: 'Pittsburgh Steelers',   yesOdds:  175,  noOdds:   -215 },
  { team: 'San Francisco 49ers',   yesOdds: -155,  noOdds:    125 },
  { team: 'Seattle Seahawks',      yesOdds: -210,  noOdds:    170 },
  { team: 'Tampa Bay Buccaneers',  yesOdds:  145,  noOdds:   -175 },
  { team: 'Tennessee Titans',      yesOdds:  400,  noOdds:   -600 },
  { team: 'Washington Commanders', yesOdds:  220,  noOdds:   -280 },
];

// Exact Division Position — all 32 teams, 4 priced outcomes each (American odds)
const BEO_DIV_POSITION = [
  { team: 'Arizona Cardinals',     first: 6000, second: 3300, third:  800, fourth: -2000 },
  { team: 'Atlanta Falcons',       first:  325, second:  350, third:  260, fourth:   170 },
  { team: 'Baltimore Ravens',      first: -110, second:  200, third:  475, fourth:  1200 },
  { team: 'Buffalo Bills',         first: -140, second:  170, third:  800, fourth:  2500 },
  { team: 'Carolina Panthers',     first:  325, second:  260, third:  235, fourth:   245 },
  { team: 'Chicago Bears',         first:  320, second:  270, third:  225, fourth:   250 },
  { team: 'Cincinnati Bengals',    first:  160, second:  155, third:  350, fourth:   850 },
  { team: 'Cleveland Browns',      first: 2200, second:  700, third:  270, fourth:  -200 },
  { team: 'Dallas Cowboys',        first:  210, second:  200, third:  300, fourth:   400 },
  { team: 'Denver Broncos',        first:  210, second:  220, third:  220, fourth:   525 },
  { team: 'Detroit Lions',         first:  160, second:  250, third:  300, fourth:   450 },
  { team: 'Green Bay Packers',     first:  250, second:  215, third:  250, fourth:   360 },
  { team: 'Houston Texans',        first:  130, second:  200, third:  375, fourth:   700 },
  { team: 'Indianapolis Colts',    first:  375, second:  255, third:  220, fourth:   240 },
  { team: 'Jacksonville Jaguars',  first:  190, second:  225, third:  300, fourth:   400 },
  { team: 'Kansas City Chiefs',    first:  175, second:  185, third:  260, fourth:   800 },
  { team: 'Las Vegas Raiders',     first: 1400, second:  800, third:  350, fourth:  -240 },
  { team: 'Los Angeles Chargers',  first:  185, second:  200, third:  250, fourth:   650 },
  { team: 'Los Angeles Rams',      first: -105, second:  210, third:  310, fourth:  3300 },
  { team: 'Miami Dolphins',        first: 3300, second:  900, third:  190, fourth:  -170 },
  { team: 'Minnesota Vikings',     first:  400, second:  350, third:  250, fourth:   150 },
  { team: 'New England Patriots',  first:  125, second:  125, third:  525, fourth:  1800 },
  { team: 'New Orleans Saints',    first:  240, second:  235, third:  275, fourth:   310 },
  { team: 'New York Giants',       first:  550, second:  340, third:  225, fourth:   140 },
  { team: 'New York Jets',         first: 2000, second:  475, third:  100, fourth:   160 },
  { team: 'Philadelphia Eagles',   first:  130, second:  220, third:  375, fourth:   600 },
  { team: 'Pittsburgh Steelers',   first:  550, second:  250, third:  140, fourth:   300 },
  { team: 'San Francisco 49ers',   first:  300, second:  180, third:  130, fourth:  1400 },
  { team: 'Seattle Seahawks',      first:  210, second:  150, third:  200, fourth:  2000 },
  { team: 'Tampa Bay Buccaneers',  first:  195, second:  205, third:  310, fourth:   425 },
  { team: 'Tennessee Titans',      first:  750, second:  400, third:  220, fourth:   110 },
  { team: 'Washington Commanders', first:  425, second:  325, third:  210, fourth:   180 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// BETUS — captured 2026-07-21
// ═══════════════════════════════════════════════════════════════════════════════

const BETUS_SUPERBOWL = {
  'Los Angeles Rams':       500,
  'Buffalo Bills':         1000,
  'Baltimore Ravens':      1100,
  'Seattle Seahawks':      1100,
  'Kansas City Chiefs':    1600,
  'Los Angeles Chargers':  1800,
  'Philadelphia Eagles':   1800,
  'San Francisco 49ers':   1800,
  'Cincinnati Bengals':    2000,
  'Denver Broncos':        2000,
  'Detroit Lions':         2000,
  'Houston Texans':        2000,
  'New England Patriots':  2000,
  'Dallas Cowboys':        2200,
  'Green Bay Packers':     2200,
  'Chicago Bears':         2500,
  'Jacksonville Jaguars':  2500,
  'Minnesota Vikings':     4000,
  'Tampa Bay Buccaneers':  5500,
  'Washington Commanders': 5500,
  'Indianapolis Colts':    6000,
  'New York Giants':       6600,
  'Atlanta Falcons':       8000,
  'Carolina Panthers':     8000,
  'Las Vegas Raiders':     8000,
  'Pittsburgh Steelers':   8000,
  'New Orleans Saints':   10000,
  'Tennessee Titans':     20000,
  'New York Jets':        25000,
  'Cleveland Browns':     30000,
  'Miami Dolphins':       40000,
  'Arizona Cardinals':    50000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Assemble all rows
// ═══════════════════════════════════════════════════════════════════════════════

function buildAllRows() {
  return [
    // ── BetOnline ─────────────────────────────────────────────────────────────
    ...winTotalRows('betonline', BEO_WIN_TOTALS),
    ...playoffRows('betonline', BEO_PLAYOFFS),
    ...divPositionRows('betonline', BEO_DIV_POSITION),

    // ── BetUS ─────────────────────────────────────────────────────────────────
    ...outcomeRows('superbowl', 'betus', BETUS_SUPERBOWL),
  ];
}

// ── Write to Supabase (idempotent upsert) ─────────────────────────────────────
async function writeRows(rows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check for enhanced schema (selection/price/captured_at/season columns, migration 022)
  const { error: colErr } = await supabase
    .from('futures_odds_snapshots')
    .select('selection')
    .limit(1);

  const useEnhanced = !colErr;

  const upsertRows = rows.map((r) => {
    const base = {
      market_type:    r.market_type,
      team:           r.team,
      book:           r.book,
      odds:           r.odds,
      implied_prob:   r.implied_prob,
      snapshot_time:  r.snapshot_time,
    };
    if (useEnhanced) {
      base.selection   = r.selection;
      base.price       = r.price;
      base.captured_at = r.captured_at;
      base.season      = r.season;
    }
    return base;
  });

  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < upsertRows.length; i += BATCH) {
    const batch = upsertRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('futures_odds_snapshots')
      .upsert(batch, { onConflict: 'market_type,team,book,snapshot_time' });
    if (error) {
      console.error('Supabase upsert error:', error.message);
      process.exit(1);
    }
    written += batch.length;
  }

  return written;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const rows = buildAllRows();

  console.log(`\nManual futures import — 2026-07-21 snapshot`);
  console.log(`Books: betonline, betus`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`DRY_RUN: ${DRY_RUN}\n`);

  // Group by market for summary
  const byMarket = {};
  for (const r of rows) {
    byMarket[r.market_type] = (byMarket[r.market_type] || 0) + 1;
  }
  for (const [market, count] of Object.entries(byMarket)) {
    console.log(`  ${market.padEnd(24)} ${count} rows`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample rows (first 5):');
    rows.slice(0, 5).forEach((r) => {
      const sign = r.odds > 0 ? '+' : '';
      console.log(
        `  ${r.market_type.padEnd(24)} ${r.book.padEnd(12)} `
        + `${r.team.padEnd(32)} ${sign}${r.odds} `
        + `(${(r.implied_prob * 100).toFixed(1)}%)`
      );
    });
    console.log('\n[DRY RUN] No rows written. Remove --dry-run to import.');
    return;
  }

  console.log('\nWriting to Supabase (idempotent upsert)...');
  const written = await writeRows(rows);
  console.log(`Done. Wrote ${written} rows to futures_odds_snapshots.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
