#!/usr/bin/env node
// scripts/check-dossier-freshness.js
//
// Standalone, local-only freshness check for a portfolio dossier — no
// network, no Supabase, safe to run in any sandbox. See
// scripts/lib/dossier-freshness-gate.js and
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §3.
//
// Usage:
//   node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json
//   node scripts/check-dossier-freshness.js --dossier <path> --json   (machine-readable output)
//
// Exit code 0 = pass, 1 = stale/unknown/error. Intended as a preflight check
// before agents/portfolio-synthesize.js runs against a given dossier — run
// it, and don't proceed to a paid synthesis call if it doesn't exit 0.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDossierFreshness, collectEvidenceLaneStats } from './lib/dossier-freshness-gate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
};
const asJson = argv.includes('--json');

async function main() {
  const dossierPath = getArg('--dossier');
  if (!dossierPath) {
    console.error('Usage: node scripts/check-dossier-freshness.js --dossier <path-to-dossier.json> [--json]');
    process.exitCode = 1;
    return;
  }
  const absDossierPath = path.isAbsolute(dossierPath) ? dossierPath : path.join(ROOT, dossierPath);
  let dossier;
  try {
    dossier = JSON.parse(await readFile(absDossierPath, 'utf8'));
  } catch (err) {
    console.error(`✖ could not read/parse dossier at ${absDossierPath}: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const currentStats = await collectEvidenceLaneStats(ROOT);
  const result = checkDossierFreshness(dossier.meta, currentStats);

  if (asJson) {
    console.log(JSON.stringify({ dossier_path: dossierPath, dossier_generated_at: dossier.meta?.generated_at || null, ...result }, null, 2));
  } else {
    console.log(`Dossier: ${dossierPath}`);
    console.log(`Dossier generated_at: ${dossier.meta?.generated_at || '(missing)'}`);
    console.log(`Check mode: ${result.mode}`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    if (result.missing_lane_count) {
      console.log(`\n${result.missing_lane_count} evidence lane(s) missing on disk: ${result.missing_lanes.join(', ')}`);
    }
    if (result.stale_lane_count) {
      console.log(`\n${result.stale_lane_count} STALE evidence lane(s) — this dossier does not reflect current evidence:`);
      for (const lane of result.stale_lanes) {
        console.log(`  - ${lane.key}: ${lane.reason}`);
        if (lane.dossier_generated_at) console.log(`      dossier generated_at: ${lane.dossier_generated_at}, evidence mtime: ${lane.current_mtime}`);
        if (lane.dossier_sha256) console.log(`      dossier sha256: ${lane.dossier_sha256.slice(0, 12)}…, current sha256: ${lane.current_sha256.slice(0, 12)}…`);
      }
      console.log('\nDo NOT run a fresh synthesis against this dossier. Rebuild it first (agents/portfolio-dossier.js).');
    } else if (result.status === 'missing') {
      console.log('\nNo stale lanes, but evidence lane(s) are missing from disk — this dossier cannot be confirmed comparable to the current evidence contract.');
    } else if (result.status === 'pass') {
      console.log('\nAll evidence lanes match what this dossier was built from. Safe to proceed on freshness grounds (this checks freshness only, not factual completeness).');
    } else if (result.status === 'unknown') {
      console.log('\nCould not determine freshness — dossier has neither an evidence_lane_versions stamp nor a generated_at timestamp.');
    }
  }

  process.exitCode = result.status === 'pass' ? 0 : 1;
}

main().catch((err) => {
  console.error('✖', err.message);
  process.exitCode = 1;
});
