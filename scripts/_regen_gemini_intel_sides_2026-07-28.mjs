#!/usr/bin/env node
// scripts/_regen_gemini_intel_sides_2026-07-28.mjs
// ═══════════════════════════════════════════════════════════════════════════════
// One-off maintenance script (2026-07-28). NOT part of the shipped pipeline --
// same pattern as scripts/_phase2_extract.py.
//
// Re-derives run.extracted_picks / run.analysis_notes for every real
// --live-youtube observation file from its ALREADY-STORED run.raw_model_response,
// using the fixed normalizePick/normalizeNote in scripts/lib/gemini-pick-
// normalize.js. No Gemini API calls -- this is a free, local reprocessing of
// data already paid for, needed because a real bug in the side-normalization
// logic (bare single-letter 'N' fallback token) had corrupted 11/85 picks
// (13%) across these 13 files before the fix landed (same-day commit).
//
// Usage: node scripts/_regen_gemini_intel_sides_2026-07-28.mjs [--dry-run]
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { normalizePick, normalizeNote } from './lib/gemini-pick-normalize.js';

const DRY_RUN = process.argv.includes('--dry-run');
const OBS_DIR = path.join(process.cwd(), 'data', 'shadow-harness', 'observations');

function parseModelJson(text) {
  let t = String(text || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch { /* fall through to repair */ }
  const repaired = t.replace(/(:\s*)\+(\d+(?:\.\d+)?)/g, '$1$2');
  try { return JSON.parse(repaired); } catch { return null; }
}

const files = fs.readdirSync(OBS_DIR)
  .filter(f => f.endsWith('-shadow-youtube.json') && !f.startsWith('test-fake'));

let changedFiles = 0, changedPicks = 0, totalPicks = 0;

for (const file of files) {
  const full = path.join(OBS_DIR, file);
  const doc = JSON.parse(fs.readFileSync(full, 'utf8'));
  const run = doc.run;
  if (!run) { console.log(`  skip ${file}: no run object`); continue; }

  const raw = parseModelJson(run.raw_model_response);
  if (!raw) { console.log(`  ⚠️  skip ${file}: could not parse raw_model_response`); continue; }

  const newPicks = (raw.extracted_picks || []).map(normalizePick);
  const newNotes = (raw.analysis_notes || []).map(normalizeNote);
  const oldPicks = run.extracted_picks || [];

  let fileChanged = false;
  for (let i = 0; i < newPicks.length; i++) {
    totalPicks++;
    const oldSide = oldPicks[i]?.side;
    if (oldSide !== newPicks[i].side) {
      changedPicks++;
      fileChanged = true;
      console.log(`  ${file}: team=${newPicks[i].team} market=${newPicks[i].market} side "${oldSide}" -> "${newPicks[i].side}"`);
    }
  }

  if (fileChanged) {
    changedFiles++;
    if (!DRY_RUN) {
      run.extracted_picks = newPicks;
      run.analysis_notes = newNotes;
      fs.writeFileSync(full, JSON.stringify(doc, null, 2) + '\n');
    }
  }
}

console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}Done. files_changed=${changedFiles}/${files.length} picks_changed=${changedPicks}/${totalPicks}`);
