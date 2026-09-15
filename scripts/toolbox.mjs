#!/usr/bin/env node

/**
 * toolbox.mjs - Unified NFL Dashboard Command Center & Cadence Runner
 *
 * Interactive terminal menu and headless CLI runner for managing the entire
 * NFL weekly operating rhythm, live tracker generation, and portfolio reconciliation.
 *
 * Usage:
 *   node scripts/toolbox.mjs                   # Launches interactive menu
 *   node scripts/toolbox.mjs --cadence <day>   # Runs automated pipeline for a specific day
 *   node scripts/toolbox.mjs --generate-tracker [--week <num>]
 *   node scripts/toolbox.mjs --launch-tracker [melbourne|sunday]
 *   node scripts/toolbox.mjs --reconcile [--dry-run] [--force]
 *   node scripts/toolbox.mjs --status
 *   node scripts/toolbox.mjs --help
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const WAGERS_PATH = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
const ALEJANDRO_HISTORY_PATH = path.join(ROOT, 'data', 'official-picks', 'alejandro-ledger-history.json');

// Color helpers for terminal output
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function printBanner() {
  console.clear();
  console.log(`${c.cyan}${c.bright}
  ===================================================================
    🏈  NFL PLATINUM ROSE DASHBOARD — UNIFIED TOOLBOX & PIPELINE  🏈
  ===================================================================
  ${c.reset}${c.dim}Operating Cadence: Tuesday - Monday | Week 1 Active Slate${c.reset}\n`);
}

/** Execute a command asynchronously with stdio inherit */
async function runCmd(command, args = [], cwd = ROOT) {
  console.log(`\n${c.yellow}▶ Running:${c.reset} ${command} ${args.join(' ')}\n`);
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env }
    });
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${c.green}✔ Process completed successfully.${c.reset}\n`);
      } else {
        console.log(`\n${c.red}✖ Process exited with code ${code}.${c.reset}\n`);
      }
      resolve(code === 0);
    });
  });
}

/** Launch a file or URL in the default browser (prioritizes Brave) */
async function launchInBrowser(targetPath) {
  const fullPath = targetPath.startsWith('http://') || targetPath.startsWith('https://') 
    ? targetPath 
    : path.resolve(ROOT, targetPath);
  console.log(`${c.cyan}🌐 Launching in browser:${c.reset} ${fullPath}`);
  if (process.platform === 'win32') {
    const braveCandidates = [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    ];
    const brave = braveCandidates.find(p => existsSync(p));
    if (brave) {
      const child = spawn(brave, [fullPath], { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${fullPath}'`], { detached: true, stdio: 'ignore' });
    }
  } else if (process.platform === 'darwin') {
    spawn('open', [fullPath], { detached: true, stdio: 'ignore' });
  } else {
    spawn('xdg-open', [fullPath], { detached: true, stdio: 'ignore' });
  }
}

