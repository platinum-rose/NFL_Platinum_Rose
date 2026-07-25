#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const RAW = getArg('--raw', null);
const DIR = path.resolve(ROOT, getArg('--dir', '.nfl/portfolio'));
const OUT = path.resolve(ROOT, getArg('--out', 'data/futures-benchmark/forecast-observations.json'));
const INCLUDE_CORPUS = argv.includes('--include-corpus');
const ALL_RUNS = argv.includes('--all-runs');
const PRUNE = argv.includes('--prune');
const DRY_RUN = argv.includes('--dry-run');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function rawFiles() {
  if (RAW) return [path.resolve(ROOT, RAW)];
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((name) => /^portfolio-\d{4}-\d{2}-\d{2}.*\.raw\.json$/.test(name))
    .filter((name) => INCLUDE_CORPUS || !/-corpus-/.test(name))
    .filter((name) => ALL_RUNS || /-shadow-/.test(name))
    .map((name) => path.join(DIR, name));
}

function americanToDecimal(price) {
  if (price == null || Number.isNaN(Number(price))) return null;
  const p = Number(price);
  return p > 0 ? 1 + p / 100 : 1 + 100 / Math.abs(p);
}

function impliedProb(price) {
  const dec = americanToDecimal(price);
  return dec == null ? null : round(1 / dec, 6);
}

function observationId(raw, rec, file) {
  const input = [
    raw.meta?.run_id || raw.meta?.date || path.basename(file),
    rec.key || '',
    rec.market || '',
    rec.selection || '',
    rec.book || '',
    rec.price ?? '',
  ].join('|');
  return `obs_${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

function teamSideLine(rec) {
  if (rec.market !== 'wins') return {};
  const m = String(rec.selection || '').match(/^(.+?)\s+(Over|Under)\s+(\d+(?:\.\d+)?)\s+wins$/i);
  if (!m) return {};
  return { team: m[1].trim(), side: m[2].toLowerCase(), line: Number(m[3]) };
}

function sourceKind(file) {
  const name = path.basename(file);
  if (/-corpus-/.test(name)) return 'development_corpus';
  if (/-shadow-/.test(name)) return 'shadow_run';
  return 'legacy_raw_run';
}

function observationFrom(raw, rec, file) {
  const kind = sourceKind(file);
  const fair = rec.code_fair_prob ?? rec.model_fair_prob ?? null;
  return {
    id: observationId(raw, rec, file),
    status: 'shadow_pending_close',
    source_kind: kind,
    sample_eligible: kind === 'shadow_run',
    counts_toward_sample_minimum: false,
    source_raw_file: path.relative(ROOT, file).replace(/\\/g, '/'),
    run_id: raw.meta?.run_id || null,
    run_date: raw.meta?.date || null,
    information_cutoff: raw.meta?.date ? `${raw.meta.date}T00:00:00Z` : null,
    season: raw.meta?.season ?? null,
    key: rec.key || null,
    market: rec.market || null,
    selection: rec.selection || null,
    ...teamSideLine(rec),
    book: rec.book || null,
    recommended_price: rec.price ?? null,
    recommended_implied_prob: impliedProb(rec.price),
    forecast_prob: fair,
    model_fair_prob: rec.model_fair_prob ?? null,
    code_fair_prob: rec.code_fair_prob ?? null,
    code_fair_prob_ci90: rec.code_fair_prob_ci90 ?? null,
    edge_pct: rec.code_edge_pct ?? rec.edge_pct ?? null,
    edge_lower_bound_pct: rec.edge_lower_bound_pct ?? null,
    confidence: rec.confidence ?? null,
    edge_type: rec.edge_type || null,
    stake_tier: rec.stake_tier || null,
    needs_human_review: rec.needs_human_review === true,
    closing_price: null,
    closing_at: null,
    closing_source: null,
    closing_implied_prob: null,
    clv_pct: null,
    outcome: null,
    settled_at: null,
    settlement_source: null,
    result_note: null
  };
}

function loadLedger() {
  if (!fs.existsSync(OUT)) {
    return {
      schema_version: '1.0',
      updated_at: new Date().toISOString(),
      description: 'Offline shadow ledger for futures recommendation CLV and settlement observations.',
      observations: []
    };
  }
  return readJson(OUT);
}

function round(x, n = 4) {
  return x == null ? null : Math.round(Number(x) * 10 ** n) / 10 ** n;
}

const ledger = loadLedger();
const byId = new Map((ledger.observations || []).map((o) => [o.id, o]));
const selectedFiles = new Set(rawFiles().map((file) => path.relative(ROOT, file).replace(/\\/g, '/')));
if (PRUNE) {
  for (const [id, obs] of byId) {
    if (!selectedFiles.has(obs.source_raw_file)) byId.delete(id);
  }
}
let seenFinal = 0;
let added = 0;
for (const file of rawFiles()) {
  const raw = readJson(file);
  for (const rec of raw.final || []) {
    seenFinal++;
    const obs = observationFrom(raw, rec, file);
    if (byId.has(obs.id)) continue;
    byId.set(obs.id, obs);
    added++;
  }
}

ledger.observations = [...byId.values()].sort((a, b) => (
  String(a.run_date || '').localeCompare(String(b.run_date || '')) || String(a.id).localeCompare(String(b.id))
));
ledger.updated_at = new Date().toISOString();

console.log(`shadow observations: ${ledger.observations.length} total, ${added} added from ${seenFinal} final recommendation(s)`);
if (PRUNE) console.log(`pruned to ${selectedFiles.size} selected raw file(s)`);
if (DRY_RUN) {
  console.log(`dry run: would write ${path.relative(ROOT, OUT)}`);
} else {
  writeJson(OUT, ledger);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}
