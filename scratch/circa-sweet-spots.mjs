// scratch/circa-sweet-spots.mjs
import fs from 'node:fs';

const circaData = JSON.parse(fs.readFileSync('data/futures-imports/circa-2026-09-22-live-futures-markets.json', 'utf8'));
const bkrData = JSON.parse(fs.readFileSync('data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json', 'utf8'));
const beoData = JSON.parse(fs.readFileSync('data/futures-imports/betonline-2026-09-22-live-futures-markets.json', 'utf8'));

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

const rows = [];

for (const [afc, aOdds] of Object.entries(circaAFC)) {
  for (const [nfc, nOdds] of Object.entries(circaNFC)) {
    const cParlay = calcParlayOdds(aOdds, nOdds);
    const bkrParlay = (bkrAFC[afc] && bkrNFC[nfc]) ? calcParlayOdds(bkrAFC[afc], bkrNFC[nfc]) : null;
    const beoParlay = (beoAFC[afc] && beoNFC[nfc]) ? calcParlayOdds(beoAFC[afc], beoNFC[nfc]) : null;
    
    const maxOther = Math.max(bkrParlay || 0, beoParlay || 0);
    const edgeVsBestOther = cParlay - maxOther;
    
    rows.push({
      afc,
      nfc,
      matchup: `${afc} vs ${nfc}`,
      circaAFC: aOdds,
      circaNFC: nOdds,
      circaParlay: cParlay,
      bkrParlay,
      beoParlay,
      maxOther,
      edgeVsBestOther,
      circaIsBest: cParlay > maxOther,
      circaIsTiedOrBest: cParlay >= maxOther
    });
  }
}

// Filter to where Circa is BEST and teams are contenders (AFC <= +1500, NFC <= +2000)
const topCircaEdges = rows
  .filter(r => r.circaAFC <= 1500 && r.circaNFC <= 2000 && r.circaIsBest)
  .sort((a, b) => b.edgeVsBestOther - a.edgeVsBestOther);

console.log('--- TOP CIRCA ADVANTAGE EXACTAS (Where Circa Beats BKR & BEO) ---');
console.table(topCircaEdges.map(r => ({
  matchup: r.matchup,
  circaParlay: `+${r.circaParlay}`,
  bestOther: `+${r.maxOther}`,
  circaAdvantage: `+${r.edgeVsBestOther}`,
  bkr: `+${r.bkrParlay}`,
  beo: `+${r.beoParlay}`
})));

// Portfolio coverage check
console.log('\n--- PORTFOLIO ANCHOR COVERAGE GAPS ---');
console.log('Bills exactas not currently in portfolio:');
const currentBillsExactaNfc = ['Green Bay Packers', 'Seattle Seahawks', 'Detroit Lions', 'Philadelphia Eagles'];
const missingBillsExactas = rows
  .filter(r => r.afc === 'Buffalo Bills' && !currentBillsExactaNfc.includes(r.nfc) && r.circaNFC <= 3500)
  .sort((a, b) => a.circaParlay - b.circaParlay);

console.table(missingBillsExactas.map(r => ({
  matchup: r.matchup,
  nfcOdds: `+${r.circaNFC}`,
  circaParlay: `+${r.circaParlay}`,
  bkrParlay: `+${r.bkrParlay}`,
  beoParlay: `+${r.beoParlay}`
})));

console.log('\nPackers exactas not currently in portfolio:');
const currentPackersExactaAfc = ['Buffalo Bills', 'Baltimore Ravens', 'Kansas City Chiefs', 'Cincinnati Bengals', 'Pittsburgh Steelers'];
const missingPackersExactas = rows
  .filter(r => r.nfc === 'Green Bay Packers' && !currentPackersExactaAfc.includes(r.afc) && r.circaAFC <= 2500)
  .sort((a, b) => a.circaParlay - b.circaParlay);

console.table(missingPackersExactas.map(r => ({
  matchup: r.matchup,
  afcOdds: `+${r.circaAFC}`,
  circaParlay: `+${r.circaParlay}`,
  bkrParlay: `+${r.bkrParlay}`,
  beoParlay: `+${r.beoParlay}`
})));
