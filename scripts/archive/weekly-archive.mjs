#!/usr/bin/env node
/**
 * weekly-archive.mjs — end-of-week capture for NFL_Dashboard (betting + fantasy + contests).
 *
 *   node scripts/archive/weekly-archive.mjs                # week = the NFL week that ended in the last 72h
 *   node scripts/archive/weekly-archive.mjs --week 4       # explicit week
 *   flags: --no-vault (stage notes only) --skip-yahoo --skip-espn --vault-only (rebuild notes from what is archived)
 *          --refresh (allow a past week to regenerate its game summaries and betting review)
 *
 * Steps (each is recorded in data/archive/<season>/week-NN/manifest.json; one failing step never stops the rest):
 *   1 espn      cache every game summary for the week; EXIT 75 (retry later) unless all games are final
 *   2 betting   team_postmortem.py, espn_week.py, grade_week.py --apply (settles only tickets the box score fully decides;
 *               backs the ledger up first; round robins / pushes / unsupported markets stay open and are listed), weekly_review.py
 *   3 yahoo     scripts/archive/yahoo-week-archive.mjs (fantasy leagues, survivor, other-game probe)
 *   4 pools     copy this week's pick'em captures from data/pickem/ (CBS/SimplySportsware/Yahoo)
 *   5 notes     build Obsidian notes -> data/archive/<season>/week-NN/vault/ (staging, committed)
 *   6 vault     write the staged notes into VAULT_DIR/NFL/<season>/Week NN/ via agents/lib/vaultWriter.js
 *   7 rollups   season CSVs in data/archive/<season>/season/
 * Guardrails: read-only APIs, local files only, no Supabase writes (the validator only GETs game_results/player_stats with the anon key), no paid models. The only ledger write is grade_week.py --apply
 * (box-score facts; never payouts it cannot see — those stay open for Andy).
 * Run natively on Windows (Task Scheduler) — never write the vault through a Linux VM mount.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getNFLWeekInfo } from '../../src/lib/constants.js';
import { writeVaultNote } from '../../agents/lib/vaultWriter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const SEASON = Number(arg('--season', '2026'));
// 72h look-back: Mon 11:30 PM PT, Tue 6 AM and Thu 6 AM all resolve to the week that just ended.
const AUTO_WEEK = getNFLWeekInfo(new Date(Date.now() - 72 * 3600e3)).week;
const WEEK = Number(arg('--week')) || AUTO_WEEK;
// A past week (backfill) never rewrites outputs that already exist (published post-mortems, settled reviews).
const BACKFILL = WEEK < AUTO_WEEK && !has('--refresh');
const WK = String(WEEK).padStart(2, '0');
const AR = path.join(ROOT, 'data', 'archive', String(SEASON), `week-${WK}`);
const STAGE = path.join(AR, 'vault');
const VAULT_DIR = process.env.VAULT_DIR || '';
const VAULT_BASE = `NFL/${SEASON}/Week ${WK}`;
fs.mkdirSync(AR, { recursive: true });
const MANIFEST = path.join(AR, 'manifest.json');
// A notes-only rebuild (--vault-only, e.g. from the Tuesday pool capture) keeps the last full run's step record.
const prior = has('--vault-only') ? (() => { try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch { return null; } })() : null;
const manifest = { schema: 'weekly_archive_manifest_v1', season: SEASON, week: WEEK, started_at: new Date().toISOString(), host: process.platform,
  steps: { ...(prior?.steps || {}) }, ...(prior ? { last_full_run: prior.last_full_run || prior.started_at, mode: 'vault-only rebuild' } : {}) };
const step = async (name, fn) => {
  const t0 = Date.now();
  try { const r = await fn(); manifest.steps[name] = { ok: true, ms: Date.now() - t0, ...(r || {}) }; }
  catch (e) { manifest.steps[name] = { ok: false, ms: Date.now() - t0, error: String(e?.stack || e).slice(0, 2000) }; console.error(`[${name}] FAILED: ${e.message}`); }
  console.log(`[${name}] ${manifest.steps[name].ok ? 'ok' : 'FAILED'} (${manifest.steps[name].ms} ms)`);
};
const readJson = (p, d = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const safeName = (s) => String(s).replace(/[\\/:*?"<>|]/g, '-');

// --------------------------------------------------------------- python finder (same order as run-roster-vet.mjs)
function findPython() {
  const la = process.env.LOCALAPPDATA;
  const c = [process.env.PYTHON && [process.env.PYTHON], ['python3'], ['python'], ['py', '-3'],
    la && [path.join(la, 'Python', 'pythoncore-3.14-64', 'python.exe')], la && [path.join(la, 'Python', 'bin', 'python.exe')],
    ['C:\\Users\\andre\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe']].filter(Boolean);
  for (const [cmd, ...pre] of c) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', timeout: 20000 });
    if (r.status === 0 && r.stdout.trim() === '3') return [cmd, ...pre];
  }
  return null;
}
const PY = findPython();
const runPy = (script, args, outFile) => {
  if (!PY) throw new Error('No Python 3 found (set PYTHON=...)');
  const r = spawnSync(PY[0], [...PY.slice(1), path.join(ROOT, script), ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, maxBuffer: 64e6 });
  if (outFile) fs.writeFileSync(outFile, `${r.stdout || ''}${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''}`);
  if (r.status !== 0) throw new Error(`${script} exit ${r.status}: ${(r.stderr || '').slice(-400)}`);
  return (r.stdout || '').trim().split('\n').slice(-2).join(' | ');
};

// grade_week output -> [{ticket, reason}] for anything it left open
function leftOpen(file) {
  if (!fs.existsSync(file)) return [];
  const out = []; let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const h = line.match(/^== (\S+)\s+#?(\S*)\s+(\S+)/); if (h) { cur = { id: h[1], ticket: h[2], book: h[3], open_legs: [] }; continue; }
    if (cur && /^\s+\?{3,}/.test(line)) cur.open_legs.push(line.trim().replace(/^\?+\s*/, ''));
    if (cur && /->\s*stays open/.test(line)) out.push(cur);
  }
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/unresolved: \('([^']+)', '([^']+)', '([^']+)'\)/g)) if (!out.some((o) => o.id === m[1])) out.push({ id: m[1], open_legs: [`${m[2]} -> ${m[3]}`] });
  return out;
}

