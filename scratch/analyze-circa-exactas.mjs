// scratch/analyze-circa-exactas.mjs
import fs from 'node:fs';

const circaData = JSON.parse(fs.readFileSync('data/futures-imports/circa-2026-09-22-live-futures-markets.json', 'utf8'));
const bkrData = JSON.parse(fs.readFileSync('data/futures-imports/bookmaker-2026-09-22-live-futures-markets.json', 'utf8'));
const beoData = JSON.parse(fs.readFileSync('data/futures-imports/betonline-2026-09-22-live-futures-markets.json', 'utf8'));
const ledger = JSON.parse(fs.readFileSync('data/futures-imports/andy-portfolio-ledger-2026.json', 'utf8'));

function americanToDecimal(odds) {
  if (odds > 0) return (odds / 100) + 1;
  return (100 / Math.abs(odds)) + 1;
}

function decimalToAmerican(dec) {
  const profit = dec - 1;
  if (profit >= 1) {
    return Math.round(profit * 100);
  } else {
    return Math.round(-100 / profit);
  }
}

function calcParlayOdds(odds1, odds2) {
  const d1 = americanToDecimal(odds1);
  const d2 = americanToDecimal(odds2);
  const parlayDec = d1 * d2;
  return decimalToAmerican(parlayDec);
}

const circaAFC = circaData.marketSnapshots.conference.AFC;
const circaNFC = circaData.marketSnapshots.conference.NFC;

const bkrAFC = bkrData.marketSnapshots.conference.AFC;
const bkrNFC = bkrData.marketSnapshots.conference.NFC;

const beoAFC = beoData.marketSnapshots.conference.AFC;
const beoNFC = beoData.marketSnapshots.conference.NFC;

console.log('========================================================================');
console.log('1. PORTFOLIO CURRENT EXACTAS VS CIRCA PARLAY');
console.log('========================================================================');

const portfolioExactas = ledger.positions.filter(p => p.market === 'superbowl_matchup');

const comparison = [];

for (const p of portfolioExactas) {
  // Format is either "Team A vs Team B" (NFC vs AFC or AFC vs NFC)
  const [t1, t2] = p.selection.split(' vs ');
  let afcTeam = null;
  let nfcTeam = null;
  
  if (circaAFC[t1]) { afcTeam = t1; nfcTeam = t2; }
  else if (circaAFC[t2]) { afcTeam = t2; nfcTeam = t1; }
  
  const placedPrice = p.price;
  const circaAfcPrice = circaAFC[afcTeam];
  const circaNfcPrice = circaNFC[nfcTeam];
  
  let circaParlay = null;
  if (circaAfcPrice && circaNfcPrice) {
    circaParlay = calcParlayOdds(circaAfcPrice, circaNfcPrice);
  }
  
  // Also check if we can compute BKR and BEO conference parlays
  const bkrParlay = (bkrAFC[afcTeam] && bkrNFC[nfcTeam]) ? calcParlayOdds(bkrAFC[afcTeam], bkrNFC[nfcTeam]) : null;
  const beoParlay = (beoAFC[afcTeam] && beoNFC[nfcTeam]) ? calcParlayOdds(beoAFC[afcTeam], beoNFC[nfcTeam]) : null;

  comparison.push({
    id: p.id,
    matchup: `${afcTeam} vs ${nfcTeam}`,
    placedPrice: `+${placedPrice}`,
    placedStake: `$${p.stake_usd}`,
    placedToWin: `$${p.to_win_usd}`,
    circaAFC: `+${circaAfcPrice}`,
    circaNFC: `+${circaNfcPrice}`,
    circaParlay: `+${circaParlay}`,
    diffVsCirca: circaParlay ? (circaParlay - placedPrice) : 'N/A',
    bkrParlay: bkrParlay ? `+${bkrParlay}` : 'N/A',
    beoParlay: beoParlay ? `+${beoParlay}` : 'N/A'
  });
}

console.table(comparison);

console.log('\n========================================================================');
console.log('2. CROSS-BOOK CONFERENCE ODDS COMPARISON (CIRCA vs BOOKMAKER vs BETONLINE)');
console.log('========================================================================');

console.log('\n--- AFC ---');
const afcComp = Object.keys(circaAFC).map(team => ({
  team,
  circa: `+${circaAFC[team]}`,
  bookmaker: bkrAFC[team] ? `+${bkrAFC[team]}` : 'N/A',
  betonline: beoAFC[team] ? `+${beoAFC[team]}` : 'N/A'
})).sort((a, b) => parseInt(a.circa) - parseInt(b.circa));
console.table(afcComp);

