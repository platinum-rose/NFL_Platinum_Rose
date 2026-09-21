#!/usr/bin/env node
// agents/supercontest-clv.js
//
// Joins a captured week of SuperContest lines (data/supercontest/week-<NN>-
// lines.json, from agents/supercontest-lines-ingest.js) against this
// project's own `games` table in Supabase to attach: the real game_id and
// kickoff time (both UTC and Andy's local Pacific time, via a proper
// timeZone-aware Intl formatter -- never manual UTC offset math, per
// RULES.md's date-handling guardrails), and the live closing spread line
// for CLV (closing-line-value) comparison against the contest's locked
// number.
//
// Convention note (verified against agents/portfolio-dossier.js's own CLV
// code, which comments 'positive = closing line moved MORE toward home
// favorite' for `closing - openSpread`): games.closing_spread_line is the
// AWAY team's spread -- negative means the away team is favored, positive
// means the home team is favored. This script derives the closing
// favorite/magnitude from that sign directly rather than assuming a
// home-relative convention.
//
// Usage:
//   node agents/supercontest-clv.js --week 1 [--dry-run]
//   (defaults to whatever data/supercontest/latest.json currently holds if
//   --week is omitted)
//
// Output:
//   data/supercontest/week-<NN>-clv.json   -- one row per game with both
//     numbers side by side; re-run any time before kickoff to refresh
//     against the latest closing_spread_line (it moves right up to kickoff;
//     the source contest line never does).

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'supercontest');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArgs(argv) {
  const out = { dryRun: false, week: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') out.dryRun = true;
    else if (argv[i] === '--week') out.week = Number(argv[++i]);
  }
  return out;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

const PT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

async function main() {
  const { dryRun, week: weekArg } = parseArgs(process.argv.slice(2));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env');
  }

  let contestData;
  if (weekArg) {
    const weekFile = path.join(OUT_DIR, `week-${String(weekArg).padStart(2, '0')}-lines.json`);
    contestData = await readJsonIfExists(weekFile);
    if (!contestData) throw new Error(`No captured lines file found at ${weekFile} -- run agents/supercontest-lines-ingest.js first.`);
  } else {
    contestData = await readJsonIfExists(path.join(OUT_DIR, 'latest.json'));
    if (!contestData) throw new Error('No data/supercontest/latest.json found -- run agents/supercontest-lines-ingest.js first.');
  }

  const { week, season } = contestData;
  console.log(`Joining Week ${week} (season ${season}) SuperContest lines against games table...`);

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: games, error } = await sb
    .from('games')
    .select('game_id, home_team, away_team, home_abbrev, away_abbrev, kickoff_utc, closing_spread_line, closing_home_moneyline, closing_away_moneyline, status')
    .eq('season', season)
    .eq('week', week);
  if (error) throw error;

  const byPair = new Map();
  for (const g of games) {
    const home = normalizeTeam(g.home_team) || normalizeTeam(g.home_abbrev);
    const away = normalizeTeam(g.away_team) || normalizeTeam(g.away_abbrev);
    if (!home || !away) continue;
    byPair.set(`${home}|${away}`, g);
  }

  const enriched = [];
  const unmatched = [];
  for (const cg of contestData.games) {
    const home = cg.home_team;
    const away = cg.away_team;
    const match = (home && away) ? byPair.get(`${home}|${away}`) : null;
    if (!match) {
      unmatched.push(`${away} @ ${home}`);
      enriched.push({ ...cg, game_id: null, kickoff_utc: null, kickoff_pt: null, closing_spread_line_away_relative: null, closing_favorite_team: null, closing_line_magnitude: null, side_agrees: null, clv_points: null, clv_note: 'No matching games-table row found for this team pair/week.' });
      continue;
    }

    const kickoffUtc = match.kickoff_utc;
    const kickoffPt = kickoffUtc ? PT_FORMATTER.format(new Date(kickoffUtc)) : null;
    const closingSpread = match.closing_spread_line; // away-team-relative; negative = away favored
    let closingFavorite = null;
    let closingMagnitude = null;
    if (closingSpread != null) {
      closingFavorite = closingSpread < 0 ? away : (closingSpread > 0 ? home : null); // null = pick'em
      closingMagnitude = Math.abs(closingSpread);
    }

    const contestFavorite = cg.favorite_team;
    const contestMagnitude = Math.abs(cg.contest_line);

    let sideAgrees = null;
    let clvPoints = null;
    let clvNote = null;
    if (closingSpread == null) {
      clvNote = 'Closing line not yet posted/settled for this game -- re-run closer to kickoff.';
    } else if (closingFavorite === null) {
      sideAgrees = false;
      clvNote = `Market has moved to a pick'em (0) since the contest line locked ${contestFavorite} ${cg.contest_line}.`;
    } else if (closingFavorite === contestFavorite) {
      sideAgrees = true;
      clvPoints = +(contestMagnitude - closingMagnitude).toFixed(1);
      // clvPoints = contestMagnitude - closingMagnitude.
      // clvPoints > 0 means the favorite's spread SHRUNK since the contest
      // locked (line drifted toward pick'em) -- that's good CLV for the DOG
      // (an early dog bettor got more points than the market later thought
      // was fair) and bad CLV for the favorite. clvPoints < 0 means the
      // spread GREW (line moved further toward the favorite) -- good CLV
      // for the favorite, bad for the dog. (Fixed 2026-09-09: this note text
      // previously had the favorite/dog labels backwards -- Andy caught it
      // by comparing against live BKR lines. The clvPoints number itself was
      // always computed correctly; only this text was wrong.)
      clvNote = clvPoints === 0
        ? 'No line movement since the contest locked -- exact match.'
        : clvPoints > 0
          ? `Market has drifted AWAY from ${contestFavorite} since lock -- the closing number (${contestFavorite} -${closingMagnitude}) is a smaller favorite than the contest's locked number (${contestFavorite} ${cg.contest_line}), by ${Math.abs(clvPoints)} pt(s). Good CLV if you took the dog; bad CLV if you took the favorite.`
          : `Market has tightened toward ${contestFavorite} since lock -- the closing number (${contestFavorite} -${closingMagnitude}) is a bigger favorite than the contest's locked number (${contestFavorite} ${cg.contest_line}), by ${Math.abs(clvPoints)} pt(s). Good CLV if you took the favorite; bad CLV if you took the dog.`;
    } else {
      sideAgrees = false;
      clvNote = `Line has CROSSED sides: contest locked ${contestFavorite} ${cg.contest_line}, market now favors ${closingFavorite} by ${closingMagnitude}. Not a simple point comparison -- whichever side you took at contest lock, the market has moved fully past pick'em against your number's framing.`;
    }

    enriched.push({
      ...cg,
      game_id: match.game_id,
      kickoff_utc: kickoffUtc,
      kickoff_pt: kickoffPt,
      closing_spread_line_away_relative: closingSpread,
      closing_favorite_team: closingFavorite,
      closing_line_magnitude: closingMagnitude,
      side_agrees: sideAgrees,
      clv_points: clvPoints,
      clv_note: clvNote,
    });
  }

  if (unmatched.length) {
    console.warn(`WARNING: ${unmatched.length} game(s) had no match in the games table: ${unmatched.join('; ')}`);
  }

  const payload = {
    schema_version: '1.0',
    season,
    week,
    contest_source: contestData.source,
    contest_captured_at: contestData.captured_at,
    clv_computed_at: new Date().toISOString(),
    games: enriched,
  };

  const outFile = path.join(OUT_DIR, `week-${String(week).padStart(2, '0')}-clv.json`);
  if (dryRun) {
    console.log(`[dry-run] Would write ${outFile}`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outFile}`);

  console.log('\nSummary:');
  for (const g of enriched) {
    console.log(`  ${g.away_team} @ ${g.home_team} | contest: ${g.favorite_team} ${g.contest_line} | closing: ${g.closing_favorite_team ? `${g.closing_favorite_team} -${g.closing_line_magnitude}` : (g.closing_spread_line_away_relative === null && g.game_id ? "pick'em" : 'n/a')} | ${g.kickoff_pt || 'kickoff unknown'}`);
  }
}

main().catch((err) => {
  console.error('supercontest-clv failed:', err.message);
  process.exitCode = 1;
});
