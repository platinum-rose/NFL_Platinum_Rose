// Week 11 Saturday simulation: shared margin simulator, market-centered, model half-shrunk to the 5:43 pm PT Bookmaker line.
import fs from 'node:fs';
import { loadCalibration, solveModel, analyzeGame } from '../scripts/intel/margin-simulator.mjs';
const cal = loadCalibration(); const model = solveModel(cal);
const fair = JSON.parse(fs.readFileSync('reports/intel/w11-model/fair-lines-w11.json', 'utf8'));
const F = Object.fromEntries(fair.games.map(g => [g.game, g]));
// [Bookmaker 5:43 pm home line, total, contest home line]
const NOW = {
  'MIA@BUF': [-16, 44.5, -16.5], 'NO@CHI': [-11.5, 48, -11.5], 'TEN@DAL': [-7, 55, -8], 'TB@DET': [-3.5, 47, -7],
  'ARI@KC': [-16, 41, -16], 'PIT@PHI': [4, 37.5, 4.5], 'BAL@CAR': [-3, 43.5, -2.5], 'NYJ@LAC': [-3, 42, -3.5],
  'LV@DEN': [-10.5, 40.5, -10], 'JAX@NYG': [5.5, 46, 6], 'MIN@SF': [-3.5, 46.5, -3], 'CIN@WAS': [6, 54, 6.5],
};
const SHRINK = 0.5;
const be = p => p < 0 ? -p / (-p + 100) : 100 / (p + 100);
// Recommendations to score: [game, kind, side, evalLine (home line or total), price]
const RECS = [
  ['NYJ@LAC', 'pick', 'away', -3, -103], ['JAX@NYG', 'lean', 'away', 5.5, -108], ['PIT@PHI', 'lean', 'away', 4, -102],
  ['CIN@WAS', 'lean', 'away', 6, -113], ['MIN@SF', 'lean', 'under', 46.5, -107], ['NO@CHI', 'lean', 'under', 48, -106],
];
const SC = [['TB@DET', 'away', 'TB +7'], ['TEN@DAL', 'away', 'TEN +8'], ['NYJ@LAC', 'away', 'NYJ +3.5'], ['MIN@SF', 'home', 'SF -3'],
  ['MIA@BUF', 'away', 'MIA +16.5'], ['BAL@CAR', 'home', 'CAR -2.5 (alt)'], ['LV@DEN', 'home', 'DEN -10 (alt)']];
