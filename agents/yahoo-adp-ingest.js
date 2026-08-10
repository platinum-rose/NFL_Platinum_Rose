// agents/yahoo-adp-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// Yahoo consensus ADP → fantasy_adp (source='yahoo').
//
// Pulls Yahoo's own game-level draft-analysis (average_pick / average_round /
// percent_drafted across Yahoo drafts + mock drafts) — the most relevant ADP for a
// Yahoo-hosted league. Upserts into fantasy_adp exactly like scripts/parse-adp.js,
// so agents/fantasy-value-report.js consumes it unchanged (source distinguishes it).
//
// Usage:
//   node agents/yahoo-adp-ingest.js [--game nfl] [--count 300] [--scoring ppr]
//     [--as-of YYYY-MM-DD] [--csv data/fantasy/adp-yahoo-<date>.csv] [--dry-run]
// Env: YAHOO_* (see src/lib/yahoo.js) + SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (unless --dry-run)
// ═══════════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { yget, deepCollect, collectionItems, findAll } from './lib/yahoo.js';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);
const GAME    = getArg('--game', 'nfl');
const WANT    = parseInt(getArg('--count', '300'), 10);
const SCORING = (getArg('--scoring', 'ppr') || 'ppr').toLowerCase();
const AS_OF   = getArg('--as-of', new Date().toISOString().slice(0, 10));
const CSV_OUT = getArg('--csv', `data/fantasy/adp-yahoo-${AS_OF}.csv`);
const DRY     = has('--dry-run');
const PAGE    = 25; // Yahoo caps players collections at 25 per request

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!SB_URL || !SB_KEY)) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)'); process.exit(1); }
const sb = (!DRY && SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

// Yahoo sorts players by rank; walk pages until fewer than PAGE come back.
async function fetchAll(gameKey, want) {
  const flats = [];
  for (let start = 0; start < want; start += PAGE) {
    const j = await yget(`game/${gameKey}/players;start=${start};count=${PAGE}/draft_analysis`);
    // Find the players collection anywhere under fantasy_content (nesting varies).
    const coll = findAll(j?.fantasy_content ?? j, 'players')[0];
    const items = collectionItems(coll);
    if (!items.length) break;
    for (const it of items) {
      const flat = deepCollect(it.player ?? it);
      if (flat.average_pick != null || flat.name != null) flats.push(flat);
    }
    if (items.length < PAGE) break;
  }
  return flats;
}

function toPosition(display) {
  // e.g. "WR", "RB", "WR,RB", "QB", "TE", "K", "DEF"
  const first = String(display || '').split(',')[0].trim().toUpperCase();
  return first || null;
}

(async () => {
  console.log(`📥 Yahoo ADP${DRY ? ' (DRY RUN)' : ''} · game=${GAME} scoring=${SCORING} as_of=${AS_OF} want≤${WANT}`);
  const flats = await fetchAll(GAME, WANT);
  const drafted = flats.filter((f) => f.average_pick != null && Number(f.average_pick) > 0);
  console.log(`   fetched ${flats.length} players, ${drafted.length} with draft data`);
  if (!drafted.length) { console.error('✖ No draft_analysis returned. In the deep offseason Yahoo may not publish ADP yet.'); process.exit(2); }

  // Sort by ADP, derive positional rank.
  drafted.sort((a, b) => Number(a.average_pick) - Number(b.average_pick));
  const posCount = {};
  const records = drafted.map((f) => {
    const position = toPosition(f.display_position);
    posCount[position] = (posCount[position] || 0) + 1;
    const adp = Number(f.average_pick);
    return {
      player_id: null,                         // Yahoo id ≠ nflverse gsis; report name-joins
      player: f.name || null,
      position,
      team: f.editorial_team_abbr || null,
      adp,
      adp_round: f.average_round != null ? Math.round(Number(f.average_round)) : Math.ceil(adp / 12),
      adp_pos_rank: posCount[position],
      scoring: SCORING,
      source: 'yahoo',
      as_of_date: AS_OF,
    };
  }).filter((r) => r.player && Number.isFinite(r.adp));

  // Always drop a CSV snapshot (audit trail + a manual seed fallback).
  await mkdir(path.dirname(CSV_OUT), { recursive: true });
  const csv = ['player,position,team,adp,adp_round,adp_pos_rank,percent_drafted']
    .concat(drafted.map((f) => {
      const p = toPosition(f.display_position);
      return [f.name, p, f.editorial_team_abbr || '', f.average_pick, f.average_round || '', '', f.percent_drafted || '']
        .map((x) => (String(x).includes(',') ? `"${x}"` : x)).join(',');
    })).join('\n');
  await writeFile(CSV_OUT, csv + '\n');
  console.log(`   wrote snapshot ${CSV_OUT} (${records.length} rows)`);
  console.log('   top 5:', records.slice(0, 5).map((r) => `${r.player} ${r.position} ${r.adp}`).join(' · '));

  if (DRY) { console.log('   DRY RUN — not writing to fantasy_adp.'); return; }

  const CHUNK = 500;
  for (let i = 0; i < records.length; i += CHUNK) {
    const slice = records.slice(i, i + CHUNK);
    const { error } = await sb.from('fantasy_adp').upsert(slice, { onConflict: 'player,source,scoring,as_of_date' });
    if (error) throw new Error(`fantasy_adp upsert: ${error.message}`);
    console.log(`   upserted ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
  console.log(`✅ loaded ${records.length} Yahoo ADP rows into fantasy_adp (source='yahoo')`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
