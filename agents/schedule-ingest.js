// agents/schedule-ingest.js
// DS-2: ESPN schedule -> canonical games table + public/schedule.json cache.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

import { getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CACHE_PATH = path.join(ROOT, 'public', 'schedule.json');

const ESPN_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

const DEFAULT_YEAR = 2026;
const DEFAULT_SEASON_TYPE = 2; // regular season
const DEFAULT_START_WEEK = 1;
const DEFAULT_END_WEEK = 18;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

function parseArgs(argv) {
  const out = {
    year: DEFAULT_YEAR,
    seasonType: DEFAULT_SEASON_TYPE,
    startWeek: DEFAULT_START_WEEK,
    endWeek: DEFAULT_END_WEEK,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--year') out.year = Number(argv[++i]);
    else if (arg === '--season-type') out.seasonType = Number(argv[++i]);
    else if (arg === '--start-week') out.startWeek = Number(argv[++i]);
    else if (arg === '--end-week') out.endWeek = Number(argv[++i]);
    else if (arg === '--dry-run') out.dryRun = true;
  }

  if (Number.isNaN(out.year) || Number.isNaN(out.startWeek) || Number.isNaN(out.endWeek)) {
    throw new Error('Invalid numeric flag value.');
  }
  if (out.startWeek > out.endWeek) {
    throw new Error('--start-week cannot be greater than --end-week');
  }

  return out;
}

function canonicalFromEspnTeam(teamObj) {
  const display = teamObj?.displayName || teamObj?.name || '';
  const abbr = teamObj?.abbreviation || '';

  const canonical = normalizeTeam(display) || normalizeTeam(abbr) || display || abbr;
  const stdAbbr = getTeamAbbreviation(canonical) || String(abbr).toUpperCase();

  return {
    canonical,
    abbreviation: stdAbbr,
    displayName: display || canonical,
  };
}

function makeGameId({ season, seasonType, week, awayAbbrev, homeAbbrev }) {
  const a = String(awayAbbrev || 'UNK').toUpperCase();
  const h = String(homeAbbrev || 'UNK').toUpperCase();
  return `nfl_${season}_${seasonType}_w${String(week).padStart(2, '0')}_${a}_at_${h}`;
}

async function fetchWeek(year, seasonType, week) {
  const url =
    `${ESPN_SCOREBOARD}?dates=${year}&seasontype=${seasonType}&week=${week}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`ESPN request failed for week ${week}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const events = Array.isArray(data.events) ? data.events : [];
  const rows = [];

  for (const event of events) {
    const comp = event?.competitions?.[0];
    const comps = comp?.competitors || [];
    const homeRaw = comps.find((c) => c.homeAway === 'home')?.team;
    const awayRaw = comps.find((c) => c.homeAway === 'away')?.team;
    if (!homeRaw || !awayRaw || !comp?.date) continue;

    const home = canonicalFromEspnTeam(homeRaw);
    const away = canonicalFromEspnTeam(awayRaw);
    const kickoffUtc = new Date(comp.date).toISOString();
    const status = event?.status?.type?.state || event?.status?.type?.name || 'scheduled';
    const odds = comp?.odds?.[0];

    const gameId = makeGameId({
      season: year,
      seasonType,
      week,
      awayAbbrev: away.abbreviation,
      homeAbbrev: home.abbreviation,
    });

    rows.push({
      game_id: gameId,
      espn_event_id: String(event.id),
      season: year,
      season_type: seasonType,
      week,
      kickoff_utc: kickoffUtc,
      home_team: home.canonical,
      away_team: away.canonical,
      home_abbrev: home.abbreviation,
      away_abbrev: away.abbreviation,
      status,
      updated_at: new Date().toISOString(),

      // Frontend cache compatibility fields
      id: String(event.id),
      visitor: away.abbreviation,
      home: home.abbreviation,
      visitorName: away.displayName,
      homeName: home.displayName,
      time: new Date(kickoffUtc).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      }).replace(':00 ', ' '),
      spread: Number(odds?.spread ?? 0) || 0,
      total: Number(odds?.overUnder ?? 0) || 0,
    });
  }

  return rows;
}

function buildSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function validateRows(rows) {
  const dupes = new Set();
  const seen = new Set();
  const weekSet = new Set();

  for (const row of rows) {
    weekSet.add(row.week);
    if (seen.has(row.game_id)) dupes.add(row.game_id);
    seen.add(row.game_id);
  }

  return {
    total: rows.length,
    weeks: Array.from(weekSet).sort((a, b) => a - b),
    duplicateCount: dupes.size,
    duplicateIds: Array.from(dupes),
  };
}

async function upsertGames(supabase, rows) {
  const dbRows = rows.map((r) => ({
    game_id: r.game_id,
    espn_event_id: r.espn_event_id,
    season: r.season,
    season_type: r.season_type,
    week: r.week,
    kickoff_utc: r.kickoff_utc,
    home_team: r.home_team,
    away_team: r.away_team,
    home_abbrev: r.home_abbrev,
    away_abbrev: r.away_abbrev,
    status: r.status,
    updated_at: r.updated_at,
  }));

  const { error } = await supabase
    .from('games')
    .upsert(dbRows, { onConflict: 'game_id' });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }
}

function writeScheduleCache(rows) {
  const cacheRows = rows
    .map((r) => ({
      id: r.id,
      game_id: r.game_id,
      week: r.week,
      season: r.season,
      season_type: r.season_type,
      kickoff_utc: r.kickoff_utc,
      status: r.status,
      visitor: r.visitor,
      home: r.home,
      visitorName: r.visitorName,
      homeName: r.homeName,
      time: r.time,
      spread: r.spread,
      total: r.total,
    }))
    .sort((a, b) => new Date(a.kickoff_utc) - new Date(b.kickoff_utc));

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheRows, null, 2));
}

async function run() {
  const cfg = parseArgs(process.argv.slice(2));
  console.log(`\n[${new Date().toISOString()}] ScheduleIngestAgent start`);
  console.log(
    `  year=${cfg.year} seasonType=${cfg.seasonType} weeks=${cfg.startWeek}-${cfg.endWeek} dryRun=${cfg.dryRun}`
  );

  const allRows = [];
  for (let week = cfg.startWeek; week <= cfg.endWeek; week += 1) {
    const rows = await fetchWeek(cfg.year, cfg.seasonType, week);
    console.log(`  Week ${week}: ${rows.length} game(s)`);
    allRows.push(...rows);
  }

  const validation = validateRows(allRows);
  console.log(`  Total rows: ${validation.total}`);
  console.log(`  Weeks covered: ${validation.weeks.join(', ') || '(none)'}`);
  console.log(`  Duplicate game_id count: ${validation.duplicateCount}`);
  if (validation.duplicateCount > 0) {
    console.warn(`  Duplicate IDs: ${validation.duplicateIds.slice(0, 5).join(', ')}`);
  }

  writeScheduleCache(allRows);
  console.log(`  Cache updated: ${CACHE_PATH}`);

  if (cfg.dryRun) {
    console.log('  Dry run enabled: skipping Supabase upsert.');
    return;
  }

  const supabase = buildSupabaseClient();
  if (!supabase) {
    console.log('  Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY: skipping DB upsert.');
    return;
  }

  await upsertGames(supabase, allRows);
  console.log('  Supabase upsert complete: games table updated.');
}

run().catch((err) => {
  console.error('ScheduleIngestAgent error:', err.message);
  process.exit(1);
});
