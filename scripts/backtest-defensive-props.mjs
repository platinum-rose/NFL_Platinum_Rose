#!/usr/bin/env node
// scripts/backtest-defensive-props.mjs
//
// Walk-forward backtest of the defensive props layer, plus season pattern
// studies. Reads data/defensive-props/defensive-game-log-<season>.json
// (built by scripts/build-defensive-props.mjs). Local only: no network,
// no Supabase, no paid calls.
//
// For each week W >= 3: profiles/opponent/crew factors are built from weeks < W
// only, then scored against week W actuals. Also: hit-rate calibration,
// game-script residuals, crew and opponent-factor persistence, vacated-tackle
// boosts, solo-share stability and sack predictability.
//
// Usage: node scripts/backtest-defensive-props.mjs [--season 2026]

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileAtomic } from './lib/atomic-file-write.js';
import { buildProfiles, buildOpponentFactors, buildStatCrewFactors } from './build-defensive-props.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'defensive-props');
const DOCS_DIR = path.join(ROOT, 'docs', 'defensive-props');

const round = (v, d = 2) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
export function pearson(xs, ys) {
  const n = xs.length; if (n < 3) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
const PROP_MIN_AVG = 3; // only defenders who would plausibly have a T+A prop

export function walkForward(rows, { minWeek = 3 } = {}) {
  const weeks = [...new Set(rows.map(r => r.week))].sort((a, b) => a - b).filter(w => w >= minWeek);
  const preds = [];
  for (const W of weeks) {
    const train = rows.filter(r => r.week < W);
    const test = rows.filter(r => r.week === W);
    const { profiles } = buildProfiles(train, { minGames: 2 });
    const pmap = Object.fromEntries(profiles.map(p => [p.athlete_id, p]));
    const opp = buildOpponentFactors(train);
    const crews = buildStatCrewFactors(train);
    for (const r of test) {
      const p = pmap[r.athlete_id];
      if (!p || p.avg_ta < PROP_MIN_AVG) continue;
      const gf = opp.offenses[r.opp]?.group_factors?.[p.group] ?? 1;
      const crew = crews.crews[r.stat_crew_home_team];
      const crewAdj = crew && crew.home_games >= 2 ? 1 + (crew.vs_league - 1) * (p.avg_assists / (p.avg_ta || 1)) : 1;
      preds.push({
        week: W, player: p.player, athlete_id: r.athlete_id, team: r.team, opp: r.opp, group: p.group, prior_games: p.games,
        actual: r.tackles_assists, actual_solo: r.solo, actual_sacks: r.sacks, home: r.home, won: r.final_margin > 0,
        p_avg: p.avg_ta, p_median: p.median_ta, p_last3: p.last3_avg_ta, p_solo: p.avg_solo,
        opp_factor: gf, crew_factor: round(crewAdj, 3),
        p_opp: p.avg_ta * gf, p_full: p.avg_ta * gf * crewAdj, p_crew: p.avg_ta * crewAdj,
        prior_hit: p.hit_rate_ta, prior_solo_hit: p.hit_rate_solo, prior_sack_rate: p.sack_game_rate,
      });
    }
  }
  return preds;
}

function scoreMethods(preds) {
  const methods = { season_avg: 'p_avg', median: 'p_median', last3: 'p_last3', avg_x_opp: 'p_opp', avg_x_crew: 'p_crew', avg_x_opp_x_crew: 'p_full' };
  const out = {};
  for (const [name, key] of Object.entries(methods)) {
    const err = preds.map(p => p[key] - p.actual);
    out[name] = { n: err.length, mae: round(mean(err.map(Math.abs))), bias: round(mean(err)), within_1: round(err.filter(e => Math.abs(e) <= 1).length / err.length), within_2: round(err.filter(e => Math.abs(e) <= 2).length / err.length) };
  }
  return out;
}

function adjustmentDirection(preds, key, label) {
  // Does the adjustment move the result the right way vs. the player's prior average?
  const buckets = [['< 0.90', x => x < 0.9], ['0.90-0.97', x => x >= 0.9 && x < 0.97], ['0.97-1.03', x => x >= 0.97 && x <= 1.03], ['1.03-1.10', x => x > 1.03 && x <= 1.1], ['> 1.10', x => x > 1.1]];
  return { factor: label, rows: buckets.map(([name, f]) => {
    const g = preds.filter(p => f(p[key]));
    return { bucket: name, n: g.length, avg_resid_vs_prior_avg: round(mean(g.map(p => p.actual - p.p_avg))), pct_beat_prior_avg: round(g.filter(p => p.actual > p.p_avg).length / (g.length || 1)) };
  }) };
}

function calibration(preds, lines = [4, 5, 6, 7, 8, 9]) {
  const edges = [0, 0.2, 0.4, 0.6, 0.8, 1.0001];
  const bucketRows = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const hits = [];
    for (const p of preds) for (const L of lines) {
      const pr = p.prior_hit?.[`${L}+`];
      if (pr == null || pr < edges[i] || pr >= edges[i + 1]) continue;
      hits.push({ pr, hit: p.actual >= L ? 1 : 0, games: p.prior_games });
    }
    bucketRows.push({ prior_hit_rate: `${Math.round(edges[i] * 100)}-${Math.min(100, Math.round(edges[i + 1] * 100))}%`, n: hits.length, avg_prior: round(mean(hits.map(h => h.pr))), actual_hit_rate: round(mean(hits.map(h => h.hit))) });
  }
  // Line placed half a tackle under/over the prior median — a proxy for a book line.
  const nearMedian = {};
  for (const off of [-1.5, -0.5, 0.5, 1.5]) {
    const g = preds.map(p => ({ line: p.p_median + off, a: p.actual })).filter(x => x.line > 0);
    nearMedian[`median${off > 0 ? '+' : ''}${off}`] = { n: g.length, over_rate: round(g.filter(x => x.a > x.line).length / g.length) };
  }
  return { buckets: bucketRows, vs_prior_median: nearMedian };
}

