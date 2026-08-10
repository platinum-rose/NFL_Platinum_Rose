// scripts/parse-adp.js
// ═══════════════════════════════════════════════════════════════════════════════
// ADP CSV → fantasy_adp table loader (migration 034).
//
// Tolerant of the common public ADP exports (FantasyPros, Underdog, Sleeper, ESPN):
// maps a range of header spellings, parses a "POS" like "WR12" into position + a
// positional ADP rank, derives the draft round, and (by default) resolves
// player_id from player_stats so the value report joins on ID, not just name.
//
// Usage:
//   node scripts/parse-adp.js --csv data/fantasy/adp-2026-07-16.csv
//     [--source fantasypros] [--scoring ppr|half|standard] [--as-of 2026-07-16]
//     [--teams 12] [--no-resolve] [--dry-run]
//
// Accepted columns (first match wins, case-insensitive):
//   player  ← player | name | player name
//   position← position | pos          (e.g. "WR", "WR12", "RB1")
//   team    ← team | tm
//   adp     ← adp | avg | average | overall | rank | overall rank
//   pos_rank← pos_rank | positional rank         (else parsed from POS / left null)
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (unless --dry-run)
// ═══════════════════════════════════════════════════════════════════════════════

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const CSV = getArg('--csv', null);
const SOURCE = getArg('--source', 'manual');
const SCORING = (getArg('--scoring', 'ppr') || 'ppr').toLowerCase();
const AS_OF = getArg('--as-of', new Date().toISOString().slice(0, 10));
const TEAMS = parseInt(getArg('--teams', '12'), 10);
const DRY = has('--dry-run');
const RESOLVE = !has('--no-resolve');
if (!CSV) { console.error('✖ pass --csv <path to ADP csv>'); process.exit(1); }

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)'); process.exit(1); }
const sb = (!DRY && SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

// ── CSV parse (RFC4180-ish) ───────────────────────────────────────────────────
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
const COLS = {
  player:  ['player', 'name', 'player name'],
  position:['position', 'pos'],
  team:    ['team', 'tm'],
  adp:     ['adp', 'avg', 'average', 'overall', 'overall rank', 'rank'],
  pos_rank:['pos_rank', 'positional rank', 'pos rank'],
};
function resolveHeader(header) {
  const norm = header.map((h) => h.trim().toLowerCase());
  const map = {};
  // Match in ALIAS priority order (not header order) so a specific column like
  // "AVG" wins over a generic "Rank" when a source (e.g. FantasyPros) has both.
  for (const [field, aliases] of Object.entries(COLS)) {
    for (const alias of aliases) {
      const i = norm.indexOf(alias);
      if (i >= 0) { map[field] = i; break; }
    }
  }
  return map;
}
// "WR12" → { position:'WR', rank:12 } ; "RB" → { position:'RB', rank:null }
function splitPos(raw) {
  const m = String(raw || '').trim().toUpperCase().match(/^([A-Z]+)\s*(\d+)?/);
  return m ? { position: m[1], rank: m[2] ? parseInt(m[2], 10) : null } : { position: null, rank: null };
}
const nameKey = (s) => (s || '').toLowerCase().replace(/[.'`]/g, '').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const num = (v) => { if (v == null || v === '') return null; const n = Number(String(v).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : null; };

async function resolveIds(records) {
  if (!sb) return records;
  // pull a name→id map from player_stats (dedupe to most recent)
  const byName = {};
  const PAGE = 1000; let from = 0;
  for (;;) {
    const { data, error } = await sb.from('player_stats').select('player_id, player_name, season').range(from, from + PAGE - 1);
    if (error) { console.warn(`   ⚠ id-resolve read: ${error.message}`); break; }
    for (const r of data || []) { const k = nameKey(r.player_name); if (k && !byName[k]) byName[k] = r.player_id; }
    if (!data || data.length < PAGE) break; from += PAGE;
  }
  let hit = 0;
  for (const rec of records) { const id = byName[nameKey(rec.player)]; if (id) { rec.player_id = id; hit++; } }
  console.log(`   resolved player_id for ${hit}/${records.length} via player_stats`);
  return records;
}

(async () => {
  console.log(`📥 ADP loader${DRY ? ' (DRY RUN)' : ''} · source=${SOURCE} scoring=${SCORING} as_of=${AS_OF}`);
  const rows = parseCSV(await readFile(CSV, 'utf8')).filter((r) => r.length > 1);
  const header = rows.shift();
  const map = resolveHeader(header);
  if (map.player == null || map.adp == null) {
    console.error(`✖ Could not find player + adp columns. Saw headers: ${header.join(', ')}`);
    console.error('  Rename/add columns so one matches: player=[player|name], adp=[adp|avg|overall|rank].');
    process.exit(1);
  }
  const get = (r, f) => (map[f] != null ? r[map[f]] : undefined);

  const records = [];
  for (const r of rows) {
    const player = (get(r, 'player') || '').trim();
    const adp = num(get(r, 'adp'));
    if (!player || adp == null) continue;
    const posRaw = get(r, 'position');
    const { position, rank } = splitPos(posRaw);
    const posRank = num(get(r, 'pos_rank')) ?? rank;
    records.push({
      player, player_id: null,
      position: position || (posRaw ? String(posRaw).toUpperCase() : null),
      team: (get(r, 'team') || '').trim() || null,
      adp, adp_round: Math.max(1, Math.ceil(adp / TEAMS)),
      adp_pos_rank: posRank ?? null,
      scoring: SCORING, source: SOURCE, as_of_date: AS_OF,
    });
  }
  console.log(`   parsed ${records.length} ADP rows from ${path.basename(CSV)}`);
  if (!records.length) { console.error('✖ no valid rows parsed'); process.exit(1); }
  if (RESOLVE) await resolveIds(records);

  // sample
  for (const s of records.slice(0, 3)) console.log(`   e.g. ${s.player} ${s.position ?? '?'}${s.adp_pos_rank ?? ''} adp ${s.adp} (rd ${s.adp_round})${s.player_id ? ` [${s.player_id}]` : ''}`);

  if (DRY) { console.log('   [dry-run] not writing'); return; }
  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    const { error } = await sb.from('fantasy_adp').upsert(slice, { onConflict: 'player,source,scoring,as_of_date' });
    if (error) throw new Error(`fantasy_adp upsert: ${error.message}`);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
  console.log(`✅ loaded ${records.length} ADP rows → fantasy_adp (${AS_OF})`);
  console.log(`   next: node agents/fantasy-value-report.js --scoring ${SCORING}`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