function target(g, shrink = SHRINK) {
  const f = F[g]; const [mkt, tot] = NOW[g];
  const modelTot = 2 * f.fair_total - f.market_total; // raw model total recovered from the half-shrunk fair total
  return { line: mkt + shrink * (f.model_home_line - mkt), total: tot + shrink * (modelTot - tot), modelLine: f.model_home_line, modelTot };
}
function run(g, line, total, shrink = SHRINK) {
  const t = target(g, shrink);
  // marginAdj > 0 = home better than the evaluated line; center the distribution on the target line.
  return analyzeGame({ homeLine: line, total, marginAdj: line - t.line, totalAdj: t.total - total }, cal, model);
}
const out = { generated_at: new Date().toISOString(), method: `analyzeGame (scripts/intel/margin-simulator.mjs, calibration ${cal.path}, era ${cal.era}); center = Bookmaker 5:43 pm PT line moved ${SHRINK * 100}% toward the raw Week 11 model (SRS/DVOA/net YPP, no injury/QB adjustments); sensitivity = raw model unshrunk.`, games: {}, recs: [], supercontest: [] };
const pct = x => (100 * x).toFixed(1) + '%';
console.log('GAME       mkt   model  center | home cover  over   (excl push)');
for (const g of Object.keys(NOW)) {
  const [mkt, tot] = NOW[g]; const t = target(g); const r = run(g, mkt, tot);
  out.games[g] = { market_line: mkt, market_total: tot, model_line: +t.modelLine.toFixed(2), center_line: +t.line.toFixed(2), model_total: +t.modelTot.toFixed(2), center_total: +t.total.toFixed(2),
    home_cover_xp: r.home_cover_excl_push, away_cover_xp: r.away_cover_excl_push, over_xp: r.over_excl_push, under_xp: r.under_excl_push, side_push: r.side_push, home_win: r.home_win_excl_tie };
  console.log(`${g.padEnd(9)} ${String(mkt).padStart(6)} ${t.modelLine.toFixed(1).padStart(6)} ${t.line.toFixed(1).padStart(6)} | ${pct(r.home_cover_excl_push).padStart(6)}  ${pct(r.over_xp ?? r.over_excl_push).padStart(6)}   tot ${tot} model ${t.modelTot.toFixed(1)}`);
}
console.log('\nRECOMMENDATIONS (book price; cover excl. push vs break-even)');
for (const [g, kind, side, ln, price] of RECS) {
  const [mkt, tot] = NOW[g];
  const pr = (shrink) => { const r = side === 'under' || side === 'over' ? run(g, mkt, ln, shrink) : run(g, ln, tot, shrink);
    return side === 'away' ? r.away_cover_excl_push : side === 'home' ? r.home_cover_excl_push : side === 'under' ? r.under_excl_push : r.over_excl_push; };
  const p = pr(SHRINK), pRaw = pr(1), b = be(price);
  out.recs.push({ game: g, kind, side, line: ln, price, p_cover_xp: p, p_cover_xp_raw_model: pRaw, break_even: b, edge_pct: p - b });
  console.log(`${kind.padEnd(4)} ${g.padEnd(9)} ${side.padEnd(5)} ${String(ln).padStart(5)} ${price} | sim ${pct(p)} (raw model ${pct(pRaw)}) vs BE ${pct(b)} -> ${(100 * (p - b)).toFixed(1)} pts`);
}
console.log('\nSUPERCONTEST (contest line, no juice; win / push / loss)');
for (const [g, side, label] of SC) {
  const [, tot, contest] = NOW[g]; const r = run(g, contest, tot); const rRaw = run(g, contest, tot, 1);
  const win = side === 'home' ? r.home_cover : r.away_cover, loss = side === 'home' ? r.away_cover : r.home_cover;
  const winRaw = side === 'home' ? rRaw.home_cover_excl_push : rRaw.away_cover_excl_push;
  out.supercontest.push({ game: g, pick: label, contest_line_home: contest, p_win: win, p_push: r.side_push, p_loss: loss, p_win_xp: win / (win + loss), p_win_xp_raw_model: winRaw, exp_points: win + 0.5 * r.side_push });
  console.log(`${label.padEnd(15)} ${g.padEnd(9)} win ${pct(win)} push ${pct(r.side_push)} loss ${pct(loss)} | excl push ${pct(win / (win + loss))} (raw model ${pct(winRaw)}) | exp pts ${(win + 0.5 * r.side_push).toFixed(3)}`);
}
// Rank every contest side by expected points (win + 0.5 push) to check the five.
const all = [];
for (const g of Object.keys(NOW)) { const [, tot, c] = NOW[g]; const r = run(g, c, tot); const [a, h] = g.split('@');
  all.push([`${h} ${c > 0 ? '+' : ''}${c}`, r.home_cover + 0.5 * r.side_push], [`${a} ${-c > 0 ? '+' : ''}${-c}`, r.away_cover + 0.5 * r.side_push]); }
all.sort((x, y) => y[1] - x[1]); out.contest_rank = all.map(([s, e]) => ({ side: s, exp_points: e }));
console.log('\nCONTEST RANK (top 10 by expected points):', all.slice(0, 10).map(([s, e]) => `${s} ${e.toFixed(3)}`).join(' | '));
fs.writeFileSync('reports/intel/w11-model/sim-w11-sat.json', JSON.stringify(out, null, 1));
console.log('\nwrote reports/intel/w11-model/sim-w11-sat.json');