function gameScript(rows) {
  // Leave-one-out residual: game T+A minus the player's average in his OTHER games.
  const by = {};
  for (const r of rows) (by[r.athlete_id] ||= []).push(r);
  const res = [];
  for (const games of Object.values(by)) {
    if (games.length < 4) continue;
    const tot = games.reduce((s, g) => s + g.tackles_assists, 0);
    if (tot / games.length < PROP_MIN_AVG) continue;
    for (const g of games) res.push({ ...g, loo: (tot - g.tackles_assists) / (games.length - 1), resid: g.tackles_assists - (tot - g.tackles_assists) / (games.length - 1) });
  }
  const summarize = (label, pred) => { const g = res.filter(pred); return { split: label, n: g.length, avg_resid: round(mean(g.map(x => x.resid))), pct_over_own_avg: round(g.filter(x => x.resid > 0).length / (g.length || 1)) }; };
  const groups = ['LB', 'S', 'CB', 'DL'];
  const splits = [
    summarize('team won', x => x.final_margin > 0), summarize('team lost', x => x.final_margin < 0),
    summarize('won by 14+', x => x.final_margin >= 14), summarize('lost by 14+', x => x.final_margin <= -14),
    summarize('one-score game (|margin| <= 8)', x => Math.abs(x.final_margin) <= 8),
    summarize('opp plays >= 68', x => x.opp_plays >= 68), summarize('opp plays <= 58', x => x.opp_plays && x.opp_plays <= 58),
    summarize('home', x => x.home), summarize('away', x => !x.home),
  ];
  const byGroup = [];
  for (const grp of groups) for (const [lab, f] of [['won', x => x.final_margin > 0], ['lost', x => x.final_margin < 0], ['opp plays >= 68', x => x.opp_plays >= 68], ['opp plays <= 58', x => x.opp_plays && x.opp_plays <= 58], ['opp rush att >= 30', x => x.opp_rush_att >= 30], ['opp pass att >= 38', x => x.opp_pass_att >= 38]]) {
    byGroup.push({ group: grp, ...summarize(lab, x => x.group === grp && f(x)) });
  }
  // Team-level: total defensive T+A vs opponent plays.
  const teamGames = {};
  for (const r of rows) teamGames[`${r.event_id}|${r.team}`] = { tot: r.team_tackles_total, plays: r.opp_plays, rush: r.opp_rush_att, pass: r.opp_pass_att };
  const tg = Object.values(teamGames).filter(t => t.plays);
  return { splits, by_group: byGroup, team_ta_vs_opp_plays_r: round(pearson(tg.map(t => t.plays), tg.map(t => t.tot))), team_ta_vs_opp_rush_r: round(pearson(tg.map(t => t.rush), tg.map(t => t.tot))), team_ta_per_opp_play: round(mean(tg.map(t => t.tot / t.plays))) };
}

