#!/usr/bin/env node
// scripts/props/draftkings-prediction-dump-parse.mjs
// ==============================================================================
// DraftKings Prediction Markets NFL Dump Parser
// Parses raw text dumps from draftkings-prediction-extract.browser.js or cron-dkp-scrape.mjs
// into standardized draftkings_predictions_v1 JSON artifacts.
//
// Usage: node scripts/props/draftkings-prediction-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Load latest NFL roster map for team resolution
const ROSTER_MAP_PATH = path.join(REPO_ROOT, 'data', 'nfl-rosters', 'roster-map-latest.json');
let ROSTER_MAP = null;
try {
  if (fs.existsSync(ROSTER_MAP_PATH)) {
    ROSTER_MAP = JSON.parse(fs.readFileSync(ROSTER_MAP_PATH, 'utf8')).players || {};
  }
} catch {
  ROSTER_MAP = {};
}

// Team full name / prefix map to standard 2-3 letter team abbreviations
export const TEAM_ABBR_MAP = {
  'PHI Eagles': 'PHI',
  'JAX Jaguars': 'JAX',
  'CLE Browns': 'CLE',
  'NY Jets': 'NYJ',
  'LV Raiders': 'LV',
  'NE Patriots': 'NE',
  'HOU Texans': 'HOU',
  'TEN Titans': 'TEN',
  'NY Giants': 'NYG',
  'WAS Commanders': 'WAS',
  'IND Colts': 'IND',
  'PIT Steelers': 'PIT',
  'MIN Vikings': 'MIN',
  'NO Saints': 'NO',
  'CHI Bears': 'CHI',
  'GB Packers': 'GB',
  'CIN Bengals': 'CIN',
  'MIA Dolphins': 'MIA',
  'DEN Broncos': 'DEN',
  'LA Chargers': 'LAC',
  'SF 49ers': 'SF',
  'SEA Seahawks': 'SEA',
  'DET Lions': 'DET',
  'ARI Cardinals': 'ARI',
  'BAL Ravens': 'BAL',
  'ATL Falcons': 'ATL',
  'BUF Bills': 'BUF',
  'LA Rams': 'LAR',
  'KC Chiefs': 'KC',
  'CAR Panthers': 'CAR',
  'TB Buccaneers': 'TB',
  'DAL Cowboys': 'DAL',
};

export const PLAYER_ALIAS_MAP = {
  // Added 2026-10-16 (W6 DKP gate): ESPN full roster 2026-10-16 lists BAL, injuredReserveOrOut/day-to-day
  "Ja'Kobi Lane": 'BAL',
  // Added 2026-10-16: DKP lists legal name; ESPN roster 2026-10-16 has "Hollywood Brown" (espn_id 4241372) PHI WR active
  'Marquise Brown': 'PHI',
  // Suffix variations
  'James Cook': 'BUF',
  'Aaron Jones': 'MIN',
  'Deebo Samuel': 'SF',
  'Marvin Mims': 'DEN',
  'Erick All': 'CIN',
  'LeQuint Allen': 'JAX',
  'Oronde Gadsden II': 'LAC',
  // Nickname / spelling variations
  'A.J. Barner': 'SEA',
  'AJ Barner': 'SEA',
  'Chigoziem Okonkwo': 'WAS',
  'Chig Okonkwo': 'WAS',
  'Demario Douglas': 'NE',
  'DeMario Douglas': 'NE',
  'Cameron Ward': 'TEN',
  'Cam Ward': 'TEN',
  'Cameron Skattebo': 'NYG',
  'Cam Skattebo': 'NYG',
  'Andrew Ogletree': 'IND',
  'Drew Ogletree': 'IND',
  'Tre Harris': 'LAC',
  "Tre' Harris": 'LAC',
  'Zonovan Knight': 'ARI',
  'Bam Knight': 'ARI',
  // Added 2026-10-15 (W6 DKP gate): verified against ESPN roster 2026-10-15
  'Matthew Hibner': 'BAL',
  'Kenneth Gainwell': 'TB',
  'D.J. Moore': 'BUF',
  // ESPN lists these in the injured/out group, which roster-map-latest.json omits
  'Omar Cooper Jr.': 'NYJ',
  'Tim Patrick': 'NYJ',
  // Free agents / recent additions
  "Lil'Jordan Humphrey": 'DEN',
  'Kaytron Allen': 'WAS',
};

