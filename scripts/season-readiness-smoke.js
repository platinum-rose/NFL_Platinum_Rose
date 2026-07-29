#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DEV_BASE = 'http://127.0.0.1:5173/platinum-rose-app';
const DEFAULT_OFFICIAL_BASE = 'http://127.0.0.1:8787';
const DEFAULT_M6_BASE = 'http://127.0.0.1:5060';

const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date();
const stamp = generatedAt.toISOString().replace(/[:.]/g, '-');
const reportDir = path.join(ROOT, '.nfl', 'readiness');
const latestReport = path.join(ROOT, 'docs', 'SEASON_READINESS_SMOKE_TEST_LATEST.md');
const runReport = path.join(reportDir, `season-readiness-${stamp}.md`);
const runJson = path.join(reportDir, `season-readiness-${stamp}.json`);

const checks = [];

function parseArgs(argv) {
  const parsed = {
    devBase: DEFAULT_DEV_BASE,
    officialBase: DEFAULT_OFFICIAL_BASE,
    m6Base: DEFAULT_M6_BASE,
    requireServices: false,
    noWrite: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--require-services') parsed.requireServices = true;
    else if (arg === '--no-write') parsed.noWrite = true;
    else if (arg === '--dev-base') parsed.devBase = argv[++i];
    else if (arg === '--official-base') parsed.officialBase = argv[++i];
    else if (arg === '--m6-base') parsed.m6Base = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Season readiness smoke test

Usage:
  npm.cmd run smoke:season
  npm.cmd run smoke:season -- --require-services
  npm.cmd run smoke:season -- --dev-base http://127.0.0.1:5173/platinum-rose-app

Options:
  --require-services   Treat local dev/M6/official-picks service outages as failures.
  --no-write           Print the report without writing .nfl/readiness or docs output.
  --dev-base URL       Vite dashboard base URL. Default: ${DEFAULT_DEV_BASE}
  --official-base URL  Official picks inbox URL. Default: ${DEFAULT_OFFICIAL_BASE}
  --m6-base URL        M6 podcast service URL. Default: ${DEFAULT_M6_BASE}`);
}

function addCheck(area, name, status, details, evidence = {}) {
  checks.push({ area, name, status, details, evidence });
}

function fail(area, name, details, evidence) {
  addCheck(area, name, 'FAIL', details, evidence);
}

function warn(area, name, details, evidence) {
  addCheck(area, name, 'WARN', details, evidence);
}

function pass(area, name, details, evidence) {
  addCheck(area, name, 'PASS', details, evidence);
}

function info(area, name, details, evidence) {
  addCheck(area, name, 'INFO', details, evidence);
}

async function readJson(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const raw = await readFile(absolutePath, 'utf8');
  return JSON.parse(raw);
}

async function exists(relativePath) {
  try {
    return await stat(path.join(ROOT, relativePath));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function listJsonFiles(relativeDir) {
  try {
    const absoluteDir = path.join(ROOT, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function requestStatusWithTimeout(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const request = client.request(
      parsed,
      { method: 'GET', timeout: timeoutMs },
      (response) => {
        response.resume();
        response.on('end', () => resolve({ status: response.statusCode }));
      },
    );
    request.on('timeout', () => {
      request.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    request.on('error', reject);
    request.end();
  });
}

async function serviceCheck(area, name, url, acceptableStatuses = [200]) {
  try {
    const response = await requestStatusWithTimeout(url);
    const status = acceptableStatuses.includes(response.status) ? 'PASS' : 'FAIL';
    const detail = `${url} returned HTTP ${response.status}.`;
    addCheck(area, name, status, detail, { url, http_status: response.status });
  } catch (err) {
    const status = args.requireServices ? 'FAIL' : 'WARN';
    addCheck(
      area,
      name,
      status,
      `${url} was not reachable (${err.message}).`,
      { url },
    );
  }
}

function runGitStatus() {
  return new Promise((resolve) => {
    execFile('git', ['status', '--short'], { cwd: ROOT, windowsHide: true }, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function checkRepoState() {
  const status = await runGitStatus();
  if (status.error) {
    warn('Repo', 'Git status', `Could not read git status: ${status.error.message}`, { stderr: status.stderr });
    return;
  }
  if (status.stdout) {
    warn('Repo', 'Working tree', 'There are local changes; stage narrowly and avoid sweeping unrelated work.', {
      files: status.stdout.split(/\r?\n/),
    });
  } else {
    pass('Repo', 'Working tree', 'No tracked or untracked changes reported by git status.', {
      stderr: status.stderr || undefined,
    });
  }
}

async function checkPackageScripts() {
  const pkg = await readJson('package.json');
  const requiredScripts = [
    'dev',
    'build',
    'test',
    'official:picks:serve',
    'training-camp:scout',
    'training-camp:scout:live',
    'youtube:agent-intel-summary',
    'futures-report',
    'test:portfolio-corpus',
  ];
  const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);
  if (missing.length) {
    fail('Scripts', 'Season command surface', `Missing expected npm scripts: ${missing.join(', ')}.`, { missing });
  } else {
    pass('Scripts', 'Season command surface', 'Expected build, test, data, official-picks, training-camp, and futures commands are present.');
  }
}

async function checkSchedule() {
  try {
    const schedule = await readJson('public/schedule.json');
    const regular = schedule.filter((game) => game.season === 2026 && game.season_type === 2);
    const weeks = new Set(regular.map((game) => game.week));
    const missingKickoff = regular.filter((game) => !game.kickoff_utc);
    const duplicateIds = findDuplicates(regular.map((game) => game.game_id));
    if (regular.length < 272 || weeks.size < 18 || missingKickoff.length || duplicateIds.length) {
      fail('Local Data', '2026 schedule', 'Schedule is incomplete or malformed.', {
        games: regular.length,
        weeks: weeks.size,
        missing_kickoff: missingKickoff.length,
        duplicate_ids: duplicateIds.slice(0, 5),
      });
    } else {
      pass('Local Data', '2026 schedule', 'Public schedule has 272 regular-season games across 18 weeks with kickoff times.', {
        games: regular.length,
        weeks: weeks.size,
      });
    }
  } catch (err) {
    fail('Local Data', '2026 schedule', `Could not parse public/schedule.json: ${err.message}`);
  }
}

async function checkYoutubeIntel() {
  try {
    const summary = await readJson('public/youtube-futures-agent-intel-summary.json');
    const exported = Number(summary.exported_items ?? 0);
    const badDetLeaks = summary.rejected_leak_checks?.det_division_winner_plus_1500;
    if (badDetLeaks !== 0) {
      fail('Local Data', 'YouTube futures intel', 'Rejected DET division-winner leak check failed.', { badDetLeaks });
      return;
    }
    if (exported < 10) {
      warn('Local Data', 'YouTube futures intel', 'Public intel summary is valid but thin; refresh/review before relying on it for season prep.', {
        exported_items: exported,
        generated_at: summary.generated_at,
      });
      return;
    }
    pass('Local Data', 'YouTube futures intel', 'Public reviewed intel summary is present and leak check is clean.', {
      exported_items: exported,
      generated_at: summary.generated_at,
    });
  } catch (err) {
    fail('Local Data', 'YouTube futures intel', `Could not parse public/youtube-futures-agent-intel-summary.json: ${err.message}`);
  }
}

async function checkFantasyBoard() {
  try {
    const board = await readJson('public/fantasy-value-board.json');
    const playerCount = board.meta?.players ?? board.board?.length ?? 0;
    const noProjection = (board.board || []).filter((row) => row.tier === 'no_projection').length;
    if (playerCount < 150) {
      fail('Local Data', 'Fantasy value board', 'Fantasy board looks incomplete.', { players: playerCount });
      return;
    }
    pass('Local Data', 'Fantasy value board', 'Fantasy board is present with a draftable player pool.', {
      players: playerCount,
      no_projection: noProjection,
      generated_for: board.meta?.date,
    });
  } catch (err) {
    fail('Local Data', 'Fantasy value board', `Could not parse public/fantasy-value-board.json: ${err.message}`);
  }
}

async function checkFuturesPortfolio() {
  const files = await newestFiles('.nfl/portfolio', (name) => name.endsWith('.raw.json'), 1);
  if (!files.length) {
    fail('Futures', 'Latest portfolio report', 'No raw portfolio artifact found in .nfl/portfolio.');
    return;
  }
  const relative = path.join('.nfl', 'portfolio', files[0].name);
  try {
    const raw = await readJson(relative);
    const watchlistCount = raw.meta?.watchlist_count ?? 0;
    const candidates = raw.candidates?.length ?? 0;
    const finalCards = raw.final || raw.candidates || [];
    const validatorFlagged = finalCards.filter((candidate) => {
      if (Array.isArray(candidate.validation)) return candidate.validation.length > 0;
      return (candidate.validation?.violations || []).length > 0 || candidate.validation?.valid === false;
    }).length;
    const killedByValidator = (raw.passed || []).filter((item) => item.stage === 'validator').length;
    if (watchlistCount < 6) {
      fail('Futures', 'Latest portfolio report', 'Latest portfolio artifact does not cover the full human watchlist.', {
        file: relative,
        watchlist_count: watchlistCount,
      });
      return;
    }
    const status = validatorFlagged || killedByValidator ? 'WARN' : 'PASS';
    addCheck(
      'Futures',
      'Latest portfolio report',
      status,
      validatorFlagged || killedByValidator
        ? 'Latest watchlist report exists, but validator flags remain; treat cards as review-only.'
        : 'Latest watchlist report exists with full watchlist coverage and no validator flags.',
      {
        file: relative,
        watchlist_count: watchlistCount,
        candidates,
        final_cards: finalCards.length,
        validator_flagged: validatorFlagged,
        validator_killed: killedByValidator,
      },
    );
  } catch (err) {
    fail('Futures', 'Latest portfolio report', `Could not parse ${relative}: ${err.message}`);
  }
}

async function checkTrainingCamp() {
  const reports = await newestFiles('.nfl/training-camp', (name) => name.endsWith('.md') || name.endsWith('.html'), 4);
  if (!reports.length) {
    warn('Training Camp', 'Local report', 'No local training-camp report found yet.');
  } else {
    pass('Training Camp', 'Local report', 'Training-camp report artifacts exist.', {
      files: reports.map((file) => path.join('.nfl', 'training-camp', file.name)),
    });
  }

  const receipts = await newestFiles('.nfl/receipts', (name) => name.startsWith('training-camp-rss-scout-') && name.endsWith('.json'), 1);
  if (!receipts.length) {
    warn('Training Camp', 'RSS scout receipt', 'No native RSS scout receipt found.');
    return;
  }
  const relative = path.join('.nfl', 'receipts', receipts[0].name);
  try {
    const receipt = await readJson(relative);
    const errors = (receipt.feed_health || []).filter((feed) => feed.status !== 'available');
    const status = receipt.team_count === 32 && errors.length <= 1 ? 'PASS' : 'WARN';
    addCheck(
      'Training Camp',
      'RSS scout receipt',
      status,
      `Latest scout receipt covers ${receipt.team_count || 0} teams, ${receipt.teams_with_intel || 0} with intel, ${errors.length} feed issue(s).`,
      {
        file: relative,
        live: receipt.live,
        written: receipt.written,
        item_count: receipt.item_count,
        feed_issues: errors.map((feed) => `${feed.source}: ${feed.reason || feed.status}`),
      },
    );
  } catch (err) {
    fail('Training Camp', 'RSS scout receipt', `Could not parse ${relative}: ${err.message}`);
  }
}

async function checkOfficialPicks() {
  const files = await listJsonFiles('data/official-picks/proposals/active');
  if (!files.length) {
    warn('Official Picks', 'Active proposal draft', 'No active proposal drafts exist, so approve/reject cannot be end-to-end smoke-tested yet.');
  } else {
    pass('Official Picks', 'Active proposal draft', 'Active proposal drafts exist for approve/reject smoke testing.', { files });
  }

  const migration = await exists('supabase/migrations/044_platinum_rose_ai_official_picks_and_team_profiles.sql');
  if (migration) {
    warn('Official Picks', 'Migration 044', 'Official-picks migration exists locally; live application status still needs confirmation before production use.');
  }
}

async function checkKnownBacklog() {
  const betImport = await readFile(path.join(ROOT, 'src', 'lib', 'betImport.js'), 'utf8');
  const propsTools = await readFile(path.join(ROOT, 'src', 'lib', 'propsTools.js'), 'utf8');
  if (/TODO|DraftKings|FanDuel/i.test(betImport)) {
    warn('Known Gaps', 'Bet-slip parsers', 'DraftKings/FanDuel slip parsing still needs a real implementation or verification.');
  }
  if (/stub|deterministic stub|mock/i.test(propsTools)) {
    warn('Known Gaps', 'Props data source', 'Props tooling still appears to depend on stub/mock data, not a live prop source.');
  }
  info('Known Gaps', 'Human approval guardrail', 'Smoke test does not approve picks, write Supabase, make paid model calls, or mutate open parlays.');
}

async function checkLocalServices() {
  await serviceCheck('Local Services', 'Dashboard dev server', `${args.devBase.replace(/\/$/, '')}/`, [200]);
  await serviceCheck('Local Services', 'Dashboard public schedule asset', `${args.devBase.replace(/\/$/, '')}/schedule.json`, [200]);
  await serviceCheck('Local Services', 'Dashboard YouTube intel asset', `${args.devBase.replace(/\/$/, '')}/youtube-futures-agent-intel-summary.json`, [200]);
  await serviceCheck('Local Services', 'Official picks inbox', `${args.officialBase.replace(/\/$/, '')}/api/inbox`, [200]);
  await serviceCheck('Local Services', 'M6 podcast health', `${args.m6Base.replace(/\/$/, '')}/health`, [200]);
}

async function newestFiles(relativeDir, predicate, limit) {
  try {
    const absoluteDir = path.join(ROOT, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !predicate(entry.name)) continue;
      const fileStat = await stat(path.join(absoluteDir, entry.name));
      files.push({ name: entry.name, mtimeMs: fileStat.mtimeMs });
    }
    return files.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function summarize() {
  const counts = checks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {});
  const verdict = counts.FAIL
    ? 'NOT READY'
    : counts.WARN
      ? 'READY WITH WATCH ITEMS'
      : 'READY';
  return {
    verdict,
    counts: {
      PASS: counts.PASS || 0,
      WARN: counts.WARN || 0,
      FAIL: counts.FAIL || 0,
      INFO: counts.INFO || 0,
    },
  };
}

function renderMarkdown(summary) {
  const grouped = new Map();
  for (const check of checks) {
    if (!grouped.has(check.area)) grouped.set(check.area, []);
    grouped.get(check.area).push(check);
  }

  const lines = [
    '# Season Readiness Smoke Test',
    '',
    `Generated: ${generatedAt.toISOString()}`,
    `Verdict: **${summary.verdict}**`,
    '',
    `Counts: PASS ${summary.counts.PASS} / WARN ${summary.counts.WARN} / FAIL ${summary.counts.FAIL} / INFO ${summary.counts.INFO}`,
    '',
    'Guardrails: local/read-only smoke test only. No paid model calls, Supabase writes, official-pick approvals, report persistence to production, or open-parlay changes.',
    '',
  ];

  for (const [area, areaChecks] of grouped.entries()) {
    lines.push(`## ${area}`, '');
    for (const check of areaChecks) {
      lines.push(`- **${check.status}** ${check.name}: ${check.details}`);
      if (check.evidence && Object.keys(check.evidence).length) {
        lines.push(`  - Evidence: \`${JSON.stringify(check.evidence)}\``);
      }
    }
    lines.push('');
  }

  lines.push('## Recommended Next Actions', '');
  if (summary.counts.FAIL) {
    lines.push('1. Fix FAIL items before treating the dashboard as season-ready.');
  }
  lines.push('1. If local services were WARN because they were not running, restart them and rerun with `npm.cmd run smoke:season -- --require-services`.');
  lines.push('2. Refresh/review YouTube futures intel if the exported item count stays thin.');
  lines.push('3. Create one real official-picks proposal draft and exercise approve/reject through the inbox UI.');
  lines.push('4. Keep props and bet-slip parser work on the pre-kickoff backlog; they are the clearest missing live betting surfaces.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  await checkRepoState();
  await checkPackageScripts();
  await checkSchedule();
  await checkYoutubeIntel();
  await checkFantasyBoard();
  await checkFuturesPortfolio();
  await checkTrainingCamp();
  await checkOfficialPicks();
  await checkKnownBacklog();
  await checkLocalServices();

  const summary = summarize();
  const markdown = renderMarkdown(summary);
  const payload = { generated_at: generatedAt.toISOString(), summary, checks };

  if (!args.noWrite) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(runReport, markdown);
    await writeFile(runJson, `${JSON.stringify(payload, null, 2)}\n`);
    await writeFile(latestReport, markdown);
  }

  console.log(markdown);
  if (!args.noWrite) {
    console.log(`Wrote ${path.relative(ROOT, runReport)}`);
    console.log(`Wrote ${path.relative(ROOT, runJson)}`);
    console.log(`Wrote ${path.relative(ROOT, latestReport)}`);
  }

  if (summary.counts.FAIL) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
