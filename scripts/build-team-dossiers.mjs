#!/usr/bin/env node
// Team dossier builder v1 (schema: reports/analysis/week6-intel/team-dossier-schema-v1.md)
// Local files only. Deterministic. No network / Supabase / model calls. Nulls are never imputed.
// Excludes all market data (lines, ML, ATS/OU, implied totals, market-implied ranks).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NFL_TEAMS } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILDER_VERSION = 'team_dossier_builder_v1.1';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const TARGET_WEEK = Number(args.week || 6);
const DONE = TARGET_WEEK - 1;
const SEASON = 2026;
const TAG = `${SEASON}-w${String(TARGET_WEEK).padStart(2, '0')}`;
const OUT_BASE = path.join(ROOT, 'data', 'generated', 'team-dossiers');
const OUT = path.join(OUT_BASE, TAG);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const P = (...s) => path.join(ROOT, ...s);

// ---------- helpers ----------
const missing = [];
function readJson(p, { required = true } = {}) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { if (required) missing.push(rel(p)); return null; }
}
function sha(p) { try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch { return null; } }
function csv(p) {
  const txt = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean);
  const split = (l) => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  const h = split(txt[0]);
  return txt.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [h[i], v])));
}
const sortKeys = (o) => Array.isArray(o) ? o.map(sortKeys) : (o && typeof o === 'object') ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])])) : o;
const nullify = (v) => (v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v))) ? null : v;

// ---------- crosswalk ----------
const CANON_FIX = { WSH: 'WAS', LA: 'LAR', JAC: 'JAX', AZ: 'ARI' };
const canon = (c) => { const u = String(c || '').toUpperCase(); return CANON_FIX[u] || u; };
const crosswalk = {};
const byNickname = {};
for (const t of Object.values(NFL_TEAMS)) {
  const code = canon(t.abbreviation);
  const aliases = new Set([t.abbreviation, ...(t.altAbbreviations || []), t.name, t.fullName, t.city, ...(t.aliases || [])].map((x) => String(x)));
  aliases.add('WSH'); if (code !== 'WAS') aliases.delete('WSH');
  crosswalk[code] = {
    code, nickname: t.name, full_name: t.fullName, city: t.city, conference: t.conference,
    division: t.division, aliases: [...aliases].filter((a) => a !== code).sort(),
    espn_slug: code === 'WAS' ? 'was' : code.toLowerCase(),
  };
  byNickname[t.name.toLowerCase()] = code;
}
crosswalk.WAS.aliases = [...new Set([...crosswalk.WAS.aliases, 'WSH'])].sort();
crosswalk.LAR.aliases = [...new Set([...crosswalk.LAR.aliases, 'LA'])].sort();
const TEAMS = Object.keys(crosswalk).sort();
if (TEAMS.length !== 32) { console.error(`crosswalk has ${TEAMS.length} teams`); process.exit(2); }

// ---------- sources ----------
const SRC = {
  standings: { path: P('data/generated/team-profiles', `team-standings-${SEASON}-w${String(DONE).padStart(2, '0')}.json`), use: 'record/PF/PA only; ATS/OU fields in source are ignored (market data)' },
  analytic: { path: P('data/generated/team-profiles', `team-analytic-snapshots-${SEASON}-w${DONE}.json`), use: 'nflverse-derived efficiency; separate signal, not a projection' },
  regression: { path: P('data/generated/team-profiles', `team-regression-snapshots-${SEASON}-w${DONE}.json`), use: 'nflverse-derived Pythagorean/one-score context; separate signal' },
  coaching: { path: P('data/generated/team-profiles', `team-coaching-tendency-snapshots-${SEASON}-w${DONE}.json`), use: 'historical_context_only (stale after meta.stale_after); never a current-week claim' },
  power: { path: P('data/generated/team-profiles', `team-power-ratings-${SEASON}.json`), use: 'separate signal, not a projection; market-implied fields excluded' },
  ftn: { path: P('data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json'), use: 'statistical context only; numeric team source of record' },
  secondary: { path: P('data/secondary-matchups/latest.json'), use: 'manual_review_capped; per-matchup coverage context; check meta.week' },
  schedules: { path: P('data/vault-seed/nflverse/schedules.csv'), use: 'venue/roof/surface only; June odds columns and week-6 pairings are NOT used' },
  slate: { path: P('data/generated/team-dossiers', `w${String(TARGET_WEEK).padStart(2, '0')}-slate.json`), use: 'target-week opponent and home/away (operator-confirmed slate)' },
};
for (let w = 1; w <= DONE; w++) SRC[`espn_w${w}`] = { path: P('reports/analysis/season/claude/out', `week-${String(w).padStart(2, '0')}-teams.json`), use: 'ESPN box-score derived per-game team stats (market columns dropped)' };

const analytic = readJson(SRC.analytic.path), regression = readJson(SRC.regression.path), coaching = readJson(SRC.coaching.path);
const standings = readJson(SRC.standings.path), power = readJson(SRC.power.path), ftn = readJson(SRC.ftn.path);
const secondary = readJson(SRC.secondary.path), slate = readJson(SRC.slate.path);
// ---------- step 3 sources (v1.1): availability + priors. All optional: a missing file marks that section partial/missing, never a crash ----------
const WW = String(TARGET_WEEK).padStart(2, '0');
const SRC3 = {
  espn_status: { path: P('data/research-intel/source-evidence', `espn-status-w${WW}.json`), use: 'ESPN public injuries feed + depth-chart QB + roster IR/Out group (scripts/intel/fetch-espn-status.py); statuses lag game-day truth' },
  avail_events: { path: P('data/player-availability/latest.json'), use: 'availability intel only; roster-gate first; event statuses can be stale or conflicted' },
  impact_digest: { path: P('data/player-availability/impact-digest-latest.json'), use: 'starter-impact digest; research context only; market-linkage fields dropped' },
  projected_starters: { path: P('data/projected-starters/2026/latest.json'), use: 'projected starters; coverage is partly estimated from local starter language; check coverage_status' },
  roster_vet: { path: P('data/generated/master-intel', `w${WW}-roster-vet.json`), use: 'roster gate result (scripts/nfl-rosters/roster_vet.py); must be PASS for roster_gate=passed' },
  roster_snapshot: { path: P('data/nfl-rosters/espn-full-rosters-latest.json'), use: 'ESPN rosters incl. IR/practice squad plus Andy-reported overrides; name/team ground truth' },
  operator_overrides: { path: P('data/nfl-rosters/operator-status-overrides.json'), use: 'Andy-reported trades/IR that ESPN lags' },
  operator_starters: { path: P('data/research-intel', `operator-confirmed-starters-2026-w${WW}.json`), use: 'operator-stated starters for the target week; not independently verified' },
  prior_analytic: { path: P('data/generated/team-profiles/team-analytic-snapshots-2025-w18.json'), use: 'prior_season (2025 final); never a current-season claim' },
  prior_regression: { path: P('data/generated/team-profiles/team-regression-snapshots-2025-w18.json'), use: 'prior_season (2025 final)' },
  prior_power: { path: P('data/generated/team-profiles/team-power-ratings-2025.json'), use: 'prior_season (2025 final); market-implied fields excluded' },
  prior_dvoa: { path: P('data/generated/team-profiles/team-dvoa-snapshots-2025.json'), use: 'prior_season (2025 final); 2026 DVOA is retired' },
  camp: { path: P('data/training-camp/2026/all-32-camp-notes-2026-07-31.json'), use: 'preseason_prior (Jul 31 camp notes); frozen context, roster-checked at build' },
  trench: { path: P('data/intel/bettorday_trench_ratings_2026.json'), use: 'preseason_prior (Sep 2, week 0 trench ratings)' },
};
const S3 = Object.fromEntries(Object.entries(SRC3).map(([k, s]) => [k, readJson(s.path, { required: false })]));
const espnWeeks = {};
for (let w = 1; w <= DONE; w++) espnWeeks[w] = readJson(SRC[`espn_w${w}`].path);
let sched = [];
try { sched = csv(SRC.schedules.path); } catch { missing.push(rel(SRC.schedules.path)); }
if (missing.length) { console.error('REQUIRED SOURCES MISSING:\n' + missing.join('\n')); process.exit(3); }