function crewPersistence(rows) {
  // Same venue: do the HOME defense and the VISITING defense get credited assists at similar rates?
  const v = {};
  for (const r of rows) {
    const k = r.stat_crew_home_team; const side = r.home ? 'home_def' : 'away_def';
    v[k] ||= { home_def: { a: 0, t: 0 }, away_def: { a: 0, t: 0 }, games: new Set(), byGame: {} };
    v[k][side].a += r.assists; v[k][side].t += r.tackles_assists; v[k].games.add(r.event_id);
    const bg = (v[k].byGame[r.event_id] ||= { a: 0, t: 0, week: r.week }); bg.a += r.assists; bg.t += r.tackles_assists;
  }
  const venues = Object.entries(v).filter(([, x]) => x.games.size >= 3);
  const hr = venues.map(([, x]) => x.home_def.a / x.home_def.t), ar = venues.map(([, x]) => x.away_def.a / x.away_def.t);
  // Split-half: odd vs even home games at each venue.
  const odd = [], even = [];
  for (const [, x] of venues) {
    const gs = Object.values(x.byGame).sort((a, b) => a.week - b.week);
    const o = gs.filter((_, i) => i % 2 === 0), e = gs.filter((_, i) => i % 2 === 1);
    odd.push(o.reduce((s, g) => s + g.a, 0) / o.reduce((s, g) => s + g.t, 0)); even.push(e.reduce((s, g) => s + g.a, 0) / e.reduce((s, g) => s + g.t, 0));
  }
  return { venues: venues.length, home_vs_visiting_defense_assist_rate_r: round(pearson(hr, ar)), split_half_r: round(pearson(odd, even)),
    table: venues.map(([t, x]) => ({ venue: t, games: x.games.size, home_def_assist_rate: round(x.home_def.a / x.home_def.t, 3), visiting_def_assist_rate: round(x.away_def.a / x.away_def.t, 3) })).sort((a, b) => (b.home_def_assist_rate + b.visiting_def_assist_rate) - (a.home_def_assist_rate + a.visiting_def_assist_rate)) };
}

function opponentPersistence(rows) {
  const early = buildOpponentFactors(rows.filter(r => r.week <= 3));
  const late = buildOpponentFactors(rows.filter(r => r.week >= 4));
  const out = {};
  for (const grp of ['LB', 'S', 'CB', 'DL']) {
    const teams = Object.keys(early.offenses).filter(t => late.offenses[t]);
    out[grp] = round(pearson(teams.map(t => early.offenses[t].group_factors[grp] ?? 1), teams.map(t => late.offenses[t].group_factors[grp] ?? 1)));
  }
  const teams = Object.keys(early.offenses).filter(t => late.offenses[t]);
  out.plays = round(pearson(teams.map(t => early.offenses[t].avg_plays), teams.map(t => late.offenses[t].avg_plays)));
  out.rush_share = round(pearson(teams.map(t => early.offenses[t].rush_share), teams.map(t => late.offenses[t].rush_share)));
  return { weeks_1_3_vs_4_7_r: out };
}

