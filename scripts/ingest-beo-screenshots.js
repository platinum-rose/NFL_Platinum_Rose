#!/usr/bin/env node
// scripts/ingest-beo-screenshots.js
//
// Generic, repeatable replacement for scripts/parse_beo_screenshots.py (which
// was a one-off, hand-edited script: hardcoded date, hardcoded list of exact
// filenames — a near-duplicate had to be hand-written for every new BetOnline
// (BEO) screenshot batch). This version watches docs/Futures_Odds/ for any
// screenshot whose filename starts with a known book+market prefix, figures
// out which book AND which market it is from that prefix, runs Gemini Vision
// OCR with the matching extraction prompt, normalizes the results the same
// way scripts/backfill-futures-imports.js does (kept in sync deliberately —
// see normalizeRow() below), and — by default — upserts straight into
// futures_odds_snapshots. Pass --dry-run to see exactly what would be
// written without touching Supabase or moving any files.
//
// Workflow:
//   1. Screenshot a book's futures pages, naming each file with the matching
//      book+market prefix (see BOOK_PREFIXES / MARKET_SUFFIXES / the
//      generated PREFIX_MARKET_MAP below) — e.g. BEO_SB_0823.PNG,
//      BKR_Conf_0823.PNG, BUS_RegWins1_0926.PNG, ... (multiple screenshots
//      for the same book+market — e.g. win totals spanning several scrolled
//      screens — are fine; they all get merged.) The suffix after the
//      prefix (date, page number) doesn't matter to this script, only the
//      prefix does.
//
//      Supported book prefixes (2026-09-26, Andy's Codex-browser + manual
//      capture workflow — DK/FD/Kalshi went placeable that same day, see
//      src/lib/executionVenues.js):
//        BEO_  -> book "betonline"  (BetOnline; Codex-browser captures)
//        BKR_  -> book "bookmaker"  (Bookmaker; Codex-browser captures)
//        BUS_  -> book "betus"      (BetUS; Andy captures these directly —
//                                     easy for him to grab, no browser agent
//                                     needed)
//      All three share the same market-suffix set (SB_, Conf_, Div_,
//      RegWins/WinTotals, MakePlayoffs, Seeding_Exacta/Exacta,
//      SB_ExactaMatchup/SBMatchup) — see MARKET_SUFFIXES. A single run over
//      a mixed folder (e.g. BEO_* and BUS_* screenshots dropped in on the
//      same day) tags every row with its own file's book correctly and
//      writes separate per-book output files — see "one run, many books"
//      below. If a genuinely new book shows up, add one entry to
//      BOOK_PREFIXES; no other code needs to change.
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
//   - One run, many books: matched screenshots are grouped by the book their
//     prefix maps to. Each book group gets its own
//     data/futures-imports/<book>-<date>.json flat-array file (same shape
//     every historical file already uses) and its own
//     docs/FUTURES_ODDS_<BOOKLABEL>_<date>_MANUAL_REVIEW.md summary and its
//     own docs/Futures_Odds/_processed/<BookLabel>_<date>/ archive
//     directory — dropping BEO_* and BUS_* files in the same folder on the
//     same day produces two clean, independent batches, not one mixed file.
//   - Unless --dry-run: upserts every book's normalized rows into
//     public.futures_odds_snapshots (same chunked POST + on_conflict
//     merge-duplicates upsert as scripts/ingest-futures-json.js and
//     scripts/backfill-futures-imports.js — safe to re-run, duplicates
//     merge rather than double-insert), then moves each book's source
//     screenshots into its own archive directory (same archive convention
//     as every past batch).
//
// Flags:
//   --dry-run       Do everything except the Supabase write and the file
//                   archive move. JSON + review markdown are still written
//                   so you can inspect exactly what a real run would do.
//   --date YYYY-MM-DD   Override the batch date (default: today, local
//                   time). This is the date used in captured_at/
//                   snapshot_time and in the output filenames.
//   --season NNNN   Override the season tag (default: capture year).
//   --book NAME     Fallback book tag for any matched file whose prefix
//                   entry doesn't specify one (default: betonline). Every
//                   entry in BOOK_PREFIXES below specifies its own book, so
//                   this flag only matters if a new prefix is added without
//                   one, or as a one-off override for testing.
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

