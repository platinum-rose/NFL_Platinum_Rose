#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { teamIdentityValidationBlockers } from '../agents/lib/team-identity.js';
import { validateNamedStatusReview } from '../agents/lib/named-status-review.js';
import {
  FUTURES_EVIDENCE_SCHEMAS,
  validateArticleEvidence,
  validateOddsExecutionArtifact,
  validatePredictionArtifacts,
  validateYoutubeArtifacts,
} from './lib/futures-evidence-gates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, '.nfl', 'source-audit');
const DOCS_LATEST = path.join(ROOT, 'docs', 'NFL_INTEL_SOURCE_AUDIT_LATEST.html');

const SOURCE_GROUPS = [
  'Execution Policy',
  'Futures Odds',
  'Prediction Markets',
  'Futures Portfolio',
  'Expert and Podcast Intel',
  'Web Article Intel',
  'Training Camp',
  'Player Availability',
  'Secondary Matchups',
  'Team Data',
  'Operational Readiness',
];

const INFERENCE_ONLY_MARKETS = new Set([
  'award_mvp',
  'award_offensive_player_of_year',
  'award_defensive_player_of_year',
  'award_offensive_rookie_of_year',
  'award_defensive_rookie_of_year',
  'award_comeback_player_of_year',
  'award_coach_of_year',
]);

const PRIMARY_EXECUTION_BOOKS = ['Bookmaker/BKR', 'BetUS', 'BetOnline'];

