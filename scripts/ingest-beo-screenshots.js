#!/usr/bin/env node
// scripts/ingest-beo-screenshots.js
//
// Generic, repeatable replacement for scripts/parse_beo_screenshots.py (which
// was a one-off, hand-edited script: hardcoded date, hardcoded list of exact
// filenames — a near-duplicate had to be hand-written for every new BetOnline
// (BEO) screenshot batch). This version watches docs/Futures_Odds/ for any
// screenshot whose filename starts with a known BEO_* prefix, figures out
// which market it is from that prefix, runs Gemini Vision OCR with the
// matching extraction prompt, normalizes the results the same way
// scripts/backfill-futures-imports.js does (kept in sync deliberately — see
// normalizeRow() below), and — by default — upserts straight into
// futures_odds_snapshots. Pass --dry-run to see exactly what would be
// written without touching Supabase or moving any files.
//
// Workflow:
//   1. Screenshot BEO's futures pages, naming each file with the matching
//      prefix (see PREFIX_MARKET_MAP below) — e.g. BEO_SB_0823.PNG,
//      BEO_Conf_0823.PNG, BEO_RegWins1_0823.PNG, BEO_RegWins2_0823.PNG, ...
//      (multiple screenshots for the same market — e.g. win totals spanning
//      several scrolled screens — are fine; they all get merged.) The suffix
//      after the prefix (date, page number) doesn't matter to this script,
//      only the prefix does.
//   2. Drop them in docs/Futures_Odds/ (the same folder past batches used).
//   3. Run:  node scripts/ingest-beo-screenshots.js
//      (or:  node scripts/ingest-beo-screenshots.js --dry-run  to preview)
//
// What it does, in order:
//   - Finds every image file directly in docs/Futures_Odds/ (not already
//     archived under docs/Futures_Odds/_processed/) whose name starts with a
//     recognized prefix. Anything else in that folder is ignored (warned
//     about once, not treated as an error).
//   - Runs Gemini Vision OCR per screenshot using the prompt for its market.
//   - Normalizes every extracted row into the futures_odds_snapshots schema
//     (same field-mapping rules as scripts/backfill-futures-imports.js:
//     conference/division market_type splitting, playoffs yes_price->odds,
//     wins over_price->odds fallback, exacta selection->team). Any row that
//     still can't be normalized (no team, no market, no usable odds) is
//     dropped and reported as an anomaly rather than failing the batch.
//   - Writes data/futures-imports/betonline-<date>.json — a flat array of
//     the final normalized rows (this is the same shape 18 of the 19
//     historical files already use; unlike the old
//     betonline-2026-08-22.json, this script never writes the wrapped
//     {records:[...]} shape, so there's one less format wrinkle for future
//     tools to special-case).
//   - Writes docs/FUTURES_ODDS_BETONLINE_<date>_MANUAL_REVIEW.md — a short
//     human-readable summary (per-market counts, anomalies, source files),
//     matching the review-doc convention every past batch has had. This is
//     written even in the default auto-load mode, purely as a record to
//     glance back at later — it does not gate anything.
//   - Unless --dry-run: upserts the normalized rows into
//     public.futures_odds_snapshots (same chunked POST + on_conflict
//     merge-duplicates upsert as scripts/ingest-futures-json.js and
//     scripts/backfill-futures-imports.js — safe to re-run, duplicates
//     merge rather than double-insert), then moves the source screenshots
//     into docs/Futures_Odds/_processed/BetOnline_<date>/ (same archive
//     convention as every past batch).
//
// Flags:
//   --dry-run       Do everything except the Supabase write and the file
//                   archive move. JSON + review markdown are still written
//                   so you can inspect exactly what a real run would do.
//   --date YYYY-MM-DD   Override the batch date (default: today, local
//                   time). This is the date used in captured_at/
//                   snapshot_time and in the output filenames.
//   --season NNNN   Override the season tag (default: capture year).
//   --book NAME     Override the book tag (default: betonline). The prefix
//                   map and prompts below are BEO-specific; this flag exists
//                   in case the same pattern gets reused for another book's
//                   screenshots later, but PROMPT_MAP would need matching
//                   entries added first.
//
// Note: this repo's device-bridge sessions have no network egress to
// *.supabase.co (confirmed in an earlier session) — if you're running this
// from that kind of bridged/sandboxed shell rather than a normal local
// terminal, the Supabase write will fail even with valid keys. Run it from
// a normal terminal on this machine.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not new URL(...).pathname) so this resolves correctly on
// Windows too — a raw pathname would keep a leading "/" before the drive
// letter (e.g. "/E:/dev/...") and break path.resolve.
const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const SCREENSHOT_DIR = path.join(ROOT, 'docs', 'Futures_Odds');
const ARCHIVE_ROOT = path.join(SCREENSHOT_DIR, '_processed');
const IMPORTS_DIR = path.join(ROOT, 'data', 'futures-imports');
const DOCS_DIR = path.join(ROOT, 'docs');

