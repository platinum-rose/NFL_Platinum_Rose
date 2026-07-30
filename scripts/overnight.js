#!/usr/bin/env node
/**
 * overnight.js - NFL Dashboard Overnight Pipeline
 *
 * Weekly batch run (typically Sunday night after games).
 * Orchestrates the full data refresh cycle:
 *
 *   1. Monitor health check (MonitorAgent)
 *   2. Odds refresh (odds-ingest.js)
 *   3. Results auto-grade (nfl-auto-grade.js)
 *   4. Props auto-grade (props-auto-grade.js)
 *   5. Bankroll reconciliation (reads user_bankroll_bets)
 *   6. Expert record sync (podcast-ingest.js)
 *   7. Generate briefing report (.nfl/overnight-{date}.md)
 *   8. Update .nfl/memory.json last-run timestamp
 *
 * Usage:
 *   node scripts/overnight.js [--week <1-18>] [--dry-run]
 *     [--live-research-intel] [--live-camp-scout] [--send-daily-brief]
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, ODDS_API_KEY (required)
 *   ANTHROPIC_API_KEY (optional, for AI briefing)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const MEMORY_FILE = join(ROOT, '.nfl', 'memory.json');
const REPORTS_DIR = join(ROOT, '.nfl');

/** Run a node script and return { ok, output } */
async function runAgent(scriptPath, args = []) {
  return new Promise((resolve) => {
    const cmd = spawn('node', [scriptPath, ...args], {
      cwd: ROOT,
      env: { ...process.env },
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    let out = '';
    cmd.stdout.on('data', d => { out += d; process.stdout.write(d); });
    cmd.stderr.on('data', d => { out += d; process.stderr.write(d); });
    cmd.on('close', code => resolve({ ok: code === 0, output: out }));
  });
}

function readMemory() {
  if (!existsSync(MEMORY_FILE)) return {};
  try { return JSON.parse(readFileSync(MEMORY_FILE, 'utf8')); } catch { return {}; }
}

function writeMemory(data) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const existing = readMemory();
  writeFileSync(MEMORY_FILE, JSON.stringify({ ...existing, ...data }, null, 2), 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const liveResearchIntel = args.includes('--live-research-intel');
  const liveCampScout = args.includes('--live-camp-scout');
  const sendDailyBrief = args.includes('--send-daily-brief');
  const weekIdx = args.indexOf('--week');
  const week = weekIdx >= 0 ? args[weekIdx + 1] : null;
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n${ dryRun ? '[DRY RUN] ' : ''}NFL Dashboard Overnight Pipeline - ${today}`);
  if (week) console.log(`Week: ${week}`);
  if (!liveResearchIntel) console.log('Research intel step will run in dry-run mode unless --live-research-intel is passed.');
  if (!liveCampScout) console.log('Training camp scout will run without live RSS unless --live-camp-scout is passed.');
  if (!sendDailyBrief) console.log('Daily brief email is skipped unless --send-daily-brief is passed.');
  console.log('='.repeat(60));

  const steps = [
    { name: 'monitor', script: 'agents/monitor.js', args: [] },
    { name: 'odds-ingest', script: 'agents/odds-ingest.js', args: week ? ['--week', week] : [] },
    { name: 'research-intel', script: 'agents/research-intel-ingest.js', args: liveResearchIntel ? [] : ['--dry-run'] },
    { name: 'training-camp-scout', script: 'scripts/training-camp-rss-scout.js', args: liveCampScout ? ['--live'] : [] },
    { name: 'auto-grade', script: 'agents/nfl-auto-grade.js', args: [] },
    { name: 'props-auto-grade', script: 'agents/props-auto-grade.js', args: [] },
    { name: 'futures-ingest', script: 'agents/futures-odds-ingest.js', args: [] },
    { name: 'podcast-ingest', script: 'agents/podcast-ingest.js', args: [] },
    { name: 'daily-brief', script: 'agents/nfl-daily-brief.js', args: [], skip: !sendDailyBrief },
  ];

  const results = [];
  for (const step of steps) {
    const scriptPath = join(ROOT, step.script);
    if (step.skip) {
      console.log(`\nStep: ${step.name} - SKIP (explicit opt-in not passed)`);
      results.push({ step: step.name, status: 'skipped' });
      continue;
    }
    if (!existsSync(scriptPath)) {
      console.log(`\nStep: ${step.name} - SKIP (script not found: ${step.script})`);
      results.push({ step: step.name, status: 'skipped' });
      continue;
    }
    console.log(`\nStep: ${step.name}`);
    if (dryRun) {
      console.log(`  DRY RUN - would run: node ${[step.script, ...step.args].join(' ')}`);
      results.push({ step: step.name, status: 'dry-run' });
    } else {
      const { ok } = await runAgent(scriptPath, step.args);
      results.push({ step: step.name, status: ok ? 'ok' : 'error' });
    }
  }

  // Write overnight report
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportLines = [
    `# NFL Dashboard Overnight Report - ${today}`,
    `\n> Generated: ${new Date().toISOString()}`,
    `\n## Step Results`,
    '| Step | Status |',
    '| ---- | ------ |',
    ...results.map(r => `| ${r.step} | ${r.status} |`),
  ];
  const reportPath = join(REPORTS_DIR, `overnight-${today}.md`);
  if (!dryRun) {
    writeFileSync(reportPath, reportLines.join('\n') + '\n', 'utf8');
    writeMemory({ last_overnight_run: today, last_ingest_run: new Date().toISOString() });
  }

  const errors = results.filter(r => r.status === 'error');
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Done. ${errors.length} errors.`);
  if (errors.length > 0) {
    console.error('Failed steps:', errors.map(r => r.step).join(', '));
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
