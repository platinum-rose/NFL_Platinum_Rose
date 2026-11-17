#!/usr/bin/env node

/**
 * Settle placed wagers for one NFL week with the ONE grader: the mobile live tracker's gradeLeg.
 *
 * Andy 2026-11-17 (midseason audit decision 6): this script used to carry its own grader, which
 * graded prop Unders as Overs and left first TD, 2+ TD, carries and kicker legs PENDING. It now
 *   1. runs scripts/generate-live-tracker-mobile.mjs --week N (grades every pending leg off ESPN
 *      and writes public/live-tracker-mobile-state.json), then
 *   2. runs scripts/settle_from_mobile_state.py, which settles only decided tickets and skips
 *      anything that needs a human (CHECK legs, cashed parlays with a push/void leg, open RRs).
 * Checked 2026-11-17 against the cleaned ledger: W5, W9 and W10, 573 legs, all agree (one W9 open
 * spot comes back CHECK, as it should).
 *
 * The command is local-only: it never synchronizes the bankroll or Supabase.
 *
 * Usage:
 *   node scripts/reconcile-settlement.mjs --week <n> [--dry-run] [--season <yyyy>]
 * Without --dry-run it writes the ledger (the toolbox's confirmed "Commit Final Reconciliation").
 * The nightly scheduled task always passes --dry-run: settling needs Andy's OK.
 * --force is accepted for old callers and ignored (the tracker grades live legs anyway).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getNFLWeekInfo } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REPORT_MD_FILE = path.join(ROOT, 'docs', 'tracked-wagers', 'reconciliation-latest.md');

// Same interpreter choice as toolbox.mjs: the repo venv when present, else python3.
export function pickPython(root = ROOT) {
  const win = path.join(root, '.venv', 'Scripts', 'python.exe');
  const nix = path.join(root, '.venv', 'bin', 'python');
  if (process.platform === 'win32' && existsSync(win)) return win;
  if (existsSync(nix)) return nix;
  return process.platform === 'win32' ? 'python' : 'python3';
}

export function settlementCommands({ week, season, dryRun, root = ROOT }) {
  const tracker = [process.execPath, [path.join(root, 'scripts', 'generate-live-tracker-mobile.mjs'), '--week', String(week),
    ...(season ? ['--season', String(season)] : [])]];
  const settle = [pickPython(root), [path.join(root, 'scripts', 'settle_from_mobile_state.py'), ...(dryRun ? [] : ['--apply'])]];
  return { tracker, settle };
}

function step([cmd, args]) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  process.stdout.write(out);
  if (r.error || r.status !== 0) throw new Error(`${path.basename(args[0])} failed (${r.error?.message || `exit ${r.status}`})`);
  return out;
}

export async function reconcilePortfolio({ dryRun = true, week, season } = {}) {
  if (!Number.isInteger(week) || week < 1) throw new Error('A valid regular-season --week is required.');
  const { tracker, settle } = settlementCommands({ week, season, dryRun });
  console.log(`Week ${week}: grading with the mobile tracker (one grader), then ${dryRun ? 'a dry-run settlement' : 'settling decided tickets'}.`);
  step(tracker);
  const settleOut = step(settle);
  if (!dryRun) {
    await mkdir(path.dirname(REPORT_MD_FILE), { recursive: true });
    await writeFile(REPORT_MD_FILE, `# Settlement reconciliation, Week ${week}\n\nGenerated ${new Date().toISOString()} by the mobile-tracker grader.\n\n\`\`\`\n${settleOut.trim()}\n\`\`\`\n`, 'utf8');
  }
  return { report: settleOut };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  const info = getNFLWeekInfo();
  const weekIndex = args.indexOf('--week');
  const seasonIndex = args.indexOf('--season');
  const week = weekIndex >= 0 ? Number(args[weekIndex + 1]) : info.week;
  const season = seasonIndex >= 0 ? Number(args[seasonIndex + 1]) : undefined;
  reconcilePortfolio({ dryRun: args.includes('--dry-run'), week, season })
    .catch((error) => { console.error(`Reconciliation failed: ${error.message}`); process.exitCode = 1; });
}
