#!/usr/bin/env node
// Parse plain-text NFL futures exports into uniform futures snapshot JSON.
// Output is designed for scripts/ingest_futures_json.py.

import fs from 'node:fs';
import path from 'node:path';

const KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];

const FULL_TEAMS = new Set([
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders',
]);

const ABBREV = new Map(Object.entries({
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LVR: 'Las Vegas Raiders',
  LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams',
  'LA CHARGERS': 'Los Angeles Chargers', 'LA RAMS': 'Los Angeles Rams',
  MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots',
  NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets',
  'NY GIANTS': 'New York Giants', 'NY JETS': 'New York Jets',
  PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers',
  SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders',
}));

const NICK = new Map();
for (const team of FULL_TEAMS) NICK.set(team.split(' ').at(-1).toLowerCase().replace(/[^a-z0-9]/g, ''), team);
NICK.set('detriotlions', 'Detroit Lions');
NICK.set('detriot', 'Detroit Lions');
NICK.set('49ers', 'San Francisco 49ers');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function cleanText(s) {
  return String(s ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/\u00a0/g, ' ')
    .replace(/Â½/g, '.5')
    .replace(/½/g, '.5')
    .replace(/ Detriot /g, ' Detroit ');
}

function normLine(s) {
  return cleanText(s).trim().replace(/[ \t]+/g, ' ');
}

function canonTeam(name) {
  const raw = normLine(name);
  if (FULL_TEAMS.has(raw)) return raw;
  let upper = raw.toUpperCase();
  if (ABBREV.has(upper)) return ABBREV.get(upper);
  upper = upper.replace(/\s+(CARDINALS|FALCONS|RAVENS|BILLS|PANTHERS|BEARS|BENGALS|BROWNS|COWBOYS|BRONCOS|LIONS|PACKERS|TEXANS|COLTS|JAGUARS|CHIEFS|RAIDERS|CHARGERS|RAMS|DOLPHINS|VIKINGS|PATRIOTS|SAINTS|GIANTS|JETS|EAGLES|STEELERS|49ERS|SEAHAWKS|BUCCANEERS|TITANS|COMMANDERS)$/, '');
  if (ABBREV.has(upper)) return ABBREV.get(upper);
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (NICK.has(key)) return NICK.get(key);
  const last = raw.split(' ').at(-1)?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  return NICK.get(last) || raw;
}

function parsePrice(s) {
  const x = normLine(s);
  if (/^(ev|even|even money)$/i.test(x)) return 100;
  if (/^[+-]?\d+$/.test(x)) return Number(x);
  return null;
}

function implied(odds) {
  if (odds == null) return null;
  const p = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
  return Math.round(p * 10000) / 10000;
}

function bkrMarket(line) {
  const h = line.toUpperCase();
  if (h.includes('MOST WINS')) return 'most_wins';
  if (h.includes('FEWEST WINS')) return 'least_wins';
  if (h.includes('SUPER BOWL')) return 'superbowl';
  if (h.includes('AFC 1 SEED') || h.includes('NFC 1 SEED')) return 'conference_no_1_seed';
  for (const conf of ['AFC', 'NFC']) {
    for (const div of ['EAST', 'NORTH', 'SOUTH', 'WEST']) {
      if (h.includes(`WIN ${conf} ${div}`)) return `division_${conf.toLowerCase()}_${div.toLowerCase()}`;
    }
  }
  if (/\bWIN AFC\b/.test(h)) return 'conference_afc';
  if (/\bWIN NFC\b/.test(h)) return 'conference_nfc';
  return null;
}

function unsupportedBkrHeading(line) {
  const h = line.toUpperCase();
  return [
    'LAST UNDEFEATED TEAM',
    'STAGE OF ELIMINATION',
  ].some((pattern) => h.includes(pattern));
}

function betusMarket(header) {
  const h = header.toUpperCase();
  if (h.includes('AFC CONFERENCE WINNER')) return 'conference_afc';
  if (h.includes('NFC CONFERENCE WINNER')) return 'conference_nfc';
  for (const conf of ['AFC', 'NFC']) {
    for (const div of ['EAST', 'NORTH', 'SOUTH', 'WEST']) {
      if (h.includes(`${conf} ${div} WINNER`)) return `division_${conf.toLowerCase()}_${div.toLowerCase()}`;
    }
  }
  if (h.includes('FEWEST REGULAR SEASON WINS')) return 'least_wins';
  if (h.includes('MOST REGULAR SEASON WINS')) return 'most_wins';
  if (h.includes('SUPER BOWL MATCHUPS')) return 'superbowl_matchup';
  if (h.includes('SUPER BOWL LXI WINNER') || h.includes('SUPER BOWL WINNER')) return 'superbowl';
  return null;
}