export function normalizeTeamAbbr(team) {
  if (!team) return null;
  const t = team.trim().toUpperCase();
  if (t === 'WSH') return 'WAS';
  return t;
}

export function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function parseProbabilityToAmericanOdds(probVal) {
  const p = typeof probVal === 'number' ? probVal : Number(String(probVal).replace('%', ''));
  if (isNaN(p) || p <= 0 || p >= 100) return null;
  if (p === 50) return 100;
  if (p > 50) {
    return -Math.round((p / (100 - p)) * 100);
  } else {
    return Math.round(((100 - p) / p) * 100);
  }
}

export function resolveTeamForPlayer(playerName, awayTeam, homeTeam) {
  if (!playerName) return null;

  // 1. Direct match in explicit player alias map
  if (PLAYER_ALIAS_MAP[playerName]) {
    return normalizeTeamAbbr(PLAYER_ALIAS_MAP[playerName]);
  }

  // 2. Direct match in NFL roster map
  if (ROSTER_MAP && ROSTER_MAP[playerName]?.team) {
    return normalizeTeamAbbr(ROSTER_MAP[playerName].team);
  }

  // 3. Normalized / suffix match in NFL roster map
  if (ROSTER_MAP) {
    const suffixes = [' Jr.', ' Sr.', ' II', ' III', ' IV', ' V'];
    for (const suf of suffixes) {
      if (ROSTER_MAP[playerName + suf]?.team) {
        return normalizeTeamAbbr(ROSTER_MAP[playerName + suf].team);
      }
    }
    for (const suf of suffixes) {
      if (playerName.endsWith(suf)) {
        const stripped = playerName.slice(0, -suf.length);
        if (ROSTER_MAP[stripped]?.team) {
          return normalizeTeamAbbr(ROSTER_MAP[stripped].team);
        }
      }
    }
  }

  // Explicitly return null if unresolved. NEVER guess or default to away/home team!
  return null;
}

export const MONTH_MAP = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

export const DISPLAY_TZ = process.env.DKP_DISPLAY_TZ || 'America/Los_Angeles';

// Calendar date (year, 0-based month, day) of `date` as seen in timezone `tz`.
export function localDateParts(date = new Date(), tz = DISPLAY_TZ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (t) => Number(parts.find(p => p.type === t).value);
  return { year: get('year'), month: get('month') - 1, day: get('day') };
}

export function localDateString(date = new Date(), tz = DISPLAY_TZ) {
  const p = localDateParts(date, tz);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

// NFL week (Tuesday-to-Monday) computed on the LOCAL calendar date, so Monday-night
// games stay in their own week until local midnight (not 5 PM Pacific like UTC would).
export function calculateNflWeek(date = new Date(), tz = DISPLAY_TZ, seasonYear = 2026) {
  const p = localDateParts(date, tz);
  const localMidnight = Date.UTC(p.year, p.month, p.day);
  const w1Tuesday = Date.UTC(seasonYear, 8, 8);
  const diffWeeks = Math.floor((localMidnight - w1Tuesday) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, 1 + diffWeeks));
}

export function getWeekDateRange(weekNum, seasonYear = 2026) {
  const w1Tuesday = new Date(Date.UTC(seasonYear, 8, 8, 0, 0, 0)); // Sept 8 2026
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const start = new Date(w1Tuesday.getTime() + (weekNum - 1) * msPerWeek);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
  return { start, end };
}

const MONTH_DAY_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?!\d)/i;
const RELATIVE_DAY_RE = /^\s*(Today|Tomorrow)\b/i;
const DAY_PREFIX = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\s+[A-Za-z]{3}\\s+\\d{1,2}(?:st|nd|rd|th)?';
// A game start line: has a clock time ("Sun Oct 11th 6:30 AM", "Tomorrow 10:00 AM")
export const GAME_TIME_RE = new RegExp(`^(?:${DAY_PREFIX}|Today|Tomorrow)\\s+\\d{1,2}:\\d{2}\\s*[AP]M`, 'i');
// A date section header with no clock time ("MON OCT 12th", "Tomorrow")
const DATE_HEADER_RE = new RegExp(`^(?:${DAY_PREFIX}|Today|Tomorrow)$`, 'i');