// --------------------------------------------------------------- 1 espn
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
async function espn() {
  const sb = await (await fetch(`${ESPN}/scoreboard?seasontype=2&week=${WEEK}&dates=${SEASON}`)).json();
  const events = sb.events || [];
  if (!events.length) throw new Error('ESPN scoreboard returned no events');
  const notFinal = events.filter((e) => e.status?.type?.name !== 'STATUS_FINAL').map((e) => `${e.shortName} ${e.status?.type?.name}`);
  const dir = path.join(ROOT, 'data', 'fantasy', 'boxscores'); fs.mkdirSync(dir, { recursive: true });
  let cached = 0;
  for (const e of events) {
    if (e.status?.type?.name !== 'STATUS_FINAL') continue;
    const r = await fetch(`${ESPN}/summary?event=${e.id}`); if (!r.ok) continue;
    const txt = await r.text(); JSON.parse(txt); fs.writeFileSync(path.join(dir, `espn-${e.id}.json`), txt); cached++;
  }
  return { games: events.length, cached, not_final: notFinal };
}

// --------------------------------------------------------------- 2 betting / team data (python; dry-run grading only)
async function betting() {
  const d = path.join(AR, 'betting'); fs.mkdirSync(d, { recursive: true });
  const r = {};
  r.team_postmortem = runPy('reports/analysis/season/claude/scripts/team_postmortem.py', ['--week', String(WEEK)], path.join(d, 'team_postmortem.log'));
  const exists = (p) => fs.existsSync(path.join(ROOT, p));
  if (BACKFILL && exists(`reports/bets/season-recap/w${WEEK}gamesum.json`)) r.espn_week = 'skipped (backfill; w' + WEEK + 'gamesum.json exists)';
  else r.espn_week = runPy('reports/bets/season-recap/scripts/espn_week.py', ['--week', String(WEEK)], path.join(d, 'espn_week.log'));
  // --fill-dead-legs also writes the box-score result onto legs left PENDING inside already-settled tickets (statuses only)
  try { r.grade_apply = runPy('reports/analysis/season/claude/scripts/grade_week.py', ['--week', String(WEEK), '--apply', '--fill-dead-legs'], path.join(d, 'grade-apply.txt')); } catch (e) { r.grade_apply = `error: ${e.message}`; }
  r.left_open = leftOpen(path.join(d, 'grade-apply.txt'));
  if (BACKFILL && exists(`reports/analysis/season/claude/out/week-${WK}.json`)) r.weekly_review = 'skipped (backfill; week review exists)';
  else { try { r.weekly_review = runPy('reports/analysis/season/claude/scripts/weekly_review.py', ['--week', String(WEEK)], path.join(d, 'weekly_review.log')); } catch (e) { r.weekly_review = `error: ${e.message}`; } }
  // canonical player-game table (ESPN athlete ids) + post-mortem data validation (read-only; uses the cached Supabase snapshot)
  try { r.player_games = runPy('reports/analysis/season/claude/scripts/build_player_games.py', ['--week', String(WEEK)], path.join(d, 'player_games.log')); } catch (e) { r.player_games = `error: ${e.message}`; }
  try { r.validation = runPy('reports/analysis/season/claude/scripts/validate_postmortem_data.py', ['--weeks', `1-${WEEK}`, '--fetch-supabase'], path.join(d, 'validation.log')); } catch (e) { r.validation = `ERRORS FOUND (see out/data-validation.md): ${e.message.slice(0, 200)}`; }
  for (const f of [`week-${WK}-teams.json`, `week-${WK}-teams.csv`, `week-${WK}-teams-summary.md`, `week-${WK}-summary.md`, `week-${WK}.json`, 'data-validation.md']) {
    const src = path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'out', f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(d, f));
  }
  for (const f of [`w${WEEK}gamesum.json`, `w${WEEK}expert-commentary.json`]) {
    const src = path.join(ROOT, 'reports', 'bets', 'season-recap', f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(d, f));
  }
  return r;
}