// 2026-09-26 (Andy): DraftKings/FanDuel/Kalshi went placeable and Codex now
// captures BEO + BKR via browser automation while Andy captures BetUS
// himself, so this needs to tell more than one book's screenshots apart.
// Add a new book here (and nowhere else) if another book's screenshots need
// parsing later.
const BOOK_PREFIXES = [
  { prefix: 'BEO_', book: 'betonline', label: 'BetOnline' },
  { prefix: 'BKR_', book: 'bookmaker', label: 'Bookmaker' },
  { prefix: 'BUS_', book: 'betus', label: 'BetUS' },
];
const BOOK_LABEL_BY_KEY = Object.fromEntries(BOOK_PREFIXES.map((b) => [b.book, b.label]));

// The suffix after a book prefix (e.g. 'BEO_' + 'SB_' -> 'BEO_SB_') that
// identifies the market. Shared across every book in BOOK_PREFIXES.
const MARKET_SUFFIXES = [
  { suffix: 'SB_ExactaMatchup', market: 'superbowl_matchup', label: 'Super Bowl Exact Matchup' },
  { suffix: 'SBMatchup', market: 'superbowl_matchup', label: 'Super Bowl Exact Matchup' },
  { suffix: 'SB_', market: 'superbowl', label: 'Super Bowl Winner' },
  { suffix: 'Conf_', market: 'conference', label: 'Conference Winner' },
  { suffix: 'Div_', market: 'division', label: 'Division Winner' },
  { suffix: 'RegWins', market: 'wins', label: 'Regular Season Win Totals' },
  // 2026-09-03 fix (Andy, production-readiness pass): the 2026-08-29 batch
  // used 'BEO_WinTotals1/2/3_0829.PNG' instead of the 'BEO_RegWins*' prefix
  // every prior batch used - this script's prefix list was never updated, so
  // it silently skipped exactly the win-totals screenshots that this whole
  // investigation started from (Packers Win Total Over 9.5). A skip just
  // logs a one-line warning, not an error, so this would have gone unnoticed
  // again. Accept both spellings going forward.
  { suffix: 'WinTotals', market: 'wins', label: 'Regular Season Win Totals' },
  { suffix: 'MakePlayoffs', market: 'playoffs', label: 'Make/Miss Playoffs' },
  { suffix: 'Seeding_Exacta', market: 'exacta', label: 'Seeding / Exacta' },
  { suffix: 'Exacta', market: 'exacta', label: 'Seeding / Exacta' },
];

// Cross product of every book prefix x every market suffix, longest prefix
// first so a more-specific prefix (e.g. BEO_SB_ExactaMatchup) always wins
// over a shorter one (BEO_SB_) that happens to be a literal prefix of it.
// Matching is case-insensitive.
const PREFIX_MARKET_MAP = BOOK_PREFIXES.flatMap((b) =>
  MARKET_SUFFIXES.map((m) => ({
    prefix: b.prefix + m.suffix,
    market: m.market,
    label: m.label,
    book: b.book,
    bookLabel: b.label,
  })),
).sort((a, b) => b.prefix.length - a.prefix.length);

