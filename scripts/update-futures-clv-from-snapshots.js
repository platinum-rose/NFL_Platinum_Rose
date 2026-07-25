#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};

const LEDGER = path.resolve(ROOT, getArg('--ledger', 'data/futures-benchmark/forecast-observations.json'));
const CHECKPOINT_HOURS = Number(getArg('--checkpoint-hours', process.env.FUTURES_CLV_CHECKPOINT_HOURS || '24'));
const DRY_RUN = argv.includes('--dry-run');
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SB_URL || !SB_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to read stored futures snapshots.');
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\bwin\s+super\s+bowl\b/g, '')
    .replace(/\bmake\s+playoffs\b/g, '')
    .replace(/\bwins?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeBook(value) {
  return String(value || '').trim().toLowerCase();
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

function checkpointAt(obs) {
  const base = new Date(obs.information_cutoff || obs.run_date || Date.now()).getTime();
  return new Date(base + CHECKPOINT_HOURS * 60 * 60 * 1000);
}

function rowTime(row) {
  return row.snapshot_time || row.captured_at || null;
}

function rowPrice(row, obs) {
  if (obs.market === 'wins') {
    const side = obs.side || (/\bunder\b/i.test(obs.selection || '') ? 'under' : /\bover\b/i.test(obs.selection || '') ? 'over' : null);
    if (side === 'over') return row.over_price ?? row.price ?? row.odds ?? null;
    if (side === 'under') return row.under_price ?? row.price ?? row.odds ?? null;
  }
  return row.price ?? row.odds ?? null;
}

function selectionMatches(obs, row) {
  const obsSel = normalizeText(obs.selection);
  const rowTeam = normalizeText(row.team);
  const rowSel = normalizeText(row.selection);
  if (obs.market === 'wins') {
    const team = normalizeText(obs.team || obs.selection);
    return rowTeam === team || rowSel === team || obsSel.includes(rowTeam) || obsSel.includes(rowSel);
  }
  if (obs.market === 'superbowl_matchup') {
    return rowTeam === obsSel || rowSel === obsSel || sameMatchup(obsSel, rowTeam) || sameMatchup(obsSel, rowSel);
  }
  return rowTeam === obsSel || rowSel === obsSel || obsSel.includes(rowTeam) || obsSel.includes(rowSel);
}

function sameMatchup(a, b) {
  const split = (x) => x.split(/\bvs\b|\bv\b|@/).map((p) => normalizeText(p)).filter(Boolean).sort();
  const aa = split(a);
  const bb = split(b);
  return aa.length === 2 && bb.length === 2 && aa[0] === bb[0] && aa[1] === bb[1];
}

async function findCheckpointQuote(obs) {
  const target = checkpointAt(obs);
  const targetIso = target.toISOString();
  const market = obs.market;
  let q = sb.from('futures_odds_snapshots')
    .select('market_type, team, selection, book, odds, price, implied_prob, line, over_price, under_price, snapshot_time, captured_at, season')
    .eq('season', obs.season || 2026)
    .eq('market_type', market)
    .gte('snapshot_time', targetIso)
    .order('snapshot_time', { ascending: true })
    .limit(500);

  let { data, error } = await q;
  if (error && /snapshot_time/i.test(error.message || '')) {
    ({ data, error } = await sb.from('futures_odds_snapshots')
      .select('market_type, team, selection, book, odds, price, implied_prob, line, over_price, under_price, captured_at, season')
      .eq('season', obs.season || 2026)
      .eq('market_type', market)
      .gte('captured_at', targetIso)
      .order('captured_at', { ascending: true })
      .limit(500));
  }
  if (error) throw new Error(error.message);

  const matches = (data || [])
    .filter((row) => selectionMatches(obs, row))
    .filter((row) => rowPrice(row, obs) != null);
  if (!matches.length) return null;

  const sameBook = matches.find((row) => normalizeBook(row.book) === normalizeBook(obs.book));
  const chosen = sameBook || matches[0];
  return {
    price: rowPrice(chosen, obs),
    book: chosen.book,
    observed_at: rowTime(chosen),
    source: sameBook ? 'same_book_snapshot' : 'first_matching_snapshot',
  };
}

function hasResolution(obs) {
  return obs.closing_price != null || obs.closing_implied_prob != null || obs.outcome != null;
}

const ledger = readJson(LEDGER);
let updated = 0;
let pending = 0;
let notDue = 0;
let unmatched = 0;

for (const obs of ledger.observations || []) {
  if (obs.sample_eligible === false || hasResolution(obs)) continue;
  const due = checkpointAt(obs);
  if (due.getTime() > Date.now()) {
    notDue++;
    continue;
  }
  pending++;
  const quote = await findCheckpointQuote(obs);
  if (!quote) {
    unmatched++;
    obs.last_clv_attempt_at = new Date().toISOString();
    obs.last_clv_attempt_status = `no_matching_snapshot_at_${CHECKPOINT_HOURS}h`;
    continue;
  }
  obs.closing_price = quote.price;
  obs.closing_implied_prob = impliedProb(quote.price);
  obs.closing_at = quote.observed_at || new Date().toISOString();
  obs.closing_source = `futures_odds_snapshots:${quote.source}:${quote.book}`;
  obs.clv_pct = clvPct(obs.recommended_price, quote.price);
  obs.counts_toward_sample_minimum = true;
  obs.status = `clv_${CHECKPOINT_HOURS}h_recorded`;
  obs.last_clv_attempt_at = new Date().toISOString();
  obs.last_clv_attempt_status = 'matched';
  updated++;
}

ledger.updated_at = new Date().toISOString();

console.log(`CLV checkpoint ${CHECKPOINT_HOURS}h: ${updated} updated, ${unmatched} unmatched, ${notDue} not due, ${pending} due`);
if (DRY_RUN) {
  console.log(`dry run: would write ${path.relative(ROOT, LEDGER)}`);
} else {
  writeJson(LEDGER, ledger);
  console.log(`wrote ${path.relative(ROOT, LEDGER)}`);
}