// Resolve a DraftKings date label to an absolute Date (UTC noon of that calendar day).
// "Today"/"Tomorrow" are resolved against the capture timestamp in the display timezone.
// Returns null when the label cannot be resolved.
export function resolveGameDate(timeLine, { capturedAt = null, tz = DISPLAY_TZ, seasonYear = 2026 } = {}) {
  if (!timeLine) return null;
  const m = timeLine.match(MONTH_DAY_RE);
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    const year = month < 6 ? seasonYear + 1 : seasonYear;
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  const rel = timeLine.match(RELATIVE_DAY_RE);
  if (rel && capturedAt) {
    const base = new Date(capturedAt);
    if (isNaN(base.getTime())) return null;
    const p = localDateParts(base, tz);
    const offset = rel[1].toLowerCase() === 'tomorrow' ? 1 : 0;
    return new Date(Date.UTC(p.year, p.month, p.day + offset, 12, 0, 0));
  }
  return null;
}

// FAILS CLOSED: a label that cannot be resolved to a date is NOT in the week.
export function isMatchupInWeek(timeLine, weekNum, seasonYear = 2026, opts = {}) {
  if (!weekNum) return true;
  const gameDate = resolveGameDate(timeLine, { ...opts, seasonYear });
  if (!gameDate) return false;
  const { start, end } = getWeekDateRange(weekNum, seasonYear);
  return gameDate >= start && gameDate <= end;
}

export function writeFileAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

