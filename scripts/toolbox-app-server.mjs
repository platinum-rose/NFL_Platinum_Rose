/**
 * toolbox-app-server.mjs
 *
 * Standalone Local Operations Mission Control for NFL Platform.
 *
 * Serves a native-looking desktop control center on port 4567 with:
 *  - Instant Weekly Cadence Verification (Tuesday to Monday): What happens today,
 *    live deliverable freshness audits (Current, Stale, Missing), and 1-click execution.
 *  - Top-Level One-Click Launchers: NFL Dashboard (browser), Live Gameday Tracker,
 *    and Cadence Re-verification.
 *  - Granular Sub-Task Runners: Run individual ingest, intel, or modeling scripts.
 *  - Persistent Docked Bottom Console Drawer: Real-time SSE streaming, live ticker,
 *    and process control (Stop / Kill).
 *  - Zero-terminal Windows desktop execution via launch-toolbox.vbs and desktop shortcut.
 *
 * Usage:
 *   node scripts/toolbox-app-server.mjs [--port 4567] [--open]
 */

import 'dotenv/config';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { stat, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLiveTracker } from './generate-live-tracker.mjs';
import {
  buildProjectedStarters,
  recordHumanReviewDecisions,
  loadHumanReviewDecisions,
  restoreRejectedHumanReviewDecisions,
  starterRowKey
} from './build-projected-starters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 4567;
let serverPort = DEFAULT_PORT;
const DASHBOARD_HTML_PATH = path.join(__dirname, 'toolbox-dashboard.html');
const ALEJANDRO_HISTORY_PATH = path.join(ROOT, 'data', 'official-picks', 'alejandro-ledger-history.json');

// Global execution & SSE state
let activeProcess = null;
let currentTaskName = null;
let currentTaskStartTime = null;
const sseClients = new Set();
let logBuffer = [];

// ── DELIVERABLES CONFIGURATION BY CADENCE DAY ──────────────────────────────────
export const DELIVERABLES_CONFIG = {
  tuesday: {
    day: 'tuesday',
    title: 'Tuesday • Schedule Reset & Early Lines',
    objective: 'Ingest ESPN weekly schedule, refresh player stats and usage-based starter locks, lock early game lines from TheOddsAPI, and run 32-team roster audit baseline.',
    pipelineTask: 'tuesday',
    deliverables: [
      { key: 'schedule', name: 'NFL Master Schedule', path: 'public/schedule.json', maxAgeHours: 168 },
      { key: 'odds', name: 'Early Game Lines & Spreads', path: 'data/supercontest/live-market-comparison.json', maxAgeHours: 48 }
    ],
    subtasks: [
      { key: 'tuesday-schedule', name: 'Ingest Schedule (ESPN)', desc: 'Pull 18-week master schedule' },
      { key: 'tuesday-player-stats-refresh', name: 'Refresh Player Stats (nflverse)', desc: 'Pull latest weekly + seasonal player stats' },
      { key: 'tuesday-player-stats-ingest', name: 'Ingest Player Stats (Supabase)', desc: 'Push player stats to player_stats / player_season_stats' },
      { key: 'tuesday-usage-locks', name: 'Seed Weekly Usage Locks', desc: 'Derive obvious-starter locks from usage + archive trend history' },
      { key: 'tuesday-rebuild-starters', name: 'Rebuild Projected Starters', desc: 'Merge manual locks + injury-report signals into the snapshot' },
      { key: 'tuesday-odds', name: 'Ingest Early Odds (TheOddsAPI)', desc: 'Initial market spreads & totals' },
      { key: 'tuesday-roster', name: 'Roster Audit Baseline', desc: 'Audit 32 active rosters' }
    ]
  },
  wednesday: {
    day: 'wednesday',
    title: 'Wednesday • Intel, Podcasts & Bookmarks',
    objective: 'Sweep YouTube & podcast diarization transcripts, ingest research articles, and process Twitter/X bookmarks.',
    pipelineTask: 'wednesday',
    deliverables: [
      { key: 'podcasts', name: 'M6 Diarized Podcast Manifest', path: 'data/podcasts/m6-diarized/manifest.json', maxAgeHours: 72 },
      { key: 'props_intel', name: 'Player Props Intel Review', path: 'data/research-intel/review/player-props-intel-latest.json', maxAgeHours: 48 }
    ],
    subtasks: [
      { key: 'wednesday-sweep', name: 'YouTube / Podcast Sweep', desc: 'M6 diarization lookback' },
      { key: 'wednesday-articles', name: 'Research Intel Ingest', desc: 'Beat writer & analyst articles' },
      { key: 'wednesday-bookmarks', name: 'Twitter / X Bookmarks', desc: 'Dossier sharp notes' }
    ]
  },
  thursday: {
    day: 'thursday',
    title: 'Thursday • TNF Prep & Props Intel',
    objective: 'Build live player availability & practice reports, sync live market lines vs SuperContest, and compile TNF SGP cards.',
    pipelineTask: 'thursday',
    deliverables: [
      { key: 'availability', name: 'Player Availability & Injuries', path: 'data/player-availability/latest.json', maxAgeHours: 24 },
      { key: 'market_lines', name: 'Live Market Lines CLV', path: 'data/supercontest/live-market-comparison.json', maxAgeHours: 24 }
    ],
    subtasks: [
      { key: 'thursday-injuries', name: 'Build Availability / Injuries', desc: 'Practice participation data' },
      { key: 'sync-odds', name: 'Sync Live Lines vs SuperContest', desc: 'Pre-kickoff odds freeze' },
      { key: 'thursday-props', name: 'TNF Props Intel & SGPs', desc: 'Same-game parlay targets' }
    ]
  },
  friday: {
    day: 'friday',
    title: 'Friday • Starters, Secondary & Alpha Packet',
    objective: 'Final Friday injury designations, projected depth chart starters, secondary vulnerability matrix, and compile Alpha Packet.',
    pipelineTask: 'friday',
    deliverables: [
      { key: 'starters', name: 'Projected Starters (2026)', path: 'data/projected-starters/2026/latest.json', maxAgeHours: 36 },
      { key: 'secondary', name: 'Secondary Matchup Vulnerability', path: 'data/secondary-matchups/latest.json', maxAgeHours: 36 },
      { key: 'alpha', name: 'Master Alpha Data Packet', path: 'public/alpha/alpha-packet-2026.json', maxAgeHours: 36 }
    ],
    subtasks: [
      { key: 'friday-injuries', name: 'Final Injury Reports', desc: 'Official game designations' },
      { key: 'friday-starters', name: 'Build Projected Starters', desc: 'Offense & defense depth' },
      { key: 'friday-secondary', name: 'Secondary Vulnerability', desc: 'Coverage vs WR matchups' },
      { key: 'friday-alpha', name: 'Compile Alpha Data Packet', desc: 'Unified master packet' }
    ]
  },
  saturday: {
    day: 'saturday',
    title: 'Saturday • Card Lock & Wager Sync',
    objective: 'Check official pick inbox, lock card, verify pre-Sunday market CLV, and sync placed wagers to Supabase.',
    pipelineTask: 'saturday',
    deliverables: [
      { key: 'user_wagers', name: 'User Placed Wagers Ledger', path: 'data/official-picks/user-placed-wagers-2026.json', maxAgeHours: 36 },
      { key: 'bankroll_data', name: 'Bankroll Dashboard Sync', path: 'public/user-placed-wagers-2026.json', maxAgeHours: 36 }
    ],
    subtasks: [
      { key: 'saturday-inbox', name: 'Official Pick Inbox Audit', desc: 'Process pending sharp picks' },
      { key: 'sync-odds', name: 'Pre-Sunday Line Movement CLV', desc: 'Audit closing line value' },
      { key: 'sync-bankroll', name: 'Sync Wagers & Cloud Bankroll', desc: 'Dual-sync to Supabase' }
    ]
  },
  sunday: {
    day: 'sunday',
    title: 'Sunday • Inactives & Live Multi-Game Slate',
    objective: 'Run 90-min pre-game inactives check, generate Sunday Multi-Game Live Tracker, and launch live monitoring board.',
    pipelineTask: 'sunday',
    deliverables: [
      { key: 'sunday_tracker', name: 'Sunday Live Tracker Board', path: 'public/live-tracker-sunday.html', maxAgeHours: 24 },
      { key: 'yahoo_fantasy_rosters', name: 'Yahoo Fantasy Rosters & Kicker Radar', path: 'data/fantasy/yahoo-live-rosters.json', maxAgeHours: 6 }
    ],
    subtasks: [
      { key: 'sync-fantasy', name: 'Sync Yahoo Rosters & Kickers', desc: 'Pull latest rosters & kicker availability' },
      { key: 'sunday-inactives', name: 'Pre-Kickoff Inactives Check', desc: 'Scrape 90-min game actives' },
      { key: 'compile-sunday', name: 'Compile Sunday Tracker HTML', desc: 'Generate multi-game board' },
      { key: 'launch-gameday', name: 'Launch Live Gameday Tracker', desc: 'Open in browser' }
    ]
  },
  monday: {
    day: 'monday',
    title: 'Monday • Settlement & Ledger Reconciliation',
    objective: 'Run post-game boxscore reconciliation, auto-grade player props and wagers, and reconcile Alejandro split ledger.',
    pipelineTask: 'monday',
    deliverables: [
      { key: 'alejandro_ledger', name: 'Alejandro Split Ledger History', path: 'data/official-picks/alejandro-ledger-history.json', maxAgeHours: 48 }
    ],
    subtasks: [
      { key: 'reconcile-dry', name: 'Reconciliation Dry-Run', desc: 'Audit grades without commit' },
      { key: 'reconcile-commit', name: 'Grade Boxscores & Commit', desc: 'Auto-grade and sync bankroll' },
      { key: 'mark-settled', name: 'Settle Alejandro Ledger', desc: 'Mark accounts paid & clean' }
    ]
  }
};

