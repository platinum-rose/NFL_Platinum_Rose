#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const DEFAULT_MAX_LEGS = 3;

const MARKET_FAMILIES = {
  atd: 'touchdown',
  first_td: 'touchdown_lotto',
  carries: 'rush_volume',
  pass_att: 'pass_volume',
  pass_cmp: 'pass_volume',
  pass_int: 'turnover',
  pass_td: 'pass_scoring',
  pass_yds: 'pass_volume',
  rec: 'receiver_volume',
  rec_yds: 'receiver_volume',
  rush_rec_yds: 'hybrid_volume',
  rush_yds: 'rush_volume',
  targets: 'receiver_volume',
};

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function formatOdds(odds) {
  if (typeof odds !== 'number') return 'n/a';
  return odds > 0 ? `+${odds}` : String(odds);
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

function pct(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
}

function sideKey({ player, market, side }) {
  return `${clean(player).toLowerCase()}|${market}|${side}`;
}

function packetKey(packet) {
  return `${clean(packet.player).toLowerCase()}|${packet.market}`;
}

function marketFamily(market) {
  return MARKET_FAMILIES[market] || 'other';
}

function firstOfferedSide(packet, side = 'Over') {
  return (packet.currentBoard?.betonline || []).find((row) => row.side === side);
}

function packetLeg(packet, row, audit = null, role = 'support') {
  return {
    player: packet.player,
    team: packet.team,
    market: packet.market,
    marketLabel: packet.marketLabel,
    family: marketFamily(packet.market),
    side: row.side,
    selection: row.selection,
    odds: row.odds,
    breakEven: row.breakEven ?? null,
    auditConclusion: audit?.conclusion || 'not_shortlisted',
    auditScore: audit?.score ?? null,
    role,
    reasons: audit?.reasons || [],
  };
}

function auditLeg(audit, packetsByKey, role = 'anchor') {
  const packet = packetsByKey.get(`${clean(audit.player).toLowerCase()}|${audit.market}`);
  return {
    player: audit.player,
    team: packet?.team || null,
    market: audit.market,
    marketLabel: audit.marketLabel,
    family: marketFamily(audit.market),
    side: audit.side,
    selection: audit.selection,
    odds: audit.offeredOdds,
    breakEven: audit.offeredBreakEven,
    auditConclusion: audit.conclusion,
    auditScore: audit.score,
    role,
    reasons: audit.reasons || [],
  };
}

function dedupeLegs(legs) {
  const seen = new Set();
  const deduped = [];
  for (const leg of legs) {
    const key = `${clean(leg.player).toLowerCase()}|${leg.market}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(leg);
  }
  return deduped;
}

function sortByScore(a, b) {
  return (b.auditScore ?? -999) - (a.auditScore ?? -999);
}

function buildAuditIndexes(auditReport) {
  const audits = auditReport.allAudits || [];
  const bySide = new Map();
  for (const audit of audits) bySide.set(sideKey(audit), audit);
  return { audits, bySide };
}

function bestAuditForPacket(packet, bySide, preferredSide = 'Over') {
  const row = firstOfferedSide(packet, preferredSide);
  if (!row) return null;
  return bySide.get(sideKey({ player: packet.player, market: packet.market, side: row.side })) || null;
}

function supportLegsForTeam({ team, packets, bySide, families, exclude = new Set(), max = 2, anchorPlayer = null }) {
  const legs = [];
  for (const packet of packets) {
    if (packet.team !== team || exclude.has(packetKey(packet))) continue;
    if (!families.includes(marketFamily(packet.market))) continue;
    const row = firstOfferedSide(packet, 'Over') || firstOfferedSide(packet, 'Yes');
    if (!row || row.side === 'No' || row.side === 'Under') continue;
    const audit = bestAuditForPacket(packet, bySide, row.side);
    if (audit?.conclusion === 'needs_more_info') continue;
    legs.push(packetLeg(packet, row, audit, 'correlated_support'));
  }
  return dedupeLegs(legs.sort((a, b) => {
    const aSamePlayer = anchorPlayer && clean(a.player).toLowerCase() === clean(anchorPlayer).toLowerCase();
    const bSamePlayer = anchorPlayer && clean(b.player).toLowerCase() === clean(anchorPlayer).toLowerCase();
    if (aSamePlayer !== bSamePlayer) return aSamePlayer ? -1 : 1;
    return sortByScore(a, b);
  })).slice(0, max);
}

function stackScore(legs, stackType) {
  const scoreSum = legs.reduce((sum, leg) => sum + (leg.auditScore ?? -0.01), 0);
  const candidateBonus = legs.filter((leg) => leg.auditConclusion === 'candidate_for_human_review').length * 0.03;
  const watchBonus = legs.filter((leg) => leg.auditConclusion === 'price_watch').length * 0.012;
  const tdCount = legs.filter((leg) => leg.family === 'touchdown').length;
  const tdPenalty = stackType === 'td_cluster_watch' ? 0 : Math.max(0, tdCount - 1) * 0.035;
  return Number((scoreSum + candidateBonus + watchBonus - tdPenalty).toFixed(4));
}

function buildStack({ id, title, thesis, type, legs, cautions }) {
  const deduped = dedupeLegs(legs).slice(0, DEFAULT_MAX_LEGS);
  return {
    id,
    title,
    type,
    thesis,
    legs: deduped,
    score: stackScore(deduped, type),
    cautions: [
      'Verify the book accepts these as same-game parlay legs at usable prices.',
      'Verify active status, role, matchup, weather, and existing ticket exposure before any action.',
      ...cautions,
    ],
    guardrail: 'Curated stack candidate for human review only; not an official pick card or bet instruction.',
  };
}

export function buildPropStackReport(packetArtifact, auditReport, { maxStacks = 6 } = {}) {
  const packets = packetArtifact.packets || [];
  const packetsByKey = new Map(packets.map((packet) => [packetKey(packet), packet]));
  const { audits, bySide } = buildAuditIndexes(auditReport);
  const teams = [...new Set(packets.map((packet) => packet.team).filter(Boolean))].sort();

  const positiveAudits = audits
    .filter((audit) => ['candidate_for_human_review', 'price_watch'].includes(audit.conclusion))
    .filter((audit) => !['No', 'Under'].includes(audit.side))
    .map((audit) => auditLeg(audit, packetsByKey))
    .sort(sortByScore);

  const stacks = [];
  for (const team of teams) {
    const passAnchor = positiveAudits
      .filter((leg) => leg.team === team && ['receiver_volume', 'pass_volume'].includes(leg.family))
      .sort(sortByScore)[0];
    if (passAnchor) {
      const exclude = new Set([`${clean(passAnchor.player).toLowerCase()}|${passAnchor.market}`]);
      const support = supportLegsForTeam({
        team,
        packets,
        bySide,
        families: ['pass_volume', 'receiver_volume'],
        exclude,
        max: 2,
      });
      stacks.push(buildStack({
        id: `${team.toLowerCase()}-pass-volume`,
        title: `${team} pass/receiver volume`,
        type: 'pass_volume',
        thesis: 'A compact stack for a pass-volume or chase-script read, anchored by a screened receiver/pass leg and supported only by related volume legs.',
        legs: [passAnchor, ...support],
        cautions: [
          'Do not mix in touchdown-only legs unless the role evidence also supports red-zone usage.',
          'Same-player reception plus yardage stacks can be highly correlated; confirm the book allows the combination and compare the repriced payout.',
        ],
      }));
    }

    const tdAnchors = positiveAudits.filter((leg) => leg.team === team && leg.market === 'atd');
    const tdStackCandidate = tdAnchors
      .map((tdAnchor) => {
        const exclude = new Set([`${clean(tdAnchor.player).toLowerCase()}|${tdAnchor.market}`]);
        const support = supportLegsForTeam({
          team,
          packets,
          bySide,
          families: ['rush_volume', 'hybrid_volume', 'receiver_volume'],
          exclude,
          max: 2,
          anchorPlayer: tdAnchor.player,
        });
        const hasSamePlayerUsage = support.some((leg) => clean(leg.player).toLowerCase() === clean(tdAnchor.player).toLowerCase());
        return { tdAnchor, support, hasSamePlayerUsage };
      })
      .find((item) => item.hasSamePlayerUsage);
    const tdAnchor = tdStackCandidate?.tdAnchor;
    if (tdAnchor) {
      stacks.push(buildStack({
        id: `${team.toLowerCase()}-score-anchor`,
        title: `${team} scoring-role anchor`,
        type: 'scoring_role',
        thesis: 'A touchdown anchor only makes sense as a stack when paired with usage that explains how the player or offense gets there.',
        legs: [tdAnchor, ...tdStackCandidate.support],
        cautions: [
          'Avoid stacking multiple anytime TD legs from the same offense unless the intent is a low-probability ladder ticket.',
          'Red-zone share and goal-line personnel are mandatory checks for this stack.',
        ],
      }));
    }
  }

  const tdWatches = positiveAudits
    .filter((leg) => ['touchdown', 'touchdown_lotto'].includes(leg.family))
    .sort(sortByScore)
    .slice(0, 4);

  const returnedStacks = stacks
    .filter((stack) => stack.legs.length >= 2)
    .filter((stack) => stack.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(maxStacks));

  const covered = new Set(returnedStacks.flatMap((stack) => stack.legs.map((leg) => `${leg.player}|${leg.market}`)));
  const tdWatchKeys = new Set(tdWatches.map((leg) => `${leg.player}|${leg.market}`));
  const singleLegWatches = positiveAudits
    .filter((leg) => !covered.has(`${leg.player}|${leg.market}`))
    .filter((leg) => !tdWatchKeys.has(`${leg.player}|${leg.market}`))
    .slice(0, 12);

  return {
    schema: 'prop_stack_agent_report_v1',
    generatedAt: new Date().toISOString(),
    sourceSchemas: {
      packets: packetArtifact.schema,
      audit: auditReport.schema,
    },
    event: packetArtifact.event || auditReport.event,
    summary: {
      stacks: returnedStacks.length,
      singleLegWatches: singleLegWatches.length,
      touchdownWatches: tdWatches.length,
      teams,
      inputPackets: packets.length,
      inputAuditSides: auditReport.summary?.auditedSides ?? audits.length,
    },
    methodology: [
      'Starts from the price-audit candidates, then groups only compatible legs around a clear game thesis.',
      'Deduplicates player+market legs, so ATD and Anytime Touchdown Scorer cannot appear as separate stack legs.',
      'Avoids No and Under legs by default because they usually create weaker entertainment parlay stories and tougher same-game correlation checks.',
      'Separates touchdown longshots into a watchlist when they are price-interesting but not naturally stackable.',
    ],
    stacks: returnedStacks,
    touchdownWatchlist: tdWatches.map((leg) => ({
      ...leg,
      note: 'Price-interesting touchdown leg; keep out of parlays unless a separate role/game-script case supports it.',
    })),
    singleLegWatches,
  };
}

export function renderStackMarkdown(report) {
  const lines = [
    '# Prop Stack Agent Report',
    '',
    `Event: ${report.event}`,
    `Generated: ${report.generatedAt}`,
    '',
    'Guardrail: curated stack candidates for human review only; not official picks, bet instructions, or a replacement for injury/role verification.',
    '',
    '## Summary',
    '',
    `- Stacks returned: ${report.summary.stacks}`,
    `- Touchdown watches: ${report.summary.touchdownWatches}`,
    `- Single-leg watches: ${report.summary.singleLegWatches}`,
    `- Teams: ${report.summary.teams.join(', ')}`,
    '',
  ];

  for (const [index, stack] of report.stacks.entries()) {
    lines.push(`## ${index + 1}. ${stack.title}`);
    lines.push('');
    lines.push(`Thesis: ${stack.thesis}`);
    lines.push(`Score: ${stack.score}`);
    lines.push('');
    for (const leg of stack.legs) {
      lines.push(`- ${leg.player} ${leg.selection} ${formatOdds(leg.odds)} (${leg.auditConclusion}; break-even ${pct(leg.breakEven)})`);
    }
    lines.push('');
    lines.push(`Cautions: ${stack.cautions.join(' ')}`);
    lines.push('');
  }

  if (report.touchdownWatchlist?.length) {
    lines.push('## Touchdown Watchlist');
    lines.push('');
    lines.push('These are intentionally separated from the stack list. ATD and first-TD prices can be interesting, but they are not automatically good parlay glue.');
    lines.push('');
    for (const leg of report.touchdownWatchlist) {
      lines.push(`- ${leg.player} ${leg.selection} ${formatOdds(leg.odds)} (${leg.auditConclusion}; ${leg.family})`);
    }
    lines.push('');
  }

  if (report.singleLegWatches.length) {
    lines.push('## Single-Leg Watches');
    lines.push('');
    for (const leg of report.singleLegWatches) {
      lines.push(`- ${leg.player} ${leg.selection} ${formatOdds(leg.odds)} (${leg.auditConclusion}; ${leg.family})`);
    }
    lines.push('');
  }

  lines.push('## Methodology');
  lines.push('');
  for (const item of report.methodology) lines.push(`- ${item}`);
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
  if (!args.packets || !args.audit || !args.out) {
    console.error('Usage: node scripts/props/run-prop-stack-agent.mjs --packets <packets.json> --audit <audit.json> --out <report.json> [--md <report.md>] [--max-stacks N]');
    process.exit(2);
  }
  const packets = readJson(args.packets);
  const audit = readJson(args.audit);
  const report = buildPropStackReport(packets, audit, {
    maxStacks: args['max-stacks'] ? Number(args['max-stacks']) : 6,
  });
  report.sourceArtifacts = {
    packets: args.packets,
    audit: args.audit,
  };
  writeJson(args.out, report);
  if (args.md) writeMarkdown(args.md, renderStackMarkdown(report));
  console.log(`Built ${report.summary.stacks} prop stack candidates -> ${args.out}`);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(`Prop stack agent failed: ${error.message}`);
    process.exit(1);
  });
}
