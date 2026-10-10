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
const TEAM_ABBR_MAP = {
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

export function getWeekDateRange(weekNum, seasonYear = 2026) {
  const w1Tuesday = new Date(Date.UTC(seasonYear, 8, 8, 0, 0, 0)); // Sept 8 2026
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const start = new Date(w1Tuesday.getTime() + (weekNum - 1) * msPerWeek);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
  return { start, end };
}

export function isMatchupInWeek(timeLine, weekNum, seasonYear = 2026) {
  if (!timeLine || !weekNum) return true;
  const m = timeLine.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
  if (!m) return true;
  const monthStr = m[1].toLowerCase();
  const day = parseInt(m[2], 10);
  const month = MONTH_MAP[monthStr];
  const year = month < 6 ? seasonYear + 1 : seasonYear;
  const gameDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const { start, end } = getWeekDateRange(weekNum, seasonYear);
  return gameDate >= start && gameDate <= end;
}

export function parseGameLinesSection(rawText, weekNum = null, seasonYear = 2026) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const events = [];
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i+1] === 'AT') {
      const away = lines[i];
      const home = lines[i+2];

      const surrounding = lines.slice(i, i + 25);
      const timeLine = surrounding.find(l => /^(Sun|Mon|Thu|Sat|Today|Tomorrow)\s+[A-Za-z]{3}\s+\d+/i.test(l)) || '';
      
      // Calendar-anchored filter: skip advance matchups for subsequent weeks
      if (weekNum && !isMatchupInWeek(timeLine, weekNum, seasonYear)) {
        continue;
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

      const event = `${away} @ ${home}`;
      const awayAbbr = TEAM_ABBR_MAP[away] || away;
      const homeAbbr = TEAM_ABBR_MAP[home] || home;

      const base = {
        book: 'DKP',
        marketType: 'prediction_contract',
        contractContext: 'Pre-fee prediction-market consensus probability & contract prices (not executable sportsbook odds)',
        source: 'draftkings_predictions_live_dom',
        event,
        game: event,
        startTime: timeLine,
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
        startTime: timeLine,
        rows: rows.filter(r => r.event === event),
      });
    }
  }

  return { events, rows };
}

export function parseTdScorersSection(rawText, weekNum = null, seasonYear = 2026) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  const STOP_WORDS = new Set(['Anytime TD Scorer', 'First TD Scorer', '2+ TDs', '3+ TDS', 'LAST TD SCORER', 'TD SCORERS', 'Spread', 'Total Points', 'To Win']);

  let currentEvent = null;
  let currentStartTime = null;
  let currentAway = null;
  let currentHome = null;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i+1] === 'AT') {
      currentAway = lines[i];
      currentHome = lines[i+2];
      currentStartTime = lines[i+3] || '';

      // If start time is outside target week, skip this event
      if (weekNum && !isMatchupInWeek(currentStartTime, weekNum, seasonYear)) {
        currentEvent = null;
        continue;
      }
      currentEvent = `${currentAway} @ ${currentHome}`;
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

export function parseDraftKingsPredictionsDump(rawContent, dateStr, weekNum) {
  // Extract raw capture timestamp from DKP_HEADER if present
  let capturedAt = new Date().toISOString();
  const headerMatch = rawContent.match(/^DKP_HEADER\|([^|]+)\|([^|]+)\|([^\r\n]+)/m);
  if (headerMatch && headerMatch[3]) {
    capturedAt = headerMatch[3].trim();
  }

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

  // Parse Game Lines with calendar-anchored week filtering
  const { events, rows: glRows } = parseGameLinesSection(gameLinesText, weekNum);

  // Parse TD Scorers if available with calendar-anchored week filtering
  const tdRows = tdScorersText ? parseTdScorersSection(tdScorersText, weekNum) : [];

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
  };
}

// Acceptance Gate validator
export function validateAcceptanceGate({ events, allRows, masterPayload, expectedGames = null }) {
  const errors = [];

  // Gate 1: Matchup coverage
  if (expectedGames !== null) {
    if (events.length !== expectedGames) {
      errors.push(`Incomplete matchup count: captured ${events.length} of expected ${expectedGames} games.`);
    }
  } else if (events.length === 0) {
    errors.push(`Incomplete matchup count: captured 0 games for week.`);
  }

  // Gate 2: Depth check (minimum expected rows based on game lines or TD markets)
  const minRows = masterPayload?.summary?.by_market?.atd_1_plus ? Math.max(500, events.length * 30) : (events.length * 6);
  if (allRows.length < minRows) {
    errors.push(`Row count below minimum threshold: got ${allRows.length}, expected >= ${minRows}.`);
  }

  // Gate 3: Odds, team resolution & data integrity check
  let nullOdds = 0;
  let nanOdds = 0;
  let missingMarket = 0;
  let unknownMarkets = 0;
  let gamePropsWithPlayer = 0;
  let playerPropsWithoutPlayer = 0;
  let playerPropsWithoutTeam = 0;
  let invalidPrices = 0;

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
      if (!r.team) playerPropsWithoutTeam++;
    }
  }

  if (nullOdds > 0) errors.push(`Found ${nullOdds} row(s) with null odds.`);
  if (nanOdds > 0) errors.push(`Found ${nanOdds} row(s) with NaN odds.`);
  if (missingMarket > 0) errors.push(`Found ${missingMarket} row(s) with missing market key.`);
  if (unknownMarkets > 0) errors.push(`Found ${unknownMarkets} row(s) with unclassified 'unknown' market.`);
  if (invalidPrices > 0) errors.push(`Found ${invalidPrices} row(s) with invalid contract price/probability.`);
  if (gamePropsWithPlayer > 0) errors.push(`Found ${gamePropsWithPlayer} game line row(s) with non-null player.`);
  if (playerPropsWithoutPlayer > 0) errors.push(`Found ${playerPropsWithoutPlayer} player prop row(s) without player name.`);
  if (playerPropsWithoutTeam > 0) errors.push(`Found ${playerPropsWithoutTeam} player prop row(s) with unresolved/null team.`);

  return {
    passed: errors.length === 0,
    errors,
    stats: {
      games: events.length,
      rows: allRows.length,
      players: masterPayload?.summary?.players || 0,
      markets: masterPayload?.summary?.markets || 0,
      unresolvedTeams: playerPropsWithoutTeam,
    }
  };
}

// Standalone CLI runner
if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : null;
  };

  const inputPath = arg('--in');
  const dateStr = arg('--date') || new Date().toISOString().slice(0, 10);
  const weekNum = arg('--week') ? Number(arg('--week')) : 5;

  if (!inputPath) {
    console.error('Usage: node scripts/props/draftkings-prediction-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N');
    process.exit(1);
  }

  const rawContent = fs.readFileSync(path.resolve(inputPath), 'utf8');
  const { events, allRows, summary, masterPayload } = parseDraftKingsPredictionsDump(rawContent, dateStr, weekNum);

  const expectedGames = arg('--expected-games') ? Number(arg('--expected-games')) : null;
  const gate = validateAcceptanceGate({ events, allRows, masterPayload, expectedGames });
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
  fs.writeFileSync(outMaster, JSON.stringify(masterPayload, null, 2), 'utf8');
  fs.writeFileSync(outMirror, JSON.stringify(masterPayload, null, 2), 'utf8');

  console.log(`💾 Saved master JSON: ${outMaster}`);
  console.log(`📋 Mirrored research JSON: ${outMirror}`);
}