/** Display current placed portfolio and Alejandro ledger status */
async function showStatus() {
  console.log(`\n${c.bright}${c.blue}📊 CURRENT PORTFOLIO & LEDGER STATUS:${c.reset}`);
  try {
    const rawWagers = await readFile(WAGERS_PATH, 'utf8');
    const wagers = JSON.parse(rawWagers);

    let cashTotal = 0;
    let promoTotal = 0;
    let payoutTotal = 0;

    for (const b of wagers) {
      const isPromo = b.is_promo_credit || b.funding_type === 'promo_credit';
      if (isPromo) promoTotal += (b.promo_credit_stake_usd ?? b.stake_usd ?? 0);
      else cashTotal += (b.cash_risk_usd ?? b.stake_usd ?? 0);
      payoutTotal += (b.potential_payout_usd ?? 0);
    }

    console.log(`  • Placed Wagers Count: ${c.white}${wagers.length} tickets${c.reset}`);
    console.log(`  • Cash Staked:         ${c.yellow}$${cashTotal.toFixed(2)}${c.reset}`);
    console.log(`  • Promo Credits:       ${c.magenta}$${promoTotal.toFixed(2)}${c.reset}`);
    console.log(`  • Max Portfolio Win:   ${c.green}$${payoutTotal.toFixed(2)}${c.reset}`);

    // Alejandro ledger
    try {
      const rawHist = await readFile(ALEJANDRO_HISTORY_PATH, 'utf8');
      const hist = JSON.parse(rawHist);
      console.log(`\n${c.cyan}🤝 Alejandro Split Ledger:${c.reset}`);
      console.log(`  • Active Split Wagers: ${hist.records?.length || 0}`);
      console.log(`  • Split Stakes (50%):  $${(hist.alejandro_cost_share || 0).toFixed(2)}`);
      console.log(`  • Cashed Share (50%):  $${(hist.alejandro_cashed_share || 0).toFixed(2)}`);
      console.log(`  • Current Balance:     ${c.bright}${hist.summary || '$0.00'}${c.reset}`);
    } catch {
      console.log(`\n${c.dim}🤝 Alejandro Ledger: No active settlement history yet.${c.reset}`);
    }
  } catch (err) {
    console.error(`❌ Could not load wagers:`, err.message);
  }
}