// Format human-readable relative time
export function formatRelativeTime(date) {
  if (!date) return 'Missing';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// Get current day name in lowercase
export function getTodayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

// Audit single deliverable file
export async function auditDeliverable(d) {
  const fullPath = path.resolve(ROOT, d.path);
  try {
    const s = await stat(fullPath);
    const mtime = s.mtime;
    const hoursAgo = (Date.now() - mtime.getTime()) / (1000 * 60 * 60);
    const isFresh = hoursAgo <= (d.maxAgeHours || 36);
    return {
      key: d.key,
      name: d.name,
      path: d.path,
      exists: true,
      mtime: mtime.toISOString(),
      hoursAgo: Number(hoursAgo.toFixed(1)),
      status: isFresh ? 'fresh' : 'stale',
      relativeTime: formatRelativeTime(mtime)
    };
  } catch {
    return {
      key: d.key,
      name: d.name,
      path: d.path,
      exists: false,
      mtime: null,
      hoursAgo: null,
      status: 'missing',
      relativeTime: 'Missing'
    };
  }
}

// Audit all weekly cadence deliverables
export async function getCadenceHealth() {
  const results = {};
  for (const [dayKey, dayConf] of Object.entries(DELIVERABLES_CONFIG)) {
    const deliverables = await Promise.all(dayConf.deliverables.map(auditDeliverable));
    let overallStatus = 'fresh';
    if (deliverables.some(d => d.status === 'missing')) {
      overallStatus = 'missing';
    } else if (deliverables.some(d => d.status === 'stale')) {
      overallStatus = 'stale';
    }

    results[dayKey] = {
      day: dayKey,
      title: dayConf.title,
      objective: dayConf.objective,
      pipelineTask: dayConf.pipelineTask,
      status: overallStatus,
      deliverables,
      subtasks: dayConf.subtasks
    };
  }
  return results;
}


// ── PLAIN-LANGUAGE REPO DIAGNOSTICS ─────────────────────────────────────────────
// Every real intel/data source the toolbox depends on, described the way a non-developer
// would want to see it: what it is, when it last updated, and whether that's healthy.
// Reuses the exact same freshness math as the weekly cadence cards (auditDeliverable) so the
// "fresh/stale/missing" verdict here always agrees with the cadence view.
const DIAGNOSTIC_FILE_SOURCES = [
  {
    key: 'schedule',
    label: 'NFL Schedule (matchups & kickoff times)',
    detail: 'Pulled from ESPN. Powers every day\'s game list and kickoff countdowns.',
    path: 'public/schedule.json',
    maxAgeHours: 168,
    group: 'Game & Player Data'
  },
  {
    key: 'odds',
    label: 'Betting Odds & Spreads (sportsbooks)',
    detail: 'Live market lines from TheOddsAPI, used for CLV tracking and card locking.',
    path: 'data/supercontest/live-market-comparison.json',
    maxAgeHours: 48,
    group: 'Betting Markets'
  },
  {
    key: 'player_stats',
    label: 'Player Stats & Usage (weekly)',
    detail: 'Weekly box-score stats from nflverse, used to spot workload/usage trends.',
    path: 'data/vault-seed/nflverse/player_stats_weekly.csv',
    maxAgeHours: 168,
    group: 'Game & Player Data'
  },
  {
    key: 'availability',
    label: 'Injury & Availability Reports',
    detail: 'Practice participation and game-status designations for every roster.',
    path: 'data/player-availability/latest.json',
    maxAgeHours: 24,
    group: 'Game & Player Data'
  },
  {
    key: 'projected_starters',
    label: 'Projected Starters & Usage Locks',
    detail: 'Weekly starter projections, feeding the Human Review queue.',
    path: 'data/projected-starters/2026/latest.json',
    maxAgeHours: 48,
    group: 'Game & Player Data'
  },
  {
    key: 'dvoa',
    label: 'Advanced Team Metrics (DVOA)',
    detail: 'Efficiency ratings for every team, used to sanity-check spreads and totals against a second opinion.',
    path: 'data/generated/team-profiles/team-dvoa-snapshots-2026.json',
    maxAgeHours: 240,
    group: 'Game & Player Data'
  },
  {
    key: 'betting_splits',
    label: 'Betting Splits (Public vs. Sharp Money)',
    detail: 'What percentage of bets and money is on each side of a game, used to spot where the public and sharp money disagree.',
    path: 'public/betting_splits.json',
    maxAgeHours: 48,
    group: 'Betting Markets'
  },
  {
    key: 'prediction_markets',
    label: 'Prediction Markets (Kalshi / Polymarket)',
    detail: 'Real-money forecasts for the Super Bowl and other season-long outcomes from prediction-market exchanges.',
    path: 'data/prediction-markets/latest.json',
    maxAgeHours: 168,
    group: 'Betting Markets'
  },
  {
    key: 'alpha_packet',
    label: 'Alpha Data Packet (master intel bundle)',
    detail: 'The unified Friday packet combining odds, injuries, and starters.',
    path: 'public/alpha/alpha-packet-2026.json',
    maxAgeHours: 48,
    group: 'System & Master Feeds'
  }
];

// Translate the technical fresh/stale/missing verdict into the plain healthy/stale/broken
// language the Diagnostics tab shows to a non-developer.
function statusToPlainLanguage(status) {
  if (status === 'fresh') return 'healthy';
  if (status === 'stale') return 'stale';
  return 'broken';
}

async function checkFileSource(source) {
  const audited = await auditDeliverable(source);
  return {
    key: source.key,
    label: source.label,
    detail: source.detail,
    path: source.path,
    status: statusToPlainLanguage(audited.status),
    lastUpdated: audited.mtime,
    relativeTime: audited.relativeTime,
    checkType: 'file_freshness',
    group: source.group || 'Other'
  };
}

// Find the newest-modified file directly inside a directory whose name matches an
// optional predicate (used for sources that write a fresh, uniquely-named file on every
// run instead of overwriting one fixed path -- e.g. per-tweet bookmark reports or
// timestamped ingest receipts).
async function newestFileInDir(dirAbs, predicate) {
  let entries;
  try {
    entries = await readdir(dirAbs, { withFileTypes: true });
  } catch {
    return null;
  }
  let newest = null;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (predicate && !predicate(entry.name)) continue;
    const fullPath = path.join(dirAbs, entry.name);
    try {
      const s = await stat(fullPath);
      if (!newest || s.mtime.getTime() > newest.mtime.getTime()) {
        newest = { path: fullPath, mtime: s.mtime };
      }
    } catch {
      // skip unreadable entry
    }
  }
  return newest;
}

