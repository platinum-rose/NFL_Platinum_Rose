// Week 11 Saturday simulation v2 (Andy, 8:17 pm PT): pipeline-standard double shrink + FTN matchup-analytics sensitivity.
//  Main view:   center = Bookmaker 5:43 pm line moved 50% toward the team-strength model (point shrink), then the sim
//               probability is blended 50/50 with the market probability (no-vig from both prices; for contest lines,
//               the market-only sim at the contest line). Same convention as Friday's packets.
//  Sensitivity: identical pipeline with the FTN EPA matchup projection in place of the team-strength model.
import fs from 'node:fs';
import { loadCalibration, solveModel, analyzeGame } from '../scripts/intel/margin-simulator.mjs';
const cal = loadCalibration(); const model = solveModel(cal);
const J = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fair = J('reports/intel/w11-model/fair-lines-w11.json');
const F = Object.fromEntries(fair.games.map(g => [g.game, g]));
// [Bookmaker 5:43 pm PT home line, total, contest home line]
const NOW = {
  'MIA@BUF': [-16, 44.5, -16.5], 'NO@CHI': [-11.5, 48, -11.5], 'TEN@DAL': [-7, 55, -8], 'TB@DET': [-3.5, 47, -7],
  'ARI@KC': [-16, 41, -16], 'PIT@PHI': [4, 37.5, 4.5], 'BAL@CAR': [-3, 43.5, -2.5], 'NYJ@LAC': [-3, 42, -3.5],
  'LV@DEN': [-10.5, 40.5, -10], 'JAX@NYG': [5.5, 46, 6], 'MIN@SF': [-3.5, 46.5, -3], 'CIN@WAS': [6, 54, 6.5],
};
const NEUTRAL = new Set(['MIN@SF']); const HFA = 1.5; const REG = 0.5; const SHRINK = 0.5, BLEND = 0.5; // REG: regress 9-game EPA halfway to league mean
const RECS = [['NYJ@LAC', 'pick', 'away', -3, -103], ['JAX@NYG', 'lean', 'away', 5.5, -108], ['PIT@PHI', 'lean', 'away', 4, -102],
  ['CIN@WAS', 'lean', 'away', 6, -113], ['MIN@SF', 'lean', 'under', 46.5, -107], ['NO@CHI', 'lean', 'under', 48, -106]];
const SC = [['TB@DET', 'away', 'TB +7'], ['TEN@DAL', 'away', 'TEN +8'], ['NYJ@LAC', 'away', 'NYJ +3.5'], ['MIN@SF', 'home', 'SF -3'],
  ['MIA@BUF', 'away', 'MIA +16.5'], ['BAL@CAR', 'home', 'CAR -2.5 (alt)'], ['LV@DEN', 'home', 'DEN -10 (alt)']];
const imp = p => p < 0 ? -p / (-p + 100) : 100 / (p + 100);
const be = imp;

// ---- Bookmaker prices (both sides) from the 5:43 pm capture ----
const sched = J('public/schedule.json'); const games = (sched.games || sched).filter(g => +g.week === 11);
const NAME = {}; for (const g of games) { NAME[g.visitorName] = g.visitor; NAME[g.homeName] = g.home; }
const AL = { WSH: 'WAS' }; const ab = t => AL[t] || t;
const bkr = J('data/generated/props/bookmaker-live-2026-11-21-week11.json');
const PX = {}; // PX[gid] = { spread: {TEAM: [line, price]}, total: {Over: [line, price], Under: [...]} }
for (const r of bkr.rows.filter(r => r.market === 'game_lines')) {
  const [aw, hm] = r.event.split(' @ '); const gid = `${ab(NAME[aw])}@${ab(NAME[hm])}`;
  const s = String(r.selection).replace('½', '.5');
  let m = s.match(/^(Over|Under)\s+(\d+(?:\.\d+)?)\s*([+-]\d{3,4})$/);
  PX[gid] ??= { spread: {}, total: {} };
  if (m) { PX[gid].total[m[1]] = [+m[2], +m[3]]; continue; }
  m = s.match(/^(.*?)\s+([+-]\d+(?:\.\d+)?|PK)\s*([+-]\d{3,4})$/);
  if (m && NAME[m[1]]) PX[gid].spread[ab(NAME[m[1]])] = [m[2] === 'PK' ? 0 : +m[2], +m[3]];
}
const novig = (a, b) => imp(a) / (imp(a) + imp(b));