let gitHead = null, gitDirty = null;
try { gitHead = execSync('git rev-parse --short HEAD', { cwd: ROOT, timeout: 20000 }).toString().trim(); } catch { /* ok */ }

const nick2code = (n) => byNickname[String(n || '').toLowerCase()] || canon(n);
const idx = (arr, keyFn) => Object.fromEntries(arr.map((r) => [keyFn(r), r]));
const analyticBy = idx(analytic.rows, (r) => nick2code(r.team));
const regBy = idx(regression.rows, (r) => nick2code(r.team));
const coachBy = idx(coaching.rows, (r) => nick2code(r.team));
const powerBy = idx(power.rows, (r) => canon(r.team_abbr));
const standBy = idx(standings.rows, (r) => canon(r.team));

const stamp = (obj, ...keys) => { for (const k of keys) if (obj?.[k]) return obj[k]; return null; };
const sourceRegistry = {};
const reg = (id, extra) => {
  const s = SRC[id]; sourceRegistry[id] = { id, path: rel(s.path), sha256: sha(s.path), use_policy: s.use, ...extra };
};
const through = (m) => m?.through_week ?? m?.week ?? null;
reg('standings', { generated_at: stamp(standings.meta, 'generated_at'), through_week: through(standings.meta) });
reg('analytic', { generated_at: stamp(analytic.meta, 'generated_at'), through_week: through(analytic.meta) });
reg('regression', { generated_at: stamp(regression.meta, 'generated_at'), through_week: through(regression.meta) });
reg('coaching', { generated_at: stamp(coaching.meta, 'generated_at'), through_week: through(coaching.meta), stale_after: coaching.meta.stale_after });
reg('power', { generated_at: stamp(power.meta, 'generated_at'), through_week: DONE, note: 'meta has no week; built from games.csv through W' + DONE });
reg('ftn', { generated_at: ftn.generated_at, through_week: null, note: 'through_week read per-table from GP; see dossier ftn section' });
reg('secondary', { generated_at: secondary.meta.generated_at, through_week: secondary.meta.week });
reg('schedules', {}); reg('slate', slate ? { generated_at: slate.generated_at ?? null } : {});
for (let w = 1; w <= DONE; w++) reg(`espn_w${w}`, { through_week: w });
const statusFor = (tw) => tw == null ? 'unknown' : tw >= DONE ? 'current' : tw === DONE - 1 ? 'stale_1wk' : 'stale';
for (const s of Object.values(sourceRegistry)) s.status = s.id === 'ftn' ? 'see_tables' : statusFor(s.through_week);
sourceRegistry.secondary.status = secondary.meta.week >= TARGET_WEEK ? 'current' : 'stale_prior_week_matchups';
sourceRegistry.coaching.status = Date.now() > Date.parse(coaching.meta.stale_after) ? 'stale_historical' : 'historical_context_only';
// ---------- step 3 registry (after the statuses above so they are not overwritten) ----------
const ageH = (iso) => (iso ? Math.round(((Date.now() - Date.parse(iso)) / 36e5) * 10) / 10 : null);
const freshStatus = (iso, maxH = 36) => (iso ? (ageH(iso) <= maxH ? 'current' : 'stale') : 'unknown');
const reg3 = (id, generated_at, status, extra = {}) => { const s = SRC3[id]; sourceRegistry[id] = { id, path: rel(s.path), sha256: sha(s.path), use_policy: s.use, generated_at: generated_at ?? null, through_week: null, status: S3[id] ? status : 'missing', ...extra }; };
reg3('espn_status', S3.espn_status?.fetched_at, freshStatus(S3.espn_status?.fetched_at));
reg3('avail_events', S3.avail_events?.meta?.generated_at, freshStatus(S3.avail_events?.meta?.generated_at));
reg3('impact_digest', S3.impact_digest?.meta?.generated_at, freshStatus(S3.impact_digest?.meta?.generated_at));
reg3('projected_starters', S3.projected_starters?.meta?.generated_at, freshStatus(S3.projected_starters?.meta?.generated_at));
reg3('roster_vet', S3.roster_vet?.generated_at ?? null, S3.roster_vet?.status === 'PASS' ? 'current' : 'check_failed_or_unknown');
reg3('roster_snapshot', S3.roster_snapshot?.generated_at, freshStatus(S3.roster_snapshot?.generated_at, 30));
reg3('operator_overrides', null, 'current');
reg3('operator_starters', S3.operator_starters?.confirmed_at ?? null, S3.operator_starters?.week === TARGET_WEEK ? 'current' : 'missing');
if (S3.operator_starters && S3.operator_starters.week !== TARGET_WEEK) S3.operator_starters = null;
for (const id of ['prior_analytic', 'prior_regression', 'prior_power', 'prior_dvoa']) reg3(id, S3[id]?.meta?.generated_at, 'prior_season', { through_week: S3[id]?.meta?.week ?? null });
reg3('camp', S3.camp?.meta?.generated_at ?? null, 'preseason_prior');
reg3('trench', null, 'preseason_prior', { as_of_date: (S3.trench || [])[0]?.as_of_date ?? null });
const srcRef = (...ids) => ids.map((i) => ({ id: i, path: sourceRegistry[i].path, generated_at: sourceRegistry[i].generated_at ?? null }));

