#!/usr/bin/env node
// scripts/props/betonline-prop-dump-parse.mjs
// ==============================================================================
// BetOnline.ag NFL Prop & Line Dump Parser
// Parses raw text dumps from betonline-prop-extract.browser.js or cron-bol-scrape.mjs
// into standardized betonline_live_markets_v1 JSON artifacts.
//
// Usage: node scripts/props/betonline-prop-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ODDS_RE = /^[+-]\d{3,5}$/;
const DEFAULT_STOP_LABELS = new Set([
  'Team to Commit 1st Accepted Penalty',
  '1st Team Charged with a Timeout',
  '1st Team to Use a Challenge',
  '1st Half Margin of Victory',
  '1st Half Winning Margin',
  'QUICK LINKS',
]);

export const MARKET_PATTERNS = [
  ['rush_rec_yds', /\brushing\s*(?:\+|and)\s*receiving yards$/i],
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
  ['first_td', /\bto score 1st touchdown\??$/i],
  ['kicking_points', /\bkicking points$/i],
  ['atd_1_plus', /\bscore a touchdown\??$/i],
  ['fantasy_points', /\bfantasy points(?:\s*\(.*\)|\s+std\..*)?$/i],
];

const SPECIAL_SUBTYPES = [
  ['both_teams_score_1q', /\bboth teams to score in the 1st quarter\b/i],
  ['td_in_1q', /\bwill there be a touchdown in the 1st quarter\??/i],
  ['points_every_quarter', /\bpoints scored in every quarter\??/i],
  ['td_every_quarter', /\btouchdown scored in every quarter\??/i],
  ['fg_every_quarter', /\bfield goal scored in every quarter\??/i],
  ['longest_touchdown', /\blongest touchdown of the game\b/i],
  ['shortest_touchdown', /\bshortest touchdown of the game\b/i],
  ['longest_field_goal', /\blongest field goal of the game\b/i],
  ['shortest_field_goal', /\bshortest field goal of the game\b/i],
  ['two_point_conversion', /\bwill there be a successful 2-point conversion\??/i],
];

export function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function splitTeamSuffix(value = '') {
  const normalized = clean(value);
  const teamMatch = normalized.match(/\s([A-Z]{2,3})$/);
  return {
    player: teamMatch ? normalized.slice(0, teamMatch.index).trim() : normalized,
    team: teamMatch ? teamMatch[1].toUpperCase() : null,
  };
}

export function classifyMarket(marketTitle) {
  for (const [market, pattern] of MARKET_PATTERNS) {
    if (pattern.test(marketTitle)) return market;
  }
  return 'unknown';
}

export function parseLine(selection) {
  const match = clean(selection).match(/^(Over|Under)\s+([0-9]+(?:\.[0-9]+)?)(?:\s+(.+))?$/i);
  if (!match) return { line: null, label: clean(selection) };
  return {
    line: Number(match[2]),
    label: clean(match[3] || ''),
  };
}