// Audit a source whose freshness signal is "the newest file matching a pattern",
// rather than one fixed path -- same fresh/stale/missing verdict logic as
// auditDeliverable, reused so the plain-language status stays consistent everywhere.
async function checkLatestFileInDirSource(source) {
  const dirAbs = path.resolve(ROOT, source.dir);
  const newest = await newestFileInDir(dirAbs, source.predicate);
  if (!newest) {
    return {
      key: source.key,
      label: source.label,
      detail: source.detail,
      path: source.dir,
      status: 'broken',
      lastUpdated: null,
      relativeTime: 'Missing',
      checkType: 'file_freshness',
      group: source.group || 'Other'
    };
  }
  const hoursAgo = (Date.now() - newest.mtime.getTime()) / (1000 * 60 * 60);
  const isFresh = hoursAgo <= (source.maxAgeHours || 36);
  return {
    key: source.key,
    label: source.label,
    detail: source.detail,
    path: path.relative(ROOT, newest.path),
    status: isFresh ? 'healthy' : 'stale',
    lastUpdated: newest.mtime.toISOString(),
    relativeTime: formatRelativeTime(newest.mtime),
    checkType: 'file_freshness',
    group: source.group || 'Other'
  };
}

// Audit a source that is "healthy" if ANY of several candidate files/directories was
// touched recently -- used for markets that are covered by more than one ingest script
// (e.g. season-long futures odds + hand-maintained win totals), where either one updating
// is enough to consider the combined market data current.
async function checkFreshestOfCandidates(source) {
  let newestMtime = null;
  let newestPath = null;
  for (const candidate of source.candidates) {
    if (candidate.path) {
      const fullPath = path.resolve(ROOT, candidate.path);
      try {
        const s = await stat(fullPath);
        if (!newestMtime || s.mtime.getTime() > newestMtime.getTime()) {
          newestMtime = s.mtime;
          newestPath = candidate.path;
        }
      } catch {
        // candidate file doesn't exist -- fine, another candidate may
      }
    } else if (candidate.dir) {
      const dirAbs = path.resolve(ROOT, candidate.dir);
      const newest = await newestFileInDir(dirAbs, candidate.predicate);
      if (newest && (!newestMtime || newest.mtime.getTime() > newestMtime.getTime())) {
        newestMtime = newest.mtime;
        newestPath = path.relative(ROOT, newest.path);
      }
    }
  }
  if (!newestMtime) {
    return {
      key: source.key,
      label: source.label,
      detail: source.detail,
      path: null,
      status: 'broken',
      lastUpdated: null,
      relativeTime: 'Missing',
      checkType: 'file_freshness',
      group: source.group || 'Other'
    };
  }
  const hoursAgo = (Date.now() - newestMtime.getTime()) / (1000 * 60 * 60);
  const isFresh = hoursAgo <= (source.maxAgeHours || 36);
  return {
    key: source.key,
    label: source.label,
    detail: source.detail,
    path: newestPath,
    status: isFresh ? 'healthy' : 'stale',
    lastUpdated: newestMtime.toISOString(),
    relativeTime: formatRelativeTime(newestMtime),
    checkType: 'file_freshness',
    group: source.group || 'Other'
  };
}

