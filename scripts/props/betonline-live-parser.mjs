const ODDS_RE = /^[+-]\d{3,5}$/;
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_STOP_LABELS = new Set([
  'Team to Commit 1st Accepted Penalty',
  '1st Team Charged with a Timeout',
  '1st Team to Use a Challenge',
  '1st Half Margin of Victory',
  '1st Half Winning Margin',
  'QUICK LINKS',
]);

const MARKET_PATTERNS = [
  ['rush_rec_yds', /\brushing\+receiving yards$/i],
  ['pass_yds', /\bpassing yards$/i],
  ['pass_cmp', /\bcompletions$/i],
  ['pass_td', /\bpassing touchdowns$/i],
  ['pass_int', /\binterceptions thrown$/i],
  ['pass_att', /\bpassing attempts$/i],
  ['longest_completion', /\blongest completion$/i],
  ['rush_yds', /\brushing yards$/i],
  ['carries', /\b(rushing attempts|attempts)$/i],
  ['rec_yds', /\breceiving yards$/i],
  ['rec', /\breceptions$/i],
  ['targets', /\btargets$/i],
  ['longest_rush', /\blongest rush$/i],
  ['longest_rec', /\blongest reception$/i],
  ['first_td_yn', /\bto score 1st touchdown\??$/i],
  ['kicking_points', /\bkicking points$/i],
  ['atd', /\bscore a touchdown\??$/i],
  ['fantasy_points', /\bfantasy points(?:\s*\(.*\)|\s+std\..*)?$/i],
];

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function splitTeamSuffix(value = '') {
  const normalized = clean(value);
  const teamMatch = normalized.match(/\s([A-Z]{2,3})$/i);
  return {
    player: teamMatch ? normalized.slice(0, teamMatch.index).trim() : normalized,
    team: teamMatch ? teamMatch[1].toUpperCase() : null,
  };
}

