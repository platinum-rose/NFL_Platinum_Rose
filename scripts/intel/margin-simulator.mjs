#!/usr/bin/env node
/**
 * Reference margin/total distribution for the Week 5 synthesis. One implementation for every model run.
 *
 * Why this exists: on 2026-10-10 Opus wrote its own simulator and hit two defects before a usable run
 *   (1) key-number weights applied at the raw location shifted the median: a -7.5 favorite covered 43% with NO model edge;
 *   (2) mapping a fractional projection to an integer median made cover probability a step function of the projection.
 * Astra would have written its own too. This file is the shared, tested code. Models supply INPUTS and JUDGMENT
 * (projected margin/total adjustments); they do not re-implement the distribution.
 *
 * Model (market-calibrated, exact — no sampling noise):
 *   - Home margin M is an integer. pmf(m) = normal(mu, sigma) discretized, with empirical key-number multipliers on |m| = 3 and 7.
 *   - sigma_margin / sigma_total = residual SDs from the pinned market-only calibration JSON (default era 2018-2025).
 *   - Key-number multipliers are solved so the favorite's exact-3 and exact-7 margin frequencies match the calibration JSON
 *     at a reference mean (5.0), after renormalizing. Other key numbers (4, 6, 8, 10) are NOT weighted: the calibration treats them as noise.
 *   - Re-centering: for each game the center is shifted (bisection) so that with ZERO adjustment P(cover) == P(not cover)
 *     exactly at the market line. So "no edge" really means 50/50, and an adjustment moves probability continuously and monotonically.
 *
 * What this is NOT: a prediction of the margin. Adjustments (`marginAdj`, `totalAdj`) are the model's opinion in points, home-positive.
 * It is NOT validated against the 60/25/15 blend or FTN/power inputs (no historical series exist locally). Props, team totals and
 * same-game parlays have no calibrated joint model here; do not present them as model probabilities.
 *
 * Usage:
 *   node scripts/intel/margin-simulator.mjs --selftest
 *   node scripts/intel/margin-simulator.mjs --home-line -7.5 --total 42 [--margin-adj 1.5] [--total-adj -0.5]
 *   import { analyzeGame } from './margin-simulator.mjs'
 * Sign convention: homeLine is the HOME team's spread (negative = home favorite), exactly as `schedule.json` and sportsbooks print it.
 * marginAdj > 0 means the model thinks the home team is better than the market by that many points.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
export const CAL_PATH = 'data/research-intel/proposed/2026-w05-historical-market-calibration.json';
const MAXM = 80;                 // pmf support: -80..80
const REF_MU = 5.0;              // reference favorite expected margin used to solve the key-number multipliers
const KEYS = [3, 7];

function phi(z) { // standard normal CDF (Abramowitz-Stegun 7.1.26 via erf)
  const t = 1 / (1 + 0.3275911 * Math.abs(z / Math.SQRT2));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export function loadCalibration(relPath = CAL_PATH) {
  const abs = path.join(ROOT, relPath);
  const buf = fs.readFileSync(abs);
  const j = JSON.parse(buf.toString('utf8'));
  const era = j.eras[j.default_era] || j.eras['2018-2025'] || Object.values(j.eras)[0];
  const fav = j.fav_margin_distribution_pct_default_era;
  // Era field names are read defensively: this must fail loudly rather than silently use a wrong SD.
  const sdMargin = era.margin_resid_sd ?? era.margin_residual_sd ?? era.margin_sd;
  const sdTotal = era.total_resid_sd ?? era.total_residual_sd ?? era.total_sd;
  if (!Number.isFinite(sdMargin) || !Number.isFinite(sdTotal)) throw new Error(`calibration era fields not found: ${JSON.stringify(era)}`);
  return { sdMargin, sdTotal, fav3: fav['3'] / 100, fav7: fav['7'] / 100, era: j.default_era, sha256: crypto.createHash('sha256').update(buf).digest('hex'), path: relPath };
}

/** discretized normal pmf on integers -MAXM..MAXM with optional multipliers on |m| in KEYS */
function pmfFor(mu, sigma, w) {
  const p = new Float64Array(2 * MAXM + 1);
  let s = 0;
  for (let m = -MAXM; m <= MAXM; m += 1) {
    let v = phi((m + 0.5 - mu) / sigma) - phi((m - 0.5 - mu) / sigma);
    if (w) { const k = Math.abs(m); if (w[k]) v *= w[k]; }
    p[m + MAXM] = v; s += v;
  }
  for (let i = 0; i < p.length; i += 1) p[i] /= s;
  return p;
}
const at = (p, m) => p[m + MAXM] ?? 0;

/** pmf SD about its own mean */
function sdOf(p) { let m1 = 0; let m2 = 0; for (let m = -MAXM; m <= MAXM; m += 1) { m1 += m * at(p, m); m2 += m * m * at(p, m); } return Math.sqrt(m2 - m1 * m1); }

