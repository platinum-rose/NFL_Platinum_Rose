// agents/pick-extraction.js
// PickExtractionAgent — promotes extracted picks from podcast_transcripts
// into the user_picks table so they appear in the app's Picks Tracker.
//
// Runtime:    Node.js 20+ ESM (GitHub Actions)
// Trigger:    After podcast-ingest workflow completes (workflow_run) + manual
// Env vars:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional:   DRY_RUN=true  — log picks without writing to Supabase
//             SCHEDULE_URL  — override URL for schedule.json (default: GitHub raw)

import 'dotenv/config'; // load .env for local runs (no-op in CI where secrets are real env vars)
import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN      = process.env.DRY_RUN === 'true';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Schedule.json lives in the repo — fetch from GitHub raw so the agent always
// uses the same data as the deployed app.
const SCHEDULE_URL = process.env.SCHEDULE_URL ??
  'https://raw.githubusercontent.com/andrewlrose/NFL_Platinum_Rose/main/public/schedule.json';

// ─── Team alias map ───────────────────────────────────────────────────────────
// Maps lowercase team names, cities, nicknames, and abbreviations → canonical abbreviation.
// This is a standalone copy so the agent doesn't depend on the React src/ tree.

const TEAM_ALIASES = {
  // Cardinals
  'arizona': 'ARI', 'cardinals': 'ARI', 'arizona cardinals': 'ARI',
  'cards': 'ARI', 'ari': 'ARI', 'az': 'ARI',
  // Falcons
  'atlanta': 'ATL', 'falcons': 'ATL', 'atlanta falcons': 'ATL',
  'atl': 'ATL', 'dirty birds': 'ATL',
  // Ravens
  'baltimore': 'BAL', 'ravens': 'BAL', 'baltimore ravens': 'BAL',
  'bal': 'BAL', 'balt': 'BAL',
  // Bills
  'buffalo': 'BUF', 'bills': 'BUF', 'buffalo bills': 'BUF',
  'buf': 'BUF', 'buff': 'BUF',
  // Panthers
  'carolina': 'CAR', 'panthers': 'CAR', 'carolina panthers': 'CAR',
  'car': 'CAR',
  // Bears
  'chicago': 'CHI', 'bears': 'CHI', 'chicago bears': 'CHI',
  'chi': 'CHI',
  // Bengals
  'cincinnati': 'CIN', 'bengals': 'CIN', 'cincinnati bengals': 'CIN',
  'cin': 'CIN', 'bungles': 'CIN',
  // Browns
  'cleveland': 'CLE', 'browns': 'CLE', 'cleveland browns': 'CLE',
  'cle': 'CLE',
  // Cowboys
  'dallas': 'DAL', 'cowboys': 'DAL', 'dallas cowboys': 'DAL',
  'dal': 'DAL', 'america\'s team': 'DAL',
  // Broncos
  'denver': 'DEN', 'broncos': 'DEN', 'denver broncos': 'DEN',
  'den': 'DEN',
  // Lions
  'detroit': 'DET', 'lions': 'DET', 'detroit lions': 'DET',
  'det': 'DET',
  // Packers
  'green bay': 'GB', 'packers': 'GB', 'green bay packers': 'GB',
  'gb': 'GB', 'gbp': 'GB',
  // Texans
  'houston': 'HOU', 'texans': 'HOU', 'houston texans': 'HOU',
  'hou': 'HOU',
  // Colts
  'indianapolis': 'IND', 'colts': 'IND', 'indianapolis colts': 'IND',
  'ind': 'IND', 'indy': 'IND',
  // Jaguars
  'jacksonville': 'JAX', 'jaguars': 'JAX', 'jacksonville jaguars': 'JAX',
  'jax': 'JAX', 'jags': 'JAX',
  // Chiefs
  'kansas city': 'KC', 'chiefs': 'KC', 'kansas city chiefs': 'KC',
  'kc': 'KC',
  // Chargers
  'los angeles chargers': 'LAC', 'la chargers': 'LAC', 'chargers': 'LAC',
  'lac': 'LAC',
  // Rams
  'los angeles rams': 'LAR', 'la rams': 'LAR', 'rams': 'LAR',
  'lar': 'LAR',
  // Raiders
  'las vegas': 'LV', 'raiders': 'LV', 'las vegas raiders': 'LV',
  'lv': 'LV', 'oak': 'LV',
  // Dolphins
  'miami': 'MIA', 'dolphins': 'MIA', 'miami dolphins': 'MIA',
  'mia': 'MIA',
  // Vikings
  'minnesota': 'MIN', 'vikings': 'MIN', 'minnesota vikings': 'MIN',
  'min': 'MIN',
  // Patriots
  'new england': 'NE', 'patriots': 'NE', 'new england patriots': 'NE',
  'ne': 'NE', 'pats': 'NE',
  // Saints
  'new orleans': 'NO', 'saints': 'NO', 'new orleans saints': 'NO',
  'no': 'NO',
  // Giants
  'new york giants': 'NYG', 'giants': 'NYG', 'nyg': 'NYG', 'big blue': 'NYG',
  // Jets
  'new york jets': 'NYJ', 'jets': 'NYJ', 'nyj': 'NYJ',
  // Eagles
  'philadelphia': 'PHI', 'eagles': 'PHI', 'philadelphia eagles': 'PHI',
  'phi': 'PHI', 'philly': 'PHI', 'birds': 'PHI',
  // Steelers
  'pittsburgh': 'PIT', 'steelers': 'PIT', 'pittsburgh steelers': 'PIT',
  'pit': 'PIT',
  // 49ers
  'san francisco': 'SF', '49ers': 'SF', 'san francisco 49ers': 'SF',
  'sf': 'SF', 'niners': 'SF', 'nine': 'SF',
  // Seahawks
  'seattle': 'SEA', 'seahawks': 'SEA', 'seattle seahawks': 'SEA',
  'sea': 'SEA', 'hawks': 'SEA',
  // Buccaneers
  'tampa bay': 'TB', 'buccaneers': 'TB', 'tampa bay buccaneers': 'TB',
  'tb': 'TB', 'bucs': 'TB',
  // Titans
  'tennessee': 'TEN', 'titans': 'TEN', 'tennessee titans': 'TEN',
  'ten': 'TEN',
  // Commanders
  'washington': 'WSH', 'commanders': 'WSH', 'washington commanders': 'WSH',
  'wsh': 'WSH', 'was': 'WSH', 'football team': 'WSH', 'redskins': 'WSH',
};

