#!/usr/bin/env node
// Team post-mortem builder v1. Deterministic, local files only (reads the built dossiers).
// No network / Supabase / model calls. Nulls are never imputed. Market data (lines, ATS/OU, prices) is excluded.
// No player names: availability / roster gate has not run (use the dossier rule: agents must not name players).
//
//   node scripts/build-team-postmortems.mjs --week=6
// Output: data/generated/team-dossiers/<tag>/postmortem/{<TEAM>.md,<TEAM>.json,league-postmortem.md,league-postmortem.json}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const WEEK = Number(args.week || 6);
const TAG = `2026-w${String(WEEK).padStart(2, '0')}`;
const DIR = path.join(ROOT, 'data/generated/team-dossiers', TAG);
const OUT = path.join(DIR, 'postmortem');
const J = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

const idx = J('index.json');
const teams = idx.teams;
const D = Object.fromEntries(teams.map((t) => [t, J(`${t}.json`)]));
const DONE = idx.completed_weeks;

// ---------- helpers ----------
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[%,]/g, '').trim());
  return Number.isFinite(n) ? n : null;
};
const r = (v, d = 2) => (v === null || v === undefined || !Number.isFinite(v) ? null : Number(v.toFixed(d)));
const fmt = (v, d = 2, suf = '') => (v === null || v === undefined ? 'n/a' : `${Number(v).toFixed(d)}${suf}`);
const sgn = (v, d = 2) => (v === null || v === undefined ? 'n/a' : `${v > 0 ? '+' : ''}${Number(v).toFixed(d)}`);
const mean = (a) => { const x = a.filter((v) => v !== null && Number.isFinite(v)); return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null; };
const ftn = (t, table, key) => num(D[t].ftn?.team_tables?.[table]?.metrics?.[key]);

// metric table: value per team; rank 1 = best
const METRICS = {
  ppg:            { get: (t) => D[t].season_profile_espn?.ppg, hi: true, label: 'Points/game' },
  papg:           { get: (t) => D[t].season_profile_espn?.papg, hi: false, label: 'Points allowed/game' },
  net_ppg:        { get: (t) => D[t].power?.net_points_per_game, hi: true, label: 'Net points/game' },
  ypp_diff:       { get: (t) => { const s = D[t].season_profile_espn; return s ? s.ypp - s.opp_ypp : null; }, hi: true, label: 'YPP differential' },
  to_margin:      { get: (t) => D[t].season_profile_espn?.turnover_margin, hi: true, label: 'Turnover margin' },
  pts_per_drive:  { get: (t) => D[t].season_profile_espn?.pts_per_drive, hi: true, label: 'Points/drive' },
  third_down:     { get: (t) => D[t].season_profile_espn?.third_down_pct, hi: true, label: '3rd-down %' },
  rz_td:          { get: (t) => D[t].season_profile_espn?.red_zone_td_pct, hi: true, label: 'Red-zone TD %' },
  off_epa:        { get: (t) => ftn(t, 'team-offense/efficiency', 'EPA/PLY'), hi: true, label: 'Off EPA/play (FTN)' },
  def_epa:        { get: (t) => ftn(t, 'team-defense/efficiency', 'EPA/PLY'), hi: false, label: 'Def EPA/play allowed (FTN)' },
  off_dvoa:       { get: (t) => ftn(t, 'team-offense/efficiency', 'DVOA'), hi: true, label: 'Off DVOA (FTN)' },
  def_dvoa:       { get: (t) => ftn(t, 'team-defense/efficiency', 'DVOA'), hi: false, label: 'Def DVOA allowed (FTN)' },
  off_succ:       { get: (t) => ftn(t, 'team-offense/efficiency', 'SUCC%'), hi: true, label: 'Off success % (FTN)' },
  def_succ:       { get: (t) => ftn(t, 'team-defense/efficiency', 'SUCC%'), hi: false, label: 'Def success % allowed (FTN)' },
  pass_off_dvoa:  { get: (t) => ftn(t, 'team-offense/passing-analytics', 'DVOA'), hi: true, label: 'Pass offense DVOA' },
  rush_off_dvoa:  { get: (t) => ftn(t, 'team-offense/rushing-analytics', 'DVOA'), hi: true, label: 'Rush offense DVOA' },
  pass_def_dvoa:  { get: (t) => ftn(t, 'team-defense/passing-analytics', 'DVOA'), hi: false, label: 'Pass defense DVOA allowed' },
  rush_def_dvoa:  { get: (t) => ftn(t, 'team-defense/rush-analytics', 'DVOA'), hi: false, label: 'Rush defense DVOA allowed' },
  pressure_allowed: { get: (t) => ftn(t, 'team-offense/pass-protection', 'PRESS%'), hi: false, label: 'Pressure % allowed' },
  pressure_made:  { get: (t) => ftn(t, 'team-defense/pass-rush', 'PRESS%'), hi: true, label: 'Pressure % generated' },
  pythag_delta:   { get: (t) => D[t].efficiency_nflverse?.regression?.pythag_win_delta, hi: true, label: 'Wins vs Pythagorean' },
};
const V = {}; const RK = {}; const LG = {};
for (const [k, m] of Object.entries(METRICS)) {
  V[k] = {}; RK[k] = {};
  for (const t of teams) V[k][t] = (() => { const x = m.get(t); return x === undefined || x === null || !Number.isFinite(Number(x)) ? null : Number(x); })();
  const valid = teams.filter((t) => V[k][t] !== null).sort((a, b) => (m.hi ? V[k][b] - V[k][a] : V[k][a] - V[k][b]));
  valid.forEach((t, i) => {
    // competition ranking for ties
    const first = valid.findIndex((u) => V[k][u] === V[k][t]);
    RK[k][t] = first + 1;
  });
  for (const t of teams) if (!(t in RK[k])) RK[k][t] = null;
  LG[k] = mean(teams.map((t) => V[k][t]));
}
const rk = (k, t) => RK[k][t];
const rkTxt = (k, t) => (RK[k][t] === null ? 'n/a' : `#${RK[k][t]}`);