// --------------------------------------------------------------- 3 yahoo
async function yahoo() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'archive', 'yahoo-week-archive.mjs'), '--week', String(WEEK), '--season', String(SEASON), ...(BACKFILL ? ['--survivor-copy-only'] : [])], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6 });
  fs.writeFileSync(path.join(AR, 'yahoo-archive.log'), `${r.stdout}\n${r.stderr}`);
  if (r.status !== 0) throw new Error(`yahoo-week-archive exit ${r.status}: ${(r.stderr || '').slice(-400)}`);
  return { summary: (r.stdout || '').trim().split('\n').pop() };
}

// --------------------------------------------------------------- 3b drafts (fetch once; re-parse each run so points-to-date stays current)
async function drafts() {
  const dir = path.join(ROOT, 'data', 'archive', String(SEASON), 'drafts');
  const haveRaw = fs.existsSync(path.join(dir, 'raw', 'leagues.json'));
  const args = [path.join(ROOT, 'scripts', 'archive', 'yahoo-draft-results.mjs'), '--season', String(SEASON), ...(haveRaw ? ['--from-raw'] : []), ...(has('--no-vault') ? ['--no-vault'] : [])];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6 });
  fs.writeFileSync(path.join(AR, 'drafts.log'), `${r.stdout}\n${r.stderr}`);
  if (r.status !== 0) throw new Error(`yahoo-draft-results exit ${r.status}: ${(r.stderr || '').slice(-400)}`);
  return { fetched: !haveRaw, summary: (r.stdout || '').trim().split('\n').filter((l) => l.startsWith('parsed')).length + ' leagues' };
}

// --------------------------------------------------------------- 4 pools
async function pools() {
  const src = path.join(ROOT, 'data', 'pickem'), dst = path.join(AR, 'pools'); fs.mkdirSync(dst, { recursive: true });
  const re = new RegExp(`-${SEASON}-w${WK}(?:[^0-9].*)?\\.json$`);
  // only pool captures (schema pickem_pool_capture_v1), not the picks/plan/leans/odds files
  const files = fs.readdirSync(src).filter((f) => re.test(f) && !f.includes('.bak') && readJson(path.join(src, f))?.schema === 'pickem_pool_capture_v1');
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dst, f));
  return { files };
}

