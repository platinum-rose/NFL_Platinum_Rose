/**
 * find-available-pool.mjs
 *
 * Pulls the FULL open free-agent/waiver pool (Yahoo status=A) per position for
 * every league, paginating past Yahoo's 25-per-request cap instead of relying on
 * Yahoo's own "overall rank" sort (which is preseason-expert-consensus based and
 * can miss a Week 1 breakout that wasn't highly regarded before the season).
 *
 * This script only fetches and dumps the raw pool -- ranking by actual Week 1
 * fantasy points happens separately against the local nflverse stats CSV, which
 * is the real ground truth for "who actually scored."
 *
 * Usage:
 *   node scripts/find-available-pool.mjs
 *   node scripts/find-available-pool.mjs --positions QB,RB,WR,TE --max-pages 6
 *
 * Emits:
 *   data/fantasy/available-pool-<timestamp>.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { yget, findAll, deepCollect } from '../agents/lib/yahoo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ROSTERS_PATH = path.join(ROOT, 'data', 'fantasy', 'yahoo-live-rosters.json');
const OUT_DIR = path.join(ROOT, 'data', 'fantasy');
const PAGE_SIZE = 25;

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    positions: get('--positions', 'QB,RB,WR,TE').split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
    maxPages: Number(get('--max-pages', '5')), // 5 * 25 = up to 125 players/position/league
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loadLeagues() {
  const raw = await readFile(ROSTERS_PATH, 'utf8');
  const data = JSON.parse(raw);
  const seen = new Map();
  for (const lg of data.leagues || []) {
    if (!seen.has(lg.leagueKey)) seen.set(lg.leagueKey, { leagueKey: lg.leagueKey, leagueName: lg.leagueName });
  }
  return [...seen.values()];
}

function extractPlayers(resp) {
  const nodes = findAll(resp?.fantasy_content ?? resp, 'player');
  return nodes.map(node => {
    const flat = deepCollect(node);
    return {
      playerKey: flat.player_key || null,
      name: flat.name || flat.full || null,
      position: flat.display_position || flat.primary_position || null,
      nflTeam: (flat.editorial_team_abbr || '').toUpperCase() || null,
      status: flat.status || null,
      ownershipType: flat.ownership_type || null,
    };
  }).filter(p => p.name);
}

async function fetchFullPool(leagueKey, position, maxPages) {
  const all = [];
  for (let page = 0; page < maxPages; page++) {
    const start = page * PAGE_SIZE;
    const query = `league/${leagueKey}/players;position=${position};status=A;sort=OR;start=${start};count=${PAGE_SIZE}`;
    const resp = await yget(query);
    const players = extractPlayers(resp);
    if (players.length === 0) break;
    all.push(...players);
    await sleep(200);
    if (players.length < PAGE_SIZE) break; // last page
  }
  return all;
}

async function main() {
  const { positions, maxPages } = parseArgs();
  console.log('══════════════════════════════════════════════════');
  console.log('  Full Available Pool Fetch (paginated)');
  console.log(`  Positions: ${positions.join(', ')}  |  up to ${maxPages * PAGE_SIZE} per position/league`);
  console.log('══════════════════════════════════════════════════');

  const leagues = await loadLeagues();
  console.log(`\nFound ${leagues.length} leagues.\n`);

  const results = [];
  for (const league of leagues) {
    console.log(`──── ${league.leagueName} ────`);
    const leagueResult = { leagueKey: league.leagueKey, leagueName: league.leagueName, positions: {} };
    for (const pos of positions) {
      try {
        const players = await fetchFullPool(league.leagueKey, pos, maxPages);
        leagueResult.positions[pos] = players;
        console.log(`  ${pos}: ${players.length} available players fetched`);
      } catch (err) {
        console.warn(`  ${pos}: ⚠ ${err.message}`);
        leagueResult.positions[pos] = { error: err.message };
      }
      await sleep(200);
    }
    results.push(leagueResult);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(OUT_DIR, `available-pool-${ts}.json`);
  await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), positions, leagues: results }, null, 2), 'utf8');
  console.log(`\n💾 Saved -> ${outPath}`);
}

main().catch(err => {
  console.error('\n✖ Failed:', err.message);
  process.exitCode = 1;
});
