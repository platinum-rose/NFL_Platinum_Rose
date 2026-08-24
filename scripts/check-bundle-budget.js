#!/usr/bin/env node
// scripts/check-bundle-budget.js
//
// Checkpoint 3 (item 11, UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md): lightweight,
// non-blocking visibility into production JS chunk sizes after a `vite build`.
// Deliberately dumb by design -- no baseline file, no CI gate, nothing that
// can silently drift out of date or fail a build for an unrelated reason.
// Point it at any build output directory and it prints every JS chunk sorted
// by size, largest first, with the initial dashboard entry chunk called out
// separately so it's easy to eyeball whether Checkpoint 3's lazy-loading
// changes (or anything else) grew/shrank it. Compare two runs by eye, or by
// diffing this script's output for two outDirs (e.g. a `dist-verify-*-before`
// and `dist-verify-*-after` build).
//
// Usage:
//   node scripts/check-bundle-budget.js [outDir]     # default outDir: dist
//   npm run build:budget                              # same, via package.json
//   npm run build:budget -- dist-verify-checkpoint3-after
//
// Exit code is always 0 -- this never fails a build. It only reads files
// vite already wrote; it never runs a build itself.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] || 'dist';
const assetsDir = join(outDir, 'assets');

// Matches vite.config.js's build.chunkSizeWarningLimit (kB) so this script's
// "over budget" flag lines up with vite's own build-time warning.
const WARN_KB = 600;

// Decimal kB (1 kB = 1000 bytes) -- matches Vite/Rollup's own build-summary
// output exactly (their `kB` column is base-1000, not base-1024/KiB). This
// script exists so its numbers can be eyeballed straight against Vite's own
// printed build output; a base-1024 divisor here would silently disagree
// with Vite's own numbers for the same file (e.g. it previously reported
// 1,262.5 kB for a file Vite itself printed as 1,292.84 kB -- same 1,292,840
// bytes, just two different conventions). Do not "fix" this back to /1024.
function fmtKb(bytes) {
  return (bytes / 1000).toFixed(1) + ' kB';
}

let files;
try {
  files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
} catch (err) {
  console.error(`[bundle-budget] Could not read ${assetsDir}/*.js`);
  console.error(`[bundle-budget] Run a production build first, e.g.: npx vite build --outDir ${outDir}`);
  console.error(`[bundle-budget] (${err.code || err.message})`);
  process.exit(0); // informational tool -- never fails a build
}

if (files.length === 0) {
  console.log(`[bundle-budget] No .js chunks found in ${assetsDir} -- nothing to report.`);
  process.exit(0);
}

const rows = files
  .map((file) => ({ file, size: statSync(join(assetsDir, file)).size }))
  .sort((a, b) => b.size - a.size);

const totalBytes = rows.reduce((sum, r) => sum + r.size, 0);

// Vite's own entry chunk for a standard Vite React SPA is named `index-<hash>.js`
// by default -- this is the code that loads unconditionally on first paint.
// Everything else here is either a manualChunks vendor bundle (vite.config.js)
// or an async chunk split out via React.lazy() (routes, modals, agent modes).
const entry = rows.find((r) => /^index-.*\.js$/.test(r.file));

console.log(`\nBundle budget report -- ${assetsDir} (${rows.length} JS chunk${rows.length === 1 ? '' : 's'}, ${fmtKb(totalBytes)} total)\n`);
console.log('  Size        Chunk');
for (const r of rows) {
  const overBudget = r.size / 1000 > WARN_KB;
  const flag = overBudget ? `  ⚠ over ${WARN_KB}kB warn limit` : '';
  console.log(`  ${fmtKb(r.size).padStart(10)}  ${r.file}${flag}`);
}

if (entry) {
  console.log(`\nInitial dashboard entry chunk: ${entry.file} -- ${fmtKb(entry.size)}`);
} else {
  console.log('\n(No file matched the default index-*.js entry-chunk naming convention -- check manually.)');
}

console.log(
  '\nInformational only -- does not fail the build. For a real before/after comparison,\n' +
  'run this against two build outDirs (see docs/audits/2026-08-21-codex-independent/\n' +
  'CHECKPOINT_3_SUMMARY.md for the Checkpoint 3 numbers) and compare the entry-chunk line.\n'
);
