/**
 * find-waiver-targets.mjs
 *
 * Scans the open free-agent / waiver pool (Yahoo status=A: free agents + waivers
 * combined) for every league on the authenticated Yahoo account, at the skill
 * positions you actually have bench holes at (RB/WR/TE by default -- edit
 * POSITIONS below to widen it).
 *
 * Reuses the exact ownership/auth path already proven working in
 * sync-yahoo-fantasy.mjs's kicker-availability check (agents/lib/yahoo.js's
 * yget()), just generalized from "check these specific player_keys" to
 * "search the open pool by position, sorted by overall rank."
 *
 * Reads league keys from the local yahoo-live-rosters.json snapshot instead of
 * re-discovering them via API -- one fewer network round trip, and it's already
 * the trusted source for "which leagues am I in."
 *
 * Usage:
 *   node scripts/find-waiver-targets.mjs
 *   node scripts/find-waiver-targets.mjs --positions RB,WR,TE,QB
 *   node scripts/find-waiver-targets.mjs --count 20
 *
 * Emits:
 *   Console table per league/position, plus a snapshot at
 *   data/fantasy/waiver-targets-<timestamp>.json
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

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    positions: get('--positions', 'RB,WR,TE').split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
    count: Number(get('--count', '15')),
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loadLeagues() {
  const raw = await readFile(ROSTERS_PATH, 'utf8');
  const data = JSON.parse(raw);
  // De-dupe by leagueKey (yahoo-live-rosters.json is one entry per team, which is
  // one per league since you have one team per league).
  const seen = new Map();
  for (const lg of data.leagues || []) {
    if (!seen.has(lg.leagueKey)) seen.set(lg.leagueKey, { leagueKey: lg.leagueKey, leagueName: lg.leagueName });
  }
  return [...seen.values()];
}

// Pull the flat field set for every <player> node in a players collection response.
function extractPlayers(resp) {
  const nodes = findAll(resp?.fantasy_content ?? resp, 'player');
  return nodes.map(node => {
    const flat = deepCollect(node);

    // percent_owned and ownership come back as their own nested sub-resource nodes
    // (requested via ;out=ownership,percent_owned below) -- deepCollect(node) recurses
    // into them rather than exposing flat.percent_owned/flat.ownership as scalars, so
    // pull each sub-resource's own fields from its own subtree instead.
    const percentOwnedNode = findAll(node, 'percent_owned')[0];
    const percentOwnedFlat = percentOwnedNode ? deepCollect(percentOwnedNode) : {};
    const ownershipNode = findAll(node, 'ownership')[0];
    const ownershipFlat = ownershipNode ? deepCollect(ownershipNode) : {};

    return {
      playerKey: flat.player_key || null,
      name: flat.name || flat.full || null,
      position: flat.display_position || flat.primary_position || null,
      nflTeam: (flat.editorial_team_abbr || '').toUpperCase() || null,
      status: flat.status || null, // injury designation, e.g. 'Q', 'O' -- blank if healthy
      percentOwned: percentOwnedFlat.value != null ? Number(percentOwnedFlat.value) : null,
      ownershipType: ownershipFlat.ownership_type || null, // 'freeagents' | 'waivers'
    };
  }).filter(p => p.name); // drop any malformed/empty nodes
}

async function fetchAvailablePlayers(leagueKey, position, count) {
  // status=A -> all available (free agents + waivers combined); sort=OR -> overall rank.
  // out=ownership,percent_owned -> pull each player's ownership-type + percent-owned
  // sub-resources (Yahoo omits both from the base players response otherwise; see the
  // parsing note in extractPlayers() above).
  const query = `league/${leagueKey}/players;position=${position};status=A;sort=OR;count=${count};out=ownership,percent_owned`;
  const resp = await yget(query);
  return extractPlayers(resp);
}

async function main() {
  const { positions, count } = parseArgs();
  console.log('══════════════════════════════════════════════════');
  console.log('  Waiver Wire Scan — Open Free Agents / Waivers');
  console.log(`  Positions: ${positions.join(', ')}  |  Top ${count} per position`);
  console.log('══════════════════════════════════════════════════');

  const leagues = await loadLeagues();
  if (leagues.length === 0) {
    console.error(`No leagues found in ${ROSTERS_PATH} -- run sync-yahoo-fantasy.mjs first.`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nFound ${leagues.length} leagues: ${leagues.map(l => l.leagueName).join(', ')}\n`);

  const results = [];
  for (const league of leagues) {
    console.log(`\n──── ${league.leagueName} (${league.leagueKey}) ────`);
    const leagueResult = { leagueKey: league.leagueKey, leagueName: league.leagueName, positions: {} };

    for (const pos of positions) {
      try {
        const players = await fetchAvailablePlayers(league.leagueKey, pos, count);
        leagueResult.positions[pos] = players;
        if (players.length === 0) {
          console.log(`  ${pos}: (no available players returned -- pool may be thin, or check query syntax)`);
        } else {
          console.log(`  ${pos} — top ${players.length} available:`);
          for (const p of players) {
            const own = p.percentOwned != null ? `${p.percentOwned.toFixed(0)}% owned` : 'own% n/a';
            const inj = p.status ? ` [${p.status}]` : '';
            const type = p.ownershipType === 'waivers' ? '(waivers)' : '(FA)';
            console.log(`    ${p.name.padEnd(24)} ${p.nflTeam || '--'} ${type.padEnd(10)} ${own}${inj}`);
          }
        }
      } catch (err) {
        console.warn(`  ${pos}: ⚠ fetch failed — ${err.message}`);
        leagueResult.positions[pos] = { error: err.message };
      }
      await sleep(250); // light pacing between calls, not strictly required but polite to the API
    }

    results.push(leagueResult);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(OUT_DIR, `waiver-targets-${ts}.json`);
  await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), positions, count, leagues: results }, null, 2), 'utf8');
  console.log(`\n💾 Saved snapshot -> ${outPath}`);
}

main().catch(err => {
  console.error('\n✖ Waiver scan failed:', err.message);
  process.exitCode = 1;
});