// ---- FTN team tables (team dossiers; FTN through Week 9) ----
const num = v => v == null || v === '' ? null : +String(v).replace(/[%,]/g, '');
const TEAMS = [...new Set(games.flatMap(g => [ab(g.visitor), ab(g.home)]))];
const allDos = fs.readdirSync('data/generated/team-dossiers/2026-w11').filter(f => /^[A-Z]{2,3}\.json$/.test(f));
const A = {};
for (const f of allDos) {
  const d = J('data/generated/team-dossiers/2026-w11/' + f); const t = ab(d.team); const T = d.ftn?.team_tables || {}; const m = k => T[k]?.metrics || {};
  A[t] = {
    off_epa: num(m('team-offense/efficiency')['EPA/PLY']), off_succ: num(m('team-offense/efficiency')['SUCC%']), off_exp: num(m('team-offense/efficiency')['EXP%']),
    off_conv: num(m('team-offense/efficiency')['CONV%']), off_to: num(m('team-offense/efficiency')['TO%']),
    off_pass: num(m('team-offense/passing-analytics')['EPA/DB']), off_rush: num(m('team-offense/rushing-analytics')['EPA/ATT']),
    off_press: num(m('team-offense/pass-protection')['PRESS%']), off_sack: num(m('team-offense/pass-protection')['SK%']),
    plays: num(m('team-offense/tempo')['PLY/GM']),
    def_epa: num(m('team-defense/efficiency')['EPA/PLY']), def_succ: num(m('team-defense/efficiency')['SUCC%']), def_exp: num(m('team-defense/efficiency')['EXP%']),
    def_conv: num(m('team-defense/efficiency')['CONV%']), def_to: num(m('team-defense/efficiency')['TO%']),
    def_pass: num(m('team-defense/passing-analytics')['EPA/DB']), def_rush: num(m('team-defense/rush-analytics')['EPA/ATT']),
    def_press: num(m('team-defense/pass-rush')['PRESS%']), def_sack: num(m('team-defense/pass-rush')['SK%']),
    gp: num(m('team-offense/efficiency').GP), ppg: d.season_profile_espn?.ppg ?? null, through: d.ftn?.through_week,
  };
}
// higher-is-better per metric (for ranks: rank 1 = best for that unit)
const HIB = { off_epa: 1, off_succ: 1, off_exp: 1, off_conv: 1, off_to: 0, off_pass: 1, off_rush: 1, off_press: 0, off_sack: 0, plays: 1,
  def_epa: 0, def_succ: 0, def_exp: 0, def_conv: 0, def_to: 1, def_pass: 0, def_rush: 0, def_press: 1, def_sack: 1 };
const RANK = {}; const MEAN = {};
for (const k of Object.keys(HIB)) {
  const vals = Object.entries(A).filter(([, v]) => v[k] != null);
  MEAN[k] = vals.reduce((s, [, v]) => s + v[k], 0) / vals.length;
  vals.sort((x, y) => HIB[k] ? y[1][k] - x[1][k] : x[1][k] - y[1][k]);
  vals.forEach(([t], i) => { (RANK[t] ??= {})[k] = i + 1; });
}
const PPG = Object.values(A).filter(v => v.ppg != null).reduce((s, v, _, a) => s + v.ppg / a.length, 0);
function analyticsProj(gid) {
  const [aw, hm] = gid.split('@'); const a = A[aw], h = A[hm];
  if (!a || !h || [a.off_epa, a.def_epa, h.off_epa, h.def_epa, a.plays, h.plays].some(v => v == null)) return null;
  const hExp = REG * ((h.off_epa - MEAN.off_epa) + (a.def_epa - MEAN.def_epa)), aExp = REG * ((a.off_epa - MEAN.off_epa) + (h.def_epa - MEAN.def_epa));
  const hPts = PPG + hExp * h.plays + (NEUTRAL.has(gid) ? 0 : HFA / 2), aPts = PPG + aExp * a.plays - (NEUTRAL.has(gid) ? 0 : HFA / 2);
  return { home_pts: hPts, away_pts: aPts, home_line: -(hPts - aPts), total: hPts + aPts, home_epa_exp: hExp, away_epa_exp: aExp };
}