const played = (t) => D[t].game_log.filter((g) => !g.bye);

// ---------- per-game verdicts ----------
function gameVerdict(g) {
  const yd = g.ypp - g.opp_ypp;
  const res = g.result;
  const tags = [];
  if (res === 'W' && yd <= -0.5) tags.push('won despite losing the yards-per-play battle');
  if (res === 'L' && yd >= 0.5) tags.push('lost despite winning the yards-per-play battle');
  if (res === 'T') tags.push('tied');
  if (Math.abs(g.to_margin) >= 3) tags.push(`turnover margin ${g.to_margin > 0 ? '+' : ''}${g.to_margin}`);
  if (Math.abs(g.margin) >= 17) tags.push(res === 'W' ? 'blowout win' : 'blowout loss');
  if (g.def_td) tags.push(`${g.def_td} defensive/ST TD`);
  if (g.rz_td_pct !== null && g.red_zone && /^(\d+)-(\d+)$/.test(g.red_zone) && Number(g.red_zone.split('-')[1]) >= 3 && g.rz_td_pct <= 0.34) tags.push('red-zone stalls');
  if (g.sacks_taken >= 5) tags.push(`${g.sacks_taken} sacks taken`);
  const aligned = (res === 'W' && yd > 0) || (res === 'L' && yd < 0);
  return { yd: r(yd), aligned, tags };
}

// ---------- trend ----------
function trend(t) {
  const gs = played(t);
  if (gs.length < 4) return null;
  const early = gs.slice(0, gs.length - 2); const late = gs.slice(-2);
  const f = (arr, fn) => mean(arr.map(fn));
  const out = {
    games_early: early.length, games_late: late.length,
    ppg: [r(f(early, (g) => g.pts), 1), r(f(late, (g) => g.pts), 1)],
    papg: [r(f(early, (g) => g.opp_pts), 1), r(f(late, (g) => g.opp_pts), 1)],
    ypp_diff: [r(f(early, (g) => g.ypp - g.opp_ypp)), r(f(late, (g) => g.ypp - g.opp_ypp))],
    pts_per_drive: [r(f(early, (g) => g.pts_per_drive)), r(f(late, (g) => g.pts_per_drive))],
    margin: [r(f(early, (g) => g.margin), 1), r(f(late, (g) => g.margin), 1)],
  };
  const dy = out.ypp_diff[1] - out.ypp_diff[0];
  out.direction = dy >= 1 ? 'improving' : dy <= -1 ? 'declining' : 'flat';
  out.note = 'Two-game window on small samples; descriptive, not predictive.';
  return out;
}

