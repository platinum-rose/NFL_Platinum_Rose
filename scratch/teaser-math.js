// Margin frequencies in NFL (2003-2024, ~5,500 games)
// Key numbers:
// 3: ~14.8% of all games
// 7: ~9.1%
// 6: ~6.0%
// 4: ~5.3%
// 10: ~5.1%
// 1: ~4.1%
// 2: ~4.0%
// 5: ~3.2%
// 8: ~2.9%

// Let's analyze Leg 1: Packers -5 to PK (5 pts)
// Normal cover prob of -5 at -110 is ~50.0%.
// To win at PK, Packers just need to win the game (margin >= 1).
// Margins gained by moving from -5 to PK:
// Winning by 1, 2, 3, 4, 5.
// Margin 1: ~2.1% (favorite wins by 1)
// Margin 2: ~2.2% (favorite wins by 2)
// Margin 3: ~9.2% (favorite wins by 3, when favored by 5)
// Margin 4: ~3.1% (favorite wins by 4)
// Margin 5: ~2.2% (favorite wins by 5 - this turns a push into a win)
// In NFL history, teasing a 5-point favorite down to PK hits at approximately 69.5% to 71.0%.
// Notice: 70% < 73.85% required break-even!

// Let's analyze Leg 2: Cowboys +3 to +8 (5 pts)
// Normal cover prob of +3 at -110 is ~50.0% (with ~10% push at 3).
// Margins gained by moving from +3 to +8:
// Losing by 3 (turns push into win): ~5.5% (approx 9-10% of games land on 3, half on dog)
// Losing by 4: ~2.2%
// Losing by 5: ~1.5%
// Losing by 6: ~2.8%
// Losing by 7: ~4.2%
// Losing by 8: ~1.4% (turns loss into push/win depending on ties)
// Historically, teasing a +3 underdog up to +8 hits at approximately 71.5% to 72.5%.
// Notice: 72% < 73.85% required break-even!

// Compare to a TRUE Basic Strategy / Wong Leg (6 pts, crossing 3 AND 7):
// Underdog +1.5 to +7.5 (or +2 to +8, +2.5 to +8.5):
// Historically covers 75.5% to 76.5%!
// Favorite -7.5 to -1.5 (or -8 to -2, -8.5 to -2.5):
// Historically covers 74.8% to 75.8%!

console.log('--- EMPIRICAL COMPARISON ---');
const beRequired = Math.sqrt(120 / 220); // 73.85%
console.log('Required win rate per leg at -120:', (beRequired * 100).toFixed(2) + '%');

const pLeg1 = 0.705; // Packers -5 to PK
const pLeg2 = 0.720; // Cowboys +3 to +8
const pCombo = pLeg1 * pLeg2;
const evTicket = (pCombo * 100) - ((1 - pCombo) * 120);
const roiTicket = (evTicket / 120) * 100;

console.log('\nTicket Actual (Packers -5->PK & Cowboys +3->+8):');
console.log(`Leg 1 Estimated Win Rate: ${(pLeg1 * 100).toFixed(1)}%`);
console.log(`Leg 2 Estimated Win Rate: ${(pLeg2 * 100).toFixed(1)}%`);
console.log(`Combo Win Rate: ${(pCombo * 100).toFixed(2)}% (vs 54.55% break-even)`);
console.log(`Expected Value ($120 bet): $${evTicket.toFixed(2)}`);
console.log(`Expected ROI: ${roiTicket.toFixed(2)}%`);

const pWongLeg1 = 0.755;
const pWongLeg2 = 0.755;
const pWongCombo = pWongLeg1 * pWongLeg2;
const evWong = (pWongCombo * 100) - ((1 - pWongCombo) * 120);
const roiWong = (evWong / 120) * 100;

console.log('\nIdeal Classic Wong 6-Pt Teaser at -120 (e.g. +2->+8 and -7.5->-1.5):');
console.log(`Combo Win Rate: ${(pWongCombo * 100).toFixed(2)}%`);
console.log(`Expected Value ($120 bet): $${evWong.toFixed(2)}`);
console.log(`Expected ROI: +${roiWong.toFixed(2)}%`);