function playerStability(rows) {
  const by = {};
  for (const r of rows) (by[r.athlete_id] ||= []).push(r);
  const out = {};
  for (const grp of ['LB', 'S', 'CB', 'DL']) {
    const a = [], b = [], sa = [], sb = [], cvs = [];
    for (const g of Object.values(by)) {
      if (g[0].group !== grp) continue;
      const e = g.filter(x => x.week <= 3), l = g.filter(x => x.week >= 4);
      const all = g.map(x => x.tackles_assists); const m = mean(all);
      if (g.length >= 4 && m >= PROP_MIN_AVG) cvs.push(Math.sqrt(mean(all.map(x => (x - m) ** 2))) / m);
      if (e.length < 2 || l.length < 2 || mean(all) < PROP_MIN_AVG) continue;
      a.push(mean(e.map(x => x.tackles_assists))); b.push(mean(l.map(x => x.tackles_assists)));
      const se = e.reduce((s, x) => s + x.solo, 0) / (e.reduce((s, x) => s + x.tackles_assists, 0) || 1);
      const sl = l.reduce((s, x) => s + x.solo, 0) / (l.reduce((s, x) => s + x.tackles_assists, 0) || 1);
      sa.push(se); sb.push(sl);
    }
    out[grp] = { players: a.length, ta_avg_split_half_r: round(pearson(a, b)), solo_share_split_half_r: round(pearson(sa, sb)), median_game_to_game_cv: round(cvs.sort((x, y) => x - y)[cvs.length >> 1]) };
  }
  return out;
}

function vacatedTackles(rows) {
  // When a teammate in the same group who averages 6+ is absent from the box score, what happens to the others?
  const by = {}; const eventsByTeam = {};
  for (const r of rows) { (by[r.athlete_id] ||= []).push(r); (eventsByTeam[r.team] ||= new Set()).add(r.event_id); }
  const stats = Object.fromEntries(Object.entries(by).map(([id, g]) => [id, { id, team: g[g.length - 1].team, group: g[0].group, player: g[0].player, games: g.length, avg: mean(g.map(x => x.tackles_assists)), events: new Set(g.map(x => x.event_id)), byEvent: Object.fromEntries(g.map(x => [x.event_id, x.tackles_assists])) }]));
  const anchors = Object.values(stats).filter(s => s.games >= 3 && s.avg >= 6);
  const cases = []; const deltasByGroup = {};
  for (const q of anchors) {
    const teamEvents = [...(eventsByTeam[q.team] || [])];
    const absent = teamEvents.filter(e => !q.events.has(e));
    if (!absent.length) continue;
    for (const p of Object.values(stats)) {
      if (p.id === q.id || p.team !== q.team || p.games < 3 || p.avg < PROP_MIN_AVG) continue;
      if (!(p.group === q.group || (['LB', 'S'].includes(p.group) && ['LB', 'S'].includes(q.group)))) continue;
      const without = absent.filter(e => e in p.byEvent).map(e => p.byEvent[e]);
      const withQ = [...q.events].filter(e => e in p.byEvent).map(e => p.byEvent[e]);
      if (!without.length || withQ.length < 2) continue;
      const delta = mean(without) - mean(withQ);
      cases.push({ team: q.team, absent_player: q.player, absent_group: q.group, absent_avg: round(q.avg, 1), beneficiary: p.player, group: p.group, games_without: without.length, avg_without: round(mean(without), 1), avg_with: round(mean(withQ), 1), delta: round(delta, 1) });
      (deltasByGroup[`${q.group}->${p.group}`] ||= []).push(delta);
    }
  }
  cases.sort((a, b) => b.delta - a.delta);
  return { summary: Object.fromEntries(Object.entries(deltasByGroup).map(([k, d]) => [k, { cases: d.length, avg_delta: round(mean(d), 2), pct_positive: round(d.filter(x => x > 0).length / d.length) }])), cases };
}

function sackPredictability(preds) {
  const buckets = [['0%', x => x === 0], ['1-25%', x => x > 0 && x <= 0.25], ['26-50%', x => x > 0.25 && x <= 0.5], ['> 50%', x => x > 0.5]];
  return buckets.map(([lab, f]) => { const g = preds.filter(p => f(p.prior_sack_rate)); return { prior_sack_game_rate: lab, n: g.length, next_week_sack_rate: round(g.filter(p => p.actual_sacks >= 0.5).length / (g.length || 1)) }; });
}