function row(book, market, team, odds, when, season, line = null, overPrice = null, underPrice = null) {
  const r = Object.fromEntries(KEYS.map((k) => [k, null]));
  Object.assign(r, {
    snapshot_time: when,
    captured_at: when,
    season,
    book,
    market_type: market,
    team,
    selection: team,
  });
  if (market === 'wins') {
    Object.assign(r, { odds: overPrice, price: overPrice, line, over_price: overPrice, under_price: underPrice });
  } else {
    Object.assign(r, { odds, price: odds, implied_prob: implied(odds) });
  }
  return r;
}

function parseBookmaker(lines, book, when, season) {
  const rows = [];
  let section = null;
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line) { i++; continue; }
    const market = bkrMarket(line);
    if (market) { section = market; i++; continue; }
    if (unsupportedBkrHeading(line)) { section = null; i++; continue; }
    if (line.toUpperCase().startsWith('MAKE THE PLAYOFFS')) { section = 'playoffs'; i++; continue; }
    if (line.toUpperCase().startsWith('REGULAR SEASON WINS')) { section = 'wins'; i++; continue; }
    if (line.toUpperCase().startsWith('NFL REGULAR SEASON WINS')) { section = 'wins'; }
    if (/^(AWAY|HOME|SPREAD|TOTAL|MONEY LINE|MORE|NFL 2026\/27)$/i.test(line)) { i++; continue; }

    if (section && section !== 'playoffs' && section !== 'wins') {
      const odds = parsePrice(lines[i + 1]);
      if (odds != null && !/^[+-]?\d+$/.test(line)) {
        rows.push(row(book, section, canonTeam(line), odds, when, season));
        i += 2;
        continue;
      }
    }

    const playoff = line.match(/^(.+?) TO MAKE THE PLAYOFFS$/i);
    if (playoff) {
      section = 'playoffs';
      const team = canonTeam(playoff[1]);
      const prices = lines.slice(i + 1, i + 8).map(parsePrice).filter((p) => p != null);
      if (prices.length) rows.push(row(book, 'playoffs', team, prices[0], when, season));
      i++;
      continue;
    }

    if (section === 'wins' && line.toUpperCase() === 'NFL REGULAR SEASON WINS 2026/27') {
      const win = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].toUpperCase() === 'NFL REGULAR SEASON WINS 2026/27') break;
        if (bkrMarket(lines[j]) || lines[j].toUpperCase().startsWith('MAKE THE PLAYOFFS')) break;
        win.push(lines[j]);
      }
      let team = null, lineNum = null, overPrice = null, underPrice = null;
      for (let j = 0; j < win.length; j++) {
        if (!team && FULL_TEAMS.has(win[j])) team = win[j];
        const over = win[j].match(/^o(\d+(?:\.\d+)?)$/i);
        const under = win[j].match(/^u(\d+(?:\.\d+)?)$/i);
        if (over) { lineNum = Number(over[1]); overPrice = parsePrice(win[j + 1]); }
        if (under) underPrice = parsePrice(win[j + 1]);
      }
      if (team && lineNum != null && overPrice != null) rows.push(row(book, 'wins', team, overPrice, when, season, lineNum, overPrice, underPrice));
      i++;
      continue;
    }
    i++;
  }
  return rows;
}

const ROW_RE = /^(\d{3,5})\s+(.+?)\s+(Ev|[+-]\d+)\s*$/i;