// ---------- sections ----------
const MARKET_KEYS = new Set(['line', 'ml', 'ats', 'cover_margin', 'total', 'ou', 'implied_pts']);
function gameLog(team) {
  const rows = [];
  for (let w = 1; w <= DONE; w++) {
    const r = (espnWeeks[w].rows || []).find((x) => canon(x.team) === team);
    if (!r) { rows.push({ week: w, bye: true }); continue; }
    rows.push({
      week: w, opponent: canon(r.opp), home_away: r.home_away, result: r.su, pts: r.pts, opp_pts: r.opp_pts, margin: r.margin,
      plays: r.plays, yards: r.yards, ypp: r.ypp, opp_yards: r.opp_yards, opp_ypp: r.opp_ypp, pass_yds: r.pass_yds, rush_yds: r.rush_yds,
      rush_att: r.rush_att, cmp_att: r.cmp_att, first_downs: r.first_downs, third_down: r.third_down, third_pct: r.third_pct,
      red_zone: r.red_zone, rz_td_pct: r.rz_td_pct, sacks_taken: r.sacks_taken, sacks_made: r.sacks_made, giveaways: r.giveaways,
      takeaways: r.takeaways, to_margin: r.to_margin, def_td: r.def_td, penalties: r.penalties, top: r.top, drives: r.drives,
      pts_per_drive: r.pts_per_drive, three_and_outs: r.three_and_outs, avg_start_own: r.avg_start_own, event_id: r.event_id, date_utc: r.date_utc,
    });
  }
  return rows;
}
const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const avg = (a, f) => a.length ? Math.round((sum(a, f) / a.length) * 1000) / 1000 : null;
function seasonProfile(log) {
  const g = log.filter((x) => !x.bye); const n = g.length;
  const frac = (s) => { const m = String(s || '').match(/(\d+)-(\d+)/); return m ? [Number(m[1]), Number(m[2])] : [0, 0]; };
  const tdNum = sum(g, (x) => frac(x.third_down)[0]), tdDen = sum(g, (x) => frac(x.third_down)[1]);
  const rzNum = sum(g, (x) => frac(x.red_zone)[0]), rzDen = sum(g, (x) => frac(x.red_zone)[1]);
  return {
    games: n, ppg: avg(g, (x) => x.pts), papg: avg(g, (x) => x.opp_pts), yards_pg: avg(g, (x) => x.yards), opp_yards_pg: avg(g, (x) => x.opp_yards),
    plays_pg: avg(g, (x) => x.plays), ypp: avg(g, (x) => x.ypp), opp_ypp: avg(g, (x) => x.opp_ypp), pass_yds_pg: avg(g, (x) => x.pass_yds), rush_yds_pg: avg(g, (x) => x.rush_yds),
    third_down_pct: tdDen ? Math.round(tdNum / tdDen * 1000) / 1000 : null, red_zone_att_pg: n ? Math.round(rzDen / n * 100) / 100 : null,
    red_zone_td_pct: rzDen ? Math.round(rzNum / rzDen * 1000) / 1000 : null,
    sacks_taken_pg: avg(g, (x) => x.sacks_taken), sacks_made_pg: avg(g, (x) => x.sacks_made),
    giveaways: sum(g, (x) => x.giveaways), takeaways: sum(g, (x) => x.takeaways), turnover_margin: sum(g, (x) => x.takeaways) - sum(g, (x) => x.giveaways),
    pts_per_drive: avg(g, (x) => x.pts_per_drive), three_and_outs_pg: avg(g, (x) => x.three_and_outs),
    note: 'Aggregated from game_log rows (ESPN). red_zone_td_pct here is red-zone trips converted to TD per ESPN box score; no opponent split.',
  };
}
function identity(team) {
  const c = crosswalk[team];
  const home = sched.find((r) => r.season === String(SEASON) && canon(r.home_team) === team && r.stadium);
  const g = slate.games.find((x) => canon(x.away) === team || canon(x.home) === team);
  const out = {
    code: team, nickname: c.nickname, full_name: c.full_name, conference: c.conference, division: c.division,
    head_coach: coachBy[team]?.head_coach ?? null, offensive_coordinator: coachBy[team]?.offensive_coordinator ?? null, defensive_coordinator: coachBy[team]?.defensive_coordinator ?? null,
    stadium: home?.stadium ?? null, roof: home?.roof ?? null, surface: home?.surface ?? null,
    target_week_game: null, bye_weeks_played: standBy[team]?.byes ?? [],
  };
  if (g) {
    const isAway = canon(g.away) === team;
    out.target_week_game = { week: TARGET_WEEK, opponent: canon(isAway ? g.home : g.away), home_away: isAway ? 'away' : 'home', kickoff_pt: g.kickoff_pt ?? null };
  } else out.target_week_game = { week: TARGET_WEEK, bye: true };
  return out;
}
const MARKET_STAND = new Set(['ats', 'ou']);
function standing(team) {
  const r = standBy[team]; if (!r) return null;
  const o = {}; for (const [k, v] of Object.entries(r)) if (!MARKET_STAND.has(k) && k !== 'espn_check') o[k] = v;
  o.espn_check = r.espn_check ?? null; return o;
}
const ANALYTIC_DROP = new Set(['source_key', 'source_name', 'source_url', 'snapshot_at', 'season', 'week', 'team']);
function effNflverse(team) {
  const a = analyticBy[team] || {}, r = regBy[team] || {};
  const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !ANALYTIC_DROP.has(k)));
  const aa = pick(a), rr = pick(r);
  const nullFields = [...Object.entries(aa).filter(([, v]) => v === null).map(([k]) => `analytic.${k}`), ...Object.entries(rr).filter(([, v]) => v === null).map(([k]) => `regression.${k}`)];
  return { analytic: aa, regression: rr, unavailable_in_source: nullFields };
}
function powerSec(team) {
  const p = powerBy[team]; if (!p) return null;
  const pr = p.power_rating || {};
  const keep = ['srs', 'net_points_per_game', 'pythag_win_pct', 'model_composite_z', 'model_rank', 'srs_rank', 'net_ppg_rank', 'pythag_rank'];
  return { games_played: p.games_played, record: p.record, ...Object.fromEntries(keep.map((k) => [k, nullify(pr[k])])), excluded: ['market_implied_win_total', 'market_implied_rank', 'delta (market data)'] };
}
function ftnSec(team) {
  const recs = ftn.team_context[team]?.records || [];
  const tables = {}; let qb = null; const gpSeen = {};
  for (const r of recs) {
    const key = `${r.category}/${r.subpage}`;
    if (r.category === 'team-offense' || r.category === 'team-defense') {
      tables[key] = { metrics: r.metrics }; const gp = Number(r.metrics?.GP ?? r.metrics?.G); if (Number.isFinite(gp)) gpSeen[key] = gp;
    } else if (r.category === 'passing') {
      qb = qb || { player: r.metrics?.Player, position: r.metrics?.Position, tables: {} };
      if (r.metrics?.Player === qb.player) { qb.tables[key] = r.metrics; const gp = Number(r.metrics?.GP); if (Number.isFinite(gp)) gpSeen[key] = gp; }
    }
  }
  const gps = Object.values(gpSeen);
  const tw = gps.length ? Math.max(...gps) : null;
  return {
    source: srcRef('ftn')[0], through_week: tw, status: statusFor(tw), use_policy: SRC.ftn.use,
    team_tables: tables, qb1: qb, player_depth: 'qb1_only (schema decision A); other player rows intentionally omitted until roster gate',
    gp_by_table: gpSeen,
  };
}
function scheme(team) {
  const c = coachBy[team] || {};
  const drop = new Set(['source_key', 'source_name', 'source_url', 'snapshot_at', 'season', 'week', 'team']);
  const hist = Object.fromEntries(Object.entries(c).filter(([k]) => !drop.has(k)));
  const sm = (secondary.matchups || []).filter((m) => canon(m.offense_team) === team || canon(m.defense_team) === team);
  return {
    coaching: { label: sourceRegistry.coaching.status, use_policy: SRC.coaching.use, stale_after: coaching.meta.stale_after, fields: hist },
    secondary_matchup: { label: 'manual_review_capped', source_week: secondary.meta.week, status: sourceRegistry.secondary.status, entries: sm.length ? annotateTargets(sm) : null,
      note: sm.length ? 'Entries pertain to the source week, not the target week.' : 'No team-keyed entries found in source structure; see raw file.' },
  };
}

