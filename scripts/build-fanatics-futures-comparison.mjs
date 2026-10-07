#!/usr/bin/env node
/**
 * Normalizes a read-only Fanatics Markets futures capture and aligns its Yes
 * contract prices with a structured BetOnline futures board.
 *
 * This is intentionally a reference-only comparator. A displayed event-contract
 * price is not an executable ask, and no fee schedule is captured, so the tool
 * never names a best venue or produces an order instruction.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULTS = {
  fanatics: 'data/futures-imports/fanatics-markets-2026-09-22-availability-snapshot.json',
  betonline: 'data/futures-imports/betonline-2026-09-22-live-futures-markets.json',
  betonlineSuperBowl: 'data/futures-imports/betonline-2026-09-22-super-bowl-live.json',
  out: 'data/generated/fanatics-futures-comparison-latest.json',
};

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.resolve(ROOT, relativePath), 'utf8'));
}

function americanToDecimal(american) {
  const value = Number(american);
  if (!Number.isFinite(value) || value === 0) return null;
  return value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
}

export function eventContractGrossDecimal(priceCents) {
  const cents = Number(priceCents);
  if (!Number.isFinite(cents) || cents <= 0 || cents >= 100) return null;
  return Number((100 / cents).toFixed(4));
}

export function decimalToAmerican(decimal) {
  const value = Number(decimal);
  if (!Number.isFinite(value) || value <= 1) return null;
  const american = value >= 2
    ? (value - 1) * 100
    : -100 / (value - 1);
  return Math.round(american);
}

export function parseFanaticsPrice(value) {
  const match = String(value).match(/^(.+?)\|yes\s+(\d+)(?:\|no\s+(\d+))?$/i);
  if (!match) return null;
  const yesCents = Number(match[2]);
  return {
    team: match[1].trim(),
    yes_cents: yesCents,
    no_cents: match[3] === undefined ? null : Number(match[3]),
  };
}

function fanaticsRows(snapshot) {
  const rows = [];
  const add = (market, prices, division = null) => {
    for (const value of prices || []) {
      const parsed = parseFanaticsPrice(value);
      if (parsed) rows.push({ market, division, ...parsed });
    }
  };

  // The 32-team Super Bowl capture is retained under its visual snapshot field.
  add('super_bowl', snapshot.visualChampionSnapshot?.prices);
  add('conference_afc', snapshot.futures?.afcChampion?.prices);
  add('conference_nfc', snapshot.futures?.nfcChampion?.prices);
  add('playoffs', snapshot.futures?.makePlayoffs?.prices);
  for (const [divisionKey, data] of Object.entries(snapshot.futures?.divisionWinners || {})) {
    const division = divisionKey.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
    add('division', data.prices, division);
  }
  return rows;
}

function betonlineRows(board, superBowl) {
  const rows = new Map();
  const add = (market, team, odds, division = null) => {
    if (!Number.isFinite(Number(odds))) return;
    rows.set([market, division || '', team].join('|'), { odds: Number(odds) });
  };

  for (const row of superBowl || []) add('super_bowl', row.team, row.odds);
  for (const [conference, teams] of Object.entries(board.marketSnapshots?.conference || {})) {
    if (conference === 'capturedAt' || conference === 'url') continue;
    for (const [team, odds] of Object.entries(teams || {})) add(`conference_${conference.toLowerCase()}`, team, odds);
  }
  for (const [division, teams] of Object.entries(board.marketSnapshots?.division || {})) {
    if (division === 'capturedAt' || division === 'url') continue;
    for (const [team, odds] of Object.entries(teams || {})) add('division', team, odds, division.toUpperCase());
  }
  for (const [team, values] of Object.entries(board.marketSnapshots?.makePlayoffs || {})) {
    if (team === 'capturedAt' || team === 'url') continue;
    add('playoffs', team, Array.isArray(values) ? values[0] : null);
  }
  return rows;
}

export function buildFanaticsFuturesComparison({ fanatics, betonline, betonlineSuperBowl, generatedAt }) {
  const sportsbook = betonlineRows(betonline, betonlineSuperBowl);
  const entries = fanaticsRows(fanatics).map((row) => {
    const grossDecimal = eventContractGrossDecimal(row.yes_cents);
    const candidate = sportsbook.get([row.market, row.division || '', row.team].join('|')) || null;
    const bookDecimal = candidate ? americanToDecimal(candidate.odds) : null;
    return {
      market: row.market,
      division: row.division,
      team: row.team,
      fanatics: {
        yes_price_cents: row.yes_cents,
        no_price_cents: row.no_cents,
        gross_decimal_return: grossDecimal,
        gross_american_equivalent: decimalToAmerican(grossDecimal),
        price_basis: 'rendered percentage/contract cents; not an executable ask',
        fee_adjustment_status: 'missing_current_fee_schedule',
      },
      betonline: candidate && {
        american_odds: candidate.odds,
        decimal_return: Number(bookDecimal.toFixed(4)),
      },
      comparison: {
        status: candidate
          ? 'reference_only_missing_fanatics_fee_and_executable_ask'
          : 'no_matching_betonline_yes_side_in_selected_board',
        gross_decimal_delta_vs_betonline: candidate
          ? Number((grossDecimal - bookDecimal).toFixed(4))
          : null,
        best_price_status: 'not_computed',
      },
    };
  });

  return {
    schema: 'fanatics_futures_reference_comparison_v1',
    generated_at: generatedAt,
    access: 'local read-only inputs only',
    safety: 'Reference only. Do not use this artifact to select a venue or place an order until a current executable Fanatics ask and fee treatment are captured.',
    sources: {
      fanatics: fanatics.source,
      betonline: betonline.source,
    },
    counts: {
      fanatics_contracts: entries.length,
      aligned_betonline_rows: entries.filter((entry) => entry.betonline).length,
      comparison_eligible_rows: 0,
    },
    entries,
  };
}

export async function run(options = {}) {
  const fanatics = await readJson(options.fanatics || DEFAULTS.fanatics);
  const betonline = await readJson(options.betonline || DEFAULTS.betonline);
  const betonlineSuperBowl = await readJson(options.betonlineSuperBowl || DEFAULTS.betonlineSuperBowl);
  const artifact = buildFanaticsFuturesComparison({
    fanatics,
    betonline,
    betonlineSuperBowl,
    generatedAt: options.generatedAt || new Date().toISOString(),
  });
  if (!options.dryRun) {
    const out = path.resolve(ROOT, options.out || DEFAULTS.out);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(artifact, null, 2)}\n`);
  }
  return artifact;
}

async function main() {
  const args = process.argv.slice(2);
  const artifact = await run({
    fanatics: argValue(args, '--fanatics', DEFAULTS.fanatics),
    betonline: argValue(args, '--betonline', DEFAULTS.betonline),
    betonlineSuperBowl: argValue(args, '--betonline-super-bowl', DEFAULTS.betonlineSuperBowl),
    out: argValue(args, '--out', DEFAULTS.out),
    dryRun: args.includes('--dry-run'),
  });
  console.log(JSON.stringify(artifact.counts));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
