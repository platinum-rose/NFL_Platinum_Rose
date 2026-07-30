#!/usr/bin/env node
// Build the manually reviewed BetOnline 2026-07-29 futures import from BEO_*_0729 screenshots.
// Local-only: no network calls, no Supabase writes.

import fs from 'node:fs';
import path from 'node:path';

const SNAPSHOT_TIME = '2026-07-29T00:00:00Z';
const SEASON = 2026;
const BOOK = 'betonline';
const DEFAULT_OUT = 'data/futures-imports/betonline-2026-07-29.json';
const DEFAULT_REVIEW_OUT = 'docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md';

const KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];

const TEAMS = [
  'Arizona Cardinals',
  'Atlanta Falcons',
  'Baltimore Ravens',
  'Buffalo Bills',
  'Carolina Panthers',
  'Chicago Bears',
  'Cincinnati Bengals',
  'Cleveland Browns',
  'Dallas Cowboys',
  'Denver Broncos',
  'Detroit Lions',
  'Green Bay Packers',
  'Houston Texans',
  'Indianapolis Colts',
  'Jacksonville Jaguars',
  'Kansas City Chiefs',
  'Las Vegas Raiders',
  'Los Angeles Chargers',
  'Los Angeles Rams',
  'Miami Dolphins',
  'Minnesota Vikings',
  'New England Patriots',
  'New Orleans Saints',
  'New York Giants',
  'New York Jets',
  'Philadelphia Eagles',
  'Pittsburgh Steelers',
  'San Francisco 49ers',
  'Seattle Seahawks',
  'Tampa Bay Buccaneers',
  'Tennessee Titans',
  'Washington Commanders',
];

const SUPERBOWL = [
  ['Los Angeles Rams', 475],
  ['Buffalo Bills', 1000],
  ['Baltimore Ravens', 1100],
  ['Seattle Seahawks', 1100],
  ['Kansas City Chiefs', 1600],
  ['Los Angeles Chargers', 1800],
  ['Philadelphia Eagles', 1800],
  ['San Francisco 49ers', 1800],
  ['Denver Broncos', 2000],
  ['Detroit Lions', 2000],
  ['Green Bay Packers', 2000],
  ['Houston Texans', 2000],
  ['New England Patriots', 2000],
  ['Cincinnati Bengals', 2200],
  ['Chicago Bears', 2500],
  ['Dallas Cowboys', 2500],
  ['Jacksonville Jaguars', 2800],
  ['Minnesota Vikings', 4000],
  ['Tampa Bay Buccaneers', 5500],
  ['Washington Commanders', 5500],
  ['Indianapolis Colts', 6600],
  ['New York Giants', 6600],
  ['Pittsburgh Steelers', 8000],
  ['Atlanta Falcons', 10000],
  ['Carolina Panthers', 10000],
  ['Las Vegas Raiders', 10000],
  ['New Orleans Saints', 10000],
  ['Cleveland Browns', 25000],
  ['New York Jets', 25000],
  ['Tennessee Titans', 25000],
  ['Miami Dolphins', 40000],
  ['Arizona Cardinals', 50000],
];

const CONFERENCE_NFC = [
  ['Los Angeles Rams', 275],
  ['Seattle Seahawks', 575],
  ['Detroit Lions', 900],
  ['San Francisco 49ers', 900],
  ['Philadelphia Eagles', 1000],
  ['Green Bay Packers', 1100],
  ['Dallas Cowboys', 1200],
  ['Chicago Bears', 1400],
  ['Minnesota Vikings', 2200],
  ['Tampa Bay Buccaneers', 2500],
  ['Washington Commanders', 2800],
  ['New York Giants', 3300],
  ['New Orleans Saints', 4000],
  ['Carolina Panthers', 4000],
  ['Atlanta Falcons', 4000],
  ['Arizona Cardinals', 15000],
];

const CONFERENCE_AFC = [
  ['Buffalo Bills', 500],
  ['Baltimore Ravens', 500],
  ['Kansas City Chiefs', 700],
  ['Los Angeles Chargers', 800],
  ['New England Patriots', 850],
  ['Houston Texans', 900],
  ['Cincinnati Bengals', 950],
  ['Denver Broncos', 1000],
  ['Jacksonville Jaguars', 1200],
  ['Indianapolis Colts', 2500],
  ['Pittsburgh Steelers', 3300],
  ['Tennessee Titans', 6600],
  ['Las Vegas Raiders', 7500],
  ['Cleveland Browns', 10000],
  ['New York Jets', 12500],
  ['Miami Dolphins', 15000],
];