// ---------- step 3 helpers (v1.1): roster check, availability, priors ----------
const n3 = (s) => String(s || '').toLowerCase().replace(/[.'’]/g, '').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/\s+/g, ' ').trim();
const HARD_STATUS = ['out', 'injured reserve', 'suspended', 'physically unable to perform', 'non football injury'];
const AMBIG_STATUS = ['questionable', 'doubtful', 'day-to-day'];
const lc = (s) => String(s || '').toLowerCase();
const rosterRecs = new Map();
for (const [name, recs] of Object.entries(S3.roster_snapshot?.players || {})) for (const r of recs) {
  const k = n3(name); if (!rosterRecs.has(k)) rosterRecs.set(k, []);
  rosterRecs.get(k).push({ name, team: canon(r.team), group: r.group, operator_override: r.operator_override || null });
}
function gateFlag(team, name) {
  if (!S3.roster_snapshot) return 'roster_snapshot_missing';
  const recs = rosterRecs.get(n3(name));
  if (!recs) return 'not_on_any_roster';
  const mine = recs.filter((r) => r.team === team);
  if (!mine.length) return 'on_other_team:' + [...new Set(recs.map((r) => r.team))].sort().join('/');
  if (mine.every((r) => r.group === 'practiceSquad')) return 'practice_squad';
  if (mine.every((r) => r.group === 'injuredReserveOrOut')) return mine.some((r) => r.operator_override) ? 'operator_ir' : 'roster_ir_out_group';
  return 'ok';
}
const feedItem = (team, name) => (S3.espn_status?.teams?.[team]?.injury_report_non_active || []).find((i) => n3(i.player) === n3(name)) || null;
function unavailability(team, name) {
  const g = gateFlag(team, name), fi = feedItem(team, name), s = lc(fi?.status);
  if (g === 'operator_ir') return { cls: 'operator_ir', exclude: true };
  if (HARD_STATUS.includes(s)) return { cls: 'reported_out', exclude: true };
  if (g === 'roster_ir_out_group') return { cls: 'roster_ir_out_unconfirmed', exclude: false };
  if (AMBIG_STATUS.includes(s)) return { cls: s, exclude: false };
  return { cls: g === 'ok' ? 'none' : 'roster_check:' + g, exclude: false };
}
// Target receivers come from the manual secondary-matchup seed: drop operator-IR / ESPN-reported Out/IR players (listed, not silently lost), flag the rest.
function annotateTargets(entries) {
  return entries.map((e0) => {
    const e = structuredClone(e0); if (!Array.isArray(e.target_receivers)) return e;
    const keep = [], out = [];
    for (const r of e.target_receivers) { const u = unavailability(canon(r.team), r.player_name); (u.exclude ? out : keep).push({ ...r, availability_flag: u.cls }); }
    e.target_receivers = keep;
    e.excluded_unavailable = out.map((r) => ({ player_name: r.player_name, team: r.team, availability_flag: r.availability_flag, note: 'removed from target_receivers at build (operator-reported IR or ESPN-reported Out/IR); seed row kept for his return' }));
    return e;
  });
}
const gateStatus = () => (!S3.roster_vet ? 'not_run' : (S3.roster_vet.status === 'PASS' && (S3.roster_vet.blocking || []).length === 0 ? 'passed' : 'failed'));
const OLP = new Set(['OL', 'OT', 'G', 'T', 'C', 'OG', 'OC']), DLP = new Set(['DL', 'DE', 'DT', 'NT']);
function cluster(inj, posSet) {
  const rows = inj.filter((i) => posSet.has(i.pos));
  const hard = rows.filter((i) => HARD_STATUS.includes(lc(i.status)) || lc(i.status) === 'doubtful'), q = rows.filter((i) => lc(i.status) === 'questionable');
  return { hard_or_doubtful: hard.length, questionable: q.length, risk: hard.length >= 2 ? 'cluster' : (hard.length === 1 || q.length >= 2) ? 'watch' : 'none',
    rule: 'derived here (not a source field): cluster = 2+ Out/IR/Doubtful in the group; watch = 1 Out/IR/Doubtful or 2+ Questionable; ESPN feed only', players: rows.map((i) => `${i.player} ${i.pos} ${i.status}`) };
}
const opQbFor = (team) => (S3.operator_starters?.starters?.[team] ? { player: S3.operator_starters.starters[team], confirmed_at: S3.operator_starters.confirmed_at ?? null, note: S3.operator_starters.note ?? null } : null);
const tenDaysAgo = () => Date.now() - 10 * 864e5;
function availabilitySec(team) {
  const es = S3.espn_status?.teams?.[team];
  const gate = gateStatus();
  const gate_detail = { source: SRC3.roster_vet.path && rel(SRC3.roster_vet.path), vet_status: S3.roster_vet?.status ?? null, blocking_count: S3.roster_vet ? (S3.roster_vet.blocking || []).length : null,
    roster_snapshot_generated_at: S3.roster_snapshot?.generated_at ?? null, roster_age_h_at_vet: S3.roster_vet?.roster_age_h ?? null, operator_overrides_applied: S3.roster_snapshot?.operator_overrides_applied ?? [],
    scope: 'Gate covers card legs, narratives, matchup seeds and secondary targets. Every name in this section comes from ESPN/operator data and is re-checked against the roster snapshot here (roster_check).' };
  const as_of = { espn_status: S3.espn_status?.fetched_at ?? null, availability_events: S3.avail_events?.meta?.generated_at ?? null, impact_digest: S3.impact_digest?.meta?.generated_at ?? null, projected_starters: S3.projected_starters?.meta?.generated_at ?? null, roster_snapshot: S3.roster_snapshot?.generated_at ?? null };
  if (!es) return { status: 'missing', roster_gate: gate, roster_gate_detail: gate_detail, as_of, caveats: [`no ESPN status data for ${team}`] };
  const inj = es.injury_report_non_active || [];
  const it = (i) => ({ player: i.player, pos: i.pos, status: i.status, date: i.date || null, comment: i.comment ? String(i.comment).slice(0, 160) : null, roster_check: gateFlag(team, i.player) });
  const out_ir = inj.filter((i) => HARD_STATUS.includes(lc(i.status))).map(it);
  const qd = inj.filter((i) => AMBIG_STATUS.includes(lc(i.status))).map(it);
  const other = inj.filter((i) => !HARD_STATUS.includes(lc(i.status)) && !AMBIG_STATUS.includes(lc(i.status))).map(it);
  const ops = (S3.operator_overrides?.entries || []).filter((e) => [e.team, e.to_team, e.from_team].map(canon).includes(team));
  const operator_reported = ops.map((e) => ({ id: e.id, kind: e.kind, player: e.player, position: e.position, status: e.status ?? (e.kind === 'team_change' ? `traded ${e.from_team}->${e.to_team}` : null), expected_duration: e.expected_duration ?? null, effective: e.effective, reported_by: e.reported_by, roster_check: gateFlag(team, e.player) }));
  const ru = (es.roster_ir_out_unconfirmed || []).filter((r) => !r.operator_override).map((r) => ({ player: r.player, pos: r.pos, roster_status: r.roster_status }));
  const events = (S3.avail_events?.events || []).filter((e) => canon(e.team_abbr) === team && !['', 'NONE', 'UNKNOWN'].includes(String(e.normalized_status || '').toUpperCase()) && Date.parse(e.published_at || 0) >= tenDaysAgo())
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const seenP = new Set(), live_events = [];
  for (const e of events) { const k = n3(e.player_name); if (seenP.has(k)) continue; seenP.add(k); if (live_events.length >= 12) break;
    live_events.push({ player_name: e.player_name, position: e.position, normalized_status: e.normalized_status, availability_trend: e.availability_trend, event_type: e.event_type, source: e.source, published_at: e.published_at,
      summary: String(e.short_summary || '').slice(0, 160), practice: [e.practice_1, e.practice_2, e.practice_3].filter(Boolean), probability_of_playing: e.probability_of_playing ?? null, evidence_status: e.evidence_status, synthesis_eligible: e.synthesis_eligible, needs_human_review: e.needs_human_review, roster_check: gateFlag(team, e.player_name) }); }
  const impact_digest = (S3.impact_digest?.top_events || []).filter((e) => canon(e.team) === team && e.starter_match).sort((a, b) => b.score - a.score).slice(0, 10)
    .map((e) => ({ player_name: e.player_name, position: e.position, unit: e.unit, event_type: e.event_type, availability_trend: e.availability_trend, impact_bucket: e.impact_bucket, starter_match: e.starter_match, score: e.score, signal: e.signal,
      source: e.source, published_at: e.published_at, summary: String(e.summary || '').slice(0, 160), classification_warning: e.classification_warning ?? null, evidence_status: e.evidence_status, synthesis_eligible: e.synthesis_eligible, needs_human_review: e.needs_human_review, roster_check: gateFlag(team, e.player_name) }));
  const ps = S3.projected_starters?.teams?.[team];
  const projected_starters = ps ? { coverage_status: ps.coverage_status, as_of: as_of.projected_starters, known: ps.known || [], estimated: ps.estimated || [], missing: ps.missing || [],
    players: (ps.players || []).map((p) => ({ player_name: p.player_name, position: p.position, unit: p.unit, role: p.role, starter_confidence: p.starter_confidence, roster_confidence: p.roster_confidence, roster_check: gateFlag(team, p.player_name) })) } : null;
  const missing_inputs = [['avail_events', S3.avail_events], ['impact_digest', S3.impact_digest], ['projected_starters', S3.projected_starters]].filter(([, v]) => !v).map(([k]) => k);
  const caveats = ['ESPN injury statuses lag game-day truth; official inactives decide.', 'roster_ir_out_unconfirmed = ESPN roster IR/Out group not in the injury feed (ESPN marks them day-to-day): not confirmed Out.'];
  if (!S3.operator_starters) caveats.push(`no operator-confirmed starters file for W${TARGET_WEEK}; QB status is ESPN depth chart + feed only`);
  for (const k of ['espn_status', 'avail_events', 'impact_digest', 'projected_starters', 'roster_snapshot']) if (sourceRegistry[k].status === 'stale') caveats.push(`${k} is stale (>${k === 'roster_snapshot' ? 30 : 36}h at build)`);
  if (gate !== 'passed') caveats.push(`roster gate ${gate}: do not name players from this section`);
  return { status: missing_inputs.length ? 'partial' : 'built', roster_gate: gate, roster_gate_detail: gate_detail, as_of, use_policy: 'intel only; roster-gate first; not a projection or recommendation',
    qb: { espn_starter: es.qb_starter, flag: es.qb_flag, note: es.qb_note || null, depth: (es.qb_depth || []).slice(0, 3), operator_confirmed: opQbFor(team) },
    reported_injuries: { out_ir, questionable_doubtful: qd, other }, operator_reported, roster_ir_out_unconfirmed: ru,
    ol_dl_cluster_risk: { ol: cluster(inj, OLP), dl: cluster(inj, DLP) }, live_events: { window: 'published within 10 days of build; latest per player; cap 12', rows: live_events }, impact_digest, projected_starters, missing_inputs, caveats };
}
const PRIOR_DROP = new Set(['source_key', 'source_name', 'source_url', 'snapshot_at', 'season', 'week', 'team', 'team_abbr']);
const MARKETISH = /market|implied|^delta|(^|_)ats($|_)|^ou$|odds|price|^line/i;
const cleanDeep = (o) => (Array.isArray(o) ? o.map(cleanDeep) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([k]) => !PRIOR_DROP.has(k) && !MARKETISH.test(k)).map(([k, v]) => [k, cleanDeep(v)])) : o);
const rowsBy = (o, keyFn) => (o ? idx(o.rows || [], keyFn) : {});
const pAn = rowsBy(S3.prior_analytic, (r) => nick2code(r.team)), pRg = rowsBy(S3.prior_regression, (r) => nick2code(r.team)), pPw = rowsBy(S3.prior_power, (r) => canon(r.team_abbr)), pDv = rowsBy(S3.prior_dvoa, (r) => nick2code(r.team));
function priorsSec(team) {
  const missing_inputs = ['prior_analytic', 'prior_regression', 'prior_power', 'prior_dvoa', 'camp', 'trench'].filter((k) => !S3[k]);
  const camp = S3.camp?.teams?.[team]; const kept = [], withheld = [];
  for (const c of camp?.items || []) {
    const g = c.player ? gateFlag(team, c.player) : 'no_player';
    const row = { signal_type: c.signal_type, topic: c.topic, player: c.player ?? null, summary: String(c.summary || '').slice(0, 220), confidence: c.confidence, published_at: c.published_at, roster_check: g };
    if (['on_other_team', 'not_on_any_roster', 'practice_squad'].some((p) => g.startsWith(p))) withheld.push({ ...row, withheld_reason: 'camp note names a player who is not on this team per the roster snapshot (trade/release since July 31)' }); else kept.push(row);
  }
  const trenchRows = (S3.trench || []).filter((r) => canon(r.team) === team).map((r) => cleanDeep(r));
  return { status: missing_inputs.length ? 'partial' : 'built', label_policy: 'Everything here is prior_season (2025 final) or preseason_prior (camp Jul 31, trench Sep 2). Never cite as current-season evidence; rosters and scheme have changed.',
    prior_season_2025: { label: 'prior_season', use_policy: 'context only', analytic: cleanDeep(pAn[team] ?? null), regression: cleanDeep(pRg[team] ?? null), power: cleanDeep(pPw[team] ?? null), dvoa: cleanDeep(pDv[team] ?? null) },
    camp_notes: { label: 'preseason_prior', as_of: '2026-07-31', items: kept, withheld_roster_changed: withheld },
    trench_ratings: { label: 'preseason_prior', as_of_date: trenchRows[0]?.as_of_date ?? null, rows: trenchRows }, missing_inputs };
}
const dqAvail = (a) => ({ status: a.status, through_week: null, as_of: a.as_of, roster_gate: a.roster_gate, null_fields: a.missing_inputs ?? [], caveats: a.caveats ?? [] });
const dqPriors = (p) => ({ status: p.status, through_week: null, as_of: { prior_season: '2025 w18 final', camp: '2026-07-31', trench: p.trench_ratings.as_of_date }, null_fields: p.missing_inputs, caveats: ['prior_season / preseason_prior only'] });
const availSummary = (a) => ({ qb: a.qb ? { espn_starter: a.qb.espn_starter, flag: a.qb.flag, operator_confirmed: a.qb.operator_confirmed?.player ?? null } : null,
  out_ir: (a.reported_injuries?.out_ir || []).map((i) => `${i.player} ${i.pos} ${i.status}`), questionable_doubtful: (a.reported_injuries?.questionable_doubtful || []).map((i) => `${i.player} ${i.pos} ${i.status}`),
  operator_reported: (a.operator_reported || []).map((o) => `${o.player} ${o.position} ${o.status}`), ol_risk: a.ol_dl_cluster_risk?.ol.risk ?? null, dl_risk: a.ol_dl_cluster_risk?.dl.risk ?? null });