// ---------- flags (explicit thresholds; descriptive) ----------
function flags(t) {
  const d = D[t]; const s = d.season_profile_espn; const out = [];
  const gp = s?.games || 0;
  const pd = d.efficiency_nflverse?.regression?.pythag_win_delta;
  if (pd !== null && pd !== undefined && Math.abs(pd) >= 0.75) out.push({ k: 'pythag', text: `Record is ${pd > 0 ? 'ahead of' : 'behind'} point differential: ${sgn(pd)} wins vs Pythagorean.`, dir: pd > 0 ? 'overperforming_results' : 'underperforming_results' });
  if (s && Math.abs(s.turnover_margin) >= 4) out.push({ k: 'turnovers', text: `Turnover margin ${sgn(s.turnover_margin, 0)} (${s.giveaways} give / ${s.takeaways} take): extreme margins tend to regress.`, dir: s.turnover_margin > 0 ? 'positive_to_luck' : 'negative_to_luck' });
  if (s && s.red_zone_att_pg * gp >= 10) {
    if (s.red_zone_td_pct >= 0.72) out.push({ k: 'rz_off', text: `Red-zone TD rate ${fmt(s.red_zone_td_pct * 100, 0, '%')} is high (league avg ${fmt(LG.rz_td * 100, 0, '%')}).`, dir: 'rz_hot' });
    if (s.red_zone_td_pct <= 0.45) out.push({ k: 'rz_off', text: `Red-zone TD rate ${fmt(s.red_zone_td_pct * 100, 0, '%')} is low (league avg ${fmt(LG.rz_td * 100, 0, '%')}).`, dir: 'rz_cold' });
  }
  // efficiency vs results gap
  const effRank = mean([rk('off_epa', t), rk('def_epa', t)]);
  const netRank = rk('net_ppg', t);
  if (effRank !== null && netRank !== null) {
    const gap = netRank - effRank; // positive: results worse than underlying efficiency
    if (gap >= 10) out.push({ k: 'eff_gap', text: `Results (net pts/g #${netRank}) trail underlying efficiency (avg FTN EPA rank #${r(effRank, 1)}).`, dir: 'results_below_efficiency' });
    if (gap <= -10) out.push({ k: 'eff_gap', text: `Results (net pts/g #${netRank}) outrun underlying efficiency (avg FTN EPA rank #${r(effRank, 1)}).`, dir: 'results_above_efficiency' });
  }
  if (rk('pressure_allowed', t) !== null && rk('pressure_allowed', t) >= 28) out.push({ k: 'prot', text: `Pass protection among the worst: pressure allowed ${fmt(V.pressure_allowed[t], 1, '%')} (#${rk('pressure_allowed', t)}).`, dir: 'pass_pro_weak' });
  if (rk('pressure_made', t) !== null && rk('pressure_made', t) <= 5) out.push({ k: 'rush', text: `Elite pressure generation: ${fmt(V.pressure_made[t], 1, '%')} (#${rk('pressure_made', t)}).`, dir: 'pass_rush_strong' });
  if (rk('pass_def_dvoa', t) !== null && rk('pass_def_dvoa', t) >= 28) out.push({ k: 'pass_def', text: `Pass defense DVOA allowed ${fmt(V.pass_def_dvoa[t], 1, '%')} (#${rk('pass_def_dvoa', t)}).`, dir: 'pass_def_weak' });
  if (rk('rush_def_dvoa', t) !== null && rk('rush_def_dvoa', t) >= 28) out.push({ k: 'rush_def', text: `Run defense DVOA allowed ${fmt(V.rush_def_dvoa[t], 1, '%')} (#${rk('rush_def_dvoa', t)}).`, dir: 'rush_def_weak' });
  if (rk('pass_off_dvoa', t) !== null && rk('pass_off_dvoa', t) <= 4) out.push({ k: 'pass_off', text: `Pass offense DVOA ${fmt(V.pass_off_dvoa[t], 1, '%')} (#${rk('pass_off_dvoa', t)}).`, dir: 'pass_off_strong' });
  if (rk('rush_off_dvoa', t) !== null && rk('rush_off_dvoa', t) <= 4) out.push({ k: 'rush_off', text: `Rush offense DVOA ${fmt(V.rush_off_dvoa[t], 1, '%')} (#${rk('rush_off_dvoa', t)}).`, dir: 'rush_off_strong' });
  const one = d.efficiency_nflverse?.regression?.one_score_record;
  if (one && one.games >= 3 && (one.wins === 0 || one.losses === 0)) out.push({ k: 'one_score', text: `One-score record ${one.wins}-${one.losses}${one.ties ? `-${one.ties}` : ''}: small-sample close-game swing.`, dir: one.wins === 0 ? 'close_game_unlucky' : 'close_game_lucky' });
  return out;
}

