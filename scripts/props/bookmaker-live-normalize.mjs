import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

// Bookmaker.eu's live prop capture (schema `bookmaker_live_markets_v1`) is
// produced by an agent reading the rendered DOM directly -- there is no
// committed extractor script (unlike BetOnline's betonline-live-parser.mjs)
// -- so bugs in that ad hoc capture show up as bad data in the artifact
// itself, not as a bug in checked-in code. This module normalizes that
// artifact after the fact, correcting two regressions found 2026-09-21
// against the NYG @ LAR MNF capture:
//
// 1. TD-scorer rows (first_td / atd_1_plus / td_2_plus / td_3_plus) had
//    their `player` field set to the section title (e.g. "Player To Score
//    1st Touchdown") instead of the actual player name -- the real name
//    was still present, uncorrupted, in `selection`.
// 2. `carries` rows were misclassified as `unknown` because their section
//    titles picked up a new "<Away> vs <Home>: " game prefix (e.g. "Giants
//    vs Rams: Jaxson Dart Carries") that the upstream classification never
//    stripped before matching against known market patterns.
//
// Both fixes are conservative and data-only: nothing here re-derives odds
// or invents rows, it only repairs `player`/`market` on rows the capture
// already produced.

const TD_SCORER_MARKETS = new Set(['first_td', 'atd_1_plus', 'td_2_plus', 'td_3_plus']);

// Matches a leading "<Team A> vs <Team B>" (optionally with a stray space
// before the colon, as seen live) game-prefix on a section title, e.g.
// "Giants vs Rams: Jaxson Dart Carries" -> "Jaxson Dart Carries".
const GAME_PREFIX_RE = /^.{2,40}?\svs\s.{2,40}?\s*:\s*/i;

const CARRIES_SECTION_RE = /^(.+?)\s+Carries$/i;

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function stripGamePrefix(title = '') {
  return clean(String(title).replace(GAME_PREFIX_RE, ''));
}

function fixTdScorerPlayer(row) {
  const strippedTitle = stripGamePrefix(row.sectionTitle);
  // Only touch rows where the capture actually fell into the bug -- i.e.
  // `player` still reads like the section title, not a real name. A row
  // some future capture already gets right (player already differs from
  // the stripped title) is left untouched.
  if (row.player !== strippedTitle) return { row, fixed: false };
  const realPlayer = clean(row.selection);
  if (!realPlayer) return { row, fixed: false };
  return { row: { ...row, player: realPlayer }, fixed: true };
}

function fixMisclassifiedCarries(row) {
  if (row.market !== 'unknown') return { row, fixed: false };
  const strippedTitle = stripGamePrefix(row.sectionTitle);
  const match = strippedTitle.match(CARRIES_SECTION_RE);
  if (!match) return { row, fixed: false };
  const player = clean(match[1]);
  if (!player) return { row, fixed: false };
  return { row: { ...row, market: 'carries', player }, fixed: true };
}

export function normalizeBookmakerLiveCapture(payload = {}) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  let tdScorerFixed = 0;
  let carriesFixed = 0;

  const normalizedRows = rows.map((row) => {
    let current = row;

    if (TD_SCORER_MARKETS.has(current.market)) {
      const { row: fixedRow, fixed } = fixTdScorerPlayer(current);
      current = fixedRow;
      if (fixed) tdScorerFixed += 1;
    }

    const { row: fixedRow, fixed } = fixMisclassifiedCarries(current);
    current = fixedRow;
    if (fixed) carriesFixed += 1;

    return current;
  });

  const marketCounts = normalizedRows.reduce((acc, row) => {
    acc[row.market] = (acc[row.market] || 0) + 1;
    return acc;
  }, {});

  return {
    ...payload,
    rows: normalizedRows,
    summary: {
      ...(payload.summary || {}),
      markets: marketCounts,
      rows: normalizedRows.length,
    },
    normalization: {
      appliedAt: new Date().toISOString(),
      tdScorerPlayerFieldFixed: tdScorerFixed,
      carriesReclassified: carriesFixed,
    },
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback = null) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const input = arg('--in');
  const output = arg('--out');
  if (!input || !output) {
    console.error('Usage: node scripts/props/bookmaker-live-normalize.mjs --in <raw-capture.json> --out <normalized.json>');
    process.exit(2);
  }

  const payload = JSON.parse(await readFile(input, 'utf8'));
  const normalized = normalizeBookmakerLiveCapture(payload);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  console.log(
    `Normalized ${normalized.rows.length} rows -> ${output} `
    + `(td-scorer player fixed: ${normalized.normalization.tdScorerPlayerFieldFixed}, `
    + `carries reclassified: ${normalized.normalization.carriesReclassified})`,
  );
}

if (typeof process !== 'undefined' && process.argv?.[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(`Bookmaker live normalizer failed: ${error.message}`);
    process.exit(1);
  });
}
