// scratch/find-circa-best.mjs
import fs from 'node:fs';
import { calculateNetOdds } from '../src/lib/predictionMarkets.js';

const circaData = JSON.parse(fs.readFileSync('data/futures-imports/circa-2026-09-22-live-futures-markets.json', 'utf8'));
const bkrData = JSON.parse(fs.readFileSync('data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json', 'utf8'));
const beoData = JSON.parse(fs.readFileSync('data/futures-imports/betonline-2026-09-22-live-futures-markets.json', 'utf8'));
const rawBetUS = fs.readFileSync('docs/Futures_Odds/BetUS_Odds_0916', 'utf8');
const kalshiSbRaw = JSON.parse(fs.readFileSync('scratch/kalshi-sb-matchups.json', 'utf8'));

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
      if (match) map[match[2].trim()] = parseInt(match[3], 10);
    }
  }
  return map;
}
const betusMap = parseBetUSMatchups(rawBetUS);

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
  const askCents = Math.round(parseFloat(m.yes_ask_dollars || '0') * 100);
  const buyCents = askCents > 0 ? askCents : null;
  let netOdds = null;
  if (buyCents) {
    const netEval = calculateNetOdds({ priceCents: buyCents, exchange: 'kalshi', applyFee: true });
    netOdds = netEval.netAmericanOdds;
  }
  kalshiMap[`${t1} vs ${t2}`] = { ticker: m.ticker, askCents, netOdds };
  kalshiMap[`${t2} vs ${t1}`] = { ticker: m.ticker, askCents, netOdds };
}

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

const allRows = [];

for (const afc of Object.keys(circaAFC)) {
  for (const nfc of Object.keys(circaNFC)) {
    const cP = calcParlayOdds(circaAFC[afc], circaNFC[nfc]);
    const bP = calcParlayOdds(bkrAFC[afc], bkrNFC[nfc]);
    const oP = calcParlayOdds(beoAFC[afc], beoNFC[nfc]);
    const uP = betusMap[`${afc} vs ${nfc}`] || betusMap[`${nfc} vs ${afc}`] || null;
    const kData = getKalshiData(afc, nfc);
    const kNet = kData?.netOdds || null;

    const venues = [
      { name: 'Circa', odds: cP },
      { name: 'BetUS', odds: uP },
      { name: 'BookMaker', odds: bP },
      { name: 'BetOnline', odds: oP }
    ];
    if (kNet) venues.push({ name: 'Kalshi (Net)', odds: kNet });

    const validVenues = venues.filter(v => v.odds !== null).sort((a, b) => b.odds - a.odds);
    const best = validVenues[0];
    const second = validVenues[1];

    const circaRank = validVenues.findIndex(v => v.name === 'Circa') + 1;
    const maxOther = Math.max(...venues.filter(v => v.name !== 'Circa' && v.odds !== null).map(v => v.odds));
    const circaAdvantage = cP - maxOther;

    allRows.push({
      afc,
      nfc,
      matchup: `${afc} vs ${nfc}`,
      afcOdds: circaAFC[afc],
      nfcOdds: circaNFC[nfc],
      circaPrice: cP,
      circaRotations: `${circaData.rotationNumbers.AFC[afc]} x ${circaData.rotationNumbers.NFC[nfc]}`,
      bestVenue: best.name,
      bestPrice: best.odds,
      secondVenue: second?.name,
      secondPrice: second?.odds,
      circaRank,
      circaAdvantage,
      bkr: bP,
      beo: oP,
      betus: uP,
      kalshiNet: kNet
    });
  }
}

// 1. Where Circa is #1 OVERALL across all 5 venues
const circaIsNumberOne = allRows.filter(r => r.circaRank === 1);
console.log(`Circa is #1 overall in ${circaIsNumberOne.length} matchups!`);

// 2. Where Circa beats all traditional sportsbooks (excluding Kalshi)
const circaBeatsAllBooks = allRows.filter(r => {
  const books = [r.bkr, r.beo, r.betus].filter(Boolean);
  return r.circaPrice > Math.max(...books);
});
console.log(`Circa beats all traditional sportsbooks in ${circaBeatsAllBooks.length} matchups!`);

// Sort by Contender strength (AFC odds + NFC odds lower = higher probability)
const contenderCircaWins = circaIsNumberOne
  .filter(r => r.afcOdds <= 2500 && r.nfcOdds <= 2500)
  .sort((a, b) => a.circaPrice - b.circaPrice);

console.log('\n=== TOP CONTENDER EXACTAS WHERE CIRCA IS #1 IN THE ENTIRE MARKET ===');
console.table(contenderCircaWins.map(r => ({
  matchup: r.matchup,
  rotations: r.circaRotations,
  circaPrice: `+${r.circaPrice}`,
  secondBest: `${r.secondVenue} (+${r.secondPrice})`,
  circaEdge: `+${r.circaAdvantage}`,
  bkr: `+${r.bkr}`,
  beo: `+${r.beo}`,
  betus: `+${r.betus}`
})));

// Also look at Circa wins across all teams sorted by edge
console.log('\n=== ALL EXACTAS WHERE CIRCA BEATS ALL OTHER VENUES (SORTED BY EDGE) ===');
const sortedByEdge = circaIsNumberOne.sort((a, b) => b.circaAdvantage - a.circaAdvantage);
console.table(sortedByEdge.slice(0, 20).map(r => ({
  matchup: r.matchup,
  rotations: r.circaRotations,
  circaPrice: `+${r.circaPrice}`,
  secondBest: `${r.secondVenue} (+${r.secondPrice})`,
  circaEdge: `+${r.circaAdvantage}`,
  bkr: `+${r.bkr}`,
  beo: `+${r.beo}`,
  betus: `+${r.betus}`
})));

fs.writeFileSync('scratch/circa-best-matchups.json', JSON.stringify({ contenderCircaWins, sortedByEdge }, null, 2));