// Summary of the most recent promoted master for a week (regression baseline for the gate).
export function loadPreviousMaster(weekNum, dir = path.join(REPO_ROOT, 'data', 'generated', 'props')) {
  try {
    const re = new RegExp(`^draftkings-predictions-live-\\d{4}-\\d{2}-\\d{2}-week${weekNum}\\.json$`);
    const files = fs.readdirSync(dir)
      .filter(f => re.test(f))
      .map(f => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    for (const { f } of files) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (j?.summary?.games > 0) {
          return { file: f, games: j.summary.games, rows: j.summary.rows, players: j.summary.players || 0 };
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* no baseline */ }
  return null;
}

export function parseGameLinesSection(rawText, weekNum = null, seasonYear = 2026, opts = {}) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const events = [];
  const rows = [];
  const unresolvedDateEvents = [];
  const timeByEvent = opts.timeByEvent || {};
  const dateOpts = { capturedAt: opts.capturedAt || null, tz: opts.tz || DISPLAY_TZ };

  const awayIdx = [];
  for (let k = 0; k < lines.length; k++) {
    if (lines[k + 1] === 'AT') awayIdx.push(k);
  }
  let lastHeader = '';

  for (let i = 0; i < lines.length; i++) {
    if (DATE_HEADER_RE.test(lines[i])) lastHeader = lines[i];
    if (lines[i+1] === 'AT') {
      const away = lines[i];
      const home = lines[i+2];

      // Look for this game's own start-time line, never past the next game's block.
      const nextAway = awayIdx.find(k => k > i);
      const windowEnd = Math.min(i + 25, nextAway !== undefined ? nextAway : lines.length);
      const timeLine = lines.slice(i, windowEnd).find(l => GAME_TIME_RE.test(l)) || '';
      const event = `${away} @ ${home}`;
      // Date source priority: own time line > preceding date header > TD-board time for same matchup
      const dateText = timeLine || lastHeader || timeByEvent[event] || '';

      // Calendar-anchored filter. FAILS CLOSED: undated matchups are reported, never silently included.
      if (weekNum) {
        if (!resolveGameDate(dateText, { ...dateOpts, seasonYear })) {
          unresolvedDateEvents.push(event);
          continue;
        }
        if (!isMatchupInWeek(dateText, weekNum, seasonYear, dateOpts)) {
          continue;
        }
      }

      const spreadAway = lines[i+3];
      const spreadAwayProb = lines[i+4];
      const totalOverLine = lines[i+6];
      const totalOverProb = lines[i+7];
      const mlAwayProb = lines[i+8];
      const spreadHome = lines[i+9];
      const spreadHomeProb = lines[i+10];
      const totalUnderLine = lines[i+12];
      const totalUnderProb = lines[i+13];
      const mlHomeProb = lines[i+14];

      const awayAbbr = TEAM_ABBR_MAP[away] || away;
      const homeAbbr = TEAM_ABBR_MAP[home] || home;

      const base = {
        book: 'DKP',
        marketType: 'prediction_contract',
        contractContext: 'Pre-fee prediction-market consensus probability & contract prices (not executable sportsbook odds)',
        source: 'draftkings_predictions_live_dom',
        event,
        game: event,
        startTime: timeLine || dateText,
        available: true,
      };

      // Away Spread
      if (spreadAway && spreadAwayProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'spread',
          marketTitle: 'Game Spread',
          sectionTitle: 'Game Spread',
          player: null,
          team: awayAbbr,
          side: awayAbbr,
          line: Number(spreadAway),
          price: Number(spreadAwayProb.replace('%', '')),
          probability: Number(spreadAwayProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(spreadAwayProb),
          selection: `${awayAbbr} ${spreadAway} (${spreadAwayProb})`,
        });
      }

      // Home Spread
      if (spreadHome && spreadHomeProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'spread',
          marketTitle: 'Game Spread',
          sectionTitle: 'Game Spread',
          player: null,
          team: homeAbbr,
          side: homeAbbr,
          line: Number(spreadHome),
          price: Number(spreadHomeProb.replace('%', '')),
          probability: Number(spreadHomeProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(spreadHomeProb),
          selection: `${homeAbbr} ${spreadHome} (${spreadHomeProb})`,
        });
      }

      // Total Over
      if (totalOverLine && totalOverProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'total',
          marketTitle: 'Game Total Over',
          sectionTitle: 'Game Total Over',
          player: null,
          team: null,
          side: 'Over',
          line: Number(totalOverLine),
          price: Number(totalOverProb.replace('%', '')),
          probability: Number(totalOverProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(totalOverProb),
          selection: `Over ${totalOverLine} (${totalOverProb})`,
        });
      }

      // Total Under
      if (totalUnderLine && totalUnderProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'total',
          marketTitle: 'Game Total Under',
          sectionTitle: 'Game Total Under',
          player: null,
          team: null,
          side: 'Under',
          line: Number(totalUnderLine),
          price: Number(totalUnderProb.replace('%', '')),
          probability: Number(totalUnderProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(totalUnderProb),
          selection: `Under ${totalUnderLine} (${totalUnderProb})`,
        });
      }

      // Away Moneyline / To Win
      if (mlAwayProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'moneyline',
          marketTitle: 'Game Moneyline',
          sectionTitle: 'Game Moneyline',
          player: null,
          team: awayAbbr,
          side: awayAbbr,
          line: null,
          price: Number(mlAwayProb.replace('%', '')),
          probability: Number(mlAwayProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(mlAwayProb),
          selection: `${awayAbbr} Win (${mlAwayProb})`,
        });
      }

      // Home Moneyline / To Win
      if (mlHomeProb) {
        rows.push({
          ...base,
          market: 'game_lines',
          bet: 'moneyline',
          marketTitle: 'Game Moneyline',
          sectionTitle: 'Game Moneyline',
          player: null,
          team: homeAbbr,
          side: homeAbbr,
          line: null,
          price: Number(mlHomeProb.replace('%', '')),
          probability: Number(mlHomeProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(mlHomeProb),
          selection: `${homeAbbr} Win (${mlHomeProb})`,
        });
      }

      events.push({
        event,
        game: event,
        away,
        home,
        startTime: timeLine || dateText,
        rows: rows.filter(r => r.event === event),
      });
    }
  }

  return { events, rows, unresolvedDateEvents };
}

// Map "Away @ Home" -> start-time line, from a TD board (used as a date fallback for game lines).
export function extractEventTimes(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    if (lines[i + 1] === 'AT') {
      const ev = `${lines[i]} @ ${lines[i + 2]}`;
      const t = lines.slice(i + 3, i + 8).find(l => GAME_TIME_RE.test(l));
      if (t && !out[ev]) out[ev] = t;
    }
  }
  return out;
}