const matchupAvail = (da, dh) => ({ status: [da, dh].every((d) => d.availability.status === 'built') ? 'built' : 'partial', roster_gate: da.availability.roster_gate, as_of: da.availability.as_of, away: availSummary(da.availability), home: availSummary(dh.availability) });
function renderStep3(d) {
  const a = d.availability, p = d.priors, f3 = (v, dd = 2) => (v == null ? 'n/a' : (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(dd)) : String(v)));
  const cap = (arr, n) => (arr.length ? arr.slice(0, n).join('; ') + (arr.length > n ? ` (+${arr.length - n} more)` : '') : 'none');
  const L = [];
  L.push(`## Availability (${a.status}; intel only; roster_gate ${a.roster_gate}; ESPN ${f3(a.as_of?.espn_status)})`);
  if (a.status === 'missing') { L.push(`Not available: ${(a.caveats || []).join(' ')}`); } else {
    L.push('Names below are ESPN/operator data re-checked against the roster snapshot; ESPN statuses lag, official inactives decide.');
    const q = a.qb; L.push(`QB: ${f3(q.espn_starter)} [${q.flag}]${q.note ? ' ' + q.note : ''}${q.operator_confirmed ? ' · operator-confirmed ' + q.operator_confirmed.player : ''}`);
    L.push(`Out/IR: ${cap(a.reported_injuries.out_ir.map((i) => `${i.player} ${i.pos} ${i.status}`), 6)}`);
    L.push(`Questionable/Doubtful: ${cap(a.reported_injuries.questionable_doubtful.map((i) => `${i.player} ${i.pos} ${i.status}`), 6)}`);
    if (a.operator_reported.length) L.push(`Operator-reported (Andy, not in ESPN): ${a.operator_reported.map((o) => `${o.player} ${o.position} ${o.status}`).join('; ')}`);
    L.push(`Roster IR/Out group, unconfirmed (ESPN day-to-day, not confirmed Out): ${a.roster_ir_out_unconfirmed.length} players; skill: ${cap(a.roster_ir_out_unconfirmed.filter((r) => ['QB', 'RB', 'WR', 'TE', 'FB'].includes(r.pos)).map((r) => `${r.player} ${r.pos}`), 5)}`);
    L.push(`OL/DL cluster risk (derived): OL ${a.ol_dl_cluster_risk.ol.risk}, DL ${a.ol_dl_cluster_risk.dl.risk}`);
    L.push(`Impact digest (top by score): ${cap(a.impact_digest.map((e) => `${e.player_name} ${e.position} ${e.event_type}/${e.availability_trend}`), 4)}`);
    L.push(`Projected starters: ${a.projected_starters ? `${a.projected_starters.coverage_status}, ${a.projected_starters.players.length} players` : 'none'}`);
  }
  L.push('');
  L.push('## Priors (prior_season / preseason_prior; not current-season evidence)');
  const r = p.prior_season_2025.regression || {}, an = p.prior_season_2025.analytic || {}, dv = p.prior_season_2025.dvoa || {}, pw = (p.prior_season_2025.power || {}).power_rating || {}, tr = p.trench_ratings.rows[0] || {};
  L.push(`2025 final [prior_season]: ${f3(r.record)} · diff ${f3(r.point_differential)} · Pythag ${f3(r.pythag_win_pct, 3)} · SRS #${f3(pw.srs_rank)} · EPA off #${f3(an.off_epa_rank)} def #${f3(an.def_epa_rank)} · DVOA ${f3(dv.overall_dvoa, 1)} (#${f3(dv.overall_dvoa_rank)}) off ${f3(dv.offensive_dvoa, 1)} def ${f3(dv.defensive_dvoa, 1)}`);
  L.push(`Camp notes [preseason_prior, Jul 31]: ${p.camp_notes.items.length} kept, ${p.camp_notes.withheld_roster_changed.length} withheld (player left the team)`);
  L.push(`Trench composite [preseason_prior, ${f3(p.trench_ratings.as_of_date)}]: #${f3(tr.rank_overall)} · run block z ${f3(tr.run_block_z)} · pass block z ${f3(tr.pass_block_z)} · run D z ${f3(tr.run_defense_z)} · pass rush z ${f3(tr.pass_rush_z)}`);
  return L;
}