// ---------- opponent lens (season metrics only; no market) ----------
function opponentLens(t) {
  const g = D[t].identity.target_week_game;
  if (!g || !g.opponent) return null;
  const o = g.opponent;
  if (!D[o]) return null;
  const row = (label, myK, oppK) => ({ label, team: V[myK][t] === null ? null : r(V[myK][t]), team_rank: rk(myK, t), opp_unit: oppK, opp: V[oppK][o] === null ? null : r(V[oppK][o]), opp_rank: rk(oppK, o) });
  const rows = [
    { matchup: 'team offense EPA/play vs opp defense EPA/play allowed', ...row('', 'off_epa', 'def_epa') },
    { matchup: 'team offense DVOA vs opp defense DVOA allowed', ...row('', 'off_dvoa', 'def_dvoa') },
    { matchup: 'team pass offense DVOA vs opp pass defense DVOA allowed', ...row('', 'pass_off_dvoa', 'pass_def_dvoa') },
    { matchup: 'team rush offense DVOA vs opp run defense DVOA allowed', ...row('', 'rush_off_dvoa', 'rush_def_dvoa') },
    { matchup: 'team pressure allowed vs opp pressure generated', ...row('', 'pressure_allowed', 'pressure_made') },
    { matchup: 'team defense EPA/play allowed vs opp offense EPA/play', ...row('', 'def_epa', 'off_epa') },
  ];
  return { opponent: o, home_away: g.home_away, kickoff_pt: g.kickoff_pt, rows };
}

// ---------- build ----------
fs.mkdirSync(OUT, { recursive: true });