const VALID_EXTS = new Set(['.png', '.jpg', '.jpeg']);

// Longest prefix first so a more-specific prefix (e.g. a hypothetical
// BEO_SBMatchup) always wins over a shorter one (BEO_SB_) that happens to be
// a literal prefix of it. Matching is case-insensitive.
const PREFIX_MARKET_MAP = [
  { prefix: 'BEO_SBMatchup', market: 'superbowl_matchup', label: 'Super Bowl Exact Matchup' },
  { prefix: 'BEO_SB_', market: 'superbowl', label: 'Super Bowl Winner' },
  { prefix: 'BEO_Conf_', market: 'conference', label: 'Conference Winner' },
  { prefix: 'BEO_Div_', market: 'division', label: 'Division Winner' },
  { prefix: 'BEO_RegWins', market: 'wins', label: 'Regular Season Win Totals' },
  // 2026-09-03 fix (Andy, production-readiness pass): the 2026-08-29 batch
  // used 'BEO_WinTotals1/2/3_0829.PNG' instead of the 'BEO_RegWins*' prefix
  // every prior batch used - this script's prefix list was never updated, so
  // it silently skipped exactly the win-totals screenshots that this whole
  // investigation started from (Packers Win Total Over 9.5). A skip just
  // logs a one-line warning, not an error, so this would have gone unnoticed
  // again. Accept both spellings going forward.
  { prefix: 'BEO_WinTotals', market: 'wins', label: 'Regular Season Win Totals' },
  { prefix: 'BEO_MakePlayoffs', market: 'playoffs', label: 'Make/Miss Playoffs' },
  { prefix: 'BEO_Seeding_Exacta', market: 'exacta', label: 'Seeding / Exacta' },
  { prefix: 'BEO_Exacta', market: 'exacta', label: 'Seeding / Exacta' },
].sort((a, b) => b.prefix.length - a.prefix.length);

function promptFor(market) {
  const common = 'Extract ONLY what is visible in this BetOnline (BEO) futures odds screenshot. Do not guess or invent teams/prices that aren\'t shown. Return ONLY a valid JSON array, no prose.';
  switch (market) {
    case 'superbowl':
      return `${common}\nThis is a Super Bowl Winner odds board. Extract all NFL team names and American odds (e.g. +475, +1000, +1600).\n[{"team": "Full NFL Team Name", "odds": 475}, ...]`;
    case 'conference':
      return `${common}\nThis is an NFC/AFC Conference Winner odds board. Extract each team name, its conference (NFC or AFC), and American odds.\n[{"team": "Full NFL Team Name", "conference": "NFC", "odds": 275}, ...]`;
    case 'division':
      return `${common}\nThis is a Division Winner odds board. Extract each team name, its division (e.g. AFC East, NFC West), and American odds.\n[{"team": "Full NFL Team Name", "division": "NFC West", "odds": 115}, ...]`;
    case 'wins':
      return `${common}\nThis is a Regular Season Win Totals board. Extract each team name, the win total line (e.g. 9.5), the Over American price, and the Under American price.\n[{"team": "Full NFL Team Name", "line": 9.5, "over_price": -115, "under_price": -105}, ...]`;
    case 'playoffs':
      return `${common}\nThis is a Make/Miss the Playoffs Yes/No odds board. Extract each team name, the Yes price, and the No price.\n[{"team": "Full NFL Team Name", "yes_price": -140, "no_price": 110}, ...]`;
    case 'superbowl_matchup':
      return `${common}\nThis is a Super Bowl Exact Matchup odds board (two-team combinations). Extract each matchup label exactly as shown (e.g. "Chiefs vs Eagles") and its American odds.\n[{"team": "Team A vs Team B", "odds": 5000}, ...]`;
    case 'exacta':
      return `${common}\nThis is a seeding/exacta odds board (not a single-team market). Extract each selection label exactly as shown and its American odds.\n[{"selection": "Selection Label", "odds": 500}, ...]`;
    default:
      throw new Error(`No OCR prompt defined for market "${market}"`);
  }
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function hasFlag(name) {
  return process.argv.includes(name);
}

function loadEnv(p = path.join(ROOT, '.env')) {
  const env = { ...process.env };
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...rest] = trimmed.split('=');
    env[k] ??= rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function findScreenshots() {
  const entries = fs.readdirSync(SCREENSHOT_DIR, { withFileTypes: true });
  const matched = [];
  const unmatched = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!VALID_EXTS.has(ext)) continue;
    const hit = PREFIX_MARKET_MAP.find((p) => e.name.toLowerCase().startsWith(p.prefix.toLowerCase()));
    if (hit) matched.push({ file: e.name, ...hit });
    else unmatched.push(e.name);
  }
  return { matched, unmatched };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
}

