#!/usr/bin/env node
/**
 * yahoo-draft-results.mjs — archive every Yahoo fantasy league's draft (read-only API).
 *
 *   node scripts/archive/yahoo-draft-results.mjs [--season 2026] [--history N] [--from-raw] [--no-vault]
 *
 *   fetch : raw responses -> data/archive/<season>/drafts/raw/ (gitignored)
 *   parse : data/archive/<season>/drafts/<league>.json + .csv, drafts-<season>.csv (all leagues),
 *           with each pick's fantasy points to date (from data/archive/<season>/season/fantasy-player-weeks.csv)
 *   notes : data/archive/<season>/drafts/vault/<league>.md -> VAULT_DIR/NFL/<season>/Drafts/ (Windows only)
 * --history N also walks each league's "renew" chain N seasons back (prior years' drafts, same league).
 * A draft never changes after it happens, so already-archived leagues are not re-fetched unless --refresh.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeVaultNote } from '../../agents/lib/vaultWriter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const SEASON = Number(arg('--season', '2026'));
const HISTORY = Number(arg('--history', '0'));
const OUT = path.join(ROOT, 'data', 'archive', String(SEASON), 'drafts');
const RAW = path.join(OUT, 'raw');
const STAGE = path.join(OUT, 'vault');
const slug = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '_');
const safeName = (s) => String(s).replace(/[\\/:*?"<>|]/g, '-').trim();
const saveRaw = (n, o) => { fs.mkdirSync(RAW, { recursive: true }); fs.writeFileSync(path.join(RAW, `${slug(n)}.json`), JSON.stringify(o)); };
const loadRaw = (n) => { const f = path.join(RAW, `${slug(n)}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const num = (v) => (v == null || v === '' ? null : Number(v));
const log = (m) => console.log(m);

async function fetchAll() {
  const { yget, findAll, deepCollect } = await import('../../agents/lib/yahoo.js');
  const get = async (name, p, { skipIfHave = true } = {}) => {
    if (skipIfHave && !has('--refresh')) { const have = loadRaw(name); if (have && !have.error) return have.body; }
    try { const j = await yget(p); saveRaw(name, { path: p, fetched_at: new Date().toISOString(), body: j }); return j; }
    catch (e) { log(`WARN ${name}: ${e.message}`); saveRaw(name, { path: p, error: e.message }); return null; }
  };
  const my = await get('nfl-my-teams', 'users;use_login=1/games;game_keys=nfl/teams', { skipIfHave: false });
  const teams = findAll(my?.fantasy_content ?? {}, 'team').map((t) => deepCollect(t)).filter((t) => t.team_key);
  let queue = [...new Set(teams.map((t) => t.team_key.split('.t.')[0]))].map((lk) => ({ lk, depth: 0 }));
  const seen = new Set(); const leagues = [];
  while (queue.length) {
    const { lk, depth } = queue.shift(); if (seen.has(lk)) continue; seen.add(lk);
    const settings = await get(`league-${lk}-settings`, `league/${lk}/settings`);
    await get(`league-${lk}-teams`, `league/${lk}/teams`);
    await get(`league-${lk}-draftresults`, `league/${lk}/draftresults/players`);
    const meta = deepCollect((settings?.fantasy_content?.league ?? [])[0] ?? {});
    leagues.push({ league_key: lk, depth, name: meta.name, season: meta.season, renew: meta.renew || null });
    log(`  ${lk} ${meta.season} ${meta.name} (draft ${meta.draft_status})`);
    if (depth < HISTORY && meta.renew) queue.push({ lk: meta.renew.replace('_', '.l.'), depth: depth + 1 });
  }
  saveRaw('leagues', leagues);
}

function playerPoints() {
  const f = path.join(ROOT, 'data', 'archive', String(SEASON), 'season', 'fantasy-player-weeks.csv');
  const pts = {}; // `${league}|${player_key}` -> {points, weeks}
  if (!fs.existsSync(f)) return pts;
  const [head, ...rows] = fs.readFileSync(f, 'utf8').trim().split('\n');
  const cols = head.split(',');
  for (const line of rows) {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    const r = Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    const k = `${r.league}|${r.player_key}`; const p = Number(r.points);
    if (!pts[k]) pts[k] = { points: 0, weeks: new Set() };
    if (!Number.isNaN(p) && !pts[k].weeks.has(r.week)) { pts[k].points += p; pts[k].weeks.add(r.week); }
  }
  return pts;
}

async function parseAll() {
  const { findAll, deepCollect } = await import('../../agents/lib/yahoo.js');
  const first = (n, k) => findAll(n ?? {}, k)[0];
  const leagues = loadRaw('leagues') ?? [];
  const pts = playerPoints();
  const all = [];
  try { fs.rmSync(STAGE, { recursive: true, force: true }); } catch { /* overwrite below */ }
  fs.mkdirSync(STAGE, { recursive: true });
  for (const L of leagues) {
    const settingsBody = loadRaw(`league-${L.league_key}-settings`)?.body;
    const meta = deepCollect((settingsBody?.fantasy_content?.league ?? [])[0] ?? {});
    const st = deepCollect(first(settingsBody?.fantasy_content ?? {}, 'settings') ?? {});
    const teamRows = findAll(loadRaw(`league-${L.league_key}-teams`)?.body?.fantasy_content ?? {}, 'team').map((t) => {
      const f = deepCollect(t); return { team_key: f.team_key, team: f.name, manager: first(t, 'nickname') ?? null, mine: [true, 1, '1'].includes(first(t, 'is_owned_by_current_login')) };
    }).filter((t) => t.team_key);
    const tmap = Object.fromEntries(teamRows.map((t) => [t.team_key, t]));
    const dr = loadRaw(`league-${L.league_key}-draftresults`)?.body;
    const picks = findAll(dr?.fantasy_content ?? {}, 'draft_result').map((d) => {
      const f = deepCollect(d); const pl = deepCollect(first(d, 'player') ?? {});
      const key = f.player_key || pl.player_key;
      const p = pts[`${meta.name}|${key}`];
      return { pick: num(f.pick), round: num(f.round), cost: num(f.cost), team_key: f.team_key, team: tmap[f.team_key]?.team ?? null, manager: tmap[f.team_key]?.manager ?? null,
        mine: !!tmap[f.team_key]?.mine, player_key: key, player: pl.name || pl.full || null, nfl_team: String(pl.editorial_team_abbr || '').toUpperCase() || null,
        position: pl.display_position || pl.primary_position || null, points_to_date: p ? +p.points.toFixed(2) : null, weeks_rostered_tracked: p ? p.weeks.size : 0 };
    }).filter((p) => p.pick).sort((a, b) => a.pick - b.pick);
    // value: rank by points among drafted players vs draft slot (only meaningful for the current season)
    const ranked = picks.filter((p) => p.points_to_date != null).sort((a, b) => b.points_to_date - a.points_to_date);
    ranked.forEach((p, i) => { p.points_rank = i + 1; p.value_vs_slot = p.pick - (i + 1); });
    const doc = { schema: 'yahoo_draft_results_v1', league_key: L.league_key, league: meta.name, season: num(meta.season), num_teams: num(meta.num_teams),
      draft_status: meta.draft_status, draft_type: st.draft_type ?? null, is_auction: st.is_auction_draft === '1', draft_time: st.draft_time ? new Date(Number(st.draft_time) * 1000).toISOString() : null,
      uses_keepers: st.uses_keeper ?? st.uses_keepers ?? null, renew: meta.renew || null, teams: teamRows, picks, archived_at: new Date().toISOString(),
      note: picks.length ? 'points_to_date sums the archived weeks in fantasy-player-weeks.csv (current season only; refreshes each weekly run)' : 'No draft results returned (draft not held, or the API returned none).' };
    const base = `${doc.season}-${slug(L.league_key)}-${slug(meta.name || L.league_key)}`;
    fs.writeFileSync(path.join(OUT, `${base}.json`), JSON.stringify(doc, null, 1));
    const cols = ['season', 'league', 'pick', 'round', 'cost', 'team', 'manager', 'mine', 'player', 'nfl_team', 'position', 'points_to_date', 'points_rank', 'value_vs_slot', 'player_key'];
    const q = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = picks.map((p) => ({ season: doc.season, league: doc.league, ...p }));
    fs.writeFileSync(path.join(OUT, `${base}.csv`), [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n');
    all.push(...rows);
    // vault note
    const now = new Date().toISOString();
    const mineRows = picks.filter((p) => p.mine);
    const best = ranked.filter((p) => p.value_vs_slot != null).sort((a, b) => b.value_vs_slot - a.value_vs_slot).slice(0, 10);
    const worst = ranked.filter((p) => p.value_vs_slot != null).sort((a, b) => a.value_vs_slot - b.value_vs_slot).slice(0, 10);
    const tbl = (head, rr) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rr.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '/')).join(' | ')} |`).join('\n')}\n`;
    let md = `---\nsensitivity: green\nowner_project: nfl-dashboard\nsource_system: yahoo-draft-results\nsource_type: fantasy-draft\ncanonical_status: generated\ntitle: ${JSON.stringify(`${doc.league} draft ${doc.season}`)}\ncreated: "${now}"\nmodified: "${now}"\nseason: ${doc.season}\ntype: "fantasy-draft"\nleague: ${JSON.stringify(doc.league)}\nleague_key: "${L.league_key}"\nnum_teams: ${doc.num_teams}\ndraft_type: ${JSON.stringify(doc.draft_type)}\nis_auction: ${doc.is_auction}\npicks: ${picks.length}\ntags: ["nfl", "season-${doc.season}", "fantasy", "nfl/fantasy-draft"]\n---\n`;
    md += `# ${doc.league} — ${doc.season} draft\n\n${doc.num_teams} teams · ${doc.is_auction ? 'auction' : 'snake'} (${doc.draft_type ?? 'n/a'}) · ${doc.draft_time ? doc.draft_time.slice(0, 10) : ''} · ${picks.length} picks\n\n`;
    if (mineRows.length) md += `## My picks\n\n${tbl(['Pick', 'Rd', doc.is_auction ? '$' : '', 'Player', 'NFL', 'Pos', 'Pts to date', 'Value vs slot'], mineRows.map((p) => [p.pick, p.round, doc.is_auction ? p.cost : '', p.player, p.nfl_team, p.position, p.points_to_date ?? '', p.value_vs_slot ?? '']))}\n`;
    if (best.length) md += `## Best value so far (points rank vs draft slot)\n\n${tbl(['Pick', 'Player', 'Pos', 'Team', 'Pts', '+slots'], best.map((p) => [p.pick, p.player, p.position, p.team, p.points_to_date, `+${p.value_vs_slot}`]))}\n## Biggest disappointments so far\n\n${tbl(['Pick', 'Player', 'Pos', 'Team', 'Pts', 'slots'], worst.map((p) => [p.pick, p.player, p.position, p.team, p.points_to_date, p.value_vs_slot]))}\n`;
    md += `## Full draft board\n\n${tbl(['Pick', 'Rd', 'Team', 'Player', 'NFL', 'Pos', 'Pts to date'], picks.map((p) => [p.pick, p.round, p.mine ? `**${p.team}**` : p.team, p.player, p.nfl_team, p.position, p.points_to_date ?? '']))}`;
    fs.writeFileSync(path.join(STAGE, `${safeName(`${doc.season} ${doc.league}`)}.md`), md);
    log(`parsed ${doc.season} ${doc.league}: ${picks.length} picks, mine ${mineRows.length}`);
  }
  const cols = ['season', 'league', 'pick', 'round', 'cost', 'team', 'manager', 'mine', 'player', 'nfl_team', 'position', 'points_to_date', 'points_rank', 'value_vs_slot', 'player_key'];
  const q = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(path.join(OUT, `drafts-${SEASON}.csv`), [cols.join(','), ...all.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n');
}

async function vault() {
  const V = process.env.VAULT_DIR || '';
  if (!V || !fs.existsSync(V)) { log('vault: VAULT_DIR not set/missing — notes staged only'); return; }
  if (process.platform === 'linux' && /^(\/sessions|.*[\\/]mnt[\\/])/.test(path.resolve(V))) { log('vault: refusing to write through a Linux mount — notes staged only'); return; }
  const c = {};
  for (const f of fs.readdirSync(STAGE)) { const r = await writeVaultNote(V, `NFL/${SEASON}/Drafts/${f}`, fs.readFileSync(path.join(STAGE, f), 'utf8')); c[r] = (c[r] || 0) + 1; }
  log(`vault: ${JSON.stringify(c)}`);
}

fs.mkdirSync(OUT, { recursive: true });
if (!has('--from-raw')) await fetchAll();
await parseAll();
if (!has('--no-vault')) await vault();