function parseArgs(argv) {
  const args = { noWrite: false, strict: false, generatedAt: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--no-write') args.noWrite = true;
    if (arg === '--strict') args.strict = true;
    if (arg === '--generated-at' && argv[index + 1]) {
      args.generatedAt = argv[index + 1];
      index += 1;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(`NFL intelligence source audit

Usage:
  npm.cmd run intel:source-audit
  node scripts/build-intel-source-audit-report.js --no-write
  node scripts/build-intel-source-audit-report.js --no-write --strict

This reads local artifacts only. It does not fetch live odds, call models,
write Supabase, approve picks, or mutate portfolio tickets.

--strict exits nonzero when the frontier evidence gate is blocked.`);
      process.exit(0);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const generatedAt = args.generatedAt ? new Date(args.generatedAt) : new Date();
if (!Number.isFinite(generatedAt.getTime())) throw new Error(`Invalid --generated-at value: ${args.generatedAt}`);
const stamp = generatedAt.toISOString().replace(/[:.]/g, '-');
const outHtml = path.join(REPORT_DIR, `nfl-intel-source-audit-${stamp}.html`);
const outJson = path.join(REPORT_DIR, `nfl-intel-source-audit-${stamp}.json`);

async function exists(relativePath) {
  try {
    return await stat(path.join(ROOT, relativePath));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// 2026-09-03 fix (Andy, trust audit): `fallback !== null` meant a caller
// asking for the most natural default - readJson(path, null) - never got it;
// ENOENT fell through to `throw` instead. Every call site expecting a
// missing-file default of null (e.g. collectRawPrimaryBookOddsExports'
// normalized-BetOnline-JSON lookup) crashed the whole audit run instead of
// reporting "not yet normalized" - which means this audit has been unable to
// complete, and its findings have been unseen, any time a raw BetOnline
// screenshot batch was captured but not yet ingested. Use a real sentinel so
// `undefined`/`null`/anything else all work as an explicit fallback.
const READ_JSON_NO_FALLBACK = Symbol('no-fallback');
async function readJson(relativePath, fallback = READ_JSON_NO_FALLBACK) {
  try {
    const raw = await readFile(path.join(ROOT, relativePath), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (fallback !== READ_JSON_NO_FALLBACK && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function readText(relativePath, fallback = '') {
  try {
    return await readFile(path.join(ROOT, relativePath), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function listFiles(relativeDir, predicate = () => true) {
  try {
    const absoluteDir = path.join(ROOT, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    const out = [];
    for (const entry of entries) {
      if (!entry.isFile() || !predicate(entry.name)) continue;
      const fileStat = await stat(path.join(absoluteDir, entry.name));
      out.push({
        name: entry.name,
        relativePath: path.join(relativeDir, entry.name),
        mtime: fileStat.mtime.toISOString(),
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
      });
    }
    return out.sort((a, b) => b.mtimeMs - a.mtimeMs);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function listProcessedBetOnlineDirs() {
  try {
    const relativeDir = path.join('docs', 'Futures_Odds', '_processed');
    const absoluteDir = path.join(ROOT, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && /^BetOnline_/i.test(entry.name))
      .map((entry) => path.join(relativeDir, entry.name));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function collectOddsSourceFiles(predicate = () => true) {
  const active = await listFiles(
    'docs/Futures_Odds',
    (name) => !name.startsWith('.') && predicate(name),
  );
  const sourceExports = await listFiles(
    path.join('docs', 'Futures_Odds', '_processed', 'source_exports'),
    predicate,
  );
  const betOnlineDirs = await listProcessedBetOnlineDirs();
  const betOnlineFiles = [];
  for (const dir of betOnlineDirs) {
    betOnlineFiles.push(...await listFiles(dir, predicate));
  }
  return [...active, ...sourceExports, ...betOnlineFiles].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function ageHours(iso) {
  if (!iso) return null;
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) return null;
  return Math.round(((generatedAt.getTime() - value) / 3_600_000) * 10) / 10;
}

function dateAgeHours(date) {
  if (!date) return null;
  return ageHours(`${date}T00:00:00Z`);
}

function dateFromFilename(name) {
  return name.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || null;
}

function shortDateFromFilename(name) {
  const match = String(name || '').match(/_(\d{4})(?:[-_.][^.]+)?(?:\.[^.]+)?$/);
  if (!match) return null;
  const mm = match[1].slice(0, 2);
  const dd = match[1].slice(2);
  return `2026-${mm}-${dd}`;
}

function statusBadge(status) {
  const labels = {
    current: 'Current',
    review: 'Review',
    stale: 'Stale',
    blocked: 'Blocked',
    missing: 'Missing',
    context: 'Context',
    inference: 'Inference Only',
  };
  return labels[status] || status;
}

function marketLabel(market) {
  const key = String(market || '');
  const labels = {
    superbowl: 'Super Bowl Winner',
    conference: 'Conference Winner',
    division: 'Division Winner',
    award_mvp: 'MVP',
    award_offensive_player_of_year: 'Offensive Player of the Year',
    award_defensive_player_of_year: 'Defensive Player of the Year',
    award_offensive_rookie_of_year: 'Offensive Rookie of the Year',
    award_defensive_rookie_of_year: 'Defensive Rookie of the Year',
    award_comeback_player_of_year: 'Comeback Player of the Year',
    award_coach_of_year: 'Coach of the Year',
    wins: 'Regular Season Win Total',
    playoffs: 'Make the Playoffs',
    superbowl_matchup: 'Exact Super Bowl Matchup',
    most_wins: 'Most Regular Season Wins',
    least_wins: 'Fewest Regular Season Wins',
  };
  if (labels[key]) return labels[key];
  return key
    .replace(/^award_/, 'award: ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function bookLabel(book) {
  return {
    betus: 'BetUS',
    bookmaker: 'Bookmaker',
    betonline: 'BetOnline',
  }[book] || book;
}

function rowCount(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.rows)) return payload.rows.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  if (Array.isArray(payload?.board)) return payload.board.length;
  if (payload?.teams && typeof payload.teams === 'object') return Object.keys(payload.teams).length;
  return null;
}

function addSource(sources, source) {
  sources.push({
    group: source.group,
    name: source.name,
    status: source.status,
    freshness: source.freshness || '',
    evidence: source.evidence || '',
    action: source.action || '',
    details: source.details || [],
    path: source.path || '',
  });
}

function normalizeOddsText(raw) {
  return String(raw || '')
    .replace(/\r/g, '')
    .replace(/\u00c2\u00bd/g, '.5')
    .replace(/\u00bd/g, '.5')
    .replace(/Detriot/g, 'Detroit')
    .replace(/Seatte/g, 'Seattle');
}

function countBetusRows(text, predicate = () => true) {
  const lines = normalizeOddsText(text).split('\n').map((line) => line.trim()).filter(Boolean);
  const sections = [];
  const headers = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:R?ot|ot)\t/.test(lines[i])) {
      headers.push({ i, text: lines[i].replace(/^(?:R?ot|ot)\t/, '') });
    }
  }

  for (let h = 0; h < headers.length; h++) {
    const end = h + 1 < headers.length ? headers[h + 1].i : lines.length;
    const rows = [];
    for (let i = headers[h].i + 1; i < end; i++) {
      const match = lines[i].match(/^(\d{3,6})\s+(.+?)\s+((?:[+-]\d+)|Ev)\s*$/i);
      if (match) rows.push(match[2].trim());
    }
    if (rows.length && predicate(headers[h])) {
      sections.push({ market: headers[h].text, rows: rows.length });
    }
  }
  return {
    markets: sections.length,
    rows: sections.reduce((sum, section) => sum + section.rows, 0),
  };
}

function analyzeRawOddsExport(file) {
  const text = normalizeOddsText(file.text);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const isBetus = file.name.startsWith('BetUS');
  const isBkr = file.name.startsWith('BKR');
  const details = [];

  if (isBkr) {
    const countHeaders = (patterns) => lines.filter((line) => patterns.some((pattern) => pattern.test(line))).length;
    const bkrDetails = [
      ['Core team futures', countHeaders([/^ODDS TO WIN /, /TO MAKE THE PLAYOFFS$/, /^REGULAR SEASON WINS/])],
      ['Awards', countHeaders([/^REGULAR SEASON MVP$/, /ROOKIE OF THE YEAR$/, /PLAYER OF THE YEAR$/, /^COACH OF THE YEAR$/, /^COMEBACK PLAYER OF THE YEAR$/])],
      ['Season-long player totals', countHeaders([/^TOTAL PASSING /, /^TOTAL RECEIVING /])],
      ['League stat leaders', countHeaders([/^MOST .*REGULAR SEASON/])],
      ['Week 1/game lines', countHeaders([/^GAME LINES - /])],
    ];
    for (const [label, value] of bkrDetails) details.push({ label, value: `${value} market marker(s)` });
    return {
      label: 'Bookmaker/BKR',
      status: 'review',
      evidence: `${lines.length} text lines; includes awards, player season totals, stat leaders, alternate win ladders, and game lines.`,
      action: 'Use as current primary-book market memory. Team futures can be actionable after parsing; awards/player/stat markets are inference inputs for futures and fantasy agents unless explicitly promoted.',
      details,
    };
  }

  if (isBetus) {
    const categories = [
      ['Conference winners', ({ text: market }) => /Conference Winner/.test(market)],
      ['Division winners', ({ text: market }) => /Winner/.test(market) && /(AFC|NFC) (East|North|South|West)/.test(market)],
      ['Super Bowl winner', ({ text: market }) => /Super Bowl LXI Winner/.test(market)],
      ['Exact Super Bowl matchups', ({ text: market }) => /Super Bowl Matchups/.test(market)],
      ['Main win totals', ({ i, text: market }) => i < 573 && /NFL Regular Season Wins/.test(market)],
      ['Make playoffs', ({ text: market }) => /make the playoffs/i.test(market)],
      ['Early team records', ({ text: market }) => /Wins After [45]/.test(market) || /Most Wins After 4 Weeks/.test(market)],
      ['3-week player stat races', ({ text: market }) => /3 Game Record/.test(market)],
      ['Week 1 player milestones', ({ text: market }) => /Player To Record 150\+/.test(market)],
      ['Alternate win ladders', ({ i, text: market }) => i >= 1370 && i < 1689 && /NFL Regular Season Wins/.test(market)],
      ['Conference wild card', ({ text: market }) => /Conference Wild Card/.test(market)],
    ];
    for (const [label, predicate] of categories) {
      const count = countBetusRows(text, predicate);
      if (count.markets) details.push({ label, value: `${count.markets} market(s), ${count.rows} row(s)` });
    }
    return {
      label: 'BetUS',
      status: 'review',
      evidence: `${lines.length} text lines; includes team futures, exact matchups, win ladders, early-season records, short-window player stat races, and Week 1 markets.`,
      action: 'Use as current primary-book market memory. Strong fantasy inference source for early role/volume/ceiling priors; team futures are actionable only after structured parse and normal portfolio gates.',
      details,
    };
  }

  return {
    label: file.name,
    status: 'review',
    evidence: `${lines.length} text lines in raw odds export.`,
    action: 'Classify markets before synthesis.',
    details,
  };
}

function analyzeBetOnlineScreenshotBundle(files) {
  const latestDate = shortDateFromFilename(files[0]?.name) || dateFromFilename(files[0]?.name);
  const latestFiles = latestDate
    ? files.filter((file) => (shortDateFromFilename(file.name) || dateFromFilename(file.name)) === latestDate)
    : files;
  const names = latestFiles.map((file) => file.name);
  const marketChecks = [
    ['Conference winners', /BEO_Conf_/i],
    ['Division winners', /BEO_Div_/i],
    ['Super Bowl winner', /BEO_SB_/i],
    ['Regular season win totals', /BEO_RegWins/i],
    ['Make playoffs', /BEO_MakePlayoffs/i],
  ];
  const details = marketChecks.map(([label, pattern]) => ({
    label,
    value: `${names.filter((name) => pattern.test(name)).length} screenshot(s)`,
  }));

  return {
    latestDate,
    latestFiles,
    details,
    evidence: `${latestFiles.length} dated screenshot(s): ${names.join(', ')}.`,
  };
}

async function latestFuturesReceipt() {
  const receipts = await listFiles(
    '.nfl/receipts',
    (name) => name.startsWith('futures-ingest-') && name.endsWith('.json'),
  );
  return receipts[0] || null;
}

async function collectFuturesOdds(sources) {
  addSource(sources, {
    group: 'Execution Policy',
    name: 'Primary bet-placement books',
    status: 'context',
    freshness: generatedAt.toISOString(),
    evidence: `Primary books: ${PRIMARY_EXECUTION_BOOKS.join(', ')}. Public/Vegas books are market data only unless a major price discrepancy deserves proxy attention.`,
    action: 'Recommendations should be placeable at a primary book. Elevate non-primary prices as Vegas-proxy alerts only when the value is large enough to justify manual action.',
  });

  const receiptFile = await latestFuturesReceipt();
  if (!receiptFile) {
    addSource(sources, {
      group: 'Futures Odds',
      name: 'TheOddsAPI futures ingest',
      status: 'missing',
      evidence: 'No futures-ingest receipt found.',
      action: 'Run ingest-futures before synthesis.',
    });
    return;
  }

  const receipt = await readJson(receiptFile.relativePath);
  const available = receipt.markets?.filter((m) => m.status === 'available') || [];
  const unavailable = receipt.markets?.filter((m) => m.status !== 'available') || [];
  const capturedAge = ageHours(receipt.captured_at);
  addSource(sources, {
    group: 'Futures Odds',
    name: 'TheOddsAPI futures ingest receipt',
    status: unavailable.length ? 'review' : 'current',
    freshness: `${receipt.captured_at || 'unknown'} (${capturedAge ?? '?'}h old)`,
    evidence: `${available.length} available / ${unavailable.length} unavailable markets; ${receipt.total_rows || 0} rows; ${receipt.api_calls || 0} API calls.`,
    action: unavailable.length
      ? 'Use available rows as public market data. For betting recommendations, require a primary-book quote or an explicit Vegas-proxy alert.'
      : 'Eligible as fresh market data; recommendation eligibility still depends on primary-book availability.',
    details: (receipt.markets || []).map((market) => ({
      label: `${marketLabel(market.market)}: ${market.status}`,
      value: market.status === 'available'
        ? `${market.rows} rows from ${market.events} event(s)`
        : `${market.reason || 'unavailable'}; 0 rows`,
    })),
    path: receiptFile.relativePath,
  });

  const awardMarkets = (receipt.markets || []).filter((market) => INFERENCE_ONLY_MARKETS.has(market.market));
  const teamFuturesMarkets = (receipt.markets || []).filter((market) => !INFERENCE_ONLY_MARKETS.has(market.market));
  const freshTeamMarkets = teamFuturesMarkets.filter((market) => market.status === 'available');
  const unavailableTeamMarkets = teamFuturesMarkets.filter((market) => market.status !== 'available');

  addSource(sources, {
    group: 'Futures Odds',
    name: 'Public/API team futures market coverage',
    status: 'review',
    freshness: receipt.captured_at || 'unknown',
    evidence: `${freshTeamMarkets.length} public/API team-futures market(s) refreshed; ${unavailableTeamMarkets.length} unavailable. Fresh public rows are market data, not primary-book execution quotes.`,
    action: 'Use this lane for consensus, broad market shape, and Vegas-proxy alerts only. Actionable recommendations still require BKR, BetUS, or BetOnline prices.',
    details: teamFuturesMarkets.map((market) => ({
      label: `${marketLabel(market.market)}: ${market.status}`,
      value: market.status === 'available'
        ? `${market.rows} rows from ${market.events} event(s)`
        : `${market.reason || 'unavailable'}; not an actionable blocker by itself`,
    })),
    path: receiptFile.relativePath,
  });

  addSource(sources, {
    group: 'Futures Odds',
    name: 'Awards and season-long player futures',
    status: 'inference',
    freshness: 'price excluded from recommendation eligibility',
    evidence: `${awardMarkets.length} award-market endpoint(s) tracked only as inference context. Expert mentions can inform player, coach, team, and narrative strength.`,
    action: 'Exclude awards from betting recommendations. Use only as qualitative inference when expert/podcast sources call out the underlying player or coach thesis.',
    details: awardMarkets.map((market) => ({
      label: `${marketLabel(market.market)}: ${market.status}`,
      value: market.status === 'available'
        ? `${market.rows} rows, retained as inference-only`
        : `${market.reason || 'unavailable'}; price not needed for this exercise`,
    })),
    path: receiptFile.relativePath,
  });
}

async function collectManualFuturesImports(sources) {
  const files = await listFiles('data/futures-imports', (name) => name.endsWith('.json'));
  const bookFiles = files.filter((file) => /^(bookmaker|betus|betonline)-/.test(file.name));
  const rawBetOnlineFiles = await collectOddsSourceFiles(
    (name) => /^BetOnline|^BOL_|^BEO_/i.test(name),
  );
  const rawBetOnlineBundle = rawBetOnlineFiles.length
    ? analyzeBetOnlineScreenshotBundle(rawBetOnlineFiles)
    : null;
  const rawBetOnlineFresh = rawBetOnlineBundle?.latestDate
    ? dateAgeHours(rawBetOnlineBundle.latestDate) <= 48
    : false;
  const latestByBook = new Map();
  for (const file of bookFiles) {
    const book = file.name.split('-')[0];
    if (!latestByBook.has(book)) latestByBook.set(book, file);
  }

  for (const [book, file] of latestByBook.entries()) {
    const payload = await readJson(file.relativePath, []);
    const snapshotDate = dateFromFilename(file.name);
    const rows = rowCount(payload);
    const snapshotAge = dateAgeHours(snapshotDate);
    const fresh = snapshotAge != null && snapshotAge <= 96;
    const currentRawCapture = book === 'betonline' && !fresh && rawBetOnlineFresh;
    addSource(sources, {
      group: 'Futures Odds',
      name: `Manual book export: ${bookLabel(book)}`,
      status: fresh || currentRawCapture ? 'review' : 'stale',
      freshness: `${snapshotDate || file.mtime} file snapshot`,
      evidence: currentRawCapture
        ? `${rows ?? 'unknown'} rows in latest structured file ${file.name}; current raw BetOnline screenshots exist for ${rawBetOnlineBundle.latestDate}.`
        : `${rows ?? 'unknown'} rows in latest local file ${file.name}.`,
      action: currentRawCapture
        ? 'Do not use stale structured BetOnline rows as the current source of truth. Use the July 29 screenshots for manual review or normalize them before final placeable-price recommendations.'
        : fresh
          ? 'Fresh local primary-book rows are normalized and date-tracked. Dry-run ingestion passed; write to futures_odds_snapshots only when ready to promote this snapshot into the database.'
          : 'Refresh before actionable recommendations. This is a primary execution book, so stale rows should not be replaced by public/Vegas market data except as a separate proxy alert.',
      path: file.relativePath,
    });
  }

  const watchlist = files.find((file) => file.name === 'futures-watchlist-2026.json');
  if (watchlist) {
    const payload = await readJson(watchlist.relativePath, {});
    addSource(sources, {
      group: 'Futures Portfolio',
      name: 'Human futures watchlist',
      status: 'context',
      freshness: payload.updated_at || watchlist.mtime,
      evidence: `${payload.items?.length || 0} watchlist targets, including Bills/Packers anchors and supplemental targets.`,
      action: 'Every target must be recommend, watch with trigger, or pass with reason during synthesis.',
      path: watchlist.relativePath,
    });
  }

  const ledger = files.find((file) => file.name === 'andy-portfolio-ledger-2026.json');
  if (ledger) {
    const payload = await readJson(ledger.relativePath, {});
    addSource(sources, {
      group: 'Futures Portfolio',
      name: 'Portfolio ledger and open exposure',
      status: 'context',
      freshness: payload.as_of || ledger.mtime,
      evidence: `${payload.positions?.length || 0} positions plus ${payload.open_parlays?.length || 0} open parlay records.`,
      action: 'Use for exposure and hedge context only; do not mutate without explicit approval.',
      path: ledger.relativePath,
    });
  }

  const executionValidationPath = 'data/futures-imports/odds-execution-validation-latest.json';
  const executionValidationStat = await exists(executionValidationPath);
  if (!executionValidationStat) {
    addSource(sources, {
      group: 'Futures Odds',
      name: 'Local odds execution integrity gate',
      status: 'missing',
      evidence: 'No local odds execution-validation artifact exists.',
      action: 'Run `npm.cmd run futures:odds-execution-validation` before synthesis-context validation.',
      path: executionValidationPath,
    });
  } else {
    const executionValidation = await readJson(executionValidationPath, {});
    const validation = validateOddsExecutionArtifact(executionValidation);
    addSource(sources, {
      group: 'Futures Odds',
      name: 'Local odds execution integrity gate',
      status: validation.status === 'blocked' ? 'blocked' : 'review',
      freshness: executionValidation.meta?.generated_at || executionValidationStat.mtime.toISOString(),
      evidence: `${executionValidation.meta?.rows_total || 0} row(s) checked; execution-reference eligible=${executionValidation.meta?.execution_reference_eligible_rows || 0}; exacta execution claims allowed=${executionValidation.meta?.exacta_execution_claim_allowed_pairs || 0}; blockers=${validation.blockers.length}${validation.blockers.length ? ` (${validation.blockers.join('; ')})` : ''}.`,
      action: validation.status === 'blocked'
        ? 'Do not use local odds as execution-reference context until placeability, timestamp, price, and exacta gates pass.'
        : 'Use eligible local rows as execution-reference context only; exacta rows remain monitor-only until their separate multi-book gate passes.',
      path: executionValidationPath,
    });
  }
}

async function collectPredictionMarketMap(sources) {
  const rawPath = 'data/prediction-markets/latest.json';
  const mapPath = 'data/prediction-markets/team-market-map-latest.json';
  const coherencePath = 'data/prediction-markets/cross-market-coherence-latest.json';
  const rawStat = await exists(rawPath);
  if (rawStat) {
    const raw = await readJson(rawPath, {});
    addSource(sources, {
      group: 'Prediction Markets',
      name: 'Raw prediction-market snapshot',
      status: 'context',
      freshness: raw.meta?.generated_at || rawStat.mtime.toISOString(),
      evidence: `${raw.meta?.contract_count || 0} contract(s); Kalshi=${raw.meta?.kalshi_count || 0}; Polymarket=${raw.meta?.polymarket_count || 0}.`,
      action: 'Use only as consensus context after contract mapping. Do not treat as sportsbook execution pricing.',
      path: rawPath,
    });
  }

  const mapStat = await exists(mapPath);
  const coherenceStat = await exists(coherencePath);
  if (!mapStat || !coherenceStat) {
    const missing = [
      ...(!mapStat ? [mapPath] : []),
      ...(!coherenceStat ? [coherencePath] : []),
    ];
    addSource(sources, {
      group: 'Prediction Markets',
      name: 'Prediction-market mapping/coherence integrity gate',
      status: 'missing',
      evidence: `Missing required prediction artifact(s): ${missing.join(', ')}.`,
      action: 'Rebuild the v2 prediction-market map and coherence artifacts before using prediction context.',
      path: missing[0],
    });
    return;
  }

  const predictionMap = await readJson(mapPath, {});
  const coherence = await readJson(coherencePath, {});
  const validation = validatePredictionArtifacts({ predictionMap, coherence }, { season: 2026 });
  const generated = coherence.meta?.generated_at || coherenceStat.mtime.toISOString();
  const hoursOld = ageHours(generated);
  const stale = hoursOld !== null && hoursOld > 72;
  addSource(sources, {
    group: 'Prediction Markets',
    name: 'Prediction-market mapping/coherence integrity gate',
    status: validation.status === 'blocked' ? 'blocked' : (stale ? 'stale' : 'review'),
    freshness: `${generated} (${hoursOld ?? '?'}h old)`,
    evidence: `${predictionMap.meta?.mapped_count || 0} mapped / ${predictionMap.meta?.unmapped_count || 0} excluded contract(s); actionable coherence=${coherence.meta?.actionable_contract_count ?? 'unknown'}; context-only=${coherence.meta?.context_only_contract_count ?? 'unknown'}; liquidity warnings=${predictionMap.meta?.liquidity_warning_count || 0}; blockers=${validation.blockers.length}${validation.blockers.length ? ` (${validation.blockers.join('; ')})` : ''}.`,
    action: validation.status === 'blocked'
      ? 'Do not use prediction-market context. Rebuild the v2 map/coherence pair and resolve every mapping, season, identity, eligibility, or lineage blocker.'
      : 'Use only as consensus/coherence context. Liquidity-warned rows remain outside actionable math and settlement terms remain unverified.',
    details: [
      { label: 'Map validation', value: `${validation.validations ? 'composite' : validation.status}; schema=${predictionMap.meta?.schema || 'missing'}; generated=${predictionMap.meta?.generated_at || 'missing'}` },
      { label: 'Coherence lineage', value: `source schema=${coherence.meta?.source_schema || 'missing'}; source generated=${coherence.meta?.source_generated_at || 'missing'}; current map generated=${predictionMap.meta?.generated_at || 'missing'}` },
    ],
    path: mapPath,
  });
}

async function collectRawPrimaryBookOddsExports(sources) {
  const files = await collectOddsSourceFiles(
    (name) => !name.startsWith('.') && !name.includes('_processed'),
  );
  const groups = [
    { key: 'BKR', label: 'Bookmaker/BKR', test: (name) => /^BKR_/i.test(name) },
    { key: 'BetUS', label: 'BetUS', test: (name) => /^BetUS_/i.test(name) },
    { key: 'BetOnline', label: 'BetOnline', test: (name) => /^BetOnline|^BOL_|^BEO_/i.test(name) },
  ];

  for (const group of groups) {
    const candidates = files.filter((candidate) => group.test(candidate.name));
    const file = candidates[0];
    if (!file) {
      addSource(sources, {
        group: 'Futures Odds',
        name: `Raw current sportsbook export: ${group.label}`,
        status: 'stale',
        freshness: 'not found in docs/Futures_Odds',
        evidence: 'No current raw export found for this primary book.',
        action: 'Gather/export this book before final portfolio synthesis so primary-book prices and inference markets are complete.',
      });
      continue;
    }

    if (group.key === 'BetOnline' && candidates.some((candidate) => /\.(png|jpe?g)$/i.test(candidate.name))) {
      const bundle = analyzeBetOnlineScreenshotBundle(candidates);
      const normalizedPath = bundle.latestDate
        ? `data/futures-imports/betonline-${bundle.latestDate}.json`
        : null;
      const normalizedPayload = normalizedPath ? await readJson(normalizedPath, null) : null;
      const normalizedRows = rowCount(normalizedPayload);
      const hasNormalizedBundle = normalizedRows != null && normalizedRows > 0;
      const hasPlayoffScreenshots = bundle.details.some((detail) => (
        detail.label === 'Make playoffs' && !String(detail.value).startsWith('0 ')
      ));
      addSource(sources, {
        group: 'Futures Odds',
        name: 'Raw current sportsbook export: BetOnline',
        status: 'review',
        freshness: `${bundle.latestDate || file.mtime} screenshot snapshot`,
        evidence: hasNormalizedBundle
          ? `${bundle.evidence} Matching normalized import ${path.basename(normalizedPath)} has ${normalizedRows} rows.`
          : bundle.evidence,
        action: hasNormalizedBundle
          ? `Screenshots are captured, date-identifiable, and normalized into ${normalizedPath}. Use the normalized JSON for exact listed-market prices.${hasPlayoffScreenshots ? ' Use the manual review doc for playoff No-side values.' : ' Make-playoffs rows were not present in the latest captured BetOnline screenshot bundle.'}`
          : 'Screenshots are captured and date-identifiable, but structured values are not yet parsed into futures_odds_snapshots. Normalize this bundle into betonline-2026-07-29 rows before line-movement comparison or actionable use.',
        details: bundle.details,
        path: hasNormalizedBundle ? normalizedPath : bundle.latestFiles[0]?.relativePath || file.relativePath,
      });
      continue;
    }

    const text = await readText(file.relativePath);
    const analysis = analyzeRawOddsExport({ name: file.name, text });
    const snapshotDate = dateFromFilename(file.name);
    addSource(sources, {
      group: 'Futures Odds',
      name: `Raw current sportsbook export: ${analysis.label}`,
      status: analysis.status,
      freshness: `${snapshotDate || file.mtime} raw text snapshot`,
      evidence: `${file.name}: ${analysis.evidence}`,
      action: analysis.action,
      details: analysis.details,
      path: file.relativePath,
    });
  }
}

async function collectPortfolioArtifacts(sources) {
  const files = await listFiles('.nfl/portfolio', (name) => name.endsWith('.raw.json'));
  const latest = files[0];
  if (!latest) {
    addSource(sources, {
      group: 'Futures Portfolio',
      name: 'Latest portfolio synthesis artifact',
      status: 'missing',
      evidence: 'No .raw.json portfolio artifact found.',
      action: 'Build a dossier/report only after freshness gates are resolved.',
    });
    return;
  }
  const payload = await readJson(latest.relativePath, {});
  const candidates = payload.candidates?.length || 0;
  const finalCards = payload.final?.length || 0;
  const passed = payload.passed?.length || 0;
  const killed = payload.killed?.length || 0;
  const invalidated = payload.invalidated?.length || 0;
  const validatorFlags = (payload.final || []).filter((candidate) => {
    const violations = candidate.validation?.violations || candidate.validation || [];
    return Array.isArray(violations) ? violations.length : candidate.validation?.valid === false;
  }).length;
  addSource(sources, {
    group: 'Futures Portfolio',
    name: 'Latest local portfolio report',
    status: validatorFlags || invalidated ? 'review' : 'context',
    freshness: latest.mtime,
    evidence: `${candidates} candidates, ${finalCards} final cards, ${passed} passed, ${killed} killed, ${invalidated} invalidated.`,
    action: validatorFlags || invalidated
      ? 'Treat as review-only; do not promote until stale/unavailable markets are resolved.'
      : 'Use as prior context, then rebuild after source refresh.',
    path: latest.relativePath,
  });
}

async function collectYoutubeIntel(sources) {
  const reviewPath = 'data/shadow-harness/reports/youtube-futures-intel-review-latest.json';
  const summaryPath = 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json';
  const statusPath = 'data/shadow-harness/review/youtube-futures-intel-review-status.json';
  const queuePath = 'data/shadow-harness/review/youtube-futures-local-intel-queue.json';
  const freshnessPath = 'data/shadow-harness/review/podcast-youtube-freshness-latest.json';
  const required = [reviewPath, statusPath, queuePath, summaryPath, freshnessPath];
  const stats = await Promise.all(required.map((file) => exists(file)));
  const missing = required.filter((file, index) => !stats[index]);
  if (missing.length > 0) {
    addSource(sources, {
      group: 'Expert and Podcast Intel',
      name: 'YouTube reviewed-cohort integrity gate',
      status: 'missing',
      evidence: `Missing required YouTube artifact(s): ${missing.join(', ')}.`,
      action: 'Rebuild review status, queue, summary, and freshness artifacts before synthesis.',
      path: missing[0],
    });
    return;
  }
  const [reviewReport, status, queue, summary, freshness] = await Promise.all(
    required.map((file) => readJson(file, {})),
  );
  const validation = validateYoutubeArtifacts({ reviewReport, status, queue, summary, freshness });
  const reviewRecords = Object.values(status.items || status.decisions || status || {})
    .filter((record) => record && typeof record === 'object');
  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'YouTube reviewed-cohort integrity gate',
    status: validation.status === 'blocked' ? 'blocked' : 'current',
    freshness: `${summary.generated_at || stats[3].mtime.toISOString()} (${ageHours(summary.generated_at || stats[3].mtime.toISOString())}h old)`,
    evidence: `${summary.exported_items || 0} promoted/exported items; ${reviewRecords.length} review records; shared fingerprints=${validation.metrics.fingerprint_count}; forbidden accepted evidence=${validation.metrics.forbidden_accepted_evidence_count}; blockers=${validation.blockers.length}${validation.blockers.length ? ` (${validation.blockers.join('; ')})` : ''}.`,
    action: validation.status === 'blocked'
      ? 'Do not use accepted YouTube evidence. Rebuild every downstream artifact on one clean cohort fingerprint and remove forbidden episode evidence.'
      : 'Use the accepted 43-item cohort as source-stamped research context only, not betting authority.',
    path: summaryPath,
  });

  const generated = freshness.meta?.generated_at || stats[4].mtime.toISOString();
  const hoursOld = ageHours(generated);
  const candidates = freshness.youtube?.candidates || {};
  const reviewStatus = freshness.youtube?.review_status || {};
  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'Podcast/YouTube July 24-30 freshness reconciliation',
    status: 'review',
    freshness: `${generated} (${hoursOld ?? '?'}h old)`,
    evidence: `${freshness.youtube?.accepted?.exported_items || 0} accepted YouTube local-intel pick(s); ${reviewStatus.review_only_count || 0} pending/needs-review row(s) remain excluded; ${candidates.window_candidate_count || 0} YouTube candidate(s) and ${freshness.podcast?.window_episode_count || 0} podcast deep dive(s) dated ${freshness.meta?.window_start || 'window start'}-${freshness.meta?.window_end || 'window end'}.`,
    action: 'Use accepted rows as research context only. Do not promote pending/needs-review rows.',
    path: freshnessPath,
  });
}

async function collectExpertDossiers(sources) {
  const indexPath = 'data/expert-dossiers/latest.json';
  const indexStat = await exists(indexPath);
  if (!indexStat) {
    addSource(sources, {
      group: 'Expert and Podcast Intel',
      name: 'Expert dossiers',
      status: 'missing',
      evidence: 'No local expert-dossier index found.',
      action: 'Run `npm.cmd run expert-dossiers:build` before synthesis if analyst-prior/bias context should be available to the LLM.',
      path: indexPath,
    });
    return;
  }

  const index = await readJson(indexPath, {});
  const dossiers = Array.isArray(index.dossiers) ? index.dossiers : [];
  const recoverySignals = dossiers.reduce(
    (sum, dossier) => sum + Number(dossier.source_coverage?.local_recovery_signal_count || 0),
    0,
  );
  const contextOnlySignals = dossiers.reduce(
    (sum, dossier) => sum + Number(dossier.source_coverage?.local_recovery_context_only_count || 0),
    0,
  );
  const missingFiles = [];
  for (const dossier of dossiers) {
    if (dossier.path && !(await exists(dossier.path))) missingFiles.push(dossier);
  }

  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'Expert dossiers',
    status: missingFiles.length ? 'review' : 'context',
    freshness: `${index.generated_at || indexStat.mtime.toISOString()} (${ageHours(index.generated_at || indexStat.mtime.toISOString()) ?? '?'}h old)`,
    evidence: `${index.dossier_count || dossiers.length} expert dossier(s); ${recoverySignals} local-recovery signal(s); ${contextOnlySignals} context-only signal(s); missing dossier files=${missingFiles.length}.`,
    action: missingFiles.length
      ? 'Rebuild expert dossiers before synthesis. Use available rows only as analyst-prior/bias context; never as price evidence or official-pick support.'
      : 'Use only as compact analyst-prior/bias context for named experts. Do not treat local recovery signals as accepted picks or clean transcript evidence.',
    details: dossiers.map((dossier) => ({
      label: dossier.expert || dossier.slug || 'Unknown expert',
      value: `${dossier.source_coverage?.host_citation_count || 0} host citation(s); ${dossier.source_coverage?.local_recovery_signal_count || 0} recovery signal(s); ${dossier.source_coverage?.local_recovery_context_only_count || 0} context-only signal(s)`,
    })),
    path: indexPath,
  });
}

async function collectPodcastIntel(sources) {
  const stores = [
    ['data/podcasts/m6-diarized', 'Primary M6 diarized store'],
    ['data/podcasts/m6-diarized-all', 'All-export M6 diarized store'],
  ];
  for (const [dir, label] of stores) {
    const manifestPath = path.join(dir, 'manifest.json');
    const manifestStat = await exists(manifestPath);
    if (!manifestStat) continue;
    const manifest = await readJson(manifestPath, []);
    const latestEpisode = manifest[0];
    addSource(sources, {
      group: 'Expert and Podcast Intel',
      name: label,
      status: latestEpisode?.pub_date && new Date(latestEpisode.pub_date) >= new Date('2026-07-21T00:00:00Z')
        ? 'review'
        : 'stale',
      freshness: latestEpisode?.pub_date || manifestStat.mtime.toISOString(),
      evidence: `${manifest.length} manifest episodes; latest: ${latestEpisode?.title || 'unknown'}.`,
      action: 'Run podcast sweep/export if any target shows published after this latest episode date.',
      path: manifestPath,
    });
  }

  const narrative = await readJson('docs/podcast-narratives/index.json', []);
  const deepDive = await readJson('docs/podcast-transcript-deep-dives/index.json', []);
  const narrativeCount = Array.isArray(narrative) ? narrative.length : narrative.episodes?.length || 0;
  const deepDiveCount = Array.isArray(deepDive) ? deepDive.length : deepDive.episodes?.length || deepDive.count || 0;
  const generated = deepDive.generated_at || narrative.generated_at || null;
  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'Generated podcast narratives and deep dives',
    status: 'review',
    freshness: generated ? `${generated} generated` : 'generated docs present',
    evidence: `${narrativeCount} narratives; ${deepDiveCount} deep dives.`,
    action: 'Good for review, but regenerate after any new podcast ingestion before final synthesis.',
    path: 'docs/podcast-transcript-deep-dives/index.html',
  });
}

async function collectResearchArticleIntel(sources) {
  const receipts = await listFiles(
    '.nfl/receipts',
    (name) => name.startsWith('research-intel-ingest-') && name.endsWith('.json'),
  );

  if (!receipts[0]) {
    addSource(sources, {
      group: 'Web Article Intel',
      name: 'Research/article RSS ingest',
      status: 'missing',
      evidence: 'No research-intel ingest receipt found.',
      action: 'Run ingest-research-intel:dry for source health, then run live only with explicit approval because it writes research notes/signals to Supabase.',
    });
    return;
  }

  let receiptFile = receipts[0];
  let receipt = await readJson(receiptFile.relativePath, {});
  for (const candidate of receipts) {
    const candidateReceipt = await readJson(candidate.relativePath, {});
    if (candidateReceipt.dry_run === false) {
      receiptFile = candidate;
      receipt = candidateReceipt;
      break;
    }
  }
  const feedRows = Array.isArray(receipt.feeds) ? receipt.feeds : [];
  const feedIssues = feedRows.filter((feed) => feed.status !== 'available');
  const candidateNotes = receipt.totals?.candidate_notes || 0;
  const insertedNotes = receipt.totals?.inserted_notes;
  const receiptFreshness = receipt.completed_at || receipts[0].mtime;
  const hoursOld = ageHours(receiptFreshness);
  const stale = hoursOld !== null && hoursOld > 72;

  addSource(sources, {
    group: 'Web Article Intel',
    name: 'Research/article RSS ingest',
    status: feedIssues.length || stale ? 'review' : 'current',
    freshness: `${receiptFreshness} (${hoursOld ?? '?'}h old)`,
    evidence: `${feedRows.length} configured feeds; ${candidateNotes} NFL candidate article notes${Number.isFinite(insertedNotes) ? `; ${insertedNotes} inserted notes` : '; dry-run/no DB writes'}; feed issues=${feedIssues.length}.`,
    action: receipt.dry_run
      ? 'Dry-run only: good for source health, but live ingestion into research_intel_notes requires explicit approval before synthesis.'
      : 'Review new notes/signals in Supabase/vault context before synthesis.',
    details: feedRows.map((feed) => ({
      label: `${feed.source}: ${feed.status}`,
      value: `${feed.nfl_items || 0} NFL items from ${feed.fetched_items || 0} fetched; notes=${feed.candidate_notes || 0}; signals=${feed.candidate_signals || 0}${feed.reason ? `; ${feed.reason}` : ''}`,
    })),
    path: receiptFile.relativePath,
  });

  const articleReviewPath = 'data/research-intel/review/article-intel-review-latest.json';
  const articleReview = await readJson(articleReviewPath, null);
  if (!articleReview) {
    addSource(sources, {
      group: 'Web Article Intel',
      name: 'Article evidence integrity review',
      status: 'missing',
      freshness: 'missing',
      evidence: 'The article evidence review artifact is missing.',
      action: 'Build the complete article corpus and resolve every pick-oriented record before frontier synthesis.',
      path: articleReviewPath,
    });
  } else {
    const generated = articleReview.generated_at || '';
    const summary = articleReview.summary || {};
    const actualPicks = articleReview.summary?.actual_picks || 0;
    const marketLeads = articleReview.summary?.market_leads ?? articleReview.summary?.pick_leads ?? 0;
    const validation = validateArticleEvidence(articleReview);
    addSource(sources, {
      group: 'Web Article Intel',
      name: 'Article evidence integrity review',
      status: validation.status === 'blocked' ? 'blocked' : 'review',
      freshness: generated ? `${generated} (${ageHours(generated) ?? '?'}h old)` : 'unknown',
      evidence: `${summary.article_records_assessed ?? summary.articles_reviewed ?? 0} article record(s) assessed; ${summary.explicit_analyst_selection_mentions ?? 'unknown'} explicit selection mention(s); ${actualPicks} execution-usable actual pick candidate(s); ${marketLeads} market/inference lead(s); integrity blockers=${validation.blockers.length}${validation.blockers.length ? ` (${validation.blockers.join('; ')})` : ''}.`,
      action: validation.status === 'blocked'
        ? 'Do not run frontier synthesis. Rebuild the complete article corpus with schema v2, resolve every pick-oriented record, and rerun this audit.'
        : 'Use execution-usable actual-pick candidates for human review; keep selections missing price/venue and all inference leads out of actionable evidence.',
      details: (articleReview.sources || []).map((source) => ({
        label: source.source,
        value: `${source.articles} record(s); ${source.explicit_analyst_selections ?? 'unknown'} explicit selection(s); ${source.actual_picks || 0} execution-usable pick(s); ${source.market_leads ?? source.pick_leads ?? 0} market/inference lead(s); ${source.analysis_notes} contextual note(s)`,
      })),
      path: 'docs/article-intel-review/article-intel-review-latest.html',
    });
  }

  const configuredSources = new Set(feedRows.map((feed) => String(feed.source || '').toLowerCase()));
  const expectedSources = [
    'Action Network',
    'BettingPros',
    'Walter Football',
    'ESPN NFL',
    'VSiN',
    'Sharp Football',
    'Pro Football Talk',
    'PFF',
    'Rotowire NFL',
    'Football Outsiders',
  ];
  const missingExpected = expectedSources.filter((source) => !configuredSources.has(source.toLowerCase()));

  if (missingExpected.length) {
    addSource(sources, {
      group: 'Web Article Intel',
      name: 'Expected article source coverage gaps',
      status: 'missing',
      freshness: receiptFreshness,
      evidence: `${missingExpected.length} expected article source(s) are not present in the latest research ingest receipt: ${missingExpected.join(', ')}.`,
      action: 'Wire missing feeds before treating web-article coverage as complete.',
      path: receipts[0].relativePath,
    });
  }
}

async function collectTrainingCamp(sources) {
  const snapshotPath = 'data/training-camp/2026/latest.json';
  const recoveryPath = 'data/training-camp/2026/recovered/training-camp-intel-2026-07-30-0346-verified.json';
  const snapshotStat = await exists(snapshotPath);
  const recoveryStat = await exists(recoveryPath);
  const recoverySnapshot = recoveryStat ? await readJson(recoveryPath, {}) : null;
  const hasRecoveredSnapshot = (recoverySnapshot?.meta?.item_count || 0) > 0;
  let currentSnapshot = null;
  const recoveredAction = hasRecoveredSnapshot
    ? `Restore ${recoveryPath} into latest.json and the July 30 timestamped snapshot, or approve a fresh live RSS scout.`
    : 'Collect/manual-paste or persist RSS scout results first.';
  const recoveredDetails = hasRecoveredSnapshot
    ? [{
      label: 'Recovered verified snapshot',
      value: `${recoverySnapshot.meta.generated_at}; ${recoverySnapshot.meta.item_count} items across ${recoverySnapshot.meta.teams_with_intel} teams; path ${recoveryPath}`,
    }]
    : [];
  if (!snapshotStat) {
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp local snapshot',
      status: 'missing',
      evidence: 'No latest training-camp snapshot found.',
      action: hasRecoveredSnapshot
        ? recoveredAction
        : 'Build manual/RSS training-camp snapshot before synthesis.',
      details: recoveredDetails,
    });
  } else {
    const snapshot = await readJson(snapshotPath, {});
    currentSnapshot = snapshot;
    const identity = snapshot.meta?.team_identity_validation;
    const identityBlockers = teamIdentityValidationBlockers(identity);
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp local snapshot',
      status: identityBlockers.length ? 'blocked' : (snapshot.meta?.item_count > 0 ? 'review' : 'stale'),
      freshness: snapshot.meta?.generated_at || snapshotStat.mtime.toISOString(),
      evidence: `${snapshot.meta?.team_count || 0} teams; ${snapshot.meta?.teams_with_intel || 0} teams with manual intel; ${snapshot.meta?.item_count || 0} items; unique evidence=${snapshot.meta?.unique_evidence_count ?? 'unknown'}; corrected legacy source assignments=${identity?.corrected_source_assignment_count ?? 'unknown'}; identity blockers=${identityBlockers.length}${identityBlockers.length ? ` (${identityBlockers.join('; ')})` : ''}.`,
      action: identityBlockers.length
        ? 'Do not use team aggregates in frontier synthesis. Normalize ownership/deduplication, regenerate the artifact, and rerun this audit.'
        : snapshot.meta?.item_count > 0
          ? 'Review/highlight before synthesis.'
        : `This is an all-32 empty placeholder. ${recoveredAction}`,
      details: snapshot.meta?.item_count > 0 ? [] : recoveredDetails,
      path: snapshotPath,
    });
  }

  const receipts = await listFiles(
    '.nfl/receipts',
    (name) => name.startsWith('training-camp-rss-scout-') && name.endsWith('.json'),
  );
  if (receipts[0]) {
    const receipt = await readJson(receipts[0].relativePath, {});
    const issues = (receipt.feed_health || []).filter((feed) => feed.status !== 'available');
    const identityNormalized = currentSnapshot?.meta?.team_identity_validation?.status === 'pass';
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp RSS scout',
      status: identityNormalized ? 'context' : (receipt.written ? 'review' : 'stale'),
      freshness: receipt.generated_at || receipts[0].mtime,
      evidence: identityNormalized
        ? `Historical pre-normalization receipt: ${receipt.item_count || 0} rows across ${receipt.teams_with_intel || 0} assigned teams; current normalized snapshot has ${currentSnapshot.meta.item_count} unique evidence items across ${currentSnapshot.meta.teams_with_intel} primary teams; feed issues=${issues.length}.`
        : `${receipt.item_count || 0} live-feed items across ${receipt.teams_with_intel || 0} teams; written=${receipt.written}; feed issues=${issues.length}.`,
      action: identityNormalized
        ? 'Use this receipt for collection/feed-health provenance only. Use the normalized snapshot, never the historical kept-row counts, for evidence aggregates.'
        : receipt.written
          ? 'Review merged output.'
        : 'Last run was a dry-run receipt. Persist or manually review before synthesis.',
      details: (receipt.feed_health || []).map((feed) => ({
        label: feed.source,
        value: `${feed.status}; fetched ${feed.fetched_items}; kept ${feed.kept_items}${feed.reason ? `; ${feed.reason}` : ''}`,
      })),
      path: receipts[0].relativePath,
    });
  }

  const coveragePath = 'data/training-camp/2026/coverage-fill-latest.json';
  const coverageStat = await exists(coveragePath);
  if (!coverageStat) {
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp all-32 coverage fill',
      status: 'missing',
      evidence: 'No local all-32 training-camp coverage-fill report found.',
      action: 'Run `npm.cmd run training-camp:coverage-fill` before frontier futures synthesis so camp, article, and availability gaps are explicit.',
      path: coveragePath,
    });
  } else {
    const coverage = await readJson(coveragePath, {});
    const generated = coverage.meta?.generated_at || coverageStat.mtime.toISOString();
    const hoursOld = ageHours(generated);
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp all-32 coverage fill',
      status: (coverage.meta?.teams_with_any_local_context || 0) === 32 ? 'review' : 'missing',
      freshness: `${generated} (${hoursOld ?? '?'}h old)`,
      evidence: `${coverage.meta?.teams_with_any_local_context || 0}/32 teams have local camp/article/availability context; canonical camp-source still needed for ${coverage.meta?.teams_needing_manual_camp_source ?? 'unknown'} team(s).`,
      action: 'Use this as a review queue only. Availability-only rows still need source-stamped camp/manual confirmation before being promoted into canonical training-camp intel.',
      path: coveragePath,
    });
  }
}

