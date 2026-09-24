#!/usr/bin/env node
// agents/supercontest-lines-ingest.js
//
// Captures the weekly line sheet from nfl-supercontest.com's public
// weekly_lines_table.php page. These are the Westgate/SuperContest-style
// FIXED contest lines Andy pools his 5-picks-of-the-week against -- they
// lock once published and never move again, unlike the live sportsbook
// market (see agents/futures-odds-ingest.js etc. for that side). The whole
// point of capturing them is to freeze the number at publish time so it can
// be compared against the live closing line later for CLV (contest_line vs
// closing_line -> clv_edge, matching the schema already stubbed out in
// scripts/official-pick-ledger.js's supercontest_ats market type).
//
// The page's own HTML has a client-side JS redirect to login.php
// (`window.location.href="login.php"`), but that's a browser-only redirect
// -- a real HTTP GET (curl, node fetch) still receives the full table in
// the response body regardless, no authentication needed. Confirmed live
// 2026-09-09. If that ever stops being true (site adds real server-side
// auth), this script will start seeing 0 rows and should fail loudly
// rather than silently write an empty file -- see the row-count guard
// below.
//
// Usage:
//   node agents/supercontest-lines-ingest.js              # fetch + write
//   node agents/supercontest-lines-ingest.js --dry-run     # fetch + print, no write
//
// Output:
//   data/supercontest/week-<NN>-lines.json   -- one immutable file per week
//   data/supercontest/latest.json            -- pointer + copy of the newest week
//
// Idempotent: re-running against a week that's already captured with
// identical content is a no-op (reports "unchanged"). If the site is still
// showing last week's lines (not yet published), the script detects the
// week number hasn't advanced and exits without overwriting anything --
// this is exactly the "lines published late" case Andy flagged; re-run
// manually once they're up.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeTeam } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_URL = 'https://www.nfl-supercontest.com/src/weekly_lines_table.php';
const OUT_DIR = path.join(ROOT, 'data', 'supercontest');

function usage() {
  return 'Usage: node agents/supercontest-lines-ingest.js [--dry-run]';
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Platinum-Rose-Ingest/1.0',
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseWeeklyLines(html) {
  const titleMatch = html.match(/<div class="formTitle">\s*Week\s+(\d+)\s+Lines\s*<\/div>/i);
  if (!titleMatch) {
    throw new Error('Could not find "Week N Lines" title in page -- page structure may have changed.');
  }
  const week = Number(titleMatch[1]);

  // Pull every <tr>...</tr> that contains exactly 4 <td> cells (skip the
  // header row, which uses <th>).
  const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gis;
  const games = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    const [, favRaw, lineRaw, dogRaw, kickoffRaw] = m;
    const favHome = /\+\+/.test(favRaw);
    const dogHome = /\+\+/.test(dogRaw);
    const favAbbr = decodeEntities(favRaw).replace(/\+\+/g, '').trim();
    const dogAbbr = decodeEntities(dogRaw).replace(/\+\+/g, '').trim();
    const line = Number(decodeEntities(lineRaw).replace(/[^0-9.+-]/g, ''));
    const kickoffParts = decodeEntities(kickoffRaw.replace(/<br\s*\/?>/gi, '|')).split('|');
    const kickoffDay = (kickoffParts[0] || '').trim();
    const kickoffTimeEt = (kickoffParts[1] || '').trim();

    if (!favAbbr || !dogAbbr || !Number.isFinite(line)) {
      continue; // dropped, reported as anomaly below
    }

    const favoriteTeam = normalizeTeam(favAbbr);
    const underdogTeam = normalizeTeam(dogAbbr);

    games.push({
      favorite_abbr: favAbbr,
      favorite_team: favoriteTeam,
      underdog_abbr: dogAbbr,
      underdog_team: underdogTeam,
      contest_line: line, // favorite's line, e.g. -3.5 (always negative/favorite-relative)
      home_team: favHome ? favoriteTeam : (dogHome ? underdogTeam : null),
      away_team: favHome ? underdogTeam : (dogHome ? favoriteTeam : null),
      kickoff_day: kickoffDay, // e.g. "Sun" -- no absolute date on the source page
      kickoff_time_et: kickoffTimeEt, // e.g. "1:00 pm", Eastern per page's own "All Times Eastern" note
    });
  }

  return { week, games };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return;
  }
  const dryRun = args.includes('--dry-run');

  console.log(`Fetching ${SOURCE_URL} ...`);
  const html = await fetchHtml(SOURCE_URL);
  const { week, games } = parseWeeklyLines(html);

  if (games.length === 0) {
    // Fail loudly rather than silently writing an empty file -- see the
    // header note on the login.php redirect being JS-only. If this ever
    // fires, the site has changed and needs a look before trusting it.
    throw new Error('Parsed 0 games from the page -- source structure may have changed or the page did not return the table. Refusing to write.');
  }
  if (games.length !== 16) {
    console.warn(`WARNING: expected 16 games, parsed ${games.length}. Some rows may not have matched the expected shape -- inspect before trusting this batch.`);
  }
  const unresolved = games.filter((g) => !g.favorite_team || !g.underdog_team);
  if (unresolved.length) {
    console.warn(`WARNING: ${unresolved.length} row(s) failed team normalization:`, unresolved.map((g) => `${g.favorite_abbr}/${g.underdog_abbr}`).join(', '));
  }

  const capturedAt = new Date().toISOString();
  const weekFile = path.join(OUT_DIR, `week-${String(week).padStart(2, '0')}-lines.json`);
  const latestFile = path.join(OUT_DIR, 'latest.json');

  const existing = await readJsonIfExists(weekFile);
  const payload = {
    schema_version: '1.0',
    source: SOURCE_URL,
    source_note: 'Public page; client-side JS redirects to login.php in a browser but the raw HTTP response includes the full table with no auth required (confirmed 2026-09-09).',
    season: new Date().getFullYear(),
    week,
    captured_at: capturedAt,
    game_count: games.length,
    games,
  };

  if (existing && JSON.stringify(existing.games) === JSON.stringify(games)) {
    console.log(`Week ${week} lines already captured and unchanged (last captured ${existing.captured_at}). No write needed.`);
    return;
  }

  if (existing) {
    console.log(`Week ${week} file already exists from ${existing.captured_at} but content differs -- this should not normally happen for a "locked" contest line. Overwriting with today's capture; previous content is only in git history / prior file if you had committed it.`);
  }

  if (dryRun) {
    console.log(`[dry-run] Would write ${weekFile} and update latest.json with ${games.length} games for Week ${week}.`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(weekFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(latestFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${weekFile}`);
  console.log(`Wrote ${latestFile}`);
  console.log(`Week ${week}: ${games.length} games captured.`);
}

main().catch((err) => {
  console.error('supercontest-lines-ingest failed:', err.message);
  process.exitCode = 1;
});
