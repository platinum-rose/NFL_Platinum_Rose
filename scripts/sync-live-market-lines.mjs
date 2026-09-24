// scripts/sync-live-market-lines.mjs
// Compares the current market (DraftKings / FanDuel) against the locked
// SuperContest lines and writes data/supercontest/live-market-comparison.json.
//
// Since 2026-09-24 this reads the latest snapshot from Supabase
// `game_odds_snapshots` (written by agents/game-odds-ingest.js, the single
// scheduled TheOddsAPI caller) and costs ZERO API credits. Pass --live to
// call TheOddsAPI directly instead (3 credits; refuses below ODDS_QUOTA_FLOOR
// unless --force).
import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SC_DIR = path.join(ROOT, 'data', 'supercontest');

const LIVE = process.argv.includes('--live');
const FORCE = process.argv.includes('--force');
const QUOTA_FLOOR = Number(process.env.ODDS_QUOTA_FLOOR ?? 15);
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const TEAM_MAP = {
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL',
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WAS'
};

// game_odds_snapshots uses WSH; TheOddsAPI full names are the event shape below.
const ABBR_TO_NAME = Object.fromEntries(Object.entries(TEAM_MAP).map(([name, abbr]) => [abbr, name]));
ABBR_TO_NAME.WSH = 'Washington Commanders';
ABBR_TO_NAME.LA = ABBR_TO_NAME.LA || 'Los Angeles Rams';

/**
 * Rebuild TheOddsAPI-shaped events from game_odds_snapshot rows so the
 * comparison logic below is unchanged. spread = home line; total price
 * columns are over (home_price) / under (away_price).
 */
export function rowsToEvents(rows) {
  const events = new Map();
  for (const r of rows) {
    const home = ABBR_TO_NAME[r.home_team] || r.home_team;
    const away = ABBR_TO_NAME[r.away_team] || r.away_team;
    if (!events.has(r.game_id)) {
      events.set(r.game_id, { id: r.game_id, home_team: home, away_team: away, commence_time: r.commence_time, bookmakers: [] });
    }
    const ev = events.get(r.game_id);
    let bk = ev.bookmakers.find(b => b.key === r.book);
    if (!bk) { bk = { key: r.book, markets: [] }; ev.bookmakers.push(bk); }
    if (r.market === 'spread' && r.spread != null) {
      bk.markets.push({ key: 'spreads', outcomes: [
        { name: home, point: Number(r.spread), price: r.home_price },
        { name: away, point: -Number(r.spread), price: r.away_price },
      ] });
    } else if (r.market === 'total' && r.total != null) {
      bk.markets.push({ key: 'totals', outcomes: [
        { name: 'Over', point: Number(r.total), price: r.home_price },
        { name: 'Under', point: Number(r.total), price: r.away_price },
      ] });
    } else if (r.market === 'moneyline') {
      bk.markets.push({ key: 'h2h', outcomes: [
        { name: home, price: r.home_price },
        { name: away, price: r.away_price },
      ] });
    }
  }
  return [...events.values()];
}

