#!/usr/bin/env node

/**
 * scripts/build-sportsbook-exports-normalizer.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Backlog #4 & #10 (Expansion G): Sportsbook Export & Derivative Market Normalizer
 *
 * Scans raw BetOnline, BetUS, Bookmaker export files from `data/futures-imports/`
 * and normalizes them into structured JSON schemas for awards, exactas, No-sides,
 * and derivative markets.
 *
 * Input:  data/futures-imports/*.json
 * Output: data/generated/sportsbook-normalized-latest.json
 *
 * Zero API calls. Deterministic local text-to-structured normalization.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMPORTS_DIR = path.join(ROOT, 'data', 'futures-imports');
const OUT_DIR = path.join(ROOT, 'data', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'sportsbook-normalized-latest.json');

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function toDecimal(american) {
  if (american >= 100) return (american / 100) + 1;
  if (american <= -100) return (100 / Math.abs(american)) + 1;
  return 2.0;
}

function toImplied(american) {
  if (american >= 100) return 100 / (american + 100);
  if (american <= -100) return Math.abs(american) / (Math.abs(american) + 100);
  return 0.5;
}

function categorizeMarket(marketTypeRaw, selection) {
  const text = `${marketTypeRaw} ${selection}`.toLowerCase();
  if (/mvp|most valuable/i.test(text)) return { category: 'awards', award: 'MVP' };
  if (/opoy|offensive player of the year/i.test(text)) return { category: 'awards', award: 'OPOY' };
  if (/dpoy|defensive player of the year/i.test(text)) return { category: 'awards', award: 'DPOY' };
  if (/oroy|offensive rookie/i.test(text)) return { category: 'awards', award: 'OROY' };
  if (/droy|defensive rookie/i.test(text)) return { category: 'awards', award: 'DROY' };
  if (/cpoy|comeback player/i.test(text)) return { category: 'awards', award: 'CPOY' };
  if (/coy|coach of the year/i.test(text)) return { category: 'awards', award: 'COY' };
  if (/exacta|exact finish|sb matchup/i.test(text)) return { category: 'exactas', award: null };
  if (/stage of elimination|eliminated in/i.test(text)) return { category: 'derivatives', market_subtype: 'stage_of_elimination' };
  if (/exact wins|exact win total/i.test(text)) return { category: 'derivatives', market_subtype: 'exact_wins' };
  if (/no-side|to miss|will not make/i.test(text)) return { category: 'derivatives', market_subtype: 'no_side' };
  if (/superbowl|super_bowl|sb/i.test(text)) return { category: 'core', market_subtype: 'superbowl' };
  if (/conference/i.test(text)) return { category: 'core', market_subtype: 'conference' };
  if (/division/i.test(text)) return { category: 'core', market_subtype: 'division' };
  if (/win_total|wins|over_under/i.test(text)) return { category: 'core', market_subtype: 'wins' };
  if (/playoff|make_playoffs/i.test(text)) return { category: 'core', market_subtype: 'playoffs' };
  return { category: 'other', market_subtype: 'general' };
}

async function main() {
  console.log('📊 Running Sportsbook Exports & Derivative Market Normalizer...');

  await mkdir(OUT_DIR, { recursive: true });

  let files = [];
  try {
    files = await readdir(IMPORTS_DIR);
  } catch {
    files = [];
  }

  const exportFiles = files.filter(f => /^(betonline|betus|bookmaker)-\d{4}-\d{2}-\d{2}\.json$/i.test(f));
  console.log(`   Found ${exportFiles.length} raw sportsbook export files in data/futures-imports/`);

  const records = [];
  const awardsMap = {};
  const exactasMap = {};
  const derivativesMap = {};

  for (const file of exportFiles) {
    try {
      const items = JSON.parse(await readFile(path.join(IMPORTS_DIR, file), 'utf8'));
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const teamAbbr = getTeamAbbreviation(item.team || item.selection);
        const price = item.odds ?? item.price ?? 100;
        const dec = toDecimal(price);
        const prob = toImplied(price);
        const cat = categorizeMarket(item.market_type || '', item.selection || '');

        const normalized = {
          id: `sb_${sha([item.book, item.market_type, item.selection, price].join('|'))}`,
          book: item.book,
          captured_at: item.captured_at || item.snapshot_time || new Date().toISOString(),
          market_type: item.market_type,
          category: cat.category,
          award: cat.award || null,
          market_subtype: cat.market_subtype || null,
          team: teamAbbr,
          team_fullName: normalizeTeam(teamAbbr || '') || item.team || null,
          selection: item.selection,
          american_odds: price,
          decimal_odds: Number(dec.toFixed(2)),
          implied_prob: Number(prob.toFixed(4)),
          line: item.line ?? null,
        };

        records.push(normalized);

        if (cat.category === 'awards') {
          const k = `${cat.award}|${item.selection}`;
          if (!awardsMap[k]) awardsMap[k] = [];
          awardsMap[k].push(normalized);
        } else if (cat.category === 'exactas') {
          const k = item.selection;
          if (!exactasMap[k]) exactasMap[k] = [];
          exactasMap[k].push(normalized);
        } else if (cat.category === 'derivatives') {
          const k = `${cat.market_subtype}|${item.selection}`;
          if (!derivativesMap[k]) derivativesMap[k] = [];
          derivativesMap[k].push(normalized);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Could not parse ${file}:`, err.message);
    }
  }

  const output = {
    meta: {
      schema: 'sportsbook_normalized_v1',
      generated_at: new Date().toISOString(),
      source_files: exportFiles.length,
      total_records: records.length,
      awards_count: Object.keys(awardsMap).length,
      exactas_count: Object.keys(exactasMap).length,
      derivatives_count: Object.keys(derivativesMap).length,
    },
    records: records.slice(0, 1000), // Clean sample output
    awards: awardsMap,
    exactas: exactasMap,
    derivatives: derivativesMap,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Sportsbook Exports Normalizer completed!`);
  console.log(`   Total Records:  ${records.length}`);
  console.log(`   Award Markets:  ${Object.keys(awardsMap).length}`);
  console.log(`   Exactas:        ${Object.keys(exactasMap).length}`);
  console.log(`   Derivatives:    ${Object.keys(derivativesMap).length}`);
  console.log(`   Saved Snapshot: ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