async function collectPlayerAvailability(sources) {
  const startersPath = 'data/projected-starters/2026/latest.json';
  const startersStat = await exists(startersPath);
  if (!startersStat) {
    addSource(sources, {
      group: 'Player Availability',
      name: 'Projected starters evidence layer',
      status: 'missing',
      evidence: 'No local projected/likely-starters snapshot found.',
      action: 'Run `npm.cmd run projected-starters` before the frontier packet so availability can be tied to player importance. Estimated-only output is acceptable as research context, but manual depth-chart coverage should stay explicit.',
      path: startersPath,
    });
  } else {
    const starters = await readJson(startersPath, {});
    const generated = starters.meta?.generated_at || startersStat.mtime.toISOString();
    const hoursOld = ageHours(generated);
    const stale = hoursOld !== null && hoursOld > 168;
    const namedValidation = starters.meta?.named_status_review_validation;
    const namedBlocked = namedValidation?.status !== 'pass';
    addSource(sources, {
      group: 'Player Availability',
      name: 'Projected starters evidence layer',
      status: namedBlocked ? 'blocked' : (stale ? 'stale' : 'review'),
      freshness: `${generated} (${hoursOld ?? '?'}h old)`,
      evidence: `${starters.meta?.player_count || 0} player signal(s); ${starters.meta?.teams_with_signals || 0} teams with signals; manual rows=${starters.meta?.manual_row_count || 0}; estimated rows=${starters.meta?.estimated_row_count || 0}; teams needing manual depth chart=${starters.meta?.teams_needing_manual_depth_chart ?? 'unknown'}; named-review validation=${namedValidation?.status || 'missing'}.`,
      action: namedBlocked
        ? 'Do not use the projected-starters layer until the required named-case review contract passes.'
        : 'Use as player-importance research context only. Manual all-position depth charts remain the next coverage fill step; estimated starter language must not be treated as final source of truth.',
      path: startersPath,
    });
  }

  const namedReviewPath = 'data/projected-starters/2026/named-status-review.json';
  const namedReviewStat = await exists(namedReviewPath);
  if (!namedReviewStat) {
    addSource(sources, {
      group: 'Player Availability',
      name: 'Bills/Packers named status review gate',
      status: 'blocked',
      evidence: 'The required Connor McGovern and Micah Parsons review ledger is missing.',
      action: 'Record each named case as confirmed with a human-verified source or explicitly withheld before synthesis.',
      path: namedReviewPath,
    });
  } else {
    const namedReview = await readJson(namedReviewPath, {});
    const namedValidation = validateNamedStatusReview(namedReview);
    const cases = namedReview.cases || [];
    const unresolved = cases.filter((item) => item.eligible_for_synthesis !== true);
    addSource(sources, {
      group: 'Player Availability',
      name: 'Bills/Packers named status review gate',
      status: namedValidation?.status === 'pass' ? 'review' : 'blocked',
      freshness: namedReview.meta?.reviewed_at || namedReviewStat.mtime.toISOString(),
      evidence: `${cases.length} required named case(s) recorded; confirmed=${cases.filter((item) => item.review_status === 'confirmed_current').length}; withheld/conflicted=${unresolved.length}; validation=${namedValidation?.status || 'missing'}.`,
      action: unresolved.length
        ? 'Keep Connor McGovern and Micah Parsons out of confirmed starter/availability synthesis until the missing human source checks are completed.'
        : 'Use only the confirmed, source-stamped dispositions recorded in the ledger.',
      details: cases.map((item) => ({
        label: `${item.expected_team} ${item.player_name}`,
        value: `${item.review_status}; synthesis eligible=${item.eligible_for_synthesis === true ? 'yes' : 'no'}; missing=${(item.missing || []).join('; ') || 'none'}`,
      })),
      path: namedReviewPath,
    });
  }

  const snapshotPath = 'data/player-availability/latest.json';
  const snapshotStat = await exists(snapshotPath);
  if (!snapshotStat) {
    addSource(sources, {
      group: 'Player Availability',
      name: 'Player availability snapshot',
      status: 'missing',
      evidence: 'No local player availability snapshot found.',
      action: 'Run `npm.cmd run player-availability:live` before frontier synthesis so returning-player and setback news is available.',
      path: snapshotPath,
    });
    return;
  }

  const snapshot = await readJson(snapshotPath, {});
  const generated = snapshot.meta?.generated_at || snapshotStat.mtime.toISOString();
  const hoursOld = ageHours(generated);
  const stale = hoursOld !== null && hoursOld > 72;
  const sourceIssues = (snapshot.meta?.source_health || []).filter((source) => source.status === 'error' || source.status === 'missing');
  const eventCount = snapshot.meta?.event_count || 0;
  const identity = snapshot.meta?.team_identity_validation;
  const identityBlockers = teamIdentityValidationBlockers(identity);
  const evidenceValidation = snapshot.meta?.availability_evidence_validation;
  const evidenceBlocked = evidenceValidation?.status !== 'pass';
  addSource(sources, {
    group: 'Player Availability',
    name: 'Player availability snapshot',
    status: identityBlockers.length || evidenceBlocked ? 'blocked' : (eventCount <= 0 || stale ? 'stale' : 'review'),
    freshness: `${generated} (${hoursOld ?? '?'}h old)`,
    evidence: `${eventCount} availability events across ${snapshot.meta?.teams_with_events || 0} teams; synthesis eligible=${snapshot.meta?.synthesis_eligible_count ?? 'unknown'}; conflicted intel=${snapshot.meta?.conflicted_intel_count ?? 'unknown'}; unflagged contradictions=${evidenceValidation?.unflagged_contradiction_count ?? 'unknown'}; unique evidence=${snapshot.meta?.unique_evidence_count ?? 'unknown'}; corrected legacy source assignments=${identity?.corrected_source_assignment_count ?? 'unknown'}; improving=${snapshot.meta?.improving_count || 0}; worsening=${snapshot.meta?.worsening_count || 0}; major=${snapshot.meta?.major_count || 0}; OL worsening=${snapshot.meta?.offensive_line_worsening_count || 0}; defensive-front worsening=${snapshot.meta?.defensive_front_worsening_count || 0}; OL cluster teams=${snapshot.meta?.teams_with_ol_cluster_risk || 0}; defensive-front cluster teams=${snapshot.meta?.teams_with_defensive_front_cluster_risk || 0}; source issues=${sourceIssues.length}; identity blockers=${identityBlockers.length}${identityBlockers.length ? ` (${identityBlockers.join('; ')})` : ''}; evidence validation=${evidenceValidation?.status || 'missing'}.`,
    action: identityBlockers.length || evidenceBlocked
      ? 'Do not use team availability aggregates in frontier synthesis. Resolve identity/evidence validation blockers, regenerate the artifact, and rerun this audit.'
      : eventCount > 0
        ? 'Review/highlight key returns, setbacks, PUP/IR timing, and snap-count risks before synthesis.'
      : 'Refresh the availability snapshot before synthesis.',
    details: (snapshot.meta?.source_health || []).map((source) => ({
      label: source.source,
      value: `${source.status}${source.evidence ? `; ${source.evidence}` : ''}${source.reason ? `; ${source.reason}` : ''}`,
    })),
    path: snapshotPath,
  });

  const digestPath = 'data/player-availability/impact-digest-latest.json';
  const digestStat = await exists(digestPath);
  if (!digestStat) {
    addSource(sources, {
      group: 'Player Availability',
      name: 'Starter impact availability digest',
      status: 'missing',
      evidence: 'No starter-impact digest found.',
      action: 'Run `npm.cmd run availability:impact-digest` after projected starters and player availability are current.',
      path: digestPath,
    });
  } else {
    const digest = await readJson(digestPath, {});
    const generated = digest.meta?.generated_at || digestStat.mtime.toISOString();
    const hoursOld = ageHours(generated);
    const stale = hoursOld !== null && hoursOld > 72;
    const warnings = (digest.top_events || []).filter((event) => event.classification_warning).length;
    const namedValidation = digest.meta?.named_status_review_validation;
    const digestBlocked = namedValidation?.status !== 'pass';
    addSource(sources, {
      group: 'Player Availability',
      name: 'Starter impact availability digest',
      status: digestBlocked ? 'blocked' : (stale ? 'stale' : 'review'),
      freshness: `${generated} (${hoursOld ?? '?'}h old)`,
      evidence: `${digest.meta?.digest_event_count || 0} ranked digest event(s) from ${digest.meta?.source_event_count || 0} source event(s); synthesis eligible=${digest.meta?.synthesis_eligible_count ?? 'unknown'}; starter-matched=${digest.meta?.starter_matched_count || 0}; conflicted intel=${digest.meta?.conflicted_intel_count ?? 'unknown'}; needs confirmation=${digest.meta?.needs_confirmation_count ?? 'unknown'}; classification review=${digest.meta?.classification_review_count ?? warnings}; named-review validation=${namedValidation?.status || 'missing'}.`,
      action: digestBlocked
        ? 'Do not use this digest until the named-review contract passes.'
        : warnings
        ? 'Keep classification-warning and conflicted rows out of synthesis aggregates; review them separately before any later promotion.'
        : 'Review top events before synthesis and keep this as research context, not betting authority.',
      path: digestPath,
    });
  }
}