const DIVISIONS = {
  division_afc_east: [
    ['Buffalo Bills', -140],
    ['New England Patriots', 125],
    ['New York Jets', 2000],
    ['Miami Dolphins', 3300],
  ],
  division_nfc_west: [
    ['Los Angeles Rams', -105],
    ['Seattle Seahawks', 210],
    ['San Francisco 49ers', 300],
    ['Arizona Cardinals', 6000],
  ],
  division_afc_north: [
    ['Baltimore Ravens', -110],
    ['Cincinnati Bengals', 160],
    ['Pittsburgh Steelers', 550],
    ['Cleveland Browns', 2200],
  ],
  division_afc_south: [
    ['Houston Texans', 130],
    ['Jacksonville Jaguars', 190],
    ['Indianapolis Colts', 375],
    ['Tennessee Titans', 750],
  ],
  division_afc_west: [
    ['Kansas City Chiefs', 175],
    ['Los Angeles Chargers', 185],
    ['Denver Broncos', 210],
    ['Las Vegas Raiders', 1400],
  ],
  division_nfc_east: [
    ['Philadelphia Eagles', 130],
    ['Dallas Cowboys', 210],
    ['Washington Commanders', 425],
    ['New York Giants', 550],
  ],
  division_nfc_north: [
    ['Detroit Lions', 160],
    ['Green Bay Packers', 250],
    ['Chicago Bears', 320],
    ['Minnesota Vikings', 400],
  ],
  division_nfc_south: [
    ['Tampa Bay Buccaneers', 195],
    ['New Orleans Saints', 240],
    ['Atlanta Falcons', 325],
    ['Carolina Panthers', 325],
  ],
};

const WINS = [
  ['Arizona Cardinals', 4.5, 135, -165],
  ['Atlanta Falcons', 7.5, 100, -130],
  ['Baltimore Ravens', 11.5, 110, -140],
  ['Buffalo Bills', 10.5, -145, 115],
  ['Carolina Panthers', 7.5, 125, -155],
  ['Chicago Bears', 9.5, 100, -130],
  ['Cincinnati Bengals', 9.5, -170, 140],
  ['Cleveland Browns', 5.5, -115, -115],
  ['Dallas Cowboys', 9.5, 100, -130],
  ['Denver Broncos', 9.5, -130, 100],
  ['Detroit Lions', 10.5, -135, 105],
  ['Green Bay Packers', 9.5, -120, -110],
  ['Houston Texans', 9.5, -130, 100],
  ['Indianapolis Colts', 7.5, -135, 105],
  ['Jacksonville Jaguars', 9.5, 110, -140],
  ['Kansas City Chiefs', 10.5, 120, -150],
  ['Las Vegas Raiders', 5.5, -145, 115],
  ['Los Angeles Chargers', 9.5, -145, 115],
  ['Los Angeles Rams', 11.5, -145, 115],
  ['Miami Dolphins', 4.5, 145, -175],
  ['Minnesota Vikings', 8.5, -115, -115],
  ['New England Patriots', 9.5, -160, 130],
  ['New Orleans Saints', 7.5, -135, 105],
  ['New York Giants', 7.5, -110, -120],
  ['New York Jets', 5.5, -115, -115],
  ['Philadelphia Eagles', 9.5, -145, 115],
  ['Pittsburgh Steelers', 7.5, -145, 115],
  ['San Francisco 49ers', 10.5, 115, -145],
  ['Seattle Seahawks', 10.5, -130, 100],
  ['Tampa Bay Buccaneers', 8.5, 120, -150],
  ['Tennessee Titans', 6.5, 100, -130],
  ['Washington Commanders', 7.5, -130, 100],
];

