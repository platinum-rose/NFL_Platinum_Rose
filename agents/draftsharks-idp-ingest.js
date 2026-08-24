// agents/draftsharks-idp-ingest.js
// Ingests 2026 IDP (Individual Defensive Player) rankings and projections from DraftSharks.
// Zero third-party HTML parser dependencies required (native fetch + regex).
//
// Usage:
//   node agents/draftsharks-idp-ingest.js [--as-of 2026-08-22] [--dry-run]
//

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data', 'rankings');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const DEFENSIVE_POSITIONS = new Set([
  'DL', 'LB', 'DB', 'DE', 'DT', 'EDGE', 'EDR', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS', 'IDP'
]);

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

const AS_OF = getArg('--as-of', new Date().toISOString().slice(0, 10));
const SEASON = parseInt(getArg('--season', '2026'), 10);
const DRY_RUN = has('--dry-run');

const DRAFT_SHARKS_IDP_URL = 'https://www.draftsharks.com/rankings/load-rows?offset=0&position=idp';

function stripTags(str) {
  return (str || '').replace(/<[^>]+>/g, '').trim();
}

export async function fetchDraftSharksIdpRankings() {
  console.log(`→ Fetching DraftSharks IDP Rankings payload from: ${DRAFT_SHARKS_IDP_URL}...`);
  const resp = await fetch(DRAFT_SHARKS_IDP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!resp.ok) {
    throw new Error(`DraftSharks HTTP Error ${resp.status}: ${resp.statusText}`);
  }

  const html = await resp.text();

  const allPlayers = [];
  const idpPlayers = [];

  let currentTier = 'Tier 1';
  let idpPositionalRank = 1;

  // Split HTML by <tr> tags
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (const trHtml of trMatches) {
    // Check Tier Divider Row
    if (trHtml.includes('ds-table-divider-row')) {
      const tierMatch = trHtml.match(/data-before-content=["']([^"']+)["']/i);
      if (tierMatch) currentTier = tierMatch[1];
      continue;
    }

    if (!trHtml.includes('player-row')) continue;

    // Extract attributes & sub-elements
    const fnameMatch = trHtml.match(/first-name=["']([^"']*)["']/i);
    const lnameMatch = trHtml.match(/last-name=["']([^"']*)["']/i);
    const pidMatch = trHtml.match(/player-id=["']([^"']*)["']/i);
    const posMatch = trHtml.match(/pos-roster-spot=["']([^"']*)["']/i);
    const teamMatch = trHtml.match(/player-details-group__team-name["'][^>]*>([^<]+)</i);

    if (!fnameMatch || !lnameMatch) continue;

    const fname = fnameMatch[1];
    const lname = lnameMatch[1];
    const playerName = `${fname} ${lname}`.trim();
    const playerId = pidMatch ? pidMatch[1] : '';
    const position = posMatch ? posMatch[1] : '';
    const team = teamMatch ? teamMatch[1].trim() : '';

    // Extract table cells
    const tdMatches = trHtml.match(/<td[\s\S]*?<\/td>/gi) || [];
    const colTexts = tdMatches.map(stripTags);

    const overallRank = parseInt(colTexts[0], 10) || null;
    const gamesPlayed = parseInt(colTexts[2], 10) || 17;
    const adp = parseFloat(colTexts[3]) || null;
    const bye = parseInt(colTexts[4], 10) || null;
    const sosPct = colTexts[5] || null;
    const injuryRiskPct = colTexts[6] || null;
    const floorProj = parseFloat(colTexts[7]) || null;
    const consensusProj = parseFloat(colTexts[8]) || null;
    const dsProj = parseFloat(colTexts[9]) || null;
    const ceilingProj = parseFloat(colTexts[10]) || null;
    const value3d = parseFloat(colTexts[11]) || null;

    const rec = {
      overall_rank: overallRank,
      player_id: playerId,
      player: playerName,
      position,
      team,
      season: SEASON,
      tier: currentTier,
      adp,
      bye,
      games_played: gamesPlayed,
      sos_pct: sosPct,
      injury_risk_pct: injuryRiskPct,
      floor_proj: floorProj,
      consensus_proj: consensusProj,
      ds_proj: dsProj,
      ceiling_proj: ceilingProj,
      value_3d: value3d,
      source: 'draftsharks',
      as_of_date: AS_OF
    };

    allPlayers.push(rec);

    if (DEFENSIVE_POSITIONS.has(position)) {
      rec.idp_rank = idpPositionalRank++;
      idpPlayers.push(rec);
    }
  }

  return { allPlayers, idpPlayers };
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  DraftSharks IDP Rankings Ingest');
  console.log(`  Season: ${SEASON} | AsOf: ${AS_OF} | DryRun: ${DRY_RUN}`);
  console.log('══════════════════════════════════════════════════\n');

  const { allPlayers, idpPlayers } = await fetchDraftSharksIdpRankings();

  console.log(`✓ Fetched & parsed ${allPlayers.length} total players`);
  console.log(`✓ Isolated ${idpPlayers.length} IDP (Defensive) players\n`);

  console.log('Top 10 IDP Players:');
  idpPlayers.slice(0, 10).forEach((p) => {
    console.log(`  IDP #${p.idp_rank} (Ovr #${p.overall_rank}) | ${p.player} (${p.position} - ${p.team}) | DS Proj: ${p.ds_proj} pts | 3D: ${p.value_3d}`);
  });

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(RECEIPTS_DIR, { recursive: true });

  const outputFile = path.join(DATA_DIR, `draftsharks-idp-${AS_OF}.json`);
  await writeFile(outputFile, JSON.stringify({
    as_of: AS_OF,
    season: SEASON,
    source: 'draftsharks',
    total_parsed: allPlayers.length,
    idp_count: idpPlayers.length,
    idp_rankings: idpPlayers,
    all_players: allPlayers
  }, null, 2));

  console.log(`\n✅ Saved IDP import JSON to: ${outputFile}`);

  if (!DRY_RUN && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    console.log(`\n→ Upserting ${idpPlayers.length} IDP rankings to Supabase (fantasy_rankings)...`);

    const dbRows = idpPlayers.map((p) => ({
      player: p.player,
      position: p.position,
      team: p.team,
      season: p.season,
      week: 0,
      scoring: 'idp',
      rank_ecr: p.idp_rank,
      pos_rank: `${p.position}${p.idp_rank}`,
      tier: parseInt(p.tier.replace(/\D/g, ''), 10) || 1,
      source: 'draftsharks',
      as_of_date: p.as_of_date
    }));

    for (let i = 0; i < dbRows.length; i += 100) {
      const chunk = dbRows.slice(i, i + 100);
      const { error } = await sb.from('fantasy_rankings').upsert(chunk, {
        onConflict: 'player,position,season,week,scoring,source,as_of_date'
      });
      if (error) {
        console.warn(`[WARN] Supabase upsert error on chunk ${i}:`, error.message);
      }
    }
    console.log('✅ Supabase upsert completed!');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('✖ Ingestion failed:', err);
    process.exit(1);
  });
}