async function collectSecondaryMatchups(sources) {
  const snapshotPath = 'data/secondary-matchups/latest.json';
  const snapshotStat = await exists(snapshotPath);
  if (!snapshotStat) {
    addSource(sources, {
      group: 'Secondary Matchups',
      name: 'Secondary matchup vulnerability snapshot',
      status: 'missing',
      evidence: 'No local secondary matchup vulnerability snapshot found.',
      action: 'Run `npm.cmd run secondary-matchups` after updating manual scheme/player-role files.',
      path: snapshotPath,
    });
    return;
  }

  const snapshot = await readJson(snapshotPath, {});
  const generated = snapshot.meta?.generated_at || snapshotStat.mtime.toISOString();
  const hoursOld = ageHours(generated);
  const stale = hoursOld !== null && hoursOld > 168;
  const sourceIssues = (snapshot.meta?.source_health || []).filter((source) => source.status === 'error' || source.status === 'missing');
  addSource(sources, {
    group: 'Secondary Matchups',
    name: 'Secondary matchup vulnerability snapshot',
    status: sourceIssues.length || stale ? 'review' : 'context',
    freshness: `${generated} (${hoursOld ?? '?'}h old)`,
    evidence: `${snapshot.meta?.matchup_count || 0} offense-vs-defense matchups; ${snapshot.meta?.matchups_with_secondary_absences || 0} with secondary absences; ${snapshot.meta?.high_or_medium_vulnerabilities || 0} medium/high vulnerabilities; source issues=${sourceIssues.length}.`,
    action: 'Manual/free proof of concept. Review scheme and role tags before any prop/parlay use; upgrade to charting data later if the workflow proves useful.',
    details: (snapshot.meta?.source_health || []).map((source) => ({
      label: source.source,
      value: `${source.status}${source.evidence ? `; ${source.evidence}` : ''}${source.reason ? `; ${source.reason}` : ''}`,
    })),
    path: snapshotPath,
  });
}

