import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Static Reference Benchmark Odds for NFL 2026 Season
const BENCHMARK_MARKET_ODDS = {
  'Buffalo Bills': {
    win_total: { price: '10.5 wins (Over -140 / Under +115)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '-145', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+475', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '10 to 1 / +1000', sportsbook: 'Caesars', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make -250 / Miss +200', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'Miami Dolphins': {
    win_total: { price: '9.5 wins (Over -110 / Under -110)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '+220', sportsbook: 'BetMGM', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+1200', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '22 to 1 / +2200', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make -135 / Miss +110', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'New England Patriots': {
    win_total: { price: '9.5 wins (Over +105 / Under -125)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '+135', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+850', sportsbook: 'BetMGM', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '18 to 1 / +1800', sportsbook: 'Caesars', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make -115 / Miss -105', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'New York Jets': {
    win_total: { price: '6.5 wins (Over -115 / Under -105)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '14 to 1 / +1400', sportsbook: 'BetMGM', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+4000', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '80 to 1 / +8000', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make +280 / Miss -350', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'Philadelphia Eagles': {
    win_total: { price: '10.5 wins (Over -115 / Under -105)', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '+125', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '9 to 1 / +900', sportsbook: 'Caesars', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '17 to 1 / +1700', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make -220 / Miss +180', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'Dallas Cowboys': {
    win_total: { price: '9.5 wins (Over +110 / Under -135)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '+210', sportsbook: 'BetMGM', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '13 to 1 / +1300', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '25 to 1 / +2500', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make -140 / Miss +115', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'New York Giants': {
    win_total: { price: '6.5 wins (Over -120 / Under +100)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '10 to 1 / +1000', sportsbook: 'BetMGM', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+4500', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '100 to 1 / +10000', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make +330 / Miss -425', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
  'Washington Commanders': {
    win_total: { price: '7.5 wins (Over -105 / Under -115)', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    division: { price: '+900', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
    conference: { price: '+3500', sportsbook: 'FanDuel', as_of: '2026-08-26T00:00:00Z' },
    super_bowl: { price: '75 to 1 / +7500', sportsbook: 'Caesars', as_of: '2026-08-26T00:00:00Z' },
    playoffs: { price: 'Make +240 / Miss -300', sportsbook: 'DraftKings', as_of: '2026-08-26T00:00:00Z' },
  },
};

const TEAM_CODE_MAP = {
  'Buffalo Bills': 'BUF',
  'Miami Dolphins': 'MIA',
  'New England Patriots': 'NE',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Dallas Cowboys': 'DAL',
  'New York Giants': 'NYG',
  'Washington Commanders': 'WAS',
  'Baltimore Ravens': 'BAL',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Pittsburgh Steelers': 'PIT',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Tennessee Titans': 'TEN',
  'Denver Broncos': 'DEN',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Chicago Bears': 'CHI',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Minnesota Vikings': 'MIN',
  'Atlanta Falcons': 'ATL',
  'Carolina Panthers': 'CAR',
  'New Orleans Saints': 'NO',
  'Tampa Bay Buccaneers': 'TB',
  'Arizona Cardinals': 'ARI',
  'Los Angeles Rams': 'LAR',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
};

function normalizeTeamInput(team) {
  return String(team || '').trim().toLowerCase();
}

function resolveTeamCode(team) {
  const normalized = normalizeTeamInput(team);
  if (!normalized) return null;

  const upper = String(team).trim().toUpperCase();
  if (Object.values(TEAM_CODE_MAP).includes(upper)) return upper;

  const exactName = Object.entries(TEAM_CODE_MAP).find(([name]) => normalizeTeamInput(name) === normalized);
  if (exactName) return exactName[1];

  return Object.entries(TEAM_CODE_MAP).find(([name]) => normalizeTeamInput(name).includes(normalized))?.[1] || null;
}

function formatSportsbookName(book) {
  if (!book) return 'DraftKings';
  const b = String(book).toLowerCase();
  if (b.includes('draftkings')) return 'DraftKings';
  if (b.includes('fanduel')) return 'FanDuel';
  if (b.includes('betmgm')) return 'BetMGM';
  if (b.includes('caesars')) return 'Caesars';
  if (b.includes('betonline')) return 'BetOnline';
  if (b.includes('circa')) return 'Circa Sports';
  if (b.includes('station') || b === 'stn') return 'STN Sports (Station)';
  return book.charAt(0).toUpperCase() + book.slice(1);
}

/**
 * 1. Fetch live market context odds from Supabase futures_odds_snapshots or game_odds_snapshots if available.
 * Returns structured object or null if live snapshot unavailable.
 */
export async function getLiveMarketContextOdds({ team, market }) {
  if (!sb || !team || !market) return null;

  try {
    // A. Check futures_odds_snapshots for futures markets
    let marketFilter = [];
    if (market === 'win_total') marketFilter = ['wins', 'win_total'];
    else if (market === 'division') marketFilter = ['division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west', 'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west'];
    else if (market === 'conference') marketFilter = ['conference_afc', 'conference_nfc'];
    else if (market === 'super_bowl') marketFilter = ['superbowl', 'super_bowl'];
    else if (market === 'playoffs') marketFilter = ['playoffs'];

    if (marketFilter.length > 0) {
      const { data: futData, error: futErr } = await sb
        .from('futures_odds_snapshots')
        .select('*')
        .ilike('team', `%${team}%`)
        .in('market_type', marketFilter)
        .order('snapshot_time', { ascending: false })
        .limit(1);

      if (!futErr && futData && futData.length > 0) {
        const row = futData[0];
        let current_price = '';
        if (market === 'win_total' && (row.line != null || row.over_price != null)) {
          const lineStr = row.line != null ? `${row.line} wins` : '';
          const overStr = row.over_price != null ? `Over ${row.over_price >= 0 ? '+' : ''}${row.over_price}` : '';
          const underStr = row.under_price != null ? `Under ${row.under_price >= 0 ? '+' : ''}${row.under_price}` : '';
          const juicingStr = [overStr, underStr].filter(Boolean).join(' / ');
          current_price = juicingStr ? `${lineStr} (${juicingStr})`.trim() : lineStr;
        } else {
          const oddsVal = row.odds || row.price;
          if (oddsVal != null) {
            current_price = oddsVal > 0 ? `+${oddsVal}` : `${oddsVal}`;
          } else {
            current_price = 'Market Active';
          }
        }

        return {
          source_type: 'live_market_context',
          market,
          current_price,
          sportsbook: formatSportsbookName(row.book),
          as_of: row.snapshot_time || row.captured_at || new Date().toISOString(),
        };
      }
    }

    // B. Check game_odds_snapshots using team abbreviation code
    const code = resolveTeamCode(team);

    if (code) {
      const { data: gameData, error: gameErr } = await sb
        .from('game_odds_snapshots')
        .select('book, home_price, away_price, spread, total, captured_at')
        .or(`home_team.eq.${code},away_team.eq.${code}`)
        .order('captured_at', { ascending: false })
        .limit(1);

      if (!gameErr && gameData && gameData.length > 0) {
        const row = gameData[0];
        return {
          source_type: 'live_market_context',
          market,
          current_price: row.spread != null ? `Spread ${row.spread}` : (row.total != null ? `Total ${row.total}` : `Home ${row.home_price} / Away ${row.away_price}`),
          sportsbook: formatSportsbookName(row.book),
          as_of: row.captured_at || new Date().toISOString(),
        };
      }
    }

    return null;
  } catch (err) {
    console.warn(`[live-market-fallback] getLiveMarketContextOdds error for ${team} / ${market}:`, err.message);
    return null;
  }
}

/**
 * 2. Get static benchmark market context odds.
 * STRICT GUARD: Returns null if team or market is unknown — NO UNKNOWN TEAM SUBSTITUTION!
 */
export function getStaticBenchmarkMarketContext({ team, market }) {
  if (!team || !market) return null;

  const matchedTeam = Object.keys(BENCHMARK_MARKET_ODDS).find(
    t => t.toLowerCase() === team.toLowerCase() || team.toLowerCase().includes(t.toLowerCase())
  );

  if (!matchedTeam) return null; // STRICT GUARD: Unknown team gets null!

  const teamData = BENCHMARK_MARKET_ODDS[matchedTeam];
  const marketObj = teamData[market];

  if (!marketObj) return null;

  return {
    source_type: 'static_benchmark_context',
    market,
    current_price: marketObj.price,
    sportsbook: marketObj.sportsbook,
    as_of: marketObj.as_of,
  };
}

/**
 * 3. Primary wrapper helper: tries live first, then static benchmark if allowed.
 * Returns structured line objects with explicit source_type.
 */
export async function applyMarketContextOdds({ teamName, rawOddsList = [] }) {
  if (!teamName) return [];

  const structuredLines = [];

  // Parse raw odds lines from Markdown
  for (const raw of rawOddsList) {
    if (!raw || raw.toLowerCase().includes('not explicitly') || raw.toLowerCase().includes('none')) {
      continue;
    }

    structuredLines.push({
      source_type: 'expert_quote',
      text: raw,
    });
  }

  // Ensure 5 core futures markets are evaluated for market context
  const marketMap = [
    { label: 'Make/Miss Playoff Odds', key: 'playoffs', search: 'playoff' },
    { label: 'Win Total', key: 'win_total', search: 'win total' },
    { label: 'Division Winner Odds', key: 'division', search: 'division' },
    { label: 'Conference Championship Odds', key: 'conference', search: 'conference' },
    { label: 'Super Bowl Odds', key: 'super_bowl', search: 'super bowl' },
  ];

  for (const m of marketMap) {
    const existsInQuote = structuredLines.some(l => l.text?.toLowerCase().includes(m.search));

    if (!existsInQuote) {
      // 1. Try Live Market Odds first
      const live = await getLiveMarketContextOdds({ team: teamName, market: m.key });

      if (live) {
        structuredLines.push({
          source_type: 'live_market_context',
          market_label: m.label,
          current_price: live.current_price,
          sportsbook: live.sportsbook,
          as_of: live.as_of,
        });
      } else {
        // 2. Try Static Benchmark Odds if live is unavailable
        const staticBm = getStaticBenchmarkMarketContext({ team: teamName, market: m.key });
        if (staticBm) {
          structuredLines.push({
            source_type: 'static_benchmark_context',
            market_label: m.label,
            current_price: staticBm.current_price,
            sportsbook: staticBm.sportsbook,
            as_of: staticBm.as_of,
          });
        } else {
          // 3. STRICT GUARD: If both live & static are unavailable, mark explicit unavailable!
          structuredLines.push({
            source_type: 'live_market_unavailable',
            market_label: m.label,
          });
        }
      }
    }
  }

  return structuredLines;
}