function parseBetus(lines, book, when, season) {
  const rows = [];
  let currentMarket = null;
  let currentTeam = null;
  let currentWinsTeam = null;
  let pendingWin = null;
  let inAlternateWins = false;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('NFL Alternate Season Wins :')) {
      currentMarket = null;
      currentTeam = null;
      currentWinsTeam = null;
      pendingWin = null;
      inAlternateWins = true;
      continue;
    }
    if (line.startsWith('Rot ')) {
      const header = line.slice(4);
      if (inAlternateWins) {
        currentMarket = null;
        currentTeam = null;
        currentWinsTeam = null;
        pendingWin = null;
        continue;
      }
      currentMarket = betusMarket(header);
      currentTeam = null;
      currentWinsTeam = null;
      pendingWin = null;
      const playoff = header.match(/(.+?) to make the playoffs/i);
      if (playoff) {
        currentMarket = 'playoffs';
        currentTeam = canonTeam(playoff[1]);
      }
      const wins = header.match(/^(.+?) - 2026-2027 NFL Regular Season Wins/i);
      if (wins) {
        currentMarket = 'wins';
        currentWinsTeam = canonTeam(wins[1]);
      }
      continue;
    }
    if (line.startsWith('NFL Regular Season Wins :')) {
      inAlternateWins = false;
      currentMarket = 'wins';
      currentWinsTeam = canonTeam(line.split(':').slice(1).join(':'));
      pendingWin = null;
      continue;
    }
    if (/^All wager|^All Regular/i.test(line)) {
      currentMarket = null;
      currentTeam = null;
      currentWinsTeam = null;
      pendingWin = null;
      continue;
    }

    const m = line.match(ROW_RE);
    if (!m) continue;
    const selection = normLine(m[2]);
    const price = parsePrice(m[3]);
    if (price == null) continue;

    if (currentMarket === 'wins') {
      const w = selection.match(/^(Over|Under)\s+(\d+(?:\.\d+)?)\s+Wins$/i);
      if (!w || !currentWinsTeam) continue;
      const side = w[1].toLowerCase();
      const lineNum = Number(w[2]);
      if (side === 'over') pendingWin = { line: lineNum, overPrice: price };
      else if (pendingWin && pendingWin.line === lineNum) {
        rows.push(row(book, 'wins', currentWinsTeam, pendingWin.overPrice, when, season, lineNum, pendingWin.overPrice, price));
        pendingWin = null;
      }
      continue;
    }

    if (currentMarket === 'playoffs') {
      if (selection.toLowerCase() === 'yes' && currentTeam) rows.push(row(book, 'playoffs', currentTeam, price, when, season));
      continue;
    }

    if (currentMarket) {
      const team = currentMarket === 'superbowl_matchup' ? selection : canonTeam(selection);
      rows.push(row(book, currentMarket, team, price, when, season));
    }
  }
  return rows;
}

function winBalance(row) {
  const over = implied(row.over_price);
  const under = implied(row.under_price);
  if (over == null || under == null) return Number.POSITIVE_INFINITY;
  return Math.abs(over - under);
}

function normalizeRows(rows) {
  const nonWins = new Map();
  const wins = new Map();
  for (const r of rows) {
    if (r.market_type === 'wins') {
      const key = [r.book, r.snapshot_time, r.team].join('|');
      const prev = wins.get(key);
      if (!prev || winBalance(r) < winBalance(prev)) wins.set(key, r);
      continue;
    }
    const key = [r.market_type, r.team, r.book, r.snapshot_time].join('|');
    if (!nonWins.has(key)) nonWins.set(key, r);
  }
  return [...nonWins.values(), ...wins.values()];
}

function captureDate(file, explicit) {
  if (explicit) return explicit;
  const m = path.basename(file).match(/(20\d{6})/);
  if (!m) return new Date().toISOString().slice(0, 10);
  return `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;
}

const file = arg('--file');
const book = arg('--book');
const out = arg('--out');
const season = Number(arg('--season', '2026'));
if (!file || !book || !out) {
  console.error('usage: node scripts/parse-futures-text.js --file <text> --book bookmaker|betus --out <json> [--date YYYY-MM-DD] [--season 2026]');
  process.exit(2);
}
const d = captureDate(file, arg('--date'));
const when = `${d}T00:00:00Z`;
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(normLine);
const rows = book === 'bookmaker'
  ? parseBookmaker(lines, book, when, season)
  : parseBetus(lines, book, when, season);
const normalized = normalizeRows(rows).map((r) => Object.fromEntries(KEYS.map((k) => [k, r[k] ?? null])));
const counts = new Map();
for (const r of normalized) counts.set(r.market_type, (counts.get(r.market_type) || 0) + 1);
console.log(`Parsed ${normalized.length} rows from ${path.basename(file)} book=${book} date=${d}`);
for (const [market, count] of [...counts.entries()].sort()) console.log(`  ${market}: ${count}`);
fs.writeFileSync(out, JSON.stringify(normalized, null, 1) + '\n');
console.log(`Wrote ${out}`);