// Live connectivity probe for the Supabase cloud database (games / odds_snapshots /
// player_stats / player_season_stats tables). This is a reachability check, not a
// freshness check -- the file-based sources above already cover data staleness.
async function checkSupabase() {
  const label = 'Cloud Database Backup (Supabase)';
  const detail = 'The cloud copy of games, odds, player stats, and bankroll history.';
  const group = 'System & Master Feeds';
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { key: 'supabase', label, detail, path: null, status: 'not_configured', lastUpdated: null, relativeTime: 'No cloud credentials configured on this machine', checkType: 'live_probe', group };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(`${url}/rest/v1/games?select=game_id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if (response.ok) {
      return { key: 'supabase', label, detail, path: null, status: 'healthy', lastUpdated: null, relativeTime: 'Reachable just now', checkType: 'live_probe', group };
    }
    return { key: 'supabase', label, detail, path: null, status: 'broken', lastUpdated: null, relativeTime: `Responded with an error (HTTP ${response.status})`, checkType: 'live_probe', group };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'Timed out after 5s' : err.message;
    return { key: 'supabase', label, detail, path: null, status: 'broken', lastUpdated: null, relativeTime: `Could not connect (${reason})`, checkType: 'live_probe', group };
  }
}

// Live intel pipelines that write a NEW file per run (dated bookmark reports, timestamped
// ingest receipts) rather than overwriting one fixed path. Checked with
// checkLatestFileInDirSource / checkFreshestOfCandidates instead of checkFileSource.
const DIAGNOSTIC_DIR_SOURCES = [
  {
    key: 'podcast_intel',
    label: 'Podcast Show Intel',
    detail: 'Transcripts and takeaways pulled from NFL betting podcasts, diarized by speaker.',
    dir: 'data/podcasts/m6-diarized',
    predicate: (name) => name === 'manifest.json',
    maxAgeHours: 100,
    group: 'Media & Research Intel'
  },
  {
    key: 'article_intel',
    label: 'Written Research & Article Intel',
    detail: 'Beat-writer articles and injury/roster news, screened for anything that should change a pick.',
    dir: 'data/research-intel/review',
    predicate: (name) => name === 'article-intel-review-latest.json',
    maxAgeHours: 30,
    group: 'Media & Research Intel'
  },
  {
    key: 'twitter_bookmarks',
    label: 'Personal Twitter Bookmarks',
    detail: 'NFL betting intel saved from your own X/Twitter bookmarks.',
    dir: '.nfl/reports/twitter-bookmarks',
    predicate: (name) => name.endsWith('.md'),
    maxAgeHours: 96,
    group: 'Media & Research Intel'
  },
  {
    key: 'twitter_sharp',
    label: 'Sharp Twitter/X Accounts',
    detail: 'Posts from a curated list of sharp NFL betting accounts on X, checked for line moves and picks.',
    dir: '.nfl/receipts',
    predicate: (name) => name.startsWith('x-sharp-ingest-') && name.endsWith('.json'),
    maxAgeHours: 48,
    group: 'Media & Research Intel'
  }
];

// Live pipelines whose combined market is "current" if EITHER of two related ingest
// scripts has run recently (season-long futures odds + hand-maintained win totals).
const DIAGNOSTIC_MULTI_SOURCES = [
  {
    key: 'futures_markets',
    label: 'Futures & Season-Long Markets',
    detail: 'Super Bowl, MVP, and season win-total odds -- markets that play out over the full year, not one game.',
    maxAgeHours: 72,
    group: 'Betting Markets',
    candidates: [
      { dir: '.nfl/receipts', predicate: (name) => name.startsWith('futures-ingest-') && name.endsWith('.json') },
      { path: 'data/win-totals/2026.json' }
    ]
  }
];

// Full diagnostics payload for the "Diagnostics, In Plain English" tab.
export async function getDiagnosticsPayload() {
  const fileResults = await Promise.all(DIAGNOSTIC_FILE_SOURCES.map(checkFileSource));
  const dirResults = await Promise.all(DIAGNOSTIC_DIR_SOURCES.map(checkLatestFileInDirSource));
  const multiResults = await Promise.all(DIAGNOSTIC_MULTI_SOURCES.map(checkFreshestOfCandidates));
  const supabaseResult = await checkSupabase();
  const sources = [...fileResults, ...dirResults, ...multiResults, supabaseResult];
  const healthyCount = sources.filter((s) => s.status === 'healthy').length;
  return {
    generatedAt: new Date().toISOString(),
    healthyCount,
    totalCount: sources.length,
    sources
  };
}

// Broadcast a message to all active SSE clients
function broadcastLog(data, type = 'stdout') {
  const line = { type, data: ansiToHtml(data), time: new Date().toISOString() };
  logBuffer.push(line);
  if (logBuffer.length > 600) logBuffer.shift();

  const payload = JSON.stringify(line);
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
}

// Broadcast task status update
function broadcastStatus(status, exitCode = null) {
  const payload = JSON.stringify({
    type: 'status',
    status,
    exitCode,
    task: currentTaskName,
    elapsed: currentTaskStartTime ? ((Date.now() - currentTaskStartTime) / 1000).toFixed(1) : 0
  });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
}

// Convert ANSI escape sequences to HTML spans
function ansiToHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\x1b\[1m/g, '<strong>')
    .replace(/\x1b\[2m/g, '<span style="opacity:0.6;">')
    .replace(/\x1b\[31m/g, '<span style="color:#F87171;">')
    .replace(/\x1b\[32m/g, '<span style="color:#34D399;">')
    .replace(/\x1b\[33m/g, '<span style="color:#FBBF24;">')
    .replace(/\x1b\[34m/g, '<span style="color:#60A5FA;">')
    .replace(/\x1b\[35m/g, '<span style="color:#C084FC;">')
    .replace(/\x1b\[36m/g, '<span style="color:#38BDF8;">')
    .replace(/\x1b\[37m/g, '<span style="color:#F8FAFC;">')
    .replace(/\x1b\[0m/g, '</span></strong>')
    .replace(/\r\n/g, '<br>')
    .replace(/\n/g, '<br>');
}

// Locate Brave browser executable on Windows
export function getBravePath() {
  const candidates = [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

// Launch browser or standalone window (prioritizes Brave)
export function openBrowser(targetUrl, appMode = false) {
  let fullUrl = targetUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (targetUrl.startsWith('public/')) {
      fullUrl = `http://127.0.0.1:${serverPort}/${targetUrl}`;
    } else {
      fullUrl = path.resolve(ROOT, targetUrl);
    }
  }

  console.log(`🌐 Launching in browser: ${fullUrl} (App Mode: ${appMode})`);
  if (process.platform === 'win32') {
    const bravePath = getBravePath();
    if (bravePath) {
      const args = appMode ? [`--app=${fullUrl}`] : [fullUrl];
      const child = spawn(bravePath, args, { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      if (appMode) {
        spawn('cmd.exe', ['/c', 'start', 'msedge', `--app=${fullUrl}`], { detached: true, stdio: 'ignore' });
      } else {
        spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${fullUrl}'`], { detached: true, stdio: 'ignore' });
      }
    }
  } else if (process.platform === 'darwin') {
    spawn('open', [fullUrl], { detached: true, stdio: 'ignore' });
  } else {
    spawn('xdg-open', [fullUrl], { detached: true, stdio: 'ignore' });
  }
}

// Execute command pipeline job
export function runTask(taskKey) {
  // ── INSTANT TOP-LEVEL LAUNCHERS ──
  if (taskKey === 'launch-dashboard') {
    const dashboardUrl = 'http://localhost:5180/platinum-rose-app/';
    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/c', 'npm', 'run', 'dev'], { cwd: ROOT, detached: true, stdio: 'ignore' });
    openBrowser(dashboardUrl);
    broadcastLog(`🌐 Launched NFL Dashboard in browser (${dashboardUrl})\n`, 'system');
    broadcastStatus('idle');
    return { ok: true, task: taskKey, url: dashboardUrl, message: 'Launched NFL Dashboard' };
  }
  if (taskKey === 'launch-gameday' || taskKey === 'launch-sunday') {
    const sunUrl = `http://127.0.0.1:${serverPort}/live-tracker-sunday.html?tab=supercontest`;
    openBrowser(sunUrl);
    broadcastLog(`🌐 Launched Live Gameday Tracker in browser\n`, 'system');
    broadcastStatus('idle');
    return { ok: true, task: taskKey, url: sunUrl, message: 'Launched Live Gameday Tracker' };
  }
  if (activeProcess) {
    return { ok: false, error: 'Another task is currently running. Please stop it first or wait for completion.' };
  }

  logBuffer = [];
  currentTaskName = taskKey;
  currentTaskStartTime = Date.now();
  broadcastStatus('running');

  let cmd = 'node';
  let args = [];

  switch (taskKey) {
    // ── CADENCE DAYS (FULL COMPOSITE RUNNERS) ──
    case 'tuesday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'tuesday'];
      break;
    case 'wednesday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'wednesday'];
      break;
    case 'thursday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'thursday'];
      break;
    case 'friday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'friday'];
      break;
    case 'saturday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'saturday'];
      break;
    case 'sunday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'sunday'];
      break;
    case 'monday':
      cmd = 'node';
      args = ['scripts/toolbox.mjs', '--cadence', 'monday'];
      break;

    // ── CADENCE SUB-TASKS (INDIVIDUAL RUNNERS) ──
    case 'tuesday-schedule':
      cmd = 'node';
      args = ['agents/schedule-ingest.js', '--year', '2026', '--season-type', '2', '--start-week', '1', '--end-week', '18'];
      break;
    case 'tuesday-player-stats-refresh':
      cmd = 'python3';
      args = ['scripts/fetch_nflverse_data.py', '--datasets', 'player_stats_weekly', 'player_stats_seasonal', '--force'];
      break;
    case 'tuesday-player-stats-ingest':
      cmd = 'node';
      args = ['agents/player-stats-ingest.js', '--season', '2026'];
      break;
    case 'tuesday-usage-locks':
      cmd = 'node';
      args = ['scripts/build-week-usage-locks.js', '--season', '2026'];
      break;
    case 'tuesday-rebuild-starters':
      cmd = 'node';
      args = ['scripts/build-projected-starters.js'];
      break;
    case 'tuesday-odds':
      cmd = 'node';
      args = ['agents/game-odds-ingest.js', '--season', '2026', '--dry-run'];
      break;
    case 'tuesday-roster':
      cmd = 'node';
      args = ['scripts/audit-all32-rosters.js'];
      break;

    case 'wednesday-sweep':
      cmd = 'node';
      args = ['scripts/youtube-podcast-sweep.js', '--lookback-days', '3', '--max-per-run', '5'];
      break;
    case 'wednesday-articles':
      cmd = 'node';
      args = ['agents/research-intel-ingest.js', '--dry-run'];
      break;
    case 'wednesday-bookmarks':
      cmd = 'node';
      args = ['agents/twitter-bookmarks-agent.js', '--dry-run'];
      break;

    case 'thursday-injuries':
      cmd = 'node';
      args = ['scripts/build-player-availability.js', '--live-injuries'];
      break;
    case 'thursday-props':
      cmd = 'node';
      args = ['scripts/build-player-props-intel.js'];
      break;

    case 'friday-injuries':
      cmd = 'node';
      args = ['scripts/build-player-availability.js', '--live-injuries'];
      break;
    case 'friday-starters':
      cmd = 'node';
      args = ['scripts/build-projected-starters.js'];
      break;
    case 'friday-secondary':
      cmd = 'node';
      args = ['scripts/build-secondary-matchup-vulnerability.js'];
      break;
    case 'friday-alpha':
      cmd = 'node';
      args = ['scripts/build-alpha-data-packet.js'];
      break;

    case 'saturday-inbox':
      cmd = 'node';
      args = ['scripts/official-pick-ledger.js', 'inbox'];
      break;

    case 'sync-fantasy':
      cmd = 'node';
      args = ['scripts/sync-yahoo-fantasy.mjs'];
      break;
    case 'sunday-inactives':
      cmd = 'node';
      args = ['scripts/build-player-availability.js', '--live-injuries'];
      break;
    case 'compile-sunday':
      cmd = 'node';
      args = ['scripts/generate-live-tracker.mjs', '--week', '1'];
      break;

    // ── RECONCILIATION & SYNC ──
    case 'sync-bankroll':
      cmd = 'node';
      args = ['scripts/sync-placed-wagers-to-bankroll.mjs'];
      break;
    case 'reconcile-dry':
      cmd = 'node';
      args = ['scripts/reconcile-settlement.mjs', '--dry-run'];
      break;
    case 'reconcile-force':
      cmd = 'node';
      args = ['scripts/reconcile-settlement.mjs', '--dry-run', '--force'];
      break;
    case 'reconcile-commit':
      cmd = 'node';
      args = ['scripts/reconcile-settlement.mjs'];
      break;

    // ── DIAGNOSTICS & SYSTEM HEALTH ──
    case 'smoke-test':
      cmd = 'node';
      args = ['scripts/season-readiness-smoke.js', '--no-write'];
      break;
    case 'sync-odds':
      cmd = 'node';
      args = ['scripts/sync-live-market-lines.mjs'];
      break;
    case 'test-espn':
      cmd = 'node';
      args = ['-e', "fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard').then(r=>r.json()).then(d=>console.log('✅ ESPN Scoreboard Connected: ' + (d.events||[]).length + ' games in feed.'))"];
      break;

    default:
      currentTaskName = null;
      broadcastStatus('idle');
      return { ok: false, error: `Unknown task: ${taskKey}` };
  }

  broadcastLog(`▶ Starting task: ${taskKey} (${cmd} ${args.join(' ')})\n`, 'system');

  try {
    activeProcess = spawn(cmd, args, {
      cwd: ROOT,
      shell: true,
      env: { ...process.env }
    });

    activeProcess.stdout.on('data', (d) => {
      broadcastLog(d.toString(), 'stdout');
    });

    activeProcess.stderr.on('data', (d) => {
      broadcastLog(d.toString(), 'stderr');
    });

    activeProcess.on('close', (code) => {
      const elapsed = ((Date.now() - currentTaskStartTime) / 1000).toFixed(1);
      if (code === 0) {
        broadcastLog(`\n✔ Task "${taskKey}" completed successfully in ${elapsed}s.\n`, 'system');
        broadcastStatus('completed', 0);
      } else {
        broadcastLog(`\n✖ Task "${taskKey}" exited with error code ${code} after ${elapsed}s.\n`, 'system');
        broadcastStatus('failed', code);
      }
      activeProcess = null;
      currentTaskName = null;
    });

    activeProcess.on('error', (err) => {
      broadcastLog(`\n✖ Failed to spawn process: ${err.message}\n`, 'system');
      broadcastStatus('failed', -1);
      activeProcess = null;
      currentTaskName = null;
    });

    return { ok: true, task: taskKey };
  } catch (err) {
    activeProcess = null;
    currentTaskName = null;
    broadcastStatus('idle');
    return { ok: false, error: err.message };
  }
}

// Kill active process
export function killActiveProcess() {
  if (activeProcess) {
    broadcastLog(`\n⚠️ Process killed by user.\n`, 'system');
    activeProcess.kill('SIGTERM');
    activeProcess = null;
    currentTaskName = null;
    broadcastStatus('idle');
    return { ok: true };
  }
  return { ok: false, error: 'No active process to stop.' };
}

// Load status payload (Cadence deliverable health + repo status)
export async function getStatusPayload() {
  const cadenceHealth = await getCadenceHealth();
  const todayName = getTodayName();

  return {
    cadenceHealth,
    todayName,
    activeTask: currentTaskName,
    serverTime: new Date().toISOString()
  };
}

// Read the current projected-starters snapshot and return only the players flagged for
// human review, shaped for the Human Review tab.
function toReviewRow(p) {
  return {
    team: p.team,
    team_nick: p.team_nick || null,
    player_name: p.player_name,
    position: p.position || 'UNK',
    role: p.role,
    starter_confidence: p.starter_confidence,
    impact_bucket: p.impact_bucket || null,
    evidence_tags: p.evidence_tags || [],
    evidence: p.sources?.[0]?.evidence || ''
  };
}

async function getHumanReviewQueue() {
  const latestPath = path.resolve(ROOT, 'data', 'projected-starters', '2026', 'latest.json');
  try {
    const raw = await readFile(latestPath, 'utf8');
    const snapshot = JSON.parse(raw);
    const queue = (snapshot.players || [])
      .filter((p) => p.needs_human_review === true)
      .map(toReviewRow)
      .sort((a, b) => a.team.localeCompare(b.team) || a.player_name.localeCompare(b.player_name));
    return { ok: true, generatedAt: snapshot.meta?.generated_at || null, count: queue.length, queue };
  } catch (err) {
    return { ok: true, generatedAt: null, count: 0, queue: [], warning: `No projected starters snapshot found yet (${err.message})` };
  }
}

const HUMAN_REVIEW_MANUAL_DIR = path.resolve(ROOT, 'data', 'projected-starters', '2026', 'manual');

// Before a reject is recorded the player is still in latest.json, so capture a small
// display-only context snapshot (role / confidence / evidence) for the Excluded list --
// once rejected, the rebuild drops the row from latest.json and that context is gone.
async function attachRejectContext(decisions) {
  if (!decisions.some((d) => d.decision === 'rejected')) return decisions;
  let byKey = new Map();
  try {
    const snapshot = JSON.parse(await readFile(path.resolve(ROOT, 'data', 'projected-starters', '2026', 'latest.json'), 'utf8'));
    byKey = new Map((snapshot.players || []).map((p) => [starterRowKey(p), p]));
  } catch { /* no snapshot: rejects are still recorded, just without context */ }
  return decisions.map((d) => {
    if (d.decision !== 'rejected') return d;
    const p = byKey.get(starterRowKey({ team: d.team, player_name: d.player_name, position: d.position || '' }));
    if (!p) return d;
    const row = toReviewRow(p);
    return { ...d, review_context: { role: row.role || null, starter_confidence: row.starter_confidence ?? null, impact_bucket: row.impact_bucket, evidence: row.evidence } };
  });
}

// Rejected players, read straight from human-review-decisions.json (the source of truth the
// rebuild uses to drop them), shaped for the Human Review tab's Excluded panel.
async function getExcludedPlayers() {
  try {
    const decisions = await loadHumanReviewDecisions(HUMAN_REVIEW_MANUAL_DIR);
    const excluded = [...decisions.entries()]
      .filter(([, d]) => d?.decision === 'rejected')
      .map(([key, d]) => ({
        key,
        team: d.team,
        player_name: d.player_name,
        position: d.position || 'UNK',
        rejected_at: d.decided_at || null,
        role: d.review_context?.role || null,
        starter_confidence: d.review_context?.starter_confidence ?? null,
        evidence: d.review_context?.evidence || ''
      }))
      .sort((a, b) => String(b.rejected_at || '').localeCompare(String(a.rejected_at || '')) || a.team.localeCompare(b.team) || a.player_name.localeCompare(b.player_name));
    return { ok: true, count: excluded.length, excluded };
  } catch (err) {
    return { ok: false, count: 0, excluded: [], error: `Could not read human-review decisions (${err.message})` };
  }
}

// Allowed dev/loopback origins
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'http://localhost:4567',
  'http://127.0.0.1:4567',
  'null'
]);