/** Automated Cadence Runner */
async function runCadence(day) {
  const d = (day || '').toLowerCase();
  console.log(`\n${c.bright}${c.magenta}=== RUNNING CADENCE: ${d.toUpperCase()} ===${c.reset}\n`);

  switch (d) {
    case 'tuesday':
      console.log(`${c.cyan}1. Ingesting Weekly Schedule (ESPN)...${c.reset}`);
      await runCmd('node', ['agents/schedule-ingest.js', '--year', '2026', '--season-type', '2', '--start-week', '1', '--end-week', '18']);
      console.log(`${c.cyan}2. Refreshing Player Stats (nflverse weekly + seasonal)...${c.reset}`);
      await runCmd('python3', ['scripts/fetch_nflverse_data.py', '--datasets', 'player_stats_weekly', 'player_stats_seasonal', '--force']);
      console.log(`${c.cyan}3. Ingesting Player Stats into Supabase...${c.reset}`);
      await runCmd('node', ['agents/player-stats-ingest.js', '--season', '2026']);
      console.log(`${c.cyan}4. Seeding Weekly Usage-Based Starter Locks...${c.reset}`);
      await runCmd('node', ['scripts/build-week-usage-locks.js', '--season', '2026']);
      console.log(`${c.cyan}5. Rebuilding Projected Starters Snapshot...${c.reset}`);
      await runCmd('node', ['scripts/build-projected-starters.js']);
      console.log(`${c.cyan}6. Ingesting Initial Game Odds (TheOddsAPI)...${c.reset}`);
      await runCmd('node', ['agents/game-odds-ingest.js', '--season', '2026', '--dry-run']);
      console.log(`${c.cyan}7. Running Roster Audit Baseline...${c.reset}`);
      await runCmd('node', ['scripts/audit-all32-rosters.js']);
      break;

    case 'wednesday':
      console.log(`${c.cyan}1. Running Podcast & YouTube Sweep...${c.reset}`);
      await runCmd('node', ['scripts/youtube-podcast-sweep.js', '--lookback-days', '3', '--max-per-run', '5']);
      console.log(`${c.cyan}2. Ingesting Research Intel Articles...${c.reset}`);
      await runCmd('node', ['agents/research-intel-ingest.js', '--dry-run']);
      console.log(`${c.cyan}3. Processing Twitter/X Bookmarks...${c.reset}`);
      await runCmd('node', ['agents/twitter-bookmarks-agent.js', '--dry-run']);
      break;

    case 'thursday':
      console.log(`${c.cyan}1. Building Live Player Availability & Practice Injuries...${c.reset}`);
      await runCmd('node', ['scripts/build-player-availability.js', '--live-injuries']);
      console.log(`${c.cyan}2. Syncing Live Market Lines vs SuperContest...${c.reset}`);
      await runCmd('node', ['scripts/sync-live-market-lines.mjs']);
      console.log(`${c.cyan}3. Building TNF Player Props Intel & SGP Cards...${c.reset}`);
      await runCmd('node', ['scripts/build-player-props-intel.js']);
      break;

    case 'friday':
      console.log(`${c.cyan}1. Final Friday Injury Reports & Practice Status...${c.reset}`);
      await runCmd('node', ['scripts/build-player-availability.js', '--live-injuries']);
      console.log(`${c.cyan}2. Building Projected Starters...${c.reset}`);
      await runCmd('node', ['scripts/build-projected-starters.js']);
      console.log(`${c.cyan}3. Secondary Matchup Vulnerability Matrix...${c.reset}`);
      await runCmd('node', ['scripts/build-secondary-matchup-vulnerability.js']);
      console.log(`${c.cyan}4. Generating Sunday SGP Models & Curated Parlays...${c.reset}`);
      await runCmd('node', ['scripts/build-player-props-intel.js']);
      console.log(`${c.cyan}5. Compiling Alpha Data Packet...${c.reset}`);
      await runCmd('node', ['scripts/build-alpha-data-packet.js']);
      break;

    case 'saturday':
      console.log(`${c.cyan}1. Checking Official Pick Inbox...${c.reset}`);
      await runCmd('node', ['scripts/official-pick-ledger.js', 'inbox']);
      console.log(`${c.cyan}2. Final Pre-Sunday Market Lines CLV Check...${c.reset}`);
      await runCmd('node', ['scripts/sync-live-market-lines.mjs']);
      console.log(`${c.cyan}3. Syncing Placed Wagers & Cloud Bankroll...${c.reset}`);
      await runCmd('node', ['scripts/sync-placed-wagers-to-bankroll.mjs']);
      break;

    case 'sunday':
      console.log(`${c.cyan}1. Pre-Game Inactives Check...${c.reset}`);
      await runCmd('node', ['scripts/build-player-availability.js', '--live-injuries']);
      console.log(`${c.cyan}2. Compiling Sunday Multi-Game Live Tracker...${c.reset}`);
      await runCmd('node', ['scripts/generate-live-tracker.mjs', '--week', '1']);
      console.log(`${c.cyan}3. Launching Live Tracker in Browser...${c.reset}`);
      await launchInBrowser('public/live-tracker-sunday.html');
      break;

    case 'monday':
      console.log(`${c.cyan}1. Running Placed Wager Boxscore Reconciliation...${c.reset}`);
      await runCmd('node', ['scripts/reconcile-settlement.mjs', '--dry-run']);
      break;

    default:
      console.log(`${c.red}Unknown cadence day: ${day}. Use: tuesday, wednesday, thursday, friday, saturday, sunday, monday.${c.reset}`);
  }
}