export function parseTdScorersSection(rawText, weekNum = null, seasonYear = 2026, opts = {}) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  const STOP_WORDS = new Set(['Anytime TD Scorer', 'First TD Scorer', '2+ TDs', '3+ TDS', 'LAST TD SCORER', 'TD SCORERS', 'Spread', 'Total Points', 'To Win']);
  const dateOpts = { capturedAt: opts.capturedAt || null, tz: opts.tz || DISPLAY_TZ };
  const allowed = opts.allowedEvents || null;

  let currentEvent = null;
  let currentStartTime = null;
  let currentAway = null;
  let currentHome = null;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i+1] === 'AT') {
      currentAway = lines[i];
      currentHome = lines[i+2];
      currentStartTime = lines.slice(i + 3, i + 8).find(l => GAME_TIME_RE.test(l)) || '';
      const ev = `${currentAway} @ ${currentHome}`;

      if (allowed) {
        // Only keep TD rows for matchups that passed the game-lines week filter
        currentEvent = allowed.has(ev) ? ev : null;
      } else if (weekNum && !isMatchupInWeek(currentStartTime, weekNum, seasonYear, dateOpts)) {
        currentEvent = null;
      } else {
        currentEvent = ev;
      }
      continue;
    }

    if (lines[i] === '2026 TD:' && i > 0) {
      const playerName = clean(lines[i-1]);
      if (STOP_WORDS.has(playerName) || playerName.length < 2) continue;

      // Find the probability percentages following past histogram
      let pIdx = i + 1;
      while (pIdx < lines.length && /^\d+$/.test(lines[pIdx])) {
        pIdx++;
      }

      const anyTimeProb = lines[pIdx];
      const firstTdProb = lines[pIdx+1];
      const twoPlusProb = lines[pIdx+2];

      if (anyTimeProb && /^\d+%$/.test(anyTimeProb) && currentEvent) {
        const team = resolveTeamForPlayer(playerName, currentAway, currentHome);

        const base = {
          book: 'DKP',
          marketType: 'prediction_contract',
          contractContext: 'Pre-fee prediction-market consensus probability & contract prices (not executable sportsbook odds)',
          source: 'draftkings_predictions_live_dom',
          event: currentEvent,
          game: currentEvent,
          startTime: currentStartTime,
          sectionTitle: 'TD Scorers',
          player: playerName,
          team,
          side: 'Yes',
          available: true,
        };

        // Anytime TD
        rows.push({
          ...base,
          market: 'atd_1_plus',
          bet: 'prop',
          marketTitle: 'Anytime TD Scorer',
          line: 0.5,
          price: Number(anyTimeProb.replace('%', '')),
          probability: Number(anyTimeProb.replace('%', '')) / 100,
          odds: parseProbabilityToAmericanOdds(anyTimeProb),
          selection: `${playerName} Anytime TD (${anyTimeProb})`,
        });

        // First TD
        if (firstTdProb && /^\d+%$/.test(firstTdProb)) {
          rows.push({
            ...base,
            market: 'first_td',
            bet: 'prop',
            marketTitle: 'First TD Scorer',
            line: null,
            price: Number(firstTdProb.replace('%', '')),
            probability: Number(firstTdProb.replace('%', '')) / 100,
            odds: parseProbabilityToAmericanOdds(firstTdProb),
            selection: `${playerName} First TD (${firstTdProb})`,
          });
        }

        // 2+ TDs
        if (twoPlusProb && /^\d+%$/.test(twoPlusProb)) {
          rows.push({
            ...base,
            market: 'two_plus_td',
            bet: 'prop',
            marketTitle: '2+ TDs',
            line: 1.5,
            price: Number(twoPlusProb.replace('%', '')),
            probability: Number(twoPlusProb.replace('%', '')) / 100,
            odds: parseProbabilityToAmericanOdds(twoPlusProb),
            selection: `${playerName} 2+ TDs (${twoPlusProb})`,
          });
        }
      }
    }
  }

  return rows;
}

