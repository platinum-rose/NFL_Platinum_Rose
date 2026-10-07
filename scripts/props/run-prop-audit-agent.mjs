#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { americanToImpliedProbability } from './build-ai-matchup-packets.mjs';

const __filename = fileURLToPath(import.meta.url);

const DEFAULT_TOP = 20;
const LADDER_MARKETS = new Set([
  'pass_yds',
  'rush_yds',
  'rush_rec_yds',
  'rec_yds',
  'rec',
  'pass_cmp',
  'pass_td',
  'atd',
  'atd_1_plus',
  'first_td',
  'first_td_yn',
]);

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function formatOdds(odds) {
  if (typeof odds !== 'number') return 'n/a';
  return odds > 0 ? `+${odds}` : String(odds);
}

function pct(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
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

function targetThreshold(row) {
  if (!row || typeof row.line !== 'number') return null;
  if (row.side === 'Over') return Math.floor(row.line) + 1;
  if (row.side === 'Under') return Math.floor(row.line) + 1;
  return row.line;
}

function ladderPoint(row) {
  if (!row || typeof row.line !== 'number' || typeof row.breakEven !== 'number') return null;
  return { line: row.line, probability: row.breakEven, row };
}

export function interpolateLadderProbability(ladderRows, target) {
  const points = ladderRows
    .map(ladderPoint)
    .filter(Boolean)
    .sort((a, b) => a.line - b.line);

  if (!points.length || target == null) return null;
  const exact = points.find((point) => point.line === target);
  if (exact) return { probability: exact.probability, method: 'exact_ladder', support: [exact.row] };
  const lower = [...points].reverse().find((point) => point.line < target);
  const upper = points.find((point) => point.line > target);
  if (lower && upper) {
    const span = upper.line - lower.line;
    const weight = (target - lower.line) / span;
    const probability = lower.probability + (upper.probability - lower.probability) * weight;
    return { probability, method: 'interpolated_ladder', support: [lower.row, upper.row] };
  }
  const nearest = points
    .map((point) => ({ ...point, distance: Math.abs(point.line - target) }))
    .sort((a, b) => a.distance - b.distance)[0];
  return { probability: nearest.probability, method: 'nearest_ladder_outside_range', support: [nearest.row] };
}

function fairProbabilityForSide(packet, sideRow) {
  const ladder = packet.currentBoard.bookmakerLadder || [];
  if (!LADDER_MARKETS.has(packet.market) || !ladder.length) return null;

  if (['atd', 'atd_1_plus', 'first_td', 'first_td_yn'].includes(packet.market)) {
    const row = packet.currentBoard.bookmakerNearest?.[0] || ladder[0];
    if (!row?.breakEven) return null;
    if (sideRow.side === 'No' && (packet.market === 'atd' || packet.market === 'first_td_yn')) {
      return {
        probability: 1 - row.breakEven,
        method: 'inverse_single_yes_ladder',
        support: [row],
      };
    }
    return {
      probability: row.breakEven,
      method: 'single_yes_ladder',
      support: [row],
    };
  }

  const target = targetThreshold(sideRow);
  const overEstimate = interpolateLadderProbability(ladder, target);
  if (!overEstimate) return null;
  if (sideRow.side === 'Under') {
    return {
      probability: 1 - overEstimate.probability,
      method: `inverse_${overEstimate.method}`,
      support: overEstimate.support,
    };
  }
  return overEstimate;
}

function movementBoost(packet, sideRow) {
  const moves = packet.movement?.bookmaker || [];
  if (!moves.length) return { boost: 0, notes: [] };
  const target = targetThreshold(sideRow);
  const relevant = moves.filter((move) => {
    if (target == null) return clean(move.selection).toLowerCase().includes(clean(sideRow.player).toLowerCase());
    return Math.abs((move.line ?? 9999) - target) <= 10;
  });
  if (!relevant.length) return { boost: 0, notes: [] };
  const strongest = relevant.sort((a, b) => Math.abs(b.oddsMove) - Math.abs(a.oddsMove))[0];
  const shortened = strongest.oddsMove < 0;
  const supportsSide = sideRow.side === 'Over' || sideRow.side === 'Yes' ? shortened : !shortened;
  return {
    boost: supportsSide ? Math.min(0.015, Math.abs(strongest.oddsMove) / 10000) : -0.005,
    notes: [`BKR movement near this market: ${strongest.selection} ${formatOdds(strongest.beforeOdds)} -> ${formatOdds(strongest.currentOdds)}`],
  };
}

function holdPenalty(packet) {
  const hold = packet.priceMath?.twoWay?.hold;
  if (typeof hold !== 'number') return 0;
  if (hold > 0.08) return -0.015;
  if (hold > 0.065) return -0.0075;
  return 0;
}

function classify(edge, hasMarketEstimate) {
  if (!hasMarketEstimate) return 'needs_more_info';
  if (edge >= 0.04) return 'candidate_for_human_review';
  if (edge >= 0.018) return 'price_watch';
  return 'pass';
}

function sideRows(packet) {
  const rows = packet.currentBoard.betonline || [];
  return rows.filter((row) => ['Over', 'Under', 'Yes', 'No'].includes(row.side));
}

export function auditPackets(packetArtifact, { top = DEFAULT_TOP } = {}) {
  const candidates = [];
  const allAudits = [];

  for (const packet of packetArtifact.packets || []) {
    for (const row of sideRows(packet)) {
      const marketEstimate = fairProbabilityForSide(packet, row);
      const breakEven = row.breakEven ?? americanToImpliedProbability(row.odds);
      const rawEdge = marketEstimate && breakEven != null ? marketEstimate.probability - breakEven : null;
      const move = movementBoost(packet, row);
      const score = rawEdge == null ? -0.25 : rawEdge + move.boost + holdPenalty(packet);
      const conclusion = classify(score, Boolean(marketEstimate));
      const reasons = [];
      if (marketEstimate) {
        reasons.push(`BKR ${marketEstimate.method} estimate ${pct(marketEstimate.probability)} vs BEO break-even ${pct(breakEven)}`);
      } else {
        reasons.push('No comparable BKR ladder/market estimate available');
      }
      if (packet.priceMath?.twoWay) {
        const noVigSide = packet.priceMath.twoWay.sides.find((side) => side.side === row.side);
        if (noVigSide) reasons.push(`BEO no-vig ${row.side}: ${pct(noVigSide.noVigProbability)} (${formatOdds(noVigSide.noVigAmerican)})`);
      }
      reasons.push(...move.notes);

      const audit = {
        packetId: packet.packetId,
        event: packet.event,
        player: packet.player,
        market: packet.market,
        marketLabel: packet.marketLabel,
        side: row.side,
        selection: row.selection,
        offeredBook: row.book,
        offeredOdds: row.odds,
        offeredBreakEven: breakEven,
        marketEstimateProbability: marketEstimate?.probability ?? null,
        estimatedEdge: rawEdge,
        score,
        conclusion,
        reasons,
        supportRows: (marketEstimate?.support || []).map((support) => ({
          book: support.book,
          selection: support.selection,
          line: support.line,
          odds: support.odds,
          breakEven: support.breakEven,
        })),
        requiredMissingFacts: packet.missingFactsChecklist,
        guardrail: 'This is a price-audit ranking for human review, not an official pick or bet instruction.',
      };
      allAudits.push(audit);
      if (['candidate_for_human_review', 'price_watch'].includes(conclusion)) candidates.push(audit);
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return {
    schema: 'prop_audit_agent_report_v1',
    generatedAt: new Date().toISOString(),
    sourceSchema: packetArtifact.schema,
    event: packetArtifact.event,
    summary: {
      auditedSides: allAudits.length,
      candidates: candidates.length,
      needsMoreInfo: allAudits.filter((item) => item.conclusion === 'needs_more_info').length,
      returned: Math.min(candidates.length, Number(top)),
      conclusions: allAudits.reduce((acc, item) => {
        acc[item.conclusion] = (acc[item.conclusion] || 0) + 1;
        return acc;
      }, {}),
    },
    methodology: [
      'Uses BEO as offered two-sided price when available.',
      'Uses BKR ladder/yes market as market-implied context, not as a projection.',
      'Ranks by estimated probability gap versus offered break-even, with small movement and hold adjustments.',
      'Requires human review of inactives, role, matchup, game script, and exposure before any action.',
    ],
    topCandidates: candidates.slice(0, Number(top)),
    allAudits,
  };
}

export function renderAuditMarkdown(report) {
  const lines = [
    '# Prop Audit Agent Report',
    '',
    `Event: ${report.event}`,
    `Generated: ${report.generatedAt}`,
    '',
    'Guardrail: this is a price-audit shortlist for human review, not an official pick card and not a bet instruction.',
    '',
    '## Summary',
    '',
    `- Audited sides: ${report.summary.auditedSides}`,
    `- Candidate/watch items: ${report.summary.candidates}`,
    `- Returned: ${report.summary.returned}`,
    `- Conclusions: ${Object.entries(report.summary.conclusions).map(([key, value]) => `${key} ${value}`).join(', ')}`,
    '',
    '## Top Candidates',
    '',
  ];

  for (const [index, item] of report.topCandidates.entries()) {
    lines.push(`### ${index + 1}. ${item.player} ${item.selection} ${formatOdds(item.offeredOdds)} (${item.conclusion})`);
    lines.push('');
    lines.push(`- Score: ${(item.score * 100).toFixed(1)} pts`);
    lines.push(`- Offered break-even: ${pct(item.offeredBreakEven)}`);
    lines.push(`- Market estimate: ${pct(item.marketEstimateProbability)}`);
    lines.push(`- Estimated gap: ${pct(item.estimatedEdge)}`);
    lines.push(`- Reasons: ${item.reasons.join('; ')}`);
    if (item.supportRows.length) {
      lines.push(`- Support rows: ${item.supportRows.map((row) => `${row.selection} ${formatOdds(row.odds)} (${pct(row.breakEven)})`).join(', ')}`);
    }
    lines.push(`- Must verify: active/inactive status, role, red-zone usage, matchup, game script, weather, and existing exposure.`);
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
  if (!args.packets || !args.out) {
    console.error('Usage: node scripts/props/run-prop-audit-agent.mjs --packets <packets.json> --out <report.json> [--md <report.md>] [--top N]');
    process.exit(2);
  }
  const packets = readJson(args.packets);
  const report = auditPackets(packets, { top: args.top ? Number(args.top) : DEFAULT_TOP });
  report.sourceArtifact = args.packets;
  writeJson(args.out, report);
  if (args.md) writeMarkdown(args.md, renderAuditMarkdown(report));
  console.log(`Audited ${report.summary.auditedSides} sides; returned ${report.summary.returned} candidates -> ${args.out}`);
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(`Prop audit agent failed: ${error.message}`);
    process.exit(1);
  });
}
