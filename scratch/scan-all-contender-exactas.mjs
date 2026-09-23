// scratch/scan-all-contender-exactas.mjs
import fs from 'node:fs';
import { calculateNetOdds } from '../src/lib/predictionMarkets.js';

const circaData = JSON.parse(fs.readFileSync('data/futures-imports/circa-2026-09-22-live-futures-markets.json', 'utf8'));
const bkrData = JSON.parse(fs.readFileSync('data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json', 'utf8'));
const beoData = JSON.parse(fs.readFileSync('data/futures-imports/betonline-2026-09-22-live-futures-markets.json', 'utf8'));
const rawBetUS = fs.readFileSync('docs/Futures_Odds/BetUS_Odds_0916', 'utf8');
const kalshiSbRaw = JSON.parse(fs.readFileSync('scratch/kalshi-sb-matchups.json', 'utf8'));

// Parse BetUS
function parseBetUSMatchups(text) {
  const map = {};
  const lines = text.split('\n');
  let inMatchups = false;
  for (const line of lines) {
    if (line.includes('NFL Super Bowl LXI Matchups') || line.includes('Super Bowl Matchups')) {
      inMatchups = true;
      continue;
    }
    if (inMatchups) {
      const match = line.match(/^\s*(\d+)\s+([A-Za-z0-9 ]+ vs [A-Za-z0-9 ]+)\s+([+-]\d+)/);
      if (match) {
        map[match[2].trim()] = parseInt(match[3], 10);
      }
    }
  }
  return map;
}
const betusMatchups = parseBetUSMatchups(rawBetUS);

function americanToDecimal(odds) {
  if (odds > 0) return (odds / 100) + 1;
  return (100 / Math.abs(odds)) + 1;
}

function decimalToAmerican(dec) {
  const profit = dec - 1;
  if (profit >= 1) return Math.round(profit * 100);
  return Math.round(-100 / profit);
}

function calcParlayOdds(odds1, odds2) {
  if (!odds1 || !odds2) return null;
  return decimalToAmerican(americanToDecimal(odds1) * americanToDecimal(odds2));
}

const circaAFC = circaData.marketSnapshots.conference.AFC;
const circaNFC = circaData.marketSnapshots.conference.NFC;
const bkrAFC = bkrData.marketSnapshots.conference.AFC;
const bkrNFC = bkrData.marketSnapshots.conference.NFC;
const beoAFC = beoData.marketSnapshots.conference.AFC;
const beoNFC = beoData.marketSnapshots.conference.NFC;

// Process Kalshi
const kalshiMap = {};
for (const m of kalshiSbRaw) {
  const titleMatch = m.title.match(/Matchup:\s*(.*?)\s+vs\s+(.*)/i);
  if (!titleMatch) continue;
  const t1 = titleMatch[1].trim();
  const t2 = titleMatch[2].trim();

  const yesAskDollars = parseFloat(m.yes_ask_dollars || '0');
  const askCents = Math.round(yesAskDollars * 100);
  const lastCents = Math.round(parseFloat(m.last_price_dollars || '0') * 100);
  const buyCents = askCents > 0 ? askCents : null;

  let netEval = null;
  let grossAmerican = null;
  if (buyCents) {
    netEval = calculateNetOdds({ priceCents: buyCents, exchange: 'kalshi', applyFee: true });
    grossAmerican = Math.round(((100 - buyCents) / buyCents) * 100);
  }

  const item = {
    ticker: m.ticker,
    buyCents,
    askCents,
    lastCents,
    grossAmerican,
    netAmerican: netEval ? netEval.netAmericanOdds : null,
    volume: m.volume || 0,
    openInterest: m.open_interest || 0
  };

  kalshiMap[`${t1} vs ${t2}`] = item;
  kalshiMap[`${t2} vs ${t1}`] = item;
}

