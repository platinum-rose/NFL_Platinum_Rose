// agents/fantasy-value-report.js
// ═══════════════════════════════════════════════════════════════════════════════
// Fantasy Value-vs-ADP report — PHASE A (history-based projection)
// Spec: docs/FANTASY_VALUE_VS_ADP_SPEC.md
//
// Projects each player's fantasy points from prior-season production (regressed
// toward the positional mean), compares the resulting positional rank against ADP,
// and surfaces where the draft market under- or over-values a player.
// Phase B (season-long props) will swap the projection source; everything else holds.
//
// Usage:
//   node agents/fantasy-value-report.js [--season 2025] [--scoring ppr|half|standard]
//     [--proj-games 17] [--adp <csv path>] [--k 6]
//   ADP source: --adp CSV (cols: player,position[,team][,adp][,adp_pos_rank]) OR the
//   fantasy_adp table (latest as_of_date) when --adp is omitted.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (not needed if --adp given AND stats cached)
// Output: docs/fantasy/value-board-<date>.{json,md,html}
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'fantasy');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const SEASON = getArg('--season', null) ? parseInt(getArg('--season'), 10) : null;
const SCORING = (getArg('--scoring', 'ppr') || 'ppr').toLowerCase();
const PROJ_GAMES = parseInt(getArg('--proj-games', '17'), 10);
const ADP_CSV = getArg('--adp', null);
const K = parseFloat(getArg('--k', '6'));            // regression constant (games)
const MIN_GAMES_MEAN = 6;                            // min games to count toward positional mean
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = (SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

const round = (x, n = 1) => (x == null ? null : Number(x.toFixed(n)));
// Fantasy points column for the chosen scoring format.
function scoredPoints(row) {
  const ppr = row.fantasy_points_ppr, std = row.fantasy_points;
  if (SCORING === 'standard') return std;
  if (SCORING === 'half') return (ppr != null && std != null) ? (ppr + std) / 2 : (ppr ?? std);
  return ppr ?? std; // ppr default
}
// Name key for joining ADP (names) to stats: lowercase, strip punctuation + suffixes.
function nameKey(s) {
  return (s || '').toLowerCase()
    .replace(/[.'`]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

// ── RFC4180-ish CSV parser ────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── fetchers ──────────────────────────────────────────────────────────────────
async function fetchSeasonStats() {
  if (!sb) throw new Error('SUPABASE creds required to read player_season_stats');
  let season = SEASON;
  if (!season) {
    const { data } = await sb.from('player_season_stats').select('season').order('season', { ascending: false }).limit(1);
    season = data?.[0]?.season;
    if (!season) throw new Error('no rows in player_season_stats — run agents/player-stats-ingest.js first');
  }
  // Filter server-side to the positions this report actually uses (QB/RB/WR/TE).
  // Without this, Supabase's default 1000-row response cap silently truncates
  // the unfiltered query before it reaches skill positions at all — confirmed
  // 2026-07-26: the first 1000 rows for season=2025/REG are entirely
  // C/CB/DB/DE/DL/DT/FB/FS/G/ILB/K/LB (alphabetically before QB), while the
  // true count for QB/RB/WR/TE alone is 610, comfortably under the cap. This
  // is why every value-board run through 2026-07-26 showed 0 projections.
  const { data, error } = await sb.from('player_season_stats')
    .select('player_id, player_name, position, team, season, season_type, games, fantasy_points, fantasy_points_ppr, targets, target_share')
    .eq('season', season).eq('season_type', 'REG')
    .in('position', POSITIONS);
  if (error) throw new Error(`player_season_stats: ${error.message}`);
  return { season, rows: data || [] };
}
async function loadAdpFromCsv(p) {
  const rows = parseCSV(await readFile(p, 'utf8')).filter((r) => r.length > 1);
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const g = (r, k) => (idx[k] != null ? r[idx[k]] : undefined);
  return rows.map((r) => ({
    player: g(r, 'player') || g(r, 'name'),
    position: (g(r, 'position') || g(r, 'pos') || '').toUpperCase(),
    team: g(r, 'team') || null,
    adp: Number(g(r, 'adp')),
    adp_pos_rank: g(r, 'adp_pos_rank') ? Number(g(r, 'adp_pos_rank')) : null,
    player_id: g(r, 'player_id') || null,
  })).filter((a) => a.player && Number.isFinite(a.adp));
}
async function loadAdpFromTable() {
  if (!sb) return [];
  const { data: latest } = await sb.from('fantasy_adp').select('as_of_date').order('as_of_date', { ascending: false }).limit(1);
  const asOf = latest?.[0]?.as_of_date;
  if (!asOf) return [];
  const { data } = await sb.from('fantasy_adp').select('player_id, player, position, team, adp, adp_pos_rank, scoring')
    .eq('as_of_date', asOf);
  return (data || []).filter((a) => (a.scoring || 'ppr') === SCORING || SCORING === 'ppr');
}

// ── projection + value ────────────────────────────────────────────────────────
function tierFor(gap) {
  if (gap == null) return 'no_projection';
  if (gap >= 6) return 'strong_value';
  if (gap >= 3) return 'value';
  if (gap >= -2) return 'fair';
  return 'reach';
}

function buildBoard(statsRows, adpRows) {
  // index stats by id + name key
  const byId = {}, byName = {};
  for (const r of statsRows) {
    const pts = scoredPoints(r);
    if (r.player_id) byId[r.player_id] = r;
    if (r.player_name) byName[nameKey(r.player_name)] = r;
    r._pts = pts;
    r._ppg = (pts != null && r.games > 0) ? pts / r.games : null;
  }
  // positional mean ppg over meaningful samples
  const posMean = {};
  for (const pos of POSITIONS) {
    const ppgs = statsRows.filter((r) => r.position === pos && r.games >= MIN_GAMES_MEAN && r._ppg != null).map((r) => r._ppg);
    posMean[pos] = ppgs.length ? ppgs.reduce((a, b) => a + b, 0) / ppgs.length : null;
  }
  // build board over the ADP pool
  const board = [];
  for (const a of adpRows) {
    const pos = a.position || null;
    const stat = (a.player_id && byId[a.player_id]) || byName[nameKey(a.player)] || null;
    let proj = null, projPpg = null;
    if (stat && stat._ppg != null && posMean[pos] != null) {
      const w = stat.games / (stat.games + K);
      projPpg = w * stat._ppg + (1 - w) * posMean[pos];
      proj = projPpg * PROJ_GAMES;
    }
    board.push({
      player: a.player, position: pos, team: a.team || stat?.team || null,
      adp: a.adp, adp_pos_rank_src: a.adp_pos_rank ?? null,
      prior_games: stat?.games ?? null, prior_ppr: round(stat?._pts), prior_ppg: round(stat?._ppg, 2),
      proj_ppg: round(projPpg, 2), proj_points: round(proj),
      _hasProj: proj != null,
    });
  }
  // positional ranks within the pool
  for (const pos of POSITIONS) {
    const inPos = board.filter((b) => b.position === pos);
    // ADP positional rank (by adp asc)
    inPos.slice().sort((a, b) => a.adp - b.adp).forEach((b, i) => { b.adp_pos_rank = b.adp_pos_rank_src ?? (i + 1); });
    // projection positional rank (by proj desc; unprojected sink to the bottom)
    inPos.slice().sort((a, b) => (b.proj_points ?? -1) - (a.proj_points ?? -1))
      .forEach((b, i) => { b.proj_pos_rank = b._hasProj ? i + 1 : null; });
  }
  for (const b of board) {
    b.value_gap = (b._hasProj && b.adp_pos_rank != null && b.proj_pos_rank != null)
      ? b.adp_pos_rank - b.proj_pos_rank : null;
    b.tier = tierFor(b.value_gap);
    b.label = b.position && b.proj_pos_rank ? `${b.position}${b.proj_pos_rank} proj vs ${b.position}${b.adp_pos_rank} ADP` : null;
    delete b._hasProj; delete b.adp_pos_rank_src;
  }
  board.sort((a, b) => (b.value_gap ?? -99) - (a.value_gap ?? -99));
  return board;
}

// ── render ──────────────────────────────────────────────────────────────────
function toMarkdown(meta, board) {
  const values = board.filter((b) => b.tier === 'strong_value' || b.tier === 'value');
  const reaches = board.filter((b) => b.tier === 'reach');
  const noProj = board.filter((b) => b.tier === 'no_projection');
  const L = [`# Fantasy Value-vs-ADP Board — ${meta.date}`, '',
    `Prior season ${meta.stats_season} · scoring ${meta.scoring} · proj ${meta.proj_games} games · ${board.length} players`,
    '', '> Phase A (history-based projection). Decision support — pair with injury/situation news; rookies have no prior-year projection.', '',
    `## Values (market under-drafts the projection) — ${values.length}`];
  for (const b of values) L.push(`- **${b.player}** ${b.position} · +${b.value_gap} · ${b.label} · proj ${b.proj_points} pts (prior ${b.prior_ppr ?? '—'} in ${b.prior_games ?? '—'}g) · ADP ${b.adp}`);
  L.push('', `## Reaches (market over-drafts the projection) — ${reaches.length}`);
  for (const b of reaches.slice(0, 25)) L.push(`- **${b.player}** ${b.position} · ${b.value_gap} · ${b.label} · proj ${b.proj_points} pts · ADP ${b.adp}`);
  L.push('', `## No projection (rookies / no prior-year data) — ${noProj.length}`);
  L.push(noProj.slice(0, 30).map((b) => b.player).join(', ') || '_none_');
  return L.join('\n');
}
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function toHtml(meta, board) {
  const rowHtml = board.filter((b) => b.tier !== 'no_projection').map((b) => {
    const cls = b.tier;
    const gap = b.value_gap == null ? '' : (b.value_gap > 0 ? `+${b.value_gap}` : `${b.value_gap}`);
    return `<tr class="${cls}"><td><b>${esc(b.player)}</b></td><td>${esc(b.position)}</td><td class="g">${gap}</td>
      <td>${esc(b.tier)}</td><td>${b.proj_points ?? ''}</td><td>${b.proj_pos_rank ? b.position + b.proj_pos_rank : ''}</td>
      <td>${b.position && b.adp_pos_rank ? b.position + b.adp_pos_rank : ''}</td><td>${b.adp ?? ''}</td>
      <td>${b.prior_ppr ?? ''}</td><td>${b.prior_games ?? ''}</td></tr>`;
  }).join('');
  return `<!doctype html><meta charset="utf-8"><title>Fantasy Value Board ${meta.date}</title>
<style>
 body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:1000px;margin:24px auto;padding:0 16px;color:#1a1a1a}
 h1{margin:0 0 4px}.sub{color:#666;margin-bottom:16px}
 table{border-collapse:collapse;width:100%}th,td{padding:5px 8px;border-bottom:1px solid #eee;text-align:left}
 th{font-size:12px;color:#666;text-transform:uppercase}.g{font-weight:700}
 tr.strong_value{background:#f0fdf4}tr.value{background:#f7fee7}tr.reach{background:#fef2f2}
 .banner{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin:12px 0;font-size:13px}
</style>
<h1>Fantasy Value-vs-ADP Board</h1>
<div class="sub">${meta.date} · prior season ${meta.stats_season} · ${esc(meta.scoring)} · proj ${meta.proj_games} games</div>
<div class="banner"><b>Phase A — history-based.</b> Projection = prior-year points/game regressed toward the positional mean, ×${meta.proj_games}. Pair with injury/situation news; rookies have no prior-year projection and are omitted from ranks. Decision support, not advice.</div>
<table><thead><tr><th>Player</th><th>Pos</th><th>Value</th><th>Tier</th><th>Proj pts</th><th>Proj rank</th><th>ADP rank</th><th>ADP</th><th>Prior PPR</th><th>G</th></tr></thead>
<tbody>${rowHtml}</tbody></table>`;
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`🏈 Fantasy value-vs-ADP (Phase A) · scoring ${SCORING}`);
  const { season, rows: statsRows } = await fetchSeasonStats();
  const adpRows = ADP_CSV ? await loadAdpFromCsv(ADP_CSV) : await loadAdpFromTable();
  console.log(`   ${statsRows.length} season-stat rows (season ${season}) · ${adpRows.length} ADP rows${ADP_CSV ? ` (csv ${path.basename(ADP_CSV)})` : ' (fantasy_adp table)'}`);
  if (!adpRows.length) {
    console.error('✖ No ADP data. Seed fantasy_adp (mig 034) or pass --adp <csv> (cols: player,position,adp). See docs/FANTASY_VALUE_VS_ADP_SPEC.md');
    process.exitCode = 1; return;
  }
  const board = buildBoard(statsRows, adpRows);
  const nValues = board.filter((b) => b.tier === 'strong_value' || b.tier === 'value').length;

  const meta = { date: new Date().toISOString().slice(0, 10), stats_season: season, scoring: SCORING, proj_games: PROJ_GAMES, players: board.length };
  await mkdir(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `value-board-${meta.date}`);
  await writeFile(`${base}.json`, JSON.stringify({ meta, board }, null, 2));
  await writeFile(`${base}.md`, toMarkdown(meta, board));
  await writeFile(`${base}.html`, toHtml(meta, board));
  // Public copy so the Fantasy tab can fetch it via LOCAL_DATA.FANTASY_VALUE_BOARD
  // (src/lib/apiConfig.js) — same pattern as public/schedule.json and
  // public/youtube-futures-agent-intel-summary.json.
  const OUT_PUBLIC = path.join(ROOT, 'public', 'fantasy-value-board.json');
  await writeFile(OUT_PUBLIC, JSON.stringify({ meta, board }, null, 2));
  console.log(`✅ ${base}.md / .html / .json`);
  console.log(`   Wrote public copy: ${OUT_PUBLIC}`);
  console.log(`   ${nValues} value plays · ${board.filter((b) => b.tier === 'reach').length} reaches · ${board.filter((b) => b.tier === 'no_projection').length} no-projection`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
