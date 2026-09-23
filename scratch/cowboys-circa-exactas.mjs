// scratch/cowboys-circa-exactas.mjs
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
        map[match[2].trim()] = { rot: match[1], price: parseInt(match[3], 10) };
      }
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

const cowboysCircaNfc = circaNFC['Dallas Cowboys']; // +1100
const cowboysCircaRot = circaData.rotationNumbers.NFC['Dallas Cowboys']; // 14572

console.log(`Cowboys NFC Odds: Circa +${cowboysCircaNfc} (Rot ${cowboysCircaRot}) | BKR +${bkrNFC['Dallas Cowboys']} | BEO +${beoNFC['Dallas Cowboys']}`);

const results = [];

for (const [afcTeam, afcOdds] of Object.entries(circaAFC)) {
  const cParlay = calcParlayOdds(afcOdds, cowboysCircaNfc);
  const afcRot = circaData.rotationNumbers.AFC[afcTeam];

  const bA = bkrAFC[afcTeam];
  const bN = bkrNFC['Dallas Cowboys'];
  const bParlay = (bA && bN) ? calcParlayOdds(bA, bN) : null;

  const oA = beoAFC[afcTeam];
  const oN = beoNFC['Dallas Cowboys'];
  const oParlay = (oA && oN) ? calcParlayOdds(oA, oN) : null;

  const bUs = betusMap[`${afcTeam} vs Dallas Cowboys`] || betusMap[`Dallas Cowboys vs ${afcTeam}`] || null;

  // Kalshi lookup
  let kMatch = null;
  const shortAfc = afcTeam.split(' ').pop();
  for (const [k, v] of Object.entries(kalshiMap)) {
    if (k.includes('Dallas') && (k.includes(shortAfc) || k.includes(afcTeam.split(' ')[0]))) {
      kMatch = v;
      break;
    }
  }

  const allVenues = [
    { name: 'Circa', odds: cParlay },
    { name: 'BetUS', odds: bUs?.price || null },
    { name: 'BKR', odds: bParlay },
    { name: 'BEO', odds: oParlay }
  ];
  if (kMatch?.netOdds) {
    allVenues.push({ name: 'Kalshi (Net)', odds: kMatch.netOdds });
  }

  const validVenues = allVenues.filter(v => v.odds !== null).sort((a, b) => b.odds - a.odds);
  const best = validVenues[0];

  const circaBeatsBkr = bParlay ? cParlay > bParlay : null;
  const circaBeatsBeo = oParlay ? cParlay > oParlay : null;
  const circaBeatsBetUs = bUs ? cParlay > bUs.price : null;

  results.push({
    afcTeam,
    afcRot,
    afcOdds: `+${afcOdds}`,
    circaParlay: cParlay,
    rotCombo: `${afcRot} x ${cowboysCircaRot}`,
    bkr: bParlay,
    beo: oParlay,
    betus: bUs?.price || null,
    kalshiNet: kMatch?.netOdds || null,
    kalshiAsk: kMatch?.askCents ? `${kMatch.askCents}¢` : null,
    bestVenue: best.name,
    bestPrice: best.odds,
    circaWins: best.name === 'Circa',
    diffVsBkr: bParlay ? (cParlay - bParlay) : null
  });
}

// Sort by Circa parlay odds ascending
results.sort((a, b) => a.circaParlay - b.circaParlay);

console.log('\n=== ALL 16 COWBOYS VS AFC EXACTAS AT CIRCA SPORTS ===');
console.table(results.map(r => ({
  matchup: `Cowboys vs ${r.afcTeam}`,
  circaAFC: r.afcOdds,
  circaParlay: `+${r.circaParlay}`,
  circaRotations: r.rotCombo,
  bkr: r.bkr ? `+${r.bkr}` : 'N/A',
  beo: r.beo ? `+${r.beo}` : 'N/A',
  betus: r.betus ? `+${r.betus}` : 'N/A',
  bestInMarket: `${r.bestVenue} (+${r.bestPrice})`,
  circaIsBest: r.circaWins ? 'YES' : 'NO'
})));

fs.writeFileSync('scratch/cowboys-circa-results.json', JSON.stringify(results, null, 2));