async function collectTeamData(sources) {
  const schedule = await readJson('public/schedule.json', []);
  const regular = Array.isArray(schedule)
    ? schedule.filter((game) => game.season === 2026 && game.season_type === 2)
    : [];
  addSource(sources, {
    group: 'Team Data',
    name: '2026 schedule spine',
    status: regular.length === 272 ? 'current' : 'review',
    freshness: 'public/schedule.json',
    evidence: `${regular.length} regular-season games; ${new Set(regular.map((game) => game.week)).size} weeks.`,
    action: 'Use as join spine for schedule, SoS, rest, and matchup context.',
    path: 'public/schedule.json',
  });

  const profileFiles = await listFiles('data/generated/team-profiles', (name) => name.endsWith('.json'));
  for (const file of profileFiles) {
    const payload = await readJson(file.relativePath, {});
    addSource(sources, {
      group: 'Team Data',
      name: `Team profile: ${file.name.replace('.json', '')}`,
      status: 'context',
      freshness: payload.meta?.generated_at || payload.meta?.snapshot_at || file.mtime,
      evidence: `${rowCount(payload) ?? 'unknown'} rows; source-stamped preseason/historical profile data.`,
      action: 'Use as context; do not treat as live injury/camp news.',
      path: file.relativePath,
    });
  }

  const fantasy = await readJson('public/fantasy-value-board.json', {});
  addSource(sources, {
    group: 'Team Data',
    name: 'Fantasy value vs ADP board',
    status: 'context',
    freshness: fantasy.meta?.date || '',
    evidence: `${fantasy.meta?.players || fantasy.board?.length || 0} players; ${fantasy.board?.filter((row) => row.tier === 'no_projection').length || 0} no-projection rows.`,
    action: 'Useful for player/usage priors, not a futures odds source.',
    path: 'public/fantasy-value-board.json',
  });
}

