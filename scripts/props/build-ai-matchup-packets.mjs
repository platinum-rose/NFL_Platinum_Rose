#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const DEFAULT_MARKETS = new Set([
  'atd',
  'atd_1_plus',
  'carries',
  'first_td',
  'first_td_yn',
  'pass_att',
  'pass_cmp',
  'pass_int',
  'pass_td',
  'pass_yds',
  'rec',
  'rec_yds',
  'rush_rec_yds',
  'rush_yds',
  'targets',
]);

const MARKET_LABELS = {
  atd: 'Anytime touchdown scorer',
  atd_1_plus: 'Anytime touchdown scorer',
  carries: 'Rushing attempts',
  first_td: 'First touchdown scorer',
  first_td_yn: 'First touchdown scorer',
  pass_att: 'Passing attempts',
  pass_cmp: 'Completions',
  pass_int: 'Interceptions thrown',
  pass_td: 'Passing touchdowns',
  pass_yds: 'Passing yards',
  rec: 'Receptions',
  rec_yds: 'Receiving yards',
  rush_rec_yds: 'Rushing plus receiving yards',
  rush_yds: 'Rushing yards',
  targets: 'Targets',
};

const MISSING_FACTS_CHECKLIST = [
  'Active/inactive status',
  'Injury limitation and practice trend',
  'Projected snap share / route share / carry share',
  'Red-zone role',
  'Team total and expected game script',
  'Opponent personnel matchup',
  'Pace / play volume',
  'Weather / roof / field conditions',
  'Same-game correlation conflicts',
  'Existing ticket exposure and duplicate-leg availability',
];

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function slug(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function americanToImpliedProbability(odds) {
  if (typeof odds !== 'number' || !Number.isFinite(odds) || odds === 0) return null;
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

export function probabilityToAmerican(probability) {
  if (typeof probability !== 'number' || !Number.isFinite(probability) || probability <= 0 || probability >= 1) {
    return null;
  }
  if (probability > 0.5) return -Math.round((probability / (1 - probability)) * 100);
  return Math.round(((1 - probability) / probability) * 100);
}

function roundProb(value) {
  return value == null ? null : Number(value.toFixed(4));
}

export function noVigTwoWay(rowA, rowB) {
  const probA = americanToImpliedProbability(rowA?.odds);
  const probB = americanToImpliedProbability(rowB?.odds);
  if (probA == null || probB == null) return null;
  const hold = probA + probB - 1;
  const noVigA = probA / (probA + probB);
  const noVigB = probB / (probA + probB);
  return {
    hold: roundProb(hold),
    sides: [
      {
        side: rowA.side || rowA.selection || 'Side A',
        odds: rowA.odds,
        breakEven: roundProb(probA),
        noVigProbability: roundProb(noVigA),
        noVigAmerican: probabilityToAmerican(noVigA),
      },
      {
        side: rowB.side || rowB.selection || 'Side B',
        odds: rowB.odds,
        breakEven: roundProb(probB),
        noVigProbability: roundProb(noVigB),
        noVigAmerican: probabilityToAmerican(noVigB),
      },
    ],
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeMarkdown(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${value.trim()}\n`, 'utf8');
}

export function canonicalMarket(market) {
  if (market === 'atd_1_plus') return 'atd';
  if (market === 'first_td_yn') return 'first_td';
  return market;
}

function selectionThreshold(row) {
  if (typeof row?.line === 'number') return row.line;
  const match = clean(row?.selection).match(/\b(\d+(?:\.\d+)?)\+\b/);
  return match ? Number(match[1]) : null;
}

function targetThresholdForPrimary(row) {
  if (typeof row?.line !== 'number') return null;
  if (row.side === 'Over') return Math.floor(row.line) + 1;
  return row.line;
}

function groupRows(rows, getKey) {
  const grouped = new Map();
  for (const row of rows) {
    const key = getKey(row);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function playerMarketKey(row) {
  if (!row?.player || !DEFAULT_MARKETS.has(row.market)) return null;
  return `${clean(row.player).toLowerCase()}|${canonicalMarket(row.market)}`;
}

function bkrKey(row) {
  if (!row?.player || !DEFAULT_MARKETS.has(row.market)) return null;
  return `${effectivePlayer(row).toLowerCase()}|${canonicalMarket(row.market)}`;
}

function effectivePlayer(row) {
  const player = clean(row?.player || '');
  if (
    ['atd_1_plus', 'td_2_plus', 'td_3_plus', 'first_td'].includes(row?.market)
    && /^player to score/i.test(player)
  ) {
    return clean(row.selection);
  }
  return player;
}

function compactRow(row) {
  if (!row) return null;
  const normalizedMarket = canonicalMarket(row.market);
  return {
    book: row.book,
    player: effectivePlayer(row) || null,
    team: row.team || null,
    market: normalizedMarket,
    sourceMarket: row.market === normalizedMarket ? null : row.market,
    marketTitle: row.marketTitle || row.sectionTitle || null,
    selection: row.selection,
    side: row.side || null,
    line: row.line ?? null,
    odds: row.odds,
    breakEven: roundProb(americanToImpliedProbability(row.odds)),
  };
}

function findTwoWay(rows) {
  const over = rows.find((row) => row.side === 'Over');
  const under = rows.find((row) => row.side === 'Under');
  if (over && under) return [over, under];
  const yes = rows.find((row) => row.side === 'Yes');
  const no = rows.find((row) => row.side === 'No');
  if (yes && no) return [yes, no];
  return null;
}

function isDirectSideRow(row) {
  return ['Over', 'Under', 'Yes', 'No'].includes(row?.selection);
}

function dedupeOfferRows(rows = []) {
  const ranked = [...rows].sort((a, b) => {
    const sideRank = { Over: 0, Yes: 0, Under: 1, No: 1 };
    const sideOrder = (sideRank[a.side] ?? 2) - (sideRank[b.side] ?? 2);
    if (sideOrder) return sideOrder;
    if (isDirectSideRow(a) !== isDirectSideRow(b)) return isDirectSideRow(a) ? -1 : 1;
    return String(a.selection || '').localeCompare(String(b.selection || ''));
  });
  const seen = new Set();
  const deduped = [];
  for (const row of ranked) {
    const key = [
      canonicalMarket(row.market),
      row.side || '',
      row.line ?? '',
      row.odds ?? '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function nearestLadderRows(primaryRow, ladderRows) {
  if (!primaryRow || ladderRows.length === 0) return [];
  if (primaryRow.market === 'atd' || primaryRow.market === 'first_td_yn') {
    return ladderRows.slice(0, 4).map(compactRow);
  }
  const target = targetThresholdForPrimary(primaryRow);
  if (target == null) return ladderRows.slice(0, 6).map(compactRow);
  const withDistance = ladderRows
    .map((row) => ({ row, threshold: selectionThreshold(row) }))
    .filter((item) => item.threshold != null)
    .map((item) => ({ ...item, distance: Math.abs(item.threshold - target) }))
    .sort((a, b) => a.distance - b.distance || a.threshold - b.threshold);
  return withDistance.slice(0, 4).map((item) => compactRow(item.row));
}

function buildMovementMap(baselineRows = [], currentRows = []) {
  const keyFor = (row) => [
    effectivePlayer(row).toLowerCase(),
    canonicalMarket(row.market),
    selectionThreshold(row) ?? '',
    clean(row.selection || '').replace(/([+-]\d{2,5})$/, '').toLowerCase(),
  ].join('|');
  const baseline = new Map();
  for (const row of baselineRows.filter((item) => effectivePlayer(item) && DEFAULT_MARKETS.has(item.market))) {
    baseline.set(keyFor(row), row);
  }
  const movement = new Map();
  for (const row of currentRows.filter((item) => effectivePlayer(item) && DEFAULT_MARKETS.has(item.market))) {
    const before = baseline.get(keyFor(row));
    if (!before || before.odds === row.odds) continue;
    const packetKey = `${effectivePlayer(row).toLowerCase()}|${canonicalMarket(row.market)}`;
    if (!movement.has(packetKey)) movement.set(packetKey, []);
    movement.get(packetKey).push({
      selection: row.selection,
      line: selectionThreshold(row),
      beforeOdds: before.odds,
      currentOdds: row.odds,
      oddsMove: row.odds - before.odds,
    });
  }
  for (const moves of movement.values()) {
    moves.sort((a, b) => Math.abs(b.oddsMove) - Math.abs(a.oddsMove));
  }
  return movement;
}

function aiReviewContract(packet) {
  return {
    instruction: 'Audit price and uncertainty first. Do not generate a bet card.',
    allowedConclusions: ['pass', 'needs_more_info', 'price_watch', 'candidate_for_human_review'],
    requiredSections: [
      'price_math',
      'cross_book_context',
      'confirmed_facts',
      'missing_facts',
      'assumptions',
      'ways_this_loses',
      'conclusion',
    ],
    prompt: [
      `Analyze ${packet.player} ${MARKET_LABELS[packet.market] || packet.market} for ${packet.event}.`,
      'Start with the offered price, break-even probability, and no-vig context if provided.',
      'Use the cross-book ladder only as market context; do not treat it as a projection.',
      'List confirmed facts separately from assumptions and missing facts.',
      'Return one allowed conclusion only. Do not recommend a bet unless a fair probability source is supplied or you explicitly label your estimate as assumption-based.',
    ].join(' '),
  };
}

function buildPacketFromRows({ key, beoRows, bkrRows, movementRows, event }) {
  const [playerLower, market] = key.split('|');
  const primaryRows = dedupeOfferRows(beoRows);
  const primary = primaryRows[0] || bkrRows[0];
  const twoWay = findTwoWay(primaryRows);
  const noVig = twoWay ? noVigTwoWay(twoWay[0], twoWay[1]) : null;
  const comparableRows = [...bkrRows].sort((a, b) => (selectionThreshold(a) ?? 9999) - (selectionThreshold(b) ?? 9999));
  const packet = {
    packetId: `${slug(primary?.player || playerLower)}-${market}`,
    event,
    player: primary?.player || clean(playerLower),
    team: primary?.team || null,
    market,
    marketLabel: MARKET_LABELS[market] || market,
    primaryBook: primary?.book || null,
    proposition: primary ? `${primary.player} ${MARKET_LABELS[market] || market}` : `${playerLower} ${market}`,
    priceMath: {
      twoWay: noVig,
      primaryBreakEven: compactRow(primary)?.breakEven ?? null,
      priceToBeatNote: 'A play needs a fair probability above break-even after accounting for vig; this packet does not invent fair probability.',
    },
    currentBoard: {
      betonline: primaryRows.map(compactRow),
      bookmakerLadder: comparableRows.map(compactRow),
      bookmakerNearest: nearestLadderRows(primary, comparableRows),
    },
    movement: {
      bookmaker: (movementRows || []).slice(0, 8),
      note: movementRows?.length ? 'Movement is exact-key BKR baseline vs current odds.' : 'No exact-key BKR movement found or no baseline supplied.',
    },
    missingFactsChecklist: MISSING_FACTS_CHECKLIST,
  };
  packet.aiReviewContract = aiReviewContract(packet);
  return packet;
}

export function buildAiMatchupPackets({
  betonline,
  bookmaker,
  bookmakerBaseline = null,
  event = null,
  limit = null,
} = {}) {
  if (!betonline?.rows || !bookmaker?.rows) {
    throw new Error('buildAiMatchupPackets requires parsed BetOnline and Bookmaker artifacts with rows arrays');
  }
  const eventName = event || betonline.events?.[0]?.game || bookmaker.event || 'Unknown event';
  const beoGroups = groupRows(betonline.rows, playerMarketKey);
  const bkrGroups = groupRows(bookmaker.rows, bkrKey);
  const movementMap = bookmakerBaseline?.rows ? buildMovementMap(bookmakerBaseline.rows, bookmaker.rows) : new Map();
  const keys = new Set();
  for (const key of beoGroups.keys()) keys.add(key);
  for (const key of bkrGroups.keys()) {
    if (beoGroups.has(key)) keys.add(key);
  }

  const packets = [];
  for (const key of [...keys].sort()) {
    const bkrRows = bkrGroups.get(key) || [];
    const beoRows = beoGroups.get(key) || [];
    if (beoRows.length === 0 && bkrRows.length === 0) continue;
    const movementRows = movementMap.get(key) || [];
    packets.push(buildPacketFromRows({ key, beoRows, bkrRows, movementRows, event: eventName }));
  }

  const trimmed = limit ? packets.slice(0, Number(limit)) : packets;
  return {
    schema: 'ai_prop_matchup_packets_v1',
    generatedAt: new Date().toISOString(),
    event: eventName,
    sourceArtifacts: {},
    summary: {
      packets: trimmed.length,
      players: new Set(trimmed.map((packet) => packet.player)).size,
      markets: new Set(trimmed.map((packet) => packet.market)).size,
      books: ['BEO', 'BKR'],
    },
    packets: trimmed,
  };
}

export function renderPacketsMarkdown(result) {
  const lines = [
    `# AI Prop Matchup Packets`,
    ``,
    `Event: ${result.event}`,
    `Generated: ${result.generatedAt}`,
    `Packets: ${result.summary.packets}`,
    ``,
    `## Review Rule`,
    ``,
    `Do not ask the model for picks. Ask it to audit price, uncertainty, missing facts, and cross-book context.`,
    ``,
  ];
  for (const packet of result.packets.slice(0, 40)) {
    const primary = packet.currentBoard.betonline[0] || packet.currentBoard.bookmakerLadder[0];
    lines.push(`## ${packet.player} - ${packet.marketLabel}`);
    lines.push(``);
    if (primary) {
      lines.push(`Primary: ${primary.book} ${primary.selection} ${primary.odds > 0 ? `+${primary.odds}` : primary.odds} (break-even ${Math.round(primary.breakEven * 1000) / 10}%)`);
    }
    if (packet.priceMath.twoWay) {
      const sides = packet.priceMath.twoWay.sides
        .map((side) => `${side.side}: no-vig ${Math.round(side.noVigProbability * 1000) / 10}% (${side.noVigAmerican > 0 ? `+${side.noVigAmerican}` : side.noVigAmerican})`)
        .join('; ');
      lines.push(`No-vig: hold ${Math.round(packet.priceMath.twoWay.hold * 1000) / 10}%; ${sides}`);
    }
    if (packet.currentBoard.bookmakerNearest.length) {
      lines.push(`BKR nearest: ${packet.currentBoard.bookmakerNearest.map((row) => `${row.selection} ${row.odds > 0 ? `+${row.odds}` : row.odds}`).join(', ')}`);
    }
    if (packet.movement.bookmaker.length) {
      const move = packet.movement.bookmaker[0];
      lines.push(`Largest BKR move: ${move.selection} ${move.beforeOdds > 0 ? `+${move.beforeOdds}` : move.beforeOdds} -> ${move.currentOdds > 0 ? `+${move.currentOdds}` : move.currentOdds}`);
    }
    lines.push(`AI task: ${packet.aiReviewContract.prompt}`);
    lines.push(``);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    args[item.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.beo || !args.bkr || !args.out) {
    console.error('Usage: node scripts/props/build-ai-matchup-packets.mjs --beo <parsed.json> --bkr <bookmaker.json> [--bkr-baseline <baseline.json>] --out <packets.json> [--md <brief.md>] [--limit N]');
    process.exit(2);
  }
  const betonline = readJson(args.beo);
  const bookmaker = readJson(args.bkr);
  const bookmakerBaseline = args['bkr-baseline'] ? readJson(args['bkr-baseline']) : null;
  const result = buildAiMatchupPackets({
    betonline,
    bookmaker,
    bookmakerBaseline,
    limit: args.limit ? Number(args.limit) : null,
  });
  result.sourceArtifacts = {
    betonline: args.beo,
    bookmaker: args.bkr,
    bookmakerBaseline: args['bkr-baseline'] || null,
  };
  writeJson(args.out, result);
  if (args.md) writeMarkdown(args.md, renderPacketsMarkdown(result));
  console.log(`Built ${result.summary.packets} AI prop matchup packets -> ${args.out}`);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(`AI matchup packet build failed: ${error.message}`);
    process.exit(1);
  });
}