// Team alias normalization
const teamNames = {
  'Arizona': 'Arizona Cardinals', 'Atlanta': 'Atlanta Falcons', 'Baltimore': 'Baltimore Ravens',
  'Buffalo': 'Buffalo Bills', 'Carolina': 'Carolina Panthers', 'Chicago': 'Chicago Bears',
  'Cincinnati': 'Cincinnati Bengals', 'Cleveland': 'Cleveland Browns', 'Dallas': 'Dallas Cowboys',
  'Denver': 'Denver Broncos', 'Detroit': 'Detroit Lions', 'Green Bay': 'Green Bay Packers',
  'Houston': 'Houston Texans', 'Indianapolis': 'Indianapolis Colts', 'Jacksonville': 'Jacksonville Jaguars',
  'Kansas City': 'Kansas City Chiefs', 'Las Vegas': 'Las Vegas Raiders', 'Los Angeles C': 'Los Angeles Chargers',
  'Los Angeles R': 'Los Angeles Rams', 'Miami': 'Miami Dolphins', 'Minnesota': 'Minnesota Vikings',
  'New England': 'New England Patriots', 'New Orleans': 'New Orleans Saints', 'New York G': 'New York Giants',
  'New York J': 'New York Jets', 'Philadelphia': 'Philadelphia Eagles', 'Pittsburgh': 'Pittsburgh Steelers',
  'San Francisco': 'San Francisco 49ers', 'Seattle': 'Seattle Seahawks', 'Tampa Bay': 'Tampa Bay Buccaneers',
  'Tennessee': 'Tennessee Titans', 'Washington': 'Washington Commanders'
};

function getKalshiData(afcFull, nfcFull) {
  // Find short names
  for (const [kShort, full] of Object.entries(teamNames)) {
    if (full === afcFull) {
      for (const [nShort, nFull] of Object.entries(teamNames)) {
        if (nFull === nfcFull) {
          const direct = kalshiMap[`${kShort} vs ${nShort}`];
          if (direct) return direct;
        }
      }
    }
  }
  return null;
}

// 1. SCAN ALL 256 MATCHUPS TO FIND TOP KALSHI EDGES
const allKalshiEdges = [];
for (const afc of Object.keys(circaAFC)) {
  for (const nfc of Object.keys(circaNFC)) {
    const cP = calcParlayOdds(circaAFC[afc], circaNFC[nfc]);
    const bP = calcParlayOdds(bkrAFC[afc], bkrNFC[nfc]);
    const oP = calcParlayOdds(beoAFC[afc], beoNFC[nfc]);
    const uP = betusMatchups[`${afc} vs ${nfc}`] || betusMatchups[`${nfc} vs ${afc}`] || null;

    const books = [
      { book: 'Circa', odds: cP },
      { book: 'BetUS', odds: uP },
      { book: 'BKR', odds: bP },
      { book: 'BEO', odds: oP }
    ].filter(b => b.odds !== null);
    books.sort((a, b) => b.odds - a.odds);
    const bestBook = books[0];

    const kData = getKalshiData(afc, nfc);
    if (kData && kData.netAmerican) {
      const netOdds = kData.netAmerican;
      const edgeVsBestBook = netOdds - (bestBook?.odds || 0);
      allKalshiEdges.push({
        afc,
        nfc,
        matchup: `${afc} vs ${nfc}`,
        kalshiTicker: kData.ticker,
        askCents: kData.askCents,
        grossOdds: kData.grossAmerican,
        netOdds: kData.netAmerican,
        bestBookName: bestBook?.book,
        bestBookOdds: bestBook?.odds,
        edgeVsBestBook,
        circa: cP,
        betus: uP,
        bkr: bP,
        beo: oP
      });
    }
  }
}

// Sort Kalshi edges
allKalshiEdges.sort((a, b) => b.edgeVsBestBook - a.edgeVsBestBook);

