#!/usr/bin/env node
/**
 * yahoo-week-archive.mjs — freeze one finished NFL week of Yahoo data (read-only API).
 *
 * Two phases so a parsing bug never costs data:
 *   fetch : every raw Yahoo response -> data/archive/<season>/week-NN/yahoo/raw/*.json   (gitignored)
 *   parse : raw files only -> data/archive/<season>/week-NN/yahoo/yahoo-week.json         (committed)
 *
 * Covers: every fantasy league on the account (settings, standings, the week's matchups, every team's
 * roster with that week's player points and stats, the week's transactions), Survival Football (runs
 * scripts/sync-yahoo-survivor.mjs --week N and freezes its outputs), and a probe of every other Yahoo
 * game on the account (Pick'em etc.) that saves group/standings/teams responses for later parsing.
 *
 * Usage:  node scripts/archive/yahoo-week-archive.mjs --week 4 [--season 2026] [--from-raw] [--skip-survivor] [--survivor-copy-only]
 * No writes anywhere except data/archive/... (and the survivor sync's own data/survivor files).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const WEEK = Number(arg('--week'));
const SEASON = Number(arg('--season', '2026'));
if (!WEEK) { console.error('--week N is required'); process.exit(2); }
const WK = String(WEEK).padStart(2, '0');
const OUT = path.join(ROOT, 'data', 'archive', String(SEASON), `week-${WK}`, 'yahoo');
const RAW = path.join(OUT, 'raw');
const SURVIVAL_GAME_KEY = '476';

const slug = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '_');
const saveRaw = (name, obj) => { fs.mkdirSync(RAW, { recursive: true }); fs.writeFileSync(path.join(RAW, `${slug(name)}.json`), JSON.stringify(obj)); };
const loadRaw = (name) => { const f = path.join(RAW, `${slug(name)}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const log = [];
const note = (m) => { console.log(m); log.push(m); };

// ---------------------------------------------------------------- fetch
async function fetchAll() {
  const { yget, findAll, deepCollect, collectionItems } = await import('../../agents/lib/yahoo.js');
  const get = async (name, p) => {
    try { const j = await yget(p); saveRaw(name, { path: p, fetched_at: new Date().toISOString(), body: j }); return j; }
    catch (e) { note(`WARN fetch ${name} (${p}): ${e.message}`); saveRaw(name, { path: p, error: e.message }); return null; }
  };
  const games = await get('games', 'users;use_login=1/games');
  const myTeams = await get('nfl-my-teams', 'users;use_login=1/games;game_keys=nfl/teams');
  const teamNodes = findAll(myTeams?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t)).filter((t) => t.team_key);
  const leagueKeys = [...new Set(teamNodes.map((t) => t.team_key.split('.t.')[0]))];
  note(`leagues: ${leagueKeys.join(', ') || 'none'}`);
  for (const lk of leagueKeys) {
    await get(`league-${lk}-settings`, `league/${lk}/settings`);
    await get(`league-${lk}-standings`, `league/${lk}/standings`);
    await get(`league-${lk}-scoreboard`, `league/${lk}/scoreboard;week=${WEEK}`);
    await get(`league-${lk}-transactions`, `league/${lk}/transactions`);
    const teams = await get(`league-${lk}-teams`, `league/${lk}/teams`);
    const tks = [...new Set(findAll(teams?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t).team_key).filter(Boolean))];
    for (const tk of tks) await get(`roster-${tk}`, `team/${tk}/roster;week=${WEEK}/players/stats;type=week;week=${WEEK}`);
    note(`  ${lk}: ${tks.length} rosters`);
  }
  // Probe every non-fantasy game on the account for groups (Survival, Pick'em, ...).
  const gameList = findAll(games?.fantasy_content ?? {}, 'game').map((g) => deepCollect(g)).filter((g) => g.game_key);
  saveRaw('games-parsed', gameList);
  for (const g of gameList) {
    if (String(g.season) !== String(SEASON) || g.code === 'nfl' || String(g.game_key) === SURVIVAL_GAME_KEY) continue;
    note(`probe game ${g.game_key} code=${g.code} name=${g.name} type=${g.type}`);
    const gr = await get(`game-${g.game_key}-groups`, `users;use_login=1/games;game_keys=${g.game_key}/groups`);
    const groups = findAll(gr?.fantasy_content ?? {}, 'group').map((x) => deepCollect(x)).filter((x) => x.group_key);
    for (const grp of groups) {
      await get(`group-${grp.group_key}-standings`, `group/${grp.group_key}/standings`);
      const tm = await get(`group-${grp.group_key}-teams`, `group/${grp.group_key}/teams`);
      // my entry's weekly picks: the endpoint is undocumented, so try the likely shapes and keep whichever answers
      const mine = findAll(tm?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t)).find((t) => t.is_owned_by_current_login === true || t.is_owned_by_current_login === 1 || t.is_owned_by_current_login === '1');
      if (mine?.team_key) {
        await get(`pickem-${mine.team_key}-picks-a`, `team/${mine.team_key}/picks;week=${WEEK}`);
        await get(`pickem-${mine.team_key}-picks-b`, `group/${grp.group_key}/teams;team_keys=${mine.team_key}/picks;week=${WEEK}`);
      }
    }
    if (!groups.length) {
      await get(`game-${g.game_key}-leagues`, `users;use_login=1/games;game_keys=${g.game_key}/leagues`);
      await get(`game-${g.game_key}-teams`, `users;use_login=1/games;game_keys=${g.game_key}/teams`);
    }
  }
}

// ---------------------------------------------------------------- parse
async function parseAll() {
  const { findAll, deepCollect } = await import('../../agents/lib/yahoo.js');
  const body = (n) => loadRaw(n)?.body ?? null;
  const num = (v) => (v == null || v === '' ? null : Number(v));
  const first = (node, key) => findAll(node ?? {}, key)[0];
  const seasonStart = Date.UTC(SEASON, 8, 8); // Tue 2026-09-08 00:00 UTC (week 1 anchor; see src/lib/constants.js)
  const wkStart = seasonStart + (WEEK - 1) * 7 * 864e5, wkEnd = wkStart + 7 * 864e5;
  const out = { schema: 'yahoo_week_archive_v1', season: SEASON, week: WEEK, built_at: new Date().toISOString(), leagues: [], other_games: [], notes: [] };
  const myTeams = findAll(body('nfl-my-teams')?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t)).filter((t) => t.team_key);
  const leagueKeys = [...new Set(myTeams.map((t) => t.team_key.split('.t.')[0]))];
  for (const lk of leagueKeys) {
    const settings = deepCollect((body(`league-${lk}-settings`)?.fantasy_content?.league ?? [])[0] ?? {});
    const L = { league_key: lk, name: settings.name, num_teams: num(settings.num_teams), scoring_type: settings.scoring_type, url: settings.url,
      my_team_key: myTeams.find((t) => t.team_key.startsWith(lk + '.'))?.team_key, standings: [], matchups: [], rosters: [], transactions: [] };
    for (const t of findAll(body(`league-${lk}-standings`)?.fantasy_content ?? {}, 'team')) {
      const f = deepCollect(t), ts = first(t, 'team_standings') ?? {}, ot = first(ts, 'outcome_totals') ?? {};
      if (!f.team_key) continue;
      L.standings.push({ team_key: f.team_key, team: f.name, manager: first(t, 'nickname') ?? null, rank: num(ts.rank), wins: num(ot.wins), losses: num(ot.losses), ties: num(ot.ties),
        points_for: num(ts.points_for), points_against: num(ts.points_against), streak: first(ts, 'streak') ?? null });
    }
    L.standings.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    for (const m of findAll(body(`league-${lk}-scoreboard`)?.fantasy_content ?? {}, 'matchup')) {
      const mm = Array.isArray(m) ? Object.assign({}, ...m.filter((x) => x && typeof x === 'object' && !Array.isArray(x))) : m;
      const teams = findAll(m, 'team').map((t) => ({ team_key: deepCollect(t).team_key, team: deepCollect(t).name,
        points: num(first(t, 'team_points')?.total), projected: num(first(t, 'team_projected_points')?.total), win_probability: num(deepCollect(t).win_probability) }));
      L.matchups.push({ week: num(mm.week) ?? WEEK, status: mm.status, is_playoffs: mm.is_playoffs, is_tied: mm.is_tied, winner_team_key: mm.winner_team_key, teams });
    }
    const standKeys = L.standings.map((s) => s.team_key);
    for (const tk of standKeys) {
      const r = body(`roster-${tk}`); if (!r) continue;
      const players = findAll(r.fantasy_content ?? {}, 'player').map((p) => {
        const info = deepCollect(Array.isArray(p) ? p[0] : p);
        const stats = {}; for (const s of findAll(first(p, 'player_stats') ?? {}, 'stat')) { const f = deepCollect(s); if (f.stat_id != null) stats[f.stat_id] = f.value; }
        return { player_key: info.player_key, name: info.name || info.full, nfl_team: String(info.editorial_team_abbr || '').toUpperCase(), position: info.display_position,
          slot: deepCollect(first(p, 'selected_position') ?? {}).position ?? null, points: num(first(p, 'player_points')?.total), status: info.status || null, stats };
      }).filter((p) => p.player_key);
      L.rosters.push({ team_key: tk, team: L.standings.find((s) => s.team_key === tk)?.team, players,
        starters_points: players.filter((p) => p.slot && !['BN', 'IR', 'IR+'].includes(p.slot)).reduce((a, p) => a + (p.points || 0), 0),
        bench_points: players.filter((p) => p.slot === 'BN').reduce((a, p) => a + (p.points || 0), 0) });
    }
    for (const t of findAll(body(`league-${lk}-transactions`)?.fantasy_content ?? {}, 'transaction')) {
      const f = deepCollect(Array.isArray(t) ? t[0] : t); const ts = Number(f.timestamp) * 1000;
      if (!ts || ts < wkStart || ts >= wkEnd) continue;
      L.transactions.push({ type: f.type, status: f.status, at: new Date(ts).toISOString(),
        players: findAll(t, 'player').map((p) => { const i = deepCollect(Array.isArray(p) ? p[0] : p); const td = deepCollect(first(p, 'transaction_data') ?? {});
          return { name: i.name || i.full, nfl_team: String(i.editorial_team_abbr || '').toUpperCase(), action: td.type, from: td.source_team_name || td.source_type, to: td.destination_team_name || td.destination_type }; }) });
    }
    out.leagues.push(L);
  }
  for (const g of loadRaw('games-parsed') ?? []) {
    if (String(g.season) !== String(SEASON) || g.code === 'nfl' || String(g.game_key) === SURVIVAL_GAME_KEY) continue;
    const groups = findAll(body(`game-${g.game_key}-groups`)?.fantasy_content ?? {}, 'group').map((x) => deepCollect(x)).filter((x) => x.group_key);
    const isNflPickem = g.code === 'nflp';
    const og = { game_key: g.game_key, code: g.code, name: g.name, type: g.type, groups: groups.map((x) => ({ group_key: x.group_key, name: x.name, num_teams: num(x.num_teams),
      standings_raw: `raw/group-${slug(x.group_key)}-standings.json`, teams_raw: `raw/group-${slug(x.group_key)}-teams.json` })),
      parsed: isNflPickem, note: isNflPickem ? 'Standings + weekly lines parsed; pool capture written to data/pickem/.' : 'Not an NFL game (raw saved only).' };
    out.other_games.push(og);
    if (!isNflPickem) continue;
    for (const grp of groups) {
      const st = body(`group-${grp.group_key}-standings`)?.fantasy_content?.group;
      const teamsBody = body(`group-${grp.group_key}-teams`);
      const mineKey = findAll(teamsBody?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t)).find((t) => [true, 1, '1'].includes(t.is_owned_by_current_login))?.team_key;
      const rows = (st?.standings ?? []).map((x) => x.team).filter(Boolean).map((t) => {
        const weeks = {}; for (const w of t.weekly_performance_collection ?? []) { const p = w.weekly_performance; if (p) weeks[String(p.week)] = { pts: num(p.week_points), wins: num(p.week_wins), losses: num(p.week_losses), rank: num(p.week_rank), dropped: !!p.dropped }; }
        return { rank: num(t.rank), team_key: t.team_key, name: t.team_name, pts: num(t.total_points), avg: num(t.average_points), wins: num(t.total_wins), losses: num(t.total_losses), weeks };
      }).filter((r, i, all) => !r.team_key || all.findIndex((o) => o.team_key === r.team_key) === i) // the API can list the owner's team twice
        .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
      const me = rows.find((r) => r.team_key === mineKey);
      const wk = me?.weeks?.[String(WEEK)] ?? {};
      const picksRaw = ['a', 'b'].map((k) => loadRaw(`pickem-${mineKey}-picks-${k}`)).find((r) => r && !r.error);
      const cap = { schema: 'pickem_pool_capture_v1', pool_id: `yahoo-${grp.group_key}`, pool_name: grp.name, platform: 'Yahoo', url: grp.url, week: WEEK, season: SEASON,
        captured_at: new Date().toISOString(), captured_by: 'scripts/archive/yahoo-week-archive.mjs (Yahoo Fantasy API, read-only)', entrants: num(grp.num_teams),
        scoring: 'confidence (Yahoo Pro Football Pick\'em); a dropped week does not count toward the season total',
        week_status: num(st?.current_week) === WEEK ? 'may be pre-final (Yahoo finalizes the week on Tuesday; the Thursday run refreshes)' : 'final',
        andy: me ? { entry: me.name, weekly_pts: wk.pts, weekly_rank: wk.rank, week_wins: wk.wins, week_losses: wk.losses, week_dropped: wk.dropped,
          ytd: me.pts, overall_rank: me.rank, by_week: Object.fromEntries(Object.entries(me.weeks).map(([k, v]) => [k, v.pts])), picks: [],
          picks_note: picksRaw ? 'pick endpoint answered; raw saved (parser pending)' : 'Yahoo API returned no per-game picks; the Tuesday browser capture adds them' } : null,
        season_leader: rows[0] ? `${rows[0].name} ${rows[0].pts}` : null,
        overall_standings: rows.map((r) => ({ rank: r.rank, name: r.name, pts: r.pts, wins: r.wins, losses: r.losses, week_pts: r.weeks[String(WEEK)]?.pts ?? null, week_rank: r.weeks[String(WEEK)]?.rank ?? null })) };
      const pf = path.join(ROOT, 'data', 'pickem', `yahoo-${slug(grp.group_key.replace(/\./g, '-'))}-${SEASON}-w${String(WEEK).padStart(2, '0')}.json`);
      // keep per-game picks added by the Tuesday browser capture (the API returns none) so a later run never wipes them
      const prev = (() => { try { return JSON.parse(fs.readFileSync(pf, 'utf8')); } catch { return null; } })();
      if (cap.andy && !cap.andy.picks.length && prev?.andy?.picks?.length) {
        for (const k of ['picks', 'picks_note', 'tiebreakers', 'dropped_pts']) if (prev.andy[k] !== undefined) cap.andy[k] = prev.andy[k];
      }
      fs.writeFileSync(pf, JSON.stringify(cap, null, 1));
      og.pool_capture = path.relative(ROOT, pf).split(path.sep).join('/');
    }
  }
  if (!loadRaw('games')) out.notes.push('Yahoo games list was not fetched (no raw/games.json) - nothing to parse.');
  else if (!out.other_games.length) out.notes.push('No other 2026 Yahoo games (e.g. Pick\'em) were returned by the API for this account.');
  out.notes.push(...log);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'yahoo-week.json'), JSON.stringify(out, null, 1));
  console.log(`parsed: ${out.leagues.length} leagues, ${out.leagues.reduce((a, l) => a + l.rosters.length, 0)} rosters, other games: ${out.other_games.map((g) => g.code).join(',') || 'none'}`);
}

function survivor() {
  // --survivor-copy-only (backfill): never re-run the sync for a past week; it would overwrite that week's stored history with today's state
  if (has('--survivor-copy-only')) note('survivor: copy-only (backfill)');
  else { const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'sync-yahoo-survivor.mjs'), '--week', String(WEEK)], { cwd: ROOT, encoding: 'utf8' }); note(`survivor sync exit ${r.status}`); }
  const dst = path.join(OUT, 'survivor'); fs.mkdirSync(dst, { recursive: true });
  for (const f of [`history/week-${WEEK}-picks.json`, `YAHOO_SURVIVOR_WEEK_${WEEK}_REPORT.md`, 'yahoo-survivor-entrants-2026.json', 'yahoo-competitor-profiles.json']) {
    const src = path.join(ROOT, 'data', 'survivor', f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dst, path.basename(f))); else note(`survivor file missing: ${f}`);
  }
}

if (!has('--from-raw')) await fetchAll();
if (!has('--skip-survivor') && !has('--from-raw')) survivor();
await parseAll();
