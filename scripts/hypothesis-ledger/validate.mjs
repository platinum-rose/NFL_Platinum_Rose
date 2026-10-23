#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const inputArg = args.indexOf('--in');
const input = inputArg >= 0
  ? args[inputArg + 1]
  : 'data/research-intel/hypothesis-ledger/2026-w05-pilot.json';
const file = path.resolve(ROOT, input);

const VALID_STATUS = new Set(['draft', 'proposed', 'frozen', 'resolved', 'pass', 'void', 'superseded']);
const VALID_EDGE_TYPES = new Set(['math', 'market_dislocation', 'matchup_thesis', 'portfolio']);
const VALID_QUALITY = new Set(['eligible', 'review', 'blocked']);
const VALID_FORECAST = new Set(['priced', 'unpriced_thesis']);
const VALID_PASS_REASONS = new Set([
  'no_edge',
  'price_beyond_threshold',
  'stale_or_missing_market',
  'contradictory_evidence',
  'insufficient_sample',
  'execution_unavailable'
]);

function fail(errors, label, message) {
  errors.push(label + ': ' + message);
}

function isIso(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function probabilityBand(policy, probability) {
  return policy.forecast_policy.bands.find((band) => probability >= band.min && probability <= band.max) || null;
}

function validateRecommendation(rec, policy, ids, errors) {
  const label = 'recommendation ' + (rec?.id || '(missing id)');
  if (!rec || typeof rec !== 'object') return fail(errors, label, 'must be an object');
  if (!rec.id || ids.has(rec.id)) fail(errors, label, 'id is missing or duplicated');
  ids.add(rec.id);
  if (!VALID_STATUS.has(rec.status)) fail(errors, label, 'invalid status');
  if (!isIso(rec.created_at)) fail(errors, label, 'created_at must be ISO-8601');
  if (!rec.event?.kickoff_at || !isIso(rec.event.kickoff_at)) fail(errors, label, 'event.kickoff_at must be ISO-8601');
  if (!rec.market?.type || !rec.market?.selection) fail(errors, label, 'market type and selection are required');
  if (!VALID_EDGE_TYPES.has(rec.edge_type)) fail(errors, label, 'invalid edge_type');
  if (!VALID_QUALITY.has(rec.decision_quality?.state)) fail(errors, label, 'invalid decision_quality.state');
  if (!VALID_FORECAST.has(rec.forecast?.status)) fail(errors, label, 'invalid forecast.status');

  if (rec.forecast?.status === 'priced') {
    const p = Number(rec.forecast.probability);
    const band = probabilityBand(policy, p);
    if (!(p > 0 && p < 1)) fail(errors, label, 'priced forecast probability must be between 0 and 1');
    if (!band) fail(errors, label, 'priced forecast probability is outside approved bands');
    if (rec.forecast.band !== band?.label) fail(errors, label, 'forecast.band does not match probability');
    if (p >= 0.65 && rec.decision_quality?.state !== 'review' && rec.human_review?.approved_at == null) {
      fail(errors, label, 'exceptional forecast requires review state or human_review.approved_at');
    }
  } else if (rec.forecast?.probability != null || rec.forecast?.band != null) {
    fail(errors, label, 'unpriced_thesis must not carry probability or band');
  }

  for (const key of ['consensus', 'best_executable', 'accepted_book']) {
    if (rec.market_baselines?.[key] == null && key !== 'accepted_book') {
      fail(errors, label, 'market_baselines.' + key + ' is required');
    }
  }
  if (!rec.hypothesis?.primary || !rec.hypothesis?.disconfirming_condition) {
    fail(errors, label, 'primary hypothesis and disconfirming condition are required');
  }
  if (!Array.isArray(rec.evidence_ids) || rec.evidence_ids.length === 0) {
    fail(errors, label, 'at least one evidence id is required');
  }
  if (rec.status === 'frozen' || rec.status === 'resolved') {
    if (!isIso(rec.snapshots?.frozen_at)) fail(errors, label, 'frozen records require snapshots.frozen_at');
    if (rec.decision_quality?.state !== 'eligible') fail(errors, label, 'frozen records must be eligible');
  }
  if (rec.status === 'pass' && !VALID_PASS_REASONS.has(rec.pass_reason)) {
    fail(errors, label, 'pass records require valid pass_reason');
  }
}

function validateTicket(ticket, recommendationIds, errors) {
  const label = 'ticket ' + (ticket?.id || '(missing id)');
  if (!ticket || typeof ticket !== 'object') return fail(errors, label, 'must be an object');
  if (!['paper', 'official_reference'].includes(ticket.ticket_kind)) fail(errors, label, 'ticket_kind must be paper or official_reference');
  if (!Array.isArray(ticket.recommendation_ids) || ticket.recommendation_ids.length === 0) {
    fail(errors, label, 'must link at least one recommendation');
  }
  for (const id of ticket.recommendation_ids || []) {
    if (!recommendationIds.has(id)) fail(errors, label, 'unknown recommendation id ' + id);
  }
  if (ticket.ticket_kind === 'official_reference') {
    if (!ticket.placement_authorization?.authorized_at || !ticket.placement_authorization?.reference) {
      fail(errors, label, 'official_reference requires explicit placement_authorization');
    }
  }
}

const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
if (ledger.schema !== 'weekly_hypothesis_ledger_v1') fail(errors, 'ledger', 'unexpected schema');
if (!Number.isInteger(ledger.season) || !Number.isInteger(ledger.week)) fail(errors, 'ledger', 'season and week must be integers');
if (!Array.isArray(ledger.recommendations) || !Array.isArray(ledger.tickets)) fail(errors, 'ledger', 'recommendations and tickets must be arrays');
if (ledger.policy?.governance?.official_ledger_mutation_permitted !== false || ledger.policy?.governance?.supabase_mutation_permitted !== false) {
  fail(errors, 'ledger', 'pilot must prohibit official-ledger and Supabase mutation');
}

const ids = new Set();
for (const rec of ledger.recommendations || []) validateRecommendation(rec, ledger.policy, ids, errors);
for (const ticket of ledger.tickets || []) validateTicket(ticket, ids, errors);

const summary = {
  ledger_id: ledger.ledger_id,
  season: ledger.season,
  week: ledger.week,
  recommendations: ledger.recommendations?.length || 0,
  tickets: ledger.tickets?.length || 0,
  evidence_snapshots: ledger.evidence_snapshots?.length || 0,
  status: errors.length ? 'invalid' : 'valid'
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) {
  console.error(errors.map((error) => 'FAIL ' + error).join('\n'));
  process.exitCode = 1;
}
