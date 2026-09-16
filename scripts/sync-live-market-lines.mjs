import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..', 'dev', 'projects', 'NFL_Dashboard');

const ODDS_API_KEY = process.env.ODDS_API_KEY;
if (!ODDS_API_KEY) {
  console.error('❌ ODDS_API_KEY is not configured in .env');
  process.exit(1);
}

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

async function syncLiveMarketLines() {
  console.log('🔄 Fetching live NFL odds from TheOddsAPI (DraftKings & FanDuel)...');
  const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=spreads,totals,h2h&bookmakers=draftkings,fanduel,betmgm,caesars&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TheOddsAPI error: HTTP ${res.status} ${res.statusText}`);
  }

  const quotaRemaining = res.headers.get('x-requests-remaining');
  const quotaUsed = res.headers.get('x-requests-used');
  console.log(`📊 TheOddsAPI Quota: ${quotaRemaining} remaining (used ${quotaUsed})`);

  const events = await res.json();
  const capturedAt = new Date().toISOString();

  // Load locked SuperContest lines
  const scPath = 'E:/dev/projects/NFL_Dashboard/data/supercontest/week-01-lines.json';
  const scData = JSON.parse(await import('fs').then(fs => fs.readFileSync(scPath, 'utf8')));

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
    source: 'TheOddsAPI',
    primary_book: 'DraftKings',
    comparison_book: 'FanDuel',
    captured_at: capturedAt,
    quota_remaining: quotaRemaining,
    games: liveResults
  };

  const outDir = 'E:/dev/projects/NFL_Dashboard/data/supercontest';
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'live-market-comparison.json');
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`✅ Live market odds successfully synced to ${outPath}`);
  return output;
}

syncLiveMarketLines().catch(err => {
  console.error('❌ Error syncing live market lines:', err);
  process.exit(1);
});
