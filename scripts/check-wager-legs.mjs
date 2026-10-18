#!/usr/bin/env node
/**
 * check-wager-legs.mjs - audit user-placed-wagers-2026.json for prop legs the Live Tracker
 * cannot grade (missing player / generic market / missing team).
 *
 *   node scripts/check-wager-legs.mjs [--week 6] [--fix]
 *
 * --fix fills player/market from the selection text where it can, then rewrites the file
 * (same 2-space JSON format, no reformatting of unrelated data). Exit code 1 if problems remain.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferLegFields, validateWagers } from './lib/validate-wager-legs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WAGERS_PATH = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');

const args = process.argv.slice(2);
const weekIdx = args.indexOf('--week');
const week = weekIdx >= 0 ? Number(args[weekIdx + 1]) : null;
const fix = args.includes('--fix');

const raw = await readFile(WAGERS_PATH, 'utf8');
const wagers = JSON.parse(raw);
const scope = wagers.filter(w => (week == null || w.week === week) && w.game !== 'NFL Futures');

if (fix) {
  for (const w of scope) for (const l of w.legs || []) inferLegFields(l);
  const trailingNewline = raw.endsWith('\n');
  await writeFile(WAGERS_PATH, JSON.stringify(wagers, null, 2) + (trailingNewline ? '\n' : ''), 'utf8');
  console.log('Applied inferred player/market fixes.');
}

const bad = validateWagers(scope);
if (!bad.length) { console.log(`OK: all prop legs are trackable (${scope.length} tickets checked).`); process.exit(0); }
for (const b of bad) {
  console.log(`\n${b.id}${b.ticket ? ` (#${b.ticket})` : ''}`);
  b.problems.forEach(p => console.log(`  - ${p}`));
}
console.log(`\n${bad.length} ticket(s) have legs the Live Tracker cannot grade. Run with --fix to auto-fill from selection text.`);
process.exit(1);