// ---- simulation helpers ----
function center(gid, projLine, projTot) {
  const [mkt, tot] = NOW[gid];
  return { line: mkt + SHRINK * (projLine - mkt), total: tot + SHRINK * (projTot - tot) };
}
const sim = (line, total, c) => analyzeGame({ homeLine: line, total, marginAdj: line - c.line, totalAdj: c.total - total }, cal, model);
const mktSim = (gid, line, total) => { const [mkt, tot] = NOW[gid]; return sim(line, total, { line: mkt, total: tot }); };
function views(gid) {
  const f = F[gid]; const ap = analyticsProj(gid);
  const modelTot = 2 * f.fair_total - f.market_total;
  return { model: center(gid, f.model_home_line, modelTot), analytics: ap ? center(gid, ap.home_line, ap.total) : null, ap, modelLine: f.model_home_line, modelTot };
}
function bookProb(gid, side, line, price, c) {
  // single-shrink sim prob (excl. push) and market no-vig prob for the same bet; final = 50/50 blend
  const [mkt, tot] = NOW[gid]; const [aw, hm] = gid.split('@');
  const r = side === 'over' || side === 'under' ? sim(mkt, line, c) : sim(line, tot, c);
  const p1 = { away: r.away_cover_excl_push, home: r.home_cover_excl_push, over: r.over_excl_push, under: r.under_excl_push }[side];
  let pm = null; const px = PX[gid] || { spread: {}, total: {} };
  if (side === 'over' || side === 'under') {
    const o = px.total.Over, u = px.total.Under;
    if (o && u && o[0] === line && u[0] === line) pm = side === 'over' ? novig(o[1], u[1]) : novig(u[1], o[1]);
  } else {
    const me = side === 'away' ? aw : hm, them = side === 'away' ? hm : aw; const a = px.spread[me], b = px.spread[them];
    if (a && b) pm = novig(a[1], b[1]);
  }
  if (pm == null) { const m = side === 'over' || side === 'under' ? mktSim(gid, mkt, line) : mktSim(gid, line, tot); pm = { away: m.away_cover_excl_push, home: m.home_cover_excl_push, over: m.over_excl_push, under: m.under_excl_push }[side]; }
  return { single: p1, market: pm, final: BLEND * p1 + (1 - BLEND) * pm };
}
function contest(gid, side, c) {
  const [, tot, cl] = NOW[gid]; const r = sim(cl, tot, c), m = mktSim(gid, cl, tot);
  const W = x => side === 'home' ? x.home_cover : x.away_cover, L = x => side === 'home' ? x.away_cover : x.home_cover;
  const win = BLEND * W(r) + (1 - BLEND) * W(m), push = BLEND * r.side_push + (1 - BLEND) * m.side_push, loss = BLEND * L(r) + (1 - BLEND) * L(m);
  return { p_win: win, p_push: push, p_loss: loss, p_win_xp: win / (win + loss), exp_points: win + 0.5 * push, single_exp_points: W(r) + 0.5 * r.side_push };
}

const out = { generated_at: new Date().toISOString(), version: 2,
  method: `analyzeGame (scripts/intel/margin-simulator.mjs, calibration ${cal.path}). Main view = Bookmaker 5:43 pm PT line moved ${SHRINK * 100}% toward the team-strength model (SRS/DVOA/net YPP), then each probability blended ${BLEND * 100}/${100 - BLEND * 100} with the market probability (no-vig from both Bookmaker prices; contest lines use the market-only sim). Analytics sensitivity = the same pipeline with an FTN EPA matchup projection (offense EPA/play + opponent defense EPA/play allowed, each vs league mean and regressed ${REG * 100}% toward it, times the offense's plays/game, plus ${HFA} home edge; neutral site 0). FTN team tables through Week ${Object.values(A)[0]?.through ?? '?'}. No QB, injury or weather adjustments in either view.`,
  league: { ppg: PPG, mean: MEAN }, games: {}, recs: [], supercontest: [] };