console.log('\n--- NFC ---');
const nfcComp = Object.keys(circaNFC).map(team => ({
  team,
  circa: `+${circaNFC[team]}`,
  bookmaker: bkrNFC[team] ? `+${bkrNFC[team]}` : 'N/A',
  betonline: beoNFC[team] ? `+${beoNFC[team]}` : 'N/A'
})).sort((a, b) => parseInt(a.circa) - parseInt(b.circa));
console.table(nfcComp);

console.log('\n========================================================================');
console.log('3. ALL BUFFALO BILLS EXACTAS (CIRCA PARLAY)');
console.log('========================================================================');
const billsExactas = Object.keys(circaNFC).map(nfc => {
  const circaOdds = calcParlayOdds(circaAFC['Buffalo Bills'], circaNFC[nfc]);
  const bkrOdds = (bkrAFC['Buffalo Bills'] && bkrNFC[nfc]) ? calcParlayOdds(bkrAFC['Buffalo Bills'], bkrNFC[nfc]) : null;
  const beoOdds = (beoAFC['Buffalo Bills'] && beoNFC[nfc]) ? calcParlayOdds(beoAFC['Buffalo Bills'], beoNFC[nfc]) : null;
  return {
    matchup: `Bills vs ${nfc}`,
    nfcOdds: `+${circaNFC[nfc]}`,
    circaParlay: `+${circaOdds}`,
    bkrParlay: bkrOdds ? `+${bkrOdds}` : 'N/A',
    beoParlay: beoOdds ? `+${beoOdds}` : 'N/A'
  };
}).sort((a, b) => parseInt(a.circaParlay) - parseInt(b.circaParlay));
console.table(billsExactas);

console.log('\n========================================================================');
console.log('4. ALL GREEN BAY PACKERS EXACTAS (CIRCA PARLAY)');
console.log('========================================================================');
const gbExactas = Object.keys(circaAFC).map(afc => {
  const circaOdds = calcParlayOdds(circaAFC[afc], circaNFC['Green Bay Packers']);
  const bkrOdds = (bkrAFC[afc] && bkrNFC['Green Bay Packers']) ? calcParlayOdds(bkrAFC[afc], bkrNFC['Green Bay Packers']) : null;
  const beoOdds = (beoAFC[afc] && beoNFC['Green Bay Packers']) ? calcParlayOdds(beoAFC[afc], beoNFC['Green Bay Packers']) : null;
  return {
    matchup: `${afc} vs Packers`,
    afcOdds: `+${circaAFC[afc]}`,
    circaParlay: `+${circaOdds}`,
    bkrParlay: bkrOdds ? `+${bkrOdds}` : 'N/A',
    beoParlay: beoOdds ? `+${beoOdds}` : 'N/A'
  };
}).sort((a, b) => parseInt(a.circaParlay) - parseInt(b.circaParlay));
console.table(gbExactas);

console.log('\n========================================================================');
console.log('5. TOP TIER EXACTA OPPORTUNITIES ACROSS ALL CONTENDERS');
console.log('========================================================================');
const allExactas = [];
for (const afc of Object.keys(circaAFC)) {
  for (const nfc of Object.keys(circaNFC)) {
    const circaOdds = calcParlayOdds(circaAFC[afc], circaNFC[nfc]);
    const bkrOdds = (bkrAFC[afc] && bkrNFC[nfc]) ? calcParlayOdds(bkrAFC[afc], bkrNFC[nfc]) : null;
    const beoOdds = (beoAFC[afc] && beoNFC[nfc]) ? calcParlayOdds(beoAFC[afc], beoNFC[nfc]) : null;
    allExactas.push({
      matchup: `${afc} vs ${nfc}`,
      afc,
      nfc,
      circaAFC: circaAFC[afc],
      circaNFC: circaNFC[nfc],
      circaParlay: circaOdds,
      bkrParlay: bkrOdds,
      beoParlay: beoOdds
    });
  }
}

// Filter to top contenders: AFC <= +1200, NFC <= +1600
const contenderExactas = allExactas
  .filter(e => e.circaAFC <= 1200 && e.circaNFC <= 1600)
  .sort((a, b) => a.circaParlay - b.circaParlay);

console.table(contenderExactas.map(e => ({
  matchup: e.matchup,
  circaParlay: `+${e.circaParlay}`,
  bkrParlay: e.bkrParlay ? `+${e.bkrParlay}` : 'N/A',
  beoParlay: e.beoParlay ? `+${e.beoParlay}` : 'N/A',
  bestBook: (e.circaParlay >= (e.bkrParlay || 0) && e.circaParlay >= (e.beoParlay || 0)) ? 'CIRCA' : ( (e.bkrParlay || 0) >= (e.beoParlay || 0) ? 'BKR' : 'BEO')
})));
