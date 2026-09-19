#!/usr/bin/env node
// scripts/research-intel-cron.js
// ═══════════════════════════════════════════════════════════════════════════════
// Automated Research Intel Article Sweeper
//
// Periodically polls the RSS feeds in agents/research-intel-ingest.js's FEEDS
// list (Action Network, BettingPros, Walter Football, ESPN NFL, VSiN, Sharp
// Football, Pro Football Talk, PFF, Rotowire NFL) and bridges NFL-relevant
// articles into Supabase research_intel_notes / research_pick_signals.
//
// Why a dedicated poll interval matters: several of these feeds (VSiN in
// particular) publish at high volume and mix in non-NFL content (college
// football, golf, horse racing). A plain RSS feed only exposes a handful of
// the most recent items -- if too much time passes between polls, an NFL
// article can scroll off the feed and get missed even though the ingest
// agent's own INTEL_LOOKBACK_HOURS window (72h by default) would otherwise
// still consider it fresh. Polling frequently is what actually prevents
// misses, not widening the lookback window.
//
// Usage:
//   node scripts/research-intel-cron.js               # Run single sweep
//   node scripts/research-intel-cron.js --dry-run
// ═══════════════════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');

function runSweep() {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🚀 Running Research Intel Article Sweep...`);

    const args = ['agents/research-intel-ingest.js'];
    if (DRY_RUN) args.push('--dry-run');

    const proc = spawn('node', args, {
      cwd: ROOT,
      // Fetch article bodies by default (2026-09-19): without it this 30-min sweep
      // stored title/teaser-only notes and beat the body-fetching GitHub runs to them.
      env: { INTEL_FETCH_BODY: 'true', ...process.env },
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      const finishedAt = new Date().toISOString();
      if (code === 0) {
        console.log(`[${finishedAt}] ✅ Research Intel Article Sweep completed successfully.`);
      } else {
        console.error(`[${finishedAt}] ⚠️ Research Intel Article Sweep exited with code ${code}.`);
      }
      resolve(code === 0);
    });

    proc.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] ✖ Failed to launch research-intel-ingest:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  const ok = await runSweep();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error in research-intel-cron:', err);
  process.exit(1);
});