// Same Gemini Vision model as the last verified-working BEO OCR run
// (scripts/parse_beo_screenshots.py, 2026-08-22 batch — 206 records,
// live-verified in Supabase). Override via GEMINI_VISION_MODEL if a newer
// model should be used going forward.
const GEMINI_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';

async function ocrScreenshot(env, filePath, market) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const imgBytes = fs.readFileSync(filePath);
  const payload = {
    contents: [{
      parts: [
        { text: promptFor(market) },
        { inlineData: { mimeType: getMimeType(filePath), data: imgBytes.toString('base64') } },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length) return parsed;
          console.warn(`  -> attempt ${attempt} returned 0 items, retrying...`);
        }
      } else {
        console.warn(`  -> attempt ${attempt} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
    } catch (err) {
      console.warn(`  -> attempt ${attempt} failed: ${err.message}`);
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  return [];
}

// ── Normalization — deliberately mirrors scripts/backfill-futures-imports.js's
// normalizeRow(). Keep the two in sync if the futures_odds_snapshots schema
// or agents/futures-intel-report-v2.js's CATEGORIES ever change what
// market_type values / fields are expected. ─────────────────────────────────
const OUT_KEYS = [
  'snapshot_time', 'captured_at', 'season', 'book', 'market_type', 'team',
  'selection', 'odds', 'price', 'implied_prob', 'line', 'over_price', 'under_price',
];

function normDivision(div) {
  return String(div).trim().toLowerCase().replace(/\s+/g, '_');
}
function normConference(conf) {
  return String(conf).trim().toLowerCase();
}

function normalizeRow(r, sourceFile) {
  let mt = r.market_type;
  let team = r.team;
  let odds = r.odds;

  if (mt === 'conference' && r.conference) {
    mt = 'conference_' + normConference(r.conference);
  } else if (mt === 'division' && r.division) {
    mt = 'division_' + normDivision(r.division);
  }
  if (mt === 'playoffs' && odds == null && r.yes_price != null) {
    odds = r.yes_price;
  }
  if (mt === 'wins' && odds == null && r.over_price != null) {
    odds = r.over_price;
  }
  if (team == null && r.selection != null) team = r.selection;

  if (!mt) return { row: null, anomaly: `${sourceFile}: dropped row with no market_type (${JSON.stringify(r).slice(0, 120)})` };
  if (!team) return { row: null, anomaly: `${sourceFile}: dropped row with no team/selection (market_type=${mt}, ${JSON.stringify(r).slice(0, 120)})` };
  if (odds == null) return { row: null, anomaly: `${sourceFile}: dropped row with no odds/yes_price/over_price fallback available (market_type=${mt}, team=${team}, ${JSON.stringify(r).slice(0, 120)})` };

  const out = {};
  for (const k of OUT_KEYS) out[k] = r[k] ?? null;
  out.market_type = mt;
  out.team = team;
  out.odds = odds;
  out.price = r.price ?? odds;
  return { row: out, anomaly: null };
}

async function main() {
  const DRY_RUN = hasFlag('--dry-run');
  const date = arg('--date', todayIso());
  const book = arg('--book', 'betonline');
  const season = parseInt(arg('--season', String(new Date(date).getFullYear())), 10);
  const capturedAt = `${date}T12:00:00Z`;

  console.log('=======================================================');
  console.log(`  BEO Screenshot Ingestion — ${date} (book=${book}, season=${season})`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no Supabase write, no archive move)' : 'LIVE (will write to Supabase + archive screenshots)'}`);
  console.log('=======================================================\n');

  const env = loadEnv();
  const { matched, unmatched } = findScreenshots();

  if (unmatched.length) {
    console.warn(`[warn] ${unmatched.length} image file(s) in docs/Futures_Odds/ did not match a known BEO_* prefix and were skipped:`);
    for (const f of unmatched) console.warn(`  - ${f}`);
    console.warn('  (see PREFIX_MARKET_MAP in this script if a new market/prefix needs to be added)\n');
  }

  if (!matched.length) {
    console.log('No new BEO screenshots found in docs/Futures_Odds/ (matching a known prefix). Nothing to do.');
    return;
  }

  console.log(`Found ${matched.length} screenshot(s) to process:`);
  for (const m of matched) console.log(`  ${m.file} -> ${m.market}`);
  console.log('');

  const allRows = [];
  const allAnomalies = [];
  const perMarketRaw = {};

  for (const m of matched) {
    console.log(`[OCR] ${m.file} (${m.label})...`);
    const filePath = path.join(SCREENSHOT_DIR, m.file);
    const parsed = await ocrScreenshot(env, filePath, m.market);
    console.log(`  -> extracted ${parsed.length} raw item(s)`);
    perMarketRaw[m.market] = (perMarketRaw[m.market] || 0) + parsed.length;

    for (const rec of parsed) {
      rec.captured_at = capturedAt;
      rec.snapshot_time = capturedAt;
      rec.season = season;
      rec.book = book;
      rec.market_type = m.market;
      const { row, anomaly } = normalizeRow(rec, m.file);
      if (row) allRows.push(row);
      if (anomaly) allAnomalies.push(anomaly);
    }
    // Be polite to the Vision API between screenshots.
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nTotal normalized rows: ${allRows.length}`);
  if (allAnomalies.length) {
    console.log(`ANOMALIES (${allAnomalies.length}) — rows dropped, not written:`);
    for (const a of allAnomalies) console.log(`  ! ${a}`);
  } else {
    console.log('No anomalies — every extracted row normalized cleanly.');
  }

  const byMarket = {};
  for (const r of allRows) byMarket[r.market_type] = (byMarket[r.market_type] || 0) + 1;
  console.log('\nRows by market_type (post-normalization):');
  for (const [k, v] of Object.entries(byMarket).sort()) console.log(`  ${k}: ${v}`);

  // ── Write the flat-array JSON file ──────────────────────────────────────
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  const jsonPath = path.join(IMPORTS_DIR, `${book}-${date}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(allRows, null, 2), 'utf8');
  console.log(`\nWrote ${jsonPath}`);

  // ── Write the review markdown ────────────────────────────────────────────
  const mdPath = path.join(DOCS_DIR, `FUTURES_ODDS_BETONLINE_${date}_MANUAL_REVIEW.md`);
  const mdLines = [
    `# BetOnline Futures Odds — Manual Review (${date})`,
    '',
    `**Snapshot Time:** \`${capturedAt}\``,
    `**Book:** \`${book}\``,
    `**Total Normalized Records:** \`${allRows.length}\``,
    `**Source Screenshots:** ${matched.map((m) => `\`${m.file}\``).join(', ')}`,
    '',
    '## Market Record Breakdown',
    ...Object.entries(byMarket).sort().map(([k, v]) => `- ${k}: \`${v}\``),
  ];
  if (allAnomalies.length) {
    mdLines.push('', '## Anomalies (dropped rows)', ...allAnomalies.map((a) => `- ${a}`));
  }
  if (unmatched.length) {
    mdLines.push('', '## Skipped files (no matching prefix)', ...unmatched.map((f) => `- ${f}`));
  }
  fs.writeFileSync(mdPath, mdLines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${mdPath}`);

  if (DRY_RUN) {
    console.log('\n[dry-run] No Supabase write performed, no screenshots archived.');
    return;
  }

  // ── Upsert into Supabase ────────────────────────────────────────────────
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\nMissing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — cannot write. (JSON + review doc above are still saved.)');
    process.exit(1);
  }
  const upsertUrl = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time`;
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const res = await fetch(upsertUrl, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} on chunk ${i}-${i + chunk.length}: ${(await res.text()).slice(0, 600)}`);
      console.error(`(${written}/${allRows.length} rows upserted before this failure; JSON file is saved, safe to re-run this script — the upsert is idempotent.)`);
      process.exit(1);
    }
    written += chunk.length;
    console.log(`  upserted ${written}/${allRows.length}`);
  }
  console.log(`OK — upserted ${written} row(s) into futures_odds_snapshots.`);

  // ── Archive the processed screenshots ───────────────────────────────────
  const archiveDir = path.join(ARCHIVE_ROOT, `BetOnline_${date}`);
  fs.mkdirSync(archiveDir, { recursive: true });
  for (const m of matched) {
    const from = path.join(SCREENSHOT_DIR, m.file);
    const to = path.join(archiveDir, m.file);
    fs.renameSync(from, to);
  }
  console.log(`Archived ${matched.length} screenshot(s) to ${archiveDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