/** Resolve a free-text team name to its standard abbreviation. Returns null if unrecognised. */
function resolveTeam(name) {
  if (!name) return null;
  return TEAM_ALIASES[name.toLowerCase().trim()] ?? null;
}

// ─── Supabase client ──────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ─── Schedule loader ──────────────────────────────────────────────────────────

/**
 * Fetch schedule.json from GitHub raw. Returns an array of game objects.
 * Shape: [{ id, visitor, home, visitorName, homeName, time, spread, total }]
 */
async function loadSchedule() {
  try {
    const res = await fetch(SCHEDULE_URL, {
      headers: { 'User-Agent': 'NFL-Platinum-Rose-PickExtractor/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`⚠ Schedule fetch failed (HTTP ${res.status}) — will use synthetic game IDs`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`⚠ Schedule fetch error: ${err.message} — will use synthetic game IDs`);
    return [];
  }
}

// ─── Game matching ────────────────────────────────────────────────────────────

/**
 * Build a lookup map: "ABB1_vs_ABB2" → game object (both orderings).
 * This gives O(1) game lookups.
 */
function buildGameLookup(schedule) {
  const lookup = new Map();
  for (const game of schedule) {
    if (!game.home || !game.visitor) continue;
    lookup.set(`${game.home}_vs_${game.visitor}`, game);
    lookup.set(`${game.visitor}_vs_${game.home}`, game);
    lookup.set(game.home, game);              // single-team fallback
    lookup.set(game.visitor, game);           // single-team fallback
  }
  return lookup;
}

/**
 * Attempt to find a matching game for the two team abbreviations.
 * Returns the game object or null.
 */
function findGame(abbr1, abbr2, gameLookup) {
  if (!abbr1) return null;
  if (abbr2) {
    return gameLookup.get(`${abbr1}_vs_${abbr2}`)
        ?? gameLookup.get(`${abbr2}_vs_${abbr1}`)
        ?? null;
  }
  // Single-team fallback — may match wrong game if team plays multiple weeks
  return gameLookup.get(abbr1) ?? null;
}

// ─── Pick transformation ──────────────────────────────────────────────────────

/**
 * Convert a podcast transcript pick (GPT JSON) + episode/feed metadata
 * into a user_picks row.
 *
 * Podcast picks shape:
 *   { selection, team1, team2, type, line, summary, units, confidence, game_date }
 *
 * user_picks shape (target):
 *   { id, game_id, source, pick_type, selection, line, edge, confidence,
 *     home, visitor, game_date, game_time, commence_time, is_home_team, result }
 */
function buildUserPick(pick, index, episode, feedName, gameLookup) {
  const abbr1      = resolveTeam(pick.team1);
  const abbr2      = resolveTeam(pick.team2);
  const game       = findGame(abbr1, abbr2, gameLookup);

  // Resolve canonical home/visitor names from schedule if found
  const homeAbbr    = game?.home    ?? abbr1 ?? pick.team1 ?? '';
  const visitorAbbr = game?.visitor ?? abbr2 ?? pick.team2 ?? '';
  const homeName    = game?.homeName    ?? pick.team1 ?? homeAbbr;
  const visitorName = game?.visitorName ?? pick.team2 ?? visitorAbbr;

  // Generate a deterministic, dedup-safe ID
  const gameId = game?.id ?? `podcast_${abbr1 ?? 'UNK'}_vs_${abbr2 ?? 'UNK'}`;
  const pickId = `EXPERT-${gameId}-${pick.type}-ep${episode.id.slice(0, 8)}-${index}`;

  // Determine if the selected team is the home team
  const selAbbr = resolveTeam(pick.selection);
  let isHomeTeam = false;
  if (selAbbr && game) {
    isHomeTeam = game.home === selAbbr;
  }

  return {
    id:             pickId,
    game_id:        gameId,
    source:         'EXPERT',
    pick_type:      pick.type     ?? 'spread',
    selection:      pick.selection ?? '',
    line:           pick.line     ?? null,
    edge:           0,
    confidence:     typeof pick.confidence === 'number' ? Math.round(pick.confidence) : 65,
    home:           homeName,
    visitor:        visitorName,
    game_date:      pick.game_date ?? null,
    game_time:      game?.time     ?? null,
    commence_time:  null,
    is_home_team:   isHomeTeam,
    result:         'PENDING',
    // Store rationale in a non-schema field — pick tracker reads pick.rationale
    rationale:      pick.summary   ?? '',
    // context: expert name from podcast feed
    expert:         feedName,
    units:          pick.units ?? 1,
    created_at:     new Date().toISOString(),
    updated_at:     new Date().toISOString(),
  };
}

// ─── Main run ─────────────────────────────────────────────────────────────────

async function run() {
  if (!SUPABASE_KEY) { console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (DRY_RUN) console.log('🔍 DRY RUN — no writes to Supabase');

  const supabase = getSupabase();

  // 1. Load schedule for game matching
  console.log('📅 Loading schedule...');
  const schedule   = await loadSchedule();
  const gameLookup = buildGameLookup(schedule);
  console.log(`   ${schedule.length} games loaded`);

  // 2. Fetch unpromoted transcripts with picks
  const { data: transcripts, error: txErr } = await supabase
    .from('podcast_transcripts')
    .select(`
      id,
      picks,
      episode_id,
      picks_promoted_at,
      podcast_episodes (
        id,
        title,
        pub_date,
        podcast_feeds ( name, expert )
      )
    `)
    .is('picks_promoted_at', null)
    .not('picks', 'eq', '[]');

  if (txErr) {
    console.error('❌ Failed to fetch transcripts:', txErr.message);
    process.exit(1);
  }

  if (!transcripts || transcripts.length === 0) {
    console.log('✅ No unpromoted transcripts found — nothing to do');
    return;
  }

  console.log(`\n📋 Found ${transcripts.length} unpromoted transcript(s) with picks\n`);

  let totalPicks    = 0;
  let totalSkipped  = 0;
  let totalUpserted = 0;
  let totalErrors   = 0;

  for (const transcript of transcripts) {
    const episode  = transcript.podcast_episodes;
    const feed     = episode?.podcast_feeds;
    const feedName = feed?.expert ?? feed?.name ?? 'Unknown';
    const title    = episode?.title?.slice(0, 70) ?? '(unknown episode)';

    const picks = Array.isArray(transcript.picks) ? transcript.picks : [];
    console.log(`🎙 "${title}"`);
    console.log(`   Source: ${feedName} | ${picks.length} pick(s)`);

    if (picks.length === 0) {
      // Mark as promoted immediately (nothing to do)
      if (!DRY_RUN) {
        await supabase
          .from('podcast_transcripts')
          .update({ picks_promoted_at: new Date().toISOString() })
          .eq('id', transcript.id);
      }
      continue;
    }

    // Build user_picks rows — skip non-NFL picks (UFC, NBA, etc.)
    const rows = [];
    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];

      // Guard: require at least one team to resolve to a known NFL abbreviation.
      // Picks where neither team matches (e.g. UFC fighters, NBA teams) are
      // silently skipped — they can't be matched or graded in this app.
      const abbr1 = resolveTeam(pick.team1);
      const abbr2 = resolveTeam(pick.team2);
      if (!abbr1 && !abbr2) {
        const t1 = pick.team1 ?? '?';
        const t2 = pick.team2 ?? '?';
        console.log(`   [${i + 1}] ⏭ SKIPPED (non-NFL): "${t1}" vs "${t2}" — ${pick.type ?? 'unknown type'}`);
        totalSkipped++;
        continue;
      }

      try {
        const row = buildUserPick(pick, i, episode, feedName, gameLookup);
        rows.push(row);

        const matchedGame = row.game_id.startsWith('podcast_') ? '(no game match)' : `game ${row.game_id}`;
        console.log(`   [${i + 1}] ${pick.type?.toUpperCase()} — ${pick.selection} ${pick.line ?? ''} → ${matchedGame}`);
        totalPicks++;
      } catch (buildErr) {
        console.error(`   ❌ Failed to build pick ${i}: ${buildErr.message}`);
        totalErrors++;
      }
    }

    if (rows.length === 0 || DRY_RUN) {
      if (DRY_RUN) console.log(`   [DRY RUN] Would upsert ${rows.length} pick(s)`);
      continue;
    }

    // Upsert into user_picks
    const { error: upsertErr } = await supabase
      .from('user_picks')
      .upsert(rows, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`   ❌ Upsert failed: ${upsertErr.message}`);
      totalErrors += rows.length;
      continue;
    }

    totalUpserted += rows.length;
    console.log(`   ✅ Upserted ${rows.length} picks`);

    // Mark transcript as promoted
    const { error: promoteErr } = await supabase
      .from('podcast_transcripts')
      .update({ picks_promoted_at: new Date().toISOString() })
      .eq('id', transcript.id);

    if (promoteErr) {
      console.error(`   ⚠ Failed to mark transcript as promoted: ${promoteErr.message}`);
    }
  }

  console.log('\n📊 Run complete');
  console.log(`   Transcripts: ${transcripts.length}`);
  console.log(`   Picks built: ${totalPicks}`);
  console.log(`   Skipped:     ${totalSkipped}  (non-NFL — UFC/NBA/etc.)`);
  console.log(`   Upserted:    ${totalUpserted}`);
  console.log(`   Errors:      ${totalErrors}`);

  if (totalErrors > 0) process.exit(1);
}

run().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
