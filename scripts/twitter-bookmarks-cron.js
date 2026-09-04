#!/usr/bin/env node
// scripts/twitter-bookmarks-cron.js
// ═══════════════════════════════════════════════════════════════════════════════
// Automated Regular-Season Twitter Bookmarks Sweeper & Daemon
//
// Periodically harvests bookmarked sharp tweets, runs the relevance gate +
// Gemini Vision OCR for betslips/cheat sheets, and bridges intel into
// Supabase research_intel_notes / research_pick_signals and local markdown.
//
// Usage:
//   node scripts/twitter-bookmarks-cron.js               # Run single sweep
//   node scripts/twitter-bookmarks-cron.js --daemon      # Run as long-running daemon
//   node scripts/twitter-bookmarks-cron.js --daemon --interval-mins 15
//   node scripts/twitter-bookmarks-cron.js --dry-run
// ═══════════════════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const idx = argv.indexOf(flag);
  return idx >= 0 ? argv[idx + 1] : defaultValue;
};

const IS_DAEMON = argv.includes('--daemon');
const DRY_RUN = argv.includes('--dry-run');
const FORCE = argv.includes('--force');
const INTERVAL_MINS = parseInt(getArg('--interval-mins', '30'), 10);

function getSmartIntervalMinutes() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const etHour = (utcHour - 4 + 24) % 24; // EDT offset UTC-4
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, 4=Thu, 6=Sat

  // Sunday Gameday (9 AM - 11:30 PM ET): 10 min check
  if (day === 0 && etHour >= 9 && etHour <= 23) return 10;
  // Thursday Night Football (5 PM - 11 PM ET): 15 min check
  if (day === 4 && etHour >= 17 && etHour <= 23) return 15;
  // Monday Night Football (5 PM - 11 PM ET): 15 min check
  if (day === 1 && etHour >= 17 && etHour <= 23) return 15;
  // Saturday Late-Season (12 PM - 11 PM ET): 20 min check
  if (day === 6 && etHour >= 12 && etHour <= 23) return 20;

  return INTERVAL_MINS;
}

function runSweep() {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🚀 Running Twitter Bookmarks Sweep...`);

    const args = ['agents/twitter-bookmarks-agent.js'];
    if (DRY_RUN) args.push('--dry-run');
    if (FORCE) args.push('--force');

    const proc = spawn('node', args, {
      cwd: ROOT,
      env: { ...process.env },
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      const finishedAt = new Date().toISOString();
      if (code === 0) {
        console.log(`[${finishedAt}] ✅ Twitter Bookmarks Sweep completed successfully.`);
      } else {
        console.error(`[${finishedAt}] ⚠️ Twitter Bookmarks Sweep exited with code ${code}.`);
      }
      resolve(code === 0);
    });

    proc.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] ✖ Failed to launch twitter-bookmarks-agent:`, err.message);
      resolve(false);
    });
  });
}

async function startDaemon() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Platinum Rose Twitter Bookmarks Continuous Harvester Daemon');
  console.log(`  Base Interval: ${INTERVAL_MINS}m | Smart Game-Day Acceleration: Enabled`);
  console.log(`  Dry Run: ${DRY_RUN} | Force Reprocess: ${FORCE}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Initial sweep
  await runSweep();

  // Schedule loop
  const scheduleNext = () => {
    const waitMins = getSmartIntervalMinutes();
    const waitMs = waitMins * 60 * 1000;
    const nextRun = new Date(Date.now() + waitMs).toLocaleTimeString();

    console.log(`⏳ Next sweep scheduled in ${waitMins} minutes (at ${nextRun})...`);

    setTimeout(async () => {
      await runSweep();
      scheduleNext();
    }, waitMs);
  };

  scheduleNext();
}

async function main() {
  if (IS_DAEMON) {
    await startDaemon();
  } else {
    const ok = await runSweep();
    process.exit(ok ? 0 : 1);
  }
}

main().catch((err) => {
  console.error('Fatal error in twitter-bookmarks-cron:', err);
  process.exit(1);
});