// ---------- build ----------
fs.mkdirSync(path.join(OUT, 'matchups'), { recursive: true });
const dossiers = {};
for (const team of TEAMS) {
  const log = gameLog(team);
  const sec = {
    identity: identity(team), standing: standing(team), game_log: log, season_profile_espn: seasonProfile(log),
    efficiency_nflverse: effNflverse(team), ftn: ftnSec(team), power: powerSec(team), scheme_context: scheme(team),
    availability: availabilitySec(team),
    priors: priorsSec(team),
  };
  const dq = {
    standing: { status: standBy[team] ? 'current' : 'missing', through_week: standings.meta.through_week },
    game_log: { status: 'current', through_week: DONE, byes: log.filter((x) => x.bye).map((x) => x.week) },
    season_profile_espn: { status: 'current', through_week: DONE },
    efficiency_nflverse: { status: statusFor(analytic.meta.week), through_week: analytic.meta.week, null_fields: sec.efficiency_nflverse.unavailable_in_source },
    ftn: { status: sec.ftn.status, through_week: sec.ftn.through_week },
    power: { status: statusFor(DONE), through_week: DONE },
    scheme_context: { status: 'historical_context_only', caveats: ['coaching snapshot stale after ' + coaching.meta.stale_after, 'secondary-matchup source week ' + secondary.meta.week] },
    availability: dqAvail(sec.availability), priors: dqPriors(sec.priors),
  };
  const d = {
    schema: 'team_dossier_v1', team, season: SEASON, target_week: TARGET_WEEK, completed_weeks: DONE, built_at: new Date().toISOString(),
    builder: BUILDER_VERSION, git_head: gitHead, market_data_included: false,
    sources: srcRef('standings', 'analytic', 'regression', 'coaching', 'power', 'ftn', 'secondary', 'schedules', 'slate', ...Array.from({ length: DONE }, (_, i) => `espn_w${i + 1}`)).map((s) => ({ ...s, status: sourceRegistry[s.id].status, through_week: sourceRegistry[s.id].through_week ?? null, sha256: sourceRegistry[s.id].sha256, use_policy: sourceRegistry[s.id].use_policy })),
    ...sec, data_quality: dq,
  };
  dossiers[team] = d;
  fs.writeFileSync(path.join(OUT, `${team}.json`), JSON.stringify(d, null, 2) + '\n');
}