async function loadEventsFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env (or pass --live to call TheOddsAPI).');
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data: latest, error: le } = await sb
    .from('game_odds_snapshots')
    .select('captured_at')
    .gte('commence_time', new Date().toISOString())
    .order('captured_at', { ascending: false })
    .limit(1);
  if (le) throw new Error(`game_odds_snapshots: ${le.message}`);
  const capturedAt = latest?.[0]?.captured_at;
  if (!capturedAt) throw new Error('game_odds_snapshots has no snapshot for upcoming games.');

  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('game_odds_snapshots')
      .select('game_id, home_team, away_team, commence_time, book, market, home_price, away_price, spread, total')
      .eq('captured_at', capturedAt)
      .in('book', ['draftkings', 'fanduel', 'betmgm', 'caesars'])
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`game_odds_snapshots: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  const ageH = ((Date.now() - new Date(capturedAt).getTime()) / 3600000).toFixed(1);
  console.log(`☁️  Supabase game_odds_snapshots bucket ${capturedAt} (${ageH}h old, ${rows.length} rows) — 0 API credits.`);
  return { events: rowsToEvents(rows), oddsCapturedAt: new Date(capturedAt).toISOString(), quotaRemaining: null };
}

async function loadEventsFromApi() {
  if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY is not configured in .env');
  const q = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${ODDS_API_KEY}`).catch(() => null);
  const rem = q?.headers?.get('x-requests-remaining');
  if (rem != null && !FORCE && Number(rem) < QUOTA_FLOOR) {
    throw new Error(`TheOddsAPI has ${rem} credits left (< floor ${QUOTA_FLOOR}). Re-run with --force to spend them.`);
  }
  console.log('🔄 --live: fetching NFL odds from TheOddsAPI (3 credits)...');
  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=spreads,totals,h2h&bookmakers=draftkings,fanduel,betmgm,caesars&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheOddsAPI error: HTTP ${res.status} ${res.statusText}`);
  const quotaRemaining = res.headers.get('x-requests-remaining');
  console.log(`📊 TheOddsAPI Quota: ${quotaRemaining} remaining (used ${res.headers.get('x-requests-used')})`);
  return { events: await res.json(), oddsCapturedAt: new Date().toISOString(), quotaRemaining };
}

// Locked SuperContest lines: the newest week among latest.json and week-NN-lines.json.
// (latest.json is maintained by agents/supercontest-lines-ingest.js; hand-entered weeks
// such as week-03-lines.json don't update it, which left the comparison on Week 2.)
async function loadLockedLines() {
  const candidates = [];
  try { candidates.push(JSON.parse(await readFile(path.join(SC_DIR, 'latest.json'), 'utf8'))); } catch { /* optional */ }
  for (const f of await readdir(SC_DIR)) {
    if (/^week-\d{2}-lines\.json$/.test(f)) {
      try { candidates.push(JSON.parse(await readFile(path.join(SC_DIR, f), 'utf8'))); } catch { /* skip bad file */ }
    }
  }
  const valid = candidates.filter(c => Array.isArray(c?.games) && Number.isFinite(Number(c.week)));
  if (!valid.length) throw new Error(`No locked SuperContest lines in ${SC_DIR}. Run "node agents/supercontest-lines-ingest.js" first.`);
  valid.sort((a, b) => Number(b.week) - Number(a.week) || String(b.captured_at).localeCompare(String(a.captured_at)));
  return valid[0];
}

async function syncLiveMarketLines() {
  const { events, oddsCapturedAt, quotaRemaining } = LIVE ? await loadEventsFromApi() : await loadEventsFromSupabase();
  const capturedAt = oddsCapturedAt;

  const scData = await loadLockedLines();
  console.log(`📌 Comparing against SuperContest Week ${scData.week} locked lines (captured ${scData.captured_at}).`);

  const liveResults = [];

  for (const scGame of scData.games) {
    const fav = scGame.favorite_abbr;
    const dog = scGame.underdog_abbr;
    const lockedLine = scGame.contest_line; // e.g. -3.5

    // Match event
    const event = events.find(e => {
      const hAbbr = TEAM_MAP[e.home_team];
      const aAbbr = TEAM_MAP[e.away_team];
      return (hAbbr === fav && aAbbr === dog) || (hAbbr === dog && aAbbr === fav);
    });

    if (!event) {
      liveResults.push({
        matchup: `${scGame.away_team} @ ${scGame.home_team}`,
        favorite: fav,
        underdog: dog,
        locked_contest_line: lockedLine,
        status: 'Event not found in live feed'
      });
      continue;
    }

    const dk = event.bookmakers?.find(b => b.key === 'draftkings');
    const fd = event.bookmakers?.find(b => b.key === 'fanduel');

    // Extract DraftKings spread
    const dkSpreads = dk?.markets?.find(m => m.key === 'spreads')?.outcomes || [];
    const dkFavOut = dkSpreads.find(o => TEAM_MAP[o.name] === fav);
    const dkDogOut = dkSpreads.find(o => TEAM_MAP[o.name] === dog);

    // Extract FanDuel spread
    const fdSpreads = fd?.markets?.find(m => m.key === 'spreads')?.outcomes || [];
    const fdFavOut = fdSpreads.find(o => TEAM_MAP[o.name] === fav);
    const fdDogOut = fdSpreads.find(o => TEAM_MAP[o.name] === dog);

    // Extract totals
    const dkTots = dk?.markets?.find(m => m.key === 'totals')?.outcomes || [];
    const dkTotal = dkTots.find(o => o.name === 'Over')?.point;

    const fdTots = fd?.markets?.find(m => m.key === 'totals')?.outcomes || [];
    const fdTotal = fdTots.find(o => o.name === 'Over')?.point;

    const liveDkFavSpread = dkFavOut?.point;
    const liveFdFavSpread = fdFavOut?.point;

    let clvFav = null;
    let clvDog = null;
    let clvSummary = 'No movement';

    if (liveDkFavSpread !== undefined && liveDkFavSpread !== null) {
      clvFav = Number((lockedLine - liveDkFavSpread).toFixed(1));
      clvDog = Number((liveDkFavSpread - lockedLine).toFixed(1));

      if (clvFav > 0) {
        clvSummary = `+${clvFav} pt CLV on ${fav}`;
      } else if (clvFav < 0) {
        clvSummary = `+${Math.abs(clvFav)} pt CLV on ${dog}`;
      } else {
        clvSummary = 'Exact match (0.0 movement)';
      }
    }

    liveResults.push({
      matchup: `${scGame.away_team} @ ${scGame.home_team}`,
      fav_abbr: fav,
      dog_abbr: dog,
      kickoff_day: scGame.kickoff_day,
      kickoff_time: scGame.kickoff_time_et,
      locked_contest_spread: `${fav} ${lockedLine}`,
      live_dk_spread: liveDkFavSpread !== undefined ? `${fav} ${liveDkFavSpread}` : 'N/A',
      live_fd_spread: liveFdFavSpread !== undefined ? `${fav} ${liveFdFavSpread}` : 'N/A',
      live_dk_total: dkTotal || 'N/A',
      live_fd_total: fdTotal || 'N/A',
      clv_points_fav: clvFav,
      clv_points_dog: clvDog,
      clv_summary: clvSummary,
      is_live_now: event.commence_time ? new Date(event.commence_time) < new Date() : false
    });
  }

  const output = {
    source: LIVE ? 'TheOddsAPI (--live)' : 'supabase:game_odds_snapshots (TheOddsAPI via game-odds-ingest)',
    synced_at: new Date().toISOString(),
    supercontest_week: Number(scData.week),
    primary_book: 'DraftKings',
    comparison_book: 'FanDuel',
    captured_at: capturedAt,
    quota_remaining: quotaRemaining,
    games: liveResults
  };

  const outDir = SC_DIR;
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'live-market-comparison.json');
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`✅ Live market odds successfully synced to ${outPath}`);
  return output;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === __filename.toLowerCase();
if (isMain) syncLiveMarketLines().catch(err => {
  console.error('❌ Error syncing live market lines:', err);
  process.exit(1);
});
