#!/usr/bin/env node
/**
 * Read-only backtest: does any trailing defensive/pace/pressure feature predict the NFL total residual (actual total - closing total_line)?
 * Purpose: decide whether the quantitative synthesis may dampen (or raise) market totals. Market-only baseline = predict 0 (closing line is unbiased).
 *
 * Data: data/vault-seed/nflverse/games-full-1999-2026.csv (closing totals, scores, roof, wind) joined by game_id to team_stats.csv (2022-2025 team-game box stats).
 * Leakage control: every feature is a trailing mean over the team's previous <=5 games in the SAME season (min 3 prior), so it only uses information
 * available before kickoff. Standardization is global across the sample (does not change significance).
 * Output: stdout + reports/analysis/total-damping-backtest-<date>.md. Writes nothing else.
 *
 *   node scripts/analysis/total-damping-backtest.mjs [--no-write]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DIR = path.join(ROOT, 'data/vault-seed/nflverse');
const SEASONS = [2022, 2023, 2024, 2025]; const WIN = 5; const MINP = 3;

function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i += 1; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const load = (f) => { const rows = parseCSV(fs.readFileSync(path.join(DIR, f), 'utf8')); const h = rows.shift(); const ix = Object.fromEntries(h.map((c, i) => [c, i])); return { rows, ix }; };
const N = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))) || 1; };

// ---- games
const G = load('games-full-1999-2026.csv'); const games = new Map();
for (const r of G.rows) {
  const season = N(r[G.ix.season]); if (!SEASONS.includes(season) || r[G.ix.game_type] !== 'REG') continue;
  const tl = parseFloat(r[G.ix.total_line]); const total = parseFloat(r[G.ix.total]);
  if (!Number.isFinite(tl) || !Number.isFinite(total)) continue;
  games.set(r[G.ix.game_id], { id: r[G.ix.game_id], season, week: N(r[G.ix.week]), y: total - tl, total, tl, roof: r[G.ix.roof], wind: parseFloat(r[G.ix.wind]), home: r[G.ix.home_team], away: r[G.ix.away_team], hs: N(r[G.ix.home_score]), as: N(r[G.ix.away_score]) });
}
// ---- team-game rows
const T = load('team_stats.csv'); const byGame = new Map();
for (const r of T.rows) {
  const season = N(r[T.ix.season]); if (!SEASONS.includes(season) || r[T.ix.season_type] !== 'REG') continue;
  const o = (k) => N(r[T.ix[k]]);
  const rec = { game_id: r[T.ix.game_id], team: r[T.ix.team], week: N(r[T.ix.week]), season, att: o('attempts'), car: o('carries'), sk: o('sacks_suffered'), epa: o('passing_epa') + o('rushing_epa'), ints: o('passing_interceptions'), fl: o('fumbles_lost_total'), dsk: o('def_sacks'), dqh: o('def_qb_hits') };
  rec.plays = rec.att + rec.car + rec.sk; rec.db = rec.att + rec.sk;
  if (!byGame.has(rec.game_id)) byGame.set(rec.game_id, []); byGame.get(rec.game_id).push(rec);
}
const tg = [];
for (const [gid, arr] of byGame) {
  const g = games.get(gid); if (!g || arr.length !== 2) continue;
  for (const [r, o] of [[arr[0], arr[1]], [arr[1], arr[0]]]) {
    const isHome = r.team === g.home || (r.team !== g.away && gid.endsWith(`_${r.team}`));
    tg.push({ gid, season: r.season, week: r.week, team: r.team, isHome,
      off_epa: r.epa / r.plays, def_epa: o.epa / o.plays, pace: r.plays, press: r.dsk / o.db, hits: r.dqh / o.db, tkaw: o.ints + o.fl,
      pf: isHome ? g.hs : g.as, pa: isHome ? g.as : g.hs });
  }
}
const METRICS = ['off_epa', 'def_epa', 'pace', 'press', 'hits', 'tkaw', 'pf', 'pa'];
// ---- trailing means (same season, previous <=WIN games, >=MINP)
const trail = new Map(); const grp = new Map();
for (const x of tg) { const k = `${x.season}|${x.team}`; if (!grp.has(k)) grp.set(k, []); grp.get(k).push(x); }
for (const arr of grp.values()) {
  arr.sort((a, b) => a.week - b.week);
  for (let i = MINP; i < arr.length; i += 1) { const prev = arr.slice(Math.max(0, i - WIN), i); trail.set(`${arr[i].gid}|${arr[i].team}`, Object.fromEntries(METRICS.map((m) => [m, mean(prev.map((p) => p[m]))]))); }
}
const stats = Object.fromEntries(METRICS.map((m) => { const v = [...trail.values()].map((t) => t[m]); return [m, { mu: mean(v), sd: sd(v) }]; }));
const z = (t, m) => (t[m] - stats[m].mu) / stats[m].sd;
// ---- game rows. Orientation: positive feature => expect MORE scoring.
const rows = [];
for (const [gid, arr] of byGame) {
  const g = games.get(gid); if (!g || arr.length !== 2) continue;
  const th = trail.get(`${gid}|${g.home}`) || trail.get(`${gid}|${arr.find((r) => r.team !== g.away)?.team}`); const ta = trail.get(`${gid}|${g.away}`);
  if (!th || !ta) continue;
  const s = (m, sign = 1) => sign * (z(th, m) + z(ta, m));
  rows.push({ season: g.season, y: g.y,
    f: { def_epa_allowed: s('def_epa'), off_epa: s('off_epa'), pace: s('pace'), sack_rate: s('press', -1), qb_hit_rate: s('hits', -1), takeaways: s('tkaw', -1), points_for: s('pf'), points_against: s('pa'),
      dome: /dome|closed/.test(g.roof) ? 1 : 0, wind15: Number.isFinite(g.wind) && g.wind >= 15 && !/dome|closed/.test(g.roof) ? 1 : 0 } });
}
// ---- OLS
function solve(A, b) { const n = b.length; const M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < n; i += 1) { let p = i; for (let r = i + 1; r < n; r += 1) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; for (let r = 0; r < n; r += 1) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c += 1) M[r][c] -= f * M[i][c]; } } return M.map((r, i) => r[n] / r[i]); }
function inv(A) { const n = A.length; return A.map((_, j) => solve(A, A.map((__, i) => (i === j ? 1 : 0)))).map((_, i, cols) => cols.map((c) => c[i])); }
function ols(rs, names) {
  const X = rs.map((r) => [1, ...names.map((k) => r.f[k])]); const y = rs.map((r) => r.y); const p = X[0].length;
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)));
  const Xty = Array.from({ length: p }, (_, i) => X.reduce((s, row, k) => s + row[i] * y[k], 0));
  const beta = solve(XtX, Xty); const resid = X.map((row, k) => y[k] - row.reduce((s, v, i) => s + v * beta[i], 0));
  const s2 = resid.reduce((s, e) => s + e * e, 0) / (rs.length - p); const V = inv(XtX);
  return { beta, se: beta.map((_, i) => Math.sqrt(s2 * V[i][i])), n: rs.length };
}
const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');
const out = []; const P = (s = '') => { out.push(s); console.log(s); };

const ys = rows.map((r) => r.y);
P(`# Total-damping backtest (read-only) — ${new Date().toISOString().slice(0, 10)}`); P();
P(`Sample: ${rows.length} regular-season games, ${SEASONS[0]}-${SEASONS[SEASONS.length - 1]}, with >=${MINP} prior same-season games per team (trailing mean of last <=${WIN}). Target y = actual total - closing total_line.`);
P(`Baseline residual: mean ${fmt(mean(ys))}, SD ${fmt(sd(ys))}; standard error of the mean ${fmt(sd(ys) / Math.sqrt(rows.length))}. Features: sum over both teams of standardized trailing values; positive = more scoring expected. Per +1 SD of the game-level sum the units are points of total.`); P();

const univ = ['def_epa_allowed', 'off_epa', 'pace', 'sack_rate', 'qb_hit_rate', 'takeaways', 'points_for', 'points_against', 'dome', 'wind15'];
P('## Univariate (y ~ 1 + feature)'); P(); P('| Feature | coef (pts/unit) | SE | t | ' + SEASONS.join(' | ') + ' | sign stable? |'); P('|---|---:|---:|---:|' + SEASONS.map(() => '---:|').join('') + '---|');
const bonf = 2.7; const flagged = [];
for (const k of univ) {
  const a = ols(rows, [k]); const t = a.beta[1] / a.se[1];
  const per = SEASONS.map((s) => { const b = ols(rows.filter((r) => r.season === s), [k]); return b.beta[1]; });
  const stable = per.every((c) => Math.sign(c) === Math.sign(a.beta[1]));
  if (Math.abs(t) >= bonf && stable) flagged.push(k);
  P(`| ${k} | ${fmt(a.beta[1], 3)} | ${fmt(a.se[1], 3)} | ${fmt(t)} | ${per.map((c) => fmt(c, 3)).join(' | ')} | ${stable ? 'yes' : 'no'} |`);
}
P(); P(`Bonferroni-style bar for ${univ.length} tests: |t| >= ${bonf} AND same sign in every season. Passing: ${flagged.length ? flagged.join(', ') : 'none'}.`); P();

// leave-one-season-out
const sets = { 'defense (def_epa_allowed + sack_rate + takeaways)': ['def_epa_allowed', 'sack_rate', 'takeaways'], 'defense + pace': ['def_epa_allowed', 'sack_rate', 'takeaways', 'pace'], 'efficiency + pace (def_epa_allowed, off_epa, pace)': ['def_epa_allowed', 'off_epa', 'pace'], 'pace only': ['pace'] };
P('## Leave-one-season-out (train 3 seasons, score the 4th; MSE of the total residual, lower is better)'); P();
P('| Model | MSE market-only (predict 0) | MSE intercept-only | MSE model | vs market-only |'); P('|---|---:|---:|---:|---:|');
for (const [name, ks] of Object.entries(sets)) {
  let sseM = 0; let sseI = 0; let sseF = 0; let n = 0;
  for (const s of SEASONS) {
    const tr = rows.filter((r) => r.season !== s); const te = rows.filter((r) => r.season === s); const a = ols(tr, ks); const mu = mean(tr.map((r) => r.y));
    for (const r of te) { const pred = a.beta[0] + ks.reduce((acc, k, i) => acc + a.beta[i + 1] * r.f[k], 0); sseM += r.y ** 2; sseI += (r.y - mu) ** 2; sseF += (r.y - pred) ** 2; n += 1; }
  }
  P(`| ${name} | ${fmt(sseM / n)} | ${fmt(sseI / n)} | ${fmt(sseF / n)} | ${fmt((sseF / sseM - 1) * 100, 2)}% |`);
}
P();
P('## Reading this'); P();
P('- A feature is only worth adding to the total if it passes the univariate bar AND improves out-of-sample MSE over BOTH the market-only and intercept-only baselines. Anything less is noise at this sample size.');
P('- Features are built from nflverse box-score aggregates (EPA per play, sack rate, takeaways, plays per game). The live model uses FTN metrics for which no history exists here; this test says whether the *kind* of signal is real, not whether the FTN versions are.');
P('- Closing lines already price defense and pace; a null result means the market total is efficient with respect to these features, not that defense is irrelevant.');
if (!process.argv.includes('--no-write')) {
  const f = path.join(ROOT, 'reports/analysis', `total-damping-backtest-${new Date().toISOString().slice(0, 10)}.md`);
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, out.join('\n') + '\n'); console.log(`\nwrote ${path.relative(ROOT, f)}`);
}