const PLAYOFFS = [
  ['Arizona Cardinals', 2000, -10000],
  ['Atlanta Falcons', 205, -265],
  ['Baltimore Ravens', -325, 250],
  ['Buffalo Bills', -325, 250],
  ['Carolina Panthers', 250, -325],
  ['Chicago Bears', 105, -135],
  ['Cincinnati Bengals', -200, 160],
  ['Cleveland Browns', 700, -1400],
  ['Dallas Cowboys', -105, -125],
  ['Denver Broncos', -150, 120],
  ['Detroit Lions', -215, 175],
  ['Green Bay Packers', -120, -110],
  ['Houston Texans', -160, 130],
  ['Indianapolis Colts', 160, -200],
  ['Jacksonville Jaguars', -115, -115],
  ['Kansas City Chiefs', -180, 150],
  ['Las Vegas Raiders', 500, -800],
  ['Los Angeles Chargers', -170, 140],
  ['Los Angeles Rams', -500, 350],
  ['Miami Dolphins', 1400, -3000],
  ['Minnesota Vikings', 160, -200],
  ['New England Patriots', -220, 180],
  ['New Orleans Saints', 170, -210],
  ['New York Giants', 250, -325],
  ['New York Jets', 700, -1400],
  ['Philadelphia Eagles', -155, 125],
  ['Pittsburgh Steelers', 175, -215],
  ['San Francisco 49ers', -155, 125],
  ['Seattle Seahawks', -210, 170],
  ['Tampa Bay Buccaneers', 145, -175],
  ['Tennessee Titans', 400, -600],
  ['Washington Commanders', 220, -280],
];

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function impliedProb(americanOdds) {
  if (americanOdds == null) return null;
  const p = americanOdds > 0
    ? 100 / (americanOdds + 100)
    : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  return Math.round(p * 10000) / 10000;
}

function baseRow(marketType, team) {
  return {
    snapshot_time: SNAPSHOT_TIME,
    captured_at: SNAPSHOT_TIME,
    season: SEASON,
    book: BOOK,
    market_type: marketType,
    team,
    selection: team,
    odds: null,
    price: null,
    implied_prob: null,
    line: null,
    over_price: null,
    under_price: null,
  };
}

function outcomeRows(marketType, entries) {
  return entries.map(([team, odds]) => ({
    ...baseRow(marketType, team),
    odds,
    price: odds,
    implied_prob: impliedProb(odds),
  }));
}

function winRows(entries) {
  return entries.map(([team, line, overPrice, underPrice]) => ({
    ...baseRow('wins', team),
    odds: overPrice,
    price: overPrice,
    line,
    over_price: overPrice,
    under_price: underPrice,
  }));
}

function playoffRows(entries) {
  return entries.map(([team, yesOdds]) => ({
    ...baseRow('playoffs', team),
    odds: yesOdds,
    price: yesOdds,
    implied_prob: impliedProb(yesOdds),
  }));
}

function buildRows() {
  return [
    ...outcomeRows('superbowl', SUPERBOWL),
    ...outcomeRows('conference_nfc', CONFERENCE_NFC),
    ...outcomeRows('conference_afc', CONFERENCE_AFC),
    ...Object.entries(DIVISIONS).flatMap(([marketType, entries]) => outcomeRows(marketType, entries)),
    ...winRows(WINS),
    ...playoffRows(PLAYOFFS),
  ].map((r) => Object.fromEntries(KEYS.map((key) => [key, r[key] ?? null])));
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) counts.set(row[key], (counts.get(row[key]) || 0) + 1);
  return Object.fromEntries([...counts.entries()].sort());
}

function ensureExactTeams(label, rows) {
  const seen = new Set(rows.map((row) => row.team));
  const missing = TEAMS.filter((team) => !seen.has(team));
  const extra = [...seen].filter((team) => !TEAMS.includes(team));
  if (missing.length || extra.length || seen.size !== TEAMS.length) {
    throw new Error(`${label} team coverage failed: missing=${missing.join(', ') || 'none'} extra=${extra.join(', ') || 'none'}`);
  }
}

function validateRows(rows) {
  const expectedMarkets = {
    conference_afc: 16,
    conference_nfc: 16,
    division_afc_east: 4,
    division_afc_north: 4,
    division_afc_south: 4,
    division_afc_west: 4,
    division_nfc_east: 4,
    division_nfc_north: 4,
    division_nfc_south: 4,
    division_nfc_west: 4,
    playoffs: 32,
    superbowl: 32,
    wins: 32,
  };
  const markets = countBy(rows, 'market_type');
  if (JSON.stringify(markets) !== JSON.stringify(expectedMarkets)) {
    throw new Error(`Unexpected market counts: ${JSON.stringify(markets)}`);
  }
  if (rows.length !== 160) throw new Error(`Expected 160 rows, got ${rows.length}`);

  const keys = new Set();
  for (const row of rows) {
    const key = `${row.market_type}|${row.team}|${row.book}|${row.snapshot_time}`;
    if (keys.has(key)) throw new Error(`Duplicate row key: ${key}`);
    keys.add(key);
  }

  ensureExactTeams('superbowl', rows.filter((row) => row.market_type === 'superbowl'));
  ensureExactTeams('wins', rows.filter((row) => row.market_type === 'wins'));
  ensureExactTeams('playoffs', rows.filter((row) => row.market_type === 'playoffs'));
  ensureExactTeams('conference', rows.filter((row) => row.market_type.startsWith('conference_')));
  ensureExactTeams('division', rows.filter((row) => row.market_type.startsWith('division_')));
}

