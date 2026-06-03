/**
 * scripts/import-manual-futures.js
 *
 * One-time manual import of futures odds captured 2026-06-02 from:
 *   - Bookmaker (BKR)  → book key: 'bookmaker'
 *   - BetOnline (BEO)  → book key: 'betonline'
 *
 * Usage:
 *   node scripts/import-manual-futures.js           # live write
 *   node scripts/import-manual-futures.js --dry-run # print rows, no DB write
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
const PATCH_PLAYOFFS = process.argv.includes('--patch-playoffs');
const CAPTURED_AT = '2026-06-02T12:00:00Z';
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
// oddsMap: { teamAbbr: americanOdds, ... }
// teamNames: { teamAbbr: 'Full Team Name', ... } (optional; pass null to use key as name)
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

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKMAKER (BKR) — captured 2026-06-02
// ═══════════════════════════════════════════════════════════════════════════════

const BKR_SUPERBOWL = {
  'Arizona Cardinals':    40329,
  'Atlanta Falcons':       8873,
  'Baltimore Ravens':      1261,
  'Buffalo Bills':          976,
  'Carolina Panthers':    10084,
  'Chicago Bears':         2522,
  'Cincinnati Bengals':    1918,
  'Cleveland Browns':     35287,
  'Dallas Cowboys':        2370,
  'Denver Broncos':        2018,
  'Detroit Lions':         1715,
  'Green Bay Packers':     2510,
  'Houston Texans':        2018,
  'Indianapolis Colts':    5042,
  'Jacksonville Jaguars':  2874,
  'Kansas City Chiefs':    1463,
  'Las Vegas Raiders':    13517,
  'Los Angeles Chargers':  1488,
  'Los Angeles Rams':       510,
  'Miami Dolphins':       25206,
  'Minnesota Vikings':     4236,
  'New England Patriots':  1646,
  'New Orleans Saints':   12605,
  'New York Giants':       6546,
  'New York Jets':        30248,
  'Philadelphia Eagles':   1664,
  'Pittsburgh Steelers':   6051,
  'San Francisco 49ers':   1753,
  'Seattle Seahawks':      1122,
  'Tampa Bay Buccaneers':  6051,
  'Tennessee Titans':     17562,
  'Washington Commanders': 5721,
};

const BKR_AFC = {
  'Baltimore Ravens':       501,
  'Buffalo Bills':          489,
  'Cincinnati Bengals':     901,
  'Cleveland Browns':     15196,
  'Denver Broncos':        1001,
  'Houston Texans':         876,
  'Indianapolis Colts':    2534,
  'Jacksonville Jaguars':  1166,
  'Kansas City Chiefs':     730,
  'Las Vegas Raiders':     6585,
  'Los Angeles Chargers':   730,
  'Miami Dolphins':       12156,
  'New England Patriots':   829,
  'New York Jets':        15196,
  'Pittsburgh Steelers':   2970,
  'Tennessee Titans':      8555,
};

const BKR_NFC = {
  'Arizona Cardinals':    20000,
  'Atlanta Falcons':       4500,
  'Carolina Panthers':     5000,
  'Chicago Bears':         1300,
  'Dallas Cowboys':        1200,
  'Detroit Lions':          825,
  'Green Bay Packers':     1165,
  'Los Angeles Rams':       255,
  'Minnesota Vikings':     2000,
  'New Orleans Saints':    5700,
  'New York Giants':       3300,
  'Philadelphia Eagles':    935,
  'San Francisco 49ers':    888,
  'Seattle Seahawks':       560,
  'Tampa Bay Buccaneers':  3000,
  'Washington Commanders': 2850,
};

const BKR_DIV_AFC_EAST  = { 'Buffalo Bills': -162, 'Miami Dolphins': 3007, 'New England Patriots': 134, 'New York Jets': 3007 };
const BKR_DIV_AFC_NORTH = { 'Baltimore Ravens': -120, 'Cincinnati Bengals': 175, 'Cleveland Browns': 1850, 'Pittsburgh Steelers': 565 };
const BKR_DIV_AFC_SOUTH = { 'Houston Texans': 133, 'Indianapolis Colts': 300, 'Jacksonville Jaguars': 210, 'Tennessee Titans': 825 };
const BKR_DIV_AFC_WEST  = { 'Denver Broncos': 195, 'Kansas City Chiefs': 183, 'Las Vegas Raiders': 1473, 'Los Angeles Chargers': 182 };
const BKR_DIV_NFC_EAST  = { 'Dallas Cowboys': 185, 'New York Giants': 550, 'Philadelphia Eagles': 150, 'Washington Commanders': 385 };
const BKR_DIV_NFC_NORTH = { 'Chicago Bears': 335, 'Detroit Lions': 140, 'Green Bay Packers': 265, 'Minnesota Vikings': 425 };
const BKR_DIV_NFC_SOUTH = { 'Atlanta Falcons': 340, 'Carolina Panthers': 280, 'New Orleans Saints': 265, 'Tampa Bay Buccaneers': 190 };
const BKR_DIV_NFC_WEST  = { 'Arizona Cardinals': 8000, 'Los Angeles Rams': -120, 'San Francisco 49ers': 335, 'Seattle Seahawks': 210 };

// ═══════════════════════════════════════════════════════════════════════════════
// BETONLINE (BEO) — captured 2026-06-02
// ═══════════════════════════════════════════════════════════════════════════════

const BEO_SUPERBOWL = {
  'Arizona Cardinals':    25000,
  'Atlanta Falcons':       8000,
  'Baltimore Ravens':      1100,
  'Buffalo Bills':         1100,
  'Carolina Panthers':     7500,
  'Chicago Bears':         2500,
  'Cincinnati Bengals':    2200,
  'Cleveland Browns':     30000,
  'Dallas Cowboys':        2200,
  'Denver Broncos':        2000,
  'Detroit Lions':         2000,
  'Green Bay Packers':     2200,
  'Houston Texans':        2200,
  'Indianapolis Colts':    5000,
  'Jacksonville Jaguars':  2800,
  'Kansas City Chiefs':    1200,
  'Las Vegas Raiders':     8000,
  'Los Angeles Chargers':  1600,
  'Los Angeles Rams':       600,
  'Miami Dolphins':       25000,
  'Minnesota Vikings':     4000,
  'New England Patriots':  1800,
  'New Orleans Saints':   10000,
  'New York Giants':       6600,
  'New York Jets':        25000,
  'Philadelphia Eagles':   1800,
  'Pittsburgh Steelers':   8000,
  'San Francisco 49ers':   1600,
  'Seattle Seahawks':      1100,
  'Tampa Bay Buccaneers':  6000,
  'Tennessee Titans':     15000,
  'Washington Commanders': 5500,
};

const BEO_AFC = {
  'Baltimore Ravens':       500,
  'Buffalo Bills':          475,
  'Cincinnati Bengals':    1000,
  'Cleveland Browns':     12500,
  'Denver Broncos':        1000,
  'Houston Texans':        1000,
  'Indianapolis Colts':    2200,
  'Jacksonville Jaguars':  1200,
  'Kansas City Chiefs':     750,
  'Las Vegas Raiders':     6000,
  'Los Angeles Chargers':   750,
  'Miami Dolphins':       15000,
  'New England Patriots':   850,
  'New York Jets':        10000,
  'Pittsburgh Steelers':   3300,
  'Tennessee Titans':      7000,
};

const BEO_NFC = {
  'Arizona Cardinals':    15000,
  'Atlanta Falcons':       3300,
  'Carolina Panthers':     4000,
  'Chicago Bears':         1400,
  'Dallas Cowboys':        1200,
  'Detroit Lions':          900,
  'Green Bay Packers':     1100,
  'Los Angeles Rams':       325,
  'Minnesota Vikings':     2200,
  'New Orleans Saints':    4000,
  'New York Giants':       3300,
  'Philadelphia Eagles':    975,
  'San Francisco 49ers':    775,
  'Seattle Seahawks':       550,
  'Tampa Bay Buccaneers':  2200,
  'Washington Commanders': 2700,
};

const BEO_DIV_AFC_EAST  = { 'Buffalo Bills': -145, 'Miami Dolphins': 2800, 'New England Patriots': 130, 'New York Jets': 2000 };
const BEO_DIV_AFC_NORTH = { 'Baltimore Ravens': -120, 'Cincinnati Bengals': 185, 'Cleveland Browns': 1800, 'Pittsburgh Steelers': 550 };
const BEO_DIV_AFC_SOUTH = { 'Houston Texans': 140, 'Indianapolis Colts': 350, 'Jacksonville Jaguars': 185, 'Tennessee Titans': 750 };
const BEO_DIV_AFC_WEST  = { 'Denver Broncos': 210, 'Kansas City Chiefs': 175, 'Las Vegas Raiders': 1600, 'Los Angeles Chargers': 180 };
const BEO_DIV_NFC_EAST  = { 'Dallas Cowboys': 200, 'New York Giants': 550, 'Philadelphia Eagles': 140, 'Washington Commanders': 400 };
const BEO_DIV_NFC_NORTH = { 'Chicago Bears': 310, 'Detroit Lions': 155, 'Green Bay Packers': 260, 'Minnesota Vikings': 425 };
const BEO_DIV_NFC_SOUTH = { 'Atlanta Falcons': 315, 'Carolina Panthers': 325, 'New Orleans Saints': 265, 'Tampa Bay Buccaneers': 180 };
const BEO_DIV_NFC_WEST  = { 'Arizona Cardinals': 4000, 'Los Angeles Rams': 100, 'San Francisco 49ers': 290, 'Seattle Seahawks': 205 };

// BEO Regular Season Win Totals (Over/Under) — all 32 teams
const BEO_WIN_TOTALS = [
  { team: 'Arizona Cardinals',    line: 4.5,  overOdds:  120, underOdds: -150 },
  { team: 'Atlanta Falcons',      line: 7.5,  overOdds:  105, underOdds: -135 },
  { team: 'Baltimore Ravens',     line: 11.5, overOdds:  105, underOdds: -135 },
  { team: 'Buffalo Bills',        line: 10.5, overOdds: -130, underOdds:  100 },
  { team: 'Carolina Panthers',    line: 7.5,  overOdds:  105, underOdds: -135 },
  { team: 'Chicago Bears',        line: 9.5,  overOdds:  100, underOdds: -130 },
  { team: 'Cincinnati Bengals',   line: 9.5,  overOdds: -145, underOdds:  115 },
  { team: 'Cleveland Browns',     line: 5.5,  overOdds:  100, underOdds: -130 },
  { team: 'Dallas Cowboys',       line: 9.5,  overOdds: -105, underOdds: -125 },
  { team: 'Denver Broncos',       line: 9.5,  overOdds: -125, underOdds: -105 },
  { team: 'Detroit Lions',        line: 10.5, overOdds: -130, underOdds:  100 },
  { team: 'Houston Texans',       line: 9.5,  overOdds: -130, underOdds:  100 },
  { team: 'Indianapolis Colts',   line: 7.5,  overOdds: -135, underOdds:  105 },
  { team: 'Jacksonville Jaguars', line: 9.5,  overOdds:  110, underOdds: -140 },
  { team: 'Kansas City Chiefs',   line: 10.5, overOdds:  125, underOdds: -155 },
  { team: 'Las Vegas Raiders',    line: 5.5,  overOdds: -150, underOdds:  120 },
  { team: 'Los Angeles Chargers', line: 9.5,  overOdds: -135, underOdds:  105 },
  { team: 'Los Angeles Rams',     line: 11.5, overOdds: -130, underOdds:  100 },
  { team: 'Miami Dolphins',       line: 4.5,  overOdds:  115, underOdds: -145 },
  { team: 'Minnesota Vikings',    line: 8.5,  overOdds: -110, underOdds: -120 },
  { team: 'New England Patriots', line: 9.5,  overOdds: -135, underOdds:  105 },
  { team: 'New Orleans Saints',   line: 7.5,  overOdds: -125, underOdds: -105 },
  { team: 'New York Giants',      line: 7.5,  overOdds: -115, underOdds: -115 },
  { team: 'New York Jets',        line: 5.5,  overOdds: -105, underOdds: -125 },
  { team: 'Philadelphia Eagles',  line: 10.5, overOdds:  120, underOdds: -150 },
  { team: 'Pittsburgh Steelers',  line: 7.5,  overOdds: -145, underOdds:  115 },
  { team: 'San Francisco 49ers',  line: 10.5, overOdds:  105, underOdds: -135 },
  { team: 'Seattle Seahawks',     line: 10.5, overOdds: -135, underOdds:  105 },
  { team: 'Tampa Bay Buccaneers', line: 8.5,  overOdds:  105, underOdds: -135 },
  { team: 'Tennessee Titans',     line: 6.5,  overOdds: -115, underOdds: -115 },
  { team: 'Washington Commanders',line: 7.5,  overOdds: -130, underOdds:  100 },
];

// BEO Make the Playoffs (Yes/No)
// NOTE: Screenshot 2 ended at New York Jets — remaining 8 teams not captured.
const BEO_PLAYOFFS = [
  { team: 'Arizona Cardinals',    yesOdds: 1600,  noOdds: -5000 },
  { team: 'Atlanta Falcons',      yesOdds:  195,  noOdds:  -250 },
  { team: 'Baltimore Ravens',     yesOdds: -350,  noOdds:   275 },
  { team: 'Buffalo Bills',        yesOdds: -350,  noOdds:   275 },
  { team: 'Carolina Panthers',    yesOdds:  235,  noOdds:  -295 },
  { team: 'Chicago Bears',        yesOdds:  105,  noOdds:  -135 },
  { team: 'Cincinnati Bengals',   yesOdds: -175,  noOdds:   145 },
  { team: 'Cleveland Browns',     yesOdds:  600,  noOdds: -1000 },
  { team: 'Dallas Cowboys',       yesOdds:  100,  noOdds:  -130 },
  { team: 'Denver Broncos',       yesOdds: -155,  noOdds:   125 },
  { team: 'Detroit Lions',        yesOdds: -200,  noOdds:   160 },
  { team: 'Houston Texans',       yesOdds: -165,  noOdds:   135 },
  { team: 'Indianapolis Colts',   yesOdds:  150,  noOdds:  -180 },
  { team: 'Jacksonville Jaguars', yesOdds: -125,  noOdds:  -105 },
  { team: 'Kansas City Chiefs',   yesOdds: -190,  noOdds:   155 },
  { team: 'Las Vegas Raiders',    yesOdds:  500,  noOdds:  -800 },
  { team: 'Los Angeles Chargers', yesOdds: -170,  noOdds:   140 },
  { team: 'Los Angeles Rams',     yesOdds: -450,  noOdds:   325 },
  { team: 'Miami Dolphins',       yesOdds: 1200,  noOdds: -2500 },
  { team: 'Minnesota Vikings',    yesOdds:  180,  noOdds:  -220 },
  { team: 'New England Patriots', yesOdds: -210,  noOdds:   170 },
  { team: 'New Orleans Saints',   yesOdds:  185,  noOdds:  -225 },
  { team: 'New York Giants',      yesOdds:  240,  noOdds:  -300 },
  { team: 'New York Jets',        yesOdds:  700,  noOdds: -1400 },
  { team: 'Philadelphia Eagles',  yesOdds: -155,  noOdds:   125 },
  { team: 'Pittsburgh Steelers',  yesOdds:  190,  noOdds:  -230 },
  { team: 'San Francisco 49ers',  yesOdds: -160,  noOdds:   130 },
  { team: 'Seattle Seahawks',     yesOdds: -260,  noOdds:   200 },
  { team: 'Tampa Bay Buccaneers', yesOdds:  130,  noOdds:  -160 },
  { team: 'Tennessee Titans',     yesOdds:  350,  noOdds:  -500 },
  { team: 'Washington Commanders',yesOdds:  190,  noOdds:  -230 },
  // NOTE: Green Bay Packers not yet published by BetOnline
];

// ═══════════════════════════════════════════════════════════════════════════════
// Assemble all rows
// ═══════════════════════════════════════════════════════════════════════════════

// Teams already written in the initial import (2026-06-02 run 1)
const PLAYOFFS_ALREADY_WRITTEN = new Set([
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Houston Texans',
  'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams',
  'Miami Dolphins', 'Minnesota Vikings', 'New England Patriots',
  'New Orleans Saints', 'New York Giants', 'New York Jets',
]);

function buildAllRows() {
  return [
    // ── Bookmaker ─────────────────────────────────────────────────────────────
    ...outcomeRows('superbowl',           'bookmaker', BKR_SUPERBOWL),
    ...outcomeRows('conference_afc',      'bookmaker', BKR_AFC),
    ...outcomeRows('conference_nfc',      'bookmaker', BKR_NFC),
    ...outcomeRows('division_afc_east',   'bookmaker', BKR_DIV_AFC_EAST),
    ...outcomeRows('division_afc_north',  'bookmaker', BKR_DIV_AFC_NORTH),
    ...outcomeRows('division_afc_south',  'bookmaker', BKR_DIV_AFC_SOUTH),
    ...outcomeRows('division_afc_west',   'bookmaker', BKR_DIV_AFC_WEST),
    ...outcomeRows('division_nfc_east',   'bookmaker', BKR_DIV_NFC_EAST),
    ...outcomeRows('division_nfc_north',  'bookmaker', BKR_DIV_NFC_NORTH),
    ...outcomeRows('division_nfc_south',  'bookmaker', BKR_DIV_NFC_SOUTH),
    ...outcomeRows('division_nfc_west',   'bookmaker', BKR_DIV_NFC_WEST),
    // BKR does not provide wins/playoffs totals — those come from BEO only

    // ── BetOnline ─────────────────────────────────────────────────────────────
    ...outcomeRows('superbowl',           'betonline', BEO_SUPERBOWL),
    ...outcomeRows('conference_afc',      'betonline', BEO_AFC),
    ...outcomeRows('conference_nfc',      'betonline', BEO_NFC),
    ...outcomeRows('division_afc_east',   'betonline', BEO_DIV_AFC_EAST),
    ...outcomeRows('division_afc_north',  'betonline', BEO_DIV_AFC_NORTH),
    ...outcomeRows('division_afc_south',  'betonline', BEO_DIV_AFC_SOUTH),
    ...outcomeRows('division_afc_west',   'betonline', BEO_DIV_AFC_WEST),
    ...outcomeRows('division_nfc_east',   'betonline', BEO_DIV_NFC_EAST),
    ...outcomeRows('division_nfc_north',  'betonline', BEO_DIV_NFC_NORTH),
    ...outcomeRows('division_nfc_south',  'betonline', BEO_DIV_NFC_SOUTH),
    ...outcomeRows('division_nfc_west',   'betonline', BEO_DIV_NFC_WEST),
    ...winTotalRows('betonline',  BEO_WIN_TOTALS),
    ...playoffRows('betonline',  BEO_PLAYOFFS),
  ];
}

// ── Write to Supabase ─────────────────────────────────────────────────────────
async function writeRows(rows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check for useEnhancedColumns (same guard as the existing agent)
  const { data: colCheck, error: colErr } = await supabase
    .from('futures_odds_snapshots')
    .select('selection')
    .limit(1);

  const useEnhanced = !colErr;

  const insertRows = rows.map((r) => {
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

  const { data, error } = await supabase
    .from('futures_odds_snapshots')
    .insert(insertRows)
    .select('id');

  if (error) {
    console.error('Supabase insert error:', error.message);
    process.exit(1);
  }

  return data ? data.length : insertRows.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  let rows = buildAllRows();

  if (PATCH_PLAYOFFS) {
    // Only the newly added playoff teams — skip any already written in run 1
    rows = playoffRows('betonline', BEO_PLAYOFFS.filter(
      (e) => !PLAYOFFS_ALREADY_WRITTEN.has(e.team)
    ));
    console.log(`\n[PATCH MODE] Adding missing BEO playoff rows only`);
  } else {
    console.log(`\nManual futures import — 2026-06-02 snapshot`);
    console.log(`Books: bookmaker, betonline`);
  }
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
        `  ${r.market_type.padEnd(22)} ${r.book.padEnd(12)} `
        + `${r.team.padEnd(28)} ${sign}${r.odds} `
        + `(${(r.implied_prob * 100).toFixed(1)}%)`
      );
    });
    console.log('\n[DRY RUN] No rows written. Remove --dry-run to import.');
    return;
  }

  console.log('\nWriting to Supabase...');
  const written = await writeRows(rows);
  console.log(`Done. Wrote ${written} rows to futures_odds_snapshots.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