export function parseDraftKingsPredictionsDump(rawContent, dateStr, weekNum, opts = {}) {
  // Extract raw capture timestamp from DKP_HEADER if present
  let capturedAt = new Date().toISOString();
  const headerMatch = rawContent.match(/^DKP_HEADER\|([^|]+)\|([^|]+)\|([^\r\n]+)/m);
  if (headerMatch && headerMatch[3]) {
    capturedAt = headerMatch[3].trim();
  }
  const dateOpts = { capturedAt, tz: opts.tz || DISPLAY_TZ };

  // Split into sections if wrapped with SECTION_START / SECTION_END
  let gameLinesText = rawContent;
  let tdScorersText = '';

  const glMatch = rawContent.match(/SECTION_START\|GAME_LINES\n([\s\S]*?)\nSECTION_END\|GAME_LINES/);
  if (glMatch) {
    gameLinesText = glMatch[1];
  }

  const tdMatch = rawContent.match(/SECTION_START\|TD_SCORERS\n([\s\S]*?)\nSECTION_END\|TD_SCORERS/);
  if (tdMatch) {
    tdScorersText = tdMatch[1];
  }

  // TD board start times are a date fallback for game-lines matchups that carry no date of their own
  const tdTimes = tdScorersText ? extractEventTimes(tdScorersText) : {};

  // Parse Game Lines with calendar-anchored, fail-closed week filtering
  const { events, rows: glRows, unresolvedDateEvents } = parseGameLinesSection(gameLinesText, weekNum, 2026, { ...dateOpts, timeByEvent: tdTimes });

  // TD rows only for matchups that passed the game-lines week filter
  const allowedEvents = new Set(events.map(e => e.event));
  const tdRows = tdScorersText ? parseTdScorersSection(tdScorersText, weekNum, 2026, { ...dateOpts, allowedEvents }) : [];

  const allRows = [...glRows, ...tdRows];

  // Distribute TD rows into per-event blocks
  const eventMap = new Map();
  for (const ev of events) {
    eventMap.set(ev.event, { ...ev, rows: [...ev.rows] });
  }

  for (const r of tdRows) {
    if (eventMap.has(r.event)) {
      eventMap.get(r.event).rows.push(r);
    }
  }

  const finalizedEvents = Array.from(eventMap.values());

  // Aggregate market counts and unique players
  const marketCounts = {};
  const playersSet = new Set();
  for (const r of allRows) {
    marketCounts[r.market] = (marketCounts[r.market] || 0) + 1;
    if (r.player) playersSet.add(r.player);
  }

  const masterPayload = {
    schema: 'draftkings_predictions_v1',
    book: 'DKP',
    marketType: 'prediction_contract',
    contractContext: 'Pre-fee prediction-market consensus probability & contract prices (not executable sportsbook odds)',
    date: dateStr,
    week: weekNum,
    capturedAt,
    summary: {
      games: finalizedEvents.length,
      rows: allRows.length,
      players: playersSet.size,
      markets: Object.keys(marketCounts).length,
      by_market: marketCounts,
      unresolvedDateEvents,
    },
    events: finalizedEvents,
  };

  const summary = finalizedEvents.map(e => {
    const glCount = e.rows.filter(r => r.market === 'game_lines').length;
    const tdCount = e.rows.filter(r => r.market.includes('td')).length;
    return `${e.event.padEnd(42)} rows=${String(e.rows.length).padStart(4)} | lines=${glCount} td=${tdCount}`;
  });

  return {
    events: finalizedEvents,
    allRows,
    summary,
    masterPayload,
    unresolvedDateEvents,
  };
}

function eventTeamAbbrs(eventName) {
  const [away, home] = String(eventName || '').split(' @ ');
  return [TEAM_ABBR_MAP[away], TEAM_ABBR_MAP[home]];
}