// ---------- md renderer ----------
const f = (v, d = 2) => v == null ? 'n/a' : (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(d)) : String(v));
function renderMd(d) {
  const a = d.efficiency_nflverse.analytic, r = d.efficiency_nflverse.regression, s = d.standing, id = d.identity, sp = d.season_profile_espn, ft = d.ftn, pw = d.power;
  const T = (k) => ft.team_tables[k]?.metrics || null;
  const kv = (m, keys) => m ? keys.map((k) => `${k} ${m[k] ?? 'n/a'}`).join(' · ') : 'n/a';
  const L = [];
  L.push(`# ${d.team} ${id.nickname} — dossier, target Week ${d.target_week} (data through W${d.completed_weeks})`);
  L.push(`Built ${d.built_at} · git ${d.git_head} · no market data (lines, ATS/OU, prices) in this file · roster_gate: ${d.availability.roster_gate} — player names appear ONLY in the Availability section (roster-gated); never name players from anywhere else.`);
  L.push(`Freshness: standing ${d.data_quality.standing.status} (W${d.data_quality.standing.through_week}) · ESPN game log current (W${DONE}) · nflverse efficiency ${d.data_quality.efficiency_nflverse.status} (W${d.data_quality.efficiency_nflverse.through_week}) · FTN ${ft.status} (through W${f(ft.through_week)}) · coaching ${sourceRegistry.coaching.status} · availability ${d.availability.status} · priors ${d.priors.status}.`);
  L.push('');
  const g = id.target_week_game;
  L.push(`## Identity [Source: schedules.csv/coaching/slate]`);
  L.push(`${d.team} · ${id.conference} ${id.division} · HC ${f(id.head_coach)} · ${f(id.stadium)} (${f(id.roof)}, ${f(id.surface)}) · W${d.target_week}: ${g.bye ? 'BYE' : `${g.home_away === 'away' ? '@' : 'vs'} ${g.opponent}${g.kickoff_pt ? ' ' + g.kickoff_pt : ''}`}${id.bye_weeks_played.length ? ' · bye played W' + id.bye_weeks_played.join(',') : ''}`);
  L.push('');
  L.push(`## Standing [Source: ${sourceRegistry.standings.path}, through W${s.weeks_played ? Math.max(...s.weeks_played) : 'n/a'}]`);
  L.push(`${s.record} (${f(s.win_pct, 3)}) · PF ${s.pf} PA ${s.pa} (${s.diff >= 0 ? '+' : ''}${s.diff}) · home ${s.home} · away ${s.away} · div ${s.division_record} · conf ${s.conference_record} · streak ${s.streak} · div rank ${s.division_rank} · conf rank ${s.conference_rank} (win% then point diff; not official tiebreakers)`);
  L.push('');
  L.push(`## Game log (ESPN, W1–W${DONE})`);
  L.push('| Wk | Opp | H/A | Res | Score | Yds | YPP | Opp YPP | 3D% | RZ TD% | Sk (for/against) | TO (give/take) |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const x of d.game_log) L.push(x.bye ? `| ${x.week} | BYE | | | | | | | | | | |` : `| ${x.week} | ${x.opponent} | ${x.home_away === 'home' ? 'H' : 'A'} | ${x.result} | ${x.pts}-${x.opp_pts} | ${x.yards} | ${f(x.ypp, 1)} | ${f(x.opp_ypp, 1)} | ${f(x.third_pct, 3)} | ${f(x.rz_td_pct, 2)} | ${x.sacks_made}/${x.sacks_taken} | ${x.giveaways}/${x.takeaways} |`);
  L.push(`Season (ESPN, ${sp.games}g): ${f(sp.ppg, 1)} PPG / ${f(sp.papg, 1)} allowed · ${f(sp.yards_pg, 0)} yd/g (${f(sp.ypp, 2)} YPP) vs ${f(sp.opp_yards_pg, 0)} allowed (${f(sp.opp_ypp, 2)}) · 3D ${f(sp.third_down_pct, 3)} · RZ TD ${f(sp.red_zone_td_pct, 3)} · sacks ${f(sp.sacks_made_pg, 1)} made / ${f(sp.sacks_taken_pg, 1)} taken per g · TO margin ${sp.turnover_margin >= 0 ? '+' : ''}${sp.turnover_margin} (${sp.giveaways} give / ${sp.takeaways} take) · ${f(sp.pts_per_drive, 2)} pts/drive`);
  L.push('');
  L.push(`## Efficiency (nflverse, through W${d.data_quality.efficiency_nflverse.through_week}, ${d.data_quality.efficiency_nflverse.status}) [Source: ${sourceRegistry.analytic.path}, ${sourceRegistry.regression.path}]`);
  L.push(`EPA/play off ${f(a.off_epa_per_play, 3)} (#${f(a.off_epa_rank)}) · def ${f(a.def_epa_per_play, 3)} (#${f(a.def_epa_rank)}) · EPA/dropback ${f(a.epa_per_dropback, 3)} · CPOE ${f(a.cpoe, 2)} · neutral pass rate ${f(a.neutral_pass_rate, 3)} · sack rate allowed ${f(a.sack_rate_allowed, 3)} / generated ${f(a.sack_rate_generated, 3)}`);
  L.push(`Pythag win% ${f(r.pythag_win_pct, 3)} (${f(r.pythag_wins)} exp wins, delta ${f(r.pythag_win_delta)}, rank ${f(r.pythag_win_delta_rank)}) · one-score ${r.one_score_record ? `${r.one_score_record.wins}-${r.one_score_record.losses}${r.one_score_record.ties ? '-' + r.one_score_record.ties : ''}` : 'n/a'}`);
  L.push(`Unavailable in source (null, not imputed): ${d.efficiency_nflverse.unavailable_in_source.map((x) => x.split('.')[1]).filter((v, i, arr) => arr.indexOf(v) === i).join(', ') || 'none'}.`);
  L.push('');
  L.push(`## FTN Stats iQ (team tables; through W${f(ft.through_week)}, ${ft.status}; statistical context only) [Source: ${sourceRegistry.ftn.path}, generated ${sourceRegistry.ftn.generated_at}]`);
  for (const [k, v] of Object.entries(ft.team_tables)) L.push(`- ${k}: ${Object.entries(v.metrics).filter(([m]) => !['Team', 'Rank'].includes(m)).map(([m, x]) => `${m} ${x}`).join(' · ')}`);
  if (ft.qb1) L.push(`- QB1 (${ft.qb1.player}): ` + Object.entries(ft.qb1.tables).map(([k, m]) => `${k.split('/')[1]} [${Object.entries(m).filter(([x]) => !['Player', 'Team', 'Position'].includes(x)).map(([x, y]) => `${x} ${y}`).join(', ')}]`).join(' · '));
  L.push('');
  L.push(`## Power (separate signal, not a projection) [Source: ${sourceRegistry.power.path}]`);
  L.push(pw ? `SRS ${f(pw.srs, 2)} (#${f(pw.srs_rank)}) · net PPG ${f(pw.net_points_per_game, 1)} (#${f(pw.net_ppg_rank)}) · Pythag ${f(pw.pythag_win_pct, 3)} (#${f(pw.pythag_rank)}) · model rank #${f(pw.model_rank)}` : 'n/a');
  L.push('');
  const sc = d.scheme_context.coaching.fields;
  L.push(`## Scheme context (${sourceRegistry.coaching.status}; historical context only, stale after ${d.scheme_context.coaching.stale_after})`);
  L.push(`HC ${f(sc.head_coach)} · neutral pass rate ${f(sc.neutral_pass_rate, 3)} · sample ${f(sc.sample_start)} → ${f(sc.sample_end)} (${f(sc.games_sample)}g) · 4th-down, shotgun, no-huddle, play-action, motion, pace: ${['fourth_down_aggression_rate', 'shotgun_rate', 'no_huddle_rate', 'play_action_rate', 'motion_rate', 'pace_seconds_per_play'].every((k) => sc[k] == null) ? 'unavailable (null in source)' : 'see JSON'}`);
  L.push(`Secondary-matchup context is manual_review_capped and keyed to source Week ${d.scheme_context.secondary_matchup.source_week} — ${d.scheme_context.secondary_matchup.status}. See ${team_json(d.team)}.`);
  L.push('');
  L.push(...renderStep3(d));
  return L.join('\n') + '\n';
}
const team_json = (t) => `${t}.json → scheme_context.secondary_matchup`;
for (const team of TEAMS) fs.writeFileSync(path.join(OUT, `${team}.md`), renderMd(dossiers[team]));

// ---------- league table ----------
const lt = TEAMS.map((t) => {
  const d = dossiers[t], a = d.efficiency_nflverse.analytic, r = d.efficiency_nflverse.regression, p = d.power, s = d.standing, g = d.identity.target_week_game;
  return { team: t, record: s?.record ?? null, win_pct: s?.win_pct ?? null, ppg: d.season_profile_espn.ppg, papg: d.season_profile_espn.papg, diff: s?.diff ?? null,
    off_epa: a.off_epa_per_play ?? null, def_epa: a.def_epa_per_play ?? null, ypp: d.season_profile_espn.ypp, opp_ypp: d.season_profile_espn.opp_ypp,
    to_margin: d.season_profile_espn.turnover_margin, pythag_delta: r.pythag_win_delta ?? null, srs: p?.srs ?? null, model_rank: p?.model_rank ?? null,
    w_next: g.bye ? 'BYE' : `${g.home_away === 'away' ? '@' : 'vs'} ${g.opponent}`, ftn_status: d.ftn.status };
});
const ltSorted = [...lt].sort((x, y) => (x.model_rank ?? 99) - (y.model_rank ?? 99));
fs.writeFileSync(path.join(OUT, 'league-table.json'), JSON.stringify({ schema: 'team_dossier_league_table_v1', target_week: TARGET_WEEK, completed_weeks: DONE, built_at: new Date().toISOString(), market_data_included: false, rows: ltSorted }, null, 2) + '\n');
const lm = [`# League table — target Week ${TARGET_WEEK} (data through W${DONE}; no market data)`, `Sorted by model rank (market-independent SRS + net PPG + Pythag ensemble). Separate signal, not a projection. EPA from nflverse (through W${analytic.meta.week}); points/yards from ESPN box scores.`, '',
  '| Model # | Team | Rec | PPG | PAPG | Diff | Off EPA | Def EPA | YPP | Opp YPP | TO | Pyth Δ | SRS | W' + TARGET_WEEK + ' |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...ltSorted.map((x) => `| ${f(x.model_rank)} | ${x.team} | ${f(x.record)} | ${f(x.ppg, 1)} | ${f(x.papg, 1)} | ${x.diff >= 0 ? '+' : ''}${f(x.diff)} | ${f(x.off_epa, 3)} | ${f(x.def_epa, 3)} | ${f(x.ypp, 2)} | ${f(x.opp_ypp, 2)} | ${x.to_margin >= 0 ? '+' : ''}${x.to_margin} | ${f(x.pythag_delta)} | ${f(x.srs, 1)} | ${x.w_next} |`)];
fs.writeFileSync(path.join(OUT, 'league-table.md'), lm.join('\n') + '\n');

// ---------- matchups ----------
const mu = [];
for (const gm of slate.games) {
  const A = canon(gm.away), H = canon(gm.home), da = dossiers[A], dh = dossiers[H];
  const pk = (d) => ({ off_epa_per_play: d.efficiency_nflverse.analytic.off_epa_per_play ?? null, def_epa_per_play: d.efficiency_nflverse.analytic.def_epa_per_play ?? null, ppg: d.season_profile_espn.ppg, papg: d.season_profile_espn.papg, ypp: d.season_profile_espn.ypp, opp_ypp: d.season_profile_espn.opp_ypp, srs: d.power?.srs ?? null, turnover_margin: d.season_profile_espn.turnover_margin, record: d.standing?.record ?? null });
  const oppA = new Set(da.game_log.filter((x) => !x.bye).map((x) => x.opponent)), shared = dh.game_log.filter((x) => !x.bye && oppA.has(x.opponent)).map((x) => x.opponent);
  const m = {
    schema: 'team_dossier_matchup_v1', target_week: TARGET_WEEK, away: A, home: H, kickoff_pt: gm.kickoff_pt ?? null, market_data_included: false,
    dossier_refs: { away: `${A}.json`, home: `${H}.json` },
    side_by_side: { away: pk(da), home: pk(dh) },
    unit_vs_unit: {
      away_offense_vs_home_defense: { away_off_epa: pk(da).off_epa_per_play, home_def_epa: pk(dh).def_epa_per_play, away_ypp: pk(da).ypp, home_opp_ypp: pk(dh).opp_ypp, away_ppg: pk(da).ppg, home_papg: pk(dh).papg },
      home_offense_vs_away_defense: { home_off_epa: pk(dh).off_epa_per_play, away_def_epa: pk(da).def_epa_per_play, home_ypp: pk(dh).ypp, away_opp_ypp: pk(da).opp_ypp, home_ppg: pk(dh).ppg, away_papg: pk(da).papg },
      note: 'EPA sign convention per nflverse: lower defensive EPA/play is better. Values side by side only; no projection.',
    },
    shared_opponents_so_far: [...new Set(shared)].sort(),
    availability: matchupAvail(da, dh),
    freshness: { away: da.data_quality, home: dh.data_quality },
  };
  fs.writeFileSync(path.join(OUT, 'matchups', `${A}@${H}.json`), JSON.stringify(m, null, 2) + '\n');
  mu.push(`${A}@${H}`);
}

// ---------- crosswalk + index ----------
fs.writeFileSync(path.join(OUT, 'team-crosswalk.json'), JSON.stringify({ schema: 'team_crosswalk_v1', canonical_note: 'Canonical codes: WAS (not WSH), LAR (not LA), JAX (not JAC). Join on code only.', teams: crosswalk }, null, 2) + '\n');
const index = {
  schema: 'team_dossier_index_v1', season: SEASON, target_week: TARGET_WEEK, completed_weeks: DONE, built_at: new Date().toISOString(), builder: BUILDER_VERSION,
  builder_sha256: sha(fileURLToPath(import.meta.url)), git_head: gitHead, market_data_included: false,
  sources: sourceRegistry, teams: TEAMS, matchups: mu,
  freshness_table: Object.fromEntries(Object.values(sourceRegistry).filter((s) => !s.id.startsWith('espn_')).map((s) => [s.id, { status: s.status, through_week: s.through_week ?? null, generated_at: s.generated_at ?? null }])),
  not_built: ['availability', 'priors'].filter((k) => TEAMS.some((t) => dossiers[t][k].status !== 'built')),
};
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

// ---------- latest pointer ----------
fs.writeFileSync(path.join(OUT_BASE, 'latest.json'), JSON.stringify({ schema: 'team_dossier_latest_pointer_v1', latest: TAG, path: `data/generated/team-dossiers/${TAG}/`, target_week: TARGET_WEEK, completed_weeks: DONE, updated_at: new Date().toISOString() }, null, 2) + '\n');
console.log(`built ${TEAMS.length} dossiers, ${mu.length} matchups -> ${rel(OUT)}`);
