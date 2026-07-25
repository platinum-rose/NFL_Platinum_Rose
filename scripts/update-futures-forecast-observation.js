#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const LIST = argv.includes('--list');
const ID = getArg('--id', null);
const KEY = getArg('--key', null);
const RUN_ID = getArg('--run-id', null);
const OUT = path.resolve(ROOT, getArg('--ledger', 'data/futures-benchmark/forecast-observations.json'));

const closingPrice = numberArg('--closing-price');
const closingAt = getArg('--closing-at', null);
const closingSource = getArg('--closing-source', null);
const outcome = getArg('--outcome', null);
const settledAt = getArg('--settled-at', null);
const settlementSource = getArg('--settlement-source', null);
const note = getArg('--note', null);

const VALID_OUTCOMES = new Set(['won', 'lost', 'push', 'void', 'superseded']);

function numberArg(name) {
  const raw = getArg(name, null);
  return raw == null ? null : Number(raw);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
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

function clvPct(openPrice, closePrice) {
  const openDec = americanToDecimal(openPrice);
  const closeDec = americanToDecimal(closePrice);
  if (openDec == null || closeDec == null) return null;
  return round((openDec / closeDec - 1) * 100, 4);
}

function round(x, n = 4) {
  return x == null ? null : Math.round(Number(x) * 10 ** n) / 10 ** n;
}

function hasResolution(o) {
  return o.closing_price != null || o.closing_implied_prob != null || o.outcome != null;
}

function findObservation(rows) {
  if (ID) return rows.find((o) => o.id === ID);
  if (KEY && RUN_ID) return rows.find((o) => o.key === KEY && o.run_id === RUN_ID);
  if (KEY) {
    const matches = rows.filter((o) => o.key === KEY);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      throw new Error(`Multiple observations match --key; add --run-id. Matches: ${matches.map((o) => o.id).join(', ')}`);
    }
  }
  return null;
}

const ledger = readJson(OUT);
const rows = ledger.observations || [];

if (LIST) {
  for (const o of rows) {
    console.log(`${o.id} ${o.status} ${o.market} ${o.selection} ${o.recommended_price}@${o.book} close=${o.closing_price ?? '-'} outcome=${o.outcome ?? '-'} key="${o.key}"`);
  }
  console.log(`${rows.length} observation(s)`);
  process.exit(0);
}

if (outcome && !VALID_OUTCOMES.has(outcome)) {
  console.error(`--outcome must be one of: ${[...VALID_OUTCOMES].join(', ')}`);
  process.exit(1);
}

const obs = findObservation(rows);
if (!obs) {
  console.error('No observation matched. Use --list, then pass --id or --key plus --run-id.');
  process.exit(1);
}

if (closingPrice != null) {
  obs.closing_price = closingPrice;
  obs.closing_implied_prob = impliedProb(closingPrice);
  obs.closing_at = closingAt || new Date().toISOString();
  obs.closing_source = closingSource || 'manual';
  obs.clv_pct = clvPct(obs.recommended_price, closingPrice);
}
if (outcome) {
  obs.outcome = outcome;
  obs.settled_at = settledAt || new Date().toISOString();
  obs.settlement_source = settlementSource || 'manual';
}
if (note) obs.result_note = note;

obs.counts_toward_sample_minimum = obs.sample_eligible !== false && hasResolution(obs);
obs.status = obs.outcome ? `settled_${obs.outcome}` : (obs.closing_price != null ? 'closing_price_recorded' : obs.status);
ledger.updated_at = new Date().toISOString();

writeJson(OUT, ledger);
console.log(`updated ${obs.id}: ${obs.status}, counts=${obs.counts_toward_sample_minimum}`);

