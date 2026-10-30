#!/usr/bin/env node
// scripts/props/defense-boards-run.mjs
// One pass of the weekly defensive-board capture. Each step is independent; a failure is logged
// and the next step still runs.
//   1. DK Predictions DEFENSIVE tab for every current-week game (needs the DKP Chrome on CDP 9224:
//      npm run props:dkp:launch). Writes draftkings-predictions-defense-<date>-<a>-at-<h>.json.
//   2. BetOnline parlay-builder text dropped in data/intake-drop/beo-sgp/ (copy the game page, save .txt).
//   3. Merge into data/defensive-props/boards/defensive-boards-week-NN.json + season history.
//   4. Rebuild the defensive sheet so priced offers show in docs/defensive-props/defensive-props-latest.md.
// Read-only toward every book: never clicks a price or opens a bet slip. No Supabase, no paid calls.
// Usage: node scripts/props/defense-boards-run.mjs [--week N] [--skip-dkp]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateNflWeek } from './draftkings-prediction-dump-parse.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const week = Number(arg('--week') || calculateNflWeek());
const steps = [
  ...(process.argv.includes('--skip-dkp') ? [] : [['DK defensive capture', ['scripts/props/dkp-event-feed-capture.mjs', '--defense-only', '--week', String(week)]]]),
  ['BetOnline parlay-builder drop folder', ['scripts/props/betonline-sgp-ladder-parse.mjs', '--drop']],
  ['Merge defensive boards', ['scripts/props/build-defensive-boards.mjs', '--week', String(week)]],
  ['Rebuild defensive sheet', ['scripts/build-defensive-props.mjs', '--through-week', String(week - 1), '--target-week', String(week)]],
];
let failed = 0;
for (const [label, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', timeout: 15 * 60 * 1000 });
  if (r.status !== 0) { failed++; console.warn(`[WARN] ${label} exited ${r.status ?? r.signal}; continuing.`); }
}
console.log(`\nDefensive boards run for Week ${week} finished with ${failed} failed step(s).`);
process.exit(failed === steps.length ? 1 : 0);
