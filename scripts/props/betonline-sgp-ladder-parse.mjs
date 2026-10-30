#!/usr/bin/env node
// scripts/props/betonline-sgp-ladder-parse.mjs
// Parses BetOnline's same-game-parlay builder text ("Game Markets (Parlays only)" page,
// copied as plain text) into player ladder rows: player, team, market, N+ threshold, price.
// This is the only BetOnline board that lists player tackles + assists, sacks and defender
// INTs; the straight-bet board the cron captures has only team/game sack totals.
//
// Usage:
//   node scripts/props/betonline-sgp-ladder-parse.mjs <board.txt> --game CAR@GB --captured 2026-10-29T15:59:00-07:00 [--week 8]
//   node scripts/props/betonline-sgp-ladder-parse.mjs --drop
//     Parses every .txt in data/intake-drop/beo-sgp/ (one game's copied page per file). The game is read
//     from the board's spread lines and oriented with public/schedule.json; the capture time comes from a
//     YYYY-MM-DD-HHMM in the file name (local time), else the file's modified time.
// Writes data/generated/props/betonline-sgp-<date>-<away>-at-<home>.json (betonline_sgp_ladders_v1).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const TEAM_ABBR = {
  'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI', 'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET', 'Green Bay Packers': 'GB', 'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT', 'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WSH',
};

export const SECTION_MARKETS = {
  'touchdowns': 'atd', 'passing yards': 'pass_yds', 'pass completions': 'pass_cmp', 'passing tds': 'pass_td',
  'pass attempts': 'pass_att', 'pass interceptions': 'pass_int', 'rushing yards': 'rush_yds', 'carries': 'carries',
  'receiving yards': 'rec_yds', 'receptions': 'rec', 'tackles + assists': 'tackles_assists', 'tackles': 'tackles',
  'solo tackles': 'tackles', 'assists': 'assists', 'sacks': 'sacks', 'interceptions': 'def_int',
};
export const DEFENSIVE_MARKETS = new Set(['tackles_assists', 'tackles', 'assists', 'sacks', 'def_int', 'pass_int']);

const PRICE = /^[+-]\d{2,6}$/;
const THRESH = /^(\d+)\+$/;

export function parseBetOnlineSgpText(text, { game = null, capturedAt = null } = {}) {
  const L = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const rows = []; const unknownSections = new Set();
  let market = null; let skip = false;
  for (let i = 0; i < L.length; i++) {
    const line = L[i]; const key = line.toLowerCase();
    if (/\((bands|exact)\)$/i.test(line)) { skip = true; market = null; continue; } // Andy does not play these
    if (SECTION_MARKETS[key] && TEAM_ABBR[L[i + 2]] && !TEAM_ABBR[L[i + 1]]) { market = SECTION_MARKETS[key]; skip = false; continue; }
    if (!TEAM_ABBR[L[i + 1]] || PRICE.test(line) || THRESH.test(line) || TEAM_ABBR[line]) continue;
    // line is a player name followed by a team line; an unknown header right before would have been consumed above
    if (!market || skip) { if (!skip && i > 0 && !PRICE.test(L[i - 1])) unknownSections.add(L[i - 1]); continue; }
    const player = line; const team = TEAM_ABBR[L[i + 1]];
    let j = i + 2;
    while (j + 1 < L.length && THRESH.test(L[j]) && PRICE.test(L[j + 1])) {
      const n = Number(L[j].match(THRESH)[1]);
      rows.push({ book: 'BEO', source: 'betonline_sgp_builder', game, capturedAt, market, player, team, threshold: n, line: n - 0.5, american: Number(L[j + 1]) });
      j += 2;
    }
    i = j - 1;
  }
  return { rows, unknownSections: [...unknownSections] };
}