// --------------------------------------------------------------- 5 notes
const yamlVal = (v) => (v == null ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : Array.isArray(v) ? `[${v.map(yamlVal).join(', ')}]` : JSON.stringify(String(v)));
function fm(fields, { title, type, sensitivity = 'green', tags = [] }) {
  const now = new Date().toISOString();
  const base = { sensitivity, owner_project: 'nfl-dashboard', source_system: 'weekly-archive', source_type: type, canonical_status: 'generated', title, created: now, modified: now,
    season: SEASON, week: WEEK, type, tags: ['nfl', `season-${SEASON}`, `week-${WK}`, `nfl/${type}`, ...tags] };
  const BARE = new Set(['sensitivity', 'owner_project', 'source_system', 'source_type', 'canonical_status']); // match the vault's existing notes
  return `---\n${Object.entries({ ...base, ...fields }).map(([k, v]) => `${k}: ${BARE.has(k) ? v : yamlVal(v)}`).join('\n')}\n---\n`;
}
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '/')).join(' | ')} |`).join('\n')}\n`;
const sgn = (x) => (x == null ? '' : x > 0 ? `+${x}` : `${x}`);
const gameName = (a, h) => `${a} @ ${h}`;

function buildNotes() {
  try { fs.rmSync(STAGE, { recursive: true, force: true }); } catch { /* no delete permission: files are overwritten below */ }
  const notes = [];
  const add = (rp, text) => { notes.push(rp); const p = path.join(STAGE, rp); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
  const teams = readJson(path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'out', `week-${WK}-teams.json`), { rows: [] }).rows;
  const gsum = readJson(path.join(ROOT, 'reports', 'bets', 'season-recap', `w${WEEK}gamesum.json`), []);
  const exp = readJson(path.join(ROOT, 'reports', 'bets', 'season-recap', `w${WEEK}expert-commentary.json`), null);
  const yw = readJson(path.join(AR, 'yahoo', 'yahoo-week.json'), null);
  const W = readJson(path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json'), []);
  const byTeam = Object.fromEntries(teams.map((r) => [r.team, r]));

  // games
  for (const g of gsum) {
    const key = `${g.away}@${g.home}`, a = byTeam[g.away] || {}, h = byTeam[g.home] || {};
    const e = exp?.games?.[key];
    let md = fm({ game: key, away: g.away, home: g.home, away_pts: g.score[0], home_pts: g.score[1], line: g.espn_line?.details, total: g.espn_line?.ou,
      ats_winner: a.ats === 'W' ? g.away : h.ats === 'W' ? g.home : 'push', ou: h.ou ?? null, event_id: g.event }, { title: `${gameName(g.away, g.home)} — Week ${WEEK}`, type: 'game-week', tags: [`team/${g.away}`, `team/${g.home}`] });
    md += `# ${g.away} ${g.score[0]} @ ${g.home} ${g.score[1]}\n\nWeek [[${VAULT_BASE}/Week ${WK} Index|${WEEK}]] · line ${g.espn_line?.details ?? 'n/a'} · total ${g.espn_line?.ou ?? 'n/a'} (ESPN/DraftKings near-close) · teams [[${VAULT_BASE}/Teams/${g.away}|${g.away}]] vs [[${VAULT_BASE}/Teams/${g.home}|${g.home}]]\n\n`;
    md += table(['', ...g.ls[0].map((_, i) => (i < 4 ? `Q${i + 1}` : 'OT')), 'F'], [[g.away, ...g.ls[0], g.score[0]], [g.home, ...g.ls[1], g.score[1]]]) + '\n';
    md += table(['Team', 'Yds', 'Pass', 'Rush', 'YPP', '3rd', 'RZ', 'TO', 'Sacks taken', 'TOP'], [g.away, g.home].map((t) => [t, g[t]?.yds, g[t]?.pass_, g[t]?.rush, g[t]?.ypp, g[t]?.third, g[t]?.rz, g[t]?.to, g[t]?.sacks, g[t]?.top])) + '\n';
    md += `**Leaders**\n\n${[g.away, g.home].map((t) => `- ${t}: ${g[t]?.qb ?? ''} · ${g[t]?.rb ?? ''} · ${g[t]?.wr ?? ''}`).join('\n')}\n\n`;
    if (e?.takeaways?.length) md += `## Expert post-game view\n\n${e.takeaways.map((t) => `- **${exp.sources[t.src]?.outlet ?? t.src}${t.author ? ` (${t.author})` : ''}:** ${t.text} [link](${exp.sources[t.src]?.url ?? ''})`).join('\n')}\n\n_Paraphrased and box-score checked; see the commentary JSON for rejected claims._\n\n`;
    md += `## Scoring plays\n\n${(g.scoring || []).map((s) => `- ${s}`).join('\n')}\n`;
    add(`Games/${gameName(g.away, g.home)}.md`, md);
  }
  // teams
  for (const r of teams) {
    const s = r.season_thru_week || {};
    const g = gsum.find((x) => x.away === r.team || x.home === r.team);
    let md = fm({ team: r.team, opponent: r.opp, home_away: r.home_away, result: r.su, pts: r.pts, opp_pts: r.opp_pts, line: r.line, ats: r.ats, cover_margin: r.cover_margin, ou: r.ou,
      pts_vs_implied: r.implied_pts == null ? null : +(r.pts - r.implied_pts).toFixed(1), ypp: r.ypp, opp_ypp: r.opp_ypp, ypp_diff: r.ypp_diff, to_margin: r.to_margin, third_pct: r.third_pct,
      rz_td_pct: r.rz_td_pct, pts_per_drive: r.pts_per_drive, sacks_made: r.sacks_made, sacks_taken: r.sacks_taken, record: r.record_after, season_ats: s.ats, season_ou: s.ou, season_pt_diff: s.pt_diff,
      flags: r.flags || [] }, { title: `${r.team} — Week ${WEEK}`, type: 'team-week', tags: [`team/${r.team}`] });
    md += `# ${r.team} ${r.su} ${r.pts}–${r.opp_pts} ${r.home_away === 'away' ? '@' : 'vs'} ${r.opp} (Week ${WEEK})\n\nTeam page: [[NFL/Teams/${r.team}|${r.team}]] · game: [[${VAULT_BASE}/Games/${g ? gameName(g.away, g.home) : ''}|${g ? gameName(g.away, g.home) : ''}]]\n\n`;
    md += table(['Line', 'ATS', 'Pts vs implied', 'YPP (opp)', 'TO±', '3rd', 'RZ', 'Pts/drive', 'Sacks for/against'],
      [[sgn(r.line), `${r.ats} (${sgn(r.cover_margin)})`, r.implied_pts == null ? '' : sgn(+(r.pts - r.implied_pts).toFixed(1)), `${r.ypp} (${r.opp_ypp})`, sgn(r.to_margin), r.third_down, r.red_zone, r.pts_per_drive, `${r.sacks_made}/${r.sacks_taken}`]]) + '\n';
    md += `**Season through Week ${WEEK}:** SU ${s.su} · ATS ${s.ats} · O/U ${s.ou} · PPG ${s.ppg} / allowed ${s.papg} · YPP ${s.ypp_for} / allowed ${s.ypp_against} · TO margin ${sgn(s.to_margin)}\n\n`;
    md += `**Key lines:** ${r.qb_line} · ${r.top_rusher} · ${r.top_receiver}\n\n`;
    if (r.flags?.length) md += `**Flags (mechanical):** ${r.flags.join('; ')}\n`;
    add(`Teams/${r.team}.md`, md);
  }
  // fantasy
  for (const L of yw?.leagues || []) {
    const me = L.my_team_key, myRoster = L.rosters.find((r) => r.team_key === me);
    const myM = L.matchups.find((m) => m.teams.some((t) => t.team_key === me));
    let md = fm({ league: L.name, league_key: L.league_key, my_team: myRoster?.team, my_points: myM?.teams.find((t) => t.team_key === me)?.points ?? null,
      opp_points: myM?.teams.find((t) => t.team_key !== me)?.points ?? null, my_rank: L.standings.find((s) => s.team_key === me)?.rank ?? null },
      { title: `${L.name} — Week ${WEEK}`, type: 'fantasy-league-week', tags: ['fantasy'] });
    md += `# ${L.name} — Week ${WEEK}\n\n## Matchups\n\n${table(['Team', 'Pts', 'Proj', '', 'Team', 'Pts', 'Proj'], L.matchups.map((m) => [m.teams[0]?.team, m.teams[0]?.points, m.teams[0]?.projected, 'vs', m.teams[1]?.team, m.teams[1]?.points, m.teams[1]?.projected]))}\n`;
    md += `## Standings\n\n${table(['Rank', 'Team', 'W-L-T', 'PF', 'PA'], L.standings.map((s) => [s.rank, s.team_key === me ? `**${s.team}**` : s.team, `${s.wins}-${s.losses}-${s.ties}`, s.points_for, s.points_against]))}\n`;
    if (myRoster) md += `## My lineup (${myRoster.team})\n\n${table(['Slot', 'Player', 'NFL', 'Pos', 'Pts'], myRoster.players.map((p) => [p.slot, p.name, p.nfl_team, p.position, p.points]))}\nStarters ${myRoster.starters_points.toFixed(2)} · bench ${myRoster.bench_points.toFixed(2)}\n\n`;
    const top = L.rosters.flatMap((r) => r.players.map((p) => ({ ...p, team: r.team }))).filter((p) => p.points != null).sort((a, b) => b.points - a.points).slice(0, 15);
    md += `## Top rostered scorers\n\n${table(['Player', 'NFL', 'Pos', 'Pts', 'Fantasy team', 'Slot'], top.map((p) => [p.name, p.nfl_team, p.position, p.points, p.team, p.slot]))}\n`;
    md += `## Transactions this week\n\n${L.transactions.length ? L.transactions.map((t) => `- ${t.at.slice(0, 10)} ${t.type}: ${t.players.map((p) => `${p.action} ${p.name} (${p.nfl_team}) ${p.from ?? ''}→${p.to ?? ''}`).join('; ')}`).join('\n') : '_none_'}\n`;
    add(`Fantasy/${safeName(L.name)}.md`, md);
  }
  // contests: survivor + pick'em pools
  {
    const poolDir = path.join(AR, 'pools'); const caps = fs.existsSync(poolDir) ? fs.readdirSync(poolDir).map((f) => readJson(path.join(poolDir, f))).filter(Boolean) : [];
    const surv = path.join(AR, 'yahoo', 'survivor', `YAHOO_SURVIVOR_WEEK_${WEEK}_REPORT.md`);
    let md = fm({ pools: caps.map((c) => c.pool_name) }, { title: `Contests — Week ${WEEK}`, type: 'contests-week', tags: ['pickem', 'survivor'] });
    md += `# Contests — Week ${WEEK}\n\n## Pick'em pools\n\n`;
    md += caps.length ? table(['Pool', 'Platform', 'Week pts', 'Week rank', 'Season', 'Season rank', 'Leader'], caps.map((c) => {
      const a = c.andy || {}, wk = a[`week${WEEK}`] || a.week || {};
      return [c.pool_name, c.platform, a.weekly_pts ?? wk.pts, a.weekly_rank ?? wk.rank_row, a.ytd ?? a.season?.pts, a.overall_rank ?? a.season?.rank_row, c.season_leader ?? c.leaders?.season ?? ''];
    })) : '_No pool captures yet for this week (the Tuesday capture task adds them; the Thursday run picks them up)._\n';
    for (const c of caps) md += `\n### ${c.pool_name} — my picks\n\n${table(['Game', 'Pick', 'Conf', 'Winner', 'Result'], (c.andy?.picks || []).map((p) => [p.game, p.pick, p.confidence ?? '', p.winner, p.correct ? '✓' : '✗']))}`;
    const ow = (yw?.other_games || []).map((g) => `- ${g.name} (${g.code}): ${g.groups.length} group(s) — raw saved, ${g.parsed ? 'parsed' : 'not parsed yet'}`).join('\n');
    if (ow) md += `\n### Other Yahoo games (API probe)\n\n${ow}\n`;
    md += `\n## Survivor\n\n${fs.existsSync(surv) ? fs.readFileSync(surv, 'utf8').replace(/^# .*\n/, '') : '_No survivor report archived for this week._\n'}`;
    add('Contests.md', md);
  }
  // betting (personal money -> yellow: local-only per the vault sensitivity rules)
  {
    const wk = W.filter((w) => w.week === WEEK && w.game !== 'NFL Futures');
    const cash = wk.filter((w) => !['promo_credit', 'free_bet'].includes(w.funding_type));
    const risk = cash.reduce((a, w) => a + (w.stake_usd || 0), 0), net = wk.reduce((a, w) => a + (w.profit_usd || 0), 0);
    let md = fm({ tickets: wk.length, cash_risk: +risk.toFixed(2), net: +net.toFixed(2), open: wk.filter((w) => w.status !== 'SETTLED').length },
      { title: `Betting — Week ${WEEK}`, type: 'betting-week', sensitivity: 'yellow', tags: ['betting'] });
    md += `# Betting — Week ${WEEK}\n\n${wk.length} tickets · cash risk $${risk.toFixed(2)} · net **${net >= 0 ? '+' : '−'}$${Math.abs(net).toFixed(2)}** · open ${wk.filter((w) => w.status !== 'SETTLED').length}\n\n`;
    md += table(['Book', 'Ticket', 'Title', 'Stake', 'Odds', 'Result', 'P/L'], wk.map((w) => [w.book, w.ticket_number ?? '', String(w.game_title || '').slice(0, 70), w.stake_usd, w.odds_american ?? '', w.result ?? w.status, w.profit_usd ?? '']));
    const lo = leftOpen(path.join(AR, 'betting', 'grade-apply.txt'));
    if (lo.length) md += `\n## Left open for Andy (box score cannot decide)\n\n${lo.map((o) => `- ${o.book ?? ''} ${o.ticket ?? ''} \`${o.id}\`: ${o.open_legs.join('; ') || 'needs the book payout (round robin / push)'}`).join('\n')}\n`;
    md += `\nWeek index: [[${VAULT_BASE}/Week ${WK} Index]] · full analysis in the repo: \`reports/analysis/season/claude/out/week-${WK}-summary.md\`\n`;
    add('Betting.md', md);
  }
  // index
  {
    const fav = teams.filter((r) => (r.line ?? 0) < 0), c = (l, k, v) => l.filter((r) => r[k] === v).length, games = gsum.length;
    const overs = gsum.filter((g) => (byTeam[g.home] || {}).ou === 'O').length;
    let md = fm({ games, favorites_ats: `${c(fav, 'ats', 'W')}-${c(fav, 'ats', 'L')}-${c(fav, 'ats', 'P')}`, overs, unders: gsum.filter((g) => (byTeam[g.home] || {}).ou === 'U').length },
      { title: `NFL ${SEASON} Week ${WEEK}`, type: 'week-index' });
    md += `# NFL ${SEASON} — Week ${WEEK}\n\nFavorites ATS ${c(fav, 'ats', 'W')}-${c(fav, 'ats', 'L')}-${c(fav, 'ats', 'P')} · Overs ${overs} of ${games} · archived ${new Date().toISOString().slice(0, 16)}Z\n\n`;
    md += `## Games\n\n${gsum.map((g) => `- [[${VAULT_BASE}/Games/${gameName(g.away, g.home)}|${g.away} ${g.score[0]} @ ${g.home} ${g.score[1]}]]`).join('\n')}\n\n`;
    md += `## Teams\n\n${teams.map((r) => r.team).sort().map((t) => `[[${VAULT_BASE}/Teams/${t}|${t}]]`).join(' · ')}\n\n`;
    md += `## Fantasy & contests\n\n${(yw?.leagues || []).map((L) => `- [[${VAULT_BASE}/Fantasy/${safeName(L.name)}|${L.name}]]`).join('\n') || '- _Yahoo data not captured this run_'}\n- [[${VAULT_BASE}/Contests|Pick'em & survivor]]\n- [[${VAULT_BASE}/Betting|Betting]]\n\n`;
    md += '## Queries (Dataview)\n\n```dataview\nTABLE week, opponent, result, ats, ou, ypp_diff, to_margin, pts_vs_implied\nFROM "NFL/' + SEASON + '"\nWHERE type = "team-week" AND team = "ATL"\nSORT week ASC\n```\n\n```dataview\nTABLE team, result, ypp_diff, flags\nFROM "NFL/' + SEASON + '"\nWHERE type = "team-week" AND week = ' + WEEK + ' AND contains(string(flags), "despite")\n```\n';
    add(`Week ${WK} Index.md`, md);
  }
  return { notes: notes.length, staged: rel(STAGE) };
}