const league = [];
for (const t of teams) {
  const d = D[t]; const s = d.season_profile_espn; const gs = played(t);
  const games = gs.map((g) => ({ week: g.week, opponent: g.opponent, home_away: g.home_away, result: g.result, score: `${g.pts}-${g.opp_pts}`, margin: g.margin, ypp_diff: gameVerdict(g).yd, to_margin: g.to_margin, pts_per_drive: g.pts_per_drive, verdict: gameVerdict(g) }));
  const tr = trend(t); const fl = flags(t); const lens = opponentLens(t);
  const byeWeeks = d.game_log.filter((g) => g.bye).map((g) => g.week);
  const pm = {
    schema: 'team_postmortem_v1', team: t, nickname: d.identity.nickname, season: 2026, target_week: WEEK, completed_weeks: DONE,
    built_from: { dossier: `${TAG}/${t}.json`, dossier_built_at: d.built_at, dossier_git_head: d.git_head },
    market_data_included: false, roster_gate: 'not_run_no_player_names',
    record: d.standing.record, pf: d.standing.pf, pa: d.standing.pa, diff: d.standing.diff, bye_weeks_played: byeWeeks,
    pythag: d.efficiency_nflverse?.regression ? { wins_expected: d.efficiency_nflverse.regression.pythag_wins, delta: d.efficiency_nflverse.regression.pythag_win_delta, rank: d.efficiency_nflverse.regression.pythag_win_delta_rank } : null,
    one_score: d.efficiency_nflverse?.regression?.one_score_record ?? null,
    power: d.power ? { model_rank: d.power.model_rank, srs_rank: d.power.srs_rank, net_ppg_rank: d.power.net_ppg_rank, pythag_rank: d.power.pythag_rank } : null,
    ranks: Object.fromEntries(Object.keys(METRICS).map((k) => [k, { value: V[k][t] === null ? null : r(V[k][t], 3), rank: RK[k][t] }])),
    games, trend: tr, flags: fl, opponent_lens: lens,
    data_quality: { ...Object.fromEntries(Object.entries(d.data_quality).map(([k, v]) => [k, v.status])), null_metrics: d.efficiency_nflverse?.unavailable_in_source?.length ?? null },
  };
  fs.writeFileSync(path.join(OUT, `${t}.json`), JSON.stringify(pm, null, 2));

  // markdown
  const L = [];
  L.push(`# ${t} ${d.identity.nickname} — post-mortem, W1–W${DONE} (for Week ${WEEK} synthesis)`);
  L.push(`Built from dossier ${TAG} (${d.built_at}, git ${d.git_head}). No market data. No player names (roster gate not run). Ranks are 1=best of 32 on that metric.`);
  L.push('');
  L.push(`## Season result`);
  L.push(`${d.standing.record} · PF ${d.standing.pf} PA ${d.standing.pa} (${sgn(d.standing.diff, 0)}) · streak ${d.standing.streak} · net ${sgn(V.net_ppg[t], 1)} pts/g (${rkTxt('net_ppg', t)})${byeWeeks.length ? ` · bye W${byeWeeks.join(',')}` : ''}`);
  if (pm.pythag) L.push(`Pythagorean ${fmt(pm.pythag.wins_expected, 2)} exp wins (delta ${sgn(pm.pythag.delta)}) · one-score ${pm.one_score ? `${pm.one_score.wins}-${pm.one_score.losses}${pm.one_score.ties ? `-${pm.one_score.ties}` : ''}` : 'n/a'} · power model #${pm.power?.model_rank ?? 'n/a'}`);
  L.push('');
  L.push(`## Game by game`);
  L.push('| Wk | Opp | H/A | Res | Score | YPP diff | TO mrg | Pts/drv | Read |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const g of games) {
    const read = g.verdict.tags.length ? g.verdict.tags.join('; ') : g.verdict.aligned ? 'result matched the yards battle' : '—';
    L.push(`| ${g.week} | ${g.opponent} | ${g.home_away === 'home' ? 'H' : 'A'} | ${g.result} | ${g.score} | ${sgn(g.ypp_diff)} | ${sgn(g.to_margin, 0)} | ${fmt(g.pts_per_drive)} | ${read} |`);
  }
  L.push('');
  L.push(`## Underlying profile (season to date)`);
  L.push('| Unit | Value | Rank | Unit | Value | Rank |');
  L.push('|---|---|---|---|---|---|');
  const row2 = (a, b, aPct = false, bPct = false) => {
    const cell = (k, pct) => { const v = V[k][t]; return `${METRICS[k].label} | ${v === null ? 'n/a' : pct ? `${fmt(v, 1)}%` : fmt(v, k === 'to_margin' ? 0 : 2)} | ${rkTxt(k, t)}`; };
    L.push(`| ${cell(a, aPct)} | ${cell(b, bPct)} |`);
  };
  row2('off_epa', 'def_epa'); row2('off_dvoa', 'def_dvoa', true, true); row2('off_succ', 'def_succ', true, true);
  row2('pass_off_dvoa', 'pass_def_dvoa', true, true); row2('rush_off_dvoa', 'rush_def_dvoa', true, true);
  row2('pressure_allowed', 'pressure_made', true, true); row2('ypp_diff', 'to_margin'); row2('pts_per_drive', 'third_down'); row2('rz_td', 'ppg');
  L.push('');
  if (tr) {
    L.push(`## Trend (W1–W${DONE - 2} vs last 2)`);
    L.push(`Direction: **${tr.direction}** · pts/g ${tr.ppg[0]} → ${tr.ppg[1]} · allowed ${tr.papg[0]} → ${tr.papg[1]} · YPP diff ${sgn(tr.ypp_diff[0])} → ${sgn(tr.ypp_diff[1])} · margin ${sgn(tr.margin[0], 1)} → ${sgn(tr.margin[1], 1)} (${tr.note})`);
    L.push('');
  }
  L.push(`## Flags (explicit thresholds, descriptive)`);
  if (fl.length) for (const f of fl) L.push(`- ${f.text}`); else L.push('- none triggered');
  L.push('');
  if (lens) {
    L.push(`## Week ${WEEK} opponent lens: ${d.identity.target_week_game.home_away === 'home' ? 'vs' : '@'} ${lens.opponent} (${lens.kickoff_pt})`);
    L.push('| Matchup | Team | Rank | Opp | Rank |');
    L.push('|---|---|---|---|---|');
    for (const x of lens.rows) L.push(`| ${x.matchup} | ${x.team === null ? 'n/a' : x.team} | ${x.team_rank === null ? 'n/a' : `#${x.team_rank}`} | ${x.opp === null ? 'n/a' : x.opp} | ${x.opp_rank === null ? 'n/a' : `#${x.opp_rank}`} |`);
    L.push('');
  } else L.push(`## Week ${WEEK}: bye week`, '');
  L.push(`## Caveats`);
  L.push(`- ${DONE}-game samples; ranks move fast. nflverse null fields (success/explosive/pressure rates, etc.) are not imputed; FTN is the efficiency source of record.`);
  L.push(`- Coaching context is historical only; availability/priors layers are not built in dossier v1.`);
  fs.writeFileSync(path.join(OUT, `${t}.md`), L.join('\n') + '\n');

  league.push({ team: t, record: d.standing.record, net_ppg: r(V.net_ppg[t], 1), net_rank: rk('net_ppg', t), ypp_diff: r(V.ypp_diff[t]), off_epa_rank: rk('off_epa', t), def_epa_rank: rk('def_epa', t), pythag_delta: r(V.pythag_delta[t]), to_margin: V.to_margin[t], trend: tr?.direction ?? 'n/a', flags: fl.map((f) => f.dir) });
}

// league summary
league.sort((a, b) => (a.net_rank ?? 99) - (b.net_rank ?? 99));
const lj = { schema: 'league_postmortem_v1', target_week: WEEK, completed_weeks: DONE, built_from: `${TAG}/index.json`, market_data_included: false, teams: league };
fs.writeFileSync(path.join(OUT, 'league-postmortem.json'), JSON.stringify(lj, null, 2));
const LM = [];
LM.push(`# League post-mortem, W1–W${DONE} (Week ${WEEK} synthesis input)`);
LM.push(`Built from dossier ${TAG}. No market data, no player names. Sorted by net points/game.`);
LM.push('');
LM.push('| Team | Rec | Net pts/g | YPP diff | Off EPA rk | Def EPA rk | Pythag delta | TO mrg | Trend | Flags |');
LM.push('|---|---|---|---|---|---|---|---|---|---|');
for (const x of league) LM.push(`| ${x.team} | ${x.record} | ${sgn(x.net_ppg, 1)} | ${sgn(x.ypp_diff)} | #${x.off_epa_rank ?? 'n/a'} | #${x.def_epa_rank ?? 'n/a'} | ${sgn(x.pythag_delta)} | ${sgn(x.to_margin, 0)} | ${x.trend} | ${x.flags.join(', ') || '—'} |`);
LM.push('');
const grp = (dir) => league.filter((x) => x.flags.includes(dir)).map((x) => x.team).join(', ') || '—';
LM.push('## Regression watchlists (descriptive)');
LM.push(`- Results ahead of underlying efficiency: ${grp('results_above_efficiency')}`);
LM.push(`- Results behind underlying efficiency: ${grp('results_below_efficiency')}`);
LM.push(`- Wins ahead of point differential: ${grp('overperforming_results')}`);
LM.push(`- Wins behind point differential: ${grp('underperforming_results')}`);
LM.push(`- Positive turnover luck: ${grp('positive_to_luck')} · negative: ${grp('negative_to_luck')}`);
LM.push(`- Weak pass protection: ${grp('pass_pro_weak')} · strong pass rush: ${grp('pass_rush_strong')}`);
LM.push(`- Trending up (last 2 games): ${league.filter((x) => x.trend === 'improving').map((x) => x.team).join(', ') || '—'} · down: ${league.filter((x) => x.trend === 'declining').map((x) => x.team).join(', ') || '—'}`);
fs.writeFileSync(path.join(OUT, 'league-postmortem.md'), LM.join('\n') + '\n');

console.log(`built ${teams.length} team post-mortems + league summary in ${path.relative(ROOT, OUT)}`);
