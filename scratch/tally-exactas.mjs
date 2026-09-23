import fs from 'node:fs';

const ledger = JSON.parse(fs.readFileSync('data/futures-imports/andy-portfolio-ledger-2026.json', 'utf8'));
const wagers = JSON.parse(fs.readFileSync('data/official-picks/user-placed-wagers-2026.json', 'utf8'));

console.log('=== EXACTAS IN ANDY-PORTFOLIO-LEDGER-2026.JSON ===');
const ledgerExactas = ledger.positions.filter(p => p.market === 'superbowl_matchup');

let totalStake = 0;
let totalToWin = 0;

for (const p of ledgerExactas) {
  totalStake += p.stake_usd;
  totalToWin += p.to_win_usd;
}

console.table(ledgerExactas.map(p => ({
  id: p.id,
  matchup: p.selection,
  role: p.role,
  stake: '$' + p.stake_usd.toFixed(2),
  odds: '+' + p.price,
  to_win: '$' + p.to_win_usd.toFixed(2),
  total_return: '$' + (p.stake_usd + p.to_win_usd).toFixed(2),
  book: p.book,
  ticket: p.ticket_number,
  date: p.accepted_date
})));

console.log('TOTAL RISKED ON EXACTAS: $' + totalStake.toFixed(2));
console.log('TOTAL POTENTIAL WIN ON EXACTAS: $' + totalToWin.toFixed(2));
console.log('BLENDED PAYOUT MULTIPLIER: ' + (totalToWin / totalStake).toFixed(2) + 'x (+' + Math.round((totalToWin / totalStake) * 100) + ')');

console.log('\n=== CHECKING USER-PLACED-WAGERS-2026.JSON FOR ANY EXACTAS ===');
const wagerList = wagers.wagers || wagers.bets || (Array.isArray(wagers) ? wagers : []);
console.log('Total wagers in user-placed-wagers-2026.json:', wagerList.length);
const exactasInWagers = wagerList.filter(w => /exacta|matchup/i.test(JSON.stringify(w)));
console.log('Exactas in user-placed-wagers:', exactasInWagers.length);
