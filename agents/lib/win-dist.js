const SQRT2 = Math.SQRT2;
const SIGMA_PRIOR = 2.7;

export function americanToProb(a) {
  if (a == null || Number.isNaN(Number(a))) return null;
  const x = Number(a);
  return x > 0 ? 100 / (x + 100) : -x / (-x + 100);
}

export function devigPair(overAm, underAm) {
  const pOverRaw = americanToProb(overAm);
  const pUnderRaw = americanToProb(underAm);
  if (pOverRaw == null || pUnderRaw == null || pOverRaw <= 0 || pUnderRaw <= 0) {
    return { pOver: null, pUnder: null, k: null, method: 'invalid' };
  }
  let lo = 0.01, hi = 10, mid = 1;
  for (let i = 0; i < 60; i++) {
    mid = (lo + hi) / 2;
    const sum = pOverRaw ** mid + pUnderRaw ** mid;
    if (sum > 1) lo = mid;
    else hi = mid;
  }
  const pOver = pOverRaw ** mid;
  const pUnder = pUnderRaw ** mid;
  if (Number.isFinite(pOver) && Number.isFinite(pUnder) && Math.abs(pOver + pUnder - 1) < 0.002) {
    return { pOver, pUnder, k: mid, method: 'power' };
  }
  const total = pOverRaw + pUnderRaw;
  return { pOver: pOverRaw / total, pUnder: pUnderRaw / total, k: 1, method: 'proportional' };
}

export function normalCdf(x) {
  return 0.5 * (1 + erf(x / SQRT2));
}

export function invNormalCdf(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  const x = Math.min(Math.max(p, 1e-6), 1 - 1e-6);
  if (x < plow) {
    const q = Math.sqrt(-2 * Math.log(x));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (x > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - x));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = x - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function fitWinDist(points, opts = {}) {
  const sigmaPrior = opts.sigmaPrior || SIGMA_PRIOR;
  const clean = (points || [])
    .filter((p) => p?.line != null && p?.q > 0 && p?.q < 1)
    .map((p) => ({ line: Number(p.line), z: invNormalCdf(Number(p.q)), q: Number(p.q), w: Number(p.w ?? 1) || 1 }));
  if (!clean.length) return { mu: null, sigma: null, sigma_source: 'none', rmse: null, fit_quality: 'no_points', n_points: 0 };
  const distinctLines = new Set(clean.map((p) => p.line)).size;
  let mu, sigma, sigmaSource;
  if (distinctLines >= 2) {
    const sw = clean.reduce((s, p) => s + p.w, 0);
    const mz = clean.reduce((s, p) => s + p.w * p.z, 0) / sw;
    const ml = clean.reduce((s, p) => s + p.w * p.line, 0) / sw;
    const cov = clean.reduce((s, p) => s + p.w * (p.z - mz) * (p.line - ml), 0);
    const varz = clean.reduce((s, p) => s + p.w * (p.z - mz) ** 2, 0);
    sigma = varz > 1e-9 ? -cov / varz : sigmaPrior;
    mu = ml + sigma * mz;
    sigmaSource = varz > 1e-9 ? 'fit' : 'prior';
  } else {
    sigma = sigmaPrior;
    const sw = clean.reduce((s, p) => s + p.w, 0);
    mu = clean.reduce((s, p) => s + p.w * (p.line + sigma * p.z), 0) / sw;
    sigmaSource = 'prior';
  }
  let fitQuality = 'ok';
  if (!Number.isFinite(mu) || !Number.isFinite(sigma) || sigma < 1.8 || sigma > 3.6 || mu < 2 || mu > 14) {
    sigma = sigmaPrior;
    const sw = clean.reduce((s, p) => s + p.w, 0);
    mu = clean.reduce((s, p) => s + p.w * (p.line + sigma * p.z), 0) / sw;
    fitQuality = 'degenerate';
    sigmaSource = 'prior';
  }
  sigma = Math.min(3.6, Math.max(1.8, sigma));
  mu = Math.min(14, Math.max(2, mu));
  const rmse = Math.sqrt(clean.reduce((s, p) => {
    const pred = normalCdf((mu - p.line) / sigma);
    return s + p.w * (pred - p.q) ** 2;
  }, 0) / clean.reduce((s, p) => s + p.w, 0));
  return { mu: round(mu, 4), sigma: round(sigma, 4), sigma_source: sigmaSource, rmse: round(rmse, 4), fit_quality: fitQuality, n_points: clean.length };
}

export function probAtLeast(dist, k) {
  if (!dist?.mu || !dist?.sigma) return null;
  return normalCdf((dist.mu - (Number(k) - 0.5)) / dist.sigma);
}

export function probOverLine(dist, line) {
  if (!dist?.mu || !dist?.sigma || line == null) return null;
  return normalCdf((dist.mu - Number(line)) / dist.sigma);
}

export function tailTable(dist, opts = {}) {
  const min = opts.min ?? 1;
  const max = opts.max ?? 17;
  const out = {};
  for (let k = min; k <= max; k++) out[String(k)] = round(probAtLeast(dist, k), 4);
  return out;
}

export function classifyMove(bookSeries, consensusSeries) {
  const b = Number(bookSeries?.last_q) - Number(bookSeries?.first_q);
  const c = Number(consensusSeries?.last_q) - Number(consensusSeries?.first_q);
  if (!Number.isFinite(b) || !Number.isFinite(c) || Math.abs(c) < 0.005) return 'noise';
  if (Math.sign(b) === Math.sign(c) && Math.abs(b) >= Math.abs(c) * 0.8) return 'steam';
  if (Math.abs(b) < Math.abs(c) * 0.25) return 'stale';
  return 'noise';
}

function erf(x) {
  const sign = Math.sign(x) || 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function round(x, n = 4) {
  return x == null ? null : Math.round(x * 10 ** n) / 10 ** n;
}
