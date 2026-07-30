#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, '.nfl', 'source-audit');
const DOCS_LATEST = path.join(ROOT, 'docs', 'NFL_INTEL_SOURCE_AUDIT_LATEST.html');

const generatedAt = new Date();
const stamp = generatedAt.toISOString().replace(/[:.]/g, '-');
const outHtml = path.join(REPORT_DIR, `nfl-intel-source-audit-${stamp}.html`);
const outJson = path.join(REPORT_DIR, `nfl-intel-source-audit-${stamp}.json`);

const SOURCE_GROUPS = [
  'Execution Policy',
  'Futures Odds',
  'Futures Portfolio',
  'Expert and Podcast Intel',
  'Web Article Intel',
  'Training Camp',
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
  const args = { noWrite: false };
  for (const arg of argv) {
    if (arg === '--no-write') args.noWrite = true;
    if (arg === '--help' || arg === '-h') {
      console.log(`NFL intelligence source audit

Usage:
  npm.cmd run intel:source-audit
  node scripts/build-intel-source-audit-report.js --no-write

This reads local artifacts only. It does not fetch live odds, call models,
write Supabase, approve picks, or mutate portfolio tickets.`);
      process.exit(0);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

async function exists(relativePath) {
  try {
    return await stat(path.join(ROOT, relativePath));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function readJson(relativePath, fallback = null) {
  try {
    const raw = await readFile(path.join(ROOT, relativePath), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
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
  const match = String(name || '').match(/_(\d{4})(?:\.[^.]+)?$/);
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
  const rawBetOnlineFiles = await listFiles(
    'docs/Futures_Odds',
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
    const fresh = snapshotAge != null && snapshotAge <= 48;
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
}

async function collectRawPrimaryBookOddsExports(sources) {
  const files = await listFiles(
    'docs/Futures_Odds',
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
      addSource(sources, {
        group: 'Futures Odds',
        name: 'Raw current sportsbook export: BetOnline',
        status: 'review',
        freshness: `${bundle.latestDate || file.mtime} screenshot snapshot`,
        evidence: hasNormalizedBundle
          ? `${bundle.evidence} Matching normalized import ${path.basename(normalizedPath)} has ${normalizedRows} rows.`
          : bundle.evidence,
        action: hasNormalizedBundle
          ? `Screenshots are captured, date-identifiable, and normalized into ${normalizedPath}. Use the normalized JSON for exact listed-market prices; use the manual review doc for playoff No-side values.`
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
  const summaryPath = 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json';
  const statusPath = 'data/shadow-harness/review/youtube-futures-intel-review-status.json';
  const summaryStat = await exists(summaryPath);
  if (!summaryStat) {
    addSource(sources, {
      group: 'Expert and Podcast Intel',
      name: 'YouTube/Gemini reviewed futures intel',
      status: 'missing',
      evidence: 'Agent summary not found.',
      action: 'Rebuild review/export summary before synthesis.',
    });
    return;
  }
  const summary = await readJson(summaryPath, {});
  const status = await readJson(statusPath, {});
  const reviewRecords = Object.values(status.items || status.decisions || status || {})
    .filter((record) => record && typeof record === 'object');
  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'YouTube/Gemini reviewed futures intel',
    status: summary.exported_items >= 40 ? 'current' : 'review',
    freshness: `${summary.generated_at || summaryStat.mtime.toISOString()} (${ageHours(summary.generated_at || summaryStat.mtime.toISOString())}h old)`,
    evidence: `${summary.exported_items || 0} promoted/exported items; ${reviewRecords.length} review records; leak checks ${JSON.stringify(summary.rejected_leak_checks || {})}.`,
    action: 'Use as source-stamped research context, not betting authority. Refresh only if new YouTube candidates exist after last sweep.',
    path: summaryPath,
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
  addSource(sources, {
    group: 'Expert and Podcast Intel',
    name: 'Generated podcast narratives and deep dives',
    status: 'review',
    freshness: 'latest generated docs include July 21-22 episodes',
    evidence: `${Array.isArray(narrative) ? narrative.length : narrative.episodes?.length || 0} narratives; ${Array.isArray(deepDive) ? deepDive.length : deepDive.episodes?.length || 0} deep dives.`,
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

  const articleReview = await readJson('data/research-intel/review/article-intel-review-latest.json', null);
  if (articleReview) {
    const generated = articleReview.generated_at || '';
    const actualPicks = articleReview.summary?.actual_picks || 0;
    const marketLeads = articleReview.summary?.market_leads ?? articleReview.summary?.pick_leads ?? 0;
    addSource(sources, {
      group: 'Web Article Intel',
      name: 'Article full-body intel review',
      status: 'review',
      freshness: generated ? `${generated} (${ageHours(generated) ?? '?'}h old)` : 'unknown',
      evidence: `${articleReview.summary?.articles_reviewed || 0} articles reviewed; ${actualPicks} actual pick candidates; ${marketLeads} market/inference leads; ${articleReview.summary?.analysis_notes || 0} contextual notes; ${articleReview.summary?.likely_non_nfl_false_positives || 0} likely non-NFL false positives.`,
      action: 'Use actual-pick candidates for human review; use market/inference leads as synthesis context only. Do not trust the raw research_pick_signals count as article QA.',
      details: (articleReview.sources || []).map((source) => ({
        label: source.source,
        value: `${source.articles} article(s); ${source.actual_picks || 0} actual pick candidate(s); ${source.market_leads ?? source.pick_leads ?? 0} market/inference lead(s); ${source.analysis_notes} contextual note(s)`,
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
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp local snapshot',
      status: snapshot.meta?.item_count > 0 ? 'review' : 'stale',
      freshness: snapshot.meta?.generated_at || snapshotStat.mtime.toISOString(),
      evidence: `${snapshot.meta?.team_count || 0} teams; ${snapshot.meta?.teams_with_intel || 0} teams with manual intel; ${snapshot.meta?.item_count || 0} items.`,
      action: snapshot.meta?.item_count > 0
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
    addSource(sources, {
      group: 'Training Camp',
      name: 'Training camp RSS scout',
      status: receipt.written ? 'review' : 'stale',
      freshness: receipt.generated_at || receipts[0].mtime,
      evidence: `${receipt.item_count || 0} live-feed items across ${receipt.teams_with_intel || 0} teams; written=${receipt.written}; feed issues=${issues.length}.`,
      action: receipt.written
        ? 'Review merged output.'
        : 'Last run was a dry-run receipt. Persist or manually review before synthesis.',
      details: (receipt.feed_health || []).map((feed) => ({
        label: feed.source,
        value: `${feed.status}; fetched ${feed.fetched_items}; kept ${feed.kept_items}${feed.reason ? `; ${feed.reason}` : ''}`,
      })),
      path: receipts[0].relativePath,
    });
  }
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
  await collectRawPrimaryBookOddsExports(sources);
  await collectPortfolioArtifacts(sources);
  await collectYoutubeIntel(sources);
  await collectPodcastIntel(sources);
  await collectResearchArticleIntel(sources);
  await collectTrainingCamp(sources);
  await collectTeamData(sources);
  await collectOperationalReadiness(sources);

  const summary = readinessSummary(sources);
  const payload = {
    generated_at: generatedAt.toISOString(),
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
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
