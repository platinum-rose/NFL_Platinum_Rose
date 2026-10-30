#!/usr/bin/env node
// scripts/build-defensive-props.mjs
//
// Defensive player prop research layer (tackles+assists, solo, sacks, INT).
// Builds, from free ESPN game summaries:
//   1. a per-defender game log for the season,
//   2. player profiles (averages, hit rates at common prop lines, splits),
//   3. opponent "tackle environment" factors by defender position group,
//   4. home stat-crew assist-crediting factors,
//   5. a week-ahead matchup sheet for the next week's defenders.
//
// Usage:
//   node scripts/build-defensive-props.mjs [--season 2026] [--through-week 7] [--target-week 8] [--no-fetch]
//
// Reads data/fantasy/boxscores/espn-<id>.json. Any completed game missing or
// unreadable there is fetched from ESPN (free, read-only) into
// data/defensive-props/cache/ — the fantasy boxscore cache is never modified.
// No Supabase, no paid calls.

import { mkdir, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileAtomic } from './lib/atomic-file-write.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BOX_DIR = path.join(ROOT, 'data', 'fantasy', 'boxscores');
const OUT_DIR = path.join(ROOT, 'data', 'defensive-props');
const CACHE_DIR = path.join(OUT_DIR, 'cache');
const DOCS_DIR = path.join(ROOT, 'docs', 'defensive-props');
const SUMMARY_URL = id => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`;

const LINES_TA = [3, 4, 5, 6, 7, 8, 9, 10]; // "N+" tackles+assists
const LINES_SOLO = [2, 3, 4, 5, 6];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
const NO_FETCH = process.argv.includes('--no-fetch');

export function positionGroup(pos) {
  const p = String(pos || '').toUpperCase();
  if (['LB', 'ILB', 'MLB', 'WLB', 'SLB'].includes(p)) return 'LB';
  if (['OLB', 'EDGE'].includes(p)) return 'EDGE';
  if (['DE', 'DT', 'NT', 'DL'].includes(p)) return 'DL';
  if (['S', 'FS', 'SS', 'SAF'].includes(p)) return 'S';
  if (['CB', 'DB', 'NB'].includes(p)) return 'CB';
  return 'OTHER';
}

const num = v => { const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

async function readJson(p) { return JSON.parse(await readFile(p, 'utf8')); }

async function loadSummary(id) {
  for (const p of [path.join(BOX_DIR, `espn-${id}.json`), path.join(CACHE_DIR, `espn-${id}.json`)]) {
    try { const d = await readJson(p); if (d?.boxscore?.players) return { data: d, source: path.relative(ROOT, p) }; } catch { /* missing or truncated */ }
  }
  if (NO_FETCH) return null;
  let text = null;
  try { const res = await fetch(SUMMARY_URL(id)); if (res.ok) text = await res.text(); } catch { /* fall back to curl (honors proxy env) */ }
  if (!text) {
    try { text = execFileSync('curl', ['-s', '-m', '30', SUMMARY_URL(id)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); } catch { return null; }
  }
  let d; try { d = JSON.parse(text); } catch { return null; }
  if (!d?.boxscore?.players) return null;
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFileAtomic(path.join(CACHE_DIR, `espn-${id}.json`), text);
  return { data: d, source: 'espn-fetch' };
}

function teamStat(teamBlock, name) {
  return (teamBlock?.statistics || []).find(s => s.name === name)?.displayValue;
}

// Extract one row per defender per game.
export function extractDefensiveRows(summary, { positionsById = {} } = {}) {
  const comp = summary.header?.competitions?.[0];
  if (!comp) return [];
  const week = summary.header?.week;
  const season = summary.header?.season?.year;
  const eventId = String(summary.header?.id || comp.id);
  const completed = comp.status?.type?.completed === true;
  const sides = {};
  for (const c of comp.competitors || []) {
    sides[c.team.abbreviation] = { homeAway: c.homeAway, score: num(c.score) };
  }
  const teams = Object.keys(sides);
  if (teams.length !== 2) return [];
  const homeTeam = teams.find(t => sides[t].homeAway === 'home');

  // Team offensive context, keyed by the OFFENSE's abbreviation.
  const offense = {};
  for (const tb of summary.boxscore?.teams || []) {
    const abbr = tb.team?.abbreviation;
    const [comp_, att] = String(teamStat(tb, 'completionAttempts') || '0/0').split('/').map(num);
    const sacksTaken = num(String(teamStat(tb, 'sacksYardsLost') || '0-0').split('-')[0]);
    offense[abbr] = {
      plays: num(teamStat(tb, 'totalOffensivePlays')),
      rushAtt: num(teamStat(tb, 'rushingAttempts')),
      passAtt: att, completions: comp_, sacksTaken,
      possession: teamStat(tb, 'possessionTime') || null,
    };
  }

  const rows = [];
  for (const tp of summary.boxscore?.players || []) {
    const team = tp.team?.abbreviation;
    const opp = teams.find(t => t !== team);
    const def = tp.statistics?.find(c => c.name === 'defensive');
    const ints = tp.statistics?.find(c => c.name === 'interceptions');
    if (!def) continue;
    const intById = {};
    for (const a of ints?.athletes || []) intById[a.athlete.id] = num(a.stats?.[0]);
    const k = def.keys || [];
    const idx = key => k.indexOf(key);
    const teamTotal = (def.athletes || []).reduce((s, a) => s + num(a.stats?.[idx('totalTackles')]), 0);
    for (const a of def.athletes || []) {
      const s = a.stats || [];
      const tot = num(s[idx('totalTackles')]);
      const solo = num(s[idx('soloTackles')]);
      const pos = positionsById[a.athlete.id] || null;
      rows.push({
        season, week, event_id: eventId, completed,
        team, opp, home: team === homeTeam, stat_crew_home_team: homeTeam,
        athlete_id: String(a.athlete.id), player: a.athlete.displayName,
        position: pos, group: positionGroup(pos),
        tackles_assists: tot, solo, assists: Math.max(0, tot - solo),
        sacks: num(s[idx('sacks')]), tfl: num(s[idx('tacklesForLoss')]),
        passes_defended: num(s[idx('passesDefended')]), qb_hits: num(s[idx('QBHits')]),
        def_td: num(s[idx('defensiveTouchdowns')]), interceptions: intById[a.athlete.id] || 0,
        team_tackles_total: teamTotal, tackle_share: teamTotal ? round(tot / teamTotal, 3) : 0,
        opp_plays: offense[opp]?.plays ?? null, opp_rush_att: offense[opp]?.rushAtt ?? null,
        opp_pass_att: offense[opp]?.passAtt ?? null, opp_completions: offense[opp]?.completions ?? null,
        team_score: sides[team].score, opp_score: sides[opp].score,
        final_margin: sides[team].score - sides[opp].score,
      });
    }
  }
  return rows;
}

function hitRates(values, lines) {
  const out = {};
  for (const l of lines) out[`${l}+`] = values.length ? round(values.filter(v => v >= l).length / values.length, 2) : null;
  return out;
}

export function buildProfiles(rows, { minGames = 2 } = {}) {
  const byPlayer = new Map();
  for (const r of rows) {
    if (!byPlayer.has(r.athlete_id)) byPlayer.set(r.athlete_id, []);
    byPlayer.get(r.athlete_id).push(r);
  }
  const playsMedian = median(rows.map(r => r.opp_plays).filter(Boolean));
  const profiles = [];
  for (const [id, games] of byPlayer) {
    if (games.length < minGames) continue;
    games.sort((a, b) => a.week - b.week);
    const ta = games.map(g => g.tackles_assists);
    const last = games[games.length - 1];
    const split = pred => { const g = games.filter(pred); return g.length ? { games: g.length, avg_ta: round(mean(g.map(x => x.tackles_assists))) } : null; };
    const per60 = games.filter(g => g.opp_plays).map(g => (g.tackles_assists / g.opp_plays) * 60);
    profiles.push({
      athlete_id: id, player: last.player, team: last.team, position: last.position, group: last.group,
      games: games.length, weeks: games.map(g => g.week),
      game_log_ta: ta,
      avg_ta: round(mean(ta)), median_ta: median(ta), min_ta: Math.min(...ta), max_ta: Math.max(...ta),
      last3_avg_ta: round(mean(ta.slice(-3))),
      avg_solo: round(mean(games.map(g => g.solo))), avg_assists: round(mean(games.map(g => g.assists))),
      ta_per_60_opp_plays: round(mean(per60)),
      avg_tackle_share: round(mean(games.map(g => g.tackle_share)), 3),
      hit_rate_ta: hitRates(ta, LINES_TA),
      hit_rate_solo: hitRates(games.map(g => g.solo), LINES_SOLO),
      sack_game_rate: round(games.filter(g => g.sacks >= 0.5).length / games.length, 2),
      avg_sacks: round(mean(games.map(g => g.sacks))), avg_qb_hits: round(mean(games.map(g => g.qb_hits))),
      int_game_rate: round(games.filter(g => g.interceptions > 0).length / games.length, 2),
      splits: {
        opp_plays_high: split(g => g.opp_plays >= playsMedian),
        opp_plays_low: split(g => g.opp_plays && g.opp_plays < playsMedian),
        team_won: split(g => g.final_margin > 0),
        team_lost: split(g => g.final_margin < 0),
        home: split(g => g.home), away: split(g => !g.home),
      },
    });
  }
  profiles.sort((a, b) => b.avg_ta - a.avg_ta);
  return { opp_plays_median: playsMedian, profiles };
}

// How many T+A each offense "gives" to each defender group, relative to league.
export function buildOpponentFactors(rows) {
  const groups = ['LB', 'S', 'CB', 'EDGE', 'DL'];
  const perGame = new Map(); // `${opp}|${event}` -> {group: total}
  for (const r of rows) {
    const key = `${r.opp}|${r.event_id}`;
    if (!perGame.has(key)) perGame.set(key, { offense: r.opp, plays: r.opp_plays, rush: r.opp_rush_att, pass: r.opp_pass_att, g: {} });
    const pg = perGame.get(key);
    pg.g[r.group] = (pg.g[r.group] || 0) + r.tackles_assists;
  }
  const games = [...perGame.values()];
  const league = {};
  for (const grp of groups) league[grp] = mean(games.map(x => x.g[grp] || 0));
  const leaguePlays = mean(games.map(x => x.plays || 0));
  const byOffense = {};
  for (const x of games) (byOffense[x.offense] ||= []).push(x);
  const out = {};
  for (const [off, gs] of Object.entries(byOffense)) {
    const f = {};
    for (const grp of groups) f[grp] = league[grp] ? round(mean(gs.map(x => x.g[grp] || 0)) / league[grp]) : null;
    const plays = mean(gs.map(x => x.plays || 0));
    const rush = mean(gs.map(x => x.rush || 0));
    const pass = mean(gs.map(x => x.pass || 0));
    out[off] = { games: gs.length, avg_plays: round(plays, 1), plays_factor: round(plays / leaguePlays), rush_share: round(rush / (rush + pass || 1)), group_factors: f };
  }
  return { league_avg_ta_by_group: Object.fromEntries(groups.map(g => [g, round(league[g], 1)])), league_avg_plays: round(leaguePlays, 1), offenses: out };
}

// Home scorer crews differ in how freely they credit assists.
export function buildStatCrewFactors(rows) {
  const byHome = {};
  for (const r of rows) {
    const h = (byHome[r.stat_crew_home_team] ||= { events: new Set(), solo: 0, ast: 0 });
    h.events.add(r.event_id); h.solo += r.solo; h.ast += r.assists;
  }
  const lgAst = rows.reduce((s, r) => s + r.assists, 0) / (rows.reduce((s, r) => s + r.tackles_assists, 0) || 1);
  const out = {};
  for (const [team, h] of Object.entries(byHome)) {
    const rate = h.ast / ((h.ast + h.solo) || 1);
    out[team] = { home_games: h.events.size, assist_rate: round(rate, 3), vs_league: round(rate / lgAst), total_ta_per_game: round((h.ast + h.solo) / h.events.size, 1) };
  }
  return { league_assist_rate: round(lgAst, 3), crews: out };
}

const EXCLUDE_STATUSES = new Set(['OUT', 'IR', 'PUP', 'SUSPENSION', 'DOUBTFUL']);
export function buildMatchupSheet(profiles, oppFactors, crews, schedule, week, { rosterById = null, availability = {} } = {}) {
  const excluded = [];
  const games = schedule.filter(g => Number(g.week) === Number(week));
  const sheet = [];
  for (const g of games) {
    for (const [team, opp, home] of [[g.home, g.visitor, g.home], [g.visitor, g.home, g.home]]) {
      const o = oppFactors.offenses[opp];
      const crew = crews.crews[home];
      for (const p of profiles.filter(x => x.games >= 3 && (rosterById ? rosterById[x.athlete_id]?.team === team : x.team === team))) {
        const ros = rosterById?.[p.athlete_id];
        const status = availability[`${p.player}|${team}`] || null;
        if (rosterById && (!ros || ros.status === 'practice-squad')) { excluded.push({ player: p.player, team, reason: 'not on active roster' }); continue; }
        if (status && EXCLUDE_STATUSES.has(status)) { excluded.push({ player: p.player, team, reason: status }); continue; }
        const gf = o?.group_factors?.[p.group] ?? 1;
        // Blend: assists slice scaled by crew tendency; whole line scaled by opponent group factor.
        const crewAdj = crew && crew.home_games >= 2 ? 1 + (crew.vs_league - 1) * (p.avg_assists / (p.avg_ta || 1)) : 1;
        sheet.push({
          event_id: g.id, game: `${g.visitor} @ ${g.home}`, kickoff_utc: g.kickoff_utc,
          player: p.player, team, position: p.position, group: p.group, injury_status: status,
          traded_in: p.team !== team,
          avg_ta: p.avg_ta, last3_avg_ta: p.last3_avg_ta, median_ta: p.median_ta,
          opp_group_factor: gf, opp_plays_factor: o?.plays_factor ?? 1, crew_factor: round(crewAdj),
          proj_ta: round(p.avg_ta * gf * crewAdj, 1),
          hit_rate_ta: p.hit_rate_ta, sack_game_rate: p.sack_game_rate, int_game_rate: p.int_game_rate,
        });
      }
    }
  }
  sheet.sort((a, b) => b.proj_ta - a.proj_ta);
  sheet.excluded = excluded;
  return sheet;
}

function renderMarkdown({ generatedAt, season, throughWeek, targetWeek, gamesUsed, profiles, oppFactors, crews, sheet, meta = {} }) {
  const L = [];
  L.push(`# Defensive props research — ${season} through Week ${throughWeek}`);
  L.push('');
  L.push(`Generated ${generatedAt}. Source: ESPN game summaries (${gamesUsed} completed games). Tackles+assists = ESPN "TOT". Players listed need 3+ games.`);
  L.push('');
  L.push('## How to read this');
  L.push('- **Hit rate N+** = share of games the player reached N or more tackles+assists. Compare with the prop price\'s implied probability.');
  L.push('- **Opp group factor** = how many T+A this week\'s opponent offense gives to that position group vs. league average (1.20 = 20% more).');
  L.push('- **Crew factor** = home scorer\'s assist-crediting tendency, applied to the assist share of the player\'s average. Assists are the noisiest part of a T+A line.');
  L.push('- **Proj** = season avg × opp group factor × crew factor. A screen, not a model: check role, injuries and snap share before placing.');
  L.push('');
  L.push(`## Week ${targetWeek} matchup sheet (top 60 by projection)`);
  L.push('');
  L.push(`Gated on the ESPN roster (${meta.roster_as_of || 'n/a'}) and player availability (${meta.availability_as_of || 'n/a'}): OUT/IR/PUP/Suspended/Doubtful and players no longer on the active roster are removed (${(sheet.excluded || []).length} removed). Questionable players are marked Q; players now on a new team are marked *. This is a research screen, not the strict pre-publication roster gate.`);
  L.push('');
  L.push('| Game | Player | Pos | Avg | L3 | Med | Opp× | Crew× | Proj | 4+ | 5+ | 6+ | 7+ | 8+ | Sack% |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const pct = v => (v == null ? '' : `${Math.round(v * 100)}%`);
  for (const r of sheet.slice(0, 60)) {
    const h = r.hit_rate_ta;
    L.push(`| ${r.game} | ${r.player} (${r.team})${r.injury_status === 'QUESTIONABLE' ? ' Q' : ''}${r.traded_in ? '*' : ''} | ${r.position || '?'} | ${r.avg_ta} | ${r.last3_avg_ta} | ${r.median_ta} | ${r.opp_group_factor} | ${r.crew_factor} | **${r.proj_ta}** | ${pct(h['4+'])} | ${pct(h['5+'])} | ${pct(h['6+'])} | ${pct(h['7+'])} | ${pct(h['8+'])} | ${pct(r.sack_game_rate)} |`);
  }
  L.push('');
  L.push('## Offenses: tackle environment they create');
  L.push('');
  L.push(`League avg offensive plays ${oppFactors.league_avg_plays}. Group factors vs. league.`);
  L.push('');
  L.push('| Offense | G | Plays | Plays× | Rush share | LB× | S× | CB× | EDGE× | DL× |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const [off, o] of Object.entries(oppFactors.offenses).sort((a, b) => b[1].plays_factor - a[1].plays_factor)) {
    const f = o.group_factors;
    L.push(`| ${off} | ${o.games} | ${o.avg_plays} | ${o.plays_factor} | ${pct(o.rush_share)} | ${f.LB} | ${f.S} | ${f.CB} | ${f.EDGE} | ${f.DL} |`);
  }
  L.push('');
  L.push('## Home stat crews: assist crediting');
  L.push('');
  L.push(`League assist rate ${pct(crews.league_assist_rate)} of all T+A.`);
  L.push('');
  L.push('| Home team | Home G | Assist rate | vs league | T+A per game (both teams) |');
  L.push('|---|---|---|---|---|');
  for (const [t, c] of Object.entries(crews.crews).sort((a, b) => b[1].vs_league - a[1].vs_league)) {
    L.push(`| ${t} | ${c.home_games} | ${pct(c.assist_rate)} | ${c.vs_league} | ${c.total_ta_per_game} |`);
  }
  L.push('');
  L.push('## Season leaders (avg T+A, 3+ games)');
  L.push('');
  L.push('| Player | Team | Pos | G | Avg | Med | L3 | Solo | Ast | Share | T+A/60 opp plays | Log |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of profiles.filter(x => x.games >= 3).slice(0, 50)) {
    L.push(`| ${p.player} | ${p.team} | ${p.position || '?'} | ${p.games} | ${p.avg_ta} | ${p.median_ta} | ${p.last3_avg_ta} | ${p.avg_solo} | ${p.avg_assists} | ${pct(p.avg_tackle_share)} | ${p.ta_per_60_opp_plays} | ${p.game_log_ta.join(', ')} |`);
  }
  L.push('');
  return L.join('\n');
}

