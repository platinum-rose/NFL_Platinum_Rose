// scratch/compare-betus-exactas.mjs
import fs from 'node:fs';

const rawBetUS = fs.readFileSync('docs/Futures_Odds/BetUS_Odds_0916', 'utf8');
const circaData = JSON.parse(fs.readFileSync('data/futures-imports/circa-2026-09-22-live-futures-markets.json', 'utf8'));
const bkrData = JSON.parse(fs.readFileSync('data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json', 'utf8'));
const beoData = JSON.parse(fs.readFileSync('data/futures-imports/betonline-2026-09-22-live-futures-markets.json', 'utf8'));
const ledger = JSON.parse(fs.readFileSync('data/futures-imports/andy-portfolio-ledger-2026.json', 'utf8'));

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
      // e.g. "1001\tBuffalo Bills vs Seattle Seahawks    \t +3300"
      const match = line.match(/^\s*(\d+)\s+([A-Za-z0-9 ]+ vs [A-Za-z0-9 ]+)\s+([+-]\d+)/);
      if (match) {
        const rot = match[1];
        const matchup = match[2].trim();
        const price = parseInt(match[3], 10);
        map[matchup] = { rot, price };
      }
    }
  }
  return map;
}

const betusMatchups = parseBetUSMatchups(rawBetUS);
console.log(`Parsed ${Object.keys(betusMatchups).length} BetUS Super Bowl Matchups!`);

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
  return decimalToAmerican(americanToDecimal(odds1) * americanToDecimal(odds2));
}

const circaAFC = circaData.marketSnapshots.conference.AFC;
const circaNFC = circaData.marketSnapshots.conference.NFC;
const bkrAFC = bkrData.marketSnapshots.conference.AFC;
const bkrNFC = bkrData.marketSnapshots.conference.NFC;
const beoAFC = beoData.marketSnapshots.conference.AFC;
const beoNFC = beoData.marketSnapshots.conference.NFC;

function getOddsForMatchup(afc, nfc) {
  const cA = circaAFC[afc];
  const cN = circaNFC[nfc];
  const cParlay = (cA && cN) ? calcParlayOdds(cA, cN) : null;

  const bA = bkrAFC[afc];
  const bN = bkrNFC[nfc];
  const bParlay = (bA && bN) ? calcParlayOdds(bA, bN) : null;

  const oA = beoAFC[afc];
  const oN = beoNFC[nfc];
  const oParlay = (oA && oN) ? calcParlayOdds(oA, oN) : null;

  const name1 = `${afc} vs ${nfc}`;
  const name2 = `${nfc} vs ${afc}`;
  const bus = betusMatchups[name1] || betusMatchups[name2] || null;

  return {
    afc,
    nfc,
    matchup: `${afc} vs ${nfc}`,
    circa: cParlay,
    betus: bus ? bus.price : null,
    betusRot: bus ? bus.rot : null,
    bkr: bParlay,
    beo: oParlay
  };
}

console.log('\n========================================================================');
console.log('1. TARGET MATCHUPS: CIRCA vs BETUS vs BOOKMAKER vs BETONLINE');
console.log('========================================================================');

const targetPairs = [
  ['Baltimore Ravens', 'Seattle Seahawks'],
  ['Baltimore Ravens', 'Los Angeles Rams'],
  ['Baltimore Ravens', 'San Francisco 49ers'],
  ['Buffalo Bills', 'Seattle Seahawks'],
  ['Buffalo Bills', 'Los Angeles Rams'],
  ['Buffalo Bills', 'San Francisco 49ers'],
  ['Baltimore Ravens', 'Green Bay Packers'],
  ['Baltimore Ravens', 'Philadelphia Eagles'],
  ['Baltimore Ravens', 'Minnesota Vikings'],
  ['New England Patriots', 'Seattle Seahawks'],
  ['New England Patriots', 'Green Bay Packers']
];

const targetRows = targetPairs.map(([afc, nfc]) => {
  const d = getOddsForMatchup(afc, nfc);
  const prices = [
    { book: 'Circa', p: d.circa },
    { book: 'BetUS', p: d.betus },
    { book: 'BKR', p: d.bkr },
    { book: 'BEO', p: d.beo }
  ].filter(x => x.p !== null);
  prices.sort((a, b) => b.p - a.p);
  const best = prices[0];

  return {
    matchup: d.matchup,
    circa: d.circa ? `+${d.circa}` : 'N/A',
    betus: d.betus ? `+${d.betus}` : 'N/A',
    bkr: d.bkr ? `+${d.bkr}` : 'N/A',
    beo: d.beo ? `+${d.beo}` : 'N/A',
    bestBook: `${best.book} (+${best.p})`,
    circaVsBetUS: (d.circa && d.betus) ? (d.circa - d.betus > 0 ? `+${d.circa - d.betus}` : `${d.circa - d.betus}`) : 'N/A'
  };
});

console.table(targetRows);

console.log('\n========================================================================');
console.log('2. EXISTING PORTFOLIO EXACTAS VS BETUS');
console.log('========================================================================');

const portfolioRows = ledger.positions
  .filter(p => p.market === 'superbowl_matchup')
  .map(p => {
    const [t1, t2] = p.selection.split(' vs ');
    const afc = circaAFC[t1] ? t1 : t2;
    const nfc = circaAFC[t1] ? t2 : t1;
    const d = getOddsForMatchup(afc, nfc);
    return {
      matchup: `${afc} vs ${nfc}`,
      placed: `+${p.price}`,
      circa: d.circa ? `+${d.circa}` : 'N/A',
      betus: d.betus ? `+${d.betus}` : 'N/A',
      bkr: d.bkr ? `+${d.bkr}` : 'N/A',
      beo: d.beo ? `+${d.beo}` : 'N/A',
      placedVsBetUS: d.betus ? (p.price - d.betus > 0 ? `+${p.price - d.betus}` : `${p.price - d.betus}`) : 'N/A'
    };
  });

console.table(portfolioRows);