/** Interactive Menu Loop */
async function interactiveMenu() {
  const rl = createInterface({ input, output });

  while (true) {
    printBanner();
    console.log(`${c.white}${c.bright}MAIN MENU:${c.reset}`);
    console.log(`  [1] 📅  Weekly Cadence Pipeline (Tuesday – Monday automated jobs)`);
    console.log(`  [2] 🏈  Sunday Multi-Game Live Tracker (Compile, preview, launch)`);
    console.log(`  [3] 💰  Bankroll & Alejandro Split Reconciliation (Grade wagers & settle ledger)`);
    console.log(`  [4] 🔍  Diagnostics & System Health (API quotas, smoke tests, portfolio)`);
    console.log(`  [0] 🚪  Exit\n`);

    const choice = await rl.question(`${c.yellow}Select an option [0-4]: ${c.reset}`);

    if (choice === '1') {
      console.log(`\n${c.cyan}${c.bright}--- WEEKLY CADENCE PIPELINE ---${c.reset}`);
      console.log(`  [1] Tuesday: Reset, Schedule & Early Odds Ingestion`);
      console.log(`  [2] Wednesday: Podcasts, Research Intel & Bookmarks`);
      console.log(`  [3] Thursday: TNF Prep, Live Lines Sync & SGP Props`);
      console.log(`  [4] Friday: Final Injuries, Secondary Matrix & Alpha Packet`);
      console.log(`  [5] Saturday: Card Lock, Pick Inbox & Pre-Game CLV`);
      console.log(`  [6] Sunday: Inactives & Multi-Game Live Tracker Launch`);
      console.log(`  [7] Monday: Boxscore Auto-Grading & Settlement`);
      console.log(`  [0] Back to Main Menu\n`);

      const cChoice = await rl.question(`${c.yellow}Select Cadence Day [0-7]: ${c.reset}`);
      const days = ['cancel', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'monday'];
      const day = days[parseInt(cChoice, 10)];
      if (day && day !== 'cancel') {
        await runCadence(day);
        await rl.question(`\nPress ENTER to continue...`);
      }
    } else if (choice === '2') {
      console.log(`\n${c.cyan}${c.bright}--- LIVE MULTI-GAME TRACKER ---${c.reset}`);
      console.log(`  [1] Compile Sunday Multi-Game Tracker HTML`);
      console.log(`  [2] Launch Sunday Tracker in Browser (public/live-tracker-sunday.html)`);
      console.log(`  [3] Launch Melbourne Tracker in Browser (public/live-tracker-melbourne.html)`);
      console.log(`  [4] Test Live ESPN Scoreboard & Boxscore API`);
      console.log(`  [0] Back to Main Menu\n`);

      const tChoice = await rl.question(`${c.yellow}Select Option [0-4]: ${c.reset}`);
      if (tChoice === '1') {
        await runCmd('node', ['scripts/generate-live-tracker.mjs', '--week', '1']);
        await rl.question(`\nPress ENTER to continue...`);
      } else if (tChoice === '2') {
        await launchInBrowser('public/live-tracker-sunday.html');
      } else if (tChoice === '3') {
        await launchInBrowser('public/live-tracker-melbourne.html');
      } else if (tChoice === '4') {
        await runCmd('node', ['-e', "fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard').then(r=>r.json()).then(d=>console.log('✅ ESPN Connected: ' + (d.events||[]).length + ' games in feed.'))"]);
        await rl.question(`\nPress ENTER to continue...`);
      }
    } else if (choice === '3') {
      console.log(`\n${c.cyan}${c.bright}--- BANKROLL & SETTLEMENT RECONCILIATION ---${c.reset}`);
      console.log(`  [1] Preview Boxscore Reconciliation (Dry Run)`);
      console.log(`  [2] Force Grade Live In-Progress Stats (Melbourne Preview)`);
      console.log(`  [3] Commit Final Reconciliation & Update Ledger`);
      console.log(`  [4] Mark Alejandro Ledger as Settled ($0 balance)`);
      console.log(`  [0] Back to Main Menu\n`);

      const rChoice = await rl.question(`${c.yellow}Select Option [0-4]: ${c.reset}`);
      if (rChoice === '1') {
        await runCmd('node', ['scripts/reconcile-settlement.mjs', '--dry-run']);
        await rl.question(`\nPress ENTER to continue...`);
      } else if (rChoice === '2') {
        await runCmd('node', ['scripts/reconcile-settlement.mjs', '--dry-run', '--force']);
        await rl.question(`\nPress ENTER to continue...`);
      } else if (rChoice === '3') {
        const confirm = await rl.question(`${c.red}Are you sure you want to commit boxscore grades to user-placed-wagers-2026.json? [y/N]: ${c.reset}`);
        if (confirm.toLowerCase() === 'y') {
          await runCmd('node', ['scripts/reconcile-settlement.mjs']);
        }
        await rl.question(`\nPress ENTER to continue...`);
      } else if (rChoice === '4') {
        const emptyLedger = {
          updated_at: new Date().toISOString(),
          total_cash_staked: 0,
          alejandro_cost_share: 0,
          alejandro_cashed_share: 0,
          alejandro_net_balance: 0,
          summary: 'All split accounts are settled ($0.00)',
          records: []
        };
        await writeFile(ALEJANDRO_HISTORY_PATH, JSON.stringify(emptyLedger, null, 2), 'utf8');
        console.log(`${c.green}✔ Alejandro ledger marked as settled!${c.reset}`);
        await rl.question(`\nPress ENTER to continue...`);
      }
    } else if (choice === '4') {
      console.log(`\n${c.cyan}${c.bright}--- DIAGNOSTICS & SYSTEM HEALTH ---${c.reset}`);
      await showStatus();
      console.log(`\n  [1] Run Season Readiness Smoke Test (npm run smoke:season)`);
      console.log(`  [2] Check TheOddsAPI Quota & Keys`);
      console.log(`  [0] Back to Main Menu\n`);

      const dChoice = await rl.question(`${c.yellow}Select Option [0-2]: ${c.reset}`);
      if (dChoice === '1') {
        await runCmd('node', ['scripts/season-readiness-smoke.js', '--no-write']);
        await rl.question(`\nPress ENTER to continue...`);
      } else if (dChoice === '2') {
        await runCmd('node', ['scripts/sync-live-market-lines.mjs']);
        await rl.question(`\nPress ENTER to continue...`);
      }
    } else if (choice === '0') {
      console.log(`\n${c.cyan}👋 Exiting NFL Toolbox. Good luck this week!${c.reset}\n`);
      rl.close();
      process.exit(0);
    }
  }
}