function render(r) {
  const L = []; const pct = v => (v == null ? '' : `${Math.round(v * 100)}%`);
  L.push(`# Defensive props backtest — ${r.season}, Weeks 1–${r.through_week}`);
  L.push('');
  L.push(`Generated ${r.generated_at}. ${r.games} games, ${r.rows} defender-game rows. Walk-forward: each week W ≥ 3 is projected from weeks < W only. Scored players: prior average ≥ ${PROP_MIN_AVG} T+A and 2+ prior games (${r.walk_forward_n} player-weeks). ESPN only lists defenders who recorded a stat, so a 0-tackle game is invisible (slight upward bias).`);
  L.push('');
  L.push('## 1. Which projection works best');
  L.push(''); L.push('| Method | N | MAE | Bias | Within 1 | Within 2 |'); L.push('|---|---|---|---|---|---|');
  for (const [k, v] of Object.entries(r.methods)) L.push(`| ${k} | ${v.n} | ${v.mae} | ${v.bias} | ${pct(v.within_1)} | ${pct(v.within_2)} |`);
  L.push('');
  L.push('## 2. Do the adjustments point the right way?');
  for (const a of r.adjustments) {
    L.push(''); L.push(`**${a.factor}** (residual = actual − prior season average)`); L.push('');
    L.push('| Factor bucket | N | Avg residual | Beat prior avg |'); L.push('|---|---|---|---|');
    for (const x of a.rows) L.push(`| ${x.bucket} | ${x.n} | ${x.avg_resid_vs_prior_avg} | ${pct(x.pct_beat_prior_avg)} |`);
  }
  L.push('');
  L.push('## 3. Are prior hit rates honest? (lines 4+ to 9+)');
  L.push(''); L.push('| Prior hit rate | N | Avg prior | Actual next-week hit rate |'); L.push('|---|---|---|---|');
  for (const b of r.calibration.buckets) L.push(`| ${b.prior_hit_rate} | ${b.n} | ${pct(b.avg_prior)} | ${pct(b.actual_hit_rate)} |`);
  L.push(''); L.push('Over rate against a line set off the player\'s prior median:'); L.push('');
  L.push('| Line | N | Over rate |'); L.push('|---|---|---|');
  for (const [k, v] of Object.entries(r.calibration.vs_prior_median)) L.push(`| ${k} | ${v.n} | ${pct(v.over_rate)} |`);
  L.push('');
  L.push('## 4. Game script (leave-one-out residual vs. the player\'s own average)');
  L.push(''); L.push(`Team defensive T+A vs. opponent plays: r = ${r.game_script.team_ta_vs_opp_plays_r}; vs. opponent rush attempts: r = ${r.game_script.team_ta_vs_opp_rush_r}. League: ${r.game_script.team_ta_per_opp_play} team T+A per opponent play.`);
  L.push(''); L.push('| Split | N | Avg residual | Over own avg |'); L.push('|---|---|---|---|');
  for (const s of r.game_script.splits) L.push(`| ${s.split} | ${s.n} | ${s.avg_resid} | ${pct(s.pct_over_own_avg)} |`);
  L.push(''); L.push('| Group | Split | N | Avg residual | Over own avg |'); L.push('|---|---|---|---|---|');
  for (const s of r.game_script.by_group) L.push(`| ${s.group} | ${s.split} | ${s.n} | ${s.avg_resid} | ${pct(s.pct_over_own_avg)} |`);
  L.push('');
  L.push('## 5. Stat crews: is assist crediting a venue effect?');
  L.push(''); L.push(`${r.crews.venues} venues with 3+ games. Home-defense vs. visiting-defense assist rate at the same venue: r = ${r.crews.home_vs_visiting_defense_assist_rate_r}. Split-half (odd vs. even home games): r = ${r.crews.split_half_r}.`);
  L.push(''); L.push('| Venue | Games | Home D assist rate | Visiting D assist rate |'); L.push('|---|---|---|---|');
  for (const v of r.crews.table) L.push(`| ${v.venue} | ${v.games} | ${pct(v.home_def_assist_rate)} | ${pct(v.visiting_def_assist_rate)} |`);
  L.push('');
  L.push('## 6. Persistence (weeks 1–3 vs. 4–7)');
  L.push(''); L.push('Opponent offense factors, correlation early vs. late:'); L.push('');
  L.push(`| LB | S | CB | DL | Plays | Rush share |`); L.push('|---|---|---|---|---|---|');
  const o = r.opponent_persistence.weeks_1_3_vs_4_7_r; L.push(`| ${o.LB} | ${o.S} | ${o.CB} | ${o.DL} | ${o.plays} | ${o.rush_share} |`);
  L.push(''); L.push('Player stability by group:'); L.push('');
  L.push('| Group | Players | T+A avg r (early vs. late) | Solo share r | Median game-to-game CV |'); L.push('|---|---|---|---|---|');
  for (const [g, v] of Object.entries(r.player_stability)) L.push(`| ${g} | ${v.players} | ${v.ta_avg_split_half_r} | ${v.solo_share_split_half_r} | ${v.median_game_to_game_cv} |`);
  L.push('');
  L.push('## 7. Vacated tackles (a 6+ T+A teammate in the same unit missing)');
  L.push(''); L.push('| Absent → beneficiary | Cases | Avg change | Share that went up |'); L.push('|---|---|---|---|');
  for (const [k, v] of Object.entries(r.vacated.summary)) L.push(`| ${k} | ${v.cases} | ${v.avg_delta} | ${pct(v.pct_positive)} |`);
  L.push(''); L.push('Biggest individual bumps (small samples — role notes, not rules):'); L.push('');
  L.push('| Team | Absent | Beneficiary | G without | Avg without | Avg with | Δ |'); L.push('|---|---|---|---|---|---|---|');
  for (const c of r.vacated.cases.slice(0, 20)) L.push(`| ${c.team} | ${c.absent_player} (${c.absent_group}, ${c.absent_avg}) | ${c.beneficiary} (${c.group}) | ${c.games_without} | ${c.avg_without} | ${c.avg_with} | ${c.delta} |`);
  L.push('');
  L.push('## 8. Sacks');
  L.push(''); L.push('| Prior sack-game rate | N | Next-week sack rate |'); L.push('|---|---|---|');
  for (const s of r.sacks) L.push(`| ${s.prior_sack_game_rate} | ${s.n} | ${pct(s.next_week_sack_rate)} |`);
  L.push('');
  return L.join('\n');
}