// Filter to top Kalshi edges on contenders (AFC <= +1500, NFC <= +1600)
console.log('========================================================================');
console.log('TOP KALSHI EXACTAS THAT BEAT ALL SPORTSBOOKS (CONTENDERS)');
console.log('========================================================================');
const topKalshiContenders = allKalshiEdges.filter(e => 
  circaAFC[e.afc] <= 1500 && circaNFC[e.nfc] <= 1600 && e.edgeVsBestBook > 0
);

console.table(topKalshiContenders.map(e => ({
  matchup: e.matchup,
  kalshiAsk: `${e.askCents}¢`,
  kalshiGross: `+${e.grossOdds}`,
  kalshiNet: `+${e.netOdds}`,
  bestBook: `${e.bestBookName} (+${e.bestBookOdds})`,
  kalshiNetAdvantage: `+${e.edgeVsBestBook}`,
  circa: `+${e.circa}`,
  betus: `+${e.betus}`,
  beo: `+${e.beo}`
})));

// 2. UNRELATED CONTENDER EXACTAS: BEST AVAILABLE PRICES
// Exclude Bills and Packers
const afcContenders = ['Kansas City Chiefs', 'Baltimore Ravens', 'Cincinnati Bengals', 'Denver Broncos', 'Jacksonville Jaguars', 'Houston Texans', 'Los Angeles Chargers'];
const nfcContenders = ['Los Angeles Rams', 'San Francisco 49ers', 'Seattle Seahawks', 'Philadelphia Eagles', 'Detroit Lions', 'Dallas Cowboys', 'Minnesota Vikings', 'Chicago Bears'];

const nonPortfolioExactas = [];

for (const afc of afcContenders) {
  for (const nfc of nfcContenders) {
    const cP = calcParlayOdds(circaAFC[afc], circaNFC[nfc]);
    const bP = calcParlayOdds(bkrAFC[afc], bkrNFC[nfc]);
    const oP = calcParlayOdds(beoAFC[afc], beoNFC[nfc]);
    const uP = betusMatchups[`${afc} vs ${nfc}`] || betusMatchups[`${nfc} vs ${afc}`] || null;
    const kData = getKalshiData(afc, nfc);
    const kNet = kData?.netAmerican || null;

    const options = [
      { venue: 'Circa', odds: cP },
      { venue: 'BetUS', odds: uP },
      { venue: 'BKR', odds: bP },
      { venue: 'BEO', odds: oP }
    ];
    if (kNet) options.push({ venue: 'Kalshi (Net)', odds: kNet });
    options.filter(o => o.odds !== null).sort((a, b) => b.odds - a.odds);

    const best = options[0];

    nonPortfolioExactas.push({
      afc,
      nfc,
      matchup: `${afc} vs ${nfc}`,
      bestVenue: best.venue,
      bestPrice: `+${best.odds}`,
      circa: cP ? `+${cP}` : 'N/A',
      betus: uP ? `+${uP}` : 'N/A',
      bkr: bP ? `+${bP}` : 'N/A',
      beo: oP ? `+${oP}` : 'N/A',
      kalshiNet: kNet ? `+${kNet}` : 'N/A',
      kalshiAsk: kData?.askCents ? `${kData.askCents}¢` : 'N/A'
    });
  }
}

// Sort by best price ascending (favorites/contenders first)
nonPortfolioExactas.sort((a, b) => parseInt(a.bestPrice) - parseInt(b.bestPrice));

fs.writeFileSync('scratch/unrelated-contender-exactas.json', JSON.stringify(nonPortfolioExactas, null, 2));

console.log('\n========================================================================');
console.log('TOP 20 BEST-PRICED UNRELATED CONTENDER EXACTAS (NON-BILLS, NON-PACKERS)');
console.log('========================================================================');
console.table(nonPortfolioExactas.slice(0, 20).map(e => ({
  matchup: e.matchup,
  bestVenue: e.bestVenue,
  bestPrice: e.bestPrice,
  circa: e.circa,
  betus: e.betus,
  bkr: e.bkr,
  beo: e.beo,
  kalshiNet: e.kalshiNet
})));