function isAllowedOrigin(originHeader) {
  if (!originHeader) return true; // Direct curl, CLI, same-origin
  return ALLOWED_ORIGINS.has(originHeader);
}

// ── HTTP REQUEST ROUTER ────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS Security: Reject untrusted cross-origin requests
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Forbidden: Untrusted cross-origin request' }));
    return;
  }

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Single-Page Application Home (Served cleanly from separate HTML file)
  if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const html = await readFile(DASHBOARD_HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading dashboard HTML: ' + err.message);
    }
    return;
  }

  // 1b. Manifest route for PWA
  if (req.method === 'GET' && url.pathname === '/manifest.json') {
    const manifest = {
      name: "NFL Platinum Rose Toolbox",
      short_name: "NFL Toolbox",
      start_url: "/",
      display: "standalone",
      background_color: "#0B1120",
      theme_color: "#0B1120",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "64x64 32x32 24x24 16x16",
          type: "image/svg+xml"
        }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest));
    return;
  }

  // 1c. SVG Favicon
  if (req.method === 'GET' && (url.pathname === '/favicon.ico' || url.pathname === '/icon.svg')) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1E293B" stroke="#F59E0B" stroke-width="4"/><text x="50" y="65" font-size="45" text-anchor="middle">🏈</text></svg>`;
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(svgIcon);
    return;
  }

  // 1d. Static files in public/ (e.g. live trackers, schedule, etc.)
  if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname.startsWith('/public/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    const rawPath = url.pathname.startsWith('/public/') ? url.pathname.slice(8) : (url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname);
    const targetFilePath = path.resolve(ROOT, 'public', rawPath);
    const publicRoot = path.resolve(ROOT, 'public');
    if (targetFilePath.startsWith(publicRoot)) {
      try {
        const fileStat = await stat(targetFilePath);
        if (fileStat.isFile()) {
          const content = await readFile(targetFilePath);
          let contentType = 'text/plain';
          if (targetFilePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
          else if (targetFilePath.endsWith('.json')) contentType = 'application/json; charset=utf-8';
          else if (targetFilePath.endsWith('.js') || targetFilePath.endsWith('.mjs')) contentType = 'application/javascript; charset=utf-8';
          else if (targetFilePath.endsWith('.css')) contentType = 'text/css; charset=utf-8';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(req.method === 'HEAD' ? undefined : content);
          return;
        }
      } catch (e) {
        // Fall through to 404 or other routes
      }
    }
  }

  // 2. Server-Sent Events (SSE) Live Log Streaming
  if (req.method === 'GET' && url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('\n');

    // Send buffered logs
    for (const b of logBuffer) {
      res.write(`data: ${JSON.stringify(b)}\n\n`);
    }

    // Send current status
    res.write(`data: ${JSON.stringify({
      type: 'status',
      status: activeProcess ? 'running' : 'idle',
      task: currentTaskName
    })}\n\n`);

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. Status API
  if (req.method === 'GET' && url.pathname === '/api/status') {
    const payload = await getStatusPayload();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  // 4. Run Task API
  if (req.method === 'POST' && url.pathname === '/api/run') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { task } = JSON.parse(body || '{}');
        if (task === 'mark-settled') {
          // Reset Alejandro Ledger
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
          broadcastLog(`\n✔ Alejandro Castro Ledger marked settled ($0.00 balance).\n`, 'system');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        const result = runTask(task);
        res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 4b. Sync Yahoo Fantasy API
  if (req.method === 'POST' && url.pathname === '/api/sync-yahoo-fantasy') {
    broadcastLog('▶ Syncing Yahoo Fantasy Rosters & Bench Drops...\n', 'system');
    try {
      const { syncYahooFantasy } = await import('./sync-yahoo-fantasy.mjs');
      const payload = await syncYahooFantasy({ week: 1 });
      broadcastLog(`✔ Yahoo Fantasy Rosters synced successfully (${payload.leaguesCount} leagues).\n`, 'system');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, syncedAt: payload.syncedAt, leaguesCount: payload.leaguesCount }));
    } catch (err) {
      broadcastLog(`✖ Failed to sync Yahoo Fantasy: ${err.message}\n`, 'system');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 4c. SuperContest Locked Card API (GET / POST)
  if (url.pathname === '/api/supercontest/locked-card') {
    const week = url.searchParams.get('week') || '1';
    const dataFile = path.resolve(ROOT, `data/supercontest/locked-card-week-${week}.json`);
    const pubFile = path.resolve(ROOT, `public/locked-card-week-${week}.json`);

    if (req.method === 'GET') {
      try {
        const content = await readFile(dataFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
      } catch {
        try {
          const pubContent = await readFile(pubFile, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(pubContent);
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, lockedCard: [] }));
        }
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const targetWeekNum = parseInt(payload.week || week, 10);
          if (!Number.isInteger(targetWeekNum) || targetWeekNum < 1 || targetWeekNum > 18) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid week: must be an integer between 1 and 18.' }));
            return;
          }

          const rawCard = payload.lockedCard;
          if (!Array.isArray(rawCard)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid lockedCard: must be an array.' }));
            return;
          }

          if (rawCard.length > 5) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'SuperContest limit exceeded: Maximum 5 picks allowed.' }));
            return;
          }

          // Strict field-level allowlist and sanitization
          const sanitizedCard = rawCard.map((item, idx) => {
            const team = String(item.team || item.pickTeam || '').toUpperCase().trim();
            if (!team || !/^[A-Z]{2,4}$/.test(team)) {
              throw new Error(`Invalid team identifier at pick #${idx + 1}: "${team}"`);
            }
            const opponent = String(item.opponent || '').toUpperCase().trim();
            const spreadNum = Number(item.spread);
            if (!Number.isFinite(spreadNum) || spreadNum < -35 || spreadNum > 35) {
              throw new Error(`Invalid spread value at pick #${idx + 1}`);
            }

            return {
              gameId: String(item.gameId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30),
              team,
              pickTeam: team,
              pickLabel: String(item.pickLabel || item.spreadLabel || `${team} ${spreadNum > 0 ? '+' : ''}${spreadNum}`).replace(/[<>"]/g, '').slice(0, 40),
              spread: spreadNum,
              spreadLabel: String(item.spreadLabel || `${team} ${spreadNum > 0 ? '+' : ''}${spreadNum}`).replace(/[<>"]/g, '').slice(0, 20),
              opponent: opponent ? opponent.slice(0, 4) : 'OPP',
              isHome: Boolean(item.isHome),
              lockedSpread: String(item.lockedSpread || `${spreadNum > 0 ? '+' : ''}${spreadNum}`).replace(/[<>"]/g, '').slice(0, 10),
              contestSpread: String(item.contestSpread || `${team} vs ${opponent}`).replace(/[<>"]/g, '').slice(0, 40),
              currentSpread: String(item.currentSpread || `${team} ${spreadNum}`).replace(/[<>"]/g, '').slice(0, 40),
              matchup: String(item.matchup || `${team} vs ${opponent}`).replace(/[<>"]/g, '').slice(0, 30),
              kickoffDay: String(item.kickoffDay || 'Sun').replace(/[^a-zA-Z]/g, '').slice(0, 10),
              kickoffTime: String(item.kickoffTime || '1:00 pm').replace(/[<>"]/g, '').slice(0, 20),
              clvText: String(item.clvText || 'Official Locked Pick').replace(/[<>"]/g, '').slice(0, 80),
              reason: String(item.reason || `Official Contest Pick on ${team}.`).replace(/[<>"]/g, '').slice(0, 250)
            };
          });

          const targetDataFile = path.resolve(ROOT, `data/supercontest/locked-card-week-${targetWeekNum}.json`);
          const targetPubFile = path.resolve(ROOT, `public/locked-card-week-${targetWeekNum}.json`);

          await writeFile(targetDataFile, JSON.stringify(sanitizedCard, null, 2), 'utf8');
          await writeFile(targetPubFile, JSON.stringify(sanitizedCard, null, 2), 'utf8');

          // Immediately recompile Live Sunday Tracker so SSR renders this card!
          try {
            await generateLiveTracker({ week: targetWeekNum });
            broadcastLog(`\n🎯 SuperContest Card locked (${sanitizedCard.length} picks). Live Sunday Tracker recompiled.\n`, 'system');
          } catch (genErr) {
            console.warn('Tracker auto-compile warning:', genErr);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, count: sanitizedCard.length }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }
  }

  // 5. Open External in Browser
  if (req.method === 'POST' && url.pathname === '/api/open-external') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { url: targetUrl } = JSON.parse(body || '{}');
        openBrowser(targetUrl, false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 6. Stop / Kill Active Process
  if (req.method === 'POST' && url.pathname === '/api/kill') {
    const result = killActiveProcess();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 7. Diagnostics API (plain-language repo/data health)
  if (req.method === 'GET' && url.pathname === '/api/diagnostics') {
    try {
      const payload = await getDiagnosticsPayload();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...payload }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // 8. Human Review API — fetch the current needs-review queue
  if (req.method === 'GET' && url.pathname === '/api/human-review') {
    const payload = await getHumanReviewQueue();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  // 8b. Human Review API — record approve/reject decisions (single or batch "Approve All"),
  //     then rebuild the projected-starters snapshot so the decisions take effect immediately.
  if (req.method === 'POST' && url.pathname === '/api/human-review/decide') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const decisions = Array.isArray(parsed.decisions) ? parsed.decisions : (parsed.player_name ? [parsed] : []);
        if (!decisions.length) throw new Error('No decisions provided.');
        for (const d of decisions) {
          if (!d.team || !d.player_name || (d.decision !== 'approved' && d.decision !== 'rejected')) {
            throw new Error('Each decision needs team, player_name, and decision of "approved" or "rejected".');
          }
        }
        const manualDir = HUMAN_REVIEW_MANUAL_DIR;
        await recordHumanReviewDecisions(manualDir, await attachRejectContext(decisions));
        const summary = decisions.map((d) => `${d.player_name} (${d.decision})`).join(', ');
        broadcastLog(`\n🧐 Recorded ${decisions.length} human-review decision(s): ${summary}\n`, 'system');
        const { snapshot } = await buildProjectedStarters({});
        broadcastLog(`✔ Projected Starters snapshot rebuilt (${snapshot.meta.player_count} players; ${snapshot.meta.human_review_approved_count} approved / ${snapshot.meta.human_review_rejected_count} rejected on file).\n`, 'system');
        const payload = await getHumanReviewQueue();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...payload, applied: decisions.length }));
      } catch (err) {
        broadcastLog(`\n✖ Human review decision failed: ${err.message}\n`, 'system');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 8c. Human Review API — list rejected ("excluded") players from human-review-decisions.json
  if (req.method === 'GET' && url.pathname === '/api/human-review/excluded') {
    const payload = await getExcludedPlayers();
    res.writeHead(payload.ok ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  // 8d. Human Review API — restore rejected players: delete their "rejected" decision (NOT an
  //     approval), then rebuild so they re-enter the snapshot and get re-evaluated normally.
  //     Body: { keys: ["TEAM|name|POS", ...] } or { key } or { team, player_name, position }.
  if (req.method === 'POST' && url.pathname === '/api/human-review/restore') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        let keys = Array.isArray(parsed.keys) ? parsed.keys : (parsed.key ? [parsed.key] : []);
        if (!keys.length && parsed.team && parsed.player_name) {
          keys = [starterRowKey({ team: parsed.team, player_name: parsed.player_name, position: parsed.position || '' })];
        }
        keys = keys.filter((k) => typeof k === 'string' && k.includes('|'));
        if (!keys.length) throw new Error('No players to restore (send keys, key, or team + player_name + position).');
        const { restored, skipped } = await restoreRejectedHumanReviewDecisions(HUMAN_REVIEW_MANUAL_DIR, keys);
        if (!restored.length) throw new Error(`Nothing restored: ${skipped.map((s) => `${s.key} (${s.reason})`).join('; ')}`);
        broadcastLog(`\n↩ Restored ${restored.length} excluded player(s): ${restored.map((r) => r.player_name).join(', ')}\n`, 'system');
        const { snapshot } = await buildProjectedStarters({});
        broadcastLog(`✔ Projected Starters snapshot rebuilt (${snapshot.meta.player_count} players; ${snapshot.meta.human_review_approved_count} approved / ${snapshot.meta.human_review_rejected_count} rejected on file).\n`, 'system');
        const excludedPayload = await getExcludedPlayers();
        const queuePayload = await getHumanReviewQueue();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          restored: restored.map((r) => ({ key: r.key, team: r.team, player_name: r.player_name, position: r.position })),
          skipped,
          count: excludedPayload.count,
          excluded: excludedPayload.excluded,
          queueCount: queuePayload.count,
          queue: queuePayload.queue
        }));
      } catch (err) {
        broadcastLog(`\n✖ Restore excluded player failed: ${err.message}\n`, 'system');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start Server
export function startServer(port = DEFAULT_PORT) {
  serverPort = port;
  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`ℹ️ Server is already active on http://127.0.0.1:${port}`);
        resolve(server);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      console.log(`\n🏈 NFL Operations Mission Control Server running at: http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const portArgIdx = process.argv.indexOf('--port');
  const port = portArgIdx >= 0 ? Number(process.argv[portArgIdx + 1]) : DEFAULT_PORT;
  const shouldOpen = process.argv.includes('--open');

  startServer(port).then(() => {
    if (shouldOpen) {
      openBrowser(`http://127.0.0.1:${port}`, true);
    }
  });
}