async function collectOperationalReadiness(sources) {
  const readiness = await listFiles('.nfl/readiness', (name) => name.startsWith('season-readiness-') && name.endsWith('.json'));
  if (readiness[0]) {
    const payload = await readJson(readiness[0].relativePath, {});
    addSource(sources, {
      group: 'Operational Readiness',
      name: 'Latest season readiness smoke',
      status: payload.summary?.verdict === 'READY' || payload.summary?.verdict === 'READY WITH WATCH ITEMS' ? 'review' : 'blocked',
      freshness: payload.generated_at || readiness[0].mtime,
      evidence: `${payload.summary?.verdict || 'unknown'}; PASS ${payload.summary?.counts?.PASS || 0} / WARN ${payload.summary?.counts?.WARN || 0} / FAIL ${payload.summary?.counts?.FAIL || 0}.`,
      action: payload.summary?.counts?.FAIL
        ? 'Resolve service/data failures before relying on interactive dashboard surfaces.'
        : 'Watch items should be resolved or explicitly waived before synthesis.',
      path: readiness[0].relativePath,
    });
  }

  // Execution-only plumbing such as weekly live props feeds and retail-book
  // bet-slip parsers is intentionally out of scope for this preseason futures
  // synthesis freshness gate.
}

function readinessSummary(sources) {
  const blockers = sources.filter((source) => ['blocked', 'missing'].includes(source.status));
  const stale = sources.filter((source) => source.status === 'stale');
  const review = sources.filter((source) => source.status === 'review');
  const current = sources.filter((source) => source.status === 'current');
  const inference = sources.filter((source) => source.status === 'inference');
  const frontierReady = blockers.length === 0 && stale.length === 0;
  return {
    frontierReady,
    counts: {
      current: current.length,
      review: review.length,
      stale: stale.length,
      blocked: blockers.filter((s) => s.status === 'blocked').length,
      missing: blockers.filter((s) => s.status === 'missing').length,
      context: sources.filter((source) => source.status === 'context').length,
      inference: inference.length,
    },
    blockers,
    stale,
    review,
    inference,
  };
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDetails(source) {
  if (!source.details?.length) return '';
  return `<details><summary>Details</summary><dl>${source.details.map((item) => `<dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd>`).join('')}</dl></details>`;
}

function renderHtml(payload) {
  const { sources, summary } = payload;
  const cards = SOURCE_GROUPS.map((group) => {
    const rows = sources.filter((source) => source.group === group);
    if (!rows.length) return '';
    return `<section>
      <h2>${esc(group)}</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Status</th>
            <th>Freshness</th>
            <th>Evidence</th>
            <th>Action Before Synthesis</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((source) => `<tr>
            <td><strong>${esc(source.name)}</strong>${source.path ? `<div class="path">${esc(source.path)}</div>` : ''}${renderDetails(source)}</td>
            <td><span class="badge ${esc(source.status)}">${esc(statusBadge(source.status))}</span></td>
            <td>${esc(source.freshness)}</td>
            <td>${esc(source.evidence)}</td>
            <td>${esc(source.action)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>`;
  }).join('\n');

  const staleList = [...summary.blockers, ...summary.stale].slice(0, 24)
    .map((source) => `<li><strong>${esc(source.name)}</strong>: ${esc(source.action)}</li>`)
    .join('');
  const gateIssues = staleList ? `\n      <ul>${staleList}</ul>` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NFL Intelligence Source Audit</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1f2933;
      --muted: #64748b;
      --line: #d8dee9;
      --bg: #f6f8fb;
      --panel: #ffffff;
      --current: #087f5b;
      --review: #9a6700;
      --stale: #b42318;
      --blocked: #7f1d1d;
      --context: #475569;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header {
      padding: 28px 32px 20px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    main {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 28px 48px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 30px;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 14px;
      font-size: 20px;
    }
    .sub {
      color: var(--muted);
      max-width: 980px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin: 18px 0 20px;
    }
    .metric, section, .gate {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .metric {
      padding: 14px;
    }
    .metric b {
      display: block;
      font-size: 24px;
      margin-bottom: 2px;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .gate {
      padding: 16px 18px;
      margin-bottom: 18px;
    }
    .gate h2 {
      margin-bottom: 6px;
    }
    .gate ul {
      margin: 10px 0 0;
      padding-left: 22px;
    }
    section {
      margin-top: 18px;
      padding: 18px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }
    th, td {
      padding: 11px 10px;
      border-top: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      color: #334155;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
      border-top: 0;
    }
    td:nth-child(1) { width: 24%; }
    td:nth-child(2) { width: 9%; }
    td:nth-child(3) { width: 15%; }
    td:nth-child(4) { width: 25%; }
    td:nth-child(5) { width: 27%; }
    .path {
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      margin-top: 4px;
      overflow-wrap: anywhere;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge.current { background: var(--current); }
    .badge.review { background: var(--review); }
    .badge.stale { background: var(--stale); }
    .badge.blocked, .badge.missing { background: var(--blocked); }
    .badge.context { background: var(--context); }
    .badge.inference { background: #31572c; }
    details {
      margin-top: 8px;
      color: var(--muted);
    }
    details summary {
      cursor: pointer;
      color: #334155;
      font-size: 13px;
    }
    dl {
      margin: 8px 0 0;
      display: grid;
      grid-template-columns: minmax(160px, 260px) 1fr;
      gap: 4px 10px;
    }
    dt {
      font-weight: 700;
      color: #475569;
    }
    dd {
      margin: 0;
    }
  </style>
</head>
<body>
  <header>
    <h1>NFL Intelligence Source Audit</h1>
    <div class="sub">Generated ${esc(payload.generated_at)}. This is a pre-synthesis freshness report. It reads local receipts and artifacts only; it does not call frontier models, fetch live odds, write Supabase, approve official picks, or mutate open portfolio tickets.</div>
  </header>
  <main>
    <div class="summary">
      ${Object.entries(summary.counts).map(([key, value]) => `<div class="metric"><b>${value}</b><span>${esc(statusBadge(key))}</span></div>`).join('')}
    </div>
    <div class="gate">
      <h2>Frontier Synthesis Gate: ${summary.frontierReady ? 'Passable with Notes' : 'Blocked Until Refresh Decisions'}</h2>
      <p>${summary.frontierReady
        ? 'Enough current/local evidence exists to proceed if review items are intentionally accepted.'
        : 'Do not run a maximum frontier-model portfolio synthesis yet unless stale or blocked sources are refreshed, excluded from recommendation eligibility, or intentionally retained as inference-only context.'}</p>${gateIssues}
    </div>
    ${cards}
  </main>
</body>
</html>
`;
}

async function main() {
  const sources = [];
  await collectFuturesOdds(sources);
  await collectManualFuturesImports(sources);
  await collectPredictionMarketMap(sources);
  await collectRawPrimaryBookOddsExports(sources);
  await collectPortfolioArtifacts(sources);
  await collectYoutubeIntel(sources);
  await collectExpertDossiers(sources);
  await collectPodcastIntel(sources);
  await collectResearchArticleIntel(sources);
  await collectTrainingCamp(sources);
  await collectPlayerAvailability(sources);
  await collectSecondaryMatchups(sources);
  await collectTeamData(sources);
  await collectOperationalReadiness(sources);

  const summary = readinessSummary(sources);
  const payload = {
    schema: FUTURES_EVIDENCE_SCHEMAS.audit,
    generated_at: generatedAt.toISOString(),
    inputs: {
      mode: 'local_artifacts_only',
      source_count: sources.length,
    },
    guardrails: {
      live_fetches: false,
      model_calls: false,
      supabase_writes: false,
      official_pick_approvals: false,
      portfolio_mutations: false,
    },
    summary,
    sources,
  };
  const html = renderHtml(payload);

  if (!args.noWrite) {
    await mkdir(REPORT_DIR, { recursive: true });
    await writeFile(outHtml, html, 'utf8');
    await writeFile(outJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await writeFile(DOCS_LATEST, html, 'utf8');
  }

  console.log(`NFL intelligence source audit: ${summary.frontierReady ? 'PASSABLE' : 'BLOCKED'}`);
  console.log(`Current ${summary.counts.current} | Review ${summary.counts.review} | Stale ${summary.counts.stale} | Blocked ${summary.counts.blocked} | Missing ${summary.counts.missing} | Context ${summary.counts.context}`);
  if (!args.noWrite) {
    console.log(`HTML: ${path.relative(ROOT, outHtml)}`);
    console.log(`JSON: ${path.relative(ROOT, outJson)}`);
    console.log(`Latest: ${path.relative(ROOT, DOCS_LATEST)}`);
  }
  if (args.strict && !summary.frontierReady) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