async function main() {
  const season = Number(arg('season', 2026));
  const schedule = await readJson(path.join(ROOT, 'public', 'schedule.json'));
  const games = (Array.isArray(schedule) ? schedule : schedule.games || []).filter(g => Number(g.season) === season);
  const now = Date.now();
  const defaultThrough = Math.max(0, ...games.filter(g => Date.parse(g.kickoff_utc) + 4 * 3600e3 < now).map(g => Number(g.week)));
  const throughWeek = Number(arg('through-week', defaultThrough));
  const targetWeek = Number(arg('target-week', throughWeek + 1));

  const roster = await readJson(path.join(ROOT, 'data', 'nfl-rosters', 'espn-full-rosters-latest.json'));
  const positionsById = {}; const rosterById = {};
  for (const entries of Object.values(roster.players || {})) for (const e of entries) if (e.espn_id) { positionsById[String(e.espn_id)] = e.position; rosterById[String(e.espn_id)] = e; }
  const availability = {}; let availabilityAsOf = null;
  try {
    const av = await readJson(path.join(ROOT, 'data', 'player-availability', 'latest.json'));
    availabilityAsOf = av.meta?.generated_at || null;
    const latest = {};
    for (const ev of av.events || []) {
      const k = `${ev.player_name}|${ev.team_abbr}`;
      if (!ev.normalized_status || ev.normalized_status === 'UNKNOWN' || ev.normalized_status === 'ACTIVE_NEWS') continue;
      if (!latest[k] || String(ev.captured_at) > String(latest[k].captured_at)) latest[k] = ev;
    }
    for (const [k, ev] of Object.entries(latest)) availability[k] = ev.normalized_status;
  } catch { /* availability optional; sheet is then roster-gated only */ }

  // Every scheduled game through the week, plus any saved summary we hold.
  const ids = new Set(games.filter(g => Number(g.week) <= throughWeek).map(g => String(g.id)));
  for (const f of await readdir(BOX_DIR).catch(() => [])) { const m = f.match(/^espn-(\d+)\.json$/); if (m) ids.add(m[1]); }

  const rows = []; const missing = []; const sources = {};
  for (const id of [...ids].sort()) {
    const s = await loadSummary(id).catch(() => null);
    if (!s) { missing.push(id); continue; }
    const r = extractDefensiveRows(s.data, { positionsById });
    if (!r.length || !r[0].completed || r[0].season !== season || r[0].week > throughWeek) continue;
    sources[id] = s.source;
    rows.push(...r);
  }
  rows.sort((a, b) => a.week - b.week || a.event_id.localeCompare(b.event_id) || a.team.localeCompare(b.team));
  const gamesUsed = new Set(rows.map(r => r.event_id)).size;

  const { opp_plays_median, profiles } = buildProfiles(rows);
  const oppFactors = buildOpponentFactors(rows);
  const crews = buildStatCrewFactors(rows);
  const sheet = buildMatchupSheet(profiles, oppFactors, crews, games, targetWeek, { rosterById, availability });
  const generatedAt = new Date().toISOString();
  const meta = { generated_at: generatedAt, season, through_week: throughWeek, target_week: targetWeek, games_used: gamesUsed, missing_event_ids: missing, unmapped_positions: rows.filter(r => !r.position).length, roster_as_of: roster.generated_at || null, availability_as_of: availabilityAsOf };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  await writeFileAtomic(path.join(OUT_DIR, `defensive-game-log-${season}.json`), JSON.stringify({ ...meta, sources, rows }, null, 2) + '\n');
  await writeFileAtomic(path.join(OUT_DIR, 'defensive-player-profiles-latest.json'), JSON.stringify({ ...meta, opp_plays_median, profiles }, null, 2) + '\n');
  await writeFileAtomic(path.join(OUT_DIR, 'defensive-opponent-factors-latest.json'), JSON.stringify({ ...meta, ...oppFactors, stat_crews: crews }, null, 2) + '\n');
  await writeFileAtomic(path.join(OUT_DIR, `defensive-matchups-week-${String(targetWeek).padStart(2, '0')}.json`), JSON.stringify({ ...meta, excluded: sheet.excluded, rows: sheet }, null, 2) + '\n');
  await writeFileAtomic(path.join(DOCS_DIR, 'defensive-props-latest.md'), renderMarkdown({ generatedAt, season, throughWeek, targetWeek, gamesUsed, profiles, oppFactors, crews, sheet, meta }));
  console.log(JSON.stringify({ ...meta, rows: rows.length, profiles: profiles.length, matchup_rows: sheet.length, matchup_excluded: sheet.excluded.length }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exit(1); });
}
