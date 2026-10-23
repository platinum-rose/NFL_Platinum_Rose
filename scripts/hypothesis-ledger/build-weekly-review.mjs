#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const input = path.resolve(ROOT, getArg('--in', 'data/research-intel/hypothesis-ledger/2026-w05-pilot.json'));
const output = path.resolve(ROOT, getArg('--out', 'data/research-intel/hypothesis-ledger/2026-w05-pilot-review.md'));
const ledger = JSON.parse(fs.readFileSync(input, 'utf8'));

function americanToDecimal(price) {
  const p = Number(price);
  if (!Number.isFinite(p) || p === 0) return null;
  return p > 0 ? 1 + p / 100 : 1 + 100 / Math.abs(p);
}
function impliedProbability(price) {
  const decimal = americanToDecimal(price);
  return decimal == null ? null : 1 / decimal;
}
function clvPct(entryPrice, closePrice) {
  const entry = americanToDecimal(entryPrice);
  const close = americanToDecimal(closePrice);
  return entry == null || close == null ? null : ((entry / close) - 1) * 100;
}
function round(value, places = 3) {
  return value == null || !Number.isFinite(value) ? null : Math.round(value * 10 ** places) / 10 ** places;
}
function mean(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function groupCount(rows, key) {
  return rows.reduce((out, row) => {
    const value = row[key] || 'unknown';
    out[value] = (out[value] || 0) + 1;
    return out;
  }, {});
}
function bullets(object) {
  const rows = Object.entries(object);
  return rows.length ? rows.map(([key, value]) => '- ' + key + ': ' + value).join('\n') : '- none';
}

const recommendations = ledger.recommendations || [];
const tickets = ledger.tickets || [];
const frozen = recommendations.filter((rec) => ['frozen', 'resolved'].includes(rec.status));
const passes = recommendations.filter((rec) => rec.status === 'pass');
const pricedResolved = recommendations.filter((rec) => (
  rec.forecast?.status === 'priced' &&
  ['won', 'lost'].includes(rec.outcome?.result)
));
const calibration = pricedResolved.map((rec) => {
  const p = Number(rec.forecast.probability);
  const outcome = rec.outcome.result === 'won' ? 1 : 0;
  return (p - outcome) ** 2;
});
const clv = frozen.map((rec) => {
  const entry = rec.market_baselines?.accepted_book?.price ?? rec.market?.price;
  const close = rec.snapshots?.kickoff_close?.price;
  return clvPct(entry, close);
}).filter((value) => value != null);
const officialTickets = tickets.filter((ticket) => ticket.ticket_kind === 'official_reference');
const paperTickets = tickets.filter((ticket) => ticket.ticket_kind === 'paper');
const settledTickets = tickets.filter((ticket) => Number.isFinite(Number(ticket.risk)) && Number.isFinite(Number(ticket.return)));
const ticketRoi = settledTickets.map((ticket) => ((Number(ticket.return) - Number(ticket.risk)) / Number(ticket.risk)) * 100);

const report = [
  '# Week ' + ledger.week + ' Hypothesis Ledger Review',
  '',
  'Generated: ' + new Date().toISOString(),
  '',
  'This is a local evaluation report. It does not place, settle, or modify tickets.',
  '',
  '## Forecast and evidence review',
  '',
  '- Total recommendations: ' + recommendations.length,
  '- Frozen or resolved: ' + frozen.length,
  '- Passes: ' + passes.length,
  '- Priced and settled forecasts: ' + pricedResolved.length,
  '- Brier score: ' + (round(mean(calibration), 6) ?? 'not yet measurable'),
  '- Mean CLV: ' + (round(mean(clv), 4) == null ? 'not yet measurable' : round(mean(clv), 4) + '%'),
  '',
  '### By edge type',
  '',
  bullets(groupCount(recommendations, 'edge_type')),
  '',
  '### By decision quality',
  '',
  bullets(groupCount(recommendations.map((rec) => ({ quality: rec.decision_quality?.state })), 'quality')),
  '',
  '### Pass reasons',
  '',
  bullets(groupCount(passes, 'pass_reason')),
  '',
  '## Bankroll and ticket review',
  '',
  '- Total ticket references: ' + tickets.length,
  '- Official references: ' + officialTickets.length,
  '- Paper tickets: ' + paperTickets.length,
  '- Settled tickets with recorded risk and return: ' + settledTickets.length,
  '- Mean ticket ROI: ' + (round(mean(ticketRoi), 4) == null ? 'not yet measurable' : round(mean(ticketRoi), 4) + '%'),
  '',
  '## Interpretation guardrail',
  '',
  recommendations.length < 30
    ? 'Exploratory only: fewer than 30 recommendations are present. Do not adjust source or feature weights.'
    : recommendations.length < 100
      ? 'Directional only: fewer than 100 recommendations are present. Any conclusion remains low confidence.'
      : 'Human review required: sample size is sufficient for a weight-adjustment discussion, but no automatic reweighting is permitted.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, report, 'utf8');
console.log('wrote ' + path.relative(ROOT, output));