// Acceptance Gate validator
//   expectedGames : exact game count required (null = any >= 1)
//   expectTd      : TD scorer market must be present for (nearly) every game (default true)
//   previous      : summary of the last promoted master {games, rows, players} for regression checks
//   allowShrink   : skip the regression check (e.g. games legitimately kicked off and left the board)
export function validateAcceptanceGate({ events, allRows, masterPayload, expectedGames = null, expectTd = true, previous = null, allowShrink = false }) {
  const errors = [];

  // Gate 1: Matchup coverage
  if (expectedGames !== null) {
    if (events.length !== expectedGames) {
      errors.push(`Incomplete matchup count: captured ${events.length} of expected ${expectedGames} games.`);
    }
  } else if (events.length === 0) {
    errors.push(`Incomplete matchup count: captured 0 games for week.`);
  }

  // Gate 1b: every matchup on the board must have a resolvable date (week filter fails closed)
  const unresolvedDates = masterPayload?.summary?.unresolvedDateEvents || [];
  if (unresolvedDates.length > 0) {
    errors.push(`Found ${unresolvedDates.length} matchup(s) with no resolvable start date, cannot assign to week: ${unresolvedDates.slice(0, 5).join('; ')}.`);
  }

  // Gate 2: Depth check (minimum expected rows based on game lines or TD markets)
  const minRows = masterPayload?.summary?.by_market?.atd_1_plus ? Math.max(500, events.length * 30) : (events.length * 6);
  if (allRows.length < minRows) {
    errors.push(`Row count below minimum threshold: got ${allRows.length}, expected >= ${minRows}.`);
  }

  // Gate 2b: TD scorer market must be present (a failed TD board must never promote a lines-only capture)
  if (expectTd) {
    const atdEvents = new Set(allRows.filter(r => r.market === 'atd_1_plus').map(r => r.event));
    if (atdEvents.size === 0) {
      errors.push('TD scorer market missing: 0 anytime-TD rows captured (TD board failed to load?).');
    } else if (events.length > 0 && atdEvents.size / events.length < 0.8) {
      errors.push(`TD scorer coverage too low: ${atdEvents.size} of ${events.length} games have anytime-TD rows (need >= 80%).`);
    }
  }

  // Gate 2c: regression vs last promoted master
  if (previous && !allowShrink) {
    if (previous.games > 0 && events.length < previous.games * 0.8) {
      errors.push(`Capture shrank vs last good master (${previous.file || 'previous'}): games ${events.length} < 80% of ${previous.games}. Use --allow-shrink if games legitimately left the board.`);
    }
    if (previous.rows > 0 && allRows.length < previous.rows * 0.8) {
      errors.push(`Capture shrank vs last good master (${previous.file || 'previous'}): rows ${allRows.length} < 80% of ${previous.rows}. Use --allow-shrink if games legitimately left the board.`);
    }
  }

  // Gate 3: Odds, team resolution & data integrity check
  let nullOdds = 0;
  let nanOdds = 0;
  let missingMarket = 0;
  let unknownMarkets = 0;
  let gamePropsWithPlayer = 0;
  let playerPropsWithoutPlayer = 0;
  let playerPropsWithoutTeam = 0;
  const unresolvedTeamPlayers = new Set();
  let invalidPrices = 0;
  let teamNotInGame = 0;
  const teamNotInGameSamples = new Set();
  const unmappedEvents = new Set();

  for (const r of allRows) {
    if (r.odds === null || r.odds === undefined) nullOdds++;
    if (isNaN(r.odds)) nanOdds++;
    if (!r.market) missingMarket++;
    if (r.market === 'unknown') unknownMarkets++;
    if (typeof r.price !== 'number' || r.price <= 0 || r.price >= 100) invalidPrices++;

    if (r.market === 'game_lines' && r.player !== null) {
      gamePropsWithPlayer++;
    }
    if (r.market !== 'game_lines') {
      if (!r.player) playerPropsWithoutPlayer++;
      if (!r.team) {
        playerPropsWithoutTeam++;
        unresolvedTeamPlayers.add(`${r.player} (${r.event})`);
      } else {
        // A resolved team must be one of the two teams in this game (catches stale roster / alias after trades)
        const [awayAbbr, homeAbbr] = eventTeamAbbrs(r.event);
        if (!awayAbbr || !homeAbbr) {
          unmappedEvents.add(r.event);
        } else if (r.team !== awayAbbr && r.team !== homeAbbr) {
          teamNotInGame++;
          if (teamNotInGameSamples.size < 5) teamNotInGameSamples.add(`${r.player}=${r.team} in ${r.event}`);
        }
      }
    }
  }

  if (nullOdds > 0) errors.push(`Found ${nullOdds} row(s) with null odds.`);
  if (nanOdds > 0) errors.push(`Found ${nanOdds} row(s) with NaN odds.`);
  if (missingMarket > 0) errors.push(`Found ${missingMarket} row(s) with missing market key.`);
  if (unknownMarkets > 0) errors.push(`Found ${unknownMarkets} row(s) with unclassified 'unknown' market.`);
  if (invalidPrices > 0) errors.push(`Found ${invalidPrices} row(s) with invalid contract price/probability.`);
  if (gamePropsWithPlayer > 0) errors.push(`Found ${gamePropsWithPlayer} game line row(s) with non-null player.`);
  if (playerPropsWithoutPlayer > 0) errors.push(`Found ${playerPropsWithoutPlayer} player prop row(s) without player name.`);
  if (playerPropsWithoutTeam > 0) errors.push(`Found ${playerPropsWithoutTeam} player prop row(s) with unresolved/null team: ${[...unresolvedTeamPlayers].slice(0, 20).join("; ")}.`);
  if (teamNotInGame > 0) errors.push(`Found ${teamNotInGame} player prop row(s) whose team is not in the game (stale roster/alias?): ${[...teamNotInGameSamples].join('; ')}.`);
  if (unmappedEvents.size > 0) errors.push(`Cannot verify player teams: unrecognized team names in ${unmappedEvents.size} event(s): ${[...unmappedEvents].slice(0, 3).join('; ')}.`);

  return {
    passed: errors.length === 0,
    errors,
    stats: {
      games: events.length,
      rows: allRows.length,
      players: masterPayload?.summary?.players || 0,
      markets: masterPayload?.summary?.markets || 0,
      unresolvedTeams: playerPropsWithoutTeam,
      teamNotInGame,
      unresolvedDates: unresolvedDates.length,
    }
  };
}