// File-name times are Pacific wall-clock (Andy's clock), whatever timezone this process runs in.
export function pacificToIso(date, hh, mm) {
  const guess = new Date(`${date}T${hh}:${mm}:00Z`);
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'shortOffset' })
    .formatToParts(guess).find(p => p.type === 'timeZoneName').value; // e.g. GMT-7
  const off = Number((tzName.match(/GMT([+-]\d+)/) || [0, 0])[1]);
  return new Date(guess.getTime() - off * 3600 * 1000).toISOString();
}

// The board opens with the spread: "CAR (+3.5)" then "GB (-3.5)". Returns the two abbreviations in page order.
export function inferTeams(text) {
  const m = [...String(text).matchAll(/^\s*([A-Z]{2,3}) \([+-]?\d+(?:\.\d)?\)\s*$/gm)].map(x => x[1]);
  return m.length >= 2 ? [m[0], m[1]] : null;
}

function scheduleGame(teams, date) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'schedule.json'), 'utf8'));
    const games = Array.isArray(s) ? s : s.games || [];
    const norm = (t) => (t === 'WAS' ? 'WSH' : t);
    const set = new Set(teams.map(norm));
    const cands = games.filter(g => set.has(g.visitor) && set.has(g.home));
    const t = Date.parse(date);
    cands.sort((a, b) => Math.abs(Date.parse(a.kickoff_utc) - t) - Math.abs(Date.parse(b.kickoff_utc) - t));
    return cands[0] || null;
  } catch { return null; }
}

function runDrop() {
  const dir = path.join(ROOT, 'data', 'intake-drop', 'beo-sgp');
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.txt')).map(f => path.join(dir, f))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (!files.length) { console.log(`No .txt boards in ${path.relative(ROOT, dir)}`); return; }
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const m = path.basename(f).match(/(\d{4}-\d{2}-\d{2})[-_ T](\d{2})(\d{2})/);
    const capturedAt = m ? pacificToIso(m[1], m[2], m[3]) : fs.statSync(f).mtime.toISOString();
    const teams = inferTeams(text);
    const g = teams && scheduleGame(teams, capturedAt);
    if (!g) { console.warn(`skip ${path.basename(f)}: could not identify the game`); continue; }
    writeBoard(f, text, { game: `${g.visitor}@${g.home}`, capturedAt, week: Number(g.week) });
  }
}

function writeBoard(file, text, { game, capturedAt, week }) {
  const { rows, unknownSections } = parseBetOnlineSgpText(text, { game, capturedAt });
  const [away, home] = game.split('@');
  const date = capturedAt.slice(0, 10);
  const out = path.join(ROOT, 'data', 'generated', 'props', `betonline-sgp-${date}-${away.toLowerCase()}-at-${home.toLowerCase()}.json`);
  const counts = rows.reduce((m, r) => ({ ...m, [r.market]: (m[r.market] || 0) + 1 }), {});
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ schema: 'betonline_sgp_ladders_v1', book: 'BEO', game, week: week ?? null,
    capturedAt, sourceFile: path.relative(ROOT, path.resolve(file)), counts, unknownSections, rows }, null, 2) + '\n');
  console.log(`${game}: ${rows.length} ladder rows -> ${path.relative(ROOT, out)}`, JSON.stringify(counts), unknownSections.length ? `unknown sections: ${unknownSections.join(', ')}` : '');
}

function main() {
  if (process.argv.includes('--drop')) return runDrop();
  const file = process.argv[2];
  const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
  if (!file || file.startsWith('--') || !arg('--game')) {
    console.error('Usage: node scripts/props/betonline-sgp-ladder-parse.mjs <board.txt> --game AWAY@HOME --captured ISO [--week N]');
    process.exit(2);
  }
  const game = arg('--game').toUpperCase();
  const capturedAt = arg('--captured') || fs.statSync(file).mtime.toISOString();
  writeBoard(file, fs.readFileSync(file, 'utf8'), { game, capturedAt, week: arg('--week') ? Number(arg('--week')) : null });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