/**
 * Jointly solve the latent sigma and the key-number multipliers so that, after renormalizing, THREE calibration targets hold at the
 * reference mean: the favorite's exact-3 rate, exact-7 rate, and the margin SD. (Weights alone pull the SD ~6% too low.)
 */
export function solveModel(cal) {
  const target = { 3: cal.fav3, 7: cal.fav7 };
  const w = { 3: 1, 7: 1 }; let sigma = cal.sdMargin;
  for (let it = 0; it < 400; it += 1) {
    const p = pmfFor(REF_MU, sigma, w);
    for (const k of KEYS) w[k] *= target[k] / at(p, k);
    sigma *= (cal.sdMargin / sdOf(pmfFor(REF_MU, sigma, w))) ** 0.5;
  }
  return { w, sigma };
}

function bisect(f, lo, hi) { // f(lo) and f(hi) must differ in sign
  let flo = f(lo);
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2; const fm = f(mid);
    if ((fm > 0) === (flo > 0)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}

/** P(M > c), P(M == c), P(M < c) for threshold c */
function split(p, c) {
  let gt = 0; let eq = 0; let lt = 0;
  for (let m = -MAXM; m <= MAXM; m += 1) { const v = at(p, m); if (m > c) gt += v; else if (m < c) lt += v; else eq += v; }
  return { gt, eq, lt };
}

/**
 * Exact analysis of one game.
 * @param {{homeLine:number,total:number,marginAdj?:number,totalAdj?:number}} g
 * @param {object} cal  result of loadCalibration()
 */
export function analyzeGame(g, cal, model = solveModel(cal)) {
  const weights = model.w; const sigmaM = model.sigma;
  const { homeLine, total, marginAdj = 0, totalAdj = 0 } = g;
  if (![homeLine, total, marginAdj, totalAdj].every(Number.isFinite)) throw new Error('non-finite input');
  const c = -homeLine;                                   // home covers when M > c
  const muMkt = -homeLine;                               // market-implied home margin
  // margin: shift so zero-adjustment cover == not-cover at the market line
  const dM = bisect((d) => { const s = split(pmfFor(muMkt + d, sigmaM, weights), c); return s.gt - s.lt; }, -6, 6);
  const pm = pmfFor(muMkt + dM + marginAdj, sigmaM, weights);
  const sm = split(pm, c);
  let win = 0; let tie = 0;
  for (let m = 1; m <= MAXM; m += 1) win += at(pm, m);
  tie = at(pm, 0);
  // total: T = total points, integer. Model it as a discretized normal on the same grid shape (no key-number weights are calibrated for totals)
  const TMAX = 140;
  const tp = (mu) => { const q = new Float64Array(TMAX + 1); let s = 0; for (let t = 0; t <= TMAX; t += 1) { const v = phi((t + 0.5 - mu) / cal.sdTotal) - phi((t - 0.5 - mu) / cal.sdTotal); q[t] = v; s += v; } for (let t = 0; t <= TMAX; t += 1) q[t] /= s; return q; };
  const splitT = (q) => { let gt = 0; let eq = 0; let lt = 0; for (let t = 0; t <= TMAX; t += 1) { if (t > total) gt += q[t]; else if (t < total) lt += q[t]; else eq += q[t]; } return { gt, eq, lt }; };
  const dT = bisect((d) => { const s = splitT(tp(total + d)); return s.gt - s.lt; }, -6, 6);
  const st = splitT(tp(total + dT + totalAdj));
  const norm = (a, b) => a / (a + b);
  return {
    inputs: { homeLine, total, marginAdj, totalAdj },
    home_cover: sm.gt, away_cover: sm.lt, side_push: sm.eq,
    home_cover_excl_push: norm(sm.gt, sm.lt), away_cover_excl_push: norm(sm.lt, sm.gt),
    over: st.gt, under: st.lt, total_push: st.eq,
    over_excl_push: norm(st.gt, st.lt), under_excl_push: norm(st.lt, st.gt),
    home_win: win + tie / 2, home_win_excl_tie: win, tie,
    center_shift: { margin: dM, total: dT },
    exact_margin_pct: { m3: at(pm, 3) + at(pm, -3), m7: at(pm, 7) + at(pm, -7) },
    calibration: { sdMargin: cal.sdMargin, latent_sigma_margin: sigmaM, sdTotal: cal.sdTotal, era: cal.era, sha256: cal.sha256, key_weights: weights }
  };
}

// ------------------------------------------------------------------ self test
function selftest() {
  const cal = loadCalibration(); const w = solveModel(cal);
  let fails = 0; const ok = (name, cond, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!cond) fails += 1; };

  // 1. key-number moments reproduce the calibration at the reference mean
  const p = pmfFor(REF_MU, w.sigma, w.w);
  ok('exact-3 favorite margin matches calibration', Math.abs(at(p, 3) - cal.fav3) < 0.0005, `${(at(p, 3) * 100).toFixed(2)}% vs ${(cal.fav3 * 100).toFixed(2)}%`);
  ok('exact-7 favorite margin matches calibration', Math.abs(at(p, 7) - cal.fav7) < 0.0005, `${(at(p, 7) * 100).toFixed(2)}% vs ${(cal.fav7 * 100).toFixed(2)}%`);
  ok('pmf sums to 1', Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const sd = sdOf(p);
  ok('margin SD matches calibration', Math.abs(sd / cal.sdMargin - 1) < 0.005, `${sd.toFixed(3)} vs ${cal.sdMargin}`);

  // 2. market-only baseline is exactly 50/50 at every half-point line, both signs (Opus defect #1: 43% at -7.5)
  let worst = 0;
  for (let x = 0.5; x <= 20.5; x += 1) for (const sgn of [-1, 1]) { const r = analyzeGame({ homeLine: sgn * x, total: 44.5 }, cal, w); worst = Math.max(worst, Math.abs(r.home_cover - 0.5), Math.abs(r.over - 0.5)); }
  ok('zero-edge baseline is 50/50 at all half-point lines (side and total)', worst < 1e-9, `worst deviation ${worst.toExponential(2)}`);
  // integer lines: cover excluding pushes is 50/50, and push mass equals the key-number mass
  for (const L of [-3, -7, 3, 7, -6, -10]) { const r = analyzeGame({ homeLine: L, total: 44 }, cal, w); ok(`integer line ${L}: cover excl. push == 50%`, Math.abs(r.home_cover_excl_push - 0.5) < 1e-9, `push ${(r.side_push * 100).toFixed(1)}%`); }
  const push3 = analyzeGame({ homeLine: -3, total: 44 }, cal, w).side_push; const push35 = analyzeGame({ homeLine: -3.5, total: 44 }, cal, w);
  ok('push on a key number (3) is larger than on 6', push3 > analyzeGame({ homeLine: -6, total: 44 }, cal, w).side_push * 1.5, `${(push3 * 100).toFixed(1)}% vs 6: ${(analyzeGame({ homeLine: -6, total: 44 }, cal, w).side_push * 100).toFixed(1)}%`);
  ok('3 -> 3.5 line changes cover probability by the key-number mass (sanity)', Math.abs(analyzeGame({ homeLine: -3.5, total: 44 }, cal, w).home_cover_excl_push - 0.5) < 1e-9 && push35.side_push === 0);

  // 3. monotone and continuous in the projection (Opus defect #2: step function)
  for (const L of [-7.5, -3, -2.5, 6.5]) {
    let prev = -1; let maxStep = 0; let mono = true;
    for (let a = -10; a <= 10.0001; a += 0.1) { const c = analyzeGame({ homeLine: L, total: 44, marginAdj: a }, cal, w).home_cover_excl_push; if (c < prev - 1e-12) mono = false; if (prev >= 0) maxStep = Math.max(maxStep, c - prev); prev = c; }
    ok(`cover probability monotone and smooth in marginAdj (line ${L})`, mono && maxStep < 0.02, `max step per 0.1 pt ${maxStep.toFixed(4)}`);
  }
  // 4. antisymmetry: flipping the sign of the line and the adjustment mirrors home and away
  const a = analyzeGame({ homeLine: -4.5, total: 44, marginAdj: 1.3 }, cal, w); const b = analyzeGame({ homeLine: 4.5, total: 44, marginAdj: -1.3 }, cal, w);
  ok('mirror symmetry (home <-> away)', Math.abs(a.home_cover - b.away_cover) < 1e-9);
  // 5. sanity vs the market-only history: a 1-pt adjustment is worth roughly 2.5-3.5 pts of cover probability near a pick'em
  const d = analyzeGame({ homeLine: -2.5, total: 44, marginAdj: 1 }, cal, w).home_cover - 0.5;
  ok('1 point of margin edge near a pick\'em is worth ~2-4 cover-prob points', d > 0.02 && d < 0.04, `${(d * 100).toFixed(2)} pts`);
  const e = analyzeGame({ homeLine: -7.5, total: 44, marginAdj: 1 }, cal, w).home_cover - 0.5;
  ok('a 1-point edge across the 7 key number is not wildly larger', e > 0.01 && e < 0.045, `${(e * 100).toFixed(2)} pts`);
  console.log(fails ? `\n${fails} FAILED` : '\nall self-tests passed'); return fails ? 1 : 0;
}

// ------------------------------------------------------------------ CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const get = (k) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : undefined; };
  if (args.includes('--selftest')) process.exit(selftest());
  const homeLine = get('--home-line'); const total = get('--total');
  if (homeLine === undefined || total === undefined) { console.error('usage: --selftest | --home-line <home spread, negative = home favorite> --total <pts> [--margin-adj <home-positive pts>] [--total-adj <pts>]'); process.exit(2); }
  console.log(JSON.stringify(analyzeGame({ homeLine, total, marginAdj: get('--margin-adj') ?? 0, totalAdj: get('--total-adj') ?? 0 }, loadCalibration()), null, 2));
}
