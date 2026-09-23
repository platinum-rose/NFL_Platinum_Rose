// scratch/kalshi-matchup-analysis.mjs
import fs from 'node:fs';
import { calculateNetOdds } from '../src/lib/predictionMarkets.js';

const FETCH_HEADERS = { Accept: 'application/json', 'User-Agent': 'NFLDashboard/1.0' };

async function fetchAllMarkets(eventTicker) {
  let markets = [];
  let cursor = null;
  do {
    const url = new URL('https://api.elections.kalshi.com/trade-api/v2/markets');
    url.searchParams.set('event_ticker', eventTicker);
    url.searchParams.set('limit', '200');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) {
      console.error(`Failed to fetch ${eventTicker}: ${res.status}`);
      break;
    }
    const data = await res.json();
    markets.push(...(data.markets || []));
    cursor = data.cursor;
  } while (cursor);
  return markets;
}

console.log('Fetching Kalshi markets...');
const sbMarkets = await fetchAllMarkets('KXNFLMATCHUP-27SB');
const nfcMarkets = await fetchAllMarkets('KXNFLMATCHUP-27NFC');
console.log(`Fetched ${sbMarkets.length} Super Bowl markets and ${nfcMarkets.length} NFC markets.`);

// Save raw for reference
fs.writeFileSync('scratch/kalshi-sb-matchups.json', JSON.stringify(sbMarkets, null, 2));
fs.writeFileSync('scratch/kalshi-nfc-matchups.json', JSON.stringify(nfcMarkets, null, 2));

function processKalshiMarket(m) {
  const yesAskDollars = parseFloat(m.yes_ask_dollars || '0');
  const yesBidDollars = parseFloat(m.yes_bid_dollars || '0');
  const lastPriceDollars = parseFloat(m.last_price_dollars || '0');

  const askCents = Math.round(yesAskDollars * 100);
  const bidCents = Math.round(yesBidDollars * 100);
  const lastCents = Math.round(lastPriceDollars * 100);

  // Best executable price to buy YES is the yes_ask.
  // If yes_ask is 0 (no offers), buy price is null.
  // Last traded price is informative if no ask.
  const buyCents = askCents > 0 ? askCents : (lastCents > 0 ? lastCents : null);

  let netEval = null;
  let grossAmerican = null;
  if (buyCents) {
    netEval = calculateNetOdds({ priceCents: buyCents, exchange: 'kalshi', applyFee: true });
    // Gross American odds = ((100 - cents) / cents) * 100
    grossAmerican = Math.round(((100 - buyCents) / buyCents) * 100);
  }

  return {
    ticker: m.ticker,
    title: m.title,
    yes_bid_cents: bidCents,
    yes_ask_cents: askCents,
    last_cents: lastCents,
    buy_cents: buyCents,
    gross_american: grossAmerican,
    net_american: netEval ? netEval.netAmericanOdds : null,
    volume: m.volume || 0,
    open_interest: m.open_interest || 0
  };
}

const sbMap = {};
for (const m of sbMarkets) {
  sbMap[m.ticker] = processKalshiMarket(m);
  // Also index by normalized team names
  // Title format: "2026-27 Championship Game Matchup: Team1 vs Team2"
  const titleMatch = m.title.match(/Matchup:\s*(.*?)\s+vs\s+(.*)/i);
  if (titleMatch) {
    const t1 = titleMatch[1].trim();
    const t2 = titleMatch[2].trim();
    sbMap[`${t1} vs ${t2}`] = sbMap[m.ticker];
    sbMap[`${t2} vs ${t1}`] = sbMap[m.ticker];
  }
}

// Compare our target matchups
const targets = [
  { name: 'Ravens vs Seahawks', aliases: ['Baltimore vs Seattle', 'Baltimore Ravens vs Seattle Seahawks'] },
  { name: 'Ravens vs Rams', aliases: ['Baltimore vs Los Angeles R', 'Baltimore vs LA Rams', 'Baltimore vs Los Angeles Rams', 'Baltimore Ravens vs Los Angeles Rams'] },
  { name: 'Ravens vs 49ers', aliases: ['Baltimore vs San Francisco', 'Baltimore Ravens vs San Francisco 49ers'] },
  { name: 'Bills vs Seahawks', aliases: ['Buffalo vs Seattle', 'Buffalo Bills vs Seattle Seahawks'] },
  { name: 'Bills vs Rams', aliases: ['Buffalo vs Los Angeles R', 'Buffalo vs LA Rams', 'Buffalo vs Los Angeles Rams', 'Buffalo Bills vs Los Angeles Rams'] },
  { name: 'Bills vs 49ers', aliases: ['Buffalo vs San Francisco', 'Buffalo Bills vs San Francisco 49ers'] },
  { name: 'Bills vs Packers', aliases: ['Buffalo vs Green Bay', 'Buffalo Bills vs Green Bay Packers'] },
  { name: 'Ravens vs Packers', aliases: ['Baltimore vs Green Bay', 'Baltimore Ravens vs Green Bay Packers'] },
  { name: 'Chiefs vs Packers', aliases: ['Kansas City vs Green Bay', 'Kansas City Chiefs vs Green Bay Packers'] },
  { name: 'Bengals vs Packers', aliases: ['Cincinnati vs Green Bay', 'Cincinnati Bengals vs Green Bay Packers'] },
  { name: 'Bills vs Lions', aliases: ['Buffalo vs Detroit', 'Buffalo Bills vs Detroit Lions'] },
  { name: 'Bills vs Eagles', aliases: ['Buffalo vs Philadelphia', 'Buffalo Bills vs Philadelphia Eagles'] }
];

console.log('\n========================================================================');
console.log('KALSHI SUPER BOWL EXACTA MATCHUPS (KXNFLMATCHUP-27SB)');
console.log('========================================================================');

const results = [];
for (const t of targets) {
  let matched = null;
  for (const a of t.aliases) {
    if (sbMap[a]) { matched = sbMap[a]; break; }
  }
  if (!matched) {
    // try finding by substrings
    for (const [k, v] of Object.entries(sbMap)) {
      if (t.name.split(' vs ').every(team => k.toLowerCase().includes(team.toLowerCase().split(' ').pop()))) {
        matched = v;
        break;
      }
    }
  }

  results.push({
    matchup: t.name,
    ticker: matched?.ticker || 'N/A',
    bid: matched ? `${matched.yes_bid_cents}¢` : 'N/A',
    ask: matched ? `${matched.yes_ask_cents}¢` : 'N/A',
    last: matched ? `${matched.last_cents}¢` : 'N/A',
    buyCents: matched?.buy_cents ? `${matched.buy_cents}¢` : 'N/A',
    grossAmerican: matched?.gross_american ? `+${matched.gross_american}` : 'N/A',
    netAmerican: matched?.net_american || 'N/A',
    vol: matched?.volume ?? 0
  });
}

console.table(results);

console.log('\n========================================================================');
console.log('NFC CHAMPIONSHIP MATCHUPS (KXNFLMATCHUP-27NFC) - Sample');
console.log('========================================================================');
const nfcProcessed = nfcMarkets.map(processKalshiMarket).sort((a, b) => (b.buy_cents || 0) - (a.buy_cents || 0));
console.table(nfcProcessed.slice(0, 15).map(m => ({
  title: m.title.replace('2026-27 NFC Championship Matchup: ', ''),
  ticker: m.ticker,
  ask: `${m.yes_ask_cents}¢`,
  bid: `${m.yes_bid_cents}¢`,
  grossOdds: m.gross_american ? `+${m.gross_american}` : 'N/A',
  netOdds: m.net_american || 'N/A'
})));