// ── CLI Direct Flags ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length > 0) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
NFL Toolbox CLI Runner

Usage:
  node scripts/toolbox.mjs                          # Interactive menu
  node scripts/toolbox.mjs --cadence <day>          # tuesday, wednesday, thursday, friday, saturday, sunday, monday
  node scripts/toolbox.mjs --generate-tracker       # Generates public/live-tracker-sunday.html
  node scripts/toolbox.mjs --launch-tracker [name]  # Launches sunday or melbourne tracker in browser
  node scripts/toolbox.mjs --reconcile [--dry-run]  # Grades wagers and reconciles split ledger
  node scripts/toolbox.mjs --status                 # Shows portfolio and ledger totals
`);
    process.exit(0);
  }

  const cadIdx = args.indexOf('--cadence');
  if (cadIdx >= 0 && args[cadIdx + 1]) {
    await runCadence(args[cadIdx + 1]);
    process.exit(0);
  }

  if (args.includes('--generate-tracker')) {
    const weekIdx = args.indexOf('--week');
    const week = weekIdx >= 0 ? parseInt(args[weekIdx + 1], 10) : 1;
    await runCmd('node', ['scripts/generate-live-tracker.mjs', '--week', String(week)]);
    process.exit(0);
  }

  const launchIdx = args.indexOf('--launch-tracker');
  if (launchIdx >= 0) {
    const target = args[launchIdx + 1] === 'melbourne' ? 'public/live-tracker-melbourne.html' : 'public/live-tracker-sunday.html';
    await launchInBrowser(target);
    process.exit(0);
  }

  if (args.includes('--reconcile')) {
    const dryRun = args.includes('--dry-run');
    const force = args.includes('--force');
    const reconcileArgs = ['scripts/reconcile-settlement.mjs'];
    if (dryRun) reconcileArgs.push('--dry-run');
    if (force) reconcileArgs.push('--force');
    await runCmd('node', reconcileArgs);
    process.exit(0);
  }

  if (args.includes('--status')) {
    await showStatus();
    process.exit(0);
  }
} else {
  // Launch interactive menu
  interactiveMenu();
}
