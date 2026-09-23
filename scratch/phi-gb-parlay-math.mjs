// scratch/phi-gb-parlay-math.mjs
function mlToDecimal(ml) {
  if (ml > 0) return (ml / 100) + 1;
  return (100 / Math.abs(ml)) + 1;
}

function decimalToAmerican(dec) {
  const profit = dec - 1;
  if (profit >= 1) return `+${Math.round(profit * 100)}`;
  return `-${Math.round(100 / profit)}`;
}

const scenarios = [
  { name: 'BKR Live (9/22 18:59 PT)', gb: -265, phi: -232, chiML: +200 },
  { name: 'Consensus (-260 / -225)', gb: -260, phi: -225, chiML: +195 },
  { name: 'Best Market (-250 / -220)', gb: -250, phi: -220, chiML: +190 },
  { name: 'Pessimistic (-275 / -240)', gb: -275, phi: -240, chiML: +210 }
];

console.log('=== WEEK 3 PHI ML + GB ML 2-TEAM PARLAY MATH ===');

for (const s of scenarios) {
  const d1 = mlToDecimal(s.gb);
  const d2 = mlToDecimal(s.phi);
  const parlayDec = d1 * d2;
  const american = decimalToAmerican(parlayDec);
  const profitPer100 = (parlayDec - 1) * 100;

  console.log(`\nScenario: ${s.name}`);
  console.log(`  GB ML: ${s.gb} (Dec: ${d1.toFixed(4)})`);
  console.log(`  PHI ML: ${s.phi} (Dec: ${d2.toFixed(4)})`);
  console.log(`  Combined Parlay: ${american} (Multiplier: ${parlayDec.toFixed(4)}x)`);
  console.log(`  $100 bet pays: $${profitPer100.toFixed(2)} profit (Total return: $${(profitPer100 + 100).toFixed(2)})`);

  // Sizing ladder
  console.log('  Staking Ladder:');
  for (const stake of [10, 20, 25, 50, 100]) {
    const p = stake * (parlayDec - 1);
    console.log(`    $${stake} stake -> Profit: $${p.toFixed(2)} (Total Return: $${(stake + p).toFixed(2)})`);
  }
}