function promptFor(market) {
  const common = 'Extract ONLY what is visible in this sportsbook futures odds screenshot. Do not guess or invent teams/prices that aren\'t shown. Return ONLY a valid JSON array, no prose.';
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
  const fallbackBook = arg('--book', 'betonline');
  const season = parseInt(arg('--season', String(new Date(date).getFullYear())), 10);
  const capturedAt = `${date}T12:00:00Z`;

  console.log('=======================================================');
  console.log(`  Futures Screenshot Ingestion — ${date} (season=${season})`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no Supabase write, no archive move)' : 'LIVE (will write to Supabase + archive screenshots)'}`);
  console.log('=======================================================\n');

  const env = loadEnv();
  const { matched, unmatched } = findScreenshots();

  if (unmatched.length) {
    console.warn(`[warn] ${unmatched.length} image file(s) in docs/Futures_Odds/ did not match a known book+market prefix and were skipped:`);
    for (const f of unmatched) console.warn(`  - ${f}`);
    console.warn('  (see BOOK_PREFIXES / MARKET_SUFFIXES in this script if a new book or market/prefix needs to be added)\n');
  }

  if (!matched.length) {
    console.log('No new futures screenshots found in docs/Futures_Odds/ (matching a known prefix). Nothing to do.');
    return;
  }

  console.log(`Found ${matched.length} screenshot(s) to process:`);
  for (const m of matched) console.log(`  ${m.file} -> book=${m.book || fallbackBook} market=${m.market}`);
  console.log('');

  // Group matched files by book so a mixed folder (e.g. BEO_* + BUS_*
  // dropped in on the same day) produces one clean, independent batch per
  // book rather than one file mixing books together.
  const byBook = new Map();
  for (const m of matched) {
    const book = m.book || fallbackBook;
    if (!byBook.has(book)) byBook.set(book, []);
    byBook.get(book).push(m);
  }

  let grandTotalRows = 0;
  let grandTotalAnomalies = 0;

  for (const [book, bookMatched] of byBook) {
    const bookLabel = bookMatched[0].bookLabel || BOOK_LABEL_BY_KEY[book] || (book.charAt(0).toUpperCase() + book.slice(1));
    console.log(`\n------- Book: ${bookLabel} (${book}) — ${bookMatched.length} screenshot(s) -------`);

    const allRows = [];
    const allAnomalies = [];
    const byMarket = {};

    for (const m of bookMatched) {
      console.log(`[OCR] ${m.file} (${m.label})...`);
      const filePath = path.join(SCREENSHOT_DIR, m.file);
      const parsed = await ocrScreenshot(env, filePath, m.market);
      console.log(`  -> extracted ${parsed.length} raw item(s)`);

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

    console.log(`Total normalized rows for ${bookLabel}: ${allRows.length}`);
    if (allAnomalies.length) {
      console.log(`ANOMALIES (${allAnomalies.length}) — rows dropped, not written:`);
      for (const a of allAnomalies) console.log(`  ! ${a}`);
    } else {
      console.log('No anomalies — every extracted row normalized cleanly.');
    }

    for (const r of allRows) byMarket[r.market_type] = (byMarket[r.market_type] || 0) + 1;
    console.log('Rows by market_type (post-normalization):');
    for (const [k, v] of Object.entries(byMarket).sort()) console.log(`  ${k}: ${v}`);

    // ── Write the flat-array JSON file ────────────────────────────────────
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
    const jsonPath = path.join(IMPORTS_DIR, `${book}-${date}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(allRows, null, 2), 'utf8');
    console.log(`Wrote ${jsonPath}`);

    // ── Write the review markdown ──────────────────────────────────────────
    const mdPath = path.join(DOCS_DIR, `FUTURES_ODDS_${bookLabel.toUpperCase().replace(/[^A-Z0-9]+/g, '')}_${date}_MANUAL_REVIEW.md`);
    const mdLines = [
      `# ${bookLabel} Futures Odds — Manual Review (${date})`,
      '',
      `**Snapshot Time:** \`${capturedAt}\``,
      `**Book:** \`${book}\``,
      `**Total Normalized Records:** \`${allRows.length}\``,
      `**Persistence Status:** \`${DRY_RUN ? 'local_only_dry_run' : 'pending_supabase_write'}\``,
      `**Source Screenshots:** ${bookMatched.map((m) => `\`${m.file}\``).join(', ')}`,
      '',
      '## Market Record Breakdown',
      ...Object.entries(byMarket).sort().map(([k, v]) => `- ${k}: \`${v}\``),
    ];
    if (allAnomalies.length) {
      mdLines.push('', '## Anomalies (dropped rows)', ...allAnomalies.map((a) => `- ${a}`));
    }
    fs.writeFileSync(mdPath, mdLines.join('\n') + '\n', 'utf8');
    console.log(`Wrote ${mdPath}`);

    grandTotalRows += allRows.length;
    grandTotalAnomalies += allAnomalies.length;

    if (DRY_RUN) {
      console.log(`[dry-run] No Supabase write performed for ${bookLabel}, no screenshots archived.`);
      continue;
    }

    // ── Upsert into Supabase ──────────────────────────────────────────────
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
    console.log(`OK — upserted ${written} row(s) into futures_odds_snapshots for ${bookLabel}.`);
    const persistedAt = new Date().toISOString();
    const persistedReview = fs.readFileSync(mdPath, 'utf8').replace(
      '**Persistence Status:** `pending_supabase_write`',
      `**Persistence Status:** \`persisted\` (${written} rows verified written at \`${persistedAt}\`)`,
    );
    fs.writeFileSync(mdPath, persistedReview, 'utf8');

    // ── Archive the processed screenshots ──────────────────────────────────
    const archiveDir = path.join(ARCHIVE_ROOT, `${bookLabel}_${date}`);
    fs.mkdirSync(archiveDir, { recursive: true });
    for (const m of bookMatched) {
      const from = path.join(SCREENSHOT_DIR, m.file);
      const to = path.join(archiveDir, m.file);
      fs.renameSync(from, to);
    }
    console.log(`Archived ${bookMatched.length} screenshot(s) to ${archiveDir}`);
  }

  if (unmatched.length) {
    console.warn(`\n[warn] ${unmatched.length} file(s) skipped for no matching prefix (see above) — none archived.`);
  }
  console.log(`\n=== Done: ${grandTotalRows} row(s) across ${byBook.size} book(s), ${grandTotalAnomalies} anomaly(ies) ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