const pct = x => (100 * x).toFixed(1) + '%';
for (const gid of Object.keys(NOW)) {
  const [mkt, tot] = NOW[gid]; const [aw, hm] = gid.split('@'); const v = views(gid); const px = PX[gid] || { spread: {}, total: {} };
  const gv = (c) => {
    const r = sim(mkt, tot, c);
    const hs = px.spread[hm], as = px.spread[aw], o = px.total.Over, u = px.total.Under;
    const mh = hs && as ? novig(hs[1], as[1]) : 0.5, mo = o && u && o[0] === tot ? novig(o[1], u[1]) : 0.5;
    return { home_cover_xp: BLEND * r.home_cover_excl_push + (1 - BLEND) * mh, over_xp: BLEND * r.over_excl_push + (1 - BLEND) * mo,
      home_cover_xp_single: r.home_cover_excl_push, over_xp_single: r.over_excl_push, home_win: r.home_win_excl_tie };
  };
  const main = gv(v.model), an = v.analytics ? gv(v.analytics) : null;
  out.games[gid] = { market_line: mkt, market_total: tot, model_line: +v.modelLine.toFixed(2), model_total: +v.modelTot.toFixed(2),
    center_line: +v.model.line.toFixed(2), center_total: +v.model.total.toFixed(2), ...main,
    away_cover_xp: 1 - main.home_cover_xp, under_xp: 1 - main.over_xp,
    analytics: v.ap ? { proj_home_line: +v.ap.home_line.toFixed(2), proj_total: +v.ap.total.toFixed(2), home_pts: +v.ap.home_pts.toFixed(1), away_pts: +v.ap.away_pts.toFixed(1),
      center_line: +v.analytics.line.toFixed(2), center_total: +v.analytics.total.toFixed(2), home_cover_xp: an.home_cover_xp, over_xp: an.over_xp } : null,
    prices: px,
    matchup: { away: aw, home: hm, teams: { [aw]: A[aw], [hm]: A[hm] }, ranks: { [aw]: RANK[aw], [hm]: RANK[hm] } } };
}
console.log('RECOMMENDATIONS  main (single-shrink) | analytics view | break-even');
for (const [g, kind, side, ln, price] of RECS) {
  const v = views(g); const m = bookProb(g, side, ln, price, v.model); const a = v.analytics ? bookProb(g, side, ln, price, v.analytics) : null;
  const b = be(price);
  out.recs.push({ game: g, kind, side, line: ln, price, p_cover_xp: m.final, p_cover_xp_single: m.single, p_market: m.market, break_even: b, edge_pct: m.final - b,
    analytics_p_cover_xp: a?.final ?? null, analytics_edge_pct: a ? a.final - b : null });
  console.log(`${kind.padEnd(4)} ${g.padEnd(8)} ${side.padEnd(5)} ${String(ln).padStart(5)} ${price} | ${pct(m.final)} (${pct(m.single)}; mkt ${pct(m.market)}) | analytics ${a ? pct(a.final) : 'n/a'} | BE ${pct(b)}`);
}
console.log('\nSUPERCONTEST  exp pts main (single) | analytics');
for (const [g, side, label] of SC) {
  const v = views(g); const m = contest(g, side, v.model); const a = v.analytics ? contest(g, side, v.analytics) : null;
  out.supercontest.push({ game: g, pick: label, ...m, analytics_exp_points: a?.exp_points ?? null, analytics_p_win_xp: a?.p_win_xp ?? null });
  console.log(`${label.padEnd(15)} ${g.padEnd(8)} ${m.exp_points.toFixed(3)} (${m.single_exp_points.toFixed(3)}) win ${pct(m.p_win)} push ${pct(m.p_push)} | analytics ${a ? a.exp_points.toFixed(3) : 'n/a'}`);
}
const rank = []; for (const g of Object.keys(NOW)) { const v = views(g); const [aw, hm] = g.split('@'); const c = NOW[g][2];
  for (const [side, t, ln] of [['home', hm, c], ['away', aw, -c]]) { const m = contest(g, side, v.model); const a = v.analytics ? contest(g, side, v.analytics) : null;
    rank.push({ side: `${t} ${ln > 0 ? '+' : ''}${ln}`, exp_points: m.exp_points, analytics_exp_points: a?.exp_points ?? null }); } }
rank.sort((x, y) => y.exp_points - x.exp_points); out.contest_rank = rank;
console.log('\nCONTEST RANK main:', rank.slice(0, 10).map(r => `${r.side} ${r.exp_points.toFixed(3)}/${r.analytics_exp_points?.toFixed(3)}`).join(' | '));
console.log('\nANALYTICS PROJECTIONS'); for (const [g, x] of Object.entries(out.games)) if (x.analytics) console.log(`${g.padEnd(8)} mkt ${String(x.market_line).padStart(6)} model ${String(x.model_line).padStart(6)} analytics ${String(x.analytics.proj_home_line).padStart(6)} | tot mkt ${x.market_total} model ${x.model_total} analytics ${x.analytics.proj_total}`);
console.log('prices parsed for', Object.keys(PX).length, 'games; FTN teams', Object.keys(A).length);
fs.writeFileSync('reports/intel/w11-model/sim-w11-sat.json', JSON.stringify(out, null, 1));
console.log('wrote reports/intel/w11-model/sim-w11-sat.json');
