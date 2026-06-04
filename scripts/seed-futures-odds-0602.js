#!/usr/bin/env node
/**
 * scripts/seed-futures-odds-0602.js
 * One-time import of June 2, 2026 futures odds from BetOnline and Bookmaker.
 *
 * Sources:
 *   BetOnline  — transcribed from docs/Futures_Odds/BEO_*.png screenshots
 *   Bookmaker  — parsed from docs/Futures_Odds/BKR_Odds_0602 text file
 *
 * Markets covered:
 *   superbowl, conference_afc, conference_nfc,
 *   division_afc_east/north/south/west, division_nfc_east/north/south/west,
 *   wins (Over side only), playoffs (Yes side only)
 *
 * Usage:
 *   node scripts/seed-futures-odds-0602.js
 *   node scripts/seed-futures-odds-0602.js --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const DRY_RUN = process.argv.includes('--dry-run');
const SNAPSHOT_TIME = '2026-06-02T00:00:00.000Z';
const SEASON = 2026;

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  return createClient(url, key, { auth: { persistSession: false } });
}

function impliedProb(american) {
  if (american >= 100)  return parseFloat((100 / (american + 100)).toFixed(4));
  return parseFloat((Math.abs(american) / (Math.abs(american) + 100)).toFixed(4));
}

function row(team, market_type, book, odds, selection = null) {
  return {
    snapshot_time: SNAPSHOT_TIME,
    market_type,
    team,
    book,
    odds,
    implied_prob: impliedProb(odds),
    selection: selection ?? team,
    season: SEASON,
  };
}

// ── BetOnline data ─────────────────────────────────────────────────────────────

const BEO_SUPERBOWL = [
  ['Los Angeles Rams', 600], ['Seattle Seahawks', 1100], ['Baltimore Ravens', 1100],
  ['Buffalo Bills', 1100], ['Kansas City Chiefs', 1200], ['Los Angeles Chargers', 1600],
  ['San Francisco 49ers', 1600], ['New England Patriots', 1800], ['Philadelphia Eagles', 1800],
  ['Denver Broncos', 2000], ['Detroit Lions', 2000], ['Dallas Cowboys', 2200],
  ['Green Bay Packers', 2200], ['Cincinnati Bengals', 2200], ['Houston Texans', 2200],
  ['Jacksonville Jaguars', 2800], ['Minnesota Vikings', 4000], ['Indianapolis Colts', 5000],
  ['Washington Commanders', 5000], ['Tampa Bay Buccaneers', 6000], ['New York Giants', 6400],
  ['Carolina Panthers', 7500], ['Pittsburgh Steelers', 8000], ['Atlanta Falcons', 8000],
  ['Las Vegas Raiders', 8000], ['New Orleans Saints', 10000], ['Tennessee Titans', 15000],
  ['Arizona Cardinals', 25000], ['New York Jets', 25000], ['Miami Dolphins', 25000],
  ['Chicago Bears', 2500], ['Cleveland Browns', 30000],
].map(([team, odds]) => row(team, 'superbowl', 'betonline', odds));

const BEO_CONF_NFC = [
  ['Los Angeles Rams', 325], ['Seattle Seahawks', 550], ['San Francisco 49ers', 775],
  ['Detroit Lions', 900], ['Philadelphia Eagles', 975], ['Green Bay Packers', 1100],
  ['Dallas Cowboys', 1200], ['Chicago Bears', 1400], ['Minnesota Vikings', 2200],
  ['Tampa Bay Buccaneers', 2200], ['Washington Commanders', 2700], ['New York Giants', 3300],
  ['Atlanta Falcons', 3300], ['New Orleans Saints', 4000], ['Carolina Panthers', 4000],
  ['Arizona Cardinals', 15000],
].map(([team, odds]) => row(team, 'conference_nfc', 'betonline', odds));

const BEO_CONF_AFC = [
  ['Buffalo Bills', 475], ['Baltimore Ravens', 500], ['Kansas City Chiefs', 750],
  ['Los Angeles Chargers', 750], ['New England Patriots', 850], ['Houston Texans', 1000],
  ['Cincinnati Bengals', 1000], ['Denver Broncos', 1000], ['Jacksonville Jaguars', 1200],
  ['Indianapolis Colts', 2200], ['Pittsburgh Steelers', 3300], ['Las Vegas Raiders', 4000],
  ['Tennessee Titans', 7000], ['New York Jets', 10000], ['Cleveland Browns', 12500],
  ['Miami Dolphins', 15000],
].map(([team, odds]) => row(team, 'conference_afc', 'betonline', odds));

const BEO_DIV_AFC_EAST = [
  ['Buffalo Bills', -145], ['New England Patriots', 130], ['New York Jets', 2000], ['Miami Dolphins', 2800],
].map(([team, odds]) => row(team, 'division_afc_east', 'betonline', odds));

const BEO_DIV_AFC_NORTH = [
  ['Baltimore Ravens', -120], ['Cincinnati Bengals', 185], ['Pittsburgh Steelers', 550], ['Cleveland Browns', 1800],
].map(([team, odds]) => row(team, 'division_afc_north', 'betonline', odds));

const BEO_DIV_AFC_SOUTH = [
  ['Houston Texans', 140], ['Jacksonville Jaguars', 185], ['Indianapolis Colts', 350], ['Tennessee Titans', 750],
].map(([team, odds]) => row(team, 'division_afc_south', 'betonline', odds));

const BEO_DIV_AFC_WEST = [
  ['Kansas City Chiefs', 175], ['Los Angeles Chargers', 180], ['Denver Broncos', 210], ['Las Vegas Raiders', 1600],
].map(([team, odds]) => row(team, 'division_afc_west', 'betonline', odds));

const BEO_DIV_NFC_EAST = [
  ['Philadelphia Eagles', 148], ['Dallas Cowboys', 200], ['Washington Commanders', 400], ['New York Giants', 550],
].map(([team, odds]) => row(team, 'division_nfc_east', 'betonline', odds));

const BEO_DIV_NFC_NORTH = [
  ['Detroit Lions', 155], ['Green Bay Packers', 260], ['Chicago Bears', 310], ['Minnesota Vikings', 425],
].map(([team, odds]) => row(team, 'division_nfc_north', 'betonline', odds));

const BEO_DIV_NFC_SOUTH = [
  ['Tampa Bay Buccaneers', 180], ['New Orleans Saints', 265], ['Atlanta Falcons', 315], ['Carolina Panthers', 325],
].map(([team, odds]) => row(team, 'division_nfc_south', 'betonline', odds));

const BEO_DIV_NFC_WEST = [
  ['Los Angeles Rams', 100], ['Seattle Seahawks', 295], ['San Francisco 49ers', 290], ['Arizona Cardinals', 4000],
].map(([team, odds]) => row(team, 'division_nfc_west', 'betonline', odds));

// Wins — Over side only (line stored in selection field)
const BEO_WINS = [
  ['Arizona Cardinals',    4.5,  120], ['Atlanta Falcons',       7.5,  105],
  ['Baltimore Ravens',    11.5,  105], ['Buffalo Bills',         10.5, -130],
  ['Carolina Panthers',    7.5,  105], ['Chicago Bears',          9.5,  100],
  ['Cincinnati Bengals',   9.5, -145], ['Cleveland Browns',       5.5,  100],
  ['Dallas Cowboys',       9.5, -105], ['Denver Broncos',         9.5, -125],
  ['Detroit Lions',       10.5, -130], ['Houston Texans',         9.5, -130],
  ['Indianapolis Colts',   7.5, -135], ['Jacksonville Jaguars',   9.5,  110],
  ['Kansas City Chiefs',  10.5,  125], ['Las Vegas Raiders',       5.5, -150],
  ['Los Angeles Chargers', 9.5, -135], ['Los Angeles Rams',       11.5, -130],
  ['Miami Dolphins',       4.5,  115], ['Minnesota Vikings',       8.5, -110],
  ['New England Patriots', 9.5, -135], ['New Orleans Saints',      7.5, -125],
  ['New York Giants',      7.5, -115], ['New York Jets',            5.5, -105],
  ['Philadelphia Eagles', 10.5,  120], ['Pittsburgh Steelers',     7.5, -145],
  ['San Francisco 49ers', 10.5,  105], ['Seattle Seahawks',        10.5, -135],
  ['Tampa Bay Buccaneers', 8.5,  105], ['Tennessee Titans',         6.5, -115],
  ['Washington Commanders',7.5, -130],
].map(([team, line, odds]) => row(team, 'wins', 'betonline', odds, `Over ${line}`));

// Playoffs — Yes side only
const BEO_PLAYOFFS = [
  ['Arizona Cardinals',    1600], ['Atlanta Falcons',      195],
  ['Baltimore Ravens',     -350], ['Buffalo Bills',        -350],
  ['Carolina Panthers',    235],  ['Chicago Bears',         105],
  ['Cincinnati Bengals',   -175], ['Cleveland Browns',      600],
  ['Dallas Cowboys',       100],  ['Denver Broncos',       -155],
  ['Detroit Lions',        -200], ['Houston Texans',       -165],
  ['Indianapolis Colts',   150],  ['Jacksonville Jaguars', -125],
  ['Kansas City Chiefs',   -190], ['Las Vegas Raiders',     500],
  ['Los Angeles Chargers', -170], ['Los Angeles Rams',     -450],
  ['Miami Dolphins',       1200], ['Minnesota Vikings',     180],
  ['New England Patriots', -210], ['New Orleans Saints',    185],
  ['New York Giants',      240],  ['New York Jets',          700],
  ['Philadelphia Eagles',  -155], ['Pittsburgh Steelers',   190],
  ['San Francisco 49ers',  -160], ['Seattle Seahawks',     -260],
  ['Tampa Bay Buccaneers',  130], ['Tennessee Titans',      350],
  ['Washington Commanders', 190],
].map(([team, odds]) => row(team, 'playoffs', 'betonline', odds, 'Yes'));

// ── Bookmaker data ─────────────────────────────────────────────────────────────

const BKR_SUPERBOWL = [
  ['Arizona Cardinals', 40329], ['Atlanta Falcons', 8873],   ['Baltimore Ravens', 1261],
  ['Buffalo Bills', 976],        ['Carolina Panthers', 10084], ['Chicago Bears', 2522],
  ['Cincinnati Bengals', 1918],  ['Cleveland Browns', 35287],  ['Dallas Cowboys', 2370],
  ['Denver Broncos', 2018],      ['Detroit Lions', 1715],       ['Green Bay Packers', 2510],
  ['Houston Texans', 2018],      ['Indianapolis Colts', 5042],  ['Jacksonville Jaguars', 2874],
  ['Kansas City Chiefs', 1463],  ['Las Vegas Raiders', 13517],  ['Los Angeles Chargers', 1488],
  ['Los Angeles Rams', 510],     ['Miami Dolphins', 25206],     ['Minnesota Vikings', 4236],
  ['New England Patriots', 1646],['New Orleans Saints', 12605], ['New York Giants', 6546],
  ['New York Jets', 30248],      ['Philadelphia Eagles', 1664], ['Pittsburgh Steelers', 6051],
  ['San Francisco 49ers', 1753], ['Seattle Seahawks', 1122],    ['Tampa Bay Buccaneers', 6051],
  ['Tennessee Titans', 17562],   ['Washington Commanders', 5721],
].map(([team, odds]) => row(team, 'superbowl', 'bookmaker', odds));

const BKR_CONF_AFC = [
  ['Baltimore Ravens', 501],    ['Buffalo Bills', 489],       ['Cincinnati Bengals', 901],
  ['Cleveland Browns', 15196],  ['Denver Broncos', 1001],     ['Houston Texans', 876],
  ['Indianapolis Colts', 2534], ['Jacksonville Jaguars', 1166],['Kansas City Chiefs', 730],
  ['Las Vegas Raiders', 6585],  ['Los Angeles Chargers', 730], ['Miami Dolphins', 12156],
  ['New England Patriots', 829],['New York Jets', 15196],      ['Pittsburgh Steelers', 2970],
  ['Tennessee Titans', 8555],
].map(([team, odds]) => row(team, 'conference_afc', 'bookmaker', odds));

const BKR_CONF_NFC = [
  ['Arizona Cardinals', 20000], ['Atlanta Falcons', 4500],   ['Carolina Panthers', 5000],
  ['Chicago Bears', 1300],      ['Dallas Cowboys', 1200],    ['Detroit Lions', 825],
  ['Green Bay Packers', 1165],  ['Los Angeles Rams', 255],   ['Minnesota Vikings', 2000],
  ['New Orleans Saints', 5700], ['New York Giants', 3300],   ['Philadelphia Eagles', 935],
  ['San Francisco 49ers', 888], ['Seattle Seahawks', 560],   ['Tampa Bay Buccaneers', 3000],
  ['Washington Commanders', 2850],
].map(([team, odds]) => row(team, 'conference_nfc', 'bookmaker', odds));

const BKR_DIV_AFC_EAST = [
  ['Buffalo Bills', -162], ['Miami Dolphins', 3007], ['New England Patriots', 134], ['New York Jets', 3007],
].map(([team, odds]) => row(team, 'division_afc_east', 'bookmaker', odds));

const BKR_DIV_AFC_NORTH = [
  ['Baltimore Ravens', -120], ['Cincinnati Bengals', 175], ['Cleveland Browns', 1850], ['Pittsburgh Steelers', 565],
].map(([team, odds]) => row(team, 'division_afc_north', 'bookmaker', odds));

const BKR_DIV_AFC_SOUTH = [
  ['Houston Texans', 133], ['Indianapolis Colts', 300], ['Jacksonville Jaguars', 210], ['Tennessee Titans', 825],
].map(([team, odds]) => row(team, 'division_afc_south', 'bookmaker', odds));

const BKR_DIV_AFC_WEST = [
  ['Denver Broncos', 195], ['Kansas City Chiefs', 183], ['Las Vegas Raiders', 1473], ['Los Angeles Chargers', 182],
].map(([team, odds]) => row(team, 'division_afc_west', 'bookmaker', odds));

const BKR_DIV_NFC_EAST = [
  ['Dallas Cowboys', 185], ['New York Giants', 550], ['Philadelphia Eagles', 150], ['Washington Commanders', 385],
].map(([team, odds]) => row(team, 'division_nfc_east', 'bookmaker', odds));

const BKR_DIV_NFC_NORTH = [
  ['Chicago Bears', 335], ['Detroit Lions', 140], ['Green Bay Packers', 265], ['Minnesota Vikings', 425],
].map(([team, odds]) => row(team, 'division_nfc_north', 'bookmaker', odds));

const BKR_DIV_NFC_SOUTH = [
  ['Atlanta Falcons', 340], ['Carolina Panthers', 280], ['New Orleans Saints', 265], ['Tampa Bay Buccaneers', 190],
].map(([team, odds]) => row(team, 'division_nfc_south', 'bookmaker', odds));

const BKR_DIV_NFC_WEST = [
  ['Arizona Cardinals', 8000], ['Los Angeles Rams', -120], ['San Francisco 49ers', 335], ['Seattle Seahawks', 210],
].map(([team, odds]) => row(team, 'division_nfc_west', 'bookmaker', odds));

// ── Assemble all rows ─────────────────────────────────────────────────────────

const ALL_ROWS = [
  ...BEO_SUPERBOWL,
  ...BEO_CONF_NFC, ...BEO_CONF_AFC,
  ...BEO_DIV_AFC_EAST, ...BEO_DIV_AFC_NORTH, ...BEO_DIV_AFC_SOUTH, ...BEO_DIV_AFC_WEST,
  ...BEO_DIV_NFC_EAST, ...BEO_DIV_NFC_NORTH, ...BEO_DIV_NFC_SOUTH, ...BEO_DIV_NFC_WEST,
  ...BEO_WINS, ...BEO_PLAYOFFS,
  ...BKR_SUPERBOWL,
  ...BKR_CONF_AFC, ...BKR_CONF_NFC,
  ...BKR_DIV_AFC_EAST, ...BKR_DIV_AFC_NORTH, ...BKR_DIV_AFC_SOUTH, ...BKR_DIV_AFC_WEST,
  ...BKR_DIV_NFC_EAST, ...BKR_DIV_NFC_NORTH, ...BKR_DIV_NFC_SOUTH, ...BKR_DIV_NFC_WEST,
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏈 Futures odds seed — ${SNAPSHOT_TIME}`);
  console.log(`   Total rows: ${ALL_ROWS.length} | DRY_RUN=${DRY_RUN}`);

  // Quick validation
  const invalid = ALL_ROWS.filter(r => !r.team || !r.market_type || isNaN(r.odds));
  if (invalid.length) {
    console.error(`❌ ${invalid.length} invalid rows:`, invalid.slice(0, 3));
    process.exit(1);
  }

  // Summary by book + market
  const summary = {};
  for (const r of ALL_ROWS) {
    const k = `${r.book}/${r.market_type}`;
    summary[k] = (summary[k] || 0) + 1;
  }
  for (const [k, n] of Object.entries(summary).sort()) {
    console.log(`   ${k.padEnd(45)} ${n} rows`);
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — no writes.');
    return;
  }

  const supabase = getSupabase();

  // Detect schema — migration 022 adds selection/season columns + the unique constraint.
  // If not yet applied, fall back to basic 5-column insert and use ignoreDuplicates
  // instead of onConflict (which requires the named constraint).
  const { error: schemaErr } = await supabase
    .from('futures_odds_snapshots').select('selection').limit(1);
  const hasEnhanced = !schemaErr?.message?.toLowerCase().includes('selection');
  const hasConstraint = hasEnhanced; // constraint ships with same migration
  console.log(`   Schema: ${hasEnhanced ? 'enhanced (selection column present)' : 'basic (pre-migration 022)'}`);

  const BATCH = 200;
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < ALL_ROWS.length; i += BATCH) {
    const batch = ALL_ROWS.slice(i, i + BATCH).map(r => {
      if (hasEnhanced) return r;
      // Strip columns that don't exist in basic schema
      const { selection, season, ...basic } = r; // eslint-disable-line no-unused-vars
      return basic;
    });

    let result;
    if (hasConstraint) {
      result = await supabase
        .from('futures_odds_snapshots')
        .upsert(batch, { onConflict: 'market_type,team,book,snapshot_time' });
    } else {
      // Without the unique constraint we can't upsert — insert and ignore duplicates
      result = await supabase
        .from('futures_odds_snapshots')
        .insert(batch, { ignoreDuplicates: true });
    }

    if (result.error) {
      console.error(`\n❌ Write error at batch ${i}:`, result.error.message);
      process.exit(1);
    }
    written += batch.length;
    process.stdout.write(`\r   Wrote ${written}/${ALL_ROWS.length} rows…`);
  }

  console.log(`\n✅ Done — ${written} rows written into futures_odds_snapshots.`);
  if (!hasEnhanced) {
    console.log('   ℹ️  selection/season columns not written — apply migration 022 then re-run to add them.');
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