// --------------------------------------------------------------- 6 vault
async function vault() {
  if (!VAULT_DIR) throw new Error('VAULT_DIR not set');
  if (!fs.existsSync(VAULT_DIR)) throw new Error(`VAULT_DIR missing: ${VAULT_DIR}`);
  if (process.platform === 'linux' && /^(\/sessions|.*[\\/]mnt[\\/])/.test(path.resolve(VAULT_DIR))) throw new Error('refusing to write the vault through a Linux mount (vault CLAUDE.md rule 3); run on Windows');
  const counts = { written: 0, unchanged: 0 };
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(STAGE)) {
    const r = await writeVaultNote(VAULT_DIR, `${VAULT_BASE}/${path.relative(STAGE, f).split(path.sep).join('/')}`, fs.readFileSync(f, 'utf8'));
    counts[r] = (counts[r] || 0) + 1;
  }
  return counts;
}

// --------------------------------------------------------------- 7 rollups
function csv(rows, cols) { const q = (v) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }; return [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n'; }
async function rollups() {
  const sd = path.join(ROOT, 'data', 'archive', String(SEASON), 'season'); fs.mkdirSync(sd, { recursive: true });
  const outDir = path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'out');
  const teamRows = [];
  for (const f of fs.readdirSync(outDir).filter((f) => /^week-\d\d-teams\.json$/.test(f)).sort()) teamRows.push(...(readJson(path.join(outDir, f))?.rows || []));
  const tcols = ['week', 'team', 'opp', 'home_away', 'su', 'pts', 'opp_pts', 'margin', 'line', 'ats', 'cover_margin', 'total', 'ou', 'implied_pts', 'plays', 'yards', 'ypp', 'opp_yards', 'opp_ypp', 'ypp_diff', 'pass_yds', 'rush_yds', 'third_pct', 'rz_td_pct', 'sacks_made', 'sacks_taken', 'giveaways', 'takeaways', 'to_margin', 'def_td', 'top_sec', 'drives', 'td_drives', 'pts_per_drive', 'record_after', 'flags'];
  fs.writeFileSync(path.join(sd, 'team-weeks.csv'), csv(teamRows, tcols));
  const pw = [], mw = [];
  const seasonDir = path.join(ROOT, 'data', 'archive', String(SEASON));
  for (const d of fs.readdirSync(seasonDir).filter((d) => /^week-\d\d$/.test(d)).sort()) {
    const y = readJson(path.join(seasonDir, d, 'yahoo', 'yahoo-week.json')); if (!y) continue;
    for (const L of y.leagues) {
      for (const r of L.rosters) for (const p of r.players) pw.push({ week: y.week, league: L.name, fantasy_team: r.team, mine: r.team_key === L.my_team_key, slot: p.slot, player: p.name, nfl_team: p.nfl_team, position: p.position, points: p.points, player_key: p.player_key });
      for (const m of L.matchups) mw.push({ week: y.week, league: L.name, team_a: m.teams[0]?.team, pts_a: m.teams[0]?.points, proj_a: m.teams[0]?.projected, team_b: m.teams[1]?.team, pts_b: m.teams[1]?.points, proj_b: m.teams[1]?.projected, winner_team_key: m.winner_team_key });
    }
  }
  fs.writeFileSync(path.join(sd, 'fantasy-player-weeks.csv'), csv(pw, ['week', 'league', 'fantasy_team', 'mine', 'slot', 'player', 'nfl_team', 'position', 'points', 'player_key']));
  fs.writeFileSync(path.join(sd, 'fantasy-matchups.csv'), csv(mw, ['week', 'league', 'team_a', 'pts_a', 'proj_a', 'team_b', 'pts_b', 'proj_b', 'winner_team_key']));
  return { team_weeks: teamRows.length, fantasy_player_weeks: pw.length, fantasy_matchups: mw.length };
}

// --------------------------------------------------------------- run
console.log(`weekly-archive: season ${SEASON} week ${WEEK} -> ${rel(AR)}`);
if (!has('--vault-only')) {
  if (!has('--skip-espn')) {
    await step('espn', espn);
    const nf = manifest.steps.espn?.not_final || [];
    if (manifest.steps.espn?.ok && nf.length) {
      manifest.status = 'waiting_for_finals'; manifest.finished_at = new Date().toISOString();
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
      console.log(`not final yet: ${nf.join(', ')} — exit 75 (retry later)`); process.exit(75);
    }
  }
  await step('betting', betting);
  if (!has('--skip-yahoo')) await step('yahoo', yahoo);
  await step('pools', pools);
}
await step('rollups', rollups); // drafts read the season player rows, so build them first
if (!has('--skip-yahoo') && !has('--vault-only')) {
  await step('drafts', drafts);
}
await step('notes', async () => buildNotes());
if (!has('--no-vault')) await step('vault', vault);
await step('rollups', rollups);
manifest.status = Object.values(manifest.steps).every((s) => s.ok) ? 'ok' : 'partial';
manifest.finished_at = new Date().toISOString();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`done: ${manifest.status}`);
process.exit(manifest.status === 'ok' ? 0 : 1);