export function parseMarketTitle(title) {
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

function isStartTimeLine(line) {
  return /^(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\b.*\b\d{1,2}:\d{2}\s*(AM|PM)\b/i.test(line || '')
    || /^Today\s+in\s+\d{1,2}:\d{2}:\d{2}$/i.test(line || '');
}

function selectionOffset(lines, index) {
  return isStartTimeLine(lines[index + 1]) ? 2 : 1;
}

export function parsePlayerProps(lines, event) {
  const rows = [];
  const [awayTeam, homeTeam] = (event.game || '').split(' @ ');
  const playerTeamMap = new Map();

  let i = 0;
  while (i < lines.length) {
    const marketTitle = clean(lines[i]);
    if (DEFAULT_STOP_LABELS.has(marketTitle)) {
      i += 1;
      continue;
    }

    const offset = selectionOffset(lines, i);
    const next = lines[i + offset];
    const next2 = lines[i + offset + 1];
    const next3 = lines[i + offset + 2];
    const next4 = lines[i + offset + 3];

    // Check if this is a Team/Game level prop rather than a player prop:
    // 1. Team Total Touchdowns: e.g. "Total Touchdowns Philadelphia Eagles"
    const teamTdMatch = marketTitle.match(/^Total Touchdowns\s+(.+)$/i);
    if (teamTdMatch && /^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const teamName = clean(teamTdMatch[1]);
      const overLine = parseLine(next);
      const underLine = parseLine(next3);

      for (const [side, lineVal, oddsVal, sel] of [
        ['Over', overLine.line, next2, next],
        ['Under', underLine.line, next4, next3]
      ]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'team_td_total',
          bet: 'total',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: teamName,
          side,
          line: lineVal,
          odds: Number(oddsVal),
          selection: clean(sel),
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // 2. Game Total Touchdowns: "Total Touchdowns"
    if (/^Total Touchdowns$/i.test(marketTitle) && /^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const overLine = parseLine(next);
      const underLine = parseLine(next3);
      for (const [side, lineVal, oddsVal, sel] of [
        ['Over', overLine.line, next2, next],
        ['Under', underLine.line, next4, next3]
      ]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'game_td_total',
          bet: 'total',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: null,
          side,
          line: lineVal,
          odds: Number(oddsVal),
          selection: clean(sel),
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // 3. Team Total Field Goals: "Total Field Goals <Team>"
    const teamFgMatch = marketTitle.match(/^Total Field Goals\s+(.+)$/i);
    if (teamFgMatch && /^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const teamName = clean(teamFgMatch[1]);
      const overLine = parseLine(next);
      const underLine = parseLine(next3);

      for (const [side, lineVal, oddsVal, sel] of [
        ['Over', overLine.line, next2, next],
        ['Under', underLine.line, next4, next3]
      ]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'team_fg_total',
          bet: 'total',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: teamName,
          side,
          line: lineVal,
          odds: Number(oddsVal),
          selection: clean(sel),
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // 4. Game Total Field Goals: "Total Field Goals"
    if (/^Total Field Goals$/i.test(marketTitle) && /^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const overLine = parseLine(next);
      const underLine = parseLine(next3);
      for (const [side, lineVal, oddsVal, sel] of [
        ['Over', overLine.line, next2, next],
        ['Under', underLine.line, next4, next3]
      ]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'game_fg_total',
          bet: 'total',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: null,
          side,
          line: lineVal,
          odds: Number(oddsVal),
          selection: clean(sel),
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // 5. Game Specials (Over/Under format e.g. Longest/Shortest Touchdown/Field Goal)
    const specialEntry = SPECIAL_SUBTYPES.find(([, re]) => re.test(marketTitle));
    if (specialEntry && /^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const overLine = parseLine(next);
      const underLine = parseLine(next3);
      for (const [side, lineVal, oddsVal, sel] of [
        ['Over', overLine.line, next2, next],
        ['Under', underLine.line, next4, next3]
      ]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'game_special',
          subtype: specialEntry[0],
          bet: 'special',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: null,
          side,
          line: lineVal,
          odds: Number(oddsVal),
          selection: clean(sel),
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // 6. Game Specials (Yes/No format e.g. Both Teams to Score 1Q, 2-Pt Conversion)
    if (specialEntry && next === 'Yes' && ODDS_RE.test(next2 || '') && next3 === 'No' && ODDS_RE.test(next4 || '')) {
      for (const [side, odds] of [['Yes', next2], ['No', next4]]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: 'game_special',
          subtype: specialEntry[0],
          bet: 'special',
          marketTitle,
          sectionTitle: marketTitle,
          player: null,
          team: null,
          side,
          line: null,
          odds: Number(odds),
          selection: side,
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    // Standard Over / Under Player Prop lines
    if (/^Over\b/i.test(next || '') && ODDS_RE.test(next2 || '') && /^Under\b/i.test(next3 || '') && ODDS_RE.test(next4 || '')) {
      const parsed = parseMarketTitle(marketTitle);
      const overLine = parseLine(next);
      const underLine = parseLine(next3);

      if (parsed.player && parsed.team) {
        playerTeamMap.set(parsed.player, parsed.team);
      }

      rows.push({
        book: 'BEO',
        source: 'betonline_live_dom',
        eventId: event.eventId || null,
        eventUrl: event.eventUrl || null,
        event: event.game || null,
        game: event.game || null,
        startTime: event.startTime || null,
        market: parsed.market,
        bet: 'prop',
        marketTitle,
        sectionTitle: marketTitle,
        player: parsed.player,
        team: parsed.team,
        side: 'Over',
        line: overLine.line,
        odds: Number(next2),
        selection: clean(next),
        available: true,
      });

      rows.push({
        book: 'BEO',
        source: 'betonline_live_dom',
        eventId: event.eventId || null,
        eventUrl: event.eventUrl || null,
        event: event.game || null,
        game: event.game || null,
        startTime: event.startTime || null,
        market: parsed.market,
        bet: 'prop',
        marketTitle,
        sectionTitle: marketTitle,
        player: parsed.player,
        team: parsed.team,
        side: 'Under',
        line: underLine.line,
        odds: Number(next4),
        selection: clean(next3),
        available: true,
      });

      i += offset + 4;
      continue;
    }

    // Yes / No props (e.g. Player Touchdown Specials)
    if (next === 'Yes' && ODDS_RE.test(next2 || '') && next3 === 'No' && ODDS_RE.test(next4 || '')) {
      const parsed = parseMarketTitle(marketTitle);
      if (parsed.player && parsed.team) {
        playerTeamMap.set(parsed.player, parsed.team);
      }

      for (const [side, odds] of [['Yes', next2], ['No', next4]]) {
        rows.push({
          book: 'BEO',
          source: 'betonline_live_dom',
          eventId: event.eventId || null,
          eventUrl: event.eventUrl || null,
          event: event.game || null,
          game: event.game || null,
          startTime: event.startTime || null,
          market: parsed.market,
          bet: 'prop',
          marketTitle,
          sectionTitle: marketTitle,
          player: parsed.player,
          team: parsed.team,
          side,
          line: null,
          odds: Number(odds),
          selection: side,
          available: true,
        });
      }
      i += offset + 4;
      continue;
    }

    i += 1;
  }

  // Cross-resolution pass: resolve team for players where team was omitted in title
  // (e.g., "Christian McCaffrey Fantasy Points" -> matches "Christian McCaffrey SF Rushing Yards")
  for (const r of rows) {
    if (r.player && !r.team) {
      if (playerTeamMap.has(r.player)) {
        r.team = playerTeamMap.get(r.player);
      }
    }
  }

  return rows;
}

export function parseGamePeriods(lines, event) {
  const rows = [];
  const base = {
    book: 'BEO',
    source: 'betonline_live_dom',
    eventId: event.eventId || null,
    eventUrl: event.eventUrl || null,
    event: event.game || null,
    game: event.game || null,
    startTime: event.startTime || null,
    available: true,
  };

  const [awayTeam, homeTeam] = (event.game || '').split(' @ ');

  // 1. Full Game Period
  let gpIdx = lines.indexOf('Game Period');
  if (gpIdx >= 0) {
    let i = gpIdx + 1;
    while (i < lines.length && i < gpIdx + 30) {
      const l = lines[i];
      if (l.includes('1st Half Period') || l.includes('Parlay Builder') || l.includes('Team Points')) break;
      if (awayTeam && l.includes(awayTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const mlOdds = lines[i + 3];
        const totalLine = lines[i + 4];
        const totalOdds = lines[i + 5];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'game_lines', bet: 'spread', marketTitle: 'Game Spread', sectionTitle: 'Game Spread', player: null, team: awayTeam, side: awayTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${awayTeam} ${spreadLine} ${spreadOdds}` });
        }
        if (mlOdds && /^[+-]\d+$/.test(mlOdds)) {
          rows.push({ ...base, market: 'game_lines', bet: 'moneyline', marketTitle: 'Game Moneyline', sectionTitle: 'Game Moneyline', player: null, team: awayTeam, side: awayTeam, line: null, odds: Number(mlOdds), selection: `${awayTeam} ML ${mlOdds}` });
        }
        if (totalLine && totalOdds && /^O\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'game_lines', bet: 'total', marketTitle: 'Game Total Over', sectionTitle: 'Game Total Over', player: null, team: null, side: 'Over', line: Number(totalLine.replace(/^O\s+/, '')), odds: Number(totalOdds), selection: `Over ${totalLine} ${totalOdds}` });
        }
      } else if (homeTeam && l.includes(homeTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const mlOdds = lines[i + 3];
        const totalLine = lines[i + 4];
        const totalOdds = lines[i + 5];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'game_lines', bet: 'spread', marketTitle: 'Game Spread', sectionTitle: 'Game Spread', player: null, team: homeTeam, side: homeTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${homeTeam} ${spreadLine} ${spreadOdds}` });
        }
        if (mlOdds && /^[+-]\d+$/.test(mlOdds)) {
          rows.push({ ...base, market: 'game_lines', bet: 'moneyline', marketTitle: 'Game Moneyline', sectionTitle: 'Game Moneyline', player: null, team: homeTeam, side: homeTeam, line: null, odds: Number(mlOdds), selection: `${homeTeam} ML ${mlOdds}` });
        }
        if (totalLine && totalOdds && /^U\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'game_lines', bet: 'total', marketTitle: 'Game Total Under', sectionTitle: 'Game Total Under', player: null, team: null, side: 'Under', line: Number(totalLine.replace(/^U\s+/, '')), odds: Number(totalOdds), selection: `Under ${totalLine} ${totalOdds}` });
        }
      }
      i++;
    }
  }

  // 2. 1st Half Period
  let hfIdx = lines.indexOf('1st Half Period');
  if (hfIdx >= 0) {
    let i = hfIdx + 1;
    while (i < lines.length && i < hfIdx + 30) {
      const l = lines[i];
      if (l.includes('1st Quarter Period') || l.includes('Parlay Builder')) break;
      if (awayTeam && l.includes(awayTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const mlOdds = lines[i + 3];
        const totalLine = lines[i + 4];
        const totalOdds = lines[i + 5];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'spread', marketTitle: '1st Half Spread', sectionTitle: '1st Half Spread', player: null, team: awayTeam, side: awayTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${awayTeam} 1H ${spreadLine} ${spreadOdds}` });
        }
        if (mlOdds && /^[+-]\d+$/.test(mlOdds)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'moneyline', marketTitle: '1st Half Moneyline', sectionTitle: '1st Half Moneyline', player: null, team: awayTeam, side: awayTeam, line: null, odds: Number(mlOdds), selection: `${awayTeam} 1H ML ${mlOdds}` });
        }
        if (totalLine && totalOdds && /^O\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'total', marketTitle: '1st Half Total Over', sectionTitle: '1st Half Total Over', player: null, team: null, side: 'Over', line: Number(totalLine.replace(/^O\s+/, '')), odds: Number(totalOdds), selection: `1H Over ${totalLine} ${totalOdds}` });
        }
      } else if (homeTeam && l.includes(homeTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const mlOdds = lines[i + 3];
        const totalLine = lines[i + 4];
        const totalOdds = lines[i + 5];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'spread', marketTitle: '1st Half Spread', sectionTitle: '1st Half Spread', player: null, team: homeTeam, side: homeTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${homeTeam} 1H ${spreadLine} ${spreadOdds}` });
        }
        if (mlOdds && /^[+-]\d+$/.test(mlOdds)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'moneyline', marketTitle: '1st Half Moneyline', sectionTitle: '1st Half Moneyline', player: null, team: homeTeam, side: homeTeam, line: null, odds: Number(mlOdds), selection: `${homeTeam} 1H ML ${mlOdds}` });
        }
        if (totalLine && totalOdds && /^U\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'first_half_lines', bet: 'total', marketTitle: '1st Half Total Under', sectionTitle: '1st Half Total Under', player: null, team: null, side: 'Under', line: Number(totalLine.replace(/^U\s+/, '')), odds: Number(totalOdds), selection: `1H Under ${totalLine} ${totalOdds}` });
        }
      }
      i++;
    }
  }

  // 3. 1st Quarter Period
  let q1Idx = lines.indexOf('1st Quarter Period');
  if (q1Idx >= 0) {
    let i = q1Idx + 1;
    while (i < lines.length && i < q1Idx + 25) {
      const l = lines[i];
      if (l.includes('Parlay Builder') || l.includes('Team Points')) break;
      if (awayTeam && l.includes(awayTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const totalLine = lines[i + 3];
        const totalOdds = lines[i + 4];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'first_quarter_lines', bet: 'spread', marketTitle: '1st Quarter Spread', sectionTitle: '1st Quarter Spread', player: null, team: awayTeam, side: awayTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${awayTeam} 1Q ${spreadLine} ${spreadOdds}` });
        }
        if (totalLine && totalOdds && /^O\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'first_quarter_lines', bet: 'total', marketTitle: '1st Quarter Total Over', sectionTitle: '1st Quarter Total Over', player: null, team: null, side: 'Over', line: Number(totalLine.replace(/^O\s+/, '')), odds: Number(totalOdds), selection: `1Q Over ${totalLine} ${totalOdds}` });
        }
      } else if (homeTeam && l.includes(homeTeam)) {
        const spreadLine = lines[i + 1];
        const spreadOdds = lines[i + 2];
        const totalLine = lines[i + 3];
        const totalOdds = lines[i + 4];
        if (spreadLine && spreadOdds && /^[+-]?\d/.test(spreadLine)) {
          rows.push({ ...base, market: 'first_quarter_lines', bet: 'spread', marketTitle: '1st Quarter Spread', sectionTitle: '1st Quarter Spread', player: null, team: homeTeam, side: homeTeam, line: Number(spreadLine), odds: Number(spreadOdds), selection: `${homeTeam} 1Q ${spreadLine} ${spreadOdds}` });
        }
        if (totalLine && totalOdds && /^U\s+\d/.test(totalLine)) {
          rows.push({ ...base, market: 'first_quarter_lines', bet: 'total', marketTitle: '1st Quarter Total Under', sectionTitle: '1st Quarter Total Under', player: null, team: null, side: 'Under', line: Number(totalLine.replace(/^U\s+/, '')), odds: Number(totalOdds), selection: `1Q Under ${totalLine} ${totalOdds}` });
        }
      }
      i++;
    }
  }

  return rows;
}

export function parseBetOnlineDump(rawContent, dateStr, weekNum) {
  const events = [];
  const eventBlocks = rawContent.split(/\n(?=EVENT\|)/);

  for (const block of eventBlocks) {
    if (!block.trim().startsWith('EVENT|')) continue;
    const headerLine = block.split('\n')[0];
    const parts = headerLine.split('|');
    const game = parts[1] || '';
    const url = parts[2] || '';
    const capturedAt = parts[3] || new Date().toISOString();
    const startTime = parts[4] || '';
    const eventId = parts[5] || '';

    const rawTextMatch = block.match(/RAW_TEXT_START\n([\s\S]*?)\nRAW_TEXT_END/);
    const rawText = rawTextMatch ? rawTextMatch[1] : block;
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    const eventObj = {
      game,
      eventId,
      eventUrl: url.startsWith('http') ? url : `https://sports.betonline.ag${url}`,
      startTime,
      capturedAt,
      lines,
      rawText
    };

    const periodRows = parseGamePeriods(lines, eventObj);
    const propRows = parsePlayerProps(lines, eventObj);
    eventObj.rows = [...periodRows, ...propRows];
    events.push(eventObj);
  }

  const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const allRows = [];
  const summary = [];

  for (const ev of events) {
    const [awayRaw, homeRaw] = (ev.game || '').split(' @ ');
    const awaySlug = slug((awayRaw || 'away').split(' ').pop());
    const homeSlug = slug((homeRaw || 'home').split(' ').pop());

    const counts = {};
    for (const r of ev.rows) {
      counts[r.market] = (counts[r.market] || 0) + 1;
    }

    const out = {
      schema: 'betonline_live_markets_v1',
      book: 'BEO',
      capturedAt: ev.capturedAt,
      event: ev.game,
      game: ev.game,
      eventId: ev.eventId,
      eventUrl: ev.eventUrl,
      startTime: ev.startTime,
      summary: {
        rows: ev.rows.length,
        by_market: counts,
      },
      rows: ev.rows,
    };

    allRows.push(...ev.rows);
    summary.push(`${ev.game.padEnd(44)} rows=${String(ev.rows.length).padStart(4)} | pass=${(counts.pass_yds||0)+(counts.pass_td||0)} rush=${counts.rush_yds||0} rec=${counts.rec_yds||0} lines=${(counts.game_lines||0)+(counts.first_half_lines||0)}`);
  }

  const uniquePlayers = new Set(allRows.map(r => r.player).filter(Boolean));
  const uniqueMarkets = new Set(allRows.map(r => r.market).filter(Boolean));

  const masterPayload = {
    schema: 'betonline_live_markets_v1',
    book: 'BEO',
    capturedAt: events[0]?.capturedAt || new Date().toISOString(),
    date: dateStr,
    week: Number(weekNum),
    totalGames: events.length,
    totalRows: allRows.length,
    summary: {
      games: events.length,
      rows: allRows.length,
      players: uniquePlayers.size,
      markets: uniqueMarkets.size,
    },
    events: events.map(e => ({
      game: e.game,
      eventId: e.eventId,
      eventUrl: e.eventUrl,
      startTime: e.startTime,
      rowCount: e.rows.length,
    })),
    rows: allRows,
  };

  return { events, allRows, summary, masterPayload };
}

async function main() {
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : null;
  };

  const IN = arg('--in');
  const DATE = arg('--date');
  const WEEK = arg('--week');

  if (!IN || !DATE || !WEEK) {
    console.error('Usage: node scripts/props/betonline-prop-dump-parse.mjs --in <dump.txt> --date YYYY-MM-DD --week N');
    process.exit(1);
  }

  const rawContent = fs.readFileSync(IN, 'utf8');
  const { events, allRows, summary, masterPayload } = parseBetOnlineDump(rawContent, DATE, WEEK);

  const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  for (const ev of events) {
    const [awayRaw, homeRaw] = (ev.game || '').split(' @ ');
    const awaySlug = slug((awayRaw || 'away').split(' ').pop());
    const homeSlug = slug((homeRaw || 'home').split(' ').pop());

    const counts = {};
    for (const r of ev.rows) {
      counts[r.market] = (counts[r.market] || 0) + 1;
    }

    const out = {
      schema: 'betonline_live_markets_v1',
      book: 'BEO',
      capturedAt: ev.capturedAt,
      event: ev.game,
      game: ev.game,
      eventId: ev.eventId,
      eventUrl: ev.eventUrl,
      startTime: ev.startTime,
      summary: {
        rows: ev.rows.length,
        by_market: counts,
      },
      rows: ev.rows,
    };

    const perMatchupPath = path.join(REPO_ROOT, 'data', 'generated', 'props', `betonline-live-${DATE}-${awaySlug}-at-${homeSlug}.json`);
    fs.mkdirSync(path.dirname(perMatchupPath), { recursive: true });
    fs.writeFileSync(perMatchupPath, JSON.stringify(out, null, 2), 'utf8');
  }

  // Write slate-wide consolidated file
  const masterJsonPath = path.join(REPO_ROOT, 'data', 'generated', 'props', `betonline-live-${DATE}-week${WEEK}.json`);
  fs.writeFileSync(masterJsonPath, JSON.stringify(masterPayload, null, 2), 'utf8');

  console.log(`\n===============================================================`);
  console.log(`📊 BetOnline Parse Summary — Week ${WEEK} (${DATE})`);
  console.log(`===============================================================`);
  console.log(summary.join('\n'));
  console.log(`---------------------------------------------------------------`);
  console.log(`TOTAL: ${allRows.length} rows across ${events.length} games (Unique players: ${masterPayload.summary.players}, Markets: ${masterPayload.summary.markets})`);
  console.log(`Saved master JSON -> ${masterJsonPath}`);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(err => {
    console.error('BetOnline dump parser failed:', err);
    process.exit(1);
  });
}