// Standalone CLI runner
if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : null;
  };
  const hasFlag = (k) => process.argv.includes(k);

  const inputPath = arg('--in');
  const dateStr = arg('--date') || localDateString();
  const weekNum = arg('--week') ? Number(arg('--week')) : calculateNflWeek();

  if (!inputPath) {
    console.error('Usage: node scripts/props/draftkings-prediction-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N [--expected-games N] [--no-td] [--allow-shrink]');
    process.exit(1);
  }

  const rawContent = fs.readFileSync(path.resolve(inputPath), 'utf8');
  const { events, allRows, summary, masterPayload } = parseDraftKingsPredictionsDump(rawContent, dateStr, weekNum);

  const expectedGames = arg('--expected-games') ? Number(arg('--expected-games')) : null;
  const gate = validateAcceptanceGate({
    events, allRows, masterPayload, expectedGames,
    expectTd: !hasFlag('--no-td'),
    previous: loadPreviousMaster(weekNum),
    allowShrink: hasFlag('--allow-shrink'),
  });
  if (!gate.passed) {
    console.error('\n❌ ACCEPTANCE GATE FAILED:');
    for (const err of gate.errors) {
      console.error(`   - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n===============================================================`);
  console.log(`📊 DraftKings Predictions Summary — Week ${weekNum} (${dateStr})`);
  console.log(`===============================================================`);
  console.log(summary.join('\n'));
  console.log(`---------------------------------------------------------------`);
  console.log(`TOTAL: ${allRows.length} rows across ${events.length} games (Unique players: ${masterPayload.summary.players}, Markets: ${masterPayload.summary.markets})`);

  const outMaster = path.join(REPO_ROOT, 'data', 'generated', 'props', `draftkings-predictions-live-${dateStr}-week${weekNum}.json`);
  const outMirror = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', `${dateStr}-draftkings-predictions-week${weekNum}-props-parsed.json`);

  fs.mkdirSync(path.dirname(outMaster), { recursive: true });
  fs.mkdirSync(path.dirname(outMirror), { recursive: true });
  writeFileAtomic(outMaster, JSON.stringify(masterPayload, null, 2));
  writeFileAtomic(outMirror, JSON.stringify(masterPayload, null, 2));

  console.log(`💾 Saved master JSON: ${outMaster}`);
  console.log(`📋 Mirrored research JSON: ${outMirror}`);
}