function splitLines(text) {
  return String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLine(selection) {
  const match = clean(selection).match(/^(Over|Under)\s+([0-9]+(?:\.[0-9]+)?)(?:\s+(.+))?$/i);
  if (!match) return { line: null, label: clean(selection) };
  return {
    line: Number(match[2]),
    label: clean(match[3] || ''),
  };
}

function classifyMarket(marketTitle) {
  for (const [market, pattern] of MARKET_PATTERNS) {
    if (pattern.test(marketTitle)) return market;
  }
  return 'unknown';
}

function isStartTimeLine(line) {
  return /^(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\b.*\b\d{1,2}:\d{2}\s*(AM|PM)\b/i.test(line || '')
    || /^Today\s+in\s+\d{1,2}:\d{2}:\d{2}$/i.test(line || '');
}

function selectionOffset(lines, index) {
  return isStartTimeLine(lines[index + 1]) ? 2 : 1;
}

function parseMarketTitle(title) {
  const normalized = clean(title);
  const market = classifyMarket(normalized);
  let propLabel = null;
  let playerChunk = normalized;

  for (const [, pattern] of MARKET_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      propLabel = match[0].replace(/\?$/, '');
      playerChunk = normalized.slice(0, match.index).trim();
      break;
    }
  }

  const parsedPlayer = splitTeamSuffix(playerChunk);
  return {
    market,
    propLabel: propLabel || null,
    player: parsedPlayer.player,
    team: parsedPlayer.team,
  };
}

function findPlayerPropStart(lines) {
  return lines.findIndex((line, index) => {
    const offset = selectionOffset(lines, index);
    const next = lines[index + offset] || '';
    const next2 = lines[index + offset + 1] || '';
    const looksLikePlayerMarket = /\s[A-Z]{2,3}\s+(Passing|Completions|Interceptions|Rushing|Receiving|Receptions|Targets|Longest|Score|Fantasy)/i.test(line);
    return looksLikePlayerMarket && (
      (/^(Over|Under)\b/i.test(next) && ODDS_RE.test(next2))
      || (next === 'Yes' && ODDS_RE.test(next2))
    );
  });
}

const PLAYER_ODDS_LIST_SECTIONS = [
  ['First Touchdown Scorer', 'first_td'],
  ['Anytime Touchdown Scorer', 'atd_1_plus'],
];

const PLAYER_ODDS_LIST_SKIP_LINES = new Set(['SHOW MORE', 'Read More']);

function parsePlayerOddsList(lines, event, sectionTitle, market) {
  const rows = [];
  const start = lines.findIndex((line) => line === sectionTitle);
  if (start < 0) return rows;
  let i = start + selectionOffset(lines, start);
  while (i + 1 < lines.length) {
    const name = lines[i];
    const odds = lines[i + 1];
    if (PLAYER_ODDS_LIST_SKIP_LINES.has(name)) {
      i += 1;
      continue;
    }
    if (!ODDS_RE.test(odds)) break;
    const parsedPlayer = splitTeamSuffix(name);
    rows.push({
      book: 'BEO',
      source: 'betonline_live_text',
      eventId: event?.eventId || null,
      eventUrl: event?.url || null,
      game: event?.game || null,
      startTime: event?.startTime || null,
      market,
      marketTitle: sectionTitle,
      player: parsedPlayer.player,
      team: parsedPlayer.team,
      side: 'Yes',
      line: null,
      selection: sectionTitle,
      odds: Number(odds),
    });
    i += 2;
  }
  return rows;
}

function parsePlayerOddsListSections(lines, event) {
  const rows = [];
  for (const [sectionTitle, market] of PLAYER_ODDS_LIST_SECTIONS) {
    rows.push(...parsePlayerOddsList(lines, event, sectionTitle, market));
  }
  return rows;
}

function pushOverUnder(rows, event, marketTitle, overSelection, overOdds, underSelection, underOdds) {
  const parsed = parseMarketTitle(marketTitle);
  const overLine = parseLine(overSelection);
  const underLine = parseLine(underSelection);
  for (const [side, selection, odds, lineInfo] of [
    ['Over', overSelection, overOdds, overLine],
    ['Under', underSelection, underOdds, underLine],
  ]) {
    rows.push({
      book: 'BEO',
      source: 'betonline_live_text',
      eventId: event?.eventId || null,
      eventUrl: event?.url || null,
      game: event?.game || null,
      startTime: event?.startTime || null,
      market: parsed.market,
      marketTitle: clean(marketTitle),
      player: parsed.player,
      team: parsed.team,
      side,
      line: lineInfo.line,
      selection: clean(selection),
      odds: Number(odds),
    });
  }
}

function pushYesNo(rows, event, marketTitle, yesOdds, noOdds) {
  const parsed = parseMarketTitle(marketTitle);
  for (const [side, odds] of [['Yes', yesOdds], ['No', noOdds]]) {
    rows.push({
      book: 'BEO',
      source: 'betonline_live_text',
      eventId: event?.eventId || null,
      eventUrl: event?.url || null,
      game: event?.game || null,
      startTime: event?.startTime || null,
      market: parsed.market,
      marketTitle: clean(marketTitle),
      player: parsed.player,
      team: parsed.team,
      side,
      line: null,
      selection: side,
      odds: Number(odds),
    });
  }
}

export function parseBetOnlineEventText(text, event = {}) {
  const lines = splitLines(text);
  const rows = parsePlayerOddsListSections(lines, event);
  const start = findPlayerPropStart(lines);
  if (start < 0) return rows;

  let i = start;
  while (i < lines.length) {
    const marketTitle = lines[i];
    if (DEFAULT_STOP_LABELS.has(marketTitle)) {
      // Stop labels mark known non-prop section titles (e.g. "Team to Commit
      // 1st Accepted Penalty") but real player-prop markets can still follow
      // them further down the page -- skip this line, don't abandon the rest
      // of the board (a `break` here silently dropped 42 rows including all
      // Terrance Ferguson and Tyler Higbee props on 2026-09-21).
      i += 1;
      continue;
    }

    const offset = selectionOffset(lines, i);
    const next = lines[i + offset];
    const next2 = lines[i + offset + 1];
    const next3 = lines[i + offset + 2];
    const next4 = lines[i + offset + 3];

    if (/^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      pushOverUnder(rows, event, marketTitle, next, next2, next3, next4);
      i += offset + 4;
      continue;
    }

    if (next === 'Yes' && ODDS_RE.test(next2 || '') && next3 === 'No' && ODDS_RE.test(next4 || '')) {
      pushYesNo(rows, event, marketTitle, next2, next4);
      i += offset + 4;
      continue;
    }

    i += 1;
  }

  return rows;
}

export function parseBetOnlineBoardPayload(payload = {}) {
  const events = Array.isArray(payload.events) ? payload.events : [];
  const rows = [];
  for (const event of events) {
    rows.push(...parseBetOnlineEventText(event.text || '', event));
  }
  return {
    schema: 'betonline_live_props_v1',
    generatedAt: new Date().toISOString(),
    events: events.map((event) => ({
      eventId: event.eventId || null,
      url: event.url || null,
      game: event.game || null,
      startTime: event.startTime || null,
      textLength: String(event.text || '').length,
    })),
    rows,
    summary: {
      events: events.length,
      rows: rows.length,
      players: new Set(rows.map((row) => row.player).filter(Boolean)).size,
      markets: new Set(rows.map((row) => row.market).filter(Boolean)).size,
    },
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback = null) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const input = arg('--in');
  const output = arg('--out');
  if (!input || !output) {
    console.error('Usage: node scripts/props/betonline-live-parser.mjs --in <raw-board.json> --out <parsed.json>');
    process.exit(2);
  }

  const payload = JSON.parse(await readFile(input, 'utf8'));
  const parsed = parseBetOnlineBoardPayload(payload);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  console.log(`Parsed ${parsed.summary.rows} rows from ${parsed.summary.events} event(s) -> ${output}`);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(`BetOnline live parser failed: ${error.message}`);
    process.exit(1);
  });
}