async function main() {
  const season = Number(process.argv.includes('--season') ? process.argv[process.argv.indexOf('--season') + 1] : 2026);
  const log = JSON.parse(await readFile(path.join(OUT_DIR, `defensive-game-log-${season}.json`), 'utf8'));
  const rows = log.rows.filter(r => r.completed);
  const preds = walkForward(rows);
  const result = {
    generated_at: new Date().toISOString(), season, through_week: Math.max(...rows.map(r => r.week)),
    games: new Set(rows.map(r => r.event_id)).size, rows: rows.length, walk_forward_n: preds.length,
    methods: scoreMethods(preds),
    adjustments: [adjustmentDirection(preds, 'opp_factor', 'Opponent group factor'), adjustmentDirection(preds, 'crew_factor', 'Stat-crew factor')],
    calibration: calibration(preds),
    game_script: gameScript(rows),
    crews: crewPersistence(rows),
    opponent_persistence: opponentPersistence(rows),
    player_stability: playerStability(rows),
    vacated: vacatedTackles(rows),
    sacks: sackPredictability(preds),
  };
  await mkdir(DOCS_DIR, { recursive: true });
  await writeFileAtomic(path.join(OUT_DIR, `defensive-backtest-${season}-w${String(result.through_week).padStart(2, '0')}.json`), JSON.stringify({ ...result, predictions: preds }, null, 2) + '\n');
  await writeFileAtomic(path.join(DOCS_DIR, `defensive-backtest-${season}-w${String(result.through_week).padStart(2, '0')}.md`), render(result));
  console.log(render(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exit(1); });
}