function odds(value) {
  return value > 0 ? `+${value}` : String(value);
}

function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

function buildReviewDoc(rows) {
  const marketCounts = countBy(rows, 'market_type');
  const lines = [
    '# BetOnline Futures Manual Review - 2026-07-29',
    '',
    'Purpose: preserve the local manual transcription of the July 29 BetOnline screenshot bundle used to generate `data/futures-imports/betonline-2026-07-29.json`.',
    '',
    'Status: local manual review only. No network calls, Supabase writes, official-pick approvals, recommendation persistence, or open-parlay changes were made.',
    '',
    '## Source Screenshots',
    '',
    '- `docs/Futures_Odds/BEO_SB_0729.PNG`',
    '- `docs/Futures_Odds/BEO_Conf_0729.PNG`',
    '- `docs/Futures_Odds/BEO_Div_0729.PNG`',
    '- `docs/Futures_Odds/BEO_RegWins1_0729.PNG`',
    '- `docs/Futures_Odds/BEO_RegWins2_0729.PNG`',
    '- `docs/Futures_Odds/BEO_RegWins3_0729.PNG`',
    '- `docs/Futures_Odds/BEO_MakePlayoffs1_0729.PNG`',
    '- `docs/Futures_Odds/BEO_MakePlayoffs2_0729.PNG`',
    '- `docs/Futures_Odds/BEO_MakePlayoffs3_0729.PNG`',
    '',
    '## Generated Import',
    '',
    `- Output: \`${DEFAULT_OUT}\``,
    `- Snapshot time: \`${SNAPSHOT_TIME}\``,
    `- Total rows: ${rows.length}`,
    `- Market counts: ${Object.entries(marketCounts).map(([market, count]) => `${market} ${count}`).join(', ')}`,
    '- The normalized import follows the existing local schema. For playoffs, the import row uses the `Yes` price; the full Yes/No transcription is retained below.',
    '',
    '## Super Bowl Winner',
    '',
    table(['Team', 'Price'], SUPERBOWL.map(([team, price]) => [team, odds(price)])),
    '',
    '## Conference Winner',
    '',
    '### AFC',
    '',
    table(['Team', 'Price'], CONFERENCE_AFC.map(([team, price]) => [team, odds(price)])),
    '',
    '### NFC',
    '',
    table(['Team', 'Price'], CONFERENCE_NFC.map(([team, price]) => [team, odds(price)])),
    '',
    '## Division Winner',
    '',
  ];

  for (const [marketType, entries] of Object.entries(DIVISIONS)) {
    lines.push(`### ${marketType.replace(/^division_/, '').replace(/_/g, ' ').toUpperCase()}`);
    lines.push('');
    lines.push(table(['Team', 'Price'], entries.map(([team, price]) => [team, odds(price)])));
    lines.push('');
  }

  lines.push(
    '## Regular Season Wins',
    '',
    table(['Team', 'Line', 'Over', 'Under'], WINS.map(([team, line, overPrice, underPrice]) => [
      team,
      String(line),
      odds(overPrice),
      odds(underPrice),
    ])),
    '',
    '## Make Playoffs',
    '',
    table(['Team', 'Yes', 'No'], PLAYOFFS.map(([team, yesOdds, noOdds]) => [
      team,
      odds(yesOdds),
      odds(noOdds),
    ])),
    '',
    '## Synthesis Caveat',
    '',
    'This artifact upgrades BetOnline from screenshot-current/exact-price-excluded to manually normalized for the markets listed above. Any market not listed here, including exact Super Bowl matchup, remains unavailable from BetOnline in the July 29 bundle.',
    '',
  );

  return lines.join('\n');
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const out = arg('--out', DEFAULT_OUT);
const reviewOut = arg('--review-out', DEFAULT_REVIEW_OUT);
const checkOnly = hasFlag('--check-only');
const rows = buildRows();
validateRows(rows);

console.log(`BetOnline 2026-07-29 manual import: ${rows.length} rows`);
for (const [market, count] of Object.entries(countBy(rows, 'market_type'))) {
  console.log(`  ${market}: ${count}`);
}

if (checkOnly) {
  console.log('[check-only] no files written');
  process.exit(0);
}

writeFile(out, `${JSON.stringify(rows, null, 1)}\n`);
writeFile(reviewOut, buildReviewDoc(rows));
console.log(`Wrote ${out}`);
console.log(`Wrote ${reviewOut}`);
